/**
 * Void Master - Assistant combat rules
 *
 * This module only defines assistant techniques, battle effects, and combat
 * messages. It deliberately does not summon an assistant, add UI commands,
 * or wire itself into BattleSystem yet.
 *
 * Battle state expected by these helpers:
 *   state.player: { hp, maxHp, attack, ... }
 *   state.battle: { enemy: { hp, maxHp, defense, kind, name, ... }, ... }
 */

export const ASSISTANT_CATALOG = Object.freeze({
  crane: Object.freeze({
    name: 'Cry of the Lost One',
    source: 'ロストワンの号哭',
    phases: Object.freeze({
      'PHASE-1': Object.freeze([
        Object.freeze({
          id: 'life-hates-me',
          name: 'life hates me',
          reading: 'ライフ・ヘイト・ミー',
          source: '命に嫌われている。',
          description: '4%の確率で敵を即死させる。'
        }),
        Object.freeze({
          id: 'delusional-sentiment-compensation-federation',
          name: 'Delusional Sentiment Compensation Federation',
          reading: 'デルージョナル・センティメント・コンペンセーション・フェデレーション',
          source: '妄想感傷代償連盟',
          description: '1ターンの間、波紋を虚系モンスターにも有効にする。'
        }),
        Object.freeze({
          id: 'nombrese-oblige',
          name: 'Nombrese Oblige',
          reading: 'ノンブレス・オブリージュ',
          source: 'ノンブレス・オブリージュ',
          description: '波紋の呼吸準備を2ターン分進める。'
        })
      ]),
      'PHASE-2': Object.freeze([
        Object.freeze({
          id: 'unknown-mother-goose',
          name: 'unknown mother goose',
          reading: 'アンノウン・マザーグース',
          source: 'アンノウン・マザーグース',
          description: '爆発までのターン数がランダムな爆弾を設置する。残り時間は表示しない。'
        }),
        Object.freeze({
          id: 'yararara',
          name: 'YARARARA',
          reading: 'ヤラララ',
          source: null,
          description: 'HPが最大HPの8%以下になったとき、1戦につき1回だけ全回復し、発動ターンの通常攻撃を1.2倍にする。波紋には適用しない。'
        }),
        Object.freeze({
          id: 'liar-macaron',
          name: 'Liar Macaron',
          reading: 'ライアー・マカロン',
          source: 'うそつきマカロン',
          description: '敵の最大HPの2%分のダメージを与え、波紋の基礎攻撃力を2%永続強化する。'
        })
      ]),
      TRANSCENDENCE: Object.freeze([
        Object.freeze({
          id: 'strong-window-all-back',
          name: 'ストロングウィンドウ・オールバック',
          source: '強風オールバック',
          description: '敵の行動を1ターン停止する。'
        }),
        Object.freeze({
          id: 'petra-and-rain',
          name: 'ペトラ＆レイン',
          source: '雨とペトラ',
          description: '敵に継続ダメージを与える。ダメージ量と継続ターン数は調整可能。'
        }),
        Object.freeze({
          id: 'animal',
          name: 'アニマル',
          source: 'アニマル',
          description: '敵の防御力を6%低下させる。'
        })
      ])
    })
  })
});

const DEFAULTS = Object.freeze({
  // Provisional balance values because the design notes do not specify these.
  bombFuseMinTurns: 2,
  bombFuseMaxTurns: 5,
  bombDamageRatio: 0.15,
  poisonTurns: 3,
  poisonDamageRatio: 0.02
});

function getBattle(state) {
  return state && state.battle && state.battle.enemy ? state.battle : null;
}

function getAssistantEffects(battle) {
  if (!battle.assistantEffects) {
    battle.assistantEffects = {
      bombs: [],
      poisonTurns: 0,
      poisonDamageRatio: 0,
      enemyStunTurns: 0,
      enemyDefenseMultiplier: 1,
      rippleVoidTurns: 0,
      rippleAttackBonusPercent: 0,
      rippleBreathProgress: 0,
      yarararaUsed: false,
      normalAttackMultiplierThisTurn: 1
    };
  }
  return battle.assistantEffects;
}

