<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { formatMonth, formatQuarter, pct, pt } from '$lib/format.ts';
  import { rankIwa } from '$lib/iwa.ts';
  import { TOPICS, TOPIC_LABELS } from '$lib/labels.ts';

  let { data } = $props();

  const month = $derived(data.months.at(-1) ?? '');
  const prevYearMonth = $derived(data.months[data.months.length - 13]);
  const quarter = $derived(data.quarters.at(-1) ?? '');
  const share = $derived(data.jp.workShare[month]);
  const globalShare = $derived(data.global.workShare[month]);
  const shareYearAgo = $derived(prevYearMonth ? data.jp.workShare[prevYearMonth] : undefined);
  const topTopic = $derived(
    [...TOPICS].sort((a, b) => (data.jp.topics[month]?.[b] ?? 0) - (data.jp.topics[month]?.[a] ?? 0))[0] ?? 'Writing',
  );
  const labelOf = $derived(new Map(data.labels.map((l) => [l.id, l])));
  const top5 = $derived(rankIwa(data.ids, data.jpIwa.quarters[quarter] ?? []).ranked.slice(0, 5));
  const rank = $derived(data.jpRank.rank[quarter]);
</script>

<Seo description="OpenAI Signals の公開集計をもとに、日本の ChatGPT の仕事利用を読み解く非公式・独立のダッシュボード。" />

<header class="page-head hero-head">
  <p class="eyebrow">OpenAI Signals {data.dataInfo.release} · 取得日 {data.dataInfo.retrievedAt} · 非公式</p>
  <h1>日本の ChatGPT 仕事利用を、<br class="wide-only" />公開集計から読む</h1>
  <p class="lead">
    OpenAI Signals の公開データをもとに、日本の個人向け ChatGPT に持ち込まれる仕事関連メッセージの割合・用途・職務活動を示します。
    値はすべてメッセージの構成比で、利用者数や就業者の割合ではありません。
  </p>
  <div class="actions">
    <a class="button" href="/activities">職務活動を見る</a>
    <a class="button secondary" href="/compare">国際比較</a>
  </div>
</header>

