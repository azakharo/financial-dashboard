import {useRef, useEffect} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {throttle} from 'lodash';
import useWebSocket from 'react-use-websocket';

import type {PricePoint, WSPriceUpdate} from '@/shared/api';

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

function mergePricePoints(
  existing: PricePoint[] | undefined,
  updates: WSPriceUpdate[],
): PricePoint[] | undefined {
  if (!existing) return existing;

  let hasChanges = false;
  const newPoints = [...existing];

  for (const update of updates) {
    const lastPoint = newPoints[newPoints.length - 1];
    if (lastPoint) {
      const lastTime = lastPoint.timestamp.getTime();
      const updateTime = update.timestamp.getTime();
      if (updateTime >= lastTime - 60000) {
        newPoints.push({
          timestamp: update.timestamp,
          price: update.price,
        });
        hasChanges = true;
      }
    }
  }

  return hasChanges ? newPoints : existing;
}

export function useChartUpdates(ticker: string | null, timeframe: string) {
  const queryClient = useQueryClient();
  const bufferRef = useRef(new Map<string, WSPriceUpdate>());
  const throttledFlushRef = useRef<ReturnType<typeof throttle> | null>(null);

  const {lastMessage} = useWebSocket(WS_URL, {
    share: true,
  });

  useEffect(() => {
    if (!ticker) return;

    const flush = () => {
      const updates = Array.from(bufferRef.current.values());
      bufferRef.current.clear();

      if (updates.length > 0) {
        const relevantUpdates = updates.filter(u => u.ticker === ticker);
        if (relevantUpdates.length > 0) {
          queryClient.setQueryData(
            ['stockHistory', ticker, timeframe],
            (old: PricePoint[] | undefined) =>
              mergePricePoints(old, relevantUpdates),
          );
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
  }, [queryClient, ticker, timeframe]);

  useEffect(() => {
    if (!lastMessage || !ticker) return;

    try {
      const rawUpdates = parseWSMessage(lastMessage.data as string);
      for (const raw of rawUpdates) {
        if (raw.ticker === ticker) {
          const update = toWSPriceUpdate(raw);
          bufferRef.current.set(
            `${update.ticker}-${update.timestamp.getTime()}`,
            update,
          );
        }
      }
      throttledFlushRef.current?.();
    } catch {
      console.error('Failed to parse WS message in useChartUpdates');
    }
  }, [lastMessage, ticker]);
}
