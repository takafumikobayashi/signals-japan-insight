import { getHolidayCalendar } from '$lib/server/analysis.ts';
import { getDataInfo, getIwa, getIwaLabels, getMonthly, getRank, iwaIds } from '$lib/server/data.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
  months: getDataInfo().months,
  quarters: getDataInfo().quarters,
  jp: getMonthly('JP'),
  global: getMonthly('global'),
  ids: iwaIds(),
  labels: getIwaLabels(),
  jpIwa: getIwa('JP'),
  jpRank: getRank('JP'),
  // 独自分析カードの小さな折れ線: 日本の 18-24歳の構成比と、大学の休みに近い時期（2〜3月・8〜9月）
  calendarSpark: (() => {
    const levels = getHolidayCalendar().academicCalendar.age1824Levels.JP ?? {};
    const months = Object.keys(levels).sort();
    const isBreak = (m: string) => ['02', '03', '08', '09'].includes(m.slice(5, 7));
    const bands: { from: number; to: number }[] = [];
    months.forEach((m, i) => {
      if (!isBreak(m)) return;
      const last = bands.at(-1);
      if (last && last.to === i - 1) last.to = i;
      else bands.push({ from: i, to: i });
    });
    return { values: months.map((m) => levels[m] ?? null), bands };
  })(),
});
