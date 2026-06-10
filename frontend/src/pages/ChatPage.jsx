// ChatPage.jsx — suggestions inline dans la zone messages, style moderne
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useTheme } from '../components/Navbar';
import { useT } from '../i18n';

const WEBHOOK_URL = import.meta.env?.VITE_WEBHOOK_URL
  ? `${import.meta.env.VITE_WEBHOOK_URL}/webhook/webhook`
  : 'http://localhost:5678/webhook/webhook';
const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:3000';

async function saveToPayload(text, role, conversationId) {
  try {
    const token = localStorage.getItem('token');
    await axios.post(`${API_BASE}/api/messages`, { text, role, conversationId }, {
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `JWT ${token}` } : {}) },
    });
  } catch (e) { console.warn('[Payload]', e.message); }
}

async function callN8n(payload) {
  const res = await axios.post(WEBHOOK_URL, payload, { headers: { 'Content-Type': 'application/json' }, timeout: 120000 });
  return res.data;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --accent: #0066b3;
    --accent-ink: #004f8a;
    --accent-soft: #e8f2fb;
    --ink: #141414;
    --ink2: #3a3a3a;
    --ink3: #6b6b6b;
    --ink4: #9a9794;
    --paper: #f7f5f0;
    --paper2: #efecea;
    --rule: #dedad4;
    --rule-soft: #e8e4de;
    --surface: #ffffff;
    --danger: #b4321f;
    --f-serif: "Playfair Display", Georgia, serif;
    --f-sans: "DM Sans", -apple-system, sans-serif;
    --chat-max: 780px;
    --sidebar-w: 268px;
  }
  [data-theme="dark"] {
    --accent: #4c9fd9; --accent-ink: #8ec1e6; --accent-soft: #1a2e3f;
    --ink: #f0ede6; --ink2: #cac7be; --ink3: #9a9890; --ink4: #66645e;
    --paper: #131209; --paper2: #1b1a14; --rule: #28271f; --rule-soft: #21201a; --surface: #18170e;
  }

  @keyframes fade-up   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slide-lft { from { opacity:0; transform:translateX(-14px); } to { opacity:1; transform:translateX(0); } }
  @keyframes dot-pulse { 0%,60%,100% { transform:scale(.7); opacity:.35; } 30% { transform:scale(1.1); opacity:1; } }
  @keyframes ctx-pop   { from { opacity:0; transform:scale(.95) translateY(-4px); } to { opacity:1; transform:scale(1) translateY(0); } }

  /* Suggestions inline — animation staggerée */
  @keyframes chip-in {
    from { opacity:0; transform:translateY(6px) scale(.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes sugg-block-in {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }

  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--rule); border-radius:2px; }
  ::-webkit-scrollbar-thumb:hover { background:var(--ink4); }
  ::selection { background:var(--accent); color:#fff; }
  body { margin:0; }

  .conv-item:hover .conv-menu-btn { opacity:1 !important; }
  .ctx-menu {
    position:absolute; right:6px; top:calc(100% + 4px);
    background:var(--surface); border:1px solid var(--rule);
    border-radius:10px; padding:5px; z-index:200; min-width:150px;
    box-shadow:0 8px 24px rgba(0,0,0,.11); animation:ctx-pop .14s ease both;
  }
  .ctx-item {
    display:flex; align-items:center; gap:9px; padding:8px 10px; border-radius:6px;
    font-size:13px; cursor:pointer; color:var(--ink2); font-family:var(--f-sans);
    transition:background .1s, color .1s; white-space:nowrap;
  }
  .ctx-item:hover { background:var(--paper2); color:var(--ink); }
  .ctx-item.danger:hover { background:#fff0ee; color:var(--danger); }
  .rename-input {
    background:var(--paper2); border:1.5px solid var(--accent); border-radius:6px;
    color:var(--ink); font-family:var(--f-sans); font-size:13px; padding:4px 8px; outline:none; width:100%;
  }
  .search-input {
    background:var(--paper2); border:1.5px solid var(--rule); border-radius:8px;
    color:var(--ink); font-family:var(--f-sans); font-size:13px;
    padding:8px 12px 8px 34px; outline:none; width:100%; transition:border-color .15s;
  }
  .search-input:focus { border-color:var(--accent); }
  .date-label {
    font-size:10.5px; font-weight:600; text-transform:uppercase;
    letter-spacing:.08em; color:var(--ink4); padding:8px 12px 4px;
  }

  /* ── Bloc suggestions inline ── */
  .sugg-inline-block {
    margin: 24px 0 8px;
    animation: sugg-block-in .3s ease both;
  }
  .sugg-inline-header {
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:14px;
  }
  .sugg-inline-label {
    font-size:11px; font-weight:700; text-transform:uppercase;
    letter-spacing:.1em; color:var(--ink4); font-family:var(--f-sans);
    display:flex; align-items:center; gap:6px;
  }
  .sugg-inline-label::before {
    content:''; display:inline-block;
    width:18px; height:1.5px; background:var(--rule);
  }
  .sugg-close-btn {
    background:transparent; border:none; cursor:pointer;
    color:var(--ink4); font-size:12px; font-family:var(--f-sans);
    padding:3px 8px; border-radius:6px; transition:all .12s;
    display:flex; align-items:center; gap:4px;
  }
  .sugg-close-btn:hover { color:var(--ink2); background:var(--paper2); }

  .sugg-group { margin-bottom:16px; }
  .sugg-group-title {
    font-size:10px; font-weight:700; text-transform:uppercase;
    letter-spacing:.1em; color:var(--ink4); font-family:var(--f-sans);
    margin-bottom:8px; padding-left:2px;
  }
  .sugg-chips-row { display:flex; flex-wrap:wrap; gap:7px; }

  .sugg-chip {
    display:inline-flex; align-items:center; gap:7px;
    padding:8px 15px;
    background:var(--surface);
    border:1px solid var(--rule);
    border-radius:24px;
    font-family:var(--f-sans); font-size:13px; font-weight:500;
    color:var(--ink2); cursor:pointer;
    transition:all .15s ease;
    user-select:none;
    animation: chip-in .25s ease both;
  }
  .sugg-chip:hover {
    background:var(--accent); border-color:var(--accent);
    color:#fff; transform:translateY(-2px);
    box-shadow:0 4px 12px rgba(0,102,179,.2);
  }
  .sugg-chip:active { transform:translateY(0); box-shadow:none; }
  .sugg-chip-icon {
    font-size:14px; line-height:1; flex-shrink:0;
  }

  /* Divider entre groupes */
  .sugg-divider {
    height:1px; background:var(--rule-soft);
    margin:14px 0; border:none;
  }

  /* Bubbles */
  .bubble-user {
    max-width:70%; background:var(--accent); color:#fff;
    padding:11px 17px; border-radius:18px; border-bottom-right-radius:4px;
    font-size:14px; line-height:1.55; font-family:var(--f-sans);
  }
  .bubble-ai {
    background:var(--paper2); border-radius:18px; border-top-left-radius:4px;
    padding:12px 18px; color:var(--ink); font-family:var(--f-sans);
  }

  /* Input */
  .input-wrapper {
    background:var(--surface); border:2px solid var(--rule); border-radius:14px;
    display:flex; align-items:center; gap:8px; padding:4px 6px 4px 16px;
    transition:border-color .18s, box-shadow .18s;
  }
  .input-wrapper:focus-within { border-color:var(--accent); box-shadow:0 4px 16px rgba(0,102,179,.07); }
  .chat-textarea {
    flex:1; background:transparent; border:none; padding:13px 0;
    font-family:var(--f-sans); font-size:14px; line-height:1.5; color:var(--ink);
    resize:none; outline:none; height:50px; min-height:50px; max-height:50px; overflow-y:auto;
  }
  .chat-textarea::placeholder { color:var(--ink4); }

  /* Bouton suggestions — pill discret dans la toolbar */
  .btn-sugg {
    display:inline-flex; align-items:center; gap:6px;
    padding:6px 13px; background:transparent;
    border:1px solid var(--rule); border-radius:20px;
    font-family:var(--f-sans); font-size:12.5px; font-weight:500;
    color:var(--ink3); cursor:pointer; transition:all .13s; margin-bottom:10px;
  }
  .btn-sugg:hover { background:var(--paper2); color:var(--ink); border-color:var(--ink4); }
  .btn-sugg.active { background:var(--accent-soft); border-color:var(--accent); color:var(--accent); }

  .btn-send {
    width:42px; height:42px; background:var(--accent); border:none; border-radius:11px;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    flex-shrink:0; transition:all .12s;
  }
  .btn-send:hover:not(:disabled) { background:var(--accent-ink); transform:scale(1.04); }
  .btn-send:disabled { background:var(--rule); cursor:not-allowed; opacity:.5; }
`;

const generateId = () => Math.random().toString(36).slice(2);
const formatDateLabel = (iso, lang) => {
  const d = new Date(iso);
  const diff = Math.floor((new Date() - d) / 86400000);
  if (diff === 0) return lang === 'fr' ? "Aujourd'hui" : 'Today';
  if (diff === 1) return lang === 'fr' ? 'Hier' : 'Yesterday';
  if (diff < 7) return lang === 'fr' ? 'Cette semaine' : 'This week';
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });
};

function ContextMenu({ onRename, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
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
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
        Supprimer
      </div>
    </div>
  );
}

function Sidebar({ conversations, activeId, onSelect, onNew, onRename, onDelete, lang }) {
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef(null);

  useEffect(() => { if (renamingId && renameRef.current) renameRef.current.focus(); }, [renamingId]);

  const filtered = useMemo(() =>
    !search.trim() ? conversations : conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase())),
    [conversations, search]);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(c => { const l = formatDateLabel(c.updatedAt, lang); if (!g[l]) g[l] = []; g[l].push(c); });
    return g;
  }, [filtered, lang]);

  const handleRenameSubmit = (id) => {
    if (renameValue.trim()) onRename(id, renameValue.trim());
    setRenamingId(null); setRenameValue('');
  };

  return (
    <aside style={{ width: 'var(--sidebar-w)', background: 'var(--surface)', borderRight: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0, animation: 'slide-lft .25s ease both' }}>
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--rule-soft)', flexShrink: 0 }}>
        <button onClick={onNew} style={{ width: '100%', padding: '9px 14px', background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'var(--f-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'background .15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-ink)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {lang === 'fr' ? 'Nouvelle discussion' : 'New chat'}
        </button>
      </div>
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--rule-soft)', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink4)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder={lang === 'fr' ? 'Rechercher…' : 'Search…'} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px' }}>
        {Object.keys(grouped).length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--ink4)', textAlign: 'center', marginTop: 24, fontFamily: 'var(--f-sans)' }}>
            {lang === 'fr' ? 'Aucune conversation' : 'No conversations'}
          </p>
        )}
        {Object.entries(grouped).map(([label, convs]) => (
          <div key={label}>
            <div className="date-label">{label}</div>
            {convs.map(conv => (
              <div key={conv.id} className="conv-item" style={{ borderRadius: 8, marginBottom: 1, background: conv.id === activeId ? 'var(--accent-soft)' : 'transparent', border: conv.id === activeId ? '1px solid var(--rule)' : '1px solid transparent', transition: 'all .12s', position: 'relative' }}
                onMouseEnter={e => { if (conv.id !== activeId) e.currentTarget.style.background = 'var(--paper2)'; }}
                onMouseLeave={e => { if (conv.id !== activeId) e.currentTarget.style.background = 'transparent'; }}>
                {renamingId === conv.id ? (
                  <div style={{ padding: '8px 10px' }}>
                    <input ref={renameRef} className="rename-input" value={renameValue} onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(conv.id); if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); } }}
                      onBlur={() => handleRenameSubmit(conv.id)} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '8px 7px', cursor: 'pointer', gap: 8 }} onClick={() => onSelect(conv.id)}>
                    <svg style={{ flexShrink: 0, color: conv.id === activeId ? 'var(--accent)' : 'var(--ink4)' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: conv.id === activeId ? 600 : 400, color: conv.id === activeId ? 'var(--accent)' : 'var(--ink2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--f-sans)' }}>{conv.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 1, fontFamily: 'var(--f-sans)' }}>
                        {new Date(conv.updatedAt).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button className="conv-menu-btn" style={{ background: 'transparent', border: 'none', padding: '3px 4px', borderRadius: 5, cursor: 'pointer', color: 'var(--ink3)', flexShrink: 0, opacity: openMenu === conv.id ? 1 : 0, transition: 'opacity .12s, background .12s', display: 'flex', alignItems: 'center' }}
                      onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === conv.id ? null : conv.id); }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--rule-soft)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                    </button>
                    {openMenu === conv.id && (
                      <ContextMenu onClose={() => setOpenMenu(null)}
                        onRename={() => { setOpenMenu(null); setRenamingId(conv.id); setRenameValue(conv.title); }}
                        onDelete={() => { setOpenMenu(null); onDelete(conv.id); }} />
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

function MessageBubble({ message, isUser, delay = 0 }) {
  const content = useMemo(() => {
    if (!message.text) return null;
    const lines = message.text.split('\n');
    const els = [];
    const parseInline = (text) => text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]; const t = line.trim();
      if (!t) { els.push(<div key={`s${i}`} style={{ height: 7 }} />); continue; }
      if (t.startsWith('## ')) { els.push(<h2 key={i} style={{ fontSize: 16, fontWeight: 700, margin: '14px 0 7px', fontFamily: 'var(--f-serif)', color: 'var(--ink)' }}>{parseInline(t.slice(3))}</h2>); continue; }
      if (t.startsWith('### ')) { els.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 600, margin: '10px 0 5px', color: 'var(--ink2)' }}>{parseInline(t.slice(4))}</h3>); continue; }
      if (t.match(/^[-*]\s/)) {
        els.push(<div key={i} style={{ margin: '4px 0 4px 12px', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 3 }}>•</span>
          <span style={{ flex: 1, fontSize: 14, lineHeight: 1.6 }}>{parseInline(t.slice(2))}</span>
        </div>); continue;
      }
      const bold = t.match(/^\*\*(.+?)\*\*$/);
      if (bold) { els.push(<div key={i} style={{ margin: '8px 0 5px', padding: '6px 11px', background: 'var(--paper)', borderLeft: '3px solid var(--accent)', borderRadius: 6 }}><strong style={{ fontSize: 13 }}>{bold[1]}</strong></div>); continue; }
      els.push(<p key={i} style={{ margin: '0 0 9px', lineHeight: 1.65, fontSize: 14 }}>{parseInline(line)}</p>);
    }
    return els;
  }, [message.text]);

  if (isUser) return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18, animation: 'fade-up .26s ease both', animationDelay: `${delay}s` }}>
      <div className="bubble-user">{message.text}</div>
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 11, marginBottom: 22, animation: 'fade-up .26s ease both', animationDelay: `${delay}s` }}>
      <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div style={{ flex: 1 }}><div className="bubble-ai">{content}</div></div>
    </div>
  );
}

// ── Suggestions inline dans la zone messages ──
function SuggestionsInline({ lang, onSelect, onClose }) {
  const GROUPS = [
    {
      icon: '🎯',
      title: lang === 'fr' ? 'Trouver des bourses' : 'Find scholarships',
      items: [
        { icon: '🔍', text: lang === 'fr' ? 'Bourses adaptées à mon profil' : 'Scholarships matching my profile' },
        { icon: '📅', text: lang === 'fr' ? 'Bourses encore ouvertes' : 'Scholarships still open' },
        { icon: '🇫🇷', text: lang === 'fr' ? 'Bourses disponibles en France' : 'Scholarships available in France' },
      ],
    },
    {
      icon: '📊',
      title: lang === 'fr' ? 'Analyse & stratégie' : 'Analysis & strategy',
      items: [
        { icon: '📈', text: lang === 'fr' ? 'Ma probabilité d\'acceptation' : 'My acceptance probability' },
        { icon: '🧠', text: lang === 'fr' ? 'Analyser mon profil' : 'Analyze my profile' },
        { icon: '🗺️', text: lang === 'fr' ? 'Stratégie à suivre' : 'Strategy to follow' },
      ],
    },
    {
      icon: '🚀',
      title: lang === 'fr' ? 'Action rapide' : 'Quick action',
      items: [
        { icon: '📝', text: lang === 'fr' ? 'Postuler à une bourse' : 'Apply for a scholarship' },
        { icon: '✍️', text: lang === 'fr' ? 'Rédiger ma lettre de motivation' : 'Write my motivation letter' },
        { icon: '📄', text: lang === 'fr' ? 'Améliorer mon CV' : 'Improve my CV' },
        { icon: '🎙️', text: lang === 'fr' ? 'Simuler un entretien' : 'Simulate an interview' },
      ],
    },
    {
      icon: '🌍',
      title: lang === 'fr' ? 'Par destination' : 'By destination',
      items: [
        { icon: '🇪🇺', text: lang === 'fr' ? 'Étudier en Europe' : 'Study in Europe' },
        { icon: '🇨🇦', text: lang === 'fr' ? 'Étudier au Canada' : 'Study in Canada' },
        { icon: '🇬🇧', text: lang === 'fr' ? 'Étudier au Royaume-Uni' : 'Study in the UK' },
        { icon: '🇩🇪', text: lang === 'fr' ? 'Étudier en Allemagne' : 'Study in Germany' },
      ],
    },
  ];

  // Calcul du délai staggeré global sur tous les chips
  let chipIndex = 0;

  return (
    <div className="sugg-inline-block">
      <div className="sugg-inline-header">
        <span className="sugg-inline-label">
          {lang === 'fr' ? 'Suggestions' : 'Suggestions'}
        </span>
        <button className="sugg-close-btn" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          {lang === 'fr' ? 'Fermer' : 'Close'}
        </button>
      </div>

      {GROUPS.map((group, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && <hr className="sugg-divider" />}
          <div className="sugg-group">
            <div className="sugg-group-title">
              <span style={{ marginRight: 5 }}>{group.icon}</span>{group.title}
            </div>
            <div className="sugg-chips-row">
              {group.items.map((item, ii) => {
                const delay = `${(chipIndex++) * 0.04}s`;
                return (
                  <button
                    key={ii}
                    className="sugg-chip"
                    style={{ animationDelay: delay }}
                    onClick={() => { onSelect(item.text); onClose(); }}
                  >
                    <span className="sugg-chip-icon">{item.icon}</span>
                    {item.text}
                  </button>
                );
              })}
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function ChatInterface() {
  const { theme } = useTheme();
  const { lang } = useT();

  const conversationId = useRef(null);
  if (!conversationId.current) {
    const saved = sessionStorage.getItem('chat_conv_id');
    conversationId.current = saved || `chat-${Date.now()}`;
    if (!saved) sessionStorage.setItem('chat_conv_id', conversationId.current);
  }

  const [currentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('opps_user') || 'null'); } catch { return null; }
  });
  const [conversations, setConversations] = useState(() => {
    try { const s = localStorage.getItem('opps-conversations'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [activeId, setActiveId] = useState(() => {
    try { const s = localStorage.getItem('opps-conversations'); const c = s ? JSON.parse(s) : []; return c[0]?.id || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showSugg, setShowSugg] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const activeConv = useMemo(() => conversations.find(c => c.id === activeId) || null, [conversations, activeId]);
  const messages = activeConv?.messages || [];
  const hasMessages = messages.length > 0;

  useEffect(() => { try { localStorage.setItem('opps-conversations', JSON.stringify(conversations)); } catch {} }, [conversations]);

  const scrollToBottom = useCallback(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, []);
  useEffect(() => { scrollToBottom(); }, [messages, loading, showSugg, scrollToBottom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const h = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
    el.addEventListener('scroll', h); h();
    return () => el.removeEventListener('scroll', h);
  }, [messages]);

  const handleNew = useCallback(() => {
    const id = generateId();
    setConversations(prev => [{ id, title: lang === 'fr' ? 'Nouvelle conversation' : 'New conversation', updatedAt: new Date().toISOString(), messages: [] }, ...prev]);
    setActiveId(id); setInputValue(''); setShowSugg(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [lang]);

  const handleSelect = useCallback((id) => { setActiveId(id); setInputValue(''); setShowSugg(false); }, []);
  const handleRename = useCallback((id, title) => { setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c)); }, []);
  const handleDelete = useCallback((id) => {
    setConversations(prev => { const next = prev.filter(c => c.id !== id); if (id === activeId) setActiveId(next[0]?.id || null); return next; });
  }, [activeId]);

  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    setShowSugg(false);

    let targetId = activeId;
    if (!targetId) {
      targetId = generateId();
      setConversations(prev => [{ id: targetId, title: text.slice(0, 42), updatedAt: new Date().toISOString(), messages: [] }, ...prev]);
      setActiveId(targetId);
    }

    const userMsg = { id: generateId(), sender: 'user', text: text.trim(), timestamp: new Date().toISOString() };
    setConversations(prev => prev.map(c => c.id !== targetId ? c : {
      ...c, messages: [...c.messages, userMsg],
      title: c.messages.length === 0 ? text.slice(0, 42) : c.title,
      updatedAt: new Date().toISOString(),
    }));
    setInputValue('');
    setLoading(true);
    saveToPayload(text.trim(), 'user', conversationId.current);

    try {
      const data = await callN8n({
        text: text.trim(), conversationId: conversationId.current,
        id: currentUser?.id || null, email: currentUser?.email || null,
        pays: currentUser?.pays || '', niveau: currentUser?.niveau || '',
        domaine: currentUser?.domaine || '', name: currentUser?.name || '',
        user_profile: currentUser ? { ...currentUser, is_complete: !!(currentUser.pays && currentUser.niveau && currentUser.domaine) } : null,
      });
      const aiText = data?.output || data?.message || data?.text || data?.response || '';
      const finalText = aiText || (lang === 'fr' ? '⚠️ n8n a répondu sans texte.' : '⚠️ n8n responded without text.');
      const aiMsg = { id: generateId(), sender: 'ai', text: finalText, timestamp: new Date().toISOString() };
      setConversations(prev => prev.map(c => c.id === targetId ? { ...c, messages: [...c.messages, aiMsg], updatedAt: new Date().toISOString() } : c));
      saveToPayload(finalText, 'assistant', conversationId.current);
    } catch (err) {
      let errorText = `❌ ${err.message}`;
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) errorText = '⏳ **Délai dépassé**';
      else if (err.message?.includes('Network Error')) errorText = `🔌 **n8n inaccessible** — \`${WEBHOOK_URL}\``;
      else if (err.response?.status === 404) errorText = '⚠️ **Webhook introuvable (404)**';
      else if (err.response?.status >= 500) errorText = `❌ **Erreur n8n (${err.response.status})**`;
      const errMsg = { id: generateId(), sender: 'ai', text: errorText, timestamp: new Date().toISOString() };
      setConversations(prev => prev.map(c => c.id === targetId ? { ...c, messages: [...c.messages, errMsg], updatedAt: new Date().toISOString() } : c));
    } finally { setLoading(false); }
  }, [loading, activeId, currentUser, lang]);

  const handleSubmit = (e) => { e.preventDefault(); handleSendMessage(inputValue); };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(inputValue); } };

  return (
    <>
      <style>{styles}</style>
      <div style={{ display: 'flex', height: '100vh', background: 'var(--paper)', fontFamily: 'var(--f-sans)', overflow: 'hidden' }}>

        <Sidebar conversations={conversations} activeId={activeId}
          onSelect={handleSelect} onNew={handleNew}
          onRename={handleRename} onDelete={handleDelete} lang={lang} />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0, position: 'relative' }}>

          <header style={{ padding: '16px 30px 13px', borderBottom: '1px solid var(--rule-soft)', background: 'var(--paper)', flexShrink: 0 }}>
            <h1 style={{ fontFamily: 'var(--f-serif)', fontSize: 'clamp(20px, 2.6vw, 28px)', fontWeight: 700, letterSpacing: '-.015em', color: 'var(--ink)', marginBottom: 2 }}>
              {!hasMessages ? (lang === 'fr' ? 'Bonjour !' : 'Hello!') : (activeConv?.title || (lang === 'fr' ? 'Assistant IA' : 'AI Assistant'))}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--ink3)' }}>
              {lang === 'fr' ? 'Posez-moi votre question ci-dessous.' : 'Ask me your question below.'}
            </p>
          </header>

          {/* Zone messages */}
          <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', scrollBehavior: 'smooth' }}>
            <div style={{ maxWidth: 'var(--chat-max)', margin: '0 auto', padding: '26px 26px 12px' }}>

              {!hasMessages && (
                <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', animation: 'fade-up .3s ease both' }}>
                  <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div style={{ background: 'var(--paper2)', border: '1px solid var(--rule)', borderRadius: 18, borderTopLeftRadius: 4, padding: '12px 17px', fontSize: 14, lineHeight: 1.6, color: 'var(--ink)' }}>
                    {lang === 'fr' ? "Comment puis-je vous aider aujourd'hui ?" : 'How can I help you today?'}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <MessageBubble key={msg.id || idx} message={msg} isUser={msg.sender === 'user'} delay={idx * 0.02} />
              ))}

              {loading && (
                <div style={{ display: 'flex', gap: 11, marginBottom: 18, animation: 'fade-up .22s ease both' }}>
                  <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <div style={{ background: 'var(--paper2)', border: '1px solid var(--rule)', borderRadius: 18, borderTopLeftRadius: 4, padding: '13px 17px', display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: 'dot-pulse 1.2s infinite ease-in-out', animationDelay: `${i * 0.2}s`, display: 'inline-block' }} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Suggestions inline — s'affichent ici dans les messages ── */}
              {showSugg && (
                <SuggestionsInline
                  lang={lang}
                  onSelect={(text) => { setInputValue(text); setTimeout(() => inputRef.current?.focus(), 50); }}
                  onClose={() => setShowSugg(false)}
                />
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Scroll button */}
          {showScrollBtn && (
            <button onClick={scrollToBottom} style={{ position: 'absolute', bottom: 108, right: 26, width: 34, height: 34, background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.09)', transition: 'all .13s', zIndex: 10, color: 'var(--ink3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--ink3)'; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          )}

          {/* ── Zone input fixe ── */}
          <div style={{ flexShrink: 0, background: 'var(--paper)', borderTop: '1px solid var(--rule-soft)' }}>
            <div style={{ maxWidth: 'var(--chat-max)', margin: '0 auto', padding: '10px 22px 16px' }}>

              {/* Bouton suggestions — pill discret, EN DEHORS de l'input */}
              <button
                className={`btn-sugg${showSugg ? ' active' : ''}`}
                onClick={() => setShowSugg(v => !v)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  <line x1="9" y1="10" x2="15" y2="10"/>
                  <line x1="9" y1="14" x2="13" y2="14"/>
                </svg>
                {lang === 'fr' ? 'Suggestions' : 'Suggestions'}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{ transform: showSugg ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              <form onSubmit={handleSubmit}>
                <div className="input-wrapper">
                  <textarea
                    ref={inputRef}
                    className="chat-textarea"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={lang === 'fr' ? 'Écrivez votre message…' : 'Type your message…'}
                    rows={1}
                    disabled={loading}
                  />
                  <button type="submit" className="btn-send" disabled={!inputValue.trim() || loading}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </form>

              <p style={{ fontSize: 11, color: 'var(--ink4)', textAlign: 'center', marginTop: 9, fontFamily: 'var(--f-sans)' }}>
                {lang === 'fr' ? 'OppsTrack peut faire des erreurs. Vérifiez les informations importantes.' : 'OppsTrack may make mistakes. Verify important information.'}
              </p>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}