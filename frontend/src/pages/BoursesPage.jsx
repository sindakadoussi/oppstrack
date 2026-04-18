// BoursesPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import BourseCard from '../components/BourseCard';
import ChatInput from '../components/ChatInput';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';
import BourseDrawer from '../components/Boursedrawer';
import { useT } from '../i18n';

/* ═══════════════════════════════════════════════════════════════════════════
   UTILS & HELPERS
═══════════════════════════════════════════════════════════════════════════ */
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

// Debounce hook pour la recherche
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

// Toast notification simple
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
    error: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
    info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1a3a6b' },
  };
  const c = colors[type] || colors.info;

  return (
    <div style={{
      position: 'fixed', bottom: 100, right: 24, zIndex: 2000,
      padding: '12px 20px', borderRadius: 10, background: c.bg,
      border: `1px solid ${c.border}`, color: c.text,
      fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', animation: 'slideIn 0.3s ease'
    }}>
      <span>{type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
      <span>{message}</span>
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: c.text }}>✕</button>
    </div>
  );
}

// Skeleton card pour le loading
function SkeletonCard() {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
      padding: 16, animation: 'pulse 1.5s infinite ease-in-out'
    }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f1f5f9' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 16, background: '#f1f5f9', borderRadius: 4, width: '70%', marginBottom: 8 }} />
          <div style={{ height: 12, background: '#f1f5f9', borderRadius: 3, width: '40%' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 20, background: '#f1f5f9', borderRadius: 4, width: 60 + i * 10 }} />
        ))}
      </div>
      <div style={{ height: 14, background: '#f1f5f9', borderRadius: 3, width: '90%', marginBottom: 8 }} />
      <div style={{ height: 14, background: '#f1f5f9', borderRadius: 3, width: '60%' }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <div style={{ flex: 1, height: 36, background: '#f1f5f9', borderRadius: 6 }} />
        <div style={{ flex: 1, height: 36, background: '#f1f5f9', borderRadius: 6 }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN MODAL (traduit)
═══════════════════════════════════════════════════════════════════════════ */
function LoginModal({ onClose, lang }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const send = async () => {
    if (!email || !email.includes('@')) { 
      setErrMsg(lang === 'fr' ? 'Email invalide' : 'Invalid email'); 
      return; 
    }
    setStatus('sending');
    try {
      await axiosInstance.post('/api/users/request-magic-link', { email: email.trim().toLowerCase() });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrMsg(err.response?.data?.message || (lang === 'fr' ? 'Impossible de contacter le serveur' : 'Cannot contact server'));
    }
  };

  return (
    <div style={M.overlay}>
      <div style={M.box}>
        <div style={M.head}>
          <span style={{ fontSize: 22 }}>🔐</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
            {lang === 'fr' ? 'Connexion à OppsTrack' : 'Sign in to OppsTrack'}
          </span>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={M.body}>
          {status === 'idle' && (
            <>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }} dangerouslySetInnerHTML={{
                __html: lang === 'fr' 
                  ? 'Entrez votre email pour recevoir un <strong>lien de connexion magique</strong>.'
                  : 'Enter your email to receive a <strong>magic login link</strong>.'
              }} />
              <input
                type="email"
                placeholder={lang === 'fr' ? 'votre@email.com' : 'your@email.com'}
                value={email}
                autoFocus
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                style={M.input}
              />
              {errMsg && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{errMsg}</div>}
              <button style={M.btn} onClick={send}>
                ✉️ {lang === 'fr' ? 'Envoyer le lien magique' : 'Send magic link'}
              </button>
            </>
          )}
          {status === 'sending' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={M.spinner} />
              <p style={{ color: '#64748b', marginTop: 14 }}>
                {lang === 'fr' ? 'Envoi en cours...' : 'Sending...'}
              </p>
            </div>
          )}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>✉️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 8 }}>
                {lang === 'fr' ? 'Lien envoyé !' : 'Link sent!'}
              </div>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }} dangerouslySetInnerHTML={{
                __html: lang === 'fr' 
                  ? 'Vérifiez votre boîte mail (et les spams).<br/>Cliquez sur le lien pour vous connecter.'
                  : 'Check your inbox (and spam).<br/>Click the link to sign in.'
              }} />
              <button style={{ ...M.btn, background: '#166534', marginTop: 20 }} onClick={onClose}>
                ✓ {lang === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </div>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#dc2626', marginBottom: 12 }}>{errMsg}</p>
              <button style={{ ...M.btn, background: '#dc2626' }} onClick={() => { setStatus('idle'); setErrMsg(''); }}>
                {lang === 'fr' ? 'Réessayer' : 'Retry'}
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

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
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
  const { t, lang } = useT();
  
  // États
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [filterPays, setFilterPays] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [showChat, setShowChat] = useState(false);
  const [selected, setSelected] = useState(null);
  const [starredNoms, setStarredNoms] = useState(new Set());
  const [appliedNoms, setAppliedNoms] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Debounce pour la recherche
  const debouncedSearch = useDebounce(search, 300);

  // Chargement des données utilisateur
  const loadUserData = useCallback(async () => {
    if (!user?.id) { setDataLoaded(true); return; }
    try {
      const [resFav, resRM] = await Promise.all([
        axiosInstance.get(API_ROUTES.favoris.byUser(user.id)),
        axiosInstance.get(API_ROUTES.roadmap.byUser(user.id))
      ]);
      setStarredNoms(new Set((resFav.data.docs?.[0]?.bourses || []).map(b => b.nom?.trim().toLowerCase())));
      setAppliedNoms(new Set((resRM.data.docs || []).map(b => b.nom?.trim().toLowerCase())));
    } catch (err) { console.error('[loadUserData]', err); }
    finally { setDataLoaded(true); }
  }, [user?.id]);

  useEffect(() => { loadUserData(); }, [loadUserData]);

  // Sélection initiale depuis l'URL/chat
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

  // Handlers avec notifications
  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleStar = async (bourse, isStarred) => {
  const nomKey = bourse.nom?.trim().toLowerCase();
  if (!user?.id) { showToast(lang === 'fr' ? 'Connectez-vous pour sauvegarder' : 'Sign in to save', 'info'); return; }
  
  try {
    const res = await axiosInstance.get(API_ROUTES.favoris.byUser(user.id));
    const doc = res.data.docs?.[0];
    if (isStarred) {
      if (!doc?.id) return;
      await axiosInstance.patch(`/api/favoris/${doc.id}`, {
        bourses: (doc.bourses || []).filter(b => b.nom?.trim().toLowerCase() !== nomKey)
      });
      setStarredNoms(prev => { const s = new Set(prev); s.delete(nomKey); return s; });
      showToast(lang === 'fr' ? 'Retiré des favoris' : 'Removed from favorites', 'info');
    } else {
      const nb = { nom: bourse.nom, pays: bourse.pays || '', lienOfficiel: bourse.lienOfficiel || '', financement: bourse.financement || '', dateLimite: bourse.dateLimite || null, ajouteLe: new Date().toISOString() };
      if (doc?.id) {
        await axiosInstance.patch(`/api/favoris/${doc.id}`, { bourses: [...(doc.bourses || []), nb] });
      } else {
        await axiosInstance.post('/api/favoris', { user: user.id, userEmail: user.email || '', bourses: [nb] });
      }
      setStarredNoms(prev => new Set([...prev, nomKey]));
      showToast(lang === 'fr' ? 'Ajouté aux favoris ⭐' : 'Added to favorites ⭐', 'success');
    }
    // ✅ Émettre l'événement pour la Navbar (et autres composants)
    window.dispatchEvent(new CustomEvent('favoris-updated'));
  } catch (err) { 
    console.error('[handleStar]', err); 
    showToast(lang === 'fr' ? 'Erreur lors de la mise à jour' : 'Update error', 'error');
  }
};

  const handleApply = async (bourse) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id) { showToast(lang === 'fr' ? 'Connectez-vous pour postuler' : 'Sign in to apply', 'info'); return; }
    if (appliedNoms.has(nomKey)) { showToast(lang === 'fr' ? 'Déjà dans votre roadmap' : 'Already in your roadmap', 'info'); return; }

    try {
      const res = await axiosInstance.post(API_ROUTES.roadmap.create, {
        userId: user.id, userEmail: user.email || '',
        nom: bourse.nom, pays: bourse.pays || '', lienOfficiel: bourse.lienOfficiel || '',
        financement: bourse.financement || '', dateLimite: bourse.dateLimite || null,
        ajouteLe: new Date().toISOString(), statut: 'en_cours', etapeCourante: 0,
      });

      const newRoadmapId = res.data.doc?.id || res.data.id;
      await axiosInstance.post(WEBHOOK_ROUTES.generateRoadmap, {
        roadmapId: newRoadmapId,
        bourse: { nom: bourse.nom, pays: bourse.pays, url: bourse.lienOfficiel || bourse.url },
        userProfile: user 
      });

      setAppliedNoms(prev => new Set([...prev, nomKey]));
      showToast(lang === 'fr' ? '✅ Ajouté à votre roadmap !' : '✅ Added to your roadmap!', 'success');
    } catch (err) {
      console.error('[handleApply Error]', err);
      showToast(lang === 'fr' ? "Erreur lors de l'ajout" : 'Error adding to roadmap', 'error');
    }
  };

  const handleAskAI = useCallback((bourse) => {
    setShowChat(true);
    setInput(lang === 'fr' 
      ? `Peux-tu me dire si je suis éligible à la bourse "${bourse.nom}" en ${bourse.pays} ?`
      : `Can you tell me if I'm eligible for the "${bourse.nom}" scholarship in ${bourse.pays}?`);
  }, [setInput, lang]);

  // Filtrage + tri optimisé
  const filtered = useMemo(() => {
    let result = bourses.filter(b => {
      if (b.statut === 'expiree') return false;
      const q = debouncedSearch.toLowerCase();
      const matchSearch = !q || b.nom?.toLowerCase().includes(q) || b.pays?.toLowerCase().includes(q) || b.domaine?.toLowerCase().includes(q);
      const matchNiveau = !filterNiveau || b.niveau?.includes(filterNiveau);
      const matchPays = !filterPays || b.pays === filterPays;
      return matchSearch && matchNiveau && matchPays;
    });

    // Tri
    if (sortBy === 'deadline') {
      result.sort((a, b) => {
        const da = a.dateLimite ? new Date(a.dateLimite).getTime() : Infinity;
        const db = b.dateLimite ? new Date(b.dateLimite).getTime() : Infinity;
        return da - db;
      });
    } else if (sortBy === 'funding') {
      const fundingScore = (f) => {
        const s = (f || '').toLowerCase();
        if (s.includes('100') || s.includes('total') || s.includes('complet')) return 3;
        if (s.includes('partiel') || s.includes('50')) return 2;
        return s ? 1 : 0;
      };
      result.sort((a, b) => fundingScore(b.financement) - fundingScore(a.financement));
    }
    // else 'relevance' = order by default

    return result;
  }, [bourses, debouncedSearch, filterNiveau, filterPays, sortBy]);

  // Pagination pour invités
  const visibleBourses = !user ? filtered.slice(0, 9) : filtered;
  const hasHiddenBourses = !user && filtered.length > 9;

  // Listes pour filtres
  const paysList = useMemo(() => [...new Set(bourses.map(b => b.pays).filter(Boolean))].sort(), [bourses]);
  const niveauxList = useMemo(() => 
    [...new Set(bourses.flatMap(b => (b.niveau || '').split(',').map(s => s.trim())).filter(Boolean))].sort(), 
    [bourses]
  );

  // Chips de filtres actifs
  const activeFilters = useMemo(() => {
    const filters = [];
    if (debouncedSearch) filters.push({ key: 'search', label: `🔍 "${debouncedSearch}"`, onRemove: () => setSearch('') });
    if (filterNiveau) filters.push({ key: 'niveau', label: `🎓 ${filterNiveau}`, onRemove: () => setFilterNiveau('') });
    if (filterPays) filters.push({ key: 'pays', label: `${countryFlag(filterPays)} ${filterPays}`, onRemove: () => setFilterPays('') });
    return filters;
  }, [debouncedSearch, filterNiveau, filterPays]);

  // Quick questions traduites
  const quickQuestions = useMemo(() => lang === 'fr' 
    ? ['Lettre de motivation ?', 'Documents requis ?', 'Critères d\'éligibilité ?']
    : ['Motivation letter?', 'Required documents?', 'Eligibility criteria?'], 
  [lang]);

  // Loading skeleton
  const showSkeleton = !dataLoaded;

  return (
    <div style={{ width:'100%', minHeight:'100vh', background:'#f8f9fc', fontFamily:"'Segoe UI', system-ui, sans-serif", position:'relative' }}>

      {/* ═════ HEADER AVEC FILTRES ═════ */}
      <div style={{ background:'#ffffff', borderBottom:'1px solid #e2e8f0', padding:'16px 32px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          
          {/* Barre de recherche + filtres */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <input 
                placeholder={t('bourses', 'searchPlaceholder')} 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                style={{ width:'100%', padding:'9px 14px 9px 36px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#1a3a6b', fontSize:14, outline:'none', transition:'border 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#1a3a6b'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14 }}>🔍</span>
            </div>
            
            <select value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)}
              style={{ padding:'9px 14px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#475569', fontSize:13, cursor:'pointer', outline:'none', minWidth:140 }}>
              <option value="">{t('bourses', 'filterNiveau')}</option>
              {niveauxList.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            
            <select value={filterPays} onChange={e => setFilterPays(e.target.value)}
              style={{ padding:'9px 14px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#475569', fontSize:13, cursor:'pointer', outline:'none', minWidth:140 }}>
              <option value="">{t('bourses', 'filterPays')}</option>
              {paysList.map(p => <option key={p} value={p}>{countryFlag(p)} {p}</option>)}
            </select>
            
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding:'9px 14px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#475569', fontSize:13, cursor:'pointer', outline:'none', minWidth:140 }}>
              <option value="relevance">{lang === 'fr' ? '🎯 Pertinence' : '🎯 Relevance'}</option>
              <option value="deadline">{lang === 'fr' ? '⏰ Deadline' : '⏰ Deadline'}</option>
              <option value="funding">{lang === 'fr' ? '💰 Financement' : '💰 Funding'}</option>
            </select>
            
            {(search || filterNiveau || filterPays) && (
              <button style={{ padding:'9px 14px', borderRadius:6, border:'1px solid #fecaca', background:'#fef2f2', color:'#dc2626', fontSize:13, cursor:'pointer', fontWeight:500, display:'flex', alignItems:'center', gap:4 }}
                onClick={() => { setSearch(''); setFilterNiveau(''); setFilterPays(''); }}>
                ✕ {lang === 'fr' ? 'Effacer' : 'Clear'}
              </button>
            )}
          </div>

          {/* Chips de filtres actifs */}
          {activeFilters.length > 0 && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
              {activeFilters.map(f => (
                <span key={f.key} style={{ 
                  display:'inline-flex', alignItems:'center', gap:6,
                  padding:'4px 10px', borderRadius:20, background:'#eff6ff', 
                  border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:12, fontWeight:500 
                }}>
                  {f.label}
                  <button onClick={f.onRemove} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, marginLeft:2, color:'#64748b' }}>✕</button>
                </span>
              ))}
            </div>
          )}

          {/* Résultats counter */}
          <div style={{ marginTop:12, fontSize:13, color:'#64748b' }}>
            {filtered.length} {lang === 'fr' ? 'bourse' : 'scholarship'}{filtered.length > 1 ? (lang === 'fr' ? 's' : 's') : ''} {lang === 'fr' ? 'trouvée' : 'found'}
            {debouncedSearch && <span> pour "<strong>{debouncedSearch}</strong>"</span>}
          </div>
        </div>
      </div>

      {/* ═════ GRILLE + CHAT ═════ */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 32px', display:'flex', gap:24, alignItems:'flex-start' }}>
        
        {/* Grille de bourses */}
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
          
          {showSkeleton ? (
            // Skeletons pendant le chargement
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filtered.length === 0 ? (
            // État vide
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 20px' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
              <div style={{ fontSize:16, fontWeight:600, color:'#1a3a6b', marginBottom:8 }}>{t('bourses', 'noResult')}</div>
              <p style={{ color:'#64748b', fontSize:14 }}>{t('bourses', 'noResultSub')}</p>
              <button onClick={() => { setSearch(''); setFilterNiveau(''); setFilterPays(''); }}
                style={{ marginTop:16, padding:'10px 24px', borderRadius:6, background:'#1a3a6b', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                {lang === 'fr' ? 'Réinitialiser les filtres' : 'Reset filters'}
              </button>
            </div>
          ) : (
            // Liste des bourses
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

          {/* Message pour les bourses cachées (invités) */}
          {hasHiddenBourses && (
            <div 
              onClick={() => setShowLoginModal(true)}
              style={{ 
                gridColumn:'1/-1', textAlign:'center', padding:'32px 20px', marginTop:8,
                background:'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius:12,
                border:'2px dashed #cbd5e1', cursor:'pointer', transition:'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#f5a623'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            >
              <div style={{ fontSize:36, marginBottom:8 }}>🔒</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#1a3a6b', marginBottom:4 }}>
                {filtered.length - 9} {lang === 'fr' ? 'bourse supplémentaire' : 'additional scholarship'}
                {filtered.length - 9 > 1 ? (lang === 'fr' ? 's' : 's') : ''}
              </div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:12 }}>
                {lang === 'fr' ? 'Connectez-vous pour voir toutes les bourses disponibles' : 'Sign in to see all available scholarships'}
              </div>
              <button style={{ padding:'8px 20px', borderRadius:6, background:'#f5a623', border:'none', color:'#1a3a6b', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                🔐 {t('navbar', 'login')}
              </button>
            </div>
          )}
        </div>

        {/* Chat latéral */}
        {showChat && (
          <div style={{ width:320, flexShrink:0, background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:10, position:'sticky', top:110, display:'flex', flexDirection:'column', maxHeight:'calc(100vh - 130px)', minHeight:0, boxShadow:'0 4px 16px rgba(26,58,107,0.08)', zIndex:90 }}>
            <div style={{ display:'flex', gap:10, alignItems:'center', padding:'14px 16px', borderBottom:'2px solid #f5a623', background:'#1a3a6b', borderTopLeftRadius:10, borderTopRightRadius:10 }}>
              <span style={{ fontSize:20 }}>🤖</span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>
                  {lang === 'fr' ? 'Assistant Bourses' : 'Scholarship Assistant'}
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>
                  {lang === 'fr' ? 'Conseils personnalisés' : 'Personalized advice'}
                </div>
              </div>
              <button onClick={() => setShowChat(false)} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:32, height:32, borderRadius:6, cursor:'pointer', fontSize:16, marginLeft:'auto' }}>✕</button>
            </div>
            <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:12 }} ref={chatContainerRef}>
              {messages.length === 0 && (
                <div style={{ padding:12 }}>
                  <p style={{ color:'#64748b', fontSize:13, marginBottom:12 }}>
                    {lang === 'fr' ? 'Demandez-moi des conseils sur une bourse !' : 'Ask me for advice on a scholarship!'}
                  </p>
                  {quickQuestions.map((q, i) => (
                    <button key={i} style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 12px', borderRadius:6, background:'#fff', border:'1px solid #e2e8f0', color:'#1a3a6b', fontSize:12, cursor:'pointer', marginBottom:6, transition:'background 0.15s' }} 
                      onClick={() => handleQuickReply(q)}
                      onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:12, maxWidth:'92%', ...(msg.sender==='user'?{marginLeft:'auto',flexDirection:'row-reverse'}:{}) }}>
                  <div style={{ padding:'10px 14px', borderRadius:10, fontSize:13, lineHeight:1.5, ...(msg.sender==='user'?{background:'#1a3a6b',color:'#fff'}:{background:'#f1f5f9',color:'#1a3a6b'}) }}>{msg.text}</div>
                </div>
              ))}
              {loading && <div style={{ padding:12, fontSize:12, color:'#94a3b8' }}>{lang === 'fr' ? "L'IA réfléchit..." : "AI is thinking..."}</div>}
            </div>
            <div style={{ padding:12, borderTop:'1px solid #f1f5f9' }}>
              <ChatInput input={input} setInput={setInput} onSend={() => handleSend()} loading={loading}/>
            </div>
          </div>
        )}
      </div>

      {/* ═════ BOUTON FLOTTANT CHAT ═════ */}
      <button onClick={() => setShowChat(prev => !prev)}
        style={{ 
          position:'fixed', bottom:24, right:24, width:56, height:56, borderRadius:'50%', 
          background:'#f5a623', border:'none', boxShadow:'0 4px 12px rgba(26,58,107,0.3)', 
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', 
          fontSize:24, color:'#1a3a6b', zIndex:1000, transition:'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {showChat ? '✕' : '💬'}
      </button>

      {/* ═════ DRAWER + MODAL ═════ */}
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

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} lang={lang} />}
      
      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Styles globaux */}
      <style>{`
        input::placeholder { color:#94a3b8 }
        select option { color:#1a3a6b; background:#fff }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
        @keyframes slideIn { from { transform:translateX(100%); opacity:0 } to { transform:translateX(0); opacity:1 } }
      `}</style>
    </div>
  );
}