# 作業指針

このリポジトリは OpenAI Signals を出典とする、非公式・独立の日本向けインサイト企画です。実装・調査・文書更新では、次を守ってください。

- 画面とプロジェクト文書は原則日本語で作成する。CSV のフィールド名、IWA ID、公式カテゴリ名は原表記を維持する。
- OpenAI 公式または OpenAI Signals と誤認される表現を使わず、非公式で独立した可視化であることを明示する。
- 数値にはデータの版、対象期間、母集団、指標の分母を添える。`share_of_messages` を利用者数、利用者比率、雇用者比率、絶対件数として表現しない。
- 「世界」は公式のグローバル集計が提供される指標だけに使う。IWA の公式 CSV は国別のみで、世界 IWA 構成比を算出できる件数・重みもない。国別構成比の単純平均を世界値と呼ばない。
- 公式 Signals の分類はモデル推定によるメッセージ分類であり、利用者の自己申告や実際の職業・労働時間を表すと断定しない。
- CC BY 4.0 の帰属表示を維持し、公式出典へのリンク、リリース版、取得日を記録する。ロゴ・商標の使用は公式承認を示唆しないようにする。
- 初期アーキテクチャは SvelteKit、TypeScript、Cloudflare Pages、静的配信、CSV から JSON への前処理、DB なしを前提とする。方針変更は `docs/decisions.md` に理由を記録する。
- MVP と第2フェーズの範囲を混ぜない。日本の職業統計との比較は対応表・統計期間・母集団の検討後に着手する。
- データ仕様や数値に関する変更は、公式辞書と実 CSV を確認し、`docs/data-sources.md` を同時に更新する。

## 公式出典

- https://openai.com/index/chatgpt-expanding-world-of-work/
- https://openai.com/signals/data/
- https://openai.com/signals/data-download/
- https://cdn.openai.com/signals/data-dictionary.pdf
