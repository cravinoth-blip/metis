import { useState, useEffect } from 'react'
import { useToast } from '../App'
import api, { PlatformStats, Event } from '../lib/api'

type AdminTab = 'overview' | 'users' | 'events' | 'analytics'

interface AdminUser {
  id: number
  email: string
  username: string
  full_name: string
  department: string
  avatar_initials: string
  is_admin: boolean
  is_active: boolean
  xp: number
  level: number
  quiz_count: number
  created_at: string | null
}

interface QuizStat {
  quiz_id: string
  title: string
  attempts: number
  avg_score: number
  pass_rate: number
}

interface ToolUsageStat {
  tool_name: string
  count: number
}

export default function Admin() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [quizStats, setQuizStats] = useState<QuizStat[]>([])
  const [toolUsage, setToolUsage] = useState<ToolUsageStat[]>([])
  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [scraping, setScraping] = useState(false)

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'webinar',
    host: '',
    event_date: '',
    event_time: '',
    location: '',
    tags: '[]',
    xp_reward: 0,
    capacity: 0,
    source_url: '',
  })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, eventsRes, quizRes, toolRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/events/'),
        api.get('/admin/quiz-stats'),
        api.get('/admin/tool-usage'),
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
      setEvents(eventsRes.data)
      setQuizStats(quizRes.data)
      setToolUsage(toolRes.data.tool_usage || [])
    } catch (err) {
      showToast('Failed to load admin data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (userId: number, data: Partial<AdminUser & { xp?: number }>) => {
    try {
      await api.put(`/admin/users/${userId}`, data)
      showToast('User updated', 'success')
      const res = await api.get('/admin/users')
      setUsers(res.data)
    } catch {
      showToast('Update failed', 'error')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Deactivate this user?')) return
    try {
      await api.delete(`/admin/users/${userId}`)
      showToast('User deactivated', 'success')
      const res = await api.get('/admin/users')
      setUsers(res.data)
    } catch {
      showToast('Failed to deactivate', 'error')
    }
  }

  const handleSaveEvent = async () => {
    try {
      if (editingEvent) {
        await api.put(`/admin/events/${editingEvent.id}`, eventForm)
        showToast('Event updated', 'success')
      } else {
        await api.post('/admin/events', eventForm)
        showToast('Event created', 'success')
      }
      setShowEventModal(false)
      setEditingEvent(null)
      resetEventForm()
      const res = await api.get('/events/')
      setEvents(res.data)
    } catch {
      showToast('Failed to save event', 'error')
    }
  }

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Delete this event?')) return
    try {
      await api.delete(`/admin/events/${eventId}`)
      showToast('Event deleted', 'success')
      const res = await api.get('/events/')
      setEvents(res.data)
    } catch {
      showToast('Failed to delete event', 'error')
    }
  }

  const handleScrape = async () => {
    setScraping(true)
    try {
      const res = await api.post('/admin/scrape-events')
      showToast(res.data.message, 'success')
      const evRes = await api.get('/events/')
      setEvents(evRes.data)
    } catch {
      showToast('Scrape failed', 'error')
    } finally {
      setScraping(false)
    }
  }

  const resetEventForm = () => {
    setEventForm({
      title: '', description: '', event_type: 'webinar', host: '',
      event_date: '', event_time: '', location: '', tags: '[]',
      xp_reward: 0, capacity: 0, source_url: '',
    })
  }

  const openEditEvent = (event: Event) => {
    setEditingEvent(event)
    setEventForm({
      title: event.title, description: event.description,
      event_type: event.event_type, host: event.host,
      event_date: event.event_date, event_time: event.event_time,
      location: event.location, tags: event.tags,
      xp_reward: event.xp_reward, capacity: event.capacity,
      source_url: event.source_url,
    })
    setShowEventModal(true)
  }

  const filteredUsers = users.filter((u) =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.department.toLowerCase().includes(userSearch.toLowerCase())
  )

  if (loading) {
    return <div className="loading-overlay"><span className="loading-spinner" /> Loading admin data...</div>
  }

  const maxToolUsage = Math.max(...toolUsage.map((t) => t.count), 1)
  const maxQuizAttempts = Math.max(...quizStats.map((q) => q.attempts), 1)

  return (
    <div className="fade-in" style={{ maxWidth: 1200 }}>
      <div className="tab-bar">
        {([
          ['overview', '📊 Overview'],
          ['users', '👥 Users'],
          ['events', '📅 Events'],
          ['analytics', '📈 Analytics'],
        ] as [AdminTab, string][]).map(([key, label]) => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && stats && (
        <div>
          <div className="grid-3" style={{ marginBottom: 28 }}>
            {[
              { emoji: '👥', label: 'Total Users', value: stats.total_users, color: 'var(--terra)' },
              { emoji: '🟢', label: 'Active Today', value: stats.active_today, color: 'var(--sage)' },
              { emoji: '🎮', label: 'Quizzes Today', value: stats.quizzes_taken_today, color: 'var(--gold)' },
              { emoji: '📊', label: 'Avg Quiz Score', value: `${stats.avg_score}%`, color: '#7a6aaa' },
              { emoji: '⚡', label: 'Total XP Awarded', value: stats.total_xp_awarded.toLocaleString(), color: 'var(--terra-light)' },
              { emoji: '📅', label: 'Active Events', value: stats.total_events, color: 'var(--bark-mid)' },
            ].map((s) => (
              <div key={s.label} className="card" style={{ padding: '18px 22px', borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.emoji}</div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Inter', sans-serif", color: s.color }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Recent signups */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16 }}>Recent Signups</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Department</th>
                  <th>Level</th>
                  <th>XP</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 8).map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                          {user.avatar_initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{user.full_name || user.username}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 13 }}>{user.department || '—'}</span></td>
                    <td><span className="badge badge-terra">Lvl {user.level}</span></td>
                    <td><span style={{ fontWeight: 700, color: 'var(--gold)' }}>{user.xp}</span></td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-soft)' }}>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USERS */}
      {activeTab === 'users' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search users by name, email, department..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="card" style={{ overflow: 'auto' }}>
            <table className="data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Department</th>
                  <th>Level</th>
                  <th>XP</th>
                  <th>Quizzes</th>
                  <th>Admin</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                          {user.avatar_initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{user.full_name || user.username}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 12 }}>{user.department || '—'}</span></td>
                    <td><span className="badge badge-terra">Lvl {user.level}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 13 }}>{user.xp}</span>
                        <button
                          onClick={() => handleUpdateUser(user.id, { xp: user.xp + 100 })}
                          style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, background: 'var(--sage-pale)', color: 'var(--sage)', border: 'none', cursor: 'pointer' }}
                          title="+100 XP"
                        >+100</button>
                        <button
                          onClick={() => handleUpdateUser(user.id, { xp: Math.max(0, user.xp - 100) })}
                          style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, background: 'var(--rose-pale)', color: 'var(--rose)', border: 'none', cursor: 'pointer' }}
                          title="-100 XP"
                        >-100</button>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 13 }}>{user.quiz_count}</span></td>
                    <td>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: user.is_admin ? 'var(--terra-pale)' : 'var(--sand-pale)',
                          color: user.is_admin ? 'var(--terra-deep)' : 'var(--text-faint)',
                        }}
                      >
                        {user.is_admin ? '✓ Admin' : 'User'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: user.is_active ? 'var(--sage-pale)' : 'var(--rose-pale)',
                        color: user.is_active ? 'var(--sage)' : 'var(--rose)',
                      }}>
                        {user.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleUpdateUser(user.id, { is_admin: !user.is_admin })}
                        >
                          {user.is_admin ? 'Revoke Admin' : 'Grant Admin'}
                        </button>
                        {user.is_active && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EVENTS */}
      {activeTab === 'events' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 16 }}>
            <button
              className="btn btn-secondary"
              onClick={handleScrape}
              disabled={scraping}
            >
              {scraping ? <span className="loading-spinner" /> : '🔄'} Scrape New Events
            </button>
            <button
              className="btn btn-primary"
              onClick={() => { resetEventForm(); setEditingEvent(null); setShowEventModal(true) }}
            >
              + Add Event
            </button>
          </div>

          <div className="card" style={{ overflow: 'auto' }}>
            <table className="data-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>XP</th>
                  <th>Registrations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{event.title}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${event.event_type === 'news' ? 'rose' : event.event_type === 'workshop' ? 'sage' : 'terra'}`}>
                        {event.event_type}
                      </span>
                    </td>
                    <td><span style={{ fontSize: 12 }}>{event.event_date || '—'}</span></td>
                    <td><span style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>{event.xp_reward}</span></td>
                    <td>
                      <span style={{ fontSize: 13 }}>
                        {event.registered_count}{event.capacity > 0 ? `/${event.capacity}` : ''}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditEvent(event)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEvent(event.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Quiz stats */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 17, marginBottom: 20 }}>Quiz Completion Rates</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {quizStats.map((qs) => (
                <div key={qs.quiz_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)' }}>{qs.title}</span>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-soft)' }}>
                      <span>{qs.attempts} attempts</span>
                      <span style={{ color: 'var(--gold)' }}>Avg: {qs.avg_score}%</span>
                      <span style={{ color: qs.pass_rate >= 70 ? 'var(--sage)' : 'var(--rose)' }}>
                        Pass: {qs.pass_rate}%
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ flex: 1 }}>
                      <div className="progress-bar" style={{ height: 10 }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${maxQuizAttempts > 0 ? (qs.attempts / maxQuizAttempts) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ width: 120 }}>
                      <div className="progress-bar" style={{ height: 10 }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${qs.pass_rate}%`,
                            background: qs.pass_rate >= 70 ? 'linear-gradient(90deg, var(--sage), var(--sage-light))' : 'linear-gradient(90deg, var(--rose), #e08080)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tool usage */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 17, marginBottom: 20 }}>Top AI Tools Used</h3>
            {toolUsage.length === 0 ? (
              <p style={{ color: 'var(--text-soft)', fontSize: 14 }}>No tool usage logged yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {toolUsage.slice(0, 10).map((t) => (
                  <div key={t.tool_name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 180, fontSize: 13, fontWeight: 600, color: 'var(--text-dark)', flexShrink: 0 }}>
                      {t.tool_name}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="progress-bar" style={{ height: 12 }}>
                        <div
                          className="progress-fill"
                          style={{ width: `${(t.count / maxToolUsage) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div style={{ width: 40, textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--terra)' }}>
                      {t.count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowEventModal(false)}>
          <div className="modal-box" style={{ maxWidth: 560 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 18 }}>{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={eventForm.event_type} onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}>
                    <option value="lunch">Lunch & Learn</option>
                    <option value="workshop">Workshop</option>
                    <option value="webinar">Webinar</option>
                    <option value="news">News</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Host</label>
                  <input className="form-input" value={eventForm.host} onChange={(e) => setEventForm({ ...eventForm, host: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" placeholder="e.g. Tue 25 March 2025" value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input className="form-input" placeholder="e.g. 12:30 - 13:30" value={eventForm.event_time} onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">XP Reward</label>
                  <input type="number" className="form-input" value={eventForm.xp_reward} onChange={(e) => setEventForm({ ...eventForm, xp_reward: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity (0=unlimited)</label>
                  <input type="number" className="form-input" value={eventForm.capacity} onChange={(e) => setEventForm({ ...eventForm, capacity: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tags (JSON array, e.g. ["AI", "Writing"])</label>
                <input className="form-input" value={eventForm.tags} onChange={(e) => setEventForm({ ...eventForm, tags: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button className="btn btn-ghost" onClick={() => setShowEventModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveEvent}>
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
