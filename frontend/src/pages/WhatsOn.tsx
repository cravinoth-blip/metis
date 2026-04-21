import { useState, useEffect } from 'react'
import { useToast } from '../App'
import api, { Event } from '../lib/api'

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; label: string; emoji: string }> = {
  lunch: { bg: 'var(--terra-wash)', text: 'var(--terra-deep)', border: 'var(--terra-pale)', label: 'Lunch & Learn', emoji: '🍽️' },
  workshop: { bg: 'var(--sage-pale)', text: 'var(--sage)', border: 'var(--sage-light)', label: 'Workshop', emoji: '🔧' },
  webinar: { bg: 'var(--gold-pale)', text: 'var(--gold)', border: '#e8d080', label: 'Webinar', emoji: '💻' },
  news: { bg: 'var(--rose-pale)', text: 'var(--rose)', border: '#f0c0c0', label: 'News', emoji: '📢' },
}

type FilterType = 'all' | 'lunch' | 'workshop' | 'webinar' | 'news'

export default function WhatsOn() {
  const { showToast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [scraping, setScraping] = useState(false)

  const fetchEvents = async (type?: FilterType) => {
    try {
      const params = type && type !== 'all' ? `?event_type=${type}` : ''
      const res = await api.get(`/events/${params}`)
      setEvents(res.data)
    } catch (err) {
      console.error(err)
      showToast('Failed to load events', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents(filter)
  }, [filter])

  const handleScrape = async () => {
    setScraping(true)
    try {
      const res = await api.post('/admin/scrape-events')
      showToast(res.data.message, 'success')
      fetchEvents(filter)
    } catch {
      showToast('Scrape failed', 'error')
    } finally {
      setScraping(false)
    }
  }

  const newsEvents = events.filter((e) => e.event_type === 'news')
  const otherEvents = events.filter((e) => e.event_type !== 'news')

  if (loading) {
    return <div className="loading-overlay"><span className="loading-spinner" /> Loading events...</div>
  }

  const TABS: { key: FilterType; label: string; emoji: string }[] = [
    { key: 'all', label: 'All', emoji: '📋' },
    { key: 'lunch', label: 'Lunch & Learn', emoji: '🍽️' },
    { key: 'workshop', label: 'Workshop', emoji: '🔧' },
    { key: 'webinar', label: 'Webinar', emoji: '💻' },
    { key: 'news', label: 'News', emoji: '📢' },
  ]

  return (
    <div className="fade-in" style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24 }}>What's On</h2>
          <p style={{ color: 'var(--text-soft)', fontSize: 14, marginTop: 4 }}>
            Events, workshops, webinars and news
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleScrape}
          disabled={scraping}
        >
          {scraping ? <span className="loading-spinner" /> : '🔄'} Refresh Events
        </button>
      </div>

      {/* Filter tabs */}
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${filter === tab.key ? 'active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* News banners */}
      {(filter === 'all' || filter === 'news') && newsEvents.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {newsEvents.map((event) => {
            const parsedTags = (() => {
              try { return JSON.parse(event.tags) as string[] } catch { return [] }
            })()
            return (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: '16px 20px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderLeft: '4px solid var(--rose)',
                  borderRadius: 'var(--radius)',
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 24, flexShrink: 0 }}>📢</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h4 style={{ fontSize: 15, color: 'var(--text-dark)' }}>{event.title}</h4>
                    <span style={{ fontSize: 11, background: 'var(--rose-pale)', color: 'var(--rose)', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                      NEWS
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.5 }}>{event.description}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {parsedTags.map((tag: string) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                    <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>— {event.host}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Event cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {otherEvents.map((event) => {
          const typeInfo = TYPE_COLORS[event.event_type] || TYPE_COLORS.webinar
          const parsedTags = (() => {
            try { return JSON.parse(event.tags) as string[] } catch { return [] }
          })()
          const spotsLeft = event.capacity > 0 ? event.capacity - event.registered_count : null
          const isFull = spotsLeft !== null && spotsLeft <= 0

          return (
            <div key={event.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Top band */}
              <div
                style={{
                  height: 6,
                  background: `linear-gradient(90deg, ${typeInfo.text}, ${typeInfo.border})`,
                }}
              />

              <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Type + host */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: typeInfo.bg,
                      color: typeInfo.text,
                      border: `1px solid ${typeInfo.border}`,
                      padding: '3px 10px',
                      borderRadius: 99,
                    }}
                  >
                    {typeInfo.emoji} {typeInfo.label}
                  </span>
                  {event.xp_reward > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>
                      ⚡ +{event.xp_reward} XP
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: 16, fontFamily: "'Inter', sans-serif", marginBottom: 6 }}>
                  {event.title}
                </h3>

                <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.5, marginBottom: 12, flex: 1 }}>
                  {event.description}
                </p>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                  {event.host && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-mid)' }}>
                      <span>👤</span><span>{event.host}</span>
                    </div>
                  )}
                  {event.event_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-mid)' }}>
                      <span>📅</span><span>{event.event_date}{event.event_time ? `, ${event.event_time}` : ''}</span>
                    </div>
                  )}
                  {event.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-mid)' }}>
                      <span>📍</span><span>{event.location}</span>
                    </div>
                  )}
                  {spotsLeft !== null && (
                    <div style={{ fontSize: 12, color: isFull ? 'var(--rose)' : 'var(--sage)', fontWeight: 600 }}>
                      {isFull ? '🔴 Full' : `🟢 ${spotsLeft} spots remaining`}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {parsedTags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {parsedTags.map((tag: string) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}

                {/* Training link */}
                <a
                  href={event.source_url || '/learning'}
                  target={event.source_url ? '_blank' : '_self'}
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', display: 'flex' }}
                >
                  View Training →
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {otherEvents.length === 0 && newsEvents.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No events found</h3>
          <p>Check back later or refresh to fetch new events</p>
        </div>
      )}
    </div>
  )
}
