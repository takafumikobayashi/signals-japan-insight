<script lang="ts" module>
  export type RankingRow = { id: string; rank: number; label: string; sub: string; value: number; change?: string };
</script>

<script lang="ts">
  import { reveal } from '$lib/actions/reveal.ts';

  let {
    rows,
    selected,
    format,
    onselect,
    ariaLabel,
  }: {
    rows: RankingRow[];
    selected?: string;
    format: (value: number) => string;
    onselect: (id: string) => void;
    ariaLabel: string;
  } = $props();

  const max = $derived(Math.max(0, ...rows.map((r) => r.value)));
</script>

<ol class="ranking" aria-label={ariaLabel} use:reveal>
  {#each rows as r, i (r.id)}
    <li style:--i={Math.min(i, 20)}>
      <button type="button" class:selected={r.id === selected} aria-pressed={r.id === selected} onclick={() => onselect(r.id)}>
        <span class="rank num">{r.rank}</span>
        <span class="text">
          <span class="label">{r.label}</span>
          <span class="sub">{r.sub}</span>
        </span>
        <span class="bar-cell">
          <span class="bar grow" style:width="{max > 0 ? (r.value / max) * 100 : 0}%"></span>
        </span>
        <span class="value num">
          {format(r.value)}
          {#if r.change}<span class="change">{r.change}</span>{/if}
        </span>
      </button>
    </li>
  {/each}
</ol>

<style>
  .ranking {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
  }

  button {
    width: 100%;
    display: grid;
    grid-template-columns: 2.25rem minmax(0, 1.3fr) minmax(60px, 1fr) 5.5rem;
    gap: 4px 12px;
    align-items: center;
    padding: 6px 8px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    text-align: left;
    cursor: pointer;
  }

  button:hover {
    background: var(--wash);
  }

  button.selected {
    background: var(--wash);
    box-shadow: inset 3px 0 0 var(--series-jp);
  }

  @media (max-width: 640px) {
    button {
      grid-template-columns: 2rem minmax(0, 1fr) 5rem;
    }

    .bar-cell {
      grid-column: 2 / 4;
      grid-row: 2;
    }
  }

  .rank {
    color: var(--ink-2);
    text-align: right;
    font-size: 0.875rem;
  }

  .text {
    display: grid;
    line-height: 1.35;
  }

  .label {
    font-size: 0.875rem;
  }

  .sub {
    color: var(--ink-muted);
    font-size: 0.75rem;
    overflow-wrap: anywhere;
  }

  .bar-cell {
    display: block;
  }

  .bar {
    display: block;
    height: 12px;
    border-radius: 0 4px 4px 0;
    background: var(--series-jp);
    min-width: 1px;
    transition: width 0.5s cubic-bezier(0.25, 0.7, 0.25, 1);
  }

  .value {
    text-align: right;
    font-size: 0.875rem;
    display: grid;
  }

  .change {
    color: var(--ink-muted);
    font-size: 0.75rem;
  }
</style>
