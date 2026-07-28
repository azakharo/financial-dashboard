# План миграции: React 19 → Vue 3 + Pinia

## 1. Цели и границы

**Цель:** Перевести фронтенд SPA «Financial Dashboard» с React 19 на Vue 3 (Composition API, `<script setup>`) с сохранением функциональности, внешнего вида и успешного прохождения тестов.

**В рамках миграции:**

- Весь код в `src/` (FSD-слои `app`, `pages`, `widgets`, `features`, `entities`, `shared`).
- Конфигурация сборки (`vite.config.ts`, `vitest.config.ts`, `tsconfig.*`, `eslint.config.js`, `components.json`).
- Unit/integration/E2E тесты фронтенда.
- Документация (`README.md`, `AGENTS.md`, `ADR.md`) — обновление секций стека.

**Вне рамок:**

- `mock-server/` — фреймворк-нейтральный (Express + ws), не трогается.
- `docs/specs/PRD.md` — историческое ТЗ, остаётся как есть.
- CI workflow (`.github/workflows/`) — фактически отсутствует; создание не входит в задачу (отдельный пункт).

---

## 2. Архитектурные решения (согласованы)

| Решение              | Выбор                                                             | Обоснование                                                                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Серверное состояние  | `@tanstack/vue-query`                                             | API совместим с текущим React-кодом (useQuery/useInfiniteQuery/useMutation/useQueryClient), `structuralSharing` и `setQueryData` из throttle-колбэка работают. Минимальный риск для WS-паттерна. |
| Клиентское состояние | `pinia` (setup-style stores)                                      | Прямая замена Zustand. Гранулярная реактивность, `storeToRefs` для реактивной деструктуризации.                                                                                                  |
| Графики              | `vue3-apexcharts` + `apexcharts`                                  | Декларативный API, ближайший к Recharts. Кастомный tooltip через `options.tooltip.formatter`, градиент через `fill.gradient`.                                                                    |
| WebSocket            | `@vueuse/core` `useWebSocket`                                     | Idiomatic Vue, авто-реконнект, авто-cleanup через `tryOnScopeDispose`.                                                                                                                           |
| Виртуализация        | `@tanstack/vue-virtual`                                           | Тот же `useVirtualizer` (composable), совместим с Vue Query.                                                                                                                                     |
| UI-примитивы         | `shadcn-vue` + `reka-ui` (бывший `radix-vue`) + `lucide-vue-next` | Прямой аналог shadcn/ui. `components.json` перегенерируется.                                                                                                                                     |
| Роутер               | `vue-router` 4                                                    | Один маршрут `/` → `DashboardPage`.                                                                                                                                                              |
| Стратегия            | **Big-bang rewrite in place** в новой ветке                       | FSD-структура и имена файлов сохраняются; расширения `.tsx → .vue`. Промежуточные коммиты могут не компилироваться.                                                                              |
| React Compiler       | Удаляется                                                         | Vue 3 имеет fine-grained реактивность из коробки; babel-plugin не нужен.                                                                                                                         |

**Канонический источник стека:** `docs/specs/ADR.md`. В `AGENTS.md` и `README.md` — только ссылка на ADR (без дублирования).

---

## 3. Зависимости: до → после

### Удалить (React-only)

```
react, react-dom, react-router-dom,
@tanstack/react-query, @tanstack/react-query-devtools, @tanstack/react-virtual,
react-use-websocket, recharts, radix-ui, lucide-react, zustand, agentation,
@types/react, @types/react-dom,
@vitejs/plugin-react, vite-plugin-babel, babel-plugin-react-compiler,
eslint-plugin-react-compiler, eslint-plugin-react-dom, eslint-plugin-react-hooks,
eslint-plugin-react-refresh, eslint-plugin-react-x,
@testing-library/react
```

### Добавить

```
vue, vue-router, pinia,
@tanstack/vue-query, @tanstack/vue-query-devtools, @tanstack/vue-virtual,
@vueuse/core,
reka-ui, lucide-vue-next,
vue3-apexcharts, apexcharts,
@vitejs/plugin-vue, vue-tsc,
@testing-library/vue, @vue/test-utils,
eslint-plugin-vue
```

