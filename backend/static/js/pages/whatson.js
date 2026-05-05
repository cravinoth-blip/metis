import { api } from '../api.js';

// ── Configuration & Colors ──────────────────────────────────────────────────
const EVENT_COLORS = {
  news:        { bg: '#eff6ff', color: '#2563eb', label: '📰 AI News' },
  launch:      { bg: '#fef3c7', color: '#d97706', label: '🚀 Launch' },
  workshop:    { bg: '#dcfce7', color: '#16a34a', label: '🛠️ Workshop' },
  webinar:     { bg: '#ede9fe', color: '#7c3aed', label: '💻 Webinar' },
  conference:  { bg: '#fee2e2', color: '#dc2626', label: '🎤 Conference' },
};

const FORMAT_COLORS = {
  'in-person': { bg: '#dcfce7', color: '#16a34a', label: '🏢 In-Person' },
  'online':    { bg: '#ede9fe', color: '#7c3aed', label: '💻 Online' },
  'hybrid':    { bg: '#fef3c7', color: '#d97706', label: '🔀 Hybrid' },
  'other':     { bg: '#f1f5f9', color: '#64748b', label: '📌 Other' },
};

const PLATFORM_COLORS = {
  'Zoom':         { bg: '#dbeafe', color: '#1d4ed8' },
  'Teams':        { bg: '#ede9fe', color: '#6d28d9' },
  'YouTube Live': { bg: '#fee2e2', color: '#dc2626' },
};

// ── Helper Badge Components ─────────────────────────────────────────────────
const badge = (c, label) => `<span class="type-badge" style="background:${c.bg};color:${c.color}">${label}</span>`;

const eventBadge = (type) => {
  const c = EVENT_COLORS[type] || { bg: '#f1f5f9', color: '#64748b' };
  return badge(c, c.label || type);
};

const formatBadge = (format) => {
  const c = FORMAT_COLORS[format] || FORMAT_COLORS.other;
  return badge(c, c.label);
};

const platformBadge = (platform) => {
  const c = PLATFORM_COLORS[platform] || { bg: '#f1f5f9', color: '#64748b' };
  return badge(c, `📡 ${platform}`);
};

const catBadge = (cat) =>
  `<span class="type-badge" style="background:#f1f5f9;color:#64748b;margin-left:4px">${cat}</span>`;

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  : null;

// ── Unified Card Renderer ───────────────────────────────────────────────────
function renderCard(ev) {
  const startStr = fmtDate(ev.start_date);
  const endStr   = fmtDate(ev.end_date);
  const dateStr  = startStr && endStr && startStr !== endStr
    ? `${startStr} – ${endStr}`
    : (startStr || ev.display_date || ev.event_date || '');

  const person   = ev.organizer || ev.speaker || ev.host;
  const link     = ev.registration_url || ev.url;
  const linkText = ev.registration_url ? 'Access link →' : 'View →';

  return `
    <div class="event-card">
      ${eventBadge(ev.event_type)}
      ${ev.format ? formatBadge(ev.format) : ev.platform ? platformBadge(ev.platform) : ''}
      ${ev.category ? catBadge(ev.category) : ''}
      <div style="font-weight:600;margin:8px 0 4px">${ev.title}</div>
      <div class="text-sm text-secondary" style="margin-bottom:8px">${ev.description ?? ''}</div>
      <div class="flex gap-3 text-sm text-secondary" style="flex-wrap:wrap">
        ${dateStr              ? `<span>📅 ${dateStr}</span>` : ''}
        ${ev.duration_minutes  ? `<span>⏱ ${ev.duration_minutes} min</span>` : ''}
        ${ev.location          ? `<span>📍 ${ev.location}</span>` : ''}
        ${person               ? `<span>👤 ${person}</span>` : ''}
        ${ev.capacity          ? `<span>👥 ${ev.capacity} spots</span>` : ''}
        ${ev.xp_reward         ? `<span style="color:var(--gold)">⚡ ${ev.xp_reward} XP</span>` : ''}
      </div>
      ${link ? `<a href="${link}" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:12px;text-decoration:none">${linkText}</a>` : ''}
    </div>`;
}

// ── Main Render Function ────────────────────────────────────────────────────
export async function render(el) {
  let activeFilter = 'all';

  async function updateView() {
    const pane = el.querySelector('#whatson-pane');
    pane.innerHTML = '<div class="loading">Loading events…</div>';

    try {
      const url = activeFilter === 'all'
        ? '/events/'
        : `/events/?event_type=${activeFilter}`;

      let data;
      try {
        const res = await api.get(url);
        data = Array.isArray(res) ? res : [];
      } catch (e) {
        console.warn('Fetch error:', e);
        data = [];
      }

      data.sort((a, b) => {
        const dateA = new Date(a.start_date || a.display_date || 0);
        const dateB = new Date(b.start_date || b.display_date || 0);
        return dateB - dateA;
      });

      pane.innerHTML = data.length
        ? data.map(renderCard).join('')
        : `<div class="empty-state">No ${activeFilter} items found.</div>`;

    } catch (err) {
      console.error('Critical error:', err);
      pane.innerHTML = `<div class="error">Unable to load data. Please try again.</div>`;
    }
  }

  // ── Component Shell ───────────────────────────────────────────────────────
  el.innerHTML = `
    <div class="filter-pills" id="whatson-filters" style="margin-bottom:20px; display:flex; gap:8px; flex-wrap:wrap;">
      <span class="pill active" data-filter="all">All</span>
      <span class="pill" data-filter="launch">🚀 Launches</span>
      <span class="pill" data-filter="workshop">🛠️ Workshops</span>
      <span class="pill" data-filter="webinar">💻 Webinars</span>
      <span class="pill" data-filter="news">📰 AI News</span>
    </div>
    <div id="whatson-pane"></div>`;

  el.querySelector('#whatson-filters').addEventListener('click', e => {
    const pill = e.target.closest('.pill');
    if (!pill || pill.dataset.filter === activeFilter) return;

    el.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    activeFilter = pill.dataset.filter;
    updateView();
  });

  updateView();
}
