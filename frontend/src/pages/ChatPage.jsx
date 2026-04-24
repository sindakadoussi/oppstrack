import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ChatInput from '../components/ChatInput';
import axiosInstance from '@/config/axiosInstance';
import BourseDrawer from '../components/Boursedrawer';
import { API_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import axios from 'axios';
import { WEBHOOK_ROUTES } from '@/config/routes';

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const tokens = (theme = 'light') => ({
  accent:    theme === 'dark' ? '#4c9fd9' : '#0066b3',
  accentInk: theme === 'dark' ? '#8ec1e6' : '#004f8a',
  accent2:   '#f5a623',
  ink:       theme === 'dark' ? '#f2efe7' : '#141414',
  ink2:      theme === 'dark' ? '#cfccc2' : '#3a3a3a',
  ink3:      theme === 'dark' ? '#a19f96' : '#6b6b6b',
  ink4:      theme === 'dark' ? '#6d6b64' : '#9a9794',
  paper:     theme === 'dark' ? '#15140f' : '#faf8f3',
  paper2:    theme === 'dark' ? '#1d1c16' : '#f2efe7',
  rule:      theme === 'dark' ? '#2b2a22' : '#d9d5cb',
  ruleSoft:  theme === 'dark' ? '#24231c' : '#e8e4d9',
  surface:   theme === 'dark' ? '#1a1912' : '#ffffff',
  danger:    '#b4321f',
  fSerif: `"Playfair Display", "Times New Roman", Georgia, serif`,
  fSans:  `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
});

// ─── HERO STATS HOOK ───────────────────────────────────────────────────────────
function useHeroStats() {
  const [stats, setStats] = useState({ totalBourses: null, pctFinancees: null, loaded: false });
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get(API_ROUTES.bourses.list, { params: { limit: 500, depth: 0 } });
        const docs = res.data.docs || [];
        const total = res.data.totalDocs ?? docs.length;
        const fin = docs.filter(b => {
          const f = (b.financement || '').toLowerCase();
          return f.includes('100') || f.includes('total') || f.includes('complet') || f.includes('intégral');
        });
        setStats({ totalBourses: total, pctFinancees: total > 0 ? Math.round((fin.length / total) * 100) : null, loaded: true });
      } catch {
        setStats({ totalBourses: 500, pctFinancees: 98, loaded: true });
      }
    };
    fetchStats();
  }, []);
  return stats;
}

// ─── SMART ACTIONS ─────────────────────────────────────────────────────────────
const INTENTS = [
  { label: 'Trouver une bourse',      labelEn: 'Find a scholarship',     key: 'find'    },
  { label: 'Préparer ma candidature', labelEn: 'Prepare my application', key: 'apply'   },
  { label: 'Améliorer mes chances',   labelEn: 'Improve my chances',     key: 'improve' },
  { label: 'Analyser mon profil',     labelEn: 'Analyze my profile',     key: 'analyze' },
];

const getSmartReplies = (intent, user, lang) => {
  const isComplete = user?.niveau && user?.domaine;
  if (!isComplete) {
    return lang === 'fr'
      ? ['Compléter mon profil', 'Analyse rapide sans profil', 'Voir des exemples de bourses']
      : ['Complete my profile', 'Quick analysis without profile', 'See scholarship examples'];
  }
  const map = {
    find:    lang === 'fr'
      ? ['Meilleures bourses pour moi', 'Bourses en Europe', 'Bourses ouvertes maintenant', 'Bourses 100% financées', 'Fermeture imminente']
      : ['Best scholarships for me', 'Scholarships in Europe', 'Currently open', 'Fully funded', 'Closing soon'],
    apply:   lang === 'fr'
      ? ['Créer mon CV académique', 'Rédiger lettre de motivation', 'Corriger mon essay', 'Préparer entretien', 'Documents requis']
      : ['Create my academic CV', 'Write motivation letter', 'Review my essay', 'Prepare interview', 'Required documents'],
    improve: lang === 'fr'
      ? ['Ma probabilité de succès ?', 'Quelle stratégie adopter ?', 'Mes points faibles', 'Comment me démarquer ?', "Plan d'amélioration"]
      : ['My success probability?', 'What strategy?', 'My weak points', 'How to stand out?', 'Improvement plan'],
    analyze: lang === 'fr'
      ? ['Suis-je éligible ?', 'Score de mon profil', 'Bourses adaptées', 'Ce qui manque', 'Optimiser mon profil']
      : ['Am I eligible?', 'My profile score', 'Matching scholarships', 'What is missing', 'Optimize my profile'],
  };
  return map[intent] || [];
};

function SmartActions({ user, onSelect, lang, c }) {
  const [active, setActive] = useState(null);
  const replies = getSmartReplies(active, user, lang);

  return (
    <div style={{ marginBottom: 32, width: '100%' }}>
      <div style={{ fontFamily: c.fSans, fontSize: 10, color: c.ink3, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
        {lang === 'fr' ? 'Actions intelligentes' : 'Smart actions'}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        {INTENTS.map((intent) => {
          const isActive = active === intent.key;
          return (
            <button
              key={intent.key}
              onClick={() => setActive(isActive ? null : intent.key)}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = c.paper2; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = c.surface; }}
              style={{
                padding: '8px 18px',
                background: isActive ? c.accent : c.surface,
                border: `1px solid ${isActive ? c.accent : c.rule}`,
                cursor: 'pointer',
                fontFamily: c.fSans,
                fontSize: 12.5,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#fff' : c.ink,
                transition: 'all .18s',
                borderRadius: 40,
              }}
            >
              {lang === 'fr' ? intent.label : intent.labelEn}
            </button>
          );
        })}
      </div>
      {active && replies.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', animation: 'smartActionsIn .2s ease both' }}>
          {replies.map((r, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(r.replace(/^[^\w\u00C0-\u024F]*/, '').trim())}
              onMouseEnter={e => { e.currentTarget.style.background = c.accent; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = c.accent; }}
              onMouseLeave={e => { e.currentTarget.style.background = c.surface; e.currentTarget.style.color = c.ink2; e.currentTarget.style.borderColor = c.rule; }}
              style={{ padding: '5px 14px', border: `1px solid ${c.rule}`, background: c.surface, color: c.ink2, cursor: 'pointer', fontSize: 12, fontFamily: c.fSans, fontWeight: 600, transition: 'all .15s', borderRadius: 40 }}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MINI DASHBOARD ────────────────────────────────────────────────────────────
function ProgressBar({ value, color }) {
  return (
    <div style={{ width: '100%', height: 3, background: '#e8e4d9', marginTop: 4 }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: '100%', background: color, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  );
}

function MiniDashboard({ user, stats = {}, lang, c }) {
  const completion = stats.completion ?? 0;
  const readiness  = stats.readiness  ?? 0;
  const completionColor = completion >= 80 ? '#166534' : completion >= 50 ? c.accent : '#b45309';
  const readinessColor  = readiness  >= 70 ? '#166534' : readiness  >= 40 ? c.accent : '#b45309';

  return (
    <div style={{ border: `1px solid ${c.rule}`, borderTop: `3px solid ${c.accent2}`, background: c.surface, padding: '20px', marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontFamily: c.fSans, fontSize: 10, color: c.ink3, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase' }}>
          {lang === 'fr' ? 'Tableau de bord' : 'Dashboard'}
        </span>
        {user?.name && <span style={{ fontFamily: c.fSans, fontSize: 11, color: c.ink4, fontWeight: 500 }}>{user.name}</span>}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
          <span style={{ fontFamily: c.fSans, fontSize: 11, color: c.ink3, fontWeight: 600 }}>{lang === 'fr' ? 'Profil complété' : 'Profile complete'}</span>
          <span style={{ fontFamily: c.fSans, fontSize: 13, fontWeight: 700, color: completionColor }}>{completion}%</span>
        </div>
        <ProgressBar value={completion} color={completionColor} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { label: lang === 'fr' ? 'Niveau' : 'Level',  value: user?.niveau  || (lang === 'fr' ? 'Non renseigné' : 'Not set') },
          { label: lang === 'fr' ? 'Domaine' : 'Field', value: user?.domaine || (lang === 'fr' ? 'Non renseigné' : 'Not set') },
        ].map(({ label, value }) => (
          <div key={label} style={{ flex: 1, padding: '6px 10px', background: c.paper2, border: `1px solid ${c.ruleSoft}`, fontFamily: c.fSans }}>
            <div style={{ fontSize: 9, color: c.ink4, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: c.ink, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: c.ruleSoft, marginBottom: 16 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: lang === 'fr' ? 'Bourses'  : 'Matches', value: stats.matches ?? 0,  color: c.accent      },
          { label: lang === 'fr' ? 'Urgentes' : 'Urgent',  value: stats.urgent  ?? 0,  color: '#b91c1c'     },
          { label: lang === 'fr' ? 'Prêt'     : 'Ready',   value: `${readiness}%`,      color: readinessColor },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontFamily: c.fSans, fontSize: 9, color: c.ink4, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontFamily: c.fSans, fontSize: 18, fontWeight: 700, color, letterSpacing: '-0.02em' }}>{value}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
          <span style={{ fontFamily: c.fSans, fontSize: 11, color: c.ink3, fontWeight: 600 }}>{lang === 'fr' ? 'Prêt à postuler' : 'Application readiness'}</span>
        </div>
        <ProgressBar value={readiness} color={readinessColor} />
      </div>
    </div>
  );
}

// ─── POST SUGGESTIONS ──────────────────────────────────────────────────────────
function PostSuggestions({ onClick, lang, c }) {
  const suggestions = lang === 'fr'
    ? ['Ajouter à ma roadmap', 'Analyser cette bourse', 'Comparer avec une autre', 'Préparer ma candidature']
    : ['Add to my roadmap', 'Analyze this scholarship', 'Compare with another', 'Prepare my application'];

  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onClick(s.replace(/^[^\w\u00C0-\u024F]*/, '').trim())}
          onMouseEnter={e => { e.currentTarget.style.background = c.accent; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = c.accent; }}
          onMouseLeave={e => { e.currentTarget.style.background = c.surface; e.currentTarget.style.color = c.ink3; e.currentTarget.style.borderColor = c.rule; }}
          style={{ padding: '4px 10px', border: `1px solid ${c.rule}`, background: c.surface, color: c.ink3, cursor: 'pointer', fontSize: 11, fontFamily: c.fSans, fontWeight: 600, transition: 'all .15s', borderRadius: 4 }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ─── PARSE BOURSES ─────────────────────────────────────────────────────────────
function parseBourses(msg) {
  if (msg?.bourses && Array.isArray(msg.bourses) && msg.bourses.length > 0) {
    return msg.bourses.map(b => ({
      ...b, _fromText: false,
      nom: b.nom?.trim(), pays: b.pays?.trim() || '', financement: b.financement?.trim() || '',
      niveau: b.niveau?.trim() || '', description: b.description?.trim() || '',
      lienOfficiel: b.lienOfficiel?.trim() || '', domaine: b.domaine?.trim() || '',
    }));
  }
  const text = msg?.text || '';
  if (!text) return [];
  const lines = text.split('\n');
  const bourses = [];
  let current = null;
  const isFakeTitle = (nom) => {
    if (!nom) return true;
    const n = nom.trim();
    return n.length < 8 || /^(consultez|notez|préparez|prochaines étapes|voir détails|apply|click|summary)/i.test(n) || /^[\*\_#\-•\d\s]+$/.test(n);
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/prochaines étapes|💡|voir \d+ bourses|selon votre profil|summary/i.test(line)) break;
    const start = line.match(/^(?:#+\s*)?(\d+)[\.\)\s]*[️⃣]?\s*(.+)/);
    if (start) {
      if (current?.nom && current.nom.length >= 8) bourses.push(current);
      let nom = start[2].replace(/^[^:]+:\s*/, '').replace(/\*\*/g, '').trim().replace(/^[\uFE0F\u20E3\s]+/, '').trim();
      if (isFakeTitle(nom)) { current = null; continue; }
      current = { nom, pays: '', financement: '', niveau: '', description: '', lienOfficiel: '', domaine: '', _fromText: true };
      continue;
    }
    if (!current) continue;
    const fieldMatch =
      line.match(/^(?:•\s*[-–]?\s*)?(?:🌍\s*)?(pays|country)\s*[:\-–]\s*(.+)/i) ||
      line.match(/^(?:•\s*[-–]?\s*)?(?:💰\s*)?(financement|funding)\s*[:\-–]\s*(.+)/i) ||
      line.match(/^(?:•\s*[-–]?\s*)?(?:🎓\s*)?(niveau|level)\s*[:\-–]\s*(.+)/i) ||
      line.match(/^(?:•\s*[-–]?\s*)?(?:📝\s*)?(description|details)\s*[:\-–]\s*(.+)/i) ||
      line.match(/^(?:•\s*[-–]?\s*)?(?:📚\s*)?(domaine|field)\s*[:\-–]\s*(.+)/i);
    if (fieldMatch) {
      const key = fieldMatch[1].toLowerCase();
      const value = fieldMatch[2]?.trim() || '';
      if (/pays|country/.test(key)) current.pays = value;
      else if (/financement|funding/.test(key)) current.financement = value;
      else if (/niveau|level/.test(key)) current.niveau = value;
      else if (/description|details/.test(key)) current.description = value;
      else if (/domaine|field/.test(key)) current.domaine = value;
      continue;
    }
    if (!current.lienOfficiel) {
      const link = line.match(/\[.*?\]\((https?:\/\/[^)]+)\)/) || line.match(/\((https?:\/\/[^)]+)\)/);
      if (link) { current.lienOfficiel = link[1]; continue; }
    }
  }
  if (current?.nom && current.nom.length >= 8) bourses.push(current);
  const unique = [], seen = new Set();
  for (const b of bourses) {
    if (!b?.nom) continue;
    const key = b.nom.toLowerCase().trim();
    if (!seen.has(key) && b.nom.length >= 8 && !/^(consultez|notez|préparez|apply|click)/i.test(b.nom)) {
      seen.add(key);
      unique.push({ ...b, nom: b.nom.trim(), pays: b.pays?.trim() || '', financement: b.financement?.trim() || '', niveau: b.niveau?.trim() || '', description: b.description?.trim() || '', lienOfficiel: b.lienOfficiel?.trim() || '', domaine: b.domaine?.trim() || '' });
    }
  }
  return unique;
}

// ─── CLEAN MESSAGE TEXT ────────────────────────────────────────────────────────
function cleanMessageText(text, lang = 'fr') {
  if (!text) return '';
  let t = text.replace(/\[\[BOURSES:[\s\S]*?\]\]/g, '').replace(/```json[\s\S]*?```/g, '').replace(/BOURSES_JSON:[\s\S]*?(?=\n\n|$)/g, '');
  const lines = t.split('\n');
  const cleanLines = [];
  let inBourseSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^#{0,3}\s*(?:[🏥🎓✨💡]\s*)?(?:bourses|recommandées|scholarships|liste|voici les)/i.test(trimmed)) { inBourseSection = true; continue; }
    if (inBourseSection) {
      if (/^(###\s*)?(?:📌\s*Prochaines|✨|💡|💬|Prêt|Astuce|Conseil|Note|Bonne chance)/i.test(trimmed)) { inBourseSection = false; cleanLines.push(trimmed); continue; }
      continue;
    }
    if (/^[-*_]{3,}$/.test(trimmed)) continue;
    if (/^•\s*[-–]?\s*[🌍💰🎓📝🔗📚]/.test(trimmed)) continue;
    if (/^[🌍💰🎓📝🔗]\s+[\w\-:]/.test(trimmed)) continue;
    if (/\[Lien officiel|Official link\]\(https?:\/\//i.test(trimmed) || /^https?:\/\/[^\s]+(?:scholarship|bourse)/i.test(trimmed)) continue;
    if (/^(?:#{1,3}\s*)?\d+[\.\)\s]*[️⃣]?\s*[^\n]{10,}/.test(trimmed)) continue;
    cleanLines.push(trimmed);
  }
  const result = cleanLines.join('\n').trim();
  const defaultMsg = lang === 'fr' ? 'Voici les bourses qui correspondent à votre profil :' : 'Here are the scholarships matching your profile:';
  return result.length > 10 ? result : defaultMsg;
}

// ─── BOURSE CARD COMPACT ───────────────────────────────────────────────────────
function BourseCardCompact({ bourse, onApply, onDetails, applied, index, c }) {
  const [applying, setApplying] = useState(false);
  const [appDone, setAppDone] = useState(applied);
  const dl = bourse.dateLimite ? new Date(bourse.dateLimite) : null;
  const daysLeft = dl ? Math.round((dl - new Date()) / 86400000) : null;
  const isUrgent = daysLeft !== null && daysLeft <= 7;
  const flags = { France:'🇫🇷', Allemagne:'🇩🇪', 'Royaume-Uni':'🇬🇧', 'États-Unis':'🇺🇸', Canada:'🇨🇦', Australie:'🇦🇺', Japon:'🇯🇵', Maroc:'🇲🇦', Tunisie:'🇹🇳', Belgique:'🇧🇪', Suisse:'🇨🇭', International:'🌍', Mondial:'🌐' };
  const flag = bourse.pays ? (flags[bourse.pays] || '🌍') : '🌍';
  const accentColors = ['#0066b3', '#166534', '#7c3aed', '#f5a623', '#0891b2', '#dc2626'];
  const barColor = accentColors[index % accentColors.length];

  const handleApply = async () => {
    if (appDone) return;
    setApplying(true);
    await onApply?.(bourse);
    setAppDone(true);
    setApplying(false);
  };

  return (
    <div
      onClick={() => onDetails?.(bourse)}
      onMouseEnter={e => { e.currentTarget.style.background = c.paper2; e.currentTarget.style.borderLeftColor = c.accent2; e.currentTarget.style.transform = 'translateX(3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = c.surface; e.currentTarget.style.borderLeftColor = barColor; e.currentTarget.style.transform = 'translateX(0)'; }}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: c.surface, border: `1px solid ${c.rule}`, borderLeft: `3px solid ${barColor}`, borderRadius: 0, cursor: 'pointer', transition: 'all .18s', marginTop: 8 }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>{flag}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: c.fSans, fontSize: 12.5, fontWeight: 700, color: c.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '.01em' }}>{bourse.nom}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          {bourse.pays && <span style={{ fontFamily: c.fSans, fontSize: 10.5, color: c.ink3 }}>{bourse.pays}</span>}
          {bourse.niveau && <><span style={{ color: c.rule }}>·</span><span style={{ fontFamily: c.fSans, fontSize: 10.5, color: c.ink3 }}>{bourse.niveau}</span></>}
          {dl && (
            <span style={{ fontFamily: c.fSans, fontSize: 10, fontWeight: 700, color: isUrgent ? '#b91c1c' : '#1d4ed8', background: isUrgent ? '#fef2f2' : '#eff6ff', border: `1px solid ${isUrgent ? '#fecaca' : '#bfdbfe'}`, borderRadius: 3, padding: '2px 6px' }}>
              {daysLeft < 0 ? 'Expiré' : daysLeft === 0 ? 'Aujourd\'hui' : `${daysLeft}j`}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        {bourse.lienOfficiel && (
          <a href={bourse.lienOfficiel} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            style={{ padding: '5px 10px', border: `1px solid ${c.rule}`, background: 'transparent', color: c.ink3, fontSize: 11, fontFamily: c.fSans, textDecoration: 'none', fontWeight: 600, borderRadius: 4 }}>
            Lien
          </a>
        )}
        <button
          onClick={e => { e.stopPropagation(); handleApply(); }}
          disabled={appDone || applying}
          style={{ padding: '5px 14px', border: 'none', background: appDone ? '#166534' : c.accent, color: '#fff', fontSize: 11, fontFamily: c.fSans, fontWeight: 700, cursor: appDone ? 'default' : 'pointer', letterSpacing: '.05em', textTransform: 'uppercase', transition: 'all .15s', borderRadius: 4 }}>
          {applying ? '...' : appDone ? '✓' : 'Postuler'}
        </button>
      </div>
    </div>
  );
}

// ─── BOURSE CARDS GRID ─────────────────────────────────────────────────────────
function BourseCardsGrid({ bourses, onApply, onDetails, appliedNoms, allBourses, c, lang }) {
  const [visible, setVisible] = useState(3);
  if (!bourses || bourses.length === 0) return null;

  const enrich = (b) => {
    if (!b._fromText || !allBourses?.length) return b;
    const found = allBourses.find(db => {
      const a = (db.nom || '').toLowerCase().trim(), cv = (b.nom || '').toLowerCase().trim();
      return a === cv || a.includes(cv.slice(0, 12)) || cv.includes(a.slice(0, 12));
    });
    return found ? { ...found, _enriched: true } : b;
  };

  return (
    <div style={{ width: '100%', marginTop: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${c.rule}` }}>
        <span style={{ fontFamily: c.fSans, fontSize: 10, color: c.accent, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase' }}>
          {bourses.length} bourse{bourses.length > 1 ? 's' : ''}
        </span>
        <span style={{ fontFamily: c.fSans, fontSize: 10, color: c.ink3, fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase' }}>
          {lang === 'fr' ? 'recommandées' : 'recommended'}
        </span>
        <div style={{ flex: 1, height: 1, background: c.ruleSoft }} />
        <span style={{ fontFamily: c.fSans, fontSize: 10, color: c.ink4 }}>{lang === 'fr' ? 'selon votre profil' : 'matching your profile'}</span>
      </div>
      {bourses.slice(0, visible).map((b, i) => (
        <BourseCardCompact
          key={b.id || b.nom || i} bourse={b} index={i}
          applied={appliedNoms?.has(b.nom?.trim().toLowerCase())}
          onApply={onApply}
          onDetails={(bo) => onDetails?.(enrich(bo))}
          c={c}
        />
      ))}
      {visible < bourses.length && (
        <button
          onClick={() => setVisible(v => v + 3)}
          onMouseEnter={e => { e.currentTarget.style.color = c.accent; e.currentTarget.style.borderColor = c.accent; }}
          onMouseLeave={e => { e.currentTarget.style.color = c.ink3; e.currentTarget.style.borderColor = c.rule; }}
          style={{ width: '100%', marginTop: 10, padding: '9px', border: `1px solid ${c.rule}`, background: 'transparent', color: c.ink3, fontFamily: c.fSans, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .18s', letterSpacing: '.12em', textTransform: 'uppercase' }}>
          {lang === 'fr' ? `Voir ${Math.min(3, bourses.length - visible)} de plus →` : `Show ${Math.min(3, bourses.length - visible)} more →`}
        </button>
      )}
    </div>
  );
}

// ─── CHAT MESSAGE ──────────────────────────────────────────────────────────────
function ChatMessage({ msg, index, appliedNoms, onApply, onDetails, handleQuickReply, allBourses, lang, c }) {
  const isAI = msg.sender === 'ai';
  const detectedBourses = useMemo(() => { if (!isAI) return []; return parseBourses(msg); }, [msg, isAI]);
  const cleanText = useMemo(() => {
    if (!isAI) return msg.text;
    return cleanMessageText(msg.text || '', lang);
  }, [msg.text, isAI, lang]);

  const formatText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part
      );
      if (/^\s*[-•·✓→★\d+\.]\s/.test(line)) return <div key={i} style={{ paddingLeft: 8, color: isAI ? c.ink2 : 'rgba(255,255,255,0.9)', fontSize: 13 }}>• {parts}</div>;
      if (line.trim() === '') return <br key={i} />;
      return <div key={i}>{parts}</div>;
    });
  };

  const validBourses = detectedBourses.filter(b =>
    b.nom && b.nom.length > 8 && !/chercher|recevoir|consulter|préparer|notez|vérifiez|consultez/i.test(b.nom)
  );

  const AIAvatar = () => (
    <div style={{ width: 30, height: 30, background: '#0a1a2e', border: '1px solid #2a3a5e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
      <img src="/logo.png" alt="IA" style={{ width: 16, height: 16, objectFit: 'contain' }}
        onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span style="color:#f5a623;font-size:13px;">✦</span>'; }} />
    </div>
  );

  const UserAvatar = () => (
    <div style={{ width: 30, height: 30, background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, color: '#fff', fontSize: 13 }}>👤</div>
  );

  if (!isAI) {
    return (
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexDirection: 'row-reverse', animation: 'msgIn .3s ease both', animationDelay: `${index * 0.03}s` }}>
        <UserAvatar />
        <div style={{ maxWidth: '78%' }}>
          <div style={{ padding: '10px 16px', background: c.accent, color: '#fff', fontFamily: c.fSans, fontSize: 13.5, lineHeight: 1.6, borderRadius: 8 }}>
            {formatText(msg.text)}
          </div>
        </div>
      </div>
    );
  }

  if (validBourses.length === 0) {
    return (
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, animation: 'msgIn .3s ease both', animationDelay: `${index * 0.03}s` }}>
        <AIAvatar />
        <div style={{ maxWidth: '86%' }}>
          {cleanText && (
            <div style={{ padding: '10px 16px', background: c.paper2, border: `1px solid ${c.rule}`, borderLeft: `3px solid ${c.accent}`, color: c.ink, fontFamily: c.fSans, fontSize: 13.5, lineHeight: 1.6, borderRadius: 8 }}>
              {formatText(cleanText)}
              {msg.voiceInput && (
                <div style={{ marginTop: 8, display: 'inline-block', fontSize: 10, padding: '2px 8px', background: c.rule, color: c.ink3, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', borderRadius: 4 }}>Vocal</div>
              )}
            </div>
          )}
          <PostSuggestions onClick={(text) => handleQuickReply(text)} lang={lang} c={c} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, animation: 'msgIn .3s ease both', animationDelay: `${index * 0.03}s` }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <AIAvatar />
        {cleanText && (
          <div style={{ flex: 1, maxWidth: '86%', padding: '10px 16px', background: c.paper2, border: `1px solid ${c.rule}`, borderLeft: `3px solid ${c.accent}`, color: c.ink, fontFamily: c.fSans, fontSize: 13.5, lineHeight: 1.6, borderRadius: 8 }}>
            {formatText(cleanText)}
          </div>
        )}
      </div>
      <div style={{ paddingLeft: 40 }}>
        <BourseCardsGrid bourses={validBourses} appliedNoms={appliedNoms} onApply={onApply} onDetails={onDetails} allBourses={allBourses} c={c} lang={lang} />
        <PostSuggestions onClick={(text) => handleQuickReply(text)} lang={lang} c={c} />
      </div>
    </div>
  );
}

// ─── SCROLL TO BOTTOM BUTTON ───────────────────────────────────────────────────
function ScrollToBottomButton({ onClick, visible, c }) {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      style={{ position: 'sticky', bottom: 10, right: 10, float: 'right', width: 32, height: 32, background: c.accent, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, marginTop: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all .18s', borderRadius: 40 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ─── MAIN CHAT PAGE ────────────────────────────────────────────────────────────
export default function ChatPage({ user, messages, input, setInput, loading, handleSend, handleQuickReply, chatContainerRef, setView, bourses = [], appliedNoms, onApplyBourse }) {
  const { t, lang } = useT();
  const c = tokens('light');
  const heroStats = useHeroStats();
  const [showScroll, setShowScroll] = useState(false);
  const localRef = useRef(null);
  const containerRef = chatContainerRef || localRef;
  const [drawer, setDrawer] = useState(null);
  const appliedSet = useMemo(() => appliedNoms instanceof Set ? appliedNoms : new Set((appliedNoms || []).map(n => n?.trim().toLowerCase())), [appliedNoms]);
  const [starredNoms, setStarredNoms] = useState(new Set());
  const [appliedNomsLocal, setAppliedNomsLocal] = useState(new Set());

  // ── Dashboard stats ────────────────────────────────────────────────────────
  const dashboardStats = useMemo(() => {
    const now = new Date();
    const urgentCount = bourses.filter(b => {
      if (!b.dateLimite) return false;
      const dl = new Date(b.dateLimite);
      const days = Math.round((dl - now) / 86400000);
      return days >= 0 && days <= 7;
    }).length;
    const profileFields = ['niveau', 'domaine', 'pays', 'email', 'name'];
    const filled = profileFields.filter(f => user?.[f]).length;
    const completion = Math.round((filled / profileFields.length) * 100);
    return {
      completion,
      matches: heroStats.totalBourses ?? bourses.length,
      urgent: urgentCount,
      readiness: Math.min(100, completion + (appliedSet.size > 0 ? 15 : 0)),
    };
  }, [bourses, user, heroStats.totalBourses, appliedSet]);

  const scrollToBottom = () => { if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight; };

  useEffect(() => { scrollToBottom(); }, [messages, loading]);
  useEffect(() => { setTimeout(scrollToBottom, 100); }, []);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => setShowScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
    el.addEventListener('scroll', check);
    check();
    return () => el.removeEventListener('scroll', check);
  }, []);

  const handleStar = useCallback(async (bourse, isStarred) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id) return;
    try {
      const { data: favData } = await axiosInstance.get('/api/favoris', { params: { 'where[user][equals]': user.id, limit: 1, depth: 0 } });
      const favDoc = favData.docs?.[0];
      const bourseData = { nom: bourse.nom, pays: bourse.pays || '', lienOfficiel: bourse.lienOfficiel || '', financement: bourse.financement || '', dateLimite: bourse.dateLimite || null, ajouteLe: new Date().toISOString() };
      if (isStarred) {
        if (favDoc?.id) await axiosInstance.patch(`/api/favoris/${favDoc.id}`, { bourses: (favDoc.bourses || []).filter(b => b.nom?.trim().toLowerCase() !== nomKey) });
        setStarredNoms(prev => { const s = new Set(prev); s.delete(nomKey); return s; });
      } else {
        if (favDoc?.id) await axiosInstance.patch(`/api/favoris/${favDoc.id}`, { bourses: [...(favDoc.bourses || []), bourseData] });
        else await axiosInstance.post('/api/favoris', { user: user.id, userEmail: user.email || '', bourses: [bourseData] });
        setStarredNoms(prev => new Set([...prev, nomKey]));
      }
    } catch (err) { console.error('[handleStar]', err); }
    window.dispatchEvent(new CustomEvent('favoris-updated'));
  }, [user]);

  const handleApply = useCallback(async (bourse) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id || appliedSet.has(nomKey) || appliedNomsLocal.has(nomKey)) return;
    try {
      const res = await axiosInstance.post(API_ROUTES.roadmap.create, {
        userId: user.id, userEmail: user.email || '', nom: bourse.nom, pays: bourse.pays || '',
        lienOfficiel: bourse.lienOfficiel || '', financement: bourse.financement || '',
        dateLimite: bourse.dateLimite || null, ajouteLe: new Date().toISOString(),
        statut: 'en_cours', etapeCourante: 0,
      });
      try {
        await axios.post(WEBHOOK_ROUTES.generateRoadmap, {
          roadmapId: res.data.doc?.id || res.data.id,
          user: { id: user.id, email: user.email, niveau: user.niveau, domaine: user.domaine },
          bourse: { nom: bourse.nom, pays: bourse.pays, lien: bourse.lienOfficiel },
        });
      } catch (webhookErr) { console.warn('Webhook roadmap non disponible', webhookErr); }
      setAppliedNomsLocal(prev => new Set([...prev, nomKey]));
      if (typeof onApplyBourse === 'function') await onApplyBourse(bourse);
    } catch (err) {
      console.error('[handleApply]', err);
      alert(lang === 'fr' ? "Erreur lors de l'initialisation de la candidature." : 'Error initializing application.');
    }
  }, [user, appliedSet, appliedNomsLocal, onApplyBourse, lang]);

  const handleAskAI = useCallback((bourse) => {
    handleQuickReply?.(`Donne-moi tous les détails sur "${bourse.nom}" : conditions, financement, processus de candidature`);
  }, [handleQuickReply]);

  const handleSmartSelect = useCallback((text) => {
    setInput(text);
    setTimeout(() => handleSend(), 50);
  }, [setInput, handleSend]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', fontFamily: c.fSans, background: c.paper }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes msgIn          { from { opacity:0; transform:translateY(6px);  } to { opacity:1; transform:none; } }
        @keyframes dotBounce      { 0%,60%,100% { transform:scale(.7); opacity:.5; } 30% { transform:scale(1.1); opacity:1; } }
        @keyframes fadeUp         { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }
        @keyframes smartActionsIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }
      `}</style>

      <section style={{ width: '100%', padding: '80px 40px 0', borderBottom: `1px solid ${c.rule}`, background: c.paper, animation: 'fadeUp .5s ease both' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Titre */}
          <h1 style={{ fontFamily: c.fSerif, fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.05, color: c.ink, margin: '0 0 48px', textAlign: 'center' }}>
            {lang === 'fr'
              ? <>
prêt à obtenir des réponses à   <em style={{ color: c.accent, fontStyle: 'italic' }}>toutes</em> vos questions ?</>
              : <>Turn    <em style={{ color: c.accent, fontStyle: 'italic' }}>every</em> question into clarity. </>}
          </h1>

          {/* Smart Actions - Centered above chat */}
          <SmartActions user={user} onSelect={handleSmartSelect} lang={lang} c={c} />

          {/* Chat Section - Centered */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontFamily: c.fSans, fontSize: 10, color: c.ink3, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase' }}>
                Opptrack AI · {lang === 'fr' ? 'En ligne' : 'Online'}
              </span>
            </div>

            <div style={{ background: c.surface, border: `1px solid ${c.rule}`, borderTop: `3px solid ${c.accent}`, borderRadius: 12, overflow: 'hidden' }}>
              <div ref={containerRef} style={{ height: 450, overflowY: 'auto', padding: '24px', scrollBehavior: 'smooth', position: 'relative' }}>

                {/* Welcome */}
                {messages.length === 0 && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0' }}>
                    <div style={{ width: 30, height: 30, background: '#0a1a2e', border: '1px solid #2a3a5e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: 8 }}>
                      <img src="/logo.png" alt="OppsTrack" style={{ width: 16, height: 16, objectFit: 'contain' }}
                        onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span style="color:#f5a623;">✦</span>'; }} />
                    </div>
                    <div style={{ background: c.paper2, border: `1px solid ${c.rule}`, borderLeft: `3px solid ${c.accent}`, padding: '16px 20px', fontFamily: c.fSans, fontSize: 13.5, color: c.ink, lineHeight: 1.6, borderRadius: 8 }}>
                      <div style={{ borderLeft: `2px solid ${c.rule}`, paddingLeft: 12, marginBottom: 10, fontFamily: c.fSerif, fontSize: 13, color: c.ink3, fontStyle: 'italic' }}>
                        « {lang === 'fr' ? 'Suis-je éligible au DAAD avec mon profil ?' : 'Am I eligible for the DAAD scholarship?'} »
                      </div>
                      <p><strong>{lang === 'fr' ? 'Bonjour' : 'Hello'}{user?.name ? ` ${user.name}` : ''}!</strong></p>
                      <p style={{ color: c.ink2, marginTop: 6 }}>{lang === 'fr' ? 'Utilisez les actions ci-dessus ou posez-moi directement votre question.' : 'Use the actions above or ask me directly.'}</p>
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((msg, i) => (
                  <ChatMessage
                    key={i} msg={msg} index={i}
                    appliedNoms={appliedSet} onApply={handleApply}
                    onDetails={setDrawer} allBourses={bourses}
                    handleQuickReply={handleQuickReply} lang={lang} c={c}
                  />
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 30, height: 30, background: '#0a1a2e', border: '1px solid #2a3a5e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: 8 }}>
                      <span style={{ color: '#f5a623', fontSize: 12 }}>✦</span>
                    </div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '12px 16px', background: c.paper2, border: `1px solid ${c.rule}`, borderLeft: `3px solid ${c.accent}`, borderRadius: 8 }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: c.accent, display: 'inline-block', animation: 'dotBounce 1.2s infinite ease-in-out', animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                  </div>
                )}

                <ScrollToBottomButton onClick={scrollToBottom} visible={showScroll} c={c} />
              </div>

              <div style={{ padding: '14px 18px', borderTop: `1px solid ${c.rule}`, background: c.paper2 }}>
                <ChatInput input={input} setInput={setInput} onSend={() => handleSend()} loading={loading} />
              </div>
            </div>
          </div>

          {/* Dashboard - Below chat */}
          <MiniDashboard user={user} stats={dashboardStats} lang={lang} c={c} />

          <div style={{ height: 80 }} />
        </div>
      </section>

      {/* Drawer */}
      {drawer && (
        <BourseDrawer
          bourse={drawer}
          onClose={() => setDrawer(null)}
          starred={starredNoms.has(drawer.nom?.trim().toLowerCase()) || appliedSet.has(drawer.nom?.trim().toLowerCase())}
          onStar={handleStar}
          onChoose={handleApply}
          applied={appliedSet.has(drawer.nom?.trim().toLowerCase()) || appliedNomsLocal.has(drawer.nom?.trim().toLowerCase())}
          onApply={handleApply}
          onAskAI={handleAskAI}
          user={user}
        />
      )}
    </div>
  );
}