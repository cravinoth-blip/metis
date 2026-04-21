import { useAuth } from '../App'

interface TopbarProps {
  title: string
}

export default function Topbar({ title }: TopbarProps) {
  const { user } = useAuth()

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        background: 'rgba(249, 249, 251, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(196, 199, 199, 0.2)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 16,
        flexShrink: 0,
      }}
    >
      <h1
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-dark)',
          letterSpacing: '-0.02em',
          flex: 1,
        }}
      >
        {title}
      </h1>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* XP chip */}
          <div className="chip chip-xp">
            <span>⚡</span>
            <span>{user.xp.toLocaleString()} XP</span>
          </div>

          {/* Streak chip */}
          {user.streak > 0 && (
            <div className="chip chip-streak">
              <span>🔥</span>
              <span>{user.streak}d</span>
            </div>
          )}

          {/* Notification bell */}
          <button
            style={{
              background: 'var(--bg-surface)',
              border: 'none',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--sand-light)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)' }}
            title="Notifications"
          >
            🔔
          </button>

          {/* Avatar */}
          <div
            className="avatar"
            style={{
              width: 34,
              height: 34,
              fontSize: 12,
            }}
            title={user.full_name || user.username}
          >
            {user.avatar_initials}
          </div>
        </div>
      )}
    </header>
  )
}
