<script lang="ts" module>
  export type StripPoint = { id: string; value: number };
  export type StripRow = { key: string; label: string; sub?: string; points: StripPoint[] };
</script>

<script lang="ts">
  import { reveal } from '$lib/actions/reveal.ts';
  import { median, stackDots, stripTicks } from './strip.ts';

  let {
    rows,
    highlight,
    highlightLabel,
    format,
    ariaLabel,
    describe,
    nameOf = (id: string) => id,
  }: {
    rows: StripRow[];
    /** 強調する点の id（日本） */
    highlight: string;
    highlightLabel: string;
    format: (value: number) => string;
    ariaLabel: string;
    /** 行ごとの読み上げ文（例: 日本は 145 か国中 41 位） */
    describe: (row: StripRow) => string;
    /** 点にカーソルを合わせたときの国名 */
    nameOf?: (id: string) => string;
  } = $props();

  let width = $state(640);
  // 点の直径と区間の幅。狭い画面では少し小さくする
  const R = $derived(width < 520 ? 3.5 : 5);
  const step = $derived(R * 2 + 1.5);
  const margin = { left: 12, right: 12 };
  const TOP = 30; // 日本のラベル
  const BOTTOM = 34; // 軸・目盛り・中央値

  const all = $derived(rows.flatMap((r) => r.points.map((p) => p.value)));
  // 行どうしで比べられるよう、横軸はすべての行で共通にする
  const minV = $derived(Math.min(0, ...all));
  const maxV = $derived(Math.max(0, ...all));
  const pad = $derived((maxV - minV) * 0.03 || 1);
  const lo = $derived(minV - pad);
  const hi = $derived(maxV + pad);
  const ticks = $derived(stripTicks(minV, maxV));
  const innerWidth = $derived(Math.max(40, width - margin.left - margin.right));
  const x = (v: number) => margin.left + ((v - lo) / (hi - lo || 1)) * innerWidth;

  const placed = $derived(
    rows.map((r) => {
      const dots = stackDots(
        r.points.map((p) => ({ ...p, px: x(p.value) })),
        step,
        margin.left,
      );
      const maxLevel = Math.max(0, ...dots.map((d) => d.level));
      const stackHeight = (maxLevel + 1) * step;
      const height = TOP + stackHeight + BOTTOM;
      const base = TOP + stackHeight; // 軸の位置
      const cy = (level: number) => base - step / 2 - level * step;
      const jp = dots.find((d) => d.id === highlight);
      const med = median(r.points.map((p) => p.value));
      return { row: r, dots, height, base, cy, jp, med };
    }),
  );

  const anchor = (px: number) => (px < 70 ? 'start' : px > width - 70 ? 'end' : 'middle');
</script>

<div class="strip" bind:clientWidth={width} use:reveal>
  <ul aria-label={ariaLabel}>
    {#each placed as p, i (p.row.key)}
      <li style:--i={i}>
        <div class="row-head">
          <span class="row-label">{p.row.label}</span>
          {#if p.row.sub}<span class="row-sub">{p.row.sub}</span>{/if}
        </div>
        <span class="visually-hidden">{describe(p.row)}</span>
        <svg {width} height={p.height} viewBox="0 0 {width} {p.height}" aria-hidden="true">
          <line class="zero" x1={x(0)} x2={x(0)} y1={TOP - 4} y2={p.base} />
          {#each p.dots as d (d.id)}
            {#if d.id !== highlight}
              <circle class="dot fade" cx={d.binPx} cy={p.cy(d.level)} r={R}>
                <title>{nameOf(d.id)}: {format(d.value)}</title>
              </circle>
            {/if}
          {/each}
          {#if p.jp}
            {@const jy = p.cy(p.jp.level)}
            <line class="leader fade" x1={p.jp.binPx} x2={p.jp.binPx} y1={18} y2={jy - R - 2} />
            <circle class="hl fade" cx={p.jp.binPx} cy={jy} r={R + 1.5}>
              <title>{highlightLabel}: {format(p.jp.value)}</title>
            </circle>
            <text class="hl-label fade" x={p.jp.binPx} y={13} text-anchor={anchor(p.jp.binPx)}>
              {highlightLabel} {format(p.jp.value)}
            </text>
          {/if}
          <line class="axis" x1={margin.left} x2={margin.left + innerWidth} y1={p.base} y2={p.base} />
          {#each ticks as t (t)}
            <line class="tick-mark" x1={x(t)} x2={x(t)} y1={p.base} y2={p.base + 4} />
            <text class="tick" x={x(t)} y={p.base + 16} text-anchor="middle">{format(t)}</text>
          {/each}
          {#if p.med !== null}
            <path class="median" d="M{x(p.med)},{p.base + 19} l-4,7 h8 z" />
            <text class="median-label" x={x(p.med) + 7} y={p.base + 27} text-anchor="start">中央値</text>
          {/if}
        </svg>
      </li>
    {/each}
  </ul>
</div>

<style>
  .strip {
    width: 100%;
  }

  ul {
    list-style: none;
    margin: 16px 0 0;
    padding: 0;
  }

  li {
    margin-bottom: 28px;
  }

  .row-head {
    display: flex;
    flex-wrap: wrap;
    gap: 0 8px;
    align-items: baseline;
    font-size: 0.9375rem;
    font-weight: 600;
  }

  .row-sub {
    color: var(--ink-muted);
    font-size: 0.75rem;
    font-weight: 400;
  }

  svg {
    display: block;
    overflow: visible;
    max-width: 100%;
    height: auto;
  }

  .axis {
    stroke: var(--axis);
  }

  .tick-mark {
    stroke: var(--axis);
  }

  .zero {
    stroke: var(--axis);
    stroke-dasharray: 2 3;
  }

  .dot {
    fill: var(--series-ref);
    fill-opacity: 0.6;
  }

  .hl {
    fill: var(--series-jp);
    stroke: var(--surface);
    stroke-width: 2;
  }

  .leader {
    stroke: var(--series-jp);
    stroke-width: 1.5;
  }

  .hl-label {
    fill: var(--ink);
    font-size: 13px;
    font-weight: 600;
  }

  .tick {
    fill: var(--ink-muted);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  .median {
    fill: var(--ink-2);
  }

  .median-label {
    fill: var(--ink-2);
    font-size: 10px;
  }
</style>
