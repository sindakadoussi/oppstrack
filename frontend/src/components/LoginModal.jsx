import React, { useState } from 'react';
import axiosInstance from '@/config/axiosInstance';

export default function LoginModal({ onClose, lang, theme }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('sending'); // 'sending' | 'success' | 'error'
  const [errMsg, setErrMsg] = useState('');

  // ═══════════════════════════════════════════════════════════════════════════
  //  TOKENS (cohérents avec les pages)
  // ═══════════════════════════════════════════════════════════════════════════
  const tokens = {
    dark: {
      bgCard:      '#1a1912',
      bgSecondary: '#24231c',
      border:      '#2b2a22',
      borderLight: '#24231c',
      accent:      '#1A6B3C',
      ink:         '#f2efe7',
      ink2:        '#cfccc2',
      ink3:        '#a19f96',
      danger:      '#B43030',
      fSerif:      "'Playfair Display', Georgia, serif",
      fSans:       "'DM Sans', 'Helvetica Neue', sans-serif",
    },
    light: {
      bgCard:      '#FFFFFF',
      bgSecondary: '#FAFAF7',
      border:      '#E8E3D9',
      borderLight: '#EEE9E0',
      accent:      '#1A6B3C',
      ink:         '#1A1A1A',
      ink2:        '#4A4A4A',
      ink3:        '#8A8A8A',
      danger:      '#B43030',
      fSerif:      "'Playfair Display', Georgia, serif",
      fSans:       "'DM Sans', 'Helvetica Neue', sans-serif",
    },
  };

  const C = tokens[theme === 'dark' ? 'dark' : 'light'];

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
      setErrMsg(err.response?.data?.message || (lang === 'fr' ? 'Erreur serveur' : 'Server error'));
    }
  };

  const modalStyles = {
    overlay:  { position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    backdrop: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' },
    box:      { position: 'relative', zIndex: 2001, width: 400, maxWidth: '92vw', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' },
    head:     { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: C.bgSecondary, borderBottom: `1px solid ${C.border}` },
    closeBtn: { marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' },
    body:     { padding: '24px', background: C.bgCard },
    btn:      { width: '100%', padding: '12px', fontFamily: C.fSans, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', letterSpacing: '0.05em', transition: 'all 0.2s', borderRadius: 6 },
    spinner:  { width: 32, height: 32, border: `2px solid ${C.borderLight}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' },
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={{ ...modalStyles.box, borderTop: `3px solid ${C.accent}` }}>
        {/* Header */}
        <div style={modalStyles.head}>
          <span style={{ fontSize: 20 }}>🔐</span>
          <span style={{ fontFamily: C.fSerif, fontWeight: 700, fontSize: 18, color: C.ink }}>
            {lang === 'fr' ? 'Connexion à OppsTrack' : 'Sign in to OppsTrack'}
          </span>
          <button style={modalStyles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div style={modalStyles.body}>
          
          {/* Écran input email */}
          {status !== 'success' && status !== 'error' && (
            <>
              <p style={{ fontFamily: C.fSans, fontSize: 13, color: C.ink2, marginBottom: 20, lineHeight: 1.6 }}>
                {lang === 'fr' 
                  ? 'Entrez votre email pour recevoir un lien de connexion magique.'
                  : 'Enter your email to receive a magic login link.'}
              </p>
              
              <div style={{ marginBottom: 16 }}>
                <input
                  type="email"
                  placeholder={lang === 'fr' ? 'votre@email.com' : 'your@email.com'}
                  value={email}
                  autoFocus
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontFamily: C.fSans,
                    fontSize: 14,
                    border: `1px solid ${C.borderLight}`,
                    background: C.bgSecondary,
                    color: C.ink,
                    outline: 'none',
                    boxSizing: 'border-box',
                    borderRadius: 6,
                    transition: 'border 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e => e.target.style.borderColor = C.borderLight}
                />
              </div>

              {errMsg && (
                <div style={{ color: C.danger, fontSize: 12, marginBottom: 16, padding: '8px 12px', background: C.bgSecondary, borderRadius: 6, borderLeft: `3px solid ${C.danger}` }}>
                  {errMsg}
                </div>
              )}

              <button
                onClick={send}
                disabled={!email.includes('@')}
                style={{
                  ...modalStyles.btn,
                  background: email.includes('@') ? C.accent : C.borderLight,
                  color: email.includes('@') ? '#fff' : C.ink3,
                  cursor: email.includes('@') ? 'pointer' : 'not-allowed',
                }}
              >
                ✉️ {lang === 'fr' ? 'Envoyer le lien magique' : 'Send magic link'}
              </button>
            </>
          )}

          {/* Écran succès */}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✉️</div>
              <div style={{ fontFamily: C.fSerif, fontSize: 20, fontWeight: 700, color: '#2e6b3e', marginBottom: 12 }}>
                {lang === 'fr' ? 'Lien envoyé !' : 'Link sent!'}
              </div>
              <p style={{ fontSize: 13, color: C.ink2, marginBottom: 24, lineHeight: 1.6 }}>
                {lang === 'fr' 
                  ? 'Vérifiez votre boîte mail (et les spams). Cliquez sur le lien pour vous connecter.'
                  : 'Check your inbox (and spam folder). Click the link to sign in.'}
              </p>
              <button
                onClick={onClose}
                style={{
                  ...modalStyles.btn,
                  background: '#2e6b3e',
                  color: '#fff',
                }}
              >
                ✓ {lang === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </div>
          )}

          {/* Écran erreur */}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <p style={{ color: C.danger, fontFamily: C.fSans, marginBottom: 20 }}>{errMsg}</p>
              <button
                onClick={() => { setStatus('sending'); setErrMsg(''); setEmail(''); }}
                style={{
                  ...modalStyles.btn,
                  background: C.accent,
                  color: '#fff',
                }}
              >
                {lang === 'fr' ? 'Réessayer' : 'Try again'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={modalStyles.backdrop} onClick={onClose} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}