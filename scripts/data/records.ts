/** 公式 CSV を検証し、データセット共通のレコードに変換する。build と verify で共有する。 */
import { join } from 'node:path';
import { GLOBAL_SCOPE, expectedHeader, type DatasetSpec, type Scope } from './datasets.ts';
import { RAW_CSV_DIR, fail, readCsvTable, type CsvTable } from './lib.ts';

export type DataRecord = { scope: string; period: string; keys: string[]; value: number };

export type SourceSummary = { file: string; scope: Scope; sha256: string; header: string[]; rows: number };

const PERIOD_PATTERN = { month: /^\d{4}-(0[1-9]|1[0-2])-01$/, quarter: /^\d{4}-(01|04|07|10)-01$/ };
const VALUE_PATTERN = { share_of_messages: /^[01]\.\d+$/, rank: /^[1-9]\d*$/ };

/** 公式 CSV 1 ファイルを検証し、データセット共通のレコードに変換する。 */
export function toRecords(spec: DatasetSpec, scope: Scope, table: CsvTable, file: string): DataRecord[] {
  const header = expectedHeader(spec, scope);
  if (table.header.join(',') !== header.join(',')) {
    fail(`${file} のヘッダーが想定と異なります。\n  実際: ${table.header.join(',')}\n  想定: ${header.join(',')}`);
  }
  return table.rows.map((row, i) => {
    const line = `${file} ${i + 2} 行目`;
    const [period = '', ...rest] = row;
    const country = scope === 'country' ? rest.shift() ?? '' : GLOBAL_SCOPE;
    const raw = rest.pop() ?? '';
    if (!PERIOD_PATTERN[spec.period].test(period)) fail(`${line}: ${spec.period} の値が不正です: ${period}`);
    if (scope === 'country' && !/^[A-Z]{2}$/.test(country)) fail(`${line}: country の値が不正です: ${country}`);
    if (rest.some((k) => k === '')) fail(`${line}: カテゴリ列が空です`);
    if (!VALUE_PATTERN[spec.metric].test(raw)) fail(`${line}: ${spec.metric} の値が不正です: ${raw}`);
    const value = Number(raw);
    if (spec.metric === 'share_of_messages' && value > 1) fail(`${line}: 構成比が 1 を超えています: ${raw}`);
    return { scope: country, period, keys: rest, value };
  });
}

export function recordKey(r: Pick<DataRecord, 'scope' | 'period' | 'keys'>): string {
  return [r.scope, r.period, ...r.keys].join('|');
}

/** 同じ分母（国・期間・最後以外の次元）ごとの構成比合計の範囲。 */
export function sumRange(records: DataRecord[]): { min: number; max: number; groups: number } {
  const sums = new Map<string, number>();
  for (const r of records) {
    const key = [r.scope, r.period, ...r.keys.slice(0, -1)].join('|');
    sums.set(key, (sums.get(key) ?? 0) + r.value);
  }
  const values = [...sums.values()].map((v) => Math.round(v * 1e6) / 1e6);
  return { min: Math.min(...values), max: Math.max(...values), groups: values.length };
}

export function loadDataset(spec: DatasetSpec): { records: DataRecord[]; sources: SourceSummary[] } {
  const records: DataRecord[] = [];
  const sources: SourceSummary[] = [];
  for (const { file, scope } of spec.sources) {
    const table = readCsvTable(join(RAW_CSV_DIR, file));
    records.push(...toRecords(spec, scope, table, file));
    sources.push({ file, scope, sha256: table.sha256, header: table.header, rows: table.rows.length });
  }
  const seen = new Set<string>();
  for (const r of records) {
    const key = recordKey(r);
    if (seen.has(key)) fail(`${spec.id}: キーが重複しています: ${key}`);
    seen.add(key);
  }
  return { records, sources };
}
