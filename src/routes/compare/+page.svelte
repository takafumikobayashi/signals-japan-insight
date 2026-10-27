<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { onMount } from 'svelte';
  import ChartFrame from '$lib/components/ChartFrame.svelte';
  import DataTable from '$lib/components/DataTable.svelte';
  import GroupedBars from '$lib/components/GroupedBars.svelte';
  import LineChart from '$lib/components/LineChart.svelte';
  import { formatMonth, formatMonthShort, formatQuarter, pct } from '$lib/format.ts';
  import { rankIwa } from '$lib/iwa.ts';
  import { TOPICS, TOPIC_LABELS, scopeName, sortByCountryName } from '$lib/labels.ts';
  import type { IwaCountryData, MonthlyScopeData } from '$lib/types.ts';

  let { data } = $props();

  const SLOT_COLORS = ['var(--series-2)', 'var(--series-3)'];
  const TOP_N = 15;
  const pct1 = (v: number | null) => pct(v, 1);
  const pct2 = (v: number | null) => pct(v, 2);

  // 比較国は最大 2 か国。色は選択欄の位置に固定し、選び直しても日本・他方の色は変わらない。
  let picks = $state<string[]>(['US', 'KR']);
  let month = $state('');
  let quarter = $state('');
  let monthly = $state<Record<string, MonthlyScopeData>>({});
  let iwa = $state<Record<string, IwaCountryData>>({});
  let loading = $state(false);
  let loadError = $state('');

  const currentMonth = $derived(month || (data.months.at(-1) ?? ''));
  const currentQuarter = $derived(quarter || (data.quarters.at(-1) ?? ''));
  const options = $derived(sortByCountryName(data.countries));
  const labelOf = $derived(new Map(data.labels.map((l) => [l.id, l])));

  const chosen = $derived(
    picks
      .map((code, i) => ({ code, color: SLOT_COLORS[i] ?? 'var(--series-ref)' }))
      .filter((c) => c.code !== ''),
  );

  async function fetchJson<T>(path: string): Promise<T | undefined> {
    const res = await fetch(path);
    return res.ok ? ((await res.json()) as T) : undefined;
  }

  async function ensureLoaded(codes: string[]) {
    const missing = codes.filter((c) => c && !monthly[c]);
    if (missing.length === 0) return;
    loading = true;
    loadError = '';
    try {
      for (const code of missing) {
        const [m, i] = await Promise.all([
          fetchJson<MonthlyScopeData>(`/data/monthly/${code}.json`),
          data.iwaAvailability[code] ? fetchJson<IwaCountryData>(`/data/iwa/${code}.json`) : undefined,
        ]);
        if (m) monthly[code] = m;
        if (i) iwa[code] = i;
      }
    } catch {
      loadError = 'データの読み込みに失敗しました。再読み込みしてください。';
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    void ensureLoaded(picks);
  });

  function setPick(index: number, code: string) {
    picks[index] = code;
    const url = new URL(window.location.href);
    url.searchParams.set('c', picks.filter(Boolean).join(','));
    history.replaceState(history.state, '', url);
  }

  onMount(() => {
    const c = new URLSearchParams(window.location.search).get('c');
    if (c !== null) {
      const codes = c.split(',').filter((code) => data.countries.includes(code)).slice(0, 2);
      picks = [codes[0] ?? '', codes[1] ?? ''];
    }
  });

  // 月次の比較系列: 日本、選択国、世界（参照）
  const monthlySeries = $derived([
    { id: 'JP', label: '日本', color: 'var(--series-jp)', d: data.jpMonthly as MonthlyScopeData | undefined },
    ...chosen.map((c) => ({ id: c.code, label: scopeName(c.code), color: c.color, d: monthly[c.code] })),
    { id: 'global', label: scopeName('global'), color: 'var(--series-ref)', d: data.globalMonthly },
  ]);

  // IWA は世界集計がないため、日本と選択国だけ
  const iwaSeries = $derived([
    { id: 'JP', label: '日本', color: 'var(--series-jp)', values: data.jpIwa.quarters[currentQuarter] },
    ...chosen.map((c) => ({ id: c.code, label: scopeName(c.code), color: c.color, values: iwa[c.code]?.quarters[currentQuarter] })),
  ]);
  const topIds = $derived(rankIwa(data.ids, data.jpIwa.quarters[currentQuarter] ?? []).ranked.slice(0, TOP_N).map((r) => r.id));
  const iwaUnavailable = $derived(chosen.filter((c) => !data.iwaAvailability[c.code]?.includes(currentQuarter)));

  const toRecord = (values: number[] | undefined) =>
    Object.fromEntries(topIds.map((id) => [id, values?.[data.ids.indexOf(id)]]));

  const rankRows = $derived(
    data.quarters.map((q) => ({
      q: formatQuarter(q),
      jp: data.jpRank.rank[q] ?? '非公開',
      n: data.jpRank.countries[q] ?? '',
    })),
  );
</script>

<Seo title="国際比較" description="日本の仕事関連 ChatGPT メッセージの構成を、公式グローバル集計や指定国と比較します。" />

<header class="page-head">
  <p class="eyebrow">OpenAI Signals {data.dataInfo.release} · 月次・四半期集計</p>
  <h1>国際比較</h1>
  <p class="lead">
    日本と、選んだ最大 2 か国を同じ期間・同じ分母で比べます。月次の仕事関連比率とトピックは公式グローバル集計とも比べられます。
    職務活動（IWA）には公式の世界集計がないため、国どうしの比較だけです。
  </p>
</header>

