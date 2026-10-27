/**
 * 公式 CSV ZIP とデータ辞書を取得し、data/source.json に固定した SHA-256 と照合して data/raw/ に展開する。
 *
 *   npm run data:fetch                # 固定版と一致しなければ失敗
 *   npm run data:fetch -- --accept-new  # 公式更新を確認したうえで、ハッシュと取得日を更新
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { unzipSync } from 'fflate';
import {
  RAW_CSV_DIR,
  RAW_DICTIONARY,
  RAW_DIR,
  RAW_ZIP,
  SOURCE_CONFIG,
  fail,
  readSourceConfig,
  sha256,
} from './lib.ts';

const acceptNew = process.argv.includes('--accept-new');
const config = readSourceConfig();

async function download(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) fail(`${url} の取得に失敗しました（HTTP ${res.status}）`);
  return new Uint8Array(await res.arrayBuffer());
}

const zip = await download(config.csvZip.url);
const dictionary = await download(config.dataDictionary.url);
const zipHash = sha256(zip);
const dictionaryHash = sha256(dictionary);

const changed = zipHash !== config.csvZip.sha256 || dictionaryHash !== config.dataDictionary.sha256;
if (changed && !acceptNew) {
  fail(
    [
      `公式ファイルが固定した ${config.release} と一致しません。公式データが更新された可能性があります。`,
      `  ZIP:  ${zipHash}（固定値 ${config.csvZip.sha256}）`,
      `  辞書: ${dictionaryHash}（固定値 ${config.dataDictionary.sha256}）`,
      'リリース版・列・期間・ライセンスを公式ページで確認し、release を更新してから --accept-new で再実行してください。',
    ].join('\n'),
  );
}

rmSync(RAW_DIR, { recursive: true, force: true });
mkdirSync(RAW_CSV_DIR, { recursive: true });
writeFileSync(RAW_ZIP, zip);
writeFileSync(RAW_DICTIONARY, dictionary);

// ZIP 内のパスは信用せず、CSV と PDF のファイル名だけを取り出す
const entries = unzipSync(zip);
let csvCount = 0;
for (const [name, data] of Object.entries(entries)) {
  if (name.endsWith('/')) continue;
  const file = basename(name);
  if (!/^[\w.-]+\.(csv|pdf)$/.test(file)) fail(`想定外の ZIP エントリ: ${name}`);
  writeFileSync(join(RAW_CSV_DIR, file), data);
  if (file.endsWith('.csv')) csvCount++;
}

if (changed) {
  config.csvZip.sha256 = zipHash;
  config.dataDictionary.sha256 = dictionaryHash;
  config.retrievedAt = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  writeFileSync(SOURCE_CONFIG, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`data/source.json のハッシュと取得日（${config.retrievedAt}）を更新しました。release が正しいか確認してください。`);
}

console.log(`OpenAI Signals ${config.release}: CSV ${csvCount} ファイルを data/raw/csv/ に展開しました。`);
