import { api } from '../api.js';

const LOG_XP = 10;

// Helper function to group tools by category
function groupByCategory(toolsArray) {
  return toolsArray.reduce((acc, tool) => {
    const category = tool.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tool);
    return acc;
  }, {});
}

// Helper function to render a list of tools grouped by category
function renderCategoryGroups(groupedTools, isFreeSection, usedSet) {
  return Object.entries(groupedTools).map(([category, tools]) => `
    <div class="tool-category-group" style="margin-bottom: 32px;">
      <h3 style="text-transform: uppercase; letter-spacing: 1px; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
        ${category}
      </h3>
      <div class="tools-grid">
        ${tools.map(t => {
          const tags = (t.tags ?? '').split(',').map(s => s.trim()).filter(Boolean);
          return `
            <div class="tool-card">
              <div class="tool-icon">${t.emoji_logo ?? '🔧'}</div>
              <div style="font-weight:600">${t.name}</div>
              <div class="text-sm text-secondary">${t.provider ?? ''}</div>
              <div class="text-sm" style="color:var(--text-primary); margin-top: 4px; flex-grow: 1;">${t.description ?? ''}</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
                ${tags.map(tag => `<span class="diff-badge diff-beginner" style="background:#e0e7ff;color:var(--accent)">${tag}</span>`).join('')}
              </div>
              <div style="margin-top:auto;padding-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                ${t.url ? `<a href="${t.url}" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration:none">Open →</a>` : ''}
                ${isFreeSection ? `
                  <button class="btn btn-sm ${usedSet.has(t.name) ? 'btn-success' : 'btn-primary'} log-btn"
                          data-name="${t.name}" ${usedSet.has(t.name) ? 'disabled' : ''}>
                    ${usedSet.has(t.name) ? `✓ +${LOG_XP} XP` : `Log use (+${LOG_XP} XP)`}
                  </button>
                ` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>
  `).join('');
}

export async function render(el) {
  el.innerHTML = '<div class="loading">Loading tools…</div>';

  let tools;
  try {
    tools = await api.get('/ai-tools/');
  } catch (e) {
    el.innerHTML = `<div class="empty-state">Failed to load tools: ${e.message}</div>`;
    return;
  }

  // Split tools into Enterprise and Free
  const enterprise = tools.filter(t => t.is_enterprise);
  const free       = tools.filter(t => !t.is_enterprise);
  const used       = new Set(JSON.parse(localStorage.getItem('metis_used_tools') || '[]'));

  // Group each array by category
  const enterpriseGrouped = groupByCategory(enterprise);
  const freeGrouped       = groupByCategory(free);

  el.innerHTML = `
    <div class="ai-tools-page">
      <!-- Enterprise AI Tools -->
      <section style="margin-bottom:60px">
        <h2 style="margin-bottom:8px;font-weight:bold;font-size:1.5rem">Enterprise AI Tools</h2>
        <p class="text-secondary text-sm mb-6">Approved and licensed tools available to all employees. Contact IT for access requests.</p>
        
        <div id="enterprise-tools-container">
          ${renderCategoryGroups(enterpriseGrouped, false, used)}
        </div>
      </section>

      <!-- Free AI Tools -->
      <section>
        <h2 style="margin-bottom:8px;font-weight:bold;font-size:1.5rem">Free AI Tools</h2>
        <div style="background:#fee2e2;border:1px solid #f87171;color:#991b1b;padding:12px 16px;border-radius:8px;margin-bottom:20px;display:flex;align-items:center;gap:12px">
          <span style="font-size:1.2rem">⚠️</span>
          <span style="font-weight:500">Personal or client data should not be used with the free AI tools.</span>
        </div>
        
        <div id="free-tools-container">
          ${renderCategoryGroups(freeGrouped, true, used)}
        </div>
      </section>
    </div>`;

  // Attach a single event listener to the main element to handle all "Log use" clicks
  el.addEventListener('click', async e => {
    const btn = e.target.closest('.log-btn');
    if (!btn || btn.disabled) return;

    const name = btn.dataset.name;
    try {
      await api.post('/users/me/tool-usage', { tool_name: name });
      used.add(name);
      localStorage.setItem('metis_used_tools', JSON.stringify([...used]));

      // Visually update the button immediately without a full re-render
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-success');
      btn.disabled = true;
      btn.innerHTML = `✓ +${LOG_XP} XP`;
      
      const me = await api.get('/auth/me');
      localStorage.setItem('metis_user', JSON.stringify(me));
      
      window._metis.refreshShell();
      window._metis.toast(`+${LOG_XP} XP for using ${name}!`, 'success');
    } catch (err) {
      window._metis.toast(err.message, 'error');
    }
  });
}
