<script lang="ts" module>
  export type BarSeries = { id: string; label: string; color: string; values: Record<string, number | null | undefined> };
  export type BarCategory = { key: string; label: string; sub?: string };
</script>

<script lang="ts">
  import { reveal } from '$lib/actions/reveal.ts';

  let {
    categories,
    series,
    format,
    ariaLabel,
  }: {
    categories: BarCategory[];
    series: BarSeries[];
    format: (value: number | null) => string;
    ariaLabel: string;
  } = $props();

  const max = $derived(
    Math.max(
      0,
      ...series.flatMap((s) => categories.map((c) => s.values[c.key] ?? 0)),
    ),
  );
  // 値ラベルの置き場所を残すため、最大の棒は幅の 82% までにする
  const widthOf = (v: number) => (max > 0 ? (v / max) * 82 : 0);
</script>

<ul class="grouped" aria-label={ariaLabel} use:reveal>
  {#each categories as c, ci (c.key)}
    <li style:--i={ci}>
      <div class="cat">
        <span class="cat-label">{c.label}</span>
        {#if c.sub}<span class="cat-sub">{c.sub}</span>{/if}
      </div>
      <div class="bars">
        {#each series as s (s.id)}
          {@const v = s.values[c.key] ?? null}
          <div class="bar-row" title="{s.label}: {format(v)}">
            <span class="visually-hidden">{s.label}</span>
            {#if v !== null}
              <span class="bar grow" style:width="{widthOf(v)}%" style:background={s.color}></span>
            {:else}
              <span class="missing" aria-hidden="true"></span>
            {/if}
            <span class="value num fade" class:na={v === null} style:--fade-delay="0.5s">{format(v)}</span>
          </div>
        {/each}
      </div>
    </li>
  {/each}
</ul>

<style>
  .grouped {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: grid;
    gap: 14px;
  }

  li {
    display: grid;
    grid-template-columns: minmax(0, 15rem) minmax(0, 1fr);
    gap: 4px 16px;
    align-items: center;
  }

  @media (max-width: 640px) {
    li {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .cat {
    display: grid;
    line-height: 1.35;
  }

  .cat-label {
    font-size: 0.875rem;
  }

  .cat-sub {
    color: var(--ink-muted);
    font-size: 0.75rem;
    overflow-wrap: anywhere;
  }

  .bars {
    display: grid;
    gap: 2px;
  }

  .bar-row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 14px;
  }

  .bar {
    height: 12px;
    border-radius: 0 4px 4px 0;
    min-width: 1px;
    /* 月や国を切り替えたときは長さを滑らかに変える */
    transition:
      width 0.5s cubic-bezier(0.25, 0.7, 0.25, 1),
      filter 0.1s;
  }

  .bar-row:hover .bar {
    filter: brightness(1.12);
  }

  .missing {
    width: 12px;
    height: 0;
    border-top: 1px solid var(--axis);
  }

  .value {
    font-size: 0.75rem;
    color: var(--ink-2);
    white-space: nowrap;
  }

  .value.na {
    color: var(--ink-muted);
  }
</style>
