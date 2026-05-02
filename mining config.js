/* ════════════════════════════════════════
   mining config.js (파일명: mining config.js — 공백 포함)
   수치 변경은 이 파일만 수정하세요.
════════════════════════════════════════ */

export const SKILLS = {
  FURNACE:    { reductionPct: [0, 10, 30, 40, 60, 80] },
  INGOT_SELL: { bonusPct: [0, 5, 7, 10, 20, 30, 50] },
  GEM_SELL:   { bonusPct: [0, 5, 7, 10, 20, 30, 50] },
  COBYTIME:   { dropPct: [0, 1, 1.5, 2, 2.5, 3, 4, 5] },
  SPARKLE: {
    drops: [
      null,
      { pct: 3,  count: 1 },
      { pct: 7,  count: 1 },
      { pct: 10, count: 2 },
    ],
  },
  LUCKY_HIT: {
    drops: [
      null,
      { pct: 1,  count: 1  },
      { pct: 2,  count: 2  },
      { pct: 3,  count: 3  },
      { pct: 4,  count: 4  },
      { pct: 5,  count: 6  },
      { pct: 6,  count: 8  },
      { pct: 7,  count: 10 },
      { pct: 8,  count: 12 },
      { pct: 10, count: 16 },
      { pct: 15, count: 20 },
    ],
  },
  FIRE_PICK: { dropPct: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 15] },
  PRECIOUS:  { bonusPct: [0, 5, 7, 10, 15, 20, 30] },
};

export const MINING = {
  STAMINA_PER_USE: 10,
};

export const PICKAXE = [
  { oresPerUse:  1, artifactPct:  0, cobbyPct:  0 },
  { oresPerUse:  2, artifactPct:  0, cobbyPct:  0 },
  { oresPerUse:  3, artifactPct:  1, cobbyPct:  1 },
  { oresPerUse:  3, artifactPct:  1, cobbyPct:  1 },
  { oresPerUse:  3, artifactPct:  1, cobbyPct:  2 },
  { oresPerUse:  4, artifactPct:  2, cobbyPct:  2 },
  { oresPerUse:  4, artifactPct:  2, cobbyPct:  3 },
  { oresPerUse:  4, artifactPct:  2, cobbyPct:  3 },
  { oresPerUse:  5, artifactPct:  3, cobbyPct:  4 },
  { oresPerUse:  5, artifactPct:  3, cobbyPct:  5 },
  { oresPerUse:  5, artifactPct:  3, cobbyPct:  6 },
  { oresPerUse:  6, artifactPct:  5, cobbyPct:  7 },
  { oresPerUse:  6, artifactPct:  5, cobbyPct:  8 },
  { oresPerUse:  7, artifactPct:  5, cobbyPct: 10 },
  { oresPerUse:  7, artifactPct:  5, cobbyPct: 13 },
  { oresPerUse: 12, artifactPct: 10, cobbyPct: 15 },
];

export const ARTIFACT = {
  tiers: [
    { points: 100,  pct: 40 },
    { points: 200,  pct: 25 },
    { points: 300,  pct: 20 },
    { points: 500,  pct: 10 },
    { points: 1000, pct:  5 },
  ],
  get avgPoints() {
    return this.tiers.reduce((s, t) => s + t.points * t.pct / 100, 0);
  },
};

export const INGOT_RECIPES = {
  CORUM:  { ores_per_ingot: 16, torch_per_ingot: 2, craft_time_sec: 20 },
  RIFTON: { ores_per_ingot: 16, torch_per_ingot: 4, craft_time_sec: 25 },
  SERENT: { ores_per_ingot: 16, torch_per_ingot: 8, craft_time_sec: 30 },
};

export const RECIPES = {
  LS1: {
    ingot_corum: 1, ingot_rifton: 0, ingot_serent: 0,
    vanilla: { cobblestone: 2, copper: 8, redstone: 3 },
    craft_time_sec: 60,
  },
  LS2: {
    ingot_corum: 0, ingot_rifton: 2, ingot_serent: 0,
    vanilla: { deepslate_cobblestone: 2, iron: 5, lapis: 5, diamond: 3 },
    craft_time_sec: 120,
  },
  LS3: {
    ingot_corum: 0, ingot_rifton: 0, ingot_serent: 3,
    vanilla: { copper: 30, amethyst: 20, iron: 7, gold: 7, diamond: 5 },
    craft_time_sec: 300,
  },
  ABIL: {
    ingot_corum: 1, ingot_rifton: 1, ingot_serent: 1,
    vanilla: {},
    craft_time_sec: 120,
  },
  TOPAZ_BOX: {
    ingot_corum: 20, ingot_rifton: 0, ingot_serent: 0,
    vanilla: { topaz: 3, redstone: 64, lapis: 64, gold: 10, diorite: 64 },
    doc: 1,
    craft_time_sec: 3600,
  },
  SAPPHIRE_STATUE: {
    ingot_corum: 0, ingot_rifton: 20, ingot_serent: 0,
    vanilla: { sapphire: 3, redstone: 64, lapis: 64, gold: 10, tuff: 64 },
    doc: 1,
    craft_time_sec: 3600,
  },
  PLATINUM_CROWN: {
    ingot_corum: 0, ingot_rifton: 0, ingot_serent: 20,
    vanilla: { platinum: 3, redstone: 64, lapis: 64, gold: 10, andesite: 64 },
    doc: 1,
    craft_time_sec: 3600,
  },
};

