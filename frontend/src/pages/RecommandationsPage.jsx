// RecommandationsPage.jsx — 100% AI-powered
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axiosInstance from '@/config/axiosInstance';
import BourseDrawer from '../components/Boursedrawer';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';
import { tCountry, tLevel, tFunding } from '@/utils/translateDB';

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
   LOGIN MODAL
═══════════════════════════════════════════════════════════════════ */
function LoginModal({ onClose, c, lang }) {
  const [email, setEmail]   = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const send = async () => {
    if (!email?.includes('@')) { setErrMsg('Email invalide'); return; }
    setStatus('sending');
    try {
      await axiosInstance.post('/api/users/request-magic-link', { email: email.trim().toLowerCase() });
      setStatus('success');
    } catch (e) { setStatus('error'); setErrMsg(e.response?.data?.message || 'Erreur serveur'); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)' }} />
      <div style={{ position:'relative', zIndex:3001, width:420, maxWidth:'92vw', background:c.surface, borderTop:`3px solid ${c.accent}`, boxShadow:'0 24px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 24px', background:c.accent }}>
          <span style={{ color:'#fff', fontSize:16 }}>🔐</span>
          <span style={{ fontFamily:c.fSerif, fontSize:16, fontWeight:600, color:'#fff', flex:1 }}>
            {lang==='fr' ? 'Connexion à OppsTrack' : 'Sign in to OppsTrack'}
          </span>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'#fff', width:28, height:28, cursor:'pointer', fontSize:16, borderRadius:4 }}>×</button>
        </div>
        <div style={{ padding:'28px 24px' }}>
          {status==='idle' && <>
            <input type="email" autoFocus placeholder="votre@email.com" value={email}
              onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
              style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', border:`1.5px solid ${c.rule}`, background:c.paper, color:c.ink, fontFamily:c.fSans, fontSize:14, outline:'none' }} />
            {errMsg && <div style={{ color:c.danger, fontSize:12, marginTop:6 }}>{errMsg}</div>}
            <button onClick={send} disabled={!email.trim()} style={{ width:'100%', marginTop:16, padding:12, background:email.trim()?c.accent:c.ruleSoft, color:email.trim()?'#fff':c.ink4, border:'none', fontFamily:c.fMono, fontSize:13, cursor:email.trim()?'pointer':'not-allowed' }}>
              ✉ {lang==='fr' ? 'Envoyer le lien magique' : 'Send magic link'}
            </button>
          </>}
          {status==='sending' && <div style={{ textAlign:'center', padding:'32px 0' }}>
            <div style={{ width:36, height:36, margin:'0 auto', border:`2px solid ${c.ruleSoft}`, borderTopColor:c.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          </div>}
          {status==='success' && <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>✉️</div>
            <div style={{ fontFamily:c.fSerif, fontSize:18, fontWeight:600, color:c.success, marginBottom:10 }}>Lien envoyé !</div>
            <button onClick={onClose} style={{ padding:'10px 28px', background:c.success, color:'#fff', border:'none', cursor:'pointer', fontFamily:c.fMono, fontSize:13 }}>✓ Fermer</button>
          </div>}
          {status==='error' && <div style={{ textAlign:'center', padding:'16px 0' }}>
            <p style={{ color:c.danger, marginBottom:16, fontSize:14 }}>{errMsg}</p>
            <button onClick={()=>{setStatus('idle');setErrMsg('');}} style={{ padding:'10px 24px', background:c.danger, color:'#fff', border:'none', cursor:'pointer', fontFamily:c.fMono, fontSize:12 }}>Réessayer</button>
          </div>}
        </div>
      </div>
    </div>
  );
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
function ScholarshipCard({ bourse, index, onAnalyze, onSave, onApply, isStarred, isApplied, c, lang }) {
  const [applyLoading, setApplyLoading] = useState(false);
  const formatDate = (date) => date ? new Date(date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : null;
  const animationDelay = `${index * 0.05}s`;
  
  const hasMatchScore = bourse.matchScore !== undefined;
  const col = hasMatchScore ? scoreColor(bourse.matchScore, c) : c.ink4;

  // ----- Détermination du statut -----
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

  return (
    <article
      onClick={() => onAnalyze(bourse)}
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
      {/* Contenu - sans image */}
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

        {/* Grille des métadonnées (pays, niveau) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px 16px', marginBottom: 8 }}>
          {bourse.pays && (
            <div style={{ fontSize: 13, color: c.ink2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>📍</span> <strong>Pays</strong> {tCountry(bourse.pays, lang)}
            </div>
          )}
          {bourse.niveau && (
            <div style={{ fontSize: 13, color: c.ink2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>🎓</span> <strong>Niveau</strong> {tLevel(bourse.niveau, lang)}
            </div>
          )}
        </div>

        {/* Domaine - ligne complète séparée */}
        {bourse.domaine && (
          <div style={{ marginBottom: 12, fontSize: 13, color: c.ink2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>📚</span> <strong>Domaine</strong> {bourse.domaine}
          </div>
        )}

        {/* Financement */}
        {bourse.financement && (
          <div style={{ marginBottom: 16, fontSize: 13, color: c.ink2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>💰</span> <strong>Financement</strong> {tFunding(bourse.financement, lang)}
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
          <button 
            onClick={(e) => { e.stopPropagation(); onSave(bourse, isStarred); }} 
            style={{ 
              padding: '6px 14px', fontSize: 11, fontWeight: 600, fontFamily: c.fMono,
              letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
              border: `1px solid ${c.rule}`, borderRadius: 0, transition: 'all 0.2s ease',
              background: isStarred ? c.accent : 'transparent', 
              color: isStarred ? c.paper : c.ink3 
            }}
          >
            {isStarred ? '★' : '☆'} Favori
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (isApplied || applyLoading) return;
              setApplyLoading(true);
              await onApply(bourse);
              setApplyLoading(false);
            }}
            style={{
              padding: '6px 14px', fontSize: 11, fontWeight: 600, fontFamily: c.fMono,
              letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
              border: 'none', borderRadius: 0, transition: 'all 0.2s ease',
              background: isApplied ? '#2e6b3e' : c.accent,
              color: '#fff',
              opacity: applyLoading ? 0.6 : 1
            }}
            disabled={isApplied || applyLoading}
          >
            {applyLoading ? '⏳' : (isApplied ? '✓' : '+')} {isApplied ? (lang === 'fr' ? 'Ajoutée' : 'Added') : (lang === 'fr' ? 'Postuler' : 'Apply')}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onAnalyze(bourse); }} 
            style={{ 
              padding: '6px 14px', fontSize: 11, fontWeight: 600, fontFamily: c.fMono,
              letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
              border: 'none', borderRadius: 0, transition: 'all 0.2s ease',
              background: c.accent, color: '#fff' 
            }}
          >
            Match IA
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
   CONSEILS IA PERSONNALISÉS — générés dynamiquement via l'IA
   FIX 3 : les conseils sont générés par appel webhook, pas en dur
═══════════════════════════════════════════════════════════════════ */
function ConseilsIA({ user, c, lang, handleQuickReply, setView }) {
  const [conseils, setConseils] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!user?.id || fetched.current) return;
    fetched.current = true;
    setLoading(true);
    setError(null);

    const fetchConseils = async () => {
      try {
        const res = await fetch(`${WEBHOOK_BASE}/webhook/recommandation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id, 
            userEmail: user.email 
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) throw new Error('Erreur serveur');
        
        const data = await res.json();
        setConseils(data);
      } catch (err) {
        console.error('[ConseilsIA]', err);
        setError(lang === 'fr' ? 'Impossible de charger les conseils' : 'Could not load advice');
      } finally {
        setLoading(false);
      }
    };

    fetchConseils();
  }, [user?.id, user?.email]);

  if (loading) return (
    <div style={{ background: c.surface, padding: '60px 32px', textAlign: 'center' }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${c.ruleSoft}`, borderTopColor: c.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
      <div style={{ fontSize: 13, color: c.ink3, fontFamily: c.fMono }}>
        {lang === 'fr' ? 'Génération des conseils IA...' : 'Generating AI advice...'}
      </div>
    </div>
  );

  if (error) return (
    <div style={{ background: c.surface, padding: '40px 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <p style={{ color: c.danger, fontSize: 14 }}>{error}</p>
      <button 
        onClick={() => { fetched.current = false; setError(null); setLoading(true); }} 
        style={{ marginTop: 16, padding: '8px 20px', background: c.danger, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: c.fMono, fontSize: 12 }}
      >
        {lang === 'fr' ? 'Réessayer' : 'Retry'}
      </button>
    </div>
  );

  if (!conseils || !conseils.conseils || conseils.conseils.length === 0) return null;

  return (
    <div style={{ background: c.surface, padding: '48px 32px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: c.fSerif, fontSize: 22, fontWeight: 700, color: c.ink, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
            {lang === 'fr' ? 'Conseils personnalisés' : 'Personalized advice'}
          </h2>
          <p style={{ fontSize: 14, color: c.ink3, margin: 0, lineHeight: 1.6 }}>
            {lang === 'fr'
              ? 'Basés sur votre profil réel — ces actions augmenteraient significativement vos chances.'
              : 'Based on your real profile — these actions would significantly boost your chances.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
          {conseils.conseils.map((conseil, i) => (
            <div key={i} style={{ background: c.paper2, border: `1px solid ${c.ruleSoft}`, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, paddingRight: 8 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{conseil.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: c.ink, lineHeight: 1.4 }}>{conseil.title}</span>
                </div>
                <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, color: conseil.gainColor || c.accent, fontFamily: c.fMono }}>{conseil.gain}</span>
              </div>
              <div style={{ fontSize: 12, color: c.ink3, lineHeight: 1.5 }}>{conseil.detail}</div>
              <button 
                onClick={() => {
                  if (conseil.action === 'chat' && handleQuickReply) {
                    handleQuickReply(conseil.actionData);
                  } else if (conseil.action === 'navigate' && setView) {
                    setView(conseil.actionData);
                  }
                }}
                style={{ 
                  alignSelf: 'flex-start', 
                  padding: '7px 20px', 
                  background: c.accent, 
                  color: '#fff', 
                  border: 'none', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  fontFamily: c.fMono 
                }}
                onMouseEnter={e => e.currentTarget.style.background = c.accentDark}
                onMouseLeave={e => e.currentTarget.style.background = c.accent}
              >
                {conseil.btnLabel}
              </button>
            </div>
          ))}
        </div>

        {conseils.potentiel && (
          <div style={{ background: `linear-gradient(135deg, ${c.accent}15, ${c.accent}05)`, border: `1px solid ${c.accent}30`, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: c.accent, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: c.fMono, marginBottom: 6 }}>
                {lang === 'fr' ? 'Potentiel de réussite' : 'Success potential'}
              </div>
              <div style={{ fontSize: 13, color: c.ink2, lineHeight: 1.6, maxWidth: 480 }}>
                {lang === 'fr'
                  ? `En appliquant ces ${conseils.conseils.length} conseil(s), votre taux de réussite atteindrait environ ${conseils.potentiel}%.`
                  : `By applying these ${conseils.conseils.length} tip(s), your success rate would reach approximately ${conseils.potentiel}%.`}
              </div>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: c.accent, fontFamily: c.fSerif, lineHeight: 1, letterSpacing: '-0.03em' }}>
                {conseils.potentiel}%
              </div>
              <div style={{ fontSize: 11, color: c.ink4, fontFamily: c.fMono, marginTop: 4 }}>
                {lang === 'fr' ? 'potentiel' : 'potential'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
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

  // FIX 2 — démarre directement en 'results' si l'user a déjà des données chargées
  const [phase,         setPhase]         = useState('welcome');
  const [generateStep,  setGenerateStep]  = useState(0);
  const [allScholarships, setAllScholarships] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [analysisBourse, setAnalysisBourse] = useState(null);
  const [selected,      setSelected]      = useState(null);
  const [starredNoms,   setStarredNoms]   = useState(new Set());
  const [appliedNoms,   setAppliedNoms]   = useState(new Set());
  const [activeFilter, setActiveFilter] = useState('perso');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentPage,   setCurrentPage]   = useState(1);
  const PAGE_SIZE = 8;
  const autoLoadTriggered = useRef(false);

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

  const STEPS = lang==='fr'
    ? ['Récupération de votre profil...', 'Chargement des bourses...', 'Calcul des scores IA...', 'Tri par compatibilité...']
    : ['Fetching your profile...', 'Loading scholarships...', 'Calculating AI scores...', 'Sorting by compatibility...'];

  /* ── FIX 2 : auto-chargement quand l'user arrive sur la page ──
     On ne montre plus le bouton "Générer" — on charge directement
  ── */
  useEffect(() => {
    if (!user?.id || autoLoadTriggered.current) return;
    autoLoadTriggered.current = true;
    setPhase('generating');
    loadData();
  }, [user?.id]);

  /* ── Chargement IA via webhook recommandation ── */
  const loadData = useCallback(async () => {
    if (!user?.id && !user?.email) return;
    setLoading(true);
    setError(null);
    setGenerateStep(0);

    const stepInterval = setInterval(() => {
      setGenerateStep(prev => prev >= STEPS.length-1 ? prev : prev+1);
    }, 600);

    try {
      const [favRes, roadmapRes] = await Promise.all([
        axiosInstance.get('/api/favoris', { params: { 'where[user][equals]': user.id, limit:1, depth:0 } }),
        axiosInstance.get(API_ROUTES.roadmap.list, { params: { 'where[userId][equals]': user.id, limit:100, depth:0 } }),
      ]);
      setStarredNoms(new Set((favRes.data.docs?.[0]?.bourses||[]).map(b=>b.nom?.trim().toLowerCase())));
      setAppliedNoms(new Set((roadmapRes.data.docs||[]).map(b=>b.nom?.trim().toLowerCase())));
      onStarChange?.((favRes.data.docs?.[0]?.bourses||[]).length);

      const res = await fetch(`${WEBHOOK_BASE}/webhook/recommandation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, userId: user.id }),
        signal: AbortSignal.timeout(20000),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const scored = (data.actives || []);
      clearInterval(stepInterval);
      setAllScholarships(scored);
      setGenerateStep(STEPS.length-1);
      setTimeout(() => setPhase('results'), 400);

    } catch (err) {
      clearInterval(stepInterval);
      try {
        const [userRes, boursesRes] = await Promise.all([
          axiosInstance.get(`/api/users/${user.id}`, { params:{depth:0} }),
          axiosInstance.get(API_ROUTES.bourses.list, { params:{limit:200, depth:0} }),
        ]);
        const profile = {
          niveau: userRes.data.niveau || user.niveau || '',
          domaine: userRes.data.domaine || user.domaine || '',
        };
        const scored = (boursesRes.data.docs||[]).map(b => {
          let score = 0;
          const matchReasons = [];
          if (b.tunisienEligible==='oui') { score+=30; matchReasons.push('Éligible Tunisie'); }
          if (profile.niveau && b.niveau?.toLowerCase().includes(profile.niveau.toLowerCase())) { score+=25; matchReasons.push(`Niveau ${b.niveau}`); }
          else if (!b.niveau || b.niveau.toLowerCase().includes('tous')) score+=12;
          if (profile.domaine && b.domaine?.toLowerCase().includes(profile.domaine.toLowerCase())) { score+=20; matchReasons.push(`Domaine ${b.domaine}`); }
          if (b.statut==='active') { score+=15; matchReasons.push('Candidatures ouvertes'); }
          if (b.dateLimite && Math.floor((new Date(b.dateLimite)-new Date())/86400000)>30) score+=3;
          return { ...b, matchScore:score, matchReasons };
        }).filter(b=>b.matchScore>0).sort((a,b)=>b.matchScore-a.matchScore);
        setAllScholarships(scored);
        setGenerateStep(STEPS.length-1);
        setTimeout(() => setPhase('results'), 400);
      } catch {
        setError(lang==='fr' ? 'Impossible de charger les recommandations.' : 'Could not load recommendations.');
        setPhase('welcome');
      }
    } finally {
      setLoading(false);
    }
  }, [user, onStarChange, lang]);

  /* ── Favoris ── */
  const handleStar = async (bourse, isStarred) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id) return;
    try {
      const { data } = await axiosInstance.get('/api/favoris', { params:{'where[user][equals]':user.id, limit:1, depth:0} });
      const doc = data.docs?.[0];
      if (isStarred) {
        if (!doc?.id) return;
        await axiosInstance.patch(`/api/favoris/${doc.id}`, { bourses:(doc.bourses||[]).filter(b=>b.nom?.trim().toLowerCase()!==nomKey) });
        setStarredNoms(prev=>{ const s=new Set(prev); s.delete(nomKey); onStarChange?.(s.size); return s; });
      } else {
        const nb = { nom:bourse.nom, pays:bourse.pays||'', lienOfficiel:bourse.lienOfficiel||'', financement:bourse.financement||'', dateLimite:bourse.dateLimite||null, ajouteLe:new Date().toISOString() };
        if (doc?.id) await axiosInstance.patch(`/api/favoris/${doc.id}`, { bourses:[...(doc.bourses||[]), nb] });
        else await axiosInstance.post('/api/favoris', { user:user.id, userEmail:user.email||'', bourses:[nb] });
        setStarredNoms(prev=>{ const s=new Set([...prev,nomKey]); onStarChange?.(s.size); return s; });
      }
      window.dispatchEvent(new CustomEvent('favoris-updated'));
    } catch(e) { console.error('[handleStar]', e); }
  };

  /* ── Postuler ── */
  const handleApply = async (bourse) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id || appliedNoms.has(nomKey)) return;
    try {
      const res = await axiosInstance.post(API_ROUTES.roadmap.create, {
        userId:user.id, userEmail:user.email||'', nom:bourse.nom, pays:bourse.pays||'',
        lienOfficiel:bourse.lienOfficiel||'', financement:bourse.financement||'',
        dateLimite:bourse.dateLimite||null, ajouteLe:new Date().toISOString(), statut:'en_cours', etapeCourante:0,
      });
      await axiosInstance.post(WEBHOOK_ROUTES.generateRoadmap, {
        roadmapId:res.data.doc.id,
        user:{ id:user.id, email:user.email, niveau:user.niveau, domaine:user.domaine },
        bourse:{ nom:bourse.nom, pays:bourse.pays, lien:bourse.lienOfficiel },
      });
      setAppliedNoms(prev=>new Set([...prev, nomKey]));
      window.dispatchEvent(new CustomEvent('roadmap-updated'));
      setTimeout(() => setView?.('roadmap'), 1000);
    } catch(e) { console.error('[handleApply]', e); }
  };

  useEffect(() => { setCurrentPage(1); }, [activeFilter]);
  useEffect(() => { if (activeFilter !== 'test') setSearchQuery(''); }, [activeFilter]);

  /* ── Filtrage ── */
  const filtered = useMemo(() => {
    let r = [...allScholarships];
    if (activeFilter === 'easy') {
      r = r.filter(s => s.matchScore >= 70);
    } else if (activeFilter === 'nolang') {
      r = r.filter(s => !((s.description||'').toLowerCase().includes('ielts') || (s.description||'').toLowerCase().includes('toefl')));
    } else if (activeFilter === 'deadline') {
      const d30 = new Date(Date.now() + 30*86400000);
      r = r.filter(s => s.dateLimite && new Date(s.dateLimite) <= d30 && new Date(s.dateLimite) >= new Date());
    } else if (activeFilter === 'perso') {
      r = r.filter(s => s.matchScore >= 40);
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
    if (activeFilter === 'test') return r.sort((a,b) => (a.nom || '').localeCompare(b.nom || ''));
    return r.sort((a,b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [allScholarships, activeFilter, searchQuery, fullBoursesList]);

  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const paged      = filtered.slice((safePage-1)*PAGE_SIZE, safePage*PAGE_SIZE);
  const stats = useMemo(() => ({
    high:   allScholarships.filter(s=>s.matchScore>=70).length,
    medium: allScholarships.filter(s=>s.matchScore>=40&&s.matchScore<70).length,
    low:    allScholarships.filter(s=>s.matchScore<40).length,
    total:  allScholarships.length,
  }), [allScholarships]);

  /* ── Non connecté ── */
  if (!user) return (
    <>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:c.paper, padding:24 }}>
        <div style={{ background:c.surface, border:`1px solid ${c.rule}`, padding:'48px 40px', maxWidth:400, width:'100%', textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🎓</div>
          <h3 style={{ fontFamily:c.fSerif, fontSize:22, fontWeight:700, color:c.ink, margin:'0 0 12px' }}>
            {lang==='fr' ? 'Recommandations personnalisées' : 'Personalized recommendations'}
          </h3>
          <p style={{ color:c.ink3, fontSize:14, lineHeight:1.6, margin:'0 0 28px' }}>
            {lang==='fr' ? 'Connectez-vous pour découvrir les bourses compatibles avec votre profil.' : 'Sign in to discover scholarships matching your profile.'}
          </p>
          <button onClick={()=>setShowLoginModal(true)} style={{ padding:'13px 36px', background:c.accent, color:'#fff', border:'none', fontSize:14, fontWeight:600, fontFamily:c.fMono, cursor:'pointer' }}>
            {lang==='fr' ? 'Se connecter' : 'Sign in'}
          </button>
        </div>
      </div>
      {showLoginModal && <LoginModal onClose={()=>setShowLoginModal(false)} c={c} lang={lang} />}
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </>
  );

  /* ── PHASE GENERATING ── */
  if (phase === 'generating') return (
    <div style={{ minHeight:'100vh', background:c.paper, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:c.surface, border:`1px solid ${c.rule}`, padding:'56px 48px', maxWidth:480, width:'100%', textAlign:'center' }}>
        <div style={{ width:52, height:52, border:`3px solid ${c.ruleSoft}`, borderTopColor:c.accent, borderRadius:'50%', animation:'spin 0.9s linear infinite', margin:'0 auto 28px' }} />
        <h3 style={{ fontFamily:c.fSerif, fontSize:22, fontWeight:700, color:c.ink, marginBottom:28 }}>
          {lang==='fr' ? 'Analyse IA en cours...' : 'AI analysis in progress...'}
        </h3>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {STEPS.map((step,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 16px', background:i<=generateStep?`${c.accent}10`:c.paper2, border:`1px solid ${i<=generateStep?`${c.accent}30`:c.ruleSoft}`, transition:'all 0.3s ease' }}>
              <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, background:i<generateStep?c.success:i===generateStep?c.accent:c.ruleSoft, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {i<generateStep ? <span style={{ color:'#fff', fontSize:11 }}>✓</span>
                 : i===generateStep ? <div style={{ width:8, height:8, borderRadius:'50%', background:'#fff', animation:'pulse 1s infinite' }} />
                 : null}
              </div>
              <span style={{ fontSize:13, color:i<=generateStep?c.ink2:c.ink4, fontFamily:c.fSans, textAlign:'left' }}>{step}</span>
            </div>
          ))}
        </div>
        {error && (
          <div style={{ marginTop:20, padding:'12px 16px', background:c.dangerBg, color:c.danger, fontSize:13, borderLeft:`3px solid ${c.danger}` }}>
            {error}
            <button onClick={()=>{setPhase('welcome');setError(null);}} style={{ marginLeft:12, color:c.danger, background:'none', border:'none', cursor:'pointer', textDecoration:'underline', fontSize:12 }}>
              Réessayer
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}} @keyframes pulse{0%,100%{transform:scale(0.8);opacity:0.5;}50%{transform:scale(1.1);opacity:1;}}`}</style>
    </div>
  );

  /* ── PHASE RESULTS ── */
  return (
    <main style={{ background:c.paper, color:c.ink, fontFamily:c.fSans, minHeight:'100vh' }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes cardIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(40px);}to{opacity:1;transform:translateX(0);}}
        @keyframes pulse{0%,100%{transform:scale(0.8);opacity:0.5;}50%{transform:scale(1.1);opacity:1;}}
      `}</style>

      {/* ── Hero ── */}
      <div style={{ background:c.paper2, padding:'40px 32px', textAlign:'center', borderBottom:`1px solid ${c.rule}`, animation:'fadeIn 0.5s ease' }}>
        <h1 style={{ fontFamily:c.fSerif, fontSize:'clamp(28px,4vw,44px)', fontWeight:700, letterSpacing:'-0.02em', color:c.ink, margin:'0 0 10px' }}>
          {lang==='fr'
            ? <>L’<em style={{ color:c.accent, fontStyle:'italic' }}>IA </em>a trouvé vos <em style={{ color:c.accent, fontStyle:'italic' }}>meilleures opportunités</em>.</>
            : <>Your <em style={{ color:c.accent, fontStyle:'italic' }}>personalized recommendations</em>.</>}
        </h1>
        <p style={{ fontFamily:c.fSans, fontSize:15, color:c.ink2, maxWidth:520, margin:'0 auto 24px' }}>
          {lang==='fr'
            ? `${stats.total} opportunités à fort potentiel vous attendent dès maintenant.`
            : `${stats.total} scholarships analyzed by AI — ${stats.high} great fits, ${stats.medium} with good potential.`}
        </p>
        <button
  onClick={() => { 
    autoLoadTriggered.current = false; 
    setPhase('generating');  // ✅ Repasse en phase "generating" pour afficher l'alerte
    setGenerateStep(0);       // ✅ Reset les étapes
    setError(null);           // ✅ Efface les erreurs
    loadData(); 
  }}
  style={{ background:'transparent', border:`1px solid ${c.rule}`, color:c.ink3, padding:'7px 18px', fontSize:12, cursor:'pointer', fontFamily:c.fMono }}
>
  ↺ {lang==='fr' ? 'Actualiser' : 'Refresh'}
</button>
      </div>

{/* ── Filtres intelligents (design onglets centrés) ── */}
<div style={{ background: '#ffffff', borderBottom: `1px solid #e5e5e5`, padding: '0 32px' }}>
  <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 8, marginTop: 24, marginBottom: activeFilter === 'test' ? 0 : 24 }}>
    {[
      { id: 'perso', label: lang === 'fr' ? 'Recommandations' : 'Recommendations' },
      { id: 'test', label: lang === 'fr' ? 'Vérifier' : 'Verify'},
      { id: 'conseils', label: lang === 'fr' ? 'Conseils' : 'Advice' },
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
            flex: 1,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: isActive ? '#0066b3' : '#ffffff',
            color: isActive ? '#ffffff' : '#666666',
            border: isActive ? 'none' : '1px solid #e0e0e0',
            borderRadius: 0,
            fontSize: 13,
            fontWeight: isActive ? 600 : 500,
            cursor: 'pointer',
            fontFamily: c.fSans,
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: 16 }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      );
    })}
  </div>
</div>


      {/* Barre de recherche pour l'onglet test */}
      {activeFilter === 'test' && (
         <div style={{ background:'#ffffff', padding:'24px 32px 0' }}>
  <div style={{ maxWidth:960, margin:'0 auto' }}>
          <div style={{ display:'flex', gap:12, alignItems:'center', background:'#ffffff', padding:'8px 16px', border:`1px solid #e0e0e0`, borderRadius:40 }}>
            <span style={{ fontSize:18 }}>🔍</span>
            <input
              type="text"
              placeholder={lang === 'fr' ? 'Nom de la bourse, pays...' : 'Scholarship name, country...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex:1, background:'transparent', border:'none', padding:'12px 0', outline:'none', color:c.ink, fontSize:14 }}
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:c.ink3, padding:'0 8px' }}>
                ✕
              </button>
            )}
          </div>
          {loadingFull && <div style={{ textAlign:'center', padding:20, fontSize:13, color:c.ink3 }}>Chargement des bourses...</div>}
        </div>
        </div>
      )}

      {/* ── Liste ── */}
      {activeFilter === 'conseils' ? (
  <ConseilsIA
    user={user}
    c={c}
    lang={lang}
    handleQuickReply={handleQuickReply}
    setView={setView}
  />
) : (
  <div style={{ maxWidth:960, margin:'0 auto', padding:'32px 32px 80px' }}>
        {error && (
          <div style={{ padding:'14px 20px', background:c.dangerBg, borderLeft:`3px solid ${c.danger}`, marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13 }}>
            <span style={{ color:c.danger }}>{error}</span>
            <button onClick={loadData} style={{ padding:'6px 16px', background:c.danger, color:'#fff', border:'none', cursor:'pointer', fontFamily:c.fMono, fontSize:11 }}>
              {lang==='fr' ? 'Réessayer' : 'Retry'}
            </button>
          </div>
        )}

        {paged.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <div style={{ fontSize:48, marginBottom:16, color:c.ink4 }}>○</div>
            <div style={{ fontFamily:c.fSerif, fontSize:18, fontWeight:600, color:c.ink, marginBottom:8 }}>
              {lang==='fr' ? 'Aucun résultat' : 'No results'}
            </div>
            <p style={{ color:c.ink3, fontSize:13 }}>
              {activeFilter === 'test'
                ? (lang==='fr' ? 'Commencez à taper le nom d\'une bourse ou d\'un pays.' : 'Start typing a scholarship name or country.')
                : (lang==='fr' ? 'Complétez votre profil pour de meilleures suggestions.' : 'Complete your profile for better suggestions.')}
            </p>
          </div>
        ) : (
          <>
            {paged.map((bourse, i) => (
              <ScholarshipCard
                key={bourse.id}
                bourse={bourse}
                index={i}
                onAnalyze={setAnalysisBourse}
                onSave={handleStar}
                onApply={handleApply}
                isStarred={starredNoms.has(bourse.nom?.trim().toLowerCase())}
                isApplied={appliedNoms.has(bourse.nom?.trim().toLowerCase())}
                c={c}
                lang={lang}
              />
            ))}
            {totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:12, paddingTop:32, borderTop:`1px solid ${c.rule}`, marginTop:8 }}>
                <button onClick={()=>{setCurrentPage(p=>Math.max(1,p-1));window.scrollTo({top:0,behavior:'smooth'});}} disabled={safePage===1}
                  style={{ padding:'8px 20px', background:'transparent', border:`1px solid ${safePage===1?c.ruleSoft:c.rule}`, color:safePage===1?c.ink4:c.ink2, fontSize:12, cursor:safePage===1?'default':'pointer', fontFamily:c.fMono }}>
                  ← {lang==='fr'?'Précédent':'Previous'}
                </button>
                <span style={{ fontSize:12, fontFamily:c.fMono, color:c.ink3 }}>
                  <span style={{ color:c.accent, fontWeight:600 }}>{safePage}</span> / {totalPages}
                </span>
                <button onClick={()=>{setCurrentPage(p=>Math.min(totalPages,p+1));window.scrollTo({top:0,behavior:'smooth'});}} disabled={safePage===totalPages}
                  style={{ padding:'8px 20px', background:'transparent', border:`1px solid ${safePage===totalPages?c.ruleSoft:c.rule}`, color:safePage===totalPages?c.ink4:c.ink2, fontSize:12, cursor:safePage===totalPages?'default':'pointer', fontFamily:c.fMono }}>
                  {lang==='fr'?'Suivant':'Next'} →
                </button>
              </div>
            )}
          </>
        )}
      </div>
      )}

     

      {/* ── Drawers ── */}
      {analysisBourse && (
        <MatchAnalysisPanel
          bourse={analysisBourse}
          user={user}
          onClose={()=>setAnalysisBourse(null)}
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
          onClose={()=>setSelected(null)}
          onAskAI={()=>{}}
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