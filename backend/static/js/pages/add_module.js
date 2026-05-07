import { api } from '../api.js';

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export async function render(el) {
    const urlParams = new URLSearchParams(window.location.hash.includes('?')
        ? window.location.hash.split('?')[1]
        : window.location.search
    );
    const learningId = urlParams.get('learning_id');

    if (!learningId) {
        el.innerHTML = `<div class="empty-state">Error: No Learning ID provided in URL. Cannot add module.</div>`;
        return;
    }

    let moduleData = { title: '', duration: 10, xp_reward: 50 };

    el.innerHTML = `
        <link href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css" rel="stylesheet">
        <style>
            #split-panels {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                align-items: start;
            }
            .split-panel {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .split-panel-label {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                color: #64748b;
            }
            #editor-wrapper {
                border: 1px solid var(--border);
                border-radius: 8px;
                overflow: hidden;
                background: #fff;
            }
            #editor-container {
                height: 480px;
            }
            #html-output {
                height: 544px; /* matches toolbar (~42px) + editor (480px) + border (2px) */
                margin: 0;
                padding: 14px;
                font-family: 'Courier New', Courier, monospace;
                font-size: 12px;
                line-height: 1.6;
                background: #0f172a;
                color: #94a3b8;
                border: 1px solid #1e293b;
                border-radius: 8px;
                overflow-y: auto;
                white-space: pre-wrap;
                word-break: break-word;
                box-sizing: border-box;
            }
        </style>

        <div style="max-width:1300px; margin:0 auto; padding-bottom:60px;">
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

            <div id="split-panels">
                <div class="split-panel">
                    <span class="split-panel-label">Editor</span>
                    <div id="editor-wrapper">
                        <div id="editor-container"></div>
                    </div>
                </div>
                <div class="split-panel">
                    <span class="split-panel-label">HTML Output</span>
                    <pre id="html-output"></pre>
                </div>
            </div>
        </div>
    `;

    await loadScript('https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js');

    const quill = new window.Quill(el.querySelector('#editor-container'), {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ color: [] }, { background: [] }],
                [{ script: 'sub' }, { script: 'super' }],
                [{ header: [1, 2, 3, 4, 5, 6, false] }],
                ['blockquote', 'code-block'],
                [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
                [{ indent: '-1' }, { indent: '+1' }],
                [{ align: [] }],
                [{ direction: 'rtl' }],
                ['link', 'image', 'video'],
                ['clean']
            ]
        }
    });

    const htmlOutput = el.querySelector('#html-output');

    quill.on('text-change', () => {
        htmlOutput.textContent = quill.getSemanticHTML();
    });

    el.querySelector('#mod-title').oninput = (e) => moduleData.title = e.target.value;
    el.querySelector('#mod-dur').oninput = (e) => moduleData.duration = parseInt(e.target.value) || 0;
    el.querySelector('#mod-xp').oninput = (e) => moduleData.xp_reward = parseInt(e.target.value) || 0;

    el.querySelector('#preview-module-btn').onclick = () => {
        const htmlContent = quill.getSemanticHTML();
        const overlay = window._metis.openModal(`
            <button class="modal-close" id="preview-close" style="position:absolute;right:16px;top:16px;border:none;background:none;cursor:pointer;font-size:18px;">✕</button>
            <div style="margin-bottom:24px;">
                <div style="display:inline-block;padding:2px 8px;border-radius:12px;background:#e2e8f0;color:#475569;font-size:11px;font-weight:700;margin-bottom:8px;">PREVIEW</div>
                <h2 style="margin-bottom:4px;font-size:24px">${moduleData.title || 'Untitled Module'}</h2>
                <div style="color:#64748b;font-size:13px;">⏱ ${moduleData.duration || 0} min · ${moduleData.xp_reward || 0} pts</div>
            </div>
            <div class="ql-snow" style="border:none;">
                <div class="ql-editor" style="padding:0;min-height:auto;max-height:55vh;overflow-y:auto;line-height:1.7;">
                    ${htmlContent || '<p style="color:#64748b;text-align:center;padding:40px;">Write some content to see the preview!</p>'}
                </div>
            </div>
            <div style="margin-top:20px;display:flex;justify-content:flex-end;">
                <button id="preview-done-btn" class="btn btn-primary" style="padding:8px 16px;background:#0f172a;color:#fff;border:none;border-radius:6px;cursor:pointer;">Done</button>
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
            html_content: quill.getSemanticHTML()
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
}
