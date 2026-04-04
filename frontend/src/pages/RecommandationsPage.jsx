import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/config/axiosInstance';
import BourseDrawer from '../components/Boursedrawer';
import { API_ROUTES } from '@/config/routes';

function getScoreColor(score) {
  if (score >= 80) return '#166534';
  if (score >= 60) return '#1a3a6b';
  if (score >= 40) return '#d97706';
  return '#64748b';
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

function BourseCard({ bourse, onStar, onApply, starred, applied, expired, onClick }) {
  const score      = bourse.matchScore || 0;
  const scoreColor = getScoreColor(score);
  const [starLoading,  setStarLoading]  = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  const days    = getDaysLeft(bourse.dateLimite);
  const dateStr = formatDate(bourse.dateLimite);
  const deadlineColor = days === null ? '#64748b' : days < 0 ? '#dc2626' : days <= 30 ? '#d97706' : '#166534';
  const deadlineLabel = days === null ? null : days < 0 ? 'Expirée' : `${days} jours restants`;

  const niveaux = bourse.niveau ? bourse.niveau.split(',').map(s => s.trim()).filter(Boolean) : [];
  const reasons = [...new Set(bourse.matchReasons || [])]
    .filter(r => !r.includes('jours restants') && !r.includes('Tous'))
    .slice(0, 3);

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform .2s, box-shadow .2s',
      opacity: expired ? 0.85 : 1,
      boxShadow: '0 2px 6px rgba(26,58,107,0.06)',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(26,58,107,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 6px rgba(26,58,107,0.06)'; }}
      onClick={() => onClick && onClick(bourse)}
    >
      {/* Barre score */}
      <div style={{ height:4, background:`linear-gradient(90deg,${scoreColor}55,${scoreColor})`, width:'100%' }}/>

      {/* Header */}
      <div style={{ padding:'14px 16px 10px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
          <span style={{ fontSize:20, flexShrink:0 }}>{countryFlag(bourse.pays)}</span>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:11, color:'#64748b', fontWeight:500 }}>{bourse.pays || 'International'}</div>
            <div style={{ fontSize:'0.95rem', fontWeight:700, color:'#1a3a6b', lineHeight:1.3, marginTop:2 }}>{bourse.nom}</div>
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:'1.2rem', fontWeight:800, color:scoreColor, lineHeight:1 }}>{score}%</div>
          <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{getScoreLabel(score)}</div>
        </div>
      </div>

      <div style={{ height:1, background:'#f1f5f9', margin:'0 16px' }}/>

      {/* Body */}
      <div style={{ padding:'12px 16px', flex:1, display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
          {niveaux.map((n, i) => (
            <span key={i} style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontWeight:500 }}>{n}</span>
          ))}
          {reasons.map((r, i) => (
            <span key={i} style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534' }}>{r}</span>
          ))}
        </div>

        {bourse.financement && (
          <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
            <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>💰</span>
            <span style={{ fontSize:12, color:'#475569', lineHeight:1.5 }}>{bourse.financement}</span>
          </div>
        )}

        {(dateStr || deadlineLabel) && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:2, padding:'7px 10px', borderRadius:6, background:'#f8fafc', border:'1px solid #f1f5f9' }}>
            {dateStr && (
              <div>
                <div style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>Date limite</div>
                <div style={{ fontSize:12, color:deadlineColor, fontWeight:700 }}>{dateStr}</div>
              </div>
            )}
            {deadlineLabel && (
              <div style={{ fontSize:11, color:deadlineColor, fontWeight:600, padding:'2px 8px', borderRadius:4, background:deadlineColor+'12', border:`1px solid ${deadlineColor}30` }}>
                {deadlineLabel}
              </div>
            )}
          </div>
        )}

        {expired && (
          <div style={{ fontSize:11, color:'#d97706', background:'#fffbeb', borderRadius:6, padding:'5px 8px', border:'1px solid #fde68a' }}>
            📌 Session terminée — préparez la prochaine ouverture
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding:'10px 16px 14px', display:'flex', gap:8, borderTop:'1px solid #f1f5f9' }}>
        <button
          style={{
            flex:1, padding:'9px 12px', borderRadius:6,
            background: applied ? '#eff6ff' : '#1a3a6b',
            border: applied ? '1px solid #bfdbfe' : 'none',
            color: applied ? '#1a3a6b' : '#fff',
            fontSize:13, fontWeight:600, cursor: applied ? 'default' : 'pointer', transition:'all .2s',
          }}
          onClick={!applied ? async (e) => { e.stopPropagation(); setApplyLoading(true); await onApply(bourse); setApplyLoading(false); } : undefined}
          disabled={applied || applyLoading}
          onMouseEnter={e => { if (!applied) e.currentTarget.style.background='#0f2654'; }}
          onMouseLeave={e => { if (!applied) e.currentTarget.style.background='#1a3a6b'; }}
        >
          {applyLoading ? '⏳' : applied ? '✅ Dans la roadmap' : 'Postuler maintenant'}
        </button>

        <button
          style={{
            width:40, height:40, borderRadius:6, flexShrink:0,
            background: starred ? '#fefce8' : '#f8fafc',
            border: starred ? '1px solid #fde68a' : '1px solid #e2e8f0',
            color: starred ? '#d97706' : '#94a3b8',
            fontSize:18, cursor: starLoading ? 'default' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
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
          style={{ display:'block', textAlign:'center', padding:'0 16px 12px', fontSize:11, color:'#64748b', textDecoration:'none', borderTop:'none' }}
          onMouseEnter={e => e.currentTarget.style.color='#1a3a6b'}
          onMouseLeave={e => e.currentTarget.style.color='#64748b'}
          onClick={e => e.stopPropagation()}
        >
          🔗 Voir le site officiel
        </a>
      )}
    </div>
  );
}

