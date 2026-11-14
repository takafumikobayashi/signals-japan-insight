/**
 * 独自分析の結果（data/analysis/）をビルド時に読み込む。
 * 値は scripts/analysis/ が公式 CSV と外部データから計算したもので、公式値そのものではない。
 */
import { readFileSync } from 'node:fs';

type CountryDip = { country: string; dipPt: number };
type CountryEffect = { country: string; effectPt: number };
type GroupMedian = { n: number; medianPt: number | null };

export type HolidayCalendarAnalysis = {
  sources: {
    signals: { release: string; retrievedAt: string; sha256: string; license: string };
    holidays: { title: string; url: string; retrievedAt: string; sha256: string; license: string; licenseUrl: string };
  };
  jpMonthly: {
    month: string;
    workdays: number;
    workdaysCustom: number;
    days: number;
    holidaysOnWeekdays: number;
    nenmatsuWeekdays: number;
    obonWeekdays: number;
    dipPt: number | null;
    holidayNames: string[];
  }[];
  calendarCorrelation: {
    jp: { workdays: { n: number; r: number }; workdaysCustom: { n: number; r: number } };
    placebo: { countries: number; jpRank: number; selected: Record<string, number | null> };
  };
  crossCountry: {
    month: string;
    countries: number;
    jpDipPt: number | null;
    jpRank: number | null;
    medianPt: number;
    groups: Record<string, GroupMedian>;
    all: CountryDip[];
  }[];
  augustConsistency: { countries: number; sameSign: number };
  academicCalendar: {
    windows: {
      window: string;
      inside: string[];
      outside: string[];
      countries: number;
      jpEffectPt: number | null;
      jpRank: number | null;
      medianPt: number;
      all: CountryEffect[];
    }[];
    age1824Levels: Record<string, Record<string, number | null>>;
    ageGroupWindows: {
      byAge: Record<string, { window: string; effectPt: number | null; relativePct: number | null }[]>;
    };
    ageComposition: { rows: { age: string; outsidePct: number | null; insidePct: number | null }[] };
    ageCompositionByTopic: {
      byTopic: Record<
        string,
        { age: string; outsidePct: number | null; insidePct: number | null; windows: { window: string; effectPt: number | null }[] }[]
      >;
    };
    age1824ByTopic: {
      byTopic: Record<string, { windows: { window: string; effectPt: number | null }[]; meanEffectPt: number | null }>;
    };
  };
};

let cache: HolidayCalendarAnalysis | undefined;

export function getHolidayCalendar(): HolidayCalendarAnalysis {
  cache ??= JSON.parse(readFileSync('data/analysis/holiday-calendar.json', 'utf8')) as HolidayCalendarAnalysis;
  return cache;
}
