# 公開と運用

Cloudflare Pages の GitHub 連携で公開します（D-013）。`main` へのマージで本番、ほかのブランチへのプッシュでプレビューがデプロイされます。独自ドメインは Netlify で管理している DNS に CNAME を登録して向けます。

## Cloudflare Pages プロジェクトの作成

ダッシュボードの「Workers & Pages」→「作成」→「Pages」タブ→「Git に接続」から、`takafumikobayashi/signals-japan-insight` を選びます。

| 項目 | 値 |
|---|---|
| プロジェクト名 | `signals-japan-insight`（`<プロジェクト名>.pages.dev` になる） |
| 本番ブランチ | `main` |
| フレームワーク プリセット | なし（SvelteKit を選んだ場合も出力先は `build` に直す） |
| ビルドコマンド | `npm run build` |
| ビルド出力ディレクトリ | `build` |
| Node.js | `.node-version`（22）で指定済み |

環境変数は不要です。公開 URL の既定値は `vite.config.ts` にあり、ドメインを変えるときだけ `PUBLIC_SITE_URL` を設定します。

「Workers」タブから作るとデプロイに `wrangler` を使う Worker になり、他社 DNS の CNAME では独自ドメインを使えません（D-012、D-013）。

## 独自ドメイン（Netlify DNS の CNAME）

公開ドメインは `signals.tariki-code.tokyo` です。

1. Pages プロジェクトの「カスタムドメイン」→「カスタムドメインを設定」で `signals.tariki-code.tokyo` を入力する。DNS が Cloudflare にないため、CNAME の登録を求める案内が表示される。
2. Netlify の「Domains」→ `tariki-code.tokyo` →「DNS settings」→「Add new record」で次を登録する。

   | 項目 | 値 |
   |---|---|
   | Record type | `CNAME` |
   | Name | `signals` |
   | Value | `<プロジェクト名>.pages.dev`（例: `signals-japan-insight.pages.dev`） |
   | TTL | 既定値のまま |

   `signals` に既存の A / CNAME レコードがあれば、先に削除する。
3. Cloudflare 側で「確認」を押し、状態が「有効」になるまで待つ（数分〜最大で数時間）。SSL 証明書は Cloudflare が発行する。
4. `https://signals.tariki-code.tokyo` で表示を確認する。

## 公開物の構成

- 全ページをプリレンダーした静的ファイル（`build/`）。サーバー処理はない。
- `static/_headers`: セキュリティヘッダーと、`/_app/immutable/*` の長期キャッシュ、`/data/*` の 1 時間キャッシュ。
- `404.html`: 存在しない URL の案内。`src/routes/404` をプリレンダーした完成済みのページで、Pages が 404 で返す。
- ビルドはネットワークに依存しない（`data/processed/` の生成済み JSON を使う）。

## ローカルでの確認

```sh
npm run build
npx wrangler pages dev build    # Pages と同じ配信方式で http://localhost:8788 に表示
```

## 公開前チェックリスト

- [ ] `npm run check`、`npm test`、`npm run data:verify`、`npm run build` が通る
- [ ] `npx wrangler pages dev build` で各ページが 200、存在しない URL が 404 ページになる
- [ ] 全ページの冒頭に非公式の表示があり、フッターに出典・ライセンス・取得日がある
- [ ] グラフの指標・分母・期間の表記がデータ辞書と一致する
- [ ] ライト / ダーク、スマホ幅（375px）で表示が崩れない
- [ ] OGP タグと canonical の URL が `https://signals.tariki-code.tokyo` になっている

## データ更新の手順

公式データが更新されたら、`develop` で次を行い、プルリクエスト経由で `main` に入れます。

1. `npm run data:fetch` を実行する。ハッシュが固定値と違えば停止する。
2. 公式ページとデータ辞書で、リリース版・期間・列・分類・ライセンスの変更を確認する。
3. `data/source.json` の `release` を新しい版に更新し、`npm run data:fetch -- --accept-new` で取り込む。
4. 辞書の IWA 一覧が変わっていれば、`pdftotext -layout data/raw/data-dictionary.pdf data/raw/data-dictionary.txt` のあと `npm run data:labels -- data/raw/data-dictionary.txt` を実行し、新しい IWA に日本語表示名を付ける。
5. `npm run data:build` と `npm run data:verify` を実行し、`docs/data-sources.md` の確認事項・数値を更新する。
6. 画面で期間・数値・注記を確認し、OGP 画像やドキュメントに古い期間の記述がないか見直す。

古い版の `data/processed/<release>/` は削除し、同じ画面に複数の版を混在させません。
