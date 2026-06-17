# AGENTS.md

SPA на React.js — Financial Dashboard.

## Стек

React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui (radix-nova style).

### Ключевые библиотеки

- **Состояние:** Tanstack Query (серверное), Zustand (клиентское)
- **UI:** shadcn/ui, Recharts (графики), @tanstack/react-virtual (виртуализация)
- **Сеть:** ky (HTTP), react-use-websocket (WebSocket)
- **Утилиты:** date-fns (даты), lodash (throttle/batch)

## Команды

- `npm run dev` — dev server на http://localhost:5173. Только пользователь может запускать. ИИ агент не запускат.
- `npm run dev:server` — mock-сервер (REST + WebSocket). Только пользователь может запускать. ИИ агент не запускат.
- `npm run dev:all` — mock-сервер + Vite параллельно. Только пользователь может запускать. ИИ агент не запускат.
- `npm run build` — production build в `dist/`
- `npm run ts` — typecheck
- `npm run lint` — ESLint + Prettier автофикс
- `npm run check:server` — проверка mock-сервера

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
- Вход: `src/main.tsx` → `src/App.tsx`

## React Compiler

Включён babel-plugin-react-compiler. Не нужно использовать `useMemo`/`useCallback` вручную — компилятор оптимизирует автоматически.

ESLint плагин `react-compiler` включён и показывает warnings при нарушениях правил компилятора.

## shadcn/ui

Стиль: `radix-nova`. Добавление компонента:

```sh
npx shadcn add <component>
```
