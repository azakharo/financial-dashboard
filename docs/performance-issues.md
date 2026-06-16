# Performance Issues Analysis

## Overview

High CPU usage caused by excessive re-renders in StockTable and StockChart components. WebSocket updates trigger full component tree re-renders instead of targeted updates.

---

## Problem 1: Duplicate WebSocket Processing (Critical)

### Location

- `src/shared/api/websocket.ts` — `usePriceFeed` hook
- `src/widgets/stock-chart/hooks/useChartUpdates.ts` — `useChartUpdates` hook

### Description

Two independent hooks call `useWebSocket` and parse THE SAME message twice.

```typescript
// websocket.ts:77
const {readyState, lastMessage} = useWebSocket(WS_URL, {...});

// useChartUpdates.ts:61
const {lastMessage} = useWebSocket(WS_URL, {...});
```

### Impact

- `JSON.parse` called 2× every 50ms = 40 parses/second
- Two `useEffect` triggers independently
- Two throttle timers running in parallel

### Solution

Remove `useChartUpdates` hook. Process all WebSocket messages in single location (`usePriceFeed`). Update chart data through React Query.

---

## Problem 2: Inefficient React Query Cache Updates (Critical)

### Location

`src/shared/api/websocket.ts:28-46` — `applyPriceUpdates` function

### Description

```typescript
function applyPriceUpdates(
  stocks: Stock[] | undefined,
  updates: WSPriceUpdate[],
) {
  if (!stocks) return stocks;

  const updateMap = new Map(updates.map(u => [u.ticker, u.price]));
  let hasChanges = false;

  const newStocks = stocks.map(stock => {
    const newPrice = updateMap.get(stock.ticker);
    if (newPrice !== undefined && newPrice !== stock.currentPrice) {
      hasChanges = true;
      return {...stock, currentPrice: newPrice};
    }
    return stock;
  });

  return hasChanges ? newStocks : stocks;
}
```

### Problem

`stocks.map()` ALWAYS creates new array. Even with `structuralSharing: true`, React Query sees different array reference → all subscribers re-render.

### Impact

- Every price update (every 100-200ms) creates new array
- `useStocks` returns new `data` reference
- All components using `useStocks` re-render
- Virtual scroll recalculates visible items

### Solution

Change storage structure from array to `Record<ticker, Stock>`:

```typescript
// queryKey: ['stocksMap']
// Data structure: { AAPL: Stock, GOOGL: Stock, ... }

function applyPriceUpdates(
  stocksMap: Record<string, Stock> | undefined,
  updates: WSPriceUpdate[],
) {
  if (!stocksMap) return stocksMap;

  let hasChanges = false;
  const updatedMap = {...stocksMap};

  for (const update of updates) {
    const stock = updatedMap[update.ticker];
    if (stock && stock.currentPrice !== update.price) {
      hasChanges = true;
      updatedMap[update.ticker] = {...stock, currentPrice: update.price};
    }
  }

  return hasChanges ? updatedMap : stocksMap;
}
```

**Benefits:**

- Only ONE record updated, others keep reference
- `structuralSharing: true` works correctly
- Perfect for virtualized table with per-row selector

**No additional dependencies required.**

---

## Problem 3: Unmemoized flattenStocks (High)

### Location

`src/widgets/stock-table/ui/StockTable.tsx:10-13, 32`

### Description

```typescript
function flattenStocks(data: ReturnType<typeof useStocks>['data']): Stock[] {
  if (!data) return [];
  return data.pages.flatMap(page => page.stocks);
}

// In component:
const stocks = flattenStocks(data);
```

### Problem

`flattenStocks` called on every render. Creates new array via `flatMap()`.

### Impact

- Every StockTable re-render → new `stocks` array
- StockTableBody recreates virtualized list
- React Virtual recalculates all virtual items

### Solution

With map-based storage, use `Object.values()` or provide selector for virtual list:

```typescript
// In StockTableBody:
const stocksMap = useStocks().data;
const stocks = useMemo(() => Object.values(stocksMap ?? {}), [stocksMap]);
```

Or better — use React Query selector for each row:

```typescript
// In StockRow component:
const stock = useQuery({
  queryKey: ['stocksMap', ticker],
  select: data => data[ticker],
});
```

This ensures each row only re-renders when its own data changes.

---

## Problem 4: StockChart Subscribed to lastMessage (High)

### Location

`src/widgets/stock-chart/hooks/useChartUpdates.ts:95-113`

### Description

```typescript
useEffect(() => {
  if (!lastMessage || !ticker) return;

  try {
    const rawUpdates = parseWSMessage(lastMessage.data as string);
    for (const raw of rawUpdates) {
      if (raw.ticker === ticker) {
        const update = toWSPriceUpdate(raw);
        bufferRef.current.set(
          `${update.ticker}-${update.timestamp.getTime()}`,
          update,
        );
      }
    }
    throttledFlushRef.current?.();
  } catch {
    console.error('Failed to parse WS message in useChartUpdates');
  }
}, [lastMessage, ticker]);
```

### Problem

`lastMessage` updates every 50ms → `useEffect` triggers → JSON.parse + filtering + throttle.

### Impact

- Chart component re-renders on every WebSocket message
- Unnecessary processing for non-selected stocks

### Solution

Remove `useChartUpdates` entirely. Update chart data through React Query when processing in `usePriceFeed`:

```typescript
// In usePriceFeed, after applying stock updates:
const relevantUpdates = updates.filter(u => u.ticker === selectedTicker);
if (relevantUpdates.length > 0) {
  queryClient.setQueryData(
    ['stockHistory', selectedTicker, timeframe],
    (old: PricePoint[] | undefined) => mergePricePoints(old, relevantUpdates),
  );
}
```

---

## Implementation Priority

1. **Problem 1** — Remove `useChartUpdates`, process all WS messages in `usePriceFeed`
2. **Problem 2** — Migrate to `Record<ticker, Stock>` storage structure
3. **Problem 3** — Update `StockTableBody` and `StockRow` to work with map
4. **Problem 4** — Resolved automatically with Problem 1

---

## Architecture Changes

### Data Structure Migration

Change from array to map-based storage:

```typescript
// Before: ['stocks'] → Stock[]
// After:  ['stocksMap'] → Record<string, Stock>

// API layer converts array to map
function stocksArrayToMap(stocks: Stock[]): Record<string, Stock> {
  return stocks.reduce(
    (acc, stock) => {
      acc[stock.ticker] = stock;
      return acc;
    },
    {} as Record<string, Stock>,
  );
}
```

### Affected Components

1. **`useStocks`** — Returns map, provide helper for iteration
2. **`StockTableBody`** — Use `Object.values(stocksMap)` for virtual list
3. **`StockRow`** — Selector to get single stock by ticker
4. **`usePriceFeed`** — Update single entries in map

---

## Expected Results

| Metric                | Before      | After          |
| --------------------- | ----------- | -------------- |
| Re-renders per second | ~20         | ~1-2           |
| CPU usage             | High        | Normal         |
| JSON.parse calls      | 40/sec      | 20/sec         |
| Virtual scroll recalc | Every 100ms | Only on scroll |
