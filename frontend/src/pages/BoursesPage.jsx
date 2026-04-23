// BoursesPage.jsx - Style éditorial harmonisé avec la homepage
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import BourseCard from '../components/BourseCard';
import ChatInput from '../components/ChatInput';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';
import BourseDrawer from '../components/Boursedrawer';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';
import MatchDrawerIA from '../components/MatchDrawerIA';

/* =============== TOKENS (copiés depuis la homepage) =============== */
const tokens = (theme) => ({
  accent:     theme === "dark" ? "#4c9fd9" : "#0066b3",
  accentInk:  theme === "dark" ? "#8ec1e6" : "#004f8a",
  ink:        theme === "dark" ? "#f2efe7" : "#141414",
  ink2:       theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3:       theme === "dark" ? "#a19f96" : "#6b6b6b",
  ink4:       theme === "dark" ? "#6d6b64" : "#9a9794",
  paper:      theme === "dark" ? "#15140f" : "#faf8f3",
  paper2:     theme === "dark" ? "#1d1c16" : "#f2efe7",
  rule:       theme === "dark" ? "#2b2a22" : "#d9d5cb",
  ruleSoft:   theme === "dark" ? "#24231c" : "#e8e4d9",
  surface:    theme === "dark" ? "#1a1912" : "#ffffff",
  danger:     "#b4321f",
  warn:       "#b06a12",
  fSerif: `"Libre Caslon Text", "Times New Roman", Georgia, serif`,
  fSans:  `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"JetBrains Mono", ui-monospace, Menlo, monospace`,
});

/* =============== HELPERS =============== */
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

const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'object' && image.url) return image.url;
  if (typeof image === 'string') {
    return `${import.meta.env.VITE_PAYLOAD_URL || ''}/api/media/${image}`;
  }
  return null;
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

/* =============== TOAST (style éditorial) =============== */
function Toast({ message, type = 'success', onClose, c }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeStyles = {
    success: { bg: '#e6f4ea', border: c.accent, text: '#2e6b3e' },
    error: { bg: '#fef2f2', border: c.danger, text: '#b91c1c' },
    info: { bg: '#eef2ff', border: c.accent, text: '#1e40af' },
  };
  const s = typeStyles[type] || typeStyles.info;

  return (
    <div style={{
      position: 'fixed', bottom: 100, right: 24, zIndex: 2000,
      padding: '12px 20px', borderRadius: 4, background: s.bg,
      borderLeft: `3px solid ${s.border}`, color: s.text,
      fontSize: 13, fontWeight: 500, fontFamily: c.fSans,
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
      animation: 'slideIn 0.25s ease'
    }}>
      <span>{type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</span>
      <span>{message}</span>
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: s.text }}>✕</button>
    </div>
  );
}

/* =============== SKELETON CARD (style éditorial) =============== */
function SkeletonCard({ c }) {
  return (
    <div style={{
      background: c.surface, borderBottom: `1px solid ${c.ruleSoft}`,
      padding: 24, display: 'flex', gap: 24, alignItems: 'center',
      animation: 'pulse 1.2s infinite ease-in-out',
    }}>
      <div style={{ width: 80, height: 80, background: c.ruleSoft, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 20, width: '60%', background: c.ruleSoft, marginBottom: 12 }} />
        <div style={{ height: 14, width: '40%', background: c.ruleSoft, marginBottom: 16 }} />
        <div style={{ height: 12, width: '80%', background: c.ruleSoft }} />
      </div>
    </div>
  );
}

