import {describe, expect, it} from 'vitest';

import type {Portfolio} from '@/shared/api';

import {
  selectAvailableBalance,
  selectTotalValue,
  selectDailyChangePercent,
  selectFormattedPortfolioValue,
  selectFormattedBalance,
} from '@/entities/portfolio/model';

const mockPortfolio: Portfolio = {
  totalValue: 155000.5,
  availableBalance: 50000.25,
  dailyChangePercent: 2.5,
};

describe('selectAvailableBalance', () => {
  it('returns available balance', () => {
    expect(selectAvailableBalance(mockPortfolio)).toBe(50000.25);
  });

  it('returns 0 for undefined portfolio', () => {
    expect(selectAvailableBalance(undefined)).toBe(0);
  });
});

describe('selectTotalValue', () => {
  it('returns total value', () => {
    expect(selectTotalValue(mockPortfolio)).toBe(155000.5);
  });

  it('returns 0 for undefined portfolio', () => {
    expect(selectTotalValue(undefined)).toBe(0);
  });
});

describe('selectDailyChangePercent', () => {
  it('returns daily change percent', () => {
    expect(selectDailyChangePercent(mockPortfolio)).toBe(2.5);
  });

  it('returns 0 for undefined portfolio', () => {
    expect(selectDailyChangePercent(undefined)).toBe(0);
  });
});

describe('selectFormattedPortfolioValue', () => {
  it('formats total value in Russian locale', () => {
    const result = selectFormattedPortfolioValue(mockPortfolio);
    expect(result).toContain('155');
    expect(result).toContain('000');
    expect(result).toContain('50');
  });

  it('returns formatted zero for undefined portfolio', () => {
    const result = selectFormattedPortfolioValue(undefined);
    expect(result).toContain('0');
  });
});

describe('selectFormattedBalance', () => {
  it('formats available balance in Russian locale', () => {
    const result = selectFormattedBalance(mockPortfolio);
    expect(result).toContain('50');
    expect(result).toContain('000');
  });

  it('returns formatted zero for undefined portfolio', () => {
    const result = selectFormattedBalance(undefined);
    expect(result).toContain('0');
  });
});
