/**
 * 探索的分析: 日本の休暇カレンダーと、ChatGPT の仕事関連メッセージ構成比の関係。
 *
 *   node scripts/analysis/holiday-calendar.ts
 *
 * 入力:
 *   - OpenAI Signals v3.0 の公式 CSV（npm run data:fetch で data/raw/csv/ に展開）
 *   - 内閣府「国民の祝日」CSV（data/external/cao-syukujitsu.csv。Shift_JIS のまま保存）
 * 出力:
 *   - data/analysis/holiday-calendar.json（結果メモ docs/analysis/holiday-calendar.md の数値の元）
 *
 * 指標はすべて share_of_messages（構成比）。件数・利用者数・利用率ではない。
 * 落ち込み（dip）は「対象月の値 − 前後月の平均」で測る。全体の低下傾向を休暇の効果と取り違えないため。
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAW_CSV_DIR, ROOT, fail, readCsvTable, readSourceConfig, sha256 } from '../data/lib.ts';

const HOLIDAY_CSV = join(ROOT, 'data', 'external', 'cao-syukujitsu.csv');
const HOLIDAY_SHA256 = 'cec37a743c96995cdb9cb52b685c9003634682a9b0e1a640a6b9b96881fe964a';
const OUT_DIR = join(ROOT, 'data', 'analysis');
const OUT_JSON = join(OUT_DIR, 'holiday-calendar.json');

// ---- 比較グループ（本分析の独自分類。地域区分の公式定義ではない）----
const GROUPS: Record<string, string[]> = {
  東アジア: ['JP', 'KR', 'TW'],
  欧州: ['DE', 'FR', 'GB', 'IT', 'ES', 'NL', 'SE', 'PL'],
  北米: ['US', 'CA'],
  南半球温帯: ['AU', 'NZ', 'AR', 'CL', 'UY', 'BR', 'ZA'],
};

// ---- 慣行上の休暇（独自定義。国民の祝日ではない）----
// 年末年始: 行政機関の休日に関する法律 第1条第1項第3号の 12月29日〜1月3日。
// お盆: 法令上の定義はない。本分析では 8月13日〜16日 とする。
const isNenmatsu = (m: number, d: number) => (m === 12 && d >= 29) || (m === 1 && d <= 3);
const isObon = (m: number, d: number) => m === 8 && d >= 13 && d <= 16;

// ---------------------------------------------------------------------------

type Series = Map<string, number>; // month(YYYY-MM) -> share

function round(x: number | null, digits = 2): number | null {
  if (x === null || !Number.isFinite(x)) return null;
  const f = 10 ** digits;
  return Math.round(x * f) / f;
}
const pt = (x: number | null) => (x === null ? null : round(x * 100, 2)); // 構成比の差 → ポイント

function shiftMonth(ym: string, k: number): string {
  const [y, m] = ym.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + k, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** 対象月 − 前後 k か月の平均。どれかが欠けていれば null。 */
function dip(s: Series, ym: string, k = 1): number | null {
  const v = s.get(ym);
  if (v === undefined) return null;
  const around: number[] = [];
  for (let i = 1; i <= k; i++) {
    const a = s.get(shiftMonth(ym, -i));
    const b = s.get(shiftMonth(ym, i));
    if (a === undefined || b === undefined) return null;
    around.push(a, b);
  }
  return v - mean(around);
}

function pearson(xs: number[], ys: number[]): number {
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i]! - mx;
    const dy = ys[i]! - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxy / Math.sqrt(sxx * syy);
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2]! : (s[n / 2 - 1]! + s[n / 2]!) / 2;
}

// ---- 入力の読み込み --------------------------------------------------------

const source = readSourceConfig();

const holidayBuf = readFileSync(HOLIDAY_CSV);
if (sha256(holidayBuf) !== HOLIDAY_SHA256) {
  fail('data/external/cao-syukujitsu.csv が記録した SHA-256 と一致しません。取得し直した場合は値と取得日を更新してください。');
}
const holidays = new Map<string, string>(); // YYYY-MM-DD -> 名称
for (const line of new TextDecoder('shift_jis').decode(holidayBuf).split(/\r?\n/).slice(1)) {
  const [date, name] = line.split(',');
  if (!date || !name) continue;
  const [y, m, d] = date.split('/').map(Number) as [number, number, number];
  holidays.set(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, name);
}

