# 公開と運用

Cloudflare Workers の静的アセット配信で公開します（D-012）。GitHub 連携（Workers Builds）により、`main` へのマージで本番、ほかのブランチへのプッシュでプレビューがデプロイされます。

## 設定ファイル

`wrangler.jsonc` がデプロイ設定です。

| 項目 | 値 | 意味 |
|---|---|---|
| `name` | `signals-japan-insight` | Cloudflare 上の Worker 名と一致させる |
| `assets.directory` | `./build` | ビルド結果をそのまま配信する（Worker スクリプトなし） |
| `assets.html_handling` | `auto-trailing-slash` | `/usage` に `usage.html` を返す |
| `assets.not_found_handling` | `404-page` | 存在しない URL に `404.html` を 404 で返す |
| `previews` | `{}` | プレビューデプロイ（`npx wrangler preview`）に必要 |

## Cloudflare ダッシュボードの設定

Worker の「設定」→「ビルド」で次のようにします。

| 項目 | 値 |
|---|---|
| 本番ブランチ | `main` |
| ビルドコマンド | `npm run build` |
| デプロイコマンド | `npx wrangler deploy` |
| プレビューのデプロイコマンド | `npx wrangler preview` |
| Node.js | `.node-version`（22）で指定済み |

環境変数は不要です。公開 URL の既定値は `vite.config.ts` にあり、ドメインを変えるときだけ `PUBLIC_SITE_URL` を設定します。

### 独自ドメイン

公開ドメインは `signals.tariki-code.tokyo` です。

1. Worker の「設定」→「ドメインとルート」→「追加」→「カスタムドメイン」で `signals.tariki-code.tokyo` を追加する。
2. `tariki-code.tokyo` が同じ Cloudflare アカウントで管理されていれば、DNS と証明書は自動で設定される。
3. 数分待ち、`https://signals.tariki-code.tokyo` で表示を確認する。

## 公開物の構成

- 全ページをプリレンダーした静的ファイル（`build/`）。サーバー処理はない。
- `static/_headers`: セキュリティヘッダーと、`/_app/immutable/*` の長期キャッシュ、`/data/*` の 1 時間キャッシュ。
- `404.html`: 存在しない URL の案内。`src/routes/404` をプリレンダーした完成済みのページ。
- ビルドはネットワークに依存しない（`data/processed/` の生成済み JSON を使う）。

## ローカルでの確認

```sh
npm run build
npx wrangler dev        # 本番と同じ配信設定で http://localhost:8787 に表示
npx wrangler deploy --dry-run   # 設定の検証（アップロードしない）
```

## 公開前チェックリスト

- [ ] `npm run check`、`npm test`、`npm run data:verify`、`npm run build` が通る
- [ ] `npx wrangler dev` で各ページが 200、存在しない URL が 404 ページになる
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
