import React, { useState, useEffect } from 'react';
import axiosInstance from '@/config/axiosInstance';

const WEBHOOK_ANALYSE = 'http://localhost:5678/webhook/analyse-match';

const scoreColor = (s) =>
  s >= 85 ? '#16a34a' : s >= 70 ? '#2563eb' : s >= 55 ? '#d97706' : s >= 40 ? '#f97316' : '#ef4444';

const statutColor = (s) =>
  s === 'fort' ? { bg:'#f0fdf4', border:'#bbf7d0', text:'#16a34a' }
  : s === 'moyen' ? { bg:'#fffbeb', border:'#fde68a', text:'#d97706' }
  : { bg:'#fef2f2', border:'#fecaca', text:'#ef4444' };

const prioriteColor = (p) =>
  p === 'haute'   ? { bg:'#fef2f2', border:'#fecaca', dot:'#ef4444', text:'Haute priorité' }
  : p === 'moyenne' ? { bg:'#fffbeb', border:'#fde68a', dot:'#d97706', text:'Priorité moyenne' }
  : { bg:'#f0fdf4', border:'#bbf7d0', dot:'#16a34a', text:'Basse priorité' };

export default function MatchDrawerIA({ bourse, user, onBack }) {
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [analyse,  setAnalyse]  = useState(null);
  const [tab,      setTab]      = useState('apercu'); // apercu | criteres | ameliorer

  useEffect(() => {
    if (!bourse || !user) { setError('Données manquantes'); setLoading(false); return; }

    const run = async () => {
      try {
        setLoading(true); setError(null);
        const res = await axiosInstance.post(WEBHOOK_ANALYSE, { user, bourse },
          { timeout: 30000 }
        );
        const data = res.data;
        if (data.success && data.analyse) {
          setAnalyse(data);
        } else {
          setError(data.error || 'Réponse invalide');
        }
      } catch(e) {
        setError(e.message || 'Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [bourse?.nom, user?.id]);

  const sc = analyse ? scoreColor(analyse.scoreGlobal) : '#94a3b8';

  return (
    <div style={{ position:'fixed', top:0, right:0, bottom:0, zIndex:902, width:520, maxWidth:'95vw', background:'#ffffff', borderLeft:'3px solid #1a3a6b', display:'flex', flexDirection:'column', animation:'slideIn 0.2s ease', boxShadow:'-8px 0 32px rgba(26,58,107,0.2)' }}>

      {/* Header */}
      <div style={{ padding:'16px 20px', background:'#1a3a6b', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: analyse ? 12 : 0 }}>
          <button onClick={onBack} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', width:34, height:34, borderRadius:8, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>←</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Analyse IA — Logique du match</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{bourse?.nom}</div>
          </div>
          {analyse && (
            <div style={{ textAlign:'center', flexShrink:0 }}>
              <div style={{ fontSize:26, fontWeight:800, color:'#f5a623', lineHeight:1 }}>{analyse.scoreGlobal}%</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.6)' }}>score IA</div>
            </div>
          )}
        </div>

        {/* Tabs */}
        {analyse && (
          <div style={{ display:'flex', gap:4 }}>
            {[{id:'apercu',label:'Aperçu'},{id:'criteres',label:'Critères'},{id:'ameliorer',label:'À améliorer'}].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ flex:1, padding:'6px 8px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12, fontWeight:tab===t.id?700:500, background:tab===t.id?'rgba(255,255,255,0.2)':'transparent', color:tab===t.id?'#fff':'rgba(255,255,255,0.55)', transition:'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>

        {/* Loading */}
        {loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:300, gap:16 }}>
            <div style={{ width:44, height:44, border:'3px solid #e2e8f0', borderTopColor:'#1a3a6b', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
            <div style={{ fontSize:14, color:'#64748b', textAlign:'center' }}>
              L'IA analyse votre profil complet<br/>
              <span style={{ fontSize:12, color:'#94a3b8' }}>Expériences, compétences, projets...</span>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && !loading && (
          <div style={{ padding:20, borderRadius:10, background:'#fef2f2', border:'1px solid #fecaca', textAlign:'center' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>⚠️</div>
            <div style={{ fontSize:13, color:'#b91c1c', fontWeight:600 }}>Analyse indisponible</div>
            <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{error}</div>
            <div style={{ fontSize:11, color:'#94a3b8', marginTop:8 }}>Vérifiez que n8n est actif sur localhost:5678</div>
          </div>
        )}

        {/* Résultats */}
        {analyse && !loading && (
          <>
            {/* ── Tab Aperçu ── */}
            {tab === 'apercu' && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Score ring + résumé */}
                <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px', borderRadius:12, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                  <div style={{ position:'relative', width:90, height:90, flexShrink:0 }}>
                    <svg width="90" height="90" viewBox="0 0 90 90">
                      <circle cx="45" cy="45" r="38" fill="none" stroke="#e2e8f0" strokeWidth="8"/>
                      <circle cx="45" cy="45" r="38" fill="none" stroke={sc} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${analyse.scoreGlobal * 2.387} 238.7`} transform="rotate(-90 45 45)"
                        style={{ transition:'stroke-dasharray 1s ease' }}/>
                    </svg>
                    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:19, fontWeight:800, color:sc, lineHeight:1 }}>{analyse.scoreGlobal}%</span>
                      <span style={{ fontSize:8, color:'#94a3b8', marginTop:2 }}>match</span>
                    </div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'#1a3a6b', marginBottom:4 }}>{analyse.niveauMatch}</div>
                    <div style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>{analyse.resume}</div>
                  </div>
                </div>

                {/* Points forts */}
                {analyse.pointsForts?.length > 0 && (
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>✅ Points forts</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {analyse.pointsForts.map((p, i) => (
                        <div key={i} style={{ display:'flex', gap:10, padding:'10px 12px', borderRadius:8, background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
                          <span style={{ color:'#16a34a', fontWeight:700, flexShrink:0 }}>✓</span>
                          <span style={{ fontSize:13, color:'#15803d' }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents manquants */}
                {analyse.documentsManquants?.length > 0 && (
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>📁 Documents à préparer</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {analyse.documentsManquants.map((d, i) => (
                        <span key={i} style={{ fontSize:12, padding:'4px 10px', borderRadius:6, background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c' }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conseil personnalisé */}
                {analyse.conseilPersonnalise && (
                  <div style={{ padding:'14px 16px', borderRadius:10, background:'#eff6ff', border:'1px solid #bfdbfe' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#1a3a6b', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>💡 Conseil personnalisé</div>
                    <div style={{ fontSize:13, color:'#1e40af', lineHeight:1.7 }}>{analyse.conseilPersonnalise}</div>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab Critères ── */}
            {tab === 'criteres' && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ fontSize:11, color:'#64748b', marginBottom:4 }}>Analyse IA de chaque critère selon votre profil complet</div>
                {(analyse.criteres || []).map((c, i) => {
                  const st = statutColor(c.statut);
                  return (
                    <div key={i} style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${st.border}` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:st.bg }}>
                        <span style={{ fontSize:20 }}>{c.icone}</span>
                        <div style={{ flex:1, fontSize:13, fontWeight:700, color:'#1a3a6b' }}>{c.nom}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                          <div style={{ fontSize:15, fontWeight:800, color:scoreColor(c.score) }}>{c.score}%</div>
                          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background:st.bg, border:`1px solid ${st.border}`, color:st.text, fontWeight:600 }}>
                            {c.statut === 'fort' ? 'Fort' : c.statut === 'moyen' ? 'Moyen' : 'Faible'}
                          </span>
                        </div>
                      </div>
                      {/* Barre */}
                      <div style={{ height:4, background:'#f1f5f9' }}>
                        <div style={{ height:'100%', width:`${c.score}%`, background:scoreColor(c.score), transition:'width 0.8s ease' }}/>
                      </div>
                      <div style={{ padding:'10px 14px', background:'#fff', fontSize:13, color:'#475569', lineHeight:1.6 }}>
                        {c.explication}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Tab À améliorer ── */}
            {tab === 'ameliorer' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ fontSize:11, color:'#64748b', marginBottom:4 }}>Actions concrètes pour améliorer votre candidature</div>
                {(analyse.pointsAmeliorer || []).map((p, i) => {
                  const pr = prioriteColor(p.priorite);
                  return (
                    <div key={i} style={{ borderRadius:10, border:`1px solid ${pr.border}`, overflow:'hidden' }}>
                      <div style={{ padding:'10px 14px', background:pr.bg, display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:pr.dot, flexShrink:0 }}/>
                        <div style={{ flex:1, fontSize:13, fontWeight:700, color:'#1a3a6b' }}>{p.domaine}</div>
                        <span style={{ fontSize:10, color:pr.dot, fontWeight:600 }}>{pr.text}</span>
                      </div>
                      <div style={{ padding:'12px 14px', background:'#fff', display:'flex', flexDirection:'column', gap:8 }}>
                        <div style={{ fontSize:12, color:'#64748b' }}><strong style={{ color:'#475569' }}>Problème :</strong> {p.probleme}</div>
                        <div style={{ fontSize:12, padding:'8px 12px', borderRadius:6, background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#15803d' }}>
                          <strong>→ Action :</strong> {p.action}
                        </div>
                        {p.impact && (
                          <div style={{ fontSize:11, color:'#94a3b8', fontStyle:'italic' }}>Impact : {p.impact}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes slideIn { from { transform:translateX(100%) } to { transform:translateX(0) } }
        @keyframes spin    { to   { transform:rotate(360deg) } }
      `}</style>
    </div>
  );
}