### Оставить без изменений

`typescript, vite, tailwindcss, @tailwindcss/vite, tw-animate-css, class-variance-authority, clsx, tailwind-merge, date-fns, ky, lodash, @types/lodash, uuid, vitest, @vitest/coverage-v8, @vitest/ui, jsdom, msw, @playwright/test, prettier, eslint-plugin-prettier, eslint-config-prettier, typescript-eslint, eslint-plugin-better-tailwindcss, concurrently, tsx, express, ws, cors, @types/* (server), @fontsource-variable/geist, @testing-library/jest-dom, @testing-library/user-event`

> Установка по `npm_rules.md`: `npm i -S -E <pkg>` / `npm i -D -E <pkg>` (фиксированные версии).

---

## 4. Этапы миграции

### Этап 1. Конфигурация сборки и зависимостей

- Обновить `package.json` (раздел 3).
- `vite.config.ts`: заменить `react()` + `babel(...)` на `vue()`; оставить `tailwindcss()`, `resolve.alias`, `server.proxy` (`/api`, `/ws`) без изменений.
- `tsconfig.app.json`: убрать `"jsx": "react-jsx"`; оставить `strict`, `verbatimModuleSyntax`, `paths.@/*`. Добавить поддержку `.vue` (через `vue-tsc` в `npm run ts`).
- `vitest.config.ts`: `include` → `src/**/*.{test,spec}.ts` (убрать `tsx`); добавить плагин `vue()` в конфиг (или общая конфигурация с vite). Coverage-пороги 85% и `include`-паттерны (`src/shared/lib/**`, `src/shared/store/**`, `src/entities/**/model.ts`, `src/features/**/model/**/*.ts`) — без изменений.
- `eslint.config.js`: убрать `eslint-plugin-react-*` и `react-compiler`; добавить `eslint-plugin-vue` (recommended: `vue/vue3-recommended`).
- `index.html`: `src/main.tsx` → `src/main.ts`.
- `components.json`: перегенерировать через `npx shadcn-vue@latest init` (style `radix-nova`, alias `@/shared/ui`, `@/shared/lib`).
- Обновить `npm run ts` → `vue-tsc --noEmit` (или `vue-tsc -b --noEmit`).

### Этап 2. Слой `shared`

- `shared/lib/utils.ts`, `format.ts`, `date.ts` + их тесты — **без изменений** (pure TS).
- `shared/api/types.ts`, `client.ts`, `stocks.ts`, `portfolio.ts`, `websocket.ts` (applyPriceUpdates) + тест `applyPriceUpdates.test.ts` — **без изменений** (pure TS, ky, ручной structural sharing).
- `shared/store/uiStore.ts`: Zustand → Pinia setup-style store. `create<UIState>(set => ...)` → `defineStore('ui', () => { const selectedTicker = ref<string|null>(null); ...; function setSelectedTicker(t) { selectedTicker.value = t } return {...} })`.
  - `uiStore.test.ts`: переписать под Pinia (`useUIStore()` вместо `useUIStore.setState()`, `store.$reset()` в `beforeEach`).
- `shared/ui/*.tsx` → `*.vue`: перегенерировать через `npx shadcn-vue@latest add button card badge dialog input`. `cn()` из `shared/lib/utils` переиспользуется. `asChild` поддерживается reka-ui нативно.

### Этап 3. Слой `entities`

