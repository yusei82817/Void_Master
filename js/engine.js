import { createInitialState, normalizeState } from './state.js';
import { WorldSystem } from './world.js';
import { BattleSystem } from './battle.js';
import { SaveSystem } from './save.js';
import { GameUI } from './ui.js';
import { useItem } from './inventory.js';
import { playSE, playRandomVoice } from './audio.js';
import { setBackgroundMusic } from './bgm.js';

const LOKI_GAUNTLET = [
  { templateId: 'oniScout', count: 3, label: '鬼' },
  { templateId: 'lokiLaura', count: 1, label: 'ローラ' },
  { templateId: 'hollowBeast', count: 2, label: '虚ろな獣' },
  { templateId: 'lokiRosa', count: 1, label: 'ローザ' },
  { templateId: 'oniScout', count: 2, label: '鬼' },
  { templateId: 'lokiGilMash', count: 1, label: 'ギル・マッシュ' },
  { templateId: 'oniScout', count: 3, label: '鬼' },
  { templateId: 'lokiRoadman', count: 1, label: 'ロードマン' }
];

export class GameEngine {
  constructor(documentRef = document, systems = {}) {
    this.document = documentRef;
    // game_script.js assembles these modules and passes them into the engine.
    this.world = systems.world || new WorldSystem();
    this.battle = systems.battle || new BattleSystem();
    this.save = systems.save || new SaveSystem();
    this.ui = systems.ui || new GameUI(documentRef);
    this.state = systems.state || createInitialState();
    this.boundKeyHandler = (event) => this.handleKey(event);
    this.boundCommandHandler = (event) => this.handleCommand(event);
    this.ui.onBattleAction = (action) => this.battleAction(action);
    this.ui.onItemUse = (itemId) => this.useItem(itemId);
    this.ui.onDialogAction = (action) => this.dialogAction(action);
  }

  start() {
    // Restore the exact exploration state after a story page returns.
    try {
      const handoff = sessionStorage.getItem('voidMasterStoryHandoff');
      if (handoff) {
        sessionStorage.removeItem('voidMasterStoryHandoff');
        const restored = JSON.parse(handoff);
        if (restored && restored.state) {
          this.state = normalizeState(restored.state);
          this.world.world = this.world.getWorld(this.state);
        }
      }
    } catch (error) {
      console.error('Story handoff restore failed:', error);
    }
    if (this.state.storyEventsCompleted?.includes('S3')) {
      if (!this.state.lokiGauntlet) {
        this.state.lokiGauntlet = { active: true, completed: false, stage: 0, remaining: LOKI_GAUNTLET[0].count };
      }
      if (this.state.lokiGauntlet.active && !this.state.battle) {
        this.startLokiEncounter();
        this.save.saveAuto(this.state);
      }
    }
    setBackgroundMusic(this.state.areaId, this.document);
    this.document.addEventListener('keydown', this.boundKeyHandler);
    this.document.addEventListener('click', this.boundCommandHandler);
    this.render();
    return this;
  }

  startLokiEncounter() {
    const gauntlet = this.state.lokiGauntlet;
    if (!gauntlet?.active) return;
    const stage = LOKI_GAUNTLET[gauntlet.stage];
    if (!stage) {
      gauntlet.active = false;
      gauntlet.completed = true;
      this.state.message = { name: 'RESULT', text: '盗賊団ロキとの連戦を制した。', status: '探索中' };
      return;
    }
    this.battle.start(this.state, {
      id: 'loki-gauntlet-' + gauntlet.stage + '-' + gauntlet.remaining + '-' + this.state.steps,
      templateId: stage.templateId,
      temporary: true
    });
  }

  advanceLokiGauntlet(defeatedEnemy) {
    const gauntlet = this.state.lokiGauntlet;
    if (!gauntlet?.active) return;
    const currentStage = LOKI_GAUNTLET[gauntlet.stage];
    if (gauntlet.remaining > 1) {
      gauntlet.remaining -= 1;
      this.startLokiEncounter();
      this.state.message.text = defeatedEnemy.name + 'を倒した。残り' + gauntlet.remaining + '体。' + this.state.message.text;
      return;
    }

    gauntlet.stage += 1;
    const nextStage = LOKI_GAUNTLET[gauntlet.stage];
    if (!nextStage) {
      gauntlet.active = false;
      gauntlet.completed = true;
      this.state.message = {
        name: 'RESULT',
        text: defeatedEnemy.name + 'を倒した。盗賊団ロキとの連戦を制した！',
        status: '探索中'
      };
      return;
    }

    gauntlet.remaining = nextStage.count;
    this.startLokiEncounter();
    this.state.message.text = defeatedEnemy.name + 'を倒した。続いて' + nextStage.label + 'が現れた。' + this.state.message.text;
  }

