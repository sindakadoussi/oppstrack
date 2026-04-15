// RecommandationsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/config/axiosInstance';
import BourseCard from '../components/BourseCard';
import BourseDrawer from '../components/Boursedrawer';
import ChatInput from '../components/ChatInput';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';
import { useT, useDark } from '../i18n';   // ← CONTEXT GLOBAL

/* ─── Modal connexion ───────────────────────────────────────────────────── */
function LoginModal({ onClose }) {
  const { lang } = useT();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const send = async () => {
    if (!email || !email.includes('@')) { setErrMsg(lang==='fr'?'Email invalide':'Invalid email'); return; }
    setStatus('sending');
    try {
      await axiosInstance.post('/api/users/request-magic-link', { email: email.trim().toLowerCase() });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrMsg(err.response?.data?.message || (lang==='fr'?'Erreur serveur':'Server error'));
    }
  };

  return (
    <div style={M.overlay}>
      <div style={M.box}>
        <div style={M.head}>
          <span style={{ fontSize:22 }}>🔐</span>
          <span style={{ color:'#fff', fontWeight:700, fontSize:16 }}>
            {lang==='fr'?'Connexion à OppsTrack':'Sign in to OppsTrack'}
          </span>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={M.body}>
          {status==='idle' && (
            <>
              <p style={{ color:'#64748b', fontSize:14, marginBottom:20, lineHeight:1.6 }}>
                {lang==='fr'?'Entrez votre email pour recevoir un lien magique.':'Enter your email to receive a magic link.'}
              </p>
              <input type="email" placeholder={lang==='fr'?'votre@email.com':'your@email.com'}
                value={email} autoFocus onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&send()} style={M.input}/>
              {errMsg&&<div style={{ color:'#dc2626', fontSize:12, marginTop:8 }}>{errMsg}</div>}
              <button style={M.btn} onClick={send}>✉️ {lang==='fr'?'Envoyer le lien magique':'Send magic link'}</button>
            </>
          )}
          {status==='sending' && (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={M.spinner}/>
              <p style={{ color:'#64748b', marginTop:14 }}>{lang==='fr'?'Envoi...':'Sending...'}</p>
            </div>
          )}
          {status==='success' && (
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <div style={{ fontSize:52, marginBottom:12 }}>✉️</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#166534', marginBottom:8 }}>
                {lang==='fr'?'Lien envoyé !':'Link sent!'}
              </div>
              <p style={{ color:'#64748b', fontSize:13, lineHeight:1.6 }}>
                {lang==='fr'?'Vérifiez votre boîte mail (et les spams).':'Check your inbox (and spam).'}
              </p>
              <button style={{ ...M.btn, background:'#166534', marginTop:20 }} onClick={onClose}>
                ✓ {lang==='fr'?'Fermer':'Close'}
              </button>
            </div>
          )}
          {status==='error' && (
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
              <p style={{ color:'#dc2626', marginBottom:12 }}>{errMsg}</p>
              <button style={{ ...M.btn, background:'#dc2626' }} onClick={()=>{ setStatus('idle'); setErrMsg(''); }}>
                {lang==='fr'?'Réessayer':'Retry'}
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={M.backdrop} onClick={onClose}/>
    </div>
  );
}

const M = {
  overlay:  { position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' },
  backdrop: { position:'absolute', inset:0, background:'rgba(26,58,107,0.45)', backdropFilter:'blur(6px)' },
  box:      { position:'relative', zIndex:2001, width:400, maxWidth:'92vw', background:'#fff', borderRadius:10, overflow:'hidden', border:'1px solid #e2e8f0', boxShadow:'0 20px 48px rgba(26,58,107,0.18)', borderTop:'3px solid #f5a623' },
  head:     { display:'flex', alignItems:'center', gap:10, padding:'16px 20px', background:'#1a3a6b' },
  closeBtn: { marginLeft:'auto', background:'rgba(255,255,255,0.12)', border:'none', color:'#fff', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14 },
  body:     { padding:'24px' },
  input:    { width:'100%', padding:'11px 14px', borderRadius:6, border:'1.5px solid #e2e8f0', background:'#f8fafc', color:'#1a3a6b', fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:4 },
  btn:      { width:'100%', marginTop:16, padding:'12px', borderRadius:6, border:'none', background:'#1a3a6b', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
  spinner:  { width:40, height:40, border:'3px solid #eff6ff', borderTopColor:'#1a3a6b', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' },
};

/* ─── Page principale ───────────────────────────────────────────────────── */
export default function RecommandationsPage({
  user, handleSend, messages, input, setInput,
  loading: chatLoading, chatContainerRef,
  handleQuickReply, setView, onStarChange,
}) {
  // ✅ Langue et dark mode depuis le CONTEXT GLOBAL — pas depuis props
  const { t, lang } = useT();
  const { darkMode } = useDark();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading]               = useState(false);
  const [showChat, setShowChat]             = useState(false);
  const [selected, setSelected]             = useState(null);
  const [filter, setFilter]                 = useState('all');
  const [error, setError]                   = useState(null);
  const [actives, setActives]               = useState([]);
  const [expirees, setExpirees]             = useState([]);
  const [starredNoms, setStarredNoms]       = useState(new Set());
  const [appliedNoms, setAppliedNoms]       = useState(new Set());

  // CSS variables dark mode
  const bg       = darkMode ? '#0f172a' : '#f8f9fc';
  const cardBg   = darkMode ? '#1e293b' : '#fff';
  const border   = darkMode ? '#334155' : '#e2e8f0';
  const textMain = darkMode ? '#f1f5f9' : '#1a3a6b';
  const textSoft = darkMode ? '#94a3b8' : '#64748b';

  /* ── État non connecté ── */
  if (!user) {
    return (
      <>
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:bg, padding:24 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', background:cardBg, border:`1px solid ${border}`, borderRadius:12, padding:'48px 40px', boxShadow:'0 4px 20px rgba(26,58,107,0.08)', maxWidth:380, width:'100%' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🎯</div>
            <h3 style={{ color:textMain, fontWeight:700, fontSize:18, margin:'0 0 8px' }}>
              {lang==='fr'?'Recommandations non disponibles':'Recommendations unavailable'}
            </h3>
            <p style={{ color:textSoft, fontSize:13, lineHeight:1.6, maxWidth:280, textAlign:'center', margin:'0 0 24px' }}>
              {lang==='fr'
                ?'Connectez-vous pour découvrir les bourses parfaitement adaptées à votre profil.'
                :'Sign in to discover scholarships perfectly suited to your profile.'}
            </p>
            <button style={{ padding:'12px 32px', borderRadius:6, background:'#1a3a6b', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}
              onClick={()=>setShowLoginModal(true)}>
              🔐 {lang==='fr'?'Se connecter':'Sign in'}
            </button>
          </div>
        </div>
        {showLoginModal && <LoginModal onClose={()=>setShowLoginModal(false)}/>}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </>
    );
  }

  /* ── Chargement ── */
  const loadRecommandations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    try {
      const { data: userData }   = await axiosInstance.get(`/api/users/${user.id}`, { params:{ depth:0 } });
      const { data: dataFav }    = await axiosInstance.get('/api/favoris', { params:{ 'where[user][equals]':user.id, limit:1, depth:0 } });
      const docFav               = dataFav.docs?.[0];
      const newStarred           = new Set((docFav?.bourses||[]).map(b=>b.nom?.trim().toLowerCase()));
      setStarredNoms(newStarred); onStarChange?.(newStarred.size);
      const { data: dataRoadmap }= await axiosInstance.get(API_ROUTES.roadmap.list, { params:{ 'where[userId][equals]':user.id, limit:100, depth:0 } });
      setAppliedNoms(new Set((dataRoadmap.docs||[]).map(b=>b.nom?.trim().toLowerCase())));
      const profNiveau  = (userData.niveau||userData.currentLevel||user.niveau||'').toLowerCase().trim();
      const profDomaine = (userData.domaine||userData.fieldOfStudy||user.domaine||'').toLowerCase().trim();
      const profPays    = (userData.pays||user.pays||'').toLowerCase().trim();
      const { data: dataBourses }= await axiosInstance.get(API_ROUTES.bourses.list, { params:{ limit:200, depth:0 } });
      const bourses = dataBourses.docs||[];
      const scored = bourses.filter(b=>b.tunisienEligible!=='non').map(b=>{
        let score=0; const reasons=[];
        const bN=(b.niveau||'').toLowerCase(), bD=(b.domaine||'').toLowerCase(), bP=(b.pays||'').toLowerCase();
        if (b.tunisienEligible==='oui'){score+=30;reasons.push(lang==='fr'?'Ouverte aux Tunisiens':'Open to Tunisians');}
        if (profNiveau&&bN.includes(profNiveau)){score+=25;reasons.push(lang==='fr'?`Niveau ${b.niveau} correspond`:`Level ${b.niveau} matches`);}
        else if (bN.includes('tous')||bN===''){score+=12;reasons.push(lang==='fr'?'Tous niveaux acceptés':'All levels accepted');}
        if (profDomaine&&bD.includes(profDomaine)){score+=20;reasons.push(lang==='fr'?`Domaine ${b.domaine} correspond`:`Field ${b.domaine} matches`);}
        else if (bD.includes('tous')||bD===''){score+=10;reasons.push(lang==='fr'?'Tous domaines acceptés':'All fields accepted');}
        if (b.statut==='active'){score+=15;reasons.push(lang==='fr'?'Candidatures ouvertes':'Applications open');}
        if (b.statut==='a_venir'){score+=8;reasons.push(lang==='fr'?'Bientôt disponible':'Coming soon');}
        if (b.dateLimite){const j=Math.floor((new Date(b.dateLimite)-new Date())/86400000);if(j>30)score+=3;}
        if (profPays&&(bP.includes(profPays)||bP.includes('international')))score+=2;
        return {...b, matchScore:score, matchReasons:reasons};
      });
      const newActives = scored.filter(b=>b.statut!=='expiree'&&b.matchScore>25).sort((a,b)=>b.matchScore-a.matchScore).slice(0,8);
      const newExpirees= scored.filter(b=>b.statut==='expiree'&&b.matchScore>25).sort((a,b)=>b.matchScore-a.matchScore).slice(0,4);
      setActives(newActives.length>0?newActives:bourses.filter(b=>b.statut!=='expiree').slice(0,5).map(b=>({...b,matchScore:0,matchReasons:[]})));
      setExpirees(newExpirees);
    } catch (err) {
      setError((lang==='fr'?'Impossible de charger les recommandations : ':'Could not load recommendations: ')+(err.response?.data?.message||err.message));
    } finally { setLoading(false); }
  }, [user, onStarChange, lang]);

  const handleStar = async (bourse, isStarred) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id) return;
    try {
      const { data } = await axiosInstance.get('/api/favoris', { params:{ 'where[user][equals]':user.id, limit:1, depth:0 } });
      const doc = data.docs?.[0];
      if (isStarred) {
        if (!doc?.id) return;
        await axiosInstance.patch(`/api/favoris/${doc.id}`, { bourses:(doc.bourses||[]).filter(b=>b.nom?.trim().toLowerCase()!==nomKey) });
        setStarredNoms(prev=>{ const s=new Set(prev); s.delete(nomKey); onStarChange?.(s.size); return s; });
      } else {
        const nb = { nom:bourse.nom, pays:bourse.pays||'', lienOfficiel:bourse.lienOfficiel||'', financement:bourse.financement||'', dateLimite:bourse.dateLimite||null, ajouteLe:new Date().toISOString() };
        if (doc?.id) await axiosInstance.patch(`/api/favoris/${doc.id}`, { bourses:[...(doc.bourses||[]),nb] });
        else await axiosInstance.post('/api/favoris', { user:user.id, userEmail:user.email||'', bourses:[nb] });
        setStarredNoms(prev=>{ const s=new Set([...prev,nomKey]); onStarChange?.(s.size); return s; });
      }
    } catch(err){ console.error('[handleStar]',err); }
  };

  const handleApply = async (bourse) => {
    const nomKey = bourse.nom?.trim().toLowerCase();
    if (!user?.id||appliedNoms.has(nomKey)) return;
    try {
      const res = await axiosInstance.post(API_ROUTES.roadmap.create, {
        userId:user.id, userEmail:user.email||'', nom:bourse.nom, pays:bourse.pays||'',
        lienOfficiel:bourse.lienOfficiel||'', financement:bourse.financement||'',
        dateLimite:bourse.dateLimite||null, ajouteLe:new Date().toISOString(), statut:'en_cours', etapeCourante:0,
      });
      await axiosInstance.post(WEBHOOK_ROUTES.generateRoadmap, {
        roadmapId:res.data.doc.id,
        user:{ id:user.id, email:user.email, niveau:user.niveau, domaine:user.domaine },
        bourse:{ nom:bourse.nom, pays:bourse.pays, lien:bourse.lienOfficiel },
      });
      setAppliedNoms(prev=>new Set([...prev,nomKey]));
      setTimeout(()=>setView?.('roadmap'),1000);
    } catch(err){
      console.error('[handleApply]',err);
      alert(lang==='fr'?"Erreur lors de l'initialisation.":"Error initializing application.");
    }
  };

  const handleAskAI = useCallback((bourse) => {
    setShowChat(true);
    setInput(lang==='fr'
      ?`Peux-tu me dire si je suis éligible à la bourse "${bourse.nom}" en ${bourse.pays} ?`
      :`Can you tell me if I'm eligible for the "${bourse.nom}" scholarship in ${bourse.pays}?`);
  }, [setInput, lang]);

  useEffect(()=>{ loadRecommandations(); }, [loadRecommandations]);

  const filtered = filter==='actives' ? actives : filter==='expirees' ? expirees : [...actives,...expirees];

  return (
    <div style={{ width:'100%', background:bg, minHeight:'100vh', fontFamily:"'Segoe UI',system-ui,sans-serif", position:'relative', paddingBottom:40, transition:'background .25s,color .25s', color:textMain }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 32px' }}>

        {/* ── Stats ── */}
        <div style={{ display:'flex', gap:12, padding:'20px 0 0', flexWrap:'wrap' }}>
          {[
            { num:actives.length,    color:'#166534', bg:'#f0fdf4', border:'#bbf7d0', label:lang==='fr'?'Actives':'Active' },
            { num:expirees.length,   color:'#d97706', bg:'#fffbeb', border:'#fde68a', label:lang==='fr'?'À préparer':'To prepare' },
            { num:starredNoms.size,  color:'#d97706', bg:'#fefce8', border:'#fde68a', label:lang==='fr'?'★ Favoris':'★ Favorites' },
            { num:appliedNoms.size,  color:'#1a3a6b', bg:'#eff6ff', border:'#bfdbfe', label:'🗺️ Roadmap' },
          ].map((s,i)=>(
            <div key={i} style={{ background:darkMode?cardBg:s.bg, border:`1px solid ${darkMode?border:s.border}`, borderRadius:8, padding:'12px 20px', minWidth:80, textAlign:'center', boxShadow:'0 1px 4px rgba(26,58,107,0.06)' }}>
              <div style={{ fontSize:'1.6rem', fontWeight:800, color:s.color }}>{s.num}</div>
              <div style={{ fontSize:11, color:textSoft, marginTop:2, textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filtres ── */}
        <div style={{ display:'flex', background:cardBg, borderRadius:8, border:`1px solid ${border}`, marginTop:16, overflow:'hidden', width:'fit-content' }}>
          {[
            { id:'all',      label:`${lang==='fr'?'Toutes':'All'} (${actives.length+expirees.length})` },
            { id:'actives',  label:`✅ ${lang==='fr'?'Actives':'Active'} (${actives.length})` },
            { id:'expirees', label:`📅 ${lang==='fr'?'À préparer':'To prepare'} (${expirees.length})` },
          ].map((f,i)=>(
            <button key={f.id} style={{ padding:'9px 20px', border:'none', borderRight:i<2?`1px solid ${border}`:'none', background:filter===f.id?'#1a3a6b':cardBg, color:filter===f.id?'#fff':textSoft, fontSize:13, cursor:'pointer', fontWeight:filter===f.id?700:400, fontFamily:'inherit' }}
              onClick={()=>setFilter(f.id)}>{f.label}</button>
          ))}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 20px' }}>
            <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid #e2e8f0', borderTopColor:'#1a3a6b', animation:'spin 1s linear infinite' }}/>
            <p style={{ color:textSoft, marginTop:16 }}>{lang==='fr'?'Analyse de votre profil...':'Analyzing your profile...'}</p>
          </div>
        )}

        {/* ── Erreur ── */}
        {error && !loading && (
          <div style={{ margin:'20px 0', padding:'14px 18px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, color:'#dc2626', fontSize:13, display:'flex', justifyContent:'space-between', gap:12, alignItems:'center' }}>
            ⚠️ {error}
            <button style={{ padding:'6px 14px', borderRadius:6, background:'#dc2626', border:'none', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 }} onClick={loadRecommandations}>
              {lang==='fr'?'Réessayer':'Retry'}
            </button>
          </div>
        )}

        {/* ── Grille + Chat ── */}
        <div style={{ display:'flex', gap:24, alignItems:'flex-start', marginTop:16 }}>
          <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
            {filtered.length===0 ? (
              <div style={{ textAlign:'center', padding:'80px 20px' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>📭</div>
                <div style={{ fontSize:16, fontWeight:700, color:textMain, marginBottom:8 }}>
                  {lang==='fr'?'Aucune recommandation trouvée':'No recommendations found'}
                </div>
                <p style={{ color:textSoft }}>{lang==='fr'?'Complétez votre profil pour de meilleures suggestions':'Complete your profile for better suggestions'}</p>
              </div>
            ) : filtered.map(b=>(
              <BourseCard key={b.id} bourse={b} user={user}
                onAskAI={handleAskAI} onClick={()=>setSelected(b)}
                starred={starredNoms.has(b.nom?.trim().toLowerCase())} onStar={handleStar}
                applied={appliedNoms.has(b.nom?.trim().toLowerCase())} onApply={handleApply}/>
            ))}
          </div>

          {/* Chat latéral */}
          {showChat && (
            <div style={{ width:320, flexShrink:0, background:cardBg, border:`1px solid ${border}`, borderRadius:10, position:'sticky', top:110, display:'flex', flexDirection:'column', maxHeight:'calc(100vh - 130px)', minHeight:0, boxShadow:'0 4px 16px rgba(26,58,107,0.08)', zIndex:90 }}>
              <div style={{ display:'flex', gap:10, alignItems:'center', padding:'14px 16px', borderBottom:'2px solid #f5a623', background:'#1a3a6b', borderTopLeftRadius:10, borderTopRightRadius:10 }}>
                <span style={{ fontSize:20 }}>🤖</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{lang==='fr'?'Assistant Bourses':'Scholarship Assistant'}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{lang==='fr'?'Conseils personnalisés':'Personalized advice'}</div>
                </div>
                <button onClick={()=>setShowChat(false)} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:32, height:32, borderRadius:6, cursor:'pointer', fontSize:16, marginLeft:'auto' }}>✕</button>
              </div>
              <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:12 }} ref={chatContainerRef}>
                {messages.length===0 && (
                  <div style={{ padding:12 }}>
                    <p style={{ color:textSoft, fontSize:13, marginBottom:12 }}>{lang==='fr'?'Demandez-moi des conseils sur une bourse !':'Ask me for advice on a scholarship!'}</p>
                    {(lang==='fr'?['Lettre de motivation ?','Documents requis ?']:['Motivation letter?','Required documents?']).map((q,i)=>(
                      <button key={i} style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 12px', borderRadius:6, background:cardBg, border:`1px solid ${border}`, color:textMain, fontSize:12, cursor:'pointer', marginBottom:6, fontFamily:'inherit' }}
                        onClick={()=>handleQuickReply(q)}>{q}</button>
                    ))}
                  </div>
                )}
                {messages.map((msg,i)=>(
                  <div key={i} style={{ display:'flex', gap:8, marginBottom:12, maxWidth:'92%', ...(msg.sender==='user'?{ marginLeft:'auto', flexDirection:'row-reverse' }:{}) }}>
                    <div style={{ padding:'10px 14px', borderRadius:10, fontSize:13, lineHeight:1.5, ...(msg.sender==='user'?{ background:'#1a3a6b', color:'#fff' }:{ background:darkMode?'#334155':'#f1f5f9', color:textMain }) }}>{msg.text}</div>
                  </div>
                ))}
                {chatLoading&&<div style={{ padding:12, fontSize:12, color:textSoft }}>{lang==='fr'?"L'IA réfléchit...":'AI is thinking...'}</div>}
              </div>
              <div style={{ padding:12, borderTop:`1px solid ${border}` }}>
                <ChatInput input={input} setInput={setInput} onSend={()=>handleSend()} loading={chatLoading}/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bouton chat flottant */}
      <button onClick={()=>setShowChat(p=>!p)} style={{ position:'fixed', bottom:24, right:24, width:56, height:56, borderRadius:'50%', background:'#f5a623', border:'none', boxShadow:'0 4px 12px rgba(26,58,107,0.3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'#1a3a6b', zIndex:1000 }}>
        {showChat?'✕':'💬'}
      </button>

      {/* Drawer */}
      {selected && (
        <BourseDrawer bourse={selected} onClose={()=>setSelected(null)} onAskAI={handleAskAI}
          starred={starredNoms.has(selected.nom?.trim().toLowerCase())} onStar={handleStar}
          applied={appliedNoms.has(selected.nom?.trim().toLowerCase())} onApply={handleApply} user={user}/>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}