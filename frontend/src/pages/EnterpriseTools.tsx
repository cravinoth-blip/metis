import { useState } from 'react'

interface EnterpriseTool {
  id: string
  name: string
  vendor: string
  category: string
  description: string
  useCases: string[]
  compliance: string[]
  url: string
  status: 'active' | 'pending' | 'restricted'
  users: number
  emoji: string
}

const TOOLS: EnterpriseTool[] = [
  {
    id: 'chatgpt-enterprise',
    name: 'ChatGPT Enterprise',
    vendor: 'OpenAI',
    category: 'AI Writing',
    description: 'Enterprise-grade conversational AI with no training on your data. GDPR-compliant through DPA with OpenAI.',
    useCases: ['Document drafting', 'Text summarisation', 'Code assistance', 'Q&A'],
    compliance: ['GDPR', 'SOC 2 Type II', 'DPA signed'],
    url: 'https://chatgpt.com',
    status: 'active',
    users: 847,
    emoji: '🤖',
  },
  {
    id: 'microsoft-copilot',
    name: 'Microsoft Copilot (M365)',
    vendor: 'Microsoft',
    category: 'Productivity',
    description: 'AI integrated into Word, Excel, PowerPoint, Outlook and Teams. Accesses your M365 content securely.',
    useCases: ['Email drafting', 'Document summarisation', 'Meeting notes', 'Data analysis in Excel'],
    compliance: ['GDPR', 'ISO 27001', 'HIPAA eligible'],
    url: 'https://copilot.microsoft.com',
    status: 'active',
    users: 1203,
    emoji: '📎',
  },
  {
    id: 'grammarly-business',
    name: 'QC RAG',
    vendor: 'Grammarly',
    category: 'Writing Quality',
    description: 'AI-powered writing assistant for grammar, style, tone, and clarity. Integrates with Word, Outlook, Chrome.',
    useCases: ['Grammar checking', 'Tone adjustment', 'Clarity improvements', 'Style guide compliance'],
    compliance: ['GDPR', 'SOC 2 Type II', 'Privacy policy reviewed'],
    url: 'https://grammarly.com',
    status: 'active',
    users: 622,
    emoji: '✏️',
  },
  {
    id: 'greenlight',
    name: 'Green Light',
    vendor: 'Syneos Health',
    category: 'Writing Quality',
    description: 'Claim substantiation platform for medical and promotional content. Links every written claim directly to supporting evidence, flags unsubstantiated statements, and generates a substantiation dossier for regulatory review.',
    useCases: ['Claim substantiation', 'Evidence linking', 'Promotional review', 'MLR submission prep'],
    compliance: ['GDPR', 'Internal audit trail', '21 CFR Part 11 eligible'],
    url: '#',
    status: 'active',
    users: 310,
    emoji: '🟢',
  },
  {
    id: 'eris',
    name: 'ERIS',
    vendor: 'Syneos Health',
    category: 'Writing Quality',
    description: 'Evidence and Reference Information System. Centralised repository for managing references, annotations, and source documents across medical writing projects. Ensures citation accuracy and consistency in regulatory submissions.',
    useCases: ['Reference management', 'Citation verification', 'Source document linking', 'Cross-document consistency'],
    compliance: ['GDPR', 'GCP-compliant audit log', 'Role-based access control'],
    url: '#',
    status: 'active',
    users: 275,
    emoji: '📑',
  },
  {
    id: 'elicit',
    name: 'Elicit',
    vendor: 'Ought',
    category: 'Literature Review',
    description: 'AI research assistant for systematic literature reviews. Extracts PICO data, summarises papers, supports SLR workflows.',
    useCases: ['Abstract screening', 'Data extraction', 'Evidence synthesis', 'PICO analysis'],
    compliance: ['GDPR', 'No PII input policy', 'Terms reviewed'],
    url: 'https://elicit.com',
    status: 'active',
    users: 189,
    emoji: '🔬',
  },
  {
    id: 'consensus',
    name: 'Consensus',
    vendor: 'Consensus NLP',
    category: 'Literature Review',
    description: 'Search peer-reviewed scientific literature and get an evidence consensus meter showing what the science says.',
    useCases: ['Evidence queries', 'Literature search', 'Claim verification', 'HTA research'],
    compliance: ['GDPR', 'No personal data required'],
    url: 'https://consensus.app',
    status: 'active',
    users: 145,
    emoji: '📊',
  },
  {
    id: 'biorender',
    name: 'BioRender',
    vendor: 'BioRender',
    category: 'Scientific Visuals',
    description: 'Create publication-ready scientific figures. Includes thousands of pre-licensed biological illustration assets.',
    useCases: ['MOA diagrams', 'Cell biology figures', 'Study design visuals', 'Patient pathway diagrams'],
    compliance: ['Publication licence included', 'Icon library licensed'],
    url: 'https://biorender.com',
    status: 'active',
    users: 234,
    emoji: '🎨',
  },
  {
    id: 'deepl-pro',
    name: 'DeepL Pro',
    vendor: 'DeepL',
    category: 'Translation',
    description: 'AI translation for 29+ languages with superior quality for scientific and technical texts. No training on business data.',
    useCases: ['Document translation', 'Patient materials', 'Regulatory submissions', 'Labels and IFU'],
    compliance: ['GDPR', 'Data deletion guarantee', 'ISO 27001'],
    url: 'https://deepl.com',
    status: 'active',
    users: 412,
    emoji: '🌍',
  },
  {
    id: 'otter-ai',
    name: 'Otter.ai Business',
    vendor: 'Otter.ai',
    category: 'Meeting Intelligence',
    description: 'AI transcription and meeting notes. Auto-identifies speakers, generates action items, integrates with Zoom and Teams.',
    useCases: ['Meeting transcription', 'Action item extraction', 'Advisory board notes', 'KOL interview notes'],
    compliance: ['GDPR', 'SSO supported', 'Terms reviewed'],
    url: 'https://otter.ai',
    status: 'active',
    users: 318,
    emoji: '🎙️',
  },
  {
    id: 'perplexity-pro',
    name: 'Perplexity Pro',
    vendor: 'Perplexity AI',
    category: 'Research',
    description: 'Real-time web search with cited sources. Ideal for current events, guideline updates, competitive intelligence.',
    useCases: ['Current guidelines', 'Competitive landscape', 'News monitoring', 'Quick fact-checking with sources'],
    compliance: ['Privacy reviewed', 'External tool - no PII'],
    url: 'https://perplexity.ai',
    status: 'pending',
    users: 0,
    emoji: '🔍',
  },
  {
    id: 'notebooklm',
    name: 'NotebookLM (Google)',
    vendor: 'Google',
    category: 'Document Q&A',
    description: 'Upload documents and create an AI assistant that answers only from your sources, with citations.',
    useCases: ['CSR analysis', 'Policy Q&A', 'Literature analysis', 'Protocol review'],
    compliance: ['GDPR pending review', 'Do not upload PII'],
    url: 'https://notebooklm.google.com',
    status: 'pending',
    users: 0,
    emoji: '📓',
  },
]

