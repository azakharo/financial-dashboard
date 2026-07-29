import {ref, onUnmounted, computed} from 'vue';
import {useWebSocket} from '@vueuse/core';
import {throttle} from 'lodash';
import {useQueryClient, type InfiniteData} from '@tanstack/vue-query';
import type {
  Stock,
  WSPriceUpdate,
  PaginatedResponse,
  PricePoint,
} from '@/shared/api';
import {applyPriceUpdates} from '@/shared/api/websocket';
import {useUIStore} from '@/shared/store';

const WS_URL = '/ws';
const THROTTLE_MS = 2000;

interface RawWSPriceUpdate {
  ticker: string;
  price: number;
  priceChange24h?: number;
  timestamp: string;
}

function parseWSMessage(data: string): RawWSPriceUpdate[] {
  return JSON.parse(data) as RawWSPriceUpdate[];
}

function toWSPriceUpdate(raw: RawWSPriceUpdate): WSPriceUpdate {
  return {
    ticker: raw.ticker,
    price: raw.price,
    priceChange24h: raw.priceChange24h,
    timestamp: new Date(raw.timestamp),
  };
}

export function usePriceUpdate() {
  const queryClient = useQueryClient();
  const buffer = new Map<string, WSPriceUpdate>();
  const throttledFlush = ref<ReturnType<typeof throttle> | null>(null);

  const uiStore = useUIStore();

  const flush = () => {
    const updates = Array.from(buffer.values());
    buffer.clear();

    if (updates.length > 0) {
      const priceMap = new Map(
        updates.map(u => [
          u.ticker,
          {price: u.price, priceChange24h: u.priceChange24h},
        ]),
      );

      const sectorFilter = uiStore.sectorFilter;
      const searchQuery = uiStore.searchQuery;

      queryClient.setQueryData(
        [
          'stocks',
          {
            sector: sectorFilter ?? undefined,
            search: searchQuery || undefined,
          },
        ],
        (old: InfiniteData<PaginatedResponse<Stock>> | undefined) => {
          if (!old) return old;
          const newPages = applyPriceUpdates(old.pages, priceMap);
          if (newPages === old.pages) return old;
          return {...old, pages: newPages};
        },
      );

      const selectedTicker = uiStore.selectedTicker;
      const chartTimeframe = uiStore.chartTimeframe;
      if (selectedTicker && chartTimeframe === '1D') {
        const chartUpdate = updates.find(u => u.ticker === selectedTicker);
        if (chartUpdate) {
          queryClient.setQueryData(
            ['stockHistory', selectedTicker, '1D'],
            (old: PricePoint[] | undefined) => {
              if (!old || old.length === 0) return old;
              const lastPoint = old[old.length - 1];
              if (
                chartUpdate.timestamp.getTime() > lastPoint.timestamp.getTime()
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

      void queryClient.invalidateQueries({queryKey: ['portfolio']});
    }
  };

  throttledFlush.value = throttle(flush, THROTTLE_MS, {
    leading: false,
    trailing: true,
  });

  onUnmounted(() => {
    throttledFlush.value?.cancel();
  });

  const {status} = useWebSocket(WS_URL, {
    autoReconnect: {
      retries: 10,
      delay: 3000,
    },
    onMessage: (_ws, event) => {
      try {
        const rawData = event.data as string;
        const rawUpdates = parseWSMessage(rawData);
        for (const raw of rawUpdates) {
          const update = toWSPriceUpdate(raw);
          buffer.set(update.ticker, update);
        }
        throttledFlush.value?.();
      } catch {
        console.error('Failed to parse WS message');
      }
    },
  });

  const isConnected = computed(() => status.value === 'OPEN');

  return {isConnected, status};
}
