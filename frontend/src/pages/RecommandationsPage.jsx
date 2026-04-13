// RecommandationsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/config/axiosInstance';
import BourseCard from '../components/BourseCard';
import BourseDrawer from '../components/Boursedrawer';
import ChatInput from '../components/ChatInput';
import { API_ROUTES } from '@/config/routes';
import {  WEBHOOK_ROUTES } from '@/config/routes';

// ── Modal de connexion (magic link) ─────────────────────────────────────────
function LoginModal({ onClose }) {
  const [email,  setEmail]  = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const send = async () => {
    if (!email || !email.includes('@')) { setErrMsg('Email invalide'); return; }
    setStatus('sending');
    try {
      await axiosInstance.post('/api/users/request-magic-link', {
        email: email.trim().toLowerCase(),
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrMsg(err.response?.data?.message || 'Impossible de contacter le serveur');
    }
  };

  return (
    <div style={M.overlay}>
      <div style={M.box}>
        <div style={M.head}>
          <span style={{ fontSize: 22 }}>🔐</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Connexion à OppsTrack</span>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={M.body}>
          {status === 'idle' && (
            <>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                Entrez votre email pour recevoir un <strong style={{ color: '#1a3a6b' }}>lien de connexion magique</strong>.
              </p>
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                autoFocus
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                style={M.input}
              />
              {errMsg && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{errMsg}</div>}
              <button style={M.btn} onClick={send}>✉️ Envoyer le lien magique</button>
            </>
          )}
          {status === 'sending' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={M.spinner} />
              <p style={{ color: '#64748b', marginTop: 14 }}>Envoi en cours...</p>
            </div>
          )}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>✉️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 8 }}>Lien envoyé !</div>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
                Vérifiez votre boîte mail (et les spams).<br/>
                Cliquez sur le lien pour vous connecter.
              </p>
              <button style={{ ...M.btn, background: '#166534', marginTop: 20 }} onClick={onClose}>
                ✓ Fermer
              </button>
            </div>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#dc2626', marginBottom: 12 }}>{errMsg}</p>
              <button style={{ ...M.btn, background: '#dc2626' }} onClick={() => { setStatus('idle'); setErrMsg(''); }}>
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={M.backdrop} onClick={onClose} />
    </div>
  );
}

