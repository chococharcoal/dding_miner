/* ════════════════════════════════════════
   app.js — 광부 계산기 메인 로직
   모든 수치·레시피는 config.js에서 관리합니다.
════════════════════════════════════════ */

import {
  SKILLS, MINING, PICKAXE, ARTIFACT, ENGRAVING,
  INGOT_RECIPES, RECIPES, TORCH, UNITS, PRECIOUS, DEFAULT_PRICES,
} from './config.js';

const { SET_SIZE, BOX_SIZE } = UNITS;
const COBBY_DROP_RATE = 0.5;


/* ════════════════════════════════════════
   ① 유틸리티 함수
════════════════════════════════════════ */

/* 숫자를 한국식 천단위 콤마로 포맷 */
export const f = n => Math.round(n).toLocaleString('ko-KR');

/* 소수점 d자리까지 표시, 불필요한 0 제거 */
export const fd = (n, d = 2) =>
  +n.toFixed(d) === Math.round(+n.toFixed(d))
    ? Math.round(n).toString()
    : n.toFixed(d).replace(/\.?0+$/, '');

/* 수량을 "X상자 Y세트 Z개" 형식으로 포맷 (내림) */
export function fmtQty(n) {
  n = Math.floor(n);
  if (n <= 0) return '0개';
  const boxes = Math.floor(n / BOX_SIZE);
  const rem   = n % BOX_SIZE;
  const sets  = Math.floor(rem / SET_SIZE);
  const items = rem % SET_SIZE;
  return [[boxes,'상자'],[sets,'세트'],[items,'개']]
    .filter(([v]) => v > 0)
    .map(([v, u]) => v + u)
    .join(' ') || '0개';
}

/* 수량을 "X상자 Y세트 Z{unit}" 형식으로 포맷 (올림 — 재료는 부족하면 안 됨) */
function fmtQtyLabel(n, unit = '개') {
  n = Math.ceil(n);
  if (n <= 0) return `0${unit}`;
  const boxes = Math.floor(n / BOX_SIZE);
  const rem   = n % BOX_SIZE;
  const sets  = Math.floor(rem / SET_SIZE);
  const items = rem % SET_SIZE;
  const parts = [];
  if (boxes > 0) parts.push(boxes + '상자');
  if (sets  > 0) parts.push(sets  + '세트');
  if (items > 0) parts.push(items + unit);
  return parts.join(' ') || `0${unit}`;
}

/* "n상자 n세트 n개" 또는 순수 숫자 문자열을 개수(정수)로 변환
   예) "2상자 3세트 5개" → 2×3456 + 3×64 + 5 = 7109
       "1000" → 1000 */
function parseQty(str) {
  if (!str || !str.trim()) return 0;
  // 순수 숫자면 그대로 반환
  if (/^\d+$/.test(str.trim())) return Math.max(0, parseInt(str.trim(), 10));
  let total = 0;
  const boxMatch  = str.match(/(\d+)\s*상자/);
  const setMatch  = str.match(/(\d+)\s*세트/);
  const itemMatch = str.match(/(\d+)\s*개/);
  if (boxMatch)  total += parseInt(boxMatch[1],  10) * BOX_SIZE;
  if (setMatch)  total += parseInt(setMatch[1],  10) * SET_SIZE;
  if (itemMatch) total += parseInt(itemMatch[1], 10);
  return total;
}

/* 시간을 "X시간 Y분 Z초" 형식으로 포맷 */
export function fmtTime(sec) {
  if (sec <= 0) return '0초';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  return [[h,'시간'],[m,'분'],[s,'초']]
    .filter(([v]) => v > 0)
    .map(([v, u]) => v + u)
    .join(' ');
}

/* DOM 요소의 숫자값을 읽어옴 (없거나 음수면 0) */
export function gi(id) {
  const e = document.getElementById(id);
  return e ? Math.max(0, +e.value || 0) : 0;
}

/* DOM 요소의 문자열값을 읽어옴 */
export function gv(id) {
  const e = document.getElementById(id);
  return e ? e.value : '';
}

/* 배지(뱃지) HTML 생성 헬퍼 */
const bdg = (cls, txt) => `<span class="bdg ${cls}">${txt}</span>`;

/* 결과 행 HTML 생성 헬퍼 */
const row = (l, v, vc = '') =>
  `<div class="rrow"><span class="rl">${l}</span><span class="rv ${vc}">${v}</span></div>`;


/* ════════════════════════════════════════
   ② 재료 칩 렌더링
   수익 최적화 탭에서 제작 계획의 재료 목록을
   색상 배지(chip) 형태로 출력
════════════════════════════════════════ */

/* 재료별 표시 이름, 색상, 단위 정의 */
const MAT_META = {
  cobblestone:           { name:'조약돌 묶음',        color:'#8a7060', unit:'개', perUnit:1 },
  deepslate_cobblestone: { name:'심층암 조약돌 묶음',  color:'#5a5570', unit:'개', perUnit:1 },
  copper:                { name:'구리 블럭',           color:'#c87941', unit:'개',   perUnit:1  },
  iron:                  { name:'철 블럭',             color:'#a0a0a0', unit:'개',   perUnit:1  },
  gold:                  { name:'금 블럭',             color:'#d4a020', unit:'개',   perUnit:1  },
  diamond:               { name:'다이아몬드 블럭',     color:'#38c8d0', unit:'개',   perUnit:1  },
  redstone:              { name:'레드스톤 블럭',       color:'#d94f3d', unit:'개',   perUnit:1  },
  lapis:                 { name:'청금석 블럭',         color:'#3d6fd4', unit:'개',   perUnit:1  },
  amethyst:              { name:'자수정 블럭',         color:'#9b6dd4', unit:'개',   perUnit:1  },
  topaz:                 { name:'토파즈 블럭',         color:'#d4a020', unit:'개',   perUnit:1  },
  sapphire:              { name:'사파이어 블럭',       color:'#3d6fd4', unit:'개',   perUnit:1  },
  platinum:              { name:'플레티넘 블럭',       color:'#9ab0c8', unit:'개',   perUnit:1  },
  diorite:               { name:'섬록암',              color:'#cedab4', unit:'개', perUnit:1 },
  tuff:                  { name:'응회암',              color:'#8a9a7a', unit:'개', perUnit:1 },
  andesite:              { name:'안산암',              color:'rgb(200, 162, 112)', unit:'개', perUnit:1 },};

