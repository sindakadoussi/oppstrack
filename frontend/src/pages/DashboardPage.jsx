// DashboardPage.jsx — version style éditorial (tokens unipd.it)
"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';
import BourseDrawer from '../components/Boursedrawer';
import ChatInput from '../components/ChatInput';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';

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

/* ═══════════════════════════════════════════════════════════════════════════
   COMPOSANTS INTERNES (adaptés avec tokens)
═══════════════════════════════════════════════════════════════════════════ */

// ── Login Modal (style éditorial) ──
function LoginModal({ onClose, c, lang }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const send = async () => {
    if (!email || !email.includes('@')) { setErrMsg(lang === 'fr' ? 'Email invalide' : 'Invalid email'); return; }
    setStatus('sending');
    try {
      await axiosInstance.post('/api/users/request-magic-link', { email: email.trim().toLowerCase() });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrMsg(err.response?.data?.message || (lang === 'fr' ? 'Erreur serveur' : 'Server error'));
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', zIndex: 2001, width: 400, maxWidth: '92vw', background: c.surface, borderTop: `3px solid ${c.accent}`, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', background: c.paper2, borderBottom: `1px solid ${c.rule}` }}>
          <span style={{ fontSize: 22 }}>🔐</span>
          <span style={{ fontFamily: c.fSerif, fontWeight: 700, fontSize: 16, color: c.ink }}>{lang === 'fr' ? 'Connexion à OppsTrack' : 'Sign in to OppsTrack'}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: c.ink3 }} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '24px' }}>
          {status === 'idle' && (
            <>
              <p style={{ fontFamily: c.fSans, fontSize: 13, color: c.ink2, marginBottom: 20, lineHeight: 1.5 }}>
                {lang === 'fr' ? 'Entrez votre email pour recevoir un lien magique.' : 'Enter your email to receive a magic link.'}
              </p>
              <input type="email" placeholder={lang === 'fr' ? 'votre@email.com' : 'your@email.com'} value={email} autoFocus onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${c.ruleSoft}`, background: c.paper, color: c.ink, fontSize: 13, outline: 'none', fontFamily: c.fSans }} />
              {errMsg && <div style={{ color: c.danger, fontSize: 11, marginTop: 6 }}>{errMsg}</div>}
              <button style={{ width: '100%', marginTop: 16, padding: '10px', background: c.accent, color: c.paper, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono, letterSpacing: '0.05em' }} onClick={send}>
                ✉️ {lang === 'fr' ? 'Envoyer le lien magique' : 'Send magic link'}
              </button>
            </>
          )}
          {status === 'sending' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 32, height: 32, border: `3px solid ${c.ruleSoft}`, borderTopColor: c.accent, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              <p style={{ color: c.ink2, marginTop: 14 }}>{lang === 'fr' ? 'Envoi...' : 'Sending...'}</p>
            </div>
          )}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✉️</div>
              <div style={{ fontFamily: c.fSerif, fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 8 }}>{lang === 'fr' ? 'Lien envoyé !' : 'Link sent!'}</div>
              <p style={{ color: c.ink2, fontSize: 12, lineHeight: 1.5 }}>{lang === 'fr' ? 'Vérifiez votre boîte mail.' : 'Check your inbox.'}</p>
              <button style={{ width: '100%', marginTop: 16, padding: '10px', background: '#166534', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={onClose}>
                ✓ {lang === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </div>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: c.danger, marginBottom: 12 }}>{errMsg}</p>
              <button style={{ width: '100%', marginTop: 16, padding: '10px', background: c.accent, color: c.paper, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => { setStatus('idle'); setErrMsg(''); }}>
                {lang === 'fr' ? 'Réessayer' : 'Retry'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers (inchangés, mais adaptés pour utiliser c si besoin) ──
function getTotal(item) {
  if (Array.isArray(item.etapes)) return item.etapes.length;
  if (typeof item.etapes === 'string' && item.etapes.trim().startsWith('[')) {
    try { const p = JSON.parse(item.etapes); if (Array.isArray(p)) return p.length; } catch {}
  }
  return 5;
}
function getProgress(item) {
  return Math.min((item.etapeCourante || 0) + 1, getTotal(item));
}
function isItemDone(item) {
  const total = getTotal(item);
  return total > 0 && (item.etapeCourante || 0) >= total - 1;
}
function daysLeft(deadline, lang = 'fr') {
  const diff = Math.round((new Date(deadline) - new Date()) / 86400000);
  if (diff < 0)   return { label: lang === 'fr' ? 'Expiré' : 'Expired', color: '#dc2626' };
  if (diff <= 7)  return { label: `${diff}${lang === 'fr' ? 'j' : 'd'}`, color: '#d97706' };
  if (diff <= 30) return { label: `${diff}${lang === 'fr' ? 'j' : 'd'}`, color: '#2563eb' };
  return { label: `${diff}${lang === 'fr' ? 'j' : 'd'}`, color: '#166534' };
}

// ── AnimatedCounter ──
function useAnimatedCounter(target, duration = 1000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let n = 0; const steps = 30; const inc = target / steps; const iv = duration / steps;
    const t = setInterval(() => { n = Math.min(n + inc, target); setVal(Math.round(n)); if (n >= target) clearInterval(t); }, iv);
    return () => clearInterval(t);
  }, [target]);
  return val;
}

// ── AnimatedRing (style épuré) ──
function AnimatedRing({ pct, size = 90, strokeWidth = 7, color, children }) {
  const r = (size - strokeWidth * 2) / 2, circ = 2 * Math.PI * r;
  const [dash, setDash] = useState(0);
  useEffect(() => { const t = setTimeout(() => setDash((pct / 100) * circ), 100); return () => clearTimeout(t); }, [pct, circ]);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{ transition: 'stroke-dasharray 1.2s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

// ── Sparkline (adapté avec c) ──
function Sparkline({ data, color, height = 60, lang = 'fr' }) {
  const ref = useRef(null);
  const [w, setW] = useState(200);
  useEffect(() => { if (ref.current) setW(ref.current.offsetWidth || 200); }, []);
  if (!data || data.length < 2) return <div ref={ref} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: '#94a3b8', fontSize: 12 }}>{lang === 'fr' ? 'Données insuffisantes' : 'Insufficient data'}</div>;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1, pad = 6;
  const pts = data.map((v, i) => `${pad + (i / (data.length - 1)) * (w - pad * 2)},${height - pad - ((v - min) / range) * (height - pad * 2)}`).join(' ');
  const area = `${pts} ${pad + (data.length - 1) / (data.length - 1) * (w - pad * 2)},${height} ${pad},${height}`;
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
        <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        <polyline points={area} fill="url(#sg)" stroke="none" />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => {
          const x = pad + (i / (data.length - 1)) * (w - pad * 2);
          const y = height - pad - ((v - min) / range) * (height - pad * 2);
          return <g key={i}><circle cx={x} cy={y} r="5" fill={color} /><circle cx={x} cy={y} r="2.5" fill="#f5a623" /><text x={x} y={y - 9} textAnchor="middle" fontSize="9" fill="#64748b">{v}</text></g>;
        })}
      </svg>
    </div>
  );
}

// ── ActivityHeatmap (adapté) ──
function ActivityHeatmap({ activities, c, lang }) {
  const weeks = 18, today = new Date();
  const actMap = {};
  activities.forEach(a => { actMap[a.date] = (actMap[a.date] || 0) + 1; });
  const cells = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today); date.setDate(today.getDate() - w * 7 - (6 - d));
      const key = date.toISOString().split('T')[0];
      week.push({ key, count: actMap[key] || 0, isToday: key === today.toISOString().split('T')[0] });
    }
    cells.push(week);
  }
  const colorFor = n => n === 0 ? '#f1f5f9' : n === 1 ? '#bfdbfe' : n === 2 ? '#3b82f6' : c.accent;
  return (
    <div>
      <div style={{ display: 'flex', gap: 3, overflowX: 'auto' }}>
        {cells.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {week.map(cell => (
              <div key={cell.key} title={`${cell.key} · ${cell.count} ${lang === 'fr' ? 'action' : 'action'}${cell.count > 1 ? 's' : ''}`}
                style={{ width: 11, height: 11, background: colorFor(cell.count), border: cell.isToday ? `1.5px solid ${c.warn}` : 'none', flexShrink: 0 }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 9, color: c.ink3 }}>{lang === 'fr' ? 'Moins' : 'Less'}</span>
        {['#f1f5f9', '#bfdbfe', '#3b82f6', c.accent].map((col, i) => <div key={i} style={{ width: 9, height: 9, background: col }} />)}
        <span style={{ fontSize: 9, color: c.ink3 }}>{lang === 'fr' ? 'Plus' : 'More'}</span>
      </div>
    </div>
  );
}

// ── TodayBlock (adapté avec tokens) ──
function TodayBlock({ roadmap, deadlines, scores, setView, c, lang }) {
  const today = new Date();
  const items = [];
  deadlines.slice(0, 2).forEach(d => {
    const diff = Math.round((d.deadline - today) / 86400000);
    if (diff >= 0 && diff <= 7) {
      items.push({ icon: '⚡', color: c.danger, bg: '#fef2f2', text: `${lang === 'fr' ? 'Deadline' : 'Deadline'}: ${d.nom}`, sub: `${lang === 'fr' ? 'Dans' : 'In'} ${diff}${lang === 'fr' ? 'j' : 'd'}`, view: 'roadmap' });
    }
  });
  const nextRm = roadmap.find(r => !isItemDone(r) && getProgress(r) > 0);
  if (nextRm) {
    items.push({ icon: '📋', color: c.accent, bg: '#eff6ff', text: `${lang === 'fr' ? 'Avancer' : 'Continue'}: ${nextRm.nom}`, sub: `${lang === 'fr' ? 'Étape' : 'Step'} ${getProgress(nextRm)}/${getTotal(nextRm)}`, view: 'roadmap' });
  }
  if (scores.length === 0) {
    items.push({ icon: '🎙️', color: '#166534', bg: '#f0fdf4', text: lang === 'fr' ? 'Ton 1er entretien IA' : 'Your 1st AI interview', sub: lang === 'fr' ? '15 min · Booste ton profil' : '15 min · Boost your profile', view: 'entretien' });
  } else if (scores.length < 3) {
    items.push({ icon: '🎙️', color: '#166534', bg: '#f0fdf4', text: `${lang === 'fr' ? 'Entretien' : 'Interview'} #${scores.length + 1}`, sub: `${lang === 'fr' ? 'Dernier' : 'Last'}: ${scores[0]?.scoreNum || '?'}/100`, view: 'entretien' });
  }
  if (items.length === 0) {
    items.push({ icon: '✅', color: '#166534', bg: '#f0fdf4', text: lang === 'fr' ? 'Tout est à jour !' : 'All up to date!', sub: lang === 'fr' ? 'Continue comme ça 💪' : 'Keep it up 💪' });
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.slice(0, 3).map((item, i) => (
        <div key={i} onClick={() => item.view && setView && setView(item.view)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: item.bg, borderLeft: `3px solid ${item.color}`, cursor: item.view ? 'pointer' : 'default', transition: 'transform 0.15s' }}
          onMouseEnter={e => { if (item.view) e.currentTarget.style.transform = 'translateX(3px)'; }}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
          <div style={{ width: 34, height: 34, background: item.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: item.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text}</div>
            <div style={{ fontSize: 10, color: c.ink3 }}>{item.sub}</div>
          </div>
          {item.view && <span style={{ fontSize: 14, color: item.color + '80' }}>›</span>}
        </div>
      ))}
    </div>
  );
}

