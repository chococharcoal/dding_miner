/* ════════════════════════════════════════
   app.js — 광부 계산기 통합 로직
   수치 변경은 config.js에서 하세요
════════════════════════════════════════ */

import {
  SKILLS, MINING, PICKAXE,
  INGOT_RECIPES, RECIPES, TORCH, UNITS,
} from './config.js';

const { SET_SIZE, BOX_SIZE } = UNITS;

/* ════════════════════════════════════════
   유틸리티
════════════════════════════════════════ */

export const f = (n) => Math.round(n).toLocaleString('ko-KR');

export function fmtQty(n) {
  if (n <= 0) return '0개';
  const boxes = Math.floor(n / BOX_SIZE);
  const rem   = n % BOX_SIZE;
  const sets  = Math.floor(rem / SET_SIZE);
  const items = rem % SET_SIZE;
  const parts = [];
  if (boxes > 0) parts.push(boxes + '상자');
  if (sets  > 0) parts.push(sets  + '세트');
  if (items > 0) parts.push(items + '개');
  return parts.join(' ') || '0개';
}

export function fmtTime(sec) {
  if (sec <= 0) return '0초';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  const parts = [];
  if (h > 0) parts.push(h + '시간');
  if (m > 0) parts.push(m + '분');
  if (s > 0) parts.push(s + '초');
  return parts.join(' ');
}

export function gi(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  return Math.max(0, +(el.value) || 0);
}

/* ════════════════════════════════════════
   스킬 헬퍼
════════════════════════════════════════ */

export function getSkillMultipliers() {
  const furnaceLv   = gi('skillFurnace');
  const ingotSellLv = gi('skillIngotSell');
  return {
    furnaceReduction: (SKILLS.FURNACE.reductionPct[furnaceLv]  ?? 0) / 100,
    ingotBonus:       (SKILLS.INGOT_SELL.bonusPct[ingotSellLv] ?? 0) / 100,
  };
}

export function applyIngotBonus(basePrice, ingotBonus) {
  return basePrice * (1 + ingotBonus);
}

export function applyFurnaceReduction(baseSec, furnaceReduction) {
  return baseSec * (1 - furnaceReduction);
}

/* ════════════════════════════════════════
   바닐라 재료 원가
════════════════════════════════════════ */

export function vPrices() {
  return {
    charcoal:              gi('vch') / SET_SIZE,
    cobblestone:           gi('vCo') / SET_SIZE,
    deepslate_cobblestone: gi('vDc') / SET_SIZE,
    copper:                gi('vCu') / SET_SIZE,
    iron:                  gi('vIr') / SET_SIZE,
    gold:                  gi('vGo') / SET_SIZE,
    diamond:               gi('vDi') / SET_SIZE,
    redstone:              gi('vRe') / SET_SIZE,
    lapis:                 gi('vLa') / SET_SIZE,
    amethyst:              gi('vAm') / SET_SIZE,
    etc:                   gi('vEt') / SET_SIZE,
  };
}

export function vanillaCost(type) {
  const vp  = vPrices();
  const rec = RECIPES[type];
  if (!rec) return 0;
  return Object.entries(rec.vanilla).reduce((sum, [mat, qty]) => {
    return sum + qty * (vp[mat] || 0);
  }, 0);
}

/* ════════════════════════════════════════
   탭 전환
════════════════════════════════════════ */

export function sw(i, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  for (let k = 0; k < 4; k++) {
    const panel = document.getElementById('t' + k);
    if (panel) panel.style.display = 'none';
  }
  el.classList.add('on');
  document.getElementById('t' + i).style.display = 'block';
}

/* ════════════════════════════════════════
   스킬 패널
════════════════════════════════════════ */

