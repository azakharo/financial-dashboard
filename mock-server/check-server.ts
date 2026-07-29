import http from 'http'

const PORT = process.env.PORT || 3001
const BASE_URL = `http://localhost:${PORT}`

interface TestResult {
  name: string
  passed: boolean
  error?: string
  data?: unknown
}

async function fetchJSON<T>(
  path: string,
  options?: { method?: string; body?: unknown }
): Promise<{ data: T; status: number }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const options_: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options?.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
    }

    const req = http.request(options_, res => {
      let body = ''
      res.on('data', chunk => (body += chunk))
      res.on('end', () => {
        try {
          resolve({ data: JSON.parse(body) as T, status: res.statusCode || 0 })
        } catch (e) {
          reject(new Error(`Invalid JSON: ${body}`))
        }
      })
    })

    req.on('error', reject)
    if (options?.body) {
      req.write(JSON.stringify(options.body))
    }
    req.end()
  })
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runTests(): Promise<void> {
  const results: TestResult[] = []

  console.log('Running mock server checks...\n')

  // Test 1: Health check
  try {
    const { data, status } = await fetchJSON<{ status: string }>('/api/health')
    results.push({
      name: 'Health check',
      passed: status === 200 && data.status === 'ok',
      data,
    })
  } catch (e) {
    results.push({ name: 'Health check', passed: false, error: String(e) })
  }

  // Test 2: Get stocks
  try {
    const { data, status } = await fetchJSON<{ stocks: unknown[]; hasMore: boolean }>(
      '/api/stocks?limit=10'
    )
    results.push({
      name: 'Get stocks (limit=10)',
      passed: status === 200 && data.stocks?.length === 10 && data.hasMore === true,
      data: { count: data.stocks?.length, hasMore: data.hasMore },
    })
  } catch (e) {
    results.push({ name: 'Get stocks (limit=10)', passed: false, error: String(e) })
  }

  // Test 3: Get stocks with cursor
  try {
    const first = await fetchJSON<{ stocks: { ticker: string }[] }>(
      '/api/stocks?limit=5'
    )
    const lastTicker = first.data.stocks[4]?.ticker
    const second = await fetchJSON<{ stocks: { ticker: string }[] }>(
      `/api/stocks?limit=5&cursor=${lastTicker}`
    )
    const differentTickers = first.data.stocks[0]?.ticker !== second.data.stocks[0]?.ticker
    results.push({
      name: 'Cursor pagination',
      passed: differentTickers,
      data: { firstTicker: first.data.stocks[0]?.ticker, secondTicker: second.data.stocks[0]?.ticker },
    })
  } catch (e) {
    results.push({ name: 'Cursor pagination', passed: false, error: String(e) })
  }

  // Test 4: Get portfolio
  try {
    const { data, status } = await fetchJSON<{ availableBalance: number }>('/api/portfolio')
    results.push({
      name: 'Get portfolio',
      passed: status === 200 && typeof data.availableBalance === 'number',
      data,
    })
  } catch (e) {
    results.push({ name: 'Get portfolio', passed: false, error: String(e) })
  }

  // Test 5: Buy stock
  try {
    const { data, status } = await fetchJSON<{ success: boolean; newBalance: number }>(
      '/api/portfolio/buy',
      { method: 'POST', body: { ticker: 'AAPL', quantity: 5 } }
    )
    results.push({
      name: 'Buy stock (AAPL)',
      passed: status === 200 && data.success === true,
      data,
    })
  } catch (e) {
    results.push({ name: 'Buy stock', passed: false, error: String(e) })
  }

  // Test 6: Get history
  try {
    const { data, status } = await fetchJSON<{ length: number }[]>('/api/stocks/AAPL/history?timeframe=1D')
    results.push({
      name: 'Get stock history',
      passed: status === 200 && Array.isArray(data) && data.length > 0,
      data: { points: data.length },
    })
  } catch (e) {
    results.push({ name: 'Get stock history', passed: false, error: String(e) })
  }

  // Test 7: Sector filter
  try {
    const { data, status } = await fetchJSON<{ stocks: { sector: string }[] }>(
      '/api/stocks?limit=10&sector=Technology'
    )
    const allTech = data.stocks?.every(s => s.sector === 'Technology')
    results.push({
      name: 'Sector filter',
      passed: status === 200 && allTech,
      data: { count: data.stocks?.length, sectors: [...new Set(data.stocks?.map(s => s.sector))] },
    })
  } catch (e) {
    results.push({ name: 'Sector filter', passed: false, error: String(e) })
  }

  // Test 8: Search
  try {
    const { data, status } = await fetchJSON<{ stocks: { ticker: string; name: string }[] }>(
      '/api/stocks?limit=10&search=A'
    )
    const allMatch = data.stocks?.every(
      s => s.ticker.includes('A') || s.name.toLowerCase().includes('a')
    )
    results.push({
      name: 'Search filter',
      passed: status === 200 && allMatch,
      data: { count: data.stocks?.length },
    })
  } catch (e) {
    results.push({ name: 'Search filter', passed: false, error: String(e) })
  }

  // Print results
  console.log('Results:\n')
  for (const result of results) {
    const icon = result.passed ? '✓' : '✗'
    console.log(`  ${icon} ${result.name}`)
    if (result.error) {
      console.log(`    Error: ${result.error}`)
    }
    if (result.data) {
      console.log(`    Data: ${JSON.stringify(result.data)}`)
    }
  }

  const passed = results.filter(r => r.passed).length
  const total = results.length
  console.log(`\n${passed}/${total} tests passed`)

  if (passed !== total) {
    process.exit(1)
  }
}

async function waitForServer(maxAttempts: number = 10): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await fetchJSON('/api/health')
      return true
    } catch {
      await sleep(500)
    }
  }
  return false
}

async function main(): Promise<void> {
  console.log(`Checking server at ${BASE_URL}...\n`)

  const serverReady = await waitForServer()
  if (!serverReady) {
    console.error('Server is not responding. Make sure to start it first with: npm run dev:server')
    process.exit(1)
  }

  await runTests()
}

main().catch(console.error)