export default function RecommandationsPage({ user, handleQuickReply, setView, onStarChange }) {
  const [loading,     setLoading]     = useState(false);
  const [actives,     setActives]     = useState([]);
  const [expirees,    setExpirees]    = useState([]);
  const [starredNoms, setStarredNoms] = useState(new Set());
  const [appliedNoms, setAppliedNoms] = useState(new Set());
  const [selected,    setSelected]    = useState(null);
  const [filter,      setFilter]      = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error,       setError]       = useState(null);

  const loadRecommandations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    try {
      const { data: userData } = await axiosInstance.get(`/api/users/${user.id}`, { params: { depth:0 } });
      const { data: dataFav }  = await axiosInstance.get('/api/favoris', {
        params: { 'where[user][equals]': user.id, limit:1, depth:0 },
      });
      const docFav     = dataFav.docs?.[0];
      const newStarred = new Set((docFav?.bourses || []).map(b => b.nom?.trim().toLowerCase()));
      setStarredNoms(newStarred);
      onStarChange?.(newStarred.size);

      const { data: dataRoadmap } = await axiosInstance.get(API_ROUTES.roadmap.list, {
        params: { 'where[userId][equals]': user.id, limit:100, depth:0 },
      });
      setAppliedNoms(new Set((dataRoadmap.docs || []).map(b => b.nom?.trim().toLowerCase())));

      const profNiveau  = (userData.niveau  || userData.currentLevel || user.niveau  || user.currentLevel || '').toLowerCase().trim();
      const profDomaine = (userData.domaine  || userData.fieldOfStudy || user.domaine || user.fieldOfStudy || '').toLowerCase().trim();
      const profPays    = (userData.pays     || user.pays    || '').toLowerCase().trim();

      const { data: dataBourses } = await axiosInstance.get(API_ROUTES.bourses.list, {
        params: { limit:200, depth:0 },
      });
      const bourses = dataBourses.docs || [];

      const scored = bourses.filter(b => b.tunisienEligible !== 'non').map(b => {
        let score = 0; const reasons = [];
        const bN = (b.niveau||'').toLowerCase(), bD = (b.domaine||'').toLowerCase(), bP = (b.pays||'').toLowerCase();
        if (b.tunisienEligible === 'oui')                  { score += 30; reasons.push('Ouverte aux Tunisiens'); }
        if (profNiveau && bN.includes(profNiveau))         { score += 25; reasons.push(`Niveau ${b.niveau} correspond`); }
        else if (bN.includes('tous') || bN === '')         { score += 12; reasons.push('Tous niveaux acceptés'); }
        if (profDomaine && bD.includes(profDomaine))       { score += 20; reasons.push(`Domaine ${b.domaine} correspond`); }
        else if (bD.includes('tous') || bD === '')         { score += 10; reasons.push('Tous domaines acceptés'); }
        if (b.statut === 'active')                         { score += 15; reasons.push('Candidatures ouvertes'); }
        if (b.statut === 'a_venir')                        { score += 8;  reasons.push('Bientôt disponible'); }
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
        params: { 'where[user][equals]': user.id, limit:1, depth:0 },
      });
      const doc = data.docs?.[0];
      if (isStarred) {
        if (!doc?.id) return;
        await axiosInstance.patch(`/api/favoris/${doc.id}`, { bourses: (doc.bourses||[]).filter(b => b.nom?.trim().toLowerCase() !== nomKey) });
        setStarredNoms(prev => { const s = new Set(prev); s.delete(nomKey); onStarChange?.(s.size); return s; });
      } else {
        const nb = { nom:bourse.nom, pays:bourse.pays||'', lienOfficiel:bourse.lienOfficiel||'', financement:bourse.financement||'', dateLimite:bourse.dateLimite||null, ajouteLe:new Date().toISOString() };
        if (doc?.id) await axiosInstance.patch(`/api/favoris/${doc.id}`, { bourses:[...(doc.bourses||[]), nb] });
        else await axiosInstance.post('/api/favoris', { user:user.id, userEmail:user.email||'', bourses:[nb] });
        setStarredNoms(prev => { const s = new Set([...prev, nomKey]); onStarChange?.(s.size); return s; });
      }
    } catch(err) { console.error('[Star]', err); }
  };

  const handleApply = async (bourse) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id || appliedNoms.has(nomKey)) return;
    try {
      await axiosInstance.post(API_ROUTES.roadmap.create, {
        userId:user.id, userEmail:user.email||'', nom:bourse.nom,
        pays:bourse.pays||'', lienOfficiel:bourse.lienOfficiel||'',
        financement:bourse.financement||'', dateLimite:bourse.dateLimite||null,
        ajouteLe:new Date().toISOString(), statut:'en_cours', etapeCourante:0,
      });
      setAppliedNoms(prev => new Set([...prev, nomKey]));
      setTimeout(() => setView?.('roadmap'), 1000);
    } catch(err) { console.error('[Apply]', err); }
  };

  useEffect(() => { loadRecommandations(); }, [loadRecommandations]);

  const filtered = filter === 'actives' ? actives : filter === 'expirees' ? expirees : [...actives, ...expirees];
  const profNiveau  = user?.niveau  || user?.currentLevel || '';
  const profDomaine = user?.domaine || user?.fieldOfStudy || '';

  if (!user) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, textAlign:'center', padding:32, background:'#f8f9fc' }}>
      <div style={{ fontSize:52, marginBottom:16 }}>🎯</div>
      <h3 style={{ color:'#1a3a6b', marginBottom:8, fontWeight:700 }}>Recommandations personnalisées</h3>
      <p style={{ color:'#64748b', marginBottom:24 }}>Connectez-vous pour voir vos bourses compatibles</p>
      <button style={{ padding:'12px 28px', borderRadius:6, background:'#1a3a6b', color:'white', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}
        onClick={() => handleQuickReply('Je veux me connecter')}>🔐 Se connecter</button>
    </div>
  );

  return (
    <div style={{ width:'100%', background:'#f8f9fc', minHeight:'100vh', fontFamily:"'Segoe UI',system-ui,sans-serif", paddingBottom:40 }}>

      {/* ── EN-TÊTE PAGE ── */}


      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 32px' }}>

        {/* ── STATS ── */}
        <div style={{ display:'flex', gap:12, padding:'20px 0 0', flexWrap:'wrap' }}>
          {[
            { num:actives.length,   color:'#166534', bg:'#f0fdf4', border:'#bbf7d0', label:'Actives'      },
            { num:expirees.length,  color:'#d97706', bg:'#fffbeb', border:'#fde68a', label:'À préparer'   },
            { num:starredNoms.size, color:'#d97706', bg:'#fefce8', border:'#fde68a', label:'★ Favoris'    },
            { num:appliedNoms.size, color:'#1a3a6b', bg:'#eff6ff', border:'#bfdbfe', label:'🗺️ Roadmap'  },
          ].map((s,i) => (
            <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:8, padding:'12px 20px', minWidth:80, textAlign:'center', boxShadow:'0 1px 4px rgba(26,58,107,0.06)' }}>
              <div style={{ fontSize:'1.6rem', fontWeight:800, color:s.color }}>{s.num}</div>
              <div style={{ fontSize:11, color:'#64748b', marginTop:2, textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── FILTRES ── */}
        <div style={{ display:'flex', gap:0, padding:'16px 0 0', flexWrap:'wrap', background:'#ffffff', borderRadius:8, border:'1px solid #e2e8f0', marginTop:16, overflow:'hidden', width:'fit-content' }}>
          {[
            { id:'all',      label:`Toutes (${actives.length+expirees.length})` },
            { id:'actives',  label:`✅ Actives (${actives.length})` },
            { id:'expirees', label:`📅 À préparer (${expirees.length})` },
          ].map((f, i) => (
            <button key={f.id}
              style={{
                padding:'9px 20px',
                border:'none',
                borderRight: i < 2 ? '1px solid #e2e8f0' : 'none',
                background: filter===f.id ? '#1a3a6b' : '#fff',
                color: filter===f.id ? '#fff' : '#64748b',
                fontSize:13, cursor:'pointer', fontWeight: filter===f.id ? 700 : 400,
                fontFamily:'inherit',
              }}
              onClick={() => setFilter(f.id)}
            >{f.label}</button>
          ))}
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 20px' }}>
            <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid #e2e8f0', borderTopColor:'#1a3a6b', animation:'spin 1s linear infinite' }}/>
            <p style={{ color:'#64748b', marginTop:16 }}>Analyse de votre profil en cours...</p>
          </div>
        )}

        {/* ── ERREUR ── */}
        {error && !loading && (
          <div style={{ margin:'20px 0', padding:'14px 18px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, color:'#dc2626', fontSize:13, display:'flex', justifyContent:'space-between', gap:12, alignItems:'center' }}>
            ⚠️ {error}
            <button style={{ padding:'6px 14px', borderRadius:6, background:'#dc2626', border:'none', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 }} onClick={loadRecommandations}>Réessayer</button>
          </div>
        )}

        {/* ── BOURSES ACTIVES ── */}
        {!loading && !error && filter !== 'expirees' && actives.length > 0 && (
          <>
            <div style={{ padding:'24px 0 12px', fontSize:11, fontWeight:700, color:'#1a3a6b', textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:8, borderBottom:'2px solid #f5a623', paddingBottom:8, marginTop:8 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#166534', display:'inline-block' }}/>
              Bourses disponibles maintenant
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16, paddingTop:16 }}>
              {actives.map(b => (
                <BourseCard key={b.id} bourse={b}
                  onStar={handleStar} onApply={handleApply}
                  starred={starredNoms.has(b.nom?.trim().toLowerCase())}
                  applied={appliedNoms.has(b.nom?.trim().toLowerCase())}
                  expired={false} onClick={bb => setSelected(bb)}
                />
              ))}
            </div>
          </>
        )}

        {/* ── BOURSES EXPIRÉES ── */}
        {!loading && !error && filter !== 'actives' && expirees.length > 0 && (
          <>
            <div style={{ padding:'24px 0 8px', fontSize:11, fontWeight:700, color:'#1a3a6b', textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:8, borderBottom:'2px solid #f5a623', marginTop:16 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#d97706', display:'inline-block' }}/>
              À préparer pour la prochaine session
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16, paddingTop:16 }}>
              {expirees.map(b => (
                <BourseCard key={b.id} bourse={b}
                  onStar={handleStar} onApply={handleApply}
                  starred={starredNoms.has(b.nom?.trim().toLowerCase())}
                  applied={appliedNoms.has(b.nom?.trim().toLowerCase())}
                  expired={true} onClick={bb => setSelected(bb)}
                />
              ))}
            </div>
          </>
        )}

        {/* ── VIDE ── */}
        {!loading && !error && actives.length === 0 && expirees.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📭</div>
            <div style={{ fontSize:16, fontWeight:700, color:'#1a3a6b', marginBottom:8 }}>Aucune recommandation</div>
            <p style={{ color:'#64748b', fontSize:13, marginBottom:20 }}>Complétez votre profil pour obtenir des recommandations personnalisées</p>
            <button style={{ padding:'10px 24px', borderRadius:6, background:'#1a3a6b', border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}
              onClick={() => setView?.('profil')}>Compléter mon profil</button>
          </div>
        )}
      </div>

      {/* ── DRAWER ── */}
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

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}