/**
 * 公式カテゴリの日本語表示名。分類の定義は公式の英語原名に従い、原名も画面に併記する。
 */

export const TOPICS = [
  'Writing',
  'Practical Guidance',
  'Seeking information',
  'Technical help',
  'Multimedia',
  'Self-expression',
  'Other/Unknown',
] as const;

export const TOPIC_LABELS: Record<string, string> = {
  Writing: '文章の作成・編集',
  'Practical Guidance': '実用的なアドバイス',
  'Seeking information': '情報探索',
  'Technical help': '技術的な支援',
  Multimedia: 'マルチメディア',
  'Self-expression': '自己表現',
  'Other/Unknown': 'その他・不明',
};

export const INTENTS = ['asking', 'doing', 'expressing'] as const;

export const INTENT_LABELS: Record<string, string> = {
  asking: 'Ask（尋ねる）',
  doing: 'Do（作業を依頼する）',
  expressing: 'Express（表現する）',
};

export const OTHER_IWA = 'Other IWA';

const regionNames = new Intl.DisplayNames(['ja'], { type: 'region' });

/** ISO 3166-1 alpha-2 の国コードを日本語名にする。'global' は公式グローバル集計。 */
export function scopeName(scope: string): string {
  if (scope === 'global') return '世界（公式グローバル集計）';
  try {
    return regionNames.of(scope) ?? scope;
  } catch {
    return scope;
  }
}

export function sortByCountryName(codes: string[]): string[] {
  return [...codes].sort((a, b) => scopeName(a).localeCompare(scopeName(b), 'ja'));
}
