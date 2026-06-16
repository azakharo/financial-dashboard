import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {useStocks} from '@/entities/stock';
import type {Stock} from '@/shared/api';
import {useUIStore} from '@/shared/store';

import {TradeForm} from './TradeForm';

function flattenPages(
  data: ReturnType<typeof useStocks>['data'],
): Stock[] | undefined {
  if (!data) return undefined;
  return data.pages.flatMap(page => page.stocks);
}

export function TradeModal() {
  const tradeModalOpen = useUIStore(s => s.tradeModalOpen);
  const tradeModalTicker = useUIStore(s => s.tradeModalTicker);
  const tradeModalMode = useUIStore(s => s.tradeModalMode);
  const closeTradeModal = useUIStore(s => s.closeTradeModal);

  const {data: stocksData} = useStocks();
  const stocks = flattenPages(stocksData);
  const selectedStock = stocks?.find(s => s.ticker === tradeModalTicker);

  const title = tradeModalMode === 'buy' ? 'Покупка акций' : 'Продажа акций';

  return (
    <Dialog
      open={tradeModalOpen}
      onOpenChange={open => !open && closeTradeModal()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <TradeForm stock={selectedStock} mode={tradeModalMode} />
      </DialogContent>
    </Dialog>
  );
}