/* =============== VERTICAL BOURSE CARD (style unipd) =============== */
function VerticalBourseCard({ bourse, user, onAskAI, onClick, starred, onStar, applied, onApply, onMatch, c, lang }) {
  const imageUrl = getImageUrl(bourse.image);
  const formatDate = (date) => date ? new Date(date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : null;

  return (
    <article
      onClick={onClick}
      style={{
        display: 'flex', gap: 24, alignItems: 'center',
        padding: '24px 0',
        borderBottom: `1px solid ${c.ruleSoft}`,
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        background: c.surface,
      }}
      onMouseEnter={e => e.currentTarget.style.background = c.paper2}
      onMouseLeave={e => e.currentTarget.style.background = c.surface}
    >
      {/* Image */}
      <div style={{ flexShrink: 0, width: 100, height: 100 }}>
        {imageUrl ? (
          <img src={imageUrl} alt={bourse.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: c.ruleSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: c.ink3 }}>🎓</div>
        )}
      </div>

      {/* Contenu */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
          <h3 style={{ fontFamily: c.fSerif, fontSize: 20, fontWeight: 700, margin: 0, color: c.ink, letterSpacing: '-0.01em' }}>
            {bourse.nom}
          </h3>
          <span style={{ fontFamily: c.fMono, fontSize: 11, color: c.ink3, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {countryFlag(bourse.pays)} {bourse.pays}
          </span>
          {bourse.niveau && (
            <span style={{ fontFamily: c.fMono, fontSize: 10, color: c.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {bourse.niveau}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12, fontFamily: c.fSans, fontSize: 12, color: c.ink2 }}>
          {bourse.financement && <span>💰 {bourse.financement}</span>}
          {bourse.dateLimite && <span>⏰ {lang === 'fr' ? 'Limite' : 'Deadline'} : {formatDate(bourse.dateLimite)}</span>}
          {bourse.tunisienEligible === 'oui' && <span>🇹🇳 Éligible Tunisie</span>}
        </div>

        {bourse.description && (
          <p style={{ fontFamily: c.fSans, fontSize: 13, color: c.ink2, lineHeight: 1.5, margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {bourse.description.length > 150 ? `${bourse.description.substring(0, 150)}...` : bourse.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={(e) => { e.stopPropagation(); onAskAI(bourse); }} style={{ ...actionButton(c, 'ghost'), border: `1px solid ${c.rule}`, background: 'transparent', color: c.accent }}>
            🤖 {lang === 'fr' ? 'IA' : 'AI'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onStar(bourse, starred); }} style={{ ...actionButton(c, 'ghost'), background: starred ? c.accent : 'transparent', color: starred ? c.paper : c.ink3, border: `1px solid ${c.rule}` }}>
            {starred ? '★' : '☆'} {lang === 'fr' ? 'Favori' : 'Favorite'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onApply(bourse); }} style={{ ...actionButton(c, applied ? 'success' : 'primary'), background: applied ? '#2e6b3e' : c.accent, color: '#fff' }}>
            {applied ? '✓' : '+'} {applied ? (lang === 'fr' ? 'Ajoutée' : 'Added') : (lang === 'fr' ? 'Postuler' : 'Apply')}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMatch(bourse); }} style={{ ...actionButton(c, 'gradient'), background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff' }}>
            🎯 {lang === 'fr' ? 'Match IA' : 'AI Match'}
          </button>
        </div>
      </div>
    </article>
  );
}

const actionButton = (c, variant) => ({
  padding: '6px 14px', fontSize: 11, fontWeight: 600, fontFamily: c.fMono,
  letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
  border: 'none', borderRadius: 0, transition: 'all 0.15s ease',
  ...(variant === 'primary' && { background: c.accent, color: c.paper }),
  ...(variant === 'ghost' && { background: 'transparent', color: c.ink2, border: `1px solid ${c.rule}` }),
  ...(variant === 'success' && { background: '#2e6b3e', color: '#fff' }),
});

/* =============== LOGIN MODAL (style éditorial) =============== */
function LoginModal({ onClose, lang, c }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const send = async () => {
    if (!email || !email.includes('@')) { setErrMsg(lang === 'fr' ? 'Email invalide' : 'Invalid email'); return; }
    setStatus('sending');
    try {
      await axiosInstance.post('/api/users/request-magic-link', { email: email.trim().toLowerCase() });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrMsg(err.response?.data?.message || (lang === 'fr' ? 'Erreur serveur' : 'Server error'));
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={{ ...modalStyles.box, borderTop: `3px solid ${c.accent}`, background: c.surface }}>
        <div style={{ ...modalStyles.head, background: c.paper2, borderBottom: `1px solid ${c.rule}` }}>
          <span style={{ fontSize: 20 }}>🔐</span>
          <span style={{ fontFamily: c.fSerif, fontWeight: 700, fontSize: 18, color: c.ink }}>
            {lang === 'fr' ? 'Connexion à OppsTrack' : 'Sign in to OppsTrack'}
          </span>
          <button style={modalStyles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={modalStyles.body}>
          {status === 'idle' && (
            <>
              <p style={{ fontFamily: c.fSans, fontSize: 13, color: c.ink2, marginBottom: 24, lineHeight: 1.5 }}>
                {lang === 'fr' ? 'Entrez votre email pour recevoir un lien de connexion magique.' : 'Enter your email to receive a magic login link.'}
              </p>
              <input
                type="email"
                placeholder={lang === 'fr' ? 'votre@email.com' : 'your@email.com'}
                value={email}
                autoFocus
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                style={{
                  width: '100%', padding: '12px', fontFamily: c.fSans, fontSize: 14,
                  border: `1px solid ${c.rule}`, background: c.paper, color: c.ink,
                  outline: 'none', marginBottom: 8
                }}
              />
              {errMsg && <div style={{ color: c.danger, fontSize: 12, marginTop: 4 }}>{errMsg}</div>}
              <button onClick={send} style={{ ...modalStyles.btn, background: c.accent, color: c.paper, marginTop: 16 }}>
                ✉️ {lang === 'fr' ? 'Envoyer le lien' : 'Send magic link'}
              </button>
            </>
          )}
          {status === 'sending' && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={modalStyles.spinner} />
              <p style={{ color: c.ink2, marginTop: 16 }}>{lang === 'fr' ? 'Envoi...' : 'Sending...'}</p>
            </div>
          )}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✉️</div>
              <div style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, color: '#2e6b3e', marginBottom: 8 }}>
                {lang === 'fr' ? 'Lien envoyé !' : 'Link sent!'}
              </div>
              <p style={{ fontSize: 13, color: c.ink2 }} dangerouslySetInnerHTML={{
                __html: lang === 'fr' ? 'Vérifiez votre boîte mail (et les spams).<br/>Cliquez sur le lien pour vous connecter.' : 'Check your inbox (and spam).<br/>Click the link to sign in.'
              }} />
              <button onClick={onClose} style={{ ...modalStyles.btn, background: '#2e6b3e', marginTop: 24 }}>✓ {lang === 'fr' ? 'Fermer' : 'Close'}</button>
            </div>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: c.danger }}>{errMsg}</p>
              <button onClick={() => { setStatus('idle'); setErrMsg(''); }} style={{ ...modalStyles.btn, background: c.accent, marginTop: 16 }}>
                {lang === 'fr' ? 'Réessayer' : 'Retry'}
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={modalStyles.backdrop} onClick={onClose} />
    </div>
  );
}

const modalStyles = {
  overlay:  { position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  backdrop: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' },
  box:      { position: 'relative', zIndex: 2001, width: 400, maxWidth: '92vw', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' },
  head:     { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px' },
  closeBtn: { marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' },
  body:     { padding: '24px' },
  btn:      { width: '100%', padding: '12px', fontFamily: 'Inter', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', letterSpacing: '0.05em' },
  spinner:  { width: 32, height: 32, border: `2px solid ${c => c.rule}`, borderTopColor: c => c.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' },
};

/* =============== PAGE PRINCIPALE =============== */
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
  const { theme } = useTheme();
  const c = tokens(theme);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [filterPays, setFilterPays] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [selected, setSelected] = useState(null);
  const [starredNoms, setStarredNoms] = useState(new Set());
  const [appliedNoms, setAppliedNoms] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [matchBourse, setMatchBourse] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  const loadUserData = useCallback(async () => {
    if (!user?.id) { setDataLoaded(true); return; }
    try {
      const [resFav, resRM] = await Promise.all([
        axiosInstance.get(API_ROUTES.favoris.byUser(user.id)),
        axiosInstance.get(API_ROUTES.roadmap.byUser(user.id))
      ]);
      setStarredNoms(new Set((resFav.data.docs?.[0]?.bourses || []).map(b => b.nom?.trim().toLowerCase())));
      setAppliedNoms(new Set((resRM.data.docs || []).map(b => b.nom?.trim().toLowerCase())));
    } catch (err) { console.error(err); }
    finally { setDataLoaded(true); }
  }, [user?.id]);

  useEffect(() => { loadUserData(); }, [loadUserData]);

  useEffect(() => {
    if (!initialSelected || !bourses?.length) return;
    const nomLower = initialSelected.trim().toLowerCase();
    const found = bourses.find(b => b.nom?.trim().toLowerCase() === nomLower || b.nom?.trim().toLowerCase().includes(nomLower));
    if (found) { setSelected(found); if (onClearInitialSelected) onClearInitialSelected(); }
  }, [initialSelected, bourses, onClearInitialSelected]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleStar = async (bourse, isStarred) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id) { showToast(lang === 'fr' ? 'Connectez-vous pour sauvegarder' : 'Sign in to save', 'info'); return; }
    try {
      const res = await axiosInstance.get(API_ROUTES.favoris.byUser(user.id));
      const doc = res.data.docs?.[0];
      if (isStarred) {
        if (!doc?.id) return;
        await axiosInstance.patch(`/api/favoris/${doc.id}`, { bourses: (doc.bourses || []).filter(b => b.nom?.trim().toLowerCase() !== nomKey) });
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
        showToast(lang === 'fr' ? 'Ajouté aux favoris' : 'Added to favorites', 'success');
      }
      window.dispatchEvent(new CustomEvent('favoris-updated'));
    } catch (err) { showToast(lang === 'fr' ? 'Erreur' : 'Error', 'error'); }
  };

  const handleApply = async (bourse) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id) { showToast(lang === 'fr' ? 'Connectez-vous pour postuler' : 'Sign in to apply', 'info'); return; }
    if (appliedNoms.has(nomKey)) { showToast(lang === 'fr' ? 'Déjà dans votre roadmap' : 'Already in roadmap', 'info'); return; }
    try {
      const res = await axiosInstance.post(API_ROUTES.roadmap.create, {
        userId: user.id, userEmail: user.email || '',
        nom: bourse.nom, pays: bourse.pays || '', lienOfficiel: bourse.lienOfficiel || '',
        financement: bourse.financement || '', dateLimite: bourse.dateLimite || null,
        ajouteLe: new Date().toISOString(), statut: 'en_cours', etapeCourante: 0,
      });
      const newRoadmapId = res.data.doc?.id || res.data.id;
      await axiosInstance.post(WEBHOOK_ROUTES.generateRoadmap, { roadmapId: newRoadmapId, bourse: { nom: bourse.nom, pays: bourse.pays, url: bourse.lienOfficiel || bourse.url }, userProfile: user });
      setAppliedNoms(prev => new Set([...prev, nomKey]));
      showToast(lang === 'fr' ? 'Ajouté à votre roadmap' : 'Added to your roadmap', 'success');
    } catch (err) { showToast(lang === 'fr' ? "Erreur lors de l'ajout" : 'Error adding to roadmap', 'error'); }
  };

  const handleAskAI = (bourse) => {
    const message = lang === 'fr' ? `Peux-tu me dire si je suis éligible à la bourse "${bourse.nom}" en ${bourse.pays} ?` : `Can you tell me if I'm eligible for the "${bourse.nom}" scholarship in ${bourse.pays}?`;
    window.dispatchEvent(new CustomEvent('openChatWithMessage', { detail: { message } }));
  };

  const filtered = useMemo(() => {
    let result = bourses.filter(b => {
      if (b.statut === 'expiree') return false;
      const q = debouncedSearch.toLowerCase();
      const matchSearch = !q || b.nom?.toLowerCase().includes(q) || b.pays?.toLowerCase().includes(q) || b.domaine?.toLowerCase().includes(q);
      const matchNiveau = !filterNiveau || b.niveau?.includes(filterNiveau);
      const matchPays = !filterPays || b.pays === filterPays;
      return matchSearch && matchNiveau && matchPays;
    });
    if (sortBy === 'deadline') {
      result.sort((a, b) => (a.dateLimite ? new Date(a.dateLimite).getTime() : Infinity) - (b.dateLimite ? new Date(b.dateLimite).getTime() : Infinity));
    } else if (sortBy === 'funding') {
      const fundingScore = (f) => { const s = (f || '').toLowerCase(); if (s.includes('100') || s.includes('total') || s.includes('complet')) return 3; if (s.includes('partiel') || s.includes('50')) return 2; return s ? 1 : 0; };
      result.sort((a, b) => fundingScore(b.financement) - fundingScore(a.financement));
    }
    return result;
  }, [bourses, debouncedSearch, filterNiveau, filterPays, sortBy]);

  const visibleBourses = !user ? filtered.slice(0, 9) : filtered;
  const hasHiddenBourses = !user && filtered.length > 9;
  const paysList = useMemo(() => [...new Set(bourses.map(b => b.pays).filter(Boolean))].sort(), [bourses]);
  const niveauxList = useMemo(() => [...new Set(bourses.flatMap(b => (b.niveau || '').split(',').map(s => s.trim())).filter(Boolean))].sort(), [bourses]);
  const activeFilters = useMemo(() => {
    const filters = [];
    if (debouncedSearch) filters.push({ key: 'search', label: `🔍 "${debouncedSearch}"`, onRemove: () => setSearch('') });
    if (filterNiveau) filters.push({ key: 'niveau', label: `🎓 ${filterNiveau}`, onRemove: () => setFilterNiveau('') });
    if (filterPays) filters.push({ key: 'pays', label: `${countryFlag(filterPays)} ${filterPays}`, onRemove: () => setFilterPays('') });
    return filters;
  }, [debouncedSearch, filterNiveau, filterPays]);

  const showSkeleton = !dataLoaded;

  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      {/* En-tête avec filtres (style minimal) */}
      <div style={{ borderBottom: `1px solid ${c.rule}`, background: c.surface, padding: '24px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <input
                placeholder={t('bourses', 'searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 36px',
                  fontFamily: c.fSans, fontSize: 14,
                  background: c.paper, border: `1px solid ${c.ruleSoft}`,
                  color: c.ink, outline: 'none', transition: 'border 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = c.accent}
                onBlur={e => e.target.style.borderColor = c.ruleSoft}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.ink3 }}>🔍</span>
            </div>
            <select value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)} style={selectStyle(c)}>
              <option value="">{t('bourses', 'filterNiveau')}</option>
              {niveauxList.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select value={filterPays} onChange={e => setFilterPays(e.target.value)} style={selectStyle(c)}>
              <option value="">{t('bourses', 'filterPays')}</option>
              {paysList.map(p => <option key={p} value={p}>{countryFlag(p)} {p}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle(c)}>
              <option value="relevance">{lang === 'fr' ? '🎯 Pertinence' : '🎯 Relevance'}</option>
              <option value="deadline">{lang === 'fr' ? '⏰ Deadline' : '⏰ Deadline'}</option>
              <option value="funding">{lang === 'fr' ? '💰 Financement' : '💰 Funding'}</option>
            </select>
            {(search || filterNiveau || filterPays) && (
              <button onClick={() => { setSearch(''); setFilterNiveau(''); setFilterPays(''); }} style={{ ...clearButton(c) }}>
                ✕ {lang === 'fr' ? 'Effacer' : 'Clear'}
              </button>
            )}
          </div>

          {activeFilters.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {activeFilters.map(f => (
                <span key={f.key} style={{ fontFamily: c.fMono, fontSize: 11, background: c.paper2, padding: '4px 12px', border: `1px solid ${c.ruleSoft}`, color: c.ink2 }}>
                  {f.label}
                  <button onClick={f.onRemove} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: c.ink3 }}>✕</button>
                </span>
              ))}
            </div>
          )}

          <div style={{ fontFamily: c.fMono, fontSize: 11, color: c.ink3, letterSpacing: '0.02em', marginTop: 8 }}>
            {filtered.length} {lang === 'fr' ? 'bourse' : 'scholarship'}{filtered.length > 1 ? 's' : ''} {lang === 'fr' ? 'trouvée' : 'found'}
            {debouncedSearch && <span> pour "<strong>{debouncedSearch}</strong>"</span>}
          </div>
        </div>
      </div>

      {/* Liste verticale des bourses */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 32px 64px' }}>
        {showSkeleton ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} c={c} />)
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontFamily: c.fSerif, fontSize: 32, color: c.ink2, marginBottom: 16 }}>🔍</div>
            <div style={{ fontFamily: c.fSerif, fontSize: 20, color: c.ink, marginBottom: 8 }}>{t('bourses', 'noResult')}</div>
            <p style={{ color: c.ink3 }}>{t('bourses', 'noResultSub')}</p>
            <button onClick={() => { setSearch(''); setFilterNiveau(''); setFilterPays(''); }} style={{ ...clearButton(c), marginTop: 24, background: c.accent, color: c.paper }}>
              {lang === 'fr' ? 'Réinitialiser les filtres' : 'Reset filters'}
            </button>
          </div>
        ) : (
          visibleBourses.map(bourse => (
            <VerticalBourseCard
              key={bourse.id || bourse.nom}
              bourse={bourse}
              user={user}
              onAskAI={handleAskAI}
              onClick={() => setSelected(bourse)}
              starred={starredNoms.has(bourse.nom?.trim().toLowerCase())}
              onStar={handleStar}
              applied={appliedNoms.has(bourse.nom?.trim().toLowerCase())}
              onApply={handleApply}
              onMatch={setMatchBourse}
              c={c}
              lang={lang}
            />
          ))
        )}

        {hasHiddenBourses && (
          <div onClick={() => setShowLoginModal(true)} style={{
            textAlign: 'center', padding: '48px 20px', marginTop: 32,
            borderTop: `1px solid ${c.ruleSoft}`, borderBottom: `1px solid ${c.ruleSoft}`,
            cursor: 'pointer', transition: 'background 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.background = c.paper2} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
            <div style={{ fontFamily: c.fSerif, fontSize: 18, color: c.ink, marginBottom: 4 }}>
              {filtered.length - 9} {lang === 'fr' ? 'bourse supplémentaire' : 'additional scholarship'}{filtered.length - 9 > 1 ? 's' : ''}
            </div>
            <div style={{ fontFamily: c.fSans, fontSize: 12, color: c.ink2, marginBottom: 16 }}>
              {lang === 'fr' ? 'Connectez-vous pour voir toutes les bourses' : 'Sign in to see all scholarships'}
            </div>
            <button style={{ ...actionButton(c, 'primary'), padding: '8px 24px' }}>
              🔐 {t('navbar', 'login')}
            </button>
          </div>
        )}
      </div>

      {/* Drawers et modals */}
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
      {matchBourse && <MatchDrawerIA bourse={matchBourse} user={user} onBack={() => setMatchBourse(null)} />}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} lang={lang} c={c} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} c={c} />}

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}

/* =============== STYLES PARTAGÉS =============== */
const selectStyle = (c) => ({
  padding: '9px 28px 9px 12px',
  fontFamily: c.fSans, fontSize: 13,
  background: c.paper, border: `1px solid ${c.ruleSoft}`,
  color: c.ink, outline: 'none', cursor: 'pointer',
  appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(c.ink3)}' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center'
});

const clearButton = (c) => ({
  padding: '9px 16px', fontFamily: c.fMono, fontSize: 11, fontWeight: 600,
  letterSpacing: '0.05em', background: 'transparent', border: `1px solid ${c.ruleSoft}`,
  cursor: 'pointer', color: c.ink2, transition: 'all 0.2s'
});