import {useQuery} from '@tanstack/react-query';
import {getPortfolio} from '@/shared/api';

export function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: getPortfolio,
    structuralSharing: true,
  });
}
