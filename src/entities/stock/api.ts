import {useInfiniteQuery} from '@tanstack/vue-query';
import {computed} from 'vue';

import {getStocks} from '@/shared/api';
import type {Stock, PaginatedResponse, GetStocksParams} from '@/shared/api';

export function useStocks(params: Omit<GetStocksParams, 'cursor'> = {}) {
  const sector = computed(() => params.sector);
  const search = computed(() => params.search);

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
