import {useRef, useEffect, useCallback} from 'react';
import useWebSocket, {ReadyState} from 'react-use-websocket';
import {throttle} from 'lodash';
import {useQueryClient, type InfiniteData} from '@tanstack/react-query';
import type {
  Stock,
  WSPriceUpdate,
  PaginatedResponse,
  PricePoint,
} from './types';
import {useUIStore} from '@/shared/store';

const WS_URL = '/ws';
const THROTTLE_MS = 2000;

interface RawWSPriceUpdate {
  ticker: string;
  price: number;
  timestamp: string;
}

function parseWSMessage(data: string): RawWSPriceUpdate[] {
  return JSON.parse(data) as RawWSPriceUpdate[];
}

function toWSPriceUpdate(raw: RawWSPriceUpdate): WSPriceUpdate {
  return {
    ticker: raw.ticker,
    price: raw.price,
    timestamp: new Date(raw.timestamp),
  };
}

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

interface UsePriceFeedParams {
  sector?: string;
  search?: string;
}

export function usePriceFeed(params: UsePriceFeedParams = {}) {
  const {sector, search} = params;
  const queryClient = useQueryClient();
  const bufferRef = useRef(new Map<string, WSPriceUpdate>());
  const throttledFlushRef = useRef<ReturnType<typeof throttle> | null>(null);

  useEffect(() => {
    const flush = () => {
      const updates = Array.from(bufferRef.current.values());
      bufferRef.current.clear();

      if (updates.length > 0) {
        const priceMap = new Map(updates.map(u => [u.ticker, u.price]));

        queryClient.setQueryData(
          ['stocks', {sector, search}],
          (old: InfiniteData<PaginatedResponse<Stock>> | undefined) => {
            if (!old) return old;
            const newPages = applyPriceUpdates(old.pages, priceMap);
            if (newPages === old.pages) return old;
            return {...old, pages: newPages};
          },
        );

        const {selectedTicker, chartTimeframe} = useUIStore.getState();
        if (selectedTicker && chartTimeframe === '1D') {
          const chartUpdate = updates.find(u => u.ticker === selectedTicker);
          if (chartUpdate) {
            queryClient.setQueryData(
              ['stockHistory', selectedTicker, '1D'],
              (old: PricePoint[] | undefined) => {
                if (!old || old.length === 0) return old;
                const lastPoint = old[old.length - 1];
                if (
                  chartUpdate.timestamp.getTime() >
                  lastPoint.timestamp.getTime()
                ) {
                  return [
                    ...old,
                    {
                      timestamp: chartUpdate.timestamp,
                      price: chartUpdate.price,
                    },
                  ];
                }
                return old;
              },
            );
          }
        }
      }
    };

    throttledFlushRef.current = throttle(flush, THROTTLE_MS, {
      leading: false,
      trailing: true,
    });

    return () => {
      throttledFlushRef.current?.cancel();
      throttledFlushRef.current = null;
    };
  }, [queryClient, sector, search]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const rawUpdates = parseWSMessage(event.data as string);
      for (const raw of rawUpdates) {
        const update = toWSPriceUpdate(raw);
        bufferRef.current.set(update.ticker, update);
      }
      throttledFlushRef.current?.();
    } catch {
      console.error('Failed to parse WS message');
    }
  }, []);

  const {readyState} = useWebSocket(WS_URL, {
    share: true,
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
    filter: () => false,
    onMessage: handleMessage,
  });

  const isConnected = readyState === ReadyState.OPEN;

  return {isConnected, readyState};
}
