// RecommandationsPage.jsx — Decision-Oriented Interface with AI Match Scoring
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '@/config/axiosInstance';
import BourseDrawer from '../components/Boursedrawer';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';
import { tCountry, tLevel, tFunding, tField, tDescription } from '@/utils/translateDB';

/* ═══════════════════════════════════════════════════════════════════════════
   TOKENS — Professional Color Palette
═══════════════════════════════════════════════════════════════════════════ */
const tokens = (theme) => ({
  // Core colors
  accent: "#0066b3",        // Bleu professionnel
  accentLight: "#3b82f6",   // Bleu clair pour hover
  accentDark: "#0052a0",    // Bleu foncé
  
  // Surface colors
  paper: theme === "dark" ? "#15140f" : "#faf8f3",
  surface: theme === "dark" ? "#1a1912" : "#ffffff",
  surfaceHover: theme === "dark" ? "#24231c" : "#f8f6f1",
  
  // Text colors
  ink: theme === "dark" ? "#f2efe7" : "#141414",
  inkSecondary: theme === "dark" ? "#cfccc2" : "#5a5a5a",
  inkTertiary: theme === "dark" ? "#a19f96" : "#8a8a8a",
  
  // Border colors
  border: theme === "dark" ? "#2b2a22" : "#e5e0d5",
  borderLight: theme === "dark" ? "#24231c" : "#efebe5",
  
  // Accent colors for information (pro chic palette)
  success: "#2d6a4f",      // Vert élégant
  warning: "#b5651e",       // Orange cuivré
  error: "#9e2a2a",         // Bordeaux
  info: "#2c5f8a",          // Bleu profond
  
  // Typography
  fSerif: `"Libre Caslon Text", "Times New Roman", Georgia, serif`,
  fSans: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono: `"JetBrains Mono", ui-monospace, Menlo, monospace`,
  
  // Transitions
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
});

/* ═══════════════════════════════════════════════════════════════════════════
   MATCH SCORING SYSTEM
═══════════════════════════════════════════════════════════════════════════ */
const calculateMatchScore = (bourse, userProfile) => {
  let score = 0;
  const breakdown = [];
  const strengths = [];
  const weaknesses = [];

  if (userProfile.niveau && bourse.niveau) {
    const userLevel = userProfile.niveau.toLowerCase().trim();
    const bourseLevel = bourse.niveau.toLowerCase();
    
    if (bourseLevel.includes('tous') || bourseLevel === '') {
      score += 20;
      breakdown.push({ criterion: 'Niveau', score: 20, max: 30, status: 'neutral', message: 'Tous niveaux acceptés' });
    } else if (bourseLevel.includes(userLevel)) {
      score += 30;
      breakdown.push({ criterion: 'Niveau', score: 30, max: 30, status: 'strong', message: 'Votre niveau correspond parfaitement' });
      strengths.push('Niveau d\'étude correspondant');
    } else {
      const partialMatch = bourseLevel.split(',').some(l => l.trim().toLowerCase().includes(userLevel));
      if (partialMatch) {
        score += 15;
        breakdown.push({ criterion: 'Niveau', score: 15, max: 30, status: 'medium', message: 'Correspondance partielle' });
      } else {
        breakdown.push({ criterion: 'Niveau', score: 0, max: 30, status: 'weak', message: 'Niveau différent' });
        weaknesses.push('Niveau d\'étude non requis');
      }
    }
  }

  if (userProfile.domaine && bourse.domaine) {
    const userField = userProfile.domaine.toLowerCase().trim();
    const bourseField = bourse.domaine.toLowerCase();
    
    if (bourseField.includes('tous') || bourseField === '') {
      score += 15;
      breakdown.push({ criterion: 'Domaine', score: 15, max: 25, status: 'neutral', message: 'Tous domaines acceptés' });
    } else if (bourseField.includes(userField)) {
      score += 25;
      breakdown.push({ criterion: 'Domaine', score: 25, max: 25, status: 'strong', message: 'Votre domaine correspond exactement' });
      strengths.push('Domaine d\'étude parfaitement aligné');
    } else {
      const relatedFields = getRelatedFields(userField);
      if (relatedFields.some(f => bourseField.includes(f))) {
        score += 12;
        breakdown.push({ criterion: 'Domaine', score: 12, max: 25, status: 'medium', message: 'Domaine connexe' });
      } else {
        breakdown.push({ criterion: 'Domaine', score: 0, max: 25, status: 'weak', message: 'Domaine différent' });
        weaknesses.push('Domaine d\'étude non aligné');
      }
    }
  }

  if (bourse.tunisienEligible === 'oui') {
    score += 20;
    breakdown.push({ criterion: 'Éligibilité', score: 20, max: 20, status: 'strong', message: 'Ouvert aux étudiants tunisiens' });
    strengths.push('Éligible en tant qu\'étudiant tunisien');
  } else if (bourse.tunisienEligible === 'partiel') {
    score += 10;
    breakdown.push({ criterion: 'Éligibilité', score: 10, max: 20, status: 'medium', message: 'Éligibilité partielle' });
  } else {
    breakdown.push({ criterion: 'Éligibilité', score: 0, max: 20, status: 'weak', message: 'Non éligible' });
    weaknesses.push('Non éligible pour étudiants tunisiens');
  }

  if (bourse.statut === 'active') {
    score += 15;
    breakdown.push({ criterion: 'Statut', score: 15, max: 15, status: 'strong', message: 'Candidatures ouvertes' });
    strengths.push('Candidatures actuellement ouvertes');
  } else if (bourse.statut === 'a_venir') {
    score += 8;
    breakdown.push({ criterion: 'Statut', score: 8, max: 15, status: 'medium', message: 'À venir - préparez-vous' });
  } else if (bourse.statut === 'expiree') {
    breakdown.push({ criterion: 'Statut', score: 0, max: 15, status: 'weak', message: 'Date limite dépassée' });
    weaknesses.push('Date limite dépassée');
  }

  if (bourse.dateLimite) {
    const daysUntilDeadline = Math.floor((new Date(bourse.dateLimite) - new Date()) / 86400000);
    if (daysUntilDeadline > 60) score += 10;
    else if (daysUntilDeadline > 30) score += 7;
    else if (daysUntilDeadline > 7) score += 4;
    else if (daysUntilDeadline > 0) score += 2;
    
    breakdown.push({ 
      criterion: 'Délai', 
      score: Math.min(10, score), 
      max: 10, 
      status: daysUntilDeadline > 30 ? 'strong' : daysUntilDeadline > 0 ? 'medium' : 'weak',
      message: daysUntilDeadline > 0 ? `${daysUntilDeadline} jours restants` : 'Délai dépassé'
    });
  }

  return { score, breakdown, strengths, weaknesses };
};

