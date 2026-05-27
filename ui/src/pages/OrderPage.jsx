import { useState } from 'react'
import Header from '../components/Header'
import MenuCard from '../components/MenuCard'
import CartPanel from '../components/CartPanel'
import {
  addToCartLines,
  buildCartLine,
  calcCartTotal,
  updateCartLineQuantity,
} from '../utils/cart'

function OrderPage({ activeTab, onTabChange, onCreateOrder, menus }) {
  const [cartLines, setCartLines] = useState([])
  const [orderSubmitting, setOrderSubmitting] = useState(false)

  const cartTotal = calcCartTotal(cartLines)

  function handleAddToCart(menu, selectedOptionIds) {
    setCartLines((prev) => {
      const newLine = buildCartLine(menu, selectedOptionIds)
      return addToCartLines(prev, newLine)
    })
  }

  function handleChangeQuantity(key, delta) {
    setCartLines((prev) => updateCartLineQuantity(prev, key, delta))
  }

  async function handleOrder() {
    if (cartLines.length === 0 || orderSubmitting) return

    setOrderSubmitting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      await onCreateOrder?.(cartLines, cartTotal)
      setCartLines([])
      window.alert('주문이 성공적으로 완료되었습니다!')
    } catch {
      window.alert('주문에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setOrderSubmitting(false)
    }
  }

  return (
    <div className="app-shell order-page">
      <Header activeTab={activeTab} onTabChange={onTabChange} />
      <main className="order-page__main">
        <section className="menu-grid" aria-label="메뉴 목록">
          {menus.map((menu) => (
            <MenuCard key={menu.id} menu={menu} onAddToCart={handleAddToCart} />
          ))}
        </section>
        <CartPanel
          cartLines={cartLines}
          cartTotal={cartTotal}
          onOrder={handleOrder}
          onChangeQuantity={handleChangeQuantity}
          orderSubmitting={orderSubmitting}
        />
      </main>
    </div>
  )
}

export default OrderPage
