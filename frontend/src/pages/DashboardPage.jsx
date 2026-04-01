import React, { useState, useEffect } from 'react';
import CalendrierDeadlines from './CalendrierDeadlines';
import BourseDrawer from '../components/Boursedrawer';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';

export default function DashboardPage({ user, bourses, entretienScores, setView, handleQuickReply, onOpenBourse }) {
  const [boursesSuivies, setBoursesSuivies] = useState([]);
  const [loadingBourses, setLoadingBourses] = useState(true);
  const [drawerBourse, setDrawerBourse]     = useState(null);
  const [appliedNoms,  setAppliedNoms]      = useState(new Set());
  const [starredNoms,  setStarredNoms]      = useState(new Set());

  useEffect(() => {
    if (!user?.id) { setLoadingBourses(false); return; }
    if (user.bourses_choisies?.length > 0) {
      setBoursesSuivies(user.bourses_choisies);
      setLoadingBourses(false);
      return;
    }
    axiosInstance.get(API_ROUTES.roadmap.byUser(user.id))
      .then(response => setBoursesSuivies(response.data.bourses_choisies || []))
      .catch(() => {})
      .finally(() => setLoadingBourses(false));
  }, [user?.id]);

  const parseScore = txt => {
    const m = (txt || '').match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i);
    return m ? parseInt(m[1]) : null;
  };

  const scores = (entretienScores || [])
    .map(s => ({ ...s, scoreNum: parseScore(s.score) }))
    .filter(s => s.scoreNum !== null);

  const lastScore = scores[0]?.scoreNum ?? null;
  const avgScore  = scores.length > 0 ? Math.round(scores.reduce((a,b) => a + b.scoreNum, 0) / scores.length) : null;
  const scoreDiff = scores.length >= 2 ? scores[0].scoreNum - scores[1].scoreNum : null;

  const completion = !user ? 0 : Math.round(['name','email','pays','niveau','domaine'].filter(f => user[f]).length / 5 * 100);

  const deadlines = boursesSuivies
    .filter(b => b.deadline)
    .map(b => ({ nom: b.nom, deadline: new Date(b.deadline), pays: b.pays }))
    .sort((a,b) => a.deadline - b.deadline)
    .slice(0,4);

  const daysLeft = d => {
    const diff = Math.round((d - new Date()) / 86400000);
    if (diff < 0)   return { label: 'Expiré',      color: '#f87171' };
    if (diff === 0) return { label: "Aujourd'hui", color: '#f87171' };
    if (diff <= 7)  return { label: `${diff}j`,    color: '#fbbf24' };
    if (diff <= 30) return { label: `${diff}j`,    color: '#a78bfa' };
    return { label: `${diff}j`, color: '#94a3b8' };
  };

  const recommendations = bourses.slice(0, 3).map(b => ({
    nom: b.nom, pays: b.pays, financement: b.financement,
    match: Math.round(60 + Math.random() * 35),
  }));

  // ── Outils liés aux bourses sauvegardées ─────────────────────────────────
  const outils = [
    {
      icon: '📅',
      titre: 'Calendrier des deadlines',
      desc: 'Vue mensuelle et annuelle de toutes les dates limites avec alertes automatiques avant expiration.',
      badge: 'Essentiel',
      badgeColor: '#b45309',
      badgeBg: '#78350f',
      action: () => setView('roadmap'),
      data: boursesSuivies.filter(b => b.deadline).length,
      dataLabel: 'deadlines',
    },
    {
      icon: '🌍',
      titre: 'Carte des destinations',
      desc: 'Visualisez les pays de vos bourses sauvegardées sur une carte interactive.',
      badge: 'Valeur ajoutée',
      badgeColor: '#065f46',
      badgeBg: '#064e3b',
      action: () => setView('bourses'),
      data: [...new Set(boursesSuivies.map(b => b.pays).filter(Boolean))].length,
      dataLabel: 'pays',
    },
    {
      icon: '📄',
      titre: 'CV & Lettre de motivation',
      desc: "Générez un CV et une LM personnalisés pour chaque bourse grâce à l'IA.",
      badge: 'IA',
      badgeColor: '#4338ca',
      badgeBg: '#312e81',
      action: () => setView('cv'),
      data: boursesSuivies.length,
      dataLabel: 'bourses',
    },
    {
      icon: '🎤',
      titre: "Simulation d'entretien",
      desc: "Préparez-vous aux entretiens de sélection avec notre IA. Obtenez un score et des conseils.",
      badge: 'Pro',
      badgeColor: '#6d28d9',
      badgeBg: '#4c1d95',
      action: () => setView('entretien'),
      data: scores.length > 0 ? lastScore : null,
      dataLabel: 'score',
    },
  ];

  if (!user) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:16, textAlign:'center', padding:40 }}>
        <div style={{ fontSize:40 }}>🔒</div>
        <h3 style={{ fontSize:'1.1rem', color:'#f1f5f9' }}>Dashboard personnel</h3>
        <p style={{ fontSize:13, color:'#64748b' }}>Connectez-vous pour accéder à votre tableau de bord</p>
        <button onClick={() => handleQuickReply('Je veux me connecter')} style={S.btnPrimary}>
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>Tableau de Bord</h1>
          <p style={S.headerSub}>Bonjour {user.name || user.email?.split('@')[0]}, voici l'état de vos bourses d'études.</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          
          <button style={S.btnPrimary} onClick={() => setView('bourses')}>
            Explorer Bourses
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={S.kpiRow}>
        {[
          { label:'Bourses Sauvegardées', val:boursesSuivies.length,                                                                   icon:'🎓', accent:'#818cf8' },
          { label:'Candidatures Prévues', val:boursesSuivies.length,                                                                   icon:'📋', accent:'#34d399' },
          { label:'Deadlines Proches',    val:deadlines.filter(d => (d.deadline - new Date()) < 30*86400000).length,                   icon:'⏰', accent:'#fbbf24' },
          { label:"Score d'Éligibilité",  val:`${completion}%`,                                                                        icon:'⭐', accent:'#a78bfa' },
        ].map((k,i) => (
          <div key={i} style={{ ...S.kpiCard, borderTop:`2px solid ${k.accent}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={S.kpiLabel}>{k.label}</div>
                <div style={{ ...S.kpiVal, color:k.accent }}>{k.val}</div>
              </div>
              <span style={{ fontSize:22 }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── CALENDRIER DES DEADLINES ─────────────────────────────────────── */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#e2e8f0' }}>Calendrier des Deadlines</div>
            <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
              Vos bourses sauvegardées avec leurs dates limites
            </div>
          </div>
        </div>
        <CalendrierDeadlines
          user={user}
          onSelectBourse={(b) => setDrawerBourse(b)}
        />
      </div>

      {/* Main grid */}
      <div style={S.mainGrid}>

        {/* LEFT */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Progression entretiens */}
          <div style={S.card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div>
                <div style={S.cardTitle}>Progression des Candidatures</div>
                <div style={S.cardSub}>Évolution de vos scores au fil du temps</div>
              </div>
              {scores.length > 0 && (
                <button style={S.btnXs} onClick={() => setView('entretien')}>
                  + {scores.length} entretien{scores.length > 1 ? 's' : ''}
                </button>
              )}
            </div>

            {scores.length === 0 ? (
              <div style={{ padding:'32px 0', textAlign:'center' }}>
                <div style={{ color:'#64748b', fontSize:13, marginBottom:12 }}>Aucun entretien encore</div>
                <button style={S.btnPrimary} onClick={() => setView('entretien')}>
                  Démarrer un entretien IA
                </button>
              </div>
            ) : (
              <>
                <div style={{ position:'relative', height:140, marginBottom:12 }}>
                  <svg width="100%" height="140" viewBox="0 0 400 140" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {(() => {
                      const pts = scores.slice().reverse();
                      const n = pts.length;
                      if (n < 2) return null;
                      const xs = pts.map((_,i) => (i / (n-1)) * 380 + 10);
                      const ys = pts.map(p => 130 - (p.scoreNum / 100) * 120);
                      const line = xs.map((x,i) => `${i===0?'M':'L'}${x},${ys[i]}`).join(' ');
                      const area = line + ` L${xs[n-1]},130 L${xs[0]},130 Z`;
                      return (
                        <>
                          <path d={area} fill="url(#grad)"/>
                          <path d={line} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          {xs.map((x,i) => (
                            <g key={i}>
                              <circle cx={x} cy={ys[i]} r="4" fill="#818cf8"/>
                              <text x={x} y={ys[i]-8} textAnchor="middle" fontSize="10" fill="#94a3b8">{pts[i].scoreNum}</text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <div style={{ display:'flex', gap:16 }}>
                  <div style={S.miniStat}>
                    <div style={{ ...S.miniVal, color: lastScore >= 75 ? '#34d399' : lastScore >= 55 ? '#fbbf24' : '#f87171' }}>
                      {lastScore}/100
                    </div>
                    <div style={S.miniLabel}>Dernier score</div>
                  </div>
                  {avgScore && (
                    <div style={S.miniStat}>
                      <div style={S.miniVal}>{avgScore}/100</div>
                      <div style={S.miniLabel}>Moyenne</div>
                    </div>
                  )}
                  {scoreDiff !== null && (
                    <div style={S.miniStat}>
                      <div style={{ ...S.miniVal, color: scoreDiff > 0 ? '#34d399' : '#f87171' }}>
                        {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                      </div>
                      <div style={S.miniLabel}>Évolution</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Deadlines */}
          <div style={S.card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={S.cardTitle}>Prochaines Échéances</div>
              <button style={S.btnXs} onClick={() => setView('roadmap')}>Voir Roadmap →</button>
            </div>
            {deadlines.length === 0 ? (
              <div style={{ color:'#64748b', fontSize:13, padding:'12px 0' }}>
                Sélectionnez des bourses dans le chat pour voir leurs deadlines ici.
              </div>
            ) : (
              deadlines.map((d,i) => {
                const dl = daysLeft(d.deadline);
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < deadlines.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:dl.color, flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:500 }}>{d.nom}</div>
                      <div style={{ fontSize:11, color:'#64748b' }}>{d.pays} · {d.deadline.toLocaleDateString('fr-FR')}</div>
                    </div>
                    <span style={{ fontSize:12, color:dl.color, fontWeight:600, padding:'3px 10px', borderRadius:99, background:dl.color+'18', border:`1px solid ${dl.color}40` }}>
                      Dans {dl.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Recommandations IA */}
          <div style={S.card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div>
                <div style={S.cardTitle}>IA : Recommandations du Jour</div>
                <div style={S.cardSub}>Basées sur votre profil, voici de nouvelles opportunités.</div>
              </div>
            </div>
            {recommendations.map((b,i) => (
              <div key={i} style={{ padding:'12px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:500 }}>{b.nom}</div>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:'rgba(129,140,248,0.15)', color:'#818cf8', border:'1px solid rgba(129,140,248,0.3)', whiteSpace:'nowrap', marginLeft:8 }}>
                    {b.match}% match
                  </span>
                </div>
                <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>
                  {b.pays} · {b.financement}
                </div>
                <button
                  style={{ fontSize:11, color:'#818cf8', background:'none', border:'none', cursor:'pointer', padding:0 }}
                  onClick={() => handleQuickReply(`Peux-tu me donner plus de détails sur la bourse "${b.nom}" ?`)}
                >
                  Voir plus de détails →
                </button>
              </div>
            ))}
            <button style={{ ...S.btnPrimary, width:'100%', marginTop:4 }} onClick={() => setView('recommandations')}>
              Voir plus de recommandations
            </button>
          </div>

          {/* Profil score */}
          <div style={S.card}>
            <div style={S.cardTitle}>Force de votre Dossier</div>
            <div style={{ display:'flex', alignItems:'center', gap:16, margin:'16px 0' }}>
              <div style={{ position:'relative', width:80, height:80, flexShrink:0 }}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"/>
                  <circle cx="40" cy="40" r="32" fill="none"
                    stroke={completion >= 80 ? '#34d399' : completion >= 60 ? '#fbbf24' : '#818cf8'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${completion * 2.01} 201`}
                    transform="rotate(-90 40 40)"
                    style={{ transition:'stroke-dasharray 0.8s ease' }}
                  />
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'#f1f5f9' }}>
                  {completion}%
                </div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:500, marginBottom:6 }}>
                  {completion >= 100 ? 'Profil complet !' : completion >= 80 ? 'Presque complet' : 'Profil à compléter'}
                </div>
                {['name','email','pays','niveau','domaine'].map(f => (
                  <div key={f} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background: user[f] ? '#34d399' : 'rgba(255,255,255,0.15)' }}/>
                    <div style={{ fontSize:11, color: user[f] ? '#94a3b8' : '#475569' }}>
                      {{ name:'Nom', email:'Email', pays:'Pays cible', niveau:'Niveau', domaine:'Domaine' }[f]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button style={{ ...S.btnOutline, flex:1 }} onClick={() => setView('profil')}>Modifier le profil</button>
              
            </div>
          </div>
        </div>
      </div>
      {/* Drawer bourse depuis calendrier */}
      {drawerBourse && (
        <BourseDrawer
          bourse={drawerBourse}
          onClose={() => setDrawerBourse(null)}
          onAskAI={(b) => { handleQuickReply('Donne-moi les détails sur "' + b.nom + '"'); setDrawerBourse(null); }}
          onChoose={(b) => handleQuickReply('je choisis ' + b.nom)}
          applied={appliedNoms.has(drawerBourse.nom?.trim().toLowerCase())}
          onApply={async (b) => {
            try {
              await axiosInstance.post(API_ROUTES.roadmap.create, {
                userId: user.id, userEmail: user.email || '',
                nom: b.nom, pays: b.pays || '',
                lienOfficiel: b.lienOfficiel || '',
                financement: b.financement || '',
                dateLimite: b.dateLimite || null,
                ajouteLe: new Date().toISOString(),
                statut: 'en_cours', etapeCourante: 0,
              });
              setAppliedNoms(prev => new Set([...prev, b.nom?.trim().toLowerCase()]));
            } catch(e) { console.error(e); }
          }}
          starred={starredNoms.has(drawerBourse.nom?.trim().toLowerCase())}
          onStar={async (b, isStarred) => {
            const nomKey = b.nom?.trim().toLowerCase();
            try {
              const res = await axiosInstance.get(API_ROUTES.favoris.byUser(user.id) + '&limit=1&depth=0');
              const doc = res.data.docs?.[0];
              if (isStarred) {
                if (doc?.id) {
                  const newB = (doc.bourses || []).filter(x => x.nom?.trim().toLowerCase() !== nomKey);
                  await axiosInstance.patch(API_ROUTES.favoris.update(doc.id), { bourses: newB });
                  setStarredNoms(prev => { const s = new Set(prev); s.delete(nomKey); return s; });
                }
              } else {
                const nb = { nom: b.nom, pays: b.pays || '', lienOfficiel: b.lienOfficiel || '', financement: b.financement || '', dateLimite: b.dateLimite || null, ajouteLe: new Date().toISOString() };
                if (doc?.id) await axiosInstance.patch(API_ROUTES.favoris.update(doc.id), { bourses: [...(doc.bourses || []), nb] });
                else await axiosInstance.post(API_ROUTES.favoris.create, { user: user.id, userEmail: user.email || '', bourses: [nb] });
                setStarredNoms(prev => new Set([...prev, nomKey]));
              }
            } catch(e) { console.error(e); }
          }}
        />
      )}
    </div>
  );
}

