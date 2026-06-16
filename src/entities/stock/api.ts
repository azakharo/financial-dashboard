import {useInfiniteQuery} from '@tanstack/react-query';
import {getStocks} from '@/shared/api';
import type {Stock, PaginatedResponse, GetStocksParams} from '@/shared/api';

export function useStocks(params: Omit<GetStocksParams, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: ['stocks', params.sector, params.search],
    queryFn: ({pageParam}) => getStocks({...params, cursor: pageParam}),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PaginatedResponse<Stock>) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    structuralSharing: true,
  });
}