- `entities/stock/api.ts`: `useInfiniteQuery` из `@tanstack/vue-query`. Возвращает реактивные refs (`data`, `fetchNextPage`, `hasNextPage`, `isFetching`). Query key `['stocks', {sector, search}]` — без изменений.
- `entities/stock/model.ts` + тест — **без изменений** (pure selectors).
- `entities/stock/ui/StockRow.tsx` → `StockRow.vue`: `defineProps<{stock: Stock}>()`, `defineEmits<{click: [ticker]; buy: [ticker]; sell: [ticker]}>()`. Шаблон: тикер, название, цена (`formatPrice`), изменение (`formatPercent`), количество, кнопки Buy/Sell (Sell только если `quantityInPortfolio > 0`). `data-testid="stock-row-${ticker}"` сохраняется.
- `entities/portfolio/api.ts`: `useQuery` из `@tanstack/vue-query`. Key `['portfolio']`.
- `entities/portfolio/model.ts` + тест — **без изменений**.
- `entities/portfolio/ui/PortfolioInfo.tsx` → `PortfolioInfo.vue`. `data-testid` (`portfolio-value`, `available-balance`, `daily-change`) — сохраняются.
- `entities/price-history/api.ts`: `useQuery` из `@tanstack/vue-query`, `enabled: computed(() => ticker.value !== null)`. Key `['stockHistory', ticker, timeframe]`.
- `entities/price-history/model.ts` + тест — **без изменений**.

### Этап 4. Слой `features`

- `features/portfolio-trade/api.ts`: `useMutation` из `@tanstack/vue-query` для `useBuyStock`/`useSellStock`. `onSuccess` → `queryClient.invalidateQueries({queryKey:['portfolio']})` и `['stocks']`. Контракт `mutate({ticker, quantity})` — без изменений.
- `features/portfolio-trade/model/validation.ts` + тест — **без изменений** (pure functions).
- `features/portfolio-trade/ui/TradeForm.tsx` → `TradeForm.vue`: `defineProps<{stock: Stock | undefined; mode: 'buy'|'sell'}>`, `defineEmits<{cancel; success}>()`. Локальный `ref<number>` для quantity, `computed` для totalCost и ошибки валидации (`validateBuy`/`validateSell`). Submit вызывает `mutate` (из `useBuyStock`/`useSellStock`), на `success` — `emit('success')` + `uiStore.closeTradeModal()`. `data-testid` сохраняются.
- `features/portfolio-trade/ui/TradeModal.tsx` → `TradeModal.vue`: `Dialog` (reka-ui) controlled через `uiStore.tradeModalOpen` + `@update:open-change`. Stock ищется в кеше `useStocks` через `queryClient.getQueryData` (или `useQueryClient`).
- `features/search/ui/SearchInput.tsx` → `SearchInput.vue`: `Input` + иконка `Search` (`lucide-vue-next`). Debounce 500ms через `useDebounceFn` (`@vueuse/shared`) или `lodash.debounce`. Запись в `uiStore.searchQuery`.
- `features/price-update/usePriceUpdate.tsx` → `usePriceUpdate.ts` (composable):
  - `useWebSocket('/ws', { autoReconnect: { retries: 10, delay: 3000 }, onMessage })` из `@vueuse/core`.
  - `buffer = new Map<string, WSPriceUpdate>()` (plain Map в setup, не ref — мутируется in-place).
  - `throttledFlush = throttle(flush, 2000, {leading:false, trailing:true})` (lodash).
  - `flush()`: `useQueryClient().setQueryData(['stocks', {sector:ui.sectorFilter, search:ui.searchQuery}], updater)` + обновление `['stockHistory', selectedTicker, '1D']` (если `selectedTicker && chartTimeframe==='1D'`) + `invalidateQueries(['portfolio'])`.
  - `uiStore = useUIStore()` — Pinia singleton, можно читать `ui.sectorFilter` в throttle-колбэке.
  - Cleanup: `onUnmounted(() => throttledFlush.cancel())` (WS закрывается vueuse через `tryOnScopeDispose`).
  - Возвращает `computed(() => status.value === 'OPEN')` как `isConnected`.

### Этап 5. Слой `widgets`

