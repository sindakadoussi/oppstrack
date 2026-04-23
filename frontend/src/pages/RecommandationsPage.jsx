// RecommandationsPage.jsx - Decision-Oriented Match Score Interface
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '@/config/axiosInstance';
import BourseDrawer from '../components/Boursedrawer';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';
import { tCountry, tLevel, tFunding, tField, tDescription } from '@/utils/translateDB';

/* ═══════════════════════════════════════════════════════════════════════════
   TOKENS (theme-aware)
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
  success:    "#2e6b3e",
  fSerif: `"Libre Caslon Text", "Times New Roman", Georgia, serif`,
  fSans:  `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"JetBrains Mono", ui-monospace, Menlo, monospace`,
});

/* ═══════════════════════════════════════════════════════════════════════════
   MATCH SCORE CONSTANTS & HELPERS
═══════════════════════════════════════════════════════════════════════════ */
const MATCH_LEVELS = {
  HIGH: { min: 70, label: 'Strong Match', color: '#2e6b3e', bgGradient: 'linear-gradient(135deg, #2e6b3e20, #2e6b3e08)' },
  MEDIUM: { min: 40, label: 'Medium Match', color: '#b06a12', bgGradient: 'linear-gradient(135deg, #b06a1220, #b06a1208)' },
  LOW: { min: 0, label: 'Weak Match', color: '#b4321f', bgGradient: 'linear-gradient(135deg, #b4321f20, #b4321f08)' }
};

const getMatchLevel = (score) => {
  if (score >= MATCH_LEVELS.HIGH.min) return 'HIGH';
  if (score >= MATCH_LEVELS.MEDIUM.min) return 'MEDIUM';
  return 'LOW';
};

const getMatchColor = (score) => MATCH_LEVELS[getMatchLevel(score)].color;
const getMatchGradient = (score) => MATCH_LEVELS[getMatchLevel(score)].bgGradient;

const EFFORT_LEVELS = {
  EASY: { label: 'Easy to reach', icon: '⚡', color: '#2e6b3e' },
  MEDIUM: { label: 'Requires improvement', icon: '📈', color: '#b06a12' },
  HARD: { label: 'Long-term goal', icon: '🎯', color: '#b4321f' }
};

const calculateEffortLevel = (score, gaps) => {
  if (score >= 80) return 'EASY';
  if (score >= 60 && gaps?.length <= 2) return 'EASY';
  if (score >= 40) return 'MEDIUM';
  return 'HARD';
};

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
function MatchHeader({ c, lang, onScrollToTopMatches }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ 
        fontFamily: c.fSerif, 
        fontSize: 32, 
        fontWeight: 700, 
        color: c.ink, 
        margin: '0 0 8px 0',
        letterSpacing: '-0.02em'
      }}>
        🎯 {lang === 'fr' ? 'Vos meilleures opportunités' : 'Your best opportunities'}
      </h1>
      <p style={{ 
        fontFamily: c.fSans, 
        fontSize: 14, 
        color: c.ink2, 
        margin: '0 0 20px 0',
        lineHeight: 1.5
      }}>
        {lang === 'fr' 
          ? 'Basé sur votre profil académique, nous avons calculé votre compatibilité avec chaque bourse.' 
          : 'Based on your academic profile, we calculated your compatibility with each scholarship.'}
      </p>
      <button
        onClick={onScrollToTopMatches}
        style={{
          background: c.accent,
          color: c.paper,
          border: 'none',
          padding: '10px 24px',
          borderRadius: 0,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: c.fMono,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          transition: 'opacity 0.15s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        🔍 {lang === 'fr' ? 'Voir mes meilleurs matches' : 'View my best matches'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MATCH SUMMARY BLOCK
═══════════════════════════════════════════════════════════════════════════ */
function MatchSummary({ scholarships, lang, c }) {
  const distribution = useMemo(() => {
    const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    scholarships.forEach(s => {
      const level = getMatchLevel(s.matchScore);
      counts[level]++;
    });
    return counts;
  }, [scholarships]);

  const total = scholarships.length;
  const percentages = {
    HIGH: (distribution.HIGH / total) * 100 || 0,
    MEDIUM: (distribution.MEDIUM / total) * 100 || 0,
    LOW: (distribution.LOW / total) * 100 || 0
  };

  return (
    <div style={{ 
      background: c.paper2, 
      border: `1px solid ${c.rule}`,
      padding: '24px',
      marginBottom: 32
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, color: c.accent, lineHeight: 1 }}>
            {total}
          </div>
          <div style={{ fontSize: 12, color: c.ink3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {lang === 'fr' ? 'Opportunités compatibles' : 'Compatible opportunities'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: MATCH_LEVELS.HIGH.color }}>
              {distribution.HIGH}
            </div>
            <div style={{ fontSize: 11, color: c.ink3 }}>{MATCH_LEVELS.HIGH.label}</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: MATCH_LEVELS.MEDIUM.color }}>
              {distribution.MEDIUM}
            </div>
            <div style={{ fontSize: 11, color: c.ink3 }}>{MATCH_LEVELS.MEDIUM.label}</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: MATCH_LEVELS.LOW.color }}>
              {distribution.LOW}
            </div>
            <div style={{ fontSize: 11, color: c.ink3 }}>{MATCH_LEVELS.LOW.label}</div>
          </div>
        </div>
      </div>
      
      {/* Distribution bars */}
      <div style={{ display: 'flex', height: 6, gap: 2 }}>
        <div style={{ flex: percentages.HIGH, background: MATCH_LEVELS.HIGH.color }} />
        <div style={{ flex: percentages.MEDIUM, background: MATCH_LEVELS.MEDIUM.color }} />
        <div style={{ flex: percentages.LOW, background: MATCH_LEVELS.LOW.color }} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: c.ink3 }}>
        <span>{Math.round(percentages.HIGH)}% {lang === 'fr' ? 'fortes chances' : 'strong chances'}</span>
        <span>{Math.round(percentages.MEDIUM)}% {lang === 'fr' ? 'chances moyennes' : 'medium chances'}</span>
        <span>{Math.round(percentages.LOW)}% {lang === 'fr' ? 'à améliorer' : 'to improve'}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MATCH FILTERS SYSTEM
