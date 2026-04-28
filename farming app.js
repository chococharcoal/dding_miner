import {
  SKILLS, ENGRAVING, HOE, FARMING, BASES, CROPS, MILKY_PRICES,
  RECIPES, OTHER_META, GRADE_COLOR, DEFAULT_PRICES, UNITS, PROCESSED_RECIPES,
} from './farming%20config.js';

const { SET_SIZE, BOX_SIZE } = UNITS;
const Z80 = 0.842;
const f   = n => Math.round(n).toLocaleString('ko-KR');
const fd  = (n, d=2) => +n.toFixed(d) === Math.round(+n.toFixed(d)) ? Math.round(n).toString() : n.toFixed(d).replace(/\.?0+$/,'');
const gi  = id => { const e=document.getElementById(id); return e ? Math.max(0,+e.value||0) : 0; };
const gv  = id => { const e=document.getElementById(id); return e ? e.value : ''; };

function fmtQty(n) {
  n = Math.floor(n); if (n<=0) return '0개';
  const boxes=Math.floor(n/BOX_SIZE), rem=n%BOX_SIZE, sets=Math.floor(rem/SET_SIZE), items=rem%SET_SIZE;
  return [[boxes,'상자'],[sets,'세트'],[items,'개']].filter(([v])=>v>0).map(([v,u])=>v+u).join(' ')||'0개';
}
function parseQty(str) {
  if (!str?.trim()) return 0;
  if (/^\d+$/.test(str.trim())) return Math.max(0,parseInt(str.trim(),10));
  let t=0;
  const bm=str.match(/(\d+)\s*상자/); if(bm) t+=parseInt(bm[1],10)*BOX_SIZE;
  const sm=str.match(/(\d+)\s*세트/); if(sm) t+=parseInt(sm[1],10)*SET_SIZE;
  const im=str.match(/(\d+)\s*개/);   if(im) t+=parseInt(im[1],10);
  return t;
}
function readSplitQty(id) {
  const box = parseInt(document.getElementById(id+'_box')?.value||'0')||0;
  const set = parseInt(document.getElementById(id+'_set')?.value||'0')||0;
  const ea  = parseInt(document.getElementById(id+'_ea') ?.value||'0')||0;
  return box*BOX_SIZE + set*SET_SIZE + ea;
}
function splitQtyHtml(id, color) {
  const c = color || 'var(--muted)';
  return '<div class="split-qty-wrap">'
    + '<div><span class="sq-label">상자</span><input id="'+id+'_box" type="number" inputmode="numeric" placeholder="0" min="0" class="sq-input" oninput="onDishQtyInput('+id.replace(/\D/g,'')+')" /></div>'
    + '<div><span class="sq-label">세트</span><input id="'+id+'_set" type="number" inputmode="numeric" placeholder="0" min="0" class="sq-input" oninput="onDishQtyInput('+id.replace(/\D/g,'')+')" /></div>'
    + '<div><span class="sq-label">개</span><input id="'+id+'_ea" type="number" inputmode="numeric" placeholder="0" min="0" class="sq-input" oninput="onDishQtyInput('+id.replace(/\D/g,'')+')" /></div>'
    + '</div><div id="'+id+'_p" class="sq-parsed"></div>';
}

const TAB_TITLES=['하루 수익 예상','재료 시세 입력','요리 효율','재료 계산기'];
window.sw=(i,el)=>{
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  [0,1,2,3].forEach(k=>{const p=document.getElementById('t'+k);if(p)p.style.display='none';});
  el.classList.add('on');
  document.getElementById('t'+i).style.display='block';
  const t=document.getElementById('pageTabTitle'); if(t) t.textContent=TAB_TITLES[i];
  document.title=`재배 계산기 — ${TAB_TITLES[i]}`;
};

function getSK() {
  const fl=gi('skillFurnace'),ml=gi('skillMoneyBonus'),pl=gi('skillFullPot');
  const ng=gi('skillNatureGift'),hb=gi('skillHarvestBonus'),sd=gi('skillSeedDrop'),fh=gi('skillFireHoe');
  const kc=gi('skillKingCrop'); // 대왕작물 스킬 레벨
  const ngD=SKILLS.NATURE_GIFT.drops[ng]||{pct:0,count:0};
  const hbD=SKILLS.HARVEST_BONUS.drops[hb]||{pct:0,count:0};
  const fhD=SKILLS.FIRE_HOE.drops[fh]||{pct:0,count:0};
  // 대왕작물 확률: 스킬 레벨에 따라 결정 (%)
  const kingCropPct = SKILLS.KING_CROP.pct[kc] ?? FARMING.KING_CROP_BASE_PCT;
  return {
    fr:(SKILLS.FURNACE.reductionPct[fl]??0)/100,
    mb:(SKILLS.MONEY_BONUS.bonusPct[ml]??0)/100,
    fp:(SKILLS.FULL_POT.bonusPct[pl]??0)/100,
    ngPct:ngD.pct,ngCnt:ngD.count,
    hbPct:hbD.pct,hbCnt:hbD.count,
    sdPct:SKILLS.SEED_DROP.pct[sd]??0,
    fhPct:fhD.pct,fhCnt:fhD.count,
    kingCropPct, // 대왕작물 등장 확률 (%)
    fl,ml,pl,ng,hb,sd,fh,kc,
  };
}
function getENG() {
  const sl=gi('engSeedLuck'),cb=gi('engCropBox'),fr=gi('engFarmerRoulette');
  const slD=ENGRAVING.SEED_LUCK.drops[sl]||{pct:0,count:0};
  return {
    slPct:slD.pct,slCnt:slD.count,
    cbPct:ENGRAVING.CROP_BOX.pct[cb]??0,cbAvg:ENGRAVING.CROP_BOX.avgSeeds,
    frPct:ENGRAVING.FARMER_ROULETTE.dicePct[fr]??0,
    sl,cb,fr,
  };
}

