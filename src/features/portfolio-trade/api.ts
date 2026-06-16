import {useMutation, useQueryClient} from '@tanstack/react-query';

import {buyStock, sellStock} from '@/shared/api';

export function useBuyStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ticker, quantity}: {ticker: string; quantity: number}) =>
      buyStock(ticker, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['portfolio']});
      void queryClient.invalidateQueries({queryKey: ['stocks']});
    },
  });
}

export function useSellStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ticker, quantity}: {ticker: string; quantity: number}) =>
      sellStock(ticker, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['portfolio']});
      void queryClient.invalidateQueries({queryKey: ['stocks']});
    },
  });
}
