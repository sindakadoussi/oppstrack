// src/pages/ProfilPage.jsx — v5
// Design: editorial, même style que HomePage/BoursesPage
// - Navigation horizontale sans sidebar, sans roadmap nav, Dashboard au lieu de Intelligence
// - Pas d'emojis dans les titres de section
// - Données dynamiques liées à entretienScores, roadmapData, bourses
// - Prochaines actions prioritaires dynamiques
// - Dashboards pro et attirants
"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';
import './profil.css';

// ══════════════════════════════════════
// TOKENS — identique HomePage
// ══════════════════════════════════════
const tokens = (theme) => ({
  accent:    theme==="dark"?"#4c9fd9":"#0066b3",
  accentInk: theme==="dark"?"#8ec1e6":"#004f8a",
  ink:       theme==="dark"?"#f2efe7":"#141414",
  ink2:      theme==="dark"?"#cfccc2":"#3a3a3a",
  ink3:      theme==="dark"?"#a19f96":"#6b6b6b",
  ink4:      theme==="dark"?"#6d6b64":"#9a9794",
  paper:     theme==="dark"?"#15140f":"#faf8f3",
  paper2:    theme==="dark"?"#1d1c16":"#f2efe7",
  rule:      theme==="dark"?"#2b2a22":"#d9d5cb",
  ruleSoft:  theme==="dark"?"#24231c":"#e8e4d9",
  surface:   theme==="dark"?"#1a1912":"#ffffff",
  danger:    "#b4321f",
  warn:      "#b06a12",
  green:     "#1a7a4a",
  fSerif:`"Playfair Display","Times New Roman",Georgia,serif`,
  fSans: `"DM Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`,
  fMono: `"DM Sans",monospace`,
});

// ══════════════════════════════════════
// DONNÉES STATIQUES
// ══════════════════════════════════════
const emptyProfile = {
  name:'',email:'',phone:'',dateOfBirth:'',nationality:'',countryOfResidence:'',
  linkedin:'',github:'',portfolio:'',currentLevel:'',fieldOfStudy:'',institution:'',
  gpa:'',graduationYear:'',academicHistory:[],workExperience:[],academicProjects:[],
  certifications:[],volunteerWork:[],publications:[],awards:[],languages:[],skills:[],
  targetDegree:'',targetCountries:[],targetFields:[],motivationSummary:'',avatar:null,
};
const LANGUAGE_SUGGESTIONS=['Anglais','Français','Arabe','Espagnol','Allemand','Italien','Chinois','Russe','Portugais','Japonais'];
const COUNTRY_SUGGESTIONS=['France','Canada','Belgique','Suisse','Allemagne','Italie','Espagne','Royaume-Uni','États-Unis','Australie','Tunisie','Maroc','Algérie'];
const FIELD_SUGGESTIONS=['Informatique','Génie logiciel','Intelligence Artificielle','Data Science','Cybersécurité','Gestion','Marketing','Finance','Droit','Médecine'];
const SKILL_SUGGESTIONS={
  language:['Python','JavaScript','Java','C++','PHP','Ruby','Go','Swift'],
  framework:['React','Angular','Vue.js','Django','Flask','Spring Boot','Laravel','Node.js'],
  database:['MySQL','PostgreSQL','MongoDB','Redis','Firebase','Oracle'],
  tool:['Git','Docker','Kubernetes','Jenkins','Jira','Figma'],
  devops:['AWS','Azure','Google Cloud','Terraform','Ansible','Linux'],
  method:['Agile','Scrum','Kanban','DevOps','CI/CD','TDD'],
  design:['UI/UX Design','Figma','Sketch','Adobe XD'],
  other:['Microsoft Office','Excel','Salesforce','SAP'],
};
const DEG_LEVELS=['Licence 1','Licence 2','Licence 3','Master 1','Master 2','Doctorat','Ingénieur 1','Ingénieur 2','Ingénieur 3'];

// ══════════════════════════════════════
// SCORING ENGINE
// ══════════════════════════════════════
function computeSubScores(profile, scores=[]) {
  const academic=Math.min(100,Math.round(
    (profile.currentLevel?20:0)+(profile.fieldOfStudy?15:0)+(profile.institution?15:0)+
    (profile.gpa?Math.min(30,parseFloat(profile.gpa)/20*30):0)+
    (profile.academicHistory?.length>0?10:0)+(profile.graduationYear?10:0)
  ));
  const experience=Math.min(100,Math.round(
    Math.min(40,(profile.workExperience?.length||0)*20)+
    Math.min(30,(profile.volunteerWork?.length||0)*15)+
    Math.min(30,(profile.certifications?.length||0)*15)
  ));
  const projects=Math.min(100,Math.round(
    Math.min(60,(profile.academicProjects?.length||0)*30)+
    Math.min(25,(profile.publications?.length||0)*25)+
    Math.min(15,(profile.awards?.length||0)*15)
  ));
  const languages=Math.min(100,Math.round(
    Math.min(70,(profile.languages?.length||0)*35)+
    (profile.languages?.some(l=>['B2','C1','C2','Natif'].includes(l.level))?20:0)+
    (profile.languages?.some(l=>l.certificate)?10:0)
  ));
  const motivation=Math.min(100,Math.round(
    (profile.targetDegree?15:0)+(profile.targetCountries?.length>0?15:0)+
    (profile.targetFields?.length>0?10:0)+
    Math.min(60,Math.floor((profile.motivationSummary?.length||0)/500*60))
  ));
  const avgInterview=scores.length>0?Math.round(scores.reduce((a,b)=>a+(b.scoreNum||0),0)/scores.length):0;
  const interview=Math.min(100,Math.round(avgInterview*0.6+Math.min(40,scores.length*13)));
  const global=Math.min(100,Math.round(academic*0.22+experience*0.18+projects*0.18+languages*0.15+motivation*0.17+interview*0.10));
  return {academic,experience,projects,languages,motivation,interview,global};
}

function getTier(score,c){
  if(score>=75) return {label:'Fort candidat',labelEn:'Strong applicant',color:c.green,bg:`${c.green}10`,border:`${c.green}40`};
  if(score>=50) return {label:'Compétitif',labelEn:'Competitive',color:c.accent,bg:`${c.accent}10`,border:`${c.accent}40`};
  if(score>=30) return {label:'En progression',labelEn:'Developing',color:c.warn,bg:`${c.warn}10`,border:`${c.warn}40`};
  return {label:'Profil à renforcer',labelEn:'Needs work',color:c.danger,bg:`${c.danger}10`,border:`${c.danger}40`};
}

// ══════════════════════════════════════
// PROCHAINES ACTIONS DYNAMIQUES
// ══════════════════════════════════════
function buildPriorityActions(profile, scores, roadmap, lang) {
  const fr=lang==='fr';
  const actions=[];
  const today=new Date();

  // Deadlines urgentes depuis roadmap
  roadmap.forEach(r=>{
    if(r.dateLimite){
      const diff=Math.round((new Date(r.dateLimite)-today)/86400000);
      if(diff>=0&&diff<=10){
        actions.push({
          id:`dl-${r.id}`,
          label:fr?`Compléter candidature — ${r.nom}`:`Complete application — ${r.nom}`,
          priority:'urgent',
          time:fr?'30 min':' 30 min',
          due:diff===0?(fr?"Aujourd'hui":'Today'):`${fr?'Dans ':'In '}${diff}${fr?' jours':' days'}`,
          section:'roadmap',
        });
      }
    }
  });

  // Langues manquantes
  if(!profile.languages?.some(l=>l.certificate))
    actions.push({id:'ielts',label:fr?'Télécharger certificat de langue':'Upload language certificate',priority:'urgent',time:'5 min',due:fr?"Aujourd'hui":'Today',section:'skills'});

  // Motivation manquante
  if(!profile.motivationSummary||profile.motivationSummary.length<200){
    const nextDl=roadmap.find(r=>r.dateLimite&&new Date(r.dateLimite)>today);
    const daysToNext=nextDl?Math.round((new Date(nextDl.dateLimite)-today)/86400000):null;
    actions.push({id:'motivation',label:fr?'Compléter lettre de motivation':'Complete motivation letter',priority:'urgent',time:'2h',due:daysToNext?(fr?`Dans ${daysToNext} jours`:`In ${daysToNext} days`):(fr?'Cette semaine':'This week'),section:'goals'});
  }

  // Recommandations
  if(profile.workExperience?.length>0&&profile.workExperience?.length<2)
    actions.push({id:'reco',label:fr?'Demander lettre de recommandation':'Request recommendation letter',priority:'important',time:'15 min',due:fr?'Dans 10 jours':'In 10 days',section:'experience'});

  // Compétences
  if(profile.skills?.length<3)
    actions.push({id:'skills',label:fr?'Mettre à jour section compétences':'Update skills section',priority:'normal',time:'30 min',due:fr?'Cette semaine':'This week',section:'skills'});

  // Entretien
  if(scores.length===0)
    actions.push({id:'interview',label:fr?'Faire ton premier entretien IA':'Do your first AI interview',priority:'important',time:'20 min',due:fr?'Cette semaine':'This week',section:'entretien',external:true});

  // GPA manquant
  if(!profile.gpa)
    actions.push({id:'gpa',label:fr?'Renseigner ta moyenne académique':'Add your GPA',priority:'normal',time:'5 min',due:fr?'Cette semaine':'This week',section:'academic'});

  // Certifications expirées (simulé)
  actions.push({id:'docs',label:fr?'Vérifier documents expirés':'Check expired documents',priority:'important',time:'10 min',due:fr?'Dans 3 jours':'In 3 days',section:'academic'});

  // Priorité
  const order={urgent:0,important:1,normal:2};
  return actions.sort((a,b)=>order[a.priority]-order[b.priority]).slice(0,6);
}


// ══════════════════════════════════════
// UI COMPONENTS
// ══════════════════════════════════════
function CountUp({target,suffix=''}){
  const [v,setV]=useState(0);
  useEffect(()=>{ let s=0,step=target/50; const t=setTimeout(()=>{ const iv=setInterval(()=>{ s=Math.min(target,Math.round(s+step)); setV(s); if(s>=target)clearInterval(iv); },20); return()=>clearInterval(iv); },200); return()=>clearTimeout(t); },[target]);
  return <span>{v}{suffix}</span>;
}

function Ring({pct,size=80,sw=8,color,track='#e8edf5',children}){
  const r=(size-sw*2)/2,circ=2*Math.PI*r;
  const [dash,setDash]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setDash((pct/100)*circ),300);return()=>clearTimeout(t);},[pct,circ]);
  return(
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={sw}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} style={{transition:'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)'}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>{children}</div>
    </div>
  );
}

