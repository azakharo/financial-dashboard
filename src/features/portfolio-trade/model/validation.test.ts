import {describe, expect, it} from 'vitest';

import type {Stock} from '@/shared/api';

import {
  validateQuantity,
  validateBuy,
  validateSell,
  calculateTotalCost,
} from '@/features/portfolio-trade/model/validation';

const mockStock: Stock = {
  ticker: 'AAPL',
  name: 'Apple Inc.',
  sector: 'Technology',
  currentPrice: 150.0,
  priceChange24h: 2.5,
  quantityInPortfolio: 100,
};

describe('validateQuantity', () => {
  it('returns valid for positive integer', () => {
    const result = validateQuantity(10);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns invalid for zero', () => {
    const result = validateQuantity(0);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Количество должно быть больше нуля');
  });

  it('returns invalid for negative number', () => {
    const result = validateQuantity(-5);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Количество должно быть больше нуля');
  });

  it('returns invalid for non-integer', () => {
    const result = validateQuantity(5.5);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Количество должно быть целым числом');
  });

  it('returns invalid for NaN', () => {
    const result = validateQuantity(NaN);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Введите корректное число');
  });

  it('returns invalid for Infinity', () => {
    const result = validateQuantity(Infinity);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Введите корректное число');
  });
});

describe('validateBuy', () => {
  it('returns valid when enough balance', () => {
    const result = validateBuy(10, 2000, mockStock);
    expect(result.isValid).toBe(true);
  });

  it('returns invalid when insufficient balance', () => {
    const result = validateBuy(10, 100, mockStock);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Недостаточно средств');
  });

  it('returns invalid for undefined stock', () => {
    const result = validateBuy(10, 10000, undefined);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Акция не найдена');
  });

  it('returns invalid for invalid quantity', () => {
    const result = validateBuy(0, 10000, mockStock);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Количество должно быть больше нуля');
  });

  it('calculates total cost correctly in error message', () => {
    const quantity = 100;
    const balance = 1000;
    const result = validateBuy(quantity, balance, mockStock);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('15');
    expect(result.error).toContain('000');
    expect(result.error).toContain('1');
  });

  it('returns valid when balance exactly equals cost', () => {
    const result = validateBuy(10, 1500, mockStock);
    expect(result.isValid).toBe(true);
  });
});

describe('validateSell', () => {
  it('returns valid when enough stocks', () => {
    const result = validateSell(50, mockStock);
    expect(result.isValid).toBe(true);
  });

  it('returns valid when selling all stocks', () => {
    const result = validateSell(100, mockStock);
    expect(result.isValid).toBe(true);
  });

  it('returns invalid when not enough stocks', () => {
    const result = validateSell(200, mockStock);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Недостаточно акций');
    expect(result.error).toContain('100');
  });

  it('returns invalid for undefined stock', () => {
    const result = validateSell(10, undefined);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Акция не найдена');
  });

  it('returns invalid for invalid quantity', () => {
    const result = validateSell(-5, mockStock);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Количество должно быть больше нуля');
  });

  it('returns invalid for stock with zero quantity', () => {
    const stockNoShares = {...mockStock, quantityInPortfolio: 0};
    const result = validateSell(1, stockNoShares);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Недостаточно акций');
  });
});

describe('calculateTotalCost', () => {
  it('calculates cost correctly', () => {
    expect(calculateTotalCost(10, 150)).toBe(1500);
  });

  it('handles zero quantity', () => {
    expect(calculateTotalCost(0, 150)).toBe(0);
  });

  it('handles zero price', () => {
    expect(calculateTotalCost(10, 0)).toBe(0);
  });

  it('handles large numbers', () => {
    expect(calculateTotalCost(10000, 100)).toBe(1000000);
  });
});
