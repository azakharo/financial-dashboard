import {memo, useEffect, useMemo, useRef} from 'react';
import {useVirtualizer} from '@tanstack/react-virtual';

import type {Stock} from '@/shared/api';
import {StockRow} from '@/entities/stock';

interface VirtualizedRowProps {
  stock: Stock;
  isSelected: boolean;
  onSelect: (ticker: string) => void;
  onBuy: (ticker: string) => void;
  onSell: (ticker: string) => void;
  size: number;
  start: number;
}

const VirtualizedRow = memo(function VirtualizedRow({
  stock,
  isSelected,
  onSelect,
  onBuy,
  onSell,
  size,
  start,
}: VirtualizedRowProps) {
  const style = useMemo(
    () => ({
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: `${size}px`,
      transform: `translateY(${start}px)`,
    }),
    [size, start],
  );

  return (
    <StockRow
      stock={stock}
      isSelected={isSelected}
      onSelect={onSelect}
      onBuy={onBuy}
      onSell={onSell}
      style={style}
    />
  );
});

interface StockTableBodyProps {
  stocks: Stock[];
  selectedTicker: string | null;
  onSelect: (ticker: string) => void;
  onBuy: (ticker: string) => void;
  onSell: (ticker: string) => void;
  isLoading?: boolean;
  queryKey: string;
}

export const StockTableBody = memo(function StockTableBody({
  stocks,
  selectedTicker,
  onSelect,
  onBuy,
  onSell,
  isLoading,
  queryKey,
}: StockTableBodyProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: stocks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  useEffect(() => {
    rowVirtualizer.scrollToIndex(0, {align: 'start'});
  }, [queryKey, rowVirtualizer]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Загрузка акций...
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Акции не найдены
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[500px] w-full overflow-auto"
      data-testid="stock-table-body"
    >
      <div
        className="relative w-full"
        style={{height: `${rowVirtualizer.getTotalSize()}px`}}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const stock = stocks[virtualRow.index];
          return (
            <VirtualizedRow
              key={stock.ticker}
              stock={stock}
              isSelected={selectedTicker === stock.ticker}
              onSelect={onSelect}
              onBuy={onBuy}
              onSell={onSell}
              size={virtualRow.size}
              start={virtualRow.start}
            />
          );
        })}
      </div>
    </div>
  );
});