/* 재료 chip HTML 생성 — 색상 적용, 묶음/세트 단위 자동 변환 */
function matChipQty(matKey, totalQty) {
  const m = MAT_META[matKey] || { name: matKey, color: '#888', unit: '개', perUnit: 1 };
  let displayStr;
  if (m.unit === '묶음' || m.unit === '세트') {
    // 64개 단위로 올림 변환
    const bundles = Math.ceil(totalQty / m.perUnit);
    displayStr = fmtQtyLabel(bundles, m.unit);
  } else {
    displayStr = fmtQtyLabel(totalQty, m.unit);
  }
  return `<span class="mat-chip" style="background:${m.color}18;color:${m.color};border-color:${m.color}55">${m.name} ${displayStr}</span>`;
}


/* ════════════════════════════════════════
   ③ 탭 전환
════════════════════════════════════════ */

export function sw(i, el) {
  // 모든 탭 버튼 비활성화
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  // 모든 패널 숨김
  for (let k = 0; k < 3; k++) {
    const p = document.getElementById('t' + k);
    if (p) p.style.display = 'none';
  }
  // 선택된 탭 활성화
  el.classList.add('on');
  document.getElementById('t' + i).style.display = 'block';
}


/* ════════════════════════════════════════
   ④ 스킬·각인석 값 읽기
════════════════════════════════════════ */

/* 스킬 레벨을 읽어 각 배율·수치를 반환 */
export function getSK() {
  const fl  = gi('skillFurnace');
  const il  = gi('skillIngotSell');
  const gl  = gi('skillGemSell');
  const cl  = gi('skillCobby');
  const sl  = gi('skillSparkle');
  const ll  = gi('skillLucky');
  const fpl = gi('skillFirePick');
  const pl  = gi('skillPrecious');

  const sp = SKILLS.SPARKLE.drops[sl]   || { pct: 0, count: 0 };
  const lk = SKILLS.LUCKY_HIT.drops[ll] || { pct: 0, count: 0 };

  return {
    fr: (SKILLS.FURNACE.reductionPct[fl]  ?? 0) / 100,  // 제작시간 감소율 (0~1)
    ib: (SKILLS.INGOT_SELL.bonusPct[il]   ?? 0) / 100,  // 주괴 판매 보너스 (0~1)
    gb: (SKILLS.GEM_SELL.bonusPct[gl]     ?? 0) / 100,  // 보석 판매 보너스 (0~1)
    ca: SKILLS.COBYTIME.dropPct[cl]       ?? 0,          // 코비타임 추가 확률(%)
    sp: sp.pct, sc: sp.count,                            // 반짝임 확률(%), 드랍수
    lp: lk.pct, lc: lk.count,                            // 럭키히트 확률(%), 드랍수
    fp: SKILLS.FIRE_PICK.dropPct[fpl]     ?? 0,          // 불붙은 곡괭이 확률(%)
    pb: (SKILLS.PRECIOUS.bonusPct[pl]     ?? 0) / 100,  // 귀중품 판매 보너스 (0~1)
    fl, il, gl, cl, sl, ll, fpl, pl,                    // 원본 레벨값 (배지 표시용)
  };
}

/* 각인석 레벨을 읽어 각 수치를 반환 */
export function getENG() {
  const ol = gi('engOreLuck');
  const rl = gi('engRelic');
  const cl = gi('engCobby');
  const gc = gi('engGemCobby');
  const ca = gi('engCart');
  const ro = gi('engRoulette');

  return {
    op: ENGRAVING.ORE_LUCK.extraOrePct[ol]           ?? 0,  // 광물행운 추가 확률(%)
    ap: ENGRAVING.RELIC_SEARCH.extraArtifactPct[rl]  ?? 0,  // 유물탐색 추가 확률(%)
    cp: ENGRAVING.COBBY_SUMMON.extraCobbyPct[cl]     ?? 0,  // 코비소환 추가 확률(%)
    gp: ENGRAVING.GEM_COBBY.gemConvertPct[gc]        ?? 0,  // 보석코비 전환 확률(%)
    kp: ENGRAVING.MINE_CART.cartPct[ca]              ?? 0,  // 광산수레 등장 확률(%)
    dp: ENGRAVING.MINER_ROULETTE.dicePct[ro]         ?? 0,  // 광부룰렛 등장 확률(%)
    ol, rl, cl, gc, ca, ro,                                  // 원본 레벨값
  };
}


/* ════════════════════════════════════════
   ⑤ 스킬 패널 info 텍스트 업데이트
   셀렉터를 바꿀 때마다 호출됨
════════════════════════════════════════ */

export function onSkillChange() {
  const st = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
  const { fl, il, gl, cl, sl, ll, fpl, pl } = getSK();

  st('skillFurnaceInfo',
    fl === 0 ? '기본' : `Lv${fl} — ${SKILLS.FURNACE.reductionPct[fl]}% 감소`);
  st('skillIngotSellInfo',
    il === 0 ? '기본' : `Lv${il} — 주괴 +${SKILLS.INGOT_SELL.bonusPct[il]}%`);
  st('skillGemSellInfo',
    gl === 0 ? '기본' : `Lv${gl} — 보석 +${SKILLS.GEM_SELL.bonusPct[gl]}%`);
  st('skillPreciousInfo',
    pl === 0 ? '기본' : `Lv${pl} — 귀중품 +${SKILLS.PRECIOUS.bonusPct[pl]}%`);
  st('skillCobbyInfo',
    cl === 0 ? '기본' : `Lv${cl} — 코비 +${SKILLS.COBYTIME.dropPct[cl]}%`);

  const sp = SKILLS.SPARKLE.drops[sl];
  st('skillSparkleInfo',
    sl === 0 ? '기본' : sp ? `Lv${sl} — ${sp.pct}% / ${sp.count}개` : '');

  const lk = SKILLS.LUCKY_HIT.drops[ll];
  st('skillLuckyInfo',
    ll === 0 ? '기본' : lk ? `Lv${ll} — ${lk.pct}% / +${lk.count}개` : '');

  st('skillFirePickInfo',
    fpl === 0 ? '기본' : `Lv${fpl} — ${SKILLS.FIRE_PICK.dropPct[fpl]}% 주괴 드롭`);

  // 값이 바뀌면 모든 탭 재계산
  cs(); ct(); co();
}

