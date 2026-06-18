/* ════════════════════════════════════════════════════════════════════
   shared/dropdown.js — 커스텀 드롭다운 (ocean·farming 중복 → 통합)
   실제 코드 그대로 추출. 동작 동일. 의존성 없음(DOM·CSS 클래스 .cdd* 만 사용).
   사용: import { initOneCdd, syncDropdownLabels, bindCddOutsideClose } from './shared/dropdown.js';
         document.querySelectorAll('.skrow select,.field select').forEach(initOneCdd);
         bindCddOutsideClose();   // 바깥 클릭 시 닫기 (1회)
   ════════════════════════════════════════════════════════════════════ */

export function initOneCdd(sel) {
  if (!sel || sel.previousElementSibling?.classList.contains('cdd')) return;
  const cdd = document.createElement('div'); cdd.className = 'cdd';
  const trigger = document.createElement('div'); trigger.className = 'cdd-trigger';
  const label = document.createElement('span'); label.className = 'cdd-label'; label.textContent = sel.options[sel.selectedIndex]?.text || '';
  const arrowEl = document.createElement('span'); arrowEl.className = 'cdd-arrow'; arrowEl.textContent = '▼';
  trigger.appendChild(label); trigger.appendChild(arrowEl);
  const menu = document.createElement('div'); menu.className = 'cdd-menu';
  Array.from(sel.children).forEach(child => {
    if (child.tagName === 'OPTGROUP') {
      const grpLbl = document.createElement('div');
      grpLbl.style.cssText = 'padding:4px 8px;font-size:10px;color:var(--muted);font-weight:700;background:var(--bg);border-bottom:1px solid var(--bdr)';
      grpLbl.textContent = child.label; menu.appendChild(grpLbl);
      Array.from(child.children).forEach(opt => addItem(opt, '14px'));
    } else if (child.tagName === 'OPTION') addItem(child, '');
  });
  function addItem(opt, paddingLeft) {
    const item = document.createElement('div');
    item.className = 'cdd-item' + (sel.value === opt.value ? ' selected' : '');
    if (paddingLeft) item.style.paddingLeft = paddingLeft;
    item.textContent = opt.text; item.dataset.value = opt.value;
    item.addEventListener('click', () => {
      sel.value = opt.value; label.textContent = opt.text;
      menu.querySelectorAll('.cdd-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected'); cdd.classList.remove('open');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    menu.appendChild(item);
  }
  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = cdd.classList.contains('open');
    document.querySelectorAll('.cdd.open').forEach(el => el.classList.remove('open'));
    if (!isOpen) cdd.classList.add('open');
  });
  cdd.appendChild(trigger); cdd.appendChild(menu);
  sel.parentNode.insertBefore(cdd, sel); sel.classList.add('cdd-ready');
}

export function syncDropdownLabels() {
  document.querySelectorAll('.skrow select,.field select').forEach(sel => {
    const cdd = sel.previousElementSibling;
    if (!cdd?.classList.contains('cdd')) return;
    const lbl = cdd.querySelector('.cdd-label');
    if (lbl) lbl.textContent = sel.options[sel.selectedIndex]?.text || '';
    cdd.querySelectorAll('.cdd-item').forEach(item => item.classList.toggle('selected', item.dataset.value === sel.value));
  });
}

let _outsideBound = false;
export function bindCddOutsideClose() {
  if (_outsideBound) return; _outsideBound = true;
  document.addEventListener('click', e => {
    if (!e.target.closest('.cdd')) document.querySelectorAll('.cdd.open').forEach(el => el.classList.remove('open'));
  });
}

if (typeof window !== 'undefined') Object.assign(window, { initOneCdd, syncDropdownLabels, bindCddOutsideClose });