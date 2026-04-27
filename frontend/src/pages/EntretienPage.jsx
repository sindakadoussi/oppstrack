import React, { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '@/config/axiosInstance';
import axios from 'axios';
import { WEBHOOK_ROUTES } from '@/config/routes';
import { API_ROUTES } from '@/config/routes';
import './EntretienPage.css';
import { useT, useDark } from '../i18n';
import { useTheme } from '../components/Navbar';

const TOTAL_Q = 8;
const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

function tts(text, lang = 'fr') {
  return new Promise(resolve => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'en' ? 'en-US' : 'fr-FR';
    u.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(lang === 'en' ? 'en' : 'fr'));
    if (voice) u.voice = voice;
    u.onend = resolve; u.onerror = resolve;
    window.speechSynthesis.speak(u);
  });
}

async function saveEntretien(userId, scoreText, conversationId, bourseNom) {
  if (!userId) return;
  try {
    await axiosInstance.post('/api/entretiens', {
      user: userId, score: scoreText,
      conversationId: conversationId || `entretien-${Date.now()}`,
      context: bourseNom || '',
    });
  } catch(e) { console.error('❌ Save entretien:', e.message); }
}

class VoiceAnalyzer {
  constructor(stream) {
    this.ctx = new AudioContext();
    this.src = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.src.connect(this.analyser);
    this.buf = new Float32Array(this.analyser.fftSize);
    this.running = false;
    this.speakingMs = 0; this.totalMs = 0;
    this.silenceStart = null; this.pauseCount = 0;
    this.hesitationMs = 0; this.volumeHistory = [];
    this.lastTs = Date.now();
  }
  start() { this.running = true; this._tick(); }
  _tick() {
    if (!this.running) return;
    const now = Date.now(); const dt = now - this.lastTs; this.lastTs = now;
    this.totalMs += dt;
    this.analyser.getFloatTimeDomainData(this.buf);
    let sum = 0;
    for (let i = 0; i < this.buf.length; i++) sum += this.buf[i] * this.buf[i];
    const vol = Math.min(100, Math.sqrt(sum / this.buf.length) * 400);
    this.volumeHistory.push(vol);
    if (vol < 3) {
      if (!this.silenceStart) this.silenceStart = now;
      const dur = now - this.silenceStart;
      if (dur > 500 && dur < 3001) this.hesitationMs += dt;
      if (dur >= 3001 && dur < 3101) this.pauseCount++;
    } else { this.silenceStart = null; this.speakingMs += dt; }
    requestAnimationFrame(() => this._tick());
  }
  getStats() {
    const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    const vol = avg(this.volumeHistory);
    const recent = this.volumeHistory.slice(-30);
    const variance = recent.length > 5
      ? Math.sqrt(recent.reduce((a,b,_,arr) => { const m=avg(arr); return a+(b-m)**2; },0)/recent.length) : 0;
    return {
      volume: Math.round(vol),
      stability: Math.round(Math.min(100, 100 - variance*2)),
      speakRatio: this.totalMs > 0 ? Math.round((this.speakingMs/this.totalMs)*100) : 0,
      pauseCount: this.pauseCount,
      hesitations: Math.round(this.hesitationMs/1000),
    };
  }
  stop() { this.running = false; }
  destroy() { this.running = false; try { this.ctx.close(); } catch {} }
}

