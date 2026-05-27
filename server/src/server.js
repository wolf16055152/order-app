import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { query, verifyDbConnection } from './config/database.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'Order app server is running',
    timestamp: new Date().toISOString(),
  })
})

app.get('/', (req, res) => {
  res.status(200).json({
    message: '커피 주문 앱 백엔드 서버가 실행 중입니다.',
  })
})

app.get('/health/db', async (req, res) => {
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

// TODO: PRD backend routes
// - GET /menus
// - POST /orders
// - GET /orders/:orderId
// - PATCH /orders/:orderId/status
// - PATCH /inventory/:menuItemId

async function startServer() {
  try {
    await verifyDbConnection()
    console.log('Database connected')

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()