function loadByCountry(file: string, keep: (r: Record<string, string>) => boolean, key: (r: Record<string, string>) => string) {
  const { header, rows } = readCsvTable(join(RAW_CSV_DIR, file));
  const out = new Map<string, Series>();
  for (const row of rows) {
    const r = Object.fromEntries(header.map((h, i) => [h, row[i] ?? '']));
    if (!keep(r)) continue;
    const k = key(r);
    if (!out.has(k)) out.set(k, new Map());
    out.get(k)!.set(r.month!.slice(0, 7), Number(r.share_of_messages));
  }
  return out;
}

const workByCountry = loadByCountry(
  'share_of_messages_by_work_related_country_month.csv',
  (r) => r.work_related === '1',
  (r) => r.country!,
);
const globalWork = loadByCountry(
  'share_of_messages_by_work_related_month.csv',
  (r) => r.work_related === '1',
  () => 'global',
).get('global')!;

const jp = workByCountry.get('JP');
if (!jp) fail('JP の仕事関連比率が見つかりません');
const months = [...jp.keys()].sort();

// ---- 1. 日本の暦（JST） ----------------------------------------------------

type CalendarMonth = {
  month: string;
  days: number;
  weekdays: number; // 月〜金
  holidaysOnWeekdays: number; // 国民の祝日・休日のうち月〜金
  nenmatsuWeekdays: number; // 年末年始（独自定義）のうち、祝日でない月〜金
  obonWeekdays: number; // お盆（独自定義）のうち、祝日でない月〜金
  workdays: number; // 月〜金 − 祝日
  workdaysCustom: number; // workdays − 年末年始 − お盆
  holidayNames: string[];
};

function calendar(ym: string): CalendarMonth {
  const [y, m] = ym.split('-').map(Number) as [number, number];
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const c: CalendarMonth = {
    month: ym,
    days,
    weekdays: 0,
    holidaysOnWeekdays: 0,
    nenmatsuWeekdays: 0,
    obonWeekdays: 0,
    workdays: 0,
    workdaysCustom: 0,
    holidayNames: [],
  };
  for (let d = 1; d <= days; d++) {
    const key = `${ym}-${String(d).padStart(2, '0')}`;
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const name = holidays.get(key);
    if (name) c.holidayNames.push(`${d}日 ${name}`);
    if (dow === 0 || dow === 6) continue;
    c.weekdays++;
    if (name) {
      c.holidaysOnWeekdays++;
      continue;
    }
    if (isNenmatsu(m, d)) c.nenmatsuWeekdays++;
    else if (isObon(m, d)) c.obonWeekdays++;
  }
  c.workdays = c.weekdays - c.holidaysOnWeekdays;
  c.workdaysCustom = c.workdays - c.nenmatsuWeekdays - c.obonWeekdays;
  return c;
}

const cal = months.map(calendar);
const calMap = new Map(cal.map((c) => [c.month, c]));
// 月の長さの違いを除くため、営業日の割合で見る
const workdayRatio: Series = new Map(cal.map((c) => [c.month, c.workdays / c.days]));
const workdayRatioCustom: Series = new Map(cal.map((c) => [c.month, c.workdaysCustom / c.days]));

const jpMonthly = months.map((ym) => {
  const c = calMap.get(ym)!;
  const yoy = jp.get(shiftMonth(ym, -12));
  return {
    month: ym,
    jpWorkShare: round(jp.get(ym)! * 100, 1),
    globalWorkShare: globalWork.has(ym) ? round(globalWork.get(ym)! * 100, 1) : null,
    workdays: c.workdays,
    workdaysCustom: c.workdaysCustom,
    days: c.days,
    holidaysOnWeekdays: c.holidaysOnWeekdays,
    nenmatsuWeekdays: c.nenmatsuWeekdays,
    obonWeekdays: c.obonWeekdays,
    dipPt: pt(dip(jp, ym)),
    dip2Pt: pt(dip(jp, ym, 2)),
    globalDipPt: pt(dip(globalWork, ym)),
    yoyPt: yoy === undefined ? null : pt(jp.get(ym)! - yoy),
    holidayNames: c.holidayNames,
  };
});

