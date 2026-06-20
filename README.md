# Financial Dashboard

SPA на React для отслеживания портфеля финансовых активов в реальном времени.

## Требования

- Node.js >= 24

## Технологический стек

- [React](https://react.dev/) 19 + TypeScript
- [Vite](https://vitejs.dev/) + Tailwind CSS
- [shadcn/ui](https://ui.shadcn.com/) (radix-nova style)
- [Tanstack Query](https://tanstack.com/query) — серверное состояние
- [Zustand](https://zustand-demo.pmnd.rs/) — клиентское состояние
- [Recharts](https://recharts.org/) — графики
- [@tanstack/react-virtual](https://tanstack.com/virtual) — виртуализация таблицы
- [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) — тестирование

## Запуск проекта

Установка зависимостей:

```sh
npm install
```

Запуск в dev-режиме:

```sh
npm run dev           # только фронтенд (http://localhost:5173)
npm run dev:server    # только mock-сервер (REST + WebSocket)
npm run dev:all       # оба параллельно (рекомендуется)
```

## Тестирование

```sh
npm run test          # интерактивный режим
npm run test:run      # однократный запуск unit-тестов
npm run test:coverage # отчёт покрытия
npm run test:e2e      # E2E тесты (Playwright)
npm run test:e2e:ui   # Playwright с UI
```

## Production build

```sh
npm run build
npm run preview
```

## Архитектура

Подробное описание в [`docs/specs/ADR.md`](docs/specs/ADR.md).

### Управление состоянием

Разделение ответственности:

- **Tanstack Query** — серверное состояние (акции, портфель, история цен). Кеширование, invalidation, бесконечный скролл.
- **Zustand** — клиентское состояние (selectedTicker, модальные окна, фильтры).

**Обоснование:** Tanstack Query даёт кеширование и работу с серверными данными из коробки. Zustand минимален для UI state.

### Производительность WebSocket

**Проблема:** обновления каждые 50ms вызывают частые ре-рендеры.

**Решение:**

1. **Буфер + throttle** — обновления собираются в Map, deduplicated by ticker, `throttle(2000ms)` применяет разом через `queryClient.setQueryData`
2. **structuralSharing** — React Query возвращает тот же объект, если изменений нет (это происходит и для stock, и для stock page).
3. Одна WebSocket-подписка вместо подписок на каждый тикер

### Виртуализация таблицы

**@tanstack/react-virtual:**

- Рендер только видимых строк (50-100 из 10000+, overscan: 10)
- `VirtualizedRow` обёрнут в `React.memo` для предотвращения лишних ре-рендеров

## Структура проекта

Feature-Sliced Design (FSD). Подробнее: [ADR — Архитектура FSD](docs/specs/ADR.md#2-архитектура-fsd)
