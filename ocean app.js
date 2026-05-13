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


/* ════════════════════════════════════════
   ① 유틸리티 함수
════════════════════════════════════════ */
const {SET_SIZE, BOX_SIZE} = UNITS;
const f   = n => Math.round(n).toLocaleString('ko-KR');
const fd  = (n, d=2) => +n.toFixed(d) === Math.round(+n.toFixed(d)) ? Math.round(n).toString() : n.toFixed(d).replace(/\.?0+$/, '');
const gi  = id => { const e = document.getElementById(id); return e ? Math.max(0, +e.value || 0) : 0; };

function fmtQty(n) {
  n = Math.floor(n); if (n <= 0) return '0개';
  const boxes = Math.floor(n / BOX_SIZE), rem = n % BOX_SIZE,
        sets  = Math.floor(rem / SET_SIZE), items = rem % SET_SIZE;
  return [[boxes,'상자'],[sets,'세트'],[items,'개']].filter(([v]) => v > 0).map(([v,u]) => v+u).join(' ') || '0개';
}
function fmtTime(sec) {
  sec = Math.round(sec);
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60;
  return [h&&`${h}시간`, m&&`${m}분`, s&&`${s}초`].filter(Boolean).join(' ') || '0초';
}

const SF_TYPES  = ['oyster','conch','octopus','seaweed','urchin'];
const SF_TIERS  = [1, 2, 3];
const TAB_TITLES = ['하루 수익 예상','시세 입력','연금 최적화'];


/* ════════════════════════════════════════
   ② 탭 전환
════════════════════════════════════════ */
window.sw = (i, el) => {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  [0,1,2].forEach(k => { const p = document.getElementById('t'+k); if (p) p.style.display = 'none'; });
  el.classList.add('on');
  document.getElementById('t'+i).style.display = 'block';
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
  return Math.round(item.price * (1 + (item.tier === 0 ? 0 : sk.ab)));
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
  } catch(err) {
    document.getElementById('dailyRes').innerHTML='<div class="empty-msg" style="color:var(--red)">계산 오류: '+err.message+'</div>';
    console.error('calcDaily error:',err);
  }
};


