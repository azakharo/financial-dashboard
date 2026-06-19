import {describe, expect, it} from 'vitest';

import type {Stock} from '@/shared/api';

import {
  selectStockByTicker,
  selectTotalPortfolioValue,
  selectStocksBySector,
  selectStocksSortedByTicker,
  selectStocksSortedByPrice,
} from '@/entities/stock/model';

const mockStocks: Stock[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    currentPrice: 150.0,
    priceChange24h: 2.5,
    quantityInPortfolio: 100,
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Technology',
    currentPrice: 2800.0,
    priceChange24h: -1.2,
    quantityInPortfolio: 50,
  },
  {
    ticker: 'JPM',
    name: 'JPMorgan Chase',
    sector: 'Finance',
    currentPrice: 160.0,
    priceChange24h: 0.8,
    quantityInPortfolio: 0,
  },
];

describe('selectStockByTicker', () => {
  it('returns stock when found', () => {
    const result = selectStockByTicker(mockStocks, 'AAPL');
    expect(result).toBeDefined();
    expect(result?.ticker).toBe('AAPL');
  });

  it('returns undefined when not found', () => {
    const result = selectStockByTicker(mockStocks, 'UNKNOWN');
    expect(result).toBeUndefined();
  });

  it('returns undefined for undefined stocks', () => {
    const result = selectStockByTicker(undefined, 'AAPL');
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty array', () => {
    const result = selectStockByTicker([], 'AAPL');
    expect(result).toBeUndefined();
  });
});

describe('selectTotalPortfolioValue', () => {
  it('calculates total value correctly', () => {
    const result = selectTotalPortfolioValue(mockStocks);
    expect(result).toBe(100 * 150 + 50 * 2800 + 0 * 160);
    expect(result).toBe(155000);
  });

  it('returns 0 for undefined stocks', () => {
    const result = selectTotalPortfolioValue(undefined);
    expect(result).toBe(0);
  });

  it('returns 0 for empty array', () => {
    const result = selectTotalPortfolioValue([]);
    expect(result).toBe(0);
  });

  it('returns 0 when all quantities are zero', () => {
    const stocksNoQuantity = mockStocks.map(s => ({
      ...s,
      quantityInPortfolio: 0,
    }));
    const result = selectTotalPortfolioValue(stocksNoQuantity);
    expect(result).toBe(0);
  });
});

describe('selectStocksBySector', () => {
  it('filters by sector correctly', () => {
    const result = selectStocksBySector(mockStocks, 'Technology');
    expect(result).toHaveLength(2);
    expect(result.every(s => s.sector === 'Technology')).toBe(true);
  });

  it('returns empty array when no stocks match', () => {
    const result = selectStocksBySector(mockStocks, 'Energy');
    expect(result).toHaveLength(0);
  });

  it('returns empty array for undefined stocks', () => {
    const result = selectStocksBySector(undefined, 'Technology');
    expect(result).toEqual([]);
  });

  it('returns empty array for empty array', () => {
    const result = selectStocksBySector([], 'Technology');
    expect(result).toEqual([]);
  });
});

describe('selectStocksSortedByTicker', () => {
  it('sorts stocks by ticker alphabetically', () => {
    const result = selectStocksSortedByTicker(mockStocks);
    expect(result.map(s => s.ticker)).toEqual(['AAPL', 'GOOGL', 'JPM']);
  });

  it('does not mutate original array', () => {
    const original = [...mockStocks];
    selectStocksSortedByTicker(mockStocks);
    expect(mockStocks).toEqual(original);
  });

  it('returns empty array for undefined stocks', () => {
    const result = selectStocksSortedByTicker(undefined);
    expect(result).toEqual([]);
  });

  it('handles single item', () => {
    const result = selectStocksSortedByTicker([mockStocks[0]]);
    expect(result).toHaveLength(1);
    expect(result[0].ticker).toBe('AAPL');
  });
});

describe('selectStocksSortedByPrice', () => {
  it('sorts by price ascending by default', () => {
    const result = selectStocksSortedByPrice(mockStocks);
    const prices = result.map(s => s.currentPrice);
    expect(prices).toEqual([150, 160, 2800]);
  });

  it('sorts by price descending when asc=false', () => {
    const result = selectStocksSortedByPrice(mockStocks, false);
    const prices = result.map(s => s.currentPrice);
    expect(prices).toEqual([2800, 160, 150]);
  });

  it('does not mutate original array', () => {
    const original = [...mockStocks];
    selectStocksSortedByPrice(mockStocks);
    expect(mockStocks).toEqual(original);
  });

  it('returns empty array for undefined stocks', () => {
    const result = selectStocksSortedByPrice(undefined);
    expect(result).toEqual([]);
  });

  it('handles stocks with same price', () => {
    const stocksWithSamePrice = [
      {...mockStocks[0], currentPrice: 100},
      {...mockStocks[1], currentPrice: 100},
    ];
    const result = selectStocksSortedByPrice(stocksWithSamePrice);
    expect(result).toHaveLength(2);
  });
});
