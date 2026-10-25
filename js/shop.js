import { addItem } from './inventory.js';

export const SHOP_STOCK = {
  general: [
    { id: 'potion', name: '回復薬', price: 30, description: 'HPを14回復する。' },
    { id: 'ether', name: '霊水', price: 40, description: 'MPを5回復する。' },
    { id: 'luckyScale', name: '激運の天秤', price: 100, description: '使用した戦闘で16%の確率でGOLD報酬が2倍になる。' }
  ],
  weapon: [
    { id: 'roughWoodenSword', name: '粗削りの木刀', price: 20, description: '攻撃力 +1。武器枠に装備する。' },
    { id: 'bronzeSword', name: '青銅の剣', price: 55, description: '攻撃力 +2。武器枠に装備する。' }
  ],
  armor: [
    { id: 'voidHideLightArmor', name: '虚皮の軽装', price: 35, description: '防御力 +1。防具枠に装備する。' },
    { id: 'ironArmor', name: '鉄の鎧', price: 115, description: '防御力 +4。防具枠に装備する。' }
  ]
};
export const SHOP_ITEMS = SHOP_STOCK.general;
export const SHOP_DETAILS = {
  general: { title: 'はじまりの村・雑貨屋', tile: 'D' },
  weapon: { title: '初級武器屋', tile: 'W' },
  armor: { title: '初級防具屋', tile: 'A' }
};
export function getShopItems(shopId = 'general') {
  return SHOP_STOCK[shopId] || [];
}
export function purchaseShopItem(state, itemId, shopId = 'general') {
  const item = getShopItems(shopId).find((entry) => entry.id === itemId);
  if (!item) return { ok: false, message: 'この店ではその商品を取り扱っていない。' };
  if (!Number.isFinite(state.player.gold) || state.player.gold < item.price) {
    return { ok: false, message: 'GOLDが足りない。' };
  }
  if (!addItem(state, item.id, 1)) {
    return { ok: false, message: '購入処理に失敗した。GOLDは消費していない。' };
  }
  state.player.gold -= item.price;
  return { ok: true, message: item.name + 'を購入した。-' + item.price + ' GOLD。' };
}
