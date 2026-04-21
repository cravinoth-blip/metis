import { useState, useEffect } from 'react'
import { useAuth, useToast } from '../App'
import api, { QuizInfo, QuizDetail, LeaderboardEntry, QuizResult, UserStats } from '../lib/api'
import QuizModal from '../components/QuizModal'
import ProgressBar from '../components/ProgressBar'

type Tab = 'quizzes' | 'badges' | 'leaderboard'

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'var(--sage)',
  Intermediate: 'var(--gold)',
  Advanced: 'var(--terra)',
}

const BADGES = [
  {
    id: 'early-adopter',
    emoji: '⚡',
    name: 'Early Adopter',
    description: 'Used 3+ AI tools',
    check: (stats: UserStats) => stats.tools_used >= 3,
    progress: (stats: UserStats) => Math.min(100, (stats.tools_used / 3) * 100),
    progressLabel: (stats: UserStats) => `${stats.tools_used}/3 tools`,
  },
  {
    id: 'ai-thinker',
    emoji: '🧠',
    name: 'AI Thinker',
    description: 'Scored 80%+ on any quiz',
    check: (stats: UserStats) => (stats.best_quiz_score ?? 0) >= 80,
    progress: (stats: UserStats) => Math.min(100, ((stats.best_quiz_score ?? 0) / 80) * 100),
    progressLabel: (stats: UserStats) => `${(stats.best_quiz_score ?? 0).toFixed(0)}% / 80%`,
  },
  {
    id: 'streak-master',
    emoji: '🔥',
    name: 'Streak Master',
    description: '7-day login streak',
    check: (_: UserStats, user: { streak: number }) => user.streak >= 7,
    progress: (_: UserStats, user: { streak: number }) => Math.min(100, (user.streak / 7) * 100),
    progressLabel: (_: UserStats, user: { streak: number }) => `${user.streak}/7 days`,
  },
  {
    id: 'course-crusher',
    emoji: '📚',
    name: 'Course Crusher',
    description: 'Completed 10+ courses',
    check: (stats: UserStats) => stats.courses_completed >= 10,
    progress: (stats: UserStats) => Math.min(100, (stats.courses_completed / 10) * 100),
    progressLabel: (stats: UserStats) => `${stats.courses_completed}/10 courses`,
  },
  {
    id: 'quiz-ace',
    emoji: '🎯',
    name: 'Quiz Ace',
    description: 'Scored 90%+ on 3 quizzes',
    check: (_: UserStats, __: unknown, quizzes: QuizInfo[]) =>
      quizzes.filter((q) => (q.best_score ?? 0) >= 90).length >= 3,
    progress: (_: UserStats, __: unknown, quizzes: QuizInfo[]) =>
      Math.min(100, (quizzes.filter((q) => (q.best_score ?? 0) >= 90).length / 3) * 100),
    progressLabel: (_: UserStats, __: unknown, quizzes: QuizInfo[]) =>
      `${quizzes.filter((q) => (q.best_score ?? 0) >= 90).length}/3 quizzes`,
  },
  {
    id: 'top-5',
    emoji: '🏆',
    name: 'Top 5',
    description: 'Rank top 5 on leaderboard',
    check: (stats: UserStats) => (stats.rank ?? 999) <= 5,
    progress: (stats: UserStats) => stats.rank && stats.rank <= 5 ? 100 : 0,
    progressLabel: (stats: UserStats) => `Rank #${stats.rank ?? '?'}`,
  },
  {
    id: 'ai-champion',
    emoji: '🌟',
    name: 'AI Champion',
    description: 'Reach level 10',
    check: (stats: UserStats) => stats.level >= 10,
    progress: (stats: UserStats) => Math.min(100, (stats.level / 10) * 100),
    progressLabel: (stats: UserStats) => `Level ${stats.level}/10`,
  },
  {
    id: 'perfect-score',
    emoji: '💯',
    name: 'Perfect Score',
    description: '100% on any quiz',
    check: (_: UserStats, __: unknown, quizzes: QuizInfo[]) =>
      quizzes.some((q) => (q.best_score ?? 0) >= 100),
    progress: (_: UserStats, __: unknown, quizzes: QuizInfo[]) => {
      const max = Math.max(...quizzes.map((q) => q.best_score ?? 0))
      return Math.min(100, max)
    },
    progressLabel: (_: UserStats, __: unknown, quizzes: QuizInfo[]) => {
      const max = Math.max(...quizzes.map((q) => q.best_score ?? 0), 0)
      return `Best: ${max.toFixed(0)}%`
    },
  },
]

