// RecommandationsPage.jsx — 100% AI-powered
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axiosInstance from '@/config/axiosInstance';
import BourseDrawer from '../components/Boursedrawer';
import MatchDrawerIA from '../components/Matchdraweria';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';
import { tCountry, tLevel, tFunding } from '@/utils/translateDB';
import LoginModal from '@/components/LoginModal';
import RestrictedAccessCard from '@/components/RestrictedAccessCard';



const WEBHOOK_BASE = import.meta.env?.VITE_WEBHOOK_URL || 'http://localhost:5678';

/* ═══════════════════════════════════════════════════════════════════
   TOKENS
═══════════════════════════════════════════════════════════════════ */
const tokens = (theme) => ({
  accent:      theme === "dark" ? "#4c9fd9" : "#0066b3",
  accentDark:  theme === "dark" ? "#3a8fc9" : "#0052a0",
  paper:       theme === "dark" ? "#15140f" : "#faf8f3",
  paper2:      theme === "dark" ? "#1d1c16" : "#f2efe7",
  surface:     theme === "dark" ? "#1a1912" : "#ffffff",
  ink:         theme === "dark" ? "#f2efe7" : "#141414",
  ink2:        theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3:        theme === "dark" ? "#a19f96" : "#6b6b6b",
  ink4:        theme === "dark" ? "#6d6b64" : "#9a9794",
  rule:        theme === "dark" ? "#2b2a22" : "#d9d5cb",
  ruleSoft:    theme === "dark" ? "#24231c" : "#e8e4d9",
  success:     "#0d7a6b",
  successBg:   theme === "dark" ? "rgba(13,122,107,0.12)" : "rgba(13,122,107,0.08)",
  warning:     "#b06a12",
  warningBg:   theme === "dark" ? "rgba(176,106,18,0.12)" : "rgba(176,106,18,0.08)",
  danger:      "#b4321f",
  dangerBg:    theme === "dark" ? "rgba(180,50,31,0.12)" : "rgba(180,50,31,0.08)",
  fSerif: `"Playfair Display", "Times New Roman", Georgia, serif`,
  fSans:  `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"DM Sans", monospace`,
  tr: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
});

const scoreColor = (s, c) => s >= 70 ? c.success : s >= 40 ? c.warning : c.danger;
const scoreBg    = (s, c) => s >= 70 ? c.successBg : s >= 40 ? c.warningBg : c.dangerBg;
const scoreLabel = (s, lang) =>
  s >= 85 ? (lang === 'fr' ? 'Excellent match' : 'Excellent match') :
  s >= 70 ? (lang === 'fr' ? 'Très bon match'  : 'Great fit') :
  s >= 55 ? (lang === 'fr' ? 'Bon match'        : 'Good match') :
  s >= 40 ? (lang === 'fr' ? 'Match partiel'    : 'Partial match') :
             (lang === 'fr' ? 'Faible match'     : 'Low match');

/* ═══════════════════════════════════════════════════════════════════
   HOOK — détecte la hauteur visible de la navbar en temps réel
   Retourne 0 dès que la navbar sort du viewport (scrollée, masquée)
═══════════════════════════════════════════════════════════════════ */
function useNavbarBottom() {
  const [navBottom, setNavBottom] = useState(0);

  useEffect(() => {
    const detect = () => {
      // Cherche la navbar par id ou par sélecteurs courants
      const nav =
        document.getElementById('navbar') ||
        document.querySelector('nav[class*="navbar"]') ||
        document.querySelector('[class*="Navbar"]') ||
        document.querySelector('nav');

      if (!nav) { setNavBottom(0); return; }

      const rect = nav.getBoundingClientRect();
      // Si la navbar est visible dans le viewport, on prend son bord bas
      // Sinon (scrollée hors vue ou cachée) on retourne 0
      setNavBottom(rect.height > 0 && rect.bottom > 0 ? Math.max(0, rect.bottom) : 0);
    };

    detect();
    window.addEventListener('scroll', detect, { passive: true });
    window.addEventListener('resize', detect);

    // Observer les mutations DOM (navbar qui apparaît/disparaît dynamiquement)
    const mo = new MutationObserver(detect);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

    return () => {
      window.removeEventListener('scroll', detect);
      window.removeEventListener('resize', detect);
      mo.disconnect();
    };
  }, []);

  return navBottom;
}