export function onSkillChange() {
  const furnaceLv   = gi('skillFurnace');
  const ingotSellLv = gi('skillIngotSell');
  const furnaceRed  = SKILLS.FURNACE.reductionPct[furnaceLv]  ?? 0;
  const ingotBonus  = SKILLS.INGOT_SELL.bonusPct[ingotSellLv] ?? 0;

  document.getElementById('skillFurnaceInfo').textContent =
    furnaceLv === 0
      ? '기본 (감소 없음)'
      : `Lv${furnaceLv} — 제작시간 ${furnaceRed}% 감소`;
  document.getElementById('skillIngotSellInfo').textContent =
    ingotSellLv === 0
      ? '기본 (보너스 없음)'
      : `Lv${ingotSellLv} — 주괴 판매가 ${ingotBonus}% 증가`;

  cs(); ct(); co();
}

/* ════════════════════════════════════════
   TAB 0: 채굴 수익 계산기
════════════════════════════════════════ */

export function cs() {
  const { ingotBonus } = getSkillMultipliers();

  const enhancement = gi('pickaxeLevel');
  const stamina     = gi('totalStamina');
  const oreTypeEl   = document.getElementById('oreType');
  const oreType     = oreTypeEl ? oreTypeEl.value : 'even';
  const ingotPriceC = gi('ingotPriceC');
  const ingotPriceR = gi('ingotPriceR');
  const ingotPriceS = gi('ingotPriceS');
  const gemPrice    = gi('gemPrice');
  const naviPrice   = gi('naviPrice');

  const px = PICKAXE[enhancement] ?? PICKAXE[0];

  // 채굴 횟수 = 총 스테미나 ÷ 10
  const miningCount = Math.floor(stamina / MINING.STAMINA_PER_USE);

  // 총 광석 수 = 채굴 횟수 × 채굴 1회당 광석 수
  const totalOres = miningCount * px.oresPerUse;

  // 광석 종류별 배분
  let oreC = 0, oreR = 0, oreS = 0;
  if      (oreType === 'corum')  { oreC = totalOres; }
  else if (oreType === 'rifton') { oreR = totalOres; }
  else if (oreType === 'serent') { oreS = totalOres; }
  else {
    // 골고루: 3등분 (나머지는 세렌트에)
    oreC = Math.floor(totalOres / 3);
    oreR = Math.floor(totalOres / 3);
    oreS = totalOres - oreC - oreR;
  }

  // 광석 → 주괴
  const ingotC = Math.floor(oreC / INGOT_RECIPES.CORUM.ores_per_ingot);
  const ingotR = Math.floor(oreR / INGOT_RECIPES.RIFTON.ores_per_ingot);
  const ingotS = Math.floor(oreS / INGOT_RECIPES.SERENT.ores_per_ingot);

  // 주괴 판매 수익 (스킬 보너스 적용)
  const boostedC = applyIngotBonus(ingotPriceC, ingotBonus);
  const boostedR = applyIngotBonus(ingotPriceR, ingotBonus);
  const boostedS = applyIngotBonus(ingotPriceS, ingotBonus);
  const ingotRevenue = ingotC * boostedC + ingotR * boostedR + ingotS * boostedS;

  // 보석 드랍 기댓값
  const gemDrops   = miningCount * (px.gemDropPct / 100);
  const gemRevenue = gemDrops * gemPrice;

  // 항해포인트 드랍 기댓값
  const naviDrops   = miningCount * px.naviPointDrop;
  const naviRevenue = naviDrops * naviPrice;

  // 주괴 완성품 드랍 기댓값
  const ingotDropCount = miningCount * (px.ingotDropPct / 100);
  let ingotDropRevenue = 0;
  if      (oreType === 'corum')  ingotDropRevenue = ingotDropCount * boostedC;
  else if (oreType === 'rifton') ingotDropRevenue = ingotDropCount * boostedR;
  else if (oreType === 'serent') ingotDropRevenue = ingotDropCount * boostedS;
  else ingotDropRevenue = ingotDropCount * ((boostedC + boostedR + boostedS) / 3);

  const totalRevenue = ingotRevenue + gemRevenue + naviRevenue + ingotDropRevenue;

  const skillBadge = ingotBonus > 0
    ? `<span class="bdg bg" style="font-size:10px">주괴 좀 사 Lv${gi('skillIngotSell')} (+${Math.round(ingotBonus * 100)}%)</span>`
    : '';

  document.getElementById('sRes').innerHTML = `
    <div class="rrow">
      <span class="rl">곡괭이 스펙</span>
      <span class="rv">${enhancement}강 — 채굴 1회당 광석 ${px.oresPerUse}개</span>
    </div>
    <div class="rrow"><span class="rl">채굴 횟수</span>      <span class="rv">${f(miningCount)}회</span></div>
    <div class="rrow"><span class="rl">총 획득 광석</span>   <span class="rv g">${f(totalOres)}개</span></div>
    <div class="rsec">
      <div class="rrow"><span class="rl">코룸  광석 → 주괴</span>  <span class="rv">${f(oreC)}개 → ${f(ingotC)}개</span></div>
      <div class="rrow"><span class="rl">리프톤 광석 → 주괴</span> <span class="rv">${f(oreR)}개 → ${f(ingotR)}개</span></div>
      <div class="rrow"><span class="rl">세렌트 광석 → 주괴</span> <span class="rv">${f(oreS)}개 → ${f(ingotS)}개</span></div>
    </div>
    <div class="rsec">
      <div class="rrow">
        <span class="rl">주괴 판매 수익 ${skillBadge}</span>
        <span class="rv g">${f(ingotRevenue)}원</span>
      </div>
      ${px.gemDropPct > 0 ? `
      <div class="rrow"><span class="rl">보석 드랍 기댓값</span>      <span class="rv">${gemDrops.toFixed(2)}개</span></div>
      <div class="rrow"><span class="rl">보석 판매 수익</span>        <span class="rv g">${f(gemRevenue)}원</span></div>` : ''}
      ${px.naviPointDrop > 0 ? `
      <div class="rrow"><span class="rl">항해포인트 드랍 기댓값</span> <span class="rv">${naviDrops.toFixed(2)}개</span></div>
      <div class="rrow"><span class="rl">항해포인트 수익</span>       <span class="rv g">${f(naviRevenue)}원</span></div>` : ''}
      ${px.ingotDropPct > 0 ? `
      <div class="rrow"><span class="rl">주괴 완성품 드랍 기댓값</span><span class="rv">${ingotDropCount.toFixed(2)}개</span></div>
      <div class="rrow"><span class="rl">주괴 드랍 수익</span>        <span class="rv g">${f(ingotDropRevenue)}원</span></div>` : ''}
    </div>
    <div class="rsec">
      <div class="rrow">
        <span class="rl">총 예상 수익</span>
        <span class="rv p" style="font-size:17px">${f(totalRevenue)}원</span>
      </div>
    </div>`;
}

