import {PortfolioInfo} from '@/entities/portfolio';
import {StockTable} from '@/widgets/stock-table';
import {StockChart} from '@/widgets/stock-chart';
import {TradeModal} from '@/features/portfolio-trade';
import {usePriceUpdate} from '@/features/price-update';

export const DashboardPage: React.FC = () => {
  usePriceUpdate();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto space-y-4">
        <PortfolioInfo />
        <div
          className="
            grid gap-4
            lg:grid-cols-2
          "
        >
          <StockTable />
          <StockChart />
        </div>
        <TradeModal />
      </div>
    </div>
  );
};
