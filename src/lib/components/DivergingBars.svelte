<script lang="ts" module>
  export type DivergingRow = { key: string; label: string; sub?: string; value: number | null; highlight?: boolean };
</script>

<script lang="ts">
  import { reveal } from '$lib/actions/reveal.ts';

  let {
    rows,
    format,
    ariaLabel,
    negLabel,
    posLabel,
  }: {
    rows: DivergingRow[];
    /** 左右の向きの意味（例: 下がった / 上がった） */
    negLabel?: string;
    posLabel?: string;
    /** 値（ポイント）を符号付きで表す */
    format: (value: number | null) => string;
    ariaLabel: string;
  } = $props();

  // 0 を中央に置き、左右の最大値で揃える。値ラベルの置き場所を残すため棒は半分の幅の 80% まで
  const maxAbs = $derived(Math.max(0.1, ...rows.map((r) => Math.abs(r.value ?? 0))));
  const widthOf = (v: number) => (Math.abs(v) / maxAbs) * 40;

  // 値が変わったら棒を作り直して、伸びるアニメーションを毎回再生する
  // （作り直さないと、符号が変わった棒だけが再生され、ほかは幅が切り替わるだけになる）
  const drawKey = $derived(rows.map((r) => `${r.key}:${r.value}`).join('|'));
</script>

{#if negLabel || posLabel}
  <div class="direction" aria-hidden="true">
    <span></span>
    <div class="direction-track">
      <span class="dir neg">← {negLabel}</span>
      <span class="dir pos">{posLabel} →</span>
    </div>
  </div>
{/if}
<ul class="diverging" aria-label={ariaLabel} use:reveal>
  {#key drawKey}
  {#each rows as r, i (r.key)}
    <li style:--i={i} class:hl={r.highlight}>
      <div class="cat">
        <span class="cat-label">{r.label}</span>
        {#if r.sub}<span class="cat-sub">{r.sub}</span>{/if}
      </div>
      <div class="track" title="{r.label}: {format(r.value)}">
        <span class="zero" aria-hidden="true"></span>
        {#if r.value !== null}
          {#if r.value < 0}
            <span class="bar neg grow" style:width="{widthOf(r.value)}%"></span>
            <span class="value num fade left" style:right="calc(50% + {widthOf(r.value)}% + 6px)">{format(r.value)}</span>
          {:else}
            <span class="bar pos grow" style:width="{widthOf(r.value)}%"></span>
            <span class="value num fade right" style:left="calc(50% + {widthOf(r.value)}% + 6px)">{format(r.value)}</span>
          {/if}
        {:else}
          <span class="value num na">—</span>
        {/if}
      </div>
    </li>
  {/each}
  {/key}
</ul>

<style>
  .direction {
    display: grid;
    grid-template-columns: minmax(7rem, 11rem) 1fr;
    gap: 12px;
    margin-top: 12px;
    font-size: 0.75rem;
    color: var(--ink-muted);
  }

  .direction-track {
    display: flex;
  }

  .dir {
    flex: 1;
  }

  .dir.neg {
    text-align: right;
    padding-right: 10px;
  }

  .dir.pos {
    padding-left: 10px;
  }

  @media (max-width: 520px) {
    .direction {
      grid-template-columns: 1fr;
      gap: 0;
    }
  }

  .diverging {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
  }

  li {
    display: grid;
    grid-template-columns: minmax(7rem, 11rem) 1fr;
    gap: 12px;
    align-items: center;
    padding: 6px 0;
  }

  @media (max-width: 520px) {
    li {
      grid-template-columns: 1fr;
      gap: 2px;
    }
  }

  .cat {
    display: flex;
    flex-direction: column;
    font-size: 0.875rem;
    line-height: 1.35;
  }

  .hl .cat-label {
    font-weight: 600;
  }

  .cat-sub {
    color: var(--ink-muted);
    font-size: 0.75rem;
  }

  .track {
    position: relative;
    height: 22px;
  }

  .zero {
    position: absolute;
    left: 50%;
    top: -4px;
    bottom: -4px;
    border-left: 1px dashed var(--axis);
  }

  .bar {
    position: absolute;
    top: 4px;
    height: 14px;
    border-radius: 2px;
    background: var(--series-ref);
  }

  .track .bar.neg {
    right: 50%;
    transform-origin: right center;
  }

  .bar.pos {
    left: 50%;
  }

  .hl .bar {
    background: var(--series-jp);
  }

  .value {
    position: absolute;
    top: 0;
    font-size: 0.8125rem;
    line-height: 22px;
    white-space: nowrap;
    color: var(--ink-2);
  }

  .hl .value {
    color: var(--ink);
    font-weight: 600;
  }

  .value.na {
    left: calc(50% + 6px);
  }
</style>
