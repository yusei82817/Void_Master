import { addItem } from './inventory.js';

export const SHOP_ITEMS = [
  { id: 'potion', name: '回復薬', price: 30, description: 'HPを14回復する。' },
  { id: 'ether', name: '霊水', price: 40, description: 'MPを5回復する。' },
  { id: 'luckyScale', name: '激運の天秤', price: 100, description: '使用した戦闘で16%の確率でGOLD報酬が2倍になる。' }
];

export function purchaseShopItem(state, itemId) {
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
  if (!item) return { ok: false, message: 'その商品は取り扱っていない。' };
  if (!Number.isFinite(state.player.gold) || state.player.gold < item.price) {
    return { ok: false, message: 'GOLDが足りない。' };
  }
  // Only deduct money after the inventory accepts the item.
  if (!addItem(state, item.id, 1)) {
    return { ok: false, message: '購入処理に失敗した。GOLDは消費していない。' };
  }
  state.player.gold -= item.price;
  return { ok: true, message: item.name + 'を購入した。-' + item.price + ' GOLD。' };
}
