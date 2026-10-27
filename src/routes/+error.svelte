<script lang="ts">
  import { page } from '$app/state';
  import ErrorView from '$lib/components/ErrorView.svelte';
</script>

<!-- サイト内の移動で起きたエラー（存在しないページへのリンクなど）を表示する -->
<ErrorView status={page.status} />
