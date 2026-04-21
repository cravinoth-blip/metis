interface StatCardProps {
  emoji: string
  label: string
  value: string | number
  change?: string
  changePositive?: boolean
  accentColor?: string
  sublabel?: string
}

export default function StatCard({
  emoji,
  label,
  value,
  change,
  changePositive,
  sublabel,
}: StatCardProps) {
  return (
    <div
      className="card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 40px rgba(26,26,26,0.10)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)'
      }}
    >
      <div style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</div>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-faint)', fontFamily: "'Manrope', sans-serif", marginTop: 4 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          fontFamily: "'Manrope', sans-serif",
          color: 'var(--text-dark)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      {sublabel && (
        <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: "'Inter', sans-serif" }}>{sublabel}</div>
      )}
      {change && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: changePositive ? 'var(--sage)' : 'var(--rose)',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {changePositive ? '▲' : '▼'} {change}
        </div>
      )}
    </div>
  )
}
