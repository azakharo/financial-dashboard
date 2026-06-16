import {useQuery} from '@tanstack/react-query';
import {getStockHistory} from '@/shared/api';
import type {Timeframe} from '@/shared/api';

export function useStockHistory(
  ticker: string | null,
  timeframe: Timeframe = '1D',
) {
  return useQuery({
    queryKey: ['stockHistory', ticker, timeframe],
    queryFn: () => getStockHistory(ticker!, timeframe),
    enabled: ticker !== null,
    structuralSharing: true,
  });
}
