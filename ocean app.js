/* ════════════════════════════════════════
   ocean app.js — 해양 계산기 로직
   공백 포함 파일명: "ocean app.js"
════════════════════════════════════════ */

import {
  SKILLS, ENGRAVING, ROD, OCEAN, CLAM, CRAFTS, ALCHEMY, PRECISION_ALCHEMY, VANILLA_META,
  SEAFOOD_TYPES, UNITS, DEFAULT_PRICES,
} from './ocean%20config.js';


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
  // 탭2 전환 시 자동 계산 안 함 — 버튼으로만 실행
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
  const SF_SET = new Set(SF_TYPES.flatMap(sf => SF_TIERS.map(t => `${sf}${t}`)));
  const sfNeed = {};
  for (const [mk, mq] of Object.entries(fRec.materials)) {
    const rec = ALCHEMY[mk]; if (!rec) continue;
    if (rec.type === 'compound') {
      for (const [mk2, mq2] of Object.entries(rec.materials)) {
        const rec2 = ALCHEMY[mk2];
        if (rec2 && rec2.type === 'essence') {
          const batches = (mq2 * mq) / (rec2.output || 1); // 소수 허용
          for (const [mk3, mq3] of Object.entries(rec2.materials)) {
            if (SF_SET.has(mk3)) sfNeed[mk3] = (sfNeed[mk3]||0) + mq3 * batches;
          }
        } else if (SF_SET.has(mk2)) {
          sfNeed[mk2] = (sfNeed[mk2]||0) + mq2 * mq;
        }
      }
    } else if (rec.type === 'essence') {
      const batches = mq / (rec.output || 1); // 소수 허용
      for (const [mk2, mq2] of Object.entries(rec.materials)) {
        if (SF_SET.has(mk2)) sfNeed[mk2] = (sfNeed[mk2]||0) + mq2 * batches;
      }
    }
  }
  return sfNeed;
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
  document.querySelectorAll('#intermList .interm-row').forEach(row => {
    const sel=row.querySelector('select.interm-sel'), inp=row.querySelector('input.interm-qty');
    if (!sel||!inp) return;
    const key=sel.value, qty=parseInt(inp.value||'0')||0;
    if (key&&qty>0) inv[key]=(inv[key]||0)+qty;
  });

  const SF_KEYS = SF_TYPES.flatMap(sf => SF_TIERS.map(t => `${sf}${t}`));
  const sfTotal     = SF_KEYS.reduce((s,k)=>s+(inv[k]||0),0);
  const intermTotal = Object.keys(inv).filter(k=>ALCHEMY[k]).reduce((s,k)=>s+(inv[k]||0),0);
  if (sfTotal<=0&&intermTotal<=0) {
    document.getElementById('optRes').innerHTML='<div class="empty-msg">보유 어패류를 입력하면 계산됩니다</div>';
    return;
  }

  const includeSFCost = document.getElementById('sfCostToggle')?.checked      ?? false;
  const viewByStage   = document.getElementById('viewByStageToggle')?.checked  ?? false;

  // 재고 소비 (정수 단위, 소수 need는 ceil)
  function consumeSF(sfKey, need, curInv) {
    const m=sfKey.match(/^(oyster|conch|octopus|seaweed|urchin)(\d)$/); if(!m)return false;
    const sf=m[1], tier=+m[2], needInt=Math.ceil(need);
    let have=curInv[sfKey]||0, remaining=needInt-have;
    if(remaining<=0){curInv[sfKey]=have-needInt;return true;}
    if(tier===2){const t1=`${sf}1`,canUp=Math.floor((curInv[t1]||0)/3),up=Math.min(canUp,remaining);if(up>0){curInv[t1]-=up*3;curInv[sfKey]=(curInv[sfKey]||0)+up;have=curInv[sfKey];remaining=needInt-have;}}
    if(remaining>0)return false;
    curInv[sfKey]=have-needInt;return true;
  }
  function canAffordSF(sfNeed,curInv){const tmp={...curInv};for(const[k,v]of Object.entries(sfNeed))if(!consumeSF(k,v,tmp))return false;return true;}
  function doConsumeSF(sfNeed,curInv){for(const[k,v]of Object.entries(sfNeed))consumeSF(k,v,curInv);}

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
    const sfNeed=calcSFNeedForFinal(fKey);
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
     Branch & Bound — 100% 정확

     [이전 버그 수정]
     LP UB를 "단가 내림차순으로 그리디 소비"로 계산하면
     업그레이드에 1성을 다 써버린 후 1성 완성품을 못 만드는 경우를
     UB가 과소평가해서 올바른 해를 가지치기로 날려버림.

     [수정된 UB]
     각 어패류 종류(sf1, sf2, sf3)를 독립 자원으로 보고,
     각 자원에 대해 "이 자원을 가장 효율적으로 쓰는 아이템의 단가"로
     상한을 계산. 업그레이드 여부와 무관하게 항상 실제 최적 이상.

     알고리즘:
     1. 정렬: 아이템을 판매가 내림차순 (단순하고 안전)
     2. 초기 하한: 업그레이드 있/없 두 가지 그리디로 더 좋은 것 선택
     3. UB: 각 어패류 종류별로 최고 단가 아이템에 소수점 배분한 합산
            → 항상 실제 최적해 이상 (안전한 상한)
     4. 스택 기반 B&B: n=maxN부터 탐색 → 좋은 해 빠르게 확보
  ────────────────────────────────────── */
  const allFKeys = Object.keys(finalAnalysis);

  // ── maxMake: 업그레이드 포함, 실제 canAfford 기반 ──
  function maxMake(sfNeed, curInv) {
    let m = Infinity;
    for (const [sf, need] of Object.entries(sfNeed)) {
      if (need <= 0) continue;
      const needInt = Math.ceil(need), tier = parseInt(sf.slice(-1));
      let avail = curInv[sf] || 0;
      if (tier === 2) avail += Math.floor((curInv[sf.replace('2','1')]||0) / 3);
      m = Math.min(m, Math.floor(avail / needInt));
    }
    return m === Infinity ? 0 : m;
  }

  // ── UB: 현재 재고에서 그리디 실행 (비0성 아이템만) ──
  // 0성은 외부 루프에서 고정되므로 UB 계산에서 제외
  function computeUB(curInv, curRev) {
    let best = curRev;
    for (const keys of [sortedNonZero, [...sortedNonZero].reverse()]) {
      for (const allowUpgrade of [true, false]) {
        const tmp = {...curInv}; let extra = 0;
        for (const k of keys) {
          const fa = finalAnalysis[k];
          let n;
          if (!allowUpgrade) {
            n = Infinity;
            for (const [sf, need] of Object.entries(fa.sfNeed)) {
              if (need <= 0) continue;
              n = Math.min(n, Math.floor((tmp[sf]||0) / Math.ceil(need)));
            }
            n = n === Infinity ? 0 : n;
          } else {
            n = maxMake(fa.sfNeed, tmp);
          }
          if (n <= 0) continue;
          extra += n * fa.sellPrice;
          for (let i = 0; i < n; i++) doConsumeSF(fa.sfNeed, tmp);
        }
        best = Math.max(best, curRev + extra);
      }
    }
    return best;
  }

  // ── 그리디 초기해: 업그레이드 있/없 × 여러 정렬 → 가장 높은 값 선택 ──
  // 초기해가 높을수록 이후 B&B 가지치기가 강해짐
  function greedyOnce(keys, startInv, allowUpgrade) {
    const plan = Object.fromEntries(allFKeys.map(k=>[k,0]));
    const curInv = {...startInv};
    for (const fKey of keys) {
      const fa = finalAnalysis[fKey];
      // 업그레이드 없음: 직보유만으로 maxMake
      let n;
      if (!allowUpgrade) {
        n = Infinity;
        for (const [sf, need] of Object.entries(fa.sfNeed)) {
          if (need <= 0) continue;
          n = Math.min(n, Math.floor((curInv[sf]||0) / Math.ceil(need)));
        }
        n = n === Infinity ? 0 : n;
      } else {
        n = maxMake(fa.sfNeed, curInv);
      }
      if (n <= 0) continue;
      plan[fKey] = n;
      for (let i = 0; i < n; i++) doConsumeSF(fa.sfNeed, curInv);
    }
    const rev = allFKeys.reduce((s,k) => s + finalAnalysis[k].sellPrice * plan[k], 0);
    return { plan, rev, remInv: curInv };
  }

  // 판매가 내림차순 / 어패류당 단가 내림차순 / 0성 우선
  const byPrice = [...allFKeys].sort((a,b) => finalAnalysis[b].sellPrice - finalAnalysis[a].sellPrice);
  const byUnit  = [...allFKeys].sort((a,b) => {
    const ua = finalAnalysis[a].sellPrice / (Object.values(finalAnalysis[a].sfNeed).reduce((s,v)=>s+v,0)||1);
    const ub = finalAnalysis[b].sellPrice / (Object.values(finalAnalysis[b].sfNeed).reduce((s,v)=>s+v,0)||1);
    return ub - ua;
  });
  const byPriceWithDiluted = [...allFKeys].sort((a,b) => {
    if (finalAnalysis[a].tier === 0) return -1;
    if (finalAnalysis[b].tier === 0) return 1;
    return finalAnalysis[b].sellPrice - finalAnalysis[a].sellPrice;
  });

  // B&B용 분리 (0성 외부루프이므로 비0성만 정렬)
  const nonZeroKeys   = allFKeys.filter(k => finalAnalysis[k].tier !== 0);
  const zeroKeys      = allFKeys.filter(k => finalAnalysis[k].tier === 0);
  const sortedNonZero = [...nonZeroKeys].sort((a,b) => finalAnalysis[b].sellPrice - finalAnalysis[a].sellPrice);
  const byNonZeroUnit = [...nonZeroKeys].sort((a,b) => {
    const ua = finalAnalysis[a].sellPrice / (Object.values(finalAnalysis[a].sfNeed).reduce((s,v)=>s+v,0)||1);
    const ub = finalAnalysis[b].sellPrice / (Object.values(finalAnalysis[b].sfNeed).reduce((s,v)=>s+v,0)||1);
    return ub - ua;
  });

  // 초기해: d=0..maxD × 여러 정렬 × 업그레이드 있/없
  // → 최대 d일 때 최적을 그리디로 빠르게 찾아 bestRev를 높게 잡음
  const maxDilutedForInit = zeroKeys.length > 0
    ? zeroKeys.reduce((mn,k) => Math.min(mn, maxMake(finalAnalysis[k].sfNeed, {...inv})), Infinity)
    : 0;

  showOptLoading(10, '초기해 계산 중');
  await new Promise(r => setTimeout(r, 20));

  let bestRev  = 0;
  let bestPlan = Object.fromEntries(allFKeys.map(k=>[k,0]));
  let workInv  = {...inv};

  for (let d = 0; d <= (maxDilutedForInit === Infinity ? 0 : maxDilutedForInit); d++) {
    const startInv = {...inv};
    let zeroRev = 0;
    const zeroPlan = Object.fromEntries(allFKeys.map(k=>[k,0]));
    let ok = true;
    for (const zk of zeroKeys) {
      for (let i = 0; i < d; i++) {
        if (!canAffordSF(finalAnalysis[zk].sfNeed, startInv)) { ok = false; break; }
        doConsumeSF(finalAnalysis[zk].sfNeed, startInv);
      }
      if (!ok) break;
      zeroPlan[zk] = d;
      zeroRev += d * finalAnalysis[zk].sellPrice;
    }
    if (!ok) break;

    // 나머지 그리디
    for (const keys of [sortedNonZero, byNonZeroUnit, [...sortedNonZero].reverse(), [...byNonZeroUnit].reverse()]) {
      for (const allowUp of [true, false]) {
        const curInv = {...startInv};
        const curPlan = {...zeroPlan};
        let rev = zeroRev;
        for (const k of keys) {
          const fa = finalAnalysis[k];
          let n;
          if (!allowUp) {
            n = Infinity;
            for (const [sf, need] of Object.entries(fa.sfNeed)) {
              if (need <= 0) continue;
              n = Math.min(n, Math.floor((curInv[sf]||0) / Math.ceil(need)));
            }
            n = n === Infinity ? 0 : n;
          } else {
            n = maxMake(fa.sfNeed, curInv);
          }
          if (n <= 0) continue;
          curPlan[k] = n;
          rev += n * fa.sellPrice;
          for (let i = 0; i < n; i++) doConsumeSF(fa.sfNeed, curInv);
        }
        if (rev > bestRev) {
          bestRev  = rev;
          bestPlan = {...curPlan};
          workInv  = {...curInv};
        }
      }
    }
  }

  showOptLoading(20, `초기해 ${f(bestRev)}원 확보 · B&B 탐색 시작`);
  await new Promise(r => setTimeout(r, 20));

  // ── B&B 탐색 ──
  // 0성(희석액)은 외부 루프로 분리: d=0~maxD개 각각 시도
  // → UB 계산이 부정확해도 0성이 가지치기되는 문제 완전 해소
  const N = sortedNonZero.length;

  const maxDiluted = maxDilutedForInit;

  let nodeCount  = 0;
  let pruneCount = 0;
  let lastYield  = Date.now();

  for (let d = 0; d <= (maxDiluted === Infinity ? 0 : maxDiluted); d++) {
    // 0성 d개 소비 후 재고
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

    showOptLoading(
      Math.min(90, 20 + Math.round((d / Math.max(maxDiluted, 1)) * 70)),
      `0성 ${d}개 시도 (최대 ${maxDiluted}개) · 최선 ${f(bestRev)}원`
    );
    await new Promise(r => setTimeout(r, 0));
    lastYield = Date.now();

    // 나머지 아이템 B&B
    const innerStack = [{
      idx: 0,
      inv: {...invAfterZero},
      plan: Object.fromEntries(nonZeroKeys.map(k=>[k,0])),
      rev: zeroRev,
    }];

    while (innerStack.length > 0) {
      const { idx, inv: curInv, plan: curPlan, rev: curRev } = innerStack.pop();

      if (idx === N) {
        if (curRev > bestRev) {
          bestRev  = curRev;
          bestPlan = {...zeroPlan, ...curPlan};
          workInv  = {...curInv};
        }
        continue;
      }

      nodeCount++;

      const now = Date.now();
      if (now - lastYield > 80) {
        showOptLoading(
          Math.min(90, 20 + Math.round((d / Math.max(maxDiluted,1)) * 70)),
          `0성 ${d}개 · 노드 ${f(nodeCount)}개 · 가지치기 ${f(pruneCount)}개 · 최선 ${f(bestRev)}원`
        );
        await new Promise(r => setTimeout(r, 0));
        lastYield = Date.now();
      }

      const ub = computeUB(curInv, curRev);
      if (ub <= bestRev) { pruneCount++; continue; }

      const fKey = sortedNonZero[idx];
      const fa   = finalAnalysis[fKey];
      const maxN = maxMake(fa.sfNeed, curInv);

      innerStack.push({ idx: idx+1, inv: {...curInv}, plan: {...curPlan}, rev: curRev });

      const batchInv = {...curInv};
      const snaps = [];
      for (let n = 1; n <= maxN; n++) {
        if (!canAffordSF(fa.sfNeed, batchInv)) break;
        doConsumeSF(fa.sfNeed, batchInv);
        const branchRev = curRev + fa.sellPrice * n;
        const branchUB  = computeUB(batchInv, branchRev);
        if (branchUB <= bestRev) { pruneCount++; continue; }
        const newPlan = {...curPlan}; newPlan[fKey] = n;
        snaps.push({ idx: idx+1, inv: {...batchInv}, plan: newPlan, rev: branchRev });
      }
      for (const s of snaps) innerStack.push(s);
    }
  }

  showOptLoading(97, `탐색 완료 — 노드 ${f(nodeCount)}개, 가지치기 ${f(pruneCount)}개`);
  await new Promise(r => setTimeout(r, 20));

  const planEntries=Object.entries(bestPlan).filter(([,cnt])=>cnt>0)
    .sort((a,b)=>finalAnalysis[b[0]].tier-finalAnalysis[a[0]].tier||finalAnalysis[b[0]].sellPrice-finalAnalysis[a[0]].sellPrice);

  if(!planEntries.length){
    _cachedOptResult = null;
    document.getElementById('optRes').innerHTML='<div class="empty-msg">재료가 부족하여 만들 수 있는 연금품이 없습니다<br><small style="font-weight:500">어패류 보유량을 확인해주세요</small></div>';
    return;
  }

  const totalRev=planEntries.reduce((s,[k,cnt])=>s+finalAnalysis[k].sellPrice*cnt,0);

  const totalVan={};
  function collectVan(key,qty,depth=0){if(depth>12)return;if(VANILLA_META[key]){totalVan[key]=(totalVan[key]||0)+qty;return;}const rec=ALCHEMY[key];if(!rec)return;const b=Math.ceil(qty/(rec.output||1));for(const[mk,mq]of Object.entries(rec.materials))collectVan(mk,mq*b,depth+1);}
  for(const[fKey,cnt]of planEntries)for(const[mk,mq]of Object.entries(PRECISION_ALCHEMY[fKey].materials))collectVan(mk,mq*cnt);

  // 결과 캐시 저장
  _cachedOptResult = { planEntries, finalAnalysis, workInv, totalRev, totalVan, SF_KEYS };

  renderOptResult(_cachedOptResult);
}

