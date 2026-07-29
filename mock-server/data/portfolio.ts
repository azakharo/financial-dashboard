import type { MockMockStock } from './stocks'

export interface Portfolio {
  totalValue: number
  availableBalance: number
  dailyChangePercent: number
}

export interface PortfolioState {
  portfolio: Portfolio
  stockQuantities: Map<string, number>
  startValueDay: number
}

export const DEFAULT_BALANCE = 50000

export function createPortfolioState(
  stocks: MockStock[],
  preset: 'default' | 'empty' = 'default'
): PortfolioState {
  const state: PortfolioState = {
    portfolio: {
      totalValue: 0,
      availableBalance: DEFAULT_BALANCE,
      dailyChangePercent: 0,
    },
    stockQuantities: new Map(),
    startValueDay: DEFAULT_BALANCE,
  }

  if (preset === 'default') {
    const portfolioMockStocks = stocks.slice(0, 10)
    for (const stock of portfolioMockStocks) {
      const quantity = Math.floor(10 + Math.random() * 90)
      state.stockQuantities.set(stock.ticker, quantity)
      stock.quantityInPortfolio = quantity
      state.portfolio.totalValue += quantity * stock.currentPrice
    }
  }

  state.startValueDay = state.portfolio.totalValue + state.portfolio.availableBalance

  return state
}

let portfolioState: PortfolioState

export function initPortfolioState(stocks: MockStock[], preset: 'default' | 'empty'): void {
  portfolioState = createPortfolioState(stocks, preset)
}

export function getPortfolioState(): PortfolioState {
  return portfolioState
}

export function updateMockStockQuantity(ticker: string, delta: number, price: number): boolean {
  const currentQuantity = portfolioState.stockQuantities.get(ticker) || 0
  const newQuantity = currentQuantity + delta

  if (newQuantity < 0) {
    return false
  }

  const cost = delta * price

  if (delta > 0 && cost > portfolioState.portfolio.availableBalance) {
    return false
  }

  portfolioState.stockQuantities.set(ticker, newQuantity)
  portfolioState.portfolio.availableBalance -= cost
  portfolioState.portfolio.totalValue += cost

  return true
}

export function recalculateTotalValue(stocks: MockStock[]): void {
  let total = 0
  for (const [ticker, quantity] of portfolioState.stockQuantities) {
    const stock = stocks.find(s => s.ticker === ticker)
    if (stock) {
      total += quantity * stock.currentPrice
    }
  }
  portfolioState.portfolio.totalValue = total + portfolioState.portfolio.availableBalance

  if (portfolioState.startValueDay > 0) {
    portfolioState.portfolio.dailyChangePercent =
      ((portfolioState.portfolio.totalValue - portfolioState.startValueDay) / portfolioState.startValueDay) * 100
  }
}
