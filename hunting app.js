/* ════════════════════════════════════════
   hunting app.js — 사냥 계산기 로직
   공백 포함 파일명: "hunting app.js"
════════════════════════════════════════ */

/* ════════════════════════════════════════
   ① 상수 데이터
════════════════════════════════════════ */

// 세이지 대검 강화별 스탯
const SWORD_STATS = {
  //  [공격력, 공격속도, 전리품드롭, 각인조각확률%, 경험치]
   1: [45,  0.7, 1, 1,  3],
   2: [50,  0.7, 2, 3,  3],
   3: [55,  0.7, 2, 3,  8],
   4: [60,  0.7, 2, 5, 13],
   5: [65,  0.7, 3, 5, 27],
   6: [70,  0.7, 3, 7, 28],
   7: [75,  0.7, 3, 7, 29],
   8: [80,  0.7, 4,10, 41],
   9: [85,  0.7, 4,10, 41],
  10: [140, 0.5, 6,15, 42],
  11: [160, 0.5, 6,15, 42],
  12: [180, 0.5, 7,20, 42],
  13: [200, 0.5, 7,20, 56],
  14: [250, 0.5, 8,25, 66],
  15: [300, 0.3,10,30, 85],
};

// 콤보별 추가 드롭 확률 (%)
const COMBO_DROP_PCT = {
   1:0, 2:1, 3:1, 4:2, 5:3, 6:4, 7:5, 8:6, 9:8,10:10,
  11:12,12:14,13:16,14:18,15:21,16:24,17:27,18:31,19:35,20:40,
};

// 초식 동물 목록
const HERBIVORES = [
  {key:'deer',      name:'사슴',    emoji:'🦌', loot:'사슴의 뿔',      hp:500, region:'계곡'},
  {key:'meerkat',   name:'미어캣',  emoji:'😺', loot:'미어캣의 꼬리',  hp:500, region:'계곡'},
  {key:'giraffe',   name:'기린',    emoji:'🦒', loot:'기린의 가죽',    hp:500, region:'마을 초입'},
  {key:'elephant',  name:'코끼리',  emoji:'🐘', loot:'코끼리의 상아',  hp:500, region:'마을 초입'},
  {key:'hippo',     name:'하마',    emoji:'🦛', loot:'하마의 송곳니',  hp:500, region:'골짜기'},
  {key:'flamingo',  name:'플라밍고',emoji:'🦩', loot:'플라밍고의 부리',hp:500, region:'골짜기'},
  {key:'turkey',    name:'칠면조',  emoji:'🦃', loot:'칠면조의 깃털',  hp:500, region:'산맥'},
  {key:'bear',      name:'곰',      emoji:'🐻', loot:'곰의 발바닥',    hp:500, region:'마을 옛터'},
];

// 육식 동물 목록
const CARNIVORES = [
  {key:'lion',    name:'사자',   emoji:'🦁', trigger:'사슴+미어캣', basePrice:0},
  {key:'leopard', name:'표범',   emoji:'🐆', trigger:'기린+코끼리', basePrice:0},
  {key:'croc',    name:'악어',   emoji:'🐊', trigger:'하마+플라밍고',basePrice:0},
  {key:'wolf',    name:'늑대',   emoji:'🐺', trigger:'칠면조',      basePrice:0},
  {key:'tiger',   name:'호랑이', emoji:'🐯', trigger:'곰',          basePrice:0},
];

// 영혼 계약서 레시피
const CONTRACTS = [
  {key:'prosperity', name:'번영의 영혼 계약서', emoji:'🌟', souls:['deer','meerkat']},
  {key:'shatter',    name:'파쇄의 영혼 계약서', emoji:'💥', souls:['giraffe','elephant']},
  {key:'tide',       name:'만조의 영혼 계약서', emoji:'🌊', souls:['hippo','flamingo']},
  {key:'conquest',   name:'정복의 영혼 계약서', emoji:'⚔️', souls:['turkey','bear']},
];

// 사냥 각인석 (대검 전용)
const ENGRAVINGS_SWORD = [
  {key:'eng_sword_crude',  name:'투박한 각인석 (대검)'},
  {key:'eng_sword_neat',   name:'단정한 각인석 (대검)'},
  {key:'eng_sword_fine',   name:'정교한 각인석 (대검)'},
];

