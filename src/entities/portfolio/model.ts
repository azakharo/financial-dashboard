import type {Portfolio} from '@/shared/api';
import {formatPrice} from '@/shared/lib/format';

export function selectAvailableBalance(
  portfolio: Portfolio | undefined,
): number {
  return portfolio?.availableBalance ?? 0;
}

export function selectTotalValue(portfolio: Portfolio | undefined): number {
  return portfolio?.totalValue ?? 0;
}

export function selectFormattedPortfolioValue(
  portfolio: Portfolio | undefined,
): string {
  const value = selectTotalValue(portfolio);
  return formatPrice(value);
}

export function selectFormattedBalance(
  portfolio: Portfolio | undefined,
): string {
  const balance = selectAvailableBalance(portfolio);
  return formatPrice(balance);
}