const STATS = {
  licensed: TOOLS.filter((t) => t.status === 'active').length,
  pending: TOOLS.filter((t) => t.status === 'pending').length,
  totalUsers: TOOLS.reduce((sum, t) => sum + t.users, 0),
  gdprCompliant: TOOLS.filter((t) => t.compliance.includes('GDPR')).length,
}

export default function EnterpriseTools() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const categories = ['All', ...Array.from(new Set(TOOLS.map((t) => t.category)))]

  const filtered = TOOLS.filter((tool) => {
    const matchSearch =
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase()) ||
      tool.vendor.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'All' || tool.category === categoryFilter
    return matchSearch && matchCat
  })

  const grouped = filtered.reduce<Record<string, EnterpriseTool[]>>((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = []
    acc[tool.category].push(tool)
    return acc
  }, {})

  return (
    <div className="fade-in" style={{ maxWidth: 1100 }}>
      {/* Stats strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          { emoji: '✅', label: 'Licensed & Active', value: STATS.licensed, color: 'var(--sage)' },
          { emoji: '⏳', label: 'Pending Approval', value: STATS.pending, color: 'var(--gold)' },
          { emoji: '👥', label: 'Active Users', value: STATS.totalUsers.toLocaleString(), color: 'var(--terra)' },
          { emoji: '🛡️', label: 'GDPR Verified', value: STATS.gdprCompliant, color: '#7a6aaa' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card"
            style={{ padding: '16px 20px', borderTop: `3px solid ${stat.color}` }}
          >
            <div style={{ fontSize: 22, marginBottom: 6 }}>{stat.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Inter', sans-serif", color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search tools, vendors, use cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-pill ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tool groups */}
      {Object.entries(grouped).map(([category, tools]) => (
        <div key={category} style={{ marginBottom: 32 }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-mid)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 14,
              borderBottom: '1px solid var(--border)',
              paddingBottom: 8,
            }}
          >
            {category}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="card"
                style={{
                  padding: 20,
                  opacity: tool.status === 'pending' ? 0.85 : 1,
                  borderLeft: `4px solid ${tool.status === 'active' ? 'var(--sage)' : tool.status === 'pending' ? 'var(--gold)' : 'var(--rose)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 28 }}>{tool.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700 }}>{tool.name}</h4>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: tool.status === 'active' ? 'var(--sage-pale)' : 'var(--gold-pale)',
                          color: tool.status === 'active' ? 'var(--sage)' : 'var(--gold)',
                        }}
                      >
                        {tool.status === 'active' ? '● ACTIVE' : '○ PENDING'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{tool.vendor}</div>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.5, marginBottom: 12 }}>
                  {tool.description}
                </p>

                {/* Use cases */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {tool.useCases.map((uc) => (
                    <span key={uc} className="tag" style={{ fontSize: 11 }}>{uc}</span>
                  ))}
                </div>

                {/* Compliance */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {tool.compliance.map((c) => (
                    <span
                      key={c}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: 'var(--sage-pale)',
                        color: 'var(--sage)',
                        border: '1px solid var(--sage-light)',
                      }}
                    >
                      🛡️ {c}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                  {tool.users > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                      👥 {tool.users} users
                    </span>
                  )}
                  {tool.status === 'active' ? (
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ textDecoration: 'none' }}
                    >
                      Open Tool →
                    </a>
                  ) : (
                    <button className="btn btn-ghost btn-sm">Request Access</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No tools found</h3>
          <p>Try different search terms or categories</p>
        </div>
      )}
    </div>
  )
}
