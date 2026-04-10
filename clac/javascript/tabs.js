/* ════════════════════════════════════════
   tabs.js — 탭별 계산 함수
════════════════════════════════════════ */

import { MINING, INGOT_RECIPES, RECIPES } from './config.js';
import { f, fmtQty, fmtTime, gi } from './utils.js';
import {
  getSkillMultipliers,
  applyIngotBonus,
  applyFurnaceReduction,
  vanillaCost,
  vPrices,
} from './skills.js';
import { UNITS } from './config.js';

const { SET_SIZE } = UNITS;

/* ── TAB 0: 스테미나 ── */
export function cs() {
  const { ingotBonus } = getSkillMultipliers();

  const maxS   = gi('maxS');
  const cur    = Math.min(gi('curS'), maxS || Infinity);
  const cost   = gi('sCost') || MINING.STAMINA_COST;
  const oreR   = gi('oreR')  || MINING.ORES_PER_USE;
  const oPI    = gi('oPI')   || INGOT_RECIPES.ORES_PER_INGOT;
  const tPI    = gi('tPI');
  const tCnt   = gi('tCnt');
  const ingotP = gi('ingotP');

  const ingotPBoosted = applyIngotBonus(ingotP, ingotBonus);
  const uses          = Math.floor(cur / cost);
  const ores          = uses * oreR;
  const iByOre        = Math.floor(ores / oPI);
  const iByTorch      = tCnt > 0 ? Math.floor(tCnt / tPI) : 999999;
  const ingots        = Math.min(iByOre, iByTorch);
  const earn          = ingotP > 0 ? ingots * ingotPBoosted : null;
  const pct           = maxS > 0 ? Math.round(cur / maxS * 100) : 0;
  const limitFactor   = iByOre <= iByTorch ? '광석 부족' : '강화횃불 부족';

  document.getElementById('s_cur').textContent  = f(cur);
  document.getElementById('s_ore').textContent  = f(ores);
  document.getElementById('s_ing').textContent  = f(ingots);
  document.getElementById('s_earn').textContent =
    earn !== null
      ? f(earn) + '원' + (ingotBonus > 0 ? ` (+${Math.round(ingotBonus * 100)}%)` : '')
      : '가격 입력 필요';
  document.getElementById('sbar').style.width = pct + '%';
  document.getElementById('spct').textContent = pct + '%';

  document.getElementById('sRes').innerHTML = `
    <div class="rrow"><span class="rl">채굴 횟수</span>            <span class="rv">${f(uses)}회</span></div>
    <div class="rrow"><span class="rl">획득 광석</span>            <span class="rv g">${f(ores)}개</span></div>
    <div class="rrow"><span class="rl">주괴 (광석 기준)</span>     <span class="rv">${f(iByOre)}개</span></div>
    <div class="rrow"><span class="rl">주괴 (횃불 기준)</span>     <span class="rv">${iByTorch >= 999999 ? '무제한' : f(iByTorch) + '개'}</span></div>
    <div class="rsec">
      <div class="rrow"><span class="rl">실제 제작 가능 주괴</span><span class="rv g" style="font-size:17px">${f(ingots)}개</span></div>
      <div class="rrow"><span class="rl">병목 요인</span>          <span class="bdg br">${limitFactor}</span></div>
      <div class="rrow"><span class="rl">남는 광석</span>          <span class="rv">${f(ores - ingots * oPI)}개</span></div>
      <div class="rrow"><span class="rl">남는 강화횃불</span>      <span class="rv">${tCnt > 0 ? f(tCnt - ingots * tPI) + '개' : '미입력'}</span></div>
      ${earn !== null
        ? `<div class="rrow"><span class="rl">예상 수익 (주괴 직판, 스킬 적용)</span><span class="rv p">${f(earn)}원</span></div>`
        : ''}
    </div>`;
}

