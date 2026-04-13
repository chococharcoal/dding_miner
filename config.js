/* ════════════════════════════════════════
   config.js — 고정 상수 및 레시피 데이터
   수치 변경은 이 파일만 수정하세요
════════════════════════════════════════ */

/* ── 스킬 ── */
export const SKILLS = {
  FURNACE: {
    name: '초고속 용광로',
    maxLevel: 5,
    reductionPct: [0, 10, 30, 40, 60, 80],
  },
  INGOT_SELL: {
    name: '주괴 좀 사',
    maxLevel: 6,
    bonusPct: [0, 5, 7, 10, 20, 30, 50],
  },
  GEM_SELL: {
    name: '반짝반짝 눈이 부셔',
    maxLevel: 6,
    bonusPct: [0, 5, 7, 10, 20, 30, 50],
  },
  COBYTIME: {
    name: '코비타임',
    maxLevel: 7,
    dropPct: [0, 1, 1.5, 2, 2.5, 3, 4, 5],
  },
  SPARKLE: {
    name: '반짝임의 시작',
    maxLevel: 3,
    // [레벨]: { pct: 드롭확률(%), count: 개수 }
    drops: [
      null,
      { pct: 3, count: 1 },
      { pct: 7, count: 1 },
      { pct: 10, count: 2 },
    ],
  },
  LUCKY_HIT: {
    name: '럭키히트',
    maxLevel: 10,
    // [레벨]: { pct: 확률(%), count: 추가드롭 개수 }
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
  FIRE_PICK: {
    name: '불붙은 곡괭이',
    maxLevel: 10,
    dropPct: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 15],
  },
  PRECIOUS: {
    name: '귀하신 몸값',
    maxLevel: 6,
    bonusPct: [0, 5, 7, 10, 15, 20, 30],
  },
};

/* ── 채굴 기본값 ── */
export const MINING = {
  STAMINA_PER_USE: 10,
};

/* ── 곡괭이 강화별 데이터 (0강~15강) ──────────────────────────
   oresPerUse    : 채굴 1회당 평균 광석 수
   artifactPct   : 유물 드롭 확률 (%)
   cobbyPct      : 코비 소환 확률 (%) — 스킬/각인석과 합연산
════════════════════════════════════════ */
export const PICKAXE = [
  /* 0강 */ { oresPerUse:  0, artifactPct:  0, cobbyPct:  0 },
  /* 1강 */ { oresPerUse:  2, artifactPct:  0, cobbyPct:  0 },
  /* 2강 */ { oresPerUse:  3, artifactPct:  1, cobbyPct:  1 },
  /* 3강 */ { oresPerUse:  3, artifactPct:  1, cobbyPct:  1 },
  /* 4강 */ { oresPerUse:  3, artifactPct:  1, cobbyPct:  2 },
  /* 5강 */ { oresPerUse:  4, artifactPct:  2, cobbyPct:  2 },
  /* 6강 */ { oresPerUse:  4, artifactPct:  2, cobbyPct:  3 },
  /* 7강 */ { oresPerUse:  4, artifactPct:  2, cobbyPct:  3 },
  /* 8강 */ { oresPerUse:  5, artifactPct:  3, cobbyPct:  4 },
  /* 9강 */ { oresPerUse:  5, artifactPct:  3, cobbyPct:  5 },
  /*10강 */ { oresPerUse:  5, artifactPct:  3, cobbyPct:  6 },
  /*11강 */ { oresPerUse:  6, artifactPct:  5, cobbyPct:  7 },
  /*12강 */ { oresPerUse:  6, artifactPct:  5, cobbyPct:  8 },
  /*13강 */ { oresPerUse:  7, artifactPct:  5, cobbyPct: 10 },
  /*14강 */ { oresPerUse:  7, artifactPct:  5, cobbyPct: 13 },
  /*15강 */ { oresPerUse: 12, artifactPct: 10, cobbyPct: 15 },
];

/* ── 유물 (아티팩트) ──
   채굴시 artifactPct 확률로 드롭, 5종 중 하나 랜덤
   ────────────────────────────────────── */
export const ARTIFACT = {
  tiers: [
    { points: 100,  pct: 40 },
    { points: 200,  pct: 25 },
    { points: 300,  pct: 20 },
    { points: 500,  pct: 10 },
    { points: 1000, pct:  5 },
  ],
  // 평균 포인트 = 각 tier의 가중평균
  get avgPoints() {
    return this.tiers.reduce((s, t) => s + t.points * t.pct / 100, 0);
  },
};

/* ── 주괴 제작 레시피 ── */
export const INGOT_RECIPES = {
  CORUM:  { ores_per_ingot: 16 },
  RIFTON: { ores_per_ingot: 16 },
  SERENT: { ores_per_ingot: 16 },
};

