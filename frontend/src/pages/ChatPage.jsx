// ChatInterface.jsx — v2 avec toutes les améliorations UX
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=DM+Sans:opsz,wght@9..40,100;9..40,200;9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900;9..40,1000&display=swap');

  :root {
    --accent: #0066b3;
    --accent-ink: #004f8a;
    --accent2: #f5a623;
    --ink: #141414;
    --ink2: #3a3a3a;
    --ink3: #6b6b6b;
    --ink4: #9a9794;
    --paper: #faf8f3;
    --paper2: #f2efe7;
    --rule: #d9d5cb;
    --rule-soft: #e8e4d9;
    --surface: #ffffff;
    --danger: #b4321f;
    --success: #166534;
    --f-serif: "Playfair Display", "Times New Roman", Georgia, serif;
    --f-sans: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --chat-max-width: 800px;
    --border-radius-sm: 8px;
    --border-radius-md: 12px;
    --border-radius-lg: 16px;
    --transition-fast: 0.12s ease;
    --transition-base: 0.2s ease;
    --transition-slow: 0.3s ease;
    --sidebar-width: 280px;
  }

  [data-theme="dark"] {
    --accent: #4c9fd9;
    --accent-ink: #8ec1e6;
    --ink: #f2efe7;
    --ink2: #cfccc2;
    --ink3: #a19f96;
    --ink4: #6d6b64;
    --paper: #15140f;
    --paper2: #1d1c16;
    --rule: #2b2a22;
    --rule-soft: #24231c;
    --surface: #1a1912;
  }

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slide-in-left {
    from { opacity: 0; transform: translateX(-16px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulse-dot {
    0%, 60%, 100% { transform: scale(0.7); opacity: 0.4; }
    30% { transform: scale(1.1); opacity: 1; }
  }
  @keyframes ctx-pop {
    from { opacity: 0; transform: scale(0.95) translateY(-4px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes action-bar-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--rule); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--ink3); }
  ::selection { background: var(--accent); color: white; }
  body { margin: 0; padding: 0; }

  .conv-item { position: relative; }
  .conv-item:hover .conv-menu-btn { opacity: 1 !important; }

  .ctx-menu {
    position: absolute;
    right: 8px;
    top: calc(100% + 4px);
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: 10px;
    padding: 6px;
    z-index: 100;
    min-width: 160px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    animation: ctx-pop 0.15s ease both;
  }
  .ctx-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    color: var(--ink2);
    font-family: var(--f-sans);
    transition: all 0.1s ease;
    white-space: nowrap;
  }
  .ctx-item:hover { background: var(--paper2); color: var(--ink); }
  .ctx-item.danger:hover { background: #fef2f2; color: var(--danger); }

  .rename-input {
    background: var(--paper2);
    border: 1.5px solid var(--accent);
    border-radius: 6px;
    color: var(--ink);
    font-family: var(--f-sans);
    font-size: 13px;
    padding: 4px 8px;
    outline: none;
    width: 100%;
  }
  .search-input {
    background: var(--paper2);
    border: 1.5px solid var(--rule);
    border-radius: 8px;
    color: var(--ink);
    font-family: var(--f-sans);
    font-size: 13px;
    padding: 8px 12px 8px 34px;
    outline: none;
    width: 100%;
    transition: border-color 0.15s ease;
  }
  .search-input:focus { border-color: var(--accent); }

  .date-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink4);
    padding: 8px 12px 4px;
  }

  /* ── Action bar after AI message ── */
  .action-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
    animation: action-bar-in 0.22s ease both;
  }
  .action-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 11px;
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: 20px;
    font-family: var(--f-sans);
    font-size: 12px;
    font-weight: 500;
    color: var(--ink2);
    cursor: pointer;
    transition: all 0.13s ease;
    white-space: nowrap;
    user-select: none;
  }
  .action-chip:hover {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
    transform: translateY(-1px);
  }
  .action-chip:active { transform: translateY(0); }

  /* ── Suggestion blocks ── */
  .sugg-section { margin-bottom: 16px; }
  .sugg-section-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink4);
    margin-bottom: 6px;
    padding: 0 2px;
    font-family: var(--f-sans);
  }
  .sugg-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .sugg-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px;
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: 22px;
    font-family: var(--f-sans);
    font-size: 12.5px;
    font-weight: 500;
    color: var(--ink2);
    cursor: pointer;
    transition: all 0.13s ease;
    user-select: none;
  }
  .sugg-chip:hover {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
    transform: translateY(-1px);
  }
  .sugg-chip:active { transform: translateY(0); }
  .sugg-emoji {
    font-size: 13px;
    line-height: 1;
    flex-shrink: 0;
  }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const generateId = () => Math.random().toString(36).slice(2);

