/** 0〜1 の構成比を % 表記にする。 */
export function pct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined) return '非公開';
  return `${(value * 100).toFixed(digits)}%`;
}

/** 構成比の差を % ポイントで表す（符号付き）。 */
export function pt(diff: number | null | undefined, digits = 1): string {
  if (diff === null || diff === undefined) return '—';
  const v = Number((diff * 100).toFixed(digits));
  if (v === 0) return `±${(0).toFixed(digits)}pt`;
  return `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(digits)}pt`;
}

/** '2026-09-01' → '2026年9月' */
export function formatMonth(period: string): string {
  const [y, m] = period.split('-');
  return `${y}年${Number(m)}月`;
}

/** '2026-09-01' → '26/9'（軸ラベル用） */
export function formatMonthShort(period: string): string {
  const [y, m] = period.split('-');
  return `${y?.slice(2)}/${Number(m)}`;
}

/** '2026-07-01' → '2026年第3四半期' */
export function formatQuarter(period: string): string {
  const [y, m] = period.split('-');
  return `${y}年第${Math.floor((Number(m) - 1) / 3) + 1}四半期`;
}

/** '2026-07-01' → '2026 Q3'（軸ラベル用） */
export function formatQuarterShort(period: string): string {
  const [y, m] = period.split('-');
  return `${y} Q${Math.floor((Number(m) - 1) / 3) + 1}`;
}
