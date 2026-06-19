import {test, expect} from '@playwright/test';
import {DashboardPage} from '../pages/DashboardPage';
import {getLastStock, INITIAL_BALANCE} from '../fixtures/test-data';

test.describe('Покупка акций', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({page}) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.setupMocks();
    await dashboardPage.goto();
  });

  test('пользователь покупает акцию и видит обновлённый баланс', async () => {
    const stock = getLastStock();
    const quantity = 5;
    const totalCost = stock.currentPrice * quantity;
    const expectedNewBalance = INITIAL_BALANCE - totalCost;

    await expect(dashboardPage.availableBalance).toBeVisible();
    await dashboardPage.expectBalanceEquals(INITIAL_BALANCE);

    await dashboardPage.selectStock(stock.ticker);

    await dashboardPage.openBuyModal(stock.ticker);

    await dashboardPage.fillQuantity(quantity);

    await expect(dashboardPage.submitButton).toBeEnabled();

    await dashboardPage.submitBuy();

    await expect(dashboardPage.modal).not.toBeVisible();

    await dashboardPage.expectBalanceEquals(expectedNewBalance);
    await dashboardPage.expectQuantityEquals(stock.ticker, quantity);
  });
});