- `widgets/stock-table/ui/StockTable.tsx` → `StockTable.vue`: контейнер. `useUIStore` (selectedTicker, sectorFilter, searchQuery) через `storeToRefs`. `useStocks({sector, search})`. Фильтры-сектора (Badge-чипы «Все» + SECTORS), `SearchInput`, header, кнопка «Загрузить ещё» (если `hasNextPage`). Flatten `data.value.pages` → `Stock[]`.
- `widgets/stock-table/ui/StockTableBody.tsx` → `StockTableBody.vue`:
  - `parentRef = ref<HTMLElement|null>(null)`.
  - `rowVirtualizer = useVirtualizer({ count: stocks.length, getScrollElement: () => parentRef.value, estimateSize: () => 48, overscan: 10 })`.
  - `watch(() => queryKey, () => rowVirtualizer.value.scrollToIndex(0, {align:'start'}))` — scroll reset.
  - Шаблон: `data-testid="stock-table-body"`, контейнер `height: totalSize`, `v-for="virtualRow in virtualItems"` → `StockRow` с `:style="{position:'absolute', top:0, height: virtualRow.size+'px', transform:`translateY(${virtualRow.start}px)`}"`.
  - `React.memo` не нужен (Vue default shallow reactivity на props; опционально `v-memo` для list items при высокой частоте WS-апдейтов).
- `widgets/stock-chart/ui/StockChart.tsx` → `StockChart.vue`:
  - `<apexchart type="area" :options="chartOptions" :series="chartSeries" />`.
  - `chartSeries = computed(() => [{ name: 'Цена', data: selectChartData(history).map(p => ({x: p.timestamp.getTime(), y: p.price})) }])`.
  - `chartOptions` (computed, зависит от `chartTimeframe`): `chart.animations.enabled=false` (≈ `isAnimationActive:false`), `stroke.curve='monotone'`, `fill.type='gradient'` с `gradientShade='light'` stops 0.3→0, `xaxis.type='datetime'`, `xaxis.labels.formatter` по таймфрейму (1D→HH:mm, 1W→eeee, 1M→dd.MM, 1Y→LLL, ru-locale через date-fns), `yaxis.labels.formatter` → `$${v.toFixed(0)}`, `tooltip.custom`/`formatter` — кастомный HTML с `formatDateTime` + `formatPrice` (ru-RU USD).
  - Header: latest price + priceChange + `TimeframeSelector` (4 Badge: 1D/1W/1M/1Y, клик → `uiStore.setChartTimeframe`).
  - `data-testid="stock-chart-container"` — сохраняется.

### Этап 6. Слои `pages` и `app`

- `pages/dashboard/ui/DashboardPage.tsx` → `DashboardPage.vue`: композиция `PortfolioInfo` + `StockTable` + `StockChart` + `TradeModal`; вызывает `usePriceUpdate()` в `<script setup>`.
- `app/providers/QueryProvider.tsx` → удалить (провайдер не нужен, `VueQueryPlugin` ставится в `main.ts`).
- `app/router/router.tsx` → `app/router/index.ts`: `createRouter({ history: createWebHistory(), routes: [{ path: '/', component: DashboardPage }] })`.
- `src/main.ts`: `createApp(App).use(createPinia()).use(router).use(VueQueryPlugin, { queryClient }).mount('#root')`. `queryClient` конфиг: `{ defaultOptions: { queries: { refetchOnWindowFocus:false, retry:1, structuralSharing:true } } }` (идентично текущему).
- `src/App.vue`: `<router-view />` (+ опционально `VueQueryDevtools`).

### Этап 7. Тесты

**Unit (pure TS) — без изменений:**

- `shared/lib/utils.test.ts`, `format.test.ts`, `date.test.ts`
- `shared/api/__tests__/applyPriceUpdates.test.ts`
- `entities/stock/model.test.ts`, `entities/portfolio/model.test.ts`, `entities/price-history/model.test.ts`
- `features/portfolio-trade/model/validation.test.ts`

**Переписать:**

