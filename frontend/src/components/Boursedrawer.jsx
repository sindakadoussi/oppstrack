import React, { useState } from 'react';
import MatchDrawerIA from './MatchDrawerIA';
const countryFlag = (pays) => {
  const flags = {
    'France':'🇫🇷','Allemagne':'🇩🇪','Royaume-Uni':'🇬🇧','États-Unis':'🇺🇸',
    'Canada':'🇨🇦','Japon':'🇯🇵','Chine':'🇨🇳','Australie':'🇦🇺',
    'Suisse':'🇨🇭','Pays-Bas':'🇳🇱','Maroc':'🇲🇦','Hongrie':'🇭🇺',
    'Corée du Sud':'🇰🇷','Nouvelle-Zélande':'🇳🇿','Turquie':'🇹🇷',
    'Belgique':'🇧🇪','Espagne':'🇪🇸','Italie':'🇮🇹','Portugal':'🇵🇹',
    'Roumanie':'🇷🇴','Arabie Saoudite':'🇸🇦','Brunei':'🇧🇳',
    'Tunisie':'🇹🇳','Algérie':'🇩🇿','Égypte':'🇪🇬',
  };
  return flags[pays] || '🌍';
};

const calcMatch = (bourse, user) => {
  if (!bourse || !user) return null;
  let score = 0, total = 0;

  // 1. Éligibilité Tunisienne (20 pts)
  if (bourse.tunisienEligible) {
    total += 20;
    const eligible = String(bourse.tunisienEligible).toLowerCase().trim();
    const userIsTunisian =
      (user.nationality || user.pays || '').toLowerCase().includes('tunisie') ||
      (user.countryOfResidence || '').toLowerCase().includes('tunisie') ||
      (user.pays || '').toLowerCase().includes('tunisie');
    if (eligible === 'oui' || eligible === 'inconnu') score += 20;
    else if (eligible === 'non' && !userIsTunisian) score += 15;
  }

  // 2. Pays (25 pts)
  if (user.pays || user.nationality || user.countryOfResidence || user.targetCountries?.length > 0) {
    total += 25;
    const bp = String(bourse.pays || '').toLowerCase().trim();
    const userPaysList = [
      user.pays, user.nationality, user.countryOfResidence,
      ...(user.targetCountries || []).map(t => t.country),
    ].filter(Boolean).map(p => p.toLowerCase().trim());

    const isInternational =
      bp.includes('international') || bp.includes('tous pays') ||
      bp.includes('any country')   || bp.includes('monde') || bp === '';

    const matchPays = userPaysList.some(up =>
      bp === up || bp.includes(up) || up.includes(bp) || isInternational
    );
    if (matchPays) score += 25;
    else if (isInternational) score += 18;
  }

  // 3. Niveau (30 pts)
  if (user.niveau || user.currentLevel || user.targetDegree) {
    total += 30;
    const bn = String(bourse.niveau || bourse.eligibilite?.niveauRequis || '').toLowerCase();
    const userLevels = [user.niveau, user.currentLevel, user.targetDegree]
      .filter(Boolean).map(l => l.toLowerCase().trim());
    const baseLevels = userLevels.map(l => l.replace(/\s*\d+$/, '').trim());
    const allUserLevels = [...userLevels, ...baseLevels];

    const matchNiveau = allUserLevels.some(level =>
      bn.includes(level) ||
      (level.includes('master')   && bn.includes('master'))  ||
      (level.includes('licence')  && (bn.includes('licence') || bn.includes('bachelor') || bn.includes('undergraduate'))) ||
      (level.includes('doctorat') && (bn.includes('doctorat') || bn.includes('phd') || bn.includes('doctoral'))) ||
      bn.includes('tous niveaux') || bn.includes('any level')
    );
    if (matchNiveau) score += 30;
  }

  // 4. Domaine (25 pts)
  if (user.domaine || user.fieldOfStudy || user.targetFields?.length > 0) {
    total += 25;
    const bd = String(bourse.domaine || '').toLowerCase();
    const desc = String(bourse.description || '').toLowerCase();
    const conditions = String(bourse.eligibilite?.conditionsSpeciales || '').toLowerCase();
    const userDomains = [
      user.domaine, user.fieldOfStudy,
      ...(user.targetFields || []).map(f => f.field),
    ].filter(Boolean).map(d => d.toLowerCase().trim());

    let domainPoints = 0;
    for (const ud of userDomains) {
      if (bd.includes(ud) || ud.includes(bd) || desc.includes(ud) || conditions.includes(ud)) {
        domainPoints = 25; break;
      }
      const words = ud.split(/\s+/).filter(w => w.length > 3);
      if (words.some(w => bd.includes(w) || desc.includes(w) || conditions.includes(w))) {
        domainPoints = Math.max(domainPoints, 14);
      }
    }
    score += domainPoints;
  }

  // 5. Langue (10 pts bonus)
  if (bourse.langue && user.languages?.length > 0) {
    total += 10;
    const bl = String(bourse.langue).toLowerCase().trim();
    const userLangs = user.languages.map(l => String(l.language || '').toLowerCase().trim()).filter(Boolean);
    const matchLangue = userLangs.some(ul =>
      bl.includes(ul) || ul.includes(bl) ||
      (bl === 'anglais' && ul.includes('english')) ||
      (bl === 'français' && ul.includes('french'))
    );
    if (matchLangue) score += 10;
  }

  if (total === 0) return null;
  return Math.min(100, Math.round((score / total) * 100));
};

