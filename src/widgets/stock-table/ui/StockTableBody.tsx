import {useRef} from 'react';
import {useVirtualizer} from '@tanstack/react-virtual';

import type {Stock} from '@/shared/api';
import {StockRow} from '@/entities/stock';

interface StockTableBodyProps {
  stocks: Stock[];
  selectedTicker: string | null;
  onSelect: (ticker: string) => void;
  onBuy: (ticker: string) => void;
  onSell: (ticker: string) => void;
  isLoading?: boolean;
}

export function StockTableBody({
  stocks,
  selectedTicker,
  onSelect,
  onBuy,
  onSell,
  isLoading,
}: StockTableBodyProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: stocks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

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
            <StockRow
              key={stock.ticker}
              stock={stock}
              isSelected={selectedTicker === stock.ticker}
              onSelect={onSelect}
              onBuy={onBuy}
              onSell={onSell}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
