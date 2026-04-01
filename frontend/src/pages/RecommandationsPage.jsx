import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/config/axiosInstance';
import BourseDrawer from '../components/Boursedrawer';
import { API_ROUTES } from '@/config/routes';


function getScoreColor(score) {
  if (score >= 80) return '#4ade80';
  if (score >= 60) return '#60a5fa';
  if (score >= 40) return '#fbbf24';
  return '#c084fc';
}
function getScoreLabel(score) {
  if (score >= 80) return 'Excellent match';
  if (score >= 60) return 'Bon match';
  if (score >= 40) return 'Match partiel';
  return 'À explorer';
}
function getDaysLeft(d) {
  if (!d) return null;
  return Math.floor((new Date(d) - new Date()) / 86400000);
}
function formatDate(d) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }); }
  catch { return d; }
}
function countryFlag(pays) {
  const flags = {
    'France':'🇫🇷','Allemagne':'🇩🇪','Royaume-Uni':'🇬🇧','États-Unis':'🇺🇸',
    'Canada':'🇨🇦','Japon':'🇯🇵','Chine':'🇨🇳','Australie':'🇦🇺',
    'Suisse':'🇨🇭','Pays-Bas':'🇳🇱','Maroc':'🇲🇦','Hongrie':'🇭🇺',
    'Corée du Sud':'🇰🇷','Nouvelle-Zélande':'🇳🇿','Turquie':'🇹🇷',
    'Belgique':'🇧🇪','Espagne':'🇪🇸','Italie':'🇮🇹','Portugal':'🇵🇹',
  };
  const code = pays?.split('(')[1]?.replace(')','') || '';
  return flags[pays] || (code.length === 2 ? `${String.fromCodePoint(...[...code.toUpperCase()].map(c=>c.charCodeAt(0)+127397))}` : '🌍');
}

