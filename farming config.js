/* ════════════════════════════════════════
   farming config.js — 재배 계산기 상수 및 레시피
   수치 변경은 이 파일만 수정하세요.

   ★ 씨앗·작물 묶음 가격: 원/개 → HTML에서 ×64 하여 세트당 표시
   ★ 기타 재료(고기류 등) 가격: 원/세트 → HTML에서 그대로 세트당 표시
   ★ 베이스 가격: 씨앗 가격 기반으로 자동 계산 (항목 없음)
   ★ 중간재료(요리용소금·버터·치즈·밀가루반죽) 원가: 밀키 고정가 + 건초더미 가격으로 자동 계산
   ★ currentPrice → 요리 가격이 바뀔 때마다 수동 업데이트
════════════════════════════════════════ */

export const UNITS = {
  SET_SIZE: 64,    // 1세트 = 64개
  BOX_SIZE: 3456,  // 1상자 = 54세트 = 3456개
};

/* ── 채집·재배 기본 상수 ── */
export const FARMING = {
  STAMINA_PER_USE: 7,       // 아일랜드 채집 1회당 스태미나 소모량
  CROPS_PER_BASE:  8,       // 작물 8개 → 베이스 1개 제작

  /* 씨앗 1개당 기본 수확 범위 (균등 분포 → 평균으로 계산) */
  HARVEST_RANGE: {
    tomato: { min: 1, max: 3 }, // 평균 2.0개
    onion:  { min: 1, max: 2 }, // 평균 1.5개
    garlic: { min: 1, max: 4 }, // 평균 2.5개
  },

  /* 대왕 작물 — 스킬로 확률 증가 가능 */
  KING_CROP_BASE_PCT: 0.02, // 스킬 0레벨 기본 확률 (%)
  KING_CROP_MULT:     7,    // 대왕 작물 드롭 배율 (일반 수확량의 7배)
};

/* ════════════════════════════════════════
   스킬 데이터
   인덱스 = 스킬 레벨 (0 = 미습득)
════════════════════════════════════════ */
export const SKILLS = {

  /* 🔥 불 더 올려! — 요리 제작 시간 감소(%) */
  FURNACE: { reductionPct: [0, 10, 30, 40, 60, 80] },

  /* 💰 돈 좀 벌어볼까? — 요리 판매가 보너스(%) */
  MONEY_BONUS: { bonusPct: [0, 1, 2, 3, 4, 5, 6, 10, 15, 30, 50] },

  /* 🥘 한 솥 가득 — 3세트 이상 판매 시 추가 보너스(%) */
  FULL_POT: { bonusPct: [0, 1, 2, 3, 4, 7] },

  /* ☘️ 자연이 주는 선물 — 아일랜드 채집 시 씨앗 추가 드롭
     pct: 발동 확률(%), count: 추가 드롭 개수 */
  NATURE_GIFT: {
    drops: [
      null,                     // Lv0 미습득
      { pct: 1,  count: 1 },   // Lv1
      { pct: 2,  count: 1 },   // Lv2
      { pct: 3,  count: 1 },   // Lv3
      { pct: 4,  count: 1 },   // Lv4
      { pct: 5,  count: 2 },   // Lv5
      { pct: 6,  count: 2 },   // Lv6
      { pct: 7,  count: 3 },   // Lv7
      { pct: 8,  count: 4 },   // Lv8
      { pct: 9,  count: 5 },   // Lv9
      { pct: 10, count: 8 },   // Lv10
    ],
  },

  /* 🔥 불붙은 괭이 — 아일랜드 채집 시 베이스 추가 드롭
     pct: 발동 확률(%), count: 추가 드롭 개수 */
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

  /* 🌾 오늘도 풍년이다! — 마을 수확 시 작물 추가 드롭
     pct: 발동 확률(%), count: 추가 드롭 개수 */
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

  /* 🌱 씨앗은 덤이야 — 마을 수확 시 씨앗 추가 드롭 확률(%) */
  SEED_DROP: { pct: [0, 1, 2, 3, 4, 5, 6, 7, 10, 20, 30] },

  /* 👑 왕크니깐 왕좋아 — 대왕작물 등장 확률 증가(%)
     레벨 0: 기본 0.02% (FARMING.KING_CROP_BASE_PCT)
     레벨 1~4: 아래 pct 값으로 완전 대체 */
  KING_CROP: { pct: [0.02, 0.5, 1, 3, 5] }, // 인덱스 = 스킬 레벨
};