/* ═══════════════════════════════════════════════════════════════════
   MATCH ANALYSIS PANEL
   FIX 1 : top = navBottom (via hook partagé) — réactif au scroll
═══════════════════════════════════════════════════════════════════ */
function MatchAnalysisPanel({ bourse, user, onClose, onSave, onApply, isStarred, isApplied, c, lang }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // FIX 1 — drawer qui colle à la fin de la navbar (ou au top si navbar cachée)
  const navBottom = useNavbarBottom();

  useEffect(() => {
    if (!bourse || !user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchAnalysis = async () => {
      try {
        const { data: userData } = await axiosInstance.get(`/api/users/${user.id}`, { params: { depth: 2 } });
        const res = await fetch(`${WEBHOOK_BASE}/webhook/analyse-match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: { ...userData, id: user.id }, bourse }),
          signal: AbortSignal.timeout(30000),
        });
        const data = await res.json();
        if (!cancelled) setAnalysis(data);
      } catch (e) {
        if (!cancelled) setError(lang === 'fr' ? 'Erreur analyse IA' : 'AI analysis error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAnalysis();
    return () => { cancelled = true; };
  }, [bourse?.id, user?.id]);

  const col  = analysis ? scoreColor(analysis.scoreGlobal, c) : c.ink3;
  const bg   = analysis ? scoreBg(analysis.scoreGlobal, c)    : c.ruleSoft;

  return (
    <div style={{
      position: 'fixed',
      top: navBottom,        // 0 quand navbar cachée, hauteur navbar sinon
      right: 0,
      bottom: 0,
      width: '100%',
      maxWidth: 580,
      background: c.surface,
      boxShadow: '-8px 0 32px rgba(0,0,0,0.14)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      animation: 'slideInRight 0.3s ease-out',
      transition: 'top 0.2s ease',   // transition fluide quand la navbar disparaît
    }}>
      {/* Header */}
      <div style={{ padding:'22px 28px', borderBottom:`1px solid ${c.rule}`, display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:c.surface, zIndex:1 }}>
        <div>
          <div style={{ fontSize:10, color:c.ink4, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4, fontFamily:c.fMono }}>
            {lang==='fr' ? 'Analyse IA détaillée' : 'Detailed AI analysis'}
          </div>
          <h2 style={{ fontFamily:c.fSerif, fontSize:18, fontWeight:700, margin:0, color:c.ink, lineHeight:1.3 }}>{bourse.nom}</h2>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:c.ink4, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
      </div>

      <div style={{ padding:'24px 28px', flex:1 }}>
        {loading && (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ width:48, height:48, border:`3px solid ${c.ruleSoft}`, borderTopColor:c.accent, borderRadius:'50%', animation:'spin 0.9s linear infinite', margin:'0 auto 20px' }} />
            <div style={{ fontFamily:c.fSans, fontSize:13, color:c.ink3, lineHeight:1.7 }}>
              {lang==='fr' ? 'Analyse IA en cours...\nClaude analyse votre profil complet.' : 'AI analysis in progress...\nClaude is analyzing your full profile.'}
            </div>
            {['Lecture du profil...', 'Analyse des critères...', 'Calcul du score...'].map((step, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 16px', marginTop:8, background:c.paper2, border:`1px solid ${c.ruleSoft}`, animation:`fadeIn 0.3s ease ${i*0.3}s both` }}>
                <div style={{ width:14, height:14, borderRadius:'50%', background:c.accent, animation:'pulse 1s infinite', flexShrink:0 }} />
                <span style={{ fontSize:12, color:c.ink3 }}>{step}</span>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div style={{ padding:'20px', background:c.dangerBg, borderLeft:`3px solid ${c.danger}`, marginBottom:20 }}>
            <div style={{ color:c.danger, fontSize:13, marginBottom:12 }}>{error}</div>
            <button onClick={()=>{ setError(null); setLoading(true); }} style={{ padding:'7px 16px', background:c.danger, color:'#fff', border:'none', cursor:'pointer', fontFamily:c.fMono, fontSize:11 }}>
              Réessayer
            </button>
          </div>
        )}

        {analysis && !loading && (
          <>
            <div style={{ textAlign:'center', padding:'28px 20px', marginBottom:24, background:bg, borderRadius:8 }}>
              <div style={{ fontSize:64, fontWeight:800, color:col, lineHeight:1, letterSpacing:'-0.04em', fontFamily:c.fSerif }}>
                {analysis.scoreGlobal}<span style={{ fontSize:28 }}>%</span>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:col, marginTop:8, fontFamily:c.fMono, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                {analysis.niveauMatch}
              </div>
              {analysis.resume && (
                <div style={{ fontSize:13, color:c.ink2, marginTop:12, lineHeight:1.6, maxWidth:360, margin:'12px auto 0' }}>
                  {analysis.resume}
                </div>
              )}
            </div>

            {(analysis.criteres || []).length > 0 && (
              <div style={{ marginBottom:24 }}>
                <h3 style={{ fontFamily:c.fSerif, fontSize:16, fontWeight:700, marginBottom:14, color:c.ink }}>
                  {lang==='fr' ? 'Analyse par critère' : 'Criteria breakdown'}
                </h3>
                {analysis.criteres.map((cr, i) => {
                  const pct = cr.score || 0;
                  const color = pct >= 70 ? c.success : pct >= 40 ? c.warning : c.danger;
                  return (
                    <div key={i} style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontSize:16 }}>{cr.icone}</span>
                          <span style={{ fontSize:12, color:c.ink2, fontWeight:500 }}>{cr.nom}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:11, padding:'2px 8px', background:cr.statut==='fort'?c.successBg:cr.statut==='moyen'?c.warningBg:c.dangerBg, color:cr.statut==='fort'?c.success:cr.statut==='moyen'?c.warning:c.danger, fontFamily:c.fMono, fontWeight:600 }}>
                            {cr.statut==='fort'?'Fort':cr.statut==='moyen'?'Moyen':'Faible'}
                          </span>
                          <span style={{ fontSize:12, fontWeight:700, color, fontFamily:c.fMono }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ height:5, background:c.ruleSoft, borderRadius:3, overflow:'hidden', marginBottom:4 }}>
                        <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:3, transition:'width 0.6s ease' }} />
                      </div>
                      {cr.explication && (
                        <div style={{ fontSize:11, color:c.ink4, lineHeight:1.5 }}>{cr.explication}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {(analysis.pointsForts || []).length > 0 && (
              <div style={{ padding:'16px', background:c.successBg, borderLeft:`3px solid ${c.success}`, marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:c.success, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
                  {lang==='fr' ? 'Points forts' : 'Strengths'}
                </div>
                {analysis.pointsForts.map((p, i) => (
                  <div key={i} style={{ fontSize:13, color:c.ink2, marginBottom:5, display:'flex', gap:8 }}>
                    <span style={{ color:c.success, flexShrink:0 }}>✓</span>{p}
                  </div>
                ))}
              </div>
            )}

            {(analysis.pointsAmeliorer || []).length > 0 && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:c.danger, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, padding:'16px 16px 0' }}>
                  {lang==='fr' ? 'Points à améliorer' : 'Areas to improve'}
                </div>
                {analysis.pointsAmeliorer.map((p, i) => (
                  <div key={i} style={{ padding:'12px 16px', background:i%2===0?c.dangerBg:`${c.dangerBg}80`, marginBottom:6, borderLeft:`3px solid ${p.priorite==='haute'?c.danger:p.priorite==='moyenne'?c.warning:c.ink4}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:c.ink }}>{p.domaine}</span>
                      <span style={{ fontSize:10, padding:'2px 7px', background:p.priorite==='haute'?c.danger:p.priorite==='moyenne'?c.warning:c.ink4, color:'#fff', fontFamily:c.fMono }}>
                        {p.priorite}
                      </span>
                    </div>
                    <div style={{ fontSize:12, color:c.ink3, marginBottom:4 }}>{p.probleme}</div>
                    <div style={{ fontSize:12, color:c.accent, fontWeight:500 }}>→ {p.action}</div>
                  </div>
                ))}
              </div>
            )}

            {(analysis.documentsManquants || []).length > 0 && (
              <div style={{ padding:'14px 16px', background:c.warningBg, borderLeft:`3px solid ${c.warning}`, marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:c.warning, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
                  {lang==='fr' ? 'Documents manquants' : 'Missing documents'}
                </div>
                {analysis.documentsManquants.map((d, i) => (
                  <div key={i} style={{ fontSize:12, color:c.ink2, marginBottom:4, display:'flex', gap:8 }}>
                    <span style={{ color:c.warning }}>📄</span>{d}
                  </div>
                ))}
              </div>
            )}

            {analysis.conseilPersonnalise && (
              <div style={{ padding:'16px', background:`${c.accent}10`, borderLeft:`3px solid ${c.accent}`, marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:c.accent, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
                  {lang==='fr' ? 'Conseil IA personnalisé' : 'AI personalized advice'}
                </div>
                <div style={{ fontSize:13, color:c.ink2, lineHeight:1.7 }}>{analysis.conseilPersonnalise}</div>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ padding:'16px 28px', borderTop:`1px solid ${c.rule}`, background:c.surface, display:'flex', gap:12, position:'sticky', bottom:0 }}>
        <button onClick={()=>onSave(bourse, isStarred)}
          style={{ flex:1, padding:13, background:isStarred?c.accent:'transparent', color:isStarred?'#fff':c.accent, border:`1px solid ${c.accent}`, fontSize:13, cursor:'pointer', fontFamily:c.fMono, fontWeight:500 }}>
          {isStarred ? '★ Sauvegardé' : '☆ Sauvegarder'}
        </button>
        <button onClick={()=>onApply(bourse)}
          style={{ flex:2, padding:13, background:isApplied?c.success:c.accent, color:'#fff', border:'none', fontSize:13, cursor:'pointer', fontFamily:c.fMono, fontWeight:600 }}>
          {isApplied ? '✓ Dans ma roadmap' : 'Préparer ma candidature →'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCHOLARSHIP CARD
═══════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════
   SCHOLARSHIP CARD — Version améliorée avec indicateurs détaillés
═══════════════════════════════════════════════════════════════════ */
function ScholarshipCard({ 
  bourse, 
  index, 
  onCardClick,      // Ouvre BourseDrawer
  onExplainClick,   // Ouvre MatchDrawerIA
  onSave, 
  onApply, 
  isStarred, 
  isApplied, 
  c, 
  lang 
}) {
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
      return { label: lang === 'fr' ? 'Dernier jour' : 'Last day', color: c.warning, intensity: 'solid' };
    }
    if (deadline <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return { label: lang === 'fr' ? 'Bientôt' : 'Soon', color: c.warning, intensity: 'light' };
    }
    return { label: lang === 'fr' ? 'Ouvert' : 'Open', color: c.accent, intensity: 'light' };
  };
  const status = getStatus();

  // Style des boutons d'action
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
  });

  return (
    <article
      onClick={() => onCardClick(bourse)}
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
      {/* Contenu principal */}
      <div style={{ flex: 1 }}>
        {/* Ligne titre + deadline + statut */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'baseline', 
          flexWrap: 'wrap', 
          marginBottom: 12 
        }}>
          <h3 style={{ 
            fontFamily: c.fSerif, 
            fontSize: 20, 
            fontWeight: 700, 
            margin: 0, 
            color: c.ink, 
            letterSpacing: '-0.01em' 
          }}>
            {bourse.nom}
          </h3>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {bourse.dateLimite && (
              <span style={{ fontFamily: c.fMono, fontSize: 11, color: c.ink3 }}>
                <strong>{lang === 'fr' ? 'Date limite' : 'Deadline'}</strong> {formatDate(bourse.dateLimite)}
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

        {/* Grille des métadonnées (pays, niveau) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '8px 16px', 
          marginBottom: 8 
        }}>
          {bourse.pays && (
            <div style={{ 
              fontSize: 13, 
              color: c.ink2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6 
            }}>
              <span style={{ fontSize: 14 }}>📍</span> 
              <strong>{lang === 'fr' ? 'Pays' : 'Country'}</strong> {tCountry(bourse.pays, lang)}
            </div>
          )}
          {bourse.niveau && (
            <div style={{ 
              fontSize: 13, 
              color: c.ink2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6 
            }}>
              <span style={{ fontSize: 14 }}>🎓</span> 
              <strong>{lang === 'fr' ? 'Niveau' : 'Level'}</strong> {tLevel(bourse.niveau, lang)}
            </div>
          )}
        </div>

        {/* Domaine */}
        {bourse.domaine && (
          <div style={{ 
            marginBottom: 12, 
            fontSize: 13, 
            color: c.ink2, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6 
          }}>
            <span style={{ fontSize: 14 }}>📚</span> 
            <strong>{lang === 'fr' ? 'Domaine' : 'Field'}</strong> {bourse.domaine}
          </div>
        )}

        {/* Financement */}
        {bourse.financement && (
          <div style={{ 
            marginBottom: 16, 
            fontSize: 13, 
            color: c.ink2, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6 
          }}>
            <span style={{ fontSize: 14 }}>💰</span> 
            <strong>{lang === 'fr' ? 'Financement' : 'Funding'}</strong> {tFunding(bourse.financement, lang)}
          </div>
        )}

        {/* Description courte */}
        {bourse.description && (
          <p style={{ 
            fontFamily: c.fSans, 
            fontSize: 13, 
            color: c.ink2, 
            lineHeight: 1.5, 
            margin: '0 0 16px 0', 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden' 
          }}>
            {bourse.description.length > 150 
              ? `${bourse.description.substring(0, 150)}...` 
              : bourse.description}
          </p>
        )}

        {/* Boutons d'action */}
        <div style={{
          display: 'flex', 
          gap: 12, 
          flexWrap: 'wrap',
          opacity: 0,
          transition: 'opacity 0.2s ease 0.1s',
        }} className="card-actions">
          
          {/* Bouton IA (ouvre BourseDrawer - même comportement que clic sur card) */}
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onCardClick(bourse); 
            }} 
            style={{ 
              ...actionButton(c, 'ghost'), 
              border: `1px solid ${c.rule}`, 
              background: 'transparent', 
              color: c.accent 
            }}
          >
            IA
          </button>

          {/* Bouton Favori */}
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onSave(bourse, isStarred); 
            }} 
            style={{ 
              ...actionButton(c, 'ghost'), 
              background: isStarred ? c.accent : 'transparent', 
              color: isStarred ? c.paper : c.ink3, 
              border: `1px solid ${c.rule}` 
            }}
          >
            {isStarred ? '★' : '☆'} Favori
          </button>

          {/* Bouton Postuler */}
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (isApplied || applyLoading) return;
              setApplyLoading(true);
              await onApply(bourse);
              setApplyLoading(false);
            }}
            style={{
              ...actionButton(c, isApplied ? 'success' : 'primary'),
              background: isApplied ? '#2e6b3e' : c.accent,
              color: '#fff',
              opacity: applyLoading ? 0.6 : 1,
              cursor: (isApplied || applyLoading) ? 'default' : 'pointer'
            }}
            disabled={isApplied || applyLoading}
          >
            {applyLoading ? '⏳' : (isApplied ? '✓' : '+')} {isApplied ? (lang === 'fr' ? 'Ajoutée' : 'Added') : (lang === 'fr' ? 'Postuler' : 'Apply')}
          </button>

          {/* Bouton Match IA (ouvre MatchDrawerIA) */}
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onExplainClick(bourse); 
            }} 
            style={{ 
              ...actionButton(c, 'primary'), 
              background: c.accent, 
              color: '#fff' 
            }}
          >
            Analse détaillée
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



