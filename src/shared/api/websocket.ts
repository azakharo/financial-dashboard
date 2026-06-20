import type {Stock, PaginatedResponse} from './types';

export function applyPriceUpdates(
  pages: PaginatedResponse<Stock>[] | undefined,
  updates: Map<string, number>,
): PaginatedResponse<Stock>[] | undefined {
  if (!pages) return pages;

  let hasChanges = false;

  const newPages = pages.map(page => {
    let pageHasChanges = false;

    const newStocks = page.stocks.map(stock => {
      const newPrice = updates.get(stock.ticker);
      if (newPrice !== undefined && newPrice !== stock.currentPrice) {
        pageHasChanges = true;
        return {...stock, currentPrice: newPrice};
      }
      return stock;
    });

    if (pageHasChanges) {
      hasChanges = true;
      return {...page, stocks: newStocks};
    }
    return page;
  });

  return hasChanges ? newPages : pages;
}
