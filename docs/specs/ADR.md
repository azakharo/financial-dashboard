# Architecture Decision Record (ADR)

## 1. Технологический стек

### 1.1 Фреймворк и окружение

| Компонент    | Решение           | Обоснование                           |
| ------------ | ----------------- | ------------------------------------- |
| React        | 19                | Указано в AGENTS.md                   |
| TypeScript   | Строгая типизация | Требование PRD, без `any`             |
| Vite         | Сборщик           | Требование PRD                        |
| Tailwind CSS | Стилизация        | Требование PRD                        |
| shadcn/ui    | UI компоненты     | Указано в AGENTS.md, radix-nova style |

### 1.2 Библиотеки

| Назначение                     | Библиотека              | Обоснование                                                                |
| ------------------------------ | ----------------------- | -------------------------------------------------------------------------- |
| Управление состоянием (server) | Tanstack Query v5       | Кеширование, рефетчинг, бесконечный скролл, интеграция с WebSocket         |
| Управление состоянием (client) | Zustand                 | Требование PRD. UI state: selectedTicker, modalState, filters, searchQuery |
| Виртуализация таблицы          | @tanstack/react-virtual | Гибкий headless подход, совместимость с Tanstack Query                     |
| Графики                        | Recharts                | Указано пользователем. Поддержка анимации через `isAnimationActive`        |
| Работа с датами                | date-fns                | Указано в react_rules.md                                                   |
| WebSocket                      | react-use-websocket     | React hook API, авто-реконнект, share-режим, message queue                 |
| Throttle/batch обновлений      | lodash                  | Проверенная реализация, tree-shaking                                      |

---

## 2. Архитектура FSD

```
src/
├── app/                     # Инициализация приложения
│   ├── providers/          # React Query, Theme провайдеры
│   └── router/             # Маршрутизация
├── pages/
│   └── dashboard/          # Главная страница
├── widgets/
│   ├── stock-table/        # Виджет таблицы акций
│   └── stock-chart/        # Виджет графика
├── features/
│   └── portfolio-trade/    # Фича покупки/продажи акций
├── entities/
│   ├── stock/              # Сущность акции
│   ├── portfolio/          # Сущность портфеля
│   └── price-history/      # Сущность истории цен
└── shared/
    ├── ui/                 # shadcn компоненты
    ├── api/                # API клиент, WebSocket менеджер
    └── lib/                # Утилиты, форматтеры
```

---

## 3. Управление состоянием

### 3.1 Разделение ответственности

**Tanstack Query — серверное состояние:**

- Данные акций (постраничная загрузка)
- Исторические данные для графиков
- Данные портфеля
- WebSocket обновления через `queryClient.setQueryData`

**Zustand — клиентское состояние:**

```typescript
interface UIState {
  selectedTicker: string | null;
  tradeModalOpen: boolean;
  tradeModalTicker: string | null;
  tradeModalMode: 'buy' | 'sell';
  sectorFilter: string | null;
  searchQuery: string;
  chartTimeframe: '1D' | '1W' | '1M' | '1Y';
}
```

### 3.2 Интеграция WebSocket с React Query

```
WebSocket (50ms) → Buffer → Throttle (100-150ms) → queryClient.setQueryData
                                                              ↓
                                          React Query cache update
                                                              ↓
                                          Компоненты (через useQuery)
```

**Ключевые оптимизации:**

- Батчинг обновлений: собираем обновления за 100-150ms, применяем разом
- `structuralSharing: true` в React Query — минимизация ре-рендеров
- Виртуализация — рендер только видимых строк

---

## 4. WebSocket архитектура

### 4.1 Стратегия подписки

**Решение:** Одна подписка на все акции без фильтрации.

**Обоснование:**

- Упрощает логику: нет subscribe/unsubscribe при скролле
- Упрощает тестирование: одно соединение
- Реальный бэкенд может не поддерживать подписку на конкретные тикеры
- Клиентский батчинг обеспечивает 60 FPS

**Отступление от PRD:** PRD упоминает "WebSocket-подписки" (множественное число). Мы используем одну подписку как более простое и надёжное решение.

### 4.2 Управление соединением

**react-use-websocket hook:**

