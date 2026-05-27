import { Pool } from 'pg'

let pool

function getPool() {
  if (pool) return pool

  const requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing required env: ${key}`)
    }
  }

  pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  })
  return pool
}

export async function verifyDbConnection() {
  const db = getPool()
  await db.query('SELECT NOW()')
}

export async function query(text, params = []) {
  const db = getPool()
  return db.query(text, params)
}

export default getPool

