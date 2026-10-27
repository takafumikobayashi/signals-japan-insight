import { getDataInfo, getIwa, getIwaLabels, getMonthly, getRank, iwaCountries, iwaIds, monthlyScopes } from '$lib/server/data.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  const info = getDataInfo();
  return {
    months: info.months,
    quarters: info.quarters,
    countries: monthlyScopes().filter((s) => s !== 'global' && s !== 'JP'),
    iwaAvailability: Object.fromEntries(iwaCountries().map((c) => [c.country, c.quarters])),
    ids: iwaIds(),
    labels: getIwaLabels(),
    jpMonthly: getMonthly('JP'),
    globalMonthly: getMonthly('global'),
    jpIwa: getIwa('JP'),
    jpRank: getRank('JP'),
  };
};
