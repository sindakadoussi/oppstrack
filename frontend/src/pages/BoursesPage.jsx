import React, { useState } from 'react';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';

const countryFlag = (pays) => {
  const flags = { 'France': '🇫🇷', 'USA': '🇺🇸', 'UK': '🇬🇧', 'Canada': '🇨🇦',
    'Allemagne': '🇩🇪', 'Belgique': '🇧🇪', 'Japon': '🇯🇵', 'Australie': '🇦🇺' };
  return flags[pays] || '🌍';
};

const isUrgent = (deadline) => {
  if (!deadline) return false;
  return (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24) < 30;
};

const domainColor = (domaine) => {
  const colors = {
    'Informatique': '#6366f1', 'Médecine': '#ef4444', 'Droit': '#f59e0b',
    'Sciences': '#10b981', 'Arts': '#ec4899', 'Business': '#f97316'
  };
  return colors[domaine] || '#64748b';
};

export default function BoursesPage({ bourses, askAboutScholarship, messages, input, setInput, loading, handleSend, chatContainerRef }) {
  const [search, setSearch] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [filterPays, setFilterPays] = useState('');
  const [showChat, setShowChat] = useState(false);

  const filtered = bourses.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.nom?.toLowerCase().includes(q) || b.pays?.toLowerCase().includes(q) || b.domaine?.toLowerCase().includes(q);
    const matchNiveau = !filterNiveau || b.niveau === filterNiveau;
    const matchPays = !filterPays || b.pays === filterPays;
    return matchSearch && matchNiveau && matchPays;
  });

  const pays = [...new Set(bourses.map(b => b.pays).filter(Boolean))];
  const niveaux = [...new Set(bourses.map(b => b.niveau).filter(Boolean))];

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
        {/* Cards Grid */}
        <div className="cards-grid">
          {filtered.length === 0 ? (
            <div className="no-results">
              <span>🔍</span>
              <p>Aucune bourse trouvée. Essayez d'autres critères.</p>
            </div>
          ) : (
            filtered.map(bourse => (
              <div key={bourse.id} className="bourse-card">
                <div className="card-top" style={{ background: `linear-gradient(135deg, ${domainColor(bourse.domaine)}22, ${domainColor(bourse.domaine)}11)`, borderTop: `3px solid ${domainColor(bourse.domaine)}` }}>
                  <div className="card-badges">
                    <span className="badge-funded">💯 Financée</span>
                    {isUrgent(bourse.deadline) && <span className="badge-urgent">🔥 Urgent</span>}
                  </div>
                  <div className="card-country">
                    {countryFlag(bourse.pays)} <span>{bourse.pays}</span>
                  </div>
                </div>

                <div className="card-body">
                  <h3>{bourse.nom}</h3>
                  <div className="card-meta">
                    {bourse.niveau && <span className="meta-tag">🎓 {bourse.niveau}</span>}
                    {bourse.domaine && <span className="meta-tag" style={{ borderColor: domainColor(bourse.domaine) + '60', color: domainColor(bourse.domaine) }}>📚 {bourse.domaine}</span>}
                  </div>
                  {bourse.deadline && (
                    <div className={`deadline ${isUrgent(bourse.deadline) ? 'urgent' : ''}`}>
                      ⏰ Date limite : <strong>{bourse.deadline}</strong>
                    </div>
                  )}
                  <p className="card-desc">{bourse.description}</p>
                  <div className="card-actions">
                    {bourse.lienOfficiel && (
                      <a href={bourse.lienOfficiel} target="_blank" rel="noreferrer" className="btn-apply">
                        Postuler →
                      </a>
                    )}
                    <button className="btn-ask-ai" onClick={() => askAboutScholarship(bourse)}>
                      🤖 Demander à l'IA
                    </button>
                  </div>
                </div>
              </div>
            ))
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
                  Demandez-moi de comparer des bourses, de vérifier votre éligibilité ou de vous recommander les meilleures options !
                </div>
              )}
              {messages.slice(-20).map((msg, i) => (
                <ChatMessage key={i} msg={msg} index={i} />
              ))}
              {loading && (
                <div className="msg ai">
                  <div className="msg-avatar"><span>🤖</span></div>
                  <div className="msg-bubble typing-bubble">
                    <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                  </div>
                </div>
              )}
            </div>
            <ChatInput input={input} setInput={setInput} onSend={() => handleSend()} loading={loading} />
          </div>
        )}
      </div>

      <style>{`
        .bourses-page { width: 100%; padding: 32px 16px; }
        .bourses-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 24px;
        }
        .bourses-header h2 { font-size: 1.8rem; font-weight: 800; color: #f1f5f9; margin-bottom: 4px; }
        .results-count { color: #64748b; font-size: 14px; }
        .toggle-chat-btn {
          padding: 8px 16px; border-radius: 10px;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          color: #818cf8; font-size: 13px; cursor: pointer;
          transition: all 0.2s;
        }
        .toggle-chat-btn:hover { background: rgba(99,102,241,0.25); }

        .filters-bar {
          display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap;
        }
        .filter-search {
          flex: 1; min-width: 200px; padding: 10px 16px;
          border-radius: 10px; border: 1px solid rgba(99,102,241,0.25);
          background: rgba(255,255,255,0.04); color: #e2e8f0;
          font-size: 14px; outline: none; transition: border-color 0.2s;
        }
        .filter-search:focus { border-color: rgba(99,102,241,0.5); }
        .filter-search::placeholder { color: #475569; }
        .filter-select {
          padding: 10px 14px; border-radius: 10px;
          border: 1px solid rgba(99,102,241,0.25);
          background: rgba(15,15,30,0.9); color: #94a3b8;
          font-size: 13px; cursor: pointer; outline: none;
        }
        .clear-filters {
          padding: 10px 14px; border-radius: 10px;
          border: 1px solid rgba(239,68,68,0.3);
          background: rgba(239,68,68,0.1); color: #f87171;
          font-size: 13px; cursor: pointer;
        }

        .bourses-layout { display: flex; gap: 24px; align-items: flex-start; }
        .cards-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .no-results {
          grid-column: 1/-1; text-align: center;
          padding: 60px 20px; color: #475569;
        }
        .no-results span { font-size: 40px; display: block; margin-bottom: 12px; }

        .bourse-card {
          background: rgba(15,15,30,0.8);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 16px; overflow: hidden;
          transition: all 0.3s;
          display: flex; flex-direction: column;
        }
        .bourse-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.4);
          border-color: rgba(99,102,241,0.35);
        }
        .card-top { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
        .card-badges { display: flex; gap: 6px; }
        .badge-funded {
          font-size: 10px; font-weight: 700; padding: 3px 8px;
          background: rgba(16,185,129,0.2); color: #34d399;
          border: 1px solid rgba(16,185,129,0.3); border-radius: 12px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .badge-urgent {
          font-size: 10px; font-weight: 700; padding: 3px 8px;
          background: rgba(239,68,68,0.2); color: #f87171;
          border: 1px solid rgba(239,68,68,0.3); border-radius: 12px;
        }
        .card-country { font-size: 13px; color: #94a3b8; display: flex; align-items: center; gap: 4px; }
        .card-body { padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
        .card-body h3 { font-size: 1rem; font-weight: 700; color: #f1f5f9; line-height: 1.3; }
        .card-meta { display: flex; gap: 6px; flex-wrap: wrap; }
        .meta-tag {
          font-size: 11px; padding: 3px 8px; border-radius: 8px;
          border: 1px solid rgba(99,102,241,0.25); color: #94a3b8;
          background: rgba(255,255,255,0.03);
        }
        .deadline { font-size: 12px; color: #64748b; }
        .deadline.urgent { color: #f87171; }
        .card-desc { font-size: 13px; color: #64748b; line-height: 1.5; flex: 1; }
        .card-actions { display: flex; gap: 8px; margin-top: auto; }
        .btn-apply {
          flex: 1; text-align: center; padding: 9px 12px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white; border-radius: 10px; font-size: 13px;
          font-weight: 600; text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(79,70,229,0.3);
        }
        .btn-apply:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(79,70,229,0.4); }
        .btn-ask-ai {
          flex: 1; padding: 9px 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8; border-radius: 10px; font-size: 13px;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-ask-ai:hover { background: rgba(99,102,241,0.15); color: #818cf8; border-color: rgba(99,102,241,0.3); }

        .side-chat {
          width: 320px; flex-shrink: 0;
          background: rgba(15,15,30,0.9);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 16px; overflow: hidden;
          position: sticky; top: 80px;
          display: flex; flex-direction: column;
          max-height: calc(100vh - 100px);
        }
        .side-chat-header {
          display: flex; align-items: center; gap: 8px;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(99,102,241,0.15);
          color: #818cf8; font-weight: 600; font-size: 14px;
        }
        .side-chat-messages {
          flex: 1; overflow-y: auto; padding: 12px;
          min-height: 300px;
        }
        .side-chat-welcome {
          color: #475569; font-size: 13px; text-align: center;
          padding: 20px; line-height: 1.6;
        }
        /* Reuse msg styles from ChatPage */
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
        .msg-link { color:#818cf8; text-decoration:none; }

        @media (max-width: 900px) { .side-chat { display: none; } }
        @media (max-width: 640px) { .bourses-header { flex-direction: column; gap: 12px; } }
      `}</style>
    </div>
  );
}
