# План тестирования — Этап 9

## Зависимости

```bash
npm i -D -E vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw @vitest/coverage-v8 @playwright/test
npx playwright install
```

## Конфигурация

- `vitest.config.ts` — отдельный конфиг (не в vite.config.ts), jsdom environment, path alias `@/`, setupFiles
- `src/test/setup.ts` — `@testing-library/jest-dom` import
- Скрипты в `package.json`: `test:watch` (watch), `test` (single run), `test:coverage` (coverage HTML)

---

## 9.1 Unit тесты

| Файл                                                        | Что тестируется                                                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/api/__tests__/websocket.test.ts`                | `parseWSMessage`, `toWSPriceUpdate`, `applyPriceUpdates` — чистые функции из websocket.ts                                             |
| `src/entities/stock/__tests__/model.test.ts`                | `selectStockByTicker`, `selectTotalPortfolioValue`, `selectStocksBySector`, `selectStocksSortedByTicker`, `selectStocksSortedByPrice` |
| `src/features/portfolio-trade/__tests__/validation.test.ts` | `validateQuantity`, `validateBuy`, `validateSell`, `calculateTotalCost` — все ветки                                                   |
| `src/entities/portfolio/__tests__/model.test.ts`            | `selectAvailableBalance`, `selectTotalValue`, `selectDailyChangePercent`, `selectFormattedPortfolioValue`, `selectFormattedBalance`   |
| `src/entities/price-history/__tests__/model.test.ts`        | `selectLatestPrice`, `selectMinPrice`, `selectMaxPrice`, `selectPriceRange`, `selectPricePointsByTimeframe`, `selectChartData`        |
| `src/shared/lib/__tests__/format.test.ts`                   | `formatPrice`, `formatPercent`, `formatLargeNumber`, `formatQuantity`                                                                 |
| `src/shared/store/__tests__/uiStore.test.ts`                | Все actions Zustand store                                                                                                             |

## 9.2 Integration тесты

| Файл                                                        | Что тестируется                                                                                    |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/shared/api/__tests__/usePriceFeed.test.ts`             | Хук `usePriceFeed` — MockWebSocket, проверка buffer+throttle обновляет queryClient кеш             |
| `src/features/portfolio-trade/__tests__/TradeForm.test.tsx` | Форма покупки: ввод quantity, валидация баланса, вызов мутации с правильными данными. MSW для REST |
| `src/widgets/stock-table/__tests__/StockTable.test.tsx`     | Рендер таблицы с виртуализацией, отображение данных акций. MSW                                     |

## 9.3 E2E тест (Playwright)

| Файл                          | Что тестируется                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `e2e/pages/DashboardPage.ts`  | Page Object: selectors для портфеля, таблицы, модалки                                             |
| `e2e/tests/buy-stock.spec.ts` | Сценарий: вход → выбор акции → покупка → проверка баланса и количества. Моки через `page.route()` |

## Решения

- WS тесты: `applyPriceUpdates` (unit) + `usePriceFeed` (integration, MockWebSocket)
- Coverage: HTML-отчёт через `@vitest/coverage-v8`
- Integration моки: MSW
- E2E: только buy-stock.spec.ts
