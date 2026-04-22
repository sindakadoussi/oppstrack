// src/pages/ProfilPage.jsx — v3
// Changes:
//   - pp-header-card removed entirely
//   - Avatar upload moved to sidebar (replaces SidebarAvatar)
//   - Widgets (Complétude, Suggestions, Bourses, Badges) shown inside Dashboard tab
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import './profil.css';

// ══════════════════════════════════════════
// DONNÉES STATIQUES
// ══════════════════════════════════════════
const emptyProfile = {
  name:'',email:'',phone:'',dateOfBirth:'',nationality:'',countryOfResidence:'',
  linkedin:'',github:'',portfolio:'',currentLevel:'',fieldOfStudy:'',institution:'',
  gpa:'',graduationYear:'',academicHistory:[],workExperience:[],academicProjects:[],
  certifications:[],volunteerWork:[],publications:[],awards:[],languages:[],skills:[],
  targetDegree:'',targetCountries:[],targetFields:[],motivationSummary:'',avatar:null,
};

const LANGUAGE_SUGGESTIONS = ['Anglais','Français','Arabe','Espagnol','Allemand','Italien','Chinois','Russe','Portugais','Japonais','Coréen','Néerlandais'];
const COUNTRY_SUGGESTIONS = ['France','Canada','Belgique','Suisse','Allemagne','Italie','Espagne','Royaume-Uni','États-Unis','Australie','Tunisie','Maroc','Algérie'];
const FIELD_SUGGESTIONS = ['Informatique','Génie logiciel','Intelligence Artificielle','Data Science','Cybersécurité','Gestion','Marketing','Finance','Droit','Médecine'];
const SKILL_SUGGESTIONS = {
  language:['Python','JavaScript','Java','C++','PHP','Ruby','Go','Swift','Kotlin'],
  framework:['React','Angular','Vue.js','Django','Flask','Spring Boot','Laravel','Node.js'],
  database:['MySQL','PostgreSQL','MongoDB','Redis','Firebase','Oracle'],
  tool:['Git','Docker','Kubernetes','Jenkins','Jira','Figma','Photoshop'],
  devops:['AWS','Azure','Google Cloud','Terraform','Ansible','Linux'],
  method:['Agile','Scrum','Kanban','DevOps','CI/CD','TDD'],
  design:['UI/UX Design','Figma','Sketch','Adobe XD','Illustrator'],
  other:['Microsoft Office','Excel','Salesforce','SAP'],
};
const DEG_LEVELS = ['Licence 1','Licence 2','Licence 3','Master 1','Master 2','Doctorat','Ingénieur 1','Ingénieur 2','Ingénieur 3'];

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════
function getTotal(item) {
  if (Array.isArray(item.etapes)) return item.etapes.length;
  if (typeof item.etapes === 'string' && item.etapes.trim().startsWith('[')) {
    try { const p = JSON.parse(item.etapes); if (Array.isArray(p)) return p.length; } catch {}
  }
  return 5;
}
function getProgress(item) {
  return Math.min((item.etapeCourante || 0) + 1, getTotal(item));
}
function isItemDone(item) {
  const total = getTotal(item);
  return total > 0 && (item.etapeCourante || 0) >= total - 1;
}
function dLeft(deadline, lang='fr') {
  const diff = Math.round((new Date(deadline) - new Date()) / 86400000);
  if (diff < 0) return { label: lang==='fr'?'Expiré':'Expired', color:'#dc2626' };
  if (diff <= 7) return { label:`${diff}${lang==='fr'?'j':'d'}`, color:'#d97706' };
  if (diff <= 30) return { label:`${diff}${lang==='fr'?'j':'d'}`, color:'#2563eb' };
  return { label:`${diff}${lang==='fr'?'j':'d'}`, color:'#166534' };
}

// ── Animated Ring ──
function AnimatedRing({ pct, size=72, sw=6, color='#255cae', children }) {
  const r=(size-sw*2)/2, circ=2*Math.PI*r;
  const [dash,setDash]=useState(0);
  useEffect(()=>{ const t=setTimeout(()=>setDash((pct/100)*circ),120); return()=>clearTimeout(t); },[pct,circ]);
  return (
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8edf5" strokeWidth={sw}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} style={{transition:'stroke-dasharray 1.2s ease'}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>{children}</div>
    </div>
  );
}

// ── Sparkline ──
function Sparkline({ data, color='#255cae', height=60 }) {
  const ref=useRef(null);
  const [w,setW]=useState(200);
  useEffect(()=>{ if(ref.current)setW(ref.current.offsetWidth||200); },[]);
  if(!data||data.length<2) return <div ref={ref} style={{textAlign:'center',color:'#94a3b8',fontSize:12,padding:'16px 0'}}>—</div>;
  const min=Math.min(...data),max=Math.max(...data),range=max-min||1,pad=6;
  const pts=data.map((v,i)=>`${pad+(i/(data.length-1))*(w-pad*2)},${height-pad-((v-min)/range)*(height-pad*2)}`).join(' ');
  return (
    <div ref={ref} style={{width:'100%'}}>
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {data.map((v,i)=>{ const x=pad+(i/(data.length-1))*(w-pad*2); const y=height-pad-((v-min)/range)*(height-pad*2); return <g key={i}><circle cx={x} cy={y} r="4" fill={color}/><text x={x} y={y-8} textAnchor="middle" fontSize="9" fill="#64748b">{v}</text></g>; })}
      </svg>
    </div>
  );
}

// ── Mini Bar Chart ──
function MiniBarChart({ data, color='#255cae', height=40 }) {
  const max = Math.max(...data.map(d=>d.val), 1);
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:3,height}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
          <div style={{width:'100%',height:Math.max(2,Math.round((d.val/max)*height*0.85)),background:d.val>0?color:'#f1f5f9',borderRadius:'2px 2px 0 0'}}/>
          <span style={{fontSize:7,color:'#94a3b8'}}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Streak Widget ──
