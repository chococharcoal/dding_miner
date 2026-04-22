/* ════════════════════════════════════════
   config.js — 고정 상수 및 레시피 데이터
   수치 변경은 이 파일만 수정하세요.
   app.js는 이 파일에서 값을 읽어 계산합니다.
════════════════════════════════════════ */


/* ── 스킬 데이터 ──────────────────────────
   인덱스 = 스킬 레벨 (0 = 미습득)
   reductionPct / bonusPct / dropPct 모두 %단위 정수
──────────────────────────────────────── */
export const SKILLS = {

  /* 초고속 용광로 — 제작 시간 단축 */
  FURNACE:    { reductionPct: [0, 10, 30, 40, 60, 80] },

  /* 주괴 좀 사 주괴 — 주괴 판매가 보너스 */
  INGOT_SELL: { bonusPct: [0, 5, 7, 10, 20, 30, 50] },

  /* 반짝반짝 눈이 부셔 — 보석 판매가 보너스 */
  GEM_SELL:   { bonusPct: [0, 5, 7, 10, 20, 30, 50] },

  /* 코비타임 — 채굴 1회당 코비 소환 확률 추가(%) */
  COBYTIME:   { dropPct: [0, 1, 1.5, 2, 2.5, 3, 4, 5] },

  /* 반짝임의 시작 — 채굴 시 보석 드랍
     pct: 드랍 확률(%), count: 드랍 개수 */
  SPARKLE: {
    drops: [
      null,                    // Lv0 미습득
      { pct: 3,  count: 1 },   // Lv1
      { pct: 7,  count: 1 },   // Lv2
      { pct: 10, count: 2 },   // Lv3
    ],
  },

  /* 럭키히트 — 채굴 시 광석 추가 드랍
     pct: 발동 확률(%), count: 추가 드랍 개수 */
  LUCKY_HIT: {
    drops: [
      null,
      { pct: 1,  count: 1  },  // Lv1
      { pct: 2,  count: 2  },  // Lv2
      { pct: 3,  count: 3  },  // Lv3
      { pct: 4,  count: 4  },  // Lv4
      { pct: 5,  count: 6  },  // Lv5
      { pct: 6,  count: 8  },  // Lv6
      { pct: 7,  count: 10 },  // Lv7
      { pct: 8,  count: 12 },  // Lv8
      { pct: 10, count: 16 },  // Lv9
      { pct: 15, count: 20 },  // Lv10
    ],
  },

  /* 불붙은 곡괭이 — 채굴 시 주괴 직접 드랍 확률(%) */
  FIRE_PICK: { dropPct: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 15] },

  /* 귀하신 몸값 — 귀중품 판매가 보너스(%) */
  PRECIOUS: { bonusPct: [0, 5, 7, 10, 15, 20, 30] },
};


/* ── 채굴 기본 상수 ── */
export const MINING = {
  STAMINA_PER_USE: 10,  // 채굴 1회당 소비 스태미나
};


/* ── 곡괭이 강화별 스펙 (0강~15강) ────────
   oresPerUse  : 채굴 1회당 기본 광석 수
   artifactPct : 유물 드랍 확률(%)
   cobbyPct    : 코비 소환 확률(%)
──────────────────────────────────────── */
export const PICKAXE = [
  /* 0강  */ { oresPerUse:  1, artifactPct:  0, cobbyPct:  0 },
  /* 1강  */ { oresPerUse:  2, artifactPct:  0, cobbyPct:  0 },
  /* 2강  */ { oresPerUse:  3, artifactPct:  1, cobbyPct:  1 },
  /* 3강  */ { oresPerUse:  3, artifactPct:  1, cobbyPct:  1 },
  /* 4강  */ { oresPerUse:  3, artifactPct:  1, cobbyPct:  2 },
  /* 5강  */ { oresPerUse:  4, artifactPct:  2, cobbyPct:  2 },
  /* 6강  */ { oresPerUse:  4, artifactPct:  2, cobbyPct:  3 },
  /* 7강  */ { oresPerUse:  4, artifactPct:  2, cobbyPct:  3 },
  /* 8강  */ { oresPerUse:  5, artifactPct:  3, cobbyPct:  4 },
  /* 9강  */ { oresPerUse:  5, artifactPct:  3, cobbyPct:  5 },
  /* 10강 */ { oresPerUse:  5, artifactPct:  3, cobbyPct:  6 },
  /* 11강 */ { oresPerUse:  6, artifactPct:  5, cobbyPct:  7 },
  /* 12강 */ { oresPerUse:  6, artifactPct:  5, cobbyPct:  8 },
  /* 13강 */ { oresPerUse:  7, artifactPct:  5, cobbyPct: 10 },
  /* 14강 */ { oresPerUse:  7, artifactPct:  5, cobbyPct: 13 },
  /* 15강 */ { oresPerUse: 12, artifactPct: 10, cobbyPct: 15 },
];


