// RoadmapPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import ChatInput from '../components/ChatInput';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';
import { useT, useDark } from '../i18n';

function useBourses(userId) {
  const [bourses, setBourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const res = await axiosInstance.get(API_ROUTES.roadmap.byUser(userId), { params:{ limit:50, depth:1 }, signal:AbortSignal.timeout(8000) });
      const docs = (res.data.docs||[]).map(d => ({
        _id:d.id, nom:d.nom, pays:d.pays||'', url:d.lienOfficiel||'',
        deadline:d.dateLimite||'', financement:d.financement||'',
        etapeCourante:d.etapeCourante??0, statut:d.statut||'en_cours',
        etapes:d.etapes||[], conseilGlobal:d.conseilGlobal||'',
        langue:d.langue||'', deadlineFinale:d.deadlineFinale||'',
      }));
      const uniqueMap = new Map();
      docs.forEach(b => { const key=`${b.nom?.toLowerCase().trim()}|${b.pays?.toLowerCase().trim()}|${b.deadline}`; if(!uniqueMap.has(key)) uniqueMap.set(key,b); });
      setBourses(Array.from(uniqueMap.values()));
    } catch(err) { console.error('Erreur chargement bourses:',err); setBourses([]); }
    finally { setLoading(false); }
  }, [userId]);
  useEffect(()=>{ reload(); },[reload]);
  return { bourses, loading, reload };
}

/* ─── Hook de traduction des étapes via Claude API ─────────────────── */
function useTranslatedEtapes(etapes, lang) {
  const [translated, setTranslated] = React.useState(null);
  const [translating, setTranslating] = React.useState(false);
  const cacheKey = React.useMemo(() => {
    if (!etapes?.length) return null;
    return 'tr_' + lang + '_' + etapes.map(e => e.titre?.slice(0,10)).join('|');
  }, [etapes, lang]);

  React.useEffect(() => {
    if (lang === 'fr' || !etapes?.length) { setTranslated(null); return; }
    // Vérifier le cache localStorage
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setTranslated(JSON.parse(cached)); return; }
    } catch {}

    setTranslating(true);
    const prompt = `Translate these scholarship application steps from French to English.
Return ONLY a JSON array with the same structure, same number of items.
Each item must have: titre, description, documents (array of strings), duree, deadline.
Keep proper nouns and dates as-is. Be concise and professional.

Input: ${JSON.stringify(etapes.map(e => ({
  titre: e.titre || '',
  description: e.description || '',
  documents: e.documents || [],
  duree: e.duree || '',
  deadline: e.deadline || '',
})))}

Return ONLY the JSON array, no explanation.`;

    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    .then(r => r.json())
    .then(data => {
      const text = data.content?.[0]?.text || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setTranslated(parsed);
        try { localStorage.setItem(cacheKey, JSON.stringify(parsed)); } catch {}
      }
    })
    .catch(err => console.warn('Translation error:', err))
    .finally(() => setTranslating(false));
  }, [cacheKey, lang, etapes]);

  return { translated, translating };
}