const TAB_TITLES = ['하루 수익 예상', '시세 입력', '제작 계산'];
const STAMINA_PER_HIT = 10; // 사냥 1회당 스태미나 소모
const TRAP_RECIPE = {emerald:10, iron:8, cobweb:2, apple:4, flint:4}; // 덫 2개 제작 재료

/* ════════════════════════════════════════
   ② 유틸리티
════════════════════════════════════════ */
const f  = n => Math.round(n).toLocaleString('ko-KR');
const fd = (n, d=2) => +n.toFixed(d) === Math.round(+n.toFixed(d)) ? Math.round(n).toString() : n.toFixed(d).replace(/\.?0+$/, '');
const gi = id => { const e = document.getElementById(id); return e ? Math.max(0, +e.value || 0) : 0; };

function frrow(l, v, style='') {
  return `<div class="rrow"><span class="rl">${l}</span><span class="rv"${style ? ` style="${style}"` : ''}>${v}</span></div>`;
}

/* ════════════════════════════════════════
   ③ 탭 전환
════════════════════════════════════════ */
window.sw = (i, el) => {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  [0,1,2].forEach(k => { const p = document.getElementById('t'+k); if (p) p.style.display = 'none'; });
  el.classList.add('on');
  document.getElementById('t'+i).style.display = 'block';
  const t = document.getElementById('pageTabTitle'); if (t) t.textContent = TAB_TITLES[i];
  document.title = `사냥 계산기 — ${TAB_TITLES[i]}`;
};

/* ════════════════════════════════════════
   ④ 스킬 값 읽기
════════════════════════════════════════ */
function getSK() {
  const lvRaw = gi('skillSwordLevel');
  const lv = Math.max(1, Math.min(15, lvRaw || 1));
  const stat = lvRaw > 0 ? SWORD_STATS[lv] : [0, 0.7, 1, 0, 0];
  return {
    lv: lvRaw,
    atk:      stat[0],
    atkSpd:   stat[1],
    dropBase: stat[2],
    shard:    stat[3], // 각인석 조각 확률 %
    exp:      stat[4],
    comboMax:    +document.getElementById('skillComboMax').value || 10,
    extraDrop:   gi('skillExtraDrop'),
    sellBonus:   gi('skillSellBonus'),    // %
    affinity:    gi('skillAffinity'),     // %
    eightyPct:   gi('skillEightyPct'),
  };
}

/* ════════════════════════════════════════
   ⑤ 스킬 변경 핸들러
════════════════════════════════════════ */
window.onSkillChange = () => {
  const sk = getSK();
  const st = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
  if (sk.lv > 0) {
    st('infoSword', `${sk.lv}강 — 드롭${sk.dropBase}개 / 조각${sk.shard}%`);
  } else {
    st('infoSword', '강화 안 함');
  }
  st('infoCombo',     `최대 ${sk.comboMax}콤보`);
  st('infoExtraDrop', sk.extraDrop > 0 ? `+${sk.extraDrop}개 추가` : '없음');
  st('infoSellBonus', sk.sellBonus > 0 ? `+${sk.sellBonus}%` : '없음');
  st('infoAffinity',  sk.affinity  > 0 ? `+${sk.affinity}%`  : '없음');
  st('infoEightyPct', sk.eightyPct > 0 ? '80% 적용' : '없음');
  calcDaily();
};

/* ════════════════════════════════════════
   ⑥ 가격 읽기 헬퍼
════════════════════════════════════════ */
function getCarnivorePrice(key) { return gi(`carn_price_${key}`); }
function getEngravingPrice(key) { return gi(`price_${key}`); }
function getTrapCost() {
  const r = TRAP_RECIPE;
  const cost = gi('price_emerald')*r.emerald + gi('price_iron')*r.iron
             + gi('price_cobweb')*r.cobweb + gi('price_apple')*r.apple
             + gi('price_flint')*r.flint;
  return cost / 2; // 2개 제작이므로 1개당
}

