<script lang="ts">
  let { status }: { status: number } = $props();
  const notFound = $derived(status === 404);
</script>

<svelte:head>
  <title>{notFound ? 'ページが見つかりません' : 'エラー'} | Signals Japan Insight</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<header class="page-head">
  <p class="eyebrow">{status}</p>
  <h1>{notFound ? 'ページが見つかりません' : 'エラーが発生しました'}</h1>
  <p class="lead">
    {notFound ? 'URL が変わったか、削除された可能性があります。' : 'しばらくしてから再読み込みしてください。'}
  </p>
  <div class="actions">
    <a class="button" href="/">概要へ戻る</a>
  </div>
</header>

<style>
  .actions {
    display: flex;
    justify-content: center;
    margin-top: 28px;
  }
</style>