<section class="hero" aria-labelledby="hero-label">
  <p id="hero-label" class="hero-label">{formatMonth(month)}、日本の ChatGPT メッセージのうち仕事関連の割合</p>
  <p class="figure">{pct(share ?? null)}</p>
  <p class="muted">
    世界（公式グローバル集計）は {pct(globalShare ?? null)}。
    {#if shareYearAgo !== undefined && share !== undefined}
      日本の前年同月（{formatMonth(prevYearMonth ?? '')}）比 {pt(share - shareYearAgo)}。
    {/if}
    分母は各地域の全メッセージ。
  </p>
</section>

<div class="facts">
  <section class="fact" aria-labelledby="tile-topic">
    <h2 id="tile-topic" class="fact-label">仕事関連で最も多いトピック（{formatMonth(month)}）</h2>
    <p class="fact-value">{TOPIC_LABELS[topTopic]}</p>
    <p class="muted">
      {topTopic}・日本の仕事関連メッセージの {pct(data.jp.topics[month]?.[topTopic] ?? null)}（世界 {pct(
        data.global.topics[month]?.[topTopic] ?? null,
      )}）
    </p>
    <a href="/usage">日本の仕事利用</a>
  </section>

  <section class="fact" aria-labelledby="tile-iwa">
    <h2 id="tile-iwa" class="fact-label">最も多い職務活動（{formatQuarter(quarter)}）</h2>
    <p class="fact-value">{labelOf.get(top5[0]?.id ?? '')?.labelJa ?? '—'}</p>
    <p class="muted">日本の仕事関連メッセージの {pct(top5[0]?.value ?? null, 3)}・{labelOf.get(top5[0]?.id ?? '')?.labelEn}</p>
    <a href="/activities">日本の職務活動</a>
  </section>

  <section class="fact" aria-labelledby="tile-rank">
    <h2 id="tile-rank" class="fact-label">人口当たりメッセージ量の順位（{formatQuarter(quarter)}）</h2>
    <p class="fact-value">{rank ? `${rank}位` : '非公開'}</p>
    <p class="muted">{data.jpRank.countries[quarter]} の国・地域中。利用者数や普及率ではありません。</p>
    <a href="/compare">国際比較</a>
  </section>
</div>

<section class="prose block" aria-labelledby="top-iwa">
  <h2 id="top-iwa" class="section-title">{formatQuarter(quarter)}の日本の職務活動 上位 5</h2>
  <p class="muted">O*NET の中間的な職務活動（IWA）別。分母は日本の同四半期の仕事関連メッセージ。</p>
  <ol class="top5">
    {#each top5 as r (r.id)}
      {@const label = labelOf.get(r.id)}
      <li>
        <span class="rank num">{r.rank}</span>
        <span class="name">
          <a href="/activities?iwa={encodeURIComponent(r.id)}">{label?.labelJa ?? r.id}</a>
          <span class="sub">{label?.labelEn} · {r.id}</span>
        </span>
        <span class="num value">{pct(r.value, 3)}</span>
      </li>
    {/each}
  </ol>
  <a href="/activities">全 164 分類のランキングを見る</a>
</section>

<section class="prose block" aria-labelledby="reading">
  <h2 id="reading" class="section-title">読み方の注意</h2>
  <ul>
    <li>対象は 18 歳以上の個人向け ChatGPT（Free / Go / Plus / Pro）のメッセージです。Enterprise と Codex は含みません。</li>
    <li>仕事関連・トピック・職務活動は、モデルによる自動分類の推定です。利用者の自己申告や実際の職業ではありません。</li>
    <li>公開値には差分プライバシーのノイズと丸めが含まれ、少数のグループは公開されていません。</li>
  </ul>
  <a href="/about">データについて詳しく</a>
</section>

<style>
  .hero-head {
    margin-top: 72px;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 28px;
  }

  @media (max-width: 640px) {
    .wide-only {
      display: none;
    }
  }

  .hero {
    text-align: center;
    border-top: 1px solid var(--border);
    padding: 48px 0 40px;
    margin: 0 auto;
    max-width: 44rem;
  }

  .hero-label {
    color: var(--ink-2);
    margin: 0;
  }

  .figure {
    font-size: clamp(3.5rem, 12vw, 6rem);
    font-weight: 500;
    letter-spacing: -0.03em;
    line-height: 1.05;
    margin: 8px 0 12px;
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    margin-bottom: 64px;
  }

  .fact {
    padding: 28px 24px;
    min-width: 0;
  }

  .fact + .fact {
    border-left: 1px solid var(--border);
  }

  @media (max-width: 600px) {
    .fact {
      padding: 24px 0;
    }

    .fact + .fact {
      border-left: 0;
      border-top: 1px solid var(--border);
    }
  }

  .fact-label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--ink-2);
    margin-bottom: 8px;
  }

  .fact-value {
    font-size: 1.5rem;
    font-weight: 500;
    letter-spacing: -0.01em;
    line-height: 1.3;
    margin: 0 0 6px;
  }

  .block {
    margin-bottom: 64px;
  }

  .top5 {
    list-style: none;
    padding: 0;
    margin: 16px 0;
    border-top: 1px solid var(--border);
  }

  .top5 li {
    display: grid;
    grid-template-columns: 1.5rem minmax(0, 1fr) auto;
    gap: 12px;
    align-items: baseline;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }

  .top5 .rank {
    color: var(--ink-2);
  }

  .top5 .name {
    display: grid;
  }

  .top5 .value {
    font-weight: 600;
  }

  .top5 .sub {
    color: var(--ink-muted);
    font-size: 0.75rem;
  }

  ul {
    padding-left: 1.25rem;
  }

  li {
    margin-bottom: 6px;
  }
</style>
