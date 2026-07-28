import {useQuery} from '@tanstack/vue-query';
import {computed, toValue, type MaybeRef} from 'vue';

import {getStockHistory} from '@/shared/api';
import type {Timeframe} from '@/shared/api';

export function useStockHistory(
  ticker: MaybeRef<string | null>,
  timeframe: MaybeRef<Timeframe> = '1D',
) {
  const enabled = computed(() => toValue(ticker) !== null);

  return useQuery({
    queryKey: ['stockHistory', ticker, timeframe],
    queryFn: () => getStockHistory(toValue(ticker)!, toValue(timeframe)!),
    enabled,
    structuralSharing: true,
  });
}