// ── StreakWidget (adapté) ──
function StreakWidget({ activities, c, lang }) {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const k = d.toISOString().split('T')[0];
    if (activities.some(a => a.date === k)) streak++;
    else if (i > 0) break;
  }
  const days = lang === 'fr' ? ['D', 'L', 'M', 'M', 'J', 'V', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i));
    const k = d.toISOString().split('T')[0];
    return { day: days[d.getDay()], active: activities.some(a => a.date === k), isToday: i === 6 };
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div style={{ fontSize: 28, fontWeight: 900, color: c.accent, lineHeight: 1 }}>{streak}</div><div style={{ fontSize: 10, color: c.ink3 }}>{lang === 'fr' ? 'jours consécutifs' : 'days streak'}</div></div>
        <span style={{ fontSize: 34 }}>{streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '💤'}</span>
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {weekDays.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: '100%', aspectRatio: '1', background: d.active ? c.accent : c.ruleSoft, border: d.isToday ? `2px solid ${c.warn}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {d.active && <span style={{ fontSize: 8, color: c.paper }}>✓</span>}
            </div>
            <span style={{ fontSize: 7, color: c.ink3 }}>{d.day}</span>
          </div>
        ))}
      </div>
      {streak >= 3 && (
        <div style={{ padding: '6px 10px', background: streak >= 7 ? '#fff8e1' : '#eff6ff', border: `1px solid ${streak >= 7 ? '#fde68a' : '#bfdbfe'}`, fontSize: 10, color: streak >= 7 ? '#856404' : c.accent, textAlign: 'center', fontWeight: 600 }}>
          {streak >= 7 ? (lang === 'fr' ? `🔥 Série de ${streak} jours !` : `🔥 ${streak}-day streak!`) : (lang === 'fr' ? `⚡ ${streak} jours de suite` : `⚡ ${streak} days in a row`)}
        </div>
      )}
    </div>
  );
}

// ── MiniBarChart (adapté) ──
function MiniBarChart({ data, color, height = 48 }) {
  const max = Math.max(...data.map(d => d.val), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: '100%', height: Math.max(3, Math.round((d.val / max) * height * 0.85)), background: d.val > 0 ? color : '#f1f5f9', transition: 'height 0.6s ease', opacity: 0.7 + (d.val / max) * 0.3 }} />
          <span style={{ fontSize: 8, color: '#94a3b8', whiteSpace: 'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── SmartTips (adapté avec tokens) ──
function SmartTips({ user, scores, roadmap, urgentDeadlines, setView, c, lang }) {
  const [currentTip, setCurrentTip] = useState(0);
  const [fade, setFade] = useState(true);

  const tips = useMemo(() => {
    const t = { urgent: [], medium: [], low: [] };
    if (urgentDeadlines.length > 0) {
      t.urgent.push({
        id: 'deadline', icon: '⚡',
        title: `${urgentDeadlines.length} ${lang === 'fr' ? 'deadline' : 'deadline'}${urgentDeadlines.length > 1 ? (lang === 'fr' ? 's urgente' : 's urgent') : (lang === 'fr' ? ' urgente' : ' urgent')}`,
        description: `${urgentDeadlines.slice(0, 2).map(d => d.nom).join(', ')} ${lang === 'fr' ? 'à rendre sous' : 'due in'} ${Math.min(...urgentDeadlines.map(d => Math.round((d.deadline - new Date()) / 86400000)))}${lang === 'fr' ? 'j' : 'd'}`,
        action: lang === 'fr' ? 'Voir les deadlines' : 'View deadlines', view: 'roadmap', color: c.danger, bg: '#fef2f2', border: '#fecaca'
      });
    }
    if (!user?.motivationSummary) {
      t.medium.push({
        id: 'motivation', icon: '✍️', title: lang === 'fr' ? 'Lettre de motivation manquante' : 'Missing motivation letter',
        description: lang === 'fr' ? 'C\'est souvent le 1er critère des jurys. Rédige une lettre personnalisée pour chaque bourse.' : 'This is often the #1 criterion for juries. Write a personalized letter for each scholarship.',
        action: lang === 'fr' ? 'Rédiger ma lettre' : 'Write my letter', view: 'profil', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe'
      });
    }
    if (!user?.gpa) {
      t.medium.push({
        id: 'gpa', icon: '🎓', title: lang === 'fr' ? 'Moyenne académique non renseignée' : 'Academic GPA not set',
        description: lang === 'fr' ? 'Ta moyenne est un critère clé pour l\'éligibilité aux bourses.' : 'Your GPA is a key criterion for scholarship eligibility.',
        action: lang === 'fr' ? 'Ajouter ma moyenne' : 'Add my GPA', view: 'profil', color: '#d97706', bg: '#fffbeb', border: '#fde68a'
      });
    }
    if (!user?.languages || user.languages.length === 0) {
      t.medium.push({
        id: 'languages', icon: '🌍', title: lang === 'fr' ? 'Ajoute tes langues' : 'Add your languages',
        description: lang === 'fr' ? 'Les bourses internationales exigent souvent B2 en anglais.' : 'International scholarships often require B2 level in English.',
        action: lang === 'fr' ? 'Ajouter mes langues' : 'Add my languages', view: 'profil', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc'
      });
    }
    if (scores.length === 0) {
      t.medium.push({
        id: 'interview', icon: '🎙️', title: lang === 'fr' ? 'Prépare tes entretiens' : 'Prepare your interviews',
        description: lang === 'fr' ? 'Les candidats qui s\'entraînent obtiennent 23% de meilleures évaluations.' : 'Candidates who practice get 23% better evaluations on average.',
        action: lang === 'fr' ? 'Démarrer un entretien' : 'Start an interview', view: 'entretien', color: '#166534', bg: '#f0fdf4', border: '#bbf7d0'
      });
    } else if (scores.length < 3) {
      t.medium.push({
        id: 'interview-more', icon: '🎙️', title: `${lang === 'fr' ? 'Entretien' : 'Interview'} #${scores.length + 1}`,
        description: lang === 'fr' ? `Ton dernier score: ${scores[0]?.scoreNum || '?'}/100. Continue à t'entraîner !` : `Your last score: ${scores[0]?.scoreNum || '?'}/100. Keep practicing!`,
        action: lang === 'fr' ? 'Nouvel entretien' : 'New interview', view: 'entretien', color: c.accent, bg: '#eff6ff', border: '#bfdbfe'
      });
    }
    if (roadmap.length === 0) {
      t.medium.push({
        id: 'roadmap-empty', icon: '📋', title: lang === 'fr' ? 'Crée ta roadmap' : 'Create your roadmap',
        description: lang === 'fr' ? 'Ajoute des bourses à ta roadmap pour suivre tes candidatures.' : 'Add scholarships to your roadmap to track your applications.',
        action: lang === 'fr' ? 'Explorer les bourses' : 'Explore scholarships', view: 'bourses', color: c.accent, bg: '#eff6ff', border: '#bfdbfe'
      });
    }
    if (t.urgent.length === 0 && t.medium.length < 3) {
      t.low.push({ id: 'star-method', icon: '🗣️', title: lang === 'fr' ? 'Méthode STAR' : 'STAR Method', description: lang === 'fr' ? 'Structure tes réponses: Situation → Tâche → Action → Résultat.' : 'Structure your answers: Situation → Task → Action → Result.', color: c.ink3, bg: c.paper2, border: c.rule });
      t.low.push({ id: 'recommendations', icon: '⏰', title: lang === 'fr' ? 'Lettres de recommandation' : 'Recommendation letters', description: lang === 'fr' ? 'Demande-les au moins 6 semaines à l\'avance.' : 'Request them at least 6 weeks in advance.', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' });
      t.low.push({ id: 'countries', icon: '🗺️', title: lang === 'fr' ? 'Diversifie tes cibles' : 'Diversify your targets', description: lang === 'fr' ? 'Ne te limite pas à un seul pays. Regarde l\'Allemagne, les Pays-Bas, la Suisse.' : 'Don\'t limit yourself to one country. Check Germany, Netherlands, Switzerland.', action: lang === 'fr' ? 'Voir la carte' : 'View map', view: 'dashboard', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' });
    }
    return [...t.urgent, ...t.medium, ...t.low];
  }, [user, scores, roadmap, urgentDeadlines, lang, c]);

  useEffect(() => {
    if (tips.length <= 1) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => { setCurrentTip(i => (i + 1) % tips.length); setFade(true); }, 250);
    }, 6000);
    return () => clearInterval(interval);
  }, [tips.length]);

  const tip = tips[currentTip] || tips[0];
  if (!tip) return null;
  return (
    <div style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.25s ease' }}>
      <div style={{ padding: '16px', background: tip.bg, border: `1px solid ${tip.border}`, borderLeft: `4px solid ${tip.color}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: `${tip.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{tip.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: tip.color, marginBottom: 6 }}>{tip.title}</div>
            <div style={{ fontSize: 11, color: c.ink2, lineHeight: 1.5 }}>{tip.description}</div>
            {tip.action && tip.view && (
              <button onClick={() => setView(tip.view)} style={{ marginTop: 10, padding: '6px 14px', background: tip.color, color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono }}>
                {tip.action} →
              </button>
            )}
          </div>
        </div>
      </div>
      {tips.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'center' }}>
          {tips.map((_, i) => (
            <div key={i} onClick={() => { setFade(false); setTimeout(() => { setCurrentTip(i); setFade(true); }, 200); }}
              style={{ width: i === currentTip ? 20 : 6, height: 4, background: i === currentTip ? tip.color : c.rule, transition: 'all 0.2s', cursor: 'pointer' }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── ProfileStrength (adapté) ──
function ProfileStrength({ user, scores, setView, c, lang }) {
  const sections = useMemo(() => [
    { label: lang === 'fr' ? 'Informations de base' : 'Basic info', pct: ['name', 'email', 'phone', 'nationality'].filter(f => user?.[f]).length / 4 * 100, color: '#166534', icon: '👤' },
    { label: lang === 'fr' ? 'Formation académique' : 'Academic education', pct: ['currentLevel', 'fieldOfStudy', 'institution', 'gpa'].filter(f => user?.[f]).length / 4 * 100, color: c.accent, icon: '🎓' },
    { label: lang === 'fr' ? 'Expériences & projets' : 'Experience & projects', pct: Math.min(100, ((user?.workExperience?.length || 0) * 25) + ((user?.academicProjects?.length || 0) * 25)), color: '#d97706', icon: '💼' },
    { label: lang === 'fr' ? 'Compétences & langues' : 'Skills & languages', pct: Math.min(100, ((user?.languages?.length || 0) * 33) + ((user?.skills?.length || 0) * 33)), color: '#7c3aed', icon: '🌍' },
    { label: lang === 'fr' ? 'Entretiens simulés' : 'Mock interviews', pct: Math.min(100, (scores?.length || 0) * 33), color: '#f43f5e', icon: '🎙️' },
    { label: lang === 'fr' ? 'Objectifs définis' : 'Goals defined', pct: (['targetDegree', 'motivationSummary'].filter(f => user?.[f]).length / 2 * 100) + (user?.targetCountries?.length > 0 ? 50 : 0), color: '#0891b2', icon: '🎯' },
  ], [user, scores, lang, c]);
  const completion = Math.round(sections.reduce((s, p) => s + p.pct, 0) / sections.length);
  const grade = completion >= 80 ? { label: lang === 'fr' ? 'Excellent' : 'Excellent', color: '#166534' } : completion >= 60 ? { label: lang === 'fr' ? 'Bon' : 'Good', color: c.accent } : completion >= 40 ? { label: lang === 'fr' ? 'En progression' : 'In progress', color: '#d97706' } : { label: lang === 'fr' ? 'À renforcer' : 'Needs work', color: c.danger };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: `2px solid ${grade.color}20` }}>
        <div>
          <div style={{ fontSize: 11, color: c.ink3 }}>{lang === 'fr' ? 'Score global' : 'Overall score'}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: grade.color }}>{completion}%</div>
          <div style={{ fontSize: 10, color: grade.color, marginTop: 2 }}>{grade.label}</div>
        </div>
        <AnimatedRing pct={completion} size={50} strokeWidth={5} color={grade.color}>
          <span style={{ fontSize: 12, fontWeight: 800, color: grade.color }}>{completion}%</span>
        </AnimatedRing>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sections.map((sec, idx) => (
          <div key={idx}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ fontSize: 12 }}>{sec.icon}</span><span style={{ fontSize: 10, fontWeight: 600, color: c.ink2 }}>{sec.label}</span></div>
              <span style={{ fontSize: 10, fontWeight: 700, color: sec.color }}>{Math.round(sec.pct)}%</span>
            </div>
            <div style={{ height: 4, background: c.ruleSoft, overflow: 'hidden' }}><div style={{ height: '100%', width: `${sec.pct}%`, background: sec.color, transition: 'width 0.8s ease' }} /></div>
          </div>
        ))}
      </div>
      <button onClick={() => setView('profil')} style={{ width: '100%', marginTop: 14, padding: '8px', background: c.accent, color: c.paper, border: 'none', fontSize: 11, fontWeight: 600, fontFamily: c.fMono, cursor: 'pointer' }}>
        {completion < 60 ? (lang === 'fr' ? '📝 Compléter mon profil' : '📝 Complete my profile') : (lang === 'fr' ? '✨ Améliorer mon dossier' : '✨ Improve my profile')} →
      </button>
    </div>
  );
}