/* ════════════════════════════════════════
   ⑦ TAB0: 하루 수익 계산
════════════════════════════════════════ */
window.calcDaily = () => {
  const resEl = document.getElementById('dailyRes');
  const sk = getSK();
  const stamina = gi('totalStamina');
  const avgComboRaw = gi('avgCombo') || 5;
  const avgCombo = Math.max(1, Math.min(sk.comboMax, avgComboRaw));

  if (!stamina) {
    resEl.innerHTML = '<div class="empty-msg">스태미나를 입력하면 계산됩니다</div>';
    return;
  }

  // 사냥 횟수
  const hits = Math.floor(stamina / STAMINA_PER_HIT);

  // 콤보 추가 드롭 확률 (평균)
  const comboPct = (COMBO_DROP_PCT[avgCombo] || 0) / 100;

  // 기본 드롭 수
  const baseDrop = sk.lv > 0 ? sk.dropBase : 1;
  const extraDrop = sk.extraDrop;

  // 전리품 기댓값 (콤보 추가 드롭 포함)
  const lootPerHit = baseDrop + extraDrop + comboPct;
  const totalLoot  = hits * lootPerHit;

  // 각인석 조각 획득 기댓값
  const shardPct = (sk.lv > 0 ? sk.shard : 0) / 100;
  const totalShard = hits * shardPct;

  // 육식동물 소환 알: 사냥 1회당 1개 확률적 드롭 (기본 1개로 가정)
  const totalEggs = hits;

  // 수익 계산
  // 1) 각인석 조각 수익 (조각 5개 = 수상한 각인석 1개; 각인석 조사 후 가치 추정)
  //    → 시세 기반으로 나중에; 여기서는 개수만 표시
  // 2) 육식동물 수익 = 기본가 × (1 + 판매보너스/100) × (1 + 호감도/100) - 덫 비용
  const sellMult = (1 + sk.sellBonus/100) * (1 + sk.affinity/100) * (sk.eightyPct ? 0.8 : 1);
  let carnRev = 0;
  let carnLines = '';
  CARNIVORES.forEach(c => {
    const base = getCarnivorePrice(c.key);
    if (base > 0) {
      // 육식동물 등장: 초식동물 2마리당 1번 (트리거 쌍)
      // 덫 1개로 포획 1회
      const trapCost = getTrapCost();
      const netPerCapture = Math.round(base * sellMult) - trapCost;
      // 대략 hits/2 기회 (2마리 사냥마다 1번 등장)
      const chances = hits / 2;
      const rev = netPerCapture * chances;
      carnRev += rev;
      carnLines += frrow(
        `${c.emoji} ${c.name}`,
        `${f(Math.round(base * sellMult))}원 - 덫 ${f(Math.round(trapCost))}원 = ${f(Math.round(netPerCapture))}원 × ${fd(chances,1)}회 = <b>${f(Math.round(rev))}원</b>`
      );
    }
  });

  let html = `
  <div class="rsec">
    <div class="rsec-title">⚔️ 기본 사냥 정보 — ${sk.lv > 0 ? sk.lv+'강' : '강화없음'}</div>
    ${frrow('총 사냥 횟수', `${f(hits)}회 <small style="color:var(--muted)">(${f(stamina)}÷10)</small>`)}
    ${frrow('회당 전리품', `${fd(lootPerHit,2)}개 <small style="color:var(--muted)">(기본${baseDrop}+추가${extraDrop}+콤보${fd(comboPct*100,1)}%)</small>`)}
    ${frrow('총 전리품 기댓값', `<b>${fd(totalLoot,1)}개</b>`)}
    ${frrow('각인석 조각 기댓값', `${fd(totalShard,2)}개 <small style="color:var(--muted)">(확률 ${shardPct*100}%)</small>`)}
    ${frrow('육식동물 소환 알', `${f(totalEggs)}개`)}
  </div>`;

  if (carnRev > 0 || carnLines) {
    html += `<div class="rsec">
    <div class="rsec-title">🐯 육식동물 수익 (포획 → 수렵꾼 판매)</div>
    ${carnLines || '<div class="empty-msg" style="font-size:11px">시세 입력 탭에서 육식동물 기본가를 입력하세요</div>'}
    </div>`;
  } else {
    html += `<div class="rsec">
    <div class="rsec-title">🐯 육식동물 수익</div>
    <div class="empty-msg" style="font-size:11px">시세 입력 탭에서 육식동물 기본가를 입력하세요</div>
    </div>`;
  }

  const totalRev = carnRev;
  html += `
  <div class="result-box">
    <div style="display:flex;gap:0;flex-wrap:wrap">
      <div style="flex:1;min-width:100px;text-align:center;padding:4px 8px">
        <div class="rb-label">전리품</div>
        <div class="rb-value" style="font-size:16px">${fd(totalLoot,1)}개</div>
      </div>
      <div style="width:1px;background:var(--bdr2);margin:4px 0"></div>
      <div style="flex:1;min-width:100px;text-align:center;padding:4px 8px">
        <div class="rb-label">각인석 조각</div>
        <div class="rb-value" style="font-size:16px">${fd(totalShard,2)}개</div>
      </div>
      ${totalRev > 0 ? `<div style="width:1px;background:var(--bdr2);margin:4px 0"></div>
      <div style="flex:1;min-width:100px;text-align:center;padding:4px 8px">
        <div class="rb-label">육식동물 수익</div>
        <div class="rb-value" style="font-size:16px;color:var(--grn)">${f(Math.round(totalRev))}원</div>
      </div>` : ''}
    </div>
  </div>`;

  resEl.innerHTML = html;
};

