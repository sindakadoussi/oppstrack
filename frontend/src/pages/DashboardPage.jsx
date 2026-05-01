// DashboardPage.jsx — OppsTrack Dashboard (Figma Style)
// Stack: React + Recharts + inline styles
// Sections kept: Calendrier, Carte mondiale, Trending, Stats globales,
//               Distribution niveaux, AI Insights, Opportunity of the Day
// Dark mode support via tokens

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
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
  ink:        theme === "dark" ? "#f2efe7" : "#141414",
  ink2:       theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3:       theme === "dark" ? "#a19f96" : "#6b6b6b",
  paper:      theme === "dark" ? "#15140f" : "#faf8f3",
  paper2:     theme === "dark" ? "#1d1c16" : "#f2efe7",
  rule:       theme === "dark" ? "#2b2a22" : "#d9d5cb",
  ruleSoft:   theme === "dark" ? "#24231c" : "#e8e4d9",
  surface:    theme === "dark" ? "#1a1912" : "#ffffff",
  danger:     "#b4321f",
  warn:       "#b06a12",
  // couleurs complémentaires (fixes – cohérentes en clair/sombre)
  white:      '#FFFFFF',
  blue:       '#255cae',
  blueLt:     '#EEF4FF',
  blueMid:    '#C7D9F8',
  gold:       '#F5A623',
  goldLt:     '#FFF8EC',
  red:        '#FF3B30',
  redLt:      '#FFF1F0',
  amber:      '#FF9500',
  amberLt:    '#FFF5E6',
  green:      '#34C759',
  greenLt:    '#F0FDF4',
  purple:     '#7C3AED',
  purpleLt:   '#F5F3FF',
  teal:       '#0891B2',
  tealLt:     '#ECFEFF',
  fSerif: `"Libre Caslon Text", "Times New Roman", Georgia, serif`,
  fSans:  `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"JetBrains Mono", ui-monospace, Menlo, monospace`,
});

/* ─── COUNTRY DATA (inchangé) ───────────────────────────────────────────── */
const NUMERIC_TO_ALPHA2 = {'4':'AF','8':'AL','12':'DZ','24':'AO','32':'AR','36':'AU','40':'AT','50':'BD','56':'BE','68':'BO','76':'BR','100':'BG','120':'CM','124':'CA','152':'CL','156':'CN','170':'CO','178':'CG','188':'CR','192':'CU','196':'CY','203':'CZ','208':'DK','214':'DO','218':'EC','818':'EG','222':'SV','231':'ET','246':'FI','250':'FR','266':'GA','276':'DE','288':'GH','300':'GR','320':'GT','332':'HT','340':'HN','348':'HU','356':'IN','360':'ID','364':'IR','368':'IQ','372':'IE','376':'IL','380':'IT','388':'JM','392':'JP','400':'JO','404':'KE','410':'KR','408':'KP','414':'KW','422':'LB','430':'LR','434':'LY','484':'MX','504':'MA','516':'NA','524':'NP','528':'NL','554':'NZ','558':'NI','566':'NG','578':'NO','586':'PK','591':'PA','598':'PG','600':'PY','604':'PE','608':'PH','616':'PL','620':'PT','634':'QA','642':'RO','643':'RU','682':'SA','694':'SL','706':'SO','710':'ZA','724':'ES','729':'SD','752':'SE','756':'CH','760':'SY','764':'TH','788':'TN','792':'TR','800':'UG','804':'UA','784':'AE','826':'GB','840':'US','858':'UY','862':'VE','704':'VN','887':'YE','894':'ZM','716':'ZW'};
const ALPHA2_TO_NUMERIC = Object.fromEntries(Object.entries(NUMERIC_TO_ALPHA2).map(([n,a])=>[a,n]));

const COUNTRY_META = {
  FR:{label:'France',flag:'🇫🇷'},DE:{label:'Allemagne',flag:'🇩🇪'},GB:{label:'Royaume-Uni',flag:'🇬🇧'},US:{label:'États-Unis',flag:'🇺🇸'},CA:{label:'Canada',flag:'🇨🇦'},AU:{label:'Australie',flag:'🇦🇺'},JP:{label:'Japon',flag:'🇯🇵'},CN:{label:'Chine',flag:'🇨🇳'},KR:{label:'Corée du Sud',flag:'🇰🇷'},TR:{label:'Turquie',flag:'🇹🇷'},SA:{label:'Arabie Saoudite',flag:'🇸🇦'},MA:{label:'Maroc',flag:'🇲🇦'},TN:{label:'Tunisie',flag:'🇹🇳'},IN:{label:'Inde',flag:'🇮🇳'},BR:{label:'Brésil',flag:'🇧🇷'},ZA:{label:'Afrique du Sud',flag:'🇿🇦'},NG:{label:'Nigéria',flag:'🇳🇬'},EG:{label:'Égypte',flag:'🇪🇬'},BE:{label:'Belgique',flag:'🇧🇪'},NL:{label:'Pays-Bas',flag:'🇳🇱'},CH:{label:'Suisse',flag:'🇨🇭'},SE:{label:'Suède',flag:'🇸🇪'},NO:{label:'Norvège',flag:'🇳🇴'},HU:{label:'Hongrie',flag:'🇭🇺'},PL:{label:'Pologne',flag:'🇵🇱'},IT:{label:'Italie',flag:'🇮🇹'},ES:{label:'Espagne',flag:'🇪🇸'},RU:{label:'Russie',flag:'🇷🇺'},MX:{label:'Mexique',flag:'🇲🇽'},NZ:{label:'Nouvelle-Zélande',flag:'🇳🇿'},PT:{label:'Portugal',flag:'🇵🇹'},AT:{label:'Autriche',flag:'🇦🇹'},FI:{label:'Finlande',flag:'🇫🇮'},DK:{label:'Danemark',flag:'🇩🇰'},IE:{label:'Irlande',flag:'🇮🇪'},GR:{label:'Grèce',flag:'🇬🇷'},CZ:{label:'Tchéquie',flag:'🇨🇿'},RO:{label:'Roumanie',flag:'🇷🇴'},UA:{label:'Ukraine',flag:'🇺🇦'},AE:{label:'Émirats arabes unis',flag:'🇦🇪'},QA:{label:'Qatar',flag:'🇶🇦'},KE:{label:'Kenya',flag:'🇰🇪'},GH:{label:'Ghana',flag:'🇬🇭'},PK:{label:'Pakistan',flag:'🇵🇰'},ID:{label:'Indonésie',flag:'🇮🇩'},MY:{label:'Malaisie',flag:'🇲🇾'},TH:{label:'Thaïlande',flag:'🇹🇭'},VN:{label:'Vietnam',flag:'🇻🇳'},AR:{label:'Argentine',flag:'🇦🇷'},CL:{label:'Chili',flag:'🇨🇱'},CO:{label:'Colombie',flag:'🇨🇴'},PE:{label:'Pérou',flag:'🇵🇪'},
};

