// components/BourseCard.jsx
import React, { useState } from 'react';

const countryFlag = (pays) => {
  const flags = {
    'France': '🇫🇷', 'Allemagne': '🇩🇪', 'Royaume-Uni': '🇬🇧', 'États-Unis': '🇺🇸',
    'Canada': '🇨🇦', 'Japon': '🇯🇵', 'Chine': '🇨🇳', 'Australie': '🇦🇺',
    'Suisse': '🇨🇭', 'Pays-Bas': '🇳🇱', 'Maroc': '🇲🇦', 'Hongrie': '🇭🇺',
    'Corée du Sud': '🇰🇷', 'Nouvelle-Zélande': '🇳🇿', 'Turquie': '🇹🇷',
    'Belgique': '🇧🇪', 'Espagne': '🇪🇸', 'Italie': '🇮🇹', 'Portugal': '🇵🇹',
    'Roumanie': '🇷🇴', 'Arabie Saoudite': '🇸🇦', 'Brunei': '🇧🇳',
    'Tunisie': '🇹🇳', 'Algérie': '🇩🇿', 'Égypte': '🇪🇬',
  };
  return flags[pays] || '🌍';
};

// ====================== CALCMATCH AMÉLIORÉ ======================
const calcMatch = (bourse, user) => {
  if (!bourse || !user) return null;

  let score = 0;
  let total = 0;

  // 1. Éligibilité Tunisienne (très important pour tes utilisateurs)
  if (bourse.tunisienEligible) {
    total += 20;
    const eligible = String(bourse.tunisienEligible).toLowerCase().trim();
    const userIsTunisian =
      (user.nationality || user.pays || '').toLowerCase().includes('tunisie') ||
      (user.countryOfResidence || '').toLowerCase().includes('tunisie') ||
      (user.pays || '').toLowerCase().includes('tunisie');

    if (eligible === 'oui' || eligible === 'inconnu') {
      score += 20;
    } else if (eligible === 'non' && !userIsTunisian) {
      score += 15;
    }
    // Si tunisien + "non" → pas de points (éliminatoire fort)
  }

  // 2. Pays / Nationalité
  if (user.pays || user.nationality || user.countryOfResidence || user.targetCountries?.length > 0) {
    total += 25;
    const bp = String(bourse.pays || '').toLowerCase().trim();

    const userPaysList = [
      user.pays,
      user.nationality,
      user.countryOfResidence,
      ...(user.targetCountries || []).map((t) => t.country)
    ].filter(Boolean).map((p) => p.toLowerCase().trim());

    const isInternational = 
      bp.includes('international') || 
      bp.includes('tous pays') || 
      bp.includes('any country') || 
      bp.includes('monde') ||
      bp === '';

    const matchPays = userPaysList.some((up) =>
      bp === up || bp.includes(up) || up.includes(bp) || isInternational
    );

    if (matchPays) score += 25;
    else if (isInternational) score += 18;
  }

  // 3. Niveau d'études
  if (user.niveau || user.currentLevel || user.targetDegree) {
    total += 30;
    const bn = String(
      bourse.niveau || bourse.eligibilite?.niveauRequis || ''
    ).toLowerCase();

    const userLevels = [
      user.niveau,
      user.currentLevel,
      user.targetDegree,
    ].filter(Boolean).map((l) => l.toLowerCase().trim());

    const baseLevels = userLevels.map((l) => l.replace(/\s*\d+$/, '').trim());

    const allUserLevels = [...userLevels, ...baseLevels];

    const matchNiveau = allUserLevels.some((level) =>
      bn.includes(level) ||
      (level.includes('master') && bn.includes('master')) ||
      (level.includes('licence') && (bn.includes('licence') || bn.includes('bachelor') || bn.includes('undergraduate'))) ||
      (level.includes('doctorat') && (bn.includes('doctorat') || bn.includes('phd') || bn.includes('doctoral'))) ||
      bn.includes('tous niveaux') ||
      bn.includes('any level')
    );

    if (matchNiveau) score += 30;
  }

  // 4. Domaine / Spécialité
  if (user.domaine || user.fieldOfStudy || user.targetFields?.length > 0) {
    total += 25;
    const bd = String(bourse.domaine || '').toLowerCase();
    const desc = String(bourse.description || '').toLowerCase();
    const conditions = String(bourse.eligibilite?.conditionsSpeciales || '').toLowerCase();

    const userDomains = [
      user.domaine,
      user.fieldOfStudy,
      ...(user.targetFields || []).map((f) => f.field)
    ].filter(Boolean).map((d) => d.toLowerCase().trim());

    let domainPoints = 0;

    for (const ud of userDomains) {
      if (bd.includes(ud) || ud.includes(bd) || desc.includes(ud) || conditions.includes(ud)) {
        domainPoints = 25;
        break;
      }
      // Correspondance partielle sur mots-clés significatifs
      const words = ud.split(/\s+/).filter((w) => w.length > 3);
      if (words.some((w) => bd.includes(w) || desc.includes(w) || conditions.includes(w))) {
        domainPoints = Math.max(domainPoints, 14);
      }
    }

    score += domainPoints;
  }

  // 5. Langue (bonus)
  if (bourse.langue && user.languages?.length > 0) {
    total += 10;
    const bl = String(bourse.langue).toLowerCase().trim();
    const userLangs = user.languages
      .map((l) => String(l.language || '').toLowerCase().trim())
      .filter(Boolean);

    const matchLangue = userLangs.some((ul) =>
      bl.includes(ul) ||
      ul.includes(bl) ||
      (bl === 'anglais' && ul.includes('english')) ||
      (bl === 'français' && ul.includes('french'))
    );

    if (matchLangue) score += 10;
  }

  if (total === 0) return null;

  const percentage = Math.round((score / total) * 100);
  return Math.min(100, percentage);
};