window.onSkillChange=()=>{
  const st=(id,txt)=>{const e=document.getElementById(id);if(e)e.textContent=txt;};
  const {fl,ml,pl,ng,hb,sd,fh,kc}=getSK();
  st('infoFurnace',    fl===0?'기본':`Lv${fl} — -${SKILLS.FURNACE.reductionPct[fl]}%`);
  st('infoMoneyBonus', ml===0?'기본':`Lv${ml} — +${SKILLS.MONEY_BONUS.bonusPct[ml]}%`);
  st('infoFullPot',    pl===0?'기본':`Lv${pl} — +${SKILLS.FULL_POT.bonusPct[pl]}%`);
  const ngD=SKILLS.NATURE_GIFT.drops[ng];
  st('infoNatureGift', ng===0?'기본':ngD?`Lv${ng} — ${ngD.pct}%/${ngD.count}개`:'');
  const hbD=SKILLS.HARVEST_BONUS.drops[hb];
  st('infoHarvestBonus',hb===0?'기본':hbD?`Lv${hb} — ${hbD.pct}%/${hbD.count}개`:'');
  st('infoSeedDrop',   sd===0?'기본':`Lv${sd} — ${SKILLS.SEED_DROP.pct[sd]}%`);
  const fhD=SKILLS.FIRE_HOE.drops[fh];
  st('infoFireHoe',    fh===0?'기본':fhD?`Lv${fh} — ${fhD.pct}%/${fhD.count}개`:'');
  st('infoKingCrop',   `Lv${kc} — ${SKILLS.KING_CROP.pct[kc]}%`);
  calcDaily(); calcDishEff(); calcMats();
};
window.onEngChange=()=>{
  const st=(id,txt)=>{const e=document.getElementById(id);if(e)e.textContent=txt;};
  const {sl,cb,fr}=getENG();
  const slD=ENGRAVING.SEED_LUCK.drops[sl];
  st('infoSeedLuck',      sl===0?'없음':slD?`${slD.pct}%/+${slD.count}개`:'');
  st('infoCropBox',       cb===0?'없음':`${ENGRAVING.CROP_BOX.pct[cb]}% 작물상자`);
  st('infoFarmerRoulette',fr===0?'없음':`${ENGRAVING.FARMER_ROULETTE.dicePct[fr]}% 룰렛`);
  calcDaily(); calcMats();
};
window.onPriceChange=()=>{calcDaily();calcDishEff();calcMats();};

function getPrices() {
  // 건초더미 64개 가격 → 밀 1개 가격 (건초더미 1개 = 밀 9개)
  const hayPerSet = gi('pHay'); // 건초더미 64개 가격
  const wheatUnit = hayPerSet > 0 ? (hayPerSet / SET_SIZE) / 9 : 0; // 밀 1개 가격

  return {
    seed:{tomato:gi('pSeedTomato')/SET_SIZE,onion:gi('pSeedOnion')/SET_SIZE,garlic:gi('pSeedGarlic')/SET_SIZE},
    crops:{
      pumpkin:gi('pCropPumpkin')/SET_SIZE,potato:gi('pCropPotato')/SET_SIZE,
      carrot:gi('pCropCarrot')/SET_SIZE,beet:gi('pCropBeet')/SET_SIZE,
      watermelon:gi('pCropWatermelon')/SET_SIZE,sweetfruit:gi('pCropSweetfruit')/SET_SIZE,
      sugar:gi('pCropSugar')/SET_SIZE, // 설탕 큐브 (작물 묶음)
    },
    milky:{salt:MILKY_PRICES.salt,egg:MILKY_PRICES.egg,milk:MILKY_PRICES.milk,oil:MILKY_PRICES.oil},
    wheat: wheatUnit, // 밀 1개 가격 (건초더미에서 역산)
    // 기타 재료: 세트당 입력 → 개당으로 변환
    other:{
      coconut:gi('pCoconut')/SET_SIZE,pineapple:gi('pPineapple')/SET_SIZE,
      steak:gi('pSteak')/SET_SIZE,
      pork:gi('pPork')/SET_SIZE,pork_belly:gi('pPorkBelly')/SET_SIZE,pork_front:gi('pPorkFront')/SET_SIZE,
      lamb:gi('pLamb')/SET_SIZE,lamb_rib:gi('pLambRib')/SET_SIZE,lamb_leg:gi('pLambLeg')/SET_SIZE,
      chicken:gi('pChicken')/SET_SIZE,chicken_leg:gi('pChickenLeg')/SET_SIZE,chicken_breast:gi('pChickenBreast')/SET_SIZE,
      beef_sirloin:gi('pBeefSirloin')/SET_SIZE,beef_rib:gi('pBeefRib')/SET_SIZE,
    },
  };
}

// ── 중간 재료 1개당 원가 계산 ──
// PROCESSED_RECIPES 레시피 기반으로 밀키 고정가 + 밀(건초더미) 가격으로 계산
function calcProcessedCost(key, prices) {
  const rec = PROCESSED_RECIPES[key];
  if (!rec) return 0;
  let cost = 0;
  for (const [mat, qty] of Object.entries(rec.ingredients)) {
    if (mat === 'wheat') {
      cost += qty * prices.wheat; // 밀: 건초더미에서 역산
    } else {
      cost += qty * (prices.milky[mat] || 0); // 밀키 고정가
    }
  }
  return cost;
}

// ── 베이스 1개 원가 계산 (씨앗은덤 재순환 반영) ──
function calcBaseUnitCost(seedType, prices, sk) {
  const hr   = FARMING.HARVEST_RANGE[seedType];
  const kpct = ((sk?.kingCropPct ?? sk) ?? FARMING.KING_CROP_BASE_PCT) / 100;

  // 씨앗 1개 심기당 평균 작물 (대왕작물 포함)
  const baseAvg = (hr.min + hr.max) / 2;
  const avgCropsPerSeed = baseAvg * (1 - kpct) + baseAvg * FARMING.KING_CROP_MULT * kpct;

  // 풍년이다! 추가 작물
  const harvestBonus = sk?.hbPct != null ? sk.hbPct / 100 * sk.hbCnt : 0;
  const totalCropsPerPlant = avgCropsPerSeed + harvestBonus;

  // 씨앗은덤 재순환 배율
  const p = sk?.sdPct != null ? Math.min(sk.sdPct / 100, 0.99) : 0;
  const multiplier = p > 0 ? 1 / (1 - p) : 1;

  // 베이스 1개 = 작물 8개
  // 씨앗 n개 심으면 총 작물 = n × multiplier × totalCropsPerPlant
  // 목표: 8개 → 필요 씨앗 = 8 / (multiplier × totalCropsPerPlant)
  const seedsPerBase = FARMING.CROPS_PER_BASE / (multiplier * totalCropsPerPlant);
  return seedsPerBase * (prices.seed[seedType] || 0);
}

