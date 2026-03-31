import React, { useState, useEffect, useCallback } from 'react';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';

const API_BASE = 'http://localhost:3000/api';

function countryFlag(pays) {
  const flags = {
    'France':'🇫🇷','Allemagne':'🇩🇪','Royaume-Uni':'🇬🇧','États-Unis':'🇺🇸',
    'Canada':'🇨🇦','Japon':'🇯🇵','Chine':'🇨🇳','Australie':'🇦🇺',
    'Suisse':'🇨🇭','Pays-Bas':'🇳🇱','Maroc':'🇲🇦','Hongrie':'🇭🇺',
    'Corée du Sud':'🇰🇷','Nouvelle-Zélande':'🇳🇿','Turquie':'🇹🇷',
    'Belgique':'🇧🇪','Espagne':'🇪🇸','Italie':'🇮🇹','Portugal':'🇵🇹',
    'Roumanie':'🇷🇴','Arabie Saoudite':'🇸🇦','Brunei':'🇧🇳',
  };
  return flags[pays] || '🌍';
}

function calcMatch(bourse, user) {
  if (!user) return null;
  let score = 0, total = 0;
  if (user.pays) {
    total += 40;
    const bp=(bourse.pays||'').toLowerCase(), up=user.pays.toLowerCase();
    if (bp===up||bp.includes(up)||up.includes(bp)) score += 40;
  }
  if (user.niveau) {
    total += 35;
    const bn=(bourse.niveau||'').toLowerCase(), un=user.niveau.toLowerCase();
    const base=un.replace(/\s*\d+$/,'').trim();
    if (bn.includes(un)||bn.includes(base)) score += 35;
  }
  if (user.domaine) {
    total += 25;
    const bd=(bourse.domaine||'').toLowerCase(), desc=(bourse.description||'').toLowerCase(), ud=user.domaine.toLowerCase();
    if (bd.includes(ud)||ud.includes(bd)||desc.includes(ud)) score += 25;
    else score += 8;
  }
  if (total===0) return null;
  return Math.round((score/total)*100);
}

function getScoreColor(score) {
  if (score===null) return '#475569';
  if (score>=80) return '#4ade80';
  if (score>=55) return '#fbbf24';
  return '#f87171';
}
function getScoreLabel(score) {
  if (score===null) return null;
  if (score>=80) return 'Excellent match';
  if (score>=55) return 'Bon match';
  return 'Match partiel';
}

const daysLeft = (deadline) => {
  if (!deadline) return null;
  const diff = Math.round((new Date(deadline)-new Date())/(1000*60*60*24));
  if (diff<0)   return { label:'Expirée',       color:'#f87171' };
  if (diff===0) return { label:"Aujourd'hui!",  color:'#f87171' };
  if (diff<=30) return { label:`${diff} jours`, color:'#f87171' };
  return               { label:`${diff} jours`, color:'#4ade80' };
};

const isUrgent = (deadline) => {
  if (!deadline) return false;
  return (new Date(deadline)-new Date())/(1000*60*60*60*24)<30;
};

