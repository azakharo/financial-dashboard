import {apiClient} from './client';
import type {Portfolio, TradeResponse} from './types';

export async function getPortfolio(): Promise<Portfolio> {
  return apiClient.get('portfolio').json<Portfolio>();
}

export async function buyStock(
  ticker: string,
  quantity: number,
): Promise<TradeResponse> {
  return apiClient
    .post('portfolio/buy', {json: {ticker, quantity}})
    .json<TradeResponse>();
}

export async function sellStock(
  ticker: string,
  quantity: number,
): Promise<TradeResponse> {
  return apiClient
    .post('portfolio/sell', {json: {ticker, quantity}})
    .json<TradeResponse>();
}
