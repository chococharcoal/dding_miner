/* ════════════════════════════════════════
   ocean app.js — 해양 계산기 로직
   공백 포함 파일명: "ocean app.js"
════════════════════════════════════════ */

import {
  OCEAN_SKILLS as SKILLS,
  OCEAN_ENGRAVING as ENGRAVING,
  ROD, OCEAN, CLAM, CRAFTS, ALCHEMY, PRECISION_ALCHEMY, VANILLA_META,
  SEAFOOD_TYPES, UNITS,
  OCEAN_DEFAULT_PRICES as DEFAULT_PRICES,
} from './config.js?v=3';

/* 공통 모듈 (shared/) — 중복 제거: utils·dropdown·sale-calc·storage */
import { f, fd, gi, fmtTime, createUnitUtils } from './shared/utils.js';
import { initOneCdd, syncDropdownLabels, bindCddOutsideClose } from './shared/dropdown.js';
import { proxyCalc as _oProxyCalc, resultBox as _oResultBox, saleRow as _orrow, fk as _ofk } from './shared/sale-calc.js';
import { createPageStore } from './shared/storage.js';


/* ════════════════════════════════════════
   ① 유틸리티 함수 (단위 의존분만 로컬 바인딩, 나머지는 shared/utils.js)
════════════════════════════════════════ */
const {SET_SIZE, BOX_SIZE} = UNITS;
const { fmtQty, readSplitQty, splitQtyHtml } = createUnitUtils(UNITS, { onInput: 'onSFQtyInput' });

const SF_TYPES  = ['oyster','conch','octopus','seaweed','urchin'];
const SF_TIERS  = [1, 2, 3];
const TAB_TITLES = ['하루 수익 예상','시세 입력','연금 최적화','판매가 계산기'];


/* ════════════════════════════════════════
   ② 탭 전환
════════════════════════════════════════ */
window.sw = (i, el) => {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  [0,1,2,3].forEach(k => { const p = document.getElementById('t'+k); if (p) p.style.display = 'none'; });
  el.classList.add('on');
  document.getElementById('t'+i).style.display = 'flex';
  const t = document.getElementById('pageTabTitle'); if (t) t.textContent = TAB_TITLES[i];
  document.title = `해양 계산기 — ${TAB_TITLES[i]}`;
};


/* ════════════════════════════════════════
   ③ 스킬·각인석 값 읽기
════════════════════════════════════════ */
function getSK() {
  const fl=gi('skillFurnace'), cb=gi('skillCraftBonus'), ab=gi('skillAlchBonus');
  const dh=gi('skillDeepHarvest'), sb=gi('skillStarBonus'), clm=gi('skillClamBonus');
  return {
    fr:    (SKILLS.FURNACE.reductionPct[fl] ?? 0) / 100,
    cb:    (SKILLS.CRAFT_BONUS.bonusPct[cb]  ?? 0) / 100,
    ab:    (SKILLS.ALCH_BONUS.bonusPct[ab]   ?? 0) / 100,
    dhPct:  SKILLS.DEEP_HARVEST.pct[dh]  ?? 0,
    sbPct:  SKILLS.STAR_BONUS.pct[sb]    ?? 0,
    clmPct: SKILLS.CLAM_BONUS.pct[clm]   ?? 0,
    fl, cb_lv: cb, ab_lv: ab, dh, sb, clm,
  };
}
function getENG() {
  const cs=gi('engClamSearch'), sl=gi('engSeafoodLuck'),
        fr=gi('engFisherRoulette'), sw=gi('engSpiritWhale');
  const slD = ENGRAVING.SEAFOOD_LUCK.drops[sl] || {pct:0, count:0};
  return {
    csPct: ENGRAVING.CLAM_SEARCH.pct[cs]                     ?? 0,
    slPct: slD.pct, slCnt: slD.count,
    frPct: ENGRAVING.FISHER_ROULETTE.dicePct[fr]              ?? 0,
    swPct: (ENGRAVING.SPIRIT_WHALE?.appearPct?.[sw])          ?? 0,
    cs, sl, fr, sw,
  };
}


/* ════════════════════════════════════════
   ④ 가격 헬퍼
════════════════════════════════════════ */
function getCraftSellPct() { return 0.95; }

function getPearlPrice(pearlKey) {
  const craft = Object.values(CRAFTS).find(c => c.pearlKey === pearlKey);
  if (!craft) return 0;
  const sk = getSK();
  return Math.round(craft.priceMax * getCraftSellPct() * (1 + sk.cb));
}

function getVPrice(key) {
  const meta = VANILLA_META[key]; if (!meta) return 0;
  const raw = gi(`vprice_${key}`); if (raw === 0) return 0;
  if (meta.blockToCraft) return (raw / SET_SIZE) / meta.blockToCraft;
  return meta.priceUnit === 'per_set' ? raw / SET_SIZE : raw;
}

function getSFPrice(tier) { return gi(`price_sf_${tier}`); }

function getAlchSellPrice(key) {
  const item = PRECISION_ALCHEMY[key]; if (!item) return 0;
  const sk = getSK();
  return Math.round(item.price * (1 + sk.ab));  // 희석액(0성) 포함 전 성급에 연금 보너스 적용
}

function calcSFCostForFinal(sfNeed) {
  let cost = 0;
  for (const [k, qty] of Object.entries(sfNeed)) {
    const m = k.match(/^(oyster|conch|octopus|seaweed|urchin)(\d)$/);
    if (!m) continue;
    cost += qty * getSFPrice(+m[2]);
  }
  return cost;
}


/* ════════════════════════════════════════
   ⑤ 스킬·각인석 변경 핸들러
════════════════════════════════════════ */
window.onSkillChange = () => {
  const st = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
  const sk = getSK();
  st('infoFurnace',     sk.fl === 0    ? '기본' : `Lv${sk.fl} — -${SKILLS.FURNACE.reductionPct[sk.fl]}%`);
  st('infoCraftBonus',  sk.cb_lv === 0 ? '기본' : `Lv${sk.cb_lv} — +${SKILLS.CRAFT_BONUS.bonusPct[sk.cb_lv]}%`);
  st('infoAlchBonus',   sk.ab_lv === 0 ? '기본' : `Lv${sk.ab_lv} — +${SKILLS.ALCH_BONUS.bonusPct[sk.ab_lv]}%`);
  st('infoDeepHarvest', sk.dh === 0    ? '기본' : `Lv${sk.dh} — +${sk.dhPct}%`);
  st('infoStarBonus',   sk.sb === 0    ? '기본' : `Lv${sk.sb} — +${sk.sbPct}%`);
  st('infoClamBonus',   sk.clm === 0   ? '기본' : `Lv${sk.clm} — +${sk.clmPct}%`);
  calcDaily();
  // 스킬 변경은 하루수익만 즉시 반영, 연금은 버튼으로 재계산
};
window.onEngChange = () => {
  const st = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
  const eng = getENG();
  st('infoClamSearch',     eng.cs === 0 ? '없음' : `+${eng.csPct}%`);
  const slD = ENGRAVING.SEAFOOD_LUCK.drops[eng.sl];
  st('infoSeafoodLuck',    eng.sl === 0 ? '없음' : slD ? `${slD.pct}%/+${slD.count}개` : '');
  st('infoFisherRoulette', eng.fr === 0 ? '없음' : `${eng.frPct}% 룰렛`);
  st('infoSpiritWhale',    eng.sw === 0 ? '없음' : `${eng.swPct}% 등장`);
  calcDaily();
};
window.onPriceChange  = () => { calcDaily(); };
window.onSFCostToggle = () => { saveAll(); };
window.onViewToggle   = () => { saveAll(); };


/* ════════════════════════════════════════
   ⑦ TAB0: 하루 수익 계산
════════════════════════════════════════ */
function calcClamEV() {
  let ev = 0;
  for (const [k, v] of Object.entries(CLAM.contents)) {
    if (k === 'shell') continue;
    ev += v.pct / 100 * getPearlPrice(k);
  }
  return ev;
}

window.calcDaily = () => {
  try {
    const sk = getSK(), eng = getENG();
    const rod = ROD[gi('rodLevel')] ?? ROD[0];
    const stamina = gi('totalStamina');
    const hc = stamina > 0 ? Math.floor(stamina / OCEAN.STAMINA_PER_USE) : 0;
    if (!hc) { document.getElementById('dailyRes').innerHTML = '<div class="empty-msg">스태미나를 입력하면 계산됩니다</div>'; return; }

    const deepX = sk.dhPct / 100;
    const luckX = eng.slPct / 100 * eng.slCnt;
    const roulX = eng.frPct / 100 * (0.9*3.5*ENGRAVING.FISHER_ROULETTE.normalMult + 0.1*3.5*ENGRAVING.FISHER_ROULETTE.goldenMult);
    const perH = rod.seafoodDrop + deepX + luckX + roulX;
    const total = hc * perH;

    const base1=60, base2=30, base3=10, extra3=sk.sbPct;
    const tierTotal = base1+base2+base3+extra3;
    const r1=base1/tierTotal, r2=base2/tierTotal, r3=(base3+extra3)/tierTotal;
    const cnt1=total*r1, cnt2=total*r2, cnt3=total*r3;

    const p1=getSFPrice(1), p2=getSFPrice(2), p3=getSFPrice(3);
    const sfRev = total*(r1*p1+r2*p2+r3*p3);

    const clamPct  = rod.clamPct+sk.clmPct+eng.csPct;
    const clamDrop = hc*(clamPct/100)*CLAM.dropPct/100;
    const clamEV   = calcClamEV();
    const clamRev  = clamDrop*clamEV;

    const whaleCount = hc*(eng.swPct/100);
    let whaleEV = 0;
    for (const [,drop] of Object.entries(ENGRAVING.SPIRIT_WHALE?.drops||{})) {
      if (drop.type==='craft') whaleEV+=drop.pct/100*getPearlPrice(drop.pearlKey);
    }
    const whaleRev = whaleCount*whaleEV;
    const totalRev = sfRev+clamRev+whaleRev;

    const parts=[];
    if(rod.seafoodDrop) parts.push(`낚싯대 ${rod.seafoodDrop}`);
    if(deepX) parts.push(`심해 +${fd(deepX,2)}`);
    if(luckX) parts.push(`행운 +${fd(luckX,2)}`);
    if(roulX) parts.push(`룰렛 +${fd(roulX,2)}`);

    document.getElementById('dailyRes').innerHTML=`
    <div class="rsec"><div class="rsec-title" style="color:var(--acc)">🦀 어패류 획득</div>
      <div class="rrow"><span class="rl">수중 어획 횟수</span><span class="rv">${f(hc)}회 <small style="color:var(--muted)">(${f(stamina)}÷15)</small></span></div>
      <div class="rrow"><span class="rl">회당 기댓값</span><span class="rv">${fd(perH,2)}개 <small style="color:var(--muted)">${parts.join(' / ')}</small></span></div>
      <div class="rrow"><span class="rl">총 어패류</span><span class="rv">${fmtQty(total)}</span></div>
      <div class="rrow"><span class="rl" style="padding-left:8px">└ 1성 ★</span><span class="rv" style="color:var(--muted)">${fmtQty(cnt1)} <small>(${fd(r1*100,1)}%)</small></span></div>
      <div class="rrow"><span class="rl" style="padding-left:8px">└ 2성 ★★</span><span class="rv" style="color:var(--muted)">${fmtQty(cnt2)} <small>(${fd(r2*100,1)}%)</small></span></div>
      <div class="rrow"><span class="rl" style="padding-left:8px">└ 3성 ★★★</span><span class="rv" style="color:var(--acc)">${fmtQty(cnt3)} <small>(${fd(r3*100,1)}%)</small></span></div>
      <div class="rrow rrow-strong"><span class="rl">어패류 수익</span><span class="rv g">${f(sfRev)}원</span></div>
    </div>
    ${clamDrop>0.01?`<div class="rsec"><div class="rsec-title" style="color:var(--acc)">🐚 알쏭달쏭 조개</div>
      <div class="rrow"><span class="rl">등장 횟수</span><span class="rv">${fd(hc*clamPct/100,1)}마리 <small style="color:var(--muted)">(${rod.clamPct}%낚싯대+${sk.clmPct}%스킬+${eng.csPct}%각인)</small></span></div>
      <div class="rrow"><span class="rl">조개 드롭 수 (50%)</span><span class="rv">${fd(clamDrop,1)}개</span></div>
      <div class="rrow"><span class="rl">개당 기댓값</span><span class="rv"><b>${f(Math.round(clamEV))}원</b> <small style="color:var(--muted)">(공예품 최고가 × 95% × 판매보너스 반영)</small></span></div>
      <div class="rrow rrow-strong"><span class="rl">오늘 예상 수익</span><span class="rv g">${f(clamRev)}원</span></div>
    </div>`:''}
    ${whaleCount>0.001?`<div class="rsec"><div class="rsec-title" style="color:var(--acc)">🐋 정령 고래</div>
      <div class="rrow"><span class="rl">등장 횟수</span><span class="rv">${fd(whaleCount,2)}번</span></div>
      <div class="rrow"><span class="rl">개당 기댓값</span><span class="rv"><b>${f(Math.round(whaleEV))}원</b></span></div>
      <div class="rrow rrow-strong"><span class="rl">오늘 예상 수익</span><span class="rv g">${f(whaleRev)}원</span></div>
    </div>`:''}
    <div class="result-box"><div style="display:flex;gap:0;flex-wrap:wrap">
      <div style="flex:1;min-width:80px;text-align:center;padding:4px 8px"><div class="rb-label">어패류 수익</div><div class="rb-value" style="font-size:18px">${f(sfRev)}원</div></div>
      ${clamRev>0?`<div style="width:1px;background:var(--bdr2);margin:4px 0"></div><div style="flex:1;min-width:80px;text-align:center;padding:4px 8px"><div class="rb-label">진주 수익</div><div class="rb-value" style="font-size:18px">${f(clamRev)}원</div></div>`:''}
      ${whaleRev>0?`<div style="width:1px;background:var(--bdr2);margin:4px 0"></div><div style="flex:1;min-width:80px;text-align:center;padding:4px 8px"><div class="rb-label">🐋 고래 수익</div><div class="rb-value" style="font-size:18px">${f(whaleRev)}원</div></div>`:''}
    </div>
    <div style="text-align:center;margin-top:8px;padding-top:8px;border-top:1px dashed var(--bdr2)">
      <div class="rb-label">하루 합계</div><div class="rb-value" style="color:var(--grn)">${f(totalRev)}원</div>
    </div></div>`;
    try { document.getElementById('dailyRes').innerHTML += window.buildStaminaRecHtml(); } catch(e){}
  } catch(err) {
    document.getElementById('dailyRes').innerHTML='<div class="empty-msg" style="color:var(--red)">계산 오류: '+err.message+'</div>';
    console.error('calcDaily error:',err);
  }
};


/* ════════════════════════════════════════
   ⑧ TAB2: 연금 최적화
════════════════════════════════════════ */

function calcSFNeedForFinal(fKey) {
  const fRec = PRECISION_ALCHEMY[fKey]; if (!fRec) return {};
  return calcSFNeedFromMats(fRec.materials);
}

function calcSFNeedForFinal_single(alchemyKey) {
  const rec = ALCHEMY[alchemyKey]; if (!rec) return {};
  return calcSFNeedFromMats({[alchemyKey]: 1});
}

function calcSFNeedFromMats(materials) {
  const SF_SET = new Set(SF_TYPES.flatMap(sf => SF_TIERS.map(t => `${sf}${t}`)));
  const need = {};
  function expand(key, qty, depth=0) {
    if (depth > 15 || qty <= 0) return;
    if (SF_SET.has(key)) { need[key] = (need[key]||0) + qty; return; }
    const rec = ALCHEMY[key]; if (!rec) return;
    const output = rec.output || 1;
    const batches = qty / output;
    for (const [mk, mq] of Object.entries(rec.materials))
      expand(mk, mq * batches, depth+1);
  }
  for (const [mk, mq] of Object.entries(materials)) expand(mk, mq);
  return need;
}

/* 로딩 UI 헬퍼 */
function showOptLoading(pct, msg) {
  const el = document.getElementById('optRes'); if (!el) return;
  const bar = Math.round(pct);
  el.innerHTML = `
    <div style="padding:24px 12px;text-align:center">
      <div style="font-family:'Jua',sans-serif;font-size:15px;color:var(--acc);margin-bottom:14px">⚗️ ${msg}</div>
      <div style="background:var(--bdr);border-radius:20px;height:16px;overflow:hidden;margin:0 auto;max-width:280px">
        <div style="height:100%;width:${bar}%;background:linear-gradient(90deg,var(--acc),var(--acc2));border-radius:20px;transition:width .15s ease"></div>
      </div>
      <div style="font-family:'Jua',sans-serif;font-size:22px;color:var(--acc);margin-top:10px">${bar}%</div>
      <div style="font-size:10px;color:var(--muted);margin-top:4px;font-weight:500">탐색 중…</div>
    </div>`;
}

