import {describe, expect, it, beforeEach, afterEach, vi} from 'vitest';
import {screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {TradeForm} from '@/features/portfolio-trade/ui/TradeForm';
import {useUIStore} from '@/shared/store';
import {
  renderWithProviders,
  createQueryClient,
  createStock,
  createPortfolio,
} from '@/tests/utils';
import type {Stock, TradeResponse} from '@/shared/api';

type MutateArgs = {ticker: string; quantity: number};
type MutateHandlers = {
  onSuccess: (data: TradeResponse) => void;
  onError: (error: Error) => void;
};
type MockMutate = ReturnType<typeof vi.fn<[MutateArgs, MutateHandlers], void>>;

const {mockBuyFn, mockSellFn} = vi.hoisted(() => {
  return {
    mockBuyFn: vi.fn<[MutateArgs, MutateHandlers], void>(),
    mockSellFn: vi.fn<[MutateArgs, MutateHandlers], void>(),
  };
});

vi.mock('@/features/portfolio-trade/api', () => ({
  useBuyStock: () => ({
    mutate: mockBuyFn,
    isPending: false,
  }),
  useSellStock: () => ({
    mutate: mockSellFn,
    isPending: false,
  }),
}));

function seedPortfolioCache(
  qc: ReturnType<typeof createQueryClient>,
  balance = 50000,
) {
  qc.setQueryData(['portfolio'], createPortfolio({availableBalance: balance}));
}

function renderTradeForm(
  stock: Stock | undefined,
  mode: 'buy' | 'sell' = 'buy',
  qc?: ReturnType<typeof createQueryClient>,
) {
  const queryClient = qc ?? createQueryClient();
  seedPortfolioCache(queryClient, 50000);
  return renderWithProviders(
    <TradeForm stock={stock} mode={mode} />,
    queryClient,
  );
}

function simulateSuccess(mockFn: MockMutate, response: TradeResponse) {
  mockFn.mockImplementation((_args, handlers) => {
    handlers.onSuccess(response);
  });
}

function simulateError(mockFn: MockMutate) {
  mockFn.mockImplementation((_args, handlers) => {
    handlers.onError(new Error('Network error'));
  });
}

describe('TradeForm', () => {
  const defaultStock = createStock();

  beforeEach(() => {
    useUIStore.setState({
      tradeModalOpen: true,
      tradeModalTicker: 'AAPL',
      tradeModalMode: 'buy',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('рендер: показывает тикер, название, цену', () => {
    renderTradeForm(defaultStock);
    expect(screen.getByText(/AAPL — Apple Inc\./)).toBeInTheDocument();
    expect(screen.getByText(/Текущая цена:/).parentElement).toHaveTextContent(
      /150,00/,
    );
  });

  it('расчёт «Итого к оплате»', async () => {
    const user = userEvent.setup();
    renderTradeForm(defaultStock);

    const input = screen.getByLabelText('Количество');
    await user.clear(input);
    await user.type(input, '3');

    expect(screen.getByText(/450,00/)).toBeInTheDocument();
  });

  it('успешная покупка: мутация с правильными данными', async () => {
    const user = userEvent.setup();
    simulateSuccess(mockBuyFn, {
      success: true,
      newBalance: 49700,
      newQuantity: 12,
    });

    renderTradeForm(defaultStock);

    const input = screen.getByLabelText('Количество');
    await user.clear(input);
    await user.type(input, '2');

    const submitButton = screen.getByRole('button', {name: /купить/i});
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockBuyFn).toHaveBeenCalledWith(
        {ticker: 'AAPL', quantity: 2},
        expect.objectContaining({onSuccess: expect.any(Function)}),
      );
    });
  });

  it('успешная покупка: closeTradeModal вызван', async () => {
    const user = userEvent.setup();
    simulateSuccess(mockBuyFn, {
      success: true,
      newBalance: 49700,
      newQuantity: 12,
    });

    renderTradeForm(defaultStock);

    const submitButton = screen.getByRole('button', {name: /купить/i});
    await user.click(submitButton);

    await waitFor(() => {
      expect(useUIStore.getState().tradeModalOpen).toBe(false);
    });
  });

  it('недостаточный баланс: кнопка disabled', () => {
    const qc = createQueryClient();
    seedPortfolioCache(qc, 100);
    const expensiveStock = createStock({currentPrice: 150});

    renderWithProviders(<TradeForm stock={expensiveStock} mode="buy" />, qc);

    const submitButton = screen.getByRole('button', {name: /купить/i});
    expect(submitButton).toBeDisabled();
  });

  it('ввод 0: кнопка disabled', async () => {
    const user = userEvent.setup();
    renderTradeForm(defaultStock);

    const input = screen.getByLabelText('Количество');
    await user.clear(input);
    await user.type(input, '0');

    const submitButton = screen.getByRole('button', {name: /купить/i});
    expect(submitButton).toBeDisabled();
  });

  it('sell mode: показывает «Доступно для продажи»', () => {
    renderTradeForm(createStock({quantityInPortfolio: 5}), 'sell');
    expect(screen.getByText(/Доступно для продажи: 5/)).toBeInTheDocument();
  });

  it('sell mode: превышение количества → disabled', async () => {
    const user = userEvent.setup();
    renderTradeForm(createStock({quantityInPortfolio: 3}), 'sell');

    const input = screen.getByLabelText('Количество');
    await user.clear(input);
    await user.type(input, '5');

    const submitButton = screen.getByRole('button', {name: /продать/i});
    expect(submitButton).toBeDisabled();
  });

  it('ошибка мутации → сообщение об ошибке', async () => {
    const user = userEvent.setup();
    simulateError(mockBuyFn);

    renderTradeForm(defaultStock);

    const submitButton = screen.getByRole('button', {name: /купить/i});
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Ошибка при выполнении операции'),
      ).toBeInTheDocument();
    });
  });

  it('stock=undefined → fallback', () => {
    renderTradeForm(undefined);
    expect(screen.getByText('Акция не найдена')).toBeInTheDocument();
  });

  it('кнопка «Отмена» закрывает модал', async () => {
    const user = userEvent.setup();
    renderTradeForm(defaultStock);

    const cancelButton = screen.getByRole('button', {name: /отмена/i});
    await user.click(cancelButton);

    expect(useUIStore.getState().tradeModalOpen).toBe(false);
  });
});
