import {useQuery} from '@tanstack/vue-query';
import {computed} from 'vue';

import {getStockHistory} from '@/shared/api';
import type {Timeframe} from '@/shared/api';

export function useStockHistory(
  ticker: string | null,
  timeframe: Timeframe = '1D',
) {
  const enabled = computed(() => ticker !== null);

  return useQuery({
    queryKey: ['stockHistory', ticker, timeframe],
    queryFn: () => getStockHistory(ticker!, timeframe),
    enabled,
    structuralSharing: true,
  });
}
