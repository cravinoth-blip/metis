import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../App'
import api from '../lib/api'
import { saveAuth } from '../lib/auth'

const DEPARTMENTS = [
  'Medical Writing',
  'Scientific Affairs',
  'Regulatory Affairs',
  'Evidence & Access',
  'Clinical Operations',
  'Biostatistics',
  'Data Management',
  'IT & Technology',
  'Platform',
  'Other',
]

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    department: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const tokenRes = await api.post('/auth/register', {
        email: formData.email,
        username: formData.username,
        full_name: formData.full_name,
        department: formData.department,
        password: formData.password,
      })
      const { access_token } = tokenRes.data
      localStorage.setItem('metis_token', access_token)
      const userRes = await api.get('/auth/me')
      saveAuth(access_token, userRes.data)
      setUser(userRes.data)
      navigate('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-page)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌿</div>
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 28,
              color: 'var(--terra)',
            }}
          >
            Join Metis
          </h1>
          <p style={{ color: 'var(--text-soft)', fontSize: 14, marginTop: 4 }}>
            Start your AI learning journey today
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  name="full_name"
                  type="text"
                  className="form-input"
                  placeholder="Jane Smith"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  name="username"
                  type="text"
                  className="form-input"
                  placeholder="janesmith"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                name="email"
                type="email"
                className="form-input"
                placeholder="jane.smith@company.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                name="department"
                className="form-input"
                value={formData.department}
                onChange={handleChange}
                required
              >
                <option value="">Select department...</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  className="form-input"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: 'var(--rose-pale)',
                  color: 'var(--rose)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 14,
                  border: '1px solid #f0c0c0',
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
              {loading ? <span className="loading-spinner" /> : 'Create Account →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--terra)', fontWeight: 700 }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
