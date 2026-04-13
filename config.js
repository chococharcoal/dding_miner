/* ════════════════════════════════════════
   config.js — 고정 상수 및 레시피 데이터
════════════════════════════════════════ */

export const SKILLS = {
  FURNACE:    { reductionPct: [0,10,30,40,60,80] },
  INGOT_SELL: { bonusPct: [0,5,7,10,20,30,50] },
  GEM_SELL:   { bonusPct: [0,5,7,10,20,30,50] },
  COBYTIME:   { dropPct:  [0,1,1.5,2,2.5,3,4,5] },
  SPARKLE:    { drops: [null,{pct:3,count:1},{pct:7,count:1},{pct:10,count:2}] },
  LUCKY_HIT:  { drops: [null,{pct:1,count:1},{pct:2,count:2},{pct:3,count:3},{pct:4,count:4},{pct:5,count:6},{pct:6,count:8},{pct:7,count:10},{pct:8,count:12},{pct:10,count:16},{pct:15,count:20}] },
  FIRE_PICK:  { dropPct: [0,1,2,3,4,5,6,7,8,9,15] },
  PRECIOUS:   { bonusPct: [0,5,7,10,15,20,30] },
};

export const MINING = { STAMINA_PER_USE: 10 };

export const PICKAXE = [
  {oresPerUse: 0, artifactPct: 0,  cobbyPct: 0},
  {oresPerUse: 2, artifactPct: 0,  cobbyPct: 0},
  {oresPerUse: 3, artifactPct: 1,  cobbyPct: 1},
  {oresPerUse: 3, artifactPct: 1,  cobbyPct: 1},
  {oresPerUse: 3, artifactPct: 1,  cobbyPct: 2},
  {oresPerUse: 4, artifactPct: 2,  cobbyPct: 2},
  {oresPerUse: 4, artifactPct: 2,  cobbyPct: 3},
  {oresPerUse: 4, artifactPct: 2,  cobbyPct: 3},
  {oresPerUse: 5, artifactPct: 3,  cobbyPct: 4},
  {oresPerUse: 5, artifactPct: 3,  cobbyPct: 5},
  {oresPerUse: 5, artifactPct: 3,  cobbyPct: 6},
  {oresPerUse: 6, artifactPct: 5,  cobbyPct: 7},
  {oresPerUse: 6, artifactPct: 5,  cobbyPct: 8},
  {oresPerUse: 7, artifactPct: 5,  cobbyPct:10},
  {oresPerUse: 7, artifactPct: 5,  cobbyPct:13},
  {oresPerUse:12, artifactPct:10,  cobbyPct:15},
];

export const ARTIFACT = {
  tiers: [{points:100,pct:40},{points:200,pct:25},{points:300,pct:20},{points:500,pct:10},{points:1000,pct:5}],
  get avgPoints() { return this.tiers.reduce((s,t)=>s+t.points*t.pct/100,0); },
};

export const INGOT_RECIPES = {
  CORUM:  { ores_per_ingot:16, torch_per_ingot:2 },
  RIFTON: { ores_per_ingot:16, torch_per_ingot:3 },
  SERENT: { ores_per_ingot:16, torch_per_ingot:4 },
};

export const RECIPES = {
  LS1:  { ingot_corum:1, ingot_rifton:0, ingot_serent:0, vanilla:{cobblestone:12,copper:8,redstone:3}, craft_time_sec:0 },
  LS2:  { ingot_corum:0, ingot_rifton:2, ingot_serent:0, vanilla:{deepslate_cobblestone:128,iron:5,lapis:5,diamond:3}, craft_time_sec:0 },
  LS3:  { ingot_corum:0, ingot_rifton:0, ingot_serent:3, vanilla:{copper:30,amethyst:20,iron:7,gold:7,diamond:5}, craft_time_sec:0 },
  ABIL: { ingot_corum:1, ingot_rifton:1, ingot_serent:1, vanilla:{}, craft_time_sec:0 },
  TOPAZ_BOX:       { ingot_corum:32,  ingot_rifton:0, ingot_serent:0, vanilla:{topaz:3,redstone:64,lapis:6,gold:10,stalactite:64}, doc:1, craft_time_sec:0 },
  SAPPHIRE_STATUE: { ingot_corum:0,   ingot_rifton:32,ingot_serent:0, vanilla:{sapphire:3,redstone:64,lapis:6,gold:10,tuff:64},    doc:1, craft_time_sec:0 },
  PLATINUM_CROWN:  { ingot_corum:0,   ingot_rifton:0, ingot_serent:32,vanilla:{platinum:3,redstone:64,lapis:6,gold:10,glow_lichen:64}, doc:1, craft_time_sec:0 },
};

export const PRECIOUS = {
  APPRAISAL: {
    LOW:   {pct:60, label:'낮은 품질'},
    GOOD:  {pct:30, label:'우수'},
    ROYAL: {pct:10, label:'황실인증'},
  },
  ITEMS: {
    TOPAZ_BOX:       { name:'토파즈 보석함',   recipe:'TOPAZ_BOX',       ingotType:'corum',  prices:{LOW:281772,GOOD:394481,ROYAL:563544} },
    SAPPHIRE_STATUE: { name:'사파이어 조각상', recipe:'SAPPHIRE_STATUE', ingotType:'rifton', prices:{LOW:282671,GOOD:395739,ROYAL:565341} },
    PLATINUM_CROWN:  { name:'플레티넘 왕관',   recipe:'PLATINUM_CROWN',  ingotType:'serent', prices:{LOW:279445,GOOD:391223,ROYAL:558890} },
  },
  DOC_PRICE: 10000,
};

export const TORCH = { craft_time_sec:7 };

export const ENGRAVING = {
  ORE_LUCK:       { extraOrePct:     [0,25,50,75,100] },
  RELIC_SEARCH:   { extraArtifactPct:[0,1,3,5] },
  COBBY_SUMMON:   { extraCobbyPct:   [0,1,3,5] },
  GEM_COBBY:      { gemConvertPct:   [0,3,5,10,20,30] },
  MINE_CART:      { cartPct:[0,0.5,1,1.5,2,3], minRelics:1, maxRelics:3 },
  MINER_ROULETTE: { dicePct:[0,0.5,1,1.5,2,3], normalMult:4, goldenMult:8, goldenPct:10 },
};

export const DEFAULT_PRICES = {
  ingot: {corum:3500, rifton:3750, serent:4000},
  gem:   {corum:7000, rifton:7500, serent:8000},
};

export const UNITS = { SET_SIZE:64, SETS_PER_BOX:54, BOX_SIZE:3456 };