const getRelatedFields = (field) => {
  const relations = {
    'informatique': ['informatique', 'computer science', 'it', 'génie logiciel'],
    'économie': ['économie', 'finance', 'commerce', 'management'],
    'médecine': ['médecine', 'santé', 'biologie', 'pharmacie'],
  };
  return relations[field] || [];
};

const getMatchLevel = (score) => {
  if (score >= 70) return { label: 'High Match', status: 'high' };
  if (score >= 40) return { label: 'Medium Match', status: 'medium' };
  return { label: 'Low Match', status: 'low' };
};

const getMatchColor = (score, c) => {
  if (score >= 70) return c.success;
  if (score >= 40) return c.warning;
  return c.error;
};

const getEffortLevel = (score, weaknesses) => {
  if (score >= 70) return { label: 'Easy to reach' };
  if (score >= 40 && weaknesses.length <= 2) return { label: 'Requires improvement' };
  return { label: 'Long-term goal' };
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

const DecisionHeader = ({ c, lang, onViewBestMatches }) => (
  <div style={{ marginBottom: 48 }}>
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ 
        fontFamily: c.fSerif, 
        fontSize: 40, 
        fontWeight: 700, 
        color: c.ink, 
        marginBottom: 16, 
        letterSpacing: '-0.02em',
        animation: 'fadeInUp 0.4s ease-out',
      }}>
        {lang === 'fr' ? 'Vos meilleures opportunités' : 'Your best opportunities'}
      </h1>
      <p style={{ 
        fontFamily: c.fSans, 
        fontSize: 15, 
        color: c.inkSecondary, 
        lineHeight: 1.6, 
        marginBottom: 28,
        animation: 'fadeInUp 0.4s ease-out 0.1s both',
      }}>
        {lang === 'fr' 
          ? 'Basé sur votre profil académique, notre algorithme calcule un score de compatibilité précis pour chaque bourse. Concentrez-vous sur les opportunités où vous avez le plus de chances.'
          : 'Based on your academic profile, our algorithm calculates a precise compatibility score for each scholarship. Focus on opportunities where you have the best chances.'}
      </p>
      <button 
        onClick={onViewBestMatches}
        style={{
          background: c.accent,
          color: c.paper,
          border: 'none',
          padding: '12px 32px',
          fontSize: 13,
          fontWeight: 500,
          fontFamily: c.fMono,
          letterSpacing: '0.03em',
          cursor: 'pointer',
          transition: c.transition,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = c.accentDark;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = c.accent;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {lang === 'fr' ? 'Voir mes meilleures chances' : 'View my best matches'}
      </button>
    </div>
  </div>
);

const MatchSummary = ({ scholarships, c, lang }) => {
  const stats = useMemo(() => {
    const high = scholarships.filter(s => s.matchScore >= 70).length;
    const medium = scholarships.filter(s => s.matchScore >= 40 && s.matchScore < 70).length;
    const low = scholarships.filter(s => s.matchScore < 40).length;
    const total = scholarships.length;
    return { high, medium, low, total };
  }, [scholarships]);

  return (
    <div style={{ 
      background: c.surface, 
      border: `1px solid ${c.border}`,
      padding: '28px',
      marginBottom: 40,
      animation: 'fadeInUp 0.4s ease-out 0.2s both',
    }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: c.accent, fontFamily: c.fSerif }}>
          {stats.total}
        </div>
        <div style={{ fontSize: 12, color: c.inkTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
          {lang === 'fr' ? 'OPPORTUNITÉS COMPATIBLES' : 'COMPATIBLE OPPORTUNITIES'}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 600, color: c.success }}>{stats.high}</div>
          <div style={{ fontSize: 11, color: c.inkTertiary, marginTop: 4 }}>{lang === 'fr' ? 'FORTES CHANCES' : 'STRONG MATCHES'}</div>
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 600, color: c.warning }}>{stats.medium}</div>
          <div style={{ fontSize: 11, color: c.inkTertiary, marginTop: 4 }}>{lang === 'fr' ? 'CHANCES MODÉRÉES' : 'MEDIUM MATCHES'}</div>
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 600, color: c.error }}>{stats.low}</div>
          <div style={{ fontSize: 11, color: c.inkTertiary, marginTop: 4 }}>{lang === 'fr' ? 'À AMÉLIORER' : 'LOW MATCHES'}</div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 4, height: 4 }}>
        <div style={{ flex: stats.high, background: c.success, transition: 'flex 0.3s ease' }} />
        <div style={{ flex: stats.medium, background: c.warning, transition: 'flex 0.3s ease' }} />
        <div style={{ flex: stats.low, background: c.error, transition: 'flex 0.3s ease' }} />
      </div>
    </div>
  );
};

