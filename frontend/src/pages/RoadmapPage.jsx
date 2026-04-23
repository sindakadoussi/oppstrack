// RoadmapPage.jsx — version style éditorial (tokens unipd.it)
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ChatInput from '../components/ChatInput';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';

/* ═══════════════════════════════════════════════════════════════════════════
   TOKENS (identique à la homepage)
═══════════════════════════════════════════════════════════════════════════ */
const tokens = (theme) => ({
  accent:     theme === "dark" ? "#4c9fd9" : "#0066b3",
  accentInk:  theme === "dark" ? "#8ec1e6" : "#004f8a",
  ink:        theme === "dark" ? "#f2efe7" : "#141414",
  ink2:       theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3:       theme === "dark" ? "#a19f96" : "#6b6b6b",
  ink4:       theme === "dark" ? "#6d6b64" : "#9a9794",
  paper:      theme === "dark" ? "#15140f" : "#faf8f3",
  paper2:     theme === "dark" ? "#1d1c16" : "#f2efe7",
  rule:       theme === "dark" ? "#2b2a22" : "#d9d5cb",
  ruleSoft:   theme === "dark" ? "#24231c" : "#e8e4d9",
  surface:    theme === "dark" ? "#1a1912" : "#ffffff",
  danger:     "#b4321f",
  warn:       "#b06a12",
  fSerif: `"Libre Caslon Text", "Times New Roman", Georgia, serif`,
  fSans:  `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"JetBrains Mono", ui-monospace, Menlo, monospace`,
});

