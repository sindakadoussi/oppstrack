import React, { useState } from 'react';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';

const countryFlag = (pays) => {
  const flags = {
    'France': '🇫🇷', 'USA': '🇺🇸', 'UK': '🇬🇧', 'Canada': '🇨🇦',
    'Allemagne': '🇩🇪', 'Belgique': '🇧🇪', 'Japon': '🇯🇵', 'Australie': '🇦🇺',
    'Suisse': '🇨🇭', 'Pays-Bas': '🇳🇱', 'Turquie': '🇹🇷', 'Chine': '🇨🇳',
    'Netherlands': '🇳🇱', 'Turkey': '🇹🇷', 'China': '🇨🇳', 'Germany': '🇩🇪',
  };
  return flags[pays] || '🌍';
};


// ── Score de compatibilité ────────────────────────────────────────────────────
function calcMatch(bourse, user) {
  if (!user) return null;
  let score = 0;
  let total = 0;

  // Pays cible (40pts) — l'user veut étudier dans ce pays ?
  if (user.pays) {
    total += 40;
    const bp = (bourse.pays || '').toLowerCase();
    const up = user.pays.toLowerCase();
    if (bp === up || bp.includes(up) || up.includes(bp)) score += 40;
  }

  // Niveau (35pts)
  if (user.niveau) {
    total += 35;
    const bn = (bourse.niveau || '').toLowerCase();
    const un = user.niveau.toLowerCase();
    // Master 1 / Master 2 → match si bourse dit "Master"
    const userNivBase = un.replace(/\s*\d+$/, '').trim();
    if (bn.includes(un) || bn.includes(userNivBase)) score += 35;
  }

  // Domaine (25pts)
  if (user.domaine) {
    total += 25;
    const bd = (bourse.domaine || '').toLowerCase();
    const desc = (bourse.description || '').toLowerCase();
    const ud = user.domaine.toLowerCase();
    if (bd.includes(ud) || ud.includes(bd) || desc.includes(ud)) score += 25;
    else score += 8; // bonus partiel — domaine non précisé = possible
  }

  if (total === 0) return null;
  return Math.round((score / total) * 100);
}

function MatchBadge({ pct }) {
  if (pct === null) return null;
  const color = pct >= 80 ? '#34d399' : pct >= 55 ? '#fbbf24' : '#f87171';
  const bg    = pct >= 80 ? 'rgba(16,185,129,0.12)' : pct >= 55 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
  const label = pct >= 80 ? '🎯 Excellent match' : pct >= 55 ? '👍 Bon match' : '⚠️ Match partiel';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '5px 10px', borderRadius: 8,
      background: bg, border: `1px solid ${color}30`,
      marginBottom: 2,
    }}>
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color, fontWeight: 800 }}>{pct}%</span>
    </div>
  );
}


const isUrgent = (deadline) => {
  if (!deadline) return false;
  return (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24) < 30;
};

