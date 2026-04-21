import { useState, useEffect, useCallback } from 'react'
import { QuizDetail, QuizResult, QuizQuestion } from '../lib/api'
import api from '../lib/api'
import ProgressBar from './ProgressBar'

interface QuizModalProps {
  quiz: QuizDetail
  onClose: () => void
  onComplete: (result: QuizResult) => void
}

type Phase = 'quiz' | 'results'

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: '📝 Multiple Choice',
  spot_hallucination: '🔍 Spot the Hallucination',
  best_prompt: '✍️ Best Prompt',
  which_tool: '🛠️ Which Tool?',
  ethics_check: '⚖️ Ethics Check',
  scenario: '🎭 Scenario',
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

export default function QuizModal({ quiz, onClose, onComplete }: QuizModalProps) {
  const [phase, setPhase] = useState<Phase>('quiz')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>(new Array(quiz.questions.length).fill(-1))
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [displayXP, setDisplayXP] = useState(0)

  const currentQuestion: QuizQuestion = quiz.questions[currentIndex]
  const progress = ((currentIndex + (revealed ? 1 : 0)) / quiz.questions.length) * 100

  const handleSelectAnswer = (optionIndex: number) => {
    if (revealed) return
    setSelectedAnswer(optionIndex)
    const newAnswers = [...answers]
    newAnswers[currentIndex] = optionIndex
    setAnswers(newAnswers)
    setRevealed(true)
  }

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((i) => i + 1)
      setSelectedAnswer(null)
      setRevealed(false)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.post(`/quiz/${quiz.id}/submit`, { answers })
      setResult(res.data)
      setPhase('results')
      // Animate XP counter
      const targetXP = res.data.xp_earned
      let current = 0
      const step = Math.ceil(targetXP / 30)
      const interval = setInterval(() => {
        current = Math.min(current + step, targetXP)
        setDisplayXP(current)
        if (current >= targetXP) clearInterval(interval)
      }, 40)
    } catch (err: unknown) {
      console.error('Submit error', err)
    } finally {
      setLoading(false)
    }
  }, [quiz.id, answers])

  const getOptionStyle = (optionIndex: number) => {
    const base: React.CSSProperties = {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '14px 16px',
      borderRadius: 'var(--radius-sm)',
      border: '2px solid var(--border)',
      cursor: revealed ? 'default' : 'pointer',
      transition: 'all 0.2s',
      marginBottom: 10,
      background: 'var(--bg-surface)',
    }

    if (!revealed) {
      if (selectedAnswer === optionIndex) {
        return { ...base, border: '2px solid var(--terra)', background: 'var(--terra-wash)' }
      }
      return base
    }

    // Revealed state
    if (optionIndex === currentQuestion.correct_index) {
      return { ...base, border: '2px solid var(--sage)', background: 'var(--sage-pale)', cursor: 'default' }
    }
    if (optionIndex === selectedAnswer && selectedAnswer !== currentQuestion.correct_index) {
      return { ...base, border: '2px solid var(--rose)', background: 'var(--rose-pale)', cursor: 'default' }
    }
    return { ...base, opacity: 0.5, cursor: 'default' }
  }

  const getLetterBadgeStyle = (optionIndex: number): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      borderRadius: '50%',
      fontSize: 13,
      fontWeight: 700,
      flexShrink: 0,
      background: 'var(--sand-light)',
      color: 'var(--text-mid)',
    }

    if (!revealed) {
      if (selectedAnswer === optionIndex) {
        return { ...base, background: 'var(--terra)', color: 'white' }
      }
      return base
    }

    if (optionIndex === currentQuestion.correct_index) {
      return { ...base, background: 'var(--sage)', color: 'white' }
    }
    if (optionIndex === selectedAnswer) {
      return { ...base, background: 'var(--rose)', color: 'white' }
    }
    return base
  }

  const scoreColor = result
    ? result.score_pct >= 70
      ? 'var(--sage)'
      : result.score_pct >= 50
      ? 'var(--gold)'
      : 'var(--rose)'
    : 'var(--terra)'

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !loading && onClose()}>
      <div className="modal-box" style={{ maxWidth: 640 }}>
        {phase === 'quiz' && (
          <>
            {/* Header */}
            <div
              style={{
                padding: '20px 24px 16px',
                borderBottom: '1px solid var(--border)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-soft)' }}>
                    {quiz.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--terra)', fontWeight: 600, marginTop: 2 }}>
                    {TYPE_LABELS[currentQuestion.type] || '📝 Question'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>
                    {currentIndex + 1} / {quiz.questions.length}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>
                    ⚡ {quiz.xp_reward} XP
                  </div>
                </div>
              </div>
              <ProgressBar value={progress} />
            </div>

            {/* Question */}
            <div style={{ padding: '24px' }}>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: 'var(--text-dark)',
                  marginBottom: 20,
                  fontWeight: 500,
                }}
              >
                {currentQuestion.question}
              </p>

              {/* Options */}
              <div>
                {currentQuestion.options.map((option, i) => (
                  <div key={i} style={getOptionStyle(i)} onClick={() => handleSelectAnswer(i)}>
                    <div style={getLetterBadgeStyle(i)}>{OPTION_LETTERS[i]}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-dark)', paddingTop: 3 }}>
                      {option}
                    </div>
                    {revealed && i === currentQuestion.correct_index && (
                      <span style={{ marginLeft: 'auto', fontSize: 18 }}>✓</span>
                    )}
                    {revealed && i === selectedAnswer && i !== currentQuestion.correct_index && (
                      <span style={{ marginLeft: 'auto', fontSize: 18 }}>✕</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Explanation */}
              {revealed && (
                <div
                  style={{
                    background: selectedAnswer === currentQuestion.correct_index ? 'var(--sage-pale)' : 'var(--rose-pale)',
                    border: `1px solid ${selectedAnswer === currentQuestion.correct_index ? 'var(--sage-light)' : '#f0c0c0'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 16px',
                    marginTop: 12,
                    animation: 'fadeIn 0.3s ease',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: selectedAnswer === currentQuestion.correct_index ? 'var(--sage)' : 'var(--rose)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {selectedAnswer === currentQuestion.correct_index ? '✓ Correct!' : '✕ Incorrect'}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-dark)', lineHeight: 1.6 }}>
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                <button className="btn btn-ghost" onClick={onClose}>
                  Exit Quiz
                </button>
                {revealed && (
                  <button
                    className="btn btn-primary"
                    onClick={handleNext}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="loading-spinner" />
                    ) : currentIndex < quiz.questions.length - 1 ? (
                      'Next Question →'
                    ) : (
                      'See Results →'
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {phase === 'results' && result && (
          <div style={{ padding: '40px 32px', textAlign: 'center' }}>
            {/* Score circle */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                border: `4px solid ${scoreColor}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                animation: 'countUp 0.5s ease',
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Inter', sans-serif", color: scoreColor }}>
                {result.score_pct.toFixed(0)}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-soft)', fontWeight: 600 }}>SCORE</div>
            </div>

            <h2 style={{ fontSize: 24, marginBottom: 8, color: 'var(--text-dark)' }}>
              {result.message}
            </h2>

            <p style={{ color: 'var(--text-soft)', marginBottom: 24 }}>
              {result.correct_count} out of {result.total_questions} correct
            </p>

            {/* XP earned */}
            <div
              style={{
                background: 'var(--gold-pale)',
                border: '1px solid #e8d080',
                borderRadius: 'var(--radius)',
                padding: '16px 24px',
                marginBottom: 24,
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                animation: 'countUp 0.6s ease 0.3s both',
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "'Inter', sans-serif", color: 'var(--gold)' }}>
                +{displayXP} XP
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-soft)', fontWeight: 600 }}>
                {result.passed ? 'FULL REWARD' : 'PARTICIPATION REWARD'}
              </div>
            </div>

            {/* Pass/Fail */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 20px',
                borderRadius: 99,
                background: result.passed ? 'var(--sage-pale)' : 'var(--rose-pale)',
                color: result.passed ? 'var(--sage)' : 'var(--rose)',
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 28,
              }}
            >
              {result.passed ? '✓ PASSED' : '✕ NOT PASSED (70% required)'}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setPhase('quiz')
                  setCurrentIndex(0)
                  setAnswers(new Array(quiz.questions.length).fill(-1))
                  setSelectedAnswer(null)
                  setRevealed(false)
                  setResult(null)
                  setDisplayXP(0)
                }}
              >
                ↻ Retry Quiz
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onComplete(result)
                  onClose()
                }}
              >
                Done ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
