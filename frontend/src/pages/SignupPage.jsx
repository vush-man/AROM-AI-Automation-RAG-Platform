import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function getStrength(pw) {
    let s = 0
    if (pw.length >= 6) s++
    if (pw.length >= 10) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s // 0–5
}

const STRENGTH_COLORS = ['var(--error)', 'var(--error)', '#FF8800', 'var(--warning)', 'var(--success)', 'var(--success)']

export default function SignupPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [showConfirmPw, setShowConfirmPw] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const { signup, loading, isAuthenticated } = useAuth()
    const navigate = useNavigate()

    // If already logged in, redirect to dashboard
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true })
        }
    }, [isAuthenticated, navigate])

    // If redirected, show a clean loading overlay instead of potentially black screen
    if (isAuthenticated) {
        return (
            <div className="auth-page" style={{ background: '#080810', color: '#fff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="auth-spinner" />
                <p>Redirecting to dashboard...</p>
            </div>
        )
    }

    const strength = getStrength(password)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        if (!name || !email || !password || !confirmPw) {
            setError('Please fill in all fields.')
            return
        }
        if (password !== confirmPw) {
            setError('Passwords do not match.')
            return
        }
        if (strength < 3) {
            setError('Password is too weak.')
            return
        }
        try {
            await signup({ name, email, password, confirmPassword: confirmPw })
            setSuccess('Account created! Redirecting to login...')
            setTimeout(() => navigate('/login'), 1500)
        } catch (err) {
            setError(err.message || 'Signup failed. Please try again.')
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <span className="auth-logo">AROM</span>
                <h2 className="auth-title">Create your account</h2>
                <p className="auth-sub">Start automating with AROM</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label className="auth-label">Full Name</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="John Doe"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

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
                        <label className="auth-label">Password</label>
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
                        {password && (
                            <div className="auth-strength">
                                {[0, 1, 2, 3, 4].map(i => (
                                    <div
                                        key={i}
                                        className="auth-strength__bar"
                                        style={{
                                            background: i < strength ? STRENGTH_COLORS[strength] : 'var(--border)',
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="auth-field">
                        <label className="auth-label">Confirm Password</label>
                        <div className="auth-pw-wrap">
                            <input
                                type={showConfirmPw ? 'text' : 'password'}
                                className="input"
                                placeholder="••••••••"
                                value={confirmPw}
                                onChange={e => setConfirmPw(e.target.value)}
                            />
                            <button
                                type="button"
                                className="auth-pw-toggle"
                                onClick={() => setShowConfirmPw(!showConfirmPw)}
                                aria-label="Toggle confirm password visibility"
                            >
                                {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && <div className="auth-error">{error}</div>}
                    {success && <div className="auth-success">{success}</div>}

                    <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                        {loading ? <span className="auth-spinner" /> : <>Create Account <ArrowRight size={16} /></>}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Log In</Link>
                </p>
            </div>
        </div>
    )
}
