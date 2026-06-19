import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {ReactNode} from 'react';
import {render, type RenderOptions} from '@testing-library/react';
import type {
  Stock,
  PaginatedResponse,
  Portfolio,
  PricePoint,
} from '@/shared/api';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {retry: false},
      mutations: {retry: false},
    },
  });
}

export function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient();
  return function Wrapper({children}: {children: ReactNode}) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

export function renderWithProviders(
  ui: React.ReactElement,
  queryClient?: QueryClient,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const qc = queryClient ?? createQueryClient();
  return render(ui, {wrapper: createWrapper(qc), ...options});
}

export function createStock(overrides: Partial<Stock> = {}): Stock {
  return {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    currentPrice: 150.0,
    priceChange24h: 2.5,
    quantityInPortfolio: 10,
    ...overrides,
  };
}

export function createPage(
  stocks: Stock[] = [createStock()],
  overrides: Partial<PaginatedResponse<Stock>> = {},
): PaginatedResponse<Stock> {
  return {
    stocks,
    nextCursor: null,
    hasMore: false,
    ...overrides,
  };
}

export function createPortfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    totalValue: 100000,
    availableBalance: 50000,
    dailyChangePercent: 1.5,
    ...overrides,
  };
}

export function createPricePoint(
  overrides: Partial<PricePoint> = {},
): PricePoint {
  return {
    timestamp: new Date('2024-01-01T10:00:00'),
    price: 150,
    ...overrides,
  };
}