const MatchFilters = ({ filters, setFilters, c, lang }) => {
  const matchLevels = [
    { id: 'all', label: lang === 'fr' ? 'Tous' : 'All' },
    { id: 'high', label: lang === 'fr' ? 'Forts' : 'High' },
    { id: 'medium', label: lang === 'fr' ? 'Moyens' : 'Medium' },
    { id: 'low', label: lang === 'fr' ? 'Faibles' : 'Low' },
  ];

  const intents = [
    { id: 'maximize', label: lang === 'fr' ? 'Maximiser mes chances' : 'Maximize chances' },
    { id: 'realistic', label: lang === 'fr' ? 'Opportunités réalistes' : 'Realistic opportunities' },
    { id: 'ambitious', label: lang === 'fr' ? 'Objectifs ambitieux' : 'Ambitious goals' },
  ];

  return (
    <div style={{ marginBottom: 40, animation: 'fadeInUp 0.4s ease-out 0.3s both' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: c.inkTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          {lang === 'fr' ? 'NIVEAU DE COMPATIBILITÉ' : 'MATCH LEVEL'}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {matchLevels.map(level => (
            <button
              key={level.id}
              onClick={() => setFilters({ ...filters, matchLevel: level.id })}
              style={{
                padding: '8px 20px',
                background: filters.matchLevel === level.id ? c.accent : 'transparent',
                color: filters.matchLevel === level.id ? c.paper : c.inkSecondary,
                border: `1px solid ${filters.matchLevel === level.id ? c.accent : c.border}`,
                fontSize: 12,
                fontWeight: filters.matchLevel === level.id ? 500 : 400,
                cursor: 'pointer',
                fontFamily: c.fMono,
                transition: c.transition,
              }}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: c.inkTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          {lang === 'fr' ? 'OBJECTIF' : 'INTENT'}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {intents.map(intent => (
            <button
              key={intent.id}
              onClick={() => setFilters({ ...filters, intent: intent.id })}
              style={{
                padding: '8px 20px',
                background: filters.intent === intent.id ? c.accent : 'transparent',
                color: filters.intent === intent.id ? c.paper : c.inkSecondary,
                border: `1px solid ${filters.intent === intent.id ? c.accent : c.border}`,
                fontSize: 12,
                fontWeight: filters.intent === intent.id ? 500 : 400,
                cursor: 'pointer',
                fontFamily: c.fMono,
                transition: c.transition,
              }}
            >
              {intent.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ScholarshipCard = ({ bourse, onAnalyze, onSave, onApply, isStarred, isApplied, c, lang }) => {
  const matchLevel = getMatchLevel(bourse.matchScore);
  const matchColor = getMatchColor(bourse.matchScore, c);
  const effort = getEffortLevel(bourse.matchScore, bourse.weaknesses || []);
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <article 
      style={{
        border: `1px solid ${isHovered ? c.accent : c.border}`,
        padding: '28px',
        marginBottom: 16,
        background: c.surface,
        transition: c.transition,
        cursor: 'pointer',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.08)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onAnalyze(bourse)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={{ textAlign: 'center', minWidth: 100 }}>
          <div style={{ 
            fontSize: 56, 
            fontWeight: 700, 
            color: matchColor,
            lineHeight: 1,
            marginBottom: 4,
            letterSpacing: '-0.02em',
          }}>
            {bourse.matchScore}
            <span style={{ fontSize: 24 }}>%</span>
          </div>
          <div style={{ 
            fontSize: 10, 
            fontWeight: 500,
            color: matchColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {matchLevel.label}
          </div>
        </div>
        
        <div style={{ flex: 1, marginLeft: 28 }}>
          <h3 style={{ fontFamily: c.fSerif, fontSize: 20, fontWeight: 600, color: c.ink, margin: '0 0 8px' }}>
            {bourse.nom}
          </h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12, fontSize: 12, color: c.inkTertiary }}>
            <span>{tCountry(bourse.pays, lang)}</span>
            {bourse.niveau && <span>{tLevel(bourse.niveau, lang)}</span>}
            <span style={{ color: c.info }}>{effort.label}</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ height: 4, background: c.borderLight, borderRadius: 2, overflow: 'hidden' }}>
          <div 
            style={{ 
              width: `${bourse.matchScore}%`, 
              height: '100%', 
              background: matchColor,
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }} 
          />
        </div>
      </div>

      <div style={{ 
        background: c.paper, 
        padding: '14px', 
        marginBottom: 20,
        borderLeft: `3px solid ${c.accent}`,
        fontSize: 12,
        color: c.inkSecondary,
        lineHeight: 1.6,
      }}>
        <strong style={{ color: c.accent, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Pourquoi ce score ?
        </strong>
        <div style={{ marginTop: 6 }}>
          {bourse.matchReasons && bourse.matchReasons.length > 0 
            ? bourse.matchReasons.slice(0, 2).join(' • ')
            : 'Analyse basée sur votre profil académique'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button 
          onClick={(e) => { e.stopPropagation(); onAnalyze(bourse); }}
          style={{
            flex: 1,
            padding: '10px',
            background: c.accent,
            color: c.paper,
            border: 'none',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: c.fMono,
            transition: c.transition,
          }}
          onMouseEnter={e => e.currentTarget.style.background = c.accentDark}
          onMouseLeave={e => e.currentTarget.style.background = c.accent}
        >
          Analyser mon match
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onSave(bourse); }}
          style={{
            padding: '10px 20px',
            background: isStarred ? c.accent : 'transparent',
            color: isStarred ? c.paper : c.inkSecondary,
            border: `1px solid ${c.border}`,
            fontSize: 12,
            cursor: 'pointer',
            transition: c.transition,
          }}
        >
          {isStarred ? '★' : '☆'}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onApply(bourse); }}
          style={{
            padding: '10px 20px',
            background: isApplied ? c.success : 'transparent',
            color: isApplied ? c.paper : c.inkSecondary,
            border: `1px solid ${c.border}`,
            fontSize: 12,
            cursor: 'pointer',
            transition: c.transition,
          }}
        >
          {isApplied ? '✓' : '+'}
        </button>
      </div>
    </article>
  );
};

const MatchAnalysisPanel = ({ bourse, onClose, onSave, onApply, isStarred, isApplied, c, lang }) => {
  const matchColor = getMatchColor(bourse.matchScore, c);
  const matchLevel = getMatchLevel(bourse.matchScore);
  
  const getImprovementSuggestions = () => {
    const suggestions = [];
    const weaknesses = bourse.weaknesses || [];
    
    if (weaknesses.includes('Niveau d\'étude non requis')) {
      suggestions.push({
        action: lang === 'fr' ? 'Améliorer votre niveau d\'étude' : 'Improve your study level',
        steps: lang === 'fr' 
          ? ['Vérifier les prérequis de la bourse', 'Considérer un programme préparatoire', 'Contacter l\'université pour les équivalences']
          : ['Check scholarship prerequisites', 'Consider preparatory program', 'Contact university for equivalencies'],
      });
    }
    
    if (weaknesses.includes('Domaine d\'étude non aligné')) {
      suggestions.push({
        action: lang === 'fr' ? 'Aligner votre domaine d\'étude' : 'Align your field of study',
        steps: lang === 'fr'
          ? ['Suivre des cours complémentaires', 'Gagner de l\'expérience pertinente', 'Préparer un projet de recherche']
          : ['Take complementary courses', 'Gain relevant experience', 'Prepare a research project'],
      });
    }
    
    if (weaknesses.includes('Date limite dépassée')) {
      suggestions.push({
        action: lang === 'fr' ? 'Préparer pour la prochaine session' : 'Prepare for next session',
        steps: lang === 'fr'
          ? ['Noter la nouvelle date limite', 'Préparer les documents à l\'avance', 'Améliorer votre dossier']
          : ['Note new deadline', 'Prepare documents in advance', 'Improve your application'],
      });
    }
    
    if (weaknesses.includes('Non éligible pour étudiants tunisiens')) {
      suggestions.push({
        action: lang === 'fr' ? 'Explorer d\'autres opportunités' : 'Explore other opportunities',
        steps: lang === 'fr'
          ? ['Chercher des bourses spécifiques pour Tunisiens', 'Contacter l\'ambassade', 'Explorer les programmes d\'échange']
          : ['Look for Tunisia-specific scholarships', 'Contact embassy', 'Explore exchange programs'],
      });
    }
    
    return suggestions;
  };
  
  const suggestions = getImprovementSuggestions();
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      maxWidth: 600,
      background: c.surface,
      boxShadow: '-8px 0 32px rgba(0,0,0,0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
      animation: 'slideInRight 0.3s ease-out',
    }}>
      <div style={{
        padding: '28px',
        borderBottom: `1px solid ${c.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        background: c.surface,
        zIndex: 1,
      }}>
        <div>
          <div style={{ fontSize: 11, color: c.inkTertiary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Analyse détaillée
          </div>
          <h2 style={{ fontFamily: c.fSerif, fontSize: 22, fontWeight: 600, margin: 0 }}>{bourse.nom}</h2>
        </div>
        <button 
          onClick={onClose} 
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: 24, 
            cursor: 'pointer', 
            color: c.inkTertiary,
            transition: c.transition,
          }}
          onMouseEnter={e => e.currentTarget.style.color = c.error}
          onMouseLeave={e => e.currentTarget.style.color = c.inkTertiary}
        >
          ×
        </button>
      </div>
      
      <div style={{ padding: '28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 72, fontWeight: 700, color: matchColor, marginBottom: 12, letterSpacing: '-0.02em' }}>
            {bourse.matchScore}%
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: matchColor, marginBottom: 8 }}>
            {matchLevel.label}
          </div>
          <div style={{ fontSize: 13, color: c.inkSecondary }}>
            {matchLevel.status === 'high' && (lang === 'fr' ? 'Excellente compatibilité, postulez sans attendre' : 'Excellent compatibility, apply now')}
            {matchLevel.status === 'medium' && (lang === 'fr' ? 'Bon potentiel avec quelques axes d\'amélioration' : 'Good potential with some improvement areas')}
            {matchLevel.status === 'low' && (lang === 'fr' ? 'Potentiel limité, mais des opportunités d\'amélioration' : 'Limited potential, but improvement opportunities exist')}
          </div>
        </div>
        
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
            Détail des critères
          </h3>
          {bourse.breakdown && bourse.breakdown.map((criteria, idx) => {
            const percentage = (criteria.score / criteria.max) * 100;
            let barColor = c.error;
            if (percentage >= 70) barColor = c.success;
            else if (percentage >= 40) barColor = c.warning;
            
            return (
              <div key={idx} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                  <span style={{ color: c.inkSecondary }}>{criteria.criterion}</span>
                  <span style={{ fontWeight: 600, color: c.ink }}>{criteria.score}/{criteria.max}</span>
                </div>
                <div style={{ height: 4, background: c.borderLight, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${percentage}%`, 
                    height: '100%', 
                    background: barColor,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div style={{ fontSize: 11, color: c.inkTertiary, marginTop: 6 }}>{criteria.message}</div>
              </div>
            );
          })}
        </div>
        
        <div style={{ marginBottom: 40, display: 'grid', gap: 20 }}>
          {bourse.strengths && bourse.strengths.length > 0 && (
            <div style={{ padding: '16px', background: `${c.success}08`, borderLeft: `3px solid ${c.success}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.success, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Forces
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: c.inkSecondary }}>
                {bourse.strengths.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
              </ul>
            </div>
          )}
          
          {bourse.weaknesses && bourse.weaknesses.length > 0 && (
            <div style={{ padding: '16px', background: `${c.error}08`, borderLeft: `3px solid ${c.error}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.error, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Points à améliorer
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: c.inkSecondary }}>
                {bourse.weaknesses.map((w, i) => <li key={i} style={{ marginBottom: 4 }}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
        
        {suggestions.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h3 style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              Plan d'amélioration
            </h3>
            {suggestions.map((suggestion, idx) => (
              <div key={idx} style={{ marginBottom: 20, padding: '20px', background: c.paper, border: `1px solid ${c.borderLight}` }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: c.accent }}>
                  {suggestion.action}
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: c.inkSecondary }}>
                  {suggestion.steps.map((step, i) => <li key={i} style={{ marginBottom: 6 }}>{step}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => onSave(bourse)}
            style={{
              flex: 1,
              padding: '14px',
              background: isStarred ? c.accent : 'transparent',
              color: isStarred ? c.paper : c.accent,
              border: `1px solid ${c.accent}`,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: c.fMono,
              transition: c.transition,
            }}
            onMouseEnter={e => {
              if (!isStarred) e.currentTarget.style.background = `${c.accent}10`;
            }}
            onMouseLeave={e => {
              if (!isStarred) e.currentTarget.style.background = 'transparent';
            }}
          >
            {isStarred ? 'Sauvegardé' : 'Sauvegarder'}
          </button>
          <button 
            onClick={() => onApply(bourse)}
            style={{
              flex: 1,
              padding: '14px',
              background: isApplied ? c.success : c.accent,
              color: c.paper,
              border: 'none',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: c.fMono,
              transition: c.transition,
            }}
            onMouseEnter={e => {
              if (!isApplied) e.currentTarget.style.background = c.accentDark;
            }}
            onMouseLeave={e => {
              if (!isApplied) e.currentTarget.style.background = c.accent;
            }}
          >
            {isApplied ? 'Dans ma roadmap' : 'Préparer ma candidature'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ComparisonView = ({ scholarships, selectedIds, onRemove, c, lang }) => {
  const selectedScholarships = scholarships.filter(s => selectedIds.includes(s.id));
  
  if (selectedScholarships.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', background: c.paper, border: `1px solid ${c.border}` }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>△</div>
        <div style={{ fontSize: 14, color: c.inkSecondary }}>
          {lang === 'fr' 
            ? 'Sélectionnez 2-3 bourses pour les comparer côte à côte' 
            : 'Select 2-3 scholarships to compare side by side'}
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ overflowX: 'auto', animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', gap: 24, minWidth: 800 }}>
        {selectedScholarships.map(scholarship => {
          const matchColor = getMatchColor(scholarship.matchScore, c);
          return (
            <div key={scholarship.id} style={{ 
              flex: 1, 
              minWidth: 260, 
              border: `1px solid ${c.border}`, 
              padding: '24px', 
              background: c.surface, 
              position: 'relative' 
            }}>
              <button 
                onClick={() => onRemove(scholarship.id)}
                style={{ 
                  position: 'absolute', 
                  top: 16, 
                  right: 16, 
                  background: 'none', 
                  border: 'none', 
                  fontSize: 20, 
                  cursor: 'pointer', 
                  color: c.inkTertiary,
                  transition: c.transition,
                }}
                onMouseEnter={e => e.currentTarget.style.color = c.error}
                onMouseLeave={e => e.currentTarget.style.color = c.inkTertiary}
              >
                ×
              </button>
              
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 48, fontWeight: 700, color: matchColor, letterSpacing: '-0.02em' }}>
                  {scholarship.matchScore}%
                </div>
                <div style={{ fontSize: 10, color: c.inkTertiary, marginTop: 6 }}>{getMatchLevel(scholarship.matchScore).label}</div>
              </div>
              
              <h4 style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{scholarship.nom}</h4>
              
              <div style={{ fontSize: 12, color: c.inkSecondary }}>
                <div style={{ marginBottom: 10 }}>{tCountry(scholarship.pays, lang)}</div>
                {scholarship.niveau && <div style={{ marginBottom: 10 }}>{tLevel(scholarship.niveau, lang)}</div>}
                {scholarship.financement && <div>{tFunding(scholarship.financement, lang)}</div>}
              </div>
              
              {scholarship.weaknesses && scholarship.weaknesses.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${c.borderLight}` }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: c.error, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Écarts
                  </div>
                  <div style={{ fontSize: 11, color: c.inkTertiary }}>
                    {scholarship.weaknesses.slice(0, 2).join(', ')}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function RecommandationsPage({
  user, handleSend, messages, input, setInput,
  loading: chatLoading, handleQuickReply, setView, onStarChange,
}) {
  const { t, lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [analysisBourse, setAnalysisBourse] = useState(null);
  const [filters, setFilters] = useState({ matchLevel: 'all', intent: 'maximize' });
  const [activeTab, setActiveTab] = useState('matches');
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [allScholarships, setAllScholarships] = useState([]);
  const [error, setError] = useState(null);
  const [starredNoms, setStarredNoms] = useState(new Set());
  const [appliedNoms, setAppliedNoms] = useState(new Set());

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.paper, padding: 24 }}>
        <div style={{ background: c.surface, border: `1px solid ${c.border}`, padding: '48px 40px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>○</div>
          <h3 style={{ fontFamily: c.fSerif, fontSize: 20, fontWeight: 600, color: c.ink, margin: '0 0 8px' }}>
            {lang === 'fr' ? 'Recommandations non disponibles' : 'Recommendations unavailable'}
          </h3>
          <p style={{ color: c.inkSecondary, fontSize: 13, lineHeight: 1.5, margin: '0 0 24px' }}>
            {lang === 'fr'
              ? 'Connectez-vous pour découvrir les bourses parfaitement adaptées à votre profil.'
              : 'Sign in to discover scholarships perfectly suited to your profile.'}
          </p>
          <button style={{ 
            padding: '10px 28px', 
            background: c.accent, 
            color: c.paper, 
            border: 'none', 
            fontSize: 12, 
            fontWeight: 500, 
            fontFamily: c.fMono, 
            cursor: 'pointer',
            transition: c.transition,
          }} 
          onClick={() => setShowLoginModal(true)}
          onMouseEnter={e => e.currentTarget.style.background = c.accentDark}
          onMouseLeave={e => e.currentTarget.style.background = c.accent}
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  const loadRecommandations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data: userData } = await axiosInstance.get(`/api/users/${user.id}`, { params: { depth: 0 } });
      const { data: dataFav } = await axiosInstance.get('/api/favoris', { params: { 'where[user][equals]': user.id, limit: 1, depth: 0 } });
      const docFav = dataFav.docs?.[0];
      const newStarred = new Set((docFav?.bourses || []).map(b => b.nom?.trim().toLowerCase()));
      setStarredNoms(newStarred);
      onStarChange?.(newStarred.size);
      
      const { data: dataRoadmap } = await axiosInstance.get(API_ROUTES.roadmap.list, { params: { 'where[userId][equals]': user.id, limit: 100, depth: 0 } });
      setAppliedNoms(new Set((dataRoadmap.docs || []).map(b => b.nom?.trim().toLowerCase())));
      
      const { data: dataBourses } = await axiosInstance.get(API_ROUTES.bourses.list, { params: { limit: 200, depth: 0 } });
      const bourses = dataBourses.docs || [];
      
      const userProfile = {
        niveau: userData.niveau || user.niveau || '',
        domaine: userData.domaine || user.domaine || '',
        pays: userData.pays || user.pays || '',
      };
      
      const scoredBourses = bourses.map(bourse => {
        const { score, breakdown, strengths, weaknesses } = calculateMatchScore(bourse, userProfile);
        const reasons = [];
        if (strengths.length > 0) reasons.push(...strengths.slice(0, 2));
        if (bourse.tunisienEligible === 'oui') reasons.push('Éligible Tunisie');
        if (bourse.statut === 'active') reasons.push('Candidatures ouvertes');
        
        return {
          ...bourse,
          matchScore: score,
          matchReasons: reasons,
          breakdown,
          strengths,
          weaknesses,
        };
      });
      
      setAllScholarships(scoredBourses);
    } catch (err) {
      setError((lang === 'fr' ? 'Impossible de charger les recommandations : ' : 'Could not load recommendations: ') + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
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
    } catch (err) {
      console.error('[handleStar]', err);
    }
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

  useEffect(() => { loadRecommandations(); }, [loadRecommandations]);

  const filteredScholarships = useMemo(() => {
    let results = [...allScholarships];
    
    if (filters.matchLevel !== 'all') {
      if (filters.matchLevel === 'high') results = results.filter(s => s.matchScore >= 70);
      if (filters.matchLevel === 'medium') results = results.filter(s => s.matchScore >= 40 && s.matchScore < 70);
      if (filters.matchLevel === 'low') results = results.filter(s => s.matchScore >= 0 && s.matchScore < 40);
    }
    
    if (filters.intent === 'maximize') {
      results.sort((a, b) => b.matchScore - a.matchScore);
    } else if (filters.intent === 'realistic') {
      results.sort((a, b) => {
        if (a.matchScore >= 40 && b.matchScore >= 40) return b.matchScore - a.matchScore;
        if (a.matchScore >= 40) return -1;
        if (b.matchScore >= 40) return 1;
        return b.matchScore - a.matchScore;
      });
    } else if (filters.intent === 'ambitious') {
      results.sort((a, b) => {
        if (a.matchScore >= 70 && b.matchScore >= 70) return b.matchScore - a.matchScore;
        if (a.matchScore >= 70) return -1;
        if (b.matchScore >= 70) return 1;
        return b.matchScore - a.matchScore;
      });
    }
    
    return results;
  }, [allScholarships, filters]);

  const viewBestMatches = () => {
    setFilters({ matchLevel: 'all', intent: 'maximize' });
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px' }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            border: `2px solid ${c.borderLight}`, 
            borderTopColor: c.accent, 
            borderRadius: '50%', 
            animation: 'spin 0.8s linear infinite' 
          }} />
          <p style={{ color: c.inkSecondary, marginTop: 20, fontSize: 13 }}>
            {lang === 'fr' ? 'Analyse de votre profil...' : 'Analyzing your profile...'}
          </p>
        </div>
      );
    }
    
    if (activeTab === 'compare') {
      return (
        <ComparisonView
          scholarships={filteredScholarships}
          selectedIds={selectedForComparison}
          onRemove={(id) => setSelectedForComparison(prev => prev.filter(i => i !== id))}
          c={c}
          lang={lang}
        />
      );
    }
    
    const displayScholarships = activeTab === 'matches' 
      ? filteredScholarships.filter(s => s.matchScore >= 40)
      : filteredScholarships;
    
    const highMatches = displayScholarships.filter(s => s.matchScore >= 70);
    const mediumMatches = displayScholarships.filter(s => s.matchScore >= 40 && s.matchScore < 70);
    const lowMatches = displayScholarships.filter(s => s.matchScore < 40);
    
    const sections = [
      { title: lang === 'fr' ? 'Forte compatibilité' : 'High Match', scholarships: highMatches, color: c.success },
      { title: lang === 'fr' ? 'Compatibilité moyenne' : 'Medium Match', scholarships: mediumMatches, color: c.warning },
      { title: lang === 'fr' ? 'À améliorer' : 'Needs Improvement', scholarships: lowMatches, color: c.error },
    ];
    
    return (
      <div>
        {sections.map(section => section.scholarships.length > 0 && (
          <div key={section.title} style={{ marginBottom: 40 }}>
            <div style={{ 
              fontSize: 13, 
              fontWeight: 600, 
              color: section.color,
              marginBottom: 20,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {section.title} ({section.scholarships.length})
            </div>
            <div>
              {section.scholarships.map(bourse => (
                <ScholarshipCard
                  key={bourse.id}
                  bourse={bourse}
                  onAnalyze={setAnalysisBourse}
                  onSave={handleStar}
                  onApply={handleApply}
                  isStarred={starredNoms.has(bourse.nom?.trim().toLowerCase())}
                  isApplied={appliedNoms.has(bourse.nom?.trim().toLowerCase())}
                  c={c}
                  lang={lang}
                />
              ))}
            </div>
          </div>
        ))}
        {displayScholarships.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>○</div>
            <div style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 600, color: c.ink, marginBottom: 8 }}>
              {lang === 'fr' ? 'Aucune recommandation trouvée' : 'No recommendations found'}
            </div>
            <p style={{ color: c.inkSecondary, fontSize: 13 }}>{lang === 'fr' ? 'Complétez votre profil pour de meilleures suggestions' : 'Complete your profile for better suggestions'}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 32px 80px' }}>
        <DecisionHeader c={c} lang={lang} onViewBestMatches={viewBestMatches} />
        <MatchSummary scholarships={allScholarships} c={c} lang={lang} />
        <MatchFilters filters={filters} setFilters={setFilters} c={c} lang={lang} />
        
        <div style={{ display: 'flex', borderBottom: `1px solid ${c.border}`, marginBottom: 32 }}>
          {[
            { id: 'matches', label: lang === 'fr' ? 'Meilleurs matches' : 'Best Matches' },
            { id: 'all', label: lang === 'fr' ? 'Toutes les opportunités' : 'All Opportunities' },
            { id: 'compare', label: `${lang === 'fr' ? 'Comparer' : 'Compare'} ${selectedForComparison.length > 0 ? `(${selectedForComparison.length}/3)` : ''}` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: 'none',
                color: activeTab === tab.id ? c.accent : c.inkSecondary,
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 500 : 400,
                cursor: 'pointer',
                fontFamily: c.fMono,
                borderBottom: activeTab === tab.id ? `2px solid ${c.accent}` : '2px solid transparent',
                transition: c.transition,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {error && !loading && (
          <div style={{ margin: '20px 0', padding: '14px 20px', background: `${c.error}08`, borderLeft: `3px solid ${c.error}`, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: c.error }}>{error}</span>
            <button 
              style={{ 
                padding: '6px 16px', 
                background: c.error, 
                border: 'none', 
                color: c.paper, 
                fontSize: 11, 
                fontWeight: 500, 
                cursor: 'pointer', 
                fontFamily: c.fMono,
                transition: c.transition,
              }} 
              onClick={loadRecommandations}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {lang === 'fr' ? 'Réessayer' : 'Retry'}
            </button>
          </div>
        )}
        
        {renderContent()}
      </div>
      
      {analysisBourse && (
        <MatchAnalysisPanel
          bourse={analysisBourse}
          onClose={() => setAnalysisBourse(null)}
          onSave={handleStar}
          onApply={handleApply}
          isStarred={starredNoms.has(analysisBourse.nom?.trim().toLowerCase())}
          isApplied={appliedNoms.has(analysisBourse.nom?.trim().toLowerCase())}
          c={c}
          lang={lang}
        />
      )}
      
      {selected && (
        <BourseDrawer
          bourse={selected}
          onClose={() => setSelected(null)}
          onAskAI={() => {}}
          starred={starredNoms.has(selected.nom?.trim().toLowerCase())}
          onStar={handleStar}
          applied={appliedNoms.has(selected.nom?.trim().toLowerCase())}
          onApply={handleApply}
          user={user}
        />
      )}
    </main>
  );
}