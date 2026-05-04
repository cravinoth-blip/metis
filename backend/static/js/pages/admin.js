import { api } from '../api.js';

export async function render(el) {
  const user = JSON.parse(localStorage.getItem('metis_user') || '{}');
  
  // 1. Declare the variable here so it's available to your functions
  let activeTab = 'overview'; 
  if (!user.is_admin) {
    el.innerHTML = '<div class="empty-state">⛔ Admin access required.</div>';
    return;
  }
  
  async function drawOverview(pane) {
    const stats = await api.get('/admin/stats');
    pane.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-emoji">👤</div><div class="stat-value">${stats.total_users ?? 0}</div><div class="stat-label">Users</div></div>
        <div class="stat-card"><div class="stat-emoji">📝</div><div class="stat-value">${stats.quizzes_taken_today ?? 0}</div><div class="stat-label">Quizzes today</div></div>
        <div class="stat-card"><div class="stat-emoji">📅</div><div class="stat-value">${stats.total_events ?? 0}</div><div class="stat-label">Events</div></div>
        <div class="stat-card"><div class="stat-emoji">🤖</div><div class="stat-value">${stats.active_today ?? 0}</div><div class="stat-label">Active today</div></div>
      </div>`;
  }

  async function drawUsers(pane) {
    let users = await api.get('/admin/users');
    let q = '';
    function draw() {
      const filtered = users.filter(u =>
        !q || u.email.includes(q) || (u.full_name ?? '').toLowerCase().includes(q)
      );
      pane.innerHTML = `
        <div style="margin-bottom:14px">
          <input id="user-search" class="form-input search-input" placeholder="Search users…" value="${q}">
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <table class="table">
            <thead><tr>
              <th>Name</th><th>Email</th><th>Dept</th><th>XP</th><th>Level</th><th>Admin</th><th>Actions</th>
            </tr></thead>
            <tbody>
              ${filtered.map(u => `
                <tr>
                  <td>${u.full_name ?? u.username}</td>
                  <td>${u.email}</td>
                  <td>${u.department ?? '—'}</td>
                  <td>${u.xp ?? 0}</td>
                  <td>${u.level ?? 0}</td>
                  <td>${u.is_admin ? '✓' : ''}</td>
                  <td>
                    <button class="btn btn-danger btn-sm del-user" data-id="${u.id}">Delete</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      document.getElementById('user-search')?.addEventListener('input', e => { q = e.target.value.toLowerCase(); draw(); });
      pane.querySelectorAll('.del-user').forEach(btn =>
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this user?')) return;
          try {
            await api.delete(`/admin/users/${btn.dataset.id}`);
            users = users.filter(u => u.id != btn.dataset.id);
            draw();
            window._metis.toast('User deleted', 'success');
          } catch(e) { window._metis.toast(e.message, 'error'); }
        })
      );
    }
    draw();
  }

  async function drawEvents(pane) {
    let events = await api.get('/events/');
    function renderForm(ev = null) {
      const overlay = window._metis.openModal(`
        <button class="modal-close" id="eclose">✕</button>
        <h3 style="margin-bottom:16px">${ev ? 'Edit event' : 'New event'}</h3>
        <div class="form-group"><label class="form-label">Title</label><input id="ev-title" class="form-input" value="${ev?.title ?? ''}"></div>
        <div class="form-group"><label class="form-label">Description</label><textarea id="ev-desc" class="form-input" rows="3">${ev?.description ?? ''}</textarea></div>
        <div class="form-group"><label class="form-label">Type</label>
          <select id="ev-type" class="form-input form-select">
            ${['news','lunch_and_learn','workshop','webinar','conference'].map(t =>
              `<option ${ev?.event_type===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Date</label><input id="ev-date" class="form-input" value="${ev?.date ?? ''}"></div>
        <div class="form-group"><label class="form-label">Location</label><input id="ev-loc" class="form-input" value="${ev?.location ?? ''}"></div>
        <div class="form-group"><label class="form-label">URL</label><input id="ev-url" class="form-input" value="${ev?.url ?? ''}"></div>
        <div style="text-align:right;margin-top:8px">
          <button id="ev-save" class="btn btn-primary">Save</button>
        </div>`);
      overlay.querySelector('#eclose').onclick = () => overlay.remove();
      overlay.querySelector('#ev-save').addEventListener('click', async () => {
        const payload = {
          title:       document.getElementById('ev-title').value,
          description: document.getElementById('ev-desc').value,
          event_type:  document.getElementById('ev-type').value,
          date:        document.getElementById('ev-date').value,
          location:    document.getElementById('ev-loc').value,
          url:         document.getElementById('ev-url').value,
        };
        try {
          if (ev) await api.put(`/admin/events/${ev.id}`, payload);
          else    await api.post('/admin/events', payload);
          window._metis.toast('Event saved', 'success');
          overlay.remove();
          events = await api.get('/events/');
          drawEventList();
        } catch(e) { window._metis.toast(e.message, 'error'); }
      });
    }
    function drawEventList() {
      pane.innerHTML = `
        <div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">
          <span class="text-secondary text-sm">${events.length} events</span>
          <div style="display:flex;gap:8px">
            <button id="scrape-btn" class="btn btn-secondary btn-sm">🔄 Refresh from web</button>
            <button id="new-event-btn" class="btn btn-primary btn-sm">+ New event</button>
          </div>
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <table class="table">
            <thead><tr><th>Title</th><th>Type</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              ${events.map(ev => `
                <tr>
                  <td>${ev.title}</td>
                  <td>${ev.event_type ?? '—'}</td>
                  <td>${ev.date ?? '—'}</td>
                  <td style="display:flex;gap:6px">
                    <button class="btn btn-secondary btn-sm edit-ev" data-id="${ev.id}">Edit</button>
                    <button class="btn btn-danger btn-sm del-ev" data-id="${ev.id}">Delete</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      pane.querySelector('#new-event-btn').onclick = () => renderForm();
      pane.querySelector('#scrape-btn').addEventListener('click', async () => {
        try {
          await api.post('/admin/scrape-events', {});
          window._metis.toast('Scraping events…', 'info');
          events = await api.get('/events/');
          drawEventList();
        } catch(e) { window._metis.toast(e.message, 'error'); }
      });
      pane.querySelectorAll('.edit-ev').forEach(b =>
        b.addEventListener('click', () => renderForm(events.find(e => e.id == b.dataset.id)))
      );
      pane.querySelectorAll('.del-ev').forEach(b =>
        b.addEventListener('click', async () => {
          if (!confirm('Delete event?')) return;
          try {
            await api.delete(`/admin/events/${b.dataset.id}`);
            events = events.filter(e => e.id != b.dataset.id);
            drawEventList();
            window._metis.toast('Deleted', 'success');
          } catch(e) { window._metis.toast(e.message, 'error'); }
        })
      );
    }
    drawEventList();
  }

  async function drawLearnings(pane) {
    let learnings = await api.get('/admin/learnings');
    let q = '';
    const TYPES = ['article', 'video', 'course', 'tutorial', 'podcast', 'book', 'other'];

    function renderForm(lr = null) {
      const overlay = window._metis.openModal(`
        <button class="modal-close" id="lclose">✕</button>
        <h3 style="margin-bottom:16px">${lr ? 'Edit learning resource' : 'New learning resource'}</h3>
        <div class="form-group">
          <label class="form-label">Title *</label>
          <input id="lr-title" class="form-input" value="${lr?.title ?? ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="lr-desc" class="form-input" rows="3">${lr?.description ?? ''}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Category</label>
            <input id="lr-category" class="form-input" placeholder="e.g. Prompt Engineering" value="${lr?.category ?? ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Type</label>
            <select id="lr-type" class="form-input form-select">
              <option value="">— select —</option>
              ${TYPES.map(t => `<option ${lr?.type === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Level (1–5)</label>
            <input id="lr-level" class="form-input" type="number" min="1" max="5" value="${lr?.level ?? 1}">
          </div>
          <div class="form-group">
            <label class="form-label">Est. duration (min)</label>
            <input id="lr-duration" class="form-input" type="number" min="1" value="${lr?.estimated_duration_min ?? ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Points</label>
            <input id="lr-points" class="form-input" type="number" min="0" value="${lr?.points ?? 0}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Tags (comma-separated)</label>
          <input id="lr-tags" class="form-input" placeholder="AI, LLM, beginner" value="${lr?.tags ?? ''}">
        </div>
      
        <div style="text-align:right;margin-top:8px">
          <button id="lr-save" class="btn btn-primary">Save</button>
        </div>`);
      overlay.querySelector('#lclose').onclick = () => overlay.remove();
      overlay.querySelector('#lr-save').addEventListener('click', async () => {
        const title = document.getElementById('lr-title').value.trim();
        if (!title) { window._metis.toast('Title is required', 'error'); return; }
        const payload = {
          title,
          description:            document.getElementById('lr-desc').value     || null,
          category:               document.getElementById('lr-category').value || null,
          type:                   document.getElementById('lr-type').value     || null,
          level:              parseInt(document.getElementById('lr-level').value)    || 1,
          estimated_duration_min: parseInt(document.getElementById('lr-duration').value) || null,
          points:             parseInt(document.getElementById('lr-points').value)   || 0,
          tags:                   document.getElementById('lr-tags').value        || null,
        };
        try {
          if (lr) {
            const updated = await api.put(`/admin/learnings/${lr.id}`, payload);
            learnings = learnings.map(l => l.id === lr.id ? updated : l);
          } else {
            const created = await api.post('/admin/learnings', payload);
            learnings = [created, ...learnings];
          }
          overlay.remove();
          window._metis.toast('Saved', 'success');
          draw();
        } catch(e) { window._metis.toast(e.message, 'error'); }
      });
    }
    
    function draw() {
      const filtered = learnings.filter(l =>
        l.is_active !== false &&
        (!q || l.title.toLowerCase().includes(q) || (l.category ?? '').toLowerCase().includes(q))
      );
      pane.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <input id="lr-search" class="form-input search-input" placeholder="Search by title or category…" value="${q}">
          <button id="new-lr-btn" class="btn btn-primary btn-sm">+ New learning</button>
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <table class="table">
            <thead><tr>
              <th>Title</th><th>Category</th><th>Type</th><th>Level</th><th>Modules</th><th>Duration</th><th>Points</th><th>Actions</th>
            </tr></thead>
            <tbody>
              ${filtered.length ? filtered.map(l => `
                <tr>
                  <td>${l.title}</td>
                  <td>${l.category ?? '—'}</td>
                  <td>${l.type ?? '—'}</td>
                  <td>${l.level ?? 1}</td>
                  <td style="text-align:center;font-weight:600">${l.module_count ?? 0}</td>
                  <td>${l.estimated_duration_min ? `${l.estimated_duration_min} min` : '—'}</td>
                  <td>${l.points ?? 0}</td>
                  <td style="white-space:nowrap">
                    <button class="btn btn-secondary btn-sm edit-lr" data-id="${l.id}" style="margin-right:4px">Edit</button>
                    <button class="btn btn-secondary btn-sm modules-lr" data-id="${l.id}" style="margin-right:4px">Modules</button>
                    <button class="btn btn-secondary btn-sm add-module-lr" data-id="${l.id}">+ Add module</button>
                    <button class="btn btn-danger btn-sm del-lr" data-id="${l.id}" style="margin-right:4px">Delete</button>
                    </td>
                </tr>`).join('')
              : '<tr><td colspan="9" style="text-align:center;color:var(--text-secondary);padding:40px">No learning resources yet.</td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="text-sm text-secondary" style="margin-top:10px">${filtered.length} resource${filtered.length !== 1 ? 's' : ''}</div>`;
      
      document.getElementById('lr-search').addEventListener('input', e => {
        q = e.target.value.toLowerCase();
        draw();
      });
      document.getElementById('new-lr-btn').onclick = () => renderForm();
      pane.querySelectorAll('.edit-lr').forEach(btn =>
        btn.addEventListener('click', () => renderForm(learnings.find(l => l.id === btn.dataset.id)))
      );
      pane.querySelectorAll('.del-lr').forEach(btn =>
        btn.addEventListener('click', async () => {
          if (!confirm('Deactivate this resource?')) return;
          try {
            await api.delete(`/admin/learnings/${btn.dataset.id}`);
            learnings = learnings.filter(l => l.id !== btn.dataset.id);
            window._metis.toast('Resource deactivated', 'success');
            draw();
          } catch(e) { window._metis.toast(e.message, 'error'); }
        })
      );
      pane.querySelectorAll('.modules-lr').forEach(btn =>
        btn.addEventListener('click', () => renderModulesModal(btn.dataset.id))
      );
      pane.querySelectorAll('.add-module-lr').forEach(btn =>
        btn.addEventListener('click', () => window._metis.navigate(`/add-module?learning_id=${btn.dataset.id}`))
      );
    }

    // ── UPDATED MODULES MODAL WITH DRAG & DROP ───────────────────────────────
    async function renderModulesModal(learningId) {
      let modules;
      try {
        modules = await api.get(`/admin/learnings/${learningId}/modules`);
      } catch(e) {
        window._metis.toast(e.message || 'Failed to load modules', 'error');
        return;
      }

      function moduleRows() {
        if (!modules.length) return `<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:24px">No modules yet.</td></tr>`;
        return modules.map(m => `
          <tr class="draggable-module" draggable="true" data-id="${m.id}" style="cursor:grab; background:var(--bg-panel, #fff);">
            <td style="color:var(--secondary);user-select:none;width:40px;text-align:center;">☰</td>
            <td style="font-weight:500">${m.title}</td>
            <td>${m.duration_min ? `${m.duration_min} min` : '—'}</td>
            <td>${m.xp_reward ?? 0} pts</td>
            <td style="white-space:nowrap">
              <button class="btn btn-secondary btn-sm edit-mod" data-id="${m.id}" style="margin-right:4px">Edit</button>
              <button class="btn btn-danger btn-sm del-mod" data-id="${m.id}">Delete</button>
            </td>
          </tr>`).join('');
      }

      function renderOverlay() {
        const overlay = window._metis.openModal(`
          <button class="modal-close" id="mmod-close">✕</button>
          <h3 style="margin-bottom:8px">Modules</h3>
          <p class="text-sm text-secondary" style="margin-bottom:16px">Drag and drop rows to reorder them.</p>
          <div class="card" style="padding:0;overflow:visible;margin-bottom:0">
            <table class="table">
              <thead><tr><th style="width:40px"></th><th>Title</th><th>Duration</th><th>XP</th><th>Actions</th></tr></thead>
              <tbody id="mod-tbody">${moduleRows()}</tbody>
            </table>
          </div>
          <div style="margin-top:16px;display:flex;justify-content:flex-end;">
             <button id="save-mod-order" class="btn btn-primary">Save Re-ordering</button>
          </div>
        `);
        
        overlay.querySelector('#mmod-close').onclick = () => overlay.remove();

        // Standard Actions
        overlay.querySelectorAll('.edit-mod').forEach(btn =>
          btn.addEventListener('click', () => {
            overlay.remove();
            window._metis.navigate(`/edit-module?module_id=${btn.dataset.id}`);
          })
        );
        overlay.querySelectorAll('.del-mod').forEach(btn =>
          btn.addEventListener('click', async () => {
            if (!confirm('Delete this module?')) return;
            try {
              await api.delete(`/admin/learning-modules/${btn.dataset.id}`);
              modules = modules.filter(m => m.id !== btn.dataset.id);
              overlay.querySelector('#mod-tbody').innerHTML = moduleRows();
              window._metis.toast('Module deleted', 'success');
              learnings = learnings.map(l => l.id === learningId ? { ...l, module_count: (l.module_count || 1) - 1 } : l);
              draw();
            } catch(e) { window._metis.toast(e.message, 'error'); }
          })
        );

        // --- Drag & Drop Logic for Rows ---
        const container = overlay.querySelector('#mod-tbody');
        let draggedItem = null;

        container.addEventListener('dragstart', e => {
            const target = e.target.closest('.draggable-module');
            if (target) {
                draggedItem = target;
                setTimeout(() => target.style.opacity = '0.4', 0);
            }
        });

        container.addEventListener('dragend', e => {
            const target = e.target.closest('.draggable-module');
            if (target) {
                target.style.opacity = '1';
                draggedItem = null;
            }
        });

        container.addEventListener('dragover', e => {
            e.preventDefault();
            if (!draggedItem) return;
            const afterElement = getDragAfterElement(container, e.clientY);
            if (afterElement == null) {
                container.appendChild(draggedItem);
            } else {
                container.insertBefore(draggedItem, afterElement);
            }
        });

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.draggable-module:not([style*="opacity: 0.4"])')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        // --- Save Order Backend Trigger ---
        const saveOrderBtn = overlay.querySelector('#save-mod-order');
        saveOrderBtn.addEventListener('click', async () => {
            const newOrderIds = [...container.querySelectorAll('.draggable-module')].map(el => el.dataset.id);
            if (!newOrderIds.length) return; // nothing to reorder

            saveOrderBtn.disabled = true;
            saveOrderBtn.textContent = 'Saving...';
            try {
                await api.post(`/courses/learnings/${learningId}/modules/reorder`, { order: newOrderIds });
                window._metis.toast('Module order saved successfully', 'success');
                saveOrderBtn.disabled = false;
                saveOrderBtn.textContent = 'Save Order';
                
                // Keep local state in sync
                modules.sort((a, b) => newOrderIds.indexOf(String(a.id)) - newOrderIds.indexOf(String(b.id)));
            } catch(e) {
                window._metis.toast(e.message || 'Failed to save module order', 'error');
                saveOrderBtn.disabled = false;
                saveOrderBtn.textContent = 'Save Order';
            }
        });

        return overlay;
      }
      renderOverlay();
    }
    
    draw();
  }

   async function drawWorkshops(pane) {
    let workshops = await api.get('/admin/workshops');
    let q = '';
    
    // Suggested formats based on typical workshop needs
    const FORMATS = ['in-person', 'online', 'hybrid', 'other'];
    function renderForm(ws = null) {
      // Helper to format ISO datetime strings for <input type="datetime-local">
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        // adjust to local timezone string expected by datetime-local input
        return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      };
      const overlay = window._metis.openModal(`
        <button class="modal-close" id="wclose">✕</button>
        <h3 style="margin-bottom:16px">${ws ? 'Edit workshop' : 'New workshop'}</h3>
        
        <div class="form-group">
          <label class="form-label">Title *</label>
          <input id="ws-title" class="form-input" value="${ws?.title ?? ''}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="ws-desc" class="form-input" rows="3">${ws?.description ?? ''}</textarea>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Category</label>
            <input id="ws-category" class="form-input" placeholder="e.g. Leadership" value="${ws?.category ?? ''}">
          </div>
          
          <div class="form-group">
            <label class="form-label">Format</label>
            <select id="ws-format" class="form-input form-select">
              <option value="">— select —</option>
              ${FORMATS.map(f => `<option ${ws?.format === f ? 'selected' : ''}>${f}</option>`).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Level (1–5)</label>
            <input id="ws-level" class="form-input" type="number" min="1" max="5" value="${ws?.level ?? 1}">
          </div>
          
          <div class="form-group">
            <label class="form-label">Duration (min)</label>
            <input id="ws-duration" class="form-input" type="number" min="1" value="${ws?.duration_minutes ?? ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Start Date</label>
            <input id="ws-start" class="form-input" type="datetime-local" value="${formatDate(ws?.start_date)}">
          </div>
          <div class="form-group">
            <label class="form-label">End Date</label>
            <input id="ws-end" class="form-input" type="datetime-local" value="${formatDate(ws?.end_date)}">
          </div>
          
          <div class="form-group">
            <label class="form-label">Capacity</label>
            <input id="ws-capacity" class="form-input" type="number" min="1" value="${ws?.capacity ?? ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Points</label>
            <input id="ws-points" class="form-input" type="number" min="0" value="${ws?.points ?? 0}">
          </div>
          <div class="form-group">
            <label class="form-label">Location</label>
            <input id="ws-location" class="form-input" placeholder="Room A / Zoom link" value="${ws?.location ?? ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Organizer</label>
            <input id="ws-organizer" class="form-input" placeholder="e.g. John Doe" value="${ws?.organizer ?? ''}">
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Tags (comma-separated)</label>
          <input id="ws-tags" class="form-input" placeholder="AI, leadership, beginner" value="${ws?.tags ?? ''}">
        </div>
        
        <div class="form-group" style="display:flex;align-items:center;gap:10px;margin-top:8px;">
          <input id="ws-active" type="checkbox" ${(ws === null || ws.is_active) ? 'checked' : ''} style="width:auto">
          <label for="ws-active" class="form-label" style="margin:0">Active</label>
        </div>
        
        <div style="text-align:right;margin-top:16px">
          <button id="ws-save" class="btn btn-primary">Save</button>
        </div>`);
      overlay.querySelector('#wclose').onclick = () => overlay.remove();
      
      overlay.querySelector('#ws-save').addEventListener('click', async () => {
        const title = document.getElementById('ws-title').value.trim();
        if (!title) { 
          window._metis.toast('Title is required', 'error'); 
          return; 
        }
        const startVal = document.getElementById('ws-start').value;
        const endVal = document.getElementById('ws-end').value;
        const payload = {
          title,
          description:      document.getElementById('ws-desc').value      || null,
          category:         document.getElementById('ws-category').value  || null,
          format:           document.getElementById('ws-format').value    || null,
          location:         document.getElementById('ws-location').value  || null,
          organizer:        document.getElementById('ws-organizer').value || null,
          tags:             document.getElementById('ws-tags').value      || null,
          level:            parseInt(document.getElementById('ws-level').value)    || 1,
          duration_minutes: parseInt(document.getElementById('ws-duration').value) || null,
          capacity:         parseInt(document.getElementById('ws-capacity').value) || null,
          points:           parseInt(document.getElementById('ws-points').value)   || 0,
          start_date:       startVal ? new Date(startVal).toISOString() : null,
          end_date:         endVal ? new Date(endVal).toISOString() : null,
          is_active:        document.getElementById('ws-active').checked,
        };
        try {
          if (ws) {
            const updated = await api.put(`/admin/workshops/${ws.id}`, payload);
            workshops = workshops.map(w => w.id === ws.id ? updated : w);
          } else {
            const created = await api.post('/admin/workshops', payload);
            workshops = [created, ...workshops];
          }
          overlay.remove();
          window._metis.toast('Saved', 'success');
          draw(); 
        } catch(e) { 
          window._metis.toast(e.message, 'error'); 
        }
      });
    }
    function draw() {
      const filtered = workshops.filter(w =>
        w.is_active !== false &&
        (!q || w.title.toLowerCase().includes(q) || (w.category ?? '').toLowerCase().includes(q))
      );
      pane.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <input id="ws-search" class="form-input search-input" placeholder="Search by title or category…" value="${q}">
          <button id="new-ws-btn" class="btn btn-primary btn-sm">+ New workshop</button>
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <table class="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Format</th>
                <th>Dates</th>
                <th>Duration</th>
                <th>Capacity</th>
                <th>Points</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length ? filtered.map(w => {
                // Formatting dates nicely for the table view
                const startStr = w.start_date ? new Date(w.start_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—';
                return `
                <tr>
                  <td>
                    <div style="font-weight:500">${w.title}</div>
                    ${w.location ? `<div class="text-sm" style="color:var(--text-secondary)">📍 ${w.location}</div>` : ''}
                  </td>
                  <td>${w.category ?? '—'}</td>
                  <td style="text-transform: capitalize;">${w.format ?? '—'}</td>
                  <td style="white-space:nowrap; font-size: 0.9em;">${startStr}</td>
                  <td>${w.duration_minutes ? `${w.duration_minutes} min` : '—'}</td>
                  <td>${w.capacity ? `${w.capacity} pax` : '—'}</td>
                  <td>${w.points ?? 0}</td>
                  <td style="white-space:nowrap">
                    <button class="btn btn-secondary btn-sm edit-ws" data-id="${w.id}" style="margin-right:4px">Edit</button>
                    <button class="btn btn-danger btn-sm del-ws" data-id="${w.id}">Delete</button>
                  </td>
                </tr>`}).join('')
              : '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);padding:40px">No workshops found.</td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="text-sm text-secondary" style="margin-top:10px">${filtered.length} workshop${filtered.length !== 1 ? 's' : ''}</div>`;
      // Search Handler
      document.getElementById('ws-search').addEventListener('input', e => {
        q = e.target.value.toLowerCase();
        draw();
      });
      // New Button Handler
      document.getElementById('new-ws-btn').onclick = () => renderForm();
      // Edit Buttons Handler
      pane.querySelectorAll('.edit-ws').forEach(btn =>
        btn.addEventListener('click', () => {
          const ws = workshops.find(w => w.id === btn.dataset.id);
          if (ws) renderForm(ws);
        })
      );
      // Delete/Deactivate Buttons Handler
      pane.querySelectorAll('.del-ws').forEach(btn =>
        btn.addEventListener('click', async () => {
          if (!confirm('Deactivate this workshop?')) return;
          try {
            await api.delete(`/admin/workshops/${btn.dataset.id}`);
            // Remove from local array to immediately reflect in UI
            workshops = workshops.filter(w => w.id !== btn.dataset.id);
            window._metis.toast('Workshop deactivated', 'success');
            draw();
          } catch(e) { 
            window._metis.toast(e.message, 'error'); 
          }
        })
      );
    }
    // Initial render
    draw();
  }

  el.innerHTML = `
    <div class="tabs" id="admin-tabs">
      <button class="tab-btn active" data-tab="overview">Overview</button>
      <button class="tab-btn" data-tab="users">Users</button>
      <button class="tab-btn" data-tab="events">Events</button>
      <button class="tab-btn" data-tab="learnings">Learnings</button>
      <button class="tab-btn" data-tab="workshops">Workshops</button>
    </div>
    <div id="admin-pane"></div>`;
    
  async function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('#admin-tabs .tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tab)
    );
    const pane = document.getElementById('admin-pane');
    pane.innerHTML = '<div class="loading">Loading…</div>';
    if (tab === 'overview')  await drawOverview(pane);
    if (tab === 'users')     await drawUsers(pane);
    if (tab === 'events')    await drawEvents(pane);
    if (tab === 'learnings') await drawLearnings(pane);
    if (tab === 'workshops') await drawWorkshops(pane);
  }
  
  document.getElementById('admin-tabs').addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (btn) switchTab(btn.dataset.tab);
  });
  await switchTab('overview');
}