export function onEngravingChange() {
  const st = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
  const { ol, rl, cl, gc, ca, ro } = getENG();

  st('engOreLuckInfo',
    ol === 0 ? '없음' : `Lv${ol} — ${ENGRAVING.ORE_LUCK.extraOrePct[ol]}% / +1개`);
  st('engRelicInfo',
    rl === 0 ? '없음' : `Lv${rl} — 유물 +${ENGRAVING.RELIC_SEARCH.extraArtifactPct[rl]}%`);
  st('engCobbyInfo',
    cl === 0 ? '없음' : `Lv${cl} — 코비 +${ENGRAVING.COBBY_SUMMON.extraCobbyPct[cl]}%`);
  st('engGemCobbyInfo',
    gc === 0 ? '없음' : `Lv${gc} — 보석코비 ${ENGRAVING.GEM_COBBY.gemConvertPct[gc]}%`);
  st('engCartInfo',
    ca === 0 ? '없음' : `Lv${ca} — ${ENGRAVING.MINE_CART.cartPct[ca]}% 광산수레`);
  st('engRouletteInfo',
    ro === 0 ? '없음' : `Lv${ro} — ${ENGRAVING.MINER_ROULETTE.dicePct[ro]}% 주사위`);

  cs(); // 채굴 수익만 각인석 영향을 받음
}


/* ════════════════════════════════════════
   ⑥ 핵심 채굴 계산 함수 (기댓값 기반)
   TAB 0 cs()와 80% 보정 calc80Ingots() 모두
   이 함수의 결과를 공유
════════════════════════════════════════ */

function calcMining() {
  const sk  = getSK();
  const eng = getENG();
  const enh      = gi('pickaxeLevel');
  const stamina  = gi('totalStamina');
  const oreType  = gv('oreType') || 'even';
  const px       = PICKAXE[enh] ?? PICKAXE[0];

  /* 채굴 횟수 = 총 스태미나 ÷ 1회 소비량 */
  const miningCount = stamina > 0 ? Math.floor(stamina / MINING.STAMINA_PER_USE) : 0;

  /* ── 광석 기댓값 계산 ──────────────────
     회당 광석 = 기본 + 럭키히트 + 광물행운 + 광부룰렛
     각 요소는 독립 확률이므로 기댓값 합산 */

  // 럭키히트: 발동확률 × 추가드랍수
  const luckyExtra = (sk.lp / 100) * sk.lc;

  // 광물행운: 발동확률(%)을 0~1로 변환
  const oreLuckExtra = eng.op / 100;

  // 광부룰렛: 등장확률 × (일반90% × 평균눈수×배율 + 황금10% × 평균눈수×배율)
  const avgDice = 3.5; // 주사위 눈수 1~6 평균
  const rouletteExtra = (eng.dp / 100) * (
    0.9 * avgDice * ENGRAVING.MINER_ROULETTE.normalMult +
    0.1 * avgDice * ENGRAVING.MINER_ROULETTE.goldenMult
  );

  const oresPerUse = px.oresPerUse + luckyExtra + oreLuckExtra + rouletteExtra;
  const totalOres  = miningCount * oresPerUse;

  /* ── 광석 종류별 배분 ── */
  let oreC = 0, oreR = 0, oreS = 0;
  if      (oreType === 'corum')  oreC = totalOres;
  else if (oreType === 'rifton') oreR = totalOres;
  else if (oreType === 'serent') oreS = totalOres;
  else { // 골고루: 3등분 (나머지는 세렌트에)
    oreC = totalOres / 3;
    oreR = totalOres / 3;
    oreS = totalOres - oreC - oreR;
  }

  /* ── 광석 → 주괴 변환 ── */
  const ingotFromOreC = oreC / INGOT_RECIPES.CORUM.ores_per_ingot;
  const ingotFromOreR = oreR / INGOT_RECIPES.RIFTON.ores_per_ingot;
  const ingotFromOreS = oreS / INGOT_RECIPES.SERENT.ores_per_ingot;

  /* ── 강화횃불 필요량 계산 ── */
  const totalTorch = ingotFromOreC * INGOT_RECIPES.CORUM.torch_per_ingot
                   + ingotFromOreR * INGOT_RECIPES.RIFTON.torch_per_ingot
                   + ingotFromOreS * INGOT_RECIPES.SERENT.torch_per_ingot;

  /* ── 불붙은 곡괭이 주괴 드랍 기댓값 ── */
  const fpDrops = miningCount * (sk.fp / 100);
  let fpC = 0, fpR = 0, fpS = 0;
  if      (oreType === 'corum')  fpC = fpDrops;
  else if (oreType === 'rifton') fpR = fpDrops;
  else if (oreType === 'serent') fpS = fpDrops;
  else { fpC = fpDrops / 3; fpR = fpDrops / 3; fpS = fpDrops - fpC - fpR; }

  /* ── 최종 주괴 수 = 광석변환 + 직접드랍 ── */
  const totalIngotC = ingotFromOreC + fpC;
  const totalIngotR = ingotFromOreR + fpR;
  const totalIngotS = ingotFromOreS + fpS;

  /* ── 코비 & 보석 계산 ── */
  // 전체 코비 확률 = 곡괭이 + 코비타임 스킬 + 코비소환 각인석
  const totalCobbyPct = px.cobbyPct + sk.ca + eng.cp;
  const cobbyCount    = miningCount * (totalCobbyPct / 100);
  // 보석코비 전환 기댓값
  const gemCobby    = cobbyCount * (eng.gp / 100) * COBBY_DROP_RATE;
  // 일반코비 → 스킬펄스
  const normalCobby = (cobbyCount - cobbyCount * (eng.gp / 100)) * COBBY_DROP_RATE;


  // 반짝임의 시작 보석 드랍
  const sparkleGems = miningCount * (sk.sp / 100) * sk.sc;
  const totalGems   = sparkleGems + gemCobby;

  /* ── 유물 계산 ── */
  const totalArtPct   = px.artifactPct + eng.ap; // 곡괭이 + 유물탐색 각인석
  const artDrops      = miningCount * (totalArtPct / 100);
  const cartDrops     = miningCount * (eng.kp / 100); // 광산수레 등장 횟수
  const totalArtifacts = artDrops + cartDrops * 2;    // 수레 1회당 평균 2개
  const totalArtPts   = totalArtifacts * ARTIFACT.avgPoints;

  return {
    miningCount, oreType, px, enh,
    totalOres, oreC, oreR, oreS,
    ingotFromOreC, ingotFromOreR, ingotFromOreS,
    totalTorch,
    fpDrops, fpC, fpR, fpS,
    totalIngotC, totalIngotR, totalIngotS,
    totalIngotAll: totalIngotC + totalIngotR + totalIngotS,
    cobbyCount, gemCobby, normalCobby, totalGems, sparkleGems, totalCobbyPct,
    artDrops, cartDrops, totalArtifacts, totalArtPts,
    oresPerUse, sk, eng,
  };
}


/* ════════════════════════════════════════
   ⑦ 80% 확률 보정 계산
   이항분포 정규근사:
     80% 확률로 최소 k개 이상 얻으려면
     k ≈ n*p - Z80 * sqrt(n*p*(1-p))
     Z80 = 0.842 (표준정규 80번째 백분위 역수)
   → 기댓값보다 낮은 "보수적 예상치" 계산
════════════════════════════════════════ */

