// GuidedTourPage.jsx — Page guidée interactive OppsTrack
"use client";

import React, { useState, useEffect } from 'react';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';

/* ═══════════════════════════════════════════════════════════════════
   TOKENS OppsTrack
═══════════════════════════════════════════════════════════════════ */
const tokens = (theme) => ({
  accent:      theme === "dark" ? "#4c9fd9" : "#0066b3",
  accentDark:  theme === "dark" ? "#3a8fc9" : "#004f8a",
  accentSoft:  theme === "dark" ? "rgba(76,159,217,0.10)" : "rgba(0,102,179,0.08)",
  paper:       theme === "dark" ? "#15140f" : "#faf8f3",
  paper2:      theme === "dark" ? "#1d1c16" : "#f2efe7",
  surface:     theme === "dark" ? "#1a1912" : "#ffffff",
  ink:         theme === "dark" ? "#f2efe7" : "#141414",
  ink2:        theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3:        theme === "dark" ? "#a19f96" : "#6b6b6b",
  ink4:        theme === "dark" ? "#6d6b64" : "#9a9794",
  rule:        theme === "dark" ? "#2b2a22" : "#d9d5cb",
  ruleSoft:    theme === "dark" ? "#24231c" : "#e8e4d9",
  success:     "#166534",
  warning:     "#b06a12",
  danger:      "#b4321f",
  fSerif: `"Libre Caslon Text", "Times New Roman", Georgia, serif`,
  fSans:  `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"JetBrains Mono", ui-monospace, Menlo, monospace`,
  tr: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
});

