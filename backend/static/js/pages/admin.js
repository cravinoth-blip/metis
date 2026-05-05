import { api } from '../api.js';

export async function render(el) {
  const user = JSON.parse(localStorage.getItem('metis_user') || '{}');
  
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

        const saveOrderBtn = overlay.querySelector('#save-mod-order');
        saveOrderBtn.addEventListener('click', async () => {
            const newOrderIds = [...container.querySelectorAll('.draggable-module')].map(el => el.dataset.id);
            if (!newOrderIds.length) return;
            saveOrderBtn.disabled = true;
            saveOrderBtn.textContent = 'Saving...';
            try {
                await api.post(`/courses/learnings/${learningId}/modules/reorder`, { order: newOrderIds });
                window._metis.toast('Module order saved successfully', 'success');
                saveOrderBtn.disabled = false;
                saveOrderBtn.textContent = 'Save Order';
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
    let workshops = await api.get('/admin/events?event_type=workshop');
    let q = '';
    
    const FORMATS = ['in-person', 'online', 'hybrid', 'other'];

    function renderForm(ws = null) {
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
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
            <label class="form-label">XP Reward</label>
            <input id="ws-points" class="form-input" type="number" min="0" value="${ws?.xp_reward ?? 0}">
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
          <label class="form-label">URL (Registration/Info)</label>
          <input id="ws-url" class="form-input" placeholder="https://..." value="${ws?.url ?? ''}">
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
        if (!title) { window._metis.toast('Title is required', 'error'); return; }

        const startVal = document.getElementById('ws-start').value;
        const endVal = document.getElementById('ws-end').value;

        const payload = {
          event_type:       'workshop',
          title,
          description:      document.getElementById('ws-desc').value      || null,
          category:         document.getElementById('ws-category').value  || null,
          format:           document.getElementById('ws-format').value    || null,
          location:         document.getElementById('ws-location').value  || null,
          organizer:        document.getElementById('ws-organizer').value || null,
          url:              document.getElementById('ws-url').value       || null,
          tags:             document.getElementById('ws-tags').value      || null,
          level:            parseInt(document.getElementById('ws-level').value)    || 1,
          duration_minutes: parseInt(document.getElementById('ws-duration').value) || null,
          capacity:         parseInt(document.getElementById('ws-capacity').value) || null,
          xp_reward:        parseInt(document.getElementById('ws-points').value)   || 0,
          is_active:        document.getElementById('ws-active').checked,
          start_date:       startVal ? new Date(startVal).toISOString() : null,
          end_date:         endVal ? new Date(endVal).toISOString() : null,
        };

        try {
          if (ws) {
            const updated = await api.put(`/admin/events/${ws.id}`, payload);
            workshops = workshops.map(w => w.id === ws.id ? updated : w);
          } else {
            const created = await api.post('/admin/events', payload);
            workshops = [created, ...workshops];
          }
          overlay.remove();
          window._metis.toast('Saved', 'success');
          draw(); 
        } catch(e) { window._metis.toast(e.message, 'error'); }
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
                  <td>${w.xp_reward ?? 0}</td>
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

      document.getElementById('ws-search').addEventListener('input', e => {
        q = e.target.value.toLowerCase();
        draw();
      });

      document.getElementById('new-ws-btn').onclick = () => renderForm();

      pane.querySelectorAll('.edit-ws').forEach(btn =>
        btn.addEventListener('click', () => {
          const ws = workshops.find(w => w.id === btn.dataset.id);
          if (ws) renderForm(ws);
        })
      );

      pane.querySelectorAll('.del-ws').forEach(btn =>
        btn.addEventListener('click', async () => {
          if (!confirm('Deactivate this workshop?')) return;
          try {
            await api.delete(`/admin/events/${btn.dataset.id}`);
            workshops = workshops.filter(w => w.id !== btn.dataset.id);
            window._metis.toast('Workshop deactivated', 'success');
            draw();
          } catch(e) { window._metis.toast(e.message, 'error'); }
        })
      );
    }

    draw();
  }


  async function drawLaunches(pane) {
    let lunches = await api.get('/admin/events?event_type=launch');
    let q = '';
    function renderForm(ln = null) {
      const overlay = window._metis.openModal(`
        <button class="modal-close" id="lnclose">✕</button>
        <h3 style="margin-bottom:16px">${ln ? 'Edit Launch' : 'New Launch'}</h3>
        <div class="form-group"><label class="form-label">Title *</label><input id="ln-title" class="form-input" value="${ln?.title ?? ''}"></div>
        <div class="form-group"><label class="form-label">Description</label><textarea id="ln-desc" class="form-input" rows="3">${ln?.description ?? ''}</textarea></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group"><label class="form-label">Category</label><input id="ln-category" class="form-input" value="${ln?.category ?? ''}"></div>
          <div class="form-group"><label class="form-label">Speaker</label><input id="ln-speaker" class="form-input" value="${ln?.speaker ?? ''}"></div>
          <div class="form-group"><label class="form-label">Date</label><input id="ln-date" class="form-input" value="${ln?.event_date ?? ''}"></div>
          <div class="form-group"><label class="form-label">Time</label><input id="ln-time" class="form-input" value="${ln?.event_time ?? ''}"></div>
          <div class="form-group"><label class="form-label">Duration (min)</label><input id="ln-duration" class="form-input" type="number" value="${ln?.duration_minutes ?? ''}"></div>
          <div class="form-group"><label class="form-label">Capacity</label><input id="ln-capacity" class="form-input" type="number" value="${ln?.capacity ?? ''}"></div>
          <div class="form-group"><label class="form-label">XP Reward</label><input id="ln-xp" class="form-input" type="number" value="${ln?.xp_reward ?? 0}"></div>
        </div>
        <div class="form-group"><label class="form-label">Location</label><input id="ln-location" class="form-input" value="${ln?.location ?? ''}"></div>
        <div class="form-group"><label class="form-label">Menu</label><input id="ln-menu" class="form-input" value="${ln?.menu ?? ''}"></div>
        <div class="form-group"><label class="form-label">Tags</label><input id="ln-tags" class="form-input" value="${ln?.tags ?? ''}"></div>
        <div style="text-align:right;margin-top:16px"><button id="ln-save" class="btn btn-primary">Save</button></div>`);
      overlay.querySelector('#lnclose').onclick = () => overlay.remove();
      overlay.querySelector('#ln-save').addEventListener('click', async () => {
        const title = document.getElementById('ln-title').value.trim();
        if (!title) { window._metis.toast('Title is required', 'error'); return; }
        const payload = {
          event_type: 'launch',
          title,
          description: document.getElementById('ln-desc').value || null,
          category: document.getElementById('ln-category').value || null,
          speaker: document.getElementById('ln-speaker').value || null,
          event_date: document.getElementById('ln-date').value || null,
          event_time: document.getElementById('ln-time').value || null,
          location: document.getElementById('ln-location').value || null,
          menu: document.getElementById('ln-menu').value || null,
          tags: document.getElementById('ln-tags').value || null,
          duration_minutes: parseInt(document.getElementById('ln-duration').value) || null,
          capacity: parseInt(document.getElementById('ln-capacity').value) || null,
          xp_reward: parseInt(document.getElementById('ln-xp').value) || 0,
        };
        try {
          if (ln) {
            const updated = await api.put(`/admin/events/${ln.id}`, payload);
            lunches = lunches.map(l => l.id === ln.id ? updated : l);
          } else {
            const created = await api.post('/admin/events', payload);
            lunches = [created, ...lunches];
          }
          overlay.remove();
          window._metis.toast('Saved', 'success');
          draw();
        } catch(e) { window._metis.toast(e.message, 'error'); }
      });
    }
    function draw() {
      const filtered = lunches.filter(l =>
        l.is_active !== false &&
        (!q || l.title.toLowerCase().includes(q) || (l.category ?? '').toLowerCase().includes(q))
      );
      pane.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <input id="ln-search" class="form-input search-input" placeholder="Search by title or category…" value="${q}">
          <button id="new-ln-btn" class="btn btn-primary btn-sm">+ New Launch</button>
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <table class="table">
            <thead><tr><th>Title</th><th>Category</th><th>Speaker</th><th>Date</th><th>Time</th><th>Location</th><th>XP</th><th>Actions</th></tr></thead>
            <tbody>
              ${filtered.length ? filtered.map(l => `
                <tr>
                  <td style="font-weight:500">${l.title}</td>
                  <td>${l.category ?? '—'}</td>
                  <td>${l.speaker ?? '—'}</td>
                  <td style="white-space:nowrap">${l.event_date ?? '—'}</td>
                  <td style="white-space:nowrap">${l.event_time ?? '—'}</td>
                  <td>${l.location ?? '—'}</td>
                  <td>${l.xp_reward ?? 0}</td>
                  <td style="white-space:nowrap">
                    <button class="btn btn-secondary btn-sm edit-ln" data-id="${l.id}" style="margin-right:4px">Edit</button>
                    <button class="btn btn-danger btn-sm del-ln" data-id="${l.id}">Delete</button>
                  </td>
                </tr>`).join('')
              : '<tr><td colspan="8" style="text-align:center;padding:40px">No sessions found.</td></tr>'}
            </tbody>
          </table>
        </div>`;
      document.getElementById('ln-search').addEventListener('input', e => { q = e.target.value.toLowerCase(); draw(); });
      document.getElementById('new-ln-btn').onclick = () => renderForm();
      pane.querySelectorAll('.edit-ln').forEach(btn => btn.addEventListener('click', () => renderForm(lunches.find(l => l.id === btn.dataset.id))));
      pane.querySelectorAll('.del-ln').forEach(btn => btn.addEventListener('click', async () => {
          if (!confirm('Deactivate this session?')) return;
          try {
            await api.delete(`/admin/events/${btn.dataset.id}`);
            lunches = lunches.filter(l => l.id !== btn.dataset.id);
            window._metis.toast('Session deactivated', 'success');
            draw();
          } catch(e) { window._metis.toast(e.message, 'error'); }
        })
      );
    }
    draw();
  }

  async function drawWebinars(pane) {
    let webinars = await api.get('/admin/events?event_type=webinar');
    let q = '';
    const PLATFORMS = ['Zoom', 'Teams', 'YouTube Live', 'other'];
    function renderForm(wb = null) {
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      };
      const overlay = window._metis.openModal(`
        <button class="modal-close" id="wbclose">✕</button>
        <h3 style="margin-bottom:16px">${wb ? 'Edit webinar' : 'New webinar'}</h3>
        <div class="form-group"><label class="form-label">Title *</label><input id="wb-title" class="form-input" value="${wb?.title ?? ''}"></div>
        <div class="form-group"><label class="form-label">Description</label><textarea id="wb-desc" class="form-input" rows="3">${wb?.description ?? ''}</textarea></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group"><label class="form-label">Category</label><input id="wb-category" class="form-input" value="${wb?.category ?? ''}"></div>
          <div class="form-group"><label class="form-label">Platform</label><select id="wb-platform" class="form-input form-select"><option value="">— select —</option>${PLATFORMS.map(p => `<option ${wb?.platform === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
          <div class="form-group"><label class="form-label">Speaker</label><input id="wb-speaker" class="form-input" value="${wb?.speaker ?? ''}"></div>
          <div class="form-group"><label class="form-label">Duration (min)</label><input id="wb-duration" class="form-input" type="number" value="${wb?.duration_minutes ?? ''}"></div>
          <div class="form-group"><label class="form-label">Start Date & Time</label><input id="wb-start" class="form-input" type="datetime-local" value="${formatDate(wb?.start_date)}"></div>
          <div class="form-group"><label class="form-label">Capacity</label><input id="wb-capacity" class="form-input" type="number" value="${wb?.capacity ?? ''}"></div>
          <div class="form-group"><label class="form-label">XP Reward</label><input id="wb-xp" class="form-input" type="number" value="${wb?.xp_reward ?? 0}"></div>
        </div>
        <div class="form-group"><label class="form-label">Tags</label><input id="wb-tags" class="form-input" value="${wb?.tags ?? ''}"></div>
        <div class="form-group"><label class="form-label">Registration URL</label><input id="wb-url" class="form-input" value="${wb?.registration_url ?? ''}"></div>
        <div style="text-align:right;margin-top:16px"><button id="wb-save" class="btn btn-primary">Save</button></div>`);
      overlay.querySelector('#wbclose').onclick = () => overlay.remove();
      overlay.querySelector('#wb-save').addEventListener('click', async () => {
        const title = document.getElementById('wb-title').value.trim();
        if (!title) { window._metis.toast('Title is required', 'error'); return; }
        const startVal = document.getElementById('wb-start').value;
        const payload = {
          event_type: 'webinar',
          title,
          description: document.getElementById('wb-desc').value || null,
          category: document.getElementById('wb-category').value || null,
          platform: document.getElementById('wb-platform').value || null,
          speaker: document.getElementById('wb-speaker').value || null,
          tags: document.getElementById('wb-tags').value || null,
          registration_url: document.getElementById('wb-url').value || null,
          duration_minutes: parseInt(document.getElementById('wb-duration').value) || null,
          capacity: parseInt(document.getElementById('wb-capacity').value) || null,
          xp_reward: parseInt(document.getElementById('wb-xp').value) || 0,
          start_date: startVal ? new Date(startVal).toISOString() : null,
        };
        try {
          if (wb) {
            const updated = await api.put(`/admin/events/${wb.id}`, payload);
            webinars = webinars.map(w => w.id === wb.id ? updated : w);
          } else {
            const created = await api.post('/admin/events', payload);
            webinars = [created, ...webinars];
          }
          overlay.remove();
          window._metis.toast('Saved', 'success');
          draw();
        } catch(e) { window._metis.toast(e.message, 'error'); }
      });
    }
    function draw() {
      const filtered = webinars.filter(w =>
        w.is_active !== false &&
        (!q || w.title.toLowerCase().includes(q) || (w.category ?? '').toLowerCase().includes(q))
      );
      pane.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <input id="wb-search" class="form-input search-input" placeholder="Search by title or category…" value="${q}">
          <button id="new-wb-btn" class="btn btn-primary btn-sm">+ New webinar</button>
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <table class="table">
            <thead><tr><th>Title</th><th>Category</th><th>Speaker</th><th>Platform</th><th>Date</th><th>Duration</th><th>XP</th><th>Actions</th></tr></thead>
            <tbody>
              ${filtered.length ? filtered.map(w => `
                <tr>
                  <td style="font-weight:500">${w.title}</td>
                  <td>${w.category ?? '—'}</td>
                  <td>${w.speaker ?? '—'}</td>
                  <td>${w.platform ?? '—'}</td>
                  <td style="white-space:nowrap">${w.start_date ? new Date(w.start_date).toLocaleDateString() : '—'}</td>
                  <td>${w.duration_minutes ? `${w.duration_minutes} min` : '—'}</td>
                  <td>${w.xp_reward ?? 0}</td>
                  <td style="white-space:nowrap">
                    <button class="btn btn-secondary btn-sm edit-wb" data-id="${w.id}" style="margin-right:4px">Edit</button>
                    <button class="btn btn-danger btn-sm del-wb" data-id="${w.id}">Delete</button>
                  </td>
                </tr>`).join('')
              : '<tr><td colspan="8" style="text-align:center;padding:40px">No webinars found.</td></tr>'}
            </tbody>
          </table>
        </div>`;
      document.getElementById('wb-search').addEventListener('input', e => { q = e.target.value.toLowerCase(); draw(); });
      document.getElementById('new-wb-btn').onclick = () => renderForm();
      pane.querySelectorAll('.edit-wb').forEach(btn => btn.addEventListener('click', () => renderForm(webinars.find(w => w.id === btn.dataset.id))));
      pane.querySelectorAll('.del-wb').forEach(btn => btn.addEventListener('click', async () => {
          if (!confirm('Deactivate this webinar?')) return;
          try {
            await api.delete(`/admin/events/${btn.dataset.id}`);
            webinars = webinars.filter(w => w.id !== btn.dataset.id);
            window._metis.toast('Webinar deactivated', 'success');
            draw();
          } catch(e) { window._metis.toast(e.message, 'error'); }
        })
      );
    }
    draw();
  }

  el.innerHTML = `
    <div class="tabs" id="admin-tabs">
      <button class="tab-btn active" data-tab="overview">Overview</button>
      <button class="tab-btn" data-tab="users">Users</button>
      <button class="tab-btn" data-tab="learnings">Learnings</button>
      <button class="tab-btn" data-tab="lunches">Launches</button>
      <button class="tab-btn" data-tab="workshops">Workshops</button>
      <button class="tab-btn" data-tab="webinars">Webinars</button>
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
    if (tab === 'learnings') await drawLearnings(pane);
    if (tab === 'lunches')   await drawLaunches(pane);
    if (tab === 'workshops') await drawWorkshops(pane);
    if (tab === 'webinars')  await drawWebinars(pane);
  }

  document.getElementById('admin-tabs').addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (btn) switchTab(btn.dataset.tab);
  });
  await switchTab('overview');
}
