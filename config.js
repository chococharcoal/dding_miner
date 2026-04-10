/* ════════════════════════════════════════
   config.js — 고정 상수 및 레시피 데이터
   수치 변경은 이 파일만 수정하세요
════════════════════════════════════════ */

/* ── 스킬 ── */
export const SKILLS = {
  FURNACE: {
    name: '초고속 용광로',
    maxLevel: 5,
    reductionPct: [0, 10, 30, 40, 60, 80], // 인덱스 = 레벨
  },
  INGOT_SELL: {
    name: '주괴 좀 사',
    maxLevel: 6,
    bonusPct: [0, 5, 7, 10, 20, 30, 50],
  },
};

/* ── 채굴 기본값 ── */
export const MINING = {
  STAMINA_PER_USE: 10, // 채굴 1회당 소비 스테미나 (고정)
};

/* ── 곡괭이 강화별 데이터 (0강~15강) ──────────────────────────
   oresPerUse     : 채굴 1회당 평균 광석 수
   gemDropPct     : 채굴 1회당 보석 드랍 확률 (%)  — 0이면 표시 안 함
   naviPointDrop  : 채굴 1회당 평균 항해포인트 드랍 수 — 0이면 표시 안 함
   ingotDropPct   : 채굴 1회당 주괴 완성품 드랍 확률 (%) — 0이면 표시 안 함
   ── 실제 수치로 교체해주세요 ── */
export const PICKAXE = [
  /* 0강 */ { oresPerUse:  1, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
  /* 1강 */ { oresPerUse:  0, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
  /* 2강 */ { oresPerUse:  0, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
  /* 3강 */ { oresPerUse:  0, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
  /* 4강 */ { oresPerUse:  0, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
  /* 5강 */ { oresPerUse:  0, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
  /* 6강 */ { oresPerUse:  0, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
  /* 7강 */ { oresPerUse:  0, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
  /* 8강 */ { oresPerUse:  5, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
  /* 9강 */ { oresPerUse:  0, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
  /*10강 */ { oresPerUse:  0, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
  /*11강 */ { oresPerUse:  0, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
  /*12강 */ { oresPerUse:  0, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
  /*13강 */ { oresPerUse:  0, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
  /*14강 */ { oresPerUse:  0, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
  /*15강 */ { oresPerUse:  0, gemDropPct: 0, naviPointDrop: 0, ingotDropPct: 0 },
];

/* ── 주괴 제작 레시피 ── */
export const INGOT_RECIPES = {
  ORES_PER_INGOT: 16, // 공통 기본값 (fallback용)
  CORUM:  { ores_per_ingot: 16, torch_per_ingot: 2 },
  RIFTON: { ores_per_ingot: 16, torch_per_ingot: 3 },
  SERENT: { ores_per_ingot: 16, torch_per_ingot: 4 },
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
};

/* ── 강화횃불 ── */
export const TORCH = {
  craft_time_sec: 7, // 스킬 0랩 기준 1개당 제작 시간(초)
};

/* ── 단위 ── */
export const UNITS = {
  SET_SIZE:     64,
  SETS_PER_BOX: 54,
  BOX_SIZE:     3456,
};