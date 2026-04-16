import React, { useState, useEffect, useRef, useMemo } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';
import BourseDrawer from '../components/Boursedrawer';
import ChatInput from '../components/ChatInput';
import { useT } from '../i18n';

/* ─── LOGIN MODAL (traduit) ───────────────────────────────────────────────── */
function LoginModal({ onClose }) {
  const { lang } = useT();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');
  
  const send = async () => {
    if (!email || !email.includes('@')) { 
      setErrMsg(lang === 'fr' ? 'Email invalide' : 'Invalid email'); 
      return; 
    }
    setStatus('sending');
    try {
      await axiosInstance.post('/api/users/request-magic-link', { email: email.trim().toLowerCase() });
      setStatus('success');
    } catch (err) { 
      setStatus('error'); 
      setErrMsg(err.response?.data?.message || (lang === 'fr' ? 'Erreur serveur' : 'Server error')); 
    }
  };
  
  return (
    <div style={M.overlay}>
      <div style={M.box}>
        <div style={M.head}>
          <span style={{ fontSize:22 }}>🔐</span>
          <span style={{ color:'#fff', fontWeight:700, fontSize:16 }}>
            {lang === 'fr' ? 'Connexion à OppsTrack' : 'Sign in to OppsTrack'}
          </span>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={M.body}>
          {status==='idle' && (
            <>
              <p style={{ color:'#64748b',fontSize:14,marginBottom:20,lineHeight:1.6 }}>
                {lang === 'fr' 
                  ? 'Entrez votre email pour recevoir un ' 
                  : 'Enter your email to receive a '}
                <strong style={{ color:'#1a3a6b' }}>
                  {lang === 'fr' ? 'lien magique' : 'magic link'}
                </strong>.
              </p>
              <input type="email" placeholder={lang === 'fr' ? 'votre@email.com' : 'your@email.com'} 
                value={email} autoFocus onChange={e=>setEmail(e.target.value)} 
                onKeyDown={e=>e.key==='Enter'&&send()} style={M.input}/>
              {errMsg && <div style={{ color:'#dc2626',fontSize:12,marginTop:8 }}>{errMsg}</div>}
              <button style={M.btn} onClick={send}>
                ✉️ {lang === 'fr' ? 'Envoyer le lien magique' : 'Send magic link'}
              </button>
            </>
          )}
          {status==='sending' && (
            <div style={{ textAlign:'center',padding:'24px 0' }}>
              <div style={M.spinner}/>
              <p style={{ color:'#64748b',marginTop:14 }}>
                {lang === 'fr' ? 'Envoi...' : 'Sending...'}
              </p>
            </div>
          )}
          {status==='success' && (
            <div style={{ textAlign:'center',padding:'16px 0' }}>
              <div style={{ fontSize:52,marginBottom:12 }}>✉️</div>
              <div style={{ fontSize:16,fontWeight:700,color:'#166534',marginBottom:8 }}>
                {lang === 'fr' ? 'Lien envoyé !' : 'Link sent!'}
              </div>
              <p style={{ color:'#64748b',fontSize:13 }}>
                {lang === 'fr' ? 'Vérifiez votre boîte mail.' : 'Check your inbox.'}
              </p>
              <button style={{ ...M.btn,background:'#166534',marginTop:20 }} onClick={onClose}>
                ✓ {lang === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </div>
          )}
          {status==='error' && (
            <div style={{ textAlign:'center',padding:'16px 0' }}>
              <div style={{ fontSize:40,marginBottom:12 }}>⚠️</div>
              <p style={{ color:'#dc2626',marginBottom:12 }}>{errMsg}</p>
              <button style={{ ...M.btn,background:'#dc2626' }} onClick={()=>{setStatus('idle');setErrMsg('');}}>
                {lang === 'fr' ? 'Réessayer' : 'Retry'}
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
  overlay:{ position:'fixed',inset:0,zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center' },
  backdrop:{ position:'absolute',inset:0,background:'rgba(26,58,107,0.45)',backdropFilter:'blur(6px)' },
  box:{ position:'relative',zIndex:2001,width:400,maxWidth:'92vw',background:'#ffffff',borderRadius:10,overflow:'hidden',border:'1px solid #e2e8f0',boxShadow:'0 20px 48px rgba(26,58,107,0.18)',borderTop:'3px solid #f5a623' },
  head:{ display:'flex',alignItems:'center',gap:10,padding:'16px 20px',background:'#1a3a6b' },
  closeBtn:{ marginLeft:'auto',background:'rgba(255,255,255,0.12)',border:'none',color:'#fff',width:28,height:28,borderRadius:6,cursor:'pointer',fontSize:14 },
  body:{ padding:'24px' },
  input:{ width:'100%',padding:'11px 14px',borderRadius:6,border:'1.5px solid #e2e8f0',background:'#f8fafc',color:'#1a3a6b',fontSize:14,outline:'none',fontFamily:'inherit',boxSizing:'border-box',marginBottom:4 },
  btn:{ width:'100%',marginTop:16,padding:'12px',borderRadius:6,border:'none',background:'#1a3a6b',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit' },
  spinner:{ width:40,height:40,border:'3px solid #eff6ff',borderTopColor:'#1a3a6b',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto' },
};

/* ─── COUNTRY META ────────────────────────────────────────────────────────── */
const NUMERIC_TO_ALPHA2 = {'4':'AF','8':'AL','12':'DZ','24':'AO','32':'AR','36':'AU','40':'AT','50':'BD','56':'BE','68':'BO','76':'BR','100':'BG','120':'CM','124':'CA','152':'CL','156':'CN','170':'CO','178':'CG','188':'CR','192':'CU','196':'CY','203':'CZ','208':'DK','214':'DO','218':'EC','818':'EG','222':'SV','231':'ET','246':'FI','250':'FR','266':'GA','276':'DE','288':'GH','300':'GR','320':'GT','332':'HT','340':'HN','348':'HU','356':'IN','360':'ID','364':'IR','368':'IQ','372':'IE','376':'IL','380':'IT','388':'JM','392':'JP','400':'JO','404':'KE','410':'KR','408':'KP','414':'KW','422':'LB','430':'LR','434':'LY','484':'MX','504':'MA','516':'NA','524':'NP','528':'NL','554':'NZ','558':'NI','566':'NG','578':'NO','586':'PK','591':'PA','598':'PG','600':'PY','604':'PE','608':'PH','616':'PL','620':'PT','634':'QA','642':'RO','643':'RU','682':'SA','694':'SL','706':'SO','710':'ZA','724':'ES','729':'SD','752':'SE','756':'CH','760':'SY','764':'TH','788':'TN','792':'TR','800':'UG','804':'UA','784':'AE','826':'GB','840':'US','858':'UY','862':'VE','704':'VN','887':'YE','894':'ZM','716':'ZW'};
const ALPHA2_TO_NUMERIC = Object.fromEntries(Object.entries(NUMERIC_TO_ALPHA2).map(([n,a])=>[a,n]));
const COUNTRY_META = {
  FR:{label:'France',flag:'🇫🇷'},DE:{label:'Allemagne',flag:'🇩🇪'},GB:{label:'Royaume-Uni',flag:'🇬🇧'},US:{label:'États-Unis',flag:'🇺🇸'},CA:{label:'Canada',flag:'🇨🇦'},AU:{label:'Australie',flag:'🇦🇺'},JP:{label:'Japon',flag:'🇯🇵'},CN:{label:'Chine',flag:'🇨🇳'},KR:{label:'Corée du Sud',flag:'🇰🇷'},TR:{label:'Turquie',flag:'🇹🇷'},SA:{label:'Arabie Saoudite',flag:'🇸🇦'},MA:{label:'Maroc',flag:'🇲🇦'},TN:{label:'Tunisie',flag:'🇹🇳'},IN:{label:'Inde',flag:'🇮🇳'},BR:{label:'Brésil',flag:'🇧🇷'},ZA:{label:'Afrique du Sud',flag:'🇿🇦'},NG:{label:'Nigéria',flag:'🇳🇬'},EG:{label:'Égypte',flag:'🇪🇬'},BE:{label:'Belgique',flag:'🇧🇪'},NL:{label:'Pays-Bas',flag:'🇳🇱'},CH:{label:'Suisse',flag:'🇨🇭'},SE:{label:'Suède',flag:'🇸🇪'},NO:{label:'Norvège',flag:'🇳🇴'},HU:{label:'Hongrie',flag:'🇭🇺'},PL:{label:'Pologne',flag:'🇵🇱'},IT:{label:'Italie',flag:'🇮🇹'},ES:{label:'Espagne',flag:'🇪🇸'},RU:{label:'Russie',flag:'🇷🇺'},MX:{label:'Mexique',flag:'🇲🇽'},NZ:{label:'Nouvelle-Zélande',flag:'🇳🇿'},PT:{label:'Portugal',flag:'🇵🇹'},AT:{label:'Autriche',flag:'🇦🇹'},FI:{label:'Finlande',flag:'🇫🇮'},DK:{label:'Danemark',flag:'🇩🇰'},IE:{label:'Irlande',flag:'🇮🇪'},GR:{label:'Grèce',flag:'🇬🇷'},CZ:{label:'Tchéquie',flag:'🇨🇿'},RO:{label:'Roumanie',flag:'🇷🇴'},UA:{label:'Ukraine',flag:'🇺🇦'},AE:{label:'Émirats arabes unis',flag:'🇦🇪'},QA:{label:'Qatar',flag:'🇶🇦'},KE:{label:'Kenya',flag:'🇰🇪'},GH:{label:'Ghana',flag:'🇬🇭'},PK:{label:'Pakistan',flag:'🇵🇰'},ID:{label:'Indonésie',flag:'🇮🇩'},MY:{label:'Malaisie',flag:'🇲🇾'},TH:{label:'Thaïlande',flag:'🇹🇭'},VN:{label:'Vietnam',flag:'🇻🇳'},AR:{label:'Argentine',flag:'🇦🇷'},CL:{label:'Chili',flag:'🇨🇱'},CO:{label:'Colombie',flag:'🇨🇴'},PE:{label:'Pérou',flag:'🇵🇪'},
};

/* ─── HELPERS ─────────────────────────────────────────────────────────────── */
function getTotal(item) {
  if (Array.isArray(item.etapes)) return item.etapes.length;
  if (typeof item.etapes === 'string' && item.etapes.trim().startsWith('[')) {
    try { const p = JSON.parse(item.etapes); if (Array.isArray(p)) return p.length; } catch {}
  }
  return 5;
}

function getProgress(item) {
  const total = getTotal(item);
  const step  = item.etapeCourante || 0;
  return Math.min(step + 1, total);
}

function isItemDone(item) {
  const total = getTotal(item);
  const step  = item.etapeCourante || 0;
  return total > 0 && step >= total - 1;
}

function daysLeft(deadline, lang = 'fr') {  // ✅ Ajout du paramètre
  const diff = Math.round((new Date(deadline) - new Date()) / 86400000);
  if (diff < 0)   return { label: lang === 'fr' ? 'Expiré' : 'Expired', color:'#dc2626' };
  if (diff <= 7)  return { label:`${diff}${lang === 'fr' ? 'j' : 'd'}`, color:'#d97706' };
  if (diff <= 30) return { label:`${diff}${lang === 'fr' ? 'j' : 'd'}`, color:'#2563eb' };
  return { label:`${diff}${lang === 'fr' ? 'j' : 'd'}`, color:'#166534' };
}

function useAnimatedCounter(target, duration=1000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let n=0; const steps=30; const inc=target/steps; const iv=duration/steps;
    const t=setInterval(()=>{ n=Math.min(n+inc,target); setVal(Math.round(n)); if(n>=target)clearInterval(t); },iv);
    return ()=>clearInterval(t);
  }, [target]);
  return val;
}

function AnimatedRing({ pct, size=90, strokeWidth=7, color='#1a3a6b', children }) {
  const r=(size-strokeWidth*2)/2, circ=2*Math.PI*r;
  const [dash,setDash]=useState(0);
  useEffect(()=>{ const t=setTimeout(()=>setDash((pct/100)*circ),100); return()=>clearTimeout(t); },[pct,circ]);
  return (
    <div style={{ position:'relative',width:size,height:size,flexShrink:0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{ transition:'stroke-dasharray 1.2s ease' }}/>
      </svg>
      <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column' }}>{children}</div>
    </div>
  );
}

function Sparkline({ data, color='#1a3a6b', height=60, lang = 'fr' }) {  // ✅ Ajout du paramètre 
  const ref=useRef(null);
  const [w,setW]=useState(200);
  useEffect(()=>{ if(ref.current)setW(ref.current.offsetWidth||200); },[]);
  if(!data||data.length<2) return <div ref={ref} style={{ display:'flex',alignItems:'center',justifyContent:'center',height,color:'#94a3b8',fontSize:12 }}>{lang === 'fr' ? 'Données insuffisantes' : 'Insufficient data'}</div>;
  const min=Math.min(...data),max=Math.max(...data),range=max-min||1,pad=6;
  const pts=data.map((v,i)=>`${pad+(i/(data.length-1))*(w-pad*2)},${height-pad-((v-min)/range)*(height-pad*2)}`).join(' ');
  const area=`${pts} ${pad+(data.length-1)/(data.length-1)*(w-pad*2)},${height} ${pad},${height}`;
  return (
    <div ref={ref} style={{ width:'100%' }}>
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
        <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        <polyline points={area} fill="url(#sg)" stroke="none"/>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {data.map((v,i)=>{ const x=pad+(i/(data.length-1))*(w-pad*2); const y=height-pad-((v-min)/range)*(height-pad*2); return <g key={i}><circle cx={x} cy={y} r="5" fill={color}/><circle cx={x} cy={y} r="2.5" fill="#f5a623"/><text x={x} y={y-9} textAnchor="middle" fontSize="9" fill="#64748b">{v}</text></g>; })}
      </svg>
    </div>
  );
}

function SkillRadar({ skills }) {
  const cx=80,cy=80,r=58,n=skills.length;
  const toXY=(i,pct)=>{ const angle=(i/n)*Math.PI*2-Math.PI/2,dist=(pct/100)*r; return [cx+Math.cos(angle)*dist,cy+Math.sin(angle)*dist]; };
  const innerPts=skills.map((s,i)=>toXY(i,s.value).join(',')).join(' ');
  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      {[20,40,60,80,100].map(p=><polygon key={p} points={skills.map((_,i)=>toXY(i,p).join(',')).join(' ')} fill="none" stroke="#e2e8f0" strokeWidth="0.8"/>)}
      {skills.map((_,i)=>{ const [x,y]=toXY(i,100); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="0.8"/>; })}
      <polygon points={innerPts} fill="rgba(26,58,107,0.12)" stroke="#1a3a6b" strokeWidth="1.5"/>
      {skills.map((s,i)=>{ const [x,y]=toXY(i,s.value); return <circle key={i} cx={x} cy={y} r="4" fill="#f5a623" stroke="#1a3a6b" strokeWidth="1"/>; })}
      {skills.map((s,i)=>{ const [x,y]=toXY(i,118); return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="600" fill="#475569" fontFamily="system-ui">{s.label}</text>; })}
    </svg>
  );
}

/* ─── ACTIVITY HEATMAP ────────────────────────────────────────────────────── */
function ActivityHeatmap({ activities }) {
  const { lang } = useT();
  const weeks=18,today=new Date();
  const actMap={};
  activities.forEach(a=>{ actMap[a.date]=(actMap[a.date]||0)+1; });
  const cells=[];
  for(let w=weeks-1;w>=0;w--){
    const week=[];
    for(let d=0;d<7;d++){
      const date=new Date(today); date.setDate(today.getDate()-w*7-(6-d));
      const key=date.toISOString().split('T')[0];
      week.push({key,count:actMap[key]||0,isToday:key===today.toISOString().split('T')[0]});
    }
    cells.push(week);
  }
  const colorFor=n=>n===0?'#f1f5f9':n===1?'#bfdbfe':n===2?'#3b82f6':'#1a3a6b';
  return (
    <div>
      <div style={{ display:'flex',gap:3,overflowX:'auto' }}>
        {cells.map((week,wi)=>(
          <div key={wi} style={{ display:'flex',flexDirection:'column',gap:3 }}>
            {week.map(cell=><div key={cell.key} title={`${cell.key} · ${cell.count} ${lang === 'fr' ? 'action' : 'action'}${cell.count>1?(lang === 'fr' ? 's' : 's'):''}`} style={{ width:11,height:11,borderRadius:2,background:colorFor(cell.count),border:cell.isToday?'1.5px solid #f5a623':'none',flexShrink:0 }}/>)}
          </div>
        ))}
      </div>
      <div style={{ display:'flex',alignItems:'center',gap:4,marginTop:8,justifyContent:'flex-end' }}>
        <span style={{ fontSize:9,color:'#94a3b8' }}>{lang === 'fr' ? 'Moins' : 'Less'}</span>
        {['#f1f5f9','#bfdbfe','#3b82f6','#1a3a6b'].map((c,i)=><div key={i} style={{ width:9,height:9,borderRadius:2,background:c }}/>)}
        <span style={{ fontSize:9,color:'#94a3b8' }}>{lang === 'fr' ? 'Plus' : 'More'}</span>
      </div>
    </div>
  );
}

/* ─── TODAY BLOCK (traduit) ───────────────────────────────────────────────── */
function TodayBlock({ roadmap, deadlines, scores, setView }) {
  const { lang } = useT();
  const today = new Date();
  const items = [];
  
  deadlines.slice(0, 2).forEach(d => {
    const diff = Math.round((d.deadline - today) / 86400000);
    if (diff >= 0 && diff <= 7) {
      items.push({ 
        icon: '⚡', 
        color: '#dc2626', 
        bg: '#fef2f2', 
        text: `${lang === 'fr' ? 'Deadline' : 'Deadline'}: ${d.nom}`, 
        sub: `${lang === 'fr' ? 'Dans' : 'In'} ${diff}${lang === 'fr' ? 'j' : 'd'}`, 
        action: () => setView('roadmap') 
      });
    }
  });
  
  const nextRm = roadmap.find(r => !isItemDone(r) && getProgress(r) > 0);
  if (nextRm) {
    items.push({ 
      icon: '📋', 
      color: '#2563eb', 
      bg: '#eff6ff', 
      text: `${lang === 'fr' ? 'Avancer' : 'Continue'}: ${nextRm.nom}`, 
      sub: `${lang === 'fr' ? 'Étape' : 'Step'} ${getProgress(nextRm)}/${getTotal(nextRm)}`, 
      action: () => setView('roadmap') 
    });
  }
  
  if (scores.length === 0) {
    items.push({ 
      icon: '🎙️', 
      color: '#166534', 
      bg: '#f0fdf4', 
      text: lang === 'fr' ? 'Ton 1er entretien IA' : 'Your 1st AI interview', 
      sub: lang === 'fr' ? '15 min · Booste ton profil' : '15 min · Boost your profile', 
      action: () => setView('entretien') 
    });
  } else if (scores.length < 3) {
    items.push({ 
      icon: '🎙️', 
      color: '#166534', 
      bg: '#f0fdf4', 
      text: `${lang === 'fr' ? 'Entretien' : 'Interview'} #${scores.length + 1}`, 
      sub: `${lang === 'fr' ? 'Dernier' : 'Last'}: ${scores[0]?.scoreNum||'?'}/100`, 
      action: () => setView('entretien') 
    });
  }
  
  if (items.length === 0) {
    items.push({ 
      icon: '✅', 
      color: '#166534', 
      bg: '#f0fdf4', 
      text: lang === 'fr' ? 'Tout est à jour !' : 'All up to date!', 
      sub: lang === 'fr' ? 'Continue comme ça 💪' : 'Keep it up 💪' 
    });
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.slice(0, 3).map((item, i) => (
        <div 
          key={i} 
          onClick={item.action}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            padding: '10px 12px', 
            borderRadius: 8,
            background: item.bg, 
            border: `1px solid ${item.color}25`, 
            cursor: item.action ? 'pointer' : 'default',
            transition: 'transform 0.15s' 
          }}
          onMouseEnter={e => item.action && (e.currentTarget.style.transform = 'translateX(3px)')}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
        >
          <div style={{ 
            width: 34, 
            height: 34, 
            borderRadius: 8, 
            background: item.color + '18', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: 16, 
            flexShrink: 0 
          }}>
            {item.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontSize: 12, 
              fontWeight: 700, 
              color: item.color, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              {item.text}
            </div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{item.sub}</div>
          </div>
          {item.action && <span style={{ fontSize: 14, color: item.color + '80' }}>›</span>}
        </div>
      ))}
    </div>
  );
}

/* ─── STREAK WIDGET (traduit) ────────────────────────────────────────────── */
function StreakWidget({ activities }) {
  const { lang } = useT();
  const today = new Date();
  let streak = 0;
  
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const k = d.toISOString().split('T')[0];
    if (activities.some(a => a.date === k)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  
  const days = lang === 'fr' ? ['D', 'L', 'M', 'M', 'J', 'V', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weekDays = [];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const k = d.toISOString().split('T')[0];
    const active = activities.some(a => a.date === k);
    const isToday = i === 6;
    weekDays.push({ day: days[d.getDay()], active, isToday, date: k });
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#1a3a6b', lineHeight: 1 }}>{streak}</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>
            {lang === 'fr' ? 'jours consécutifs' : 'days streak'}
          </div>
        </div>
        <div style={{ fontSize: 34 }}>
          {streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '💤'}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 3 }}>
        {weekDays.map((day, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ 
              width: '100%', 
              aspectRatio: '1', 
              borderRadius: 5,
              background: day.active ? '#1a3a6b' : '#f1f5f9',
              border: day.isToday ? '2px solid #f5a623' : 'none',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              {day.active && <span style={{ fontSize: 8, color: '#fff' }}>✓</span>}
            </div>
            <span style={{ fontSize: 7, color: '#94a3b8' }}>{day.day}</span>
          </div>
        ))}
      </div>
      
      {streak >= 3 && (
        <div style={{ 
          padding: '6px 10px', 
          borderRadius: 6, 
          background: streak >= 7 ? '#fff8e1' : '#eff6ff',
          border: `1px solid ${streak >= 7 ? '#fde68a' : '#bfdbfe'}`,
          fontSize: 10, 
          color: streak >= 7 ? '#856404' : '#1a3a6b',
          textAlign: 'center', 
          fontWeight: 600 
        }}>
          {streak >= 7 
            ? (lang === 'fr' ? `🔥 Série de ${streak} jours !` : `🔥 ${streak}-day streak!`) 
            : (lang === 'fr' ? `⚡ ${streak} jours de suite` : `⚡ ${streak} days in a row`)}
        </div>
      )}
    </div>
  );
}

/* ─── MINI BAR CHART ─────────────────────────────────────────────────────── */
function MiniBarChart({ data, color = '#1a3a6b', height = 48 }) {
  const max = Math.max(...data.map(d => d.val), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ 
            width: '100%', 
            height: Math.max(3, Math.round((d.val / max) * height * 0.85)),
            background: d.val > 0 ? color : '#f1f5f9', 
            borderRadius: '3px 3px 0 0',
            transition: 'height 0.6s ease', 
            opacity: 0.7 + (d.val / max) * 0.3 
          }}/>
          <span style={{ fontSize: 8, color: '#94a3b8', whiteSpace: 'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── SMART TIPS (traduit) ───────────────────────────────────────────────── */
function SmartTips({ user, scores, roadmap, urgentDeadlines, setView }) {
  const { lang } = useT();
  const [currentTip, setCurrentTip] = useState(0);
  const [fade, setFade] = useState(true);
  
  const getTipsByPriority = useMemo(() => {
    const tips = { urgent: [], medium: [], low: [] };
    
    if (urgentDeadlines.length > 0) {
      tips.urgent.push({
        id: 'deadline',
        icon: '⚡',
        title: `${urgentDeadlines.length} ${lang === 'fr' ? 'deadline' : 'deadline'}${urgentDeadlines.length > 1 ? (lang === 'fr' ? 's urgente' : 's urgent') : (lang === 'fr' ? ' urgente' : ' urgent')}`,
        description: `${urgentDeadlines.slice(0, 2).map(d => d.nom).join(', ')} ${lang === 'fr' ? 'à rendre sous' : 'due in'} ${Math.min(...urgentDeadlines.map(d => Math.round((d.deadline - new Date()) / 86400000)))}${lang === 'fr' ? 'j' : 'd'}`,
        action: lang === 'fr' ? 'Voir les deadlines' : 'View deadlines',
        view: 'roadmap',
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca'
      });
    }
    
    if (!user?.motivationSummary) {
      tips.medium.push({
        id: 'motivation',
        icon: '✍️',
        title: lang === 'fr' ? 'Lettre de motivation manquante' : 'Missing motivation letter',
        description: lang === 'fr' 
          ? 'C\'est souvent le 1er critère des jurys. Rédige une lettre personnalisée pour chaque bourse.'
          : 'This is often the #1 criterion for juries. Write a personalized letter for each scholarship.',
        action: lang === 'fr' ? 'Rédiger ma lettre' : 'Write my letter',
        view: 'profil',
        color: '#7c3aed',
        bg: '#f5f3ff',
        border: '#ddd6fe'
      });
    }
    
    if (!user?.gpa) {
      tips.medium.push({
        id: 'gpa',
        icon: '🎓',
        title: lang === 'fr' ? 'Moyenne académique non renseignée' : 'Academic GPA not set',
        description: lang === 'fr' 
          ? 'Ta moyenne est un critère clé pour l\'éligibilité aux bourses.'
          : 'Your GPA is a key criterion for scholarship eligibility.',
        action: lang === 'fr' ? 'Ajouter ma moyenne' : 'Add my GPA',
        view: 'profil',
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a'
      });
    }
    
    if (!user?.languages || user.languages.length === 0) {
      tips.medium.push({
        id: 'languages',
        icon: '🌍',
        title: lang === 'fr' ? 'Ajoute tes langues' : 'Add your languages',
        description: lang === 'fr' 
          ? 'Les bourses internationales exigent souvent B2 en anglais.'
          : 'International scholarships often require B2 level in English.',
        action: lang === 'fr' ? 'Ajouter mes langues' : 'Add my languages',
        view: 'profil',
        color: '#0891b2',
        bg: '#ecfeff',
        border: '#a5f3fc'
      });
    }
    
    if (scores.length === 0) {
      tips.medium.push({
        id: 'interview',
        icon: '🎙️',
        title: lang === 'fr' ? 'Prépare tes entretiens' : 'Prepare your interviews',
        description: lang === 'fr' 
          ? 'Les candidats qui s\'entraînent obtiennent 23% de meilleures évaluations.'
          : 'Candidates who practice get 23% better evaluations on average.',
        action: lang === 'fr' ? 'Démarrer un entretien' : 'Start an interview',
        view: 'entretien',
        color: '#166534',
        bg: '#f0fdf4',
        border: '#bbf7d0'
      });
    } else if (scores.length < 3) {
      tips.medium.push({
        id: 'interview-more',
        icon: '🎙️',
        title: `${lang === 'fr' ? 'Entretien' : 'Interview'} #${scores.length + 1}`,
        description: lang === 'fr' 
          ? `Ton dernier score: ${scores[0]?.scoreNum || '?'}/100. Continue à t'entraîner !`
          : `Your last score: ${scores[0]?.scoreNum || '?'}/100. Keep practicing!`,
        action: lang === 'fr' ? 'Nouvel entretien' : 'New interview',
        view: 'entretien',
        color: '#2563eb',
        bg: '#eff6ff',
        border: '#bfdbfe'
      });
    }
    
    if (roadmap.length === 0) {
      tips.medium.push({
        id: 'roadmap-empty',
        icon: '📋',
        title: lang === 'fr' ? 'Crée ta roadmap' : 'Create your roadmap',
        description: lang === 'fr' 
          ? 'Ajoute des bourses à ta roadmap pour suivre tes candidatures.'
          : 'Add scholarships to your roadmap to track your applications.',
        action: lang === 'fr' ? 'Explorer les bourses' : 'Explore scholarships',
        view: 'bourses',
        color: '#1a3a6b',
        bg: '#eff6ff',
        border: '#bfdbfe'
      });
    }
    
    if (tips.urgent.length === 0 && tips.medium.length < 3) {
      tips.low.push({
        id: 'star-method',
        icon: '🗣️',
        title: lang === 'fr' ? 'Méthode STAR' : 'STAR Method',
        description: lang === 'fr' 
          ? 'Structure tes réponses: Situation → Tâche → Action → Résultat.'
          : 'Structure your answers: Situation → Task → Action → Result.',
        action: null,
        color: '#475569',
        bg: '#f8fafc',
        border: '#e2e8f0'
      });
      
      tips.low.push({
        id: 'recommendations',
        icon: '⏰',
        title: lang === 'fr' ? 'Lettres de recommandation' : 'Recommendation letters',
        description: lang === 'fr' 
          ? 'Demande-les au moins 6 semaines à l\'avance.'
          : 'Request them at least 6 weeks in advance.',
        action: null,
        color: '#7c3aed',
        bg: '#f5f3ff',
        border: '#ddd6fe'
      });
      
      tips.low.push({
        id: 'countries',
        icon: '🗺️',
        title: lang === 'fr' ? 'Diversifie tes cibles' : 'Diversify your targets',
        description: lang === 'fr' 
          ? 'Ne te limite pas à un seul pays. Regarde l\'Allemagne, les Pays-Bas, la Suisse.'
          : 'Don\'t limit yourself to one country. Check Germany, Netherlands, Switzerland.',
        action: lang === 'fr' ? 'Voir la carte' : 'View map',
        view: 'dashboard',
        color: '#0891b2',
        bg: '#ecfeff',
        border: '#a5f3fc'
      });
    }
    
    return [...tips.urgent, ...tips.medium, ...tips.low];
  }, [user, scores, roadmap, urgentDeadlines, lang]);
  
  useEffect(() => {
    if (getTipsByPriority.length <= 1) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentTip(i => (i + 1) % getTipsByPriority.length);
        setFade(true);
      }, 250);
    }, 6000);
    return () => clearInterval(interval);
  }, [getTipsByPriority.length]);
  
  const tip = getTipsByPriority[currentTip] || getTipsByPriority[0];
  if (!tip) return null;
  
  return (
    <div style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.25s ease' }}>
      <div style={{ 
        padding: '16px', 
        background: tip.bg, 
        border: `1px solid ${tip.border}`, 
        borderRadius: 12, 
        borderLeft: `4px solid ${tip.color}`,
        transition: 'all 0.2s'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 10, 
            background: `${tip.color}15`, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: 20, 
            flexShrink: 0 
          }}>
            {tip.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: tip.color, marginBottom: 6 }}>
              {tip.title}
            </div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>
              {tip.description}
            </div>
            {tip.action && tip.view && (
              <button 
                onClick={() => setView(tip.view)}
                style={{ 
                  marginTop: 10, 
                  padding: '6px 14px', 
                  borderRadius: 6, 
                  background: tip.color, 
                  color: '#fff', 
                  border: 'none', 
                  fontSize: 11, 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {tip.action} →
              </button>
            )}
          </div>
        </div>
      </div>
      
      {getTipsByPriority.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'center' }}>
          {getTipsByPriority.map((_, i) => (
            <div 
              key={i} 
              onClick={() => {
                setFade(false);
                setTimeout(() => {
                  setCurrentTip(i);
                  setFade(true);
                }, 200);
              }}
              style={{ 
                width: i === currentTip ? 20 : 6, 
                height: 4, 
                borderRadius: 3, 
                background: i === currentTip ? tip.color : '#e2e8f0', 
                transition: 'all 0.2s', 
                cursor: 'pointer' 
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── PROFILE STRENGTH (traduit) ─────────────────────────────────────────── */
function ProfileStrength({ user, scores, setView }) {
  const { lang } = useT();
  
  const PROFILE_SECTIONS = useMemo(() => [
    { label: lang === 'fr' ? 'Informations de base' : 'Basic info', pct: ['name', 'email', 'phone', 'nationality'].filter(f => user?.[f]).length / 4 * 100, color: '#166534', icon: '👤' },
    { label: lang === 'fr' ? 'Formation académique' : 'Academic education', pct: ['currentLevel', 'fieldOfStudy', 'institution', 'gpa'].filter(f => user?.[f]).length / 4 * 100, color: '#2563eb', icon: '🎓' },
    { label: lang === 'fr' ? 'Expériences & projets' : 'Experience & projects', pct: Math.min(100, ((user?.workExperience?.length || 0) * 25) + ((user?.academicProjects?.length || 0) * 25)), color: '#d97706', icon: '💼' },
    { label: lang === 'fr' ? 'Compétences & langues' : 'Skills & languages', pct: Math.min(100, ((user?.languages?.length || 0) * 33) + ((user?.skills?.length || 0) * 33)), color: '#7c3aed', icon: '🌍' },
    { label: lang === 'fr' ? 'Entretiens simulés' : 'Mock interviews', pct: Math.min(100, (scores?.length || 0) * 33), color: '#f43f5e', icon: '🎙️' },
    { label: lang === 'fr' ? 'Objectifs définis' : 'Goals defined', pct: (['targetDegree', 'motivationSummary'].filter(f => user?.[f]).length / 2 * 100) + (user?.targetCountries?.length > 0 ? 50 : 0), color: '#0891b2', icon: '🎯' },
  ], [user, scores, lang]);

  const completion = useMemo(() => Math.round(PROFILE_SECTIONS.reduce((s, p) => s + p.pct, 0) / PROFILE_SECTIONS.length), [PROFILE_SECTIONS]);

  const gradeInfo = completion >= 80 ? { label: lang === 'fr' ? 'Excellent' : 'Excellent', color: '#166534', icon: '🏆' } :
                     completion >= 60 ? { label: lang === 'fr' ? 'Bon' : 'Good', color: '#2563eb', icon: '👍' } :
                     completion >= 40 ? { label: lang === 'fr' ? 'En progression' : 'In progress', color: '#d97706', icon: '📈' } :
                     { label: lang === 'fr' ? 'À renforcer' : 'Needs work', color: '#dc2626', icon: '⚠️' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: `2px solid ${gradeInfo.color}20` }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{lang === 'fr' ? 'Score global' : 'Overall score'}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: gradeInfo.color }}>{completion}%</div>
          <div style={{ fontSize: 10, color: gradeInfo.color, marginTop: 2 }}>{gradeInfo.icon} {gradeInfo.label}</div>
        </div>
        <AnimatedRing pct={completion} size={50} strokeWidth={5} color={gradeInfo.color}>
          <span style={{ fontSize: 12, fontWeight: 800, color: gradeInfo.color }}>{completion}%</span>
        </AnimatedRing>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PROFILE_SECTIONS.map((section, idx) => (
          <div key={idx}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 12 }}>{section.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#1e2937' }}>{section.label}</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: section.color }}>{Math.round(section.pct)}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${section.pct}%`, background: section.color, borderRadius: 99, transition: 'width 0.8s ease' }} />
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setView('profil')} style={{ ...S.btnPrimary, width: '100%', marginTop: 14, fontSize: 11, padding: '8px' }}>
        {completion < 60 
          ? (lang === 'fr' ? '📝 Compléter mon profil' : '📝 Complete my profile') 
          : (lang === 'fr' ? '✨ Améliorer mon dossier' : '✨ Improve my profile')} →
      </button>
    </div>
  );
}

/* ─── CHECKLIST WIDGET (traduit) ─────────────────────────────────────────── */
function ChecklistWidget({ user, roadmap, setRoadmap }) {
  const { lang } = useT();
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(false);

  const getEtapeLabel = (item, stepIndex) => {
    const etapes = Array.isArray(item.etapes)
      ? item.etapes
      : (typeof item.etapes === 'string' ? (() => { try { return JSON.parse(item.etapes); } catch { return []; } })() : []);
    if (etapes[stepIndex]) {
      return etapes[stepIndex].titre || etapes[stepIndex].title || etapes[stepIndex].nom || `${lang === 'fr' ? 'Étape' : 'Step'} ${stepIndex + 1}`;
    }
    const fallbacksFR = ['🔍 Recherche','📄 Documents','✍️ Lettre Motiv.','📤 Soumission','🏆 Résultat','✅ Étape 6','✅ Étape 7','✅ Étape 8'];
    const fallbacksEN = ['🔍 Research','📄 Documents','✍️ Motivation Letter','📤 Submission','🏆 Result','✅ Step 6','✅ Step 7','✅ Step 8'];
    const fallbacks = lang === 'fr' ? fallbacksFR : fallbacksEN;
    return fallbacks[stepIndex] || `${lang === 'fr' ? 'Étape' : 'Step'} ${stepIndex + 1}`;
  };

  const totalSteps = roadmap.reduce((s, item) => s + getTotal(item), 0);
  const completedSteps = roadmap.reduce((s, item) => s + getProgress(item), 0);
  const pct = totalSteps > 0 ? Math.round(Math.min((completedSteps / totalSteps) * 100, 100)) : 0;
  const terminees = roadmap.filter(r => isItemDone(r)).length;
  const enCours   = roadmap.filter(r => { const p = getProgress(r); return p > 0 && !isItemDone(r); }).length;

  const advanceStep = async (item) => {
    const step  = item.etapeCourante || 0;
    const total = getTotal(item);
    if (step >= total - 1) return;
    const newStep = step + 1;
    try {
      await axiosInstance.patch(API_ROUTES.roadmap.update(item.id), {
        etapeCourante: newStep,
        statut: newStep >= total ? 'terminé' : 'en_cours',
      });
      setRoadmap(prev => prev.map(r =>
        r.id === item.id ? { ...r, etapeCourante: newStep, statut: newStep >= total ? (lang === 'fr' ? 'terminé' : 'completed') : (lang === 'fr' ? 'en_cours' : 'in_progress') } : r
      ));
    } catch (e) { console.error(e); }
  };

  const resetItem = async (item) => {
    try {
      await axiosInstance.patch(API_ROUTES.roadmap.update(item.id), { etapeCourante: 0, statut: lang === 'fr' ? 'en_cours' : 'in_progress' });
      setRoadmap(prev => prev.map(r => r.id === item.id ? { ...r, etapeCourante: 0, statut: lang === 'fr' ? 'en_cours' : 'in_progress' } : r));
    } catch (e) { console.error(e); }
  };

  const addToRoadmap = async () => {
    if (!newText.trim() || !user?.id) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post(API_ROUTES.roadmap.create, {
        userId: user.id, userEmail: user.email || '',
        nom: newText.trim(), pays: lang === 'fr' ? 'À définir' : 'To be defined',
        statut: lang === 'fr' ? 'en_cours' : 'in_progress', etapeCourante: 0,
        ajouteLe: new Date().toISOString(),
        dateLimite: null, lienOfficiel: '', financement: '',
      });
      setRoadmap(prev => [...prev, res.data?.doc || res.data]);
      setNewText('');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
          <span style={{ fontSize:11, color:'#64748b' }}>
            <span style={{ color:'#166534', fontWeight:700 }}>{terminees}</span> {lang === 'fr' ? `terminée${terminees>1?'s':''}` : `completed${terminees>1?'':' (s)'}`} ·{' '}
            <span style={{ color:'#2563eb', fontWeight:700 }}>{enCours}</span> {lang === 'fr' ? 'en cours' : 'in progress'} ·{' '}
            <span style={{ color:'#94a3b8', fontWeight:700 }}>{roadmap.length-terminees-enCours}</span> {lang === 'fr' ? `non commencée${roadmap.length-terminees-enCours>1?'s':''}` : 'not started'}
          </span>
          <span style={{ fontSize:11, fontWeight:800, color:pct>=80?'#166534':pct>=50?'#d97706':'#1a3a6b' }}>{pct}%</span>
        </div>
        <div style={{ height:7, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, transition:'width 0.6s ease',
            background:pct>=80?'#166534':pct>=50?'#d97706':'#1a3a6b' }}/>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:260, overflowY:'auto' }}>
        {roadmap.length === 0 ? (
          <div style={{ color:'#94a3b8', fontSize:12, textAlign:'center', padding:'20px 16px',
            background:'#f8fafc', borderRadius:8, border:'1px dashed #e2e8f0', lineHeight:1.6 }}>
            {lang === 'fr' 
              ? 'Ajoute ta première bourse ci-dessous\npour commencer à suivre ta progression'
              : 'Add your first scholarship below\nto start tracking your progress'}
          </div>
        ) : roadmap.map(item => {
          const total    = getTotal(item);
          const progress = getProgress(item);
          const done     = isItemDone(item);
          const pctItem  = Math.round((progress / total) * 100);

          return (
            <div key={item.id} style={{
              padding:'10px 12px', borderRadius:8,
              background: done ? '#f0fdf4' : progress > 0 ? '#eff6ff' : '#f8fafc',
              border: `1px solid ${done ? '#86efac' : progress > 0 ? '#bfdbfe' : '#e2e8f0'}`,
              transition:'all 0.2s',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:22, height:22, borderRadius:6, flexShrink:0,
                  border:`2px solid ${done?'#166534':progress>0?'#2563eb':'#e2e8f0'}`,
                  background:done?'#166534':'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {done
                    ? <span style={{ color:'#fff', fontSize:12 }}>✓</span>
                    : progress > 0
                      ? <span style={{ color:'#2563eb', fontSize:9, fontWeight:800 }}>{progress}/{total}</span>
                      : null}
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600,
                    color: done ? '#166534' : '#1e2937',
                    textDecoration: done ? 'line-through' : 'none',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {item.nom}
                  </div>
                  <div style={{ fontSize:10, color:'#64748b', marginTop:1 }}>
                    {item.pays && item.pays !== (lang === 'fr' ? 'À définir' : 'To be defined') ? `${item.pays} · ` : ''}
                    {done
                      ? <span style={{ color:'#166534', fontWeight:600 }}>{lang === 'fr' ? '✅ Terminée' : '✅ Completed'} ({total} {lang === 'fr' ? 'étapes' : 'steps'})</span>
                      : progress > 0
                        ? <span style={{ color:'#2563eb' }}>
                            {lang === 'fr' ? 'Étape' : 'Step'} {progress}/{total} : {getEtapeLabel(item, (item.etapeCourante||0))}
                          </span>
                        : <span style={{ color:'#94a3b8' }}>{lang === 'fr' ? 'Non commencée' : 'Not started'} · {total} {lang === 'fr' ? 'étapes' : 'steps'}</span>}
                  </div>
                </div>

                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  {!done && (
                    <button onClick={() => advanceStep(item)}
                      style={{ padding:'3px 9px', borderRadius:4, background:'#eff6ff',
                        border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:11, cursor:'pointer', fontWeight:700 }}>
                      +1
                    </button>
                  )}
                  {done && (
                    <button onClick={() => resetItem(item)} title={lang === 'fr' ? 'Réinitialiser' : 'Reset'}
                      style={{ padding:'3px 9px', borderRadius:4, background:'#f1f5f9',
                        border:'1px solid #e2e8f0', color:'#94a3b8', fontSize:11, cursor:'pointer' }}>
                      ↺
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginTop:7, height:4, background:'#e2e8f0', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pctItem}%`, borderRadius:99,
                  background:done?'#166534':'#2563eb', transition:'width 0.4s ease' }}/>
              </div>

              {!done && (
                <div style={{ display:'flex', gap:2, marginTop:5 }}>
                  {Array.from({ length: total }).map((_, i) => (
                    <div key={i} title={getEtapeLabel(item, i)}
                      style={{ flex:1, height:3, borderRadius:2,
                        background: i < progress ? '#2563eb' : '#f1f5f9',
                        transition:'background 0.3s',
                        minWidth:4 }}/>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display:'flex', gap:7, marginTop:12 }}>
        <input value={newText} onChange={e=>setNewText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addToRoadmap()}
          placeholder={lang === 'fr' ? 'Nom bourse (ex: Eiffel, DAAD, Erasmus...)' : 'Scholarship name (ex: Eiffel, DAAD, Erasmus...)'}
          style={{ flex:1, padding:'9px 12px', borderRadius:7, border:'1.5px solid #e2e8f0',
            fontSize:12, background:'#f8fafc', outline:'none', fontFamily:'inherit' }}
          disabled={loading}/>
        <button onClick={addToRoadmap} disabled={loading||!newText.trim()}
          style={{ padding:'9px 16px', borderRadius:7, background:'#1a3a6b', color:'#fff',
            border:'none', fontSize:13, fontWeight:700,
            cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
          {loading?'…':'+'}
        </button>
      </div>
    </div>
  );
}

/* ─── CALENDRIER (traduit) ───────────────────────────────────────────────── */
function Calendrier({ deadlines, onSelectBourse }) {
  const { lang } = useT();
  const today=new Date();
  const [view,setView]=useState({month:today.getMonth(),year:today.getFullYear()});
  const MONTHS = lang === 'fr' 
    ? ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
    : ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS = lang === 'fr' ? ['Lu','Ma','Me','Je','Ve','Sa','Di'] : ['Mo','Tu','We','Th','Fr','Sa','Su'];
  const deadlineMap={};
  deadlines.forEach(b=>{ if(!b.deadline)return; const d=new Date(b.deadline); const k=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; if(!deadlineMap[k])deadlineMap[k]=[]; deadlineMap[k].push(b); });
  const daysInMonth=new Date(view.year,view.month+1,0).getDate();
  const firstDay=(new Date(view.year,view.month,1).getDay()+6)%7;
  const diffColor=diff=>diff<0?'#dc2626':diff<=7?'#d97706':diff<=30?'#2563eb':'#166534';
  const cells=[]; for(let i=0;i<firstDay;i++)cells.push(null); for(let d=1;d<=daysInMonth;d++)cells.push(d);
  const prev=()=>setView(v=>({month:v.month===0?11:v.month-1,year:v.month===0?v.year-1:v.year}));
  const next=()=>setView(v=>({month:v.month===11?0:v.month+1,year:v.month===11?v.year+1:v.year}));
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', gap:5 }}><button onClick={()=>setView(v=>({...v,year:v.year-1}))} style={S.iconBtn}>«</button><button onClick={prev} style={S.navBtn}>‹</button></div>
        <div style={{ display:'flex', gap:8 }}>
          <select value={view.month} onChange={e=>setView(v=>({...v,month:parseInt(e.target.value)}))} style={{ fontSize:12,padding:'5px 8px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',color:'#1a3a6b' }}>
            {MONTHS.map((m,i)=><option key={m} value={i}>{m}</option>)}
          </select>
          <input type="number" value={view.year} onChange={e=>setView(v=>({...v,year:parseInt(e.target.value||0)}))} style={{ width:72,fontSize:12,padding:'5px 8px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff' }}/>
        </div>
        <div style={{ display:'flex', gap:5 }}><button onClick={next} style={S.navBtn}>›</button><button onClick={()=>setView(v=>({...v,year:v.year+1}))} style={S.iconBtn}>»</button><button onClick={()=>setView({month:today.getMonth(),year:today.getFullYear()})} style={S.btnXs}>{lang === 'fr' ? 'Auj.' : 'Today'}</button></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
        {DAYS.map(d=><div key={d} style={{ textAlign:'center', fontSize:9, color:'#94a3b8', fontWeight:700 }}>{d}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {cells.map((day,i)=>{
          if(!day) return <div key={`e${i}`}/>;
          const isToday=day===today.getDate()&&view.month===today.getMonth()&&view.year===today.getFullYear();
          const k=`${view.year}-${view.month}-${day}`;
          const dl=deadlineMap[k];
          const diff=dl?Math.round((new Date(view.year,view.month,day)-today)/86400000):null;
          const col=diff!==null?diffColor(diff):null;
          return (
            <div key={k} onClick={()=>dl?.[0]&&onSelectBourse(dl[0])}
              style={{ aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', borderRadius:5, fontSize:10, background:isToday?'#1a3a6b':dl?`${col}14`:'transparent', border:isToday?'2px solid #f5a623':dl?`1px solid ${col}50`:'1px solid #f1f5f9', color:isToday?'#fff':dl?col:'#94a3b8', cursor:dl?'pointer':'default', fontWeight:(isToday||dl)?700:400, padding:'2px', overflow:'hidden' }}>
              <span style={{ flexShrink:0 }}>{day}</span>
              {dl&&<div style={{ width:'100%', display:'flex', flexDirection:'column', gap:2, marginTop:2 }}>
                {dl.slice(0,2).map((item,idx2)=>(
                  <div key={idx2} onClick={e=>{e.stopPropagation();onSelectBourse(item);}} title={item.nom}
                    style={{ fontSize:8, padding:'1px 3px', borderRadius:3, background:(item.inRoadmap?'#7c3aed':item.isFavori?'#f5a623':'#2563eb')+'20', color:item.inRoadmap?'#7c3aed':item.isFavori?'#d97706':'#2563eb', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', cursor:'pointer' }}>
                    {item.nom}
                  </div>
                ))}
              </div>}
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', gap:10, marginTop:10, flexWrap:'wrap' }}>
        {[
          ['#dc2626', lang === 'fr' ? 'Expiré' : 'Expired'],
          ['#d97706', lang === 'fr' ? '≤ 7j' : '≤ 7d'],
          ['#2563eb', lang === 'fr' ? '≤ 30j' : '≤ 30d'],
          ['#166534', lang === 'fr' ? 'OK' : 'OK'],
          ['#7c3aed', lang === 'fr' ? 'Roadmap' : 'Roadmap'],
          ['#f5a623', lang === 'fr' ? 'Favori' : 'Favorite']
        ].map(([c,l])=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ width:8, height:8, borderRadius:2, background:c }}/><span style={{ fontSize:9, color:'#64748b' }}>{l}</span></div>
        ))}
      </div>
    </div>
  );
}

/* ─── WORLD MAP (inchangé - tooltips déjà traduits via COUNTRY_META) ─────── */
function WorldMap({ onCountryClick, activeCountry, scholarshipCounts={}, lang = 'fr' }) {  // ✅ Ajout du paramètre
  const containerRef=useRef(null),svgRef=useRef(null),activeCountryRef=useRef(activeCountry);
  const [tooltip,setTooltip]=useState(null),[ready,setReady]=useState(false);
  const normCounts={};
  Object.entries(scholarshipCounts).forEach(([k,v])=>{ if(/^\d+$/.test(k)){normCounts[k]=v;}else{const num=ALPHA2_TO_NUMERIC[k.toUpperCase()];if(num)normCounts[num]=v;} });
  const getAlpha2=id=>NUMERIC_TO_ALPHA2[String(id)]||null;
  const getCount=id=>normCounts[String(id)]||0;
  const colorForCount=n=>n===0?'#1e2a3a':n>=10?'#1a3a6b':n>=7?'#2563eb':n>=4?'#3b82f6':'#93c5fd';
  const strokeForCount=(n,isActive)=>isActive?'#f5a623':n>0?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.06)';
  useEffect(()=>{
    let cancelled=false;
    const loadScripts=()=>new Promise(resolve=>{ if(window.__d3loaded&&window.__topojsonloaded){resolve();return;} const s1=document.createElement('script');s1.src='https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js';s1.onload=()=>{window.__d3loaded=true;const s2=document.createElement('script');s2.src='https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';s2.onload=()=>{window.__topojsonloaded=true;resolve();};document.head.appendChild(s2);};document.head.appendChild(s1); });
    const draw=async()=>{
      await loadScripts();if(cancelled||!svgRef.current||!containerRef.current)return;
      const d3=window.d3,topojson=window.topojson;
      const world=await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      if(cancelled||!svgRef.current)return;
      const W=containerRef.current.getBoundingClientRect().width||800,H=Math.round(W*0.52);
      const svg=d3.select(svgRef.current);svg.selectAll('*').remove();
      svg.attr('viewBox',`0 0 ${W} ${H}`).attr('width','100%').attr('height',H);
      const proj=d3.geoMercator().scale(W/6.4).translate([W/2,H/1.58]);
      const pathGen=d3.geoPath().projection(proj);
      const features=topojson.feature(world,world.objects.countries).features;
      svg.selectAll('path.country').data(features).join('path').attr('class','country').attr('d',pathGen).attr('data-id',d=>d.id).attr('fill',d=>colorForCount(getCount(d.id))).attr('stroke',d=>strokeForCount(getCount(d.id),false)).attr('stroke-width',0.5).style('cursor',d=>getCount(d.id)>0?'pointer':'default').style('transition','fill 0.18s')
        .on('mouseenter',function(event,d){const a2=getAlpha2(d.id);const n=getCount(d.id);if(!n)return;d3.select(this).attr('fill','#f5a623').attr('stroke','#fff').attr('stroke-width',1.5);const[mx,my]=d3.pointer(event,svgRef.current);setTooltip({x:mx,y:my,code:a2,count:n});})
        .on('mouseleave',function(event,d){const a2=getAlpha2(d.id);const n=getCount(d.id);const isAct=a2===activeCountryRef.current;d3.select(this).attr('fill',isAct?'#f5a623':colorForCount(n)).attr('stroke',strokeForCount(n,isAct)).attr('stroke-width',isAct?1.5:0.5);setTooltip(null);})
        .on('click',function(event,d){const a2=getAlpha2(d.id);if(a2&&getCount(d.id)>0)onCountryClick(a2);});
      svg.append('path').datum(d3.geoGraticule()()).attr('d',pathGen).attr('fill','none').attr('stroke','rgba(255,255,255,0.035)').attr('stroke-width',0.5);
      const tuniXY=proj([9.5375,33.8869]);
      if(tuniXY){const g=svg.append('g');const pc=g.append('circle').attr('cx',tuniXY[0]).attr('cy',tuniXY[1]).attr('r',5).attr('fill','none').attr('stroke','#f43f5e').attr('stroke-width',1.5);pc.append('animate').attr('attributeName','r').attr('from','4').attr('to','16').attr('dur','2s').attr('repeatCount','indefinite');pc.append('animate').attr('attributeName','opacity').attr('from','0.8').attr('to','0').attr('dur','2s').attr('repeatCount','indefinite');g.append('circle').attr('cx',tuniXY[0]).attr('cy',tuniXY[1]).attr('r',4).attr('fill','#f43f5e').attr('stroke','#fff').attr('stroke-width',1.5);g.append('text').attr('x',tuniXY[0]+7).attr('y',tuniXY[1]+3.5).attr('font-size',8.5).attr('font-weight',700).attr('fill','#f43f5e').attr('font-family','system-ui').text('Tunisie');}
      if(!cancelled)setReady(true);
    };
    draw().catch(console.error);return()=>{cancelled=true;};
  },[JSON.stringify(normCounts)]);
  useEffect(()=>{
    activeCountryRef.current=activeCountry;
    if(!svgRef.current||!window.d3)return;
    svgRef.current.querySelectorAll('path.country').forEach(el=>{const numId=el.getAttribute('data-id');const a2=NUMERIC_TO_ALPHA2[numId]||null;const n=normCounts[numId]||0;const isAct=a2===activeCountry;window.d3.select(el).attr('fill',isAct?'#f5a623':colorForCount(n)).attr('stroke',strokeForCount(n,isAct)).attr('stroke-width',isAct?1.5:0.5);});
  },[activeCountry]);
  return (
    <div ref={containerRef} style={{ position:'relative',width:'100%',borderRadius:8,overflow:'hidden' }}>
      <div style={{ position:'absolute',inset:0,background:'linear-gradient(160deg,#050e1c 0%,#0b1e3d 55%,#08172e 100%)',zIndex:0 }}/>
      {!ready&&<div style={{ position:'absolute',inset:0,zIndex:3,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:10 }}><div style={{ width:36,height:36,borderRadius:'50%',border:'3px solid rgba(245,166,35,0.15)',borderTopColor:'#f5a623',animation:'spin 0.8s linear infinite' }}/><span style={{ fontSize:11,color:'rgba(245,166,35,0.6)',fontFamily:'system-ui' }}>{lang === 'fr' ? 'Chargement…' : 'Loading…'}</span></div>}
      <svg ref={svgRef} style={{ position:'relative',zIndex:1,display:'block',width:'100%',border:'1px solid rgba(245,166,35,0.15)',borderRadius:8,opacity:ready?1:0,transition:'opacity 0.5s',minHeight:220 }}/>
      {tooltip&&COUNTRY_META[tooltip.code]&&(<div style={{ position:'absolute',left:Math.min(tooltip.x+14,(containerRef.current?.offsetWidth||500)-150),top:Math.max(tooltip.y-48,8),background:'#060f1e',border:'1px solid rgba(245,166,35,0.55)',borderRadius:7,padding:'7px 11px',pointerEvents:'none',zIndex:20 }}><div style={{ fontSize:12,fontWeight:700,color:'#f5a623',fontFamily:'system-ui' }}>{COUNTRY_META[tooltip.code].flag}&nbsp;{COUNTRY_META[tooltip.code].label}</div><div style={{ fontSize:10,color:'rgba(255,255,255,0.55)',marginTop:2,fontFamily:'system-ui' }}>{tooltip.count} {lang === 'fr' ? 'bourse' : 'scholarship'}{tooltip.count>1?'s':''}</div></div>)}
    </div>
  );
}

/* ─── MAIN DASHBOARD (traduit) ───────────────────────────────────────────── */
export default function DashboardPage({ user, bourses, entretienScores, setView, handleQuickReply, onOpenBourse, messages, input, setInput, loading, chatContainerRef, handleSend }) {
  const { t, lang } = useT();

  const [showLoginModal,setShowLoginModal]=useState(false);
  const [roadmap,setRoadmap]=useState([]);
  const [favorites,setFavorites]=useState([]);
  const [drawerBourse,setDrawerBourse]=useState(null);
  const [appliedNoms,setAppliedNoms]=useState(new Set());
  const [starredNoms,setStarredNoms]=useState(new Set());
  const [showChat,setShowChat]=useState(false);
  const [activeCountry,setActiveCountry]=useState(null);
  const [dataLoading,setDataLoading]=useState(true);
  const [realActivities,setRealActivities]=useState([]);

  useEffect(()=>{
    if(!user?.id){setDataLoading(false);return;}
    axiosInstance.get(API_ROUTES.roadmap.byUser(user.id))
      .then(r=>{const docs=r.data.docs||[];setRoadmap(docs);setAppliedNoms(new Set(docs.map(b=>b.nom?.trim().toLowerCase())));})
      .catch(()=>{}).finally(()=>setDataLoading(false));
  },[user?.id]);

  useEffect(()=>{
    if(!user?.id)return;
    axiosInstance.get(API_ROUTES.favoris.byUser(user.id))
      .then(r=>{const doc=r.data?.docs?.[0]||r.data;const favs=doc?.bourses||[];setFavorites(favs);setStarredNoms(new Set(favs.map(b=>b.nom?.trim().toLowerCase())));})
      .catch(()=>{});
  },[user?.id]);

  useEffect(()=>{
    const acts=[];
    roadmap.forEach(item=>{ if(item.ajouteLe)acts.push({date:item.ajouteLe.split('T')[0],icon:'📋',bg:'#eff6ff',label:item.nom}); });
    (entretienScores||[]).forEach(s=>{ if(s.createdAt)acts.push({date:s.createdAt.split('T')[0],icon:'🎙️',bg:'#f0fdf4',label:`${lang === 'fr' ? 'Entretien' : 'Interview'} · ${s.scoreNum||'?'}/100`}); });
    favorites.forEach(f=>{ if(f.ajouteLe)acts.push({date:f.ajouteLe.split('T')[0],icon:'⭐',bg:'#fffbeb',label:f.nom}); });
    acts.sort((a,b)=>b.date.localeCompare(a.date));
    setRealActivities(acts);
  },[roadmap,entretienScores,favorites,lang]);

  const scholarshipCounts=useMemo(()=>{
    const counts={};(bourses||[]).forEach(b=>{if(!b.pays)return;const code=Object.entries(COUNTRY_META).find(([,m])=>m.label===b.pays)?.[0];if(code)counts[code]=(counts[code]||0)+1;});return counts;
  },[bourses]);

  const roadmapSet=useMemo(()=>new Set((roadmap||[]).map(b=>b.nom?.trim().toLowerCase())),[roadmap]);
  const favoritesSet=useMemo(()=>new Set((favorites||[]).map(b=>b.nom?.trim().toLowerCase())),[favorites]);

  const deadlines=useMemo(()=>(bourses||[]).filter(b=>b.dateLimite).map(b=>({nom:b.nom,deadline:new Date(b.dateLimite),pays:b.pays,isFavori:favoritesSet.has(b.nom?.trim().toLowerCase()),inRoadmap:roadmapSet.has(b.nom?.trim().toLowerCase()),lienOfficiel:b.lienOfficiel,financement:b.financement})).sort((a,b)=>a.deadline-b.deadline),[bourses,favoritesSet,roadmapSet]);

  const roadmapDeadlines=useMemo(()=>deadlines.filter(d=>d.inRoadmap),[deadlines]);
  const urgentDeadlines=useMemo(()=>deadlines.filter(d=>{const diff=Math.round((d.deadline-new Date())/86400000);return diff>=0&&diff<=14;}),[deadlines]);

  const parseScore=txt=>{const m=(txt||'').match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i);return m?parseInt(m[1]):null;};
  const scores=useMemo(()=>(entretienScores||[]).map(s=>({...s,scoreNum:parseScore(s.score)})).filter(s=>s.scoreNum!==null),[entretienScores]);
  const lastScore=scores[0]?.scoreNum??null;
  const avgScore=scores.length>0?Math.round(scores.reduce((a,b)=>a+b.scoreNum,0)/scores.length):null;
  const scoreDiff=scores.length>=2?scores[0].scoreNum-scores[1].scoreNum:null;
  const scoreHistory=useMemo(()=>scores.slice().reverse().map(s=>s.scoreNum),[scores]);

  const PROFILE_SECTIONS=useMemo(()=>[
    {label:lang === 'fr' ? 'Informations de base' : 'Basic info',pct:['name','email','phone','nationality'].filter(f=>user?.[f]).length/4*100,color:'#166534'},
    {label:lang === 'fr' ? 'Formation académique' : 'Academic education',pct:['currentLevel','fieldOfStudy','institution','gpa'].filter(f=>user?.[f]).length/4*100,color:'#2563eb'},
    {label:lang === 'fr' ? 'Expériences & projets' : 'Experience & projects',pct:Math.min(100,((user?.workExperience?.length||0)*25)+((user?.academicProjects?.length||0)*25)),color:'#d97706'},
    {label:lang === 'fr' ? 'Compétences & langues' : 'Skills & languages',pct:Math.min(100,((user?.languages?.length||0)*33)+((user?.skills?.length||0)*33)),color:'#7c3aed'},
    {label:lang === 'fr' ? 'Entretiens simulés' : 'Mock interviews',pct:Math.min(100,scores.length*33),color:'#f43f5e'},
    {label:lang === 'fr' ? 'Objectifs définis' : 'Goals defined',pct:(['targetDegree','motivationSummary'].filter(f=>user?.[f]).length/2*100)+(user?.targetCountries?.length>0?50:0),color:'#0891b2'},
  ],[user,scores,lang]);
  const completion=useMemo(()=>Math.round(PROFILE_SECTIONS.reduce((s,p)=>s+p.pct,0)/PROFILE_SECTIONS.length),[PROFILE_SECTIONS]);

  const skillData=useMemo(()=>{
    if(scores.length===0)return[{label:'Comm.',value:0},{label:'Motiv.',value:0},{label:'Technique',value:0},{label:'Confiance',value:0},{label:'Culture',value:0}];
    const allText=(entretienScores||[]).map(s=>s.score||'').join(' ').toLowerCase();
    const has=words=>words.some(w=>allText.includes(w));
    const base=avgScore||50;
    return[
      {label:'Comm.',value:Math.min(100,Math.round(base*(has(['communication','clair','articulé'])?1.15:0.9)))},
      {label:'Motiv.',value:Math.min(100,Math.round(base*(has(['motivation','passion','enthousiaste'])?1.2:0.95)))},
      {label:'Technique',value:Math.min(100,Math.round(base*(has(['technique','compétence','maîtrise'])?1.1:0.85)))},
      {label:'Confiance',value:Math.min(100,Math.round(base*(has(['confiance','assurance'])?1.15:0.9)))},
      {label:'Culture',value:Math.min(100,Math.round(base*(has(['culture','pays','international'])?1.1:0.88)))},
    ];
  },[scores,avgScore,entretienScores]);

  const roadmapTerminees=useMemo(()=>roadmap.filter(r=>isItemDone(r)).length,[roadmap]);
  const roadmapEnCours=useMemo(()=>roadmap.filter(r=>{const p=getProgress(r);return p>0&&!isItemDone(r);}).length,[roadmap]);

  const recentActivitiesFlux=useMemo(()=>realActivities.slice(0,5).map(a=>({...a,text:a.label,time:new Date(a.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')})),[realActivities,lang]);
  const activeCountryBourses=useMemo(()=>activeCountry?(bourses||[]).filter(b=>b.pays===COUNTRY_META[activeCountry]?.label).slice(0,6):[],[activeCountry,bourses]);

  const streak = useMemo(() => {
    const today = new Date();
    let s = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const k = d.toISOString().split('T')[0];
      if (realActivities.some(a => a.date === k)) s++;
      else if (i > 0) break;
    }
    return s;
  }, [realActivities]);

  const kpiBourses=useAnimatedCounter((bourses||[]).length);
  const kpiRoadmap=useAnimatedCounter(roadmap.length);
  const kpiDeadlines=useAnimatedCounter(deadlines.filter(d=>{const di=Math.round((d.deadline-new Date())/86400000);return di>=0&&di<=30;}).length);
  const kpiScore=useAnimatedCounter(lastScore??0);

  if(!user) return (
    <>
      <div style={S.locked}><div style={S.lockedCard}><div style={{ fontSize:56,marginBottom:16 }}>📊</div><h3 style={{ color:'#1a3a6b',fontWeight:700,fontSize:18,margin:'0 0 8px' }}>{lang === 'fr' ? 'Tableau de bord non disponible' : 'Dashboard unavailable'}</h3><p style={{ color:'#64748b',fontSize:13,lineHeight:1.6,maxWidth:280,textAlign:'center',margin:'0 0 24px' }}>{lang === 'fr' ? 'Connectez-vous pour accéder à votre tableau de bord.' : 'Sign in to access your dashboard.'}</p><button style={S.lockBtn} onClick={()=>setShowLoginModal(true)}>🔐 {lang === 'fr' ? 'Se connecter' : 'Sign in'}</button></div></div>
      {showLoginModal&&<LoginModal onClose={()=>setShowLoginModal(false)}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );

  return (
    <div style={{ width:'100%',background:'#f0f4f9',minHeight:'100vh',fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeSlideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.dash-card{animation:fadeSlideUp 0.4s ease both}.hover-lift{transition:transform 0.2s,box-shadow 0.2s}.hover-lift:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(26,58,107,0.12)!important}`}</style>
      <div style={{ maxWidth:1200,margin:'0 auto',padding:'24px 32px' }}>

        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#1a3a6b', marginBottom:3 }}>
              {lang === 'fr' ? 'Tableau de Bord' : 'Dashboard'}
            </h1>
            <p style={{ fontSize:13, color:'#64748b' }}>
              {lang === 'fr' ? 'Bonjour' : 'Hello'} <strong style={{ color:'#1a3a6b' }}>{user.name||user.email?.split('@')[0]}</strong>, 
              {lang === 'fr' ? ' voici l\'état de vos bourses.' : ' here\'s your scholarships status.'}
            </p>
          </div>
          <button style={S.btnGold} onClick={()=>setView('bourses')}>
            {lang === 'fr' ? 'Explorer Bourses' : 'Explore Scholarships'}
          </button>
        </div>

        {/* TODAY BLOCK */}
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'16px 20px', marginBottom:14, borderLeft:'4px solid #f5a623', boxShadow:'0 2px 8px rgba(26,58,107,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#1a3a6b' }}>
                {lang === 'fr' ? '🌅 Aujourd\'hui — Que faire ?' : '🌅 Today — What to do?'}
              </div>
              <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>
                {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US',{weekday:'long',day:'numeric',month:'long'})}
              </div>
            </div>
            <div style={{ fontSize:11, color:'#94a3b8', background:'#f8fafc', padding:'3px 10px', borderRadius:20, border:'1px solid #e2e8f0' }}>
              {urgentDeadlines.length>0 
                ? `⚡ ${urgentDeadlines.length} ${lang === 'fr' ? 'urgent' : 'urgent'}${urgentDeadlines.length>1?'s':''}` 
                : streak>0 
                  ? `🔥 Streak ${streak}${lang === 'fr' ? 'j' : 'd'}` 
                  : (lang === 'fr' ? '✨ Bonne journée' : '✨ Have a great day')}
            </div>
          </div>
          <TodayBlock roadmap={roadmap} deadlines={deadlines} scores={scores} setView={setView}/>
        </div>

        {/* URGENT BANNER */}
        {urgentDeadlines.length>0&&(
          <div style={{ display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderRadius:8,background:'#fff3cd',border:'1px solid #fde68a',borderLeft:'4px solid #f5a623',marginBottom:20 }}>
            <span style={{ fontSize:18 }}>⚡</span>
            <span style={{ fontSize:12,color:'#856404',flex:1,fontWeight:500 }}>
              <strong>{urgentDeadlines.length} {lang === 'fr' ? 'deadline' : 'deadline'}{urgentDeadlines.length>1?(lang === 'fr' ? 's urgentes' : 's urgent'):(lang === 'fr' ? ' urgente' : ' urgent')} :</strong>{' '}
              {urgentDeadlines.map(d=>`${d.nom} (${Math.round((d.deadline-new Date())/86400000)}${lang === 'fr' ? 'j' : 'd'})`).join(' · ')}
            </span>
            <button onClick={()=>setView('roadmap')} style={{ padding:'5px 12px',borderRadius:4,background:'#1a3a6b',border:'none',color:'#fff',fontSize:12,cursor:'pointer',fontWeight:600 }}>
              {lang === 'fr' ? 'Voir' : 'View'}
            </button>
          </div>
        )}

        {/* KPI CARDS */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20 }}>
          {[
            {label:lang === 'fr' ? 'Bourses disponibles' : 'Available scholarships',val:kpiBourses,icon:'🎓',color:'#1a3a6b',bg:'#eff6ff',trend:`${Object.keys(scholarshipCounts).length} ${lang === 'fr' ? 'pays' : 'countries'}`,trendColor:'#166534'},
            {label:lang === 'fr' ? 'Dans ma roadmap' : 'In my roadmap',val:kpiRoadmap,icon:'📋',color:'#166534',bg:'#f0fdf4',trend:`${roadmapTerminees} ${lang === 'fr' ? `terminée${roadmapTerminees>1?'s':''}` : `completed${roadmapTerminees>1?'':' (s)'}`} · ${roadmapEnCours} ${lang === 'fr' ? 'en cours' : 'in progress'}`,trendColor:'#166534'},
            {label:lang === 'fr' ? 'Deadlines ce mois' : 'Deadlines this month',val:kpiDeadlines,icon:'⏰',color:'#d97706',bg:'#fffbeb',trend:`${urgentDeadlines.length} ${lang === 'fr' ? 'urgente' : 'urgent'}${urgentDeadlines.length>1?'s':''}`,trendColor:urgentDeadlines.length>0?'#dc2626':'#166534'},
            {label:lang === 'fr' ? 'Score entretien' : 'Interview score',val:lastScore!=null?`${kpiScore}/100`:'—',icon:'🎙️',color:'#7c3aed',bg:'#f5f3ff',trend:scoreDiff!=null?`${scoreDiff>0?'+':''}${scoreDiff} vs ${lang === 'fr' ? 'dernier' : 'last'}`:`${scores.length} ${lang === 'fr' ? `simulé${scores.length!==1?'s':''}` : `simulated${scores.length!==1?'':' (s)'}`}`,trendColor:scoreDiff!=null&&scoreDiff>0?'#166534':'#94a3b8'},
          ].map((k,i)=>(
            <div key={i} className="dash-card hover-lift" style={{ background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,padding:'16px 18px',borderTop:`3px solid ${k.color}`,boxShadow:'0 2px 6px rgba(26,58,107,0.06)' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                <div><div style={{ fontSize:10,color:'#64748b',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.04em',fontWeight:600 }}>{k.label}</div><div style={{ fontSize:26,fontWeight:800,color:k.color }}>{k.val}</div><div style={{ fontSize:10,color:k.trendColor,fontWeight:600,marginTop:4 }}>{k.trend}</div></div>
                <div style={{ width:40,height:40,borderRadius:8,background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>{k.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ROW 1: 4 Key Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
          
          {/* Card 1: Smart Tips */}
          <div style={S.card} className="hover-lift">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={S.cardTitle}>💡 {lang === 'fr' ? 'Conseils' : 'Tips'}</div>
              <div style={{ fontSize: 9, color: '#94a3b8', background: '#f8fafc', padding: '2px 8px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                {lang === 'fr' ? 'IA temps réel' : 'Real-time AI'}
              </div>
            </div>
            <SmartTips user={user} scores={scores} roadmap={roadmap} urgentDeadlines={urgentDeadlines} setView={setView}/>
          </div>

          {/* Card 2: Profile Strength */}
          <div style={S.card} className="hover-lift">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={S.cardTitle}>📊 {lang === 'fr' ? 'Force dossier' : 'Profile strength'}</div>
              <button style={S.btnXs} onClick={() => setView('profil')}>→</button>
            </div>
            <ProfileStrength user={user} scores={scores} setView={setView}/>
          </div>

          {/* Card 3: Roadmap */}
          <div style={S.card} className="hover-lift">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={S.cardTitle}>✅ {lang === 'fr' ? 'Roadmap' : 'Roadmap'}</div>
              <button style={S.btnXs} onClick={() => setView('roadmap')}>
                {lang === 'fr' ? 'Voir →' : 'View →'}
              </button>
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 10 }}>
              {roadmap.length} {lang === 'fr' ? `bourse${roadmap.length !== 1 ? 's' : ''}` : `scholarship${roadmap.length !== 1 ? 's' : ''}`}
            </div>
            <ChecklistWidget user={user} roadmap={roadmap} setRoadmap={setRoadmap}/>
          </div>

          {/* Card 4: Activity */}
          <div style={S.card} className="hover-lift">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={S.cardTitle}>🔥 {lang === 'fr' ? 'Activité' : 'Activity'}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: streak >= 7 ? '#d97706' : '#64748b' }}>
                {streak}{lang === 'fr' ? 'j' : 'd'} 🔥
              </div>
            </div>
            <StreakWidget activities={realActivities}/>
            {(() => {
              const today = new Date();
              const JOURS = lang === 'fr' ? ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
              const data7 = Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(today);
                d.setDate(today.getDate() - (6 - i));
                const k = d.toISOString().split('T')[0];
                return { label: JOURS[d.getDay()], val: realActivities.filter(a => a.date === k).length };
              });
              return <MiniBarChart data={data7} color="#1a3a6b" height={36}/>;
            })()}
          </div>

        </div>

        {/* ROW 2: Alerts + Interviews */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14 }}>
          <div style={S.card} className="hover-lift">
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <div style={S.cardTitle}>🔔 {lang === 'fr' ? 'Alertes deadlines' : 'Deadline alerts'}</div>
              {urgentDeadlines.length>0&&<div style={{ background:'#fef2f2',border:'1px solid #fecaca',borderRadius:5,padding:'2px 8px',fontSize:11,fontWeight:700,color:'#dc2626' }}>{urgentDeadlines.length} {lang === 'fr' ? 'urgente' : 'urgent'}{urgentDeadlines.length>1?'s':''}</div>}
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:7,marginTop:12 }}>
              {deadlines.length===0 ? <div style={{ color:'#64748b',fontSize:13 }}>{lang === 'fr' ? 'Aucune bourse avec deadline.' : 'No scholarships with deadlines.'}</div>
              : deadlines.slice(0,5).map((d,i)=>{
                const dl=daysLeft(d.deadline); const diff=Math.round((d.deadline-new Date())/86400000);
                const bg=diff<0?'#fef2f2':diff<=7?'#fffbeb':diff<=14?'#eff6ff':'#f8fafc';
                const bl=diff<0?'#dc2626':diff<=7?'#d97706':diff<=14?'#2563eb':'#e2e8f0';
                const rmItem=roadmap.find(r=>r.nom?.trim().toLowerCase()===d.nom?.trim().toLowerCase());
                const rmProgress=rmItem?getProgress(rmItem):0;
                const rmTotal=rmItem?getTotal(rmItem):0;
                return (
                  <div key={i} onClick={()=>setDrawerBourse(d)} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 12px',borderRadius:7,background:bg,borderLeft:`3px solid ${bl}`,cursor:'pointer' }}>
                    <div>
                      <div style={{ fontSize:12,color:'#1a3a6b',fontWeight:600 }}>{d.nom}</div>
                      <div style={{ fontSize:10,color:'#64748b',marginTop:1 }}>
                        {d.pays} · {d.deadline.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                        {rmItem&&<span style={{ marginLeft:6,color:'#7c3aed',fontWeight:600 }}>📋 {rmProgress}/{rmTotal}</span>}
                        {d.isFavori&&<span style={{ marginLeft:6,color:'#d97706',fontWeight:600 }}>⭐</span>}
                      </div>
                    </div>
                    <span style={{ fontSize:11,color:dl.color,fontWeight:700,padding:'2px 9px',borderRadius:4,background:`${dl.color}15`,border:`1px solid ${dl.color}35`,whiteSpace:'nowrap' }}>{dl.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={S.card} className="hover-lift">
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
              <div><div style={S.cardTitle}>📊 {lang === 'fr' ? 'Progression des scores' : 'Score progression'}</div><div style={S.cardSub}>{scores.length} {lang === 'fr' ? `entretien${scores.length!==1?'s':''} simulé${scores.length!==1?'s':''}` : `interview${scores.length!==1?'':' (s)'} simulated`}</div></div>
              <button style={S.btnXs} onClick={()=>setView('entretien')}>
                {lang === 'fr' ? 'Pratiquer →' : 'Practice →'}
              </button>
            </div>
            {scores.length===0 ? (
              <div style={{ textAlign:'center',padding:'32px 0' }}><div style={{ fontSize:40,marginBottom:12 }}>🎙️</div><div style={{ color:'#64748b',fontSize:13,marginBottom:14 }}>{lang === 'fr' ? 'Aucun entretien simulé' : 'No mock interviews'}</div><button style={S.btnPrimary} onClick={()=>setView('entretien')}>
                {lang === 'fr' ? 'Démarrer maintenant' : 'Start now'}
              </button></div>
            ) : (
              <>
               <Sparkline data={scoreHistory} color="#1a3a6b" height={70} lang={lang}/>
                <div style={{ display:'flex',gap:10,marginTop:12,flexWrap:'wrap' }}>
                  {[
                    {label:lang === 'fr' ? 'Dernier score' : 'Last score',val:`${lastScore}/100`,color:lastScore>=75?'#166534':lastScore>=55?'#d97706':'#dc2626'},
                    avgScore!=null&&{label:lang === 'fr' ? 'Moyenne' : 'Average',val:`${avgScore}/100`,color:'#475569'},
                    scoreDiff!=null&&{label:lang === 'fr' ? 'Évolution' : 'Change',val:`${scoreDiff>0?'+':''}${scoreDiff}`,color:scoreDiff>0?'#166534':'#dc2626'},
                  ].filter(Boolean).map((s,i)=>(
                    <div key={i} style={{ padding:'8px 14px',borderRadius:8,background:'#f8fafc',border:'1px solid #e2e8f0' }}>
                      <div style={{ fontSize:17,fontWeight:800,color:s.color }}>{s.val}</div>
                      <div style={{ fontSize:10,color:'#64748b',marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ROW 3: Calendar + Upcoming */}
        <div style={{ display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:14,marginBottom:14 }}>
          <div style={S.card} className="hover-lift">
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
              <div>
                <div style={S.cardTitle}>📅 {lang === 'fr' ? 'Calendrier des deadlines' : 'Deadlines calendar'}</div>
                <div style={S.cardSub}>{deadlines.length} {lang === 'fr' ? `deadline${deadlines.length!==1?'s':''}` : `deadline${deadlines.length!==1?'':' (s)'}`} · <span style={{ color:'#7c3aed',fontWeight:600 }}>{roadmapDeadlines.length} {lang === 'fr' ? 'roadmap' : 'roadmap'}</span> · <span style={{ color:'#d97706',fontWeight:600 }}>{deadlines.filter(d=>d.isFavori).length} {lang === 'fr' ? 'favoris' : 'favorites'}</span></div>
              </div>
              <button style={S.btnXs} onClick={()=>setView('roadmap')}>
                {lang === 'fr' ? 'Roadmap →' : 'Roadmap →'}
              </button>
            </div>
            {deadlines.length===0 ? (
              <div style={{ textAlign:'center',padding:'32px 0',color:'#64748b' }}><div style={{ fontSize:40,marginBottom:10 }}>📭</div><div style={{ fontSize:13,marginBottom:14 }}>{lang === 'fr' ? 'Aucune bourse avec deadline' : 'No scholarships with deadlines'}</div><button style={S.btnPrimary} onClick={()=>setView('bourses')}>
                {lang === 'fr' ? 'Explorer les bourses' : 'Explore scholarships'}
              </button></div>
            ) : <Calendrier deadlines={deadlines} onSelectBourse={b=>{const full=(bourses||[]).find(x=>x.nom?.trim().toLowerCase()===b.nom?.trim().toLowerCase());setDrawerBourse(full||b);}}/>}
          </div>

          <div style={S.card} className="hover-lift">
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
              <div style={S.cardTitle}>⏳ {lang === 'fr' ? 'Prochaines échéances' : 'Upcoming deadlines'}</div>
              <button style={S.btnXs} onClick={()=>setView('roadmap')}>
                {lang === 'fr' ? 'Roadmap →' : 'Roadmap →'}
              </button>
            </div>
            {deadlines.length===0 ? (
              <div style={{ color:'#64748b',fontSize:13,textAlign:'center',padding:'20px 0' }}><div style={{ fontSize:32,marginBottom:8 }}>📋</div>
                {lang === 'fr' ? 'Ajoute des bourses pour suivre leurs deadlines' : 'Add scholarships to track their deadlines'}
              </div>
            ) : deadlines.slice(0,7).map((d,i)=>{
              const dl = daysLeft(d.deadline, lang);
              const rmItem=roadmap.find(r=>r.nom?.trim().toLowerCase()===d.nom?.trim().toLowerCase());
              const rmProgress=rmItem?getProgress(rmItem):0;
              const rmTotal=rmItem?getTotal(rmItem):0;
              const rmDone=rmItem?isItemDone(rmItem):false;
              return (
                <div key={i} onClick={()=>{const full=(bourses||[]).find(b=>b.nom?.trim().toLowerCase()===d.nom?.trim().toLowerCase());setDrawerBourse(full||d);}}
                  style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:i<Math.min(deadlines.length,7)-1?'1px solid #f1f5f9':'none',cursor:'pointer' }}>
                  <div style={{ width:8,height:8,borderRadius:'50%',background:rmDone?'#166534':dl.color,flexShrink:0 }}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                      <div style={{ fontSize:12,color:rmDone?'#166534':'#1a3a6b',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{d.nom}</div>
                      {d.inRoadmap&&<span style={{ fontSize:8,color:'#7c3aed',flexShrink:0 }}>📋</span>}
                      {d.isFavori&&<span style={{ fontSize:8,color:'#d97706',flexShrink:0 }}>⭐</span>}
                    </div>
                    <div style={{ fontSize:10,color:'#64748b',marginTop:1 }}>
                      {d.pays} · {d.deadline.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                      {rmItem&&<span style={{ marginLeft:6,color:rmDone?'#166534':'#2563eb',fontWeight:600 }}>· {rmProgress}/{rmTotal}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize:10,color:rmDone?'#166534':dl.color,fontWeight:700,padding:'2px 7px',borderRadius:4,background:rmDone?'#f0fdf4':`${dl.color}15`,border:`1px solid ${rmDone?'#86efac':dl.color+'35'}`,whiteSpace:'nowrap' }}>
                    {rmDone?'✅':dl.label}
                  </span>
                </div>
              );
            })}
            {deadlines.length>0&&(
              <div style={{ marginTop:12,padding:'10px',borderRadius:7,background:'#f8fafc',border:'1px solid #f1f5f9',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6 }}>
                {[
                  {val:roadmapDeadlines.length,label:lang === 'fr' ? 'En suivi' : 'Tracked',color:'#7c3aed'},
                  {val:urgentDeadlines.length,label:lang === 'fr' ? 'Urgentes' : 'Urgent',color:'#dc2626'},
                  {val:roadmapTerminees,label:lang === 'fr' ? 'Terminées' : 'Completed',color:'#166534'},
                ].map(s=>(
                  <div key={s.label} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:18,fontWeight:800,color:s.color }}>{s.val}</div>
                    <div style={{ fontSize:9,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.04em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* WORLD MAP */}
        <div style={{ marginBottom:14 }}>
          <div style={S.card}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
              <div><div style={S.cardTitle}>🌍 {lang === 'fr' ? 'Carte mondiale des bourses' : 'World scholarship map'}</div><div style={S.cardSub}>{Object.keys(scholarshipCounts).length} {lang === 'fr' ? 'pays' : 'countries'} · {(bourses||[]).length} {lang === 'fr' ? 'bourses' : 'scholarships'}</div></div>
              <button style={S.btnXs} onClick={()=>setView('bourses')}>
                {lang === 'fr' ? 'Toutes →' : 'All →'}
              </button>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 240px',gap:16,alignItems:'start' }}>
                <WorldMap onCountryClick={code=>setActiveCountry(code===activeCountry?null:code)} activeCountry={activeCountry} scholarshipCounts={scholarshipCounts} lang={lang}/>
                <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                <div style={{ fontSize:10,fontWeight:700,color:'#1a3a6b',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:4,borderBottom:'2px solid #f5a623',paddingBottom:4 }}>
                  {lang === 'fr' ? 'Top pays' : 'Top countries'}
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:2,maxHeight:280,overflowY:'auto' }}>
                  {Object.entries(scholarshipCounts).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([code,count])=>{
                    const meta=COUNTRY_META[code];if(!meta)return null;
                    const isActive=activeCountry===code;
                    const barMax=Math.max(...Object.values(scholarshipCounts));
                    const barColor=count>=10?'#1a3a6b':count>=7?'#2563eb':count>=4?'#3b82f6':'#93c5fd';
                    return (
                      <div key={code} onClick={()=>setActiveCountry(code===activeCountry?null:code)} style={{ display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:6,cursor:'pointer',background:isActive?'#eff6ff':'transparent',border:isActive?'1px solid #bfdbfe':'1px solid transparent' }}>
                        <span style={{ fontSize:14,width:20,textAlign:'center' }}>{meta.flag}</span>
                        <span style={{ flex:1,fontSize:11,color:isActive?'#1a3a6b':'#475569',fontWeight:isActive?700:400 }}>{meta.label}</span>
                        <div style={{ display:'flex',alignItems:'center',gap:4 }}><div style={{ width:Math.round(count/barMax*36),height:4,borderRadius:2,background:barColor }}/><span style={{ fontSize:10,fontWeight:700,color:barColor,minWidth:14 }}>{count}</span></div>
                      </div>
                    );
                  })}
                </div>
                {activeCountry&&COUNTRY_META[activeCountry]&&(
                  <div style={{ marginTop:8,padding:'12px',borderRadius:8,background:'#eff6ff',border:'1px solid #bfdbfe' }}>
                    <div style={{ fontSize:13,fontWeight:700,color:'#1a3a6b',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                      <span>{COUNTRY_META[activeCountry].flag} {COUNTRY_META[activeCountry].label}</span>
                      <span style={{ fontSize:10,color:'#fff',background:'#1a3a6b',padding:'2px 7px',borderRadius:3,fontWeight:600 }}>{scholarshipCounts[activeCountry]||0} {lang === 'fr' ? 'bourses' : 'scholarships'}</span>
                    </div>
                    {activeCountryBourses.length>0?activeCountryBourses.map((b,i)=><div key={i} style={{ fontSize:11,color:'#334155',padding:'3px 0',borderBottom:i<activeCountryBourses.length-1?'1px solid #dbeafe':'none' }}>{b.nom}</div>):<div style={{ fontSize:11,color:'#94a3b8' }}>{lang === 'fr' ? 'Aucune bourse' : 'No scholarships'}</div>}
                    <button style={{ ...S.btnGold,width:'100%',marginTop:10,fontSize:11,padding:'7px' }} onClick={()=>handleQuickReply(lang === 'fr' ? `Montre-moi les bourses en ${COUNTRY_META[activeCountry].label} pour un étudiant tunisien` : `Show me scholarships in ${COUNTRY_META[activeCountry].label} for a Tunisian student`)}>
                      {lang === 'fr' ? 'Explorer avec l\'IA' : 'Explore with AI'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RADAR + ADVICE */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14 }}>
          <div style={S.card}>
            <div style={S.cardTitle}>🕸️ {lang === 'fr' ? 'Radar de compétences' : 'Skills radar'}</div>
            <div style={S.cardSub}>
              {scores.length>0 
                ? (lang === 'fr' ? `Basé sur ${scores.length} entretien${scores.length>1?'s':''}` : `Based on ${scores.length} interview${scores.length>1?'s':''}`)
                : user?.skills?.length>0 
                  ? (lang === 'fr' ? `${user.skills.length} compétence${user.skills.length>1?'s':''} dans le profil` : `${user.skills.length} skill${user.skills.length>1?'s':''} in profile`)
                  : (lang === 'fr' ? 'Lance un entretien pour des données réelles' : 'Start an interview for real data')}
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:16,marginTop:14 }}>
              <SkillRadar skills={skillData}/>
              <div style={{ display:'flex',flexDirection:'column',gap:8,flex:1 }}>
                {skillData.map(s=>(
                  <div key={s.label}>
                    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:3 }}><span style={{ fontSize:11,color:'#475569' }}>{s.label}</span><span style={{ fontSize:10,fontWeight:700,color:'#1a3a6b' }}>{s.value}%</span></div>
                    <div style={{ height:4,borderRadius:99,background:'#f1f5f9',overflow:'hidden' }}><div style={{ height:'100%',width:`${s.value}%`,background:s.value>=80?'#166534':s.value>=60?'#2563eb':'#d97706',borderRadius:99,transition:'width 0.8s ease' }}/></div>
                  </div>
                ))}
              </div>
            </div>
            <button style={{ ...S.btnPrimary,width:'100%',marginTop:14 }} onClick={()=>setView('entretien')}>
              🎙️ {lang === 'fr' ? 'Lancer un entretien IA' : 'Start AI interview'}
            </button>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>💪 {lang === 'fr' ? 'Conseils pour ton entretien' : 'Interview tips'}</div>
            <div style={{ display:'flex',flexDirection:'column',gap:8,marginTop:12 }}>
              {[
                {icon:'🗣️',title:lang === 'fr' ? 'Méthode STAR' : 'STAR Method',desc:lang === 'fr' ? 'Situation → Tâche → Action → Résultat. Cite toujours des chiffres.' : 'Situation → Task → Action → Result. Always cite numbers.',color:'#eff6ff',border:'#bfdbfe',text:'#1a3a6b'},
                {icon:'🎯',title:lang === 'fr' ? 'Projet précis' : 'Specific project',desc:lang === 'fr' ? 'Cite le nom de tes profs cibles et laboratoires visés dans le pays.' : 'Mention target professors and labs in the country.',color:'#f0fdf4',border:'#bbf7d0',text:'#166534'},
                {icon:'⏱️',title:lang === 'fr' ? 'Gestion du temps' : 'Time management',desc:lang === 'fr' ? '2-3 minutes max par réponse.' : '2-3 minutes max per answer.',color:'#fffbeb',border:'#fde68a',text:'#856404'},
                {icon:'🌍',title:lang === 'fr' ? 'Contexte culturel' : 'Cultural context',desc:lang === 'fr' ? 'Montre que tu connais le pays, son système d\'éducation, sa culture.' : 'Show you know the country, its education system, its culture.',color:'#f5f3ff',border:'#ddd6fe',text:'#7c3aed'},
              ].map((c,i)=>(
                <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',borderRadius:8,background:c.color,border:`1px solid ${c.border}` }}>
                  <span style={{ fontSize:18,flexShrink:0 }}>{c.icon}</span>
                  <div><div style={{ fontSize:12,fontWeight:700,color:c.text,marginBottom:3 }}>{c.title}</div><div style={{ fontSize:11,color:'#64748b',lineHeight:1.5 }}>{c.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* CHAT */}
      {showChat&&(
        <div style={{ position:'fixed',top:80,right:24,width:360,height:'calc(100vh - 100px)',background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,display:'flex',flexDirection:'column',boxShadow:'0 8px 24px rgba(0,0,0,0.12)',zIndex:1000 }}>
          <div style={{ padding:'12px 16px',background:'#1a3a6b',borderTopLeftRadius:12,borderTopRightRadius:12,color:'#fff',display:'flex',justifyContent:'space-between' }}>
            <span>🤖 {lang === 'fr' ? 'Assistant' : 'Assistant'}</span>
            <button onClick={()=>setShowChat(false)} style={{ background:'none',border:'none',color:'#fff',fontSize:18,cursor:'pointer' }}>✕</button>
          </div>
          <div style={{ flex:1,overflowY:'auto',padding:12 }} ref={chatContainerRef}>
            {messages.map((msg,i)=>(<div key={i} style={{ textAlign:msg.sender==='user'?'right':'left',marginBottom:8 }}><div style={{ display:'inline-block',background:msg.sender==='user'?'#1a3a6b':'#e2e8f0',color:msg.sender==='user'?'#fff':'#000',padding:'8px 12px',borderRadius:12 }}>{msg.text}</div></div>))}
            {loading&&<div style={{ color:'#94a3b8',fontSize:12,padding:8 }}>{lang === 'fr' ? 'En train de répondre...' : 'Responding...'}</div>}
          </div>
          <div style={{ padding:12,borderTop:'1px solid #e2e8f0' }}><ChatInput input={input} setInput={setInput} onSend={handleSend} loading={loading}/></div>
        </div>
      )}

      {/* DRAWER */}
      {drawerBourse&&(
        <BourseDrawer bourse={drawerBourse} onClose={()=>setDrawerBourse(null)}
          onAskAI={b=>{handleQuickReply(lang === 'fr' ? `Donne-moi les détails sur "${b.nom}"` : `Give me details about "${b.nom}"`);setDrawerBourse(null);}}
          onChoose={b=>handleQuickReply(lang === 'fr' ? 'je choisis '+b.nom : 'I choose '+b.nom)}
          applied={appliedNoms.has(drawerBourse.nom?.trim().toLowerCase())}
          onApply={async b=>{try{await axiosInstance.post(API_ROUTES.roadmap.create,{userId:user.id,userEmail:user.email||'',nom:b.nom,pays:b.pays||'',lienOfficiel:b.lienOfficiel||'',financement:b.financement||'',dateLimite:b.dateLimite||null,ajouteLe:new Date().toISOString(),statut:lang === 'fr' ? 'en_cours' : 'in_progress',etapeCourante:0});setAppliedNoms(prev=>new Set([...prev,b.nom?.trim().toLowerCase()]));}catch(e){console.error(e);}}}
          starred={starredNoms.has(drawerBourse.nom?.trim().toLowerCase())}
          onStar={async(b,isStarred)=>{const nomKey=b.nom?.trim().toLowerCase();try{const res=await axiosInstance.get(API_ROUTES.favoris.byUser(user.id)+'&limit=1&depth=0');const doc=res.data.docs?.[0];if(isStarred){if(doc?.id){const newB=(doc.bourses||[]).filter(x=>x.nom?.trim().toLowerCase()!==nomKey);await axiosInstance.patch(API_ROUTES.favoris.update(doc.id),{bourses:newB});setStarredNoms(prev=>{const s=new Set(prev);s.delete(nomKey);return s;});}}else{const nb={nom:b.nom,pays:b.pays||'',lienOfficiel:b.lienOfficiel||'',financement:b.financement||'',dateLimite:b.dateLimite||null,ajouteLe:new Date().toISOString()};if(doc?.id)await axiosInstance.patch(API_ROUTES.favoris.update(doc.id),{bourses:[...(doc.bourses||[]),nb]});else await axiosInstance.post(API_ROUTES.favoris.create,{user:user.id,userEmail:user.email||'',bourses:[nb]});setStarredNoms(prev=>new Set([...prev,nomKey]));}}catch(e){console.error(e);}}}
          user={user}/>
      )}

      <button onClick={()=>setShowChat(p=>!p)} style={{ position:'fixed',bottom:24,right:24,width:56,height:56,borderRadius:'50%',background:'#f5a623',border:'none',boxShadow:'0 4px 16px rgba(26,58,107,0.35)',cursor:'pointer',fontSize:22,color:'#1a3a6b',zIndex:1000,transition:'transform 0.2s' }}
        onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
        {showChat?'✕':'💬'}
      </button>

      {showLoginModal&&<LoginModal onClose={()=>setShowLoginModal(false)}/>}
    </div>
  );
}

const S = {
  card:{ background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,padding:'18px 20px',boxShadow:'0 2px 8px rgba(26,58,107,0.06)' },
  cardTitle:{ fontSize:14,fontWeight:700,color:'#1a3a6b' },
  cardSub:{ fontSize:11,color:'#64748b',marginTop:2 },
  btnPrimary:{ padding:'9px 18px',borderRadius:6,background:'#1a3a6b',color:'#fff',border:'none',fontSize:13,fontWeight:600,cursor:'pointer' },
  btnGold:{ padding:'9px 18px',borderRadius:6,background:'#f5a623',color:'#1a3a6b',border:'none',fontSize:13,fontWeight:700,cursor:'pointer' },
  btnXs:{ padding:'5px 12px',borderRadius:4,background:'#eff6ff',border:'1px solid #bfdbfe',color:'#1a3a6b',fontSize:11,cursor:'pointer',fontWeight:600 },
  navBtn:{ padding:'3px 12px',borderRadius:4,background:'#f8fafc',border:'1px solid #e2e8f0',color:'#1a3a6b',fontSize:16,cursor:'pointer' },
  iconBtn:{ padding:'3px 8px',borderRadius:4,background:'#f8fafc',border:'1px solid #e2e8f0',color:'#1a3a6b',fontSize:14,cursor:'pointer' },
  locked:{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8f9fc',padding:24 },
  lockedCard:{ display:'flex',flexDirection:'column',alignItems:'center',background:'#ffffff',border:'1px solid #e2e8f0',borderRadius:12,padding:'48px 40px',boxShadow:'0 4px 20px rgba(26,58,107,0.08)',maxWidth:380,width:'100%' },
  lockBtn:{ padding:'12px 32px',borderRadius:6,background:'#1a3a6b',color:'white',border:'none',fontSize:14,fontWeight:700,cursor:'pointer' },
};