// ── BourseCard ────────────────────────────────────────────────────────────────
function BourseCard({ bourse, user, onAskAI, onClick, starred, onStar, applied, onApply }) {
  const pct = calcMatch(bourse, user);
  const scoreColor = getScoreColor(pct);
  const dl = daysLeft(bourse.dateLimite);
  const urgent = isUrgent(bourse.dateLimite);
  const niveaux = bourse.niveau ? bourse.niveau.split(',').map(s=>s.trim()).filter(Boolean) : [];
  const [starLoading,  setStarLoading]  = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  const formatDate = (d) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}); }
    catch { return d; }
  };

  return (
    <div style={{ background:'#0e0e1a', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, overflow:'hidden', display:'flex', flexDirection:'column', transition:'transform .2s, box-shadow .2s' }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.4)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}
    >
      <div style={{ height:4, background:pct!==null?`linear-gradient(90deg,${scoreColor}88,${scoreColor})`:'rgba(255,255,255,0.05)' }}/>
      <div style={{ padding:'14px 16px 10px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, cursor:'pointer' }} onClick={onClick}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
          <span style={{ fontSize:20, flexShrink:0 }}>{countryFlag(bourse.pays)}</span>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:11, color:'#64748b', fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
              {bourse.pays||'International'}
              {urgent && <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background:'rgba(239,68,68,0.15)', color:'#f87171', fontWeight:700, textTransform:'uppercase' }}>Urgent</span>}
            </div>
            <div style={{ fontSize:'0.95rem', fontWeight:700, color:'#f1f5f9', lineHeight:1.3, marginTop:2 }}>{bourse.nom}</div>
          </div>
        </div>
        {pct!==null && (
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:'1.2rem', fontWeight:800, color:scoreColor, lineHeight:1 }}>{pct}%</div>
            <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{getScoreLabel(pct)}</div>
          </div>
        )}
      </div>
      <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'0 16px' }}/>
      <div style={{ padding:'12px 16px', flex:1, display:'flex', flexDirection:'column', gap:8, cursor:'pointer' }} onClick={onClick}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
          {niveaux.map((n,i)=>(
            <span key={i} style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.15)', color:'#94a3b8' }}>{n}</span>
          ))}
        </div>
        {bourse.financement && (
          <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
            <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>💰</span>
            <span style={{ fontSize:12, color:'#94a3b8', lineHeight:1.5 }}>{bourse.financement}</span>
          </div>
        )}
        {bourse.description && (
          <p style={{ fontSize:12, color:'#64748b', lineHeight:1.5, margin:0, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {bourse.description}
          </p>
        )}
        {(formatDate(bourse.dateLimite)||dl) && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:2 }}>
            {formatDate(bourse.dateLimite) && (
              <div>
                <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>Date limite</div>
                <div style={{ fontSize:12, color:dl?.color||'#94a3b8', fontWeight:700 }}>{formatDate(bourse.dateLimite)}</div>
              </div>
            )}
            {dl && <div style={{ fontSize:12, color:dl.color, fontWeight:600 }}>{dl.label} restants</div>}
          </div>
        )}
      </div>
      <div style={{ padding:'10px 16px 14px', display:'flex', gap:6 }}>
        <button style={{ flex:1, padding:'9px 10px', borderRadius:10, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', border:'none', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .2s' }}
          onClick={(e)=>{ e.stopPropagation(); onClick(); }}
          onMouseEnter={e=>e.currentTarget.style.opacity='0.85'}
          onMouseLeave={e=>e.currentTarget.style.opacity='1'}
        >Voir les détails →</button>
        <button style={{ flex:1, padding:'9px 10px', borderRadius:10, background:applied?'rgba(99,102,241,0.15)':'#1e1e30', border:applied?'1px solid rgba(99,102,241,0.3)':'1px solid rgba(255,255,255,0.08)', color:applied?'#a5b4fc':'#e2e8f0', fontSize:12, fontWeight:600, cursor:applied?'default':'pointer', transition:'all .2s' }}
          onClick={!applied?async(e)=>{ e.stopPropagation(); setApplyLoading(true); await onApply(bourse); setApplyLoading(false); }:undefined}
          disabled={applied||applyLoading}
          onMouseEnter={e=>{ if(!applied) e.currentTarget.style.background='#2a2a45'; }}
          onMouseLeave={e=>{ if(!applied) e.currentTarget.style.background='#1e1e30'; }}
        >{applyLoading?'⏳':applied?'✅ Roadmap':'🗺️ Postuler'}</button>
        <button style={{ width:38, height:38, borderRadius:10, flexShrink:0, background:starred?'rgba(251,191,36,0.15)':'#1e1e30', border:starred?'1px solid rgba(251,191,36,0.35)':'1px solid rgba(255,255,255,0.08)', color:starred?'#fbbf24':'#64748b', fontSize:16, cursor:starLoading?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }}
          onClick={async(e)=>{ e.stopPropagation(); setStarLoading(true); await onStar(bourse,starred); setStarLoading(false); }}
          disabled={starLoading}
        >{starred?'★':'☆'}</button>
        {/* 🤖 Icône Chat - ouvre le chat latéral avec message pré-rempli */}
        <button style={{ width:38, height:38, borderRadius:10, flexShrink:0, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', color:'#818cf8', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={(e)=>{ e.stopPropagation(); onAskAI(bourse); }}
          title="Demander à l'IA"
        >🤖</button>
      </div>
    </div>
  );
}

