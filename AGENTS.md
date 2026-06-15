# AGENTS.md

SPA на React.js.

## Стек

React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui (radix-nova style).

## Команды

- `npm run dev` — dev server на http://localhost:5173
- `npm run build` — production build в `dist/`
- `npm run ts` — typecheck
- `npm run lint` — ESLint + Prettier автофикс

## Архитектура

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
