import React, { useState, useEffect } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';

const COUNTRIES = {
  FR: { path: 'M487 197 L495 193 L503 196 L506 205 L498 213 L487 210 Z', label: 'France',           flag: '🇫🇷', cx: 495, cy: 203 },
  DE: { path: 'M500 188 L512 184 L520 189 L518 200 L506 203 L498 197 Z', label: 'Allemagne',        flag: '🇩🇪', cx: 509, cy: 194 },
  GB: { path: 'M472 182 L480 178 L484 187 L477 194 L469 190 Z',          label: 'Royaume-Uni',      flag: '🇬🇧', cx: 476, cy: 186 },
  CH: { path: 'M495 207 L503 204 L506 210 L500 215 L493 212 Z',          label: 'Suisse',           flag: '🇨🇭', cx: 499, cy: 209 },
  BE: { path: 'M486 192 L492 189 L495 194 L490 198 L484 196 Z',          label: 'Belgique',         flag: '🇧🇪', cx: 489, cy: 194 },
  NL: { path: 'M486 186 L492 183 L495 188 L490 192 L484 190 Z',          label: 'Pays-Bas',         flag: '🇳🇱', cx: 489, cy: 187 },
  US: { path: 'M148 195 L245 190 L250 222 L238 235 L162 233 L146 220 Z', label: 'États-Unis',       flag: '🇺🇸', cx: 198, cy: 212 },
  CA: { path: 'M155 158 L242 152 L248 182 L232 193 L168 190 Z',          label: 'Canada',           flag: '🇨🇦', cx: 200, cy: 172 },
  JP: { path: 'M762 198 L772 194 L776 206 L768 213 L758 208 Z',          label: 'Japon',            flag: '🇯🇵', cx: 767, cy: 204 },
  CN: { path: 'M678 195 L718 188 L726 214 L712 226 L676 220 Z',          label: 'Chine',            flag: '🇨🇳', cx: 700, cy: 207 },
  KR: { path: 'M738 198 L746 195 L750 204 L743 210 L736 206 Z',          label: 'Corée du Sud',     flag: '🇰🇷', cx: 743, cy: 202 },
  AU: { path: 'M718 288 L758 282 L766 318 L746 334 L714 326 Z',          label: 'Australie',        flag: '🇦🇺', cx: 740, cy: 308 },
  TR: { path: 'M538 210 L560 206 L566 216 L556 222 L535 218 Z',          label: 'Turquie',          flag: '🇹🇷', cx: 550, cy: 214 },
  SA: { path: 'M568 234 L592 228 L598 250 L584 260 L565 254 Z',          label: 'Arabie Saoudite',  flag: '🇸🇦', cx: 581, cy: 244 },
  MA: { path: 'M478 234 L490 230 L496 242 L486 250 L474 246 Z',          label: 'Maroc',            flag: '🇲🇦', cx: 485, cy: 240 },
  HU: { path: 'M516 196 L524 193 L527 200 L521 205 L514 202 Z',          label: 'Hongrie',          flag: '🇭🇺', cx: 520, cy: 199 },
  NZ: { path: 'M790 328 L798 322 L802 334 L795 340 L787 336 Z',          label: 'Nouvelle-Zélande', flag: '🇳🇿', cx: 794, cy: 331 },
};

