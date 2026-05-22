import { useState } from 'react'
import './App.css'
import OrderPage from './pages/OrderPage'
import AdminPlaceholder from './pages/AdminPlaceholder'

function App() {
  const [activeTab, setActiveTab] = useState('order')

  if (activeTab === 'admin') {
    return (
      <AdminPlaceholder activeTab={activeTab} onTabChange={setActiveTab} />
    )
  }

  return <OrderPage activeTab={activeTab} onTabChange={setActiveTab} />
}

export default App