// ====================== HELPERS ======================
const getScoreColor = (score) => {
  if (score === null) return '#64748b';
  if (score >= 85) return '#16a34a';
  if (score >= 65) return '#eab308';
  if (score >= 45) return '#f97316';
  return '#ef4444';
};

const getScoreLabel = (score) => {
  if (score === null) return null;
  if (score >= 85) return 'Excellent match';
  if (score >= 65) return 'Très bon match';
  if (score >= 45) return 'Match correct';
  return 'Match partiel';
};

const daysLeft = (deadline) => {
  if (!deadline) return null;
  const diff = Math.round((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: 'Expirée', color: '#ef4444' };
  if (diff === 0) return { label: "Aujourd'hui !", color: '#ef4444' };
  if (diff <= 30) return { label: `${diff} jours`, color: '#f97316' };
  return { label: `${diff} jours`, color: '#16a34a' };
};

const isUrgent = (deadline) => {
  if (!deadline) return false;
  const diff = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
  return diff < 30 && diff >= 0;
};

const formatDate = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return d;
  }
};

export default function BourseCard({
  bourse,
  user,
  onAskAI,
  onClick,
  starred,
  onStar,
  applied,
  onApply,
}) {
  const pct = calcMatch(bourse, user);
  const scoreColor = getScoreColor(pct);
  const dl = daysLeft(bourse.dateLimite);
  const urgent = isUrgent(bourse.dateLimite);

  const niveaux = bourse.niveau
    ? bourse.niveau.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const [starLoading, setStarLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform .2s, box-shadow .2s',
        boxShadow: '0 2px 8px rgba(26,58,107,0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,58,107,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,58,107,0.06)';
      }}
    >
      {/* Barre de score */}
      <div
        style={{
          height: 4,
          background: pct !== null
            ? `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})`
            : '#e2e8f0',
        }}
      />

      {/* En-tête */}
      <div
        style={{
          padding: '14px 16px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
          cursor: 'pointer',
        }}
        onClick={onClick}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{countryFlag(bourse.pays)}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              {bourse.pays || 'International'}
              {urgent && (
                <span
                  style={{
                    fontSize: 9,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: '#fef2f2',
                    color: '#ef4444',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    border: '1px solid #fecaca',
                  }}
                >
                  Urgent
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#1a3a6b',
                lineHeight: 1.3,
                marginTop: 2,
              }}
            >
              {bourse.nom}
            </div>
          </div>
        </div>

        {pct !== null && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
              {pct}%
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
              {getScoreLabel(pct)}
            </div>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: '#f1f5f9', margin: '0 16px' }} />

      {/* Contenu principal */}
      <div
        style={{
          padding: '12px 16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          cursor: 'pointer',
        }}
        onClick={onClick}
      >
        {niveaux.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {niveaux.map((n, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1a3a6b',
                  fontWeight: 500,
                }}
              >
                {n}
              </span>
            ))}
          </div>
        )}

        {bourse.financement && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💰</span>
            <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
              {bourse.financement}
            </span>
          </div>
        )}

        {bourse.description && (
          <p
            style={{
              fontSize: 12,
              color: '#64748b',
              lineHeight: 1.5,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {bourse.description}
          </p>
        )}

        {(formatDate(bourse.dateLimite) || dl) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 2,
              padding: '8px 10px',
              borderRadius: 6,
              background: '#f8fafc',
              border: '1px solid #f1f5f9',
            }}
          >
            {formatDate(bourse.dateLimite) && (
              <div>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                  Date limite
                </div>
                <div style={{ fontSize: 12, color: dl?.color || '#475569', fontWeight: 700 }}>
                  {formatDate(bourse.dateLimite)}
                </div>
              </div>
            )}
            {dl && (
              <div
                style={{
                  fontSize: 12,
                  color: dl.color,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: dl.color + '12',
                  border: `1px solid ${dl.color}30`,
                }}
              >
                {dl.label} restants
              </div>
            )}
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div
        style={{
          padding: '10px 16px 14px',
          display: 'flex',
          gap: 6,
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <button
          style={{
            flex: 1,
            padding: '9px 10px',
            borderRadius: 6,
            background: '#1a3a6b',
            border: 'none',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Voir les détails
        </button>

        <button
          style={{
            flex: 1,
            padding: '9px 10px',
            borderRadius: 6,
            background: applied ? '#eff6ff' : '#f5a623',
            border: applied ? '1px solid #bfdbfe' : 'none',
            color: '#1a3a6b',
            fontSize: 12,
            fontWeight: 600,
            cursor: applied ? 'default' : 'pointer',
          }}
          onClick={
            !applied
              ? async (e) => {
                  e.stopPropagation();
                  setApplyLoading(true);
                  await onApply(bourse);
                  setApplyLoading(false);
                }
              : undefined
          }
          disabled={applied || applyLoading}
        >
          {applyLoading ? '⏳' : applied ? '✅ Roadmap' : '🗺️ Postuler'}
        </button>

        <button
          style={{
            width: 38,
            height: 38,
            borderRadius: 6,
            background: starred ? '#fefce8' : '#f8fafc',
            border: starred ? '1px solid #fde68a' : '1px solid #e2e8f0',
            color: starred ? '#d97706' : '#94a3b8',
            fontSize: 16,
            cursor: starLoading ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={async (e) => {
            e.stopPropagation();
            setStarLoading(true);
            await onStar(bourse, starred);
            setStarLoading(false);
          }}
          disabled={starLoading}
        >
          {starred ? '★' : '☆'}
        </button>

        <button
          style={{
            width: 38,
            height: 38,
            borderRadius: 6,
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1a3a6b',
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onAskAI(bourse);
          }}
        >
          🤖
        </button>
      </div>
    </div>
  );
}