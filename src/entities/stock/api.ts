import {useInfiniteQuery} from '@tanstack/vue-query';
import {computed, unref, type MaybeRef} from 'vue';

import {getStocks} from '@/shared/api';
import type {Stock, PaginatedResponse} from '@/shared/api';

interface UseStocksParams {
  sector?: MaybeRef<string | undefined>;
  search?: MaybeRef<string | undefined>;
}

export function useStocks(params: UseStocksParams = {}) {
  const sector = computed(() => unref(params.sector));
  const search = computed(() => unref(params.search));

  return useInfiniteQuery({
    queryKey: ['stocks', {sector, search}],
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