const M = {
  overlay:  { position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' },
  backdrop: { position:'absolute', inset:0, background:'rgba(26,58,107,0.45)', backdropFilter:'blur(6px)' },
  box:      { position:'relative', zIndex:2001, width:400, maxWidth:'92vw', background:'#ffffff', borderRadius:10, overflow:'hidden', border:'1px solid #e2e8f0', boxShadow:'0 20px 48px rgba(26,58,107,0.18)', borderTop:'3px solid #f5a623' },
  head:     { display:'flex', alignItems:'center', gap:10, padding:'16px 20px', background:'#1a3a6b', borderBottom:'1px solid rgba(255,255,255,0.1)' },
  closeBtn: { marginLeft:'auto', background:'rgba(255,255,255,0.12)', border:'none', color:'#fff', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' },
  body:     { padding:'24px' },
  input:    { width:'100%', padding:'11px 14px', borderRadius:6, border:'1.5px solid #e2e8f0', background:'#f8fafc', color:'#1a3a6b', fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:4 },
  btn:      { width:'100%', marginTop:16, padding:'12px', borderRadius:6, border:'none', background:'#1a3a6b', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'opacity 0.2s' },
  spinner:  { width:40, height:40, border:'3px solid #eff6ff', borderTopColor:'#1a3a6b', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' },
};

// Styles pour l'état non connecté
const S_locked = {
  locked: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8f9fc',
    padding: 24,
  },
  lockedCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '48px 40px',
    boxShadow: '0 4px 20px rgba(26,58,107,0.08)',
    maxWidth: 380,
    width: '100%',
  },
  lockBtn: {
    padding: '12px 32px',
    borderRadius: 6,
    background: '#1a3a6b',
    color: 'white',
    border: 'none',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
};


export default function RecommandationsPage({ 
  user, 
  handleSend,
  messages,
  input,
  setInput,
  loading: chatLoading,      // Loading du chat
  chatContainerRef,
  handleQuickReply,
  setView, 
  onStarChange 
}) {
  const [showLoginModal, setShowLoginModal] = useState(false); 
  const [loading, setLoading] = useState(false);  
  const [showChat, setShowChat] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  const [actives, setActives] = useState([]);
  const [expirees, setExpirees] = useState([]);
  const [starredNoms, setStarredNoms] = useState(new Set());
  const [appliedNoms, setAppliedNoms] = useState(new Set());
  

  // 🔒 Si non connecté, afficher le message verrouillé
if (!user) {
  return (
    <>
      <div style={S_locked.locked}>
        <div style={S_locked.lockedCard}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
          <h3 style={{ color: '#1a3a6b', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>
            Recommandations non disponibles
          </h3>
          <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6, maxWidth: 280, textAlign: 'center', margin: '0 0 24px' }}>
            Connectez-vous pour découvrir les bourses parfaitement adaptées à votre profil.
          </p>
          <button style={S_locked.lockBtn} onClick={() => setShowLoginModal(true)}>
            🔐 Se connecter
          </button>
        </div>
      </div>
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

  // ====================== CHARGEMENT DES RECOMMANDATIONS ======================
  const loadRecommandations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const { data: userData } = await axiosInstance.get(`/api/users/${user.id}`, { params: { depth: 0 } });
      
      // Favoris
      const { data: dataFav } = await axiosInstance.get('/api/favoris', {
        params: { 'where[user][equals]': user.id, limit: 1, depth: 0 }
      });
      const docFav = dataFav.docs?.[0];
      const newStarred = new Set((docFav?.bourses || []).map(b => b.nom?.trim().toLowerCase()));
      setStarredNoms(newStarred);
      onStarChange?.(newStarred.size);

      // Roadmaps (candidatures)
      const { data: dataRoadmap } = await axiosInstance.get(API_ROUTES.roadmap.list, {
        params: { 'where[userId][equals]': user.id, limit: 100, depth: 0 }
      });
      setAppliedNoms(new Set((dataRoadmap.docs || []).map(b => b.nom?.trim().toLowerCase())));

      const profNiveau = (userData.niveau || userData.currentLevel || user.niveau || '').toLowerCase().trim();
      const profDomaine = (userData.domaine || userData.fieldOfStudy || user.domaine || '').toLowerCase().trim();
      const profPays = (userData.pays || user.pays || '').toLowerCase().trim();

      const { data: dataBourses } = await axiosInstance.get(API_ROUTES.bourses.list, {
        params: { limit: 200, depth: 0 }
      });
      const bourses = dataBourses.docs || [];

      const scored = bourses.filter(b => b.tunisienEligible !== 'non').map(b => {
        let score = 0;
        const reasons = [];
        const bN = (b.niveau || '').toLowerCase();
        const bD = (b.domaine || '').toLowerCase();
        const bP = (b.pays || '').toLowerCase();

        if (b.tunisienEligible === 'oui') { score += 30; reasons.push('Ouverte aux Tunisiens'); }
        if (profNiveau && bN.includes(profNiveau)) { score += 25; reasons.push(`Niveau ${b.niveau} correspond`); }
        else if (bN.includes('tous') || bN === '') { score += 12; reasons.push('Tous niveaux acceptés'); }

        if (profDomaine && bD.includes(profDomaine)) { score += 20; reasons.push(`Domaine ${b.domaine} correspond`); }
        else if (bD.includes('tous') || bD === '') { score += 10; reasons.push('Tous domaines acceptés'); }

        if (b.statut === 'active') { score += 15; reasons.push('Candidatures ouvertes'); }
        if (b.statut === 'a_venir') { score += 8; reasons.push('Bientôt disponible'); }

        if (b.dateLimite) {
          const j = Math.floor((new Date(b.dateLimite) - new Date()) / 86400000);
          if (j > 30) score += 3;
        }
        if (profPays && (bP.includes(profPays) || bP.includes('international'))) score += 2;

        return { ...b, matchScore: score, matchReasons: reasons };
      });

      const newActives = scored
        .filter(b => b.statut !== 'expiree' && b.matchScore > 25)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 8);

      const newExpirees = scored
        .filter(b => b.statut === 'expiree' && b.matchScore > 25)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 4);

      const activesFinales = newActives.length > 0 
        ? newActives 
        : bourses.filter(b => b.statut !== 'expiree').slice(0, 5).map(b => ({ ...b, matchScore: 0, matchReasons: [] }));

      setActives(activesFinales);
      setExpirees(newExpirees);
    } catch (err) {
      setError('Impossible de charger les recommandations : ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [user, onStarChange]);

  const handleStar = async (bourse, isStarred) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id) return;

    try {
      const { data } = await axiosInstance.get('/api/favoris', {
        params: { 'where[user][equals]': user.id, limit: 1, depth: 0 }
      });
      const doc = data.docs?.[0];

      if (isStarred) {
        if (!doc?.id) return;
        await axiosInstance.patch(`/api/favoris/${doc.id}`, {
          bourses: (doc.bourses || []).filter(b => b.nom?.trim().toLowerCase() !== nomKey)
        });
        setStarredNoms(prev => {
          const s = new Set(prev);
          s.delete(nomKey);
          onStarChange?.(s.size);
          return s;
        });
      } else {
        const nb = {
          nom: bourse.nom,
          pays: bourse.pays || '',
          lienOfficiel: bourse.lienOfficiel || '',
          financement: bourse.financement || '',
          dateLimite: bourse.dateLimite || null,
          ajouteLe: new Date().toISOString()
        };
        if (doc?.id) await axiosInstance.patch(`/api/favoris/${doc.id}`, { bourses: [...(doc.bourses || []), nb] });
        else await axiosInstance.post('/api/favoris', { user: user.id, userEmail: user.email || '', bourses: [nb] });
        setStarredNoms(prev => {
          const s = new Set([...prev, nomKey]);
          onStarChange?.(s.size);
          return s;
        });
      }
    } catch (err) {
      console.error('[handleStar]', err);
    }
  };

  const handleApply = async (bourse) => {
  const nomKey = bourse.nom?.trim().toLowerCase();
  if (!user?.id || appliedNoms.has(nomKey)) return;

  try {
    // ÉTAPE 1 : Création dans Payload CMS
    const res = await axiosInstance.post(API_ROUTES.roadmap.create, {
      userId: user.id,
      userEmail: user.email || '',
      nom: bourse.nom,
      pays: bourse.pays || '',
      lienOfficiel: bourse.lienOfficiel || '',
      financement: bourse.financement || '',
      dateLimite: bourse.dateLimite || null,
      ajouteLe: new Date().toISOString(),
      statut: 'en_cours',
      etapeCourante: 0,
    });

    // On récupère l'ID généré par Payload
    const newRoadmapId = res.data.doc.id;

    // ÉTAPE 2 : Déclenchement de n8n pour générer la roadmap avec l'IA
    // On envoie l'ID pour que n8n puisse faire un PATCH plus tard
    await axiosInstance.post(WEBHOOK_ROUTES.generateRoadmap, {
      roadmapId: newRoadmapId,
      user: {
        id: user.id,
        email: user.email,
        niveau: user.niveau, // Optionnel : aide l'IA à personnaliser
        domaine: user.domaine
      },
      bourse: {
        nom: bourse.nom,
        pays: bourse.pays,
        lien: bourse.lienOfficiel
      }
    });

    // ÉTAPE 3 : Mise à jour de l'UI
    setAppliedNoms(prev => new Set([...prev, nomKey]));
    
    // Petit feedback visuel avant redirection
    setTimeout(() => setView?.('roadmap'), 1000);
    
  } catch (err) {
    console.error('[handleApply Error]', err);
    alert("Erreur lors de l'initialisation de votre candidature.");
  }
};

  const handleAskAI = useCallback((bourse) => {
    setShowChat(true);
    setInput(`Peux-tu me dire si je suis éligible à la bourse "${bourse.nom}" en ${bourse.pays} ?`);
  }, [setInput]);

  useEffect(() => {
    loadRecommandations();
  }, [loadRecommandations]);

  const filtered = filter === 'actives' ? actives 
    : filter === 'expirees' ? expirees 
    : [...actives, ...expirees];

  

  return (
    <div style={{ width: '100%', background: '#f8f9fc', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", position: 'relative', paddingBottom: 40 }}>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, padding: '20px 0 0', flexWrap: 'wrap' }}>
          {[
            { num: actives.length,   color: '#166534', bg: '#f0fdf4', border: '#bbf7d0', label: 'Actives' },
            { num: expirees.length,  color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'À préparer' },
            { num: starredNoms.size, color: '#d97706', bg: '#fefce8', border: '#fde68a', label: '★ Favoris' },
            { num: appliedNoms.size, color: '#1a3a6b', bg: '#eff6ff', border: '#bfdbfe', label: '🗺️ Roadmap' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '12px 20px', minWidth: 80, textAlign: 'center', boxShadow: '0 1px 4px rgba(26,58,107,0.06)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.num}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 0, padding: '16px 0 0', flexWrap: 'wrap', background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 16, overflow: 'hidden', width: 'fit-content' }}>
          {[
            { id: 'all',      label: `Toutes (${actives.length + expirees.length})` },
            { id: 'actives',  label: `✅ Actives (${actives.length})` },
            { id: 'expirees', label: `📅 À préparer (${expirees.length})` },
          ].map((f, i) => (
            <button 
              key={f.id}
              style={{
                padding: '9px 20px',
                border: 'none',
                borderRight: i < 2 ? '1px solid #e2e8f0' : 'none',
                background: filter === f.id ? '#1a3a6b' : '#fff',
                color: filter === f.id ? '#fff' : '#64748b',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: filter === f.id ? 700 : 400,
              }}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#1a3a6b', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#64748b', marginTop: 16 }}>Analyse de votre profil en cours...</p>
          </div>
        )}

        {/* Erreur */}
        {error && !loading && (
          <div style={{ margin: '20px 0', padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            ⚠️ {error}
            <button style={{ padding: '6px 14px', borderRadius: 6, background: '#dc2626', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }} onClick={loadRecommandations}>Réessayer</button>
          </div>
        )}

        {/* Contenu principal : Grille + Chat à gauche */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginTop: 16 }}>

          {/* Grille des BourseCard */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a3a6b', marginBottom: 8 }}>Aucune recommandation trouvée</div>
                <p style={{ color: '#64748b' }}>Complétez votre profil pour de meilleures suggestions</p>
              </div>
            ) : (
              filtered.map(b => (
                <BourseCard 
                  key={b.id} 
                  bourse={b}
                  user={user}
                  onAskAI={handleAskAI}
                  onClick={() => setSelected(b)}
                  starred={starredNoms.has(b.nom?.trim().toLowerCase())}
                  onStar={handleStar}
                  applied={appliedNoms.has(b.nom?.trim().toLowerCase())}
                  onApply={handleApply}
                />
              ))
            )}
          </div>

          {/* Chat latéral À GAUCHE */}
          {showChat && (
            <div style={{ 
              width: 320, 
              flexShrink: 0, 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: 10, 
              position: 'sticky', 
              top: 110, 
              display: 'flex', 
              flexDirection: 'column', 
              maxHeight: 'calc(100vh - 130px)', 
              minHeight: 0, 
              boxShadow: '0 4px 16px rgba(26,58,107,0.08)', 
              zIndex: 90 
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '14px 16px', borderBottom: '2px solid #f5a623', background: '#1a3a6b', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Assistant Bourses</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Conseils personnalisés</div>
                </div>
                <button 
                  onClick={() => setShowChat(false)} 
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 16, marginLeft: 'auto' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12 }} ref={chatContainerRef}>
                {messages.length === 0 && (
                  <div style={{ padding: 12 }}>
                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>Demandez-moi des conseils sur une bourse !</p>
                    {['Lettre de motivation ?', 'Documents requis ?'].map((q, i) => (
                      <button 
                        key={i} 
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 6, background: '#fff', border: '1px solid #e2e8f0', color: '#1a3a6b', fontSize: 12, cursor: 'pointer', marginBottom: 6 }} 
                        onClick={() => handleQuickReply(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 12, maxWidth: '92%', ...(msg.sender === 'user' ? { marginLeft: 'auto', flexDirection: 'row-reverse' } : {}) }}>
                    <div style={{ 
                      padding: '10px 14px', 
                      borderRadius: 10, 
                      fontSize: 13, 
                      lineHeight: 1.5, 
                      ...(msg.sender === 'user' ? { background: '#1a3a6b', color: '#fff' } : { background: '#f1f5f9', color: '#1a3a6b' }) 
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && <div style={{ padding: 12, fontSize: 12, color: '#94a3b8' }}>L'IA réfléchit...</div>}
              </div>

              <div style={{ padding: 12, borderTop: '1px solid #f1f5f9' }}>
                <ChatInput input={input} setInput={setInput} onSend={() => handleSend()} loading={chatLoading} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bouton flottant pour ouvrir/fermer le chat */}
      <button
        onClick={() => setShowChat(prev => !prev)}
        style={{
          position: 'fixed', 
          bottom: 24, 
          right: 24, 
          width: 56, 
          height: 56, 
          borderRadius: '50%', 
          background: '#f5a623',
          border: 'none', 
          boxShadow: '0 4px 12px rgba(26,58,107,0.3)', 
          cursor: 'pointer', 
          display: 'flex',
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: 24, 
          color: '#1a3a6b', 
          zIndex: 1000
        }}
      >
        {showChat ? '✕' : '💬'}
      </button>

      {/* Drawer des détails */}
      {selected && (
        <BourseDrawer
          bourse={selected}
          onClose={() => setSelected(null)}
          onAskAI={handleAskAI}
          starred={starredNoms.has(selected.nom?.trim().toLowerCase())}
          onStar={handleStar}
          applied={appliedNoms.has(selected.nom?.trim().toLowerCase())}
          onApply={handleApply}
          user={user}
        />
      )}

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}