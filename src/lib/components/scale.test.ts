import { describe, expect, it } from 'vitest';
import { niceTicks } from './scale.ts';

describe('niceTicks', () => {
  it('最大値を含む 0 始まりの目盛りを返す', () => {
    expect(niceTicks(0.314)).toEqual([0, 0.1, 0.2, 0.3, 0.4]);
    expect(niceTicks(0.145)).toEqual([0, 0.05, 0.1, 0.15]);
  });

  it('値がないときは 0 だけ', () => {
    expect(niceTicks(0)).toEqual([0]);
  });
});
