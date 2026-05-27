import { useMemo, useState } from 'react'
import Header from '../components/Header'
import { MENUS } from '../data/menus'
import { formatPrice } from '../utils/formatPrice'

const ORDER_STATUS = {
  PENDING: 'PENDING',
  IN_PREPARATION: 'IN_PREPARATION',
  COMPLETED: 'COMPLETED',
}

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

function deriveSummary(orders) {
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

function AdminPage({ activeTab, onTabChange }) {
  const inventoryMenus = useMemo(() => MENUS.slice(0, 3), [])
  const [inventory, setInventory] = useState(() =>
    inventoryMenus.map((m) => ({
      menuItemId: m.id,
      name: m.name,
      stockQuantity: 10,
    })),
  )

  const [orders, setOrders] = useState(() => [
    {
      id: 'order-001',
      orderedAt: new Date().toISOString(),
      status: ORDER_STATUS.PENDING,
      items: [
        {
          menuItemId: MENUS[0]?.id ?? 'americano-ice',
          menuName: MENUS[0]?.name ?? '아메리카노(ICE)',
          quantity: 1,
          unitPrice: MENUS[0]?.basePrice ?? 4000,
          lineTotal: MENUS[0]?.basePrice ?? 4000,
        },
      ],
      totalAmount: MENUS[0]?.basePrice ?? 4000,
    },
  ])

  const summary = deriveSummary(orders)

  function changeStock(menuItemId, delta) {
    setInventory((prev) =>
      prev.map((it) => {
        if (it.menuItemId !== menuItemId) return it
        const next = Math.max(0, it.stockQuantity + delta)
        return { ...it, stockQuantity: next }
      }),
    )
  }

  function startPreparation(orderId) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId && o.status === ORDER_STATUS.PENDING
          ? { ...o, status: ORDER_STATUS.IN_PREPARATION }
          : o,
      ),
    )
  }

  return (
    <div className="app-shell admin-page">
      <Header activeTab={activeTab} onTabChange={onTabChange} />
      <main className="order-page__main admin-page__main">
        <section className="admin-section" aria-label="관리자 대시보드">
          <h2 className="admin-section__title">관리자 대시보드</h2>
          <p className="admin-dashboard__line">
            <span>총 주문 {summary.totalOrders}</span>
            <span className="admin-dashboard__dot">/</span>
            <span>주문 접수 {summary.pendingCount}</span>
            <span className="admin-dashboard__dot">/</span>
            <span>제조 중 {summary.inPreparationCount}</span>
            <span className="admin-dashboard__dot">/</span>
            <span>제조 완료 {summary.completedCount}</span>
          </p>
        </section>

        <section className="admin-section" aria-label="재고 현황">
          <h2 className="admin-section__title">재고 현황</h2>
          <div className="admin-inventory">
            {inventory.map((it) => {
              const status = getInventoryStatus(it.stockQuantity)
              return (
                <article key={it.menuItemId} className="admin-card">
                  <h3 className="admin-card__name">{it.name}</h3>
                  <p className="admin-card__stock">
                    <strong>{it.stockQuantity}개</strong>
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
                      onClick={() => changeStock(it.menuItemId, -1)}
                    >
                      −
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn"
                      aria-label={`${it.name} 재고 증가`}
                      onClick={() => changeStock(it.menuItemId, 1)}
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
                        <span className="admin-order-row__time">
                          {formatOrderedAt(o.orderedAt)}
                        </span>
                        <span className="admin-order-row__items">
                          {itemsSummary}
                        </span>
                        <span className="admin-order-row__amount">
                          {formatPrice(o.totalAmount)}
                        </span>
                        <span className="admin-order-row__action">
                          {o.status === ORDER_STATUS.PENDING ? (
                            <button
                              type="button"
                              className="btn btn--primary"
                              onClick={() => startPreparation(o.id)}
                            >
                              제조시작
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