// ── 요리 1개 재료비 계산 ──
function calcRecipeCost(rec, prices, sk, includeBaseCost=true) {
  const kingCropPct = typeof sk === 'object' && sk !== null ? sk.kingCropPct : sk;
  let cost = 0;
  // 베이스 원가 (토글 꺼지면 0)
  if (includeBaseCost) {
    for (const [k, q] of Object.entries(rec.materials.base || {})) {
      const seedType = BASES[k]?.seedType || k;
      cost += q * calcBaseUnitCost(seedType, prices, sk);
    }
  }
  // 작물 묶음: q개 × 개당 가격 (prices.crops[k]는 이미 개당)
  for (const [k, q] of Object.entries(rec.materials.crops || {}))
    cost += q * (prices.crops[k] || 0);
  // 밀키 고정가 재료
  for (const [k, q] of Object.entries(rec.materials.milky || {}))
    cost += q * (prices.milky[k] || 0);
  // 기타 재료: 중간재료(가공품)는 원가 계산, 일반 재료는 입력가
  for (const [k, q] of Object.entries(rec.materials.other || {})) {
    if (PROCESSED_RECIPES[k]) {
      cost += q * calcProcessedCost(k, prices);
    } else {
      cost += q * (prices.other[k] || 0);
    }
  }
  return cost;
}

/* TAB 0: 하루 수익 (채집) */
window.calcDaily=()=>{
  const sk=getSK(),eng=getENG();
  const hoeLevel=gi('hoeLevel'),stamina=gi('totalStamina');
  const hoe=HOE[hoeLevel]??HOE[0];
  const harvestCount=stamina>0?Math.floor(stamina/FARMING.STAMINA_PER_USE):0;
  if(harvestCount===0){document.getElementById('dailyRes').innerHTML='<div class="empty-msg">스태미나를 입력하면 계산됩니다</div>';return;}

  const natureExtra  =sk.ngPct/100*sk.ngCnt;
  const seedLuckExtra=eng.slPct/100*eng.slCnt;
  const cropBoxExtra =eng.cbPct/100*eng.cbAvg;
  const avgDice=3.5;
  const rouletteExtra=eng.frPct/100*(0.9*avgDice*ENGRAVING.FARMER_ROULETTE.normalMult+0.1*avgDice*ENGRAVING.FARMER_ROULETTE.goldenMult);
  const seedPerHarvest=hoe.seedDrop+natureExtra+seedLuckExtra+cropBoxExtra+rouletteExtra;
  const totalSeeds=harvestCount*seedPerHarvest;
  const basePerHarvest=sk.fhPct/100*sk.fhCnt;
  const totalHarvestBase=harvestCount*basePerHarvest;

  const ps=getPrices().seed;
  const filled=Object.values(ps).filter(v=>v>0);
  const avgSeedUnit=filled.length?filled.reduce((a,b)=>a+b,0)/filled.length:0;
  const seedRev=totalSeeds*avgSeedUnit;

  const parts=[];
  if(hoe.seedDrop>0)  parts.push(`괭이 ${hoe.seedDrop}`);
  if(natureExtra>0)   parts.push(`자연선물 +${fd(natureExtra)}`);
  if(seedLuckExtra>0) parts.push(`씨앗행운 +${fd(seedLuckExtra)}`);
  if(cropBoxExtra>0)  parts.push(`작물상자 +${fd(cropBoxExtra)}`);
  if(rouletteExtra>0) parts.push(`룰렛 +${fd(rouletteExtra)}`);

  document.getElementById('dailyRes').innerHTML=`
  <div class="rsec">
    <div class="rsec-title">🌱 씨앗 획득</div>
    <div class="rrow"><span class="rl">채집 횟수</span><span class="rv">${f(harvestCount)}회 <small style="color:var(--muted)">(${f(stamina)}÷7)</small></span></div>
    <div class="rrow"><span class="rl">회당 씨앗 기댓값</span><span class="rv">${fd(seedPerHarvest)}개 <small style="color:var(--muted)">${parts.join(' / ')}</small></span></div>
    <div class="rrow rrow-strong"><span class="rl" style="font-weight:900">총 씨앗</span><span class="rv g" style="font-size:15px">${fmtQty(totalSeeds)}</span></div>
    ${avgSeedUnit>0?`<div class="rrow"><span class="rl" style="font-size:11px;color:var(--muted)">씨앗 전량 판매 추정</span><span class="rv" style="font-size:11px;color:var(--muted)">${f(seedRev)}원</span></div>`:''}
  </div>
  ${totalHarvestBase>0.01?`<div class="rsec"><div class="rsec-title">🫙 베이스 (불붙은 괭이)</div><div class="rrow rrow-strong"><span class="rl" style="font-weight:900">총 베이스</span><span class="rv" style="font-size:15px">${fd(totalHarvestBase)}개</span></div></div>`:''}
  <div class="result-box"><div style="display:flex;gap:0;align-items:stretch">
    <div style="flex:1;text-align:center;padding:4px 8px"><div class="rb-label">총 획득 씨앗</div><div class="rb-value">${fmtQty(totalSeeds)}</div></div>
    ${seedRev>0?`<div style="width:1px;background:var(--bdr2);margin:4px 0;flex:none"></div><div style="flex:1;text-align:center;padding:4px 8px"><div class="rb-label">씨앗 전량 판매</div><div class="rb-value" style="font-size:18px">${f(seedRev)}원</div></div>`:''}
  </div></div>`;
};

