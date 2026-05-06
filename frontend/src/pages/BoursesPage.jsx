// BoursesPage.jsx - Premium editorial + AI-driven experience (sans émojis, avec pagination)
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';
import BourseDrawer from '../components/Boursedrawer';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';
import MatchDrawerIA from '../components/MatchDrawerIA';

/* =============== TOKENS =============== */
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
  fSerif: `"Playfair Display", "Times New Roman", Georgia, serif`,
  fSans:  `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"DM Sans", monospace`,
});

/* =============== HELPERS =============== */
const countryFlag = (pays) => pays; // on enlève l'emoji, on garde juste le texte
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

/* =============== TOAST (sans émoji) =============== */
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

/* =============== SKELETON CARD =============== */
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

/* =============== AI PREVIEW PANEL (sans émoji) =============== */
function AIPreviewPanel({ bourse, user, onClose, c, lang }) {
  const matchScore = 72 + (bourse.id?.charCodeAt(0) % 20) || 78;
  const fitReason = lang === 'fr'
    ? 'Votre profil correspond aux critères académiques et linguistiques.'
    : 'Your profile matches academic and language criteria.';
  const missing = lang === 'fr'
    ? 'Améliorez votre lettre de motivation'
    : 'Improve your motivation letter';

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 8,
        background: c.surface,
        border: `1px solid ${c.rule}`,
        borderLeft: `3px solid ${c.accent}`,
        padding: '16px 20px',
        borderRadius: 0,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        zIndex: 10,
        fontFamily: c.fSans,
        fontSize: 13,
        lineHeight: 1.5,
        backdropFilter: 'blur(4px)',
        backgroundColor: c.surface + 'ee',
        transition: 'all 0.2s ease',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: c.fMono, fontSize: 11, fontWeight: 600, color: c.accent, letterSpacing: '0.05em' }}>
          Match AI
        </span>
        <span style={{ fontSize: 20, fontWeight: 700, color: c.accent }}>{matchScore}%</span>
      </div>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontWeight: 600, color: c.ink }}>✓ Points forts</span>
        <p style={{ margin: '4px 0 0', color: c.ink2 }}>{fitReason}</p>
      </div>
      <div>
        <span style={{ fontWeight: 600, color: c.danger }}>⚠ Axes d’amélioration</span>
        <p style={{ margin: '4px 0 0', color: c.ink2 }}>{missing}</p>
      </div>
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: c.ink3, fontSize: 12 }}
      >
        ✕
      </button>
    </div>
  );
}