/* ── 제작물 레시피 ── */
export const RECIPES = {
  LS1: {
    ingot_corum: 1, ingot_rifton: 0, ingot_serent: 0,
    vanilla: { cobblestone: 12, copper: 8, redstone: 3 },
    craft_time_sec: 0,
  },
  LS2: {
    ingot_corum: 0, ingot_rifton: 2, ingot_serent: 0,
    vanilla: { deepslate_cobblestone: 128, iron: 5, lapis: 5, diamond: 3 },
    craft_time_sec: 0,
  },
  LS3: {
    ingot_corum: 0, ingot_rifton: 0, ingot_serent: 3,
    vanilla: { copper: 30, amethyst: 20, iron: 7, gold: 7, diamond: 5 },
    craft_time_sec: 0,
  },
  ABIL: {
    ingot_corum: 1, ingot_rifton: 1, ingot_serent: 1,
    vanilla: {},
    craft_time_sec: 0,
  },
  /* ── 귀중품 ── */
  TOPAZ_BOX: {
    ingot_corum: 32,
    vanilla: {
      topaz: 3,
      redstone: 64,
      lapis: 6,
      gold: 10,
      stalactite: 64,
    },
    doc: 1,
    craft_time_sec: 0,
  },
  SAPPHIRE_STATUE: {
    ingot_rifton: 32,
    vanilla: {
      sapphire: 3,
      redstone: 64,
      lapis: 6,
      gold: 10,
      tuff: 64,
    },
    doc: 1,
    craft_time_sec: 0,
  },
  PLATINUM_CROWN: {
    ingot_serent: 32,
    vanilla: {
      platinum: 3,
      redstone: 64,
      lapis: 6,
      gold: 10,
      glow_lichen: 64,
    },
    doc: 1,
    craft_time_sec: 0,
  },
};

/* ── 귀중품 감정 시스템 ──────────────────────────────────────
   감정 등급: LOW(60%), GOOD(30%), ROYAL(10%)
   판매가(골드) — 순서: LOW / GOOD / ROYAL
════════════════════════════════════════ */
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
      prices: { LOW: 281772, GOOD: 394481, ROYAL: 563544 },
    },
    SAPPHIRE_STATUE: {
      name: '사파이어 조각상',
      recipe: 'SAPPHIRE_STATUE',
      prices: { LOW: 282671, GOOD: 395739, ROYAL: 565341 },
    },
    PLATINUM_CROWN: {
      name: '플레티넘 왕관',
      recipe: 'PLATINUM_CROWN',
      prices: { LOW: 279445, GOOD: 391223, ROYAL: 558890 },
    },
  },
};

/* ── 강화횃불 ── */
export const TORCH = {
  craft_time_sec: 7,
};

/* ── 각인석 효과 (스킬/곡괭이와 합연산) ──────────────────────
   모든 수치는 확률(%) 또는 개수(count) 단위
════════════════════════════════════════ */
export const ENGRAVING = {
  ORE_LUCK: {
    name: '광물행운',
    maxLevel: 4,
    // 채굴시 해당 확률로 광석 1개 추가
    extraOrePct: [0, 25, 50, 75, 100],
  },
  RELIC_SEARCH: {
    name: '유물탐색',
    maxLevel: 3,
    // 유물 드롭 확률 추가(%)
    extraArtifactPct: [0, 1, 3, 5],
  },
  COBBY_SUMMON: {
    name: '코비 소환',
    maxLevel: 3,
    // 코비 소환 확률 추가(%)
    extraCobbyPct: [0, 1, 3, 5],
  },
  GEM_COBBY: {
    name: '보석 코비',
    maxLevel: 5,
    // 코비 등장시 보석코비로 전환 확률(%)
    gemConvertPct: [0, 3, 5, 10, 20, 30],
  },
  MINE_CART: {
    name: '광산수레',
    maxLevel: 5,
    // 채굴시 광산수레 등장 확률(%) — 수레 파괴시 유물 1~3개 랜덤
    cartPct: [0, 0.5, 1, 1.5, 2, 3],
    minRelics: 1,
    maxRelics: 3,
  },
  MINER_ROULETTE: {
    name: '광부룰렛',
    maxLevel: 5,
    // 채굴시 주사위 등장 확률(%)
    dicePct: [0, 0.5, 1, 1.5, 2, 3],
    // 주사위: 눈수×4 광석 / 황금주사위(10%): 눈수×8 광석
    normalMult: 4,
    goldenMult: 8,
    goldenPct: 10,
  },
};

/* ── 기본 시장가 (UI 초기값) ── */
export const DEFAULT_PRICES = {
  ingot: { corum: 3500, rifton: 3750, serent: 4000 },
  gem:   { corum: 7000, rifton: 7500, serent: 8000 },
};

/* ── 단위 ── */
export const UNITS = {
  SET_SIZE:     64,
  SETS_PER_BOX: 54,
  BOX_SIZE:     3456,
};