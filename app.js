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

/* 수량을 "X상자 Y세트 Z개" 형식으로 포맷 (내림)
   config의 vanilla 수량은 모두 "개수" 단위.
   64개=1세트, 3456개(64×54)=1상자로 자동 변환. */
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

/* "n상자 n세트 n개" 또는 순수 숫자 문자열을 개수(정수)로 변환 */
function parseQty(str) {
  if (!str || !str.trim()) return 0;
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
   ① - 주괴 단가 헬퍼
   ─────────────────────────────────────
   스킬 "주괴 좀 사 주괴" 적용 규칙:
     - 사용자가 직접 가격 입력(>0)  → 입력값 그대로 (스킬 미반영)
       이유: 이미 스킬 보너스가 적용된 실제 판매가를 입력했다고 가정
     - 미입력(0)                    → DEFAULT_PRICES × (1 + ib)
   순이익 계산 시 "코스트 쪽 주괴 가격"은 항상 스킬 미반영 원가(rawPrice)를 써야 하므로
   두 값을 분리해서 반환:
     sellPrice : 판매 수익 계산에 사용 (스킬 반영 or 입력값)
     costPrice : 재료 원가 계산에 사용 (스킬 미반영 원가)
════════════════════════════════════════ */

function getIngotPrices(ib) {
  const userC = gi('oCo') || gi('ingotPriceC'); // 탭2 입력 우선, 없으면 탭0 입력
  const userR = gi('oRi') || gi('ingotPriceR');
  const userS = gi('oSe') || gi('ingotPriceS');

  const rawC = userC > 0 ? userC : DEFAULT_PRICES.ingot.corum;
  const rawR = userR > 0 ? userR : DEFAULT_PRICES.ingot.rifton;
  const rawS = userS > 0 ? userS : DEFAULT_PRICES.ingot.serent;

  return {
    // 판매가: 사용자 입력이 있으면 그대로, 없으면 디폴트 × (1+ib)
    sellC: userC > 0 ? userC : rawC * (1 + ib),
    sellR: userR > 0 ? userR : rawR * (1 + ib),
    sellS: userS > 0 ? userS : rawS * (1 + ib),
    // 원가: 항상 스킬 미반영 (제작 비용 계산용)
    costC: rawC,
    costR: rawR,
    costS: rawS,
  };
}


/* ════════════════════════════════════════
   ② 재료 칩 렌더링
════════════════════════════════════════ */

const MAT_META = {
  cobblestone:           { name:'조약돌 묶음',        color:'#8a7060' },
  deepslate_cobblestone: { name:'심층암 조약돌 묶음',  color:'#5a5570' },
  copper:                { name:'구리 블럭',           color:'#c87941' },
  iron:                  { name:'철 블럭',             color:'#a0a0a0' },
  gold:                  { name:'금 블럭',             color:'#d4a020' },
  diamond:               { name:'다이아몬드 블럭',     color:'#38c8d0' },
  redstone:              { name:'레드스톤 블럭',       color:'#d94f3d' },
  lapis:                 { name:'청금석 블럭',         color:'#3d6fd4' },
  amethyst:              { name:'자수정 블럭',         color:'#9b6dd4' },
  topaz:                 { name:'토파즈 블럭',         color:'#c8960a' },
  sapphire:              { name:'사파이어 블럭',       color:'#1e54b0' },
  platinum:              { name:'플레티넘 블럭',       color:'#9ab0c8' },
  diorite:               { name:'섬록암',              color:'#7a8c6e' },
  tuff:                  { name:'응회암',              color:'#8a9a7a' },
  andesite:              { name:'안산암',              color:'#8c7a5a' },
};

function matChipQty(matKey, totalQty) {
  const m = MAT_META[matKey] || { name: matKey, color: '#888' };
  return `<span class="mat-chip" style="background:${m.color}18;color:${m.color};border-color:${m.color}55">${m.name} ${fmtQty(totalQty)}</span>`;
}


/* ════════════════════════════════════════
   ③ 탭 전환
════════════════════════════════════════ */

/* 탭별 페이지 타이틀 정의 */
const TAB_TITLES = [
  '⛏ 채광 계산기',
  '🔥 강화횃불 제작기',
  '💰 수익 최적화',
];

export function sw(i, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  for (let k = 0; k < 3; k++) {
    const p = document.getElementById('t' + k);
    if (p) p.style.display = 'none';
  }
  el.classList.add('on');
  document.getElementById('t' + i).style.display = 'block';

  // 페이지 타이틀 업데이트
  const titleEl = document.getElementById('pageTabTitle');
  if (titleEl && TAB_TITLES[i]) titleEl.textContent = TAB_TITLES[i];
  // <title> 태그도 함께 변경 (브라우저 탭 이름)
  document.title = `광부 계산기 — ${TAB_TITLES[i]}`;
}


/* ════════════════════════════════════════
   ④ 스킬·각인석 값 읽기
════════════════════════════════════════ */

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
    fr: (SKILLS.FURNACE.reductionPct[fl]  ?? 0) / 100,
    ib: (SKILLS.INGOT_SELL.bonusPct[il]   ?? 0) / 100,
    gb: (SKILLS.GEM_SELL.bonusPct[gl]     ?? 0) / 100,
    ca: SKILLS.COBYTIME.dropPct[cl]       ?? 0,
    sp: sp.pct, sc: sp.count,
    lp: lk.pct, lc: lk.count,
    fp: SKILLS.FIRE_PICK.dropPct[fpl]     ?? 0,
    pb: (SKILLS.PRECIOUS.bonusPct[pl]     ?? 0) / 100,
    fl, il, gl, cl, sl, ll, fpl, pl,
  };
}

export function getENG() {
  const ol = gi('engOreLuck');
  const rl = gi('engRelic');
  const cl = gi('engCobby');
  const gc = gi('engGemCobby');
  const ca = gi('engCart');
  const ro = gi('engRoulette');

  return {
    op: ENGRAVING.ORE_LUCK.extraOrePct[ol]           ?? 0,
    ap: ENGRAVING.RELIC_SEARCH.extraArtifactPct[rl]  ?? 0,
    cp: ENGRAVING.COBBY_SUMMON.extraCobbyPct[cl]     ?? 0,
    gp: ENGRAVING.GEM_COBBY.gemConvertPct[gc]        ?? 0,
    kp: ENGRAVING.MINE_CART.cartPct[ca]              ?? 0,
    dp: ENGRAVING.MINER_ROULETTE.dicePct[ro]         ?? 0,
    ol, rl, cl, gc, ca, ro,
  };
}