/* ════════════════════════════════════════
   ⑧ TAB2: 제작 계산
════════════════════════════════════════ */
window.calcCraft = () => {
  const resEl = document.getElementById('craftRes');

  // 전리품 수량 읽기
  const lootQty = {};
  HERBIVORES.forEach(h => { lootQty[h.key] = gi(`loot_${h.key}`); });

  const hasAny = Object.values(lootQty).some(v => v > 0);
  if (!hasAny) {
    resEl.innerHTML = '<div class="empty-msg">전리품 수량을 입력해주세요</div>';
    return;
  }

  // 영혼 불꽃 비용
  const flameCost = gi('price_heart_zombie') + gi('price_heart_skeleton')
                  + gi('price_heart_spider') + gi('price_heart_creeper');

  let html = '<div class="rsec"><div class="rsec-title">👻 제작 가능 영혼</div>';
  const soulQty = {};
  HERBIVORES.forEach(h => {
    const qty = lootQty[h.key];
    const souls = Math.floor(qty / 15);
    soulQty[h.key] = souls;
    html += frrow(
      `${h.emoji} ${h.name}의 영혼`,
      `${f(qty)}개 ÷ 15 = <b>${f(souls)}개</b> <small style="color:var(--muted)">(잉여 ${qty % 15}개)</small>`
    );
  });
  html += '</div>';

  // 계약서 계산
  html += '<div class="rsec"><div class="rsec-title">📜 제작 가능 계약서</div>';
  CONTRACTS.forEach(c => {
    const counts = c.souls.map(k => soulQty[k] || 0);
    const canMake = Math.min(...counts);
    const names = c.souls.map(k => HERBIVORES.find(h=>h.key===k)?.emoji || '').join('+');
    const totalFlameCost = flameCost * canMake * c.souls.length;
    html += frrow(
      `${c.emoji} ${c.name}`,
      `${names} → <b>${f(canMake)}개</b>${flameCost > 0 ? ` <small style="color:var(--muted)">(영혼 불꽃 ${f(totalFlameCost)}원)</small>` : ''}`
    );
  });
  html += '</div>';

  // 수상한 각인석 계산 (조각 5개 → 1개)
  html += '<div class="rsec"><div class="rsec-title">🪨 수상한 각인석</div>';
  const shardHave = gi('shardHave');
  if (shardHave > 0) {
    html += frrow('조각 보유', `${f(shardHave)}개`);
    html += frrow('수상한 각인석', `${f(Math.floor(shardHave / 5))}개 <small style="color:var(--muted)">(잉여 ${shardHave%5}개)</small>`);
  } else {
    html += '<div class="empty-msg" style="font-size:11px">각인석 조각 수량은 아래 입력란에 입력하세요</div>';
  }
  html += '</div>';

  resEl.innerHTML = html;
};