- `shared/store/uiStore.test.ts` → Pinia API (`useUIStore()`, `$reset()` в `beforeEach`).
- `src/tests/utils.tsx` → `utils.ts`: `renderWithProviders(component, options)` использует `render` из `@testing-library/vue` с `global.plugins: [createPinia(), ...]` и `VueQueryPlugin` (через `global.plugins` или ручная установка `useQueryClient().setQueryData` для сидирования кеша). Фабрики `createStock`/`createPage`/`createPortfolio`/`createPricePoint` — pure TS, без изменений.
- `src/tests/setup.ts`: `@testing-library/jest-dom/vitest`, `cleanup` из `@testing-library/vue`, MSW `setupServer()` (пустой), `vi.stubGlobal('WebSocket', MockWebSocket)` — без изменений. MockWebSocket-класс переносится как есть.
- `features/search/ui/SearchInput.test.tsx` → `.test.ts`: `mount`, `fireEvent.update(input, value)`, `vi.useFakeTimers` + `vi.advanceTimersByTime(500)`, проверка `useUIStore().searchQuery`. `vi.useFakeTimers` должен учитывать debounce (vueuse или lodash).
- `features/portfolio-trade/__tests__/TradeForm.test.tsx` → `.test.ts`: `vi.hoisted` для mock мутаций, `vi.mock('@/features/portfolio-trade/api')`, `renderWithProviders(TradeForm, { props: {stock, mode} })`, `seedPortfolioCache` через `useQueryClient().setQueryData(['portfolio'], ...)`. 10 кейсов сохраняются.
- `widgets/stock-table/__tests__/StockTable.test.tsx` → `.test.ts`: `vi.mock('@/entities/stock')` (только `useStocks`), `vi.mock('@tanstack/vue-virtual')` (фейковый virtualizer — все строки подряд, size 48). 8 кейсов сохраняются.
- `features/price-update/usePriceUpdate.test.tsx` → `.test.ts`: `vi.mock('@vueuse/core', () => ({ useWebSocket: vi.fn(() => ({ status: ref(mockStatus.value) })) }))`, `renderHook` из `@testing-library/vue` (обёртка через `defineComponent` + `setup`). 4 кейса статусов. **Опционально:** добавить тест throttle/buffer-поведения (пробел в текущем покрытии).

**E2E (Playwright) — минимальные изменения:**

- `e2e/pages/DashboardPage.ts` (POM): локаторы (`data-testid`, `getByRole`, `getByLabel`) — без изменений. `setupMocks` (`page.route` для `/api/stocks`, `/api/portfolio`, `/api/portfolio/buy`, `/api/stocks/*/history*`, abort `/ws`) — без изменений.
- `e2e/tests/buy-stock.spec.ts` — без изменений (сценарий: goto → selectStock → openBuyModal → fillQuantity → submitBuy → проверка баланса и количества).
- `e2e/fixtures/test-data.ts` — без изменений.
- `playwright.config.ts` — без изменений (`webServer: npm run preview`, baseURL `:4173`).
- Единственный риск: тайминги гидратации Vue. Митигация: `await expect(dashboardPage.availableBalance).toBeVisible()` уже есть в сценарии — этого достаточно.

### Этап 8. Документация

- `docs/specs/ADR.md` — **канонический источник стека**. Обновить: §1.1 (фреймворк Vue 3), §1.2 (библиотеки — таблица замен), §3 (управление состоянием: Pinia + Vue Query, убрать Zustand-сниппет, добавить Pinia setup-store пример), §4 (WS: `@vueuse/core` `useWebSocket` вместо `react-use-websocket`), §7 (тесты: `@testing-library/vue` вместо RTL). Добавить ADR-запись о решении миграции со ссылкой на данный план.
- `AGENTS.md` — обновить секцию «Стек» ссылкой на `docs/specs/ADR.md#1-технологический-стек` (без дублирования). Убрать React-specific правила (`React.FC`, named export для компонентов — для Vue SFC неактуально, файл = компонент). Добавить Vue-specific: «Использовать `<script setup lang="ts">`», «defineProps/defineEmits с type-only интерфейсами», «для тестов компонентов — `@testing-library/vue`». Команды `npm run dev`/`build`/`ts`/`lint`/`test:run`/`test:e2e` — без изменений.
- `README.md` — обновить краткое описание стека (ссылка на ADR). Команды запуска — без изменений.
- `docs/plans/implementation_plan.md`, `testing_plan.md` — пометить как исторические (React-версия) со ссылкой на `migration_to_vue_plan.md`.