```typescript
const { lastMessage, readyState, sendJsonMessage } = useWebSocket(WS_URL, {
  share: true,
  shouldReconnect: () => true,
  reconnectInterval: 3000,
  reconnectAttempts: 10,
  onOpen: () => console.log('Connected'),
  onClose: () => console.log('Disconnected'),
});

const isReady = readyState === ReadyState.OPEN;
```

**Throttle + Buffer паттерн:**

```typescript
const buffer = useRef<Map<string, WSPriceUpdate>>(new Map());

const throttledFlush = throttle(() => {
  const updates = Array.from(buffer.current.values());
  buffer.current.clear();
  queryClient.setQueryData(['stocks'], (old: Stock[]) => 
    applyUpdates(old, updates)
  );
}, 100);

const handleMessage = (message: MessageEvent) => {
  const update = JSON.parse(message.data);
  buffer.current.set(update.ticker, update);
  throttledFlush();
};
```

---

## 5. API структура

### 5.1 REST API (Mock Server)

```
GET /api/stocks
  ?cursor={cursorId}
  &limit={limit}
  &sector={sector}
  &search={query}
Response: {
  stocks: Stock[],
  nextCursor: string | null,
  hasMore: boolean
}

GET /api/stocks/{ticker}/history?timeframe={1D|1W|1M|1Y}
Response: PricePoint[]

GET /api/portfolio
Response: Portfolio

POST /api/portfolio/buy
Body: { ticker: string, quantity: number }
Response: { success: boolean, newBalance: number, newQuantity: number }

POST /api/portfolio/sell
Body: { ticker: string, quantity: number }
Response: { success: boolean, newBalance: number, newQuantity: number }

WebSocket: /ws
  Сообщения: { ticker: string, price: number, timestamp: string }
```

### 5.2 Структуры данных

```typescript
interface Stock {
  ticker: string;
  name: string;
  sector: string;
  currentPrice: number;
  priceChange24h: number; // процент
  quantityInPortfolio: number;
}

interface PricePoint {
  timestamp: Date;
  price: number;
}

interface Portfolio {
  totalValue: number;
  availableBalance: number;
  dailyChangePercent: number; // относится к totalValue
}

interface WSPriceUpdate {
  ticker: string;
  price: number;
  timestamp: Date;
}
```

---

## 6. Особенности реализации

### 6.1 Фильтрация и поиск

**Решение:** Фильтрация через API, не локальная.

**Отступление от PRD:** PRD указывает "локальную фильтрацию", но с курсорной пагинацией это невозможно — клиент не имеет всех данных. API-фильтрация — корректное решение.

### 6.2 Кнопки Buy/Sell в таблице

**Решение:** Условное отображение кнопок:

- Если `quantityInPortfolio === 0` → только кнопка Buy
- Если `quantityInPortfolio > 0` → кнопки Buy и Sell

### 6.3 Кеширование исторических данных

**Ключ кеша:** `['stockHistory', ticker, timeframe]`

При переключении на ранее выбранный тикер — данные из кеша, мгновенный рендер.

---

## 7. Тестирование

### 7.1 Стратегия

| Уровень         | Инструмент             | Подход                                            |
| --------------- | ---------------------- | ------------------------------------------------- |
| Unit            | Vitest + vi.fn()       | Хуки, утилиты, selectors — прямой мок queryClient |
| Integration     | Vitest + RTL + MSW     | Компоненты — мок REST через MSW                   |
| WebSocket тесты | Vitest + MockWebSocket | Кастомный класс для мокирования WebSocket         |
| E2E             | Playwright             | Page Object Model, мок через page.route()         |

### 7.2 Покрытие

**Цель:** минимум 85% для бизнес-логики.

**Обязательные тесты:**

- Кастомный хук WebSocket подписки (с мокированием WS)
- Форма покупки акции: валидация баланса, вызов транзакции
- E2E сценарий: вход → выбор акции → покупка → проверка баланса

---

## 8. Mock-сервер

**Технологии:** Express + ws

**Запуск:** Параллельно с Vite через `npm run dev` или отдельный скрипт.

**Vite proxy:**

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:3001',
    '/ws': {
      target: 'ws://localhost:3001',
      ws: true
    }
  }
}
```

**Частота обновлений WebSocket:** каждые 50ms для тестирования производительности.
