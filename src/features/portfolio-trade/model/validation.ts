import type {Stock} from '@/shared/api';
import {formatPrice} from '@/shared/lib/format';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateQuantity(quantity: number): ValidationResult {
  if (!Number.isFinite(quantity)) {
    return {isValid: false, error: 'Введите корректное число'};
  }

  if (quantity <= 0) {
    return {isValid: false, error: 'Количество должно быть больше нуля'};
  }

  if (quantity % 1 !== 0) {
    return {isValid: false, error: 'Количество должно быть целым числом'};
  }

  return {isValid: true};
}

export function validateBuy(
  quantity: number,
  availableBalance: number,
  stock: Stock | undefined,
): ValidationResult {
  const quantityValidation = validateQuantity(quantity);
  if (!quantityValidation.isValid) {
    return quantityValidation;
  }

  if (!stock) {
    return {isValid: false, error: 'Акция не найдена'};
  }

  const totalCost = quantity * stock.currentPrice;

  if (totalCost > availableBalance) {
    return {
      isValid: false,
      error: `Недостаточно средств. Нужно: ${formatPrice(totalCost)}, доступно: ${formatPrice(availableBalance)}`,
    };
  }

  return {isValid: true};
}

export function validateSell(
  quantity: number,
  stock: Stock | undefined,
): ValidationResult {
  const quantityValidation = validateQuantity(quantity);
  if (!quantityValidation.isValid) {
    return quantityValidation;
  }

  if (!stock) {
    return {isValid: false, error: 'Акция не найдена'};
  }

  if (quantity > stock.quantityInPortfolio) {
    return {
      isValid: false,
      error: `Недостаточно акций. Доступно: ${stock.quantityInPortfolio}`,
    };
  }

  return {isValid: true};
}

export function calculateTotalCost(quantity: number, price: number): number {
  return quantity * price;
}
