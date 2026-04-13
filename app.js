/* ════════════════════════════════════════
   app.js — 광부 계산기
════════════════════════════════════════ */
import {
  SKILLS, MINING, PICKAXE, ARTIFACT, ENGRAVING,
  INGOT_RECIPES, RECIPES, TORCH, UNITS, PRECIOUS, DEFAULT_PRICES,
} from './config.js';

const { SET_SIZE, BOX_SIZE } = UNITS;

/* ─── 유틸 ─── */
export const f  = n => Math.round(n).toLocaleString('ko-KR');
export const fd = (n,d=2) => +n.toFixed(d) === Math.round(+n.toFixed(d))
  ? Math.round(n).toString()
  : n.toFixed(d).replace(/\.?0+$/,'');

export function fmtQty(n) {
  n = Math.floor(n);
  if (n<=0) return '0개';
  const boxes=Math.floor(n/BOX_SIZE), rem=n%BOX_SIZE,
        sets=Math.floor(rem/SET_SIZE), items=rem%SET_SIZE;
  return [[boxes,'상자'],[sets,'세트'],[items,'개']].filter(([v])=>v>0).map(([v,u])=>v+u).join(' ')||'0개';
}
export function fmtTime(sec) {
  if(sec<=0)return '0초';
  const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.round(sec%60);
  return [[h,'시간'],[m,'분'],[s,'초']].filter(([v])=>v>0).map(([v,u])=>v+u).join(' ');
}
export function gi(id){ const e=document.getElementById(id); return e?Math.max(0,+e.value||0):0; }
export function gv(id){ const e=document.getElementById(id); return e?e.value:''; }
const bdg=(cls,txt)=>`<span class="bdg ${cls}">${txt}</span>`;
const row=(l,v,vc='')=>`<div class="rrow"><span class="rl">${l}</span><span class="rv ${vc}">${v}</span></div>`;

/* ─── 스킬/각인 ─── */
export function getSK() {
  const fl=gi('skillFurnace'),il=gi('skillIngotSell'),gl=gi('skillGemSell'),
        cl=gi('skillCobby'), sl=gi('skillSparkle'),  ll=gi('skillLucky'),
        fpl=gi('skillFirePick'),pl=gi('skillPrecious');
  const sp=SKILLS.SPARKLE.drops[sl]||{pct:0,count:0};
  const lk=SKILLS.LUCKY_HIT.drops[ll]||{pct:0,count:0};
  return {
    fr: (SKILLS.FURNACE.reductionPct[fl]??0)/100,
    ib: (SKILLS.INGOT_SELL.bonusPct[il]??0)/100,
    gb: (SKILLS.GEM_SELL.bonusPct[gl]??0)/100,
    ca: SKILLS.COBYTIME.dropPct[cl]??0,
    sp: sp.pct, sc: sp.count,
    lp: lk.pct, lc: lk.count,
    fp: SKILLS.FIRE_PICK.dropPct[fpl]??0,
    pb: (SKILLS.PRECIOUS.bonusPct[pl]??0)/100,
    fl,il,gl,cl,sl,ll,fpl,pl,
  };
}
export function getENG() {
  const ol=gi('engOreLuck'),rl=gi('engRelic'),cl=gi('engCobby'),
        gc=gi('engGemCobby'),ca=gi('engCart'),ro=gi('engRoulette');
  return {
    op: ENGRAVING.ORE_LUCK.extraOrePct[ol]??0,
    ap: ENGRAVING.RELIC_SEARCH.extraArtifactPct[rl]??0,
    cp: ENGRAVING.COBBY_SUMMON.extraCobbyPct[cl]??0,
    gp: ENGRAVING.GEM_COBBY.gemConvertPct[gc]??0,
    kp: ENGRAVING.MINE_CART.cartPct[ca]??0,
    dp: ENGRAVING.MINER_ROULETTE.dicePct[ro]??0,
    ol,rl,cl,gc,ca,ro,
  };
}

/* ─── 탭 ─── */
export function sw(i,el){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  for(let k=0;k<3;k++){const p=document.getElementById('t'+k);if(p)p.style.display='none';}
  el.classList.add('on');
  document.getElementById('t'+i).style.display='block';
}

