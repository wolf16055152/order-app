import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { query, verifyDbConnection } from './config/database.js'
import { initDb } from './db/initDb.js'
import menusRouter from './routes/menus.js'
import ordersRouter from './routes/orders.js'
import inventoryRouter from './routes/inventory.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000
const DB_RETRY_MS = Number(process.env.DB_RETRY_MS || 10000)
let dbReady = false

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.use('/api', (req, res, next) => {
  if (!dbReady) {
    res.status(503).json({
      message: '데이터베이스를 준비 중입니다. 잠시 후 다시 시도해 주세요.',
    })
    return
  }
  next()
})

app.use('/api/menus', menusRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/inventory', inventoryRouter)

app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'Order app server is running',
    databaseReady: dbReady,
    timestamp: new Date().toISOString(),
  })
})

app.get('/', (req, res) => {
  res.status(200).json({
    message: '커피 주문 앱 서버 정보입니다.',
    backendServer: 'http://localhost:3001',
    frontendServer: 'http://localhost:5173',
  })
})

app.get('/health/db', async (req, res) => {
  if (!dbReady) {
    res.status(503).json({
      ok: false,
      message: 'Database is not ready yet',
    })
    return
  }

  try {
    const result = await query('SELECT NOW() AS now')
    res.status(200).json({
      ok: true,
      message: 'Database connection is healthy',
      databaseTime: result.rows[0].now,
    })
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Database connection failed',
      error: error.message,
    })
  }
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({
    message: '서버 오류가 발생했습니다.',
    error: err.message,
  })
})

// TODO: PRD backend routes
// - GET /menus
// - POST /orders
// - GET /orders/:orderId
// - PATCH /orders/:orderId/status
// - PATCH /inventory/:menuItemId

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function initializeDatabaseWithRetry() {
  let attempt = 0
  while (!dbReady) {
    attempt += 1
    try {
      await verifyDbConnection()
      console.log('Database connected')
      await initDb()
      console.log('Database schema initialized')
      dbReady = true
      return
    } catch (error) {
      console.error(
        `Database initialization failed (attempt ${attempt}):`,
        error.message,
      )
      await sleep(DB_RETRY_MS)
    }
  }
}

function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`)
      initializeDatabaseWithRetry().catch((error) => {
        console.error('Unexpected database retry loop failure:', error.message)
      })
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()

