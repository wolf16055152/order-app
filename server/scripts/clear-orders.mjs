import dotenv from 'dotenv'
import { Client } from 'pg'

dotenv.config()

async function clearOrdersOnly() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  })

  await client.connect()
  await client.query('BEGIN')
  await client.query('DELETE FROM order_item_options')
  await client.query('DELETE FROM order_items')
  await client.query('DELETE FROM orders')
  await client.query('COMMIT')
  await client.end()
  console.log('ORDERS_CLEARED')
}

clearOrdersOnly().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

