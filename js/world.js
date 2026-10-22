import { WORLD, ENEMIES } from './data.js';
import { addItem } from './inventory.js';

export class WorldSystem {
  constructor() {
    this.world = WORLD;
  }

  getCell(x, y) {
    const row = this.world.layout[y];
    return row && row[x] ? row[x] : '#';
  }

  isWalkable(x, y) {
    return this.getCell(x, y) !== '#';
  }

  getEnemyAt(state, x, y) {
    return state.enemies.find((enemy) => !enemy.defeated && enemy.x === x && enemy.y === y) || null;
  }

  move(state, dx, dy) {
    if (state.battle) return { ok: false, message: '戦闘中は移動できない。' };
    if (state.player.hp <= 0) return { ok: false, message: 'HPが尽きている。回復するか、セーブデータを読み込もう。' };
    const x = state.player.x + dx;
    const y = state.player.y + dy;
    if (!this.isWalkable(x, y)) return { ok: false, message: '進めない。道を確認しよう。' };

    const enemy = this.getEnemyAt(state, x, y);
    if (enemy) return { ok: true, encounter: enemy };

    const cell = this.getCell(x, y);
    if (cell === 'R' && !state.relicCollected) {
      state.player.x = x;
      state.player.y = y;
      state.steps += 1;
      state.relicCollected = true;
      addItem(state, 'coreFragment', 1);
      return { ok: true, relic: true, message: '核の欠片を手に入れた。欠片は持ち物に保管された。' };
    }

    state.player.x = x;
    state.player.y = y;
    state.steps += 1;
    return { ok: true, message: this.describeCell(state) };
  }

  interact(state) {
    if (state.battle) return { ok: false, message: '戦闘中は探索できない。' };
    const enemy = this.getEnemyAt(state, state.player.x, state.player.y);
    if (enemy) return { ok: true, encounter: enemy };
    if (this.getCell(state.player.x, state.player.y) === 'R' && !state.relicCollected) {
      state.relicCollected = true;
      addItem(state, 'coreFragment', 1);
      return { ok: true, relic: true, message: '核の欠片を手に入れた。' };
    }
    return { ok: true, message: '周囲を調べたが、今は目立ったものはない。' };
  }

  describeCell(state) {
    if (this.getCell(state.player.x, state.player.y) === 'R' && state.relicCollected) return '核の欠片があった場所。淡い光だけが残っている。';
    return '足元に気をつけながら進んだ。';
  }

  enemyTemplate(enemy) {
    return ENEMIES[enemy.templateId] || ENEMIES.hollowBeast;
  }
}
