import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api';

function getScoreGradient(score) {
  if (score >= 80) return 'linear-gradient(135deg, #0f4c2a 0%, #1a6b3a 50%, #0d3d22 100%)';
  if (score >= 60) return 'linear-gradient(135deg, #1a3a5c 0%, #1e5a8a 50%, #0f2d47 100%)';
  if (score >= 40) return 'linear-gradient(135deg, #3a2a0f 0%, #6b4a1a 50%, #2d1f0a 100%)';
  return 'linear-gradient(135deg, #2a1a2e 0%, #4a2a5c 50%, #1f0f28 100%)';
}

function getScoreColor(score) {
  if (score >= 80) return '#4ade80';
  if (score >= 60) return '#60a5fa';
  if (score >= 40) return '#fbbf24';
  return '#c084fc';
}

function getScoreBadge(score) {
  if (score >= 80) return { label: 'Excellent match', color: '#4ade80', bg: 'rgba(74,222,128,0.15)' };
  if (score >= 60) return { label: 'Bon match',       color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' };
  if (score >= 40) return { label: 'Match partiel',   color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' };
  return                   { label: 'À explorer',     color: '#c084fc', bg: 'rgba(192,132,252,0.15)' };
}

function getDaysLeft(dateLimite) {
  if (!dateLimite) return null;
  return Math.floor((new Date(dateLimite) - new Date()) / 86400000);
}

function formatDate(dateStr) {
  if (!dateStr) return 'Non précisée';
  try { return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return dateStr; }
}

function CountdownBadge({ dateLimite }) {
  const days = getDaysLeft(dateLimite);
  if (days === null) return <span style={{ ...S.deadlineBadge, background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>⏰ Deadline non précisée</span>;
  if (days < 0)      return <span style={{ ...S.deadlineBadge, background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>✕ Session terminée</span>;
  if (days <= 30)    return <span style={{ ...S.deadlineBadge, background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>🔥 {days}j restants</span>;
  if (days <= 90)    return <span style={{ ...S.deadlineBadge, background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>⏰ {days}j restants</span>;
  return                    <span style={{ ...S.deadlineBadge, background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>✓ {days}j restants</span>;
}

function BourseCard({ bourse, onSave, saved, expired }) {
  const score      = bourse.matchScore || 0;
  const badge      = getScoreBadge(score);
  const scoreColor = getScoreColor(score);
  const gradient   = getScoreGradient(score);

  return (
    <div style={{
      ...S.card,
      background: gradient,
      opacity: expired ? 0.78 : 1,
      border: expired ? '1px solid rgba(255,255,255,0.06)' : `1px solid ${scoreColor}33`,
    }}>

      {/* Score ring — coin haut droit, ne chevauche que le padding */}
      <div style={S.scoreRingWrap}>
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5"/>
          <circle cx="26" cy="26" r="22" fill="none" stroke={scoreColor} strokeWidth="3.5"
            strokeDasharray={`${(score / 100) * 138.2} 138.2`}
            strokeLinecap="round" transform="rotate(-90 26 26)"
          />
          <text x="26" y="31" textAnchor="middle" fill={scoreColor} fontSize="12" fontWeight="700" fontFamily="system-ui">{score}</text>
        </svg>
      </div>

      {/* Badge match — ligne séparée du score ring */}
      <div style={{ marginBottom: 2 }}>
        <span style={{ ...S.matchBadge, background: badge.bg, color: badge.color }}>
          {badge.label}
        </span>
      </div>

      {/* Titre + meta */}
      <div style={{ paddingRight: 60 }}>
        <div style={S.cardTitle}>{bourse.nom}</div>
        <div style={S.cardMeta}>
          <span style={S.metaTag}>📍 {bourse.pays || 'International'}</span>
          {bourse.niveau && <span style={S.metaTag}>🎓 {bourse.niveau}</span>}
          {expired && <span style={{ ...S.metaTag, background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>Session terminée</span>}
        </div>
      </div>

      {/* Financement */}
      {bourse.financement && (
        <div style={S.financing}>💰 {bourse.financement}</div>
      )}

      {/* Deadline — badge + date lisible */}
      <div style={S.deadlineRow}>
        <CountdownBadge dateLimite={bourse.dateLimite} />
        <span style={S.deadlineDate}>{formatDate(bourse.dateLimite)}</span>
      </div>

      {/* Raisons du match — filtrées et compactes */}
      {bourse.matchReasons?.length > 0 && (
        <div style={S.reasonsWrap}>
          {[...new Set(bourse.matchReasons)]
            .filter(r => !r.includes('jours restants') && !r.includes('Tous') && !r.includes('Niveau'))
            .slice(0, 2)
            .map((r, i) => <span key={i} style={S.reasonTag}>✓ {r}</span>)
          }
        </div>
      )}

      {/* Note expirée */}
      {expired && bourse.note && (
        <div style={S.expiredNote}>📌 {bourse.note}</div>
      )}

      {/* Actions */}
      <div style={S.cardActions}>
        {bourse.lienOfficiel && (
          <a href={bourse.lienOfficiel} target="_blank" rel="noopener noreferrer" style={S.btnLink}>
            🔗 Voir la bourse
          </a>
        )}
        <button
          style={{
            ...S.btnSave,
            background: saved ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)',
            color:      saved ? '#4ade80' : '#e2e8f0',
            cursor:     saved ? 'default' : 'pointer',
          }}
          onClick={() => !saved && onSave(bourse)}
          disabled={saved}
        >
          {saved ? '✅ Sauvegardée' : '+ Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

export default function RecommandationsPage({ user, handleQuickReply }) {
  const [loading,     setLoading]     = useState(false);
  const [actives,     setActives]     = useState([]);
  const [expirees,    setExpirees]    = useState([]);
  const [savedNoms,   setSavedNoms]   = useState(new Set());
  const [filter,      setFilter]      = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error,       setError]       = useState(null);

  const loadRecommandations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const resUser  = await fetch(`${API_BASE}/users/${user.id}?depth=0`);
      const userData = await resUser.json();

      // Charger les bourses déjà sauvegardées
      const nomsDejasSauvegardes = new Set(
        (userData.bourses_choisies || []).map(b => b.nom?.trim().toLowerCase())
      );
      setSavedNoms(nomsDejasSauvegardes);

      const profNiveau  = (userData.niveau       || userData.currentLevel || user.niveau       || user.currentLevel || '').toLowerCase().trim();
      const profDomaine = (userData.domaine       || userData.fieldOfStudy || user.domaine      || user.fieldOfStudy || '').toLowerCase().trim();
      const profPays    = (userData.pays          || user.pays             || '').toLowerCase().trim();

      const resBourses  = await fetch(`${API_BASE}/bourses?limit=200&depth=0`);
      const dataBourses = await resBourses.json();
      const bourses     = dataBourses.docs || [];

      const scored = bourses
        .filter(b => b.tunisienEligible !== 'non')
        .map(b => {
          let score = 0;
          const reasons = [];
          const bNiveau  = (b.niveau  || '').toLowerCase();
          const bDomaine = (b.domaine || '').toLowerCase();
          const bPays    = (b.pays    || '').toLowerCase();

          if (b.tunisienEligible === 'oui') { score += 30; reasons.push('Ouverte aux Tunisiens'); }

          if (profNiveau && bNiveau.includes(profNiveau)) {
            score += 25; reasons.push(`Niveau ${b.niveau} correspond`);
          } else if (bNiveau.includes('tous') || bNiveau === '') {
            score += 12; reasons.push('Tous niveaux acceptés');
          }

          if (profDomaine && bDomaine.includes(profDomaine)) {
            score += 20; reasons.push(`Domaine ${b.domaine} correspond`);
          } else if (bDomaine.includes('tous') || bDomaine === '') {
            score += 10; reasons.push('Tous domaines acceptés');
          }

          if (b.statut === 'active')  { score += 15; reasons.push('Candidatures ouvertes'); }
          if (b.statut === 'a_venir') { score += 8;  reasons.push('Bientôt disponible'); }

          if (b.dateLimite) {
            const jours = Math.floor((new Date(b.dateLimite) - new Date()) / 86400000);
            if (jours > 30) { score += 3; reasons.push(`${jours} jours restants`); }
          }

          if (profPays && (bPays.includes(profPays) || bPays.includes('international'))) {
            score += 2; reasons.push(`Disponible en ${b.pays}`);
          }

          return { ...b, matchScore: score, matchReasons: reasons };
        });

      const newActives = scored
        .filter(b => b.statut !== 'expiree' && b.matchScore > 25)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 8);

      const newExpirees = scored
        .filter(b => b.statut === 'expiree' && b.matchScore > 25)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 4)
        .map(b => ({ ...b, note: 'Session terminée — préparez votre dossier pour la prochaine ouverture' }));

      const activesFinales = newActives.length > 0
        ? newActives
        : bourses.filter(b => b.statut !== 'expiree').slice(0, 5)
            .map(b => ({ ...b, matchScore: 0, matchReasons: ['Bourse générale ouverte aux Tunisiens'] }));

      setActives(activesFinales);
      setExpirees(newExpirees);
      setLastUpdated(new Date());

    } catch (err) {
      setError('Impossible de charger les recommandations : ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSave = async (bourse) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id || savedNoms.has(nomKey)) return;
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}/bourses-choisies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom:      bourse.nom,
          pays:     bourse.pays         || '',
          url:      bourse.lienOfficiel || '',
          deadline: bourse.dateLimite   || '',
        }),
      });
      if (res.ok) {
        setSavedNoms(prev => new Set([...prev, nomKey]));
      }
    } catch(err) {
      console.error('[Save]', err);
    }
  };

  useEffect(() => { loadRecommandations(); }, [loadRecommandations]);

  const filtered =
    filter === 'actives'  ? actives  :
    filter === 'expirees' ? expirees :
    [...actives, ...expirees];

  if (!user) return (
    <div style={S.locked}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
      <h3 style={{ color: '#e2e8f0', marginBottom: 8 }}>Recommandations personnalisées</h3>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Connectez-vous pour voir vos bourses compatibles</p>
      <button style={S.lockBtn} onClick={() => handleQuickReply('Je veux me connecter')}>🔐 Se connecter</button>
    </div>
  );

  const profNiveau  = user.niveau  || user.currentLevel || '';
  const profDomaine = user.domaine || user.fieldOfStudy || '';

  return (
    <div style={S.page}>

      <div style={S.header}>
        <div>
          <h1 style={S.title}>🎯 Mes Recommandations</h1>
          <p style={S.subtitle}>
            {profNiveau || profDomaine
              ? `Profil : ${profNiveau}${profNiveau && profDomaine ? ' · ' : ''}${profDomaine}`
              : 'Complétez votre profil pour de meilleures recommandations'
            }
            {lastUpdated && (
              <span style={S.updated}> · Actualisé à {lastUpdated.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</span>
            )}
          </p>
        </div>
        <button style={S.refreshBtn} onClick={loadRecommandations} disabled={loading}>
          {loading ? '⏳' : '🔄'} Actualiser
        </button>
      </div>

      <div style={S.statsRow}>
        <div style={S.statCard}><div style={{ ...S.statNum, color:'#4ade80' }}>{actives.length}</div><div style={S.statLabel}>Bourses actives</div></div>
        <div style={S.statCard}><div style={{ ...S.statNum, color:'#f87171' }}>{expirees.length}</div><div style={S.statLabel}>À préparer</div></div>
        <div style={S.statCard}><div style={{ ...S.statNum, color:'#fbbf24' }}>{savedNoms.size}</div><div style={S.statLabel}>Sauvegardées</div></div>
        <div style={S.statCard}><div style={{ ...S.statNum, color:'#60a5fa' }}>{actives[0]?.matchScore || 0}</div><div style={S.statLabel}>Meilleur score</div></div>
      </div>

      <div style={S.filterRow}>
        {[
          { id: 'all',      label: `Toutes (${actives.length + expirees.length})` },
          { id: 'actives',  label: `✅ Actives (${actives.length})` },
          { id: 'expirees', label: `📅 À préparer (${expirees.length})` },
        ].map(f => (
          <button key={f.id}
            style={{ ...S.filterBtn, ...(filter === f.id ? S.filterOn : {}) }}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={S.loadingWrap}>
          <div style={S.spinner} />
          <p style={{ color:'#64748b', marginTop:16 }}>Analyse de votre profil en cours...</p>
        </div>
      )}

      {error && !loading && (
        <div style={S.errorBox}>
          ⚠️ {error}
          <button style={S.retryBtn} onClick={loadRecommandations}>Réessayer</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={S.emptyBox}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
          <p style={{ color:'#94a3b8', marginBottom:16 }}>Aucune bourse trouvée pour votre profil.</p>
          <button style={S.lockBtn} onClick={() => handleQuickReply('Je veux compléter mon profil')}>Compléter mon profil</button>
        </div>
      )}

      {!loading && !error && filter !== 'expirees' && actives.length > 0 && (
        <>
          <div style={S.sectionTitle}>
            <span style={{ color:'#4ade80' }}>●</span> Bourses disponibles maintenant
          </div>
          <div style={S.grid}>
            {actives.map(b => (
              <BourseCard
                key={b.id}
                bourse={b}
                onSave={handleSave}
                saved={savedNoms.has(b.nom?.trim().toLowerCase())}
                expired={false}
              />
            ))}
          </div>
        </>
      )}

      {!loading && !error && filter !== 'actives' && expirees.length > 0 && (
        <>
          <div style={{ ...S.sectionTitle, marginTop:32 }}>
            <span style={{ color:'#f87171' }}>●</span> À préparer pour la prochaine session
          </div>
          <div style={S.grid}>
            {expirees.map(b => (
              <BourseCard
                key={b.id}
                bourse={b}
                onSave={handleSave}
                saved={savedNoms.has(b.nom?.trim().toLowerCase())}
                expired={true}
              />
            ))}
          </div>
        </>
      )}

    </div>
  );
}

const S = {
  page:         { width:'100%', background:'#07070f', minHeight:'100vh', color:'#e2e8f0', fontFamily:'system-ui,sans-serif', paddingBottom:40 },
  locked:       { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, textAlign:'center', padding:32 },
  lockBtn:      { padding:'12px 28px', borderRadius:12, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'white', border:'none', fontSize:14, fontWeight:600, cursor:'pointer' },
  header:       { padding:'28px 28px 0', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 },
  title:        { fontSize:'1.6rem', fontWeight:800, color:'#f1f5f9', margin:0 },
  subtitle:     { fontSize:13, color:'#64748b', marginTop:6 },
  updated:      { color:'#475569' },
  refreshBtn:   { padding:'9px 18px', borderRadius:10, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#818cf8', fontSize:13, fontWeight:600, cursor:'pointer' },
  statsRow:     { display:'flex', gap:12, padding:'20px 28px 0', flexWrap:'wrap' },
  statCard:     { background:'#0d0d18', border:'1px solid #1e1e30', borderRadius:12, padding:'14px 20px', minWidth:100, textAlign:'center' },
  statNum:      { fontSize:'1.8rem', fontWeight:800 },
  statLabel:    { fontSize:11, color:'#64748b', marginTop:2, textTransform:'uppercase', letterSpacing:'0.05em' },
  filterRow:    { display:'flex', gap:8, padding:'18px 28px 0', flexWrap:'wrap' },
  filterBtn:    { padding:'7px 16px', borderRadius:20, border:'1px solid #2a2a3d', background:'transparent', color:'#64748b', fontSize:13, cursor:'pointer', transition:'all .2s' },
  filterOn:     { background:'rgba(99,102,241,0.2)', border:'1px solid #6366f1', color:'#a5b4fc' },
  grid:         { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16, padding:'16px 28px 0' },
  sectionTitle: { padding:'24px 28px 0', fontSize:13, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:8 },
  card:         { borderRadius:16, padding:20, display:'flex', flexDirection:'column', gap:10, position:'relative', overflow:'hidden' },
  scoreRingWrap:{ position:'absolute', top:14, right:14 },
  matchBadge:   { display:'inline-block', fontSize:11, padding:'3px 10px', borderRadius:10, fontWeight:600 },
  cardTitle:    { fontSize:'0.95rem', fontWeight:700, color:'#f1f5f9', lineHeight:1.4, marginTop:4 },
  cardMeta:     { display:'flex', gap:6, flexWrap:'wrap', marginTop:5 },
  metaTag:      { fontSize:11, padding:'2px 8px', borderRadius:8, background:'rgba(255,255,255,0.08)', color:'#94a3b8' },
  financing:    { fontSize:12, color:'#cbd5e1', background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'8px 12px', lineHeight:1.5 },
  deadlineRow:  { display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' },
  deadlineBadge:{ fontSize:12, padding:'4px 10px', borderRadius:8, fontWeight:600 },
  deadlineDate: { fontSize:12, color:'#94a3b8', fontWeight:500 },
  reasonsWrap:  { display:'flex', flexWrap:'wrap', gap:5 },
  reasonTag:    { fontSize:11, padding:'3px 8px', borderRadius:6, background:'rgba(255,255,255,0.07)', color:'#94a3b8' },
  expiredNote:  { fontSize:12, color:'#f87171', background:'rgba(239,68,68,0.1)', borderRadius:8, padding:'7px 10px' },
  cardActions:  { display:'flex', gap:8, marginTop:4 },
  btnLink:      { flex:1, padding:'8px 12px', borderRadius:9, background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc', fontSize:12, fontWeight:600, textDecoration:'none', textAlign:'center' },
  btnSave:      { flex:1, padding:'8px 12px', borderRadius:9, border:'1px solid rgba(255,255,255,0.1)', fontSize:12, fontWeight:600, transition:'all .2s' },
  loadingWrap:  { display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 20px' },
  spinner:      { width:40, height:40, borderRadius:'50%', border:'3px solid #1e1e30', borderTop:'3px solid #6366f1', animation:'spin 1s linear infinite' },
  errorBox:     { margin:'20px 28px', padding:'16px 20px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, color:'#f87171', fontSize:13, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 },
  retryBtn:     { padding:'6px 14px', borderRadius:8, background:'rgba(239,68,68,0.2)', border:'none', color:'#f87171', fontSize:12, cursor:'pointer' },
  emptyBox:     { display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 20px', gap:12 },
};