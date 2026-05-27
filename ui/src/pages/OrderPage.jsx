import { useState } from 'react'
import Header from '../components/Header'
import MenuCard from '../components/MenuCard'
import CartPanel from '../components/CartPanel'
import { MENUS } from '../data/menus'
import {
  addToCartLines,
  buildCartLine,
  calcCartTotal,
  updateCartLineQuantity,
} from '../utils/cart'

function OrderPage({ activeTab, onTabChange, onCreateOrder }) {
  const [cartLines, setCartLines] = useState([])
  const [orderMessage, setOrderMessage] = useState('')
  const [orderSubmitting, setOrderSubmitting] = useState(false)

  const cartTotal = calcCartTotal(cartLines)

  function handleAddToCart(menu, selectedOptionIds) {
    setCartLines((prev) => {
      const newLine = buildCartLine(menu, selectedOptionIds)
      return addToCartLines(prev, newLine)
    })
    setOrderMessage('')
  }

  function handleChangeQuantity(key, delta) {
    setCartLines((prev) => updateCartLineQuantity(prev, key, delta))
    setOrderMessage('')
  }

  async function handleOrder() {
    if (cartLines.length === 0 || orderSubmitting) return

    setOrderSubmitting(true)
    setOrderMessage('')

    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      onCreateOrder?.(cartLines, cartTotal)
      setCartLines([])
      setOrderMessage('주문이 완료되었습니다. 감사합니다!')
    } catch {
      setOrderMessage('주문에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setOrderSubmitting(false)
    }
  }

  return (
    <div className="app-shell order-page">
      <Header activeTab={activeTab} onTabChange={onTabChange} />
      <main className="order-page__main">
        <section className="menu-grid" aria-label="메뉴 목록">
          {MENUS.map((menu) => (
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
        {orderMessage && (
          <p className="order-page__toast" role="status">
            {orderMessage}
          </p>
        )}
      </main>
    </div>
  )
}

export default OrderPage