/* ─── 스킬 info 업데이트 ─── */
export function onSkillChange(){
  const st=(id,txt)=>{const e=document.getElementById(id);if(e)e.textContent=txt;};
  const {fl,il,gl,cl,sl,ll,fpl,pl}=getSK();
  st('skillFurnaceInfo',   fl ===0?'기본':  `Lv${fl}  — ${SKILLS.FURNACE.reductionPct[fl]}% 감소`);
  st('skillIngotSellInfo', il ===0?'기본':  `Lv${il}  — 주괴 +${SKILLS.INGOT_SELL.bonusPct[il]}%`);
  st('skillGemSellInfo',   gl ===0?'기본':  `Lv${gl}  — 보석 +${SKILLS.GEM_SELL.bonusPct[gl]}%`);
  st('skillPreciousInfo',  pl ===0?'기본':  `Lv${pl}  — 귀중품 +${SKILLS.PRECIOUS.bonusPct[pl]}%`);
  st('skillCobbyInfo',     cl ===0?'기본':  `Lv${cl}  — 코비 +${SKILLS.COBYTIME.dropPct[cl]}%`);
  const sp=SKILLS.SPARKLE.drops[sl];
  st('skillSparkleInfo',   sl ===0?'기본':  sp?`Lv${sl} — ${sp.pct}% / ${sp.count}개`:'');
  const lk=SKILLS.LUCKY_HIT.drops[ll];
  st('skillLuckyInfo',     ll ===0?'기본':  lk?`Lv${ll} — ${lk.pct}% / +${lk.count}개`:'');
  st('skillFirePickInfo',  fpl===0?'기본':  `Lv${fpl} — ${SKILLS.FIRE_PICK.dropPct[fpl]}% 주괴 드롭`);
  cs(); ct(); co();
}
export function onEngravingChange(){
  const st=(id,txt)=>{const e=document.getElementById(id);if(e)e.textContent=txt;};
  const {ol,rl,cl,gc,ca,ro}=getENG();
  st('engOreLuckInfo',  ol===0?'없음':`Lv${ol} — ${ENGRAVING.ORE_LUCK.extraOrePct[ol]}% / +1개`);
  st('engRelicInfo',    rl===0?'없음':`Lv${rl} — 유물 +${ENGRAVING.RELIC_SEARCH.extraArtifactPct[rl]}%`);
  st('engCobbyInfo',    cl===0?'없음':`Lv${cl} — 코비 +${ENGRAVING.COBBY_SUMMON.extraCobbyPct[cl]}%`);
  st('engGemCobbyInfo', gc===0?'없음':`Lv${gc} — 보석코비 ${ENGRAVING.GEM_COBBY.gemConvertPct[gc]}%`);
  st('engCartInfo',     ca===0?'없음':`Lv${ca} — ${ENGRAVING.MINE_CART.cartPct[ca]}% 광산수레`);
  st('engRouletteInfo', ro===0?'없음':`Lv${ro} — ${ENGRAVING.MINER_ROULETTE.dicePct[ro]}% 주사위`);
  cs();
}

/* ════════════════════════════════════════
   핵심 채굴 계산 함수
   returns: 기댓값 기반 원시 수치들
════════════════════════════════════════ */
function calcMining() {
  const sk=getSK(), eng=getENG();
  const enh=gi('pickaxeLevel'), stamina=gi('totalStamina'), oreType=gv('oreType')||'even';
  const px=PICKAXE[enh]??PICKAXE[0];
  const miningCount=stamina>0?Math.floor(stamina/MINING.STAMINA_PER_USE):0;

  // 광석 기댓값/회
  const luckyExtra   =(sk.lp/100)*sk.lc;
  const oreLuckExtra = eng.op/100;
  const avgDice=3.5;
  const rouletteExtra=(eng.dp/100)*(0.9*avgDice*ENGRAVING.MINER_ROULETTE.normalMult+0.1*avgDice*ENGRAVING.MINER_ROULETTE.goldenMult);
  const oresPerUse   = px.oresPerUse + luckyExtra + oreLuckExtra + rouletteExtra;
  const totalOres    = miningCount * oresPerUse;

  // 배분
  let oreC=0,oreR=0,oreS=0;
  if     (oreType==='corum')  oreC=totalOres;
  else if(oreType==='rifton') oreR=totalOres;
  else if(oreType==='serent') oreS=totalOres;
  else{ oreC=totalOres/3; oreR=totalOres/3; oreS=totalOres-oreC-oreR; }

  // 주괴 변환
  const ingotFromOreC=oreC/INGOT_RECIPES.CORUM.ores_per_ingot;
  const ingotFromOreR=oreR/INGOT_RECIPES.RIFTON.ores_per_ingot;
  const ingotFromOreS=oreS/INGOT_RECIPES.SERENT.ores_per_ingot;

  // 횃불
  const totalTorch=ingotFromOreC*INGOT_RECIPES.CORUM.torch_per_ingot
                  +ingotFromOreR*INGOT_RECIPES.RIFTON.torch_per_ingot
                  +ingotFromOreS*INGOT_RECIPES.SERENT.torch_per_ingot;

  // 불붙은 곡괭이
  const fpDrops=miningCount*(sk.fp/100);
  let fpC=0,fpR=0,fpS=0;
  if     (oreType==='corum')  fpC=fpDrops;
  else if(oreType==='rifton') fpR=fpDrops;
  else if(oreType==='serent') fpS=fpDrops;
  else{ fpC=fpDrops/3; fpR=fpDrops/3; fpS=fpDrops-fpC-fpR; }

  const totalIngotC=ingotFromOreC+fpC;
  const totalIngotR=ingotFromOreR+fpR;
  const totalIngotS=ingotFromOreS+fpS;

  // 보석
  const totalCobbyPct=px.cobbyPct+sk.ca+eng.cp;
  const cobbyCount   =miningCount*(totalCobbyPct/100);
  const gemCobby     =cobbyCount*(eng.gp/100);
  const normalCobby  =cobbyCount-gemCobby;
  let gemUnit=0;
  if     (oreType==='corum')  gemUnit=DEFAULT_PRICES.gem.corum;
  else if(oreType==='rifton') gemUnit=DEFAULT_PRICES.gem.rifton;
  else if(oreType==='serent') gemUnit=DEFAULT_PRICES.gem.serent;
  else gemUnit=(DEFAULT_PRICES.gem.corum+DEFAULT_PRICES.gem.rifton+DEFAULT_PRICES.gem.serent)/3;
  const sparkleGems=miningCount*(sk.sp/100)*sk.sc;
  const totalGems   =sparkleGems+gemCobby;

  // 유물
  const totalArtPct=px.artifactPct+eng.ap;
  const artDrops   =miningCount*(totalArtPct/100);
  const cartDrops  =miningCount*(eng.kp/100);
  const totalArtifacts=artDrops+cartDrops*2;
  const totalArtPts=totalArtifacts*ARTIFACT.avgPoints;

  return {
    miningCount, oreType, px, enh,
    totalOres, oreC, oreR, oreS,
    ingotFromOreC, ingotFromOreR, ingotFromOreS,
    totalTorch,
    fpDrops, fpC, fpR, fpS,
    totalIngotC, totalIngotR, totalIngotS,
    totalIngotAll: totalIngotC+totalIngotR+totalIngotS,
    cobbyCount, gemCobby, normalCobby, totalGems, sparkleGems, totalCobbyPct, gemUnit,
    artDrops, cartDrops, totalArtifacts, totalArtPts,
    oresPerUse, sk, eng,
  };
}