// Calcul détaillé pour le MatchDrawer
const calcMatchDetails = (bourse, user) => {
  if (!bourse || !user) return null;

  const details = [];
  let totalScore = 0, totalMax = 0;

  // 1. Éligibilité Tunisienne
  {
    const max = 20;
    const eligible = String(bourse.tunisienEligible || '').toLowerCase().trim();
    const userIsTunisian =
      (user.nationality || '').toLowerCase().includes('tunisie') ||
      (user.pays || '').toLowerCase().includes('tunisie') ||
      (user.countryOfResidence || '').toLowerCase().includes('tunisie');
    let pts = 0;
    if (eligible === 'oui' || eligible === 'inconnu') pts = 20;
    else if (eligible === 'non' && !userIsTunisian) pts = 15;
    totalMax += max; totalScore += pts;
    details.push({
      label: 'Éligibilité tunisienne', icon: '🇹🇳', points: pts, max,
      matched: pts > 0, isBonus: true,
      userVal: userIsTunisian ? 'Tunisien(ne)' : (user.nationality || '—'),
      bourseVal: eligible === 'oui' ? 'Oui' : eligible === 'non' ? 'Non' : 'Non précisé',
      reason: pts > 0
        ? (eligible === 'oui' ? 'Bourse ouverte aux Tunisiens ✓'
           : eligible === 'inconnu' ? 'Éligibilité non précisée — score attribué par défaut'
           : 'Non tunisien(ne) + bourse fermée → points attribués quand même')
        : 'Tunisien(ne) mais bourse fermée aux Tunisiens',
    });
  }

  // 2. Pays
  {
    const max = 25;
    const bp = String(bourse.pays || '').toLowerCase().trim();
    const userPaysList = [
      user.pays, user.nationality, user.countryOfResidence,
      ...(user.targetCountries || []).map(t => t.country),
    ].filter(Boolean).map(p => p.toLowerCase().trim());

    const isInternational = bp.includes('international') || bp.includes('tous pays') || bp === '';
    const matchPays = userPaysList.some(up => bp === up || bp.includes(up) || up.includes(bp));
    let pts = 0;
    if (matchPays) pts = 25;
    else if (isInternational) pts = 18;
    totalMax += max; totalScore += pts;
    details.push({
      label: 'Pays / Destination', icon: '📍', points: pts, max,
      matched: pts > 0,
      userVal: userPaysList.join(', ') || '—',
      bourseVal: bourse.pays || 'International',
      reason: matchPays
        ? `"${userPaysList[0]}" correspond à "${bourse.pays}" ✓`
        : isInternational
          ? `Bourse internationale → ouverte à tous les pays (+${pts} pts)`
          : `Aucun de vos pays cibles ne correspond à "${bourse.pays}"`,
    });
  }

  // 3. Niveau
  {
    const max = 30;
    const bn = String(bourse.niveau || bourse.eligibilite?.niveauRequis || '').toLowerCase();
    const userLevels = [user.niveau, user.currentLevel, user.targetDegree]
      .filter(Boolean).map(l => l.toLowerCase().trim());
    const baseLevels = userLevels.map(l => l.replace(/\s*\d+$/, '').trim());
    const allUserLevels = [...new Set([...userLevels, ...baseLevels])];
    const matchNiveau = allUserLevels.some(level =>
      bn.includes(level) ||
      (level.includes('master')   && bn.includes('master'))  ||
      (level.includes('licence')  && (bn.includes('licence') || bn.includes('bachelor'))) ||
      (level.includes('doctorat') && (bn.includes('doctorat') || bn.includes('phd'))) ||
      bn.includes('tous niveaux') || bn.includes('any level')
    );
    const pts = matchNiveau ? 30 : 0;
    totalMax += max; totalScore += pts;
    details.push({
      label: "Niveau d'études", icon: '🎓', points: pts, max,
      matched: matchNiveau,
      userVal: userLevels.join(', ') || '—',
      bourseVal: bourse.niveau || '—',
      reason: matchNiveau
        ? `"${userLevels[0]}" correspond à "${bourse.niveau}" ✓`
        : `"${userLevels[0] || '?'}" ne correspond pas à "${bourse.niveau || '?'}"`,
    });
  }

  // 4. Domaine
  {
    const max = 25;
    const bd = String(bourse.domaine || '').toLowerCase();
    const desc = String(bourse.description || '').toLowerCase();
    const userDomains = [
      user.domaine, user.fieldOfStudy,
      ...(user.targetFields || []).map(f => f.field),
    ].filter(Boolean).map(d => d.toLowerCase().trim());

    let pts = 0, matchedDomain = '';
    for (const ud of userDomains) {
      if (bd.includes(ud) || ud.includes(bd) || desc.includes(ud)) { pts = 25; matchedDomain = ud; break; }
      const words = ud.split(/\s+/).filter(w => w.length > 3);
      if (words.some(w => bd.includes(w) || desc.includes(w))) {
        pts = Math.max(pts, 14); matchedDomain = ud;
      }
    }
    totalMax += max; totalScore += pts;
    details.push({
      label: "Domaine d'études", icon: '📚', points: pts, max,
      matched: pts > 0,
      userVal: userDomains.join(', ') || '—',
      bourseVal: bourse.domaine || 'Tous domaines',
      reason: pts === 25
        ? `"${matchedDomain}" correspond exactement au domaine de la bourse ✓`
        : pts === 14
          ? `Correspondance partielle avec "${matchedDomain}"`
          : `Aucun de vos domaines ne correspond à "${bourse.domaine || 'Tous domaines'}"`,
    });
  }

  // 5. Langue
  if (bourse.langue) {
    const max = 10;
    const bl = String(bourse.langue).toLowerCase();
    const userLangs = (user.languages || []).map(l => String(l.language || '').toLowerCase()).filter(Boolean);
    const matchLangue = userLangs.some(ul =>
      bl.includes(ul) || ul.includes(bl) ||
      (bl === 'anglais' && ul.includes('english')) ||
      (bl === 'français' && ul.includes('french'))
    );
    const pts = matchLangue ? 10 : 0;
    totalMax += max; totalScore += pts;
    details.push({
      label: 'Langue', icon: '🗣️', points: pts, max,
      matched: matchLangue, isBonus: true,
      userVal: userLangs.join(', ') || '—',
      bourseVal: bourse.langue,
      reason: matchLangue
        ? `Vous maîtrisez "${bl}" ✓`
        : `Langue requise "${bl}" non trouvée dans votre profil`,
    });
  }

  const pct = totalMax > 0 ? Math.min(100, Math.round((totalScore / totalMax) * 100)) : 0;
  return { score: totalScore, total: totalMax, pct, details };
};

