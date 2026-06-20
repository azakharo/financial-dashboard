import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {StockTable} from '@/widgets/stock-table/ui/StockTable';
import {useUIStore} from '@/shared/store';
import {renderWithProviders, createStock} from '@/tests/utils';
import type {Stock, PaginatedResponse} from '@/shared/api';

const mockStocks = [
  createStock({
    ticker: 'AAPL',
    name: 'Apple Inc.',
    quantityInPortfolio: 10,
  }),
  createStock({
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    sector: 'Technology',
    currentPrice: 300,
    quantityInPortfolio: 0,
  }),
  createStock({
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    sector: 'Healthcare',
    currentPrice: 170,
    quantityInPortfolio: 5,
  }),
];

let mockUseStocksReturn: {
  data: {pages: PaginatedResponse<Stock>[]} | undefined;
  isLoading: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

vi.mock('@/entities/stock', async importOriginal => {
  const actual = await importOriginal<typeof import('@/entities/stock')>();
  return {
    ...actual,
    useStocks: () => mockUseStocksReturn,
  };
});

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({count}: {count: number}) => ({
    getVirtualItems: () =>
      Array.from({length: count}, (_, i) => ({
        index: i,
        size: 48,
        start: i * 48,
        key: i,
      })),
    getTotalSize: () => count * 48,
    scrollToIndex: vi.fn(),
  }),
}));

function createMockPage(stocks: Stock[] = mockStocks, hasMore = false) {
  return {
    stocks,
    nextCursor: hasMore ? 'cursor-2' : null,
    hasMore,
  };
}

describe('StockTable', () => {
  beforeEach(() => {
    useUIStore.setState({
      selectedTicker: null,
      sectorFilter: null,
      searchQuery: '',
    });
    mockUseStocksReturn = {
      data: {pages: [createMockPage()]},
      isLoading: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('рендер: отображает акции в виртуальной таблице', async () => {
    renderWithProviders(<StockTable />);

    await waitFor(() => {
      expect(screen.getByTestId('stock-row-AAPL')).toBeInTheDocument();
    });
    expect(screen.getByTestId('stock-row-MSFT')).toBeInTheDocument();
    expect(screen.getByTestId('stock-row-JNJ')).toBeInTheDocument();
  });

  it('клик по ряду → selectedTicker обновлён', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StockTable />);

    await waitFor(() => {
      expect(screen.getByTestId('stock-row-AAPL')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('stock-row-AAPL'));

    expect(useUIStore.getState().selectedTicker).toBe('AAPL');
  });

  it('клик «Купить» → openTradeModal(buy)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StockTable />);

    await waitFor(() => {
      expect(screen.getByTestId('stock-row-AAPL')).toBeInTheDocument();
    });

    const aaplRow = screen.getByTestId('stock-row-AAPL');
    const buyButton = within(aaplRow).getByRole('button', {name: /купить/i});
    await user.click(buyButton);

    const state = useUIStore.getState();
    expect(state.tradeModalOpen).toBe(true);
    expect(state.tradeModalTicker).toBe('AAPL');
    expect(state.tradeModalMode).toBe('buy');
  });

  it('клик «Продать» → openTradeModal(sell)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StockTable />);

    await waitFor(() => {
      expect(screen.getByTestId('stock-row-JNJ')).toBeInTheDocument();
    });

    const jnjRow = screen.getByTestId('stock-row-JNJ');
    const sellButton = within(jnjRow).getByRole('button', {name: /продать/i});
    await user.click(sellButton);

    const state = useUIStore.getState();
    expect(state.tradeModalMode).toBe('sell');
    expect(state.tradeModalTicker).toBe('JNJ');
  });

  it('нет кнопки «Продать» при qty=0', async () => {
    renderWithProviders(<StockTable />);

    await waitFor(() => {
      expect(screen.getByTestId('stock-row-MSFT')).toBeInTheDocument();
    });

    const msftRow = screen.getByTestId('stock-row-MSFT');
    expect(
      within(msftRow).queryByRole('button', {name: /продать/i}),
    ).not.toBeInTheDocument();
  });

  it('фильтр по сектору', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StockTable />);

    await waitFor(() => {
      expect(screen.getByTestId('stock-row-AAPL')).toBeInTheDocument();
    });

    const healthcareBadge = screen.getByText('Healthcare');
    await user.click(healthcareBadge);

    expect(useUIStore.getState().sectorFilter).toBe('Healthcare');
  });

  it('поиск по тикеру отображает input', async () => {
    renderWithProviders(<StockTable />);

    await waitFor(() => {
      expect(screen.getByTestId('stock-row-AAPL')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /поиск по тикеру или названию/i,
    );
    expect(searchInput).toBeInTheDocument();
  });

  it('пустые результаты → fallback', async () => {
    mockUseStocksReturn = {
      data: {pages: [createMockPage([], false)]},
      isLoading: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    };

    renderWithProviders(<StockTable />);

    await waitFor(() => {
      expect(screen.getByText('Акции не найдены')).toBeInTheDocument();
    });
  });

  it('loading state', async () => {
    mockUseStocksReturn = {
      data: undefined,
      isLoading: true,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    };

    renderWithProviders(<StockTable />);

    await waitFor(() => {
      expect(screen.getByText('Загрузка акций...')).toBeInTheDocument();
    });
  });

  it('«Загрузить ещё» при hasMore', async () => {
    mockUseStocksReturn = {
      data: {pages: [createMockPage(mockStocks, true)]},
      isLoading: false,
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isFetchingNextPage: false,
    };

    renderWithProviders(<StockTable />);

    await waitFor(() => {
      expect(screen.getByTestId('stock-row-AAPL')).toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', {name: /загрузить ещё/i}),
    ).toBeInTheDocument();
  });
});
