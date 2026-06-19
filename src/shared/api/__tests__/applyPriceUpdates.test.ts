import {describe, it, expect} from 'vitest';
import {applyPriceUpdates} from '../websocket';
import type {Stock, PaginatedResponse} from '../types';

function createStock(overrides: Partial<Stock> = {}): Stock {
  return {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    currentPrice: 150,
    priceChange24h: 2.5,
    quantityInPortfolio: 10,
    ...overrides,
  };
}

function createPage(stocks: Stock[] = []): PaginatedResponse<Stock> {
  return {
    stocks,
    nextCursor: null,
    hasMore: false,
  };
}

describe('applyPriceUpdates', () => {
  it('returns undefined when pages is undefined', () => {
    const result = applyPriceUpdates(undefined, new Map());
    expect(result).toBeUndefined();
  });

  it('returns same pages object when updates map is empty', () => {
    const pages = [createPage([createStock()])];
    const result = applyPriceUpdates(pages, new Map());
    expect(result).toBe(pages);
  });

  it('returns same pages object when ticker not found in pages', () => {
    const pages = [
      createPage([createStock({ticker: 'AAPL', currentPrice: 150})]),
    ];
    const updates = new Map([['GOOG', 100]]);
    const result = applyPriceUpdates(pages, updates);
    expect(result).toBe(pages);
  });

  it('returns same pages object when price is unchanged', () => {
    const pages = [
      createPage([createStock({ticker: 'AAPL', currentPrice: 150})]),
    ];
    const updates = new Map([['AAPL', 150]]);
    const result = applyPriceUpdates(pages, updates);
    expect(result).toBe(pages);
  });

  it('returns new pages with updated price when price changed', () => {
    const pages = [
      createPage([createStock({ticker: 'AAPL', currentPrice: 150})]),
    ];
    const updates = new Map([['AAPL', 155]]);
    const result = applyPriceUpdates(pages, updates);
    expect(result).not.toBe(pages);
    expect(result![0].stocks[0].currentPrice).toBe(155);
  });

  it('updates multiple stocks in same page', () => {
    const aapl = createStock({ticker: 'AAPL', currentPrice: 150});
    const goog = createStock({ticker: 'GOOG', currentPrice: 100});
    const pages = [createPage([aapl, goog])];
    const updates = new Map([
      ['AAPL', 155],
      ['GOOG', 105],
    ]);
    const result = applyPriceUpdates(pages, updates);
    expect(result).not.toBe(pages);
    expect(result![0].stocks[0].currentPrice).toBe(155);
    expect(result![0].stocks[1].currentPrice).toBe(105);
  });

  it('updates stocks across multiple pages', () => {
    const page1 = createPage([
      createStock({ticker: 'AAPL', currentPrice: 150}),
    ]);
    const page2 = createPage([
      createStock({ticker: 'GOOG', currentPrice: 100}),
    ]);
    const pages = [page1, page2];
    const updates = new Map([
      ['AAPL', 155],
      ['GOOG', 105],
    ]);
    const result = applyPriceUpdates(pages, updates);
    expect(result).not.toBe(pages);
    expect(result![0].stocks[0].currentPrice).toBe(155);
    expect(result![1].stocks[0].currentPrice).toBe(105);
  });

  it('preserves reference equality for unchanged stocks in same page', () => {
    const aapl = createStock({ticker: 'AAPL', currentPrice: 150});
    const goog = createStock({ticker: 'GOOG', currentPrice: 100});
    const pages = [createPage([aapl, goog])];
    const updates = new Map([['AAPL', 155]]);
    const result = applyPriceUpdates(pages, updates);
    expect(result![0].stocks[0]).not.toBe(aapl);
    expect(result![0].stocks[1]).toBe(goog);
  });

  it('preserves reference equality for unchanged pages', () => {
    const page1 = createPage([
      createStock({ticker: 'AAPL', currentPrice: 150}),
    ]);
    const page2 = createPage([
      createStock({ticker: 'GOOG', currentPrice: 100}),
    ]);
    const pages = [page1, page2];
    const updates = new Map([['AAPL', 155]]);
    const result = applyPriceUpdates(pages, updates);
    expect(result![0]).not.toBe(page1);
    expect(result![1]).toBe(page2);
  });
});
