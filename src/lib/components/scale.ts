/** 0 から始まる見やすい目盛り。構成比（0〜1）を想定。 */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0];
  const rawStep = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? rawStep;
  const ticks: number[] = [];
  for (let t = 0; t <= max + step * 0.999; t += step) ticks.push(Number(t.toPrecision(10)));
  return ticks;
}
