import { api } from './api.js';

// ── Toast ──────────────────────────────────────────────────────────────────
export function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Modal helper ───────────────────────────────────────────────────────────
export function openModal(html) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return overlay;
}

// ── Routes ─────────────────────────────────────────────────────────────────
const ROUTES = {
  '/dashboard':       () => import('./pages/dashboard.js'),
  '/skillgames':      () => import('./pages/skillgames.js'),
  '/learning':        () => import('./pages/learning.js'),
  '/whatson':         () => import('./pages/whatson.js'),
  '/add-module':      () => import('./pages/add_module.js'),
  '/edit-module':     () => import('./pages/edit_module.js'),
};

const TITLES = {
  '/dashboard':       'Dashboard',
  '/skillgames':      'Skill Games',
  '/learning':        'Learning',
  '/whatson':         "What's On",
  '/add-module':      'Module Builder',
  '/edit-module':     'Edit Module',
};

// ── Navigation ─────────────────────────────────────────────────────────────
async function navigate(path) {
  if (!localStorage.getItem('metis_token')) { location.href = '/login'; return; }

  if (path === '/') path = '/dashboard';

  // Strip query string for route/title lookup, keep full path for history
  const routeKey = path.split('?')[0];

  document.querySelectorAll('.nav-link').forEach(a =>
    a.classList.toggle('active', a.dataset.route === routeKey)
  );

  document.getElementById('page-title').textContent = TITLES[routeKey] || '';

  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading">Loading…</div>';

  const loader = ROUTES[routeKey];
  if (!loader) { navigate('/dashboard'); return; }

  history.pushState({}, '', path);

  try {
    const mod = await loader();
    await mod.render(content);
  } catch (e) {
    content.innerHTML = `<div class="empty-state">⚠️ ${e.message}</div>`;
  }
}

// ── Shell init ─────────────────────────────────────────────────────────────
function refreshShell() {
  const user = JSON.parse(localStorage.getItem('metis_user') || '{}');

  document.getElementById('sidebar-avatar').textContent  = user.avatar_initials || '??';
  document.getElementById('topbar-avatar').textContent   = user.avatar_initials || '??';
  document.getElementById('sidebar-name').textContent    = user.full_name || user.username || '—';
  document.getElementById('sidebar-xp').textContent      = `${user.xp ?? 0} XP · Lv ${user.level ?? 0}`;
  document.getElementById('topbar-xp').textContent       = `⚡ ${user.xp ?? 0} XP`;

  if (user.is_admin) document.getElementById('admin-link').classList.remove('hidden');
}

// ── Bootstrap ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('metis_token')) { location.href = '/login'; return; }

  // Fetch fresh user data once on load
  try {
    const me = await api.get('/auth/me');
    localStorage.setItem('metis_user', JSON.stringify(me));
  } catch (_) { /* token invalid → api.js redirects */ }

  refreshShell();

  // Sidebar nav clicks — admin link does a full page navigation, others go through the SPA router
  document.querySelectorAll('.nav-link').forEach(a =>
    a.addEventListener('click', e => {
      if (a.id === 'admin-link') return;
      if (a.id === 'aitools-link') return;

      e.preventDefault();
      navigate(a.dataset.route);
    })
  );

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('metis_token');
    localStorage.removeItem('metis_user');
    location.href = '/login';
  });

  window.addEventListener('popstate', () => navigate(location.pathname));

  navigate(location.pathname);
});

// Expose helpers for page modules
window._metis = { toast, openModal, refreshShell, navigate };
