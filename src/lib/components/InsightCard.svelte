<script lang="ts">
  import type { Insight } from '$lib/insights.ts';

  let {
    insight,
    spark,
  }: {
    insight: Insight;
    /** カード上部の小さな折れ線（0〜1 の値）と、網かけする位置（values の添字） */
    spark?: { values: (number | null)[]; bands: { from: number; to: number }[]; label: string };
  } = $props();

  const W = 320;
  const H = 150;
  const PAD = { x: 16, top: 22, bottom: 18 };

  const path = $derived.by(() => {
    if (!spark) return '';
    const vals = spark.values.filter((v): v is number => v !== null);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const n = spark.values.length;
    const x = (i: number) => PAD.x + ((W - PAD.x * 2) * i) / Math.max(1, n - 1);
    const y = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - (v - lo) / (hi - lo || 1));
    let d = '';
    spark.values.forEach((v, i) => {
      if (v === null) return;
      d += `${d ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
    });
    return d;
  });

  const bandRects = $derived.by(() => {
    if (!spark) return [];
    const n = spark.values.length;
    const step = (W - PAD.x * 2) / Math.max(1, n - 1);
    return spark.bands.map((b) => ({
      x: PAD.x + step * b.from - step / 2,
      w: step * (b.to - b.from + 1),
    }));
  });
</script>

<a class="insight-card" href={insight.href}>
  <div class="thumb" aria-hidden="true">
    {#if spark}
      <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none">
        {#each bandRects as b, i (i)}
          <rect class="band" x={b.x} y={PAD.top - 6} width={b.w} height={H - PAD.top - PAD.bottom + 12} />
        {/each}
        <path class="line" d={path} vector-effect="non-scaling-stroke" />
      </svg>
      <span class="thumb-label">{spark.label}</span>
    {/if}
  </div>
  <div class="body">
    <p class="sources">{insight.sources}</p>
    <h3 class="title">{insight.title}</h3>
    <p class="description">{insight.description}</p>
    <span class="more">分析を読む</span>
  </div>
</a>

<style>
  .insight-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 6px;
    border-radius: 16px;
    background: var(--wash);
    color: var(--ink);
    text-decoration: none;
    transition: background 0.15s ease;
  }

  .insight-card:hover {
    background: var(--pill-hover);
  }

  .thumb {
    position: relative;
    aspect-ratio: 16 / 9;
    border-radius: 12px;
    background: var(--surface);
    overflow: hidden;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .band {
    fill: var(--wash);
  }

  .line {
    fill: none;
    stroke: var(--series-jp);
    stroke-width: 2.5;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .thumb-label {
    position: absolute;
    left: 12px;
    top: 8px;
    font-size: 0.6875rem;
    color: var(--ink-muted);
  }

  .body {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 14px 12px 10px;
  }

  .sources {
    color: var(--series-jp);
    font-size: 0.75rem;
    font-weight: 600;
    margin: 0 0 6px;
  }

  .title {
    font-size: 1.0625rem;
    line-height: 1.4;
    margin: 0 0 8px;
  }

  .description {
    color: var(--ink-2);
    font-size: 0.8125rem;
    line-height: 1.6;
    margin: 0 0 16px;
  }

  .more {
    margin-top: auto;
    display: block;
    text-align: center;
    padding: 8px 0;
    border-radius: 999px;
    background: var(--pill);
    font-size: 0.8125rem;
    font-weight: 500;
  }

  .insight-card:hover .more {
    background: var(--surface);
  }

  .insight-card:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }
</style>
