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
});
