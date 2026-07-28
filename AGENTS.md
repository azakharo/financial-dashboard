# AGENTS.md

SPA на Vue.js — Financial Dashboard.

## Стек

Vue 3 (Composition API, `<script setup>`), TypeScript, Vite, Tailwind CSS, shadcn-vue (reka-ui).

Подробнее: `docs/specs/ADR.md#1-технологический-стек`.

### Ключевые библиотеки

- **Состояние:** @tanstack/vue-query (серверное), Pinia (клиентское)
- **UI:** shadcn-vue, vue3-apexcharts (графики), @tanstack/vue-virtual (виртуализация)
- **Сеть:** ky (HTTP), @vueuse/core useWebSocket (WebSocket)
- **Утилиты:** date-fns (даты), lodash (throttle/batch)

## Команды

- `npm run dev` — dev server на http://localhost:5173. Только пользователь может запускать. ИИ агент не запускает.
- `npm run dev:server` — mock-сервер (REST + WebSocket). Только пользователь может запускать. ИИ агент не запускает.
- `npm run dev:all` — mock-сервер + Vite параллельно. Только пользователь может запускать. ИИ агент не запускает.
- `npm run build` — production build в `dist/`
- `npm run ts` — typecheck (vue-tsc)
- `npm run lint` — ESLint + Prettier автофикс
- `npm run check:server` — проверка mock-сервера
- `npm run test:run` — запуск unit тестов
- `npm run test:e2e` — запуск E2E тестов

## Архитектура

Feature-Sliced Design (FSD). Подробнее: `docs/specs/ADR.md`.

```
src/
├── app/                 # Инициализация приложения
├── pages/               # Страницы
├── widgets/             # Виджеты
├── features/            # Фичи
├── entities/            # Сущности
└── shared/              # Общий код
```

- Path alias: `@/*` → `src/*` (configured in tsconfig + vite)
- Вход: `src/main.ts` → `src/App.vue`

## Vue правила

- Использовать `<script setup lang="ts">` для всех SFC компонентов
- Использовать `defineProps<T>()` и `defineEmits<T>()` с type-only интерфейсами
- Файлы компонентов именуются в PascalCase, идентично названию экспортируемого компонента
- Для тестов компонентов использовать `@testing-library/vue`

## shadcn-vue

Стиль: `default`. Добавление компонента:

```sh
npx shadcn-vue@latest add <component>
```
