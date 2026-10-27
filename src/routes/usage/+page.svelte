<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import ChartFrame from '$lib/components/ChartFrame.svelte';
  import DataTable from '$lib/components/DataTable.svelte';
  import GroupedBars from '$lib/components/GroupedBars.svelte';
  import LineChart from '$lib/components/LineChart.svelte';
  import { formatMonth, formatMonthShort, pct } from '$lib/format.ts';
  import { INTENTS, INTENT_LABELS, TOPICS, TOPIC_LABELS, scopeName } from '$lib/labels.ts';

  let { data } = $props();

  let month = $state('');
  const currentMonth = $derived(month || (data.months.at(-1) ?? ''));
  const pct1 = (v: number | null) => pct(v, 1);

  const scopes = $derived([
    { id: 'JP', label: '日本', color: 'var(--series-jp)', d: data.jp },
    { id: 'global', label: scopeName('global'), color: 'var(--series-ref)', d: data.global },
  ]);
  const legend = $derived(scopes.map((s) => ({ label: s.label, color: s.color })));
  const legendRect = $derived(scopes.map((s) => ({ label: s.label, color: s.color, kind: 'rect' as const })));

  const range = $derived(`${formatMonth(data.months[0] ?? '')}〜${formatMonth(data.months.at(-1) ?? '')}`);

  function monthlyTable(get: (d: (typeof scopes)[number]['d'], m: string) => number | undefined) {
    return data.months.map((m) => ({
      m: formatMonth(m),
      ...Object.fromEntries(scopes.map((s) => [s.id, pct1(get(s.d, m) ?? null)])),
    }));
  }
  const tableColumns = $derived([{ key: 'm', label: '月' }, ...scopes.map((s) => ({ key: s.id, label: s.label, numeric: true }))]);
</script>

<Seo title="日本の仕事利用" description="日本の ChatGPT メッセージに占める仕事関連の割合と、仕事関連メッセージのトピック・意図の構成を月次で示します。" />

<header class="page-head">
  <p class="eyebrow">OpenAI Signals {data.dataInfo.release} · 月次集計 · {range}</p>
  <h1>日本の仕事利用</h1>
  <p class="lead">
    日本の個人向け ChatGPT メッセージのうち仕事関連に分類されたものの割合と、その用途の構成を月次で示します。
    比較対象の「世界」は Signals の公式グローバル集計です。分類はすべてモデルによる推定です。
  </p>
</header>

<ChartFrame
  title="仕事関連メッセージの割合"
  meta="指標: work_related=1 の構成比・分母: 各地域の全メッセージ・月次（{range}）"
  {legend}
>
  <LineChart
    periods={data.months}
    series={scopes.map((s) => ({ id: s.id, label: s.label, color: s.color, values: data.months.map((m) => s.d.workShare[m] ?? null) }))}
    axisLabel={formatMonthShort}
    periodLabel={formatMonth}
    format={pct1}
    ariaLabel="日本と世界の仕事関連メッセージの割合の月次推移"
  />
  {#snippet table()}
    <DataTable caption="仕事関連メッセージの割合" columns={tableColumns} rows={monthlyTable((d, m) => d.workShare[m])} />
  {/snippet}
</ChartFrame>

<div class="filters">
  <label class="pill">
    月
    <select bind:value={month}>
      {#each [...data.months].reverse() as m (m)}
        <option value={m === data.months.at(-1) ? '' : m}>{formatMonth(m)}</option>
      {/each}
    </select>
  </label>
</div>

<ChartFrame
  title="{formatMonth(currentMonth)}の仕事関連メッセージのトピック"
  meta="指標: 構成比・分母: 各地域・同月の仕事関連メッセージ（work_related=1）・月次"
  legend={legendRect}
>
  <GroupedBars
    categories={TOPICS.map((t) => ({ key: t, label: TOPIC_LABELS[t] ?? t, sub: t }))}
    series={scopes.map((s) => ({ id: s.id, label: s.label, color: s.color, values: s.d.topics[currentMonth] ?? {} }))}
    format={pct1}
    ariaLabel="トピック別の構成比"
  />
  {#snippet table()}
    <DataTable
      caption="トピック別の構成比"
      columns={[{ key: 't', label: 'トピック' }, ...scopes.map((s) => ({ key: s.id, label: s.label, numeric: true }))]}
      rows={TOPICS.map((t) => ({
        t: `${TOPIC_LABELS[t]}（${t}）`,
        ...Object.fromEntries(scopes.map((s) => [s.id, pct1(s.d.topics[currentMonth]?.[t] ?? null)])),
      }))}
    />
  {/snippet}
  {#snippet notes()}
    <p>丸めと差分プライバシーのノイズのため、合計は厳密に 100% にならない場合があります。</p>
  {/snippet}
</ChartFrame>

<ChartFrame
  title="{formatMonth(currentMonth)}の仕事関連メッセージの意図（Ask / Do / Express）"
  meta="指標: 構成比・分母: 各地域・同月の仕事関連メッセージ（work_related=1）・月次"
  legend={legendRect}
>
  <GroupedBars
    categories={INTENTS.map((k) => ({ key: k, label: INTENT_LABELS[k] ?? k, sub: k }))}
    series={scopes.map((s) => ({ id: s.id, label: s.label, color: s.color, values: s.d.intent[currentMonth] ?? {} }))}
    format={pct1}
    ariaLabel="意図別の構成比"
  />
  {#snippet notes()}
    <p>Ask は情報や助言を求める、Do は文章作成などの作業を依頼する、Express はそのどちらでもないメッセージです（データ辞書の定義による）。</p>
  {/snippet}
</ChartFrame>

<section aria-labelledby="topic-trends">
  <h2 id="topic-trends" class="section-title">トピック別の推移</h2>
  <p class="muted">各トピックが仕事関連メッセージに占める割合の月次推移（{range}）。縦軸はグラフごとに異なります。</p>
  <div class="multiples">
    {#each TOPICS as t (t)}
      <ChartFrame
        title="{TOPIC_LABELS[t]}（{t}）"
        meta="分母: 各地域の仕事関連メッセージ"
        {legend}
        headingLevel={3}
      >
        <LineChart
          periods={data.months}
          series={scopes.map((s) => ({ id: s.id, label: s.label, color: s.color, values: data.months.map((m) => s.d.topics[m]?.[t] ?? null) }))}
          axisLabel={formatMonthShort}
          periodLabel={formatMonth}
          format={pct1}
          ariaLabel="{TOPIC_LABELS[t]}の構成比の月次推移"
          height={180}
        />
        {#snippet table()}
          <DataTable caption="{TOPIC_LABELS[t]}の構成比" columns={tableColumns} rows={monthlyTable((d, m) => d.topics[m]?.[t])} />
        {/snippet}
      </ChartFrame>
    {/each}
  </div>
</section>

<style>
  .multiples {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
    gap: 0 40px;
    margin-top: 32px;
  }
</style>