export const PRECIOUS = {
  APPRAISAL: {
    LOW:   { pct: 60, label: '낮은 품질' },
    GOOD:  { pct: 30, label: '우수'      },
    ROYAL: { pct: 10, label: '황실인증'  },
  },
  ITEMS: {
    TOPAZ_BOX: {
      name: '토파즈 보석함',
      recipe: 'TOPAZ_BOX',
      ingotType: 'corum',
      prices: { LOW: 295000, GOOD: 413000, ROYAL: 590000 },
    },
    SAPPHIRE_STATUE: {
      name: '사파이어 조각상',
      recipe: 'SAPPHIRE_STATUE',
      ingotType: 'rifton',
      prices: { LOW: 297500, GOOD: 416500, ROYAL: 595000 },
    },
    PLATINUM_CROWN: {
      name: '플레티넘 왕관',
      recipe: 'PLATINUM_CROWN',
      ingotType: 'serent',
      prices: { LOW: 300000, GOOD: 420000, ROYAL: 600000 },
    },
  },
  DOC_PRICE: 10000,
};

export const TORCH = {
  craft_time_sec: 7,
};

export const ENGRAVING = {
  ORE_LUCK:       { extraOrePct:      [0, 25, 50, 75, 100] },
  RELIC_SEARCH:   { extraArtifactPct: [0, 1, 3, 5] },
  COBBY_SUMMON:   { extraCobbyPct:    [0, 1, 3, 5] },
  GEM_COBBY:      { gemConvertPct:    [0, 5, 10, 20, 30, 50] },
  MINE_CART: {
    cartPct:   [0, 0.5, 1, 1.5, 2, 3],
    minRelics: 1,
    maxRelics: 3,
  },
  MINER_ROULETTE: {
    dicePct:    [0, 1, 2, 3, 4, 5],
    normalMult: 6,
    goldenMult: 12,
    goldenPct:  10,
  },
};

export const MARKET_FEE = 0.05;

/* ════════════════════════════════════════
   기본 시장가 — 자동채우기 기준값
   ★ 실제 시세 바뀌면 이 블록만 수정

   단위:
     ingot/gem  : 원/개
     ls1/2/3    : 원/개 (거래소 등록가, 수수료 5% 자동 차감)
     abil       : 원/개 (거래소 등록가)
     vanilla    : 원/개 → autoFill 시 ×64 하여 세트당 필드에 채움
     precious   : 원/개
     stone      : 원/개 → autoFill 시 ×64 변환
     charcoal   : 원/개 → autoFill 시 ×64 변환
     wood       : 원/개 → autoFill 시 ×64 변환
     skillPulse : 원/개
     artifactPt : 원/100pt
════════════════════════════════════════ */
export const DEFAULT_PRICES = {
  ingot: {
    corum:  5708,
    rifton: 5845,
    serent: 5901,
  },
  gem: {
    corum:  7000,
    rifton: 7500,
    serent: 8000,
  },
  /* ★ 라이프스톤·어빌리티 스톤 — 거래소 등록가(원/개) */
  ls1:  14688,    // 하급 라이프스톤 — 실제 시세로 교체
  ls2:  39623,    // 중급 라이프스톤
  ls3:  72647,    // 상급 라이프스톤
  abil: 17032,    // 어빌리티 스톤
  vanilla: {
    cobblestone:           1266,
    deepslate_cobblestone:  317,
    copper:                 170,
    iron:                  1347,
    gold:                  1989,
    diamond:               3090,
    redstone:               501,
    lapis:                  1001,
    amethyst:               142,
  },
  precious: {
    topaz:    85154,
    sapphire: 82923,
    platinum: 88470,
  },
  stone: {
    diorite:   62,
    tuff:      20,
    andesite:  54,
  },
  charcoal:   22,
  wood:       15,
  skillPulse:  474,
  artifactPt: 7043,
};

export const UNITS = {
  SET_SIZE:     64,
  SETS_PER_BOX: 54,
  BOX_SIZE:     3456,
};
