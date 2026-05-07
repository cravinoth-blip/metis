import { api } from '../api.js';

export async function render(el) {
  const user = JSON.parse(localStorage.getItem('metis_user') || '{}');
  
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

    function renderUserForm(u = null) {
      const overlay = window._metis.openModal(`
        <button class="modal-close" id="uclose">✕</button>
        <h3 style="margin-bottom:16px">${u ? 'Edit User' : 'New User'}</h3>
        
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input id="u-name" class="form-input" value="${u?.full_name ?? ''}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input id="u-email" class="form-input" type="email" value="${u?.email ?? ''}">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Department</label>
            <input id="u-dept" class="form-input" placeholder="e.g. Engineering" value="${u?.department ?? ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Level</label>
            <input id="u-level" class="form-input" type="number" value="${u?.level ?? 1}">
          </div>
          <div class="form-group">
            <label class="form-label">Experience Points (XP)</label>
            <input id="u-xp" class="form-input" type="number" value="${u?.xp ?? 0}">
          </div>
          <div class="form-group" style="display:flex;align-items:center;gap:10px;padding-top:25px">
            <input id="u-admin" type="checkbox" ${u?.is_admin ? 'checked' : ''} style="width:auto">
            <label for="u-admin" class="form-label" style="margin:0">Admin Access</label>
          </div>
        </div>
        <div style="text-align:right;margin-top:16px">
          <button id="u-save" class="btn btn-primary">Save User</button>
        </div>`);

      overlay.querySelector('#uclose').onclick = () => overlay.remove();
      
      overlay.querySelector('#u-save').addEventListener('click', async () => {
        const full_name = overlay.querySelector('#u-name').value.trim();
        const email = overlay.querySelector('#u-email').value.trim();
        
        if (!full_name || !email) { 
          window._metis.toast('Name and Email are required', 'error'); 
          return; 
        }

        const payload = {
          full_name,
          email,
          department: overlay.querySelector('#u-dept').value || null,
          level: parseInt(overlay.querySelector('#u-level').value) || 0,
          xp: parseInt(overlay.querySelector('#u-xp').value) || 0,
          is_admin: overlay.querySelector('#u-admin').checked,
        };

        try {
          if (u) {
            const updated = await api.put(`/admin/users/${u.id}`, payload);
            users = users.map(user => user.id === u.id ? updated : user);
          } else {
            const created = await api.post('/admin/users', payload);
            users = [created, ...users];
          }
          overlay.remove();
          window._metis.toast('User saved successfully', 'success');
          draw();
        } catch (e) { 
          window._metis.toast(e.message, 'error'); 
        }
      });
    }

    function draw() {
      const filtered = users.filter(u =>
        !q || u.email.toLowerCase().includes(q) || (u.full_name ?? '').toLowerCase().includes(q)
      );

      pane.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
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
                  <td style="white-space:nowrap">
                    <button class="btn btn-secondary btn-sm edit-user" data-id="${u.id}" style="margin-right:4px">Edit</button>
                    <button class="btn btn-danger btn-sm del-user" data-id="${u.id}">Delete</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;

      document.getElementById('user-search')?.addEventListener('input', e => { 
        q = e.target.value.toLowerCase(); 
        draw(); 
      });


      pane.querySelectorAll('.edit-user').forEach(btn =>
        btn.addEventListener('click', () => {
          const u = users.find(user => String(user.id) === String(btn.dataset.id));
          renderUserForm(u);
        })
      );

      pane.querySelectorAll('.del-user').forEach(btn =>
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this user?')) return;
          try {
            await api.delete(`/admin/users/${btn.dataset.id}`);
            users = users.filter(u => String(u.id) !== String(btn.dataset.id));
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

  async function drawEvents(pane) {
    const [workshops, webinars] = await Promise.all([
      api.get('/admin/events?event_type=workshop'),
      api.get('/admin/events?event_type=webinar'),
    ]);

    let allEvents = [
      ...workshops.map(e => ({ ...e, _type: 'workshop' })),
      ...webinars.map(e => ({ ...e, _type: 'webinar' })),
    ];

    let q = '';
    let typeFilter = 'all';

    const FORMATS = ['in-person', 'online', 'hybrid', 'other'];

    const fmtDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    };

    function renderWorkshopForm(ws = null) {
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
            <input id="ws-start" class="form-input" type="datetime-local" value="${fmtDate(ws?.start_date)}">
          </div>
          <div class="form-group">
            <label class="form-label">End Date</label>
            <input id="ws-end" class="form-input" type="datetime-local" value="${fmtDate(ws?.end_date)}">
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
          format:           document.getElementById('ws-format').value    || null,
          location:         document.getElementById('ws-location').value  || null,
          organizer:        document.getElementById('ws-organizer').value || null,
          url:              document.getElementById('ws-url').value       || null,
          tags:             document.getElementById('ws-tags').value      || null,
          level:            parseInt(document.getElementById('ws-level').value)    || 1,
          duration_minutes: parseInt(document.getElementById('ws-duration').value) || null,
          xp_reward:        parseInt(document.getElementById('ws-points').value)   || 0,
          is_active:        document.getElementById('ws-active').checked,
          start_date:       startVal ? new Date(startVal).toISOString() : null,
          end_date:         endVal   ? new Date(endVal).toISOString()   : null,
        };
        try {
          if (ws) {
            const updated = await api.put(`/admin/events/${ws.id}`, payload);
            allEvents = allEvents.map(e => e.id === ws.id ? { ...updated, _type: 'workshop' } : e);
          } else {
            const created = await api.post('/admin/events', payload);
            allEvents = [{ ...created, _type: 'workshop' }, ...allEvents];
          }
          overlay.remove();
          window._metis.toast('Saved', 'success');
          draw();
        } catch(e) { window._metis.toast(e.message, 'error'); }
      });
    }

    function renderWebinarForm(wb = null) {
      const overlay = window._metis.openModal(`
        <button class="modal-close" id="wbclose">✕</button>
        <h3 style="margin-bottom:16px">${wb ? 'Edit webinar' : 'New webinar'}</h3>
        <div class="form-group"><label class="form-label">Title *</label><input id="wb-title" class="form-input" value="${wb?.title ?? ''}"></div>
        <div class="form-group"><label class="form-label">Description</label><textarea id="wb-desc" class="form-input" rows="3">${wb?.description ?? ''}</textarea></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group"><label class="form-label">Organizer</label><input id="wb-organizer" class="form-input" value="${wb?.organizer ?? ''}"></div>
          <div class="form-group"><label class="form-label">Speaker</label><input id="wb-speaker" class="form-input" value="${wb?.speaker ?? ''}"></div>
          <div class="form-group"><label class="form-label">Duration (min)</label><input id="wb-duration" class="form-input" type="number" value="${wb?.duration_minutes ?? ''}"></div>
          <div class="form-group"><label class="form-label">Start Date & Time</label><input id="wb-start" class="form-input" type="datetime-local" value="${fmtDate(wb?.start_date)}"></div>
          <div class="form-group"><label class="form-label">XP Reward</label><input id="wb-xp" class="form-input" type="number" value="${wb?.xp_reward ?? 0}"></div>
        </div>
        <div class="form-group"><label class="form-label">Registration URL</label><input id="wb-url" class="form-input" value="${wb?.registration_url ?? ''}"></div>
        <div style="text-align:right;margin-top:16px"><button id="wb-save" class="btn btn-primary">Save</button></div>`);
      overlay.querySelector('#wbclose').onclick = () => overlay.remove();
      overlay.querySelector('#wb-save').addEventListener('click', async () => {
        const title = document.getElementById('wb-title').value.trim();
        if (!title) { window._metis.toast('Title is required', 'error'); return; }
        const startVal = document.getElementById('wb-start').value;
        const payload = {
          event_type:       'webinar',
          title,
          description:      document.getElementById('wb-desc').value      || null,
          speaker:          document.getElementById('wb-speaker').value   || null,
          organizer:        document.getElementById('wb-organizer').value || null,
          registration_url: document.getElementById('wb-url').value      || null,
          duration_minutes: parseInt(document.getElementById('wb-duration').value) || null,
          xp_reward:        parseInt(document.getElementById('wb-xp').value)       || 0,
          start_date:       startVal ? new Date(startVal).toISOString() : null,
        };
        try {
          if (wb) {
            const updated = await api.put(`/admin/events/${wb.id}`, payload);
            allEvents = allEvents.map(e => e.id === wb.id ? { ...updated, _type: 'webinar' } : e);
          } else {
            const created = await api.post('/admin/events', payload);
            allEvents = [{ ...created, _type: 'webinar' }, ...allEvents];
          }
          overlay.remove();
          window._metis.toast('Saved', 'success');
          draw();
        } catch(e) { window._metis.toast(e.message, 'error'); }
      });
    }

    function draw() {
      let filtered = allEvents.filter(e => e.is_active !== false);
      if (typeFilter !== 'all') filtered = filtered.filter(e => e._type === typeFilter);
      if (q) filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(q) || (e.category ?? '').toLowerCase().includes(q)
      );

      const pillStyle = (f) => typeFilter === f
        ? 'background:var(--primary,#6366f1);color:#fff;border:1px solid transparent'
        : 'background:transparent;color:var(--text-secondary);border:1px solid var(--border)';

      pane.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <input id="ev-search" class="form-input search-input" placeholder="Search by title or category…" value="${q}">
            <div style="display:flex;gap:4px">
              <button class="btn btn-sm ev-filter" data-filter="all" style="${pillStyle('all')}">All</button>
              <button class="btn btn-sm ev-filter" data-filter="workshop" style="${pillStyle('workshop')}">Workshops</button>
              <button class="btn btn-sm ev-filter" data-filter="webinar" style="${pillStyle('webinar')}">Webinars</button>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button id="new-ws-btn" class="btn btn-primary btn-sm">+ Workshop</button>
            <button id="new-wb-btn" class="btn btn-primary btn-sm">+ Webinar</button>
          </div>
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <table class="table">
            <thead><tr><th>Type</th><th>Title</th><th>Category</th><th>Date</th><th>Duration</th><th>Capacity</th><th>XP</th><th>Actions</th></tr></thead>
            <tbody>
              ${filtered.length ? filtered.map(e => {
                const dateStr = e.start_date
                  ? new Date(e.start_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                  : (e.event_date ?? '—');
                const badge = e._type === 'workshop'
                  ? '<span style="font-size:0.75em;font-weight:600;padding:2px 8px;border-radius:999px;background:#dbeafe;color:#1d4ed8">Workshop</span>'
                  : '<span style="font-size:0.75em;font-weight:600;padding:2px 8px;border-radius:999px;background:#ede9fe;color:#6d28d9">Webinar</span>';
                return `<tr>
                  <td>${badge}</td>
                  <td>
                    <div style="font-weight:500">${e.title}</div>
                    ${e.location ? `<div class="text-sm" style="color:var(--text-secondary)">📍 ${e.location}</div>` : ''}
                    ${e.speaker  ? `<div class="text-sm" style="color:var(--text-secondary)">🎤 ${e.speaker}</div>`  : ''}
                  </td>
                  <td>${e.category ?? '—'}</td>
                  <td style="white-space:nowrap;font-size:0.9em">${dateStr}</td>
                  <td>${e.duration_minutes ? `${e.duration_minutes} min` : '—'}</td>
                  <td>${e.capacity ?? '—'}</td>
                  <td>${e.xp_reward ?? 0}</td>
                  <td style="white-space:nowrap">
                    <button class="btn btn-secondary btn-sm edit-ev" data-id="${e.id}" data-type="${e._type}" style="margin-right:4px">Edit</button>
                    <button class="btn btn-danger btn-sm del-ev" data-id="${e.id}" data-type="${e._type}">Delete</button>
                  </td>
                </tr>`;
              }).join('')
              : `<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);padding:40px">No events found.</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="text-sm text-secondary" style="margin-top:10px">${filtered.length} event${filtered.length !== 1 ? 's' : ''}</div>`;

      document.getElementById('ev-search').addEventListener('input', e => { q = e.target.value.toLowerCase(); draw(); });
      pane.querySelectorAll('.ev-filter').forEach(btn =>
        btn.addEventListener('click', () => { typeFilter = btn.dataset.filter; draw(); })
      );
      document.getElementById('new-ws-btn').onclick = () => renderWorkshopForm();
      document.getElementById('new-wb-btn').onclick = () => renderWebinarForm();
      pane.querySelectorAll('.edit-ev').forEach(btn =>
        btn.addEventListener('click', () => {
          const ev = allEvents.find(e => e.id === Number(btn.dataset.id));
          if (!ev) return;
          if (btn.dataset.type === 'workshop') renderWorkshopForm(ev);
          else renderWebinarForm(ev);
        })
      );
      pane.querySelectorAll('.del-ev').forEach(btn =>
        btn.addEventListener('click', async () => {
          const label = btn.dataset.type === 'workshop' ? 'workshop' : 'webinar';
          if (!confirm(`Deactivate this ${label}?`)) return;
          try {
            await api.delete(`/admin/events/${btn.dataset.id}`);
            allEvents = allEvents.filter(e => e.id !== Number(btn.dataset.id));
            window._metis.toast(`${label.charAt(0).toUpperCase() + label.slice(1)} deactivated`, 'success');
            draw();
          } catch(e) { window._metis.toast(e.message, 'error'); }
        })
      );
    }
    draw();
  }

  async function drawAITools(pane) {
    let tools = await api.get('/admin/ai-tools');
    let q = '';
    let toolTypeFilter = 'all'; // State for the new filter

    function renderForm(t = null) {
      const overlay = window._metis.openModal(`
        <button class="modal-close" id="atclose">✕</button>
        <h3 style="margin-bottom:16px">${t ? 'Edit AI tool' : 'New AI tool'}</h3>
        
        <div class="form-group">
          <label class="form-label">Name *</label>
          <input id="at-name" class="form-input" value="${t?.name ?? ''}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="at-desc" class="form-input" rows="3">${t?.description ?? ''}</textarea>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Category</label>
            <input id="at-category" class="form-input" placeholder="e.g. Research" value="${t?.category ?? ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Provider</label>
            <input id="at-provider" class="form-input" placeholder="e.g. Anthropic" value="${t?.provider ?? ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Emoji logo</label>
            <input id="at-emoji" class="form-input" placeholder="e.g. 🤖" value="${t?.emoji_logo ?? ''}">
          </div>
          <div class="form-group">
            <label class="form-label">URL</label>
            <input id="at-url" class="form-input" placeholder="https://..." value="${t?.url ?? ''}">
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Tags (comma-separated)</label>
          <input id="at-tags" class="form-input" placeholder="Writing, Research, Code" value="${t?.tags ?? ''}">
        </div>
        
        <div class="form-group" style="display:flex;align-items:center;gap:10px;margin-top:8px">
          <input id="at-enterprise" type="checkbox" ${t?.is_enterprise ? 'checked' : ''} style="width:auto">
          <label for="at-enterprise" class="form-label" style="margin:0">Enterprise tool</label>
        </div>
        
        <div style="text-align:right;margin-top:16px">
          <button id="at-save" class="btn btn-primary">Save</button>
        </div>`);

      overlay.querySelector('#atclose').onclick = () => overlay.remove();
      
      overlay.querySelector('#at-save').addEventListener('click', async () => {
        const name = overlay.querySelector('#at-name').value.trim();
        if (!name) { window._metis.toast('Name is required', 'error'); return; }
        
        const payload = {
          name,
          description:  overlay.querySelector('#at-desc').value      || null,
          category:     overlay.querySelector('#at-category').value  || null,
          emoji_logo:   overlay.querySelector('#at-emoji').value     || null,
          provider:     overlay.querySelector('#at-provider').value  || null,
          url:          overlay.querySelector('#at-url').value       || null,
          tags:         overlay.querySelector('#at-tags').value      || null,
          is_enterprise: overlay.querySelector('#at-enterprise').checked,
        };

        try {
          if (t) {
            const updated = await api.put(`/admin/ai-tools/${t.id}`, payload);
            tools = tools.map(x => x.id === t.id ? updated : x);
          } else {
            const created = await api.post('/admin/ai-tools', payload);
            tools = [created, ...tools];
          }
          overlay.remove();
          window._metis.toast('Saved', 'success');
          draw();
        } catch(e) { window._metis.toast(e.message, 'error'); }
      });
    }

    function draw() {
      // Apply search string and type filtering
      let filtered = tools.filter(t =>
        !q || 
        t.name.toLowerCase().includes(q) || 
        (t.category ?? '').toLowerCase().includes(q) ||
        (t.tags ?? '').toLowerCase().includes(q)
      );

      if (toolTypeFilter === 'enterprise') {
        filtered = filtered.filter(t => t.is_enterprise);
      } else if (toolTypeFilter === 'free') {
        filtered = filtered.filter(t => !t.is_enterprise);
      }

      const pillStyle = (f) => toolTypeFilter === f
        ? 'background:var(--primary,#6366f1);color:#fff;border:1px solid transparent'
        : 'background:transparent;color:var(--text-secondary);border:1px solid var(--border)';

      pane.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <input id="at-search" class="form-input search-input" placeholder="Search by name, category, or tag…" value="${q}">
            <div style="display:flex;gap:4px">
              <button class="btn btn-sm at-filter" data-filter="all" style="${pillStyle('all')}">All</button>
              <button class="btn btn-sm at-filter" data-filter="enterprise" style="${pillStyle('enterprise')}">Enterprise</button>
              <button class="btn btn-sm at-filter" data-filter="free" style="${pillStyle('free')}">Free</button>
            </div>
          </div>
          <button id="new-at-btn" class="btn btn-primary btn-sm">+ New tool</button>
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <table class="table">
            <thead><tr><th></th><th>Name</th><th>Category</th><th>Provider</th><th>Description</th><th>Tags</th><th>URL</th><th>Type</th><th>Actions</th></tr></thead>
            <tbody>
              ${filtered.length ? filtered.map(t => {
                const badge = t.is_enterprise
                  ? '<span style="font-size:0.75em;font-weight:600;padding:2px 8px;border-radius:999px;background:#dcfce7;color:#166556">Enterprise</span>'
                  : '<span style="font-size:0.75em;font-weight:600;padding:2px 8px;border-radius:999px;background:#ffa6a6;color:#000000">Free</span>';
                return `<tr>
                  <td style="font-size:1.4em;text-align:center">${t.emoji_logo ?? '🔧'}</td>
                  <td style="font-weight:500">${t.name}</td>
                  <td>${t.category ?? '—'}</td>
                  <td style="font-size:0.9em">${t.provider ?? '—'}</td>
                  <td style="max-width:220px;white-space:normal;font-size:0.9em">${t.description ?? '—'}</td>
                  <td style="font-size:0.85em;color:var(--text-secondary)">${t.tags ?? '—'}</td>
                  <td>${t.url ? `<a href="${t.url}" target="_blank" style="color:var(--primary)">Link</a>` : '—'}</td>
                  <td>${badge}</td>
                  <td style="white-space:nowrap">
                    <button class="btn btn-secondary btn-sm edit-at" data-id="${t.id}" style="margin-right:4px">Edit</button>
                    <button class="btn btn-danger btn-sm del-at" data-id="${t.id}">Delete</button>
                  </td>
                </tr>`;
              }).join('')
              : `<tr><td colspan="9" style="text-align:center;color:var(--text-secondary);padding:40px">No AI tools found.</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="text-sm text-secondary" style="margin-top:10px">${filtered.length} tool${filtered.length !== 1 ? 's' : ''}</div>`;
      
      // Event listeners
      document.getElementById('at-search').addEventListener('input', e => { q = e.target.value.toLowerCase(); draw(); });
      
      pane.querySelectorAll('.at-filter').forEach(btn =>
        btn.addEventListener('click', () => { toolTypeFilter = btn.dataset.filter; draw(); })
      );

      document.getElementById('new-at-btn').onclick = () => renderForm();
      
      pane.querySelectorAll('.edit-at').forEach(btn =>
        btn.addEventListener('click', () => {
          const t = tools.find(x => String(x.id) === btn.dataset.id);
          if (t) renderForm(t);
        })
      );
      
      pane.querySelectorAll('.del-at').forEach(btn =>
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this tool?')) return;
          try {
            await api.delete(`/admin/ai-tools/${btn.dataset.id}`);
            tools = tools.filter(x => String(x.id) !== btn.dataset.id);
            window._metis.toast('Tool deleted', 'success');
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
      <button class="tab-btn" data-tab="events">Workshops & Webinars</button>
      <button class="tab-btn" data-tab="ai-tools">AI Tools</button>
    </div>
    <div id="admin-pane"></div>`;

  async function switchTab(tab) {
    document.querySelectorAll('#admin-tabs .tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tab)
    );
    const pane = document.getElementById('admin-pane');
    pane.innerHTML = '<div class="loading">Loading…</div>';
    if (tab === 'overview')  await drawOverview(pane);
    if (tab === 'users')     await drawUsers(pane);
    if (tab === 'learnings') await drawLearnings(pane);
    if (tab === 'events')    await drawEvents(pane);
    if (tab === 'ai-tools')  await drawAITools(pane);
  }

  document.getElementById('admin-tabs').addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (btn) switchTab(btn.dataset.tab);
  });
  await switchTab('overview');
}
