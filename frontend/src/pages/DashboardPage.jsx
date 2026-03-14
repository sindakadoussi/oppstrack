import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api';

export default function DashboardPage({ user, bourses, entretienScores, setView, handleQuickReply }) {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) fetchCandidatures();
  }, [user]);

  const fetchCandidatures = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/candidatures?where[user][equals]=${user.id}&limit=10&sort=-createdAt`);
      const data = await res.json();
      setCandidatures(data.docs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const profileCompletion = () => {
    if (!user) return 0;
    const fields = ['name', 'email', 'pays', 'niveau', 'domaine'];
    return Math.round((fields.filter(f => user[f]).length / fields.length) * 100);
  };

  const lastScore = entretienScores?.[0]?.score;
  const avgScore = entretienScores?.length > 0
    ? Math.round(entretienScores.reduce((a, b) => a + b.score, 0) / entretienScores.length)
    : null;

  const getStatusColor = (status) => {
    const c = { 'En cours': '#6366f1', 'Soumise': '#f59e0b', 'Acceptée': '#10b981', 'Refusée': '#ef4444' };
    return c[status] || '#64748b';
  };

  if (!user) {
    return (
      <div className="dashboard-locked">
        <span>🔒</span>
        <h3>Dashboard personnel</h3>
        <p>Connectez-vous pour accéder à votre tableau de bord personnalisé</p>
        <button className="btn-login-dash" onClick={() => handleQuickReply('Je veux me connecter')}>
          🔐 Se connecter
        </button>
        <style>{`
          .dashboard-locked { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:400px; gap:16px; text-align:center; color:#64748b; padding:40px; }
          .dashboard-locked span { font-size:48px; }
          .dashboard-locked h3 { font-size:1.3rem; color:#e2e8f0; }
          .btn-login-dash { padding:12px 24px; border-radius:12px; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:white; border:none; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; }
          .btn-login-dash:hover { transform:translateY(-1px); }
        `}</style>
      </div>
    );
  }

  const completion = profileCompletion();

  return (
    <div className="dashboard-page">
      {/* Welcome banner */}
      <div className="dash-banner">
        <div className="banner-left">
          <div className="banner-avatar">{(user.name || user.email || 'U')[0].toUpperCase()}</div>
          <div>
            <h2>Bonjour, {user.name || user.email?.split('@')[0]} 👋</h2>
            <p>Voici un résumé de votre activité sur OppsTrack</p>
          </div>
        </div>
        <div className="banner-right">
          <button className="quick-action" onClick={() => setView('bourses')}>🎓 Voir les bourses</button>
          <button className="quick-action" onClick={() => setView('entretien')}>🎙️ Entretien IA</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-val">{candidatures.length}</span>
            <span className="stat-lbl">Candidatures</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎙️</div>
          <div className="stat-info">
            <span className="stat-val">{entretienScores?.length || 0}</span>
            <span className="stat-lbl">Entretiens passés</span>
          </div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <span className="stat-val" style={{ color: lastScore >= 80 ? '#10b981' : lastScore >= 60 ? '#f59e0b' : '#ef4444' }}>
              {lastScore ? `${lastScore}/100` : '—'}
            </span>
            <span className="stat-lbl">Dernier score entretien</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-info">
            <span className="stat-val">{bourses.length}</span>
            <span className="stat-lbl">Bourses disponibles</span>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        {/* Profile completion */}
        <div className="dash-card profile-card">
          <div className="card-header-dash">
            <h3>👤 Complétion du profil</h3>
            <span className="completion-pct">{completion}%</span>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${completion}%`, background: completion === 100 ? '#10b981' : 'linear-gradient(90deg, #6366f1, #a855f7)' }} />
            </div>
          </div>
          <div className="profile-fields">
            {[
              { key: 'name', label: 'Nom complet', icon: '👤' },
              { key: 'email', label: 'Email', icon: '📧' },
              { key: 'pays', label: 'Pays cible', icon: '🌍' },
              { key: 'niveau', label: "Niveau d'études", icon: '🎓' },
              { key: 'domaine', label: "Domaine d'études", icon: '📚' },
            ].map(f => (
              <div key={f.key} className={`profile-field ${user[f.key] ? 'filled' : 'empty'}`}>
                <span>{f.icon}</span>
                <span className="field-label">{f.label}</span>
                <span className="field-value">{user[f.key] || <em>Non renseigné</em>}</span>
                {!user[f.key] && (
                  <button className="field-fill-btn" onClick={() => handleQuickReply(`Je veux mettre à jour mon ${f.label.toLowerCase()}`)}>
                    + Compléter
                  </button>
                )}
              </div>
            ))}
          </div>
          <button className="btn-edit-profile" onClick={() => setView('profil')}>
            ✏️ Modifier le profil
          </button>
        </div>

        {/* Candidatures */}
        <div className="dash-card">
          <div className="card-header-dash">
            <h3>📬 Mes candidatures</h3>
            {candidatures.length > 0 && <span className="badge-count">{candidatures.length}</span>}
          </div>
          {loading ? (
            <div className="loading-state">Chargement...</div>
          ) : candidatures.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p>Aucune candidature encore</p>
              <button className="btn-start-cand" onClick={() => setView('bourses')}>
                Découvrir les bourses →
              </button>
            </div>
          ) : (
            <div className="candidatures-list">
              {candidatures.map((c, i) => (
                <div key={i} className="candidature-item">
                  <div className="cand-info">
                    <span className="cand-name">{c.bourse?.nom || c.bourseName || 'Bourse inconnue'}</span>
                    <span className="cand-pays">{c.bourse?.pays || ''}</span>
                  </div>
                  <span className="cand-status" style={{ color: getStatusColor(c.status), borderColor: getStatusColor(c.status) + '40', background: getStatusColor(c.status) + '15' }}>
                    {c.status || 'En cours'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Entretien progress */}
        <div className="dash-card">
          <div className="card-header-dash">
            <h3>🎙️ Progression entretiens</h3>
            {avgScore && <span className="avg-score">Moy: {avgScore}/100</span>}
          </div>
          {entretienScores?.length === 0 ? (
            <div className="empty-state">
              <span>🎙️</span>
              <p>Pas encore d'entretien</p>
              <button className="btn-start-cand" onClick={() => setView('entretien')}>
                Commencer →
              </button>
            </div>
          ) : (
            <div className="scores-timeline">
              {entretienScores.map((s, i) => (
                <div key={i} className="score-timeline-item">
                  <div className="stl-bar-wrap">
                    <div className="stl-bar" style={{
                      width: `${s.score}%`,
                      background: s.score >= 80 ? '#10b981' : s.score >= 60 ? '#f59e0b' : '#ef4444'
                    }}/>
                  </div>
                  <span className="stl-score">{s.score}/100</span>
                  <span className="stl-date">{s.date || new Date(s.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              ))}
            </div>
          )}
          <button className="btn-start-cand" style={{ marginTop: 'auto', width: '100%' }} onClick={() => setView('entretien')}>
            {entretienScores?.length > 0 ? '🔄 Nouvel entretien' : '🎙️ Démarrer'}
          </button>
        </div>

        {/* Quick actions */}
        <div className="dash-card actions-card">
          <h3>⚡ Actions rapides</h3>
          <div className="quick-actions-grid">
            {[
              { icon: '🔍', label: 'Trouver mes bourses', action: () => handleQuickReply('Quelles bourses correspondent à mon profil ?') },
              { icon: '📄', label: 'Analyser mon CV', action: () => setView('cv') },
              { icon: '🗺️', label: 'Voir la Roadmap', action: () => setView('roadmap') },
              { icon: '💬', label: 'Chat avec l\'IA', action: () => setView('accueil') },
            ].map((a, i) => (
              <button key={i} className="quick-action-card" onClick={a.action}>
                <span className="qa-icon">{a.icon}</span>
                <span className="qa-label">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-page { width: 100%; padding: 32px 16px; max-width: 1100px; margin: 0 auto; }
        .dash-banner {
          display: flex; justify-content: space-between; align-items: center;
          padding: 24px 28px; background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1));
          border: 1px solid rgba(99,102,241,0.2); border-radius: 20px;
          margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
        }
        .banner-left { display: flex; align-items: center; gap: 16px; }
        .banner-avatar {
          width: 52px; height: 52px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 800; color: white;
        }
        .banner-left h2 { font-size: 1.3rem; font-weight: 800; color: #f1f5f9; margin-bottom: 4px; }
        .banner-left p { color: #64748b; font-size: 13px; }
        .banner-right { display: flex; gap: 10px; flex-wrap: wrap; }
        .quick-action {
          padding: 8px 16px; border-radius: 10px;
          background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3);
          color: #818cf8; font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.2s;
        }
        .quick-action:hover { background: rgba(99,102,241,0.25); }

        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .stat-card {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 20px; background: rgba(15,15,30,0.7);
          border: 1px solid rgba(99,102,241,0.15); border-radius: 14px;
          transition: all 0.2s;
        }
        .stat-card.highlight { border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.08); }
        .stat-icon { font-size: 24px; }
        .stat-val { display: block; font-size: 1.3rem; font-weight: 900; color: #f1f5f9; }
        .stat-lbl { font-size: 11px; color: #475569; }

        .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .dash-card {
          background: rgba(15,15,30,0.7); border: 1px solid rgba(99,102,241,0.15);
          border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 16px;
        }
        .card-header-dash { display: flex; justify-content: space-between; align-items: center; }
        .card-header-dash h3 { font-size: 14px; font-weight: 700; color: #e2e8f0; }
        .completion-pct { font-size: 1.1rem; font-weight: 800; color: #818cf8; }
        .badge-count { width: 22px; height: 22px; border-radius: 50%; background: rgba(99,102,241,0.3); color: #818cf8; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .avg-score { font-size: 12px; color: #f59e0b; font-weight: 600; }

        .progress-bar-wrap { }
        .progress-bar-bg { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 3px; transition: width 0.8s ease; }

        .profile-fields { display: flex; flex-direction: column; gap: 6px; }
        .profile-field {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; border-radius: 8px; font-size: 13px;
          background: rgba(255,255,255,0.03);
        }
        .profile-field.filled { border-left: 2px solid #10b981; }
        .profile-field.empty { border-left: 2px solid #ef444440; }
        .field-label { color: #64748b; flex: 1; }
        .field-value { color: #e2e8f0; font-weight: 500; }
        .field-value em { color: #334155; font-style: normal; }
        .field-fill-btn { padding: 3px 8px; border-radius: 6px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #818cf8; font-size: 11px; cursor: pointer; white-space: nowrap; }
        .btn-edit-profile { padding: 9px; border-radius: 10px; background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.25); color: #818cf8; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .btn-edit-profile:hover { background: rgba(99,102,241,0.22); }

        .loading-state, .empty-state { text-align: center; padding: 32px; color: #475569; }
        .empty-state span { font-size: 32px; display: block; margin-bottom: 8px; }
        .empty-state p { font-size: 13px; margin-bottom: 12px; }
        .btn-start-cand { padding: 8px 16px; border-radius: 8px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #818cf8; font-size: 12px; cursor: pointer; transition: all 0.2s; }
        .btn-start-cand:hover { background: rgba(99,102,241,0.25); }

        .candidatures-list { display: flex; flex-direction: column; gap: 8px; }
        .candidature-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.03); border-radius: 10px; }
        .cand-info { display: flex; flex-direction: column; gap: 2px; }
        .cand-name { font-size: 13px; font-weight: 600; color: #e2e8f0; }
        .cand-pays { font-size: 11px; color: #64748b; }
        .cand-status { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 8px; border: 1px solid; }

        .scores-timeline { display: flex; flex-direction: column; gap: 8px; }
        .score-timeline-item { display: flex; align-items: center; gap: 10px; }
        .stl-bar-wrap { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
        .stl-bar { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
        .stl-score { font-size: 12px; color: #94a3b8; white-space: nowrap; min-width: 48px; text-align: right; }
        .stl-date { font-size: 11px; color: #475569; white-space: nowrap; }

        .actions-card { grid-column: 1 / -1; }
        .actions-card h3 { font-size: 14px; font-weight: 700; color: #e2e8f0; }
        .quick-actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .quick-action-card {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 20px 16px; border-radius: 14px;
          background: rgba(99,102,241,0.07); border: 1px solid rgba(99,102,241,0.15);
          cursor: pointer; transition: all 0.2s;
        }
        .quick-action-card:hover { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); transform: translateY(-2px); }
        .qa-icon { font-size: 28px; }
        .qa-label { font-size: 12px; color: #64748b; text-align: center; font-weight: 500; }

        @media (max-width: 900px) { .stats-row { grid-template-columns: 1fr 1fr; } .dash-grid { grid-template-columns: 1fr; } .quick-actions-grid { grid-template-columns: 1fr 1fr; } .actions-card { grid-column: 1; } }
        @media (max-width: 480px) { .stats-row { grid-template-columns: 1fr 1fr; } .quick-actions-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </div>
  );
}
