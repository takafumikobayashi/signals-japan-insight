import { getDataInfo, getIwa, getIwaLabels, iwaIds } from '$lib/server/data.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
  ids: iwaIds(),
  labels: getIwaLabels(),
  jp: getIwa('JP'),
  quarters: getDataInfo().quarters,
});
