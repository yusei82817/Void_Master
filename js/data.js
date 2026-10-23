export const GAME_VERSION = '0.2.0';
const MAP_WIDTH = 41;
const MAP_HEIGHT = 31;

function buildAreaMap({ start, exits, enemies = [], relics = [], walls = [] }) {
  const grid = Array.from({ length: MAP_HEIGHT }, (_, y) => Array.from({ length: MAP_WIDTH }, (_, x) =>
    x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1 ? '#' : '.'));
  const defaultWalls = [
    { x: 12, from: 2, to: 27, gaps: [6, 15, 23] },
    { x: 24, from: 3, to: 28, gaps: [9, 18, 25] },
    { y: 10, from: 3, to: 37, gaps: [7, 18, 30] },
    { y: 20, from: 3, to: 37, gaps: [10, 22, 34] }
  ];
  [...defaultWalls, ...walls].forEach((wall) => {
    if (wall.x !== undefined) {
      for (let y = wall.from; y <= wall.to; y += 1) if (!wall.gaps.includes(y)) grid[y][wall.x] = '#';
    } else {
      for (let x = wall.from; x <= wall.to; x += 1) if (!wall.gaps.includes(x)) grid[wall.y][x] = '#';
    }
  });
  enemies.forEach(([x, y, symbol = 'E']) => { grid[y][x] = symbol; });
  relics.forEach(([x, y]) => { grid[y][x] = 'R'; });
  Object.entries(exits).forEach(([symbol, exit]) => { grid[exit.y][exit.x] = symbol; });
  if (start) grid[start.y][start.x] = 'P';
  return grid.map((row) => row.join(''));
}

export const AREAS = {
  village: {
    id: 'village', name: 'はじまりの村', theme: 'village',
    description: '旅の拠点となる小さな村。北の道は森へ、南東の道は港へ続く。',
    start: { x: 3, y: 3 },
    exits: {
      F: { x: 37, y: 5, to: 'forest', spawn: { x: 35, y: 5 }, message: '村を出て、深い森へ足を踏み入れた。' },
      H: { x: 37, y: 25, to: 'port', spawn: { x: 35, y: 25 }, message: '海風の吹く港へ到着した。' }
    },
    layout: buildAreaMap({ start: { x: 3, y: 3 }, exits: { F: { x: 37, y: 5 }, H: { x: 37, y: 25 } }, enemies: [[9, 6, 'E']], walls: [{ x: 6, from: 3, to: 8, gaps: [5] }] })
  },
  forest: {
    id: 'forest', name: '深緑の森', theme: 'forest',
    description: '木々が視界を遮る森。奥には洞窟へ続く道と、火山へ向かう山道がある。',
    start: { x: 35, y: 5 },
    exits: {
      V: { x: 3, y: 3, to: 'village', spawn: { x: 5, y: 3 }, message: '森を抜け、はじまりの村へ戻った。' },
      C: { x: 37, y: 5, to: 'cave', spawn: { x: 35, y: 5 }, message: '冷たい風が吹く洞窟へ入った。' },
      M: { x: 37, y: 25, to: 'volcano', spawn: { x: 35, y: 25 }, message: '山道を越え、火山地帯へ進んだ。' }
    },
    layout: buildAreaMap({ exits: { V: { x: 3, y: 3 }, C: { x: 37, y: 5 }, M: { x: 37, y: 25 } }, enemies: [[8, 6, 'E'], [18, 14, 'E'], [30, 23, 'O']], walls: [
      { x: 7, from: 2, to: 27, gaps: [8, 17, 24] }, { x: 19, from: 2, to: 27, gaps: [5, 13, 21] }, { y: 15, from: 3, to: 36, gaps: [10, 25] }
    ] })
  },
  sea: {
    id: 'sea', name: '外洋', theme: 'sea',
    description: '船でのみ進入できる広大な海。潮流に注意しながら火山島の船着き場を探そう。',
    start: { x: 3, y: 3 },
    exits: {
      B: { x: 3, y: 3, to: 'port', spawn: { x: 20, y: 26 }, message: '船を港へ戻した。' },
      S: { x: 37, y: 25, to: 'volcano', spawn: { x: 35, y: 3 }, message: '火山島の船着き場へ上陸した。' }
    },
    layout: buildAreaMap({ exits: { B: { x: 3, y: 3 }, S: { x: 37, y: 25 } }, enemies: [[10, 8, 'E'], [21, 17, 'O'], [32, 8, 'E']], walls: [
      { x: 12, from: 2, to: 27, gaps: [6, 15, 23] }, { x: 25, from: 2, to: 27, gaps: [9, 19] }
    ] })
  },
  cave: {
    id: 'cave', name: '忘却の洞窟', theme: 'cave',
    description: '光の届かない洞窟。奥には核の欠片と火山へ抜ける溶岩洞がある。',
    start: { x: 35, y: 5 },
    exits: {
      F: { x: 3, y: 3, to: 'forest', spawn: { x: 35, y: 5 }, message: '洞窟を出て深緑の森へ戻った。' },
      M: { x: 37, y: 25, to: 'volcano', spawn: { x: 5, y: 25 }, message: '溶岩洞を抜け、火山の麓へ出た。' }
    },
    layout: buildAreaMap({ exits: { F: { x: 3, y: 3 }, M: { x: 37, y: 25 } }, enemies: [[8, 7, 'E'], [19, 13, 'O'], [31, 23, 'E']], relics: [[32, 26]], walls: [
      { x: 10, from: 2, to: 27, gaps: [7, 16, 24] }, { x: 21, from: 2, to: 27, gaps: [5, 14, 22] }, { y: 11, from: 3, to: 37, gaps: [8, 18, 29] }
    ] })
  },
  port: {
    id: 'port', name: '潮風の港', theme: 'port',
    description: '船が停泊する港。村へ戻る道と、船に乗って海へ出る船着き場がある。',
    start: { x: 35, y: 25 },
    exits: {
      V: { x: 3, y: 3, to: 'village', spawn: { x: 35, y: 25 }, message: '港を離れ、村へ続く道を歩いた。' },
      B: { x: 20, y: 27, to: 'sea', spawn: { x: 5, y: 3 }, message: '船に乗り、外洋へ出航した。' }
    },
    layout: buildAreaMap({ exits: { V: { x: 3, y: 3 }, B: { x: 20, y: 27 } }, enemies: [[10, 8, 'E']], walls: [
      { x: 13, from: 2, to: 25, gaps: [8, 17, 23] }, { y: 15, from: 3, to: 37, gaps: [8, 20, 32] }
    ] })
  },
  volcano: {
    id: 'volcano', name: '灰燼の火山', theme: 'volcano',
    description: '火の粉が舞う危険な火山地帯。森、洞窟、海の船着き場へ通じる道がある。',
    start: { x: 35, y: 25 },
    exits: {
      F: { x: 3, y: 3, to: 'forest', spawn: { x: 35, y: 25 }, message: '山道を下り、深緑の森へ戻った。' },
      C: { x: 3, y: 25, to: 'cave', spawn: { x: 35, y: 25 }, message: '溶岩洞を通り、忘却の洞窟へ入った。' },
      S: { x: 37, y: 3, to: 'sea', spawn: { x: 35, y: 25 }, message: '船着き場から海へ戻った。' }
    },
    layout: buildAreaMap({ exits: { F: { x: 3, y: 3 }, C: { x: 3, y: 25 }, S: { x: 37, y: 3 } }, enemies: [[10, 7, 'O'], [22, 13, 'E'], [31, 22, 'O']], relics: [[34, 25]], walls: [
      { x: 12, from: 2, to: 27, gaps: [7, 16, 24] }, { x: 24, from: 2, to: 27, gaps: [5, 14, 22] }, { y: 18, from: 3, to: 37, gaps: [9, 20, 31] }
    ] })
  }
};
export const WORLD = AREAS.village;

