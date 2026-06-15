# План реализации: Financial Dashboard

## Этап 1: Mock Server (3-4 часа)

### 1.1 Зависимости

```
npm i -S -E express ws cors uuid
npm i -D -E @types/express @types/ws @types/cors concurrently
```

### 1.2 Структура

```
mock-server/
├── index.ts              # Entry point (Express + ws)
├── data/
│   ├── stocks.ts         # 10,000+ акций (faker)
│   ├── portfolio.ts      # Начальный портфель
│   ├── history.ts        # История цен
│   └── presets.ts        # Конфигурации пресетов
├── routes/
│   ├── stocks.ts         # GET /api/stocks (cursor pagination)
│   ├── portfolio.ts      # GET /api/portfolio, POST buy/sell
│   └── history.ts        # GET /api/stocks/:ticker/history
└── websocket/
    └── price-feed.ts     # WebSocket broadcaster (50ms)
```

### 1.3 Endpoints (по ADR)

- `GET /api/health` — health check для проверки сервера
- `GET /api/stocks?cursor&limit&sector&search`
- `GET /api/stocks/:ticker/history?timeframe`
- `GET /api/portfolio`
- `POST /api/portfolio/buy`
- `POST /api/portfolio/sell`
- `WebSocket /ws` — трансляция цен каждые 50ms

### 1.4 Test Data Seeding

**Секторы рынка (6):**

- Technology
- Healthcare
- Finance
- Consumer
- Energy
- Industrial

**Пресеты (выбор через `DATA_PRESET` env):**

| Пресет    | Баланс  | Акции в портфеле                   | Применение                  |
| --------- | ------- | ---------------------------------- | --------------------------- |
| `default` | $50,000 | 5-10 случайных (10-100 шт. каждой) | Основная разработка         |
| `empty`   | $50,000 | 0                                  | Тестирование первой покупки |

**Исторические данные:**

- Глубина: 1 год назад от текущей даты
- Точки генерируются в зависимости от таймфрейма:
  - 1D: данные за 24 часа
  - 1W: данные за 7 дней
  - 1M: данные за 30 дней
  - 1Y: данные за год

Запуск: `DATA_PRESET=default npm run dev:server` (по умолчанию `default`)

### 1.5 Конфигурация

- Vite proxy: `/api` → `http://localhost:3001`, `/ws` → `ws://localhost:3001`
- npm scripts: `dev:server`, `dev:all` (concurrently)

### 1.6 Критерии проверки

**Ручная проверка через httpie:**

```bash
# Health check
http GET http://localhost:3001/api/health

# Получить первую страницу акций
http GET http://localhost:3001/api/stocks limit==10

# Получить портфель
http GET http://localhost:3001/api/portfolio

# Купить акцию
http POST http://localhost:3001/api/portfolio/buy ticker=AAPL quantity=10

# Получить историю
http GET http://localhost:3001/api/stocks/AAPL/history timeframe==1D
```

**Автоматическая проверка:**

- Скрипт `mock-server/check-server.ts` — запускает все проверки и выводит результат
- Команда `npm run check:server` — выполняет проверку
- Возвращает exit code 0 если все проверки пройдены

---

## Этап 2: Shared Layer (2-3 часа)

### 2.1 Типы

```
src/shared/api/types.ts
```

- Stock, PricePoint, Portfolio, WSPriceUpdate
- PaginatedResponse

### 2.2 API клиент

```
src/shared/api/
├── client.ts          # ky instance с base URL
├── stocks.ts          # Запросы к /api/stocks
├── portfolio.ts       # Запросы к /api/portfolio
└── websocket.ts       # WebSocket hook + throttle buffer
```

### 2.3 Утилиты

```
src/shared/lib/
├── format.ts          # Форматирование цен, процентов
├── date.ts            # date-fns wrappers
└── cn.ts              # tailwind-merge helper (уже есть utils.ts)
```

---

## Этап 3: App Layer (1-2 часа)

### 3.1 Провайдеры

```
src/app/providers/
├── QueryProvider.tsx   # Tanstack Query + QueryClient
└── index.ts
```

### 3.2 Роутер

```
src/app/router/
└── router.tsx          # React Router, пока только /
```

---

