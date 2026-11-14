/**
 * ドットヒストグラムの配置。横軸を点の直径ごとの区間に分け、同じ区間の点を下から上へ積む。
 * 返す px は区間の中心、level は下から数えた段（0 が軸のすぐ上）。縦の位置に値の意味はない。
 */
export function stackDots<T extends { px: number }>(
  points: T[],
  binWidth: number,
  origin: number,
): (T & { level: number; binPx: number })[] {
  const counts = new Map<number, number>();
  return [...points]
    .sort((a, b) => a.px - b.px)
    .map((p) => {
      const bin = Math.floor((p.px - origin) / binWidth);
      const level = counts.get(bin) ?? 0;
      counts.set(bin, level + 1);
      return { ...p, level, binPx: origin + (bin + 0.5) * binWidth };
    });
}

/** 差（ポイント）用の目盛り。値の範囲の内側にある 1・2・2.5・5 刻みの値（0 を含む）。 */
export function stripTicks(min: number, max: number, count = 5): number[] {
  const span = max - min;
  if (!(span > 0)) return [min - 1, min, min + 1];
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const lo = Math.ceil(min / step) * step;
  const hi = Math.floor(max / step) * step;
  const ticks: number[] = [];
  for (let t = lo; t <= hi + step * 0.001; t += step) ticks.push(Number(t.toPrecision(10)));
  return ticks;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? (s[(n - 1) / 2] ?? null) : ((s[n / 2 - 1] ?? 0) + (s[n / 2] ?? 0)) / 2;
}
