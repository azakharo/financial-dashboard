# Financial Dashboard

SPA на Vue 3 для отслеживания портфеля финансовых активов в реальном времени.

## Требования

- Node.js >= 24

## Технологический стек

- [Vue](https://vuejs.org/) 3 (Composition API, `<script setup>`) + TypeScript
- [Vite](https://vitejs.dev/) + Tailwind CSS
- [shadcn-vue](https://www.shadcn-vue.com/) (reka-ui)
- [@tanstack/vue-query](https://tanstack.com/query) — серверное состояние
- [Pinia](https://pinia.vuejs.org/) — клиентское состояние
- [vue3-apexcharts](https://apexcharts.com/docs/vue-charts/) — графики
- [@tanstack/vue-virtual](https://tanstack.com/virtual) — виртуализация таблицы
- [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) — тестирование

Подробнее: [`docs/specs/ADR.md`](docs/specs/ADR.md).

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

- **@tanstack/vue-query** — серверное состояние (акции, портфель, история цен). Кеширование, invalidation, бесконечный скролл.
- **Pinia** — клиентское состояние (selectedTicker, модальные окна, фильтры).

**Обоснование:** @tanstack/vue-query даёт кеширование и работу с серверными данными из коробки. Pinia — официальный store для Vue 3.

### Производительность WebSocket

**Проблема:** обновления каждые 50ms вызывают частые ре-рендеры.

**Решение:**

1. **Буфер + throttle** — обновления собираются в Map, deduplicated by ticker, `throttle(2000ms)` применяет разом через `queryClient.setQueryData`
2. **structuralSharing** — Vue Query возвращает тот же объект, если изменений нет.
3. Одна WebSocket-подписка вместо подписок на каждый тикер

### Виртуализация таблицы

**@tanstack/vue-virtual:**

- Рендер только видимых строк (50-100 из 10000+, overscan: 10)
- Vue реактивность обеспечивает минимальные ре-рендеры

## Структура проекта

Feature-Sliced Design (FSD). Подробнее: [ADR — Архитектура FSD](docs/specs/ADR.md#2-архитектура-fsd)
