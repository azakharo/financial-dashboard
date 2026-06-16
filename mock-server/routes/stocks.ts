import type { Express } from 'express'
import { stocks } from '../data/stocks'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export interface PaginatedResponse<T> {
  stocks: T[]
  nextCursor: string | null
  hasMore: boolean
}

export function registerStocksRoutes(app: Express): void {
  app.get('/api/stocks', (req, res) => {
    const limit = Math.min(
      Math.max(1, parseInt(req.query.limit as string) || DEFAULT_LIMIT),
      MAX_LIMIT
    )
    const cursor = req.query.cursor as string | undefined
    const sector = req.query.sector as string | undefined
    const search = req.query.search as string | undefined

    let filteredStocks = stocks

    if (sector) {
      filteredStocks = filteredStocks.filter(s => s.sector === sector)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredStocks = filteredStocks.filter(
        s =>
          s.ticker.toLowerCase().includes(searchLower) ||
          s.name.toLowerCase().includes(searchLower)
      )
    }

    let startIndex = 0
    if (cursor) {
      const cursorIndex = filteredStocks.findIndex(s => s.ticker === cursor)
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1
      }
    }

    const paginatedStocks = filteredStocks.slice(startIndex, startIndex + limit + 1)
    const hasMore = paginatedStocks.length > limit
    const stocksToReturn = hasMore ? paginatedStocks.slice(0, limit) : paginatedStocks

    const response: PaginatedResponse<typeof stocksToReturn[0]> = {
      stocks: stocksToReturn,
      nextCursor: hasMore ? stocksToReturn[stocksToReturn.length - 1]?.ticker || null : null,
      hasMore,
    }

    res.json(response)
  })
}