/* ════════════════════════════════════════
   각인석 데이터
   인덱스 = 각인석 등급 (0 = 미장착)
════════════════════════════════════════ */
export const ENGRAVING = {

  /* 🫘 씨앗 행운 — 아일랜드 채집 시 씨앗 추가 드롭
     pct: 발동 확률(%), count: 추가 드롭 개수 */
  SEED_LUCK: {
    drops: [
      null,
      { pct: 25,  count: 2 },  // I
      { pct: 50,  count: 2 },  // II
      { pct: 75,  count: 2 },  // III
      { pct: 100, count: 2 },  // IV
    ],
  },

  /* 🌱 작물 상자 — 아일랜드 채집 시 작물 상자 등장 확률(%)
     상자에서 씨앗 1~50개 드롭, 기댓값 25.5개 */
  CROP_BOX: { pct: [0, 1, 2, 3, 4, 5], avgSeeds: 25.5 },

  /* 🎲 농부 룰렛 — 아일랜드 채집 시 주사위 발동
     주사위 눈×6개 씨앗, 골드주사위(10% 확률)는 눈×12개 */
  FARMER_ROULETTE: {
    dicePct:    [0, 1, 2, 3, 4, 5], // 등급별 발동 확률(%)
    normalMult: 6,                   // 일반 주사위 배율
    goldenMult: 12,                  // 골드 주사위 배율
    goldenPct:  10,                  // 골드 주사위 발동 확률(%)
  },
};

/* ── 세이지 괭이 강화별 씨앗 드롭 수 ── */
export const HOE = [
  { seedDrop: 0  }, // 0강
  { seedDrop: 2  }, // 1강
  { seedDrop: 3  }, // 2강
  { seedDrop: 3  }, // 3강
  { seedDrop: 3  }, // 4강
  { seedDrop: 4  }, // 5강
  { seedDrop: 4  }, // 6강
  { seedDrop: 4  }, // 7강
  { seedDrop: 5  }, // 8강
  { seedDrop: 5  }, // 9강
  { seedDrop: 6  }, // 10강
  { seedDrop: 8  }, // 11강
  { seedDrop: 8  }, // 12강
  { seedDrop: 10 }, // 13강
  { seedDrop: 10 }, // 14강
  { seedDrop: 15 }, // 15강
];

/* ── 베이스 종류 ──
   seedType: 베이스를 만드는 데 사용하는 씨앗 종류 (원가 계산에 사용) */
export const BASES = {
  tomato: { name: '토마토 베이스', color: '#d94f3d', seedType: 'tomato' },
  onion:  { name: '양파 베이스',   color: '#c89c00', seedType: 'onion'  },
  garlic: { name: '마늘 베이스',   color: '#9ab0c8', seedType: 'garlic' },
};

/* ── 작물 묶음 ──
   color: UI 표시용 색상 */
export const CROPS = {
  pumpkin:    { name: '호박 묶음',        color: '#e07b2a' },
  potato:     { name: '감자 묶음',        color: '#c8a060' },
  carrot:     { name: '당근 묶음',        color: '#e67e22' },
  beet:       { name: '비트 묶음',        color: '#9e3a5a' },
  watermelon: { name: '수박 묶음',        color: '#3a9e68' },
  sweetfruit: { name: '달콤한 열매 묶음', color: '#d94f3d' },
  hay:        { name: '건초더미',          color: '#c8a020' }, // 밀 9개로 구성
  sugar:      { name: '설탕 큐브 묶음',   color: '#9090a0' }, // 작물 묶음 (64개 기준)
};