/* ════════════════════════════════════════
   80% 확률 보정 계수 계산
   이항분포에서 P(X >= k) = 0.80 이 되는 k 를
   역산하면 k ≈ n*p - z_{0.80} * sqrt(n*p*(1-p))
   z_{0.80} = 0.842 (표준정규 80번째 백분위 역수)
   (성공횟수가 충분히 클 때 정규근사)
   단, 확률이 1이거나 n=0이면 보정 없음.
════════════════════════════════════════ */
const Z80 = 0.842; // P(Z < 0.842) ≈ 0.80

function floor80(n, p) {
  // n: 시행횟수(실수 가능), p: 성공확률(0~1)
  if (p <= 0 || n <= 0) return 0;
  if (p >= 1) return n;
  const mu  = n * p;
  const sig = Math.sqrt(n * p * (1 - p));
  const val = mu - Z80 * sig;
  return Math.max(0, val);
}

/* ─── 광석/주괴 80% 보정 ─── */
function calc80Ingots(m) {
  // 기본 광석/회는 고정이므로, 확률 요소만 보정
  // 확률 요소: 럭키히트, 광물행운, 광부룰렛, 불붙은 곡괭이, 보석 드랍, 코비, 유물
  const sk=m.sk, eng=m.eng, n=m.miningCount;

  // 럭키히트: n*p 기댓값 → 80% floor
  const luckyOre80  = floor80(n, sk.lp/100) * sk.lc;
  const oreLuck80   = floor80(n, eng.op/100) * 1;

  // 광부룰렛: 등장 수 80% floor × 평균 눈수 보정
  const diceCount80 = floor80(n, eng.dp/100);
  const avgNormal   = 3.5 * ENGRAVING.MINER_ROULETTE.normalMult;
  const avgGolden   = 3.5 * ENGRAVING.MINER_ROULETTE.goldenMult;
  // 황금주사위도 80% floor
  const golden80    = floor80(diceCount80, ENGRAVING.MINER_ROULETTE.goldenPct/100);
  const normal80    = diceCount80 - golden80;
  const rouletteOre80 = normal80 * avgNormal + golden80 * avgGolden;

  const oresPerUse80 = m.px.oresPerUse + luckyOre80/n + oreLuck80/n + (n>0?rouletteOre80/n:0);
  const totalOres80  = n * m.px.oresPerUse + luckyOre80 + oreLuck80 + rouletteOre80;

  const {oreType}=m;
  let oreC80=0,oreR80=0,oreS80=0;
  if     (oreType==='corum')  oreC80=totalOres80;
  else if(oreType==='rifton') oreR80=totalOres80;
  else if(oreType==='serent') oreS80=totalOres80;
  else{ oreC80=totalOres80/3; oreR80=totalOres80/3; oreS80=totalOres80-oreC80-oreR80; }

  const iC80=oreC80/INGOT_RECIPES.CORUM.ores_per_ingot;
  const iR80=oreR80/INGOT_RECIPES.RIFTON.ores_per_ingot;
  const iS80=oreS80/INGOT_RECIPES.SERENT.ores_per_ingot;

  // 불붙은 곡괭이 80%
  const fp80=floor80(n, sk.fp/100);
  let fpC80=0,fpR80=0,fpS80=0;
  if     (oreType==='corum')  fpC80=fp80;
  else if(oreType==='rifton') fpR80=fp80;
  else if(oreType==='serent') fpS80=fp80;
  else{ fpC80=fp80/3; fpR80=fp80/3; fpS80=fp80-fpC80-fpR80; }

  const tC80=iC80+fpC80, tR80=iR80+fpR80, tS80=iS80+fpS80;

  // 보석 (반짝임의 시작 80%)
  const sparkle80    = floor80(n, sk.sp/100) * sk.sc;
  // 코비 80%, 그 중 보석코비 80%
  const totalCobbyPct80 = m.totalCobbyPct;
  const cobby80      = floor80(n, totalCobbyPct80/100);
  const gemCobby80   = floor80(cobby80, eng.gp/100);
  const normalCobby80= cobby80 - gemCobby80;
  const totalGems80  = sparkle80 + gemCobby80;

  // 유물 80%
  const art80   = floor80(n, m.artDrops/n||0);
  const cart80  = floor80(n, eng.kp/100);
  const totalArt80 = art80 + cart80*2;
  const artPts80   = totalArt80 * ARTIFACT.avgPoints;

  return {tC80,tR80,tS80, totalGems80,sparkle80,gemCobby80,normalCobby80,cobby80,
          artPts80,totalArt80,totalOres80,iC80,iR80,iS80,fp80,oresPerUse80};
}

