export const GAME_VERSION = '0.2.0';
const MAP_WIDTH = 51;
const MAP_HEIGHT = 37;

function buildAreaMap({ start, exits, enemies = [], relics = [], shops = [], walls = [], width = MAP_WIDTH, height = MAP_HEIGHT, defaultWalls: useDefaultWalls = true }) {
  const grid = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) =>
    x === 0 || y === 0 || x === width - 1 || y === height - 1 ? '#' : '.'));
  const defaultWalls = [
    { x: 12, from: 2, to: 27, gaps: [6, 15, 23] },
    { x: 24, from: 3, to: 34, gaps: [9, 18, 25, 31] },
    { x: 36, from: 3, to: 34, gaps: [7, 16, 25, 31] },
    { y: 10, from: 3, to: 37, gaps: [7, 18, 30] },
    { y: 20, from: 3, to: 47, gaps: [10, 22, 34, 42] },
    { y: 29, from: 3, to: 47, gaps: [8, 19, 30, 42] }
  ];
  [...(useDefaultWalls ? defaultWalls : []), ...walls].forEach((wall) => {
    if (wall.x !== undefined) {
      for (let y = wall.from; y <= wall.to; y += 1) if (!wall.gaps.includes(y)) grid[y][wall.x] = '#';
    } else {
      for (let x = wall.from; x <= wall.to; x += 1) if (!wall.gaps.includes(x)) grid[wall.y][x] = '#';
    }
  });
  enemies.forEach(([x, y, symbol = 'E']) => { grid[y][x] = symbol; });
  relics.forEach(([x, y]) => { grid[y][x] = 'R'; });
  shops.forEach(([x, y, symbol]) => { grid[y][x] = symbol; });
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
      F: { x: 47, y: 5, to: 'forest', spawn: { x: 35, y: 5 }, message: '村を出て、深い森へ足を踏み入れた。' },
      H: { x: 47, y: 31, to: 'port', spawn: { x: 35, y: 25 }, message: '海風の吹く港へ到着した。' }
    },
    layout: buildAreaMap({ start: { x: 3, y: 3 }, exits: { F: { x: 47, y: 5 }, H: { x: 47, y: 31 } }, enemies: [[9, 6, 'E']], shops: [[8, 5, 'D'], [10, 5, 'W']], walls: [{ x: 6, from: 3, to: 8, gaps: [5] }] })
  },
  forest: {
    id: 'forest', name: '深緑の森', theme: 'forest',
    description: '木々が視界を遮る森。奥には洞窟へ続く道と、火山へ向かう山道がある。',
    start: { x: 35, y: 5 },
    exits: {
      V: { x: 3, y: 3, to: 'village', spawn: { x: 5, y: 3 }, message: '森を抜け、はじまりの村へ戻った。' },
      C: { x: 47, y: 5, to: 'cave', spawn: { x: 35, y: 5 }, message: '冷たい風が吹く洞窟へ入った。' },
      M: { x: 47, y: 31, to: 'volcano', spawn: { x: 35, y: 25 }, message: '山道を越え、火山地帯へ進んだ。' }
    },
    layout: buildAreaMap({ exits: { V: { x: 3, y: 3 }, C: { x: 47, y: 5 }, M: { x: 47, y: 31 } }, enemies: [[8, 6, 'E'], [18, 14, 'E'], [30, 23, 'O']], walls: [
      { x: 7, from: 2, to: 27, gaps: [8, 17, 24] }, { x: 19, from: 2, to: 27, gaps: [5, 13, 21] }, { y: 15, from: 3, to: 36, gaps: [10, 25] }
    ] })
  },
  sea: {
    id: 'sea', name: '外洋', theme: 'sea',
    description: '船でのみ進入できる広大な海。潮流に注意しながら火山島の船着き場を探そう。',
    start: { x: 3, y: 3 },
    exits: {
      B: { x: 3, y: 3, to: 'port', spawn: { x: 20, y: 26 }, message: '船を港へ戻した。' },
      S: { x: 47, y: 31, to: 'volcano', spawn: { x: 35, y: 3 }, message: '火山島の船着き場へ上陸した。' }
    },
    layout: buildAreaMap({ exits: { B: { x: 3, y: 3 }, S: { x: 47, y: 31 } }, enemies: [[10, 8, 'E'], [21, 17, 'O'], [32, 8, 'E']], walls: [
      { x: 12, from: 2, to: 27, gaps: [6, 15, 23] }, { x: 25, from: 2, to: 27, gaps: [9, 19] }
    ] })
  },
  cave: {
    id: 'cave', name: '忘却の洞窟', theme: 'cave',
    description: '光の届かない洞窟。奥には核の欠片と火山へ抜ける溶岩洞がある。',
    start: { x: 35, y: 5 },
    exits: {
      F: { x: 3, y: 3, to: 'forest', spawn: { x: 35, y: 5 }, message: '洞窟を出て深緑の森へ戻った。' },
      M: { x: 47, y: 31, to: 'volcano', spawn: { x: 5, y: 25 }, message: '溶岩洞を抜け、火山の麓へ出た。' },
      N: { x: 47, y: 17, to: 'riverVillage', spawn: { x: 5, y: 5 }, message: '洞窟の出口を抜けると、川のせせらぎが聞こえるのどかな村に出た。' }
    },
    layout: buildAreaMap({ exits: { F: { x: 3, y: 3 }, M: { x: 47, y: 31 }, N: { x: 47, y: 17 } }, enemies: [[8, 7, 'E'], [19, 13, 'O'], [31, 23, 'E']], walls: [
      { x: 10, from: 2, to: 27, gaps: [7, 16, 24] }, { x: 21, from: 2, to: 27, gaps: [5, 14, 22] }, { y: 11, from: 3, to: 37, gaps: [8, 18, 29] }
    ] })
  },
  riverVillage: {
    id: 'riverVillage', name: 'のどかな川沿いの村', theme: 'river-village', safe: true, randomEncounters: false,
    description: '穏やかな川が村のそばを流れている。旅人たちが休息を取り、武具を整える静かな集落だ。ここではモンスターとのエンカウントは発生しない。',
    start: { x: 5, y: 5 },
    exits: { C: { x: 3, y: 5, to: 'cave', spawn: { x: 45, y: 17 }, message: '村を離れ、忘却の洞窟へ戻った。' } },
    layout: buildAreaMap({ width: 31, height: 21, defaultWalls: false, start: { x: 5, y: 5 }, exits: { C: { x: 3, y: 5 } }, shops: [[10, 5, 'A']], walls: [ { x: 15, from: 2, to: 18, gaps: [5, 13] }, { y: 10, from: 2, to: 28, gaps: [7, 21] }, { x: 24, from: 3, to: 18, gaps: [8, 15] } ] })
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
      S: { x: 47, y: 3, to: 'sea', spawn: { x: 35, y: 25 }, message: '船着き場から海へ戻った。' },
      I: { x: 47, y: 31, to: 'inlet', spawn: { x: 5, y: 40 }, message: '灰燼の火山の奥で、蒼白い光に満ちた神域の入江を見つけた。' }
    },
    layout: buildAreaMap({ exits: { F: { x: 3, y: 3 }, C: { x: 3, y: 25 }, S: { x: 47, y: 3 }, I: { x: 47, y: 31 } }, enemies: [[10, 7, 'O'], [22, 13, 'E'], [31, 22, 'O']], relics: [[34, 25]], walls: [
      { x: 12, from: 2, to: 27, gaps: [7, 16, 24] }, { x: 24, from: 2, to: 27, gaps: [5, 14, 22] }, { y: 18, from: 3, to: 37, gaps: [9, 20, 31] }
    ] })
  },
  inlet: {
    id: 'inlet', name: '神域の入江', theme: 'inlet',
    description: '空と水の境界が曖昧な、神秘の入江。水平線の向こうにも、淡い蒼光を帯びた島影と古代の石柱が続いている。遠近感は狂い、歩いても歩いても景色の全貌は見えない。ここは地図に収まる場所ではない。',
    start: { x: 5, y: 40 },
    exits: {
      V: { x: 3, y: 40, to: 'volcano', spawn: { x: 45, y: 30 }, message: '蒼い光の回廊を抜け、灰燼の火山へ戻った。' }
    },
    layout: buildAreaMap({
      width: 121, height: 81, defaultWalls: false,
      start: { x: 5, y: 40 },
      exits: { V: { x: 3, y: 40 } },
      walls: [
        { x: 18, from: 8, to: 29, gaps: [13, 24] },
        { x: 18, from: 48, to: 72, gaps: [55, 66] },
        { x: 34, from: 4, to: 20, gaps: [11] },
        { x: 34, from: 31, to: 49, gaps: [39] },
        { x: 34, from: 60, to: 77, gaps: [68] },
        { x: 51, from: 12, to: 34, gaps: [19, 28] },
        { x: 51, from: 45, to: 70, gaps: [54, 63] },
        { x: 68, from: 3, to: 24, gaps: [10, 18] },
        { x: 68, from: 34, to: 51, gaps: [42] },
        { x: 68, from: 61, to: 77, gaps: [69] },
        { x: 85, from: 10, to: 30, gaps: [17, 25] },
        { x: 85, from: 42, to: 72, gaps: [50, 62] },
        { x: 101, from: 3, to: 18, gaps: [9] },
        { x: 101, from: 29, to: 50, gaps: [36, 44] },
        { x: 101, from: 60, to: 77, gaps: [67] },
        { y: 17, from: 7, to: 29, gaps: [12, 22] },
        { y: 17, from: 40, to: 63, gaps: [47, 57] },
        { y: 17, from: 75, to: 111, gaps: [82, 96, 105] },
        { y: 31, from: 22, to: 46, gaps: [27, 39] },
        { y: 31, from: 59, to: 81, gaps: [65, 74] },
        { y: 45, from: 8, to: 28, gaps: [15, 23] },
        { y: 45, from: 39, to: 62, gaps: [46, 56] },
        { y: 45, from: 76, to: 111, gaps: [84, 98, 106] },
        { y: 59, from: 20, to: 44, gaps: [29, 37] },
        { y: 59, from: 55, to: 79, gaps: [63, 73] },
        { y: 71, from: 7, to: 31, gaps: [14, 24] },
        { y: 71, from: 43, to: 68, gaps: [51, 62] },
        { y: 71, from: 79, to: 111, gaps: [87, 100, 108] }
      ]
    })
  }
};
export const WORLD = AREAS.village;

