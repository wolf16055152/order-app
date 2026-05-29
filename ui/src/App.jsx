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

function App() {
  const [activeTab, setActiveTab] = useState('order')
  const [menus, setMenus] = useState([])
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [offlineMode, setOfflineMode] = useState(false)
  const [offlineReason, setOfflineReason] = useState('')

  const applyOfflineFallback = useCallback((reason = '') => {
    const offlineMenus = buildOfflineMenus()
    setMenus(offlineMenus)
    setInventory(buildOfflineInventory(offlineMenus))
    setOrders([])
    setOfflineMode(true)
    setOfflineReason(reason)
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
    setOfflineReason('')
  }, [])

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setLoadError('')
        await reloadAll()
      } catch (error) {
        setLoadError('')
        applyOfflineFallback(error.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [applyOfflineFallback, reloadAll])

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

  if (loadError) {
    return (
      <div className="app-shell order-page__main">
        서버 데이터를 불러오지 못했습니다: {loadError}
      </div>
    )
  }

  const offlineBanner = offlineMode ? (
    <div className="offline-banner">
      서버 연결이 불안정하여 임시 모드로 실행 중입니다.
      {offlineReason ? ` (${offlineReason})` : ''}
    </div>
  ) : null

  if (activeTab === 'admin') {
    return (
      <>
        {offlineBanner}
        <AdminPage
          activeTab={activeTab}
          onTabChange={setActiveTab}
          inventory={inventory}
          orders={orders}
          onChangeStock={handleChangeStock}
          onAdvanceOrder={handleAdvanceOrder}
          ORDER_STATUS={ORDER_STATUS}
        />
      </>
    )
  }

  return (
    <>
      {offlineBanner}
      <OrderPage
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCreateOrder={handleCreateOrderFromCart}
        menus={menus}
      />
    </>
  )
}

export default App
