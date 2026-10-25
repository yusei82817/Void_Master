import { AREAS, ENEMIES } from './data.js';

// 接触エンカウントとランダムエンカウントをワールド移動から分離する。
export class EncounterSystem {
  constructor(options = {}) {
    this.randomRate = options.randomRate ?? 0.07;
    this.random = options.random || Math.random;
  }

  findEnemyAt(state, x, y, areaId = state.areaId) {
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
    const templateId = dangerousAreas.includes(state.areaId) && this.random() < 0.35 ? 'oniScout' : 'hollowBeast';
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