const daysLeft = (deadline) => {
  if (!deadline) return null;
  const diff = Math.round((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0)   return { label: 'Expirée',       color: '#f87171' };
  if (diff === 0) return { label: "Aujourd'hui !",  color: '#f87171' };
  if (diff <= 7)  return { label: `${diff} jours`,  color: '#f87171' };
  if (diff <= 30) return { label: `${diff} jours`,  color: '#fbbf24' };
  return               { label: `${diff} jours`,  color: '#34d399' };
};

// ── BourseDrawer ──────────────────────────────────────────────────────────────
function BourseDrawer({ bourse, onClose, onAskAI, onChoose }) {
  if (!bourse) return null;
  const dl = daysLeft(bourse.dateLimite);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 901,
        width: 440, maxWidth: '92vw',
        background: '#0d0d22',
        borderLeft: '1px solid rgba(99,102,241,0.2)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.25s ease',
        overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 22px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{
              fontSize: 28, width: 52, height: 52, borderRadius: 14,
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {countryFlag(bourse.pays)}
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8',
              width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16,
            }}>✕</button>
          </div>

          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 6, lineHeight: 1.3 }}>
            {bourse.nom}
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={D.tag}>{countryFlag(bourse.pays)} {bourse.pays}</span>
            {bourse.niveau && <span style={D.tag}>🎓 {bourse.niveau}</span>}
            <span style={{ ...D.tag, background: 'rgba(16,185,129,0.12)', color: '#34d399', borderColor: 'rgba(16,185,129,0.25)' }}>
              💰 {bourse.financement || '100% financée'}
            </span>
          </div>

          {/* Deadline banner */}
          {dl && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, marginBottom: 16,
              background: `${dl.color}12`,
              border: `1px solid ${dl.color}30`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>⏰</span>
              <div>
                <div style={{ fontSize: 12, color: dl.color, fontWeight: 700 }}>
                  {dl.label === 'Expirée' ? 'Deadline expirée' : `Deadline dans ${dl.label}`}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {bourse.dateLimite && new Date(bourse.dateLimite).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}
                </div>
              </div>
            </div>
          )}

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 -22px 16px' }} />
        </div>

        {/* Body */}
        <div style={{ padding: '0 22px', flex: 1 }}>

          {/* Description */}
          {bourse.description && (
            <div style={{ marginBottom: 20 }}>
              <div style={D.sectionLabel}>À propos</div>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
                {bourse.description}
              </p>
            </div>
          )}

          {/* Détails */}
          <div style={{ marginBottom: 20 }}>
            <div style={D.sectionLabel}>Détails</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '📍', label: 'Pays', val: bourse.pays },
                { icon: '🎓', label: 'Niveau', val: bourse.niveau },
                { icon: '💰', label: 'Financement', val: bourse.financement },
                { icon: '📚', label: 'Domaine', val: bourse.domaine },
                { icon: '💵', label: 'Montant', val: bourse.montant },
              ].filter(r => r.val).map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{row.icon}</span>
                  <span style={{ fontSize: 12, color: '#64748b', width: 80 }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, flex: 1 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lien officiel */}
          {bourse.lienOfficiel && (
            <div style={{ marginBottom: 20 }}>
              <div style={D.sectionLabel}>Lien officiel</div>
              <a
                href={bourse.lienOfficiel}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                  borderRadius: 10, background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  color: '#818cf8', fontSize: 13, textDecoration: 'none',
                  wordBreak: 'break-all',
                }}
              >
                <span>🔗</span>
                <span style={{ flex: 1 }}>{bourse.lienOfficiel}</span>
                <span style={{ flexShrink: 0 }}>↗</span>
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: '16px 22px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            style={{
              width: '100%', padding: '13px', borderRadius: 11, border: 'none',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(79,70,229,0.35)',
            }}
            onClick={() => { onChoose(bourse); onClose(); }}
          >
            🎯 Je choisis cette bourse
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', fontSize: 13, cursor: 'pointer' }}
              onClick={() => { onAskAI(bourse); onClose(); }}
            >
              🤖 Demander à l'IA
            </button>
            {bourse.lienOfficiel && (
              <a
                href={bourse.lienOfficiel}
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 13, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                Postuler ↗
              </a>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </>
  );
}

