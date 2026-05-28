import dotenv from 'dotenv'
import { verifyDbConnection, query } from '../src/config/database.js'
import { initDb } from '../src/db/initDb.js'

dotenv.config()

async function run() {
  await verifyDbConnection()
  await initDb()

  const tablesRes = await query(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('menus', 'options', 'orders', 'order_items', 'order_item_options')
    ORDER BY table_name;
    `,
  )

  console.log('SCHEMA_INIT_DONE')
  console.log(
    JSON.stringify({
      tables: tablesRes.rows.map((row) => row.table_name),
    }),
  )
}

run().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

