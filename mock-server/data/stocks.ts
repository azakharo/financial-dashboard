import type { Sector, Stock } from '../../src/shared/api/types'
import { SECTORS } from '../../src/shared/api/types'

export type { Sector }
export { SECTORS }

export interface MockStock extends Stock {
  dayInitialPrice: number
}

const COMPANY_SUFFIXES = [
  'Corp', 'Inc', 'Ltd', 'Group', 'Holdings', 'Systems', 'Technologies',
  'Industries', 'Partners', 'Enterprises', 'Solutions', 'Dynamics',
]

function generateTicker(index: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const ticker = []
  let i = index
  for (let pos = 0; pos < 4; pos++) {
    ticker.unshift(chars[i % 26])
    i = Math.floor(i / 26)
  }
  return ticker.join('')
}

function generateCompanyName(ticker: string, index: number): string {
  const suffix = COMPANY_SUFFIXES[index % COMPANY_SUFFIXES.length]
  return `${ticker} ${suffix}`
}

function generateRandomPrice(): number {
  return Math.round((10 + Math.random() * 990) * 100) / 100
}

function generateRandomChange(): number {
  return Math.round((-20 + Math.random() * 40) * 100) / 100
}

export function generateStocks(count: number = 10000): MockStock[] {
  const stocks: MockStock[] = []

  for (let i = 0; i < count; i++) {
    const ticker = generateTicker(i)
    const dayInitialPrice = generateRandomPrice()
    const priceChange24h = generateRandomChange()
    const currentPrice = Math.round(dayInitialPrice * (1 + priceChange24h / 100) * 100) / 100
    stocks.push({
      ticker,
      name: generateCompanyName(ticker, i),
      sector: SECTORS[i % SECTORS.length],
      currentPrice,
      dayInitialPrice,
      priceChange24h,
      quantityInPortfolio: 0,
    })
  }

  return stocks
}

export const stocks: MockStock[] = generateStocks(10000)