/* ── TAB 1: 라이프스톤 ── */
export function cl() {
  const { furnaceReduction } = getSkillMultipliers();

  const p1 = gi('pL1');
  const p2 = gi('pL2');
  const p3 = gi('pL3');
  const pa = gi('pAb');
  const co = gi('iCo');
  const ri = gi('iRi');
  const se = gi('iSe');
  const total = co + ri + se;

  const ct1 = applyFurnaceReduction(gi('ctL1') || RECIPES.LS1.craft_time_sec, furnaceReduction);
  const ct2 = applyFurnaceReduction(gi('ctL2') || RECIPES.LS2.craft_time_sec, furnaceReduction);
  const ct3 = applyFurnaceReduction(gi('ctL3') || RECIPES.LS3.craft_time_sec, furnaceReduction);
  const cta = applyFurnaceReduction(gi('ctAb') || RECIPES.ABIL.craft_time_sec, furnaceReduction);

  const ls1Count   = Math.floor(co / RECIPES.LS1.ingot_corum);
  const ls1VCost   = vanillaCost('LS1');
  const ls1Revenue = ls1Count * p1 - ls1VCost * ls1Count;
  const ls1Time    = ls1Count * ct1;

  const ls2Count   = RECIPES.LS2.ingot_rifton > 0 ? Math.floor(ri / RECIPES.LS2.ingot_rifton) : 0;
  const ls2VCost   = vanillaCost('LS2');
  const ls2Revenue = ls2Count * p2 - ls2VCost * ls2Count;
  const ls2Time    = ls2Count * ct2;

  const ls3Count   = RECIPES.LS3.ingot_serent > 0 ? Math.floor(se / RECIPES.LS3.ingot_serent) : 0;
  const ls3VCost   = vanillaCost('LS3');
  const ls3Revenue = ls3Count * p3 - ls3VCost * ls3Count;
  const ls3Time    = ls3Count * ct3;

  const abilCount   = Math.min(co, ri, se);
  const abilRevenue = abilCount * pa;
  const abilTime    = abilCount * cta;

  const skillBadge = furnaceReduction > 0
    ? `<span class="bdg bg" style="font-size:10px">용광로 Lv${gi('skillFurnace')} (-${Math.round(furnaceReduction * 100)}%)</span>`
    : '';
  const timeRow = (sec) => sec > 0
    ? `<div class="rrow"><span class="rl">예상 제작 시간 ${skillBadge}</span><span class="rv b">${fmtTime(Math.round(sec))}</span></div>`
    : '';

  let html = `
    <div class="rrow">
      <span class="rl">총 보유 주괴</span>
      <span class="rv">${f(total)}개 &nbsp;(코룸 ${f(co)} / 리프톤 ${f(ri)} / 세렌트 ${f(se)})</span>
    </div>
    <div class="rsec">`;

  if (p1 || p2 || p3 || pa) {
    html += `
      <div class="rrow"><span class="rl">하급 라스 단가</span>                    <span class="rv g">${f(p1)}원</span></div>
      <div class="rrow"><span class="rl">하급 라스 제작 가능</span>               <span class="rv">${f(ls1Count)}개</span></div>
      <div class="rrow"><span class="rl">하급 라스 순수익 (바닐라 원가 차감)</span><span class="rv ${ls1Revenue >= 0 ? 'g' : 'r'}">${f(ls1Revenue)}원</span></div>
      ${timeRow(ls1Time)}
      <hr style="border-color:var(--border);margin:4px 0">
      <div class="rrow"><span class="rl">중급 라스 단가</span>                    <span class="rv g">${f(p2)}원</span></div>
      <div class="rrow"><span class="rl">중급 라스 제작 가능</span>               <span class="rv">${f(ls2Count)}개</span></div>
      <div class="rrow"><span class="rl">중급 라스 순수익 (바닐라 원가 차감)</span><span class="rv ${ls2Revenue >= 0 ? 'g' : 'r'}">${f(ls2Revenue)}원</span></div>
      ${timeRow(ls2Time)}
      <hr style="border-color:var(--border);margin:4px 0">
      <div class="rrow"><span class="rl">상급 라스 단가</span>                    <span class="rv g">${f(p3)}원</span></div>
      <div class="rrow"><span class="rl">상급 라스 제작 가능</span>               <span class="rv">${f(ls3Count)}개</span></div>
      <div class="rrow"><span class="rl">상급 라스 순수익 (바닐라 원가 차감)</span><span class="rv ${ls3Revenue >= 0 ? 'g' : 'r'}">${f(ls3Revenue)}원</span></div>
      ${timeRow(ls3Time)}
      <hr style="border-color:var(--border);margin:4px 0">
      <div class="rrow"><span class="rl">어빌 스톤 단가</span>                    <span class="rv p">${f(pa)}원</span></div>
      <div class="rrow"><span class="rl">어빌 스톤 제작 가능 (3종 균형)</span>   <span class="rv">${f(abilCount)}개</span></div>
      <div class="rrow"><span class="rl">어빌 스톤 총 판매가</span>               <span class="rv p">${f(abilRevenue)}원</span></div>
      ${timeRow(abilTime)}`;
  }

  html += `</div>`;
  document.getElementById('lRes').innerHTML = html;
}

