import { api } from '../api.js';

// Helper function to dynamically load scripts if they aren't already loaded in your SPA
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
    // --- 1. Dynamic URL Parsing ---
    const urlParams = new URLSearchParams(window.location.hash.includes('?') 
        ? window.location.hash.split('?')[1] 
        : window.location.search
    );
    const learningId = urlParams.get('learning_id');

    if (!learningId) {
        el.innerHTML = `<div class="empty-state">Error: No Learning ID provided in URL. Cannot add module.</div>`;
        return;
    }

    // --- 2. State Management ---
    let moduleData = {
        title: '',
        duration: 10,
        xp_reward: 50
    };

    // --- 3. Initial Layout Render ---
    // We include the Quill CSS directly in the injected HTML
    el.innerHTML = `
        <link href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css" rel="stylesheet">
        
        <div style="max-width:800px; margin:0 auto; padding-bottom:60px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                <div>
                    <h1 style="font-size:24px;margin-bottom:4px">Module Builder (Rich Text)</h1>
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

            <!-- Quill Editor Container -->
            <div style="background: #fff; border-radius: 8px; margin-bottom: 24px;">
                <label style="font-size:14px;font-weight:600;margin-bottom:8px;display:block;padding:0 4px;">Module Content</label>
                <div id="editor-container" style="height: 400px; border-radius: 0 0 8px 8px;"></div>
            </div>
        </div>
    `;

    // --- 4. Initialize Quill ---
    // Ensure the script is loaded before trying to initialize Quill
    await loadScript('https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js');

    const quill = new Quill(el.querySelector('#editor-container'), {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'font': [] }, { 'size': [] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'header': '1' }, { 'header': '2' }, 'blockquote', 'code-block'],
                [{ 'list': 'ordered' }, { 'list': 'bullet'}],
                ['link', 'image', 'video'],
                ['clean']
            ]
        }
    });

    // --- 5. Event Listeners & Logic ---
    
    // Update State
    el.querySelector('#mod-title').oninput = (e) => moduleData.title = e.target.value;
    el.querySelector('#mod-dur').oninput = (e) => moduleData.duration = parseInt(e.target.value) || 0;
    el.querySelector('#mod-xp').oninput = (e) => moduleData.xp_reward = parseInt(e.target.value) || 0;

    // Preview Logic using your _metis.openModal system
    el.querySelector('#preview-module-btn').onclick = () => {
        const htmlContent = quill.getSemanticHTML();
        
        const overlay = window._metis.openModal(`
            <button class="modal-close" id="preview-close" style="position:absolute; right:16px; top:16px; border:none; background:none; cursor:pointer; font-size:18px;">✕</button>
            <div style="margin-bottom:24px;">
                <div style="display:inline-block;padding:2px 8px;border-radius:12px;background:#e2e8f0;color:#475569;font-size:11px;font-weight:700;margin-bottom:8px;">PREVIEW</div>
                <h2 style="margin-bottom:4px;font-size:24px">${moduleData.title || 'Untitled Module'}</h2>
                <div class="text-sm text-secondary" style="color:#64748b;">⏱ ${moduleData.duration || 0} min · ${moduleData.xp_reward || 0} pts</div>
            </div>
            
            <!-- We apply the ql-editor class here so standard Quill CSS applies to the preview elements -->
            <div class="ql-snow" style="border: none;">
                <div class="ql-editor" style="padding: 0; min-height: auto; max-height:55vh; overflow-y:auto; line-height:1.7;">
                    ${htmlContent || '<p style="color:#64748b;text-align:center;padding:40px;">Write some content to see the preview!</p>'}
                </div>
            </div>
            
            <div style="margin-top:20px;display:flex;justify-content:flex-end;">
                <button id="preview-done-btn" class="btn btn-primary" style="padding:8px 16px; background:#0f172a; color:#fff; border:none; border-radius:6px; cursor:pointer;">Done</button>
            </div>
        `);

        const closePreview = () => overlay.remove();
        overlay.querySelector('#preview-close').onclick = closePreview;
        overlay.querySelector('#preview-done-btn').onclick = closePreview;
    };

    // Save Logic
    el.querySelector('#save-module-btn').onclick = async () => {
        if (!moduleData.title) {
            window._metis.toast("Please enter a module title", "error");
            return;
        }

        // Gather HTML content directly from Quill
        const htmlContent = quill.getSemanticHTML();

        const cleanData = {
            title: moduleData.title,
            duration: moduleData.duration,
            xp_reward: moduleData.xp_reward,
            html_content: htmlContent // Sending the raw HTML string directly to the backend
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