// ---- 2. 営業日の割合と仕事関連比率（どちらも前後月との差）の相関 ---------------

function calendarCorrelation(s: Series, ratio: Series) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const ym of months) {
    const a = dip(ratio, ym);
    const b = dip(s, ym);
    if (a === null || b === null) continue;
    xs.push(a);
    ys.push(b);
  }
  return { n: xs.length, r: xs.length >= 10 ? pearson(xs, ys) : null };
}

const corrJp = {
  workdays: calendarCorrelation(jp, workdayRatio),
  workdaysCustom: calendarCorrelation(jp, workdayRatioCustom),
};

// プラセボ: 日本の暦を他国の系列に当てたときの相関。日本の暦が日本の系列とだけ強く結びつくかを見る
const placebo = [...workByCountry.entries()]
  .map(([country, s]) => ({ country, ...calendarCorrelation(s, workdayRatioCustom) }))
  .filter((x) => x.n === corrJp.workdaysCustom.n && x.r !== null)
  .sort((a, b) => b.r! - a.r!);
const placeboRankJp = placebo.findIndex((x) => x.country === 'JP') + 1;

// ---- 3. 休暇月の落ち込みの国際比較 ---------------------------------------------

const TARGET_MONTHS = [
  '2024-08', '2025-08', '2026-08', // 夏（お盆・北半球の夏休み）
  '2025-05', '2026-05', // GW
  '2024-12', '2025-12', // 年末
  '2025-01', '2026-01', // 年始
];

const crossCountry = TARGET_MONTHS.map((ym) => {
  const rows = [...workByCountry.entries()]
    .map(([country, s]) => ({ country, dip: dip(s, ym) }))
    .filter((x): x is { country: string; dip: number } => x.dip !== null)
    .sort((a, b) => a.dip - b.dip); // 落ち込みが大きい順
  const jpIdx = rows.findIndex((x) => x.country === 'JP');
  const groups = Object.fromEntries(
    Object.entries(GROUPS).map(([g, cs]) => {
      const vals = cs.map((c) => rows.find((x) => x.country === c)?.dip).filter((v): v is number => v !== undefined);
      return [g, { n: vals.length, medianPt: vals.length ? pt(median(vals)) : null }];
    }),
  );
  return {
    month: ym,
    countries: rows.length,
    jpDipPt: jpIdx >= 0 ? pt(rows[jpIdx]!.dip) : null,
    jpRank: jpIdx >= 0 ? jpIdx + 1 : null, // 1 = 落ち込みが最も大きい
    medianPt: pt(median(rows.map((x) => x.dip))),
    globalDipPt: pt(dip(globalWork, ym)),
    groups,
    all: rows.map((x) => ({ country: x.country, dipPt: pt(x.dip) })),
    selected: Object.fromEntries(
      Object.values(GROUPS)
        .flat()
        .map((c) => [c, pt(rows.find((x) => x.country === c)?.dip ?? null)]),
    ),
  };
});

// 各国で、2つの8月の落ち込みが同じ向きか（小国の DP ノイズ・標本誤差の目安）
const augustConsistency = (() => {
  let both = 0;
  let same = 0;
  for (const s of workByCountry.values()) {
    const a = dip(s, '2025-08');
    const b = dip(s, '2026-08');
    if (a === null || b === null) continue;
    both++;
    if (Math.sign(a) === Math.sign(b)) same++;
  }
  return { countries: both, sameSign: same };
})();

// ---- 4. 中身の分解（日本）: 非仕事トピック・年齢層 ------------------------------

