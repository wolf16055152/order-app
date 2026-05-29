function normalizeBaseUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/$/, '')
}

function getApiBaseCandidates() {
  const configuredBase = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
  if (configuredBase) {
    return [configuredBase]
  }

  const candidates = []
  const isBrowser = typeof window !== 'undefined'
  if (!isBrowser) {
    return ['http://localhost:3001/api']
  }

  const { host, origin } = window.location
  const protocol = window.location.protocol || 'https:'

  if (host.includes('localhost') || host.startsWith('127.0.0.1')) {
    candidates.push('http://localhost:3001/api')
  } else {
    candidates.push(`${origin}/api`)
    candidates.push('https://order-app-server.onrender.com/api')

    const hostVariants = [
      host.replace('frontends', 'backends'),
      host.replace('frontend', 'backend'),
      host.replace('frontends', 'server'),
      host.replace('frontend', 'server'),
      host.replace('frontends', 'api'),
      host.replace('frontend', 'api'),
    ]

    hostVariants.forEach((variantHost) => {
      if (!variantHost || variantHost === host) return
      candidates.push(`${protocol}//${variantHost}/api`)
    })
  }

  const deduped = []
  const seen = new Set()
  candidates.forEach((candidate) => {
    const normalized = normalizeBaseUrl(candidate)
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    deduped.push(normalized)
  })

  return deduped.length > 0 ? deduped : ['http://localhost:3001/api']
}

const API_BASE_CANDIDATES = getApiBaseCandidates()
let activeApiBaseUrl = API_BASE_CANDIDATES[0]

async function request(path, options = {}) {
  let lastError = null

  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
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
        const shouldTryNextBase = response.status === 404 && !payload?.message
        if (shouldTryNextBase) {
          continue
        }

        const message = payload?.message || '요청 처리 중 오류가 발생했습니다.'
        const error = new Error(message)
        error.status = response.status
        throw error
      }

      activeApiBaseUrl = baseUrl
      return payload
    } catch (error) {
      lastError = error
      const isNetworkError = error instanceof TypeError
      if (!isNetworkError) {
        throw error
      }
    }
  }

  const fallbackError = lastError || new Error('서버 연결에 실패했습니다.')
  fallbackError.message = `${fallbackError.message} (API: ${activeApiBaseUrl})`
  throw fallbackError
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

