import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ChatInput from '../components/ChatInput';
import axiosInstance from '@/config/axiosInstance';
import BourseDrawer from '../components/Boursedrawer';
import { API_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import axios from 'axios';
import { WEBHOOK_ROUTES } from '@/config/routes';

// ─── DESIGN TOKENS (identiques à HomePage) ────────────────────────────────────
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

// ─── QUICK REPLIES ─────────────────────────────────────────────────────────────
const getQuickReplies = (lang) => [
  {
    icon: '🎯',
    label: lang === 'fr' ? 'Bourses cette semaine' : 'Closing this week',
    text: lang === 'fr' ? 'Quelles bourses ferment cette semaine ?' : 'Which scholarships close this week?',
  },
  {
    icon: '🔎',
    label: lang === 'fr' ? 'Analyser mon éligibilité' : 'Check eligibility',
    text: lang === 'fr' ? 'Analyse mon éligibilité pour la bourse Rhodes' : 'Analyze my eligibility for the Rhodes Scholarship',
  },
  {
    icon: '📝',
    label: lang === 'fr' ? 'Rédiger mon essai' : 'Write my essay',
    text: lang === 'fr' ? 'Aide-moi à rédiger mon essai pour Chevening' : 'Help me write my essay for Chevening',
  },
  {
    icon: '🎙️',
    label: lang === 'fr' ? 'Préparer entretien' : 'Prepare interview',
    text: lang === 'fr' ? "Je veux m'entraîner pour un entretien de bourse" : 'I want to practice for a scholarship interview',
  },
  {
    icon: '📄',
    label: lang === 'fr' ? 'Analyser mon CV' : 'Analyze my CV',
    text: lang === 'fr' ? 'Je veux analyser mon CV' : 'I want to analyze my CV',
  },
  {
    icon: '🔐',
    label: lang === 'fr' ? 'Me connecter' : 'Sign in',
    text: lang === 'fr' ? 'Je veux me connecter' : 'I want to sign in',
  },
];

// ─── HERO STATS ────────────────────────────────────────────────────────────────
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

// ─── ANIMATED STAT NUMBER ──────────────────────────────────────────────────────
function StatNumber({ value, suffix = '', loading }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (loading || value === null) return;
    const target = parseInt(value), steps = 30, inc = target / steps;
    let step = 0;
    const t = setInterval(() => {
      step++;
      setDisplayed(Math.min(Math.round(inc * step), target));
      if (step >= steps) clearInterval(t);
    }, 800 / steps);
    return () => clearInterval(t);
  }, [value, loading]);
  if (loading || value === null) return <span style={{ opacity: 0.4 }}>—</span>;
  return <span>{displayed}{suffix}</span>;
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
    if (/^[🎓🌍💰📋🔍•\-_\*#]+$/.test(line) || /voir détails|postuler|apply now|click here/i.test(line)) continue;

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
  let t = text
    .replace(/\[\[BOURSES:[\s\S]*?\]\]/g, '')
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/BOURSES_JSON:[\s\S]*?(?=\n\n|$)/g, '');

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

// ─── BOURSE CARD (horizontal compacte dans le chat) ───────────────────────────
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
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px',
        background: c.surface,
        border: `1px solid ${c.rule}`,
        borderLeft: `3px solid ${barColor}`,
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'all .18s',
        marginTop: 8,
        animationDelay: `${index * 0.07}s`,
      }}
      onClick={() => onDetails?.(bourse)}
      onMouseEnter={e => { e.currentTarget.style.background = c.paper2; e.currentTarget.style.borderLeftColor = '#f5a623'; e.currentTarget.style.transform = 'translateX(3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = c.surface; e.currentTarget.style.borderLeftColor = barColor; e.currentTarget.style.transform = 'translateX(0)'; }}
    >
      <span style={{ fontSize: 22, flexShrink: 0 }}>{flag}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: c.fSans, fontSize: 12.5, fontWeight: 700, color: c.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bourse.nom}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          {bourse.pays && <span style={{ fontFamily: c.fSans, fontSize: 10.5, color: c.ink3 }}>{bourse.pays}</span>}
          {bourse.niveau && <><span style={{ color: c.rule }}>·</span><span style={{ fontFamily: c.fSans, fontSize: 10.5, color: c.ink3 }}>{bourse.niveau}</span></>}
          {dl && (
            <span style={{ fontFamily: c.fSans, fontSize: 10, fontWeight: 700, color: isUrgent ? '#b91c1c' : '#1d4ed8', background: isUrgent ? '#fef2f2' : '#eff6ff', border: `1px solid ${isUrgent ? '#fecaca' : '#bfdbfe'}`, borderRadius: 4, padding: '2px 6px' }}>
              ⏰ {daysLeft < 0 ? 'Expiré' : daysLeft === 0 ? "Auj." : `${daysLeft}j`}
            </span>
          )}
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right', marginRight: 6 }}>
        <div style={{ fontFamily: c.fSans, fontSize: 16, fontWeight: 800, color: c.accent, lineHeight: 1 }}>
          {/* match score si disponible */}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        {bourse.lienOfficiel && (
          <a href={bourse.lienOfficiel} target="_blank" rel="noopener noreferrer"
            style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${c.rule}`, background: c.paper2, color: c.ink3, fontSize: 11, fontFamily: c.fSans, textDecoration: 'none', fontWeight: 600 }}
            onClick={e => e.stopPropagation()}>🔗</a>
        )}
        <button
          onClick={e => { e.stopPropagation(); handleApply(); }}
          disabled={appDone || applying}
          style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: appDone ? '#166534' : c.accent, color: '#fff', fontSize: 11, fontFamily: c.fSans, fontWeight: 700, cursor: appDone ? 'default' : 'pointer', transition: 'all .15s' }}>
          {applying ? '⏳' : appDone ? '✓' : '+ Postuler'}
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
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
        padding: '8px 12px',
        background: c.paper2, border: `1px solid ${c.rule}`, borderRadius: 8,
      }}>
        <span style={{ fontSize: 16 }}>🎓</span>
        <span style={{ fontFamily: c.fSans, fontSize: 13, fontWeight: 700, color: c.ink }}>
          {bourses.length} bourse{bourses.length > 1 ? 's' : ''} recommandée{bourses.length > 1 ? 's' : ''}
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: c.fSans, fontSize: 10.5, color: c.ink3, background: c.surface, border: `1px solid ${c.rule}`, borderRadius: 20, padding: '2px 10px' }}>
          {lang === 'fr' ? 'selon votre profil' : 'matching your profile'}
        </span>
      </div>
      {bourses.slice(0, visible).map((b, i) => (
        <BourseCardCompact
          key={b.id || b.nom || i}
          bourse={b} index={i}
          applied={appliedNoms?.has(b.nom?.trim().toLowerCase())}
          onApply={onApply}
          onDetails={(bo) => onDetails?.(enrich(bo))}
          c={c}
        />
      ))}
      {visible < bourses.length && (
        <button
          onClick={() => setVisible(v => v + 3)}
          style={{
            width: '100%', marginTop: 10, padding: '9px', borderRadius: 8,
            border: `1.5px dashed ${c.rule}`, background: 'transparent',
            color: c.ink3, fontFamily: c.fSans, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all .18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = c.paper2; e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.color = c.accent; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = c.rule; e.currentTarget.style.color = c.ink3; }}
        >
          {lang === 'fr' ? `Voir ${Math.min(3, bourses.length - visible)} de plus ↓` : `Show ${Math.min(3, bourses.length - visible)} more ↓`}
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

  const avatarStyle = {
    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, marginTop: 2,
    fontFamily: c.fSans, fontSize: 13, fontWeight: 700,
  };

  const AIAvatar = () => (
    <div style={{ ...avatarStyle, background: '#0a1a2e', border: `1px solid #2a3a5e` }}>
      <img src="/logo.png" alt="IA" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }}
        onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span style="color:#f5a623;font-size:14px;">✦</span>'; }} />
    </div>
  );
  const UserAvatar = () => (
    <div style={{ ...avatarStyle, background: c.accent, color: '#fff' }}>👤</div>
  );

  // User message
  if (!isAI) {
    return (
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexDirection: 'row-reverse', animation: 'msgIn .3s ease both', animationDelay: `${index * 0.03}s` }}>
        <UserAvatar />
        <div style={{ maxWidth: '78%' }}>
          <div style={{ padding: '10px 15px', borderRadius: 12, borderTopRightRadius: 3, background: c.accent, color: '#fff', fontFamily: c.fSans, fontSize: 13.5, lineHeight: 1.55 }}>
            {formatText(msg.text)}
          </div>
        </div>
      </div>
    );
  }

  // AI message without cards
  if (validBourses.length === 0) {
    return (
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, animation: 'msgIn .3s ease both', animationDelay: `${index * 0.03}s` }}>
        <AIAvatar />
        <div style={{ maxWidth: '86%' }}>
          {cleanText && (
            <div style={{ padding: '10px 15px', borderRadius: 12, borderTopLeftRadius: 3, background: c.paper2, border: `1px solid ${c.rule}`, color: c.ink, fontFamily: c.fSans, fontSize: 13.5, lineHeight: 1.55 }}>
              {formatText(cleanText)}
              {msg.voiceInput && <div style={{ marginTop: 8, display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 10, background: c.rule, color: c.ink3, fontWeight: 600 }}>🎤 Vocal</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // AI message with bourse cards
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18, animation: 'msgIn .3s ease both', animationDelay: `${index * 0.03}s` }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <AIAvatar />
        {cleanText && (
          <div style={{ flex: 1, maxWidth: '86%', padding: '10px 15px', borderRadius: 12, borderTopLeftRadius: 3, background: c.paper2, border: `1px solid ${c.rule}`, color: c.ink, fontFamily: c.fSans, fontSize: 13.5, lineHeight: 1.55 }}>
            {formatText(cleanText)}
          </div>
        )}
      </div>
      <div style={{ paddingLeft: 42 }}>
        <BourseCardsGrid
          bourses={validBourses} appliedNoms={appliedNoms} onApply={onApply} onDetails={onDetails}
          allBourses={allBourses} c={c} lang={lang}
        />
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
      style={{
        position: 'sticky', bottom: 10, right: 10, float: 'right',
        width: 34, height: 34, borderRadius: '50%', background: c.accent,
        border: 'none', color: '#fff', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 20, marginTop: 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all .18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = c.accentInk; e.currentTarget.style.transform = 'scale(1.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = c.accent; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ─── MAIN CHAT PAGE ────────────────────────────────────────────────────────────
export default function ChatPage({ user, messages, input, setInput, loading, handleSend, handleQuickReply, chatContainerRef, setView, bourses = [], appliedNoms, onApplyBourse }) {
  const { t, lang } = useT();
  const c = tokens('light'); // Connectez à useTheme() si disponible
  const heroStats = useHeroStats();
  const [showScroll, setShowScroll] = useState(false);
  const localRef = useRef(null);
  const containerRef = chatContainerRef || localRef;
  const quickReplies = getQuickReplies(lang);
  const [drawer, setDrawer] = useState(null);
  const appliedSet = useMemo(() => appliedNoms instanceof Set ? appliedNoms : new Set((appliedNoms || []).map(n => n?.trim().toLowerCase())), [appliedNoms]);
  const [starredNoms, setStarredNoms] = useState(new Set());
  const [appliedNomsLocal, setAppliedNomsLocal] = useState(new Set());

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
  }, [user, lang]);

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

  // ─── Progress data ─────────────────────────────────────────────────────────
  const progressItems = [
    { icon: '👤', label: lang === 'fr' ? 'Profil' : 'Profile', value: '80%', pct: 80, color: c.accent },
    { icon: '🗺️', label: lang === 'fr' ? 'Roadmap' : 'Roadmap', value: lang === 'fr' ? '2 en cours' : '2 active', pct: 40, color: '#166534' },
    { icon: '📄', label: lang === 'fr' ? 'Documents' : 'Documents', value: lang === 'fr' ? 'CV prêt' : 'CV ready', pct: 60, color: '#7c3aed' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', fontFamily: c.fSans, background: c.paper }}>

      {/* ══════════════════════════════════════════════════════════════════════
          §1 · HERO — Tableau de bord de conversation
      ══════════════════════════════════════════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes msgIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes dotBounce { 0%,60%,100% { transform:scale(.7); opacity:.5; } 30% { transform:scale(1.1); opacity:1; } }
        @keyframes cardIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
        @keyframes statPulse { 0%,100% { opacity:.4; } 50% { opacity:1; } }
      `}</style>

      {/* Hero section — fond sombre comme homepage */}
      <section style={{
        position: 'relative', width: '100vw', maxWidth: '100vw',
        marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)',
        background: 'linear-gradient(135deg, #0a1a2e 0%, #0f2d50 55%, #1a3a6b 100%)',
        padding: '36px 24px 0', overflow: 'hidden',
      }}>
        {/* Orbes décoratifs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(245,166,35,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 800, margin: '0 auto' }}>

          {/* ── Barre de progression rapide ── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
            {progressItems.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                flex: 1, minWidth: 130,
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, padding: '10px 14px',
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: c.fSans, fontSize: 9.5, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '.14em', fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontFamily: c.fSans, fontSize: 12.5, color: '#fff', fontWeight: 700 }}>{item.value}</div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 2, transition: 'width .8s ease' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Salutation ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: c.fSans, fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 8 }}>
              {lang === 'fr' ? 'Tableau de bord' : 'Dashboard'}
            </div>
            <h1 style={{ fontFamily: c.fSerif, fontSize: 'clamp(22px,4vw,34px)', fontWeight: 700, color: '#fff', lineHeight: 1.15, letterSpacing: '-.015em', margin: 0 }}>
              {lang === 'fr'
                ? <>{user?.name ? `Bonjour ${user.name},` : 'Bonjour,'} prêt à franchir <em style={{ color: '#f5a623', fontStyle: 'italic' }}>l'étape suivante</em> ?</>
                : <>{user?.name ? `Hello ${user.name},` : 'Hello,'} ready for your <em style={{ color: '#f5a623', fontStyle: 'italic' }}>next step</em>?</>}
            </h1>
          </div>

          {/* ── Quick Actions ── */}
          <div style={{ fontFamily: c.fSans, fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', fontWeight: 600, marginBottom: 10 }}>
            {lang === 'fr' ? 'Actions rapides' : 'Quick actions'}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 0, paddingBottom: 0 }}>
            {quickReplies.map((qr, i) => (
              <button
                key={i}
                onClick={() => handleQuickReply(qr.text)}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 9,
                  flex: '1 1 160px', minWidth: 140,
                  padding: '11px 14px',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)',
                  borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  transition: 'all .2s', fontFamily: c.fSans, opacity: loading ? 0.45 : 1,
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>{qr.icon}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', fontWeight: 500, lineHeight: 1.4 }}>{qr.label}</span>
              </button>
            ))}
          </div>

          {/* Espacement avant chat box */}
          <div style={{ height: 32 }} />

          {/* ── Chat Box ── */}
          <div style={{
            background: c.surface, border: `1px solid ${c.rule}`,
            borderTop: `3px solid #f5a623`,
            borderRadius: '14px 14px 0 0',
            overflow: 'hidden',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
          }}>
            {/* Messages */}
            <div
              ref={containerRef}
              style={{ height: 460, overflowY: 'auto', padding: '20px 20px 10px', scrollBehavior: 'smooth', position: 'relative' }}
            >
              {/* Welcome screen */}
              {messages.length === 0 && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#0a1a2e', border: '1px solid #2a3a5e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src="/logo.png" alt="OppsTrack" style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4 }}
                      onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span style="color:#f5a623;font-size:16px;">✦</span>'; }} />
                  </div>
                  <div style={{ background: c.paper2, border: `1px solid ${c.rule}`, borderRadius: '0 12px 12px 12px', padding: '16px 20px', fontFamily: c.fSans, fontSize: 13.5, color: c.ink, lineHeight: 1.6 }}>
                    <p><strong>{lang === 'fr' ? 'Bonjour' : 'Hello'}{user?.name ? ` ${user.name}` : ''}!</strong> 👋</p>
                    <p style={{ color: c.ink2, marginTop: 6 }}>{lang === 'fr' ? 'Utilisez les actions rapides ci-dessus ou posez-moi directement votre question.' : 'Use the quick actions above or ask me directly.'}</p>
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
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#f5a623', fontSize: 14 }}>✦</span>
                  </div>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '12px 16px', background: c.paper2, border: `1px solid ${c.rule}`, borderRadius: 12, borderTopLeftRadius: 3 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: c.accent, display: 'inline-block', animation: 'dotBounce 1.2s infinite ease-in-out', animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}

              <ScrollToBottomButton onClick={scrollToBottom} visible={showScroll} c={c} />
            </div>

            {/* Chat input */}
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${c.rule}`, background: c.paper2 }}>
              <ChatInput input={input} setInput={setInput} onSend={() => handleSend()} loading={loading} />
            </div>
          </div>
        </div>

        {/* Fondu bas vers paper */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: c.paper, zIndex: 3 }} />
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §2 · STATS BAR (style homepage)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 40, flexWrap: 'wrap',
        background: '#0a1a2e',
        padding: '20px 36px', width: '100vw',
        maxWidth: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)',
        borderBottom: `3px solid #f5a623`,
      }}>
        {[
          { value: heroStats.totalBourses, suffix: heroStats.totalBourses >= 500 ? '+' : '', label: lang === 'fr' ? 'Bourses' : 'Scholarships' },
          { value: heroStats.pctFinancees, suffix: '%', label: lang === 'fr' ? 'Financées' : 'Funded' },
          { value: null, static: '24/7', label: lang === 'fr' ? 'IA active' : 'AI active' },
        ].map((stat, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.12)' }} />}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: c.fSans, fontSize: '1.8rem', fontWeight: 800, color: '#f5a623', minWidth: 60, textAlign: 'center' }}>
                {stat.static ?? <StatNumber value={stat.value} suffix={stat.suffix} loading={!heroStats.loaded} />}
              </span>
              <span style={{ fontFamily: c.fSans, fontSize: 10.5, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{stat.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          §3 · DRAWER (détails bourse en sidebar)
      ══════════════════════════════════════════════════════════════════════ */}
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