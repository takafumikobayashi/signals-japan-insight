import { getDataInfo } from '$lib/server/data.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => ({ dataInfo: getDataInfo() });