/* TAB 2: 요리 효율 */
window.calcDishEff=()=>{
  const sk=getSK(),prices=getPrices(),totalBonus=sk.mb+sk.fp;
  const includeBaseCost = document.getElementById('includBaseCoast')?.checked ?? false;

  const results=Object.entries(RECIPES).map(([key,rec])=>{
    const inputPrice = rec.currentPrice > 0 ? rec.currentPrice : 0;
    const skillSellPrice = inputPrice > 0 ? Math.round(inputPrice * (1 + totalBonus)) : 0;
    const cost = calcRecipeCost(rec, prices, sk, includeBaseCost);
    const net = skillSellPrice > 0 ? skillSellPrice - cost : null;
    return { key, rec, inputPrice, skillSellPrice, cost, net };
  }).sort((a, b) => {
    if (a.net === null && b.net === null) return 0;
    if (a.net === null) return 1;
    if (b.net === null) return -1;
    return b.net - a.net;
  });

  const html = results.map((r, i) => {
    const hasPrice = r.net !== null;
    const rankClass = !hasPrice ? '' : i===0?'top1':i===1?'top2':i===2?'top3':'';
    const rankBadge = !hasPrice ? '' :
      i===0?`<span class="dish-rank rank-gold">🥇 1위</span>`:
      i===1?`<span class="dish-rank rank-silver">🥈 2위</span>`:
      i===2?`<span class="dish-rank rank-bronze">🥉 3위</span>`:'';

    const gradeColors = {
      common: { label:'커먼', color:'#8a7060', bg:'#f7f3ee' },
      normal: { label:'노멀', color:'#3a9e68', bg:'#edf8f2' },
      rare:   { label:'레어', color:'#3d6fd4', bg:'#eef3fd' },
      epic:   { label:'에픽', color:'#d94f3d', bg:'#fef0ee' },
    };
    const gd = gradeColors[r.rec.grade];
    const gradeBdg = `<span class="grade-bdg" style="background:${gd.bg};color:${gd.color};border:1px solid ${gd.color}">${gd.label}</span>`;

    let matChips = '';
    // 베이스 칩 (씨앗은덤·대왕작물·풍년이다 반영 원가)
    for (const [k, q] of Object.entries(r.rec.materials.base || {})) {
      const seedType = BASES[k]?.seedType || k;
      const bc = BASES[k]?.color || '#888';
      let costTxt = '';
      if (includeBaseCost) {
        const baseCost = q * calcBaseUnitCost(seedType, prices, sk);
        costTxt = prices.seed[seedType] > 0
          ? ` <span style="opacity:.7;font-size:9px">(${f(Math.round(baseCost))}원)</span>`
          : ` <span style="opacity:.5;font-size:9px">씨앗가 미입력</span>`;
      }
      matChips += `<span class="mat-chip" style="color:${bc};border-color:${bc}44">${BASES[k]?.name||k}${q>1?` ×${q}`:''}${costTxt}</span>`;
    }
    // 작물 묶음 칩 (×1 표시 생략)
    for (const [k, q] of Object.entries(r.rec.materials.crops || {})) {
      const cc = CROPS[k]?.color || '#888';
      matChips += `<span class="mat-chip" style="color:${cc};border-color:${cc}44">${CROPS[k]?.name||k}${q>1?` ×${q}`:''}</span>`;
    }
    // 밀키 재료 칩
    for (const [k, q] of Object.entries(r.rec.materials.milky || {})) {
      const names = {salt:'소금',egg:'달걀',milk:'우유',oil:'오일'};
      matChips += `<span class="mat-chip" style="color:#6090a8;border-color:#6090a844">${names[k]||k}${q>1?` ×${q}`:''}</span>`;
    }
    // 기타 재료 칩 (중간재료 원가 표시, 고기류 색상 적용)
    for (const [k, q] of Object.entries(r.rec.materials.other || {})) {
      const meta = OTHER_META[k] || { name: k, color: '#888' };
      const chipColor = meta.color || '#888';
      if (PROCESSED_RECIPES[k]) {
        const procCost = q * calcProcessedCost(k, prices);
        const costTxt = ` <span style="opacity:.7;font-size:9px">(${f(Math.round(procCost))}원)</span>`;
        matChips += `<span class="mat-chip" style="color:${chipColor};border-color:${chipColor}44">${meta.name}${q>1?` ×${q}`:''}${costTxt}</span>`;
      } else {
        matChips += `<span class="mat-chip" style="color:${chipColor};border-color:${chipColor}44">${meta.name}${q>1?` ×${q}`:''}</span>`;
      }
    }

    const bonusTxt = totalBonus > 0 ? ` +${Math.round(totalBonus*100)}% 스킬 적용` : '';
    const priceInfo = hasPrice
      ? `판매가 ${f(r.inputPrice)}원 → 스킬 적용 ${f(r.skillSellPrice)}원${bonusTxt}<br>총 재료비 ${f(Math.round(r.cost))}원 · 범위 ${f(r.rec.priceMin)}~${f(r.rec.priceMax)}원`
      : `판매가 미입력 · 범위 ${f(r.rec.priceMin)}~${f(r.rec.priceMax)}원<br>총 재료비 ${f(Math.round(r.cost))}원`;

    return `<div class="dish-card ${rankClass}">
      ${rankBadge}
      <div class="dish-head">
        <div style="min-width:0">
          <div class="dish-name" style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">${r.rec.name} ${gradeBdg}</div>
          <div class="dish-detail">${priceInfo}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          ${hasPrice
            ? `<div class="dish-net ${r.net>=0?'pos':'neg'}">${r.net>=0?'+':''}${f(Math.round(r.net))}원</div><div style="font-size:10px;color:var(--muted)">개당 순이익</div>`
            : `<div style="font-size:11px;color:var(--muted);font-weight:700">판매가<br>미입력</div>`}
        </div>
      </div>
      <div class="dish-mats">${matChips}</div>
    </div>`;
  }).join('');
  document.getElementById('dishEffRes').innerHTML = html || '<div class="empty-msg">데이터 없음</div>';
};

