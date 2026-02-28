import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    LayoutDashboard,
    FolderKanban,
    BarChart3,
    Users,
    Briefcase,
    History,
    Brain,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Settings
} from 'lucide-react'
import './Sidebar.css'

const NAV_ITEMS = [
    { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/dashboard' },
    { icon: <FolderKanban size={20} />, label: 'Projects', path: '/dashboard/projects' },
    { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: <Users size={20} />, label: 'Clients', path: '/dashboard/clients' },
    { icon: <Briefcase size={20} />, label: 'Services', path: '/dashboard/services' },
    { icon: <History size={20} />, label: 'History', path: '/dashboard/history' },
    { icon: <Brain size={20} />, label: 'Models', path: '/dashboard/models' },
    { icon: <HelpCircle size={20} />, label: 'Help Desk', path: '/dashboard/helpdesk' },
]

export default function Sidebar({ collapsed, setCollapsed }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout } = useAuth()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }
    return (
        <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>

            {/* Logo */}
            <div className="sidebar__logo">
                {!collapsed && <span className="sidebar__logo-text">AROM</span>}
                <button
                    className="sidebar__toggle"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Nav Items */}
            <nav className="sidebar__nav">
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.path}
                        className={`sidebar__nav-item ${location.pathname === item.path ? 'sidebar__nav-item--active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="sidebar__nav-icon">{item.icon}</span>
                        {!collapsed && <span className="sidebar__nav-label">{item.label}</span>}
                    </button>
                ))}
            </nav>

            {/* Bottom */}
            <div className="sidebar__bottom">
                <button className="sidebar__nav-item" onClick={() => navigate('/dashboard/settings')}>
                    <span className="sidebar__nav-icon"><Settings size={20} /></span>
                    {!collapsed && <span className="sidebar__nav-label">Settings</span>}
                </button>
                <button className="sidebar__nav-item sidebar__nav-item--logout" onClick={handleLogout}>
                    <span className="sidebar__nav-icon"><LogOut size={20} /></span>
                    {!collapsed && <span className="sidebar__nav-label">Logout</span>}
                </button>
            </div>

        </aside>
    )
}