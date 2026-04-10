/* ════════════════════════════════════════
   skills.js — 스킬 배율 계산 & 바닐라 원가
════════════════════════════════════════ */

import { SKILLS, RECIPES, UNITS } from './config.js';
import { gi } from './utils.js';

const { SET_SIZE } = UNITS;

export function getSkillMultipliers() {
  const furnaceLv   = gi('skillFurnace');
  const ingotSellLv = gi('skillIngotSell');
  return {
    furnaceReduction: (SKILLS.FURNACE.reductionPct[furnaceLv]  ?? 0) / 100,
    ingotBonus:       (SKILLS.INGOT_SELL.bonusPct[ingotSellLv] ?? 0) / 100,
  };
}

export function applyIngotBonus(basePrice, ingotBonus) {
  return basePrice * (1 + ingotBonus);
}

export function applyFurnaceReduction(baseSec, furnaceReduction) {
  return baseSec * (1 - furnaceReduction);
}

export function vPrices() {
  return {
    charcoal:              gi('vch') / SET_SIZE,
    cobblestone:           gi('vCo') / SET_SIZE,
    deepslate_cobblestone: gi('vDc') / SET_SIZE,
    copper:                gi('vCu') / SET_SIZE,
    iron:                  gi('vIr') / SET_SIZE,
    gold:                  gi('vGo') / SET_SIZE,
    diamond:               gi('vDi') / SET_SIZE,
    redstone:              gi('vRe') / SET_SIZE,
    lapis:                 gi('vLa') / SET_SIZE,
    amethyst:              gi('vAm') / SET_SIZE,
    etc:                   gi('vEt') / SET_SIZE,
  };
}

export function vanillaCost(type) {
  const vp  = vPrices();
  const rec = RECIPES[type];
  if (!rec) return 0;
  return Object.entries(rec.vanilla).reduce((sum, [mat, qty]) => {
    return sum + qty * (vp[mat] || 0);
  }, 0);
}

export function onSkillChange() {
  const furnaceLv   = gi('skillFurnace');
  const ingotSellLv = gi('skillIngotSell');

  const furnaceRed = SKILLS.FURNACE.reductionPct[furnaceLv]  ?? 0;
  const ingotBonus = SKILLS.INGOT_SELL.bonusPct[ingotSellLv] ?? 0;

  document.getElementById('skillFurnaceInfo').textContent =
    furnaceLv === 0 ? '기본 (감소 없음)' : `Lv${furnaceLv} — 제작시간 ${furnaceRed}% 감소`;

  document.getElementById('skillIngotSellInfo').textContent =
    ingotSellLv === 0 ? '기본 (보너스 없음)' : `Lv${ingotSellLv} — 주괴 판매가 ${ingotBonus}% 증가`;

  // 탭 전체 재계산 — 순환 import 방지를 위해 동적 import 사용
  import('./tabs.js').then(({ cs, cl, co }) => { cs(); cl(); co(); });
}