const nonWorkTopic = loadByCountry(
  'share_of_messages_by_topic_work_related_country_month.csv',
  (r) => r.country === 'JP' && r.work_related === '0',
  (r) => r.topic!,
);
const workTopic = loadByCountry(
  'share_of_messages_by_topic_work_related_country_month.csv',
  (r) => r.country === 'JP' && r.work_related === '1',
  (r) => r.topic!,
);
const ageJp = loadByCountry(
  'share_of_messages_by_age_group_country_month.csv',
  (r) => r.country === 'JP',
  (r) => r.age_group!,
);

function decomposition(byCat: Map<string, Series>) {
  return Object.fromEntries(
    [...byCat.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cat, s]) => [cat, Object.fromEntries(TARGET_MONTHS.map((ym) => [ym, pt(dip(s, ym))]))]),
  );
}

const ageLevels = Object.fromEntries(
  [...ageJp.entries()].map(([age, s]) => [age, Object.fromEntries(months.map((ym) => [ym, round((s.get(ym) ?? NaN) * 100, 1)]))]),
);

// ---- 5. 18-24歳の構成比と学期暦 -------------------------------------------------
// 日本の大学の長期休暇に近い2か月（2〜3月、8〜9月）の平均と、その前後1か月の平均の差。
// 同じ窓を各国にも当て、日本の暦の窓で日本だけが下がるのかを見る。年齢は利用者の申告年齢で、18-24 は学生と同じではない。

const age1824 = loadByCountry(
  'share_of_messages_by_age_group_country_month.csv',
  (r) => r.age_group === '18-24',
  (r) => r.country!,
);

const ACADEMIC_WINDOWS = [
  { label: '2024年夏（8〜9月）', inside: ['2024-08', '2024-09'], outside: ['2024-07', '2024-10'] },
  { label: '2025年春（2〜3月）', inside: ['2025-02', '2025-03'], outside: ['2025-01', '2025-04'] },
  { label: '2025年夏（8〜9月）', inside: ['2025-08', '2025-09'], outside: ['2025-07', '2025-10'] },
  { label: '2026年春（2〜3月）', inside: ['2026-02', '2026-03'], outside: ['2026-01', '2026-04'] },
];

function windowEffect(s: Series, inside: string[], outside: string[]): number | null {
  const a = inside.map((m) => s.get(m));
  const b = outside.map((m) => s.get(m));
  if ([...a, ...b].some((v) => v === undefined)) return null;
  return mean(a as number[]) - mean(b as number[]);
}

const academicCalendar = ACADEMIC_WINDOWS.map((w) => {
  const rows = [...age1824.entries()]
    .map(([country, s]) => ({ country, effect: windowEffect(s, w.inside, w.outside) }))
    .filter((x): x is { country: string; effect: number } => x.effect !== null)
    .sort((a, b) => a.effect - b.effect);
  const jpIdx = rows.findIndex((x) => x.country === 'JP');
  return {
    window: w.label,
    inside: w.inside,
    outside: w.outside,
    countries: rows.length,
    jpEffectPt: jpIdx >= 0 ? pt(rows[jpIdx]!.effect) : null,
    jpRank: jpIdx >= 0 ? jpIdx + 1 : null, // 1 = 最も大きく下がった
    medianPt: pt(median(rows.map((x) => x.effect))),
    lowest: rows.slice(0, 5).map((x) => ({ country: x.country, effectPt: pt(x.effect) })),
    all: rows.map((x) => ({ country: x.country, effectPt: pt(x.effect) })),
    selected: Object.fromEntries(
      Object.values(GROUPS)
        .flat()
        .map((c) => [c, pt(rows.find((x) => x.country === c)?.effect ?? null)]),
    ),
  };
});

// 年齢層の構成比は合計が1なので、18-24歳が下がれば他の年齢層は必ず上がる。
// 他の年齢層が一様に上がるのか、特定の層だけが上がるのかを、差（pt）と相対変化（%）で見る。
const ageGroupWindows = Object.fromEntries(
  [...ageJp.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([age, s]) => [
      age,
      ACADEMIC_WINDOWS.map((w) => {
        const e = windowEffect(s, w.inside, w.outside);
        const base = mean(w.outside.map((m) => s.get(m) ?? NaN));
        return { window: w.label, effectPt: pt(e), relativePct: e === null ? null : round((e / base) * 100, 1) };
      }),
    ]),
);

