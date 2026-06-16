import * as React from 'react';

import {Button} from '@/components/ui/button';
import type {Stock, TradeMode} from '@/shared/api';

import {usePortfolio} from '@/entities/portfolio';
import {useUIStore} from '@/shared/store';

import {useBuyStock, useSellStock} from '../api';
import {
  calculateTotalCost,
  validateBuy,
  validateSell,
} from '../model/validation';

interface TradeFormProps {
  stock: Stock | undefined;
  mode: TradeMode;
  onSuccess?: () => void;
}

export function TradeForm({stock, mode, onSuccess}: TradeFormProps) {
  const [quantity, setQuantity] = React.useState(1);
  const [error, setError] = React.useState<string | undefined>();

  const {data: portfolio} = usePortfolio();
  const closeTradeModal = useUIStore(s => s.closeTradeModal);

  const buyMutation = useBuyStock();
  const sellMutation = useSellStock();

  const mutation = mode === 'buy' ? buyMutation : sellMutation;
  const isPending = mutation.isPending;

  const availableBalance = portfolio?.availableBalance ?? 0;
  const quantityInPortfolio = stock?.quantityInPortfolio ?? 0;

  const totalCost = stock
    ? calculateTotalCost(quantity, stock.currentPrice)
    : 0;

  const validation = React.useMemo(() => {
    if (!stock) return {isValid: false, error: 'Акция не выбрана'};

    if (mode === 'buy') {
      return validateBuy(quantity, availableBalance, stock);
    }

    return validateSell(quantity, stock);
  }, [quantity, availableBalance, stock, mode]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setQuantity(Number.isNaN(value) ? 0 : value);
    setError(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    if (!stock) return;

    mutation.mutate(
      {ticker: stock.ticker, quantity},
      {
        onSuccess: () => {
          closeTradeModal();
          onSuccess?.();
        },
        onError: () => {
          setError('Ошибка при выполнении операции');
        },
      },
    );
  };

  if (!stock) {
    return <div className="text-muted-foreground">Акция не найдена</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Акция</label>
        <div className="text-lg font-semibold">
          {stock.ticker} — {stock.name}
        </div>
        <div className="text-sm text-muted-foreground">
          Текущая цена:{' '}
          {stock.currentPrice.toLocaleString('ru-RU', {
            style: 'currency',
            currency: 'USD',
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="quantity" className="text-sm font-medium">
          Количество
        </label>
        <input
          id="quantity"
          type="number"
          min={1}
          max={mode === 'sell' ? quantityInPortfolio : undefined}
          value={quantity}
          onChange={handleQuantityChange}
          disabled={isPending}
          className="
            w-full rounded-md border border-input bg-background px-3 py-2
            text-sm ring-offset-background
            focus-visible:ring-2 focus-visible:ring-ring
            focus-visible:ring-offset-2 focus-visible:outline-none
            disabled:cursor-not-allowed disabled:opacity-50
          "
        />
        {mode === 'sell' && (
          <div className="text-xs text-muted-foreground">
            Доступно для продажи: {quantityInPortfolio}
          </div>
        )}
      </div>

      <div className="rounded-md bg-muted p-3">
        <div className="text-sm text-muted-foreground">Итого к оплате:</div>
        <div className="text-xl font-bold">
          {totalCost.toLocaleString('ru-RU', {
            style: 'currency',
            currency: 'USD',
          })}
        </div>
        {mode === 'buy' && (
          <div className="text-xs text-muted-foreground">
            Доступно:{' '}
            {availableBalance.toLocaleString('ru-RU', {
              style: 'currency',
              currency: 'USD',
            })}
          </div>
        )}
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={closeTradeModal}
          disabled={isPending}
          className="flex-1"
        >
          Отмена
        </Button>
        <Button
          type="submit"
          disabled={!validation.isValid || isPending}
          className="flex-1"
        >
          {isPending ? 'Обработка...' : mode === 'buy' ? 'Купить' : 'Продать'}
        </Button>
      </div>
    </form>
  );
}