function WorldMap({ onCountryClick, activeCountry, scholarshipCounts }) {
  const [hovered, setHovered] = useState(null);

  const getColor = (code) => {
    const count = scholarshipCounts[code] || 0;
    if (count >= 10) return '#1a3a6b';
    if (count >= 7)  return '#f5a623';
    if (count >= 4)  return '#2563eb';
    return '#94a3b8';
  };

  return (
    <div style={{ position:'relative' }}>
      <svg viewBox="80 130 800 250" width="100%"
        style={{ borderRadius:8, background:'linear-gradient(160deg,#0a1628 0%,#0f2654 60%,#0a1e3d 100%)', display:'block', border:'1px solid rgba(245,166,35,0.2)' }}>

        {/* Grid */}
        {[150,170,190,210,230,250,270,290,310,330,350].map(y => (
          <line key={`h${y}`} x1="80" y1={y} x2="880" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5}/>
        ))}
        {[120,160,200,240,280,320,360,400,440,480,520,560,600,640,680,720,760,800,840].map(x => (
          <line key={`v${x}`} x1={x} y1="130" x2={x} y2="380" stroke="rgba(255,255,255,0.04)" strokeWidth={0.5}/>
        ))}

        {/* Continents */}
        <path d="M455 162 L542 155 L562 172 L548 228 L512 236 L480 228 L458 215 L450 195 Z"
          fill="rgba(255,255,255,0.06)" stroke="rgba(245,166,35,0.2)" strokeWidth={0.8}/>
        <path d="M466 233 L522 226 L550 248 L552 318 L522 353 L494 350 L468 328 L460 278 Z"
          fill="rgba(255,255,255,0.06)" stroke="rgba(245,166,35,0.2)" strokeWidth={0.8}/>
        <path d="M538 152 L782 145 L802 198 L792 238 L762 258 L722 253 L682 243 L642 238 L592 233 L557 222 Z"
          fill="rgba(255,255,255,0.06)" stroke="rgba(245,166,35,0.2)" strokeWidth={0.8}/>
        <path d="M118 142 L268 138 L273 193 L263 248 L243 308 L208 358 L183 356 L173 308 L153 258 L138 208 L113 183 Z"
          fill="rgba(255,255,255,0.06)" stroke="rgba(245,166,35,0.2)" strokeWidth={0.8}/>
        <path d="M698 273 L778 266 L788 328 L768 348 L718 346 L694 326 Z"
          fill="rgba(255,255,255,0.06)" stroke="rgba(245,166,35,0.2)" strokeWidth={0.8}/>
        <path d="M785 318 L803 310 L808 336 L797 344 L782 340 Z"
          fill="rgba(255,255,255,0.06)" stroke="rgba(245,166,35,0.2)" strokeWidth={0.8}/>

        {/* Countries */}
        {Object.entries(COUNTRIES).map(([code, c]) => {
          const count = scholarshipCounts[code] || 0;
          if (!count) return null;
          const color    = getColor(code);
          const isActive  = activeCountry === code;
          const isHovered = hovered === code;
          return (
            <g key={code} style={{ cursor:'pointer' }}
              onMouseEnter={() => setHovered(code)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onCountryClick(code)}>
              <path d={c.path}
                fill={isActive ? color : isHovered ? color + 'cc' : color + '55'}
                stroke={isActive ? '#f5a623' : color}
                strokeWidth={isActive || isHovered ? 2 : 1}
                style={{ transition:'all 0.2s' }}/>
              {isActive && (
                <circle cx={c.cx} cy={c.cy} r={12} fill="none" stroke="#f5a623" strokeWidth={1.5} opacity={0.5}>
                  <animate attributeName="r" from="8" to="18" dur="1.5s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/>
                </circle>
              )}
              <circle cx={c.cx} cy={c.cy} r={isActive ? 7 : isHovered ? 6 : 5}
                fill={isActive ? '#f5a623' : color} stroke="rgba(0,0,0,0.4)" strokeWidth={1.5}
                style={{ transition:'all 0.2s' }}/>
              {(isActive || isHovered) && (
                <g>
                  <rect x={c.cx-14} y={c.cy-22} width={28} height={13} rx={3}
                    fill="#1a3a6b" stroke="#f5a623" strokeWidth={0.8}/>
                  <text x={c.cx} y={c.cy-12} textAnchor="middle" fontSize={8} fontWeight={700} fill="#f5a623">
                    {count} bourse{count > 1 ? 's' : ''}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Tunisia marker */}
        <circle cx={500} cy={232} r={4} fill="#f43f5e" stroke="#fff" strokeWidth={1.5}/>
        <circle cx={500} cy={232} r={4} fill="none" stroke="#f43f5e" strokeWidth={1}>
          <animate attributeName="r" from="4" to="14" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite"/>
        </circle>
        <text x={500} y={227} textAnchor="middle" fontSize={7} fill="#f5a623" fontWeight={700}>Tunisie</text>

        {/* Legend */}
        <text x={90} y={147} fontSize={8} fill="rgba(245,166,35,0.5)" fontWeight={500}>OPPSTRACK · Bourses disponibles par pays</text>
        <g>
          {[['#1a3a6b','10+'],['#f5a623','7-9'],['#2563eb','4-6'],['#94a3b8','1-3']].map(([c,l],i) => (
            <g key={i} transform={`translate(${90 + i * 65}, 368)`}>
              <circle cx={0} cy={0} r={4} fill={c}/>
              <text x={8} y={4} fontSize={8} fill="rgba(255,255,255,0.5)">{l}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function Calendrier({ deadlines, onSelectBourse }) {
  const today = new Date();
  const [view, setView] = useState({ month: today.getMonth(), year: today.getFullYear() });
  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const DAYS   = ['Lu','Ma','Me','Je','Ve','Sa','Di'];

  const deadlineMap = {};
  deadlines.forEach(b => {
    if (!b.deadline) return;
    const d = new Date(b.deadline);
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!deadlineMap[k]) deadlineMap[k] = [];
    deadlineMap[k].push(b);
  });

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstDay    = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const getColor    = (diff) => diff < 0 ? '#dc2626' : diff <= 7 ? '#d97706' : diff <= 30 ? '#2563eb' : '#166534';

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prev = () => setView(v => ({ month: v.month === 0 ? 11 : v.month - 1, year: v.month === 0 ? v.year - 1 : v.year }));
  const next = () => setView(v => ({ month: v.month === 11 ? 0 : v.month + 1, year: v.month === 11 ? v.year + 1 : v.year }));

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <button onClick={prev} style={S.navBtn}>‹</button>
        <span style={{ fontSize:13, fontWeight:600, color:'#1a3a6b' }}>{MONTHS[view.month]} {view.year}</span>
        <button onClick={next} style={S.navBtn}>›</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign:'center', fontSize:9, color:'#94a3b8', fontWeight:600, padding:'2px 0' }}>{d}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`}/>;
          const isToday = day === today.getDate() && view.month === today.getMonth() && view.year === today.getFullYear();
          const k = `${view.year}-${view.month}-${day}`;
          const dl = deadlineMap[k];
          const diff = dl ? Math.round((new Date(view.year, view.month, day) - today) / 86400000) : null;
          const color = diff !== null ? getColor(diff) : null;
          return (
            <div key={k} style={{
              aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              borderRadius:4, fontSize:10, position:'relative', transition:'all 0.15s',
              background: isToday ? '#1a3a6b' : dl ? color + '12' : 'transparent',
              border: isToday ? '1.5px solid #f5a623' : dl ? `1px solid ${color}40` : '1px solid #f1f5f9',
              color: isToday ? '#fff' : dl ? color : '#94a3b8',
              cursor: dl ? 'pointer' : 'default',
              fontWeight: isToday ? 700 : 400,
            }} onClick={() => { if (dl && dl.length && onSelectBourse) onSelectBourse(dl[0]); }}>
              {day}
              {dl && (
                <div style={{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)', display:'flex', gap:1 }}>
                  {dl.slice(0,3).map((_,idx) => (
                    <div key={idx} style={{ width:3, height:3, borderRadius:'50%', background:color }}/>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', gap:12, marginTop:10, flexWrap:'wrap' }}>
        {[['#dc2626','Expiré'],['#d97706','≤7j'],['#2563eb','≤30j'],['#166534','Planifiée']].map(([c,l]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:c }}/>
            <span style={{ fontSize:10, color:'#64748b' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage({ user, bourses, entretienScores, setView, handleQuickReply, onOpenBourse }) {
  const [roadmap,       setRoadmap]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeCountry, setActiveCountry] = useState(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    axiosInstance.get(API_ROUTES.roadmap.byUser(user.id))
      .then(r => setRoadmap(r.data.docs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const scholarshipCounts = {};
  (bourses || []).forEach(b => {
    const code = Object.entries(COUNTRIES).find(([, c]) => c.label === b.pays)?.[0];
    if (code) scholarshipCounts[code] = (scholarshipCounts[code] || 0) + 1;
  });

  const deadlines = roadmap
    .filter(b => b.dateLimite)
    .map(b => ({ nom: b.nom, deadline: new Date(b.dateLimite), pays: b.pays }))
    .sort((a, b) => a.deadline - b.deadline);

  const daysLeft = d => {
    const diff = Math.round((d - new Date()) / 86400000);
    if (diff < 0)   return { label:'Expiré',      color:'#dc2626' };
    if (diff === 0) return { label:"Aujourd'hui", color:'#dc2626' };
    if (diff <= 7)  return { label:`${diff}j`,    color:'#d97706' };
    if (diff <= 30) return { label:`${diff}j`,    color:'#2563eb' };
    return               { label:`${diff}j`,      color:'#166534' };
  };

  const parseScore = txt => { const m = (txt||'').match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i); return m ? parseInt(m[1]) : null; };
  const scores     = (entretienScores||[]).map(s => ({ ...s, scoreNum: parseScore(s.score) })).filter(s => s.scoreNum !== null);
  const lastScore  = scores[0]?.scoreNum ?? null;
  const avgScore   = scores.length > 0 ? Math.round(scores.reduce((a,b) => a + b.scoreNum, 0) / scores.length) : null;
  const scoreDiff  = scores.length >= 2 ? scores[0].scoreNum - scores[1].scoreNum : null;
  const completion = !user ? 0 : Math.round(['name','email','pays','niveau','domaine'].filter(f => user[f]).length / 5 * 100);
  const urgentDeadlines = deadlines.filter(d => { const diff = Math.round((d.deadline - new Date()) / 86400000); return diff >= 0 && diff <= 14; });
  const activeCountryBourses = activeCountry ? (bourses||[]).filter(b => b.pays === COUNTRIES[activeCountry]?.label).slice(0, 5) : [];

  if (!user) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:16, textAlign:'center', padding:40 }}>
      <div style={{ fontSize:48 }}>🔒</div>
      <h3 style={{ fontSize:'1.1rem', color:'#1a3a6b', fontWeight:700 }}>Dashboard personnel</h3>
      <p style={{ fontSize:13, color:'#64748b' }}>Connectez-vous pour accéder à votre tableau de bord</p>
      <button onClick={() => handleQuickReply('Je veux me connecter')} style={S.btnPrimary}>Se connecter</button>
    </div>
  );

  return (
    <div style={{ width:'100%', background:'#f8f9fc', minHeight:'100vh', fontFamily:"'Segoe UI',system-ui,sans-serif" }}>

      {/* ── EN-TÊTE ── */}


      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 32px' }}>

        {/* ── URGENT BANNER ── */}
        {urgentDeadlines.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 18px', borderRadius:8, background:'#fff3cd', border:'1px solid #fde68a', borderLeft:'4px solid #f5a623', marginBottom:20 }}>
            <span style={{ fontSize:18 }}>⚡</span>
            <span style={{ fontSize:13, color:'#856404', flex:1, fontWeight:500 }}>
              <strong>{urgentDeadlines.length} deadline{urgentDeadlines.length > 1 ? 's urgentes' : ' urgente'} :</strong>{' '}
              {urgentDeadlines.map(d => `${d.nom} (${Math.round((d.deadline - new Date()) / 86400000)}j)`).join(' · ')}
            </span>
            <button onClick={() => setView('roadmap')} style={{ padding:'5px 12px', borderRadius:4, background:'#1a3a6b', border:'none', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 }}>
              Voir
            </button>
          </div>
        )}

        {/* ── KPIs ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          {[
            { label:'Bourses disponibles', val:(bourses||[]).length,                                                                                                                                           icon:'🎓', color:'#1a3a6b', bg:'#eff6ff' },
            { label:'Dans ma roadmap',     val:roadmap.length,                                                                                                                                                 icon:'📋', color:'#166534', bg:'#f0fdf4' },
            { label:'Deadlines ce mois',   val:deadlines.filter(d=>Math.round((d.deadline-new Date())/86400000)<=30&&Math.round((d.deadline-new Date())/86400000)>=0).length,                                  icon:'⏰', color:'#d97706', bg:'#fffbeb' },
            { label:'Profil complété',     val:`${completion}%`,                                                                                                                                               icon:'⭐', color:'#7c3aed', bg:'#f5f3ff' },
          ].map((k, i) => (
            <div key={i} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'16px 18px', borderTop:`3px solid ${k.color}`, boxShadow:'0 2px 6px rgba(26,58,107,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:11, color:'#64748b', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:600 }}>{k.label}</div>
                  <div style={{ fontSize:26, fontWeight:800, color:k.color }}>{k.val}</div>
                </div>
                <div style={{ width:40, height:40, borderRadius:8, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{k.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── CARTE MONDIALE ── */}
        <div style={S.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <div style={S.cardTitle}>🌍 Carte mondiale des bourses</div>
              <div style={S.cardSub}>{Object.keys(scholarshipCounts).length} pays · {(bourses||[]).length} bourses · Cliquez sur un pays</div>
            </div>
            <button style={S.btnXs} onClick={() => setView('bourses')}>Toutes les bourses →</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 240px', gap:16, alignItems:'start' }}>
            <WorldMap
              onCountryClick={code => setActiveCountry(code === activeCountry ? null : code)}
              activeCountry={activeCountry}
              scholarshipCounts={scholarshipCounts}
            />

            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#1a3a6b', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4, borderBottom:'2px solid #f5a623', paddingBottom:4 }}>
                Top pays
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:3, maxHeight:200, overflowY:'auto' }}>
                {Object.entries(scholarshipCounts).sort((a,b) => b[1]-a[1]).slice(0,12).map(([code, count]) => {
                  const c = COUNTRIES[code];
                  if (!c) return null;
                  const isActive = activeCountry === code;
                  const color = count >= 10 ? '#1a3a6b' : count >= 7 ? '#f5a623' : count >= 4 ? '#2563eb' : '#94a3b8';
                  return (
                    <div key={code} onClick={() => setActiveCountry(code === activeCountry ? null : code)}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', borderRadius:6, cursor:'pointer', transition:'all 0.15s',
                        background: isActive ? '#eff6ff' : 'transparent',
                        border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                      }}>
                      <span style={{ fontSize:13 }}>{c.flag}</span>
                      <span style={{ flex:1, fontSize:11, color: isActive ? '#1a3a6b' : '#64748b', fontWeight: isActive ? 700 : 400 }}>{c.label}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <div style={{ width:Math.round(count/Math.max(...Object.values(scholarshipCounts))*40), height:4, borderRadius:2, background:color }}/>
                        <span style={{ fontSize:10, fontWeight:700, color }}>{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeCountry && COUNTRIES[activeCountry] && (
                <div style={{ marginTop:8, padding:'12px', borderRadius:8, background:'#eff6ff', border:'1px solid #bfdbfe' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#1a3a6b', marginBottom:8 }}>
                    {COUNTRIES[activeCountry].flag} {COUNTRIES[activeCountry].label}
                    <span style={{ fontSize:10, color:'#f5a623', marginLeft:6, background:'#1a3a6b', padding:'1px 6px', borderRadius:3 }}>
                      {scholarshipCounts[activeCountry] || 0} bourses
                    </span>
                  </div>
                  {activeCountryBourses.length > 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {activeCountryBourses.map((b, i) => (
                        <div key={i} style={{ fontSize:11, color:'#475569', padding:'4px 0', borderBottom: i < activeCountryBourses.length-1 ? '1px solid #e2e8f0' : 'none' }}>
                          {b.nom}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize:11, color:'#94a3b8' }}>Aucune bourse pour ce pays</div>
                  )}
                  <button style={{ ...S.btnGold, width:'100%', marginTop:10, fontSize:11, padding:'7px' }}
                    onClick={() => handleQuickReply(`Montre-moi les bourses disponibles en ${COUNTRIES[activeCountry].label}`)}>
                    Explorer avec l'IA
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── GRILLE PRINCIPALE ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

          {/* LEFT */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Calendrier */}
            <div style={S.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div>
                  <div style={S.cardTitle}>📅 Calendrier des deadlines</div>
                  <div style={S.cardSub}>{deadlines.length} bourse{deadlines.length > 1 ? 's' : ''} dans ta roadmap</div>
                </div>
                <button style={S.btnXs} onClick={() => setView('roadmap')}>Roadmap →</button>
              </div>
              {deadlines.length === 0 ? (
                <div style={{ textAlign:'center', padding:'20px 0', color:'#64748b', fontSize:13 }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>📭</div>
                  Ajoute des bourses à ta roadmap pour voir leurs deadlines ici
                  <div style={{ marginTop:14 }}>
                    <button style={S.btnPrimary} onClick={() => setView('bourses')}>Parcourir les bourses</button>
                  </div>
                </div>
              ) : <Calendrier deadlines={deadlines} onSelectBourse={(b) => { if (onOpenBourse) onOpenBourse(b.nom); else { setView('bourses'); } }} />}
            </div>

            {/* Alertes deadlines */}
            <div style={S.card}>
              <div style={S.cardTitle}>🔔 Prochaines échéances</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:12 }}>
                {deadlines.length === 0 ? (
                  <div style={{ color:'#64748b', fontSize:13 }}>Aucune bourse dans ta roadmap.</div>
                ) : deadlines.slice(0,5).map((d, i) => {
                  const dl = daysLeft(d.deadline);
                  const diff = Math.round((d.deadline - new Date()) / 86400000);
                  const bg = diff < 0 ? '#fef2f2' : diff <= 7 ? '#fffbeb' : diff <= 14 ? '#eff6ff' : '#f8fafc';
                  const bl = diff < 0 ? '#dc2626' : diff <= 7 ? '#d97706' : diff <= 14 ? '#2563eb' : '#e2e8f0';
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:6, background:bg, borderLeft:`3px solid ${bl}` }}>
                      <div>
                        <div style={{ fontSize:12, color:'#1a3a6b', fontWeight:600 }}>{d.nom}</div>
                        <div style={{ fontSize:10, color:'#64748b' }}>{d.pays} · {d.deadline.toLocaleDateString('fr-FR')}</div>
                      </div>
                      <span style={{ fontSize:11, color:dl.color, fontWeight:700, padding:'2px 8px', borderRadius:4, background:dl.color+'15', border:`1px solid ${dl.color}30`, whiteSpace:'nowrap' }}>
                        {dl.label === 'Expiré' ? 'Expiré' : dl.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Progression entretiens */}
            <div style={S.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div>
                  <div style={S.cardTitle}>📊 Progression entretiens</div>
                  <div style={S.cardSub}>{scores.length} entretien{scores.length > 1 ? 's' : ''} simulé{scores.length > 1 ? 's' : ''}</div>
                </div>
                <button style={S.btnXs} onClick={() => setView('entretien')}>Pratiquer →</button>
              </div>
              {scores.length === 0 ? (
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>🎙️</div>
                  <div style={{ color:'#64748b', fontSize:13, marginBottom:12 }}>Aucun entretien encore</div>
                  <button style={S.btnPrimary} onClick={() => setView('entretien')}>Démarrer un entretien IA</button>
                </div>
              ) : (
                <>
                  <svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ marginBottom:12 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1a3a6b" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#1a3a6b" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {(() => {
                      const pts = scores.slice().reverse();
                      const n = pts.length;
                      if (n < 2) return (
                        <g>
                          <circle cx="200" cy={110-(pts[0]?.scoreNum/100)*100} r="5" fill="#1a3a6b"/>
                          <text x="200" y={110-(pts[0]?.scoreNum/100)*100-8} textAnchor="middle" fontSize="10" fill="#64748b">{pts[0]?.scoreNum}/100</text>
                        </g>
                      );
                      const xs = pts.map((_,i) => (i/(n-1))*380+10);
                      const ys = pts.map(p => 110-(p.scoreNum/100)*100);
                      const line = xs.map((x,i) => `${i===0?'M':'L'}${x},${ys[i]}`).join(' ');
                      const area = `${line} L${xs[n-1]},110 L${xs[0]},110 Z`;
                      return (
                        <>
                          <path d={area} fill="url(#scoreGrad)"/>
                          <path d={line} fill="none" stroke="#1a3a6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          {xs.map((x,i) => (
                            <g key={i}>
                              <circle cx={x} cy={ys[i]} r="5" fill="#1a3a6b"/>
                              <circle cx={x} cy={ys[i]} r="2" fill="#f5a623"/>
                              <text x={x} y={ys[i]-8} textAnchor="middle" fontSize="9" fill="#64748b">{pts[i].scoreNum}</text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                  <div style={{ display:'flex', gap:16 }}>
                    {[
                      { label:'Dernier score', val:`${lastScore}/100`, color: lastScore >= 75 ? '#166534' : lastScore >= 55 ? '#d97706' : '#dc2626' },
                      avgScore && { label:'Moyenne', val:`${avgScore}/100`, color:'#64748b' },
                      scoreDiff !== null && { label:'Évolution', val:`${scoreDiff > 0 ? '+' : ''}${scoreDiff}`, color: scoreDiff > 0 ? '#166534' : '#dc2626' },
                    ].filter(Boolean).map((s, i) => (
                      <div key={i} style={{ padding:'8px 12px', borderRadius:6, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                        <div style={{ fontSize:15, fontWeight:800, color:s.color }}>{s.val}</div>
                        <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Force du dossier */}
            <div style={S.card}>
              <div style={S.cardTitle}>💪 Force de votre dossier</div>
              <div style={{ display:'flex', alignItems:'center', gap:16, margin:'14px 0' }}>
                <div style={{ position:'relative', width:80, height:80, flexShrink:0 }}>
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" strokeWidth="7"/>
                    <circle cx="40" cy="40" r="32" fill="none"
                      stroke={completion >= 80 ? '#166534' : completion >= 60 ? '#d97706' : '#1a3a6b'}
                      strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${completion * 2.01} 201`}
                      transform="rotate(-90 40 40)"
                      style={{ transition:'stroke-dasharray 0.8s ease' }}
                    />
                  </svg>
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#1a3a6b' }}>
                    {completion}%
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  {[
                    { label:'Nom',        field:'name'    },
                    { label:'Email',      field:'email'   },
                    { label:'Pays cible', field:'pays'    },
                    { label:'Niveau',     field:'niveau'  },
                    { label:'Domaine',    field:'domaine' },
                  ].map(({ label, field }) => (
                    <div key={field} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                      <div style={{ width:8, height:8, borderRadius:2, background: user[field] ? '#166534' : '#e2e8f0', flexShrink:0 }}/>
                      <span style={{ fontSize:12, color: user[field] ? '#1a3a6b' : '#94a3b8', fontWeight: user[field] ? 500 : 400 }}>{label}</span>
                      {!user[field] && <span style={{ fontSize:9, color:'#dc2626', marginLeft:'auto', fontWeight:600 }}>manquant</span>}
                    </div>
                  ))}
                </div>
              </div>
              <button style={{ ...S.btnPrimary, width:'100%' }} onClick={() => setView('profil')}>Compléter mon profil</button>
            </div>

            {/* Top bourses */}
            <div style={S.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div style={S.cardTitle}>✨ Top bourses pour toi</div>
                <button style={S.btnXs} onClick={() => setView('recommandations')}>Voir tout →</button>
              </div>
              {(bourses||[]).slice(0,3).map((b, i) => (
                <div key={i} style={{ padding:'10px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                    <div style={{ fontSize:13, color:'#1a3a6b', fontWeight:600, flex:1, marginRight:8 }}>{b.nom}</div>
                    <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:'#eff6ff', color:'#1a3a6b', border:'1px solid #bfdbfe', whiteSpace:'nowrap', fontWeight:500 }}>
                      {b.pays}
                    </span>
                  </div>
                  <div style={{ fontSize:11, color:'#64748b', marginBottom:4 }}>{b.financement}</div>
                  <button style={{ fontSize:11, color:'#1a3a6b', background:'none', border:'none', cursor:'pointer', padding:0, fontWeight:600, textDecoration:'underline', textDecorationColor:'#f5a623' }}
                    onClick={() => handleQuickReply(`Donne-moi les détails sur "${b.nom}"`)}>
                    En savoir plus →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  card:      { background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'18px 20px', marginBottom:0, boxShadow:'0 2px 8px rgba(26,58,107,0.06)' },
  cardTitle: { fontSize:14, fontWeight:700, color:'#1a3a6b' },
  cardSub:   { fontSize:11, color:'#64748b', marginTop:2 },
  btnPrimary:{ padding:'9px 18px', borderRadius:6, background:'#1a3a6b', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnGold:   { padding:'9px 18px', borderRadius:6, background:'#f5a623', color:'#1a3a6b', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' },
  btnOutline:{ padding:'8px 16px', borderRadius:6, background:'transparent', color:'#475569', border:'1px solid #e2e8f0', fontSize:13, cursor:'pointer' },
  btnXs:     { padding:'5px 12px', borderRadius:4, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:11, cursor:'pointer', fontWeight:600 },
  navBtn:    { padding:'3px 12px', borderRadius:4, background:'#f8fafc', border:'1px solid #e2e8f0', color:'#1a3a6b', fontSize:16, cursor:'pointer' },
};