const DAILY_CHALLENGES = [
  {
    id: 'speed-round',
    emoji: '⚡',
    name: 'Speed Round',
    description: 'Answer 5 random AI questions as fast as you can.',
    xp: 50,
    difficulty: 'Quick',
    quizId: 'ai-fundamentals',
  },
  {
    id: 'scenario-spotlight',
    emoji: '🎭',
    name: 'Scenario Spotlight',
    description: 'Navigate a real-world AI scenario with ethical decision points.',
    xp: 75,
    difficulty: 'Medium',
    quizId: 'ai-ethics',
  },
  {
    id: 'prompt-duel',
    emoji: '✍️',
    name: 'Prompt Duel',
    description: 'Pick the best prompts across 5 real prompting challenges.',
    xp: 60,
    difficulty: 'Medium',
    quizId: 'prompt-engineering',
  },
]

export default function SkillGames() {
  const { user, refreshUser } = useAuth()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('quizzes')
  const [quizzes, setQuizzes] = useState<QuizInfo[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeQuiz, setActiveQuiz] = useState<QuizDetail | null>(null)
  const [loadingQuizId, setLoadingQuizId] = useState<string | null>(null)

  // Daily challenge state from localStorage
  const today = new Date().toDateString()
  const [completedChallenges, setCompletedChallenges] = useState<string[]>(() => {
    const saved = localStorage.getItem('metis_daily_challenges')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.date === today) return parsed.completed
    }
    return []
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qRes, sRes, lRes] = await Promise.all([
          api.get('/quiz/'),
          api.get('/users/me/stats'),
          api.get('/users/leaderboard'),
        ])
        setQuizzes(qRes.data)
        setStats(sRes.data)
        setLeaderboard(lRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleStartQuiz = async (quizId: string) => {
    setLoadingQuizId(quizId)
    try {
      const res = await api.get(`/quiz/${quizId}`)
      setActiveQuiz(res.data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      showToast(e.response?.data?.detail || 'Failed to load quiz', 'error')
    } finally {
      setLoadingQuizId(null)
    }
  }

  const handleQuizComplete = async (result: QuizResult) => {
    await refreshUser()
    const updatedQuizzes = await api.get('/quiz/')
    setQuizzes(updatedQuizzes.data)
    const updatedStats = await api.get('/users/me/stats')
    setStats(updatedStats.data)
    showToast(`+${result.xp_earned} XP earned! ${result.passed ? '✓ Passed' : 'Keep practicing!'}`, result.passed ? 'success' : 'info')
  }

  const handleChallengeComplete = (challengeId: string, quizId: string) => {
    const newCompleted = [...completedChallenges, challengeId]
    setCompletedChallenges(newCompleted)
    localStorage.setItem('metis_daily_challenges', JSON.stringify({ date: today, completed: newCompleted }))
    handleStartQuiz(quizId)
  }

  if (loading) {
    return <div className="loading-overlay"><span className="loading-spinner" /> Loading...</div>
  }

  const streakAtRisk = user && user.streak > 0 && (() => {
    const lastLogin = new Date(user.last_login || 0)
    const daysSince = Math.floor((Date.now() - lastLogin.getTime()) / 86400000)
    return daysSince >= 1
  })()

  return (
    <div className="fade-in" style={{ maxWidth: 1100 }}>
      {/* Streak warning */}
      {streakAtRisk && (
        <div style={{
          background: 'linear-gradient(135deg, #fff0e0, #ffe4c4)',
          border: '1px solid #f0c080',
          borderRadius: 'var(--radius)',
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>🔥</span>
          <span style={{ color: 'var(--terra-deep)', fontWeight: 600 }}>
            Your {user?.streak}-day streak ends tonight! Complete any challenge to keep it.
          </span>
        </div>
      )}

      {/* Daily Challenges */}
      <div className="card" style={{ padding: 24, marginBottom: 28 }}>
        <div className="section-header">
          <h2 className="section-title">Daily Challenges</h2>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Resets at midnight</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {DAILY_CHALLENGES.map((challenge) => {
            const done = completedChallenges.includes(challenge.id)
            return (
              <div
                key={challenge.id}
                style={{
                  background: done ? 'var(--sage-pale)' : 'var(--bg-surface)',
                  border: `1px solid ${done ? 'var(--sage-light)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  opacity: done ? 0.8 : 1,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{challenge.emoji}</div>
                <div style={{ fontWeight: 700, color: 'var(--text-dark)', marginBottom: 4 }}>
                  {challenge.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 12, lineHeight: 1.4 }}>
                  {challenge.description}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>
                    ⚡ +{challenge.xp} XP
                  </span>
                  {done ? (
                    <span style={{ fontSize: 13, color: 'var(--sage)', fontWeight: 700 }}>
                      ✓ Done
                    </span>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleChallengeComplete(challenge.id, challenge.quizId)}
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>
          🎮 Quizzes
        </button>
        <button className={`tab-btn ${activeTab === 'badges' ? 'active' : ''}`} onClick={() => setActiveTab('badges')}>
          🏅 Badges
        </button>
        <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          🏆 Leaderboard
        </button>
      </div>

      {/* QUIZZES TAB */}
      {activeTab === 'quizzes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {quizzes.map((quiz) => {
            const isLocked = quiz.min_level > (user?.level ?? 1)
            const hasBestScore = quiz.best_score !== null
            const passed = hasBestScore && quiz.best_score! >= 70

            return (
              <div
                key={quiz.id}
                className="card"
                style={{
                  padding: 20,
                  opacity: isLocked ? 0.6 : 1,
                  position: 'relative',
                  overflow: 'hidden',
                  borderTop: `3px solid ${DIFFICULTY_COLORS[quiz.difficulty] || 'var(--terra)'}`,
                }}
              >
                {isLocked && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(248,240,228,0.85)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      zIndex: 2,
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <span style={{ fontSize: 32 }}>🔒</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-mid)' }}>Requires Level {quiz.min_level}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>You are Level {user?.level}</div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div
                      className="badge"
                      style={{
                        background: `${DIFFICULTY_COLORS[quiz.difficulty]}20`,
                        color: DIFFICULTY_COLORS[quiz.difficulty],
                        marginBottom: 8,
                        fontSize: 11,
                      }}
                    >
                      {quiz.difficulty}
                    </div>
                    <h3 style={{ fontSize: 16, color: 'var(--text-dark)', fontFamily: "'Inter', sans-serif" }}>
                      {quiz.title}
                    </h3>
                  </div>
                  {hasBestScore && (
                    <div
                      style={{
                        textAlign: 'center',
                        background: passed ? 'var(--sage-pale)' : 'var(--rose-pale)',
                        border: `1px solid ${passed ? 'var(--sage-light)' : '#f0c0c0'}`,
                        borderRadius: 8,
                        padding: '6px 10px',
                        minWidth: 52,
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 700, color: passed ? 'var(--sage)' : 'var(--rose)' }}>
                        {quiz.best_score?.toFixed(0)}%
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>BEST</div>
                    </div>
                  )}
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 12, lineHeight: 1.5 }}>
                  {quiz.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    fontSize: 12,
                    color: 'var(--text-faint)',
                    marginBottom: 14,
                  }}
                >
                  <span>📝 {quiz.question_count} questions</span>
                  <span>⏱ {quiz.time_estimate}</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 700 }}>⚡ {quiz.xp_reward} XP</span>
                </div>

                {hasBestScore && (
                  <div style={{ marginBottom: 14 }}>
                    <ProgressBar value={quiz.best_score ?? 0} />
                  </div>
                )}

                <button
                  className={`btn ${passed ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleStartQuiz(quiz.id)}
                  disabled={isLocked || loadingQuizId === quiz.id}
                >
                  {loadingQuizId === quiz.id ? (
                    <span className="loading-spinner" />
                  ) : !hasBestScore ? (
                    'Play →'
                  ) : passed ? (
                    '↻ Replay'
                  ) : (
                    '↺ Retry →'
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* BADGES TAB */}
      {activeTab === 'badges' && stats && user && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
          {BADGES.map((badge) => {
            const earned = badge.check(stats, user as unknown as { streak: number }, quizzes)
            const progress = badge.progress(stats, user as unknown as { streak: number }, quizzes)
            const label = badge.progressLabel(stats, user as unknown as { streak: number }, quizzes)

            return (
              <div
                key={badge.id}
                className="card"
                style={{
                  padding: 20,
                  textAlign: 'center',
                  filter: earned ? 'none' : 'grayscale(70%)',
                  border: earned ? '2px solid var(--gold)' : '1px dashed var(--border)',
                  opacity: earned ? 1 : 0.7,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 10 }}>{badge.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-dark)', marginBottom: 4 }}>
                  {badge.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-soft)', marginBottom: 12, lineHeight: 1.4 }}>
                  {badge.description}
                </div>
                {earned ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--gold-pale)',
                      color: 'var(--gold)',
                      fontWeight: 700,
                      fontSize: 12,
                      padding: '4px 12px',
                      borderRadius: 99,
                    }}
                  >
                    ✓ Earned
                  </div>
                ) : (
                  <div>
                    <ProgressBar value={progress} color="var(--sand)" />
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>{label}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* LEADERBOARD TAB */}
      {activeTab === 'leaderboard' && (
        <div>
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                gap: 16,
                marginBottom: 32,
                padding: '20px',
              }}
            >
              {/* 2nd place */}
              <div style={{ textAlign: 'center' }}>
                <div
                  className="avatar"
                  style={{
                    width: 52,
                    height: 52,
                    fontSize: 16,
                    background: '#9a9a9a',
                    margin: '0 auto 8px',
                  }}
                >
                  {leaderboard[1].avatar_initials}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>
                  {leaderboard[1].full_name || leaderboard[1].username}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>{leaderboard[1].xp.toLocaleString()} XP</div>
                <div
                  style={{
                    height: 60,
                    background: '#9a9a9a',
                    borderRadius: '8px 8px 0 0',
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: 8,
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 20,
                    width: 70,
                  }}
                >
                  2
                </div>
              </div>

              {/* 1st place */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>👑</div>
                <div
                  className="avatar"
                  style={{
                    width: 64,
                    height: 64,
                    fontSize: 18,
                    background: 'var(--gold)',
                    margin: '0 auto 8px',
                    boxShadow: '0 0 20px rgba(200,146,42,0.4)',
                  }}
                >
                  {leaderboard[0].avatar_initials}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-dark)' }}>
                  {leaderboard[0].full_name || leaderboard[0].username}
                </div>
                <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>
                  {leaderboard[0].xp.toLocaleString()} XP
                </div>
                <div
                  style={{
                    height: 90,
                    background: 'var(--gold)',
                    borderRadius: '8px 8px 0 0',
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: 8,
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 24,
                    width: 80,
                  }}
                >
                  1
                </div>
              </div>

              {/* 3rd place */}
              <div style={{ textAlign: 'center' }}>
                <div
                  className="avatar"
                  style={{
                    width: 48,
                    height: 48,
                    fontSize: 15,
                    background: '#cd7f32',
                    margin: '0 auto 8px',
                  }}
                >
                  {leaderboard[2].avatar_initials}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>
                  {leaderboard[2].full_name || leaderboard[2].username}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>{leaderboard[2].xp.toLocaleString()} XP</div>
                <div
                  style={{
                    height: 44,
                    background: '#cd7f32',
                    borderRadius: '8px 8px 0 0',
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: 8,
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 18,
                    width: 60,
                  }}
                >
                  3
                </div>
              </div>
            </div>
          )}

          {/* Full list */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Department</th>
                  <th>Level</th>
                  <th>XP</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.user_id}
                    style={{
                      background: entry.is_current_user ? 'var(--terra-wash)' : 'transparent',
                    }}
                  >
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            entry.rank === 1
                              ? 'var(--gold)'
                              : entry.rank === 2
                              ? '#9a9a9a'
                              : entry.rank === 3
                              ? '#cd7f32'
                              : 'var(--text-soft)',
                          fontSize: 16,
                        }}
                      >
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                          {entry.avatar_initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {entry.full_name || entry.username}
                            {entry.is_current_user && (
                              <span style={{ fontSize: 11, color: 'var(--terra)', marginLeft: 6 }}>
                                (you)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>@{entry.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--text-soft)' }}>{entry.department || '—'}</span>
                    </td>
                    <td>
                      <span className="badge badge-terra">Lvl {entry.level}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--gold)' }}>
                        {entry.xp.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {activeQuiz && (
        <QuizModal
          quiz={activeQuiz}
          onClose={() => setActiveQuiz(null)}
          onComplete={handleQuizComplete}
        />
      )}
    </div>
  )
}