/* ── 계산 결과 캐시 (토글 변경 시 재렌더링에 사용) ── */
let _cachedOptResult = null; // { planEntries, finalAnalysis, workInv, totalRev, totalVan, inv }

/* calcOpt 버튼 핸들러 (비동기) */
window.runCalcOpt = async () => {
  const btn = document.getElementById('calcOptBtn');
  if (btn) { btn.disabled=true; btn.textContent='계산 중…'; }
  showOptLoading(0, '준비 중');
  await new Promise(r => setTimeout(r, 30));
  try { await calcOpt(); }
  finally {
    if (btn) { btn.disabled=false; btn.textContent='🔍 최적화 계산'; }
  }
};

/* 토글 변경 시: 캐시된 결과로 즉시 재렌더링 */
window.onSFCostToggle = () => {
  saveAll();
  if (_cachedOptResult) renderOptResult(_cachedOptResult);
};
window.onViewToggle = () => {
  saveAll();
  if (_cachedOptResult) renderOptResult(_cachedOptResult);
};
window.onEssFirstToggle = () => {
  saveAll();
  if (_cachedOptResult) renderOptResult(_cachedOptResult);
};

async function calcOpt() {
  const inv = {};
  const intermHave = {};
  const useProc = document.getElementById('useProcToggle')?.checked ?? false;
  const sfHave = {}; // 순수 어패류 보유량 (중간재료 환산분 제외) — 후처리 초과 비교용

  if (!useProc) {
    /* ── 어패류 입력 모드 (기존) ── */
    for (const sf of SF_TYPES) for (const t of SF_TIERS) {
      const v = readSplitQty(`have_${sf}_${t}`);
      if (v > 0) inv[`${sf}${t}`] = (inv[`${sf}${t}`]||0) + v;
    }
    // 순수 어패류 보유량 별도 저장
    Object.assign(sfHave, inv);

    // 중간재료 수집 후 하위 어패류로 전개
    document.querySelectorAll('#intermList .interm-row').forEach(row => {
      const sel=row.querySelector('select.interm-sel');if(!sel)return;
      const key=sel.value;if(!key)return;
      const rid=row.id.replace('irow_','');
      const qty=readSplitQty('iqty_'+rid);
      if(qty>0)intermHave[key]=(intermHave[key]||0)+qty;
    });
    {
      const SF_SET = new Set(SF_TYPES.flatMap(sf => SF_TIERS.map(t => `${sf}${t}`)));
      function expandIntermToSF(key, qty, depth=0) {
        if (depth > 15 || qty <= 0) return;
        if (SF_SET.has(key)) { inv[key] = (inv[key]||0) + qty; return; }
        const rec = ALCHEMY[key]; if (!rec) return;
        const output = rec.output || 1;
        const batches = qty / output;
        for (const [mk, mq] of Object.entries(rec.materials))
          expandIntermToSF(mk, mq * batches, depth+1);
      }
      for (const [key, qty] of Object.entries(intermHave)) expandIntermToSF(key, qty);
    }
  } else {
    /* ── 1차 가공품 직접 입력 모드 ── */
    for (const grp of PROC_GROUPS) {
      for (const it of grp.items) {
        const qty = readSplitQty('proc_'+it.key);
        if (qty <= 0) continue;
        const rec = ALCHEMY[it.key]; if (!rec) continue;
        const batches = qty / (rec.output || 1); // 소수 허용
        for (const [mk, mq] of Object.entries(rec.materials)) {
          const sfMatch = mk.match(/^(oyster|conch|octopus|seaweed|urchin)(\d)$/);
          if (sfMatch) {
            inv[mk] = (inv[mk]||0) + mq * batches;
          }
        }
      }
    }
    // 중간재료 읽기 (어패류 + 핵·결정·영약)
    document.querySelectorAll('#intermList .interm-row').forEach(row => {
      const sel=row.querySelector('select.interm-sel');if(!sel)return;
      const key=sel.value;if(!key)return;
      const rid=row.id.replace('irow_','');
      const qty=readSplitQty('iqty_'+rid);
      if(qty>0)intermHave[key]=(intermHave[key]||0)+qty;
    });
    const SF_SET2 = new Set(SF_TYPES.flatMap(sf => SF_TIERS.map(t => `${sf}${t}`)));
    for (const [key, qty] of Object.entries(intermHave)) {
      if (SF_SET2.has(key) || ALCHEMY[key]) inv[key] = (inv[key]||0) + qty;
    }
    SF_TYPES.flatMap(sf => SF_TIERS.map(t => `${sf}${t}`)).forEach(k => {
      if (inv[k] > 0) sfHave[k] = inv[k];
    });
  }

  const SF_KEYS = SF_TYPES.flatMap(sf => SF_TIERS.map(t => `${sf}${t}`));
  const sfTotal     = SF_KEYS.reduce((s,k)=>s+(inv[k]||0),0);
  const intermTotal = Object.keys(inv).filter(k=>ALCHEMY[k]).reduce((s,k)=>s+(inv[k]||0),0);
  if (sfTotal<=0&&intermTotal<=0) {
    document.getElementById('optRes').innerHTML=`<div class="empty-msg">${useProc?'1차 가공품 수량을 입력하면 계산됩니다':'보유 어패류를 입력하면 계산됩니다'}</div>`;
    return;
  }

  const includeSFCost = document.getElementById('sfCostToggle')?.checked      ?? false;

  function consumeSF(sfKey, need, curInv) {
    const needInt = Math.ceil(need);
    const m=sfKey.match(/^(oyster|conch|octopus|seaweed|urchin)(\d)$/); if(!m)return false;
    const sf=m[1], tier=+m[2];
    let have=curInv[sfKey]||0, remaining=needInt-have;
    if(remaining<=0){curInv[sfKey]=have-needInt;return true;}
    if(remaining>0)return false;
    curInv[sfKey]=have-needInt;return true;
  }
  function canAffordSF(sfNeed,curInv){const tmp={...curInv};for(const[k,v]of Object.entries(sfNeed))if(!consumeSF(k,v,tmp))return false;return true;}
  function doConsumeSF(sfNeed,curInv){for(const[k,v]of Object.entries(sfNeed))consumeSF(k,v,curInv);}

  function maxMake(sfNeed, curInv) {
    let m = Infinity;
    for (const [sf, need] of Object.entries(sfNeed)) {
      if (need <= 0) continue;
      const needInt = Math.ceil(need);
      let avail = curInv[sf] || 0;
      m = Math.min(m, Math.floor(avail / needInt));
    }
    return m === Infinity ? 0 : m;
  }

  function calcVanillaCost(fKey) {
    const fRec=PRECISION_ALCHEMY[fKey]; if(!fRec)return 0;
    let cost=0;
    function expand(key,qty,depth=0){if(depth>12)return;if(VANILLA_META[key]){cost+=qty*getVPrice(key);return;}if(SF_KEYS.includes(key))return;const rec=ALCHEMY[key];if(!rec)return;const b=Math.ceil(qty/(rec.output||1));for(const[mk,mq]of Object.entries(rec.materials))expand(mk,mq*b,depth+1);}
    for(const[mk,mq]of Object.entries(fRec.materials))expand(mk,mq);
    return cost;
  }

  showOptLoading(5, '아이템 분석 중');
  await new Promise(r => setTimeout(r, 20));

  // 최종산물 분석
  const finalAnalysis = {};
  for (const [fKey, fRec] of Object.entries(PRECISION_ALCHEMY)) {
    const sfNeed = calcSFNeedForFinal(fKey);
    const step2={}, step3={};
    for(const[mk,mq]of Object.entries(fRec.materials)){
      const rec=ALCHEMY[mk];if(!rec)continue;
      if(rec.type==='compound'){
        step3[mk]=(step3[mk]||0)+mq;
        const b3=Math.ceil(mq/(rec.output||1));
        for(const[mk2,mq2]of Object.entries(rec.materials)){const rec2=ALCHEMY[mk2];if(rec2&&rec2.type==='essence')step2[mk2]=(step2[mk2]||0)+mq2*b3;}
      } else if(rec.type==='essence'){step2[mk]=(step2[mk]||0)+mq;}
    }
    const sellPrice=getAlchSellPrice(fKey);
    const vanCost=calcVanillaCost(fKey);
    const sfCost=calcSFCostForFinal(sfNeed);
    const netPerUnit=sellPrice-vanCost-(includeSFCost?sfCost:0);
    finalAnalysis[fKey]={name:fRec.name,tier:fRec.tier,sfNeed,vanCost,sfCost,sellPrice,netPerUnit,step2,step3,craftTimeSec:fRec.craftTimeSec||0};
  }

  const allFKeys = Object.keys(finalAnalysis);

  function solveLinearPlan(startInv, zeroRev, zeroPlan) {
    const tier2K = nonZeroKeys.filter(k => finalAnalysis[k].tier === 2);
    const tier3K = nonZeroKeys.filter(k => finalAnalysis[k].tier === 3);
    const tier1K = nonZeroKeys.filter(k => finalAnalysis[k].tier === 1);

    function solveExact(items, ti, inv2) {
      if(!items.length) return null;
      const SF_TYPES_LOCAL = ['oyster','conch','octopus','seaweed','urchin'];
      const stock = SF_TYPES_LOCAL.map(sf => inv2[`${sf}${ti}`] || 0);
      const n = items.length;

      const A = items.map(k =>
        SF_TYPES_LOCAL.map(sf => {
          const need = finalAnalysis[k].sfNeed[`${sf}${ti}`];
          return need ? Math.ceil(need) : 0;
        })
      );

      const activeSF = SF_TYPES_LOCAL
        .map((sf, si) => ({ si, stock: stock[si], total: items.reduce((s,_,ii)=>s+A[ii][si],0) }))
        .filter(x => x.total > 0 && x.stock > 0);

      if (activeSF.length < n) return null;

      function det2x2(m) { return m[0][0]*m[1][1] - m[0][1]*m[1][0]; }
      function det3x3([[a,b2,c],[d,e,f_],[g,h,ii]]) {
        return a*(e*ii-f_*h) - b2*(d*ii-f_*g) + c*(d*h-e*g);
      }
      function replaceCol(M,col,bVec){ return M.map((row,i)=>row.map((v,j)=>j===col?bVec[i]:v)); }

      function trySolve(chosen) {
        const Asq = chosen.map(({si})=>items.map((_,ii)=>A[ii][si]));
        const b = chosen.map(({stock})=>stock);
        let detFn;
        if(n===1) return [Math.max(0, Math.round(b[0]/(Asq[0][0]||1)))];
        if(n===2) detFn=det2x2;
        else if(n===3) detFn=det3x3;
        else return null;
        const D=detFn(Asq);
        if(Math.abs(D)<0.001) return null;
        let sol = Array.from({length:n},(_,i)=>Math.max(0,Math.round(detFn(replaceCol(Asq,i,b))/D)));
        for(let iter=0;iter<30;iter++){
          let wo=0,wsi=-1;
          for(let si=0;si<5;si++){const over=items.reduce((s,_,ii)=>s+A[ii][si]*sol[ii],0)-stock[si];if(over>wo){wo=over;wsi=si;}}
          if(wsi<0)break;
          let wi=-1, minRatio=Infinity;
          for(let ii=0;ii<n;ii++){
            if(A[ii][wsi]>0 && sol[ii]>0){
              const ratio = finalAnalysis[items[ii]].sellPrice / A[ii][wsi];
              if(ratio < minRatio){ minRatio=ratio; wi=ii; }
            }
          }
          if(wi<0)break;
          sol[wi]=Math.max(0,sol[wi]-Math.ceil(wo/A[wi][wsi]));
        }
        return sol;
      }

      let bestSol = null, bestRev = -1;
      function combinations(arr, k) {
        if(k===0) return [[]];
        if(arr.length<k) return [];
        const [first,...rest] = arr;
        return [...combinations(rest,k-1).map(c=>[first,...c]), ...combinations(rest,k)];
      }
      const combos = combinations(activeSF, n);
      for(const chosen of combos){
        const sol = trySolve(chosen);
        if(!sol) continue;
        const rev = sol.reduce((s,x,i)=>s+x*finalAnalysis[items[i]].sellPrice,0);
        if(rev > bestRev){ bestRev=rev; bestSol=sol; }
      }
      return bestSol;
    }

    const curInv = {...startInv};
    const curPlan = {...zeroPlan};
    let rev = zeroRev;

    for (const [tierK, ti] of [[tier3K, 3], [tier2K, 2], [tier1K, 1]]) {
      if (!tierK.length) continue;
      const sortedTK = [...tierK].sort((a,b) => finalAnalysis[b].sellPrice - finalAnalysis[a].sellPrice);
      const sol = solveExact(sortedTK, ti, curInv);
      if (!sol) continue;

      const tmpInv = {...curInv};
      const made = [];
      let feasible = true;
      for (let i = 0; i < sortedTK.length; i++) {
        const k = sortedTK[i];
        const n = Math.min(sol[i] || 0, maxMake(finalAnalysis[k].sfNeed, tmpInv));
        if (n < 0) { feasible = false; break; }
        made.push([k, n]);
        for (let j = 0; j < n; j++) doConsumeSF(finalAnalysis[k].sfNeed, tmpInv);
      }
      if (!feasible) continue;

      for (const [k, n] of made) {
        curPlan[k] = n;
        rev += n * finalAnalysis[k].sellPrice;
        for (let j = 0; j < n; j++) doConsumeSF(finalAnalysis[k].sfNeed, curInv);
      }
    }
    return { plan: curPlan, rev, remInv: curInv };
  }

  const excludeDiluted = document.getElementById('excludeDilutedToggle')?.checked ?? false;
  const nonZeroKeys   = allFKeys.filter(k => finalAnalysis[k].tier !== 0);
  const zeroKeys      = excludeDiluted ? [] : allFKeys.filter(k => finalAnalysis[k].tier === 0);

  const maxDilutedForInit = zeroKeys.length > 0
    ? zeroKeys.reduce((mn,k) => Math.min(mn, maxMake(finalAnalysis[k].sfNeed, {...inv})), Infinity)
    : 0;

  showOptLoading(10, '연립방정식 탐색 중');
  await new Promise(r => setTimeout(r, 20));

  let bestRev  = 0;
  let bestPlan = Object.fromEntries(allFKeys.map(k=>[k,0]));
  let workInv  = {...inv};

  const maxDiluted = maxDilutedForInit;
  let lastYield = Date.now();

  for (let d = 0; d <= (maxDiluted === Infinity ? 0 : maxDiluted); d++) {
    const invAfterZero = {...inv};
    let zeroRev = 0;
    const zeroPlan = Object.fromEntries(allFKeys.map(k=>[k,0]));
    let ok = true;
    for (const zk of zeroKeys) {
      for (let i = 0; i < d; i++) {
        if (!canAffordSF(finalAnalysis[zk].sfNeed, invAfterZero)) { ok = false; break; }
        doConsumeSF(finalAnalysis[zk].sfNeed, invAfterZero);
      }
      if (!ok) break;
      zeroPlan[zk] = d;
      zeroRev += d * finalAnalysis[zk].sellPrice;
    }
    if (!ok) break;

    const now2 = Date.now();
    if (now2 - lastYield > 100) {
      showOptLoading(
        Math.min(95, 20 + Math.round((d / Math.max(maxDiluted, 1)) * 75)),
        `0성 ${d}/${maxDiluted}개 탐색 중 · 최선 ${f(bestRev)}원`
      );
      await new Promise(r => setTimeout(r, 0));
      lastYield = now2;
    }

    const lsSol = solveLinearPlan(invAfterZero, zeroRev, zeroPlan);
    if (lsSol && lsSol.rev > bestRev) {
      bestRev = lsSol.rev;
      bestPlan = {...lsSol.plan};
      workInv  = {...lsSol.remInv};
    }
  }

  showOptLoading(97, `계산 완료 · 최선 ${f(bestRev)}원`);
  await new Promise(r => setTimeout(r, 20));
  await new Promise(r => setTimeout(r, 20));

  const essMaxMap = {};
  {
    const sfToEss1 = {oyster1:'essence_guardian1',conch1:'essence_wave1',octopus1:'essence_chaos1',seaweed1:'essence_life1',urchin1:'essence_corrosion1'};
    const sfToEss2 = {oyster2:'essence_guardian2',conch2:'essence_wave2',octopus2:'essence_chaos2',seaweed2:'essence_life2',urchin2:'essence_corrosion2'};
    const sfToEss3 = {oyster3:'elixir_guardian',  conch3:'elixir_wave',  octopus3:'elixir_chaos',  seaweed3:'elixir_life',  urchin3:'elixir_corrosion'};
    for (const [sf, essKey] of Object.entries(sfToEss1)) {
      const sfQty = sfHave[sf] || 0;
      const fromSF = Math.floor(sfQty / 2) * 2;
      const fromHave = intermHave[essKey] || 0;
      essMaxMap[essKey] = fromSF + fromHave;
    }
    for (const [sf, essKey] of Object.entries(sfToEss2)) {
      const sfQty = sfHave[sf] || 0;
      const fromSF = Math.floor(sfQty / 2) * 2;
      const fromHave = intermHave[essKey] || 0;
      essMaxMap[essKey] = fromSF + fromHave;
    }
    for (const [sf, essKey] of Object.entries(sfToEss3)) {
      const sfQty = sfHave[sf] || 0;
      const fromSF = sfQty;
      const fromHave = intermHave[essKey] || 0;
      essMaxMap[essKey] = fromSF + fromHave;
    }
  }

  {
    const SF_KEYS_SET = new Set(SF_KEYS);
    let adjusted = true;
    while (adjusted) {
      adjusted = false;
      const essConsumed = {};
      const sfDirectConsumed = {};
      for (const [fKey, cnt] of Object.entries(bestPlan)) {
        if (cnt <= 0) continue;
        const fRec = PRECISION_ALCHEMY[fKey]; if (!fRec) continue;
        function walkForSF(key, qty) {
          if (!key || qty <= 0) return;
          if (SF_KEYS_SET.has(key)) { sfDirectConsumed[key] = (sfDirectConsumed[key]||0) + qty; return; }
          const rec = ALCHEMY[key]; if (!rec) return;
          const output = rec.output || 1;
          if (rec.type === 'essence') {
            essConsumed[key] = (essConsumed[key]||0) + qty; return;
          }
          for (const [mk, mq] of Object.entries(rec.materials)) walkForSF(mk, mq * qty / output);
        }
        for (const [mk, mq] of Object.entries(fRec.materials)) walkForSF(mk, mq * cnt);
      }

      let overKey = null;
      let overType = null;

      for (const [essKey, needed] of Object.entries(essConsumed)) {
        const max = essMaxMap[essKey] ?? 0;
        if (needed > max) { overKey = essKey; overType = 'essence'; break; }
      }
      if (!overKey) {
        for (const sf of SF_KEYS) {
          if ((sfDirectConsumed[sf] || 0) > (sfHave[sf] || 0)) {
            overKey = sf; overType = 'sf'; break;
          }
        }
      }

      if (!overKey) break;

      let minRev = Infinity, minFKey = null;
      for (const [fKey, cnt] of Object.entries(bestPlan)) {
        if (cnt <= 0) continue;
        let uses = false;
        function checkUses(key, qty) {
          if (!key || qty <= 0 || uses) return;
          if (key === overKey) { uses = true; return; }
          const rec = ALCHEMY[key]; if (!rec) return;
          if (rec.type === 'essence' && overType === 'essence') return;
          for (const [mk, mq] of Object.entries(rec.materials)) checkUses(mk, mq);
        }
        const fRec = PRECISION_ALCHEMY[fKey];
        for (const [mk, mq] of Object.entries(fRec.materials)) checkUses(mk, mq);
        if (uses && finalAnalysis[fKey].sellPrice < minRev) {
          minRev = finalAnalysis[fKey].sellPrice;
          minFKey = fKey;
        }
      }
      if (!minFKey) {
        for (const [fKey, cnt] of Object.entries(bestPlan)) {
          if (cnt <= 0) continue;
          const need = finalAnalysis[fKey].sfNeed[overKey] || 0;
          if (need > 0 && finalAnalysis[fKey].sellPrice < minRev) {
            minRev = finalAnalysis[fKey].sellPrice;
            minFKey = fKey;
          }
        }
      }
      if (minFKey) {
        bestPlan[minFKey] = Math.max(0, bestPlan[minFKey] - 1);
        adjusted = true;
      } else break;
    }
  }

  workInv = {...inv};
  for (const [fKey, cnt] of Object.entries(bestPlan)) {
    if (cnt <= 0) continue;
    for (let j = 0; j < cnt; j++) doConsumeSF(finalAnalysis[fKey].sfNeed, workInv);
  }

  const planEntries=Object.entries(bestPlan).filter(([,cnt])=>cnt>0)
    .sort((a,b)=>{
      const ta=finalAnalysis[a[0]].tier, tb=finalAnalysis[b[0]].tier;
      const ra=ta===0?99:ta, rb=tb===0?99:tb;
      return ra-rb || finalAnalysis[b[0]].sellPrice-finalAnalysis[a[0]].sellPrice;
    });

  if(!planEntries.length){
    _cachedOptResult = null;
    document.getElementById('optRes').innerHTML=`<div class="empty-msg">재료가 부족하여 만들 수 있는 연금품이 없습니다<br><small style="font-weight:500">${useProc?'1차 가공품 보유량을 확인해주세요':'어패류 보유량을 확인해주세요'}</small></div>`;
    return;
  }

  const totalRev=planEntries.reduce((s,[k,cnt])=>s+finalAnalysis[k].sellPrice*cnt,0);

  const totalVan={};
  function collectVan(key,qty,depth=0){if(depth>12)return;if(VANILLA_META[key]){totalVan[key]=(totalVan[key]||0)+qty;return;}const rec=ALCHEMY[key];if(!rec)return;if(useProc&&rec.type==='essence')return;const b=Math.ceil(qty/(rec.output||1));for(const[mk,mq]of Object.entries(rec.materials))collectVan(mk,mq*b,depth+1);}
  for(const[fKey,cnt]of planEntries)for(const[mk,mq]of Object.entries(PRECISION_ALCHEMY[fKey].materials))collectVan(mk,mq*cnt);

  _cachedOptResult = { planEntries, finalAnalysis, workInv: {...workInv}, totalRev, totalVan, SF_KEYS, inv, intermHave };

  renderOptResult(_cachedOptResult);
}