/* ═══════════════════════════════════════════════════════════════════
   STEPS DATA
═══════════════════════════════════════════════════════════════════ */
const STEPS = (lang) => [
  {
    id: 'welcome',
    num: '00',
    label: lang === 'fr' ? 'Bienvenue' : 'Welcome',
    title: lang === 'fr' ? 'Bienvenue sur OppsTrack' : 'Welcome to OppsTrack',
    titleEm: lang === 'fr' ? 'OppsTrack' : 'OppsTrack',
    subtitle: lang === 'fr'
      ? 'Votre plateforme intelligente pour découvrir, préparer et décrocher les meilleures bourses du monde.'
      : 'Your intelligent platform to discover, prepare and land the best scholarships worldwide.',
    icon: '🎓',
    illustration: 'welcome',
  },
  {
    id: 'profile',
    num: '01',
    label: lang === 'fr' ? 'Profil' : 'Profile',
    title: lang === 'fr' ? 'Commencez par votre profil' : 'Start with your profile',
    titleEm: lang === 'fr' ? 'profil' : 'profile',
    subtitle: lang === 'fr'
      ? 'Plus votre profil est complet, plus nos recommandations IA sont précises. Diplômes, langues, expériences, objectifs.'
      : 'The more complete your profile, the more accurate our AI recommendations. Degrees, languages, experiences, goals.',
    icon: '👤',
    illustration: 'profile',
    tips: lang === 'fr' ? [
      'Renseignez votre niveau académique actuel',
      'Ajoutez vos certifications de langues',
      'Décrivez vos expériences professionnelles',
      'Indiquez vos pays de destination préférés'
    ] : [
      'Fill in your current academic level',
      'Add your language certifications',
      'Describe your work experiences',
      'Indicate your preferred target countries'
    ],
  },
  {
    id: 'discover',
    num: '02',
    label: lang === 'fr' ? 'Découvrir' : 'Discover',
    title: lang === 'fr' ? 'Explorez les opportunités' : 'Explore opportunities',
    titleEm: lang === 'fr' ? 'opportunités' : 'opportunities',
    subtitle: lang === 'fr'
      ? 'Plus de 250 bourses entièrement financées dans le monde. Filtres avancés par pays, niveau, domaine et deadline.'
      : '250+ fully funded scholarships worldwide. Advanced filters by country, level, field and deadline.',
    icon: '🔍',
    illustration: 'discover',
    tips: lang === 'fr' ? [
      'Recherche par mots-clés ou pays',
      'Filtres : niveau, financement, deadline',
      'Sauvegardez vos favoris',
      'Bourses vérifiées à la source officielle'
    ] : [
      'Search by keywords or country',
      'Filters: level, funding, deadline',
      'Save your favorites',
      'Scholarships verified at the official source'
    ],
  },
  {
    id: 'match',
    num: '03',
    label: lang === 'fr' ? 'Match IA' : 'AI Match',
    title: lang === 'fr' ? "L'IA évalue votre compatibilité" : 'AI evaluates your fit',
    titleEm: lang === 'fr' ? 'compatibilité' : 'fit',
    subtitle: lang === 'fr'
      ? 'Pour chaque bourse, recevez un score de match détaillé, vos points forts, axes d\'amélioration et un plan d\'action personnalisé.'
      : 'For each scholarship, get a detailed match score, strengths, areas to improve and a personalized action plan.',
    icon: '◆',
    illustration: 'match',
    tips: lang === 'fr' ? [
      'Score de compatibilité 0-100%',
      'Analyse par critère (langue, niveau, GPA...)',
      'Points forts et points à améliorer',
      'Conseils IA personnalisés pour chaque bourse'
    ] : [
      'Compatibility score 0-100%',
      'Per-criterion analysis (language, level, GPA...)',
      'Strengths and improvement areas',
      'AI advice personalized for each scholarship'
    ],
  },
  {
    id: 'prepare',
    num: '04',
    label: lang === 'fr' ? 'Préparer' : 'Prepare',
    title: lang === 'fr' ? 'Préparez votre candidature' : 'Prepare your application',
    titleEm: lang === 'fr' ? 'candidature' : 'application',
    subtitle: lang === 'fr'
      ? 'CV optimisés par IA, lettres de motivation, simulateur d\'entretien avec analyse vocale, et bien plus.'
      : 'AI-optimized CVs, motivation letters, interview simulator with voice analysis, and much more.',
    icon: '📝',
    illustration: 'prepare',
    tips: lang === 'fr' ? [
      'Générateur de CV adapté à chaque bourse',
      'Aide à la rédaction de lettres de motivation',
      'Simulateur d\'entretien IA avec scoring',
      'Vérification des documents requis'
    ] : [
      'CV generator tailored to each scholarship',
      'Motivation letter writing assistance',
      'AI interview simulator with scoring',
      'Required documents verification'
    ],
  },
  {
    id: 'track',
    num: '05',
    label: lang === 'fr' ? 'Suivre' : 'Track',
    title: lang === 'fr' ? 'Suivez votre progression' : 'Track your progress',
    titleEm: lang === 'fr' ? 'progression' : 'progress',
    subtitle: lang === 'fr'
      ? 'Roadmap personnalisée, deadlines, alertes intelligentes et tableau de bord pour ne rien manquer.'
      : 'Personalized roadmap, deadlines, smart alerts and dashboard so you never miss anything.',
    icon: '📊',
    illustration: 'track',
    tips: lang === 'fr' ? [
      'Roadmap étape par étape pour chaque candidature',
      'Alertes automatiques pour les deadlines',
      'Dashboard avec progression et statistiques',
      'Suivi de tous vos dossiers en un seul endroit'
    ] : [
      'Step-by-step roadmap for each application',
      'Automatic deadline alerts',
      'Dashboard with progress and statistics',
      'Track all your applications in one place'
    ],
  },
  {
    id: 'ready',
    num: '06',
    label: lang === 'fr' ? 'Prêt !' : 'Ready!',
    title: lang === 'fr' ? 'Vous êtes prêt à commencer' : "You're ready to start",
    titleEm: lang === 'fr' ? 'prêt' : 'ready',
    subtitle: lang === 'fr'
      ? 'Vous connaissez maintenant tout ce qu\'OppsTrack peut vous offrir. Lancez-vous dans votre première candidature !'
      : 'You now know everything OppsTrack can offer. Launch your first application!',
    icon: '🚀',
    illustration: 'ready',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   ILLUSTRATION COMPONENTS — Visual mocks for each step
═══════════════════════════════════════════════════════════════════ */
function Illustration({ type, c, lang }) {
  if (type === 'welcome') {
    return (
      <div style={{ position: 'relative', height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Floating cards */}
        <div style={{
          position: 'absolute', top: 20, left: 20, width: 200,
          padding: '14px 16px', background: c.surface,
          border: `1px solid ${c.rule}`, transform: 'rotate(-3deg)',
          boxShadow: '0 8px 24px rgba(20,15,5,0.08)',
          animation: 'floatUp 3s ease-in-out infinite',
        }}>
          <div style={{ fontSize: 9, color: c.ink3, fontFamily: c.fMono, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
            🇩🇪 Germany
          </div>
          <div style={{ fontFamily: c.fSerif, fontSize: 15, fontWeight: 700, marginTop: 6, color: c.ink, lineHeight: 1.2 }}>
            DAAD Scholarship
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: c.ink3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Match</span>
            <span style={{ fontFamily: c.fMono, color: c.success, fontWeight: 800, fontSize: 13 }}>94%</span>
          </div>
          <div style={{ height: 3, background: c.ruleSoft, marginTop: 4 }}>
            <div style={{ height: '100%', width: '94%', background: c.success }} />
          </div>
        </div>

        <div style={{
          position: 'absolute', top: 110, right: 20, width: 220,
          padding: '14px 16px', background: c.surface,
          border: `1px solid ${c.rule}`, transform: 'rotate(2deg)',
          boxShadow: '0 8px 24px rgba(20,15,5,0.08)',
          animation: 'floatUp 3s ease-in-out infinite 1s',
        }}>
          <div style={{ fontSize: 9, color: c.accent, fontFamily: c.fMono, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
            ◆ AI Assistant
          </div>
          <div style={{ fontFamily: c.fSerif, fontSize: 13, color: c.ink2, marginTop: 8, lineHeight: 1.4, fontStyle: 'italic' }}>
            "Vous êtes éligible pour 12 bourses avec votre profil actuel."
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 30, left: 60, width: 180,
          padding: '12px 14px', background: c.surface,
          border: `1px solid ${c.rule}`,
          borderLeft: `3px solid ${c.danger}`,
          transform: 'rotate(-1.5deg)',
          boxShadow: '0 8px 24px rgba(20,15,5,0.08)',
          animation: 'floatUp 3s ease-in-out infinite 2s',
        }}>
          <div style={{ fontSize: 9, color: c.danger, fontFamily: c.fMono, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
            ⚡ Deadline
          </div>
          <div style={{ fontFamily: c.fSerif, fontSize: 14, fontWeight: 700, marginTop: 4, color: c.ink }}>
            Chevening
          </div>
          <div style={{ fontFamily: c.fMono, fontSize: 11, color: c.ink3, marginTop: 4 }}>
            J - 2 · 23 APR
          </div>
        </div>

        {/* Center badge */}
        <div style={{
          width: 140, height: 140, borderRadius: '50%',
          background: `linear-gradient(135deg, ${c.accent}, ${c.accentDark})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 12px 40px ${c.accent}50`,
          fontSize: 56,
          animation: 'pulse 2s ease-in-out infinite',
        }}>🎓</div>
      </div>
    );
  }

  if (type === 'profile') {
    const sections = lang === 'fr' ? ['Identité', 'Académique', 'Langues', 'Expérience'] : ['Identity', 'Academic', 'Languages', 'Experience'];
    return (
      <div style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: '28px', boxShadow: '0 16px 40px rgba(20,15,5,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 18, borderBottom: `1px solid ${c.ruleSoft}` }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: `linear-gradient(135deg, ${c.accent}, ${c.accentDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: c.fSerif, fontWeight: 700, fontSize: 22,
          }}>AB</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: c.fSerif, fontSize: 17, fontWeight: 700, color: c.ink }}>Amira Belkacem</div>
            <div style={{ fontFamily: c.fMono, fontSize: 11, color: c.ink3, letterSpacing: '0.06em' }}>Master · Computer Science · 3.8 GPA</div>
          </div>
          <div style={{
            padding: '6px 14px', background: c.success, color: '#fff',
            fontFamily: c.fMono, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
          }}>92%</div>
        </div>

        {sections.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 0', borderBottom: i < sections.length - 1 ? `1px solid ${c.ruleSoft}` : 'none',
            animation: `slideInLeft 0.5s ease ${i * 0.1}s both`,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: i < 3 ? c.success : c.warning,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 700,
            }}>{i < 3 ? '✓' : '!'}</div>
            <span style={{ flex: 1, fontFamily: c.fSans, fontSize: 14, color: c.ink, fontWeight: 600 }}>{s}</span>
            <div style={{ flex: 1, maxWidth: 100, height: 4, background: c.ruleSoft }}>
              <div style={{ height: '100%', width: `${i < 3 ? 100 : 60}%`, background: i < 3 ? c.success : c.warning, transition: 'width 1s ease' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'discover') {
    const scholarships = [
      { name: 'Erasmus+', country: '🇪🇺 EU', match: 89, color: c.success },
      { name: 'Fulbright', country: '🇺🇸 USA', match: 76, color: c.success },
      { name: 'Chevening', country: '🇬🇧 UK', match: 64, color: c.warning },
    ];
    return (
      <div style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: '24px', boxShadow: '0 16px 40px rgba(20,15,5,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: c.paper2, marginBottom: 16, border: `1px solid ${c.ruleSoft}` }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <span style={{ flex: 1, fontFamily: c.fSans, fontSize: 13, color: c.ink3 }}>
            {lang === 'fr' ? 'Rechercher une bourse...' : 'Search scholarships...'}
          </span>
          <span style={{ fontFamily: c.fMono, fontSize: 10, color: c.ink4 }}>250+</span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {(lang === 'fr' ? ['Master', 'PhD', 'Europe', 'Full funded'] : ['Master', 'PhD', 'Europe', 'Full funded']).map((f, i) => (
            <span key={i} style={{
              padding: '4px 10px', background: i === 0 ? c.accent : 'transparent',
              color: i === 0 ? '#fff' : c.ink3, fontFamily: c.fMono,
              fontSize: 10, fontWeight: 700, border: `1px solid ${i === 0 ? c.accent : c.rule}`,
              letterSpacing: '0.04em',
            }}>{f}</span>
          ))}
        </div>

        {scholarships.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', marginBottom: 8,
            background: c.paper2, border: `1px solid ${c.ruleSoft}`,
            animation: `fadeUp 0.5s ease ${i * 0.15}s both`,
          }}>
            <div style={{
              width: 44, height: 44, background: `${s.color}15`,
              border: `2px solid ${s.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: c.fSerif, lineHeight: 1 }}>{s.match}</div>
              <div style={{ fontSize: 7, color: s.color, fontFamily: c.fMono, fontWeight: 700 }}>MATCH</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: c.fSerif, fontSize: 14, fontWeight: 700, color: c.ink }}>{s.name}</div>
              <div style={{ fontFamily: c.fMono, fontSize: 10, color: c.ink3, letterSpacing: '0.06em', marginTop: 2 }}>{s.country}</div>
            </div>
            <span style={{ color: c.accent, fontSize: 16 }}>→</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'match') {
    return (
      <div style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: '28px', boxShadow: '0 16px 40px rgba(20,15,5,0.06)' }}>
        <div style={{
          textAlign: 'center', padding: '24px',
          background: `${c.success}10`, border: `2px solid ${c.success}30`,
          marginBottom: 20, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 80, height: 80, borderRadius: '50%',
            background: `${c.success}15`,
          }} />
          <div style={{
            fontSize: 56, fontWeight: 800, color: c.success,
            fontFamily: c.fSerif, lineHeight: 1, letterSpacing: '-0.04em',
            position: 'relative',
            animation: 'scoreCount 1s ease-out',
          }}>87<span style={{ fontSize: 24, opacity: 0.7 }}>%</span></div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: c.success,
            fontFamily: c.fMono, textTransform: 'uppercase', letterSpacing: '0.1em',
            marginTop: 6, position: 'relative',
          }}>◆ Excellent match</div>
        </div>

        {[
          { name: lang === 'fr' ? 'Niveau académique' : 'Academic level', pct: 95, color: c.success },
          { name: lang === 'fr' ? 'Langue (IELTS)' : 'Language (IELTS)', pct: 88, color: c.success },
          { name: lang === 'fr' ? 'Expérience' : 'Experience', pct: 72, color: c.success },
          { name: lang === 'fr' ? 'Lettres' : 'References', pct: 45, color: c.warning },
        ].map((cr, i) => (
          <div key={i} style={{ marginBottom: 12, animation: `slideInLeft 0.5s ease ${i * 0.12}s both` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: c.fSans, fontSize: 12, color: c.ink, fontWeight: 600 }}>{cr.name}</span>
              <span style={{ fontFamily: c.fMono, fontSize: 12, fontWeight: 700, color: cr.color }}>{cr.pct}%</span>
            </div>
            <div style={{ height: 5, background: c.ruleSoft, overflow: 'hidden' }}>
              <div style={{
                width: `${cr.pct}%`, height: '100%',
                background: `linear-gradient(90deg, ${cr.color}, ${cr.color}cc)`,
                transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: `0 0 8px ${cr.color}40`,
              }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'prepare') {
    const tools = lang === 'fr'
      ? [
          { icon: '📄', name: 'CV', status: 'Optimisé', color: c.success },
          { icon: '✉️', name: 'Lettre motivation', status: 'En cours', color: c.warning },
          { icon: '🎙️', name: 'Entretien IA', status: 'Score 82', color: c.success },
          { icon: '📎', name: 'Documents', status: '5/6 prêts', color: c.warning },
        ]
      : [
          { icon: '📄', name: 'CV', status: 'Optimized', color: c.success },
          { icon: '✉️', name: 'Motivation letter', status: 'In progress', color: c.warning },
          { icon: '🎙️', name: 'AI Interview', status: 'Score 82', color: c.success },
          { icon: '📎', name: 'Documents', status: '5/6 ready', color: c.warning },
        ];
    return (
      <div style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: '24px', boxShadow: '0 16px 40px rgba(20,15,5,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {tools.map((t, i) => (
            <div key={i} style={{
              padding: '20px 16px', background: c.paper2,
              border: `1px solid ${c.ruleSoft}`, borderTop: `3px solid ${t.color}`,
              animation: `fadeUp 0.5s ease ${i * 0.1}s both`,
            }}>
              <div style={{
                width: 44, height: 44, background: `${t.color}15`,
                border: `2px solid ${t.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: 12,
              }}>{t.icon}</div>
              <div style={{ fontFamily: c.fSerif, fontSize: 14, fontWeight: 700, color: c.ink, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontFamily: c.fMono, fontSize: 10, color: t.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.status}</div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 16, padding: '14px 18px',
          background: c.accentSoft, borderLeft: `3px solid ${c.accent}`,
        }}>
          <div style={{ fontFamily: c.fMono, fontSize: 10, color: c.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            ◆ {lang === 'fr' ? 'Conseil IA' : 'AI tip'}
          </div>
          <div style={{ fontFamily: c.fSerif, fontSize: 13, color: c.ink2, fontStyle: 'italic', lineHeight: 1.5 }}>
            {lang === 'fr' ? '"Renforcez votre lettre avec une expérience concrète."' : '"Strengthen your letter with a concrete experience."'}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'track') {
    const steps = lang === 'fr'
      ? ['Profil', 'CV envoyé', 'Lettres', 'Entretien', 'Décision']
      : ['Profile', 'CV sent', 'Letters', 'Interview', 'Decision'];
    return (
      <div style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: '28px', boxShadow: '0 16px 40px rgba(20,15,5,0.06)' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: c.fMono, fontSize: 10, color: c.accent, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            ◆ {lang === 'fr' ? 'Roadmap' : 'Roadmap'}
          </div>
          <div style={{ fontFamily: c.fSerif, fontSize: 16, fontWeight: 700, color: c.ink }}>Chevening 2026</div>
          <div style={{ fontFamily: c.fMono, fontSize: 11, color: c.ink3, marginTop: 4 }}>3/5 {lang === 'fr' ? 'étapes' : 'steps'} · J - 42</div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 11, top: 12, bottom: 12, width: 2, background: c.ruleSoft }} />
          {steps.map((s, i) => {
            const done = i < 3;
            const current = i === 3;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '8px 0', position: 'relative',
                animation: `slideInLeft 0.5s ease ${i * 0.12}s both`,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: done ? c.success : current ? c.accent : c.surface,
                  border: `2px solid ${done ? c.success : current ? c.accent : c.rule}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: done || current ? '#fff' : c.ink4,
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                  zIndex: 1, position: 'relative',
                  boxShadow: current ? `0 0 0 4px ${c.accent}30` : 'none',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{
                  fontFamily: c.fSans, fontSize: 13,
                  color: done ? c.ink3 : current ? c.ink : c.ink4,
                  fontWeight: current ? 700 : 500,
                  textDecoration: done ? 'line-through' : 'none',
                  flex: 1,
                }}>{s}</span>
                {current && (
                  <span style={{
                    fontFamily: c.fMono, fontSize: 9,
                    padding: '3px 8px', background: c.accent, color: '#fff',
                    fontWeight: 700, letterSpacing: '0.05em',
                  }}>{lang === 'fr' ? 'EN COURS' : 'CURRENT'}</span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${c.ruleSoft}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: c.fMono, fontSize: 10, color: c.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
              {lang === 'fr' ? 'Progression' : 'Progress'}
            </span>
            <span style={{ fontFamily: c.fMono, fontSize: 12, color: c.accent, fontWeight: 800 }}>60%</span>
          </div>
          <div style={{ height: 6, background: c.ruleSoft, overflow: 'hidden' }}>
            <div style={{
              width: '60%', height: '100%',
              background: `linear-gradient(90deg, ${c.accent}, ${c.accentDark})`,
              transition: 'width 1.5s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: `0 0 12px ${c.accent}60`,
            }} />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'ready') {
    return (
      <div style={{ position: 'relative', height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Confetti shapes */}
        {[
          { x: 10, y: 30, color: c.accent, size: 12, delay: 0 },
          { x: 85, y: 20, color: c.success, size: 14, delay: 0.2 },
          { x: 20, y: 70, color: c.warning, size: 10, delay: 0.4 },
          { x: 80, y: 75, color: c.accent, size: 16, delay: 0.6 },
          { x: 50, y: 15, color: c.danger, size: 8, delay: 0.8 },
          { x: 15, y: 50, color: c.success, size: 10, delay: 1 },
          { x: 90, y: 55, color: c.accent, size: 12, delay: 1.2 },
        ].map((d, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${d.x}%`, top: `${d.y}%`,
            width: d.size, height: d.size,
            background: d.color,
            animation: `confetti 2s ease-in-out infinite ${d.delay}s`,
          }} />
        ))}

        <div style={{
          width: 180, height: 180, borderRadius: '50%',
          background: `linear-gradient(135deg, ${c.accent}, ${c.accentDark})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 80,
          boxShadow: `0 16px 50px ${c.accent}60`,
          animation: 'pulse 2s ease-in-out infinite',
          position: 'relative',
          zIndex: 1,
        }}>🚀</div>
      </div>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function GuidesPage({ onComplete, onSkip, setView }) {
  const { lang } = useT?.() || { lang: 'fr' };
  const { theme } = useTheme?.() || { theme: 'light' };
  const c = tokens(theme);
  const steps = STEPS(lang);

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState('forward');
  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const next = () => {
    if (isLast) {
      onComplete?.() ?? setView?.('home');
      return;
    }
    setDirection('forward');
    setCurrentStep(s => s + 1);
  };

  const prev = () => {
    if (isFirst) return;
    setDirection('backward');
    setCurrentStep(s => s - 1);
  };

  const skip = () => {
    onSkip?.() ?? setView?.('home');
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentStep]);

  return (
    <div style={{
      minHeight: '100vh',
      background: c.paper,
      color: c.ink,
      fontFamily: c.fSans,
      display: 'flex', flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background gradient */}
      <div style={{
        position: 'absolute',
        top: -200, right: -200,
        width: 600, height: 600,
        background: `radial-gradient(circle, ${c.accent}06 0%, transparent 70%)`,
        pointerEvents: 'none',
        animation: 'floatSlow 10s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -200, left: -200,
        width: 500, height: 500,
        background: `radial-gradient(circle, ${c.success}05 0%, transparent 70%)`,
        pointerEvents: 'none',
        animation: 'floatSlow 12s ease-in-out infinite reverse',
      }} />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideOutLeft { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-30px); } }
        @keyframes slideOutRight { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(30px); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes floatUp {
          0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
          50% { transform: translateY(-12px) rotate(var(--r, 0deg)); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(40px, -40px); }
        }
        @keyframes scoreCount {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes confetti {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

    

      {/* ── Progress bar ── */}
      <div style={{ height: 3, background: c.ruleSoft, position: 'relative', zIndex: 2 }}>
        <div style={{
          width: `${progress}%`, height: '100%',
          background: `linear-gradient(90deg, ${c.accent}, ${c.accentDark})`,
          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 12px ${c.accent}60`,
        }} />
      </div>

      {/* ── Step indicators ── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 6,
        padding: '20px 32px 0',
        position: 'relative', zIndex: 2,
        flexWrap: 'wrap',
      }}>
        {steps.map((s, i) => {
          const done = i < currentStep;
          const current = i === currentStep;
          return (
            <button
              key={s.id}
              onClick={() => { setDirection(i > currentStep ? 'forward' : 'backward'); setCurrentStep(i); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px',
                background: current ? c.accentSoft : 'transparent',
                border: `1px solid ${current ? c.accent : 'transparent'}`,
                cursor: 'pointer',
                fontFamily: c.fMono, fontSize: 11,
                color: done ? c.success : current ? c.accent : c.ink4,
                fontWeight: current ? 700 : 500,
                letterSpacing: '0.05em',
                transition: c.tr,
              }}
            >
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: done ? c.success : current ? c.accent : 'transparent',
                border: `1.5px solid ${done ? c.success : current ? c.accent : c.rule}`,
                color: done || current ? '#fff' : c.ink4,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700,
              }}>
                {done ? '✓' : s.num}
              </span>
              <span style={{ display: 'none' }} className="step-label">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main content ── */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center',
        padding: '40px 32px',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 60,
          alignItems: 'center',
        }} className="step-grid">
          {/* LEFT: Text content */}
          <div
            key={`text-${currentStep}`}
            style={{
              animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '6px 14px',
              background: c.accentSoft,
              border: `1px solid ${c.accent}30`,
              fontFamily: c.fMono, fontSize: 11,
              color: c.accent, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              marginBottom: 24,
            }}>
              <span>◆</span>
              <span>§ {step.num} — {step.label}</span>
            </div>

            <h1 style={{
              fontFamily: c.fSerif,
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              color: c.ink,
              margin: '0 0 20px',
            }}>
              {step.title.split(step.titleEm).map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <em style={{ color: c.accent, fontStyle: 'italic' }}>{step.titleEm}</em>
                  )}
                </React.Fragment>
              ))}
            </h1>

            <p style={{
              fontFamily: c.fSans,
              fontSize: 17,
              color: c.ink2,
              lineHeight: 1.6,
              margin: '0 0 32px',
              maxWidth: 540,
            }}>
              {step.subtitle}
            </p>

            {step.tips && (
              <div style={{ marginBottom: 32 }}>
                <div style={{
                  fontFamily: c.fMono, fontSize: 10,
                  color: c.ink3, fontWeight: 700,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  marginBottom: 14,
                }}>
                  ◇ {lang === 'fr' ? 'Ce que vous pouvez faire' : 'What you can do'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {step.tips.map((tip, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '12px 16px',
                      background: c.surface,
                      border: `1px solid ${c.rule}`,
                      borderLeft: `3px solid ${c.accent}`,
                      animation: `slideInLeft 0.4s ease ${i * 0.08}s both`,
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: c.accentSoft,
                        color: c.accent,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: c.fMono, fontSize: 11, fontWeight: 700,
                        flexShrink: 0, marginTop: 1,
                      }}>{i + 1}</div>
                      <span style={{ fontFamily: c.fSans, fontSize: 14, color: c.ink2, lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step counter */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              fontFamily: c.fMono, fontSize: 11,
              color: c.ink3, letterSpacing: '0.12em',
              textTransform: 'uppercase', fontWeight: 600,
            }}>
              <span>{lang === 'fr' ? 'Étape' : 'Step'}</span>
              <span style={{ color: c.ink, fontSize: 16, fontWeight: 800, fontFamily: c.fSerif }}>
                {String(currentStep + 1).padStart(2, '0')}
              </span>
              <span style={{ color: c.ink4 }}>/</span>
              <span style={{ color: c.ink3 }}>{String(steps.length).padStart(2, '0')}</span>
            </div>
          </div>

          {/* RIGHT: Illustration */}
          <div
            key={`illu-${currentStep}`}
            style={{
              animation: direction === 'forward' ? 'slideInRight 0.5s cubic-bezier(0.4,0,0.2,1)' : 'slideInLeft 0.5s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <Illustration type={step.illustration} c={c} lang={lang} />
          </div>
        </div>
      </div>

      {/* ── Bottom navigation ── */}
      <div style={{
        padding: '24px 32px',
        borderTop: `1px solid ${c.rule}`,
        background: c.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 2,
      }}>
        <button
          onClick={prev}
          disabled={isFirst}
          style={{
            padding: '14px 26px',
            background: 'transparent',
            border: `1px solid ${c.rule}`,
            color: isFirst ? c.ink4 : c.ink,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: isFirst ? 'not-allowed' : 'pointer',
            fontFamily: c.fSans,
            display: 'inline-flex', alignItems: 'center', gap: 10,
            opacity: isFirst ? 0.4 : 1,
            transition: c.tr,
          }}
          onMouseEnter={e => { if (!isFirst) { e.currentTarget.style.background = c.paper2; } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          ← {lang === 'fr' ? 'Précédent' : 'Previous'}
        </button>

        <div style={{
          fontFamily: c.fMono, fontSize: 10,
          color: c.ink4, letterSpacing: '0.1em',
          textTransform: 'uppercase', display: 'flex', gap: 16,
        }}>
          <span>← →  {lang === 'fr' ? 'naviguer' : 'navigate'}</span>
          <span style={{ color: c.ink4 }}>·</span>
          <span>ESC  {lang === 'fr' ? 'passer' : 'skip'}</span>
        </div>

        <button
          onClick={next}
          style={{
            padding: '14px 32px',
            background: `linear-gradient(135deg, ${c.accent}, ${c.accentDark})`,
            border: 'none',
            color: '#fff',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: c.fSans,
            display: 'inline-flex', alignItems: 'center', gap: 12,
            boxShadow: `0 4px 16px ${c.accent}40`,
            transition: c.tr,
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${c.accent}60`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${c.accent}40`; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {isLast
            ? (lang === 'fr' ? 'Commencer →' : 'Get started →')
            : (lang === 'fr' ? 'Suivant' : 'Next')
          } {!isLast && '→'}
        </button>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .step-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}
