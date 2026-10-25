import { AREAS, ENEMIES } from './data.js';
import { addItem } from './inventory.js';
import { EncounterSystem } from './encounter.js';
export class WorldSystem {
  constructor(encounters = new EncounterSystem()) { this.areas = AREAS; this.world = AREAS.village; this.encounters = encounters; }
  getWorld(state) { return this.areas[state.areaId] || this.areas.village; }
  getCell(x, y, state = null) {
    const layout = state ? this.getWorld(state).layout : this.world.layout;
    const row = layout[y]; return row && row[x] ? row[x] : '#';
  }
  isWalkable(x, y, state = null) { return this.getCell(x, y, state) !== '#'; }
  getEnemyAt(state, x, y) { return this.encounters.findEnemyAt(state, x, y, state.areaId); }
  move(state, dx, dy) {
    if (state.battle) return { ok: false, message: '戦闘中は移動できない。' };
    if (state.player.hp <= 0) return { ok: false, message: 'HPが尽きている。回復するか、セーブデータを読み込もう。' };
    const x = state.player.x + dx, y = state.player.y + dy;
    if (!this.isWalkable(x, y, state)) return { ok: false, message: '進めない。道を確認しよう。' };
    const enemy = this.getEnemyAt(state, x, y);
    if (enemy) return { ok: true, encounter: enemy };
    const area = this.getWorld(state), cell = this.getCell(x, y, state);
    state.player.x = x; state.player.y = y; state.steps += 1;
    const exit = area.exits?.[cell];
    if (exit && area.id === 'cave' && cell === 'M' &&
        !state.storyEventsCompleted?.includes('S2')) {
      state.player.x -= dx; state.player.y -= dy; state.steps = Math.max(0, state.steps - 1);
      return { ok: false, message: '溶岩洞の先はまだ進めない。洞窟の奥にあるものを確かめよう。' };
    }
    if (exit && area.id === 'volcano' && cell === 'C' &&
        !state.storyEventsCompleted?.includes('S2')) {
      state.player.x -= dx; state.player.y -= dy; state.steps = Math.max(0, state.steps - 1);
      return { ok: false, message: '忘却の洞窟へ続く溶岩洞は、まだ通れない。' };
    }
    if (exit) {
      state.areaId = exit.to; state.worldId = exit.to;
      state.player.x = exit.spawn.x; state.player.y = exit.spawn.y;
      const nextArea = this.getWorld(state); this.world = nextArea;
      return { ok: true, travel: true, message: exit.message, area: nextArea };
    }
    if (cell === 'R' && !state.relicCollected) {
      state.relicCollected = true; addItem(state, 'coreFragment', 1);
      return { ok: true, relic: true, message: '核の欠片を手に入れた。欠片は持ち物に保管された。' };
    }
    const randomEncounter = this.encounters.rollRandomEncounter(state, x, y, cell);
    if (randomEncounter) { randomEncounter.areaId = state.areaId; return { ok: true, encounter: randomEncounter, randomEncounter: true }; }
    return { ok: true, message: this.describeCell(state) };
  }
  interact(state) {
    if (state.battle) return { ok: false, message: '戦闘中は探索できない。' };
    const currentCell = this.getCell(state.player.x, state.player.y, state);
    const shopIds = { D: 'general', W: 'weapon', A: 'armor' };
    if (shopIds[currentCell]) return { ok: true, shopId: shopIds[currentCell], message: '店を見つけた。' };
    const enemy = this.encounters.findAdjacentEnemy(state, state.player.x, state.player.y, state.areaId);
    if (enemy) return { ok: true, encounter: enemy };
    if (this.getCell(state.player.x, state.player.y, state) === 'R' && !state.relicCollected) {
      state.relicCollected = true; addItem(state, 'coreFragment', 1);
      return { ok: true, relic: true, message: '核の欠片を手に入れた。' };
    }
    return { ok: true, message: this.getWorld(state).description };
  }
  describeCell(state) {
    if (this.getCell(state.player.x, state.player.y, state) === 'R' && state.relicCollected) return '核の欠片があった場所。淡い光だけが残っている。';
    return this.getWorld(state).description;
  }
  enemyTemplate(enemy) { return ENEMIES[enemy.templateId] || ENEMIES.hollowBeast; }
}
