<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{page.status === 404 ? 'ページが見つかりません' : 'エラー'} | Signals Japan Insight</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<header class="page-head">
  <p class="eyebrow">{page.status}</p>
  <h1>{page.status === 404 ? 'ページが見つかりません' : 'エラーが発生しました'}</h1>
  <p class="lead">
    {page.status === 404
      ? 'URL が変わったか、削除された可能性があります。'
      : 'しばらくしてから再読み込みしてください。'}
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
