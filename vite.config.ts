import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    // 公開先の URL（例: https://example.pages.dev）。OGP の画像・URL を絶対 URL にするために使う。
    __SITE_URL__: JSON.stringify(process.env.PUBLIC_SITE_URL ?? ''),
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
