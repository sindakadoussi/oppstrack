import React, { useState } from 'react';

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

const daysLeft = (deadline) => {
  if (!deadline) return null;
  const diff = Math.round((new Date(deadline) - new Date()) / (1000*60*60*24));
  if (diff < 0)   return { label: 'Expirée',        color: '#f87171' };
  if (diff === 0) return { label: "Aujourd'hui!",   color: '#f87171' };
  if (diff <= 30) return { label: `${diff} jours`,  color: '#f87171' };
  return               { label: `${diff} jours`,    color: '#4ade80' };
};

export default function BourseDrawer({ bourse, onClose, onAskAI, onChoose, starred, onStar, applied, onApply }) {
  if (!bourse) return null;
  const dl = daysLeft(bourse.dateLimite);
  const [starLoading,  setStarLoading]  = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:900, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(3px)', animation:'fadeIn 0.2s ease' }}/>
      <div style={{ position:'fixed', top:0, right:0, bottom:0, zIndex:901, width:480, maxWidth:'95vw', background:'#0d0d22', borderLeft:'1px solid rgba(99,102,241,0.2)', display:'flex', flexDirection:'column', animation:'slideIn 0.25s ease', overflowY:'auto' }}>

        {/* Header */}
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

        {/* Body */}
        <div style={{ padding:'0 22px', flex:1 }}>

          {/* Description */}
          {bourse.description && (
            <div style={{ marginBottom:20 }}>
              <div style={D.label}>À propos</div>
              <p style={{ fontSize:13, color:'#94a3b8', lineHeight:1.7, margin:0 }}>{bourse.description}</p>
            </div>
          )}

          {/* Éligibilité */}
          {bourse.eligibilite && Object.values(bourse.eligibilite).some(v=>v) && (
            <div style={{ marginBottom:20 }}>
              <div style={D.label}>✅ Critères d'éligibilité</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {bourse.eligibilite.nationalitesEligibles && (
                  <div style={D.infoRow}>
                    <span style={D.infoIcon}>🌍</span>
                    <div>
                      <div style={{ fontSize:11, color:'#64748b', marginBottom:2 }}>Nationalités éligibles</div>
                      <div style={{ fontSize:13, color:'#e2e8f0' }}>{bourse.eligibilite.nationalitesEligibles}</div>
                    </div>
                  </div>
                )}
                {bourse.eligibilite.niveauRequis && (
                  <div style={D.infoRow}>
                    <span style={D.infoIcon}>🎓</span>
                    <div>
                      <div style={{ fontSize:11, color:'#64748b', marginBottom:2 }}>Niveau requis</div>
                      <div style={{ fontSize:13, color:'#e2e8f0' }}>{bourse.eligibilite.niveauRequis}</div>
                    </div>
                  </div>
                )}
                {bourse.eligibilite.ageMax && (
                  <div style={D.infoRow}>
                    <span style={D.infoIcon}>📅</span>
                    <div>
                      <div style={{ fontSize:11, color:'#64748b', marginBottom:2 }}>Âge maximum</div>
                      <div style={{ fontSize:13, color:'#e2e8f0' }}>{bourse.eligibilite.ageMax} ans</div>
                    </div>
                  </div>
                )}
                {bourse.eligibilite.conditionsSpeciales && (
                  <div style={D.infoRow}>
                    <span style={D.infoIcon}>📋</span>
                    <div>
                      <div style={{ fontSize:11, color:'#64748b', marginBottom:2 }}>Conditions spéciales</div>
                      <div style={{ fontSize:13, color:'#e2e8f0' }}>{bourse.eligibilite.conditionsSpeciales}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents requis */}
          {bourse.documentsRequis?.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={D.label}>📁 Documents requis ({bourse.documentsRequis.length})</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {bourse.documentsRequis.map((doc,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 12px', borderRadius:8, background:doc.obligatoire?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.015)', border:`1px solid ${doc.obligatoire?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.05)'}` }}>
                    <span style={{ fontSize:14, flexShrink:0, marginTop:1, color:doc.obligatoire?'#4ade80':'#64748b' }}>
                      {doc.obligatoire?'✓':'○'}
                    </span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:doc.obligatoire?'#e2e8f0':'#94a3b8', fontWeight:doc.obligatoire?600:400 }}>
                        {doc.nom}
                        {!doc.obligatoire && <span style={{ fontSize:10, marginLeft:6, color:'#475569', fontWeight:400 }}>optionnel</span>}
                      </div>
                      {doc.description && doc.description!=='empty' && (
                        <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{doc.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Détails */}
          <div style={{ marginBottom:20 }}>
            <div style={D.label}>Détails</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                {icon:'📍', label:'Pays',        val:bourse.pays},
                {icon:'🎓', label:'Niveau',      val:bourse.niveau},
                {icon:'💰', label:'Financement', val:bourse.financement},
                {icon:'📚', label:'Domaine',     val:bourse.domaine},
                {icon:'🌐', label:'Langue',      val:bourse.langue},
              ].filter(r=>r.val).map((row,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize:14, width:20, textAlign:'center' }}>{row.icon}</span>
                  <span style={{ fontSize:12, color:'#64748b', width:80 }}>{row.label}</span>
                  <span style={{ fontSize:13, color:'#e2e8f0', fontWeight:500, flex:1 }}>{row.val}</span>
                </div>
              ))}
              {bourse.dateOuverture && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize:14, width:20, textAlign:'center' }}>📅</span>
                  <span style={{ fontSize:12, color:'#64748b', width:80 }}>Ouverture</span>
                  <span style={{ fontSize:13, color:'#e2e8f0', fontWeight:500, flex:1 }}>
                    {new Date(bourse.dateOuverture).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}
                  </span>
                </div>
              )}
              {bourse.tunisienEligible && bourse.tunisienEligible !== 'inconnu' && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize:14, width:20, textAlign:'center' }}>🇹🇳</span>
                  <span style={{ fontSize:12, color:'#64748b', width:80 }}>Tunisiens</span>
                  <span style={{ fontSize:13, fontWeight:600, flex:1, color: bourse.tunisienEligible==='oui'?'#4ade80':'#f87171' }}>
                    {bourse.tunisienEligible === 'oui' ? '✓ Éligibles' : '✕ Non éligibles'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Lien officiel */}
          {bourse.lienOfficiel && (
            <div style={{ marginBottom:20 }}>
              <div style={D.label}>Lien officiel</div>
              <a href={bourse.lienOfficiel} target="_blank" rel="noreferrer"
                style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', color:'#818cf8', fontSize:13, textDecoration:'none', wordBreak:'break-all' }}>
                <span>🔗</span><span style={{ flex:1 }}>{bourse.lienOfficiel}</span><span>↗</span>
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding:'16px 22px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0, display:'flex', flexDirection:'column', gap:10 }}>
          <button
            style={{ width:'100%', padding:13, borderRadius:11, border:'none', background:applied?'rgba(99,102,241,0.25)':'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', fontSize:14, fontWeight:700, cursor:applied?'default':'pointer', boxShadow:applied?'none':'0 4px 16px rgba(79,70,229,0.35)' }}
            onClick={!applied ? async()=>{ setApplyLoading(true); await onApply(bourse); setApplyLoading(false); onClose(); } : undefined}
            disabled={applied||applyLoading}
          >
            {applyLoading ? '⏳' : applied ? '✅ Déjà dans la roadmap' : '🗺️ Postuler maintenant'}
          </button>
          <div style={{ display:'flex', gap:8 }}>
            <button
              style={{ flex:1, padding:10, borderRadius:10, background:starred?'rgba(251,191,36,0.15)':'rgba(255,255,255,0.05)', border:starred?'1px solid rgba(251,191,36,0.3)':'1px solid rgba(255,255,255,0.1)', color:starred?'#fbbf24':'#94a3b8', fontSize:13, cursor:'pointer' }}
              onClick={async()=>{ setStarLoading(true); await onStar(bourse,starred); setStarLoading(false); }}
            >
              {starLoading ? '⏳' : starred ? '★ Favori' : '☆ Ajouter aux favoris'}
            </button>
            <button
              style={{ flex:1, padding:10, borderRadius:10, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', color:'#818cf8', fontSize:13, cursor:'pointer' }}
              onClick={()=>{ onAskAI(bourse); onClose(); }}
            >
              🤖 Demander à l'IA
            </button>
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