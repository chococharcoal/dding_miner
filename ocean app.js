/* ════════════════════════════════════════
   ocean app.js — 해양 계산기 로직
   공백 포함 파일명: "ocean app.js"
   import 경로에서 %20 인코딩 사용

   구조:
     ① 유틸리티 함수 (숫자 포맷, 수량 파싱 등)
     ② 탭 전환 (sw)
     ③ 스킬·각인석 값 읽기 (getSK, getENG)
     ④ 가격 헬퍼 (getPearlPrice, getVPrice, getSFPrice, getAlchSellPrice)
     ⑤ 스킬 변경 핸들러 (onSkillChange, onEngChange, onPriceChange)
     ⑥ TAB1: 연금품 판매가 목록 (buildAlchPriceList)
     ⑦ TAB0: 하루 수익 계산 (calcDaily)
     ⑧ TAB2: 연금 최적화 (calcOpt, switchOptTab)
     ⑨ 동적 UI 빌드 (buildVanillaPriceGrid, buildHaveSeafoodGrid, addIntermRow)
     ⑩ 자동채우기 (autoFill)
     ⑪ localStorage 저장·불러오기 (saveAll, loadAll)
     ⑫ 스킬·각인석 패널 토글 (toggleSkillPanel, toggleEngPanel)
     ⑬ 초기화 (resetAll)
     ⑭ 커스텀 드롭다운 (initOneCdd, syncDropdownLabels)
     ⑮ DOMContentLoaded 초기화
════════════════════════════════════════ */

import {
  SKILLS, ENGRAVING, ROD, OCEAN, CLAM, CRAFTS, ALCHEMY, PRECISION_ALCHEMY, VANILLA_META,
  SEAFOOD_TYPES, UNITS,
} from './ocean%20config.js';


/* ════════════════════════════════════════
   ① 유틸리티 함수
════════════════════════════════════════ */
const {SET_SIZE,BOX_SIZE}=UNITS;
const f  =n=>Math.round(n).toLocaleString('ko-KR');
const fd =(n,d=2)=>+n.toFixed(d)===Math.round(+n.toFixed(d))?Math.round(n).toString():n.toFixed(d).replace(/\.?0+$/,'');
const gi =id=>{const e=document.getElementById(id);return e?Math.max(0,+e.value||0):0;};

function fmtQty(n){
  n=Math.floor(n);if(n<=0)return'0개';
  const boxes=Math.floor(n/BOX_SIZE),rem=n%BOX_SIZE,sets=Math.floor(rem/SET_SIZE),items=rem%SET_SIZE;
  return[[boxes,'상자'],[sets,'세트'],[items,'개']].filter(([v])=>v>0).map(([v,u])=>v+u).join(' ')||'0개';
}
function parseQty(str){
  if(!str?.trim())return 0;
  if(/^\d+$/.test(str.trim()))return Math.max(0,parseInt(str.trim(),10));
  let t=0;
  const bm=str.match(/(\d+)\s*상자/);if(bm)t+=parseInt(bm[1],10)*BOX_SIZE;
  const sm=str.match(/(\d+)\s*세트/);if(sm)t+=parseInt(sm[1],10)*SET_SIZE;
  const im=str.match(/(\d+)\s*개/);  if(im)t+=parseInt(im[1],10);
  return t;
}
function fmtTime(sec){
  sec=Math.round(sec);
  const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
  return[h&&`${h}시간`,m&&`${m}분`,s&&`${s}초`].filter(Boolean).join(' ')||'0초';
}



/* ────────────────────────────────────────
   어패류 종류·성급 상수
──────────────────────────────────────── */
const SF_TYPES=['oyster','conch','octopus','seaweed','urchin'];
const SF_TIERS=[1,2,3];
const TAB_TITLES=['🐟 하루 수익 예상','📦 시세 입력','⚗️ 연금 최적화'];



/* ════════════════════════════════════════
   ② 탭 전환
════════════════════════════════════════ */
window.sw=(i,el)=>{
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  [0,1,2].forEach(k=>{const p=document.getElementById('t'+k);if(p)p.style.display='none';});
  el.classList.add('on');
  document.getElementById('t'+i).style.display='block';
  const t=document.getElementById('pageTabTitle');if(t)t.textContent=TAB_TITLES[i];
  document.title=`해양 계산기 — ${TAB_TITLES[i]}`;
  if(i===2)calcOpt();
};



/* ════════════════════════════════════════
   ③ 스킬·각인석 값 읽기
════════════════════════════════════════ */
function getSK(){
  const fl=gi('skillFurnace'),cb=gi('skillCraftBonus'),ab=gi('skillAlchBonus');
  const dh=gi('skillDeepHarvest'),sb=gi('skillStarBonus'),clm=gi('skillClamBonus');
  return{
    fr:(SKILLS.FURNACE.reductionPct[fl]??0)/100,
    cb:(SKILLS.CRAFT_BONUS.bonusPct[cb]??0)/100,
    ab:(SKILLS.ALCH_BONUS.bonusPct[ab]??0)/100,
    dhPct:SKILLS.DEEP_HARVEST.pct[dh]??0,
    sbPct:SKILLS.STAR_BONUS.pct[sb]??0,
    clmPct:SKILLS.CLAM_BONUS.pct[clm]??0,
    fl,cb_lv:cb,ab_lv:ab,dh,sb,clm,
  };
}
function getENG(){
  const cs=gi('engClamSearch'),sl=gi('engSeafoodLuck'),fr=gi('engFisherRoulette');
  const slD=ENGRAVING.SEAFOOD_LUCK.drops[sl]||{pct:0,count:0};
  return{csPct:ENGRAVING.CLAM_SEARCH.pct[cs]??0,slPct:slD.pct,slCnt:slD.count,
    frPct:ENGRAVING.FISHER_ROULETTE.dicePct[fr]??0,cs,sl,fr};
}



/* ════════════════════════════════════════
   ④ 가격 헬퍼
════════════════════════════════════════ */
// 진주 가격: 공예품 최고가 × 판매 보너스 (조개 좀 사조개 스킬)
function getPearlPrice(pearlKey){
  const craft=Object.values(CRAFTS).find(c=>c.pearlKey===pearlKey);
  if(!craft)return 0;
  const sk=getSK();
  return Math.round(craft.priceMax*(1+sk.cb));
}

// 바닐라 재료 단가 → 개당 원가로 환산
// per_set: 세트당 입력 → ÷64 = 개당
// blockToCraft: 블록 세트 기준 입력 → ÷64(블록개당) ÷blockToCraft(낱개당)
function getVPrice(key){
  const meta=VANILLA_META[key];if(!meta)return 0;
  const raw=gi(`vprice_${key}`);
  if(raw===0)return 0;
  if(meta.blockToCraft){
    // 블록 세트당 가격 → 블록 1개당 → 낱개(주괴/다이아) 1개당
    return (raw/SET_SIZE)/meta.blockToCraft;
  }
  // per_set: 세트당 → 개당, per_item: 개당 그대로
  return meta.priceUnit==='per_set' ? raw/SET_SIZE : raw;
}