function BourseTimeline({ bourse, isActive, onSelect, onDelete, onRegenerate, handleQuickReply, setShowChat }) {
  const { lang } = useT();
  const { darkMode } = useDark();

  // Traduction des étapes via Claude API quand lang==='en'
  const { translated: translatedEtapes, translating } = useTranslatedEtapes(bourse.etapes, lang);
  // Utiliser les étapes traduites si disponibles, sinon les originales
  const etapesDisplay = (lang === 'en' && translatedEtapes) ? translatedEtapes : (bourse.etapes || []);

  const stepKey = `roadmap_step_${bourse.nom?.replace(/\s+/g,'_')||'unknown'}`;
  const [currentStep, setCurrentStep] = useState(()=>{ if(bourse.etapeCourante!==undefined) return bourse.etapeCourante; try{return parseInt(localStorage.getItem(stepKey)||'0',10);}catch{return 0;} });
  const [genStatus, setGenStatus]     = useState(()=>bourse.etapes?.length>0?'success':'pending');
  const [pollCount, setPollCount]     = useState(0);
  const MAX_POLL = 12;

  useEffect(()=>{
    if(!bourse?._id||genStatus==='success') return;
    if(pollCount>=MAX_POLL){setGenStatus('error');return;}
    const timer=setTimeout(async()=>{
      try{
        const res=await axiosInstance.get(API_ROUTES.roadmap.byId(bourse._id),{params:{depth:1}});
        if(res.data?.etapes?.length>0) setGenStatus('success');
        else setPollCount(p=>p+1);
      }catch(e){console.warn('Polling roadmap error:',e);setPollCount(p=>p+1);}
    },5000);
    return()=>clearTimeout(timer);
  },[bourse?._id,genStatus,pollCount]);

  const goToStep = useCallback(async(stepIndex)=>{
    setCurrentStep(stepIndex);
    localStorage.setItem(stepKey,String(stepIndex));
    if(bourse._id) await axiosInstance.patch(API_ROUTES.roadmap.update(bourse._id),{etapeCourante:stepIndex}).catch(()=>{});
  },[bourse._id,stepKey]);

  // etapesDisplay utilisé pour le rendu (traduit si lang==='en')
  const total  = etapesDisplay?.length || bourse.etapes?.length || 0;
  const pct    = total>1?Math.round((currentStep/(total-1))*100):0;

  const STATUT = {
    en_cours: { bg:'#eff6ff', color:'#1a3a6b', border:'#bfdbfe', labelFr:'En cours',   labelEn:'In progress' },
    soumis:   { bg:'#fffbeb', color:'#d97706', border:'#fde68a', labelFr:'Soumis',     labelEn:'Submitted'   },
    accepte:  { bg:'#f0fdf4', color:'#166534', border:'#bbf7d0', labelFr:'Accepté ✓',  labelEn:'Accepted ✓'  },
    refuse:   { bg:'#fef2f2', color:'#dc2626', border:'#fecaca', labelFr:'Refusé',     labelEn:'Refused'     },
  };
  const st = STATUT[bourse.statut]||STATUT.en_cours;

  const dm   = darkMode;
  const bg   = dm?'#1e293b':'#ffffff';
  const bord = dm?'#334155':'#e2e8f0';
  const txt  = dm?'#f1f5f9':'#1a3a6b';
  const soft = dm?'#94a3b8':'#64748b';

  return (
    <div style={{ borderRadius:10, background:bg, border:`1px solid ${bord}`, overflow:'hidden', boxShadow:dm?'0 2px 8px rgba(0,0,0,0.3)':'0 2px 8px rgba(26,58,107,0.06)', transition:'background .25s' }}>
      <div style={{ height:3, background:`linear-gradient(90deg,#1a3a6b,#f5a623)`, width:`${pct}%`, transition:'width 0.5s ease' }}/>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', cursor:'pointer' }} onClick={onSelect}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', marginBottom:4 }}>
            <div style={{ fontSize:15, fontWeight:700, color:txt }}>{bourse.nom}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, padding:'2px 9px', borderRadius:4, fontWeight:600, background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>
                {lang==='fr'?st.labelFr:st.labelEn}
              </span>
              <button onClick={e=>{e.stopPropagation();onDelete();}} style={{ background:'transparent', border:'none', fontSize:16, cursor:'pointer', padding:'5px 7px', borderRadius:4, color:'#dc2626' }} title={lang==='fr'?'Supprimer':'Delete'}>🗑️</button>
              <button onClick={e=>{e.stopPropagation();onRegenerate();}} style={{ background:'#f5a623', border:'none', fontSize:16, cursor:'pointer', padding:'5px 7px', borderRadius:4, color:'#1a3a6b' }} title={lang==='fr'?'Régénérer':'Regenerate'}>🔄</button>
            </div>
          </div>
          <div style={{ display:'flex', gap:14, fontSize:12, color:soft, flexWrap:'wrap' }}>
            {bourse.pays&&<span>📍 {bourse.pays}</span>}
            {(bourse.deadlineFinale||bourse.deadline)&&<span>⏰ {bourse.deadlineFinale||bourse.deadline}</span>}
            {bourse.langue&&<span>🗣 {bourse.langue}</span>}
            {bourse.url&&<a href={bourse.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:txt, textDecoration:'none', fontWeight:500 }} onClick={e=>e.stopPropagation()}>🔗 {lang==='fr'?'Site officiel':'Official site'}</a>}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ padding:'4px 12px', borderRadius:4, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:12, fontWeight:700 }}>{total>0?`${currentStep+1}/${total}`:'0/0'} · {pct}%</div>
          <div style={{ fontSize:22, color:txt, transition:'transform .2s', fontWeight:700, transform:isActive?'rotate(90deg)':'rotate(0deg)' }}>›</div>
        </div>
      </div>

      {isActive && (
        <div style={{ padding:'0 20px 20px', borderTop:`1px solid ${bord}` }}>
          {bourse.conseilGlobal && <div style={{ margin:'14px 0 18px', padding:'12px 16px', borderRadius:8, background:dm?'#1e3a5f':'#eff6ff', border:`1px solid ${dm?'#2563eb':'#bfdbfe'}`, color:txt, fontSize:13, lineHeight:1.6 }}>💡 {bourse.conseilGlobal}</div>}

          {/* Génération en cours */}
          {/* Indicateur de traduction */}
          {lang==='en' && translating && genStatus==='success' && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', margin:'8px 0', borderRadius:6, background:'#fffbeb', border:'1px solid #fde68a', fontSize:12, color:'#92400e' }}>
              <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid #fde68a', borderTopColor:'#d97706', animation:'spin 0.8s linear infinite', flexShrink:0 }}/>
              Translating steps to English…
            </div>
          )}
                    {genStatus==='pending' && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 20px', color:soft, textAlign:'center' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', border:'3px solid #e2e8f0', borderTopColor:'#f5a623', animation:'spin 1s linear infinite', marginBottom:12 }}/>
              <div style={{ fontSize:13, marginTop:8 }}>
                🤖 {lang==='fr'?'Génération de ta roadmap personnalisée…':'Generating your personalized roadmap…'}<br/>
                <span style={{ fontSize:11, color:soft }}>{lang==='fr'?`Analyse de "${bourse.nom}" en cours (${pollCount}/${MAX_POLL})`:`Analyzing "${bourse.nom}" (${pollCount}/${MAX_POLL})`}</span>
              </div>
            </div>
          )}

          {/* Erreur */}
          {genStatus==='error' && (
            <div style={{ marginTop:20, padding:'20px', borderRadius:10, background:'#fef2f2', border:'1px solid #fecaca', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:8 }}>
              <div style={{ fontSize:32 }}>⚠️</div>
              <div style={{ fontWeight:700, color:'#dc2626', marginBottom:4 }}>{lang==='fr'?'Génération échouée':'Generation failed'}</div>
              <div style={{ fontSize:12, color:soft, textAlign:'center', marginBottom:12 }}>
                {lang==='fr'?`Impossible de générer les étapes pour "${bourse.nom}". Vérifie ton workflow n8n.`:`Could not generate steps for "${bourse.nom}". Check your n8n workflow.`}
              </div>
              <button style={{ padding:'8px 16px', borderRadius:6, border:'none', background:'#dc2626', color:'#fff', fontSize:12, cursor:'pointer' }}
                onClick={e=>{e.stopPropagation();onRegenerate();}}>
                🔄 {lang==='fr'?'Réessayer la génération':'Retry generation'}
              </button>
            </div>
          )}

          {/* Étapes */}
          {genStatus==='success' && etapesDisplay.length>0 && (
            <>
              {etapesDisplay.map((etape,i)=>{
                const isCompleted=i<currentStep, isCurrent=i===currentStep;
                const color=etape.couleur||(i%2===0?'#1a3a6b':'#2563eb');
                return (
                  <div key={i} style={{ display:'flex', gap:14, cursor:'pointer' }} onClick={()=>goToStep(i)}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, width:44 }}>
                      <div style={{ width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`2px solid ${color}`, transition:'all .3s', zIndex:1, background:isCompleted?color:isCurrent?bg:'#f8fafc', color:isCompleted?'#fff':color }}>
                        {isCompleted?'✓':(etape.icon||i+1)}
                      </div>
                      {i<etapesDisplay.length-1&&<div style={{ width:2, flex:1, minHeight:16, margin:'4px 0', background:isCompleted?color:bord, transition:'background .3s' }}/>}
                    </div>
                    <div style={{ flex:1, opacity:isCompleted||isCurrent?1:0.6 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4, paddingTop:10 }}>
                        <div>
                          <div style={{ fontSize:14, fontWeight:700, marginBottom:2, color:txt }}>{etape.titre}</div>
                          {etape.deadline&&<div style={{ fontSize:11, color:'#d97706', fontWeight:600 }}>📅 {etape.deadline}</div>}
                        </div>
                        {etape.duree&&<div style={{ padding:'2px 8px', borderRadius:4, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:11, fontWeight:500 }}>{etape.duree}</div>}
                      </div>
                      {isCurrent&&(
                        <>
<div style={{ fontSize:13, lineHeight:1.55, marginBottom:10, color:soft }}>{etape.description}</div>
                          {etape.documents?.length>0&&(
                            <div style={{ marginBottom:10, padding:'10px 14px', borderRadius:8, background:dm?'#0f172a':'#f8fafc', border:`1px solid ${bord}` }}>
                              <div style={{ fontSize:11, color:txt, fontWeight:700, letterSpacing:1, marginBottom:8, textTransform:'uppercase' }}>{lang==='fr'?'Documents requis':'Required documents'}</div>
                              {etape.documents.map((doc,idx)=><div key={idx} style={{ display:'flex', gap:8, fontSize:12, color:soft, marginBottom:5, alignItems:'flex-start' }}>• {doc}</div>)}
                            </div>
                          )}
                          <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
                            {i<etapesDisplay.length-1&&<button style={{ padding:'8px 16px', borderRadius:6, background:'#1a3a6b', color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
                              onClick={e=>{e.stopPropagation();goToStep(i+1);}}>
                              {lang==='fr'?'Étape suivante →':'Next step →'}
                            </button>}
                            <button style={{ padding:'8px 14px', borderRadius:6, background:'#f5a623', border:'none', color:'#1a3a6b', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
                              onClick={e=>{e.stopPropagation();if(setShowChat)setShowChat(true);handleQuickReply(`${lang==='fr'?'Aide-moi pour':'Help me with'}: ${etape.titre}`);}}>
                              🤖 {lang==='fr'?'Aide IA':'AI Help'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop:18, padding:'14px 16px', borderRadius:8, background:dm?'#0f172a':'#f8fafc', border:`1px solid ${bord}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:soft, marginBottom:8 }}>
                  <span style={{ color:txt, fontWeight:600 }}>{lang==='fr'?'Progression':'Progress'} {bourse.nom}</span>
                  <span style={{ color:'#f5a623', fontWeight:700 }}>{pct}%</span>
                </div>
                <div style={{ height:6, background:bord, borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:'linear-gradient(90deg,#1a3a6b,#f5a623)', borderRadius:3, transition:'width .5s ease', width:`${pct}%` }}/>
                </div>
                <div style={{ fontSize:11, color:soft, marginTop:4 }}>{lang==='fr'?`Étape ${currentStep+1} sur ${total}`:`Step ${currentStep+1} of ${total}`}</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LoginModal({ onClose }) {
  const { lang } = useT();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');
  const send = async () => {
    if (!email||!email.includes('@')){setErrMsg(lang==='fr'?'Email invalide':'Invalid email');return;}
    setStatus('sending');
    try{ await axiosInstance.post('/api/users/request-magic-link',{email:email.trim().toLowerCase()}); setStatus('success'); }
    catch(err){ setStatus('error'); setErrMsg(err.response?.data?.message||(lang==='fr'?'Erreur serveur':'Server error')); }
  };
  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ position:'relative', zIndex:2001, width:400, maxWidth:'92vw', background:'#fff', borderRadius:10, overflow:'hidden', border:'1px solid #e2e8f0', boxShadow:'0 20px 48px rgba(26,58,107,0.18)', borderTop:'3px solid #f5a623' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 20px', background:'#1a3a6b' }}>
          <span style={{ fontSize:22 }}>🔐</span>
          <span style={{ color:'#fff', fontWeight:700, fontSize:16 }}>{lang==='fr'?'Connexion à OppsTrack':'Sign in to OppsTrack'}</span>
          <button style={{ marginLeft:'auto', background:'rgba(255,255,255,0.12)', border:'none', color:'#fff', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14 }} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding:'24px' }}>
          {status==='idle'&&<><p style={{ color:'#64748b', fontSize:14, marginBottom:20, lineHeight:1.6 }}>{lang==='fr'?'Entrez votre email pour recevoir un lien magique.':'Enter your email to receive a magic link.'}</p><input type="email" placeholder={lang==='fr'?'votre@email.com':'your@email.com'} value={email} autoFocus onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} style={{ width:'100%', padding:'11px 14px', borderRadius:6, border:'1.5px solid #e2e8f0', background:'#f8fafc', color:'#1a3a6b', fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:4 }}/>{errMsg&&<div style={{ color:'#dc2626', fontSize:12, marginTop:8 }}>{errMsg}</div>}<button style={{ width:'100%', marginTop:16, padding:'12px', borderRadius:6, border:'none', background:'#1a3a6b', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }} onClick={send}>✉️ {lang==='fr'?'Envoyer le lien magique':'Send magic link'}</button></>}
          {status==='sending'&&<div style={{ textAlign:'center', padding:'24px 0' }}><div style={{ width:40, height:40, border:'3px solid #eff6ff', borderTopColor:'#1a3a6b', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' }}/><p style={{ color:'#64748b', marginTop:14 }}>{lang==='fr'?'Envoi...':'Sending...'}</p></div>}
          {status==='success'&&<div style={{ textAlign:'center', padding:'16px 0' }}><div style={{ fontSize:52, marginBottom:12 }}>✉️</div><div style={{ fontSize:16, fontWeight:700, color:'#166534', marginBottom:8 }}>{lang==='fr'?'Lien envoyé !':'Link sent!'}</div><p style={{ color:'#64748b', fontSize:13 }}>{lang==='fr'?'Vérifiez votre boîte mail.':'Check your inbox.'}</p><button style={{ width:'100%', marginTop:16, padding:'12px', borderRadius:6, border:'none', background:'#166534', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }} onClick={onClose}>✓ {lang==='fr'?'Fermer':'Close'}</button></div>}
          {status==='error'&&<div style={{ textAlign:'center', padding:'16px 0' }}><div style={{ fontSize:40, marginBottom:12 }}>⚠️</div><p style={{ color:'#dc2626', marginBottom:12 }}>{errMsg}</p><button style={{ width:'100%', marginTop:16, padding:'12px', borderRadius:6, border:'none', background:'#dc2626', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }} onClick={()=>{setStatus('idle');setErrMsg('');}}>Retry</button></div>}
        </div>
      </div>
      <div style={{ position:'absolute', inset:0, background:'rgba(26,58,107,0.45)', backdropFilter:'blur(6px)' }} onClick={onClose}/>
    </div>
  );
}

export default function RoadmapPage({ user, messages, input, setInput, loading:chatLoading, handleSend, chatContainerRef, handleQuickReply }) {
  const { lang } = useT();
  const { darkMode } = useDark();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { bourses, loading:boursesLoading, reload } = useBourses(user?.id);
  const [activeBourse, setActiveBourse] = useState(0);
  const [showChat, setShowChat] = useState(false);

  const dm   = darkMode;
  const bg   = dm?'#0f172a':'#f8f9fc';
  const cardBg = dm?'#1e293b':'#ffffff';
  const bord = dm?'#334155':'#e2e8f0';
  const txt  = dm?'#f1f5f9':'#1a3a6b';
  const soft = dm?'#94a3b8':'#64748b';

  const handleRegenerate = useCallback(async(bourse)=>{
    if(!bourse._id) return;
    try{ await axiosInstance.post(WEBHOOK_ROUTES.generateRoadmap,{ roadmapId:bourse._id, bourse:{nom:bourse.nom,pays:bourse.pays,url:bourse.url,deadline:bourse.deadline,financement:bourse.financement} }); setTimeout(()=>reload(),2000); }
    catch(err){ console.error('Erreur régénération:',err); }
  },[reload]);

  const handleDeleteBourse = useCallback(async(bourse)=>{
    if(!bourse._id) return;
    try{ await axiosInstance.delete(API_ROUTES.roadmap.delete(bourse._id)); reload(); }
    catch(err){ console.error('Erreur suppression:',err); }
  },[reload]);

  useEffect(()=>{ if(bourses.length>0) setActiveBourse(0); },[bourses.length]);

  const getBourseKey=(bourse,index)=>bourse._id||`${bourse.nom?.replace(/\s+/g,'_')}-${bourse.pays}-${bourse.deadline}-${index}`;

  if (!user) return (
    <>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:bg, padding:24 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', background:cardBg, border:`1px solid ${bord}`, borderRadius:12, padding:'48px 40px', boxShadow:'0 4px 20px rgba(26,58,107,0.08)', maxWidth:380, width:'100%' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🗺️</div>
          <h3 style={{ color:txt, fontWeight:700, fontSize:18, margin:'0 0 8px' }}>{lang==='fr'?'Roadmap non disponible':'Roadmap unavailable'}</h3>
          <p style={{ color:soft, fontSize:13, lineHeight:1.6, maxWidth:280, textAlign:'center', margin:'0 0 24px' }}>
            {lang==='fr'?'Connectez-vous pour suivre vos candidatures.':'Sign in to track your applications.'}
          </p>
          <button style={{ padding:'12px 32px', borderRadius:6, background:'#1a3a6b', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }} onClick={()=>setShowLoginModal(true)}>
            🔐 {lang==='fr'?'Se connecter':'Sign in'}
          </button>
        </div>
      </div>
      {showLoginModal&&<LoginModal onClose={()=>setShowLoginModal(false)}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );

  return (
    <div style={{ width:'100%', background:bg, minHeight:'100vh', fontFamily:"'Segoe UI',system-ui,sans-serif", position:'relative', transition:'background .25s' }}>
      <div style={{ maxWidth:1232, margin:'0 auto', padding:'24px 32px' }}>
        <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:14 }}>
            {boursesLoading&&(
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'24px', color:soft }}>
                <div style={{ width:28, height:28, borderRadius:'50%', border:'3px solid #e2e8f0', borderTopColor:'#1a3a6b', animation:'spin 1s linear infinite' }}/>
                <span style={{ fontSize:14 }}>{lang==='fr'?'Chargement de vos bourses…':'Loading your scholarships…'}</span>
              </div>
            )}

            {!boursesLoading&&bourses.length===0&&(
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'48px 24px', borderRadius:10, background:cardBg, border:`2px dashed ${bord}` }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🗺️</div>
                <div style={{ color:txt, fontWeight:700, fontSize:16, marginBottom:8 }}>{lang==='fr'?'Aucune candidature en cours':'No active application'}</div>
                <div style={{ color:soft, fontSize:13, lineHeight:1.6, maxWidth:360, textAlign:'center' }}>
                  {lang==='fr'
                    ?<>Allez dans <strong style={{ color:txt }}>Recommandations</strong> et cliquez sur <strong style={{ color:'#f5a623' }}>🗺️ Postuler</strong> pour démarrer votre roadmap.</>
                    :<>Go to <strong style={{ color:txt }}>Recommendations</strong> and click <strong style={{ color:'#f5a623' }}>🗺️ Apply</strong> to start your roadmap.</>}
                </div>
                <button style={{ marginTop:20, padding:'11px 24px', borderRadius:6, border:'none', background:'#1a3a6b', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}
                  onClick={()=>handleQuickReply(lang==='fr'?'Recommande moi des bourses':'Recommend me scholarships')}>
                  🎯 {lang==='fr'?'Voir les recommandations':'See recommendations'}
                </button>
              </div>
            )}

            {!boursesLoading&&bourses.map((bourse,i)=>(
              <BourseTimeline key={getBourseKey(bourse,i)} bourse={bourse}
                isActive={activeBourse===i}
                onSelect={()=>setActiveBourse(activeBourse===i?-1:i)}
                onDelete={()=>handleDeleteBourse(bourse)}
                onRegenerate={()=>handleRegenerate(bourse)}
                handleQuickReply={handleQuickReply}
                setShowChat={setShowChat}/>
            ))}

            {user?.id&&!boursesLoading&&(
              <button style={{ padding:'8px 16px', borderRadius:6, background:'transparent', border:`1px solid ${bord}`, color:soft, fontSize:12, cursor:'pointer', alignSelf:'flex-start', fontFamily:'inherit' }} onClick={reload}>
                🔄 {lang==='fr'?'Actualiser mes bourses':'Refresh my scholarships'}
              </button>
            )}
          </div>

          {/* Chat latéral */}
          {showChat&&(
            <div style={{ width:320, flexShrink:0, background:cardBg, border:`1px solid ${bord}`, borderRadius:10, position:'sticky', top:110, display:'flex', flexDirection:'column', maxHeight:'calc(100vh - 130px)', minHeight:0, boxShadow:'0 4px 16px rgba(26,58,107,0.08)', zIndex:90 }}>
              <div style={{ display:'flex', gap:10, alignItems:'center', padding:'14px 16px', borderBottom:'2px solid #f5a623', background:'#1a3a6b', borderTopLeftRadius:10, borderTopRightRadius:10 }}>
                <span style={{ fontSize:20 }}>🤖</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{lang==='fr'?'Assistant Roadmap':'Roadmap Assistant'}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{lang==='fr'?'Conseils personnalisés par étape':'Personalized step-by-step advice'}</div>
                </div>
                <button onClick={()=>setShowChat(false)} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:32, height:32, borderRadius:6, cursor:'pointer', fontSize:16, marginLeft:'auto' }}>✕</button>
              </div>
              <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:12 }} ref={chatContainerRef}>
                {messages.length===0&&(
                  <div style={{ padding:12 }}>
                    <p style={{ color:soft, fontSize:13, marginBottom:12 }}>{lang==='fr'?"Demandez-moi des conseils sur n'importe quelle étape !":'Ask me for advice on any step!'}</p>
                    {(lang==='fr'
                      ?['Comment écrire une lettre de motivation percutante ?','Quels documents faut-il pour une bourse en France ?',"Comment se préparer à l'entretien de sélection ?"]
                      :['How to write a compelling motivation letter?','What documents are needed for a scholarship in France?','How to prepare for the selection interview?']
                    ).map((q,i)=>(
                      <button key={i} style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 12px', borderRadius:6, background:cardBg, border:`1px solid ${bord}`, color:txt, fontSize:12, cursor:'pointer', marginBottom:6, lineHeight:1.4, fontFamily:'inherit' }}
                        onClick={()=>handleQuickReply(q)}>{q}</button>
                    ))}
                  </div>
                )}
                {messages.slice(-20).map((msg,i)=>(
                  <div key={i} style={{ display:'flex', gap:8, marginBottom:12, maxWidth:'92%', ...(msg.sender==='user'?{ marginLeft:'auto', flexDirection:'row-reverse' }:{}) }}>
                    {msg.sender==='ai'&&<div style={{ width:28, height:28, borderRadius:8, background:'#eff6ff', border:'1px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>🤖</div>}
                    <div style={{ padding:'10px 14px', borderRadius:10, fontSize:13, lineHeight:1.5, wordBreak:'break-word', ...(msg.sender==='user'?{ background:'#1a3a6b', color:'#fff' }:{ background:dm?'#334155':'#f1f5f9', color:txt }) }}>{msg.text}</div>
                    {msg.sender==='user'&&<div style={{ width:28, height:28, borderRadius:8, background:'#1a3a6b', border:'1px solid #1a3a6b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>👤</div>}
                  </div>
                ))}
                {chatLoading&&<div style={{ display:'flex', gap:8, marginBottom:12 }}><div style={{ width:28, height:28, borderRadius:8, background:'#eff6ff', border:'1px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>🤖</div><div style={{ padding:'10px 14px', borderRadius:10, fontSize:13, background:dm?'#334155':'#f1f5f9', display:'flex', gap:4, alignItems:'center' }}>{[0,1,2].map(i=><span key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#1a3a6b', display:'inline-block', animation:`bounce 1.2s infinite ease-in-out`, animationDelay:`${i*0.2}s` }}/>)}</div></div>}
              </div>
              <div style={{ flexShrink:0, padding:12, borderTop:`1px solid ${bord}` }}>
                <ChatInput input={input} setInput={setInput} onSend={()=>handleSend()} loading={chatLoading} placeholder={lang==='fr'?'Demandez conseil sur cette étape…':'Ask advice on this step…'}/>
              </div>
            </div>
          )}
        </div>
      </div>

      <button onClick={()=>setShowChat(p=>!p)} style={{ position:'fixed', bottom:24, right:24, width:56, height:56, borderRadius:'50%', background:'#f5a623', border:'none', boxShadow:'0 4px 12px rgba(26,58,107,0.3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'#1a3a6b', zIndex:1000 }}>
        {showChat?'✕':'💬'}
      </button>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bounce{0%,60%,100%{transform:scale(0.7);opacity:0.5}30%{transform:scale(1.1);opacity:1}}
      `}</style>
    </div>
  );
}