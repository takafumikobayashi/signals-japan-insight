/**
 * data/raw/csv/ の公式 CSV を検証し、ダッシュボード用の JSON を data/processed/<release>/ に生成する。
 * 値は CSV の数値をそのまま使い、補間・再配分・再集計はしない。
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATASETS, GLOBAL_SCOPE, type DatasetSpec } from './datasets.ts';
import { OTHER_IWA, fail, processedDir, readIwaLabels, readSourceConfig } from './lib.ts';
import { loadDataset, sumRange, type DataRecord } from './records.ts';

function sortScopes(scopes: Iterable<string>): string[] {
  return [...new Set(scopes)].sort((a, b) => (a === GLOBAL_SCOPE ? -1 : b === GLOBAL_SCOPE ? 1 : a.localeCompare(b)));
}

function buildSeries(spec: DatasetSpec, records: DataRecord[], categories: Record<string, string[]>) {
  const series: Record<string, Record<string, unknown>> = {};
  const lastCategories = categories[spec.dimensions.at(-1) ?? ''] ?? [];
  for (const r of records) {
    const byPeriod = (series[r.scope] ??= {});
    if (spec.layout === 'value') {
      byPeriod[r.period] = r.value;
    } else if (spec.layout === 'array') {
      const arr = (byPeriod[r.period] ??= lastCategories.map(() => null)) as (number | null)[];
      arr[lastCategories.indexOf(r.keys[0] ?? '')] = r.value;
    } else {
      let node = (byPeriod[r.period] ??= {}) as Record<string, unknown>;
      for (const k of r.keys.slice(0, -1)) node = (node[k] ??= {}) as Record<string, unknown>;
      node[r.keys.at(-1) ?? ''] = r.value;
    }
  }
  // 期間を時系列順に並べる
  for (const scope of Object.keys(series)) {
    const byPeriod = series[scope] ?? {};
    series[scope] = Object.fromEntries(Object.keys(byPeriod).sort().map((p) => [p, byPeriod[p]]));
  }
  return Object.fromEntries(sortScopes(Object.keys(series)).map((s) => [s, series[s]]));
}

function main() {
  const config = readSourceConfig();
  const outDir = processedDir(config.release);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const manifestDatasets = [];
  let iwaIds: string[] = [];

  for (const spec of DATASETS) {
    const { records, sources } = loadDataset(spec);
    const categories = Object.fromEntries(
      spec.dimensions.map((d, i) => [d, [...new Set(records.map((r) => r.keys[i] ?? ''))].sort()]),
    );
    const periods = [...new Set(records.map((r) => r.period))].sort();
    const scopes = sortScopes(records.map((r) => r.scope));
    if (spec.id === 'iwa-by-country-quarter') {
      if (scopes.includes(GLOBAL_SCOPE)) fail('IWA データに global が含まれています');
      iwaIds = categories.iwa_cleaned ?? [];
    }

    const range = spec.sumTolerance === undefined ? undefined : sumRange(records);
    if (range && spec.sumTolerance !== undefined) {
      if (Math.abs(range.min - 1) > spec.sumTolerance || Math.abs(range.max - 1) > spec.sumTolerance) {
        fail(`${spec.id}: 構成比の合計が許容範囲外です（${range.min}〜${range.max}、許容差 ±${spec.sumTolerance}）`);
      }
    }

    const jpPeriods = periods.filter((p) => records.some((r) => r.scope === 'JP' && r.period === p));
    const dataset = {
      dataset: spec.id,
      title: spec.title,
      release: config.release,
      metric: spec.metric,
      denominator: spec.denominator,
      period: spec.period,
      periods,
      dimensions: spec.dimensions,
      categories,
      layout: spec.layout,
      scopes,
      notes: spec.notes,
      sources: sources.map(({ file, scope, sha256 }) => ({ file, scope, sha256 })),
      series: buildSeries(spec, records, categories),
    };
    const file = `${spec.id}.json`;
    writeFileSync(join(outDir, file), `${JSON.stringify(dataset)}\n`);

    manifestDatasets.push({
      id: spec.id,
      file,
      title: spec.title,
      metric: spec.metric,
      denominator: spec.denominator,
      period: spec.period,
      periodRange: { first: periods[0], last: periods.at(-1), count: periods.length },
      countries: scopes.filter((s) => s !== GLOBAL_SCOPE).length,
      hasGlobal: scopes.includes(GLOBAL_SCOPE),
      records: records.length,
      sumRange: range,
      japan: { periods: jpPeriods.length, first: jpPeriods[0], last: jpPeriods.at(-1) },
      sources,
    });
    console.log(`${file}: ${records.length} 行、${periods.length} 期間、${scopes.length} 地域`);
  }

  // IWA ラベル: 公式英語ラベル（データ辞書）と本プロジェクトの日本語表示名
  const labels = new Map(readIwaLabels().map((l) => [l.id, l]));
  const iwaLabels = iwaIds.map((id) => {
    const label = labels.get(id);
    if (!label?.labelEn || !label.labelJa) fail(`IWA ${id} の英語ラベルまたは日本語表示名が data/reference/iwa-labels.csv にありません`);
    return { id, labelEn: label.labelEn, labelJa: label.labelJa };
  });
  writeFileSync(
    join(outDir, 'iwa-labels.json'),
    `${JSON.stringify(
      {
        release: config.release,
        labelEnSource: `OpenAI Signals ${config.release} data dictionary（O*NET IWA の ID と記述）`,
        labelJaSource: '本プロジェクトによる非公式の日本語表示名。分類の定義は英語原文に従う。',
        otherIwa: `${OTHER_IWA} は低頻度 IWA を集約した公式カテゴリ`,
        labels: iwaLabels,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`iwa-labels.json: ${iwaLabels.length} 分類`);

  const manifest = {
    project: 'Signals Japan Insight（非公式・独立。OpenAI による運営・承認ではありません）',
    release: config.release,
    retrievedAt: config.retrievedAt,
    csvZip: config.csvZip,
    dataDictionary: config.dataDictionary,
    pages: config.pages,
    license: config.license,
    citation: config.citation,
    attribution: `出典: OpenAI Signals ${config.release}（${config.license.name}、取得日 ${config.retrievedAt}）。本プロジェクトが CSV を JSON 形式に変換しました（値の再集計はしていません）。`,
    datasets: manifestDatasets,
    iwaLabels: { file: 'iwa-labels.json', count: iwaLabels.length },
  };
  writeFileSync(join(outDir, 'data-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`data-manifest.json を data/processed/${config.release}/ に出力しました。`);
}

main();