/* ════════════════════════════════════════
   ⑧ TAB2: 연금 최적화

   수정 사항:
   1. calcSFNeedForFinal: Math.ceil 제거 → 소수 배치 허용, 어패류 소비량 정확 계산
   2. 0성 버그 수정: 성급별 독립 탐색 → 전체 통합 완전탐색
      (기존 1→2→3→0 순서 탐색은 앞 성급이 재고를 먼저 소진해
       0성에 유리한 재고가 남지 않아 0성이 최적화 결과에 안 나오는 버그)
   3. 단계별 보기 토글: 완성품 단위 ↔ 연금 단계(정수→핵→1성→에센스→결정→2성→...) 단위
   4. 제작 시간: 맨 아래 합계 표시 → 완성품 카드 내 단계별 표시
   5. buildAlchPriceList 제거
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

async function calcOpt() {
  const inv = {};
  for (const sf of SF_TYPES) for (const t of SF_TIERS) {
    const v = readSplitQty(`have_${sf}_${t}`);
    if (v > 0) inv[`${sf}${t}`] = (inv[`${sf}${t}`]||0) + v;
  }

  // 중간재료 수집 (ALCHEMY 키: 정수/핵/에센스/결정/엘릭서/영약)
  const intermHave = {};
  document.querySelectorAll('#intermList .interm-row').forEach(row => {
    const sel=row.querySelector('select.interm-sel');if(!sel)return;
    const key=sel.value;if(!key)return;
    const rid=row.id.replace('irow_','');
    const qty=readSplitQty('iqty_'+rid);
    if(qty>0)intermHave[key]=(intermHave[key]||0)+qty;
  });

  // 중간재료를 하위 어패류로 전개해서 inv에 가산
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

  const SF_KEYS = SF_TYPES.flatMap(sf => SF_TIERS.map(t => `${sf}${t}`));
  const sfTotal     = SF_KEYS.reduce((s,k)=>s+(inv[k]||0),0);
  const intermTotal = Object.keys(inv).filter(k=>ALCHEMY[k]).reduce((s,k)=>s+(inv[k]||0),0);
  if (sfTotal<=0&&intermTotal<=0) {
    document.getElementById('optRes').innerHTML='<div class="empty-msg">보유 어패류를 입력하면 계산됩니다</div>';
    return;
  }

  const includeSFCost = document.getElementById('sfCostToggle')?.checked      ?? false;
  const viewByStage   = document.getElementById('viewByStageToggle')?.checked  ?? false;

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
      const tier = parseInt(sf.slice(-1));
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
    // compound(핵/결정/영약) 보유분을 직접 소비하기 위해 필요량 저장
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

  /* ──────────────────────────────────────
     연립방정식 기반 tier별 최적 배분
     알고리즘: 3성→2성→1성 순서로 SF 조합 전체 탐색
  ────────────────────────────────────── */
  const allFKeys = Object.keys(finalAnalysis);

  // ── UB: 그리디 상한 / 연립방정식으로 tier별 최적 개수 계산 ──
  function solveLinearPlan(startInv, zeroRev, zeroPlan) {
    const tier2K = nonZeroKeys.filter(k => finalAnalysis[k].tier === 2);
    const tier3K = nonZeroKeys.filter(k => finalAnalysis[k].tier === 3);
    const tier1K = nonZeroKeys.filter(k => finalAnalysis[k].tier === 1);

    function solveExact(items, ti, inv2) {
      if(!items.length) return null;
      const SF_TYPES_LOCAL = ['oyster','conch','octopus','seaweed','urchin'];
      const stock = SF_TYPES_LOCAL.map(sf => inv2[`${sf}${ti}`] || 0);
      const n = items.length;

      // 각 아이템별 소비 계수
      const A = items.map(k =>
        SF_TYPES_LOCAL.map(sf => {
          const need = finalAnalysis[k].sfNeed[`${sf}${ti}`];
          return need ? Math.ceil(need) : 0;
        })
      );

      // 실제로 소비가 있는 sf 목록
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
        // 초과 조정 (stock 기준)
        for(let iter=0;iter<30;iter++){
          let wo=0,wsi=-1;
          for(let si=0;si<5;si++){const over=items.reduce((s,_,ii)=>s+A[ii][si]*sol[ii],0)-stock[si];if(over>wo){wo=over;wsi=si;}}
          if(wsi<0)break;
          let wi=-1,wa=0;for(let ii=0;ii<n;ii++){if(A[ii][wsi]>wa&&sol[ii]>0){wa=A[ii][wsi];wi=ii;}}
          if(wi<0)break;
          sol[wi]=Math.max(0,sol[wi]-Math.ceil(wo/wa));
        }
        return sol;
      }

      // 모든 가능한 SF 조합 중 수익 최대인 해 선택
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

    // tier 순서로 풀기: 3성 → 2성 → 1성
    const curInv = {...startInv};
    const curPlan = {...zeroPlan};
    let rev = zeroRev;

    for (const [tierK, ti] of [[tier3K, 3], [tier2K, 2], [tier1K, 1]]) {
      if (!tierK.length) continue;
      const sortedTK = [...tierK].sort((a,b) => finalAnalysis[b].sellPrice - finalAnalysis[a].sellPrice);
      const sol = solveExact(sortedTK, ti, curInv);
      if (!sol) continue;

      // 연립해를 적용하되 실현 가능한지 확인
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

  // 0성/비0성 분리
  const nonZeroKeys   = allFKeys.filter(k => finalAnalysis[k].tier !== 0);
  const zeroKeys      = allFKeys.filter(k => finalAnalysis[k].tier === 0);

  // 희석액 최대 제작 가능 수
  const maxDilutedForInit = zeroKeys.length > 0
    ? zeroKeys.reduce((mn,k) => Math.min(mn, maxMake(finalAnalysis[k].sfNeed, {...inv})), Infinity)
    : 0;

  showOptLoading(10, '연립방정식 탐색 중');
  await new Promise(r => setTimeout(r, 20));

  let bestRev  = 0;
  let bestPlan = Object.fromEntries(allFKeys.map(k=>[k,0]));
  let workInv  = {...inv};

  // ── 연립방정식 완전탐색 ──
  // d=0..maxD 각각에서 연립방정식으로 최적 계획 계산
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

  const planEntries=Object.entries(bestPlan).filter(([,cnt])=>cnt>0)
    .sort((a,b)=>{
      const ta=finalAnalysis[a[0]].tier, tb=finalAnalysis[b[0]].tier;
      // 0성은 맨 뒤, 나머지는 1→2→3 오름차순
      const ra=ta===0?99:ta, rb=tb===0?99:tb;
      return ra-rb || finalAnalysis[b[0]].sellPrice-finalAnalysis[a[0]].sellPrice;
    });

  if(!planEntries.length){
    _cachedOptResult = null;
    document.getElementById('optRes').innerHTML='<div class="empty-msg">재료가 부족하여 만들 수 있는 연금품이 없습니다<br><small style="font-weight:500">어패류 보유량을 확인해주세요</small></div>';
    return;
  }

  const totalRev=planEntries.reduce((s,[k,cnt])=>s+finalAnalysis[k].sellPrice*cnt,0);

  const totalVan={};
  function collectVan(key,qty,depth=0){if(depth>12)return;if(VANILLA_META[key]){totalVan[key]=(totalVan[key]||0)+qty;return;}const rec=ALCHEMY[key];if(!rec)return;const b=Math.ceil(qty/(rec.output||1));for(const[mk,mq]of Object.entries(rec.materials))collectVan(mk,mq*b,depth+1);}
  for(const[fKey,cnt]of planEntries)for(const[mk,mq]of Object.entries(PRECISION_ALCHEMY[fKey].materials))collectVan(mk,mq*cnt);

  _cachedOptResult = { planEntries, finalAnalysis, workInv, totalRev, totalVan, SF_KEYS, inv, intermHave };

  renderOptResult(_cachedOptResult);
}

/* ════════════════════════════════════════
   renderOptResult — 캐시된 결과를 토글 상태에 맞게 렌더링
   calcOpt 완료 후 호출, 토글 변경 시에도 재호출
════════════════════════════════════════ */
function renderOptResult({ planEntries, finalAnalysis, workInv, totalRev, totalVan, SF_KEYS, inv, intermHave={} }) {
  const includeSFCost = document.getElementById('sfCostToggle')?.checked      ?? false;
  const viewByStage   = document.getElementById('viewByStageToggle')?.checked  ?? false;

  // 순이익 재계산 (토글에 따라 달라짐)
  for (const fKey of Object.keys(finalAnalysis)) {
    const fa = finalAnalysis[fKey];
    fa.netPerUnit = fa.sellPrice - fa.vanCost - (includeSFCost ? fa.sfCost : 0);
  }

  const sfColors={oyster:'#3d6fd4',conch:'#c89c00',octopus:'#7c52c8',seaweed:'#d94f3d',urchin:'#3a9e68'};
  // ── 완성품 tier 색상 (어패류 고유색과 겹치지 않는 색으로 구분) ──
  // 1성: 딥퍼플 / 라벤더 / 살구핑크
  // 2성: 다크슬레이트 / 핫핑크 / 스카이블루
  // 3성: 라일락 / 틸 / 딥로즈
  // tier 색상: 1성=초록, 2성=파랑, 3성=빨강, 0성=노랑
  const tierColors={
    0:'#c8920a',  // 노랑 (0성)
    1:'#1e9e58',  // 초록 (1성)
    2:'#2060c8',  // 파랑 (2성)
    3:'#c82828',  // 빨강 (3성)
  };
  // 완성품별 색상 — 같은 tier는 명도/채도 변주, 어패류색과 차별화
  const finColors={
    LEVIATHAN: '#1e9e58', KRAKEN: '#1e9e58', AQUTIS: '#1e9e58',
    SEA_WING:  '#2060c8', DEEP_VIAL: '#2060c8', WAVE_CORE: '#2060c8',
    ABYSS_SPINE:'#c82828', NAUTILUS: '#c82828', AQUA_PULSE: '#c82828',
  };
  // 핵/결정/영약: tier 색상 기반으로 통일 (개별 항목은 기존 유지)
  const compoundColors={
    core_guard:    '#4db8e8', core_wave:'#f0853a', core_chaos:'#9060c8', core_life:'#c03040', core_corrosion:'#48c070',
    crystal_vitality:'#4db8e8', crystal_erosion:'#f0853a', crystal_defense:'#9060c8', crystal_torrent:'#c03040', crystal_poison:'#48c070',
    potion_immortal:'#4db8e8', potion_barrier:'#f0853a', potion_corrupt:'#9060c8', potion_frenzy:'#c03040', potion_venom:'#48c070',
  };
  // 정수/에센스/엘릭서 순서 (굴→소라→문어→미역→성게)
  const essOrder1=['essence_guardian1','essence_wave1','essence_chaos1','essence_life1','essence_corrosion1'];
  const essOrder2=['essence_guardian2','essence_wave2','essence_chaos2','essence_life2','essence_corrosion2'];
  const essOrder3=['elixir_guardian','elixir_wave','elixir_chaos','elixir_life','elixir_corrosion'];
  // 핵 순서: 물결/파동/질서/활력/침식
  const coreOrder=['core_guard','core_wave','core_chaos','core_life','core_corrosion'];
  // 결정 순서: 활기/파도/방어/격류/맹독
  const crysOrder=['crystal_vitality','crystal_erosion','crystal_defense','crystal_torrent','crystal_poison'];
  // 영약 순서: 불멸/파동/타락/생명/맹독
  const potiOrder=['potion_immortal','potion_barrier','potion_corrupt','potion_frenzy','potion_venom'];
  // 완성품 순서
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
  const fr=getSK().fr;

  function getSFMatch(k){return k.match(/^(oyster|conch|octopus|seaweed|urchin)(\d)$/);}
  function getSFName(k){const m=getSFMatch(k);if(!m)return null;return (SEAFOOD_TYPES[m[1]]?.name||m[1])+' '+'★'.repeat(+m[2]);}
  const SHORT_NAMES={
    coral_dead_tube:'관 산호', coral_dead_brain:'사방산호',
    coral_dead_bubble:'거품 산호', coral_dead_fire:'불 산호', coral_dead_horn:'뇌 산호',
    spruce_leaf:'가문비 잎', dark_oak_leaf:'짙참 잎',
  };
  function getMatName(k){return SHORT_NAMES[k]||getSFName(k)||VANILLA_META[k]?.name||ALCHEMY[k]?.name||k;}
  function getMatColor(k){const m=getSFMatch(k);if(m)return sfColors[m[1]];if(VANILLA_META[k])return '#607090';if(ALCHEMY[k])return ALCHEMY[k].color||'#607090';return '#607090';}
  function chip(key,qty,qtyStr){const color=getMatColor(key),name=getMatName(key),qs=qtyStr||(qty!=null?fmtQty(qty):'');return `<span class="mat-chip-flow" style="--chip-color:${color}"><span class="chip-name">${name}</span><span class="chip-qty">${qs}</span></span>`;}
  const plus='<span class="flow-plus">+</span>';
  const arrow='<span class="flow-arrow">→</span>';

  const netLabel=includeSFCost
    ?'순이익 <small style="font-weight:500;font-size:9px">(어패류+바닐라)</small>'
    :'순이익 <small style="font-weight:500;font-size:9px">(바닐라만)</small>';

  let html='';

  /* ──────────────────────────────────────
     뷰 A: 완성품 단위
  ────────────────────────────────────── */
  if (!viewByStage) {
    for(const[fKey,cnt]of planEntries){
      const fa=finalAnalysis[fKey],color=finColors[fKey]||tierColors[fa.tier]||'#607090';
      const netColor=fa.netPerUnit>=0?'var(--grn)':'var(--red)',netSign=fa.netPerUnit>=0?'+':'';
      const sfCostNote=includeSFCost&&fa.sfCost>0
        ?` <small style="color:var(--muted)">(어패류 ${f(Math.round(fa.sfCost))}원 + 바닐라 ${f(Math.round(fa.vanCost))}원)</small>`
        :(fa.vanCost>0?` <small style="color:var(--muted)">(바닐라 ${f(Math.round(fa.vanCost))}원)</small>`:'');

      // 단계별 제작 시간
      let t1sec=0,t2sec=0,t3sec=0;
      for(const[mk,mq]of Object.entries(fa.step2)){const r=ALCHEMY[mk];if(r)t1sec+=Math.ceil((mq*cnt)/(r.output||1))*(r.craftTimeSec||0);}
      for(const[mk,mq]of Object.entries(fa.step3)){const r=ALCHEMY[mk];if(r)t2sec+=(mq*cnt)*(r.craftTimeSec||0);}
      t3sec=cnt*(fa.craftTimeSec||0);
      const totalSecCard=(t1sec+t2sec+t3sec)*(1-fr);

      // 필요 어패류 표시: sfNeed(소수) × cnt를 반올림
      // sfNeed는 calcSFNeedForFinal에서 소수로 계산됨 (output:2 에센스 영향)
      // × cnt 후 Math.round로 표시 (ceil보다 실제에 가까움)
      const sfUsed = {};
      for (const [k, v] of Object.entries(fa.sfNeed)) {
        if (v > 0) sfUsed[k] = v * cnt;
      }
      const guideId='guide_'+fKey;

      // 50개 단위 분할 표시 (예: 128개 → 50+50+28)
      const CHUNK = 50;
      let cntDisplay = fmtQty(cnt);
      if (cnt > CHUNK) {
        const parts = [];
        let rem = cnt;
        while (rem > 0) { parts.push(Math.min(rem, CHUNK)); rem -= CHUNK; }
        cntDisplay = fmtQty(cnt) + `<div style="font-size:10px;color:var(--muted);font-weight:500;margin-top:2px">${parts.join('+')}개</div>`;
      }

      html+=`<div class="craft-flow-card" style="--tier-color:${color}">`;
      // 헤더 — 수익/가격 제거, 합계 시간 표시
      html+=`<div class="cfc-header"><div class="cfc-header-left"><div class="cfc-name">${fa.name}</div>`
        +`<div class="cfc-sub"><span style="opacity:.7">${tierLabels[fa.tier]}</span>`
        +` &nbsp;·&nbsp; ⏱️ ${fmtTime(totalSecCard)}</div>`
        +`</div><div class="cfc-header-right"><div class="cfc-count">${cntDisplay}</div></div></div>`;

      const sfEntries=Object.entries(sfUsed).filter(([,v])=>v>0);
      if(sfEntries.length){
        html+=`<div class="cfc-section"><div class="cfc-section-label">📦 필요 어패류</div><div class="sf-chip-wrap">`;
        for(const[k,v]of sfEntries){
          const cl=getMatColor(k),nm=getMatName(k);
          html+=`<div class="sf-chip" style="--chip-color:${cl}"><span class="sc-name">${nm}</span><span class="sc-qty">${fmtQty(Math.round(v))}</span></div>`;
        }
        html+=`</div></div>`;
      }

      // 제작 가이드 토글 — 결과물 / 재료 분리 한줄 형식 + 시간 포함
      html+=`<div class="guide-toggle" onclick="toggleGuide('${guideId}')"><span class="guide-toggle-arrow" id="${guideId}_arrow">▶</span> 제작 가이드 &amp; 시간 보기</div>`;
      html+=`<div class="guide-body" id="${guideId}" style="padding:10px 14px">`;

      // 어패류는 별 유지, 중간재료는 별 제거
      function isSF(k){ return /^(oyster|conch|octopus|seaweed|urchin)\d$/.test(k); }
      function dispName(k){ return isSF(k) ? getMatName(k) : getMatName(k).replace(/\s*★+/g,''); }

      // 공통 칩 스타일 (크기 동일)
      const chipBase = 'display:inline-flex;align-items:center;gap:3px;border-radius:6px;padding:2px 7px;font-size:11px;white-space:nowrap;font-weight:700';

      // 보유 중간재료 소진 추적 (완성품 카드 내에서, 1차→2차 순서로 소진)
      const iRemain={...intermHave};

      function matChips(matObj, batchMul, isCompound=false) {
        return Object.entries(matObj).filter(([,v])=>v>0)
          .map(([mk,mq])=>{
            const totalQ = Math.ceil(mq*batchMul);
            const col = getMatColor(mk);
            let qtyStr = fmtQty(totalQ);
            // 1차 재료(essence)에서만 보유 차감 표시, compound(핵) 재료에서는 표시 안 함
            if(!isCompound){
              const avail=iRemain[mk]||0;
              if(avail>0){
                const use=Math.min(avail,totalQ);
                iRemain[mk]=avail-use;
                const needQ=Math.max(0,totalQ-use);
                qtyStr=`${fmtQty(needQ)} <span style="font-size:9px;opacity:.6">+보유${fmtQty(use)}</span>`;
              }
            }
            return `<span style="${chipBase};background:var(--bg);border:1.5px solid ${col}44"><span style="color:${col}">${dispName(mk)}</span> <span style="color:var(--txt)">${qtyStr}</span></span>`;
          })
          .join(' ');
      }
      function resultChip(name, qty, col) {
        return `<span style="${chipBase};background:${col}15;border:1.5px solid ${col}"><span style="color:${col}">${name}</span> <span style="color:${col}">${qty}</span></span>`;
      }
      const dot = `<span style="color:var(--bdr2);font-size:13px;font-weight:900;flex-shrink:0">·</span>`;

      const rowStyle = 'display:flex;align-items:center;flex-wrap:wrap;gap:5px;padding:5px 0;border-bottom:1px dashed var(--bdr)';

      const s2=Object.entries(fa.step2).filter(([,v])=>v>0);
      if(s2.length){
        html+=`<div style="font-family:'Jua',sans-serif;font-size:11px;color:var(--muted);margin:4px 0 4px">⚗️ 1차 연금품 — ${fmtTime(t1sec*(1-fr))}</div>`;
        for(const[mk2,mq2]of s2){
          const rec2=ALCHEMY[mk2];if(!rec2)continue;
          const need2=mq2*cnt, b2=Math.ceil(need2/(rec2.output||1));
          // 보유 차감: 1차는 essence이므로 보유 표시 가능
          const haveThis=iRemain[mk2]||0;
          const useThis=Math.min(haveThis,need2);
          if(useThis>0)iRemain[mk2]-=useThis;
          const netNeed2=need2-useThis;
          let resultQty=fmtQty(netNeed2);
          if(useThis>0)resultQty+=` <span style="font-size:9px;opacity:.6">+보유${fmtQty(useThis)}</span>`;
          html+=`<div style="${rowStyle}">`;
          html+=resultChip(dispName(mk2), resultQty, getMatColor(mk2));
          html+=dot;
          // 재료는 실제 제작량(netNeed2) 기준, 보유 표시 없음
          html+=matChips(rec2.materials, Math.ceil(netNeed2/(rec2.output||1)), true);
          html+=`</div>`;
        }
      }
      const s3=Object.entries(fa.step3).filter(([,v])=>v>0);
      if(s3.length){
        html+=`<div style="font-family:'Jua',sans-serif;font-size:11px;color:var(--muted);margin:8px 0 4px">🔮 2차 연금품 — ${fmtTime(t2sec*(1-fr))}</div>`;
        for(const[mk,mq]of s3){
          const rec=ALCHEMY[mk];if(!rec)continue;
          html+=`<div style="${rowStyle}">`;
          html+=resultChip(dispName(mk), fmtQty(mq*cnt), getMatColor(mk));
          html+=dot;
          html+=matChips(rec.materials, mq*cnt, true); // 2차는 보유 표시 없음
          html+=`</div>`;
        }
      }
      html+=`<div style="font-family:'Jua',sans-serif;font-size:11px;color:${color};margin:8px 0 4px">🏆 최종 — ${fmtTime(t3sec*(1-fr))}</div>`;
      html+=`<div style="${rowStyle};border-bottom:none">`;
      html+=resultChip(fa.name, fmtQty(cnt), color);
      html+=dot;
      html+=matChips(PRECISION_ALCHEMY[fKey].materials, cnt, true);
      html+=`</div>`;

      html+=`</div></div></div>`;
    }

    // 완성품별 보기 수익 합산 (단계별과 동일)
    {
      const chipB='display:inline-flex;align-items:center;gap:3px;border-radius:6px;padding:2px 7px;font-size:11px;white-space:nowrap;font-weight:700;justify-content:center';
      html+=`<div class="craft-flow-card" style="--tier-color:var(--acc);margin-bottom:10px">`;
      html+=`<div class="cfc-header" style="border-left-color:var(--acc)">`;
      html+=`<div class="cfc-header-left"><div class="cfc-name" style="font-size:14px">💰 수익 합산</div></div>`;
      html+=`<div class="cfc-header-right"><div style="font-size:13px;color:var(--grn);font-weight:900">${f(totalRev)}원</div></div>`;
      html+=`</div><div class="cfc-section" style="padding:8px 14px">`;
      const lStyle='display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px dashed var(--bdr)';
      for(const[fKey,cnt]of planEntries){
        const fa2=finalAnalysis[fKey];if(!fa2||cnt<=0)continue;
        const color2=finColors[fKey]||tierColors[fa2.tier]||'#607090';
        const rev=fa2.sellPrice*cnt;
        const netTot=Math.round(fa2.netPerUnit)*cnt;
        const netColor2=netTot>=0?'var(--grn)':'var(--red)';
        const netSign2=netTot>=0?'+':'';
        const name=fa2.name.replace(/★+\s*/g,'').replace(/\s*★+/g,'').trim();
        html+=`<div style="${lStyle}">`;
        html+=`<span style="${chipB};background:${color2}18;border:1.5px solid ${color2};min-width:100px"><span style="color:${color2}">${name}</span></span>`;
        html+=`<span style="font-size:12px;color:var(--muted);flex-shrink:0">${fmtQty(cnt)}</span>`;
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
      html+=`</div></div>`;
    }

  /* ──────────────────────────────────────
     뷰 B: 연금 단계 단위
     섹션: 정수 → 핵 → 1성완성품 → 에센스 → 결정 → 2성완성품 → 엘릭서 → 영약 → 3성완성품 → 0성완성품
  ────────────────────────────────────── */
  } else {
    // 보유 중간재료 소진 추적 (집계에서 실제로 차감)
    const aggRemain={...intermHave};

    // 각 슬롯별 필요량 집계
    const agg={ess1:{},core:{},fin1:{},ess2:{},crys:{},fin2:{},ess3:{},poti:{},fin3:{},fin0:{}};
    const timeSec={ess1:0,core:0,fin1:0,ess2:0,crys:0,fin2:0,ess3:0,poti:0,fin3:0,fin0:0};
    // 보유로 절감된 양 추적 (표시용)
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
          // 보유 compound(핵/결정/영약) 차감
          const haveComp=aggRemain[mk2]||0;
          const useComp=Math.min(haveComp,totalMk2);
          if(useComp>0){
            aggRemain[mk2]-=useComp;
            aggSaved[slotKey][mk2]=(aggSaved[slotKey][mk2]||0)+useComp;
          }
          const netMk2=totalMk2-useComp; // 실제로 만들어야 하는 양
          agg[slotKey][mk2]=(agg[slotKey][mk2]||0)+netMk2;
          timeSec[slotKey]+=netMk2*(rec2.craftTimeSec||0);
          // compound 하위 essence 집계: compound output은 항상 1이므로 netMk2가 곧 배치수
          for(const[mk3,mq3]of Object.entries(rec2.materials)){
            const rec3=ALCHEMY[mk3];if(!rec3||rec3.type!=='essence')continue;
            const essKey=rec3.tier===1?'ess1':rec3.tier===2?'ess2':'ess3';
            const needEss=mq3*netMk2; // output:1이므로 배치수=netMk2
            // 보유 essence 차감
            const haveEss=aggRemain[mk3]||0;
            const useEss=Math.min(haveEss,needEss);
            if(useEss>0){
              aggRemain[mk3]-=useEss;
              aggSaved[essKey][mk3]=(aggSaved[essKey][mk3]||0)+useEss;
            }
            const netEss=needEss-useEss;
            agg[essKey][mk3]=(agg[essKey][mk3]||0)+netEss;
            timeSec[essKey]+=Math.ceil(netEss/(rec3.output||1))*(rec3.craftTimeSec||0);
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
          timeSec[essKey]+=Math.ceil(netEss/(rec2.output||1))*(rec2.craftTimeSec||0);
        }
      }
    }
    console.log('[DEBUG] planEntries:', JSON.stringify(Object.fromEntries(planEntries)));
    console.log('[DEBUG] agg.ess1:', JSON.stringify(agg.ess1));
    console.log('[DEBUG] agg.core:', JSON.stringify(agg.core));

    function stageSection(label,emoji,aggMap,secKey,accentColor,orderArr){
      const entries=sortedEntries(aggMap,orderArr);
      if(!entries.length)return'';
      const tSec=timeSec[secKey]*(1-fr);
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

        // qty는 이미 보유분 차감된 실제 제작량
        const saved=savedMap[key]||0; // 보유로 절감된 양

        // 개별 제작 시간
        const recAlch=ALCHEMY[key];
        let itemSec=0;
        if(!isPA&&recAlch){
          const batchN=Math.ceil(qty/(recAlch.output||1));
          itemSec=batchN*(recAlch.craftTimeSec||0)*(1-fr);
        }

        const output=(rec?.output)||1;
        const matSource=isPA?PRECISION_ALCHEMY[key]?.materials:rec?.materials;
        const matParts=Object.entries(matSource||{}).filter(([,v])=>v>0)
          .map(([mk,mq])=>{
            let totalQ;
            if(isPA){
              totalQ = mq*qty;
            } else {
              const batch = output>1 ? Math.floor(qty/output) : qty;
              totalQ = mq*batch;
              // 재고 초과 시 클램프
              const stock = inv[mk]||0;
              if(stock>0 && totalQ > stock) totalQ = stock;
            }
            const col=getMatColor(mk);
            const nm=getMatName(mk).replace(/\s*★+/g,'').trim();
            return `<span style="${chipB};background:var(--bg);border:1.5px solid ${col}44"><span style="color:${col}">${nm}</span> <span style="color:var(--txt)">${fmtQty(totalQ)}</span></span>`;
          }).join(' ');

        s+=`<div style="${lStyle}">`;
        // 에센스/정수(output:2): floor 배치 기준, 재료 재고도 초과 안 되게
        let makeableBatch = output>1 ? Math.floor(qty/output) : qty;
        if(!isPA && rec?.materials){
          for(const[mk,mq]of Object.entries(rec.materials)){
            const stock=inv[mk]||0;
            if(stock>0) makeableBatch=Math.min(makeableBatch, Math.floor(stock/mq));
          }
        }
        const makeableQty = isPA ? qty : makeableBatch*output;
        const effectiveSaved = saved > 0 ? saved : 0;
        const totalQty = makeableQty + effectiveSaved;
        let qtyDisplay = fmtQty(totalQty);
        if(isPA && totalQty > 50){
          const parts=[];let rem=totalQty;
          while(rem>0){parts.push(Math.min(rem,50));rem-=50;}
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

    html+=stageSection('정수 제작',   '⚗️', agg.ess1,'ess1','#1e9e58', essOrder1);
    html+=stageSection('핵 제작',     '💠', agg.core, 'core','#1e9e58', coreOrder);
    html+=stageSection('1성 완성품',  '★',  agg.fin1, 'fin1','#1e9e58', fin1Order);
    html+=stageSection('에센스 제작', '⚗️', agg.ess2, 'ess2','#2060c8', essOrder2);
    html+=stageSection('결정 제작',   '💎', agg.crys, 'crys','#2060c8', crysOrder);
    html+=stageSection('2성 완성품',  '★★', agg.fin2, 'fin2','#2060c8', fin2Order);
    html+=stageSection('엘릭서 제작', '⚗️', agg.ess3, 'ess3','#c82828', essOrder3);
    html+=stageSection('영약 제작',   '🧪', agg.poti, 'poti','#c82828', potiOrder);
    html+=stageSection('3성 완성품',  '★★★',agg.fin3,'fin3','#c82828', fin3Order);
    html+=stageSection('0성 완성품',  '🔬', agg.fin0, 'fin0','#c8920a', null);

    // 단계별 보기 수익 합산
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
      // tier 순서로 정렬
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
        html+=`<div style="${lStyle}">`;
        html+=`<span style="${chipB};background:${color2}18;border:1.5px solid ${color2};min-width:100px"><span style="color:${color2}">${name}</span></span>`;
        html+=`<span style="font-size:12px;color:var(--muted);flex-shrink:0">${fmtQty(qty)}</span>`;
        html+=`<span style="font-size:12px;color:var(--txt);font-weight:900;flex-shrink:0">${f(rev)}원</span>`;
        html+=`<span style="font-size:11px;color:${netColor2};margin-left:auto;flex-shrink:0">${netSign2}${f(netTot)}원</span>`;
        html+=`</div>`;
      }
      // 합계 행
      const totalNet=planEntries.reduce((s,[k,cnt])=>s+Math.round(finalAnalysis[k].netPerUnit)*cnt,0);
      const netCol=totalNet>=0?'var(--grn)':'var(--red)', netSgn=totalNet>=0?'+':'';
      html+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;margin-top:2px;border-top:1.5px solid var(--bdr2)">`;
      html+=`<span style="font-family:'Jua',sans-serif;font-size:12px;color:var(--muted)">합계</span>`;
      html+=`<span style="font-size:13px;color:var(--grn);font-weight:900;margin-left:auto">${f(totalRev)}원</span>`;
      html+=`<span style="font-size:12px;color:${netCol};font-weight:700">(${netSgn}${f(totalNet)}원)</span>`;
      html+=`</div>`;
      html+=`</div></div>`;
    }
  }

  // 바닐라 재료 합계 — 그룹 순서대로 정렬
  const vanEntries=Object.entries(totalVan).filter(([,v])=>v>0);
  if(vanEntries.length){
    // 그룹 순서: 물고기회 → 토양 → 나뭇잎 → 광물 → 해조류 → 네더 → 죽은산호
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

  // 잉여 중간재료 계산: essence 종류별 총 필요량 합산 후 잉여 계산
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
    const batches = Math.ceil(needed / output);
    const leftover = batches * output - needed;
    if (leftover > 0) leftoverInterm[key] = leftover;
  }

  // 남은 재고 (어패류 + 잉여 중간재료)
  const remEntries=SF_KEYS.map(k=>[k,workInv[k]||0]).filter(([,v])=>v>0);

  // 총합
  const totalSec=planEntries.reduce((s,[k,cnt])=>{
    const fa=finalAnalysis[k];let t=cnt*(fa.craftTimeSec||0);
    for(const[mk,mq]of Object.entries(fa.step2)){const r=ALCHEMY[mk];if(r)t+=Math.ceil((mq*cnt)/(r.output||1))*(r.craftTimeSec||0);}
    for(const[mk,mq]of Object.entries(fa.step3)){const r=ALCHEMY[mk];if(r)t+=(mq*cnt)*(r.craftTimeSec||0);}
    return s+t;
  },0)*(1-fr);

  html+=`<div class="result-box" style="margin-top:12px">`;
  if(remEntries.length || Object.keys(leftoverInterm).length){
    html+=`<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed var(--bdr2);font-size:11px;color:var(--muted)">남은 재료:</div>`;

    // 잉여 중간재료 분류
    const intermByGroup={sf:[],ess1:[],core:[],ess2:[],crys:[],ess3:[],poti:[]};
    for(const[k,v]of remEntries) intermByGroup.sf.push([k,v]);
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
    if(intermByGroup.sf.length){
      const chips=intermByGroup.sf.map(([k,v])=>`<span style="color:${getMatColor(k)}">${getMatName(k)} ${fmtQty(v)}</span>`).join(' · ');
      html+=`<div style="${rowStyle}">${chips}</div>`;
    }
    html+=renderRow(intermByGroup.ess1.concat(intermByGroup.core),'');
    html+=renderRow(intermByGroup.ess2.concat(intermByGroup.crys),'');
    html+=renderRow(intermByGroup.ess3.concat(intermByGroup.poti),'');
    html+=`</div>`;
  }
  html+=`<div style="display:flex;gap:0;align-items:stretch">`;
  html+=`<div style="flex:1;text-align:center;padding:4px 8px"><div class="rb-label">총 예상 수익</div><div class="rb-value" style="color:var(--grn)">${f(totalRev)}원</div></div>`;
  html+=`<div style="width:1px;background:var(--bdr2);margin:4px 0"></div>`;
  const totalNet=planEntries.reduce((s,[k,cnt])=>s+Math.round(finalAnalysis[k].netPerUnit)*cnt,0);
  const netSign2=totalNet>=0?'+':'';
  const netCol2=totalNet>=0?'var(--grn)':'var(--red)';
  html+=`<div style="flex:1;text-align:center;padding:4px 8px"><div class="rb-label">${netLabel}</div><div class="rb-value" style="color:${netCol2}">${netSign2}${f(totalNet)}원</div></div>`;
  html+=`<div style="width:1px;background:var(--bdr2);margin:4px 0"></div>`;
  html+=`<div style="flex:1;text-align:center;padding:4px 8px"><div class="rb-label">총 제작 시간</div><div class="rb-value" style="font-size:16px">${fmtTime(totalSec)}</div></div>`;
  html+=`</div></div>`;

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
function readSplitQty(id){
  const box=parseInt(document.getElementById(id+'_box')?.value||'0')||0;
  const set=parseInt(document.getElementById(id+'_set')?.value||'0')||0;
  const ea =parseInt(document.getElementById(id+'_ea') ?.value||'0')||0;
  return box*BOX_SIZE+set*SET_SIZE+ea;
}
function splitQtyHtml(id,color){
  color=color||'var(--muted)';
  return '<div style="display:flex;border:1.5px solid var(--bdr);border-radius:var(--rs);overflow:hidden;background:var(--bg);margin-top:2px">'
    +'<div style="display:flex;flex-direction:column;flex:1;border-right:1px solid var(--bdr)"><span style="font-size:8px;font-weight:700;color:'+color+';text-align:center;padding:2px 0;border-bottom:1px solid var(--bdr);background:var(--surf)">상자</span><input id="'+id+'_box" type="number" inputmode="numeric" placeholder="0" min="0" oninput="onSFQtyInput(\''+id+'\')" style="border:none;outline:none;background:transparent;width:100%;text-align:center;font-size:13px!important;font-weight:700!important;color:var(--txt);padding:5px 2px"></div>'
    +'<div style="display:flex;flex-direction:column;flex:1;border-right:1px solid var(--bdr)"><span style="font-size:8px;font-weight:700;color:'+color+';text-align:center;padding:2px 0;border-bottom:1px solid var(--bdr);background:var(--surf)">세트</span><input id="'+id+'_set" type="number" inputmode="numeric" placeholder="0" min="0" oninput="onSFQtyInput(\''+id+'\')" style="border:none;outline:none;background:transparent;width:100%;text-align:center;font-size:13px!important;font-weight:700!important;color:var(--txt);padding:5px 2px"></div>'
    +'<div style="display:flex;flex-direction:column;flex:1"><span style="font-size:8px;font-weight:700;color:'+color+';text-align:center;padding:2px 0;border-bottom:1px solid var(--bdr);background:var(--surf)">개</span><input id="'+id+'_ea" type="number" inputmode="numeric" placeholder="0" min="0" oninput="onSFQtyInput(\''+id+'\')" style="border:none;outline:none;background:transparent;width:100%;text-align:center;font-size:13px!important;font-weight:700!important;color:var(--txt);padding:5px 2px"></div>'
    +'</div><div id="'+id+'_p" style="font-size:10px;color:'+color+';min-height:13px;font-weight:700;text-align:right;margin-top:1px"></div>';
}
// 중간재료 카탈로그 (그룹별, 각 재료 색상 포함)
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

// 중간재료 선택 팝업 UI
window.showIntermPicker = function(rid) {
  // 기존 팝업 제거
  document.querySelectorAll('.interm-picker-popup').forEach(el=>el.remove());

  const popup = document.createElement('div');
  popup.className = 'interm-picker-popup';
  popup.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.4)';

  let html = '<div style="background:var(--surf);border:1.5px solid var(--bdr2);border-radius:var(--r);padding:16px;width:min(520px,94vw);max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.25)">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
  html += '<div style="font-family:\'Jua\',sans-serif;font-size:14px;color:var(--txt)">중간재료 선택</div>';
  html += '<button onclick="this.closest(\'.interm-picker-popup\').remove()" style="border:none;background:none;font-size:18px;cursor:pointer;color:var(--muted);line-height:1">✕</button>';
  html += '</div>';

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
  html += '</div>';
  popup.innerHTML = html;
  popup.addEventListener('click', e => { if(e.target===popup) popup.remove(); });
  document.body.appendChild(popup);
};

