import {useInfiniteQuery} from '@tanstack/vue-query';
import {computed, unref, type MaybeRef} from 'vue';

import {getStocks} from '@/shared/api';
import type {Stock, PaginatedResponse, Sector} from '@/shared/api';
import {stocksQueryKey} from './queryKeys';

interface UseStocksParams {
  sector?: MaybeRef<Sector | string | null | undefined>;
  search?: MaybeRef<string | undefined>;
}

export function useStocks(params: UseStocksParams = {}) {
  const sector = computed(() => {
    const value = unref(params.sector);
    return value ?? undefined;
  });
  const search = computed(() => unref(params.search) ?? undefined);

  return useInfiniteQuery({
    queryKey: computed(() =>
      stocksQueryKey({sector: sector.value, search: search.value}),
    ),
    queryFn: ({pageParam}) =>
      getStocks({
        sector: sector.value,
        search: search.value,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PaginatedResponse<Stock>) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    structuralSharing: true,
  });
}