/* ════════════════════════════════════════
   renderOptResult — 캐시된 결과를 토글 상태에 맞게 렌더링
════════════════════════════════════════ */
function renderOptResult({ planEntries, finalAnalysis, workInv, totalRev, totalVan, SF_KEYS, inv, intermHave={} }) {
  const includeSFCost = document.getElementById('sfCostToggle')?.checked      ?? false;
  const useProc       = document.getElementById('useProcToggle')?.checked      ?? false;

  for (const fKey of Object.keys(finalAnalysis)) {
    const fa = finalAnalysis[fKey];
    fa.netPerUnit = fa.sellPrice - fa.vanCost - (includeSFCost ? fa.sfCost : 0);
  }

  const fr = getSK().fr;
  let alchSec = 0, precSec = 0;
  for (const [k, cnt] of planEntries) {
    const fa = finalAnalysis[k];
    precSec += cnt * (fa.craftTimeSec || 0);
    for (const [mk, mq] of Object.entries(fa.step2)) {
      const r = ALCHEMY[mk]; if (r) alchSec += Math.ceil((mq*cnt)/(r.output||1)) * (r.craftTimeSec||0);
    }
    for (const [mk, mq] of Object.entries(fa.step3)) {
      const r = ALCHEMY[mk]; if (r) alchSec += (mq*cnt) * (r.craftTimeSec||0);
    }
  }
  alchSec *= (1-fr);
  precSec *= (1-fr);

  const sfColors={oyster:'#3d6fd4',conch:'#c89c00',octopus:'#7c52c8',seaweed:'#d94f3d',urchin:'#3a9e68'};
  const tierColors={
    0:'#c8920a',
    1:'#1e9e58',
    2:'#2060c8',
    3:'#c82828',
  };
  const finColors={
    LEVIATHAN: '#1e9e58', KRAKEN: '#1e9e58', AQUTIS: '#1e9e58',
    SEA_WING:  '#2060c8', DEEP_VIAL: '#2060c8', WAVE_CORE: '#2060c8',
    ABYSS_SPINE:'#c82828', NAUTILUS: '#c82828', AQUA_PULSE: '#c82828',
  };
  const compoundColors={
    core_guard:    '#4db8e8', core_wave:'#f0853a', core_chaos:'#9060c8', core_life:'#c03040', core_corrosion:'#48c070',
    crystal_vitality:'#4db8e8', crystal_erosion:'#f0853a', crystal_defense:'#9060c8', crystal_torrent:'#c03040', crystal_poison:'#48c070',
    potion_immortal:'#4db8e8', potion_barrier:'#f0853a', potion_corrupt:'#9060c8', potion_frenzy:'#c03040', potion_venom:'#48c070',
  };
  const essOrder1=['essence_guardian1','essence_wave1','essence_chaos1','essence_life1','essence_corrosion1'];
  const essOrder2=['essence_guardian2','essence_wave2','essence_chaos2','essence_life2','essence_corrosion2'];
  const essOrder3=['elixir_guardian','elixir_wave','elixir_chaos','elixir_life','elixir_corrosion'];
  const coreOrder=['core_guard','core_wave','core_chaos','core_life','core_corrosion'];
  const crysOrder=['crystal_vitality','crystal_erosion','crystal_defense','crystal_torrent','crystal_poison'];
  const potiOrder=['potion_immortal','potion_barrier','potion_corrupt','potion_frenzy','potion_venom'];
  const fin1Order=['AQUTIS','KRAKEN','LEVIATHAN'];
  const fin2Order=['WAVE_CORE','DEEP_VIAL','SEA_WING'];
  const fin3Order=['AQUA_PULSE','NAUTILUS','ABYSS_SPINE'];

  function sortedEntries(aggMap, orderArr) {
    const present = Object.entries(aggMap).filter(([,v])=>v>0);
    if (!orderArr) return present;
    const ordered = orderArr.filter(k=>aggMap[k]>0).map(k=>[k,aggMap[k]]);
    const rest = present.filter(([k])=>!orderArr.includes(k));
    return [...ordered,...rest];
  }
  const tierLabels=['0성','★ 1성','★★ 2성','★★★ 3성'];

  function getSFMatch(k){return k.match(/^(oyster|conch|octopus|seaweed|urchin)(\d)$/);}
  function getSFName(k){const m=getSFMatch(k);if(!m)return null;return (SEAFOOD_TYPES[m[1]]?.name||m[1])+' '+'★'.repeat(+m[2]);}
  const SHORT_NAMES={
    coral_dead_tube:'관 산호', coral_dead_brain:'사방산호',
    coral_dead_bubble:'거품 산호', coral_dead_fire:'불 산호', coral_dead_horn:'뇌 산호',
    spruce_leaf:'가문비 잎', dark_oak_leaf:'짙참 잎',
  };
  function getMatName(k){return SHORT_NAMES[k]||getSFName(k)||VANILLA_META[k]?.name||ALCHEMY[k]?.name||k;}
  function getMatColor(k){const m=getSFMatch(k);if(m)return sfColors[m[1]];if(compoundColors[k])return compoundColors[k];if(VANILLA_META[k])return '#607090';if(ALCHEMY[k])return ALCHEMY[k].color||'#607090';return '#607090';}
  function chip(key,qty,qtyStr){const color=getMatColor(key),name=getMatName(key),qs=qtyStr||(qty!=null?fmtQty(qty):'');return `<span class="mat-chip-flow" style="--chip-color:${color}"><span class="chip-name">${name}</span><span class="chip-qty">${qs}</span></span>`;}
  const plus='<span class="flow-plus">+</span>';
  const arrow='<span class="flow-arrow">→</span>';

  const netLabel=includeSFCost
    ?'순이익 <small style="font-weight:500;font-size:9px">(어패류+바닐라)</small>'
    :'순이익 <small style="font-weight:500;font-size:9px">(바닐라만)</small>';

  let html='';

    const aggRemain={...intermHave};

    const agg={ess1:{},core:{},fin1:{},ess2:{},crys:{},fin2:{},ess3:{},poti:{},fin3:{},fin0:{}};
    const timeSec={ess1:0,core:0,fin1:0,ess2:0,crys:0,fin2:0,ess3:0,poti:0,fin3:0,fin0:0};
    const aggSaved={ess1:{},core:{},fin1:{},ess2:{},crys:{},fin2:{},ess3:{},poti:{},fin3:{},fin0:{}};

    for(const[fKey,cnt]of planEntries){
      if(cnt<=0)continue;
      const fa=finalAnalysis[fKey],fRec=PRECISION_ALCHEMY[fKey],tier=fa.tier;
      const finKey=`fin${tier}`;
      agg[finKey][fKey]=(agg[finKey][fKey]||0)+cnt;
      timeSec[finKey]+=cnt*(fa.craftTimeSec||0);

      for(const[mk2,mq2]of Object.entries(fRec.materials)){
        const rec2=ALCHEMY[mk2];if(!rec2)continue;
        let totalMk2=mq2*cnt;

        if(rec2.type==='compound'){
          const slotKey=rec2.tier===1?'core':rec2.tier===2?'crys':'poti';
          const haveComp=aggRemain[mk2]||0;
          const useComp=Math.min(haveComp,totalMk2);
          if(useComp>0){
            aggRemain[mk2]-=useComp;
            aggSaved[slotKey][mk2]=(aggSaved[slotKey][mk2]||0)+useComp;
          }
          const netMk2=totalMk2-useComp;
          agg[slotKey][mk2]=(agg[slotKey][mk2]||0)+netMk2;
          timeSec[slotKey]+=netMk2*(rec2.craftTimeSec||0);
          for(const[mk3,mq3]of Object.entries(rec2.materials)){
            const rec3=ALCHEMY[mk3];if(!rec3||rec3.type!=='essence')continue;
            const essKey=rec3.tier===1?'ess1':rec3.tier===2?'ess2':'ess3';
            const needEss=mq3*netMk2;
            const haveEss=aggRemain[mk3]||0;
            const useEss=Math.min(haveEss,needEss);
            if(useEss>0){
              aggRemain[mk3]-=useEss;
              aggSaved[essKey][mk3]=(aggSaved[essKey][mk3]||0)+useEss;
            }
            const netEss=needEss-useEss;
            agg[essKey][mk3]=(agg[essKey][mk3]||0)+netEss;
            timeSec[essKey]+=netEss*(rec3.craftTimeSec||0)/(rec3.output||1);
          }
        } else if(rec2.type==='essence'){
          const essKey=rec2.tier===1?'ess1':rec2.tier===2?'ess2':'ess3';
          const haveEss=aggRemain[mk2]||0;
          const useEss=Math.min(haveEss,totalMk2);
          if(useEss>0){
            aggRemain[mk2]-=useEss;
            aggSaved[essKey][mk2]=(aggSaved[essKey][mk2]||0)+useEss;
          }
          const netEss=totalMk2-useEss;
          agg[essKey][mk2]=(agg[essKey][mk2]||0)+netEss;
          timeSec[essKey]+=netEss*(rec2.craftTimeSec||0)/(rec2.output||1);
        }
      }
    }

    function stageSection(label,emoji,aggMap,secKey,accentColor,orderArr,chunkSize){
      const entries=sortedEntries(aggMap,orderArr);
      if(!entries.length)return'';
      let tSec = 0;
      for (const [key] of entries) {
        const rec = ALCHEMY[key] || PRECISION_ALCHEMY[key];
        const qty = aggMap[key] || 0;
        if (!rec) continue;
        const output = rec.output || 1;
        const isPA = !!PRECISION_ALCHEMY[key];
        if (isPA) {
          tSec += qty * (rec.craftTimeSec || 0);
        } else if (output > 1) {
          tSec += Math.ceil(qty / output) * (rec.craftTimeSec || 0);
        } else {
          tSec += qty * (rec.craftTimeSec || 0);
        }
      }
      tSec *= (1 - fr);
      let s=`<div class="craft-flow-card" style="--tier-color:${accentColor};margin-bottom:10px">`;
      s+=`<div class="cfc-header" style="border-left-color:${accentColor}">`;
      s+=`<div class="cfc-header-left"><div class="cfc-name" style="font-size:14px">${emoji} ${label}</div></div>`;
      s+=`<div class="cfc-header-right"><div style="font-size:12px;color:${accentColor};font-weight:700">⏱️ ${fmtTime(tSec)}</div></div>`;
      s+=`</div><div class="cfc-section" style="padding:8px 14px">`;

      const chipB='display:inline-flex;align-items:center;gap:3px;border-radius:6px;padding:2px 7px;font-size:11px;white-space:nowrap;font-weight:700;justify-content:center';
      const lStyle='display:flex;align-items:center;flex-wrap:wrap;gap:5px;padding:5px 0;border-bottom:1px dashed var(--bdr)';
      const savedMap=aggSaved[secKey]||{};

      for(const[key,qty]of entries){
        const rec=ALCHEMY[key]||PRECISION_ALCHEMY[key];
        const fa2=finalAnalysis[key];
        const isPA=!!PRECISION_ALCHEMY[key];
        const name=(fa2?.name||rec?.name||key).replace(/★+\s*/g,'').replace(/\s*★+/g,'').trim();
        const color2=isPA
          ?(finColors[key]||tierColors[fa2.tier]||'#607090')
          :(compoundColors[key]||rec?.color||'#607090');

        const saved=savedMap[key]||0;

        const recAlch=ALCHEMY[key];
        let itemSec=0;
        if(!isPA&&recAlch){
          const batchN=Math.ceil(qty/(recAlch.output||1));
          itemSec=batchN*(recAlch.craftTimeSec||0)*(1-fr);
        }

        const output=(rec?.output)||1;
        const essBatch = (!isPA && output>1) ? Math.ceil(qty/output) : null;

        const matSource=isPA?PRECISION_ALCHEMY[key]?.materials:rec?.materials;
        const matParts=Object.entries(matSource||{}).filter(([,v])=>v>0)
          .map(([mk,mq])=>{
            let totalQ;
            if(isPA){
              totalQ = mq*qty;
            } else if(essBatch !== null){
              totalQ = mq*essBatch;
            } else {
              totalQ = mq*qty;
            }
            const col=getMatColor(mk);
            const nm=getMatName(mk).replace(/\s*★+/g,'').trim();
            return `<span style="${chipB};background:var(--bg);border:1.5px solid ${col}44"><span style="color:${col}">${nm}</span> <span style="color:var(--txt)">${fmtQty(totalQ)}</span></span>`;
          }).join(' ');

        s+=`<div style="${lStyle}">`;
        const makeableQty = essBatch !== null ? essBatch*output : qty;
        const effectiveSaved = saved > 0 ? saved : 0;
        const totalQty = makeableQty + effectiveSaved;
        let qtyDisplay = fmtQty(totalQty);
        let displayChunk = 0;
        if (isPA) {
          displayChunk = (fa2 && fa2.tier === 0) ? 33 : 50;
        } else if (typeof chunkSize === 'object' && chunkSize !== null) {
          displayChunk = chunkSize[key] || 0;
        } else {
          displayChunk = chunkSize || 0;
        }
        if(displayChunk > 0 && totalQty > displayChunk){
          const parts=[];let rem=totalQty;
          while(rem>0){parts.push(Math.min(rem,displayChunk));rem-=displayChunk;}
          qtyDisplay+=`<span style="font-size:9px;color:${color2};opacity:.7;margin-left:2px">(${parts.join('+')})</span>`;
        }
        s+=`<span style="${chipB};background:${color2}18;border:1.5px solid ${color2}"><span style="color:${color2}">${name}</span> <span style="color:${color2}">${qtyDisplay}</span></span>`;
        s+=`<span style="color:var(--bdr2);font-size:13px;font-weight:900;flex-shrink:0">·</span>`;
        s+=matParts;
        if(!isPA && effectiveSaved>0){
          s+=`<span style="${chipB};background:var(--bg);border:1.5px dashed var(--bdr2)"><span style="color:var(--muted)">보유</span> <span style="color:var(--muted)">${fmtQty(effectiveSaved)}</span></span>`;
        }
        if(!isPA&&itemSec>0){
          s+=`<span style="margin-left:auto;font-size:10px;color:var(--muted);flex-shrink:0">⏱️ ${fmtTime(itemSec)}</span>`;
        }
        s+=`</div>`;
      }
      s+=`</div></div>`;
      return s;
    }

    const essFirstOrder = document.getElementById('essFirstToggle')?.checked ?? false;

    if (essFirstOrder) {
      html+=useProc ? '' : stageSection('정수 제작', '⚗️', agg.ess1,'ess1','#1e9e58', essOrder1, {essence_guardian1:98,essence_corrosion1:98,essence_wave1:48,essence_chaos1:48,essence_life1:48});
      html+=useProc ? '' : stageSection('에센스 제작', '⚗️', agg.ess2, 'ess2','#2060c8', essOrder2, 66);
      html+=useProc ? '' : stageSection('엘릭서 제작', '⚗️', agg.ess3, 'ess3','#c82828', essOrder3, 34);
      html+=stageSection('핵 제작',     '💠', agg.core, 'core','#1e9e58', coreOrder, 50);
      html+=stageSection('결정 제작',   '💎', agg.crys, 'crys','#2060c8', crysOrder, 24);
      html+=stageSection('영약 제작',   '🧪', agg.poti, 'poti','#c82828', potiOrder, 24);
      html+=stageSection('1성 완성품',  '★',  agg.fin1, 'fin1','#1e9e58', fin1Order);
      html+=stageSection('2성 완성품',  '★★', agg.fin2, 'fin2','#2060c8', fin2Order);
      html+=stageSection('3성 완성품',  '★★★',agg.fin3,'fin3','#c82828', fin3Order);
      html+=stageSection('0성 완성품',  '🔬', agg.fin0, 'fin0','#c8920a', null);
    } else {
      html+=useProc ? '' : stageSection('정수 제작', '⚗️', agg.ess1,'ess1','#1e9e58', essOrder1, {essence_guardian1:98,essence_corrosion1:98,essence_wave1:48,essence_chaos1:48,essence_life1:48});
      html+=stageSection('핵 제작',     '💠', agg.core, 'core','#1e9e58', coreOrder, 50);
      html+=stageSection('1성 완성품',  '★',  agg.fin1, 'fin1','#1e9e58', fin1Order);
      html+=useProc ? '' : stageSection('에센스 제작', '⚗️', agg.ess2, 'ess2','#2060c8', essOrder2, 66);
      html+=stageSection('결정 제작',   '💎', agg.crys, 'crys','#2060c8', crysOrder, 24);
      html+=stageSection('2성 완성품',  '★★', agg.fin2, 'fin2','#2060c8', fin2Order);
      html+=useProc ? '' : stageSection('엘릭서 제작', '⚗️', agg.ess3, 'ess3','#c82828', essOrder3, 34);
      html+=stageSection('영약 제작',   '🧪', agg.poti, 'poti','#c82828', potiOrder, 24);
      html+=stageSection('3성 완성품',  '★★★',agg.fin3,'fin3','#c82828', fin3Order);
      html+=stageSection('0성 완성품',  '🔬', agg.fin0, 'fin0','#c8920a', null);
    }

    const allFinAgg = {...agg.fin0,...agg.fin1,...agg.fin2,...agg.fin3};
    const finSummaryEntries = Object.entries(allFinAgg).filter(([,v])=>v>0);
    if(finSummaryEntries.length){
      const chipB='display:inline-flex;align-items:center;gap:3px;border-radius:6px;padding:2px 7px;font-size:11px;white-space:nowrap;font-weight:700;justify-content:center';
      html+=`<div class="craft-flow-card" style="--tier-color:var(--acc);margin-bottom:10px">`;
      html+=`<div class="cfc-header" style="border-left-color:var(--acc)">`;
      html+=`<div class="cfc-header-left"><div class="cfc-name" style="font-size:14px">💰 수익 합산</div></div>`;
      html+=`<div class="cfc-header-right"><div style="font-size:13px;color:var(--grn);font-weight:900">${f(totalRev)}원</div></div>`;
      html+=`</div><div class="cfc-section" style="padding:8px 14px">`;
      const lStyle='display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px dashed var(--bdr)';
      const orderedFin=[...fin1Order,...fin2Order,...fin3Order,'DILUTED_EXTRACT']
        .filter(k=>allFinAgg[k]>0).map(k=>[k,allFinAgg[k]]);
      const restFin=finSummaryEntries.filter(([k])=>!orderedFin.find(([ok])=>ok===k));
      for(const[key,qty]of[...orderedFin,...restFin]){
        const fa2=finalAnalysis[key];if(!fa2)continue;
        const color2=finColors[key]||tierColors[fa2.tier]||'#607090';
        const rev=fa2.sellPrice*qty;
        const netTot=Math.round(fa2.netPerUnit)*qty;
        const netColor2=netTot>=0?'var(--grn)':'var(--red)';
        const netSign2=netTot>=0?'+':'';
        const name=fa2.name.replace(/★+\s*/g,'').replace(/\s*★+/g,'').trim();
        const chunk2=(fa2.tier===0)?33:50;
        let qtyStr2 = fmtQty(qty);
        if(qty > chunk2){
          const parts2=[];let rem2=qty;
          while(rem2>0){parts2.push(Math.min(rem2,chunk2));rem2-=chunk2;}
          qtyStr2 += `<span style="font-size:10px;color:var(--muted);font-weight:500;margin-left:3px">(${parts2.join('+')})</span>`;
        }
        html+=`<div style="${lStyle}">`;
        html+=`<span style="${chipB};background:${color2}18;border:1.5px solid ${color2};min-width:100px"><span style="color:${color2}">${name}</span></span>`;
        html+=`<span style="font-size:12px;color:var(--muted);flex-shrink:0">${qtyStr2}</span>`;
        html+=`<span style="font-size:12px;color:var(--txt);font-weight:900;flex-shrink:0">${f(rev)}원</span>`;
        html+=`<span style="font-size:11px;color:${netColor2};margin-left:auto;flex-shrink:0">${netSign2}${f(netTot)}원</span>`;
        html+=`</div>`;
      }
      const totalNet=planEntries.reduce((s,[k,cnt])=>s+Math.round(finalAnalysis[k].netPerUnit)*cnt,0);
      const netCol=totalNet>=0?'var(--grn)':'var(--red)', netSgn=totalNet>=0?'+':'';
      html+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;margin-top:2px;border-top:1.5px solid var(--bdr2)">`;
      html+=`<span style="font-family:'Jua',sans-serif;font-size:12px;color:var(--muted)">합계</span>`;
      html+=`<span style="font-size:13px;color:var(--grn);font-weight:900;margin-left:auto">${f(totalRev)}원</span>`;
      html+=`<span style="font-size:12px;color:${netCol};font-weight:700">(${netSgn}${f(totalNet)}원)</span>`;
      html+=`</div>`;
      if(alchSec > 0 || precSec > 0){
        html+=`<div style="border-top:1px dashed var(--bdr2);margin-top:4px;padding-top:4px;display:flex;flex-direction:column;gap:3px">`;
        if(alchSec > 0)
          html+=`<div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span style="color:var(--muted)">⚗️ 연금 작업대</span><span style="color:var(--blu)">${fmtTime(alchSec)}</span></div>`;
        if(precSec > 0)
          html+=`<div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span style="color:var(--muted)">🔬 정밀 연금 작업대</span><span style="color:var(--blu)">${fmtTime(precSec)}</span></div>`;
        html+=`</div>`;
      }
      html+=`</div></div>`;
    }

  {
    const _sw  = totalVan.seaweed_item || 0;
    const _kelp = totalVan.kelp || 0;
    const _fr  = totalVan.firn || 0;
    const _gb  = totalVan.glass_bottle || 0;
    const _gl  = totalVan.glowberry || 0;
    const hasSummary = _sw>0 || _kelp>0 || _fr>0 || _gb>0 || _gl>0;
    if (hasSummary) {
      const col = '#607090';
      const rowS = `display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px dashed var(--bdr);font-size:12px;font-weight:700`;
      html += `<div class="craft-flow-card" style="--tier-color:${col};margin-top:4px">`;
      html += `<div class="cfc-header" style="border-left-color:${col}">`;
      html += `<div class="cfc-header-left"><div class="cfc-name" style="font-size:14px;color:${col}">📦 중복 재료 총합</div>`;
      html += `<div class="cfc-sub" style="color:var(--muted)">여러 단계에서 공통으로 필요한 재료</div></div></div>`;
      html += `<div class="cfc-section" style="padding:8px 14px">`;
      if (_sw>0)   html += `<div style="${rowS}"><span style="color:${col}">🌊 해초</span><span style="color:var(--txt)">${fmtQty(_sw)}</span></div>`;
      if (_kelp>0) html += `<div style="${rowS}"><span style="color:${col}">🌿 켈프</span><span style="color:var(--txt)">${fmtQty(_kelp)}</span></div>`;
      if (_fr>0)   html += `<div style="${rowS}"><span style="color:${col}">🔵 불우렁쉥이</span><span style="color:var(--txt)">${fmtQty(_fr)}</span></div>`;
      if (_gb>0)   html += `<div style="${rowS}"><span style="color:${col}">🍶 유리병</span><span style="color:var(--txt)">${fmtQty(_gb)}</span></div>`;
      if (_gl>0)   html += `<div style="${rowS};border-bottom:none"><span style="color:${col}">✨ 발광 열매</span><span style="color:var(--txt)">${fmtQty(_gl)}</span></div>`;
      html += `</div></div>`;
    }
  }

  const vanEntries=Object.entries(totalVan).filter(([,v])=>v>0);
  if(vanEntries.length){
    const vanOrder=['shrimp','sea_bream','herring','goldfish','bass',
      'clay','sand','dirt','gravel','granite',
      'oak_leaf','spruce_leaf','birch_leaf','cherry_leaf','dark_oak_leaf',
      'lapis_block','redstone_block','iron_ingot','gold_ingot','diamond',
      'firn','seaweed_item','kelp','glass_bottle','glowberry',
      'netherrack','magma','soul_soil','crimson_stem','warped_stem',
      'coral_dead_tube','coral_dead_brain','coral_dead_bubble','coral_dead_fire','coral_dead_horn'];
    const vanSorted=[
      ...vanOrder.filter(k=>totalVan[k]>0).map(k=>[k,totalVan[k]]),
      ...vanEntries.filter(([k])=>!vanOrder.includes(k)),
    ];
    html+=`<div class="van-section"><div class="van-section-title">🧪 필요 바닐라 재료 합계</div><div class="van-grid">`;
    for(const[k,v]of vanSorted)html+=`<div class="van-item"><span class="vi-name" style="color:${getMatColor(k)}">${getMatName(k)}</span><span class="vi-qty">${fmtQty(v)}</span></div>`;
    html+=`</div></div>`;
  }

  const essenceNeeded = {};
  function walkForEssence(key, qty, depth=0) {
    if (depth > 12 || qty <= 0) return;
    const rec = ALCHEMY[key]; if (!rec) return;
    if (rec.type === 'essence') {
      essenceNeeded[key] = (essenceNeeded[key] || 0) + qty;
      return;
    }
    const output = rec.output || 1;
    const batches = Math.ceil(qty / output);
    for (const [mk, mq] of Object.entries(rec.materials)) walkForEssence(mk, mq * batches, depth+1);
  }
  for (const [fKey, cnt] of planEntries) {
    const fRec = PRECISION_ALCHEMY[fKey];
    for (const [mk, mq] of Object.entries(fRec.materials)) walkForEssence(mk, mq * cnt);
  }
  const leftoverInterm = {};
  for (const [key, needed] of Object.entries(essenceNeeded)) {
    const rec = ALCHEMY[key]; if (!rec) continue;
    const output = rec.output || 1;
    if (output <= 1) continue;
    const haveQty = intermHave[key] || 0;
    const netNeeded = Math.max(0, needed - haveQty);
    if (netNeeded <= 0) continue;
    const batches = Math.ceil(netNeeded / output);
    const leftover = batches * output - netNeeded;
    if (leftover > 0) leftoverInterm[key] = leftover;
  }

  let remEntries;
  if (useProc) {
    const sfToProc = {
      oyster1:'essence_guardian1', conch1:'essence_wave1', octopus1:'essence_chaos1',
      seaweed1:'essence_life1',    urchin1:'essence_corrosion1',
      oyster2:'essence_guardian2', conch2:'essence_wave2', octopus2:'essence_chaos2',
      seaweed2:'essence_life2',    urchin2:'essence_corrosion2',
      oyster3:'elixir_guardian',   conch3:'elixir_wave',   octopus3:'elixir_chaos',
      seaweed3:'elixir_life',      urchin3:'elixir_corrosion',
    };
    const procRem = {};
    for (const [sfKey, sfQty] of SF_KEYS.map(k=>[k,workInv[k]||0]).filter(([,v])=>v>0)) {
      const procKey = sfToProc[sfKey]; if (!procKey) continue;
      const rec = ALCHEMY[procKey]; if (!rec) continue;
      const matQty = rec.materials[sfKey] || 1;
      const batches = Math.floor(sfQty / matQty);
      if (batches > 0) procRem[procKey] = (procRem[procKey]||0) + batches * (rec.output||1);
    }
    remEntries = Object.entries(procRem).filter(([,v])=>v>0);
  } else {
    const sfRem = SF_KEYS.map(k=>[k,workInv[k]||0]).filter(([,v])=>v>0);
    const compRem = [];
    for (const [key, haveQty] of Object.entries(intermHave)) {
      if (haveQty <= 0) continue;
      const rec = ALCHEMY[key]; if (!rec) continue;
      if (rec.type !== 'compound') continue;
      let used = 0;
      for (const [fKey, cnt] of planEntries) {
        const fRec = PRECISION_ALCHEMY[fKey]; if (!fRec) continue;
        const mq = fRec.materials[key] || 0;
        used += mq * cnt;
      }
      const remaining = Math.max(0, haveQty - used);
      if (remaining > 0) compRem.push([key, remaining]);
    }
    remEntries = [...sfRem, ...compRem];
  }

  html+=`<div class="result-box" style="margin-top:12px">`;
  if(remEntries.length || Object.keys(leftoverInterm).length){
    html+=`<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed var(--bdr2);font-size:11px;color:var(--muted)">남은 재료:</div>`;

    const intermByGroup={sf:[],ess1:[],core:[],ess2:[],crys:[],ess3:[],poti:[]};
    for(const[k,v]of remEntries){
      const rec=ALCHEMY[k];
      if(!rec){
        intermByGroup.sf.push([k,v]);
      } else if(rec.type==='compound'){
        if(rec.tier===1)       intermByGroup.core.push([k,v]);
        else if(rec.tier===2)  intermByGroup.crys.push([k,v]);
        else if(rec.tier===3)  intermByGroup.poti.push([k,v]);
        else                   intermByGroup.sf.push([k,v]);
      } else {
        intermByGroup.sf.push([k,v]);
      }
    }
    for(const[k,v]of Object.entries(leftoverInterm)){
      if(v<=0)continue;
      const rec=ALCHEMY[k]; if(!rec) continue;
      if(rec.type==='essence'&&rec.tier===1) intermByGroup.ess1.push([k,v]);
      else if(rec.type==='compound'&&rec.tier===1) intermByGroup.core.push([k,v]);
      else if(rec.type==='essence'&&rec.tier===2) intermByGroup.ess2.push([k,v]);
      else if(rec.type==='compound'&&rec.tier===2) intermByGroup.crys.push([k,v]);
      else if(rec.type==='essence'&&rec.tier===3) intermByGroup.ess3.push([k,v]);
      else if(rec.type==='compound'&&rec.tier===3) intermByGroup.poti.push([k,v]);
    }

    const rowStyle='margin-bottom:4px;font-size:11px;color:var(--muted)';
    function renderRow(pairs, label){
      if(!pairs.length) return '';
      const chips=pairs.map(([k,v])=>{
        const rec=ALCHEMY[k]; const col=rec?.color||getMatColor(k);
        const name=rec?.name||getMatName(k);
        return `<span style="color:${col}">${name} ${fmtQty(v)}</span>`;
      }).join(' · ');
      return `<div style="${rowStyle}">${chips}</div>`;
    }

    html+=`<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed var(--bdr2)">`;
    if(remEntries.length){
      if(useProc){
        const procByTier={ess1:[],ess2:[],ess3:[]};
        for(const[k,v]of remEntries){
          const rec=ALCHEMY[k];if(!rec)continue;
          if(rec.tier===1) procByTier.ess1.push([k,v]);
          else if(rec.tier===2) procByTier.ess2.push([k,v]);
          else if(rec.tier===3) procByTier.ess3.push([k,v]);
        }
        html+=renderRow(procByTier.ess1,'');
        html+=renderRow(procByTier.ess2,'');
        html+=renderRow(procByTier.ess3,'');
      } else {
        const chips=remEntries.map(([k,v])=>`<span style="color:${getMatColor(k)}">${getMatName(k)} ${fmtQty(v)}</span>`).join(' · ');
        html+=`<div style="${rowStyle}">${chips}</div>`;
      }
    }
    html+=renderRow(intermByGroup.ess1.concat(intermByGroup.core),'');
    html+=renderRow(intermByGroup.ess2.concat(intermByGroup.crys),'');
    html+=renderRow(intermByGroup.ess3.concat(intermByGroup.poti),'');
    html+=`</div>`;
    html+=`<button onclick="applyRemainToHave()" style="width:100%;margin-bottom:10px;padding:9px 10px;border-radius:var(--rs);border:1.5px solid var(--grn);background:var(--grn-bg);color:var(--grn);font-family:'Jua',sans-serif;font-size:12px;font-weight:700;cursor:pointer">♻️ 남은 재료를 보유량으로 올리기</button>`;
  }
  html+=`<div style="display:flex;gap:0;align-items:stretch">`;
  html+=`<div style="flex:1;text-align:center;padding:4px 8px"><div class="rb-label">총 예상 수익</div><div class="rb-value" style="color:var(--grn)">${f(totalRev)}원</div></div>`;
  html+=`<div style="width:1px;background:var(--bdr2);margin:4px 0"></div>`;
  const totalNet=planEntries.reduce((s,[k,cnt])=>s+Math.round(finalAnalysis[k].netPerUnit)*cnt,0);
  const netSign2=totalNet>=0?'+':'';
  const netCol2=totalNet>=0?'var(--grn)':'var(--red)';
  html+=`<div style="flex:1;text-align:center;padding:4px 8px"><div class="rb-label">${netLabel}</div><div class="rb-value" style="color:${netCol2}">${netSign2}${f(totalNet)}원</div></div>`;
  html+=`</div>`;
  if(alchSec > 0 || precSec > 0){
    html+=`<div style="border-top:1px dashed var(--bdr2);margin-top:6px;padding-top:6px;display:flex;flex-direction:column;gap:3px">`;
    if(alchSec > 0)
      html+=`<div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span style="color:var(--muted)">⚗️ 연금 작업대</span><span style="color:var(--blu)">${fmtTime(alchSec)}</span></div>`;
    if(precSec > 0)
      html+=`<div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span style="color:var(--muted)">🔬 정밀 연금 작업대</span><span style="color:var(--blu)">${fmtTime(precSec)}</span></div>`;
    html+=`</div>`;
  }
  html+=`</div>`;

  document.getElementById('optRes').innerHTML=html;
} // renderOptResult 끝

