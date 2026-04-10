/* ════════════════════════════════════════
   config.js — 스킬 및 레시피 데이터
   (이 파일만 수정하면 모든 수치가 반영됩니다)
   ════════════════════════════════════════ */

export const SKILLS = {
  FURNACE: {
    name: '초고속 용광로',
    maxLevel: 5,
    reductionPct: [0, 10, 30, 40, 60, 80],
  },
  INGOT_SELL: {
    name: '주괴 좀 사 주괴',
    maxLevel: 6,
    bonusPct: [0, 5, 7, 10, 20, 30, 50],
  },
};

export const MINING = {
  STAMINA_COST: 10,
  ORES_PER_USE: 5,
};

export const INGOT_RECIPES = {
  ORES_PER_INGOT: 16,
  CORUM:  { ores_per_ingot: 16, torch_per_ingot: 2 },
  RIFTON: { ores_per_ingot: 16, torch_per_ingot: 3 },
  SERENT: { ores_per_ingot: 16, torch_per_ingot: 4 },
};

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

export const UNITS = {
  SET_SIZE:     64,
  SETS_PER_BOX: 54,
  BOX_SIZE:     3456,
};