// 어패류 단가 (성급 공통)
function getSFPrice(tier){return gi(`price_sf_${tier}`);}

// 정밀 연금 판매가 (스킬 적용)
function getAlchSellPrice(key){
  const item=PRECISION_ALCHEMY[key];if(!item)return 0;
  const sk=getSK();
  return Math.round(item.price*(1+(item.tier===0?0:sk.ab)));
}



/* ════════════════════════════════════════
   ⑤ 스킬·각인석 변경 핸들러
════════════════════════════════════════ */
window.onSkillChange=()=>{
  const st=(id,txt)=>{const e=document.getElementById(id);if(e)e.textContent=txt;};
  const sk=getSK();
  st('infoFurnace',    sk.fl===0?'기본':`Lv${sk.fl} — -${SKILLS.FURNACE.reductionPct[sk.fl]}%`);
  st('infoCraftBonus', sk.cb_lv===0?'기본':`Lv${sk.cb_lv} — +${SKILLS.CRAFT_BONUS.bonusPct[sk.cb_lv]}%`);
  st('infoAlchBonus',  sk.ab_lv===0?'기본':`Lv${sk.ab_lv} — +${SKILLS.ALCH_BONUS.bonusPct[sk.ab_lv]}%`);
  st('infoDeepHarvest',sk.dh===0?'기본':`Lv${sk.dh} — +${sk.dhPct}%`);
  st('infoStarBonus',  sk.sb===0?'기본':`Lv${sk.sb} — +${sk.sbPct}%`);
  st('infoClamBonus',  sk.clm===0?'기본':`Lv${sk.clm} — +${sk.clmPct}%`);
  calcDaily(); buildAlchPriceList();
  const el=document.getElementById('t2');if(el&&el.style.display!=='none')calcOpt();
};
window.onEngChange=()=>{
  const st=(id,txt)=>{const e=document.getElementById(id);if(e)e.textContent=txt;};
  const eng=getENG();
  st('infoClamSearch',    eng.cs===0?'없음':`+${eng.csPct}%`);
  const slD=ENGRAVING.SEAFOOD_LUCK.drops[eng.sl];
  st('infoSeafoodLuck',   eng.sl===0?'없음':slD?`${slD.pct}%/+${slD.count}개`:'');
  st('infoFisherRoulette',eng.fr===0?'없음':`${eng.frPct}% 룰렛`);
  calcDaily();
};
window.onPriceChange=()=>{calcDaily();buildAlchPriceList();
  const el=document.getElementById('t2');if(el&&el.style.display!=='none')calcOpt();
};



/* ════════════════════════════════════════
   ⑥ TAB1: 연금품 판매가 목록
════════════════════════════════════════ */
function buildAlchPriceList(){
  const el=document.getElementById('alchPriceList');if(!el)return;
  const tierColors={0:'#607090',1:'#3d6fd4',2:'#7c52c8',3:'#d94f3d'};
  let html='';
  for(const[key,item]of Object.entries(PRECISION_ALCHEMY)){
    const price=getAlchSellPrice(key);
    const color=tierColors[item.tier]||'#607090';
    const sk=getSK();const bonus=item.tier===0?0:sk.ab;
    html+=`<div class="rrow"><span class="rl" style="color:${color}">${item.name}</span><span class="rv" style="color:${color}">${f(price)}원${bonus>0?` <small>(+${Math.round(bonus*100)}%)</small>`:''}</span></div>`;
  }
  el.innerHTML=html;
}



/* ────────────────────────────────────────
   조개 기댓값 (진주별 확률×공예품 최고가×판매보너스)
──────────────────────────────────────── */
// 조개 기댓값 (진주별 확률×공예품 최고가)
function calcClamEV(){
  let ev=0;
  for(const[k,v]of Object.entries(CLAM.contents)){
    if(k==='shell')continue;
    ev+=v.pct/100*getPearlPrice(k);
  }
  return ev;
}



