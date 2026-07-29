import type {Sector} from '@/shared/api';

interface StocksQueryKeyParams {
  sector?: Sector | string | null | undefined;
  search?: string | undefined;
}

export function stocksQueryKey(params: StocksQueryKeyParams = {}): unknown[] {
  return [
    'stocks',
    {sector: params.sector ?? undefined, search: params.search || undefined},
  ];
}