// ── BourseDrawer ──────────────────────────────────────────────────────────────
function BourseDrawer({ bourse, onClose, onAskAI, onChoose, starred, onStar, applied, onApply }) {
  if (!bourse) return null;
  const dl = daysLeft(bourse.dateLimite);
  const [starLoading,  setStarLoading]  = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:900, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(3px)', animation:'fadeIn 0.2s ease' }}/>
      <div style={{ position:'fixed', top:0, right:0, bottom:0, zIndex:901, width:480, maxWidth:'95vw', background:'#0d0d22', borderLeft:'1px solid rgba(99,102,241,0.2)', display:'flex', flexDirection:'column', animation:'slideIn 0.25s ease', overflowY:'auto' }}>
        <div style={{ padding:'20px 22px 0', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div style={{ fontSize:28, width:52, height:52, borderRadius:14, background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {countryFlag(bourse.pays)}
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'none', color:'#94a3b8', width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16 }}>✕</button>
          </div>
          <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#f1f5f9', marginBottom:8, lineHeight:1.3 }}>{bourse.nom}</h2>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
            <span style={D.tag}>{countryFlag(bourse.pays)} {bourse.pays}</span>
            {bourse.niveau && <span style={D.tag}>🎓 {bourse.niveau}</span>}
            <span style={{ ...D.tag, background:'rgba(16,185,129,0.12)', color:'#34d399', borderColor:'rgba(16,185,129,0.25)' }}>💰 {bourse.financement||'100% financée'}</span>
          </div>
          {dl && (
            <div style={{ padding:'10px 14px', borderRadius:10, marginBottom:12, background:`${dl.color}12`, border:`1px solid ${dl.color}30`, display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>⏰</span>
              <div>
                <div style={{ fontSize:12, color:dl.color, fontWeight:700 }}>{dl.label==='Expirée'?'Deadline expirée':`Deadline dans ${dl.label}`}</div>
                <div style={{ fontSize:11, color:'#64748b' }}>{bourse.dateLimite && new Date(bourse.dateLimite).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}</div>
              </div>
            </div>
          )}
          <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'0 -22px 16px' }}/>
        </div>
        <div style={{ padding:'0 22px', flex:1 }}>
          {bourse.description && (
            <div style={{ marginBottom:20 }}>
              <div style={D.label}>À propos</div>
              <p style={{ fontSize:13, color:'#94a3b8', lineHeight:1.7, margin:0 }}>{bourse.description}</p>
            </div>
          )}
          {bourse.eligibilite && Object.values(bourse.eligibilite).some(v=>v) && (
            <div style={{ marginBottom:20 }}>
              <div style={D.label}>✅ Critères d'éligibilité</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {bourse.eligibilite.nationalitesEligibles && (
                  <div style={D.infoRow}><span style={D.infoIcon}>🌍</span><div><div style={{ fontSize:11, color:'#64748b', marginBottom:2 }}>Nationalités éligibles</div><div style={{ fontSize:13, color:'#e2e8f0' }}>{bourse.eligibilite.nationalitesEligibles}</div></div></div>
                )}
                {bourse.eligibilite.niveauRequis && (
                  <div style={D.infoRow}><span style={D.infoIcon}>🎓</span><div><div style={{ fontSize:11, color:'#64748b', marginBottom:2 }}>Niveau requis</div><div style={{ fontSize:13, color:'#e2e8f0' }}>{bourse.eligibilite.niveauRequis}</div></div></div>
                )}
                {bourse.eligibilite.ageMax && (
                  <div style={D.infoRow}><span style={D.infoIcon}>📅</span><div><div style={{ fontSize:11, color:'#64748b', marginBottom:2 }}>Âge maximum</div><div style={{ fontSize:13, color:'#e2e8f0' }}>{bourse.eligibilite.ageMax} ans</div></div></div>
                )}
                {bourse.eligibilite.conditionsSpeciales && (
                  <div style={D.infoRow}><span style={D.infoIcon}>📋</span><div><div style={{ fontSize:11, color:'#64748b', marginBottom:2 }}>Conditions spéciales</div><div style={{ fontSize:13, color:'#e2e8f0' }}>{bourse.eligibilite.conditionsSpeciales}</div></div></div>
                )}
              </div>
            </div>
          )}
          {bourse.documentsRequis?.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={D.label}>📁 Documents requis ({bourse.documentsRequis.length})</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {bourse.documentsRequis.map((doc,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 12px', borderRadius:8, background:doc.obligatoire?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.015)', border:`1px solid ${doc.obligatoire?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.05)'}` }}>
                    <span style={{ fontSize:14, flexShrink:0, marginTop:1, color:doc.obligatoire?'#4ade80':'#64748b' }}>{doc.obligatoire?'✓':'○'}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:doc.obligatoire?'#e2e8f0':'#94a3b8', fontWeight:doc.obligatoire?600:400 }}>{doc.nom}{!doc.obligatoire && <span style={{ fontSize:10, marginLeft:6, color:'#475569', fontWeight:400 }}>optionnel</span>}</div>
                      {doc.description && doc.description!=='empty' && <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{doc.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom:20 }}>
            <div style={D.label}>Détails</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[{icon:'📍',label:'Pays',val:bourse.pays},{icon:'🎓',label:'Niveau',val:bourse.niveau},{icon:'💰',label:'Financement',val:bourse.financement},{icon:'📚',label:'Domaine',val:bourse.domaine}].filter(r=>r.val).map((row,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize:14, width:20, textAlign:'center' }}>{row.icon}</span>
                  <span style={{ fontSize:12, color:'#64748b', width:80 }}>{row.label}</span>
                  <span style={{ fontSize:13, color:'#e2e8f0', fontWeight:500, flex:1 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
          {bourse.lienOfficiel && (
            <div style={{ marginBottom:20 }}>
              <div style={D.label}>Lien officiel</div>
              <a href={bourse.lienOfficiel} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', color:'#818cf8', fontSize:13, textDecoration:'none', wordBreak:'break-all' }}>
                <span>🔗</span><span style={{ flex:1 }}>{bourse.lienOfficiel}</span><span>↗</span>
              </a>
            </div>
          )}
        </div>
        <div style={{ padding:'16px 22px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0, display:'flex', flexDirection:'column', gap:10 }}>
          <button
            style={{ width:'100%', padding:13, borderRadius:11, border:'none', background:applied?'rgba(99,102,241,0.25)':'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', fontSize:14, fontWeight:700, cursor:applied?'default':'pointer', boxShadow:applied?'none':'0 4px 16px rgba(79,70,229,0.35)' }}
            onClick={!applied?async()=>{ setApplyLoading(true); await onApply(bourse); setApplyLoading(false); onClose(); }:undefined}
            disabled={applied||applyLoading}
          >{applyLoading?'⏳':applied?'✅ Déjà dans la roadmap':'🗺️ Postuler maintenant'}</button>
          <div style={{ display:'flex', gap:8 }}>
            <button style={{ flex:1, padding:10, borderRadius:10, background:starred?'rgba(251,191,36,0.15)':'rgba(255,255,255,0.05)', border:starred?'1px solid rgba(251,191,36,0.3)':'1px solid rgba(255,255,255,0.1)', color:starred?'#fbbf24':'#94a3b8', fontSize:13, cursor:'pointer' }}
              onClick={async()=>{ setStarLoading(true); await onStar(bourse,starred); setStarLoading(false); }}
            >{starLoading?'⏳':starred?'★ Favori':'☆ Ajouter aux favoris'}</button>
            <button style={{ flex:1, padding:10, borderRadius:10, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', color:'#818cf8', fontSize:13, cursor:'pointer' }}
              onClick={()=>{ onAskAI(bourse); onClose(); }}>🤖 Demander à l'IA</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    </>
  );
}

const D = {
  tag:     { fontSize:11, padding:'3px 10px', borderRadius:99, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', color:'#94a3b8' },
  label:   { fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 },
  infoRow: { display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' },
  infoIcon:{ fontSize:16, flexShrink:0, marginTop:2 },
};

// ── BoursesPage ───────────────────────────────────────────────────────────────
export default function BoursesPage({ 
  bourses, 
  askAboutScholarship, 
  handleSend, 
  messages, 
  input, 
  setInput, 
  loading, 
  chatContainerRef, 
  handleQuickReply, 
  user, 
  initialSelected, 
  onClearInitialSelected 
}) {
  const [search,       setSearch]       = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [filterPays,   setFilterPays]   = useState('');
  const [showChat,     setShowChat]     = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [starredNoms,  setStarredNoms]  = useState(new Set());
  const [appliedNoms,  setAppliedNoms]  = useState(new Set());

  // ✅ Ouvrir automatiquement le drawer si initialSelected est fourni
  useEffect(() => {
    if (!initialSelected || !bourses?.length) return;
    const nomLower = initialSelected.trim().toLowerCase();
    const found = bourses.find(b =>
      b.nom?.trim().toLowerCase() === nomLower ||
      b.nom?.trim().toLowerCase().includes(nomLower) ||
      nomLower.includes(b.nom?.trim().toLowerCase())
    );
    if (found) {
      setSelected(found);
      if (onClearInitialSelected) onClearInitialSelected();
    }
  }, [initialSelected, bourses, onClearInitialSelected]);

  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const resFav  = await fetch(`${API_BASE}/favoris?where[user][equals]=${user.id}&limit=1&depth=0`);
      const dataFav = await resFav.json();
      const docFav  = dataFav.docs?.[0];
      setStarredNoms(new Set((docFav?.bourses||[]).map(b=>b.nom?.trim().toLowerCase())));

      const resRM   = await fetch(`${API_BASE}/roadmap?where[userId][equals]=${user.id}&limit=100&depth=0`);
      const dataRM  = await resRM.json();
      setAppliedNoms(new Set((dataRM.docs||[]).map(b=>b.nom?.trim().toLowerCase())));
    } catch {}
  }, [user?.id]);

  useEffect(() => { loadUserData(); }, [loadUserData]);

  const handleStar = async (bourse, isStarred) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id) return;
    try {
      const res  = await fetch(`${API_BASE}/favoris?where[user][equals]=${user.id}&limit=1&depth=0`);
      const data = await res.json();
      const doc  = data.docs?.[0];
      if (isStarred) {
        if (!doc?.id) return;
        const newBourses = (doc.bourses||[]).filter(b=>b.nom?.trim().toLowerCase()!==nomKey);
        await fetch(`${API_BASE}/favoris/${doc.id}`,{ method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({bourses:newBourses}) });
        setStarredNoms(prev=>{ const s=new Set(prev); s.delete(nomKey); return s; });
      } else {
        const nb = { nom:bourse.nom, pays:bourse.pays||'', lienOfficiel:bourse.lienOfficiel||'', financement:bourse.financement||'', dateLimite:bourse.dateLimite||null, ajouteLe:new Date().toISOString() };
        if (doc?.id) {
          await fetch(`${API_BASE}/favoris/${doc.id}`,{ method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({bourses:[...(doc.bourses||[]),nb]}) });
        } else {
          await fetch(`${API_BASE}/favoris`,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({user:user.id, userEmail:user.email||'', bourses:[nb]}) });
        }
        setStarredNoms(prev=>new Set([...prev,nomKey]));
      }
    } catch(err){ console.error('[Star]',err); }
  };

  const handleApply = async (bourse) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id||appliedNoms.has(nomKey)) return;
    try {
      await fetch(`${API_BASE}/roadmap`,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId:user.id, userEmail:user.email||'', nom:bourse.nom, pays:bourse.pays||'', lienOfficiel:bourse.lienOfficiel||'', financement:bourse.financement||'', dateLimite:bourse.dateLimite||null, ajouteLe:new Date().toISOString(), statut:'en_cours', etapeCourante:0 }) });
      setAppliedNoms(prev=>new Set([...prev,nomKey]));
    } catch(err){ console.error('[Apply]',err); }
  };

  // 🤖 NOUVEAU : Handler pour ouvrir le chat latéral avec message pré-rempli
  const handleAskAI = useCallback((bourse) => {
    // 1. Ouvrir le panneau chat s'il est fermé
    setShowChat(true);
    
    // 2. Pré-remplir l'input avec une question contextuelle sur la bourse
    const question = `Peux-tu me dire si je suis éligible à la bourse "${bourse.nom}" en ${bourse.pays} ?`;
    setInput(question);
    
    // 3. (Optionnel) Scroll vers le chat sur mobile
    setTimeout(() => {
      const chatEl = document.querySelector('[data-chat-sidebar]');
      if (chatEl && window.innerWidth < 768) {
        chatEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
    
    // 💡 OPTION B : Pour envoyer automatiquement le message, décommentez ci-dessous :
    // setTimeout(async () => {
    //   if (typeof handleSend === 'function') {
    //     await handleSend(question);
    //   }
    // }, 150);
  }, [setInput, handleSend]);

  const filtered = bourses.filter(b => {
    if (b.statut==='expiree') return false;
    const q = search.toLowerCase();
    const matchSearch = !q||b.nom?.toLowerCase().includes(q)||b.pays?.toLowerCase().includes(q)||b.domaine?.toLowerCase().includes(q);
    const matchNiveau = !filterNiveau||b.niveau?.includes(filterNiveau);
    const matchPays   = !filterPays||b.pays===filterPays;
    return matchSearch&&matchNiveau&&matchPays;
  }).sort((a,b)=>(calcMatch(b,user)??0)-(calcMatch(a,user)??0));

  const pays    = [...new Set(bourses.map(b=>b.pays).filter(Boolean))];
  const niveaux = [...new Set(bourses.flatMap(b=>(b.niveau||'').split(',').map(s=>s.trim())).filter(Boolean))];

  return (
    <div style={{ width:'100%', padding:'28px 24px', background:'#07070f', minHeight:'100vh', fontFamily:"'Outfit', system-ui, sans-serif" }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:'1.8rem', fontWeight:800, color:'#f1f5f9', margin:0 }}>Bourses 100% Financées</h2>
          <p style={{ color:'#64748b', fontSize:14, marginTop:6 }}>{filtered.length} opportunité{filtered.length>1?'s':''} disponible{filtered.length>1?'s':''}</p>
        </div>
        <button style={{ padding:'8px 16px', borderRadius:10, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#818cf8', fontSize:13, cursor:'pointer' }} onClick={()=>setShowChat(!showChat)}>
          {showChat?'✕ Fermer IA':'🤖 Chat IA'}
        </button>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap' }}>
        <input placeholder="🔍  Rechercher une bourse, pays, domaine..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ flex:1, minWidth:200, padding:'10px 16px', borderRadius:10, border:'1px solid rgba(99,102,241,0.25)', background:'rgba(255,255,255,0.04)', color:'#e2e8f0', fontSize:14, outline:'none' }}/>
        <select value={filterNiveau} onChange={e=>setFilterNiveau(e.target.value)}
          style={{ padding:'10px 14px', borderRadius:10, border:'1px solid rgba(99,102,241,0.25)', background:'#0e0e1a', color:'#94a3b8', fontSize:13, cursor:'pointer', outline:'none' }}>
          <option value="">Tous niveaux</option>
          {niveaux.map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterPays} onChange={e=>setFilterPays(e.target.value)}
          style={{ padding:'10px 14px', borderRadius:10, border:'1px solid rgba(99,102,241,0.25)', background:'#0e0e1a', color:'#94a3b8', fontSize:13, cursor:'pointer', outline:'none' }}>
          <option value="">Tous pays</option>
          {pays.map(p=><option key={p} value={p}>{countryFlag(p)} {p}</option>)}
        </select>
        {(search||filterNiveau||filterPays) && (
          <button style={{ padding:'10px 14px', borderRadius:10, border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.1)', color:'#f87171', fontSize:13, cursor:'pointer' }}
            onClick={()=>{ setSearch(''); setFilterNiveau(''); setFilterPays(''); }}>✕ Effacer</button>
        )}
      </div>

      <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:16 }}>
          {filtered.length===0 ? (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 20px', color:'#475569' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
              <p>Aucune bourse trouvée. Essayez d'autres critères.</p>
            </div>
          ) : filtered.map(bourse=>(
            <BourseCard 
              key={bourse.id} 
              bourse={bourse} 
              user={user}
              onAskAI={handleAskAI}  // ← Utilise le nouveau handler
              onClick={()=>setSelected(bourse)}
              starred={starredNoms.has(bourse.nom?.trim().toLowerCase())}
              onStar={handleStar}
              applied={appliedNoms.has(bourse.nom?.trim().toLowerCase())}
              onApply={handleApply}
            />
          ))}
        </div>

        {/* 🤖 Chat latéral avec attribut data pour scroll mobile */}
        {showChat && (
          <div 
            data-chat-sidebar
            style={{ 
              width:320, 
              flexShrink:0, 
              background:'rgba(15,15,30,0.9)', 
              border:'1px solid rgba(99,102,241,0.2)', 
              borderRadius:16, 
              overflow:'hidden', 
              position:'sticky', 
              top:80, 
              display:'flex', 
              flexDirection:'column', 
              maxHeight:'calc(100vh - 100px)',
              animation:'slideInChat 0.25s ease-out'
            }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'14px 16px', borderBottom:'1px solid rgba(99,102,241,0.15)', color:'#818cf8', fontWeight:600, fontSize:14 }}>
              <span>🤖</span><span>Assistant Bourses</span>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:12, minHeight:300 }} ref={chatContainerRef}>
              {messages.length===0 && <div style={{ color:'#475569', fontSize:13, textAlign:'center', padding:20, lineHeight:1.6 }}>Demandez-moi de comparer des bourses ou de vérifier votre éligibilité !</div>}
              {messages.slice(-20).map((msg,i)=><ChatMessage key={i} msg={msg} index={i}/>)}
              {loading && (
                <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>🤖</div>
                  <div style={{ padding:'12px 16px', borderRadius:14, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', gap:4, alignItems:'center' }}>
                    {[0,1,2].map(i=><span key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#6366f1', display:'inline-block', animation:'bounce 1.2s infinite ease-in-out', animationDelay:`${i*0.2}s` }}/>)}
                  </div>
                </div>
              )}
            </div>
            <ChatInput input={input} setInput={setInput} onSend={()=>handleSend()} loading={loading}/>
          </div>
        )}
      </div>

      <BourseDrawer
        bourse={selected}
        onClose={()=>setSelected(null)}
        onAskAI={handleAskAI}  // ← Utilise aussi le nouveau handler dans le drawer
        onChoose={(b)=>handleSend(`je choisis ${b.nom}`)}
        starred={selected?starredNoms.has(selected.nom?.trim().toLowerCase()):false}
        onStar={handleStar}
        applied={selected?appliedNoms.has(selected.nom?.trim().toLowerCase()):false}
        onApply={handleApply}
      />

      <style>{`
        @keyframes bounce{0%,60%,100%{transform:scale(0.7);opacity:0.5}30%{transform:scale(1.1);opacity:1}}
        @keyframes slideInChat{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        input::placeholder{color:#475569}
        [data-chat-sidebar]{animation:slideInChat 0.25s ease-out}
      `}</style>
    </div>
  );
}