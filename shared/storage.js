/* ════════════════════════════════════════════════════════════════════
   shared/storage.js — 저장소 네임스페이스 통일 + 마이그레이션 (Step 2)
   --------------------------------------------------------------------
   문제: 저장 키가 'ocean_calc_v8', 'farming_calc_v6' 처럼 제각각.
         (mining 은 영속 저장 없음)
   통일 규칙:
     project_data:<profession>      ← 페이지 입력값 블롭(기존 saveAll/loadAll 대상)
     project_settings               ← 전역 설정(테마 등)
     project_prices:<profession>    ← 개인 시세(price-store 와 연동)
   기존 데이터는 createPageStore 최초 호출 시 레거시 키에서 1회 자동 이관.
   블롭의 "모양"은 그대로라 saveAll/loadAll 로직은 read/write 대상만 교체하면 됨.
   ════════════════════════════════════════════════════════════════════ */

export const NS = {
  DATA:     'project_data',
  SETTINGS: 'project_settings',
  PRICES:   'project_prices',
};

const _ls = () => (typeof localStorage !== 'undefined' ? localStorage : null);
const key = (ns, sub) => sub ? `${ns}:${sub}` : ns;

export function readJSON(k, fallback = null) {
  try { const r = _ls()?.getItem(k); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
export function writeJSON(k, obj) {
  try { _ls()?.setItem(k, JSON.stringify(obj)); return true; } catch { return false; }
}

/**
 * 페이지 입력 블롭 저장소.
 * @param {object} o { profession:'ocean', legacyKey:'ocean_calc_v8' }
 * 반환: { storageKey, load(), save(obj), migrated }
 */
export function createPageStore({ profession, legacyKey } = {}) {
  if (!profession) throw new Error('createPageStore: profession required');
  const storageKey = key(NS.DATA, profession);
  let migrated = false;

  // ── 최초 1회 마이그레이션: 신규 키가 비어있고 레거시 키가 있으면 이관 ──
  const ls = _ls();
  if (ls && legacyKey) {
    const hasNew = ls.getItem(storageKey) != null;
    const legacy = ls.getItem(legacyKey);
    if (!hasNew && legacy != null) {
      try { ls.setItem(storageKey, legacy); migrated = true; /* 레거시는 안전을 위해 남겨둠 */ }
      catch { /* 무시 */ }
    }
  }

  return {
    storageKey,
    migrated,
    load() { return readJSON(storageKey, {}); },
    save(obj) { return writeJSON(storageKey, obj); },
  };
}

/* 전역 설정(테마/언어 등) */
export const settings = {
  get(k, fallback = null) { const d = readJSON(NS.SETTINGS, {}); return (k in (d || {})) ? d[k] : fallback; },
  set(k, v) { const d = readJSON(NS.SETTINGS, {}) || {}; d[k] = v; writeJSON(NS.SETTINGS, d); },
};

if (typeof window !== 'undefined') Object.assign(window, { ddtStorage: { NS, createPageStore, settings, readJSON, writeJSON } });