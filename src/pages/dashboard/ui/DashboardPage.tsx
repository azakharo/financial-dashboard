import {PortfolioInfo} from '@/entities/portfolio';
import {StockTable} from '@/widgets/stock-table';
import {StockChart} from '@/widgets/stock-chart';
import {TradeModal} from '@/features/portfolio-trade';

export const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl space-y-4">
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
