# Architecture Decision Record (ADR)

## 1. Технологический стек

### 1.1 Фреймворк и окружение

| Компонент    | Решение                               | Обоснование                |
| ------------ | ------------------------------------- | -------------------------- |
| Vue          | 3 (Composition API, `<script setup>`) | Миграция с React 19        |
| TypeScript   | Строгая типизация                     | Требование PRD, без `any`  |
| Vite         | Сборщик                               | Требование PRD             |
| Tailwind CSS | Стилизация                            | Требование PRD             |
| shadcn-vue   | UI компоненты                         | reka-ui (radix-nova style) |

### 1.2 Библиотеки

| Назначение                     | Библиотека                | Обоснование                                                                             |
| ------------------------------ | ------------------------- | --------------------------------------------------------------------------------------- |
| HTTP клиент                    | ky                        | Легковесный (5KB), удобный API для JSON, тайпинфы из коробки                            |
| Управление состоянием (server) | @tanstack/vue-query       | Кеширование, рефетчинг, бесконечный скролл, интеграция с WebSocket                      |
| Управление состоянием (client) | pinia (setup stores)      | Официальный store для Vue 3. UI state: selectedTicker, modalState, filters, searchQuery |
| Виртуализация таблицы          | @tanstack/vue-virtual     | Гибкий headless подход, совместимость с Vue Query                                       |
| Графики                        | vue3-apexcharts           | Декларативный API, кастомный tooltip, градиент через fill.gradient                      |
| Работа с датами                | date-fns                  | Указано в react_rules.md                                                                |
| WebSocket                      | @vueuse/core useWebSocket | Idiomatic Vue, авто-реконнект, авто-cleanup через tryOnScopeDispose                     |
| Throttle/batch обновлений      | lodash                    | Проверенная реализация, tree-shaking                                                    |

---

## 2. Архитектура FSD

```
src/
├── app/                     # Инициализация приложения
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
    ├── ui/                 # shadcn-vue компоненты
    ├── api/                # API клиент, WebSocket менеджер
    └── lib/                # Утилиты, форматтеры
```

---

## 3. Управление состоянием

### 3.1 Разделение ответственности

**@tanstack/vue-query — серверное состояние:**

- Данные акций (постраничная загрузка)
- Исторические данные для графиков
- Данные портфеля
- WebSocket обновления через `queryClient.setQueryData`

**pinia — клиентское состояние:**

```typescript
export const useUIStore = defineStore('ui', () => {
  const selectedTicker = ref<string | null>(null);
  const tradeModalOpen = ref(false);
  const tradeModalTicker = ref<string | null>(null);
  const tradeModalMode = ref<TradeMode>('buy');
  const sectorFilter = ref<Sector | null>(null);
  const searchQuery = ref('');
  const chartTimeframe = ref<Timeframe>('1D');

  // ... actions

  return {
    selectedTicker,
    tradeModalOpen,
    tradeModalTicker,
    tradeModalMode,
    sectorFilter,
    searchQuery,
    chartTimeframe,
    setSelectedTicker,
    openTradeModal,
    closeTradeModal,
    setSectorFilter,
    setSearchQuery,
    setChartTimeframe,
    $reset,
  };
});
```

### 3.2 Интеграция WebSocket с Vue Query

```
WebSocket (50ms) → Buffer → Throttle (2000ms) → queryClient.setQueryData
                                                              ↓
                                          Vue Query cache update
                                                              ↓
                                          Компоненты (через useQuery)
```

**Ключевые оптимизации:**

- Батчинг обновлений: собираем обновления за 2000ms, применяем разом
- `structuralSharing: true` в Vue Query — минимизация ре-рендеров
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

### 4.2 Управление соединением

**@vueuse/core useWebSocket:**

```typescript
const {status} = useWebSocket(WS_URL, {
  autoReconnect: {
    retries: 10,
    delay: 3000,
  },
  onMessage: (ws, event) => {
    // handle message
  },
});

const isConnected = computed(() => status.value === 'OPEN');
```

**Throttle + Buffer паттерн:**

```typescript
const buffer = new Map<string, WSPriceUpdate>();

const throttledFlush = throttle(flush, 2000, {
  leading: false,
  trailing: true,
});

function handleMessage(event: MessageEvent) {
  const updates = JSON.parse(event.data);
  for (const update of updates) {
    buffer.set(update.ticker, toWSPriceUpdate(update));
  }
  throttledFlush();
}
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

| Уровень         | Инструмент                    | Подход                                            |
| --------------- | ----------------------------- | ------------------------------------------------- |
| Unit            | Vitest + vi.fn()              | Хуки, утилиты, selectors — прямой мок queryClient |
| Integration     | Vitest + @testing-library/vue | Компоненты — мок REST через MSW                   |
| WebSocket тесты | Vitest + MockWebSocket        | Кастомный класс для мокирования WebSocket         |
| E2E             | Playwright                    | Page Object Model, мок через page.route()         |

### 7.2 Покрытие

**Цель:** минимум 85% для бизнес-логики.

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

---

## 9. ADR: Миграция React 19 → Vue 3

**Дата:** 2026-07-28

**Решение:** Полная миграция SPA «Financial Dashboard» с React 19 на Vue 3 (Composition API, `<script setup>`).

**Обоснование:**

- Унификация стека с другими проектами команды
- Упрощение архитектуры за счет нативной реактивности Vue
- Pinia как более идиоматичный solution для Vue

**Ключевые изменения:**

- React 19 → Vue 3.5
- Zustand → Pinia (setup stores)
- @tanstack/react-query → @tanstack/vue-query
- react-use-websocket → @vueuse/core useWebSocket
- Recharts → vue3-apexcharts
- radix-ui → reka-ui (через shadcn-vue)

**Результат:**

- TypeScript проверка: ✅
- ESLint: ✅
- Production build: ✅
