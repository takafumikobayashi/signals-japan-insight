import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    // 公開先の URL。OGP の画像・URL と canonical を絶対 URL にするために使う。
    // 環境変数 PUBLIC_SITE_URL で上書きできる。プレビュー環境でも canonical は本番を指す。
    __SITE_URL__: JSON.stringify(process.env.PUBLIC_SITE_URL || 'https://signals.tariki-code.tokyo'),
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