═══════════════════════════════════════════════════════════════════════════ */
function MatchFilters({ filters, setFilters, scholarships, lang, c }) {
  const intentOptions = [
    { id: 'maximize', label: lang === 'fr' ? 'Maximiser mes chances' : 'Maximize my chances', icon: '🚀' },
    { id: 'realistic', label: lang === 'fr' ? 'Opportunités réalistes' : 'Realistic opportunities', icon: '🎯' },
    { id: 'ambitious', label: lang === 'fr' ? 'Objectifs ambitieux' : 'Ambitious goals', icon: '⭐' }
  ];

  const matchLevelFilters = [
    { id: 'HIGH', label: MATCH_LEVELS.HIGH.label, color: MATCH_LEVELS.HIGH.color },
    { id: 'MEDIUM', label: MATCH_LEVELS.MEDIUM.label, color: MATCH_LEVELS.MEDIUM.color },
    { id: 'LOW', label: MATCH_LEVELS.LOW.label, color: MATCH_LEVELS.LOW.color }
  ];

  // Extract unique countries and fields for secondary filters
  const countries = useMemo(() => {
    const unique = new Set(scholarships.map(s => s.pays).filter(Boolean));
    return Array.from(unique);
  }, [scholarships]);

  const fields = useMemo(() => {
    const unique = new Set(scholarships.map(s => s.domaine).filter(Boolean));
    return Array.from(unique);
  }, [scholarships]);

  const studyLevels = useMemo(() => {
    const unique = new Set(scholarships.map(s => s.niveau).filter(Boolean));
    return Array.from(unique);
  }, [scholarships]);

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Primary filters - Match level */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.ink3, marginBottom: 12 }}>
          {lang === 'fr' ? 'Niveau de compatibilité' : 'Match level'}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {matchLevelFilters.map(level => (
            <button
              key={level.id}
              onClick={() => setFilters({ ...filters, matchLevel: filters.matchLevel === level.id ? null : level.id })}
              style={{
                padding: '6px 16px',
                background: filters.matchLevel === level.id ? level.color + '20' : 'transparent',
                border: `1px solid ${filters.matchLevel === level.id ? level.color : c.rule}`,
                color: filters.matchLevel === level.id ? level.color : c.ink2,
                fontSize: 12,
                fontWeight: filters.matchLevel === level.id ? 600 : 400,
                cursor: 'pointer',
                fontFamily: c.fMono,
                transition: 'all 0.15s ease'
              }}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Intent filters */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.ink3, marginBottom: 12 }}>
          {lang === 'fr' ? 'Par objectif' : 'By intent'}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {intentOptions.map(intent => (
            <button
              key={intent.id}
              onClick={() => setFilters({ ...filters, intent: filters.intent === intent.id ? null : intent.id })}
              style={{
                padding: '6px 16px',
                background: filters.intent === intent.id ? c.accent + '20' : 'transparent',
                border: `1px solid ${filters.intent === intent.id ? c.accent : c.rule}`,
                color: filters.intent === intent.id ? c.accent : c.ink2,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: c.fMono,
                transition: 'all 0.15s ease'
              }}
            >
              {intent.icon} {intent.label}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary filters - Collapsible section */}
      <details style={{ marginBottom: 16 }}>
        <summary style={{ 
          fontSize: 11, 
          fontWeight: 600, 
          textTransform: 'uppercase', 
          letterSpacing: '0.06em', 
          color: c.ink3, 
          cursor: 'pointer',
          padding: '8px 0'
        }}>
          🔧 {lang === 'fr' ? 'Filtres avancés' : 'Advanced filters'}
        </summary>
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: c.ink3, marginBottom: 6 }}>{lang === 'fr' ? 'Pays' : 'Country'}</div>
            <select 
              value={filters.country || ''}
              onChange={e => setFilters({ ...filters, country: e.target.value || null })}
              style={{ width: '100%', padding: '8px', background: c.surface, border: `1px solid ${c.rule}`, color: c.ink, fontSize: 12 }}
            >
              <option value="">{lang === 'fr' ? 'Tous les pays' : 'All countries'}</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: c.ink3, marginBottom: 6 }}>{lang === 'fr' ? "Niveau d'étude" : 'Study level'}</div>
            <select 
              value={filters.studyLevel || ''}
              onChange={e => setFilters({ ...filters, studyLevel: e.target.value || null })}
              style={{ width: '100%', padding: '8px', background: c.surface, border: `1px solid ${c.rule}`, color: c.ink, fontSize: 12 }}
            >
              <option value="">{lang === 'fr' ? 'Tous les niveaux' : 'All levels'}</option>
              {studyLevels.map(level => (
                <option key={level} value={level}>{tLevel(level, lang)}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: c.ink3, marginBottom: 6 }}>{lang === 'fr' ? 'Domaine' : 'Field'}</div>
            <select 
              value={filters.field || ''}
              onChange={e => setFilters({ ...filters, field: e.target.value || null })}
              style={{ width: '100%', padding: '8px', background: c.surface, border: `1px solid ${c.rule}`, color: c.ink, fontSize: 12 }}
            >
              <option value="">{lang === 'fr' ? 'Tous les domaines' : 'All fields'}</option>
              {fields.map(field => (
                <option key={field} value={field}>{tField(field, lang)}</option>
              ))}
            </select>
          </div>
        </div>
      </details>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCHOLARSHIP CARD (Match-Score First)
═══════════════════════════════════════════════════════════════════════════ */
function MatchScholarshipCard({ bourse, user, onAnalyze, onClick, starred, onStar, applied, onApply, c, lang }) {
  const matchLevel = getMatchLevel(bourse.matchScore);
  const matchColor = getMatchColor(bourse.matchScore);
  const effortLevel = EFFORT_LEVELS[calculateEffortLevel(bourse.matchScore, bourse.gaps)];

  return (
    <article
      onClick={onClick}
      style={{
        background: getMatchGradient(bourse.matchScore),
        border: `1px solid ${c.rule}`,
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        position: 'relative',
        marginBottom: 16
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateX(4px)';
        e.currentTarget.style.borderColor = matchColor;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.borderColor = c.rule;
      }}
    >
      {/* Match Score - Most prominent element */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div style={{ 
            fontSize: 48, 
            fontWeight: 800, 
            color: matchColor,
            fontFamily: c.fMono,
            lineHeight: 1
          }}>
            {bourse.matchScore}%
          </div>
          <div>
            <div style={{ 
              fontSize: 12, 
              fontWeight: 600, 
              color: matchColor,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {MATCH_LEVELS[matchLevel].label}
            </div>
            <div style={{ fontSize: 10, color: c.ink3, marginTop: 2 }}>
              {effortLevel.icon} {effortLevel.label}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={(e) => { e.stopPropagation(); onStar(bourse, starred); }}
            style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: starred ? matchColor : c.ink3 }}
          >
            {starred ? '★' : '☆'}
          </button>
        </div>
      </div>

      {/* Progress bar for match */}
      <div style={{ height: 4, background: c.ruleSoft, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ width: `${bourse.matchScore}%`, height: '100%', background: matchColor, transition: 'width 0.3s ease' }} />
      </div>

      {/* Scholarship info */}
      <h3 style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', color: c.ink }}>
        {bourse.nom}
      </h3>
      
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12, fontSize: 11, color: c.ink3 }}>
        <span>📍 {tCountry(bourse.pays, lang)}</span>
        {bourse.niveau && <span>🎓 {tLevel(bourse.niveau, lang)}</span>}
        {bourse.financement && <span>💰 {tFunding(bourse.financement, lang)}</span>}
      </div>

      {/* AI Explanation */}
      {bourse.matchExplanation && (
        <p style={{ 
          fontSize: 12, 
          color: c.ink2, 
          margin: '0 0 16px 0',
          padding: '8px 12px',
          background: c.surface + '80',
          borderLeft: `2px solid ${matchColor}`,
          fontStyle: 'italic'
        }}>
          🤖 {bourse.matchExplanation}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button 
          onClick={(e) => { e.stopPropagation(); onAnalyze(bourse); }}
          style={{
            padding: '8px 16px',
            background: matchColor,
            color: '#fff',
            border: 'none',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: c.fMono,
            letterSpacing: '0.05em'
          }}
        >
          🔬 {lang === 'fr' ? 'Analyser mon match' : 'Analyze my match'}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onApply(bourse); }}
          disabled={applied}
          style={{
            padding: '8px 16px',
            background: applied ? c.ink3 : 'transparent',
            border: `1px solid ${c.rule}`,
            color: applied ? c.paper : c.ink,
            fontSize: 11,
            fontWeight: 600,
            cursor: applied ? 'default' : 'pointer',
            fontFamily: c.fMono,
            letterSpacing: '0.05em'
          }}
        >
          {applied ? '✓ ' + (lang === 'fr' ? 'Ajoutée' : 'Added') : '+ ' + (lang === 'fr' ? 'Postuler' : 'Apply')}
        </button>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DETAILED MATCH ANALYSIS PANEL
═══════════════════════════════════════════════════════════════════════════ */
function MatchAnalysisPanel({ bourse, user, onClose, onSave, onPrepare, c, lang }) {
  const matchLevel = getMatchLevel(bourse.matchScore);
  const matchColor = getMatchColor(bourse.matchScore);
  
  // Mock criteria breakdown - In production, this comes from backend analysis
  const criteria = [
    { name: lang === 'fr' ? "Niveau d'étude" : 'Study level', score: 75, maxScore: 100, strength: true },
    { name: lang === 'fr' ? 'Domaine' : 'Field', score: 90, maxScore: 100, strength: true },
    { name: lang === 'fr' ? 'Expérience' : 'Experience', score: 45, maxScore: 100, strength: false },
    { name: lang === 'fr' ? 'Langues' : 'Languages', score: 60, maxScore: 100, strength: false }
  ];

  const improvements = [
    { action: lang === 'fr' ? 'Améliorez votre niveau de langue' : 'Improve your language level', 
      tip: lang === 'fr' ? 'Préparez un certificat IELTS ou TOEFL' : 'Prepare an IELTS or TOEFL certificate' },
    { action: lang === 'fr' ? 'Ajoutez des projets académiques' : 'Add academic projects',
      tip: lang === 'fr' ? 'Mettez en avant vos travaux de recherche' : 'Highlight your research work' },
    { action: lang === 'fr' ? 'Renforcez votre expérience' : 'Gain research experience',
      tip: lang === 'fr' ? 'Participez à des conférences ou stages' : 'Participate in conferences or internships' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 500,
      maxWidth: '90vw',
      background: c.surface,
      zIndex: 1000,
      boxShadow: '-2px 0 12px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '20px', 
        borderBottom: `1px solid ${c.rule}`,
        background: getMatchGradient(bourse.matchScore),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: 11, color: c.ink3, marginBottom: 4 }}>{lang === 'fr' ? 'Analyse détaillée' : 'Detailed analysis'}</div>
          <h2 style={{ fontFamily: c.fSerif, fontSize: 20, fontWeight: 700, margin: 0, color: c.ink }}>
            {bourse.nom}
          </h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: c.ink3 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {/* Block 1 - Summary */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 64, fontWeight: 800, color: matchColor, fontFamily: c.fMono }}>
            {bourse.matchScore}%
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: matchColor, marginTop: 4 }}>
            {MATCH_LEVELS[matchLevel].label}
          </div>
          <p style={{ fontSize: 13, color: c.ink2, marginTop: 8 }}>
            {bourse.matchScore >= 60 
              ? (lang === 'fr' ? 'Bon match avec un fort potentiel de succès' : 'Good match with strong success potential')
              : bourse.matchScore >= 40
              ? (lang === 'fr' ? 'Match moyen avec potentiel damélioration' : 'Medium match with improvement potential')
              : (lang === 'fr' ? 'Match faible - des améliorations sont nécessaires' : 'Weak match - improvements needed')}
          </p>
        </div>

        {/* Block 2 - Criteria Breakdown */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: c.ink, marginBottom: 16 }}>
            📊 {lang === 'fr' ? 'Analyse par critère' : 'Criteria breakdown'}
          </h3>
          {criteria.map(criterion => (
            <div key={criterion.name} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: c.ink2 }}>{criterion.name}</span>
                <span style={{ color: criterion.strength ? c.success : c.warn, fontWeight: 600 }}>
                  {criterion.score}/{criterion.maxScore}
                </span>
              </div>
              <div style={{ height: 6, background: c.ruleSoft, overflow: 'hidden' }}>
                <div style={{ 
                  width: `${(criterion.score / criterion.maxScore) * 100}%`, 
                  height: '100%', 
                  background: criterion.strength ? c.success : c.warn,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Block 3 - Strengths & Weaknesses */}
        <div style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: c.success, marginBottom: 8 }}>
              ✓ {lang === 'fr' ? 'Points forts' : 'Strengths'}
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: c.ink2 }}>
              <li>{lang === 'fr' ? 'Votre domaine correspond parfaitement' : 'Your field matches perfectly'}</li>
              <li>{lang === 'fr' ? 'Niveau détudes compatible' : 'Study level compatible'}</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: c.warn, marginBottom: 8 }}>
              ⚠ {lang === 'fr' ? 'Points à améliorer' : 'Weaknesses'}
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: c.ink2 }}>
              <li>{lang === 'fr' ? 'Expérience insuffisante' : 'Insufficient experience'}</li>
              <li>{lang === 'fr' ? 'Certification de langue requise' : 'Language certification required'}</li>
            </ul>
          </div>
        </div>

        {/* Block 4 - Improvement Plan (HIGH VALUE) */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: c.ink, marginBottom: 16 }}>
            🚀 {lang === 'fr' ? "Plan d'amélioration" : 'Improvement plan'}
          </h3>
          {improvements.map((imp, idx) => (
            <div key={idx} style={{ 
              marginBottom: 12, 
              padding: 12, 
              background: c.paper2, 
              borderLeft: `3px solid ${c.accent}`,
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.ink, marginBottom: 4 }}>
                {imp.action}
              </div>
              <div style={{ fontSize: 11, color: c.ink3 }}>
                💡 {imp.tip}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '20px', borderTop: `1px solid ${c.rule}`, display: 'flex', gap: 12 }}>
        <button 
          onClick={() => onSave(bourse)}
          style={{
            flex: 1,
            padding: '10px',
            background: 'transparent',
            border: `1px solid ${c.rule}`,
            color: c.ink,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: c.fMono
          }}
        >
          💾 {lang === 'fr' ? 'Sauvegarder' : 'Save'}
        </button>
        <button 
          onClick={() => onPrepare(bourse)}
          style={{
            flex: 1,
            padding: '10px',
            background: c.accent,
            border: 'none',
            color: c.paper,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: c.fMono
          }}
        >
          📝 {lang === 'fr' ? 'Préparer ma candidature' : 'Prepare application'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPARISON VIEW MODE
═══════════════════════════════════════════════════════════════════════════ */
function ComparisonView({ selectedScholarships, onRemove, onClose, c, lang }) {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90vw',
      maxWidth: 1200,
      maxHeight: '80vh',
      background: c.surface,
      zIndex: 1000,
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
          {lang === 'fr' ? 'Comparaison des bourses' : 'Scholarship comparison'} ({selectedScholarships.length})
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'grid', gridTemplateColumns: `repeat(${Math.min(selectedScholarships.length, 3)}, 1fr)`, gap: 20 }}>
        {selectedScholarships.map(scholarship => (
          <div key={scholarship.id} style={{ border: `1px solid ${c.rule}`, padding: 16, position: 'relative' }}>
            <button 
              onClick={() => onRemove(scholarship.id)}
              style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: c.ink3 }}
            >
              ✕
            </button>
            <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{scholarship.nom}</h4>
            <div style={{ fontSize: 32, fontWeight: 800, color: getMatchColor(scholarship.matchScore), marginBottom: 12 }}>
              {scholarship.matchScore}%
            </div>
            <div style={{ fontSize: 11, color: c.ink2 }}>
              <div>📍 {scholarship.pays}</div>
              <div>🎓 {scholarship.niveau}</div>
              <div>💰 {scholarship.financement}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
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
  const [error, setError] = useState(null);
  const [scholarships, setScholarships] = useState([]);
  const [starredNoms, setStarredNoms] = useState(new Set());
  const [appliedNoms, setAppliedNoms] = useState(new Set());
  const [filters, setFilters] = useState({ matchLevel: null, intent: null, country: null, studyLevel: null, field: null });
  const [viewMode, setViewMode] = useState('matches'); // 'matches', 'all', 'compare'
  const [compareList, setCompareList] = useState([]);
  const [analyzingBourse, setAnalyzingBourse] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.paper }}>
        <div style={{ textAlign: 'center', padding: 48, background: c.surface, border: `1px solid ${c.rule}` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <h3 style={{ fontFamily: c.fSerif, fontSize: 20, marginBottom: 8 }}>{lang === 'fr' ? 'Connectez-vous' : 'Sign in'}</h3>
          <p style={{ color: c.ink2, marginBottom: 24 }}>{lang === 'fr' ? 'Pour voir vos recommandations personnalisées' : 'To see your personalized recommendations'}</p>
          <button onClick={() => setShowLoginModal(true)} style={{ padding: '10px 28px', background: c.accent, color: c.paper, border: 'none', cursor: 'pointer' }}>
            🔐 {lang === 'fr' ? 'Se connecter' : 'Sign in'}
          </button>
        </div>
      </div>
    );
  }

  // Load scholarships with match scoring
  const loadScholarships = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: userData } = await axiosInstance.get(`/api/users/${user.id}`, { params: { depth: 0 } });
      const { data: dataFav } = await axiosInstance.get('/api/favoris', { params: { 'where[user][equals]': user.id, limit: 1, depth: 0 } });
      const docFav = dataFav.docs?.[0];
      setStarredNoms(new Set((docFav?.bourses || []).map(b => b.nom?.trim().toLowerCase())));
      
      const { data: dataRoadmap } = await axiosInstance.get(API_ROUTES.roadmap.list, { params: { 'where[userId][equals]': user.id, limit: 100, depth: 0 } });
      setAppliedNoms(new Set((dataRoadmap.docs || []).map(b => b.nom?.trim().toLowerCase())));
      
      const { data: dataBourses } = await axiosInstance.get(API_ROUTES.bourses.list, { params: { limit: 200, depth: 0 } });
      const bourses = dataBourses.docs || [];
      
      const profile = {
        niveau: (userData.niveau || user.niveau || '').toLowerCase().trim(),
        domaine: (userData.domaine || user.domaine || '').toLowerCase().trim(),
        pays: (userData.pays || user.pays || '').toLowerCase().trim()
      };
      
      const scored = bourses.map(b => calculateMatchScore(b, profile, lang));
      setScholarships(scored.filter(b => b.tunisienEligible !== 'non'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, lang]);

  const calculateMatchScore = (bourse, profile, lang) => {
    let score = 0;
    const strengths = [];
    const weaknesses = [];
    
    // Tunisian eligibility (30 points)
    if (bourse.tunisienEligible === 'oui') {
      score += 30;
      strengths.push(lang === 'fr' ? 'Ouverte aux Tunisiens' : 'Open to Tunisians');
    }
    
    // Study level match (25 points)
    const bNiveau = (bourse.niveau || '').toLowerCase();
    if (profile.niveau && bNiveau.includes(profile.niveau)) {
      score += 25;
      strengths.push(lang === 'fr' ? `Niveau ${bourse.niveau} correspond` : `Level ${bourse.niveau} matches`);
    } else if (bNiveau.includes('tous') || bNiveau === '') {
      score += 12;
      strengths.push(lang === 'fr' ? 'Tous niveaux acceptés' : 'All levels accepted');
    } else {
      weaknesses.push(lang === 'fr' ? `Niveau requis: ${bourse.niveau}` : `Required level: ${bourse.niveau}`);
    }
    
    // Field match (20 points)
    const bDomaine = (bourse.domaine || '').toLowerCase();
    if (profile.domaine && bDomaine.includes(profile.domaine)) {
      score += 20;
      strengths.push(lang === 'fr' ? `Domaine ${bourse.domaine} correspond` : `Field ${bourse.domaine} matches`);
    } else if (bDomaine.includes('tous') || bDomaine === '') {
      score += 10;
      strengths.push(lang === 'fr' ? 'Tous domaines acceptés' : 'All fields accepted');
    } else {
      weaknesses.push(lang === 'fr' ? `Domaine requis: ${bourse.domaine}` : `Required field: ${bourse.domaine}`);
    }
    
    // Status bonus (15 points max)
    if (bourse.statut === 'active') {
      score += 15;
      strengths.push(lang === 'fr' ? 'Candidatures ouvertes' : 'Applications open');
    } else if (bourse.statut === 'a_venir') {
      score += 8;
      strengths.push(lang === 'fr' ? 'Bientôt disponible' : 'Coming soon');
    }
    
    // Deadline urgency
    if (bourse.dateLimite) {
      const daysLeft = Math.floor((new Date(bourse.dateLimite) - new Date()) / 86400000);
      if (daysLeft > 30) score += 3;
      else if (daysLeft > 7) score += 6;
      else if (daysLeft > 0) score += 10;
    }
    
    // Country match bonus
    const bPays = (bourse.pays || '').toLowerCase();
    if (profile.pays && bPays.includes(profile.pays)) score += 2;
    
    // Generate explanation
    const explanation = strengths.length > 0 
      ? `${lang === 'fr' ? 'Recommandé car' : 'Recommended because'} ${strengths.slice(0, 2).join(', ')}`
      : lang === 'fr' ? 'Vérifiez les critères déligibilité' : 'Check eligibility criteria';
    
    return { ...bourse, matchScore: Math.min(score, 100), matchExplanation: explanation, strengths, weaknesses, gaps: weaknesses };
  };

  const handleStar = async (bourse, isStarred) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id) return;
    try {
      const { data } = await axiosInstance.get('/api/favoris', { params: { 'where[user][equals]': user.id, limit: 1, depth: 0 } });
      const doc = data.docs?.[0];
      if (isStarred) {
        await axiosInstance.patch(`/api/favoris/${doc.id}`, { bourses: (doc.bourses || []).filter(b => b.nom?.trim().toLowerCase() !== nomKey) });
        setStarredNoms(prev => { const s = new Set(prev); s.delete(nomKey); return s; });
      } else {
        const nb = { nom: bourse.nom, pays: bourse.pays || '', lienOfficiel: bourse.lienOfficiel || '', financement: bourse.financement || '', dateLimite: bourse.dateLimite || null, ajouteLe: new Date().toISOString() };
        if (doc?.id) await axiosInstance.patch(`/api/favoris/${doc.id}`, { bourses: [...(doc.bourses || []), nb] });
        else await axiosInstance.post('/api/favoris', { user: user.id, userEmail: user.email || '', bourses: [nb] });
        setStarredNoms(prev => new Set([...prev, nomKey]));
      }
    } catch (err) { console.error(err); }
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
      setTimeout(() => setView?.('roadmap'), 1000);
    } catch (err) { console.error(err); }
  };

  // Filter and sort scholarships
  const filteredScholarships = useMemo(() => {
    let filtered = [...scholarships];
    
    if (filters.matchLevel) {
      filtered = filtered.filter(s => getMatchLevel(s.matchScore) === filters.matchLevel);
    }
    
    if (filters.country) {
      filtered = filtered.filter(s => s.pays === filters.country);
    }
    
    if (filters.studyLevel) {
      filtered = filtered.filter(s => s.niveau === filters.studyLevel);
    }
    
    if (filters.field) {
      filtered = filtered.filter(s => s.domaine === filters.field);
    }
    
    // Intent-based filtering
    if (filters.intent === 'maximize') {
      filtered = filtered.filter(s => s.matchScore >= 70);
    } else if (filters.intent === 'realistic') {
      filtered = filtered.filter(s => s.matchScore >= 40 && s.matchScore < 70);
    } else if (filters.intent === 'ambitious') {
      filtered = filtered.filter(s => s.matchScore < 40);
    }
    
    // Sort by match score descending (default)
    filtered.sort((a, b) => b.matchScore - a.matchScore);
    
    return filtered;
  }, [scholarships, filters]);

  const groupedScholarships = useMemo(() => {
    return {
      HIGH: filteredScholarships.filter(s => getMatchLevel(s.matchScore) === 'HIGH'),
      MEDIUM: filteredScholarships.filter(s => getMatchLevel(s.matchScore) === 'MEDIUM'),
      LOW: filteredScholarships.filter(s => getMatchLevel(s.matchScore) === 'LOW')
    };
  }, [filteredScholarships]);

  const scrollToTopMatches = () => {
    const element = document.getElementById('high-match-section');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAnalyzeMatch = (bourse) => {
    setAnalyzingBourse(bourse);
  };

  const toggleCompare = (bourse) => {
    if (compareList.find(s => s.id === bourse.id)) {
      setCompareList(compareList.filter(s => s.id !== bourse.id));
    } else if (compareList.length < 3) {
      setCompareList([...compareList, bourse]);
    }
  };

  useEffect(() => { loadScholarships(); }, [loadScholarships]);

  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px' }}>
        
        {/* Header */}
        <MatchHeader c={c} lang={lang} onScrollToTopMatches={scrollToTopMatches} />
        
        {/* Match Summary */}
        <MatchSummary scholarships={filteredScholarships} lang={lang} c={c} />
        
        {/* Filters */}
        <MatchFilters filters={filters} setFilters={setFilters} scholarships={scholarships} lang={lang} c={c} />
        
        {/* View Mode Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${c.rule}`, marginBottom: 24 }}>
          {[
            { id: 'matches', label: `${lang === 'fr' ? 'Meilleurs matches' : 'Best matches'} (${groupedScholarships.HIGH.length + groupedScholarships.MEDIUM.length})` },
            { id: 'all', label: `${lang === 'fr' ? 'Toutes les opportunités' : 'All opportunities'} (${filteredScholarships.length})` },
            { id: 'compare', label: `${lang === 'fr' ? 'Comparer' : 'Compare'} (${compareList.length}/3)` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: 'none',
                color: viewMode === tab.id ? c.accent : c.ink2,
                fontSize: 13,
                fontWeight: viewMode === tab.id ? 600 : 400,
                cursor: 'pointer',
                borderBottom: viewMode === tab.id ? `2px solid ${c.accent}` : '2px solid transparent',
                fontFamily: c.fMono
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${c.ruleSoft}`, borderTopColor: c.accent, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p style={{ color: c.ink2, marginTop: 16 }}>{lang === 'fr' ? 'Analyse en cours...' : 'Analyzing...'}</p>
          </div>
        )}
        
        {/* Content */}
        {!loading && viewMode !== 'compare' && (
          <>
            {viewMode === 'matches' ? (
              <>
                {groupedScholarships.HIGH.length > 0 && (
                  <div id="high-match-section">
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: MATCH_LEVELS.HIGH.color, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>🏆</span> {MATCH_LEVELS.HIGH.label} ({groupedScholarships.HIGH.length})
                    </h2>
                    {groupedScholarships.HIGH.map(s => (
                      <MatchScholarshipCard
                        key={s.id}
                        bourse={s}
                        user={user}
                        onAnalyze={handleAnalyzeMatch}
                        onClick={() => setSelected(s)}
                        starred={starredNoms.has(s.nom?.trim().toLowerCase())}
                        onStar={handleStar}
                        applied={appliedNoms.has(s.nom?.trim().toLowerCase())}
                        onApply={handleApply}
                        c={c}
                        lang={lang}
                      />
                    ))}
                  </div>
                )}
                {groupedScholarships.MEDIUM.length > 0 && (
                  <div style={{ marginTop: 32 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: MATCH_LEVELS.MEDIUM.color, marginBottom: 16 }}>
                      📈 {MATCH_LEVELS.MEDIUM.label} ({groupedScholarships.MEDIUM.length})
                    </h2>
                    {groupedScholarships.MEDIUM.map(s => (
                      <MatchScholarshipCard key={s.id} bourse={s} user={user} onAnalyze={handleAnalyzeMatch} onClick={() => setSelected(s)} starred={starredNoms.has(s.nom?.trim().toLowerCase())} onStar={handleStar} applied={appliedNoms.has(s.nom?.trim().toLowerCase())} onApply={handleApply} c={c} lang={lang} />
                    ))}
                  </div>
                )}
                {groupedScholarships.LOW.length > 0 && (
                  <div style={{ marginTop: 32 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: MATCH_LEVELS.LOW.color, marginBottom: 16 }}>
                      🎯 {MATCH_LEVELS.LOW.label} ({groupedScholarships.LOW.length})
                    </h2>
                    {groupedScholarships.LOW.map(s => (
                      <MatchScholarshipCard key={s.id} bourse={s} user={user} onAnalyze={handleAnalyzeMatch} onClick={() => setSelected(s)} starred={starredNoms.has(s.nom?.trim().toLowerCase())} onStar={handleStar} applied={appliedNoms.has(s.nom?.trim().toLowerCase())} onApply={handleApply} c={c} lang={lang} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              filteredScholarships.map(s => (
                <MatchScholarshipCard key={s.id} bourse={s} user={user} onAnalyze={handleAnalyzeMatch} onClick={() => setSelected(s)} starred={starredNoms.has(s.nom?.trim().toLowerCase())} onStar={handleStar} applied={appliedNoms.has(s.nom?.trim().toLowerCase())} onApply={handleApply} c={c} lang={lang} />
              ))
            )}
          </>
        )}
        
        {viewMode === 'compare' && compareList.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compareList.length}, 1fr)`, gap: 20 }}>
            {compareList.map(s => (
              <MatchScholarshipCard key={s.id} bourse={s} user={user} onAnalyze={handleAnalyzeMatch} onClick={() => setSelected(s)} starred={starredNoms.has(s.nom?.trim().toLowerCase())} onStar={handleStar} applied={appliedNoms.has(s.nom?.trim().toLowerCase())} onApply={handleApply} c={c} lang={lang} />
            ))}
          </div>
        )}
      </div>
      
      {/* Drawers */}
      {selected && (
        <BourseDrawer
          bourse={selected}
          onClose={() => setSelected(null)}
          onAskAI={(b) => handleAnalyzeMatch(b)}
          starred={starredNoms.has(selected.nom?.trim().toLowerCase())}
          onStar={handleStar}
          applied={appliedNoms.has(selected.nom?.trim().toLowerCase())}
          onApply={handleApply}
          user={user}
        />
      )}
      
      {analyzingBourse && (
        <MatchAnalysisPanel
          bourse={analyzingBourse}
          user={user}
          onClose={() => setAnalyzingBourse(null)}
          onSave={handleStar}
          onPrepare={handleApply}
          c={c}
          lang={lang}
        />
      )}
      
      {showComparison && (
        <ComparisonView
          selectedScholarships={compareList}
          onRemove={(id) => setCompareList(compareList.filter(s => s.id !== id))}
          onClose={() => setShowComparison(false)}
          c={c}
          lang={lang}
        />
      )}
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}