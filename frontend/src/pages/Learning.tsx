import { useState, useEffect } from 'react'
import { useToast } from '../App'
import api from '../lib/api'
import ProgressBar from '../components/ProgressBar'
import ModuleModal from '../components/ModuleModal'

interface CourseSummary {
  id: string
  title: string
  description: string
  category: string
  level: string
  emoji: string
  color: string
  duration: string
  total_modules: number
  progress_pct: number
  modules_completed: number[]
}

interface ModuleCompleteResult {
  xp_earned: number
  new_xp: number
  new_level: number
  progress_pct: number
  course_completed: boolean
  already_completed: boolean
}

// Static module titles for each course (matches backend course_data.py order)
const COURSE_MODULE_TITLES: Record<string, string[]> = {
  'ai-writing-101': [
    'Introduction to AI Writing Tools',
    'Prompting for CSR Sections',
    'Plain Language Summaries with AI',
    'AI for Adverse Event Narratives',
    'Quality Control of AI Output',
    'Regulatory Compliance for AI Content',
  ],
  'slr-ai': [
    'PICO Framework and AI Tools',
    'Abstract Screening with Elicit',
    'Data Extraction Tables',
    'Using Consensus for Evidence Synthesis',
    'SLR Quality Checklist',
  ],
  'prompt-mastery': [
    'Zero-Shot vs Few-Shot Prompting',
    'Chain-of-Thought Techniques',
    'Role and Context Setting',
    'Output Format Control',
    'Iterative Prompt Refinement',
    'Advanced: Prompt Chaining',
    'Advanced: System Prompts',
    'Prompt Security and Injection',
  ],
  'ai-governance': [
    'GDPR and Personal Data in AI',
    'EU AI Act Essentials',
    'Company AI Acceptable Use Policy',
    'Data Incident Response',
  ],
  'biorender-masterclass': [
    'BioRender Interface Overview',
    'Building MOA Diagrams',
    'Cell and Pathway Templates',
    'Licence and Export for Publication',
    'Advanced Figure Composition',
  ],
  'data-ai': [
    'Structured vs Unstructured Data',
    'Key Statistical Concepts',
    'Interpreting AI Confidence and Uncertainty',
    'Recognising Overfitting and Bias',
    'Data Quality Fundamentals',
    'Synthetic Data and Privacy',
  ],
}

export default function Learning() {
  const { showToast } = useToast()
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [activeModule, setActiveModule] = useState<{ courseId: string; moduleIndex: number } | null>(null)

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses/')
      setCourses(res.data)
    } catch {
      // Fallback silently — user will see empty state
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const categories = ['All', ...Array.from(new Set(courses.map((c) => c.category)))]

  const filtered = courses.filter((course) => {
    const matchSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = categoryFilter === 'All' || course.category === categoryFilter
    return matchSearch && matchCat
  })

  const handleModuleComplete = async (result: ModuleCompleteResult) => {
    await fetchCourses()
    if (!result.already_completed) {
      showToast(
        result.course_completed
          ? `Course complete! +${result.xp_earned} XP`
          : `Module complete! +${result.xp_earned} XP`,
        'success'
      )
    }
  }

  if (loading) {
    return <div className="loading-overlay"><span className="loading-spinner" /> Loading courses...</div>
  }

  return (
    <div className="fade-in" style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, marginBottom: 4 }}>Learning Paths</h2>
        <p style={{ color: 'var(--text-soft)', fontSize: 15 }}>
          Structured learning modules for every skill level — click any module to start reading
        </p>
      </div>

      {/* Search and filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-pill ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Course list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.map((course) => {
          const isComplete = course.progress_pct >= 100
          const isExpanded = expandedCourse === course.id
          const moduleTitles = COURSE_MODULE_TITLES[course.id] || []

          return (
            <div key={course.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Course header (clickable to expand) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '20px 24px',
                  cursor: 'pointer',
                  borderLeft: `4px solid ${course.color}`,
                }}
                onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
              >
                <span style={{ fontSize: 32 }}>{course.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 17 }}>{course.title}</h3>
                    {isComplete && (
                      <span style={{
                        fontSize: 12,
                        background: 'var(--sage-pale)',
                        color: 'var(--sage)',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                      }}>
                        ✓ Complete
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 10 }}>
                    {course.description}
                  </p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>
                    <span>📚 {course.total_modules} modules</span>
                    <span>⏱ {course.duration}</span>
                    <span>{course.level}</span>
                    <span style={{ background: `${course.color}20`, color: course.color, padding: '1px 8px', borderRadius: 99, fontWeight: 600 }}>
                      {course.category}
                    </span>
                  </div>
                  <ProgressBar
                    value={course.progress_pct}
                    color={`linear-gradient(90deg, ${course.color}, ${course.color}aa)`}
                    showLabel
                  />
                </div>
                <span style={{
                  color: 'var(--text-faint)',
                  fontSize: 18,
                  transform: isExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}>
                  ▼
                </span>
              </div>

              {/* Expanded module list */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 24px' }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-faint)',
                    marginBottom: 12,
                  }}>
                    Modules — click to open
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {moduleTitles.map((title, i) => {
                      const moduleComplete = course.modules_completed.includes(i)
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 14px',
                            background: moduleComplete ? 'var(--sage-pale)' : 'var(--bg-surface)',
                            border: `1px solid ${moduleComplete ? 'var(--sage-light)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onClick={() => setActiveModule({ courseId: course.id, moduleIndex: i })}
                        >
                          {/* Module number / check */}
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: moduleComplete ? 'var(--sage)' : course.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'white',
                            flexShrink: 0,
                          }}>
                            {moduleComplete ? '✓' : i + 1}
                          </div>

                          <span style={{
                            fontSize: 14,
                            color: moduleComplete ? 'var(--sage)' : 'var(--text-dark)',
                            flex: 1,
                          }}>
                            {title}
                          </span>

                          <span style={{
                            fontSize: 12,
                            color: moduleComplete ? 'var(--sage)' : 'var(--terra)',
                            fontWeight: 600,
                          }}>
                            {moduleComplete ? '✓ Done' : 'Read →'}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Course progress footer */}
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-soft)' }}>
                      {course.modules_completed.length} of {course.total_modules} modules completed
                    </span>
                    {!isComplete && course.modules_completed.length > 0 && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          // Find first incomplete module
                          const next = Array.from({ length: course.total_modules }, (_, i) => i)
                            .find((i) => !course.modules_completed.includes(i))
                          if (next !== undefined) {
                            setActiveModule({ courseId: course.id, moduleIndex: next })
                          }
                        }}
                      >
                        Continue →
                      </button>
                    )}
                    {!isComplete && course.modules_completed.length === 0 && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setActiveModule({ courseId: course.id, moduleIndex: 0 })}
                      >
                        Start Course →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No courses found</h3>
          <p>Try adjusting your search or filter</p>
        </div>
      )}

      {/* Module reading modal */}
      {activeModule && (() => {
        const course = courses.find((c) => c.id === activeModule.courseId)
        if (!course) return null
        return (
          <ModuleModal
            courseId={activeModule.courseId}
            courseTitle={course.title}
            courseColor={course.color}
            moduleIndex={activeModule.moduleIndex}
            onClose={() => setActiveModule(null)}
            onComplete={handleModuleComplete}
          />
        )
      })()}
    </div>
  )
}
