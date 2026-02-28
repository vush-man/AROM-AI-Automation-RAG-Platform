import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
    Bell,
    Search,
    Settings,
    ChevronDown,
    Moon,
    Sun
} from 'lucide-react'
import './TopHeader.css'

const PAGE_TITLES = {
    '/dashboard': 'Overview',
    '/dashboard/projects': 'Projects & Tasks',
    '/dashboard/analytics': 'Analytics',
    '/dashboard/clients': 'Client Management',
    '/dashboard/services': 'Service Listings',
    '/dashboard/history': 'History',
    '/dashboard/models': 'Models',
    '/dashboard/helpdesk': 'Help Desk',
}

export default function TopHeader() {
    const location = useLocation()
    const [darkMode, setDarkMode] = useState(true)
    const [notifications] = useState(3)
    const [searchOpen, setSearchOpen] = useState(false)

    const currentPage = PAGE_TITLES[location.pathname] || 'Dashboard'

    useEffect(() => {
        if (!darkMode) {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    }, [darkMode])

    return (
        <header className="top-header">

            {/* Left — Page Title */}
            <div className="top-header__left">
                <h1 className="top-header__title">{currentPage}</h1>
                <span className="top-header__date">
                    {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </span>
            </div>

            {/* Right — Actions */}
            <div className="top-header__right">

                {/* Search */}
                <div className={`top-header__search ${searchOpen ? 'top-header__search--open' : ''}`}>
                    {searchOpen && (
                        <input
                            type="text"
                            placeholder="Search anything..."
                            className="top-header__search-input"
                            autoFocus
                            onBlur={() => setSearchOpen(false)}
                        />
                    )}
                    <button
                        className="top-header__icon-btn"
                        onClick={() => setSearchOpen(!searchOpen)}
                    >
                        <Search size={18} />
                    </button>
                </div>

                {/* Dark mode toggle */}
                <button
                    className="top-header__icon-btn"
                    onClick={() => setDarkMode(!darkMode)}
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Notifications */}
                <button
                    className="top-header__icon-btn top-header__notif"
                    onClick={() => alert("Notification Center is currently syncing...")}
                >
                    <Bell size={18} />
                    {notifications > 0 && (
                        <span className="top-header__notif-badge">{notifications}</span>
                    )}
                </button>

                {/* Settings */}
                <button
                    className="top-header__icon-btn"
                    onClick={() => alert("Settings panel will be attached to the upcoming user profile module.")}
                >
                    <Settings size={18} />
                </button>

                {/* Divider */}
                <div className="top-header__divider" />

                {/* User Avatar */}
                <button className="top-header__user" onClick={() => alert("Admin profile modal coming soon.")}>
                    <div className="top-header__avatar">A</div>
                    <div className="top-header__user-info">
                        <span className="top-header__user-name">Admin</span>
                        <span className="top-header__user-role">AROM Team</span>
                    </div>
                    <ChevronDown size={14} />
                </button>

            </div>
        </header>
    )
}
