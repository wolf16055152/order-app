import { useState } from 'react'
import './App.css'
import OrderPage from './pages/OrderPage'
import AdminPage from './pages/AdminPage'

function App() {
  const [activeTab, setActiveTab] = useState('order')

  if (activeTab === 'admin') {
    return (
      <AdminPage activeTab={activeTab} onTabChange={setActiveTab} />
    )
  }

  return <OrderPage activeTab={activeTab} onTabChange={setActiveTab} />
}

export default App