const Z80 = 0.842;

/* 시행 n번, 성공확률 p일 때 80% 이상 보장되는 최솟값 */
function floor80(n, p) {
  if (p <= 0 || n <= 0) return 0;
  if (p >= 1) return n;
  const mu  = n * p;
  const sig = Math.sqrt(n * p * (1 - p));
  return Math.max(0, mu - Z80 * sig);
}

/* calcMining() 결과를 받아 각 드랍 요소별로 80% 보정치를 계산 */
function calc80Ingots(m) {
  const sk  = m.sk;
  const eng = m.eng;
  const n   = m.miningCount;

  /* ── 광석 80% 보정 ── */
  // 럭키히트: 발동 횟수 80% floor × 드랍수
  const luckyOre80   = floor80(n, sk.lp / 100) * sk.lc;
  // 광물행운: 발동 횟수 80% floor × 1개
  const oreLuck80    = floor80(n, eng.op / 100) * 1;
  // 광부룰렛: 등장 횟수 80% floor, 그 안에서 황금 비율도 80% floor
  const diceCount80  = floor80(n, eng.dp / 100);
  const golden80     = floor80(diceCount80, ENGRAVING.MINER_ROULETTE.goldenPct / 100);
  const normal80     = diceCount80 - golden80;
  const rouletteOre80 = normal80 * 3.5 * ENGRAVING.MINER_ROULETTE.normalMult
                      + golden80 * 3.5 * ENGRAVING.MINER_ROULETTE.goldenMult;

  // 80% 기준 총 광석 = 기본(고정) + 확률요소들의 80% floor
  const totalOres80 = n * m.px.oresPerUse + luckyOre80 + oreLuck80 + rouletteOre80;

  // 광석 배분 (80% 기준)
  const { oreType } = m;
  let oreC80 = 0, oreR80 = 0, oreS80 = 0;
  if      (oreType === 'corum')  oreC80 = totalOres80;
  else if (oreType === 'rifton') oreR80 = totalOres80;
  else if (oreType === 'serent') oreS80 = totalOres80;
  else { oreC80 = totalOres80/3; oreR80 = totalOres80/3; oreS80 = totalOres80 - oreC80 - oreR80; }

  // 주괴 변환 (80% 기준)
  const iC80 = oreC80 / INGOT_RECIPES.CORUM.ores_per_ingot;
  const iR80 = oreR80 / INGOT_RECIPES.RIFTON.ores_per_ingot;
  const iS80 = oreS80 / INGOT_RECIPES.SERENT.ores_per_ingot;

  // 불붙은 곡괭이 80% floor
  const fp80 = floor80(n, sk.fp / 100);
  let fpC80 = 0, fpR80 = 0, fpS80 = 0;
  if      (oreType === 'corum')  fpC80 = fp80;
  else if (oreType === 'rifton') fpR80 = fp80;
  else if (oreType === 'serent') fpS80 = fp80;
  else { fpC80 = fp80/3; fpR80 = fp80/3; fpS80 = fp80 - fpC80 - fpR80; }

  const tC80 = iC80 + fpC80;
  const tR80 = iR80 + fpR80;
  const tS80 = iS80 + fpS80;

  /* ── 보석·코비 80% 보정 ── */
  const sparkle80      = floor80(n, sk.sp / 100) * sk.sc;
  const cobby80        = floor80(n, m.totalCobbyPct / 100);
  const gemCobby80    = floor80(cobby80, eng.gp / 100) * COBBY_DROP_RATE;
  const normalCobby80 = (cobby80 - floor80(cobby80, eng.gp / 100)) * COBBY_DROP_RATE;
  const totalGems80    = sparkle80 + gemCobby80;

  /* ── 유물 80% 보정 ── */
  const totalArtPct = m.px.artifactPct + eng.ap;
  const art80       = floor80(n, totalArtPct / 100);
  const cart80      = floor80(n, eng.kp / 100);
  const totalArt80  = art80 + cart80 * 2;
  const artPts80    = totalArt80 * ARTIFACT.avgPoints;

  return {
    tC80, tR80, tS80,
    totalGems80, sparkle80, gemCobby80, normalCobby80, cobby80,
    artPts80, totalArt80, totalOres80, iC80, iR80, iS80, fp80,
  };
}


/* ════════════════════════════════════════
   ⑧ TAB 0: 채굴 수익 계산기
════════════════════════════════════════ */

/* 광석 종류별 색상 */
const CC = '#e07b2a'; // 코룸 — 주황
const CR = '#3a9e68'; // 리프톤 — 초록
const CS = '#d94f3d'; // 세렌트 — 빨강

