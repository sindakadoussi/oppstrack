import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api';

export default function ProfilPage({ user, setUser, handleLogout, handleQuickReply }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name:    user?.name    || '',
    pays:    user?.pays    || '',
    niveau:  user?.niveau  || '',
    domaine: user?.domaine || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  // Sync form when user prop changes (after AI updates profile)
  useEffect(() => {
    if (user) {
      setForm({
        name:    user.name    || '',
        pays:    user.pays    || '',
        niveau:  user.niveau  || '',
        domaine: user.domaine || '',
      });
    }
  }, [user]);

  const niveaux  = ['Licence', 'Master 1', 'Master 2', 'Doctorat', 'Post-doc', 'Ingénieur'];
  const paysList = ['France', 'USA', 'UK', 'Canada', 'Allemagne', 'Belgique', 'Suisse', 'Japon', 'Australie', 'Autre'];
  const domaines = ['Informatique', 'Médecine', 'Droit', 'Sciences', 'Arts', 'Business', 'Ingénierie', 'Lettres', 'Sciences sociales', 'Autre'];

  const profileComplete = !!(user?.pays && user?.niveau && user?.domaine);
  const missingFields   = ['pays', 'niveau', 'domaine'].filter(f => !user?.[f]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Save failed');
      const updated = { ...user, ...form };
      localStorage.setItem('opps_user', JSON.stringify(updated));
      setUser(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="profil-locked">
        <span>👤</span>
        <h3>Profil non disponible</h3>
        <p>Connectez-vous pour accéder à votre profil</p>
        <button onClick={() => handleQuickReply('Je veux me connecter')}>🔐 Se connecter</button>
        <style>{`
          .profil-locked { display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:400px;gap:16px;text-align:center;color:#64748b; }
          .profil-locked span { font-size:48px; }
          .profil-locked h3 { font-size:1.3rem;color:#e2e8f0; }
          .profil-locked button { padding:12px 24px;border-radius:12px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;border:none;font-size:14px;font-weight:600;cursor:pointer; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="profil-page">
      <div className="profil-container">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="profil-hero">
          <div className="profil-avatar">
            {(user.name || user.email || 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2>{user.name || 'Utilisateur'}</h2>
            <p>{user.email}</p>
            {saved && <span className="save-badge">✅ Profil mis à jour !</span>}
          </div>
          {!editing && (
            <button className="btn-edit" onClick={() => setEditing(true)}>✏️ Modifier</button>
          )}
        </div>

        {/* ── Completion banner ────────────────────────────────────── */}
        {!profileComplete && (
          <div className="profil-incomplete-banner">
            <span>⚠️</span>
            <div>
              <strong>Profil incomplet</strong>
              <p>Complétez votre profil pour recevoir des recommandations personnalisées.</p>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Manquant : {missingFields.map(f => ({ pays: '🌍 Pays cible', niveau: '🎓 Niveau', domaine: '📚 Domaine' }[f])).join(', ')}
              </p>
            </div>
            <button className="btn-complete" onClick={() => setEditing(true)}>Compléter</button>
          </div>
        )}

        {/* ── Fields / Edit form ───────────────────────────────────── */}
        <div className="profil-card">
          <h3>Informations personnelles</h3>

          {editing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Nom complet</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Votre nom complet"
                />
              </div>
              <div className="form-group">
                <label>Pays cible 🌍</label>
                <select value={form.pays} onChange={e => setForm({ ...form, pays: e.target.value })}>
                  <option value="">Choisir un pays</option>
                  {paysList.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Niveau d'études 🎓</label>
                <select value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })}>
                  <option value="">Choisir un niveau</option>
                  {niveaux.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Domaine d'études 📚</label>
                <select value={form.domaine} onChange={e => setForm({ ...form, domaine: e.target.value })}>
                  <option value="">Choisir un domaine</option>
                  {domaines.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-actions">
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
                </button>
                <button className="btn-cancel" onClick={() => setEditing(false)}>Annuler</button>
              </div>
            </div>
          ) : (
            <div className="profil-fields">
              {[
                { icon: '👤', label: 'Nom complet',       value: user.name,    field: 'name'    },
                { icon: '📧', label: 'Email',              value: user.email,   field: 'email'   },
                { icon: '🌍', label: 'Pays cible',         value: user.pays,    field: 'pays'    },
                { icon: '🎓', label: "Niveau d'études",    value: user.niveau,  field: 'niveau'  },
                { icon: '📚', label: 'Domaine',            value: user.domaine, field: 'domaine' },
              ].map((f, i) => (
                <div key={i} className={`profil-field-row ${!f.value && f.field !== 'email' ? 'missing' : ''}`}>
                  <span className="pf-icon">{f.icon}</span>
                  <div className="pf-info">
                    <span className="pf-label">{f.label}</span>
                    <span className={`pf-value ${!f.value ? 'empty' : ''}`}>
                      {f.value || <em>Non renseigné</em>}
                    </span>
                  </div>
                  {!f.value && f.field !== 'email' && (
                    <span className="missing-dot" title="Champ manquant">●</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Profile completion percentage ────────────────────────── */}
        <div className="profil-progress-card">
          <div className="progress-header">
            <span>Complétude du profil</span>
            <span className="progress-pct">
              {Math.round((['name','pays','niveau','domaine'].filter(f => user?.[f]).length / 4) * 100)}%
            </span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.round((['name','pays','niveau','domaine'].filter(f => user?.[f]).length / 4) * 100)}%`
              }}
            />
          </div>
          <p className="progress-hint">
            {profileComplete
              ? '✅ Profil complet ! Vous pouvez obtenir des recommandations personnalisées.'
              : `Complétez votre profil pour débloquer les recommandations IA.`}
          </p>
        </div>

        {/* ── Actions ─────────────────────────────────────────────── */}
        <div className="profil-actions">
          <button
            className="btn-chat-update"
            onClick={() => handleQuickReply('Je veux mettre à jour mon profil')}>
            🤖 Mettre à jour via l'IA
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            ↩ Déconnexion
          </button>
        </div>

      </div>

      <style>{`
        .profil-page { width:100%;padding:32px 16px;display:flex;justify-content:center; }
        .profil-container { width:100%;max-width:520px;display:flex;flex-direction:column;gap:20px; }

        .profil-hero {
          display:flex;align-items:center;gap:20px;
          padding:24px 28px;
          background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1));
          border:1px solid rgba(99,102,241,0.25);border-radius:20px;
        }
        .profil-avatar {
          width:60px;height:60px;border-radius:50%;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          display:flex;align-items:center;justify-content:center;
          font-size:26px;font-weight:800;color:white;flex-shrink:0;
        }
        .profil-hero h2 { font-size:1.3rem;font-weight:800;color:#f1f5f9;margin-bottom:4px; }
        .profil-hero p  { color:#64748b;font-size:13px; }
        .save-badge     { font-size:12px;color:#10b981;display:block;margin-top:4px; }
        .btn-edit {
          padding:8px 16px;border-radius:10px;
          background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);
          color:#818cf8;font-size:13px;cursor:pointer;white-space:nowrap;
        }

        .profil-incomplete-banner {
          display:flex;align-items:center;gap:14px;
          padding:16px 20px;
          background:rgba(245,158,11,0.08);
          border:1px solid rgba(245,158,11,0.25);
          border-radius:14px;font-size:13px;color:#fbbf24;
        }
        .profil-incomplete-banner span { font-size:22px; }
        .profil-incomplete-banner strong { color:#fde68a;display:block;margin-bottom:4px; }
        .profil-incomplete-banner p { margin:0;color:#94a3b8; }
        .btn-complete {
          margin-left:auto;padding:8px 14px;border-radius:8px;white-space:nowrap;
          background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);
          color:#fbbf24;font-size:12px;font-weight:600;cursor:pointer;
        }

        .profil-card {
          background:rgba(15,15,30,0.8);
          border:1px solid rgba(99,102,241,0.15);
          border-radius:16px;padding:24px;
        }
        .profil-card h3 { font-size:14px;font-weight:700;color:#e2e8f0;margin-bottom:20px; }
        .profil-fields  { display:flex;flex-direction:column;gap:10px; }
        .profil-field-row {
          display:flex;gap:12px;align-items:center;
          padding:12px;background:rgba(255,255,255,0.03);border-radius:10px;
          border:1px solid transparent;transition:border-color 0.2s;
        }
        .profil-field-row.missing { border-color:rgba(245,158,11,0.15); }
        .pf-icon  { font-size:18px; }
        .pf-info  { flex:1; }
        .pf-label { display:block;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px; }
        .pf-value { font-size:14px;color:#e2e8f0;font-weight:500; }
        .pf-value.empty em { color:#334155;font-style:normal; }
        .missing-dot { color:#f59e0b;font-size:10px;margin-left:auto; }

        .edit-form   { display:flex;flex-direction:column;gap:16px; }
        .form-group  { display:flex;flex-direction:column;gap:6px; }
        .form-group label { font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px; }
        .form-group input, .form-group select {
          padding:11px 14px;border-radius:10px;
          border:1px solid rgba(99,102,241,0.2);
          background:rgba(255,255,255,0.04);color:#e2e8f0;
          font-size:14px;outline:none;transition:border-color 0.2s;
        }
        .form-group input:focus,.form-group select:focus { border-color:rgba(99,102,241,0.5); }
        .form-group select option { background:#0f0f1e; }
        .form-actions  { display:flex;gap:10px; }
        .btn-save      { flex:1;padding:11px;border-radius:10px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;border:none;font-size:14px;font-weight:600;cursor:pointer; }
        .btn-save:disabled { opacity:0.6;cursor:wait; }
        .btn-cancel    { padding:11px 18px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#64748b;font-size:14px;cursor:pointer; }

        .profil-progress-card {
          background:rgba(15,15,30,0.8);
          border:1px solid rgba(99,102,241,0.15);
          border-radius:16px;padding:20px;
        }
        .progress-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:13px;color:#94a3b8; }
        .progress-pct    { font-weight:700;color:#818cf8; }
        .progress-bar-bg { height:6px;background:rgba(99,102,241,0.1);border-radius:99px;overflow:hidden; }
        .progress-bar-fill { height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:99px;transition:width 0.5s ease; }
        .progress-hint   { font-size:12px;color:#64748b;margin-top:10px; }

        .profil-actions     { display:flex;gap:10px; }
        .btn-chat-update    { flex:1;padding:12px;border-radius:12px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);color:#818cf8;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s; }
        .btn-chat-update:hover { background:rgba(99,102,241,0.25); }
        .btn-logout         { padding:12px 20px;border-radius:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#f87171;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s; }
        .btn-logout:hover   { background:rgba(239,68,68,0.2); }
      `}</style>
    </div>
  );
}