/* TAB 3: 재료 계산기
   씨앗 재순환 계산:
   - 씨앗은덤 확률 p → 씨앗 1개 심으면 p개 반환 → 그걸 또 심으면 p²개 반환...
   - 총 심기 배율 = 1 + p + p² + ... = 1/(1-p)  (등비급수, p<1 이면 수렴)
   - 풍년이다·대왕작물도 매 라운드 동일 적용
   - 총 작물 = 심기1회당_평균작물 × 총심기횟수
   - 총 심기횟수 = 최초씨앗수 × (1/(1-p))
*/
function calcSeedsNeeded(targetBase, seedType, sk) {
  if (targetBase <= 0) return { avg: 0, safe80: 0, multiplier: 1 };

  const hr   = FARMING.HARVEST_RANGE[seedType];
  const kpct = (sk.kingCropPct ?? FARMING.KING_CROP_BASE_PCT) / 100; // 대왕작물 확률 적용

  // 씨앗 1개 심기당 평균 작물 (대왕작물 포함)
  const baseAvgCrops   = (hr.min + hr.max) / 2;
  const avgCropsPerSeed = baseAvgCrops * (1 - kpct) + baseAvgCrops * FARMING.KING_CROP_MULT * kpct;

  // 풍년이다! 추가 작물 (기댓값)
  const harvestBonus = sk.hbPct / 100 * sk.hbCnt;
  const totalCropsPerPlant = avgCropsPerSeed + harvestBonus;

  // 씨앗은덤 확률 p (0~1)
  const p = sk.sdPct / 100;
  // 재순환 배율: 씨앗 1개 심으면 총 몇 번 심기가 발생하나
  // p >= 1 이면 무한 → 실용적으로 0.99로 cap
  const pCapped    = Math.min(p, 0.99);
  const multiplier = 1 / (1 - pCapped); // 등비급수 합

  // 목표 작물 수 = targetBase × 8
  const targetCrops = targetBase * FARMING.CROPS_PER_BASE;

  // 최초 씨앗 n개 심으면 총 심기 = n × multiplier
  // 총 작물 = n × multiplier × totalCropsPerPlant = targetCrops
  // → n = targetCrops / (multiplier × totalCropsPerPlant)
  const avgSeeds = targetCrops / (multiplier * totalCropsPerPlant);

  // 80% 보정: 수확 분산 반영
  // 1회 심기당 작물 분산 (균등분포 + 풍년이다 이항분포)
  const varPerPlant = Math.pow(hr.max - hr.min, 2) / 12
    + harvestBonus * (1 - harvestBonus / totalCropsPerPlant); // 근사
  // 총 심기횟수 n×multiplier에 대한 총 분산
  // std_total ≈ sqrt(n × multiplier) × sqrt(varPerPlant)
  // 필요 씨앗 std: std_seeds ≈ avgSeeds × sqrt(varPerPlant) / (totalCropsPerPlant × sqrt(n×multiplier))
  // 단순화: cv(변동계수) = sqrt(varPerPlant) / totalCropsPerPlant / sqrt(n×multiplier)
  // 80% 보정값 = avgSeeds + Z80 × std_seeds
  const totalPlants = avgSeeds * multiplier;
  const stdCrops    = Math.sqrt(totalPlants * varPerPlant);
  const stdSeeds    = stdCrops / (multiplier * totalCropsPerPlant);
  const safe80      = avgSeeds + Z80 * stdSeeds;

  return {
    avg:        Math.ceil(avgSeeds),
    safe80:     Math.ceil(safe80),
    multiplier, // 재순환 배율 (표시용)
    p,
  };
}

let rowId=0;
function makeDishSelectOptions(){
  return Object.entries(RECIPES).map(([key,rec])=>{
    const gd=GRADE_COLOR[rec.grade];
    return`<option value="${key}">[${gd.label}] ${rec.name}</option>`;
  }).join('');
}
window.addDishRow=()=>{
  const list=document.getElementById('dishPickerList');if(!list)return;
  const rid=++rowId;
  const row=document.createElement('div');
  row.className='dish-picker-row';row.id=`drow_${rid}`;
  row.innerHTML=
    '<div class="dish-sel-wrap">'
    +  '<select id="dsel_'+rid+'" onchange="calcMats();saveAll()">'
    +    '<option value="">요리 선택</option>'+makeDishSelectOptions()
    +  '</select>'
    +'</div>'
    +'<div class="dish-qty-wrap">'
    +  '<div class="split-qty-wrap">'
    +    '<div><span class="sq-label">상자</span><input id="dqty_'+rid+'_box" type="number" inputmode="numeric" placeholder="0" min="0" class="sq-input" oninput="onDishQtyInput('+rid+')"></div>'
    +    '<div><span class="sq-label">세트</span><input id="dqty_'+rid+'_set" type="number" inputmode="numeric" placeholder="0" min="0" class="sq-input" oninput="onDishQtyInput('+rid+')"></div>'
    +    '<div><span class="sq-label">개</span><input id="dqty_'+rid+'_ea"  type="number" inputmode="numeric" placeholder="0" min="0" class="sq-input" oninput="onDishQtyInput('+rid+')"></div>'
    +  '</div>'
    +  '<div class="dish-qty-parsed" id="dqtyp_'+rid+'"></div>'
    +'</div>'
    +'<button class="del-dish-btn" onclick="delDishRow('+rid+')">✕</button>';
  list.appendChild(row);
  initOneCdd(document.getElementById(`dsel_${rid}`));
  saveAll();
};
window.delDishRow=(rid)=>{const row=document.getElementById('drow_'+rid);if(row){row.remove();calcMats();saveAll();}};
window.onDishQtyInput=(rid)=>{
  const n = readSplitQty('dqty_'+rid);
  const pars=document.getElementById('dqtyp_'+rid);
  if(pars)pars.textContent=n>0?`총 ${f(n)}개`:'';
  calcMats();saveAll();
};
window.onBaseQtyInput=(type)=>{
  const n = readSplitQty('haveBase'+type.charAt(0).toUpperCase()+type.slice(1));
  const p = document.getElementById('haveBase'+type.charAt(0).toUpperCase()+type.slice(1)+'_p');
  if(p) p.textContent = n>0?`총 ${f(n)}개`:'';
  calcMats();saveAll();
};

