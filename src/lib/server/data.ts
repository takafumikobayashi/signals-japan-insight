/**
 * ビルド時（プリレンダー時）だけに使う、data/processed/<release>/ の読み込み。
 * 値は変換・再集計せず、ページが必要とする地域・区分に絞って渡す。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DataInfo, IwaCountryData, IwaLabel, MonthlyScopeData } from '$lib/types.ts';

type Series<T> = Record<string, Record<string, T>>;
type Dataset<T> = { periods: string[]; categories: Record<string, string[]>; scopes: string[]; series: Series<T> };
type Manifest = {
  release: string;
  retrievedAt: string;
  attribution: string;
  citation: string;
  license: { name: string; url: string };
  pages: string[];
  csvZip: { url: string };
  dataDictionary: { url: string };
};

const { release } = JSON.parse(readFileSync('data/source.json', 'utf8')) as { release: string };
const dir = join('data', 'processed', release);
const cache = new Map<string, unknown>();

function load<T>(name: string): T {
  if (!cache.has(name)) cache.set(name, JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8')));
  return cache.get(name) as T;
}

const workShare = () => load<Dataset<Record<string, number>>>('work-share-by-month');
const workTopic = () => load<Dataset<Record<string, Record<string, number>>>>('work-topic-by-month');
const workIntent = () => load<Dataset<Record<string, Record<string, number>>>>('work-intent-by-month');
const iwa = () => load<Dataset<number[]>>('iwa-by-country-quarter');
const ranks = () => load<Dataset<number>>('country-rank-by-quarter');

/** 仕事関連（work_related=1）の値だけを取り出す。区分が非公開の月はキーを作らない。 */
function workRelatedOnly<T>(byMonth: Record<string, Record<string, T>> | undefined): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [month, byWr] of Object.entries(byMonth ?? {})) {
    const v = byWr['1'];
    if (v !== undefined) out[month] = v;
  }
  return out;
}

export function getDataInfo(): DataInfo {
  const m = load<Manifest>('data-manifest');
  return {
    release: m.release,
    retrievedAt: m.retrievedAt,
    attribution: m.attribution,
    citation: m.citation,
    license: m.license,
    pages: m.pages,
    csvZipUrl: m.csvZip.url,
    dictionaryUrl: m.dataDictionary.url,
    months: workShare().periods,
    quarters: iwa().periods,
  };
}

/** 月次データを持つ地域（global と国）。 */
export function monthlyScopes(): string[] {
  const scopes = new Set([...workShare().scopes, ...workTopic().scopes, ...workIntent().scopes]);
  return [...scopes];
}

export function getMonthly(scope: string): MonthlyScopeData {
  return {
    scope,
    workShare: workRelatedOnly(workShare().series[scope]),
    topics: workRelatedOnly(workTopic().series[scope]),
    intent: workRelatedOnly(workIntent().series[scope]),
  };
}

export function iwaIds(): string[] {
  return iwa().categories.iwa_cleaned ?? [];
}

/** IWA データを持つ国と、その国が公開されている四半期。 */
export function iwaCountries(): { country: string; quarters: string[] }[] {
  return Object.entries(iwa().series).map(([country, byQuarter]) => ({ country, quarters: Object.keys(byQuarter) }));
}

export function getIwa(country: string): IwaCountryData {
  return { country, quarters: iwa().series[country] ?? {} };
}

export function getIwaLabels(): IwaLabel[] {
  return load<{ labels: IwaLabel[] }>('iwa-labels').labels;
}

/** 人口当たりメッセージ量の国別順位と、各四半期の順位対象国数。 */
export function getRank(country: string): { rank: Record<string, number>; countries: Record<string, number> } {
  const { series, periods } = ranks();
  const countries = Object.fromEntries(
    periods.map((q) => [q, Object.values(series).filter((byQ) => byQ[q] !== undefined).length]),
  );
  return { rank: series[country] ?? {}, countries };
}
