// components/BourseCard.jsx
import React, { useState } from 'react';
import { useT } from '../i18n';
import { useTheme } from './Navbar';

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

const actionButton = (c, variant) => ({
  padding: '6px 14px', 
  fontSize: 11, 
  fontWeight: 600, 
  fontFamily: c.fMono,
  letterSpacing: '0.05em', 
  textTransform: 'uppercase', 
  cursor: 'pointer',
  border: 'none', 
  borderRadius: 0, 
  transition: 'all 0.2s ease',
  ...(variant === 'primary' && { background: c.accent, color: c.paper }),
  ...(variant === 'ghost' && { background: 'transparent', color: c.ink2, border: `1px solid ${c.rule}` }),
  ...(variant === 'success' && { background: '#2e6b3e', color: '#fff' }),
});

/* =============== COMPOSANT PRINCIPAL =============== */
export default function BourseCard({ 
  bourse, 
  user, 
  onAskAI, 
  onClick, 
  starred, 
  onStar, 
  applied, 
  onApply, 
  onMatch, 
  index = 0,
  showMatchScore = false, // pour afficher le score de match (page recommandations)
}) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);
  const [applyLoading, setApplyLoading] = useState(false);

  const formatDate = (date) => date ? new Date(date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : null;
  const animationDelay = `${index * 0.05}s`;

  // Détermination du statut
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

        {/* Grille des métadonnées */}
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

        {/* Match score (si activé) */}
        {showMatchScore && bourse.matchScore !== undefined && (
          <div style={{ marginBottom: 12, fontSize: 13, color: c.ink2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>🎯</span> <strong>Match</strong> 
            <span style={{ fontFamily: c.fMono, color: c.accent, fontWeight: 700 }}>{bourse.matchScore}%</span>
          </div>
        )}

        {/* Domaine (tronqué) */}
        {bourse.domaine && (
          <div style={{ 
            marginBottom: 12, 
            fontSize: 13, 
            color: c.ink2, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
          }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>📚</span> 
            <strong style={{ flexShrink: 0 }}>Domaine</strong> 
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              {bourse.domaine}
            </span>
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
          {onAskAI && (
            <button onClick={(e) => { e.stopPropagation(); onAskAI(bourse); }} style={{ ...actionButton(c, 'ghost'), border: `1px solid ${c.rule}`, background: 'transparent', color: c.accent }}>
              IA
            </button>
          )}
          {onStar && (
            <button onClick={(e) => { e.stopPropagation(); onStar(bourse, starred); }} style={{ ...actionButton(c, 'ghost'), background: starred ? c.accent : 'transparent', color: starred ? c.paper : c.ink3, border: `1px solid ${c.rule}` }}>
              {starred ? '★' : '☆'} Favori
            </button>
          )}
          {onApply && (
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
          )}
          {onMatch && (
            <button onClick={(e) => { e.stopPropagation(); onMatch(bourse); }} style={{ ...actionButton(c, 'primary'), background: c.accent, color: '#fff' }}>
              Match IA
            </button>
          )}
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