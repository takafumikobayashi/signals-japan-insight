// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {}

  /** 公開先の URL（vite.config.ts で埋め込む）。既定は本番ドメイン、PUBLIC_SITE_URL で上書きできる。 */
  const __SITE_URL__: string;
}

export {};
