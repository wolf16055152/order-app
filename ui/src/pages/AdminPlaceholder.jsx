import Header from '../components/Header'

function AdminPlaceholder({ activeTab, onTabChange }) {
  return (
    <div className="app-shell order-page">
      <Header activeTab={activeTab} onTabChange={onTabChange} />
      <main className="order-page__main admin-placeholder">
        <p>관리자 화면은 준비 중입니다.</p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => onTabChange('order')}
        >
          주문하기로 돌아가기
        </button>
      </main>
    </div>
  )
}

export default AdminPlaceholder
