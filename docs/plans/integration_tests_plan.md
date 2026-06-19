# Интеграционные тесты — Этап 9.2

## Предустановка

```bash
npm i -D -E msw @testing-library/user-event
npx msw init public --save
```

## Общая инфраструктура

### `src/tests/server.ts`

MSW server для Vitest:

```ts
import { setupServer } from 'msw/node';

export const server = setupServer();
```

### `src/tests/setup.ts` — дополнение

Добавить запуск/остановку MSW server:

```ts
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### `src/tests/utils.tsx`

Общий wrapper и хелперы:

```ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import type { Stock, PaginatedResponse, Portfolio } from '@/shared/api';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
  };
}

export function renderWithProviders(
  ui: React.ReactElement,
  queryClient?: QueryClient,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const qc = queryClient ?? createQueryClient();
  return render(ui, { wrapper: createWrapper(qc), ...options });
}

// Фабрики тестовых данных

export function createStock(overrides: Partial<Stock> = {}): Stock {
  return {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    currentPrice: 150.0,
    priceChange24h: 2.5,
    quantityInPortfolio: 10,
    ...overrides,
  };
}

export function createPage(
  stocks: Stock[] = [createStock()],
  overrides: Partial<PaginatedResponse<Stock>> = {},
): PaginatedResponse<Stock> {
  return {
    stocks,
    nextCursor: null,
    hasMore: false,
    ...overrides,
  };
}

export function createPortfolio(
  overrides: Partial<Portfolio> = {},
): Portfolio {
  return {
    totalValue: 100000,
    availableBalance: 50000,
    dailyChangePercent: 1.5,
    ...overrides,
  };
}
```

---

## Тест 1: `src/shared/api/__tests__/usePriceFeed.test.ts`

### Цель

Проверить полный цикл: WS-сообщение → buffer → throttle (2000ms) → queryClient cache update.

### Подход

- `vi.mock('react-use-websocket')` — захват `onMessage` колбэка
- `vi.useFakeTimers()` — управление throttle
- Предзаполнить `queryClient.setQueryData(['stocks', {sector, search}])`
- Проверять кеш через `queryClient.getQueryData`

### Мок react-use-websocket

```ts
let capturedOnMessage: ((event: MessageEvent) => void) | null = null;

vi.mock('react-use-websocket', () => ({
  default: vi.fn((_url: string, options: { onMessage: (e: MessageEvent) => void }) => {
    capturedOnMessage = options.onMessage;
    return {
      sendJsonMessage: vi.fn(),
      lastMessage: null,
      readyState: 1,
    };
  }),
  ReadyState: { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 },
}));
```

### Хелпер: симуляция WS-сообщения

```ts
function sendWSMessage(updates: Array<{ ticker: string; price: number; timestamp: string }>) {
  capturedOnMessage!(
    new MessageEvent('message', { data: JSON.stringify(updates) }),
  );
}
```

### Хелпер: предзаполнение кеша

```ts
function seedStocksCache(qc: QueryClient, stocks: Stock[]) {
  qc.setQueryData(['stocks', { sector: undefined, search: undefined }], {
    pages: [createPage(stocks)],
    pageParams: [undefined],
  });
}

function seedHistoryCache(qc: QueryClient, ticker: string, points: PricePoint[]) {
  qc.setQueryData(['stockHistory', ticker, '1D'], points);
}
```

### Тест-кейсы

| # | Название | Шаги | Ожидание |
|---|----------|------|----------|
| 1 | Одно WS-сообщение обновляет кеш после throttle | seedStocksCache(AAPL price=150) → sendWSMessage(AAPL=155) → advance 2000ms | `getQueryData` содержит AAPL с currentPrice=155 |
| 2 | Батчинг: несколько сообщений за throttle-окно | seedStocksCache(AAPL=150, MSFT=300) → sendWSMessage(AAPL=152) → sendWSMessage(AAPL=155, MSFT=310) → advance 2000ms | AAPL=155 (последнее), MSFT=310 |
| 3 | WS-сообщение обновляет историю графика при selectedTicker + 1D | seedHistoryCache(AAPL, [...]) → setStore({selectedTicker:'AAPL', chartTimeframe:'1D'}) → sendWSMessage(AAPL=155) → advance 2000ms | `getQueryData(['stockHistory','AAPL','1D'])` содержит новую точку |
| 4 | История НЕ обновляется при timeframe !== 1D | seedHistoryCache(AAPL) → setStore({selectedTicker:'AAPL', chartTimeframe:'1W'}) → sendWSMessage(AAPL=155) → advance 2000ms | Кеш истории не изменился (та же ссылка) |
| 5 | Unmount отменяет throttle | renderHook → sendWSMessage → unmount → advance 2000ms | Кеш не обновлён |
| 6 | Пустой buffer не трогает кеш (structural sharing) | seedStocksCache → advance 2000ms (без WS-сообщений) | `getQueryData` возвращает ту же ссылку |
| 7 | Сообщения с неизвестным тикером не ломают кеш | seedStocksCache(AAPL) → sendWSMessage(UNKNOWN=999) → advance 2000ms | AAPL без изменений, нет ошибок |

---

## Тест 2: `src/features/portfolio-trade/__tests__/TradeForm.test.tsx`

### Цель

Форма покупки/продажи: ввод, валидация, мутация, обработка результата.

### Подход

- MSW `http.post('/api/portfolio/buy')` / `http.post('/api/portfolio/sell')` — контроль ответов
- Предзаполнить `queryClient.setQueryData(['portfolio'])` для `usePortfolio()`
- `@testing-library/user-event` — реалистичный ввод
- Проверять через DOM + store state

### MSW handlers (внутри тестов)

```ts
import { http, HttpResponse } from 'msw';