function RadarChart({data,size=180,c}){
  const cx=size/2,cy=size/2,r=size*0.36,n=data.length;
  const toXY=(i,pct)=>{const a=(i/n)*Math.PI*2-Math.PI/2,d=(pct/100)*r;return[cx+Math.cos(a)*d,cy+Math.sin(a)*d];};
  const lXY=(i)=>{const a=(i/n)*Math.PI*2-Math.PI/2,d=r+20;return[cx+Math.cos(a)*d,cy+Math.sin(a)*d];};
  const pts=data.map((d,i)=>toXY(i,d.value).join(',')).join(' ');
  
  const handleAxisClick = (label) => {
    let message = '';
    if (label === 'Lang.' || label === 'Lang.') message = 'Comment améliorer mon niveau de langue ?';
    else if (label === 'Exp.') message = 'Je veux ajouter une expérience professionnelle';
    else if (label === 'Proj.') message = 'Comment ajouter un projet académique ?';
    else if (label === 'Motiv.') message = 'Aide-moi à rédiger ou améliorer ma lettre de motivation';
    else if (label === 'Acad.') message = 'Comment renforcer ma partie académique ?';
    if (message) window.dispatchEvent(new CustomEvent('openChatWithMessage', { detail: { message } }));
  };
  
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[25,50,75,100].map(p=><polygon key={p} points={data.map((_,i)=>toXY(i,p).join(',')).join(' ')} fill="none" stroke={c.rule} strokeWidth={p===100?1.5:0.8}/>)}
      {data.map((_,i)=>{const[x,y]=toXY(i,100);return<line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={c.rule} strokeWidth="1"/>;  })}
      <polygon points={pts} fill={`${c.accent}18`} stroke={c.accent} strokeWidth="2"/>
      {data.map((d,i)=>{const[x,y]=toXY(i,d.value);return<circle key={i} cx={x} cy={y} r="4" fill={c.accent} stroke={c.surface} strokeWidth="1.5"/>;  })}
      {data.map((d,i)=>{
        const [lx,ly]=lXY(i);
        return (
          <g key={i} style={{cursor:'pointer'}} onClick={() => handleAxisClick(d.label)}>
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fontWeight="700" fill={c.accent} fontFamily="'DM Sans',system-ui">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Sparkline({data,color,height=50,c}){
  const ref=useRef(null);const[w,setW]=useState(200);
  useEffect(()=>{if(ref.current)setW(ref.current.offsetWidth||200);},[]);
  if(!data||data.length<2)return<div ref={ref} style={{height,display:'flex',alignItems:'center',justifyContent:'center',color:c.ink3,fontSize:11,fontStyle:'italic',fontFamily:c.fSans}}>{c.lang==='fr'?'Aucune donnée disponible':'No data available'}</div>;
  const min=Math.min(...data),max=Math.max(...data),range=max-min||1,p=10;
  const pts=data.map((v,i)=>`${p+(i/(data.length-1))*(w-p*2)},${height-p-((v-min)/range)*(height-p*2)}`).join(' ');
  return(
    <div ref={ref} style={{width:'100%'}}>
      <svg width={w} height={height}>
        <defs><linearGradient id={`sg${color?.replace('#','')}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.15"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        <polygon points={`${p},${height} ${pts} ${w-p},${height}`} fill={`url(#sg${color?.replace('#','')})`}/>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {data.map((v,i)=>{const x=p+(i/(data.length-1))*(w-p*2),y=height-p-((v-min)/range)*(height-p*2);return<g key={i}><circle cx={x} cy={y} r="3.5" fill={color}/><text x={x} y={y-8} textAnchor="middle" fontSize="8.5" fill={c.ink3} fontWeight="600">{v}</text></g>;  })}
      </svg>
    </div>
  );
}

function AvatarUploader({avatarId,onUpload,c}){
  const[preview,setPreview]=useState(null);const[uploading,setUploading]=useState(false);
  useEffect(()=>{if(!avatarId){setPreview(null);return;}axiosInstance.get(`/api/media/${avatarId}`).then(r=>{const url=r.data?.url||r.data?.doc?.url;if(url)setPreview(url.startsWith('http')?url:`http://localhost:3000${url}`);}).catch(()=>setPreview(null));},[avatarId]);
  const handleFile=async e=>{const file=e.target.files[0];if(!file)return;setUploading(true);const fd=new FormData();fd.append('file',file);try{const r=await axiosInstance.post('/api/media',fd,{headers:{'Content-Type':'multipart/form-data'}});onUpload(r.data?.doc?.id||r.data?.id);const url=r.data?.doc?.url||r.data?.url;if(url)setPreview(url.startsWith('http')?url:`http://localhost:3000${url}`);}catch{}finally{setUploading(false);} };
  return(
    <label style={{position:'relative',cursor:'pointer',display:'inline-block'}}>
      <div style={{width:80,height:80,borderRadius:'50%',overflow:'hidden',background:c.ruleSoft,border:`2px solid ${c.accent}`}}>
        {preview?<img src={preview} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:c.fSerif,fontSize:32,color:c.ink3}}>?</div>}
      </div>
      <div style={{position:'absolute',bottom:0,right:0,width:24,height:24,borderRadius:'50%',background:c.accent,border:`2px solid ${c.surface}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#fff',fontFamily:c.fSans}}>+</div>
      <input type="file" accept="image/*" onChange={handleFile} style={{display:'none'}} disabled={uploading}/>
    </label>
  );
}

function AutocompleteInput({value,onChange,suggestions,placeholder,label,type='text',c}){
  const[open,setOpen]=useState(false);const[inp,setInp]=useState(value||'');
  useEffect(()=>setInp(value||''),[value]);
  const filtered=(suggestions||[]).filter(s=>s.toLowerCase().includes((inp||'').toLowerCase())).slice(0,8);
  if(type==='date')return(<div><div style={{fontSize:11,fontWeight:600,color:c.ink2,marginBottom:4,fontFamily:c.fSans}}>{label}</div><input type="date" value={value||''} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'9px 12px',border:`1px solid ${c.ruleSoft}`,background:c.paper,fontFamily:c.fSans,fontSize:13,color:c.ink,outline:'none',borderRadius:4}}/></div>);
  return(
    <div style={{position:'relative'}}>
      {label&&<div style={{fontSize:11,fontWeight:600,color:c.ink2,marginBottom:4,fontFamily:c.fSans,letterSpacing:'0.04em',textTransform:'uppercase'}}>{label}</div>}
      <input value={inp} onChange={e=>{setInp(e.target.value);onChange(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),200)} placeholder={placeholder} style={{width:'100%',padding:'9px 12px',border:`1px solid ${c.ruleSoft}`,background:c.paper,fontFamily:c.fSans,fontSize:13,color:c.ink,outline:'none',borderRadius:4}}/>
      {open&&filtered.length>0&&<div style={{position:'absolute',top:'100%',left:0,right:0,background:c.surface,border:`1px solid ${c.rule}`,zIndex:20,boxShadow:`0 8px 24px ${c.ink}18`}}>{filtered.map((s,i)=><div key={i} onClick={()=>{setInp(s);onChange(s);setOpen(false);}} style={{padding:'8px 12px',cursor:'pointer',fontSize:12,fontFamily:c.fSans,color:c.ink2,borderBottom:`1px solid ${c.ruleSoft}`}}>{s}</div>)}</div>}
    </div>
  );
}

function Field({label,v,s,ph,type='text',readOnly=false,c}){
  return(
    <div>
      {label&&<div style={{fontSize:11,fontWeight:600,color:c.ink2,marginBottom:4,fontFamily:c.fSans,letterSpacing:'0.04em',textTransform:'uppercase'}}>{label}</div>}
      <input type={type} value={v||''} onChange={e=>s?.(e.target.value)} placeholder={ph} readOnly={readOnly} style={{width:'100%',padding:'9px 12px',border:`1px solid ${c.ruleSoft}`,background:readOnly?c.paper2:c.paper,fontFamily:c.fSans,fontSize:13,color:c.ink,outline:'none',borderRadius:4,opacity:readOnly?0.6:1}}/>
    </div>
  );
}

function SecTitle({children,c}){return <div style={{fontFamily:c.fSerif,fontSize:20,fontWeight:700,color:c.ink,marginBottom:20,paddingBottom:12,borderBottom:`1px solid ${c.rule}`,marginTop:32}}>{children}</div>;}

function SkillInput({sk,onSkillChange,onCategoryChange,onLevelChange,onDelete,lang,c}){
  const[open,setOpen]=useState(false);const[inp,setInp]=useState(sk.skill||'');
  const suggestions=(SKILL_SUGGESTIONS[sk.category]||SKILL_SUGGESTIONS.other).filter(s=>s.toLowerCase().includes(inp.toLowerCase())).slice(0,8);
  return(
    <div style={{background:c.paper2,padding:'16px',marginBottom:12,border:`1px solid ${c.ruleSoft}`,borderRadius:4}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
        <div style={{position:'relative'}}>
          <div style={{fontSize:11,fontWeight:600,color:c.ink2,marginBottom:4,fontFamily:c.fSans,textTransform:'uppercase'}}>{lang==='fr'?'Compétence':'Skill'}</div>
          <input value={inp} onChange={e=>{setInp(e.target.value);onSkillChange(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),200)} placeholder="Python, React..." style={{width:'100%',padding:'8px',border:`1px solid ${c.ruleSoft}`,background:c.paper,fontSize:12,fontFamily:c.fSans,borderRadius:4}}/>
          {open&&suggestions.length>0&&<div style={{position:'absolute',top:'100%',left:0,right:0,background:c.surface,border:`1px solid ${c.rule}`,zIndex:10}}>{suggestions.map((s,i)=><div key={i} onClick={()=>{setInp(s);onSkillChange(s);setOpen(false);}} style={{padding:'6px 10px',cursor:'pointer',fontSize:11,fontFamily:c.fSans}}>{s}</div>)}</div>}
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:c.ink2,marginBottom:4,fontFamily:c.fSans,textTransform:'uppercase'}}>{lang==='fr'?'Catégorie':'Category'}</div>
          <select value={sk.category||''} onChange={e=>onCategoryChange(e.target.value)} style={{width:'100%',padding:'8px',border:`1px solid ${c.ruleSoft}`,background:c.paper,fontSize:12,fontFamily:c.fSans,borderRadius:4}}>
            <option value="">—</option>
            {[['language','Langage'],['framework','Framework'],['database','BDD'],['tool','Outil'],['devops','DevOps'],['method','Méthode'],['design','Design'],['other','Autre']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:c.ink2,marginBottom:4,fontFamily:c.fSans,textTransform:'uppercase'}}>{lang==='fr'?'Niveau':'Level'}</div>
          <select value={sk.level||''} onChange={e=>onLevelChange(e.target.value)} style={{width:'100%',padding:'8px',border:`1px solid ${c.ruleSoft}`,background:c.paper,fontSize:12,fontFamily:c.fSans,borderRadius:4}}>
            <option value="">—</option>
            {[['beginner','Débutant'],['intermediate','Intermédiaire'],['advanced','Avancé'],['expert','Expert']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <div style={{textAlign:'right'}}><button onClick={onDelete} style={{background:'none',border:'none',color:c.danger,fontSize:11,cursor:'pointer',fontFamily:c.fSans}}>Supprimer</button></div>
    </div>
  );
}

// ══════════════════════════════════════
// WIDGET: Prochaines actions prioritaires
// ══════════════════════════════════════
function PriorityActions({actions,onAction,c,lang}){
  const priorityConfig={
    urgent:{label:'URGENT',color:c.danger,bg:`${c.danger}10`,border:`${c.danger}30`,dot:c.danger},
    important:{label:'Important',color:c.warn,bg:`${c.warn}08`,border:`${c.warn}25`,dot:c.warn},
    normal:{label:'Normal',color:c.ink3,bg:c.paper2,border:c.ruleSoft,dot:c.ink3},
  };
  return(
    <div style={{background:c.surface,border:`1px solid ${c.rule}`,padding:'24px'}}>
      <div style={{marginBottom:20}}>
        <div style={{fontFamily:c.fSerif,fontSize:18,fontWeight:700,color:c.ink,marginBottom:4}}>
          {lang==='fr'?'Prochaines Actions Prioritaires':'Priority Next Actions'}
        </div>
        <div style={{fontFamily:c.fSans,fontSize:12,color:c.ink3}}>{lang==='fr'?'Tâches à compléter pour optimiser votre profil':'Tasks to complete to optimize your profile'}</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {actions.map((a,i)=>{
          const pc=priorityConfig[a.priority]||priorityConfig.normal;
          return(
            <div key={a.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:pc.bg,border:`1px solid ${pc.border}`,borderLeft:`3px solid ${pc.dot}`,transition:'all 0.2s'}} onMouseEnter={e=>e.currentTarget.style.transform='translateX(3px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateX(0)'}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:9,fontWeight:700,color:pc.dot,fontFamily:c.fMono,letterSpacing:'0.06em',border:`1px solid ${pc.dot}`,padding:'1px 6px',borderRadius:2}}>{pc.label}</span>
                </div>
                <div style={{fontFamily:c.fSans,fontSize:13,fontWeight:600,color:c.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:4}}>{a.label}</div>
                <div style={{display:'flex',gap:12}}>
                  <span style={{fontFamily:c.fMono,fontSize:10,color:c.ink3}}>{a.time}</span>
                  <span style={{fontFamily:c.fMono,fontSize:10,color:a.priority==='urgent'?c.danger:c.ink3}}>·  {a.due}</span>
                </div>
              </div>
              <button onClick={()=>onAction(a)} style={{padding:'6px 14px',background:pc.dot,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:11,fontWeight:700,cursor:'pointer',letterSpacing:'0.04em',flexShrink:0,borderRadius:3,transition:'opacity 0.15s'}} onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                {lang==='fr'?'Démarrer':'Start'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// WIDGET: Candidatures roadmap
// ══════════════════════════════════════
function RoadmapWidget({roadmap,setRoadmap,user,c,lang,setView}){
  const[newText,setNewText]=useState('');const[loading,setLoading]=useState(false);
  const getTotal=r=>{ if(Array.isArray(r.etapes))return r.etapes.length; try{const p=JSON.parse(r.etapes);if(Array.isArray(p))return p.length;}catch{}return 5; };
  const getProgress=r=>Math.min((r.etapeCourante||0)+1,getTotal(r));
  const isDone=r=>(r.etapeCourante||0)>=getTotal(r)-1;
  const totalPct=roadmap.length>0?Math.round(roadmap.filter(r=>isDone(r)).length/roadmap.length*100):0;
  const advance=async item=>{
    const step=item.etapeCourante||0,total=getTotal(item);if(step>=total-1)return;
    try{await axiosInstance.patch(API_ROUTES.roadmap.update(item.id),{etapeCourante:step+1});setRoadmap(prev=>prev.map(r=>r.id===item.id?{...r,etapeCourante:step+1}:r));}catch{}
  };
  const add=async()=>{
    if(!newText.trim()||!user?.id)return;setLoading(true);
    try{const res=await axiosInstance.post(API_ROUTES.roadmap.create,{userId:user.id,userEmail:user.email||'',nom:newText.trim(),pays:'À définir',statut:'en_cours',etapeCourante:0,ajouteLe:new Date().toISOString()});setRoadmap(prev=>[...prev,res.data?.doc||res.data]);setNewText('');}catch{}finally{setLoading(false);}
  };
  return(
    <div style={{background:c.surface,border:`1px solid ${c.rule}`,padding:'24px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <div style={{fontFamily:c.fSerif,fontSize:18,fontWeight:700,color:c.ink,marginBottom:4}}>{lang==='fr'?'Candidatures en cours':'Applications in progress'}</div>
          <div style={{fontFamily:c.fSans,fontSize:12,color:c.ink3}}>{roadmap.length} {lang==='fr'?'bourse(s) suivie(s)':'scholarship(s) tracked'}</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontFamily:c.fSerif,fontSize:28,fontWeight:700,color:c.accent,lineHeight:1}}>{totalPct}%</div>
          <div style={{fontFamily:c.fSans,fontSize:10,color:c.ink3,marginTop:2}}>{lang==='fr'?'terminées':'completed'}</div>
        </div>
      </div>
      <div style={{height:3,background:c.rule,borderRadius:99,overflow:'hidden',marginBottom:20}}>
        <div style={{height:'100%',width:`${totalPct}%`,background:c.accent,borderRadius:99,transition:'width 0.8s ease'}}/>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:220,overflowY:'auto',marginBottom:16}}>
        {roadmap.length===0&&<div style={{textAlign:'center',padding:'24px',color:c.ink3,fontFamily:c.fSans,fontSize:12,background:c.paper2,border:`1px dashed ${c.rule}`}}>{lang==='fr'?'Aucune candidature. Ajoutez une bourse ci-dessous.':'No applications yet. Add a scholarship below.'}</div>}
        {roadmap.map(item=>{
          const total=getTotal(item),progress=getProgress(item),done=isDone(item);
          const pct=Math.round((progress/total)*100);
          const dl=item.dateLimite?Math.round((new Date(item.dateLimite)-new Date())/86400000):null;
          return(
            <div key={item.id} style={{padding:'12px 14px',background:done?'rgba(26,122,74,0.05)':c.paper2,border:`1px solid ${done?'rgba(26,122,74,0.25)':c.ruleSoft}`,borderLeft:`3px solid ${done?c.green:c.accent}`,transition:'all 0.15s'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                <div style={{width:16,height:16,borderRadius:50,border:`2px solid ${done?c.green:c.accent}`,background:done?c.green:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {done&&<span style={{color:'#fff',fontSize:9,fontWeight:700}}>✓</span>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:c.fSans,fontSize:12,fontWeight:600,color:done?c.green:c.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:done?'line-through':'none'}}>{item.nom}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                  {dl!==null&&<span style={{fontFamily:c.fMono,fontSize:9,color:dl<=3?c.danger:dl<=7?c.warn:c.ink3}}>{dl===0?(lang==='fr'?"Auj.":'Today'):dl<0?(lang==='fr'?'Expiré':'Expired'):`${dl}${lang==='fr'?'j':'d'}`}</span>}
                  <span style={{fontFamily:c.fMono,fontSize:9,color:c.ink3}}>{progress}/{total}</span>
                  {!done&&<button onClick={()=>advance(item)} style={{padding:'2px 8px',background:`${c.accent}12`,border:`1px solid ${c.accent}40`,color:c.accent,fontSize:9,cursor:'pointer',fontWeight:700,fontFamily:c.fMono}}>+1</button>}
                </div>
              </div>
              <div style={{height:2,background:c.rule,borderRadius:99,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pct}%`,background:done?c.green:c.accent,borderRadius:99,transition:'width 0.4s'}}/>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{display:'flex',gap:8}}>
        <input value={newText} onChange={e=>setNewText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder={lang==='fr'?'Nom bourse (Eiffel, DAAD, Chevening...)':'Scholarship name...'} style={{flex:1,padding:'8px 12px',border:`1px solid ${c.ruleSoft}`,fontFamily:c.fSans,fontSize:12,background:c.paper,color:c.ink,outline:'none',borderRadius:4}} disabled={loading}/>
        <button onClick={add} disabled={loading||!newText.trim()} style={{padding:'8px 16px',background:c.accent,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:12,fontWeight:700,cursor:'pointer',opacity:loading?0.7:1,borderRadius:4}}>{loading?'...':'+'}</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// WIDGET: Entretiens IA
// ══════════════════════════════════════
function InterviewWidget({scores,setView,c,lang}){
  const lastScore=scores[0]?.scoreNum??null;
  const avgScore=scores.length>0?Math.round(scores.reduce((a,b)=>a+(b.scoreNum||0),0)/scores.length):null;
  const trend=scores.length>=2?scores[0].scoreNum-scores[1].scoreNum:null;
  const history=scores.slice().reverse().map(s=>s.scoreNum);

  const categories=useMemo(()=>{
    const allText=(scores||[]).map(s=>s.score||'').join(' ').toLowerCase();
    const has=words=>words.some(w=>allText.includes(w));
    const base=avgScore||50;
    return[
      {label:lang==='fr'?'Communication':'Communication',val:Math.min(100,Math.round(base*(has(['communication','clair','articulé'])?1.15:0.88))),color:c.accent},
      {label:lang==='fr'?'Motivation':'Motivation',val:Math.min(100,Math.round(base*(has(['motivation','passion','enthousiaste'])?1.2:0.92))),color:c.green},
      {label:lang==='fr'?'Technique':'Technical',val:Math.min(100,Math.round(base*(has(['technique','compétence','maîtrise'])?1.1:0.82))),color:c.warn},
      {label:lang==='fr'?'Confiance':'Confidence',val:Math.min(100,Math.round(base*(has(['confiance','assurance'])?1.15:0.88))),color:'#7c3aed'},
    ];
  },[scores,avgScore,lang,c]);

  return(
    <div style={{background:c.surface,border:`1px solid ${c.rule}`,padding:'24px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <div style={{fontFamily:c.fSerif,fontSize:18,fontWeight:700,color:c.ink,marginBottom:4}}>{lang==='fr'?'Entretiens IA':'AI Interviews'}</div>
          <div style={{fontFamily:c.fSans,fontSize:12,color:c.ink3}}>{scores.length} {lang==='fr'?'entretien(s) réalisé(s)':'interview(s) completed'}</div>
        </div>
        <button onClick={()=>setView&&setView('entretien')} style={{padding:'6px 14px',background:c.accent,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:11,fontWeight:700,cursor:'pointer',borderRadius:3}}>{lang==='fr'?'Pratiquer':'Practice'}</button>
      </div>
      {scores.length===0?(
        <div style={{textAlign:'center',padding:'32px 20px',background:c.paper2,border:`1px dashed ${c.rule}`}}>
          <div style={{fontFamily:c.fSerif,fontSize:16,color:c.ink,marginBottom:8}}>{lang==='fr'?'Aucun entretien simulé':'No mock interviews yet'}</div>
          <div style={{fontFamily:c.fSans,fontSize:12,color:c.ink3,marginBottom:16}}>{lang==='fr'?'Les candidats qui s\'entraînent obtiennent 23% de meilleures évaluations.':'Candidates who practice get 23% better evaluations on average.'}</div>
          <button onClick={()=>setView&&setView('entretien')} style={{padding:'8px 20px',background:c.accent,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:12,fontWeight:700,cursor:'pointer',borderRadius:4}}>{lang==='fr'?'Commencer un entretien':'Start an interview'}</button>
        </div>
      ):(
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
            {[
              {label:lang==='fr'?'Dernier score':'Last score',val:`${lastScore}/100`,color:lastScore>=75?c.green:lastScore>=55?c.accent:c.danger},
              {label:lang==='fr'?'Moyenne':'Average',val:avgScore?`${avgScore}/100`:'—',color:c.accent},
              {label:lang==='fr'?'Tendance':'Trend',val:trend===null?'—':trend>0?`+${trend}`:trend===0?'=':`${trend}`,color:trend>0?c.green:trend<0?c.danger:c.ink3},
            ].map((s,i)=>(
              <div key={i} style={{padding:'12px',background:c.paper2,border:`1px solid ${c.ruleSoft}`,textAlign:'center'}}>
                <div style={{fontFamily:c.fSerif,fontSize:22,fontWeight:700,color:s.color,lineHeight:1}}>{s.val}</div>
                <div style={{fontFamily:c.fSans,fontSize:10,color:c.ink3,marginTop:4,fontWeight:500}}>{s.label}</div>
              </div>
            ))}
          </div>
          {history.length>1&&(
            <div style={{marginBottom:20}}>
              <div style={{fontFamily:c.fSans,fontSize:11,fontWeight:600,color:c.ink3,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em'}}>{lang==='fr'?'Progression':'Progression'}</div>
              <Sparkline data={history} color={c.accent} height={50} c={c}/>
            </div>
          )}
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {categories.map(cat=>(
              <div key={cat.label}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontFamily:c.fSans,fontSize:11,color:c.ink2,fontWeight:500}}>{cat.label}</span>
                  <span style={{fontFamily:c.fMono,fontSize:11,fontWeight:700,color:cat.color}}>{cat.val}%</span>
                </div>
                <div style={{height:3,background:c.rule,borderRadius:99,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${cat.val}%`,background:cat.color,borderRadius:99,transition:'width 0.8s ease'}}/>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// WIDGET: Score global avec sous-scores
// ══════════════════════════════════════
function ScoreWidget({sub,tier,profile,c,lang,onAnalyze,aiAnalyzing}){
  const subList=[
    {key:'academic',label:lang==='fr'?'Académique':'Academic'},
    {key:'experience',label:lang==='fr'?'Expérience':'Experience'},
    {key:'projects',label:lang==='fr'?'Projets':'Projects'},
    {key:'languages',label:lang==='fr'?'Langues':'Languages'},
    {key:'motivation',label:'Motivation'},
  ];
  return(
    <div style={{background:c.surface,border:`1px solid ${c.rule}`,padding:'24px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <div style={{fontFamily:c.fSerif,fontSize:18,fontWeight:700,color:c.ink,marginBottom:6}}>{lang==='fr'?'Force de candidature':'Application strength'}</div>
          <div style={{fontFamily:c.fMono,fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:tier.color,padding:'3px 8px',border:`1px solid ${tier.border}`,background:tier.bg,display:'inline-block',borderRadius:3}}>{lang==='fr'?tier.label:tier.labelEn}</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontFamily:c.fSerif,fontSize:40,fontWeight:700,color:tier.color,lineHeight:1}}><CountUp target={sub.global}/></div>
          <div style={{fontFamily:c.fSans,fontSize:10,color:c.ink3,marginTop:2}}>/100</div>
        </div>
      </div>
      <div style={{height:6,background:c.rule,borderRadius:99,overflow:'hidden',marginBottom:20}}>
        <div style={{height:'100%',width:`${sub.global}%`,background:`linear-gradient(90deg,${tier.color},${c.accent})`,borderRadius:99,transition:'width 1.2s ease'}}/>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
        {subList.map(s=>(
          <div key={s.key}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontFamily:c.fSans,fontSize:11,color:c.ink2,fontWeight:500}}>{s.label}</span>
              <span style={{fontFamily:c.fMono,fontSize:11,fontWeight:700,color:sub[s.key]>=70?c.green:sub[s.key]>=50?c.accent:sub[s.key]>=30?c.warn:c.danger}}>{sub[s.key]}%</span>
            </div>
            <div style={{height:3,background:c.rule,borderRadius:99,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${sub[s.key]}%`,background:sub[s.key]>=70?c.green:sub[s.key]>=50?c.accent:sub[s.key]>=30?c.warn:c.danger,borderRadius:99,transition:'width 0.8s ease'}}/>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onAnalyze} disabled={aiAnalyzing} style={{width:'100%',padding:'10px',background:aiAnalyzing?c.ruleSoft:c.ink,color:aiAnalyzing?c.ink3:'#fff',border:'none',fontFamily:c.fSans,fontSize:12,fontWeight:700,cursor:aiAnalyzing?'not-allowed':'pointer',letterSpacing:'0.04em',borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'opacity 0.2s'}} onMouseEnter={e=>{if(!aiAnalyzing)e.currentTarget.style.opacity='0.88';}} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
        {aiAnalyzing?<><span style={{width:12,height:12,border:`2px solid ${c.ink3}`,borderTopColor:c.accent,borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite'}}/>{lang==='fr'?'Analyse en cours...':'Analyzing...'}</>:(lang==='fr'?'Analyser mon profil — IA':'Analyze my profile — AI')}
      </button>
    </div>
  );
}

// ══════════════════════════════════════
// WIDGET: Pays readiness
// ══════════════════════════════════════
function CountryReadinessWidget({profile,scores,c,lang}){
  const sub=computeSubScores(profile,scores);
  const hasEn=profile.languages?.some(l=>l.language?.toLowerCase().includes('anglais')||l.language?.toLowerCase().includes('english'));
  const hasFr=profile.languages?.some(l=>l.language?.toLowerCase().includes('français')||l.language?.toLowerCase().includes('french'));
  const base=Math.round((sub.academic+sub.experience+sub.projects+sub.motivation)/4);
  const countries=[
    {country:'France',flag:'FR',score:Math.min(100,Math.round(base*(hasFr?1.2:0.82)+(sub.languages*0.08))),missing:(!hasFr?[lang==='fr'?'B2 Français':'B2 French']:[]).concat(sub.motivation<40?[lang==='fr'?'Lettre de motivation':'Motivation letter']:[])},
    {country:'Allemagne',flag:'DE',score:Math.min(100,Math.round(base*(hasEn?1.1:0.78)+(sub.projects*0.08))),missing:(!hasEn?[lang==='fr'?'Anglais B2+':'B2+ English']:[]).concat(sub.projects<40?[lang==='fr'?'Projets académiques':'Academic projects']:[])},
    {country:'Canada',flag:'CA',score:Math.min(100,Math.round(base*((hasEn||hasFr)?1.12:0.72))),missing:((!hasEn&&!hasFr)?[lang==='fr'?'Anglais ou Français':'English or French']:[]).concat(sub.motivation<50?[lang==='fr'?'Motivation développée':'Detailed motivation']:[])},
    {country:'Royaume-Uni',flag:'GB',score:Math.min(100,Math.round(base*(hasEn?1.18:0.62)+(sub.experience*0.05))),missing:(!hasEn?[lang==='fr'?'Anglais certifié requis':'Certified English required']:[]).concat(sub.experience<40?[lang==='fr'?'Expérience professionnelle':'Work experience']:[])},
  ];
  return(
    <div style={{background:c.surface,border:`1px solid ${c.rule}`,padding:'24px'}}>
      <div style={{fontFamily:c.fSerif,fontSize:18,fontWeight:700,color:c.ink,marginBottom:6}}>{lang==='fr'?'Compatibilité par pays':'Country compatibility'}</div>
      <div style={{fontFamily:c.fSans,fontSize:12,color:c.ink3,marginBottom:20}}>{lang==='fr'?'Estimation basée sur votre profil actuel':'Estimation based on your current profile'}</div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {countries.map(cr=>(
          <div key={cr.country}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontFamily:c.fMono,fontSize:9,fontWeight:700,color:c.ink3,letterSpacing:'0.06em',border:`1px solid ${c.ruleSoft}`,padding:'1px 5px',borderRadius:2}}>{cr.flag}</span>
                <span style={{fontFamily:c.fSans,fontSize:13,fontWeight:600,color:c.ink}}>{cr.country}</span>
              </div>
              <span style={{fontFamily:c.fSerif,fontSize:18,fontWeight:700,color:cr.score>=70?c.green:cr.score>=50?c.accent:cr.score>=35?c.warn:c.danger}}>{cr.score}%</span>
            </div>
            <div style={{height:4,background:c.rule,borderRadius:99,overflow:'hidden',marginBottom:cr.missing.length>0?6:0}}>
              <div style={{height:'100%',width:`${cr.score}%`,background:cr.score>=70?c.green:cr.score>=50?c.accent:cr.score>=35?c.warn:c.danger,borderRadius:99,transition:'width 0.8s ease'}}/>
            </div>
            {cr.missing.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{cr.missing.slice(0,2).map((m,i)=><span key={i} style={{fontFamily:c.fMono,fontSize:9,color:c.danger,background:`${c.danger}08`,border:`1px solid ${c.danger}25`,padding:'1px 6px',borderRadius:2}}>— {m}</span>)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// WIDGET: Alertes critiques
// ══════════════════════════════════════
function InsightsWidget({profile,scores,c,lang,setTab}){
  const fr=lang==='fr';
  const warnings=[];
  if(!profile.languages?.length) warnings.push({text:fr?'Aucune langue renseignée — bloque 70% des bourses':'No languages listed — blocks 70% of scholarships',severity:'critical',section:'skills'});
  if(!profile.motivationSummary||profile.motivationSummary.length<200) warnings.push({text:fr?'Lettre de motivation absente ou trop courte':'Motivation letter missing or too short',severity:'critical',section:'goals'});
  if(!profile.academicProjects?.length) warnings.push({text:fr?'Aucun projet académique — profil trop théorique':'No academic projects — profile too theoretical',severity:'high',section:'projects'});
  if(!profile.gpa) warnings.push({text:fr?'Moyenne non renseignée — critère clé':'GPA not set — key eligibility criterion',severity:'high',section:'academic'});
  if(!profile.workExperience?.length) warnings.push({text:fr?'Aucune expérience — renforce ton dossier':'No experience — strengthen your application',severity:'medium',section:'experience'});
  
  if(!warnings.length) return (
    <div style={{background:c.surface,border:`1px solid ${c.rule}`,padding:'24px',textAlign:'center'}}>
      <div style={{fontFamily:c.fSerif,fontSize:18,fontWeight:700,color:c.green,marginBottom:8}}>{fr?'Profil complet':'Complete profile'}</div>
      <div style={{fontFamily:c.fSans,fontSize:12,color:c.ink3}}>{fr?'Aucun problème critique détecté.':'No critical issues detected.'}</div>
    </div>
  );

  const sevConfig={critical:{label:'Critique',color:c.danger,bg:`${c.danger}08`,border:`${c.danger}30`},high:{label:'Élevé',color:c.warn,bg:`${c.warn}08`,border:`${c.warn}25`},medium:{label:'Moyen',color:c.ink3,bg:c.paper2,border:c.ruleSoft}};
  return(
    <div style={{background:c.surface,border:`1px solid ${c.rule}`,padding:'24px'}}>
      <div style={{fontFamily:c.fSerif,fontSize:18,fontWeight:700,color:c.danger,marginBottom:6}}>{fr?'Points de rejet potentiels':'Potential rejection points'}</div>
      <div style={{fontFamily:c.fSans,fontSize:12,color:c.ink3,marginBottom:16}}>{fr?'Problèmes critiques à corriger en priorité':'Critical issues to address first'}</div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {warnings.map((w,i)=>{
          const sc=sevConfig[w.severity];
          return(
            <div key={i} onClick={()=>setTab(w.section)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:sc.bg,border:`1px solid ${sc.border}`,borderLeft:`3px solid ${sc.color}`,cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>e.currentTarget.style.transform='translateX(3px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateX(0)'}>
              <div style={{flex:1}}><div style={{fontFamily:c.fSans,fontSize:12,fontWeight:600,color:c.ink}}>{w.text}</div></div>
              <span style={{fontFamily:c.fMono,fontSize:9,fontWeight:700,color:sc.color,border:`1px solid ${sc.color}`,padding:'1px 6px',borderRadius:2,flexShrink:0}}>{sc.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// WIDGET: Missions gamifiées
// ══════════════════════════════════════
function MissionsWidget({profile,scores,c,lang,setTab,setView}){
  const fr=lang==='fr';
  const missions=[
    {label:fr?'Expérience professionnelle':'Professional experience',goal:1,current:profile.workExperience?.length||0,section:'experience',color:c.warn},
    {label:fr?'Niveau B2 en anglais':'B2 English level',goal:1,current:profile.languages?.filter(l=>['B2','C1','C2','Natif'].includes(l.level)&&(l.language?.toLowerCase().includes('anglais')||l.language?.toLowerCase().includes('english'))).length||0,section:'skills',color:'#7c3aed'},
    {label:fr?'2 projets académiques':'2 academic projects',goal:2,current:profile.academicProjects?.length||0,section:'projects',color:c.accent},
    {label:fr?'Lettre de motivation (200+ car.)':'Motivation letter (200+ chars)',goal:1,current:profile.motivationSummary?.length>=200?1:0,section:'goals',color:c.green},
    {label:fr?'3 entretiens IA simulés':'3 AI mock interviews',goal:3,current:scores.length,section:'entretien',color:c.danger,external:true},
  ];
  const done=missions.filter(m=>m.current>=m.goal).length;
  return(
    <div style={{background:c.surface,border:`1px solid ${c.rule}`,padding:'24px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <div style={{fontFamily:c.fSerif,fontSize:18,fontWeight:700,color:c.ink,marginBottom:4}}>{fr?'Missions de profil':'Profile missions'}</div>
          <div style={{fontFamily:c.fSans,fontSize:12,color:c.ink3}}>{done}/{missions.length} {fr?'complétées':'completed'}</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontFamily:c.fSerif,fontSize:28,fontWeight:700,color:c.accent,lineHeight:1}}>{Math.round(done/missions.length*100)}%</div>
        </div>
      </div>
      <div style={{height:3,background:c.rule,borderRadius:99,overflow:'hidden',marginBottom:20}}>
        <div style={{height:'100%',width:`${done/missions.length*100}%`,background:c.accent,borderRadius:99,transition:'width 0.8s'}}/>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {missions.map((m,i)=>{
          const pct=Math.round(Math.min(1,m.current/m.goal)*100);
          const isDone=m.current>=m.goal;
          return(
            <div key={i} onClick={()=>m.external?setView(m.section):setTab(m.section)} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:isDone?`${c.green}08`:c.paper2,border:`1px solid ${isDone?`${c.green}25`:c.ruleSoft}`,cursor:'pointer',transition:'all 0.15s',borderRadius:4}} onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=isDone?`${c.green}25`:c.ruleSoft;}}>
              <div style={{width:28,height:28,borderRadius:50,border:`2px solid ${isDone?c.green:m.color}`,background:isDone?c.green:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {isDone?<span style={{color:'#fff',fontSize:11,fontWeight:700}}>✓</span>:<span style={{fontFamily:c.fMono,fontSize:9,fontWeight:700,color:m.color}}>{pct}%</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontFamily:c.fSans,fontSize:12,fontWeight:600,color:isDone?c.green:c.ink}}>{m.label}</span>
                  <span style={{fontFamily:c.fMono,fontSize:10,color:c.ink3}}>{m.current}/{m.goal}</span>
                </div>
                <div style={{height:2,background:c.rule,borderRadius:99,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:isDone?c.green:m.color,borderRadius:99,transition:'width 0.6s'}}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// WIDGET: Analyse IA résultat
// ══════════════════════════════════════
function AiAnalysisWidget({analysis,tier,sub,insights,c,lang}){
  if(!analysis)return null;
  return(
    <div style={{background:`linear-gradient(135deg,${c.ink},${c.accentInk})`,padding:'24px',color:'#fff'}}>
      <div style={{fontFamily:c.fSerif,fontSize:18,fontWeight:700,marginBottom:6,color:'#fff'}}>Analyse IA — {lang==='fr'?'Rapport personnalisé':'Personalized report'}</div>
      <div style={{fontFamily:c.fSans,fontSize:13,lineHeight:1.6,color:'rgba(255,255,255,0.82)',marginBottom:20}}>{analysis.summary}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={{background:'rgba(255,255,255,0.08)',borderLeft:'3px solid rgba(255,255,255,0.3)',padding:'14px 16px'}}>
          <div style={{fontFamily:c.fSans,fontSize:11,fontWeight:700,marginBottom:10,letterSpacing:'0.06em',textTransform:'uppercase',color:'rgba(255,255,255,0.6)'}}>Points forts</div>
          {analysis.strengths.map((s,i)=><div key={i} style={{fontFamily:c.fSans,fontSize:12,color:'rgba(255,255,255,0.82)',marginBottom:6,paddingLeft:8,borderLeft:'2px solid rgba(255,255,255,0.2)'}}>— {s}</div>)}
        </div>
        <div style={{background:'rgba(255,255,255,0.08)',borderLeft:'3px solid rgba(255,255,255,0.3)',padding:'14px 16px'}}>
          <div style={{fontFamily:c.fSans,fontSize:11,fontWeight:700,marginBottom:10,letterSpacing:'0.06em',textTransform:'uppercase',color:'rgba(255,255,255,0.6)'}}>Points faibles</div>
          {analysis.weaknesses.map((s,i)=><div key={i} style={{fontFamily:c.fSans,fontSize:12,color:'rgba(255,255,255,0.82)',marginBottom:6,paddingLeft:8,borderLeft:'2px solid rgba(255,255,255,0.2)'}}>— {s}</div>)}
        </div>
      </div>
      <div style={{background:'rgba(255,255,255,0.08)',padding:'14px 16px'}}>
        <div style={{fontFamily:c.fSans,fontSize:11,fontWeight:700,marginBottom:8,letterSpacing:'0.06em',textTransform:'uppercase',color:'rgba(255,255,255,0.6)'}}>Feuille de route</div>
        <div style={{fontFamily:c.fSans,fontSize:12,color:'rgba(255,255,255,0.82)',lineHeight:1.6}}>{analysis.roadmap}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════
export default function ProfilPage({user,setUser,handleLogout,handleQuickReply,setView,entretienScores,roadmapData,setRoadmapData}){
  const {lang}=useT();
  const {theme}=useTheme();
  const c=tokens(theme);
  const [tab,setTab]=useState('dashboard');
  const [profile,setProfile]=useState(emptyProfile);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [favorites,setFavorites]=useState(0);
  const [aiAnalyzing,setAiAnalyzing]=useState(false);
  const [aiAnalysis,setAiAnalysis]=useState(null);
  const roadmap=roadmapData||[];
  const setRoadmap=setRoadmapData;

  useEffect(()=>{
    const sp=(()=>{try{return JSON.parse(localStorage.getItem('opps_profile')||'{}');}catch{return{};}})();
    if(user){setProfile({...emptyProfile,...sp,
      name:user.name||sp.name||'',email:user.email||'',phone:user.phone||sp.phone||'',
      nationality:user.nationality||sp.nationality||'',countryOfResidence:user.countryOfResidence||sp.countryOfResidence||'',
      linkedin:user.linkedin||sp.linkedin||'',github:user.github||sp.github||'',portfolio:user.portfolio||sp.portfolio||'',
      currentLevel:user.currentLevel||user.niveau||'',fieldOfStudy:user.fieldOfStudy||user.domaine||'',
      institution:user.institution||'',gpa:user.gpa?.toString()||'',graduationYear:user.graduationYear?.toString()||'',
      academicHistory:user.academicHistory||[],workExperience:user.workExperience||[],
      academicProjects:user.academicProjects||sp.academicProjects||[],certifications:user.certifications||sp.certifications||[],
      volunteerWork:user.volunteerWork||sp.volunteerWork||[],publications:user.publications||sp.publications||[],
      awards:user.awards||sp.awards||[],languages:user.languages||[],skills:user.skills||[],
      targetDegree:user.targetDegree||'',targetCountries:user.targetCountries||(user.pays?[{country:user.pays}]:[]),
      targetFields:user.targetFields||[],motivationSummary:user.motivationSummary||'',
      avatar:(typeof user.avatar==='string')?user.avatar:(user.avatar?.id||null),dateOfBirth:sp.dateOfBirth||'',
    });}
  },[user]);

  const parseScore=txt=>{const m=(txt||'').match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i);return m?parseInt(m[1]):null;};
  const scores=useMemo(()=>(entretienScores||[]).map(s=>({...s,scoreNum:parseScore(s.score)})).filter(s=>s.scoreNum!==null),[entretienScores]);
  const sub=useMemo(()=>computeSubScores(profile,scores),[profile,scores]);
  const [lastWeekScore, setLastWeekScore] = useState(() => {
  const saved = localStorage.getItem('opps_last_week_score');
  return saved ? parseInt(saved) : sub.global;
});
useEffect(() => {
  localStorage.setItem('opps_last_week_score', sub.global);
}, [sub.global]);
const weeklyGain = sub.global - lastWeekScore;
  const tier=getTier(sub.global,c);
  const priorityActions=useMemo(()=>buildPriorityActions(profile,scores,roadmap,lang),[profile,scores,roadmap,lang]);
  const lastScore=scores[0]?.scoreNum??null;

  useEffect(()=>{
    if(user?.id)axiosInstance.get(API_ROUTES.favoris.byUser(user.id)).then(r=>{const docs=r.data.docs;if(docs&&docs[0]?.bourses)setFavorites(docs[0].bourses.length);}).catch(()=>{});
  },[user]);

  const upd=(field)=>(i,key,val)=>setProfile(p=>{const a=[...p[field]];a[i]={...a[i],[key]:val};return{...p,[field]:a};});
  const addItem=(field,empty)=>()=>setProfile(p=>({...p,[field]:[...p[field],{...empty}]}));
  const delItem=(field)=>(i)=>setProfile(p=>({...p,[field]:p[field].filter((_,j)=>j!==i)}));

  const handleSave=async()=>{
    if(!user?.id)return;setSaving(true);
    try{
      const body={name:profile.name,pays:profile.targetCountries[0]?.country||'',niveau:profile.currentLevel,domaine:profile.fieldOfStudy,phone:profile.phone,nationality:profile.nationality,countryOfResidence:profile.countryOfResidence,currentLevel:profile.currentLevel,fieldOfStudy:profile.fieldOfStudy,institution:profile.institution,gpa:profile.gpa,graduationYear:profile.graduationYear,academicHistory:profile.academicHistory,workExperience:profile.workExperience,languages:profile.languages,skills:profile.skills,targetDegree:profile.targetDegree,targetCountries:profile.targetCountries,targetFields:profile.targetFields,motivationSummary:profile.motivationSummary,academicProjects:profile.academicProjects,certifications:profile.certifications,volunteerWork:profile.volunteerWork,publications:profile.publications,awards:profile.awards,linkedin:profile.linkedin,github:profile.github,portfolio:profile.portfolio,avatar:profile.avatar};
      const{data:result}=await axiosInstance.patch(`/api/users/${user.id}/update-profile`,body);
      const updated={...user,...(result.user||body)};
      localStorage.setItem('opps_user',JSON.stringify(updated));
      localStorage.setItem('opps_profile',JSON.stringify({dateOfBirth:profile.dateOfBirth,academicProjects:profile.academicProjects,certifications:profile.certifications,volunteerWork:profile.volunteerWork,publications:profile.publications,awards:profile.awards,linkedin:profile.linkedin,github:profile.github,portfolio:profile.portfolio}));
      setUser(updated);setSaved(true);setTimeout(()=>setSaved(false),3000);
    }catch(err){console.error(err);}finally{setSaving(false);}
  };

  const runAiAnalysis=()=>{
    setAiAnalyzing(true);
    setTimeout(()=>{
      const fr=lang==='fr';
      const strengths=[],weaknesses=[];
      if(profile.institution)strengths.push(fr?`Vous êtes à ${profile.institution}, établissement reconnu.`:`You are at ${profile.institution}, a recognized institution.`);
      if(sub.academic>60)strengths.push(fr?'Base académique solide.':'Strong academic foundation.');
      if(profile.languages?.length>1)strengths.push(fr?`${profile.languages.length} langues maîtrisées — atout majeur.`:`${profile.languages.length} languages — major asset.`);
      if(sub.projects<40)weaknesses.push(fr?'Manque de projets concrets — les jurys veulent des réalisations.':'Lack of concrete projects — juries want achievements.');
      if(!profile.motivationSummary||profile.motivationSummary.length<200)weaknesses.push(fr?'Motivation trop courte ou absente.':'Motivation too short or missing.');
      if(sub.languages<40)weaknesses.push(fr?'Langues insuffisantes pour les bourses internationales.':'Languages insufficient for international scholarships.');
      if(!weaknesses.length)weaknesses.push(fr?'Aucune faiblesse majeure détectée — profil fort.':'No major weakness detected — strong profile.');
      setAiAnalysis({
        summary:fr?`Score de ${sub.global}/100 — catégorie "${tier.label}". ${scores.length>0?`Votre dernier entretien IA: ${lastScore}/100.`:''} Potentiel d'amélioration estimé: +${Math.min(95,sub.global+22)} en 3 semaines.`:`Score of ${sub.global}/100 — "${tier.labelEn}" category. ${scores.length>0?`Your last AI interview: ${lastScore}/100.`:''} Estimated improvement potential: +${Math.min(95,sub.global+22)} in 3 weeks.`,
        strengths,weaknesses,
        roadmap:fr?`1. Compléter la motivation (impact +10%). 2. Ajouter ${Math.max(0,2-(profile.academicProjects?.length||0))} projet(s). 3. Certifier l'anglais (IELTS/TOEIC). 4. ${scores.length<3?'Effectuer 3 entretiens IA.':'Continuer les entretiens IA régulièrement.'}`:`1. Complete motivation (impact +10%). 2. Add ${Math.max(0,2-(profile.academicProjects?.length||0))} project(s). 3. Certify English (IELTS/TOEIC). 4. ${scores.length<3?'Complete 3 AI interviews.':'Continue AI interviews regularly.'}`,
      });
      setAiAnalyzing(false);
    },2000);
  };

  const navItems=[
    {id:'dashboard',label:'Dashboard'},
    {id:'personal',label:lang==='fr'?'Personnel':'Personal'},
    {id:'academic',label:lang==='fr'?'Formation':'Education'},
    {id:'experience',label:lang==='fr'?'Expérience':'Experience'},
    {id:'projects',label:lang==='fr'?'Projets':'Projects'},
    {id:'skills',label:lang==='fr'?'Compétences':'Skills'},
    {id:'goals',label:lang==='fr'?'Objectifs':'Goals'},
  ];

  if(!user)return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:c.paper}}>
      <div style={{background:c.surface,border:`1px solid ${c.rule}`,padding:'48px 40px',maxWidth:360,width:'100%',textAlign:'center'}}>
        <div style={{fontFamily:c.fSerif,fontSize:24,fontWeight:700,color:c.ink,marginBottom:12}}>{lang==='fr'?'Accès restreint':'Access restricted'}</div>
        <p style={{fontFamily:c.fSans,fontSize:13,color:c.ink2,lineHeight:1.6,marginBottom:24}}>{lang==='fr'?'Connectez-vous pour accéder à votre profil.':'Sign in to access your profile.'}</p>
        <button onClick={()=>setView('accueil')} style={{padding:'10px 28px',background:c.accent,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:12,fontWeight:700,cursor:'pointer',borderRadius:4}}>Se connecter</button>
      </div>
    </div>
  );

  // KPIs dynamiques
  const roadmapDone=roadmap.filter(r=>{const t=Array.isArray(r.etapes)?r.etapes.length:5;return(r.etapeCourante||0)>=t-1;}).length;
  const completionScore=Math.round([!!profile.name,!!profile.phone,!!profile.nationality,!!profile.currentLevel,!!profile.fieldOfStudy,!!profile.institution,!!profile.gpa,profile.languages.length>0,profile.skills.length>0,!!profile.targetDegree,profile.targetCountries.length>0,!!profile.motivationSummary,profile.academicHistory.length>0,profile.workExperience.length>0,profile.academicProjects.length>0].filter(Boolean).length/15*100);

  return(
    <div style={{background:c.paper,minHeight:'100vh',fontFamily:c.fSans}}>

      {/* EN-TÊTE UTILISATEUR */}
      <div style={{background:c.surface,borderBottom:`1px solid ${c.rule}`,padding:'28px 40px'}}>
        <div style={{maxWidth:1280,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:24}}>
          <div style={{display:'flex',gap:22,alignItems:'flex-start',flexWrap:'wrap'}}>
            <AvatarUploader avatarId={profile.avatar} onUpload={id=>setProfile(p=>({...p,avatar:id}))} c={c}/>
            <div style={{paddingTop:4}}>
              <h1 style={{fontFamily:c.fSerif,fontSize:26,fontWeight:700,color:c.ink,margin:'0 0 6px'}}>{profile.name||user?.name||(lang==='fr'?'Votre profil':'Your profile')}</h1>
              <div style={{fontFamily:c.fSans,fontSize:13,color:c.ink2,marginBottom:8}}>
                {[profile.currentLevel,profile.fieldOfStudy,profile.institution].filter(Boolean).join(' · ')||(lang==='fr'?'Profil non renseigné':'Profile not filled')}
              </div>
              <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
                {profile.countryOfResidence&&<span style={{fontFamily:c.fSans,fontSize:11,color:c.ink3,fontWeight:500}}>{profile.countryOfResidence}</span>}
                {profile.gpa&&<span style={{fontFamily:c.fMono,fontSize:11,color:c.ink3}}>GPA {profile.gpa}/20</span>}
                {profile.languages.length>0&&<span style={{fontFamily:c.fSans,fontSize:11,color:c.ink3}}>{profile.languages.map(l=>l.language).filter(Boolean).join(', ')}</span>}
                {profile.targetDegree&&<span style={{fontFamily:c.fMono,fontSize:11,color:c.accent}}>{profile.targetDegree}</span>}
              </div>
            </div>
          </div>
          <div style={{display:'flex',gap:32,alignItems:'flex-start',flexWrap:'wrap'}}>
         
            <div style={{display:'flex',flexDirection:'column',gap:8,alignSelf:'center'}}>
              <button onClick={handleSave} disabled={saving} style={{padding:'8px 18px',background:saved?c.green:c.accent,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:12,fontWeight:700,cursor:'pointer',borderRadius:4,transition:'background 0.2s'}}>
                {saving?'..':saved?'Sauvegarde':lang==='fr'?'Sauvegarder':'Save'}
              </button>
              <button onClick={handleLogout} style={{padding:'8px 18px',background:'none',color:c.danger,border:`1px solid ${c.danger}`,fontFamily:c.fSans,fontSize:12,fontWeight:600,cursor:'pointer',borderRadius:4}}>
                {lang==='fr'?'Déconnexion':'Sign out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION HORIZONTALE */}
      <div style={{borderBottom:`1px solid ${c.rule}`,background:c.surface,position:'sticky',top:0,zIndex:100}}>
  <div style={{maxWidth:1280,margin:'0 auto',padding:'0 40px',display:'flex',justifyContent:'space-between',gap:0,overflowX:'auto'}}>
    {navItems.map(item=>(
      <button key={item.id} onClick={()=>setTab(item.id)} style={{
        padding:'16px 0',
        background:'none',
        border:'none',
        borderBottom:tab===item.id?`2px solid ${c.accent}`:'2px solid transparent',
        fontFamily:c.fSans,
        fontSize:13,
        fontWeight:tab===item.id?700:500,
        color:tab===item.id?c.accent:c.ink2,
        cursor:'pointer',
        transition:'all 0.2s',
        whiteSpace:'nowrap',
        letterSpacing:'0.02em',
        flex:1,
        textAlign:'center',
        position:'relative'
      }}
      onMouseEnter={e=>{if(tab!==item.id)e.currentTarget.style.color=c.accent;}}
      onMouseLeave={e=>{if(tab!==item.id)e.currentTarget.style.color=c.ink2;}}>
        {item.label}
        {item.id==='dashboard'&&<span style={{marginLeft:6,fontSize:9,background:c.accent,color:'#fff',padding:'1px 5px',borderRadius:2,fontWeight:700,letterSpacing:'0.06em'}}>AI</span>}
      </button>
    ))}
  </div>
</div>

      {/* CONTENU */}
      <div style={{maxWidth:1280,margin:'0 auto',padding:'32px 40px'}}>

        {/* ══════ DASHBOARD ══════ */}
        {tab === 'dashboard' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

    {/* Ligne unique : Applicant Strength + Complétude du profil */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Applicant Strength */}
      <div style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: '24px' }}>
        <div style={{ fontFamily: c.fSerif, fontSize: 14, fontWeight: 600, color: c.ink2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Applicant Strength
        </div>
        <div style={{ fontFamily: c.fSerif, fontSize: 64, fontWeight: 700, color: tier.color, lineHeight: 1 }}>
          {sub.global}<span style={{ fontSize: 20, color: c.ink3 }}>/100</span>
        </div>
        <div style={{ marginTop: 8, display: 'inline-block', background: tier.bg, border: `1px solid ${tier.border}`, color: tier.color, padding: '4px 12px', borderRadius: 20, fontFamily: c.fMono, fontSize: 12, fontWeight: 600 }}>
          {sub.global >= 75 ? (lang === 'fr' ? 'Fort candidat' : 'Strong applicant') : sub.global >= 50 ? (lang === 'fr' ? 'Compétitif' : 'Competitive') : (lang === 'fr' ? 'En progression' : 'Developing')}
        </div>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: c.fSans, fontSize: 12, color: c.ink3 }}>Evolution this week</span>
          <span style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, color: weeklyGain >= 0 ? c.green : c.danger }}>
            {weeklyGain >= 0 ? '▲' : '▼'} {Math.abs(weeklyGain)}%
          </span>
        </div>
      </div>

      {/* Complétude du profil */}
      <div style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, color: c.ink }}>{lang === 'fr' ? 'Complétude du profil' : 'Profile completeness'}</div>
            <div style={{ fontFamily: c.fSans, fontSize: 12, color: c.ink3 }}>{lang === 'fr' ? 'Paré·e pour maximiser tes chances' : 'Ready to maximise your chances'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: c.fSerif, fontSize: 28, fontWeight: 700, color: tier.color, lineHeight: 1 }}>{completionScore}%</div>
          </div>
        </div>
        <div style={{ height: 8, background: c.rule, borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', width: `${completionScore}%`, background: `linear-gradient(90deg, ${c.accent}, ${c.green})`, borderRadius: 99, transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: c.fSans, fontSize: 11, color: c.ink3 }}>
          <span>✅ {completionScore}% {lang === 'fr' ? 'complété' : 'completed'}</span>
          <span>{100 - completionScore}% {lang === 'fr' ? 'restant' : 'remaining'}</span>
        </div>
      </div>
    </div>

    {/* KPI Bar */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 1, background: c.rule, border: `1px solid ${c.rule}` }}>
      {[
        { label: lang === 'fr' ? 'Score candidature' : 'Application score', val: `${sub.global}/100`, color: tier.color, sub: lang === 'fr' ? tier.label : tier.labelEn },
        { label: lang === 'fr' ? 'Profil complété' : 'Profile completed', val: `${completionScore}%`, color: completionScore >= 70 ? c.green : completionScore >= 50 ? c.accent : c.warn, sub: lang === 'fr' ? `${15 - Math.round(completionScore / 100 * 15)} champs restants` : `${15 - Math.round(completionScore / 100 * 15)} fields left` },
        { label: lang === 'fr' ? 'Candidatures' : 'Applications', val: roadmap.length, color: c.accent, sub: `${roadmapDone} ${lang === 'fr' ? 'terminées' : 'completed'}` },
        { label: lang === 'fr' ? 'Entretiens IA' : 'AI interviews', val: scores.length, color: scores.length >= 3 ? c.green : scores.length >= 1 ? c.accent : c.ink3, sub: scores.length > 0 ? `Dernier: ${scores[0].scoreNum}/100` : (lang === 'fr' ? 'Aucun encore' : 'None yet') },
        { label: lang === 'fr' ? 'Favoris' : 'Favorites', val: favorites, color: c.accent, sub: lang === 'fr' ? 'Bourses sauvegardées' : 'Saved scholarships' },
      ].map((k, i) => (
        <div key={i} style={{ background: c.surface, padding: '18px 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: c.fSans, fontSize: 10, fontWeight: 600, color: c.ink3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</div>
          <div style={{ fontFamily: c.fSerif, fontSize: 28, fontWeight: 700, color: k.color, lineHeight: 1, marginBottom: 4 }}>{k.val}</div>
          <div style={{ fontFamily: c.fSans, fontSize: 10, color: c.ink3, fontWeight: 500 }}>{k.sub}</div>
        </div>
      ))}
    </div>

    {/* Score + Actions prioritaires */}
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
      <ScoreWidget sub={sub} tier={tier} profile={profile} c={c} lang={lang} onAnalyze={runAiAnalysis} aiAnalyzing={aiAnalyzing} />
      <div>
        <PriorityActions actions={priorityActions} c={c} lang={lang} onAction={a => { if (a.external) setView(a.section); else setTab(a.section); }} />
        {/* Simulation bloc */}
        <div style={{ marginTop: 16, background: c.paper2, padding: '16px', borderRadius: 8 }}>
          <div style={{ fontFamily: c.fSerif, fontSize: 14, fontWeight: 700, color: c.ink }}>
            Simulation : si vous complétez votre motivation
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
            <span>Score actuel : <strong>{sub.global}</strong></span>
            <span>→</span>
            <span>Nouveau score : <strong style={{ color: c.green }}>{Math.min(100, sub.global + 10)}</strong></span>
          </div>
          <div style={{ height: 4, background: c.rule, borderRadius: 99, marginTop: 8 }}>
            <div style={{ height: '100%', width: `${Math.min(100, sub.global + 10)}%`, background: c.accent, borderRadius: 99 }} />
          </div>
        </div>
      </div>
    </div>

    {/* AI Analysis */}
    {aiAnalysis && <AiAnalysisWidget analysis={aiAnalysis} tier={tier} sub={sub} insights={[]} c={c} lang={lang} />}

    {/* Radar + Entretiens */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: '24px' }}>
        <div style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, color: c.ink, marginBottom: 6 }}>{lang === 'fr' ? 'Radar de compétences' : 'Skills radar'}</div>
        <div style={{ fontFamily: c.fSans, fontSize: 12, color: c.ink3, marginBottom: 16 }}>{lang === 'fr' ? 'Vue multidimensionnelle de votre profil' : 'Multi-dimensional profile view'}</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <RadarChart c={c} size={200} data={[
            { label: lang === 'fr' ? 'Acad.' : 'Acad.', value: sub.academic },
            { label: lang === 'fr' ? 'Exp.' : 'Exp.', value: sub.experience },
            { label: 'Proj.', value: sub.projects },
            { label: lang === 'fr' ? 'Lang.' : 'Lang.', value: sub.languages },
            { label: 'Motiv.', value: sub.motivation },
          ]} />
        </div>
      </div>
      <InterviewWidget scores={scores} setView={setView} c={c} lang={lang} />
    </div>

    {/* Candidatures + Pays */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <RoadmapWidget roadmap={roadmap} setRoadmap={setRoadmap} user={user} c={c} lang={lang} setView={setView} />
      <CountryReadinessWidget profile={profile} scores={scores} c={c} lang={lang} />
    </div>

    {/* Alertes + Missions */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <InsightsWidget profile={profile} scores={scores} c={c} lang={lang} setTab={setTab} />
      <MissionsWidget profile={profile} scores={scores} c={c} lang={lang} setTab={setTab} setView={setView} />
    </div>

  </div>
)}
        {/* ══════ FORMULAIRES ══════ */}
        {tab!=='dashboard'&&(
          <div style={{maxWidth:800,margin:'0 auto'}}>

            {/* PERSONNEL */}
            {tab==='personal'&&(
              <div>
                <SecTitle c={c}>{lang==='fr'?'Informations personnelles':'Personal information'}</SecTitle>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:28}}>
                  <Field label={lang==='fr'?'Nom complet':'Full name'} v={profile.name} s={v=>setProfile(p=>({...p,name:v}))} ph="Prénom Nom" c={c}/>
                  <Field label="Email" v={profile.email} readOnly c={c}/>
                  <Field label={lang==='fr'?'Téléphone':'Phone'} v={profile.phone} s={v=>setProfile(p=>({...p,phone:v}))} ph="+216 XX XXX XXX" c={c}/>
                  <AutocompleteInput label={lang==='fr'?'Date de naissance':'Date of birth'} value={profile.dateOfBirth} onChange={v=>setProfile(p=>({...p,dateOfBirth:v}))} suggestions={[]} type="date" c={c}/>
                  <AutocompleteInput label={lang==='fr'?'Nationalité':'Nationality'} value={profile.nationality} onChange={v=>setProfile(p=>({...p,nationality:v}))} suggestions={COUNTRY_SUGGESTIONS} placeholder="Ex: Tunisienne" c={c}/>
                  <AutocompleteInput label={lang==='fr'?'Pays de résidence':'Residence'} value={profile.countryOfResidence} onChange={v=>setProfile(p=>({...p,countryOfResidence:v}))} suggestions={COUNTRY_SUGGESTIONS} placeholder="Ex: Tunisie" c={c}/>
                </div>
                <SecTitle c={c}>{lang==='fr'?'Liens professionnels':'Professional links'}</SecTitle>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:28}}>
                  <Field label="LinkedIn" v={profile.linkedin} s={v=>setProfile(p=>({...p,linkedin:v}))} ph="linkedin.com/in/..." c={c}/>
                  <Field label="GitHub" v={profile.github} s={v=>setProfile(p=>({...p,github:v}))} ph="github.com/..." c={c}/>
                  <div style={{gridColumn:'span 2'}}><Field label="Portfolio" v={profile.portfolio} s={v=>setProfile(p=>({...p,portfolio:v}))} ph="https://your-site.com" c={c}/></div>
                </div>
                <SecTitle c={c}>{lang==='fr'?'Distinctions & prix':'Awards'}</SecTitle>
                {profile.awards.map((a,i)=>(
                  <div key={i} style={{marginBottom:16,padding:16,border:`1px solid ${c.ruleSoft}`,background:c.paper2,borderRadius:4}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><strong style={{fontFamily:c.fSans,fontSize:13,color:c.ink}}>{a.title||`Prix ${i+1}`}</strong><button onClick={()=>delItem('awards')(i)} style={{color:c.danger,background:'none',border:'none',cursor:'pointer',fontFamily:c.fSans,fontSize:12}}>Supprimer</button></div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                      <Field label="Titre" v={a.title} s={v=>upd('awards')(i,'title',v)} ph="Prix Innovation" c={c}/>
                      <Field label="Organisation" v={a.organization} s={v=>upd('awards')(i,'organization',v)} ph="Université X" c={c}/>
                      <Field label="Année" v={a.year} s={v=>upd('awards')(i,'year',v)} ph="2024" c={c}/>
                      <div style={{gridColumn:'span 2'}}><Field label="Description" v={a.description} s={v=>upd('awards')(i,'description',v)} ph="Description" c={c}/></div>
                    </div>
                  </div>
                ))}
                <button onClick={addItem('awards',{title:'',organization:'',year:'',description:''})} style={{padding:'8px 16px',background:c.accent,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:12,fontWeight:700,cursor:'pointer',borderRadius:4}}>+ {lang==='fr'?'Ajouter une distinction':'Add award'}</button>
              </div>
            )}

            {/* FORMATION */}
            {tab==='academic'&&(
              <div>
                <SecTitle c={c}>{lang==='fr'?'Formation actuelle':'Current education'}</SecTitle>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:28}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:c.ink2,marginBottom:4,fontFamily:c.fSans,textTransform:'uppercase',letterSpacing:'0.04em'}}>{lang==='fr'?'Niveau actuel':'Current level'}</div>
                    <select value={profile.currentLevel} onChange={e=>setProfile(p=>({...p,currentLevel:e.target.value}))} style={{width:'100%',padding:'9px 12px',border:`1px solid ${c.ruleSoft}`,background:c.paper,fontFamily:c.fSans,fontSize:13,color:c.ink,borderRadius:4}}>
                      <option value="">—</option>{DEG_LEVELS.map(v=><option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <AutocompleteInput label={lang==='fr'?"Domaine d'études":'Field of study'} value={profile.fieldOfStudy} onChange={v=>setProfile(p=>({...p,fieldOfStudy:v}))} suggestions={FIELD_SUGGESTIONS} placeholder="Ex: Informatique" c={c}/>
                  <div style={{gridColumn:'span 2'}}><Field label={lang==='fr'?'Établissement':'Institution'} v={profile.institution} s={v=>setProfile(p=>({...p,institution:v}))} ph="Ex: ISIMA" c={c}/></div>
                  <Field label={lang==='fr'?'Moyenne (sur 20)':'GPA (out of 20)'} v={profile.gpa} s={v=>setProfile(p=>({...p,gpa:v}))} type="number" ph="14.5" c={c}/>
                  <Field label={lang==='fr'?'Année de diplôme':'Graduation year'} v={profile.graduationYear} s={v=>setProfile(p=>({...p,graduationYear:v}))} type="number" ph="2026" c={c}/>
                </div>
                <SecTitle c={c}>{lang==='fr'?'Historique académique':'Academic history'}</SecTitle>
                {profile.academicHistory.map((h,i)=>(
                  <div key={i} style={{marginBottom:16,padding:16,border:`1px solid ${c.ruleSoft}`,background:c.paper2,borderRadius:4}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><strong style={{fontFamily:c.fSans,fontSize:13,color:c.ink}}>{h.degree||`Diplôme ${i+1}`}</strong><button onClick={()=>delItem('academicHistory')(i)} style={{color:c.danger,background:'none',border:'none',cursor:'pointer',fontFamily:c.fSans,fontSize:12}}>Supprimer</button></div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                      <Field label="Diplôme" v={h.degree} s={v=>upd('academicHistory')(i,'degree',v)} ph="Licence, Master" c={c}/>
                      <Field label="Établissement" v={h.institution} s={v=>upd('academicHistory')(i,'institution',v)} ph="Université" c={c}/>
                      <AutocompleteInput label="Domaine" value={h.field} onChange={v=>upd('academicHistory')(i,'field',v)} suggestions={FIELD_SUGGESTIONS} placeholder="Maths..." c={c}/>
                      <Field label="Année" v={h.year} s={v=>upd('academicHistory')(i,'year',v)} ph="2022" c={c}/>
                      <div style={{gridColumn:'span 2'}}><Field label="Mention" v={h.grade} s={v=>upd('academicHistory')(i,'grade',v)} ph="Bien, 15/20..." c={c}/></div>
                    </div>
                  </div>
                ))}
                <button onClick={addItem('academicHistory',{degree:'',institution:'',field:'',year:'',grade:''})} style={{padding:'8px 16px',background:c.accent,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:12,fontWeight:700,cursor:'pointer',borderRadius:4}}>+ {lang==='fr'?'Ajouter un diplôme':'Add education'}</button>
                <SecTitle c={c}>Certifications</SecTitle>
                {profile.certifications.map((cert,i)=>(
                  <div key={i} style={{marginBottom:16,padding:16,border:`1px solid ${c.ruleSoft}`,background:c.paper2,borderRadius:4}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><strong style={{fontFamily:c.fSans,fontSize:13,color:c.ink}}>{cert.name||`Certification ${i+1}`}</strong><button onClick={()=>delItem('certifications')(i)} style={{color:c.danger,background:'none',border:'none',cursor:'pointer',fontFamily:c.fSans,fontSize:12}}>Supprimer</button></div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                      <Field label="Nom" v={cert.name} s={v=>upd('certifications')(i,'name',v)} ph="AWS, IELTS..." c={c}/>
                      <Field label="Organisme" v={cert.issuer} s={v=>upd('certifications')(i,'issuer',v)} ph="Coursera, ETS..." c={c}/>
                      <AutocompleteInput label="Date" value={cert.date} onChange={v=>upd('certifications')(i,'date',v)} suggestions={[]} type="date" c={c}/>
                      <Field label="ID / Lien" v={cert.credential} s={v=>upd('certifications')(i,'credential',v)} ph="URL ou ID" c={c}/>
                    </div>
                  </div>
                ))}
                <button onClick={addItem('certifications',{name:'',issuer:'',date:'',credential:''})} style={{padding:'8px 16px',background:c.accent,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:12,fontWeight:700,cursor:'pointer',borderRadius:4}}>+ {lang==='fr'?'Ajouter une certification':'Add certification'}</button>
              </div>
            )}

            {/* EXPÉRIENCE */}
            {tab==='experience'&&(
              <div>
                <SecTitle c={c}>{lang==='fr'?'Expériences professionnelles':'Work experience'}</SecTitle>
                {profile.workExperience.map((w,i)=>(
                  <div key={i} style={{marginBottom:16,padding:16,border:`1px solid ${c.ruleSoft}`,background:c.paper2,borderRadius:4}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><strong style={{fontFamily:c.fSans,fontSize:13,color:c.ink}}>{w.position||`Expérience ${i+1}`}{w.company?` @ ${w.company}`:''}</strong><button onClick={()=>delItem('workExperience')(i)} style={{color:c.danger,background:'none',border:'none',cursor:'pointer',fontFamily:c.fSans,fontSize:12}}>Supprimer</button></div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                      <div><div style={{fontSize:11,fontWeight:600,color:c.ink2,marginBottom:4,fontFamily:c.fSans,textTransform:'uppercase',letterSpacing:'0.04em'}}>Type</div><select value={w.type||''} onChange={e=>upd('workExperience')(i,'type',e.target.value)} style={{width:'100%',padding:'8px',border:`1px solid ${c.ruleSoft}`,background:c.paper,fontSize:12,fontFamily:c.fSans,borderRadius:4}}><option value="">—</option><option value="internship">Stage</option><option value="job">Emploi</option><option value="freelance">Freelance</option></select></div>
                      <Field label="Poste" v={w.position} s={v=>upd('workExperience')(i,'position',v)} ph="Développeur" c={c}/>
                      <Field label="Entreprise" v={w.company} s={v=>upd('workExperience')(i,'company',v)} ph="TechCorp" c={c}/>
                      <AutocompleteInput label="Ville" value={w.city} onChange={v=>upd('workExperience')(i,'city',v)} suggestions={['Tunis','Paris','Montréal','Berlin','Londres']} placeholder="Tunis" c={c}/>
                      <AutocompleteInput label="Début" value={w.startDate} onChange={v=>upd('workExperience')(i,'startDate',v)} suggestions={[]} type="date" c={c}/>
                      <AutocompleteInput label="Fin" value={w.endDate} onChange={v=>upd('workExperience')(i,'endDate',v)} suggestions={[]} type="date" c={c}/>
                      <div style={{gridColumn:'span 2'}}><Field label="Description" v={w.description} s={v=>upd('workExperience')(i,'description',v)} ph="Missions, résultats..." c={c}/></div>
                      <div style={{gridColumn:'span 2'}}><Field label="Technologies" v={w.technologies} s={v=>upd('workExperience')(i,'technologies',v)} ph="React, Django..." c={c}/></div>
                    </div>
                  </div>
                ))}
                <button onClick={addItem('workExperience',{position:'',company:'',city:'',startDate:'',endDate:'',description:'',type:'internship',technologies:''})} style={{padding:'8px 16px',background:c.accent,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:12,fontWeight:700,cursor:'pointer',borderRadius:4}}>+ {lang==='fr'?'Ajouter une expérience':'Add experience'}</button>
                <SecTitle c={c}>{lang==='fr'?'Bénévolat':'Volunteer work'}</SecTitle>
                {profile.volunteerWork.map((v,i)=>(
                  <div key={i} style={{marginBottom:16,padding:16,border:`1px solid ${c.ruleSoft}`,background:c.paper2,borderRadius:4}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><strong style={{fontFamily:c.fSans,fontSize:13,color:c.ink}}>{v.role||`Activité ${i+1}`}</strong><button onClick={()=>delItem('volunteerWork')(i)} style={{color:c.danger,background:'none',border:'none',cursor:'pointer',fontFamily:c.fSans,fontSize:12}}>Supprimer</button></div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                      <Field label="Rôle" v={v.role} s={val=>upd('volunteerWork')(i,'role',val)} ph="Team Leader" c={c}/>
                      <Field label="Organisation" v={v.organization} s={val=>upd('volunteerWork')(i,'organization',val)} ph="Association" c={c}/>
                      <AutocompleteInput label="Début" value={v.startDate} onChange={val=>upd('volunteerWork')(i,'startDate',val)} suggestions={[]} type="date" c={c}/>
                      <AutocompleteInput label="Fin" value={v.endDate} onChange={val=>upd('volunteerWork')(i,'endDate',val)} suggestions={[]} type="date" c={c}/>
                      <div style={{gridColumn:'span 2'}}><Field label="Description" v={v.description} s={val=>upd('volunteerWork')(i,'description',val)} ph="Responsabilités..." c={c}/></div>
                    </div>
                  </div>
                ))}
                <button onClick={addItem('volunteerWork',{role:'',organization:'',startDate:'',endDate:'',description:''})} style={{padding:'8px 16px',background:c.accent,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:12,fontWeight:700,cursor:'pointer',borderRadius:4}}>+ {lang==='fr'?'Ajouter une activité':'Add activity'}</button>
              </div>
            )}

            {/* PROJETS */}
            {tab==='projects'&&(
              <div>
                <SecTitle c={c}>{lang==='fr'?'Projets académiques':'Academic projects'}</SecTitle>
                <div style={{padding:'12px 16px',background:c.paper2,border:`1px solid ${c.ruleSoft}`,borderLeft:`3px solid ${c.accent}`,marginBottom:20,fontFamily:c.fSans,fontSize:12,color:c.ink2,borderRadius:4,lineHeight:1.5}}>
                  {lang==='fr'?'Les projets sont essentiels — ils démontrent vos compétences concrètes auprès des jurys.':'Projects are essential — they demonstrate concrete skills to selection committees.'}
                </div>
                {profile.academicProjects.length===0&&<div style={{textAlign:'center',padding:'32px',background:c.paper2,border:`1px dashed ${c.rule}`,borderRadius:4,marginBottom:20}}><div style={{fontFamily:c.fSerif,fontSize:16,color:c.ink,marginBottom:8}}>{lang==='fr'?'Aucun projet ajouté':'No projects yet'}</div><div style={{fontFamily:c.fSans,fontSize:12,color:c.ink3}}>{lang==='fr'?'PFE, cours, personnels, startups...':'PFE, course projects, personal, startups...'}</div></div>}
                {profile.academicProjects.map((p,i)=>(
                  <div key={i} style={{marginBottom:16,padding:16,border:`1px solid ${c.ruleSoft}`,background:c.paper2,borderRadius:4}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><strong style={{fontFamily:c.fSans,fontSize:13,color:c.ink}}>{p.title||`Projet ${i+1}`}</strong><button onClick={()=>delItem('academicProjects')(i)} style={{color:c.danger,background:'none',border:'none',cursor:'pointer',fontFamily:c.fSans,fontSize:12}}>Supprimer</button></div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                      <div style={{gridColumn:'span 2'}}><Field label="Titre" v={p.title} s={v=>upd('academicProjects')(i,'title',v)} ph="Système de..." c={c}/></div>
                      <div><div style={{fontSize:11,fontWeight:600,color:c.ink2,marginBottom:4,fontFamily:c.fSans,textTransform:'uppercase',letterSpacing:'0.04em'}}>Type</div><select value={p.type||''} onChange={e=>upd('academicProjects')(i,'type',e.target.value)} style={{width:'100%',padding:'8px',border:`1px solid ${c.ruleSoft}`,background:c.paper,fontSize:12,fontFamily:c.fSans,borderRadius:4}}><option value="">—</option><option value="pfe">PFE</option><option value="academic">Académique</option><option value="personal">Personnel</option><option value="entrepreneurial">Entrepreneurial</option><option value="research">Recherche</option></select></div>
                      <Field label="Année" v={p.year} s={v=>upd('academicProjects')(i,'year',v)} ph="2024" c={c}/>
                      <div style={{gridColumn:'span 2'}}><Field label="Description" v={p.description} s={v=>upd('academicProjects')(i,'description',v)} ph="Objectif, résultats..." c={c}/></div>
                      <div style={{gridColumn:'span 2'}}><Field label="Technologies" v={p.technologies} s={v=>upd('academicProjects')(i,'technologies',v)} ph="React, Python, MySQL..." c={c}/></div>
                      <Field label="GitHub / Demo" v={p.link} s={v=>upd('academicProjects')(i,'link',v)} ph="https://github.com/..." c={c}/>
                      <Field label="Impact" v={p.impact} s={v=>upd('academicProjects')(i,'impact',v)} ph="Prix, déploiement..." c={c}/>
                    </div>
                  </div>
                ))}
                <button onClick={addItem('academicProjects',{title:'',type:'',year:'',description:'',technologies:'',link:'',impact:''})} style={{padding:'8px 16px',background:c.accent,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:12,fontWeight:700,cursor:'pointer',borderRadius:4}}>+ {lang==='fr'?'Ajouter un projet':'Add project'}</button>
              </div>
            )}

            {/* COMPÉTENCES */}
            {tab==='skills'&&(
              <div>
                <SecTitle c={c}>{lang==='fr'?'Langues':'Languages'}</SecTitle>
                {profile.languages.map((l,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto',gap:12,alignItems:'end',marginBottom:12,padding:14,border:`1px solid ${c.ruleSoft}`,background:c.paper2,borderRadius:4}}>
                    <AutocompleteInput label="Langue" value={l.language} onChange={v=>upd('languages')(i,'language',v)} suggestions={LANGUAGE_SUGGESTIONS} placeholder="Anglais" c={c}/>
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:c.ink2,marginBottom:4,fontFamily:c.fSans,textTransform:'uppercase',letterSpacing:'0.04em'}}>CECRL</div>
                      <select value={l.level||''} onChange={e=>upd('languages')(i,'level',e.target.value)} style={{width:'100%',padding:'9px 8px',border:`1px solid ${c.ruleSoft}`,background:c.paper,fontSize:12,fontFamily:c.fSans,color:c.ink,borderRadius:4}}>
                        <option value="">—</option>{['A1','A2','B1','B2','C1','C2','Natif'].map(v=><option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <AutocompleteInput label="Certificat" value={l.certificate} onChange={v=>upd('languages')(i,'certificate',v)} suggestions={['IELTS','TOEIC','TOEFL','DELF','DALF','Cambridge']} placeholder="IELTS 7.5" c={c}/>
                    <button onClick={()=>delItem('languages')(i)} style={{color:c.danger,background:'none',border:'none',cursor:'pointer',fontFamily:c.fSans,fontSize:11,padding:'8px',alignSelf:'flex-end'}}>✕</button>
                  </div>
                ))}
                <button onClick={addItem('languages',{language:'',level:'',certificate:''})} style={{padding:'8px 16px',background:c.accent,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:12,fontWeight:700,cursor:'pointer',borderRadius:4,marginBottom:8}}>+ {lang==='fr'?'Ajouter une langue':'Add language'}</button>
                <SecTitle c={c}>{lang==='fr'?'Compétences techniques':'Technical skills'}</SecTitle>
                {profile.skills.map((sk,i)=>(
                  <SkillInput key={i} sk={sk} lang={lang} onSkillChange={v=>upd('skills')(i,'skill',v)} onCategoryChange={v=>upd('skills')(i,'category',v)} onLevelChange={v=>upd('skills')(i,'level',v)} onDelete={()=>delItem('skills')(i)} c={c}/>
                ))}
                <button onClick={addItem('skills',{skill:'',level:'',category:''})} style={{padding:'8px 16px',background:c.accent,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:12,fontWeight:700,cursor:'pointer',borderRadius:4}}>+ {lang==='fr'?'Ajouter une compétence':'Add skill'}</button>
              </div>
            )}

            {/* OBJECTIFS */}
            {tab==='goals'&&(
              <div>
                <SecTitle c={c}>{lang==='fr'?"Projet d'études à l'étranger":'Study abroad plan'}</SecTitle>
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11,fontWeight:600,color:c.ink2,marginBottom:4,fontFamily:c.fSans,textTransform:'uppercase',letterSpacing:'0.04em'}}>{lang==='fr'?'Niveau visé':'Target degree'}</div>
                  <select value={profile.targetDegree} onChange={e=>setProfile(p=>({...p,targetDegree:e.target.value}))} style={{width:'100%',padding:'9px 12px',border:`1px solid ${c.ruleSoft}`,background:c.paper,fontFamily:c.fSans,fontSize:13,color:c.ink,borderRadius:4}}>
                    <option value="">—</option>{['Licence','Master','Doctorat','Ingénieur','Formation courte','Résidence de recherche'].map(v=><option key={v}>{v}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11,fontWeight:600,color:c.ink2,marginBottom:8,fontFamily:c.fSans,textTransform:'uppercase',letterSpacing:'0.04em'}}>{lang==='fr'?'Pays cibles':'Target countries'}</div>
                  {profile.targetCountries.map((tc,i)=>(
                    <div key={i} style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
                      <div style={{flex:1}}><AutocompleteInput value={tc.country} onChange={v=>upd('targetCountries')(i,'country',v)} suggestions={COUNTRY_SUGGESTIONS} placeholder="France, Canada..." c={c}/></div>
                      <button onClick={()=>delItem('targetCountries')(i)} style={{color:c.danger,background:'none',border:'none',cursor:'pointer',fontFamily:c.fSans,fontSize:12,padding:'8px'}}>✕</button>
                    </div>
                  ))}
                  <button onClick={addItem('targetCountries',{country:''})} style={{padding:'7px 14px',background:c.accent,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:12,fontWeight:700,cursor:'pointer',borderRadius:4}}>+ {lang==='fr'?'Ajouter un pays':'Add country'}</button>
                </div>
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11,fontWeight:600,color:c.ink2,marginBottom:8,fontFamily:c.fSans,textTransform:'uppercase',letterSpacing:'0.04em'}}>{lang==='fr'?'Domaines visés':'Target fields'}</div>
                  {profile.targetFields.map((tf,i)=>(
                    <div key={i} style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
                      <div style={{flex:1}}><AutocompleteInput value={tf.field} onChange={v=>upd('targetFields')(i,'field',v)} suggestions={FIELD_SUGGESTIONS} placeholder="IA, Data Science..." c={c}/></div>
                      <button onClick={()=>delItem('targetFields')(i)} style={{color:c.danger,background:'none',border:'none',cursor:'pointer',fontFamily:c.fSans,fontSize:12,padding:'8px'}}>✕</button>
                    </div>
                  ))}
                  <button onClick={addItem('targetFields',{field:''})} style={{padding:'7px 14px',background:c.accent,color:'#fff',border:'none',fontFamily:c.fSans,fontSize:12,fontWeight:700,cursor:'pointer',borderRadius:4}}>+ {lang==='fr'?'Ajouter un domaine':'Add field'}</button>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:c.ink2,marginBottom:4,fontFamily:c.fSans,textTransform:'uppercase',letterSpacing:'0.04em'}}>{lang==='fr'?'Résumé de motivation':'Motivation summary'}</div>
                  <textarea value={profile.motivationSummary} onChange={e=>setProfile(p=>({...p,motivationSummary:e.target.value}))} rows={7} style={{width:'100%',border:`1px solid ${c.ruleSoft}`,padding:'10px 12px',fontFamily:c.fSans,fontSize:13,background:c.paper,color:c.ink,resize:'vertical',borderRadius:4,outline:'none',lineHeight:1.6}} placeholder={lang==='fr'?'Décrivez vos motivations, votre projet professionnel...':'Describe your motivations, professional project...'}/>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                    <span style={{fontFamily:c.fSans,fontSize:11,color:c.ink3}}>{profile.motivationSummary.length} {lang==='fr'?'caractères':'characters'}</span>
                    {profile.motivationSummary.length>0&&profile.motivationSummary.length<200&&<span style={{fontFamily:c.fSans,fontSize:11,color:c.warn}}>Minimum 200 {lang==='fr'?'recommandé':'recommended'}</span>}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}