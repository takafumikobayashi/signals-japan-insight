// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {}

  /** ビルド時の PUBLIC_SITE_URL（vite.config.ts で埋め込む）。未設定なら空文字。 */
  const __SITE_URL__: string;
}

export {};