/* ════════════════════════════════════════
   ⑦ TAB0: 하루 수익 계산
════════════════════════════════════════ */
// TAB 0: 하루 수익
window.calcDaily=()=>{
  const sk=getSK(),eng=getENG();
  const rod=ROD[gi('rodLevel')]??ROD[0];
  const stamina=gi('totalStamina');
  const hc=stamina>0?Math.floor(stamina/OCEAN.STAMINA_PER_USE):0;
  if(!hc){document.getElementById('dailyRes').innerHTML='<div class="empty-msg">스태미나를 입력하면 계산됩니다</div>';return;}

  const deepX=sk.dhPct/100, luckX=eng.slPct/100*eng.slCnt;
  const roulX=eng.frPct/100*(0.9*3.5*ENGRAVING.FISHER_ROULETTE.normalMult+0.1*3.5*ENGRAVING.FISHER_ROULETTE.goldenMult);
  const perH=rod.seafoodDrop+deepX+luckX+roulX;
  const total=hc*perH;

  const extra3=sk.sbPct/100,r3=Math.min(1,1/3+extra3),r1=Math.max(0,(1-r3)/2),r2=r1;
  const p1=getSFPrice(1),p2=getSFPrice(2),p3=getSFPrice(3);
  const sfRev=total*(r1*p1+r2*p2+r3*p3);

  const clamPct=rod.clamPct+sk.clmPct+eng.csPct;
  const clamDrop=hc*(clamPct/100)*CLAM.dropPct/100;
  const clamEV=calcClamEV();
  const clamRev=clamDrop*clamEV;
  const totalRev=sfRev+clamRev;

  const pearlNames={yellow:'노란빛',blue:'푸른빛',cyan:'청록빛',pink:'분홍빛',purple:'보라빛',black:'흑'};
  const craftNames={yellow:'브로치',blue:'향수병',cyan:'손거울',pink:'헤어핀',purple:'부채',black:'시계'};
  let pearlRows='';
  for(const[k,v]of Object.entries(CLAM.contents)){
    if(k==='shell')continue;
    const price=getPearlPrice(k),cnt=clamDrop*v.pct/100;
    if(cnt<0.001)continue;
    pearlRows+=`<div class="rrow"><span class="rl">└ ${pearlNames[k]} 진주 (${v.pct}%) → ${craftNames[k]} 기준</span><span class="rv g">${fd(cnt,1)}개 × ${f(price)}원 = ${f(Math.round(cnt*price))}원</span></div>`;
  }

  const parts=[];
  if(rod.seafoodDrop)parts.push(`낚싯대 ${rod.seafoodDrop}`);
  if(deepX)parts.push(`심해 +${fd(deepX,2)}`);
  if(luckX)parts.push(`행운 +${fd(luckX,2)}`);
  if(roulX)parts.push(`룰렛 +${fd(roulX,2)}`);

  document.getElementById('dailyRes').innerHTML=`
  <div class="rsec"><div class="rsec-title" style="color:var(--acc)">🦀 어패류 획득</div>
    <div class="rrow"><span class="rl">수중 어획 횟수</span><span class="rv">${f(hc)}회 <small style="color:var(--muted)">(${f(stamina)}÷15)</small></span></div>
    <div class="rrow"><span class="rl">회당 기댓값</span><span class="rv">${fd(perH,2)}개 <small style="color:var(--muted)">${parts.join(' / ')}</small></span></div>
    <div class="rrow"><span class="rl">총 어패류</span><span class="rv">${fmtQty(total)} <small style="color:var(--muted)">(1성 ${Math.round(r1*100)}%/2성 ${Math.round(r2*100)}%/3성 ${Math.round(r3*100)}%)</small></span></div>
    <div class="rrow rrow-strong"><span class="rl">어패류 수익</span><span class="rv g">${f(sfRev)}원</span></div>
  </div>
  ${clamDrop>0.01?`<div class="rsec"><div class="rsec-title" style="color:var(--acc)">🐚 알쏭달쏭 조개</div>
    <div class="rrow"><span class="rl">총 조개 등장 횟수</span><span class="rv">${fd(hc*(rod.clamPct+sk.clmPct+eng.csPct)/100,1)}마리 <small style="color:var(--muted)">(${rod.clamPct}%낚싯대+${sk.clmPct}%스킬+${eng.csPct}%각인)</small></span></div>
    <div class="rrow"><span class="rl">조개 드롭 수 (50%)</span><span class="rv">${fd(clamDrop,1)}개</span></div>
    <div class="rrow"><span class="rl">조개 개당 기댓값</span><span class="rv"><b>${f(Math.round(clamEV))}원</b> <small style="color:var(--muted)">(공예품 최고가 × 판매보너스 반영)</small></span></div>
    ${pearlRows}
    <div class="rrow rrow-strong"><span class="rl">오늘 예상 진주 수익</span><span class="rv g">${f(clamRev)}원</span></div>
  </div>`:''}
  <div class="result-box"><div style="display:flex;gap:0">
    <div style="flex:1;text-align:center;padding:4px 8px"><div class="rb-label">어패류 수익</div><div class="rb-value" style="font-size:18px">${f(sfRev)}원</div></div>
    ${clamRev>0?`<div style="width:1px;background:var(--bdr2);margin:4px 0"></div><div style="flex:1;text-align:center;padding:4px 8px"><div class="rb-label">진주 수익</div><div class="rb-value" style="font-size:18px">${f(clamRev)}원</div></div>`:''}
  </div>
  <div style="text-align:center;margin-top:8px;padding-top:8px;border-top:1px dashed var(--bdr2)">
    <div class="rb-label">하루 합계</div><div class="rb-value" style="color:var(--grn)">${f(totalRev)}원</div>
  </div></div>`;
};



/* ════════════════════════════════════════
   ⑧ TAB2: 연금 최적화
   - isRawMat: 원재료(어패류/바닐라) 판별
   - consumeFrom: 재귀 소모 (바닐라는 항상 구매 가능)
   - canProduceFinal: 생산 가능 여부
   - maxProducible: 이진탐색으로 최대 생산량
   - calcOpt: 그리디 최적화 + 성급별 탭 렌더링
   - switchOptTab: 성급 탭 전환
════════════════════════════════════════ */
// ════════════════════════════════
// TAB 2: 연금 최적화
// ════════════════════════════════

// 원재료 여부: 어패류(sfKey+tier) 또는 바닐라
function isRawMat(key){
  return /^(oyster|conch|octopus|seaweed|urchin)\d$/.test(key) || !!VANILLA_META[key];
}

// ALCHEMY 레시피 또는 PRECISION_ALCHEMY 레시피 조회
function getRec(key){ return ALCHEMY[key] || PRECISION_ALCHEMY[key] || null; }

// inv에서 key를 need개 소모. 부족하면 재귀 제작으로 보충.
// 어패류: 재고 없으면 실패 (획득 불가)
// 바닐라 재료: 재고 없어도 성공 (구매 가능, 비용만 발생)
// ALCHEMY 중간재료: 재귀 제작
function consumeFrom(key, need, inv, craftLog, depth=0){
  if(depth>20) return false;
  if(need<=0) return true;

  const have = inv[key]||0;
  if(have >= need){ inv[key] = have - need; return true; }

  // 어패류 → 재고 부족이면 실패
  if(/^(oyster|conch|octopus|seaweed|urchin)\d$/.test(key)) return false;

  // 바닐라 재료 → 항상 구매 가능 (재고 차감 후 음수 허용)
  if(VANILLA_META[key]){
    inv[key] = (inv[key]||0) - need; // 음수 허용 (부족분은 구매)
    return true;
  }

  const rec = ALCHEMY[key];
  if(!rec) return false;

  const shortfall = need - have;
  const batches = Math.ceil(shortfall / rec.output);

  const tmpInv = {...inv};
  for(const [mk, mq] of Object.entries(rec.materials)){
    if(!consumeFrom(mk, mq*batches, tmpInv, craftLog, depth+1)) return false;
  }

  Object.assign(inv, tmpInv);
  inv[key] = ((inv[key]||0) + batches * rec.output) - need;
  if(craftLog) craftLog[key] = (craftLog[key]||0) + batches * rec.output;
  return true;
}

// 최종 산물 n개 만들 수 있는지 체크 (어패류 재고 기준)
function canProduceFinal(finalKey, qty, inv){
  const rec = PRECISION_ALCHEMY[finalKey];
  if(!rec) return false;
  const tmpInv = {...inv};
  const craftLog = {};
  for(const [mk, mq] of Object.entries(rec.materials)){
    if(!consumeFrom(mk, mq*qty, tmpInv, craftLog)) return false;
  }
  return true;
}

// 이진탐색으로 최대 생산 가능 수량 (어패류 보유량이 상한)
function maxProducible(finalKey, inv){
  // hi 상한: 전체 어패류 보유량 합산 (어패류만 생산 제약)
  const sfTotal = Object.entries(inv)
    .filter(([k]) => /^(oyster|conch|octopus|seaweed|urchin)\d$/.test(k))
    .reduce((s,[,v])=>s+v, 0);
  if(sfTotal <= 0) return 0;
  if(!canProduceFinal(finalKey, 1, {...inv})) return 0;
  let lo=1, hi=sfTotal;
  while(lo<hi){
    const mid = Math.ceil((lo+hi)/2);
    if(canProduceFinal(finalKey, mid, {...inv})) lo=mid; else hi=mid-1;
  }
  return lo;
}

