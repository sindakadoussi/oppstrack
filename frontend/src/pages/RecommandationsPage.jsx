// RecommandationsPage.jsx — style éditorial avec cartes verticales (identique BoursesPage)
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/config/axiosInstance';
import BourseDrawer from '../components/Boursedrawer';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';
import { tCountry, tLevel, tFunding, tField, tDescription } from '@/utils/translateDB';

/* ═══════════════════════════════════════════════════════════════════════════
   TOKENS (identique à la homepage)
═══════════════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */
const countryFlag = (pays) => {
  const flags = {
    'France':'🇫🇷','Allemagne':'🇩🇪','Royaume-Uni':'🇬🇧','États-Unis':'🇺🇸',
    'Canada':'🇨🇦','Japon':'🇯🇵','Chine':'🇨🇳','Australie':'🇦🇺',
    'Suisse':'🇨🇭','Pays-Bas':'🇳🇱','Maroc':'🇲🇦','Hongrie':'🇭🇺',
    'Corée du Sud':'🇰🇷','Nouvelle-Zélande':'🇳🇿','Turquie':'🇹🇷',
    'Belgique':'🇧🇪','Espagne':'🇪🇸','Italie':'🇮🇹','Portugal':'🇵🇹',
    'Roumanie':'🇷🇴','Arabie Saoudite':'🇸🇦','Brunei':'🇧🇳',
    'Tunisie':'🇹🇳','Algérie':'🇩🇿','Égypte':'🇪🇬',
  };
  return flags[pays] || '🌍';
};

const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'object' && image.url) return image.url;
  if (typeof image === 'string') return `${process.env.NEXT_PUBLIC_PAYLOAD_URL || ''}/api/media/${image}`;
  return null;
};