// 年齢構成そのもの: 4期間を通した「前後の月」と「休みの時期」の平均（%）
const ageComposition = [...ageJp.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([age, s]) => {
    const outside = ACADEMIC_WINDOWS.flatMap((w) => w.outside.map((m) => s.get(m)));
    const inside = ACADEMIC_WINDOWS.flatMap((w) => w.inside.map((m) => s.get(m)));
    const ok = (xs: (number | undefined)[]): xs is number[] => xs.every((v) => v !== undefined);
    return {
      age,
      outsidePct: ok(outside) ? round(mean(outside) * 100, 1) : null,
      insidePct: ok(inside) ? round(mean(inside) * 100, 1) : null,
    };
  });

// トピックごとの 18-24歳の比率（分母は日本・各月の、そのトピックのメッセージ）。
// 学習に使われやすい用途ほど休みの時期に下がるなら、学生の休みと整合する。
const age1824ByTopicSeries = loadByCountry(
  'share_of_messages_by_age_group_topic_country_month.csv',
  (r) => r.country === 'JP' && r.age_group === '18-24',
  (r) => r.topic!,
);
const age1824ByTopic = Object.fromEntries(
  [...age1824ByTopicSeries.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([topic, s]) => {
      const effects = ACADEMIC_WINDOWS.map((w) => windowEffect(s, w.inside, w.outside));
      const valid = effects.filter((e): e is number => e !== null);
      return [
        topic,
        {
          windows: ACADEMIC_WINDOWS.map((w, i) => ({ window: w.label, effectPt: pt(effects[i] ?? null) })),
          meanEffectPt: valid.length === effects.length ? pt(mean(valid)) : null,
        },
      ];
    }),
);

// トピック別の年齢構成（分母は日本・各月の、そのトピックのメッセージ）。前後の月・休みの時期の平均と期間ごとの差
const ageByTopicSeries = new Map<string, Map<string, Series>>(); // topic -> age -> series
{
  const { header, rows } = readCsvTable(join(RAW_CSV_DIR, 'share_of_messages_by_age_group_topic_country_month.csv'));
  for (const row of rows) {
    const r = Object.fromEntries(header.map((h, i) => [h, row[i] ?? '']));
    if (r.country !== 'JP') continue;
    const byAge = ageByTopicSeries.get(r.topic!) ?? new Map<string, Series>();
    ageByTopicSeries.set(r.topic!, byAge);
    const s = byAge.get(r.age_group!) ?? new Map();
    byAge.set(r.age_group!, s);
    s.set(r.month!.slice(0, 7), Number(r.share_of_messages));
  }
}
const ageCompositionByTopic = Object.fromEntries(
  [...ageByTopicSeries.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([topic, byAge]) => [
      topic,
      [...byAge.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([age, s]) => {
          const outside = ACADEMIC_WINDOWS.flatMap((w) => w.outside.map((m) => s.get(m)));
          const inside = ACADEMIC_WINDOWS.flatMap((w) => w.inside.map((m) => s.get(m)));
          const ok = (xs: (number | undefined)[]): xs is number[] => xs.every((v) => v !== undefined);
          return {
            age,
            outsidePct: ok(outside) ? round(mean(outside) * 100, 1) : null,
            insidePct: ok(inside) ? round(mean(inside) * 100, 1) : null,
            windows: ACADEMIC_WINDOWS.map((w) => ({ window: w.label, effectPt: pt(windowEffect(s, w.inside, w.outside)) })),
          };
        }),
    ]),
);

const age1824Levels = Object.fromEntries(
  ['JP', 'KR', 'TW', 'US', 'GB', 'DE', 'FR', 'AU', 'BR'].map((c) => [
    c,
    Object.fromEntries(months.map((ym) => [ym, age1824.get(c)?.has(ym) ? round(age1824.get(c)!.get(ym)! * 100, 1) : null])),
  ]),
);

// ---- 出力 -----------------------------------------------------------------

