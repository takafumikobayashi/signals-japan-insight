# Signals Japan Insight

OpenAI Signals の公開集計をもとに、個人向け ChatGPT の仕事利用を日本の視点から読み解く、非公式・独立のダッシュボードを構想するプロジェクトです。

> **非公式プロジェクトです。** OpenAI が運営・承認・推奨するサービスではありません。OpenAI の名称・商標を公式な提携や承認を示す形で使用しません。

## 目的

日本の ChatGPT 利用者が仕事でどのような活動を持ち込み、用途の構成がどう変化しているかを公開集計で示します。国際比較は同じ定義・同じ期間のデータがある指標に限ります。

## MVP

1. 日本の仕事関連メッセージについて、O*NET Intermediate Work Activities（IWA）の165分類を四半期別にランキングし、用途カテゴリと推移を表示する。
2. 日本を世界集計および利用可能な指定国と比較する。月次の仕事用途・トピックは世界集計と国別集計を比較できる。IWAには世界集計行がないため、IWAの比較対象は国別データに限る。

第2フェーズでは、日本の職業統計と IWA の対応関係を調査し、職業構成と ChatGPT 上の活動構成のギャップを検討します。これは同じ母集団を直接比較するものではなく、対応表と統計定義を確認してから扱います。

## データと指標

調査時点の公式リリースは OpenAI Signals v3.0 です。月次データは2024年7月〜2026年9月、IWA は2025年第1四半期〜2026年第3四半期です。JP の CSV には、月次27期間と各四半期165分類が含まれていました。

`share_of_messages` は対象となるメッセージ群の構成比です。利用者数、雇用者数、普及率、絶対メッセージ件数ではありません。IWA の構成比は「その国・四半期の仕事関連メッセージのうち、各活動に分類された割合」です。世界全体の IWA 構成比は公開 CSV に存在しません。

## 技術方針

- SvelteKit と TypeScript
- Cloudflare Workers の静的アセット配信を基本とする（設定は `wrangler.jsonc`）
- 公式 CSV を前処理して必要な JSON を生成する
- 初期段階ではデータベースを設けない

## データ準備

Node.js 22.18 以降が必要です。

```sh
npm install
npm run data        # 公式データの取得 → JSON 生成 → 検証
```

生成物は `data/processed/v3.0/` にあります。

## 開発

```sh
npm run dev         # 開発サーバー
npm run check       # 型チェック（画面とデータスクリプト）
npm test            # 単体テスト
npm run build       # 静的サイトを build/ に出力（Cloudflare Workers で配信）
npm run preview     # ビルド結果の確認
```取得・変換・検証の詳細は[アーキテクチャ](docs/architecture.md)を参照してください。

## ドキュメント

- [コンセプト](docs/concept.md)
- [要件](docs/requirements.md)
- [データソース・項目・グラフ対応](docs/data-sources.md)
- [アーキテクチャ](docs/architecture.md)
- [ロードマップ](docs/roadmap.md)
- [決定記録](docs/decisions.md)
- [公開と運用](docs/deploy.md)
- [作業時の指針](AGENTS.md)

## 出典・ライセンス

- **コード**: [MIT License](LICENSE)
- **データ**: `data/` 以下の公式データに由来するファイル（生成 JSON、IWA の英語ラベル）は OpenAI Signals の CC BY 4.0 に従います。IWA の日本語表示名は本プロジェクトによる非公式訳です。

OpenAI Signals の公開データは CC BY 4.0 で提供されています。データを利用・再配布・改変する際は OpenAI Signals v3.0 を適切に帰属表示し、[ライセンス](https://creativecommons.org/licenses/by/4.0/)の条件に従います。データライセンスは OpenAI の商標利用許諾や公式認定を意味しません。

- [ChatGPT’s expanding world of work](https://openai.com/index/chatgpt-expanding-world-of-work/)
- [Signals individual data](https://openai.com/signals/data/)
- [Download data and methodology](https://openai.com/signals/data-download/)
- [OpenAI Signals data dictionary (PDF)](https://cdn.openai.com/signals/data-dictionary.pdf)
- [Signals CSV download (ZIP)](https://cdn.openai.com/signals/data-download-csv.zip)

調査日: 2026-10-27（JST）。公式データの更新に応じて、対象期間・列・分類・ライセンス条件を再確認してください。