### Этап 9. Верификация

- `npm run ts` (vue-tsc) — без ошибок типов.
- `npm run lint` — без ошибок/предупреждений.
- `npm run test:run` — все unit/integration тесты зелёные.
- `npm run build` — production-сборка успешна.
- `npm run test:e2e` — сценарий покупки проходит.
- Визуальная проверка (пользователь запускает `npm run dev:all`): идентичность UI — таблица 10k строк с виртуальным скроллом, фильтры по секторам, поиск, график с переключением таймфреймов и realtime-точками на 1D, модалка Buy/Sell с валидацией баланса, обновление портфеля после транзакции, WS-апдейты цен без фризов.

---

## 5. Карта файлов (поэтапно)

| Файл (текущий)                                                                                          | →   | Файл (после)              | Действие                                  |
| ------------------------------------------------------------------------------------------------------- | --- | ------------------------- | ----------------------------------------- |
| `src/main.tsx`                                                                                          | →   | `src/main.ts`             | переписать (createApp)                    |
| `src/index.css`                                                                                         | →   | `src/index.css`           | без изменений                             |
| `src/app/providers/QueryProvider.tsx`                                                                   | →   | удалить                   | функцию поглощает `main.ts`               |
| `src/app/router/router.tsx`                                                                             | →   | `src/app/router/index.ts` | переписать (createRouter)                 |
| `src/pages/dashboard/ui/DashboardPage.tsx`                                                              | →   | `DashboardPage.vue`       | переписать                                |
| `src/widgets/stock-table/ui/StockTable.tsx`                                                             | →   | `StockTable.vue`          | переписать                                |
| `src/widgets/stock-table/ui/StockTableBody.tsx`                                                         | →   | `StockTableBody.vue`      | переписать                                |
| `src/widgets/stock-chart/ui/StockChart.tsx`                                                             | →   | `StockChart.vue`          | переписать (apexcharts)                   |
| `src/features/price-update/usePriceUpdate.ts`                                                           | →   | `usePriceUpdate.ts`       | переписать (vueuse + vue-query)           |
| `src/features/search/ui/SearchInput.tsx`                                                                | →   | `SearchInput.vue`         | переписать                                |
| `src/features/portfolio-trade/ui/TradeForm.tsx`                                                         | →   | `TradeForm.vue`           | переписать                                |
| `src/features/portfolio-trade/ui/TradeModal.tsx`                                                        | →   | `TradeModal.vue`          | переписать                                |
| `src/features/portfolio-trade/api.ts`                                                                   | →   | `api.ts`                  | useMutation из vue-query                  |
| `src/entities/stock/api.ts`                                                                             | →   | `api.ts`                  | useInfiniteQuery из vue-query             |
| `src/entities/stock/ui/StockRow.tsx`                                                                    | →   | `StockRow.vue`            | переписать                                |
| `src/entities/portfolio/api.ts`                                                                         | →   | `api.ts`                  | useQuery из vue-query                     |
| `src/entities/portfolio/ui/PortfolioInfo.tsx`                                                           | →   | `PortfolioInfo.vue`       | переписать                                |
| `src/entities/price-history/api.ts`                                                                     | →   | `api.ts`                  | useQuery из vue-query                     |
| `src/shared/store/uiStore.ts`                                                                           | →   | `uiStore.ts`              | Zustand → Pinia                           |
| `src/shared/ui/{button,card,badge,dialog,input}.tsx`                                                    | →   | `*.vue`                   | shadcn-vue regenerate                     |
| `src/shared/api/*`, `shared/lib/*`                                                                      | →   | без изменений             | —                                         |
| `src/tests/utils.tsx`                                                                                   | →   | `utils.ts`                | renderWithProviders → vue-testing-library |
| `src/tests/setup.ts`, `server.ts`                                                                       | →   | без изменений             | —                                         |
| `*.test.tsx`                                                                                            | →   | `*.test.ts`               | переписать под vue-testing-library        |
| `*.test.ts` (pure)                                                                                      | →   | без изменений             | —                                         |
| `e2e/**`                                                                                                | →   | без изменений             | —                                         |
| `mock-server/**`                                                                                        | →   | без изменений             | —                                         |
| `vite.config.ts`, `vitest.config.ts`, `tsconfig.*`, `eslint.config.js`, `components.json`, `index.html` | →   | обновить                  | раздел 4, этап 1                          |

