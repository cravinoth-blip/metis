import { api } from '../api.js';

const LOG_XP = 10;

export async function render(el) {
  el.innerHTML = '<div class="loading">Loading tools…</div>';

  let tools;
  try {
    tools = await api.get('/ai-tools/');
  } catch (e) {
    el.innerHTML = `<div class="empty-state">Failed to load tools: ${e.message}</div>`;
    return;
  }

  const enterprise = tools.filter(t => t.is_enterprise);
  const free       = tools.filter(t => !t.is_enterprise);
  const used = new Set(JSON.parse(localStorage.getItem('metis_used_tools') || '[]'));

  el.innerHTML = `
    <div class="ai-tools-page">

      <!-- Enterprise AI Tools -->
      <section style="margin-bottom:60px">
        <h2 style="margin-bottom:8px;font-weight:bold;font-size:1.5rem">Enterprise AI Tools</h2>
        <p class="text-secondary text-sm mb-6">Approved and licensed tools available to all employees. Contact IT for access requests.</p>
        <div class="tools-grid" id="enterprise-tools-grid">
          ${enterprise.map(t => {
            const tags = (t.tags ?? '').split(',').map(s => s.trim()).filter(Boolean);
            return `
            <div class="tool-card">
              <div class="tool-icon">${t.emoji_logo ?? '🔧'}</div>
              <div style="font-weight:600">${t.name}</div>
              <div class="text-sm text-secondary">${t.provider ?? ''}</div>
              <div class="text-sm" style="color:var(--text-primary)">${t.description ?? ''}</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
                ${tags.map(tag => `<span class="diff-badge diff-beginner" style="background:#e0e7ff;color:var(--accent)">${tag}</span>`).join('')}
              </div>
              ${t.url ? `<a href="${t.url}" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:8px;text-decoration:none;display:inline-block">Open →</a>` : ''}
            </div>`;
          }).join('')}
        </div>
      </section>

      <!-- Free AI Tools -->
      <section>
        <h2 style="margin-bottom:8px;font-weight:bold;font-size:1.5rem">Free AI Tools</h2>
        <div style="background:#fee2e2;border:1px solid #f87171;color:#991b1b;padding:12px 16px;border-radius:8px;margin-bottom:20px;display:flex;align-items:center;gap:12px">
          <span style="font-size:1.2rem">⚠️</span>
          <span style="font-weight:500">Personal or client data should not be used with the free AI tools.</span>
        </div>
        <div class="tools-grid" id="free-tools-grid"></div>
      </section>

    </div>`;

  function drawFreeTools() {
    document.getElementById('free-tools-grid').innerHTML = free.map(t => `
      <div class="tool-card">
        <div class="tool-icon">${t.emoji_logo ?? '🔧'}</div>
        <div style="font-weight:600">${t.name}</div>
        <div class="text-sm" style="color:var(--text-primary);margin-bottom:8px">${t.description ?? ''}</div>
        <div style="margin-top:auto;display:flex;gap:8px;flex-wrap:wrap">
          ${t.url ? `<a href="${t.url}" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration:none">Open →</a>` : ''}
          <button class="btn btn-sm ${used.has(t.name) ? 'btn-success' : 'btn-primary'} log-btn"
                  data-name="${t.name}" ${used.has(t.name) ? 'disabled' : ''}>
            ${used.has(t.name) ? `✓ +${LOG_XP} XP` : `Log use (+${LOG_XP} XP)`}
          </button>
        </div>
      </div>`).join('');
  }

  drawFreeTools();

  document.getElementById('free-tools-grid').addEventListener('click', async e => {
    const btn = e.target.closest('.log-btn');
    if (!btn || btn.disabled) return;
    const name = btn.dataset.name;
    try {
      await api.post('/users/me/tool-usage', { tool_name: name });
      used.add(name);
      localStorage.setItem('metis_used_tools', JSON.stringify([...used]));
      const me = await api.get('/auth/me');
      localStorage.setItem('metis_user', JSON.stringify(me));
      window._metis.refreshShell();
      window._metis.toast(`+${LOG_XP} XP for using ${name}!`, 'success');
      drawFreeTools();
    } catch (err) {
      window._metis.toast(err.message, 'error');
    }
  });
}
