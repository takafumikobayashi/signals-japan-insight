# 公開と運用

Cloudflare Pages の GitHub 連携で公開します。`main` へのマージが本番公開、プルリクエストはプレビュー公開になります。

## Cloudflare Pages の設定

ダッシュボードの「Workers & Pages」→「作成」→「Pages」→「Git に接続」から、`takafumikobayashi/signals-japan-insight` を選びます。

| 項目 | 値 |
|---|---|
| 本番ブランチ | `main` |
| フレームワーク プリセット | SvelteKit（または「なし」） |
| ビルドコマンド | `npm run build` |
| ビルド出力ディレクトリ | `build` |
| Node.js | `.node-version`（22）で指定済み |

### 環境変数

| 変数 | 値 | 用途 |
|---|---|---|
| `PUBLIC_SITE_URL` | 省略可（既定: `https://signals.tariki-code.tokyo`） | OGP の画像・URL と canonical の絶対 URL。ドメインを変えるときだけ設定する |

公開 URL の既定値は `vite.config.ts` にあります。プレビュー環境でも canonical と OGP は本番ドメインを指すため、プレビュー URL が検索結果に重複して載りにくくなります。

### 独自ドメイン

公開ドメインは `signals.tariki-code.tokyo` です。

1. Pages プロジェクトの「カスタムドメイン」→「カスタムドメインを設定」で `signals.tariki-code.tokyo` を追加する。
2. `tariki-code.tokyo` が同じ Cloudflare アカウントで管理されていれば、CNAME は自動で作られる。他社 DNS の場合は、`signals` の CNAME を `<プロジェクト名>.pages.dev` に向ける。
3. 証明書の発行（数分）を待ち、`https://signals.tariki-code.tokyo` で表示を確認する。

## 公開物の構成

- 全ページをプリレンダーした静的ファイル（`build/`）。サーバー処理はない。
- `static/_headers`: セキュリティヘッダーと、`/_app/immutable/*` の長期キャッシュ、`/data/*` の 1 時間キャッシュ。
- `404.html`: 存在しない URL の案内。
- ビルドはネットワークに依存しない（`data/processed/` の生成済み JSON を使う）。

## 公開前チェックリスト

- [ ] `npm run check`、`npm test`、`npm run data:verify`、`npm run build` が通る
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