<div class="filters">
  {#each [0, 1] as i (i)}
    <label class="pill">
      <span class="swatch" style:background={SLOT_COLORS[i]} aria-hidden="true"></span>比較国 {i + 1}
      <select value={picks[i]} onchange={(e) => setPick(i, e.currentTarget.value)}>
        <option value="">（なし）</option>
        {#each options as code (code)}
          <option value={code} disabled={picks[1 - i] === code}>{scopeName(code)}</option>
        {/each}
      </select>
    </label>
  {/each}
  <label class="pill">
    月（トピック）
    <select bind:value={month}>
      {#each [...data.months].reverse() as m (m)}
        <option value={m === data.months.at(-1) ? '' : m}>{formatMonth(m)}</option>
      {/each}
    </select>
  </label>
  <label class="pill">
    四半期（職務活動）
    <select bind:value={quarter}>
      {#each [...data.quarters].reverse() as q (q)}
        <option value={q === data.quarters.at(-1) ? '' : q}>{formatQuarter(q)}</option>
      {/each}
    </select>
  </label>
</div>

{#if loadError}<p class="muted" role="alert">{loadError}</p>{/if}

<div class:loading>
  <ChartFrame
    title="仕事関連メッセージの割合"
    meta="指標: work_related=1 の構成比・分母: 各地域の全メッセージ・月次"
    legend={monthlySeries.map((s) => ({ label: s.label, color: s.color }))}
  >
    <LineChart
      periods={data.months}
      series={monthlySeries.map((s) => ({ id: s.id, label: s.label, color: s.color, values: data.months.map((m) => s.d?.workShare[m] ?? null) }))}
      axisLabel={formatMonthShort}
      periodLabel={formatMonth}
      format={pct1}
      ariaLabel="日本・比較国・世界の仕事関連メッセージの割合の月次推移"
    />
    {#snippet notes()}
      <p>線が途切れている月は、その国のデータが公開されていません（0 ではありません）。</p>
    {/snippet}
    {#snippet table()}
      <DataTable
        caption="仕事関連メッセージの割合"
        columns={[{ key: 'm', label: '月' }, ...monthlySeries.map((s) => ({ key: s.id, label: s.label, numeric: true }))]}
        rows={data.months.map((m) => ({ m: formatMonth(m), ...Object.fromEntries(monthlySeries.map((s) => [s.id, pct1(s.d?.workShare[m] ?? null)])) }))}
      />
    {/snippet}
  </ChartFrame>

  <ChartFrame
    title="{formatMonth(currentMonth)}の仕事関連メッセージのトピック"
    meta="指標: 構成比・分母: 各地域・同月の仕事関連メッセージ（work_related=1）・月次"
    legend={monthlySeries.map((s) => ({ label: s.label, color: s.color, kind: 'rect' as const }))}
  >
    <GroupedBars
      categories={TOPICS.map((t) => ({ key: t, label: TOPIC_LABELS[t] ?? t, sub: t }))}
      series={monthlySeries.map((s) => ({ id: s.id, label: s.label, color: s.color, values: s.d?.topics[currentMonth] ?? {} }))}
      format={pct1}
      ariaLabel="地域別のトピック構成比"
    />
    {#snippet notes()}
      <p>「非公開」は、その国・月の仕事関連メッセージのトピック構成が公開されていないことを示します。</p>
    {/snippet}
  </ChartFrame>

  <ChartFrame
    title="{formatQuarter(currentQuarter)}の職務活動（日本の上位 {TOP_N}）"
    meta="指標: 構成比・分母: 各国・同四半期の仕事関連メッセージ・四半期集計。世界集計はありません"
    legend={iwaSeries.map((s) => ({ label: s.label, color: s.color, kind: 'rect' as const }))}
  >
    <GroupedBars
      categories={topIds.map((id) => ({ key: id, label: labelOf.get(id)?.labelJa ?? id, sub: `${labelOf.get(id)?.labelEn ?? ''} · ${id}` }))}
      series={iwaSeries.map((s) => ({ id: s.id, label: s.label, color: s.color, values: toRecord(s.values) }))}
      format={pct2}
      ariaLabel="国別の職務活動構成比"
    />
    {#snippet notes()}
      {#if iwaUnavailable.length > 0}
        <p>{iwaUnavailable.map((c) => scopeName(c.code)).join('、')}は、この四半期の IWA データが公開されていません。</p>
      {/if}
      <p>各国の公開値をそのまま並べています。国の値を平均した「世界の IWA 構成」は作っていません。</p>
    {/snippet}
  </ChartFrame>

  <ChartFrame
    title="日本の人口当たりメッセージ量の順位（補足）"
    meta="指標: rank（1 が最上位）・人口で正規化したメッセージ量の国別順位・四半期"
  >
    <div class="table-scroll">
      <DataTable
        caption="日本の順位"
        columns={[
          { key: 'q', label: '四半期' },
          { key: 'jp', label: '日本の順位', numeric: true },
          { key: 'n', label: '順位のある国・地域の数', numeric: true },
        ]}
        rows={rankRows}
      />
    </div>
    {#snippet notes()}
      <p>順位は利用者数や普及率ではありません。メッセージの絶対量は公開されていません。</p>
    {/snippet}
  </ChartFrame>
</div>

<style>
  .swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex: none;
  }

  /* 長い国名でピルが広がりすぎないようにする */
  .filters select {
    max-width: 13rem;
    text-overflow: ellipsis;
  }

  .loading {
    opacity: 0.55;
    transition: opacity 0.15s;
  }
</style>