/* 덫 수익 계산 */
window.calcTrap = () => {
  const resEl = document.getElementById('trapRes');
  const trapCount = gi('trapCount');
  const eggCount  = gi('eggCount');

  if (!trapCount && !eggCount) {
    resEl.innerHTML = '<div class="empty-msg">덫 수와 소환 알 수를 입력하면 계산됩니다</div>';
    return;
  }

  const usable = Math.min(trapCount, eggCount); // 실제 포획 가능 수
  const trapCost = getTrapCost();
  const sk = getSK();
  const sellMult = (1 + sk.sellBonus/100) * (1 + sk.affinity/100) * (sk.eightyPct ? 0.8 : 1);

  let html = `<div class="rsec">
    ${frrow('덫 보유', `${f(trapCount)}개`)}
    ${frrow('소환 알 보유', `${f(eggCount)}개`)}
    ${frrow('포획 가능 수', `<b>${f(usable)}회</b>`)}
    ${frrow('덫 1개 제작비', trapCost > 0 ? `${f(Math.round(trapCost))}원` : '시세 미입력')}
  </div>`;

  let totalRev = 0;
  let lines = '';
  CARNIVORES.forEach(c => {
    const base = getCarnivorePrice(c.key);
    if (base > 0) {
      const netPerCapture = Math.round(base * sellMult) - Math.round(trapCost);
      lines += frrow(`${c.emoji} ${c.name} 마리당`, `${f(Math.round(base * sellMult))} - ${f(Math.round(trapCost))} = <b>${f(netPerCapture)}원</b>`);
      totalRev += netPerCapture * usable / CARNIVORES.filter(cc => getCarnivorePrice(cc.key) > 0).length;
    }
  });

  if (lines) {
    html += `<div class="rsec"><div class="rsec-title">💰 종별 순수익</div>${lines}</div>`;
    html += `<div class="result-box">
      <div class="rb-label">포획 ${f(usable)}회 기준 예상 수익</div>
      <div class="rb-value" style="color:var(--grn)">${f(Math.round(totalRev))}원</div>
    </div>`;
  } else {
    html += '<div class="empty-msg">시세 입력 탭에서 육식동물 기본가를 입력하세요</div>';
  }

  resEl.innerHTML = html;
};

/* ════════════════════════════════════════
   ⑨ 동적 UI 빌드
════════════════════════════════════════ */
function buildCarnivoreGrid() {
  const el = document.getElementById('carnivoreGrid'); if (!el) return;
  el.innerHTML = CARNIVORES.map(c => `
    <div class="field">
      <label>${c.emoji} ${c.name} 기본가</label>
      <input id="carn_price_${c.key}" type="number" inputmode="numeric" placeholder="0" oninput="calcDaily();saveAll()">
      <div style="font-size:10px;color:var(--muted);font-weight:500">트리거: ${c.trigger}</div>
    </div>`).join('');
}

function buildEngravingGrid() {
  const el = document.getElementById('engravingGrid_sword'); if (!el) return;
  el.innerHTML = ENGRAVINGS_SWORD.map(e => `
    <div class="field">
      <label>${e.name}</label>
      <input id="price_${e.key}" type="number" inputmode="numeric" placeholder="0" oninput="saveAll()">
    </div>`).join('');
}

function buildLootGrid() {
  const el = document.getElementById('lootInputGrid'); if (!el) return;
  el.innerHTML = HERBIVORES.map(h => `
    <div class="field">
      <label>${h.emoji} ${h.loot}</label>
      <input id="loot_${h.key}" type="number" inputmode="numeric" placeholder="0" oninput="saveAll()">
    </div>`).join('');
  // 각인석 조각 입력 추가
  el.innerHTML += `
    <div class="field" style="grid-column:1/-1;border-top:1px dashed var(--bdr2);padding-top:8px;margin-top:4px">
      <label>🪨 각인석 조각 보유 수</label>
      <input id="shardHave" type="number" inputmode="numeric" placeholder="0" oninput="saveAll()">
    </div>`;
}

/* ════════════════════════════════════════
   ⑩ localStorage
════════════════════════════════════════ */
const KEY = 'hunting_calc_v1';

