/* ════════════════════════════════════════
   utils.js — 순수 유틸리티 함수
════════════════════════════════════════ */

import { UNITS } from './config.js';

const { SET_SIZE, BOX_SIZE } = UNITS;

export const f = (n) => Math.round(n).toLocaleString('ko-KR');

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
  const s = sec % 60;
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