window.selectIntermItem = function(rid, key) {
  document.querySelectorAll('.interm-picker-popup').forEach(el=>el.remove());
  const it = INTERM_BY_KEY[key]; if(!it) return;
  const hiddenSel = document.getElementById('isel_'+rid);
  if(hiddenSel){
    // 옵션이 없으면 추가
    if(!hiddenSel.querySelector(`option[value="${key}"]`)){
      const opt = document.createElement('option');
      opt.value = key; opt.textContent = it.name;
      hiddenSel.appendChild(opt);
    }
    hiddenSel.value = key;
  }
  const lbl = document.getElementById('isel_lbl_'+rid);
  if(lbl){
    lbl.textContent = it.name;
    lbl.style.color = it.color;
    lbl.style.borderColor = it.color+'88';
    lbl.style.background = it.color+'18';
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
  // splitQtyHtml 입력 이벤트를 saveAll로 연결
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
function buildHaveSeafoodGrid(){
  const el=document.getElementById('haveSeafoodGrid');if(!el)return;
  const sfColors={oyster:'#3d6fd4',conch:'#c89c00',octopus:'#7c52c8',seaweed:'#d94f3d',urchin:'#3a9e68'};
  const starLabels={1:'★ 1성',2:'★★ 2성',3:'★★★ 3성'};
  let html='<div class="slabel">🦀 어패류</div>';
  for(const sf of SF_TYPES){const meta=SEAFOOD_TYPES[sf],cl=sfColors[sf];html+='<div style="margin-bottom:8px"><div style="font-size:10px;font-weight:700;color:'+cl+';margin-bottom:4px">'+meta.name+'</div><div class="g3">';for(const t of SF_TIERS){const id='have_'+sf+'_'+t;html+='<div class="field"><label style="color:'+cl+'">'+starLabels[t]+'</label>'+splitQtyHtml(id,cl)+'</div>';}html+='</div></div>';}
  html+='<div class="slabel" style="margin-top:8px">⚗️ 보유 중간재료 <small style="font-weight:500;font-size:9px">(선택)</small></div><div id="intermList"></div><div id="intermWarning" style="display:none;margin-top:8px;padding:7px 10px;background:var(--ylw-bg);border:1.5px solid var(--ylw);border-radius:var(--rs);font-size:11px;color:var(--ylw);line-height:1.5">⚠️ <b>핵 · 결정 · 영약</b>을 보유 중간재료로 입력하면 최적화 결과가 실제 최적이 아닐 수 있습니다.</div><button class="add-interm-btn" onclick="addIntermRow()">+ 중간재료 추가</button>';
  el.innerHTML=html;
}
window.onSFQtyInput=(id)=>{const n=readSplitQty(id);const p=document.getElementById(id+'_p');if(p)p.textContent=n>0?'총 '+f(n)+'개':'';saveAll();};
function buildVanillaPriceGrid(){
  const el=document.getElementById('vanillaPriceGrid');if(!el)return;
  const groups=[
    {label:'🐟 물고기 회',   keys:['shrimp','sea_bream','herring','goldfish','bass']},
    {label:'토양',            keys:['clay','sand','dirt','gravel','granite']},
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
const splitSuffixes=['_box','_set','_ea'];
function getStaticIds(){
  const sfSplitIds=SF_TYPES.flatMap(sf=>SF_TIERS.flatMap(t=>splitSuffixes.map(s=>'have_'+sf+'_'+t+s)));
  return['skillFurnace','skillCraftBonus','skillAlchBonus','skillDeepHarvest','skillStarBonus','skillClamBonus','engClamSearch','engSeafoodLuck','engFisherRoulette','engSpiritWhale','rodLevel','totalStamina','price_sf_1','price_sf_2','price_sf_3',...Object.keys(VANILLA_META).map(k=>'vprice_'+k),...sfSplitIds];
}
function saveAll(){
  const d={};
  getStaticIds().forEach(id=>{const e=document.getElementById(id);if(e)d[id]=e.value;});
  d.__sfCostToggle     =document.getElementById('sfCostToggle')?.checked     ??false;
  d.__viewByStageToggle=document.getElementById('viewByStageToggle')?.checked??false;
  const irows=[];
  document.querySelectorAll('#intermList .interm-row').forEach(row=>{
    const sel=row.querySelector('select.interm-sel');if(!sel)return;
    const rid=row.id.replace('irow_','');
    irows.push({key:sel?.value||'',box:document.getElementById('iqty_'+rid+'_box')?.value||'',set:document.getElementById('iqty_'+rid+'_set')?.value||'',ea:document.getElementById('iqty_'+rid+'_ea')?.value||''});
  });
  d.__irows=irows;localStorage.setItem(KEY,JSON.stringify(d));
}
function loadAll(){
  try{
    const d=JSON.parse(localStorage.getItem(KEY)||'{}');
    getStaticIds().forEach(id=>{const e=document.getElementById(id);if(e&&d[id]!==undefined)e.value=d[id];});
    const sfTog=document.getElementById('sfCostToggle');     if(sfTog)sfTog.checked    =d.__sfCostToggle     ??false;
    const stTog=document.getElementById('viewByStageToggle');if(stTog)stTog.checked    =d.__viewByStageToggle??false;
    SF_TYPES.forEach(sf=>SF_TIERS.forEach(t=>{const id='have_'+sf+'_'+t,p=document.getElementById(id+'_p'),n=readSplitQty(id);if(p&&n>0)p.textContent='총 '+f(n)+'개';}));
    if(Array.isArray(d.__irows)){d.__irows.forEach(({key,box,set,ea,qty})=>{
      addIntermRow();
      const list2=document.getElementById('intermList'),row2=list2?.lastElementChild;if(!row2)return;
      const rid=row2.id.replace('irow_','');
      // 재료 종류 복원: saveAll 호출 없이 라벨과 hidden select만 업데이트
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
      // 수량 복원
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
  if(!confirm('초기화할까요?'))return;
  localStorage.removeItem(KEY);
  getStaticIds().forEach(id=>{const e=document.getElementById(id);if(!e)return;if(e.tagName==='SELECT')e.selectedIndex=0;else e.value='';});
  const sfTog=document.getElementById('sfCostToggle');     if(sfTog)sfTog.checked=false;
  const stTog=document.getElementById('viewByStageToggle');if(stTog)stTog.checked=false;
  SF_TYPES.forEach(sf=>SF_TIERS.forEach(t=>{const p=document.getElementById('have_'+sf+'_'+t+'_p');if(p)p.textContent='';}));
  const il=document.getElementById('intermList');if(il)il.innerHTML='';
  intermRowId=0;syncDropdownLabels();onSkillChange();
};


/* ════════════════════════════════════════
   ⑬ 커스텀 드롭다운
════════════════════════════════════════ */
function initOneCdd(sel){
  if(!sel||sel.previousElementSibling?.classList.contains('cdd'))return;
  const cdd=document.createElement('div');cdd.className='cdd';
  const trigger=document.createElement('div');trigger.className='cdd-trigger';
  const label=document.createElement('span');label.className='cdd-label';label.textContent=sel.options[sel.selectedIndex]?.text||'';
  const arrowEl=document.createElement('span');arrowEl.className='cdd-arrow';arrowEl.textContent='▼';
  trigger.appendChild(label);trigger.appendChild(arrowEl);
  const menu=document.createElement('div');menu.className='cdd-menu';
  Array.from(sel.children).forEach(child=>{
    if(child.tagName==='OPTGROUP'){const grpLbl=document.createElement('div');grpLbl.style.cssText='padding:4px 8px;font-size:10px;color:var(--muted);font-weight:700;background:var(--bg);border-bottom:1px solid var(--bdr)';grpLbl.textContent=child.label;menu.appendChild(grpLbl);Array.from(child.children).forEach(opt=>addItem(opt,'14px'));}
    else if(child.tagName==='OPTION')addItem(child,'');
  });
  function addItem(opt,paddingLeft){const item=document.createElement('div');item.className='cdd-item'+(sel.value===opt.value?' selected':'');if(paddingLeft)item.style.paddingLeft=paddingLeft;item.textContent=opt.text;item.dataset.value=opt.value;item.addEventListener('click',()=>{sel.value=opt.value;label.textContent=opt.text;menu.querySelectorAll('.cdd-item').forEach(el=>el.classList.remove('selected'));item.classList.add('selected');cdd.classList.remove('open');sel.dispatchEvent(new Event('change',{bubbles:true}));});menu.appendChild(item);}
  trigger.addEventListener('click',e=>{e.stopPropagation();const isOpen=cdd.classList.contains('open');document.querySelectorAll('.cdd.open').forEach(el=>el.classList.remove('open'));if(!isOpen)cdd.classList.add('open');});
  cdd.appendChild(trigger);cdd.appendChild(menu);sel.parentNode.insertBefore(cdd,sel);sel.classList.add('cdd-ready');
}
function syncDropdownLabels(){document.querySelectorAll('.skrow select,.field select').forEach(sel=>{const cdd=sel.previousElementSibling;if(!cdd?.classList.contains('cdd'))return;const lbl=cdd.querySelector('.cdd-label');if(lbl)lbl.textContent=sel.options[sel.selectedIndex]?.text||'';cdd.querySelectorAll('.cdd-item').forEach(item=>item.classList.toggle('selected',item.dataset.value===sel.value));});}
document.addEventListener('click',e=>{if(!e.target.closest('.cdd'))document.querySelectorAll('.cdd.open').forEach(el=>el.classList.remove('open'));});


/* ════════════════════════════════════════
   ⑭ DOMContentLoaded
════════════════════════════════════════ */
function domReady(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn);else fn();}
domReady(()=>{
  buildVanillaPriceGrid();buildHaveSeafoodGrid();loadAll();
  document.querySelectorAll('.skrow select,.field select').forEach(sel=>initOneCdd(sel));
  syncDropdownLabels();onSkillChange();
  const titleEl=document.getElementById('pageTabTitle');if(titleEl)titleEl.textContent=TAB_TITLES[0];
  document.title='해양 계산기 — '+TAB_TITLES[0];
  // optRes 초기 메시지
  const optRes=document.getElementById('optRes');
  if(optRes&&optRes.innerHTML.trim()==='')optRes.innerHTML='<div class="empty-msg">보유 어패류를 입력한 뒤 계산하기 버튼을 눌러주세요</div>';
  getStaticIds().forEach(id=>{const e=document.getElementById(id);if(!e)return;e.addEventListener(e.tagName==='SELECT'?'change':'input',saveAll);});
  const sfTog=document.getElementById('sfCostToggle');     if(sfTog)sfTog.addEventListener('change',window.onSFCostToggle);
  const stTog=document.getElementById('viewByStageToggle');if(stTog)stTog.addEventListener('change',window.onViewToggle);
});