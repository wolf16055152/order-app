import { formatPrice } from '../utils/formatPrice'
import { formatCartItemName } from '../utils/cart'

function QuantityStepper({ quantity, onDecrease, onIncrease }) {
  return (
    <div className="cart-panel__stepper">
      <button
        type="button"
        className="cart-panel__stepper-btn"
        aria-label="수량 줄이기"
        onClick={onDecrease}
      >
        −
      </button>
      <span className="cart-panel__stepper-value" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        className="cart-panel__stepper-btn"
        aria-label="수량 늘리기"
        onClick={onIncrease}
      >
        +
      </button>
    </div>
  )
}

function CartItem({ line, onChangeQuantity }) {
  return (
    <li className="cart-panel__item">
      <p className="cart-panel__item-name">{formatCartItemName(line)}</p>
      <p className="cart-panel__item-price">{formatPrice(line.lineTotal)}</p>
      <div className="cart-panel__item-control">
        <QuantityStepper
          quantity={line.quantity}
          onDecrease={() => onChangeQuantity(line.key, -1)}
          onIncrease={() => onChangeQuantity(line.key, 1)}
        />
      </div>
    </li>
  )
}

function CartPanel({
  cartLines,
  cartTotal,
  onOrder,
  onChangeQuantity,
  orderSubmitting,
}) {
  const isEmpty = cartLines.length === 0

  return (
    <section className="cart-panel" aria-label="장바구니">
      <h2 className="cart-panel__title">장바구니</h2>
      <div className="cart-panel__body">
        <div className="cart-panel__orders">
          <ul className="cart-panel__list">
            {isEmpty ? (
              <li className="cart-panel__empty">담은 메뉴가 없습니다.</li>
            ) : (
              cartLines.map((line) => (
                <CartItem
                  key={line.key}
                  line={line}
                  onChangeQuantity={onChangeQuantity}
                />
              ))
            )}
          </ul>
        </div>
        <aside className="cart-panel__summary" aria-label="결제 정보">
          <p className="cart-panel__total">
            <span className="cart-panel__total-label">총 금액</span>
            <strong className="cart-panel__total-value">
              {formatPrice(cartTotal)}
            </strong>
          </p>
          <button
            type="button"
            className="btn btn--primary btn--large"
            disabled={isEmpty || orderSubmitting}
            onClick={onOrder}
          >
            {orderSubmitting ? '주문 중...' : '주문하기'}
          </button>
        </aside>
      </div>
    </section>
  )
}

export default CartPanel