/* ════════════════════════════════════════
   TAB 0: 채굴 수익
════════════════════════════════════════ */

// 광물 색상 매핑
const ORE_COLOR = {
  cobblestone:           '#8a7060', // 조약돌 — 갈회색
  deepslate_cobblestone: '#5a5570', // 심층암 — 보라회색
  copper:                '#c87941', // 구리 — 구리색
  iron:                  '#a8a8a8', // 철 — 은회색
  gold:                  '#d4a020', // 금 — 황금
  diamond:               '#38c8d0', // 다이아 — 시안
  redstone:              '#d94f3d', // 레드스톤 — 빨강
  lapis:                 '#3d6fd4', // 청금석 — 파랑
  amethyst:              '#9b6dd4', // 자수정 — 보라
};

function matChip(matName, qty, color) {
  return `<span class="mat-chip" style="background:${color}18;color:${color};border-color:${color}55">${matName} ${qty}</span>`;
}

export function cs() {
  const m   = calcMining();
  const p80 = calc80Ingots(m);
  const sk  = m.sk, eng = m.eng;

  const rawIC = gi('ingotPriceC') || DEFAULT_PRICES.ingot.corum;
  const rawIR = gi('ingotPriceR') || DEFAULT_PRICES.ingot.rifton;
  const rawIS = gi('ingotPriceS') || DEFAULT_PRICES.ingot.serent;
  const rawGC = gi('gemPriceC')   || DEFAULT_PRICES.gem.corum;
  const rawGR = gi('gemPriceR')   || DEFAULT_PRICES.gem.rifton;
  const rawGS = gi('gemPriceS')   || DEFAULT_PRICES.gem.serent;
  const spPrice    = gi('skillPulsePrice');
  const artPtPrice = gi('artifactPtPrice') / 100; // 입력: 원/100pt → 계산: 원/pt

  const bC = rawIC*(1+sk.ib), bR = rawIR*(1+sk.ib), bS = rawIS*(1+sk.ib);

  let gemUnitC = rawGC*(1+sk.gb);
  let gemUnitR = rawGR*(1+sk.gb);
  let gemUnitS = rawGS*(1+sk.gb);
  let gemUnit  = 0;
  const ot = m.oreType;
  if(ot==='corum')  gemUnit = gemUnitC;
  else if(ot==='rifton') gemUnit = gemUnitR;
  else if(ot==='serent') gemUnit = gemUnitS;
  else gemUnit = (gemUnitC+gemUnitR+gemUnitS)/3;

  // 기댓값 수익
  const ingotRev = m.totalIngotC*bC + m.totalIngotR*bR + m.totalIngotS*bS;
  const gemRev   = m.totalGems * gemUnit;
  const spRev    = m.normalCobby * spPrice;
  const artRev   = artPtPrice>0 ? m.totalArtPts*artPtPrice : 0;
  const totalRev = ingotRev + gemRev + spRev + artRev;

  // 80% 수익
  const ingotRev80 = p80.tC80*bC + p80.tR80*bR + p80.tS80*bS;
  const gemRev80   = p80.totalGems80 * gemUnit;
  const spRev80    = p80.normalCobby80 * spPrice;
  const artRev80   = artPtPrice>0 ? p80.artPts80*artPtPrice : 0;
  const totalRev80 = ingotRev80 + gemRev80 + spRev80 + artRev80;
  const total80IngotAll = p80.tC80+p80.tR80+p80.tS80;

  // 광석 종류별 색상
  const CC = '#e07b2a'; // 코룸 — 주황
  const CR = '#3a9e68'; // 리프톤 — 초록
  const CS = '#d94f3d'; // 세렌트 — 붉은

  const cRow = (label, oreAmt, ingotAmt, color, torchAmt) => {
    if(oreAmt <= 0.01) return '';
    const torchStr = torchAmt > 0.01 ? ` <span style="color:var(--blue);font-size:10px">(횃불 ${f(torchAmt)}개)</span>` : '';
    return `<div class="rrow">
      <span class="rl" style="color:${color};font-weight:700">${label}</span>
      <span class="rv">${f(oreAmt)}개 → 주괴 <b style="color:${color}">${f(ingotAmt)}개</b>${torchStr}</span>
    </div>`;
  };

  const torchC = m.ingotFromOreC * INGOT_RECIPES.CORUM.torch_per_ingot;
  const torchR = m.ingotFromOreR * INGOT_RECIPES.RIFTON.torch_per_ingot;
  const torchS = m.ingotFromOreS * INGOT_RECIPES.SERENT.torch_per_ingot;

  // 최종 주괴 요약 (0인 종류 제외)
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

  const iBdg = sk.ib>0 ? bdg('bg',`주괴 좀 사 주괴 +${Math.round(sk.ib*100)}%`) : '';
  const gBdg = sk.gb>0 ? bdg('bg',`눈이 부셔 +${Math.round(sk.gb*100)}%`) : '';

  let html = `
  <div class="rsec">
    ${row('곡괭이',`${m.enh}강 — 기본 ${m.px.oresPerUse}개/회 · 유물 ${m.px.artifactPct}% · 코비 ${m.px.cobbyPct}%`)}
    ${row('채굴 횟수',`${f(m.miningCount)}회`)}
    ${m.oresPerUse !== m.px.oresPerUse ? row('회당 평균 광석 (보정 후)',`${fd(m.oresPerUse)}개`,'g') : row('회당 광석',`${m.px.oresPerUse}개`,'g')}
    ${row('총 획득 광석',`${f(m.totalOres)}개`,'g')}
  </div>

  <div class="rsec">
    <div class="rsec-title">⛏ 광석 → 주괴 변환</div>
    ${cRow('🟠 코룸', m.oreC, m.ingotFromOreC, CC, torchC)}
    ${cRow('🟢 리프톤', m.oreR, m.ingotFromOreR, CR, torchR)}
    ${cRow('🔴 세렌트', m.oreS, m.ingotFromOreS, CS, torchS)}
    ${m.totalTorch > 0.01 ? `<div class="rrow"><span class="rl" style="color:var(--blue)">🔥 필요 강화횃불 합계</span><span class="rv b">${f(m.totalTorch)}개</span></div>` : ''}
    ${m.fpDrops > 0.01 ? `<div class="rrow"><span class="rl">불붙은 곡괭이 ${bdg('bg','Lv'+sk.fpl)}</span><span class="rv">+${fd(m.fpDrops)}개 주괴</span></div>` : ''}
    <div class="rrow rrow-strong">
      <span class="rl" style="color:var(--text)">최종 총 주괴 (기댓값)</span>
      <span class="rv p">${f(m.totalIngotAll)}개 &nbsp;<small>${ingotParts}</small></span>
    </div>
  </div>`;

  if(m.totalGems > 0 || m.cobbyCount > 0) {
    html += `
  <div class="rsec">
    <div class="rsec-title">💎 보석 & 코비</div>
    ${m.sparkleGems > 0 ? row(`반짝임의 시작 ${bdg('bg','Lv'+sk.sl)}`,`${fd(m.sparkleGems)}개`) : ''}
    ${m.cobbyCount > 0 ? row(`코비 소환 (${fd(m.totalCobbyPct)}%)`,`${fd(m.cobbyCount)}회`) : ''}
    ${m.gemCobby > 0 ? row(`└ 보석코비 ${bdg('bpu',eng.gp+'%')}`,`${fd(m.gemCobby)}개`) : ''}
    ${m.normalCobby > 0 ? row('└ 일반코비 (스킬펄스)',`${fd(m.normalCobby)}개`) : ''}
    ${m.totalGems > 0 ? `<div class="rrow rrow-strong"><span class="rl">총 보석 (기댓값)</span><span class="rv p">${fd(m.totalGems)}개</span></div>` : ''}
    ${m.normalCobby > 0 ? `<div class="rrow rrow-strong"><span class="rl">스킬펄스 (기댓값)</span><span class="rv p">${fd(m.normalCobby)}개</span></div>` : ''}
  </div>`;
  }

  if(m.totalArtifacts > 0) {
    html += `
  <div class="rsec">
    <div class="rsec-title">🗿 유물</div>
    ${row(`유물 드랍 (${fd(m.px.artifactPct + m.eng.ap)}%)`,`${fd(m.artDrops)}개`)}
    ${m.cartDrops > 0 ? row(`광산수레 ${bdg('bb','Lv'+eng.ca)}`,`${fd(m.cartDrops)}회 → ${fd(m.cartDrops*2)}개`) : ''}
    <div class="rrow rrow-strong"><span class="rl">총 유물 포인트 (기댓값)</span><span class="rv b">${f(m.totalArtPts)}pt</span></div>
  </div>`;
  }

  html += `
  <div class="rsec">
    <div class="rsec-title">💰 기댓값 수익 (전량 판매)</div>
    ${row(`주괴 수익 ${iBdg}`,`${f(ingotRev)}원`,'g')}
    ${m.totalGems > 0 ? row(`보석 수익 ${gBdg}`,`${f(gemRev)}원`,'g') : ''}
    ${m.normalCobby > 0 ? (spPrice>0 ? row('스킬펄스 수익',`${f(spRev)}원`,'g') : row('스킬펄스','단가 미입력','muted')) : ''}
    ${m.totalArtifacts > 0 ? (artPtPrice>0 ? row('유물 수익',`${f(artRev)}원`,'g') : row('유물 포인트','단가 미입력','muted')) : ''}
  </div>

  <div class="result-box">
    <div class="result-box-row">
      <div>
        <div class="rb-label">기댓값 수익</div>
        <div class="rb-value">${f(totalRev)}원</div>
        <div class="rb-sub" style="margin-top:4px">주괴 ${f(m.totalIngotAll)}개</div>
      </div>
      <div>
        <div class="rb-label">🎯 80% 확률로 최소</div>
        <div class="rb-value rb-floor">${f(totalRev80)}원</div>
        <div class="rb-sub" style="margin-top:4px">${ingot80Parts}${p80.totalGems80>0 ? ` · 보석 ${fd(p80.totalGems80)}개` : ''}${p80.normalCobby80>0 ? ` · 펄스 ${fd(p80.normalCobby80)}개` : ''}</div>
      </div>
    </div>
  </div>`;

  document.getElementById('sRes').innerHTML = html;
}

