import type { Express } from 'express'
import { getPortfolioState, initPortfolioState, updateStockQuantity, recalculateTotalValue } from '../data/portfolio'
import { stocks } from '../data/stocks'
import { getPreset } from '../data/presets'

export interface BuyRequest {
  ticker: string
  quantity: number
}

export interface SellRequest {
  ticker: string
  quantity: number
}

export interface TradeResponse {
  success: boolean
  newBalance?: number
  newQuantity?: number
  error?: string
}

let initialized = false

function ensureInitialized(): void {
  if (!initialized) {
    initPortfolioState(stocks, getPreset())
    initialized = true
  }
}

export function registerPortfolioRoutes(app: Express): void {
  app.get('/api/portfolio', (_req, res) => {
    ensureInitialized()
    recalculateTotalValue(stocks)
    const state = getPortfolioState()
    res.json(state.portfolio)
  })

  app.post('/api/portfolio/buy', (req, res) => {
    ensureInitialized()
    const { ticker, quantity } = req.body as BuyRequest

    if (!ticker || typeof quantity !== 'number' || quantity <= 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid request: ticker and positive quantity required',
      } as TradeResponse)
      return
    }

    const stock = stocks.find(s => s.ticker === ticker)
    if (!stock) {
      res.status(404).json({
        success: false,
        error: 'Stock not found',
      } as TradeResponse)
      return
    }

    const success = updateStockQuantity(ticker, quantity, stock.currentPrice)
    if (!success) {
      res.status(400).json({
        success: false,
        error: 'Insufficient balance',
      } as TradeResponse)
      return
    }

    stock.quantityInPortfolio += quantity

    const state = getPortfolioState()
    res.json({
      success: true,
      newBalance: state.portfolio.availableBalance,
      newQuantity: state.stockQuantities.get(ticker) || 0,
    } as TradeResponse)
  })

  app.post('/api/portfolio/sell', (req, res) => {
    ensureInitialized()
    const { ticker, quantity } = req.body as SellRequest

    if (!ticker || typeof quantity !== 'number' || quantity <= 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid request: ticker and positive quantity required',
      } as TradeResponse)
      return
    }

    const stock = stocks.find(s => s.ticker === ticker)
    if (!stock) {
      res.status(404).json({
        success: false,
        error: 'Stock not found',
      } as TradeResponse)
      return
    }

    const success = updateStockQuantity(ticker, -quantity, stock.currentPrice)
    if (!success) {
      res.status(400).json({
        success: false,
        error: 'Insufficient stocks to sell',
      } as TradeResponse)
      return
    }

    stock.quantityInPortfolio -= quantity

    const state = getPortfolioState()
    res.json({
      success: true,
      newBalance: state.portfolio.availableBalance,
      newQuantity: state.stockQuantities.get(ticker) || 0,
    } as TradeResponse)
  })
}