window.calcOpt=calcOpt;

window.toggleGuide=(id)=>{
  const el=document.getElementById(id),arrowEl=document.getElementById(id+'_arrow');
  if(!el)return;const open=el.style.display==='none';
  el.style.display=open?'block':'none';if(arrowEl)arrowEl.textContent=open?'▼':'▶';
};


/* ════════════════════════════════════════
   ⑨ 동적 UI 빌드
════════════════════════════════════════ */
/* readSplitQty / splitQtyHtml 는 shared/utils.js 의 createUnitUtils 로 이동(상단 바인딩) */
const INTERM_GROUPS = [
  { label:'1차 정수', color:'#3d6fd4', items:[
    {key:'essence_guardian1', name:'수호의 정수', color:'#3d6fd4'},
    {key:'essence_wave1',     name:'파동의 정수', color:'#c89c00'},
    {key:'essence_chaos1',    name:'혼란의 정수', color:'#7c52c8'},
    {key:'essence_life1',     name:'생명의 정수', color:'#d94f3d'},
    {key:'essence_corrosion1',name:'부식의 정수', color:'#3a9e68'},
  ]},
  { label:'1차 핵', color:'#4db8e8', items:[
    {key:'core_guard',    name:'물결 수호의 핵', color:'#4db8e8'},
    {key:'core_wave',     name:'파동 오염의 핵', color:'#f0853a'},
    {key:'core_chaos',    name:'질서 파괴의 핵', color:'#9060c8'},
    {key:'core_life',     name:'활력 붕괴의 핵', color:'#c03040'},
    {key:'core_corrosion',name:'침식 방어의 핵', color:'#48c070'},
  ]},
  { label:'2차 에센스', color:'#6090e8', items:[
    {key:'essence_guardian2', name:'수호 에센스',  color:'#3d6fd4'},
    {key:'essence_wave2',     name:'파동 에센스',  color:'#c89c00'},
    {key:'essence_chaos2',    name:'혼란 에센스',  color:'#7c52c8'},
    {key:'essence_life2',     name:'생명 에센스',  color:'#d94f3d'},
    {key:'essence_corrosion2',name:'부식 에센스',  color:'#3a9e68'},
  ]},
  { label:'2차 결정', color:'#4db8e8', items:[
    {key:'crystal_vitality',name:'활기 보존의 결정', color:'#4db8e8'},
    {key:'crystal_erosion', name:'파도 침식의 결정', color:'#f0853a'},
    {key:'crystal_defense', name:'방어 오염의 결정', color:'#9060c8'},
    {key:'crystal_torrent', name:'격류 재생의 결정', color:'#c03040'},
    {key:'crystal_poison',  name:'맹독 혼란의 결정', color:'#48c070'},
  ]},
  { label:'3차 엘릭서', color:'#9070d4', items:[
    {key:'elixir_guardian', name:'수호의 엘릭서', color:'#3d6fd4'},
    {key:'elixir_wave',     name:'파동의 엘릭서', color:'#c89c00'},
    {key:'elixir_chaos',    name:'혼란의 엘릭서', color:'#7c52c8'},
    {key:'elixir_life',     name:'생명의 엘릭서', color:'#d94f3d'},
    {key:'elixir_corrosion',name:'부식의 엘릭서', color:'#3a9e68'},
  ]},
  { label:'3차 영약', color:'#c82828', items:[
    {key:'potion_immortal',name:'불멸 재생의 영약', color:'#4db8e8'},
    {key:'potion_barrier', name:'파동 장벽의 영약', color:'#f0853a'},
    {key:'potion_corrupt', name:'타락 침식의 영약', color:'#9060c8'},
    {key:'potion_frenzy',  name:'생명 광란의 영약', color:'#c03040'},
    {key:'potion_venom',   name:'맹독 파동의 영약', color:'#48c070'},
  ]},
];
const INTERM_BY_KEY = Object.fromEntries(INTERM_GROUPS.flatMap(g=>g.items.map(it=>[it.key,it])));

