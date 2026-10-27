<script lang="ts">
  import { page } from '$app/state';

  let { title, description }: { title?: string; description: string } = $props();

  const SITE_NAME = 'Signals Japan Insight';
  const OG_IMAGE = '/og-image.jpg';
  const OG_IMAGE_ALT =
    'Signals Japan Insight — OpenAI Signals の公開データをもとに日本の ChatGPT 仕事利用を可視化する非公式ダッシュボード';

  // OGP の画像と URL は絶対 URL が必要。公開先の URL はビルド時の PUBLIC_SITE_URL で指定する。
  const base = __SITE_URL__.replace(/\/$/, '');
  const fullTitle = $derived(title ? `${title} | ${SITE_NAME}` : SITE_NAME);
  const url = $derived(`${base}${page.url.pathname}`);
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <meta property="og:type" content={title ? 'article' : 'website'} />
  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:locale" content="ja_JP" />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  {#if base}
    <meta property="og:url" content={url} />
    <link rel="canonical" href={url} />
  {/if}
  <meta property="og:image" content="{base}{OG_IMAGE}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={OG_IMAGE_ALT} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={fullTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content="{base}{OG_IMAGE}" />
</svelte:head>
