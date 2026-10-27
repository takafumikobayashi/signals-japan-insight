<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { formatMonth, formatQuarter } from '$lib/format.ts';

  let { data } = $props();
  const info = $derived(data.dataInfo);
</script>

<Seo title="データについて" description="Signals Japan Insight で使っている OpenAI Signals データの出典・指標の意味・制約・ライセンス。" />

<header class="page-head">
  <p class="eyebrow">OpenAI Signals {info.release} · 取得日 {info.retrievedAt}</p>
  <h1>データについて</h1>
  <p class="lead">
    Signals Japan Insight は、OpenAI Signals の公開集計を日本の視点で見るための非公式・独立のサイトです。OpenAI
    が運営・承認・推奨するものではありません。
  </p>
</header>

<section class="card prose">
  <h2 class="section-title">使用データ</h2>
  <dl>
    <dt>データ</dt>
    <dd>OpenAI Signals {info.release}（公式 CSV、取得日 {info.retrievedAt}）</dd>
    <dt>月次データ</dt>
    <dd>{formatMonth(info.months[0] ?? '')}〜{formatMonth(info.months.at(-1) ?? '')}（{info.months.length} か月）</dd>
    <dt>職務活動（IWA）</dt>
    <dd>{formatQuarter(info.quarters[0] ?? '')}〜{formatQuarter(info.quarters.at(-1) ?? '')}（{info.quarters.length} 四半期、国別のみ）</dd>
    <dt>加工</dt>
    <dd>CSV を JSON 形式に変換し、必要な地域・区分に絞って表示しています。値の再集計・補間・推計はしていません。</dd>
  </dl>
</section>

<section class="card prose">
  <h2 class="section-title">指標の意味</h2>
  <ul>
    <li>
      <strong>構成比（share_of_messages）</strong>: 各グラフに示した分母（たとえば「日本の同月の仕事関連メッセージ」）に占めるメッセージの割合です。
      利用者数、利用者の割合、就業者の割合、絶対件数ではありません。
    </li>
    <li><strong>仕事関連（work_related=1）</strong>: 分類器が仕事・雇用に関連すると推定したメッセージです。</li>
    <li>
      <strong>職務活動（IWA）</strong>: O*NET の Intermediate Work Activities を参照した活動分類で、メッセージの意図を分類したものです。職業名や雇用者数ではありません。低頻度の
      IWA は「Other IWA」に集約されています。日本語名は本サイトによる非公式の表示名で、定義は英語原文に従います。
    </li>
    <li><strong>トピック</strong>: Writing、Practical Guidance など、メッセージの主題の 7 区分です。</li>
    <li><strong>Ask / Do / Express</strong>: 情報や助言を求める（Ask）、モデルに作業を依頼する（Do）、そのどちらでもない（Express）、というメッセージの意図の分類です。</li>
    <li><strong>順位（rank）</strong>: 人口で正規化したメッセージ量の国別順位です（1 が最上位）。人口は世界銀行の 2023 年推計が使われています。利用者数や普及率ではありません。</li>
    <li>
      <strong>世界</strong>: Signals の公式グローバル集計です。職務活動（IWA）には公式の世界集計がないため、国別の値から世界の値を作ることはしていません。
    </li>
  </ul>
</section>

<section class="card prose">
  <h2 class="section-title">制約と注意</h2>
  <ul>
    <li>対象は 18 歳以上と関連づけられた個人向け ChatGPT（Free / Go / Plus / Pro）のメッセージです。Enterprise と Codex の利用は含まれません。</li>
    <li>標本は月あたり約 100 万件の分類済みメッセージで、日ごとの構成差を補正する重みが使われています。</li>
    <li>アカウントを削除した利用者や、データの学習利用を許可していない利用者は標本に含まれません。</li>
    <li>分類はすべてモデルによる自動推定で、研究者が会話を読んだものではありません。</li>
    <li>公開値には差分プライバシーのノイズと丸めが含まれ、合計が厳密に 100% にならないことがあります。少数のグループは公開されていません。</li>
    <li>国によっては公開されていない月・四半期・区分があります。グラフでは途切れや「非公開」と表示し、0 としては扱いません。</li>
    <li>公開国は期間ごとに異なります。異なるリリース版の値は混ぜていません。</li>
  </ul>
</section>

<section class="card prose">
  <h2 class="section-title">出典とライセンス</h2>
  <p>
    OpenAI Signals のデータは <a href={info.license.url}>{info.license.name}</a> で提供されています。データのライセンスは OpenAI
    の商標利用や公式認定を意味しません。
  </p>
  <p>{info.attribution}</p>
  <h3>推奨引用</h3>
  <p class="citation">{info.citation}</p>
  <h3>公式ページ</h3>
  <ul>
    {#each info.pages as url (url)}
      <li><a href={url}>{url}</a></li>
    {/each}
    <li><a href={info.dictionaryUrl}>データ辞書（PDF）</a></li>
    <li><a href={info.csvZipUrl}>CSV ダウンロード（ZIP）</a></li>
  </ul>
</section>

<style>
  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 4px 16px;
    margin: 0;
  }

  dt {
    color: var(--ink-2);
  }

  dd {
    margin: 0;
  }

  @media (max-width: 640px) {
    dl {
      grid-template-columns: 1fr;
    }

    dd {
      margin-bottom: 8px;
    }
  }

  ul {
    padding-left: 1.25rem;
  }

  li {
    margin-bottom: 6px;
  }

  .citation {
    font-size: 0.875rem;
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }

  a {
    overflow-wrap: anywhere;
  }
</style>
