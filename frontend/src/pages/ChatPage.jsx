import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ChatInput from '../components/ChatInput';
import axiosInstance from '@/config/axiosInstance';
import BourseDrawer from '../components/Boursedrawer';
import { API_ROUTES } from '@/config/routes';
import { useT, LanguageToggle } from '../i18n';

/* ═══════════════════════════════════════════════════════════════════════════
   QUICK REPLIES
═══════════════════════════════════════════════════════════════════════════ */
const getQuickReplies = (lang) => [
  { emoji:'🎓', label: lang === 'fr' ? 'Trouver mes bourses' : 'Find my scholarships', text: lang === 'fr' ? 'Quelles bourses correspondent à mon profil ?' : 'Which scholarships match my profile?' },
  { emoji:'🔐', label: lang === 'fr' ? 'Me connecter' : 'Sign in', text: lang === 'fr' ? 'Je veux me connecter' : 'I want to sign in' },
  { emoji:'🗺️', label: lang === 'fr' ? 'Voir la roadmap' : 'View roadmap', text: lang === 'fr' ? 'Montre-moi la roadmap pour postuler' : 'Show me the application roadmap' },
  { emoji:'🎙️', label: lang === 'fr' ? 'Préparer un entretien' : 'Prepare for interview', text: lang === 'fr' ? "Je veux m'entraîner pour un entretien de bourse" : 'I want to practice for a scholarship interview' },
  { emoji:'📄', label: lang === 'fr' ? 'Analyser mon CV' : 'Analyze my CV', text: lang === 'fr' ? 'Je veux analyser mon CV' : 'I want to analyze my CV' },
  { emoji:'❌', label: lang === 'fr' ? 'Mode invité' : 'Guest mode', text: lang === 'fr' ? 'Non, je ne veux pas me connecter, continuer en invité' : 'No, I don\'t want to sign in, continue as guest' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   HERO STATS
═══════════════════════════════════════════════════════════════════════════ */
function useHeroStats() {
  const [stats, setStats] = useState({ totalBourses:null, pctFinancees:null, loaded:false });
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await axiosInstance.get(API_ROUTES.bourses.list, { params:{ limit:500, depth:0 } });
        const docs = res.data.docs || [];
        const total = res.data.totalDocs ?? docs.length;
        const fin = docs.filter(b => { const f=(b.financement||'').toLowerCase(); return f.includes('100')||f.includes('total')||f.includes('complet')||f.includes('intégral'); });
        setStats({ totalBourses:total, pctFinancees:total>0?Math.round((fin.length/total)*100):null, loaded:true });
      } catch {
        setStats({ totalBourses:500, pctFinancees:98, loaded:true });
      }
    };
    fetch_();
  }, []);
  return stats;
}

function StatNumber({ value, suffix='', loading }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (loading||value===null) return;
    const target=parseInt(value), steps=30, inc=target/steps;
    let step=0;
    const t=setInterval(()=>{ step++; setDisplayed(Math.min(Math.round(inc*step),target)); if(step>=steps)clearInterval(t); }, 800/steps);
    return ()=>clearInterval(t);
  }, [value,loading]);
  if (loading||value===null) return <span className="stat-num stat-loading">—</span>;
  return <span className="stat-num">{displayed}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PARSE BOURSES - VERSION CORRIGÉE & MULTILINGUE
