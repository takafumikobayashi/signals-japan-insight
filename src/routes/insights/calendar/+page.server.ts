import { getHolidayCalendar } from '$lib/server/analysis.ts';
import { getDataInfo, getMonthly } from '$lib/server/data.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  const a = getHolidayCalendar();
  return {
    months: getDataInfo().months,
    jp: getMonthly('JP').workShare,
    global: getMonthly('global').workShare,
    sources: a.sources,
    calendar: a.jpMonthly.map(({ month, workdays, workdaysCustom, holidaysOnWeekdays, nenmatsuWeekdays, obonWeekdays, dipPt }) => ({
      month,
      workdays,
      workdaysCustom,
      holidaysOnWeekdays,
      nenmatsuWeekdays,
      obonWeekdays,
      dipPt,
    })),
    correlation: a.calendarCorrelation,
    crossCountry: a.crossCountry,
    augustConsistency: a.augustConsistency,
    academic: a.academicCalendar,
  };
};
