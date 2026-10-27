<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { onMount } from 'svelte';
  import ChartFrame from '$lib/components/ChartFrame.svelte';
  import DataTable from '$lib/components/DataTable.svelte';
  import LineChart from '$lib/components/LineChart.svelte';
  import RankingList from '$lib/components/RankingList.svelte';
  import { formatQuarter, formatQuarterShort, pct, pt } from '$lib/format.ts';
  import { rankHistory, rankIwa } from '$lib/iwa.ts';

  let { data } = $props();

  const labelOf = $derived(new Map(data.labels.map((l) => [l.id, l])));
  const pct3 = (v: number | null) => pct(v, 3);

  let quarter = $state('');
  let selected = $state('');
  let query = $state('');
  let showAll = $state(false);
  const currentQuarter = $derived(quarter || (data.quarters.at(-1) ?? ''));

  const jpQuarters = $derived(data.jp.quarters);
  const ranking = $derived(rankIwa(data.ids, jpQuarters[currentQuarter] ?? []));
  const previousQuarter = $derived(data.quarters[data.quarters.indexOf(currentQuarter) - 1]);
  const previousValues = $derived(previousQuarter ? jpQuarters[previousQuarter] : undefined);
  const currentId = $derived(selected || (ranking.ranked[0]?.id ?? ''));

  const rows = $derived(
    ranking.ranked.map((r) => {
      const label = labelOf.get(r.id);
      const prev = previousValues?.[data.ids.indexOf(r.id)];
      return {
        id: r.id,
        rank: r.rank,
        label: label?.labelJa ?? r.id,
        sub: `${label?.labelEn ?? ''} · ${r.id}`,
        value: r.value,
        change: prev === undefined ? undefined : `前期比 ${pt(r.value - prev, 2)}`,
      };
    }),
  );
  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return showAll ? rows : rows.slice(0, 20);
    return rows.filter((r) => `${r.label} ${r.sub}`.toLowerCase().includes(q));
  });

  const selectedLabel = $derived(labelOf.get(currentId));
  const index = $derived(data.ids.indexOf(currentId));
  const trend = $derived(data.quarters.map((q) => jpQuarters[q]?.[index] ?? null));
  const ranks = $derived(rankHistory(data.ids, jpQuarters, data.quarters, currentId));

  function select(id: string) {
    selected = id;
    const url = new URL(window.location.href);
    url.searchParams.set('iwa', id);
    history.replaceState(history.state, '', url);
    document.getElementById('detail')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  onMount(() => {
    const id = new URLSearchParams(window.location.search).get('iwa');
    if (id && data.ids.includes(id)) selected = id;
  });
</script>

<Seo title="日本の職務活動" description="日本の仕事関連 ChatGPT メッセージを O*NET IWA の職務活動別に四半期ごとにランキングします。" />

<header class="page-head">
  <p class="eyebrow">OpenAI Signals {data.dataInfo.release} · O*NET IWA · 四半期集計</p>
  <h1>日本の職務活動</h1>
  <p class="lead">
    日本の仕事関連メッセージが、O*NET の中間的な職務活動（IWA）のどれに分類されたかを四半期ごとに示します。
    値は「その四半期の日本の仕事関連メッセージ」に占める割合で、利用者数や就業者数ではありません。
  </p>
</header>

<div class="filters">
  <label class="pill">
    四半期
    <select bind:value={quarter}>
      {#each [...data.quarters].reverse() as q (q)}
        <option value={q === data.quarters.at(-1) ? '' : q}>{formatQuarter(q)}</option>
      {/each}
    </select>
  </label>
  <label class="pill search">
    <span class="visually-hidden">職務活動を検索</span>
    <input type="search" bind:value={query} placeholder="職務活動を検索" />
  </label>
</div>

<div class="layout">
  <section class="card" aria-labelledby="ranking-title">
    <h2 id="ranking-title">{formatQuarter(currentQuarter)}の職務活動ランキング</h2>
    <p class="muted">
      指標: 構成比（share_of_messages）・分母: 日本の同四半期の仕事関連メッセージ・四半期集計。
      行を選ぶと右に推移を表示します。
    </p>
    <RankingList rows={filtered} selected={currentId} format={(v) => pct(v, 3)} onselect={select} ariaLabel="職務活動のランキング" />
    {#if filtered.length === 0}
      <p class="muted">該当する職務活動はありません。</p>
    {/if}
    {#if !query.trim()}
      <button type="button" class="button secondary more" onclick={() => (showAll = !showAll)}>
        {showAll ? '上位 20 件に戻す' : `すべて表示（${rows.length} 件）`}
      </button>
    {/if}
    {#if ranking.other !== undefined}
      <p class="muted other">
        このほか「その他（低頻度の IWA を集約）」（Other IWA）が {pct(ranking.other, 3)}
        あります。複数の活動の集約なので順位には含めていません。
      </p>
    {/if}
  </section>

  <div id="detail" class="detail">
    {#if selectedLabel}
      <ChartFrame
        title="{selectedLabel.labelJa}の推移"
        meta="指標: 構成比・分母: 日本の各四半期の仕事関連メッセージ・四半期集計（{formatQuarter(data.quarters[0] ?? '')}〜{formatQuarter(data.quarters.at(-1) ?? '')}）"
      >
        <p class="en">{selectedLabel.labelEn}<br /><span class="muted">IWA ID: {selectedLabel.id}</span></p>
        <LineChart
          periods={data.quarters}
          series={[{ id: 'JP', label: '日本', color: 'var(--series-jp)', values: trend }]}
          axisLabel={formatQuarterShort}
          periodLabel={formatQuarter}
          format={pct3}
          ariaLabel="{selectedLabel.labelJa}の日本の構成比の四半期推移"
          height={220}
        />
        {#snippet table()}
          <DataTable
            caption="{selectedLabel.labelJa}の四半期別構成比と順位"
            columns={[
              { key: 'q', label: '四半期' },
              { key: 'v', label: '構成比', numeric: true },
              { key: 'r', label: '順位（164 分類中）', numeric: true },
            ]}
            rows={data.quarters.map((q, i) => ({ q: formatQuarter(q), v: pct3(trend[i] ?? null), r: ranks[i] ?? '—' }))}
          />
        {/snippet}
        {#snippet notes()}
          <p>
            順位: {ranks.map((r, i) => `${formatQuarterShort(data.quarters[i] ?? '')} ${r ?? '—'}位`).join('、')}
          </p>
          <p>日本語名は本サイトによる非公式の表示名です。分類の定義は英語原文に従います。</p>
        {/snippet}
      </ChartFrame>
    {/if}
  </div>
</div>

<style>
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }

  .detail {
    position: sticky;
    top: 76px;
  }

  @media (max-width: 900px) {
    .layout {
      grid-template-columns: minmax(0, 1fr);
    }

    .detail {
      position: static;
      order: -1;
    }
  }

  .more {
    margin-top: 16px;
  }

  .other {
    margin-top: 12px;
  }

  .en {
    font-size: 0.875rem;
    margin: 8px 0 4px;
  }
</style>