═══════════════════════════════════════════════════════════════════════════ */
function parseBourses(msg) {
  // ✅ Priorité 1 : JSON structuré depuis l'IA
  if (msg?.bourses && Array.isArray(msg.bourses) && msg.bourses.length > 0) {
    return msg.bourses.map(b => ({
      ...b, _fromText: false,
      nom: b.nom?.trim(), pays: b.pays?.trim()||'', financement: b.financement?.trim()||'',
      niveau: b.niveau?.trim()||'', description: b.description?.trim()||'',
      lienOfficiel: b.lienOfficiel?.trim()||'', domaine: b.domaine?.trim()||''
    }));
  }

  const text = msg?.text || '';
  if (!text) return [];

  const lines = text.split('\n');
  const bourses = [];
  let current = null;

  // 🎯 Détection faux titres
  const isFakeTitle = (nom) => {
    if (!nom) return true;
    const n = nom.trim();
    return n.length < 8 || 
           /^(consultez|notez|préparez|prochaines étapes|voir détails|apply|click|summary)/i.test(n) ||
           /^[\*\_#\-•\d\s]+$/.test(n);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 🚫 STOP UI
    if (/prochaines étapes|💡|voir \d+ bourses|selon votre profil|summary/i.test(line)) break;

    // 🔥 Détection nouvelle bourse : "### 1️⃣ Nom" OU "1. Nom" OU "1) Nom"
    // ✅ Supporte : ###, ##, #, emojis ️⃣, chiffres avec . ou )
      const start = line.match(/^(?:#+\s*)?(\d+)[\.\)\s]*[️⃣]?\s*(.+)/);
    
    if (start) {
      if (current?.nom && current.nom.length >= 8) bourses.push(current);
      
      let nom = start[2].replace(/^[^:]+:\s*/, '').replace(/\*\*/g, '').trim();
      nom = nom.replace(/^[\uFE0F\u20E3\s]+/, '').trim();

      if (isFakeTitle(nom)) { current = null; continue; }

      current = { nom, pays:'', financement:'', niveau:'', description:'', lienOfficiel:'', domaine:'', _fromText:true };
      continue;
    }

    if (!current) continue;
    if (/^[🎓🌍💰📋🔍•\-_\*#]+$/.test(line) || /voir détails|postuler|apply now|click here/i.test(line)) continue;

    // ✅ Parsing champs AVEC bullets + emojis + séparateurs variés
    // Supporte : "• - 🌍 Pays : X" OU "Pays: X" OU "Financement - X"
    const fieldMatch = 
      line.match(/^(?:•\s*[-–]?\s*)?(?:🌍\s*)?(pays|country|land|país)\s*[:\-–]\s*(.+)/i) ||
      line.match(/^(?:•\s*[-–]?\s*)?(?:💰\s*)?(financement|funding|scholarship type)\s*[:\-–]\s*(.+)/i) ||
      line.match(/^(?:•\s*[-–]?\s*)?(?:🎓\s*)?(niveau|level|study)\s*[:\-–]\s*(.+)/i) ||
      line.match(/^(?:•\s*[-–]?\s*)?(?:📝\s*)?(description|details|about)\s*[:\-–]\s*(.+)/i) ||
      line.match(/^(?:•\s*[-–]?\s*)?(?:📚\s*)?(domaine|field|discipline)\s*[:\-–]\s*(.+)/i);

    if (fieldMatch) {
      const key = fieldMatch[1].toLowerCase();
      const value = fieldMatch[2]?.trim() || '';
      if (/pays|country|land|país/.test(key)) current.pays = value;
      else if (/financement|funding/.test(key)) current.financement = value;
      else if (/niveau|level|study/.test(key)) current.niveau = value;
      else if (/description|details|about/.test(key)) current.description = value;
      else if (/domaine|field/.test(key)) current.domaine = value;
      continue;
    }

    // ✅ URL : support [text](url) ET (url)
    if (!current.lienOfficiel) {
      const link = line.match(/\[.*?\]\((https?:\/\/[^)]+)\)/) || line.match(/\((https?:\/\/[^)]+)\)/);
      if (link) { current.lienOfficiel = link[1]; continue; }
    }
  }

  if (current?.nom && current.nom.length >= 8) bourses.push(current);

  // 🧠 Déduplication + filtrage
  const unique = [], seen = new Set();
  for (const b of bourses) {
    if (!b?.nom) continue;
    const key = b.nom.toLowerCase().trim();
    if (!seen.has(key) && b.nom.length >= 8 && !/^(consultez|notez|préparez|apply|click)/i.test(b.nom)) {
      seen.add(key);
      unique.push({ ...b, nom:b.nom.trim(), pays:b.pays?.trim()||'', financement:b.financement?.trim()||'', niveau:b.niveau?.trim()||'', description:b.description?.trim()||'', lienOfficiel:b.lienOfficiel?.trim()||'', domaine:b.domaine?.trim()||'' });
    }
  }

  if (process.env.NODE_ENV === 'development' && unique.length > 0) {
    console.log('✅ parseBourses:', unique.length, 'bourses:', unique.map(b => b.nom));
  }
  return unique;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CLEAN MESSAGE TEXT - AVEC PARAMÈTRE LANG
═══════════════════════════════════════════════════════════════════════════ */
function cleanMessageText(text, lang = 'fr') {
  if (!text) return '';

  // ✅ 1. Nettoyer les blocs techniques JSON/markdown
  let t = text
    .replace(/\[\[BOURSES:[\s\S]*?\]\]/g, '')
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/BOURSES_JSON:[\s\S]*?(?=\n\n|$)/g, '');

  // ✅ 2. Split en lignes et filtrage agressif
  const lines = t.split('\n');
  const cleanLines = [];
  let inBourseSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 🚫 DÉTECTER le début d'une section "bourses" (pour tout skip jusqu'à la fin)
    if (/^#{0,3}\s*(?:[🏥🎓✨💡]\s*)?(?:bourses|recommandées|scholarships|liste|voici les)/i.test(trimmed)) {
      inBourseSection = true;
      continue;
    }

    // 🚫 Si on est dans la section bourses, skip TOUT sauf la conclusion
    if (inBourseSection) {
      // ✅ Sortir de la section si on voit "Prochaines étapes", "Astuce", "Prêt", "✨", "💡", "💬"
      if (/^(###\s*)?(?:📌\s*Prochaines|✨|💡|💬|Prêt|Astuce|Conseil|Note|Bonne chance)/i.test(trimmed)) {
        inBourseSection = false;
        cleanLines.push(trimmed);
        continue;
      }
      // ❌ Skip tout le reste pendant la section bourses
      continue;
    }

    // 🚫 Skip les séparateurs visuels
    if (/^[-*_]{3,}$/.test(trimmed)) continue;

    // 🚫 Skip les bullets avec emojis de champs (détails de bourses)
    if (/^•\s*[-–]?\s*[🌍💰🎓📝🔗📚]/.test(trimmed)) continue;

    // 🚫 Skip les lignes commençant par emoji + champ
    if (/^[🌍💰🎓📝🔗]\s+[\w\-:]/.test(trimmed)) continue;

    // 🚫 Skip les liens markdown ou URLs de bourses
    if (/\[Lien officiel|Official link\]\(https?:\/\//i.test(trimmed) || 
        /^https?:\/\/[^\s]+(?:scholarship|bourse)/i.test(trimmed)) {
      continue;
    }

    // 🚫 Skip les items de liste numérotée (au cas où)
    if (/^(?:#{1,3}\s*)?\d+[\.\)\s]*[️⃣]?\s*[^\n]{10,}/.test(trimmed)) continue;

    // ✅ Garder tout le reste : intro, conseils, conclusion
    cleanLines.push(trimmed);
  }

  const result = cleanLines.join('\n').trim();
  const defaultMsg = lang === 'fr' 
    ? "Voici les bourses qui correspondent à votre profil :" 
    : "Here are the scholarships matching your profile:";
    
  return result.length > 10 ? result : defaultMsg;
}

/* ═══════════════════════════════════════════════════════════════════════════
   BOURSE CARD COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
function BourseCard({ bourse, onApply, onDetails, applied, index }) {
  const [applying, setApplying] = useState(false);
  const [appDone, setAppDone] = useState(applied);

  const dl = bourse.dateLimite ? new Date(bourse.dateLimite) : null;
  const daysLeft = dl ? Math.round((dl - new Date()) / 86400000) : null;
  const deadlineColor = daysLeft === null ? '#64748b' : daysLeft < 0 ? '#dc2626' : daysLeft <= 7 ? '#d97706' : daysLeft <= 30 ? '#2563eb' : '#166534';

  const getBadge = () => {
    const f = (bourse.financement || '').toLowerCase();
    if (f.includes('100')||f.includes('total')||f.includes('complet')||f.includes('intégral')) return {label:'100% financée',color:'#166534',bg:'#f0fdf4',border:'#86efac'};
    if (f.includes('partiel')||f.includes('50')) return {label:'Partielle',color:'#d97706',bg:'#fffbeb',border:'#fde68a'};
    if (bourse.financement) return {label:'Financement dispo',color:'#2563eb',bg:'#eff6ff',border:'#bfdbfe'};
    return null;
  };
  const badge = getBadge();

  const handleApply = async () => {
    if (appDone) return;
    setApplying(true);
    await onApply?.(bourse);
    setAppDone(true);
    setApplying(false);
  };

  return (
    <div className={`bourse-card bourse-card-${index % 3}`} style={{animationDelay:`${index*0.08}s`}}>
      <div className="bourse-card-bar"/>
      <div className="bc-header">
        <div className="bc-flag">{bourse.pays ? <span title={bourse.pays}>{{'France':'🇫🇷','Allemagne':'🇩🇪','Royaume-Uni':'🇬🇧','États-Unis':'🇺🇸','Canada':'🇨🇦','Australie':'🇦🇺','Japon':'🇯🇵','Maroc':'🇲🇦','Tunisie':'🇹🇳','Belgique':'🇧🇪','Suisse':'🇨🇭','Pays-Bas':'🇳🇱','Suède':'🇸🇪','Italie':'🇮🇹','Espagne':'🇪🇸','Chine':'🇨🇳','Corée du Sud':'🇰🇷','International':'🌍','Mondial':'🌐'}[bourse.pays]||'🌍'}</span> : '🌍'}</div>
        <div className="bc-title-wrap" style={{cursor:'pointer'}} onClick={()=>onDetails?.(bourse)}>
          <h4 className="bc-title">{bourse.nom}</h4>
          {bourse.pays && <div className="bc-pays">{bourse.pays}</div>}
        </div>
      </div>
      <div className="bc-badges">
        {badge && <span className="bc-badge" style={{color:badge.color,background:badge.bg,borderColor:badge.border}}>✓ {badge.label}</span>}
        {daysLeft !== null && <span className="bc-badge" style={{color:deadlineColor,background:`${deadlineColor}15`,borderColor:`${deadlineColor}40`}}>⏰ {daysLeft<0?'Expiré':daysLeft===0?"Aujourd'hui":`${daysLeft}j`}</span>}
        {bourse.niveau && <span className="bc-badge bc-badge-neutral">🎓 {bourse.niveau}</span>}
      </div>
      {bourse.financement && <div className="bc-financement"><span>💰</span><span>{bourse.financement.slice(0,90)}{bourse.financement.length>90?'…':''}</span></div>}
      {bourse.domaine && <div className="bc-domaine">📚 {bourse.domaine}</div>}
      {dl && <div className="bc-deadline" style={{color:deadlineColor}}>📅 Deadline : {dl.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>}
      <div className="bc-actions">
        {bourse.lienOfficiel && <a href={bourse.lienOfficiel} target="_blank" rel="noopener noreferrer" className="bc-btn bc-btn-outline">🔗 Site</a>}
        <button className="bc-btn bc-btn-secondary" onClick={()=>onDetails?.(bourse)}>🔍 Détails</button>
        <button className={`bc-btn bc-btn-primary ${appDone?'bc-btn-done':''}`} onClick={handleApply} disabled={appDone||applying}>{applying?'⏳':appDone?'✓ Ajouté':'📋 Postuler'}</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BOURSE CARDS GRID
═══════════════════════════════════════════════════════════════════════════ */
function BourseCardsGrid({ bourses, onApply, onDetails, appliedNoms, allBourses }) {
  const [visible, setVisible] = useState(3);
  if (!bourses || bourses.length === 0) return null;

  const enrich = (b) => {
    if (!b._fromText || !allBourses?.length) return b;
    const found = allBourses.find(db => {
      const a=(db.nom||'').toLowerCase().trim(), c=(b.nom||'').toLowerCase().trim();
      return a===c || a.includes(c.slice(0,12)) || c.includes(a.slice(0,12));
    });
    return found ? {...found,_enriched:true} : b;
  };

  return (
    <div className="bc-grid-wrap">
      <div className="bc-grid-header"><span className="bc-grid-icon">🎓</span><span className="bc-grid-title">{bourses.length} bourse{bourses.length>1?'s':''} recommandée{bourses.length>1?'s':''}</span><span className="bc-grid-sub">selon votre profil</span></div>
      <div className="bc-grid">
        {bourses.slice(0,visible).map((b,i)=><BourseCard key={b.id||b.nom||i} bourse={b} index={i} applied={appliedNoms?.has(b.nom?.trim().toLowerCase())} onApply={onApply} onDetails={(bo)=>onDetails?.(enrich(bo))}/>)}
      </div>
      {visible<bourses.length && <button className="bc-show-more" onClick={()=>setVisible(v=>v+3)}>Voir {Math.min(3,bourses.length-visible)} bourse{Math.min(3,bourses.length-visible)>1?'s':''} de plus ↓</button>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT MESSAGE - VERSION CORRIGÉE (ordre des variables fixé)
═══════════════════════════════════════════════════════════════════════════ */
function ChatMessage({ msg, index, appliedNoms, onApply, onDetails, handleQuickReply, allBourses, lang }) {
  const isAI = msg.sender === 'ai';

  const detectedBourses = useMemo(() => { if(!isAI)return[]; return parseBourses(msg); }, [msg,isAI]);
const cleanText = useMemo(() => {
    if (!isAI) return msg.text;
    return cleanMessageText(msg.text || '', lang);
  }, [msg.text, isAI, lang]);
  const formatText = (text) => {
    if(!text)return null;
    return text.split('\n').map((line,i)=>{
      const parts=line.split(/(\*\*[^*]+\*\*)/g).map((part,j)=>part.startsWith('**')&&part.endsWith('**')?<strong key={j}>{part.slice(2,-2)}</strong>:part);
      if(/^\s*[-•·✓→★\d+\.]\s/.test(line))return <div key={i} className="msg-list-item">• {parts}</div>;
      if(line.trim()==='')return <br key={i}/>;
      return <div key={i}>{parts}</div>;
    });
  };

  // ✅ validBourses définie AVANT le useEffect qui l'utilise
  const validBourses = detectedBourses.filter(b => b.nom && b.nom.length>8 && !/chercher|recevoir|consulter|préparer|notez|vérifiez|consultez/i.test(b.nom));

  // ✅ useEffect APRÈS validBourses + dépendances correctes
  useEffect(() => {
    if(isAI && process.env.NODE_ENV==='development'){
      console.log('🔍 DEBUG parseBourses:',{hasArray:Array.isArray(msg.bourses),boursesLen:msg.bourses?.length,detected:detectedBourses.length,valid:validBourses.length,noms:validBourses.map(b=>b.nom)});
    }
  },[msg,isAI,detectedBourses,validBourses]);

  const hasCards = validBourses.length > 0;

  if(!isAI){
    return (<div className="msg user" style={{animationDelay:`${index*0.04}s`}}><div className="msg-content"><div className="msg-bubble"><div className="msg-text">{formatText(msg.text)}</div></div></div><div className="msg-avatar msg-avatar-user">👤</div></div>);
  }

  if(!hasCards){
    return (<div className="msg ai" style={{animationDelay:`${index*0.04}s`}}><div className="msg-avatar"><img src="/logo.png" alt="IA" style={{width:20,height:20,objectFit:'contain',borderRadius:4}} onError={e=>{e.target.style.display='none';e.target.parentNode.innerHTML='🤖';}}/></div><div className="msg-content">{cleanText && <div className="msg-bubble"><div className="msg-text">{formatText(cleanText)}</div>{msg.voiceInput&&<div className="voice-badge">🎤 Vocal</div>}</div>}</div></div>);
  }

  return (
    <div className="msg-with-cards" style={{animationDelay:`${index*0.04}s`}}>
      <div className="msg-intro-row">
        <div className="msg-avatar"><img src="/logo.png" alt="IA" style={{width:20,height:20,objectFit:'contain',borderRadius:4}} onError={e=>{e.target.style.display='none';e.target.parentNode.innerHTML='🤖';}}/></div>
        {cleanText && <div className="msg-bubble msg-bubble-intro"><div className="msg-text">{formatText(cleanText)}</div></div>}
      </div>
      <BourseCardsGrid bourses={validBourses} appliedNoms={appliedNoms} onApply={onApply} onDetails={onDetails} allBourses={allBourses} onAskAI={(b)=>handleQuickReply?.(`Donne-moi plus de détails sur "${b.nom}"`)}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCROLL BUTTON
═══════════════════════════════════════════════════════════════════════════ */
function ScrollToBottomButton({onClick,visible}){if(!visible)return null;return(<button className="scroll-btn" onClick={onClick} title="Aller en bas"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>);}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CHAT PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function ChatPage({user,messages,input,setInput,loading,handleSend,handleQuickReply,chatContainerRef,setView,bourses=[],appliedNoms,onApplyBourse}){
  const {t,lang}=useT();
  const heroStats=useHeroStats();
  const [showScroll,setShowScroll]=useState(false);
  const localRef=useRef(null);
  const containerRef=chatContainerRef||localRef;
  const quickReplies=getQuickReplies(lang);
  const [drawer,setDrawer]=useState(null);
  const appliedSet=useMemo(()=>appliedNoms instanceof Set?appliedNoms:new Set((appliedNoms||[]).map(n=>n?.trim().toLowerCase())),[appliedNoms]);
  const [starredNoms, setStarredNoms] = useState(new Set());
const [appliedNomsLocal, setAppliedNomsLocal] = useState(new Set());
  const scrollToBottom=()=>{if(containerRef.current)containerRef.current.scrollTop=containerRef.current.scrollHeight;};
  useEffect(()=>{scrollToBottom();},[messages,loading]);
  useEffect(()=>{setTimeout(scrollToBottom,100);},[]);
  useEffect(()=>{const el=containerRef.current;if(!el)return;const check=()=>setShowScroll(el.scrollHeight-el.scrollTop-el.clientHeight>100);el.addEventListener('scroll',check);check();return()=>el.removeEventListener('scroll',check);},[]);
  // ✅ Handler Favoris - appelle l'IA + met à jour l'état local
/* ═══════════════════════════════════════════════════════════════════════════
   HANDLERS FAVORIS & ROADMAP - APPELS API RÉELS
═══════════════════════════════════════════════════════════════════════════ */

// ✅ Favoris : Appel API + mise à jour état local
const handleStar = useCallback(async (bourse, isStarred) => {
  const nomKey = bourse.nom?.trim().toLowerCase();
  if (!user?.id) return;

  try {
    // ✅ 1. Récupérer le doc favoris existant (destructuring CORRECT)
    const { data: favData } = await axiosInstance.get('/api/favoris', {
      params: { 'where[user][equals]': user.id, limit: 1, depth: 0 }
    });
    const favDoc = favData.docs?.[0];

    const bourseData = {
      nom: bourse.nom,
      pays: bourse.pays || '',
      lienOfficiel: bourse.lienOfficiel || '',
      financement: bourse.financement || '',
      dateLimite: bourse.dateLimite || null,
      ajouteLe: new Date().toISOString()
    };

    if (isStarred) {
      // ❌ Retirer des favoris
      if (favDoc?.id) {
        await axiosInstance.patch(`/api/favoris/${favDoc.id}`, {
          bourses: (favDoc.bourses || []).filter(b => b.nom?.trim().toLowerCase() !== nomKey)
        });
      }
      setStarredNoms(prev => { const s = new Set(prev); s.delete(nomKey); return s; });
    } else {
      // ✅ Ajouter aux favoris
      if (favDoc?.id) {
        await axiosInstance.patch(`/api/favoris/${favDoc.id}`, {
          bourses: [...(favDoc.bourses || []), bourseData]
        });
      } else {
        await axiosInstance.post('/api/favoris', {
          user: user.id,
          userEmail: user.email || '',
          bourses: [bourseData]
        });
      }
      setStarredNoms(prev => new Set([...prev, nomKey]));
    }
  } catch (err) {
    console.error('[handleStar]', err);
    alert(lang === 'fr' ? 'Erreur lors de la mise à jour des favoris' : 'Error updating favorites');
  }
}, [user, lang]);

// ✅ Postuler : Appel API roadmap + webhook + mise à jour état
const handleApply = useCallback(async (bourse) => {
  const nomKey = bourse.nom?.trim().toLowerCase();
  if (!user?.id || appliedSet.has(nomKey) || appliedNomsLocal.has(nomKey)) return;

  try {
    // 1. Créer l'entrée roadmap
    const res = await axiosInstance.post(API_ROUTES.roadmap.create, {
      userId: user.id,
      userEmail: user.email || '',
      nom: bourse.nom,
      pays: bourse.pays || '',
      lienOfficiel: bourse.lienOfficiel || '',
      financement: bourse.financement || '',
      dateLimite: bourse.dateLimite || null,
      ajouteLe: new Date().toISOString(),
      statut: 'en_cours',
      etapeCourante: 0,
    });

    // 2. Déclencher le webhook pour générer les étapes (si disponible)
    try {
      await axiosInstance.post('/api/webhooks/generate-roadmap', {
        roadmapId: res.data.doc?.id || res.data.id,
        user: { id: user.id, email: user.email, niveau: user.niveau, domaine: user.domaine },
        bourse: { nom: bourse.nom, pays: bourse.pays, lien: bourse.lienOfficiel },
      });
    } catch (webhookErr) {
      console.warn('Webhook roadmap non disponible, continuation...', webhookErr);
      // Continue même si le webhook échoue
    }

    // 3. Mettre à jour l'état local
    setAppliedNomsLocal(prev => new Set([...prev, nomKey]));

    // 4. Optionnel : notifier le parent
    if (typeof onApplyBourse === 'function') {
      await onApplyBourse(bourse);
    }

  } catch (err) {
    console.error('[handleApply]', err);
    alert(lang === 'fr' ? "Erreur lors de l'initialisation de la candidature." : "Error initializing application.");
  }
}, [user, appliedSet, appliedNomsLocal, onApplyBourse, lang]);

// ✅ Ask AI : juste pour info
const handleAskAI = useCallback((bourse) => {
  handleQuickReply?.(`Donne-moi tous les détails sur "${bourse.nom}" : conditions, financement, processus de candidature`);
}, [handleQuickReply]);


  return(<div className="chat-page">
    <div className="language-selector-container"><LanguageToggle/></div>
    <div className="chat-hero"><div className="hero-badge">{lang==='fr'?'✨ Propulsé par l\'IA':'✨ Powered by AI'}</div><h1 className="hero-title">{lang==='fr'?'Trouvez votre bourse':'Find your scholarship'}<br/><span className="hero-accent">{lang==='fr'?'100% financée':'100% funded'}</span></h1><p className="hero-sub">{lang==='fr'?'Discutez avec notre IA. Elle analyse votre profil, recommande les meilleures opportunités et vous guide à chaque étape.':'Chat with our AI. It analyzes your profile, recommends the best opportunities and guides you every step of the way.'}</p></div>
    <div className="chat-box">
      <div className="chat-messages" ref={containerRef}>
        {messages.length===0&&<div className="welcome-screen"><div className="welcome-avatar"><img src="/logo.png" alt="OppsTrack" style={{width:36,height:36,objectFit:'contain',borderRadius:6}} onError={e=>{e.target.style.display='none';e.target.parentNode.innerHTML='🤖';}}/></div><div className="welcome-bubble"><p><strong>{lang==='fr'?'Bonjour':'Hello'}{user?.name?` ${user.name}`:''}!</strong> 👋</p><p>{lang==='fr'?'Je suis votre assistant OppsTrack. Je peux :':'I am your OppsTrack assistant. I can:'}</p><ul><li>{lang==='fr'?'🎓 Recommander des bourses selon votre profil':'🎓 Recommend scholarships matching your profile'}</li><li>{lang==='fr'?'📋 Vous guider sur les démarches à suivre':'📋 Guide you through the application process'}</li><li>{lang==='fr'?'🎙️ Vous préparer à vos entretiens':'🎙️ Prepare you for scholarship interviews'}</li><li>{lang==='fr'?'📄 Analyser votre CV et lettre de motivation':'📄 Analyze your CV and cover letter'}</li></ul><p>{lang==='fr'?'Par où voulez-vous commencer ?':'Where would you like to start?'}</p></div></div>}
        {messages.map((msg,i)=><ChatMessage key={i} msg={msg} index={i} appliedNoms={appliedSet} onApply={handleApply}  onDetails={setDrawer} allBourses={bourses} handleQuickReply={handleQuickReply} lang={lang}/>)}
        {loading&&<div className="msg ai"><div className="msg-avatar">🤖</div><div className="msg-bubble typing-bubble"><span className="dot"/><span className="dot"/><span className="dot"/></div></div>}
        <ScrollToBottomButton onClick={scrollToBottom} visible={showScroll}/>
      </div>
      <div className="quick-replies">{quickReplies.map((qr,i)=><button key={i} className="quick-reply-btn" onClick={()=>handleQuickReply(qr.text)} disabled={loading}><span>{qr.emoji}</span><span>{qr.label}</span></button>)}</div>
      <ChatInput input={input} setInput={setInput} onSend={()=>handleSend()} loading={loading}/>
    </div>
    <div className="hero-stats"><div className="stat"><StatNumber value={heroStats.totalBourses} suffix={heroStats.totalBourses>=500?'+':''} loading={!heroStats.loaded}/><span className="stat-label">{lang==='fr'?'Bourses':'Scholarships'}</span></div><div className="stat-divider"/><div className="stat"><StatNumber value={heroStats.pctFinancees} suffix="%" loading={!heroStats.loaded}/><span className="stat-label">{lang==='fr'?'Financées':'Funded'}</span></div><div className="stat-divider"/><div className="stat"><span className="stat-num">24/7</span><span className="stat-label">{lang==='fr'?'IA active':'AI active'}</span></div></div>
    <div className="features-section"><div className="features-header"><div className="features-eyebrow"><span className="features-eyebrow-line"/>{lang==='fr'?'Pourquoi OppsTrack ?':'Why OppsTrack?'}<span className="features-eyebrow-line"/></div><h2 className="features-title">{lang==='fr'?'Tout ce dont vous avez besoin pour':'Everything you need to'}<span className="features-title-gradient"> {lang==='fr'?'décrocher votre bourse':'land your scholarship'}</span></h2></div><div className="features-grid">{[{icon:'🔍',titleFr:'Matching intelligent',titleEn:'Smart Matching',descFr:"L'IA analyse votre profil et recommande les bourses avec les meilleures chances de succès.",descEn:"The AI analyzes your profile and recommends scholarships with the best success chances.",ctaFr:'Trouver mes bourses',ctaEn:'Find my scholarships',view:'bourses',accent:'#1a3a6b',bg:'#eff6ff'},{icon:'📋',titleFr:'Roadmap personnalisée',titleEn:'Personalized Roadmap',descFr:"Chaque candidature décomposée étape par étape : documents, lettre, soumission, résultat.",descEn:"Each application broken down step by step: documents, letter, submission, result.",ctaFr:'Voir la roadmap',ctaEn:'See the roadmap',view:'roadmap',accent:'#166534',bg:'#f0fdf4'},{icon:'🎙️',titleFr:'Entretiens simulés IA',titleEn:'AI Mock Interviews',descFr:"Notre IA joue le rôle du jury. Obtenez un score et des conseils personnalisés.",descEn:"Our AI plays the role of the jury. Get a score and personalized feedback.",ctaFr:'Préparer mon entretien',ctaEn:'Prepare my interview',view:'entretien',accent:'#f5a623',bg:'#fffbeb'},{icon:'📄',titleFr:'Analyse de documents',titleEn:'Document Analysis',descFr:"CV, lettre de motivation — l'IA identifie vos points forts et propose des améliorations.",descEn:"CV, cover letter — the AI identifies your strengths and suggests improvements.",ctaFr:'Analyser mon CV',ctaEn:'Analyze my CV',view:'cv',accent:'#0891b2',bg:'#ecfeff'},{icon:'🌍',titleFr:'Carte mondiale',titleEn:'World Map',descFr:"Explorez les bourses dans le monde entier. Filtrez par pays, niveau et domaine.",descEn:"Explore scholarships worldwide. Filter by country, level and field.",ctaFr:'Explorer la carte',ctaEn:'Explore the map',view:'bourses',accent:'#7c3aed',bg:'#f5f3ff'},{icon:'📊',titleFr:'Tableau de bord',titleEn:'Dashboard',descFr:"Suivez vos candidatures, alertes de deadlines et score de préparation en temps réel.",descEn:"Track your applications, deadline alerts and preparation score in real time.",ctaFr:'Voir le dashboard',ctaEn:'See the dashboard',view:'dashboard',accent:'#dc2626',bg:'#fef2f2'}].map((feat,i)=><div key={i} className="feat-card" style={{animationDelay:`${i*0.07}s`}} onClick={()=>setView&&setView(feat.view)} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&setView&&setView(feat.view)}><div className="feat-icon-circle" style={{background:feat.bg,color:feat.accent}}>{feat.icon}</div><h3 className="feat-title">{lang==='fr'?feat.titleFr:feat.titleEn}</h3><p className="feat-desc">{lang==='fr'?feat.descFr:feat.descEn}</p><div className="feat-cta" style={{color:feat.accent}}>{lang==='fr'?feat.ctaFr:feat.ctaEn}<svg className="feat-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div><div className="feat-hover-bar" style={{background:feat.accent}}/></div>)}</div></div>
{/* ✅ DRAWER BOURSE - VERSION CORRIGÉE */}
{drawer && (
  <BourseDrawer
    bourse={drawer}
    onClose={() => setDrawer(null)}
    
    // ✅ Favoris : état combiné + handler API
    starred={starredNoms.has(drawer.nom?.trim().toLowerCase()) || appliedSet.has(drawer.nom?.trim().toLowerCase())}
    onStar={handleStar}
    
    // ✅ Roadmap / Choisir : handler API direct
    onChoose={handleApply}
    
    // ✅ Postuler : état combiné + handler API
    applied={appliedSet.has(drawer.nom?.trim().toLowerCase()) || appliedNomsLocal.has(drawer.nom?.trim().toLowerCase())}
    onApply={handleApply}
    
    // ✅ Ask AI
    onAskAI={handleAskAI}
    
    user={user}
  />
)}   
<style>{`
      .chat-page{display:flex;flex-direction:column;align-items:center;width:100%;max-width:800px;margin:0 auto;padding:40px 16px 32px;font-family:'Segoe UI',system-ui,sans-serif}
      .chat-hero{text-align:center;margin-bottom:28px;width:100%}
      .hero-badge{display:inline-block;padding:5px 16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:40px;color:#1a3a6b;font-size:12px;font-weight:600;letter-spacing:.5px;margin-bottom:20px}
      .hero-title{font-size:clamp(1.8rem,5vw,2.8rem);font-weight:800;line-height:1.2;color:#1a3a6b;margin-bottom:16px;letter-spacing:-.02em}
      .hero-accent{background:linear-gradient(135deg,#f5a623,#e89510);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
      .hero-sub{color:#475569;font-size:15px;max-width:520px;margin:0 auto;line-height:1.6}
      .chat-box{width:100%;background:#fff;border-radius:12px;border:1px solid #e2e8f0;border-top:3px solid #1a3a6b;box-shadow:0 4px 20px rgba(26,58,107,.08);overflow:hidden}
      .chat-messages{position:relative;height:500px;overflow-y:auto;padding:20px;scroll-behavior:smooth;background:#fafbfc}
      .chat-messages::-webkit-scrollbar{width:5px}
      .chat-messages::-webkit-scrollbar-track{background:#f1f5f9}
      .chat-messages::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}
      .welcome-screen{display:flex;gap:12px;align-items:flex-start;padding:8px 0}
      .welcome-avatar{width:42px;height:42px;border-radius:8px;background:#eff6ff;border:1px solid #bfdbfe;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
      .welcome-bubble{background:#fff;border:1px solid #e2e8f0;border-radius:0 12px 12px 12px;padding:16px 20px;color:#1a3a6b;font-size:14px;line-height:1.6;box-shadow:0 2px 8px rgba(26,58,107,.06)}
      .welcome-bubble ul{padding-left:20px;margin:8px 0}
      .welcome-bubble li{margin-bottom:4px;color:#475569}
      .msg-with-cards{display:flex;flex-direction:column;gap:10px;margin-bottom:18px;animation:msgIn .3s ease both;width:100%}
      .msg-intro-row{display:flex;align-items:flex-start;gap:10px}
      .msg-bubble-intro{flex:1;max-width:calc(100% - 44px)}
      .msg{display:flex;gap:10px;margin-bottom:18px;animation:msgIn .3s ease both}
      .msg.ai{align-items:flex-start}
      .msg.user{flex-direction:row-reverse}
      @keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
      .msg-content{display:flex;flex-direction:column;gap:10px;flex:1;max-width:88%}
      .msg.ai.msg-has-cards .msg-content{max-width:100%}
      .msg.user .msg-content{align-items:flex-end}
      .msg-avatar{width:34px;height:34px;border-radius:8px;background:#eff6ff;border:1px solid #bfdbfe;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;margin-top:2px}
      .msg-avatar-user{background:#1a3a6b;border-color:#1a3a6b;color:#fff;font-size:13px;font-weight:700}
      .msg-bubble{padding:11px 16px;border-radius:12px;font-size:14px;line-height:1.55;word-break:break-word}
      .msg.ai .msg-bubble{background:#fff;border:1px solid #e2e8f0;color:#1a3a6b;border-top-left-radius:4px;box-shadow:0 1px 4px rgba(26,58,107,.05)}
      .msg.user .msg-bubble{background:#1a3a6b;color:#fff;border-top-right-radius:4px;box-shadow:0 2px 8px rgba(26,58,107,.2)}
      .msg-text{display:flex;flex-direction:column;gap:2px}
      .msg-list-item{padding-left:8px;color:#475569;font-size:13px}
      .msg.user .msg-list-item{color:rgba(255,255,255,0.9)}
      .voice-badge{margin-top:8px;display:inline-block;font-size:10px;padding:2px 8px;border-radius:10px;background:rgba(26,58,107,.08);color:#1a3a6b;font-weight:600}
      .typing-bubble{display:flex;gap:5px;align-items:center;padding:12px 16px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;border-top-left-radius:4px}
      .dot{width:7px;height:7px;border-radius:50%;background:#1a3a6b;animation:dotBounce 1.2s infinite ease-in-out}
      .dot:nth-child(1){animation-delay:0s}.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
      @keyframes dotBounce{0%,60%,100%{transform:scale(.7);opacity:.5}30%{transform:scale(1.1);opacity:1}}
      .bc-grid-wrap{width:100%;margin-top:4px;animation:fadeIn .4s ease}
      @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      .bc-grid-header{display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:10px 16px;background:linear-gradient(135deg,#1a3a6b08,#f5a62308);border-radius:10px;border:1px solid #e2e8f0}
      .bc-grid-icon{font-size:20px}
      .bc-grid-title{font-size:14px;font-weight:700;color:#1a3a6b}
      .bc-grid-sub{margin-left:auto;font-size:11px;color:#94a3b8;background:#f8fafc;padding:3px 10px;border-radius:20px;border:1px solid #e2e8f0}
      .bc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
      .bourse-card{position:relative;background:#fff;border:1.5px solid #e8edf5;border-radius:12px;overflow:hidden;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;animation:cardIn .35s ease both;display:flex;flex-direction:column}
      @keyframes cardIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      .bourse-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(26,58,107,.12);border-color:#bfdbfe}
      .bourse-card-bar{height:3px;width:100%;flex-shrink:0}
      .bourse-card-0 .bourse-card-bar{background:linear-gradient(90deg,#1a3a6b,#2563eb)}.bourse-card-1 .bourse-card-bar{background:linear-gradient(90deg,#166534,#16a34a)}.bourse-card-2 .bourse-card-bar{background:linear-gradient(90deg,#7c3aed,#2563eb)}.bourse-card-3 .bourse-card-bar{background:linear-gradient(90deg,#f5a623,#d97706)}.bourse-card-4 .bourse-card-bar{background:linear-gradient(90deg,#0891b2,#2563eb)}.bourse-card-5 .bourse-card-bar{background:linear-gradient(90deg,#dc2626,#7c3aed)}
      .bourse-card-0:hover .bourse-card-bar,.bourse-card-1:hover .bourse-card-bar,.bourse-card-2:hover .bourse-card-bar,.bourse-card-3:hover .bourse-card-bar,.bourse-card-4:hover .bourse-card-bar,.bourse-card-5:hover .bourse-card-bar{background:linear-gradient(90deg,#f5a623,#e89510)}
      .bc-header{display:flex;align-items:flex-start;gap:12px;padding:14px 16px 10px}
      .bc-flag{font-size:26px;line-height:1;flex-shrink:0}
      .bc-title-wrap{flex:1;min-width:0;cursor:pointer}
      .bc-title{font-size:13px;font-weight:700;color:#1a3a6b;margin:0 0 3px;line-height:1.35;transition:color .15s}
      .bc-title-wrap:hover .bc-title{color:#2563eb}
      .bc-pays{font-size:11px;color:#64748b}
      .bc-badges{display:flex;flex-wrap:wrap;gap:5px;padding:0 16px 10px}
      .bc-badge{font-size:10.5px;font-weight:600;padding:3px 9px;border-radius:6px;border:1px solid;white-space:nowrap}
      .bc-badge-neutral{color:#475569;background:#f8fafc;border-color:#e2e8f0}
      .bc-financement{display:flex;align-items:center;gap:6px;padding:0 16px 6px;font-size:12px;color:#475569}
      .bc-domaine{padding:0 16px 8px;font-size:11px;color:#64748b}
      .bc-deadline{padding:0 16px 10px;font-size:11px;font-weight:600}
      .bc-actions{display:flex;gap:6px;padding:10px 14px 14px;border-top:1px solid #f1f5f9;margin-top:auto}
      .bc-btn{flex:1;padding:8px 6px;border-radius:7px;font-size:11.5px;font-weight:600;cursor:pointer;border:1.5px solid;transition:all .18s;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:4px;font-family:inherit;white-space:nowrap}
      .bc-btn-primary{background:#1a3a6b;color:#fff;border-color:#1a3a6b}
      .bc-btn-primary:hover:not(:disabled){background:#15314f;transform:translateY(-1px);box-shadow:0 4px 12px rgba(26,58,107,.25)}
      .bc-btn-primary:disabled{opacity:.6;cursor:default}
      .bc-btn-done{background:#166534!important;border-color:#166534!important}
      .bc-btn-secondary{background:#fff;color:#1a3a6b;border-color:#bfdbfe}
      .bc-btn-secondary:hover{background:#eff6ff;transform:translateY(-1px)}
      .bc-btn-outline{background:#fff;color:#64748b;border-color:#e2e8f0}
      .bc-btn-outline:hover{background:#f8fafc;color:#1a3a6b}
      .bc-show-more{width:100%;margin-top:10px;padding:10px;border:1.5px dashed #bfdbfe;border-radius:8px;background:#f8fafc;color:#1a3a6b;font-size:12px;font-weight:600;cursor:pointer;transition:all .18s;font-family:inherit}
      .bc-show-more:hover{background:#eff6ff;border-color:#93c5fd}
      .quick-replies{display:flex;flex-wrap:wrap;gap:8px;padding:14px 18px;border-top:1px solid #f1f5f9;justify-content:center;background:#f8fafc}
      .quick-reply-btn{display:flex;align-items:center;gap:7px;padding:7px 14px;border-radius:6px;border:1px solid #e2e8f0;background:#fff;color:#1a3a6b;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .2s;font-family:inherit}
      .quick-reply-btn:hover:not(:disabled){background:#1a3a6b;color:#fff;border-color:#1a3a6b;transform:translateY(-1px);box-shadow:0 3px 8px rgba(26,58,107,.2)}
      .quick-reply-btn:disabled{opacity:.45;cursor:not-allowed}
      .hero-stats{display:flex;align-items:center;justify-content:center;gap:32px;flex-wrap:wrap;background:#1a3a6b;padding:20px 36px;border-radius:10px;margin-top:20px;width:100%;border-bottom:3px solid #f5a623}
      .stat{display:flex;flex-direction:column;align-items:center;gap:4px}
      .stat-num{font-size:1.8rem;font-weight:800;color:#f5a623;min-width:60px;text-align:center}
      .stat-loading{background:rgba(255,255,255,.1)!important;-webkit-text-fill-color:transparent;border-radius:6px;animation:shimmer 1.4s infinite}
      @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:1}}
      .stat-label{font-size:11px;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:1px;font-weight:600}
      .stat-divider{width:1px;height:36px;background:rgba(255,255,255,.15)}
      .scroll-btn{position:sticky;bottom:10px;right:10px;float:right;width:36px;height:36px;border-radius:999px;background:#1a3a6b;border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(26,58,107,.25);transition:all .18s;z-index:20;margin-top:4px}
      .scroll-btn:hover{background:#15314f;transform:scale(1.06)}
      @media(max-width:640px){.chat-messages{height:400px}.bc-grid{grid-template-columns:1fr 1fr;gap:8px}.hero-stats{gap:20px;padding:16px 20px}.stat-num{font-size:1.4rem}.bc-actions{flex-direction:column}.bc-btn{flex:none}}
      @media(max-width:400px){.bc-grid{grid-template-columns:1fr}}
      .features-section{width:100%;margin-top:48px}
      .features-header{text-align:center;margin-bottom:32px}
      .features-eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:11px;font-weight:700;color:#1a3a6b;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px}
      .features-eyebrow-line{display:block;width:24px;height:2px;background:#f5a623;border-radius:2px}
      .features-title{font-size:clamp(1.4rem,3vw,2rem);font-weight:800;color:#0f1724;line-height:1.25;margin:0;letter-spacing:-.02em}
      .features-title-gradient{color:#1a3a6b}
      .features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
      .feat-card{position:relative;background:#fff;border:1.5px solid #e8edf5;border-radius:14px;padding:24px 20px 20px;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;animation:featIn .4s ease both;overflow:hidden;display:flex;flex-direction:column;gap:10px;outline:none;user-select:none}
      @keyframes featIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
      .feat-card:hover{transform:translateY(-4px);box-shadow:0 14px 36px rgba(26,58,107,.13);border-color:#bfdbfe}
      .feat-card:active{transform:translateY(-1px);box-shadow:0 4px 12px rgba(26,58,107,.1)}
      .feat-card:focus-visible{border-color:#1a3a6b;box-shadow:0 0 0 3px rgba(26,58,107,.15)}
      .feat-icon-circle{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;transition:transform .2s ease}
      .feat-card:hover .feat-icon-circle{transform:scale(1.1) rotate(-4deg)}
      .feat-title{font-size:14px;font-weight:700;color:#0f1724;margin:0;line-height:1.3}
      .feat-desc{font-size:12.5px;color:#64748b;line-height:1.6;margin:0;flex:1}
      .feat-cta{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;margin-top:4px;opacity:0;transform:translateY(4px);transition:opacity .2s ease,transform .2s ease}
      .feat-card:hover .feat-cta{opacity:1;transform:translateY(0)}
      .feat-arrow{transition:transform .2s ease}
      .feat-card:hover .feat-arrow{transform:translateX(4px)}
      .feat-hover-bar{position:absolute;bottom:0;left:0;right:0;height:3px;border-radius:0 0 12px 12px;opacity:0;transform:scaleX(0);transition:opacity .2s ease,transform .25s ease;transform-origin:left}
      .feat-card:hover .feat-hover-bar{opacity:1;transform:scaleX(1)}
      @media(max-width:680px){.features-grid{grid-template-columns:1fr 1fr;gap:10px}.feat-card{padding:18px 14px 16px}}
      @media(max-width:420px){.features-grid{grid-template-columns:1fr}}
    `}</style>
  </div>);
}