/* ════════════════════════════════════════
   TAB 1: 강화횃불
════════════════════════════════════════ */
export function ct() {
  const sk=getSK();
  const timePerTorch=TORCH.craft_time_sec*(1-sk.fr);
  const charU=gi('tCharcoalPrice')/SET_SIZE, stickU=gi('tStickPrice')/SET_SIZE;
  const costEa=charU+stickU, wantN=gi('tWantCount'), sellEa=gi('tSellPrice');
  const totalCost=costEa*wantN, totalTime=timePerTorch*wantN;
  const hasPrice=sellEa>0, totalRev=hasPrice?sellEa*wantN:0, net=totalRev-totalCost;
  const fBdg=sk.fr>0?bdg('bg',`용광로 Lv${sk.fl} -${Math.round(sk.fr*100)}%`):'';

  document.getElementById('tRes').innerHTML=`
  <div class="rsec">
    ${row('숯/석탄 개당',`${charU.toFixed(1)}원`)}
    ${row('막대기 개당',`${stickU.toFixed(1)}원`)}
    ${row('횃불 1개 재료비',`${costEa.toFixed(1)}원`,'r')}
  </div>
  <div class="rsec">
    ${row('필요 숯/석탄',fmtQty(wantN),'g')}
    ${row('필요 막대기',fmtQty(wantN),'g')}
    ${row('총 재료비',`${f(totalCost)}원`,'r')}
  </div>
  <div class="rsec">
    ${row(`1개당 제작 시간 ${fBdg}`,fmtTime(timePerTorch),'b')}
    ${row('총 제작 시간',fmtTime(totalTime),'b')}
  </div>
  <div class="result-box">
    <div class="rb-label">${hasPrice?'순이익':'총 재료비'}</div>
    <div class="rb-value" style="color:${hasPrice?(net>=0?'var(--green)':'var(--red)'):'var(--red)'}">${f(hasPrice?net:totalCost)}원</div>
  </div>`;
}

