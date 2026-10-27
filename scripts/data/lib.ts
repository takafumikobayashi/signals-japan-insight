import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SOURCE_CONFIG = join(ROOT, 'data', 'source.json');
export const RAW_DIR = join(ROOT, 'data', 'raw');
export const RAW_CSV_DIR = join(RAW_DIR, 'csv');
export const RAW_ZIP = join(RAW_DIR, 'data-download-csv.zip');
export const RAW_DICTIONARY = join(RAW_DIR, 'data-dictionary.pdf');
export const IWA_LABELS_CSV = join(ROOT, 'data', 'reference', 'iwa-labels.csv');
export const OTHER_IWA = 'Other IWA';

export type SourceConfig = {
  release: string;
  retrievedAt: string;
  csvZip: { url: string; sha256: string };
  dataDictionary: { url: string; sha256: string };
  pages: string[];
  license: { name: string; url: string };
  citation: string;
};

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export function readSourceConfig(): SourceConfig {
  return readJson<SourceConfig>(SOURCE_CONFIG);
}

export function processedDir(release: string): string {
  return join(ROOT, 'data', 'processed', release);
}

export function sha256(data: Uint8Array | string): string {
  return createHash('sha256').update(data).digest('hex');
}

export function fail(message: string): never {
  console.error(`エラー: ${message}`);
  process.exit(1);
}

/** RFC 4180 形式の CSV を解析する。引用符付きフィールドと CRLF に対応。 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const src = text.startsWith('﻿') ? text.slice(1) : text;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (inQuotes) throw new Error('CSV の引用符が閉じられていません');
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export type CsvTable = { header: string[]; rows: string[][]; sha256: string };

export function readCsvTable(path: string): CsvTable {
  const buf = readFileSync(path);
  const [header, ...rows] = parseCsv(buf.toString('utf8'));
  if (!header) throw new Error(`${path} が空です`);
  for (const [i, r] of rows.entries()) {
    if (r.length !== header.length) {
      throw new Error(`${path} の ${i + 2} 行目の列数が ${r.length} です（期待値 ${header.length}）`);
    }
  }
  return { header, rows, sha256: sha256(buf) };
}

export function csvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export type IwaLabel = { id: string; labelEn: string; labelJa: string };

export function readIwaLabels(): IwaLabel[] {
  const { header, rows } = readCsvTable(IWA_LABELS_CSV);
  if (header.join(',') !== 'iwa_id,label_en,label_ja') {
    throw new Error(`iwa-labels.csv のヘッダーが想定と異なります: ${header.join(',')}`);
  }
  return rows.map(([id = '', labelEn = '', labelJa = '']) => ({ id, labelEn, labelJa }));
}
