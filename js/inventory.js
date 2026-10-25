import { ITEMS } from './data.js';

export function getItem(itemId) {
  return ITEMS[itemId] || null;
}

export function countItem(state, itemId) {
  return state.inventory.find((entry) => entry.itemId === itemId)?.quantity || 0;
}

export function addItem(state, itemId, quantity = 1) {
  if (!ITEMS[itemId] || !Number.isInteger(quantity) || quantity <= 0) return false;
  const entry = state.inventory.find((item) => item.itemId === itemId);
  if (entry) entry.quantity += quantity;
  else state.inventory.push({ itemId, quantity });
  return true;
}

export function removeItem(state, itemId, quantity = 1) {
  const entry = state.inventory.find((item) => item.itemId === itemId);
  if (!entry || !Number.isInteger(quantity) || quantity <= 0 || entry.quantity < quantity) return false;
  entry.quantity -= quantity;
  state.inventory = state.inventory.filter((item) => item.quantity > 0);
  return true;
}

export function useItem(state, itemId) {
  const item = getItem(itemId);
  if (!item || item.type !== 'consumable') return { ok: false, message: 'このアイテムは使用できない。' };
  if (countItem(state, itemId) < 1) return { ok: false, message: 'そのアイテムは持っていない。' };

  const player = state.player;
  if (item.effect === 'luckyScale') {
    if (!state.battle) return { ok: false, message: '激運の天秤は戦闘中に使用する。' };
    if (state.battle.luckyScaleUsed) return { ok: false, message: 'この戦闘ではすでに激運の天秤を使用した。' };
    state.battle.luckyScaleUsed = true;
    const activated = Math.random() < 0.16;
    state.battle.goldRewardMultiplier = activated ? 2 : 1;
    removeItem(state, itemId);
    return {
      ok: true,
      message: activated
        ? '激運の天秤が光った！ この戦闘のGOLD報酬が2倍になる。'
        : '激運の天秤は反応しなかった。GOLD報酬は通常どおり。'
    };
  }

  if (item.effect === 'heal') {
    if (player.hp >= player.maxHp) return { ok: false, message: 'HPはすでに最大だ。' };
    const restored = Math.min(item.power, player.maxHp - player.hp);
    player.hp += restored;
    removeItem(state, itemId);
    return { ok: true, message: item.name + 'を使い、HPが' + restored + '回復した。' };
  }

  if (item.effect === 'restoreMp') {
    if (player.mp >= player.maxMp) return { ok: false, message: 'MPはすでに最大だ。' };
    const restored = Math.min(item.power, player.maxMp - player.mp);
    player.mp += restored;
    removeItem(state, itemId);
    return { ok: true, message: item.name + 'を使い、MPが' + restored + '回復した。' };
  }

  return { ok: false, message: '効果が設定されていない。' };
}
