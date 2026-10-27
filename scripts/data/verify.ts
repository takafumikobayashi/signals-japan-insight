/**
 * 生成 JSON を公式 CSV と突き合わせる。全行の値の一致、行数、期間、国、IWA 数、構成比の合計範囲、
 * 日本のカバレッジ、ラベル、manifest の出典情報を確認する。
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATASETS, GLOBAL_SCOPE } from './datasets.ts';
import { RAW_ZIP, fail, processedDir, readJson, readSourceConfig, sha256 } from './lib.ts';
import { loadDataset, recordKey, sumRange, type DataRecord } from './records.ts';

type Dataset = {
  release: string;
  layout: 'array' | 'nested' | 'value';
  periods: string[];
  categories: Record<string, string[]>;
  sources: { file: string; sha256: string }[];
  series: Record<string, Record<string, unknown>>;
};
type Manifest = {
  release: string;
  retrievedAt: string;
  datasets: { id: string; records: number; sumRange?: { min: number; max: number; groups: number } }[];
};
type Labels = { labels: { id: string; labelEn: string; labelJa: string }[] };

const config = readSourceConfig();
const dir = processedDir(config.release);
const errors: string[] = [];
const check = (ok: boolean, message: string) => {
  if (!ok) errors.push(message);
};

if (!existsSync(RAW_ZIP)) fail('data/raw/ がありません。先に npm run data:fetch を実行してください。');
check(sha256(readFileSync(RAW_ZIP)) === config.csvZip.sha256, 'data/raw の ZIP が data/source.json の SHA-256 と一致しません');

const manifest = readJson<Manifest>(join(dir, 'data-manifest.json'));
check(manifest.release === config.release, 'manifest の release が source.json と異なります');
check(manifest.retrievedAt === config.retrievedAt, 'manifest の取得日が source.json と異なります');

/** JSON の series から 1 レコードに対応する値を取り出す。 */
function lookup(json: Dataset, dims: string[], r: DataRecord): unknown {
  const node = json.series[r.scope]?.[r.period];
  if (json.layout === 'value') return node;
  if (json.layout === 'array') {
    const index = json.categories[dims[0] ?? '']?.indexOf(r.keys[0] ?? '') ?? -1;
    return Array.isArray(node) ? node[index] : undefined;
  }
  return r.keys.reduce<unknown>((n, k) => (n as Record<string, unknown> | undefined)?.[k], node);
}

function countLeaves(node: unknown): number {
  if (typeof node === 'number') return 1;
  if (node === null || node === undefined) return 0;
  return Object.values(node as object).reduce((sum: number, v) => sum + countLeaves(v), 0);
}

for (const spec of DATASETS) {
  const json = readJson<Dataset>(join(dir, `${spec.id}.json`));
  const { records, sources } = loadDataset(spec);
  const label = spec.id;

  check(json.release === config.release, `${label}: release が一致しません`);
  for (const s of sources) {
    check(json.sources.find((j) => j.file === s.file)?.sha256 === s.sha256, `${label}: ${s.file} の SHA-256 が生成時と異なります`);
  }

  // 全行の値が CSV と完全一致し、余分な値がない
  let mismatches = 0;
  for (const r of records) {
    if (lookup(json, spec.dimensions, r) !== r.value) {
      if (mismatches++ < 5) errors.push(`${label}: ${recordKey(r)} の値が CSV（${r.value}）と一致しません`);
    }
  }
  const leaves = countLeaves(json.series);
  check(leaves === records.length, `${label}: JSON の値の数 ${leaves} が CSV の行数 ${records.length} と異なります`);

  const periods = [...new Set(records.map((r) => r.period))].sort();
  check(JSON.stringify(json.periods) === JSON.stringify(periods), `${label}: 期間一覧が CSV と異なります`);
  for (const [i, d] of spec.dimensions.entries()) {
    const values = [...new Set(records.map((r) => r.keys[i]))].sort();
    check(JSON.stringify(json.categories[d]) === JSON.stringify(values), `${label}: ${d} のカテゴリが CSV と異なります`);
  }

  // 公表された分母グループ（国・期間・最後以外の次元）では内訳カテゴリがすべてそろう。
  // 小さい国では work_related の片方だけが公開される月があるため、グループ単位で確認する。
  const perGroup = new Map<string, number>();
  for (const r of records) {
    const group = [r.scope, r.period, ...r.keys.slice(0, -1)].join('|');
    perGroup.set(group, (perGroup.get(group) ?? 0) + 1);
  }
  const expectedPerGroup = json.categories[spec.dimensions.at(-1) ?? '']?.length ?? 1;
  for (const [group, n] of perGroup) {
    check(n === expectedPerGroup, `${label}: ${group} のカテゴリ数が ${n}（期待値 ${expectedPerGroup}）です`);
  }

  const hasGlobal = records.some((r) => r.scope === GLOBAL_SCOPE);
  check(hasGlobal === spec.sources.some((s) => s.scope === 'global'), `${label}: global の有無が公式ファイル構成と異なります`);

  // 日本は公開された全期間に存在する
  const jpPeriods = new Set(records.filter((r) => r.scope === 'JP').map((r) => r.period));
  check(jpPeriods.size === periods.length, `${label}: JP の期間が ${jpPeriods.size} / ${periods.length} です`);

  const entry = manifest.datasets.find((d) => d.id === spec.id);
  check(entry?.records === records.length, `${label}: manifest の行数が一致しません`);
  if (spec.sumTolerance !== undefined) {
    const range = sumRange(records);
    check(JSON.stringify(entry?.sumRange) === JSON.stringify(range), `${label}: manifest の合計範囲が一致しません`);
    check(
      Math.abs(range.min - 1) <= spec.sumTolerance && Math.abs(range.max - 1) <= spec.sumTolerance,
      `${label}: 構成比の合計 ${range.min}〜${range.max} が許容差 ±${spec.sumTolerance} を超えています`,
    );
    console.log(`${label}: ${records.length} 行一致、${periods.length} 期間、合計 ${range.min}〜${range.max}（${range.groups} 群）`);
  } else {
    console.log(`${label}: ${records.length} 行一致、${periods.length} 期間`);
  }

  if (spec.id === 'iwa-by-country-quarter') {
    const ids = json.categories.iwa_cleaned ?? [];
    const labels = readJson<Labels>(join(dir, 'iwa-labels.json')).labels;
    check(
      JSON.stringify(labels.map((l) => l.id)) === JSON.stringify(ids),
      'iwa-labels.json の ID が IWA データのカテゴリと一致しません',
    );
    check(labels.every((l) => l.labelEn && l.labelJa), 'iwa-labels.json に空のラベルがあります');
    console.log(`  IWA ${ids.length} 分類（Other IWA を含む）、JP ${jpPeriods.size} 四半期`);
  }
}

if (errors.length > 0) fail(`検証に失敗しました（${errors.length} 件）\n${errors.map((e) => `  - ${e}`).join('\n')}`);
console.log(`検証完了: OpenAI Signals ${config.release}（取得日 ${config.retrievedAt}）`);