export function cs() {
  const m   = calcMining();
  const p80 = calc80Ingots(m);
  const sk  = m.sk;
  const eng = m.eng;

  /* ── 판매가 읽기 (미입력 시 기본값 사용) ── */
  const rawIC = gi('ingotPriceC') || DEFAULT_PRICES.ingot.corum;
  const rawIR = gi('ingotPriceR') || DEFAULT_PRICES.ingot.rifton;
  const rawIS = gi('ingotPriceS') || DEFAULT_PRICES.ingot.serent;
  const rawGC = gi('gemPriceC')   || DEFAULT_PRICES.gem.corum;
  const rawGR = gi('gemPriceR')   || DEFAULT_PRICES.gem.rifton;
  const rawGS = gi('gemPriceS')   || DEFAULT_PRICES.gem.serent;
  const spPrice    = gi('skillPulsePrice');
  const artPtPrice = gi('artifactPtPrice') / 100; // 입력: 원/100pt → 계산: 원/pt

  /* ── 스킬 보너스 적용 판매가 ── */
  const bC = rawIC * (1 + sk.ib); // 코룸 주괴
  const bR = rawIR * (1 + sk.ib); // 리프톤 주괴
  const bS = rawIS * (1 + sk.ib); // 세렌트 주괴

  // 보석 단가: 캐는 광석 종류에 맞는 보석 가격 적용
  let gemUnit = 0;
  const ot = m.oreType;
  if      (ot === 'corum')  gemUnit = rawGC * (1 + sk.gb);
  else if (ot === 'rifton') gemUnit = rawGR * (1 + sk.gb);
  else if (ot === 'serent') gemUnit = rawGS * (1 + sk.gb);
  else gemUnit = ((rawGC + rawGR + rawGS) / 3) * (1 + sk.gb); // 골고루: 평균

  /* ── 기댓값 수익 계산 ── */
  const ingotRev = m.totalIngotC * bC + m.totalIngotR * bR + m.totalIngotS * bS;
  const gemRev   = m.totalGems * gemUnit;
  const spRev    = m.normalCobby * spPrice;
  const artRev   = artPtPrice > 0 ? m.totalArtPts * artPtPrice : 0;
  const totalRev = ingotRev + gemRev + spRev + artRev;

  /* ── 80% 보정 수익 계산 ── */
  const ingotRev80 = p80.tC80 * bC + p80.tR80 * bR + p80.tS80 * bS;
  const gemRev80   = p80.totalGems80 * gemUnit;
  const spRev80    = p80.normalCobby80 * spPrice;
  const artRev80   = artPtPrice > 0 ? p80.artPts80 * artPtPrice : 0;
  const totalRev80 = ingotRev80 + gemRev80 + spRev80 + artRev80;

  /* ── 횃불 종류별 필요량 ── */
  const torchC = m.ingotFromOreC * INGOT_RECIPES.CORUM.torch_per_ingot;
  const torchR = m.ingotFromOreR * INGOT_RECIPES.RIFTON.torch_per_ingot;
  const torchS = m.ingotFromOreS * INGOT_RECIPES.SERENT.torch_per_ingot;

  /* ── 주괴 요약 텍스트 (색상 적용, 0종 제외) ── */
  const ingotParts = [
    m.totalIngotC > 0.01 ? `<span style="color:${CC}">코룸 ${f(m.totalIngotC)}개</span>` : '',
    m.totalIngotR > 0.01 ? `<span style="color:${CR}">리프톤 ${f(m.totalIngotR)}개</span>` : '',
    m.totalIngotS > 0.01 ? `<span style="color:${CS}">세렌트 ${f(m.totalIngotS)}개</span>` : '',
  ].filter(Boolean).join(' · ');

  const ingot80Parts = [
    p80.tC80 > 0.01 ? `<span style="color:${CC}">코룸 ${f(p80.tC80)}개</span>` : '',
    p80.tR80 > 0.01 ? `<span style="color:${CR}">리프톤 ${f(p80.tR80)}개</span>` : '',
    p80.tS80 > 0.01 ? `<span style="color:${CS}">세렌트 ${f(p80.tS80)}개</span>` : '',
  ].filter(Boolean).join(' · ');

  /* ── 스킬 배지 ── */
  const iBdg = sk.ib > 0 ? bdg('bg', `주괴 좀 사 주괴 +${Math.round(sk.ib * 100)}%`) : '';
  const gBdg = sk.gb > 0 ? bdg('bg', `눈이 부셔 +${Math.round(sk.gb * 100)}%`) : '';

  /* ── 광석→주괴 행 (0이면 출력 생략) ── */
  const cRow = (label, oreAmt, ingotAmt, color, torchAmt) => {
    if (oreAmt <= 0.01) return '';
    const torchStr = torchAmt > 0.01
      ? ` <span style="color:var(--blue);font-size:10px">(횃불 ${f(torchAmt)}개)</span>`
      : '';
    return `<div class="rrow">
      <span class="rl" style="color:${color};font-weight:700">${label}</span>
      <span class="rv">${f(oreAmt)}개 → 주괴 <b style="color:${color}">${f(ingotAmt)}개</b>${torchStr}</span>
    </div>`;
  };

  /* ── HTML 조립 ── */
  let html = `
  <div class="rsec">
    ${row('곡괭이', `${m.enh}강 — 기본 ${m.px.oresPerUse}개/회 · 유물 ${m.px.artifactPct}% · 코비 ${m.px.cobbyPct}%`)}
    ${row('채굴 횟수', `${f(m.miningCount)}회`)}
    ${m.oresPerUse !== m.px.oresPerUse
      ? row('회당 평균 광석 (보정 후)', `${fd(m.oresPerUse)}개`, 'g')
      : row('회당 광석', `${m.px.oresPerUse}개`, 'g')}
    ${row('총 획득 광석', `${f(m.totalOres)}개`, 'g')}
  </div>

  <div class="rsec">
    <div class="rsec-title">⛏ 광석 → 주괴 변환</div>
    ${cRow('코룸',   m.oreC, m.ingotFromOreC, CC, torchC)}
    ${cRow('리프톤', m.oreR, m.ingotFromOreR, CR, torchR)}
    ${cRow('세렌트', m.oreS, m.ingotFromOreS, CS, torchS)}
    ${m.totalTorch > 0.01
      ? `<div class="rrow"><span class="rl" style="color:var(--blue)">🔥 필요 강화횃불 합계</span><span class="rv b">${f(m.totalTorch)}개</span></div>`
      : ''}
    ${m.fpDrops > 0.01
      ? `<div class="rrow"><span class="rl">불붙은 곡괭이 ${bdg('bg','Lv'+sk.fpl)}</span><span class="rv">+${fd(m.fpDrops)}개 주괴</span></div>`
      : ''}
    <div class="rrow rrow-strong">
      <span class="rl" style="color:var(--text)">최종 총 주괴 (기댓값)</span>
      <span class="rv p">${f(m.totalIngotAll)}개 &nbsp;<small>${ingotParts}</small></span>
    </div>
  </div>`;

  // 보석·코비 섹션 (드랍이 있을 때만)
  if (m.totalGems > 0 || m.cobbyCount > 0) {
    html += `
  <div class="rsec">
    <div class="rsec-title">💎 보석 & 코비</div>
    ${m.sparkleGems > 0 ? row(`반짝임의 시작 ${bdg('bg','Lv'+sk.sl)}`, `${fd(m.sparkleGems)}개`) : ''}
    ${m.cobbyCount  > 0 ? row(`코비 소환 (${fd(m.totalCobbyPct)}%)`, `${fd(m.cobbyCount)}회`) : ''}
    ${m.gemCobby    > 0 ? row(`└ 보석코비 ${bdg('bpu', eng.gp+'%')}`, `${fd(m.gemCobby)}개`) : ''}
    ${m.normalCobby > 0 ? row('└ 일반코비 (스킬펄스)', `${fd(m.normalCobby)}개`) : ''}
    ${m.totalGems   > 0 ? `<div class="rrow rrow-strong"><span class="rl">총 보석 (기댓값)</span><span class="rv p">${fd(m.totalGems)}개</span></div>` : ''}
    ${m.normalCobby > 0 ? `<div class="rrow rrow-strong"><span class="rl">스킬펄스 (기댓값)</span><span class="rv p">${fd(m.normalCobby)}개</span></div>` : ''}
  </div>`;
  }

  // 유물 섹션 (드랍이 있을 때만)
  if (m.totalArtifacts > 0) {
    html += `
  <div class="rsec">
    <div class="rsec-title">🗿 유물</div>
    ${row(`유물 드랍 (${fd(m.px.artifactPct + eng.ap)}%)`, `${fd(m.artDrops)}개`)}
    ${m.cartDrops > 0
      ? row(`광산수레 ${bdg('bb','Lv'+eng.ca)}`, `${fd(m.cartDrops)}회 → ${fd(m.cartDrops*2)}개`)
      : ''}
    <div class="rrow rrow-strong"><span class="rl">총 유물 포인트 (기댓값)</span><span class="rv b">${f(m.totalArtPts)}pt</span></div>
  </div>`;
  }

  // 수익 합산
  html += `
  <div class="rsec">
    <div class="rsec-title">💰 기댓값 수익 (전량 판매)</div>
    ${row(`주괴 수익 ${iBdg}`, `${f(ingotRev)}원`, 'g')}
    ${m.totalGems > 0
      ? row(`보석 수익 ${gBdg}`, `${f(gemRev)}원`, 'g')
      : ''}
    ${m.normalCobby > 0
      ? (spPrice > 0
        ? row('스킬펄스 수익', `${f(spRev)}원`, 'g')
        : row('스킬펄스', '단가 미입력', 'muted'))
      : ''}
    ${m.totalArtifacts > 0
      ? (artPtPrice > 0
        ? row('유물 수익', `${f(artRev)}원`, 'g')
        : row('유물 포인트', '단가 미입력', 'muted'))
      : ''}
  </div>

  <div class="result-box">
    <div style="display:flex;gap:12px;align-items:stretch">
      <div style="flex:1;text-align:center;padding:4px 8px">
        <div class="rb-label">하루 평균 수익</div>
        <div class="rb-value">${f(totalRev)}원</div>
        <span class="rb-sub">주괴 ${f(m.totalIngotAll)}개</span>
      </div>
      <div style="width:1px;background:var(--border2);margin:4px 0;flex:none"></div>
      <div style="flex:1;text-align:center;padding:4px 8px">
        <div class="rb-label">80% 확률로 최소</div>
        <div class="rb-value rb-floor">${f(totalRev80)}원</div>
        <span class="rb-sub">
          ${ingot80Parts}
          ${p80.totalGems80 > 0 ? ` · 보석 ${fd(p80.totalGems80)}개` : ''}
          ${p80.normalCobby80 > 0 ? ` · 펄스 ${fd(p80.normalCobby80)}개` : ''}
        </span>
      </div>
    </div>
  </div>`;

  document.getElementById('sRes').innerHTML = html;
}


