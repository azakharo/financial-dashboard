import type { Express } from 'express'
import { stocks } from '../data/stocks'
import { getHistory, type Timeframe } from '../data/history'

export function registerHistoryRoutes(app: Express): void {
  app.get('/api/stocks/:ticker/history', (req, res) => {
    const { ticker } = req.params
    const timeframe = (req.query.timeframe as Timeframe) || '1D'

    const validTimeframes: Timeframe[] = ['1D', '1W', '1M', '1Y']
    if (!validTimeframes.includes(timeframe)) {
      res.status(400).json({
        error: `Invalid timeframe. Valid options: ${validTimeframes.join(', ')}`,
      })
      return
    }

    const stock = stocks.find(s => s.ticker === ticker)
    if (!stock) {
      res.status(404).json({ error: 'Stock not found' })
      return
    }

    const history = getHistory(stock, timeframe)
    res.json(history)
  })
}