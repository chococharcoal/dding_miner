import {
  SKILLS, MINING, PICKAXE, ARTIFACT, ENGRAVING,
  INGOT_RECIPES, RECIPES, TORCH, UNITS, PRECIOUS, DEFAULT_PRICES,
} from './mining%20config.js';

const { SET_SIZE, BOX_SIZE } = UNITS;
const COBBY_DROP_RATE = 0.5;

export const f = n => Math.round(n).toLocaleString('ko-KR');
export const fd = (n, d = 2) =>
  +n.toFixed(d) === Math.round(+n.toFixed(d))
    ? Math.round(n).toString()
    : n.toFixed(d).replace(/\.?0+$/, '');

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

export function gi(id) {
  const e = document.getElementById(id);
  return e ? Math.max(0, +e.value || 0) : 0;
}

export function gv(id) {
  const e = document.getElementById(id);
  return e ? e.value : '';
}

const bdg = (cls, txt) => `<span class="bdg ${cls}">${txt}</span>`;
const row = (l, v, vc = '') =>
  `<div class="rrow"><span class="rl">${l}</span><span class="rv ${vc}">${v}</span></div>`;

function getIngotPrices(ib) {
  const userC = gi('oCo') || gi('ingotPriceC');
  const userR = gi('oRi') || gi('ingotPriceR');
  const userS = gi('oSe') || gi('ingotPriceS');
  const rawC = userC > 0 ? userC : (DEFAULT_PRICES.ingot?.corum  ?? 0);
  const rawR = userR > 0 ? userR : (DEFAULT_PRICES.ingot?.rifton ?? 0);
  const rawS = userS > 0 ? userS : (DEFAULT_PRICES.ingot?.serent ?? 0);
  return {
    sellC: userC > 0 ? userC : rawC,
    sellR: userR > 0 ? userR : rawR,
    sellS: userS > 0 ? userS : rawS,
    costC: rawC, costR: rawR, costS: rawS,
  };
}

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

const TAB_TITLES = ['⛏ 채광 계산기','🔥 강화횃불 제작기','💰 수익 최적화'];

export function sw(i, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  for (let k = 0; k < 3; k++) {
    const p = document.getElementById('t' + k);
    if (p) p.style.display = 'none';
  }
  el.classList.add('on');
  document.getElementById('t' + i).style.display = 'block';
  const titleEl = document.getElementById('pageTabTitle');
  if (titleEl && TAB_TITLES[i]) titleEl.textContent = TAB_TITLES[i];
  document.title = `광부 계산기 — ${TAB_TITLES[i]}`;
}