/* ── 밀키 고정 구매가 (원/개) ──
   소금·달걀·우유·오일은 밀키 상점에서 고정가로 구매 가능 */
export const MILKY_PRICES = {
  salt: 2,  // 소금 1개 = 2원
  egg:  3,  // 달걀 1개 = 3원
  milk: 3,  // 우유 1개 = 3원
  oil:  4,  // 오일 1개 = 4원
};

/* ── 중간 재료 레시피 ──
   요리에 들어가는 가공 재료들의 제작 원료 정의
   재료비 계산 시 이 레시피로 원가를 역산함
   단위: 개 기준 */
export const PROCESSED_RECIPES = {
  /* 요리용 소금 1개 = 소금 16개 */
  cooking_salt: {
    name: '요리용 소금',
    color: '#a0b8c8',
    ingredients: { salt: 16 },
  },
  /* 버터 조각 1개 = 우유 8개 + 소금 4개 + 오일 4개 */
  butter: {
    name: '버터 조각',
    color: '#f0c040',
    ingredients: { milk: 8, salt: 4, oil: 4 },
  },
  /* 치즈 조각 1개 = 우유 8개 + 소금 8개 */
  cheese: {
    name: '치즈 조각',
    color: '#d4a820',
    ingredients: { milk: 8, salt: 8 },
  },
  /* 밀가루 반죽 1개 = 밀 12개 + 달걀 4개
     밀은 건초더미에서 역산: 건초더미 1개 = 밀 9개
     → 밀 12개 = 건초더미 12/9 = 1.333개 */
  flour: {
    name: '밀가루 반죽',
    color: '#e8d0a0',
    ingredients: { wheat: 12, egg: 4 }, // wheat = 밀 (건초더미로 환산)
  },
};

/* ── 기타 재료 메타 (UI 표시용) ── */
export const OTHER_META = {
  /* 중간 가공 재료 */
  cooking_salt:  { name: '요리용 소금',     color: '#7090a8', isProcessed: true },
  butter:        { name: '버터 조각',        color: '#c8980c', isProcessed: true },
  cheese:        { name: '치즈 조각',        color: '#b89010', isProcessed: true },
  flour:         { name: '밀가루 반죽',      color: '#c0a870', isProcessed: true },
  /* 기타 재료 */
  coconut:       { name: '코코넛',           color: '#8b6914' },
  pineapple:     { name: '파인애플',         color: '#c8a000' },
  /* 고기류 (스테이크 포함) */
  steak:         { name: '스테이크',         color: '#8b4513' },
  pork:          { name: '익힌 돼지고기',    color: '#c07050' },
  pork_belly:    { name: '익힌 삼겹살',      color: '#c06040' },
  pork_front:    { name: '익힌 앞다리살',    color: '#b86050' },
  lamb:          { name: '익힌 양고기',      color: '#a07860' },
  lamb_rib:      { name: '익힌 양 갈비살',   color: '#987060' },
  lamb_leg:      { name: '익힌 양 다리살',   color: '#906858' },
  chicken:       { name: '익힌 닭고기',      color: '#c89050' },
  chicken_leg:   { name: '익힌 닭 다리살',   color: '#c08040' },
  chicken_breast:{ name: '익힌 닭 가슴살',   color: '#c09060' },
  beef_sirloin:  { name: '익힌 소 등심',     color: '#a04030' },
  beef_rib:      { name: '익힌 소 갈비살',   color: '#983828' },
};

