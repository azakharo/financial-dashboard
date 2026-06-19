import {describe, expect, it} from 'vitest';

import type {PricePoint} from '@/shared/api';

import {
  selectPricePointsByTimeframe,
  selectLatestPrice,
  selectMinPrice,
  selectMaxPrice,
  selectPriceRange,
  selectChartData,
} from '@/entities/price-history/model';

const mockPricePoints: PricePoint[] = [
  {timestamp: new Date('2024-01-01T10:00:00'), price: 100},
  {timestamp: new Date('2024-01-01T11:00:00'), price: 150},
  {timestamp: new Date('2024-01-01T12:00:00'), price: 120},
];

describe('selectPricePointsByTimeframe', () => {
  it('returns price points unchanged', () => {
    expect(selectPricePointsByTimeframe(mockPricePoints)).toEqual(
      mockPricePoints,
    );
  });

  it('returns empty array for undefined', () => {
    expect(selectPricePointsByTimeframe(undefined)).toEqual([]);
  });
});

describe('selectLatestPrice', () => {
  it('returns last price', () => {
    expect(selectLatestPrice(mockPricePoints)).toBe(120);
  });

  it('returns undefined for undefined points', () => {
    expect(selectLatestPrice(undefined)).toBeUndefined();
  });

  it('returns undefined for empty array', () => {
    expect(selectLatestPrice([])).toBeUndefined();
  });
});

describe('selectMinPrice', () => {
  it('returns minimum price', () => {
    expect(selectMinPrice(mockPricePoints)).toBe(100);
  });

  it('returns 0 for undefined points', () => {
    expect(selectMinPrice(undefined)).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(selectMinPrice([])).toBe(0);
  });
});

describe('selectMaxPrice', () => {
  it('returns maximum price', () => {
    expect(selectMaxPrice(mockPricePoints)).toBe(150);
  });

  it('returns 0 for undefined points', () => {
    expect(selectMaxPrice(undefined)).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(selectMaxPrice([])).toBe(0);
  });
});

describe('selectPriceRange', () => {
  it('returns price range with padding', () => {
    const [min, max] = selectPriceRange(mockPricePoints);
    expect(min).toBeLessThan(100);
    expect(max).toBeGreaterThan(150);
  });

  it('returns [0, 0] for undefined points', () => {
    expect(selectPriceRange(undefined)).toEqual([0, 0]);
  });

  it('returns [0, 0] for empty array', () => {
    expect(selectPriceRange([])).toEqual([0, 0]);
  });

  it('calculates padding as 10% of range', () => {
    const points: PricePoint[] = [
      {timestamp: new Date(), price: 100},
      {timestamp: new Date(), price: 200},
    ];
    const [min, max] = selectPriceRange(points);
    const padding = (200 - 100) * 0.1;
    expect(min).toBe(100 - padding);
    expect(max).toBe(200 + padding);
  });

  it('ensures minimum is not negative', () => {
    const points: PricePoint[] = [
      {timestamp: new Date(), price: 5},
      {timestamp: new Date(), price: 10},
    ];
    const [min] = selectPriceRange(points);
    expect(min).toBeGreaterThanOrEqual(0);
  });
});

describe('selectChartData', () => {
  it('transforms points to chart data format', () => {
    const result = selectChartData(mockPricePoints);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      timestamp: mockPricePoints[0].timestamp,
      price: 100,
    });
  });

  it('returns empty array for undefined points', () => {
    expect(selectChartData(undefined)).toEqual([]);
  });

  it('returns empty array for empty array', () => {
    expect(selectChartData([])).toEqual([]);
  });
});