/* ════════════════════════════════════════
   renderOptResult — 캐시된 결과를 토글 상태에 맞게 렌더링
   calcOpt 완료 후 호출, 토글 변경 시에도 재호출
════════════════════════════════════════ */
function renderOptResult({ planEntries, finalAnalysis, workInv, totalRev, totalVan, SF_KEYS }) {
  const includeSFCost = document.getElementById('sfCostToggle')?.checked      ?? false;
  const viewByStage   = document.getElementById('viewByStageToggle')?.checked  ?? false;

  // 순이익 재계산 (토글에 따라 달라짐)
  for (const fKey of Object.keys(finalAnalysis)) {
    const fa = finalAnalysis[fKey];
    fa.netPerUnit = fa.sellPrice - fa.vanCost - (includeSFCost ? fa.sfCost : 0);
  }

  const sfColors={oyster:'#3d6fd4',conch:'#c89c00',octopus:'#7c52c8',seaweed:'#d94f3d',urchin:'#3a9e68'};
  const tierColors={0:'#607090',1:'#3d6fd4',2:'#7c52c8',3:'#d94f3d'};
  const tierLabels=['0성','★ 1성','★★ 2성','★★★ 3성'];
  const fr=getSK().fr;

  function getSFMatch(k){return k.match(/^(oyster|conch|octopus|seaweed|urchin)(\d)$/);}
  function getSFName(k){const m=getSFMatch(k);if(!m)return null;return (SEAFOOD_TYPES[m[1]]?.name||m[1])+' '+'★'.repeat(+m[2]);}
  function getMatName(k){return getSFName(k)||VANILLA_META[k]?.name||ALCHEMY[k]?.name||k;}
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
      const fa=finalAnalysis[fKey],color=tierColors[fa.tier]||'#607090';
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

      const sfUsed={};
      for(const[k,v]of Object.entries(fa.sfNeed))sfUsed[k]=v*cnt;
      const guideId='guide_'+fKey;

      html+=`<div class="craft-flow-card" style="--tier-color:${color}">`;
      // 헤더
      html+=`<div class="cfc-header"><div class="cfc-header-left"><div class="cfc-name">${fa.name}</div>`
        +`<div class="cfc-sub"><span style="opacity:.7">${tierLabels[fa.tier]}</span>`
        +` &nbsp;·&nbsp; 판매가 <b>${f(fa.sellPrice)}원</b>/개`
        +` &nbsp;·&nbsp; ${netLabel} <b style="color:${netColor}">${netSign}${f(Math.round(fa.netPerUnit))}원</b>/개${sfCostNote}</div>`
        +`</div><div class="cfc-header-right"><div class="cfc-count">${fmtQty(cnt)}</div><div class="cfc-revenue">${f(fa.sellPrice*cnt)}원</div></div></div>`;

      // 필요 어패류
      const sfEntries=Object.entries(sfUsed).filter(([,v])=>v>0);
      if(sfEntries.length){
        html+=`<div class="cfc-section"><div class="cfc-section-label">📦 필요 어패류</div><div class="sf-chip-wrap">`;
        for(const[k,v]of sfEntries){const cl=getMatColor(k),nm=getMatName(k);html+=`<div class="sf-chip" style="--chip-color:${cl}"><span class="sc-name">${nm}</span><span class="sc-qty">${fmtQty(Math.ceil(v))}</span></div>`;}
        html+=`</div></div>`;
      }

      // 제작 가이드 토글 — 결과물 / 재료 분리 한줄 형식 + 시간 포함
      html+=`<div class="guide-toggle" onclick="toggleGuide('${guideId}')"><span class="guide-toggle-arrow" id="${guideId}_arrow">▶</span> 제작 가이드 &amp; 시간 보기</div>`;
      html+=`<div class="guide-body" id="${guideId}" style="padding:10px 14px">`;

      // matStr: 어패류는 별 유지, 중간재료는 별 제거
      function isSF(k){ return /^(oyster|conch|octopus|seaweed|urchin)\d$/.test(k); }
      function dispName(k){ return isSF(k) ? getMatName(k) : getMatName(k).replace(/\s*★+/g,''); }
      function matChips(matObj, batchMul) {
        return Object.entries(matObj).filter(([,v])=>v>0)
          .map(([mk,mq])=>{
            const qty=fmtQty(Math.ceil(mq*batchMul));
            const col=getMatColor(mk);
            return `<span style="display:inline-flex;align-items:center;gap:3px;background:var(--bg);border:1.5px solid ${col}33;border-radius:6px;padding:2px 7px;font-size:11px;white-space:nowrap"><span style="color:${col};font-weight:700">${dispName(mk)}</span><b style="color:var(--txt)">${qty}</b></span>`;
          })
          .join(' ');
      }
      function resultChip(name, qty, col) {
        return `<span style="display:inline-flex;align-items:center;gap:4px;background:${col}18;border:2px solid ${col};border-radius:7px;padding:3px 10px;font-size:12px;font-weight:900;color:${col};white-space:nowrap">${name} <b style="font-size:13px">${qty}</b></span>`;
      }

      const rowStyle = 'display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:5px 0;border-bottom:1px dashed var(--bdr)';

      const s2=Object.entries(fa.step2).filter(([,v])=>v>0);
      if(s2.length){
        html+=`<div style="font-family:'Jua',sans-serif;font-size:11px;color:var(--muted);margin:4px 0 4px">⚗️ 1차 연금품 — ${fmtTime(t1sec*(1-fr))}</div>`;
        for(const[mk2,mq2]of s2){
          const rec2=ALCHEMY[mk2];if(!rec2)continue;
          const need2=mq2*cnt, b2=Math.ceil(need2/(rec2.output||1));
          html+=`<div style="${rowStyle}">`;
          html+=resultChip(dispName(mk2), need2, getMatColor(mk2));
          html+=`<span style="color:var(--muted);font-size:11px">←</span>`;
          html+=matChips(rec2.materials, b2);
          html+=`</div>`;
        }
      }
      const s3=Object.entries(fa.step3).filter(([,v])=>v>0);
      if(s3.length){
        html+=`<div style="font-family:'Jua',sans-serif;font-size:11px;color:var(--muted);margin:8px 0 4px">🔮 2차 연금품 — ${fmtTime(t2sec*(1-fr))}</div>`;
        for(const[mk,mq]of s3){
          const rec=ALCHEMY[mk];if(!rec)continue;
          html+=`<div style="${rowStyle}">`;
          html+=resultChip(dispName(mk), mq*cnt, getMatColor(mk));
          html+=`<span style="color:var(--muted);font-size:11px">←</span>`;
          html+=matChips(rec.materials, mq*cnt);
          html+=`</div>`;
        }
      }
      html+=`<div style="font-family:'Jua',sans-serif;font-size:11px;color:${color};margin:8px 0 4px">🏆 최종 — ${fmtTime(t3sec*(1-fr))}</div>`;
      html+=`<div style="${rowStyle};border-bottom:none">`;
      html+=resultChip(fa.name, `${fmtQty(cnt)}개`, color);
      html+=`<span style="color:var(--muted);font-size:11px">←</span>`;
      html+=matChips(PRECISION_ALCHEMY[fKey].materials, cnt);
      html+=`</div>`;
      html+=`<div style="text-align:right;font-size:11px;color:${color};font-weight:700;margin-top:6px;padding-top:6px;border-top:1px solid var(--bdr)">⏱️ 합계 ${fmtTime(totalSecCard)}</div>`;

      html+=`</div></div></div>`;
    }

  /* ──────────────────────────────────────
     뷰 B: 연금 단계 단위
     섹션: 정수 → 핵 → 1성완성품 → 에센스 → 결정 → 2성완성품 → 엘릭서 → 영약 → 3성완성품 → 0성완성품
  ────────────────────────────────────── */
  } else {
    // 각 슬롯별 필요량 집계
    const agg={ess1:{},core:{},fin1:{},ess2:{},crys:{},fin2:{},ess3:{},poti:{},fin3:{},fin0:{}};
    const timeSec={ess1:0,core:0,fin1:0,ess2:0,crys:0,fin2:0,ess3:0,poti:0,fin3:0,fin0:0};

    for(const[fKey,cnt]of planEntries){
      if(cnt<=0)continue;
      const fa=finalAnalysis[fKey],fRec=PRECISION_ALCHEMY[fKey],tier=fa.tier;
      const finKey=`fin${tier}`;
      agg[finKey][fKey]=(agg[finKey][fKey]||0)+cnt;
      timeSec[finKey]+=cnt*(fa.craftTimeSec||0);

      for(const[mk2,mq2]of Object.entries(fRec.materials)){
        const rec2=ALCHEMY[mk2];if(!rec2)continue;
        if(rec2.type==='compound'){
          const slotKey=rec2.tier===1?'core':rec2.tier===2?'crys':'poti';
          agg[slotKey][mk2]=(agg[slotKey][mk2]||0)+mq2*cnt;
          timeSec[slotKey]+=mq2*cnt*(rec2.craftTimeSec||0);
          const b3=Math.ceil((mq2*cnt)/(rec2.output||1));
          for(const[mk3,mq3]of Object.entries(rec2.materials)){
            const rec3=ALCHEMY[mk3];if(!rec3||rec3.type!=='essence')continue;
            const essKey=rec3.tier===1?'ess1':rec3.tier===2?'ess2':'ess3';
            const needEss=mq3*b3;
            agg[essKey][mk3]=(agg[essKey][mk3]||0)+needEss;
            timeSec[essKey]+=Math.ceil(needEss/(rec3.output||1))*(rec3.craftTimeSec||0);
          }
        } else if(rec2.type==='essence'){
          const essKey=rec2.tier===1?'ess1':rec2.tier===2?'ess2':'ess3';
          agg[essKey][mk2]=(agg[essKey][mk2]||0)+mq2*cnt;
          timeSec[essKey]+=Math.ceil((mq2*cnt)/(rec2.output||1))*(rec2.craftTimeSec||0);
        }
      }
    }

    function stageSection(label,emoji,aggMap,secKey,accentColor){
      const entries=Object.entries(aggMap).filter(([,v])=>v>0);
      if(!entries.length)return'';
      const tSec=timeSec[secKey]*(1-fr);
      let s=`<div class="craft-flow-card" style="--tier-color:${accentColor};margin-bottom:10px">`;
      s+=`<div class="cfc-header" style="border-left-color:${accentColor}">`;
      s+=`<div class="cfc-header-left"><div class="cfc-name" style="font-size:14px">${emoji} ${label}</div></div>`;
      s+=`<div class="cfc-header-right"><div style="font-size:12px;color:${accentColor};font-weight:700">⏱️ ${fmtTime(tSec)}</div></div>`;
      s+=`</div><div class="cfc-section" style="padding:8px 14px">`;

      const lStyle='display:flex;align-items:baseline;gap:8px;padding:4px 0;border-bottom:1px dashed var(--bdr);font-size:12px';
      const lLbl='flex:0 0 auto;min-width:120px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      const lSep='flex:0 0 auto;color:var(--bdr2);font-weight:900';
      const lMat='flex:1;min-width:0;color:var(--txt)';

      for(const[key,qty]of entries){
        const rec=ALCHEMY[key]||PRECISION_ALCHEMY[key];
        const fa2=finalAnalysis[key];
        const isPA=!!PRECISION_ALCHEMY[key];
        const name=(fa2?.name||rec?.name||key).replace(/★+\s*/g,'');
        const color2=isPA?(tierColors[fa2.tier]||'#607090'):(rec?.color||'#607090');

        if(isPA){
          const netColor2=fa2.netPerUnit>=0?'var(--grn)':'var(--red)', netSign2=fa2.netPerUnit>=0?'+':'';
          // 완성품: 이름 / 개수 / 판매수익 · 순이익
          s+=`<div style="${lStyle}">`;
          s+=`<span style="${lLbl};color:${color2}">${name}</span>`;
          s+=`<span style="${lSep}">·</span>`;
          s+=`<span style="flex:0 0 auto;font-weight:900">${fmtQty(qty)}개</span>`;
          s+=`<span style="${lSep}">·</span>`;
          s+=`<span style="flex:1;font-size:11px;color:var(--muted)">판매 ${f(fa2.sellPrice*qty)}원 &nbsp;<span style="color:${netColor2}">${netSign2}${f(Math.round(fa2.netPerUnit))}/개</span></span>`;
          s+=`</div>`;
        } else if(rec){
          const batchNeeded=Math.ceil(qty/(rec.output||1));
          const matParts=Object.entries(rec.materials).filter(([,v])=>v>0)
            .map(([mk,mq])=>{
              const q=fmtQty(Math.ceil(mq*batchNeeded)), col=getMatColor(mk);
              const nm=(/^(oyster|conch|octopus|seaweed|urchin)\d$/.test(mk))?getMatName(mk):getMatName(mk).replace(/\s*★+/g,'');
              return `<span style="display:inline-flex;align-items:center;gap:3px;background:var(--bg);border:1.5px solid ${col}33;border-radius:6px;padding:2px 7px;font-size:11px;white-space:nowrap"><span style="color:${col};font-weight:700">${nm}</span><b style="color:var(--txt)">${q}</b></span>`;
            }).join(' ');
          s+=`<div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:5px 0;border-bottom:1px dashed var(--bdr)">`;
          s+=`<span style="display:inline-flex;align-items:center;gap:4px;background:${color2}18;border:2px solid ${color2};border-radius:7px;padding:3px 10px;font-size:12px;font-weight:900;color:${color2};white-space:nowrap">${name} <b style="font-size:13px">${fmtQty(qty)}</b></span>`;
          s+=`<span style="color:var(--muted);font-size:11px">←</span>`;
          s+=matParts;
          s+=`</div>`;
        }
      }
      s+=`</div></div>`;
      return s;
    }

    html+=stageSection('정수 제작',   '⚗️', agg.ess1,'ess1','#3d6fd4');
    html+=stageSection('핵 제작',     '💠', agg.core, 'core', '#3d6fd4');
    html+=stageSection('1성 완성품',  '★',  agg.fin1, 'fin1', tierColors[1]);
    html+=stageSection('에센스 제작', '⚗️', agg.ess2, 'ess2', '#7c52c8');
    html+=stageSection('결정 제작',   '💎', agg.crys, 'crys', '#7c52c8');
    html+=stageSection('2성 완성품',  '★★', agg.fin2, 'fin2', tierColors[2]);
    html+=stageSection('엘릭서 제작', '⚗️', agg.ess3, 'ess3', '#d94f3d');
    html+=stageSection('영약 제작',   '🧪', agg.poti, 'poti', '#d94f3d');
    html+=stageSection('3성 완성품',  '★★★',agg.fin3,'fin3', tierColors[3]);
    html+=stageSection('0성 완성품',  '🔬', agg.fin0, 'fin0', tierColors[0]);
  }

  // 바닐라 재료 합계
  const vanEntries=Object.entries(totalVan).filter(([,v])=>v>0);
  if(vanEntries.length){
    html+=`<div class="van-section"><div class="van-section-title">🧪 필요 바닐라 재료 합계</div><div class="van-grid">`;
    for(const[k,v]of vanEntries)html+=`<div class="van-item"><span class="vi-name" style="color:${getMatColor(k)}">${getMatName(k)}</span><span class="vi-qty">${fmtQty(v)}</span></div>`;
    html+=`</div></div>`;
  }

  // 남은 재고
  const remEntries=SF_KEYS.map(k=>[k,workInv[k]||0]).filter(([,v])=>v>0);

  // 총합
  const totalSec=planEntries.reduce((s,[k,cnt])=>{
    const fa=finalAnalysis[k];let t=cnt*(fa.craftTimeSec||0);
    for(const[mk,mq]of Object.entries(fa.step2)){const r=ALCHEMY[mk];if(r)t+=Math.ceil((mq*cnt)/(r.output||1))*(r.craftTimeSec||0);}
    for(const[mk,mq]of Object.entries(fa.step3)){const r=ALCHEMY[mk];if(r)t+=(mq*cnt)*(r.craftTimeSec||0);}
    return s+t;
  },0)*(1-fr);

  html+=`<div class="result-box" style="margin-top:12px">`;
  if(remEntries.length){
    html+=`<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed var(--bdr2);font-size:11px;color:var(--muted)">남은 어패류: `;
    html+=remEntries.map(([k,v])=>`<span style="color:${getMatColor(k)}">${getMatName(k)} ${fmtQty(v)}</span>`).join(' · ');
    html+=`</div>`;
  }
  html+=`<div style="display:flex;gap:0;align-items:stretch">`;
  html+=`<div style="flex:1;text-align:center;padding:4px 8px"><div class="rb-label">총 예상 수익</div><div class="rb-value" style="color:var(--grn)">${f(totalRev)}원</div></div>`;
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
let intermRowId=0;
window.addIntermRow=()=>{
  const list=document.getElementById('intermList');if(!list)return;
  const rid=++intermRowId,row=document.createElement('div');
  row.className='interm-row';row.id='irow_'+rid;
  row.innerHTML='<div class="interm-sel-wrap"><select class="interm-sel" id="isel_'+rid+'" onchange="saveAll()">'+makeIntermOptions()+'</select></div>'
    +'<div class="interm-qty-wrap"><input class="interm-qty" id="iqty_'+rid+'" type="number" inputmode="numeric" placeholder="개수" min="0" oninput="saveAll()"></div>'
    +'<button class="del-btn" onclick="document.getElementById(\'irow_'+rid+'\').remove();saveAll()">✕</button>';
  list.appendChild(row);initOneCdd(row.querySelector('select'));saveAll();
};
function buildHaveSeafoodGrid(){
  const el=document.getElementById('haveSeafoodGrid');if(!el)return;
  const sfColors={oyster:'#3d6fd4',conch:'#c89c00',octopus:'#7c52c8',seaweed:'#d94f3d',urchin:'#3a9e68'};
  const starLabels={1:'★ 1성',2:'★★ 2성',3:'★★★ 3성'};
  let html='<div class="slabel">🦀 어패류</div>';
  for(const sf of SF_TYPES){const meta=SEAFOOD_TYPES[sf],cl=sfColors[sf];html+='<div style="margin-bottom:8px"><div style="font-size:10px;font-weight:700;color:'+cl+';margin-bottom:4px">'+meta.name+'</div><div class="g3">';for(const t of SF_TIERS){const id='have_'+sf+'_'+t;html+='<div class="field"><label style="color:'+cl+'">'+starLabels[t]+'</label>'+splitQtyHtml(id,cl)+'</div>';}html+='</div></div>';}
  html+='<div class="slabel" style="margin-top:8px">⚗️ 보유 중간재료 <small style="font-weight:500;font-size:9px">(선택)</small></div><div id="intermList"></div><button class="add-interm-btn" onclick="addIntermRow()">+ 중간재료 추가</button>';
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
  for(const grp of groups){html+='<div class="slabel">'+grp.label+'</div><div class="g3">';for(const k of grp.keys){const meta=VANILLA_META[k];if(!meta)continue;const unit=meta.blockToCraft?'블록 세트당':'세트당';html+='<div class="field"><label>'+meta.name+' <span style="font-weight:500;color:var(--muted)">('+unit+')</span></label><input id="vprice_'+k+'" type="number" inputmode="numeric" placeholder="0" oninput="onPriceChange()"></div>';}html+='</div>';}
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
  document.querySelectorAll('#intermList .interm-row').forEach(row=>{const sel=row.querySelector('select.interm-sel'),inp=row.querySelector('input.interm-qty');irows.push({key:sel?.value||'',qty:inp?.value||''});});
  d.__irows=irows;localStorage.setItem(KEY,JSON.stringify(d));
}
function loadAll(){
  try{
    const d=JSON.parse(localStorage.getItem(KEY)||'{}');
    getStaticIds().forEach(id=>{const e=document.getElementById(id);if(e&&d[id]!==undefined)e.value=d[id];});
    const sfTog=document.getElementById('sfCostToggle');     if(sfTog)sfTog.checked    =d.__sfCostToggle     ??false;
    const stTog=document.getElementById('viewByStageToggle');if(stTog)stTog.checked    =d.__viewByStageToggle??false;
    SF_TYPES.forEach(sf=>SF_TIERS.forEach(t=>{const id='have_'+sf+'_'+t,p=document.getElementById(id+'_p'),n=readSplitQty(id);if(p&&n>0)p.textContent='총 '+f(n)+'개';}));
    if(Array.isArray(d.__irows)){d.__irows.forEach(({key,qty})=>{addIntermRow();const list=document.getElementById('intermList'),row=list?.lastElementChild;if(!row)return;const sel=row.querySelector('select.interm-sel');if(sel&&key){sel.value=key;const cdd=sel.previousElementSibling;if(cdd?.classList.contains('cdd')){const lbl=cdd.querySelector('.cdd-label');if(lbl)lbl.textContent=sel.options[sel.selectedIndex]?.text||'';cdd.querySelectorAll('.cdd-item').forEach(item=>item.classList.toggle('selected',item.dataset.value===key));}}const inp=row.querySelector('input.interm-qty');if(inp)inp.value=qty;});}
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