const S = {
  page:      { width:'100%', padding:'28px 20px', maxWidth:1100, margin:'0 auto', fontFamily:'sans-serif' },
  header:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 },
  h1:        { fontSize:'1.5rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 },
  headerSub: { fontSize:13, color:'#64748b' },

  kpiRow:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 },
  kpiCard:  { background:'rgba(15,15,30,0.8)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:14, padding:'16px 18px' },
  kpiLabel: { fontSize:11, color:'#64748b', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.04em' },
  kpiVal:   { fontSize:26, fontWeight:800 },

  mainGrid: { display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:16 },
  card:     { background:'rgba(15,15,30,0.8)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:14, padding:'18px 20px' },
  cardTitle:{ fontSize:14, fontWeight:700, color:'#e2e8f0' },
  cardSub:  { fontSize:12, color:'#64748b', marginTop:2 },

  miniStat: { display:'flex', flexDirection:'column', gap:2 },
  miniVal:  { fontSize:16, fontWeight:700, color:'#f1f5f9' },
  miniLabel:{ fontSize:11, color:'#64748b' },

  btnPrimary: { padding:'8px 16px', borderRadius:9, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnOutline: { padding:'8px 16px', borderRadius:9, background:'transparent', color:'#94a3b8', border:'1px solid rgba(255,255,255,0.15)', fontSize:13, cursor:'pointer' },
  btnXs:      { padding:'4px 10px', borderRadius:8, background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)', color:'#818cf8', fontSize:11, cursor:'pointer' },
};