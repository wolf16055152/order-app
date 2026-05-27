import { Router } from 'express'
import { getClient, query } from '../config/database.js'
import { fetchOrders } from '../db/ordersRepo.js'

const router = Router()

const ORDER_STATUS = {
  PENDING: 'PENDING',
  IN_PREPARATION: 'IN_PREPARATION',
  COMPLETED: 'COMPLETED',
}

function nextStatus(current) {
  if (current === ORDER_STATUS.PENDING) return ORDER_STATUS.IN_PREPARATION
  if (current === ORDER_STATUS.IN_PREPARATION) return ORDER_STATUS.COMPLETED
  return ORDER_STATUS.COMPLETED
}

router.get('/', async (req, res, next) => {
  try {
    const orders = await fetchOrders()
    res.status(200).json({ orders })
  } catch (error) {
    next(error)
  }
})

router.get('/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params
    const orders = await fetchOrders({ orderId })
    if (orders.length === 0) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' })
    }
    return res.status(200).json({ order: orders[0] })
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  const client = await getClient()
  try {
    const { items, totalAmount } = req.body ?? {}
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: '주문 항목(items)이 필요합니다.' })
    }

    const normalizedItems = items.map((item) => ({
      menuId: item.menuId,
      quantity: Number(item.quantity),
      optionIds: Array.isArray(item.optionIds) ? item.optionIds : [],
    }))

    if (normalizedItems.some((item) => !item.menuId || item.quantity <= 0)) {
      return res.status(400).json({ message: 'menuId와 quantity를 확인해 주세요.' })
    }

    const menuIds = [...new Set(normalizedItems.map((item) => item.menuId))]
    const menuRes = await client.query(
      `
      SELECT id, name, price, stock_quantity
      FROM menus
      WHERE id = ANY($1::text[]);
      `,
      [menuIds],
    )
    const menuMap = new Map(menuRes.rows.map((row) => [row.id, row]))
    if (menuMap.size !== menuIds.length) {
      return res.status(400).json({ message: '존재하지 않는 메뉴가 포함되어 있습니다.' })
    }

    const optionIds = [
      ...new Set(normalizedItems.flatMap((item) => item.optionIds)),
    ]
    let optionRows = []
    if (optionIds.length > 0) {
      const optionRes = await client.query(
        `
        SELECT id, menu_id, name, extra_price
        FROM options
        WHERE id = ANY($1::text[]);
        `,
        [optionIds],
      )
      optionRows = optionRes.rows
    }
    const optionsByMenu = optionRows.reduce((acc, row) => {
      if (!acc[row.menu_id]) acc[row.menu_id] = new Map()
      acc[row.menu_id].set(row.id, row)
      return acc
    }, {})

    const stockDeltaByMenu = new Map()
    const orderLines = normalizedItems.map((item) => {
      const menu = menuMap.get(item.menuId)
      const optionMap = optionsByMenu[item.menuId] ?? new Map()
      const selectedOptions = item.optionIds.map((optionId) => {
        const option = optionMap.get(optionId)
        if (!option) {
          throw new Error(`옵션이 메뉴와 맞지 않습니다: ${optionId}`)
        }
        return option
      })

      const optionExtra = selectedOptions.reduce(
        (sum, option) => sum + Number(option.extra_price),
        0,
      )
      const unitPrice = Number(menu.price) + optionExtra
      const lineTotal = unitPrice * item.quantity

      stockDeltaByMenu.set(
        item.menuId,
        (stockDeltaByMenu.get(item.menuId) ?? 0) + item.quantity,
      )

      return {
        menuId: item.menuId,
        menuName: menu.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        options: selectedOptions.map((option) => ({
          optionId: option.id,
          optionName: option.name,
          extraPrice: Number(option.extra_price),
        })),
      }
    })

    for (const [menuId, quantity] of stockDeltaByMenu.entries()) {
      const menu = menuMap.get(menuId)
      if (Number(menu.stock_quantity) < quantity) {
        return res.status(409).json({
          message: `재고가 부족합니다: ${menu.name}`,
        })
      }
    }

    const calculatedTotal = orderLines.reduce((sum, line) => sum + line.lineTotal, 0)
    if (
      typeof totalAmount === 'number' &&
      Number.isFinite(totalAmount) &&
      totalAmount !== calculatedTotal
    ) {
      return res.status(400).json({ message: '총 금액이 올바르지 않습니다.' })
    }

    await client.query('BEGIN')

    const orderInsertRes = await client.query(
      `
      INSERT INTO orders (status, total_amount)
      VALUES ($1, $2)
      RETURNING id;
      `,
      [ORDER_STATUS.PENDING, calculatedTotal],
    )
    const orderId = orderInsertRes.rows[0].id

    for (const line of orderLines) {
      const itemInsertRes = await client.query(
        `
        INSERT INTO order_items (order_id, menu_id, menu_name, quantity, unit_price, line_total)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
        `,
        [
          orderId,
          line.menuId,
          line.menuName,
          line.quantity,
          line.unitPrice,
          line.lineTotal,
        ],
      )
      const orderItemId = itemInsertRes.rows[0].id

      for (const option of line.options) {
        await client.query(
          `
          INSERT INTO order_item_options (order_item_id, option_id, option_name, extra_price)
          VALUES ($1, $2, $3, $4);
          `,
          [orderItemId, option.optionId, option.optionName, option.extraPrice],
        )
      }
    }

    for (const [menuId, quantity] of stockDeltaByMenu.entries()) {
      await client.query(
        `
        UPDATE menus
        SET stock_quantity = stock_quantity - $2, updated_at = NOW()
        WHERE id = $1;
        `,
        [menuId, quantity],
      )
    }

    await client.query('COMMIT')

    const createdOrder = (await fetchOrders({ orderId })).at(0)
    return res.status(201).json({ order: createdOrder })
  } catch (error) {
    await client.query('ROLLBACK')
    return next(error)
  } finally {
    client.release()
  }
})

router.patch('/:orderId/status', async (req, res, next) => {
  try {
    const { orderId } = req.params
    const { status } = req.body ?? {}
    const currentRes = await query('SELECT status FROM orders WHERE id = $1', [orderId])
    if (currentRes.rowCount === 0) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' })
    }

    const current = currentRes.rows[0].status
    const target = status || nextStatus(current)
    const allowedNext = nextStatus(current)
    if (target !== allowedNext && target !== current) {
      return res.status(400).json({
        message: `허용되지 않는 상태 변경입니다. 현재 상태(${current})에서 ${allowedNext}만 가능합니다.`,
      })
    }

    await query('UPDATE orders SET status = $2 WHERE id = $1', [orderId, target])
    const updatedOrder = (await fetchOrders({ orderId })).at(0)
    return res.status(200).json({ order: updatedOrder })
  } catch (error) {
    return next(error)
  }
})

export default router

