export type Sector =
  | 'Technology'
  | 'Healthcare'
  | 'Finance'
  | 'Consumer'
  | 'Energy'
  | 'Industrial';

export const SECTORS: readonly Sector[] = [
  'Technology',
  'Healthcare',
  'Finance',
  'Consumer',
  'Energy',
  'Industrial',
] as const;

export interface Stock {
  ticker: string;
  name: string;
  sector: Sector;
  currentPrice: number;
  priceChange24h: number;
  quantityInPortfolio: number;
}

export interface PricePoint {
  timestamp: Date;
  price: number;
}

export interface Portfolio {
  totalValue: number;
  availableBalance: number;
  dailyChangePercent: number;
}

export interface WSPriceUpdate {
  ticker: string;
  price: number;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  stocks: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface TradeResponse {
  success: boolean;
  newBalance?: number;
  newQuantity?: number;
  error?: string;
}

export type Timeframe = '1D' | '1W' | '1M' | '1Y';

export type TradeMode = 'buy' | 'sell';
