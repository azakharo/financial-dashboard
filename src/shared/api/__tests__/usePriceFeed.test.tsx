import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import type {InfiniteData} from '@tanstack/react-query';

import {usePriceFeed} from '@/shared/api/websocket';
import {useUIStore} from '@/shared/store';
import {
  createQueryClient,
  createWrapper,
  createStock,
  createPage,
  createPricePoint,
} from '@/tests/utils';
import type {Stock, PaginatedResponse, PricePoint} from '@/shared/api';

let capturedOnMessage: ((event: MessageEvent) => void) | null = null;

vi.mock('react-use-websocket', () => ({
  default: vi.fn(
    (_url: string, options: {onMessage: (e: MessageEvent) => void}) => {
      capturedOnMessage = options.onMessage;
      return {
        sendJsonMessage: vi.fn(),
        lastMessage: null,
        readyState: 1,
      };
    },
  ),
  ReadyState: {CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3},
}));

function sendWSMessage(
  updates: Array<{ticker: string; price: number; timestamp: string}>,
) {
  capturedOnMessage!(
    new MessageEvent('message', {data: JSON.stringify(updates)}),
  );
}

function seedStocksCache(
  qc: ReturnType<typeof createQueryClient>,
  stocks: Stock[],
) {
  qc.setQueryData(['stocks', {sector: undefined, search: undefined}], {
    pages: [createPage(stocks)],
    pageParams: [undefined],
  } as InfiniteData<PaginatedResponse<Stock>>);
}

function seedHistoryCache(
  qc: ReturnType<typeof createQueryClient>,
  ticker: string,
  points: PricePoint[],
) {
  qc.setQueryData(['stockHistory', ticker, '1D'], points);
}

describe('usePriceFeed', () => {
  let qc: ReturnType<typeof createQueryClient>;

  beforeEach(() => {
    vi.useFakeTimers();
    qc = createQueryClient();
    useUIStore.setState({
      selectedTicker: null,
      chartTimeframe: '1D',
    });
    capturedOnMessage = null;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('одиночное WS-сообщение обновляет кеш после throttle', () => {
    seedStocksCache(qc, [createStock({ticker: 'AAPL', currentPrice: 150})]);

    renderHook(() => usePriceFeed(), {wrapper: createWrapper(qc)});

    sendWSMessage([
      {ticker: 'AAPL', price: 155, timestamp: '2024-01-01T10:00:00'},
    ]);
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const data = qc.getQueryData([
      'stocks',
      {sector: undefined, search: undefined},
    ]) as InfiniteData<PaginatedResponse<Stock>>;
    expect(data.pages[0].stocks[0].currentPrice).toBe(155);
  });

  it('батчинг: несколько сообщений за throttle-окно', () => {
    seedStocksCache(qc, [
      createStock({ticker: 'AAPL', currentPrice: 150}),
      createStock({ticker: 'MSFT', currentPrice: 300}),
    ]);

    renderHook(() => usePriceFeed(), {wrapper: createWrapper(qc)});

    sendWSMessage([
      {ticker: 'AAPL', price: 152, timestamp: '2024-01-01T10:00:00'},
    ]);
    sendWSMessage([
      {ticker: 'AAPL', price: 155, timestamp: '2024-01-01T10:00:01'},
      {ticker: 'MSFT', price: 310, timestamp: '2024-01-01T10:00:01'},
    ]);
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const data = qc.getQueryData([
      'stocks',
      {sector: undefined, search: undefined},
    ]) as InfiniteData<PaginatedResponse<Stock>>;
    const aapl = data.pages[0].stocks.find(s => s.ticker === 'AAPL');
    const msft = data.pages[0].stocks.find(s => s.ticker === 'MSFT');
    expect(aapl?.currentPrice).toBe(155);
    expect(msft?.currentPrice).toBe(310);
  });

  it('WS-сообщение обновляет историю графика при selectedTicker + 1D', () => {
    const historyPoints = [createPricePoint({price: 148})];
    seedHistoryCache(qc, 'AAPL', historyPoints);
    seedStocksCache(qc, [createStock({ticker: 'AAPL', currentPrice: 150})]);
    useUIStore.setState({selectedTicker: 'AAPL', chartTimeframe: '1D'});

    renderHook(() => usePriceFeed(), {wrapper: createWrapper(qc)});

    sendWSMessage([
      {ticker: 'AAPL', price: 155, timestamp: '2024-01-01T12:00:00'},
    ]);
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const history = qc.getQueryData<PricePoint[]>([
      'stockHistory',
      'AAPL',
      '1D',
    ]);
    expect(history).toBeDefined();
    expect(history!.length).toBe(2);
    expect(history![1].price).toBe(155);
  });

  it('история НЕ обновляется при timeframe !== 1D', () => {
    const historyPoints = [createPricePoint({price: 148})];
    seedHistoryCache(qc, 'AAPL', historyPoints);
    seedStocksCache(qc, [createStock({ticker: 'AAPL', currentPrice: 150})]);
    useUIStore.setState({selectedTicker: 'AAPL', chartTimeframe: '1W'});

    renderHook(() => usePriceFeed(), {wrapper: createWrapper(qc)});

    const refBefore = qc.getQueryData(['stockHistory', 'AAPL', '1D']);

    sendWSMessage([
      {ticker: 'AAPL', price: 155, timestamp: '2024-01-01T12:00:00'},
    ]);
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const refAfter = qc.getQueryData(['stockHistory', 'AAPL', '1D']);
    expect(refAfter).toBe(refBefore);
  });

  it('unmount отменяет throttle', () => {
    seedStocksCache(qc, [createStock({ticker: 'AAPL', currentPrice: 150})]);

    const {unmount} = renderHook(() => usePriceFeed(), {
      wrapper: createWrapper(qc),
    });

    sendWSMessage([
      {ticker: 'AAPL', price: 155, timestamp: '2024-01-01T10:00:00'},
    ]);
    unmount();
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const data = qc.getQueryData([
      'stocks',
      {sector: undefined, search: undefined},
    ]) as InfiniteData<PaginatedResponse<Stock>>;
    expect(data.pages[0].stocks[0].currentPrice).toBe(150);
  });

  it('пустой buffer не трогает кеш (structural sharing)', () => {
    seedStocksCache(qc, [createStock({ticker: 'AAPL', currentPrice: 150})]);

    renderHook(() => usePriceFeed(), {wrapper: createWrapper(qc)});

    const refBefore = qc.getQueryData([
      'stocks',
      {sector: undefined, search: undefined},
    ]);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const refAfter = qc.getQueryData([
      'stocks',
      {sector: undefined, search: undefined},
    ]);
    expect(refAfter).toBe(refBefore);
  });

  it('сообщения с неизвестным тикером не ломают кеш', () => {
    seedStocksCache(qc, [createStock({ticker: 'AAPL', currentPrice: 150})]);

    renderHook(() => usePriceFeed(), {wrapper: createWrapper(qc)});

    sendWSMessage([
      {ticker: 'UNKNOWN', price: 999, timestamp: '2024-01-01T10:00:00'},
    ]);
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const data = qc.getQueryData([
      'stocks',
      {sector: undefined, search: undefined},
    ]) as InfiniteData<PaginatedResponse<Stock>>;
    expect(data.pages[0].stocks[0].currentPrice).toBe(150);
    expect(data.pages[0].stocks).toHaveLength(1);
  });
});
