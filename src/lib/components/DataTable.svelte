<script lang="ts" module>
  export type Column = { key: string; label: string; numeric?: boolean };
</script>

<script lang="ts">
  let {
    caption,
    columns,
    rows,
  }: { caption: string; columns: Column[]; rows: Record<string, string | number>[] } = $props();
</script>

<table>
  <caption class="visually-hidden">{caption}</caption>
  <thead>
    <tr>
      {#each columns as c (c.key)}
        <th scope="col" class:num={c.numeric}>{c.label}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each rows as row, i (i)}
      <tr>
        {#each columns as c (c.key)}
          <td class:num={c.numeric}>{row[c.key] ?? ''}</td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
