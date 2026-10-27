import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Cloudflare Pages へ静的配信する。全ページとデータ JSON をビルド時に生成する。
    // 存在しない URL 用の 404.html は src/routes/404 をプリレンダーして作る。
    // SPA の fallback はレイアウトのサーバーデータを読めず表示に失敗するため使わない。
    adapter: adapter({ strict: true }),
    // 404.html は任意の深さの URL で返されるため、資産はルートからの絶対パスで参照する
    paths: { relative: false },
  },
};

export default config;
