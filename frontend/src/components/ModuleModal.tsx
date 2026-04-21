import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'

interface ModuleSection {
  type: string
  heading: string
  body?: string
  points?: string[]
}

interface ModuleContent {
  index: number
  title: string
  duration: string
  xp_reward: number
  sections: ModuleSection[]
  completed: boolean
}

interface ModuleCompleteResult {
  xp_earned: number
  new_xp: number
  new_level: number
  progress_pct: number
  course_completed: boolean
  already_completed: boolean
}

interface Props {
  courseId: string
  courseTitle: string
  courseColor: string
  moduleIndex: number
  onClose: () => void
  onComplete: (result: ModuleCompleteResult) => void
}

export default function ModuleModal({ courseId, courseTitle, courseColor, moduleIndex, onClose, onComplete }: Props) {
  const [module, setModule] = useState<ModuleContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [phase, setPhase] = useState<'reading' | 'done'>('reading')
  const [result, setResult] = useState<ModuleCompleteResult | null>(null)
  const [displayXP, setDisplayXP] = useState(0)
  const [readyToComplete, setReadyToComplete] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/courses/${courseId}/modules/${moduleIndex}`)
        setModule(res.data)
        if (res.data.completed) setReadyToComplete(true)
      } catch {
        onClose()
      } finally {
        setLoading(false)
      }
    }
    load()
    // Allow completing after 8 seconds (enough time to skim content)
    timerRef.current = setTimeout(() => setReadyToComplete(true), 8000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [courseId, moduleIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = async () => {
    if (!module || completing) return
    setCompleting(true)
    try {
      const res = await api.post(`/courses/${courseId}/modules/${moduleIndex}/complete`)
      setResult(res.data)
      setPhase('done')
      // Animate XP counter
      const target = res.data.xp_earned
      let cur = 0
      const step = Math.max(1, Math.ceil(target / 25))
      const interval = setInterval(() => {
        cur = Math.min(cur + step, target)
        setDisplayXP(cur)
        if (cur >= target) clearInterval(interval)
      }, 40)
    } catch {
      setReadyToComplete(false)
    } finally {
      setCompleting(false)
    }
  }

  const renderSection = (section: ModuleSection, i: number) => {
    const { type, heading, body, points } = section

    const calloutStyles: Record<string, React.CSSProperties> = {
      tip: {
        background: 'var(--sage-pale)',
        border: '1px solid var(--sage-light)',
        borderLeft: '4px solid var(--sage)',
      },
      warning: {
        background: '#fff8e6',
        border: '1px solid #f0d070',
        borderLeft: '4px solid var(--gold)',
      },
      example: {
        background: 'var(--terra-wash)',
        border: '1px solid #e8c8a8',
        borderLeft: '4px solid var(--terra)',
      },
    }

    const calloutIcons: Record<string, string> = {
      tip: '💡',
      warning: '⚠️',
      example: '📋',
    }

    if (type === 'text') {
      return (
        <div key={i} style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 10, fontFamily: "'Inter', sans-serif" }}>
            {heading}
          </h4>
          {body?.split('\n\n').map((para, j) => (
            <p key={j} style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-mid)', marginBottom: 10 }}>
              {para}
            </p>
          ))}
        </div>
      )
    }

    if (type === 'key_points' || type === 'steps') {
      return (
        <div key={i} style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>
            {heading}
          </h4>
          <ul style={{ paddingLeft: 0, margin: 0, listStyle: 'none' }}>
            {points?.map((point, j) => (
              <li key={j} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                <span style={{
                  minWidth: 24,
                  height: 24,
                  borderRadius: type === 'steps' ? '50%' : 4,
                  background: courseColor,
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  {type === 'steps' ? j + 1 : '•'}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-mid)' }}>
                  {point.includes(':') ? (
                    <>
                      <strong style={{ color: 'var(--text-dark)' }}>{point.split(':')[0]}:</strong>
                      {point.substring(point.indexOf(':') + 1)}
                    </>
                  ) : point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )
    }

    // tip, warning, example callouts
    if (type === 'tip' || type === 'warning' || type === 'example') {
      return (
        <div key={i} style={{ ...calloutStyles[type], borderRadius: 'var(--radius-sm)', padding: '16px 18px', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{calloutIcons[type]}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {heading}
              </div>
              {body?.split('\n\n').map((para, j) => (
                <p key={j} style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-mid)', marginBottom: j < (body.split('\n\n').length - 1) ? 8 : 0, whiteSpace: 'pre-wrap' }}>
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && !completing && onClose()}
    >
      <div
        className="modal-box"
        style={{ maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {loading && (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <span className="loading-spinner" />
          </div>
        )}

        {!loading && module && phase === 'reading' && (
          <>
            {/* Header */}
            <div style={{
              padding: '20px 28px 16px',
              borderBottom: '1px solid var(--border)',
              borderTop: `4px solid ${courseColor}`,
              borderRadius: 'var(--radius) var(--radius) 0 0',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    {courseTitle} · Module {module.index + 1}
                  </div>
                  <h3 style={{ fontSize: 20, color: 'var(--text-dark)', fontFamily: "'Inter', sans-serif", marginBottom: 8 }}>
                    {module.title}
                  </h3>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-faint)' }}>
                    <span>⏱ {module.duration}</span>
                    <span style={{ color: 'var(--gold)', fontWeight: 700 }}>⚡ +{module.xp_reward} XP</span>
                    {module.completed && (
                      <span style={{ color: 'var(--sage)', fontWeight: 700 }}>✓ Completed</span>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '4px 10px', fontSize: 18, lineHeight: 1 }}
                  onClick={onClose}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              ref={contentRef}
              style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}
            >
              {module.sections.map((section, i) => renderSection(section, i))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 28px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
              background: 'var(--bg-card)',
            }}>
              <button className="btn btn-ghost" onClick={onClose}>
                Back to Courses
              </button>
              <button
                className="btn btn-primary"
                disabled={!readyToComplete || completing}
                style={{ opacity: readyToComplete ? 1 : 0.5 }}
                onClick={handleComplete}
              >
                {completing ? (
                  <><span className="loading-spinner" /> Completing...</>
                ) : module.completed ? (
                  '✓ Already Completed'
                ) : !readyToComplete ? (
                  'Reading...'
                ) : (
                  `Mark Complete · +${module.xp_reward} XP →`
                )}
              </button>
            </div>
          </>
        )}

        {phase === 'done' && result && module && (
          <div style={{ padding: '48px 40px', textAlign: 'center' }}>
            {result.already_completed ? (
              <>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✓</div>
                <h2 style={{ fontSize: 22, marginBottom: 8 }}>Already Completed</h2>
                <p style={{ color: 'var(--text-soft)', marginBottom: 32 }}>
                  You completed this module previously. Keep going!
                </p>
              </>
            ) : (
              <>
                {/* Completion animation */}
                <div style={{ fontSize: 56, marginBottom: 16, animation: 'countUp 0.4s ease' }}>
                  {result.course_completed ? '🏆' : '✅'}
                </div>
                <h2 style={{ fontSize: 22, marginBottom: 8, color: 'var(--text-dark)' }}>
                  {result.course_completed ? 'Course Complete!' : 'Module Complete!'}
                </h2>
                <p style={{ color: 'var(--text-soft)', marginBottom: 24 }}>
                  {result.course_completed
                    ? `You've finished "${courseTitle}"!`
                    : `${module.title} — well done!`}
                </p>

                {/* XP reward */}
                <div style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  background: 'var(--gold-pale)',
                  border: '1px solid #e8d080',
                  borderRadius: 'var(--radius)',
                  padding: '16px 32px',
                  marginBottom: 24,
                }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--gold)', fontFamily: "'Inter', sans-serif" }}>
                    +{displayXP} XP
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-soft)', fontWeight: 600 }}>EARNED</div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 8 }}>
                    Course Progress: {result.progress_pct}%
                  </div>
                  <div style={{ height: 8, background: 'var(--sand-light)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${result.progress_pct}%`,
                      background: `linear-gradient(90deg, ${courseColor}, ${courseColor}aa)`,
                      borderRadius: 99,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              </>
            )}

            <button
              className="btn btn-primary"
              onClick={() => {
                onComplete(result)
                onClose()
              }}
            >
              {result.course_completed ? 'View Certificate →' : 'Continue Learning →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