function result(ok, message, extra = {}) {
  return { ok, message, ...extra };
}

function randomInt(min, max, random) {
  return Math.floor(random() * (max - min + 1)) + min;
}

/**
 * Applies one assistant technique. This function is not called by the game
 * entry point or UI; a future battle command can call it when ready.
 */
export function applyAssistantTechnique(state, phase, techniqueId, options = {}) {
  const battle = getBattle(state);
  if (!battle) return result(false, '戦闘中ではない。');

  const enemy = battle.enemy;
  const player = state.player;
  const effects = getAssistantEffects(battle);
  const random = options.random || Math.random;
  const technique = Object.values(ASSISTANT_CATALOG.crane.phases)
    .flat()
    .find((entry) => entry.id === techniqueId);

  if (!technique) return result(false, '不明なアシスタント技だ。');
  const phaseTechniques = ASSISTANT_CATALOG.crane.phases[phase] || [];
  if (!phaseTechniques.some((entry) => entry.id === techniqueId)) {
    return result(false, 'この進化段階では、その技を使用できない。');
  }

  switch (techniqueId) {
    case 'life-hates-me': {
      if (random() < 0.04) {
        enemy.hp = 0;
        return result(true, 'life hates me――敵の命を終わらせた。', { enemyDefeated: true });
      }
      return result(true, 'life hates me――即死効果は発動しなかった。');
    }

    case 'delusional-sentiment-compensation-federation':
      effects.rippleVoidTurns = Math.max(effects.rippleVoidTurns, 1);
      return result(true, 'Delusional Sentiment Compensation Federation！ 1ターンの間、波紋が虚系モンスターにも通用する。');

    case 'nombrese-oblige':
      effects.rippleBreathProgress += 2;
      return result(true, 'Nombrese Oblige！ 波紋の呼吸準備が2ターン分進んだ。');

    case 'unknown-mother-goose': {
      const min = Math.max(1, Math.floor(options.bombFuseMinTurns ?? DEFAULTS.bombFuseMinTurns));
      const max = Math.max(min, Math.floor(options.bombFuseMaxTurns ?? DEFAULTS.bombFuseMaxTurns));
      const fuseTurns = randomInt(min, max, random);
      effects.bombs.push({
        fuseTurns,
        damageRatio: Math.max(0, options.bombDamageRatio ?? DEFAULTS.bombDamageRatio)
      });
      return result(true, 'unknown mother goose――爆弾を設置した。いつ爆発するかは分からない。');
    }

    case 'yararara':
      return result(false, 'YARARARAは技コマンドから直接使用できない。HPが最大HPの8%以下になったときに自動発動する。');

    case 'liar-macaron': {
      const damage = Math.max(1, Math.floor(enemy.maxHp * 0.02));
      enemy.hp = Math.max(0, enemy.hp - damage);
      effects.rippleAttackBonusPercent += 2;
      return result(true,
        'Liar Macaron！ ' + enemy.name + 'に' + damage +
        'ダメージ。波紋の基礎攻撃力が永続的に2%上昇した。',
        { damage, enemyDefeated: enemy.hp <= 0 });
    }

    case 'strong-window-all-back':
      effects.enemyStunTurns = Math.max(effects.enemyStunTurns, 1);
      return result(true, 'ストロングウィンドウ・オールバック！ 敵の動きを1ターン止めた。');

    case 'petra-and-rain':
      effects.poisonTurns = Math.max(effects.poisonTurns, Math.max(1, Math.floor(options.poisonTurns ?? DEFAULTS.poisonTurns)));
      effects.poisonDamageRatio = Math.max(effects.poisonDamageRatio, Math.max(0, options.poisonDamageRatio ?? DEFAULTS.poisonDamageRatio));
      return result(true, 'ペトラ＆レイン！ ' + enemy.name + 'に継続ダメージを与える状態を付与した。');

    case 'animal':
      effects.enemyDefenseMultiplier *= 0.94;
      return result(true, 'アニマル！ ' + enemy.name + 'の防御力が6%低下した。');

    default:
      return result(false, 'この技の効果はまだ実装されていない。');
  }
}

