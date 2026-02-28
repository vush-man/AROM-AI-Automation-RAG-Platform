import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import './Footer.css'

const LINK_SECTIONS = {
    links: [
        { label: 'Services', href: '#services' },
        { label: 'Process', href: '#process' },
        { label: 'Case Studies', href: '#cases' },
        { label: 'Benefits', href: '#benefits' },
        { label: 'Pricing', href: '#pricing' },
    ],
    pages: [
        { label: 'Home', to: '/' },
        { label: 'About', to: '/about' },
        { label: 'Blog', to: '/blog' },
        { label: 'Contact', to: '/contact' },
    ],
    socials: [
        { label: 'Instagram', href: '#' },
        { label: 'LinkedIn', href: '#' },
        { label: 'Twitter', href: '#' },
        { label: 'GitHub', href: '#' },
    ],
}

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer__grid">
                    {/* Col 1 — Brand */}
                    <div className="footer__brand">
                        <span className="footer__logo">AROM</span>
                        <p className="footer__tagline">Automate the Ordinary.<br />Amplify the Extraordinary.</p>
                        <div className="footer__newsletter">
                            <input
                                type="email"
                                className="input footer__email-input"
                                placeholder="Enter your email"
                            />
                            <button className="btn-primary footer__subscribe-btn">
                                Subscribe <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Col 2 — Links */}
                    <div className="footer__col">
                        <h4 className="footer__col-title">Links</h4>
                        <ul>
                            {LINK_SECTIONS.links.map(l => (
                                <li key={l.label}><a href={l.href} className="footer__link">{l.label}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Col 3 — Pages */}
                    <div className="footer__col">
                        <h4 className="footer__col-title">Pages</h4>
                        <ul>
                            {LINK_SECTIONS.pages.map(l => (
                                <li key={l.label}><Link to={l.to} className="footer__link">{l.label}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Col 4 — Socials */}
                    <div className="footer__col">
                        <h4 className="footer__col-title">Socials</h4>
                        <ul>
                            {LINK_SECTIONS.socials.map(l => (
                                <li key={l.label}><a href={l.href} className="footer__link" target="_blank" rel="noopener noreferrer">{l.label}</a></li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="footer__bottom">
                    <p>© 2025 AROM. All rights reserved.</p>
                    <div className="footer__bottom-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
