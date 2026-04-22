/* ════════════════════════════════════════
   farming-config.js — 재배 계산기 상수 및 레시피
════════════════════════════════════════ */

export const UNITS = {
  SET_SIZE: 64,
  BOX_SIZE: 3456,
};

export const FARMING = {
  STAMINA_PER_USE: 7,
};

/* ── 스킬 ── */
export const SKILLS = {

  /* 🔥 불 더 올려! — 제작 시간 감소(%) */
  FURNACE: { reductionPct: [0, 10, 30, 40, 60, 80] },

  /* 💰 돈 좀 벌어볼까? — 요리 판매가 보너스(%) */
  MONEY_BONUS: { bonusPct: [0, 1, 2, 3, 4, 5, 6, 10, 15, 30, 50] },

  /* 🥘 한 솥 가득 — 3세트 이상 판매 시 보너스(%) */
  FULL_POT: { bonusPct: [0, 1, 2, 3, 4, 7] },

  /* ☘️ 자연이 주는 선물 — 아일랜드 채집 시 씨앗 추가 드롭 */
  NATURE_GIFT: {
    drops: [
      null,
      { pct: 1,  count: 1 },
      { pct: 2,  count: 1 },
      { pct: 3,  count: 1 },
      { pct: 4,  count: 1 },
      { pct: 5,  count: 2 },
      { pct: 6,  count: 2 },
      { pct: 7,  count: 3 },
      { pct: 8,  count: 4 },
      { pct: 9,  count: 5 },
      { pct: 10, count: 8 },
    ],
  },

  /* 🌾 오늘도 풍년이다! — 수확 시 작물 추가 드롭 */
  HARVEST_BONUS: {
    drops: [
      null,
      { pct: 1,  count: 1 },
      { pct: 2,  count: 1 },
      { pct: 3,  count: 1 },
      { pct: 4,  count: 1 },
      { pct: 5,  count: 2 },
      { pct: 7,  count: 2 },
      { pct: 10, count: 3 },
    ],
  },

  /* 🌱 씨앗은 덤이야 — 마을 수확 시 씨앗 드롭(%) */
  SEED_DROP: { pct: [0, 1, 2, 3, 4, 5, 6, 7, 10, 20, 30] },

  /* 🔥 불붙은 괭이 — 채집 시 베이스 추가 드롭 */
  FIRE_HOE: {
    drops: [
      null,
      { pct: 1,  count: 1 },
      { pct: 2,  count: 1 },
      { pct: 3,  count: 2 },
      { pct: 4,  count: 2 },
      { pct: 5,  count: 2 },
      { pct: 6,  count: 3 },
      { pct: 7,  count: 3 },
      { pct: 8,  count: 5 },
      { pct: 9,  count: 5 },
      { pct: 15, count: 7 },
    ],
  },
};

/* ── 각인석 ── */
export const ENGRAVING = {

  /* 🫘 씨앗 행운 — 채집 시 씨앗 추가 드롭 */
  SEED_LUCK: {
    drops: [
      null,
      { pct: 25,  count: 2 },
      { pct: 50,  count: 2 },
      { pct: 75,  count: 2 },
      { pct: 100, count: 2 },
    ],
  },

  /* 🌱 작물 상자 — 채집 시 작물 상자 등장(%) (씨앗 1~50개 기댓값=25.5) */
  CROP_BOX: { pct: [0, 1, 2, 3, 4, 5], avgSeeds: 25.5 },

  /* 🎲 농부 룰렛 */
  FARMER_ROULETTE: {
    dicePct:    [0, 1, 2, 3, 4, 5],
    normalMult: 6,
    goldenMult: 12,
    goldenPct:  10,
  },
};

/* ── 세이지 괭이 강화별 씨앗 드롭 수 ── */
export const HOE = [
  { seedDrop: 0 },  // 0강
  { seedDrop: 2 },  // 1강
  { seedDrop: 3 },  // 2강
  { seedDrop: 3 },  // 3강
  { seedDrop: 3 },  // 4강
  { seedDrop: 4 },  // 5강
  { seedDrop: 4 },  // 6강
  { seedDrop: 4 },  // 7강
  { seedDrop: 5 },  // 8강
  { seedDrop: 5 },  // 9강
  { seedDrop: 6 },  // 10강
  { seedDrop: 8 },  // 11강
  { seedDrop: 8 },  // 12강
  { seedDrop: 10 }, // 13강
  { seedDrop: 10 }, // 14강
  { seedDrop: 15 }, // 15강
];

