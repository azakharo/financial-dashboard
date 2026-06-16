import {useRef, useEffect} from 'react';
import useWebSocket, {ReadyState} from 'react-use-websocket';
import {throttle} from 'lodash';
import {useQueryClient} from '@tanstack/react-query';
import type {Stock, WSPriceUpdate} from './types';

const WS_URL = '/ws';
const THROTTLE_MS = 100;

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

function applyPriceUpdates(
  stocks: Stock[] | undefined,
  updates: WSPriceUpdate[],
): Stock[] | undefined {
  if (!stocks) return stocks;

  const updateMap = new Map(updates.map(u => [u.ticker, u.price]));
  let hasChanges = false;

  const newStocks = stocks.map(stock => {
    const newPrice = updateMap.get(stock.ticker);
    if (newPrice !== undefined && newPrice !== stock.currentPrice) {
      hasChanges = true;
      return {...stock, currentPrice: newPrice};
    }
    return stock;
  });

  return hasChanges ? newStocks : stocks;
}

export function usePriceFeed() {
  const queryClient = useQueryClient();
  const bufferRef = useRef(new Map<string, WSPriceUpdate>());
  const throttledFlushRef = useRef<ReturnType<typeof throttle> | null>(null);

  useEffect(() => {
    const flush = () => {
      const updates = Array.from(bufferRef.current.values());
      bufferRef.current.clear();

      if (updates.length > 0) {
        queryClient.setQueryData(['stocks'], (old: Stock[] | undefined) =>
          applyPriceUpdates(old, updates),
        );
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
  }, [queryClient]);

  const {readyState, lastMessage} = useWebSocket(WS_URL, {
    share: true,
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
  });

  useEffect(() => {
    if (!lastMessage) return;

    try {
      const rawUpdates = parseWSMessage(lastMessage.data as string);
      for (const raw of rawUpdates) {
        const update = toWSPriceUpdate(raw);
        bufferRef.current.set(update.ticker, update);
      }
      throttledFlushRef.current?.();
    } catch {
      console.error('Failed to parse WS message');
    }
  }, [lastMessage]);

  const isConnected = readyState === ReadyState.OPEN;

  return {isConnected, readyState};
}

export {ReadyState};