/* ── LoginModal ── */
/* ─── Traduction via MyMemory API (gratuite) ─── */
async function translateText(text, sourceLang, targetLang) {
  if (!text || text.length < 5 || sourceLang === targetLang) return text;
  try {
    const chunks = text.match(/[\s\S]{1,400}/g) || [text];
    const results = [];
    for (const chunk of chunks) {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${sourceLang}|${targetLang}`
      );
      const data = await res.json();
      results.push(data.responseStatus === 200 ? (data.responseData?.translatedText || chunk) : chunk);
      await new Promise(r => setTimeout(r, 80));
    }
    return results.join(' ');
  } catch { return text; }
}
function detectLang(text) {
  if (!text) return 'fr';
  return /le candidat|entretien|bourse|motivation|recherche|conseils|points forts|améliorer|réponses/i.test(text) ? 'fr' : 'en';
}


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
      setErrMsg(err.response?.data?.message || (lang==='fr'?'Impossible de contacter le serveur':'Cannot contact server'));
    }
  };

  return (
    <div className="ep-modal-overlay">
      <div className="ep-modal-container">
        <div className="ep-modal-header">
          <span style={{ fontSize:22 }}>🔐</span>
          <span>{lang==='fr'?'Connexion à OppsTrack':'Sign in to OppsTrack'}</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ep-modal-body">
          {status==='idle' && (
            <>
              <p>{lang==='fr'?<>Entrez votre email pour recevoir un <strong style={{ color:'#255cae' }}>lien de connexion magique</strong>.</>:<>Enter your email to receive a <strong style={{ color:'#255cae' }}>magic login link</strong>.</>}</p>
              <input type="email" placeholder={lang==='fr'?'votre@email.com':'your@email.com'}
                value={email} autoFocus onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&send()} className="ep-modal-input"/>
              {errMsg && <div className="ep-modal-error">{errMsg}</div>}
              <button className="ep-modal-btn" onClick={send}>✉️ {lang==='fr'?'Envoyer le lien magique':'Send magic link'}</button>
            </>
          )}
          {status==='sending' && (
            <div className="ep-modal-center">
              <div className="ep-spinner"/>
              <p style={{ color:'#64748b', marginTop:14 }}>{lang==='fr'?'Envoi en cours...':'Sending...'}</p>
            </div>
          )}
          {status==='success' && (
            <div className="ep-modal-center">
              <div style={{ fontSize:52, marginBottom:12 }}>✉️</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#166534', marginBottom:8 }}>{lang==='fr'?'Lien envoyé !':'Link sent!'}</div>
              <p style={{ color:'#64748b', fontSize:13, lineHeight:1.6 }}>
                {lang==='fr'?<>Vérifiez votre boîte mail (et les spams).<br/>Cliquez sur le lien pour vous connecter.</>:<>Check your inbox (and spam).<br/>Click the link to sign in.</>}
              </p>
              <button className="ep-modal-btn success" style={{ marginTop:20 }} onClick={onClose}>✓ {lang==='fr'?'Fermer':'Close'}</button>
            </div>
          )}
          {status==='error' && (
            <div className="ep-modal-center">
              <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
              <p style={{ color:'#dc2626', marginBottom:12 }}>{errMsg}</p>
              <button className="ep-modal-btn error" onClick={()=>{setStatus('idle');setErrMsg('');}}>
                {lang==='fr'?'Réessayer':'Retry'}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="ep-modal-backdrop" onClick={onClose}/>
    </div>
  );
}

/* ── EntretienDetail ── */
function EntretienDetail({ entretien, onBack, parseEntretien, getScoreColor, formatDate, dk=false }) {
  const { lang } = useT();
  const [activeTab, setActiveTab] = useState('summary');
  const parsed = parseEntretien(entretien.score);
  const scoreColor = getScoreColor(parsed.score);

  const [content, setContent] = useState({ verdict:parsed.verdict, pointsForts:parsed.pointsForts, pointsAmeliorer:parsed.pointsAmeliorer, conseils:parsed.conseils, rawText:parsed.rawText });
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    const srcLang = detectLang(parsed.rawText);
    const tgtLang = lang === 'fr' ? 'fr' : 'en';
    if (srcLang === tgtLang) {
      setContent({ verdict:parsed.verdict, pointsForts:parsed.pointsForts, pointsAmeliorer:parsed.pointsAmeliorer, conseils:parsed.conseils, rawText:parsed.rawText });
      return;
    }
    setTranslating(true);
    Promise.all([
      parsed.verdict ? translateText(parsed.verdict, srcLang, tgtLang) : Promise.resolve(''),
      Promise.all(parsed.pointsForts.map(p => translateText(p, srcLang, tgtLang))),
      Promise.all(parsed.pointsAmeliorer.map(p => translateText(p, srcLang, tgtLang))),
      Promise.all(parsed.conseils.map(c => translateText(c, srcLang, tgtLang))),
      parsed.rawText ? translateText(parsed.rawText, srcLang, tgtLang) : Promise.resolve(''),
    ]).then(([verdict, forts, amelio, conseils, raw]) => {
      setContent({ verdict:verdict||parsed.verdict, pointsForts:forts.length?forts:parsed.pointsForts, pointsAmeliorer:amelio.length?amelio:parsed.pointsAmeliorer, conseils:conseils.length?conseils:parsed.conseils, rawText:raw||parsed.rawText });
      setTranslating(false);
    }).catch(() => {
      setContent({ verdict:parsed.verdict, pointsForts:parsed.pointsForts, pointsAmeliorer:parsed.pointsAmeliorer, conseils:parsed.conseils, rawText:parsed.rawText });
      setTranslating(false);
    });
  }, [lang, parsed.rawText]);

  const TABS = [
    { id:'summary',   labelFr:'📊 Résumé',  labelEn:'📊 Summary'  },
    { id:'strengths', labelFr:'✅ Analyse',  labelEn:'✅ Analysis'  },
    { id:'advice',    labelFr:'💡 Conseils', labelEn:'💡 Tips'      },
    { id:'details',   labelFr:'📝 Détails',  labelEn:'📝 Details'   },
  ];

  return (
    <div className="ep-detail-container">
      <button className="ep-detail-back" onClick={onBack}>
        <span style={{ fontSize:18 }}>←</span> {lang==='fr'?'Retour à la liste':'Back to list'}
      </button>
      <div className="ep-detail-header" style={{ background: dk ? '#1d1c16' : undefined, borderColor: dk ? '#2b2a22' : undefined }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', background: dk ? '#15140f' : '#f8fafc', borderRadius:20, fontSize:13, fontWeight:600, color: dk ? '#a19f96' : '#475569' }}>
            <span style={{ fontSize:20 }}>🎓</span>
            <span>{entretien.context || (lang==='fr'?'Entretien de bourse':'Scholarship interview')}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color: dk ? '#a19f96' : '#475569' }}>
            <span>📅</span><span>{formatDate(entretien.createdAt)}</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
          <div className="ep-detail-score-circle" style={{ background:scoreColor.bg, border:`2px solid ${scoreColor.color}` }}>
            <span className="ep-detail-score-val">{parsed.score!==null?parsed.score:'?'}</span>
            <span className="ep-detail-score-max">/100</span>
          </div>
          <div>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:4, color:scoreColor.color }}>{scoreColor.icon} {scoreColor.grade}</div>
            {parsed.verdict&&<div style={{ fontSize:14, color: dk ? '#a19f96' : '#475569' }}>{parsed.verdict}</div>}
          </div>
        </div>
      </div>

      {translating && (
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'6px 12px',margin:'4px 0',borderRadius:6,background:'#fffbeb',border:'1px solid #fde68a',fontSize:11,color:'#92400e' }}>
          <div style={{ width:12,height:12,borderRadius:'50%',border:'2px solid #fde68a',borderTopColor:'#d97706',animation:'spin 0.8s linear infinite',flexShrink:0 }}/>
          {lang==='fr'?'Traduction du rapport...':'Translating report...'}
        </div>
      )}
      <div className="ep-detail-tabs">
        {TABS.map(t=>(
          <button key={t.id} className={`ep-detail-tab ${activeTab===t.id?'active':''}`}
            onClick={()=>setActiveTab(t.id)}>
            {lang==='fr'?t.labelFr:t.labelEn}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', minHeight:300 }}>
        {activeTab==='summary' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { icon:'⏱️', labelFr:'Durée totale',  labelEn:'Total duration', val:parsed.questionMetrics.length>0?`${Math.floor(parsed.questionMetrics.length*1.5)}:00`:'—' },
                { icon:'📝', labelFr:'Questions',      labelEn:'Questions',      val:parsed.questionMetrics.length||'8' },
                { icon:'🎯', labelFr:'Score',          labelEn:'Score',          val:parsed.score!==null?`${parsed.score}/100`:'—' },
              ].map(s=>(
                <div key={s.labelFr} style={{ background: dk ? '#1d1c16' : '#fff', borderRadius:14, padding:14, textAlign:'center', border:'1px solid rgba(15,23,42,.04)' }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
                  <div style={{ fontSize:11, color: dk ? '#a19f96' : '#475569', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{lang==='fr'?s.labelFr:s.labelEn}</div>
                  <div style={{ fontSize:18, fontWeight:700, color: dk ? '#f2efe7' : '#0f172a'}}>{s.val}</div>
                </div>
              ))}
            </div>
            {content.pointsForts?.length>0&&(
              <div style={{ background: dk ? '#1d1c16' : '#fff', borderRadius:14, padding:16, border:'1px solid rgba(15,23,42,.04)' }}>
                <div className="ep-detail-section-title">✅ {lang==='fr'?'Points forts identifiés':'Identified strengths'}</div>
                <ul style={{ margin:0, paddingLeft:0, listStyle:'none' }}>
                  {content.pointsForts.slice(0,3).map((p,i)=>(
                    <li key={i} style={{ fontSize:13, color: dk ? '#cfccc2' : '#334155', lineHeight:1.6, marginBottom:10 }}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {content.pointsAmeliorer?.length>0&&(
              <div style={{ background: dk ? '#1d1c16' : '#fff', borderRadius:14, padding:16, border:'1px solid rgba(15,23,42,.04)' }}>
                <div className="ep-detail-section-title">📈 {lang==='fr'?"Axes d'amélioration":'Areas for improvement'}</div>
                <ul style={{ margin:0, paddingLeft:0, listStyle:'none' }}>
                  {content.pointsAmeliorer.slice(0,3).map((p,i)=>(
                    <li key={i} style={{ fontSize:13, color: dk ? '#cfccc2' : '#334155', lineHeight:1.6, marginBottom:10 }}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {activeTab==='strengths' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            {content.pointsForts?.length>0&&(
              <div style={{ background: dk ? '#1d1c16' : '#fff', borderRadius:14, padding:16, border:'1px solid rgba(15,23,42,.04)' }}>
                <div className="ep-detail-section-title" style={{ color:'#34d399' }}>✅ {lang==='fr'?'POINTS FORTS':'STRENGTHS'}</div>
                <ul style={{ margin:0, paddingLeft:0, listStyle:'none' }}>
                  {content.pointsForts.map((p,i)=>(
                    <li key={i} style={{ fontSize:13, color: dk ? '#cfccc2' : '#334155', lineHeight:1.6, marginBottom:10, display:'flex', alignItems:'flex-start' }}>
                      <span style={{ color:'#34d399', marginRight:8 }}>✓</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {content.pointsAmeliorer?.length>0&&(
              <div style={{ background: dk ? '#1d1c16' : '#fff', borderRadius:14, padding:16, border:'1px solid rgba(15,23,42,.04)' }}>
                <div className="ep-detail-section-title" style={{ color:'#fbbf24' }}>⚠️ {lang==='fr'?'POINTS À AMÉLIORER':'AREAS TO IMPROVE'}</div>
                <ul style={{ margin:0, paddingLeft:0, listStyle:'none' }}>
                  {content.pointsAmeliorer.map((p,i)=>(
                    <li key={i} style={{ fontSize:13, color: dk ? '#cfccc2' : '#334155', lineHeight:1.6, marginBottom:10, display:'flex', alignItems:'flex-start' }}>
                      <span style={{ color:'#fbbf24', marginRight:8 }}>!</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {activeTab==='advice' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            {content.conseils?.length>0?(
              <div style={{ background: dk ? '#1d1c16' : '#fff', borderRadius:14, padding:16, border:'1px solid rgba(15,23,42,.04)' }}>
                <div className="ep-detail-section-title" style={{ color:'#a78bfa' }}>💡 {lang==='fr'?'CONSEILS PERSONNALISÉS':'PERSONALIZED TIPS'}</div>
                <ul style={{ margin:0, paddingLeft:0, listStyle:'none' }}>
                  {content.conseils.map((c,i)=>(
                    <li key={i} style={{ fontSize:13, color: dk ? '#cfccc2' : '#334155', lineHeight:1.6, marginBottom:10, display:'flex', alignItems:'flex-start', padding:'12px 0', borderBottom:'1px solid rgba(15,23,42,.04)' }}>
                      <span style={{ fontSize:18, marginRight:12 }}>🎯</span><span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ):(
              <div style={{ textAlign:'center', padding:'40px 20px', color: dk ? '#a19f96' : '#475569' }}>
                <span style={{ fontSize:48 }}>📝</span>
                <p>{lang==='fr'?'Des conseils personnalisés apparaîtront ici après votre entretien':'Personalized tips will appear here after your interview'}</p>
              </div>
            )}
            <div style={{ background: dk ? '#15140f' : '#f8fafc', borderRadius:16, padding:20, border:'1px solid rgba(15,23,42,.04)' }}>
              <div style={{ fontSize:14, fontStyle:'italic', color:'#0f172a', lineHeight:1.5, marginBottom:12 }}>
                {lang==='fr'
                  ?'"La préparation est la clé du succès. Chaque entretien est une opportunité d\'apprendre et de progresser."'
                  :'"Preparation is the key to success. Every interview is an opportunity to learn and grow."'}
              </div>
              <div style={{ fontSize:11, color: dk ? '#a19f96' : '#475569', textAlign:'right' }}>— {lang==='fr'?'Jury IA':'AI Panel'}</div>
            </div>
          </div>
        )}
        {activeTab==='details' && (
          <div style={{ background: dk ? '#1d1c16' : '#fff', borderRadius:14, padding:16, border:'1px solid rgba(15,23,42,.04)' }}>
            <div className="ep-detail-section-title">📄 {lang==='fr'?'Rapport complet':'Full report'}</div>
                        <div style={{ fontSize:13, lineHeight:1.7, color: dk ? '#cfccc2' : '#334155', whiteSpace:'pre-wrap', maxHeight:400, overflowY:'auto' }}>
              {(content.rawText || parsed.rawText || '').split('\n').map((line, i) =>
                line.match(/SCORE|VERDICT|POINTS FORTS|POINTS À AMÉLIORER|CONSEILS/i)
                  ? <div key={i} style={{ fontWeight:700, color:'#255cae', marginTop:12, marginBottom:6, fontSize:12, letterSpacing:1 }}>{line}</div>
                  : line.trim() && line.match(/^[-•*]/)
                    ? <div key={i} style={{ paddingLeft:20, marginBottom:6, color: dk ? '#a19f96' : '#475569' }}>{line}</div>
                    : line.trim()
                      ? <div key={i} style={{ marginBottom:4, color: dk ? '#a19f96' : '#475569' }}>{line}</div>
                      : <div key={i} style={{ height:8 }}/>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:12, paddingTop:16, borderTop:'1px solid rgba(15,23,42,.04)', marginTop:8 }}>
        <button className="ep-detail-action-btn" onClick={()=>window.print()}>🖨️ {lang==='fr'?'Imprimer':'Print'}</button>
        <button className="ep-detail-action-btn" onClick={()=>{navigator.clipboard.writeText(parsed.rawText);alert(lang==='fr'?'Rapport copié':'Report copied');}}>📋 {lang==='fr'?'Copier':'Copy'}</button>
      </div>
    </div>
  );
}

/* ── HistoriquePanel ── */
function HistoriquePanel({ userId, onClose }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const dk = theme === 'dark';
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(()=>{
    if (!userId){setLoading(false);return;}
    axiosInstance.get('/api/entretiens',{params:{'where[user][equals]':userId,sort:'-createdAt',limit:20}})
      .then(res=>{setRecords(res.data.docs||[]);setLoading(false);})
      .catch(()=>setLoading(false));
  },[userId]);

  const parseEntretien=(text)=>{
    if(!text) return{score:null,verdict:'',pointsForts:[],pointsAmeliorer:[],conseils:[],questionMetrics:[],rawText:''};
    const scoreMatch=text.match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i);
    const score=scoreMatch?parseInt(scoreMatch[1]):null;
    const verdictMatch=text.match(/VERDICT\s*[:\-]\s*(.+?)(?=\n|$)/i);
    const verdict=verdictMatch?verdictMatch[1].trim():'';
    const extractSection=title=>{
      const regex=new RegExp(`${title}\\s*[:\\-]\\s*([\\s\\S]+?)(?=\\n\\s*[-•*]?\\s*(?:POINTS FORTS|POINTS À AMÉLIORER|CONSEILS|VERDICT|SCORE|$))`,'i');
      const match=text.match(regex);
      if(match) return match[1].trim().split(/\n/).filter(l=>l.trim()).map(l=>l.replace(/^[-•*]\s*/,'').trim());
      return[];
    };
    return{score,verdict,pointsForts:extractSection('POINTS FORTS'),pointsAmeliorer:extractSection('POINTS À AMÉLIORER'),conseils:extractSection('CONSEILS PERSONNALISÉS'),questionMetrics:[],rawText:text};
  };

  const getScoreColor=score=>{
    if(score===null) return{bg:'rgba(100,116,139,.15)',color:'#94a3b8',border:'rgba(100,116,139,.3)',grade:lang==='fr'?'Non évalué':'Not rated',icon:'📊'};
    if(score>=85) return{bg:'rgba(16,185,129,.2)',color:'#34d399',border:'rgba(16,185,129,.4)',grade:lang==='fr'?'Excellent':'Excellent',icon:'🏆'};
    if(score>=70) return{bg:'rgba(16,185,129,.15)',color:'#34d399',border:'rgba(16,185,129,.35)',grade:lang==='fr'?'Très bien':'Very good',icon:'🌟'};
    if(score>=55) return{bg:'rgba(245,158,11,.15)',color:'#fbbf24',border:'rgba(245,158,11,.35)',grade:lang==='fr'?'Bien':'Good',icon:'👍'};
    if(score>=40) return{bg:'rgba(245,158,11,.12)',color:'#fbbf24',border:'rgba(245,158,11,.3)',grade:lang==='fr'?'À améliorer':'To improve',icon:'📈'};
    return{bg:'rgba(239,68,68,.15)',color:'#f87171',border:'rgba(239,68,68,.35)',grade:lang==='fr'?'À renforcer':'To strengthen',icon:'⚠️'};
  };

  const formatDate=dateStr=>{
    const d=new Date(dateStr);const now=new Date();
    const diffDays=Math.floor((now-d)/(1000*60*60*24));
    if(diffDays===0) return lang==='fr'?`Aujourd'hui, ${d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`:`Today, ${d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}`;
    if(diffDays===1) return lang==='fr'?`Hier, ${d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`:`Yesterday, ${d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}`;
    if(diffDays<7) return lang==='fr'?`Il y a ${diffDays} jours`:`${diffDays} days ago`;
    return lang==='fr'?d.toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'}):d.toLocaleDateString('en-US',{day:'2-digit',month:'long',year:'numeric'});
  };

  return (
     <div className="ep-hist-overlay">
      <div className="ep-hist-drawer" style={{ background: dk ? '#1a1912' : undefined }}>
        <div className="ep-hist-head">
          <div>
            <div className="ep-hist-title">📋 {lang==='fr'?'Historique des entretiens':'Interview history'}</div>
            <div className="ep-hist-sub">
              {!userId?(lang==='fr'?'Connectez-vous pour accéder à vos rapports':'Sign in to access your reports')
                :`${records.length} ${lang==='fr'?`entretien${records.length>1?'s':''}·Dernier:`:`interview${records.length>1?'s':''} · Last:`} ${records[0]?formatDate(records[0].createdAt):'—'}`}
            </div>
          </div>
          <button className="ep-hist-close" onClick={onClose}>✕</button>
        </div>
        {!userId&&<div className="ep-hist-center"><div style={{fontSize:64,marginBottom:16}}>🔐</div><p style={{color:'#94a3b8',textAlign:'center',maxWidth:280}}>{lang==='fr'?'Connectez-vous pour voir vos entretiens passés':'Sign in to see your past interviews'}</p></div>}
        {userId&&loading&&<div className="ep-hist-center"><div className="ep-hist-spinner"/><p style={{color:'#64748b',marginTop:12}}>{lang==='fr'?'Chargement...':'Loading...'}</p></div>}
        {userId&&!loading&&records.length===0&&<div className="ep-hist-center"><div style={{fontSize:72,marginBottom:16}}>📭</div><p style={{color:'#94a3b8',fontSize:16}}>{lang==='fr'?'Aucun entretien enregistré':'No interview recorded'}</p></div>}
        {userId&&!loading&&records.length>0&&!selected&&(
          <div className="ep-hist-list">
            {records.map(r=>{
              const parsed=parseEntretien(r.score);const sc=getScoreColor(parsed.score);
              return(
                 <button key={r.id} className="ep-hist-card" onClick={()=>setSelected(r)}
                  style={{ background: dk ? '#1d1c16' : undefined, borderColor: dk ? '#2b2a22' : undefined }}>
                  <div className="ep-hist-score-badge" style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>
                    {parsed.score!==null?`${parsed.score}/100`:'—'}
                  </div>
                  <div className="ep-hist-card-mid">
                    <div className="ep-hist-card-date">{formatDate(r.createdAt)}</div>
                    <div className="ep-hist-card-title">{r.context||(lang==='fr'?'Entretien bourse':'Scholarship interview')}</div>
                    <div className="ep-hist-card-verdict">
                      <span style={{color:sc.color}}>{sc.icon} {sc.grade}</span>
                      {parsed.verdict&&<span style={{marginLeft:8,color:'#64748b'}}>· {parsed.verdict.slice(0,40)}</span>}
                    </div>
                  </div>
                  <div className="ep-hist-arrow">→</div>
                </button>
              );
            })}
          </div>
        )}
        {selected&&<EntretienDetail entretien={selected} onBack={()=>setSelected(null)} parseEntretien={parseEntretien} getScoreColor={getScoreColor} formatDate={formatDate} dk={dk}/>}
      </div>
      <div className="ep-hist-backdrop" onClick={onClose}/>
    </div>
  );
}

/* ── BoursePicker ── */
function BoursePicker({ bourses, userId, onSelect }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const dk = theme === 'dark';
  const [showHist, setShowHist] = useState(false);
  const [query, setQuery] = useState('');
  const q=(query||'').trim().toLowerCase();
  const filtered=q.length===0?bourses:bourses.filter(b=>(b.nom||'').toLowerCase().includes(q)||(b.pays||'').toLowerCase().includes(q)||(b.niveau||'').toLowerCase().includes(q)||String(b.financement||'').toLowerCase().includes(q));
return (
    <div className="ep-picker-root" style={{ background: dk ? '#15140f' : undefined }}>
      <div className="ep-picker-inner">
        

        <h1 className="ep-picker-title" style={{ color: dk ? '#f2efe7' : undefined }}>
          {lang==='fr'?<>Préparez votre<br/><em>entretien de bourse</em></>:<>Prepare your<br/><em>scholarship interview</em></>}
        </h1>
        <p className="ep-picker-sub" style={{ color: dk ? '#cfccc2' : undefined }}>
          {lang==='fr'
            ?<>Le jury IA vous posera <strong style={{color:'#166534'}}>{TOTAL_Q} questions</strong> adaptées à la bourse, avec analyse vocale en temps réel.</>
            :<>The AI panel will ask you <strong style={{color:'#166534'}}>{TOTAL_Q} questions</strong> tailored to the scholarship, with real-time voice analysis.</>}
        </p>

        {/* ── Search + Historique déplacés ici, sous le sous-titre ── */}
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', marginBottom:32 }}>
          <input
            placeholder={lang==='fr'?'Rechercher une bourse, pays, niveau...':'Search scholarship, country, level...'}
            value={query} onChange={e=>setQuery(e.target.value)}
            className="ep-picker-search"
            style={{ background: dk ? '#1d1c16' : undefined, color: dk ? '#f2efe7' : undefined, borderColor: dk ? '#2b2a22' : undefined }}
          />
          <button className="ep-picker-hist-btn"
            style={{ background: dk ? '#1d1c16' : undefined, color: dk ? '#f2efe7' : undefined, borderColor: dk ? '#2b2a22' : undefined }}
            onClick={()=>setShowHist(true)}>
            📋 {lang==='fr'?'Mes entretiens':'My interviews'}
          </button>
        </div>

        <div className="ep-picker-grid">
          {filtered.length===0&&(
            <div className="ep-picker-empty">
              <span style={{fontSize:36}}>🔎</span>
              <p>{lang==='fr'?'Aucune bourse trouvée.':'No scholarship found.'}</p>
            </div>
          )}
          {filtered.map(b=>(
            <div key={b.id} className="ep-bourse-card" style={{ background: dk ? '#1a1912' : undefined, borderColor: dk ? '#2b2a22' : undefined }}>
              
              <div className="ep-bourse-name" style={{ color: dk ? '#f2efe7' : undefined }}>{b.nom}</div>
              <div className="ep-bourse-meta">{b.pays} · {b.niveau}</div>
              <button className="ep-bourse-btn" onClick={()=>onSelect(b)}>🚀 {lang==='fr'?"Démarrer l'entretien":'Start interview'}</button>
            </div>
          ))}
        </div>
      </div>
      {showHist&&<HistoriquePanel userId={userId} onClose={()=>setShowHist(false)}/>}
    </div>
  );
}

/* ── EntretienSession ── */
const INTRO_ITEMS_FR = [
  ['📊','Contenu & richesse vocabulaire'],
  ['⏱','Vitesse de parole (mots/min)'],
  ['⏸','Pauses et hésitations'],
  ['🎙','Volume et stabilité vocale'],
  ['🧠','Questions et score générés par IA n8n'],
];
const INTRO_ITEMS_EN = [
  ['📊','Content & vocabulary richness'],
  ['⏱','Speech speed (words/min)'],
  ['⏸','Pauses and hesitations'],
  ['🎙','Volume and voice stability'],
  ['🧠','Questions and score generated by AI n8n'],
];
const INSTR_ITEMS_FR = [
  ['🎤','Parlez clairement — le micro transcrit en direct'],
  ['👁️','Gardez le contact visuel'],
  ['⏱️','Max 2 min par réponse'],
  ['🔊','Activez le son pour entendre les questions'],
];
const INSTR_ITEMS_EN = [
  ['🎤','Speak clearly — the mic transcribes in real time'],
  ['👁️','Maintain eye contact'],
  ['⏱️','Max 2 min per answer'],
  ['🔊','Enable sound to hear the questions'],
];


function EntretienSession({ bourse, user, conversationId, onFinish }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const dk = theme === 'dark';
  const [phase, setPhase] = useState('intro');
  const [qIndex, setQIndex]         = useState(0);
  const [currentQ, setCurrentQ]     = useState('');
  const [liveText, setLiveText]     = useState('');
  const [elapsed, setElapsed]       = useState(0);
  const [aiLoading, setAiLoading]   = useState(false);
  const [allAnswers, setAllAnswers]  = useState([]);
  const [finalScore, setFinalScore] = useState(null);
  const [camError, setCamError]     = useState(false);
  const [liveVolume, setLiveVolume]           = useState(0);
  const [liveStability, setLiveStability]     = useState(100);
  const [liveSpeakRatio, setLiveSpeakRatio]   = useState(0);
  const [livePauses, setLivePauses]           = useState(0);
  const [liveHesit, setLiveHesit]             = useState(0);
  const [liveWordCount, setLiveWordCount]     = useState(0);
  const [showHist, setShowHist]     = useState(false);

  const videoRef=useRef(null);const streamRef=useRef(null);
  const recRef=useRef(null);const timerRef=useRef(null);
  const metricsRef=useRef(null);const srRef=useRef(null);
  const analyzerRef=useRef(null);const aiLockRef=useRef(false);
  const savedRef=useRef(false);
  const liveTextRef=useRef('');const elapsedRef=useRef(0);
  const answersRef=useRef([]);const qIndexRef=useRef(0);
  const capturedRef=useRef('');const phaseRef=useRef('intro');
  const historyRef=useRef([]);

  useEffect(()=>{liveTextRef.current=liveText;},[liveText]);
  useEffect(()=>{elapsedRef.current=elapsed;},[elapsed]);
  useEffect(()=>{qIndexRef.current=qIndex;},[qIndex]);
  useEffect(()=>{phaseRef.current=phase;},[phase]);
  useEffect(()=>{initCamera();return cleanup;},[]);

  const initCamera=async()=>{
    try{const s=await navigator.mediaDevices.getUserMedia({video:true,audio:true});streamRef.current=s;if(videoRef.current){videoRef.current.srcObject=s;videoRef.current.play();}}
    catch(e){setCamError(true);}
  };

  const cleanup=()=>{
    clearInterval(timerRef.current);clearInterval(metricsRef.current);
    if(recRef.current?.state==='recording'){try{recRef.current.stop();}catch{}}
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>{try{t.stop();}catch{}});streamRef.current=null;}
    try{if(srRef.current){srRef.current.onend=null;srRef.current.stop();}}catch{}
    if(analyzerRef.current){analyzerRef.current.destroy();analyzerRef.current=null;}
    if(window.speechSynthesis)window.speechSynthesis.cancel();
  };

  const callAI=useCallback(async(payload,ctx)=>{
    if(aiLockRef.current) return{output:null};
    aiLockRef.current=true;
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),45000);
    try{
      const res=await axios.post(WEBHOOK_ROUTES.entretien,{
        text:typeof payload==='string'?payload:payload.lastAnswer||'',
        context:ctx,conversationId,
        id:user?.id||null,email:user?.email||null,
        bourse:{id:bourse.id,nom:bourse.nom,pays:bourse.pays,niveau:bourse.niveau,financement:bourse.financement},
        bourse_context:`${bourse.nom}|${bourse.pays}|${bourse.niveau}|${bourse.financement||'100%'}`,
        entretien_history:historyRef.current,
        question_index:typeof payload==='object'?(payload.questionIndex??0):0,
        total_questions:TOTAL_Q,
        voiceStats:typeof payload==='object'&&payload.voiceStats?payload.voiceStats:null,
        lang, // ← passer la langue au webhook
      },{signal:controller.signal});
      clearTimeout(timeout);aiLockRef.current=false;
      return res.data;
    }catch(err){clearTimeout(timeout);aiLockRef.current=false;return{output:null};}
  },[bourse,user,conversationId,lang]);

  const cleanQ=out=>{
    if(!out||typeof out!=='string'||out.trim().length<10) return null;
    return out.trim().replace(/^(question\s*\d+\s*[:\-–]?\s*|Q\d+\s*[:\-–]?\s*)/i,'').trim();
  };

  const FALLBACKS_FR=[
    `Pourquoi ${bourse.nom} plutôt qu'une autre bourse ?`,
    `Décrivez un projet concret que vous réaliserez grâce à cette bourse.`,
    `Quelles compétences apportez-vous à cette opportunité ?`,
    `Comment votre formation vous prépare-t-elle pour ${bourse.pays} ?`,
    `Quels sont vos objectifs à 5 ans après cette bourse ?`,
    `Comment comptez-vous maintenir le lien avec votre pays d'origine ?`,
    `Quelle difficulté anticipez-vous et comment la surmonterez-vous ?`,
  ];
  const FALLBACKS_EN=[
    `Why ${bourse.nom} over other scholarships?`,
    `Describe a concrete project you will undertake with this scholarship.`,
    `What skills do you bring to this opportunity?`,
    `How does your education prepare you for studying in ${bourse.pays}?`,
    `What are your 5-year goals after this scholarship?`,
    `How do you plan to maintain ties with your home country?`,
    `What challenge do you anticipate and how will you overcome it?`,
  ];
  const FALLBACKS = lang==='en' ? FALLBACKS_EN : FALLBACKS_FR;

  const startInterview=async()=>{
    setPhase('ai_speaking');setAiLoading(true);
    savedRef.current=false;aiLockRef.current=false;historyRef.current=[];
    const data=await callAI({lastAnswer:'',questionIndex:0},'start_entretien');
    const q=cleanQ(data?.output)||(lang==='en'
      ?`Introduce yourself and explain your motivation for the ${bourse.nom} scholarship.`
      :`Présentez-vous et expliquez votre motivation pour la bourse ${bourse.nom}.`);
    historyRef.current=[{role:'assistant',content:q}];
    setCurrentQ(q);setQIndex(0);qIndexRef.current=0;
    setAiLoading(false);await tts(q,lang);setPhase('waiting');
  };

  const startRecording=()=>{
    if(!streamRef.current||recRef.current?.state==='recording') return;
    setLiveText('');liveTextRef.current='';capturedRef.current='';
    setElapsed(0);elapsedRef.current=0;setLiveWordCount(0);setPhase('recording');
    if(analyzerRef.current) analyzerRef.current.destroy();
    analyzerRef.current=new VoiceAnalyzer(streamRef.current);
    analyzerRef.current.start();
    const mr=new MediaRecorder(streamRef.current);
    mr.ondataavailable=()=>{};mr.start(200);recRef.current=mr;
    timerRef.current=setInterval(()=>{setElapsed(prev=>{const n=prev+1;elapsedRef.current=n;if(n>=120)stopRecording();return n;});},500);
    metricsRef.current=setInterval(()=>{
      if(!analyzerRef.current) return;
      const s=analyzerRef.current.getStats();
      setLiveVolume(s.volume);setLiveStability(s.stability);
      setLiveSpeakRatio(s.speakRatio);setLivePauses(s.pauseCount);
      setLiveHesit(s.hesitations);
      setLiveWordCount(liveTextRef.current.split(/\s+/).filter(w=>w.length>1).length);
    },800);
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(SR){
      const sr=new SR();
      sr.lang=lang==='en'?'en-US':'fr-FR';
      sr.continuous=true;sr.interimResults=true;
      sr.onresult=e=>{let t='';for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript+' ';setLiveText(t.trim());liveTextRef.current=t.trim();};
      sr.onerror=()=>{try{sr.stop();}catch{}};
      sr.onend=()=>{if(phaseRef.current==='recording'){try{sr.start();}catch{}}};
      try{sr.start();}catch{}srRef.current=sr;
    }
  };

  const stopRecording=useCallback(()=>{
    clearInterval(timerRef.current);clearInterval(metricsRef.current);
    capturedRef.current=liveTextRef.current;
    if(recRef.current?.state==='recording'){try{recRef.current.stop();}catch{}}
    try{if(srRef.current){srRef.current.onend=null;srRef.current.stop();}}catch{}
    if(analyzerRef.current) analyzerRef.current.stop();
    setPhase('analyzing');
  },[]);

  useEffect(()=>{
    if(phase!=='analyzing') return;
    const go=async()=>{
      const curIdx=qIndexRef.current;const isLast=curIdx>=TOTAL_Q-1;
      const answer=capturedRef.current.trim()||(lang==='en'?'(no answer detected)':'(aucune réponse détectée)');
      const dur=elapsedRef.current;
      const voice=analyzerRef.current?analyzerRef.current.getStats():null;
      if(analyzerRef.current){analyzerRef.current.destroy();analyzerRef.current=null;}
      const wordCount=answer.split(/\s+/).filter(w=>w.length>1).length;
      const speakingSec=voice?(voice.speakRatio*dur/100):dur;
      const wpm=speakingSec>3?Math.round((wordCount/speakingSec)*60):0;
      historyRef.current.push({role:'user',content:answer,duration:dur,wordCount,wpm,voice});
      const entry={q:currentQ,a:answer,duration:dur,wordCount,wpm,voice};
      answersRef.current=[...answersRef.current,entry];
      setAllAnswers([...answersRef.current]);

      if(isLast){
        const voiceStats={
          totalAnswered:answersRef.current.filter(a=>a.a&&a.a.length>5).length,
          avgWpm:Math.round(answersRef.current.filter(a=>a.wpm>0&&a.wpm<300).reduce((s,a)=>s+a.wpm,0)/Math.max(answersRef.current.filter(a=>a.wpm>0&&a.wpm<300).length,1)),
          avgWords:Math.round(answersRef.current.reduce((s,a)=>s+(a.wordCount||0),0)/Math.max(answersRef.current.length,1)),
          totalPauses:answersRef.current.reduce((s,a)=>s+(a.voice?.pauseCount||0),0),
          totalHesitations:answersRef.current.reduce((s,a)=>s+(a.voice?.hesitations||0),0),
          avgStability:Math.round(answersRef.current.reduce((s,a)=>s+(a.voice?.stability||0),0)/Math.max(answersRef.current.length,1)),
          scoresParQuestion:answersRef.current.map((a,i)=>({q:i+1,words:a.wordCount||0,wpm:a.wpm||0,answer:(a.a||'').slice(0,500)})),
        };
        const data=await callAI({lastAnswer:answer,questionIndex:curIdx,voiceStats},'fin_entretien');
        const scoreText=data?.output||data?.message||data?.text||(lang==='en'?'Error — check n8n connection':'Erreur — vérifiez la connexion n8n');
        setFinalScore(scoreText);setPhase('result');
        if(!savedRef.current){savedRef.current=true;await saveEntretien(user?.id,scoreText,conversationId,bourse.nom);}
        await tts(lang==='en'?'Interview completed. Here is your full evaluation.':'Entretien terminé. Voici votre évaluation complète.',lang);
      } else {
        const nextIdx=curIdx+1;
        const data=await callAI({lastAnswer:answer,questionIndex:nextIdx},'entretien');
        const nextQ=cleanQ(data?.output||data?.message||data?.text);
        if(!nextQ){
          const used=new Set(historyRef.current.filter(h=>h.role==='assistant').map(h=>h.content.toLowerCase().slice(0,30)));
          const fb=FALLBACKS.find(q=>!used.has(q.toLowerCase().slice(0,30)))||FALLBACKS[nextIdx%FALLBACKS.length];
          historyRef.current.push({role:'assistant',content:fb});
          setQIndex(nextIdx);qIndexRef.current=nextIdx;setCurrentQ(fb);
          setLiveText('');liveTextRef.current='';setElapsed(0);elapsedRef.current=0;
          setPhase('ai_speaking');await tts(fb,lang);setPhase('waiting');return;
        }
        historyRef.current.push({role:'assistant',content:nextQ});
        setQIndex(nextIdx);qIndexRef.current=nextIdx;setCurrentQ(nextQ);
        setLiveText('');liveTextRef.current='';setElapsed(0);elapsedRef.current=0;
        setPhase('ai_speaking');await tts(nextQ,lang);setPhase('waiting');
      }
    };
    go();
  },[phase]);

  const parseScore=txt=>{
    if(!txt) return{};
    const get=key=>{const m=txt.match(new RegExp(`${key}\\s*[:\\-]\\s*([\\s\\S]+?)(?=\\n\\s*[-•*]?\\s*(?:SCORE|VERDICT|POINTS|CONSEILS|COMMENTAIRE)|$)`,'i'));return m?m[1].trim():null;};
    return{
      score:txt.match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i)?.[1],
      verdict:txt.match(/VERDICT\s*[:\-]\s*(.+)/i)?.[1]?.trim(),
      forts:get('POINTS FORTS'),fix:get('POINTS À AMÉLIORER'),
      conseils:get('CONSEILS PERSONNALISÉS'),
    };
  };

  const parsed=parseScore(finalScore);
  const totalDur=allAnswers.reduce((a,b)=>a+b.duration,0);
  const avgWords=allAnswers.length?Math.round(allAnswers.reduce((a,b)=>a+(b.wordCount||0),0)/allAnswers.length):0;
  const validWpm=allAnswers.filter(a=>a.wpm>0&&a.wpm<300);
  const avgWpm=validWpm.length?Math.round(validWpm.reduce((a,b)=>a+b.wpm,0)/validWpm.length):0;

  const metrics=[
    {label:lang==='fr'?'Volume micro':'Mic volume',    v:liveVolume,     icon:'🎙'},
    {label:lang==='fr'?'Stabilité voix':'Voice stability', v:liveStability,  icon:'📊'},
    {label:lang==='fr'?'Ratio parole':'Speech ratio',   v:liveSpeakRatio, icon:'⏱'},
  ];
  const counters=[
    {icon:'⏸',val:livePauses,    label:lang==='fr'?'pauses':'pauses',   warn:livePauses>5},
    {icon:'💬',val:liveHesit,     label:lang==='fr'?'s hésit.':'s hesit.',warn:liveHesit>8},
    {icon:'📝',val:liveWordCount, label:lang==='fr'?'mots':'words',       warn:false},
  ];

  const ANALYZE_STEPS=lang==='en'
    ?['Content analysis','Scholarship relevance','Generating next question','Scoring in progress…']
    :['Analyse du contenu','Pertinence à la bourse','Génération de la prochaine question','Score en cours…'];

  return (
        <div className="ep-session-root" style={{ background: dk ? '#15140f' : undefined, color: dk ? '#f2efe7' : undefined }}>
            <div className="ep-topbar" style={{ background: dk ? '#1a1912' : undefined, borderColor: dk ? '#2b2a22' : undefined }}>

        <div className="ep-topbar-left">
          <div className={`ep-status-dot ${phase==='recording'?'recording':'idle'}`}/>
          <span className="ep-bourse-nom">{bourse.nom}</span>
          <span className="ep-sep">·</span>
          <span className="ep-bourse-meta-top">{bourse.pays} · {bourse.niveau}</span>
        </div>
        <div className="ep-progress">
          {[...Array(TOTAL_Q)].map((_,i)=>(
            <div key={i} className={`ep-progress-dot ${i<qIndex?'done':i===qIndex?'current':'future'}`}/>
          ))}
          {phase!=='intro'&&phase!=='result'&&<span className="ep-progress-label">Q{qIndex+1}/{TOTAL_Q}</span>}
        </div>
        <div className="ep-topbar-actions">
          <button className="ep-hist-btn" onClick={()=>setShowHist(true)}>📋 {lang==='fr'?'Historique':'History'}</button>
          <button className="ep-quit-btn" onClick={()=>{cleanup();onFinish();}}>✕ {lang==='fr'?'Quitter':'Quit'}</button>
        </div>
      </div>

      <div className="ep-body">
        <div className="ep-left" style={{ background: dk ? '#15140f' : undefined }}>
          <div className="ep-video-box">
            {camError
              ?<div className="ep-no-cam"><span style={{fontSize:40}}>📷</span><p>{lang==='fr'?'Caméra indisponible':'Camera unavailable'}</p><small>{lang==='fr'?"L'entretien continue":'Interview continues'}</small></div>
              :<video ref={videoRef} autoPlay muted playsInline className="ep-video"/>
            }
            {phase==='recording'&&<div className="ep-rec-badge"><div className="ep-rec-dot"/>REC &nbsp; {fmt(elapsed)}</div>}
            {phase==='ai_speaking'&&(
              <div className="ep-ai-overlay">
                <div className="ep-wave-row">{[...Array(5)].map((_,i)=><div key={i} className="ep-wave-bar" style={{animationDelay:`${i*0.12}s`}}/>)}</div>
                {lang==='fr'?'Jury IA parle…':'AI Panel speaking…'}
              </div>
            )}
            <div className="ep-meter-bg"><div className="ep-meter-fill" style={{width:`${liveVolume}%`}}/></div>
          </div>

          {phase!=='intro'&&phase!=='result'&&(
            <div className="ep-metrics-box" style={{ background: dk ? '#1a1912' : undefined, borderColor: dk ? '#2b2a22' : undefined }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <div className="ep-metrics-head">{lang==='fr'?'ANALYSE VOCALE EN DIRECT':'LIVE VOICE ANALYSIS'}</div>
                {phase==='recording'&&<div style={{fontSize:10,color: dk ? '#a19f96' : '#475569'}}>{liveWordCount} {lang==='fr'?'mots':'words'}</div>}
              </div>
              {metrics.map(m=>(
                <div key={m.label} className="ep-metric-row">
                  <span className="ep-metric-icon">{m.icon}</span>
                  <div className="ep-metric-bar-bg"><div className="ep-metric-bar-fill" style={{width:`${m.v}%`,background:m.v>75?'linear-gradient(90deg,#059669,#34d399)':m.v>45?'linear-gradient(90deg,#d97706,#fbbf24)':'linear-gradient(90deg,#dc2626,#f87171)'}}/></div>
                  <span className="ep-metric-pct">{m.v}%</span>
                  <span className="ep-metric-label">{m.label}</span>
                </div>
              ))}
              <div className="ep-counter-grid">
                {counters.map(c=>(
                  <div key={c.label} className={`ep-counter-item ${c.warn?'warn':'normal'}`}>
                    <div className={`ep-counter-val ${c.warn?'warn':'normal'}`}>{c.val}</div>
                    <div className="ep-counter-lbl">{c.icon} {c.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="ep-right" style={{ background: dk ? '#1d1c16' : undefined }}>
          {phase==='intro'&&(
            <div style={{width:'100%',maxWidth:500,display:'flex',flexDirection:'column',height:'100%'}}>
              <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:14,paddingBottom:8}}>
                <div style={{textAlign:'center',fontSize:48}}>🧑‍⚖️</div>
                <h2 className="ep-panel-title" style={{fontSize:'1.45rem'}}>{lang==='fr'?'Prêt pour votre entretien ?':'Ready for your interview?'}</h2>
                <p className="ep-panel-subtitle">
                  {lang==='fr'
                    ? <>{TOTAL_Q} questions sur <strong style={{color:'#c4b5fd'}}>{bourse.nom}</strong></>
                    : <>{TOTAL_Q} questions about <strong style={{color:'#c4b5fd'}}>{bourse.nom}</strong></>}
                </p>
                <div style={{padding:'14px 16px',borderRadius:12,background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.2)'}}>
                  <div style={{fontSize:11,color:'#818cf8',fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>{lang==='fr'?'Analyse en temps réel':'Real-time analysis'}</div>
                  {(lang==='fr'
                    ? INTRO_ITEMS_FR
                    : INTRO_ITEMS_EN
                  ).map(([ic,tx])=>(
                    <div key={tx} style={{display:'flex',alignItems:'center',gap:10,fontSize:12,color:'#94a3b8',marginBottom:6}}><span>{ic}</span><span>{tx}</span></div>
                  ))}
                </div>
                {(lang==='fr' ? INSTR_ITEMS_FR : INSTR_ITEMS_EN).map(([ic,tx])=>(
                  <div key={tx} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 14px',borderRadius:10,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',fontSize:13,color:'#cbd5e1'}}><span>{ic}</span><span>{tx}</span></div>
                ))}
              </div>
              <div style={{flexShrink:0,paddingTop:12}}>
                <button className="ep-btn-start" onClick={startInterview}>🚀 &nbsp; {lang==='fr'?"Démarrer l'entretien":'Start interview'}</button>
              </div>
            </div>
          )}

          {['ai_speaking','waiting','recording','analyzing'].includes(phase)&&(
            <div className="ep-panel">
              <div className="ep-q-head">
                <div className="ep-q-badge">{lang==='fr'?`Question ${qIndex+1} / ${TOTAL_Q}`:`Question ${qIndex+1} / ${TOTAL_Q}`}</div>
                {phase==='recording'&&<div className="ep-timer-badge">{fmt(elapsed)}</div>}
              </div>
              <div className="ep-q-bubble" style={{ background: dk ? '#1a1912' : undefined, borderColor: dk ? '#2b2a22' : undefined, color: dk ? '#f2efe7' : undefined }}>

                {aiLoading
                  ?<div className="ep-loading-dots">{[0,.15,.3].map(d=><div key={d} className="ep-dot" style={{animationDelay:`${d}s`}}/>)}</div>
                  :<p style={{margin:0,lineHeight:1.7}}>{currentQ}</p>
                }
              </div>
              {phase==='recording'&&liveText&&(
                <div className="ep-live-box" style={{ background: dk ? '#1a1912' : undefined, borderColor: dk ? '#2b2a22' : undefined }}>

                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <div className="ep-live-head">📝 {lang==='fr'?'TRANSCRIPTION EN DIRECT':'LIVE TRANSCRIPTION'}</div>
                    <div style={{fontSize:10,color:'#64748b'}}>{liveWordCount} {lang==='fr'?'mots':'words'} {liveWordCount>=40?'✓':liveWordCount>0?`(+${40-liveWordCount})`:''}</div>
                  </div>
                  <p className="ep-live-text">{liveText}</p>
                  <div className="ep-live-progress-bg">
                    <div className="ep-live-progress-fill" style={{width:`${Math.min(100,(liveWordCount/80)*100)}%`,background:liveWordCount>=40?'linear-gradient(90deg,#059669,#34d399)':'linear-gradient(90deg,#d97706,#fbbf24)'}}/>
                  </div>
                </div>
              )}
              {phase==='analyzing'&&(
                <div className="ep-analyze-box" style={{ background: dk ? '#1a1912' : undefined, borderColor: dk ? '#2b2a22' : undefined }}>

                  <div className="ep-analyze-spinner"/>
                  <div>
                    <div style={{color:'#e2e8f0',fontWeight:600,marginBottom:10}}>{lang==='fr'?"L'IA analyse votre réponse…":'AI is analyzing your answer…'}</div>
                    {ANALYZE_STEPS.map((s,i)=>(
                      <div key={s} className="ep-analyze-item" style={{animationDelay:`${i*.3}s`}}>
                        <div className="ep-analyze-dot"/>
                        <span style={{color:'#94a3b8',fontSize:13}}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                {phase==='waiting'&&<button className="ep-btn-rec" onClick={startRecording}><span style={{fontSize:20}}>🎤</span> {lang==='fr'?'Répondre à la question':'Answer the question'}</button>}
                {phase==='recording'&&<button className="ep-btn-stop" onClick={stopRecording}><span style={{fontSize:20}}>⏹</span> {lang==='fr'?'Terminer ma réponse':'End my answer'}</button>}
                {(phase==='ai_speaking'||phase==='analyzing')&&(
                  <div className="ep-hint">{phase==='ai_speaking'?(lang==='fr'?'🔊 Écoutez la question…':'🔊 Listen to the question…'):(lang==='fr'?'⏳ Analyse IA en cours…':'⏳ AI analysis in progress…')}</div>
                )}
              </div>
            </div>
          )}

          {phase==='result'&&(
            <div className="ep-panel" style={{overflowY:'auto',gap:16,padding:'20px 24px'}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:50,marginBottom:10}}>🏆</div>
                <h2 className="ep-panel-title">{lang==='fr'?'Résultats de l\'entretien':'Interview results'}</h2>
                <p style={{color:'#64748b',fontSize:13}}>{bourse.nom} · {bourse.pays}</p>
                {user?.id&&<p style={{color:'#10b981',fontSize:12,marginTop:4}}>✅ {lang==='fr'?'Sauvegardé dans votre historique':'Saved in your history'}</p>}
              </div>
              <div className="ep-result-stats">
                {[
                  {v:parsed.score?`${parsed.score}/100`:'—', lFr:'Score final',       lEn:'Final score'},
                  {v:fmt(totalDur),                          lFr:'Durée totale',      lEn:'Total duration'},
                  {v:`${avgWpm} m/min`,                      lFr:'Vitesse moy.',      lEn:'Avg. speed'},
                  {v:`${avgWords} ${lang==='fr'?'mots':'words'}`, lFr:'Mots / réponse', lEn:'Words / answer'},
                ].map(s=>(
                  <div key={s.lFr} className="ep-stat-card" style={{ background: dk ? '#1a1912' : undefined }}>
                    <div className="ep-stat-val">{s.v}</div>
                    <div className="ep-stat-lbl">{lang==='fr'?s.lFr:s.lEn}</div>
                  </div>
                ))}
              </div>
              {parsed.verdict&&(
                <div style={{padding:'12px 18px',borderRadius:12,background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.2)',textAlign:'center'}}>
                  <span style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>{lang==='fr'?'VERDICT':'VERDICT'}</span>
                  <span style={{fontSize:16,fontWeight:700,color:'#34d399'}}>{parsed.verdict}</span>
                </div>
              )}
              {parsed.forts&&<div className="ep-section-card"><div className="ep-section-head" style={{color:'#34d399'}}>✅ {lang==='fr'?'POINTS FORTS':'STRENGTHS'}</div><div className="ep-section-body">{parsed.forts}</div></div>}
              {parsed.fix&&<div className="ep-section-card warning"><div className="ep-section-head" style={{color:'#fbbf24'}}>⚠️ {lang==='fr'?'POINTS À AMÉLIORER':'AREAS TO IMPROVE'}</div><div className="ep-section-body">{parsed.fix}</div></div>}
              {parsed.conseils&&<div className="ep-section-card purple"><div className="ep-section-head" style={{color:'#a78bfa'}}>💡 {lang==='fr'?'CONSEILS PERSONNALISÉS':'PERSONALIZED TIPS'}</div><div className="ep-section-body">{parsed.conseils}</div></div>}
              {!parsed.forts&&finalScore&&(
                <div style={{padding:'18px 20px',borderRadius:14,background:'rgba(16,185,129,.04)',border:'1px solid rgba(16,185,129,.12)',maxHeight:300,overflowY:'auto'}}>
                  <div style={{fontSize:10,letterSpacing:2,color: dk ? '#a19f96' : '#475569',fontWeight:700,marginBottom:10}}>{lang==='fr'?'ÉVALUATION DU JURY IA':'AI PANEL EVALUATION'}</div>
                  <div style={{color: dk ? '#a19f96' : '#475569',fontSize:14,lineHeight:1.75,whiteSpace:'pre-wrap'}}>{finalScore}</div>
                </div>
              )}
              <div>
                <div style={{fontSize:10,letterSpacing:2,color: dk ? '#a19f96' : '#475569',fontWeight:700,marginBottom:10}}>{lang==='fr'?'DÉROULEMENT — STATISTIQUES RÉELLES':'BREAKDOWN — ACTUAL STATISTICS'}</div>
                <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:10}}>
                  {allAnswers.map((a,i)=>(
                    <div key={i} className="ep-answer-item" style={{ background: dk ? '#1a1912' : undefined, borderColor: dk ? '#2b2a22' : undefined }}>

                      <div className="ep-answer-num">{i+1}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,color:'#cbd5e1',marginBottom:3}}>{a.q.slice(0,70)}{a.q.length>70?'…':''}</div>
                        <div style={{fontSize:11,color:'#64748b'}}>⏱ {fmt(a.duration)} · 📝 {a.wordCount||0} {lang==='fr'?'mots':'words'} · 🏃 {a.wpm||0} {lang==='fr'?'m/min':'w/min'}{a.voice&&` · ⏸ ${a.voice.pauseCount||0} ${lang==='fr'?'pauses':'pauses'} · 💬 ${a.voice.hesitations||0}s`}</div>
                        {a.a&&a.a!=='(aucune réponse détectée)'&&a.a!=='(no answer detected)'&&<div style={{fontSize:11,color: dk ? '#a19f96' : '#475569',marginTop:4,fontStyle:'italic'}}>"{a.a.slice(0,80)}{a.a.length>80?'…':''}"</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',gap:12}}>
                <button className="ep-btn-retry" onClick={()=>{
                  answersRef.current=[];setAllAnswers([]);setFinalScore(null);
                  setQIndex(0);qIndexRef.current=0;setCurrentQ('');
                  savedRef.current=false;aiLockRef.current=false;
                  historyRef.current=[];setPhase('intro');
                }}>🔄 {lang==='fr'?'Recommencer':'Restart'}</button>
                <button className="ep-btn-done" onClick={()=>{cleanup();onFinish();}}>✅ {lang==='fr'?'Terminer':'Finish'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {showHist&&<HistoriquePanel userId={user?.id} onClose={()=>setShowHist(false)}/>}
    </div>
  );
}

/* ── PAGE PRINCIPALE ── */
export default function EntretienPage({ user, bourses=[], conversationId, setView, handleQuickReply }) {
  const { lang } = useT();
  const [showLogin, setShowLogin] = useState(false);
  const [selected, setSelected]  = useState(null);

  if (!user) return (
    <>
      <div className="ep-locked">
        <div className="ep-locked-card">
          <div style={{ fontSize:56, marginBottom:16 }}>🧑‍⚖️</div>
          <h3>{lang==='fr'?'Entretien virtuel non disponible':'AI interview unavailable'}</h3>
          <p>{lang==='fr'
            ?'Connectez-vous pour pratiquer vos entretiens de bourse avec notre jury IA et obtenir une évaluation personnalisée.'
            :'Sign in to practice your scholarship interviews with our AI panel and get personalized feedback.'}</p>
          <button className="ep-lock-btn" onClick={()=>setShowLogin(true)}>🔐 {lang==='fr'?'Se connecter':'Sign in'}</button>
        </div>
      </div>
      {showLogin&&<LoginModal onClose={()=>setShowLogin(false)}/>}
    </>
  );

  if (!selected) return <BoursePicker bourses={bourses} userId={user?.id} onSelect={setSelected}/>;
  return <EntretienSession bourse={selected} user={user} conversationId={conversationId} onFinish={()=>setSelected(null)}/>;
}