/* ── 베이스 종류 ── */
export const BASES = {
  tomato: { name: '토마토 베이스', color: '#d94f3d' },
  onion:  { name: '양파 베이스',   color: '#c89c00' },
  garlic: { name: '마늘 베이스',   color: '#9ab0c8' },
};

/* ── 작물 묶음 ── */
export const CROPS = {
  pumpkin:    { name: '호박 묶음',        color: '#e07b2a' },
  potato:     { name: '감자 묶음',        color: '#c8a060' },
  carrot:     { name: '당근 묶음',        color: '#e07b2a' },
  beet:       { name: '비트 묶음',        color: '#9e3a5a' },
  watermelon: { name: '수박 묶음',        color: '#3a9e68' },
  sweetfruit: { name: '달콤한 열매 묶음', color: '#d94f3d' },
};

/* ── 밀키 고정 구매가 ── */
export const MILKY_PRICES = { salt: 2, egg: 3, milk: 3, oil: 4 };

/* ── 요리 레시피 ──
   materials.base  : { 베이스key: 개수 }
   materials.crops : { 작물key: 세트수 }
   materials.milky : { 재료key: 개수 }  — 밀키 고정가
   materials.other : { 재료key: 개수 }  — 유저 입력가
──────────────────── */
export const RECIPES = {
  TOMATO_SPAGHETTI: {
    name: '토마토 스파게티', grade: 'common',
    materials: { base:{tomato:1}, crops:{pumpkin:1},  milky:{},          other:{} },
    priceMin: 259,  priceMax: 864,  craftTimeSec: 60,
  },
  ONION_RING: {
    name: '어니언 링', grade: 'common',
    materials: { base:{onion:1},  crops:{potato:1},   milky:{},          other:{} },
    priceMin: 307,  priceMax: 1026, craftTimeSec: 60,
  },
  GARLIC_CAKE: {
    name: '갈릭 케이크', grade: 'common',
    materials: { base:{garlic:1}, crops:{carrot:1},   milky:{},          other:{} },
    priceMin: 226,  priceMax: 756,  craftTimeSec: 60,
  },
  PORK_TOMATO_STEW: {
    name: '삼겹살 토마토 찌개', grade: 'normal',
    materials: { base:{tomato:2}, crops:{beet:1},     milky:{salt:1},    other:{pork:1, pork_belly:1} },
    priceMin: 611,  priceMax: 2039, craftTimeSec: 120,
  },
  TRI_ICECREAM: {
    name: '삼색 아이스크림', grade: 'normal',
    materials: { base:{onion:2},  crops:{watermelon:1}, milky:{milk:1},  other:{coconut:1, sugar:1} },
    priceMin: 906,  priceMax: 3022, craftTimeSec: 120,
  },
  GARLIC_LAMB_HOTDOG: {
    name: '마늘 양갈비 핫도그', grade: 'normal',
    materials: { base:{garlic:2}, crops:{potato:1},   milky:{oil:1},     other:{lamb:1, lamb_rib:1} },
    priceMin: 513,  priceMax: 1713, craftTimeSec: 120,
  },
  SWEET_CEREAL: {
    name: '달콤 시리얼', grade: 'normal',
    materials: { base:{tomato:2}, crops:{sweetfruit:1}, milky:{oil:1},   other:{pineapple:1, flour:1} },
    priceMin: 773,  priceMax: 2578, craftTimeSec: 120,
  },
  ROAST_CHICKEN_PIE: {
    name: '로스트 치킨 파이', grade: 'normal',
    materials: { base:{garlic:2}, crops:{carrot:1},   milky:{},          other:{butter:1, chicken:1, chicken_leg:1} },
    priceMin: 640,  priceMax: 2134, craftTimeSec: 120,
  },
  SWEET_CHICKEN_BURGER: {
    name: '스윗 치킨 햄버거', grade: 'rare',
    materials: { base:{tomato:1,onion:1}, crops:{beet:1,sweetfruit:1}, milky:{}, other:{chicken_breast:1, chicken_leg:1} },
    priceMin: 970,  priceMax: 3234, craftTimeSec: 180,
  },
  TOMATO_PINEAPPLE_PIZZA: {
    name: '토마토 파인애플 피자', grade: 'rare',
    materials: { base:{tomato:2,garlic:1}, crops:{}, milky:{},           other:{pineapple:1, cheese:1, steak:1, beef_sirloin:1} },
    priceMin: 922,  priceMax: 3077, craftTimeSec: 180,
  },
  ONION_SOUP: {
    name: '양파 수프', grade: 'rare',
    materials: { base:{onion:2,garlic:1}, crops:{potato:1}, milky:{},    other:{coconut:1, butter:1, pork_front:1} },
    priceMin: 1139, priceMax: 3797, craftTimeSec: 180,
  },
  HERB_PORK_BELLY_STEAM: {
    name: '허브 삼겹살 찜', grade: 'rare',
    materials: { base:{garlic:2,onion:1}, crops:{pumpkin:1,potato:1}, milky:{}, other:{pork:1, pork_belly:1} },
    priceMin: 894,  priceMax: 2982, craftTimeSec: 180,
  },
  TOMATO_LASAGNA: {
    name: '토마토 라자냐', grade: 'epic',
    materials: { base:{tomato:1,onion:1,garlic:1}, crops:{carrot:1,pumpkin:1}, milky:{}, other:{flour:1, lamb_leg:1} },
    priceMin: 1253, priceMax: 4177, craftTimeSec: 300,
  },
  DEEP_CREAM_PANE: {
    name: '딥 크림 빠네', grade: 'epic',
    materials: { base:{tomato:1,onion:1,garlic:1}, crops:{watermelon:1,potato:1}, milky:{milk:1}, other:{cheese:1} },
    priceMin: 1151, priceMax: 3837, craftTimeSec: 300,
  },
  TRIPLE_BEEF_RIB_SKEWER: {
    name: '트리플 소갈비 꼬치', grade: 'epic',
    materials: { base:{tomato:1,onion:1,garlic:1}, crops:{carrot:1,beet:1}, milky:{}, other:{sugar:1, beef_rib:1} },
    priceMin: 1291, priceMax: 4307, craftTimeSec: 300,
  },
};