// ── Nouvelle BourseCard ───────────────────────────────────────────────────────
function BourseCard({ bourse, onStar, onApply, starred, applied, expired, onClick }) {
  const score      = bourse.matchScore || 0;
  const scoreColor = getScoreColor(score);
  const [starLoading,  setStarLoading]  = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  const days    = getDaysLeft(bourse.dateLimite);
  const dateStr = formatDate(bourse.dateLimite);

  const deadlineColor = days === null ? '#64748b' : days < 0 ? '#f87171' : days <= 30 ? '#f87171' : days <= 90 ? '#fbbf24' : '#4ade80';
  const deadlineLabel = days === null ? null : days < 0 ? 'Expirée' : `${days} jours restants`;

  const niveaux = bourse.niveau ? bourse.niveau.split(',').map(s => s.trim()).filter(Boolean) : [];
  const reasons = [...new Set(bourse.matchReasons || [])]
    .filter(r => !r.includes('jours restants') && !r.includes('Tous'))
    .slice(0, 3);

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #eef2ff',
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform .2s, box-shadow .2s',
      opacity: expired ? 0.85 : 1,
      position: 'relative',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 8px 20px rgba(16,24,40,0.08)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
      onClick={() => onClick && onClick(bourse)}
    >
      <div style={{ height: 4, background: `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})`, width: '100%' }} />

      <div style={{ padding: '14px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{countryFlag(bourse.pays)}</span>
          <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{bourse.pays || 'International'}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3, marginTop: 2 }}>{bourse.nom}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}%</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{getScoreLabel(score)}</div>
        </div>
      </div>

        <div style={{ height: 1, background: '#f3f4f6', margin: '0 16px' }} />

      <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {niveaux.map((n, i) => <span key={i} style={tag}>{n}</span>)}
          {reasons.map((r, i) => (
            <span key={i} style={{ ...tag, background: 'rgba(74,222,128,0.08)', color: '#4ade80', borderColor: 'rgba(74,222,128,0.15)' }}>{r}</span>
          ))}
        </div>

        {bourse.financement && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💰</span>
              <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{bourse.financement}</span>
            </div>
        )}

        {(dateStr || deadlineLabel) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
            {dateStr && (
              <div>
                <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Date limite</div>
                <div style={{ fontSize: 12, color: deadlineColor, fontWeight: 700 }}>{dateStr}</div>
              </div>
            )}
            {deadlineLabel && <div style={{ fontSize: 12, color: deadlineColor, fontWeight: 600, textAlign: 'right' }}>{deadlineLabel}</div>}
          </div>
        )}

        {expired && (
          <div style={{ fontSize: 11, color: '#f87171', background: 'rgba(239,68,68,0.08)', borderRadius: 6, padding: '5px 8px' }}>
            📌 Session terminée — préparez la prochaine ouverture
          </div>
        )}
      </div>

      <div style={{ padding: '10px 16px 14px', display: 'flex', gap: 8 }}>
        <button
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 10,
            background: applied ? '#eef2ff' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            border: applied ? '1px solid #c7d2fe' : 'none',
            color: applied ? '#4f46e5' : '#ffffff',
            fontSize: 13, fontWeight: 600, cursor: applied ? 'default' : 'pointer', transition: 'all .2s',
          }}
          onClick={!applied ? async (e) => { e.stopPropagation(); setApplyLoading(true); await onApply(bourse); setApplyLoading(false); } : undefined}
          disabled={applied || applyLoading}
          onMouseEnter={e => { if (!applied) e.currentTarget.style.filter='brightness(0.95)'; }}
          onMouseLeave={e => { if (!applied) e.currentTarget.style.filter='none'; }}
        >
          {applyLoading ? '⏳' : applied ? '✅ Dans la roadmap' : 'Postuler maintenant'}
        </button>

        <button
          style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: '#ffffff',
            border: starred ? '1px solid #fef3c7' : '1px solid #eef2ff',
            color: starred ? '#b45309' : '#6b7280',
            fontSize: 18, cursor: starLoading ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
          }}
          onClick={async (e) => { e.stopPropagation(); setStarLoading(true); await onStar(bourse, starred); setStarLoading(false); }}
          disabled={starLoading}
          title={starred ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          {starred ? '★' : '☆'}
        </button>
      </div>

      {bourse.lienOfficiel && (
        <a href={bourse.lienOfficiel} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', padding: '0 16px 12px', fontSize: 11, color: '#475569', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color='#818cf8'}
          onMouseLeave={e => e.currentTarget.style.color='#475569'}
        >
          🔗 Voir le site officiel
        </a>
      )}
    </div>
  );
}

const tag = {
  fontSize: 11, padding: '2px 8px', borderRadius: 6,
  background: '#f8fafc', border: '1px solid #eef2ff',
  color: '#374151',
};