/* ════════════════════════════════════════
   ⑤ 스킬 패널 info 텍스트 업데이트
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

  cs();
}


/* ════════════════════════════════════════
   ⑥ 핵심 채굴 계산 함수
════════════════════════════════════════ */

function calcMining() {
  const sk  = getSK();
  const eng = getENG();
  const enh      = gi('pickaxeLevel');
  const stamina  = gi('totalStamina');
  const oreType  = gv('oreType') || 'even';
  const px       = PICKAXE[enh] ?? PICKAXE[0];

  const miningCount = stamina > 0 ? Math.floor(stamina / MINING.STAMINA_PER_USE) : 0;

  const luckyExtra    = (sk.lp / 100) * sk.lc;
  const oreLuckExtra  = eng.op / 100;
  const avgDice       = 3.5;
  const rouletteExtra = (eng.dp / 100) * (
    0.9 * avgDice * ENGRAVING.MINER_ROULETTE.normalMult +
    0.1 * avgDice * ENGRAVING.MINER_ROULETTE.goldenMult
  );

  const oresPerUse = px.oresPerUse + luckyExtra + oreLuckExtra + rouletteExtra;
  const totalOres  = miningCount * oresPerUse;

  let oreC = 0, oreR = 0, oreS = 0;
  if      (oreType === 'corum')  oreC = totalOres;
  else if (oreType === 'rifton') oreR = totalOres;
  else if (oreType === 'serent') oreS = totalOres;
  else { oreC = totalOres / 3; oreR = totalOres / 3; oreS = totalOres - oreC - oreR; }

  const ingotFromOreC = oreC / INGOT_RECIPES.CORUM.ores_per_ingot;
  const ingotFromOreR = oreR / INGOT_RECIPES.RIFTON.ores_per_ingot;
  const ingotFromOreS = oreS / INGOT_RECIPES.SERENT.ores_per_ingot;

  const totalTorch = ingotFromOreC * INGOT_RECIPES.CORUM.torch_per_ingot
                   + ingotFromOreR * INGOT_RECIPES.RIFTON.torch_per_ingot
                   + ingotFromOreS * INGOT_RECIPES.SERENT.torch_per_ingot;

  const fpDrops = miningCount * (sk.fp / 100);
  let fpC = 0, fpR = 0, fpS = 0;
  if      (oreType === 'corum')  fpC = fpDrops;
  else if (oreType === 'rifton') fpR = fpDrops;
  else if (oreType === 'serent') fpS = fpDrops;
  else { fpC = fpDrops / 3; fpR = fpDrops / 3; fpS = fpDrops - fpC - fpR; }

  const totalIngotC = ingotFromOreC + fpC;
  const totalIngotR = ingotFromOreR + fpR;
  const totalIngotS = ingotFromOreS + fpS;

  const totalCobbyPct = px.cobbyPct + sk.ca + eng.cp;
  const cobbyCount    = miningCount * (totalCobbyPct / 100);
  const gemCobby      = cobbyCount * (eng.gp / 100) * COBBY_DROP_RATE;
  const normalCobby   = (cobbyCount - cobbyCount * (eng.gp / 100)) * COBBY_DROP_RATE;
  const sparkleGems   = miningCount * (sk.sp / 100) * sk.sc;
  const totalGems     = sparkleGems + gemCobby;

  const totalArtPct    = px.artifactPct + eng.ap;
  const artDrops       = miningCount * (totalArtPct / 100);
  const cartDrops      = miningCount * (eng.kp / 100);
  const totalArtifacts = artDrops + cartDrops * 2;
  const totalArtPts    = totalArtifacts * ARTIFACT.avgPoints;

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
════════════════════════════════════════ */

const Z80 = 0.842;

function floor80(n, p) {
  if (p <= 0 || n <= 0) return 0;
  if (p >= 1) return n;
  const mu  = n * p;
  const sig = Math.sqrt(n * p * (1 - p));
  return Math.max(0, mu - Z80 * sig);
}

function calc80Ingots(m) {
  const sk  = m.sk;
  const eng = m.eng;
  const n   = m.miningCount;

  const luckyOre80    = floor80(n, sk.lp / 100) * sk.lc;
  const oreLuck80     = floor80(n, eng.op / 100) * 1;
  const diceCount80   = floor80(n, eng.dp / 100);
  const golden80      = floor80(diceCount80, ENGRAVING.MINER_ROULETTE.goldenPct / 100);
  const normal80      = diceCount80 - golden80;
  const rouletteOre80 = normal80 * 3.5 * ENGRAVING.MINER_ROULETTE.normalMult
                      + golden80 * 3.5 * ENGRAVING.MINER_ROULETTE.goldenMult;

  const totalOres80 = n * m.px.oresPerUse + luckyOre80 + oreLuck80 + rouletteOre80;

  const { oreType } = m;
  let oreC80 = 0, oreR80 = 0, oreS80 = 0;
  if      (oreType === 'corum')  oreC80 = totalOres80;
  else if (oreType === 'rifton') oreR80 = totalOres80;
  else if (oreType === 'serent') oreS80 = totalOres80;
  else { oreC80 = totalOres80/3; oreR80 = totalOres80/3; oreS80 = totalOres80 - oreC80 - oreR80; }

  const iC80 = oreC80 / INGOT_RECIPES.CORUM.ores_per_ingot;
  const iR80 = oreR80 / INGOT_RECIPES.RIFTON.ores_per_ingot;
  const iS80 = oreS80 / INGOT_RECIPES.SERENT.ores_per_ingot;

  const fp80 = floor80(n, sk.fp / 100);
  let fpC80 = 0, fpR80 = 0, fpS80 = 0;
  if      (oreType === 'corum')  fpC80 = fp80;
  else if (oreType === 'rifton') fpR80 = fp80;
  else if (oreType === 'serent') fpS80 = fp80;
  else { fpC80 = fp80/3; fpR80 = fp80/3; fpS80 = fp80 - fpC80 - fpR80; }

  const tC80 = iC80 + fpC80;
  const tR80 = iR80 + fpR80;
  const tS80 = iS80 + fpS80;

  const sparkle80      = floor80(n, sk.sp / 100) * sk.sc;
  const cobby80        = floor80(n, m.totalCobbyPct / 100);
  const gemCobby80     = floor80(cobby80, eng.gp / 100) * COBBY_DROP_RATE;
  const normalCobby80  = (cobby80 - floor80(cobby80, eng.gp / 100)) * COBBY_DROP_RATE;
  const totalGems80    = sparkle80 + gemCobby80;

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

const CC = '#e07b2a';
const CR = '#3a9e68';
const CS = '#d94f3d';

export function cs() {
  const m   = calcMining();
  const p80 = calc80Ingots(m);
  const sk  = m.sk;
  const eng = m.eng;

  /* ── 판매가 읽기 (주괴 좀 사주괴 스킬 반영 규칙 적용) ──
     사용자 입력 > 0 → 입력값 그대로 (스킬 미반영)
     미입력(0)       → DEFAULT_PRICES × (1 + ib) */
  const userIC = gi('ingotPriceC');
  const userIR = gi('ingotPriceR');
  const userIS = gi('ingotPriceS');

  const bC = userIC > 0 ? userIC : DEFAULT_PRICES.ingot.corum  * (1 + sk.ib);
  const bR = userIR > 0 ? userIR : DEFAULT_PRICES.ingot.rifton * (1 + sk.ib);
  const bS = userIS > 0 ? userIS : DEFAULT_PRICES.ingot.serent * (1 + sk.ib);

  const rawGC = gi('gemPriceC')   || DEFAULT_PRICES.gem.corum;
  const rawGR = gi('gemPriceR')   || DEFAULT_PRICES.gem.rifton;
  const rawGS = gi('gemPriceS')   || DEFAULT_PRICES.gem.serent;
  const spPrice    = gi('skillPulsePrice');
  const artPtPrice = gi('artifactPtPrice') / 100;

  let gemUnit = 0;
  const ot = m.oreType;
  if      (ot === 'corum')  gemUnit = rawGC * (1 + sk.gb);
  else if (ot === 'rifton') gemUnit = rawGR * (1 + sk.gb);
  else if (ot === 'serent') gemUnit = rawGS * (1 + sk.gb);
  else gemUnit = ((rawGC + rawGR + rawGS) / 3) * (1 + sk.gb);

  const ingotRev = m.totalIngotC * bC + m.totalIngotR * bR + m.totalIngotS * bS;
  const gemRev   = m.totalGems * gemUnit;
  const spRev    = m.normalCobby * spPrice;
  const artRev   = artPtPrice > 0 ? m.totalArtPts * artPtPrice : 0;
  const totalRev = ingotRev + gemRev + spRev + artRev;

  const ingotRev80 = p80.tC80 * bC + p80.tR80 * bR + p80.tS80 * bS;
  const gemRev80   = p80.totalGems80 * gemUnit;
  const spRev80    = p80.normalCobby80 * spPrice;
  const artRev80   = artPtPrice > 0 ? p80.artPts80 * artPtPrice : 0;
  const totalRev80 = ingotRev80 + gemRev80 + spRev80 + artRev80;

  const torchC = m.ingotFromOreC * INGOT_RECIPES.CORUM.torch_per_ingot;
  const torchR = m.ingotFromOreR * INGOT_RECIPES.RIFTON.torch_per_ingot;
  const torchS = m.ingotFromOreS * INGOT_RECIPES.SERENT.torch_per_ingot;

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

  /* 스킬 배지: 사용자가 가격 직접 입력한 경우에는 배지 숨김 */
  const iBdgC = (sk.ib > 0 && userIC === 0) ? bdg('bg', `주괴 좀 사 주괴 +${Math.round(sk.ib * 100)}%`) : '';
  const gBdg  = sk.gb > 0 ? bdg('bg', `눈이 부셔 +${Math.round(sk.gb * 100)}%`) : '';

  const cRow = (label, oreAmt, ingotAmt, color, torchAmt) => {
    if (oreAmt <= 0.01) return '';
    const torchStr = torchAmt > 0.01
      ? ` <span style="color:var(--blu);font-size:10px">(횃불 ${f(torchAmt)}개)</span>`
      : '';
    return `<div class="rrow">
      <span class="rl" style="color:${color};font-weight:700">${label}</span>
      <span class="rv">${f(oreAmt)}개 → 주괴 <b style="color:${color}">${f(ingotAmt)}개</b>${torchStr}</span>
    </div>`;
  };

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
      ? `<div class="rrow rrow-strong"><span class="rl" style="color:var(--blu);font-family:'Noto Sans KR',sans-serif!important">🔥 필요 강화횃불 합계</span><span class="rv b" style="font-family:'Noto Sans KR',sans-serif!important">${f(m.totalTorch)}개</span></div>`
      : ''}
    ${m.fpDrops > 0.01
      ? `<div class="rrow"><span class="rl">불붙은 곡괭이 ${bdg('bg','Lv'+sk.fpl)}</span><span class="rv">+${fd(m.fpDrops)}개 주괴</span></div>`
      : ''}
    <div class="rrow rrow-strong">
      <span class="rl" style="color:var(--txt);font-family:'Noto Sans KR',sans-serif!important">최종 총 주괴 (기댓값)</span>
      <span class="rv p" style="font-family:'Noto Sans KR',sans-serif!important">${f(m.totalIngotAll)}개 &nbsp;<small>${ingotParts}</small></span>
    </div>
  </div>`;

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

  html += `
  <div class="rsec">
    <div class="rsec-title">💰 기댓값 수익 (전량 판매)</div>
    ${row(`주괴 수익 ${iBdgC}`, `${f(ingotRev)}원`, 'g')}
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
      <div style="width:1px;background:var(--bdr2);margin:4px 0;flex:none"></div>
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
  const timePerTorch = TORCH.craft_time_sec * (1 - sk.fr);

  const charU        = gi('tCharcoalPrice') / SET_SIZE;
  const woodSetPrice = gi('tWoodPrice');
  const stickU       = woodSetPrice / (SET_SIZE * 8);

  const tWantEl = document.getElementById('tWantCount');
  const wantN   = parseQty(tWantEl ? tWantEl.value : '');

  const parsedEl = document.getElementById('tWantCountParsed');
  if (parsedEl) {
    parsedEl.textContent = wantN > 0 ? `(총 ${wantN.toLocaleString('ko-KR')}개)` : '';
  }

  const sellEa   = gi('tSellPrice') / SET_SIZE;
  const costEa   = charU + stickU;
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
    ${row('필요 원목', fmtQty(Math.ceil(needWoodLogs)), 'g')}
    ${row('총 재료비', `${f(totalCost)}원`, 'r')}
  </div>
  <div class="rsec">
    ${row(`1개당 제작 시간 ${fBdg}`, fmtTime(timePerTorch), 'b')}
    ${row('총 제작 시간', fmtTime(totalTime), 'b')}
  </div>
  <div class="result-box">
    <div class="rb-label">${hasPrice ? '순이익' : '총 재료비'}</div>
    <div class="rb-value" style="color:${hasPrice ? (net >= 0 ? 'var(--grn)' : 'var(--red)') : 'var(--red)'}">
      ${f(hasPrice ? net : totalCost)}원
    </div>
  </div>`;
}


/* ════════════════════════════════════════
   ⑩ TAB 2: 주괴 & 귀중품 통합 최적화
════════════════════════════════════════ */

/* ── 자동채우기: 빈칸(0)만 DEFAULT_PRICES 값으로 채움 ──
   config.js의 DEFAULT_PRICES에 정의된 현재 시세를 반영.
   이미 값이 입력된 칸은 건드리지 않음. */
export function autoFillPrices() {
  const fill = (id, val) => {
    const el = document.getElementById(id);
    if (el && (!el.value || +el.value === 0)) {
      el.value = val;
      el.dispatchEvent(new Event('input')); // 입력 이벤트 발생 → 실시간 계산 트리거
    }
  };

  // ※ 주괴 단가(ingotPriceC/R/S, oCo/Ri/Se)와 보석 가격은 자동채우기 제외
  //   사용자가 직접 시세를 입력해야 스킬 반영 여부가 명확해짐

  // 바닐라 재료 (세트당 가격)
  fill('vCo',          DEFAULT_PRICES.vanilla?.cobblestone          ?? 0);
  fill('vDc',          DEFAULT_PRICES.vanilla?.deepslate_cobblestone ?? 0);
  fill('vCu',          DEFAULT_PRICES.vanilla?.copper               ?? 0);
  fill('vIr',          DEFAULT_PRICES.vanilla?.iron                 ?? 0);
  fill('vGo',          DEFAULT_PRICES.vanilla?.gold                 ?? 0);
  fill('vDi',          DEFAULT_PRICES.vanilla?.diamond              ?? 0);
  fill('vRe',          DEFAULT_PRICES.vanilla?.redstone             ?? 0);
  fill('vLa',          DEFAULT_PRICES.vanilla?.lapis                ?? 0);
  fill('vAm',          DEFAULT_PRICES.vanilla?.amethyst             ?? 0);

  // 귀중품 전용 재료 (개당 가격)
  fill('vTopaz',       DEFAULT_PRICES.precious?.topaz    ?? 0);
  fill('vSapphire',    DEFAULT_PRICES.precious?.sapphire ?? 0);
  fill('vPlatinum',    DEFAULT_PRICES.precious?.platinum ?? 0);

  // 석재류 (세트당 가격)
  fill('vDiorite',     DEFAULT_PRICES.stone?.diorite  ?? 0);
  fill('vTuff',        DEFAULT_PRICES.stone?.tuff     ?? 0);
  fill('vAndesite',    DEFAULT_PRICES.stone?.andesite ?? 0);

  // 스킬펄스·유물
  fill('skillPulsePrice', DEFAULT_PRICES.skillPulse ?? 0);
  fill('artifactPtPrice', DEFAULT_PRICES.artifactPt ?? 0);

  // 횃불 재료
  fill('tCharcoalPrice', DEFAULT_PRICES.charcoal ?? 0);
  fill('tWoodPrice',     DEFAULT_PRICES.wood     ?? 0);

  cs(); ct(); co();
}


/* ── 주괴 1:1 교환 최적화 ──────────────────────────────
   체크박스 활성화 시, 전체 보유 주괴를 가장 주괴당 이익이 높은
   단일 종으로 몰아서 교환하는 것이 이득인지 계산.

   예) 세렌트(상급라스) 주괴당 2000원 > 코룸(하급라스) 주괴당 1000원
     → 코룸 100개 전량을 세렌트 100개로 교환 후 상급라스 33개 제작

   알고리즘:
   1. 각 주괴 종류별 "최대 주괴당 순이익(bestPerKind)"을 구함
   2. 전체 보유 주괴를 bestPerKind 1위 종으로 교환할 때
      교환 이득 = (1위 주괴당 이익 - from 직판가) × 교환 가능 수
   3. 이득 > 0인 교환만 실행
   4. 교환 후 그리디 재계산 → 최종 수익 비교
════════════════════════════════════════ */
function calcSwapPlan(iCo, iRi, iSe, allOptions, cP, rP, sP) {
  const swapEl = document.getElementById('enableSwap');
  if (!swapEl || !swapEl.checked) return null;

  if (allOptions.length === 0) return null;

  /* 각 주괴 종류별 최고 주괴당 순이익 */
  const bestPerKind = { C: -Infinity, R: -Infinity, S: -Infinity };
  for (const c of allOptions) {
    const kind = c.iC > 0 ? 'C' : c.iR > 0 ? 'R' : 'S';
    // 어빌처럼 복수 종 소모 옵션은 교환 대상에서 제외
    const singleKind = [c.iC > 0, c.iR > 0, c.iS > 0].filter(Boolean).length === 1;
    if (!singleKind) continue;
    const ingotCnt = c.iC || c.iR || c.iS;
    const npi = c.net / ingotCnt;
    if (npi > bestPerKind[kind]) bestPerKind[kind] = npi;
  }

  /* 직판 단가 */
  const sellPerKind = { C: cP, R: rP, S: sP };
  const kindName    = { C:'코룸', R:'리프톤', S:'세렌트' };

  /* 전체 보유량 맵 (교환 시뮬용) */
  const holdMap = { C: iCo, R: iRi, S: iSe };

  /* 최고 이익 종 결정 */
  const [bestKind] = Object.entries(bestPerKind)
    .sort((a, b) => b[1] - a[1]);
  if (bestPerKind[bestKind[0]] <= 0) return null;

  const toKind = bestKind[0];
  const toBest = bestPerKind[toKind];

  /* 각 from 종에 대해 교환 여부 결정 */
  const swapLog = [];
  const newHold = { ...holdMap };

  for (const fromKind of ['C','R','S']) {
    if (fromKind === toKind) continue;
    if (holdMap[fromKind] <= 0) continue;

    /* 교환 이득 = (목표 주괴당 이익 - from 직판 포기) */
    const gain = toBest - sellPerKind[fromKind];
    if (gain <= 0) continue;

    /* 교환 가능 최대 수량 — to 종 최고 옵션의 1회 소모량 배수로 맞춤 */
    const toOpts = allOptions.filter(c => {
      const singleKind = [c.iC > 0, c.iR > 0, c.iS > 0].filter(Boolean).length === 1;
      return singleKind && (toKind === 'C' ? c.iC > 0 : toKind === 'R' ? c.iR > 0 : c.iS > 0);
    });
    if (toOpts.length === 0) continue;

    const bestOpt  = toOpts[0]; // 이미 정렬된 allOptions에서 뽑으므로 최상위
    const ingotCnt = bestOpt.iC || bestOpt.iR || bestOpt.iS;
    const maxCraft  = Math.floor(holdMap[fromKind] / ingotCnt);
    if (maxCraft <= 0) continue;

    const swapCount = maxCraft * ingotCnt;
    swapLog.push({
      from: kindName[fromKind], to: kindName[toKind],
      count: swapCount,
      forItem: bestOpt.label,
      craftCount: maxCraft,
      gain,
    });
    newHold[fromKind] -= swapCount;
    newHold[toKind]   += swapCount;
  }

  if (swapLog.length === 0) return null;

  return {
    swapLog,
    swapRemCo: newHold.C,
    swapRemRi: newHold.R,
    swapRemSe: newHold.S,
  };
}


export function co() {
  const { ib, fr, pb } = getSK();

  /* ── 주괴 보유량 파싱 ── */
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

  /* ── 주괴 단가 (주괴 좀 사주괴 스킬 반영 규칙 적용) ──
     사용자 입력 > 0 → 스킬 미반영 그대로 사용
     미입력(0)       → DEFAULT_PRICES × (1 + ib)
     순이익 계산 시 원가는 항상 스킬 미반영(rawC/R/S) 사용 */
  const userCo = gi('oCo');
  const userRi = gi('oRi');
  const userSe = gi('oSe');

  const rawC = userCo > 0 ? userCo : DEFAULT_PRICES.ingot.corum;
  const rawR = userRi > 0 ? userRi : DEFAULT_PRICES.ingot.rifton;
  const rawS = userSe > 0 ? userSe : DEFAULT_PRICES.ingot.serent;

  // 판매가: 사용자 입력이 없을 때만 스킬 보너스 적용
  const cP = userCo > 0 ? userCo : rawC * (1 + ib);
  const rP = userRi > 0 ? userRi : rawR * (1 + ib);
  const sP = userSe > 0 ? userSe : rawS * (1 + ib);

  /* ── 라이프스톤·어빌리티 스톤 판매가 & 제작시간 ── */
  const oL1 = gi('oL1'), oL2 = gi('oL2'), oL3 = gi('oL3'), oAb = gi('oAb');
  const ctL1 = RECIPES.LS1.craft_time_sec  * (1 - fr);
  const ctL2 = RECIPES.LS2.craft_time_sec  * (1 - fr);
  const ctL3 = RECIPES.LS3.craft_time_sec  * (1 - fr);
  const ctAb = RECIPES.ABIL.craft_time_sec * (1 - fr);

  /* ── 바닐라 재료 개당 가격 ──
     순이익 계산 원가: rawC/R/S (스킬 미반영) 사용 */
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

  const vc = type =>
    Object.entries(RECIPES[type].vanilla || {})
      .reduce((s, [mat, qty]) => s + qty * (vp[mat] || 0), 0);

  const pvp = {
    topaz:    gi('vTopaz'),
    sapphire: gi('vSapphire'),
    platinum: gi('vPlatinum'),
    redstone: gi('vRe')       / SET_SIZE,
    lapis:    gi('vLa')       / SET_SIZE,
    gold:     gi('vGo')       / SET_SIZE,
    diorite:  gi('vDiorite')  / SET_SIZE,
    tuff:     gi('vTuff')     / SET_SIZE,
    andesite: gi('vAndesite') / SET_SIZE,
  };

  const AP  = PRECIOUS.APPRAISAL;
  const DOC = PRECIOUS.DOC_PRICE;

  /* ── 귀중품 3종 기댓값 & 순이익 ──
     원가 계산 시 ingotCost는 rawC/R/S (스킬 미반영) 사용 */
  const precItems = Object.entries(PRECIOUS.ITEMS).map(([key, item]) => {
    const rec = RECIPES[item.recipe];

    // 원가용 주괴 단가: 스킬 미반영
    const iCostPrice = item.ingotType === 'corum'  ? rawC
                     : item.ingotType === 'rifton' ? rawR : rawS;
    // 판매가용 주괴 단가: 스킬 반영 (직판 가치 비교용)
    const iSellPrice = item.ingotType === 'corum'  ? cP
                     : item.ingotType === 'rifton' ? rP : sP;

    const ingotCnt  = rec.ingot_corum || rec.ingot_rifton || rec.ingot_serent || 0;
    const ingotCost = ingotCnt * iCostPrice; // 원가는 스킬 미반영

    const vanCost = Object.entries(rec.vanilla || {})
      .reduce((s, [mat, qty]) => s + qty * (pvp[mat] || 0), 0)
      + (rec.doc || 0) * DOC;

    const totalCost = ingotCost + vanCost;

    const avgSell = (
      item.prices.LOW   * AP.LOW.pct   / 100 +
      item.prices.GOOD  * AP.GOOD.pct  / 100 +
      item.prices.ROYAL * AP.ROYAL.pct / 100
    ) * (1 + pb);

    const netPerItem = avgSell - totalCost;
    const ingotKey   = item.ingotType === 'corum' ? 'C'
                     : item.ingotType === 'rifton' ? 'R' : 'S';
    return { key, item, rec, ingotCnt, ingotKey, totalCost, avgSell, netPerItem, ingotCost, vanCost,
             iCostPrice, iSellPrice };
  });

  /* ── 전량 직판 수익 ── */
  const rawSell = iCo * cP + iRi * rP + iSe * sP;

  /* ── 각 옵션 개당 순이익 (원가는 스킬 미반영 주괴 단가 사용) ── */
  const netLS1  = oL1 - RECIPES.LS1.ingot_corum  * rawC - vc('LS1');
  const netLS2  = oL2 - RECIPES.LS2.ingot_rifton * rawR - vc('LS2');
  const netLS3  = oL3 - RECIPES.LS3.ingot_serent * rawS - vc('LS3');
  const netAbil = oAb - (rawC + rawR + rawS);

  const totalIngots = c => c.iC + c.iR + c.iS;
  const netPerIngot = c => {
    const n = totalIngots(c);
    return n > 0 ? c.net / n : -Infinity;
  };

  const allOptions = [
    { key:'LS1',  label:'하급 라이프스톤', net:netLS1,  sell:oL1,
      iC: RECIPES.LS1.ingot_corum,     iR: 0,                       iS: 0,                        ct:ctL1, type:'ls' },
    { key:'LS2',  label:'중급 라이프스톤', net:netLS2,  sell:oL2,
      iC: 0,                           iR: RECIPES.LS2.ingot_rifton, iS: 0,                        ct:ctL2, type:'ls' },
    { key:'LS3',  label:'상급 라이프스톤', net:netLS3,  sell:oL3,
      iC: 0,                           iR: 0,                        iS: RECIPES.LS3.ingot_serent, ct:ctL3, type:'ls' },
    { key:'ABIL', label:'어빌리티 스톤',   net:netAbil, sell:oAb,
      iC: 1,                           iR: 1,                        iS: 1,                        ct:ctAb, type:'ls' },
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
    .sort((a, b) => netPerIngot(b) - netPerIngot(a));

  /* ── 그리디 최적 배분 ── */
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

  /* ── 교환 계획 계산 (잔여분 아닌 전체 보유량 기준) ── */
  const swapResult = calcSwapPlan(iCo, iRi, iSe, allOptions, cP, rP, sP);

  /* ── 교환 후 전체 잔여량으로 그리디 재계산 ── */
  let swapCraftResult = [];
  let swapRemCo = iCo, swapRemRi = iRi, swapRemSe = iSe;
  if (swapResult) {
    swapRemCo = swapResult.swapRemCo;
    swapRemRi = swapResult.swapRemRi;
    swapRemSe = swapResult.swapRemSe;
    for (const c of allOptions) {
      const maxN = Math.min(
        c.iC > 0 ? Math.floor(swapRemCo / c.iC) : Infinity,
        c.iR > 0 ? Math.floor(swapRemRi / c.iR) : Infinity,
        c.iS > 0 ? Math.floor(swapRemSe / c.iS) : Infinity,
      );
      if (maxN <= 0) continue;
      swapCraftResult.push({ ...c, count: maxN });
      swapRemCo -= c.iC * maxN;
      swapRemRi -= c.iR * maxN;
      swapRemSe -= c.iS * maxN;
    }
  }

  /* ── 제작 계획 HTML 생성 헬퍼 ── */

  /* ── 수익 합산 ── */
  const remSell = remCo * cP + remRi * rP + remSe * sP;
  let craftRev  = remSell;
  let craftTime = 0;
  for (const c of craftResult) {
    craftRev  += c.count * (c.type === 'precious' ? c.extra.avgSell : c.sell);
    craftTime += c.count * c.ct;
  }

  /* 교환 포함 수익 */
  const swapRemSell = swapRemCo * cP + swapRemRi * rP + swapRemSe * sP;
  let swapCraftRev  = swapRemSell;
  let swapCraftTime = 0;
  for (const c of swapCraftResult) {
    swapCraftRev  += c.count * (c.type === 'precious' ? c.extra.avgSell : c.sell);
    swapCraftTime += c.count * c.ct;
  }

  /* ── 총 필요 재료 집계 헬퍼 ──
     제작 결과 배열을 받아 { 재료명: 총수량 } 맵을 반환 */
  function aggregateMats(results) {
    const mats = {};
    // 주괴
    const ingotTotals = { 코룸: 0, 리프톤: 0, 세렌트: 0 };
    for (const c of results) {
      if (c.iC > 0) ingotTotals['코룸']   += c.iC * c.count;
      if (c.iR > 0) ingotTotals['리프톤'] += c.iR * c.count;
      if (c.iS > 0) ingotTotals['세렌트'] += c.iS * c.count;

      const rec = c.type === 'ls' ? RECIPES[c.key] : c.extra?.rec;
      if (!rec) continue;
      for (const [mat, qty] of Object.entries(rec.vanilla || {})) {
        if (!qty) continue;
        mats[mat] = (mats[mat] || 0) + qty * c.count;
      }
      if (rec.doc) {
        mats['__doc__'] = (mats['__doc__'] || 0) + rec.doc * c.count;
      }
    }
    return { ingotTotals, mats };
  }

  /* ── 제작 계획 HTML 생성 헬퍼 (새 카드 UI) ── */
  const ingotChip = (label, color, cnt, total) =>
    `<span class="mat-chip" style="background:${color}18;color:${color};border-color:${color}55">${label} ${fmtQty(total)}<small style="opacity:.7"> ×${cnt}</small></span>`;

  function buildPlanItems(results) {
    if (!results.length) return '<div class="empty-msg" style="padding:10px 0;font-size:12px">제작 가능한 옵션 없음</div>';
    return results.map(c => {
      const rev        = c.count * (c.type === 'precious' ? c.extra.avgSell : c.sell);
      const t          = c.count * c.ct;
      const npi        = totalIngots(c);
      const npiTxt     = npi > 0 ? `주괴당 ${f(c.net / npi)}원 이익` : '';
      const precBadge  = c.type === 'precious' ? bdg('bpu','귀중품') + ' ' : '';

      /* 주괴 chip */
      let ingotChips = '';
      if (c.iC > 0) ingotChips += ingotChip('코룸',   CC, c.iC, c.iC * c.count);
      if (c.iR > 0) ingotChips += ingotChip('리프톤', CR, c.iR, c.iR * c.count);
      if (c.iS > 0) ingotChips += ingotChip('세렌트', CS, c.iS, c.iS * c.count);

      /* 바닐라 재료 chip */
      let vanChips = '';
      if (c.type === 'ls') {
        vanChips = Object.entries(RECIPES[c.key].vanilla || {})
          .filter(([, q]) => q > 0)
          .map(([mat, qty]) => matChipQty(mat, qty * c.count))
          .join('');
      } else {
        const rec = c.extra.rec;
        const chips = Object.entries(rec.vanilla || {})
          .filter(([, q]) => q > 0)
          .map(([mat, qty]) => matChipQty(mat, qty * c.count));
        if (rec.doc) {
          chips.push(`<span class="mat-chip" style="background:#ff980018;color:#e07b2a;border-color:#e07b2a55">증서 ${c.count}개 (${f(DOC * c.count)}원)</span>`);
        }
        vanChips = chips.join('');
      }

      /* 감정 행 (귀중품만) */
      const apprHtml = c.type === 'precious'
        ? `<div class="plan-appr-row">
             <span>하 ${f(c.extra.item.prices.LOW  * (1+pb))}원</span>
             <span>우수 ${f(c.extra.item.prices.GOOD * (1+pb))}원</span>
             <span>황실 ${f(c.extra.item.prices.ROYAL*(1+pb))}원</span>
             <span class="best">기댓값 ${f(c.extra.avgSell)}원</span>
           </div>` : '';

      const timeHtml = t > 0
        ? `<div class="plan-item-time">⏱ ${fmtTime(t)}</div>` : '';

      return `
      <div class="plan-craft-item">
        <div class="plan-item-head">
          <div class="plan-item-name">
            ${precBadge}${c.label}
            ${npiTxt ? `<span class="npi">↑ ${npiTxt}</span>` : ''}
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div class="plan-item-rev">${f(rev)}원</div>
            <span class="plan-item-count">${fmtQty(c.count)}개</span>
          </div>
        </div>
        ${apprHtml}
        ${ingotChips || vanChips ? `<div class="plan-mat-row">${ingotChips}${vanChips}</div>` : ''}
        ${timeHtml}
      </div>`;
    }).join('');
  }

  /* ── 총 필요 재료 집계 ── */
  function aggregateMats(results) {
    const mats = {};
    const ingotTotals = { 코룸: 0, 리프톤: 0, 세렌트: 0 };
    for (const c of results) {
      if (c.iC > 0) ingotTotals['코룸']   += c.iC * c.count;
      if (c.iR > 0) ingotTotals['리프톤'] += c.iR * c.count;
      if (c.iS > 0) ingotTotals['세렌트'] += c.iS * c.count;
      const rec = c.type === 'ls' ? RECIPES[c.key] : c.extra?.rec;
      if (!rec) continue;
      for (const [mat, qty] of Object.entries(rec.vanilla || {})) {
        if (qty) mats[mat] = (mats[mat] || 0) + qty * c.count;
      }
      if (rec.doc) mats['__doc__'] = (mats['__doc__'] || 0) + rec.doc * c.count;
    }
    return { ingotTotals, mats };
  }

  /* ── 총 필요 재료 HTML (접기/펼치기, uid로 구분) ── */
  let _matToggleIdx = 0;
  function matSummaryHtml(results, remC, remR, remS, remSellAmt) {
    if (!results.length) return '';
    const uid = 'mt' + (++_matToggleIdx);
    const { ingotTotals, mats } = aggregateMats(results);
    const ingotRows = [
      ingotTotals['코룸']   > 0 ? `<div class="mat-summary-row"><span class="mn" style="color:${CC}">코룸 주괴</span><span class="mv">${fmtQty(ingotTotals['코룸'])}</span></div>` : '',
      ingotTotals['리프톤'] > 0 ? `<div class="mat-summary-row"><span class="mn" style="color:${CR}">리프톤 주괴</span><span class="mv">${fmtQty(ingotTotals['리프톤'])}</span></div>` : '',
      ingotTotals['세렌트'] > 0 ? `<div class="mat-summary-row"><span class="mn" style="color:${CS}">세렌트 주괴</span><span class="mv">${fmtQty(ingotTotals['세렌트'])}</span></div>` : '',
    ].join('');
    const vanRows = Object.entries(mats).filter(([k]) => k !== '__doc__').map(([mat, qty]) => {
      const m = MAT_META[mat] || { name: mat, color: '#888' };
      return `<div class="mat-summary-row"><span class="mn" style="color:${m.color}">${m.name}</span><span class="mv">${fmtQty(qty)}</span></div>`;
    }).join('');
    const docRow = mats['__doc__']
      ? `<div class="mat-summary-row"><span class="mn" style="color:var(--acc)">증서</span><span class="mv">${mats['__doc__']}개 · ${f(mats['__doc__'] * DOC)}원</span></div>` : '';
    return `
      <div class="mat-toggle" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.mat-arr').textContent=this.nextElementSibling.classList.contains('open')?'▲':'▼'">
        📋 총 필요 재료 <span class="mat-arr">▼</span>
      </div>
      <div class="mat-detail" id="${uid}">
        <div class="mat-summary">${ingotRows}${vanRows}${docRow}</div>
      </div>`;
  }

  /* ── 컬럼 요약 HTML (남은주괴 직판 + 총시간 + 예상수익) ── */
  function planSummaryHtml(rev, time, remC, remR, remS, remSellAmt, isWinner) {
    const remRow = (remC + remR + remS) > 0 ? `
      <div class="plan-summary-row">
        <span class="sl">남은 주괴 직판</span>
        <span class="sv" style="font-size:11px">
          ${remC > 0 ? `<span style="color:${CC}">${f(remC)}개</span> ` : ''}
          ${remR > 0 ? `<span style="color:${CR}">${f(remR)}개</span> ` : ''}
          ${remS > 0 ? `<span style="color:${CS}">${f(remS)}개</span> ` : ''}
          <span style="color:var(--muted)">→ ${f(remSellAmt)}원</span>
        </span>
      </div>` : '';
    const timeRow = time > 0 ? `
      <div class="plan-summary-row">
        <span class="sl">총 제작 시간</span>
        <span class="sv" style="color:var(--blu)">${fmtTime(time)}</span>
      </div>` : '';
    return `
      <div class="plan-summary">
        ${remRow}
        ${timeRow}
        <div class="plan-summary-row rev-row">
          <span class="sl">예상 수익${isWinner ? ' 🏆' : ''}</span>
          <span class="sv">${f(rev)}원</span>
        </div>
      </div>`;
  }

  const craftLines     = buildPlanItems(craftResult);
  const swapCraftLines = buildPlanItems(swapCraftResult);

  const swapBetter = swapResult && swapCraftRev > craftRev;
  // 교환 없이가 더 나은 경우: !swapBetter (swapResult 없거나 교환이 더 작은 경우)
  const noSwapWinner = !swapBetter;

  const iBdg = ib > 0 ? bdg('bg',  `주괴 좀 사 주괴 +${Math.round(ib * 100)}%`) : '';
  const fBdg = fr > 0 ? bdg('bg',  `초고속 용광로 -${Math.round(fr * 100)}%`) : '';
  const pBdg = pb > 0 ? bdg('bpu', `귀하신 몸값 +${Math.round(pb * 100)}%`) : '';

  const netSummaryRow = (label, net, iC, iR, iS, badge = '') => {
    if (!label || net === 0) return '';
    const color = net >= 0 ? 'g' : 'r';
    const n     = iC + iR + iS;
    const ingotKindCount = [iC, iR, iS].filter(v => v > 0).length;
    const ingotKindLabel = ingotKindCount === 1
      ? (iC > 0 ? '코룸 ' : iR > 0 ? '리프톤 ' : '세렌트 ')
      : '';
    const perHtml = n > 0
      ? ` <small style="color:var(--muted)">· ${ingotKindLabel}주괴당 ${f(net / n)}원</small>`
      : '';
    return row(`${label} ${badge}`, `${f(net)}원 ${perHtml}`, color);
  };

  /* ── 좌(교환 없이) 컬럼 내용 ── */
  const noSwapInner = `
    ${craftLines}
    ${matSummaryHtml(craftResult, remCo, remRi, remSe, remSell)}
    ${planSummaryHtml(craftRev, craftTime, remCo, remRi, remSe, remSell, noSwapWinner)}`;

  /* ── 우(교환 있이) 컬럼 내용 ── */
  const swapInner = (() => {
    if (!swapResult) return `
      <div style="padding:20px 0;text-align:center;color:var(--muted);font-size:12px">
        위의 체크박스를 활성화하면<br>교환 최적화를 계산합니다
      </div>`;
    const kindColor = { '코룸': CC, '리프톤': CR, '세렌트': CS };
    const swapInfoRows = swapResult.swapLog.map(s =>
      `<div class="swap-info-row">
        <span class="si-label">
          <span style="color:${kindColor[s.from]}">${s.from}</span>
          <span style="color:var(--muted)"> → </span>
          <span style="color:${kindColor[s.to]}">${s.to}</span>
          &nbsp;<b>${f(s.count)}개</b> 교환
        </span>
        <span class="si-gain">+${f(Math.round(s.gain))}원/주괴</span>
      </div>`
    ).join('');
    return `
      <div class="swap-info-box">${swapInfoRows}</div>
      ${swapCraftLines}
      ${matSummaryHtml(swapCraftResult, swapRemCo, swapRemRi, swapRemSe, swapRemSell)}
      ${planSummaryHtml(swapCraftRev, swapCraftTime, swapRemCo, swapRemRi, swapRemSe, swapRemSell, swapBetter)}`;
  })();

  document.getElementById('oRes').innerHTML = `
  <div class="rsec">
    <div class="rsec-title">📦 보유 주괴 &amp; 단가</div>
    ${iCo > 0 ? `<div class="rrow">
      <span class="rl" style="color:${CC};font-weight:700">코룸</span>
      <span class="rv">${f(iCo)}개
        <span class="muted" style="font-size:11px;font-weight:500">
          (개당 ${f(cP)}원${ib > 0 && userCo === 0 ? ` · 스킬 +${Math.round(ib*100)}% 반영` : userCo > 0 ? ' · 직접 입력' : ''})
        </span>
      </span>
    </div>` : ''}
    ${iRi > 0 ? `<div class="rrow">
      <span class="rl" style="color:${CR};font-weight:700">리프톤</span>
      <span class="rv">${f(iRi)}개
        <span class="muted" style="font-size:11px;font-weight:500">
          (개당 ${f(rP)}원${ib > 0 && userRi === 0 ? ` · 스킬 +${Math.round(ib*100)}% 반영` : userRi > 0 ? ' · 직접 입력' : ''})
        </span>
      </span>
    </div>` : ''}
    ${iSe > 0 ? `<div class="rrow">
      <span class="rl" style="color:${CS};font-weight:700">세렌트</span>
      <span class="rv">${f(iSe)}개
        <span class="muted" style="font-size:11px;font-weight:500">
          (개당 ${f(sP)}원${ib > 0 && userSe === 0 ? ` · 스킬 +${Math.round(ib*100)}% 반영` : userSe > 0 ? ' · 직접 입력' : ''})
        </span>
      </span>
    </div>` : ''}
    ${iCo === 0 && iRi === 0 && iSe === 0 ? '<div class="empty-msg" style="padding:6px 0">보유 주괴를 입력해주세요</div>' : ''}
    ${row(`전량 직판 수익${ib > 0 ? ' '+iBdg : ''}`, `${f(rawSell)}원`)}
  </div>

  <div class="rsec">
    <div class="rsec-title">📊 개당 순이익 (주괴당 이익)</div>
    ${oL1 > 0 ? netSummaryRow('하급 라스',     netLS1,  RECIPES.LS1.ingot_corum,    0, 0) : ''}
    ${oL2 > 0 ? netSummaryRow('중급 라스',     netLS2,  0, RECIPES.LS2.ingot_rifton, 0) : ''}
    ${oL3 > 0 ? netSummaryRow('상급 라스',     netLS3,  0, 0, RECIPES.LS3.ingot_serent) : ''}
    ${oAb > 0 ? netSummaryRow('어빌리티 스톤', netAbil, 1, 1, 1) : ''}
    ${precItems.map(p =>
      netSummaryRow(
        p.item.name, p.netPerItem,
        p.ingotKey === 'C' ? p.ingotCnt : 0,
        p.ingotKey === 'R' ? p.ingotCnt : 0,
        p.ingotKey === 'S' ? p.ingotCnt : 0,
        pBdg,
      )
    ).join('')}
  </div>

  <div class="rsec" style="padding:0;overflow:hidden">
    <div style="padding:10px 12px 6px;border-bottom:1px solid var(--bdr2)">
      <div style="font-family:'Jua',sans-serif;font-size:15px;color:var(--txt);display:flex;align-items:center;gap:6px">
        🔨 최적 제작 계획 ${fBdg}
      </div>
    </div>
    <div class="plan-cols">
      <div class="plan-col${noSwapWinner ? ' winner' : ''}">
        <div class="plan-col-title${noSwapWinner ? ' winner-title' : ' loser-title'}">
          ${noSwapWinner ? '🏆 ' : ''}교환 없이
        </div>
        ${noSwapInner}
      </div>
      <div class="plan-col${swapBetter ? ' winner' : ''}">
        <div class="plan-col-title${swapBetter ? ' winner-title' : ' loser-title'}">
          ${swapBetter ? '🏆 ' : ''}🔄 교환 있이
        </div>
        ${swapInner}
      </div>
    </div>
  </div>

  <div class="result-box">
    <div style="display:flex;gap:0;align-items:stretch">
      <div style="flex:1;text-align:center;padding:8px 12px;${noSwapWinner ? 'background:linear-gradient(135deg,#edf8f2,#f7fff9);border-radius:var(--rs) 0 0 var(--rs)' : ''}">
        <div class="rb-label">교환 없이 수익</div>
        <div class="rb-value${noSwapWinner ? ' rb-floor' : ''}">${f(craftRev)}원</div>
        ${noSwapWinner && swapResult ? `<span class="rb-sub" style="color:var(--grn)">추천 ✓</span>` : ''}
      </div>
      <div style="width:1.5px;background:var(--bdr2);flex:none"></div>
      <div style="flex:1;text-align:center;padding:8px 12px;${swapBetter ? 'background:linear-gradient(135deg,#edf8f2,#f7fff9);border-radius:0 var(--rs) var(--rs) 0' : ''}">
        <div class="rb-label">교환 있이 수익</div>
        <div class="rb-value${swapBetter ? ' rb-floor' : ''}">${swapResult ? f(swapCraftRev) : '—'}${swapResult ? '원' : ''}</div>
        ${swapBetter ? `<span class="rb-sub" style="color:var(--grn)">추천 ✓ (+${f(swapCraftRev - craftRev)}원)</span>` : ''}
      </div>
    </div>
  </div>`;
}


/* ════════════════════════════════════════
   ⑪ 초기화 — 페이지 로드 시 1회 실행
════════════════════════════════════════ */

export function init() {
  // 초기 탭 타이틀 설정
  const titleEl = document.getElementById('pageTabTitle');
  if (titleEl) titleEl.textContent = TAB_TITLES[0];
  document.title = `광부 계산기 — ${TAB_TITLES[0]}`;

  onSkillChange();
  onEngravingChange();
}