// components/BourseDrawer.jsx — version style éditorial (tokens unipd.it)
import React, { useState, useEffect} from 'react';
import MatchDrawerIA from './MatchDrawerIA';
import axiosInstance from '@/config/axiosInstance';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';  // ✅ pour les tokens
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
   HELPERS (inchangés)
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

const calcMatch = (bourse, user) => { /* inchangé */ return null; }; // garder l'implémentation existante
const calcMatchDetails = (bourse, user) => { /* inchangé */ return null; };
const getScoreColor = (score) => {
  if (score === null) return '#64748b';
  if (score >= 85) return '#16a34a';
  if (score >= 65) return '#eab308';
  if (score >= 45) return '#f97316';
  return '#ef4444';
};
const getScoreLabel = (score, lang = 'fr') => { /* inchangé */ return ''; };
const daysLeft = (deadline, lang = 'fr') => { /* inchangé */ return null; };
const formatDate = (d, lang = 'fr') => { /* inchangé */ return null; };

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN MODAL (style adapté aux tokens)
═══════════════════════════════════════════════════════════════════════════ */
function LoginModal({ onClose }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);
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

  const t = {
    title: lang === 'fr' ? 'Connexion à OppsTrack' : 'Sign in to OppsTrack',
      eligibility: lang === 'fr' ? "Critères d'éligibilité" : 'Eligibility criteria',  // ✅ DÉJÀ PRÉSENT
    desc: lang === 'fr' ? 'Entrez votre email pour recevoir un <strong>lien de connexion magique</strong>.' : 'Enter your email to receive a <strong>magic login link</strong>.',
    placeholder: lang === 'fr' ? 'votre@email.com' : 'your@email.com',
    sendBtn: lang === 'fr' ? '✉️ Envoyer le lien magique' : '✉️ Send magic link',
    sending: lang === 'fr' ? 'Envoi en cours...' : 'Sending...',
    sent: lang === 'fr' ? 'Lien envoyé !' : 'Link sent!',
    sentDesc: lang === 'fr' ? 'Vérifiez votre boîte mail (et les spams).<br/>Cliquez sur le lien pour vous connecter.' : 'Check your inbox (and spam).<br/>Click the link to sign in.',
    close: lang === 'fr' ? '✓ Fermer' : '✓ Close',
    retry: lang === 'fr' ? 'Réessayer' : 'Retry',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', zIndex: 2001, width: 400, maxWidth: '92vw', background: c.surface, borderTop: `3px solid ${c.accent}`, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', background: c.paper2, borderBottom: `1px solid ${c.rule}` }}>
          <span style={{ fontSize: 22 }}>🔐</span>
          <span style={{ fontFamily: c.fSerif, fontWeight: 700, fontSize: 16, color: c.ink }}>{t.title}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: c.ink3 }}>✕</button>
        </div>
        <div style={{ padding: '24px' }}>
          {status === 'idle' && (
            <>
              <p style={{ fontFamily: c.fSans, fontSize: 13, color: c.ink2, marginBottom: 20, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: t.desc }} />
              <input type="email" placeholder={t.placeholder} value={email} autoFocus onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                style={{ width: '100%', padding: '11px 14px', border: `1px solid ${c.ruleSoft}`, background: c.paper, color: c.ink, fontSize: 14, outline: 'none', fontFamily: c.fSans }} />
              {errMsg && <div style={{ color: c.danger, fontSize: 12, marginTop: 8 }}>{errMsg}</div>}
              <button onClick={send} style={{ width: '100%', marginTop: 16, padding: '12px', background: c.accent, color: c.paper, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono, letterSpacing: '0.05em' }}>{t.sendBtn}</button>
            </>
          )}
          {status === 'sending' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 40, height: 40, border: `3px solid ${c.ruleSoft}`, borderTopColor: c.accent, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              <p style={{ color: c.ink2, marginTop: 14 }}>{t.sending}</p>
            </div>
          )}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>✉️</div>
              <div style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, color: '#166534', marginBottom: 8 }}>{t.sent}</div>
              <p style={{ color: c.ink2, fontSize: 13, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: t.sentDesc }} />
              <button onClick={onClose} style={{ ...modalBtn, background: '#166534', marginTop: 20 }}>{t.close}</button>
            </div>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: c.danger }}>{errMsg}</p>
              <button onClick={() => { setStatus('idle'); setErrMsg(''); }} style={{ ...modalBtn, background: c.accent, marginTop: 16 }}>{t.retry}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const modalBtn = {
  width: '100%', padding: '12px', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em'
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN BOURSE DRAWER (avec tokens + correction position sous navbar)
═══════════════════════════════════════════════════════════════════════════ */
export default function BourseDrawer({ bourse, onClose, onAskAI, onChoose, starred, onStar, applied, onApply, user }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);
  const [starLoading, setStarLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Dans BourseDrawer.jsx, remplacez le useEffect existant par celui-ci :

const [navbarHeight, setNavbarHeight] = useState(0);

useEffect(() => {
  const getNavbarHeight = () => {
    const navbar = document.querySelector('.ot-nav');
    if (!navbar) return 0;
    
    // Vérifier si la navbar est visible (pas cachée)
    const isHidden = navbar.style.transform === 'translateY(-100%)' || 
                     getComputedStyle(navbar).transform === 'matrix(1, 0, 0, 1, 0, -100%)' ||
                     navbar.classList.contains('hidden');
    
    // Si la navbar est cachée, retourner 0
    if (isHidden) return 0;
    
    return navbar.offsetHeight;
  };
  
  // Fonction pour mettre à jour la hauteur
  const updateHeight = () => {
    setNavbarHeight(getNavbarHeight());
  };
  
  // Initialiser
  updateHeight();
  
  // Observer les changements de la navbar (scroll, classes, style)
  const navbar = document.querySelector('.ot-nav');
  if (navbar) {
    const observer = new MutationObserver(updateHeight);
    observer.observe(navbar, { 
      attributes: true, 
      attributeFilter: ['style', 'class'] 
    });
    
    // Observer les changements de scroll via un intervalle léger
    const scrollInterval = setInterval(updateHeight, 500);
    
    return () => {
      observer.disconnect();
      clearInterval(scrollInterval);
    };
  }
  
  return () => {};
}, []);


  if (!bourse) return null;

  const dl = daysLeft(bourse.dateLimite, lang);
  const pct = user ? calcMatch(bourse, user) : null;
  const scoreColor = getScoreColor(pct);


  const t = {
    about: lang === 'fr' ? 'À propos' : 'About',
    eligibility: lang === 'fr' ? "Critères d'éligibilité" : 'Eligibility criteria',
    requiredDocs: lang === 'fr' ? 'Documents requis' : 'Required documents',
    optional: lang === 'fr' ? 'optionnel' : 'optional',
    details: lang === 'fr' ? 'Détails' : 'Details',
    country: lang === 'fr' ? 'Pays' : 'Country',
    level: lang === 'fr' ? 'Niveau' : 'Level',
    funding: lang === 'fr' ? 'Financement' : 'Funding',
    field: lang === 'fr' ? 'Domaine' : 'Field',
    officialLink: lang === 'fr' ? 'Lien officiel' : 'Official link',
    applyNow: lang === 'fr' ? '🗺️ Postuler maintenant' : '🗺️ Apply now',
    inRoadmap: lang === 'fr' ? '✅ Déjà dans la roadmap' : '✅ Already in roadmap',
    favorite: lang === 'fr' ? '☆ Ajouter aux favoris' : '☆ Add to favorites',
    favorited: lang === 'fr' ? '★ Favori' : '★ Favorited',
    askAI: lang === 'fr' ? "🤖 Demander à l'IA" : '🤖 Ask AI',
    matchAnalysis: lang === 'fr' ? 'Analyse IA complète du match' : 'Complete AI match analysis',
    lockedTitle: lang === 'fr' ? 'Contenu réservé' : 'Content reserved',
    lockedDesc: lang === 'fr' ? 'Connectez-vous pour voir les détails complets de cette bourse,\nvotre score de compatibilité et postuler directement.' : 'Sign in to see full scholarship details,\nyour compatibility score and apply directly.',
    signIn: lang === 'fr' ? '🔐 Se connecter' : '🔐 Sign in',
    deadlineExpired: lang === 'fr' ? 'Deadline expirée' : 'Deadline expired',
    deadlineIn: lang === 'fr' ? 'Deadline dans' : 'Deadline in',
    match: lang === 'fr' ? 'Match' : 'Match',
  };

  // Overlay commun
  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 900,
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    animation: 'fadeIn 0.2s ease'
  };

  // Drawer commun (positionné sous la navbar)
  const drawerBaseStyle = {
    position: 'fixed',
      top: navbarHeight > 0 ? navbarHeight : 0,  // ← Si navbar cachée, top = 0
    right: 0,
    bottom: 0,
    zIndex: 901,
    width: 500,
    maxWidth: '95vw',
    background: c.surface,
    borderLeft: `1px solid ${c.rule}`,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideIn 0.25s ease',
    overflowY: 'auto',
    boxShadow: '-8px 0 32px rgba(0,0,0,0.08)'
  };

  // ═══════════════════════════════════════════════════════════════════════
  // MODE INVITÉ (non connecté)
  // ═══════════════════════════════════════════════════════════════════════
  if (!user) {
    return (
      <>
        <div style={overlayStyle} onClick={onClose} />
        <div style={drawerBaseStyle}>
          <div style={{ padding: '20px 22px', borderBottom: `1px solid ${c.ruleSoft}`, background: c.paper2 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', marginBottom: 12 }}>
  <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: c.ink3 }}>✕</button>
</div>
            <h2 style={{ fontFamily: c.fSerif, fontSize: '1.2rem', fontWeight: 700, color: c.ink, marginBottom: 8 }}>{bourse.nom}</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ ...tagLight(c), background: c.paper2, border: `1px solid ${c.ruleSoft}`, color: c.ink2 }}>{countryFlag(bourse.pays)} {tCountry(bourse.pays, lang)}</span>
              {bourse.niveau && <span style={{ ...tagLight(c), background: c.paper2, border: `1px solid ${c.ruleSoft}`, color: c.ink2 }}>🎓 {tLevel(bourse.niveau, lang)}</span>}
              <span style={{ ...tagLight(c), background: c.paper2, border: `1px solid ${c.ruleSoft}`, color: c.accent }}>
                💰 {tFunding(bourse.financement, lang) || (lang === 'fr' ? '100% financée' : '100% funded')}
              </span>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
            <h3 style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, color: c.ink, marginBottom: 8 }}>{t.lockedTitle}</h3>
            <p style={{ fontFamily: c.fSans, fontSize: 13, color: c.ink2, lineHeight: 1.5, marginBottom: 24, whiteSpace: 'pre-line' }}>{t.lockedDesc}</p>
            <button onClick={() => setShowLoginModal(true)} style={{ padding: '10px 28px', background: c.accent, border: 'none', color: c.paper, fontSize: 13, fontWeight: 600, fontFamily: c.fMono, letterSpacing: '0.05em', cursor: 'pointer' }}>{t.signIn}</button>
          </div>
        </div>
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MODE CONNECTÉ (drawer complet)
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={drawerBaseStyle}>
        {/* Header */}
        <div style={{ padding: '20px 22px', borderBottom: `1px solid ${c.ruleSoft}`, background: c.paper2 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', marginBottom: 12 }}>
  <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: c.ink3 }}>✕</button>
