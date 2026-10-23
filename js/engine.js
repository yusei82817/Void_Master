import { createInitialState } from './state.js';
import { WorldSystem } from './world.js';
import { BattleSystem } from './battle.js';
import { SaveSystem } from './save.js';
import { GameUI } from './ui.js';
import { useItem } from './inventory.js';

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
    this.document.addEventListener('keydown', this.boundKeyHandler);
    this.document.addEventListener('click', this.boundCommandHandler);
    this.render();
    return this;
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
    this.render();
  }

  interact() {
    const result = this.world.interact(this.state);
    if (result.encounter) this.battle.start(this.state, result.encounter);
    else this.state.message = { name: result.relic ? 'DISCOVERY' : 'EXPLORE', text: result.message, status: '探索中' };
    this.render();
  }

  battleAction(actionSpec) {
    const [action, itemId] = actionSpec.split(':');
    const result = this.battle.act(this.state, action, itemId || null);
    if (result.message) {
      this.state.message = {
        name: result.status === '戦闘中' ? 'BATTLE' : 'RESULT',
        text: result.message,
        status: result.status || (this.state.battle ? '戦闘中' : '探索中')
      };
    }
    if (this.state.player.hp <= 0) {
      this.state.player.hp = 1;
      const area = this.world.getWorld(this.state);
      this.state.player.x = area.start?.x ?? 3;
      this.state.player.y = area.start?.y ?? 3;
      this.state.message.text += ' 近くの安全な場所まで退避した。';
      this.state.message.status = '探索中';
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
    this.setMessage(result.ok ? 'ITEM' : 'SYSTEM', result.message);
    this.ui.showInventory(this.state, false);
  }

  saveGame() {
    const result = this.save.save(this.state);
    this.setMessage(result.ok ? 'SAVE' : 'ERROR', result.message);
  }

  loadGame() {
    const result = this.save.load();
    if (!result.ok) {
      this.setMessage('LOAD', result.message);
      return;
    }
    this.state = result.state;
    this.world.world = this.world.getWorld(this.state);
    this.state.message = { name: 'LOAD', text: result.message, status: '探索中' };
    this.ui.closeDialog();
    this.render();
  }

  dialogAction(action) {
    if (action === 'reset') {
      this.state = createInitialState();
      this.world.world = this.world.getWorld(this.state);
      this.ui.closeDialog();
      this.setMessage('SYSTEM', '新しい冒険を始めた。');
    }
  }
}