window.calcMats=()=>{
  const sk=getSK();
  const prices=getPrices();
  // 요리별 필요량 집계
  const needBase={tomato:0,onion:0,garlic:0};
  const needCrops={};   // 작물 묶음
  const needMilky={};   // 밀키 재료
  const needOther={};   // 기타 재료 (중간재료 포함)
  let totalDishes=0;

  document.querySelectorAll('.dish-picker-row').forEach(row=>{
    const rid=row.id.replace('drow_','');
    const key=document.getElementById('dsel_'+rid)?.value||'';
    if(!key||!RECIPES[key])return;
    const cnt=readSplitQty('dqty_'+rid);
    if(cnt<=0)return;
    totalDishes+=cnt;
    const mat=RECIPES[key].materials;
    for(const[k,q]of Object.entries(mat.base||{}))  needBase[k]=(needBase[k]||0)+q*cnt;
    for(const[k,q]of Object.entries(mat.crops||{})) needCrops[k]=(needCrops[k]||0)+q*cnt;
    for(const[k,q]of Object.entries(mat.milky||{})) needMilky[k]=(needMilky[k]||0)+q*cnt;
    for(const[k,q]of Object.entries(mat.other||{})) needOther[k]=(needOther[k]||0)+q*cnt;
  });
  if(totalDishes===0){document.getElementById('matsRes').innerHTML='<div class="empty-msg">요리를 선택하고 수량을 입력하세요</div>';return;}

  const haveBase={
    tomato: readSplitQty('haveBaseTomato'),
    onion:  readSplitQty('haveBaseOnion'),
    garlic: readSplitQty('haveBaseGarlic'),
  };
  const lackBase={tomato:Math.max(0,needBase.tomato-haveBase.tomato),onion:Math.max(0,needBase.onion-haveBase.onion),garlic:Math.max(0,needBase.garlic-haveBase.garlic)};
  const baseColors={tomato:'#d94f3d',onion:'#c89c00',garlic:'#9ab0c8'};
  const baseNames={tomato:'토마토',onion:'양파',garlic:'마늘'};

  let html='';

  // ── 베이스 필요량 ──
  html+=`<div class="rsec"><div class="rsec-title" style="color:var(--acc)">🫙 필요 베이스 (총 ${f(totalDishes)}개 요리)</div>`;
  for(const[k,need]of Object.entries(needBase)){
    if(need<=0)continue;
    const have=haveBase[k],lack=lackBase[k],cl=baseColors[k];
    html+=`<div class="rrow"><span class="rl" style="color:${cl}">${baseNames[k]} 베이스</span><span class="rv" style="color:var(--muted)">필요 ${f(need)}개 / 보유 ${f(have)}개 ${lack>0?`<span class="bdg br" style="margin-left:4px">부족 ${f(lack)}개</span>`:`<span class="bdg bg" style="margin-left:4px">충분</span>`}</span></div>`;
  }
  html+=`</div>`;

  // ── 기타 재료 필요량 ──
  const hasCrops=Object.values(needCrops).some(v=>v>0);
  const hasMilky=Object.values(needMilky).some(v=>v>0);
  const hasOther=Object.values(needOther).some(v=>v>0);

  if(hasCrops||hasMilky||hasOther){
    html+=`<div class="rsec"><div class="rsec-title" style="color:var(--acc)">🧺 기타 재료 합계</div>`;
    // 작물 묶음: 묶음 자체가 아이템 1개 단위 → fmtQty(q) 로 표시
    for(const[k,q]of Object.entries(needCrops)){
      if(q<=0)continue;
      const cc=CROPS[k]?.color||'#888';
      html+=`<div class="rrow"><span class="rl" style="color:${cc}">${CROPS[k]?.name||k}</span><span class="rv" style="color:var(--muted)">${fmtQty(q)}</span></div>`;
    }
    // 밀키 재료
    const milkyNames={salt:'소금',egg:'달걀',milk:'우유',oil:'오일'};
    for(const[k,q]of Object.entries(needMilky)){
      if(q<=0)continue;
      html+=`<div class="rrow"><span class="rl" style="color:#6090a8">${milkyNames[k]||k}</span><span class="rv" style="color:var(--muted)">${fmtQty(q)}</span></div>`;
    }
    // 기타 재료 (중간재료는 원재료 분해 표시)
    for(const[k,q]of Object.entries(needOther)){
      if(q<=0)continue;
      const meta=OTHER_META[k]||{name:k,color:'#888'};
      const cc=meta.color||'#888';
      if(PROCESSED_RECIPES[k]){
        const rec=PROCESSED_RECIPES[k];
        const subParts=[];
        for(const[mat,qty]of Object.entries(rec.ingredients)){
          const totalQty=qty*q;
          if(mat==='wheat'){
            const hayNeeded = Math.ceil(totalQty / 9); 
            subParts.push(`밀 ${fmtQty(totalQty)} (건초더미 ${fmtQty(hayNeeded)})`);
          } else {
            subParts.push(`${milkyNames[mat]||mat} ${fmtQty(totalQty)}`);
          }
        }
        html+=`<div class="rrow" style="align-items:flex-start"><span class="rl" style="color:${cc}">${meta.name}</span><span class="rv" style="color:var(--muted)">${fmtQty(q)}<small style="display:block">${subParts.join(' / ')}</small></span></div>`;
      } else {
        html+=`<div class="rrow"><span class="rl" style="color:${cc}">${meta.name}</span><span class="rv" style="color:var(--muted)">${fmtQty(q)}</span></div>`;
      }
    }
    html+=`</div>`;
  }

  // ── 씨앗 계산 ──
  const anyLack=Object.values(lackBase).some(v=>v>0);
  if(!anyLack){
    html+=`<div class="result-box"><div class="rb-label">✅ 베이스 충분</div><div class="rb-value" style="font-size:16px">추가 씨앗 불필요</div></div>`;
  } else {
    const seedColors={tomato:'#d94f3d',onion:'#c89c00',garlic:'#9ab0c8'};
    const seedNames={tomato:'토마토',onion:'양파',garlic:'마늘'};
    const seedResults={};
    for(const bt of['tomato','onion','garlic']){
      if(lackBase[bt]>0) seedResults[bt]=calcSeedsNeeded(lackBase[bt],bt,sk);
    }
    const avgTotal=Object.entries(lackBase).reduce((s,[bt,lack])=>s+(lack>0?seedResults[bt].avg:0),0);
    const safeTotal=Object.entries(lackBase).reduce((s,[bt,lack])=>s+(lack>0?seedResults[bt].safe80:0),0);

    // 종별 카드
    const seedCards=[['tomato','onion','garlic']].flat()
      .filter(bt=>lackBase[bt]>0)
      .map(bt=>{
        const cl=seedColors[bt], bn=seedNames[bt], sr=seedResults[bt];
        const recycleNote=sr.p>0
          ? `<div style="font-size:10px;color:var(--muted);margin-top:3px">씨앗은덤 ${fd(sr.p*100)}% → ${fd(sr.multiplier,1)}배 재순환 반영</div>`
          : '';
        return `<div class="seed-result-card" style="border-left:4px solid ${cl}">
          <div class="seed-result-header">
            <div>
              <div class="seed-result-name" style="color:${cl}">${bn} 씨앗</div>
              <div style="font-size:10px;color:var(--muted);margin-top:2px">부족 베이스 ${f(lackBase[bt])}개 → 작물 ${f(lackBase[bt]*8)}개 필요</div>
              ${recycleNote}
            </div>
            <div style="text-align:right">
              <div style="font-size:10px;color:var(--muted);margin-bottom:2px">평균</div>
              <div class="seed-result-qty" style="color:${cl}">${fmtQty(sr.avg)}</div>
              <div style="width:1px;background:var(--bdr);height:8px;margin:4px auto"></div>
              <div style="font-size:10px;color:var(--grn);margin-bottom:2px">80% 안전</div>
              <div class="seed-result-qty" style="color:var(--grn)">${fmtQty(sr.safe80)}</div>
            </div>
          </div>
        </div>`;
      }).join('');

    const seedDropNote=sk.sdPct>0
      ? `<div style="font-size:10px;color:var(--muted);margin-top:4px">씨앗은덤 ${sk.sdPct}% 재순환 반영</div>`:'';

    html+=seedCards;
    html+=`<div class="result-box" style="margin-top:8px">
      <div style="display:flex;gap:0;align-items:stretch">
        <div style="flex:1;text-align:center;padding:4px 8px">
          <div class="rb-label">합계 평균</div>
          <div class="rb-value" style="font-size:20px">${fmtQty(avgTotal)}</div>
          ${seedDropNote}
        </div>
        <div style="width:1px;background:var(--bdr2);margin:4px 0"></div>
        <div style="flex:1;text-align:center;padding:4px 8px">
          <div class="rb-label" style="color:var(--grn)">80% 안전 합계</div>
          <div class="rb-value rb-floor" style="font-size:20px">${fmtQty(safeTotal)}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px">+${fmtQty(safeTotal-avgTotal)} 여유</div>
        </div>
      </div>
    </div>`;
  }
  document.getElementById('matsRes').innerHTML=html;
};

