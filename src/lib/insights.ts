/** 独自分析の一覧。トップページのカードとナビゲーションで使う。新しい分析はここに足す。 */
export type Insight = {
  slug: string;
  href: string;
  title: string;
  description: string;
  /** 組み合わせたデータ */
  sources: string;
};

export const INSIGHTS: Insight[] = [
  {
    slug: 'calendar',
    href: '/insights/calendar',
    title: 'ChatGPT の使われ方に、日本の学期暦が見えてくる？',
    description:
      '18-24歳のメッセージの割合は、日本の春休みと夏休みの時期に下がる傾向が見られました。夏休み・GW・年末年始の動きも、世界の国々と比べています。',
    sources: 'OpenAI Signals × 内閣府の祝日データ',
  },
];
