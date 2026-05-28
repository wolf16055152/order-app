const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
).replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message = payload?.message || '요청 처리 중 오류가 발생했습니다.'
    throw new Error(message)
  }
  return payload
}

export async function fetchMenus() {
  const data = await request('/menus')
  return data.menus ?? []
}

export async function fetchOrders() {
  const data = await request('/orders')
  return data.orders ?? []
}

export async function createOrder(items, totalAmount) {
  const data = await request('/orders', {
    method: 'POST',
    body: JSON.stringify({ items, totalAmount }),
  })
  return data.order
}

export async function advanceOrderStatus(orderId) {
  const data = await request(`/orders/${orderId}/status`, {
    method: 'PATCH',
  })
  return data.order
}

export async function fetchInventory() {
  const data = await request('/inventory')
  return data.inventory ?? []
}

export async function updateInventory(menuItemId, delta) {
  const data = await request(`/inventory/${menuItemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ delta }),
  })
  return data.inventory
}