## Этап 4: Entities Layer (3-4 часа)

### 4.1 Stock entity

```
src/entities/stock/
├── api.ts              # useStocks (useInfiniteQuery)
├── model.ts            # selectors для stocks
└── ui/
    └── StockRow.tsx     # Одна строка таблицы (memo)
```

### 4.2 Portfolio entity

```
src/entities/portfolio/
├── api.ts              # usePortfolio
├── model.ts            # selectors
└── ui/
    └── PortfolioInfo.tsx
```

### 4.3 Price History entity

```
src/entities/price-history/
├── api.ts              # useStockHistory(ticker, timeframe)
└── model.ts
```

---

## Этап 5: Client State — Zustand (1 час)

### 5.1 UI Store

```
src/shared/store/
└── uiStore.ts
```

- selectedTicker
- tradeModalOpen, tradeModalTicker, tradeModalMode
- sectorFilter, searchQuery
- chartTimeframe

---

## Этап 6: Features Layer (2-3 часа)

### 6.1 Portfolio Trade

```
src/features/portfolio-trade/
├── api.ts              # useBuyStock, useSellStock (mutations)
├── ui/
│   ├── TradeModal.tsx  # Модальное окно
│   └── TradeForm.tsx   # Форма с валидацией
└── model/
    └── validation.ts   # Проверка баланса
```

---

## Этап 7: Widgets Layer (4-5 часов)

### 7.1 Stock Table Widget

```
src/widgets/stock-table/
├── ui/
│   ├── StockTable.tsx      # Контейнер
│   ├── StockTableBody.tsx  # Виртуализированный список
│   ├── StockRow.tsx        # Строка (из entities)
│   └── TableFilters.tsx    # Секторы + поиск
└── hooks/
    └── useVirtualScroll.ts
```

**Ключевые оптимизации:**

- `@tanstack/react-virtual` для виртуализации
- `react-use-websocket` + throttle buffer для WS
- `structuralSharing: true` в React Query
- `React.memo` для StockRow с comparison по ticker

### 7.2 Stock Chart Widget

```
src/widgets/stock-chart/
├── ui/
│   ├── StockChart.tsx      # Recharts container
│   └── TimeframeSelector.tsx
└── hooks/
    └── useChartUpdates.ts  # Слияние REST + WS данных
```

---

## Этап 8: Pages Layer (1-2 часа)

### 8.1 Dashboard Page

```
src/pages/dashboard/
├── ui/
│   └── DashboardPage.tsx
└── index.ts
```

**Композиция:**

- PortfolioInfo (entities)
- StockTable (widget)
- StockChart (widget)
- TradeModal (feature)

---

## Этап 9: Testing (4-6 часов)

### 9.1 Unit тесты (Vitest)

```
src/shared/api/__tests__/websocket.test.ts
src/entities/stock/__tests__/model.test.ts
src/features/portfolio-trade/__tests__/validation.test.ts
```

### 9.2 Integration тесты (RTL + MSW)

```
src/widgets/stock-table/__tests__/StockTable.test.tsx
src/features/portfolio-trade/__tests__/TradeForm.test.tsx
```

### 9.3 E2E тесты (Playwright)

```
e2e/
├── pages/
│   └── DashboardPage.ts   # POM
└── tests/
    └── buy-stock.spec.ts
```

---

## Этап 10: CI/CD (1 час)

### 10.1 GitHub Actions

```
.github/workflows/ci.yml
```

- `npm run ts`
- `npm run lint`
- `npm run build`
- `npm run test:run`
- Playwright tests

---

## Итого: ~20-25 часов

---

## Порядок выполнения

1. **Mock Server** — независимый, можно разрабатывать и тестировать отдельно
2. **Shared Layer** — базовые типы и утилиты, нужны всем остальным слоям
3. **App Layer** — провайдеры и роутер, чтобы приложение запускалось
4. **Entities** — работа с данными через React Query
5. **Zustand Store** — UI состояние
6. **Features** — бизнес-операции (покупка/продажа)
7. **Widgets** — компоновка entities и features в виджеты
8. **Pages** — финальная сборка страницы
9. **Testing** — можно писать параллельно с разработкой
10. **CI/CD** — финальная настройка
