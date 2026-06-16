import type {Portfolio} from '@/shared/api';

export function selectAvailableBalance(
  portfolio: Portfolio | undefined,
): number {
  return portfolio?.availableBalance ?? 0;
}

export function selectTotalValue(portfolio: Portfolio | undefined): number {
  return portfolio?.totalValue ?? 0;
}

export function selectDailyChangePercent(
  portfolio: Portfolio | undefined,
): number {
  return portfolio?.dailyChangePercent ?? 0;
}

export function selectFormattedPortfolioValue(
  portfolio: Portfolio | undefined,
): string {
  const value = selectTotalValue(portfolio);
  return value.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function selectFormattedBalance(
  portfolio: Portfolio | undefined,
): string {
  const balance = selectAvailableBalance(portfolio);
  return balance.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
