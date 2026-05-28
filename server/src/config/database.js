import { Pool } from 'pg'

let pool

function isTrue(value) {
  return String(value).toLowerCase() === 'true'
}

export function getPool() {
  if (pool) return pool

  const usingConnectionString = Boolean(process.env.DATABASE_URL)
  if (!usingConnectionString) {
    const requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
    for (const key of requiredEnv) {
      if (!process.env[key]) {
        throw new Error(`Missing required env: ${key}`)
      }
    }
  }

  const host = process.env.DB_HOST || ''
  const sslEnabled =
    isTrue(process.env.DB_SSL) ||
    process.env.NODE_ENV === 'production' ||
    host.includes('render.com') ||
    host.includes('render.internal') ||
    String(process.env.DATABASE_URL || '').includes('render.com')

  const baseConfig = usingConnectionString
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }

  pool = new Pool({
    ...baseConfig,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
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

export async function getClient() {
  const db = getPool()
  return db.connect()
}

export default getPool

