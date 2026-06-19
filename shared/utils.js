/* ════════════════════════════════════════════════════════════════════
   shared/utils.js — 공통 유틸 (실제 *_app.js 에서 추출, 동작 동일)
   --------------------------------------------------------------------
   기존: f/fd/gi/fmtQty/fmtTime/readSplitQty/splitQtyHtml 가 ocean·farming·
         mining 앱에 각각 복붙되어 있었음 → 한 곳으로 통합.
   순수 함수(f/fd/gi/fmtTime)는 그대로 export.
   단위(BOX_SIZE/SET_SIZE)·oninput 콜백명에 의존하던 fmtQty/readSplitQty/
   splitQtyHtml 은 createUnitUtils() 팩토리로 주입받아 "동작 100% 동일" 유지.
   ════════════════════════════════════════════════════════════════════ */

/** 정수 반올림 + 천단위 콤마 */
export const f = n => Math.round(n).toLocaleString('ko-KR');

/** 소수 d자리, 불필요한 0 제거 */
export const fd = (n, d = 2) =>
  +n.toFixed(d) === Math.round(+n.toFixed(d))
    ? Math.round(n).toString()
    : n.toFixed(d).replace(/\.?0+$/, '');

/** input 값을 0 이상 숫자로 */
export const gi = id => { const e = document.getElementById(id); return e ? Math.max(0, +e.value || 0) : 0; };

/** 초 → "h시간 m분 s초" */
export function fmtTime(sec) {
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return [h && `${h}시간`, m && `${m}분`, s && `${s}초`].filter(Boolean).join(' ') || '0초';
}

/**
 * 단위 의존 유틸 묶음 생성.
 * @param {object} UNITS  { BOX_SIZE, SET_SIZE } (config.js 의 UNITS 그대로)
 * @param {object} opts   { onInput }  splitQtyHtml 의 oninput 핸들러명(기본 'onSFQtyInput')
 */
export function createUnitUtils(UNITS, { onInput = 'onSFQtyInput' } = {}) {
  const { BOX_SIZE, SET_SIZE } = UNITS;

  function fmtQty(n) {
    n = Math.floor(n); if (n <= 0) return '0개';
    const boxes = Math.floor(n / BOX_SIZE), rem = n % BOX_SIZE,
          sets  = Math.floor(rem / SET_SIZE), items = rem % SET_SIZE;
    return [[boxes, '상자'], [sets, '세트'], [items, '개']]
      .filter(([v]) => v > 0).map(([v, u]) => v + u).join(' ') || '0개';
  }

  function readSplitQty(id) {
    const box = parseInt(document.getElementById(id + '_box')?.value || '0') || 0;
    const set = parseInt(document.getElementById(id + '_set')?.value || '0') || 0;
    const ea  = parseInt(document.getElementById(id + '_ea') ?.value || '0') || 0;
    return box * BOX_SIZE + set * SET_SIZE + ea;
  }

  function splitQtyHtml(id, color) {
    color = color || 'var(--muted)';
    const cell = (sfx, label) =>
      '<div style="display:flex;flex-direction:column;flex:1' + (sfx !== '_ea' ? ';border-right:1px solid var(--bdr)' : '') + '">'
      + '<span style="font-size:8px;font-weight:700;color:' + color + ';text-align:center;padding:2px 0;border-bottom:1px solid var(--bdr);background:var(--surf)">' + label + '</span>'
      + '<input id="' + id + sfx + '" type="number" inputmode="numeric" placeholder="0" min="0" oninput="' + onInput + '(\'' + id + '\')" '
      + 'style="border:none;outline:none;background:transparent;width:100%;text-align:center;font-size:13px!important;font-weight:700!important;color:var(--txt);padding:5px 2px"></div>';
    return '<div style="display:flex;border:1.5px solid var(--bdr);border-radius:var(--rs);overflow:hidden;background:var(--bg);margin-top:2px">'
      + cell('_box', '상자') + cell('_set', '세트') + cell('_ea', '개')
      + '</div><div id="' + id + '_p" style="font-size:10px;color:' + color + ';min-height:13px;font-weight:700;text-align:right;margin-top:1px"></div>';
  }

  return { fmtQty, readSplitQty, splitQtyHtml };
}

if (typeof window !== 'undefined') Object.assign(window, { f, fd, gi, fmtTime, createUnitUtils });