const getScoreColor = (score) => {
  if (score === null) return '#64748b';
  if (score >= 85) return '#16a34a';
  if (score >= 65) return '#eab308';
  if (score >= 45) return '#f97316';
  return '#ef4444';
};

const getScoreLabel = (score) => {
  if (score === null) return null;
  if (score >= 85) return 'Excellent match';
  if (score >= 65) return 'Très bon match';
  if (score >= 45) return 'Match correct';
  return 'Match partiel';
};


const daysLeft = (deadline) => {
  if (!deadline) return null;
  const diff = Math.round((new Date(deadline) - new Date()) / (1000*60*60*24));
  if (diff < 0)   return { label:'Expirée',      color:'#dc2626' };
  if (diff === 0) return { label:"Aujourd'hui !", color:'#dc2626' };
  if (diff <= 30) return { label:`${diff} jours`, color:'#d97706' };
  return               { label:`${diff} jours`,   color:'#16a34a' };
};

const D = {
  tag:      { fontSize:11, padding:'3px 10px', borderRadius:4, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b' },
  tagLight: { fontSize:11, padding:'3px 10px', borderRadius:4, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff' },
  label:    { fontSize:10, fontWeight:700, color:'#1a3a6b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10, paddingBottom:6, borderBottom:'2px solid #f5a623', display:'inline-block' },
  infoRow:  { display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', borderRadius:6, background:'#f8fafc', border:'1px solid #e2e8f0' },
  infoIcon: { fontSize:16, flexShrink:0, marginTop:2, color:'#1a3a6b' },
};

// ── MatchDrawer ───────────────────────────────────────────────────────────────
function MatchDrawer({ bourse, user, onBack }) {
  const match = calcMatchDetails(bourse, user);
  const scoreColor = match ? getScoreColor(match.pct) : '#94a3b8';

  return (
    <div style={{ position:'fixed', top:0, right:0, bottom:0, zIndex:902, width:500, maxWidth:'95vw', background:'#ffffff', borderLeft:'3px solid #1a3a6b', display:'flex', flexDirection:'column', animation:'slideIn 0.2s ease', overflowY:'auto', boxShadow:'-8px 0 32px rgba(26,58,107,0.2)' }}>

      {/* Header */}
      <div style={{ padding:'16px 22px', background:'#1a3a6b', flexShrink:0, display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', width:34, height:34, borderRadius:8, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Logique du match</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{bourse.nom}</div>
        </div>
        {match && (
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{ fontSize:28, fontWeight:800, color:'#f5a623', lineHeight:1 }}>{match.pct}%</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', marginTop:2 }}>match</div>
          </div>
        )}
      </div>

      {/* Score ring */}
      {match && (
        <div style={{ padding:'24px 22px 16px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ position:'relative', width:96, height:96, flexShrink:0 }}>
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#e2e8f0" strokeWidth="9"/>
              <circle cx="48" cy="48" r="40" fill="none" stroke={scoreColor} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${match.pct * 2.513} 251.3`} transform="rotate(-90 48 48)"
                style={{ transition:'stroke-dasharray 0.8s ease' }}/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:20, fontWeight:800, color:scoreColor, lineHeight:1 }}>{match.pct}%</span>
              <span style={{ fontSize:9, color:'#94a3b8', marginTop:2 }}>match</span>
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#1a3a6b', marginBottom:4 }}>
              {match.pct >= 85 ? '🎉 Excellent match !'
               : match.pct >= 65 ? '👍 Très bon match'
               : match.pct >= 45 ? '⚠️ Match correct'
               : '❌ Match partiel'}
            </div>
            <div style={{ fontSize:12, color:'#64748b', lineHeight:1.6 }}>
              Score : <strong>{match.score}</strong> / <strong>{match.total}</strong> pts<br/>
              {match.details.filter(d => d.matched && !d.isBonus).length} critère{match.details.filter(d => d.matched && !d.isBonus).length > 1 ? 's' : ''} principal{match.details.filter(d => d.matched && !d.isBonus).length > 1 ? 'ux' : ''} correspondent
            </div>
          </div>
        </div>
      )}

      {/* Critères */}
      <div style={{ padding:'16px 22px', flex:1 }}>
        {!match ? (
          <div style={{ textAlign:'center', color:'#64748b', padding:'40px 0' }}>Connectez-vous pour voir votre score.</div>
        ) : (
          <>
            <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>Analyse critère par critère</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {match.details.map((d, i) => (
                <div key={i} style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${d.matched ? '#bbf7d0' : '#fee2e2'}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background: d.matched ? '#f0fdf4' : '#fef2f2' }}>
                    <span style={{ fontSize:18 }}>{d.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#1a3a6b' }}>
                        {d.label}
                        {d.isBonus && <span style={{ fontSize:10, marginLeft:6, color:'#d97706', background:'#fefce8', padding:'1px 6px', borderRadius:99, border:'1px solid #fde68a' }}>Bonus</span>}
                      </div>
                    </div>
                    <div style={{ padding:'4px 10px', borderRadius:99, flexShrink:0, background: d.matched ? '#16a34a' : '#dc2626', color:'#fff', fontSize:12, fontWeight:800 }}>
                      {d.matched ? '+' : ''}{d.points}/{d.max}
                    </div>
                  </div>
                  <div style={{ padding:'10px 14px', background:'#fff' }}>
                    <div style={{ height:6, background:'#e2e8f0', borderRadius:3, marginBottom:10, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:3, width:`${d.max > 0 ? (d.points/d.max)*100 : 0}%`, background: d.matched ? '#16a34a' : '#e2e8f0', transition:'width 0.6s ease' }}/>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                      <div style={{ padding:'6px 10px', borderRadius:6, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                        <div style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Votre profil</div>
                        <div style={{ fontSize:12, color:'#1a3a6b', fontWeight:600 }}>{d.userVal}</div>
                      </div>
                      <div style={{ padding:'6px 10px', borderRadius:6, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                        <div style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Cette bourse</div>
                        <div style={{ fontSize:12, color:'#1a3a6b', fontWeight:600 }}>{d.bourseVal}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:12, color: d.matched ? '#15803d' : '#b91c1c', padding:'6px 10px', borderRadius:6, background: d.matched ? '#f0fdf4' : '#fef2f2', display:'flex', alignItems:'flex-start', gap:6 }}>
                      <span style={{ flexShrink:0 }}>{d.matched ? '✓' : '✗'}</span>
                      <span>{d.reason}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {match.pct < 100 && match.details.filter(d => !d.matched && !d.isBonus).length > 0 && (
              <div style={{ marginTop:20, padding:'14px 16px', borderRadius:10, background:'#fffbeb', border:'1px solid #fde68a' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#d97706', marginBottom:6 }}>💡 Comment améliorer votre score ?</div>
                <div style={{ fontSize:12, color:'#92400e', lineHeight:1.8 }}>
                  {match.details.filter(d => !d.matched && !d.isBonus).map((d, i) => (
                    <div key={i}>• Complétez "{d.label}" dans votre profil</div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── BourseDrawer principal ────────────────────────────────────────────────────
export default function BourseDrawer({ bourse, onClose, onAskAI, onChoose, starred, onStar, applied, onApply, user }) {
  if (!bourse) return null;
  const dl = daysLeft(bourse.dateLimite);
  const [starLoading,  setStarLoading]  = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [showMatch,    setShowMatch]    = useState(false);

  const pct = user ? calcMatch(bourse, user) : null;
  const scoreColor = getScoreColor(pct);

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:900, background:'rgba(26,58,107,0.4)', backdropFilter:'blur(4px)', animation:'fadeIn 0.2s ease' }}/>

      <div style={{ position:'fixed', top:0, right:0, bottom:0, zIndex:901, width:500, maxWidth:'95vw', background:'#ffffff', borderLeft:'3px solid #f5a623', display:'flex', flexDirection:'column', animation:'slideIn 0.25s ease', overflowY:'auto', boxShadow:'-8px 0 32px rgba(26,58,107,0.15)' }}>

        {/* Header */}
        <div style={{ padding:'20px 22px 16px', background:'#1a3a6b', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div style={{ fontSize:28, width:52, height:52, borderRadius:10, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {countryFlag(bourse.pays)}
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:32, height:32, borderRadius:6, cursor:'pointer', fontSize:16 }}>✕</button>
          </div>
          <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#ffffff', marginBottom:8, lineHeight:1.3 }}>{bourse.nom}</h2>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <span style={D.tagLight}>{countryFlag(bourse.pays)} {bourse.pays}</span>
            {bourse.niveau && <span style={D.tagLight}>🎓 {bourse.niveau}</span>}
            <span style={{ ...D.tagLight, background:'rgba(245,166,35,0.2)', color:'#f5a623', borderColor:'rgba(245,166,35,0.3)' }}>💰 {bourse.financement || '100% financée'}</span>
            {pct !== null && (
              <span onClick={() => setShowMatch(true)} style={{ ...D.tagLight, background:'rgba(255,255,255,0.2)', fontWeight:700, cursor:'pointer', color: pct >= 65 ? '#4ade80' : pct >= 45 ? '#fbbf24' : '#f87171' }}>
                🎯 {pct}% match
              </span>
            )}
          </div>
        </div>

        {/* Deadline */}
        {dl && (
          <div style={{ padding:'10px 22px', background:dl.color==='#dc2626'?'#fef2f2':dl.color==='#d97706'?'#fffbeb':'#f0fdf4', borderBottom:`2px solid ${dl.color}30`, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18 }}>⏰</span>
            <div>
              <div style={{ fontSize:12, color:dl.color, fontWeight:700 }}>{dl.label==='Expirée'?'Deadline expirée':`Deadline dans ${dl.label}`}</div>
              <div style={{ fontSize:11, color:'#64748b' }}>{bourse.dateLimite && new Date(bourse.dateLimite).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}</div>
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{ padding:'20px 22px', flex:1 }}>
          {bourse.description && (
            <div style={{ marginBottom:20 }}>
              <div style={D.label}>À propos</div>
              <p style={{ fontSize:13, color:'#475569', lineHeight:1.7, margin:0 }}>{bourse.description}</p>
            </div>
          )}
          {bourse.eligibilite && Object.values(bourse.eligibilite).some(v=>v) && (
            <div style={{ marginBottom:20 }}>
              <div style={D.label}>Critères d'éligibilité</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {bourse.eligibilite.nationalitesEligibles && <div style={D.infoRow}><span style={D.infoIcon}>🌍</span><div><div style={{ fontSize:11, color:'#64748b', marginBottom:2 }}>Nationalités éligibles</div><div style={{ fontSize:13, color:'#1a3a6b', fontWeight:500 }}>{bourse.eligibilite.nationalitesEligibles}</div></div></div>}
                {bourse.eligibilite.niveauRequis && <div style={D.infoRow}><span style={D.infoIcon}>🎓</span><div><div style={{ fontSize:11, color:'#64748b', marginBottom:2 }}>Niveau requis</div><div style={{ fontSize:13, color:'#1a3a6b', fontWeight:500 }}>{bourse.eligibilite.niveauRequis}</div></div></div>}
                {bourse.eligibilite.ageMax && <div style={D.infoRow}><span style={D.infoIcon}>📅</span><div><div style={{ fontSize:11, color:'#64748b', marginBottom:2 }}>Âge maximum</div><div style={{ fontSize:13, color:'#1a3a6b', fontWeight:500 }}>{bourse.eligibilite.ageMax} ans</div></div></div>}
                {bourse.eligibilite.conditionsSpeciales && <div style={D.infoRow}><span style={D.infoIcon}>📋</span><div><div style={{ fontSize:11, color:'#64748b', marginBottom:2 }}>Conditions spéciales</div><div style={{ fontSize:13, color:'#1a3a6b', fontWeight:500 }}>{bourse.eligibilite.conditionsSpeciales}</div></div></div>}
              </div>
            </div>
          )}
          {bourse.documentsRequis?.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={D.label}>Documents requis ({bourse.documentsRequis.length})</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {bourse.documentsRequis.map((doc,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 12px', borderRadius:6, background:doc.obligatoire?'#eff6ff':'#f8fafc', border:`1px solid ${doc.obligatoire?'#bfdbfe':'#e2e8f0'}` }}>
                    <span style={{ fontSize:14, flexShrink:0, marginTop:1, color:doc.obligatoire?'#1a3a6b':'#94a3b8' }}>{doc.obligatoire?'✓':'○'}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:doc.obligatoire?'#1a3a6b':'#475569', fontWeight:doc.obligatoire?600:400 }}>{doc.nom}{!doc.obligatoire&&<span style={{ fontSize:10, marginLeft:6, color:'#94a3b8' }}>optionnel</span>}</div>
                      {doc.description&&doc.description!=='empty'&&<div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{doc.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom:20 }}>
            <div style={D.label}>Détails</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[{icon:'📍',label:'Pays',val:bourse.pays},{icon:'🎓',label:'Niveau',val:bourse.niveau},{icon:'💰',label:'Financement',val:bourse.financement},{icon:'📚',label:'Domaine',val:bourse.domaine}].filter(r=>r.val).map((row,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:6, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                  <span style={{ fontSize:14, width:20, textAlign:'center' }}>{row.icon}</span>
                  <span style={{ fontSize:12, color:'#94a3b8', width:80 }}>{row.label}</span>
                  <span style={{ fontSize:13, color:'#1a3a6b', fontWeight:600, flex:1 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
          {bourse.lienOfficiel && (
            <div style={{ marginBottom:20 }}>
              <div style={D.label}>Lien officiel</div>
              <a href={bourse.lienOfficiel} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:8, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:13, textDecoration:'none', wordBreak:'break-all', fontWeight:500 }}>
                <span>🔗</span><span style={{ flex:1 }}>{bourse.lienOfficiel}</span><span>↗</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 22px 24px', borderTop:'1px solid #e2e8f0', flexShrink:0, display:'flex', flexDirection:'column', gap:10, background:'#f8fafc' }}>
          <button
            style={{ width:'100%', padding:13, borderRadius:8, border:'none', background:applied?'#eff6ff':'#1a3a6b', color:applied?'#1a3a6b':'#fff', fontSize:14, fontWeight:700, cursor:applied?'default':'pointer', boxShadow:applied?'none':'0 4px 12px rgba(26,58,107,0.25)' }}
            onClick={!applied?async()=>{ setApplyLoading(true); await onApply(bourse); setApplyLoading(false); onClose(); }:undefined}
            disabled={applied||applyLoading}
          >{applyLoading?'⏳':applied?'✅ Déjà dans la roadmap':'🗺️ Postuler maintenant'}</button>

          <div style={{ display:'flex', gap:8 }}>
            <button style={{ flex:1, padding:10, borderRadius:8, background:starred?'#fefce8':'#ffffff', border:starred?'1px solid #fde68a':'1px solid #e2e8f0', color:starred?'#d97706':'#475569', fontSize:13, cursor:'pointer', fontWeight:500 }}
              onClick={async()=>{ setStarLoading(true); await onStar(bourse,starred); setStarLoading(false); }} disabled={starLoading}>
              {starLoading?'⏳':starred?'★ Favori':'☆ Ajouter aux favoris'}
            </button>
            <button style={{ flex:1, padding:10, borderRadius:8, background:'#f5a623', border:'none', color:'#1a3a6b', fontSize:13, cursor:'pointer', fontWeight:700 }}
              onClick={()=>{ onAskAI(bourse); onClose(); }}>🤖 Demander à l'IA</button>
          </div>

          <button onClick={() => setShowMatch(true)}
            style={{ width:'100%', padding:'10px', borderRadius:8, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:13, cursor:'pointer', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <span>🤖</span>
            <span>Analyse IA complète du match{pct !== null ? ` — ${pct}%` : ''}</span>
            <span style={{ marginLeft:'auto', color:'#94a3b8' }}>→</span>
          </button>
        </div>
      </div>

      {showMatch && <MatchDrawerIA bourse={bourse} user={user} onBack={() => setShowMatch(false)} />}

      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    </>
  );
}