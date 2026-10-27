<script lang="ts" module>
  export type LegendItem = { label: string; color: string; kind?: 'line' | 'rect' };
</script>

<script lang="ts">
  let { items }: { items: LegendItem[] } = $props();
</script>

{#if items.length > 1}
  <ul class="legend">
    {#each items as item (item.label)}
      <li>
        <span class="key {item.kind ?? 'line'}" style:background={item.color} aria-hidden="true"></span>
        {item.label}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    list-style: none;
    margin: 8px 0 4px;
    padding: 0;
    font-size: 0.8125rem;
    color: var(--ink-2);
  }

  li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .key.line {
    width: 16px;
    height: 2px;
    border-radius: 1px;
  }

  .key.rect {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
</style>