export const ENEMIES = {
  hollowBeast: { id: 'hollowBeast', name: '虚ろな獣', kind: 'beast', maxHp: 16, attack: 4, defense: 1, exp: 8, gold: 3, description: '輪郭が揺らぐ小さな獣。' },
  oniScout: { id: 'oniScout', name: '鬼族の斥候', kind: 'oni', maxHp: 24, attack: 6, defense: 2, exp: 14, gold: 7, description: '波紋に弱い鬼族の斥候。' },
  lokiLaura: { id: 'lokiLaura', name: 'ローラ', kind: 'human', maxHp: 42, attack: 8, defense: 3, exp: 24, gold: 12, doubleAttackChance: 0.25, description: '時折、1ターンに2回攻撃する盗賊団ロキの一員。' },
  lokiRosa: { id: 'lokiRosa', name: 'ローザ', kind: 'human', maxHp: 38, attack: 7, defense: 3, exp: 24, gold: 12, spikeChance: 0.12, description: '稀にマキビシを投げ、踏んだ相手に継続ダメージを与える。' },
  lokiGilMash: { id: 'lokiGilMash', name: 'ギル・マッシュ', kind: 'human', maxHp: 52, attack: 9, defense: 4, rippleImmune: true, exp: 32, gold: 16, description: '波紋を無効化する盗賊団ロキの一員。' },
  lokiRoadman: { id: 'lokiRoadman', name: 'ロードマン', kind: 'human', maxHp: 62, attack: 10, defense: 5, normalAttackImmune: true, exp: 45, gold: 24, description: '通常攻撃を無効化する。アシスタント攻撃と波紋は有効。' }
};
export const ITEMS = {
  potion: { id: 'potion', name: '回復薬', description: 'HPを14回復する。', type: 'consumable', effect: 'heal', power: 14 },
  ether: { id: 'ether', name: '霊水', description: 'MPを5回復する。', type: 'consumable', effect: 'restoreMp', power: 5 },
  luckyScale: { id: 'luckyScale', name: '激運の天秤', description: '使用した戦闘で16%の確率でGOLD報酬が2倍になる。', type: 'consumable', effect: 'luckyScale' },
  bronzeSword: { id: 'bronzeSword', name: '青銅の剣', description: '攻撃力 +2。武器枠に装備する。', type: 'equipment', slot: 'weapon', attackBonus: 2 },
  roughWoodenSword: { id: 'roughWoodenSword', name: '粗削りの木刀', description: '攻撃力 +1。武器枠に装備する。', type: 'equipment', slot: 'weapon', attackBonus: 1 },
  ironSword: { id: 'ironSword', name: '鉄の剣', description: '攻撃力 +4。武器枠に装備する。', type: 'equipment', slot: 'weapon', attackBonus: 4 },
  leatherArmor: { id: 'leatherArmor', name: '革の鎧', description: '防御力 +2。防具枠に装備する。', type: 'equipment', slot: 'armor', defenseBonus: 2 },
  voidHideLightArmor: { id: 'voidHideLightArmor', name: '虚皮の軽装', description: '防御力 +1。防具枠に装備する。', type: 'equipment', slot: 'armor', defenseBonus: 1 },
  ironArmor: { id: 'ironArmor', name: '鉄の鎧', description: '防御力 +4。防具枠に装備する。', type: 'equipment', slot: 'armor', defenseBonus: 4 },
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
  S: { name: '火山島への船着き場', glyph: '⌁', className: 'tile-exit' },
  I: { name: '神域の入江への道', glyph: '✧', className: 'tile-exit' }, N: { name: 'のどかな川沿いの村への道', glyph: '⌄', className: 'tile-exit' }, D: { name: '雑貨屋', glyph: '店', className: 'tile-shop tile-shop-general' }, W: { name: '初級武器屋', glyph: '剣', className: 'tile-shop tile-shop-weapon' }, A: { name: '初級防具屋', glyph: '盾', className: 'tile-shop tile-shop-armor' }
};