/* 자동채우기 */
window.autoFill=()=>{
  const fill=(id,val)=>{if(!val||val<=0)return;const el=document.getElementById(id);if(el&&(!el.value||+el.value===0)){el.value=Math.round(val);el.dispatchEvent(new Event('input'));}};
  fill('pSeedTomato',DEFAULT_PRICES.seeds.tomato*SET_SIZE);
  fill('pSeedOnion', DEFAULT_PRICES.seeds.onion *SET_SIZE);
  fill('pSeedGarlic',DEFAULT_PRICES.seeds.garlic*SET_SIZE);
  const cp=DEFAULT_PRICES.crops;
  fill('pCropPumpkin',   cp.pumpkin   *SET_SIZE);fill('pCropPotato',    cp.potato   *SET_SIZE);
  fill('pCropCarrot',    cp.carrot    *SET_SIZE);fill('pCropBeet',      cp.beet     *SET_SIZE);
  fill('pCropWatermelon',cp.watermelon*SET_SIZE);fill('pCropSweetfruit',cp.sweetfruit*SET_SIZE);
  if(DEFAULT_PRICES.crops.sugar>0) fill('pCropSugar', DEFAULT_PRICES.crops.sugar*SET_SIZE);
  if(DEFAULT_PRICES.crops.hay>0) fill('pHay', DEFAULT_PRICES.crops.hay*SET_SIZE);
  const op=DEFAULT_PRICES.other;
  fill('pCoconut',op.coconut*SET_SIZE);fill('pPineapple',op.pineapple*SET_SIZE);
  fill('pSteak',op.steak*SET_SIZE);
  fill('pPork',op.pork*SET_SIZE);
  fill('pPorkBelly',op.pork_belly*SET_SIZE);fill('pPorkFront',op.pork_front*SET_SIZE);
  fill('pLamb',op.lamb*SET_SIZE);fill('pLambRib',op.lamb_rib*SET_SIZE);fill('pLambLeg',op.lamb_leg*SET_SIZE);
  fill('pChicken',op.chicken*SET_SIZE);fill('pChickenLeg',op.chicken_leg*SET_SIZE);fill('pChickenBreast',op.chicken_breast*SET_SIZE);
  fill('pBeefSirloin',op.beef_sirloin*SET_SIZE);fill('pBeefRib',op.beef_rib*SET_SIZE);
  onPriceChange();
};

/* localStorage */
const BASE_TYPES=['tomato','onion','garlic'];
const BASE_ID_PREFIX='haveBase';
const BASE_SUFFIXES=['_box','_set','_ea'];
const STATIC_IDS=[
  'skillFurnace','skillMoneyBonus','skillFullPot',
  'skillNatureGift','skillFireHoe','skillHarvestBonus','skillSeedDrop','skillKingCrop',
  'engSeedLuck','engCropBox','engFarmerRoulette',
  'hoeLevel','totalStamina',
  'pSeedTomato','pSeedOnion','pSeedGarlic',
  'pCropPumpkin','pCropPotato','pCropCarrot','pCropBeet','pCropWatermelon','pCropSweetfruit','pCropSugar','pHay',
  'pCoconut','pPineapple','pSteak',
  'pPork','pPorkBelly','pPorkFront','pLamb','pLambRib','pLambLeg',
  'pChicken','pChickenLeg','pChickenBreast','pBeefSirloin','pBeefRib',
  // 보유 베이스 3칸 × 3종
  ...BASE_TYPES.flatMap(t=>BASE_SUFFIXES.map(s=>BASE_ID_PREFIX+t.charAt(0).toUpperCase()+t.slice(1)+s)),
];
const KEY='farming_calc_v6';
function saveDishRows(){
  const rows=[];
  document.querySelectorAll('.dish-picker-row').forEach(row=>{
    const rid=row.id.replace('drow_','');
    rows.push({
      key:document.getElementById('dsel_'+rid)?.value||'',
      box:document.getElementById('dqty_'+rid+'_box')?.value||'',
      set:document.getElementById('dqty_'+rid+'_set')?.value||'',
      ea: document.getElementById('dqty_'+rid+'_ea') ?.value||'',
    });
  });
  return rows;
}
function saveAll(){
  const d={};
  STATIC_IDS.forEach(id=>{const e=document.getElementById(id);if(e)d[id]=e.value;});
  d.__includBaseCoast = document.getElementById('includBaseCoast')?.checked ?? false;
  d.__dishRows=saveDishRows();
  localStorage.setItem(KEY,JSON.stringify(d));
}
function loadAll(){
  try{
    const d=JSON.parse(localStorage.getItem(KEY)||'{}');
    STATIC_IDS.forEach(id=>{const e=document.getElementById(id);if(e&&d[id]!==undefined)e.value=d[id];});
    const cb=document.getElementById('includBaseCoast');
    if(cb&&d.__includBaseCoast!==undefined)cb.checked=d.__includBaseCoast;
    // 보유 베이스 총n개 표시 갱신
    BASE_TYPES.forEach(t=>{
      const key=BASE_ID_PREFIX+t.charAt(0).toUpperCase()+t.slice(1);
      const n=readSplitQty(key);
      const p=document.getElementById(key+'_p');
      if(p&&n>0)p.textContent='총 '+f(n)+'개';
    });
    if(Array.isArray(d.__dishRows)&&d.__dishRows.length>0){
      d.__dishRows.forEach(({key,box,set,ea})=>{
        addDishRow();
        const rid=rowId,sel=document.getElementById('dsel_'+rid);
        if(sel&&key){
          sel.value=key;
          const cdd=sel.previousElementSibling;
          if(cdd?.classList.contains('cdd')){
            const lbl=cdd.querySelector('.cdd-label');
            if(lbl)lbl.textContent=sel.options[sel.selectedIndex]?.text||'';
            cdd.querySelectorAll('.cdd-item').forEach(item=>item.classList.toggle('selected',item.dataset.value===key));
          }
        }
        if(box){const e=document.getElementById('dqty_'+rid+'_box');if(e)e.value=box;}
        if(set){const e=document.getElementById('dqty_'+rid+'_set');if(e)e.value=set;}
        if(ea) {const e=document.getElementById('dqty_'+rid+'_ea'); if(e)e.value=ea;}
        onDishQtyInput(rid);
      });
    }
  }catch(e){}
}

