export const GAME_VERSION = '0.1.0';

function buildFrontierMap() {
  const width = 41;
  const height = 31;
  const grid = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      x === 0 || y === 0 || x === width - 1 || y === height - 1 ? '#' : '.'
    )
  );

  // 壁は通路を残して配置。広いフィールドでも移動経路が途切れないようにする。
  const verticalWalls = [
    { x: 8, from: 2, to: 25, gaps: [7, 15, 22] },
    { x: 17, from: 4, to: 28, gaps: [10, 20] },
    { x: 27, from: 2, to: 24, gaps: [6, 16, 21] }
  ];
  verticalWalls.forEach(({ x, from, to, gaps }) => {
    for (let y = from; y <= to; y += 1) if (!gaps.includes(y)) grid[y][x] = '#';
  });
  const horizontalWalls = [
    { y: 9, from: 2, to: 14, gaps: [5, 11] },
    { y: 19, from: 18, to: 38, gaps: [24, 32] }
  ];
  horizontalWalls.forEach(({ y, from, to, gaps }) => {
    for (let x = from; x <= to; x += 1) if (!gaps.includes(x)) grid[y][x] = '#';
  });

  // 記号: P=開始地点、E=通常敵、O=鬼族、R=核の欠片
  [[2, 2, 'P'], [10, 5, 'E'], [20, 12, 'O'], [33, 24, 'E'], [36, 27, 'R']].forEach(([x, y, value]) => {
    grid[y][x] = value;
  });
  return grid.map((row) => row.join(''));
}

export const WORLD = {
  id: 'first-frontier',
  name: '未踏の領域',
  description: '壁の向こうまで続く広大な遺跡。歩きながら周囲を探索しよう。',
  width: 41,
  height: 31,
  layout: buildFrontierMap()
};

export const ENEMIES = {
  hollowBeast: {
    id: 'hollowBeast',
    name: '虚ろな獣',
    kind: 'beast',
    maxHp: 16,
    attack: 4,
    defense: 1,
    exp: 8,
    gold: 3,
    description: '輪郭が揺らぐ小さな獣。'
  },
  oniScout: {
    id: 'oniScout',
    name: '鬼族の斥候',
    kind: 'oni',
    maxHp: 24,
    attack: 6,
    defense: 2,
    exp: 14,
    gold: 7,
    description: '波紋に弱い鬼族の斥候。'
  }
};

export const ITEMS = {
  potion: {
    id: 'potion',
    name: '回復薬',
    description: 'HPを14回復する。',
    type: 'consumable',
    effect: 'heal',
    power: 14
  },
  ether: {
    id: 'ether',
    name: '霊薬',
    description: 'MPを5回復する。',
    type: 'consumable',
    effect: 'restoreMp',
    power: 5
  },
  coreFragment: {
    id: 'coreFragment',
    name: '核の欠片',
    description: '遺跡で見つかった、不思議な力を宿す欠片。',
    type: 'key'
  }
};

export const TILE_INFO = {
  '#': { name: '壁', glyph: '▰', className: 'tile-wall' },
  '.': { name: '床', glyph: '·', className: 'tile-floor' },
  P: { name: '旅人', glyph: '♙', className: 'tile-player' },
  E: { name: '敵', glyph: '!', className: 'tile-enemy' },
  R: { name: '核の欠片', glyph: '✧', className: 'tile-relic' }
};
