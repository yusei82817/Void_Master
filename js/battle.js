import { ENEMIES } from './data.js';
import { useItem, getEffectiveStats } from './inventory.js';
import { applyAssistantTechnique } from './assistant-combat.js';

const GHOST_RULE_PHASES = [
  { id: 'galizer', name: 'ガリザー・アメリー', kind: 'crustacean', maxHp: 42, attack: 5, defense: 2, line: 'いくぞ！ これでたたっ斬る！' },
  { id: 'rakou', name: 'ラーコウ', kind: 'turtle', maxHp: 48, attack: 8, defense: 4, line: '長く生きた分、一撃に込めている。' },
  { id: 'pande', name: 'パンデ・二イカ', kind: 'squid', maxHp: 40, attack: 5, defense: 2, line: 'ちょっと……邪魔しないでくれるかな。' },
  { id: 'sahada', name: 'サハーダ', kind: 'shark', maxHp: 52, attack: 9, defense: 3, line: '海の男の一撃、受けてみろ！' },
  { id: 'seaman', name: 'シープ・シーマン', kind: 'human', maxHp: 64, attack: 8, defense: 3, line: '俺の前では誰も立てない！ 退け！' }
];

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

  startGhostRule(state, stageIndex = 0) {
    const stage = GHOST_RULE_PHASES[stageIndex];
    if (!stage) return;
    state.battle = {
      mode: 'ghostRule',
      stageIndex,
      enemyId: 'ghost-rule-' + stage.id,
      enemy: { ...stage, hp: stage.maxHp },
      turn: 1,
      statusEffects: { accuracyDownTurns: 0, speedDownTurns: 0 },
      log: stage.name + 'が立ちはだかった。' + stage.line
    };
    state.message = { name: 'BATTLE', text: state.battle.log, status: '戦闘中' };
  }

  advanceGhostRule(state) {
    const battle = state.battle;
    if (!battle || battle.mode !== 'ghostRule') return;
    const nextIndex = battle.stageIndex + 1;
    if (nextIndex >= GHOST_RULE_PHASES.length) return;
    const previous = battle.enemy.name;
    const exitLines = [
      '「くっ……次、頼んだ！」',
      '「……まだまだ衰えてはいないと思ったが。後は頼む」',
      '「……手間のかかる邪魔者だ。次、任せる」',
      '「……いい男だ。守る価値がある。悔いはない」'
    ];
    const entranceLines = [
      '',
      'ラーコウ「……任せておけ」',
      'パンデ・二イカ「……面倒だな。早く終わらせて」',
      'サハーダ「君には無理だったか。次は俺が相手する」',
      'シープ・シーマン「仕方ない。俺が出る」'
    ];
    this.startGhostRule(state, nextIndex);
    state.message = {
      name: 'BATTLE',
      text: previous + exitLines[battle.stageIndex] + ' ' + entranceLines[nextIndex] + ' ' + state.battle.log,
      status: '戦闘中'
    };
  }

  actGhostRule(state, action, itemId = null) {
    const battle = state.battle;
    const player = state.player;
    const enemy = battle.enemy;
    const status = battle.statusEffects || (battle.statusEffects = { accuracyDownTurns: 0, speedDownTurns: 0 });
    let message = '';

    if (action === 'flee') return { ok: false, message: 'ゴーストルールとの連戦からは逃げられない。' };

    if (action === 'defend') {
      battle.defending = true;
      message = 'クレインは身構えた。次の攻撃ダメージを軽減する。';
    } else if (action === 'item') {
      const result = useItem(state, itemId);
      if (!result.ok) return result;
      message = result.message;
    } else if (action === 'assistant') {
      if (!state.assistantPhase1Unlocked && !state.storyEventsCompleted?.includes('S3')) {
        return { ok: false, message: 'アシスタントはS3クリア後に使用できる。' };
      }
      const techniqueResult = applyAssistantTechnique(state, 'PHASE-1', itemId);
      if (!techniqueResult.ok) return techniqueResult;
      message = techniqueResult.message;
    } else if (action === 'attack' || action === 'ripple') {
      if (action === 'ripple' && player.mp < 3) return { ok: false, message: 'MPが足りない。波紋にはMPが3必要だ。' };
      if (status.accuracyDownTurns > 0 && Math.random() < 0.3) {
        if (action === 'ripple') player.mp -= 3;
        message = '命中率ダウンの影響で、クレインの攻撃は外れた。';
      } else {
        let damage;
        if (action === 'ripple') {
          player.mp -= 3;
          damage = Math.max(2, Math.floor(getEffectiveStats(state).attack + 6 + this.roll(0, 3) - enemy.defense));
          message = '波紋を放った。' + enemy.name + 'に' + damage + 'ダメージ。';
        } else {
          damage = Math.max(1, getEffectiveStats(state).attack + this.roll(-2, 2) - enemy.defense);
          if (status.speedDownTurns > 0) damage = Math.max(1, Math.floor(damage * 0.8));
          message = 'クレインの攻撃。' + enemy.name + 'に' + damage + 'ダメージ。';
        }
        enemy.hp = Math.max(0, enemy.hp - damage);
      }
    } else {
      return { ok: false, message: '不明な戦闘コマンド。' };
    }

    // The first four opponents yield at 30%; Seaman must remain alive for his final attack.
    const finalPhase = battle.stageIndex === GHOST_RULE_PHASES.length - 1;
    if (!finalPhase && enemy.hp <= enemy.maxHp * 0.3) {
      battle.phaseTransition = true;
      return { ok: true, message: message + ' ' + enemy.name + '「……まだまだ衰えてはいないと思ったが。後は頼む」', status: '戦闘中' };
    }
    if (finalPhase && enemy.hp <= enemy.maxHp * 0.2) {
      enemy.hp = Math.max(1, enemy.hp);
      const finalResult = this.ghostRuleEnemyTurn(state, true);
      message += ' ' + finalResult.message;
      if (finalResult.victory) {
        battle.ghostRuleVictory = true;
        return { ok: true, message, status: '戦闘終了', ghostRuleVictory: true };
      }
      if (player.hp <= 0) return { ok: true, message, status: '戦闘終了' };
      battle.turn += 1;
      return { ok: true, message, status: '戦闘中' };
    }

    const enemyResult = this.ghostRuleEnemyTurn(state, false);
    message += ' ' + enemyResult.message;
    if (enemyResult.victory) {
      battle.ghostRuleVictory = true;
      return { ok: true, message, status: '戦闘終了', ghostRuleVictory: true };
    }
    if (player.hp <= 0) {
      state.battle = null;
      return { ok: true, message, status: '戦闘終了' };
    }
    if (status.accuracyDownTurns > 0) status.accuracyDownTurns -= 1;
    if (status.speedDownTurns > 0) status.speedDownTurns -= 1;
    battle.turn += 1;
    return { ok: true, message, status: '戦闘中' };
  }

  ghostRuleEnemyTurn(state, forcedFinal = false) {
    const battle = state.battle;
    const enemy = battle.enemy;
    const player = state.player;
    const status = battle.statusEffects;
    const defending = Boolean(battle.defending);
    battle.defending = false;
    let raw = 0;
    let message = '';
    const stage = battle.stageIndex;

    if (battle.enemyStunnedNext) {
      battle.enemyStunnedNext = false;
      return { message: enemy.name + 'は乱鋏旋風の反動で隙を見せ、行動できない。', victory: false };
    }

    if (stage === 0) {
      const move = this.roll(0, 2);
      if (move === 0) {
        raw = Math.max(2, enemy.attack + this.roll(-1, 1) - getEffectiveStats(state).defense);
        message = enemy.name + '「いくぞ！ これでたたっ斬る！」 両鋏挟撃。2連続攻撃。';
        let total = 0;
        for (let i = 0; i < 2 && player.hp > 0; i += 1) {
          const d = Math.max(1, Math.floor(raw * (defending ? 0.5 : 1)));
          player.hp = Math.max(0, player.hp - d); total += d;
        }
        message += ' 合計' + total + 'ダメージ。';
        return { message, victory: false };
      } else if (move === 1) {
        raw = Math.max(3, enemy.attack + 3 - getEffectiveStats(state).defense);
        message = enemy.name + '「まっすぐ行くぜ！ どけー！」 甲羅突進。';
      } else {
        raw = Math.max(3, enemy.attack + 1 - getEffectiveStats(state).defense);
        message = enemy.name + '「これで一網打尽だ！ 喰らえー！」 乱鋏旋風。次のターン、敵は隙を見せる。';
        battle.enemyStunnedNext = true;
      }
    } else if (stage === 1) {
      const move = this.roll(0, 2);
      if (move === 0) {
        raw = Math.max(2, enemy.attack - getEffectiveStats(state).defense);
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + 2);
        message = enemy.name + '「すまないね……痛くしないように済ませたいんだが」 甲羅弾き。敵HPが2回復。';
      } else if (move === 1) {
        raw = Math.max(5, enemy.attack + 4 - getEffectiveStats(state).defense);
        message = enemy.name + '「長く生きた分、一撃に込めている」 老獪の一撃。';
      } else {
        raw = Math.max(7, enemy.attack + 7 - getEffectiveStats(state).defense);
        message = enemy.name + '「……申し訳ない。これが最後だ」 渦殻砕き。防御を一部貫通する。';
        if (defending) raw = Math.max(4, Math.floor(raw * 0.75));
      }
    } else if (stage === 2) {
      const move = this.roll(0, 2);
      if (move === 0) {
        status.accuracyDownTurns = Math.max(status.accuracyDownTurns, 3);
        message = enemy.name + '「ちょっと……邪魔しないでくれるかな」 墨纏いの歩み。命中率ダウン（3ターン）。パンデはリーナへ接近した。';
        raw = Math.max(1, enemy.attack - getEffectiveStats(state).defense);
      } else if (move === 1) {
        status.speedDownTurns = Math.max(status.speedDownTurns, 2);
        message = enemy.name + '「君はそこにいて。主役は別にいるんだ」 触手の誘い。速度低下（2ターン）。';
        raw = 1;
      } else {
        raw = Math.max(2, Math.floor((enemy.attack + 2 - getEffectiveStats(state).defense) * 0.6));
        message = enemy.name + '「退屈だから、さっさとどいてくれない？」 紫刃・誘い裂き。手加減されている。';
      }
    } else if (stage === 3) {
      const lowHpBonus = player.hp <= player.maxHp * 0.3 ? 5 : player.hp <= player.maxHp * 0.6 ? 2 : 0;
      const move = this.roll(0, 2);
      if (move === 0) {
        raw = Math.max(4, enemy.attack + 2 + lowHpBonus - getEffectiveStats(state).defense);
        message = enemy.name + '「海の男の一撃、受けてみろ！」 波裂く牙。';
      } else if (move === 1) {
        raw = Math.max(6, enemy.attack + 5 + lowHpBonus - getEffectiveStats(state).defense);
        message = enemy.name + '「昔、海軍の船を真っ二つにした技だ！」 深海からの一撃。';
      } else {
        raw = Math.max(8, enemy.attack + 7 + lowHpBonus - getEffectiveStats(state).defense);
        message = enemy.name + '「これが俺の全力だ！ 耐えてみせろ！」 鮫王の片手斬。';
      }
    } else {
      if (forcedFinal || (enemy.hp <= enemy.maxHp * 0.2 && !battle.finalMoveUsed)) {
        battle.finalMoveUsed = true;
        raw = Math.max(1, Math.floor(player.maxHp * 0.65));
        if (defending) raw = Math.max(1, Math.floor(raw * 0.5));
        message = enemy.name + '「俺が父親だ！ 俺が正しい！ 従え！」 歪んだ絆。渾身の一撃、' + raw + 'ダメージ。' + (defending ? '（防御で軽減）' : '');
        player.hp = Math.max(0, player.hp - raw);
        if (player.hp > 0) {
          return { message: message + ' クレインは最後の一撃を耐え抜いた。シープ・シーマンは膝をついた。「……なぜだ。力が全てじゃないのか……？」 リオーネ「父さん……」', victory: true };
        }
        return { message: message + ' クレインは倒れた。', victory: false };
      }
      const move = this.roll(0, 2);
      if (move === 0) {
        raw = Math.max(2, enemy.attack + this.roll(-1, 2) - getEffectiveStats(state).defense);
        const d = Math.max(1, Math.floor(raw * (defending ? 0.5 : 1)));
        player.hp = Math.max(0, player.hp - d);
        const d2 = Math.max(1, Math.floor((raw + 1) * (defending ? 0.5 : 1)));
        if (player.hp > 0) player.hp = Math.max(0, player.hp - d2);
        const d3 = Math.max(1, Math.floor((raw + 2) * (defending ? 0.5 : 1)));
        if (player.hp > 0) player.hp = Math.max(0, player.hp - d3);
        return { message: enemy.name + '「俺の前では誰も立てない！ 退け！」 短刀連閃。3連続攻撃。', victory: false };
      } else if (move === 1) {
        raw = Math.max(3, enemy.attack + 3 - getEffectiveStats(state).defense);
        battle.attackBoostTurns = 2;
        message = enemy.name + '「核の欠片を手に入れた者が頂点に立つ！ それが真実だ！」 覇道の信念。攻撃力アップ（2ターン）。';
      } else {
        raw = Math.max(4, enemy.attack + 5 - getEffectiveStats(state).defense);
        message = enemy.name + '「リオーネも……世界も……全部俺のものだ！」 我が物支配。リオーネを引き寄せようとしている。';
      }
    }

    if (raw > 0) {
      let damage = raw;
      if (defending && !(stage === 1 && message.includes('渦殻砕き'))) damage = Math.max(1, Math.floor(raw / 2));
      if (stage === 4 && battle.attackBoostTurns > 0) damage += 2;
      player.hp = Math.max(0, player.hp - damage);
      message += ' クレインは' + damage + 'ダメージを受けた。' + (defending ? '（防御で軽減）' : '');
    }
    if (battle.attackBoostTurns > 0) battle.attackBoostTurns -= 1;
    return { message, victory: false };
  }

  act(state, action, itemId = null) {
    if (!state.battle) return { ok: false, message: '戦闘中ではない。' };
    if (state.battle.mode === 'ghostRule') return this.actGhostRule(state, action, itemId);
    const battle = state.battle;
    const player = state.player;
    const enemy = battle.enemy;

    if (action === 'defend') {
      battle.defending = true;
      const enemyMessage = this.enemyTurn(state);
      if (state.battle) battle.turn += 1;
      return {
        ok: true,
        message: '身構えて防御態勢を取った。' + (enemyMessage ? ' ' + enemyMessage : ''),
        status: state.battle ? '戦闘中' : '戦闘終了'
      };
    }

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
        player.gold += enemy.gold * (battle.goldRewardMultiplier || 1);
        message += ' ' + enemy.name + 'を倒した。EXP +' + enemy.exp + '、G +' + (enemy.gold * (battle.goldRewardMultiplier || 1)) + '。';
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
        const damage = Math.max(1, getEffectiveStats(state).attack + this.roll(-2, 2) - enemy.defense);
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
        const damage = Math.max(2, Math.floor((getEffectiveStats(state).attack + 6 + this.roll(0, 3) - enemy.defense) * multiplier));
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
      state.monsterKills = state.monsterKills && typeof state.monsterKills === 'object' ? state.monsterKills : {};
      state.monsterKills[enemy.id] = (Number(state.monsterKills[enemy.id]) || 0) + 1;
      if (state.rottenFleshBattles > 0) {
        state.rottenFleshBattles -= 1;
        if (state.rottenFleshBattles <= 0) {
          state.inventory = state.inventory.filter((entry) => entry.itemId !== 'rottenFlesh');
          message += ' 餓鬼の腐肉の効果が切れた。';
        }
      }
      if (enemy.drop && Math.random() < enemy.drop.chance) {
        const dropped = enemy.drop.itemId;
        const itemName = dropped === 'oldAxe' ? '古びた斧' : dropped === 'rottenFlesh' ? '餓鬼の腐肉' : dropped;
        const existing = state.inventory.find((entry) => entry.itemId === dropped);
        if (existing) existing.quantity += 1;
        else state.inventory.push({ itemId: dropped, quantity: 1 });
        if (dropped === 'rottenFlesh') state.rottenFleshBattles = 3;
        message += ' ' + itemName + 'を入手した。';
      }
      player.exp += enemy.exp;
      player.gold += enemy.gold * (battle.goldRewardMultiplier || 1);
      message += ' ' + enemy.name + 'を倒した。EXP +' + enemy.exp + '、G +' + (enemy.gold * (battle.goldRewardMultiplier || 1)) + '。';
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
    const defending = Boolean(battle.defending);
    battle.defending = false;
    const hadCaltrops = Boolean(battle.caltropsActive);

    if (enemy.spikeChance && Math.random() < enemy.spikeChance && !battle.caltropsActive) {
      battle.caltropsActive = true;
      const damage = 2;
      player.hp = Math.max(0, player.hp - damage);
      messages.push(enemy.name + 'はマキビシを投げた！ 設置時に' + damage + 'ダメージ。以後、この戦闘中はターンごとに2ダメージを受ける。');
    } else {
      const hits = enemy.doubleAttackChance && Math.random() < enemy.doubleAttackChance ? 2 : 1;
      for (let hit = 0; hit < hits && player.hp > 0; hit += 1) {
        const rawDamage = Math.max(1, enemy.attack + this.roll(-1, 2) - getEffectiveStats(state).defense);
        const damage = defending ? Math.max(1, Math.floor(rawDamage / 2)) : rawDamage;
        player.hp = Math.max(0, player.hp - damage);
        messages.push(enemy.name + (hits === 2 ? 'の連続攻撃' : 'の反撃') + '。' + damage + 'ダメージを受けた。' + (defending ? '（防御でダメージ半減）' : ''));
      }
    }

    if (player.hp > 0 && hadCaltrops) {
      player.hp = Math.max(0, player.hp - 2);
      messages.push('マキビシを踏んだ。2ダメージを受けた。');
    }

    if (player.hp <= 0) {
      state.battle = null;
      return messages.join(' ') + ' ' + enemy.name + 'の攻撃で倒れた。';
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
