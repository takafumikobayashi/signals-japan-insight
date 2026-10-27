# データソース・項目・グラフ対応

## 調査した公式ソース

調査日: 2026-10-27 JST。OpenAI の記事は2026-10-26付で、データ辞書と CSV ZIP は OpenAI Signals v3.0 として確認しました。

- [ChatGPT’s expanding world of work](https://openai.com/index/chatgpt-expanding-world-of-work/): 165 IWA、対象国の概要、四半期期間、データの用途。
- [Signals individual data](https://openai.com/signals/data/): 消費者向けデータの対象と旧来の Signals 月次分析。
- [Download data and methodology](https://openai.com/signals/data-download/): CSV ZIP、辞書、CC BY 4.0。
- [Data dictionary PDF](https://cdn.openai.com/signals/data-dictionary.pdf): v3.0 の方法、列定義、ファイル定義、プライバシー、分類プロンプト。
- [CSV ZIP](https://cdn.openai.com/signals/data-download-csv.zip): 調査時点で README.pdf と24 CSVを含む公開パッケージ。

## 実ファイルで確認したカバレッジ

| 項目 | CSV上の確認結果 | 解釈 |
|---|---|---|
| 日本の月次データ | 2024-07〜2026-09、27か月 | 仕事関連、トピック等の月次チャートに利用可能 |
| 日本の IWA | 2025-Q1〜2026-Q3、7四半期 | 月次ではなく四半期の活動ランキング・推移 |
| JP IWA 行数 | 1,155行 = 7四半期 × 165分類 | 各四半期で165値。内訳は164個の個別 IWA ID と `Other IWA` |
| IWA CSV 全体 | 93,555行。四半期ごとに公開国数が変動 | 国の公開可否は期間ごとに異なる。少数セルの非表示を欠損として扱う |
| JP 2026-Q3 の上位例 | `4.A.2.b.1.I07` 14.505%、`4.A.2.b.2.I18` 6.663%、`4.A.4.a.1.I03` 4.534%、`4.A.4.b.6.I07` 4.250%、`4.A.2.b.2.I12` 3.566% | 分母は日本の同四半期の仕事関連メッセージ。比率は DP 適用後・小数第5位の CSV 値 |
| JP の仕事関連比率例 | 2026-09 は28.5% | 全 JP 個人向け ChatGPT メッセージに占める仕事関連メッセージの構成比 |
| トピック例 | 2026-09 の仕事関連メッセージ中 Writing は JP 31.4%、global 32.6% | 月次の仕事トピックでは global と国別 CSV の双方がある |

上記は公開 CSV の集計値であり、サンプル件数や日本の就業者に対する利用割合ではありません。IWA の各四半期での構成比合計は丸めにより厳密な1にならず、例では0.99993〜1.00006の範囲でした。

## 主な列

| 列 | 意味 | 注意 |
|---|---|---|
| `month` | UTC の月初日 | 月次時系列のキー |
| `quarter` | 暦四半期の初日 | IWA は四半期集計 |
| `country` | ISO 3166-1 alpha-2 | 日本は `JP`。ファイルによって国・期間の公開範囲が異なる |
| `share_of_messages` | 0〜1の DP 適用済み・加重メッセージ構成比 | 行ごとに分母が異なる。利用者数や絶対件数ではない |
| `rank` | 人口で正規化したメッセージ量に基づく順位 | 1が最上位。国別の人口は世界銀行 World Development Indicators の2023年推計（米国州別は米国勢調査局 Population Estimates Program の2023年版1年推計）。絶対量・普及率は公開されていない |
| `work_related` | 0/1 の仕事関連分類 | 自動推定。1が仕事関連 |
| `work_schoolwork` | Work / Schoolwork / Other | 仕事と学業の区分 |
| `topic` | 7つの大分類 | 分類器の細分類をまとめた値 |
| `ask_do_express` | asking / doing / expressing | asking は情報や助言を求める、doing はモデルが主に作る出力（文章・コードなど）を依頼する、expressing はそのどちらでもないメッセージ（辞書 Section 9 の分類プロンプトによる定義）。「感情・意見の表明」に限定しない |
| `iwa_cleaned` | O*NET IWA ID または `Other IWA` | 低頻度の IWA は `Other IWA` にまとめられる |
| `plan_type` | free / go / plus / pro | 個人向けプランの分類 |
| `age_group` | 自己申告年齢の大区分 | 18歳未満・年齢未申告者はこの分析に含まれない |
| `typical_name_gender` | feminine / masculine | 氏名からの推定属性で、本人が申告した性別ではない |
| `state_code`, `state_name` | 米国州コード・名称 | 米国州別 CSV のみ |

## 24 CSV とグラフ対応

全ファイルの指標は `share_of_messages` または `rank`。`global` のファイルはグローバル集計、`country` を持つファイルは国別集計です。

| CSV | 主なキー列（指標列を除く） | 意味・この企画での用途 |
|---|---|---|
| `global_share_of_messages_by_gender_month.csv` | `month`, `typical_name_gender` | グローバルの氏名推定属性別構成。MVP対象外 |
| `share_of_messages_by_age_group_country_month.csv` | `month`, `country`, `age_group` | 国・月別の年齢構成。MVP対象外 |
| `share_of_messages_by_age_group_month.csv` | `month`, `age_group` | グローバル年齢構成。MVP対象外 |
| `share_of_messages_by_age_group_topic_country_month.csv` | `month`, `country`, `topic`, `age_group` | 国・トピック別の年齢構成。MVP対象外 |
| `share_of_messages_by_age_group_topic_month.csv` | `month`, `topic`, `age_group` | グローバルトピック別の年齢構成。MVP対象外 |
| `share_of_messages_by_country_quarter_rank.csv` | `quarter`, `country` | 人口当たりメッセージ量の国別順位。補足指標。順位であり人数ではない |
| `share_of_messages_by_gender_country_month.csv` | `month`, `country`, `typical_name_gender` | 国別の氏名推定属性構成。MVP対象外 |
| `share_of_messages_by_gender_topic_country_month.csv` | `month`, `country`, `topic`, `typical_name_gender` | 国・トピック別の氏名推定属性構成。MVP対象外 |
| `share_of_messages_by_gender_topic_month.csv` | `month`, `topic`, `typical_name_gender` | グローバルトピック別の氏名推定属性構成。MVP対象外 |
| `share_of_messages_by_topic_country_month.csv` | `month`, `country`, `topic` | 国別・全メッセージのトピック構成。必要に応じ補助グラフ |
| `share_of_messages_by_topic_month.csv` | `month`, `topic` | グローバル・全メッセージのトピック構成。必要に応じ補助グラフ |
| `share_of_messages_by_topic_work_related_country_month.csv` | `month`, `country`, `work_related`, `topic` | 国・仕事関連区分別のトピック構成。JP用途推移と国比較の主データ。仕事関連は `work_related=1` |
| `share_of_messages_by_topic_work_related_month.csv` | `month`, `work_related`, `topic` | グローバルの仕事関連区分別トピック構成。世界比較の主データ。仕事関連は `work_related=1` |
| `share_of_messages_by_work_related_ask_do_express_country_month.csv` | `month`, `country`, `work_related`, `ask_do_express` | 国・仕事関連区分別の Ask/Do/Express 構成 |
| `share_of_messages_by_work_related_ask_do_express_month.csv` | `month`, `work_related`, `ask_do_express` | グローバルの Ask/Do/Express 構成 |
| `share_of_messages_by_work_related_country_month.csv` | `month`, `country`, `work_related` | 国別の仕事関連・非仕事関連メッセージ比率 |
| `share_of_messages_by_work_related_month.csv` | `month`, `work_related` | グローバルの仕事関連・非仕事関連比率 |
| `share_of_messages_by_work_related_plan_type_month.csv` | `month`, `work_related`, `plan_type` | プラン別の仕事関連比率。MVP対象外 |
| `share_of_messages_by_work_related_topic_month.csv` | `month`, `work_related`, `topic` | グローバルで、トピックごとに仕事関連となる割合。用途構成とは条件付き分母が異なるため注意 |
| `share_of_messages_by_work_schoolwork_month.csv` | `month`, `work_schoolwork` | グローバルの Work/Schoolwork/Other 構成 |
| `share_of_work_related_messages_by_onet_iwa_country_quarter.csv` | `quarter`, `country`, `iwa_cleaned` | 仕事関連メッセージ内の IWA 構成。日本のランキング・四半期推移・国別比較の主データ |
| `usa_share_of_messages_by_state_quarter_rank.csv` | `quarter`, `state_code`, `state_name` | 米国州別の人口当たり順位。MVP対象外 |
| `usa_share_of_messages_by_topic_quarter.csv` | `quarter`, `country`, `topic` | 米国の四半期トピック構成。MVP対象外 |
| `usa_share_of_messages_by_topic_state_quarter.csv` | `quarter`, `state_code`, `state_name`, `topic` | 米国州別の四半期トピック構成。MVP対象外 |

上記キー列の後に、各 CSV では `share_of_messages` または `rank` が続きます。実装時には実ファイルのヘッダーを再検証してください。

## MVP グラフへの割当て

| グラフ | データ・フィルター | 横軸 / 縦軸 | 分母・粒度 |
|---|---|---|---|
| 日本の職務活動ランキング | `share_of_work_related_messages_by_onet_iwa_country_quarter.csv`, `country=JP` | IWAカテゴリ / `share_of_messages`（%）。四半期セレクターで順位付け | JP の仕事関連メッセージ、四半期 |
| 日本の活動構成の推移 | 同ファイル、`country=JP` | `quarter` / 選択 IWA の `share_of_messages` | JP の仕事関連メッセージ、四半期 |
| 日本の仕事関連比率 | `share_of_messages_by_work_related_country_month.csv`, `country=JP` と `share_of_messages_by_work_related_month.csv` | `month` / `work_related=1` の割合 | それぞれ JP または global の全メッセージ、月次 |
| 日本と世界・国の仕事用途比較 | `share_of_messages_by_topic_work_related_country_month.csv` と `share_of_messages_by_topic_work_related_month.csv`, `work_related=1` | `topic` / `share_of_messages`。期間をそろえた小分け棒または折れ線 | 各地域の仕事関連メッセージ、月次 |
| Ask / Do / Express | 国別ファイルと global ファイル、`work_related=1` | `ask_do_express` または `month` / 比率 | 各地域の仕事関連メッセージ、月次 |
| 日本と指定国の IWA 比較 | IWA CSV、同一 `quarter` と複数 `country` | IWA / `share_of_messages` | 各国の仕事関連メッセージ、四半期。世界値なし |

`global` と `country` の IWA 比率は直接比較できる形式で同時提供されていません。地域別比率を国別で単純平均して「世界」を作ることもできません。元 CSV に絶対件数や地域別の加重分母がないためです。

## 分類の説明

OpenAI Signals の記事は165の職務活動を O*NET の IWA として説明しています。v3.0 の辞書では、分類器は候補 IWA からメッセージの意図に最も合うカテゴリを推定し、低頻度の IWA を `Other IWA` に集約すると説明しています。実 CSV で確認できた165値は、164の個別 IWA ID と `Other IWA` でした。IWA は職業の一覧ではありません。

2026-Q3 の JP 上位例を辞書の英語ラベルに対応させると、文章・文書の編集（14.505%）、視覚的なデザイン・展示の作成（6.663%）、言語・文化・宗教情報の解釈（4.534%）、教育・職業に関する助言（4.250%）、マーケティング・販促資料の作成（3.566%）です。これらは各四半期・国の仕事関連メッセージ内の比率です。日本語名は `data/reference/iwa-labels.csv` の非公式表示名です。

英語ラベルは、データ辞書の付録にある分類プロンプト内の「Full list of all 332 IWA IDs and Descriptions」から抽出しました。CSV に現れる164の IWA ID はすべてこの一覧に含まれています。日本語表示名は本プロジェクトによる訳で、分類の定義は英語原文に従います。

## 制約と測定上の注意

- **母集団**: 18歳以上と関連づけられた個人向け ChatGPT アカウントのメッセージ。Free、Go、Plus、Pro が対象。Enterprise メッセージおよび Codex 利用は含まれず、仕事・技術利用を過少に捉える可能性がある。
- **標本**: 辞書は月あたり100万件の消費者メッセージ分類に基づくと説明する。日ごとのログ構成差を補正する加重が使われ、最大重みは1.5。
- **除外**: アカウントを削除した利用者、およびデータを学習に使うことを許可しなかった利用者を標本から除く。
- **推定分類**: 仕事関連、トピック、Ask/Do/Express、IWA はモデル分類で、自己申告ではない。研究者が生の会話を読まず、PII を除去した後の自動分類を使うと説明されている。
- **プライバシー**: 公開集計に差分プライバシーのノイズを加え、少数グループは非表示にする。精度は系列ごとに異なる。
- **丸め**: 辞書によると通常の比率は小数第3位、O*NET IWA は第5位まで丸められる。DP 適用後の値なので、分類を足しても厳密に100%にならない場合がある。
- **実数と推計**: 公開 CSV の値は観測メッセージをそのまま全数集計した件数ではなく、重み付け・DP 適用・丸めを含む構成比。利用者数・就業者数・全労働時間の推計に転用しない。
- **国際比較**: 人口当たり順位は国別メッセージ量を人口（世界銀行の2023年推計）で正規化した順位で、利用者割合や国民一人あたりの実測件数とは異なる。国別 CSV は期間により公開国数が変わる。
- **世界比較**: global は Signals のグローバル標本に対する集計であり、世界全人口や全職場の代表サンプルと同義ではない。IWA の global 行は公開されていない。
- **リリース更新**: v3.0 は過去データの再公開・標本拡大・方法変更を含む。過去版との比較では、同一バージョン内で比較する。

## 前処理で確認した事項（2026-10-27、v3.0）

`npm run data` で実 CSV を全行検証した結果です。

| 項目 | 結果 |
|---|---|
| 固定した入力 | ZIP の SHA-256 `04ab1a32…6ef6`、辞書 PDF の SHA-256 `920b7def…a99ba2`。ZIP 内の README.pdf は辞書 PDF と同一 |
| 形式 | MVP 対象 CSV に引用符・空欄・BOM・キーの重複はない。期間はすべて月初または四半期初日 |
| IWA | 567 の国・四半期（四半期あたり76〜90か国）。各国・四半期で165分類がすべて公開される。構成比の合計は0.99986〜1.0001 |
| 仕事関連比率 | global と160か国。各国・月で `work_related` の 0 と 1 がそろう。合計はすべて1.000 |
| トピック・Ask/Do/Express | 小さい国では `work_related` の片方だけが公開される国・月がある（トピック 38か国・421件、Ask/Do/Express 34か国・413件）。JP にはない。欠けた区分は非公開として扱い、0 にしない |
| 日本 | 5データセットすべてで、ファイル内の全期間に JP が存在する |
| 順位 | 7四半期で181か国・1,214行 |
| 定義の照合 | 辞書（SHA-256 `920b7def…a99ba2`）の Section 9 の ask_do_express プロンプトと、`rank` 脚注の人口出典を確認。CSV の `ask_do_express` の値は `asking` / `doing` / `expressing` の3種、順位 CSV の列は `quarter,country,rank` |

## 生成 JSON の構造

全データセットに共通する項目は `dataset`、`release`、`metric`、`denominator`、`period`、`periods`、`dimensions`、`categories`、`layout`、`scopes`、`notes`、`sources`（元 CSV 名・SHA-256）、`series` です。値は CSV の数値をそのまま使い、0〜1 の構成比のままにしています（% への換算は表示時に行います）。

- `series[scope][period]` が基本です。`scope` は `global` または ISO 国コード、`period` は `YYYY-MM-01` です。
- `layout: "array"`（IWA）では、値は `categories.iwa_cleaned` と同じ順に並ぶ配列です。
- `layout: "nested"`（月次）では、`series.JP["2026-09-01"]["1"]["Writing"]` のように次元の順にキーをたどります。
- `layout: "value"`（順位）では、`series.JP["2026-07-01"]` が順位そのものです。
- 公開されていない国・期間・区分はキー自体がありません。0 や補間値は入れていません。

## ライセンスと帰属

OpenAI のデータページは Signals データのライセンスを Creative Commons Attribution 4.0 International（CC BY 4.0）と明記しています。再利用時は OpenAI Signals v3.0 と出典 URL を表示し、改変した場合は変更の旨を示します。ライセンスは OpenAI の商標、公式提携、承認を許諾するものではありません。

推奨引用（公式ページ記載）:

> Aaron Chatterji, Thomas Cunningham, David J. Deming, Zoe Hitzig, Drew Johnston, Alex Martin Richmond, Christopher Ong, Carl Yan Shan, and Kevin Wadman. *OpenAI Signals v3.0*. OpenAI, 2026. https://openai.com/signals/data-download/ （閲覧日 2026-10-27）.