---

## 6. Ключевые паттерны миграции

### 6.1 Zustand → Pinia

```ts
// Было (Zustand)
export const useUIStore = create<UIState>(set => ({
  selectedTicker: null,
  setSelectedTicker: t => set({selectedTicker: t}),
  // ...
}));
// Вне React: useUIStore.getState().sectorFilter

// Стало (Pinia setup-store)
export const useUIStore = defineStore('ui', () => {
  const selectedTicker = ref<string | null>(null);
  function setSelectedTicker(t: string | null) {
    selectedTicker.value = t;
  }
  // ...
  return {selectedTicker, setSelectedTicker /* ... */};
});
// Вне Vue-цикла (throttle): const ui = useUIStore(); ui.sectorFilter
```

В компонентах: `const ui = useUIStore(); const { selectedTicker } = storeToRefs(ui); ui.setSelectedTicker(...)`.

### 6.2 React Query → Vue Query

- API совместим: `useQuery`, `useInfiniteQuery`, `useMutation`, `useQueryClient`, `queryClient.setQueryData`, `invalidateQueries`, `structuralSharing`.
- Возвращают реактивные refs: `const { data, isFetching } = useQuery({...})` → `data.value`, `isFetching.value`.
- `VueQueryPlugin.install(app, { queryClient })` в `main.ts` вместо `<QueryClientProvider>`.
- `useQueryClient()` возвращает singleton — вызывается в throttle-колбэке без проблем.

### 6.3 WebSocket (buffer + throttle + structural sharing)

Логика `usePriceUpdate` сохраняется 1:1:

```
WS (50ms, массив апдейтов)
  → onMessage: buffer.set(ticker, toWSPriceUpdate(raw))  // Map, дедупликация
  → throttledFlush (lodash throttle 2000ms, leading:false, trailing:true)
  → flush():
      queryClient.setQueryData(['stocks', {sector, search}], (old) => applyPriceUpdates(old.pages, priceMap))
      queryClient.setQueryData(['stockHistory', selectedTicker, '1D'], (old) => appendPoint(old, chartUpdate))
      queryClient.invalidateQueries(['portfolio'])
```

`applyPriceUpdates` (ручной structural sharing — тот же массив/page/stock если без изменений) — **без изменений**. В связке с `structuralSharing:true` в vue-query это сохраняет per-row ре-рендер только для изменившихся строк.

### 6.4 Виртуализация

`useVirtualizer` из `@tanstack/vue-virtual` — composable. `parentRef = ref<HTMLElement|null>(null)`. Доступ к методам через `.value` в setup. `watch(queryKey, () => virtualizer.value.scrollToIndex(0, {align:'start'}))` для scroll-reset.

### 6.5 Recharts → ApexCharts

- `isAnimationActive:false` → `chart.animations.enabled=false`.
- Кастомный tooltip (render-prop) → `tooltip.custom` (HTML-функция) или `tooltip.formatter`.
- `<linearGradient>` → `fill.type='gradient'`, `fill.gradient.gradientStops`.
- `XAxis.tickFormatter` → `xaxis.labels.formatter`.
- `YAxis.tickFormatter` → `yaxis.labels.formatter`.
- `ResponsiveContainer` не нужен — apexcharts адаптивен по умолчанию (`width='100%'`).

### 6.6 shadcn-vue

- `radix-ui` (Slot, Dialog) → `reka-ui` (API идентичен: `DialogRoot`, `DialogTrigger`, `DialogContent`, `asChild` нативно).
- `lucide-react` → `lucide-vue-next` (идентичные имена иконок).
- `cn()` из `shared/lib/utils` переиспользуется в `:class="cn(base, variants[variant])"`.
- `class-variance-authority` — без изменений (framework-neutral).

