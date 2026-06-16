import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { registerStocksRoutes } from './routes/stocks'
import { registerPortfolioRoutes } from './routes/portfolio'
import { registerHistoryRoutes } from './routes/history'
import { setupWebSocket } from './websocket/price-feed'
import { getPreset } from './data/presets'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

const app = express()
const server = createServer(app)

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    preset: getPreset(),
  })
})

registerStocksRoutes(app)
registerPortfolioRoutes(app)
registerHistoryRoutes(app)

setupWebSocket(app, server)

server.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`)
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`)
  console.log(`Preset: ${getPreset()}`)
})