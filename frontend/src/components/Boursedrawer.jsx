// components/BourseDrawer.jsx
import React, { useState } from 'react';
import MatchDrawerIA from './MatchDrawerIA';
import axiosInstance from '@/config/axiosInstance';
import { useT } from '../i18n';  // ✅ Import pour la traduction
import { tCountry, tLevel, tFunding, tField, tDescription } from '@/utils/translateDB';


/* ═══════════════════════════════════════════════════════════════════════════
   UTILS & HELPERS (avec support multilingue)
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

const calcMatch = (bourse, user) => {
  if (!bourse || !user) return null;
  let score = 0, total = 0;

  // 1. Éligibilité Tunisienne (20 pts)
  if (bourse.tunisienEligible) {
    total += 20;
    const eligible = String(bourse.tunisienEligible).toLowerCase().trim();
    const userIsTunisian =
      (user.nationality || user.pays || '').toLowerCase().includes('tunisie') ||
      (user.countryOfResidence || '').toLowerCase().includes('tunisie') ||
      (user.pays || '').toLowerCase().includes('tunisie');
    if (eligible === 'oui' || eligible === 'inconnu') score += 20;
    else if (eligible === 'non' && !userIsTunisian) score += 15;
  }

  // 2. Pays (25 pts)
  if (user.pays || user.nationality || user.countryOfResidence || user.targetCountries?.length > 0) {
    total += 25;
    const bp = String(bourse.pays || '').toLowerCase().trim();
    const userPaysList = [
      user.pays, user.nationality, user.countryOfResidence,
      ...(user.targetCountries || []).map(t => t.country),
    ].filter(Boolean).map(p => p.toLowerCase().trim());

    const isInternational =
      bp.includes('international') || bp.includes('tous pays') ||
      bp.includes('any country')   || bp.includes('monde') || bp === '';

    const matchPays = userPaysList.some(up =>
      bp === up || bp.includes(up) || up.includes(bp) || isInternational
    );
    if (matchPays) score += 25;
    else if (isInternational) score += 18;
  }

  // 3. Niveau (30 pts)
  if (user.niveau || user.currentLevel || user.targetDegree) {
    total += 30;
    const bn = String(bourse.niveau || bourse.eligibilite?.niveauRequis || '').toLowerCase();
    const userLevels = [user.niveau, user.currentLevel, user.targetDegree]
      .filter(Boolean).map(l => l.toLowerCase().trim());
    const baseLevels = userLevels.map(l => l.replace(/\s*\d+$/, '').trim());
    const allUserLevels = [...userLevels, ...baseLevels];

    const matchNiveau = allUserLevels.some(level =>
      bn.includes(level) ||
      (level.includes('master')   && bn.includes('master'))  ||
      (level.includes('licence')  && (bn.includes('licence') || bn.includes('bachelor') || bn.includes('undergraduate'))) ||
      (level.includes('doctorat') && (bn.includes('doctorat') || bn.includes('phd') || bn.includes('doctoral'))) ||
      bn.includes('tous niveaux') || bn.includes('any level')
    );
    if (matchNiveau) score += 30;
  }

  // 4. Domaine (25 pts)
  if (user.domaine || user.fieldOfStudy || user.targetFields?.length > 0) {
    total += 25;
    const bd = String(bourse.domaine || '').toLowerCase();
    const desc = String(bourse.description || '').toLowerCase();
    const conditions = String(bourse.eligibilite?.conditionsSpeciales || '').toLowerCase();
    const userDomains = [
      user.domaine, user.fieldOfStudy,
      ...(user.targetFields || []).map(f => f.field),
    ].filter(Boolean).map(d => d.toLowerCase().trim());

    let domainPoints = 0;
    for (const ud of userDomains) {
      if (bd.includes(ud) || ud.includes(bd) || desc.includes(ud) || conditions.includes(ud)) {
        domainPoints = 25; break;
      }
      const words = ud.split(/\s+/).filter(w => w.length > 3);
      if (words.some(w => bd.includes(w) || desc.includes(w) || conditions.includes(w))) {
        domainPoints = Math.max(domainPoints, 14);
      }
    }
    score += domainPoints;
  }

  // 5. Langue (10 pts bonus)
  if (bourse.langue && user.languages?.length > 0) {
    total += 10;
    const bl = String(bourse.langue).toLowerCase().trim();
    const userLangs = user.languages.map(l => String(l.language || '').toLowerCase().trim()).filter(Boolean);
    const matchLangue = userLangs.some(ul =>
      bl.includes(ul) || ul.includes(bl) ||
      (bl === 'anglais' && ul.includes('english')) ||
      (bl === 'français' && ul.includes('french'))
    );
    if (matchLangue) score += 10;
  }

  if (total === 0) return null;
  return Math.min(100, Math.round((score / total) * 100));
};

const calcMatchDetails = (bourse, user) => {
  if (!bourse || !user) return null;

  const details = [];
  let totalScore = 0, totalMax = 0;

  // 1. Éligibilité Tunisienne
  {
    const max = 20;
    const eligible = String(bourse.tunisienEligible || '').toLowerCase().trim();
    const userIsTunisian =
      (user.nationality || '').toLowerCase().includes('tunisie') ||
      (user.pays || '').toLowerCase().includes('tunisie') ||
      (user.countryOfResidence || '').toLowerCase().includes('tunisie');
    let pts = 0;
    if (eligible === 'oui' || eligible === 'inconnu') pts = 20;
    else if (eligible === 'non' && !userIsTunisian) pts = 15;
    totalMax += max; totalScore += pts;
    details.push({
      label: 'Éligibilité tunisienne', icon: '🇹🇳', points: pts, max,
      matched: pts > 0, isBonus: true,
      userVal: userIsTunisian ? 'Tunisien(ne)' : (user.nationality || '—'),
      bourseVal: eligible === 'oui' ? 'Oui' : eligible === 'non' ? 'Non' : 'Non précisé',
      reason: pts > 0
        ? (eligible === 'oui' ? 'Bourse ouverte aux Tunisiens ✓'
           : eligible === 'inconnu' ? 'Éligibilité non précisée — score attribué par défaut'
           : 'Non tunisien(ne) + bourse fermée → points attribués quand même')
        : 'Tunisien(ne) mais bourse fermée aux Tunisiens',
    });
  }

  // 2. Pays
  {
    const max = 25;
    const bp = String(bourse.pays || '').toLowerCase().trim();
    const userPaysList = [
      user.pays, user.nationality, user.countryOfResidence,
      ...(user.targetCountries || []).map(t => t.country),
    ].filter(Boolean).map(p => p.toLowerCase().trim());

    const isInternational = bp.includes('international') || bp.includes('tous pays') || bp === '';
    const matchPays = userPaysList.some(up => bp === up || bp.includes(up) || up.includes(bp));
    let pts = 0;
    if (matchPays) pts = 25;
    else if (isInternational) pts = 18;
    totalMax += max; totalScore += pts;
    details.push({
      label: 'Pays / Destination', icon: '📍', points: pts, max,
      matched: pts > 0,
      userVal: userPaysList.join(', ') || '—',
      bourseVal: bourse.pays || 'International',
      reason: matchPays
        ? `"${userPaysList[0]}" correspond à "${bourse.pays}" ✓`
        : isInternational
          ? `Bourse internationale → ouverte à tous les pays (+${pts} pts)`
          : `Aucun de vos pays cibles ne correspond à "${bourse.pays}"`,
    });
  }

  // 3. Niveau
  {
    const max = 30;
    const bn = String(bourse.niveau || bourse.eligibilite?.niveauRequis || '').toLowerCase();
    const userLevels = [user.niveau, user.currentLevel, user.targetDegree]
      .filter(Boolean).map(l => l.toLowerCase().trim());
    const baseLevels = userLevels.map(l => l.replace(/\s*\d+$/, '').trim());
    const allUserLevels = [...new Set([...userLevels, ...baseLevels])];
    const matchNiveau = allUserLevels.some(level =>
      bn.includes(level) ||
      (level.includes('master')   && bn.includes('master'))  ||
      (level.includes('licence')  && (bn.includes('licence') || bn.includes('bachelor'))) ||
      (level.includes('doctorat') && (bn.includes('doctorat') || bn.includes('phd'))) ||
      bn.includes('tous niveaux') || bn.includes('any level')
    );
    const pts = matchNiveau ? 30 : 0;
    totalMax += max; totalScore += pts;
    details.push({
      label: "Niveau d'études", icon: '🎓', points: pts, max,
      matched: matchNiveau,
      userVal: userLevels.join(', ') || '—',
      bourseVal: bourse.niveau || '—',
      reason: matchNiveau
        ? `"${userLevels[0]}" correspond à "${bourse.niveau}" ✓`
        : `"${userLevels[0] || '?'}" ne correspond pas à "${bourse.niveau || '?'}"`,
    });
  }

  // 4. Domaine
  {
    const max = 25;
    const bd = String(bourse.domaine || '').toLowerCase();
    const desc = String(bourse.description || '').toLowerCase();
    const userDomains = [
      user.domaine, user.fieldOfStudy,
      ...(user.targetFields || []).map(f => f.field),
    ].filter(Boolean).map(d => d.toLowerCase().trim());

    let pts = 0, matchedDomain = '';
    for (const ud of userDomains) {
      if (bd.includes(ud) || ud.includes(bd) || desc.includes(ud)) { pts = 25; matchedDomain = ud; break; }
      const words = ud.split(/\s+/).filter(w => w.length > 3);
      if (words.some(w => bd.includes(w) || desc.includes(w))) {
        pts = Math.max(pts, 14); matchedDomain = ud;
      }
    }
    totalMax += max; totalScore += pts;
    details.push({
      label: "Domaine d'études", icon: '📚', points: pts, max,
      matched: pts > 0,
      userVal: userDomains.join(', ') || '—',
      bourseVal: bourse.domaine || 'Tous domaines',
      reason: pts === 25
        ? `"${matchedDomain}" correspond exactement au domaine de la bourse ✓`
        : pts === 14
          ? `Correspondance partielle avec "${matchedDomain}"`
          : `Aucun de vos domaines ne correspond à "${bourse.domaine || 'Tous domaines'}"`,
    });
  }

  // 5. Langue
  if (bourse.langue) {
    const max = 10;
    const bl = String(bourse.langue).toLowerCase();
    const userLangs = (user.languages || []).map(l => String(l.language || '').toLowerCase()).filter(Boolean);
    const matchLangue = userLangs.some(ul =>
      bl.includes(ul) || ul.includes(bl) ||
      (bl === 'anglais' && ul.includes('english')) ||
      (bl === 'français' && ul.includes('french'))
    );
    const pts = matchLangue ? 10 : 0;
    totalMax += max; totalScore += pts;
    details.push({
      label: 'Langue', icon: '🗣️', points: pts, max,
      matched: matchLangue, isBonus: true,
      userVal: userLangs.join(', ') || '—',
      bourseVal: bourse.langue,
      reason: matchLangue
        ? `Vous maîtrisez "${bl}" ✓`
        : `Langue requise "${bl}" non trouvée dans votre profil`,
    });
  }

  const pct = totalMax > 0 ? Math.min(100, Math.round((totalScore / totalMax) * 100)) : 0;
  return { score: totalScore, total: totalMax, pct, details };
};

const getScoreColor = (score) => {
  if (score === null) return '#64748b';
  if (score >= 85) return '#16a34a';
  if (score >= 65) return '#eab308';
  if (score >= 45) return '#f97316';
  return '#ef4444';
};

const getScoreLabel = (score, lang = 'fr') => {
  if (score === null) return lang === 'fr' ? 'Non évalué' : 'Not evaluated';
  
  const labels = {
    fr: { excellent: 'Excellent 🏆', veryGood: 'Très bien 🌟', good: 'Bien 👍', fair: 'Correct ✨', low: 'À améliorer 📈', poor: 'À renforcer ⚠️' },
    en: { excellent: 'Excellent 🏆', veryGood: 'Very good 🌟', good: 'Good 👍', fair: 'Fair ✨', low: 'To improve 📈', poor: 'Needs work ⚠️' }
  };
  
  const t = labels[lang] || labels.fr;
  if (score >= 85) return t.excellent;
  if (score >= 70) return t.veryGood;
  if (score >= 55) return t.good;
  if (score >= 40) return t.fair;
  if (score >= 25) return t.low;
  return t.poor;
};

const daysLeft = (deadline, lang = 'fr') => {
  if (!deadline) return null;
  const diff = Math.round((new Date(deadline) - new Date()) / (1000*60*60*24));
  
  const labels = {
    fr: { expired: 'Expirée', today: "Aujourd'hui !", days: 'jours', remaining: 'restants' },
    en: { expired: 'Expired', today: 'Today!', days: 'days', remaining: 'remaining' }
  };
  const t = labels[lang] || labels.fr;
  
  if (diff < 0)   return { label: t.expired, color: '#dc2626' };
  if (diff === 0) return { label: t.today, color: '#dc2626' };
  if (diff <= 30) return { label: `${diff} ${t.days}`, color: '#d97706' };
  return { label: `${diff} ${t.days}`, color: '#16a34a' };
};

const formatDate = (d, lang = 'fr') => {
  if (!d) return null;
  try { 
    return new Date(d).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { 
      day: 'numeric', 
      month: lang === 'fr' ? 'long' : 'short', 
      year: 'numeric' 
    }); 
  } catch { 
    return d; 
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN MODAL (traduit)
═══════════════════════════════════════════════════════════════════════════ */
function LoginModal({ onClose }) {
  const { lang } = useT();
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

  // Textes traduits
  const t = {
    title: lang === 'fr' ? 'Connexion à OppsTrack' : 'Sign in to OppsTrack',
    desc: lang === 'fr' 
      ? 'Entrez votre email pour recevoir un <strong>lien de connexion magique</strong>.' 
      : 'Enter your email to receive a <strong>magic login link</strong>.',
    placeholder: lang === 'fr' ? 'votre@email.com' : 'your@email.com',
    sendBtn: lang === 'fr' ? '✉️ Envoyer le lien magique' : '✉️ Send magic link',
    sending: lang === 'fr' ? 'Envoi en cours...' : 'Sending...',
    sent: lang === 'fr' ? 'Lien envoyé !' : 'Link sent!',
    sentDesc: lang === 'fr' 
      ? 'Vérifiez votre boîte mail (et les spams).<br/>Cliquez sur le lien pour vous connecter.' 
      : 'Check your inbox (and spam).<br/>Click the link to sign in.',
    close: lang === 'fr' ? '✓ Fermer' : '✓ Close',
    retry: lang === 'fr' ? 'Réessayer' : 'Retry',
  };

  return (
    <div style={M.overlay}>
      <div style={M.box}>
        <div style={M.head}>
          <span style={{ fontSize: 22 }}>🔐</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{t.title}</span>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={M.body}>
          {status === 'idle' && (
            <>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: t.desc }} />
              <input type="email" placeholder={t.placeholder} value={email} autoFocus onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={M.input} />
              {errMsg && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{errMsg}</div>}
              <button style={M.btn} onClick={send}>{t.sendBtn}</button>
            </>
          )}
          {status === 'sending' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={M.spinner} />
              <p style={{ color: '#64748b', marginTop: 14 }}>{t.sending}</p>
            </div>
          )}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>✉️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 8 }}>{t.sent}</div>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: t.sentDesc }} />
              <button style={{ ...M.btn, background: '#166534', marginTop: 20 }} onClick={onClose}>{t.close}</button>
            </div>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#dc2626', marginBottom: 12 }}>{errMsg}</p>
              <button style={{ ...M.btn, background: '#dc2626' }} onClick={() => { setStatus('idle'); setErrMsg(''); }}>{t.retry}</button>
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
   MAIN BOURSE DRAWER (traduit)
