import { useState, useEffect } from 'react'
import { useAuth } from '../App'
import api, { UserStats } from '../lib/api'
import StatCard from '../components/StatCard'
import ProgressBar from '../components/ProgressBar'

const SKILL_CATEGORIES = [
  { label: 'AI Fundamentals', color: 'var(--terra)', quizId: 'ai-fundamentals' },
  { label: 'Prompt Engineering', color: 'var(--gold)', quizId: 'prompt-engineering' },
  { label: 'AI Ethics & Safety', color: 'var(--sage)', quizId: 'ai-ethics' },
  { label: 'Data Literacy', color: '#7a6aaa', quizId: 'data-literacy' },
  { label: 'AI Tools', color: 'var(--terra-light)', quizId: 'ai-tools-proficiency' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<unknown[]>([])
  const [skillScores, setSkillScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, quizListRes] = await Promise.all([
          api.get('/users/me/stats'),
          api.get('/quiz/'),
        ])
        setStats(statsRes.data)

        // Build skill scores from quiz best scores
        const scores: Record<string, number> = {}
        for (const quiz of quizListRes.data) {
          if (quiz.best_score !== null) {
            scores[quiz.id] = quiz.best_score
          }
        }
        setSkillScores(scores)

        // Recent quiz attempts as activity
        setRecentActivity(quizListRes.data.filter((q: { attempts: number }) => q.attempts > 0).slice(0, 5))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading || !stats || !user) {
    return (
      <div className="loading-overlay">
        <span className="loading-spinner" />
        Loading your dashboard...
      </div>
    )
  }

  const xpToNextLevel = stats.xp_to_next
  const xpInCurrentLevel = 500 - xpToNextLevel
  const levelProgress = (xpInCurrentLevel / 500) * 100

  return (
    <div className="fade-in" style={{ maxWidth: 1100 }}>
      {/* Welcome banner — Stockholm: signature black gradient */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 100%)',
          borderRadius: 'var(--radius)',
          padding: '32px 36px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          color: 'white',
        }}
      >
        <div
          className="level-ring"
          style={{
            width: 68,
            height: 68,
            fontSize: 20,
            fontWeight: 800,
            flexShrink: 0,
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          {user.level}
        </div>

        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 4,
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            Welcome back, {user.full_name.split(' ')[0] || user.username}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 14, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
            Level {user.level} · {user.department || 'Metis Learner'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, maxWidth: 260, background: 'rgba(255,255,255,0.1)', borderRadius: 99, height: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${levelProgress}%`, background: 'rgba(255,255,255,0.7)', borderRadius: 99, transition: 'width 0.8s ease' }} />
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif" }}>
              {xpToNextLevel} XP to Lvl {user.level + 1}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'white', fontFamily: "'Manrope', sans-serif", letterSpacing: '-0.02em' }}>
              {user.xp.toLocaleString()}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>XP</span>
          </div>
          {user.streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{user.streak}-day streak</span>
            </div>
          )}
          {stats.rank && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Rank #{stats.rank}
            </div>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard
          emoji="🧠"
          label="AI Skill Score"
          value={stats.best_quiz_score ? `${stats.best_quiz_score.toFixed(0)}%` : '—'}
          sublabel="Best quiz score"
        />
        <StatCard
          emoji="📚"
          label="Courses Done"
          value={stats.courses_completed}
          sublabel="Completed modules"
        />
        <StatCard
          emoji="⚡"
          label="Total XP"
          value={user.xp.toLocaleString()}
          sublabel={`Level ${user.level}`}
        />
        <StatCard
          emoji="🛠️"
          label="AI Tools Used"
          value={stats.tools_used}
          sublabel="Unique tools logged"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Skill Breakdown */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 className="section-title" style={{ marginBottom: 20 }}>Skill Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {SKILL_CATEGORIES.map((cat) => {
              const score = skillScores[cat.quizId] ?? 0
              return (
                <div key={cat.quizId}>
                  <ProgressBar
                    value={score}
                    color={`linear-gradient(90deg, ${cat.color}, ${cat.color}aa)`}
                    label={cat.label}
                    showLabel
                  />
                </div>
              )
            })}
          </div>

          {Object.keys(skillScores).length === 0 && (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎮</div>
              <p style={{ fontSize: 14, color: 'var(--text-soft)' }}>
                Complete quizzes to build your skill profile
              </p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 className="section-title" style={{ marginBottom: 16 }}>Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-soft)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🌱</div>
              <p style={{ fontSize: 14 }}>No activity yet. Play a quiz!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(recentActivity as Array<{
                id: string
                title: string
                best_score: number | null
                xp_reward: number
                attempts: number
              }>).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: 20 }}>🎯</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-dark)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-soft)' }}>
                      {item.attempts} attempt{item.attempts !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {item.best_score !== null && (
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: item.best_score >= 70 ? 'var(--sage)' : 'var(--rose)',
                      }}
                    >
                      {item.best_score.toFixed(0)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
