import {memo} from 'react';
import type {Stock} from '@/shared/api';
import {Button} from '@/components/ui/button';

interface StockRowProps {
  stock: Stock;
  isSelected: boolean;
  onSelect: (ticker: string) => void;
  onBuy: (ticker: string) => void;
  onSell: (ticker: string) => void;
  style?: React.CSSProperties;
}

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

export const StockRow: React.FC<StockRowProps> = memo(function StockRow({
  stock,
  isSelected,
  onSelect,
  onBuy,
  onSell,
  style,
}) {
  const priceChangeClass =
    stock.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div
      data-testid={`stock-row-${stock.ticker}`}
      className={`
        flex cursor-pointer items-center border-b border-gray-100 px-4 py-2
        hover:bg-gray-50
        ${isSelected ? 'bg-blue-50' : ''}
      `}
      style={style}
      onClick={() => onSelect(stock.ticker)}
    >
      <div className="w-24 font-mono font-semibold">{stock.ticker}</div>
      <div className="flex-1 truncate">{stock.name}</div>
      <div className="w-32 text-right font-mono">
        {formatPrice(stock.currentPrice)}
      </div>
      <div
        className={`
          w-24 text-right font-mono
          ${priceChangeClass}
        `}
      >
        {formatChange(stock.priceChange24h)}
      </div>
      <div className="w-24 text-right font-mono">
        {stock.quantityInPortfolio.toLocaleString('ru-RU')}
      </div>
      <div className="flex w-32 justify-end gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={e => {
            e.stopPropagation();
            onBuy(stock.ticker);
          }}
        >
          Купить
        </Button>
        {stock.quantityInPortfolio > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={e => {
              e.stopPropagation();
              onSell(stock.ticker);
            }}
          >
            Продать
          </Button>
        )}
      </div>
    </div>
  );
});
