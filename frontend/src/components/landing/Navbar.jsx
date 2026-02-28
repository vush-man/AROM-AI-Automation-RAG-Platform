import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import './Navbar.css'

const NAV_LINKS = [
    { label: 'Home', href: '#' },
    { label: 'Services', href: '#services' },
    { label: 'Process', href: '#process' },
    { label: 'Case Studies', href: '#cases' },
    { label: 'Pricing', href: '#pricing' },
]

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [mobileOpen])

    return (
        <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="navbar__inner container">
                <Link to="/" className="navbar__logo">AROM</Link>

                <ul className="navbar__links">
                    {NAV_LINKS.map(l => (
                        <li key={l.label}>
                            <a href={l.href} className="navbar__link">{l.label}</a>
                        </li>
                    ))}
                </ul>

                <div className="navbar__actions">
                    <Link to="/login" className="btn-ghost">Log In</Link>
                    <Link to="/signup" className="btn-primary navbar__signup">Sign Up</Link>
                </div>

                <button
                    className="navbar__hamburger"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile overlay */}
            <div className={`navbar__mobile ${mobileOpen ? 'navbar__mobile--open' : ''}`}>
                <ul className="navbar__mobile-links">
                    {NAV_LINKS.map(l => (
                        <li key={l.label}>
                            <a
                                href={l.href}
                                className="navbar__mobile-link"
                                onClick={() => setMobileOpen(false)}
                            >
                                {l.label}
                            </a>
                        </li>
                    ))}
                </ul>
                <div className="navbar__mobile-actions">
                    <Link to="/login" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>Log In</Link>
                    <Link to="/signup" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>Sign Up</Link>
                </div>
            </div>
        </nav>
    )
}