  destroy() {
    this.document.removeEventListener('keydown', this.boundKeyHandler);
    this.document.removeEventListener('click', this.boundCommandHandler);
  }

  render() {
    this.ui.render(this.state, this.world);
  }

  setMessage(name, text, status = this.state.battle ? '戦闘中' : '探索中') {
    this.state.message = { name, text, status };
    this.render();
  }

  handleKey(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (this.ui.dialog?.open) {
      if (event.key === 'Escape') return;
      return;
    }
    const key = event.key.toLowerCase();
    const moves = {
      arrowup: [0, -1], w: [0, -1],
      arrowdown: [0, 1], s: [0, 1],
      arrowleft: [-1, 0], a: [-1, 0],
      arrowright: [1, 0], d: [1, 0]
    };
    if (moves[key]) {
      event.preventDefault();
      if (!this.state.battle) this.move(...moves[key]);
      return;
    }
    if (key === 'e' || key === 'enter') {
      if (!this.state.battle) {
        event.preventDefault();
        this.interact();
      }
    }
  }

  handleCommand(event) {
    const button = event.target.closest('[data-command], [data-move]');
    if (!button) return;
    if (button.dataset.move) {
      const directions = {
        up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0]
      };
      const delta = directions[button.dataset.move];
      if (delta) this.move(...delta);
      return;
    }
    switch (button.dataset.command) {
      case 'explore': this.interact(); break;
      case 'status': this.ui.showStatus(this.state); break;
      case 'items': this.ui.showInventory(this.state, Boolean(this.state.battle)); break;
      case 'save': this.saveGame(); break;
      case 'load': this.loadGame(); break;
      case 'settings': this.ui.showSettings(); break;
    }
  }

  move(dx, dy) {
    const previousAreaId = this.state.areaId;
    const previousSteps = this.state.steps;
    const result = this.world.move(this.state, dx, dy);
    if (!result.ok) {
      this.setMessage('FIELD', result.message);
      return;
    }
    if (result.encounter) {
      this.battle.start(this.state, result.encounter);
    } else {
      this.state.message = {
        name: result.travel ? 'TRAVEL' : (result.relic ? 'DISCOVERY' : 'FIELD'),
        text: result.message || this.world.getWorld(this.state).description,
        status: '探索中'
      };
    }
    if (result.travel && previousAreaId === 'port' && this.state.areaId === 'sea') {
      playSE('shipLaunch');
    }
    if (this.state.areaId !== previousAreaId) {
      setBackgroundMusic(this.state.areaId, this.document);
    }
    const movedSteps = this.state.steps - previousSteps;
    if (result.travel || result.relic || (movedSteps > 0 && this.state.steps % 10 === 0) || this.state.areaId !== previousAreaId) {
      this.save.saveAuto(this.state);
    }
    // S1 begins automatically on the first entry into the Deep Green Forest.
    let storyEventToStart = null;
    if (result.travel && this.state.areaId === 'forest' &&
        !this.state.storyEventsCompleted?.includes('S1')) {
      storyEventToStart = 'S1';
    } else if (result.travel && this.state.areaId === 'cave' &&
        this.state.storyEventsCompleted?.includes('S1') &&
        !this.state.storyEventsCompleted?.includes('S2')) {
      storyEventToStart = 'S2';
    } else if (result.travel && this.state.areaId === 'volcano' &&
        this.state.storyEventsCompleted?.includes('S2') &&
        !this.state.storyEventsCompleted?.includes('S3')) {
      storyEventToStart = 'S3';
    } else if (!result.encounter && !result.travel && this.state.areaId === 'sea' &&
        this.state.storyEventsCompleted?.includes('S3') &&
        !this.state.storyEventsCompleted?.includes('S4') &&
        Math.abs(this.state.player.x - this.world.getWorld(this.state).exits.B.x) +
          Math.abs(this.state.player.y - this.world.getWorld(this.state).exits.B.y) === 3) {
      storyEventToStart = 'S4';
    } else if (result.travel && previousAreaId === 'sea' && this.state.areaId === 'port' &&
        this.state.storyEventsCompleted?.includes('S4') &&
        !this.state.storyEventsCompleted?.includes('S5')) {
      storyEventToStart = 'S5';
    }
    if (storyEventToStart) {
      try {
        sessionStorage.setItem('voidMasterStoryHandoff', JSON.stringify({ state: this.state }));
      } catch (error) {
        console.error('Story handoff save failed:', error);
      }
      window.location.href = 'story.html?event=' + storyEventToStart;
      return;
    }
    this.render();
  }

  interact() {
    const result = this.world.interact(this.state);
    if (result.encounter) this.battle.start(this.state, result.encounter);
    else this.state.message = { name: result.relic ? 'DISCOVERY' : 'EXPLORE', text: result.message, status: '探索中' };
    if (result.relic) this.save.saveAuto(this.state);
    this.render();
  }

  battleAction(actionSpec) {
    const wasInBattle = Boolean(this.state.battle);
    const enemyAtActionStart = this.state.battle?.enemy || null;
    const [action, itemId] = actionSpec.split(':');
    const result = this.battle.act(this.state, action, itemId || null);
    if (result.ok && action === 'attack') {
      playSE('attack');
      playRandomVoice('normalAttack');
    }
    if (result.ok && action === 'ripple' && !this.state.rippleVoicePlayed) {
      playSE('rippleFirstUse');
      this.state.rippleVoicePlayed = true;
      this.save.saveAuto(this.state);
    }
    if (result.ok && action === 'item' && itemId === 'ether') playSE('mpRestore');
    if (result.message) {
      this.state.message = {
        name: result.status === '戦闘中' ? 'BATTLE' : 'RESULT',
        text: result.message,
        status: result.status || (this.state.battle ? '戦闘中' : '探索中')
      };
    }
    if (this.state.player.hp <= 0) {
      // HPが0になったら復活処理は行わず、ゲームオーバー画面へ遷移する。
      this.state.battle = null;
      window.location.href = 'GameOver.html';
      return;
    }
    if (wasInBattle && enemyAtActionStart?.hp <= 0) {
      this.advanceLokiGauntlet(enemyAtActionStart);
      this.save.saveAuto(this.state);
    } else if (wasInBattle && !this.state.battle) {
      this.save.saveAuto(this.state);
    }
    this.render();
  }

  useItem(itemId) {
    if (this.state.battle) {
      this.ui.closeDialog();
      this.battleAction('item', itemId);
      return;
    }
    // Outside battle, item use is a free action.
    const result = useItem(this.state, itemId);
    if (result.ok && itemId === 'ether') playSE('mpRestore');
    this.setMessage(result.ok ? 'ITEM' : 'SYSTEM', result.message);
    this.ui.showInventory(this.state, false);
  }

  saveGame() {
    this.ui.showSaveMenu(this.save, 'save');
  }

  loadGame() {
    this.ui.showSaveMenu(this.save, 'load');
  }

  saveStoryCheckpoint(eventId, eventData = {}) {
    return this.save.saveStory(this.state, eventId, eventData);
  }

  performSave(type, slot = 1) {
    const result = type === 'manual'
      ? this.save.saveManual(this.state, slot)
      : type === 'story'
        ? this.save.saveStory(this.state, 'manual_checkpoint')
        : this.save.saveAuto(this.state);
    this.ui.closeDialog();
    this.setMessage(result.ok ? 'SAVE' : 'ERROR', result.message);
  }

  performLoad(type, slot = 1) {
    const result = this.save.load(type, slot);
    if (!result.ok) {
      this.setMessage('LOAD', result.message);
      return;
    }
    this.state = result.state;
    this.world.world = this.world.getWorld(this.state);
    const eventId = result.record?.extra?.eventId;
    this.state.message = {
      name: 'LOAD',
      text: eventId ? 'ストーリーセーブを読み込んだ。イベントID: ' + eventId : result.message,
      status: '探索中'
    };
    this.ui.closeDialog();
    this.render();
  }

  dialogAction(action) {
    const parts = action.split(':');
    if (parts[0] === 'save') {
      this.performSave(parts[1], Number(parts[2] || 1));
      return;
    }
    if (parts[0] === 'load') {
      this.performLoad(parts[1], Number(parts[2] || 1));
      return;
    }
    if (action === 'reset') {
      this.state = createInitialState();
      this.world.world = this.world.getWorld(this.state);
      this.ui.closeDialog();
      this.setMessage('SYSTEM', '新しい冒険を始めた。');
    }
  }
}
