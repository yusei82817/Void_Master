import { AREAS } from './data.js';
export function createInitialState() {
  const enemies = [];
  Object.values(AREAS).forEach((area) => area.layout.forEach((row, y) => [...row].forEach((cell, x) => {
    if (cell === 'E' || cell === 'O') enemies.push({
      id: 'enemy-' + area.id + '-' + x + '-' + y, areaId: area.id,
      templateId: cell === 'O' ? 'oniScout' : 'hollowBeast', x, y, defeated: false
    });
  })));
  const area = AREAS.village;
  return {
    version: 3, worldId: area.id, areaId: area.id,
    player: { name: '旅人', level: 1, exp: 0, nextExp: 20, hp: 32, maxHp: 32, mp: 8, maxMp: 8, attack: 7, defense: 3, gold: 0, x: area.start.x, y: area.start.y },
    inventory: [{ itemId: 'potion', quantity: 3 }, { itemId: 'ether', quantity: 1 }],
    equipment: { weapon: null, armor: null },
    enemies, relicCollected: false, steps: 0, battle: null, storyEventsCompleted: [], assistantPhase1Unlocked: false, monsterKills: {},
    message: { name: 'SYSTEM', text: 'はじまりの村から冒険を始めよう。森や港への道を探し、海へは港の船で出航する。', status: '探索中' }
  };
}
export function normalizeState(saved) {
  const fresh = createInitialState();
  if (!saved || ![2, 3].includes(saved.version) || !saved.player || !Array.isArray(saved.inventory)) return fresh;
  // Migrate the previous save schema instead of silently replacing it with a new game.
  if (saved.version === 2) {
    saved = {
      ...saved,
      version: 3,
      equipment: saved.equipment && typeof saved.equipment === 'object' ? saved.equipment : { weapon: null, armor: null },
      storyEventsCompleted: Array.isArray(saved.storyEventsCompleted) ? saved.storyEventsCompleted : [],
      assistantPhase1Unlocked: Boolean(saved.assistantPhase1Unlocked),
      steps: Number.isFinite(saved.steps) ? saved.steps : 0,
      relicCollected: Boolean(saved.relicCollected)
    };
  }
  const player = { ...fresh.player, ...saved.player };
  for (const key of ['hp','maxHp','mp','maxMp','level','exp','nextExp','attack','defense','gold','x','y']) {
    if (!Number.isFinite(player[key])) player[key] = fresh.player[key];
  }
  player.level = Math.max(1, Math.floor(player.level));
  player.exp = Math.max(0, Math.floor(player.exp));
  player.nextExp = Math.max(1, Math.floor(player.nextExp));
  player.attack = Math.max(0, Math.floor(player.attack));
  player.defense = Math.max(0, Math.floor(player.defense));
  player.gold = Math.max(0, Math.floor(player.gold));
  player.maxHp = Math.max(1, Math.floor(player.maxHp));
  player.maxMp = Math.max(0, Math.floor(player.maxMp));
  player.hp = Math.max(0, Math.min(player.maxHp, Math.floor(player.hp)));
  player.mp = Math.max(0, Math.min(player.maxMp, Math.floor(player.mp)));
  const areaId = AREAS[saved.areaId] ? saved.areaId : 'village';
  const validItems = saved.inventory.filter((entry) => entry && typeof entry.itemId === 'string' && Number.isInteger(entry.quantity) && entry.quantity > 0)
    .map((entry) => ({ itemId: entry.itemId, quantity: entry.quantity }));
  const validEnemies = Array.isArray(saved.enemies) ? saved.enemies.filter((entry) => entry && typeof entry.id === 'string' && typeof entry.templateId === 'string')
    .map((entry) => ({ ...entry, areaId: AREAS[entry.areaId] ? entry.areaId : 'village', x: Number(entry.x) || 0, y: Number(entry.y) || 0, defeated: Boolean(entry.defeated) })) : fresh.enemies;
  const area = AREAS[areaId];
  player.x = Math.max(1, Math.min(area.layout[0].length - 2, Math.floor(player.x)));
  player.y = Math.max(1, Math.min(area.layout.length - 2, Math.floor(player.y)));
  if (area.layout[player.y]?.[player.x] === '#') { player.x = area.start.x; player.y = area.start.y; }
  const savedEquipment = saved.equipment && typeof saved.equipment === 'object' ? saved.equipment : {};
  const equipment = {
    weapon: typeof savedEquipment.weapon === 'string' && validItems.some((entry) => entry.itemId === savedEquipment.weapon) ? savedEquipment.weapon : null,
    armor: typeof savedEquipment.armor === 'string' && validItems.some((entry) => entry.itemId === savedEquipment.armor) ? savedEquipment.armor : null
  };
  const storyEventsCompleted = Array.isArray(saved.storyEventsCompleted) ? saved.storyEventsCompleted.filter((id) => typeof id === 'string') : [];
  const assistantPhase1Unlocked = Boolean(saved.assistantPhase1Unlocked || storyEventsCompleted.includes('S3'));
  const monsterKills = saved.monsterKills && typeof saved.monsterKills === 'object' && !Array.isArray(saved.monsterKills)
    ? Object.fromEntries(Object.entries(saved.monsterKills).filter(([id, count]) => typeof id === 'string' && Number.isFinite(count) && count >= 0).map(([id, count]) => [id, Math.floor(count)]))
    : {};
  return { ...fresh, ...saved, version: 3, worldId: areaId, areaId, player, inventory: validItems, equipment, enemies: validEnemies, battle: null, storyEventsCompleted, assistantPhase1Unlocked,
    message: saved.message && typeof saved.message.text === 'string' ? saved.message : fresh.message };
}