/* ── TAB 2: 주괴 최적화 ── */
export function co() {
  const { ingotBonus } = getSkillMultipliers();

  const cP = applyIngotBonus(gi('oCo'), ingotBonus);
  const rP = applyIngotBonus(gi('oRi'), ingotBonus);
  const sP = applyIngotBonus(gi('oSe'), ingotBonus);

  const iCo = gi('iCo');
  const iRi = gi('iRi');
  const iSe = gi('iSe');
  const oL1 = gi('oL1');
  const oL2 = gi('oL2');
  const oL3 = gi('oL3');
  const oAb = gi('oAb');

  const rawSell   = iCo * cP + iRi * rP + iSe * sP;
  const ls1Count  = RECIPES.LS1.ingot_corum  > 0 ? Math.floor(iCo / RECIPES.LS1.ingot_corum)  : 0;
  const ls2Count  = RECIPES.LS2.ingot_rifton > 0 ? Math.floor(iRi / RECIPES.LS2.ingot_rifton) : 0;
  const ls3Count  = RECIPES.LS3.ingot_serent > 0 ? Math.floor(iSe / RECIPES.LS3.ingot_serent) : 0;
  const abilCount = Math.min(iCo, iRi, iSe);

  const vc1 = vanillaCost('LS1');
  const vc2 = vanillaCost('LS2');
  const vc3 = vanillaCost('LS3');

  const netPerLS1  = oL1 - RECIPES.LS1.ingot_corum  * cP - vc1;
  const netPerLS2  = oL2 - RECIPES.LS2.ingot_rifton * rP - vc2;
  const netPerLS3  = oL3 - RECIPES.LS3.ingot_serent * sP - vc3;
  const netPerAbil = oAb - (cP + rP + sP);

  const lasSell  = ls1Count * oL1 + ls2Count * oL2 + ls3Count * oL3;
  const abilSell = abilCount * oAb;

  const skillNote = ingotBonus > 0
    ? `<span class="bdg bg" style="font-size:10px">주괴 좀 사 Lv${gi('skillIngotSell')} (+${Math.round(ingotBonus * 100)}%) 적용</span>`
    : '';

  let strategy = '';
  if (rawSell === 0 && lasSell === 0 && oAb === 0) {
    strategy = '<div style="color:var(--muted);font-size:11px">가격을 입력하면 최적 전략을 계산합니다</div>';
  } else if (netPerLS1 > 0 || netPerLS2 > 0 || netPerLS3 > 0) {
    strategy = `<span class="bdg bg">라스 제작 권장</span>`;
  } else if (netPerAbil > 0) {
    strategy = `<span class="bdg bp">어빌 스톤 제작 권장</span>`;
  } else {
    strategy = `<span class="bdg br">주괴 직판 권장</span>`;
  }

  const matNames = {
    cobblestone:           '조약돌',
    deepslate_cobblestone: '심층암 조약돌',
    copper:                '구리 블럭',
    iron:                  '철 블럭',
    gold:                  '금 블럭',
    diamond:               '다이아 블럭',
    redstone:              '레드스톤 블럭',
    lapis:                 '청금석 블럭',
    amethyst:              '자수정 블럭',
  };

  let matHtml = '';
  [
    { label: '하급 라스', count: ls1Count, net: netPerLS1, rec: RECIPES.LS1 },
    { label: '중급 라스', count: ls2Count, net: netPerLS2, rec: RECIPES.LS2 },
    { label: '상급 라스', count: ls3Count, net: netPerLS3, rec: RECIPES.LS3 },
  ].forEach(({ label, count, net, rec }) => {
    if (count <= 0) return;
    matHtml += `<div style="margin-bottom:8px"><b style="color:var(--text)">${label} ${f(count)}개 제작 시 필요 재료:</b><br>`;
    Object.entries(rec.vanilla).forEach(([mat, qty]) => {
      matHtml += `<span style="color:var(--green)">${matNames[mat] || mat}: ${fmtQty(qty * count)}</span><br>`;
    });
    matHtml += `<span style="color:${net >= 0 ? 'var(--green)' : 'var(--red)'}">개당 순이익: ${f(net)}원</span></div>`;
  });

  if (!matHtml) matHtml = '<div style="color:var(--muted);font-size:11px">주괴 수량을 입력하면 재료 계획이 표시됩니다</div>';

  document.getElementById('oRes').innerHTML = `
    <div class="rrow"><span class="rl">주괴 직판 예상 수익 ${skillNote}</span><span class="rv g">${f(rawSell)}원</span></div>
    <div class="rrow"><span class="rl">라스 전량 제작 판매가</span>         <span class="rv">${f(lasSell)}원</span></div>
    <div class="rrow"><span class="rl">어빌 스톤 판매가 (균형 제작)</span>  <span class="rv p">${f(abilSell)}원</span></div>
    <div class="rrow"><span class="rl">하급 라스 개당 순이익</span>         <span class="rv ${netPerLS1 >= 0 ? 'g' : 'r'}">${f(netPerLS1)}원</span></div>
    <div class="rrow"><span class="rl">중급 라스 개당 순이익</span>         <span class="rv ${netPerLS2 >= 0 ? 'g' : 'r'}">${f(netPerLS2)}원</span></div>
    <div class="rrow"><span class="rl">상급 라스 개당 순이익</span>         <span class="rv ${netPerLS3 >= 0 ? 'g' : 'r'}">${f(netPerLS3)}원</span></div>
    <div class="rrow"><span class="rl">어빌 스톤 개당 순이익</span>         <span class="rv ${netPerAbil >= 0 ? 'g' : 'r'}">${f(netPerAbil)}원</span></div>
    <div class="rsec"><div class="rrow"><span class="rl">최적 전략</span>${strategy}</div></div>`;

  document.getElementById('matPlan').innerHTML = matHtml;
}