function makeIntermOptions(){
  const groups=[
    {label:'── 1차 정수 ──',   keys:['essence_guardian1','essence_wave1','essence_chaos1','essence_life1','essence_corrosion1']},
    {label:'── 1차 핵 ──',     keys:['core_guard','core_wave','core_chaos','core_life','core_corrosion']},
    {label:'── 2차 에센스 ──', keys:['essence_guardian2','essence_wave2','essence_chaos2','essence_life2','essence_corrosion2']},
    {label:'── 2차 결정 ──',   keys:['crystal_vitality','crystal_erosion','crystal_defense','crystal_torrent','crystal_poison']},
    {label:'── 3차 엘릭서 ──', keys:['elixir_guardian','elixir_wave','elixir_chaos','elixir_life','elixir_corrosion']},
    {label:'── 3차 영약 ──',   keys:['potion_immortal','potion_barrier','potion_corrupt','potion_frenzy','potion_venom']},
  ];
  let opts='<option value="">중간재료 선택</option>';
  for(const{label,keys}of groups){opts+='<optgroup label="'+label+'">';for(const k of keys){const rec=ALCHEMY[k];if(!rec)continue;opts+='<option value="'+k+'">'+rec.name+'</option>';}opts+='</optgroup>';}
  return opts;
}

window.showIntermPicker = function(rid) {
  document.querySelectorAll('.interm-picker-popup').forEach(el=>el.remove());

  const popup = document.createElement('div');
  popup.className = 'interm-picker-popup';
  popup.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.4)';

  const useProc = document.getElementById('useProcToggle')?.checked ?? false;

  let html = '<div style="background:var(--surf);border:1.5px solid var(--bdr2);border-radius:var(--r);padding:16px;width:min(520px,94vw);max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.25)">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
  html += `<div style="font-family:'Jua',sans-serif;font-size:14px;color:var(--txt)">${useProc ? '어패류 / 중간재료 선택' : '중간재료 선택'}</div>`;
  html += '<button onclick="this.closest(\'.interm-picker-popup\').remove()" style="border:none;background:none;font-size:18px;cursor:pointer;color:var(--muted);line-height:1">✕</button>';
  html += '</div>';

  if (useProc) {
    const sfColors={oyster:'#3d6fd4',conch:'#c89c00',octopus:'#7c52c8',seaweed:'#d94f3d',urchin:'#3a9e68'};
    const starLabels={1:'★',2:'★★',3:'★★★'};

    for (const sf of SF_TYPES) {
      const meta = SEAFOOD_TYPES[sf]; const cl = sfColors[sf];
      html += `<div style="margin-bottom:10px">`;
      html += `<div style="font-size:10px;font-weight:700;color:${cl};letter-spacing:.4px;margin-bottom:5px;padding-bottom:3px;border-bottom:1px dashed var(--bdr2)">${meta.name}</div>`;
      html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px">';
      for (const t of SF_TIERS) {
        const key = `${sf}${t}`;
        html += `<button onclick="selectIntermItem('${rid}','${key}')" style="padding:5px 4px;border-radius:8px;border:1.5px solid ${cl}44;background:${cl}12;color:${cl};font-size:10px;font-weight:700;cursor:pointer;text-align:center;line-height:1.4;transition:all .12s" onmouseover="this.style.background='${cl}30'" onmouseout="this.style.background='${cl}12'">${meta.name} ${starLabels[t]}</button>`;
      }
      html += '</div></div>';
    }

    const compGroups = [
      { label:'💠 1차 핵', color:'#4db8e8', items: INTERM_GROUPS.find(g=>g.label==='1차 핵')?.items || [] },
      { label:'💎 2차 결정', color:'#6090e8', items: INTERM_GROUPS.find(g=>g.label==='2차 결정')?.items || [] },
      { label:'🧪 3차 영약', color:'#c82828', items: INTERM_GROUPS.find(g=>g.label==='3차 영약')?.items || [] },
    ];
    for(const grp of compGroups){
      if(!grp.items.length) continue;
      html += '<div style="margin-bottom:10px">';
      html += `<div style="font-size:10px;font-weight:700;color:${grp.color};letter-spacing:.4px;margin-bottom:5px;padding-bottom:3px;border-bottom:1px dashed var(--bdr2)">${grp.label}</div>`;
      html += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px">';
      for(const it of grp.items){
        html += `<button onclick="selectIntermItem('${rid}','${it.key}')" style="padding:5px 4px;border-radius:8px;border:1.5px solid ${it.color}44;background:${it.color}12;color:${it.color};font-size:10px;font-weight:700;cursor:pointer;text-align:center;line-height:1.4;transition:all .12s;word-break:keep-all" onmouseover="this.style.background='${it.color}30'" onmouseout="this.style.background='${it.color}12'">${it.name.replace(/의 /g,'의\n').replace(/★+/g,'')}</button>`;
      }
      html += '</div></div>';
    }
  } else {
    for(const grp of INTERM_GROUPS){
      html += '<div style="margin-bottom:10px">';
      html += '<div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.4px;margin-bottom:5px;padding-bottom:3px;border-bottom:1px dashed var(--bdr2)">';
      html += `<span style="color:${grp.color}">${grp.label}</span></div>`;
      html += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px">';
      for(const it of grp.items){
        html += `<button onclick="selectIntermItem('${rid}','${it.key}')" style="padding:5px 4px;border-radius:8px;border:1.5px solid ${it.color}44;background:${it.color}12;color:${it.color};font-size:10px;font-weight:700;cursor:pointer;text-align:center;line-height:1.4;transition:all .12s;word-break:keep-all" onmouseover="this.style.background='${it.color}30'" onmouseout="this.style.background='${it.color}12'">${it.name.replace(/의 /g,'의\n').replace(/★+/g,'')}</button>`;
      }
      html += '</div></div>';
    }
  }

  html += '</div>';
  popup.innerHTML = html;
  popup.addEventListener('click', e => { if(e.target===popup) popup.remove(); });
  document.body.appendChild(popup);
};

