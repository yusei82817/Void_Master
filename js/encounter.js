import { AREAS, ENEMIES } from './data.js';

// 接触エンカウントとランダムエンカウントをワールド移動から分離する。
export class EncounterSystem {
  constructor(options = {}) {
    this.randomRate = options.randomRate ?? 0.07;
    this.random = options.random || Math.random;
  }

  findEnemyAt(state, x, y, areaId = state.areaId) {
    const area = AREAS[areaId];
    if (area?.safe === true) return null;
    return state.enemies.find((enemy) =>
      !enemy.defeated && enemy.x === x && enemy.y === y && (!enemy.areaId || enemy.areaId === areaId)
    ) || null;
  }

  findAdjacentEnemy(state, x, y, areaId = state.areaId) {
    return [
      [x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]
    ].map(([nx, ny]) => this.findEnemyAt(state, nx, ny, areaId)).find(Boolean) || null;
  }

  rollRandomEncounter(state, x, y, cell) {
    const area = AREAS[state.areaId];
    if (area?.randomEncounters === false || area?.safe === true) return null;
    if (cell !== '.' || state.battle || this.random() >= this.randomRate) return null;

    const dangerousAreas = ['cave', 'volcano', 'sea'];
    let templateId;
    const specifiedRates = {
      village: [{ id: 'hollowBeast', rate: 0.04 }],
      forest: [{ id: 'hollowBeast', rate: 0.04 }, { id: 'oniScout', rate: 0.03 }, { id: 'gaki', rate: 0.20 }]
    }[state.areaId];
    if (specifiedRates) {
      const multiplier = state.rottenFleshBattles > 0 ? 1.2 : 1;
      const eligible = specifiedRates.map((entry) => ({ ...entry, rate: entry.rate * multiplier }));
      const totalRate = eligible.reduce((sum, entry) => sum + entry.rate, 0);
      const roll = this.random();
      if (roll >= totalRate) return null;
      let cursor = roll;
      templateId = eligible.find((entry) => (cursor -= entry.rate) < 0)?.id || eligible[eligible.length - 1].id;
    } else {
      templateId = dangerousAreas.includes(state.areaId) && this.random() < 0.35 ? 'oniScout' : 'hollowBeast';
    }
    return {
      id: 'random-' + state.steps + '-' + x + '-' + y,
      templateId,
      x,
      y,
      defeated: false,
      temporary: true
    };
  }

  getEnemyTemplate(enemyRecord) {
    return ENEMIES[enemyRecord?.templateId] || ENEMIES.hollowBeast;
  }
}
