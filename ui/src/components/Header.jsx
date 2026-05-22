function Header({ activeTab, onTabChange }) {
  return (
    <header className="header">
      <h1 className="header__brand">COZY</h1>
      <nav className="header__nav" aria-label="주요 메뉴">
        <button
          type="button"
          className={`header__tab ${activeTab === 'order' ? 'header__tab--active' : ''}`}
          aria-current={activeTab === 'order' ? 'page' : undefined}
          onClick={() => onTabChange('order')}
        >
          주문하기
        </button>
        <button
          type="button"
          className={`header__tab ${activeTab === 'admin' ? 'header__tab--active' : ''}`}
          aria-current={activeTab === 'admin' ? 'page' : undefined}
          onClick={() => onTabChange('admin')}
        >
          관리자
        </button>
      </nav>
    </header>
  )
}

export default Header
