import {Card, CardContent, CardHeader, CardTitle} from '@/shared/ui/card';
import {useStocks} from '@/entities/stock';
import {useUIStore} from '@/shared/store';
import {usePriceFeed, type Stock} from '@/shared/api';
import {useDebouncedValue} from '@/shared/lib';

import {TableFilters} from './TableFilters';
import {StockTableBody} from './StockTableBody';
import {useCallback, useMemo} from 'react';

function flattenStocks(data: ReturnType<typeof useStocks>['data']): Stock[] {
  if (!data) return [];
  return data.pages.flatMap(page => page.stocks);
}

export function StockTable() {
  const selectedTicker = useUIStore(s => s.selectedTicker);
  const setSelectedTicker = useUIStore(s => s.setSelectedTicker);
  const sectorFilter = useUIStore(s => s.sectorFilter);
  const searchQuery = useUIStore(s => s.searchQuery);
  const setSectorFilter = useUIStore(s => s.setSectorFilter);
  const setSearchQuery = useUIStore(s => s.setSearchQuery);
  const openTradeModal = useUIStore(s => s.openTradeModal);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 500);

  const {data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage} =
    useStocks({
      sector: sectorFilter ?? undefined,
      search: debouncedSearchQuery || undefined,
    });

  usePriceFeed({
    sector: sectorFilter ?? undefined,
    search: debouncedSearchQuery || undefined,
  });

  const stocks = useMemo(() => flattenStocks(data), [data]);

  const queryKey = useMemo(
    () => `${sectorFilter ?? 'all'}-${debouncedSearchQuery ?? ''}`,
    [sectorFilter, debouncedSearchQuery],
  );

  const handleSelect = useCallback(
    (ticker: string) => {
      setSelectedTicker(ticker);
    },
    [setSelectedTicker],
  );

  const handleBuy = useCallback(
    (ticker: string) => {
      openTradeModal(ticker, 'buy');
    },
    [openTradeModal],
  );

  const handleSell = useCallback(
    (ticker: string) => {
      openTradeModal(ticker, 'sell');
    },
    [openTradeModal],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Акции</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <TableFilters
          sectorFilter={sectorFilter}
          searchQuery={searchQuery}
          onSectorChange={setSectorFilter}
          onSearchChange={setSearchQuery}
        />
        <div
          className="
            flex items-center border-b border-gray-200 px-4 py-2 text-sm
            font-medium text-muted-foreground
          "
        >
          <div className="min-w-12">Тикер</div>
          <div className="min-w-32">Название</div>
          <div className="w-32 text-right">Цена</div>
          <div className="w-24 text-right">24ч</div>
          <div className="w-24 text-right">В портфеле</div>
          <div className="w-48 text-right">Действия</div>
        </div>
        <StockTableBody
          stocks={stocks}
          selectedTicker={selectedTicker}
          onSelect={handleSelect}
          onBuy={handleBuy}
          onSell={handleSell}
          isLoading={isLoading}
          queryKey={queryKey}
        />
        {hasNextPage && (
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="
              mt-2 rounded-sm bg-primary px-4 py-2 text-primary-foreground
              disabled:opacity-50
            "
          >
            {isFetchingNextPage ? 'Загрузка...' : 'Загрузить ещё'}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