/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
export default function RecommandationsPage({
  user, handleSend, messages, input, setInput,
  loading: chatLoading, handleQuickReply, setView, onStarChange,
}) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);

  // ── États ──
  const [phase, setPhase] = useState('welcome');
  const [generateStep, setGenerateStep] = useState(0);
  const [allScholarships, setAllScholarships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisBourse, setAnalysisBourse] = useState(null);
  const [starredNoms, setStarredNoms] = useState(new Set());
  const [appliedNoms, setAppliedNoms] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState('perso');
  const [showLoginModal, setShowLoginModal] = useState(false);
  // Dans la section des états (vers ligne ~340)
const [selectedBourse, setSelectedBourse] = useState(null); 
const [fullBourseData, setFullBourseData] = useState(null);
const [explainBourse, setExplainBourse] = useState(null);
// ✅ NOUVEAUX ÉTATS pour détecter les changements
const [previousRecommendationCount, setPreviousRecommendationCount] = useState(0);
const [showNewRecommendationsAlert, setShowNewRecommendationsAlert] = useState(false);

const handleOpenBourse = async (bourse) => {
  setSelectedBourse(bourse); // Ouvre le drawer immédiatement avec les données partielles
  
  // Fetch les données complètes en arrière-plan
  try {
    const id = bourse.bourseId || bourse.id;
    if (!id) {
      setFullBourseData(bourse);
      return;
    }
    
    const { data } = await axiosInstance.get(`/api/bourses/${id}`, {
      params: { depth: 2 }
    });
    setFullBourseData(data); // Remplace par les données complètes
  } catch (err) {
    console.error('Erreur fetch bourse complète', err);
    setFullBourseData(bourse); // Fallback
  }
};
  //const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;
  const autoLoadTriggered = useRef(false);

// ✅ NOUVEAUX ÉTATS POUR LES FILTRES
const [filterDeadline, setFilterDeadline] = useState('all'); // 'all', '30days', '60days', '90days'
const [filterCountry, setFilterCountry] = useState('all'); // 'all', 'target', 'other', ou nom de pays spécifique
const [availableCountries, setAvailableCountries] = useState([]); // Liste dynamique des pays

  const [searchQuery, setSearchQuery] = useState('');
  const [fullBoursesList, setFullBoursesList] = useState([]);
  const [loadingFull, setLoadingFull] = useState(false);

  const fetchFullBourses = useCallback(async () => {
    if (fullBoursesList.length > 0 || loadingFull) return;
    setLoadingFull(true);
    try {
      const res = await axiosInstance.get(API_ROUTES.bourses.list, {
        params: { limit: 500, depth: 0, where: { statut: { equals: 'active' } } }
      });
      setFullBoursesList(res.data.docs || []);
    } catch (err) {
      console.error('Erreur chargement bourses complètes', err);
    } finally {
      setLoadingFull(false);
    }
  }, [fullBoursesList.length, loadingFull]);

  // ✅ CALCUL DES PAYS DISPONIBLES
