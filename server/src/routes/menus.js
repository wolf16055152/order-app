import { Router } from 'express'
import { query } from '../config/database.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const menuRes = await query(
      `
      SELECT id, name, description, price, image_url, stock_quantity
      FROM menus
      ORDER BY id ASC;
      `,
    )
    const optionRes = await query(
      `
      SELECT id, menu_id, name, extra_price
      FROM options
      ORDER BY menu_id, id;
      `,
    )

    const optionsByMenu = optionRes.rows.reduce((acc, row) => {
      if (!acc[row.menu_id]) acc[row.menu_id] = []
      acc[row.menu_id].push({
        id: row.id,
        name: row.name,
        extraPrice: Number(row.extra_price),
      })
      return acc
    }, {})

    const menus = menuRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: Number(row.price),
      imageUrl: row.image_url,
      stockQuantity: Number(row.stock_quantity),
      options: optionsByMenu[row.id] ?? [],
    }))

    res.status(200).json({ menus })
  } catch (error) {
    next(error)
  }
})

export default router

