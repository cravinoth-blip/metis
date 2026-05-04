import { api } from '../api.js';
import { parseMarkdown } from '../markdown_parser.js'; // Imported Markdown Parser

export async function render(el) {
    // --- 1. Dynamic URL Parsing ---
    const urlParams = new URLSearchParams(window.location.hash.includes('?') 
        ? window.location.hash.split('?')[1] 
        : window.location.search
    );
    const learningId = urlParams.get('learning_id');

    // --- 2. State Management ---
    let moduleData = {
        title: '',
        duration: 10,
        xp_reward: 50,
        sections: []
    };

    let dragStartIndex = null;

    const SECTION_TYPES = {
        text:       { label: 'Text', icon: '📝', color: '#64748b', bg: '#f1f5f9' },
        key_points: { label: 'Key Points', icon: '✨', color: '#15803d', bg: '#dcfce7' },
        tip:        { label: 'Tip', icon: '💡', color: '#0369a1', bg: '#e0f2fe' },
        warning:    { label: 'Warning', icon: '⚠️', color: '#b45309', bg: '#fef3c7' },
        example:    { label: 'Example', icon: '📋', color: '#6d28d9', bg: '#ede9fe' }
    };

    // --- 3. State Modifiers ---
    function addSection(type) {
        moduleData.sections.push({
            type: type,
            heading: '',
            body: '',
            points: type === 'key_points' ? [''] : []
        });
        drawSections();
    }

    function removeSection(index) {
        moduleData.sections.splice(index, 1);
        drawSections();
    }

    function addPoint(sectionIndex) {
        moduleData.sections[sectionIndex].points.push('');
        drawSections();
    }

    function removePoint(sectionIndex, pointIndex) {
        moduleData.sections[sectionIndex].points.splice(pointIndex, 1);
        drawSections();
    }

    // --- 4. Frontend Markdown Compiler (For Preview) ---
    function generateMarkdownPreview(sections) {
        let mdParts = [];
        for (const s of sections) {
            const t = (s.type || '').toLowerCase();
            const heading = (s.heading || '').trim();
            const body = (s.body || '').trim();
            const points = s.points || [];

            if (heading) mdParts.push(`### ${heading}`);

            if (t === 'text' && body) {
                mdParts.push(body);
            } else if (t === 'key_points' && points.length) {
                const bullets = points.filter(p => p.trim()).map(p => `- ${p}`).join('\n');
                if (bullets) mdParts.push(bullets);
            } else if (t === 'steps' && points.length) {
                const steps = points.filter(p => p.trim()).map((p, i) => `${i+1}. ${p}`).join('\n');
                if (steps) mdParts.push(steps);
            } else if (t === 'tip' && body) {
                mdParts.push(`> 💡 **Tip:** ${body}`);
            } else if (t === 'warning' && body) {
                mdParts.push(`> ⚠️ **Warning:** ${body}`);
            } else if (t === 'example' && body) {
                mdParts.push(`> 📝 **Example:** ${body}`);
            }
        }
        return mdParts.join('\n\n').trim();
    }

    // --- 5. UI Renderer ---
    function drawSections() {
        const container = el.querySelector('#sections-container');
        
        if (moduleData.sections.length === 0) {
            container.innerHTML = `<div class="empty-state" style="padding:40px;text-align:center;background:#f8fafc;border-radius:12px;border:2px dashed #cbd5e1;color:#64748b;">No sections added yet. Select a block type above to begin!</div>`;
            return;
        }

        container.innerHTML = moduleData.sections.map((sec, i) => {
            const config = SECTION_TYPES[sec.type];
            let contentHTML = '';

            if (sec.type === 'key_points') {
                contentHTML = `
                    <div style="margin-top:12px;">
                        <label style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;display:block">Bullet Points</label>
                        <div id="points-list-${i}" style="display:flex;flex-direction:column;gap:8px">
                            ${sec.points.map((pt, j) => `
                                <div style="display:flex;gap:8px">
                                    <input type="text" class="form-input pt-input" data-sec="${i}" data-pt="${j}" value="${pt.replace(/"/g, '&quot;')}" placeholder="Enter a key point..." style="flex:1">
                                    <button class="btn btn-secondary rm-pt-btn" data-sec="${i}" data-pt="${j}" style="padding:0 12px;color:#ef4444">✕</button>
                                </div>
                            `).join('')}
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
                <div class="section-block" draggable="true" data-sec-idx="${i}" style="border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:20px; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.05); transition: border 0.2s;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="cursor:grab; font-size:20px; color:#94a3b8; user-select:none;" title="Drag to reorder">⋮⋮</div>
                            <div style="background:${config.bg}; color:${config.color}; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; display:flex; align-items:center; gap:6px;">
                                <span>${config.icon}</span> ${config.label}
                            </div>
                        </div>
                        <button class="rm-sec-btn" data-sec="${i}" style="background:none;border:none;color:#ef4444;cursor:pointer;font-weight:600;font-size:13px;">Remove Section</button>
                    </div>
                    <div>
                        <label style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:4px;display:block">Heading (Optional)</label>
                        <input type="text" class="form-input heading-input" data-sec="${i}" value="${sec.heading.replace(/"/g, '&quot;')}" placeholder="Section Heading" style="width:100%">
                    </div>
                    ${contentHTML}
                </div>`;
        }).join('');

        attachListeners();
    }

    function attachListeners() {
        const container = el.querySelector('#sections-container');
        
        container.querySelectorAll('.heading-input').forEach(inp => {
            inp.oninput = (e) => moduleData.sections[e.target.dataset.sec].heading = e.target.value;
        });
        container.querySelectorAll('.body-input').forEach(inp => {
            inp.oninput = (e) => moduleData.sections[e.target.dataset.sec].body = e.target.value;
        });
        container.querySelectorAll('.pt-input').forEach(inp => {
            inp.oninput = (e) => moduleData.sections[e.target.dataset.sec].points[e.target.dataset.pt] = e.target.value;
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

        // --- DRAG AND DROP LISTENERS ---
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
                const dragEndIndex = parseInt(e.currentTarget.dataset.secIdx);
                
                if (dragStartIndex !== null && dragStartIndex !== dragEndIndex) {
                    const draggedItem = moduleData.sections.splice(dragStartIndex, 1)[0];
                    moduleData.sections.splice(dragEndIndex, 0, draggedItem);
                    drawSections(); 
                }
            });
            block.addEventListener('dragend', (e) => {
                e.currentTarget.style.opacity = '1';
                container.querySelectorAll('.section-block').forEach(b => b.style.border = '1px solid #e2e8f0');
            });
        });
    }

    // --- 6. Initial Layout Render ---
    if (!learningId) {
        el.innerHTML = `<div class="empty-state">Error: No Learning ID provided in URL. Cannot add module.</div>`;
        return;
    }

    el.innerHTML = `
        <div style="max-width:800px; margin:0 auto; padding-bottom:60px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                <div>
                    <h1 style="font-size:24px;margin-bottom:4px">Module Builder</h1>
                    <p class="text-secondary">Adding new module to Learning ID: <code style="background:#f1f5f9;padding:2px 4px;border-radius:4px">${learningId}</code></p>
                </div>
                <div style="display:flex; gap:8px;">
                    <button id="preview-module-btn" class="btn btn-secondary">Preview</button>
                    <button id="save-module-btn" class="btn btn-success">Save & Publish</button>
                </div>
            </div>

            <div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid var(--border); margin-bottom:24px; display:grid; grid-template-columns:2fr 1fr 1fr; gap:16px;">
                <div>
                    <label style="font-size:12px;font-weight:600;margin-bottom:4px;display:block">Module Title</label>
                    <input id="mod-title" class="form-input" placeholder="e.g. Core Concepts" style="width:100%">
                </div>
                <div>
                    <label style="font-size:12px;font-weight:600;margin-bottom:4px;display:block">Duration (min)</label>
                    <input id="mod-dur" type="number" class="form-input" value="10" style="width:100%">
                </div>
                <div>
                    <label style="font-size:12px;font-weight:600;margin-bottom:4px;display:block">XP Reward</label>
                    <input id="mod-xp" type="number" class="form-input" value="50" style="width:100%">
                </div>
            </div>

            <div style="display:flex; gap:12px; align-items:center; margin-bottom:24px; padding:16px; background:#fff; border:1px solid var(--border); border-radius:12px;">
                <span style="font-weight:600; font-size:14px;">Add Block:</span>
                <select id="section-type-select" class="form-input" style="flex:1; max-width:200px;">
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

    // --- 7. Final Listeners & Logic ---
    el.querySelector('#mod-title').oninput = (e) => moduleData.title = e.target.value;
    el.querySelector('#mod-dur').oninput = (e) => moduleData.duration = parseInt(e.target.value) || 0;
    el.querySelector('#mod-xp').oninput = (e) => moduleData.xp_reward = parseInt(e.target.value) || 0;

    el.querySelector('#add-sec-btn').onclick = () => {
        addSection(el.querySelector('#section-type-select').value);
    };

    // Preview Logic
    el.querySelector('#preview-module-btn').onclick = () => {
        const rawMd = generateMarkdownPreview(moduleData.sections);
        const htmlContent = parseMarkdown(rawMd);
        
        const overlay = window._metis.openModal(`
            <button class="modal-close" id="preview-close">✕</button>
            <div style="margin-bottom:24px;">
                <div style="display:inline-block;padding:2px 8px;border-radius:12px;background:#e2e8f0;color:#475569;font-size:11px;font-weight:700;margin-bottom:8px;">PREVIEW</div>
                <h2 style="margin-bottom:4px;font-size:17px">${moduleData.title || 'Untitled Module'}</h2>
                <div class="text-sm text-secondary">⏱ ${moduleData.duration || 0} min · ${moduleData.xp_reward || 0} pts</div>
            </div>
            
            <div style="font-size:14px;line-height:1.7;max-height:55vh;overflow-y:auto;padding-right:8px;padding-bottom:16px;">
                ${htmlContent || '<p class="text-secondary" style="text-align:center;padding:40px;">Add some sections to see the preview!</p>'}
            </div>
            
            <div style="margin-top:20px;display:flex;justify-content:flex-end;">
                <button id="preview-done-btn" class="btn btn-primary">Done</button>
            </div>
        `);

        const closePreview = () => overlay.remove();
        overlay.querySelector('#preview-close').onclick = closePreview;
        overlay.querySelector('#preview-done-btn').onclick = closePreview;
    };

    el.querySelector('#save-module-btn').onclick = async () => {
        if (!moduleData.title) {
            window._metis.toast("Please enter a module title", "error");
            return;
        }

        const cleanData = {
            title: moduleData.title,
            duration: moduleData.duration,
            xp_reward: moduleData.xp_reward,
            sections: moduleData.sections.map(s => ({
                ...s,
                points: s.type === 'key_points' ? s.points.filter(p => p.trim() !== '') : []
            }))
        };

        try {
            const saveBtn = el.querySelector('#save-module-btn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            await api.post(`/admin/learnings/${learningId}/modules/build`, cleanData);
            
            window._metis.toast("Module successfully added!", "success");
            window._metis.navigate('/admin');
        } catch (e) {
            window._metis.toast(e.message || "Error saving module", "error");
            el.querySelector('#save-module-btn').disabled = false;
            el.querySelector('#save-module-btn').textContent = 'Save & Publish';
        }
    };

    drawSections();
}