═══════════════════════════════════════════════════════════════════════════ */
export default function BourseDrawer({ bourse, onClose, onAskAI, onChoose, starred, onStar, applied, onApply, user }) {
  const { lang } = useT();  // ✅ Accès à la langue
  
  if (!bourse) return null;
  
  const dl = daysLeft(bourse.dateLimite, lang);  // ✅ Passer lang
  const [starLoading, setStarLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const pct = user ? calcMatch(bourse, user) : null;
  const scoreColor = getScoreColor(pct);

  // ✅ Textes traduits centralisés
  const t = {
    // Header
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
    
    // Footer actions
    applyNow: lang === 'fr' ? '🗺️ Postuler maintenant' : '🗺️ Apply now',
    inRoadmap: lang === 'fr' ? '✅ Déjà dans la roadmap' : '✅ Already in roadmap',
    favorite: lang === 'fr' ? '☆ Ajouter aux favoris' : '☆ Add to favorites',
    favorited: lang === 'fr' ? '★ Favori' : '★ Favorited',
    askAI: lang === 'fr' ? "🤖 Demander à l'IA" : '🤖 Ask AI',
    matchAnalysis: lang === 'fr' ? 'Analyse IA complète du match' : 'Complete AI match analysis',
    
    // Guest mode
    lockedTitle: lang === 'fr' ? 'Contenu réservé' : 'Content reserved',
    lockedDesc: lang === 'fr' 
      ? 'Connectez-vous pour voir les détails complets de cette bourse,\nvotre score de compatibilité et postuler directement.' 
      : 'Sign in to see full scholarship details,\nyour compatibility score and apply directly.',
    signIn: lang === 'fr' ? '🔐 Se connecter' : '🔐 Sign in',
    
    // Deadline
    deadlineExpired: lang === 'fr' ? 'Deadline expirée' : 'Deadline expired',
    deadlineIn: lang === 'fr' ? `Deadline dans` : `Deadline in`,
    
    // Eligibility labels
    nationalities: lang === 'fr' ? 'Nationalités éligibles' : 'Eligible nationalities',
    requiredLevel: lang === 'fr' ? 'Niveau requis' : 'Required level',
    maxAge: lang === 'fr' ? 'Âge maximum' : 'Maximum age',
    specialConditions: lang === 'fr' ? 'Conditions spéciales' : 'Special conditions',
    years: lang === 'fr' ? 'ans' : 'years',
  };

  // 🔒 Mode invité : drawer simplifié avec bouton connexion
  if (!user) {
    return (
      <>
        <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:900, background:'rgba(26,58,107,0.4)', backdropFilter:'blur(4px)', animation:'fadeIn 0.2s ease' }}/>
        
        <div style={{ position:'fixed', top:0, right:0, bottom:0, zIndex:901, width:500, maxWidth:'95vw', background:'#ffffff', borderLeft:'3px solid #f5a623', display:'flex', flexDirection:'column', animation:'slideIn 0.25s ease', boxShadow:'-8px 0 32px rgba(26,58,107,0.15)' }}>
          
          {/* Header simple */}
          <div style={{ padding:'20px 22px', background:'#1a3a6b', flexShrink:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div style={{ fontSize:28, width:52, height:52, borderRadius:10, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {countryFlag(bourse.pays)}
              </div>
              <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:32, height:32, borderRadius:6, cursor:'pointer', fontSize:16 }}>✕</button>
            </div>
            <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#ffffff', marginBottom:8, lineHeight:1.3 }}>{bourse.nom}</h2>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <span style={D.tagLight}>{countryFlag(bourse.pays)} {tCountry(bourse.pays, lang)}</span>
{bourse.niveau && <span style={D.tagLight}>🎓 {tLevel(bourse.niveau, lang)}</span>}
<span style={{ ...D.tagLight, background:'rgba(245,166,35,0.2)', color:'#f5a623', borderColor:'rgba(245,166,35,0.3)' }}>
  💰 {tFunding(bourse.financement, lang) || (lang === 'fr' ? '100% financée' : '100% funded')}
</span>
            </div>
          </div>

          {/* Body vide avec message de connexion */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🔒</div>
            <h3 style={{ color:'#1a3a6b', fontSize:18, fontWeight:700, marginBottom:8 }}>{t.lockedTitle}</h3>
            <p style={{ color:'#64748b', fontSize:13, lineHeight:1.6, marginBottom:24, whiteSpace:'pre-line' }}>{t.lockedDesc}</p>
            <button onClick={() => setShowLoginModal(true)} style={{ padding:'12px 32px', borderRadius:8, background:'#f5a623', border:'none', color:'#1a3a6b', fontSize:14, fontWeight:700, cursor:'pointer' }}>{t.signIn}</button>
          </div>

          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
        </div>

        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      </>
    );
  }

  // ✅ Utilisateur connecté : drawer complet
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:900, background:'rgba(26,58,107,0.4)', backdropFilter:'blur(4px)', animation:'fadeIn 0.2s ease' }}/>

      <div style={{ position:'fixed', top:0, right:0, bottom:0, zIndex:901, width:500, maxWidth:'95vw', background:'#ffffff', borderLeft:'3px solid #f5a623', display:'flex', flexDirection:'column', animation:'slideIn 0.25s ease', overflowY:'auto', boxShadow:'-8px 0 32px rgba(26,58,107,0.15)' }}>

        {/* Header */}
        <div style={{ padding:'20px 22px 16px', background:'#1a3a6b', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div style={{ fontSize:28, width:52, height:52, borderRadius:10, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {countryFlag(bourse.pays)}
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:32, height:32, borderRadius:6, cursor:'pointer', fontSize:16 }}>✕</button>
          </div>
          <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#ffffff', marginBottom:8, lineHeight:1.3 }}>{bourse.nom}</h2>
          {/* ✅ APRÈS - Header pour utilisateur connecté avec traductions */}
<div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
  <span style={D.tagLight}>{countryFlag(bourse.pays)} {tCountry(bourse.pays, lang)}</span>
  {bourse.niveau && <span style={D.tagLight}>🎓 {tLevel(bourse.niveau, lang)}</span>}
  <span style={{ ...D.tagLight, background:'rgba(245,166,35,0.2)', color:'#f5a623', borderColor:'rgba(245,166,35,0.3)' }}>
    💰 {tFunding(bourse.financement, lang) || (lang === 'fr' ? '100% financée' : '100% funded')}
  </span>
  {pct !== null && (
    <span onClick={() => setShowMatch(true)} style={{ ...D.tagLight, background:'rgba(255,255,255,0.2)', fontWeight:700, cursor:'pointer', color: pct >= 65 ? '#4ade80' : pct >= 45 ? '#fbbf24' : '#f87171' }}>
      🎯 {pct}% {t.match}
    </span>
  )}
</div>
        </div>

        {/* Deadline */}
        {dl && (
          <div style={{ padding:'10px 22px', background:dl.color==='#dc2626'?'#fef2f2':dl.color==='#d97706'?'#fffbeb':'#f0fdf4', borderBottom:`2px solid ${dl.color}30`, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18 }}>⏰</span>
            <div>
              <div style={{ fontSize:12, color:dl.color, fontWeight:700 }}>
                {dl.label === (lang === 'fr' ? 'Expirée' : 'Expired') ? t.deadlineExpired : `${t.deadlineIn} ${dl.label}`}
              </div>
              <div style={{ fontSize:11, color:'#64748b' }}>{formatDate(bourse.dateLimite, lang)}</div>
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{ padding:'20px 22px', flex:1 }}>
          {bourse.description && (
  <div style={{ marginBottom:20 }}>
    <div style={D.label}>{t.about}</div>
    <p style={{ fontSize:13, color:'#475569', lineHeight:1.7, margin:0 }}>
      {tDescription(bourse.description, lang)}  {/* ✅ Traduit */}
    </p>
  </div>
)}
          {bourse.eligibilite.niveauRequis && (
  <div style={D.infoRow}>
    <span style={D.infoIcon}>🎓</span>
    <div>
      <div style={{ fontSize:11, color:'#64748b', marginBottom:2 }}>{t.requiredLevel}</div>
      <div style={{ fontSize:13, color:'#1a3a6b', fontWeight:500 }}>
        {tLevel(bourse.eligibilite.niveauRequis, lang)}  {/* ✅ Traduit */}
      </div>
    </div>
  </div>
)}
          {bourse.documentsRequis?.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={D.label}>{t.requiredDocs} ({bourse.documentsRequis.length})</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {bourse.documentsRequis.map((doc,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 12px', borderRadius:6, background:doc.obligatoire?'#eff6ff':'#f8fafc', border:`1px solid ${doc.obligatoire?'#bfdbfe':'#e2e8f0'}` }}>
                    <span style={{ fontSize:14, flexShrink:0, marginTop:1, color:doc.obligatoire?'#1a3a6b':'#94a3b8' }}>{doc.obligatoire?'✓':'○'}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:doc.obligatoire?'#1a3a6b':'#475569', fontWeight:doc.obligatoire?600:400 }}>{doc.nom}{!doc.obligatoire && <span style={{ fontSize:10, marginLeft:6, color:'#94a3b8' }}> ({t.optional})</span>}</div>
                      {doc.description && doc.description!=='empty' && <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{doc.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom:20 }}>
            <div style={D.label}>{t.details}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[
  {icon:'📍', label: t.country, val: tCountry(bourse.pays, lang)},
  {icon:'🎓', label: t.level, val: tLevel(bourse.niveau, lang)},
  {icon:'💰', label: t.funding, val: tFunding(bourse.financement, lang)},
  {icon:'📚', label: t.field, val: tField(bourse.domaine, lang)}
].filter(r=>r.val).map((row,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:6, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                  <span style={{ fontSize:14, width:20, textAlign:'center' }}>{row.icon}</span>
                  <span style={{ fontSize:12, color:'#94a3b8', width:80 }}>{row.label}</span>
                  <span style={{ fontSize:13, color:'#1a3a6b', fontWeight:600, flex:1 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
          {bourse.lienOfficiel && (
            <div style={{ marginBottom:20 }}>
              <div style={D.label}>{t.officialLink}</div>
              <a href={bourse.lienOfficiel} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:8, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:13, textDecoration:'none', wordBreak:'break-all', fontWeight:500 }}>
                <span>🔗</span><span style={{ flex:1 }}>{bourse.lienOfficiel}</span><span>↗</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 22px 24px', borderTop:'1px solid #e2e8f0', flexShrink:0, display:'flex', flexDirection:'column', gap:10, background:'#f8fafc' }}>
          <button
            style={{ width:'100%', padding:13, borderRadius:8, border:'none', background:applied?'#eff6ff':'#1a3a6b', color:applied?'#1a3a6b':'#fff', fontSize:14, fontWeight:700, cursor:applied?'default':'pointer', boxShadow:applied?'none':'0 4px 12px rgba(26,58,107,0.25)' }}
            onClick={!applied?async()=>{ setApplyLoading(true); await onApply(bourse); setApplyLoading(false); onClose(); }:undefined}
            disabled={applied||applyLoading}
          >
            {applyLoading ? '⏳' : applied ? t.inRoadmap : t.applyNow}
          </button>

          <div style={{ display:'flex', gap:8 }}>
            <button style={{ flex:1, padding:10, borderRadius:8, background:starred?'#fefce8':'#ffffff', border:starred?'1px solid #fde68a':'1px solid #e2e8f0', color:starred?'#d97706':'#475569', fontSize:13, cursor:'pointer', fontWeight:500 }}
              onClick={async()=>{ setStarLoading(true); await onStar(bourse,starred); setStarLoading(false); }} disabled={starLoading}>
              {starLoading?'⏳':starred ? t.favorited : t.favorite}
            </button>
            <button style={{ flex:1, padding:10, borderRadius:8, background:'#f5a623', border:'none', color:'#1a3a6b', fontSize:13, cursor:'pointer', fontWeight:700 }}
              onClick={()=>{ onAskAI(bourse); onClose(); }}>{t.askAI}</button>
          </div>

          <button onClick={() => setShowMatch(true)}
            style={{ width:'100%', padding:'10px', borderRadius:8, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:13, cursor:'pointer', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <span>🤖</span>
            <span>{t.matchAnalysis} — {pct}%</span>
            <span style={{ marginLeft:'auto', color:'#94a3b8' }}>→</span>
          </button>
        </div>
      </div>

      {showMatch && <MatchDrawerIA bourse={bourse} user={user} onBack={() => setShowMatch(false)} />}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════════════ */
const D = {
  tag:      { fontSize:11, padding:'3px 10px', borderRadius:4, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b' },
  tagLight: { fontSize:11, padding:'3px 10px', borderRadius:4, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff' },
  label:    { fontSize:10, fontWeight:700, color:'#1a3a6b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10, paddingBottom:6, borderBottom:'2px solid #f5a623', display:'inline-block' },
  infoRow:  { display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', borderRadius:6, background:'#f8fafc', border:'1px solid #e2e8f0' },
  infoIcon: { fontSize:16, flexShrink:0, marginTop:2, color:'#1a3a6b' },
};