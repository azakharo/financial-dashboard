import type {Stock, PaginatedResponse} from './types';

interface PriceUpdate {
  price: number;
  priceChange24h?: number;
}

export function applyPriceUpdates(
  pages: PaginatedResponse<Stock>[] | undefined,
  updates: Map<string, PriceUpdate>,
): PaginatedResponse<Stock>[] | undefined {
  if (!pages) return pages;

  let hasChanges = false;

  const newPages = pages.map(page => {
    let pageHasChanges = false;

    const newStocks = page.stocks.map(stock => {
      const update = updates.get(stock.ticker);
      if (update === undefined || update.price === stock.currentPrice)
        return stock;

      pageHasChanges = true;
      return {
        ...stock,
        currentPrice: update.price,
        priceChange24h: update.priceChange24h ?? 0,
      };
    });

    if (pageHasChanges) {
      hasChanges = true;
      return {...page, stocks: newStocks};
    }
    return page;
  });

  return hasChanges ? newPages : pages;
}
