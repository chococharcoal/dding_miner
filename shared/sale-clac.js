/* ════════════════════════════════════════════════════════════════════
   shared/sale-calc.js — 판매가/대리판매 공통 함수 (ocean·farming 중복 → 통합)
   실제 코드 그대로 추출. 동작 동일.
   - calcProxyN : n + ceil(n×fee) = target → n 역산
   - proxyCalc  : 대리판매 송금/수수료/이득 계산
   - resultBox / saleRow : 결과 표시 HTML 헬퍼
   fee 는 config.js 의 MARKET_FEE(0.05) 를 주입해서 사용 권장.
   ════════════════════════════════════════════════════════════════════ */

export const fk = n => Math.round(n).toLocaleString('ko-KR');

export const saleRow = (label, value, style = '') =>
  `<div class="rrow"><span class="rl">${label}</span><span class="rv"${style ? ` style="${style}"` : ''}>${value}</span></div>`;

/** n + ceil(n×fee) = target 를 만족하는 최소 n */
export function calcProxyN(target, fee = 0.05) {
  if (target <= 0) return 0;
  let n = Math.floor(target / (1 + fee));
  while (n + Math.ceil(n * fee) < target) n++;
  return (n + Math.ceil(n * fee) === target) ? n : n + 1;
}

/** 대리판매 공통 계산 */
export function proxyCalc({ sellerTotal, agreeTotal, feeSeller }, fee = 0.05) {
  if (feeSeller) {
    const f = Math.ceil(agreeTotal * fee);
    return { clientGet: agreeTotal, sellerProfit: sellerTotal - agreeTotal - f, fee: f };
  } else {
    const n = calcProxyN(agreeTotal, fee);
    const f = Math.ceil(n * fee);
    return { clientGet: n, sellerProfit: sellerTotal - agreeTotal, fee: f };
  }
}

/** 좌우 2값 결과 박스 */
export function resultBox(leftLabel, leftVal, leftColor, rightLabel, rightVal, rightColor, footer = '') {
  return `<div class="result-box">
    <div style="display:flex;gap:0;align-items:stretch">
      <div style="flex:1;text-align:center;padding:4px 8px">
        <div class="rb-label">${leftLabel}</div>
        <div class="rb-value" style="color:${leftColor};font-size:18px">${leftVal}</div>
      </div>
      <div style="width:1px;background:var(--bdr2);margin:4px 0"></div>
      <div style="flex:1;text-align:center;padding:4px 8px">
        <div class="rb-label">${rightLabel}</div>
        <div class="rb-value" style="color:${rightColor};font-size:18px">${rightVal}</div>
      </div>
    </div>
    ${footer ? `<div style="text-align:center;margin-top:6px;padding-top:6px;border-top:1px dashed var(--bdr2);font-size:11px;color:var(--muted)">${footer}</div>` : ''}
  </div>`;
}

if (typeof window !== 'undefined') Object.assign(window, { fk, saleRow, calcProxyN, proxyCalc, resultBox });