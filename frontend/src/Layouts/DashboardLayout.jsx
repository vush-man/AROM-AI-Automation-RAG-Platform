import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/dashboard/Sidebar'
import TopHeader from '../components/dashboard/TopHeader'
import './DashboardLayout.css'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  // scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="dashboard-layout">

      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Right Side */}
      <div className={`dashboard-layout__right ${collapsed ? 'dashboard-layout__right--collapsed' : ''}`}>

        {/* Top Header */}
        <TopHeader />

        {/* Page Content */}
        <main className="dashboard-layout__main">
          <Outlet />
        </main>

      </div>
    </div>
  )
}