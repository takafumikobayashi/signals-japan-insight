<script lang="ts" module>
  export type LineSeries = { id: string; label: string; color: string; values: (number | null)[] };
</script>

<script lang="ts">
  import { reveal } from '$lib/actions/reveal.ts';
  import { niceTicks } from './scale.ts';

  let {
    periods,
    series,
    axisLabel,
    periodLabel,
    format,
    ariaLabel,
    height = 240,
  }: {
    periods: string[];
    series: LineSeries[];
    /** x 軸の短い目盛りラベル */
    axisLabel: (period: string) => string;
    /** ツールチップの期間表記 */
    periodLabel: (period: string) => string;
    format: (value: number | null) => string;
    ariaLabel: string;
    height?: number;
  } = $props();

  let width = $state(640);
  let active = $state<number | null>(null);

  const margin = { top: 12, bottom: 28, left: 48 };
  const values = $derived(series.flatMap((s) => s.values.filter((v): v is number => v !== null)));
  const ticks = $derived(niceTicks(Math.max(0, ...values)));
  const yMax = $derived(ticks.at(-1) ?? 1);

  // 系列が 4 以下で終点が離れていれば直接ラベルを付ける（凡例は常に表示）
  const lastPoints = $derived(
    series.map((s) => {
      let i = s.values.length - 1;
      while (i >= 0 && s.values[i] === null) i--;
      return { s, i, v: i >= 0 ? (s.values[i] ?? null) : null };
    }),
  );
  const plotHeight = $derived(height - margin.top - margin.bottom);
  const y = (v: number) => margin.top + plotHeight * (1 - v / yMax);
  const endLabels = $derived.by(() => {
    if (series.length > 4 || width < 420) return false;
    const ys = lastPoints.filter((p) => p.v !== null).map((p) => y(p.v as number)).sort((a, b) => a - b);
    return ys.every((v, i) => i === 0 || v - (ys[i - 1] ?? 0) >= 14);
  });
  const marginRight = $derived(endLabels ? 96 : 16);
  const innerWidth = $derived(Math.max(40, width - margin.left - marginRight));
  const x = (i: number) => margin.left + (periods.length <= 1 ? innerWidth / 2 : (innerWidth * i) / (periods.length - 1));
  const tickEvery = $derived(Math.max(1, Math.ceil(periods.length / Math.max(1, Math.floor(innerWidth / 56)))));

  function segments(vals: (number | null)[]): string[] {
    const out: string[] = [];
    let d = '';
    vals.forEach((v, i) => {
      if (v === null) {
        if (d) out.push(d);
        d = '';
      } else {
        d += `${d ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      }
    });
    if (d) out.push(d);
    return out;
  }

  function nearest(event: PointerEvent) {
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * width;
    const step = periods.length <= 1 ? 1 : innerWidth / (periods.length - 1);
    active = Math.min(periods.length - 1, Math.max(0, Math.round((px - margin.left) / step)));
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      active = Math.min(periods.length - 1, Math.max(0, (active ?? periods.length - 1) + delta));
    } else if (event.key === 'Escape') {
      active = null;
    }
  }

  // 目盛りは値の表記（小数桁）に関係なく、末尾の 0 を省いた % で示す
  const tickLabel = (v: number) => `${Number((v * 100).toFixed(2))}%`;

  // 表示する値が変わったら線を描き直す（同じ系列 ID でも値が違えば再生する）
  const drawKey = $derived(series.map((s) => `${s.id}:${s.values.join(',')}`).join('|'));

  const tooltipLeft = $derived(active === null ? 0 : x(active));
</script>

<div class="line-chart" bind:clientWidth={width} use:reveal>
  <!-- 値は表でも読めるが、キーボードでもツールチップを出せるようにグラフ自体をフォーカス可能にする -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <svg
    {width}
    {height}
    viewBox="0 0 {width} {height}"
    role="img"
    aria-label="{ariaLabel}。左右の矢印キーで期間ごとの値を表示します。"
    tabindex="0"
    onpointermove={nearest}
    onpointerleave={() => (active = null)}
    onkeydown={onKey}
    onfocus={() => (active = periods.length - 1)}
    onblur={() => (active = null)}
  >
    {#each ticks as t (t)}
      <line class="grid" x1={margin.left} x2={margin.left + innerWidth} y1={y(t)} y2={y(t)} />
      <text class="tick" x={margin.left - 6} y={y(t)} text-anchor="end" dominant-baseline="middle">{tickLabel(t)}</text>
    {/each}
    <line class="axis" x1={margin.left} x2={margin.left + innerWidth} y1={y(0)} y2={y(0)} />
    {#each periods as p, i (p)}
      {#if i % tickEvery === 0 || i === periods.length - 1}
        <text class="tick" x={x(i)} y={height - 8} text-anchor="middle">{axisLabel(p)}</text>
      {/if}
    {/each}

    {#if active !== null}
      <line class="crosshair" x1={x(active)} x2={x(active)} y1={margin.top} y2={y(0)} />
    {/if}

    {#key drawKey}
      {#each series as s (s.id)}
        {#each segments(s.values) as d, i (i)}
          <path {d} style:stroke={s.color} class="line draw" pathLength="1" />
        {/each}
      {/each}

      {#if periods.length <= 12}
        <!-- 点が少ない（四半期など）ときは各点を白抜きの丸で示す -->
        {#each series as s (s.id)}
          {#each s.values as v, i (i)}
            {#if v !== null}
              <circle
                class="marker fade"
                cx={x(i)}
                cy={y(v)}
                r="3.5"
                style:stroke={s.color}
                style:--fade-delay="{(1.1 * i) / Math.max(1, periods.length - 1)}s"
              />
            {/if}
          {/each}
        {/each}
      {/if}

      {#each lastPoints as p (p.s.id)}
        {#if p.v !== null}
          <circle class="dot fade" cx={x(p.i)} cy={y(p.v)} r="4" style:fill={p.s.color} />
          {#if endLabels}
            <text class="end-label fade" x={x(p.i) + 8} y={y(p.v)} dominant-baseline="middle">{format(p.v)}</text>
          {/if}
        {/if}
      {/each}
    {/key}

    {#if active !== null}
      {#each series as s (s.id)}
        {@const v = s.values[active]}
        {#if v !== null && v !== undefined}
          <circle class="dot" cx={x(active)} cy={y(v)} r="4.5" style:fill={s.color} />
        {/if}
      {/each}
    {/if}
  </svg>

  {#if active !== null}
    {@const period = periods[active] ?? ''}
    <div class="tooltip" style:left="{tooltipLeft}px" class:flip={tooltipLeft > width * 0.6} aria-live="polite">
      <div class="tt-period">{periodLabel(period)}</div>
      {#each series as s (s.id)}
        <div class="tt-row">
          <span class="tt-key" style:background={s.color}></span>
          <strong class="num">{format(s.values[active] ?? null)}</strong>
          <span class="tt-label">{s.label}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .line-chart {
    position: relative;
    width: 100%;
    touch-action: pan-y;
  }

  svg {
    display: block;
    overflow: visible;
    /* 幅の計測前（スクリプト実行前）は viewBox ごと縮小して、はみ出さないようにする */
    max-width: 100%;
    height: auto;
  }

  .grid {
    stroke: var(--grid);
    stroke-width: 1;
  }

  .axis {
    stroke: var(--axis);
    stroke-width: 1;
  }

  .tick {
    fill: var(--ink-muted);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  .line {
    fill: none;
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .dot {
    stroke: var(--surface);
    stroke-width: 2;
  }

  .marker {
    fill: var(--surface);
    stroke-width: 1.5;
  }

  .crosshair {
    stroke: var(--axis);
    stroke-width: 1;
  }

  .end-label {
    fill: var(--ink-2);
    font-size: 12px;
  }

  .tooltip {
    position: absolute;
    top: 0;
    transform: translateX(12px);
    pointer-events: none;
    background: var(--pill);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
    padding: 8px 10px;
    font-size: 0.8125rem;
    min-width: 160px;
    max-width: 260px;
    z-index: 2;
  }

  .tooltip.flip {
    transform: translateX(calc(-100% - 12px));
  }

  .tt-period {
    color: var(--ink-2);
    margin-bottom: 4px;
  }

  .tt-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tt-key {
    width: 12px;
    height: 2px;
    flex: none;
  }

  .tt-label {
    color: var(--ink-2);
  }
</style>
