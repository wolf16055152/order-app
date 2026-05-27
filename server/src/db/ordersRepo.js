import { query } from '../config/database.js'

function buildOrderMap(orderRows) {
  const map = new Map()
  for (const row of orderRows) {
    map.set(String(row.id), {
      id: String(row.id),
      orderedAt: row.ordered_at,
      status: row.status,
      totalAmount: Number(row.total_amount),
      items: [],
    })
  }
  return map
}

export async function fetchOrders({ orderId } = {}) {
  const params = []
  let where = ''
  if (orderId) {
    params.push(orderId)
    where = `WHERE o.id = $${params.length}`
  }

  const ordersRes = await query(
    `
    SELECT o.id, o.ordered_at, o.status, o.total_amount
    FROM orders o
    ${where}
    ORDER BY o.ordered_at DESC;
    `,
    params,
  )
  if (ordersRes.rowCount === 0) return []

  const orderIds = ordersRes.rows.map((r) => r.id)
  const map = buildOrderMap(ordersRes.rows)

  const itemsRes = await query(
    `
    SELECT oi.id, oi.order_id, oi.menu_id, oi.menu_name, oi.quantity, oi.unit_price, oi.line_total
    FROM order_items oi
    WHERE oi.order_id = ANY($1::bigint[])
    ORDER BY oi.id ASC;
    `,
    [orderIds],
  )

  const itemIds = itemsRes.rows.map((r) => r.id)
  let optionsByItemId = new Map()
  if (itemIds.length > 0) {
    const optionsRes = await query(
      `
      SELECT oio.order_item_id, oio.option_id, oio.option_name, oio.extra_price
      FROM order_item_options oio
      WHERE oio.order_item_id = ANY($1::bigint[])
      ORDER BY oio.id ASC;
      `,
      [itemIds],
    )
    optionsByItemId = optionsRes.rows.reduce((acc, row) => {
      const key = String(row.order_item_id)
      if (!acc.has(key)) acc.set(key, [])
      acc.get(key).push({
        optionId: row.option_id,
        optionName: row.option_name,
        extraPrice: Number(row.extra_price),
      })
      return acc
    }, new Map())
  }

  for (const row of itemsRes.rows) {
    const order = map.get(String(row.order_id))
    if (!order) continue
    const options = optionsByItemId.get(String(row.id)) ?? []
    order.items.push({
      menuId: row.menu_id,
      menuName: row.menu_name,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unit_price),
      lineTotal: Number(row.line_total),
      optionIds: options.map((o) => o.optionId),
      optionNames: options.map((o) => o.optionName),
      optionDetails: options,
    })
  }

  return Array.from(map.values())
}

