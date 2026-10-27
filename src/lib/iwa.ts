import { OTHER_IWA } from './labels.ts';

export type RankedIwa = { id: string; value: number; rank: number };

/**
 * 個別 IWA を構成比の降順に順位付けする（同値は同順位）。
 * `Other IWA` は低頻度 IWA の集約カテゴリなので順位に含めず、別に返す。
 */
export function rankIwa(ids: string[], values: number[]): { ranked: RankedIwa[]; other: number | undefined } {
  const rows = ids
    .map((id, i) => ({ id, value: values[i] ?? 0 }))
    .filter((r) => r.id !== OTHER_IWA)
    .sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
  const ranked: RankedIwa[] = [];
  for (const [i, r] of rows.entries()) {
    const prev = ranked[i - 1];
    ranked.push({ ...r, rank: prev && prev.value === r.value ? prev.rank : i + 1 });
  }
  const otherIndex = ids.indexOf(OTHER_IWA);
  return { ranked, other: otherIndex >= 0 ? values[otherIndex] : undefined };
}

/** 各四半期の順位表から、指定 IWA の順位を四半期順に取り出す。 */
export function rankHistory(
  ids: string[],
  quarters: Record<string, number[]>,
  periods: string[],
  id: string,
): (number | null)[] {
  return periods.map((q) => {
    const values = quarters[q];
    if (!values) return null;
    return rankIwa(ids, values).ranked.find((r) => r.id === id)?.rank ?? null;
  });
}