useEffect(() => {
  const countries = new Set();
  allScholarships.forEach(s => {
    if (s.pays) countries.add(s.pays);
  });
  setAvailableCountries(Array.from(countries).sort());
}, [allScholarships]);

  const STEPS = lang === 'fr'
    ? ['Récupération de votre profil...', 'Chargement des bourses...', 'Calcul des scores IA...', 'Tri par compatibilité...']
    : ['Fetching your profile...', 'Loading scholarships...', 'Calculating AI scores...', 'Sorting by compatibility...'];

  // ── 1. generateNewRecommendations (fonction normale) ──
const generateNewRecommendations = async () => {
  if (!user?.id && !user?.email) return;
  setLoading(true);
  setError(null);
  setGenerateStep(0);

  const stepInterval = setInterval(() => {
    setGenerateStep(prev => prev >= STEPS.length - 1 ? prev : prev + 1);
  }, 600);

  try {
    const response = await fetch('http://localhost:5678/webhook/recommandation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, userId: user.id }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) throw new Error('Erreur n8n');

    const data = await response.json();
    const rawBourses = data.bourses || [];

    if (rawBourses.length === 0) {
      throw new Error(lang === 'fr' ? 'Aucune bourse trouvée' : 'No scholarships found');
    }

    // ✅ FORMATER LES DONNÉES COMME DANS loadSavedRecommendations
    const formattedBourses = rawBourses.map(b => ({
      id: b.id || b.bourseId || `temp-${Date.now()}`,
      nom: b.titre || b.nom || 'Bourse sans nom',  // ← Clé importante !
      description: b.description || '',
      domaine: b.domaine || '',
      niveau: b.niveau || '',
      pays: b.pays || '',
      montant: b.montant || '',
      dateLimite: b.deadline || b.dateLimite || null,
      lienOfficiel: b.lien || b.lienOfficiel || '',
      financement: b.financement || 'fully_funded',
      matchScore: b.score || b.matchScore || 0,
      raisons: b.raisons || [],
    }));

    const sorted = formattedBourses.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    clearInterval(stepInterval);
    setAllScholarships(sorted);
    setGenerateStep(STEPS.length - 1);
    setTimeout(() => setPhase('results'), 400);
  } catch (err) {
    clearInterval(stepInterval);
    setError(err.message);
    setPhase('welcome');
  } finally {
    setLoading(false);
  }
};

  // ── 2. loadSavedRecommendations (avec useCallback) ──
const loadSavedRecommendations = useCallback(async () => {
  if (!user?.id) return;
  setLoading(true);
  setError(null);

  try {
    const res = await axiosInstance.get('/api/recommendations', {
      params: {
        'where[studentProfile][equals]': user.id,
        limit: 1,
        sort: '-dateGeneration',
        depth: 0
      }
    });

    const savedRec = res.data.docs?.[0];
   
    console.log('📦 RAW savedRec.scholarships[0]:', savedRec?.scholarships?.[0]);
   
    if (savedRec?.scholarships && savedRec.scholarships.length > 0) {
      const formatted = savedRec.scholarships.map(s => {
        // ✅ DEBUG : affiche chaque champ
        console.log('🔍 Mapping bourse:', {
          titre: s.titre,
          nom: s.nom,
          bourseId: s.bourseId,
          id: s.id
        });
       
        return {
          id: s.bourseId || s.id || `temp-${Date.now()}`,
          nom: s.titre || s.nom || 'Bourse sans nom',  // ← PRIORITÉ au titre
          description: s.description || '',
          domaine: s.domaine || '',
          niveau: s.niveau || '',
          pays: s.pays || '',
          montant: s.montant || '',
          dateLimite: s.deadline || s.dateLimite || null,
          lienOfficiel: s.lien || s.lienOfficiel || '',
          financement: s.financement || 'fully_funded',
          matchScore: s.score || 0,
          raisons: s.raisons?.map(r => r.raison) || []
        };
      });

      console.log('✅ formatted[0]:', formatted[0]);

      setAllScholarships(formatted);
      setPhase('results');
    } else {
      await generateNewRecommendations();
    }
  } catch (err) {
    console.error('[loadSavedRecommendations]', err);
    await generateNewRecommendations();
  } finally {
    setLoading(false);
  }
}, [user?.id]);

  // ── 3. useEffect d'auto-chargement (APRÈS les fonctions) ──
  // ── 3. useEffect d'auto-chargement + détection des changements ──
useEffect(() => {
  if (!user?.id || autoLoadTriggered.current) return;
  autoLoadTriggered.current = true;
  setPhase('generating');
  loadSavedRecommendations();
}, [user?.id, loadSavedRecommendations]);

// ✅ NOUVEAU : Détecter si les recommandations ont changé
useEffect(() => {
  if (phase === 'results' && allScholarships.length > 0) {
    // Première fois : mémoriser le nombre
    if (previousRecommendationCount === 0) {
      setPreviousRecommendationCount(allScholarships.length);
    } 
    // Les recommandations ont changé
    else if (allScholarships.length !== previousRecommendationCount) {
      setShowNewRecommendationsAlert(true);
      setPreviousRecommendationCount(allScholarships.length);
      
      // Masquer l'alerte après 6 secondes
      const timer = setTimeout(() => {
        setShowNewRecommendationsAlert(false);
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }
}, [allScholarships.length, phase, previousRecommendationCount]);
  // ── Favoris ──
const handleStar = async (bourse, isStarred) => {
  const nomKey = (bourse.nom || bourse.titre)?.trim().toLowerCase();  // ✅ FIX
  if (!user?.id) return;
  
  try {
    const { data } = await axiosInstance.get('/api/favoris', { 
      params: { 'where[user][equals]': user.id, limit: 1, depth: 0 } 
    });
    const doc = data.docs?.[0];
    
    if (isStarred) {
      // Retirer des favoris
      if (!doc?.id) return;
      await axiosInstance.patch(`/api/favoris/${doc.id}`, { 
        bourses: (doc.bourses || []).filter(b => 
          (b.nom || b.titre)?.trim().toLowerCase() !== nomKey  // ✅ FIX
        ) 
      });
      setStarredNoms(prev => { 
        const s = new Set(prev); 
        s.delete(nomKey); 
        onStarChange?.(s.size); 
        return s; 
      });
    } else {
      // Ajouter aux favoris
      const nb = { 
        nom: bourse.nom || bourse.titre,  // ✅ FIX
        pays: bourse.pays || '', 
        lienOfficiel: bourse.lienOfficiel || bourse.lien || '',  // ✅ FIX
        financement: bourse.financement || '', 
        dateLimite: bourse.dateLimite || bourse.deadline || null,  // ✅ FIX
        ajouteLe: new Date().toISOString() 
      };
      
      if (doc?.id) {
        await axiosInstance.patch(`/api/favoris/${doc.id}`, { 
          bourses: [...(doc.bourses || []), nb] 
        });
      } else {
        await axiosInstance.post('/api/favoris', { 
          user: user.id, 
          userEmail: user.email || '', 
          bourses: [nb] 
        });
      }
      
      setStarredNoms(prev => { 
        const s = new Set([...prev, nomKey]); 
        onStarChange?.(s.size); 
        return s; 
      });
    }
    
    window.dispatchEvent(new CustomEvent('favoris-updated'));
  } catch (e) { 
    console.error('[handleStar]', e); 
  }
};
  // ── Postuler ──
const handleApply = async (bourse) => {
  const nomKey = (bourse.nom || bourse.titre)?.trim().toLowerCase();
  if (!user?.id || appliedNoms.has(nomKey)) return;
  
  try {
    const res = await axiosInstance.post(API_ROUTES.roadmap.create, {
      userId: user.id, 
      userEmail: user.email || '', 
      nom: bourse.nom || bourse.titre,
      pays: bourse.pays || '',
      lienOfficiel: bourse.lienOfficiel || bourse.lien || '',
      financement: bourse.financement || '',
      dateLimite: bourse.dateLimite || bourse.deadline || null,
      ajouteLe: new Date().toISOString(), 
      statut: 'en_cours', 
      etapeCourante: 0,
    });
    
    // ✅ CORRECTION : Utilise fetch au lieu d'axios + bonne URL
    await fetch(`${WEBHOOK_BASE}/webhook/generate-roadmap-steps`, {  
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roadmapId: res.data.doc.id,
        user: { 
          id: user.id, 
          email: user.email, 
          niveau: user.niveau, 
          domaine: user.domaine 
        },
        bourse: { 
          nom: bourse.nom || bourse.titre,
          pays: bourse.pays, 
          lien: bourse.lienOfficiel || bourse.lien
        },
      }),
    });
    
    setAppliedNoms(prev => new Set([...prev, nomKey]));
    window.dispatchEvent(new CustomEvent('roadmap-updated'));
    setTimeout(() => setView?.('roadmap'), 1000);
  } catch (e) { 
    console.error('[handleApply]', e); 
  }
};
  //useEffect(() => { setCurrentPage(1); }, [activeFilter]);
  useEffect(() => { if (activeFilter !== 'test') setSearchQuery(''); }, [activeFilter]);

  // ── Filtrage ──
 // ✅ FILTRAGE AVEC DEADLINE ET PAYS
const filtered = useMemo(() => {
  let r = [...allScholarships];

  // Filtre par onglet actif
  if (activeFilter === 'easy') {
    r = r.filter(s => s.matchScore >= 70);
  } else if (activeFilter === 'nolang') {
    r = r.filter(s => !((s.description || '').toLowerCase().includes('ielts') || (s.description || '').toLowerCase().includes('toefl')));
  } else if (activeFilter === 'deadline') {
    const d30 = new Date(Date.now() + 30 * 86400000);
    r = r.filter(s => s.dateLimite && new Date(s.dateLimite) <= d30 && new Date(s.dateLimite) >= new Date());
  } else if (activeFilter === 'perso') {
   
  } else if (activeFilter === 'test') {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      r = fullBoursesList.filter(b =>
        (b.nom?.toLowerCase().includes(q) || (b.pays && b.pays.toLowerCase().includes(q)))
      );
    } else {
      r = [];
    }
  }

  // ✅ FILTRE PAR DEADLINE
  if (filterDeadline !== 'all') {
    const today = new Date();
    const daysMap = { '30days': 30, '60days': 60, '90days': 90 };
    const targetDate = new Date(today.getTime() + daysMap[filterDeadline] * 86400000);
   
    r = r.filter(s => {
      if (!s.dateLimite) return false;
      const deadline = new Date(s.dateLimite);
      return deadline >= today && deadline <= targetDate;
    });
  }

  // ✅ FILTRE PAR PAYS
   if (filterCountry !== 'all') {
    if (filterCountry === 'target') {
      // Pays cibles de l'étudiant
      const targetCountries = user && (user.targetCountries || [])  // ✅ Ajouter `user &&`
        .map(tc => tc.country?.toLowerCase().trim())
        .filter(Boolean);
      r = r.filter(s => targetCountries.includes(s.pays?.toLowerCase().trim()));
    } else if (filterCountry === 'other') {
      // Autres pays
      const targetCountries = user && (user.targetCountries || [])  // ✅ Ajouter `user &&`
        .map(tc => tc.country?.toLowerCase().trim())
        .filter(Boolean);
      r = r.filter(s => !targetCountries.includes(s.pays?.toLowerCase().trim()));
    } else {
      // Pays spécifique
      r = r.filter(s => s.pays?.toLowerCase() === filterCountry.toLowerCase());
    }
  }

  if (activeFilter === 'test') {
    return r.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
  }

  return r.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}, [allScholarships, activeFilter, searchQuery, fullBoursesList, filterDeadline, filterCountry, user?.targetCountries]);
  //const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  //const safePage = Math.min(currentPage, totalPages);
  //const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);


// ✅ SÉPARATION PAR PAYS CIBLE
const hasTargetCountries = user && user.targetCountries && user.targetCountries.length > 0;  // ✅ Ajouter `user &&`
const targetCountriesLower = hasTargetCountries && user
  ? user.targetCountries.map(tc => tc.country?.toLowerCase().trim()).filter(Boolean)
  : [];
// ✅ Charger les favoris au démarrage
useEffect(() => {
  const loadStarred = async () => {
    if (!user?.id) return;
    try {
      const { data } = await axiosInstance.get('/api/favoris', {
        params: { 'where[user][equals]': user.id, limit: 1, depth: 0 }
      });
      const favoris = data.docs?.[0]?.bourses || [];
      const names = new Set(
        favoris.map(b => (b.nom || b.titre)?.trim().toLowerCase()).filter(Boolean)
      );
      setStarredNoms(names);
    } catch (e) {
      console.error('[loadStarred]', e);
    }
  };
  loadStarred();
}, [user?.id]);
const targetScholarships = hasTargetCountries
  ? filtered.filter(s => targetCountriesLower.includes(s.pays?.toLowerCase().trim()))
  : [];

const otherScholarships = hasTargetCountries
  ? filtered.filter(s => !targetCountriesLower.includes(s.pays?.toLowerCase().trim()))
  : filtered;


  const stats = useMemo(() => ({
    high: allScholarships.filter(s => s.matchScore >= 70).length,
    medium: allScholarships.filter(s => s.matchScore >= 40 && s.matchScore < 70).length,
    low: allScholarships.filter(s => s.matchScore < 40).length,
    total: allScholarships.length,
  }), [allScholarships]);

  // ── Non connecté ──
  if (!user) return (

  <>
    <RestrictedAccessCard
      pageName={lang === 'fr' ? 'Recommandations' : 'Recommendations'}
      icon="🎓"
      onLoginClick={() => setShowLoginModal(true)}
    />
    {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} lang={lang} theme={theme} />}
    <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
  </>
);
     


  // ── PHASE GENERATING ──
  if (phase === 'generating') return (
    <div style={{ minHeight: '100vh', background: c.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: '56px 48px', maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, border: `3px solid ${c.ruleSoft}`, borderTopColor: c.accent, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 28px' }} />
        <h3 style={{ fontFamily: c.fSerif, fontSize: 22, fontWeight: 700, color: c.ink, marginBottom: 28 }}>
          {lang === 'fr' ? 'Analyse IA en cours...' : 'AI analysis in progress...'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', background: i <= generateStep ? `${c.accent}10` : c.paper2, border: `1px solid ${i <= generateStep ? `${c.accent}30` : c.ruleSoft}`, transition: 'all 0.3s ease' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: i < generateStep ? c.success : i === generateStep ? c.accent : c.ruleSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i < generateStep ? <span style={{ color: '#fff', fontSize: 11 }}>✓</span>
                  : i === generateStep ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite' }} />
                    : null}
              </div>
              <span style={{ fontSize: 13, color: i <= generateStep ? c.ink2 : c.ink4, fontFamily: c.fSans, textAlign: 'left' }}>{step}</span>
            </div>
          ))}
        </div>
        {error && (
          <div style={{ marginTop: 20, padding: '12px 16px', background: c.dangerBg, color: c.danger, fontSize: 13, borderLeft: `3px solid ${c.danger}` }}>
            {error}
            <button onClick={() => { setPhase('welcome'); setError(null); }} style={{ marginLeft: 12, color: c.danger, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>
              Réessayer
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}} @keyframes pulse{0%,100%{transform:scale(0.8);opacity:0.5;}50%{transform:scale(1.1);opacity:1;}}`}</style>
    </div>
  );

  // ── PHASE RESULTS ──
  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes cardIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(40px);}to{opacity:1;transform:translateX(0);}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(40px);}to{opacity:1;transform:translateX(0);}}
        @keyframes pulse{0%,100%{transform:scale(0.8);opacity:0.5;}50%{transform:scale(1.1);opacity:1;}}
      `}</style>

        {/* ✅ ALERTE : Nouvelles recommandations reçues */}
{showNewRecommendationsAlert && (
  <div
    style={{
      position: 'fixed',
      top: 80,
      right: 32,
      maxWidth: 420,
      zIndex: 2000,
      animation: 'slideInRight 0.4s ease-out',
      pointerEvents: 'auto',
    }}
  >
    <div
      style={{
        background: c.surface,
        border: `1px solid ${c.success}`,
        borderLeft: `4px solid ${c.success}`,
        borderRadius: 8,
        padding: '20px 24px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: `${c.success}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          flexShrink: 0,
          animation: 'pulse 2s infinite',
        }}
      >
        ✨
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: c.ink,
            marginBottom: 6,
            fontFamily: c.fSerif,
            letterSpacing: '-0.01em',
          }}
        >
          {lang === 'fr'
            ? '🎉 Nouvelles recommandations disponibles !'
            : '🎉 New recommendations available!'}
        </div>
        <div
          style={{
            fontSize: 13,
            color: c.ink2,
            lineHeight: 1.5,
            fontFamily: c.fSans,
          }}
        >
          {lang === 'fr'
            ? `Vous avez mis à jour votre profil. Nous avons généré ${allScholarships.length} recommandations adaptées à vos nouveaux critères.`
            : `You updated your profile. We generated ${allScholarships.length} recommendations tailored to your new criteria.`}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 14,
          }}
        >
          <button
            onClick={() => setShowNewRecommendationsAlert(false)}
            style={{
              padding: '7px 16px',
              background: c.success,
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: c.fMono,
              cursor: 'pointer',
              transition: c.tr,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.85';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {lang === 'fr' ? 'Voir' : 'View'}
          </button>
          <button
            onClick={() => setShowNewRecommendationsAlert(false)}
            style={{
              padding: '7px 12px',
              background: 'transparent',
              color: c.ink3,
              border: 'none',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: c.fMono,
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      {/* ── Hero ── */}
           <section style={{
        background: c.paper2,
        padding: '64px 32px 48px',
        borderBottom: `1px solid ${c.rule}`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative gradient */}
        <div style={{
          position: 'absolute',
          top: -100, right: -100,
          width: 400, height: 400,
          background: `radial-gradient(circle, ${c.accent}08 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', animation: 'fadeIn 0.6s ease' }}>
          <h1 style={{
            fontFamily: c.fSerif,
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: c.ink,
            margin: '0 0 18px',
            lineHeight: 1.05,
            maxWidth: 800,
          }}>
            {lang === 'fr'
              ? <>L'<em style={{ color: c.accent, fontStyle: 'italic' }}>IA</em> a trouvé vos <em style={{ color: c.accent, fontStyle: 'italic' }}>meilleures opportunités</em>.</>
              : <>Your <em style={{ color: c.accent, fontStyle: 'italic' }}>personalized</em> recommendations.</>}
          </h1>
          <p style={{
            fontFamily: c.fSans, fontSize: 16, color: c.ink2,
            maxWidth: 620, margin: '0 0 28px', lineHeight: 1.6,
          }}>
            {lang === 'fr'
              ? `${stats.total} opportunités analysées par notre IA,`
              : `${stats.total} opportunities analyzed by AI .`}
          </p>

          
        </div>
      </section>

      

      {/* ── Filtres ── */}
      <div style={{ background: c.surface, borderBottom: `1px solid ${c.rule}`, padding: '0 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Tabs principaux */}
          <div style={{ display: 'flex', gap: 4, paddingTop: 24, paddingBottom: activeFilter === 'test' ? 0 : 24, borderBottom: `1px solid ${c.ruleSoft}` }}>
            {[
              { id: 'perso', label: lang === 'fr' ? 'Recommandations' : 'Recommendations'},
              { id: 'test', label: lang === 'fr' ? 'Vérifier' : 'Verify' },
            ].map(tab => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveFilter(tab.id);
                    if (tab.id === 'test' && fullBoursesList.length === 0) fetchFullBourses();
                  }}
                  style={{
                    padding: '14px 28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'transparent',
                    color: isActive ? c.accent : c.ink3,
                    border: 'none',
                    borderBottom: isActive ? `2px solid ${c.accent}` : `2px solid transparent`,
                    marginBottom: -1,
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer', fontFamily: c.fSans,
                    transition: c.tr,
                    letterSpacing: '0.02em',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-filters */}
          {activeFilter === 'perso' && (
            <div style={{ paddingTop: 20, paddingBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                
                <select
                  value={filterDeadline}
                  onChange={e => setFilterDeadline(e.target.value)}
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: c.surface, border: `1px solid ${c.rule}`,
                    color: c.ink, fontSize: 13, fontFamily: c.fSans, cursor: 'pointer',
                    transition: c.tr,
                  }}
                >
                  <option value="all">{lang === 'fr' ? 'Toutes les deadlines' : 'All deadlines'}</option>
                  <option value="30days">⚡ {lang === 'fr' ? 'Dans 30 jours' : 'Within 30 days'}</option>
                  <option value="60days">{lang === 'fr' ? 'Dans 60 jours' : 'Within 60 days'}</option>
                  <option value="90days">{lang === 'fr' ? 'Dans 90 jours' : 'Within 90 days'}</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>

                <select
                  value={filterCountry}
                  onChange={e => setFilterCountry(e.target.value)}
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: c.surface, border: `1px solid ${c.rule}`,
                    color: c.ink, fontSize: 13, fontFamily: c.fSans, cursor: 'pointer',
                  }}
                >
                  <option value="all">{lang === 'fr' ? 'Tous les pays' : 'All countries'}</option>
                  {hasTargetCountries && (
                    <>
                      <option value="target">📍 {lang === 'fr' ? 'Mes pays cibles' : 'My target countries'} ({targetScholarships.length})</option>
                      <option value="other">🌍 {lang === 'fr' ? 'Autres pays' : 'Other countries'} ({otherScholarships.length})</option>
                      <option disabled>──────────</option>
                    </>
                  )}
                  {availableCountries.map(country => (
                    <option key={country} value={country}>
                      {tCountry(country, lang)} ({allScholarships.filter(s => s.pays === country).length})
                    </option>
                  ))}
                </select>
              </div>

              {(filterDeadline !== 'all' || filterCountry !== 'all') && (
                <button
                  onClick={() => { setFilterDeadline('all'); setFilterCountry('all'); }}
                  style={{
                    padding: '11px 20px',
                    background: 'transparent', border: `1px solid ${c.danger}`,
                    color: c.danger, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    fontFamily: c.fSans, letterSpacing: '0.04em', textTransform: 'uppercase',
                    transition: c.tr,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = c.danger; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.danger; }}
                >
                  ✕ {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
                </button>
              )}
            </div>
          )}

          {/* Search bar for "test" tab */}
          {activeFilter === 'test' && (
            <div style={{ padding: '24px 0' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: c.paper2, padding: '4px 16px', border: `1.5px solid ${c.rule}`, transition: c.tr }}>
                <span style={{ fontSize: 20 }}>🔍</span>
                <input
                  type="text"
                  placeholder={lang === 'fr' ? 'Nom de la bourse, pays...' : 'Scholarship name, country...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', padding: '14px 0', outline: 'none', color: c.ink, fontSize: 14, fontFamily: c.fSans }}
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: c.ink3, padding: '0 8px' }}>✕</button>
                )}
              </div>
              {loadingFull && <div style={{ textAlign: 'center', padding: 20, fontSize: 13, color: c.ink3, fontFamily: c.fMono }}>{lang === 'fr' ? 'Chargement...' : 'Loading...'}</div>}
            </div>
          )}
        </div>
      </div>

{/* ✅ NOUVELLE SECTION : CONFIANCE & TRANSPARENCE */}
{activeFilter === 'perso' && allScholarships.length > 0 && (
  <div style={{
    maxWidth: 1100,
    margin: '60px auto 0',
    padding: '0 32px',
  }}>
    <div style={{
      background: c.surface,
      border: `1px solid ${c.rule}`,
      borderRadius: 12,
      padding: '28px 32px',
      marginBottom: 48,
      animation: 'fadeIn 0.6s ease 0.1s backwards',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
      }}>
        {/* Colonne 1: Analyse réelle */}
        <div style={{
          display: 'flex',
          gap: 14,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: `${c.success}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
            color: c.success,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <h4 style={{
              fontFamily: c.fSerif,
              fontSize: 13,
              fontWeight: 700,
              color: c.ink,
              margin: '0 0 6px',
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
            }}>
              {lang === 'fr' ? 'Analyse vérifiée' : 'Verified Analysis'}
            </h4>
            <p style={{
              fontFamily: c.fSans,
              fontSize: 12,
              color: c.ink2,
              lineHeight: 1.5,
              margin: 0,
            }}>
              {lang === 'fr'
                ? 'Chaque recommandation est générée automatiquement en comparant votre profil réel avec les critères objectifs de chaque bourse.'
                : 'Each recommendation is generated automatically by comparing your real profile with each scholarship\'s objective criteria.'}
            </p>
          </div>
        </div>

        {/* Colonne 2: Critères objectifs */}
        <div style={{
          display: 'flex',
          gap: 14,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: `${c.accent}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
            color: c.accent,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"/>
            </svg>
          </div>
          <div>
            <h4 style={{
              fontFamily: c.fSerif,
              fontSize: 13,
              fontWeight: 700,
              color: c.ink,
              margin: '0 0 6px',
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
            }}>
              {lang === 'fr' ? 'Critères objectifs' : 'Objective Criteria'}
            </h4>
            <p style={{
              fontFamily: c.fSans,
              fontSize: 12,
              color: c.ink2,
              lineHeight: 1.5,
              margin: 0,
            }}>
              {lang === 'fr'
                ? 'Domaine, niveau, GPA, nationalité, pays ciblés, expériences et compétences – aucune sélection aléatoire.'
                : 'Field, level, GPA, nationality, target countries, experience and skills – no random selection.'}
            </p>
          </div>
        </div>

        {/* Colonne 3: Matching intelligent */}
        <div style={{
          display: 'flex',
          gap: 14,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: `${c.warning}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
            color: c.warning,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </div>
          <div>
            <h4 style={{
              fontFamily: c.fSerif,
              fontSize: 13,
              fontWeight: 700,
              color: c.ink,
              margin: '0 0 6px',
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
            }}>
              {lang === 'fr' ? 'Matching intelligent' : 'Smart Matching'}
            </h4>
            <p style={{
              fontFamily: c.fSans,
              fontSize: 12,
              color: c.ink2,
              lineHeight: 1.5,
              margin: 0,
            }}>
              {lang === 'fr'
                ? 'Un système de scoring structuré (0-120 pts) classe chaque bourse selon sa pertinence réelle pour vous.'
                : 'A structured scoring system (0-120 pts) ranks each scholarship by its real relevance to you.'}
            </p>
          </div>
        </div>

        {/* Colonne 4: Transparence */}
        <div style={{
          display: 'flex',
          gap: 14,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: `${c.accent}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
            color: c.accent,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div>
            <h4 style={{
              fontFamily: c.fSerif,
              fontSize: 13,
              fontWeight: 700,
              color: c.ink,
              margin: '0 0 6px',
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
            }}>
              {lang === 'fr' ? 'Transparence totale' : 'Full Transparency'}
            </h4>
            <p style={{
              fontFamily: c.fSans,
              fontSize: 12,
              color: c.ink2,
              lineHeight: 1.5,
              margin: 0,
            }}>
              {lang === 'fr'
                ? 'Consultez le score détaillé et les raisons du matching pour chaque bourse – aucune logique cachée.'
                : 'Check the detailed score and matching reasons for each scholarship – no hidden logic.'}
            </p>
          </div>
        </div>

        {/* Colonne 5: Opportunités réalistes */}
        <div style={{
          display: 'flex',
          gap: 14,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: `${c.success}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
            color: c.success,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
            </svg>
          </div>
          <div>
            <h4 style={{
              fontFamily: c.fSerif,
              fontSize: 13,
              fontWeight: 700,
              color: c.ink,
              margin: '0 0 6px',
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
            }}>
              {lang === 'fr' ? 'Opportunités réalistes' : 'Realistic Opportunities'}
            </h4>
            <p style={{
              fontFamily: c.fSans,
              fontSize: 12,
              color: c.ink2,
              lineHeight: 1.5,
              margin: 0,
            }}>
              {lang === 'fr'
                ? 'Nous sélectionnons les bourses où vos chances d\'éligibilité sont réelles – pas d\'espoirs infondés.'
                : 'We select scholarships where your eligibility chances are real – no false hope.'}
            </p>
          </div>
        </div>

        {/* Colonne 6: Support continu */}
        <div style={{
          display: 'flex',
          gap: 14,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: `${c.accent}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
            color: c.accent,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
            </svg>
          </div>
          <div>
            <h4 style={{
              fontFamily: c.fSerif,
              fontSize: 13,
              fontWeight: 700,
              color: c.ink,
              margin: '0 0 6px',
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
            }}>
              {lang === 'fr' ? 'Analyse personnalisée' : 'Personalized Insights'}
            </h4>
            <p style={{
              fontFamily: c.fSans,
              fontSize: 12,
              color: c.ink2,
              lineHeight: 1.5,
              margin: 0,
            }}>
              {lang === 'fr'
                ? 'Cliquez sur une bourse pour une analyse détaillée IA expliquant pourquoi elle vous correspond.'
                : 'Click any scholarship for AI-powered analysis explaining why it matches you.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      {/* ── Content ── */}
     
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}>
          {error && (
            <div style={{
              padding: '16px 22px', background: c.dangerBg, borderLeft: `4px solid ${c.danger}`,
              marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13,
            }}>
              <span style={{ color: c.danger, fontWeight: 600 }}>⚠ {error}</span>
              <button onClick={generateNewRecommendations} style={{ padding: '8px 18px', background: c.danger, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: c.fSans, fontSize: 12, fontWeight: 700 }}>
                {lang === 'fr' ? 'Réessayer' : 'Retry'}
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 20px', animation: 'fadeIn 0.4s ease' }}>
              <div style={{ fontSize: 64, marginBottom: 20, opacity: 0.4 }}>◇</div>
              <div style={{ fontFamily: c.fSerif, fontSize: 22, fontWeight: 700, color: c.ink, marginBottom: 12, letterSpacing: '-0.01em' }}>
                {lang === 'fr' ? 'Aucun résultat' : 'No results'}
              </div>
              <p style={{ color: c.ink3, fontSize: 14, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 24px' }}>
                {activeFilter === 'test'
                  ? (lang === 'fr' ? 'Commencez à taper le nom d\'une bourse ou d\'un pays.' : 'Start typing a scholarship name or country.')
                  : (lang === 'fr' ? 'Essayez de changer les filtres ou complétez votre profil pour de meilleurs résultats.' : 'Try changing filters or complete your profile.')}
              </p>
              {(filterDeadline !== 'all' || filterCountry !== 'all') && (
                <button
                  onClick={() => { setFilterDeadline('all'); setFilterCountry('all'); }}
                  style={{
                    padding: '12px 28px',
                    background: `linear-gradient(135deg, ${c.accent}, ${c.accentDark})`,
                    color: '#fff', border: 'none', cursor: 'pointer',
                    fontFamily: c.fSans, fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    boxShadow: `0 4px 12px ${c.accent}40`,
                  }}
                >
                  {lang === 'fr' ? 'Réinitialiser les filtres' : 'Reset filters'}
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {/* SECTION 1: Target Countries */}
             {/* SECTION 1: Target Countries */}
{hasTargetCountries && (
  <>
    {targetScholarships.length > 0 ? (
      // ✅ Cas 1 : Bourses trouvées dans pays cibles
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          marginBottom: 24, paddingBottom: 16,
          borderBottom: `2px solid ${c.accent}`,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: `${c.accent}20`, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>📍</div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: 10, 
              color: c.accent, 
              fontFamily: c.fMono, 
              fontWeight: 700, 
              letterSpacing: '0.12em', 
              textTransform: 'uppercase', 
              marginBottom: 4 
            }}>
            
            </div>
            <h2 style={{ 
              fontFamily: c.fSerif, 
              fontSize: 24, 
              fontWeight: 700, 
              color: c.ink, 
              margin: 0, 
              letterSpacing: '-0.01em' 
            }}>
              {lang === 'fr' 
                ? 'Bourses dans vos pays cibles — Excellentes chances de réussite' 
                : 'Scholarships in your target countries — Excellent success rate'}
            </h2>
          </div>
          <div style={{
            padding: '6px 14px', 
            background: c.accent, 
            color: '#fff',
            fontFamily: c.fMono, 
            fontSize: 13, 
            fontWeight: 700,
          }}>
            {targetScholarships.length}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {targetScholarships.map((bourse, i) => (
            <ScholarshipCard
              key={bourse.id}
              bourse={bourse}
              index={i}
              onCardClick={handleOpenBourse}
              onExplainClick={setExplainBourse}
              onSave={handleStar}
              onApply={handleApply}
              isStarred={starredNoms.has((bourse.nom || bourse.titre)?.trim().toLowerCase())}
              isApplied={appliedNoms.has((bourse.nom || bourse.titre)?.trim().toLowerCase())}
              c={c}
              lang={lang}
            />
          ))}
        </div>
      </div>
    ) : (
      // ✅ Cas 2 : Aucune bourse dans pays cibles
      <div style={{ 
        marginBottom: 40,
        padding: '32px 28px',
        background: `linear-gradient(135deg, ${c.accent}08, ${c.accent}03)`,
        border: `1px solid ${c.accent}30`,
        borderLeft: `4px solid ${c.accent}`,
        borderRadius: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: `${c.accent}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            flexShrink: 0,
          }}>
            💡
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontFamily: c.fSerif,
              fontSize: 20,
              fontWeight: 700,
              color: c.ink,
              margin: '0 0 12px',
              letterSpacing: '-0.01em',
            }}>
              {lang === 'fr' 
                ? 'Aucune bourse disponible dans vos pays cibles actuellement' 
                : 'No scholarships available in your target countries currently'}
            </h3>
            <p style={{
              fontFamily: c.fSans,
              fontSize: 14,
              color: c.ink2,
              lineHeight: 1.7,
              margin: '0 0 16px',
            }}>
              {lang === 'fr'
                ? `Nous n'avons pas trouvé de bourses correspondant à votre profil dans ${user.targetCountries?.map(tc => tCountry(tc.country, lang)).join(', ')}. Cependant, nous avons identifié ${otherScholarships.length} opportunité${otherScholarships.length > 1 ? 's' : ''} dans d'autres pays où vous avez d'excellentes chances de réussite.`
                : `We haven't found scholarships matching your profile in ${user.targetCountries?.map(tc => tCountry(tc.country, lang)).join(', ')}. However, we've identified ${otherScholarships.length} opportunit${otherScholarships.length > 1 ? 'ies' : 'y'} in other countries where you have excellent chances of success.`}
            </p>
            
          </div>
        </div>
      </div>
    )}
  </>
)}

              {/* SECTION 2: Other countries */}
{otherScholarships.length > 0 && (
  <div data-section="other-scholarships">  {/* ✅ Ajout de l'attribut pour le scroll */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      marginBottom: 24, paddingBottom: 16,
      borderBottom: `1px solid ${c.rule}`,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: c.paper2, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>🌍</div>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: 10, 
          color: c.ink3, 
          fontFamily: c.fMono, 
          fontWeight: 700, 
          letterSpacing: '0.12em', 
          textTransform: 'uppercase', 
          marginBottom: 4 
        }}>
          
        </div>
        <h2 style={{ 
          fontFamily: c.fSerif, 
          fontSize: 22, 
          fontWeight: 700, 
          color: c.ink, 
          margin: 0, 
          letterSpacing: '-0.01em' 
        }}>
          {lang === 'fr' 
            ? 'Autres bourses internationales — Bonnes chances de réussite' 
            : 'Other international scholarships — Good success rate'}
        </h2>
      </div>
      <div style={{
        padding: '6px 14px', 
        background: c.paper2, 
        color: c.ink3,
        fontFamily: c.fMono, 
        fontSize: 13, 
        fontWeight: 700,
        border: `1px solid ${c.rule}`,
      }}>
        {otherScholarships.length}
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {otherScholarships.map((bourse, i) => (
        <ScholarshipCard
          key={bourse.id}
          bourse={bourse}
          index={hasTargetCountries ? i + targetScholarships.length : i}
          onCardClick={setSelectedBourse}
          onExplainClick={setExplainBourse}
          onSave={handleStar}
          onApply={handleApply}
          isStarred={starredNoms.has((bourse.nom || bourse.titre)?.trim().toLowerCase())}
          isApplied={appliedNoms.has((bourse.nom || bourse.titre)?.trim().toLowerCase())}
          c={c}
          lang={lang}
        />
      ))}
    </div>
  </div>
)}
            </div>
          )}
        </div>
      


      {/* ── Drawers ── */}
{/* ✅ Drawer 1 : Fiche complète de la bourse */}
{selectedBourse && (
  <BourseDrawer
    bourse={fullBourseData || selectedBourse}  // ✅ Données complètes si dispo
    user={user}
    onClose={() => {
      setSelectedBourse(null);
      setFullBourseData(null); // Reset
    }}
    onAskAI={setExplainBourse}
    starred={starredNoms.has(selectedBourse.nom?.trim().toLowerCase())}
    onStar={handleStar}
    applied={appliedNoms.has(selectedBourse.nom?.trim().toLowerCase())}
    onApply={handleApply}
  />
)}

{/* ✅ Drawer 2 : Analyse IA personnalisée */}
{explainBourse && (
  <MatchDrawerIA
    bourse={explainBourse}
    user={user}
    onBack={() => setExplainBourse(null)}
  />
)}
    </main>
  );
}
