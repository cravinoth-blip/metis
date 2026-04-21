import { useState } from 'react'
import { useToast } from '../App'
import { useAuth } from '../App'
import api from '../lib/api'

interface AITool {
  id: string
  name: string
  category: string
  description: string
  tags: string[]
  url: string
  userCount: number
  emoji: string
  warning?: string
  free: boolean
}

const AI_TOOLS: AITool[] = [
  {
    id: 'chatgpt-4o',
    name: 'ChatGPT (GPT-4o)',
    category: 'Language Models',
    description: 'OpenAI\'s flagship model. Excellent for writing, analysis, code, and multimodal tasks (text + images).',
    tags: ['Writing', 'Analysis', 'Code', 'Images'],
    url: 'https://chatgpt.com',
    userCount: 412,
    emoji: '💬',
    free: false,
  },
  {
    id: 'claude-sonnet',
    name: 'Claude (Anthropic)',
    category: 'Language Models',
    description: 'Anthropic\'s Claude - known for long document analysis (200K context), safety, and nuanced writing.',
    tags: ['Long documents', 'Analysis', 'Writing', 'Safety-focused'],
    url: 'https://claude.ai',
    userCount: 289,
    emoji: '🤖',
    free: false,
    warning: 'External tool - do not paste PII or confidential client data',
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    category: 'Language Models',
    description: 'Google\'s multimodal AI. Integrated with Google Workspace. Strong at search-grounded responses.',
    tags: ['Writing', 'Google integration', 'Multimodal'],
    url: 'https://gemini.google.com',
    userCount: 198,
    emoji: '♊',
    free: true,
    warning: 'Use enterprise version only - do not use personal Gmail account',
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    category: 'Research & Search',
    description: 'AI-powered search with real-time web citations. Best for current guidelines, news, and cited research.',
    tags: ['Search', 'Citations', 'Current events', 'Research'],
    url: 'https://perplexity.ai',
    userCount: 156,
    emoji: '🔍',
    free: true,
  },
  {
    id: 'elicit',
    name: 'Elicit',
    category: 'Research & Search',
    description: 'AI research assistant for systematic reviews. Extracts PICO data automatically from papers.',
    tags: ['SLR', 'Literature review', 'Evidence synthesis', 'PICO'],
    url: 'https://elicit.com',
    userCount: 134,
    emoji: '🔬',
    free: false,
  },
  {
    id: 'consensus',
    name: 'Consensus',
    category: 'Research & Search',
    description: 'Scientific search engine with evidence consensus meter. Shows what the science says on a topic.',
    tags: ['Evidence', 'Literature', 'Medical claims', 'HTA'],
    url: 'https://consensus.app',
    userCount: 112,
    emoji: '⚖️',
    free: true,
  },
  {
    id: 'notebooklm',
    name: 'NotebookLM',
    category: 'Document Analysis',
    description: 'Upload your documents and ask questions. AI answers from your sources only, with citations.',
    tags: ['Document Q&A', 'Citations', 'Analysis', 'Summarisation'],
    url: 'https://notebooklm.google.com',
    userCount: 87,
    emoji: '📓',
    free: true,
    warning: 'Do not upload PII or confidential data - use anonymised versions only',
  },
  {
    id: 'gamma',
    name: 'Gamma',
    category: 'Presentations',
    description: 'AI presentation and document builder. Generate beautiful slide decks from an outline or prompt.',
    tags: ['Presentations', 'Slides', 'Documents', 'Design'],
    url: 'https://gamma.app',
    userCount: 203,
    emoji: '🎭',
    free: true,
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    category: 'Image Generation',
    description: 'AI image generation via Discord. Excellent for creative concepts, visual ideation, and campaign visuals.',
    tags: ['Images', 'Creative', 'Concepts', 'Visual design'],
    url: 'https://midjourney.com',
    userCount: 167,
    emoji: '🎨',
    free: false,
    warning: 'NOT for scientific/clinical figures. Requires Pro licence for commercial use. Review output for accuracy.',
  },
  {
    id: 'dalle3',
    name: 'DALL-E 3',
    category: 'Image Generation',
    description: 'OpenAI\'s image generator, integrated in ChatGPT Plus. Best for conceptual illustrations.',
    tags: ['Images', 'Illustrations', 'Concepts'],
    url: 'https://chatgpt.com',
    userCount: 143,
    emoji: '🖼️',
    free: false,
    warning: 'NOT for regulatory figures or molecular structures - use ChemDraw/BioRender for scientific accuracy',
  },
  {
    id: 'deepl',
    name: 'DeepL',
    category: 'Translation',
    description: 'Superior AI translation for 29+ languages. GDPR-compliant with data deletion guarantee.',
    tags: ['Translation', 'Languages', 'Documents', 'GDPR'],
    url: 'https://deepl.com',
    userCount: 289,
    emoji: '🌍',
    free: true,
  },
  {
    id: 'otter',
    name: 'Otter.ai',
    category: 'Transcription',
    description: 'AI meeting transcription with speaker identification and action item extraction.',
    tags: ['Transcription', 'Meetings', 'Action items', 'Teams/Zoom'],
    url: 'https://otter.ai',
    userCount: 218,
    emoji: '🎙️',
    free: false,
    warning: 'Only record meetings where all participants have consented. Follow local recording laws.',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    category: 'Development',
    description: 'AI code completion and generation. Supports 30+ languages. Integrated in VS Code and JetBrains.',
    tags: ['Code', 'Programming', 'VS Code', 'Automation'],
    url: 'https://github.com/features/copilot',
    userCount: 89,
    emoji: '💻',
    free: false,
  },
]

