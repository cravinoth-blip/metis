import { api } from '../api.js';

const FREE_TOOLS = [
  { icon: '💬', name: 'ChatGPT',      url: 'https://chat.openai.com',  desc: 'General-purpose AI by OpenAI.',           xp: 10 },
  { icon: '🟣', name: 'Claude',       url: 'https://claude.ai',         desc: 'Long-context AI by Anthropic.',           xp: 10 },
  { icon: '🔍', name: 'Perplexity',   url: 'https://perplexity.ai',     desc: 'AI-powered research & search.',           xp: 10 },
  { icon: '🌊', name: 'Mistral',      url: 'https://mistral.ai',        desc: 'Open-weight European AI models.',         xp: 10 },
  { icon: '🦙', name: 'Meta AI',      url: 'https://meta.ai',           desc: 'Llama-powered assistant by Meta.',        xp: 10 },
  { icon: '🎨', name: 'DALL·E',       url: 'https://labs.openai.com',   desc: 'AI image generation by OpenAI.',         xp: 10 },
  { icon: '🖼️', name: 'Midjourney',   url: 'https://midjourney.com',    desc: 'High-quality AI art generation.',        xp: 10 },
  { icon: '🔊', name: 'ElevenLabs',   url: 'https://elevenlabs.io',     desc: 'Realistic AI voice synthesis.',          xp: 10 },
  { icon: '🧪', name: 'Gemini',       url: 'https://gemini.google.com', desc: 'Google\'s multimodal AI assistant.',     xp: 10 },
  { icon: '💻', name: 'GitHub Copilot',url:'https://github.com/features/copilot', desc: 'AI pair-programmer.',          xp: 10 },
];

export async function render(el) {
  const used = new Set(JSON.parse(localStorage.getItem('metis_used_tools') || '[]'));

  el.innerHTML = `
    <p class="text-secondary text-sm mb-6">Log your use of AI tools to earn XP and track adoption across the organisation.</p>
    <div class="tools-grid" id="tools-grid"></div>
  `;

  function draw() {
    document.getElementById('tools-grid').innerHTML = FREE_TOOLS.map(t => `
      <div class="tool-card">
        <div class="tool-icon">${t.icon}</div>
        <div style="font-weight:600">${t.name}</div>
        <div class="text-sm" style="color:var(--text-primary);margin-bottom:8px">${t.desc}</div>
        <div style="margin-top:auto;display:flex;gap:8px;flex-wrap:wrap">
          <a href="${t.url}" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration:none">Open →</a>
          <button class="btn btn-sm ${used.has(t.name) ? 'btn-success' : 'btn-primary'} log-btn"
                  data-name="${t.name}" ${used.has(t.name) ? 'disabled' : ''}>
            ${used.has(t.name) ? `✓ +${t.xp} XP` : `Log use (+${t.xp} XP)`}
          </button>
        </div>
      </div>`).join('');
  }

  draw();

  document.getElementById('tools-grid').addEventListener('click', async e => {
    const btn = e.target.closest('.log-btn');
    if (!btn || btn.disabled) return;
    const name = btn.dataset.name;
    try {
      await api.post('/users/me/tool-usage', { tool_name: name });
      used.add(name);
      localStorage.setItem('metis_used_tools', JSON.stringify([...used]));
      // Refresh user XP in shell
      const me = await api.get('/auth/me');
      localStorage.setItem('metis_user', JSON.stringify(me));
      window._metis.refreshShell();
      window._metis.toast(`+${FREE_TOOLS.find(t=>t.name===name)?.xp ?? 10} XP for using ${name}!`, 'success');
      draw();
    } catch (err) {
      window._metis.toast(err.message, 'error');
    }
  });
}
