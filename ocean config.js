/* ════════════════════════════════════════
   ocean config.js — 해양 계산기 상수 및 데이터
   수치 변경은 이 파일만 수정하세요.
════════════════════════════════════════ */

export const UNITS = {
  SET_SIZE: 64,
  BOX_SIZE: 3456, // 54세트
};

export const OCEAN = {
  STAMINA_PER_USE: 15,
};

/* ── 어패류 5종 ── */
export const SEAFOOD_TYPES = {
  oyster:   { name: '굴',   color: '#3d6fd4' }, // 파랑
  conch:    { name: '소라', color: '#c89c00' }, // 노랑
  octopus:  { name: '문어', color: '#7c52c8' }, // 보라
  seaweed:  { name: '미역', color: '#d94f3d' }, // 빨강
  urchin:   { name: '성게', color: '#3a9e68' }, // 초록
};

/* ════════════════════════════════════════
   스킬 데이터
════════════════════════════════════════ */
export const SKILLS = {
  /* 💧 물 흐르듯 술술 — 공예품 제작 시간 감소(%) */
  FURNACE:      { reductionPct: [0, 10, 20, 30, 50, 70] },
  /* 🐚 조개 좀 사조개 — 공예품 판매가 보너스(%) */
  CRAFT_BONUS:  { bonusPct: [0, 5, 7, 10, 15, 20, 30, 40, 50] },
  /* 🧪 프리미엄 한정가 — 연금품 판매가 보너스(%) */
  ALCH_BONUS:   { bonusPct: [0, 5, 7, 9, 12, 15, 20, 25, 30] },
  /* ⚓ 심해 채집꾼 — 어패류 추가 드롭 확률(%) */
  DEEP_HARVEST: { pct: [0, 5, 7, 10, 15, 20] },
  /* ⭐ 별별별! — 3성 어패류 등장 확률 증가(%) */
  STAR_BONUS:   { pct: [0, 1, 3, 5, 7, 10, 15] },
  /* 🐚 조개 무한리필 — 알쏭달쏭 조개 등장 확률 증가(%) */
  CLAM_BONUS:   { pct: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
};

/* ════════════════════════════════════════
   각인석 데이터
════════════════════════════════════════ */
export const ENGRAVING = {
  CLAM_SEARCH: { pct: [0, 1, 3, 5] },
  SEAFOOD_LUCK: {
    drops: [null,{pct:25,count:1},{pct:50,count:1},{pct:75,count:1},{pct:100,count:1}],
  },
  FISHER_ROULETTE: {
    dicePct:[0,1,2,3,4,5], normalMult:5, goldenMult:10, goldenPct:10,
  },
};

/* ── 세이지 낚싯대 강화별 스펙 ── */
export const ROD = [
  {seafoodDrop:0, clamPct:0 },{seafoodDrop:2, clamPct:1 },{seafoodDrop:2, clamPct:1 },
  {seafoodDrop:3, clamPct:2 },{seafoodDrop:3, clamPct:2 },{seafoodDrop:3, clamPct:2 },
  {seafoodDrop:4, clamPct:3 },{seafoodDrop:4, clamPct:3 },{seafoodDrop:4, clamPct:3 },
  {seafoodDrop:5, clamPct:5 },{seafoodDrop:5, clamPct:5 },{seafoodDrop:5, clamPct:7 },
  {seafoodDrop:6, clamPct:7 },{seafoodDrop:6, clamPct:9 },{seafoodDrop:7, clamPct:9 },
  {seafoodDrop:10,clamPct:15},
];

/* ── 알쏭달쏭 조개 ── */
export const CLAM = {
  dropPct: 50, // 조개 처치 시 드롭 확률(%)
  contents: {
    shell:  { name: '깨진 조개껍데기', pct: 70 }, // 0원
    yellow: { name: '노란빛 진주',     pct: 12 }, // 브로치 재료
    blue:   { name: '푸른빛 진주',     pct:  7 }, // 향수병 재료
    cyan:   { name: '청록빛 진주',     pct:  5 }, // 손거울 재료
    pink:   { name: '분홍빛 진주',     pct:  3 }, // 헤어핀 재료
    purple: { name: '보라빛 진주',     pct:  2 }, // 부채 재료
    black:  { name: '흑진주',          pct:  1 }, // 시계 재료
  },
};

/* ── 공예품 레시피 & 판매가 ──
   진주 가격은 해당 공예품 최고가로 자동 계산 */
export const CRAFTS = {
  BROOCH:  { name:'조개껍데기 브로치', emoji:'📿', pearlKey:'yellow', priceMax:50000,   materials:{shell:1,yellow:1,metal_scrap:1,spider_web:4} },
  PERFUME: { name:'푸른 향수병',       emoji:'🧴', pearlKey:'blue',   priceMax:150000,  materials:{shell:2,blue:1,resin_scrap:1,plastic_scrap:1,bucket:8} },
  MIRROR:  { name:'자개 손거울',       emoji:'🪞', pearlKey:'cyan',   priceMax:300000,  materials:{shell:3,cyan:1,alloy_scrap:2,plastic_scrap:2,glass:16} },
  HAIRPIN: { name:'분홍 헤어핀',       emoji:'📌', pearlKey:'pink',   priceMax:500000,  materials:{shell:4,pink:1,resin_scrap:3,fiber_scrap:3,bamboo:64,pink_petal:16} },
  FAN:     { name:'자개 부채',         emoji:'🪭', pearlKey:'purple', priceMax:700000,  materials:{shell:5,purple:1,alloy_scrap:5,resin_scrap:5,stick:64,amethyst:16} },
  WATCH:   { name:'흑진주 시계',       emoji:'⌚', pearlKey:'black',  priceMax:1000000, materials:{shell:7,black:1,metal_scrap:7,alloy_scrap:7,fiber_scrap:7,obsidian:16,clock:8} },
};

/* ════════════════════════════════════════
   연금 레시피 전체 (일반 연금 제작 시설)

   tier: 생산 단계 (1/2/3)
   type: 'essence'(정수/에센스/엘릭서) | 'compound'(핵/결정/영약) | 'final'(판매품)
   seafood: 어패류 종류 (색상 연동)
   output: 생산 개수
   materials: 재료 목록 {재료키: 개수}

   재료 키 종류:
     어패류: oyster1/2/3, conch1/2/3, octopus1/2/3, seaweed1/2/3, urchin1/2/3
     1차 정수: essence_guardian1, essence_wave1, essence_chaos1, essence_life1, essence_corrosion1
     1차 핵: core_guard, core_wave, core_chaos, core_life, core_corrosion
     2차 에센스: essence_guardian2, essence_wave2, essence_chaos2, essence_life2, essence_corrosion2
     2차 결정: crystal_vitality, crystal_erosion, crystal_defense, crystal_torrent, crystal_poison
     3차 엘릭서: elixir_guardian, elixir_wave, elixir_chaos, elixir_life, elixir_corrosion
     3차 영약: potion_immortal, potion_barrier, potion_corrupt, potion_frenzy, potion_venom
     바닐라: clay, sand, dirt, gravel, granite, kelp, oak_leaf, spruce_leaf, birch_leaf,
             cherry_leaf, dark_oak_leaf, lapis_block, redstone_block, iron_ingot, gold_ingot,
             diamond, dried_kelp, glowberry, netherrack, magma, soul_soil,
             crimson_stem, warped_stem, coral_dead_tube, coral_dead_brain, coral_dead_bubble,
             coral_dead_fire, coral_dead_horn, glass_bottle, shrimp, sea_bream, herring,
             goldfish, bass, firn
════════════════════════════════════════ */
export const ALCHEMY = {

  /* ── 1차: 정수 (어패류 2개 + 바닐라) → 2개 생산 ── */
  essence_guardian1: { name:'수호의 정수 ★',   tier:1, type:'essence', seafood:'oyster',  output:2, craftTimeSec:60, color:'#3d6fd4',
    materials:{ oyster1:2, clay:2 } },
  essence_wave1:     { name:'파동의 정수 ★',   tier:1, type:'essence', seafood:'conch',   output:2, craftTimeSec:60, color:'#c89c00',
    materials:{ conch1:2, sand:4 } },
  essence_chaos1:    { name:'혼란의 정수 ★',   tier:1, type:'essence', seafood:'octopus', output:2, craftTimeSec:60, color:'#7c52c8',
    materials:{ octopus1:2, dirt:8 } },
  essence_life1:     { name:'생명의 정수 ★',   tier:1, type:'essence', seafood:'seaweed', output:2, craftTimeSec:60, color:'#d94f3d',
    materials:{ seaweed1:2, gravel:4 } },
  essence_corrosion1:{ name:'부식의 정수 ★',   tier:1, type:'essence', seafood:'urchin',  output:2, craftTimeSec:60, color:'#3a9e68',
    materials:{ urchin1:2, granite:2 } },

  /* ── 1차: 핵 (정수 2종 + 회) → 1개 생산 ── */
  core_guard:     { name:'물결 수호의 핵 ★',  tier:1, type:'compound', output:1, craftTimeSec:120, color:'#3d6fd4',
    materials:{ essence_guardian1:1, essence_wave1:1, shrimp:1 } },
  core_wave:      { name:'파동 오염의 핵 ★',  tier:1, type:'compound', output:1, craftTimeSec:120, color:'#c89c00',
    materials:{ essence_wave1:1, essence_chaos1:1, sea_bream:1 } },
  core_chaos:     { name:'질서 파괴의 핵 ★',  tier:1, type:'compound', output:1, craftTimeSec:120, color:'#7c52c8',
    materials:{ essence_chaos1:1, essence_life1:1, herring:1 } },
  core_life:      { name:'활력 붕괴의 핵 ★',  tier:1, type:'compound', output:1, craftTimeSec:120, color:'#d94f3d',
    materials:{ essence_life1:1, essence_corrosion1:1, goldfish:1 } },
  core_corrosion: { name:'침식 방어의 핵 ★',  tier:1, type:'compound', output:1, craftTimeSec:120, color:'#3a9e68',
    materials:{ essence_corrosion1:1, essence_guardian1:1, bass:1 } },

  /* ── 2차: 에센스 (어패류 2개 + 해초6 + 잎6) → 2개 생산 ── */
  essence_guardian2: { name:'수호 에센스 ★★',  tier:2, type:'essence', seafood:'oyster',  output:2, craftTimeSec:120, color:'#3d6fd4',
    materials:{ oyster2:2, kelp:6, oak_leaf:6 } },
  essence_wave2:     { name:'파동 에센스 ★★',  tier:2, type:'essence', seafood:'conch',   output:2, craftTimeSec:120, color:'#c89c00',
    materials:{ conch2:2, kelp:6, spruce_leaf:6 } },
  essence_chaos2:    { name:'혼란 에센스 ★★',  tier:2, type:'essence', seafood:'octopus', output:2, craftTimeSec:120, color:'#7c52c8',
    materials:{ octopus2:2, kelp:6, birch_leaf:6 } },
  essence_life2:     { name:'생명 에센스 ★★',  tier:2, type:'essence', seafood:'seaweed', output:2, craftTimeSec:120, color:'#d94f3d',
    materials:{ seaweed2:2, kelp:6, cherry_leaf:6 } },
  essence_corrosion2:{ name:'부식 에센스 ★★',  tier:2, type:'essence', seafood:'urchin',  output:2, craftTimeSec:120, color:'#3a9e68',
    materials:{ urchin2:2, kelp:6, dark_oak_leaf:6 } },

  /* ── 2차: 결정 (에센스 2종 + 켈프8 + 바닐라) → 1개 생산 ── */
  crystal_vitality: { name:'활기 보존의 결정 ★★', tier:2, type:'compound', output:1, craftTimeSec:180, color:'#3d6fd4',
    materials:{ essence_guardian2:1, essence_life2:1, kelp:8, lapis_block:1 } },
  crystal_erosion:  { name:'파도 침식의 결정 ★★', tier:2, type:'compound', output:1, craftTimeSec:180, color:'#c89c00',
    materials:{ essence_wave2:1, essence_corrosion2:1, kelp:8, redstone_block:1 } },
  crystal_defense:  { name:'방어 오염의 결정 ★★', tier:2, type:'compound', output:1, craftTimeSec:180, color:'#7c52c8',
    materials:{ essence_chaos2:1, essence_guardian2:1, kelp:8, iron_ingot:3 } },
  crystal_torrent:  { name:'격류 재생의 결정 ★★', tier:2, type:'compound', output:1, craftTimeSec:180, color:'#d94f3d',
    materials:{ essence_life2:1, essence_wave2:1, kelp:8, gold_ingot:2 } },
  crystal_poison:   { name:'맹독 혼란의 결정 ★★', tier:2, type:'compound', output:1, craftTimeSec:180, color:'#3a9e68',
    materials:{ essence_corrosion2:1, essence_chaos2:1, kelp:8, diamond:1 } },

  /* ── 3차: 엘릭서 (어패류 1개 + 불우렁쉥이2 + 유리병3 + 바닐라) → 1개 생산 ── */
  elixir_guardian: { name:'수호의 엘릭서 ★★★', tier:3, type:'essence', seafood:'oyster',  output:1, craftTimeSec:180, color:'#3d6fd4',
    materials:{ oyster3:1, firn:2, glass_bottle:3, netherrack:8 } },
  elixir_wave:     { name:'파동의 엘릭서 ★★★', tier:3, type:'essence', seafood:'conch',   output:1, craftTimeSec:180, color:'#c89c00',
    materials:{ conch3:1, firn:2, glass_bottle:3, magma:4 } },
  elixir_chaos:    { name:'혼란의 엘릭서 ★★★', tier:3, type:'essence', seafood:'octopus', output:1, craftTimeSec:180, color:'#7c52c8',
    materials:{ octopus3:1, firn:2, glass_bottle:3, soul_soil:4 } },
  elixir_life:     { name:'생명의 엘릭서 ★★★', tier:3, type:'essence', seafood:'seaweed', output:1, craftTimeSec:180, color:'#d94f3d',
    materials:{ seaweed3:1, firn:2, glass_bottle:3, crimson_stem:4 } },
  elixir_corrosion:{ name:'부식의 엘릭서 ★★★', tier:3, type:'essence', seafood:'urchin',  output:1, craftTimeSec:180, color:'#3a9e68',
    materials:{ urchin3:1, firn:2, glass_bottle:3, warped_stem:4 } },

  /* ── 3차: 영약 (엘릭서 2종 + 켈프12 + 발광열매4 + 죽은산호2) → 1개 생산 ── */
  potion_immortal: { name:'불멸 재생의 영약 ★★★', tier:3, type:'compound', output:1, craftTimeSec:300, color:'#3d6fd4',
    materials:{ elixir_guardian:1, elixir_life:1, kelp:12, glowberry:4, coral_dead_tube:2 } },
  potion_barrier:  { name:'파동 장벽의 영약 ★★★', tier:3, type:'compound', output:1, craftTimeSec:300, color:'#c89c00',
    materials:{ elixir_wave:1, elixir_guardian:1, kelp:12, glowberry:4, coral_dead_brain:2 } },
  potion_corrupt:  { name:'타락 침식의 영약 ★★★', tier:3, type:'compound', output:1, craftTimeSec:300, color:'#7c52c8',
    materials:{ elixir_chaos:1, elixir_corrosion:1, kelp:12, glowberry:4, coral_dead_bubble:2 } },
  potion_frenzy:   { name:'생명 광란의 영약 ★★★', tier:3, type:'compound', output:1, craftTimeSec:300, color:'#d94f3d',
    materials:{ elixir_life:1, elixir_chaos:1, kelp:12, glowberry:4, coral_dead_fire:2 } },
  potion_venom:    { name:'맹독 파동의 영약 ★★★', tier:3, type:'compound', output:1, craftTimeSec:300, color:'#3a9e68',
    materials:{ elixir_corrosion:1, elixir_wave:1, kelp:12, glowberry:4, coral_dead_horn:2 } },
};

/* ════════════════════════════════════════
   정밀 연금 레시피 (판매 가능한 최종 산물)
   일반 연금의 중간재료를 조합해서 최종 판매품 생성
════════════════════════════════════════ */
export const PRECISION_ALCHEMY = {
  /* 0성 — 스킬 보너스 미적용 */
  DILUTED_EXTRACT: { name:'추출된 희석액',         tier:0, price:18444, craftTimeSec:600,
    materials:{ core_corrosion:3, crystal_defense:2, potion_corrupt:1 } },
  /* 1성 */
  AQUTIS:    { name:'영생의 아쿠티스 ★',    tier:1, price:5159,  craftTimeSec:300,
    materials:{ core_guard:1, core_chaos:1, core_life:1 } },
  KRAKEN:    { name:'크라켄의 광란체 ★',    tier:1, price:5234,  craftTimeSec:300,
    materials:{ core_chaos:1, core_life:1, core_wave:1 } },
  LEVIATHAN: { name:'리바이던의 깃털 ★',    tier:1, price:5393,  craftTimeSec:300,
    materials:{ core_corrosion:1, core_wave:1, core_guard:1 } },
  /* 2성 */
  WAVE_CORE: { name:'해구 파동의 코어 ★★',  tier:2, price:11131, craftTimeSec:600,
    materials:{ crystal_vitality:1, crystal_erosion:1, crystal_torrent:1 } },
  DEEP_VIAL: { name:'침묵의 심해 비약 ★★',  tier:2, price:11242, craftTimeSec:600,
    materials:{ crystal_erosion:1, crystal_torrent:1, crystal_poison:1 } },
  SEA_WING:  { name:'청해룡의 날개 ★★',     tier:2, price:11399, craftTimeSec:600,
    materials:{ crystal_defense:1, crystal_poison:1, crystal_vitality:1 } },
  /* 3성 */
  AQUA_PULSE:  { name:'아쿠아 펄스 파편 ★★★', tier:3, price:21833, craftTimeSec:1200,
    materials:{ potion_immortal:1, potion_barrier:1, potion_venom:1 } },
  NAUTILUS:    { name:'나우틸러스의 손 ★★★',  tier:3, price:22088, craftTimeSec:1200,
    materials:{ potion_barrier:1, potion_frenzy:1, potion_immortal:1 } },
  ABYSS_SPINE: { name:'무저의 척추 ★★★',      tier:3, price:22227, craftTimeSec:1200,
    materials:{ potion_corrupt:1, potion_venom:1, potion_frenzy:1 } },
};

/* ── 바닐라 재료 메타 (UI 표시, 시세 입력용) ──
   priceUnit: 'per_item'=개당, 'per_set'=세트당(기본)
════════════════════════════════════════ */
export const VANILLA_META = {
  /* 🐟 커스텀 물고기 (낚시 부재료, 세트당 입력) */
  shrimp:    { name:'깐 새우',     group:'fish', priceUnit:'per_set' },
  sea_bream: { name:'도미 회',     group:'fish', priceUnit:'per_set' },
  herring:   { name:'청어 회',     group:'fish', priceUnit:'per_set' },
  goldfish:  { name:'금붕어 회',   group:'fish', priceUnit:'per_set' },
  bass:      { name:'농어 회',     group:'fish', priceUnit:'per_set' },
  /* 🌊 해양 채집 (세트당 입력) */
  firn:         { name:'불우렁쉥이', group:'ocean', priceUnit:'per_set' },
  seaweed_item: { name:'해초',       group:'ocean', priceUnit:'per_set' },
  kelp:         { name:'켈프',       group:'ocean', priceUnit:'per_set' },
  glass_bottle: { name:'유리병',     group:'ocean', priceUnit:'per_set' },
  glowberry:    { name:'발광 열매',  group:'ocean', priceUnit:'per_set' },
  /* 🍃 나뭇잎 (세트당) */
  oak_leaf:      { name:'참나무 잎',     group:'leaf', priceUnit:'per_set' },
  spruce_leaf:   { name:'가문비나무 잎', group:'leaf', priceUnit:'per_set' },
  birch_leaf:    { name:'자작나무 잎',   group:'leaf', priceUnit:'per_set' },
  cherry_leaf:   { name:'벚나무 잎',     group:'leaf', priceUnit:'per_set' },
  dark_oak_leaf: { name:'짙은참나무 잎', group:'leaf', priceUnit:'per_set' },
  /* ⛏️ 광물·블록 (세트당) */
  clay:          { name:'점토',          group:'mineral', priceUnit:'per_set' },
  sand:          { name:'모래',          group:'mineral', priceUnit:'per_set' },
  dirt:          { name:'흙',            group:'mineral', priceUnit:'per_set' },
  gravel:        { name:'자갈',          group:'mineral', priceUnit:'per_set' },
  granite:       { name:'화강암',        group:'mineral', priceUnit:'per_set' },
  lapis_block:   { name:'청금석 블록',   group:'mineral', priceUnit:'per_set' },
  redstone_block:{ name:'레드스톤 블록', group:'mineral', priceUnit:'per_set' },
  /* 철·금·다이아: 블록 세트 기준 입력 → 내부에서 주괴로 환산 (블록 1개 = 주괴 9개) */
  iron_ingot:    { name:'철 블록',       group:'mineral', priceUnit:'per_set', blockToCraft:9 },
  gold_ingot:    { name:'금 블록',       group:'mineral', priceUnit:'per_set', blockToCraft:9 },
  diamond:       { name:'다이아 블록',   group:'mineral', priceUnit:'per_set', blockToCraft:9 },
  /* 🔥 네더 (세트당) */
  netherrack:    { name:'네더랙',        group:'nether', priceUnit:'per_set' },
  magma:         { name:'마그마 블록',   group:'nether', priceUnit:'per_set' },
  soul_soil:     { name:'영혼 흙',       group:'nether', priceUnit:'per_set' },
  crimson_stem:  { name:'진홍빛 자루',   group:'nether', priceUnit:'per_set' },
  warped_stem:   { name:'뒤틀린 자루',   group:'nether', priceUnit:'per_set' },
  /* 🪸 죽은 산호 (세트당) */
  coral_dead_tube:  { name:'죽은 관 산호 블록',   group:'coral', priceUnit:'per_set' },
  coral_dead_brain: { name:'죽은 사방산호 블록',   group:'coral', priceUnit:'per_set' },
  coral_dead_bubble:{ name:'죽은 거품 산호 블록',  group:'coral', priceUnit:'per_set' },
  coral_dead_fire:  { name:'죽은 불 산호 블록',    group:'coral', priceUnit:'per_set' },
  coral_dead_horn:  { name:'죽은 뇌 산호 블록',    group:'coral', priceUnit:'per_set' },
};

/* ════════════════════════════════════════
   기본 시세 — 자동채우기 기준값
   ★ seafood : 원/개  → 자동채우기 시 그대로 개당 필드에 채움
   ★ vanilla : 원/개  → 자동채우기 시 ×64 하여 세트당 필드에 채움
              (단, blockToCraft 항목(철/금/다이아)은 ×64로 블록 세트당 필드에 채움)
════════════════════════════════════════ */
export const DEFAULT_PRICES = {
  seafood: { tier1: 0, tier2: 0, tier3: 0 }, // 어패류 원/개
  vanilla: {                                   // 모두 원/개 → autoFill 시 ×64
    /* 커스텀 물고기 (원/개) */
    shrimp:372, sea_bream:616, herring:395, goldfish:314, bass:167,
    /* 해양 채집 (원/개) */
    firn:45, seaweed_item:47, kelp:1, glass_bottle:43, glowberry:14,
    /* 나뭇잎 (원/개) */
    oak_leaf:35, spruce_leaf:35, birch_leaf:35, cherry_leaf:35, dark_oak_leaf:0,
    /* 광물 (원/개, 철/금/다이아는 블록 기준 원/개) */
    clay:78, sand:47, dirt:10, gravel:23, granite:59,
    lapis_block:876, redstone_block:407,
    iron_ingot:1045, gold_ingot:2232, diamond:2870,
    /* 네더 (원/개) */
    netherrack:0, magma:70, soul_soil:62, crimson_stem:101, warped_stem:101,
    /* 죽은 산호 (원/개) */
    coral_dead_tube:157, coral_dead_brain:157, coral_dead_bubble:157,
    coral_dead_fire:157, coral_dead_horn:157,
  },
};