import { api } from '../api.js';
import {parseMarkdown} from '../markdown_parser.js'

function renderSection(s) {
    if (typeof s === 'string') return parseMarkdown(s);
    const type = (s.type || '').toLowerCase();
    const body = s.body || s.content || s.text;
    if (type === 'text' && body) return parseMarkdown(body);
    return `<p style="margin-bottom:12px;font-size:14px">${body}</p>`;
}

// ── 2. Module Detail Modal (Refactored for Completion Badge) ───────────────
async function openModuleModal(learningId, moduleId, modTitle) {
    try {
        const detail = await api.get(`/courses/learnings/${learningId}/modules/${moduleId}`);
        const sections = detail.sections || [];

        const overlay = window._metis.openModal(`
            <button class="modal-close" id="mclose">✕</button>
            <h2 style="margin-bottom:4px;font-size:17px">${modTitle}</h2>
            ${detail.duration_min ? `<div class="text-sm text-secondary" style="margin-bottom:16px">⏱ ${detail.duration_min} min · ${detail.xp_reward ?? 0} pts</div>` : ''}
            
            <div style="font-size:14px;line-height:1.7;max-height:55vh;overflow-y:auto;padding-right:8px;padding-bottom:16px;border-bottom:1px solid var(--border)">
                ${sections.length ? sections.map(renderSection).join('') : `<p>${detail.description || 'No detailed content available.'}</p>`}
                ${detail.content_url ? `<div style="margin-top:20px"><a href="${detail.content_url}" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration:none">Open Resource ↗</a></div>` : ''}
            </div>

            <div style="margin-top:20px;display:flex;align-items:center;gap:12px">
                ${detail.completed ? `
                    <!-- New Badge UI instead of Button -->
                    <div style="margin-left:auto; display:flex; align-items:center; gap:8px; background:#dcfce7; color:#15803d; padding:8px 16px; border-radius:8px; font-weight:600; font-size:14px;">
                        <span>✅</span> Module Completed
                    </div>
                ` : `
                    <span id="timer-msg" class="text-sm text-secondary">Read for 5s to complete…</span>
                    <button id="complete-btn" class="btn btn-success" disabled style="margin-left:auto">
                        Mark complete
                    </button>
                `}
            </div>
        `);

        overlay.querySelector('#mclose').onclick = () => overlay.remove();

        // The logic for incomplete modules stays the same, 
        // but it now only executes if the elements exist.
        const completeBtn = overlay.querySelector('#complete-btn');
        const timerMsg    = overlay.querySelector('#timer-msg');

        if (!detail.completed && completeBtn) {
            let left = 5;
            const t = setInterval(() => {
                left--;
                if (left > 0) {
                    timerMsg.textContent = `Read for ${left}s to complete…`;
                } else {
                    clearInterval(t);
                    timerMsg.textContent = '';
                    completeBtn.disabled = false;
                }
            }, 1000);

            completeBtn.onclick = async () => {
                completeBtn.disabled = true;
                completeBtn.textContent = 'Saving…';
                try {
                    const res = await api.post(`/courses/learnings/${learningId}/modules/${moduleId}/complete`, {});
                    window._metis.toast(`Module complete! +${res.xp_earned || 0} XP`, 'success');

                    const me = await api.get('/auth/me');
                    localStorage.setItem('metis_user', JSON.stringify(me));
                    window._metis.refreshShell();

                    overlay.remove();
                    // Refresh the list to update percentage bars
                    import('./learning.js').then(m => m.render(document.getElementById('content')));
                    
                } catch (e) {
                    window._metis.toast(e.message || "Failed to save progress", 'error');
                    completeBtn.disabled = false;
                    completeBtn.textContent = 'Mark complete';
                }
            };
        }
    } catch (e) {
        window._metis.toast("Failed to load module details", "error");
    }
}


// ── 3. UI Helpers ────────────────────────────────────────────────────────────
function typeBadge(type) {
    const TYPE_COLORS = { article: '#e0f2fe', video: '#fce7f3', course: '#ede9fe', tutorial: '#dcfce7' };
    const TEXT_COLORS = { article: '#0369a1', video: '#9d174d', course: '#6d28d9', tutorial: '#15803d' };
    const bg = TYPE_COLORS[type] || '#f1f5f9';
    const color = TEXT_COLORS[type] || '#64748b';
    return type ? `<span style="display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;background:${bg};color:${color};margin-bottom:8px">${type}</span>` : '';
}

// ── 4. Main Render ───────────────────────────────────────────────────────────
export async function render(el) {
    const learnings = await api.get('/courses/learnings');
    let expandedId = null;
    let query = '';

    function draw() {
        const filtered = learnings.filter(l => !query || l.title.toLowerCase().includes(query) || (l.description || '').toLowerCase().includes(query));

        el.querySelector('#learnings-container').innerHTML = filtered.map(lr => {
            const isExpanded = expandedId === lr.id;
            const pct = lr.progress_pct || 0;
            const isCourseCompleted = pct >= 100;
            
            // The new Completed Badge HTML
            const completedBadge = isCourseCompleted 
                ? `<span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:#dcfce7;color:#15803d;margin-left:8px;vertical-align:text-bottom;">✓ Completed</span>` 
                : '';

            return `
                <div class="course-card">
                    <div class="course-header" data-id="${lr.id}" style="cursor:pointer">
                        <div style="flex:1">
                            ${typeBadge(lr.type)}
                            
                            <div style="font-weight:600;font-size:15px;margin-bottom:4px">
                                ${lr.title} ${completedBadge}
                            </div>
                            
                            <div class="text-sm text-secondary">${lr.description || ''}</div>
                            
                            <!-- Progress Bar -->
                            <div style="margin-top:12px;max-width:240px">
                                <div class="flex justify-between text-xs" style="margin-bottom:4px">
                                    <span>Progress</span><span>${pct}%</span>
                                </div>
                                <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                            </div>
                        </div>
                        <span style="font-size:18px;margin-left:12px">${isExpanded ? '▲' : '▼'}</span>
                    </div>

                    ${isExpanded ? `
                        <div class="module-list" style="border-top:1px solid var(--border)">
                            ${(lr.modules || []).map(m => {
                                // Optional UI improvement: check if individual module is done 
                                // (Requires lr.modules_completed array from backend)
                                const isModDone = (lr.modules_completed || []).includes(m.order ?? m.id);
                                
                                return `
                                <div class="module-item mod-trigger" data-lr-id="${lr.id}" data-mod-id="${m.id}" style="display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer">
                                    <span style="font-size:16px">${isModDone ? '✅' : '📄'}</span>
                                    <div style="flex:1">
                                        <div style="font-size:14px;font-weight:500 ${isModDone ? ';color:var(--secondary)' : ''}">${m.title}</div>
                                        <div class="text-xs text-secondary">${m.duration_min || 0} min</div>
                                    </div>
                                    <span class="text-accent" style="font-size:12px">Open →</span>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>`;
        }).join('') || '<div class="empty-state">No resources found.</div>';

        // Listeners
        el.querySelectorAll('.course-header').forEach(h => h.onclick = () => {
            expandedId = expandedId === h.dataset.id ? null : h.dataset.id;
            draw();
        });

        el.querySelectorAll('.mod-trigger').forEach(m => m.onclick = (e) => {
            e.stopPropagation();
            openModuleModal(m.dataset.lrId, m.dataset.modId, m.querySelector('div > div').textContent);
        });
    }

    el.innerHTML = `
        <div style="margin-bottom:24px">
            <h1 style="font-size:22px;margin-bottom:4px">Learning Resources</h1>
            <p class="text-secondary" style="margin-bottom:16px">Track your progress and earn XP.</p>
            <input id="lr-search" class="form-input" placeholder="Search resources..." style="width:100%">
        </div>
        <div id="learnings-container"></div>`;

    el.querySelector('#lr-search').oninput = (e) => {
        query = e.target.value.toLowerCase();
        draw();
    };

    draw();
}

