import { error, json } from '@sveltejs/kit';
import { getIwa, iwaCountries } from '$lib/server/data.ts';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => iwaCountries().map(({ country }) => ({ country }));

export const GET: RequestHandler = ({ params }) => {
  if (!iwaCountries().some((c) => c.country === params.country)) error(404, 'IWA データのない国です');
  return json(getIwa(params.country));
};