function getStaticIds() {
  const carnIds = CARNIVORES.map(c => `carn_price_${c.key}`);
  const engIds  = ENGRAVINGS_SWORD.map(e => `price_${e.key}`);
  const lootIds = HERBIVORES.map(h => `loot_${h.key}`);
  return [
    'skillSwordLevel','skillComboMax','skillExtraDrop','skillSellBonus','skillAffinity','skillEightyPct',
    'totalStamina','avgCombo',
    'price_heart_zombie','price_heart_skeleton','price_heart_spider','price_heart_creeper',
    'price_emerald','price_iron','price_cobweb','price_apple','price_flint',
    'trapCount','eggCount','shardHave',
    ...carnIds, ...engIds, ...lootIds,
  ];
}

function saveAll() {
  const d = {};
  getStaticIds().forEach(id => { const e = document.getElementById(id); if (e) d[id] = e.value; });
  localStorage.setItem(KEY, JSON.stringify(d));
}
window.saveAll = saveAll;

function loadAll() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || '{}');
    getStaticIds().forEach(id => { const e = document.getElementById(id); if (e && d[id] !== undefined) e.value = d[id]; });
  } catch(e) {}
}

/* ════════════════════════════════════════
   ⑪ 초기화
════════════════════════════════════════ */
window.toggleSkillPanel = () => document.getElementById('skillPanel').classList.toggle('collapsed');

window.resetAll = () => {
  if (!confirm('초기화할까요?')) return;
  localStorage.removeItem(KEY);
  getStaticIds().forEach(id => { const e = document.getElementById(id); if (!e) return; if (e.tagName === 'SELECT') e.selectedIndex = 0; else e.value = ''; });
  onSkillChange();
};

/* ════════════════════════════════════════
   ⑫ 커스텀 드롭다운
════════════════════════════════════════ */
function initOneCdd(sel) {
  if (!sel || sel.previousElementSibling?.classList.contains('cdd')) return;
  const cdd = document.createElement('div'); cdd.className = 'cdd';
  const trigger = document.createElement('div'); trigger.className = 'cdd-trigger';
  const label = document.createElement('span'); label.className = 'cdd-label'; label.textContent = sel.options[sel.selectedIndex]?.text || '';
  const arrowEl = document.createElement('span'); arrowEl.className = 'cdd-arrow'; arrowEl.textContent = '▼';
  trigger.appendChild(label); trigger.appendChild(arrowEl);
  const menu = document.createElement('div'); menu.className = 'cdd-menu';
  Array.from(sel.children).forEach(opt => {
    const item = document.createElement('div');
    item.className = 'cdd-item' + (sel.value === opt.value ? ' selected' : '');
    item.textContent = opt.text; item.dataset.value = opt.value;
    item.addEventListener('click', () => {
      sel.value = opt.value; label.textContent = opt.text;
      menu.querySelectorAll('.cdd-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected'); cdd.classList.remove('open');
      sel.dispatchEvent(new Event('change', {bubbles:true}));
    });
    menu.appendChild(item);
  });
  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = cdd.classList.contains('open');
    document.querySelectorAll('.cdd.open').forEach(el => el.classList.remove('open'));
    if (!isOpen) cdd.classList.add('open');
  });
  cdd.appendChild(trigger); cdd.appendChild(menu);
  sel.parentNode.insertBefore(cdd, sel); sel.classList.add('cdd-ready');
}

document.addEventListener('click', e => { if (!e.target.closest('.cdd')) document.querySelectorAll('.cdd.open').forEach(el => el.classList.remove('open')); });

/* ════════════════════════════════════════
   ⑬ DOMContentLoaded
════════════════════════════════════════ */
function domReady(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
domReady(() => {
  buildCarnivoreGrid();
  buildEngravingGrid();
  buildLootGrid();
  loadAll();
  document.querySelectorAll('.skrow select').forEach(sel => initOneCdd(sel));
  onSkillChange();
  const titleEl = document.getElementById('pageTabTitle');
  if (titleEl) titleEl.textContent = TAB_TITLES[0];
  document.title = '사냥 계산기 — ' + TAB_TITLES[0];
  getStaticIds().forEach(id => {
    const e = document.getElementById(id);
    if (!e) return;
    e.addEventListener(e.tagName === 'SELECT' ? 'change' : 'input', saveAll);
  });
});