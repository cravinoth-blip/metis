import { api } from '../api.js';
import { parseMarkdown } from '../markdown_parser.js';

export async function render(el) {
    // --- 1. URL Parsing ---
    const urlParams = new URLSearchParams(window.location.hash.includes('?')
        ? window.location.hash.split('?')[1]
        : window.location.search
    );
    const moduleId = urlParams.get('module_id');

    if (!moduleId) {
        el.innerHTML = `<div class="empty-state">Error: No module_id provided in URL.</div>`;
        return;
    }

    // --- 2. Load existing module ---
    let existingModule;
    try {
        existingModule = await api.get(`/admin/learning-modules/${moduleId}`);
    } catch (e) {
        el.innerHTML = `<div class="empty-state">Failed to load module: ${e.message}</div>`;
        return;
    }

    let sections = [];
    if (existingModule.content_text) {
        try {
            const parsed = JSON.parse(existingModule.content_text);
            sections = Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            sections = [{ type: 'text', heading: '', body: existingModule.content_text, points: [] }];
        }
    }

    // Split any section that has a heading into a separate heading block + content block
    function normalizeSections(raw) {
        const out = [];
        for (const s of raw) {
            const h = (s.heading || '').trim();
            if (h) {
                out.push({ type: 'heading', heading: '', body: h, points: [] });
                out.push({ ...s, heading: '' });
            } else {
                out.push(s);
            }
        }
        return out;
    }

    sections = normalizeSections(sections);

    // --- 3. State ---
    let moduleData = {
        title:     existingModule.title      || '',
        duration:  existingModule.duration_min ?? 10,
        xp_reward: existingModule.xp_reward  ?? 50,
        sections,
    };

    let dragStartIndex = null;

    const SECTION_TYPES = {
        heading:    { label: 'Heading',    icon: '📌', color: '#1e40af', bg: '#dbeafe' },
        text:       { label: 'Text',       icon: '📝', color: '#64748b', bg: '#f1f5f9' },
        key_points: { label: 'Key Points', icon: '✨', color: '#15803d', bg: '#dcfce7' },
        tip:        { label: 'Tip',        icon: '💡', color: '#0369a1', bg: '#e0f2fe' },
        warning:    { label: 'Warning',    icon: '⚠️', color: '#b45309', bg: '#fef3c7' },
        example:    { label: 'Example',    icon: '📋', color: '#6d28d9', bg: '#ede9fe' },
    };

    // --- 4. State Modifiers ---
    function addSection(type) {
        moduleData.sections.push({ type, heading: '', body: '', points: type === 'key_points' ? [''] : [] });
        drawSections();
    }
    function removeSection(index) { moduleData.sections.splice(index, 1); drawSections(); }
    function addPoint(si) { moduleData.sections[si].points.push(''); drawSections(); }
    function removePoint(si, pi) { moduleData.sections[si].points.splice(pi, 1); drawSections(); }

    // --- 5. Markdown Deparser (exact inverse of markdown_parser.js) ---
    // heading  → ### text       (parser: /^### (.*$)/ → <h4>)
    // text     → body           (parser: /\n\n/ → </p><p>)
    // key_pts  → - item\n- item (parser: /(^- .*)+/ → green box)
    // tip      → > 💡 **Tip:** …  (parser: /^>\s?/ → callout div)
    // warning  → > ⚠️ **Warning:** …
    // example  → > 📝 **Example:** …
    function deparseToMarkdown(sections) {
        return sections.map(s => {
            const body   = (s.body   || '').trim();
            const points = (s.points || []).filter(p => p.trim());
            switch (s.type) {
                case 'heading':    return body ? `### ${body}` : '';
                case 'text':       return body;
                case 'key_points': return points.map(p => `- ${p}`).join('\n');
                case 'tip':        return body ? `> 💡 **Tip:** ${body}` : '';
                case 'warning':    return body ? `> ⚠️ **Warning:** ${body}` : '';
                case 'example':    return body ? `> 📝 **Example:** ${body}` : '';
                default:           return body;
            }
        }).filter(Boolean).join('\n\n');
    }

    // --- 6. UI Renderer ---
    function drawSections() {
        const container = el.querySelector('#sections-container');

        if (moduleData.sections.length === 0) {
            container.innerHTML = `<div class="empty-state" style="padding:40px;text-align:center;background:#f8fafc;border-radius:12px;border:2px dashed #cbd5e1;color:#64748b;">No sections yet. Select a block type above to begin!</div>`;
            return;
        }

        container.innerHTML = moduleData.sections.map((sec, i) => {
            const config = SECTION_TYPES[sec.type] || SECTION_TYPES.text;

            let contentHTML;
            if (sec.type === 'heading') {
                contentHTML = `
                <div style="margin-top:12px;">
                    <input type="text" class="form-input body-input" data-sec="${i}" value="${sec.body.replace(/"/g, '&quot;')}" placeholder="Heading text..." style="width:100%;font-size:15px;font-weight:700;">
                </div>`;
            } else if (sec.type === 'key_points') {
                contentHTML = `
                <div style="margin-top:12px;">
                    <label style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;display:block">Bullet Points</label>
                    <div style="display:flex;flex-direction:column;gap:8px">
                        ${sec.points.map((pt, j) => `
                            <div style="display:flex;gap:8px">
                                <input type="text" class="form-input pt-input" data-sec="${i}" data-pt="${j}" value="${pt.replace(/"/g, '&quot;')}" placeholder="Enter a key point..." style="flex:1">
                                <button class="btn btn-secondary rm-pt-btn" data-sec="${i}" data-pt="${j}" style="padding:0 12px;color:#ef4444">✕</button>
                            </div>`).join('')}
                    </div>
                    <button class="btn btn-secondary btn-sm add-pt-btn" data-sec="${i}" style="margin-top:12px">+ Add Point</button>
                </div>`;
            } else {
                contentHTML = `
                <div style="margin-top:12px;">
                    <label style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:4px;display:block">Body Content</label>
                    <textarea class="form-input body-input" data-sec="${i}" placeholder="Write your ${config.label.toLowerCase()} here..." style="width:100%;height:100px;resize:vertical">${sec.body.replace(/</g, '&lt;')}</textarea>
                </div>`;
            }

            return `
                <div class="section-block" draggable="true" data-sec-idx="${i}" style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:20px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.05);transition:border 0.2s;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <div style="cursor:grab;font-size:20px;color:#94a3b8;user-select:none;" title="Drag to reorder">⋮⋮</div>
                            <div style="background:${config.bg};color:${config.color};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px;">
                                <span>${config.icon}</span> ${config.label}
                            </div>
                        </div>
                        <button class="rm-sec-btn" data-sec="${i}" style="background:none;border:none;color:#ef4444;cursor:pointer;font-weight:600;font-size:13px;">Remove</button>
                    </div>
                    ${contentHTML}
                </div>`;
        }).join('');

        attachListeners();
    }

    function attachListeners() {
        const container = el.querySelector('#sections-container');
        container.querySelectorAll('.body-input').forEach(inp => {
            inp.oninput = (e) => { moduleData.sections[e.target.dataset.sec].body = e.target.value; };
        });
        container.querySelectorAll('.pt-input').forEach(inp => {
            inp.oninput = (e) => { moduleData.sections[e.target.dataset.sec].points[e.target.dataset.pt] = e.target.value; };
        });
        container.querySelectorAll('.rm-sec-btn').forEach(btn => {
            btn.onclick = (e) => removeSection(e.target.dataset.sec);
        });
        container.querySelectorAll('.add-pt-btn').forEach(btn => {
            btn.onclick = (e) => addPoint(e.target.dataset.sec);
        });
        container.querySelectorAll('.rm-pt-btn').forEach(btn => {
            btn.onclick = (e) => removePoint(e.target.dataset.sec, e.target.dataset.pt);
        });

        container.querySelectorAll('.section-block').forEach(block => {
            block.addEventListener('dragstart', (e) => {
                dragStartIndex = parseInt(e.currentTarget.dataset.secIdx);
                e.currentTarget.style.opacity = '0.4';
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', dragStartIndex);
            });
            block.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                e.currentTarget.style.border = '2px dashed #3b82f6';
            });
            block.addEventListener('dragleave', (e) => {
                e.currentTarget.style.border = '1px solid #e2e8f0';
            });
            block.addEventListener('drop', (e) => {
                e.preventDefault();
                e.currentTarget.style.border = '1px solid #e2e8f0';
                const dropIndex = parseInt(e.currentTarget.dataset.secIdx);
                if (dragStartIndex !== null && dragStartIndex !== dropIndex) {
                    const [moved] = moduleData.sections.splice(dragStartIndex, 1);
                    moduleData.sections.splice(dropIndex, 0, moved);
                    drawSections();
                }
            });
            block.addEventListener('dragend', (e) => {
                e.currentTarget.style.opacity = '1';
                container.querySelectorAll('.section-block').forEach(b => b.style.border = '1px solid #e2e8f0');
            });
        });
    }

    // --- 7. Render Shell ---
    el.innerHTML = `
        <div style="max-width:800px;margin:0 auto;padding-bottom:60px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
                <div>
                    <h1 style="font-size:24px;margin-bottom:4px">Edit Module</h1>
                    <p class="text-secondary">Module ID: <code style="background:#f1f5f9;padding:2px 4px;border-radius:4px">${moduleId}</code></p>
                </div>
                <div style="display:flex;gap:8px;">
                    <button id="cancel-btn" class="btn btn-secondary">← Back</button>
                    <button id="preview-btn" class="btn btn-secondary">Preview</button>
                    <button id="save-btn" class="btn btn-success">Save Changes</button>
                </div>
            </div>

            <div style="background:#f8fafc;padding:20px;border-radius:12px;border:1px solid var(--border);margin-bottom:24px;display:grid;grid-template-columns:2fr 1fr 1fr;gap:16px;">
                <div>
                    <label style="font-size:12px;font-weight:600;margin-bottom:4px;display:block">Module Title</label>
                    <input id="mod-title" class="form-input" value="${moduleData.title.replace(/"/g, '&quot;')}" placeholder="e.g. Core Concepts" style="width:100%">
                </div>
                <div>
                    <label style="font-size:12px;font-weight:600;margin-bottom:4px;display:block">Duration (min)</label>
                    <input id="mod-dur" type="number" class="form-input" value="${moduleData.duration}" style="width:100%">
                </div>
                <div>
                    <label style="font-size:12px;font-weight:600;margin-bottom:4px;display:block">XP Reward</label>
                    <input id="mod-xp" type="number" class="form-input" value="${moduleData.xp_reward}" style="width:100%">
                </div>
            </div>

            <div style="display:flex;gap:12px;align-items:center;margin-bottom:24px;padding:16px;background:#fff;border:1px solid var(--border);border-radius:12px;">
                <span style="font-weight:600;font-size:14px;">Add Block:</span>
                <select id="section-type-select" class="form-input" style="flex:1;max-width:200px;">
                    <option value="heading">📌 Heading</option>
                    <option value="text">📝 Text</option>
                    <option value="key_points">✨ Key Points</option>
                    <option value="tip">💡 Tip</option>
                    <option value="warning">⚠️ Warning</option>
                    <option value="example">📋 Example</option>
                </select>
                <button id="add-sec-btn" class="btn btn-secondary">+ Add Section</button>
            </div>

            <div id="sections-container"></div>
        </div>`;

    // --- 8. Wire up metadata inputs ---
    el.querySelector('#mod-title').oninput = (e) => { moduleData.title = e.target.value; };
    el.querySelector('#mod-dur').oninput   = (e) => { moduleData.duration = parseInt(e.target.value) || 0; };
    el.querySelector('#mod-xp').oninput    = (e) => { moduleData.xp_reward = parseInt(e.target.value) || 0; };
    el.querySelector('#add-sec-btn').onclick = () => addSection(el.querySelector('#section-type-select').value);
    el.querySelector('#cancel-btn').onclick  = () => window._metis.navigate('/admin');

    // --- 9. Preview ---
    el.querySelector('#preview-btn').onclick = () => {
        const html = parseMarkdown(deparseToMarkdown(moduleData.sections));
        const overlay = window._metis.openModal(`
            <button class="modal-close" id="preview-close">✕</button>
            <div style="margin-bottom:24px;">
                <div style="display:inline-block;padding:2px 8px;border-radius:12px;background:#e2e8f0;color:#475569;font-size:11px;font-weight:700;margin-bottom:8px;">PREVIEW</div>
                <h2 style="margin-bottom:4px;font-size:17px">${moduleData.title || 'Untitled Module'}</h2>
                <div class="text-sm text-secondary">⏱ ${moduleData.duration || 0} min · ${moduleData.xp_reward || 0} pts</div>
            </div>
            <div style="font-size:14px;line-height:1.7;max-height:55vh;overflow-y:auto;padding-right:8px;padding-bottom:16px;">
                ${html || '<p class="text-secondary" style="text-align:center;padding:40px;">Add some sections to see the preview!</p>'}
            </div>
            <div style="margin-top:20px;display:flex;justify-content:flex-end;">
                <button id="preview-done-btn" class="btn btn-primary">Done</button>
            </div>`);
        const close = () => overlay.remove();
        overlay.querySelector('#preview-close').onclick = close;
        overlay.querySelector('#preview-done-btn').onclick = close;
    };

    // --- 10. Save ---
    el.querySelector('#save-btn').onclick = async () => {
        if (!moduleData.title.trim()) {
            window._metis.toast('Please enter a module title', 'error');
            return;
        }

        const cleanSections = moduleData.sections.map(s => ({
            ...s,
            points: s.type === 'key_points' ? s.points.filter(p => p.trim()) : [],
        }));

        const payload = {
            title:        moduleData.title.trim(),
            duration_min: moduleData.duration || null,
            xp_reward:    moduleData.xp_reward,
            content_text: JSON.stringify(cleanSections),
        };

        const saveBtn = el.querySelector('#save-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            await api.put(`/admin/learning-modules/${moduleId}`, payload);
            window._metis.toast('Module updated!', 'success');
            window._metis.navigate('/admin');
        } catch (e) {
            window._metis.toast(e.message || 'Error saving module', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    };

    drawSections();
}