// 실제 소모 실행 + 중간 제작 로그 반환
function executeProduceFinal(finalKey, qty, inv){
  const rec = PRECISION_ALCHEMY[finalKey];
  if(!rec) return {};
  const craftLog = {};
  for(const [mk, mq] of Object.entries(rec.materials)){
    consumeFrom(mk, mq*qty, inv, craftLog);
  }
  return craftLog;
}

// 원재료까지 재귀 전개
function expandToRaw(key, qty, visited=new Set()){
  if(visited.has(key)) return {};
  const vis2 = new Set(visited); vis2.add(key);
  if(isRawMat(key)) return {[key]: qty};
  const rec = ALCHEMY[key];
  if(!rec) return {[key]: qty};
  const batches = Math.ceil(qty / rec.output);
  const result = {};
  for(const [mk, mq] of Object.entries(rec.materials)){
    const sub = expandToRaw(mk, mq*batches, vis2);
    for(const [rk,rv] of Object.entries(sub)) result[rk] = (result[rk]||0) + rv;
  }
  return result;
}

function calcOpt(){
  // ── 보유 재고 수집 ──
  const inv = {};
  for(const sf of SF_TYPES) for(const t of SF_TIERS){
    const v = parseQty(document.getElementById(`have_${sf}_${t}`)?.value||'');
    if(v>0) inv[`${sf}${t}`] = (inv[`${sf}${t}`]||0) + v;
  }
  document.querySelectorAll('.interm-row').forEach(row=>{
    const sel=row.querySelector('select.interm-sel'), inp=row.querySelector('input.interm-qty');
    if(!sel||!inp) return;
    const key=sel.value, qty=parseInt(inp.value)||0;
    if(key&&qty>0) inv[key]=(inv[key]||0)+qty;
  });

  const sfTotal = SF_TYPES.flatMap(sf=>SF_TIERS.map(t=>`${sf}${t}`)).reduce((s,k)=>s+(inv[k]||0),0);
  const intermTotal = Object.keys(inv).filter(k=>ALCHEMY[k]).reduce((s,k)=>s+(inv[k]||0),0);
  if(sfTotal<=0 && intermTotal<=0){
    document.getElementById('optRes').innerHTML='<div class="empty-msg">보유 어패류를 입력하면 계산됩니다</div>';
    return;
  }

  const SF_KEYS = SF_TYPES.flatMap(sf=>SF_TIERS.map(t=>`${sf}${t}`));

  // 1성→2성 업그레이드
  function consumeSF(sfKey, need, inv){
    const m=sfKey.match(/^(oyster|conch|octopus|seaweed|urchin)(\d)$/); if(!m) return false;
    const sf=m[1], tier=+m[2];
    let have=inv[sfKey]||0, remaining=need-have;
    if(remaining<=0){ inv[sfKey]=have-need; return true; }
    if(tier===2){
      const t1=`${sf}1`, canUp=Math.floor((inv[t1]||0)/3), up=Math.min(canUp,remaining);
      if(up>0){ inv[t1]-=up*3; inv[sfKey]=(inv[sfKey]||0)+up; have=inv[sfKey]; remaining=need-have; }
    }
    if(remaining>0) return false;
    inv[sfKey]=have-need; return true;
  }
  function canAffordSF(sfNeed,inv){ const tmp={...inv}; for(const [k,v] of Object.entries(sfNeed)) if(!consumeSF(k,v,tmp)) return false; return true; }
  function doConsumeSF(sfNeed,inv){ for(const [k,v] of Object.entries(sfNeed)) consumeSF(k,v,inv); }

  // 재귀 전개
  function expandMaterials(key,qty,depth=0){
    if(depth>15) return {};
    if(SF_KEYS.includes(key)) return {[key]:qty};
    if(VANILLA_META[key]) return {[key]:qty};
    const rec=ALCHEMY[key]; if(!rec) return {};
    const b=Math.ceil(qty/(rec.output||1)); const r={};
    for(const [mk,mq] of Object.entries(rec.materials)){ const s=expandMaterials(mk,mq*b,depth+1); for(const [k,v] of Object.entries(s)) r[k]=(r[k]||0)+v; }
    return r;
  }
  function calcVanillaCost(mats){ let c=0; for(const [mk,mq] of Object.entries(mats)){ const e=expandMaterials(mk,mq); for(const [k,v] of Object.entries(e)) if(VANILLA_META[k]) c+=v*getVPrice(k); } return c; }

  // 최종산물 분석
  const finalAnalysis = {};
  for(const [fKey,fRec] of Object.entries(PRECISION_ALCHEMY)){
    const sfNeed={}, step2={}, step3={};
    for(const [mk,mq] of Object.entries(fRec.materials)){
      const rec=ALCHEMY[mk]; if(!rec) continue;
      if(rec.type==='compound'){
        step3[mk]=(step3[mk]||0)+mq;
        const b3=Math.ceil(mq/(rec.output||1));
        for(const [mk2,mq2] of Object.entries(rec.materials)){
          const rec2=ALCHEMY[mk2];
          if(rec2&&rec2.type==='essence'){
            step2[mk2]=(step2[mk2]||0)+mq2*b3;
            const b2=Math.ceil((mq2*b3)/(rec2.output||1));
            for(const [mk3,mq3] of Object.entries(rec2.materials)) if(SF_KEYS.includes(mk3)) sfNeed[mk3]=(sfNeed[mk3]||0)+mq3*b2;
          } else if(SF_KEYS.includes(mk2)) sfNeed[mk2]=(sfNeed[mk2]||0)+mq2*b3;
        }
      } else if(rec.type==='essence'){
        step2[mk]=(step2[mk]||0)+mq;
        const b2=Math.ceil(mq/(rec.output||1));
        for(const [mk2,mq2] of Object.entries(rec.materials)) if(SF_KEYS.includes(mk2)) sfNeed[mk2]=(sfNeed[mk2]||0)+mq2*b2;
      }
    }
    const sellPrice=getAlchSellPrice(fKey);
    const vanCost=calcVanillaCost(fRec.materials);
    finalAnalysis[fKey]={ name:fRec.name, tier:fRec.tier, sfNeed, vanCost, sellPrice, netPerUnit:sellPrice-vanCost, step2, step3, craftTimeSec:fRec.craftTimeSec||0 };
  }

  // 반복 그리디 최적화
  const workInv={...inv}; const plan={}; let iter=0;
  while(iter++<100000){
    let bestKey=null, bestNet=-Infinity;
    for(const [fKey,fa] of Object.entries(finalAnalysis)){
      const adj={...fa.sfNeed};
      for(const [mk,mq] of Object.entries(fa.step3)){ const use=Math.min(workInv[mk]||0,mq); if(use<=0) continue; const rec=ALCHEMY[mk]; if(!rec) continue; const b3=Math.ceil(use/(rec.output||1)); for(const [mk2,mq2] of Object.entries(rec.materials)){ const rec2=ALCHEMY[mk2]; if(rec2&&rec2.type==='essence'){ const b2=Math.ceil((mq2*b3)/(rec2.output||1)); for(const [mk3,mq3] of Object.entries(rec2.materials)) if(SF_KEYS.includes(mk3)) adj[mk3]=Math.max(0,(adj[mk3]||0)-mq3*b2); } else if(SF_KEYS.includes(mk2)) adj[mk2]=Math.max(0,(adj[mk2]||0)-mq2*b3); } }
      for(const [mk,mq] of Object.entries(fa.step2)){ const use=Math.min(workInv[mk]||0,mq); if(use<=0) continue; const rec=ALCHEMY[mk]; if(!rec) continue; const b2=Math.ceil(use/(rec.output||1)); for(const [mk2,mq2] of Object.entries(rec.materials)) if(SF_KEYS.includes(mk2)) adj[mk2]=Math.max(0,(adj[mk2]||0)-mq2*b2); }
      if(!canAffordSF(adj,workInv)) continue;
      if(fa.netPerUnit>bestNet){ bestNet=fa.netPerUnit; bestKey=fKey; }
    }
    if(!bestKey) break;
    plan[bestKey]=(plan[bestKey]||0)+1;
    const fa=finalAnalysis[bestKey];
    for(const [mk,mq] of Object.entries(fa.step3)){ const use=Math.min(workInv[mk]||0,mq); if(use>0) workInv[mk]-=use; }
    for(const [mk,mq] of Object.entries(fa.step2)){ const use=Math.min(workInv[mk]||0,mq); if(use>0) workInv[mk]-=use; }
    doConsumeSF(fa.sfNeed,workInv);
  }

  if(!Object.keys(plan).length){
    document.getElementById('optRes').innerHTML='<div class="empty-msg">재료가 부족하여 만들 수 있는 연금품이 없습니다</div>';
    return;
  }

  // ── 렌더링 ──
  const sfColors={oyster:'#3d6fd4',conch:'#c89c00',octopus:'#7c52c8',seaweed:'#d94f3d',urchin:'#3a9e68'};
  const tierColors={0:'#607090',1:'#3d6fd4',2:'#7c52c8',3:'#d94f3d'};
  const tierLabels={0:'0성',1:'1성 ★',2:'2성 ★★',3:'3성 ★★★'};

  function getSFMatch(k){ return k.match(/^(oyster|conch|octopus|seaweed|urchin)(\d)$/); }
  function getSFName(k){ const m=getSFMatch(k); if(!m) return null; return `${SEAFOOD_TYPES[m[1]]?.name||m[1]} ${'★'.repeat(+m[2])}`; }
  function getSFColor(k){ const m=getSFMatch(k); return m?sfColors[m[1]]:'#888'; }
  function getMatName(k){ return getSFName(k)||VANILLA_META[k]?.name||ALCHEMY[k]?.name||k; }
  function getMatColor(k){
    const m=getSFMatch(k); if(m) return sfColors[m[1]];
    if(VANILLA_META[k]) return '#607090';
    if(ALCHEMY[k]) return ALCHEMY[k].color||'#607090';
    return '#607090';
  }

  // 재료 칩 (이미지 없이 색상만)
  function chip(key, qty, qtyStr){
    const color = getMatColor(key);
    const name = getMatName(key);
    const qs = qtyStr || (qty ? fmtQty(qty) : '');
    return `<span class="mat-chip-flow" style="--chip-color:${color}">
      <span class="chip-name">${name}</span>
      <span class="chip-qty">${qs}</span>
    </span>`;
  }
  const plus = `<span class="flow-plus">+</span>`;
  const arrow = `<span class="flow-arrow">→</span>`;

  // 성급별 그룹화
  const byTier = {0:[],1:[],2:[],3:[]};
  let totalRev=0, time2=0, time3=0, time4=0;
  for(const [fKey,cnt] of Object.entries(plan)){
    const fa=finalAnalysis[fKey];
    byTier[fa.tier].push({fKey,cnt,fa});
    totalRev+=cnt*fa.sellPrice;
    time4+=cnt*(fa.craftTimeSec||0);
    for(const [mk,mq] of Object.entries(fa.step2)){ const rec=ALCHEMY[mk];if(!rec)continue; time2+=Math.ceil((mq*cnt)/(rec.output||1))*(rec.craftTimeSec||0); }
    for(const [mk,mq] of Object.entries(fa.step3)){ const rec=ALCHEMY[mk];if(!rec)continue; time3+=(mq*cnt)*(rec.craftTimeSec||0); }
  }

  const activeTiers = [0,1,2,3].filter(t=>byTier[t].length>0);
  const firstTier = activeTiers[0];

  // 탭
  let html = `<div class="opt-tabs">`;
  for(const t of activeTiers){
    const color=tierColors[t];
    const ttlRev=byTier[t].reduce((s,{cnt,fa})=>s+cnt*fa.sellPrice,0);
    html+=`<div class="opt-tab${t===firstTier?' active':''}" onclick="switchOptTab(${t})" data-tier="${t}" style="--tab-color:${color}">
      <span>${tierLabels[t]}</span><small>${f(ttlRev)}원</small>
    </div>`;
  }
  html += `</div>`;

  // 성급별 탭 콘텐츠
  for(const t of activeTiers){
    const items = byTier[t];
    const color = tierColors[t];

    // 이 성급에서 필요한 step2(정수류), step3(핵류) 전체 합산
    const tierStep2={}, tierStep3={};
    for(const {fKey,cnt,fa} of items){
      for(const [mk,mq] of Object.entries(fa.step2)) tierStep2[mk]=(tierStep2[mk]||0)+mq*cnt;
      for(const [mk,mq] of Object.entries(fa.step3)) tierStep3[mk]=(tierStep3[mk]||0)+mq*cnt;
    }

    // 이 성급에서 필요한 원재료 전체 합산 (어패류 + 바닐라)
    const tierSF={}, tierVan={};
    for(const {fKey,cnt,fa} of items){
      for(const [k,v] of Object.entries(fa.sfNeed)) tierSF[k]=(tierSF[k]||0)+v*cnt;
      // 바닐라 (step2, step3 통해서)
      for(const [mk,mq] of Object.entries(fa.step2)){
        const rec=ALCHEMY[mk]; if(!rec) continue;
        const b=Math.ceil((mq*cnt)/(rec.output||1));
        for(const [mk2,mq2] of Object.entries(rec.materials)) if(VANILLA_META[mk2]) tierVan[mk2]=(tierVan[mk2]||0)+mq2*b;
      }
      for(const [mk,mq] of Object.entries(fa.step3)){
        const rec=ALCHEMY[mk]; if(!rec) continue;
        for(const [mk2,mq2] of Object.entries(rec.materials)) if(VANILLA_META[mk2]) tierVan[mk2]=(tierVan[mk2]||0)+mq2*mq*cnt;
      }
    }

    const titleStr = items.map(({fa,cnt})=>`${fa.name} ${cnt}개`).join(' · ');

    html+=`<div class="opt-tab-content" id="opt-tier-${t}" style="${t===firstTier?'':'display:none'}">`;
    html+=`<div class="craft-flow-card">`;
    html+=`<div class="craft-flow-title" style="color:${color}">제작 목표: ${titleStr}</div>`;

    // STEP 1: 원재료 합계
    const sfEntries = Object.entries(tierSF).filter(([,v])=>v>0);
    const vanEntries = Object.entries(tierVan).filter(([,v])=>v>0);
    if(sfEntries.length||vanEntries.length){
      html+=`<div class="craft-step-label">📦 1단계 — 원재료</div>`;
      html+=`<div class="craft-row-wrap">`;
      for(const [k,v] of sfEntries) html+=chip(k,v);
      for(const [k,v] of vanEntries) html+=chip(k,v);
      html+=`</div>`;
    }

    // STEP 2: 1차 연금 (정수/에센스/엘릭서) 제작
    const s2entries=Object.entries(tierStep2).filter(([,v])=>v>0);
    if(s2entries.length){
      html+=`<div class="craft-step-label">⚗️ 2단계 — 1차 연금 제작</div>`;
      // 각 정수류별로 재료→결과 한 줄씩
      for(const [mk2,totalQty] of s2entries){
        const rec2=ALCHEMY[mk2]; if(!rec2) continue;
        const b2=Math.ceil(totalQty/(rec2.output||1));
        html+=`<div class="craft-row-flow">`;
        const mats2=Object.entries(rec2.materials);
        mats2.forEach(([mk3,mq3],idx)=>{
          html+=chip(mk3,mq3*b2);
          if(idx<mats2.length-1) html+=plus;
        });
        html+=arrow;
        html+=chip(mk2,null,`${totalQty}개`);
        html+=`</div>`;
      }
    }

    // STEP 3: 2차 가공 (핵/결정/영약) 제작 — 개별 라인
    const s3entries=Object.entries(tierStep3).filter(([,v])=>v>0);
    if(s3entries.length){
      html+=`<div class="craft-step-label">🔮 3단계 — 2차 가공 제작</div>`;
      for(const [mk,totalQty] of s3entries){
        const rec=ALCHEMY[mk]; if(!rec) continue;
        html+=`<div class="craft-row-flow">`;
        const mats=Object.entries(rec.materials);
        mats.forEach(([mk2,mq2],idx)=>{
          html+=chip(mk2,mq2*totalQty);
          if(idx<mats.length-1) html+=plus;
        });
        html+=arrow;
        html+=chip(mk,null,`${totalQty}개`);
        html+=`</div>`;
      }
    }

    // STEP 4: 최종산물 각각
    html+=`<div class="craft-step-label">🏆 4단계 — 최종 연금품 제작</div>`;
    for(const {fKey,cnt,fa} of items){
      const fRec=PRECISION_ALCHEMY[fKey];
      html+=`<div class="craft-row-flow">`;
      const fmats=Object.entries(fRec.materials);
      fmats.forEach(([mk,mq],idx)=>{
        html+=chip(mk,mq*cnt);
        if(idx<fmats.length-1) html+=plus;
      });
      html+=arrow;
      // 최종 결과물 칩 (강조)
      html+=`<span class="mat-chip-flow result-chip" style="--chip-color:${color}">
        <span class="chip-name" style="font-weight:900">${fa.name}</span>
        <span class="chip-qty" style="font-weight:900">${cnt}개 · ${f(fa.sellPrice*cnt)}원</span>
      </span>`;
      html+=`</div>`;
    }

    html+=`</div>`; // craft-flow-card
    html+=`</div>`; // opt-tab-content
  }

  // result-box
  const sk=getSK(); const fr=sk.fr;
  const effTime=(time2+time3+time4)*(1-fr);
  html+=`<div class="result-box" style="margin-top:12px">
    <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed var(--bdr2)">
      <div class="rb-label" style="margin-bottom:5px">⏱️ 단계별 제작 시간</div>
      ${time2>0?`<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0"><span style="color:var(--muted)">⚗️ 2단계</span><span style="font-weight:700">${fmtTime(time2*(1-fr))}</span></div>`:''}
      ${time3>0?`<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0"><span style="color:var(--muted)">🔮 3단계</span><span style="font-weight:700">${fmtTime(time3*(1-fr))}</span></div>`:''}
      ${time4>0?`<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0"><span style="color:var(--muted)">🏆 4단계</span><span style="font-weight:700">${fmtTime(time4*(1-fr))}</span></div>`:''}
      ${fr>0?`<div style="font-size:10px;color:var(--muted);margin-top:2px">스킬 -${Math.round(fr*100)}% 반영</div>`:''}
    </div>
    <div style="display:flex;gap:0;align-items:stretch">
      <div style="flex:1;text-align:center;padding:4px 8px"><div class="rb-label">총 예상 수익</div><div class="rb-value" style="color:var(--grn)">${f(totalRev)}원</div></div>
      <div style="width:1px;background:var(--bdr2);margin:4px 0"></div>
      <div style="flex:1;text-align:center;padding:4px 8px"><div class="rb-label">총 제작 시간</div><div class="rb-value" style="font-size:16px">${fmtTime(effTime)}</div></div>
    </div>
  </div>`;

  document.getElementById('optRes').innerHTML = html;
}

window.switchOptTab = (tier) => {
  document.querySelectorAll('.opt-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.opt-tab-content').forEach(c=>c.style.display='none');
  const tab=document.querySelector(`.opt-tab[data-tier="${tier}"]`); if(tab) tab.classList.add('active');
  const con=document.getElementById(`opt-tier-${tier}`); if(con) con.style.display='block';
};

window.switchOptTab = (tier) => {
  document.querySelectorAll('.opt-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.opt-tab-content').forEach(c=>c.style.display='none');
  const tab = document.querySelector(`.opt-tab[data-tier="${tier}"]`);
  if(tab) tab.classList.add('active');
  const content = document.getElementById(`opt-tier-${tier}`);
  if(content) content.style.display='block';
};



/* ════════════════════════════════════════
   ⑨ 동적 UI 빌드
════════════════════════════════════════ */
// ── 동적 UI 빌드 ──
function buildVanillaPriceGrid(){
  const el=document.getElementById('vanillaPriceGrid');if(!el)return;
  const groups={
    fish:'🐟 커스텀 물고기 (원/세트)',
    ocean:'🌊 해양 채집 (원/세트)',
    leaf:'🍃 나뭇잎 (원/세트)',
    mineral:'⛏️ 광물·블록 (원/세트, 철·금·다이아는 블록 세트 기준)',
    nether:'🔥 네더 (원/세트)',
    coral:'🪸 죽은 산호 (원/세트)',
  };
  let html='';
  const byGroup={};
  for(const[k,v]of Object.entries(VANILLA_META)){(byGroup[v.group]=byGroup[v.group]||[]).push([k,v]);}
  for(const[grp,label]of Object.entries(groups)){
    const items=byGroup[grp]||[];if(!items.length)continue;
    html+=`<div class="slabel" style="margin-top:8px">${label}</div><div class="g3" style="margin-bottom:4px">`;
    for(const[k,v]of items){
      const subLabel=v.blockToCraft?`${v.name} (블록세트→주괴환산)`:v.name;
      html+=`<div class="field"><label>${subLabel}</label><input id="vprice_${k}" type="number" inputmode="numeric" placeholder="0" oninput="onPriceChange()"></div>`;
    }
    html+=`</div>`;
  }
  el.innerHTML=html;
}

function buildHaveSeafoodGrid(){
  const el=document.getElementById('haveSeafoodGrid');if(!el)return;
  let html='';
  for(const sf of SF_TYPES){
    const meta=SEAFOOD_TYPES[sf];const cl=meta.color;
    html+=`<div class="slabel" style="color:${cl}">${meta.name}</div><div class="g3" style="margin-bottom:4px">`;
    for(const t of SF_TIERS){
      html+=`<div class="field"><label style="color:${cl}">${meta.name} ${'★'.repeat(t)}</label>
        <input id="have_${sf}_${t}" type="text" placeholder="0 또는 n상자 n세트 n개" oninput="calcOpt()"></div>`;
    }
    html+=`</div>`;
  }
  el.innerHTML=html;
}

// 중간재료 추가 행
let intermRowId=0;
function makeIntermOptions(){
  const groups=[
    ['── 1차 정수 ──',['essence_guardian1','essence_wave1','essence_chaos1','essence_life1','essence_corrosion1']],
    ['── 1차 핵 ──',  ['core_guard','core_wave','core_chaos','core_life','core_corrosion']],
    ['── 2차 에센스 ──',['essence_guardian2','essence_wave2','essence_chaos2','essence_life2','essence_corrosion2']],
    ['── 2차 결정 ──',['crystal_vitality','crystal_erosion','crystal_defense','crystal_torrent','crystal_poison']],
    ['── 3차 엘릭서 ──',['elixir_guardian','elixir_wave','elixir_chaos','elixir_life','elixir_corrosion']],
    ['── 3차 영약 ──',['potion_immortal','potion_barrier','potion_corrupt','potion_frenzy','potion_venom']],
  ];
  let opts='<option value="">중간재료 선택</option>';
  for(const[label,keys]of groups){
    opts+=`<optgroup label="${label}">`;
    for(const k of keys){const rec=ALCHEMY[k];if(rec)opts+=`<option value="${k}">${rec.name}</option>`;}
    opts+=`</optgroup>`;
  }
  return opts;
}
window.addIntermRow=()=>{
  const list=document.getElementById('intermList');if(!list)return;
  const rid=++intermRowId;
  const row=document.createElement('div');
  row.className='interm-row';row.id=`irow_${rid}`;
  row.innerHTML=`
    <div class="interm-sel-wrap">
      <select class="interm-sel" onchange="calcOpt()">${makeIntermOptions()}</select>
    </div>
    <div class="interm-qty-wrap">
      <input class="interm-qty" type="number" inputmode="numeric" placeholder="보유 수량 (개)" oninput="calcOpt()">
    </div>
    <button class="del-btn" onclick="document.getElementById('irow_${rid}').remove();calcOpt()">✕</button>`;
  list.appendChild(row);
  // 셀렉트에 CDD 적용
  initOneCdd(row.querySelector('select.interm-sel'));
  saveAll();
};



/* ════════════════════════════════════════
   ⑩ 자동채우기 (DEFAULT_PRICES 기반)
════════════════════════════════════════ */
// ── 자동채우기 ──
window.autoFill=()=>{
  if(!DEFAULT_PRICES)return;
  const fill=(id,val)=>{if(!val||val<=0)return;const e=document.getElementById(id);if(e&&(!e.value||+e.value===0)){e.value=Math.round(val);e.dispatchEvent(new Event('input'));}};
  // 어패류
  fill('price_sf_1', DEFAULT_PRICES.seafood.tier1);
  fill('price_sf_2', DEFAULT_PRICES.seafood.tier2);
  fill('price_sf_3', DEFAULT_PRICES.seafood.tier3);
  // 바닐라 재료
  for(const[k,v]of Object.entries(DEFAULT_PRICES.vanilla||{})){
    if(v>0)fill(`vprice_${k}`,v);
  }
  onPriceChange();
};


/* ════════════════════════════════════════
   ⑪ localStorage 저장·불러오기
   KEY: ocean_calc_v4
   저장 항목: 스킬, 각인석, 낚싯대, 스태미나,
             어패류·바닐라 단가, 보유 어패류,
             보유 중간재료 행(__irows)
════════════════════════════════════════ */
const KEY='ocean_calc_v4';
function getStaticIds(){
  return['skillFurnace','skillCraftBonus','skillAlchBonus','skillDeepHarvest','skillStarBonus','skillClamBonus',
    'engClamSearch','engSeafoodLuck','engFisherRoulette','rodLevel','totalStamina',
    'price_sf_1','price_sf_2','price_sf_3',  // ← 어패류 단가
    ...Object.keys(VANILLA_META).map(k=>`vprice_${k}`),
    ...SF_TYPES.flatMap(sf=>SF_TIERS.map(t=>`have_${sf}_${t}`))];
}
function saveAll(){
  const d={};
  getStaticIds().forEach(id=>{const e=document.getElementById(id);if(e)d[id]=e.value;});
  // 중간재료 행
  const irows=[];
  document.querySelectorAll('.interm-row').forEach(row=>{
    const sel=row.querySelector('select.interm-sel');
    const inp=row.querySelector('input.interm-qty');
    irows.push({key:sel?.value||'',qty:inp?.value||''});
  });
  d.__irows=irows;
  localStorage.setItem(KEY,JSON.stringify(d));
}
function loadAll(){
  try{
    const d=JSON.parse(localStorage.getItem(KEY)||'{}');
    getStaticIds().forEach(id=>{const e=document.getElementById(id);if(e&&d[id]!==undefined)e.value=d[id];});
    if(Array.isArray(d.__irows)){
      d.__irows.forEach(({key,qty})=>{
        addIntermRow();
        const list=document.getElementById('intermList');
        const row=list?.lastElementChild;if(!row)return;
        const sel=row.querySelector('select.interm-sel');
        if(sel&&key){
          sel.value=key;
          const cdd=sel.previousElementSibling;
          if(cdd?.classList.contains('cdd')){
            const lbl=cdd.querySelector('.cdd-label');
            if(lbl)lbl.textContent=sel.options[sel.selectedIndex]?.text||'';
          }
        }
        const inp=row.querySelector('input.interm-qty');if(inp)inp.value=qty;
      });
    }
  }catch(e){}
}



/* ════════════════════════════════════════
   ⑫ 스킬·각인석 패널 토글
════════════════════════════════════════ */
window.toggleSkillPanel=()=>document.getElementById('skillPanel').classList.toggle('collapsed');
window.toggleEngPanel  =()=>document.getElementById('engPanel').classList.toggle('collapsed');
window.calcOpt=calcOpt; // oninput/onclick에서 직접 호출됨


/* ════════════════════════════════════════
   ⑬ 초기화
════════════════════════════════════════ */
window.resetAll=()=>{
  if(!confirm('초기화할까요?'))return;
  localStorage.removeItem(KEY);
  getStaticIds().forEach(id=>{const e=document.getElementById(id);if(!e)return;if(e.tagName==='SELECT')e.selectedIndex=0;else e.value='';});
  document.getElementById('intermList').innerHTML='';
  intermRowId=0;
  syncDropdownLabels();onSkillChange();
};



/* ════════════════════════════════════════
   ⑭ 커스텀 드롭다운 (cdd-ready 방식)
   - initOneCdd: select → 커스텀 드롭다운 변환
   - syncDropdownLabels: 로드 후 레이블 동기화
   - optgroup 지원 (중간재료 선택)
════════════════════════════════════════ */
// ── 커스텀 드롭다운 ──
function initOneCdd(sel){
  if(!sel||sel.previousElementSibling?.classList.contains('cdd'))return;
  const cdd=document.createElement('div');cdd.className='cdd';
  const trigger=document.createElement('div');trigger.className='cdd-trigger';
  const label=document.createElement('span');label.className='cdd-label';label.textContent=sel.options[sel.selectedIndex]?.text||'';
  const arrow=document.createElement('span');arrow.className='cdd-arrow';arrow.textContent='▼';
  trigger.appendChild(label);trigger.appendChild(arrow);
  const menu=document.createElement('div');menu.className='cdd-menu';
  // optgroup 포함한 select 처리
  Array.from(sel.children).forEach(child=>{
    if(child.tagName==='OPTGROUP'){
      const grpLabel=document.createElement('div');
      grpLabel.style.cssText='padding:4px 8px;font-size:10px;color:var(--muted);font-weight:700;background:var(--bg);border-bottom:1px solid var(--bdr)';
      grpLabel.textContent=child.label;
      menu.appendChild(grpLabel);
      Array.from(child.children).forEach(opt=>{
        const item=document.createElement('div');
        item.className='cdd-item'+(sel.value===opt.value?' selected':'');
        item.style.paddingLeft='14px';
        item.textContent=opt.text;item.dataset.value=opt.value;
        item.addEventListener('click',()=>{sel.value=opt.value;label.textContent=opt.text;menu.querySelectorAll('.cdd-item').forEach(el=>el.classList.remove('selected'));item.classList.add('selected');cdd.classList.remove('open');sel.dispatchEvent(new Event('change',{bubbles:true}));});
        menu.appendChild(item);
      });
    } else if(child.tagName==='OPTION'){
      const item=document.createElement('div');
      item.className='cdd-item'+(sel.value===child.value?' selected':'');
      item.textContent=child.text;item.dataset.value=child.value;
      item.addEventListener('click',()=>{sel.value=child.value;label.textContent=child.text;menu.querySelectorAll('.cdd-item').forEach(el=>el.classList.remove('selected'));item.classList.add('selected');cdd.classList.remove('open');sel.dispatchEvent(new Event('change',{bubbles:true}));});
      menu.appendChild(item);
    }
  });
  trigger.addEventListener('click',e=>{e.stopPropagation();const isOpen=cdd.classList.contains('open');document.querySelectorAll('.cdd.open').forEach(el=>el.classList.remove('open'));if(!isOpen)cdd.classList.add('open');});
  cdd.appendChild(trigger);cdd.appendChild(menu);sel.parentNode.insertBefore(cdd,sel);sel.classList.add('cdd-ready');
}
function syncDropdownLabels(){
  document.querySelectorAll('.skrow select,.field select').forEach(sel=>{
    const cdd=sel.previousElementSibling;if(!cdd?.classList.contains('cdd'))return;
    const lbl=cdd.querySelector('.cdd-label');if(lbl)lbl.textContent=sel.options[sel.selectedIndex]?.text||'';
    cdd.querySelectorAll('.cdd-item').forEach(item=>item.classList.toggle('selected',item.dataset.value===sel.value));
  });
}
document.addEventListener('click',e=>{if(!e.target.closest('.cdd'))document.querySelectorAll('.cdd.open').forEach(el=>el.classList.remove('open'));});



/* ════════════════════════════════════════
   ⑮ 초기화 — DOMContentLoaded
   실행 순서:
   1. 동적 UI 빌드 (바닐라 시세, 보유 어패류)
   2. localStorage 불러오기
   3. 커스텀 드롭다운 초기화
   4. 스킬 정보 표시 갱신
   5. 연금품 판매가 목록 빌드
   6. 저장 이벤트 바인딩
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded',()=>{
  buildVanillaPriceGrid();
  buildHaveSeafoodGrid();
  loadAll();
  document.querySelectorAll('.skrow select,.field select,.interm-sel-wrap select').forEach(sel=>initOneCdd(sel));
  syncDropdownLabels();
  onSkillChange();
  buildAlchPriceList();
  const titleEl=document.getElementById('pageTabTitle');if(titleEl)titleEl.textContent=TAB_TITLES[0];
  document.title=`해양 계산기 — ${TAB_TITLES[0]}`;
  getStaticIds().forEach(id=>{const e=document.getElementById(id);if(!e)return;e.addEventListener(e.tagName==='SELECT'?'change':'input',saveAll);});
  document.querySelectorAll('#haveSeafoodGrid input').forEach(inp=>inp.addEventListener('input',saveAll));
});