/* ════════════════════════════════════════
   TAB 1: 강화횃불 제작기
════════════════════════════════════════ */

export function ct() {
  const { furnaceReduction } = getSkillMultipliers();

  const charcoalSetPrice = gi('tCharcoalPrice');
  const stickSetPrice    = gi('tStickPrice');
  const wantCount        = gi('tWantCount');
  const sellPrice        = gi('tSellPrice');

  // 개당 가격 환산
  const charcoalUnit = charcoalSetPrice / SET_SIZE;
  const stickUnit    = stickSetPrice    / SET_SIZE;

  // 횃불 1개 재료: 숯/석탄 1개 + 막대기 1개
  const costPerTorch = charcoalUnit + stickUnit;
  const totalCost    = costPerTorch * wantCount;

  // 제작 시간 (스킬 감소 적용)
  const timePerTorch = applyFurnaceReduction(TORCH.craft_time_sec, furnaceReduction);
  const totalTimeSec = timePerTorch * wantCount;

  // 수익 계산
  const hasPrice    = sellPrice > 0;
  const totalRevenue = hasPrice ? sellPrice * wantCount : 0;
  const netProfit    = hasPrice ? totalRevenue - totalCost : 0;

  const skillBadge = furnaceReduction > 0
    ? `<span class="bdg bg" style="font-size:10px">용광로 Lv${gi('skillFurnace')} (-${Math.round(furnaceReduction * 100)}%)</span>`
    : '';

  document.getElementById('tRes').innerHTML = `
    <div class="rrow"><span class="rl">숯/석탄 개당 가격</span> <span class="rv">${charcoalUnit.toFixed(1)}원</span></div>
    <div class="rrow"><span class="rl">막대기 개당 가격</span>  <span class="rv">${stickUnit.toFixed(1)}원</span></div>
    <div class="rrow"><span class="rl">횃불 1개 재료비</span>   <span class="rv">${costPerTorch.toFixed(1)}원</span></div>
    <div class="rsec">
      <div class="rrow"><span class="rl">필요 숯/석탄</span>    <span class="rv g">${fmtQty(wantCount)} (${f(wantCount)}개)</span></div>
      <div class="rrow"><span class="rl">필요 막대기</span>     <span class="rv g">${fmtQty(wantCount)} (${f(wantCount)}개)</span></div>
      <div class="rrow"><span class="rl">총 재료비</span>       <span class="rv r">${f(totalCost)}원</span></div>
    </div>
    <div class="rsec">
      <div class="rrow">
        <span class="rl">1개당 제작 시간 ${skillBadge}</span>
        <span class="rv b">${fmtTime(timePerTorch)}</span>
      </div>
      <div class="rrow"><span class="rl">총 제작 시간</span>    <span class="rv b">${fmtTime(totalTimeSec)}</span></div>
    </div>
    ${hasPrice ? `
    <div class="rsec">
      <div class="rrow"><span class="rl">총 판매 수익</span>    <span class="rv g">${f(totalRevenue)}원</span></div>
      <div class="rrow">
        <span class="rl">순이익</span>
        <span class="rv ${netProfit >= 0 ? 'p' : 'r'}" style="font-size:17px">${f(netProfit)}원</span>
      </div>
    </div>` : `
    <div class="rsec">
      <div class="rrow">
        <span class="rl">총 재료비 합계</span>
        <span class="rv r" style="font-size:17px">${f(totalCost)}원</span>
      </div>
    </div>`}`;
}

