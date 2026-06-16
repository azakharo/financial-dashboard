import {apiClient} from './client';
import type {Stock, PaginatedResponse, PricePoint, Timeframe} from './types';

export interface GetStocksParams {
  cursor?: string;
  limit?: number;
  sector?: string;
  search?: string;
}

export async function getStocks(
  params: GetStocksParams = {},
): Promise<PaginatedResponse<Stock>> {
  const searchParams: Record<string, string | number> = {};

  if (params.cursor) searchParams.cursor = params.cursor;
  if (params.limit) searchParams.limit = params.limit;
  if (params.sector) searchParams.sector = params.sector;
  if (params.search) searchParams.search = params.search;

  return apiClient
    .get('stocks', {searchParams})
    .json<PaginatedResponse<Stock>>();
}

export async function getStockHistory(
  ticker: string,
  timeframe: Timeframe = '1D',
): Promise<PricePoint[]> {
  const raw = await apiClient
    .get(`stocks/${ticker}/history`, {
      searchParams: {timeframe},
    })
    .json<{timestamp: string; price: number}[]>();

  return raw.map(point => ({
    timestamp: new Date(point.timestamp),
    price: point.price,
  }));
}
