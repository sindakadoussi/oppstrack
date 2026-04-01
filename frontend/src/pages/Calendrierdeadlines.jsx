import React, { useState, useEffect } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';

export default function CalendrierDeadlines({ user, onSelectBourse }) {
  const today = new Date();
  const [cur, setCur]         = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    axiosInstance.get(API_ROUTES.roadmap.byUser(user.id))
      .then(r => setRoadmap((r.data.docs || []).map(b => ({ ...b, deadline: b.dateLimite || b.deadline || null }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const Y = cur.getFullYear(), M = cur.getMonth();
  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const DAYS   = ['Lu','Ma','Me','Je','Ve','Sa','Di'];
  const YEARS  = Array.from({length:9}, (_,i)=> today.getFullYear() - 3 + i);

  const firstDow    = (new Date(Y, M, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(Y, M + 1, 0).getDate();

  // Grouper bourses par jour
  const byDay = {};
  roadmap.forEach(b => {
    if (!b.deadline) return;
    const d = new Date(b.deadline);
    if (isNaN(d) || d.getFullYear() !== Y || d.getMonth() !== M) return;
    const day = d.getDate();
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(b);
  });

  const urg = (dl) => {
    if (!dl) return '#64748b';
    const diff = Math.round((new Date(dl) - today) / 86400000);
    if (diff < 0)   return '#f87171';
    if (diff <= 7)  return '#fbbf24';
    if (diff <= 30) return '#a78bfa';
    return '#34d399';
  };

  // 42 cellules (6 semaines)
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);

  return (
    <div style={{ background:'rgba(12,12,24,0.95)', border:'1px solid rgba(99,102,241,0.18)', borderRadius:14, overflow:'hidden', width:'100%', maxWidth:420 }}>

      {/* Header navigation */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderBottom:'1px solid rgba(99,102,241,0.1)' }}>
        <button onClick={() => setCur(new Date(Y, M-1, 1))}
          style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#94a3b8', cursor:'pointer', fontSize:13, borderRadius:6, width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={M} onChange={e=>setCur(new Date(Y, parseInt(e.target.value,10),1))} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', color:'#e2e8f0', padding:'6px 8px', borderRadius:6, fontSize:12 }}>
            {MONTHS.map((m,mi)=> <option key={mi} value={mi}>{m}</option>)}
          </select>
          <select value={Y} onChange={e=>setCur(new Date(parseInt(e.target.value,10), M, 1))} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', color:'#e2e8f0', padding:'6px 8px', borderRadius:6, fontSize:12 }}>
            {YEARS.map(y=> <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={() => setCur(new Date(Y, M+1, 1))}
          style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#94a3b8', cursor:'pointer', fontSize:13, borderRadius:6, width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
      </div>

      <div style={{ padding:'8px 10px' }}>
        {/* Jours semaine */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
          {DAYS.map((d, i) => (
            <div key={i} style={{ textAlign:'center', fontSize:9, color:'#475569', fontWeight:600, padding:'2px 0' }}>{d}</div>
          ))}
        </div>

        {/* Grille */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} style={{ minHeight:38 }} />;

            const isToday  = day === today.getDate() && M === today.getMonth() && Y === today.getFullYear();
            const isOld    = new Date(Y, M, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate()) && !isToday;
            const bourses  = byDay[day] || [];

            return (
              <div key={i}
                style={{
                  minHeight: 38,
                  borderRadius: 8,
                  padding: '4px 3px',
                  background: isToday ? 'rgba(99,102,241,0.2)' : bourses.length ? 'rgba(255,255,255,0.03)' : 'transparent',
                  border: isToday ? '1.5px solid rgba(99,102,241,0.6)' : bourses.length ? '1px solid rgba(99,102,241,0.12)' : '1px solid transparent',
                  cursor: bourses.length ? 'pointer' : 'default',
                  transition: 'all 0.12s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
                onMouseEnter={e => { if (bourses.length) e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isToday ? 'rgba(99,102,241,0.2)' : bourses.length ? 'rgba(255,255,255,0.03)' : 'transparent'; }}
                onClick={() => bourses.length && onSelectBourse && onSelectBourse(bourses[0])}
              >
                {/* Numéro du jour */}
                <div style={{
                  fontSize: 11,
                  fontWeight: isToday ? 800 : 500,
                  color: isToday ? '#818cf8' : isOld ? '#334155' : '#94a3b8',
                  lineHeight: 1,
                  textAlign: 'center',
                }}>
                  {day}
                </div>

                {/* Bourses de ce jour */}
                {bourses.slice(0, 2).map((b, bi) => {
                  const color = urg(b.deadline);
                  const shortName = b.nom.length > 12 ? b.nom.slice(0, 11) + '…' : b.nom;
                  return (
                    <div key={bi} style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: '#0d0d22',
                      background: color,
                      borderRadius: 3,
                      padding: '2px 4px',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }} title={b.nom}>
                      {shortName}
                    </div>
                  );
                })}
                {bourses.length > 2 && (
                  <div style={{ fontSize:8, color:'#64748b', textAlign:'center' }}>+{bourses.length - 2}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}