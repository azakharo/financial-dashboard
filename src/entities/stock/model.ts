import type {Stock} from '@/shared/api';

export function selectStockByTicker(
  stocks: Stock[] | undefined,
  ticker: string,
): Stock | undefined {
  if (!stocks) return undefined;
  return stocks.find(stock => stock.ticker === ticker);
}

export function selectTotalPortfolioValue(stocks: Stock[] | undefined): number {
  if (!stocks) return 0;
  return stocks.reduce(
    (sum, stock) => sum + stock.currentPrice * stock.quantityInPortfolio,
    0,
  );
}

export function selectStocksBySector(
  stocks: Stock[] | undefined,
  sector: string,
): Stock[] {
  if (!stocks) return [];
  return stocks.filter(stock => stock.sector === sector);
}

export function selectStocksSortedByTicker(
  stocks: Stock[] | undefined,
): Stock[] {
  if (!stocks) return [];
  return [...stocks].sort((a, b) => a.ticker.localeCompare(b.ticker));
}

export function selectStocksSortedByPrice(
  stocks: Stock[] | undefined,
  asc = true,
): Stock[] {
  if (!stocks) return [];
  return [...stocks].sort((a, b) =>
    asc ? a.currentPrice - b.currentPrice : b.currentPrice - a.currentPrice,
  );
}
