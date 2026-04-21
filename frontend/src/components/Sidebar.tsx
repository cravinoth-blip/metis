import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  { icon: '🏡', label: 'Home', path: '/dashboard' },
  { icon: '🎮', label: 'Skill Games', path: '/skill-games', badge: '3' },
  { icon: '📚', label: 'Learning', path: '/learning' },
  { icon: '📅', label: "What's On", path: '/whats-on', badge: '8' },
  { icon: '🥇', label: 'Enterprise Tools', path: '/enterprise-tools' },
  { icon: '🛠️', label: 'AI Tools', path: '/ai-tools', badge: 'New' },
]

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      {/* Logo area */}
      <div
        style={{
          padding: collapsed ? '20px 0' : '20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 12,
          cursor: 'pointer',
          minHeight: 70,
        }}
        onClick={onToggle}
      >
        <img
          src="/metis-logo.svg"
          alt="Metis"
          style={{
            width: 30,
            height: 52,
            flexShrink: 0,
            borderRadius: 2,
            objectFit: 'contain',
            display: 'block',
          }}
        />
        {!collapsed && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: 16,
                fontWeight: 800,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.02em',
              }}
            >
              Metis
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Learning Platform
            </div>
          </div>
        )}
        {!collapsed && (
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, letterSpacing: '0.05em' }}>
            ◀
          </div>
        )}
        {collapsed && (
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>▶</div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              margin: '2px 8px',
              padding: collapsed ? '12px 14px' : '10px 12px',
              color: isActive ? '#1a1a1a' : 'rgba(255,255,255,0.5)',
              background: isActive ? '#ffffff' : 'transparent',
              borderRadius: 4,
              textDecoration: 'none',
              transition: 'all 0.15s',
              position: 'relative',
              whiteSpace: 'nowrap',
              justifyContent: collapsed ? 'center' : 'flex-start',
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              const isActive = el.getAttribute('aria-current') === 'page'
              if (!isActive) {
                el.style.background = 'rgba(255,255,255,0.06)'
                el.style.color = 'rgba(255,255,255,0.85)'
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              const isActive = el.getAttribute('aria-current') === 'page'
              if (!isActive) {
                el.style.background = 'transparent'
                el.style.color = 'rgba(255,255,255,0.5)'
              }
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && (
              <>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: item.badge === 'New' ? 'var(--sage)' : 'rgba(255,255,255,0.15)',
                      color: item.badge === 'New' ? 'white' : 'rgba(255,255,255,0.7)',
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 99,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {user?.is_admin && (
          <NavLink
            to="/admin"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              margin: '2px 8px',
              padding: collapsed ? '12px 14px' : '10px 12px',
              color: isActive ? '#1a1a1a' : 'rgba(255,255,255,0.5)',
              background: isActive ? '#ffffff' : 'transparent',
              borderRadius: 4,
              textDecoration: 'none',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              justifyContent: collapsed ? 'center' : 'flex-start',
            })}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚙️</span>
            {!collapsed && <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Admin</span>}
          </NavLink>
        )}
      </nav>

      {/* User + logout */}
      <div style={{ padding: '8px' }}>
        {!collapsed && user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 8px 8px',
            }}
          >
            <div
              className="avatar"
              style={{ width: 30, height: 30, fontSize: 10, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
            >
              {user.avatar_initials}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Inter', sans-serif" }}>
                {user.full_name || user.username}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                Level {user.level}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8,
            padding: '10px 12px',
            color: 'rgba(255,255,255,0.3)',
            background: 'transparent',
            borderRadius: 4,
            transition: 'all 0.15s',
            fontSize: 12,
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
            border: 'none',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(192,80,80,0.15)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#f08080'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)'
          }}
        >
          <span style={{ fontSize: 14 }}>↪</span>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