/* ════════════════════════════════════════
   ⑨ TAB 1: 강화횃불 제작기
════════════════════════════════════════ */

export function ct() {
  const sk = getSK();

  /* 제작시간 (용광로 스킬 감소율 적용) */
  const timePerTorch = TORCH.craft_time_sec * (1 - sk.fr);

  /* 재료 개당 가격 계산 */
  const charU = gi('tCharcoalPrice') / SET_SIZE;
  const woodSetPrice = gi('tWoodPrice');
  const stickU = woodSetPrice / (SET_SIZE * 8);

  /* 만들 횃불 수 — "n상자 n세트 n개" 또는 숫자 파싱 */
  const tWantEl = document.getElementById('tWantCount');
  const wantN   = parseQty(tWantEl ? tWantEl.value : '');

  /* 파싱 결과를 입력칸 아래에 표시 */
  const parsedEl = document.getElementById('tWantCountParsed');
  if (parsedEl) {
    parsedEl.textContent = wantN > 0 ? `(총 ${wantN.toLocaleString('ko-KR')}개)` : '';
  }

  const sellEa = gi('tSellPrice') / SET_SIZE;
  const costEa = charU + stickU;
  const totalCost = costEa * wantN;
  const totalTime = timePerTorch * wantN;

  const hasPrice = sellEa > 0;
  const totalRev = hasPrice ? sellEa * wantN : 0;
  const net      = totalRev - totalCost;

  const needWoodLogs = wantN / 8;

  const fBdg = sk.fr > 0
    ? bdg('bg', `용광로 Lv${sk.fl} -${Math.round(sk.fr * 100)}%`)
    : '';

  document.getElementById('tRes').innerHTML = `
  <div class="rsec">
    ${row('숯/석탄 개당', `${charU.toFixed(1)}원`)}
    ${row('원목 세트당', `${f(woodSetPrice)}원 → 막대기 개당 ${stickU.toFixed(1)}원`)}
    ${row('횃불 1개 재료비', `${costEa.toFixed(1)}원`, 'r')}
  </div>
  <div class="rsec">
    ${row('필요 숯/석탄', fmtQty(wantN), 'g')}
    ${row('필요 원목', fmtQtyLabel(Math.ceil(needWoodLogs), '개'), 'g')}
    ${row('총 재료비', `${f(totalCost)}원`, 'r')}
  </div>
  <div class="rsec">
    ${row(`1개당 제작 시간 ${fBdg}`, fmtTime(timePerTorch), 'b')}
    ${row('총 제작 시간', fmtTime(totalTime), 'b')}
  </div>
  <div class="result-box">
    <div class="rb-label">${hasPrice ? '순이익' : '총 재료비'}</div>
    <div class="rb-value" style="color:${hasPrice ? (net >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--red)'}">
      ${f(hasPrice ? net : totalCost)}원
    </div>
  </div>`;
}


/* ════════════════════════════════════════
   ⑩ TAB 2: 주괴 & 귀중품 통합 최적화
   보유 주괴를 어떻게 쓸 때 수익이 최대인지
   순이익 높은 옵션부터 그리디로 소진
════════════════════════════════════════ */

