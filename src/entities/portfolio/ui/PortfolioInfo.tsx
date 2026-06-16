import {
  usePortfolio,
  selectFormattedPortfolioValue,
  selectFormattedBalance,
} from '../index';

export const PortfolioInfo: React.FC = () => {
  const {data: portfolio, isLoading, error} = usePortfolio();

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="animate-pulse">
          <div className="mb-2 h-4 w-1/2 rounded-sm bg-gray-200"></div>
          <div className="h-4 w-1/3 rounded-sm bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="rounded-lg bg-white p-4 text-red-600 shadow-sm">
        Ошибка загрузки портфеля
      </div>
    );
  }

  const changeClass =
    portfolio.dailyChangePercent >= 0 ? 'text-green-600' : 'text-red-600';
  const changeSign = portfolio.dailyChangePercent >= 0 ? '+' : '';

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="mb-1 text-sm text-gray-500">Стоимость портфеля</div>
          <div className="text-xl font-bold" data-testid="portfolio-value">
            {selectFormattedPortfolioValue(portfolio)}
          </div>
        </div>
        <div>
          <div className="mb-1 text-sm text-gray-500">Доступный баланс</div>
          <div className="text-xl font-bold" data-testid="available-balance">
            {selectFormattedBalance(portfolio)}
          </div>
        </div>
        <div>
          <div className="mb-1 text-sm text-gray-500">Изменение за день</div>
          <div
            className={`
              text-xl font-bold
              ${changeClass}
            `}
            data-testid="daily-change"
          >
            {changeSign}
            {portfolio.dailyChangePercent.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
};
