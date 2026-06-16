export const SECTORS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Consumer',
  'Energy',
  'Industrial',
] as const

export type Sector = (typeof SECTORS)[number]

export interface Stock {
  ticker: string
  name: string
  sector: Sector
  currentPrice: number
  priceChange24h: number
  quantityInPortfolio: number
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

export function generateStocks(count: number = 10000): Stock[] {
  const stocks: Stock[] = []

  for (let i = 0; i < count; i++) {
    const ticker = generateTicker(i)
    stocks.push({
      ticker,
      name: generateCompanyName(ticker, i),
      sector: SECTORS[i % SECTORS.length],
      currentPrice: generateRandomPrice(),
      priceChange24h: generateRandomChange(),
      quantityInPortfolio: 0,
    })
  }

  return stocks
}

export const stocks: Stock[] = generateStocks(10000)
