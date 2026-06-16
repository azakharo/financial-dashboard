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

const TICKER_PREFIXES = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
]

const COMPANY_SUFFIXES = [
  'Corp', 'Inc', 'Ltd', 'Group', 'Holdings', 'Systems', 'Technologies',
  'Industries', 'Partners', 'Enterprises', 'Solutions', 'Dynamics',
]

function generateTicker(index: number): string {
  if (index < 26) {
    return TICKER_PREFIXES[index]
  }
  const first = Math.floor(index / 26)
  const second = index % 26
  return TICKER_PREFIXES[first] + TICKER_PREFIXES[second]
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