/* ════════════════════════════════════════
   TAB 2: 주괴 & 귀중품 통합 최적화
════════════════════════════════════════ */

// 수량을 "X상자 Y세트 Z개" 또는 "X묶음" 형태로 포맷
// bundleSize: 묶음 단위가 SET_SIZE(64)와 다를 때 사용
function fmtQtyLabel(n, unit='개') {
  n = Math.ceil(n); // 올림 (재료는 부족하면 안 됨)
  if(n <= 0) return `0${unit}`;
  const boxes = Math.floor(n / BOX_SIZE);
  const rem   = n % BOX_SIZE;
  const sets  = Math.floor(rem / SET_SIZE);
  const items = rem % SET_SIZE;
  const parts = [];
  if(boxes > 0) parts.push(boxes + '상자');
  if(sets  > 0) parts.push(sets  + '세트');
  if(items > 0) parts.push(items + unit);
  return parts.join(' ') || `0${unit}`;
}

// 재료 chip — 색상 + 수량 표시
const MAT_META = {
  cobblestone:           {name:'조약돌 묶음',    color:'#8a7060', unit:'묶음', perUnit:64},
  deepslate_cobblestone: {name:'심층암 조약돌 묶음', color:'#5a5570', unit:'묶음', perUnit:64},
  copper:                {name:'구리 블럭',      color:'#c87941', unit:'개',   perUnit:1},
  iron:                  {name:'철 블럭',        color:'#a0a0a0', unit:'개',   perUnit:1},
  gold:                  {name:'금 블럭',        color:'#d4a020', unit:'개',   perUnit:1},
  diamond:               {name:'다이아 블럭',    color:'#38c8d0', unit:'개',   perUnit:1},
  redstone:              {name:'레드스톤 블럭',  color:'#d94f3d', unit:'개',   perUnit:1},
  lapis:                 {name:'청금석 블럭',    color:'#3d6fd4', unit:'개',   perUnit:1},
  amethyst:              {name:'자수정 블럭',    color:'#9b6dd4', unit:'개',   perUnit:1},
  topaz:                 {name:'토파즈 블럭',    color:'#d4a020', unit:'개',   perUnit:1},
  sapphire:              {name:'사파이어 블럭',  color:'#3d6fd4', unit:'개',   perUnit:1},
  platinum:              {name:'플레티넘 블럭',  color:'#9ab0c8', unit:'개',   perUnit:1},
  stalactite:            {name:'뾰족한 점적석',  color:'#a0c8a0', unit:'개',   perUnit:1},
  tuff:                  {name:'응회암',         color:'#8a9a7a', unit:'개',   perUnit:1},
  glow_lichen:           {name:'발광이끼',       color:'#70c8a0', unit:'개',   perUnit:1},
};

function matChipQty(matKey, totalQty) {
  const m = MAT_META[matKey] || {name:matKey, color:'#888', unit:'개', perUnit:1};
  // 묶음 단위면 묶음 수로 변환해서 표시
  let displayStr;
  if(m.unit === '묶음') {
    const bundles = Math.ceil(totalQty / m.perUnit);
    displayStr = fmtQtyLabel(bundles, '묶음');
  } else {
    displayStr = fmtQtyLabel(totalQty, m.unit);
  }
  return `<span class="mat-chip" style="background:${m.color}18;color:${m.color};border-color:${m.color}55">${m.name} ${displayStr}</span>`;
}