</div>
          <h2 style={{ fontFamily: c.fSerif, fontSize: '1.2rem', fontWeight: 700, color: c.ink, marginBottom: 8 }}>{bourse.nom}</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={tagLight(c)}>{countryFlag(bourse.pays)} {tCountry(bourse.pays, lang)}</span>
            {bourse.niveau && <span style={tagLight(c)}>🎓 {tLevel(bourse.niveau, lang)}</span>}
            <span style={{ ...tagLight(c), background: c.accent + '20', color: c.accent, borderColor: c.accent + '40' }}>
              💰 {tFunding(bourse.financement, lang) || (lang === 'fr' ? '100% financée' : '100% funded')}
            </span>
            {pct !== null && (
              <span onClick={() => setShowMatch(true)} style={{ ...tagLight(c), background: c.paper2, border: `1px solid ${c.ruleSoft}`, fontWeight: 600, cursor: 'pointer', color: getScoreColor(pct) }}>
                🎯 {pct}% {t.match}
              </span>
            )}
          </div>
        </div>

        {/* Deadline (alerte) */}
        {dl && (
          <div style={{ padding: '10px 22px', background: dl.color === '#dc2626' ? '#fef2f2' : dl.color === '#d97706' ? '#fffbeb' : '#f0fdf4', borderBottom: `2px solid ${dl.color}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⏰</span>
            <div>
              <div style={{ fontSize: 12, color: dl.color, fontWeight: 700 }}>
                {dl.label === (lang === 'fr' ? 'Expirée' : 'Expired') ? t.deadlineExpired : `${t.deadlineIn} ${dl.label}`}
              </div>
              <div style={{ fontSize: 11, color: c.ink3 }}>{formatDate(bourse.dateLimite, lang)}</div>
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '20px 22px', flex: 1 }}>
          {bourse.description && (
            <div style={{ marginBottom: 20 }}>
              <div style={labelStyle(c)}>{t.about}</div>
              <p style={{ fontFamily: c.fSans, fontSize: 13, color: c.ink2, lineHeight: 1.6, margin: 0 }}>
                {tDescription(bourse.description, lang)}
              </p>
            </div>
          )}

          {bourse.eligibilite?.niveauRequis && (
            <div style={infoRowStyle(c)}>
              <span style={{ fontSize: 16, marginRight: 10, color: c.accent }}>🎓</span>
              <div>
                <div style={{ fontSize: 11, color: c.ink3, marginBottom: 2 }}>{t.requiredLevel}</div>
                <div style={{ fontSize: 13, color: c.ink, fontWeight: 500 }}>{tLevel(bourse.eligibilite.niveauRequis, lang)}</div>
              </div>
            </div>
          )}

           {bourse.eligibilite && (
    <div style={{ marginBottom: 20 }}>
      <div style={labelStyle(c)}>{t.eligibility}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        
        {bourse.eligibilite.nationalitesEligibles && (
          <div style={{ padding: '10px 14px', background: c.paper2, border: `1px solid ${c.ruleSoft}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.accent, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {lang === 'fr' ? 'Nationalités éligibles' : 'Eligible nationalities'}
            </div>
            <div style={{ fontSize: 13, color: c.ink2, lineHeight: 1.5 }}>
              {bourse.eligibilite.nationalitesEligibles}
            </div>
          </div>
        )}

        {bourse.eligibilite.niveauRequis && (
          <div style={{ padding: '10px 14px', background: c.paper2, border: `1px solid ${c.ruleSoft}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.accent, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {lang === 'fr' ? 'Niveau requis' : 'Required level'}
            </div>
            <div style={{ fontSize: 13, color: c.ink2 }}>
              {bourse.eligibilite.niveauRequis}
            </div>
          </div>
        )}

        {bourse.eligibilite.ageMax && (
          <div style={{ padding: '10px 14px', background: c.paper2, border: `1px solid ${c.ruleSoft}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.accent, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {lang === 'fr' ? 'Âge maximum' : 'Maximum age'}
            </div>
            <div style={{ fontSize: 13, color: c.ink2 }}>
              {bourse.eligibilite.ageMax} {lang === 'fr' ? 'ans' : 'years old'}
            </div>
          </div>
        )}

        {bourse.eligibilite.conditionsSpeciales && (
          <div style={{ padding: '10px 14px', background: c.paper2, border: `1px solid ${c.ruleSoft}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.accent, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {lang === 'fr' ? 'Conditions spéciales' : 'Special conditions'}
            </div>
            <div style={{ fontSize: 13, color: c.ink2, lineHeight: 1.5 }}>
              {bourse.eligibilite.conditionsSpeciales}
            </div>
          </div>
        )}
      </div>
    </div>
  )}

          {bourse.documentsRequis?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={labelStyle(c)}>{t.requiredDocs} ({bourse.documentsRequis.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {bourse.documentsRequis.map((doc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', background: doc.obligatoire ? c.paper2 : c.paper, border: `1px solid ${doc.obligatoire ? c.accent + '40' : c.ruleSoft}` }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1, color: doc.obligatoire ? c.accent : c.ink3 }}>{doc.obligatoire ? '✓' : '○'}</span>
                    <div>
                      <div style={{ fontSize: 13, color: doc.obligatoire ? c.ink : c.ink2, fontWeight: doc.obligatoire ? 600 : 400 }}>{doc.nom}{!doc.obligatoire && <span style={{ fontSize: 10, marginLeft: 6, color: c.ink3 }}> ({t.optional})</span>}</div>
                      {doc.description && doc.description !== 'empty' && <div style={{ fontSize: 11, color: c.ink3, marginTop: 2 }}>{doc.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div style={labelStyle(c)}>{t.details}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { icon: '📍', label: t.country, val: tCountry(bourse.pays, lang) },
                { icon: '🎓', label: t.level, val: tLevel(bourse.niveau, lang) },
                { icon: '💰', label: t.funding, val: tFunding(bourse.financement, lang) },
                { icon: '📚', label: t.field, val: tField(bourse.domaine, lang) }
              ].filter(r => r.val).map((row, i) => (
                <div key={i} style={infoRowStyle(c)}>
                  <span style={{ fontSize: 14, width: 24, textAlign: 'center', color: c.accent }}>{row.icon}</span>
                  <span style={{ fontSize: 12, color: c.ink3, width: 80 }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: c.ink, fontWeight: 500, flex: 1 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {bourse.lienOfficiel && (
            <div style={{ marginBottom: 20 }}>
              <div style={labelStyle(c)}>{t.officialLink}</div>
              <a href={bourse.lienOfficiel} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: c.paper2, border: `1px solid ${c.ruleSoft}`, color: c.accent, fontSize: 13, textDecoration: 'none', wordBreak: 'break-all' }}>
                <span>🔗</span><span style={{ flex: 1 }}>{bourse.lienOfficiel}</span><span>↗</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: '16px 22px 24px', borderTop: `1px solid ${c.ruleSoft}`, background: c.paper2, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            style={{ width: '100%', padding: '12px', background: applied ? c.ruleSoft : c.accent, color: applied ? c.ink2 : c.paper, border: 'none', fontSize: 13, fontWeight: 600, fontFamily: c.fMono, letterSpacing: '0.05em', cursor: applied ? 'default' : 'pointer' }}
            onClick={!applied ? async () => { setApplyLoading(true); await onApply(bourse); setApplyLoading(false); onClose(); } : undefined}
            disabled={applied || applyLoading}
          >
            {applyLoading ? '⏳' : applied ? t.inRoadmap : t.applyNow}
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ flex: 1, padding: '10px', background: starred ? c.accent + '20' : c.paper, border: `1px solid ${starred ? c.accent : c.ruleSoft}`, color: starred ? c.accent : c.ink2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono }}
              onClick={async () => { setStarLoading(true); await onStar(bourse, starred); setStarLoading(false); }}
              disabled={starLoading}
            >
              {starLoading ? '⏳' : starred ? t.favorited : t.favorite}
            </button>
            <button
              style={{ flex: 1, padding: '10px', background: c.accent, border: 'none', color: c.paper, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono }}
              onClick={() => { onAskAI(bourse); onClose(); }}
            >
              {t.askAI}
            </button>
          </div>

          <button
            onClick={() => setShowMatch(true)}
            style={{ width: '100%', padding: '10px', background: c.paper, border: `1px solid ${c.ruleSoft}`, color: c.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <span>🤖</span>
            <span>{t.matchAnalysis} — {pct}%</span>
            <span style={{ marginLeft: 'auto', color: c.ink3 }}>→</span>
          </button>
        </div>
      </div>

      {showMatch && <MatchDrawerIA bourse={bourse} user={user} onBack={() => setShowMatch(false)} />}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES PARTAGÉS (basés sur les tokens)
═══════════════════════════════════════════════════════════════════════════ */
const tagLight = (c) => ({
  fontSize: 11,
  padding: '3px 10px',
  background: c.paper,
  border: `1px solid ${c.ruleSoft}`,
  color: c.ink2,
  fontFamily: c.fMono,
  letterSpacing: '0.02em'
});

const labelStyle = (c) => ({
  fontSize: 10,
  fontWeight: 700,
  color: c.accent,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 10,
  paddingBottom: 6,
  borderBottom: `2px solid ${c.accent}`,
  display: 'inline-block',
  fontFamily: c.fMono
});

const infoRowStyle = (c) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 12px',
  background: c.paper,
  border: `1px solid ${c.ruleSoft}`
});