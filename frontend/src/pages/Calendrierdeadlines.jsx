import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api';

export default function CalendrierDeadlines({ user, onSelectBourse }) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch roadmap depuis Payload ────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetch(API_BASE + '/roadmap?where[userId][equals]=' + user.id + '&limit=100&depth=0')
      .then(r => r.json())
      .then(d => {
        const docs = (d.docs || []).map(b => ({
          ...b,
          // Normaliser : Payload retourne dateLimite, on mappe vers deadline
          deadline: b.dateLimite || b.deadline || null,
        }));
        console.log('[Calendrier] roadmap chargée:', docs.length, 'bourses');
        console.log('[Calendrier] exemple:', docs[0]);
        setRoadmap(docs);
      })
      .catch(e => console.error('[Calendrier] erreur fetch:', e))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const dayNames   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

  const firstDay  = new Date(year, month, 1);
  const startDow  = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // ── Grouper bourses par jour ─────────────────────────────────────────────────
  const boursesByDay = {};
  roadmap.forEach(b => {
    if (!b.deadline) return;
    const d = new Date(b.deadline);
    if (isNaN(d.getTime())) return;
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!boursesByDay[day]) boursesByDay[day] = [];
      boursesByDay[day].push(b);
    }
  });

  // ── Bourses ce mois triées ───────────────────────────────────────────────────
  const boursesMonth = roadmap
    .filter(b => {
      if (!b.deadline) return false;
      const d = new Date(b.deadline);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  // ── Couleur urgence ─────────────────────────────────────────────────────────
  const urgency = (deadline) => {
    if (!deadline) return { color:'#94a3b8', bg:'rgba(148,163,184,0.1)', label:'?' };
    const diff = Math.round((new Date(deadline) - today) / 86400000);
    if (diff < 0)   return { color:'#f87171', bg:'rgba(248,113,113,0.15)', label:'Expiré' };
    if (diff === 0) return { color:'#f87171', bg:'rgba(248,113,113,0.2)',  label:"Auj." };
    if (diff <= 7)  return { color:'#fbbf24', bg:'rgba(251,191,36,0.15)', label:`${diff}j` };
    if (diff <= 30) return { color:'#a78bfa', bg:'rgba(167,139,250,0.15)',label:`${diff}j` };
    return { color:'#34d399', bg:'rgba(52,211,153,0.12)', label:`${diff}j` };
  };

  // Cellules calendrier
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ background:'rgba(15,15,30,0.95)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:20, overflow:'hidden', fontFamily:'system-ui,sans-serif' }}>

      {/* Header */}
      <div style={{ padding:'18px 24px', borderBottom:'1px solid rgba(99,102,241,0.12)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'#e2e8f0' }}>Calendrier des Deadlines</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
            {loading ? '⏳ Chargement...'
              : roadmap.length === 0 ? 'Aucune bourse dans votre roadmap'
              : boursesMonth.length > 0
                ? boursesMonth.length + ' deadline' + (boursesMonth.length > 1 ? 's' : '') + ' ce mois · ' + roadmap.length + ' bourses au total'
                : roadmap.length + ' bourse' + (roadmap.length > 1 ? 's' : '') + ' en roadmap · aucune deadline ce mois'}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            style={{ width:30, height:30, borderRadius:8, border:'1px solid rgba(99,102,241,0.2)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:16 }}>
            ‹
          </button>
          <div style={{ fontSize:14, fontWeight:700, color:'#c7d2fe', minWidth:140, textAlign:'center' }}>
            {monthNames[month]} {year}
          </div>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            style={{ width:30, height:30, borderRadius:8, border:'1px solid rgba(99,102,241,0.2)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:16 }}>
            ›
          </button>
          <button onClick={() => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))}
            style={{ padding:'4px 10px', borderRadius:7, border:'1px solid rgba(99,102,241,0.25)', background:'rgba(99,102,241,0.1)', color:'#818cf8', cursor:'pointer', fontSize:11, fontWeight:600, marginLeft:4 }}>
            Aujourd'hui
          </button>
        </div>
      </div>

      {/* Corps */}
      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#64748b', fontSize:13 }}>
          Chargement de votre roadmap...
        </div>
      ) : !user ? (
        <div style={{ padding:40, textAlign:'center', color:'#64748b', fontSize:13 }}>
          Connectez-vous pour voir vos deadlines
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px' }}>

          {/* Grille calendrier */}
          <div style={{ padding:'16px 20px' }}>

            {/* Jours semaine */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:6 }}>
              {dayNames.map(d => (
                <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'#475569', padding:'4px 0', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Cellules jours */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const isToday   = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const hasBourse = boursesByDay[day];
                const u         = hasBourse ? urgency(hasBourse[0].deadline) : null;

                return (
                  <div key={i}
                    onClick={() => hasBourse && onSelectBourse && onSelectBourse(hasBourse[0])}
                    style={{
                      minHeight:58, borderRadius:10, padding:'6px 4px',
                      background: isToday ? 'rgba(99,102,241,0.22)'
                                : hasBourse ? u.bg
                                : 'transparent',
                      border: isToday ? '1.5px solid rgba(99,102,241,0.6)'
                            : hasBourse ? '1px solid ' + u.color + '40'
                            : '1px solid transparent',
                      cursor: hasBourse ? 'pointer' : 'default',
                      transition:'all 0.15s',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                    }}
                    onMouseEnter={e => { if (hasBourse) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(1.03)'; }}}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {/* Numéro jour */}
                    <div style={{
                      fontSize:13, fontWeight: isToday ? 800 : hasBourse ? 600 : 400,
                      color: isToday ? '#818cf8' : hasBourse ? '#f1f5f9' : '#475569',
                      lineHeight:1,
                    }}>
                      {day}
                    </div>

                    {/* Pastilles bourses */}
                    {hasBourse && (
                      <div style={{ display:'flex', flexDirection:'column', gap:2, width:'100%', marginTop:2 }}>
                        {hasBourse.slice(0, 2).map((b, bi) => (
                          <div key={bi} style={{
                            fontSize:9, padding:'2px 4px', borderRadius:4,
                            background: urgency(b.deadline).bg,
                            color: urgency(b.deadline).color,
                            fontWeight:600, textAlign:'center',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          }} title={b.nom}>
                            {b.nom.length > 9 ? b.nom.slice(0,8) + '…' : b.nom}
                          </div>
                        ))}
                        {hasBourse.length > 2 && (
                          <div style={{ fontSize:9, color:'#64748b', textAlign:'center' }}>+{hasBourse.length - 2}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar deadlines du mois */}
          <div style={{ borderLeft:'1px solid rgba(99,102,241,0.12)', padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>
              {monthNames[month]}
            </div>

            {boursesMonth.length === 0 ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'20px 8px', gap:8 }}>
                <div style={{ fontSize:28 }}>📭</div>
                <div style={{ fontSize:12, color:'#475569' }}>Aucune deadline ce mois</div>
                <div style={{ fontSize:11, color:'#334155' }}>Naviguez vers d'autres mois</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6, overflowY:'auto', maxHeight:340 }}>
                {boursesMonth.map((b, i) => {
                  const d = new Date(b.deadline);
                  const u = urgency(b.deadline);
                  return (
                    <div key={i} onClick={() => onSelectBourse && onSelectBourse(b)}
                      style={{ padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid ' + u.color + '25', cursor:'pointer', transition:'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                      <div style={{ fontSize:12, fontWeight:600, color:'#e2e8f0', marginBottom:3, lineHeight:1.3 }}>
                        {b.nom}
                      </div>
                      {b.pays && <div style={{ fontSize:11, color:'#475569', marginBottom:5 }}>🌍 {b.pays}</div>}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ fontSize:11, color:'#64748b' }}>
                          {d.toLocaleDateString('fr-FR', { day:'2-digit', month:'short' })}
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:u.bg, color:u.color, border:'1px solid ' + u.color + '40' }}>
                          {u.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Légende */}
            <div style={{ marginTop:'auto', paddingTop:12, borderTop:'1px solid rgba(99,102,241,0.1)', display:'flex', flexDirection:'column', gap:5 }}>
              {[
                { color:'#34d399', label:'> 30 jours' },
                { color:'#a78bfa', label:'≤ 30 jours' },
                { color:'#fbbf24', label:'≤ 7 jours' },
                { color:'#f87171', label:'Expiré' },
              ].map((l, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:l.color, flexShrink:0 }}/>
                  <div style={{ fontSize:10, color:'#475569' }}>{l.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}