const result = {
  analysis: 'holiday-calendar',
  generatedBy: 'scripts/analysis/holiday-calendar.ts',
  sources: {
    signals: { release: source.release, retrievedAt: source.retrievedAt, sha256: source.csvZip.sha256, license: source.license.name },
    holidays: {
      title: '内閣府「国民の祝日」について 祝日 CSV',
      url: 'https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv',
      retrievedAt: '2026-11-14',
      sha256: HOLIDAY_SHA256,
      license: '公共データ利用規約（第1.0版）（PDL1.0、CC BY 4.0 互換）',
      licenseUrl: 'https://www.digital.go.jp/resources/open_data/public_data_license_v1.0',
    },
  },
  notes: [
    'share_of_messages はメッセージ構成比。件数・利用者数・利用率ではない。',
    'dipPt は「対象月 − 前後1か月平均」、dip2Pt は「対象月 − 前後2か月平均」。単位はポイント。',
    'Signals の月は UTC 基準、日本の暦は JST。月境界のずれは各月の最初の9時間分。',
    '年末年始（12/29〜1/3）とお盆（8/13〜16）は本分析の定義。お盆は国民の祝日ではない。',
    '国のグループは本分析の独自分類。',
  ],
  jpMonthly,
  calendarCorrelation: {
    description: '営業日の割合（営業日数/暦日数）の前後月差と、仕事関連比率の前後月差の相関（ピアソン）',
    jp: { workdays: { n: corrJp.workdays.n, r: round(corrJp.workdays.r, 3) }, workdaysCustom: { n: corrJp.workdaysCustom.n, r: round(corrJp.workdaysCustom.r, 3) } },
    placebo: {
      description: '日本の暦（workdaysCustom）を各国の系列に当てた相関。全27か月がそろう国のみ。',
      countries: placebo.length,
      jpRank: placeboRankJp,
      top: placebo.slice(0, 10).map((x) => ({ country: x.country, r: round(x.r, 3) })),
      selected: Object.fromEntries(
        Object.values(GROUPS)
          .flat()
          .map((c) => [c, round(placebo.find((x) => x.country === c)?.r ?? null, 3)]),
      ),
    },
  },
  crossCountry,
  augustConsistency,
  jpDecomposition: {
    description: '日本の構成の前後月差（ポイント）。非仕事トピックの分母は日本・各月の非仕事メッセージ、仕事トピックは仕事関連メッセージ、年齢層は全メッセージ。',
    nonWorkTopic: decomposition(nonWorkTopic),
    workTopic: decomposition(workTopic),
    ageGroup: decomposition(ageJp),
    ageGroupLevels: ageLevels,
  },
  academicCalendar: {
    description: '18-24歳のメッセージ構成比（分母は各国・各月の全メッセージ）について、日本の大学の長期休暇に近い2か月の平均 − 前後1か月の平均（ポイント）。',
    windows: academicCalendar,
    age1824Levels,
    ageGroupWindows: {
      description: '日本の各年齢層の構成比（分母は全メッセージ）について、同じ期間の「休みの2か月の平均 − 前後1か月の平均」。relativePct は前後1か月の平均に対する変化率。',
      byAge: ageGroupWindows,
    },
    ageComposition: {
      description: '日本の年齢構成（分母は全メッセージ）。4期間の「前後1か月」8か月分の平均と、「休みの2か月」8か月分の平均（%）。',
      rows: ageComposition,
    },
    ageCompositionByTopic: {
      description: 'トピック別の年齢構成（分母は日本・各月の、そのトピックのメッセージ）。前後の月・休みの時期の平均（%）と期間ごとの差（ポイント）。',
      byTopic: ageCompositionByTopic,
    },
    age1824ByTopic: {
      description: '日本の各トピックのメッセージに占める 18-24歳の比率（分母は日本・各月の、そのトピックのメッセージ）の、同じ期間での変化（ポイント）。',
      byTopic: age1824ByTopic,
    },
  },
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_JSON, `${JSON.stringify(result, null, 2)}\n`);
console.log(`書き出し: ${OUT_JSON}`);
