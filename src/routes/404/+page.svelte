<script lang="ts">
  import ErrorView from '$lib/components/ErrorView.svelte';
</script>

<!--
  静的配信用の 404 ページ。プリレンダーで build/404.html になり、Cloudflare Pages が存在しない URL に返す。
  レイアウトのデータを HTML に埋め込んだ完成済みのページなので、/<URL>/__data.json を取りに行かずに表示できる。
-->
<ErrorView status={404} />