export const ENEMIES = {
  hollowBeast: { id: 'hollowBeast', name: '虚ろな獣', kind: 'beast', maxHp: 16, attack: 4, defense: 1, exp: 8, gold: 3, description: '輪郭が揺らぐ小さな獣。' },
  oniScout: { id: 'oniScout', name: '鬼族の斥候', kind: 'oni', maxHp: 24, attack: 6, defense: 2, exp: 14, gold: 7, description: '波紋に弱い鬼族の斥候。' }
};
export const ITEMS = {
  potion: { id: 'potion', name: '回復薬', description: 'HPを14回復する。', type: 'consumable', effect: 'heal', power: 14 },
  ether: { id: 'ether', name: '霊薬', description: 'MPを5回復する。', type: 'consumable', effect: 'restoreMp', power: 5 },
  coreFragment: { id: 'coreFragment', name: '核の欠片', description: '遺跡で見つかった、不思議な力を宿す欠片。', type: 'key' }
};
export const TILE_INFO = {
  '#': { name: '障害物', glyph: '▰', className: 'tile-wall' },
  '.': { name: '地面', glyph: '·', className: 'tile-floor' },
  P: { name: '旅人の出発地点', glyph: '♙', className: 'tile-player' },
  E: { name: '敵', glyph: '!', className: 'tile-enemy' },
  O: { name: '鬼族', glyph: '!', className: 'tile-enemy' },
  R: { name: '核の欠片', glyph: '✧', className: 'tile-relic' },
  F: { name: '森への道', glyph: '♣', className: 'tile-exit' },
  V: { name: '村・森への道', glyph: '↩', className: 'tile-exit' },
  C: { name: '洞窟への道', glyph: '⌄', className: 'tile-exit' },
  M: { name: '火山への道', glyph: '▲', className: 'tile-exit' },
  H: { name: '港への道', glyph: '⚓', className: 'tile-exit' },
  B: { name: '船着き場', glyph: '⛵', className: 'tile-exit' },
  S: { name: '火山島への船着き場', glyph: '⌁', className: 'tile-exit' }
};
