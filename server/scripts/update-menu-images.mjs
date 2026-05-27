import dotenv from 'dotenv'
import { Client } from 'pg'

dotenv.config()

async function run() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  })

  await client.connect()
  await client.query('BEGIN')

  await client.query(
    `
    UPDATE menus
    SET image_url = CASE id
      WHEN 'americano-ice' THEN '/images/americano-ice.jpg'
      WHEN 'americano-hot' THEN '/images/americano-hot.jpg'
      WHEN 'cafe-latte' THEN '/images/caffe-latte.jpg'
      ELSE image_url
    END,
    updated_at = NOW()
    WHERE id IN ('americano-ice', 'americano-hot', 'cafe-latte');
    `,
  )

  const check = await client.query(
    `
    SELECT id, image_url
    FROM menus
    WHERE id IN ('americano-ice', 'americano-hot', 'cafe-latte')
    ORDER BY id;
    `,
  )

  await client.query('COMMIT')
  await client.end()

  console.log(JSON.stringify(check.rows))
}

run().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

