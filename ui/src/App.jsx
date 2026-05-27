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

const ORDER_STATUS = {
  PENDING: 'PENDING',
  IN_PREPARATION: 'IN_PREPARATION',
  COMPLETED: 'COMPLETED',
}

function App() {
  const [activeTab, setActiveTab] = useState('order')
  const [menus, setMenus] = useState([])
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

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
  }, [])

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setLoadError('')
        await reloadAll()
      } catch (error) {
        setLoadError(error.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [reloadAll])

  async function handleCreateOrderFromCart(cartLines, cartTotal) {
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
    const updated = await updateInventory(menuItemId, delta)
    setInventory((prev) =>
      prev.map((it) => (it.menuItemId === menuItemId ? updated : it)),
    )
  }

  async function handleAdvanceOrder(orderId) {
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
