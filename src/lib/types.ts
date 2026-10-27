/** ページとデータ JSON エンドポイントで共有する型。値はすべて公式 CSV の 0〜1 の構成比のまま。 */

export type IwaLabel = { id: string; labelEn: string; labelJa: string };

/** 1 地域（global または国）の月次データ。仕事関連メッセージ（work_related=1）に限る。 */
export type MonthlyScopeData = {
  scope: string;
  /** 全メッセージに占める仕事関連メッセージの構成比 */
  workShare: Record<string, number>;
  /** 仕事関連メッセージ内のトピック構成比 */
  topics: Record<string, Record<string, number>>;
  /** 仕事関連メッセージ内の Ask / Do / Express 構成比 */
  intent: Record<string, Record<string, number>>;
};

/** 1 か国の四半期別 IWA 構成比。配列は iwaIds と同じ順。 */
export type IwaCountryData = { country: string; quarters: Record<string, number[]> };

export type DataInfo = {
  release: string;
  retrievedAt: string;
  attribution: string;
  citation: string;
  license: { name: string; url: string };
  pages: string[];
  csvZipUrl: string;
  dictionaryUrl: string;
  months: string[];
  quarters: string[];
};