window.selectIntermItem = function(rid, key) {
  document.querySelectorAll('.interm-picker-popup').forEach(el=>el.remove());

  const sfMatch = key.match(/^(oyster|conch|octopus|seaweed|urchin)(\d)$/);
  let name, color;
  if (sfMatch) {
    const sfColors={oyster:'#3d6fd4',conch:'#c89c00',octopus:'#7c52c8',seaweed:'#d94f3d',urchin:'#3a9e68'};
    const sfNames={oyster:'굴',conch:'소라',octopus:'문어',seaweed:'미역',urchin:'성게'};
    const starLabels={1:'★',2:'★★',3:'★★★'};
    name  = sfNames[sfMatch[1]] + ' ' + starLabels[+sfMatch[2]];
    color = sfColors[sfMatch[1]];
  } else {
    const it = INTERM_BY_KEY[key]; if(!it) return;
    name  = it.name;
    color = it.color;
  }

  const hiddenSel = document.getElementById('isel_'+rid);
  if(hiddenSel){
    if(!hiddenSel.querySelector(`option[value="${key}"]`)){
      const opt = document.createElement('option');
      opt.value = key; opt.textContent = name;
      hiddenSel.appendChild(opt);
    }
    hiddenSel.value = key;
  }
  const lbl = document.getElementById('isel_lbl_'+rid);
  if(lbl){
    lbl.textContent = name;
    lbl.style.color = color;
    lbl.style.borderColor = color+'88';
    lbl.style.background = color+'18';
  }
  onIntermSelChange();
};
const COMPOUND_KEYS = new Set(['core_guard','core_wave','core_chaos','core_life','core_corrosion','crystal_vitality','crystal_erosion','crystal_defense','crystal_torrent','crystal_poison','potion_immortal','potion_barrier','potion_corrupt','potion_frenzy','potion_venom']);

window.updateIntermWarning = function() {
  const warn = document.getElementById('intermWarning');
  if (!warn) return;
  const hasCompound = [...document.querySelectorAll('#intermList .interm-sel')]
    .some(sel => COMPOUND_KEYS.has(sel.value));
  warn.style.display = hasCompound ? '' : 'none';
};

window.onIntermSelChange = () => { saveAll(); updateIntermWarning(); };

let intermRowId=0;
window.addIntermRow=()=>{
  const list=document.getElementById('intermList');if(!list)return;
  const rid=++intermRowId,row=document.createElement('div');
  row.className='interm-row';row.id='irow_'+rid;

  row.innerHTML=
    `<button id="isel_lbl_${rid}" onclick="showIntermPicker('${rid}')" style="flex-shrink:0;padding:5px 10px;border-radius:8px;border:1.5px solid var(--bdr2);background:var(--bg);color:var(--muted);font-family:'Jua',sans-serif!important;font-size:11px;cursor:pointer;white-space:nowrap;transition:all .12s;min-width:80px;text-align:center">(선택)</button>`
    +`<select class="interm-sel" id="isel_${rid}" style="display:none" onchange="onIntermSelChange()"><option value="">선택</option></select>`
    +'<div style="flex:1;min-width:0">'
    +splitQtyHtml('iqty_'+rid,'var(--acc)')
    +'</div>'
    +`<button class="del-btn" onclick="document.getElementById('irow_${rid}').remove();updateIntermWarning();saveAll()">✕</button>`;
  ['_box','_set','_ea'].forEach(s=>{
    const el=document.getElementById('iqty_'+rid+s);
    if(el)el.addEventListener('input',()=>{
      const n=readSplitQty('iqty_'+rid);
      const p=document.getElementById('iqty_'+rid+'_p');
      if(p)p.textContent=n>0?'총 '+f(n)+'개':'';
      saveAll();
    });
  });
  list.appendChild(row);
  saveAll();
};
const PROC_GROUPS = [
  { label:'⚗️ 1차 정수 ★',    items:[
    {key:'essence_guardian1',  name:'수호', color:'#3d6fd4'},
    {key:'essence_wave1',      name:'파동', color:'#c89c00'},
    {key:'essence_chaos1',     name:'혼란', color:'#7c52c8'},
    {key:'essence_life1',      name:'생명', color:'#d94f3d'},
    {key:'essence_corrosion1', name:'부식', color:'#3a9e68'},
  ]},
  { label:'⚗️ 2차 에센스 ★★', items:[
    {key:'essence_guardian2',  name:'수호', color:'#3d6fd4'},
    {key:'essence_wave2',      name:'파동', color:'#c89c00'},
    {key:'essence_chaos2',     name:'혼란', color:'#7c52c8'},
    {key:'essence_life2',      name:'생명', color:'#d94f3d'},
    {key:'essence_corrosion2', name:'부식', color:'#3a9e68'},
  ]},
  { label:'⚗️ 3차 엘릭서 ★★★', items:[
    {key:'elixir_guardian',  name:'수호', color:'#3d6fd4'},
    {key:'elixir_wave',      name:'파동', color:'#c89c00'},
    {key:'elixir_chaos',     name:'혼란', color:'#7c52c8'},
    {key:'elixir_life',      name:'생명', color:'#d94f3d'},
    {key:'elixir_corrosion', name:'부식', color:'#3a9e68'},
  ]},
];

function buildHaveSeafoodGrid(){
  const el=document.getElementById('haveSeafoodGrid');if(!el)return;
  const useProc=document.getElementById('useProcToggle')?.checked??false;
  const sfColors={oyster:'#3d6fd4',conch:'#c89c00',octopus:'#7c52c8',seaweed:'#d94f3d',urchin:'#3a9e68'};
  const starLabels={1:'★ 1성',2:'★★ 2성',3:'★★★ 3성'};
  let html='';

  if(!useProc){
    html+='<div class="slabel">🦀 어패류</div>';
    for(const sf of SF_TYPES){
      const meta=SEAFOOD_TYPES[sf],cl=sfColors[sf];
      html+='<div style="margin-bottom:8px"><div style="font-size:10px;font-weight:700;color:'+cl+';margin-bottom:4px">'+meta.name+'</div><div class="g3">';
      for(const t of SF_TIERS){const id='have_'+sf+'_'+t;html+='<div class="field"><label style="color:'+cl+'">'+starLabels[t]+'</label>'+splitQtyHtml(id,cl)+'</div>';}
      html+='</div></div>';
    }
    html+='<div class="slabel" style="margin-top:8px">⚗️ 보유 중간재료 <small style="font-weight:500;font-size:9px">(선택)</small></div>'
        +'<div id="intermList"></div>'
        +'<div id="intermWarning" style="display:none;margin-top:8px;padding:7px 10px;background:var(--ylw-bg);border:1.5px solid var(--ylw);border-radius:var(--rs);font-size:11px;color:var(--ylw);line-height:1.5">⚠️ <b>핵 · 결정 · 영약</b>을 보유 중간재료로 입력하면 최적화 결과가 실제 최적이 아닐 수 있습니다.</div>'
        +'<button class="add-interm-btn" onclick="addIntermRow()">+ 중간재료 추가</button>';
  } else {
    const inp=(it)=>'<div class="field">'
      +'<label style="color:'+it.color+'">'+it.name+'</label>'
      +splitQtyHtml('proc_'+it.key, it.color)
      +'</div>';
    for(const grp of PROC_GROUPS){
      html+='<div class="slabel">'+grp.label+'</div><div class="g3" style="margin-bottom:8px">';
      for(const it of grp.items) html+=inp(it);
      html+='</div>';
    }
    html+='<div class="slabel" style="margin-top:8px">🦀 보유 중간재료 <small style="font-weight:500;font-size:9px">(선택 — 어패류·핵·결정·영약)</small></div>'
        +'<div id="intermList"></div>'
        +'<button class="add-interm-btn" onclick="addIntermRow()">+ 중간재료 추가</button>';
  }

  el.innerHTML=html;
  if(!useProc){ updateIntermWarning(); }
}

window.onUseProcToggle=()=>{ saveAll(); buildHaveSeafoodGrid(); loadAll(); };
window.onSFQtyInput=(id)=>{const n=readSplitQty(id);const p=document.getElementById(id+'_p');if(p)p.textContent=n>0?'총 '+f(n)+'개':'';saveAll();try{calcDaily();}catch(e){}};
function buildVanillaPriceGrid(){
  const el=document.getElementById('vanillaPriceGrid');if(!el)return;
  const groups=[
    {label:'🐟 물고기 회',   keys:['shrimp','sea_bream','herring','goldfish','bass']},
    {label:'🏔️ 토양',            keys:['clay','sand','dirt','gravel','granite']},
    {label:'🍃 나뭇잎',      keys:['oak_leaf','spruce_leaf','birch_leaf','cherry_leaf','dark_oak_leaf']},
    {label:'⛏️ 광물',        keys:['lapis_block','redstone_block','iron_ingot','gold_ingot','diamond']},
    {label:'🌊 해조류',      keys:['firn','seaweed_item','kelp','glass_bottle','glowberry']},
    {label:'🔥 네더',         keys:['netherrack','magma','soul_soil','crimson_stem','warped_stem']},
    {label:'🪸 죽은 산호',   keys:['coral_dead_tube','coral_dead_brain','coral_dead_bubble','coral_dead_fire','coral_dead_horn']},
  ];
  let html='';
  for(const grp of groups){html+='<div class="slabel">'+grp.label+'</div><div class="g3">';for(const k of grp.keys){const meta=VANILLA_META[k];if(!meta)continue;const unit=meta.blockToCraft?'블록 세트당':'세트당';const label=meta.priceLabel||meta.name;html+='<div class="field"><label>'+label+' <span style="font-weight:500;color:var(--muted)">('+unit+')</span></label><input id="vprice_'+k+'" type="number" inputmode="numeric" placeholder="0" oninput="onPriceChange()"></div>';}html+='</div>';}
  el.innerHTML=html;
}


/* ════════════════════════════════════════
   ⑩ 자동채우기
════════════════════════════════════════ */
window.autoFill=()=>{
  if(!DEFAULT_PRICES)return;
  const fill=(id,val)=>{if(!val||val<=0)return;const e=document.getElementById(id);if(e&&(!e.value||+e.value===0)){e.value=Math.round(val);e.dispatchEvent(new Event('input'));}};
  fill('price_sf_1',DEFAULT_PRICES.seafood.tier1);fill('price_sf_2',DEFAULT_PRICES.seafood.tier2);fill('price_sf_3',DEFAULT_PRICES.seafood.tier3);
  for(const[k,v]of Object.entries(DEFAULT_PRICES.vanilla||{})){if(v>0)fill('vprice_'+k,v*SET_SIZE);}
  onPriceChange();
};


/* ════════════════════════════════════════
   ⑪ localStorage 저장·불러오기
════════════════════════════════════════ */
const KEY='ocean_calc_v8';
/* 저장소 통일: project_data:ocean (레거시 ocean_calc_v8 → 최초 1회 자동 이관) */
const oceanStore = createPageStore({ profession:'ocean', legacyKey:KEY });
const splitSuffixes=['_box','_set','_ea'];
function getStaticIds(){
  const sfSplitIds=SF_TYPES.flatMap(sf=>SF_TIERS.flatMap(t=>splitSuffixes.map(s=>'have_'+sf+'_'+t+s)));
  const procIds=PROC_GROUPS.flatMap(grp=>grp.items.flatMap(it=>['_box','_set','_ea'].map(s=>'proc_'+it.key+s)));
  return['skillFurnace','skillCraftBonus','skillAlchBonus','skillDeepHarvest','skillStarBonus','skillClamBonus','engClamSearch','engSeafoodLuck','engFisherRoulette','engSpiritWhale','rodLevel','totalStamina','price_sf_1','price_sf_2','price_sf_3','sfCostToggle','viewByStageToggle','excludeDilutedToggle','useProcToggle',...Object.keys(VANILLA_META).map(k=>'vprice_'+k),...sfSplitIds,...procIds];
}
function saveAll(){
  const d=oceanStore.load()||{};  // 기존 저장값 위에 병합 → 화면에 없는 모드(어패류/1차가공품) 입력 보존
  getStaticIds().forEach(id=>{const e=document.getElementById(id);if(e)d[id]=e.value;});
  d.__sfCostToggle     =document.getElementById('sfCostToggle')?.checked     ??false;
  d.__viewByStageToggle=document.getElementById('viewByStageToggle')?.checked??false;
  d.__essFirstToggle   =document.getElementById('essFirstToggle')?.checked   ??false;
  d.__useProcToggle      =document.getElementById('useProcToggle')?.checked      ??false;
  d.__excludeDilutedToggle=document.getElementById('excludeDilutedToggle')?.checked??false;
  const irows=[];
  document.querySelectorAll('#intermList .interm-row').forEach(row=>{
    const sel=row.querySelector('select.interm-sel');if(!sel)return;
    const rid=row.id.replace('irow_','');
    irows.push({key:sel?.value||'',box:document.getElementById('iqty_'+rid+'_box')?.value||'',set:document.getElementById('iqty_'+rid+'_set')?.value||'',ea:document.getElementById('iqty_'+rid+'_ea')?.value||''});
  });
  d.__irows=irows;oceanStore.save(d);
}
window.saveAll = saveAll;
function loadAll(){
  try{
    const d=oceanStore.load();
    getStaticIds().forEach(id=>{const e=document.getElementById(id);if(e&&d[id]!==undefined)e.value=d[id];});
    const sfTog=document.getElementById('sfCostToggle');     if(sfTog)sfTog.checked    =d.__sfCostToggle     ??false;
    const stTog=document.getElementById('viewByStageToggle');if(stTog)stTog.checked    =d.__viewByStageToggle??false;
    const efTog=document.getElementById('essFirstToggle');   if(efTog)efTog.checked    =d.__essFirstToggle   ??false;
    const upTog=document.getElementById('useProcToggle');       if(upTog)upTog.checked=d.__useProcToggle      ??false;
    const xdTog=document.getElementById('excludeDilutedToggle');if(xdTog)xdTog.checked=d.__excludeDilutedToggle??false;
    SF_TYPES.forEach(sf=>SF_TIERS.forEach(t=>{const id='have_'+sf+'_'+t,p=document.getElementById(id+'_p'),n=readSplitQty(id);if(p&&n>0)p.textContent='총 '+f(n)+'개';}));
    if(Array.isArray(d.__irows)){d.__irows.forEach(({key,box,set,ea,qty})=>{
      addIntermRow();
      const list2=document.getElementById('intermList'),row2=list2?.lastElementChild;if(!row2)return;
      const rid=row2.id.replace('irow_','');
      if(key){
        const it=INTERM_BY_KEY[key];
        const hiddenSel=document.getElementById('isel_'+rid);
        if(hiddenSel&&it){
          const opt=document.createElement('option');
          opt.value=key;opt.textContent=it.name;
          hiddenSel.appendChild(opt);
          hiddenSel.value=key;
        }
        const lbl=document.getElementById('isel_lbl_'+rid);
        if(lbl&&it){
          lbl.textContent=it.name;
          lbl.style.color=it.color;
          lbl.style.borderColor=it.color+'88';
          lbl.style.background=it.color+'18';
        }
      }
      const bEl=document.getElementById('iqty_'+rid+'_box');
      const sEl=document.getElementById('iqty_'+rid+'_set');
      const eEl=document.getElementById('iqty_'+rid+'_ea');
      if(box!==undefined&&bEl)bEl.value=box;
      if(set!==undefined&&sEl)sEl.value=set;
      if(ea!==undefined&&eEl)eEl.value=ea;
      else if(qty&&eEl)eEl.value=qty;
      const n=readSplitQty('iqty_'+rid);
      const p=document.getElementById('iqty_'+rid+'_p');
      if(p&&n>0)p.textContent='총 '+f(n)+'개';
    });}
    updateIntermWarning();
  }catch(e){}
}