/* ── TAB 3: 바닐라 재료 ── */
export function cv() {
  const items = [
    { n: '조약돌',        v: gi('vCo') },
    { n: '심층암 조약돌', v: gi('vDc') },
    { n: '구리 블럭',     v: gi('vCu') },
    { n: '철 블럭',       v: gi('vIr') },
    { n: '금 블럭',       v: gi('vGo') },
    { n: '다이아 블럭',   v: gi('vDi') },
    { n: '레드스톤 블럭', v: gi('vRe') },
    { n: '청금석 블럭',   v: gi('vLa') },
    { n: '자수정 블럭',   v: gi('vAm') },
    { n: '기타',          v: gi('vEt') },
  ].filter(x => x.v > 0);

  if (!items.length) {
    document.getElementById('vRes').innerHTML =
      '<div style="color:var(--muted);font-size:11px">재료 가격 입력 후 계산됩니다</div>';
    cl(); co();
    return;
  }

  let html = '';
  items.forEach(x => {
    html += `<div class="rrow">
      <span class="rl">${x.n}</span>
      <span class="rv g">${f(x.v)}원/세트 <span style="color:var(--muted);font-size:10px">(개당 ${(x.v / SET_SIZE).toFixed(1)}원)</span></span>
    </div>`;
  });
  html += `
    <div class="rsec">
      <div class="rrow">
        <span class="rl">계산 기준</span>
        <span class="rv" style="font-size:11px;color:var(--muted)">세트가 ÷ 64 = 개당가 → 재료 수량 × 개당가 = 원가</span>
      </div>
    </div>`;

  document.getElementById('vRes').innerHTML = html;
  cl(); co();
}