/* ── 유물(아티팩트) 등급 테이블 ────────────
   포인트별 드랍 확률(%)
   avgPoints는 가중평균으로 자동계산
──────────────────────────────────────── */
export const ARTIFACT = {
  tiers: [
    { points: 100,  pct: 40 },
    { points: 200,  pct: 25 },
    { points: 300,  pct: 20 },
    { points: 500,  pct: 10 },
    { points: 1000, pct:  5 },
  ],
  /* 유물 1개당 평균 포인트 (자동계산) */
  get avgPoints() {
    return this.tiers.reduce((s, t) => s + t.points * t.pct / 100, 0);
  },
};


/* ── 주괴 제작 레시피 ──────────────────────
   ores_per_ingot  : 주괴 1개당 필요 광석 수
   torch_per_ingot : 주괴 1개당 필요 강화횃불 수
   craft_time_sec  : 주괴 1개당 제작 시간(초)
──────────────────────────────────────── */
export const INGOT_RECIPES = {
  CORUM:  { ores_per_ingot: 16, torch_per_ingot: 2, craft_time_sec: 20 },
  RIFTON: { ores_per_ingot: 16, torch_per_ingot: 3, craft_time_sec: 25 },
  SERENT: { ores_per_ingot: 16, torch_per_ingot: 4, craft_time_sec: 30 },
};


/* ── 제작물 레시피 ─────────────────────────
   ingot_*       : 필요 주괴 종류/수량
   vanilla       : 필요 바닐라 재료 {재료명: 수량}
   craft_time_sec: 개당 제작 시간(초) — 스킬 적용 전 기준
   doc           : 필요 증서 수 (귀중품만)
──────────────────────────────────────── */
export const RECIPES = {

  /* 라이프스톤 */
  LS1: {  // 하급 라이프스톤 — 코룸 주괴 1개
    ingot_corum: 1, ingot_rifton: 0, ingot_serent: 0,
    vanilla: { cobblestone: 2, copper: 8, redstone: 3 },
    craft_time_sec: 60,
  },
  LS2: {  // 중급 라이프스톤 — 리프톤 주괴 2개
    ingot_corum: 0, ingot_rifton: 2, ingot_serent: 0,
    vanilla: { deepslate_cobblestone: 2, iron: 5, lapis: 5, diamond: 3 },
    craft_time_sec: 120,
  },
  LS3: {  // 상급 라이프스톤 — 세렌트 주괴 3개
    ingot_corum: 0, ingot_rifton: 0, ingot_serent: 3,
    vanilla: { copper: 30, amethyst: 20, iron: 7, gold: 7, diamond: 5 },
    craft_time_sec: 300,
  },

  /* 어빌리티 스톤 — 3종 주괴 각 1개 */
  ABIL: {
    ingot_corum: 1, ingot_rifton: 1, ingot_serent: 1,
    vanilla: {},
    craft_time_sec: 120,
  },

  /* 귀중품 — 코룸 주괴 20개 */
  TOPAZ_BOX: {
    ingot_corum: 20, ingot_rifton: 0, ingot_serent: 0,
    vanilla: { topaz: 3, redstone: 64, lapis: 64, gold: 10, diorite: 64 },
    doc: 1,
    craft_time_sec: 3600,
  },

  /* 귀중품 — 리프톤 주괴 20개 */
  SAPPHIRE_STATUE: {
    ingot_corum: 0, ingot_rifton: 20, ingot_serent: 0,
    vanilla: { sapphire: 3, redstone: 64, lapis: 64, gold: 10, tuff: 64 },
    doc: 1,
    craft_time_sec: 3600,
  },

  /* 귀중품 — 세렌트 주괴 20개 */
  PLATINUM_CROWN: {
    ingot_corum: 0, ingot_rifton: 0, ingot_serent: 20,
    vanilla: { platinum: 3, redstone: 64, lapis: 64, gold: 10, andesite: 64 },
    doc: 1,
    craft_time_sec: 3600,
  },
};


/* ── 귀중품 감정 시스템 ────────────────────
   감정 후 등급이 결정됨 (확률 = %)
   prices: 등급별 판매가(골드)
──────────────────────────────────────── */
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


/* ── 강화횃불 ── */
export const TORCH = {
  craft_time_sec: 7,
};


