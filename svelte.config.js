import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Cloudflare Pages へ静的配信する。全ページとデータ JSON をビルド時に生成する。
    // 存在しない URL では 404.html を返し、+error.svelte で案内する
    adapter: adapter({ strict: true, fallback: '404.html' }),
  },
};

export default config;
