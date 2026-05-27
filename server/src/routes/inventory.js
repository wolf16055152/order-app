import { Router } from 'express'
import { query } from '../config/database.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `
      SELECT id AS "menuItemId", name, stock_quantity AS "stockQuantity"
      FROM menus
      ORDER BY id ASC;
      `,
    )
    const inventory = result.rows.map((row) => ({
      menuItemId: row.menuItemId,
      name: row.name,
      stockQuantity: Number(row.stockQuantity),
    }))
    res.status(200).json({ inventory })
  } catch (error) {
    next(error)
  }
})

router.patch('/:menuItemId', async (req, res, next) => {
  try {
    const { menuItemId } = req.params
    const { delta, stockQuantity } = req.body ?? {}

    let nextStock
    if (typeof stockQuantity === 'number') {
      nextStock = Math.max(0, Math.floor(stockQuantity))
    } else if (typeof delta === 'number') {
      const currentRes = await query(
        'SELECT stock_quantity FROM menus WHERE id = $1',
        [menuItemId],
      )
      if (currentRes.rowCount === 0) {
        return res.status(404).json({ message: '메뉴를 찾을 수 없습니다.' })
      }
      nextStock = Math.max(0, Number(currentRes.rows[0].stock_quantity) + Math.floor(delta))
    } else {
      return res.status(400).json({
        message: 'delta 또는 stockQuantity 중 하나를 숫자로 전달해야 합니다.',
      })
    }

    const updateRes = await query(
      `
      UPDATE menus
      SET stock_quantity = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id AS "menuItemId", name, stock_quantity AS "stockQuantity";
      `,
      [menuItemId, nextStock],
    )
    if (updateRes.rowCount === 0) {
      return res.status(404).json({ message: '메뉴를 찾을 수 없습니다.' })
    }

    const updated = updateRes.rows[0]
    return res.status(200).json({
      inventory: {
        menuItemId: updated.menuItemId,
        name: updated.name,
        stockQuantity: Number(updated.stockQuantity),
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router

