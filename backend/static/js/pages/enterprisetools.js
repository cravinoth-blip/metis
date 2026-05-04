const TOOLS = [
  { icon: '💬', name: 'ChatGPT Enterprise', vendor: 'OpenAI', desc: 'Secure GPT-4 with company data controls and audit logs.', tags: ['Writing', 'Analysis', 'Code'] },
  { icon: '🔵', name: 'Microsoft Copilot', vendor: 'Microsoft', desc: 'AI integrated across Microsoft 365 apps.', tags: ['Productivity', 'Office'] },
  { icon: '✍️', name: 'Grammarly Business', vendor: 'Grammarly', desc: 'AI writing assistant with brand-tone enforcement.', tags: ['Writing'] },
  { icon: '🔍', name: 'Bing Enterprise', vendor: 'Microsoft', desc: 'Private web search powered by GPT-4.', tags: ['Research'] },
  { icon: '🎨', name: 'Adobe Firefly', vendor: 'Adobe', desc: 'Generative AI for creative assets inside Creative Cloud.', tags: ['Design', 'Creative'] },
  { icon: '📊', name: 'Tableau AI', vendor: 'Salesforce', desc: 'Natural-language queries over your data warehouse.', tags: ['Analytics', 'Data'] },
  { icon: '🤝', name: 'Salesforce Einstein', vendor: 'Salesforce', desc: 'CRM AI for predictions and automation.', tags: ['Sales', 'CRM'] },
  { icon: '💻', name: 'GitHub Copilot Enterprise', vendor: 'GitHub', desc: 'Code completion and chat trained on your repos.', tags: ['Code', 'Dev'] },
  { icon: '🔒', name: 'Nightfall DLP', vendor: 'Nightfall', desc: 'Data-loss prevention for AI outputs.', tags: ['Security'] },
  { icon: '📋', name: 'Notion AI', vendor: 'Notion', desc: 'AI writing and summarisation inside Notion workspaces.', tags: ['Productivity', 'Writing'] },
  { icon: '🧠', name: 'Glean', vendor: 'Glean', desc: 'Enterprise search across all connected SaaS tools.', tags: ['Search', 'Productivity'] },
  { icon: '📧', name: 'Superhuman AI', vendor: 'Superhuman', desc: 'AI-powered email triage and drafting.', tags: ['Email', 'Productivity'] },
];

export function render(el) {
  el.innerHTML = `
    <p class="text-secondary text-sm mb-6">Approved and licensed tools available to all employees. Contact IT for access requests.</p>
    <div class="tools-grid">
      ${TOOLS.map(t => `
        <div class="tool-card">
          <div class="tool-icon">${t.icon}</div>
          <div style="font-weight:600">${t.name}</div>
          <div class="text-sm text-secondary">${t.vendor}</div>
          <div class="text-sm" style="color:var(--text-primary)">${t.desc}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
            ${t.tags.map(tag => `<span class="diff-badge diff-beginner" style="background:#e0e7ff;color:var(--accent)">${tag}</span>`).join('')}
          </div>
        </div>`).join('')}
    </div>
  `;
}
