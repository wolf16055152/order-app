import dotenv from 'dotenv'
import { Client } from 'pg'

dotenv.config()

async function ensureDatabase() {
  const targetDatabase = process.env.DB_NAME
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  })

  await client.connect()
  const existing = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [targetDatabase],
  )

  if (existing.rowCount === 0) {
    await client.query(`CREATE DATABASE "${targetDatabase}"`)
    console.log(`CREATED_DB:${targetDatabase}`)
  } else {
    console.log(`DB_EXISTS:${targetDatabase}`)
  }

  await client.end()
}

ensureDatabase().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

