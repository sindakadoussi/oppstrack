import React from 'react';
import { useTheme } from './Navbar';
import { useT } from '../i18n';

export default function RestrictedAccessCard({ 
  pageName = 'Page', 
  onLoginClick,
  icon = '📋',
  showLogo = true 
}) {
  const { theme } = useTheme();
  const { lang } = useT();

  // Tokens cohérents avec OppsTrack
  const tokens = {
    dark: {
      bg: '#15140f',
      surface: '#1a1912',
      border: '#2b2a22',
      accent: '#1A6B3C',
      ink: '#f2efe7',
      ink2: '#cfccc2',
      ink3: '#a19f96',
      fSerif: "'Playfair Display', Georgia, serif",
      fSans: "'DM Sans', sans-serif",
    },
    light: {
      bg: '#faf8f3',
      surface: '#ffffff',
      border: '#d9d5cb',
      accent: '#0066b3',
      ink: '#141414',
      ink2: '#3a3a3a',
      ink3: '#6b6b6b',
      fSerif: "'Playfair Display', Georgia, serif",
      fSans: "'DM Sans', sans-serif",
    }
  };

  const c = tokens[theme === 'dark' ? 'dark' : 'light'];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: c.bg,
      padding: '24px',
    }}>
      <div style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: '56px 48px',
        maxWidth: 500,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        animation: 'fadeIn 0.4s ease',
      }}>
        

        {/* Icon de la page */}
        <div style={{
          fontSize: 52,
          marginBottom: 16,
        }}>
          {icon}
        </div>

        {/* Titre */}
        <h3 style={{
          fontFamily: c.fSerif,
          fontSize: 22,
          fontWeight: 700,
          color: c.ink,
          margin: '0 0 12px',
          letterSpacing: '-0.01em',
        }}>
          {pageName} {lang === 'fr' ? 'non disponible' : 'unavailable'}
        </h3>

        {/* Description */}
        <p style={{
          color: c.ink2,
          fontSize: 14,
          lineHeight: 1.6,
          margin: '0 0 28px',
          fontFamily: c.fSans,
        }}>
          {lang === 'fr'
            ? 'Connectez-vous pour accéder à cette fonctionnalité.'
            : 'Sign in to access this feature.'}
        </p>

        {/* Bouton */}
        <button
          onClick={onLoginClick}
          style={{
            padding: '13px 36px',
            background: c.accent,
            color: '#fff',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: c.fSans,
            cursor: 'pointer',
            borderRadius: 6,
            letterSpacing: '0.05em',
            transition: 'all 0.2s ease',
            boxShadow: `0 4px 12px ${c.accent}40`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 6px 16px ${c.accent}60`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 4px 12px ${c.accent}40`;
          }}
        >
          🔐 {lang === 'fr' ? 'Se connecter' : 'Sign in'}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}