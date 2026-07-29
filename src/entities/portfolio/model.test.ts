import {describe, expect, it} from 'vitest';

import type {Portfolio} from '@/shared/api';

import {
  selectAvailableBalance,
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
