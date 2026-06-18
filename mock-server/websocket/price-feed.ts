import type { Express } from 'express'
import { WebSocket, WebSocketServer } from 'ws'
import { stocks } from '../data/stocks'
import { addPricePoint } from '../data/history'
import { recalculateTotalValue } from '../data/portfolio'

const isSingleStockPriceUpdate = true

export interface WSPriceUpdate {
  ticker: string
  price: number
  timestamp: string
}

export class PriceBroadcaster {
  private intervalId: NodeJS.Timeout | null = null
  private clients: Set<WebSocket> = new Set()
  private updateInterval: number

  constructor(updateInterval: number = 50) {
    this.updateInterval = updateInterval
  }

  addClient(ws: WebSocket): void {
    this.clients.add(ws)
    ws.onclose = () => {
      this.clients.delete(ws)
    }
  }

  start(): void {
    if (this.intervalId) return

    this.intervalId = setInterval(() => {
      this.broadcastPriceUpdates()
    }, this.updateInterval)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private broadcastPriceUpdates(): void {
    if (this.clients.size === 0) return

    const updates: WSPriceUpdate[] = []

    if (isSingleStockPriceUpdate) {
      const stock = stocks[0]

      const changePercent = (Math.random() - 0.5) * 0.01
      stock.currentPrice = Math.round(stock.currentPrice * (1 + changePercent) * 100) / 100

      if (stock.currentPrice < 0.01) {
        stock.currentPrice = 0.01
      }

      const update: WSPriceUpdate = {
        ticker: stock.ticker,
        price: stock.currentPrice,
        timestamp: new Date().toISOString(),
      }

      updates.push(update)
      addPricePoint(stock.ticker, stock.currentPrice)
    } else {
      for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * stocks.length)
        const stock = stocks[randomIndex]

        const changePercent = (Math.random() - 0.5) * 0.01
        stock.currentPrice = Math.round(stock.currentPrice * (1 + changePercent) * 100) / 100

        if (stock.currentPrice < 0.01) {
          stock.currentPrice = 0.01
        }

        const update: WSPriceUpdate = {
          ticker: stock.ticker,
          price: stock.currentPrice,
          timestamp: new Date().toISOString(),
        }

        updates.push(update)
        addPricePoint(stock.ticker, stock.currentPrice)
      }
    }

    recalculateTotalValue(stocks)

    const message = JSON.stringify(updates)
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    }
  }
}

export function setupWebSocket(_app: Express, server: import('http').Server): PriceBroadcaster {
  const broadcaster = new PriceBroadcaster(50)

  const wss = new WebSocketServer({ noServer: true })

  wss.on('connection', (ws: WebSocket) => {
    broadcaster.addClient(ws)
  })

  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    }
  })

  broadcaster.start()
  console.log(`WebSocket mode: ${isSingleStockPriceUpdate ? 'single stock update' : 'multi stock update'}`)
  return broadcaster
}
