import { error, json } from '@sveltejs/kit';
import { getMonthly, monthlyScopes } from '$lib/server/data.ts';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => monthlyScopes().map((scope) => ({ scope }));

export const GET: RequestHandler = ({ params }) => {
  if (!monthlyScopes().includes(params.scope)) error(404, '月次データのない地域です');
  return json(getMonthly(params.scope));
};