const formatDateLabel = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  if (diff < 7) return 'Cette semaine';
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

// ── Suggestion groups ──────────────────────────────────────────────────────
const SUGGESTION_GROUPS = [
  {
    title: '🎯 Trouver des bourses',
    items: [
      { emoji: '🎯', text: 'Trouve-moi des bourses adaptées à mon profil' },
      { emoji: '⚡', text: 'Quelles bourses sont encore ouvertes maintenant ?' },
      { emoji: '💰', text: 'Bourses 100% financées pour moi' },
      { emoji: '🌍', text: 'Quelles bourses à l\'étranger me correspondent ?' },
      { emoji: '🇫🇷', text: 'Quelles bourses en France sont accessibles pour moi ?' },
    ],
  },
  {
    title: '📊 Analyse intelligente',
    items: [
      { emoji: '📊', text: 'Quelle est ma probabilité d\'être accepté ?' },
      { emoji: '🔍', text: 'Analyse mon profil et dis-moi mes chances' },
      { emoji: '⚠️', text: 'Qu\'est-ce qui bloque ma candidature ?' },
      { emoji: '🧠', text: 'Quelle stratégie dois-je suivre ?' },
    ],
  },
  {
    title: '🚀 Action rapide',
    items: [
      { emoji: '🚀', text: 'Aide-moi à postuler à une bourse' },
      { emoji: '📝', text: 'Rédige ma lettre de motivation' },
      { emoji: '📄', text: 'Améliore mon CV' },
      { emoji: '🎙️', text: 'Simule un entretien de bourse' },
    ],
  },
  {
    title: '⏰ Urgence',
    items: [
      { emoji: '⏰', text: 'Quelles bourses ferment cette semaine ?' },
      { emoji: '🔥', text: 'Donne-moi les bourses les plus urgentes' },
      { emoji: '📅', text: 'Quelles deadlines approchent ?' },
    ],
  },
  {
    title: '🎓 Explorer par destination',
    items: [
      { emoji: '🎓', text: 'Je veux étudier en Europe' },
      { emoji: '🌎', text: 'Je veux étudier au Canada' },
      { emoji: '🇬🇧', text: 'Je veux étudier au Royaume-Uni' },
      { emoji: '🇩🇪', text: 'Je veux étudier en Allemagne' },
    ],
  },
];

// ── Action chips after AI message ────────────────────────────────────────────
const ACTION_CHIPS = [
  { icon: '📄', label: 'Ajouter à ma roadmap', prompt: 'Ajouter cette bourse à ma roadmap' },
  { icon: '📊', label: 'Analyser cette bourse', prompt: 'Analyse cette bourse en détail' },
  { icon: '⚖️', label: 'Comparer avec une autre', prompt: 'Compare cette bourse avec une autre similaire' },
  { icon: '✉️', label: 'Préparer ma candidature', prompt: 'Aide-moi à préparer ma candidature pour cette bourse' },
];

const DEMO_CONVERSATIONS = [
  {
    id: 'demo1',
    title: 'Bourses pour master en France',
    updatedAt: new Date().toISOString(),
    messages: [
      { id: 'd1a', sender: 'user', text: 'Bourses pour master en France', timestamp: new Date().toISOString() },
      { id: 'd1b', sender: 'ai', text: 'Voici les meilleures bourses pour un master en France…', timestamp: new Date().toISOString(), showActions: true }
    ]
  },
  {
    id: 'demo2',
    title: 'Comment rédiger une lettre de motivation ?',
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    messages: [
      { id: 'd2a', sender: 'user', text: 'Comment rédiger une lettre de motivation ?', timestamp: new Date(Date.now() - 86400000).toISOString() }
    ]
  },
  {
    id: 'demo3',
    title: 'Visa étudiant Erasmus',
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    messages: [
      { id: 'd3a', sender: 'user', text: 'Visa étudiant Erasmus', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() }
    ]
  }
];