/* ════════════════════════════════════════
   TAB 2: 주괴 최적화
════════════════════════════════════════ */

export function co() {
  const { ingotBonus, furnaceReduction } = getSkillMultipliers();

  const iCo = gi('iCo');
  const iRi = gi('iRi');
  const iSe = gi('iSe');

  const cP = applyIngotBonus(gi('oCo'), ingotBonus);
  const rP = applyIngotBonus(gi('oRi'), ingotBonus);
  const sP = applyIngotBonus(gi('oSe'), ingotBonus);

  const oL1 = gi('oL1');
  const oL2 = gi('oL2');
  const oL3 = gi('oL3');
  const oAb = gi('oAb');

  // 제작 시간 (스킬 적용)
  const ctLS1  = applyFurnaceReduction(gi('ctL1') || RECIPES.LS1.craft_time_sec,  furnaceReduction);
  const ctLS2  = applyFurnaceReduction(gi('ctL2') || RECIPES.LS2.craft_time_sec,  furnaceReduction);
  const ctLS3  = applyFurnaceReduction(gi('ctL3') || RECIPES.LS3.craft_time_sec,  furnaceReduction);
  const ctAbil = applyFurnaceReduction(gi('ctAb') || RECIPES.ABIL.craft_time_sec, furnaceReduction);

  // 바닐라 원가
  const vc1 = vanillaCost('LS1');
  const vc2 = vanillaCost('LS2');
  const vc3 = vanillaCost('LS3');

  // 전량 직판 수익
  const rawSell = iCo * cP + iRi * rP + iSe * sP;

  // 개당 순이익
  const netLS1  = oL1 - RECIPES.LS1.ingot_corum  * cP - vc1;
  const netLS2  = oL2 - RECIPES.LS2.ingot_rifton * rP - vc2;
  const netLS3  = oL3 - RECIPES.LS3.ingot_serent * sP - vc3;
  const netAbil = oAb - (cP + rP + sP);

  // 최적 조합 탐색: 개당 순이익 높은 순으로 주괴 소진
  let remCo = iCo, remRi = iRi, remSe = iSe;

  const candidates = [
    { key: 'LS1',  net: netLS1,  sell: oL1, iC: RECIPES.LS1.ingot_corum,  iR: 0, iS: 0, ct: ctLS1  },
    { key: 'LS2',  net: netLS2,  sell: oL2, iC: 0, iR: RECIPES.LS2.ingot_rifton, iS: 0, ct: ctLS2  },
    { key: 'LS3',  net: netLS3,  sell: oL3, iC: 0, iR: 0, iS: RECIPES.LS3.ingot_serent, ct: ctLS3  },
    { key: 'ABIL', net: netAbil, sell: oAb, iC: 1, iR: 1, iS: 1, ct: ctAbil },
  ]
    .filter(c => c.net > 0 && c.sell > 0)
    .sort((a, b) => b.net - a.net);

  const craftResult = {};
  for (const c of candidates) {
    const maxN = Math.min(
      c.iC > 0 ? Math.floor(remCo / c.iC) : Infinity,
      c.iR > 0 ? Math.floor(remRi / c.iR) : Infinity,
      c.iS > 0 ? Math.floor(remSe / c.iS) : Infinity,
    );
    if (maxN <= 0) continue;
    craftResult[c.key] = (craftResult[c.key] || 0) + maxN;
    remCo -= c.iC * maxN;
    remRi -= c.iR * maxN;
    remSe -= c.iS * maxN;
  }

  // 남은 주괴 직판 수익
  const remSell = remCo * cP + remRi * rP + remSe * sP;

  // 제작 결과 집계
  let craftRevenue      = remSell;
  let craftTimeTotalSec = 0;

  const labelMap = {
    LS1:  '하급 라이프스톤',
    LS2:  '중급 라이프스톤',
    LS3:  '상급 라이프스톤',
    ABIL: '어빌리티 스톤',
  };
  const ctMap  = { LS1: ctLS1, LS2: ctLS2, LS3: ctLS3, ABIL: ctAbil };
  const recMap = { LS1: RECIPES.LS1, LS2: RECIPES.LS2, LS3: RECIPES.LS3, ABIL: RECIPES.ABIL };
  const sellMap = { LS1: oL1, LS2: oL2, LS3: oL3, ABIL: oAb };
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

  const craftLines = [];
  for (const [key, count] of Object.entries(craftResult)) {
    if (count <= 0) continue;
    const rev     = count * sellMap[key];
    const timeSec = count * ctMap[key];
    craftRevenue      += rev;
    craftTimeTotalSec += timeSec;

    const rec = recMap[key];
    const matParts = Object.entries(rec.vanilla).map(([mat, qty]) =>
      `<span style="color:var(--green)">${matNames[mat] || mat} ${fmtQty(qty * count)}</span>`
    );

    craftLines.push(`
      <div style="margin-bottom:8px">
        <div class="rrow">
          <span class="rl">${labelMap[key]}</span>
          <span class="rv">${f(count)}개 → <span class="rv g">${f(rev)}원</span></span>
        </div>
        ${matParts.length ? `<div style="font-size:11px;color:var(--muted);padding:2px 0 0 4px">재료: ${matParts.join('  ')}</div>` : ''}
        ${timeSec > 0 ? `<div style="font-size:11px;color:var(--muted);padding:2px 0 0 4px">제작 시간: ${fmtTime(timeSec)}</div>` : ''}
      </div>`);
  }

  const isRawBetter = rawSell >= craftRevenue;

  const skillBadgeI = ingotBonus > 0
    ? `<span class="bdg bg" style="font-size:10px">주괴 좀 사 +${Math.round(ingotBonus * 100)}%</span>`
    : '';
  const skillBadgeF = furnaceReduction > 0
    ? `<span class="bdg bg" style="font-size:10px">용광로 -${Math.round(furnaceReduction * 100)}%</span>`
    : '';

  document.getElementById('oRes').innerHTML = `
    <div class="rrow">
      <span class="rl">보유 주괴</span>
      <span class="rv">코룸 ${f(iCo)} / 리프톤 ${f(iRi)} / 세렌트 ${f(iSe)}</span>
    </div>
    <div class="rrow">
      <span class="rl">전량 직판 수익 ${skillBadgeI}</span>
      <span class="rv">${f(rawSell)}원</span>
    </div>
    <div class="rsec">
      <div class="rrow"><span class="rl">하급 라스 개당 순이익</span> <span class="rv ${netLS1  >= 0 ? 'g' : 'r'}">${f(netLS1)}원</span></div>
      <div class="rrow"><span class="rl">중급 라스 개당 순이익</span> <span class="rv ${netLS2  >= 0 ? 'g' : 'r'}">${f(netLS2)}원</span></div>
      <div class="rrow"><span class="rl">상급 라스 개당 순이익</span> <span class="rv ${netLS3  >= 0 ? 'g' : 'r'}">${f(netLS3)}원</span></div>
      <div class="rrow"><span class="rl">어빌 스톤 개당 순이익</span> <span class="rv ${netAbil >= 0 ? 'g' : 'r'}">${f(netAbil)}원</span></div>
    </div>
    <div class="rsec">
      <div class="rrow">
        <span class="rl">최적 전략</span>
        ${isRawBetter
          ? '<span class="bdg br">주괴 직판 권장</span>'
          : '<span class="bdg bg">제작 후 판매 권장</span>'}
      </div>
    </div>
    ${!isRawBetter && craftLines.length ? `
    <div class="rsec">
      <div style="font-weight:500;font-size:12px;margin-bottom:6px">최적 제작 계획 ${skillBadgeF}</div>
      ${craftLines.join('')}
      ${remCo + remRi + remSe > 0 ? `
      <div class="rrow">
        <span class="rl">남은 주괴 직판</span>
        <span class="rv">코룸 ${f(remCo)} / 리프톤 ${f(remRi)} / 세렌트 ${f(remSe)} → ${f(remSell)}원</span>
      </div>` : ''}
      <div class="rrow"><span class="rl">총 제작 시간</span> <span class="rv b">${fmtTime(craftTimeTotalSec)}</span></div>
      <div class="rrow">
        <span class="rl">최종 예상 수익</span>
        <span class="rv p" style="font-size:17px">${f(craftRevenue)}원</span>
      </div>
    </div>` : ''}
    ${isRawBetter ? `
    <div class="rsec">
      <div class="rrow">
        <span class="rl">최종 예상 수익</span>
        <span class="rv p" style="font-size:17px">${f(rawSell)}원</span>
      </div>
    </div>` : ''}`;
}

/* ════════════════════════════════════════
   TAB 3: 바닐라 재료 가격 입력
════════════════════════════════════════ */

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
    co();
    return;
  }

  let html = '';
  items.forEach(x => {
    html += `<div class="rrow">
      <span class="rl">${x.n}</span>
      <span class="rv g">${f(x.v)}원/세트
        <span style="color:var(--muted);font-size:10px">(개당 ${(x.v / SET_SIZE).toFixed(1)}원)</span>
      </span>
    </div>`;
  });
  html += `
    <div class="rsec">
      <div class="rrow">
        <span class="rl">계산 기준</span>
        <span style="font-size:11px;color:var(--muted)">세트가 ÷ 64 = 개당가 → 재료 수량 × 개당가 = 원가</span>
      </div>
    </div>`;

  document.getElementById('vRes').innerHTML = html;
  co();
}

/* ════════════════════════════════════════
   초기화
════════════════════════════════════════ */

export function init() {
  onSkillChange();
}