/* ════════════════════════════════════════
   ⑫ 패널 토글·초기화
════════════════════════════════════════ */
window.toggleSkillPanel=()=>document.getElementById('skillPanel').classList.toggle('collapsed');
window.toggleEngPanel  =()=>document.getElementById('engPanel').classList.toggle('collapsed');
window.resetAll=()=>{
  const tabs=[0,1,2,3];
  let curTab=0;
  for(const i of tabs){const p=document.getElementById('t'+i);if(p&&p.style.display!=='none'){curTab=i;break;}}

  const clearEl=(id)=>{const e=document.getElementById(id);if(!e)return;if(e.type==='checkbox')return;else if(e.tagName==='SELECT')e.selectedIndex=0;else e.value='';};
  const clearIds=(ids)=>ids.forEach(clearEl);

  if(curTab===0){
    if(!confirm('하루 수익 탭 입력값을 초기화할까요?'))return;
    clearIds(['rodLevel','totalStamina']);
    syncDropdownLabels();
    calcDaily();

  } else if(curTab===1){
    if(!confirm('시세 입력 탭 입력값을 초기화할까요?'))return;
    clearIds(['price_sf_1','price_sf_2','price_sf_3']);
    Object.keys(VANILLA_META).forEach(k=>clearEl('vprice_'+k));

  } else if(curTab===2){
    if(!confirm('연금 최적화 탭 입력값을 초기화할까요?'))return;
    SF_TYPES.forEach(sf=>SF_TIERS.forEach(t=>{
      ['_box','_set','_ea'].forEach(s=>clearEl('have_'+sf+'_'+t+s));
      const p=document.getElementById('have_'+sf+'_'+t+'_p');if(p)p.textContent='';
    }));
    PROC_GROUPS.forEach(grp=>grp.items.forEach(it=>{
      ['_box','_set','_ea'].forEach(s=>clearEl('proc_'+it.key+s));
    }));
    // 병합 저장 대비: 화면에 없는 모드의 저장값까지 직접 제거(어패류·1차가공품 모두 초기화)
    const _rd=oceanStore.load()||{};
    SF_TYPES.forEach(sf=>SF_TIERS.forEach(t=>['_box','_set','_ea'].forEach(s=>{delete _rd['have_'+sf+'_'+t+s];})));
    PROC_GROUPS.forEach(grp=>grp.items.forEach(it=>['_box','_set','_ea'].forEach(s=>{delete _rd['proc_'+it.key+s];})));
    oceanStore.save(_rd);
    const il=document.getElementById('intermList');if(il)il.innerHTML='';
    intermRowId=0;
    buildHaveSeafoodGrid();
    _cachedOptResult=null;
    const optRes=document.getElementById('optRes');
    if(optRes)optRes.innerHTML='<div class="empty-msg">보유 어패류를 입력한 뒤 계산하기 버튼을 눌러주세요</div>';

  } else if(curTab===3){
    if(!confirm('판매가 계산기 탭 입력값을 초기화할까요?'))return;
    ['DILUTED_EXTRACT','AQUTIS','KRAKEN','LEVIATHAN','WAVE_CORE','DEEP_VIAL','SEA_WING','AQUA_PULSE','NAUTILUS','ABYSS_SPINE']
      .forEach(k=>{clearEl('oSale_'+k+'_set');clearEl('oSale_'+k+'_ea');});
    ['BROOCH','PERFUME','MIRROR','HAIRPIN','FAN','WATCH'].forEach(k=>{
      clearEl('oSale_craft_'+k+'_qty');clearEl('oSale_craft_'+k+'_price');
    });
    ['oSaleSF_price1','oSaleSF_price2','oSaleSF_price3','oSaleSF_qty1','oSaleSF_qty2','oSaleSF_qty3'].forEach(clearEl);
    clearEl('oSaleAlchOtherLv');
    clearEl('oSaleAlchRatioSlider');
  }

  saveAll();
};


/* ════════════════════════════════════════
   ⑬ 커스텀 드롭다운
════════════════════════════════════════ */
/* 커스텀 드롭다운은 shared/dropdown.js 로 이동: initOneCdd · syncDropdownLabels · bindCddOutsideClose() */


/* ══════════════════════════════════════════════════════════════════
   해양 판매가 계산기 (TAB 3)
   - 연금품: 직접판매 / 대리판매 모두 지원
   - 공예품: 직접판매 전용 (대리판매 금지 반영)
   - 어패류: 송금/수수료 계산
   ══════════════════════════════════════════════════════════════════ */

/* ── 연금품 정보 ── */
const O_ALCH_ITEMS = [
  { key:'DILUTED_EXTRACT', name:'추출된 희석액',         color:'#c8920a', tier:0 },
  { key:'AQUTIS',      name:'영생의 아쿠티스 ★',    color:'#1e9e58', tier:1 },
  { key:'KRAKEN',      name:'크라켄의 광란체 ★',    color:'#1e9e58', tier:1 },
  { key:'LEVIATHAN',   name:'리바이던의 깃털 ★',    color:'#1e9e58', tier:1 },
  { key:'WAVE_CORE',   name:'해구 파동의 코어 ★★',  color:'#2060c8', tier:2 },
  { key:'DEEP_VIAL',   name:'침묵의 심해 비약 ★★',  color:'#2060c8', tier:2 },
  { key:'SEA_WING',    name:'청해룡의 날개 ★★',     color:'#2060c8', tier:2 },
  { key:'AQUA_PULSE',  name:'아쿠아 펄스 파편 ★★★', color:'#c82828', tier:3 },
  { key:'NAUTILUS',    name:'나우틸러스의 손 ★★★',  color:'#c82828', tier:3 },
  { key:'ABYSS_SPINE', name:'무저의 척추 ★★★',      color:'#c82828', tier:3 },
];

/* ── 공예품 정보 (진주 색상 반영) ── */
const O_CRAFT_ITEMS = [
  { key:'BROOCH',  name:'조개껍데기 브로치', emoji:'📿', priceMax: 50000,   color:'#d4a020' }, // yellow
  { key:'PERFUME', name:'푸른 향수병',       emoji:'🧴', priceMax:150000,   color:'#3d6fd4' }, // blue
  { key:'MIRROR',  name:'자개 손거울',       emoji:'🪞', priceMax:300000,   color:'#1aacac' }, // cyan
  { key:'HAIRPIN', name:'분홍 헤어핀',       emoji:'📌', priceMax:500000,   color:'#d46090' }, // pink
  { key:'FAN',     name:'자개 부채',         emoji:'🪭', priceMax:700000,   color:'#7c52c8' }, // purple
  { key:'WATCH',   name:'흑진주 시계',       emoji:'⌚', priceMax:1000000,  color:'#555555' }, // black
];

/* ── 스킬 테이블 ── */
const O_ALCH_BONUS  = SKILLS.ALCH_BONUS.bonusPct;   // 연금술 보너스
const O_CRAFT_BONUS = SKILLS.CRAFT_BONUS.bonusPct;  // 공예품 보너스

/* ── 유틸 (계산/표시 공통은 shared/sale-calc.js: _ofk·_orrow·_oCalcN·_oProxyCalc·_oResultBox) ── */
const _oel   = id => document.getElementById(id);
const _ogi   = id => { const e=_oel(id); return e ? Math.max(0,+e.value||0) : 0; };

/* ── 서브탭 ── */
function onOceanSaleSubTab(i, el) {
  _oel('oceanSaleSubTabBar').querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  _oel('oceanSalePanelAlch').style.display  = i===0 ? '' : 'none';
  _oel('oceanSalePanelCraft').style.display = i===1 ? '' : 'none';
  _oel('oceanSalePanelSF').style.display    = i===2 ? '' : 'none';
}

/* ════════════════════════════════
   연금품 섹션 (직접/대리판매 모두 지원)
════════════════════════════════ */
function onOceanSaleAlchToggle() {
  const on = _oel('oSaleAlchProxyToggle')?.checked ?? false;
  _oel('oSaleAlchProxyCard').style.display = on ? '' : 'none';
  calcOceanSaleAlch();
}

function onOceanSaleAlchFeeChange() {
  const feeSeller = _oel('oSaleAlchFeeSeller')?.checked ?? true;
  _oel('oSaleAlchSliderWrap').style.display = feeSeller ? '' : 'none';
  calcOceanSaleAlch();
}

function onOceanSaleAlchRatioChange() {
  const v = _ogi('oSaleAlchRatioSlider') || 115;
  const lbl = _oel('oSaleAlchRatioLabel');
  if (lbl) lbl.textContent = v + '%';
  calcOceanSaleAlch();
}

function calcOceanSaleAlch() {
  /* 내 스킬 뱃지 */
  const myLv    = _ogi('skillAlchBonus');
  const myBonus = O_ALCH_BONUS[myLv] ?? 0;
  const badgeEl = _oel('oceanAlchMySkillVal');
  if (badgeEl) badgeEl.textContent = myLv === 0 ? '0레벨 (기본)' : `Lv${myLv} +${myBonus}%`;

  const resEl = _oel('oSaleAlchRes'); if (!resEl) return;

  /* 수량 읽기 (세트×64 + 개) */
  const _oAlchQty = key => {
    const SET = typeof UNITS !== 'undefined' ? UNITS.SET_SIZE : 64;
    return _ogi('oSale_'+key+'_set')*SET + _ogi('oSale_'+key+'_ea');
  };
  const items = O_ALCH_ITEMS.map(it => ({
    ...it,
    qty:       _oAlchQty(it.key),
    basePrice: PRECISION_ALCHEMY[it.key]?.price ?? 0,
  })).filter(it => it.qty > 0);

  if (!items.length) { resEl.innerHTML='<div class="empty-msg">수량을 입력하면 계산됩니다</div>'; return; }

  /* 내 직접판매 총액 */
  const myTotal = items.reduce((s, it) => s + Math.round(it.basePrice * (100+myBonus)/100) * it.qty, 0);

  const isProxy = _oel('oSaleAlchProxyToggle')?.checked ?? false;

  /* 직접판매 */
  if (!isProxy) {
    const rows = items.map(it => {
      const unitPrice = Math.round(it.basePrice * (100+myBonus)/100);
      return _orrow(
        `<span style="color:${it.color}">${it.name}</span> (${_ofk(it.basePrice)}원 × ${100+myBonus}%)`,
        `${_ofk(unitPrice)}원 × ${it.qty.toLocaleString('ko-KR')}개 = <b>${_ofk(unitPrice*it.qty)}원</b>`
      );
    }).join('');
    resEl.innerHTML = `
    <div class="rsec">
      <div class="rsec-title">⚗️ 직접판매 — 연금술 보너스 Lv${myLv} +${myBonus}%</div>
      ${rows}
    </div>
    <div class="result-box">
      <div class="rb-label">총 수령액</div>
      <div class="rb-value" style="color:var(--grn)">${_ofk(myTotal)}원</div>
    </div>`;
    return;
  }

  /* 대리판매 */
  const otherLv    = _ogi('oSaleAlchOtherLv');
  const otherBonus = O_ALCH_BONUS[otherLv] ?? 0;
  const myBetter   = myBonus > otherBonus;
  const samePct    = myBonus === otherBonus;

  if (samePct) {
    resEl.innerHTML = `
    <div class="rsec">
      ${_orrow('내 스킬',   `연금술 Lv${myLv} +${myBonus}%`)}
      ${_orrow('상대 스킬', `연금술 Lv${otherLv} +${otherBonus}%`)}
    </div>
    <div style="background:var(--ylw-bg);border:1.5px solid var(--ylw);border-radius:var(--rs);padding:10px 12px;text-align:center;font-size:13px;color:var(--ylw)">
      두 스킬이 동일해서 대리판매로 추가 이득이 없어요
    </div>`; return;
  }

  const sellerBonus = myBetter ? myBonus : otherBonus;
  const sellerTotal = items.reduce((s, it) => s + Math.round(it.basePrice*(100+sellerBonus)/100)*it.qty, 0);

  const feeSeller  = _oel('oSaleAlchFeeSeller')?.checked ?? true;
  const ratioPct   = feeSeller ? (_ogi('oSaleAlchRatioSlider')||115) : null;
  const agreeTotal = feeSeller
    ? items.reduce((s, it) => s + Math.round(it.basePrice*ratioPct/100)*it.qty, 0)
    : sellerTotal;

  const ratioNoteEl = _oel('oSaleAlchRatioNote');
  if (ratioNoteEl && feeSeller) ratioNoteEl.textContent = `기본가 × ${ratioPct}% 합산 = ${_ofk(agreeTotal)}원`;

  const { clientGet, sellerProfit, fee } = _oProxyCalc({ sellerTotal, agreeTotal, feeSeller });
  const feeNote = feeSeller
    ? `${_ofk(agreeTotal)}원 × 5% = ${_ofk(fee)}원 (판매자 부담)`
    : `${_ofk(clientGet)}원 × 5% = ${_ofk(fee)}원 (의뢰인 차감)`;
  const extraGain = clientGet - myTotal;

  if (myBetter) {
    resEl.innerHTML = `
    <div style="background:var(--blu-bg);border:1.5px solid var(--blu);border-radius:var(--rs);padding:8px 12px;margin-bottom:8px;font-size:12px;color:var(--blu);font-weight:700">
      내 스킬(Lv${myLv} +${myBonus}%)이 상대방(Lv${otherLv} +${otherBonus}%)보다 높아요
    </div>
    <div class="rsec">
      <div class="rsec-title">내가 대신 판매</div>
      ${_orrow('내 스킬 적용 총 판매가', `<b>${_ofk(sellerTotal)}원</b>`, 'color:var(--grn)')}
      ${feeSeller ? _orrow(`판매 퍼센트 (기본가 × ${ratioPct}% 합산)`, `${_ofk(agreeTotal)}원`) : ''}
      ${_orrow('수수료', feeNote)}
      ${_orrow('송금해야 할 금액', `<b>${_ofk(clientGet)}원</b>`)}
    </div>
    ${_oResultBox('상대방 받는 금액', _ofk(clientGet)+'원', 'var(--txt)',
        '내 이득', (sellerProfit>=0?'+':'')+_ofk(sellerProfit)+'원',
        sellerProfit>=0?'var(--grn)':'var(--red)',
        `총 판매 ${_ofk(sellerTotal)}원 — 약정 ${_ofk(agreeTotal)}원 — 수수료 ${_ofk(fee)}원`)}`;
  } else {
    resEl.innerHTML = `
    <div style="background:var(--grn-bg);border:1.5px solid var(--grn);border-radius:var(--rs);padding:8px 12px;margin-bottom:8px;font-size:12px;color:var(--grn);font-weight:700">
      상대방 스킬(Lv${otherLv} +${otherBonus}%)이 더 높아요
    </div>
    <div class="rsec">
      <div class="rsec-title">상대방이 대신 판매</div>
      ${_orrow('상대방 스킬 적용 총 판매가', `<b>${_ofk(sellerTotal)}원</b>`)}
      ${feeSeller ? _orrow(`(기본가 × ${ratioPct}% 합산)`, `${_ofk(agreeTotal)}원`) : ''}
      ${_orrow('수수료', feeNote)}
      ${_orrow('내가 받는 금액', `<b>${_ofk(clientGet)}원</b>`, 'color:var(--grn)')}
      <div style="border-top:1px dashed var(--bdr2);margin-top:4px;padding-top:5px">
        ${_orrow('내가 직접판매 시', `${_ofk(myTotal)}원 (Lv${myLv} +${myBonus}%)`, 'color:var(--muted)')}
      </div>
    </div>
    ${_oResultBox('내가 받는 금액', _ofk(clientGet)+'원', 'var(--grn)',
        '대리판매 추가수익', (extraGain>=0?'+':'')+_ofk(extraGain)+'원',
        extraGain>=0?'var(--grn)':'var(--red)')}`;
  }
}

/* ════════════════════════════════
   어패류 섹션
════════════════════════════════ */
function calcOceanSaleSF() {
  const resEl = _oel('oSaleSFRes'); if (!resEl) return;

  const p1 = _ogi('oSaleSF_price1'), q1 = _ogi('oSaleSF_qty1');
  const p2 = _ogi('oSaleSF_price2'), q2 = _ogi('oSaleSF_qty2');
  const p3 = _ogi('oSaleSF_price3'), q3 = _ogi('oSaleSF_qty3');

  const hasInput = (q1>0&&p1>0) || (q2>0&&p2>0) || (q3>0&&p3>0);
  if (!hasInput) { resEl.innerHTML='<div class="empty-msg">가격과 수량을 입력하면 계산됩니다</div>'; return; }

  // 송금액 = 전체 합계 고정
  const n = p1*q1 + p2*q2 + p3*q3;
  // 수수료 = ceil(송금액 × 0.05)
  const fee = Math.ceil(n * 0.05);

  resEl.innerHTML = `
  <div class="result-box">
    <div style="display:flex;gap:0;align-items:stretch">
      <div style="flex:1;text-align:center;padding:4px 8px">
        <div class="rb-label">송금 금액</div>
        <div class="rb-value" style="color:var(--grn);font-size:18px">${_ofk(n)}원</div>
      </div>
      <div style="width:1px;background:var(--bdr2);margin:4px 0"></div>
      <div style="flex:1;text-align:center;padding:4px 8px">
        <div class="rb-label">수수료</div>
        <div class="rb-value" style="font-size:18px">${_ofk(fee)}원</div>
      </div>
      <div style="width:1px;background:var(--bdr2);margin:4px 0"></div>
      <div style="flex:1;text-align:center;padding:4px 8px">
        <div class="rb-label">총 필요 금액</div>
        <div class="rb-value" style="color:var(--acc);font-size:18px">${_ofk(n+fee)}원</div>
      </div>
    </div>
  </div>`;
}