const generateAIResponse = (query) => {
  return `Merci pour votre question : **${query}**

## Voici ce que je peux vous proposer

Je suis votre assistant dédié à la recherche de bourses d'études. Voici comment je peux vous aider :

• **Rechercher** des bourses adaptées à votre profil
• **Analyser** votre éligibilité pour différentes opportunités
• **Préparer** vos dossiers de candidature
• **Optimiser** vos chances de réussite

### Bourses recommandées

**Bourse Eiffel**
Pays : France | Niveau : Master, Doctorat
Financement : Jusqu'à 1,181€ par mois

**Bourse Fulbright**
Pays : États-Unis | Niveau : Master, Doctorat
Financement : Frais de scolarité + allocation

**Bourse Erasmus Mundus**
Pays : Europe | Niveau : Master
Financement : Jusqu'à 1,400€ par mois

N'hésitez pas à me donner plus de détails sur votre parcours pour des recommandations personnalisées.`;
};

// ── Context Menu ─────────────────────────────────────────────────────────────
function ContextMenu({ onRename, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div className="ctx-menu" ref={ref}>
      <div className="ctx-item" onClick={onRename}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Renommer
      </div>
      <div className="ctx-item danger" onClick={onDelete}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
        Supprimer
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ conversations, activeId, onSelect, onNew, onRename, onDelete }) {
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef(null);

  useEffect(() => {
    if (renamingId && renameRef.current) renameRef.current.focus();
  }, [renamingId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    return conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
  }, [conversations, search]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(c => {
      const label = formatDateLabel(c.updatedAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(c);
    });
    return groups;
  }, [filtered]);

  const handleRenameSubmit = (id) => {
    if (renameValue.trim()) onRename(id, renameValue.trim());
    setRenamingId(null);
    setRenameValue('');
  };

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      background: 'var(--surface)',
      borderRight: '1px solid var(--rule)',
      display: 'flex',
      flexDirection: 'column',
      // FIX #6: sidebar ne recouvre plus le footer — position sticky dans son flex parent
      position: 'sticky',
      top: 0,
      height: '100vh',
      flexShrink: 0,
      animation: 'slide-in-left 0.25s ease both',
      overflowY: 'hidden',
    }}>
      {/* Logo + New Chat */}
      <div style={{ padding: '22px 18px 16px', borderBottom: '1px solid var(--rule-soft)', flexShrink: 0 }}>
        <h1 style={{
          fontFamily: 'var(--f-serif)',
          fontSize: 22, fontWeight: 700,
          color: 'var(--accent)',
          letterSpacing: '-0.01em',
          marginBottom: 14
        }}>OppsTrack</h1>

        {/* FIX #5: Bouton New Chat dans sidebar */}
        <button
          onClick={onNew}
          style={{
            width: '100%',
            padding: '9px 14px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: 10,
            color: 'white',
            fontFamily: 'var(--f-sans)',
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-ink)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouvelle discussion
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--rule-soft)', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink4)', pointerEvents: 'none' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" />
        </div>
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {Object.keys(grouped).length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--ink4)', textAlign: 'center', marginTop: 24, fontFamily: 'var(--f-sans)' }}>
            Aucune conversation
          </p>
        )}
        {Object.entries(grouped).map(([label, convs]) => (
          <div key={label}>
            <div className="date-label">{label}</div>
            {convs.map(conv => (
              <div
                key={conv.id}
                className="conv-item"
                style={{
                  borderRadius: 8,
                  marginBottom: 2,
                  background: conv.id === activeId ? 'var(--paper2)' : 'transparent',
                  border: conv.id === activeId ? '1px solid var(--rule-soft)' : '1px solid transparent',
                  transition: 'all 0.12s ease'
                }}
                onMouseEnter={e => { if (conv.id !== activeId) e.currentTarget.style.background = 'var(--paper2)'; }}
                onMouseLeave={e => { if (conv.id !== activeId) e.currentTarget.style.background = 'transparent'; }}
              >
                {renamingId === conv.id ? (
                  <div style={{ padding: '8px 10px' }}>
                    <input
                      ref={renameRef}
                      className="rename-input"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameSubmit(conv.id);
                        if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
                      }}
                      onBlur={() => handleRenameSubmit(conv.id)}
                    />
                  </div>
                ) : (
                  <div
                    style={{ display: 'flex', alignItems: 'center', padding: '9px 8px', cursor: 'pointer', gap: 8 }}
                    onClick={() => onSelect(conv.id)}
                  >
                    <svg style={{ flexShrink: 0, color: conv.id === activeId ? 'var(--accent)' : 'var(--ink4)' }}
                      width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: conv.id === activeId ? 600 : 400,
                        color: conv.id === activeId ? 'var(--accent)' : 'var(--ink2)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        fontFamily: 'var(--f-sans)'
                      }}>{conv.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 1, fontFamily: 'var(--f-sans)' }}>
                        {new Date(conv.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      className="conv-menu-btn"
                      style={{
                        background: 'transparent', border: 'none',
                        padding: '3px 4px', borderRadius: 5,
                        cursor: 'pointer', color: 'var(--ink3)',
                        flexShrink: 0,
                        opacity: openMenu === conv.id ? 1 : 0,
                        transition: 'opacity 0.12s ease, background 0.12s ease',
                        display: 'flex', alignItems: 'center'
                      }}
                      onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === conv.id ? null : conv.id); }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--rule-soft)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                      </svg>
                    </button>
                    {openMenu === conv.id && (
                      <ContextMenu
                        onClose={() => setOpenMenu(null)}
                        onRename={() => { setOpenMenu(null); setRenamingId(conv.id); setRenameValue(conv.title); }}
                        onDelete={() => { setOpenMenu(null); onDelete(conv.id); }}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

// ── Action Bar (après chaque message AI) ─────────────────────────────────────
function ActionBar({ onAction }) {
  return (
    <div className="action-bar">
      {ACTION_CHIPS.map((chip, i) => (
        <button
          key={i}
          className="action-chip"
          onClick={() => onAction(chip.prompt)}
          title={chip.label}
        >
          <span style={{ fontSize: 12 }}>{chip.icon}</span>
          {chip.label}
        </button>
      ))}
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ message, isUser, delay = 0, isLast = false, onAction }) {
  const formattedContent = useMemo(() => {
    if (!message.text) return null;
    const lines = message.text.split('\n');
    const elements = [];

    const parseInline = (text) =>
      text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : part
      );

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const t = line.trim();
      if (!t) { elements.push(<div key={`s-${i}`} style={{ height: 8 }} />); continue; }
      if (t.startsWith('## ')) {
        elements.push(<h2 key={i} style={{ fontSize: 17, fontWeight: 700, margin: '16px 0 8px', fontFamily: 'var(--f-serif)', color: 'var(--ink)' }}>{parseInline(t.slice(3))}</h2>);
        continue;
      }
      if (t.startsWith('### ')) {
        elements.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 600, margin: '12px 0 6px', color: 'var(--ink2)' }}>{parseInline(t.slice(4))}</h3>);
        continue;
      }
      if (t.match(/^[-*]\s/)) {
        elements.push(
          <div key={i} style={{ margin: '5px 0 5px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>•</span>
            <span style={{ flex: 1, fontSize: 14, lineHeight: 1.6 }}>{parseInline(t.slice(2))}</span>
          </div>
        );
        continue;
      }
      const bold = t.match(/^\*\*(.+?)\*\*$/);
      if (bold) {
        elements.push(
          <div key={i} style={{ margin: '10px 0 6px', padding: '7px 12px', background: 'var(--paper2)', borderLeft: '3px solid var(--accent)', borderRadius: 7 }}>
            <strong style={{ fontSize: 13 }}>{bold[1]}</strong>
          </div>
        );
        continue;
      }
      elements.push(<p key={i} style={{ margin: '0 0 10px', lineHeight: 1.65, fontSize: 14 }}>{parseInline(line)}</p>);
    }
    return elements;
  }, [message.text]);

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, animation: `fade-up 0.28s ease-out both`, animationDelay: `${delay}s` }}>
        <div style={{
          maxWidth: '72%', background: 'var(--accent)', color: 'white',
          padding: '12px 18px', borderRadius: 18, borderBottomRightRadius: 4,
          fontSize: 14, lineHeight: 1.55, fontFamily: 'var(--f-sans)'
        }}>
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 24, animation: `fade-up 0.28s ease-out both`, animationDelay: `${delay}s` }}>
      {/* Avatar */}
      <div style={{
        width: 38, height: 38,
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-ink) 100%)',
        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>

      <div style={{ flex: 1 }}>
        {/* Bubble */}
        <div style={{
          background: 'var(--paper2)',
          borderRadius: 18, borderTopLeftRadius: 4,
          padding: '12px 18px', color: 'var(--ink)', fontFamily: 'var(--f-sans)'
        }}>
          {formattedContent}
        </div>

        {/* Action bar — uniquement après le dernier message AI ou si showActions */}
        {(isLast || message.showActions) && onAction && (
          <ActionBar onAction={onAction} />
        )}
      </div>
    </div>
  );
}

