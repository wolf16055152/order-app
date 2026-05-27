import { useMemo, useState } from 'react'
import './App.css'
import OrderPage from './pages/OrderPage'
import AdminPage from './pages/AdminPage'
import { MENUS } from './data/menus'

const ORDER_STATUS = {
  PENDING: 'PENDING',
  IN_PREPARATION: 'IN_PREPARATION',
  COMPLETED: 'COMPLETED',
}

function App() {
  const [activeTab, setActiveTab] = useState('order')

  const inventoryMenus = useMemo(() => MENUS.slice(0, 3), [])
  const [inventory, setInventory] = useState(() =>
    inventoryMenus.map((m) => ({
      menuItemId: m.id,
      name: m.name,
      stockQuantity: 10,
    })),
  )

  const [orders, setOrders] = useState([])

  function handleCreateOrderFromCart(cartLines, cartTotal) {
    if (!cartLines || cartLines.length === 0) return
    const now = new Date()
    const id = `order-${now.getTime()}-${orders.length + 1}`
    const items = cartLines.map((line) => ({
      menuItemId: line.menuItemId,
      menuName: line.menuName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    }))
    const newOrder = {
      id,
      orderedAt: now.toISOString(),
      status: ORDER_STATUS.PENDING,
      items,
      totalAmount: cartTotal,
    }
    setOrders((prev) => [...prev, newOrder])
  }

  function handleChangeStock(menuItemId, delta) {
    setInventory((prev) =>
      prev.map((it) => {
        if (it.menuItemId !== menuItemId) return it
        const next = Math.max(0, it.stockQuantity + delta)
        return { ...it, stockQuantity: next }
      }),
    )
  }

  function handleAdvanceOrder(orderId) {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o
        if (o.status === ORDER_STATUS.PENDING) {
          return { ...o, status: ORDER_STATUS.IN_PREPARATION }
        }
        if (o.status === ORDER_STATUS.IN_PREPARATION) {
          return { ...o, status: ORDER_STATUS.COMPLETED }
        }
        return o
      }),
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
    />
  )
}

export default App