/* =============== CARD VERTICALE (sans image, domaine en ligne complète) =============== */
function VerticalBourseCard({ bourse, user, onAskAI, onClick, starred, onStar, applied, onApply, onMatch, c, lang, index }) {
  const formatDate = (date) => date ? new Date(date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : null;
  const animationDelay = `${index * 0.05}s`;
const [applyLoading, setApplyLoading] = useState(false);
  // ----- Détermination du statut -----
  const getStatus = () => {
    if (bourse.statut === 'expiree') {
      return { label: lang === 'fr' ? 'Expirée' : 'Expired', color: c.danger, intensity: 'solid' };
    }
    if (!bourse.dateLimite) {
      return { label: lang === 'fr' ? 'Ouvert' : 'Open', color: c.accent, intensity: 'light' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(bourse.dateLimite);
    deadline.setHours(0, 0, 0, 0);
    if (deadline < today) {
      return { label: lang === 'fr' ? 'Expirée' : 'Expired', color: c.danger, intensity: 'solid' };
    }
    if (deadline.toDateString() === today.toDateString()) {
      return { label: lang === 'fr' ? 'Dernier jour' : 'Last day', color: c.warn, intensity: 'solid' };
    }
    if (deadline <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return { label: lang === 'fr' ? 'Bientôt' : 'Soon', color: c.warn, intensity: 'light' };
    }
    return { label: lang === 'fr' ? 'Ouvert' : 'Open', color: c.accent, intensity: 'light' };
  };
  const status = getStatus();

 

  return (
    <article
      onClick={onClick}
      style={{
        display: 'flex',
        gap: 24,
        alignItems: 'flex-start',
        padding: '24px 20px',
        marginBottom: 16,
        borderBottom: `1px solid ${c.ruleSoft}`,
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
        background: c.surface,
        position: 'relative',
        opacity: 0,
        transform: 'translateY(20px)',
        animation: `cardAppear 0.5s ease ${animationDelay} forwards`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
        e.currentTarget.style.borderLeft = `3px solid ${c.accent}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderLeft = '0px solid transparent';
      }}
    >
      {/* Contenu - sans image */}
      <div style={{ flex: 1 }}>
        {/* Ligne titre + deadline + statut */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 12 }}>
          <h3 style={{ fontFamily: c.fSerif, fontSize: 20, fontWeight: 700, margin: 0, color: c.ink, letterSpacing: '-0.01em' }}>
            {bourse.nom}
          </h3>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {bourse.dateLimite && (
              <span style={{ fontFamily: c.fMono, fontSize: 11, color: c.ink3 }}>
                <strong>Deadline</strong> {formatDate(bourse.dateLimite)}
              </span>
            )}
            <span style={{
              fontFamily: c.fMono,
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 20,
              background: status.intensity === 'solid' ? status.color : `${status.color}20`,
              color: status.intensity === 'solid' ? '#fff' : status.color,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {status.label}
            </span>
          </div>
        </div>

       {/* APRÈS la section Financement/Deadline, AVANT les Documents requis */}


        {/* Grille des métadonnées (pays, niveau) - sans domaine ici */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px 16px', marginBottom: 8 }}>
          {bourse.pays && (
            <div style={{ fontSize: 13, color: c.ink2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>📍</span> <strong>Pays</strong> {bourse.pays}
            </div>
          )}
          {bourse.niveau && (
            <div style={{ fontSize: 13, color: c.ink2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>🎓</span> <strong>Niveau</strong> {bourse.niveau}
            </div>
          )}
        </div>

        

        {/* Domaine - ligne complète séparée */}
        {bourse.domaine && (
          <div style={{ marginBottom: 12, fontSize: 13, color: c.ink2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>📚</span> <strong>Domaine</strong> {bourse.domaine}
          </div>
        )}

        {/* Financement */}
        {bourse.financement && (
          <div style={{ marginBottom: 16, fontSize: 13, color: c.ink2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>💰</span> <strong>Financement</strong> {bourse.financement}
          </div>
        )}

        {/* Description courte */}
        {bourse.description && (
          <p style={{ fontFamily: c.fSans, fontSize: 13, color: c.ink2, lineHeight: 1.5, margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {bourse.description.length > 150 ? `${bourse.description.substring(0, 150)}...` : bourse.description}
          </p>
        )}

        {/* Boutons d'action */}
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap',
          opacity: 0,
          transition: 'opacity 0.2s ease 0.1s',
        }} className="card-actions">
          <button onClick={(e) => { e.stopPropagation(); onAskAI(bourse); }} style={{ ...actionButton(c, 'ghost'), border: `1px solid ${c.rule}`, background: 'transparent', color: c.accent }}>
            IA
          </button>
          <button onClick={(e) => { e.stopPropagation(); onStar(bourse, starred); }} style={{ ...actionButton(c, 'ghost'), background: starred ? c.accent : 'transparent', color: starred ? c.paper : c.ink3, border: `1px solid ${c.rule}` }}>
            {starred ? '★' : '☆'} Favori
          </button>
           <button
    onClick={async (e) => {
      e.stopPropagation();
      if (applied || applyLoading) return;
      setApplyLoading(true);
      await onApply(bourse);
      setApplyLoading(false);
    }}
    style={{
      ...actionButton(c, applied ? 'success' : 'primary'),
      background: applied ? '#2e6b3e' : c.accent,
      color: '#fff',
      opacity: applyLoading ? 0.6 : 1,
      cursor: (applied || applyLoading) ? 'default' : 'pointer'
    }}
    disabled={applied || applyLoading}
  >
    {applyLoading ? '⏳' : (applied ? '✓' : '+')} {applied ? (lang === 'fr' ? 'Ajoutée' : 'Added') : (lang === 'fr' ? 'Postuler' : 'Apply')}
  </button>
          <button onClick={(e) => { e.stopPropagation(); onMatch(bourse); }} style={{ ...actionButton(c, 'primary'), background: c.accent, color: '#fff' }}>
            Match IA
          </button>
        </div>
      </div>

      <style>{`
        article:hover .card-actions {
          opacity: 1 !important;
        }
        @keyframes cardAppear {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </article>
  );
}

const actionButton = (c, variant) => ({
  padding: '6px 14px', fontSize: 11, fontWeight: 600, fontFamily: c.fMono,
  letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
  border: 'none', borderRadius: 0, transition: 'all 0.2s ease',
  ...(variant === 'primary' && { background: c.accent, color: c.paper }),
  ...(variant === 'ghost' && { background: 'transparent', color: c.ink2, border: `1px solid ${c.rule}` }),
  ...(variant === 'success' && { background: '#2e6b3e', color: '#fff' }),
  ...(variant === 'gradient' && { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff' }),
});

/* =============== LOGIN MODAL (sans émoji) =============== */
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

  const modalStyles = {
    overlay:  { position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    backdrop: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' },
    box:      { position: 'relative', zIndex: 2001, width: 400, maxWidth: '92vw', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' },
    head:     { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px' },
    closeBtn: { marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' },
    body:     { padding: '24px' },
    btn:      { width: '100%', padding: '12px', fontFamily: c.fSans, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', letterSpacing: '0.05em' },
    spinner:  { width: 32, height: 32, border: `2px solid ${c.rule}`, borderTopColor: c.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' },
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
                ✉️ Envoyer le lien
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
                Lien envoyé !
              </div>
              <p style={{ fontSize: 13, color: c.ink2 }} dangerouslySetInnerHTML={{
                __html: lang === 'fr' ? 'Vérifiez votre boîte mail (et les spams).<br/>Cliquez sur le lien pour vous connecter.' : 'Check your inbox (and spam).<br/>Click the link to sign in.'
              }} />
              <button onClick={onClose} style={{ ...modalStyles.btn, background: '#2e6b3e', marginTop: 24 }}>✓ Fermer</button>
            </div>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: c.danger }}>{errMsg}</p>
              <button onClick={() => { setStatus('idle'); setErrMsg(''); }} style={{ ...modalStyles.btn, background: c.accent, marginTop: 16 }}>
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={modalStyles.backdrop} onClick={onClose} />
    </div>
  );
}

/* =============== BARRE DE CONTEXTE (sans émojis, chiffres mis en valeur) =============== */
function SmartContextBar({ filteredBourses, user, c, lang }) {
  const profileMatchCount = user ? Math.floor(filteredBourses.length * 0.6) : filteredBourses.length;
  const deadlinesThisWeek = filteredBourses.filter(b => {
    if (!b.dateLimite) return false;
    const days = Math.ceil((new Date(b.dateLimite) - new Date()) / (1000*60*60*24));
    return days <= 7 && days >= 0;
  }).length;
  const urgentCount = filteredBourses.filter(b => {
    if (!b.dateLimite) return false;
    const days = Math.ceil((new Date(b.dateLimite) - new Date()) / (1000*60*60*24));
    return days <= 3 && days >= 0;
  }).length;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 24,
      marginTop: 24,
      marginBottom: 32,
      padding: '16px 0',
      borderTop: `1px solid ${c.ruleSoft}`,
      borderBottom: `1px solid ${c.ruleSoft}`,
      fontFamily: c.fMono,
      fontSize: 13,
      color: c.ink2,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: c.accent }}>{profileMatchCount}</div>
        <div>{lang === 'fr' ? 'bourses compatibles' : 'matching scholarships'}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: c.accent }}>{deadlinesThisWeek}</div>
        <div>{lang === 'fr' ? 'deadlines cette semaine' : 'deadlines this week'}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: c.accent }}>{urgentCount}</div>
        <div>{lang === 'fr' ? 'opportunités urgentes' : 'urgent opportunities'}</div>
      </div>
    </div>
  );
}

/* =============== MINI HERO (sans émoji) =============== */
function MiniHero({ c, lang, totalCount }) {
  return (
    <div style={{
      background: c.paper2,
      padding: '40px 32px',
      textAlign: 'center',
      borderBottom: `1px solid ${c.rule}`,
      animation: 'fadeIn 0.6s ease',
    }}>
      <h1 style={{
        fontFamily: c.fSerif,
        fontSize: 'clamp(32px, 5vw, 48px)',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: c.ink,
        margin: 0,
      }}>
        
       {lang === "fr" ? (
                  <>Trouvez votre <em style={{ color: c.accent, fontStyle: 'italic' }}>prochaine bourse </em>.</>
                ) : (
                  <> <em style={{ color: c.accent, fontStyle: "italic" }}>Find your</em>  next  scholarship.</>
                )}
      </h1>
      <p style={{
        fontFamily: c.fSans,
        fontSize: 16,
        color: c.ink2,
        marginTop: 12,
        maxWidth: 600,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        Découvrez +{totalCount} opportunités entièrement financées et évaluez instantanément votre compatibilité.
      </p>
    </div>
  );
}

/* =============== SMART LOGIN LOCK =============== */
function SmartLoginLock({ hiddenCount, onLogin, c, lang }) {
  return (
    <div style={{
      position: 'relative',
      marginTop: 32,
      backdropFilter: 'blur(8px)',
      background: 'rgba(0,0,0,0.02)',
      borderRadius: 0,
      padding: '48px 24px',
      textAlign: 'center',
      border: `1px solid ${c.ruleSoft}`,
      transition: 'all 0.2s',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(145deg, rgba(0,0,0,0.02), rgba(0,0,0,0.06))',
        backdropFilter: 'blur(2px)',
        zIndex: 0,
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔓</div>
        <h3 style={{ fontFamily: c.fSerif, fontSize: 24, fontWeight: 700, color: c.ink, marginBottom: 8 }}>
          {hiddenCount} {lang === 'fr' ? 'bourse supplémentaire' : 'more scholarships'}
        </h3>
        <p style={{ fontFamily: c.fSans, fontSize: 14, color: c.ink2, marginBottom: 24 }}>
          {lang === 'fr' ? 'Créez un compte gratuit pour débloquer toutes les opportunités.' : 'Create a free account to unlock all opportunities.'}
        </p>
        <button
          onClick={onLogin}
          style={{
            ...actionButton(c, 'primary'),
            padding: '12px 28px',
            fontSize: 12,
            background: c.accent,
            color: c.paper,
            border: 'none',
          }}
        >
          Se connecter
        </button>
      </div>
    </div>
  );
}

/* =============== COMPOSANT PAGINATION =============== */
function Pagination({ currentPage, totalPages, onPageChange, c, lang }) {
  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      marginTop: 48,
      marginBottom: 24,
    }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          ...actionButton(c, 'ghost'),
          padding: '8px 16px',
          opacity: currentPage === 1 ? 0.4 : 1,
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
        }}
      >
        {lang === 'fr' ? 'Précédent' : 'Previous'}
      </button>
      <span style={{ fontFamily: c.fMono, fontSize: 13, color: c.ink2 }}>
        {lang === 'fr' ? 'Page' : 'Page'} {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          ...actionButton(c, 'ghost'),
          padding: '8px 16px',
          opacity: currentPage === totalPages ? 0.4 : 1,
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
        }}
      >
        {lang === 'fr' ? 'Suivant' : 'Next'}
      </button>
    </div>
  );
}

/* =============== HELPER : Vérifier si test de langue requis =============== */
const hasLanguageTestRequired = (bourse) => {
  const docs = bourse.documentsRequis || [];
  return docs.some(doc => {
    const nomLower = (doc.nom || '').toLowerCase();
    return nomLower.includes('toefl') || 
           nomLower.includes('ielts') || 
           nomLower.includes('tef') ||
           nomLower.includes('tcf') ||
           nomLower.includes('delf') ||
           nomLower.includes('dalf') ||
           nomLower.includes('test de langue') ||
           nomLower.includes('language test') ||
           nomLower.includes('certificat de langue');
  });
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

  const [filterOpenOnly, setFilterOpenOnly] = useState(false);
  const [filterNoLanguageTest, setFilterNoLanguageTest] = useState(false);
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

  // Pagination (uniquement pour les utilisateurs connectés)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  // Dans BoursesPage.jsx (dans le composant principal)

const handleStar = async (bourse, isStarred) => {
  const nomKey = bourse.nom?.trim().toLowerCase();
  if (!user?.id) {
    showToast(lang === 'fr' ? 'Connectez-vous pour sauvegarder' : 'Sign in to save', 'info');
    return;
  }
  try {
    const res = await axiosInstance.get(API_ROUTES.favoris.byUser(user.id));
    const doc = res.data.docs?.[0];
    if (isStarred) {
      if (!doc?.id) return;
      await axiosInstance.patch(`/api/favoris/${doc.id}`, { 
        bourses: (doc.bourses || []).filter(b => b.nom?.trim().toLowerCase() !== nomKey) 
      });
      setStarredNoms(prev => new Set([...prev].filter(i => i !== nomKey)));
      showToast(lang === 'fr' ? 'Retiré des favoris' : 'Removed from favorites', 'info');
    } else {
      const newBourse = { 
        nom: bourse.nom, 
        pays: bourse.pays || '', 
        lienOfficiel: bourse.lienOfficiel || '', 
        financement: bourse.financement || '', 
        dateLimite: bourse.dateLimite || null, 
        ajouteLe: new Date().toISOString() 
      };
      if (doc?.id) {
        await axiosInstance.patch(`/api/favoris/${doc.id}`, { 
          bourses: [...(doc.bourses || []), newBourse] 
        });
      } else {
        await axiosInstance.post('/api/favoris', { 
          user: user.id, 
          userEmail: user.email || '', 
          bourses: [newBourse] 
        });
      }
      setStarredNoms(prev => new Set([...prev, nomKey]));
      showToast(lang === 'fr' ? 'Ajouté aux favoris' : 'Added to favorites', 'success');
    }
    window.dispatchEvent(new CustomEvent('favoris-updated'));
  } catch (err) { 
    showToast(lang === 'fr' ? 'Erreur' : 'Error', 'error'); 
  }
};

const handleApply = async (bourse) => {
  const nomKey = bourse.nom?.trim().toLowerCase();
  if (!user?.id) {
    showToast(lang === 'fr' ? 'Connectez-vous pour postuler' : 'Sign in to apply', 'info');
    return;
  }
  if (appliedNoms.has(nomKey)) {
    showToast(lang === 'fr' ? 'Déjà dans votre roadmap' : 'Already in roadmap', 'info');
    return;
  }
  try {
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
    const newRoadmapId = res.data.doc?.id || res.data.id;
    // Appel au webhook pour générer les étapes de roadmap
    await axiosInstance.post(WEBHOOK_ROUTES.generateRoadmap, { 
      roadmapId: newRoadmapId, 
      bourse: { nom: bourse.nom, pays: bourse.pays, url: bourse.lienOfficiel || bourse.url }, 
      userProfile: user 
    });
    setAppliedNoms(prev => new Set([...prev, nomKey]));
    showToast(lang === 'fr' ? 'Ajouté à votre roadmap' : 'Added to your roadmap', 'success');
  } catch (err) { 
    showToast(lang === 'fr' ? "Erreur lors de l'ajout" : 'Error adding to roadmap', 'error'); 
  }
};

const handleAskAI = (bourse) => {
  const message = lang === 'fr' 
    ? `Peux-tu me dire si je suis éligible à la bourse "${bourse.nom}" en ${bourse.pays} ?` 
    : `Can you tell me if I'm eligible for the "${bourse.nom}" scholarship in ${bourse.pays}?`;
  window.dispatchEvent(new CustomEvent('openChatWithMessage', { detail: { message } }));
};

  // Filtrage
  const filtered = useMemo(() => {
  let result = bourses.filter(b => {
    if (b.statut === 'expiree') return false;
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || b.nom?.toLowerCase().includes(q) || b.pays?.toLowerCase().includes(q) || b.domaine?.toLowerCase().includes(q);
    const matchNiveau = !filterNiveau || b.niveau?.includes(filterNiveau);
    const matchPays = !filterPays || b.pays === filterPays;
    const matchNoLanguageTest = !filterNoLanguageTest || !hasLanguageTestRequired(b);
    
    // ✅ NOUVEAU FILTRE "Bourses ouvertes"
    const matchOpenOnly = !filterOpenOnly || (b.dateLimite && new Date(b.dateLimite) >= new Date());

    return matchSearch && matchNiveau && matchPays && matchNoLanguageTest && matchOpenOnly;
  });
  
  return result;
}, [bourses, debouncedSearch, filterNiveau, filterPays, filterNoLanguageTest, filterOpenOnly]);

  // Gestion de l'affichage selon connexion
  let visibleBoursesAll = filtered;
  let hasHiddenBourses = false;
  let hiddenCount = 0;

  if (!user) {
    visibleBoursesAll = filtered.slice(0, 9);
    hasHiddenBourses = filtered.length > 9;
    hiddenCount = filtered.length - 9;
  }

  // Pagination (seulement si user connecté)
  let paginatedBourses = visibleBoursesAll;
  let totalPages = 1;
  if (user) {
    totalPages = Math.ceil(visibleBoursesAll.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    paginatedBourses = visibleBoursesAll.slice(start, start + itemsPerPage);
  }

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterNiveau, filterPays, sortBy]);

  const paysList = useMemo(() => [...new Set(bourses.map(b => b.pays).filter(Boolean))].sort(), [bourses]);
  const niveauxList = useMemo(() => [...new Set(bourses.flatMap(b => (b.niveau || '').split(',').map(s => s.trim())).filter(Boolean))].sort(), [bourses]);
  const activeFilters = useMemo(() => {
    const filters = [];
    if (debouncedSearch) filters.push({ key: 'search', label: `🔍 "${debouncedSearch}"`, onRemove: () => setSearch('') });
    if (filterNiveau) filters.push({ key: 'niveau', label: `🎓 ${filterNiveau}`, onRemove: () => setFilterNiveau('') });
    if (filterPays) filters.push({ key: 'pays', label: `${filterPays}`, onRemove: () => setFilterPays('') });
    return filters;
  }, [debouncedSearch, filterNiveau, filterPays]);

  const showSkeleton = !dataLoaded;

  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      <MiniHero c={c} lang={lang} totalCount={bourses.length} />

      {/* Filtres */}
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
              {paysList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {(search || filterNiveau || filterPays) && (
              <button onClick={() => { setSearch(''); setFilterNiveau(''); setFilterPays(''); }} style={{ ...clearButton(c) }}>
                ✕ Effacer
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
            {filtered.length} {lang === 'fr' ? 'bourse' : 'scholarship'}{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 'es' : 'e'}
            {debouncedSearch && <span> pour "{debouncedSearch}"</span>}
          </div>
        </div>
      </div>

      {/* Boutons de filtre rapide */}
<div style={{ 
  maxWidth: 1000, 
  margin: '0 auto', 
  padding: '24px 32px', 
  display: 'flex', 
  gap: 16, 
  flexWrap: 'wrap',
  justifyContent: 'center'
}}>
  <button
  onClick={() => setFilterNoLanguageTest(!filterNoLanguageTest)}
  style={{
    padding: '12px 24px',
    background: filterNoLanguageTest ? c.accent : 'transparent',
    border: `1px solid ${c.accent}`,
    color: filterNoLanguageTest ? '#fff' : c.accent,
    fontFamily: c.fSans,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    letterSpacing: '0.05em',
  }}
>
   {lang === 'fr' ? 'Sans test de langue obligatoire' : 'No mandatory language test'}
</button>
 <button
  onClick={() => setFilterOpenOnly(!filterOpenOnly)}
  style={{
    padding: '12px 24px',
    background: filterOpenOnly ? c.accent : 'transparent',
    border: `1px solid ${c.accent}`,
    color: filterOpenOnly ? '#fff' : c.accent,
    fontFamily: c.fSans,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    letterSpacing: '0.05em',
  }}
>
   {lang === 'fr' ? 'Bourses ouvertes' : 'Open scholarships'}
</button>
</div>

      {/* Liste des bourses */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 32px 64px' }}>
        {showSkeleton ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} c={c} />)
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontFamily: c.fSerif, fontSize: 32, color: c.ink2, marginBottom: 16 }}>📭</div>
            <div style={{ fontFamily: c.fSerif, fontSize: 20, color: c.ink, marginBottom: 8 }}>{t('bourses', 'noResult')}</div>
            <p style={{ color: c.ink3 }}>{t('bourses', 'noResultSub')}</p>
            <button onClick={() => { setSearch(''); setFilterNiveau(''); setFilterPays(''); }} style={{ ...clearButton(c), marginTop: 24, background: c.accent, color: c.paper }}>
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            {paginatedBourses.map((bourse, idx) => (
              <VerticalBourseCard
                key={bourse.id || bourse.nom}
                index={idx}
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
            ))}
            {/* Pagination (seulement si connecté) */}
            {user && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} c={c} lang={lang} />}
          </>
        )}

        {hasHiddenBourses && (
          <SmartLoginLock hiddenCount={hiddenCount} onLogin={() => setShowLoginModal(true)} c={c} lang={lang} />
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
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