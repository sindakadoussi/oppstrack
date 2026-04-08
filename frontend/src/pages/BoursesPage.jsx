// BoursesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import BourseCard from '../components/BourseCard';
import ChatInput from '../components/ChatInput';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';
import BourseDrawer from '../components/Boursedrawer';

const countryFlag = (pays) => {
  const flags = {
    'France':'🇫🇷','Allemagne':'🇩🇪','Royaume-Uni':'🇬🇧','États-Unis':'🇺🇸',
    'Canada':'🇨🇦','Japon':'🇯🇵','Chine':'🇨🇳','Australie':'🇦🇺',
    'Suisse':'🇨🇭','Pays-Bas':'🇳🇱','Maroc':'🇲🇦','Hongrie':'🇭🇺',
    'Corée du Sud':'🇰🇷','Nouvelle-Zélande':'🇳🇿','Turquie':'🇹🇷',
    'Belgique':'🇧🇪','Espagne':'🇪🇸','Italie':'🇮🇹','Portugal':'🇵🇹',
    'Roumanie':'🇷🇴','Arabie Saoudite':'🇸🇦','Brunei':'🇧🇳',
  };
  return flags[pays] || '🌍';
};

// ── Modal de connexion (magic link) ─────────────────────────────────────────
function LoginModal({ onClose }) {
  const [email,  setEmail]  = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const send = async () => {
  if (!email || !email.includes('@')) { setErrMsg('Email invalide'); return; }
  setStatus('sending');
  try {
    // ✅ Pour DEMANDER un magic link (envoi d'email)
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

export default function BoursesPage({
  bourses,
  handleSend,
  messages,
  input,
  setInput,
  loading,
  chatContainerRef,
  handleQuickReply,
  user,
  initialSelected,
  onClearInitialSelected,
}) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [search,       setSearch]       = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [filterPays,   setFilterPays]   = useState('');
  const [showChat,     setShowChat]     = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [starredNoms,  setStarredNoms]  = useState(new Set());
  const [appliedNoms,  setAppliedNoms]  = useState(new Set());

  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const resFav = await axiosInstance.get(API_ROUTES.favoris.byUser(user.id));
      setStarredNoms(new Set((resFav.data.docs?.[0]?.bourses || []).map(b => b.nom?.trim().toLowerCase())));
      const resRM = await axiosInstance.get(API_ROUTES.roadmap.byUser(user.id));
      setAppliedNoms(new Set((resRM.data.docs || []).map(b => b.nom?.trim().toLowerCase())));
    } catch (err) { console.error('[loadUserData]', err); }
  }, [user?.id]);

  useEffect(() => { loadUserData(); }, [loadUserData]);

  // ✅ Ouvrir automatiquement le drawer si initialSelected est fourni
  useEffect(() => {
    if (!initialSelected || !bourses?.length) return;
    const nomLower = initialSelected.trim().toLowerCase();
    const found = bourses.find(b =>
      b.nom?.trim().toLowerCase() === nomLower ||
      b.nom?.trim().toLowerCase().includes(nomLower) ||
      nomLower.includes(b.nom?.trim().toLowerCase())
    );
    if (found) {
      setSelected(found);
      if (onClearInitialSelected) onClearInitialSelected();
    }
  }, [initialSelected, bourses, onClearInitialSelected]);

  const handleStar = async (bourse, isStarred) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id) return;
    try {
      const res = await axiosInstance.get(API_ROUTES.favoris.byUser(user.id));
      const doc = res.data.docs?.[0];
      if (isStarred) {
        if (!doc?.id) return;
        await axiosInstance.patch(`/api/favoris/${doc.id}`, {
          bourses: (doc.bourses || []).filter(b => b.nom?.trim().toLowerCase() !== nomKey)
        });
        setStarredNoms(prev => { const s = new Set(prev); s.delete(nomKey); return s; });
      } else {
        const nb = { nom: bourse.nom, pays: bourse.pays || '', lienOfficiel: bourse.lienOfficiel || '', financement: bourse.financement || '', dateLimite: bourse.dateLimite || null, ajouteLe: new Date().toISOString() };
        if (doc?.id) {
          await axiosInstance.patch(`/api/favoris/${doc.id}`, { bourses: [...(doc.bourses || []), nb] });
        } else {
          await axiosInstance.post('/api/favoris', { user: user.id, userEmail: user.email || '', bourses: [nb] });
        }
        setStarredNoms(prev => new Set([...prev, nomKey]));
      }
    } catch (err) { console.error('[handleStar]', err); }
  };

  const handleApply = async (bourse) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id || appliedNoms.has(nomKey)) return;
    try {
      await axiosInstance.post(API_ROUTES.roadmap.create, {
        userId: user.id, userEmail: user.email || '', nom: bourse.nom,
        pays: bourse.pays || '', lienOfficiel: bourse.lienOfficiel || '',
        financement: bourse.financement || '', dateLimite: bourse.dateLimite || null,
        ajouteLe: new Date().toISOString(), statut: 'en_cours', etapeCourante: 0,
      });
      setAppliedNoms(prev => new Set([...prev, nomKey]));
    } catch (err) { console.error('[handleApply]', err); }
  };

  const handleAskAI = useCallback((bourse) => {
    setShowChat(true);
    setInput(`Peux-tu me dire si je suis éligible à la bourse "${bourse.nom}" en ${bourse.pays} ?`);
  }, [setInput]);

  const filtered = bourses
    .filter(b => {
      if (b.statut === 'expiree') return false;
      const q = search.toLowerCase();
      const matchSearch = !q || b.nom?.toLowerCase().includes(q) || b.pays?.toLowerCase().includes(q) || b.domaine?.toLowerCase().includes(q);
      const matchNiveau = !filterNiveau || b.niveau?.includes(filterNiveau);
      const matchPays   = !filterPays   || b.pays === filterPays;
      return matchSearch && matchNiveau && matchPays;
    })
    .sort((a, b) => a.nom?.localeCompare(b.nom));
  
  const visibleBourses = !user ? filtered.slice(0, 9) : filtered;
  const hasHiddenBourses = !user && filtered.length > 9;

  const paysList    = [...new Set(bourses.map(b => b.pays).filter(Boolean))];
  const niveauxList = [...new Set(bourses.flatMap(b => (b.niveau || '').split(',').map(s => s.trim())).filter(Boolean))];

  return (
    <div style={{ width:'100%', minHeight:'100vh', background:'#f8f9fc', fontFamily:"'Segoe UI', system-ui, sans-serif", position:'relative' }}>

      {/* Filtres */}
      <div style={{ background:'#ffffff', borderBottom:'1px solid #e2e8f0', padding:'16px 32px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', gap:10, flexWrap:'wrap' }}>
          <input placeholder="🔍 Rechercher une bourse, pays, domaine..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex:1, minWidth:200, padding:'9px 14px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#1a3a6b', fontSize:14, outline:'none' }}/>
          <select value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)}
            style={{ padding:'9px 14px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#475569', fontSize:13, cursor:'pointer', outline:'none' }}>
            <option value="">Tous niveaux</option>
            {niveauxList.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={filterPays} onChange={e => setFilterPays(e.target.value)}
            style={{ padding:'9px 14px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#475569', fontSize:13, cursor:'pointer', outline:'none' }}>
            <option value="">Tous pays</option>
            {paysList.map(p => <option key={p} value={p}>{countryFlag(p)} {p}</option>)}
          </select>
          {(search || filterNiveau || filterPays) && (
            <button style={{ padding:'9px 14px', borderRadius:6, border:'1px solid #fecaca', background:'#fef2f2', color:'#dc2626', fontSize:13, cursor:'pointer', fontWeight:500 }}
              onClick={() => { setSearch(''); setFilterNiveau(''); setFilterPays(''); }}>✕ Effacer</button>
          )}
        </div>
      </div>

      {/* Grille + Chat */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 32px', display:'flex', gap:24, alignItems:'flex-start' }}>
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
          {visibleBourses.length === 0 ? (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 20px' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
              <div style={{ fontSize:16, fontWeight:600, color:'#1a3a6b', marginBottom:8 }}>Aucune bourse trouvée</div>
              <p style={{ color:'#64748b', fontSize:14 }}>Essayez d'autres critères de recherche.</p>
            </div>
          ) : (
            visibleBourses.map(bourse => (
              <BourseCard
                key={bourse.id || bourse.nom}
                bourse={bourse}
                user={user}
                onAskAI={handleAskAI}
                onClick={() => setSelected(bourse)}
                starred={starredNoms.has(bourse.nom?.trim().toLowerCase())}
                onStar={handleStar}
                applied={appliedNoms.has(bourse.nom?.trim().toLowerCase())}
                onApply={handleApply}
              />
            ))
          )}

          {/* Message pour les bourses cachées */}
          {hasHiddenBourses && (
            <div 
              onClick={() => setShowLoginModal(true)}
              style={{ 
                gridColumn:'1/-1', 
                textAlign:'center', 
                padding:'32px 20px',
                marginTop:8,
                background:'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius:12,
                border:'1px dashed #cbd5e1',
                cursor:'pointer',
                transition:'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#eff6ff';
                e.currentTarget.style.borderColor = '#f5a623';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
            >
              <div style={{ fontSize:36, marginBottom:8 }}>🔒</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#1a3a6b', marginBottom:4 }}>
                {filtered.length - 9} bourse{filtered.length - 9 > 1 ? 's' : ''} supplémentaire{filtered.length - 9 > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:12 }}>
                Connectez-vous pour voir toutes les bourses disponibles
              </div>
              <button 
                style={{ 
                  padding:'8px 20px', 
                  borderRadius:6, 
                  background:'#f5a623', 
                  border:'none', 
                  color:'#1a3a6b', 
                  fontSize:12, 
                  fontWeight:600, 
                  cursor:'pointer' 
                }}
              >
                🔐 Se connecter
              </button>
            </div>
          )}
        </div>

        {showChat && (
          <div style={{ width:320, flexShrink:0, background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:10, position:'sticky', top:110, display:'flex', flexDirection:'column', maxHeight:'calc(100vh - 130px)', minHeight:0, boxShadow:'0 4px 16px rgba(26,58,107,0.08)', zIndex:90 }}>
            <div style={{ display:'flex', gap:10, alignItems:'center', padding:'14px 16px', borderBottom:'2px solid #f5a623', background:'#1a3a6b', borderTopLeftRadius:10, borderTopRightRadius:10 }}>
              <span style={{ fontSize:20 }}>🤖</span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Assistant Bourses</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>Conseils personnalisés</div>
              </div>
              <button onClick={() => setShowChat(false)} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:32, height:32, borderRadius:6, cursor:'pointer', fontSize:16, marginLeft:'auto' }}>✕</button>
            </div>
            <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:12 }} ref={chatContainerRef}>
              {messages.length === 0 && (
                <div style={{ padding:12 }}>
                  <p style={{ color:'#64748b', fontSize:13, marginBottom:12 }}>Demandez-moi des conseils sur une bourse !</p>
                  {['Lettre de motivation ?', 'Documents requis ?'].map((q, i) => (
                    <button key={i} style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 12px', borderRadius:6, background:'#fff', border:'1px solid #e2e8f0', color:'#1a3a6b', fontSize:12, cursor:'pointer', marginBottom:6 }} onClick={() => handleQuickReply(q)}>{q}</button>
                  ))}
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:12, maxWidth:'92%', ...(msg.sender==='user'?{marginLeft:'auto',flexDirection:'row-reverse'}:{}) }}>
                  <div style={{ padding:'10px 14px', borderRadius:10, fontSize:13, lineHeight:1.5, ...(msg.sender==='user'?{background:'#1a3a6b',color:'#fff'}:{background:'#f1f5f9',color:'#1a3a6b'}) }}>{msg.text}</div>
                </div>
              ))}
              {loading && <div style={{ padding:12, fontSize:12, color:'#94a3b8' }}>L'IA réfléchit...</div>}
            </div>
            <div style={{ padding:12, borderTop:'1px solid #f1f5f9' }}>
              <ChatInput input={input} setInput={setInput} onSend={() => handleSend()} loading={loading}/>
            </div>
          </div>
        )}
      </div>

      {/* Bouton flottant Chat */}
      <button onClick={() => setShowChat(prev => !prev)}
        style={{ position:'fixed', bottom:24, right:24, width:56, height:56, borderRadius:'50%', background:'#f5a623', border:'none', boxShadow:'0 4px 12px rgba(26,58,107,0.3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'#1a3a6b', zIndex:1000 }}>
        {showChat ? '✕' : '💬'}
      </button>

      {/* ✅ BourseDrawer avec user pour la logique de match */}
      <BourseDrawer
        bourse={selected}
        onClose={() => setSelected(null)}
        onAskAI={handleAskAI}
        onChoose={(b) => handleSend(`je choisis ${b.nom}`)}
        starred={selected ? starredNoms.has(selected.nom?.trim().toLowerCase()) : false}
        onStar={handleStar}
        applied={selected ? appliedNoms.has(selected.nom?.trim().toLowerCase()) : false}
        onApply={handleApply}
        user={user}
      />

      {/* Modal de connexion */}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      <style>{`input::placeholder{color:#94a3b8} select option{color:#1a3a6b;background:#fff}`}</style>
    </div>
  );
}