// ── Suggestion Groups (juste sous l'input) ───────────────────────────────────
function SuggestionGroups({ onSelect }) {
  return (
    <div style={{
      maxHeight: 320,
      overflowY: 'auto',
      padding: '4px 0 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      {SUGGESTION_GROUPS.map((group, gi) => (
        <div key={gi} className="sugg-section">
          <div className="sugg-section-title">{group.title}</div>
          <div className="sugg-grid">
            {group.items.map((item, ii) => (
              <button
                key={ii}
                className="sugg-chip"
                onClick={() => onSelect(item.text)}
              >
                <span className="sugg-emoji">{item.emoji}</span>
                {item.text}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function ChatInterface() {
  const [theme] = useState(() => {
    try { return localStorage.getItem('theme') || 'light'; } catch { return 'light'; }
  });
  const [conversations, setConversations] = useState(() => {
    try {
      const s = localStorage.getItem('opps-conversations');
      return s ? JSON.parse(s) : DEMO_CONVERSATIONS;
    } catch { return DEMO_CONVERSATIONS; }
  });
  const [activeId, setActiveId] = useState(() => conversations[0]?.id || null);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const activeConv = useMemo(() => conversations.find(c => c.id === activeId) || null, [conversations, activeId]);
  const messages = activeConv?.messages || [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    try { localStorage.setItem('opps-conversations', JSON.stringify(conversations)); } catch {}
  }, [conversations]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const h = () => setShowScrollButton(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
    el.addEventListener('scroll', h);
    h();
    return () => el.removeEventListener('scroll', h);
  }, [messages]);

  // FIX #5: handleNew réinitialise tout
  const handleNew = useCallback(() => {
    const id = generateId();
    const conv = {
      id,
      title: 'Nouvelle conversation',
      updatedAt: new Date().toISOString(),
      messages: []
    };
    setConversations(prev => [conv, ...prev]);
    setActiveId(id);
    setInputValue('');
    setShowSuggestions(false);
    // scroll en haut
    if (containerRef.current) containerRef.current.scrollTop = 0;
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSelect = useCallback((id) => {
    setActiveId(id);
    setInputValue('');
    setShowSuggestions(false);
  }, []);

  const handleRename = useCallback((id, title) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
  }, []);

  const handleDelete = useCallback((id) => {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      if (id === activeId) setActiveId(next[0]?.id || null);
      return next;
    });
  }, [activeId]);

  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    setShowSuggestions(false);

    let targetId = activeId;
    if (!targetId) {
      targetId = generateId();
      const conv = { id: targetId, title: text.slice(0, 42), updatedAt: new Date().toISOString(), messages: [] };
      setConversations(prev => [conv, ...prev]);
      setActiveId(targetId);
    }

    const userMsg = { id: generateId(), sender: 'user', text: text.trim(), timestamp: new Date().toISOString() };

    setConversations(prev => prev.map(c => {
      if (c.id !== targetId) return c;
      const msgs = [...c.messages, userMsg];
      return { ...c, messages: msgs, title: c.messages.length === 0 ? text.slice(0, 42) : c.title, updatedAt: new Date().toISOString() };
    }));

    setInputValue('');
    setLoading(true);

    setTimeout(() => {
      const aiMsg = {
        id: generateId(),
        sender: 'ai',
        text: generateAIResponse(text),
        timestamp: new Date().toISOString(),
        showActions: true,  // toujours afficher les actions sur les nouveaux messages AI
      };
      setConversations(prev => prev.map(c =>
        c.id === targetId ? { ...c, messages: [...c.messages, aiMsg], updatedAt: new Date().toISOString() } : c
      ));
      setLoading(false);
    }, 1200);
  }, [loading, activeId]);

  const handleSubmit = (e) => { e.preventDefault(); handleSendMessage(inputValue); };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(inputValue); }
  };

  // Trouver l'index du dernier message AI
  const lastAiIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'ai') return i;
    }
    return -1;
  }, [messages]);

  return (
    <>
      <style>{styles}</style>
      {/*
        FIX #6: Layout principal en flexbox horizontal.
        Le sidebar est sticky dans ce flex container.
        Le footer (rendu par le parent) reste en dessous de ce flex wrapper.
      */}
      <div style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--paper)',
        fontFamily: 'var(--f-sans)',
        overflow: 'hidden',
      }}>

        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onNew={handleNew}
          onRename={handleRename}
          onDelete={handleDelete}
        />

        {/* Zone principale */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          minWidth: 0,
        }}>

          {/* ── Header ── */}
          <header style={{
            padding: '18px 32px 14px',
            borderBottom: '1px solid var(--rule-soft)',
            background: 'var(--paper)',
            flexShrink: 0,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'
          }}>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontFamily: 'var(--f-serif)',
                fontSize: 'clamp(22px, 3vw, 30px)',
                fontWeight: 700,
                letterSpacing: '-0.015em',
                color: 'var(--ink)', marginBottom: 3
              }}>
                {!hasMessages ? 'Bonjour !' : (activeConv?.title || 'Assistant IA')}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--ink3)' }}>
                Posez-moi votre question ci-dessous.
              </p>
            </div>

            {/* FIX #5: Bouton New Chat dans le header aussi */}
            <button
              onClick={handleNew}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1.5px solid var(--rule)',
                borderRadius: 10,
                color: 'var(--ink2)',
                fontFamily: 'var(--f-sans)',
                fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'var(--rule)';
                e.currentTarget.style.color = 'var(--ink2)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nouveau chat
            </button>
          </header>

          {/* ── Messages ── */}
          <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', scrollBehavior: 'smooth' }}>
            <div style={{ maxWidth: 'var(--chat-max-width)', margin: '0 auto', padding: '28px 28px 16px' }}>

              {/* Message d'accueil */}
              {!hasMessages && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', animation: 'fade-up 0.3s ease both' }}>
                  <div style={{
                    width: 38, height: 38,
                    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-ink) 100%)',
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div style={{
                    background: 'var(--paper2)', border: '1px solid var(--rule)',
                    borderRadius: 18, borderTopLeftRadius: 4,
                    padding: '14px 18px', fontSize: 14, lineHeight: 1.6, color: 'var(--ink)'
                  }}>
                    Comment puis-je vous aider aujourd'hui ?
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id || idx}
                  message={msg}
                  isUser={msg.sender === 'user'}
                  delay={idx * 0.025}
                  isLast={idx === lastAiIndex}
                  onAction={msg.sender === 'ai' ? handleSendMessage : null}
                />
              ))}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, animation: 'fade-up 0.25s ease both' }}>
                  <div style={{
                    width: 38, height: 38,
                    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-ink) 100%)',
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <div style={{
                    background: 'var(--paper2)', border: '1px solid var(--rule)',
                    borderRadius: 18, borderTopLeftRadius: 4,
                    padding: '14px 18px', display: 'flex', gap: 6, alignItems: 'center'
                  }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)',
                        animation: 'pulse-dot 1.2s infinite ease-in-out',
                        animationDelay: `${i * 0.2}s`,
                        display: 'inline-block',
                      }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Scroll button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              style={{
                position: 'absolute', bottom: 148, right: 28,
                width: 36, height: 36,
                background: 'var(--surface)', border: '1px solid var(--rule)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                transition: 'all 0.15s ease', zIndex: 15, color: 'var(--ink3)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--rule)'; e.currentTarget.style.color = 'var(--ink3)'; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          )}

          {/* ── Zone input + suggestions ── */}
          {/*
            FIX #4: suggestions JUSTE SOUS l'input (ordre inversé en flex-column)
            FIX #3 & #2: blocs de suggestions groupés avec titres
          */}
          <div style={{
            flexShrink: 0,
            background: 'var(--paper)',
            borderTop: '1px solid var(--rule-soft)',
          }}>
            <div style={{
              maxWidth: 'var(--chat-max-width)',
              margin: '0 auto',
              padding: '12px 24px 18px',
            }}>

              {/* Input */}
              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '2px solid var(--rule)',
                    borderRadius: 16,
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '4px 6px 4px 18px',
                    transition: 'all 0.18s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                  onFocusCapture={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,102,179,0.08)'; }}
                  onBlurCapture={e => { e.currentTarget.style.borderColor = 'var(--rule)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'; }}
                >
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Écrivez votre message…"
                    rows={1}
                    disabled={loading}
                    style={{
                      flex: 1, background: 'transparent', border: 'none',
                      padding: '14px 0', fontFamily: 'var(--f-sans)',
                      fontSize: 14, lineHeight: 1.5, color: 'var(--ink)',
                      resize: 'none', outline: 'none', minHeight: 52, maxHeight: 120
                    }}
                  />

                  {/* Toggle suggestions */}
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(v => !v)}
                    title="Afficher les suggestions"
                    style={{
                      width: 36, height: 36,
                      background: showSuggestions ? 'var(--paper2)' : 'transparent',
                      border: '1px solid var(--rule)',
                      borderRadius: 9,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: showSuggestions ? 'var(--accent)' : 'var(--ink3)',
                      flexShrink: 0,
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--paper2)'}
                    onMouseLeave={e => e.currentTarget.style.background = showSuggestions ? 'var(--paper2)' : 'transparent'}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                    </svg>
                  </button>

                  {/* Send */}
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || loading}
                    style={{
                      width: 42, height: 42,
                      background: !inputValue.trim() || loading ? 'var(--rule)' : 'var(--accent)',
                      border: 'none', borderRadius: 11,
                      cursor: !inputValue.trim() || loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.12s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: !inputValue.trim() || loading ? 0.5 : 1, flexShrink: 0
                    }}
                    onMouseEnter={e => { if (inputValue.trim() && !loading) { e.currentTarget.style.background = 'var(--accent-ink)'; e.currentTarget.style.transform = 'scale(1.04)'; } }}
                    onMouseLeave={e => { if (inputValue.trim() && !loading) { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'scale(1)'; } }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </form>

              {/* FIX #4: suggestions JUSTE SOUS l'input */}
              {showSuggestions && (
                <div style={{ marginTop: 12, animation: 'fade-up 0.2s ease both' }}>
                  <SuggestionGroups onSelect={(text) => {
                    setInputValue(text);
                    setShowSuggestions(false);
                    inputRef.current?.focus();
                  }} />
                </div>
              )}

              <p style={{ fontSize: 11, color: 'var(--ink4)', textAlign: 'center', marginTop: 10, fontFamily: 'var(--f-sans)' }}>
                OppsTrack peut faire des erreurs. Vérifiez les informations importantes.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}