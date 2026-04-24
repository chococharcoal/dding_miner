/* ════════════════════════════════════════
   ocean config.js — 해양 계산기 상수 및 데이터
   수치 변경은 이 파일만 수정하세요.

   ★ 어패류 가격: 원/개 직접 입력
   ★ 진주 가격: 원/개 직접 입력
   ★ 연금품 가격: 고정가 (상점 판매)
   ★ 공예품 가격: 포스 최대가 기준 입력
════════════════════════════════════════ */

export const UNITS = {
  SET_SIZE: 64,    // 1세트 = 64개
  BOX_SIZE: 3456,  // 1상자 = 54세트 = 3456개
};

/* ── 해양 채집 기본 상수 ── */
export const OCEAN = {
  STAMINA_PER_USE: 15, // 수중 어획 1회당 스태미나 소모량
};

/* ════════════════════════════════════════
   스킬 데이터
   인덱스 = 스킬 레벨 (0 = 미습득)
════════════════════════════════════════ */
export const SKILLS = {

  /* 💧 물 흐르듯 술술 — 공예품 제작 시간 감소(%) */
  FURNACE: { reductionPct: [0, 10, 20, 30, 50, 70] },

  /* 🐚 조개 좀 사조개 — 공예품 판매가 보너스(%) */
  CRAFT_BONUS: { bonusPct: [0, 5, 7, 10, 15, 20, 30, 40, 50] },

  /* 🧪 프리미엄 한정가 — 연금품 판매가 보너스(%) */
  ALCH_BONUS: { bonusPct: [0, 5, 7, 9, 12, 15, 20, 25, 30] },

  /* ⚓ 심해 채집꾼 — 어패류 추가 드롭 확률(%) */
  DEEP_HARVEST: { pct: [0, 5, 7, 10, 15, 20] },

  /* ⭐ 별별별! — 3성 어패류 등장 확률 증가(%) */
  STAR_BONUS: { pct: [0, 1, 3, 5, 7, 10, 15] },

  /* 🐚 조개 무한리필 — 알쏭달쏭 조개 등장 확률 증가(%) */
  CLAM_BONUS: { pct: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
};

/* ════════════════════════════════════════
   각인석 데이터 (세이지 낚싯대)
   인덱스 = 각인석 등급 (0 = 미장착)
════════════════════════════════════════ */
export const ENGRAVING = {

  /* 조개 탐색 — 알쏭달쏭 조개 등장 확률 증가(%) */
  CLAM_SEARCH: { pct: [0, 1, 3, 5] }, // 없음 / I / II / III

  /* 🦪 어패 행운 — 수중 어획 시 어패류 추가 드롭
     pct: 발동 확률(%), count: 추가 드롭 개수 */
  SEAFOOD_LUCK: {
    drops: [
      null,
      { pct: 25,  count: 1 }, // I
      { pct: 50,  count: 1 }, // II
      { pct: 75,  count: 1 }, // III
      { pct: 100, count: 1 }, // IV
    ],
  },

  /* 🎲 어부 룰렛 — 수중 어획 시 주사위 등장
     주사위 눈×5 어패류, 골드주사위(10%) 눈×10 */
  FISHER_ROULETTE: {
    dicePct:    [0, 1, 2, 3, 4, 5], // 등급별 발동 확률(%)
    normalMult: 5,                   // 일반 주사위 배율
    goldenMult: 10,                  // 골드 주사위 배율
    goldenPct:  10,                  // 골드 주사위 발동 확률(%)
  },
};

/* ── 세이지 낚싯대 강화별 스펙 ── */
export const ROD = [
  /* 0강  */ { seafoodDrop: 0,  clamPct: 0  },
  /* 1강  */ { seafoodDrop: 2,  clamPct: 1  },
  /* 2강  */ { seafoodDrop: 2,  clamPct: 1  },
  /* 3강  */ { seafoodDrop: 3,  clamPct: 2  },
  /* 4강  */ { seafoodDrop: 3,  clamPct: 2  },
  /* 5강  */ { seafoodDrop: 3,  clamPct: 2  },
  /* 6강  */ { seafoodDrop: 4,  clamPct: 3  },
  /* 7강  */ { seafoodDrop: 4,  clamPct: 3  },
  /* 8강  */ { seafoodDrop: 4,  clamPct: 3  },
  /* 9강  */ { seafoodDrop: 5,  clamPct: 5  },
  /* 10강 */ { seafoodDrop: 5,  clamPct: 5  },
  /* 11강 */ { seafoodDrop: 5,  clamPct: 7  },
  /* 12강 */ { seafoodDrop: 6,  clamPct: 7  },
  /* 13강 */ { seafoodDrop: 6,  clamPct: 9  },
  /* 14강 */ { seafoodDrop: 7,  clamPct: 9  },
  /* 15강 */ { seafoodDrop: 10, clamPct: 15 },
];

/* ── 알쏭달쏭 조개 드롭 테이블 ──
   dropPct: 조개 처치 시 드롭 확률(%)
   contents: 조개를 열었을 때 내용물 확률(%) */
export const CLAM = {
  dropPct: 50,
  contents: {
    shell:  { name: '깨진 조개껍데기', pct: 70 }, // 판매 불가
    yellow: { name: '노란빛 진주',     pct: 12 },
    blue:   { name: '푸른빛 진주',     pct:  7 },
    cyan:   { name: '청록빛 진주',     pct:  5 },
    pink:   { name: '분홍빛 진주',     pct:  3 },
    purple: { name: '보라빛 진주',     pct:  2 },
    black:  { name: '흑진주',          pct:  1 },
  },
};

/* ── 공예품 레시피 ──
   materials: 재료 목록 (개 기준)
   priceMin/Max: 판매가 범위 */
export const CRAFTS = {
  BROOCH: {
    name: '조개껍데기 브로치', emoji: '📿',
    materials: { shell:1, yellow:1, metal_scrap:1, spider_web:4 },
    priceMin: 0, priceMax: 50000,
  },
  PERFUME: {
    name: '푸른 향수병', emoji: '🧴',
    materials: { shell:2, blue:1, resin_scrap:1, plastic_scrap:1, bucket:8 },
    priceMin: 0, priceMax: 150000,
  },
  MIRROR: {
    name: '자개 손거울', emoji: '🪞',
    materials: { shell:3, cyan:1, alloy_scrap:2, plastic_scrap:2, glass:16 },
    priceMin: 0, priceMax: 300000,
  },
  HAIRPIN: {
    name: '분홍 헤어핀', emoji: '📌',
    materials: { shell:4, pink:1, resin_scrap:3, fiber_scrap:3, bamboo:64, pink_petal:16 },
    priceMin: 0, priceMax: 500000,
  },
  FAN: {
    name: '자개 부채', emoji: '🪭',
    materials: { shell:5, purple:1, alloy_scrap:5, resin_scrap:5, stick:64, amethyst:16 },
    priceMin: 0, priceMax: 700000,
  },
  WATCH: {
    name: '흑진주 시계', emoji: '⌚',
    materials: { shell:7, black:1, metal_scrap:7, alloy_scrap:7, fiber_scrap:7, obsidian:16, clock:8 },
    priceMin: 0, priceMax: 1000000,
  },
};

/* ── 연금품 고정 판매가 ──
   tier: 등급 (0=희석, 1=1성, 2=2성, 3=3성)
   price: 기본 판매가 (원/개, 스킬 보너스 별도) */
export const ALCHEMY_PRICES = {
  /* 0성 — 스킬 보너스 미적용 */
  DILUTED_EXTRACT: { name: '희석된 추출액',       tier: 0, price: 18444 },
  /* 1성 */
  AQUTIS:          { name: '영생의 아쿠티스 ★',   tier: 1, price: 5159  },
  KRAKEN:          { name: '크라켄의 광란체 ★',   tier: 1, price: 5234  },
  LEVIATHAN:       { name: '리바이던의 깃털 ★',   tier: 1, price: 5393  },
  /* 2성 */
  WAVE_CORE:       { name: '해구의 파동 코어 ★★', tier: 2, price: 11131 },
  DEEP_VIAL:       { name: '침묵의 심해 비약 ★★', tier: 2, price: 11242 },
  SEA_WING:        { name: '청해룡의 날개 ★★',    tier: 2, price: 11399 },
  /* 3성 */
  AQUA_PULSE:      { name: '아쿠아 펄스 파편 ★★★', tier: 3, price: 21833 },
  NAUTILUS:        { name: '나우틸러스의 손 ★★★',  tier: 3, price: 22088 },
  ABYSS_SPINE:     { name: '무저의 척추 ★★★',      tier: 3, price: 22227 },
};

/* ════════════════════════════════════════
   기본 시세 — 자동채우기 기준값
   (현재는 전부 0으로 설정, 수동 입력 방식)
════════════════════════════════════════ */
export const DEFAULT_PRICES = {
  seafood: { grade1: 0, grade2: 0, grade3: 0 }, // 어패류 등급별 단가 (원/개)
  pearl: { yellow: 0, blue: 0, cyan: 0, pink: 0, purple: 0, black: 0 }, // 진주 (원/개)
};