const CATEGORIES = ['All', ...Array.from(new Set(AI_TOOLS.map((t) => t.category)))]

export default function AITools() {
  const { showToast } = useToast()
  const { refreshUser } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loggingTool, setLoggingTool] = useState<string | null>(null)

  const filtered = AI_TOOLS.filter((tool) => {
    const matchSearch =
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase()) ||
      tool.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchCat = category === 'All' || tool.category === category
    return matchSearch && matchCat
  })

  const handleLogUsage = async (toolId: string, toolName: string) => {
    setLoggingTool(toolId)
    try {
      const res = await api.post('/users/me/tool-usage', { tool_name: toolName })
      showToast(`${res.data.message}`, 'success')
      await refreshUser()
    } catch {
      showToast('Failed to log usage', 'error')
    } finally {
      setLoggingTool(null)
    }
  }

  const grouped = filtered.reduce<Record<string, AITool[]>>((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = []
    acc[tool.category].push(tool)
    return acc
  }, {})

  return (
    <div className="fade-in" style={{ maxWidth: 1100 }}>
      {/* Warning banner */}
      <div
        style={{
          background: 'var(--rose-pale)',
          border: '1px solid #f0c0c0',
          borderLeft: '4px solid var(--rose)',
          borderRadius: 'var(--radius)',
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 22 }}>⚠️</span>
        <div>
          <span style={{ fontWeight: 700, color: 'var(--rose)' }}>Data Security Reminder: </span>
          <span style={{ color: 'var(--text-mid)', fontSize: 14 }}>
            DO NOT input identifiable patient data, unpublished client data, or commercially sensitive information into external AI tools. Always anonymise data first. See the AI Acceptable Use Policy for full guidelines.
          </span>
        </div>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search AI tools, use cases, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-pill ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tool groups */}
      {Object.entries(grouped).map(([cat, tools]) => (
        <div key={cat} style={{ marginBottom: 32 }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-mid)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: 14,
              borderBottom: '1px solid var(--border)',
              paddingBottom: 8,
            }}
          >
            {cat}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
            {tools.map((tool) => (
              <div key={tool.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 28 }}>{tool.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700 }}>{tool.name}</h4>
                      {tool.free && (
                        <span style={{ fontSize: 10, background: 'var(--sage-pale)', color: 'var(--sage)', fontWeight: 700, padding: '2px 6px', borderRadius: 99 }}>
                          FREE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{tool.category}</div>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.5, marginBottom: 10, flex: 1 }}>
                  {tool.description}
                </p>

                {tool.warning && (
                  <div
                    style={{
                      background: 'var(--gold-pale)',
                      border: '1px solid #e8d080',
                      borderRadius: 6,
                      padding: '8px 10px',
                      fontSize: 11,
                      color: 'var(--bark-mid)',
                      marginBottom: 10,
                      lineHeight: 1.4,
                    }}
                  >
                    ⚠️ {tool.warning}
                  </div>
                )}

                {/* Tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {tool.tags.map((tag) => (
                    <span key={tag} className="tag" style={{ fontSize: 11 }}>{tag}</span>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                    👥 {tool.userCount} users
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ textDecoration: 'none' }}
                    >
                      Open →
                    </a>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleLogUsage(tool.id, tool.name)}
                      disabled={loggingTool === tool.id}
                      title="+10 XP for logging tool usage"
                    >
                      {loggingTool === tool.id ? (
                        <span className="loading-spinner" style={{ width: 14, height: 14 }} />
                      ) : (
                        'Log Usage ⚡'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🛠️</div>
          <h3>No tools found</h3>
          <p>Try different search terms</p>
        </div>
      )}
    </div>
  )
}
