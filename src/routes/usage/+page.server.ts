import { getDataInfo, getMonthly } from '$lib/server/data.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
  months: getDataInfo().months,
  jp: getMonthly('JP'),
  global: getMonthly('global'),
});