/* ════════════════════════════════════════
   요리 레시피
   ★ currentPrice — 가격 변동 시 수동 업데이트 (원/개), 0이면 판매가 미입력
   ★ base 원가 — 씨앗 가격 기반으로 자동 계산
   ★ crops 수량 = 묶음(세트) 기준 (1묶음 = 64개)
   ★ milky 수량 = 개 기준 (밀키 고정가 자동 적용)
   ★ other 수량 = 개 기준 (가공재료 포함, 원가 자동 계산)
════════════════════════════════════════ */
export const RECIPES = {
  /* ── 커먼 요리 ── */
  TOMATO_SPAGHETTI: {
    name: '토마토 스파게티', grade: 'common',
    currentPrice: 718,
    priceMin: 259, priceMax: 864, craftTimeSec: 60,
    materials: { base:{tomato:1}, crops:{pumpkin:1}, milky:{}, other:{} },
  },
  ONION_RING: {
    name: '어니언 링', grade: 'common',
    currentPrice: 616,
    priceMin: 307, priceMax: 1026, craftTimeSec: 60,
    materials: { base:{onion:1}, crops:{potato:1}, milky:{}, other:{} },
  },
  GARLIC_CAKE: {
    name: '갈릭 케이크', grade: 'common',
    currentPrice: 459,
    priceMin: 226, priceMax: 756, craftTimeSec: 60,
    materials: { base:{garlic:1}, crops:{carrot:1}, milky:{}, other:{} },
  },

  /* ── 노멀 요리 ── */
  PORK_TOMATO_STEW: {
    name: '삼겹살 토마토 찌개', grade: 'normal',
    currentPrice: 1052,
    priceMin: 611, priceMax: 2039, craftTimeSec: 120,
    // 요리용 소금 1개 사용
    materials: { base:{tomato:2}, crops:{beet:1}, milky:{}, other:{cooking_salt:1, pork:1, pork_belly:1} },
  },
  TRI_ICECREAM: {
    name: '삼색 아이스크림', grade: 'normal',
    currentPrice: 1853,
    priceMin: 906, priceMax: 3022, craftTimeSec: 120,
    materials: { base:{onion:2}, crops:{watermelon:1,sugar:1}, milky:{milk:1}, other:{coconut:1} },
  },
  GARLIC_LAMB_HOTDOG: {
    name: '마늘 양갈비 핫도그', grade: 'normal',
    currentPrice: 725,
    priceMin: 513, priceMax: 1713, craftTimeSec: 120,
    materials: { base:{garlic:2}, crops:{potato:1}, milky:{oil:1}, other:{lamb:1, lamb_rib:1} },
  },
  SWEET_CEREAL: {
    name: '달콤 시리얼', grade: 'normal',
    currentPrice: 806,
    priceMin: 773, priceMax: 2578, craftTimeSec: 120,
    materials: { base:{tomato:2}, crops:{sweetfruit:1}, milky:{oil:1}, other:{pineapple:1, flour:1} },
  },
  ROAST_CHICKEN_PIE: {
    name: '로스트 치킨 파이', grade: 'normal',
    currentPrice: 2049,
    priceMin: 640, priceMax: 2134, craftTimeSec: 120,
    // 버터 조각 1개 사용
    materials: { base:{garlic:2}, crops:{carrot:1}, milky:{}, other:{butter:1, chicken:1, chicken_leg:1} },
  },

  /* ── 레어 요리 ── */
  SWEET_CHICKEN_BURGER: {
    name: '스윗 치킨 햄버거', grade: 'rare',
    currentPrice: 3013,
    priceMin: 970, priceMax: 3234, craftTimeSec: 180,
    materials: { base:{tomato:1,onion:1}, crops:{beet:1,sweetfruit:1}, milky:{}, other:{chicken_breast:1, chicken_leg:1} },
  },
  TOMATO_PINEAPPLE_PIZZA: {
    name: '토마토 파인애플 피자', grade: 'rare',
    currentPrice: 3072,
    priceMin: 922, priceMax: 3077, craftTimeSec: 180,
    // 치즈 조각 1개 사용
    materials: { base:{tomato:2,garlic:1}, crops:{}, milky:{}, other:{pineapple:1, cheese:1, steak:1, beef_sirloin:1} },
  },
  ONION_SOUP: {
    name: '양파 수프', grade: 'rare',
    currentPrice: 3334,
    priceMin: 1139, priceMax: 3797, craftTimeSec: 180,
    // 버터 조각 1개 사용
    materials: { base:{onion:2,garlic:1}, crops:{potato:1}, milky:{}, other:{coconut:1, butter:1, pork_front:1} },
  },
  HERB_PORK_BELLY_STEAM: {
    name: '허브 삼겹살 찜', grade: 'rare',
    currentPrice: 1972,
    priceMin: 894, priceMax: 2982, craftTimeSec: 180,
    materials: { base:{garlic:2,onion:1}, crops:{pumpkin:1,potato:1}, milky:{}, other:{pork:1, pork_belly:1} },
  },

  /* ── 에픽 요리 ── */
  TOMATO_LASAGNA: {
    name: '토마토 라자냐', grade: 'epic',
    currentPrice: 2886,
    priceMin: 1253, priceMax: 4177, craftTimeSec: 300,
    // 밀가루 반죽 1개 사용
    materials: { base:{tomato:1,onion:1,garlic:1}, crops:{carrot:1,pumpkin:1}, milky:{}, other:{flour:1, lamb_leg:1} },
  },
  DEEP_CREAM_PANE: {
    name: '딥 크림 빠네', grade: 'epic',
    currentPrice: 1760,
    priceMin: 1151, priceMax: 3837, craftTimeSec: 300,
    // 치즈 조각 1개 사용, 우유 1개 사용
    materials: { base:{tomato:1,onion:1,garlic:1}, crops:{watermelon:1,potato:1}, milky:{milk:1}, other:{cheese:1} },
  },
  TRIPLE_BEEF_RIB_SKEWER: {
    name: '트리플 소갈비 꼬치', grade: 'epic',
    currentPrice: 2879,
    priceMin: 1291, priceMax: 4307, craftTimeSec: 300,
    materials: { base:{tomato:1,onion:1,garlic:1}, crops:{carrot:1,beet:1,sugar:1}, milky:{}, other:{beef_rib:1} },
  },
};