/* ════════════════════════════════
   공예품 섹션 — 직접판매 전용 (대리판매 금지)
════════════════════════════════ */
function calcOceanSaleCraft() {
  /* 내 스킬 뱃지 */
  const myLv    = _ogi('skillCraftBonus');
  const myBonus = O_CRAFT_BONUS[myLv] ?? 0;
  const badgeEl = _oel('oceanCraftMySkillVal');
  if (badgeEl) badgeEl.textContent = myLv === 0 ? '0레벨 (기본)' : `Lv${myLv} +${myBonus}%`;

  const resEl = _oel('oSaleCraftRes'); if (!resEl) return;

  /* 수량 및 기본가 읽기 */
  const items = O_CRAFT_ITEMS.map(it => {
    const qty       = _ogi(`oSale_craft_${it.key}_qty`);
    const manualPx  = _ogi(`oSale_craft_${it.key}_price`);
    const basePrice = manualPx > 0 ? manualPx : Math.round(it.priceMax * 0.95);
    return { ...it, qty, basePrice, isDefault: manualPx === 0 };
  }).filter(it => it.qty > 0);

  if (!items.length) { resEl.innerHTML='<div class="empty-msg">수량을 입력하면 계산됩니다</div>'; return; }

  /* 직접판매 총액 */
  const myTotal = items.reduce((s, it) => s + Math.round(it.basePrice*(100+myBonus)/100)*it.qty, 0);

  const rows = items.map(it => {
    const unitPrice = Math.round(it.basePrice*(100+myBonus)/100);
    return _orrow(
      `${it.emoji} ${it.name} (${_ofk(it.basePrice)}원 × ${100+myBonus}%)`,
      `${_ofk(unitPrice)}원 × ${it.qty.toLocaleString('ko-KR')}개 = <b>${_ofk(unitPrice*it.qty)}원</b>`
    );
  }).join('');
  resEl.innerHTML = `
  <div class="rsec">
    <div class="rsec-title">🛠️ 공예품 판매 — 공예품 보너스 Lv${myLv} +${myBonus}%</div>
    ${rows}
  </div>
  <div class="result-box">
    <div class="rb-label">총 수령액</div>
    <div class="rb-value" style="color:var(--grn)">${_ofk(myTotal)}원</div>
  </div>`;
}

window.onOceanSaleSubTab          = onOceanSaleSubTab;
window.onOceanSaleAlchToggle      = onOceanSaleAlchToggle;
window.onOceanSaleAlchFeeChange   = onOceanSaleAlchFeeChange;
window.onOceanSaleAlchRatioChange = onOceanSaleAlchRatioChange;
window.calcOceanSaleAlch          = calcOceanSaleAlch;
window.calcOceanSaleCraft         = calcOceanSaleCraft;
window.calcOceanSaleSF            = calcOceanSaleSF;
/* 공예품 대리판매는 제거(직접판매 전용). ocean.html 에 남아있는 onclick 이 에러를 던지지 않도록 하는 무해한 호환 shim */
window.onOceanSaleCraftToggle      = () => { const c=document.getElementById('oSaleCraftProxyCard'); if(c)c.style.display='none'; const t=document.getElementById('oSaleCraftProxyToggle'); if(t)t.checked=false; calcOceanSaleCraft(); };
window.onOceanSaleCraftFeeChange   = () => calcOceanSaleCraft();
window.onOceanSaleCraftRatioChange = () => calcOceanSaleCraft();


/* ══════════════════════════════════════════════════════════════════
   ⑬-α 스태미나 추천 + 남은 재료 → 보유량 적용
   - buildStaminaRecHtml(): 하루수익 탭에 "오늘 어디에 스태미나 쓸지" 추천
   - applyRemainToHave():   최적화 후 남은 재료를 보유량 입력칸에 채우고 저장
   ══════════════════════════════════════════════════════════════════ */

/* tier별 총개수(종류 무시)만으로 최적 조합 탐색 — 그리디 + 로컬 스왑 휴리스틱 */
function _recOptimizeTierTotals(A1, A2, A3, products) {
  const sorted = [...products].sort((a,b)=>b.value-a.value);
  const planRev = plan => Object.entries(plan).reduce((s,[k,n])=>{
    const p=products.find(x=>x.key===k); return s+(p?n*p.value:0);
  },0);
  function refill(basePlan){
    const plan={...basePlan};
    let q1=A1,q2=A2,q3=A3;
    for(const[k,n]of Object.entries(plan)){const p=products.find(x=>x.key===k);if(!p)continue;q1-=n*p.c1;q2-=n*p.c2;q3-=n*p.c3;}
    for(const p of sorted){
      const lims=[];
      if(p.c1>0)lims.push(Math.floor(q1/p.c1));
      if(p.c2>0)lims.push(Math.floor(q2/p.c2));
      if(p.c3>0)lims.push(Math.floor(q3/p.c3));
      const n=lims.length?Math.min(...lims):0;
      if(n>0){plan[p.key]=(plan[p.key]||0)+n;q1-=n*p.c1;q2-=n*p.c2;q3-=n*p.c3;}
    }
    return plan;
  }
  let best=refill({}), bestRev=planRev(best);
  let improved=true,guard=0;
  while(improved&&guard++<300){
    improved=false;
    for(const pk of Object.keys(best)){
      if((best[pk]||0)<=0)continue;
      const trial={...best};trial[pk]--;if(trial[pk]<=0)delete trial[pk];
      const filled=refill(trial), rev=planRev(filled);
      if(rev>bestRev){best=filled;bestRev=rev;improved=true;break;}
    }
  }
  return {plan:best,rev:bestRev};
}

window.buildStaminaRecHtml = function buildStaminaRecHtml() {
  try {
    const sk=getSK(), eng=getENG();
    const rod=ROD[gi('rodLevel')]??ROD[0];
    const stamina=gi('totalStamina');
    const hc=stamina>0?Math.floor(stamina/OCEAN.STAMINA_PER_USE):0;
    if(!hc) return '';

    const deepX=sk.dhPct/100, luckX=eng.slPct/100*eng.slCnt;
    const roulX=eng.frPct/100*(0.9*3.5*ENGRAVING.FISHER_ROULETTE.normalMult+0.1*3.5*ENGRAVING.FISHER_ROULETTE.goldenMult);
    const perH=Math.max(0, rod.seafoodDrop+deepX+luckX+roulX);
    const acqTotal=hc*perH;
    const base1=60,base2=30,base3=10,extra3=sk.sbPct;
    const tt=base1+base2+base3+extra3;
    const r1=base1/tt, r2=base2/tt, r3=(base3+extra3)/tt;
    const rW={1:r1,2:r2,3:r3};

    // 1단계: 보유 + 오늘 획득 = tier별 총개수 (종류 무시)
    const held={};
    for(const sf of SF_TYPES)for(const t of SF_TIERS)held[`${sf}${t}`]=readSplitQty(`have_${sf}_${t}`);
    const heldTier={1:0,2:0,3:0};
    for(const sf of SF_TYPES)for(const t of SF_TIERS)heldTier[t]+=held[`${sf}${t}`];
    const A1=heldTier[1]+acqTotal*r1, A2=heldTier[2]+acqTotal*r2, A3=heldTier[3]+acqTotal*r3;

    // 2단계: tier 총개수로 최적 조합
    const excludeDiluted=document.getElementById('excludeDilutedToggle')?.checked??false;
    const products=[];
    for(const fKey of Object.keys(PRECISION_ALCHEMY)){
      if(excludeDiluted && (PRECISION_ALCHEMY[fKey].tier||0)===0) continue;
      const sfNeed=calcSFNeedForFinal(fKey);
      let c1=0,c2=0,c3=0;
      for(const sf of SF_TYPES){c1+=sfNeed[`${sf}1`]||0;c2+=sfNeed[`${sf}2`]||0;c3+=sfNeed[`${sf}3`]||0;}
      const value=getAlchSellPrice(fKey);
      if(value<=0||(c1<=0&&c2<=0&&c3<=0))continue;
      products.push({key:fKey,tier:PRECISION_ALCHEMY[fKey].tier||0,c1,c2,c3,value,sfNeed});
    }
    if(!products.length) return '';

    const {plan}=_recOptimizeTierTotals(A1,A2,A3,products);
    const planList=Object.entries(plan).filter(([,n])=>n>0);
    if(!planList.length)
      return `<div class="result-box" style="margin-top:12px"><div class="empty-msg" style="font-size:11px;font-weight:500">보유 + 오늘 획득량으로 만들 수 있는 연금품이 없어 추천을 생략합니다</div></div>`;

    // 3단계: 최적조합 필요 어패류(성급·종류) − 보유 = 더 필요한 양 (음수→0)
    const required={};
    for(const[fKey,cnt]of planList){
      const p=products.find(x=>x.key===fKey);
      for(const sf of SF_TYPES)for(const t of SF_TIERS){
        const need=p.sfNeed[`${sf}${t}`]||0;
        if(need>0)required[`${sf}${t}`]=(required[`${sf}${t}`]||0)+need*cnt;
      }
    }

    const sfNames={oyster:'굴',conch:'소라',octopus:'문어',seaweed:'미역',urchin:'성게'};
    const sfColors={oyster:'#3d6fd4',conch:'#c89c00',octopus:'#7c52c8',seaweed:'#d94f3d',urchin:'#3a9e68'};

    // 종류별 가중치 = 병목 성급(부족량/해당성급비율의 최대)
    const weight={}, shortDetail={}; let totalW=0;
    for(const sf of SF_TYPES){
      let w=0; const det=[];
      for(const t of SF_TIERS){
        const a=Math.max(0,(required[`${sf}${t}`]||0)-(held[`${sf}${t}`]||0));
        if(a>0){ if(rW[t]>0)w=Math.max(w,a/rW[t]); det.push(`${t}성 ${f(a)}`); }
      }
      weight[sf]=w; shortDetail[sf]=det; totalW+=w;
    }

    if(totalW<=0)
      return `<div class="result-box" style="margin-top:12px"><div class="rsec-title" style="color:var(--grn)">✅ 추가 낚시 불필요</div><div style="font-size:11px;color:var(--muted);font-weight:500;padding:2px 2px 4px">보유 어패류만으로 위 최적 조합을 만들 수 있어요.</div></div>`;

    // 스태미나 비례 배분 (15 단위)
    const PER=OCEAN.STAMINA_PER_USE;
    const floors={}, fracs=[]; let assigned=0;
    for(const sf of SF_TYPES){const raw=hc*weight[sf]/totalW; floors[sf]=Math.floor(raw); assigned+=floors[sf]; fracs.push([sf,raw-floors[sf]]);}
    let leftH=hc-assigned; fracs.sort((a,b)=>b[1]-a[1]);
    for(let i=0;i<leftH && fracs.length;i++) floors[fracs[i%fracs.length][0]]++;
    const alloc={}; for(const sf of SF_TYPES) alloc[sf]=floors[sf]*PER;

    let rows='';
    for(const sf of SF_TYPES){
      if(weight[sf]<=0) continue;
      const cl=sfColors[sf];
      rows+=`<div class="rrow"><span class="rl"><span style="color:${cl};font-weight:700">${sfNames[sf]}</span> <small style="color:var(--muted)">${shortDetail[sf].length?'부족 '+shortDetail[sf].join('·'):''}</small></span>`
          +`<span class="rv" style="color:${cl}">${f(alloc[sf])} <small style="color:var(--muted)">(${f(floors[sf])}회)</small></span></div>`;
    }
    const usedStam=Object.values(alloc).reduce((s,v)=>s+v,0);

    return `
    <div class="rsec" style="margin-top:12px">
      <div class="rsec-title" style="color:var(--acc)">🎯 오늘 스태미나 추천 배분</div>
      <div style="font-size:10px;color:var(--muted);font-weight:500;margin:-2px 2px 6px">연금 최적화 탭의 보유 어패류 + 오늘 획득 예상으로 최적 연금 조합을 만들기 위한 종류별 배분이에요</div>
      ${rows}
      <div class="rrow rrow-strong"><span class="rl">추천 합계</span><span class="rv g">${f(usedStam)} / ${f(stamina)}</span></div>
    </div>`;
  } catch(e){ console.error('staminaRec error:',e); return ''; }
};

window.applyRemainToHave = () => {
  if(!_cachedOptResult){ return; }
  if(!confirm('최적화 후 남은 재료를 현재 보유량으로 덮어쓸까요?\n(기존 보유 입력값은 대체됩니다)')) return;
  const useProc=document.getElementById('useProcToggle')?.checked??false;
  const wInv=_cachedOptResult.workInv||{};

  const setSplit=(baseId,n)=>{
    n=Math.max(0,Math.floor(n));
    const box=Math.floor(n/BOX_SIZE), rem=n%BOX_SIZE, set=Math.floor(rem/SET_SIZE), ea=rem%SET_SIZE;
    const b=document.getElementById(baseId+'_box'),s=document.getElementById(baseId+'_set'),e=document.getElementById(baseId+'_ea');
    if(b)b.value=box||''; if(s)s.value=set||''; if(e)e.value=ea||'';
    const p=document.getElementById(baseId+'_p'); if(p)p.textContent=n>0?'총 '+f(n)+'개':'';
  };

  if(!useProc){
    for(const sf of SF_TYPES)for(const t of SF_TIERS) setSplit(`have_${sf}_${t}`, wInv[`${sf}${t}`]||0);
  } else {
    const sfToProc={
      oyster1:'essence_guardian1', conch1:'essence_wave1', octopus1:'essence_chaos1',
      seaweed1:'essence_life1',    urchin1:'essence_corrosion1',
      oyster2:'essence_guardian2', conch2:'essence_wave2', octopus2:'essence_chaos2',
      seaweed2:'essence_life2',    urchin2:'essence_corrosion2',
      oyster3:'elixir_guardian',   conch3:'elixir_wave',   octopus3:'elixir_chaos',
      seaweed3:'elixir_life',      urchin3:'elixir_corrosion',
    };
    const procRem={};
    for(const sf of SF_TYPES)for(const t of SF_TIERS){
      const sfKey=`${sf}${t}`, q=wInv[sfKey]||0; if(q<=0)continue;
      const procKey=sfToProc[sfKey]; if(!procKey)continue;
      const rec=ALCHEMY[procKey]; if(!rec)continue;
      const batches=Math.floor(q/(rec.materials[sfKey]||1));
      if(batches>0)procRem[procKey]=(procRem[procKey]||0)+batches*(rec.output||1);
    }
    for(const grp of PROC_GROUPS)for(const it of grp.items) setSplit('proc_'+it.key, procRem[it.key]||0);
  }
  saveAll();
  if(window.runCalcOpt) window.runCalcOpt();
};


/* ════════════════════════════════════════
   ⑭ DOMContentLoaded
════════════════════════════════════════ */
function domReady(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn);else fn();}
domReady(()=>{
  buildVanillaPriceGrid();
  try{
    const __d=oceanStore.load();
    const __u=document.getElementById('useProcToggle');       if(__u)__u.checked=__d.__useProcToggle      ??false;
    const __x=document.getElementById('excludeDilutedToggle');if(__x)__x.checked=__d.__excludeDilutedToggle??false;
  }catch(e){}
  buildHaveSeafoodGrid();loadAll();
  document.querySelectorAll('.skrow select,.field select').forEach(sel=>initOneCdd(sel));
  bindCddOutsideClose();
  syncDropdownLabels();onSkillChange();
  const titleEl=document.getElementById('pageTabTitle');if(titleEl)titleEl.textContent=TAB_TITLES[0];
  document.title='해양 계산기 — '+TAB_TITLES[0];
  const optRes=document.getElementById('optRes');
  if(optRes&&optRes.innerHTML.trim()==='')optRes.innerHTML='<div class="empty-msg">보유 어패류를 입력한 뒤 계산하기 버튼을 눌러주세요</div>';
  getStaticIds().forEach(id=>{const e=document.getElementById(id);if(!e)return;e.addEventListener(e.tagName==='SELECT'?'change':'input',saveAll);});
  const sfTog=document.getElementById('sfCostToggle');     if(sfTog)sfTog.addEventListener('change',window.onSFCostToggle);
  const stTog=document.getElementById('viewByStageToggle');if(stTog)stTog.addEventListener('change',window.onViewToggle);
  const exTog=document.getElementById('excludeDilutedToggle');if(exTog)exTog.addEventListener('change',()=>{saveAll();if(_cachedOptResult)window.runCalcOpt();});
});