import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../App'
import api from '../lib/api'
import { saveAuth } from '../lib/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const tokenRes = await api.post('/auth/login', { email, password })
      const { access_token } = tokenRes.data
      localStorage.setItem('metis_token', access_token)
      const userRes = await api.get('/auth/me')
      saveAuth(access_token, userRes.data)
      setUser(userRes.data)
      navigate('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img
            src="/metis-logo.svg"
            alt="Metis"
            style={{ width: 46, height: 80, marginBottom: 16, objectFit: 'contain' }}
          />
          <h1
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--text-dark)',
              marginBottom: 6,
              letterSpacing: '-0.03em',
            }}
          >
            Metis
          </h1>
          <p style={{ color: 'var(--text-soft)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Manrope', sans-serif" }}>
            Your Learning Companion
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 4,
              color: 'var(--text-dark)',
              letterSpacing: '-0.02em',
            }}
          >
            Welcome back
          </h2>
          <p style={{ color: 'var(--text-soft)', fontSize: 13, marginBottom: 28 }}>
            Sign in to continue your learning journey
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div
                style={{
                  background: 'var(--rose-pale)',
                  color: 'var(--rose)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? <span className="loading-spinner" style={{ borderTopColor: 'white' }} /> : 'Sign in →'}
            </button>
          </form>

          <div style={{ margin: '20px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>
              New to Metis?{' '}
              <Link to="/register" style={{ color: 'var(--text-dark)', fontWeight: 700 }}>
                Create an account
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-soft)', marginBottom: 4, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Manrope', sans-serif" }}>
              Demo Account
            </div>
            <div style={{ color: 'var(--text-mid)', fontSize: 12 }}>admin@metis.ai · MetisAdmin2024!</div>
          </div>
        </div>
      </div>
    </div>
  )
}
