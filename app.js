/* ════════════════════════════════════════
   app.js — 광부 계산기 통합 로직
   수치 변경은 config.js에서 하세요
════════════════════════════════════════ */

import {
  SKILLS, MINING, PICKAXE, ARTIFACT, ENGRAVING,
  INGOT_RECIPES, RECIPES, TORCH, UNITS,
  PRECIOUS, DEFAULT_PRICES,
} from './config.js';

const { SET_SIZE, BOX_SIZE } = UNITS;

/* ════ 유틸리티 ════ */

export const f  = (n) => Math.round(n).toLocaleString('ko-KR');
export const fd = (n, d = 2) => {
  const s = n.toFixed(d);
  return s.replace(/\.?0+$/, '');
};

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
export function gv(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

/* ════ 배지 헬퍼 ════ */
const bdg = (cls, txt) =>
  `<span class="bdg ${cls}" style="font-size:10px">${txt}</span>`;

/* ════ 스킬 헬퍼 ════ */

export function getSkillMultipliers() {
  const furnaceLv   = gi('skillFurnace');
  const ingotSellLv = gi('skillIngotSell');
  const gemSellLv   = gi('skillGemSell');
  const cobbyLv     = gi('skillCobby');
  const sparkleLv   = gi('skillSparkle');
  const luckyLv     = gi('skillLucky');
  const firePickLv  = gi('skillFirePick');
  const preciousLv  = gi('skillPrecious');

  const sparkle = SKILLS.SPARKLE.drops[sparkleLv]  || { pct: 0, count: 0 };
  const lucky   = SKILLS.LUCKY_HIT.drops[luckyLv]  || { pct: 0, count: 0 };

  return {
    furnaceReduction: (SKILLS.FURNACE.reductionPct[furnaceLv]   ?? 0) / 100,
    ingotBonus:       (SKILLS.INGOT_SELL.bonusPct[ingotSellLv]  ?? 0) / 100,
    gemBonus:         (SKILLS.GEM_SELL.bonusPct[gemSellLv]      ?? 0) / 100,
    cobbyAddPct:      (SKILLS.COBYTIME.dropPct[cobbyLv]         ?? 0),
    sparklePct:       sparkle.pct,
    sparkleCount:     sparkle.count,
    luckyPct:         lucky.pct,
    luckyCount:       lucky.count,
    firePickPct:      (SKILLS.FIRE_PICK.dropPct[firePickLv]     ?? 0),
    preciousBonus:    (SKILLS.PRECIOUS.bonusPct[preciousLv]     ?? 0) / 100,
    furnaceLv, ingotSellLv, gemSellLv, cobbyLv, sparkleLv, luckyLv, firePickLv, preciousLv,
  };
}

export function getEngravingMultipliers() {
  const oreLuckLv  = gi('engOreLuck');
  const relicLv    = gi('engRelic');
  const cobbyLv    = gi('engCobby');
  const gemCobbyLv = gi('engGemCobby');
  const cartLv     = gi('engCart');
  const rouletteLv = gi('engRoulette');
  return {
    extraOrePct:      (ENGRAVING.ORE_LUCK.extraOrePct[oreLuckLv]        ?? 0),
    extraArtifactPct: (ENGRAVING.RELIC_SEARCH.extraArtifactPct[relicLv] ?? 0),
    extraCobbyPct:    (ENGRAVING.COBBY_SUMMON.extraCobbyPct[cobbyLv]    ?? 0),
    gemConvertPct:    (ENGRAVING.GEM_COBBY.gemConvertPct[gemCobbyLv]    ?? 0),
    cartPct:          (ENGRAVING.MINE_CART.cartPct[cartLv]              ?? 0),
    dicePct:          (ENGRAVING.MINER_ROULETTE.dicePct[rouletteLv]     ?? 0),
    oreLuckLv, relicLv, cobbyLv, gemCobbyLv, cartLv, rouletteLv,
  };
}

/* ════ 탭 전환 ════ */

export function sw(i, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  for (let k = 0; k < 5; k++) {
    const p = document.getElementById('t' + k);
    if (p) p.style.display = 'none';
  }
  el.classList.add('on');
  document.getElementById('t' + i).style.display = 'block';
}

/* ════ 스킬 패널 info 업데이트 ════ */

export function onSkillChange() {
  const st = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
  const fl = gi('skillFurnace'), il = gi('skillIngotSell'), gl = gi('skillGemSell'),
        cl = gi('skillCobby'),  sl = gi('skillSparkle'),   ll = gi('skillLucky'),
        fpl= gi('skillFirePick'),pl = gi('skillPrecious');

  st('skillFurnaceInfo',   fl  === 0 ? '기본 (감소 없음)'   : `Lv${fl}  — 제작시간 ${SKILLS.FURNACE.reductionPct[fl]}% 감소`);
  st('skillIngotSellInfo', il  === 0 ? '기본 (보너스 없음)' : `Lv${il}  — 주괴 판매가 ${SKILLS.INGOT_SELL.bonusPct[il]}% 증가`);
  st('skillGemSellInfo',   gl  === 0 ? '기본 (보너스 없음)' : `Lv${gl}  — 보석 판매가 ${SKILLS.GEM_SELL.bonusPct[gl]}% 증가`);
  st('skillPreciousInfo',  pl  === 0 ? '기본 (보너스 없음)' : `Lv${pl}  — 귀중품 판매가 ${SKILLS.PRECIOUS.bonusPct[pl]}% 증가`);
  st('skillCobbyInfo',     cl  === 0 ? '기본 (보너스 없음)' : `Lv${cl}  — 코비 확률 +${SKILLS.COBYTIME.dropPct[cl]}%`);
  const sp = SKILLS.SPARKLE.drops[sl];
  st('skillSparkleInfo',   sl  === 0 ? '기본 (보너스 없음)' : sp ? `Lv${sl} — ${sp.pct}% 확률 보석 ${sp.count}개` : '');
  const lk = SKILLS.LUCKY_HIT.drops[ll];
  st('skillLuckyInfo',     ll  === 0 ? '기본 (보너스 없음)' : lk ? `Lv${ll} — ${lk.pct}% 확률 광석 ${lk.count}개 추가` : '');
  st('skillFirePickInfo',  fpl === 0 ? '기본 (보너스 없음)' : `Lv${fpl} — ${SKILLS.FIRE_PICK.dropPct[fpl]}% 확률 주괴 1개`);

  cs(); ct(); co(); cp();
}

export function onEngravingChange() {
  const st = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
  const ol = gi('engOreLuck'), rl = gi('engRelic'), cl = gi('engCobby'),
        gc = gi('engGemCobby'),ca = gi('engCart'),  ro = gi('engRoulette');

  st('engOreLuckInfo',  ol === 0 ? '없음' : `Lv${ol} — ${ENGRAVING.ORE_LUCK.extraOrePct[ol]}% 확률로 광석 1개 추가`);
  st('engRelicInfo',    rl === 0 ? '없음' : `Lv${rl} — 유물 확률 +${ENGRAVING.RELIC_SEARCH.extraArtifactPct[rl]}%`);
  st('engCobbyInfo',    cl === 0 ? '없음' : `Lv${cl} — 코비 확률 +${ENGRAVING.COBBY_SUMMON.extraCobbyPct[cl]}%`);
  st('engGemCobbyInfo', gc === 0 ? '없음' : `Lv${gc} — ${ENGRAVING.GEM_COBBY.gemConvertPct[gc]}% 확률로 보석코비`);
  st('engCartInfo',     ca === 0 ? '없음' : `Lv${ca} — ${ENGRAVING.MINE_CART.cartPct[ca]}% 확률로 광산수레`);
  st('engRouletteInfo', ro === 0 ? '없음' : `Lv${ro} — ${ENGRAVING.MINER_ROULETTE.dicePct[ro]}% 확률로 주사위`);

  cs();
}

/* ════════════════════════════════════════
   TAB 0: 채굴 수익 계산기
════════════════════════════════════════ */

export function cs() {
  const sk  = getSkillMultipliers();
  const eng = getEngravingMultipliers();

  const enhancement = gi('pickaxeLevel');
  const stamina     = gi('totalStamina');
  const oreType     = gv('oreType') || 'even';

  const rawIngotC = gi('ingotPriceC') || DEFAULT_PRICES.ingot.corum;
  const rawIngotR = gi('ingotPriceR') || DEFAULT_PRICES.ingot.rifton;
  const rawIngotS = gi('ingotPriceS') || DEFAULT_PRICES.ingot.serent;
  const rawGemC   = gi('gemPriceC')   || DEFAULT_PRICES.gem.corum;
  const rawGemR   = gi('gemPriceR')   || DEFAULT_PRICES.gem.rifton;
  const rawGemS   = gi('gemPriceS')   || DEFAULT_PRICES.gem.serent;

  const skillPulsePrice = gi('skillPulsePrice');
  const naviPrice100    = gi('naviPrice');
  const artifactPtPrice = gi('artifactPtPrice');

  const boostedC    = rawIngotC * (1 + sk.ingotBonus);
  const boostedR    = rawIngotR * (1 + sk.ingotBonus);
  const boostedS    = rawIngotS * (1 + sk.ingotBonus);
  const boostedGemC = rawGemC   * (1 + sk.gemBonus);
  const boostedGemR = rawGemR   * (1 + sk.gemBonus);
  const boostedGemS = rawGemS   * (1 + sk.gemBonus);

  const px = PICKAXE[enhancement] ?? PICKAXE[0];
  const miningCount = stamina > 0 ? Math.floor(stamina / MINING.STAMINA_PER_USE) : 0;

  /* 광석 기댓값 */
  const luckyExtra    = (sk.luckyPct / 100) * sk.luckyCount;
  const oreLuckExtra  = eng.extraOrePct / 100;
  const avgDice       = 3.5;
  const rouletteExtra = (eng.dicePct / 100) * (
    0.9 * avgDice * ENGRAVING.MINER_ROULETTE.normalMult +
    0.1 * avgDice * ENGRAVING.MINER_ROULETTE.goldenMult
  );
  const oresPerUse  = px.oresPerUse + luckyExtra + oreLuckExtra + rouletteExtra;
  const totalOresRaw = miningCount * oresPerUse;

  /* 광석 배분 */
  let oreC = 0, oreR = 0, oreS = 0;
  if      (oreType === 'corum')  { oreC = totalOresRaw; }
  else if (oreType === 'rifton') { oreR = totalOresRaw; }
  else if (oreType === 'serent') { oreS = totalOresRaw; }
  else { oreC = totalOresRaw/3; oreR = totalOresRaw/3; oreS = totalOresRaw - oreC - oreR; }

  /* 주괴 변환 */
  const ingotFromOreC = oreC / INGOT_RECIPES.CORUM.ores_per_ingot;
  const ingotFromOreR = oreR / INGOT_RECIPES.RIFTON.ores_per_ingot;
  const ingotFromOreS = oreS / INGOT_RECIPES.SERENT.ores_per_ingot;

  /* 필요 횃불 */
  const torchC = ingotFromOreC * (INGOT_RECIPES.CORUM.torch_per_ingot  || 0);
  const torchR = ingotFromOreR * (INGOT_RECIPES.RIFTON.torch_per_ingot || 0);
  const torchS = ingotFromOreS * (INGOT_RECIPES.SERENT.torch_per_ingot || 0);
  const totalTorch = torchC + torchR + torchS;

  /* 불붙은 곡괭이 추가 주괴 */
  const fpDrops = miningCount * (sk.firePickPct / 100);
  let fpC = 0, fpR = 0, fpS = 0;
  if      (oreType === 'corum')  fpC = fpDrops;
  else if (oreType === 'rifton') fpR = fpDrops;
  else if (oreType === 'serent') fpS = fpDrops;
  else { fpC = fpDrops/3; fpR = fpDrops/3; fpS = fpDrops - fpC - fpR; }

  /* 최종 주괴 */
  const totalIngotC   = ingotFromOreC + fpC;
  const totalIngotR   = ingotFromOreR + fpR;
  const totalIngotS   = ingotFromOreS + fpS;
  const totalIngotAll = totalIngotC + totalIngotR + totalIngotS;
  const ingotRevenue  = totalIngotC * boostedC + totalIngotR * boostedR + totalIngotS * boostedS;

  /* 보석 */
  let gemUnit = 0;
  if      (oreType === 'corum')  gemUnit = boostedGemC;
  else if (oreType === 'rifton') gemUnit = boostedGemR;
  else if (oreType === 'serent') gemUnit = boostedGemS;
  else gemUnit = (boostedGemC + boostedGemR + boostedGemS) / 3;

  const sparkleGems    = miningCount * (sk.sparklePct / 100) * sk.sparkleCount;
  const totalCobbyPct  = px.cobbyPct + sk.cobbyAddPct + eng.extraCobbyPct;
  const cobbyCount     = miningCount * (totalCobbyPct / 100);
  const gemCobbyCount  = cobbyCount  * (eng.gemConvertPct / 100);
  const normalCobby    = cobbyCount  - gemCobbyCount;
  const totalGems      = sparkleGems + gemCobbyCount;
  const gemRevenue     = totalGems * gemUnit;

  /* 스킬 펄스 */
  const skillPulseRevenue = normalCobby * skillPulsePrice;

  /* 유물 */
  const totalArtifactPct  = px.artifactPct + eng.extraArtifactPct;
  const artifactDrops     = miningCount * (totalArtifactPct / 100);
  const cartDrops         = miningCount * (eng.cartPct / 100);
  const cartArtifacts     = cartDrops * 2;
  const totalArtifacts    = artifactDrops + cartArtifacts;
  const totalArtifactPts  = totalArtifacts * ARTIFACT.avgPoints;
  const artifactRevenue   = artifactPtPrice > 0 ? totalArtifactPts * artifactPtPrice : 0;

  const totalRevenue = ingotRevenue + gemRevenue + skillPulseRevenue + artifactRevenue;

  const ingotBdg = sk.ingotBonus > 0 ? bdg('bg', `주괴 좀 사 +${Math.round(sk.ingotBonus*100)}%`) : '';
  const gemBdg   = sk.gemBonus   > 0 ? bdg('bg', `눈이 부셔 +${Math.round(sk.gemBonus*100)}%`)   : '';

  let html = `
    <div class="rsec">
      <div class="rrow">
        <span class="rl">곡괭이 스펙</span>
        <span class="rv">${enhancement}강 — 기본 광석 ${px.oresPerUse}개 / 유물 ${px.artifactPct}% / 코비 ${px.cobbyPct}%</span>
      </div>
      <div class="rrow"><span class="rl">채굴 횟수</span><span class="rv">${f(miningCount)}회</span></div>
      <div class="rrow"><span class="rl">회당 평균 광석 (보정 후)</span><span class="rv g">${fd(oresPerUse)}개</span></div>
    </div>

    <div class="rsec">
      <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:4px">📦 광석 & 주괴</div>
      <div class="rrow"><span class="rl">총 획득 광석 (기댓값)</span><span class="rv g">${f(totalOresRaw)}개</span></div>
      <div class="rrow"><span class="rl">코룸 광석 → 주괴</span><span class="rv">${f(oreC)}개 → ${f(ingotFromOreC)}개</span></div>
      <div class="rrow"><span class="rl">리프톤 광석 → 주괴</span><span class="rv">${f(oreR)}개 → ${f(ingotFromOreR)}개</span></div>
      <div class="rrow"><span class="rl">세렌트 광석 → 주괴</span><span class="rv">${f(oreS)}개 → ${f(ingotFromOreS)}개</span></div>
      ${totalTorch > 0 ? `<div class="rrow"><span class="rl">필요 강화횃불</span><span class="rv b">${f(totalTorch)}개</span></div>` : ''}
      ${fpDrops > 0 ? `<div class="rrow"><span class="rl">불붙은 곡괭이 주괴 ${bdg('bg','Lv'+sk.firePickLv)}</span><span class="rv">${fd(fpDrops)}개 (코${fd(fpC)}/리${fd(fpR)}/세${fd(fpS)})</span></div>` : ''}
      <div class="rrow" style="border-top:1px solid var(--border2);margin-top:4px;padding-top:6px">
        <span class="rl" style="font-weight:700;color:var(--text)">최종 총 주괴 수</span>
        <span class="rv p">${f(totalIngotAll)}개 &nbsp;<span style="font-size:10px;font-weight:400;color:var(--muted)">(코${f(totalIngotC)} / 리${f(totalIngotR)} / 세${f(totalIngotS)})</span></span>
      </div>
    </div>`;

  if (totalGems > 0 || cobbyCount > 0) {
    html += `
    <div class="rsec">
      <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:4px">💎 보석 & 코비</div>
      ${sparkleGems > 0 ? `<div class="rrow"><span class="rl">반짝임의 시작 ${bdg('bg','Lv'+sk.sparkleLv)}</span><span class="rv">${fd(sparkleGems)}개</span></div>` : ''}
      ${cobbyCount > 0  ? `<div class="rrow"><span class="rl">코비 소환 (${fd(totalCobbyPct)}%)</span><span class="rv">${fd(cobbyCount)}회</span></div>` : ''}
      ${gemCobbyCount > 0 ? `<div class="rrow"><span class="rl">└ 보석코비 전환 ${bdg('bpu',eng.gemConvertPct+'%')}</span><span class="rv">${fd(gemCobbyCount)}개</span></div>` : ''}
      ${normalCobby > 0   ? `<div class="rrow"><span class="rl">└ 일반코비 (스킬펄스)</span><span class="rv">${fd(normalCobby)}개</span></div>` : ''}
      <div class="rrow" style="border-top:1px solid var(--border2);margin-top:4px;padding-top:6px">
        <span class="rl" style="font-weight:700;color:var(--text)">총 보석 수</span>
        <span class="rv p">${fd(totalGems)}개</span>
      </div>
      <div class="rrow">
        <span class="rl" style="font-weight:700;color:var(--text)">스킬펄스 수</span>
        <span class="rv p">${fd(normalCobby)}개</span>
      </div>
    </div>`;
  }

  if (totalArtifacts > 0) {
    html += `
    <div class="rsec">
      <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:4px">🗿 유물</div>
      <div class="rrow"><span class="rl">유물 드랍 (${fd(totalArtifactPct)}%)</span><span class="rv">${fd(artifactDrops)}개</span></div>
      ${cartDrops > 0 ? `<div class="rrow"><span class="rl">광산수레 유물 ${bdg('bb','Lv'+eng.cartLv)}</span><span class="rv">${fd(cartArtifacts)}개</span></div>` : ''}
      <div class="rrow" style="border-top:1px solid var(--border2);margin-top:4px;padding-top:6px">
        <span class="rl" style="font-weight:700;color:var(--text)">총 유물 포인트</span>
        <span class="rv b">${f(totalArtifactPts)}pt</span>
      </div>
    </div>`;
  }

  html += `
    <div class="rsec">
      <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:4px">💰 수익 합산 (전량 판매 기준)</div>
      <div class="rrow"><span class="rl">주괴 수익 ${ingotBdg}</span><span class="rv g">${f(ingotRevenue)}원</span></div>
      ${totalGems > 0 ? `<div class="rrow"><span class="rl">보석 수익 ${gemBdg}</span><span class="rv g">${f(gemRevenue)}원</span></div>` : ''}
      ${normalCobby > 0 && skillPulsePrice > 0
        ? `<div class="rrow"><span class="rl">스킬펄스 수익</span><span class="rv g">${f(skillPulseRevenue)}원</span></div>`
        : normalCobby > 0
        ? `<div class="rrow"><span class="rl" style="color:var(--muted)">스킬펄스 ${fd(normalCobby)}개 — 단가 미입력</span><span class="rv" style="color:var(--muted)">미계산</span></div>`
        : ''}
      ${totalArtifacts > 0 && artifactPtPrice > 0
        ? `<div class="rrow"><span class="rl">유물 수익</span><span class="rv g">${f(artifactRevenue)}원</span></div>`
        : totalArtifacts > 0
        ? `<div class="rrow"><span class="rl" style="color:var(--muted)">유물 ${f(totalArtifactPts)}pt — 단가 미입력</span><span class="rv" style="color:var(--muted)">미계산</span></div>`
        : ''}
    </div>
    <div class="result-highlight">
      <div class="label">총 예상 수익 (전량 판매)</div>
      <div class="value">${f(totalRevenue)}원</div>
    </div>`;

  document.getElementById('sRes').innerHTML = html;
}

/* ════════════════════════════════════════
   TAB 1: 강화횃불 제작기
════════════════════════════════════════ */

export function ct() {
  const lv = gi('skillFurnace');
  const furnaceReduction = (SKILLS.FURNACE.reductionPct[lv] ?? 0) / 100;

  const charcoalSetPrice = gi('tCharcoalPrice');
  const stickSetPrice    = gi('tStickPrice');
  const wantCount        = gi('tWantCount');
  const sellPrice        = gi('tSellPrice');

  const charcoalUnit = charcoalSetPrice / SET_SIZE;
  const stickUnit    = stickSetPrice    / SET_SIZE;
  const costPerTorch = charcoalUnit + stickUnit;
  const totalCost    = costPerTorch * wantCount;
  const timePerTorch = TORCH.craft_time_sec * (1 - furnaceReduction);
  const totalTimeSec = timePerTorch * wantCount;

  const hasPrice    = sellPrice > 0;
  const totalRev    = hasPrice ? sellPrice * wantCount : 0;
  const netProfit   = hasPrice ? totalRev - totalCost  : 0;
  const skBdg       = furnaceReduction > 0 ? bdg('bg', `용광로 Lv${lv} -${Math.round(furnaceReduction*100)}%`) : '';

  document.getElementById('tRes').innerHTML = `
    <div class="rsec">
      <div class="rrow"><span class="rl">숯/석탄 개당 가격</span><span class="rv">${charcoalUnit.toFixed(1)}원</span></div>
      <div class="rrow"><span class="rl">막대기 개당 가격</span><span class="rv">${stickUnit.toFixed(1)}원</span></div>
      <div class="rrow"><span class="rl">횃불 1개 재료비</span><span class="rv r">${costPerTorch.toFixed(1)}원</span></div>
    </div>
    <div class="rsec">
      <div class="rrow"><span class="rl">필요 숯/석탄</span><span class="rv g">${fmtQty(wantCount)}</span></div>
      <div class="rrow"><span class="rl">필요 막대기</span><span class="rv g">${fmtQty(wantCount)}</span></div>
      <div class="rrow"><span class="rl">총 재료비</span><span class="rv r">${f(totalCost)}원</span></div>
    </div>
    <div class="rsec">
      <div class="rrow">
        <span class="rl">1개당 제작 시간 ${skBdg}</span>
        <span class="rv b">${fmtTime(timePerTorch)}</span>
      </div>
      <div class="rrow"><span class="rl">총 제작 시간</span><span class="rv b">${fmtTime(totalTimeSec)}</span></div>
    </div>
    <div class="result-highlight">
      <div class="label">${hasPrice ? '순이익 (판매 - 재료비)' : '총 재료비'}</div>
      <div class="value" style="color:${hasPrice ? (netProfit>=0?'var(--green)':'var(--red)') : 'var(--red)'}">
        ${f(hasPrice ? netProfit : totalCost)}원
      </div>
    </div>`;
}

/* ════════════════════════════════════════
   TAB 2: 주괴 최적화
════════════════════════════════════════ */

export function co() {
  const { ingotBonus, furnaceReduction, ingotSellLv, furnaceLv } = getSkillMultipliers();

  const iCo = gi('iCo'), iRi = gi('iRi'), iSe = gi('iSe');
  const cP = (gi('oCo') || DEFAULT_PRICES.ingot.corum)  * (1 + ingotBonus);
  const rP = (gi('oRi') || DEFAULT_PRICES.ingot.rifton) * (1 + ingotBonus);
  const sP = (gi('oSe') || DEFAULT_PRICES.ingot.serent) * (1 + ingotBonus);

  const oL1 = gi('oL1'), oL2 = gi('oL2'), oL3 = gi('oL3'), oAb = gi('oAb');
  const ctLS1  = (gi('ctL1') || RECIPES.LS1.craft_time_sec)  * (1 - furnaceReduction);
  const ctLS2  = (gi('ctL2') || RECIPES.LS2.craft_time_sec)  * (1 - furnaceReduction);
  const ctLS3  = (gi('ctL3') || RECIPES.LS3.craft_time_sec)  * (1 - furnaceReduction);
  const ctAbil = (gi('ctAb') || RECIPES.ABIL.craft_time_sec) * (1 - furnaceReduction);

  // 바닐라 원가 (재료 탭 기반)
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
  const vc = (type) => Object.entries(RECIPES[type].vanilla||{}).reduce((s,[m,q])=>s+q*(vp[m]||0),0);

  const rawSell = iCo*cP + iRi*rP + iSe*sP;
  const netLS1  = oL1 - RECIPES.LS1.ingot_corum  * cP - vc('LS1');
  const netLS2  = oL2 - RECIPES.LS2.ingot_rifton * rP - vc('LS2');
  const netLS3  = oL3 - RECIPES.LS3.ingot_serent * sP - vc('LS3');
  const netAbil = oAb - (cP + rP + sP);

  let remCo = iCo, remRi = iRi, remSe = iSe;
  const candidates = [
    {key:'LS1', net:netLS1, sell:oL1, iC:RECIPES.LS1.ingot_corum, iR:0, iS:0, ct:ctLS1},
    {key:'LS2', net:netLS2, sell:oL2, iC:0, iR:RECIPES.LS2.ingot_rifton, iS:0, ct:ctLS2},
    {key:'LS3', net:netLS3, sell:oL3, iC:0, iR:0, iS:RECIPES.LS3.ingot_serent, ct:ctLS3},
    {key:'ABIL',net:netAbil,sell:oAb, iC:1, iR:1, iS:1, ct:ctAbil},
  ].filter(c=>c.net>0&&c.sell>0).sort((a,b)=>b.net-a.net);

  const craftResult = {};
  for (const c of candidates) {
    const maxN = Math.min(
      c.iC>0 ? Math.floor(remCo/c.iC) : Infinity,
      c.iR>0 ? Math.floor(remRi/c.iR) : Infinity,
      c.iS>0 ? Math.floor(remSe/c.iS) : Infinity,
    );
    if (maxN<=0) continue;
    craftResult[c.key] = (craftResult[c.key]||0) + maxN;
    remCo-=c.iC*maxN; remRi-=c.iR*maxN; remSe-=c.iS*maxN;
  }

  const remSell = remCo*cP + remRi*rP + remSe*sP;
  let craftRev = remSell, craftTime = 0;

  const labelMap = {LS1:'하급 라이프스톤',LS2:'중급 라이프스톤',LS3:'상급 라이프스톤',ABIL:'어빌리티 스톤'};
  const ctMap    = {LS1:ctLS1,LS2:ctLS2,LS3:ctLS3,ABIL:ctAbil};
  const sellMap  = {LS1:oL1,LS2:oL2,LS3:oL3,ABIL:oAb};
  const matNames = {
    cobblestone:'조약돌',deepslate_cobblestone:'심층암 조약돌',
    copper:'구리 블럭',iron:'철 블럭',gold:'금 블럭',
    diamond:'다이아 블럭',redstone:'레드스톤 블럭',lapis:'청금석 블럭',amethyst:'자수정 블럭',
  };

  const craftLines = [];
  for (const [key,count] of Object.entries(craftResult)) {
    if (count<=0) continue;
    const rev=count*sellMap[key], t=count*ctMap[key];
    craftRev+=rev; craftTime+=t;
    const matParts=Object.entries(RECIPES[key].vanilla||{}).map(([m,q])=>
      `<span style="color:var(--green)">${matNames[m]||m} ${fmtQty(q*count)}</span>`);
    craftLines.push(`
      <div style="margin-bottom:8px">
        <div class="rrow">
          <span class="rl">${labelMap[key]}</span>
          <span class="rv">${f(count)}개 → <span class="g">${f(rev)}원</span></span>
        </div>
        ${matParts.length?`<div style="font-size:11px;color:var(--muted);padding:2px 0 0 4px">재료: ${matParts.join('  ')}</div>`:''}
        ${t>0?`<div style="font-size:11px;color:var(--muted);padding:2px 0 0 4px">제작 시간: ${fmtTime(t)}</div>`:''}
      </div>`);
  }

  const isRaw = rawSell >= craftRev;
  const iBdg  = ingotBonus>0 ? bdg('bg',`주괴 좀 사 +${Math.round(ingotBonus*100)}%`) : '';
  const fBdg  = furnaceReduction>0 ? bdg('bg',`용광로 -${Math.round(furnaceReduction*100)}%`) : '';

  document.getElementById('oRes').innerHTML = `
    <div class="rsec">
      <div class="rrow"><span class="rl">보유 주괴</span><span class="rv">코${f(iCo)} / 리${f(iRi)} / 세${f(iSe)}</span></div>
      <div class="rrow"><span class="rl">전량 직판 수익 ${iBdg}</span><span class="rv">${f(rawSell)}원</span></div>
    </div>
    <div class="rsec">
      <div class="rrow"><span class="rl">하급 라스 개당 순이익</span><span class="rv ${netLS1>=0?'g':'r'}">${f(netLS1)}원</span></div>
      <div class="rrow"><span class="rl">중급 라스 개당 순이익</span><span class="rv ${netLS2>=0?'g':'r'}">${f(netLS2)}원</span></div>
      <div class="rrow"><span class="rl">상급 라스 개당 순이익</span><span class="rv ${netLS3>=0?'g':'r'}">${f(netLS3)}원</span></div>
      <div class="rrow"><span class="rl">어빌 스톤 개당 순이익</span><span class="rv ${netAbil>=0?'g':'r'}">${f(netAbil)}원</span></div>
    </div>
    <div class="rsec">
      <div class="rrow">
        <span class="rl">최적 전략</span>
        ${isRaw?'<span class="bdg br">주괴 직판 권장</span>':'<span class="bdg bg">제작 후 판매 권장</span>'}
      </div>
    </div>
    ${!isRaw&&craftLines.length?`
    <div class="rsec">
      <div style="font-weight:700;font-size:12px;margin-bottom:6px">최적 제작 계획 ${fBdg}</div>
      ${craftLines.join('')}
      ${remCo+remRi+remSe>0?`<div class="rrow"><span class="rl">남은 주괴 직판</span><span class="rv">코${f(remCo)}/리${f(remRi)}/세${f(remSe)} → ${f(remSell)}원</span></div>`:''}
      <div class="rrow"><span class="rl">총 제작 시간</span><span class="rv b">${fmtTime(craftTime)}</span></div>
    </div>`:''}
    <div class="result-highlight">
      <div class="label">최종 예상 수익</div>
      <div class="value">${f(isRaw?rawSell:craftRev)}원</div>
    </div>`;
}

/* ════════════════════════════════════════
   TAB 3: 귀중품 수익 계산기
════════════════════════════════════════ */

export function cp() {
  const { ingotBonus, preciousBonus, preciousLv, ingotSellLv } = getSkillMultipliers();

  const ingotPriceC = (gi('pIngotC') || DEFAULT_PRICES.ingot.corum)  * (1 + ingotBonus);
  const ingotPriceR = (gi('pIngotR') || DEFAULT_PRICES.ingot.rifton) * (1 + ingotBonus);
  const ingotPriceS = (gi('pIngotS') || DEFAULT_PRICES.ingot.serent) * (1 + ingotBonus);

  const ingotPriceMap = {
    TOPAZ_BOX: ingotPriceC, SAPPHIRE_STATUE: ingotPriceR, PLATINUM_CROWN: ingotPriceS,
  };

  // 귀중품 전용 재료가 (개당)
  const vp = {
    topaz:       gi('vTopaz'),
    sapphire:    gi('vSapphire'),
    platinum:    gi('vPlatinum'),
    redstone:    gi('pRe') / SET_SIZE,
    lapis:       gi('pLa') / SET_SIZE,
    gold:        gi('pGo') / SET_SIZE,
    stalactite:  gi('vStalactite'),
    tuff:        gi('vTuff'),
    glow_lichen: gi('vGlowLichen'),
    doc:         gi('vDoc'),
  };

  const matNamesFull = {
    topaz:'토파즈 블럭', sapphire:'사파이어 블럭', platinum:'플레티넘 블럭',
    redstone:'레드스톤 블럭', lapis:'청금석 블럭', gold:'금 블럭',
    stalactite:'뾰족한 점적석', tuff:'응회암', glow_lichen:'발광이끼',
  };

  const AP = PRECIOUS.APPRAISAL;
  let html = '';

  for (const [itemKey, item] of Object.entries(PRECIOUS.ITEMS)) {
    const rec      = RECIPES[item.recipe];
    const iPrice   = ingotPriceMap[itemKey];
    const ingotCnt = rec.ingot_corum || rec.ingot_rifton || rec.ingot_serent || 0;
    const ingotCost = ingotCnt * iPrice;

    const vanCost = Object.entries(rec.vanilla||{}).reduce((s,[m,q])=>s+q*(vp[m]||0),0)
                  + (rec.doc||0) * (vp.doc||0);
    const totalCost = ingotCost + vanCost;

    const prices  = item.prices;
    const avgSell = (prices.LOW * AP.LOW.pct/100 + prices.GOOD * AP.GOOD.pct/100 + prices.ROYAL * AP.ROYAL.pct/100)
                  * (1 + preciousBonus);
    const netProfit = avgSell - totalCost;

    const pBdg = preciousBonus > 0 ? bdg('bpu', `귀하신 몸값 +${Math.round(preciousBonus*100)}%`) : '';
    const iBdg = ingotBonus    > 0 ? bdg('bg',  `주괴 좀 사 +${Math.round(ingotBonus*100)}%`)    : '';

    const ingotLabel = rec.ingot_corum  ? `코룸 주괴 ${rec.ingot_corum}개`
                     : rec.ingot_rifton ? `리프톤 주괴 ${rec.ingot_rifton}개`
                     : `세렌트 주괴 ${rec.ingot_serent}개`;

    const matSummary = Object.entries(rec.vanilla||{}).map(([m,q])=>
      `${matNamesFull[m]||m} ${q}개`).join(' / ') + (rec.doc ? ` / 증서 ${rec.doc}개` : '');

    html += `
    <div class="precious-item">
      <div class="precious-item-title">👑 ${item.name}</div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:8px">${ingotLabel} / ${matSummary}</div>
      <div class="rrow"><span class="rl">주괴 원가 ${iBdg}</span><span class="rv r">${f(ingotCost)}원</span></div>
      <div class="rrow"><span class="rl">바닐라 재료 원가</span><span class="rv r">${f(vanCost)}원</span></div>
      <div class="rrow"><span class="rl" style="font-weight:700">총 재료비</span><span class="rv r" style="font-weight:700">${f(totalCost)}원</span></div>
      <div class="rrow"><span class="rl">낮은 품질 (60%)</span><span class="rv">${f(prices.LOW*(1+preciousBonus))}원</span></div>
      <div class="rrow"><span class="rl">우수 (30%)</span><span class="rv">${f(prices.GOOD*(1+preciousBonus))}원</span></div>
      <div class="rrow"><span class="rl">황실인증 (10%)</span><span class="rv">${f(prices.ROYAL*(1+preciousBonus))}원</span></div>
      <div class="rrow"><span class="rl">감정 기댓값 ${pBdg}</span><span class="rv g">${f(avgSell)}원</span></div>
      <div style="text-align:center;margin-top:8px;padding:10px;background:${netProfit>=0?'var(--green-bg)':'var(--red-bg)'};border-radius:8px;border:1.5px solid ${netProfit>=0?'var(--green)':'var(--red)'}">
        <div style="font-size:10px;color:var(--muted)">기댓값 기준 순이익</div>
        <div style="font-size:20px;font-weight:700;font-family:Gaegu,cursive;color:${netProfit>=0?'var(--green)':'var(--red)'}">${f(netProfit)}원</div>
      </div>
    </div>`;
  }

  const el = document.getElementById('pRes');
  if (el) el.innerHTML = html || '<div class="empty-msg">값을 입력하면 계산됩니다 🔍</div>';
}

/* ════════════════════════════════════════
   TAB 4: 바닐라 재료 가격 입력
════════════════════════════════════════ */

export function cv() {
  const items = [
    {n:'조약돌',        v:gi('vCo')},
    {n:'심층암 조약돌', v:gi('vDc')},
    {n:'구리 블럭',     v:gi('vCu')},
    {n:'철 블럭',       v:gi('vIr')},
    {n:'금 블럭',       v:gi('vGo')},
    {n:'다이아 블럭',   v:gi('vDi')},
    {n:'레드스톤 블럭', v:gi('vRe')},
    {n:'청금석 블럭',   v:gi('vLa')},
    {n:'자수정 블럭',   v:gi('vAm')},
  ].filter(x=>x.v>0);

  if (!items.length) {
    document.getElementById('vRes').innerHTML = '<div class="empty-msg">재료 가격 입력 후 계산됩니다 🔍</div>';
    co();
    return;
  }

  let html = items.map(x=>`
    <div class="rrow">
      <span class="rl">${x.n}</span>
      <span class="rv g">${f(x.v)}원/세트
        <span style="color:var(--muted);font-size:10px">(개당 ${(x.v/SET_SIZE).toFixed(1)}원)</span>
      </span>
    </div>`).join('');

  html += `<div class="rsec"><div class="rrow">
    <span class="rl">계산 기준</span>
    <span style="font-size:11px;color:var(--muted)">세트가 ÷ 64 = 개당가 → 재료 수량 × 개당가</span>
  </div></div>`;

  document.getElementById('vRes').innerHTML = html;
  co();
}

/* ════ 초기화 ════ */

export function init() {
  onSkillChange();
  onEngravingChange();
}