function StreakWidget({ activities, lang }) {
  const today=new Date(); let streak=0;
  for(let i=0;i<60;i++){
    const d=new Date(today); d.setDate(today.getDate()-i);
    const k=d.toISOString().split('T')[0];
    if(activities.some(a=>a.date===k)) streak++; else if(i>0) break;
  }
  const days=lang==='fr'?['D','L','M','M','J','V','S']:['S','M','T','W','T','F','S'];
  const weekDays=Array.from({length:7},(_, i)=>{
    const d=new Date(today); d.setDate(today.getDate()-(6-i));
    const k=d.toISOString().split('T')[0];
    return {day:days[d.getDay()],active:activities.some(a=>a.date===k),isToday:i===6};
  });
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div><div style={{fontSize:24,fontWeight:900,color:'#255cae',lineHeight:1}}>{streak}</div><div style={{fontSize:10,color:'#64748b'}}>{lang==='fr'?'jours consécutifs':'days streak'}</div></div>
        <span style={{fontSize:28}}>{streak>=7?'🔥':streak>=3?'⚡':'💤'}</span>
      </div>
      <div style={{display:'flex',gap:3}}>
        {weekDays.map((d,i)=>(
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
            <div style={{width:'100%',aspectRatio:'1',borderRadius:4,background:d.active?'#255cae':'#f1f5f9',border:d.isToday?'2px solid #f5a623':'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {d.active&&<span style={{fontSize:7,color:'#fff'}}>✓</span>}
            </div>
            <span style={{fontSize:7,color:'#94a3b8'}}>{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Profile Strength ──
function ProfileStrength({ user, scores, lang, setView }) {
  const sections = [
    {label:lang==='fr'?'Infos de base':'Basic info',pct:['name','email','phone','nationality'].filter(f=>user?.[f]).length/4*100,color:'#10b981',icon:'👤'},
    {label:lang==='fr'?'Formation':'Education',pct:['currentLevel','fieldOfStudy','institution','gpa'].filter(f=>user?.[f]).length/4*100,color:'#255cae',icon:'🎓'},
    {label:lang==='fr'?'Expériences':'Experience',pct:Math.min(100,((user?.workExperience?.length||0)*25)+((user?.academicProjects?.length||0)*25)),color:'#f59e0b',icon:'💼'},
    {label:lang==='fr'?'Compétences':'Skills',pct:Math.min(100,((user?.languages?.length||0)*33)+((user?.skills?.length||0)*33)),color:'#7c3aed',icon:'🛠️'},
    {label:lang==='fr'?'Entretiens':'Interviews',pct:Math.min(100,(scores?.length||0)*33),color:'#f43f5e',icon:'🎙️'},
    {label:'Objectifs',pct:(['targetDegree','motivationSummary'].filter(f=>user?.[f]).length/2*100)+(user?.targetCountries?.length>0?50:0),color:'#0891b2',icon:'🎯'},
  ];
  const completion = Math.round(sections.reduce((s,p)=>s+p.pct,0)/sections.length);
  const grade = completion>=80?{label:'Excellent',color:'#10b981'}:completion>=60?{label:'Bon',color:'#255cae'}:completion>=40?{label:'En progression',color:'#f59e0b'}:{label:'À renforcer',color:'#ef4444'};
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14,paddingBottom:12,borderBottom:'1px solid #e8edf5'}}>
        <AnimatedRing pct={completion} size={56} sw={5} color={grade.color}>
          <span style={{fontSize:11,fontWeight:800,color:grade.color}}>{completion}%</span>
        </AnimatedRing>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:grade.color}}>{completion}%</div>
          <div style={{fontSize:11,color:grade.color,fontWeight:600}}>{grade.label}</div>
        </div>
      </div>
      {sections.map((s,i)=>(
        <div key={i} style={{marginBottom:8}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
            <div style={{display:'flex',alignItems:'center',gap:5}}><span style={{fontSize:12}}>{s.icon}</span><span style={{fontSize:10,fontWeight:600,color:'#4b5a6e'}}>{s.label}</span></div>
            <span style={{fontSize:10,fontWeight:700,color:s.color}}>{Math.round(s.pct)}%</span>
          </div>
          <div style={{height:3,borderRadius:99,background:'#e8edf5',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${s.pct}%`,background:s.color,borderRadius:99,transition:'width 0.8s ease'}}/>
          </div>
        </div>
      ))}
      <button onClick={()=>setView('profil')} style={{width:'100%',marginTop:10,padding:'8px',borderRadius:6,background:'#255cae',color:'#fff',border:'none',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
        {completion<60?(lang==='fr'?'📝 Compléter mon profil':'📝 Complete profile'):(lang==='fr'?'✨ Améliorer':'✨ Improve')} →
      </button>
    </div>
  );
}

// ── TodayBlock (identique au Dashboard) ──
function TodayBlock({ roadmap, urgentDeadlines, scores, setView, lang }) {
  const today = new Date();
  const items = [];
  (urgentDeadlines||[]).slice(0,2).forEach(d=>{
    const diff=Math.round((new Date(d.deadline||d)-today)/86400000);
    if(diff>=0&&diff<=7) items.push({icon:'⚡',color:'#dc2626',bg:'#fef2f2',text:`Deadline: ${d.nom}`,sub:`Dans ${diff}${lang==='fr'?'j':'d'}`,view:'roadmap'});
  });
  const nextRm=roadmap.find(r=>!isItemDone(r)&&getProgress(r)>0);
  if(nextRm) items.push({icon:'📋',color:'#2563eb',bg:'#eff6ff',text:`${lang==='fr'?'Avancer':'Continue'}: ${nextRm.nom}`,sub:`${lang==='fr'?'Étape':'Step'} ${getProgress(nextRm)}/${getTotal(nextRm)}`,view:'roadmap'});
  if(scores.length===0) items.push({icon:'🎙️',color:'#166534',bg:'#f0fdf4',text:lang==='fr'?'Ton 1er entretien IA':'Your 1st AI interview',sub:lang==='fr'?'15 min · Booste ton profil':'15 min · Boost your profile',view:'entretien'});
  else if(scores.length<3) items.push({icon:'🎙️',color:'#166534',bg:'#f0fdf4',text:`${lang==='fr'?'Entretien':'Interview'} #${scores.length+1}`,sub:`${lang==='fr'?'Dernier':'Last'}: ${scores[0]?.scoreNum||'?'}/100`,view:'entretien'});
  if(items.length===0) items.push({icon:'✅',color:'#166534',bg:'#f0fdf4',text:lang==='fr'?'Tout est à jour !':'All up to date!',sub:lang==='fr'?'Continue comme ça 💪':'Keep it up 💪'});
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {items.slice(0,3).map((item,i)=>(
        <div key={i} onClick={()=>item.view&&setView&&setView(item.view)}
          style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,background:item.bg,border:`1px solid ${item.color}25`,cursor:item.view?'pointer':'default',transition:'transform 0.15s'}}
          onMouseEnter={e=>{if(item.view)e.currentTarget.style.transform='translateX(3px)';}}
          onMouseLeave={e=>e.currentTarget.style.transform='translateX(0)'}>
          <div style={{width:34,height:34,borderRadius:8,background:item.color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{item.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:700,color:item.color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.text}</div>
            <div style={{fontSize:10,color:'#64748b'}}>{item.sub}</div>
          </div>
          {item.view&&<span style={{fontSize:14,color:item.color+'80'}}>›</span>}
        </div>
      ))}
    </div>
  );
}

// ── SmartTips (version complète avec priorités, fade, dots — identique au Dashboard) ──
function SmartTips({ user, scores, roadmap, urgentDeadlines, setView, lang }) {
  const [currentTip,setCurrentTip]=useState(0);
  const [fade,setFade]=useState(true);
  const tips=useMemo(()=>{
    const t={urgent:[],medium:[],low:[]};
    if((urgentDeadlines||[]).length>0) t.urgent.push({id:'deadline',icon:'⚡',title:`${urgentDeadlines.length} deadline${urgentDeadlines.length>1?'s':''} urgente${urgentDeadlines.length>1?'s':''}`,description:`${urgentDeadlines.slice(0,2).map(d=>d.nom).join(', ')} ${lang==='fr'?'à rendre sous':'due in'} ${Math.min(...urgentDeadlines.map(d=>Math.round((new Date(d.deadline||d)-new Date())/86400000)))}${lang==='fr'?'j':'d'}`,action:lang==='fr'?'Voir les deadlines':'View deadlines',view:'roadmap',color:'#dc2626',bg:'#fef2f2',border:'#fecaca'});
    if(!user?.motivationSummary) t.medium.push({id:'motivation',icon:'✍️',title:lang==='fr'?'Lettre de motivation manquante':'Missing motivation letter',description:lang==='fr'?'C\'est souvent le 1er critère des jurys. Rédige une lettre personnalisée pour chaque bourse.':'This is often the #1 criterion for juries. Write a personalized letter for each scholarship.',action:lang==='fr'?'Rédiger ma lettre':'Write my letter',view:'profil',color:'#7c3aed',bg:'#f5f3ff',border:'#ddd6fe'});
    if(!user?.gpa) t.medium.push({id:'gpa',icon:'🎓',title:lang==='fr'?'Moyenne académique non renseignée':'Academic GPA not set',description:lang==='fr'?'Ta moyenne est un critère clé pour l\'éligibilité aux bourses.':'Your GPA is a key criterion for scholarship eligibility.',action:lang==='fr'?'Ajouter ma moyenne':'Add my GPA',view:'profil',color:'#d97706',bg:'#fffbeb',border:'#fde68a'});
    if(!user?.languages||user.languages.length===0) t.medium.push({id:'languages',icon:'🌍',title:lang==='fr'?'Ajoute tes langues':'Add your languages',description:lang==='fr'?'Les bourses internationales exigent souvent B2 en anglais.':'International scholarships often require B2 level in English.',action:lang==='fr'?'Ajouter mes langues':'Add my languages',view:'profil',color:'#0891b2',bg:'#ecfeff',border:'#a5f3fc'});
    if(scores.length===0) t.medium.push({id:'interview',icon:'🎙️',title:lang==='fr'?'Prépare tes entretiens':'Prepare your interviews',description:lang==='fr'?'Les candidats qui s\'entraînent obtiennent 23% de meilleures évaluations.':'Candidates who practice get 23% better evaluations on average.',action:lang==='fr'?'Démarrer un entretien':'Start an interview',view:'entretien',color:'#166534',bg:'#f0fdf4',border:'#bbf7d0'});
    else if(scores.length<3) t.medium.push({id:'interview-more',icon:'🎙️',title:`${lang==='fr'?'Entretien':'Interview'} #${scores.length+1}`,description:lang==='fr'?`Ton dernier score: ${scores[0]?.scoreNum||'?'}/100. Continue à t'entraîner !`:`Your last score: ${scores[0]?.scoreNum||'?'}/100. Keep practicing!`,action:lang==='fr'?'Nouvel entretien':'New interview',view:'entretien',color:'#2563eb',bg:'#eff6ff',border:'#bfdbfe'});
    if((roadmap||[]).length===0) t.medium.push({id:'roadmap-empty',icon:'📋',title:lang==='fr'?'Crée ta roadmap':'Create your roadmap',description:lang==='fr'?'Ajoute des bourses à ta roadmap pour suivre tes candidatures.':'Add scholarships to your roadmap to track your applications.',action:lang==='fr'?'Explorer les bourses':'Explore scholarships',view:'bourses',color:'#255cae',bg:'#eff6ff',border:'#bfdbfe'});
    if(t.urgent.length===0&&t.medium.length<3){
      t.low.push({id:'star',icon:'🗣️',title:lang==='fr'?'Méthode STAR':'STAR Method',description:lang==='fr'?'Structure tes réponses: Situation → Tâche → Action → Résultat.':'Structure your answers: Situation → Task → Action → Result.',color:'#475569',bg:'#f8fafc',border:'#e2e8f0'});
      t.low.push({id:'reco',icon:'⏰',title:lang==='fr'?'Lettres de recommandation':'Recommendation letters',description:lang==='fr'?'Demande-les au moins 6 semaines à l\'avance.':'Request them at least 6 weeks in advance.',color:'#7c3aed',bg:'#f5f3ff',border:'#ddd6fe'});
      t.low.push({id:'countries',icon:'🗺️',title:lang==='fr'?'Diversifie tes cibles':'Diversify your targets',description:lang==='fr'?'Ne te limite pas à un seul pays. Regarde l\'Allemagne, les Pays-Bas, la Suisse.':'Don\'t limit yourself to one country. Check Germany, Netherlands, Switzerland.',action:lang==='fr'?'Voir les bourses':'View scholarships',view:'bourses',color:'#0891b2',bg:'#ecfeff',border:'#a5f3fc'});
    }
    return [...t.urgent,...t.medium,...t.low];
  },[user,scores,roadmap,urgentDeadlines,lang]);

  useEffect(()=>{
    if(tips.length<=1)return;
    const iv=setInterval(()=>{setFade(false);setTimeout(()=>{setCurrentTip(i=>(i+1)%tips.length);setFade(true);},250);},6000);
    return()=>clearInterval(iv);
  },[tips.length]);

  const tip=tips[currentTip]||tips[0];
  if(!tip)return null;
  return (
    <div style={{opacity:fade?1:0,transition:'opacity 0.25s ease'}}>
      <div style={{padding:'16px',background:tip.bg,border:`1px solid ${tip.border}`,borderRadius:12,borderLeft:`4px solid ${tip.color}`}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:`${tip.color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{tip.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:tip.color,marginBottom:6}}>{tip.title}</div>
            <div style={{fontSize:11,color:'#475569',lineHeight:1.5}}>{tip.description}</div>
            {tip.action&&tip.view&&(
              <button onClick={()=>setView&&setView(tip.view)} style={{marginTop:10,padding:'6px 14px',borderRadius:6,background:tip.color,color:'#fff',border:'none',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                {tip.action} →
              </button>
            )}
          </div>
        </div>
      </div>
      {tips.length>1&&(
        <div style={{display:'flex',gap:6,marginTop:12,justifyContent:'center'}}>
          {tips.map((_,i)=>(
            <div key={i} onClick={()=>{setFade(false);setTimeout(()=>{setCurrentTip(i);setFade(true);},200);}}
              style={{width:i===currentTip?20:6,height:4,borderRadius:3,background:i===currentTip?tip.color:'#e2e8f0',transition:'all 0.2s',cursor:'pointer'}}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SkillRadar (identique au Dashboard) ──
function SkillRadar({ skills }) {
  const cx=80,cy=80,r=58,n=skills.length;
  const toXY=(i,pct)=>{ const angle=(i/n)*Math.PI*2-Math.PI/2,dist=(pct/100)*r; return [cx+Math.cos(angle)*dist,cy+Math.sin(angle)*dist]; };
  const innerPts=skills.map((s,i)=>toXY(i,s.value).join(',')).join(' ');
  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      {[20,40,60,80,100].map(p=><polygon key={p} points={skills.map((_,i)=>toXY(i,p).join(',')).join(' ')} fill="none" stroke="#e2e8f0" strokeWidth="0.8"/>)}
      {skills.map((_,i)=>{ const [x,y]=toXY(i,100); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="0.8"/>; })}
      <polygon points={innerPts} fill="rgba(26,58,107,0.12)" stroke="#255cae" strokeWidth="1.5"/>
      {skills.map((s,i)=>{ const [x,y]=toXY(i,s.value); return <circle key={i} cx={x} cy={y} r="4" fill="#f5a623" stroke="#255cae" strokeWidth="1"/>; })}
      {skills.map((s,i)=>{ const [x,y]=toXY(i,118); return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="600" fill="#475569" fontFamily="system-ui">{s.label}</text>; })}
    </svg>
  );
}

// ── Checklist (Roadmap mini) ──
function ChecklistWidget({ user, roadmap, setRoadmap, lang }) {
  const [newText,setNewText]=useState('');
  const [loading,setLoading]=useState(false);
  const terminees=roadmap.filter(r=>isItemDone(r)).length;
  const enCours=roadmap.filter(r=>{const p=getProgress(r);return p>0&&!isItemDone(r);}).length;
  const totalSteps=roadmap.reduce((s,item)=>s+getTotal(item),0);
  const completedSteps=roadmap.reduce((s,item)=>s+getProgress(item),0);
  const pct=totalSteps>0?Math.round(Math.min((completedSteps/totalSteps)*100,100)):0;

  const advanceStep=async item=>{
    const step=item.etapeCourante||0, total=getTotal(item);
    if(step>=total-1)return;
    const ns=step+1;
    try{
      await axiosInstance.patch(API_ROUTES.roadmap.update(item.id),{etapeCourante:ns,statut:ns>=total?'terminé':'en_cours'});
      setRoadmap(prev=>prev.map(r=>r.id===item.id?{...r,etapeCourante:ns}:r));
    }catch(e){console.error(e);}
  };
  const addToRoadmap=async()=>{
    if(!newText.trim()||!user?.id)return;
    setLoading(true);
    try{
      const res=await axiosInstance.post(API_ROUTES.roadmap.create,{userId:user.id,userEmail:user.email||'',nom:newText.trim(),pays:'À définir',statut:'en_cours',etapeCourante:0,ajouteLe:new Date().toISOString(),dateLimite:null,lienOfficiel:'',financement:''});
      setRoadmap(prev=>[...prev,res.data?.doc||res.data]);
      setNewText('');
    }catch(e){console.error(e);}finally{setLoading(false);}
  };

  return (
    <div>
      <div style={{marginBottom:10}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
          <span style={{fontSize:10,color:'#64748b'}}><span style={{color:'#10b981',fontWeight:700}}>{terminees}</span> {lang==='fr'?'terminées':'completed'} · <span style={{color:'#255cae',fontWeight:700}}>{enCours}</span> {lang==='fr'?'en cours':'in progress'}</span>
          <span style={{fontSize:10,fontWeight:700,color:pct>=80?'#10b981':pct>=50?'#f59e0b':'#255cae'}}>{pct}%</span>
        </div>
        <div style={{height:5,background:'#e8edf5',borderRadius:99,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,borderRadius:99,background:pct>=80?'#10b981':pct>=50?'#f59e0b':'#255cae',transition:'width 0.5s ease'}}/>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:220,overflowY:'auto'}}>
        {roadmap.length===0&&<div style={{textAlign:'center',padding:'16px',color:'#8fa0b5',fontSize:12,background:'#f8fafc',borderRadius:8,border:'1px dashed #e8edf5'}}>{lang==='fr'?'Ajoute ta 1ère bourse ci-dessous':'Add your 1st scholarship below'}</div>}
        {roadmap.map(item=>{
          const total=getTotal(item),progress=getProgress(item),done=isItemDone(item),pctItem=Math.round((progress/total)*100);
          return (
            <div key={item.id} style={{padding:'8px 10px',borderRadius:7,background:done?'#ecfdf5':progress>0?'#eff6ff':'#f8fafc',border:`1px solid ${done?'#bbf7d0':progress>0?'#bfdbfe':'#e8edf5'}`}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${done?'#10b981':progress>0?'#255cae':'#d1dae8'}`,background:done?'#10b981':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {done&&<span style={{color:'#fff',fontSize:11}}>✓</span>}
                  {!done&&progress>0&&<span style={{color:'#255cae',fontSize:8,fontWeight:800}}>{progress}</span>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:600,color:done?'#10b981':'#0d1829',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:done?'line-through':'none'}}>{item.nom}</div>
                  <div style={{fontSize:9,color:'#8fa0b5',marginTop:1}}>{done?'✅ Terminée':`${lang==='fr'?'Étape':'Step'} ${progress}/${total}`}</div>
                </div>
                {!done&&<button onClick={()=>advanceStep(item)} style={{padding:'2px 8px',borderRadius:4,background:'#eff6ff',border:'1px solid #bfdbfe',color:'#255cae',fontSize:10,cursor:'pointer',fontWeight:700,flexShrink:0}}>+1</button>}
              </div>
              <div style={{marginTop:5,height:3,background:'#e8edf5',borderRadius:99,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pctItem}%`,borderRadius:99,background:done?'#10b981':'#255cae',transition:'width 0.4s'}}/>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{display:'flex',gap:6,marginTop:10}}>
        <input value={newText} onChange={e=>setNewText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addToRoadmap()} placeholder={lang==='fr'?'Nom bourse (Eiffel, DAAD...)':'Scholarship name...'} style={{flex:1,padding:'8px 11px',borderRadius:6,border:'1.5px solid #e8edf5',fontSize:11,background:'#fafbfd',outline:'none',fontFamily:'inherit'}} disabled={loading}/>
        <button onClick={addToRoadmap} disabled={loading||!newText.trim()} style={{padding:'8px 14px',borderRadius:6,background:'#255cae',color:'#fff',border:'none',fontSize:12,fontWeight:700,cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',opacity:loading?0.7:1}}>{loading?'…':'+'}</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// AUTOCOMPLETE & FIELD INPUTS
// ══════════════════════════════════════════
function AutocompleteInput({ value, onChange, suggestions, placeholder, label, type='text' }) {
  const [open,setOpen]=useState(false);
  const [input,setInput]=useState(value||'');
  useEffect(()=>setInput(value||''),[value]);
  const filtered=(suggestions||[]).filter(s=>s.toLowerCase().includes((input||'').toLowerCase())).slice(0,8);
  if(type==='date') return (
    <div className="pp-field">
      {label&&<div className="pp-label">{label}</div>}
      <input className="pp-input" type="date" value={value||''} onChange={e=>onChange(e.target.value)}/>
    </div>
  );
  return (
    <div className="pp-field" style={{position:'relative'}}>
      {label&&<div className="pp-label">{label}</div>}
      <input className="pp-input" value={input}
        onChange={e=>{setInput(e.target.value);onChange(e.target.value);setOpen(true);}}
        onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),200)}
        placeholder={placeholder}/>
      {open&&filtered.length>0&&(
        <div className="pp-dropdown">
          {filtered.map((s,i)=><div key={i} className="pp-dropdown-item" onClick={()=>{setInput(s);onChange(s);setOpen(false);}}>{s}</div>)}
        </div>
      )}
    </div>
  );
}

function Field({ label, v, s, ph, type='text', readOnly=false }) {
  return (
    <div className="pp-field">
      {label&&<div className="pp-label">{label}</div>}
      <input className="pp-input" type={type} value={v||''} onChange={e=>s?.(e.target.value)} placeholder={ph} readOnly={readOnly} style={readOnly?{opacity:0.5,cursor:'not-allowed'}:{}}/>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div className="pp-section-title">{children}</div>;
}

// ══════════════════════════════════════════
// SIDEBAR AVATAR UPLOADER
// Replaces both SidebarAvatar and the separate AvatarUploader.
// Shows the avatar in the sidebar circle with an edit button.
// ══════════════════════════════════════════
function SidebarAvatarUploader({ avatarId, onUpload, completionScore, lang }) {
  const [preview,setPreview]=useState(null);
  const [uploading,setUploading]=useState(false);

  useEffect(()=>{
    if(!avatarId){setPreview(null);return;}
    axiosInstance.get(`/api/media/${avatarId}`)
      .then(r=>{
        const url=r.data?.url||r.data?.doc?.url;
        if(url) setPreview(url.startsWith('http')?url:`http://localhost:3000${url}`);
      })
      .catch(()=>setPreview(null));
  },[avatarId]);

  const handleFile=async e=>{
    const file=e.target.files[0];if(!file)return;
    setUploading(true);
    const fd=new FormData();fd.append('file',file);
    try{
      const r=await axiosInstance.post('/api/media',fd,{headers:{'Content-Type':'multipart/form-data'}});
      const mediaId=r.data?.doc?.id||r.data?.id;
      onUpload(mediaId);
      const url=r.data?.doc?.url||r.data?.url;
      if(url) setPreview(url.startsWith('http')?url:`http://localhost:3000${url}`);
    }catch(err){console.error('Avatar upload failed',err);}
    finally{setUploading(false);}
  };

  return (
    <label style={{position:'relative',cursor:'pointer',display:'inline-block'}}>
      {/* Reuse sidebar avatar circle styles */}
      <div className="pp-sidebar-avatar-circle">
        {preview
          ? <img src={preview} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover',display:'block',borderRadius:0}}/>
          : <span style={{fontSize:28}}>👤</span>
        }
        <div className="pp-avatar-score">{completionScore}%</div>
      </div>
      {/* Small pencil badge */}
      <div style={{
        position:'absolute',bottom:2,right:2,
        width:20,height:20,borderRadius:'50%',
        background:'#255cae',border:'2px solid white',
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:9,color:'white',
        pointerEvents:'none',
      }}>✏️</div>
      <input type="file" accept="image/*" onChange={handleFile} style={{display:'none'}} disabled={uploading}/>
      {uploading&&(
        <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'rgba(255,255,255,0.7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#255cae',fontWeight:700}}>…</div>
      )}
    </label>
  );
}

// ══════════════════════════════════════════
// SKILL INPUT
// ══════════════════════════════════════════
function SkillInput({ sk, onSkillChange, onCategoryChange, onLevelChange, onDelete, lang }) {
  const [open,setOpen]=useState(false);
  const [input,setInput]=useState(sk.skill||'');
  const suggestions=(SKILL_SUGGESTIONS[sk.category]||SKILL_SUGGESTIONS.other).filter(s=>s.toLowerCase().includes(input.toLowerCase())).slice(0,8);
  return (
    <div className="pp-item-card">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:8}}>
        <div className="pp-field" style={{position:'relative'}}>
          <div className="pp-label">{lang==='fr'?'Compétence':'Skill'}</div>
          <input className="pp-input" value={input}
            onChange={e=>{setInput(e.target.value);onSkillChange(e.target.value);setOpen(true);}}
            onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),200)}
            placeholder="Python, React..."/>
          {open&&suggestions.length>0&&<div className="pp-dropdown">{suggestions.map((s,i)=><div key={i} className="pp-dropdown-item" onClick={()=>{setInput(s);onSkillChange(s);setOpen(false);}}>{s}</div>)}</div>}
        </div>
        <div className="pp-field">
          <div className="pp-label">{lang==='fr'?'Catégorie':'Category'}</div>
          <select className="pp-select" value={sk.category||''} onChange={e=>onCategoryChange(e.target.value)}>
            <option value="">—</option>
            {[['language',lang==='fr'?'Langage':'Language'],['framework','Framework'],['database',lang==='fr'?'BDD':'Database'],['tool',lang==='fr'?'Outil':'Tool'],['devops','DevOps'],['method',lang==='fr'?'Méthode':'Method'],['design','Design'],['other','Autre']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="pp-field">
          <div className="pp-label">{lang==='fr'?'Niveau':'Level'}</div>
          <select className="pp-select" value={sk.level||''} onChange={e=>onLevelChange(e.target.value)}>
            <option value="">—</option>
            {[['beginner',lang==='fr'?'Débutant':'Beginner'],['intermediate',lang==='fr'?'Intermédiaire':'Intermediate'],['advanced',lang==='fr'?'Avancé':'Advanced'],['expert','Expert']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <div style={{textAlign:'right'}}>
        <button className="pp-rm-btn" onClick={onDelete}>✕ {lang==='fr'?'Supprimer':'Remove'}</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN PROFIL PAGE
// ══════════════════════════════════════════
export default function ProfilPage({ user, setUser, handleLogout, handleQuickReply, setView, entretienScores, roadmapData, setRoadmapData }) {
  const { lang } = useT();
  const [tab, setTab] = useState('personal');
  const [profile, setProfile] = useState(emptyProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [completionScore, setCompletionScore] = useState(0);
  const [badges, setBadges] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [matchedScholarships, setMatchedScholarships] = useState([]);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('');

  const roadmap = roadmapData || [];
  const setRoadmap = setRoadmapData;

  // Load profile
  useEffect(()=>{
    const sp=(() => { try { return JSON.parse(localStorage.getItem('opps_profile')||'{}'); } catch { return {}; } })();
    if(user){
      setProfile({...emptyProfile,...sp,
        name:user.name||sp.name||'',email:user.email||'',phone:user.phone||sp.phone||'',
        nationality:user.nationality||sp.nationality||'',countryOfResidence:user.countryOfResidence||sp.countryOfResidence||'',
        linkedin:user.linkedin||sp.linkedin||'',github:user.github||sp.github||'',portfolio:user.portfolio||sp.portfolio||'',
        currentLevel:user.currentLevel||user.niveau||'',fieldOfStudy:user.fieldOfStudy||user.domaine||'',
        institution:user.institution||'',gpa:user.gpa?.toString()||'',graduationYear:user.graduationYear?.toString()||'',
        academicHistory:user.academicHistory||[],workExperience:user.workExperience||[],
        academicProjects:user.academicProjects||sp.academicProjects||[],certifications:user.certifications||sp.certifications||[],
        volunteerWork:user.volunteerWork||sp.volunteerWork||[],publications:user.publications||sp.publications||[],
        awards:user.awards||sp.awards||[],languages:user.languages||[],skills:user.skills||[],
        targetDegree:user.targetDegree||'',
        targetCountries:user.targetCountries||(user.pays?[{country:user.pays}]:[]),
        targetFields:user.targetFields||[],motivationSummary:user.motivationSummary||'',
        avatar:(typeof user.avatar==='string')?user.avatar:(user.avatar?.id||null),
        dateOfBirth:sp.dateOfBirth||'',
      });
    }
  },[user]);

  // Completion score + badges
  useEffect(()=>{
    const items=[!!profile.name,!!profile.phone,!!profile.nationality,!!profile.currentLevel,!!profile.fieldOfStudy,
      !!profile.institution,!!profile.gpa,profile.languages.length>0,profile.skills.length>0,!!profile.targetDegree,
      profile.targetCountries.length>0,!!profile.motivationSummary,profile.academicHistory.length>0,
      profile.workExperience.length>0,profile.academicProjects.length>0,profile.certifications.length>0,
      profile.volunteerWork.length>0,profile.publications.length>0,profile.awards.length>0];
    const score=Math.round((items.filter(Boolean).length/items.length)*100);
    setCompletionScore(score);
    const nb=[];
    if(profile.name&&profile.phone&&profile.nationality)nb.push({id:'profile',name:'🌟 Profile Starter',icon:'📝'});
    if(profile.languages.length>=2)nb.push({id:'polyglot',name:'🗣️ Polyglotte',icon:'🌍'});
    if(profile.skills.length>=5)nb.push({id:'tech',name:'⚙️ Tech Lover',icon:'💻'});
    if(profile.academicProjects.length>=2)nb.push({id:'project',name:'🚀 Project Builder',icon:'📁'});
    if(profile.workExperience.length>=1)nb.push({id:'work',name:'💼 Experienced',icon:'🏢'});
    if(score>=80)nb.push({id:'completion',name:'🏆 Pro Complete',icon:'🎯'});
    setBadges(nb);
  },[profile]);

  // Suggestions
  useEffect(()=>{
    const s=[];
    if(!profile.motivationSummary||profile.motivationSummary.length<200) s.push({text:lang==='fr'?'💡 Motivation détaillée (200+ car.) requise.':'💡 Detailed motivation (200+ chars) needed.'});
    if(profile.targetCountries.length===0) s.push({text:lang==='fr'?'🎯 Ajoute des pays cibles.':'🎯 Add target countries.'});
    if(profile.skills.length<3) s.push({text:lang==='fr'?'🛠️ Plus de compétences techniques.':'🛠️ More technical skills needed.'});
    if(profile.languages.length===0) s.push({text:lang==='fr'?'🌐 Renseigne tes langues.':'🌐 Fill in your languages.'});
    if(profile.academicProjects.length===0) s.push({text:lang==='fr'?'📁 Ajoute tes projets académiques.':'📁 Add your academic projects.'});
    setSuggestions(s);
  },[profile,lang]);

  // Mock matching
  useEffect(()=>{
    if(!profile.fieldOfStudy&&!profile.targetDegree&&profile.targetCountries.length===0&&!profile.currentLevel){setMatchedScholarships([]);return;}
    setMatchedScholarships([{nom:'Bourse Eiffel (France)',score:85},{nom:'Mastercard Foundation',score:72},{nom:'DAAD (Allemagne)',score:68}]);
  },[profile.fieldOfStudy,profile.currentLevel,profile.targetCountries,profile.targetDegree]);

  const upd=(field)=>(i,key,val)=>setProfile(p=>{const a=[...p[field]];a[i]={...a[i],[key]:val};return{...p,[field]:a};});
  const add=(field,empty)=>()=>setProfile(p=>({...p,[field]:[...p[field],{...empty}]}));
  const del=(field)=>(i)=>setProfile(p=>({...p,[field]:p[field].filter((_,j)=>j!==i)}));

  const openAssistant=(section)=>{
    const msgs={personal:{fr:'Remplis ton nom, nationalité et liens pro.',en:'Fill in your name, nationality, and pro links.'},academic:{fr:'Ajoute toutes tes formations.',en:'Add all your education.'},experience:{fr:'Décris tes stages avec des chiffres.',en:'Describe internships with numbers.'},projects:{fr:"Détaille tes projets et technologies.",en:"Detail your projects and technologies."},skills:{fr:'Classe par catégorie et niveau.',en:'Categorize by level.'},goals:{fr:'Sois précis sur tes pays et motivation.',en:'Be precise about countries and motivation.'},dashboard:{fr:'Consulte tes stats et avance ta roadmap.',en:'Check your stats and advance your roadmap.'}};
    const m=msgs[section];
    setAssistantMessage(m?m[lang]:msgs.personal[lang]);
    setShowAssistant(true);
    setTimeout(()=>setShowAssistant(false),5000);
  };

  const handleSave=async()=>{
    if(!user?.id)return;
    setSaving(true);
    try{
      const body={name:profile.name,pays:profile.targetCountries[0]?.country||'',niveau:profile.currentLevel,domaine:profile.fieldOfStudy,phone:profile.phone,nationality:profile.nationality,countryOfResidence:profile.countryOfResidence,currentLevel:profile.currentLevel,fieldOfStudy:profile.fieldOfStudy,institution:profile.institution,gpa:profile.gpa,graduationYear:profile.graduationYear,academicHistory:profile.academicHistory,workExperience:profile.workExperience,languages:profile.languages,skills:profile.skills,targetDegree:profile.targetDegree,targetCountries:profile.targetCountries,targetFields:profile.targetFields,motivationSummary:profile.motivationSummary,academicProjects:profile.academicProjects,certifications:profile.certifications,volunteerWork:profile.volunteerWork,publications:profile.publications,awards:profile.awards,linkedin:profile.linkedin,github:profile.github,portfolio:profile.portfolio,avatar:profile.avatar};
      const{data:result}=await axiosInstance.patch(`/api/users/${user.id}/update-profile`,body);
      const updated={...user,...(result.user||body)};
      localStorage.setItem('opps_user',JSON.stringify(updated));
      localStorage.setItem('opps_profile',JSON.stringify({dateOfBirth:profile.dateOfBirth,academicProjects:profile.academicProjects,certifications:profile.certifications,volunteerWork:profile.volunteerWork,publications:profile.publications,awards:profile.awards,linkedin:profile.linkedin,github:profile.github,portfolio:profile.portfolio}));
      setUser(updated);setSaved(true);setTimeout(()=>setSaved(false),3000);
    }catch(err){console.error('[ProfilPage]',err.response?.data||err.message);}
    finally{setSaving(false);}
  };

  const gradeInfo=completionScore>=80?{label:lang==='fr'?'Excellent':'Excellent',color:'#10b981'}:completionScore>=60?{label:lang==='fr'?'Bon':'Good',color:'#255cae'}:completionScore>=40?{label:lang==='fr'?'En progression':'In progress',color:'#f59e0b'}:{label:lang==='fr'?'À renforcer':'Needs work',color:'#ef4444'};

  const parseScore=txt=>{const m=(txt||'').match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i);return m?parseInt(m[1]):null;};
  const scores=useMemo(()=>(entretienScores||[]).map(s=>({...s,scoreNum:parseScore(s.score)})).filter(s=>s.scoreNum!==null),[entretienScores]);
  const lastScore=scores[0]?.scoreNum??null;
  const avgScore=scores.length>0?Math.round(scores.reduce((a,b)=>a+b.scoreNum,0)/scores.length):null;
  const scoreHistory=useMemo(()=>scores.slice().reverse().map(s=>s.scoreNum),[scores]);
  const roadmapTerminees=useMemo(()=>roadmap.filter(r=>isItemDone(r)).length,[roadmap]);
  const roadmapEnCours=useMemo(()=>roadmap.filter(r=>{const p=getProgress(r);return p>0&&!isItemDone(r);}).length,[roadmap]);
  const urgentDeadlines=[];

  // SkillData — identique au Dashboard: basé sur les scores d'entretien
  const skillData=useMemo(()=>{
    if(scores.length===0) return [{label:'Comm.',value:0},{label:'Motiv.',value:0},{label:'Technique',value:0},{label:'Confiance',value:0},{label:'Culture',value:0}];
    const allText=(entretienScores||[]).map(s=>s.score||'').join(' ').toLowerCase();
    const has=words=>words.some(w=>allText.includes(w));
    const base=avgScore||50;
    return [
      {label:'Comm.',value:Math.min(100,Math.round(base*(has(['communication','clair','articulé'])?1.15:0.9)))},
      {label:'Motiv.',value:Math.min(100,Math.round(base*(has(['motivation','passion','enthousiaste'])?1.2:0.95)))},
      {label:'Technique',value:Math.min(100,Math.round(base*(has(['technique','compétence','maîtrise'])?1.1:0.85)))},
      {label:'Confiance',value:Math.min(100,Math.round(base*(has(['confiance','assurance'])?1.15:0.9)))},
      {label:'Culture',value:Math.min(100,Math.round(base*(has(['culture','pays','international'])?1.1:0.88)))},
    ];
  },[scores,avgScore,entretienScores]);

  const PROFILE_SECTIONS_BARS=[
    {label:lang==='fr'?'Infos de base':'Basic info',pct:['name','email','phone','nationality'].filter(f=>profile[f]).length/4*100,color:'#10b981',icon:'👤'},
    {label:lang==='fr'?'Formation':'Education',pct:['currentLevel','fieldOfStudy','institution','gpa'].filter(f=>profile[f]).length/4*100,color:'#255cae',icon:'🎓'},
    {label:lang==='fr'?'Expériences':'Experience',pct:Math.min(100,((profile.workExperience?.length||0)*25)+((profile.academicProjects?.length||0)*25)),color:'#f59e0b',icon:'💼'},
    {label:lang==='fr'?'Compétences':'Skills',pct:Math.min(100,((profile.languages?.length||0)*33)+((profile.skills?.length||0)*33)),color:'#7c3aed',icon:'🛠️'},
    {label:'Objectifs',pct:(['targetDegree','motivationSummary'].filter(f=>profile[f]).length/2*100)+(profile.targetCountries?.length>0?50:0),color:'#0891b2',icon:'🎯'},
  ];

  const navItems=[
    {id:'personal',label:lang==='fr'?'Personnel':'Personal',icon:'👤'},
    {id:'academic',label:lang==='fr'?'Formation':'Education',icon:'🎓'},
    {id:'experience',label:lang==='fr'?'Expérience':'Experience',icon:'💼'},
    {id:'projects',label:lang==='fr'?'Projets':'Projects',icon:'🚀'},
    {id:'skills',label:lang==='fr'?'Compétences':'Skills',icon:'🛠️'},
    {id:'goals',label:lang==='fr'?'Objectifs':'Goals',icon:'🎯'},
    {id:'dashboard',label:'Dashboard',icon:'📊'},
  ];

  if(!user) return (
    <div className="pp-locked">
      <div className="pp-locked-card">
        <div className="pp-locked-icon">👤</div>
        <div className="pp-locked-title">{lang==='fr'?'Profil non disponible':'Profile unavailable'}</div>
        <p className="pp-locked-desc">{lang==='fr'?'Connectez-vous pour accéder à votre profil.':'Sign in to access your profile.'}</p>
        <button className="pp-locked-btn">🔐 {lang==='fr'?'Se connecter':'Sign in'}</button>
      </div>
    </div>
  );

  return (
    <div className="pp-root">

      {/* ══════ SIDEBAR ══════ */}
      <aside className="pp-sidebar">

        {/* ── Avatar: now uses SidebarAvatarUploader (click to change photo) ── */}
        <div className="pp-sidebar-avatar">
          <SidebarAvatarUploader
            avatarId={profile.avatar}
            onUpload={id=>setProfile(p=>({...p,avatar:id}))}
            completionScore={completionScore}
            lang={lang}
          />
          <div className="pp-sidebar-name">{profile.name||user?.name||(lang==='fr'?'Votre profil':'Your profile')}</div>
          <div className="pp-sidebar-email">{user?.email}</div>
          <div className="pp-sidebar-completion">
            <div className="pp-completion-label">
              <span>{lang==='fr'?'Complétude':'Completion'}</span>
              <span style={{fontWeight:700,color:gradeInfo.color}}>{completionScore}%</span>
            </div>
            <div className="pp-completion-bar-bg">
              <div className="pp-completion-bar-fill" style={{width:`${completionScore}%`}}/>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="pp-sidebar-nav">
          <div className="pp-nav-section-label">{lang==='fr'?'Mon profil':'My profile'}</div>
          {navItems.map(item=>(
            <div key={item.id} className={`pp-nav-item${tab===item.id?' active':''}`} onClick={()=>setTab(item.id)} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&setTab(item.id)}>
              <span className="pp-nav-icon">{item.icon}</span>
              <span style={{flex:1}}>{item.label}</span>
              <span className="pp-nav-tip" onClick={e=>{e.stopPropagation();openAssistant(item.id);}} role="button" tabIndex={0} title="Conseil IA">💡</span>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="pp-sidebar-footer">
          <button
            className={`pp-sidebar-save-btn${saved?' saved':''}`}
            onClick={handleSave}
            disabled={saving}
            style={{background:saved?'#10b981':saving?'#94a3b8':'#255cae'}}
          >
            {saving?'⏳ Sauvegarde...':saved?'✅ Sauvegardé !':`💾 ${lang==='fr'?'Sauvegarder le profil':'Save profile'}`}
          </button>
          <button style={{width:'100%',padding:'8px',borderRadius:6,background:'#eff6ff',border:'1px solid #bfdbfe',color:'#255cae',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}} onClick={()=>{const msg=lang==='fr'?'Je veux mettre à jour mon profil':'I want to update my profile';window.dispatchEvent(new CustomEvent('openChatWithMessage',{detail:{message:msg}}));}}>
            🤖 {lang==='fr'?'Mettre à jour via IA':'Update via AI'}
          </button>
          <button className="pp-sidebar-logout-btn" onClick={handleLogout}>
            ↩ {lang==='fr'?'Déconnexion':'Sign out'}
          </button>
        </div>
      </aside>

      {/* ══════ MAIN ══════ */}
      <main className="pp-main">

        {/* Topbar */}
        <div className="pp-topbar">
          <div className="pp-topbar-breadcrumb">
            <span>OppsTrack</span>
            <span className="pp-topbar-breadcrumb-sep">›</span>
            <span>{lang==='fr'?'Mon profil':'My profile'}</span>
            <span className="pp-topbar-breadcrumb-sep">›</span>
            <span>{navItems.find(n=>n.id===tab)?.label}</span>
          </div>
          <div className="pp-topbar-actions">
            <button onClick={handleSave} disabled={saving} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:6,background:saved?'#10b981':'#255cae',color:'#fff',border:'none',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'background 0.2s'}}>
              {saving?'⏳':saved?'✅':''} {saving?'Sauvegarde...':saved?'Sauvegardé !':'💾 Sauvegarder'}
            </button>
          </div>
        </div>

        <div className="pp-content">

          {/* ══════ DASHBOARD TAB ══════ */}
          {tab==='dashboard' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>

              {/* KPI row */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                {[
                  {label:lang==='fr'?'En roadmap':'In roadmap',val:roadmap.length,icon:'📋',color:'#255cae',bg:'#eff6ff',trend:`${roadmapTerminees} ${lang==='fr'?'terminées':'completed'}`},
                  {label:lang==='fr'?'Terminées':'Completed',val:roadmapTerminees,icon:'✅',color:'#10b981',bg:'#ecfdf5',trend:`${roadmapEnCours} en cours`},
                  {label:lang==='fr'?'Score entretien':'Interview score',val:lastScore!=null?`${lastScore}/100`:'—',icon:'🎙️',color:'#7c3aed',bg:'#f5f3ff',trend:`${scores.length} ${lang==='fr'?'simulés':'simulated'}`},
                  {label:lang==='fr'?'Complétude profil':'Profile completion',val:`${completionScore}%`,icon:'📊',color:completionScore>=80?'#10b981':completionScore>=60?'#255cae':'#f59e0b',bg:'#f8fafc',trend:gradeInfo.label},
                ].map((k,i)=>(
                  <div key={i} style={{background:'#fff',border:'1px solid #e8edf5',borderRadius:12,padding:'14px 16px',borderTop:`3px solid ${k.color}`,boxShadow:'0 2px 6px rgba(13,24,41,0.06)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div><div style={{fontSize:9,color:'#8fa0b5',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:700}}>{k.label}</div><div style={{fontSize:22,fontWeight:800,color:k.color}}>{k.val}</div><div style={{fontSize:10,color:k.color,fontWeight:600,marginTop:3}}>{k.trend}</div></div>
                      <div style={{width:36,height:36,borderRadius:8,background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{k.icon}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Today + Tips */}
              <div style={{background:'#fff',border:'1px solid #e8edf5',borderRadius:14,padding:'16px 20px',borderLeft:'4px solid #f5a623'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:'#255cae'}}>🌅 {lang==='fr'?'Aujourd\'hui — Que faire ?':'Today — What to do?'}</div>
                    <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{new Date().toLocaleDateString(lang==='fr'?'fr-FR':'en-US',{weekday:'long',day:'numeric',month:'long'})}</div>
                  </div>
                  <div style={{fontSize:11,color:'#94a3b8',background:'#f8fafc',padding:'3px 10px',borderRadius:20,border:'1px solid #e8edf5'}}>
                    {urgentDeadlines.length>0?`⚡ ${urgentDeadlines.length} urgent${urgentDeadlines.length>1?'s':''}`:`✨ ${lang==='fr'?'Bonne journée':'Have a great day'}`}
                  </div>
                </div>
                <TodayBlock roadmap={roadmap} urgentDeadlines={urgentDeadlines} scores={scores} setView={setView} lang={lang}/>
              </div>

              {/* SmartTips */}
              <div style={{background:'#fff',border:'1px solid #e8edf5',borderRadius:14,padding:'18px 20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <div style={{fontSize:14,fontWeight:700,color:'#255cae'}}>💡 {lang==='fr'?'Conseils IA':'AI Tips'}</div>
                  <div style={{fontSize:9,color:'#94a3b8',background:'#f8fafc',padding:'2px 8px',borderRadius:4,border:'1px solid #e8edf5'}}>{lang==='fr'?'IA temps réel':'Real-time AI'}</div>
                </div>
                <SmartTips user={user} scores={scores} roadmap={roadmap} urgentDeadlines={urgentDeadlines} setView={setView} lang={lang}/>
              </div>

              {/* Roadmap checklist + Profile strength */}
              <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:14}}>
                <div style={{background:'#fff',border:'1px solid #e8edf5',borderRadius:14,padding:'18px 20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#0d1829'}}>✅ Roadmap</div>
                    <button onClick={()=>setView&&setView('roadmap')} style={{padding:'4px 12px',borderRadius:5,background:'#eff6ff',border:'1px solid #bfdbfe',color:'#255cae',fontSize:11,cursor:'pointer',fontWeight:600,fontFamily:'inherit'}}>{lang==='fr'?'Voir tout →':'View all →'}</button>
                  </div>
                  <ChecklistWidget user={user} roadmap={roadmap} setRoadmap={setRoadmap} lang={lang}/>
                </div>
                <div style={{background:'#fff',border:'1px solid #e8edf5',borderRadius:14,padding:'18px 20px'}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#0d1829',marginBottom:12,textTransform:'uppercase',letterSpacing:'0.06em'}}>📊 {lang==='fr'?'Force dossier':'Profile strength'}</div>
                  <ProfileStrength user={user} scores={scores} lang={lang} setView={setView}/>
                </div>
              </div>

              {/* Score entretien + activité */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div style={{background:'#fff',border:'1px solid #e8edf5',borderRadius:14,padding:'18px 20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#0d1829'}}>📊 {lang==='fr'?'Progression scores':'Score progression'}</div>
                    <button onClick={()=>setView&&setView('entretien')} style={{padding:'4px 12px',borderRadius:5,background:'#eff6ff',border:'1px solid #bfdbfe',color:'#255cae',fontSize:11,cursor:'pointer',fontWeight:600,fontFamily:'inherit'}}>{lang==='fr'?'Pratiquer →':'Practice →'}</button>
                  </div>
                  {scores.length===0?(
                    <div style={{textAlign:'center',padding:'24px 0'}}>
                      <div style={{fontSize:36,marginBottom:8}}>🎙️</div>
                      <div style={{color:'#8fa0b5',fontSize:12,marginBottom:12}}>{lang==='fr'?'Aucun entretien simulé':'No mock interviews'}</div>
                      <button onClick={()=>setView&&setView('entretien')} style={{padding:'8px 18px',borderRadius:6,background:'#255cae',color:'#fff',border:'none',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{lang==='fr'?'Démarrer':'Start'}</button>
                    </div>
                  ):(
                    <>
                      <Sparkline data={scoreHistory} color="#255cae" height={60}/>
                      <div style={{display:'flex',gap:10,marginTop:10,flexWrap:'wrap'}}>
                        <div style={{padding:'8px 12px',borderRadius:8,background:'#f8fafc',border:'1px solid #e8edf5'}}>
                          <div style={{fontSize:18,fontWeight:800,color:lastScore>=75?'#10b981':lastScore>=55?'#f59e0b':'#dc2626'}}>{lastScore}/100</div>
                          <div style={{fontSize:10,color:'#8fa0b5'}}>{lang==='fr'?'Dernier':'Last'}</div>
                        </div>
                        <div style={{padding:'8px 12px',borderRadius:8,background:'#f8fafc',border:'1px solid #e8edf5'}}>
                          <div style={{fontSize:18,fontWeight:800,color:'#475569'}}>{scores.length}</div>
                          <div style={{fontSize:10,color:'#8fa0b5'}}>{lang==='fr'?'Simulés':'Simulated'}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div style={{background:'#fff',border:'1px solid #e8edf5',borderRadius:14,padding:'18px 20px'}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#0d1829',marginBottom:12,textTransform:'uppercase',letterSpacing:'0.06em'}}>🔥 {lang==='fr'?'Activité hebdo':'Weekly activity'}</div>
                  <StreakWidget activities={[]} lang={lang}/>
                  {(()=>{
                    const today=new Date();
                    const JOURS=lang==='fr'?['Di','Lu','Ma','Me','Je','Ve','Sa']:['Su','Mo','Tu','We','Th','Fr','Sa'];
                    const data7=Array.from({length:7},(_, i)=>{const d=new Date(today);d.setDate(today.getDate()-(6-i));return{label:JOURS[d.getDay()],val:0};});
                    return <MiniBarChart data={data7} color="#255cae" height={36}/>;
                  })()}
                </div>
              </div>

              {/* ── WIDGETS: Complétude + Suggestions + Bourses + Badges ── */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                {/* Complétude widget */}
                <div style={{background:'#fff',border:'1px solid #e8edf5',borderRadius:14,padding:'18px 20px'}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#0d1829',marginBottom:12,textTransform:'uppercase',letterSpacing:'0.06em'}}>📊 {lang==='fr'?'Complétude':'Completeness'}</div>
                  <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
                    <AnimatedRing pct={completionScore} size={64} sw={6} color={gradeInfo.color}>
                      <span style={{fontSize:12,fontWeight:800,color:gradeInfo.color}}>{completionScore}%</span>
                    </AnimatedRing>
                    <div>
                      <div style={{fontSize:20,fontWeight:800,color:gradeInfo.color}}>{completionScore}%</div>
                      <div style={{fontSize:11,color:gradeInfo.color,fontWeight:600}}>{gradeInfo.label}</div>
                    </div>
                  </div>
                  {PROFILE_SECTIONS_BARS.map((s,i)=>(
                    <div key={i} style={{marginBottom:7}}>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                        <span style={{fontSize:12}}>{s.icon}</span>
                        <span style={{fontSize:10,color:'#4b5a6e',flex:1,fontWeight:500}}>{s.label}</span>
                        <span style={{fontSize:10,fontWeight:700,color:s.color}}>{Math.round(s.pct)}%</span>
                      </div>
                      <div style={{height:3,borderRadius:99,background:'#e8edf5',overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${s.pct}%`,background:s.color,borderRadius:99,transition:'width 0.8s ease'}}/>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suggestions + Bourses + Badges stacked */}
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {suggestions.length>0&&(
                    <div style={{background:'#fff',border:'1px solid #e8edf5',borderRadius:14,padding:'18px 20px'}}>
                      <div style={{fontSize:12,fontWeight:700,color:'#0d1829',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.06em'}}>🤖 {lang==='fr'?'Suggestions IA':'AI Suggestions'}</div>
                      <div className="pp-suggestions">
                        {suggestions.map((s,i)=><div key={i} className="pp-suggestion-item">{s.text}</div>)}
                      </div>
                    </div>
                  )}
                  {matchedScholarships.length>0&&(
                    <div style={{background:'#fff',border:'1px solid #e8edf5',borderRadius:14,padding:'18px 20px'}}>
                      <div style={{fontSize:12,fontWeight:700,color:'#0d1829',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.06em'}}>🎓 {lang==='fr'?'Bourses correspondantes':'Matching scholarships'}</div>
                      <div className="pp-match-list">
                        {matchedScholarships.map((b,i)=>(
                          <div key={i} className="pp-match-item">
                            <div className="pp-match-name">{b.nom}</div>
                            <div className="pp-match-score">{b.score}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {badges.length>0&&(
                    <div style={{background:'#fff',border:'1px solid #e8edf5',borderRadius:14,padding:'18px 20px'}}>
                      <div style={{fontSize:12,fontWeight:700,color:'#0d1829',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.06em'}}>🏅 Badges</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {badges.map(b=><div key={b.id} className="pp-badge">{b.icon} {b.name}</div>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Radar de compétences + Conseils entretien */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                {/* Radar */}
                <div style={{background:'#fff',border:'1px solid #e8edf5',borderRadius:14,padding:'18px 20px'}}>
                  <div style={{fontSize:14,fontWeight:700,color:'#255cae',marginBottom:4}}>🕸️ {lang==='fr'?'Radar de compétences':'Skills radar'}</div>
                  <div style={{fontSize:11,color:'#64748b',marginBottom:14}}>
                    {scores.length>0
                      ?(lang==='fr'?`Basé sur ${scores.length} entretien${scores.length>1?'s':''}`:`Based on ${scores.length} interview${scores.length>1?'s':''}`)
                      :user?.skills?.length>0
                        ?(lang==='fr'?`${user.skills.length} compétence${user.skills.length>1?'s':''} dans le profil`:`${user.skills.length} skill${user.skills.length>1?'s':''} in profile`)
                        :(lang==='fr'?'Lance un entretien pour des données réelles':'Start an interview for real data')}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:16}}>
                    <SkillRadar skills={skillData}/>
                    <div style={{display:'flex',flexDirection:'column',gap:8,flex:1}}>
                      {skillData.map(s=>(
                        <div key={s.label}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                            <span style={{fontSize:11,color:'#475569'}}>{s.label}</span>
                            <span style={{fontSize:10,fontWeight:700,color:'#255cae'}}>{s.value}%</span>
                          </div>
                          <div style={{height:4,borderRadius:99,background:'#f1f5f9',overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${s.value}%`,background:s.value>=80?'#166534':s.value>=60?'#2563eb':'#d97706',borderRadius:99,transition:'width 0.8s ease'}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={()=>setView&&setView('entretien')} style={{width:'100%',marginTop:14,padding:'9px',borderRadius:6,background:'#255cae',color:'#fff',border:'none',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                    🎙️ {lang==='fr'?'Lancer un entretien IA':'Start AI interview'}
                  </button>
                </div>

                {/* Conseils entretien */}
                <div style={{background:'#fff',border:'1px solid #e8edf5',borderRadius:14,padding:'18px 20px'}}>
                  <div style={{fontSize:14,fontWeight:700,color:'#255cae',marginBottom:14}}>💪 {lang==='fr'?'Conseils pour ton entretien':'Interview tips'}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {[
                      {icon:'🗣️',title:lang==='fr'?'Méthode STAR':'STAR Method',desc:lang==='fr'?'Situation → Tâche → Action → Résultat. Cite toujours des chiffres.':'Situation → Task → Action → Result. Always cite numbers.',color:'#eff6ff',border:'#bfdbfe',text:'#255cae'},
                      {icon:'🎯',title:lang==='fr'?'Projet précis':'Specific project',desc:lang==='fr'?'Cite le nom de tes profs cibles et laboratoires visés dans le pays.':'Mention target professors and labs in the country.',color:'#f0fdf4',border:'#bbf7d0',text:'#166534'},
                      {icon:'⏱️',title:lang==='fr'?'Gestion du temps':'Time management',desc:lang==='fr'?'2-3 minutes max par réponse.':'2-3 minutes max per answer.',color:'#fffbeb',border:'#fde68a',text:'#856404'},
                      {icon:'🌍',title:lang==='fr'?'Contexte culturel':'Cultural context',desc:lang==='fr'?'Montre que tu connais le pays, son système d\'éducation, sa culture.':'Show you know the country, its education system, its culture.',color:'#f5f3ff',border:'#ddd6fe',text:'#7c3aed'},
                    ].map((c,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',borderRadius:8,background:c.color,border:`1px solid ${c.border}`}}>
                        <span style={{fontSize:18,flexShrink:0}}>{c.icon}</span>
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:c.text,marginBottom:3}}>{c.title}</div>
                          <div style={{fontSize:11,color:'#64748b',lineHeight:1.5}}>{c.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>setView&&setView('entretien')} style={{width:'100%',marginTop:14,padding:'10px',borderRadius:8,background:'linear-gradient(135deg,#255cae,#1a3f7a)',color:'white',border:'none',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                    🎙️ {lang==='fr'?'Lancer un entretien IA →':'Start AI interview →'}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ══════ FORM TABS ══════ */}
          {tab!=='dashboard' && (
            <div className="pp-layout" style={{gridTemplateColumns:'1fr'}}>
              <div className="pp-form-panel">
                <div className="pp-form-section">

                  {/* ── PERSONNEL ── */}
                  {tab==='personal' && (
                    <div style={{display:'flex',flexDirection:'column',gap:20}}>
                      <SectionTitle>👤 {lang==='fr'?'Informations personnelles':'Personal information'}</SectionTitle>
                      <div className="pp-grid-2">
                        <Field label={lang==='fr'?'Nom complet':'Full name'} v={profile.name} s={v=>setProfile(p=>({...p,name:v}))} ph="Prénom Nom"/>
                        <Field label="Email" v={profile.email} readOnly/>
                        <Field label={lang==='fr'?'Téléphone':'Phone'} v={profile.phone} s={v=>setProfile(p=>({...p,phone:v}))} ph="+216 XX XXX XXX"/>
                        <AutocompleteInput label={lang==='fr'?'Date de naissance':'Date of birth'} value={profile.dateOfBirth} onChange={v=>setProfile(p=>({...p,dateOfBirth:v}))} suggestions={[]} type="date"/>
                        <AutocompleteInput label={lang==='fr'?'Nationalité':'Nationality'} value={profile.nationality} onChange={v=>setProfile(p=>({...p,nationality:v}))} suggestions={COUNTRY_SUGGESTIONS} placeholder="Ex: Tunisienne"/>
                        <AutocompleteInput label={lang==='fr'?'Pays de résidence':'Residence'} value={profile.countryOfResidence} onChange={v=>setProfile(p=>({...p,countryOfResidence:v}))} suggestions={COUNTRY_SUGGESTIONS} placeholder="Ex: Tunisie"/>
                      </div>
                      <SectionTitle>🔗 {lang==='fr'?'Liens professionnels':'Professional links'}</SectionTitle>
                      <div className="pp-grid-2">
                        <Field label="LinkedIn" v={profile.linkedin} s={v=>setProfile(p=>({...p,linkedin:v}))} ph="linkedin.com/in/..."/>
                        <Field label="GitHub" v={profile.github} s={v=>setProfile(p=>({...p,github:v}))} ph="github.com/..."/>
                        <div className="pp-grid-full"><Field label="Portfolio" v={profile.portfolio} s={v=>setProfile(p=>({...p,portfolio:v}))} ph="https://your-site.com"/></div>
                      </div>
                      <SectionTitle>🏆 {lang==='fr'?'Distinctions & prix':'Awards'}</SectionTitle>
                      {profile.awards.map((a,i)=>(
                        <div key={i} className="pp-item-card">
                          <div className="pp-item-card-header"><div className="pp-item-card-title">🏆 {a.title||`Prix #${i+1}`}</div><button className="pp-rm-btn" onClick={()=>del('awards')(i)}>✕</button></div>
                          <div className="pp-grid-2">
                            <Field label="Titre" v={a.title} s={v=>upd('awards')(i,'title',v)} ph="Prix Innovation 2024"/>
                            <Field label="Organisation" v={a.organization} s={v=>upd('awards')(i,'organization',v)} ph="Université X"/>
                            <Field label="Année" v={a.year} s={v=>upd('awards')(i,'year',v)} ph="2024"/>
                            <div className="pp-grid-full"><Field label="Description" v={a.description} s={v=>upd('awards')(i,'description',v)} ph="Brève description"/></div>
                          </div>
                        </div>
                      ))}
                      <button className="pp-add-btn" onClick={add('awards',{title:'',organization:'',year:'',description:''})}>+ {lang==='fr'?'Ajouter une distinction':'Add an award'}</button>
                    </div>
                  )}

                  {/* ── FORMATION ── */}
                  {tab==='academic' && (
                    <div style={{display:'flex',flexDirection:'column',gap:20}}>
                      <SectionTitle>🎓 Formation actuelle</SectionTitle>
                      <div className="pp-grid-2">
                        <div className="pp-field"><div className="pp-label">Niveau actuel</div><select className="pp-select" value={profile.currentLevel} onChange={e=>setProfile(p=>({...p,currentLevel:e.target.value}))}><option value="">—</option>{DEG_LEVELS.map(v=><option key={v} value={v}>{v}</option>)}</select></div>
                        <AutocompleteInput label="Domaine d'études" value={profile.fieldOfStudy} onChange={v=>setProfile(p=>({...p,fieldOfStudy:v}))} suggestions={FIELD_SUGGESTIONS} placeholder="Ex: Informatique"/>
                        <div className="pp-grid-full"><Field label="Établissement" v={profile.institution} s={v=>setProfile(p=>({...p,institution:v}))} ph="Ex: ISIMA Mahdia"/></div>
                        <Field label="Moyenne (sur 20)" v={profile.gpa} s={v=>setProfile(p=>({...p,gpa:v}))} type="number" ph="14.5"/>
                        <Field label="Année de diplôme" v={profile.graduationYear} s={v=>setProfile(p=>({...p,graduationYear:v}))} type="number" ph="2026"/>
                      </div>
                      <SectionTitle>📚 Historique académique</SectionTitle>
                      {profile.academicHistory.map((h,i)=>(
                        <div key={i} className="pp-item-card">
                          <div className="pp-item-card-header"><div className="pp-item-card-title">🎓 {h.degree||`Diplôme #${i+1}`}</div><button className="pp-rm-btn" onClick={()=>del('academicHistory')(i)}>✕</button></div>
                          <div className="pp-grid-2">
                            <Field label="Diplôme" v={h.degree} s={v=>upd('academicHistory')(i,'degree',v)} ph="Licence, Master..."/>
                            <Field label="Établissement" v={h.institution} s={v=>upd('academicHistory')(i,'institution',v)} ph="Lycée Mixte"/>
                            <AutocompleteInput label="Domaine" value={h.field} onChange={v=>upd('academicHistory')(i,'field',v)} suggestions={FIELD_SUGGESTIONS} placeholder="Ex: Maths"/>
                            <Field label="Année" v={h.year} s={v=>upd('academicHistory')(i,'year',v)} ph="2022"/>
                            <div className="pp-grid-full"><Field label="Mention" v={h.grade} s={v=>upd('academicHistory')(i,'grade',v)} ph="Bien, 15/20..."/></div>
                          </div>
                        </div>
                      ))}
                      <button className="pp-add-btn" onClick={add('academicHistory',{degree:'',institution:'',field:'',year:'',grade:''})}>+ Ajouter un diplôme</button>
                      <SectionTitle>📜 Certifications</SectionTitle>
                      {profile.certifications.map((c,i)=>(
                        <div key={i} className="pp-item-card">
                          <div className="pp-item-card-header"><div className="pp-item-card-title">📜 {c.name||`Certification #${i+1}`}</div><button className="pp-rm-btn" onClick={()=>del('certifications')(i)}>✕</button></div>
                          <div className="pp-grid-2">
                            <Field label="Certification" v={c.name} s={v=>upd('certifications')(i,'name',v)} ph="AWS, Google Analytics..."/>
                            <Field label="Organisme" v={c.issuer} s={v=>upd('certifications')(i,'issuer',v)} ph="Coursera, Amazon..."/>
                            <AutocompleteInput label="Date" value={c.date} onChange={v=>upd('certifications')(i,'date',v)} suggestions={[]} type="date"/>
                            <Field label="ID / Lien" v={c.credential} s={v=>upd('certifications')(i,'credential',v)} ph="URL ou ID"/>
                          </div>
                        </div>
                      ))}
                      <button className="pp-add-btn" onClick={add('certifications',{name:'',issuer:'',date:'',credential:''})}>+ Ajouter une certification</button>
                      <SectionTitle>📄 Publications</SectionTitle>
                      {profile.publications.map((p,i)=>(
                        <div key={i} className="pp-item-card">
                          <div className="pp-item-card-header"><div className="pp-item-card-title">📄 {p.title||`Publication #${i+1}`}</div><button className="pp-rm-btn" onClick={()=>del('publications')(i)}>✕</button></div>
                          <div className="pp-grid-2">
                            <div className="pp-grid-full"><Field label="Titre" v={p.title} s={v=>upd('publications')(i,'title',v)} ph="Titre de l'article"/></div>
                            <Field label="Revue / Conférence" v={p.venue} s={v=>upd('publications')(i,'venue',v)} ph="IEEE, ICSI..."/>
                            <Field label="Année" v={p.year} s={v=>upd('publications')(i,'year',v)} ph="2024"/>
                            <div className="pp-grid-full"><Field label="Co-auteurs" v={p.authors} s={v=>upd('publications')(i,'authors',v)} ph="Noms des co-auteurs"/></div>
                          </div>
                        </div>
                      ))}
                      <button className="pp-add-btn" onClick={add('publications',{title:'',venue:'',year:'',authors:''})}>+ Ajouter une publication</button>
                    </div>
                  )}

                  {/* ── EXPÉRIENCE ── */}
                  {tab==='experience' && (
                    <div style={{display:'flex',flexDirection:'column',gap:20}}>
                      <SectionTitle>💼 Expériences professionnelles</SectionTitle>
                      {profile.workExperience.map((w,i)=>(
                        <div key={i} className="pp-item-card">
                          <div className="pp-item-card-header"><div className="pp-item-card-title">💼 {w.position||`Expérience #${i+1}`} {w.company?`@ ${w.company}`:''}</div><button className="pp-rm-btn" onClick={()=>del('workExperience')(i)}>✕</button></div>
                          <div className="pp-grid-2">
                            <div className="pp-field"><div className="pp-label">Type</div><select className="pp-select" value={w.type||''} onChange={e=>upd('workExperience')(i,'type',e.target.value)}><option value="">—</option><option value="internship">Stage</option><option value="job">Emploi</option><option value="freelance">Freelance</option></select></div>
                            <Field label="Poste" v={w.position} s={v=>upd('workExperience')(i,'position',v)} ph="Ex: Développeur Web"/>
                            <Field label="Entreprise" v={w.company} s={v=>upd('workExperience')(i,'company',v)} ph="Ex: TechCorp"/>
                            <AutocompleteInput label="Ville" value={w.city} onChange={v=>upd('workExperience')(i,'city',v)} suggestions={['Tunis','Sfax','Sousse','Paris','Montréal']} placeholder="Ex: Tunis"/>
                            <AutocompleteInput label="Début" value={w.startDate} onChange={v=>upd('workExperience')(i,'startDate',v)} suggestions={[]} type="date"/>
                            <AutocompleteInput label="Fin" value={w.endDate} onChange={v=>upd('workExperience')(i,'endDate',v)} suggestions={[]} type="date"/>
                            <div className="pp-grid-full pp-field"><div className="pp-label">Description</div><textarea className="pp-textarea" value={w.description||''} onChange={e=>upd('workExperience')(i,'description',e.target.value)} placeholder="Missions, résultats, chiffres clés..."/></div>
                            <div className="pp-grid-full"><Field label="Technologies" v={w.technologies} s={v=>upd('workExperience')(i,'technologies',v)} ph="React, Laravel, MySQL..."/></div>
                          </div>
                        </div>
                      ))}
                      <button className="pp-add-btn" onClick={add('workExperience',{position:'',company:'',city:'',startDate:'',endDate:'',description:'',type:'internship',technologies:''})}>+ Ajouter une expérience</button>
                      <SectionTitle>🤝 Bénévolat & associations</SectionTitle>
                      {profile.volunteerWork.map((v,i)=>(
                        <div key={i} className="pp-item-card">
                          <div className="pp-item-card-header"><div className="pp-item-card-title">🤝 {v.role||`Activité #${i+1}`}</div><button className="pp-rm-btn" onClick={()=>del('volunteerWork')(i)}>✕</button></div>
                          <div className="pp-grid-2">
                            <Field label="Rôle" v={v.role} s={val=>upd('volunteerWork')(i,'role',val)} ph="Ex: Team Manager"/>
                            <Field label="Organisation" v={v.organization} s={val=>upd('volunteerWork')(i,'organization',val)} ph="Ex: JCI, Club Microsoft"/>
                            <AutocompleteInput label="Début" value={v.startDate} onChange={val=>upd('volunteerWork')(i,'startDate',val)} suggestions={[]} type="date"/>
                            <AutocompleteInput label="Fin" value={v.endDate} onChange={val=>upd('volunteerWork')(i,'endDate',val)} suggestions={[]} type="date"/>
                            <div className="pp-grid-full pp-field"><div className="pp-label">Description</div><textarea className="pp-textarea" value={v.description||''} onChange={e=>upd('volunteerWork')(i,'description',e.target.value)} placeholder="Responsabilités, impact..."/></div>
                          </div>
                        </div>
                      ))}
                      <button className="pp-add-btn" onClick={add('volunteerWork',{role:'',organization:'',startDate:'',endDate:'',description:''})}>+ Ajouter une activité</button>
                    </div>
                  )}

                  {/* ── PROJETS ── */}
                  {tab==='projects' && (
                    <div style={{display:'flex',flexDirection:'column',gap:20}}>
                      <SectionTitle>🚀 Projets académiques</SectionTitle>
                      <div className="pp-tip-box">💡 Les projets académiques sont essentiels pour un CV de bourse — ils montrent vos compétences pratiques.</div>
                      {profile.academicProjects.length===0&&<div className="pp-empty-state"><div className="pp-empty-state-icon">🚀</div><div className="pp-empty-state-title">Aucun projet ajouté</div><div className="pp-empty-state-text">Ajoutez vos projets : PFE, cours, personnels, startups...</div></div>}
                      {profile.academicProjects.map((p,i)=>(
                        <div key={i} className="pp-item-card">
                          <div className="pp-item-card-header"><div className="pp-item-card-title">🚀 {p.title||`Projet #${i+1}`}</div><button className="pp-rm-btn" onClick={()=>del('academicProjects')(i)}>✕</button></div>
                          <div className="pp-grid-2">
                            <div className="pp-grid-full"><Field label="Titre" v={p.title} s={v=>upd('academicProjects')(i,'title',v)} ph="Ex: Système de gestion..."/></div>
                            <div className="pp-field"><div className="pp-label">Type</div><select className="pp-select" value={p.type||''} onChange={e=>upd('academicProjects')(i,'type',e.target.value)}><option value="">—</option><option value="pfe">PFE</option><option value="academic">Académique</option><option value="personal">Personnel</option><option value="entrepreneurial">Entrepreneurial</option><option value="research">Recherche</option></select></div>
                            <div className="pp-field"><div className="pp-label">Équipe</div><select className="pp-select" value={p.teamSize||''} onChange={e=>upd('academicProjects')(i,'teamSize',e.target.value)}><option value="">—</option><option value="solo">Individuel</option><option value="2">2 personnes</option><option value="3-5">3-5 personnes</option><option value="6+">Plus de 5</option></select></div>
                            <Field label="Encadrant" v={p.supervisor} s={v=>upd('academicProjects')(i,'supervisor',v)} ph="Prof. Ben Ali"/>
                            <Field label="Année" v={p.year} s={v=>upd('academicProjects')(i,'year',v)} ph="2024"/>
                            <AutocompleteInput label="Début" value={p.startDate} onChange={v=>upd('academicProjects')(i,'startDate',v)} suggestions={[]} type="date"/>
                            <AutocompleteInput label="Fin" value={p.endDate} onChange={v=>upd('academicProjects')(i,'endDate',v)} suggestions={[]} type="date"/>
                            <div className="pp-grid-full pp-field"><div className="pp-label">Description</div><textarea className="pp-textarea" style={{minHeight:90}} value={p.description||''} onChange={e=>upd('academicProjects')(i,'description',e.target.value)} placeholder="Objectif, fonctionnalités, résultats..."/></div>
                            <div className="pp-grid-full"><Field label="Technologies" v={p.technologies} s={v=>upd('academicProjects')(i,'technologies',v)} ph="HTML, CSS, PHP, MySQL..."/></div>
                            <Field label="GitHub / Demo" v={p.link} s={v=>upd('academicProjects')(i,'link',v)} ph="https://github.com/..."/>
                            <Field label="Impact" v={p.impact} s={v=>upd('academicProjects')(i,'impact',v)} ph="Déployé, prix reçu..."/>
                          </div>
                        </div>
                      ))}
                      <button className="pp-add-btn" onClick={add('academicProjects',{title:'',type:'',supervisor:'',year:'',startDate:'',endDate:'',description:'',technologies:'',link:'',teamSize:'',impact:''})}>+ Ajouter un projet académique</button>
                    </div>
                  )}

                  {/* ── COMPÉTENCES ── */}
                  {tab==='skills' && (
                    <div style={{display:'flex',flexDirection:'column',gap:20}}>
                      <SectionTitle>🌐 Langues</SectionTitle>
                      {profile.languages.map((l,i)=>(
                        <div key={i} className="pp-item-card">
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:8}}>
                            <AutocompleteInput label="Langue" value={l.language} onChange={v=>upd('languages')(i,'language',v)} suggestions={LANGUAGE_SUGGESTIONS} placeholder="Ex: Anglais"/>
                            <div className="pp-field"><div className="pp-label">Niveau CECRL</div><select className="pp-select" value={l.level||''} onChange={e=>upd('languages')(i,'level',e.target.value)}><option value="">—</option>{['A1','A2','B1','B2','C1','C2','Natif'].map(v=><option key={v}>{v}</option>)}</select></div>
                            <AutocompleteInput label="Certificat" value={l.certificate} onChange={v=>upd('languages')(i,'certificate',v)} suggestions={['IELTS','TOEIC','TOEFL','DELF','DALF','Cambridge']} placeholder="IELTS 7.5..."/>
                          </div>
                          <div style={{textAlign:'right'}}><button className="pp-rm-btn" onClick={()=>del('languages')(i)}>✕</button></div>
                        </div>
                      ))}
                      <button className="pp-add-btn" onClick={add('languages',{language:'',level:'',certificate:''})}>+ Ajouter une langue</button>
                      <SectionTitle>🛠️ Compétences techniques</SectionTitle>
                      <div className="pp-tip-box">💡 Regroupez par catégorie : Langages, Frameworks, Bases de données, DevOps...</div>
                      {profile.skills.map((sk,i)=>(
                        <SkillInput key={i} sk={sk} lang={lang}
                          onSkillChange={v=>upd('skills')(i,'skill',v)}
                          onCategoryChange={v=>upd('skills')(i,'category',v)}
                          onLevelChange={v=>upd('skills')(i,'level',v)}
                          onDelete={()=>del('skills')(i)}/>
                      ))}
                      <button className="pp-add-btn" onClick={add('skills',{skill:'',level:'',category:''})}>+ Ajouter une compétence</button>
                    </div>
                  )}

                  {/* ── OBJECTIFS ── */}
                  {tab==='goals' && (
                    <div style={{display:'flex',flexDirection:'column',gap:20}}>
                      <SectionTitle>🎯 Projet d'études à l'étranger</SectionTitle>
                      <div className="pp-grid-2">
                        <div className="pp-field"><div className="pp-label">Niveau visé</div><select className="pp-select" value={profile.targetDegree} onChange={e=>setProfile(p=>({...p,targetDegree:e.target.value}))}><option value="">—</option>{['Licence','Master','Doctorat','Ingénieur','Formation courte','Résidence de recherche'].map(v=><option key={v}>{v}</option>)}</select></div>
                      </div>
                      <div className="pp-field"><div className="pp-label">Pays cibles</div>
                        {profile.targetCountries.map((c,i)=>(
                          <div key={i} style={{display:'flex',gap:8,marginBottom:8}}>
                            <AutocompleteInput label="" value={c.country} onChange={v=>upd('targetCountries')(i,'country',v)} suggestions={COUNTRY_SUGGESTIONS} placeholder="France, Canada, Belgique..."/>
                            <button className="pp-rm-btn" onClick={()=>del('targetCountries')(i)}>✕</button>
                          </div>
                        ))}
                        <button className="pp-add-btn" onClick={add('targetCountries',{country:''})}>+ Ajouter un pays</button>
                      </div>
                      <div className="pp-field"><div className="pp-label">Domaines visés</div>
                        {profile.targetFields.map((f,i)=>(
                          <div key={i} style={{display:'flex',gap:8,marginBottom:8}}>
                            <AutocompleteInput label="" value={f.field} onChange={v=>upd('targetFields')(i,'field',v)} suggestions={FIELD_SUGGESTIONS} placeholder="IA, Data Science..."/>
                            <button className="pp-rm-btn" onClick={()=>del('targetFields')(i)}>✕</button>
                          </div>
                        ))}
                        <button className="pp-add-btn" onClick={add('targetFields',{field:''})}>+ Ajouter un domaine</button>
                      </div>
                      <div className="pp-field">
                        <div className="pp-label">Résumé de motivation</div>
                        <textarea className="pp-textarea" style={{minHeight:160}} value={profile.motivationSummary} onChange={e=>setProfile(p=>({...p,motivationSummary:e.target.value}))} placeholder="Décrivez vos motivations, votre projet professionnel, pourquoi vous voulez étudier à l'étranger..."/>
                        <div className="pp-char-counter">
                          <span>{profile.motivationSummary.length} {lang==='fr'?'caractères':'characters'}</span>
                          {profile.motivationSummary.length>0&&profile.motivationSummary.length<200&&<span className="pp-char-warn">Min. 200 recommandé</span>}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>


            </div>
          )}

        </div>
      </main>

      {/* Assistant popup */}
      {showAssistant&&(
        <div className="pp-assistant-popup">
          <div className="pp-assistant-header">🤖 Assistant IA</div>
          <div className="pp-assistant-body">{assistantMessage}</div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}