// Успешная покупка
server.use(
  http.post('/api/portfolio/buy', async ({ request }) => {
    const body = await request.json() as { ticker: string; quantity: number };
    return HttpResponse.json({
      success: true,
      newBalance: 50000 - body.quantity * 150,
      newQuantity: 10 + body.quantity,
    });
  }),
);

// Ошибка сервера
server.use(
  http.post('/api/portfolio/buy', () => HttpResponse.error()),
);
```

### Предзаполнение кеша

```ts
function seedPortfolioCache(qc: QueryClient, balance = 50000) {
  qc.setQueryData(['portfolio'], createPortfolio({ availableBalance: balance }));
}
```

### Тест-кейсы

| # | Название | Шаги | Ожидание |
|---|----------|------|----------|
| 1 | Рендер: показывает тикер, название, цену | render TradeForm(stock=AAPL, mode='buy') | В DOM: "AAPL — Apple Inc.", цена "$150,00" |
| 2 | Расчёт «Итого к оплате» | Ввести quantity=3 | "Итого к оплате: $450,00" |
| 3 | Успешная покупка: мутация с правильными данными | balance=50000, ввести 2, клик «Купить» | MSW перехватил POST {ticker:"AAPL", quantity:2} |
| 4 | Успешная покупка: closeTradeModal вызван | Клик «Купить» → мутация success | `useUIStore.getState().tradeModalOpen === false` |
| 5 | Недостаточный баланс: кнопка disabled | stock.price=150, balance=100, ввести 1 | Кнопка «Купить» disabled |
| 6 | Ввод 0: кнопка disabled | Очистить поле, ввести 0 | Кнопка disabled |
| 7 | Sell mode: показывает «Доступно для продажи» | render mode='sell', stock.quantityInPortfolio=5 | Текст "Доступно для продажи: 5" |
| 8 | Sell mode: превышение количества → disabled | stock.quantityInPortfolio=3, ввести 5 | Кнопка «Продать» disabled |
| 9 | Ошибка мутации → сообщение об ошибке | MSW возвращает ошибку → клик «Купить» | Текст "Ошибка при выполнении операции" |
| 10 | stock=undefined → fallback | render TradeForm(stock=undefined) | Текст "Акция не найдена" |
| 11 | Кнопка «Отмена» закрывает модал | Клик «Отмена» | `useUIStore.getState().tradeModalOpen === false` |

---

## Тест 3: `src/widgets/stock-table/__tests__/StockTable.test.tsx`

### Цель

Виджет таблицы: рендер с виртуализацией, взаимодействие с фильтрами, клики по рядам и кнопкам.

### Подход

- MSW `http.get('/api/stocks')` — возвращает страницу акций
- `vi.mock('@/shared/api/websocket')` — мок `usePriceFeed` (WS не нужен)
- `vi.useFakeTimers()` — для debounce поиска (500ms)
- Рендер `StockTable` целиком через `renderWithProviders`

### MSW handler

```ts
const mockStocks = [
  createStock({ ticker: 'AAPL', name: 'Apple Inc.', quantityInPortfolio: 10 }),
  createStock({ ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', currentPrice: 300, quantityInPortfolio: 0 }),
  createStock({ ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', currentPrice: 170, quantityInPortfolio: 5 }),
];

server.use(
  http.get('/api/stocks', () =>
    HttpResponse.json(createPage(mockStocks)),
  ),
);
```

### Мок usePriceFeed

```ts
vi.mock('@/shared/api/websocket', () => ({
  usePriceFeed: vi.fn(() => ({ isConnected: true, readyState: 1 })),
}));
```

### Тест-кейсы

| # | Название | Шаги | Ожидание |
|---|----------|------|----------|
| 1 | Рендер: отображает акции в виртуальной таблице | render StockTable, waitFor | `data-testid="stock-row-AAPL"` и другие в DOM |
| 2 | Клик по ряду → selectedTicker обновлён | Клик по AAPL row | `useUIStore.getState().selectedTicker === 'AAPL'` |
| 3 | Клик «Купить» → openTradeModal(buy) | Клик кнопку «Купить» в AAPL row | `tradeModalOpen=true, tradeModalTicker='AAPL', tradeModalMode='buy'` |
| 4 | Клик «Продать» → openTradeModal(sell) | Клик «Продать» в JNJ row (qty=5) | `tradeModalMode='sell', tradeModalTicker='JNJ'` |
| 5 | Нет кнопки «Продать» при qty=0 | Проверить MSFT row | Кнопка «Продать» отсутствует |
| 6 | Фильтр по сектору | Клик Badge "Healthcare" | `sectorFilter === 'Healthcare'` |
| 7 | Поиск по тикеру | Ввести "AAP" в search → advance 500ms | `searchQuery === 'AAP'` |
| 8 | Пустые результаты → fallback | MSW возвращает пустую страницу | Текст "Акции не найдены" |
| 9 | Loading state | MSW задержка ответа | Текст "Загрузка акций..." |
| 10 | «Загрузить ещё» при hasMore | MSW возвращает страницу с hasMore=true | Кнопка «Загрузить ещё» visible |

---

## Порядок реализации

1. Установить зависимости (`msw`, `@testing-library/user-event`, `npx msw init`)
2. Создать `src/tests/server.ts`
3. Обновить `src/tests/setup.ts` — добавить MSW server lifecycle
4. Создать `src/tests/utils.tsx` — wrapper, фабрики, renderWithProviders
5. `usePriceFeed.test.ts` — 7 кейсов
6. `TradeForm.test.tsx` — 11 кейсов
7. `StockTable.test.tsx` — 10 кейсов
8. Запустить `npm run test:coverage`, проверить порог 85%
