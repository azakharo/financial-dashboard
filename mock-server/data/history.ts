import type { Stock } from './stocks'

export type Timeframe = '1D' | '1W' | '1M' | '1Y'

export interface PricePoint {
  timestamp: string
  price: number
}

const TIMEFRAME_CONFIG: Record<Timeframe, { points: number; intervalMs: number }> = {
  '1D': { points: 96, intervalMs: 15 * 60 * 1000 },
  '1W': { points: 168, intervalMs: 60 * 60 * 1000 },
  '1M': { points: 30, intervalMs: 24 * 60 * 60 * 1000 },
  '1Y': { points: 365, intervalMs: 24 * 60 * 60 * 1000 },
}

export function generateHistory(stock: Stock, timeframe: Timeframe): PricePoint[] {
  const config = TIMEFRAME_CONFIG[timeframe]
  const now = new Date()
  const points: PricePoint[] = []

  let price = stock.currentPrice * (1 - stock.priceChange24h / 100)

  for (let i = config.points - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * config.intervalMs)
    const change = (Math.random() - 0.5) * 0.02 * price
    price = Math.max(0.01, price + change)

    points.push({
      timestamp: timestamp.toISOString(),
      price: Math.round(price * 100) / 100,
    })
  }

  return points
}

export function generateIntradayHistory(stock: Stock): PricePoint[] {
  return generateHistory(stock, '1D')
}

const historyCache = new Map<string, Map<Timeframe, PricePoint[]>>()

export function getHistory(stock: Stock, timeframe: Timeframe): PricePoint[] {
  let tickerCache = historyCache.get(stock.ticker)
  if (!tickerCache) {
    tickerCache = new Map()
    historyCache.set(stock.ticker, tickerCache)
  }

  let history = tickerCache.get(timeframe)
  if (!history) {
    history = generateHistory(stock, timeframe)
    tickerCache.set(timeframe, history)
  }

  return history
}

export function addPricePoint(ticker: string, price: number): void {
  const tickerCache = historyCache.get(ticker)
  if (!tickerCache) return

  const now = new Date().toISOString()

  for (const points of tickerCache.values()) {
    points.push({ timestamp: now, price })
    if (points.length > 500) {
      points.shift()
    }
  }
}