/* ── 각인석 효과 ───────────────────────────
   스킬·곡괭이 스펙과 합연산 적용
   인덱스 = 각인석 강화 단계 (0 = 미장착)
──────────────────────────────────────── */
export const ENGRAVING = {

  /* 광물행운 */
  ORE_LUCK: {
    extraOrePct: [0, 25, 50, 75, 100],
  },

  /* 유물탐색 */
  RELIC_SEARCH: {
    extraArtifactPct: [0, 1, 3, 5],
  },

  /* 코비 소환 */
  COBBY_SUMMON: {
    extraCobbyPct: [0, 1, 3, 5],
  },

  /* 보석 코비 */
  GEM_COBBY: {
    gemConvertPct: [0, 5, 10, 20, 30, 50],
  },

  /* 광산수레 */
  MINE_CART: {
    cartPct:   [0, 0.5, 1, 1.5, 2, 3],
    minRelics: 1,
    maxRelics: 3,
  },

  /* 광부룰렛 */
  MINER_ROULETTE: {
    dicePct:    [0, 1, 2, 3, 4, 5],
    normalMult: 6,
    goldenMult: 12,
    goldenPct:  10,
  },
};


/* ── 거래소 수수료 ── */
export const MARKET_FEE = 0.05;  // 5% — 라스·어빌·주괴 판매 시 차감

/* ── 기본 시장가 (미입력 시 fallback + 자동채우기 기준값) ──────
   ※ 자동채우기 버튼 누르면 이 값으로 빈 칸만 채워집니다.
      실제 시세 바뀌면 이 블록만 수정하세요.

   단위 안내:
     ingot      : 원/개  (주괴)
     gem        : 원/개  (보석)
     ls1/2/3    : 원/개  (하·중·상급 라이프스톤 등록가 → 수수료 5% 자동 차감)
     abil       : 원/개  (어빌리티 스톤 등록가 → 수수료 5% 자동 차감)
     vanilla    : 원/개  ★ 개당 입력 → autoFill 시 ×64 해서 세트당 필드에 채움
     precious   : 원/개  (토파즈·사파이어·플레티넘)
     stone      : 원/개  ★ 개당 입력 → autoFill 시 ×64 변환
     charcoal   : 원/개  ★ 개당 입력 → autoFill 시 ×64 변환
     wood       : 원/개  ★ 개당 입력 → autoFill 시 ×64 변환
     skillPulse : 원/개  (스킬펄스)
     artifactPt : 원/100pt (유물 포인트)
──────────────────────────────────────── */
export const DEFAULT_PRICES = {
  ingot: {
    corum:  3500,   // 원/개
    rifton: 3750,   // 원/개
    serent: 4000,   // 원/개
  },
  gem: {
    corum:  7000,   // 원/개
    rifton: 7500,   // 원/개
    serent: 8000,   // 원/개
  },
  /* 라이프스톤·어빌리티 스톤 — 거래소 등록가(원/개), 수수료 5% 자동 차감 */
  ls1:  0,    // 하급 라이프스톤
  ls2:  0,    // 중급 라이프스톤
  ls3:  0,    // 상급 라이프스톤
  abil: 0,    // 어빌리티 스톤
  /* 바닐라 재료 — ★ 개당 가격 (autoFill 시 ×64 하여 세트당 필드에 채움) */
  vanilla: {
    cobblestone:           1250,   // 원/개
    deepslate_cobblestone:  281,   // 원/개
    copper:                 125,   // 원/개
    iron:                  1109,   // 원/개
    gold:                  2031,   // 원/개
    diamond:               2938,   // 원/개
    redstone:               383,   // 원/개
    lapis:                  625,   // 원/개
    amethyst:               102,   // 원/개
  },
  /* 귀중품 전용 특수 광물 — 개당 가격 */
  precious: {
    topaz:    75855,   // 원/개
    sapphire: 79087,   // 원/개
    platinum: 78740,   // 원/개
  },
  /* 석재류 — ★ 개당 가격 (autoFill 시 ×64 변환) */
  stone: {
    diorite:   70,   // 원/개
    tuff:      20,   // 원/개
    andesite:  74,   // 원/개
  },
  /* 강화횃불 재료 — ★ 개당 가격 (autoFill 시 ×64 변환) */
  charcoal:  30,    // 원/개 (숯/석탄)
  wood:      27,    // 원/개 (원목)
  /* 기타 드랍 판매가 */
  skillPulse:  500,    // 원/개
  artifactPt: 5400,    // 원/100pt
};


/* ── 단위 상수 ── */
export const UNITS = {
  SET_SIZE:     64,    // 1세트 = 64개
  SETS_PER_BOX: 54,    // 1상자 = 54세트
  BOX_SIZE:     3456,  // 1상자 = 3456개 (64 × 54)
};