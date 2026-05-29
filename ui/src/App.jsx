import { useCallback, useEffect, useState } from 'react'
import './App.css'
import OrderPage from './pages/OrderPage'
import AdminPage from './pages/AdminPage'
import {
  advanceOrderStatus,
  createOrder,
  fetchInventory,
  fetchMenus,
  fetchOrders,
  updateInventory,
} from './api/client'
import { MENUS } from './data/menus'

const ORDER_STATUS = {
  PENDING: 'PENDING',
  IN_PREPARATION: 'IN_PREPARATION',
  COMPLETED: 'COMPLETED',
}
const INITIAL_LOAD_TIMEOUT_MS = 3000

function buildOfflineMenus() {
  return MENUS.slice(0, 3).map((menu) => ({
    ...menu,
    options: (menu.options || []).map((option) => ({ ...option })),
  }))
}

function buildOfflineInventory(sourceMenus) {
  return sourceMenus.map((menu) => ({
    menuItemId: menu.id,
    name: menu.name,
    stockQuantity: 12,
  }))
}

function getNextOrderStatus(status) {
  if (status === ORDER_STATUS.PENDING) return ORDER_STATUS.IN_PREPARATION
  if (status === ORDER_STATUS.IN_PREPARATION) return ORDER_STATUS.COMPLETED
  return status
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function App() {
  const [activeTab, setActiveTab] = useState('order')
  const [menus, setMenus] = useState([])
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)

  const applyOfflineFallback = useCallback(() => {
    const offlineMenus = buildOfflineMenus()
    setMenus(offlineMenus)
    setInventory(buildOfflineInventory(offlineMenus))
    setOrders([])
    setOfflineMode(true)
  }, [])

  const reloadAll = useCallback(async () => {
    const [menusData, ordersData, inventoryData] = await Promise.all([
      fetchMenus(),
      fetchOrders(),
      fetchInventory(),
    ])
    setMenus(
      menusData.map((menu) => ({
        ...menu,
        basePrice: menu.price,
      })),
    )
    setOrders(ordersData)
    setInventory(inventoryData.slice(0, 3))
    setOfflineMode(false)
  }, [])

  const loadWithRetry = useCallback(async () => {
    const attempts = 3
    let lastError = null
    for (let i = 0; i < attempts; i += 1) {
      try {
        await reloadAll()
        return
      } catch (error) {
        lastError = error
        if (i < attempts - 1) {
          await wait(2000)
        }
      }
    }
    throw lastError || new Error('서버 연결에 실패했습니다.')
  }, [reloadAll])

  useEffect(() => {
    let isCancelled = false
    let fallbackTimerId = null
    let hasShownFallback = false

    async function load() {
      try {
        setLoading(true)
        fallbackTimerId = setTimeout(() => {
          if (isCancelled || hasShownFallback) return
          hasShownFallback = true
          applyOfflineFallback()
          setLoading(false)
        }, INITIAL_LOAD_TIMEOUT_MS)

        await loadWithRetry()
      } catch {
        if (isCancelled || hasShownFallback) return
        hasShownFallback = true
        applyOfflineFallback()
        setLoading(false)
        return
      }

      if (isCancelled) return
      clearTimeout(fallbackTimerId)
      setLoading(false)
    }

    load()

    return () => {
      isCancelled = true
      clearTimeout(fallbackTimerId)
    }
  }, [applyOfflineFallback, loadWithRetry])

  useEffect(() => {
    if (!offlineMode) return
    const timerId = setInterval(async () => {
      try {
        await reloadAll()
      } catch {
        // keep offline mode until server recovers
      }
    }, 15000)
    return () => clearInterval(timerId)
  }, [offlineMode, reloadAll])

  async function handleCreateOrderFromCart(cartLines, cartTotal) {
    if (offlineMode) {
      const offlineOrder = {
        id: `offline-${Date.now()}`,
        orderedAt: new Date().toISOString(),
        totalAmount: cartTotal,
        status: ORDER_STATUS.PENDING,
        items: cartLines.map((line) => ({
          menuName: line.menuName,
          quantity: line.quantity,
          options: line.selectedOptionLabels ?? [],
          lineTotal: line.lineTotal,
        })),
      }
      setOrders((prev) => [offlineOrder, ...prev])
      setInventory((prev) =>
        prev.map((item) => {
          const ordered = cartLines
            .filter((line) => line.menuItemId === item.menuItemId)
            .reduce((sum, line) => sum + line.quantity, 0)
          if (ordered === 0) return item
          return {
            ...item,
            stockQuantity: Math.max(0, item.stockQuantity - ordered),
          }
        }),
      )
      return
    }

    const items = cartLines.map((line) => ({
      menuId: line.menuItemId,
      quantity: line.quantity,
      optionIds: line.selectedOptionIds ?? [],
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    }))
    await createOrder(items, cartTotal)
    await reloadAll()
  }

  async function handleChangeStock(menuItemId, delta) {
    if (offlineMode) {
      setInventory((prev) =>
        prev.map((item) => {
          if (item.menuItemId !== menuItemId) return item
          return {
            ...item,
            stockQuantity: Math.max(0, item.stockQuantity + delta),
          }
        }),
      )
      return
    }

    const updated = await updateInventory(menuItemId, delta)
    setInventory((prev) =>
      prev.map((it) => (it.menuItemId === menuItemId ? updated : it)),
    )
  }

  async function handleAdvanceOrder(orderId) {
    if (offlineMode) {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: getNextOrderStatus(order.status) }
            : order,
        ),
      )
      return
    }

    const updated = await advanceOrderStatus(orderId)
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
  }

  if (loading) {
    return <div className="app-shell order-page__main">불러오는 중...</div>
  }

  if (activeTab === 'admin') {
    return (
      <AdminPage
        activeTab={activeTab}
        onTabChange={setActiveTab}
        inventory={inventory}
        orders={orders}
        onChangeStock={handleChangeStock}
        onAdvanceOrder={handleAdvanceOrder}
        ORDER_STATUS={ORDER_STATUS}
      />
    )
  }

  return (
    <OrderPage
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onCreateOrder={handleCreateOrderFromCart}
      menus={menus}
    />
  )
}

export default App
