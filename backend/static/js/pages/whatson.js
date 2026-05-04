import { api } from '../api.js';

const TYPE_COLORS = {
  news:             { bg: '#e0f2fe', color: '#0369a1', label: '📰 News' },
  lunch_and_learn:  { bg: '#fef3c7', color: '#d97706', label: '🍽️ Lunch & Learn' },
  workshop:         { bg: '#dcfce7', color: '#16a34a', label: '🛠️ Workshop' },
  webinar:          { bg: '#ede9fe', color: '#7c3aed', label: '💻 Webinar' },
  conference:       { bg: '#fee2e2', color: '#dc2626', label: '🎤 Conference' },
};

function badge(type) {
  const c = TYPE_COLORS[type] || { bg: '#f1f5f9', color: '#64748b', label: type };
  return `<span class="type-badge" style="background:${c.bg};color:${c.color}">${c.label}</span>`;
}

export async function render(el) {
  let events = await api.get('/events/');
  let activeFilter = 'all';

  function draw() {
    const filtered = activeFilter === 'all' ? events : events.filter(e => e.event_type === activeFilter);
    const user = JSON.parse(localStorage.getItem('metis_user') || '{}');

    document.getElementById('events-list').innerHTML = filtered.length
      ? filtered.map(ev => `
          <div class="event-card">
            ${badge(ev.event_type)}
            <div style="font-weight:600;margin-bottom:4px">${ev.title}</div>
            <div class="text-sm text-secondary" style="margin-bottom:8px">${ev.description ?? ''}</div>
            <div class="flex gap-3 text-sm text-secondary" style="flex-wrap:wrap">
              ${ev.date ? `<span>📅 ${ev.date}</span>` : ''}
              ${ev.location ? `<span>📍 ${ev.location}</span>` : ''}
              ${ev.organization ? `<span>🏢 ${ev.organization}</span>` : ''}
            </div>
            ${ev.url ? `<a href="${ev.url}" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:12px;text-decoration:none">View event →</a>` : ''}
          </div>`).join('')
      : '<div class="empty-state">No events found.</div>';
  }

  const types = [...new Set(events.map(e => e.event_type))];
  el.innerHTML = `
    <div class="filter-pills" id="filters">
      <span class="pill active" data-type="all">All</span>
      ${types.map(t => `<span class="pill" data-type="${t}">${(TYPE_COLORS[t] || {}).label || t}</span>`).join('')}
    </div>
    <div id="events-list"></div>
  `;

  document.getElementById('filters').addEventListener('click', e => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    document.querySelectorAll('#filters .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeFilter = pill.dataset.type;
    draw();
  });

  draw();
}
