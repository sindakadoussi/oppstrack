// components/MatchDrawerIA.jsx — version style éditorial avec tokens et overlay
import React, { useState, useEffect } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar'; // pour les tokens

/* ═══════════════════════════════════════════════════════════════════════════
   TOKENS (identique à la homepage)
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
  fSerif: `"Libre Caslon Text", "Times New Roman", Georgia, serif`,
  fSans:  `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"JetBrains Mono", ui-monospace, Menlo, monospace`,
});

const WEBHOOK_ANALYSE = 'http://localhost:5678/webhook/analyse-match';

const scoreColor = (s) =>
  s >= 85 ? '#16a34a' : s >= 70 ? '#2563eb' : s >= 55 ? '#d97706' : s >= 40 ? '#f97316' : '#ef4444';

const statutColor = (s) =>
  s === 'fort' ? { bg:'#f0fdf4', border:'#bbf7d0', text:'#16a34a' }
  : s === 'moyen' ? { bg:'#fffbeb', border:'#fde68a', text:'#d97706' }
  : { bg:'#fef2f2', border:'#fecaca', text:'#ef4444' };

const prioriteColor = (p) =>
  p === 'haute'   ? { bg:'#fef2f2', border:'#fecaca', dot:'#ef4444' }
  : p === 'moyenne' ? { bg:'#fffbeb', border:'#fde68a', dot:'#d97706' }
  : { bg:'#f0fdf4', border:'#bbf7d0', dot:'#16a34a' };

export default function MatchDrawerIA({ bourse, user, onBack }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);

  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [analyse,  setAnalyse]  = useState(null);
  const [tab,      setTab]      = useState('apercu');

  const NAVBAR_HEIGHT = 70; // à ajuster selon la hauteur réelle de votre navbar

  const t = {
    title: lang === 'fr' ? 'Analyse IA — Logique du match' : 'AI Analysis — Match Logic',
    scoreLabel: lang === 'fr' ? 'score IA' : 'AI score',
    tabs: {
      apercu: lang === 'fr' ? 'Aperçu' : 'Overview',
      criteres: lang === 'fr' ? 'Critères' : 'Criteria',
      ameliorer: lang === 'fr' ? 'À améliorer' : 'To improve',
    },
    loadingTitle: lang === 'fr' ? "L'IA analyse votre profil complet" : 'AI is analyzing your complete profile',
    loadingSub: lang === 'fr' ? 'Expériences, compétences, projets...' : 'Experience, skills, projects...',
    errorTitle: lang === 'fr' ? 'Analyse indisponible' : 'Analysis unavailable',
    errorHint: lang === 'fr' ? 'Vérifiez que n8n est actif sur localhost:5678' : 'Check that n8n is running on localhost:5678',
    match: lang === 'fr' ? 'match' : 'match',
    strengths: lang === 'fr' ? '✅ Points forts' : '✅ Strengths',
    missingDocs: lang === 'fr' ? '📁 Documents à préparer' : '📁 Documents to prepare',
    adviceTitle: lang === 'fr' ? '💡 Conseil personnalisé' : '💡 Personalized advice',
    criteriaDesc: lang === 'fr' ? 'Analyse IA de chaque critère selon votre profil complet' : 'AI analysis of each criterion based on your complete profile',
    strong: lang === 'fr' ? 'Fort' : 'Strong',
    medium: lang === 'fr' ? 'Moyen' : 'Medium',
    weak: lang === 'fr' ? 'Faible' : 'Weak',
    improveDesc: lang === 'fr' ? 'Actions concrètes pour améliorer votre candidature' : 'Concrete actions to improve your application',
    problem: lang === 'fr' ? 'Problème' : 'Issue',
    action: lang === 'fr' ? '→ Action' : '→ Action',
    impact: lang === 'fr' ? 'Impact' : 'Impact',
    highPriority: lang === 'fr' ? 'Haute priorité' : 'High priority',
    mediumPriority: lang === 'fr' ? 'Priorité moyenne' : 'Medium priority',
    lowPriority: lang === 'fr' ? 'Basse priorité' : 'Low priority',
  };

  useEffect(() => {
    if (!bourse || !user) {
      setError(lang === 'fr' ? 'Données manquantes' : 'Missing data');
      setLoading(false);
      return;
    }
    const run = async () => {
      try {
        setLoading(true); setError(null);
        const res = await axiosInstance.post(WEBHOOK_ANALYSE, { user, bourse }, { timeout: 30000 });
        const data = res.data;
        if (data.success && data.analyse) {
          setAnalyse(data);
        } else {
          setError(data.error || (lang === 'fr' ? 'Réponse invalide' : 'Invalid response'));
        }
      } catch(e) {
        setError(e.message || (lang === 'fr' ? 'Erreur de connexion' : 'Connection error'));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [bourse?.nom, user?.id, lang]);

  const getStatutLabel = (statut) => {
    if (statut === 'fort') return t.strong;
    if (statut === 'moyen') return t.medium;
    return t.weak;
  };

  const getPrioriteLabel = (priorite) => {
    if (priorite === 'haute') return t.highPriority;
    if (priorite === 'moyenne') return t.mediumPriority;
    return t.lowPriority;
  };

  const sc = analyse ? scoreColor(analyse.scoreGlobal) : c.accent;

  // Fermeture via clic sur l'overlay
  const handleOverlayClick = () => {
    if (onBack) onBack();
  };

  return (
    <>
      {/* Overlay (fond sombre) */}
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

      {/* Drawer (commence sous la navbar) */}
      <div
        style={{
          position: 'fixed',
          top: NAVBAR_HEIGHT,
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
          boxShadow: '-8px 0 32px rgba(0,0,0,0.08)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.ruleSoft}`, background: c.paper2, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: analyse ? 12 : 0 }}>
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
                flexShrink: 0
              }}
            >
              ←
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: c.fMono, fontSize: 11, fontWeight: 700, color: c.accent, letterSpacing: '0.05em' }}>{t.title}</div>
              <div style={{ fontSize: 12, color: c.ink2, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bourse?.nom}</div>
            </div>
            {analyse && (
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: c.accent, lineHeight: 1 }}>{analyse.scoreGlobal}%</div>
                <div style={{ fontSize: 8, color: c.ink3, letterSpacing: '0.02em' }}>{t.scoreLabel}</div>
              </div>
            )}
          </div>

          {/* Tabs */}
          {analyse && (
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'apercu', label: t.tabs.apercu },
                { id: 'criteres', label: t.tabs.criteres },
                { id: 'ameliorer', label: t.tabs.ameliorer }
              ].map(tabItem => (
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
                    transition: 'all 0.15s'
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

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
              <div style={{ width: 44, height: 44, border: `3px solid ${c.ruleSoft}`, borderTopColor: c.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: 13, color: c.ink2, textAlign: 'center' }}>
                {t.loadingTitle}<br />
                <span style={{ fontSize: 11, color: c.ink3 }}>{t.loadingSub}</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{ padding: 20, background: '#fef2f2', border: '1px solid #fecaca', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>{t.errorTitle}</div>
              <div style={{ fontSize: 12, color: c.ink2, marginTop: 4 }}>{error}</div>
              <div style={{ fontSize: 11, color: c.ink3, marginTop: 8 }}>{t.errorHint}</div>
            </div>
          )}

          {/* Results */}
          {analyse && !loading && (
            <>
              {/* Tab Aperçu */}
              {tab === 'apercu' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Score ring + résumé */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: c.paper2, border: `1px solid ${c.ruleSoft}` }}>
                    <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
                      <svg width="90" height="90" viewBox="0 0 90 90">
                        <circle cx="45" cy="45" r="38" fill="none" stroke={c.ruleSoft} strokeWidth="8" />
                        <circle cx="45" cy="45" r="38" fill="none" stroke={sc} strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={`${analyse.scoreGlobal * 2.387} 238.7`} transform="rotate(-90 45 45)"
                          style={{ transition: 'stroke-dasharray 1s ease' }} />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 19, fontWeight: 800, color: sc, lineHeight: 1 }}>{analyse.scoreGlobal}%</span>
                        <span style={{ fontSize: 8, color: c.ink3, marginTop: 2 }}>{t.match}</span>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: c.fSerif, fontSize: 16, fontWeight: 700, color: c.ink, marginBottom: 4 }}>{analyse.niveauMatch}</div>
                      <div style={{ fontSize: 13, color: c.ink2, lineHeight: 1.5 }}>{analyse.resume}</div>
                    </div>
                  </div>

                  {/* Points forts */}
                  {analyse.pointsForts?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: c.accent, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{t.strengths}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {analyse.pointsForts.map((p, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: '#f0fdf4', borderLeft: `3px solid #16a34a` }}>
                            <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                            <span style={{ fontSize: 13, color: '#15803d' }}>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents manquants */}
                  {analyse.documentsManquants?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: c.accent, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{t.missingDocs}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {analyse.documentsManquants.map((d, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '3px 8px', background: '#fef2f2', border: `1px solid #fecaca`, color: '#b91c1c', fontFamily: c.fMono }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conseil personnalisé */}
                  {analyse.conseilPersonnalise && (
                    <div style={{ padding: '12px 14px', background: c.paper2, borderLeft: `3px solid ${c.accent}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: c.accent, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.adviceTitle}</div>
                      <div style={{ fontSize: 13, color: c.ink, lineHeight: 1.6 }}>{analyse.conseilPersonnalise}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Critères */}
              {tab === 'criteres' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 11, color: c.ink3, marginBottom: 4 }}>{t.criteriaDesc}</div>
                  {(analyse.criteres || []).map((cri, i) => {
                    const st = statutColor(cri.statut);
                    return (
                      <div key={i} style={{ border: `1px solid ${st.border}`, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: st.bg }}>
                          <span style={{ fontSize: 20 }}>{cri.icone}</span>
                          <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: c.ink }}>{cri.nom}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: scoreColor(cri.score) }}>{cri.score}%</div>
                            <span style={{ fontSize: 9, padding: '2px 8px', background: st.bg, border: `1px solid ${st.border}`, color: st.text, fontWeight: 600 }}>
                              {getStatutLabel(cri.statut)}
                            </span>
                          </div>
                        </div>
                        <div style={{ height: 4, background: c.ruleSoft }}>
                          <div style={{ height: '100%', width: `${cri.score}%`, background: scoreColor(cri.score), transition: 'width 0.8s ease' }} />
                        </div>
                        <div style={{ padding: '10px 14px', background: c.surface, fontSize: 12, color: c.ink2, lineHeight: 1.5 }}>
                          {cri.explication}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab À améliorer */}
              {tab === 'ameliorer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 11, color: c.ink3, marginBottom: 4 }}>{t.improveDesc}</div>
                  {(analyse.pointsAmeliorer || []).map((p, i) => {
                    const pr = prioriteColor(p.priorite);
                    const prLabel = getPrioriteLabel(p.priorite);
                    return (
                      <div key={i} style={{ border: `1px solid ${pr.border}`, overflow: 'hidden' }}>
                        <div style={{ padding: '10px 14px', background: pr.bg, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: pr.dot, flexShrink: 0 }} />
                          <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: c.ink }}>{p.domaine}</div>
                          <span style={{ fontSize: 9, color: pr.dot, fontWeight: 600 }}>{prLabel}</span>
                        </div>
                        <div style={{ padding: '12px 14px', background: c.surface, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontSize: 12, color: c.ink2 }}><strong style={{ color: c.ink }}>{t.problem} :</strong> {p.probleme}</div>
                          <div style={{ fontSize: 12, padding: '8px 12px', background: '#f0fdf4', borderLeft: `3px solid #16a34a`, color: '#15803d' }}>
                            <strong>{t.action} :</strong> {p.action}
                          </div>
                          {p.impact && (
                            <div style={{ fontSize: 11, color: c.ink3, fontStyle: 'italic' }}>{t.impact} : {p.impact}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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