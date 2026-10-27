<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { formatMonth, formatQuarter } from '$lib/format.ts';

  let { data, children } = $props();

  const nav = [
    { href: '/', label: '概要' },
    { href: '/activities', label: '日本の職務活動' },
    { href: '/usage', label: '日本の仕事利用' },
    { href: '/compare', label: '国際比較' },
    { href: '/about', label: 'データについて' },
  ];

  const info = $derived(data.dataInfo);
</script>

<a class="skip" href="#main">本文へ移動</a>

<header class="site-header">
  <div class="inner">
    <a class="brand" href="/">Signals Japan Insight</a>
    <nav aria-label="メイン">
      <ul>
        {#each nav as item (item.href)}
          <li>
            <a href={item.href} aria-current={page.url.pathname === item.href ? 'page' : undefined}>{item.label}</a>
          </li>
        {/each}
      </ul>
    </nav>
  </div>
</header>

<p class="unofficial inner" role="note">
  非公式・独立のプロジェクトです。OpenAI が運営・承認・推奨するものではありません。
</p>

<main id="main" class="inner">
  {@render children()}
</main>

<footer class="site-footer">
  <div class="inner">
    <p>
      出典:
      <a href="https://openai.com/signals/data-download/">OpenAI Signals {info.release}</a>
      （<a href={info.license.url}>{info.license.name}</a>、取得日 {info.retrievedAt}）。 本サイトは公式 CSV を JSON
      形式に変換して表示しており、値の再集計はしていません。
    </p>
    <p>
      対象期間: 月次 {formatMonth(info.months[0] ?? '')}〜{formatMonth(info.months.at(-1) ?? '')}、IWA
      {formatQuarter(info.quarters[0] ?? '')}〜{formatQuarter(info.quarters.at(-1) ?? '')}。
      データのライセンスは OpenAI の商標利用や公式認定を意味しません。
      <a href="/about">データの読み方と出典</a>
    </p>
  </div>
</footer>

<style>
  .inner {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 16px;
  }

  @media (min-width: 720px) {
    .inner {
      padding: 0 32px;
    }
  }

  .skip {
    position: absolute;
    left: -9999px;
  }

  .skip:focus {
    left: 16px;
    top: 8px;
    background: var(--page);
    padding: 8px 12px;
    z-index: 10;
  }

  .site-header {
    position: sticky;
    top: 0;
    z-index: 5;
    background: var(--page);
  }

  .site-header .inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 28px;
    min-height: 60px;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .brand {
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--ink);
    text-decoration: none;
  }

  nav ul {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 20px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  nav a {
    display: block;
    padding: 4px 0;
    color: var(--ink-2);
    text-decoration: none;
    font-size: 0.875rem;
  }

  nav a:hover,
  nav a[aria-current='page'] {
    color: var(--ink);
  }

  nav a[aria-current='page'] {
    font-weight: 600;
  }

  .unofficial {
    text-align: center;
    margin-top: 8px;
    margin-bottom: 0;
    font-size: 0.75rem;
    color: var(--ink-muted);
  }

  main {
    padding-top: 0;
    padding-bottom: 48px;
  }

  .site-footer {
    border-top: 1px solid var(--border);
    font-size: 0.8125rem;
    color: var(--ink-2);
  }

  .site-footer .inner {
    max-width: 44rem;
    padding-top: 32px;
    padding-bottom: 48px;
  }

  .site-footer a {
    color: var(--ink-2);
  }
</style>