export function co() {
  const {ib,fr,pb}=getSK();

  const iCo=gi('iCo'),iRi=gi('iRi'),iSe=gi('iSe');
  const cP=(gi('oCo')||DEFAULT_PRICES.ingot.corum)*(1+ib);
  const rP=(gi('oRi')||DEFAULT_PRICES.ingot.rifton)*(1+ib);
  const sP=(gi('oSe')||DEFAULT_PRICES.ingot.serent)*(1+ib);

  const oL1=gi('oL1'),oL2=gi('oL2'),oL3=gi('oL3'),oAb=gi('oAb');
  const ctL1=(gi('ctL1')||RECIPES.LS1.craft_time_sec)*(1-fr);
  const ctL2=(gi('ctL2')||RECIPES.LS2.craft_time_sec)*(1-fr);
  const ctL3=(gi('ctL3')||RECIPES.LS3.craft_time_sec)*(1-fr);
  const ctAb=(gi('ctAb')||RECIPES.ABIL.craft_time_sec)*(1-fr);

  // 바닐라 원가 (개당)
  // 조약돌/심층암: 묶음 단위 입력(=64개 가격), 나머지는 세트(=64개 가격)
  // 어차피 둘 다 64개당 가격이므로 동일하게 /SET_SIZE
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
  const vc = type => Object.entries(RECIPES[type].vanilla||{}).reduce((s,[m,q])=>s+q*(vp[m]||0),0);

  // 귀중품 재료가 (개당)
  const pvp = {
    topaz:       gi('vTopaz'),
    sapphire:    gi('vSapphire'),
    platinum:    gi('vPlatinum'),
    redstone:    gi('vRe') / SET_SIZE,
    lapis:       gi('vLa') / SET_SIZE,
    gold:        gi('vGo') / SET_SIZE,
    stalactite:  gi('vStalactite'),
    tuff:        gi('vTuff'),
    glow_lichen: gi('vGlowLichen'),
  };

  const AP  = PRECIOUS.APPRAISAL;
  const DOC = PRECIOUS.DOC_PRICE;

  // 귀중품별 기댓값
  const precItems = Object.entries(PRECIOUS.ITEMS).map(([key,item])=>{
    const rec = RECIPES[item.recipe];
    const iPrice = item.ingotType==='corum'?cP : item.ingotType==='rifton'?rP : sP;
    const ingotCnt = rec.ingot_corum||rec.ingot_rifton||rec.ingot_serent||0;
    const ingotCost = ingotCnt * iPrice;
    const vanCost = Object.entries(rec.vanilla||{}).reduce((s,[m,q])=>s+q*(pvp[m]||0),0)+(rec.doc||0)*DOC;
    const totalCost = ingotCost + vanCost;
    const avgSell = (item.prices.LOW*AP.LOW.pct/100+item.prices.GOOD*AP.GOOD.pct/100+item.prices.ROYAL*AP.ROYAL.pct/100)*(1+pb);
    const netPerItem = avgSell - totalCost;
    const ingotKey = item.ingotType==='corum'?'C':item.ingotType==='rifton'?'R':'S';
    return {key,item,rec,ingotCnt,ingotKey,totalCost,avgSell,netPerItem,ingotCost,vanCost};
  });

  // 개당 순이익
  const rawSell = iCo*cP + iRi*rP + iSe*sP;
  const netLS1  = oL1 - RECIPES.LS1.ingot_corum  * cP - vc('LS1');
  const netLS2  = oL2 - RECIPES.LS2.ingot_rifton * rP - vc('LS2');
  const netLS3  = oL3 - RECIPES.LS3.ingot_serent * sP - vc('LS3');
  const netAbil = oAb - (cP + rP + sP);

  // 전체 옵션 합산
  const allOptions = [
    {key:'LS1',  label:'하급 라이프스톤', net:netLS1,  sell:oL1, iC:1, iR:0, iS:0, ct:ctL1, type:'ls'},
    {key:'LS2',  label:'중급 라이프스톤', net:netLS2,  sell:oL2, iC:0, iR:2, iS:0, ct:ctL2, type:'ls'},
    {key:'LS3',  label:'상급 라이프스톤', net:netLS3,  sell:oL3, iC:0, iR:0, iS:3, ct:ctL3, type:'ls'},
    {key:'ABIL', label:'어빌리티 스톤',   net:netAbil, sell:oAb, iC:1, iR:1, iS:1, ct:ctAb, type:'ls'},
    ...precItems.filter(p=>p.netPerItem>0).map(p=>({
      key:p.key, label:p.item.name, net:p.netPerItem, sell:p.avgSell,
      iC:p.ingotKey==='C'?p.ingotCnt:0,
      iR:p.ingotKey==='R'?p.ingotCnt:0,
      iS:p.ingotKey==='S'?p.ingotCnt:0,
      ct:0, type:'precious', extra:p,
    })),
  ].filter(c=>c.net>0&&c.sell>0).sort((a,b)=>b.net-a.net);

  let remCo=iCo, remRi=iRi, remSe=iSe;
  const craftResult=[];
  for(const c of allOptions){
    const maxN=Math.min(
      c.iC>0?Math.floor(remCo/c.iC):Infinity,
      c.iR>0?Math.floor(remRi/c.iR):Infinity,
      c.iS>0?Math.floor(remSe/c.iS):Infinity,
    );
    if(maxN<=0) continue;
    craftResult.push({...c, count:maxN});
    remCo-=c.iC*maxN; remRi-=c.iR*maxN; remSe-=c.iS*maxN;
  }

  const remSell = remCo*cP + remRi*rP + remSe*sP;
  let craftRev=remSell, craftTime=0;

  const craftLines=[];
  for(const c of craftResult){
    const rev = c.count * (c.type==='precious' ? c.extra.avgSell : c.sell);
    const t   = c.count * c.ct;
    craftRev += rev; craftTime += t;

    // 재료 수량 계산 (올림 적용 — 부족하면 안 됨)
    let matChips = '';
    if(c.type === 'ls') {
      const chips = Object.entries(RECIPES[c.key].vanilla||{})
        .filter(([,q])=>q>0)
        .map(([m,q]) => matChipQty(m, q * c.count));
      matChips = chips.join('');
    } else {
      const rec = c.extra.rec;
      const chips = Object.entries(rec.vanilla||{})
        .filter(([,q])=>q>0)
        .map(([m,q]) => matChipQty(m, q * c.count));
      if(rec.doc) chips.push(`<span class="mat-chip" style="background:#ff980018;color:#e07b2a;border-color:#e07b2a55">증서 ${c.count}개 (${f(DOC*c.count)}원 고정)</span>`);
      matChips = chips.join('');
    }

    const precBadge = c.type==='precious' ? bdg('bpu','귀중품') : '';
    const countLabel = fmtQtyLabel(c.count, '개');

    craftLines.push(`
      <div class="craft-item">
        <div class="rrow">
          <span class="rl">${precBadge} ${c.label}</span>
          <span class="rv">${countLabel} → <b class="g">${f(rev)}원</b></span>
        </div>
        ${c.type==='precious' ? `<div class="appr-row">
          <span>낮은품질 ${f(c.extra.item.prices.LOW*(1+pb))}원</span>
          <span>우수 ${f(c.extra.item.prices.GOOD*(1+pb))}원</span>
          <span>황실 ${f(c.extra.item.prices.ROYAL*(1+pb))}원</span>
          <span class="g">기댓값 ${f(c.extra.avgSell)}원</span>
        </div>` : ''}
        ${matChips ? `<div class="mat-row">${matChips}</div>` : ''}
        ${t>0 ? `<div class="craft-time">⏱ ${fmtTime(t)}</div>` : ''}
      </div>`);
  }

  const isRaw = rawSell >= craftRev;
  const iBdg  = ib>0 ? bdg('bg',`주괴 좀 사 주괴 +${Math.round(ib*100)}%`) : '';
  const fBdg  = fr>0 ? bdg('bg',`용광로 -${Math.round(fr*100)}%`) : '';
  const pBdg  = pb>0 ? bdg('bpu',`귀하신 몸값 +${Math.round(pb*100)}%`) : '';

  const CC='#e07b2a', CR='#3a9e68', CS='#d94f3d';

  document.getElementById('oRes').innerHTML=`
  <div class="rsec">
    <div class="rrow">
      <span class="rl">보유 주괴</span>
      <span class="rv">
        ${iCo>0?`<span style="color:${CC}">코룸 ${f(iCo)}개</span> `:''}
        ${iRi>0?`<span style="color:${CR}">리프톤 ${f(iRi)}개</span> `:''}
        ${iSe>0?`<span style="color:${CS}">세렌트 ${f(iSe)}개</span>`:''}
      </span>
    </div>
    ${row(`전량 직판 수익 ${iBdg}`,`${f(rawSell)}원`)}
  </div>
  <div class="rsec">
    <div class="rsec-title">📊 개당 순이익</div>
    ${oL1>0?row('하급 라스',`${f(netLS1)}원`,netLS1>=0?'g':'r'):''}
    ${oL2>0?row('중급 라스',`${f(netLS2)}원`,netLS2>=0?'g':'r'):''}
    ${oL3>0?row('상급 라스',`${f(netLS3)}원`,netLS3>=0?'g':'r'):''}
    ${oAb>0?row('어빌리티 스톤',`${f(netAbil)}원`,netAbil>=0?'g':'r'):''}
    ${precItems.map(p=>row(`${p.item.name} ${pBdg}`,`${f(p.netPerItem)}원`,p.netPerItem>=0?'g':'r')).join('')}
  </div>
  <div class="rsec">
    <div class="rrow" style="justify-content:center;padding:4px 0">
      ${isRaw
        ?'<span class="bdg br" style="font-size:12px;padding:4px 14px">💰 주괴 직판 권장</span>'
        :'<span class="bdg bg" style="font-size:12px;padding:4px 14px">🔨 제작 후 판매 권장</span>'}
    </div>
  </div>
  ${!isRaw && craftLines.length ? `
  <div class="rsec">
    <div class="rsec-title">🔨 최적 제작 계획 ${fBdg}</div>
    ${craftLines.join('')}
    ${remCo+remRi+remSe > 0 ? `
    <div class="rrow" style="margin-top:6px">
      <span class="rl">남은 주괴 직판</span>
      <span class="rv">
        ${remCo>0?`<span style="color:${CC}">코룸 ${f(remCo)}개</span> `:''}
        ${remRi>0?`<span style="color:${CR}">리프톤 ${f(remRi)}개</span> `:''}
        ${remSe>0?`<span style="color:${CS}">세렌트 ${f(remSe)}개</span> `:''}
        → ${f(remSell)}원
      </span>
    </div>` : ''}
    ${craftTime>0 ? row('총 제작 시간',fmtTime(craftTime),'b') : ''}
  </div>` : ''}
  <div class="result-box">
    <div class="rb-label">최종 예상 수익</div>
    <div class="rb-value">${f(isRaw?rawSell:craftRev)}원</div>
  </div>`;
}

/* ─── 초기화 ─── */
export function init(){ onSkillChange(); onEngravingChange(); }