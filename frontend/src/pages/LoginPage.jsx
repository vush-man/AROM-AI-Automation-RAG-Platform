import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState('')
    const { login, loading, isAuthenticated } = useAuth()
    const navigate = useNavigate()

    // If already logged in, redirect to dashboard in an effect to avoid render-phase navigation
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true })
        }
    }, [isAuthenticated, navigate])

    if (isAuthenticated) {
        return (
            <div className="auth-page" style={{ background: 'var(--bg-primary)' }}>
                {/* Simple loader to avoid complete black screen during redirect */}
                <div className="auth-spinner" />
            </div>
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (!email || !password) {
            setError('Please fill in all fields.')
            return
        }
        try {
            await login({ email, password })
            navigate('/dashboard')
        } catch (err) {
            setError(err.message || 'Invalid email or password')
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <span className="auth-logo">AROM</span>
                <h2 className="auth-title">Welcome back</h2>
                <p className="auth-sub">Log in to your AROM dashboard</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label className="auth-label">Email</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="auth-field">
                        <div className="auth-label-row">
                            <label className="auth-label">Password</label>
                            <a href="#" className="auth-forgot">Forgot password?</a>
                        </div>
                        <div className="auth-pw-wrap">
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="auth-pw-toggle"
                                onClick={() => setShowPw(!showPw)}
                                aria-label="Toggle password visibility"
                            >
                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                        {loading ? <span className="auth-spinner" /> : <>Log In <ArrowRight size={16} /></>}
                    </button>
                </form>

                <div className="auth-divider"><span>or</span></div>

                <button className="btn-secondary auth-google">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" /></svg>
                    Continue with Google
                </button>

                <p className="auth-switch">
                    Don&apos;t have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </div>
        </div>
    )
}