export function co() {
  const { ib, fr, pb } = getSK();

  /* ── 주괴 보유량 & 스킬 적용 단가 ── */
  const iCo = parseQty(document.getElementById('iCo')?.value || '');
  const iRi = parseQty(document.getElementById('iRi')?.value || '');
  const iSe = parseQty(document.getElementById('iSe')?.value || '');
  
  const showParsed = (spanId, n) => {
    const el = document.getElementById(spanId);
    if (el) el.textContent = n > 0 ? `(총 ${n.toLocaleString('ko-KR')}개)` : '';
  };
  
  showParsed('iCoParsed', iCo);
  showParsed('iRiParsed', iRi);
  showParsed('iSeParsed', iSe);
  
  const cP  = (gi('oCo') || DEFAULT_PRICES.ingot.corum)  * (1 + ib);
  const rP  = (gi('oRi') || DEFAULT_PRICES.ingot.rifton) * (1 + ib);
  const sP  = (gi('oSe') || DEFAULT_PRICES.ingot.serent) * (1 + ib);

  /* ── 라이프스톤·어빌리티 스톤 판매가 & 제작시간 ── */
  const oL1 = gi('oL1'), oL2 = gi('oL2'), oL3 = gi('oL3'), oAb = gi('oAb');
  // 제작시간은 config 고정값 사용, 용광로 스킬 감소율 적용
  const ctL1 = RECIPES.LS1.craft_time_sec  * (1 - fr);
  const ctL2 = RECIPES.LS2.craft_time_sec  * (1 - fr);
  const ctL3 = RECIPES.LS3.craft_time_sec  * (1 - fr);
  const ctAb = RECIPES.ABIL.craft_time_sec * (1 - fr);

  /* ── 바닐라 재료 개당 가격 (세트가 ÷ 64) ── */
  const vp = {
    cobblestone:           gi('vCo') / SET_SIZE,
    deepslate_cobblestone: gi('vDc') / SET_SIZE,
    copper:                gi('vCu') / SET_SIZE,
    iron:                  gi('vIr') / SET_SIZE,
    gold:                  gi('vGo') / SET_SIZE,
    diamond:               gi('vDi') / SET_SIZE,
    redstone:              gi('vRe') / SET_SIZE,
    lapis:                 gi('vLa') / SET_SIZE,
    amethyst:              gi('vAm') / SET_SIZE,
  };
  // 레시피 타입의 바닐라 재료 총 원가 계산
  const vc = type =>
    Object.entries(RECIPES[type].vanilla || {})
      .reduce((s, [mat, qty]) => s + qty * (vp[mat] || 0), 0);

  /* ── 귀중품 재료 개당 가격 ──
     레드스톤·청금석·금은 바닐라 재료와 공유 */
  const pvp = {
    topaz:       gi('vTopaz'),
    sapphire:    gi('vSapphire'),
    platinum:    gi('vPlatinum'),
    redstone:    gi('vRe') / SET_SIZE,  // 바닐라와 공유
    lapis:       gi('vLa') / SET_SIZE,  // 바닐라와 공유
    gold:        gi('vGo') / SET_SIZE,  // 바닐라와 공유
    diorite:     gi('vDiorite') / SET_SIZE,
    tuff:        gi('vTuff')       / SET_SIZE,
    andesite:    gi('vAndesite') / SET_SIZE,
  };

  const AP  = PRECIOUS.APPRAISAL;
  const DOC = PRECIOUS.DOC_PRICE;

  /* ── 귀중품 3종 기댓값 & 순이익 계산 ── */
  const precItems = Object.entries(PRECIOUS.ITEMS).map(([key, item]) => {
    const rec      = RECIPES[item.recipe];
    // 귀중품 종류에 따른 주괴 단가
    const iPrice   = item.ingotType === 'corum'  ? cP
                   : item.ingotType === 'rifton' ? rP : sP;
    const ingotCnt = rec.ingot_corum || rec.ingot_rifton || rec.ingot_serent || 0;
    const ingotCost = ingotCnt * iPrice;
    const vanCost   = Object.entries(rec.vanilla || {})
      .reduce((s, [mat, qty]) => s + qty * (pvp[mat] || 0), 0)
      + (rec.doc || 0) * DOC;
    const totalCost = ingotCost + vanCost;
    // 감정 기댓값 = 각 등급 가격 × 확률 합산, 귀하신 몸값 스킬 적용
    const avgSell   = (
      item.prices.LOW   * AP.LOW.pct   / 100 +
      item.prices.GOOD  * AP.GOOD.pct  / 100 +
      item.prices.ROYAL * AP.ROYAL.pct / 100
    ) * (1 + pb);
    const netPerItem = avgSell - totalCost;
    const ingotKey   = item.ingotType === 'corum' ? 'C'
                     : item.ingotType === 'rifton' ? 'R' : 'S';
    return { key, item, rec, ingotCnt, ingotKey, totalCost, avgSell, netPerItem, ingotCost, vanCost };
  });

  /* ── 전량 직판 수익 ── */
  const rawSell = iCo * cP + iRi * rP + iSe * sP;

  /* ── 각 옵션 개당 순이익 ── */
  const netLS1  = oL1 - RECIPES.LS1.ingot_corum  * cP - vc('LS1');
  const netLS2  = oL2 - RECIPES.LS2.ingot_rifton * rP - vc('LS2');
  const netLS3  = oL3 - RECIPES.LS3.ingot_serent * sP - vc('LS3');
  const netAbil = oAb - (cP + rP + sP);

  /* ── 전체 옵션 목록 (라스 + 어빌 + 귀중품) ── */
  const allOptions = [
    { key:'LS1',  label:'하급 라이프스톤', net:netLS1,  sell:oL1, iC:1, iR:0, iS:0, ct:ctL1, type:'ls' },
    { key:'LS2',  label:'중급 라이프스톤', net:netLS2,  sell:oL2, iC:0, iR:2, iS:0, ct:ctL2, type:'ls' },
    { key:'LS3',  label:'상급 라이프스톤', net:netLS3,  sell:oL3, iC:0, iR:0, iS:3, ct:ctL3, type:'ls' },
    { key:'ABIL', label:'어빌리티 스톤',   net:netAbil, sell:oAb, iC:1, iR:1, iS:1, ct:ctAb, type:'ls' },
    // 귀중품: 순이익 > 0인 것만 포함
    ...precItems.filter(p => p.netPerItem > 0).map(p => ({
      key:   p.key,
      label: p.item.name,
      net:   p.netPerItem,
      sell:  p.avgSell,
      iC:    p.ingotKey === 'C' ? p.ingotCnt : 0,
      iR:    p.ingotKey === 'R' ? p.ingotCnt : 0,
      iS:    p.ingotKey === 'S' ? p.ingotCnt : 0,
      ct:    RECIPES[p.item.recipe].craft_time_sec * (1 - fr),
      type:  'precious',
      extra: p,
    })),
  ]
    .filter(c => c.net > 0 && c.sell > 0)
    .sort((a, b) => b.net - a.net); // 순이익 높은 순으로 정렬

  /* ── 그리디 최적 배분 ──
     순이익 높은 옵션부터 주괴를 소진 */
  let remCo = iCo, remRi = iRi, remSe = iSe;
  const craftResult = [];
  for (const c of allOptions) {
    const maxN = Math.min(
      c.iC > 0 ? Math.floor(remCo / c.iC) : Infinity,
      c.iR > 0 ? Math.floor(remRi / c.iR) : Infinity,
      c.iS > 0 ? Math.floor(remSe / c.iS) : Infinity,
    );
    if (maxN <= 0) continue;
    craftResult.push({ ...c, count: maxN });
    remCo -= c.iC * maxN;
    remRi -= c.iR * maxN;
    remSe -= c.iS * maxN;
  }

  /* ── 제작 후 남은 주괴 직판 ── */
  const remSell = remCo * cP + remRi * rP + remSe * sP;
  let craftRev  = remSell;
  let craftTime = 0;

  /* ── 제작 계획 HTML 생성 ── */
  const craftLines = [];
  for (const c of craftResult) {
    const rev = c.count * (c.type === 'precious' ? c.extra.avgSell : c.sell);
    const t   = c.count * c.ct;
    craftRev  += rev;
    craftTime += t;

    // 재료 chip 생성
    let matChips = '';
    if (c.type === 'ls') {
      const chips = Object.entries(RECIPES[c.key].vanilla || {})
        .filter(([, q]) => q > 0)
        .map(([mat, qty]) => matChipQty(mat, qty * c.count));
      matChips = chips.join('');
    } else {
      const rec   = c.extra.rec;
      const chips = Object.entries(rec.vanilla || {})
        .filter(([, q]) => q > 0)
        .map(([mat, qty]) => matChipQty(mat, qty * c.count));
      if (rec.doc) {
        chips.push(
          `<span class="mat-chip" style="background:#ff980018;color:#e07b2a;border-color:#e07b2a55">` +
          `증서 ${c.count}개 (${f(DOC * c.count)}원 고정)</span>`
        );
      }
      matChips = chips.join('');
    }

    // 귀중품이면 감정 등급별 가격 표시
    const precBadge   = c.type === 'precious' ? bdg('bpu', '귀중품') : '';
    const countLabel  = fmtQtyLabel(c.count, '개');
    const appraisalHtml = c.type === 'precious'
      ? `<div class="appr-row">
           <span>낮은품질 ${f(c.extra.item.prices.LOW  * (1 + pb))}원</span>
           <span>우수 ${f(c.extra.item.prices.GOOD      * (1 + pb))}원</span>
           <span>황실 ${f(c.extra.item.prices.ROYAL     * (1 + pb))}원</span>
           <span class="g">기댓값 ${f(c.extra.avgSell)}원</span>
         </div>`
      : '';
    // 제작 시간 표시 (config 기준시간, 스킬 적용 후)
    const timeHtml = t > 0 ? `<div class="craft-time">⏱ ${fmtTime(t)}</div>` : '';

    craftLines.push(`
      <div class="craft-item">
        <div class="rrow">
          <span class="rl">${precBadge} ${c.label}</span>
          <span class="rv">${countLabel} → <b class="g">${f(rev)}원</b></span>
        </div>
        ${appraisalHtml}
        ${matChips ? `<div class="mat-row">${matChips}</div>` : ''}
        ${timeHtml}
      </div>`);
  }

  const isRaw = rawSell >= craftRev;
  const iBdg  = ib > 0 ? bdg('bg',  `주괴 좀 사 주괴 +${Math.round(ib * 100)}%`) : '';
  const fBdg  = fr > 0 ? bdg('bg',  `초고속 용광로 -${Math.round(fr * 100)}%`) : '';
  const pBdg  = pb > 0 ? bdg('bpu', `귀하신 몸값 +${Math.round(pb * 100)}%`) : '';

  document.getElementById('oRes').innerHTML = `
  <div class="rsec">
    <div class="rrow">
      <span class="rl">보유 주괴</span>
      <span class="rv">
        ${iCo > 0 ? `<span style="color:${CC}">코룸 ${f(iCo)}개</span> ` : ''}
        ${iRi > 0 ? `<span style="color:${CR}">리프톤 ${f(iRi)}개</span> ` : ''}
        ${iSe > 0 ? `<span style="color:${CS}">세렌트 ${f(iSe)}개</span>` : ''}
      </span>
    </div>
    ${row(`전량 직판 수익 ${iBdg}`, `${f(rawSell)}원`)}
  </div>

  <div class="rsec">
    <div class="rsec-title">📊 개당 순이익</div>
    ${oL1 > 0 ? row('하급 라스',      `${f(netLS1)}원`,  netLS1  >= 0 ? 'g' : 'r') : ''}
    ${oL2 > 0 ? row('중급 라스',      `${f(netLS2)}원`,  netLS2  >= 0 ? 'g' : 'r') : ''}
    ${oL3 > 0 ? row('상급 라스',      `${f(netLS3)}원`,  netLS3  >= 0 ? 'g' : 'r') : ''}
    ${oAb > 0 ? row('어빌리티 스톤', `${f(netAbil)}원`, netAbil >= 0 ? 'g' : 'r') : ''}
    ${precItems.map(p =>
      row(`${p.item.name} ${pBdg}`, `${f(p.netPerItem)}원`, p.netPerItem >= 0 ? 'g' : 'r')
    ).join('')}
  </div>

  <div class="rsec">
    <div class="rrow" style="justify-content:center;padding:4px 0">
      ${isRaw
        ? '<span class="bdg br" style="font-size:12px;padding:4px 14px">💰 주괴 직판 권장</span>'
        : '<span class="bdg bg" style="font-size:12px;padding:4px 14px">🔨 제작 후 판매 권장</span>'}
    </div>
  </div>

  ${!isRaw && craftLines.length ? `
  <div class="rsec">
    <div class="rsec-title">🔨 최적 제작 계획 ${fBdg}</div>
    ${craftLines.join('')}
    ${remCo + remRi + remSe > 0 ? `
    <div class="rrow" style="margin-top:6px">
      <span class="rl">남은 주괴 직판</span>
      <span class="rv">
        ${remCo > 0 ? `<span style="color:${CC}">코룸 ${f(remCo)}개</span> ` : ''}
        ${remRi > 0 ? `<span style="color:${CR}">리프톤 ${f(remRi)}개</span> ` : ''}
        ${remSe > 0 ? `<span style="color:${CS}">세렌트 ${f(remSe)}개</span> ` : ''}
        → ${f(remSell)}원
      </span>
    </div>` : ''}
    ${craftTime > 0 ? row('총 제작 시간', fmtTime(craftTime), 'b') : ''}
  </div>` : ''}

  <div class="result-box">
    <div class="rb-label">최종 예상 수익</div>
    <div class="rb-value">${f(isRaw ? rawSell : craftRev)}원</div>
  </div>`;
}


/* ════════════════════════════════════════
   ⑪ 초기화 — 페이지 로드 시 1회 실행
════════════════════════════════════════ */

export function init() {
  onSkillChange();       // 스킬 info 텍스트 초기화 + 전체 재계산
  onEngravingChange();   // 각인석 info 텍스트 초기화
}