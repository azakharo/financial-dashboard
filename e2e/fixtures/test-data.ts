import type {Stock, Portfolio} from '@/shared/api';

export type {Stock, Portfolio};

export const INITIAL_BALANCE = 10000;

export const mockStocks: Stock[] = [
  {
    ticker: 'AAAA',
    name: 'AAAA Corp',
    sector: 'Technology',
    currentPrice: 100.00,
    priceChange24h: 2.5,
    quantityInPortfolio: 0,
  },
  {
    ticker: 'AAAB',
    name: 'AAAB Inc',
    sector: 'Healthcare',
    currentPrice: 150.50,
    priceChange24h: -1.2,
    quantityInPortfolio: 0,
  },
  {
    ticker: 'AAAC',
    name: 'AAAC Ltd',
    sector: 'Finance',
    currentPrice: 75.25,
    priceChange24h: 0.8,
    quantityInPortfolio: 0,
  },
  {
    ticker: 'AAAD',
    name: 'AAAD Group',
    sector: 'Consumer',
    currentPrice: 200.00,
    priceChange24h: 3.1,
    quantityInPortfolio: 0,
  },
  {
    ticker: 'AAAE',
    name: 'AAAE Holdings',
    sector: 'Energy',
    currentPrice: 50.00,
    priceChange24h: -0.5,
    quantityInPortfolio: 0,
  },
];

export const mockPortfolio: Portfolio = {
  totalValue: INITIAL_BALANCE,
  availableBalance: INITIAL_BALANCE,
  dailyChangePercent: 0,
};

export function getStockByTicker(ticker: string): Stock | undefined {
  return mockStocks.find(s => s.ticker === ticker);
}

export function getLastStock(): Stock {
  return mockStocks[mockStocks.length - 1];
}

export function calculateBuyResult(ticker: string, quantity: number): {
  success: boolean;
  newBalance: number;
  newQuantity: number;
} {
  const stock = getStockByTicker(ticker);
  if (!stock) {
    return {success: false, newBalance: INITIAL_BALANCE, newQuantity: 0};
  }

  const totalCost = stock.currentPrice * quantity;
  if (totalCost > INITIAL_BALANCE) {
    return {success: false, newBalance: INITIAL_BALANCE, newQuantity: 0};
  }

  return {
    success: true,
    newBalance: INITIAL_BALANCE - totalCost,
    newQuantity: quantity,
  };
}