window.resetAll=()=>{
  if(!confirm('초기화할까요?'))return;
  localStorage.removeItem(KEY);
  STATIC_IDS.forEach(id=>{const e=document.getElementById(id);if(!e)return;if(e.tagName==='SELECT')e.selectedIndex=0;else e.value='';});
  const cb=document.getElementById('includBaseCoast');
  if(cb) cb.checked=false;
  BASE_TYPES.forEach(t=>{
    const p=document.getElementById(BASE_ID_PREFIX+t.charAt(0).toUpperCase()+t.slice(1)+'_p');
    if(p)p.textContent='';
  });
  document.getElementById('dishPickerList').innerHTML='';
  rowId=0;
  syncDropdownLabels();onSkillChange();
};

/* 커스텀 드롭다운 — mining.html과 동일한 방식 */
function initOneCdd(sel) {
  if(!sel||sel.previousElementSibling?.classList.contains('cdd'))return;
  const cdd=document.createElement('div');cdd.className='cdd';
  const trigger=document.createElement('div');trigger.className='cdd-trigger';
  const label=document.createElement('span');label.className='cdd-label';
  label.textContent=sel.options[sel.selectedIndex]?.text||'';
  const arrow=document.createElement('span');arrow.className='cdd-arrow';arrow.textContent='▼';
  trigger.appendChild(label);trigger.appendChild(arrow);
  const menu=document.createElement('div');menu.className='cdd-menu';
  Array.from(sel.options).forEach((opt,i)=>{
    if(opt.value===''&&opt.text.includes('선택'))return;
    const item=document.createElement('div');
    item.className='cdd-item'+(i===sel.selectedIndex&&sel.value===opt.value?' selected':'');
    item.textContent=opt.text;item.dataset.value=opt.value;
    item.addEventListener('click',()=>{
      sel.value=opt.value;label.textContent=opt.text;
      menu.querySelectorAll('.cdd-item').forEach(el=>el.classList.remove('selected'));
      item.classList.add('selected');cdd.classList.remove('open');
      sel.dispatchEvent(new Event('change',{bubbles:true}));
    });
    menu.appendChild(item);
  });
  trigger.addEventListener('click',e=>{
    e.stopPropagation();
    const isOpen=cdd.classList.contains('open');
    document.querySelectorAll('.cdd.open').forEach(el=>el.classList.remove('open'));
    if(!isOpen)cdd.classList.add('open');
  });
  cdd.appendChild(trigger);cdd.appendChild(menu);
  sel.parentNode.insertBefore(cdd,sel);
  sel.classList.add('cdd-ready'); // 커스텀 드롭다운 완성 후 네이티브 select 숨김
}

function initCustomDropdowns(){
  document.querySelectorAll('.skrow select,.field select,.dish-sel-wrap select').forEach(sel=>initOneCdd(sel));
}
function syncDropdownLabels(){
  document.querySelectorAll('.skrow select,.field select,.dish-sel-wrap select').forEach(sel=>{
    const cdd=sel.previousElementSibling;if(!cdd?.classList.contains('cdd'))return;
    const lbl=cdd.querySelector('.cdd-label');if(lbl)lbl.textContent=sel.options[sel.selectedIndex]?.text||'';
    cdd.querySelectorAll('.cdd-item').forEach(item=>item.classList.toggle('selected',item.dataset.value===sel.value));
  });
}

document.addEventListener('click',e=>{
  if(!e.target.closest('.cdd')) document.querySelectorAll('.cdd.open').forEach(el=>el.classList.remove('open'));
});

window.toggleSkillPanel = () => document.getElementById('skillPanel').classList.toggle('collapsed');
window.toggleEngPanel   = () => document.getElementById('engPanel').classList.toggle('collapsed');

function domReady(fn){
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn);
  else fn();
}
domReady(()=>{
  loadAll();
  initCustomDropdowns();
  syncDropdownLabels();
  onSkillChange();
  const titleEl=document.getElementById('pageTabTitle');if(titleEl)titleEl.textContent=TAB_TITLES[0];
  document.title=`재배 계산기 — ${TAB_TITLES[0]}`;
  STATIC_IDS.forEach(id=>{
    const e=document.getElementById(id);if(!e)return;
    e.addEventListener(e.tagName==='SELECT'?'change':'input',saveAll);
  });
  const toggleCb=document.getElementById('includBaseCoast');
  if(toggleCb) toggleCb.addEventListener('change',saveAll);
});