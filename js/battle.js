import { ENEMIES } from './data.js';
import { useItem } from './inventory.js';
import { applyAssistantTechnique } from './assistant-combat.js';

export class BattleSystem {
  start(state, enemyRecord) {
    const template = ENEMIES[enemyRecord.templateId] || ENEMIES.hollowBeast;
    state.battle = {
      enemyId: enemyRecord.id,
      enemy: { ...template, hp: template.maxHp },
      turn: 1,
      log: template.name + 'が立ちはだかった。'
    };
    state.message = { name: 'BATTLE', text: state.battle.log, status: '戦闘中' };
  }

  act(state, action, itemId = null) {
    if (!state.battle) return { ok: false, message: '戦闘中ではない。' };
    const battle = state.battle;
    const player = state.player;
    const enemy = battle.enemy;

    if (action === 'flee') {
      const chance = Math.random();
      if (chance < 0.65) {
        state.battle = null;
        return { ok: true, message: 'うまく距離を取った。戦闘から離脱した。', status: '探索中' };
      }
      const reply = this.enemyTurn(state);
      return { ok: true, message: '逃げ道をふさがれた。' + reply, status: state.battle ? '戦闘中' : '戦闘終了' };
    }

    if (action === 'assistant') {
      if (!state.assistantPhase1Unlocked && !state.storyEventsCompleted?.includes('S3')) {
        return { ok: false, message: 'アシスタントはS3クリア後に使用できる。' };
      }
      const techniqueResult = applyAssistantTechnique(state, 'PHASE-1', itemId);
      if (!techniqueResult.ok) return techniqueResult;
      let message = techniqueResult.message;
      if (enemy.hp <= 0 || techniqueResult.enemyDefeated) {
        const record = state.enemies.find((entry) => entry.id === battle.enemyId);
        if (record) record.defeated = true;
        player.exp += enemy.exp;
        player.gold += enemy.gold;
        message += ' ' + enemy.name + 'を倒した。EXP +' + enemy.exp + '、G +' + enemy.gold + '。';
        state.battle = null;
        const levelMessage = this.checkLevelUp(state);
        if (levelMessage) message += ' ' + levelMessage;
        return { ok: true, message, status: '探索中' };
      }
      const enemyMessage = this.enemyTurn(state);
      if (state.battle) battle.turn += 1;
      return { ok: true, message: message + ' ' + enemyMessage, status: state.battle ? '戦闘中' : '戦闘終了' };
    }

    let message = '';
    if (action === 'attack') {
      if (enemy.normalAttackImmune) {
        message = player.name + 'の通常攻撃は' + enemy.name + 'に通用しない。';
      } else {
        const damage = Math.max(1, player.attack + this.roll(-2, 2) - enemy.defense);
        enemy.hp = Math.max(0, enemy.hp - damage);
        message = player.name + 'の攻撃。' + enemy.name + 'に' + damage + 'ダメージ。';
      }
    } else if (action === 'ripple') {
      if (enemy.rippleImmune) {
        message = enemy.name + 'には波紋が通用しない。';
      } else {
        if (player.mp < 3) return { ok: false, message: 'MPが足りない。波紋にはMPが3必要だ。' };
        player.mp -= 3;
        const multiplier = enemy.kind === 'oni' ? 1.8 : 1;
        const damage = Math.max(2, Math.floor((player.attack + 6 + this.roll(0, 3) - enemy.defense) * multiplier));
        enemy.hp = Math.max(0, enemy.hp - damage);
        message = '波紋を放った。' + enemy.name + 'に' + damage + 'ダメージ。';
        if (enemy.kind === 'oni') message += ' 鬼族に強く作用した！';
      }
    } else if (action === 'item') {
      const result = useItem(state, itemId);
      if (!result.ok) return result;
      message = result.message;
    } else {
      return { ok: false, message: '不明な戦闘コマンド。' };
    }

    if (enemy.hp <= 0) {
      const record = state.enemies.find((entry) => entry.id === battle.enemyId);
      if (record) record.defeated = true;
      player.exp += enemy.exp;
      player.gold += enemy.gold;
      message += ' ' + enemy.name + 'を倒した。EXP +' + enemy.exp + '、G +' + enemy.gold + '。';
      state.battle = null;
      const levelMessage = this.checkLevelUp(state);
      if (levelMessage) message += ' ' + levelMessage;
      return { ok: true, message, status: '探索中' };
    }

    const enemyMessage = this.enemyTurn(state);
    if (state.battle) battle.turn += 1;
    return { ok: true, message: message + ' ' + enemyMessage, status: state.battle ? '戦闘中' : '戦闘終了' };
  }

  enemyTurn(state) {
    const battle = state.battle;
    if (!battle) return '';
    const player = state.player;
    const enemy = battle.enemy;
    const messages = [];

    if (enemy.spikeChance && Math.random() < enemy.spikeChance && !battle.caltropsActive) {
      battle.caltropsActive = true;
      const damage = 2;
      player.hp = Math.max(0, player.hp - damage);
      messages.push(enemy.name + 'はマキビシを投げた！ 足元に散らばり、踏むたびにターンごとに2ダメージを受ける。設置時にも' + damage + 'ダメージ。');
    } else {
      const hits = enemy.doubleAttackChance && Math.random() < enemy.doubleAttackChance ? 2 : 1;
      for (let hit = 0; hit < hits && player.hp > 0; hit += 1) {
        const damage = Math.max(1, enemy.attack + this.roll(-1, 2) - player.defense);
        player.hp = Math.max(0, player.hp - damage);
        messages.push(enemy.name + (hits === 2 ? 'の連続攻撃' : 'の反撃') + '。' + damage + 'ダメージを受けた。');
      }
    }

    if (player.hp > 0 && battle.caltropsActive && !enemy.spikeChance) {
      player.hp = Math.max(0, player.hp - 2);
      messages.push('マキビシを踏んだ。2ダメージを受けた。');
    } else if (player.hp > 0 && battle.caltropsActive && enemy.spikeChance && messages[0]?.startsWith(enemy.name + 'のマキビシ')) {
      // The turn the spikes are thrown already dealt their initial damage; ongoing damage starts next turn.
      battle.caltropsJustThrown = true;
    } else if (battle.caltropsActive && battle.caltropsJustThrown) {
      battle.caltropsJustThrown = false;
    } else if (player.hp > 0 && battle.caltropsActive && !messages[0]?.includes('マキビシ')) {
      player.hp = Math.max(0, player.hp - 2);
      messages.push('マキビシを踏んだ。2ダメージを受けた。');
    }

    if (player.hp <= 0) {
      state.battle = null;
      return messages.join(' ') + ' ' + enemy.name + 'の攻撃で意識を失った。HPは1に戻り、開始地点へ退避した。';
    }
    return messages.join(' ');
  }

  checkLevelUp(state) {
    const player = state.player;
    const levels = [];
    while (player.exp >= player.nextExp) {
      player.exp -= player.nextExp;
      player.level += 1;
      player.nextExp = Math.floor(player.nextExp * 1.5);
      player.maxHp += 6;
      player.maxMp += 2;
      player.attack += 2;
      player.defense += 1;
      player.hp = player.maxHp;
      player.mp = player.maxMp;
      levels.push('レベルが' + player.level + 'になった。HPとMPが全回復した。');
    }
    return levels.join(' ');
  }

  roll(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
