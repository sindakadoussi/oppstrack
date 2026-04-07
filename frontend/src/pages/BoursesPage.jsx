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
          {filtered.length === 0 ? (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 20px' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
              <div style={{ fontSize:16, fontWeight:600, color:'#1a3a6b', marginBottom:8 }}>Aucune bourse trouvée</div>
              <p style={{ color:'#64748b', fontSize:14 }}>Essayez d'autres critères de recherche.</p>
            </div>
          ) : filtered.map(bourse => (
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
          ))}
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

      <style>{`input::placeholder{color:#94a3b8} select option{color:#1a3a6b;background:#fff}`}</style>
    </div>
  );
}