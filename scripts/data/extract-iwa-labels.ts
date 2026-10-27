/**
 * データ辞書の「Full list of all 332 IWA IDs and Descriptions」から英語ラベルを抽出し、
 * data/reference/iwa-labels.csv の label_en を更新する。既存の label_ja は保持する。
 *
 *   pdftotext -layout data/raw/data-dictionary.pdf data/raw/data-dictionary.txt
 *   npm run data:labels -- data/raw/data-dictionary.txt
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { IWA_LABELS_CSV, OTHER_IWA, csvField, fail, readIwaLabels } from './lib.ts';

const input = process.argv[2];
if (!input) fail('pdftotext で変換したデータ辞書のテキストファイルを指定してください');

const lines = readFileSync(input, 'utf8').replaceAll('​', '').split('\n');
const start = lines.findIndex((l) => /Full list of all \d+ IWA IDs and Descriptions/.test(l));
if (start < 0) fail('IWA 一覧の見出しが見つかりません');

const extracted = new Map<string, string>();
let current: string | undefined;
for (const line of lines.slice(start + 1)) {
  if (line.trim().startsWith('# Hints')) break;
  const m = /^\s*(4\.A\.\d\.[a-z]\.\d\.I\d{2})\s+(.*)$/.exec(line);
  if (m?.[1] && m[2] !== undefined) {
    current = m[1];
    extracted.set(current, m[2].trim());
  } else if (current && line.trim() && !/^\d+$/.test(line.trim())) {
    // 折り返された記述の続き（ページ番号行は除く）
    extracted.set(current, `${extracted.get(current)} ${line.trim()}`);
  }
}
if (extracted.size === 0) fail('IWA を抽出できませんでした');

const existing = new Map(existsSync(IWA_LABELS_CSV) ? readIwaLabels().map((l) => [l.id, l]) : []);
for (const [id, labelEn] of extracted) {
  const before = existing.get(id)?.labelEn;
  if (before && before !== labelEn) console.log(`変更: ${id}\n  旧: ${before}\n  新: ${labelEn}`);
}

const rows = [...extracted.keys()].sort().map((id) => [id, extracted.get(id) ?? '', existing.get(id)?.labelJa ?? '']);
rows.push([OTHER_IWA, OTHER_IWA, existing.get(OTHER_IWA)?.labelJa ?? '']);
const csv = ['iwa_id,label_en,label_ja', ...rows.map((r) => r.map(csvField).join(','))].join('\n');
writeFileSync(IWA_LABELS_CSV, `${csv}\n`);
console.log(`${extracted.size} 件の IWA ラベルを data/reference/iwa-labels.csv に書き出しました。`);
