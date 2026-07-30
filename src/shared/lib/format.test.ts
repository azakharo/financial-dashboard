import {describe, expect, it} from 'vitest';

import {
  formatPrice,
  formatPercent,
  formatLargeNumber,
  formatQuantity,
} from '@/shared/lib/format';

const NBSP = '\u00A0';

describe('formatPrice', () => {
  it('formats positive price correctly', () => {
    expect(formatPrice(1234.56)).toBe(`1${NBSP}234,56${NBSP}$`);
  });

  it('formats zero price', () => {
    expect(formatPrice(0)).toBe(`0,00${NBSP}$`);
  });

  it('formats small price with 2 decimals', () => {
    expect(formatPrice(0.1)).toBe(`0,10${NBSP}$`);
  });

  it('formats large price correctly', () => {
    expect(formatPrice(1000000)).toBe(`1${NBSP}000${NBSP}000,00${NBSP}$`);
  });

  it('handles negative price', () => {
    expect(formatPrice(-50.25)).toBe(`-50,25${NBSP}$`);
  });
});

describe('formatPercent', () => {
  it('formats positive percent with plus sign', () => {
    expect(formatPercent(5.5)).toBe('+5.50%');
  });

  it('formats negative percent with minus sign', () => {
    expect(formatPercent(-3.25)).toBe('-3.25%');
  });

  it('formats zero percent', () => {
    expect(formatPercent(0)).toBe('+0.00%');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatPercent(12.345)).toBe('+12.35%');
  });
});

describe('formatLargeNumber', () => {
  it('formats billions correctly', () => {
    expect(formatLargeNumber(1_500_000_000)).toBe('1.50B');
  });

  it('formats millions correctly', () => {
    expect(formatLargeNumber(2_500_000)).toBe('2.50M');
  });

  it('formats thousands correctly', () => {
    expect(formatLargeNumber(3_500)).toBe('3.50K');
  });

  it('formats small numbers with 2 decimals', () => {
    expect(formatLargeNumber(123.456)).toBe('123.46');
  });

  it('handles zero', () => {
    expect(formatLargeNumber(0)).toBe('0.00');
  });

  it('handles edge case exactly at billion', () => {
    expect(formatLargeNumber(1_000_000_000)).toBe('1.00B');
  });

  it('handles edge case exactly at million', () => {
    expect(formatLargeNumber(1_000_000)).toBe('1.00M');
  });

  it('handles edge case exactly at thousand', () => {
    expect(formatLargeNumber(1_000)).toBe('1.00K');
  });
});

describe('formatQuantity', () => {
  it('formats quantity with thousand separator', () => {
    expect(formatQuantity(1000)).toBe(`1${NBSP}000`);
  });

  it('formats small quantity', () => {
    expect(formatQuantity(123)).toBe('123');
  });

  it('formats large quantity', () => {
    expect(formatQuantity(1000000)).toBe(`1${NBSP}000${NBSP}000`);
  });

  it('handles zero', () => {
    expect(formatQuantity(0)).toBe('0');
  });
});