---

## 7. Риски и митигации

| Риск                                                                           | Уровень | Митигация                                                                                                                                                                                    |
| ------------------------------------------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WS throttle + structural sharing теряет производительность при миграции        | Высокий | `@tanstack/vue-query` + `structuralSharing:true` + неизменный `applyPriceUpdates` (ручной diff). `@tanstack/vue-virtual` рендерит только видимые строки. Опционально `v-memo` на `StockRow`. |
| `useQueryClient()` в throttle-колбэке (вне setup-цикла)                        | Средний | vue-query `useQueryClient()` возвращает singleton; валидировать тестом `usePriceUpdate`.                                                                                                     |
| `@tanstack/vue-virtual` менее зрелый, чем react-версия                         | Средний | Тот же core; API совместим. Покрыть интеграционным тестом `StockTableBody` (10k строк).                                                                                                      |
| ApexCharts: кастомный tooltip/градиент отличаются внешне                       | Средний | Визуальная сверка с React-версией на этапе 9; при необходимости — `tooltip.custom` (полный HTML-контроль).                                                                                   |
| shadcn-vue `radix-nova` style отличается от текущего                           | Низкий  | Tailwind v4 + CSS-переменные в `index.css` сохраняются; shadcn-vue использует те же токены.                                                                                                  |
| `eslint-plugin-better-tailwindcss` для Vue templates                           | Низкий  | Плагин поддерживает Vue; проверить конфиг на этапе 1.                                                                                                                                        |
| `renderHook` для composables в vue-testing-library                             | Средний | Использовать `defineComponent`-обёртку + `setup()`. Тест `usePriceUpdate` — критичный.                                                                                                       |
| Coverage-пороги 85% для business-logic                                         | Низкий  | Pure-TS файлы (`model.ts`, `validation.ts`, `format.ts`, `date.ts`, `applyPriceUpdates.ts`) не меняются; их тесты остаются. `uiStore.ts` меняется — тест переписывается 1:1.                 |
| Несоответствие локали (`format.ts` en-US vs `PortfolioInfo`/`TradeForm` ru-RU) | Низкий  | Зафиксировать в ADR: форматирование валюты — ru-RU везде (привести `format.ts` к ru-RU при миграции, либо оставить как есть — отдельный вопрос пользователю).                                |
| E2E тайминги гидратации Vue                                                    | Низкий  | `await expect(availableBalance).toBeVisible()` уже в сценарии.                                                                                                                               |
| `agentation` devtools-overlay (React-only)                                     | Низкий  | Удалить; заменить на `@vue/devtools` (опционально).                                                                                                                                          |

---

## 8. Чек-лист приёмки

- [ ] `npm run ts` — зелёно (vue-tsc).
- [ ] `npm run lint` — зелёно.
- [ ] `npm run test:run` — все тесты зелёные; coverage ≥85% для business-logic.
- [ ] `npm run build` — успешно.
- [ ] `npm run test:e2e` — сценарий покупки зелёный.
- [ ] Визуальная идентичность UI (пользователь проверяет `npm run dev:all`).
- [ ] `docs/specs/ADR.md`, `AGENTS.md`, `README.md` обновлены (стек — в ADR, остальные ссылаются).
- [ ] Нет остаточных React-зависимостей в `package.json`.
- [ ] Нет циклических зависимостей и нарушений cross-imports в FSD.

---

## 9. Неоднозначности (решения ниже)

1. **Локаль форматирования валюты** в `shared/lib/format.ts`: сейчас `en-US`, в компонентах — `ru-RU`. Унифицировать на ru-RU (соответствие PRD «русский формат чисел»).
2. **Расширение покрытия WS-теста**: текущий `usePriceUpdate.test` проверяет только статус соединения, не buffer/throttle/flush. Добавить тест throttle-поведения НЕ нужно.
3. **CI workflow**: `.github/workflows/` отсутствует. Создавать в рамках миграции НЕ нужно.