const D = {
  tag: { fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#94a3b8' },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 },
};

// ── BoursesPage ───────────────────────────────────────────────────────────────
export default function BoursesPage({ bourses, askAboutScholarship, handleSend, messages, input, setInput, loading, chatContainerRef, handleQuickReply, user }) {
  const [search, setSearch]           = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [filterPays, setFilterPays]   = useState('');
  const [showChat, setShowChat]       = useState(false);
  const [selected, setSelected]       = useState(null);

 const filtered = bourses.filter(b => {
  if (b.statut === 'expiree') return false;  // ← ajouter cette ligne
  const q = search.toLowerCase();
  const matchSearch  = !q || b.nom?.toLowerCase().includes(q) || b.pays?.toLowerCase().includes(q) || b.domaine?.toLowerCase().includes(q);
  const matchNiveau  = !filterNiveau || b.niveau?.includes(filterNiveau);
  const matchPays    = !filterPays   || b.pays === filterPays;
  return matchSearch && matchNiveau && matchPays;
  });

  const pays    = [...new Set(bourses.map(b => b.pays).filter(Boolean))];
  const niveaux = [...new Set(bourses.flatMap(b => (b.niveau || '').split(',').map(s => s.trim())).filter(Boolean))];

  const onChoose = (bourse) => {
    handleSend(`je choisis ${bourse.nom}`);
  };

  const onAskAI = (bourse) => {
    askAboutScholarship(bourse);
  };

  return (
    <div className="bourses-page">
      {/* Header */}
      <div className="bourses-header">
        <div>
          <h2>Bourses 100% Financées</h2>
          <p className="results-count">{filtered.length} opportunité{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <button className="toggle-chat-btn" onClick={() => setShowChat(!showChat)}>
          {showChat ? '✕ Fermer IA' : '🤖 Chat IA'}
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          className="filter-search"
          placeholder="🔍  Rechercher une bourse, pays, domaine..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)}>
          <option value="">Tous niveaux</option>
          {niveaux.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select className="filter-select" value={filterPays} onChange={e => setFilterPays(e.target.value)}>
          <option value="">Tous pays</option>
          {pays.map(p => <option key={p} value={p}>{countryFlag(p)} {p}</option>)}
        </select>
        {(search || filterNiveau || filterPays) && (
          <button className="clear-filters" onClick={() => { setSearch(''); setFilterNiveau(''); setFilterPays(''); }}>
            ✕ Effacer
          </button>
        )}
      </div>

      <div className="bourses-layout">
        {/* Cards */}
        <div className="cards-grid">
          {filtered.length === 0 ? (
            <div className="no-results">
              <span>🔍</span>
              <p>Aucune bourse trouvée. Essayez d'autres critères.</p>
            </div>
          ) : (
            filtered.map(bourse => {
              const urgent = isUrgent(bourse.dateLimite);
              const dl     = daysLeft(bourse.dateLimite);
              return (
                <div key={bourse.id} className="bourse-card">
                  {/* Card top */}
                  <div className="card-top">
                    <div className="card-badges">
                      <span className="badge-funded">💯 Financée</span>
                      {urgent && <span className="badge-urgent">🔥 Urgent</span>}
                    </div>
                    <div className="card-country">
                      {countryFlag(bourse.pays)} <span>{bourse.pays}</span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="card-body">
                    {/* ← Clic sur le nom ouvre le drawer */}
                    <MatchBadge pct={calcMatch(bourse, user)} />

                    <h3
                      className="bourse-title-link"
                      onClick={() => setSelected(bourse)}
                    >
                      {bourse.nom}
                    </h3>

                    <div className="card-meta">
                      {bourse.niveau  && <span className="meta-tag">🎓 {bourse.niveau}</span>}
                      {bourse.domaine && <span className="meta-tag">📚 {bourse.domaine}</span>}
                    </div>

                    {dl && (
                      <div style={{ fontSize: 12, color: dl.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                        ⏰ {dl.label === 'Expirée' ? 'Deadline expirée' : `${dl.label} restants`}
                      </div>
                    )}

                    <p className="card-desc">{bourse.description?.slice(0, 100)}{bourse.description?.length > 100 ? '…' : ''}</p>

                    <div className="card-actions">
                      <button className="btn-apply-detail" onClick={() => setSelected(bourse)}>
                        Voir les détails →
                      </button>
                      <button className="btn-ask-ai" onClick={() => onAskAI(bourse)}>
                        🤖 IA
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Side Chat */}
        {showChat && (
          <div className="side-chat">
            <div className="side-chat-header">
              <span>🤖</span>
              <span>Assistant Bourses</span>
            </div>
            <div className="side-chat-messages" ref={chatContainerRef}>
              {messages.length === 0 && (
                <div className="side-chat-welcome">
                  Demandez-moi de comparer des bourses ou de vérifier votre éligibilité !
                </div>
              )}
              {messages.slice(-20).map((msg, i) => (
                <ChatMessage key={i} msg={msg} index={i} />
              ))}
              {loading && (
                <div className="msg ai">
                  <div className="msg-avatar"><span>🤖</span></div>
                  <div className="msg-bubble typing-bubble">
                    <span className="dot"/><span className="dot"/><span className="dot"/>
                  </div>
                </div>
              )}
            </div>
            <ChatInput input={input} setInput={setInput} onSend={() => handleSend()} loading={loading} />
          </div>
        )}
      </div>

      {/* Drawer */}
      <BourseDrawer
        bourse={selected}
        onClose={() => setSelected(null)}
        onAskAI={onAskAI}
        onChoose={onChoose}
      />

      <style>{`
        .bourses-page { width: 100%; padding: 32px 16px; }
        .bourses-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
        .bourses-header h2 { font-size:1.8rem; font-weight:800; color:#f1f5f9; margin-bottom:4px; }
        .results-count { color:#64748b; font-size:14px; }
        .toggle-chat-btn { padding:8px 16px; border-radius:10px; background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.3); color:#818cf8; font-size:13px; cursor:pointer; }

        .filters-bar { display:flex; gap:10px; margin-bottom:24px; flex-wrap:wrap; }
        .filter-search { flex:1; min-width:200px; padding:10px 16px; border-radius:10px; border:1px solid rgba(99,102,241,0.25); background:rgba(255,255,255,0.04); color:#e2e8f0; font-size:14px; outline:none; }
        .filter-search::placeholder { color:#475569; }
        .filter-select { padding:10px 14px; border-radius:10px; border:1px solid rgba(99,102,241,0.25); background:rgba(15,15,30,0.9); color:#94a3b8; font-size:13px; cursor:pointer; outline:none; }
        .clear-filters { padding:10px 14px; border-radius:10px; border:1px solid rgba(239,68,68,0.3); background:rgba(239,68,68,0.1); color:#f87171; font-size:13px; cursor:pointer; }

        .bourses-layout { display:flex; gap:24px; align-items:flex-start; }
        .cards-grid { flex:1; display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }
        .no-results { grid-column:1/-1; text-align:center; padding:60px 20px; color:#475569; }
        .no-results span { font-size:40px; display:block; margin-bottom:12px; }

        .bourse-card { background:rgba(15,15,30,0.8); border:1px solid rgba(99,102,241,0.15); border-radius:16px; overflow:hidden; transition:all 0.25s; display:flex; flex-direction:column; }
        .bourse-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,0.4); border-color:rgba(99,102,241,0.35); }

        .card-top { padding:12px 16px; display:flex; justify-content:space-between; align-items:center; background:rgba(99,102,241,0.05); border-bottom:1px solid rgba(99,102,241,0.1); }
        .card-badges { display:flex; gap:6px; }
        .badge-funded { font-size:10px; font-weight:700; padding:3px 8px; background:rgba(16,185,129,0.2); color:#34d399; border:1px solid rgba(16,185,129,0.3); border-radius:12px; text-transform:uppercase; letter-spacing:0.5px; }
        .badge-urgent { font-size:10px; font-weight:700; padding:3px 8px; background:rgba(239,68,68,0.2); color:#f87171; border:1px solid rgba(239,68,68,0.3); border-radius:12px; }
        .card-country { font-size:13px; color:#94a3b8; display:flex; align-items:center; gap:4px; }

        .card-body { padding:16px; flex:1; display:flex; flex-direction:column; gap:10px; }

        /* Titre cliquable */
        .bourse-title-link { font-size:1rem; font-weight:700; color:#e2e8f0; cursor:pointer; line-height:1.3; transition:color 0.15s; margin:0; }
        .bourse-title-link:hover { color:#818cf8; text-decoration:underline; text-underline-offset:3px; }

        .card-meta { display:flex; gap:6px; flex-wrap:wrap; }
        .meta-tag { font-size:11px; padding:3px 8px; border-radius:8px; border:1px solid rgba(99,102,241,0.2); color:#94a3b8; background:rgba(255,255,255,0.03); }
        .card-desc { font-size:13px; color:#64748b; line-height:1.5; flex:1; margin:0; }

        .card-actions { display:flex; gap:8px; margin-top:auto; }
        .btn-apply-detail { flex:1; text-align:center; padding:9px 12px; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:white; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; }
        .btn-apply-detail:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(79,70,229,0.4); }
        .btn-ask-ai { padding:9px 14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#94a3b8; border-radius:10px; font-size:13px; cursor:pointer; transition:all 0.2s; }
        .btn-ask-ai:hover { background:rgba(99,102,241,0.15); color:#818cf8; border-color:rgba(99,102,241,0.3); }

        .side-chat { width:320px; flex-shrink:0; background:rgba(15,15,30,0.9); border:1px solid rgba(99,102,241,0.2); border-radius:16px; overflow:hidden; position:sticky; top:80px; display:flex; flex-direction:column; max-height:calc(100vh - 100px); }
        .side-chat-header { display:flex; align-items:center; gap:8px; padding:14px 16px; border-bottom:1px solid rgba(99,102,241,0.15); color:#818cf8; font-weight:600; font-size:14px; }
        .side-chat-messages { flex:1; overflow-y:auto; padding:12px; min-height:300px; }
        .side-chat-welcome { color:#475569; font-size:13px; text-align:center; padding:20px; line-height:1.6; }

        .msg { display:flex; gap:8px; margin-bottom:12px; max-width:90%; }
        .msg.user { margin-left:auto; flex-direction:row-reverse; }
        .msg-avatar { width:28px; height:28px; border-radius:50%; background:rgba(99,102,241,0.2); border:1px solid rgba(99,102,241,0.3); display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
        .msg-bubble { padding:10px 14px; border-radius:14px; font-size:13px; line-height:1.5; word-break:break-word; }
        .msg.ai .msg-bubble { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); color:#cbd5e1; border-top-left-radius:4px; }
        .msg.user .msg-bubble { background:linear-gradient(135deg,#4f46e5,#7c3aed); color:white; border-top-right-radius:4px; }
        .typing-bubble { display:flex; gap:4px; align-items:center; padding:12px 16px !important; }
        .dot { width:6px; height:6px; border-radius:50%; background:#6366f1; display:block; animation:dotBounce 1.2s infinite ease-in-out; }
        .dot:nth-child(2) { animation-delay:.2s; }
        .dot:nth-child(3) { animation-delay:.4s; }
        @keyframes dotBounce { 0%,60%,100%{transform:scale(0.7);opacity:0.5} 30%{transform:scale(1.1);opacity:1} }

        @media (max-width:900px) { .side-chat { display:none; } }
      `}</style>
    </div>
  );
}