/* ── 등급별 색상 ── */
export const GRADE_COLOR = {
  common: { label: '커먼', color: '#8a7060', bg: '#f7f3ee' },
  normal: { label: '노멀', color: '#3a9e68', bg: '#edf8f2' },
  rare:   { label: '레어', color: '#3d6fd4', bg: '#eef3fd' },
  epic:   { label: '에픽', color: '#d94f3d', bg: '#fef0ee' }, // 빨간색
};

/* ════════════════════════════════════════
   기본 시세 — 자동채우기 기준값
   ★ 모든 항목: 원/개 기준으로 입력
   ★ 자동채우기 시 ×64 하여 세트당 필드에 채움
   ★ hay: 건초더미 원/개 → 내부에서 밀 1개 가격으로 환산 (건초더미 1개 = 밀 9개)
════════════════════════════════════════ */
export const DEFAULT_PRICES = {
  seeds: { tomato: 238, onion: 239, garlic: 233 },  // 원/개 → autoFill 시 ×64
  crops: {                                      // 원/개 → autoFill 시 ×64
    pumpkin: 521, potato: 358, carrot: 380,
    beet: 693, watermelon: 606, sweetfruit: 465,
    sugar: 742, // 설탕 큐브 묶음 원/개
    hay: 238,   // 건초더미 원/개 → autoFill 시 ×64 → 내부에서 밀 환산
  },
  other: {   // 원/개 → autoFill 시 ×64 하여 세트당 필드에 채움
    coconut: 540, pineapple: 540, steak: 75,
    pork: 134, pork_belly: 147, pork_front: 149,
    lamb: 175, lamb_rib: 79, lamb_leg: 385,
    chicken: 45, chicken_leg: 413, chicken_breast: 79,
    beef_sirloin: 66, beef_rib: 681,
  },
};