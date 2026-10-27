import { describe, expect, it } from 'vitest';
import { isolatedIndices, niceTicks } from './scale.ts';

describe('niceTicks', () => {
  it('最大値を含む 0 始まりの目盛りを返す', () => {
    expect(niceTicks(0.314)).toEqual([0, 0.1, 0.2, 0.3, 0.4]);
    expect(niceTicks(0.145)).toEqual([0, 0.05, 0.1, 0.15]);
  });

  it('値がないときは 0 だけ', () => {
    expect(niceTicks(0)).toEqual([0]);
  });
});

describe('isolatedIndices', () => {
  it('前後が欠けている値だけを返す', () => {
    // 公開月が 2 か月だけの国（例: BS）のような系列
    expect(isolatedIndices([null, 0.512, null, null, 0.375])).toEqual([1, 4]);
    expect(isolatedIndices([0.1, 0.2, null, 0.3])).toEqual([3]);
    expect(isolatedIndices([0.1, 0.2, 0.3])).toEqual([]);
  });
});
