import type {Locator, Page} from '@playwright/test';
import {expect} from '@playwright/test';
import {mockStocks, mockPortfolio, INITIAL_BALANCE, type Stock, type Portfolio} from '../fixtures/test-data';

interface TestState {
  stocks: Stock[];
  portfolio: Portfolio;
}

export class DashboardPage {
  readonly page: Page;
  readonly portfolioValue: Locator;
  readonly availableBalance: Locator;
  readonly dailyChange: Locator;
  readonly modal: Locator;
  readonly quantityInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  private state: TestState;

  constructor(page: Page) {
    this.page = page;
    this.portfolioValue = page.getByTestId('portfolio-value');
    this.availableBalance = page.getByTestId('available-balance');
    this.dailyChange = page.getByTestId('daily-change');
    this.modal = page.getByRole('dialog');
    this.quantityInput = page.getByLabel('Количество');
    this.submitButton = this.modal.getByRole('button', {name: 'Купить'});
    this.cancelButton = this.modal.getByRole('button', {name: 'Отмена'});
    this.state = {
      stocks: mockStocks.map(s => ({...s})),
      portfolio: {...mockPortfolio},
    };
  }

  stockRow(ticker: string): Locator {
    return this.page.getByTestId(`stock-row-${ticker}`);
  }

  buyButton(ticker: string): Locator {
    return this.stockRow(ticker).getByRole('button', {name: 'Купить'});
  }

  async goto() {
    await this.page.goto('/');
  }

  async selectStock(ticker: string) {
    await this.stockRow(ticker).click();
  }

  async openBuyModal(ticker: string) {
    await this.buyButton(ticker).click();
    await expect(this.modal).toBeVisible();
  }

  async fillQuantity(quantity: number) {
    await this.quantityInput.fill(quantity.toString());
  }

  async submitBuy() {
    await this.submitButton.click();
  }

  async expectBalanceEquals(expected: number) {
    const formatted = expected.toLocaleString('ru-RU', {
      style: 'currency',
      currency: 'USD',
    });
    await expect(this.availableBalance).toContainText(formatted);
  }

  async expectQuantityEquals(ticker: string, expected: number) {
    const row = this.stockRow(ticker);
    const quantityCell = row.locator('div').nth(4);
    await expect(quantityCell).toContainText(expected.toLocaleString('ru-RU'));
  }

  async setupMocks() {
    await this.page.route('**/api/stocks', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          stocks: this.state.stocks,
          nextCursor: null,
          hasMore: false,
        }),
      });
    });

    await this.page.route('**/api/portfolio', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(this.state.portfolio),
      });
    });

    await this.page.route('**/api/portfolio/buy', async route => {
      const request = route.request();
      const body = request.postDataJSON();
      const {ticker, quantity} = body;
      const stock = this.state.stocks.find(s => s.ticker === ticker);

      if (!stock) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Stock not found',
          }),
        });
        return;
      }

      const totalCost = stock.currentPrice * quantity;
      
      if (totalCost > this.state.portfolio.availableBalance) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Insufficient balance',
          }),
        });
        return;
      }

      this.state.portfolio.availableBalance -= totalCost;
      stock.quantityInPortfolio += quantity;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          newBalance: this.state.portfolio.availableBalance,
          newQuantity: stock.quantityInPortfolio,
        }),
      });
    });

    await this.page.route('**/api/stocks/*/history*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await this.page.route('**/ws', async route => {
      await route.abort();
    });
  }
}
