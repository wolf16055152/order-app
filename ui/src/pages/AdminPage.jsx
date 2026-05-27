import Header from '../components/Header'
import { formatPrice } from '../utils/formatPrice'

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatOrderedAt(date) {
  const d = new Date(date)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function buildItemsSummary(items) {
  return items
    .map((it) => `${it.menuName} x ${it.quantity}`)
    .join(', ')
}

function getInventoryStatus(stockQuantity) {
  if (stockQuantity === 0) return { label: '품절', tone: 'danger' }
  if (stockQuantity < 5) return { label: '주의', tone: 'warn' }
  return { label: '정상', tone: 'ok' }
}

function deriveSummary(orders, ORDER_STATUS) {
  const pendingCount = orders.filter((o) => o.status === ORDER_STATUS.PENDING).length
  const inPreparationCount = orders.filter(
    (o) => o.status === ORDER_STATUS.IN_PREPARATION,
  ).length
  const completedCount = orders.filter((o) => o.status === ORDER_STATUS.COMPLETED).length
  return {
    totalOrders: orders.length,
    pendingCount,
    inPreparationCount,
    completedCount,
  }
}

function AdminPage({
  activeTab,
  onTabChange,
  inventory,
  orders,
  onChangeStock,
  onAdvanceOrder,
  ORDER_STATUS,
}) {
  const summary = deriveSummary(orders, ORDER_STATUS)
  const summaryCards = [
    { label: '총 주문', value: summary.totalOrders },
    { label: '주문 접수', value: summary.pendingCount },
    { label: '제조 중', value: summary.inPreparationCount },
    { label: '제조 완료', value: summary.completedCount },
  ]

  return (
    <div className="app-shell admin-page">
      <Header activeTab={activeTab} onTabChange={onTabChange} />
      <main className="order-page__main admin-page__main">
        <section className="admin-section" aria-label="관리자 대시보드">
          <div className="admin-summary-grid">
            {summaryCards.map((card) => (
              <article key={card.label} className="admin-summary-card">
                <p className="admin-summary-card__label">{card.label}</p>
                <p className="admin-summary-card__value">{card.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-section" aria-label="재고 현황">
          <h2 className="admin-section__title">재고 현황</h2>
          <div className="admin-inventory">
            {inventory.map((it) => {
              const status = getInventoryStatus(it.stockQuantity)
              return (
                <article key={it.menuItemId} className="admin-card">
                  <p className="admin-card__stockline">
                    <strong className="admin-card__name">{it.name}</strong>
                    <span className="admin-card__qty">{it.stockQuantity}</span>
                    <span className="admin-card__unit">개</span>
                    <span
                      className={`admin-badge admin-badge--${status.tone}`}
                      aria-label={`상태: ${status.label}`}
                    >
                      {status.label}
                    </span>
                  </p>
                  <div className="admin-card__controls">
                    <button
                      type="button"
                      className="admin-icon-btn"
                      aria-label={`${it.name} 재고 감소`}
                      disabled={it.stockQuantity === 0}
                      onClick={() => onChangeStock(it.menuItemId, -1)}
                    >
                      −
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn"
                      aria-label={`${it.name} 재고 증가`}
                      onClick={() => onChangeStock(it.menuItemId, 1)}
                    >
                      +
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="admin-section" aria-label="주문 현황">
          <h2 className="admin-section__title">주문 현황</h2>
          <div className="admin-orders">
            {orders.length === 0 ? (
              <p className="admin-empty">주문이 없습니다.</p>
            ) : (
              <ul className="admin-order-list">
                {orders
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.orderedAt).getTime() -
                      new Date(a.orderedAt).getTime(),
                  )
                  .map((o) => {
                    const itemsSummary = buildItemsSummary(o.items)
                    return (
                      <li key={o.id} className="admin-order-row">
                        <div className="admin-order-row__left">
                          <span className="admin-order-row__time">
                            {formatOrderedAt(o.orderedAt)}
                          </span>
                          <span className="admin-order-row__items">
                            {itemsSummary}
                          </span>
                        </div>
                        <span className="admin-order-row__amount">
                          {formatPrice(o.totalAmount)}
                        </span>
                        <span className="admin-order-row__action">
                          {o.status === ORDER_STATUS.PENDING ||
                          o.status === ORDER_STATUS.IN_PREPARATION ? (
                            <button
                              type="button"
                              className="btn btn--primary admin-order-btn"
                              onClick={() => onAdvanceOrder(o.id)}
                            >
                              {o.status === ORDER_STATUS.PENDING
                                ? '제조 시작'
                                : '제조 완료'}
                            </button>
                          ) : (
                            <span className="admin-status">
                              {o.status === ORDER_STATUS.IN_PREPARATION
                                ? '제조 중'
                                : '제조 완료'}
                            </span>
                          )}
                        </span>
                      </li>
                    )
                  })}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default AdminPage

