import { describe, expect, it } from 'vitest';
import { formatMonth, formatQuarter, formatQuarterShort, pct, pt } from './format.ts';

describe('format', () => {
  it('構成比を % にし、値がなければ非公開と表示する', () => {
    expect(pct(0.285)).toBe('28.5%');
    expect(pct(0.14505, 3)).toBe('14.505%');
    expect(pct(null)).toBe('非公開');
  });

  it('差を符号付きの pt にする', () => {
    expect(pt(0.012)).toBe('+1.2pt');
    expect(pt(-0.0005, 2)).toBe('−0.05pt');
    expect(pt(0)).toBe('±0.0pt');
  });

  it('期間を日本語で表す', () => {
    expect(formatMonth('2026-09-01')).toBe('2026年9月');
    expect(formatQuarter('2026-07-01')).toBe('2026年第3四半期');
    expect(formatQuarterShort('2025-01-01')).toBe('2025 Q1');
  });
});