// ── ChecklistWidget (adapté) ──
function ChecklistWidget({ user, roadmap, setRoadmap, setView, c, lang }) {
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(false);
  const terminees = roadmap.filter(r => isItemDone(r)).length;
  const enCours = roadmap.filter(r => { const p = getProgress(r); return p > 0 && !isItemDone(r); }).length;
  const totalSteps = roadmap.reduce((s, item) => s + getTotal(item), 0);
  const completedSteps = roadmap.reduce((s, item) => s + getProgress(item), 0);
  const pct = totalSteps > 0 ? Math.round(Math.min((completedSteps / totalSteps) * 100, 100)) : 0;

  const advanceStep = async (item) => {
    const step = item.etapeCourante || 0, total = getTotal(item);
    if (step >= total - 1) return;
    const ns = step + 1;
    try {
      await axiosInstance.patch(API_ROUTES.roadmap.update(item.id), { etapeCourante: ns, statut: ns >= total ? 'terminé' : 'en_cours' });
      setRoadmap(prev => prev.map(r => r.id === item.id ? { ...r, etapeCourante: ns, statut: ns >= total ? (lang === 'fr' ? 'terminé' : 'completed') : (lang === 'fr' ? 'en_cours' : 'in_progress') } : r));
    } catch (e) { console.error(e); }
  };

  const addToRoadmap = async () => {
    if (!newText.trim() || !user?.id) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post(API_ROUTES.roadmap.create, {
        userId: user.id, userEmail: user.email || '',
        nom: newText.trim(), pays: lang === 'fr' ? 'À définir' : 'To be defined',
        statut: lang === 'fr' ? 'en_cours' : 'in_progress', etapeCourante: 0,
        ajouteLe: new Date().toISOString(), dateLimite: null, lienOfficiel: '', financement: '',
      });
      setRoadmap(prev => [...prev, res.data?.doc || res.data]);
      setNewText('');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: c.ink3 }}><span style={{ color: '#166534', fontWeight: 700 }}>{terminees}</span> {lang === 'fr' ? `terminée${terminees > 1 ? 's' : ''}` : `completed${terminees > 1 ? ' (s)' : ''}`} · <span style={{ color: c.accent, fontWeight: 700 }}>{enCours}</span> {lang === 'fr' ? 'en cours' : 'in progress'}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: pct >= 80 ? '#166534' : pct >= 50 ? '#d97706' : c.accent }}>{pct}%</span>
        </div>
        <div style={{ height: 7, background: c.ruleSoft, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#166534' : pct >= 50 ? '#d97706' : c.accent, transition: 'width 0.6s ease' }} /></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
        {roadmap.length === 0 ? (
          <div style={{ color: c.ink3, fontSize: 12, textAlign: 'center', padding: '20px 16px', background: c.paper2, border: `1px dashed ${c.ruleSoft}`, lineHeight: 1.6 }}>
            {lang === 'fr' ? 'Ajoute ta première bourse ci-dessous\npour commencer à suivre ta progression' : 'Add your first scholarship below\nto start tracking your progress'}
          </div>
        ) : roadmap.map(item => {
          const total = getTotal(item), progress = getProgress(item), done = isItemDone(item), pctItem = Math.round((progress / total) * 100);
          return (
            <div key={item.id} style={{ padding: '10px 12px', background: done ? '#f0fdf4' : progress > 0 ? '#eff6ff' : c.paper2, border: `1px solid ${done ? '#86efac' : progress > 0 ? '#bfdbfe' : c.ruleSoft}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 22, height: 22, border: `2px solid ${done ? '#166534' : progress > 0 ? c.accent : '#e2e8f0'}`, background: done ? '#166534' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {done ? <span style={{ color: '#fff', fontSize: 12 }}>✓</span> : progress > 0 ? <span style={{ color: c.accent, fontSize: 9, fontWeight: 800 }}>{progress}/{total}</span> : null}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: done ? '#166534' : c.ink, textDecoration: done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nom}</div>
                  <div style={{ fontSize: 10, color: c.ink3, marginTop: 1 }}>{done ? <span style={{ color: '#166534', fontWeight: 600 }}>{lang === 'fr' ? '✅ Terminée' : '✅ Completed'} ({total} {lang === 'fr' ? 'étapes' : 'steps'})</span> : progress > 0 ? <span style={{ color: c.accent }}>{lang === 'fr' ? 'Étape' : 'Step'} {progress}/{total}</span> : <span style={{ color: '#94a3b8' }}>{lang === 'fr' ? 'Non commencée' : 'Not started'} · {total} {lang === 'fr' ? 'étapes' : 'steps'}</span>}</div>
                </div>
                {!done && <button onClick={() => advanceStep(item)} style={{ padding: '3px 9px', background: '#eff6ff', border: `1px solid #bfdbfe`, color: c.accent, fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>+1</button>}
              </div>
              <div style={{ marginTop: 7, height: 4, background: '#e2e8f0', overflow: 'hidden' }}><div style={{ height: '100%', width: `${pctItem}%`, background: done ? '#166534' : c.accent, transition: 'width 0.4s ease' }} /></div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
        <input value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addToRoadmap()} placeholder={lang === 'fr' ? 'Nom bourse (ex: Eiffel, DAAD...)' : 'Scholarship name (ex: Eiffel, DAAD...)'} style={{ flex: 1, padding: '9px 12px', border: `1.5px solid ${c.ruleSoft}`, fontSize: 12, background: c.paper, outline: 'none', fontFamily: c.fSans }} disabled={loading} />
        <button onClick={addToRoadmap} disabled={loading || !newText.trim()} style={{ padding: '9px 16px', background: c.accent, color: c.paper, border: 'none', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: c.fMono, opacity: loading ? 0.7 : 1 }}>{loading ? '…' : '+'}</button>
      </div>
    </div>
  );
}

// ── Calendrier (adapté) ──
function Calendrier({ deadlines, onSelectBourse, c, lang }) {
  const today = new Date();
  const [view, setView] = useState({ month: today.getMonth(), year: today.getFullYear() });
  const MONTHS = lang === 'fr' ? ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'] : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = lang === 'fr' ? ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const deadlineMap = {};
  deadlines.forEach(b => { if (!b.deadline) return; const d = new Date(b.deadline); const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; if (!deadlineMap[k]) deadlineMap[k] = []; deadlineMap[k].push(b); });
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstDay = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const cells = []; for (let i = 0; i < firstDay; i++) cells.push(null); for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const prev = () => setView(v => ({ month: v.month === 0 ? 11 : v.month - 1, year: v.month === 0 ? v.year - 1 : v.year }));
  const next = () => setView(v => ({ month: v.month === 11 ? 0 : v.month + 1, year: v.month === 11 ? v.year + 1 : v.year }));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 5 }}><button onClick={() => setView(v => ({ ...v, year: v.year - 1 }))} style={navBtn(c)}>«</button><button onClick={prev} style={navBtn(c)}>‹</button></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={view.month} onChange={e => setView(v => ({ ...v, month: parseInt(e.target.value) }))} style={{ fontSize: 12, padding: '5px 8px', border: `1px solid ${c.ruleSoft}`, background: c.paper, color: c.accent, fontFamily: c.fMono }}>{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
          <input type="number" value={view.year} onChange={e => setView(v => ({ ...v, year: parseInt(e.target.value || 0) }))} style={{ width: 72, fontSize: 12, padding: '5px 8px', border: `1px solid ${c.ruleSoft}`, background: c.paper, color: c.ink }} />
        </div>
        <div style={{ display: 'flex', gap: 5 }}><button onClick={next} style={navBtn(c)}>›</button><button onClick={() => setView(v => ({ ...v, year: v.year + 1 }))} style={navBtn(c)}>»</button><button onClick={() => setView({ month: today.getMonth(), year: today.getFullYear() })} style={btnXs(c)}>{lang === 'fr' ? 'Auj.' : 'Today'}</button></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 9, color: c.ink3, fontWeight: 700 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const isToday = day === today.getDate() && view.month === today.getMonth() && view.year === today.getFullYear();
          const k = `${view.year}-${view.month}-${day}`;
          const dl = deadlineMap[k];
          const diff = dl ? Math.round((new Date(view.year, view.month, day) - today) / 86400000) : null;
          const col = diff !== null ? daysLeft(new Date(view.year, view.month, day), lang).color : null;
          return (
            <div key={k} onClick={() => dl?.[0] && onSelectBourse(dl[0])}
              style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', fontSize: 10, background: isToday ? c.accent : dl ? `${col}14` : 'transparent', border: isToday ? `2px solid ${c.warn}` : dl ? `1px solid ${col}50` : `1px solid ${c.ruleSoft}`, color: isToday ? c.paper : dl ? col : c.ink3, cursor: dl ? 'pointer' : 'default', fontWeight: (isToday || dl) ? 700 : 400, padding: '2px', overflow: 'hidden' }}>
              <span style={{ flexShrink: 0 }}>{day}</span>
              {dl && <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                {dl.slice(0, 2).map((item, idx2) => (
                  <div key={idx2} onClick={e => { e.stopPropagation(); onSelectBourse(item); }} title={item.nom}
                    style={{ fontSize: 8, padding: '1px 3px', background: (item.inRoadmap ? '#7c3aed' : item.isFavori ? c.warn : c.accent) + '20', color: item.inRoadmap ? '#7c3aed' : item.isFavori ? '#d97706' : c.accent, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                    {item.nom}
                  </div>
                ))}
              </div>}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        {[
          ['#dc2626', lang === 'fr' ? 'Expiré' : 'Expired'],
          ['#d97706', lang === 'fr' ? '≤ 7j' : '≤ 7d'],
          ['#2563eb', lang === 'fr' ? '≤ 30j' : '≤ 30d'],
          ['#166534', lang === 'fr' ? 'OK' : 'OK'],
          ['#7c3aed', lang === 'fr' ? 'Roadmap' : 'Roadmap'],
          [c.warn, lang === 'fr' ? 'Favori' : 'Favorite']
        ].map(([col, lab]) => <div key={lab} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, background: col }} /><span style={{ fontSize: 9, color: c.ink3 }}>{lab}</span></div>)}
      </div>
    </div>
  );
}

// ── WorldMap (adapté) ──
function WorldMap({ onCountryClick, activeCountry, scholarshipCounts, c, lang }) {
  const containerRef = useRef(null), svgRef = useRef(null), activeCountryRef = useRef(activeCountry);
  const [tooltip, setTooltip] = useState(null), [ready, setReady] = useState(false);
  const NUMERIC_TO_ALPHA2 = { '4':'AF','8':'AL','12':'DZ','24':'AO','32':'AR','36':'AU','40':'AT','50':'BD','56':'BE','68':'BO','76':'BR','100':'BG','120':'CM','124':'CA','152':'CL','156':'CN','170':'CO','178':'CG','188':'CR','192':'CU','196':'CY','203':'CZ','208':'DK','214':'DO','218':'EC','818':'EG','222':'SV','231':'ET','246':'FI','250':'FR','266':'GA','276':'DE','288':'GH','300':'GR','320':'GT','332':'HT','340':'HN','348':'HU','356':'IN','360':'ID','364':'IR','368':'IQ','372':'IE','376':'IL','380':'IT','388':'JM','392':'JP','400':'JO','404':'KE','410':'KR','408':'KP','414':'KW','422':'LB','430':'LR','434':'LY','484':'MX','504':'MA','516':'NA','524':'NP','528':'NL','554':'NZ','558':'NI','566':'NG','578':'NO','586':'PK','591':'PA','598':'PG','600':'PY','604':'PE','608':'PH','616':'PL','620':'PT','634':'QA','642':'RO','643':'RU','682':'SA','694':'SL','706':'SO','710':'ZA','724':'ES','729':'SD','752':'SE','756':'CH','760':'SY','764':'TH','788':'TN','792':'TR','800':'UG','804':'UA','784':'AE','826':'GB','840':'US','858':'UY','862':'VE','704':'VN','887':'YE','894':'ZM','716':'ZW'};
  const ALPHA2_TO_NUMERIC = Object.fromEntries(Object.entries(NUMERIC_TO_ALPHA2).map(([n,a]) => [a, n]));
  const COUNTRY_META = { FR:{label:'France',flag:'🇫🇷'},DE:{label:'Allemagne',flag:'🇩🇪'},GB:{label:'Royaume-Uni',flag:'🇬🇧'},US:{label:'États-Unis',flag:'🇺🇸'},CA:{label:'Canada',flag:'🇨🇦'},AU:{label:'Australie',flag:'🇦🇺'},JP:{label:'Japon',flag:'🇯🇵'},CN:{label:'Chine',flag:'🇨🇳'},KR:{label:'Corée du Sud',flag:'🇰🇷'},TR:{label:'Turquie',flag:'🇹🇷'},SA:{label:'Arabie Saoudite',flag:'🇸🇦'},MA:{label:'Maroc',flag:'🇲🇦'},TN:{label:'Tunisie',flag:'🇹🇳'},IN:{label:'Inde',flag:'🇮🇳'},BR:{label:'Brésil',flag:'🇧🇷'},ZA:{label:'Afrique du Sud',flag:'🇿🇦'},NG:{label:'Nigéria',flag:'🇳🇬'},EG:{label:'Égypte',flag:'🇪🇬'},BE:{label:'Belgique',flag:'🇧🇪'},NL:{label:'Pays-Bas',flag:'🇳🇱'},CH:{label:'Suisse',flag:'🇨🇭'},SE:{label:'Suède',flag:'🇸🇪'},NO:{label:'Norvège',flag:'🇳🇴'},HU:{label:'Hongrie',flag:'🇭🇺'},PL:{label:'Pologne',flag:'🇵🇱'},IT:{label:'Italie',flag:'🇮🇹'},ES:{label:'Espagne',flag:'🇪🇸'},RU:{label:'Russie',flag:'🇷🇺'},MX:{label:'Mexique',flag:'🇲🇽'},NZ:{label:'Nouvelle-Zélande',flag:'🇳🇿'},PT:{label:'Portugal',flag:'🇵🇹'},AT:{label:'Autriche',flag:'🇦🇹'},FI:{label:'Finlande',flag:'🇫🇮'},DK:{label:'Danemark',flag:'🇩🇰'},IE:{label:'Irlande',flag:'🇮🇪'},GR:{label:'Grèce',flag:'🇬🇷'},CZ:{label:'Tchéquie',flag:'🇨🇿'},RO:{label:'Roumanie',flag:'🇷🇴'},UA:{label:'Ukraine',flag:'🇺🇦'},AE:{label:'Émirats arabes unis',flag:'🇦🇪'},QA:{label:'Qatar',flag:'🇶🇦'},KE:{label:'Kenya',flag:'🇰🇪'},GH:{label:'Ghana',flag:'🇬🇭'},PK:{label:'Pakistan',flag:'🇵🇰'},ID:{label:'Indonésie',flag:'🇮🇩'},MY:{label:'Malaisie',flag:'🇲🇾'},TH:{label:'Thaïlande',flag:'🇹🇭'},VN:{label:'Vietnam',flag:'🇻🇳'},AR:{label:'Argentine',flag:'🇦🇷'},CL:{label:'Chili',flag:'🇨🇱'},CO:{label:'Colombie',flag:'🇨🇴'},PE:{label:'Pérou',flag:'🇵🇪'},};
  const normCounts = {};
  Object.entries(scholarshipCounts).forEach(([k, v]) => { if (/^\d+$/.test(k)) normCounts[k] = v; else { const num = ALPHA2_TO_NUMERIC[k.toUpperCase()]; if (num) normCounts[num] = v; } });
  const getAlpha2 = id => NUMERIC_TO_ALPHA2[String(id)] || null;
  const getCount = id => normCounts[String(id)] || 0;
  const colorForCount = n => n === 0 ? '#1e2a3a' : n >= 10 ? c.accent : n >= 7 ? '#2563eb' : n >= 4 ? '#3b82f6' : '#93c5fd';
  const strokeForCount = (n, isActive) => isActive ? c.warn : n > 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)';
  useEffect(() => {
    let cancelled = false;
    const loadScripts = () => new Promise(resolve => { if (window.__d3loaded && window.__topojsonloaded) { resolve(); return; } const s1 = document.createElement('script'); s1.src = 'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js'; s1.onload = () => { window.__d3loaded = true; const s2 = document.createElement('script'); s2.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js'; s2.onload = () => { window.__topojsonloaded = true; resolve(); }; document.head.appendChild(s2); }; document.head.appendChild(s1); });
    const draw = async () => {
      await loadScripts(); if (cancelled || !svgRef.current || !containerRef.current) return;
      const d3 = window.d3, topojson = window.topojson;
      const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      if (cancelled || !svgRef.current) return;
      const W = containerRef.current.getBoundingClientRect().width || 800, H = Math.round(W * 0.52);
      const svg = d3.select(svgRef.current); svg.selectAll('*').remove();
      svg.attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%').attr('height', H);
      const proj = d3.geoMercator().scale(W / 6.4).translate([W / 2, H / 1.58]);
      const pathGen = d3.geoPath().projection(proj);
      const features = topojson.feature(world, world.objects.countries).features;
      svg.selectAll('path.country').data(features).join('path').attr('class', 'country').attr('d', pathGen).attr('data-id', d => d.id).attr('fill', d => colorForCount(getCount(d.id))).attr('stroke', d => strokeForCount(getCount(d.id), false)).attr('stroke-width', 0.5).style('cursor', d => getCount(d.id) > 0 ? 'pointer' : 'default').style('transition', 'fill 0.18s')
        .on('mouseenter', function (event, d) { const a2 = getAlpha2(d.id); const n = getCount(d.id); if (!n) return; d3.select(this).attr('fill', c.warn).attr('stroke', '#fff').attr('stroke-width', 1.5); const [mx, my] = d3.pointer(event, svgRef.current); setTooltip({ x: mx, y: my, code: a2, count: n }); })
        .on('mouseleave', function (event, d) { const a2 = getAlpha2(d.id); const n = getCount(d.id); const isAct = a2 === activeCountryRef.current; d3.select(this).attr('fill', isAct ? c.warn : colorForCount(n)).attr('stroke', strokeForCount(n, isAct)).attr('stroke-width', isAct ? 1.5 : 0.5); setTooltip(null); })
        .on('click', function (event, d) { const a2 = getAlpha2(d.id); if (a2 && getCount(d.id) > 0) onCountryClick(a2); });
      svg.append('path').datum(d3.geoGraticule()()).attr('d', pathGen).attr('fill', 'none').attr('stroke', 'rgba(255,255,255,0.035)').attr('stroke-width', 0.5);
      if (!cancelled) setReady(true);
    };
    draw().catch(console.error); return () => { cancelled = true; };
  }, [JSON.stringify(normCounts), c]);
  useEffect(() => {
    activeCountryRef.current = activeCountry;
    if (!svgRef.current || !window.d3) return;
    svgRef.current.querySelectorAll('path.country').forEach(el => { const numId = el.getAttribute('data-id'); const a2 = NUMERIC_TO_ALPHA2[numId] || null; const n = normCounts[numId] || 0; const isAct = a2 === activeCountry; window.d3.select(el).attr('fill', isAct ? c.warn : colorForCount(n)).attr('stroke', strokeForCount(n, isAct)).attr('stroke-width', isAct ? 1.5 : 0.5); });
  }, [activeCountry, c]);
  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#050e1c 0%,#0b1e3d 55%,#08172e 100%)', zIndex: 0 }} />
      {!ready && <div style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${c.warn}25`, borderTopColor: c.warn, animation: 'spin 0.8s linear infinite' }} /><span style={{ fontSize: 11, color: `${c.warn}99` }}>{lang === 'fr' ? 'Chargement…' : 'Loading…'}</span></div>}
      <svg ref={svgRef} style={{ position: 'relative', zIndex: 1, display: 'block', width: '100%', border: `1px solid ${c.warn}25`, opacity: ready ? 1 : 0, transition: 'opacity 0.5s', minHeight: 220 }} />
      {tooltip && COUNTRY_META[tooltip.code] && (
        <div style={{ position: 'absolute', left: Math.min(tooltip.x + 14, (containerRef.current?.offsetWidth || 500) - 150), top: Math.max(tooltip.y - 48, 8), background: '#060f1e', border: `1px solid ${c.warn}55`, padding: '7px 11px', pointerEvents: 'none', zIndex: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.warn }}>{COUNTRY_META[tooltip.code].flag} {COUNTRY_META[tooltip.code].label}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{tooltip.count} {lang === 'fr' ? 'bourse' : 'scholarship'}{tooltip.count > 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
}

// ── Styles partagés ──
const navBtn = (c) => ({ padding: '3px 12px', background: c.paper2, border: `1px solid ${c.ruleSoft}`, color: c.accent, fontSize: 16, cursor: 'pointer' });
const btnXs = (c) => ({ padding: '5px 12px', background: '#eff6ff', border: `1px solid #bfdbfe`, color: c.accent, fontSize: 11, cursor: 'pointer', fontWeight: 600, fontFamily: c.fMono });

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE DASHBOARD
═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage({ user, bourses, entretienScores, setView, handleQuickReply, onOpenBourse, messages, input, setInput, loading, chatContainerRef, handleSend }) {
  const { t, lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [roadmap, setRoadmap] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [drawerBourse, setDrawerBourse] = useState(null);
  const [appliedNoms, setAppliedNoms] = useState(new Set());
  const [starredNoms, setStarredNoms] = useState(new Set());
  const [showChat, setShowChat] = useState(false);
  const [activeCountry, setActiveCountry] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [realActivities, setRealActivities] = useState([]);

  useEffect(() => {
    if (!user?.id) { setDataLoading(false); return; }
    axiosInstance.get(API_ROUTES.roadmap.byUser(user.id))
      .then(r => { const docs = r.data.docs || []; setRoadmap(docs); setAppliedNoms(new Set(docs.map(b => b.nom?.trim().toLowerCase()))); })
      .catch(() => {}).finally(() => setDataLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    axiosInstance.get(API_ROUTES.favoris.byUser(user.id))
      .then(r => { const doc = r.data?.docs?.[0] || r.data; const favs = doc?.bourses || []; setFavorites(favs); setStarredNoms(new Set(favs.map(b => b.nom?.trim().toLowerCase()))); })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    const acts = [];
    roadmap.forEach(item => { if (item.ajouteLe) acts.push({ date: item.ajouteLe.split('T')[0], icon: '📋', bg: '#eff6ff', label: item.nom }); });
    (entretienScores || []).forEach(s => { if (s.createdAt) acts.push({ date: s.createdAt.split('T')[0], icon: '🎙️', bg: '#f0fdf4', label: `${lang === 'fr' ? 'Entretien' : 'Interview'} · ${s.scoreNum || '?'}/100` }); });
    favorites.forEach(f => { if (f.ajouteLe) acts.push({ date: f.ajouteLe.split('T')[0], icon: '⭐', bg: '#fffbeb', label: f.nom }); });
    acts.sort((a, b) => b.date.localeCompare(a.date));
    setRealActivities(acts);
  }, [roadmap, entretienScores, favorites, lang]);

  const scholarshipCounts = useMemo(() => {
    const counts = {}; (bourses || []).forEach(b => { if (!b.pays) return; const code = Object.entries({ FR:'France',DE:'Allemagne',GB:'Royaume-Uni',US:'États-Unis',CA:'Canada',AU:'Australie',JP:'Japon',CN:'Chine',KR:'Corée du Sud',TR:'Turquie',SA:'Arabie Saoudite',MA:'Maroc',TN:'Tunisie',IN:'Inde',BR:'Brésil',ZA:'Afrique du Sud',NG:'Nigéria',EG:'Égypte',BE:'Belgique',NL:'Pays-Bas',CH:'Suisse',SE:'Suède',NO:'Norvège',HU:'Hongrie',PL:'Pologne',IT:'Italie',ES:'Espagne',RU:'Russie',MX:'Mexique',NZ:'Nouvelle-Zélande',PT:'Portugal',AT:'Autriche',FI:'Finlande',DK:'Danemark',IE:'Irlande',GR:'Grèce',CZ:'Tchéquie',RO:'Roumanie',UA:'Ukraine',AE:'Émirats arabes unis',QA:'Qatar',KE:'Kenya',GH:'Ghana',PK:'Pakistan',ID:'Indonésie',MY:'Malaisie',TH:'Thaïlande',VN:'Vietnam',AR:'Argentine',CL:'Chili',CO:'Colombie',PE:'Pérou' }).find(([, label]) => label === b.pays)?.[0]; if (code) counts[code] = (counts[code] || 0) + 1; }); return counts;
  }, [bourses]);

  const roadmapSet = useMemo(() => new Set((roadmap || []).map(b => b.nom?.trim().toLowerCase())), [roadmap]);
  const favoritesSet = useMemo(() => new Set((favorites || []).map(b => b.nom?.trim().toLowerCase())), [favorites]);

  const deadlines = useMemo(() => (bourses || []).filter(b => b.dateLimite).map(b => ({ nom: b.nom, deadline: new Date(b.dateLimite), pays: b.pays, isFavori: favoritesSet.has(b.nom?.trim().toLowerCase()), inRoadmap: roadmapSet.has(b.nom?.trim().toLowerCase()), lienOfficiel: b.lienOfficiel, financement: b.financement })).sort((a, b) => a.deadline - b.deadline), [bourses, favoritesSet, roadmapSet]);

  const urgentDeadlines = useMemo(() => deadlines.filter(d => { const diff = Math.round((d.deadline - new Date()) / 86400000); return diff >= 0 && diff <= 14; }), [deadlines]);

  const parseScore = txt => { const m = (txt || '').match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i); return m ? parseInt(m[1]) : null; };
  const scores = useMemo(() => (entretienScores || []).map(s => ({ ...s, scoreNum: parseScore(s.score) })).filter(s => s.scoreNum !== null), [entretienScores]);
  const lastScore = scores[0]?.scoreNum ?? null;
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b.scoreNum, 0) / scores.length) : null;
  const scoreHistory = useMemo(() => scores.slice().reverse().map(s => s.scoreNum), [scores]);

  const roadmapTerminees = useMemo(() => roadmap.filter(r => isItemDone(r)).length, [roadmap]);
  const roadmapEnCours = useMemo(() => roadmap.filter(r => { const p = getProgress(r); return p > 0 && !isItemDone(r); }).length, [roadmap]);

  const recentActivitiesFlux = useMemo(() => realActivities.slice(0, 5).map(a => ({ ...a, text: a.label, time: new Date(a.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') })), [realActivities, lang]);
  const activeCountryBourses = useMemo(() => activeCountry ? (bourses || []).filter(b => b.pays === ({ FR:'France',DE:'Allemagne',GB:'Royaume-Uni',US:'États-Unis',CA:'Canada',AU:'Australie',JP:'Japon',CN:'Chine',KR:'Corée du Sud',TR:'Turquie',SA:'Arabie Saoudite',MA:'Maroc',TN:'Tunisie',IN:'Inde',BR:'Brésil',ZA:'Afrique du Sud',NG:'Nigéria',EG:'Égypte',BE:'Belgique',NL:'Pays-Bas',CH:'Suisse',SE:'Suède',NO:'Norvège',HU:'Hongrie',PL:'Pologne',IT:'Italie',ES:'Espagne',RU:'Russie',MX:'Mexique',NZ:'Nouvelle-Zélande',PT:'Portugal',AT:'Autriche',FI:'Finlande',DK:'Danemark',IE:'Irlande',GR:'Grèce',CZ:'Tchéquie',RO:'Roumanie',UA:'Ukraine',AE:'Émirats arabes unis',QA:'Qatar',KE:'Kenya',GH:'Ghana',PK:'Pakistan',ID:'Indonésie',MY:'Malaisie',TH:'Thaïlande',VN:'Vietnam',AR:'Argentine',CL:'Chili',CO:'Colombie',PE:'Pérou' }[activeCountry])).slice(0, 6) : [], [activeCountry, bourses]);

  const streak = useMemo(() => {
    const today = new Date(); let s = 0;
    for (let i = 0; i < 60; i++) { const d = new Date(today); d.setDate(today.getDate() - i); const k = d.toISOString().split('T')[0]; if (realActivities.some(a => a.date === k)) s++; else if (i > 0) break; }
    return s;
  }, [realActivities]);

  const kpiBourses = useAnimatedCounter((bourses || []).length);
  const kpiRoadmap = useAnimatedCounter(roadmap.length);
  const kpiDeadlines = useAnimatedCounter(deadlines.filter(d => { const di = Math.round((d.deadline - new Date()) / 86400000); return di >= 0 && di <= 30; }).length);
  const kpiScore = useAnimatedCounter(lastScore ?? 0);

  if (!user) return (
    <>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.paper, padding: 24 }}>
        <div style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: '48px 40px', maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
          <h3 style={{ fontFamily: c.fSerif, fontSize: 20, fontWeight: 700, color: c.ink, margin: '0 0 8px' }}>{lang === 'fr' ? 'Tableau de bord non disponible' : 'Dashboard unavailable'}</h3>
          <p style={{ color: c.ink2, fontSize: 13, lineHeight: 1.5, margin: '0 0 24px' }}>{lang === 'fr' ? 'Connectez-vous pour accéder à votre tableau de bord.' : 'Sign in to access your dashboard.'}</p>
          <button style={{ padding: '10px 28px', background: c.accent, color: c.paper, border: 'none', fontSize: 12, fontWeight: 600, fontFamily: c.fMono, cursor: 'pointer' }} onClick={() => setShowLoginModal(true)}>🔐 {lang === 'fr' ? 'Se connecter' : 'Sign in'}</button>
        </div>
      </div>
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} c={c} lang={lang} />}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );

  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px' }}>
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: c.fSerif, fontSize: '1.8rem', fontWeight: 800, color: c.accent, marginBottom: 3 }}>{lang === 'fr' ? 'Tableau de Bord' : 'Dashboard'}</h1>
            <p style={{ fontSize: 13, color: c.ink2 }}>{lang === 'fr' ? 'Bonjour' : 'Hello'} <strong style={{ color: c.accent }}>{user.name || user.email?.split('@')[0]}</strong>, {lang === 'fr' ? 'voici l\'état de vos bourses.' : 'here\'s your scholarships status.'}</p>
          </div>
          <button style={{ padding: '8px 20px', background: c.warn, border: 'none', color: c.accent, fontSize: 12, fontWeight: 600, fontFamily: c.fMono, cursor: 'pointer' }} onClick={() => setView('bourses')}>{lang === 'fr' ? 'Explorer Bourses' : 'Explore Scholarships'}</button>
        </div>

        {/* TODAY BLOCK */}
        <div style={{ border: `1px solid ${c.rule}`, background: c.surface, padding: '16px 20px', marginBottom: 14, borderLeft: `4px solid ${c.warn}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: c.accent }}>🌅 {lang === 'fr' ? 'Aujourd\'hui — Que faire ?' : 'Today — What to do?'}</div><div style={{ fontSize: 11, color: c.ink3, marginTop: 2 }}>{new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
            <div style={{ fontSize: 11, color: c.ink3, background: c.paper2, padding: '3px 10px', border: `1px solid ${c.ruleSoft}` }}>{urgentDeadlines.length > 0 ? `⚡ ${urgentDeadlines.length} ${lang === 'fr' ? 'urgent' : 'urgent'}${urgentDeadlines.length > 1 ? 's' : ''}` : streak > 0 ? `🔥 Streak ${streak}${lang === 'fr' ? 'j' : 'd'}` : (lang === 'fr' ? '✨ Bonne journée' : '✨ Have a great day')}</div>
          </div>
          <TodayBlock roadmap={roadmap} deadlines={deadlines} scores={scores} setView={setView} c={c} lang={lang} />
        </div>

        {/* URGENT BANNER */}
        {urgentDeadlines.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: '#fff3cd', borderLeft: `4px solid ${c.warn}`, marginBottom: 20 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <span style={{ fontSize: 12, color: '#856404', flex: 1, fontWeight: 500 }}><strong>{urgentDeadlines.length} {lang === 'fr' ? 'deadline' : 'deadline'}{urgentDeadlines.length > 1 ? (lang === 'fr' ? 's urgentes' : 's urgent') : (lang === 'fr' ? ' urgente' : ' urgent')} :</strong> {urgentDeadlines.map(d => `${d.nom} (${Math.round((d.deadline - new Date()) / 86400000)}${lang === 'fr' ? 'j' : 'd'})`).join(' · ')}</span>
            <button onClick={() => setView('roadmap')} style={{ padding: '5px 12px', background: c.accent, border: 'none', color: c.paper, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{lang === 'fr' ? 'Voir' : 'View'}</button>
          </div>
        )}

        {/* KPI CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: lang === 'fr' ? 'Bourses disponibles' : 'Available scholarships', val: kpiBourses, icon: '🎓', color: c.accent, bg: c.paper2, trend: `${Object.keys(scholarshipCounts).length} ${lang === 'fr' ? 'pays' : 'countries'}`, trendColor: '#166534' },
            { label: lang === 'fr' ? 'En roadmap' : 'In roadmap', val: kpiRoadmap, icon: '📋', color: c.accent, bg: c.paper2, trend: `${roadmapTerminees} ${lang === 'fr' ? 'terminées' : 'completed'}`, trendColor: '#166534' },
            { label: lang === 'fr' ? 'Deadlines (30j)' : 'Deadlines (30d)', val: kpiDeadlines, icon: '⏰', color: c.warn, bg: c.paper2, trend: `${urgentDeadlines.length} ${lang === 'fr' ? 'urgentes' : 'urgent'}`, trendColor: '#d97706' },
            { label: lang === 'fr' ? 'Score entretien' : 'Interview score', val: lastScore ? `${lastScore}/100` : '—', icon: '🎙️', color: '#7c3aed', bg: '#f5f3ff', trend: `${scores.length} ${lang === 'fr' ? 'simulés' : 'simulated'}`, trendColor: '#7c3aed' }
          ].map((k, i) => (
            <div key={i} style={{ border: `1px solid ${c.rule}`, background: c.surface, padding: '14px 16px', borderTop: `3px solid ${k.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><div style={{ fontSize: 9, color: c.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{k.label}</div><div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.val}</div><div style={{ fontSize: 10, color: k.trendColor, fontWeight: 600, marginTop: 4 }}>{k.trend}</div></div>
                <div style={{ width: 40, height: 40, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{k.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ROW 1: Smart Tips + Profile Strength */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div style={{ border: `1px solid ${c.rule}`, background: c.surface, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.accent, marginBottom: 12 }}>💡 {lang === 'fr' ? 'Conseils IA' : 'AI Tips'}</div>
            <SmartTips user={user} scores={scores} roadmap={roadmap} urgentDeadlines={urgentDeadlines} setView={setView} c={c} lang={lang} />
          </div>
          <div style={{ border: `1px solid ${c.rule}`, background: c.surface, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.accent, marginBottom: 12 }}>📊 {lang === 'fr' ? 'Force dossier' : 'Profile strength'}</div>
            <ProfileStrength user={user} scores={scores} setView={setView} c={c} lang={lang} />
          </div>
        </div>

        {/* ROW 2: Alertes deadlines + Progression entretiens */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div style={{ border: `1px solid ${c.rule}`, background: c.surface, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.accent }}>🔔 {lang === 'fr' ? 'Alertes deadlines' : 'Deadline alerts'}</div>
              {urgentDeadlines.length > 0 && <div style={{ padding: '2px 8px', background: '#fef2f2', border: `1px solid #fecaca`, fontSize: 11, fontWeight: 700, color: c.danger }}>{urgentDeadlines.length} {lang === 'fr' ? 'urgente' : 'urgent'}{urgentDeadlines.length > 1 ? 's' : ''}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {deadlines.length === 0 ? <div style={{ color: c.ink3, fontSize: 13 }}>{lang === 'fr' ? 'Aucune bourse avec deadline.' : 'No scholarships with deadlines.'}</div>
              : deadlines.slice(0, 5).map((d, i) => {
                const dl = daysLeft(d.deadline, lang); const diff = Math.round((d.deadline - new Date()) / 86400000);
                const bg = diff < 0 ? '#fef2f2' : diff <= 7 ? '#fffbeb' : diff <= 14 ? '#eff6ff' : c.paper2;
                const bl = diff < 0 ? c.danger : diff <= 7 ? '#d97706' : diff <= 14 ? c.accent : c.ruleSoft;
                const rmItem = roadmap.find(r => r.nom?.trim().toLowerCase() === d.nom?.trim().toLowerCase());
                const rmProgress = rmItem ? getProgress(rmItem) : 0;
                const rmTotal = rmItem ? getTotal(rmItem) : 0;
                return (
                  <div key={i} onClick={() => setDrawerBourse(d)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: bg, borderLeft: `3px solid ${bl}`, cursor: 'pointer' }}>
                    <div><div style={{ fontSize: 12, color: c.accent, fontWeight: 600 }}>{d.nom}</div><div style={{ fontSize: 10, color: c.ink3, marginTop: 1 }}>{d.pays} · {d.deadline.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}{rmItem && <span style={{ marginLeft: 6, color: '#7c3aed', fontWeight: 600 }}>📋 {rmProgress}/{rmTotal}</span>}{d.isFavori && <span style={{ marginLeft: 6, color: '#d97706', fontWeight: 600 }}>⭐</span>}</div></div>
                    <span style={{ fontSize: 11, color: dl.color, fontWeight: 700, padding: '2px 9px', background: `${dl.color}15`, border: `1px solid ${dl.color}35`, whiteSpace: 'nowrap' }}>{dl.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ border: `1px solid ${c.rule}`, background: c.surface, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.accent }}>🎙️ {lang === 'fr' ? 'Progression entretiens' : 'Interview progress'}</div>
              <button onClick={() => setView('entretien')} style={{ padding: '4px 12px', background: c.paper2, border: `1px solid ${c.rule}`, color: c.accent, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>{lang === 'fr' ? 'Pratiquer →' : 'Practice →'}</button>
            </div>
            {scores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}><div style={{ fontSize: 36, marginBottom: 8 }}>🎙️</div><div style={{ color: c.ink3, fontSize: 12, marginBottom: 12 }}>{lang === 'fr' ? 'Aucun entretien simulé' : 'No mock interviews'}</div><button onClick={() => setView('entretien')} style={{ padding: '8px 18px', background: c.accent, color: c.paper, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{lang === 'fr' ? 'Démarrer' : 'Start'}</button></div>
            ) : (
              <>
                <Sparkline data={scoreHistory} color={c.accent} height={60} lang={lang} />
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <div style={{ padding: '8px 12px', background: c.paper2, border: `1px solid ${c.ruleSoft}` }}><div style={{ fontSize: 18, fontWeight: 800, color: lastScore >= 75 ? '#166534' : lastScore >= 55 ? '#d97706' : c.danger }}>{lastScore}/100</div><div style={{ fontSize: 10, color: c.ink3 }}>{lang === 'fr' ? 'Dernier' : 'Last'}</div></div>
                  <div style={{ padding: '8px 12px', background: c.paper2, border: `1px solid ${c.ruleSoft}` }}><div style={{ fontSize: 18, fontWeight: 800, color: c.ink }}>{scores.length}</div><div style={{ fontSize: 10, color: c.ink3 }}>{lang === 'fr' ? 'Simulés' : 'Simulated'}</div></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ROW 3: Calendrier + Prochaines échéances */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 14 }}>
          <div style={{ border: `1px solid ${c.rule}`, background: c.surface, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: c.accent }}>📅 {lang === 'fr' ? 'Calendrier des deadlines' : 'Deadlines calendar'}</div><div style={{ fontSize: 11, color: c.ink3 }}>{deadlines.length} {lang === 'fr' ? `deadline${deadlines.length !== 1 ? 's' : ''}` : `deadline${deadlines.length !== 1 ? ' (s)' : ''}`} · <span style={{ color: '#7c3aed', fontWeight: 600 }}>{deadlines.filter(d => d.inRoadmap).length} {lang === 'fr' ? 'roadmap' : 'roadmap'}</span> · <span style={{ color: '#d97706', fontWeight: 600 }}>{deadlines.filter(d => d.isFavori).length} {lang === 'fr' ? 'favoris' : 'favorites'}</span></div></div>
              <button onClick={() => setView('roadmap')} style={btnXs(c)}>{lang === 'fr' ? 'Roadmap →' : 'Roadmap →'}</button>
            </div>
            {deadlines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: c.ink3 }}><div style={{ fontSize: 40, marginBottom: 10 }}>📭</div><div style={{ fontSize: 13, marginBottom: 14 }}>{lang === 'fr' ? 'Aucune bourse avec deadline' : 'No scholarships with deadlines'}</div><button style={btnXs(c)} onClick={() => setView('bourses')}>{lang === 'fr' ? 'Explorer les bourses' : 'Explore scholarships'}</button></div>
            ) : <Calendrier deadlines={deadlines} onSelectBourse={b => { const full = (bourses || []).find(x => x.nom?.trim().toLowerCase() === b.nom?.trim().toLowerCase()); setDrawerBourse(full || b); }} c={c} lang={lang} />}
          </div>
          <div style={{ border: `1px solid ${c.rule}`, background: c.surface, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.accent }}>⏳ {lang === 'fr' ? 'Prochaines échéances' : 'Upcoming deadlines'}</div>
              <button onClick={() => setView('roadmap')} style={btnXs(c)}>{lang === 'fr' ? 'Roadmap →' : 'Roadmap →'}</button>
            </div>
            {deadlines.length === 0 ? (
              <div style={{ color: c.ink3, fontSize: 13, textAlign: 'center', padding: '20px 0' }}><div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>{lang === 'fr' ? 'Ajoute des bourses pour suivre leurs deadlines' : 'Add scholarships to track their deadlines'}</div>
            ) : deadlines.slice(0, 7).map((d, i) => {
              const dl = daysLeft(d.deadline, lang);
              const rmItem = roadmap.find(r => r.nom?.trim().toLowerCase() === d.nom?.trim().toLowerCase());
              const rmProgress = rmItem ? getProgress(rmItem) : 0;
              const rmTotal = rmItem ? getTotal(rmItem) : 0;
              const rmDone = rmItem ? isItemDone(rmItem) : false;
              return (
                <div key={i} onClick={() => { const full = (bourses || []).find(b => b.nom?.trim().toLowerCase() === d.nom?.trim().toLowerCase()); setDrawerBourse(full || d); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < Math.min(deadlines.length, 7) - 1 ? `1px solid ${c.ruleSoft}` : 'none', cursor: 'pointer' }}>
                  <div style={{ width: 8, height: 8, background: rmDone ? '#166534' : dl.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ fontSize: 12, color: rmDone ? '#166534' : c.accent, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nom}</div>{d.inRoadmap && <span style={{ fontSize: 8, color: '#7c3aed' }}>📋</span>}{d.isFavori && <span style={{ fontSize: 8, color: '#d97706' }}>⭐</span>}</div>
                    <div style={{ fontSize: 10, color: c.ink3, marginTop: 1 }}>{d.pays} · {d.deadline.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}{rmItem && <span style={{ marginLeft: 6, color: rmDone ? '#166534' : c.accent, fontWeight: 600 }}>· {rmProgress}/{rmTotal}</span>}</div>
                  </div>
                  <span style={{ fontSize: 10, color: rmDone ? '#166534' : dl.color, fontWeight: 700, padding: '2px 7px', background: rmDone ? '#f0fdf4' : `${dl.color}15`, border: `1px solid ${rmDone ? '#86efac' : dl.color + '35'}`, whiteSpace: 'nowrap' }}>{rmDone ? '✅' : dl.label}</span>
                </div>
              );
            })}
            {deadlines.length > 0 && (
              <div style={{ marginTop: 12, padding: '10px', background: c.paper2, border: `1px solid ${c.ruleSoft}`, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                {[
                  { val: deadlines.filter(d => d.inRoadmap).length, label: lang === 'fr' ? 'En suivi' : 'Tracked', color: '#7c3aed' },
                  { val: urgentDeadlines.length, label: lang === 'fr' ? 'Urgentes' : 'Urgent', color: c.danger },
                  { val: roadmapTerminees, label: lang === 'fr' ? 'Terminées' : 'Completed', color: '#166534' }
                ].map(s => <div key={s.label} style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div><div style={{ fontSize: 9, color: c.ink3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div></div>)}
              </div>
            )}
          </div>
        </div>

        {/* WORLD MAP */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ border: `1px solid ${c.rule}`, background: c.surface, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: c.accent }}>🌍 {lang === 'fr' ? 'Carte mondiale des bourses' : 'World scholarship map'}</div><div style={{ fontSize: 11, color: c.ink3 }}>{Object.keys(scholarshipCounts).length} {lang === 'fr' ? 'pays' : 'countries'} · {(bourses || []).length} {lang === 'fr' ? 'bourses' : 'scholarships'}</div></div>
              <button onClick={() => setView('bourses')} style={btnXs(c)}>{lang === 'fr' ? 'Toutes →' : 'All →'}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16, alignItems: 'start' }}>
              <WorldMap onCountryClick={code => setActiveCountry(code === activeCountry ? null : code)} activeCountry={activeCountry} scholarshipCounts={scholarshipCounts} c={c} lang={lang} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: c.accent, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4, borderBottom: `2px solid ${c.warn}`, paddingBottom: 4 }}>{lang === 'fr' ? 'Top pays' : 'Top countries'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 280, overflowY: 'auto' }}>
                  {Object.entries(scholarshipCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([code, count]) => {
                    const meta = { FR:'France',DE:'Allemagne',GB:'Royaume-Uni',US:'États-Unis',CA:'Canada',AU:'Australie',JP:'Japon',CN:'Chine',KR:'Corée du Sud',TR:'Turquie',SA:'Arabie Saoudite',MA:'Maroc',TN:'Tunisie',IN:'Inde',BR:'Brésil',ZA:'Afrique du Sud',NG:'Nigéria',EG:'Égypte',BE:'Belgique',NL:'Pays-Bas',CH:'Suisse',SE:'Suède',NO:'Norvège',HU:'Hongrie',PL:'Pologne',IT:'Italie',ES:'Espagne',RU:'Russie',MX:'Mexique',NZ:'Nouvelle-Zélande',PT:'Portugal',AT:'Autriche',FI:'Finlande',DK:'Danemark',IE:'Irlande',GR:'Grèce',CZ:'Tchéquie',RO:'Roumanie',UA:'Ukraine',AE:'Émirats arabes unis',QA:'Qatar',KE:'Kenya',GH:'Ghana',PK:'Pakistan',ID:'Indonésie',MY:'Malaisie',TH:'Thaïlande',VN:'Vietnam',AR:'Argentine',CL:'Chili',CO:'Colombie',PE:'Pérou' }[code];
                    if (!meta) return null;
                    const isActive = activeCountry === code;
                    const barMax = Math.max(...Object.values(scholarshipCounts));
                    const barColor = count >= 10 ? c.accent : count >= 7 ? '#2563eb' : count >= 4 ? '#3b82f6' : '#93c5fd';
                    return (
                      <div key={code} onClick={() => setActiveCountry(code === activeCountry ? null : code)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', cursor: 'pointer', background: isActive ? c.paper2 : 'transparent', border: isActive ? `1px solid ${c.ruleSoft}` : '1px solid transparent' }}>
                        <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{meta === 'France' ? '🇫🇷' : meta === 'Allemagne' ? '🇩🇪' : '🌍'}</span>
                        <span style={{ flex: 1, fontSize: 11, color: isActive ? c.accent : c.ink2, fontWeight: isActive ? 700 : 400 }}>{meta}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: Math.round(count / barMax * 36), height: 4, background: barColor }} /><span style={{ fontSize: 10, fontWeight: 700, color: barColor, minWidth: 14 }}>{count}</span></div>
                      </div>
                    );
                  })}
                </div>
                {activeCountry && (() => { const meta = { FR:'France',DE:'Allemagne',GB:'Royaume-Uni',US:'États-Unis',CA:'Canada',AU:'Australie',JP:'Japon',CN:'Chine',KR:'Corée du Sud',TR:'Turquie',SA:'Arabie Saoudite',MA:'Maroc',TN:'Tunisie',IN:'Inde',BR:'Brésil',ZA:'Afrique du Sud',NG:'Nigéria',EG:'Égypte',BE:'Belgique',NL:'Pays-Bas',CH:'Suisse',SE:'Suède',NO:'Norvège',HU:'Hongrie',PL:'Pologne',IT:'Italie',ES:'Espagne',RU:'Russie',MX:'Mexique',NZ:'Nouvelle-Zélande',PT:'Portugal',AT:'Autriche',FI:'Finlande',DK:'Danemark',IE:'Irlande',GR:'Grèce',CZ:'Tchéquie',RO:'Roumanie',UA:'Ukraine',AE:'Émirats arabes unis',QA:'Qatar',KE:'Kenya',GH:'Ghana',PK:'Pakistan',ID:'Indonésie',MY:'Malaisie',TH:'Thaïlande',VN:'Vietnam',AR:'Argentine',CL:'Chili',CO:'Colombie',PE:'Pérou' }[activeCountry]; return meta && (
                  <div style={{ marginTop: 8, padding: '12px', background: c.paper2, border: `1px solid ${c.ruleSoft}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.accent, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span>{meta}</span><span style={{ fontSize: 10, background: c.accent, color: c.paper, padding: '2px 7px', fontWeight: 600 }}>{scholarshipCounts[activeCountry] || 0} {lang === 'fr' ? 'bourses' : 'scholarships'}</span></div>
                    {activeCountryBourses.length > 0 ? activeCountryBourses.map((b, i) => <div key={i} style={{ fontSize: 11, color: c.ink2, padding: '3px 0', borderBottom: i < activeCountryBourses.length - 1 ? `1px solid ${c.ruleSoft}` : 'none' }}>{b.nom}</div>) : <div style={{ fontSize: 11, color: c.ink3 }}>{lang === 'fr' ? 'Aucune bourse' : 'No scholarships'}</div>}
                    <button style={{ width: '100%', marginTop: 10, padding: '7px', background: c.warn, border: 'none', color: c.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer' }} onClick={() => handleQuickReply(lang === 'fr' ? `Montre-moi les bourses en ${meta} pour un étudiant tunisien` : `Show me scholarships in ${meta} for a Tunisian student`)}>{lang === 'fr' ? 'Explorer avec l\'IA' : 'Explore with AI'}</button>
                  </div>
                )})()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHAT FLOTTANT */}
      {showChat && (
        <div style={{ position: 'fixed', top: 80, right: 24, width: 360, height: 'calc(100vh - 100px)', background: c.surface, border: `1px solid ${c.rule}`, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 1000 }}>
          <div style={{ padding: '12px 16px', background: c.accent, color: c.paper, display: 'flex', justifyContent: 'space-between' }}><span>🤖 {lang === 'fr' ? 'Assistant' : 'Assistant'}</span><button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: c.paper, fontSize: 18, cursor: 'pointer' }}>✕</button></div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }} ref={chatContainerRef}>{messages.map((msg, i) => (<div key={i} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', marginBottom: 8 }}><div style={{ display: 'inline-block', background: msg.sender === 'user' ? c.accent : c.paper2, color: msg.sender === 'user' ? c.paper : c.ink, padding: '8px 12px', fontSize: 12 }}>{msg.text}</div></div>))}{loading && <div style={{ color: c.ink3, fontSize: 12, padding: 8 }}>{lang === 'fr' ? 'En train de répondre...' : 'Responding...'}</div>}</div>
          <div style={{ padding: 12, borderTop: `1px solid ${c.ruleSoft}` }}><ChatInput input={input} setInput={setInput} onSend={handleSend} loading={loading} /></div>
        </div>
      )}

      {/* DRAWER BOURSE */}
      {drawerBourse && (
        <BourseDrawer bourse={drawerBourse} onClose={() => setDrawerBourse(null)} onAskAI={b => { handleQuickReply(lang === 'fr' ? `Donne-moi les détails sur "${b.nom}"` : `Give me details about "${b.nom}"`); setDrawerBourse(null); }} onChoose={b => handleQuickReply(lang === 'fr' ? 'je choisis ' + b.nom : 'I choose ' + b.nom)} applied={appliedNoms.has(drawerBourse.nom?.trim().toLowerCase())} onApply={async b => { try { await axiosInstance.post(API_ROUTES.roadmap.create, { userId: user.id, userEmail: user.email || '', nom: b.nom, pays: b.pays || '', lienOfficiel: b.lienOfficiel || '', financement: b.financement || '', dateLimite: b.dateLimite || null, ajouteLe: new Date().toISOString(), statut: lang === 'fr' ? 'en_cours' : 'in_progress', etapeCourante: 0 }); setAppliedNoms(prev => new Set([...prev, b.nom?.trim().toLowerCase()])); } catch (e) { console.error(e); } }} starred={starredNoms.has(drawerBourse.nom?.trim().toLowerCase())} onStar={async (b, isStarred) => { const nomKey = b.nom?.trim().toLowerCase(); try { const res = await axiosInstance.get(API_ROUTES.favoris.byUser(user.id) + '&limit=1&depth=0'); const doc = res.data.docs?.[0]; if (isStarred) { if (doc?.id) { const newB = (doc.bourses || []).filter(x => x.nom?.trim().toLowerCase() !== nomKey); await axiosInstance.patch(API_ROUTES.favoris.update(doc.id), { bourses: newB }); setStarredNoms(prev => { const s = new Set(prev); s.delete(nomKey); return s; }); } } else { const nb = { nom: b.nom, pays: b.pays || '', lienOfficiel: b.lienOfficiel || '', financement: b.financement || '', dateLimite: b.dateLimite || null, ajouteLe: new Date().toISOString() }; if (doc?.id) await axiosInstance.patch(API_ROUTES.favoris.update(doc.id), { bourses: [...(doc.bourses || []), nb] }); else await axiosInstance.post(API_ROUTES.favoris.create, { user: user.id, userEmail: user.email || '', bourses: [nb] }); setStarredNoms(prev => new Set([...prev, nomKey])); } } catch (e) { console.error(e); } }} user={user} />
      )}

      {/* BOUTON CHAT FLOTTANT */}
      <button onClick={() => setShowChat(p => !p)} style={{ position: 'fixed', bottom: 24, right: 24, width: 48, height: 48, background: c.warn, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: c.accent, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>{showChat ? '✕' : '💬'}</button>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} c={c} lang={lang} />}
    </main>
  );
}