const formatDate = (d, lang = 'fr') => {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

/* ═══════════════════════════════════════════════════════════════════════════
   CARTE VERTICALE (identique à BoursesPage)
═══════════════════════════════════════════════════════════════════════════ */
function VerticalBourseCard({ bourse, user, onAskAI, onClick, starred, onStar, applied, onApply, onMatch, c, lang }) {
  const imageUrl = getImageUrl(bourse.image);
  const [starLoading, setStarLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  const handleStarClick = async (e) => {
    e.stopPropagation();
    setStarLoading(true);
    await onStar(bourse, starred);
    setStarLoading(false);
  };

  const handleApplyClick = async (e) => {
    e.stopPropagation();
    setApplyLoading(true);
    await onApply(bourse);
    setApplyLoading(false);
  };

  const handleMatchClick = (e) => {
    e.stopPropagation();
    onMatch(bourse);
  };

  return (
    <article
      onClick={onClick}
      style={{
        display: 'flex', gap: 24, alignItems: 'center',
        padding: '20px 0',
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
            {countryFlag(bourse.pays)} {tCountry(bourse.pays, lang)}
          </span>
          {bourse.niveau && (
            <span style={{ fontFamily: c.fMono, fontSize: 10, color: c.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tLevel(bourse.niveau, lang)}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12, fontFamily: c.fSans, fontSize: 12, color: c.ink2 }}>
          {bourse.financement && <span>💰 {tFunding(bourse.financement, lang)}</span>}
          {bourse.dateLimite && <span>⏰ {lang === 'fr' ? 'Limite' : 'Deadline'} : {formatDate(bourse.dateLimite, lang)}</span>}
          {bourse.tunisienEligible === 'oui' && <span>🇹🇳 Éligible Tunisie</span>}
        </div>

        {bourse.description && (
          <p style={{ fontFamily: c.fSans, fontSize: 13, color: c.ink2, lineHeight: 1.5, margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {tDescription(bourse.description, lang).length > 150 ? `${tDescription(bourse.description, lang).substring(0, 150)}...` : tDescription(bourse.description, lang)}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={handleStarClick} disabled={starLoading} style={{ ...actionButton(c), background: starred ? c.accent : 'transparent', color: starred ? c.paper : c.ink3, border: `1px solid ${c.rule}` }}>
            {starLoading ? '⏳' : (starred ? '★' : '☆')} {lang === 'fr' ? 'Favori' : 'Favorite'}
          </button>
          <button onClick={handleApplyClick} disabled={applyLoading} style={{ ...actionButton(c), background: applied ? '#2e6b3e' : c.accent, color: '#fff' }}>
            {applyLoading ? '⏳' : (applied ? '✓' : '+')} {applied ? (lang === 'fr' ? 'Ajoutée' : 'Added') : (lang === 'fr' ? 'Postuler' : 'Apply')}
          </button>
          <button onClick={handleMatchClick} style={{ ...actionButton(c), background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff' }}>
            🎯 {lang === 'fr' ? 'Match IA' : 'AI Match'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onAskAI(bourse); }} style={{ ...actionButton(c), border: `1px solid ${c.rule}`, background: 'transparent', color: c.accent }}>
            🤖 {lang === 'fr' ? 'IA' : 'AI'}
          </button>
        </div>
      </div>
    </article>
  );
}

const actionButton = (c) => ({
  padding: '6px 14px', fontSize: 11, fontWeight: 600, fontFamily: c.fMono,
  letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
  border: 'none', transition: 'all 0.15s ease',
});

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN MODAL (style éditorial)
═══════════════════════════════════════════════════════════════════════════ */
function LoginModal({ onClose, c, lang }) {
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', zIndex: 2001, width: 400, maxWidth: '92vw', background: c.surface, borderTop: `3px solid ${c.accent}`, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', background: c.paper2, borderBottom: `1px solid ${c.rule}` }}>
          <span style={{ fontSize: 22 }}>🔐</span>
          <span style={{ fontFamily: c.fSerif, fontWeight: 700, fontSize: 16, color: c.ink }}>{lang === 'fr' ? 'Connexion à OppsTrack' : 'Sign in to OppsTrack'}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: c.ink3 }} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '24px' }}>
          {status === 'idle' && (
            <>
              <p style={{ fontFamily: c.fSans, fontSize: 13, color: c.ink2, marginBottom: 20, lineHeight: 1.5 }}>
                {lang === 'fr' ? 'Entrez votre email pour recevoir un lien magique.' : 'Enter your email to receive a magic link.'}
              </p>
              <input type="email" placeholder={lang === 'fr' ? 'votre@email.com' : 'your@email.com'} value={email} autoFocus onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${c.ruleSoft}`, background: c.paper, color: c.ink, fontSize: 13, outline: 'none', fontFamily: c.fSans }} />
              {errMsg && <div style={{ color: c.danger, fontSize: 11, marginTop: 6 }}>{errMsg}</div>}
              <button style={{ width: '100%', marginTop: 16, padding: '10px', background: c.accent, color: c.paper, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono, letterSpacing: '0.05em' }} onClick={send}>
                ✉️ {lang === 'fr' ? 'Envoyer le lien magique' : 'Send magic link'}
              </button>
            </>
          )}
          {status === 'sending' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 32, height: 32, border: `3px solid ${c.ruleSoft}`, borderTopColor: c.accent, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              <p style={{ color: c.ink2, marginTop: 14 }}>{lang === 'fr' ? 'Envoi...' : 'Sending...'}</p>
            </div>
          )}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✉️</div>
              <div style={{ fontFamily: c.fSerif, fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 8 }}>{lang === 'fr' ? 'Lien envoyé !' : 'Link sent!'}</div>
              <p style={{ color: c.ink2, fontSize: 12, lineHeight: 1.5 }}>{lang === 'fr' ? 'Vérifiez votre boîte mail (et les spams).' : 'Check your inbox (and spam).'}</p>
              <button style={{ width: '100%', marginTop: 16, padding: '10px', background: '#166534', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={onClose}>
                ✓ {lang === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </div>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: c.danger, marginBottom: 12 }}>{errMsg}</p>
              <button style={{ width: '100%', marginTop: 16, padding: '10px', background: c.accent, color: c.paper, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => { setStatus('idle'); setErrMsg(''); }}>
                {lang === 'fr' ? 'Réessayer' : 'Retry'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE RECOMMANDATIONS
═══════════════════════════════════════════════════════════════════════════ */
export default function RecommandationsPage({
  user, handleSend, messages, input, setInput,
  loading: chatLoading,
  handleQuickReply, setView, onStarChange,
}) {
  const { t, lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [actives, setActives] = useState([]);
  const [expirees, setExpirees] = useState([]);
  const [starredNoms, setStarredNoms] = useState(new Set());
  const [appliedNoms, setAppliedNoms] = useState(new Set());

  // États pour le drawer MatchIA
  const [matchBourse, setMatchBourse] = useState(null);

  if (!user) {
    return (
      <>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.paper, padding: 24 }}>
          <div style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: '48px 40px', maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
            <h3 style={{ fontFamily: c.fSerif, fontSize: 20, fontWeight: 700, color: c.ink, margin: '0 0 8px' }}>
              {lang === 'fr' ? 'Recommandations non disponibles' : 'Recommendations unavailable'}
            </h3>
            <p style={{ color: c.ink2, fontSize: 13, lineHeight: 1.5, margin: '0 0 24px' }}>
              {lang === 'fr'
                ? 'Connectez-vous pour découvrir les bourses parfaitement adaptées à votre profil.'
                : 'Sign in to discover scholarships perfectly suited to your profile.'}
            </p>
            <button style={{ padding: '10px 28px', background: c.accent, color: c.paper, border: 'none', fontSize: 12, fontWeight: 600, fontFamily: c.fMono, cursor: 'pointer' }} onClick={() => setShowLoginModal(true)}>
              🔐 {lang === 'fr' ? 'Se connecter' : 'Sign in'}
            </button>
          </div>
        </div>
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} c={c} lang={lang} />}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </>
    );
  }

  const loadRecommandations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    try {
      const { data: userData } = await axiosInstance.get(`/api/users/${user.id}`, { params: { depth: 0 } });
      const { data: dataFav } = await axiosInstance.get('/api/favoris', { params: { 'where[user][equals]': user.id, limit: 1, depth: 0 } });
      const docFav = dataFav.docs?.[0];
      const newStarred = new Set((docFav?.bourses || []).map(b => b.nom?.trim().toLowerCase()));
      setStarredNoms(newStarred); onStarChange?.(newStarred.size);
      const { data: dataRoadmap } = await axiosInstance.get(API_ROUTES.roadmap.list, { params: { 'where[userId][equals]': user.id, limit: 100, depth: 0 } });
      setAppliedNoms(new Set((dataRoadmap.docs || []).map(b => b.nom?.trim().toLowerCase())));
      const profNiveau = (userData.niveau || userData.currentLevel || user.niveau || '').toLowerCase().trim();
      const profDomaine = (userData.domaine || userData.fieldOfStudy || user.domaine || '').toLowerCase().trim();
      const profPays = (userData.pays || user.pays || '').toLowerCase().trim();
      const { data: dataBourses } = await axiosInstance.get(API_ROUTES.bourses.list, { params: { limit: 200, depth: 0 } });
      const bourses = dataBourses.docs || [];
      const scored = bourses.filter(b => b.tunisienEligible !== 'non').map(b => {
        let score = 0; const reasons = [];
        const bN = (b.niveau || '').toLowerCase(), bD = (b.domaine || '').toLowerCase(), bP = (b.pays || '').toLowerCase();
        if (b.tunisienEligible === 'oui') { score += 30; reasons.push(lang === 'fr' ? 'Ouverte aux Tunisiens' : 'Open to Tunisians'); }
        if (profNiveau && bN.includes(profNiveau)) { score += 25; reasons.push(lang === 'fr' ? `Niveau ${b.niveau} correspond` : `Level ${b.niveau} matches`); }
        else if (bN.includes('tous') || bN === '') { score += 12; reasons.push(lang === 'fr' ? 'Tous niveaux acceptés' : 'All levels accepted'); }
        if (profDomaine && bD.includes(profDomaine)) { score += 20; reasons.push(lang === 'fr' ? `Domaine ${b.domaine} correspond` : `Field ${b.domaine} matches`); }
        else if (bD.includes('tous') || bD === '') { score += 10; reasons.push(lang === 'fr' ? 'Tous domaines acceptés' : 'All fields accepted'); }
        if (b.statut === 'active') { score += 15; reasons.push(lang === 'fr' ? 'Candidatures ouvertes' : 'Applications open'); }
        if (b.statut === 'a_venir') { score += 8; reasons.push(lang === 'fr' ? 'Bientôt disponible' : 'Coming soon'); }
        if (b.dateLimite) { const j = Math.floor((new Date(b.dateLimite) - new Date()) / 86400000); if (j > 30) score += 3; }
        if (profPays && (bP.includes(profPays) || bP.includes('international'))) score += 2;
        return { ...b, matchScore: score, matchReasons: reasons };
      });
      const newActives = scored.filter(b => b.statut !== 'expiree' && b.matchScore > 25).sort((a, b) => b.matchScore - a.matchScore).slice(0, 8);
      const newExpirees = scored.filter(b => b.statut === 'expiree' && b.matchScore > 25).sort((a, b) => b.matchScore - a.matchScore).slice(0, 4);
      setActives(newActives.length > 0 ? newActives : bourses.filter(b => b.statut !== 'expiree').slice(0, 5).map(b => ({ ...b, matchScore: 0, matchReasons: [] })));
      setExpirees(newExpirees);
    } catch (err) {
      setError((lang === 'fr' ? 'Impossible de charger les recommandations : ' : 'Could not load recommendations: ') + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  }, [user, onStarChange, lang]);

  const handleStar = async (bourse, isStarred) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id) return;
    try {
      const { data } = await axiosInstance.get('/api/favoris', { params: { 'where[user][equals]': user.id, limit: 1, depth: 0 } });
      const doc = data.docs?.[0];
      if (isStarred) {
        if (!doc?.id) return;
        await axiosInstance.patch(`/api/favoris/${doc.id}`, { bourses: (doc.bourses || []).filter(b => b.nom?.trim().toLowerCase() !== nomKey) });
        setStarredNoms(prev => { const s = new Set(prev); s.delete(nomKey); onStarChange?.(s.size); return s; });
      } else {
        const nb = { nom: bourse.nom, pays: bourse.pays || '', lienOfficiel: bourse.lienOfficiel || '', financement: bourse.financement || '', dateLimite: bourse.dateLimite || null, ajouteLe: new Date().toISOString() };
        if (doc?.id) await axiosInstance.patch(`/api/favoris/${doc.id}`, { bourses: [...(doc.bourses || []), nb] });
        else await axiosInstance.post('/api/favoris', { user: user.id, userEmail: user.email || '', bourses: [nb] });
        setStarredNoms(prev => { const s = new Set([...prev, nomKey]); onStarChange?.(s.size); return s; });
      }
      window.dispatchEvent(new CustomEvent('favoris-updated'));
    } catch (err) { console.error('[handleStar]', err); }
  };

  const handleApply = async (bourse) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id || appliedNoms.has(nomKey)) return;
    try {
      const res = await axiosInstance.post(API_ROUTES.roadmap.create, {
        userId: user.id, userEmail: user.email || '', nom: bourse.nom, pays: bourse.pays || '',
        lienOfficiel: bourse.lienOfficiel || '', financement: bourse.financement || '',
        dateLimite: bourse.dateLimite || null, ajouteLe: new Date().toISOString(), statut: 'en_cours', etapeCourante: 0,
      });
      await axiosInstance.post(WEBHOOK_ROUTES.generateRoadmap, {
        roadmapId: res.data.doc.id,
        user: { id: user.id, email: user.email, niveau: user.niveau, domaine: user.domaine },
        bourse: { nom: bourse.nom, pays: bourse.pays, lien: bourse.lienOfficiel },
      });
      setAppliedNoms(prev => new Set([...prev, nomKey]));
      window.dispatchEvent(new CustomEvent('roadmap-updated'));
      setTimeout(() => setView?.('roadmap'), 1000);
    } catch (err) {
      console.error('[handleApply]', err);
      alert(lang === 'fr' ? "Erreur lors de l'initialisation." : "Error initializing application.");
    }
  };

  const handleAskAI = useCallback((bourse) => {
    const message = lang === 'fr'
      ? `Peux-tu me dire si je suis éligible à la bourse "${bourse.nom}" en ${bourse.pays} ?`
      : `Can you tell me if I'm eligible for the "${bourse.nom}" scholarship in ${bourse.pays}?`;
    window.dispatchEvent(new CustomEvent('openChatWithMessage', { detail: { message } }));
  }, [lang]);

  useEffect(() => { loadRecommandations(); }, [loadRecommandations]);

  useEffect(() => {
    const handleFavorisUpdate = () => loadRecommandations();
    const handleRoadmapUpdate = () => loadRecommandations();
    window.addEventListener('favoris-updated', handleFavorisUpdate);
    window.addEventListener('roadmap-updated', handleRoadmapUpdate);
    return () => {
      window.removeEventListener('favoris-updated', handleFavorisUpdate);
      window.removeEventListener('roadmap-updated', handleRoadmapUpdate);
    };
  }, [loadRecommandations]);

  const filtered = filter === 'actives' ? actives : filter === 'expirees' ? expirees : [...actives, ...expirees];

  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 64px' }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          {[
            { num: actives.length, color: c.accent, label: lang === 'fr' ? 'Actives' : 'Active' },
            { num: expirees.length, color: c.warn, label: lang === 'fr' ? 'À préparer' : 'To prepare' },
            { num: starredNoms.size, color: c.warn, label: lang === 'fr' ? '★ Favoris' : '★ Favorites' },
            { num: appliedNoms.size, color: c.accent, label: '🗺️ Roadmap' },
          ].map((s, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${s.color}`, background: c.surface, border: `1px solid ${c.ruleSoft}`, padding: '12px 20px', minWidth: 100 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 10, color: c.ink3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${c.rule}`, marginBottom: 24 }}>
          {[
            { id: 'all', label: `${lang === 'fr' ? 'Toutes' : 'All'} (${actives.length + expirees.length})` },
            { id: 'actives', label: `✅ ${lang === 'fr' ? 'Actives' : 'Active'} (${actives.length})` },
            { id: 'expirees', label: `📅 ${lang === 'fr' ? 'À préparer' : 'To prepare'} (${expirees.length})` },
          ].map((f, i) => (
            <button key={f.id} style={{ padding: '8px 16px', marginRight: 16, background: 'transparent', border: 'none', color: filter === f.id ? c.accent : c.ink2, fontSize: 13, fontWeight: filter === f.id ? 700 : 400, cursor: 'pointer', fontFamily: c.fMono, letterSpacing: '0.02em', borderBottom: filter === f.id ? `2px solid ${c.accent}` : '2px solid transparent' }} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${c.ruleSoft}`, borderTopColor: c.accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: c.ink2, marginTop: 16, fontSize: 13 }}>{lang === 'fr' ? 'Analyse de votre profil...' : 'Analyzing your profile...'}</p>
          </div>
        )}

        {/* Erreur */}
        {error && !loading && (
          <div style={{ margin: '20px 0', padding: '12px 16px', background: '#fef2f2', borderLeft: `3px solid ${c.danger}`, color: c.danger, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {error}</span>
            <button style={{ padding: '6px 14px', background: c.danger, border: 'none', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono }} onClick={loadRecommandations}>
              {lang === 'fr' ? 'Réessayer' : 'Retry'}
            </button>
          </div>
        )}

        {/* Grille verticale (cartes identiques à BoursesPage) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.length === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <div style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, color: c.ink, marginBottom: 8 }}>
                {lang === 'fr' ? 'Aucune recommandation trouvée' : 'No recommendations found'}
              </div>
              <p style={{ color: c.ink2, fontSize: 13 }}>{lang === 'fr' ? 'Complétez votre profil pour de meilleures suggestions' : 'Complete your profile for better suggestions'}</p>
            </div>
          ) : (
            filtered.map(b => (
              <VerticalBourseCard
                key={b.id}
                bourse={b}
                user={user}
                onAskAI={handleAskAI}
                onClick={() => setSelected(b)}
                starred={starredNoms.has(b.nom?.trim().toLowerCase())}
                onStar={handleStar}
                applied={appliedNoms.has(b.nom?.trim().toLowerCase())}
                onApply={handleApply}
                onMatch={setMatchBourse}
                c={c}
                lang={lang}
              />
            ))
          )}
        </div>
      </div>

      {/* Drawers */}
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
      {matchBourse && (
        <MatchDrawerIA
          bourse={matchBourse}
          user={user}
          onBack={() => setMatchBourse(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}

// Note: vous devez importer MatchDrawerIA dans ce fichier (ou le placer ailleurs)
// Si MatchDrawerIA n'existe pas encore, vous pouvez commenter son utilisation.