// ── Page principale ───────────────────────────────────────────────────────────
export default function RecommandationsPage({ user, handleQuickReply, setView, onStarChange }) {
  const [loading,     setLoading]     = useState(false);
  const [actives,     setActives]     = useState([]);
  const [expirees,    setExpirees]    = useState([]);
  const [starredNoms, setStarredNoms] = useState(new Set());
  const [appliedNoms, setAppliedNoms] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [filter,      setFilter]      = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error,       setError]       = useState(null);

  const loadRecommandations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Données utilisateur
      const { data: userData } = await axiosInstance.get(`/api/users/${user.id}`, { params: { depth: 0 } });

      // 2. Favoris
      const { data: dataFav } = await axiosInstance.get('/api/favoris', {
        params: { 'where[user][equals]': user.id, limit: 1, depth: 0 },
      });
      const docFav     = dataFav.docs?.[0];
      const newStarred = new Set((docFav?.bourses || []).map(b => b.nom?.trim().toLowerCase()));
      setStarredNoms(newStarred);
      onStarChange?.(newStarred.size);

      // 3. Roadmap
      const { data: dataRoadmap } = await axiosInstance.get(API_ROUTES.roadmap.list, {
        params: { 'where[userId][equals]': user.id, limit: 100, depth: 0 },
      });
      setAppliedNoms(new Set((dataRoadmap.docs || []).map(b => b.nom?.trim().toLowerCase())));

      // 4. Profil
      const profNiveau  = (userData.niveau  || userData.currentLevel || user.niveau  || user.currentLevel || '').toLowerCase().trim();
      const profDomaine = (userData.domaine  || userData.fieldOfStudy || user.domaine || user.fieldOfStudy || '').toLowerCase().trim();
      const profPays    = (userData.pays     || user.pays    || '').toLowerCase().trim();

      // 5. Bourses
      const { data: dataBourses } = await axiosInstance.get(API_ROUTES.bourses.list, {
        params: { limit: 200, depth: 0 },
      });
      const bourses = dataBourses.docs || [];

      // 6. Scoring
      const scored = bourses.filter(b => b.tunisienEligible !== 'non').map(b => {
        let score = 0; const reasons = [];
        const bN = (b.niveau||'').toLowerCase(), bD = (b.domaine||'').toLowerCase(), bP = (b.pays||'').toLowerCase();
        if (b.tunisienEligible === 'oui')                        { score += 30; reasons.push('Ouverte aux Tunisiens'); }
        if (profNiveau && bN.includes(profNiveau))               { score += 25; reasons.push(`Niveau ${b.niveau} correspond`); }
        else if (bN.includes('tous') || bN === '')               { score += 12; reasons.push('Tous niveaux acceptés'); }
        if (profDomaine && bD.includes(profDomaine))             { score += 20; reasons.push(`Domaine ${b.domaine} correspond`); }
        else if (bD.includes('tous') || bD === '')               { score += 10; reasons.push('Tous domaines acceptés'); }
        if (b.statut === 'active')                               { score += 15; reasons.push('Candidatures ouvertes'); }
        if (b.statut === 'a_venir')                              { score += 8;  reasons.push('Bientôt disponible'); }
        if (b.dateLimite) {
          const j = Math.floor((new Date(b.dateLimite) - new Date()) / 86400000);
          if (j > 30) score += 3;
        }
        if (profPays && (bP.includes(profPays) || bP.includes('international'))) score += 2;
        return { ...b, matchScore: score, matchReasons: reasons };
      });

      const newActives  = scored.filter(b => b.statut !== 'expiree' && b.matchScore > 25).sort((a,b) => b.matchScore-a.matchScore).slice(0,8);
      const newExpirees = scored.filter(b => b.statut === 'expiree'  && b.matchScore > 25).sort((a,b) => b.matchScore-a.matchScore).slice(0,4);
      const activesFinales = newActives.length > 0
        ? newActives
        : bourses.filter(b => b.statut !== 'expiree').slice(0,5).map(b => ({ ...b, matchScore:0, matchReasons:[] }));

      setActives(activesFinales);
      setExpirees(newExpirees);
      setLastUpdated(new Date());
    } catch(err) {
      setError('Impossible de charger les recommandations : ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleStar = async (bourse, isStarred) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id) return;
    try {
      const { data } = await axiosInstance.get('/api/favoris', {
        params: { 'where[user][equals]': user.id, limit: 1, depth: 0 },
      });
      const doc = data.docs?.[0];

      if (isStarred) {
        if (!doc?.id) return;
        const newBourses = (doc.bourses || []).filter(b => b.nom?.trim().toLowerCase() !== nomKey);
        await axiosInstance.patch(`/api/favoris/${doc.id}`, { bourses: newBourses });
        setStarredNoms(prev => { const s = new Set(prev); s.delete(nomKey); onStarChange?.(s.size); return s; });
      } else {
        const nouvelleBourse = {
          nom:          bourse.nom,
          pays:         bourse.pays          || '',
          lienOfficiel: bourse.lienOfficiel  || '',
          financement:  bourse.financement   || '',
          dateLimite:   bourse.dateLimite    || null,
          ajouteLe:     new Date().toISOString(),
        };
        if (doc?.id) {
          await axiosInstance.patch(`/api/favoris/${doc.id}`, {
            bourses: [...(doc.bourses || []), nouvelleBourse],
          });
        } else {
          await axiosInstance.post('/api/favoris', {
            user: user.id, userEmail: user.email || '', bourses: [nouvelleBourse],
          });
        }
        setStarredNoms(prev => { const s = new Set([...prev, nomKey]); onStarChange?.(s.size); return s; });
      }
    } catch(err) { console.error('[Star]', err); }
  };

  const handleApply = async (bourse) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id || appliedNoms.has(nomKey)) return;
    try {
      await axiosInstance.post(API_ROUTES.roadmap.create, {
        userId:       user.id,
        userEmail:    user.email       || '',
        nom:          bourse.nom,
        pays:         bourse.pays      || '',
        lienOfficiel: bourse.lienOfficiel || '',
        financement:  bourse.financement  || '',
        dateLimite:   bourse.dateLimite   || null,
        ajouteLe:     new Date().toISOString(),
        statut:       'en_cours',
        etapeCourante: 0,
      });
      setAppliedNoms(prev => new Set([...prev, nomKey]));
      setTimeout(() => setView?.('roadmap'), 1000);
    } catch(err) { console.error('[Apply]', err); }
  };

  useEffect(() => { loadRecommandations(); }, [loadRecommandations]);

  const filtered = filter === 'actives' ? actives : filter === 'expirees' ? expirees : [...actives, ...expirees];

  if (!user) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, textAlign:'center', padding:32 }}>
      <div style={{ fontSize:52, marginBottom:16 }}>🎯</div>
      <h3 style={{ color:'#e2e8f0', marginBottom:8 }}>Recommandations personnalisées</h3>
      <p style={{ color:'#64748b', marginBottom:24 }}>Connectez-vous pour voir vos bourses compatibles</p>
      <button style={{ padding:'12px 28px', borderRadius:12, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'white', border:'none', fontSize:14, fontWeight:600, cursor:'pointer' }}
        onClick={() => handleQuickReply('Je veux me connecter')}>🔐 Se connecter</button>
    </div>
  );

  const profNiveau  = user.niveau  || user.currentLevel || '';
  const profDomaine = user.domaine || user.fieldOfStudy || '';

  return (
    <div style={{ width:'100%', background: 'transparent', minHeight:'100vh', color: '#111827', fontFamily:"'Outfit', system-ui, sans-serif", paddingBottom:40 }}>

      {/* Header */}
      <div style={{ padding:'28px 28px 0', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800, color:'#f1f5f9', margin:0 }}>🎯 Mes Recommandations</h1>
          <p style={{ fontSize:13, color:'#64748b', marginTop:6 }}>
            {profNiveau || profDomaine ? `Profil : ${profNiveau}${profNiveau && profDomaine ? ' · ' : ''}${profDomaine}` : 'Complétez votre profil'}
            {lastUpdated && <span style={{ color:'#475569' }}> · {lastUpdated.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>}
          </p>
        </div>
        <button
          style={{ padding:'9px 18px', borderRadius:10, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#818cf8', fontSize:13, fontWeight:600, cursor:'pointer' }}
          onClick={loadRecommandations} disabled={loading}>
          {loading ? '⏳' : '🔄'} Actualiser
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'flex', gap:12, padding:'20px 28px 0', flexWrap:'wrap' }}>
        {[
          { num: actives.length,    color:'#16a34a', label:'Actives' },
          { num: expirees.length,   color:'#ef4444', label:'À préparer' },
          { num: starredNoms.size,  color:'#f59e0b', label:'★ Favoris' },
          { num: appliedNoms.size,  color:'#0ea5e9', label:'🗺️ Roadmap' },
        ].map((s,i) => (
          <div key={i} style={{ background:'#ffffff', border:'1px solid #eef2ff', borderRadius:12, padding:'12px 18px', minWidth:80, textAlign:'center' }}>
            <div style={{ fontSize:'1.6rem', fontWeight:800, color:s.color }}>{s.num}</div>
            <div style={{ fontSize:11, color:'#6b7280', marginTop:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, padding:'16px 28px 0', flexWrap:'wrap' }}>
        {[
          { id:'all',      label:`Toutes (${actives.length+expirees.length})` },
          { id:'actives',  label:`✅ Actives (${actives.length})` },
          { id:'expirees', label:`📅 À préparer (${expirees.length})` },
        ].map(f => (
          <button key={f.id}
            style={{ padding:'7px 16px', borderRadius:20, border: filter===f.id ? '1px solid #6366f1' : '1px solid #2a2a3d', background: filter===f.id ? 'rgba(99,102,241,0.2)' : 'transparent', color: filter===f.id ? '#a5b4fc' : '#64748b', fontSize:13, cursor:'pointer', transition:'all .2s' }}
            onClick={() => setFilter(f.id)}
          >{f.label}</button>
        ))}
      </div>

      {loading && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 20px' }}>
          <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid #1e1e30', borderTop:'3px solid #6366f1', animation:'spin 1s linear infinite' }}/>
          <p style={{ color:'#64748b', marginTop:16 }}>Analyse en cours...</p>
        </div>
      )}

      {error && !loading && (
        <div style={{ margin:'20px 28px', padding:'16px 20px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, color:'#f87171', fontSize:13, display:'flex', justifyContent:'space-between', gap:12 }}>
          ⚠️ {error}
          <button style={{ padding:'6px 14px', borderRadius:8, background:'rgba(239,68,68,0.2)', border:'none', color:'#f87171', fontSize:12, cursor:'pointer' }} onClick={loadRecommandations}>Réessayer</button>
        </div>
      )}

      {!loading && !error && filter !== 'expirees' && actives.length > 0 && (
        <>
          <div style={{ padding:'20px 28px 0', fontSize:12, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ color:'#4ade80' }}>●</span> Bourses disponibles maintenant
          </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16, padding:'12px 28px 0' }}>
                {actives.map(b => (
                  <BourseCard
                    key={b.id}
                    bourse={b}
                    onStar={handleStar}
                    onApply={handleApply}
                    starred={starredNoms.has(b.nom?.trim().toLowerCase())}
                    applied={appliedNoms.has(b.nom?.trim().toLowerCase())}
                    expired={false}
                    onClick={(bb) => setSelected(bb)}
                  />
                ))}
              </div>
        </>
      )}

      {!loading && !error && filter !== 'actives' && expirees.length > 0 && (
        <>
          <div style={{ padding:'24px 28px 0', fontSize:12, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ color:'#f87171' }}>●</span> À préparer pour la prochaine session
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16, padding:'12px 28px 0' }}>
            {expirees.map(b => (
              <BourseCard
                key={b.id}
                bourse={b}
                onStar={handleStar}
                onApply={handleApply}
                starred={starredNoms.has(b.nom?.trim().toLowerCase())}
                applied={appliedNoms.has(b.nom?.trim().toLowerCase())}
                expired={true}
                onClick={(bb) => setSelected(bb)}
              />
            ))}
          </div>
        </>
      )}

      {/* Drawer details (same as BoursesPage) */}
      {selected && (
        <BourseDrawer
          bourse={selected}
          onClose={() => setSelected(null)}
          onAskAI={(b) => { handleQuickReply('Donne-moi les détails sur "' + b.nom + '"'); setSelected(null); }}
          onChoose={(b) => handleQuickReply('je choisis ' + b.nom)}
          applied={appliedNoms.has(selected.nom?.trim().toLowerCase())}
          onApply={async (b) => { await handleApply(b); setSelected(null); }}
          starred={starredNoms.has(selected.nom?.trim().toLowerCase())}
          onStar={async (b, isStarred) => { await handleStar(b, isStarred); }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}