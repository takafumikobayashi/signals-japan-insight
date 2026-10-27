<script lang="ts">
  import type { Snippet } from 'svelte';
  import Legend, { type LegendItem } from './Legend.svelte';

  let {
    title,
    meta,
    legend = [],
    children,
    table,
    notes,
    headingLevel = 2,
  }: {
    title: string;
    /** 指標・分母・時間粒度・対象。すべてのグラフで表示する。 */
    meta: string;
    legend?: LegendItem[];
    children: Snippet;
    table?: Snippet;
    notes?: Snippet;
    headingLevel?: 2 | 3;
  } = $props();
</script>

<figure class="card chart">
  <figcaption>
    <svelte:element this={`h${headingLevel}`}>{title}</svelte:element>
    <p class="meta">{meta}</p>
    <Legend items={legend} />
  </figcaption>
  {@render children()}
  {#if notes}
    <div class="notes">{@render notes()}</div>
  {/if}
  {#if table}
    <details class="table-view">
      <summary>表で見る</summary>
      <div class="table-scroll">{@render table()}</div>
    </details>
  {/if}
</figure>

<style>
  figure {
    margin: 0 0 20px;
  }

  .meta {
    color: var(--ink-2);
    font-size: 0.8125rem;
    margin: 0;
  }

  .notes {
    margin-top: 8px;
    color: var(--ink-2);
    font-size: 0.8125rem;
  }

  .notes :global(p) {
    margin: 0 0 4px;
  }
</style>
