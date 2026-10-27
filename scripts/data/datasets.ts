/**
 * MVP で使う公式 CSV と、生成する JSON データセットの対応。
 * 列名・値は公式 CSV の原表記を保ち、分母が変わる再集計はしない。
 */

export type Scope = 'global' | 'country';

export type SourceFile = { file: string; scope: Scope };

export type DatasetSpec = {
  id: string;
  title: string;
  period: 'month' | 'quarter';
  /** 指標列以外のカテゴリ列（期間・国を除く）。最後の列が構成比の内訳。 */
  dimensions: string[];
  metric: 'share_of_messages' | 'rank';
  /** array: 最後の次元のカテゴリ順に並べた配列。nested: カテゴリ値をキーとする入れ子オブジェクト。 */
  layout: 'array' | 'nested' | 'value';
  denominator: string;
  /** 同じ分母を持つ行の合計と 1 との許容差。公式値の丸め幅から決める。 */
  sumTolerance?: number;
  sources: SourceFile[];
  notes: string[];
};

export const DATASETS: DatasetSpec[] = [
  {
    id: 'iwa-by-country-quarter',
    title: '国・四半期別 仕事関連メッセージの O*NET IWA 構成比',
    period: 'quarter',
    dimensions: ['iwa_cleaned'],
    metric: 'share_of_messages',
    layout: 'array',
    denominator: 'その国・四半期の仕事関連メッセージ',
    // 165 値 × 小数第5位の丸め（最大 ±0.000825）
    sumTolerance: 0.001,
    sources: [{ file: 'share_of_work_related_messages_by_onet_iwa_country_quarter.csv', scope: 'country' }],
    notes: [
      '公式 CSV に世界（global）の IWA 集計は存在しない。国別構成比の平均などで世界値を作らない。',
      '`Other IWA` は低頻度 IWA の集約カテゴリで、他分類へ再配分しない。',
      '公開国は四半期ごとに異なる。series に存在しない国・四半期は非公開であり、0 ではない。',
    ],
  },
  {
    id: 'work-share-by-month',
    title: '月別 仕事関連・非仕事関連メッセージの構成比',
    period: 'month',
    dimensions: ['work_related'],
    metric: 'share_of_messages',
    layout: 'nested',
    denominator: 'その地域・月の全メッセージ',
    // 2 値 × 小数第3位の丸め
    sumTolerance: 0.001,
    sources: [
      { file: 'share_of_messages_by_work_related_month.csv', scope: 'global' },
      { file: 'share_of_messages_by_work_related_country_month.csv', scope: 'country' },
    ],
    notes: ['work_related=1 が仕事関連（分類器による推定）。'],
  },
  {
    id: 'work-topic-by-month',
    title: '月別 仕事関連区分ごとのトピック構成比',
    period: 'month',
    dimensions: ['work_related', 'topic'],
    metric: 'share_of_messages',
    layout: 'nested',
    denominator: 'その地域・月・work_related 区分のメッセージ（仕事関連は work_related=1）',
    // 7 値 × 小数第3位の丸め（最大 ±0.0035）
    sumTolerance: 0.004,
    sources: [
      { file: 'share_of_messages_by_topic_work_related_month.csv', scope: 'global' },
      { file: 'share_of_messages_by_topic_work_related_country_month.csv', scope: 'country' },
    ],
    notes: [
      '公開国は月ごとに異なる。series に存在しない国・月は非公開であり、0 ではない。',
      '小さい国では work_related の片方だけが公開される月がある。欠けた区分は非公開であり、0 ではない。',
    ],
  },
  {
    id: 'work-intent-by-month',
    title: '月別 仕事関連区分ごとの Ask / Do / Express 構成比',
    period: 'month',
    dimensions: ['work_related', 'ask_do_express'],
    metric: 'share_of_messages',
    layout: 'nested',
    denominator: 'その地域・月・work_related 区分のメッセージ（仕事関連は work_related=1）',
    // 3 値 × 小数第3位の丸め
    sumTolerance: 0.002,
    sources: [
      { file: 'share_of_messages_by_work_related_ask_do_express_month.csv', scope: 'global' },
      { file: 'share_of_messages_by_work_related_ask_do_express_country_month.csv', scope: 'country' },
    ],
    notes: [
      '公開国は月ごとに異なる。series に存在しない国・月は非公開であり、0 ではない。',
      '小さい国では work_related の片方だけが公開される月がある。欠けた区分は非公開であり、0 ではない。',
    ],
  },
  {
    id: 'country-rank-by-quarter',
    title: '四半期別 人口当たりメッセージ量の国別順位',
    period: 'quarter',
    dimensions: [],
    metric: 'rank',
    layout: 'value',
    denominator: '順位（1 が最上位）。人口で正規化したメッセージ量に基づき、利用者数・普及率ではない',
    sources: [{ file: 'share_of_messages_by_country_quarter_rank.csv', scope: 'country' }],
    notes: ['補足指標。絶対量・利用者数は公開されていない。'],
  },
];

export function expectedHeader(spec: DatasetSpec, scope: Scope): string[] {
  return [spec.period, ...(scope === 'country' ? ['country'] : []), ...spec.dimensions, spec.metric];
}

export const GLOBAL_SCOPE = 'global';
