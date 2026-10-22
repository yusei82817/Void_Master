import { ENEMIES } from './data.js';

// 接触エンカウントとランダムエンカウントをワールド移動から分離する。
export class EncounterSystem {
  constructor(options = {}) {
    this.randomRate = options.randomRate ?? 0.07;
    this.random = options.random || Math.random;
  }

  findEnemyAt(state, x, y) {
    return state.enemies.find((enemy) =>
      !enemy.defeated && enemy.x === x && enemy.y === y
    ) || null;
  }

  findAdjacentEnemy(state, x, y) {
    return [
      [x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]
    ].map(([nx, ny]) => this.findEnemyAt(state, nx, ny)).find(Boolean) || null;
  }

  rollRandomEncounter(state, x, y, cell) {
    if (cell !== '.' || state.battle || this.random() >= this.randomRate) return null;

    const templateId = x >= 18 && this.random() < 0.3 ? 'oniScout' : 'hollowBeast';
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
