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
      if (update === undefined) return stock;

      const priceChanged = update.price !== stock.currentPrice;
      const changeChanged =
        update.priceChange24h !== undefined &&
        update.priceChange24h !== stock.priceChange24h;

      if (!priceChanged && !changeChanged) return stock;

      pageHasChanges = true;
      return {
        ...stock,
        ...(priceChanged && {currentPrice: update.price}),
        ...(changeChanged && {priceChange24h: update.priceChange24h}),
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