/* ═══════════════════════════════════════════════════════════════════════════
   HOOK : Récupération des bourses utilisateur
═══════════════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════════════
   TRADUCTION DES ÉTAPES VIA CLAUDE API
═══════════════════════════════════════════════════════════════════════════ */
function useTranslatedEtapes(etapes, lang) {
  const [translated, setTranslated] = useState(null);
  const [translating, setTranslating] = useState(false);
  const cacheKey = React.useMemo(() => {
    if (!etapes?.length) return null;
    return 'tr_' + lang + '_' + etapes.map(e => e.titre?.slice(0,10)).join('|');
  }, [etapes, lang]);

  useEffect(() => {
    if (lang === 'fr' || !etapes?.length) { setTranslated(null); return; }
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

/* ═══════════════════════════════════════════════════════════════════════════
   COMPOSANT TIMELINE (BourseTimeline)
═══════════════════════════════════════════════════════════════════════════ */
function BourseTimeline({ bourse, isActive, onSelect, onDelete, onRegenerate, handleQuickReply, setShowChat, c, lang }) {
  const { translated: translatedEtapes, translating } = useTranslatedEtapes(bourse.etapes, lang);
  const etapesDisplay = (lang === 'en' && translatedEtapes) ? translatedEtapes : (bourse.etapes || []);

  const stepKey = `roadmap_step_${bourse.nom?.replace(/\s+/g,'_')||'unknown'}`;
  const [currentStep, setCurrentStep] = useState(()=>{ if(bourse.etapeCourante!==undefined) return bourse.etapeCourante; try{return parseInt(localStorage.getItem(stepKey)||'0',10);}catch{return 0;} });
  const [genStatus, setGenStatus] = useState(()=>bourse.etapes?.length>0?'success':'pending');
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLL = 12;

  useEffect(()=>{
    if(!bourse._id||genStatus==='success') return;
    if(pollCount>=MAX_POLL){setGenStatus('error');return;}
    const timer=setTimeout(async()=>{
      try{
        const res=await axiosInstance.get(API_ROUTES.roadmap.byId(bourse._id),{params:{depth:1}});
        if(res.data?.etapes?.length>0) setGenStatus('success');
        else setPollCount(p=>p+1);
      }catch(e){console.warn('Polling roadmap error:',e);setPollCount(p=>p+1);}
    },5000);
    return()=>clearTimeout(timer);
  },[bourse._id,genStatus,pollCount]);

  const goToStep = useCallback(async(stepIndex)=>{
    setCurrentStep(stepIndex);
    localStorage.setItem(stepKey,String(stepIndex));
    if(bourse._id) await axiosInstance.patch(API_ROUTES.roadmap.update(bourse._id),{etapeCourante:stepIndex}).catch(()=>{});
  },[bourse._id,stepKey]);

  const total  = etapesDisplay?.length || bourse.etapes?.length || 0;
  const pct    = total>1?Math.round((currentStep/(total-1))*100):0;

  const STATUT = {
    en_cours: { bg: c.paper2, color: c.accent, border: c.ruleSoft, labelFr:'En cours', labelEn:'In progress' },
    soumis:   { bg: '#fffbeb', color: '#d97706', border: '#fde68a', labelFr:'Soumis', labelEn:'Submitted' },
    accepte:  { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', labelFr:'Accepté ✓', labelEn:'Accepted ✓' },
    refuse:   { bg: '#fef2f2', color: c.danger, border: '#fecaca', labelFr:'Refusé', labelEn:'Refused' },
  };
  const st = STATUT[bourse.statut]||STATUT.en_cours;

  return (
    <div style={{ border: `1px solid ${c.ruleSoft}`, background: c.surface, overflow: 'hidden' }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${c.accent}, ${c.warn})`, width: `${pct}%`, transition: 'width 0.5s ease' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer' }} onClick={onSelect}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
            <div style={{ fontFamily: c.fSerif, fontSize: 16, fontWeight: 700, color: c.ink }}>{bourse.nom}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 600, background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontFamily: c.fMono }}>
                {lang==='fr'?st.labelFr:st.labelEn}
              </span>
              <button onClick={e=>{e.stopPropagation();onDelete();}} style={{ background: 'transparent', border: 'none', fontSize: 16, cursor: 'pointer', padding: '4px 6px', color: c.danger }} title={lang==='fr'?'Supprimer':'Delete'}>🗑️</button>
              <button onClick={e=>{e.stopPropagation();onRegenerate();}} style={{ background: 'transparent', border: 'none', fontSize: 16, cursor: 'pointer', padding: '4px 6px', color: c.warn }} title={lang==='fr'?'Régénérer':'Regenerate'}>🔄</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: c.ink3, flexWrap: 'wrap' }}>
            {bourse.pays&&<span>📍 {bourse.pays}</span>}
            {(bourse.deadlineFinale||bourse.deadline)&&<span>⏰ {bourse.deadlineFinale||bourse.deadline}</span>}
            {bourse.langue&&<span>🗣 {bourse.langue}</span>}
            {bourse.url&&<a href={bourse.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: c.accent, textDecoration: 'none', fontWeight: 500 }} onClick={e=>e.stopPropagation()}>🔗 {lang==='fr'?'Site officiel':'Official site'}</a>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ fontFamily: c.fMono, fontSize: 10, padding: '2px 8px', background: c.paper2, border: `1px solid ${c.ruleSoft}`, color: c.accent, fontWeight: 700 }}>{total>0?`${currentStep+1}/${total}`:'0/0'} · {pct}%</div>
          <div style={{ fontSize: 20, color: c.ink3, transition: 'transform 0.2s', transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</div>
        </div>
      </div>

      {isActive && (
        <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${c.ruleSoft}` }}>
          {bourse.conseilGlobal && (
            <div style={{ margin: '14px 0 18px', padding: '12px 16px', background: c.paper2, borderLeft: `3px solid ${c.accent}`, fontSize: 13, lineHeight: 1.6, color: c.ink2 }}>
              💡 {bourse.conseilGlobal}
            </div>
          )}

          {lang==='en' && translating && genStatus==='success' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', margin: '8px 0', background: '#fffbeb', border: `1px solid #fde68a`, fontSize: 11, color: '#92400e' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #fde68a', borderTopColor: '#d97706', animation: 'spin 0.8s linear infinite' }} />
              Translating steps to English…
            </div>
          )}

          {genStatus==='pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', color: c.ink3, textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${c.ruleSoft}`, borderTopColor: c.accent, animation: 'spin 1s linear infinite', marginBottom: 12 }} />
              <div style={{ fontSize: 13, marginTop: 8 }}>
                🤖 {lang==='fr'?'Génération de ta roadmap personnalisée…':'Generating your personalized roadmap…'}<br/>
                <span style={{ fontSize: 11, color: c.ink3 }}>{lang==='fr'?`Analyse de "${bourse.nom}" en cours`:`Analyzing "${bourse.nom}"`}</span>
              </div>
            </div>
          )}

          {genStatus==='error' && (
            <div style={{ marginTop: 20, padding: '20px', background: '#fef2f2', border: `1px solid #fecaca`, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontWeight: 700, color: c.danger, marginBottom: 4 }}>{lang==='fr'?'Génération échouée':'Generation failed'}</div>
              <div style={{ fontSize: 12, color: c.ink2, marginBottom: 12 }}>{lang==='fr'?`Impossible de générer les étapes pour "${bourse.nom}".`:`Could not generate steps for "${bourse.nom}".`}</div>
              <button style={{ padding: '8px 16px', background: c.accent, border: 'none', color: c.paper, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono }} onClick={e=>{e.stopPropagation();onRegenerate();}}>🔄 {lang==='fr'?'Réessayer':'Retry'}</button>
            </div>
          )}

          {genStatus==='success' && etapesDisplay.length>0 && (
            <>
              {etapesDisplay.map((etape,i)=>{
                const isCompleted=i<currentStep, isCurrent=i===currentStep;
                const color = etape.couleur || (i%2===0?c.accent:c.warn);
                return (
                  <div key={i} style={{ display: 'flex', gap: 14, cursor: 'pointer', marginTop: i===0?0:12 }} onClick={()=>goToStep(i)}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 44 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${color}`, background: isCompleted ? color : isCurrent ? c.surface : c.paper2, color: isCompleted ? c.paper : color, fontSize: 14, fontWeight: 700 }}>
                        {isCompleted ? '✓' : (etape.icon || i+1)}
                      </div>
                      {i<etapesDisplay.length-1 && <div style={{ width: 2, flex: 1, minHeight: 16, margin: '4px 0', background: isCompleted ? color : c.ruleSoft, transition: 'background 0.3s' }} />}
                    </div>
                    <div style={{ flex: 1, opacity: isCompleted||isCurrent ? 1 : 0.6 }}>
                      <div style={{ paddingTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2, color: c.ink }}>{etape.titre}</div>
                            {etape.deadline && <div style={{ fontSize: 10, color: c.warn, fontWeight: 600 }}>📅 {etape.deadline}</div>}
                          </div>
                          {etape.duree && <div style={{ fontSize: 9, padding: '2px 6px', background: c.paper2, border: `1px solid ${c.ruleSoft}`, color: c.accent, fontFamily: c.fMono }}>{etape.duree}</div>}
                        </div>
                        {isCurrent && (
                          <>
                            <div style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 10, color: c.ink2 }}>{etape.description}</div>
                            {etape.documents?.length>0 && (
                              <div style={{ marginBottom: 10, padding: '10px 14px', background: c.paper2, borderLeft: `2px solid ${c.accent}` }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: c.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{lang==='fr'?'Documents requis':'Required documents'}</div>
                                {etape.documents.map((doc,idx)=> <div key={idx} style={{ fontSize: 11, color: c.ink2, marginBottom: 4, display: 'flex', gap: 6 }}>• {doc}</div>)}
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                              {i<etapesDisplay.length-1 && (
                                <button style={{ padding: '6px 14px', background: c.accent, color: c.paper, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono }} onClick={e=>{e.stopPropagation();goToStep(i+1);}}>
                                  {lang==='fr'?'Étape suivante →':'Next step →'}
                                </button>
                              )}
                              <button style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${c.ruleSoft}`, color: c.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono }} onClick={e=>{e.stopPropagation();if(setShowChat)setShowChat(true);handleQuickReply(`${lang==='fr'?'Aide-moi pour':'Help me with'}: ${etape.titre}`);}}>
                                🤖 {lang==='fr'?'Aide IA':'AI Help'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 20, padding: '12px 16px', background: c.paper2, border: `1px solid ${c.ruleSoft}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: c.ink }}>{lang==='fr'?'Progression':'Progress'} {bourse.nom}</span>
                  <span style={{ color: c.accent, fontWeight: 700 }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: c.ruleSoft }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${c.accent}, ${c.warn})`, transition: 'width 0.5s' }} />
                </div>
                <div style={{ fontSize: 10, color: c.ink3, marginTop: 4 }}>{lang==='fr'?`Étape ${currentStep+1} sur ${total}`:`Step ${currentStep+1} of ${total}`}</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN MODAL (style éditorial)
═══════════════════════════════════════════════════════════════════════════ */
function LoginModal({ onClose, c, lang }) {
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
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)' }} onClick={onClose}/>
      <div style={{ position:'relative', zIndex:2001, width:400, maxWidth:'92vw', background:c.surface, borderTop: `3px solid ${c.accent}`, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 20px', background:c.paper2, borderBottom:`1px solid ${c.rule}` }}>
          <span style={{ fontSize:22 }}>🔐</span>
          <span style={{ fontFamily:c.fSerif, fontWeight:700, fontSize:16, color:c.ink }}>{lang==='fr'?'Connexion à OppsTrack':'Sign in to OppsTrack'}</span>
          <button style={{ marginLeft:'auto', background:'none', border:'none', fontSize:18, cursor:'pointer', color:c.ink3 }} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding:'24px' }}>
          {status==='idle'&&<><p style={{ color:c.ink2, fontSize:13, marginBottom:20, lineHeight:1.5 }}>{lang==='fr'?'Entrez votre email pour recevoir un lien magique.':'Enter your email to receive a magic link.'}</p><input type="email" placeholder={lang==='fr'?'votre@email.com':'your@email.com'} value={email} autoFocus onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} style={{ width:'100%', padding:'10px 12px', border:`1px solid ${c.ruleSoft}`, background:c.paper, color:c.ink, fontSize:13, outline:'none', fontFamily:c.fSans }}/>{errMsg&&<div style={{ color:c.danger, fontSize:11, marginTop:6 }}>{errMsg}</div>}<button style={{ width:'100%', marginTop:16, padding:'10px', background:c.accent, color:c.paper, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:c.fMono, letterSpacing:'0.05em' }} onClick={send}>✉️ {lang==='fr'?'Envoyer le lien magique':'Send magic link'}</button></>}
          {status==='sending'&&<div style={{ textAlign:'center', padding:'24px 0' }}><div style={{ width:32, height:32, border:`3px solid ${c.ruleSoft}`, borderTopColor:c.accent, borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' }}/><p style={{ color:c.ink2, marginTop:14 }}>{lang==='fr'?'Envoi...':'Sending...'}</p></div>}
          {status==='success'&&<div style={{ textAlign:'center', padding:'16px 0' }}><div style={{ fontSize:48, marginBottom:12 }}>✉️</div><div style={{ fontFamily:c.fSerif, fontSize:16, fontWeight:700, color:'#166534', marginBottom:8 }}>{lang==='fr'?'Lien envoyé !':'Link sent!'}</div><p style={{ color:c.ink2, fontSize:12 }}>{lang==='fr'?'Vérifiez votre boîte mail.':'Check your inbox.'}</p><button style={{ width:'100%', marginTop:16, padding:'10px', background:'#166534', color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }} onClick={onClose}>✓ {lang==='fr'?'Fermer':'Close'}</button></div>}
          {status==='error'&&<div style={{ textAlign:'center', padding:'16px 0' }}><div style={{ fontSize:40, marginBottom:12 }}>⚠️</div><p style={{ color:c.danger, marginBottom:12 }}>{errMsg}</p><button style={{ width:'100%', marginTop:16, padding:'10px', background:c.accent, color:c.paper, border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }} onClick={()=>{setStatus('idle');setErrMsg('');}}>Retry</button></div>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE ROADMAP
═══════════════════════════════════════════════════════════════════════════ */
export default function RoadmapPage({ user, messages, input, setInput, loading:chatLoading, handleSend, chatContainerRef, handleQuickReply }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { bourses, loading:boursesLoading, reload } = useBourses(user?.id);
  const [activeBourse, setActiveBourse] = useState(0);
  const [showChat, setShowChat] = useState(false);

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
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:c.paper, padding:24 }}>
        <div style={{ background:c.surface, border:`1px solid ${c.rule}`, padding:'48px 40px', maxWidth:380, width:'100%', textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🗺️</div>
          <h3 style={{ fontFamily:c.fSerif, fontSize:20, fontWeight:700, color:c.ink, margin:'0 0 8px' }}>{lang==='fr'?'Roadmap non disponible':'Roadmap unavailable'}</h3>
          <p style={{ color:c.ink2, fontSize:13, lineHeight:1.5, margin:'0 0 24px' }}>{lang==='fr'?'Connectez-vous pour suivre vos candidatures.':'Sign in to track your applications.'}</p>
          <button style={{ padding:'10px 28px', background:c.accent, color:c.paper, border:'none', fontSize:12, fontWeight:600, fontFamily:c.fMono, cursor:'pointer' }} onClick={()=>setShowLoginModal(true)}>🔐 {lang==='fr'?'Se connecter':'Sign in'}</button>
        </div>
      </div>
      {showLoginModal&&<LoginModal onClose={()=>setShowLoginModal(false)} c={c} lang={lang}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );

  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px' }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          {/* Colonne gauche : liste des bourses */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {boursesLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px', color: c.ink3 }}>
                <div style={{ width: 24, height: 24, border: `3px solid ${c.ruleSoft}`, borderTopColor: c.accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13 }}>{lang==='fr'?'Chargement de vos bourses…':'Loading your scholarships…'}</span>
              </div>
            )}

            {!boursesLoading && bourses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 24px', border: `1px solid ${c.ruleSoft}`, background: c.surface }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
                <div style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, color: c.ink, marginBottom: 8 }}>{lang==='fr'?'Aucune candidature en cours':'No active application'}</div>
                <div style={{ color: c.ink2, fontSize: 13, lineHeight: 1.5, maxWidth: 360, margin: '0 auto' }}>
                  {lang==='fr'
                    ?<>Allez dans <strong style={{ color: c.accent }}>Recommandations</strong> et cliquez sur <strong style={{ color: c.warn }}>🗺️ Postuler</strong> pour démarrer votre roadmap.</>
                    :<>Go to <strong style={{ color: c.accent }}>Recommendations</strong> and click <strong style={{ color: c.warn }}>🗺️ Apply</strong> to start your roadmap.</>}
                </div>
                <button style={{ marginTop: 20, padding: '8px 20px', background: c.accent, color: c.paper, border: 'none', fontSize: 12, fontWeight: 600, fontFamily: c.fMono, cursor: 'pointer' }} onClick={()=>handleQuickReply(lang==='fr'?'Recommande moi des bourses':'Recommend me scholarships')}>
                  🎯 {lang==='fr'?'Voir les recommandations':'See recommendations'}
                </button>
              </div>
            )}

            {!boursesLoading && bourses.map((bourse,i)=>(
              <BourseTimeline key={getBourseKey(bourse,i)} bourse={bourse} isActive={activeBourse===i} onSelect={()=>setActiveBourse(activeBourse===i?-1:i)} onDelete={()=>handleDeleteBourse(bourse)} onRegenerate={()=>handleRegenerate(bourse)} handleQuickReply={handleQuickReply} setShowChat={setShowChat} c={c} lang={lang} />
            ))}

            {user?.id && !boursesLoading && (
              <button style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${c.ruleSoft}`, color: c.ink3, fontSize: 11, cursor: 'pointer', alignSelf: 'flex-start', fontFamily: c.fMono }} onClick={reload}>
                🔄 {lang==='fr'?'Actualiser mes bourses':'Refresh my scholarships'}
              </button>
            )}
          </div>

          {/* Chat latéral (optionnel) */}
          {showChat && (
            <div style={{ width: 320, flexShrink: 0, background: c.surface, border: `1px solid ${c.rule}`, display: 'flex', flexDirection: 'column', position: 'sticky', top: 100, maxHeight: 'calc(100vh - 120px)', minHeight: 0 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '14px 16px', borderBottom: `2px solid ${c.warn}`, background: c.paper2 }}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.ink }}>{lang==='fr'?'Assistant Roadmap':'Roadmap Assistant'}</div>
                  <div style={{ fontSize: 10, color: c.ink3 }}>{lang==='fr'?'Conseils personnalisés par étape':'Personalized step-by-step advice'}</div>
                </div>
                <button onClick={()=>setShowChat(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: c.ink3 }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 12 }} ref={chatContainerRef}>
                {messages.length===0 && (
                  <div>
                    <p style={{ color: c.ink2, fontSize: 12, marginBottom: 12 }}>{lang==='fr'?"Demandez-moi des conseils sur n'importe quelle étape !":'Ask me for advice on any step!'}</p>
                    {(lang==='fr'
                      ?['Comment écrire une lettre de motivation percutante ?','Quels documents faut-il pour une bourse en France ?',"Comment se préparer à l'entretien de sélection ?"]
                      :['How to write a compelling motivation letter?','What documents are needed for a scholarship in France?','How to prepare for the selection interview?']
                    ).map((q,i)=>(
                      <button key={i} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: 6, background: c.paper, border: `1px solid ${c.ruleSoft}`, color: c.ink, fontSize: 11, cursor: 'pointer', fontFamily: c.fSans }} onClick={()=>handleQuickReply(q)}>{q}</button>
                    ))}
                  </div>
                )}
                {messages.slice(-20).map((msg,i)=>(
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 12, maxWidth: '92%', ...(msg.sender==='user'?{ marginLeft:'auto', flexDirection:'row-reverse' }:{}) }}>
                    {msg.sender==='ai' && <div style={{ width: 28, height: 28, background: c.paper2, border: `1px solid ${c.ruleSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🤖</div>}
                    <div style={{ padding: '8px 12px', fontSize: 12, lineHeight: 1.5, wordBreak: 'break-word', ...(msg.sender==='user'?{ background: c.accent, color: c.paper }:{ background: c.paper2, color: c.ink }) }}>{msg.text}</div>
                    {msg.sender==='user' && <div style={{ width: 28, height: 28, background: c.accent, color: c.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>👤</div>}
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, background: c.paper2, border: `1px solid ${c.ruleSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
                    <div style={{ padding: '8px 12px', background: c.paper2, display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0,1,2].map(i=><span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c.accent, display: 'inline-block', animation: `bounce 1.2s infinite ease-in-out`, animationDelay: `${i*0.2}s` }}/>)}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding: 12, borderTop: `1px solid ${c.ruleSoft}` }}>
                <ChatInput input={input} setInput={setInput} onSend={()=>handleSend()} loading={chatLoading} placeholder={lang==='fr'?'Demandez conseil sur cette étape…':'Ask advice on this step…'} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bouton flottant pour ouvrir/fermer le chat */}
      <button onClick={()=>setShowChat(p=>!p)} style={{ position: 'fixed', bottom: 24, right: 24, width: 48, height: 48, background: c.warn, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: c.paper, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000 }}>
        {showChat ? '✕' : '💬'}
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,60%,100% { transform: scale(0.7); opacity: 0.5; } 30% { transform: scale(1.1); opacity: 1; } }
      `}</style>
    </main>
  );
}