/**
 * Checks the PHASE-2 automatic survival effect after player damage.
 * Call this after incoming damage in a future BattleSystem integration.
 */
export function checkYararara(state) {
  const battle = getBattle(state);
  if (!battle || !state.player) return result(false, '');
  const player = state.player;
  const effects = getAssistantEffects(battle);

  if (effects.yarararaUsed || player.hp <= 0 || player.hp > player.maxHp * 0.08) {
    return result(false, '');
  }

  effects.yarararaUsed = true;
  player.hp = player.maxHp;
  effects.normalAttackMultiplierThisTurn = 1.2;
  return result(true, 'YARARARA！ HPが全回復した。発動ターンの通常攻撃のみ威力が1.2倍になる。');
}

/**
 * Advances assistant effects by one battle turn. The caller decides when in
 * the turn cycle to invoke this function. Bomb fuse counts remain hidden in
 * the returned messages.
 */
export function advanceAssistantTurn(state) {
  const battle = getBattle(state);
  if (!battle) return { messages: [], enemyTurnBlocked: false, bombExploded: false };
  const enemy = battle.enemy;
  const effects = getAssistantEffects(battle);
  const messages = [];
  let enemyTurnBlocked = false;
  let bombExploded = false;

  if (effects.enemyStunTurns > 0) {
    effects.enemyStunTurns -= 1;
    enemyTurnBlocked = true;
    messages.push(enemy.name + 'は動けない。');
  }

  if (effects.poisonTurns > 0) {
    const damage = Math.max(1, Math.floor(enemy.maxHp * effects.poisonDamageRatio));
    enemy.hp = Math.max(0, enemy.hp - damage);
    effects.poisonTurns -= 1;
    messages.push(enemy.name + 'は継続ダメージを受けた。' + damage + 'ダメージ。');
    if (effects.poisonTurns === 0) effects.poisonDamageRatio = 0;
  }

  const remainingBombs = [];
  for (const bomb of effects.bombs) {
    bomb.fuseTurns -= 1;
    if (bomb.fuseTurns <= 0) {
      const damage = Math.max(1, Math.floor(enemy.maxHp * bomb.damageRatio));
      enemy.hp = Math.max(0, enemy.hp - damage);
      messages.push('設置した爆弾が爆発した！ ' + enemy.name + 'に' + damage + 'ダメージ。');
      bombExploded = true;
    } else {
      remainingBombs.push(bomb);
    }
  }
  effects.bombs = remainingBombs;

  // Reset the YARARARA attack bonus after its one-turn window.
  const normalAttackMultiplier = effects.normalAttackMultiplierThisTurn;
  effects.normalAttackMultiplierThisTurn = 1;

  return {
    messages,
    enemyTurnBlocked,
    bombExploded,
    enemyDefeated: enemy.hp <= 0,
    normalAttackMultiplier
  };
}

/** Returns the defense value after assistant defense-reduction effects. */
export function getAssistantAdjustedDefense(state, defense) {
  const battle = getBattle(state);
  if (!battle) return defense;
  const effects = getAssistantEffects(battle);
  return Math.max(0, defense * effects.enemyDefenseMultiplier);
}

/** Returns whether ripple can currently damage a void-type monster. */
export function canRippleHitVoid(state) {
  const battle = getBattle(state);
  if (!battle) return false;
  return getAssistantEffects(battle).rippleVoidTurns > 0;
}

/** Returns the persistent ripple base-attack multiplier (e.g. 1.06 for +6%). */
export function getRippleAttackMultiplier(state) {
  const battle = getBattle(state);
  if (!battle) return 1;
  return 1 + getAssistantEffects(battle).rippleAttackBonusPercent / 100;
}

/** Clears one-turn effects at the end of the player's action turn. */
export function endAssistantActionTurn(state) {
  const battle = getBattle(state);
  if (!battle) return;
  const effects = getAssistantEffects(battle);
  effects.rippleVoidTurns = Math.max(0, effects.rippleVoidTurns - 1);
  effects.normalAttackMultiplierThisTurn = 1;
}