export function getSK() {
  const fl  = gi('skillFurnace');
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
    ib: 0,
    gb: (SKILLS.GEM_SELL.bonusPct[gl]     ?? 0) / 100,
    ca: SKILLS.COBYTIME.dropPct[cl]       ?? 0,
    sp: sp.pct, sc: sp.count,
    lp: lk.pct, lc: lk.count,
    fp: SKILLS.FIRE_PICK.dropPct[fpl]     ?? 0,
    pb: (SKILLS.PRECIOUS.bonusPct[pl]     ?? 0) / 100,
    fl, gl, cl, sl, ll, fpl, pl,
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

export function onSkillChange() {
  const st = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
  const { fl, gl, cl, sl, ll, fpl, pl } = getSK();
  st('skillFurnaceInfo',  fl  === 0 ? '기본' : `Lv${fl}  — ${SKILLS.FURNACE.reductionPct[fl]}% 감소`);
  st('skillGemSellInfo',  gl  === 0 ? '기본' : `Lv${gl}  — 보석 +${SKILLS.GEM_SELL.bonusPct[gl]}%`);
  st('skillPreciousInfo', pl  === 0 ? '기본' : `Lv${pl}  — 귀중품 +${SKILLS.PRECIOUS.bonusPct[pl]}%`);
  st('skillCobbyInfo',    cl  === 0 ? '기본' : `Lv${cl}  — 코비 +${SKILLS.COBYTIME.dropPct[cl]}%`);
  const sp = SKILLS.SPARKLE.drops[sl];
  st('skillSparkleInfo',  sl  === 0 ? '기본' : sp ? `Lv${sl} — ${sp.pct}% / ${sp.count}개` : '');
  const lk = SKILLS.LUCKY_HIT.drops[ll];
  st('skillLuckyInfo',    ll  === 0 ? '기본' : lk ? `Lv${ll} — ${lk.pct}% / +${lk.count}개` : '');
  st('skillFirePickInfo', fpl === 0 ? '기본' : `Lv${fpl} — ${SKILLS.FIRE_PICK.dropPct[fpl]}% 주괴 드롭`);
  cs(); ct(); co();
}

export function onEngravingChange() {
  const st = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
  const { ol, rl, cl, gc, ca, ro } = getENG();
  st('engOreLuckInfo',  ol === 0 ? '없음' : `Lv${ol} — ${ENGRAVING.ORE_LUCK.extraOrePct[ol]}% / +1개`);
  st('engRelicInfo',    rl === 0 ? '없음' : `Lv${rl} — 유물 +${ENGRAVING.RELIC_SEARCH.extraArtifactPct[rl]}%`);
  st('engCobbyInfo',    cl === 0 ? '없음' : `Lv${cl} — 코비 +${ENGRAVING.COBBY_SUMMON.extraCobbyPct[cl]}%`);
  st('engGemCobbyInfo', gc === 0 ? '없음' : `Lv${gc} — 보석코비 ${ENGRAVING.GEM_COBBY.gemConvertPct[gc]}%`);
  st('engCartInfo',     ca === 0 ? '없음' : `Lv${ca} — ${ENGRAVING.MINE_CART.cartPct[ca]}% 광산수레`);
  st('engRouletteInfo', ro === 0 ? '없음' : `Lv${ro} — ${ENGRAVING.MINER_ROULETTE.dicePct[ro]}% 주사위`);
  cs();
}

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

const CC = '#e07b2a';
const CR = '#3a9e68';
const CS = '#d94f3d';

export function cs() {
  const m   = calcMining();
  const p80 = calc80Ingots(m);
  const sk  = m.sk;
  const eng = m.eng;
  const userIC = gi('ingotPriceC');
  const userIR = gi('ingotPriceR');
  const userIS = gi('ingotPriceS');
  const bC = userIC > 0 ? userIC : (DEFAULT_PRICES.ingot?.corum  ?? 0);
  const bR = userIR > 0 ? userIR : (DEFAULT_PRICES.ingot?.rifton ?? 0);
  const bS = userIS > 0 ? userIS : (DEFAULT_PRICES.ingot?.serent ?? 0);
  const rawGC = gi('gemPriceC')   || (DEFAULT_PRICES.gem?.corum  ?? 0);
  const rawGR = gi('gemPriceR')   || (DEFAULT_PRICES.gem?.rifton ?? 0);
  const rawGS = gi('gemPriceS')   || (DEFAULT_PRICES.gem?.serent ?? 0);
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
  const ingotRow = (label, color, ingotFromOre, fpBonus, total) => {
    if (total < 0.01) return '';
    const fpPart = fpBonus >= 0.01
      ? ` <span style="font-size:11px;color:var(--muted);font-weight:400">(불곡 +${fd(fpBonus)})</span>`
      : '';
    return `<div class="rrow"><span class="rl" style="color:${color};font-weight:700">${label} 주괴</span><span class="rv"><b style="color:${color}">${f(total)}개</b>${fpPart}</span></div>`;
  };
  const ingot80Items = [
    p80.tC80 > 0.01 ? `<span style="color:${CC};white-space:nowrap">코룸 ${f(p80.tC80)}개</span>` : '',
    p80.tR80 > 0.01 ? `<span style="color:${CR};white-space:nowrap">리프톤 ${f(p80.tR80)}개</span>` : '',
    p80.tS80 > 0.01 ? `<span style="color:${CS};white-space:nowrap">세렌트 ${f(p80.tS80)}개</span>` : '',
  ].filter(Boolean);
  const extra80Items = [
    p80.totalGems80   > 0 ? `<span style="white-space:nowrap">보석 ${fd(p80.totalGems80)}개</span>` : '',
    p80.normalCobby80 > 0 ? `<span style="white-space:nowrap">펄스 ${fd(p80.normalCobby80)}개</span>` : '',
    p80.artPts80      > 0 ? `<span style="white-space:nowrap">유물 ${f(p80.artPts80)}pt</span>` : '',
  ].filter(Boolean);
  const ingotAvgItems = [
    m.totalIngotC > 0.01 ? `<span style="color:${CC};white-space:nowrap">코룸 ${f(m.totalIngotC)}개</span>` : '',
    m.totalIngotR > 0.01 ? `<span style="color:${CR};white-space:nowrap">리프톤 ${f(m.totalIngotR)}개</span>` : '',
    m.totalIngotS > 0.01 ? `<span style="color:${CS};white-space:nowrap">세렌트 ${f(m.totalIngotS)}개</span>` : '',
  ].filter(Boolean);
  const extraAvgItems = [
    m.totalGems      > 0.01 ? `<span style="white-space:nowrap">보석 ${fd(m.totalGems)}개</span>` : '',
    m.normalCobby    > 0.01 ? `<span style="white-space:nowrap">펄스 ${fd(m.normalCobby)}개</span>` : '',
    m.totalArtifacts > 0.01 ? `<span style="white-space:nowrap">유물 ${f(m.totalArtPts)}pt</span>` : '',
  ].filter(Boolean);
  function subHtml(ingotItems, extraItems) {
    const line1 = ingotItems.length ? `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px 8px">${ingotItems.join('')}</div>` : '';
    const line2 = extraItems.length ? `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px 8px;margin-top:2px">${extraItems.join('')}</div>` : '';
    return line1 + line2;
  }
  let html = `
  <div class="rsec">
    <div class="rsec-title">⛏ 획득 주괴 수</div>
    ${ingotRow('코룸',   CC, m.ingotFromOreC, m.fpC, m.totalIngotC)}
    ${ingotRow('리프톤', CR, m.ingotFromOreR, m.fpR, m.totalIngotR)}
    ${ingotRow('세렌트', CS, m.ingotFromOreS, m.fpS, m.totalIngotS)}
    ${m.totalTorch > 0.01 ? `<div class="rrow" style="border-top:1px dashed var(--bdr2);margin-top:4px;padding-top:5px"><span class="rl" style="color:var(--muted)">필요 강화횃불 합계</span><span class="rv" style="color:var(--muted)">${f(m.totalTorch)}개</span></div>` : ''}
  </div>`;
  if (m.totalGems > 0 || m.cobbyCount > 0) {
    html += `<div class="rsec"><div class="rsec-title">💎 보석 &amp; 코비</div>
    ${m.totalGems > 0 ? `<div class="rrow rrow-strong"><span class="rl" style="color:var(--txt);font-weight:900">보석</span><span class="rv" style="color:var(--txt)">${fd(m.totalGems)}개</span></div>` : ''}
    ${m.sparkleGems > 0 ? `<div class="rrow"><span class="rl" style="color:var(--muted)">└ 반짝임의 시작</span><span class="rv" style="color:var(--muted)">${fd(m.sparkleGems)}개</span></div>` : ''}
    ${m.gemCobby    > 0 ? `<div class="rrow"><span class="rl" style="color:var(--muted)">└ 보석코비</span><span class="rv" style="color:var(--muted)">${fd(m.gemCobby)}개</span></div>` : ''}
    ${m.normalCobby > 0 ? `<div class="rrow rrow-strong" style="margin-top:4px"><span class="rl" style="color:var(--txt);font-weight:900">스킬펄스</span><span class="rv" style="color:var(--txt)">${fd(m.normalCobby)}개</span></div>` : ''}
    ${m.cobbyCount  > 0 ? `<div class="rrow"><span class="rl" style="color:var(--muted)">└ 코비 소환 (${fd(m.totalCobbyPct)}%)</span><span class="rv" style="color:var(--muted)">${fd(m.cobbyCount)}회</span></div>` : ''}
    </div>`;
  }
  if (m.totalArtifacts > 0) {
    html += `<div class="rsec"><div class="rsec-title">🗿 유물</div>
    <div class="rrow rrow-strong"><span class="rl" style="color:var(--txt);font-weight:900">유물 포인트</span><span class="rv" style="color:var(--txt)">${f(m.totalArtPts)}pt <small style="color:var(--muted)">${fd(m.totalArtifacts)}개</small></span></div>
    <div class="rrow"><span class="rl" style="color:var(--muted)">└ 드랍율 (${fd(m.px.artifactPct + eng.ap)}%)</span><span class="rv" style="color:var(--muted)">${fd(m.artDrops)}개</span></div>
    ${m.cartDrops > 0 ? `<div class="rrow"><span class="rl" style="color:var(--muted)">└ 광산수레</span><span class="rv" style="color:var(--muted)">${fd(m.cartDrops)}회 → ${fd(m.cartDrops*2)}개</span></div>` : ''}
    </div>`;
  }
  html += `<div class="rsec"><div class="rsec-title">💰 기댓값 수익</div>
    ${row('주괴', `${f(ingotRev)}원`, 'g')}
    ${m.totalGems > 0 ? row('보석', `${f(gemRev)}원`, 'g') : ''}
    ${m.normalCobby > 0 ? (spPrice > 0 ? row('스킬펄스', `${f(spRev)}원`, 'g') : row('스킬펄스', '단가 미입력', 'muted')) : ''}
    ${m.totalArtifacts > 0 ? (artPtPrice > 0 ? row('유물', `${f(artRev)}원`, 'g') : row('유물 포인트', '단가 미입력', 'muted')) : ''}
  </div>
  <div class="result-box">
    <div style="display:flex;gap:12px;align-items:stretch">
      <div style="flex:1;text-align:center;padding:4px 8px">
        <div class="rb-label">하루 평균 수익</div>
        <div class="rb-value">${f(totalRev)}원</div>
        <div class="rb-sub" style="margin-top:4px">${subHtml(ingotAvgItems, extraAvgItems)}</div>
      </div>
      <div style="width:1px;background:var(--bdr2);margin:4px 0;flex:none"></div>
      <div style="flex:1;text-align:center;padding:4px 8px">
        <div class="rb-label">80% 확률로 최소</div>
        <div class="rb-value rb-floor">${f(totalRev80)}원</div>
        <div class="rb-sub" style="margin-top:4px">${subHtml(ingot80Items, extra80Items)}</div>
      </div>
    </div>
  </div>`;
  document.getElementById('sRes').innerHTML = html;
}

export function ct() {
  const sk = getSK();
  const timePerTorch = TORCH.craft_time_sec * (1 - sk.fr);
  const charU        = gi('tCharcoalPrice') / SET_SIZE;
  const woodSetPrice = gi('tWoodPrice');
  const stickU       = woodSetPrice / (SET_SIZE * 8);
  const wantN   = readSplitQty('tWantCount');
  const parsedEl = document.getElementById('tWantCountParsed');
  if (parsedEl) parsedEl.textContent = wantN > 0 ? `총 ${f(wantN)}개` : '';
  const sellEa   = gi('tSellPrice') / SET_SIZE;
  const costEa   = charU + stickU;
  const totalCost = costEa * wantN;
  const totalTime = timePerTorch * wantN;
  const hasPrice = sellEa > 0;
  const totalRev = hasPrice ? sellEa * wantN : 0;
  const net      = totalRev - totalCost;
  const needWoodLogs = wantN / 8;
  const mRow = (l, v) =>
    `<div class="rrow"><span class="rl" style="color:var(--muted)">${l}</span><span class="rv" style="color:var(--muted)">${v}</span></div>`;
  document.getElementById('tRes').innerHTML = `
  <div class="rsec">
    ${mRow('횃불 1개 재료비', `${costEa.toFixed(1)}원`)}
    ${mRow('필요 숯/석탄', fmtQty(wantN))}
    ${mRow('필요 원목', fmtQty(Math.ceil(needWoodLogs)))}
    ${mRow('총 제작 시간', fmtTime(totalTime))}
  </div>
  <div class="result-box">
    <div class="rb-label">${hasPrice ? '순이익' : '총 재료비'}</div>
    <div class="rb-value" style="color:${hasPrice ? (net >= 0 ? 'var(--grn)' : 'var(--red)') : 'var(--red)'}">
      ${f(hasPrice ? net : totalCost)}원
    </div>
  </div>`;
}

export function autoFillPrices() {
  const fill = (id, val) => {
    if (!val || val <= 0) return;
    const el = document.getElementById(id);
    if (el && (!el.value || +el.value === 0)) {
      el.value = Math.round(val);
      el.dispatchEvent(new Event('input'));
    }
  };
  const S = SET_SIZE;
  /* 라이프스톤·어빌리티 스톤 — config DEFAULT_PRICES에서 읽기 */
  fill('oL1', DEFAULT_PRICES.ls1  ?? 0);
  fill('oL2', DEFAULT_PRICES.ls2  ?? 0);
  fill('oL3', DEFAULT_PRICES.ls3  ?? 0);
  fill('oAb', DEFAULT_PRICES.abil ?? 0);
  fill('vCo',  (DEFAULT_PRICES.vanilla?.cobblestone           ?? 0) * S);
  fill('vDc',  (DEFAULT_PRICES.vanilla?.deepslate_cobblestone ?? 0) * S);
  fill('vCu',  (DEFAULT_PRICES.vanilla?.copper                ?? 0) * S);
  fill('vIr',  (DEFAULT_PRICES.vanilla?.iron                  ?? 0) * S);
  fill('vGo',  (DEFAULT_PRICES.vanilla?.gold                  ?? 0) * S);
  fill('vDi',  (DEFAULT_PRICES.vanilla?.diamond               ?? 0) * S);
  fill('vRe',  (DEFAULT_PRICES.vanilla?.redstone              ?? 0) * S);
  fill('vLa',  (DEFAULT_PRICES.vanilla?.lapis                 ?? 0) * S);
  fill('vAm',  (DEFAULT_PRICES.vanilla?.amethyst              ?? 0) * S);
  fill('vTopaz',    DEFAULT_PRICES.precious?.topaz    ?? 0);
  fill('vSapphire', DEFAULT_PRICES.precious?.sapphire ?? 0);
  fill('vPlatinum', DEFAULT_PRICES.precious?.platinum ?? 0);
  fill('vDiorite',  (DEFAULT_PRICES.stone?.diorite  ?? 0) * S);
  fill('vTuff',     (DEFAULT_PRICES.stone?.tuff     ?? 0) * S);
  fill('vAndesite', (DEFAULT_PRICES.stone?.andesite ?? 0) * S);
  fill('tCharcoalPrice', (DEFAULT_PRICES.charcoal ?? 0) * S);
  fill('tWoodPrice',     (DEFAULT_PRICES.wood     ?? 0) * S);
  fill('skillPulsePrice', DEFAULT_PRICES.skillPulse ?? 0);
  fill('artifactPtPrice', DEFAULT_PRICES.artifactPt ?? 0);
  cs(); ct(); co();
}

function calcSwapPlan(iCo, iRi, iSe, allOptions, cP, rP, sP) {
  if (allOptions.length === 0) return null;
  const bestPerKind = { C: -Infinity, R: -Infinity, S: -Infinity };
  for (const c of allOptions) {
    const kind = c.iC > 0 ? 'C' : c.iR > 0 ? 'R' : 'S';
    const singleKind = [c.iC > 0, c.iR > 0, c.iS > 0].filter(Boolean).length === 1;
    if (!singleKind) continue;
    const ingotCnt = c.iC || c.iR || c.iS;
    const npi = c.net / ingotCnt;
    if (npi > bestPerKind[kind]) bestPerKind[kind] = npi;
  }
  const sellPerKind = { C: cP, R: rP, S: sP };
  const kindName    = { C:'코룸', R:'리프톤', S:'세렌트' };
  const holdMap = { C: iCo, R: iRi, S: iSe };
  const [bestKind] = Object.entries(bestPerKind).sort((a, b) => b[1] - a[1]);
  if (bestPerKind[bestKind[0]] <= 0) return null;
  const toKind = bestKind[0];
  const toBest = bestPerKind[toKind];
  const swapLog = [];
  const newHold = { ...holdMap };
  for (const fromKind of ['C','R','S']) {
    if (fromKind === toKind) continue;
    if (holdMap[fromKind] <= 0) continue;
    const gain = toBest - sellPerKind[fromKind];
    if (gain <= 0) continue;
    const toOpts = allOptions.filter(c => {
      const singleKind = [c.iC > 0, c.iR > 0, c.iS > 0].filter(Boolean).length === 1;
      return singleKind && (toKind === 'C' ? c.iC > 0 : toKind === 'R' ? c.iR > 0 : c.iS > 0);
    });
    if (toOpts.length === 0) continue;
    const bestOpt  = toOpts[0];
    const ingotCnt = bestOpt.iC || bestOpt.iR || bestOpt.iS;
    const maxCraft  = Math.floor(holdMap[fromKind] / ingotCnt);
    if (maxCraft <= 0) continue;
    const swapCount = maxCraft * ingotCnt;
    swapLog.push({ from: kindName[fromKind], to: kindName[toKind], count: swapCount, forItem: bestOpt.label, craftCount: maxCraft, gain });
    newHold[fromKind] -= swapCount;
    newHold[toKind]   += swapCount;
  }
  if (swapLog.length === 0) return null;
  return { swapLog, swapRemCo: newHold.C, swapRemRi: newHold.R, swapRemSe: newHold.S };
}

// 상자/세트/개 3칸 합산
function readSplitQty(id) {
  const box = parseInt(document.getElementById(id+'_box')?.value||'0')||0;
  const set = parseInt(document.getElementById(id+'_set')?.value||'0')||0;
  const ea  = parseInt(document.getElementById(id+'_ea') ?.value||'0')||0;
  return box*BOX_SIZE + set*SET_SIZE + ea;
}

export function co() {
  const { ib, fr, pb } = getSK();
  const iCo = readSplitQty('iCo');
  const iRi = readSplitQty('iRi');
  const iSe = readSplitQty('iSe');
  const showParsed = (pId, n) => {
    const el = document.getElementById(pId);
    if (el) el.textContent = n > 0 ? '총 '+f(n)+'개' : '';
  };
  showParsed('iCo_p', iCo);
  showParsed('iRi_p', iRi);
  showParsed('iSe_p', iSe);
  const userCo = gi('oCo'), userRi = gi('oRi'), userSe = gi('oSe');
  const rawC = userCo > 0 ? userCo : (DEFAULT_PRICES.ingot?.corum  ?? 0);
  const rawR = userRi > 0 ? userRi : (DEFAULT_PRICES.ingot?.rifton ?? 0);
  const rawS = userSe > 0 ? userSe : (DEFAULT_PRICES.ingot?.serent ?? 0);
  const cP = userCo > 0 ? userCo : rawC;
  const rP = userRi > 0 ? userRi : rawR;
  const sP = userSe > 0 ? userSe : rawS;
  const oL1 = gi('oL1'), oL2 = gi('oL2'), oL3 = gi('oL3'), oAb = gi('oAb');
  const ctL1 = RECIPES.LS1.craft_time_sec  * (1 - fr);
  const ctL2 = RECIPES.LS2.craft_time_sec  * (1 - fr);
  const ctL3 = RECIPES.LS3.craft_time_sec  * (1 - fr);
  const ctAb = RECIPES.ABIL.craft_time_sec * (1 - fr);
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
  const precItems = Object.entries(PRECIOUS.ITEMS).map(([key, item]) => {
    const rec = RECIPES[item.recipe];
    const iCostPrice = item.ingotType === 'corum'  ? rawC : item.ingotType === 'rifton' ? rawR : rawS;
    const iSellPrice = item.ingotType === 'corum'  ? cP   : item.ingotType === 'rifton' ? rP   : sP;
    const ingotCnt  = rec.ingot_corum || rec.ingot_rifton || rec.ingot_serent || 0;
    const ingotCost = ingotCnt * iCostPrice;
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
    const ingotKey = item.ingotType === 'corum' ? 'C' : item.ingotType === 'rifton' ? 'R' : 'S';
    return { key, item, rec, ingotCnt, ingotKey, totalCost, avgSell, netPerItem, ingotCost, vanCost, iCostPrice, iSellPrice };
  });
  const rawSell = iCo * cP + iRi * rP + iSe * sP;
  const netLS1  = oL1 - RECIPES.LS1.ingot_corum    * rawC - vc('LS1');
  const netLS2  = oL2 - RECIPES.LS2.ingot_rifton   * rawR - vc('LS2');
  const netLS3  = oL3 - RECIPES.LS3.ingot_serent   * rawS - vc('LS3');
  const netAbil = oAb - (rawC + rawR + rawS);
  const totalIngots = c => c.iC + c.iR + c.iS;
  const netPerIngot = c => { const n = totalIngots(c); return n > 0 ? c.net / n : -Infinity; };
  const allOptions = [
    { key:'LS1',  label:'하급 라이프스톤', net:netLS1,  sell:oL1, iC: RECIPES.LS1.ingot_corum,    iR: 0,                       iS: 0,                        ct:ctL1, type:'ls' },
    { key:'LS2',  label:'중급 라이프스톤', net:netLS2,  sell:oL2, iC: 0,                           iR: RECIPES.LS2.ingot_rifton, iS: 0,                        ct:ctL2, type:'ls' },
    { key:'LS3',  label:'상급 라이프스톤', net:netLS3,  sell:oL3, iC: 0,                           iR: 0,                        iS: RECIPES.LS3.ingot_serent, ct:ctL3, type:'ls' },
    { key:'ABIL', label:'어빌리티 스톤',   net:netAbil, sell:oAb, iC: 1,                           iR: 1,                        iS: 1,                        ct:ctAb, type:'ls' },
    ...precItems.filter(p => p.netPerItem > 0).map(p => ({
      key: p.key, label: p.item.name, net: p.netPerItem, sell: p.avgSell,
      iC: p.ingotKey === 'C' ? p.ingotCnt : 0,
      iR: p.ingotKey === 'R' ? p.ingotCnt : 0,
      iS: p.ingotKey === 'S' ? p.ingotCnt : 0,
      ct: RECIPES[p.item.recipe].craft_time_sec * (1 - fr), type: 'precious', extra: p,
    })),
  ]
    .filter(c => c.net > 0 && c.sell > 0)
    .sort((a, b) => netPerIngot(b) - netPerIngot(a));
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
    remCo -= c.iC * maxN; remRi -= c.iR * maxN; remSe -= c.iS * maxN;
  }
  const swapResult = calcSwapPlan(iCo, iRi, iSe, allOptions, cP, rP, sP);
  let swapCraftResult = [];
  let swapRemCo = iCo, swapRemRi = iRi, swapRemSe = iSe;
  if (swapResult) {
    swapRemCo = swapResult.swapRemCo; swapRemRi = swapResult.swapRemRi; swapRemSe = swapResult.swapRemSe;
    for (const c of allOptions) {
      const maxN = Math.min(
        c.iC > 0 ? Math.floor(swapRemCo / c.iC) : Infinity,
        c.iR > 0 ? Math.floor(swapRemRi / c.iR) : Infinity,
        c.iS > 0 ? Math.floor(swapRemSe / c.iS) : Infinity,
      );
      if (maxN <= 0) continue;
      swapCraftResult.push({ ...c, count: maxN });
      swapRemCo -= c.iC * maxN; swapRemRi -= c.iR * maxN; swapRemSe -= c.iS * maxN;
    }
  }
  const remSell = remCo * cP + remRi * rP + remSe * sP;
  let craftRev = remSell, craftTime = 0;
  for (const c of craftResult) { craftRev += c.count * (c.type === 'precious' ? c.extra.avgSell : c.sell); craftTime += c.count * c.ct; }
  const swapRemSell = swapRemCo * cP + swapRemRi * rP + swapRemSe * sP;
  let swapCraftRev = swapRemSell, swapCraftTime = 0;
  for (const c of swapCraftResult) { swapCraftRev += c.count * (c.type === 'precious' ? c.extra.avgSell : c.sell); swapCraftTime += c.count * c.ct; }
  function aggregateMats(results) {
    const mats = {};
    const ingotTotals = { 코룸: 0, 리프톤: 0, 세렌트: 0 };
    for (const c of results) {
      if (c.iC > 0) ingotTotals['코룸']   += c.iC * c.count;
      if (c.iR > 0) ingotTotals['리프톤'] += c.iR * c.count;
      if (c.iS > 0) ingotTotals['세렌트'] += c.iS * c.count;
      const rec = c.type === 'ls' ? RECIPES[c.key] : c.extra?.rec;
      if (!rec) continue;
      for (const [mat, qty] of Object.entries(rec.vanilla || {})) { if (qty) mats[mat] = (mats[mat] || 0) + qty * c.count; }
      if (rec.doc) mats['__doc__'] = (mats['__doc__'] || 0) + rec.doc * c.count;
    }
    return { ingotTotals, mats };
  }
  const ingotChip = (label, color, total) =>
    '<span class="mat-chip" style="background:'+color+'18;color:'+color+';border-color:'+color+'55">'+label+' 주괴 '+fmtQty(total)+'</span>';

  // ── 제작 아이템 카드 빌드 ──
  function buildPlanCards(results) {
    if (!results.length) return '<div class="empty-msg" style="padding:14px 0">제작 가능한 옵션 없음</div>';
    return results.map(c => {
      const rev = c.count * (c.type === 'precious' ? c.extra.avgSell : c.sell);
      const t   = c.count * c.ct;
      const npi = totalIngots(c);
      const precBadge = c.type === 'precious' ? ' '+bdg('bpu','귀중품') : '';
      const npiTxt = npi > 0 ? '<span style="font-size:10px;color:var(--muted);font-weight:500;margin-left:4px">주괴당 '+f(c.net/npi)+'원</span>' : '';

      // 필요 주괴 칩
      let ingotChips = '';
      if (c.iC > 0) ingotChips += ingotChip('코룸',   CC, c.iC*c.count);
      if (c.iR > 0) ingotChips += ingotChip('리프톤', CR, c.iR*c.count);
      if (c.iS > 0) ingotChips += ingotChip('세렌트', CS, c.iS*c.count);

      // 바닐라 재료 칩
      let vanChips = '';
      if (c.type === 'ls') {
        vanChips = Object.entries(RECIPES[c.key].vanilla||{}).filter(([,q])=>q>0).map(([mat,qty])=>matChipQty(mat,qty*c.count)).join('');
      } else {
        const rec = c.extra.rec;
        const chips = Object.entries(rec.vanilla||{}).filter(([,q])=>q>0).map(([mat,qty])=>matChipQty(mat,qty*c.count));
        if (rec.doc) chips.push('<span class="mat-chip" style="background:#ff980018;color:#e07b2a;border-color:#e07b2a55">증서 '+c.count+'개</span>');
        vanChips = chips.join('');
      }

      // 감정가 (귀중품)
      const apprHtml = c.type==='precious'
        ? '<div style="display:flex;flex-wrap:wrap;gap:4px 10px;font-size:10px;color:var(--muted);margin-top:4px">'
          +'<span>하 '+f(c.extra.item.prices.LOW*(1+pb))+'원</span>'
          +'<span>우수 '+f(c.extra.item.prices.GOOD*(1+pb))+'원</span>'
          +'<span>황실 '+f(c.extra.item.prices.ROYAL*(1+pb))+'원</span>'
          +'<span style="color:var(--grn);font-weight:700">기댓값 '+f(c.extra.avgSell)+'원</span>'
          +'</div>' : '';

      // 제작 가이드 (접기/펼치기)
      const guideId = 'cg_'+c.key+'_'+c.count;
      let guideHtml = '';
      if (ingotChips||vanChips) {
        guideHtml = '<div onclick="var g=this.nextElementSibling;g.style.display=g.style.display===\'none\'?\'block\':\'none\';this.querySelector(\'.ga\').textContent=g.style.display===\'none\'?\'▶\':\'▼\'" '
          +'style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:var(--acc);padding:6px 0;border-top:1px dashed var(--bdr);margin-top:6px;user-select:none">'
          +'<span class="ga">▶</span> 필요 재료 보기</div>'
          +'<div style="display:none;padding-top:4px">'
          +(ingotChips ? '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px">'+ingotChips+'</div>' : '')
          +(vanChips   ? '<div style="display:flex;flex-wrap:wrap;gap:4px">'+vanChips+'</div>' : '')
          +'</div>';
      }

      return '<div class="m-craft-card">'
        +'<div class="m-craft-header">'
        +  '<div><div class="m-craft-name">'+c.label+precBadge+npiTxt+'</div>'+apprHtml+'</div>'
        +  '<div style="text-align:right;flex-shrink:0">'
        +    '<div class="m-craft-rev">'+f(rev)+'원</div>'
        +    '<div class="m-craft-count">'+fmtQty(c.count)+'</div>'
        +  '</div>'
        +'</div>'
        +(t>0?'<div style="font-size:10px;color:var(--blu);font-weight:700;margin-top:4px">⏱ '+fmtTime(t)+'</div>':'')
        +guideHtml
        +'</div>';
    }).join('');
  }

  // ── 재료 합산 토글 ──
  let _matIdx = 0;
  function matSummaryHtml(results) {
    if (!results.length) return '';
    const uid = 'mt'+(++_matIdx);
    const { ingotTotals, mats } = aggregateMats(results);
    const ingotRows = [
      ingotTotals['코룸']   > 0 ? '<div class="mat-summary-row"><span class="mn" style="color:'+CC+'">● 코룸 주괴</span><span class="mv">'+fmtQty(ingotTotals['코룸'])+'</span></div>' : '',
      ingotTotals['리프톤'] > 0 ? '<div class="mat-summary-row"><span class="mn" style="color:'+CR+'">● 리프톤 주괴</span><span class="mv">'+fmtQty(ingotTotals['리프톤'])+'</span></div>' : '',
      ingotTotals['세렌트'] > 0 ? '<div class="mat-summary-row"><span class="mn" style="color:'+CS+'">● 세렌트 주괴</span><span class="mv">'+fmtQty(ingotTotals['세렌트'])+'</span></div>' : '',
    ].join('');
    const vanRows = Object.entries(mats).filter(([k])=>k!=='__doc__').map(([mat,qty])=>{
      const m = MAT_META[mat]||{name:mat,color:'#888'};
      return '<div class="mat-summary-row"><span class="mn" style="color:'+m.color+'">● '+m.name+'</span><span class="mv">'+fmtQty(qty)+'</span></div>';
    }).join('');
    const docRow = mats['__doc__'] ? '<div class="mat-summary-row"><span class="mn" style="color:#e07b2a">● 증서</span><span class="mv">'+mats['__doc__']+'개</span></div>' : '';
    return '<div class="mat-toggle" onclick="this.nextElementSibling.classList.toggle(\'open\');this.querySelector(\'.mat-arr\').textContent=this.nextElementSibling.classList.contains(\'open\')?\'▲\':\'▼\'">📋 총 필요 재료 <span class="mat-arr">▼</span></div>'
      +'<div class="mat-detail" id="'+uid+'"><div class="mat-summary">'+ingotRows+vanRows+docRow+'</div></div>';
  }

  const fBdg = fr > 0 ? bdg('bg', '초고속 용광로 -'+Math.round(fr*100)+'%') : '';
  const netSummaryRow = (label, net, iC, iR, iS) => {
    if (!label || net === 0) return '';
    const color = net >= 0 ? 'g' : 'r';
    const n = iC+iR+iS;
    const kl = [iC>0?'코룸 ':null, iR>0?'리프톤 ':null, iS>0?'세렌트 ':null].filter(Boolean).length===1
      ? (iC>0?'코룸 ':iR>0?'리프톤 ':'세렌트 ') : '';
    const perHtml = n>0 ? ' <small style="color:var(--muted)">· '+kl+'주괴당 '+f(net/n)+'원</small>' : '';
    return row(label, f(net)+'원'+perHtml, color);
  };

  // ── 교환 체크박스 반영 ──
  const swapEnabled = document.getElementById('swapEnabled')?.checked ?? false;
  const swapBetter  = swapEnabled && swapResult && swapCraftRev > craftRev;
  const winResults  = swapBetter ? swapCraftResult : craftResult;
  const winRev      = swapBetter ? swapCraftRev    : craftRev;
  const winTime     = swapBetter ? swapCraftTime   : craftTime;
  const winRemC     = swapBetter ? swapRemCo       : remCo;
  const winRemR     = swapBetter ? swapRemRi       : remRi;
  const winRemS     = swapBetter ? swapRemSe       : remSe;

  // 교환 정보 배너
  const swapInfoHtml = swapEnabled && swapResult ? (() => {
    const kindColor = {'코룸':CC,'리프톤':CR,'세렌트':CS};
    const rows = swapResult.swapLog.map(s=>
      '<div style="display:flex;align-items:center;gap:6px;font-size:12px;padding:4px 0;border-bottom:1px dashed var(--bdr)">'
      +'<span style="color:'+kindColor[s.from]+'">'+s.from+'</span>'
      +'<span style="color:var(--muted)"> → </span>'
      +'<span style="color:'+kindColor[s.to]+'">'+s.to+'</span>'
      +' <b>'+f(s.count)+'개</b> 교환'
      +'</div>'
    ).join('');
    const gain = swapCraftRev - craftRev;
    return '<div style="background:var(--ylw-bg);border:1.5px solid var(--ylw);border-radius:var(--rs);padding:8px 10px;margin-bottom:10px">'
      +'<div style="font-family:\'Jua\',sans-serif;font-size:12px;color:var(--ylw);margin-bottom:5px">'
      +(gain>0?'🔄 교환 후 제작 시 +'+f(gain)+'원 이득':'🔄 교환해도 추가 이득 없음')
      +'</div>'+rows+'</div>';
  })() : '';

  const remHtml = (winRemC+winRemR+winRemS)>0
    ? '<div class="rrow"><span class="rl">남은 주괴</span><span class="rv" style="font-size:11px">'
      +(winRemC>0?'<span style="color:'+CC+'">'+f(winRemC)+'개</span> ':'')
      +(winRemR>0?'<span style="color:'+CR+'">'+f(winRemR)+'개</span> ':'')
      +(winRemS>0?'<span style="color:'+CS+'">'+f(winRemS)+'개</span>':'')
      +'</span></div>' : '';

  // 입력 없을 때
  if (iCo===0 && iRi===0 && iSe===0) {
    document.getElementById('oRes').innerHTML = '<div class="empty-msg">보유 주괴를 입력해주세요</div>';
    return;
  }

  document.getElementById('oRes').innerHTML =
  '<div class="rsec"><div class="rsec-title">📊 개당 순이익</div>'
    +(oL1>0?netSummaryRow('하급 라스',  netLS1,  RECIPES.LS1.ingot_corum,  0, 0):'')
    +(oL2>0?netSummaryRow('중급 라스',  netLS2,  0, RECIPES.LS2.ingot_rifton,  0):'')
    +(oL3>0?netSummaryRow('상급 라스',  netLS3,  0, 0, RECIPES.LS3.ingot_serent):'')
    +(oAb>0?netSummaryRow('어빌리티 스톤', netAbil, 1, 1, 1):'')
    +precItems.map(p=>netSummaryRow(p.item.name, p.netPerItem, p.ingotKey==='C'?p.ingotCnt:0, p.ingotKey==='R'?p.ingotCnt:0, p.ingotKey==='S'?p.ingotCnt:0)).join('')
  +'</div>'
  +'<div style="font-family:\'Jua\',sans-serif;font-size:14px;color:var(--txt);margin:4px 0 8px;display:flex;align-items:center;gap:6px">🔨 최적 제작 계획 '+fBdg+'</div>'
  +swapInfoHtml
  +buildPlanCards(winResults)
  +matSummaryHtml(winResults)
  +'<div class="rsec" style="margin-top:8px">'
    +remHtml
    +(winTime>0?'<div class="rrow"><span class="rl">총 제작 시간</span><span class="rv">'+fmtTime(winTime)+'</span></div>':'')
  +'</div>'
  +'<div class="result-box" style="margin-top:8px">'
    +'<div class="rb-label">최적 제작 예상 수익</div>'
    +'<div class="rb-value" style="color:var(--grn)">'+f(winRev)+'원</div>'
  +'</div>';
}


export function init() {
  const titleEl = document.getElementById('pageTabTitle');
  if (titleEl) titleEl.textContent = TAB_TITLES[0];
  document.title = `광부 계산기 — ${TAB_TITLES[0]}`;
  onSkillChange();
  onEngravingChange();
}