/* ── 기타 재료 메타 (이름/색상) ── */
export const OTHER_META = {
  coconut:       { name: '코코넛' },
  pineapple:     { name: '파인애플' },
  flour:         { name: '밀가루 반죽' },
  butter:        { name: '버터 조각' },
  cheese:        { name: '치즈 조각' },
  steak:         { name: '스테이크' },
  pork:          { name: '익힌 돼지고기' },
  pork_belly:    { name: '익힌 돼지 삼겹살' },
  pork_front:    { name: '익힌 돼지 앞다리살' },
  lamb:          { name: '익힌 양고기' },
  lamb_rib:      { name: '익힌 양 갈비살' },
  lamb_leg:      { name: '익힌 양 다리살' },
  chicken:       { name: '익힌 닭고기' },
  chicken_leg:   { name: '익힌 닭 다리살' },
  chicken_breast:{ name: '익힌 닭 가슴살' },
  beef_sirloin:  { name: '익힌 소 등심' },
  beef_rib:      { name: '익힌 소 갈비살' },
  sugar:         { name: '설탕 큐브' },
};

export const GRADE_COLOR = {
  common: { label: '커먼', color: '#8a7060', bg: '#f7f3ee' },
  normal: { label: '노멀', color: '#3a9e68', bg: '#edf8f2' },
  rare:   { label: '레어', color: '#3d6fd4', bg: '#eef3fd' },
  epic:   { label: '에픽', color: '#7c52c8', bg: '#f3effe' },
};

export const DEFAULT_PRICES = {
  bases: { tomato: 0, onion: 0, garlic: 0 },
  seeds: { tomato: 0, onion: 0, garlic: 0 },
  crops: { pumpkin: 0, potato: 0, carrot: 0, beet: 0, watermelon: 0, sweetfruit: 0 },
  other: {
    coconut:0, pineapple:0, flour:0, butter:0, cheese:0, steak:0,
    pork:0, pork_belly:0, pork_front:0,
    lamb:0, lamb_rib:0, lamb_leg:0,
    chicken:0, chicken_leg:0, chicken_breast:0,
    beef_sirloin:0, beef_rib:0, sugar:0,
  },
};