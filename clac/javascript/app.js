/* ════════════════════════════════════════
   app.js — 진입점 & 전역 노출
   HTML의 onclick= 에서 호출하려면
   window.* 에 등록해야 합니다
════════════════════════════════════════ */

import { onSkillChange } from './skills.js';
import { cs, cl, co, cv } from './tabs.js';

function sw(i, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  for (let k = 0; k < 5; k++) {
    const panel = document.getElementById('t' + k);
    if (panel) panel.style.display = 'none';
  }
  el.classList.add('on');
  document.getElementById('t' + i).style.display = 'block';
}

// HTML onclick= 에서 접근할 수 있도록 전역 등록
window.sw            = sw;
window.cs            = cs;
window.cl            = cl;
window.co            = co;
window.cv            = cv;
window.onSkillChange = onSkillChange;

document.addEventListener('DOMContentLoaded', () => onSkillChange());