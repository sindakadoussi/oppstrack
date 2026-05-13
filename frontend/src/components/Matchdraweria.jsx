// components/MatchDrawerIA.jsx — version avec recherche vectorielle + analyse détaillée
import React, { useState, useEffect } from 'react';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';

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

const scoreColor = (s) =>
  s >= 85 ? '#16a34a' : s >= 70 ? '#2563eb' : s >= 55 ? '#d97706' : s >= 40 ? '#f97316' : '#ef4444';

const scoreLabel = (s) =>
  s >= 90 ? '🏆 Match Parfait' :
  s >= 75 ? '⭐ Excellent' :
  s >= 60 ? '👍 Bon' :
  s >= 45 ? '📝 Acceptable' :
  s >= 30 ? '⚠️ Faible' : '❌ Non recommandé';

export default function MatchDrawerIA({ bourse, user, onBack }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [tab, setTab] = useState('score');
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
    const getNavbarHeight = () => {
      const navbar = document.querySelector('.ot-nav');
      if (!navbar) return 0;
      const transform = getComputedStyle(navbar).transform;
      const isHidden = transform !== 'none' && transform !== 'matrix(1, 0, 0, 1, 0, 0)';
      return isHidden ? 0 : navbar.offsetHeight;
    };

    const updateHeight = () => setNavbarHeight(getNavbarHeight());
    updateHeight();

    window.addEventListener('scroll', updateHeight);
    const navbar = document.querySelector('.ot-nav');
    if (navbar) {
      const observer = new MutationObserver(updateHeight);
      observer.observe(navbar, { attributes: true });
      return () => {
        observer.disconnect();
        window.removeEventListener('scroll', updateHeight);
      };
    }

    return () => window.removeEventListener('scroll', updateHeight);
  }, []);

  const t = {
    title: lang === 'fr' ? 'Analyse — Scoring Avancé' : 'Analysis — Advanced Scoring',
    tabs: {
      score: lang === 'fr' ? 'Score' : 'Score',
      breakdown: lang === 'fr' ? 'Détail' : 'Breakdown',
      reasons: lang === 'fr' ? 'Critères' : 'Criteria',
      plan: lang === 'fr' ? 'Plan' : 'Plan',
    },
    loadingTitle: lang === 'fr' ? 'Calcul du score de match' : 'Calculating match score',
    loadingSub: lang === 'fr' ? 'Analyse expérience, certifications, éligibilité...' : 'Analyzing experience, certifications, eligibility...',
    errorTitle: lang === 'fr' ? 'Erreur du calcul' : 'Calculation error',
    errorHint: lang === 'fr' ? 'Vérifiez que le backend est actif sur localhost:3000' : 'Check that backend is running on localhost:3000',
    scoreBreakdown: lang === 'fr' ? 'Décomposition du score' : 'Score breakdown',
    eligibility: lang === 'fr' ? 'Éligibilité' : 'Eligibility',
    experience: lang === 'fr' ? 'Expérience' : 'Experience',
    certifications: lang === 'fr' ? 'Certifications' : 'Certifications',
    bonus: lang === 'fr' ? 'Bonus/Malus' : 'Bonus/Malus',
    hasLanguageTest: lang === 'fr' ? '✅ Test de langue' : '✅ Language test',
    noLanguageTest: lang === 'fr' ? '❌ Pas de test de langue' : '❌ No language test',
    weighting: lang === 'fr' ? '35% du score' : '35% of score',
    weighting25: lang === 'fr' ? '25% du score' : '25% of score',
  };

  useEffect(() => {
    if (!bourse?.id || !user?.id) {
      setError(lang === 'fr' ? 'Données manquantes' : 'Missing data');
      setLoading(false);
      return;
    }

    const runScoring = async () => {
      try {
        setLoading(true);
        setError(null);

        const userProfile = `${user.nom || ''} ${user.prenom || ''}, étudiant en ${user.formation || ''}, GPA ${user.gpa || 'N/A'}`;

        console.log('🔍 Recherche vectorielle...');
        
        // 1️⃣ ÉTAPE 1 : Recherche vectorielle
        const searchResponse = await fetch('http://localhost:3000/api/search-bourses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileText: userProfile,
            limit: 1,
          }),
        });

        if (!searchResponse.ok) {
          throw new Error(`Recherche échouée: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        console.log('✅ Résultats recherche:', searchData);

        if (!searchData.bourses || searchData.bourses.length === 0) {
          setError(lang === 'fr' ? 'Aucune correspondance trouvée' : 'No match found');
          setLoading(false);
          return;
        }

        const similarity = searchData.bourses[0].similarity;

console.log('🔍 Récupération des critères de la bourse...');

const criteriaResponse = await fetch('http://localhost:3000/api/get-bourse-criteria', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bourseId: bourse.id }),
});

const criteriaData = await criteriaResponse.json();
console.log('✅ Critères reçus:', criteriaData.criteria);



        // 2️⃣ ÉTAPE 2 : Analyse détaillée du match
        console.log('🔍 Analyse détaillée du match...');
        
        const analyzeResponse = await fetch('http://localhost:3000/api/analyze-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: {
              nom: user.nom || 'N/A',
              prenom: user.prenom || 'N/A',
              formation: user.formation || 'N/A',  
              gpa: user.gpa,
              hasLanguageTest: user.hasLanguageTest,
              experienceMonths: user.experienceMonths || 0,
              certifications: user.certifications,
            },
            bourse: {
              id: bourse.id,
              nom: bourse.nom,
              niveau: bourse.niveau,
              langue: bourse.langue,
            },
            criteria: criteriaData.criteria, 
            similarity: similarity,
          }),
        });

        if (!analyzeResponse.ok) {
          throw new Error(`Analyse échouée: ${analyzeResponse.status}`);
        }

        const analyzeData = await analyzeResponse.json();
        console.log('✅ Analyse reçue:', analyzeData);

        const scoreData = {
          matchScore: analyzeData.scoreGlobal,
          breakdown: {
            eligibility: Math.round(analyzeData.scoreGlobal * 0.35),
            experience: Math.round(analyzeData.scoreGlobal * 0.35),
            certifications: Math.round(analyzeData.scoreGlobal * 0.25),
            bonus: 0,
          },
          hasLanguageTest: user.hasLanguageTest || false,
          pointsForts: analyzeData.pointsForts,
          pointsFaibles: analyzeData.pointsFaibles,
          planAmelioration: analyzeData.planAmelioration,
          recommendation: analyzeData.recommendation,
        };

        setScoreData(scoreData);
      } catch (err) {
        console.error('❌ Erreur:', err);
        setError(
          err.message.includes('Failed to fetch')
            ? lang === 'fr' ? 'Impossible de se connecter au serveur' : 'Cannot connect to server'
            : err.message || (lang === 'fr' ? 'Erreur de connexion' : 'Connection error')
        );
      } finally {
        setLoading(false);
      }
    };

    runScoring();
  }, [bourse?.id, user?.id, lang]);

  const handleOverlayClick = () => {
    if (onBack) onBack();
  };

  const sc = scoreData ? scoreColor(scoreData.matchScore) : c.accent;
  const label = scoreData ? scoreLabel(scoreData.matchScore) : '';

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleOverlayClick}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 900,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: navbarHeight,
          right: 0,
          bottom: 0,
          zIndex: 901,
          width: 520,
          maxWidth: '95vw',
          background: c.surface,
          borderLeft: `1px solid ${c.rule}`,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.25s ease',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.ruleSoft}`, background: c.paper2, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: scoreData ? 12 : 0 }}>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: `1px solid ${c.rule}`,
                color: c.ink,
                width: 34,
                height: 34,
                cursor: 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              ←
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: c.fMono, fontSize: 11, fontWeight: 700, color: c.accent, letterSpacing: '0.05em' }}>
                {t.title}
              </div>
              <div style={{ fontSize: 12, color: c.ink2, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {bourse?.nom}
              </div>
            </div>

            {scoreData && (
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: sc, lineHeight: 1 }}>
                  {scoreData.matchScore}%
                </div>
                <div style={{ fontSize: 8, color: c.ink3, letterSpacing: '0.02em', marginTop: 2 }}>
                  {label}
                </div>
              </div>
            )}
          </div>

          {scoreData && (
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'score', label: t.tabs.score },
                { id: 'breakdown', label: t.tabs.breakdown },
                { id: 'reasons', label: t.tabs.reasons },
                { id: 'plan', label: t.tabs.plan },
              ].map((tabItem) => (
                <button
                  key={tabItem.id}
                  onClick={() => setTab(tabItem.id)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: tab === tabItem.id ? 700 : 500,
                    background: tab === tabItem.id ? c.accent + '20' : 'transparent',
                    color: tab === tabItem.id ? c.accent : c.ink2,
                    fontFamily: c.fMono,
                    letterSpacing: '0.03em',
                    transition: 'all 0.15s',
                  }}
                >
                  {tabItem.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
              <div style={{ width: 44, height: 44, border: `3px solid ${c.ruleSoft}`, borderTopColor: c.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: 13, color: c.ink2, textAlign: 'center' }}>
                {t.loadingTitle}
                <br />
                <span style={{ fontSize: 11, color: c.ink3 }}>{t.loadingSub}</span>
              </div>
            </div>
          )}

          {error && !loading && (
            <div style={{ padding: 20, background: '#fef2f2', border: '1px solid #fecaca', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>{t.errorTitle}</div>
              <div style={{ fontSize: 12, color: c.ink2, marginTop: 4 }}>{error}</div>
              <div style={{ fontSize: 11, color: c.ink3, marginTop: 8 }}>{t.errorHint}</div>
            </div>
          )}

          {scoreData && !loading && (
            <>
              {/* Tab Score */}
              {tab === 'score' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px', background: c.paper2, border: `1px solid ${c.ruleSoft}` }}>
                    <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
                      <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke={c.ruleSoft} strokeWidth="8" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke={sc} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${scoreData.matchScore * 2.638} 263.8`} transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 1s ease' }} />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: sc, lineHeight: 1 }}>{scoreData.matchScore}%</span>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: c.ink, marginBottom: 8 }}>{label}</div>
                      <div style={{ fontSize: 13, color: c.ink2, lineHeight: 1.6 }}>
                        {scoreData.matchScore >= 85 ? lang === 'fr' ? 'Match parfait ! Vous correspondez excellemment à cette bourse.' : 'Perfect match!' : scoreData.matchScore >= 60 ? lang === 'fr' ? 'Bon profil pour cette bourse.' : 'Good profile!' : lang === 'fr' ? 'Améliorez votre profil avant de postuler.' : 'Improve before applying.'}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', background: scoreData.hasLanguageTest ? '#f0fdf4' : '#fef2f2', border: `1px solid ${scoreData.hasLanguageTest ? '#bbf7d0' : '#fecaca'}`, borderRadius: 4 }}>
                    <div style={{ fontSize: 13, color: scoreData.hasLanguageTest ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                      {scoreData.hasLanguageTest ? t.hasLanguageTest : t.noLanguageTest}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Breakdown */}
              {tab === 'breakdown' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 11, color: c.ink3, marginBottom: 4 }}>Décomposition</div>
                  {[
                    { label: t.eligibility, value: scoreData.breakdown.eligibility, max: 35 },
                    { label: t.experience, value: scoreData.breakdown.experience, max: 35 },
                    { label: t.certifications, value: scoreData.breakdown.certifications, max: 25 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: c.ink, marginBottom: 6 }}>
                        {item.label} — {item.value}/{item.max}
                      </div>
                      <div style={{ height: 8, background: c.ruleSoft, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(item.value / item.max) * 100}%`, background: scoreColor(item.value), transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab Criteria */}
              {tab === 'reasons' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>
                      ✅ {lang === 'fr' ? 'Points forts' : 'Strengths'} ({scoreData.pointsForts.length})
                    </div>
                    {scoreData.pointsForts.map((point, i) => (
                      <div key={i} style={{ padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, fontSize: 12, color: '#15803d', marginBottom: 8 }}>
                        {point.description}
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>
                      ⚠️ {lang === 'fr' ? 'Points à améliorer' : 'Areas to improve'} ({scoreData.pointsFaibles.length})
                    </div>
                    {scoreData.pointsFaibles.map((point, i) => (
                      <div key={i} style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, fontSize: 12, color: '#b91c1c', marginBottom: 8 }}>
                        {point.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Plan */}
              {tab === 'plan' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 11, color: c.ink3, marginBottom: 8, fontWeight: 600 }}>
                    {lang === 'fr' ? 'Plan d\'amélioration' : 'Improvement plan'} ({scoreData.planAmelioration.length})
                  </div>
                  {scoreData.planAmelioration.map((plan, i) => (
                    <div key={i} style={{ padding: '14px', background: c.paper2, border: `1px solid ${c.ruleSoft}`, borderRadius: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: c.accent, marginBottom: 6 }}>
                        🎯 {plan.action}
                      </div>
                      <div style={{ fontSize: 12, color: c.ink, marginBottom: 4 }}>
                        {plan.details}
                      </div>
                      <div style={{ fontSize: 11, color: c.ink3, fontStyle: 'italic' }}>
                        ⏱️ {plan.timeline}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}