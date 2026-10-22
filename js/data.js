export const GAME_VERSION = '0.1.0';

export const WORLD = {
  id: 'first-frontier',
  name: '未踏の領域',
  description: '静かな遺跡。移動して、敵と戦い、核の欠片を見つけよう。',
  // # = wall, . = floor, P = player start, E = enemy, R = relic
  layout: [
    '###########',
    '#P....#...#',
    '#.....#E..#',
    '#.........#',
    '#.###.##..#',
    '#..E....R.#',
    '###########'
  ]
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