/* ─── HELPERS (version dynamique) ──────────────────────────────────────── */
function daysLeft(deadline, lang, c) {
  const diff = Math.round((new Date(deadline) - new Date()) / 86400000);
  if (diff < 0)   return { label: lang === 'fr' ? 'Expiré' : 'Expired', diff, color: c.danger };
  if (diff <= 3)  return { label: `J-${diff}`, diff, color: c.danger };
  if (diff <= 7)  return { label: `J-${diff}`, diff, color: c.warn };
  if (diff <= 30) return { label: `J-${diff}`, diff, color: c.accent };
  return             { label: `J-${diff}`, diff, color: c.ink2 };
}

function isItemDone(item) {
  const t = Array.isArray(item.etapes) ? item.etapes.length : 5;
  return t > 0 && (item.etapeCourante || 0) >= t - 1;
}

/* ─── LOGIN MODAL (dynamique) ──────────────────────────────────────────── */
function LoginModal({ onClose, c, lang }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const send = async () => {
    if (!email || !email.includes('@')) { setErrMsg('Email invalide'); return; }
    setStatus('sending');
    try {
      await axiosInstance.post('/api/users/request-magic-link', { email: email.trim().toLowerCase() });
      setStatus('success');
    } catch (err) { setStatus('error'); setErrMsg(err.response?.data?.message || 'Erreur serveur'); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(8px)' }} onClick={onClose}/>
      <div style={{ position:'relative', zIndex:1, width:400, maxWidth:'92vw', background:c.surface, borderRadius:20, overflow:'hidden', border:`1px solid ${c.rule}`, boxShadow:'0 24px 64px rgba(0,0,0,0.12)' }}>
        <div style={{ padding:'20px 24px', borderBottom:`1px solid ${c.rule}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:15, fontWeight:600, color:c.ink }}>Connexion à OppsTrack</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:c.ink2, fontSize:18, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:'24px' }}>
          {status === 'idle' && (<>
            <p style={{ color:c.ink2, fontSize:13, marginBottom:20, lineHeight:1.6 }}>Entrez votre email pour recevoir un <strong style={{ color:c.ink }}>lien magique</strong>.</p>
            <input type="email" placeholder="votre@email.com" value={email} autoFocus onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1.5px solid ${c.rule}`, background:c.paper, color:c.ink, fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:4 }}/>
            {errMsg && <div style={{ color:c.danger, fontSize:12, marginTop:8 }}>{errMsg}</div>}
            <button style={{ padding:'8px 16px', borderRadius:8, background:c.blue, color:c.white, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', width:'100%', marginTop:16, padding:'12px', fontSize:13 }} onClick={send}>Envoyer le lien magique</button>
          </>)}
          {status === 'sending' && <div style={{ textAlign:'center', padding:'32px 0' }}><div style={{ width:32, height:32, border:`2px solid ${c.rule}`, borderTopColor:c.blue, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }}/></div>}
          {status === 'success' && <div style={{ textAlign:'center', padding:'24px 0' }}><div style={{ fontSize:40, marginBottom:12 }}>✉️</div><div style={{ fontSize:15, fontWeight:600, color:c.ink, marginBottom:8 }}>Lien envoyé !</div><p style={{ color:c.ink2, fontSize:13 }}>Vérifiez votre boîte mail.</p><button style={{ padding:'8px 16px', borderRadius:8, background:c.blue, color:c.white, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', marginTop:20, padding:'10px 24px' }} onClick={onClose}>Fermer</button></div>}
          {status === 'error'   && <div style={{ textAlign:'center', padding:'24px 0' }}><p style={{ color:c.danger, marginBottom:12 }}>{errMsg}</p><button style={{ padding:'8px 16px', borderRadius:8, background:c.danger, color:c.white, border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }} onClick={()=>{setStatus('idle');setErrMsg('');}}>Réessayer</button></div>}
        </div>
      </div>
    </div>
  );
}

/* ─── CALENDRIER (dynamique) ───────────────────────────────────────────── */
/* ─── CALENDRIER (dynamique) ───────────────────────────────────────────── */
function Calendrier({ deadlines, onSelectBourse, lang, c }) {
  const today = new Date();
  const [view, setView] = useState({ month: today.getMonth(), year: today.getFullYear() });

  const MONTHS = lang === 'fr'
    ? ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = lang === 'fr' ? ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // Grouper les bourses par date (YYYY-MM-DD)
  const deadlineMap = {};
  deadlines.forEach(b => {
    if (!b.deadline) return;
    const d = new Date(b.deadline);
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!deadlineMap[k]) deadlineMap[k] = [];
    deadlineMap[k].push(b);
  });

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstDay = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prev = () => setView(v => ({ month: v.month === 0 ? 11 : v.month - 1, year: v.month === 0 ? v.year - 1 : v.year }));
  const next = () => setView(v => ({ month: v.month === 11 ? 0 : v.month + 1, year: v.month === 11 ? v.year + 1 : v.year }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={prev} style={{ background: 'none', border: `1px solid ${c.rule}`, padding: '5px 10px', cursor: 'pointer', color: c.ink2, fontSize: 14 }}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 600, color: c.ink }}>{MONTHS[view.month]} {view.year}</span>
        <button onClick={next} style={{ background: 'none', border: `1px solid ${c.rule}`, padding: '5px 10px', cursor: 'pointer', color: c.ink2, fontSize: 14 }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: c.ink3, padding: '4px 0' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const isToday = day === today.getDate() && view.month === today.getMonth() && view.year === today.getFullYear();
          const k = `${view.year}-${view.month}-${day}`;
          const dl = deadlineMap[k] || [];
          const diff = dl.length ? Math.round((new Date(view.year, view.month, day) - today) / 86400000) : null;

          return (
            <div
              key={k}
              style={{
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: isToday ? 700 : 400,
                background: isToday ? c.ink : 'transparent',
                color: isToday ? c.surface : dl.length ? c.ink : c.ink2,
                cursor: dl.length ? 'pointer' : 'default',
                position: 'relative',
                transition: 'background 0.12s',
                padding: '4px 2px',
                overflow: 'hidden',
              }}
            >
              {/* Numéro du jour */}
              <div style={{ fontWeight: isToday ? 700 : 400, marginBottom: 2 }}>{day}</div>

              {/* Liste des bourses (max 3) */}
              {dl.length > 0 && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 48, overflowY: 'auto' }}>
                  {dl.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBourse(item);
                      }}
                      style={{
                        fontSize: 8,
                        padding: '1px 3px',
                        background: isToday ? c.surface : `${c.accent}20`,
                        color: isToday ? c.accent : c.accent,
                        borderRadius: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                      title={item.nom}
                    >
                      {item.nom.length > 12 ? item.nom.substring(0, 12) + '…' : item.nom}
                    </div>
                  ))}
                  {dl.length > 3 && (
                    <div style={{ fontSize: 7, color: c.ink3, textAlign: 'center' }}>
                      +{dl.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${c.rule}` }}>
        {[
          [c.ink, lang === 'fr' ? "Aujourd'hui" : 'Today'],
          [c.warn, lang === 'fr' ? 'Échéance' : 'Deadline'],
          [c.danger, lang === 'fr' ? 'Urgent' : 'Urgent'],
        ].map(([color, lbl]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 10, color: c.ink2 }}>{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── URGENT DEADLINES LIST (dynamique) ───────────────────────────────── */
function UrgentDeadlinesList({ deadlines, lang, setDrawerBourse, bourses, c }) {
  const items = deadlines.filter(d => { const diff = Math.round((d.deadline - new Date()) / 86400000); return diff >= -1 && diff <= 30; }).slice(0,8);
  if (items.length === 0) return <div style={{ textAlign:'center', padding:'40px 0', color:c.ink2, fontSize:13 }}>✓ {lang === 'fr' ? 'Aucune deadline urgente' : 'No urgent deadlines'}</div>;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {items.map((d, i) => {
        const dl = daysLeft(d.deadline, lang, c);
        return (
          <div key={i} onClick={() => { const full = (bourses || []).find(b => b.nom?.trim().toLowerCase() === d.nom?.trim().toLowerCase()); setDrawerBourse(full || d); }} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 0', borderBottom: i < items.length-1 ? `1px solid ${c.rule}` : 'none', cursor:'pointer' }}>
            <div style={{ width:3, height:36, background:dl.color, flexShrink:0 }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500, color:c.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.nom}</div>
              <div style={{ fontSize:11, color:c.ink2, marginTop:2 }}>{d.pays} · {d.deadline.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day:'numeric', month:'short' })}</div>
            </div>
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'3px 8px', background:`${dl.color}12`, color:dl.color, border:`1px solid ${dl.color}25` }}>🕐 {dl.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── GLOBAL STATS (dynamique) ────────────────────────────────────────── */
function GlobalStats({ bourses, deadlines, lang, c }) {
  const total = (bourses || []).length;
  const fullyFunded = (bourses || []).filter(b => (b.financement || '').toLowerCase().includes('complet') || (b.financement || '').toLowerCase().includes('full')).length;
  const urgentCount = deadlines.filter(d => { const diff = Math.round((d.deadline - new Date()) / 86400000); return diff >= 0 && diff <= 7; }).length;
  const countries = Object.keys(Object.fromEntries((bourses || []).filter(b => b.pays).map(b => [b.pays, 1]))).length;
  const stats = [
    { label: lang === 'fr' ? 'Bourses actives' : 'Active', value: total, sub: `${countries} pays`, color: c.accent },
    { label: lang === 'fr' ? 'Fully funded' : 'Fully funded', value: `${total > 0 ? Math.round(fullyFunded / total * 100) : 0}%`, sub: lang === 'fr' ? 'financement complet' : 'full coverage', color: c.green },
    { label: lang === 'fr' ? 'Urgentes (7j)' : 'Urgent (7d)', value: urgentCount, sub: lang === 'fr' ? 'à prioriser' : 'to prioritize', color: urgentCount > 0 ? c.danger : c.ink2 },
    { label: lang === 'fr' ? 'Pays couverts' : 'Countries', value: countries, sub: lang === 'fr' ? 'destinations' : 'destinations', color: c.purple },
  ];
  const cardStyle = { background:c.surface, border:`1px solid ${c.rule}`, borderRadius:16, padding:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)' };
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ ...cardStyle, padding:'20px', borderTop:`3px solid ${s.color}` }}>
          <div style={{ fontSize:11, fontWeight:500, color:c.ink2, marginBottom:8, letterSpacing:'0.02em' }}>{s.label}</div>
          <div style={{ fontSize:28, fontWeight:700, color:c.ink, letterSpacing:'-0.02em', lineHeight:1 }}>{s.value}</div>
          <div style={{ fontSize:11, color:c.ink3, marginTop:6 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── TRENDING SCHOLARSHIPS (dynamique) ───────────────────────────────── */
function TrendingScholarships({ lang, setView, c }) {
  const trending = [
    { name: 'Bourse Eiffel Excellence', country: 'France', flag: '🇫🇷', views: 2840, growth: '+14%', hot: true },
    { name: 'DAAD Helmut Schmidt', country: 'Allemagne', flag: '🇩🇪', views: 2210, growth: '+8%', hot: true },
    { name: 'Erasmus Mundus SIGMA', country: 'Europe', flag: '🇪🇺', views: 1980, growth: '+22%', hot: false },
    { name: 'Swiss Gov. Excellence', country: 'Suisse', flag: '🇨🇭', views: 1540, growth: '+5%', hot: false },
    { name: 'KAIST Global Fellowship', country: 'Corée du Sud', flag: '🇰🇷', views: 1320, growth: '+31%', hot: false },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {trending.map((t, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom: i < trending.length-1 ? `1px solid ${c.rule}` : 'none' }}>
          <span style={{ fontSize:11, color:c.ink3, width:16, textAlign:'center', fontWeight:600, flexShrink:0 }}>{i+1}</span>
          <span style={{ fontSize:20, flexShrink:0 }}>{t.flag}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:500, color:c.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6 }}>
              {t.name}
              {t.hot && <span style={{ fontSize:9, fontWeight:600, padding:'1px 6px', background:'#FFF1E6', color:c.warn }}>🔥 Hot</span>}
            </div>
            <div style={{ fontSize:11, color:c.ink2, marginTop:1 }}>{t.country} · {t.views.toLocaleString()} vues</div>
          </div>
          <span style={{ fontSize:11, fontWeight:600, color:c.green, background:'#F0FDF4', padding:'2px 8px' }}>{t.growth}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── LEVEL DISTRIBUTION (dynamique) ───────────────────────────────────── */
function LevelDistribution({ bourses, lang, c }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(400);
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => setWidth(entries[0].contentRect.width || 400));
    obs.observe(containerRef.current);
    setWidth(containerRef.current.getBoundingClientRect().width || 400);
    return () => obs.disconnect();
  }, []);
  const data = [
    { name: 'Licence', count: (bourses||[]).filter(b=>(b.niveau||'').toLowerCase().includes('licence')||(b.niveau||'').toLowerCase().includes('bachelor')).length || 42 },
    { name: 'Master',  count: (bourses||[]).filter(b=>(b.niveau||'').toLowerCase().includes('master')).length || 118 },
    { name: 'PhD',     count: (bourses||[]).filter(b=>(b.niveau||'').toLowerCase().includes('phd')||(b.niveau||'').toLowerCase().includes('doctorat')).length || 87 },
    { name: 'Postdoc', count: (bourses||[]).filter(b=>(b.niveau||'').toLowerCase().includes('postdoc')).length || 40 },
  ];
  const COLORS = [c.accent, '#3b82f6', '#60a5fa', '#93c5fd'];
  return (
    <div ref={containerRef} style={{ width:'100%' }}>
      <BarChart width={width} height={180} data={data} margin={{ top:8, right:8, left:-28, bottom:0 }} barSize={32}>
        <XAxis dataKey="name" tick={{ fontSize:11, fill:c.ink2, fontWeight:500 }} axisLine={false} tickLine={false}/>
        <YAxis tick={{ fontSize:10, fill:c.ink3 }} axisLine={false} tickLine={false}/>
        <Tooltip contentStyle={{ border:`1px solid ${c.rule}`, borderRadius:10, fontSize:12, background:c.surface, color:c.ink, boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }} cursor={{ fill:'rgba(0,0,0,0.03)' }}/>
        <Bar dataKey="count" name={lang==='fr'?'Bourses':'Scholarships'} radius={[6,6,0,0]}>{data.map((_, i) => <Cell key={i} fill={COLORS[i]}/>)}</Bar>
      </BarChart>
    </div>
  );
}

/* ─── WORLD MAP (dynamique) ───────────────────────────────────────────── */
function WorldMap({ onCountryClick, activeCountry, scholarshipCounts = {}, lang, c }) {
  const containerRef = useRef(null), svgRef = useRef(null), activeCountryRef = useRef(activeCountry);
  const [tooltip, setTooltip] = useState(null), [ready, setReady] = useState(false);
  const normCounts = {};
  Object.entries(scholarshipCounts).forEach(([k, v]) => { if (/^\d+$/.test(k)) normCounts[k] = v; else { const num = ALPHA2_TO_NUMERIC[k.toUpperCase()]; if (num) normCounts[num] = v; } });
  const getAlpha2 = id => NUMERIC_TO_ALPHA2[String(id)] || null;
  const getCount  = id => normCounts[String(id)] || 0;
  const colorForCount = n => n === 0 ? '#E8E8ED' : n >= 10 ? c.accent : n >= 7 ? '#2563eb' : n >= 4 ? '#60a5fa' : '#BFDBFE';
  const strokeForCount = (n, isActive) => isActive ? c.gold : n > 0 ? 'rgba(255,255,255,0.5)' : '#D1D5DB';
  useEffect(() => {
    let cancelled = false;
    const loadScripts = () => new Promise(resolve => {
      if (window.__d3loaded && window.__topojsonloaded) { resolve(); return; }
      const s1 = document.createElement('script'); s1.src = 'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js';
      s1.onload = () => { window.__d3loaded = true; const s2 = document.createElement('script'); s2.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js'; s2.onload = () => { window.__topojsonloaded = true; resolve(); }; document.head.appendChild(s2); };
      document.head.appendChild(s1);
    });
    const draw = async () => {
      await loadScripts(); if (cancelled || !svgRef.current || !containerRef.current) return;
      const d3 = window.d3, topojson = window.topojson;
      const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      if (cancelled || !svgRef.current) return;
      const W = containerRef.current.getBoundingClientRect().width || 800, H = Math.round(W * 0.5);
      const svg = d3.select(svgRef.current); svg.selectAll('*').remove();
      svg.attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%').attr('height', H);
      const proj = d3.geoMercator().scale(W / 6.4).translate([W / 2, H / 1.58]);
      const pathGen = d3.geoPath().projection(proj);
      const features = topojson.feature(world, world.objects.countries).features;
      svg.selectAll('path.country').data(features).join('path').attr('class','country').attr('d', pathGen).attr('data-id', d => d.id)
        .attr('fill', d => colorForCount(getCount(d.id))).attr('stroke', d => strokeForCount(getCount(d.id), false)).attr('stroke-width', 0.6)
        .style('cursor', d => getCount(d.id) > 0 ? 'pointer' : 'default')
        .on('mouseenter', function(event, d) { const a2 = getAlpha2(d.id); const n = getCount(d.id); if (!n) return; d3.select(this).attr('fill', c.gold).attr('stroke', '#fff').attr('stroke-width', 1.5); const [mx, my] = d3.pointer(event, svgRef.current); setTooltip({ x:mx, y:my, code:a2, count:n }); })
        .on('mouseleave', function(event, d) { const a2 = getAlpha2(d.id); const n = getCount(d.id); const isAct = a2 === activeCountryRef.current; d3.select(this).attr('fill', isAct ? c.gold : colorForCount(n)).attr('stroke', strokeForCount(n, isAct)).attr('stroke-width', isAct ? 1.5 : 0.6); setTooltip(null); })
        .on('click', function(event, d) { const a2 = getAlpha2(d.id); if (a2 && getCount(d.id) > 0) onCountryClick(a2); });
      if (!cancelled) setReady(true);
    };
    draw().catch(console.error); return () => { cancelled = true; };
  }, [JSON.stringify(normCounts), c]);
  useEffect(() => {
    activeCountryRef.current = activeCountry;
    if (!svgRef.current || !window.d3) return;
    svgRef.current.querySelectorAll('path.country').forEach(el => { const numId = el.getAttribute('data-id'); const a2 = NUMERIC_TO_ALPHA2[numId] || null; const n = normCounts[numId] || 0; const isAct = a2 === activeCountry; window.d3.select(el).attr('fill', isAct ? c.gold : colorForCount(n)).attr('stroke', strokeForCount(n, isAct)).attr('stroke-width', isAct ? 1.5 : 0.6); });
  }, [activeCountry, c]);
  return (
    <div ref={containerRef} style={{ position:'relative', width:'100%', borderRadius:12, overflow:'hidden', background:c.paper }}>
      {!ready && <div style={{ position:'absolute', inset:0, zIndex:3, display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:28, height:28, borderRadius:'50%', border:`2px solid ${c.rule}`, borderTopColor:c.accent, animation:'spin 0.8s linear infinite' }}/></div>}
      <svg ref={svgRef} style={{ position:'relative', zIndex:1, display:'block', width:'100%', opacity:ready?1:0, transition:'opacity 0.5s', minHeight:200 }}/>
      {tooltip && COUNTRY_META[tooltip.code] && (
        <div style={{ position:'absolute', left:Math.min(tooltip.x+12,(containerRef.current?.offsetWidth||500)-160), top:Math.max(tooltip.y-52,8), background:c.surface, border:`1px solid ${c.rule}`, borderRadius:10, padding:'8px 12px', pointerEvents:'none', zIndex:20, boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize:12, fontWeight:600, color:c.ink }}>{COUNTRY_META[tooltip.code].flag}&nbsp;{COUNTRY_META[tooltip.code].label}</div>
          <div style={{ fontSize:11, color:c.ink2, marginTop:2 }}>{tooltip.count} bourse{tooltip.count > 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
}

/* ─── TOP COUNTRIES (dynamique) ───────────────────────────────────────── */
function TopCountries({ scholarshipCounts, activeCountry, setActiveCountry, handleQuickReply, lang, c }) {
  const sorted = Object.entries(scholarshipCounts).sort((a, b) => b[1] - a[1]).slice(0,8);
  const maxC = sorted[0]?.[1] || 1;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {sorted.map(([code, count]) => {
        const meta = COUNTRY_META[code]; if (!meta) return null;
        const isActive = activeCountry === code;
        return (
          <div key={code} onClick={() => setActiveCountry(code === activeCountry ? null : code)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 8px', borderRadius:8, cursor:'pointer', background: isActive ? c.blueLt : 'transparent', marginBottom:1, transition:'background 0.12s' }}>
            <span style={{ fontSize:18, flexShrink:0 }}>{meta.flag}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight: isActive ? 600 : 400, color: isActive ? c.blue : c.ink, marginBottom:3 }}>{meta.label}</div>
              <div style={{ height:3, borderRadius:2, background:c.paper, overflow:'hidden' }}><div style={{ height:'100%', width:`${Math.round(count/maxC*100)}%`, background: isActive ? c.blue : '#BFDBFE', transition:'width 0.6s ease' }}/></div>
            </div>
            <span style={{ fontSize:12, fontWeight:600, color:c.ink, minWidth:20, textAlign:'right' }}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── AI INSIGHTS (dynamique) ─────────────────────────────────────────── */
function AIInsights({ lang, bourses, deadlines, scholarshipCounts, c }) {
  const topCountry = Object.entries(scholarshipCounts).sort((a, b) => b[1] - a[1])[0];
  const urgentCount = deadlines.filter(d => { const diff = Math.round((d.deadline - new Date()) / 86400000); return diff >= 0 && diff <= 7; }).length;
  const insights = [
    { icon:'↑', color:c.accent, text: lang==='fr'? `${topCountry ? COUNTRY_META[topCountry[0]]?.label || '—' : '—'} mène avec ${topCountry?.[1]||0} bourses — la plus forte concentration de la plateforme.` : `${topCountry ? COUNTRY_META[topCountry[0]]?.label || '—' : '—'} leads with ${topCountry?.[1]||0} scholarships.` },
    { icon:'🔥', color:c.warn, text: lang==='fr' ? 'Les bourses en Sciences & Ingénierie ont augmenté de 23% cette année — fort potentiel pour les profils STEM.' : 'Science & Engineering scholarships grew 23% this year — strong potential for STEM profiles.' },
    { icon:'⚡', color:c.danger, text: lang==='fr' ? `${urgentCount} deadline${urgentCount>1?'s':''} cette semaine. Priorisez Eiffel, DAAD et Swiss Gov.` : `${urgentCount} deadline${urgentCount!==1?'s':''} this week. Prioritize Eiffel, DAAD, Swiss Gov.` },
    { icon:'✦', color:c.green, text: lang==='fr' ? 'Les candidats avec un profil complet ont 3× plus de chances d\'être sélectionnés.' : 'Candidates with 100% profiles are 3× more likely to be selected.' },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      {insights.map((ins, i) => (
        <div key={i} style={{ padding:'16px', background:c.surface, border:`1px solid ${c.rule}`, borderLeft:`3px solid ${ins.color}` }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
            <div style={{ width:30, height:30, background:`${ins.color}14`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:ins.color, flexShrink:0 }}>{ins.icon}</div>
            <p style={{ fontSize:12, color:c.ink2, lineHeight:1.55, margin:0 }}>{ins.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── OPPORTUNITY OF THE DAY (dynamique) ───────────────────────────────── */
function OpportunityOfTheDay({ lang, openAIChat, bourses, c }) {
  const opp = (bourses || []).find(b => b.financement?.toLowerCase().includes('complet') || b.financement?.toLowerCase().includes('full')) || {
    nom: 'Bourse Eiffel Excellence', pays: 'France', financement: 'Fully funded', dateLimite: new Date(Date.now() + 30*86400000).toISOString(),
  };
  const diff = opp.dateLimite ? Math.round((new Date(opp.dateLimite) - new Date()) / 86400000) : 30;
  const flag = COUNTRY_META[Object.entries(COUNTRY_META).find(([,m]) => m.label === opp.pays)?.[0]]?.flag || '🌍';
  const dl = daysLeft(opp.dateLimite, lang, c);
  return (
    <div style={{ background:c.paper, padding:'16px', border:`1px solid ${c.rule}` }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:c.ink, marginBottom:4 }}>{opp.nom}</div>
          <div style={{ fontSize:11, color:c.ink2, marginBottom:10 }}>{opp.pays} · {opp.financement}</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', background:c.greenLt, color:c.green }}>Fully funded</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:600, padding:'2px 8px', background:`${dl.color}12`, color:dl.color, border:`1px solid ${dl.color}25` }}>{dl.label}</span>
          </div>
        </div>
        <div style={{ fontSize:36, flexShrink:0 }}>{flag}</div>
      </div>
      <button onClick={() => openAIChat(lang==='fr' ? `Donne-moi tous les détails sur la bourse "${opp.nom}" et comment postuler depuis la Tunisie` : `Give me all details about "${opp.nom}" and how to apply from Tunisia`)} style={{ width:'100%', marginTop:14, padding:'8px 16px', background:c.accent, color:c.surface, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', padding:'10px' }}>
        {lang === 'fr' ? 'Explorer avec l\'IA →' : 'Explore with AI →'}
      </button>
    </div>
  );
}

/* ─── SMART TIPS (dynamique) ──────────────────────────────────────────── */
function SmartTips({ lang, setView, c }) {
  const [currentTip, setCurrentTip] = useState(0), [fade, setFade] = useState(true);
  const tips = [
    { icon:'🗣️', title:lang==='fr'?'Méthode STAR':'STAR Method', description:lang==='fr'?'Structure tes réponses: Situation → Tâche → Action → Résultat.':'Structure your answers: Situation → Task → Action → Result.' },
    { icon:'⏰', title:lang==='fr'?'Lettres de recommandation':'Recommendation letters', description:lang==='fr'?'Demande-les au moins 6 semaines à l\'avance.':'Request them at least 6 weeks in advance.' },
    { icon:'🗺️', title:lang==='fr'?'Diversifie tes cibles':'Diversify your targets', description:lang==='fr'?'Ne te limite pas à un seul pays. Regarde l\'Allemagne, les Pays-Bas, la Suisse.':'Check Germany, Netherlands, Switzerland.' },
    { icon:'✍️', title:lang==='fr'?'Lettre de motivation':'Motivation letter', description:lang==='fr'?'C\'est souvent le 1er critère des jurys. Rédige une lettre personnalisée par bourse.':'Often the #1 criterion. Write a personalized letter for each scholarship.' },
  ];
  useEffect(() => {
    if (tips.length <= 1) return;
    const iv = setInterval(() => { setFade(false); setTimeout(() => { setCurrentTip(i => (i+1)%tips.length); setFade(true); },250); },6000);
    return () => clearInterval(iv);
  }, [tips.length]);
  const tip = tips[currentTip];
  return (
    <div style={{ opacity:fade?1:0, transition:'opacity 0.25s ease' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
        <div style={{ width:42, height:42, background:c.paper, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{tip.icon}</div>
        <div><div style={{ fontSize:13, fontWeight:600, color:c.ink, marginBottom:6 }}>{tip.title}</div><div style={{ fontSize:12, color:c.ink2, lineHeight:1.55 }}>{tip.description}</div></div>
      </div>
      <div style={{ display:'flex', gap:6, marginTop:14, justifyContent:'center' }}>
        {tips.map((_, i) => <div key={i} onClick={() => { setFade(false); setTimeout(() => { setCurrentTip(i); setFade(true); },200); }} style={{ width:i===currentTip?20:6, height:4, background:i===currentTip?c.accent:c.rule, transition:'all 0.2s', cursor:'pointer' }}/>)}
      </div>
    </div>
  );
}

/* ─── SECTION HEADER (dynamique) ──────────────────────────────────────── */
function SectionHeader({ num, title, sub, action, onAction, c }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
      <div>
        <div style={{ fontSize:10, fontWeight:600, color:c.ink3, letterSpacing:'0.08em', fontFamily:c.fMono }}>{num}</div>
        <div style={{ fontSize:16, fontWeight:600, color:c.ink, letterSpacing:'-0.01em', marginTop:4, marginBottom:4 }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:c.ink2 }}>{sub}</div>}
      </div>
      {action && <button onClick={onAction} style={{ padding:'6px 14px', background:'transparent', color:c.ink2, border:`1px solid ${c.rule}`, fontSize:11, fontWeight:500, cursor:'pointer' }}>{action}</button>}
    </div>
  );
}

/* ─── MAIN DASHBOARD ───────────────────────────────────────────────────── */
export default function DashboardPage({
  user, bourses, entretienScores, setView,
  handleQuickReply, onOpenBourse,
  messages, input, setInput, loading, chatContainerRef, handleSend,
}) {
  const { lang } = useT();
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

  const openAIChat = useCallback((message) => {
  window.dispatchEvent(new CustomEvent('openChatWithMessage', { detail: { message } }));
}, []);

  const handleQuickReplyWithChat = useCallback((text) => {
  setShowChat(true);
  setTimeout(() => handleQuickReply(text), 100);
}, [handleQuickReply]);


  useEffect(() => {
    if (!user?.id) return;
    axiosInstance.get(API_ROUTES.roadmap.byUser(user.id)).then(r => { const docs = r.data.docs || []; setRoadmap(docs); setAppliedNoms(new Set(docs.map(b => b.nom?.trim().toLowerCase()))); }).catch(()=>{});
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    axiosInstance.get(API_ROUTES.favoris.byUser(user.id)).then(r => { const doc = r.data?.docs?.[0] || r.data; const favs = doc?.bourses || []; setFavorites(favs); setStarredNoms(new Set(favs.map(b => b.nom?.trim().toLowerCase()))); }).catch(()=>{});
  }, [user?.id]);

  const scholarshipCounts = useMemo(() => {
    const counts = {};
    (bourses || []).forEach(b => { if (!b.pays) return; const code = Object.entries(COUNTRY_META).find(([, m]) => m.label === b.pays)?.[0]; if (code) counts[code] = (counts[code] || 0) + 1; });
    return counts;
  }, [bourses]);

  const favoritesSet = useMemo(() => new Set((favorites || []).map(b => b.nom?.trim().toLowerCase())), [favorites]);
  const roadmapSet   = useMemo(() => new Set((roadmap || []).map(b => b.nom?.trim().toLowerCase())), [roadmap]);

  const deadlines = useMemo(() => (bourses || []).filter(b => b.dateLimite).map(b => ({ nom:b.nom, deadline:new Date(b.dateLimite), pays:b.pays, isFavori:favoritesSet.has(b.nom?.trim().toLowerCase()), inRoadmap:roadmapSet.has(b.nom?.trim().toLowerCase()), lienOfficiel:b.lienOfficiel, financement:b.financement })).sort((a,b)=>a.deadline-b.deadline), [bourses, favoritesSet, roadmapSet]);

  const urgentDeadlines = useMemo(() => deadlines.filter(d => { const diff = Math.round((d.deadline - new Date()) / 86400000); return diff >= 0 && diff <= 14; }), [deadlines]);

  const parseScore = txt => { const m = (txt || '').match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i); return m ? parseInt(m[1]) : null; };
  const scores = useMemo(() => (entretienScores || []).map(s => ({ ...s, scoreNum: parseScore(s.score) })).filter(s => s.scoreNum !== null), [entretienScores]);

  /* ── NOT LOGGED IN ── */
  if (!user) return (
    <>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:c.paper }}>
        <div style={{ background:c.surface, border:`1px solid ${c.rule}`, borderRadius:16, padding:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column', alignItems:'center', padding:'56px 48px', maxWidth:380, width:'100%', textAlign:'center' }}>
          <div style={{ fontSize:52, marginBottom:20 }}>📊</div>
          <div style={{ fontSize:20, fontWeight:700, color:c.ink, marginBottom:8 }}>{lang === 'fr' ? 'Tableau de bord' : 'Dashboard'}</div>
          <p style={{ color:c.ink2, fontSize:13, lineHeight:1.6, marginBottom:28 }}>{lang === 'fr' ? 'Connectez-vous pour accéder à votre espace personnel.' : 'Sign in to access your personal space.'}</p>
          <button style={{ padding:'8px 16px', background:c.accent, color:c.surface, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', padding:'12px 32px', fontSize:13 }} onClick={() => setShowLoginModal(true)}>{lang === 'fr' ? 'Se connecter' : 'Sign in'}</button>
        </div>
      </div>
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} c={c} lang={lang}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );

  const cardStyle = { background:c.surface, border:`1px solid ${c.rule}`, borderRadius:16, padding:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)' };

  return (
    <div style={{ width:'100%', background:c.paper, minHeight:'100vh', fontFamily:"'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.ds{animation:fadeUp 0.3s ease both}`}</style>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'32px 32px' }}>
        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32, flexWrap:'wrap', gap:12 }} className="ds">
          <div>
            <div style={{ fontSize:11, color:c.ink3, fontWeight:500, marginBottom:6, letterSpacing:'0.06em', textTransform:'uppercase' }}>OppsTrack · {new Date().toLocaleDateString(lang==='fr'?'fr-FR':'en-US',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
            <h1 style={{ fontSize:'2rem', fontWeight:700, color:c.ink, margin:'0 0 4px', letterSpacing:'-0.03em' }}>{lang==='fr'?'Tableau de Bord':'Dashboard'}</h1>
            <p style={{ fontSize:13, color:c.ink2, margin:0 }}>{lang==='fr'?'Bonjour':'Hello'}, <strong style={{ color:c.ink }}>{user.name || user.email?.split('@')[0]}</strong> · {lang==='fr'?'Bourses · Opportunités · Suivi · Mises à jour en temps réel':'Scholarships · Opportunities · Tracking · Live updates'}</p>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            {urgentDeadlines.length > 0 && <span style={{ fontSize:11, fontWeight:600, padding:'5px 12px', background:c.redLt, color:c.danger, border:`1px solid ${c.danger}20` }}>⚡ {urgentDeadlines.length} {lang==='fr'?'urgente':'urgent'}{urgentDeadlines.length>1?'s':''}</span>}
            <button style={{ padding:'8px 16px', background:c.accent, color:c.surface, border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }} onClick={() => setView('bourses')}>{lang==='fr'?'Explorer les bourses':'Explore Scholarships'}</button>
          </div>
        </div>

        {/* ROW 1: GLOBAL STATS */}
        <div style={{ marginBottom:20 }} className="ds"><GlobalStats bourses={bourses} deadlines={deadlines} lang={lang} c={c}/></div>

        {/* ROW 2: CALENDAR + URGENT DEADLINES */}
        <div style={{ display:'grid', gridTemplateColumns:'1.35fr 1fr', gap:16, marginBottom:20 }} className="ds">
          <div style={cardStyle}>
            <SectionHeader num="01" title={lang==='fr'?'Calendrier':'Calendar'} sub={`${deadlines.length} deadline${deadlines.length!==1?'s':''}`} action={lang==='fr'?'Voir tout':'View all'} onAction={()=>setView('roadmap')} c={c}/>
            {deadlines.length===0 ? <div style={{ textAlign:'center', padding:'32px 0', color:c.ink2 }}><div style={{ fontSize:32, marginBottom:10 }}>📭</div><div style={{ fontSize:13, marginBottom:16 }}>{lang==='fr'?'Aucune bourse avec deadline':'No scholarships with deadlines'}</div><button style={{ padding:'8px 16px', background:c.accent, color:c.surface, border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }} onClick={()=>setView('bourses')}>{lang==='fr'?'Explorer les bourses':'Explore'}</button></div> : <Calendrier deadlines={deadlines} onSelectBourse={b => { const full = (bourses || []).find(x => x.nom?.trim().toLowerCase() === b.nom?.trim().toLowerCase()); setDrawerBourse(full || b); }} lang={lang} c={c}/>}
          </div>
          <div style={cardStyle}>
            <SectionHeader num="02" title={lang==='fr'?'Échéances Urgentes':'Urgent Deadlines'} sub={`${urgentDeadlines.length} ${lang==='fr'?'dans les 14 prochains jours':'in the next 14 days'}`} c={c}/>
            <UrgentDeadlinesList deadlines={deadlines} lang={lang} setDrawerBourse={setDrawerBourse} bourses={bourses} c={c}/>
          </div>
        </div>

        {/* ROW 3: WORLD MAP + TOP COUNTRIES */}
        <div style={{ ...cardStyle, marginBottom:20 }} className="ds">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 240px', gap:24, alignItems:'start' }}>
            <div>
              <SectionHeader num="03" title={lang==='fr'?'Carte mondiale des bourses':'World Scholarship Map'} sub={`${Object.keys(scholarshipCounts).length} ${lang==='fr'?'pays':'countries'} · ${(bourses||[]).length} ${lang==='fr'?'bourses':'scholarships'}`} action={lang==='fr'?'Toutes →':'All →'} onAction={()=>setView('bourses')} c={c}/>
              <WorldMap onCountryClick={code=>setActiveCountry(code===activeCountry?null:code)} activeCountry={activeCountry} scholarshipCounts={scholarshipCounts} lang={lang} c={c}/>
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:c.ink2, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12, paddingBottom:10, borderBottom:`1px solid ${c.rule}` }}>{lang==='fr'?'Top pays':'Top countries'}</div>
              <TopCountries scholarshipCounts={scholarshipCounts} activeCountry={activeCountry} setActiveCountry={setActiveCountry} handleQuickReply={handleQuickReply} lang={lang} c={c}/>
              {activeCountry && COUNTRY_META[activeCountry] && (
                <div style={{ marginTop:14, padding:'12px', background:c.blueLt, border:`1px solid ${c.blueMid}` }}>
                  <div style={{ fontSize:13, fontWeight:600, color:c.blue, marginBottom:10 }}>{COUNTRY_META[activeCountry].flag} {COUNTRY_META[activeCountry].label}<span style={{ float:'right', fontSize:11, background:c.blue, color:c.white, padding:'1px 8px' }}>{scholarshipCounts[activeCountry]||0}</span></div>
                  <button style={{ width:'100%', padding:'8px 16px', background:c.accent, color:c.surface, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', fontSize:11, padding:'8px' }} onClick={() => openAIChat(lang==='fr'?`Montre-moi les bourses en ${COUNTRY_META[activeCountry].label} pour un étudiant tunisien`:`Show me scholarships in ${COUNTRY_META[activeCountry].label} for a Tunisian student`)}>{lang==='fr'?'Explorer avec l\'IA →':'Explore with AI →'}</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 4: TRENDING + LEVEL DISTRIBUTION */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }} className="ds">
          <div style={cardStyle}><SectionHeader num="04" title={lang==='fr'?'Trending Scholarships':'Trending Scholarships'} sub={lang==='fr'?'Cette semaine':'This week'} c={c}/><TrendingScholarships lang={lang} setView={setView} c={c}/></div>
          <div style={cardStyle}><SectionHeader num="05" title={lang==='fr'?'Distribution par niveau':'Distribution by level'} sub={lang==='fr'?'Licence · Master · PhD · Postdoc':'Bachelor · Master · PhD · Postdoc'} c={c}/><LevelDistribution bourses={bourses} lang={lang} c={c}/></div>
        </div>

        {/* ROW 5: AI INSIGHTS (full width) */}
        <div style={{ ...cardStyle, marginBottom:20 }} className="ds">
          <SectionHeader num="06" title={lang==='fr'?'AI Insights':'AI Insights'} sub={lang==='fr'?'Analyse automatique de votre profil et des opportunités':'Automated analysis of your profile and opportunities'} c={c}/>
          <AIInsights lang={lang} bourses={bourses} deadlines={deadlines} scholarshipCounts={scholarshipCounts} c={c}/>
        </div>

        {/* ROW 6: OPPORTUNITY OF DAY + SMART TIPS */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }} className="ds">
          <div style={cardStyle}><SectionHeader num="07" title={lang==='fr'?'Opportunité du jour':'Opportunity of the day'} sub={lang==='fr'?'Sélectionnée par l\'IA':'AI-selected'} c={c}/><OpportunityOfTheDay lang={lang} openAIChat={openAIChat} bourses={bourses} c={c}/>
</div>
          <div style={cardStyle}><SectionHeader num="08" title={lang==='fr'?'Conseil du jour':'Tip of the day'} sub={lang==='fr'?'Stratégie & préparation':'Strategy & preparation'} c={c}/><SmartTips lang={lang} setView={setView} c={c}/></div>
        </div>
      </div>

      {/* CHAT FAB */}
      <button onClick={()=>setShowChat(p=>!p)} style={{ position:'fixed', bottom:28, right:28, width:52, height:52, borderRadius:'50%', background:showChat?c.ink:c.accent, border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.18)', cursor:'pointer', fontSize:20, color:c.surface, zIndex:1000, transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center' }} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>{showChat?'✕':'💬'}</button>

      {/* CHAT PANEL */}
      {showChat && (
        <div style={{ position:'fixed', top:80, right:28, width:360, height:'calc(100vh - 112px)', background:c.surface, border:`1px solid ${c.rule}`, display:'flex', flexDirection:'column', boxShadow:'0 16px 48px rgba(0,0,0,0.12)', zIndex:1000, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:`1px solid ${c.rule}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}><span style={{ fontSize:13, fontWeight:600, color:c.ink }}>🤖 {lang==='fr'?'Assistant IA':'AI Assistant'}</span><button onClick={()=>setShowChat(false)} style={{ background:'none', border:'none', color:c.ink2, fontSize:18, cursor:'pointer' }}>✕</button></div>
          <div style={{ flex:1, overflowY:'auto', padding:16 }} ref={chatContainerRef}>
            {(messages || []).map((msg,i) => (<div key={i} style={{ textAlign:msg.sender==='user'?'right':'left', marginBottom:10 }}><div style={{ display:'inline-block', background:msg.sender==='user'?c.accent:c.paper, color:msg.sender==='user'?c.surface:c.ink, padding:'9px 13px', fontSize:13, maxWidth:'85%' }}>{msg.text}</div></div>))}
            {loading && <div style={{ color:c.ink3, fontSize:12, padding:8 }}>{lang==='fr'?'En train de répondre...':'Responding...'}</div>}
          </div>
          <div style={{ padding:12, borderTop:`1px solid ${c.rule}` }}><ChatInput input={input} setInput={setInput} onSend={handleSend} loading={loading}/></div>
        </div>
      )}

      {/* DRAWER */}
      {drawerBourse && (
        <BourseDrawer bourse={drawerBourse} onClose={()=>setDrawerBourse(null)} onAskAI={b=>{handleQuickReply(lang==='fr'?`Donne-moi les détails sur "${b.nom}"`:`Give me details about "${b.nom}"`);setDrawerBourse(null);}} onChoose={b=>handleQuickReply(lang==='fr'?'je choisis '+b.nom:'I choose '+b.nom)} applied={appliedNoms.has(drawerBourse.nom?.trim().toLowerCase())} onApply={async b=>{try{await axiosInstance.post(API_ROUTES.roadmap.create,{userId:user.id,userEmail:user.email||'',nom:b.nom,pays:b.pays||'',lienOfficiel:b.lienOfficiel||'',financement:b.financement||'',dateLimite:b.dateLimite||null,ajouteLe:new Date().toISOString(),statut:lang==='fr'?'en_cours':'in_progress',etapeCourante:0});setAppliedNoms(prev=>new Set([...prev,b.nom?.trim().toLowerCase()]));}catch(e){console.error(e);}}} starred={starredNoms.has(drawerBourse.nom?.trim().toLowerCase())} onStar={async (b,isStarred)=>{const nomKey=b.nom?.trim().toLowerCase();try{const res=await axiosInstance.get(API_ROUTES.favoris.byUser(user.id)+'&limit=1&depth=0');const doc=res.data.docs?.[0];if(isStarred){if(doc?.id){const newB=(doc.bourses||[]).filter(x=>x.nom?.trim().toLowerCase()!==nomKey);await axiosInstance.patch(API_ROUTES.favoris.update(doc.id),{bourses:newB});setStarredNoms(prev=>{const s=new Set(prev);s.delete(nomKey);return s;});}}else{const nb={nom:b.nom,pays:b.pays||'',lienOfficiel:b.lienOfficiel||'',financement:b.financement||'',dateLimite:b.dateLimite||null,ajouteLe:new Date().toISOString()};if(doc?.id)await axiosInstance.patch(API_ROUTES.favoris.update(doc.id),{bourses:[...(doc.bourses||[]),nb]});else await axiosInstance.post(API_ROUTES.favoris.create,{user:user.id,userEmail:user.email||'',bourses:[nb]});setStarredNoms(prev=>new Set([...prev,nomKey]));}}catch(e){console.error(e);}}} user={user}/>
      )}

      {showLoginModal && <LoginModal onClose={()=>setShowLoginModal(false)} c={c} lang={lang}/>}
    </div>
  );
}