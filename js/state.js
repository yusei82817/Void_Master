import { WORLD } from './data.js';

export function createInitialState() {
  const enemies = [];
  WORLD.layout.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === 'E') {
        enemies.push({
          id: 'enemy-' + x + '-' + y,
          templateId: (x === 7 && y === 2) ? 'oniScout' : 'hollowBeast',
          x,
          y,
          defeated: false
        });
      }
    });
  });

  const startY = WORLD.layout.findIndex((row) => row.includes('P'));
  const startX = WORLD.layout[startY].indexOf('P');

  return {
    version: 1,
    worldId: WORLD.id,
    player: {
      name: '旅人',
      level: 1,
      exp: 0,
      nextExp: 20,
      hp: 32,
      maxHp: 32,
      mp: 8,
      maxMp: 8,
      attack: 7,
      defense: 3,
      gold: 0,
      x: startX,
      y: startY
    },
    inventory: [
      { itemId: 'potion', quantity: 3 },
      { itemId: 'ether', quantity: 1 }
    ],
    enemies,
    relicCollected: false,
    steps: 0,
    battle: null,
    message: {
      name: 'SYSTEM',
      text: '矢印キーまたはWASDで移動。敵に接触するとターン制バトルが始まる。',
      status: '探索中'
    }
  };
}

export function normalizeState(saved) {
  const fresh = createInitialState();
  if (!saved || saved.version !== 1 || !saved.player || !Array.isArray(saved.inventory)) {
    return fresh;
  }

  const player = { ...fresh.player, ...saved.player };
  for (const key of ['hp', 'maxHp', 'mp', 'maxMp', 'level', 'exp', 'nextExp', 'attack', 'defense', 'gold', 'x', 'y']) {
    if (!Number.isFinite(player[key])) player[key] = fresh.player[key];
  }
  player.maxHp = Math.max(1, player.maxHp);
  player.maxMp = Math.max(0, player.maxMp);
  player.hp = Math.max(0, Math.min(player.maxHp, player.hp));
  player.mp = Math.max(0, Math.min(player.maxMp, player.mp));

  const validItems = saved.inventory
    .filter((entry) => entry && typeof entry.itemId === 'string' && Number.isInteger(entry.quantity) && entry.quantity > 0)
    .map((entry) => ({ itemId: entry.itemId, quantity: entry.quantity }));

  const validEnemies = Array.isArray(saved.enemies)
    ? saved.enemies.filter((entry) => entry && typeof entry.id === 'string' && typeof entry.templateId === 'string')
      .map((entry) => ({ ...entry, x: Number(entry.x) || 0, y: Number(entry.y) || 0, defeated: Boolean(entry.defeated) }))
    : fresh.enemies;

  return {
    ...fresh,
    ...saved,
    player,
    inventory: validItems,
    enemies: validEnemies,
    battle: null,
    message: saved.message && typeof saved.message.text === 'string' ? saved.message : fresh.message
  };
}
