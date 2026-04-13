import React, { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '@/config/axiosInstance';
import axios from 'axios';
import { WEBHOOK_ROUTES } from '@/config/routes';
import { API_ROUTES } from '@/config/routes';



const TOTAL_Q = 8;

const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

// ── TTS ───────────────────────────────────────────────────────────────────────
function tts(text) {
  return new Promise(resolve => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR'; u.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const fr = voices.find(v => v.lang.startsWith('fr'));
    if (fr) u.voice = fr;
    u.onend = resolve; u.onerror = resolve;
    window.speechSynthesis.speak(u);
  });
}

// ── Sauvegarder entretien dans Payload ───────────────────────────────────────
async function saveEntretien(userId, scoreText, conversationId, bourseNom) {
  if (!userId) return;
  try {
    await axiosInstance.post('/api/entretiens', {
      user:           userId,
      score:          scoreText,
      conversationId: conversationId || `entretien-${Date.now()}`,
      context:        bourseNom || '',
    });
    console.log('✅ Entretien sauvegardé');
  } catch(e) { console.error('❌ Save entretien:', e.message); }
}

// ── Analyse vocale réelle (Web Audio API) ─────────────────────────────────────
class VoiceAnalyzer {
  constructor(stream) {
    this.ctx      = new AudioContext();
    this.src      = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.src.connect(this.analyser);
    this.buf    = new Float32Array(this.analyser.fftSize);
    this.running       = false;
    this.speakingMs    = 0;
    this.totalMs       = 0;
    this.silenceStart  = null;
    this.pauseCount    = 0;
    this.hesitationMs  = 0;
    this.volumeHistory = [];
    this.lastTs        = Date.now();
  }
  start() { this.running = true; this._tick(); }
  _tick() {
    if (!this.running) return;
    const now = Date.now();
    const dt  = now - this.lastTs; this.lastTs = now;
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
    } else {
      this.silenceStart = null;
      this.speakingMs  += dt;
    }
    requestAnimationFrame(() => this._tick());
  }
  getStats() {
    const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    const vol = avg(this.volumeHistory);
    const recent = this.volumeHistory.slice(-30);
    const variance = recent.length > 5
      ? Math.sqrt(recent.reduce((a,b,_,arr) => { const m=avg(arr); return a+(b-m)**2; },0)/recent.length)
      : 0;
    return {
      volume:      Math.round(vol),
      stability:   Math.round(Math.min(100, 100 - variance*2)),
      speakRatio:  this.totalMs > 0 ? Math.round((this.speakingMs/this.totalMs)*100) : 0,
      pauseCount:  this.pauseCount,
      hesitations: Math.round(this.hesitationMs/1000),
    };
  }
  stop()    { this.running = false; }
  destroy() { this.running = false; try { this.ctx.close(); } catch {} }
}

// ── HistoriquePanel ───────────────────────────────────────────────────────────
function HistoriquePanel({ userId, onClose }) {
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    axiosInstance.get('/api/entretiens', {
      params: { 'where[user][equals]': userId, sort: '-createdAt', limit: 20 },
    })
      .then(res => { setRecords(res.data.docs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  const parseEntretien = (text) => {
    if (!text) return { score: null, verdict: '', details: [], conseils: [] };
    const scoreMatch = text.match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
    const verdictMatch = text.match(/VERDICT\s*[:\-]\s*(.+?)(?=\n|$)/i);
    const verdict = verdictMatch ? verdictMatch[1].trim() : '';
    const extractSection = (title) => {
      const regex = new RegExp(`${title}\\s*[:\\-]\\s*([\\s\\S]+?)(?=\\n\\s*[-•*]?\\s*(?:POINTS FORTS|POINTS À AMÉLIORER|CONSEILS|VERDICT|SCORE|$))`, 'i');
      const match = text.match(regex);
      if (match) return match[1].trim().split(/\n/).filter(l => l.trim()).map(l => l.replace(/^[-•*]\s*/, '').trim());
      return [];
    };
    const pointsForts = extractSection('POINTS FORTS');
    const pointsAmeliorer = extractSection('POINTS À AMÉLIORER');
    const conseils = extractSection('CONSEILS PERSONNALISÉS');
    const questionMetrics = [];
    const qRegex = /Question\s*(\d+)[:\s]*([^\n]+).*?mots[:\s]*(\d+).*?m\/min[:\s]*(\d+)/gi;
    let match;
    while ((match = qRegex.exec(text)) !== null) {
      questionMetrics.push({ num: parseInt(match[1]), answer: match[2].trim(), words: parseInt(match[3]) || 0, wpm: parseInt(match[4]) || 0 });
    }
    return {
      score, verdict, pointsForts, pointsAmeliorer, conseils, questionMetrics, rawText: text
    };
  };

  const getScoreColor = (score) => {
    if (score === null) return { bg: 'rgba(100,116,139,.15)', color: '#94a3b8', border: 'rgba(100,116,139,.3)', grade: 'Non évalué', icon: '📊' };
    if (score >= 85) return { bg: 'rgba(16,185,129,.2)', color: '#34d399', border: 'rgba(16,185,129,.4)', grade: 'Excellent', icon: '🏆' };
    if (score >= 70) return { bg: 'rgba(16,185,129,.15)', color: '#34d399', border: 'rgba(16,185,129,.35)', grade: 'Très bien', icon: '🌟' };
    if (score >= 55) return { bg: 'rgba(245,158,11,.15)', color: '#fbbf24', border: 'rgba(245,158,11,.35)', grade: 'Bien', icon: '👍' };
    if (score >= 40) return { bg: 'rgba(245,158,11,.12)', color: '#fbbf24', border: 'rgba(245,158,11,.3)', grade: 'À améliorer', icon: '📈' };
    return { bg: 'rgba(239,68,68,.15)', color: '#f87171', border: 'rgba(239,68,68,.35)', grade: 'À renforcer', icon: '⚠️' };
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return `Aujourd'hui, ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return `Hier, ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  if (!userId) return (
    <div style={H.overlay}>
      <div style={H.drawer}>
        <div style={H.dHead}>
          <div><div style={H.dTitle}>📋 Historique des entretiens</div><div style={H.dSub}>Connectez-vous pour accéder à vos rapports</div></div>
          <button style={H.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={H.center}>
          <div style={{fontSize:64, marginBottom:16}}>🔐</div>
          <p style={{color:'#94a3b8', textAlign:'center', maxWidth:280}}>Connectez-vous pour voir vos entretiens passés et suivre votre progression</p>
        </div>
      </div>
      <div style={H.backdrop} onClick={onClose}/>
    </div>
  );

  return (
    <div style={H.overlay}>
      <div style={H.drawer}>
        <div style={H.dHead}>
          <div>
            <div style={H.dTitle}>📋 Historique des entretiens</div>
            <div style={H.dSub}>
              {records.length} entretien{records.length > 1 ? 's' : ''} · 
              Dernier: {records[0] ? formatDate(records[0].createdAt) : '—'}
            </div>
          </div>
          <button style={H.closeBtn} onClick={onClose}>✕</button>
        </div>
        
        {loading && (
          <div style={H.center}>
            <div style={H.spinner} />
            <p style={{color:'#64748b', marginTop:12}}>Chargement de votre historique...</p>
          </div>
        )}
        
        {!loading && records.length === 0 && (
          <div style={H.center}>
            <div style={{fontSize:72, marginBottom:16}}>📭</div>
            <p style={{color:'#94a3b8', fontSize:16, marginBottom:8}}>Aucun entretien enregistré</p>
            <p style={{color:'#64748b', fontSize:13, textAlign:'center', maxWidth:280}}>Commencez un entretien pour voir vos résultats ici</p>
          </div>
        )}
        
        {!loading && records.length > 0 && !selected && (
          <div style={H.list}>
            {records.map(r => {
              const parsed = parseEntretien(r.score);
              const scoreColor = getScoreColor(parsed.score);
              return (
                <button key={r.id} style={H.card} className="hcard" onClick={() => setSelected(r)}>
                  <div style={{...H.scoreBadge, background: scoreColor.bg, color: scoreColor.color, border: `1px solid ${scoreColor.border}`}}>
                    {parsed.score !== null ? `${parsed.score}/100` : '—'}
                  </div>
                  <div style={H.cardMid}>
                    <div style={H.cardDate}>{formatDate(r.createdAt)}</div>
                    <div style={H.cardTitle}>{r.context || 'Entretien bourse'}</div>
                    <div style={H.cardVerdict}>
                      <span style={{color: scoreColor.color}}>{scoreColor.icon} {scoreColor.grade}</span>
                      {parsed.verdict && <span style={{marginLeft: 8, color: '#64748b'}}>· {parsed.verdict.slice(0, 40)}</span>}
                    </div>
                  </div>
                  <div style={H.cardArrow}>→</div>
                </button>
              );
            })}
          </div>
        )}
        
        {selected && (
          <EntretienDetail 
            entretien={selected} 
            onBack={() => setSelected(null)} 
            parseEntretien={parseEntretien}
            getScoreColor={getScoreColor}
            formatDate={formatDate}
          />
        )}
      </div>
      <div style={H.backdrop} onClick={onClose}/>
      <style>{`
        .hcard { transition: all 0.2s ease; }
        .hcard:hover { background: rgba(139, 92, 246, 0.08) !important; border-color: rgba(139, 92, 246, 0.35) !important; transform: translateX(4px); }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

function EntretienDetail({ entretien, onBack, parseEntretien, getScoreColor, formatDate }) {
  const [activeTab, setActiveTab] = useState('summary');
  const parsed = parseEntretien(entretien.score);
  const scoreColor = getScoreColor(parsed.score);
  
  return (
    <div style={D.container}>
      <button style={D.backBtn} onClick={onBack}><span style={{fontSize:18}}>←</span> Retour à la liste</button>
      
      <div style={D.header}>
        <div style={D.headerTop}>
          <div style={D.bourseTag}><span style={{fontSize:20}}>🎓</span><span>{entretien.context || 'Entretien de bourse'}</span></div>
          <div style={D.dateTag}><span>📅</span><span>{formatDate(entretien.createdAt)}</span></div>
        </div>
        <div style={D.scoreSection}>
          <div style={{...D.scoreCircle, background: scoreColor.bg, border: `2px solid ${scoreColor.color}`}}>
            <span style={D.scoreValue}>{parsed.score !== null ? parsed.score : '?'}</span>
            <span style={D.scoreMax}>/100</span>
          </div>
          <div style={D.scoreInfo}>
            <div style={{...D.scoreGrade, color: scoreColor.color}}>{scoreColor.icon} {scoreColor.grade}</div>
            {parsed.verdict && <div style={D.scoreVerdict}>{parsed.verdict}</div>}
          </div>
        </div>
      </div>
      
      <div style={D.tabs}>
        {['summary', 'strengths', 'advice', 'details'].map(tab => (
          <button key={tab} style={{...D.tab, ...(activeTab === tab ? D.tabActive : {})}} onClick={() => setActiveTab(tab)}>
            {tab === 'summary'   && '📊 Résumé'}
            {tab === 'strengths' && '✅ Analyse'}
            {tab === 'advice'    && '💡 Conseils'}
            {tab === 'details'   && '📝 Détails'}
          </button>
        ))}
      </div>
      
      <div style={D.content}>
        {activeTab === 'summary' && (
          <div style={D.summaryContent}>
            <div style={D.statsGrid}>
              <div style={D.statItem}><div style={D.statIcon}>⏱️</div><div style={D.statLabel}>Durée totale</div><div style={D.statValue}>{parsed.questionMetrics.length > 0 ? `${Math.floor(parsed.questionMetrics.length * 1.5)}:00` : '—'}</div></div>
              <div style={D.statItem}><div style={D.statIcon}>📝</div><div style={D.statLabel}>Questions</div><div style={D.statValue}>{parsed.questionMetrics.length || '8'}</div></div>
              <div style={D.statItem}><div style={D.statIcon}>🎯</div><div style={D.statLabel}>Score</div><div style={D.statValue}>{parsed.score !== null ? `${parsed.score}/100` : '—'}</div></div>
            </div>
            
            {parsed.pointsForts.length > 0 && (
              <div style={D.section}>
                <div style={D.sectionTitle}>✅ Points forts identifiés</div>
                <ul style={D.list}>{parsed.pointsForts.slice(0, 3).map((p, i) => <li key={i} style={D.listItem}>{p}</li>)}</ul>
              </div>
            )}
            
            {parsed.pointsAmeliorer.length > 0 && (
              <div style={D.section}>
                <div style={D.sectionTitle}>📈 Axes d'amélioration</div>
                <ul style={D.list}>{parsed.pointsAmeliorer.slice(0, 3).map((p, i) => <li key={i} style={D.listItem}>{p}</li>)}</ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'strengths' && (
          <div style={D.strengthsContent}>
            {parsed.pointsForts.length > 0 && (
              <div style={D.section}>
                <div style={{...D.sectionTitle, color: '#34d399'}}>✅ POINTS FORTS</div>
                <ul style={D.list}>{parsed.pointsForts.map((p, i) => <li key={i} style={D.listItem}><span style={{color: '#34d399', marginRight: 8}}>✓</span>{p}</li>)}</ul>
              </div>
            )}
            {parsed.pointsAmeliorer.length > 0 && (
              <div style={{...D.section, marginTop: 24}}>
                <div style={{...D.sectionTitle, color: '#fbbf24'}}>⚠️ POINTS À AMÉLIORER</div>
                <ul style={D.list}>{parsed.pointsAmeliorer.map((p, i) => <li key={i} style={D.listItem}><span style={{color: '#fbbf24', marginRight: 8}}>!</span>{p}</li>)}</ul>
              </div>
            )}
            {parsed.questionMetrics.length > 0 && (
              <div style={{...D.section, marginTop: 24}}>
                <div style={D.sectionTitle}>📊 Performance par question</div>
                <div style={D.questionsList}>
                  {parsed.questionMetrics.map((q, i) => (
                    <div key={i} style={D.questionItem}>
                      <div style={D.questionNum}>Q{q.num || i+1}</div>
                      <div style={D.questionStats}>
                        <span style={D.wordCount}>{q.words || '—'} mots</span>
                        <span style={D.wpm}>{q.wpm || '—'} mots/min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'advice' && (
          <div style={D.adviceContent}>
            {parsed.conseils.length > 0 ? (
              <div style={D.section}>
                <div style={{...D.sectionTitle, color: '#a78bfa'}}>💡 CONSEILS PERSONNALISÉS</div>
                <ul style={D.list}>{parsed.conseils.map((c, i) => <li key={i} style={{...D.listItem, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.05)'}}><span style={{fontSize: 18, marginRight: 12}}>🎯</span><span>{c}</span></li>)}</ul>
              </div>
            ) : (
              <div style={D.emptyAdvice}><span style={{fontSize: 48}}>📝</span><p>Des conseils personnalisés apparaîtront ici après votre entretien</p></div>
            )}
            
            <div style={D.motivationCard}>
              <div style={D.motivationQuote}>"La préparation est la clé du succès. Chaque entretien est une opportunité d'apprendre et de progresser."</div>
              <div style={D.motivationAuthor}>— Jury IA</div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div style={D.detailsContent}>
            <div style={D.section}>
              <div style={D.sectionTitle}>📄 Rapport complet</div>
              <div style={D.rawContent}>
                {parsed.rawText.split('\n').map((line, i) => {
                  if (line.match(/SCORE|VERDICT|POINTS FORTS|POINTS À AMÉLIORER|CONSEILS/i)) return <div key={i} style={D.rawHeader}>{line}</div>;
                  if (line.trim() && line.match(/^[-•*]/)) return <div key={i} style={D.rawBullet}>{line}</div>;
                  if (line.trim()) return <div key={i} style={D.rawLine}>{line}</div>;
                  return <div key={i} style={{height: 8}} />;
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div style={D.actions}>
        <button style={D.actionBtn} onClick={() => window.print()}>🖨️ Imprimer</button>
        <button style={D.actionBtn} onClick={() => { navigator.clipboard.writeText(parsed.rawText); alert('Rapport copié dans le presse-papier'); }}>📋 Copier</button>
      </div>
    </div>
  );
}

const D = {
  container:       {flex:1,overflowY:'auto',padding:'20px 24px',display:'flex',flexDirection:'column',gap:20,animation:'slideIn 0.3s ease'},
  backBtn:         {alignSelf:'flex-start',background:'#eff6ff',border:'1px solid #bfdbfe',color:'#1a3a6b',padding:'8px 16px',borderRadius:6,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',gap:6},
  header:          {background:'#f8fafc',borderRadius:20,padding:'20px',border:'1px solid rgba(15,23,42,0.04)'},
  headerTop:       {display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12},
  bourseTag:       {display:'flex',alignItems:'center',gap:8,padding:'6px 14px',background:'#f8fafc',borderRadius:20,fontSize:13,fontWeight:600,color:'#475569'},
  dateTag:         {display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#475569'},
  scoreSection:    {display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'},
  scoreCircle:     {width:100,height:100,borderRadius:'50%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2},
  scoreValue:      {fontSize:36,fontWeight:800,lineHeight:1,color:'#0f172a'},
  scoreMax:        {fontSize:12,opacity:0.7},
  scoreInfo:       {flex:1},
  scoreGrade:      {fontSize:20,fontWeight:700,marginBottom:4},
  scoreVerdict:    {fontSize:14,color:'#475569'},
  tabs:            {display:'flex',gap:8,borderBottom:'1px solid rgba(15,23,42,0.04)',paddingBottom:12},
  tab:             {padding:'8px 20px',background:'transparent',border:'none',color:'#64748b',fontSize:13,fontWeight:600,cursor:'pointer',borderRadius:4,transition:'all 0.2s'},
  tabActive:       {background:'#eff6ff',color:'#1a3a6b',borderBottom:'2px solid #f5a623'},
  content:         {flex:1,overflowY:'auto',minHeight:300},
  summaryContent:  {display:'flex',flexDirection:'column',gap:24},
  statsGrid:       {display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12},
  statItem:        {background:'#ffffff',borderRadius:14,padding:'14px',textAlign:'center',border:'1px solid rgba(15,23,42,0.04)'},
  statIcon:        {fontSize:24,marginBottom:6},
  statLabel:       {fontSize:11,color:'#475569',textTransform:'uppercase',letterSpacing:1,marginBottom:4},
  statValue:       {fontSize:18,fontWeight:700,color:'#0f172a'},
  section:         {background:'#ffffff',borderRadius:14,padding:'16px',border:'1px solid rgba(15,23,42,0.04)'},
  sectionTitle:    {fontSize:12,fontWeight:700,letterSpacing:1,color:'#1a3a6b',marginBottom:12,textTransform:'uppercase',borderBottom:'2px solid #f5a623',paddingBottom:4,display:'inline-block'},
  list:            {margin:0,paddingLeft:0,listStyle:'none'},
  listItem:        {fontSize:13,color:'#334155',lineHeight:1.6,marginBottom:10,display:'flex',alignItems:'flex-start'},
  strengthsContent:{display:'flex',flexDirection:'column'},
  questionsList:   {display:'flex',flexDirection:'column',gap:8},
  questionItem:    {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',background:'#ffffff',borderRadius:10,border:'1px solid rgba(15,23,42,0.04)'},
  questionNum:     {fontSize:12,fontWeight:600,color:'#6366f1'},
  questionStats:   {display:'flex',gap:16,fontSize:11,color:'#475569'},
  wordCount:       {padding:'2px 8px',background:'rgba(16,185,129,.08)',borderRadius:12,color:'#059669'},
  wpm:             {padding:'2px 8px',background:'rgba(99,102,241,.06)',borderRadius:12,color:'#6366f1'},
  adviceContent:   {display:'flex',flexDirection:'column',gap:24},
  emptyAdvice:     {textAlign:'center',padding:'40px 20px',color:'#475569'},
  motivationCard:  {background:'#f8fafc',borderRadius:16,padding:'20px',marginTop:8,border:'1px solid rgba(15,23,42,0.04)'},
  motivationQuote: {fontSize:14,fontStyle:'italic',color:'#0f172a',lineHeight:1.5,marginBottom:12},
  motivationAuthor:{fontSize:11,color:'#475569',textAlign:'right'},
  detailsContent:  {display:'flex',flexDirection:'column',gap:16},
  rawContent:      {fontSize:13,lineHeight:1.7,color:'#334155',whiteSpace:'pre-wrap',maxHeight:400,overflowY:'auto',padding:'4px 0'},
  rawHeader:       {fontWeight:700,color:'#6366f1',marginTop:12,marginBottom:6,fontSize:12,letterSpacing:1},
  rawBullet:       {paddingLeft:20,marginBottom:6,color:'#475569'},
  rawLine:         {marginBottom:4,color:'#475569'},
  actions:         {display:'flex',gap:12,paddingTop:16,borderTop:'1px solid rgba(15,23,42,0.04)',marginTop:8},
  actionBtn:       {flex:1,padding:'10px',borderRadius:10,background:'#ffffff',border:'1px solid rgba(15,23,42,0.04)',color:'#475569',fontSize:13,cursor:'pointer',transition:'all 0.2s'},
};

const H = {
  overlay: { position:'fixed', inset:0, zIndex:1000, display:'flex' },
  backdrop:{ position:'absolute', inset:0, background:'rgba(26,58,107,0.4)', backdropFilter:'blur(4px)' },
  drawer:  { position:'relative', zIndex:1, width:460, maxWidth:'95vw', background:'#ffffff', borderRight:'3px solid #f5a623', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'4px 0 20px rgba(26,58,107,0.12)' },
  dHead:   { display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'24px 22px 18px', borderBottom:'1px solid #e2e8f0', flexShrink:0, background:'#1a3a6b' },
  dTitle:  { fontSize:17, fontWeight:700, color:'#ffffff', marginBottom:4 },
  dSub:    { fontSize:12, color:'rgba(255,255,255,0.6)' },
  closeBtn:{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:32, height:32, borderRadius:6, cursor:'pointer', fontSize:16 },
  center:  { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#64748b', fontSize:14, gap:8 },
  list:    { flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 },
  card:    { display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:8, background:'#ffffff', border:'1px solid #e2e8f0', cursor:'pointer', textAlign:'left', transition:'all 0.2s', boxShadow:'0 1px 4px rgba(26,58,107,0.06)' },
  scoreBadge:{ padding:'6px 12px', borderRadius:4, fontWeight:700, fontSize:15, flexShrink:0 },
  cardMid: { flex:1, display:'flex', flexDirection:'column', gap:4 },
  cardDate:{ fontSize:12, color:'#64748b' },
  cardTitle:{ fontSize:14, fontWeight:600, color:'#1a3a6b' },
  cardVerdict:{ fontSize:11, display:'flex', alignItems:'center', gap:4 },
  cardArrow:{ color:'#1a3a6b', fontSize:16 },
  spinner: { width:40, height:40, border:'3px solid #eff6ff', borderTopColor:'#1a3a6b', borderRadius:'50%', animation:'spin 1s linear infinite' },
};

// ── BoursePicker ──────────────────────────────────────────────────────────────
function BoursePicker({ bourses, userId, onSelect }) {
  const [showHist, setShowHist] = useState(false);
  const [query, setQuery] = useState('');

  const q = (query || '').trim().toLowerCase();
  const filtered = q.length === 0 ? bourses : bourses.filter(b => (
    (b.nom||'').toLowerCase().includes(q) ||
    (b.pays||'').toLowerCase().includes(q) ||
    (b.niveau||'').toLowerCase().includes(q) ||
    (String(b.financement||'')).toLowerCase().includes(q)
  ));

  return (
    <div style={P.root}>
      <div style={P.glow}/>
      <div style={P.inner}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={P.badge}>ENTRETIEN VIRTUEL IA</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input
              aria-label="Rechercher une bourse"
              placeholder="Rechercher une bourse, pays, niveau..."
              value={query}
              onChange={e=>setQuery(e.target.value)}
              style={P.search}
            />
            <button style={P.histBtn} onClick={()=>setShowHist(true)}>📋 Mes entretiens</button>
          </div>
        </div>
        <h1 style={P.h1}>Préparez votre<br/><em style={P.em}>entretien de bourse</em></h1>
        <p style={P.sub}>Le jury IA vous posera <strong style={{color:'#166534'}}>{TOTAL_Q} questions</strong> adaptées à la bourse, avec analyse vocale en temps réel.</p>
        <div style={P.grid}>
          {filtered.length===0&&<div style={P.empty}><span style={{fontSize:36}}>🔎</span><p>Aucune bourse trouvée.</p></div>}
          {filtered.map(b=>(
            <div key={b.id} style={{...P.card, border:'2px solid rgba(115, 246, 189, 0.12)'}} className="bcard-h">
              <div style={P.cardTop}><span style={{fontSize:24}}>🎓</span><span style={P.finance}>{b.financement}</span></div>
              <div style={P.cardName}>{b.nom}</div>
              <div style={P.cardMeta}>{b.pays} · {b.niveau}</div>
              <button style={P.btnDemarrer} onClick={()=>onSelect(b)}>🚀 Démarrer l'entretien</button>
            </div>
          ))}
        </div>
      </div>
      {showHist&&<HistoriquePanel userId={userId} onClose={()=>setShowHist(false)}/>}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Cormorant+Garamond:ital,wght@0,600;1,500&display=swap');.bcard-h{transition:all .2s}.bcard-h:hover{transform:translateY(-4px)!important;border-color:rgba(99,102,241,.36)!important;box-shadow:0 18px 40px rgba(99,102,241,.12)!important}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

const P = {
  root:       { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 16px', fontFamily:"'Segoe UI',system-ui,sans-serif", background:'#f8f9fc' },
  glow:       { display:'none' }, // supprimé
  inner:      { width:'100%', maxWidth:800, position:'relative', zIndex:1 },
  badge:      { display:'inline-flex', padding:'4px 16px', borderRadius:4, border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:11, fontWeight:700, letterSpacing:2, background:'#eff6ff', marginBottom:16 },
  histBtn:    { padding:'8px 16px', borderRadius:6, background:'#1a3a6b', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' },
  search:     { padding:'10px 14px', borderRadius:6, border:'1px solid #e2e8f0', width:320, maxWidth:'42vw', outline:'none', fontSize:13, color:'#1a3a6b', background:'#ffffff', fontFamily:'inherit' },
  h1:         { fontSize:'clamp(1.8rem,4vw,2.6rem)', fontWeight:800, color:'#1a3a6b', lineHeight:1.2, marginBottom:12, marginTop:16 },
  em:         { color:'#f5a623', fontStyle:'normal' },
  sub:        { color:'#475569', fontSize:15, marginBottom:32, maxWidth:520, lineHeight:1.6 },
  grid:       { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 },
  empty:      { textAlign:'center', color:'#64748b', padding:'48px 0', gridColumn:'1/-1', display:'flex', flexDirection:'column', alignItems:'center', gap:8 },
  card:       { display:'flex', flexDirection:'column', gap:10, padding:'22px', borderRadius:10, background:'#ffffff', border:'1px solid #e2e8f0', textAlign:'left', color:'#1a3a6b', boxShadow:'0 2px 8px rgba(26,58,107,0.06)', transition:'all 0.2s' },
  cardTop:    { display:'flex', alignItems:'center', justifyContent:'space-between' },
  finance:    { fontSize:12, color:'#166534', fontWeight:600, padding:'3px 10px', borderRadius:4, background:'#f0fdf4', border:'1px solid #bbf7d0' },
  cardName:   { fontSize:15, fontWeight:700, color:'#1a3a6b' },
  cardMeta:   { fontSize:13, color:'#64748b', marginBottom:4 },
  btnDemarrer:{ marginTop:6, padding:'11px 16px', borderRadius:6, border:'none', background:'#1a3a6b', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', width:'100%', transition:'background 0.2s' },
};
// ── EntretienSession ──────────────────────────────────────────────────────────
function EntretienSession({ bourse, user, conversationId, onFinish }) {
  const [phase,          setPhase]         = useState('intro');
  const [qIndex,         setQIndex]        = useState(0);
  const [currentQ,       setCurrentQ]      = useState('');
  const [liveText,       setLiveText]      = useState('');
  const [elapsed,        setElapsed]       = useState(0);
  const [aiLoading,      setAiLoading]     = useState(false);
  const [allAnswers,     setAllAnswers]    = useState([]);
  const [finalScore,     setFinalScore]    = useState(null);
  const [camError,       setCamError]      = useState(false);
  const [liveVolume,     setLiveVolume]    = useState(0);
  const [liveStability,  setLiveStability] = useState(100);
  const [liveSpeakRatio, setLiveSpeakRatio]= useState(0);
  const [livePauses,     setLivePauses]    = useState(0);
  const [liveHesit,      setLiveHesit]     = useState(0);
  const [liveWordCount,  setLiveWordCount] = useState(0);
  const [showHist,       setShowHist]      = useState(false);

  const videoRef     = useRef(null);
  const streamRef    = useRef(null);
  const recRef       = useRef(null);
  const timerRef     = useRef(null);
  const metricsRef   = useRef(null);
  const srRef        = useRef(null);
  const analyzerRef  = useRef(null);
  const aiLockRef    = useRef(false);
  const savedRef     = useRef(false);

  const liveTextRef    = useRef('');
  const elapsedRef     = useRef(0);
  const answersRef     = useRef([]);
  const qIndexRef      = useRef(0);
  const capturedRef    = useRef('');
  const phaseRef       = useRef('intro');
  const historyRef     = useRef([]);

  useEffect(() => { liveTextRef.current = liveText;  }, [liveText]);
  useEffect(() => { elapsedRef.current  = elapsed;    }, [elapsed]);
  useEffect(() => { qIndexRef.current   = qIndex;    }, [qIndex]);
  useEffect(() => { phaseRef.current    = phase;     }, [phase]);

  useEffect(() => { initCamera(); return cleanup; }, []);

  const initCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
    } catch(e) { console.warn('Camera:', e.message); setCamError(true); }
  };

  const cleanup = () => {
    clearInterval(timerRef.current);
    clearInterval(metricsRef.current);
    if (recRef.current?.state==='recording') { try { recRef.current.stop(); } catch {} }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => { try { t.stop(); } catch {} }); streamRef.current = null; }
    try { if (srRef.current) { srRef.current.onend=null; srRef.current.stop(); } } catch {}
    if (analyzerRef.current) { analyzerRef.current.destroy(); analyzerRef.current = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  // ── callAI → webhook n8n (serveur différent → axios brut, pas axiosInstance) ──
  const callAI = useCallback(async (payload, ctx) => {
    if (aiLockRef.current) return { output: null };
    aiLockRef.current = true;
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 45000);
    try {
      const res = await axios.post(
        WEBHOOK_ROUTES.entretien,
        {
          text:              typeof payload === 'string' ? payload : payload.lastAnswer || '',
          context:           ctx,
          conversationId,
          id:                user?.id    || null,
          email:             user?.email || null,
          bourse:            { id:bourse.id, nom:bourse.nom, pays:bourse.pays, niveau:bourse.niveau, financement:bourse.financement },
          bourse_context:    `${bourse.nom} | ${bourse.pays} | ${bourse.niveau} | ${bourse.financement||'100%'}`,
          entretien_history: historyRef.current,
          question_index:    typeof payload === 'object' ? (payload.questionIndex ?? 0) : 0,
          total_questions:   TOTAL_Q,
          voiceStats: typeof payload === 'object' && payload.voiceStats ? payload.voiceStats : null,
        },
        { signal: controller.signal },
      );
      clearTimeout(timeout);
      aiLockRef.current = false;
      return res.data;
    } catch(err) {
      clearTimeout(timeout);
      aiLockRef.current = false;
      console.error('callAI error:', err.message);
      return { output: null };
    }
  }, [bourse, user, conversationId]);

  const cleanQ = out => {
    if (!out || typeof out !== 'string' || out.trim().length < 10) return null;
    return out.trim().replace(/^(question\s*\d+\s*[:\-–]?\s*|Q\d+\s*[:\-–]?\s*)/i,'').trim();
  };

  const startInterview = async () => {
    setPhase('ai_speaking'); setAiLoading(true);
    savedRef.current = false; aiLockRef.current = false;
    historyRef.current = [];
    const data = await callAI({ lastAnswer: '', questionIndex: 0 }, 'start_entretien');
    const q    = cleanQ(data?.output) || `Présentez-vous et expliquez votre motivation pour la bourse ${bourse.nom}.`;
    historyRef.current = [{ role: 'assistant', content: q }];
    setCurrentQ(q);
    setQIndex(0); qIndexRef.current = 0;
    setAiLoading(false);
    await tts(q);
    setPhase('waiting');
  };

  const startRecording = () => {
    if (!streamRef.current || recRef.current?.state==='recording') return;
    setLiveText(''); liveTextRef.current = '';
    capturedRef.current = '';
    setElapsed(0); elapsedRef.current = 0;
    setLiveWordCount(0);
    setPhase('recording');

    if (analyzerRef.current) analyzerRef.current.destroy();
    analyzerRef.current = new VoiceAnalyzer(streamRef.current);
    analyzerRef.current.start();

    const mr = new MediaRecorder(streamRef.current);
    mr.ondataavailable = e => {};
    mr.start(200); recRef.current = mr;

    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const n = prev + 1; elapsedRef.current = n;
        if (n >= 120) stopRecording();
        return n;
      });
    }, 1000);

    metricsRef.current = setInterval(() => {
      if (!analyzerRef.current) return;
      const s = analyzerRef.current.getStats();
      setLiveVolume(s.volume);
      setLiveStability(s.stability);
      setLiveSpeakRatio(s.speakRatio);
      setLivePauses(s.pauseCount);
      setLiveHesit(s.hesitations);
      setLiveWordCount(liveTextRef.current.split(/\s+/).filter(w=>w.length>1).length);
    }, 800);

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const sr = new SR(); sr.lang='fr-FR'; sr.continuous=true; sr.interimResults=true;
      sr.onresult = e => {
        let t = '';
        for (let i=0;i<e.results.length;i++) t += e.results[i][0].transcript+' ';
        setLiveText(t.trim()); liveTextRef.current = t.trim();
      };
      sr.onerror = () => { try { sr.stop(); } catch {} };
      sr.onend   = () => { if (phaseRef.current==='recording') { try { sr.start(); } catch {} } };
      try { sr.start(); } catch {}
      srRef.current = sr;
    }
  };

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(metricsRef.current);
    capturedRef.current = liveTextRef.current;
    if (recRef.current?.state==='recording') { try { recRef.current.stop(); } catch {} }
    try { if (srRef.current) { srRef.current.onend=null; srRef.current.stop(); } } catch {}
    if (analyzerRef.current) analyzerRef.current.stop();
    setPhase('analyzing');
  }, []);

  useEffect(() => {
    if (phase !== 'analyzing') return;
    const go = async () => {
      const curIdx  = qIndexRef.current;
      const isLast  = curIdx >= TOTAL_Q - 1;
      const answer  = capturedRef.current.trim() || '(aucune réponse détectée)';
      const dur     = elapsedRef.current;
      const voice   = analyzerRef.current ? analyzerRef.current.getStats() : null;
      if (analyzerRef.current) { analyzerRef.current.destroy(); analyzerRef.current = null; }

      const wordCount = answer.split(/\s+/).filter(w=>w.length>1).length;
      const wpm       = dur > 3 ? Math.round((wordCount/dur)*60) : 0;

      historyRef.current.push({ role: 'user', content: answer, duration: dur, wordCount, wpm, voice });

      const entry = { q:currentQ, a:answer, duration:dur, wordCount, wpm, voice };
      answersRef.current = [...answersRef.current, entry];
      setAllAnswers([...answersRef.current]);

      if (isLast) {
        const voiceStats = {
          totalAnswered:    answersRef.current.filter(a=>a.a&&a.a!=='(aucune réponse détectée)'&&a.a.length>5).length,
          avgWpm:           Math.round(answersRef.current.filter(a=>a.wpm>0&&a.wpm<300).reduce((s,a)=>s+a.wpm,0) / Math.max(answersRef.current.filter(a=>a.wpm>0&&a.wpm<300).length,1)),
          avgWords:         Math.round(answersRef.current.reduce((s,a)=>s+(a.wordCount||0),0)/Math.max(answersRef.current.length,1)),
          totalPauses:      answersRef.current.reduce((s,a)=>s+(a.voice?.pauseCount||0),0),
          totalHesitations: answersRef.current.reduce((s,a)=>s+(a.voice?.hesitations||0),0),
          avgStability:     Math.round(answersRef.current.reduce((s,a)=>s+(a.voice?.stability||0),0)/Math.max(answersRef.current.length,1)),
          scoresParQuestion: answersRef.current.map((a,i)=>({q:i+1,words:a.wordCount||0,wpm:a.wpm||0,answer:(a.a||'').slice(0,200)})),
        };
        const data = await callAI({ lastAnswer: answer, questionIndex: curIdx, voiceStats }, 'fin_entretien');
        const scoreText = data?.output || data?.message || data?.text || 'Erreur — vérifiez la connexion n8n';
        setFinalScore(scoreText);
        setPhase('result');
        if (!savedRef.current) {
          savedRef.current = true;
          await saveEntretien(user?.id, scoreText, conversationId, bourse.nom);
        }
        await tts('Entretien terminé. Voici votre évaluation complète.');
      } else {
        const nextIdx = curIdx + 1;
        const data    = await callAI({ lastAnswer: answer, questionIndex: nextIdx }, 'entretien');
        const nextQ   = cleanQ(data?.output || data?.message || data?.text);

        if (!nextQ) {
          const fallbacks = [
            `Pourquoi ${bourse.nom} plutôt qu'une autre bourse ?`,
            `Décrivez un projet concret que vous réaliserez grâce à cette bourse.`,
            `Quelles compétences apportez-vous à cette opportunité ?`,
            `Comment votre formation vous prépare-t-elle pour ${bourse.pays} ?`,
            `Quels sont vos objectifs à 5 ans après cette bourse ?`,
            `Comment comptez-vous maintenir le lien avec votre pays d'origine ?`,
            `Quelle difficulté anticipez-vous et comment la surmonterez-vous ?`,
          ];
          const used = new Set(historyRef.current.filter(h=>h.role==='assistant').map(h=>h.content.toLowerCase().slice(0,30)));
          const fb   = fallbacks.find(q=>!used.has(q.toLowerCase().slice(0,30))) || fallbacks[nextIdx % fallbacks.length];
          historyRef.current.push({ role: 'assistant', content: fb });
          setQIndex(nextIdx); qIndexRef.current = nextIdx;
          setCurrentQ(fb);
          setLiveText(''); liveTextRef.current = '';
          setElapsed(0);   elapsedRef.current  = 0;
          setPhase('ai_speaking');
          await tts(fb);
          setPhase('waiting');
          return;
        }

        historyRef.current.push({ role: 'assistant', content: nextQ });
        setQIndex(nextIdx); qIndexRef.current = nextIdx;
        setCurrentQ(nextQ);
        setLiveText(''); liveTextRef.current = '';
        setElapsed(0);   elapsedRef.current  = 0;
        setPhase('ai_speaking');
        await tts(nextQ);
        setPhase('waiting');
      }
    };
    go();
  }, [phase]);

  const parseScore = txt => {
    if (!txt) return {};
    const get = key => {
      const m = txt.match(new RegExp(`${key}\\s*[:\\-]\\s*([\\s\\S]+?)(?=\\n\\s*[-•*]?\\s*(?:SCORE|VERDICT|POINTS|CONSEILS|COMMENTAIRE)|$)`,'i'));
      return m ? m[1].trim() : null;
    };
    return {
      score:    txt.match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i)?.[1],
      verdict:  txt.match(/VERDICT\s*[:\-]\s*(.+)/i)?.[1]?.trim(),
      forts:    get('POINTS FORTS'),
      fix:      get('POINTS À AMÉLIORER'),
      conseils: get('CONSEILS PERSONNALISÉS'),
    };
  };

  const parsed   = parseScore(finalScore);
  const totalDur = allAnswers.reduce((a,b)=>a+b.duration,0);
  const avgWords = allAnswers.length ? Math.round(allAnswers.reduce((a,b)=>a+(b.wordCount||0),0)/allAnswers.length) : 0;
  const validWpm = allAnswers.filter(a=>a.wpm>0&&a.wpm<300);
  const avgWpm   = validWpm.length ? Math.round(validWpm.reduce((a,b)=>a+b.wpm,0)/validWpm.length) : 0;

  return (
    <div style={T.root}>
      <div style={T.topbar}>
        <div style={T.tbLeft}>
          <div style={{...T.dot,background:phase==='recording'?'#ef4444':'#10b981'}}/>
          <span style={T.tbName}>{bourse.nom}</span>
          <span style={T.sep}>·</span>
          <span style={T.tbMeta}>{bourse.pays} · {bourse.niveau}</span>
        </div>
        <div style={T.prog}>
          {[...Array(TOTAL_Q)].map((_,i)=>(
            <div key={i} style={{...T.pDot,
              background:  i<qIndex?'#8b5cf6':i===qIndex?'#e879f9':'rgba(255,255,255,.1)',
              transform:   i===qIndex?'scale(1.4)':'scale(1)',
              boxShadow:   i===qIndex?'0 0 10px #e879f9':'none',
            }}/>
          ))}
          {phase!=='intro'&&phase!=='result'&&<span style={T.pLabel}>Q{qIndex+1}/{TOTAL_Q}</span>}
        </div>
        <div style={{display:'flex',gap:8}}>
          <button style={T.histBtn} onClick={()=>setShowHist(true)}>📋 Historique</button>
          <button style={T.quitBtn} onClick={()=>{cleanup();onFinish();}}>✕ Quitter</button>
        </div>
      </div>

      <div style={T.body}>
        <div style={T.left}>
          <div style={T.videoBox}>
            {camError
              ? <div style={T.noCam}><span style={{fontSize:40}}>📷</span><p>Caméra indisponible</p><small>L'entretien continue</small></div>
              : <video ref={videoRef} autoPlay muted playsInline style={T.video}/>
            }
            {phase==='recording'&&<div style={T.recBadge}><div style={T.recDot}/>REC &nbsp; {fmt(elapsed)}</div>}
            {phase==='ai_speaking'&&(
              <div style={T.aiOverlay}>
                <div style={T.waveRow}>{[...Array(5)].map((_,i)=><div key={i} style={{...T.waveBar,animationDelay:`${i*0.12}s`}}/>)}</div>
                Jury IA parle…
              </div>
            )}
            <div style={T.meterBg}><div style={{...T.meterFill,width:`${liveVolume}%`}}/></div>
          </div>

          {phase!=='intro'&&phase!=='result'&&(
            <div style={T.metricsBox}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <div style={T.mHead}>ANALYSE VOCALE EN DIRECT</div>
                {phase==='recording'&&<div style={{fontSize:10,color:'#475569'}}>{liveWordCount} mots</div>}
              </div>
              {[
                {label:'Volume micro',   v:liveVolume,     icon:'🎙'},
                {label:'Stabilité voix', v:liveStability,  icon:'📊'},
                {label:'Ratio parole',   v:liveSpeakRatio, icon:'⏱'},
              ].map(m=>(
                <div key={m.label} style={T.mRow}>
                  <span style={T.mIcon}>{m.icon}</span>
                  <div style={T.mBarBg}><div style={{...T.mBarFill,width:`${m.v}%`,background:m.v>75?'linear-gradient(90deg,#059669,#34d399)':m.v>45?'linear-gradient(90deg,#d97706,#fbbf24)':'linear-gradient(90deg,#dc2626,#f87171)'}}/></div>
                  <span style={T.mPct}>{m.v}%</span>
                  <span style={T.mLabel}>{m.label}</span>
                </div>
              ))}
              <div style={{display:'flex',gap:8,marginTop:4}}>
                {[
                  {icon:'⏸',val:livePauses,    label:'pauses',   warn:livePauses>5},
                  {icon:'💬',val:liveHesit,     label:'s hésit.', warn:liveHesit>8},
                  {icon:'📝',val:liveWordCount, label:'mots',     warn:false},
                ].map(c=>(
                  <div key={c.label} style={{flex:1,textAlign:'center',padding:'6px 4px',borderRadius:8,
                    background:`rgba(${c.warn?'239,68,68':'99,102,241'},.06)`,
                    border:`1px solid rgba(${c.warn?'239,68,68':'99,102,241'},.15)`}}>
                    <div style={{fontSize:15,fontWeight:700,color:c.warn?'#f87171':'#818cf8'}}>{c.val}</div>
                    <div style={{fontSize:9,color:'#475569',textTransform:'uppercase'}}>{c.icon} {c.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={T.right}>
          {phase==='intro'&&(
            <div style={{width:'100%',maxWidth:500,display:'flex',flexDirection:'column',height:'100%'}}>
              <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:14,paddingBottom:8}}>
                <div style={{textAlign:'center',fontSize:48}}>🧑‍⚖️</div>
                <h2 style={{...T.panelH2,fontSize:'1.45rem',marginBottom:0}}>Prêt pour votre entretien ?</h2>
                <p style={{...T.panelP,marginBottom:0}}>Le jury IA va vous poser <strong style={{color:'#e879f9'}}>{TOTAL_Q} questions</strong> sur <strong style={{color:'#c4b5fd'}}>{bourse.nom}</strong>.</p>
                <div style={{padding:'14px 16px',borderRadius:12,background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.2)'}}>
                  <div style={{fontSize:11,color:'#818cf8',fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Analyse en temps réel</div>
                  {[['📊','Contenu & richesse vocabulaire'],['⏱','Vitesse de parole réelle (mots/min)'],['⏸','Pauses et hésitations détectées'],['🎙','Volume et stabilité vocale'],['🧠','Questions et score générés par IA n8n'],].map(([ic,tx])=>(
                    <div key={tx} style={{display:'flex',alignItems:'center',gap:10,fontSize:12,color:'#94a3b8',marginBottom:6}}><span>{ic}</span><span>{tx}</span></div>
                  ))}
                </div>
                {[['🎤','Parlez clairement — le micro transcrit en direct'],['👁️','Gardez le contact visuel'],['⏱️','Max 2 min par réponse'],['🔊','Activez le son pour entendre les questions'],].map(([ic,tx])=>(
                  <div key={tx} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 14px',borderRadius:10,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',fontSize:13,color:'#cbd5e1'}}><span>{ic}</span><span>{tx}</span></div>
                ))}
              </div>
              <div style={{flexShrink:0,paddingTop:12}}>
                <button style={T.btnStart} onClick={startInterview}>🚀 &nbsp; Démarrer l'entretien</button>
              </div>
            </div>
          )}

          {['ai_speaking','waiting','recording','analyzing'].includes(phase)&&(
            <div style={T.panel}>
              <div style={T.qHead}>
                <div style={T.qBadge}>Question {qIndex+1} / {TOTAL_Q}</div>
                {phase==='recording'&&<div style={T.timerBadge}>{fmt(elapsed)}</div>}
              </div>
              <div style={T.qBubble}>
                {aiLoading
                  ? <div style={{display:'flex',gap:7}}>{[0,.15,.3].map(d=><div key={d} style={{...T.dot2,animationDelay:`${d}s`}}/>)}</div>
                  : <p style={{margin:0,lineHeight:1.7}}>{currentQ}</p>
                }
              </div>

              {phase==='recording'&&liveText&&(
                <div style={T.liveBox}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <div style={T.liveHead}>📝 TRANSCRIPTION EN DIRECT</div>
                    <div style={{fontSize:10,color:'#64748b'}}>{liveWordCount} mots {liveWordCount>=40?'✓':liveWordCount>0?`(+${40-liveWordCount})`:''}</div>
                  </div>
                  <p style={T.liveP}>{liveText}</p>
                  <div style={{marginTop:6,height:2,borderRadius:99,background:'rgba(255,255,255,.05)',overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:99,width:`${Math.min(100,(liveWordCount/80)*100)}%`,background:liveWordCount>=40?'linear-gradient(90deg,#059669,#34d399)':'linear-gradient(90deg,#d97706,#fbbf24)',transition:'width .4s ease'}}/>
                  </div>
                </div>
              )}

              {phase==='analyzing'&&(
                <div style={T.analyzeBox}>
                  <div style={T.spinner}/>
                  <div>
                    <div style={{color:'#e2e8f0',fontWeight:600,marginBottom:10}}>L'IA analyse votre réponse…</div>
                    {['Analyse du contenu','Pertinence à la bourse','Génération de la prochaine question','Score en cours…'].map((s,i)=>(
                      <div key={s} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7,animation:'fadeUp .4s ease both',animationDelay:`${i*.3}s`,opacity:0}}>
                        <div style={{width:6,height:6,borderRadius:'50%',background:'#8b5cf6',flexShrink:0}}/>
                        <span style={{color:'#94a3b8',fontSize:13}}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                {phase==='waiting'  &&<button style={T.btnRec}  onClick={startRecording}><span style={{fontSize:20}}>🎤</span> Répondre à la question</button>}
                {phase==='recording'&&<button style={T.btnStop} onClick={stopRecording}><span style={{fontSize:20}}>⏹</span> Terminer ma réponse</button>}
                {(phase==='ai_speaking'||phase==='analyzing')&&<div style={T.hint}>{phase==='ai_speaking'?'🔊 Écoutez la question…':'⏳ Analyse IA en cours…'}</div>}
              </div>
            </div>
          )}

          {phase==='result'&&(
            <div style={{...T.panel,overflowY:'auto',gap:16,padding:'20px 24px'}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:50,marginBottom:10}}>🏆</div>
                <h2 style={T.panelH2}>Résultats de l'entretien</h2>
                <p style={{color:'#64748b',fontSize:13}}>{bourse.nom} · {bourse.pays}</p>
                {user?.id&&<p style={{color:'#10b981',fontSize:12,marginTop:4}}>✅ Sauvegardé dans votre historique</p>}
              </div>

              <div style={T.statsGrid}>
                {[
                  {v:parsed.score?`${parsed.score}/100`:'—', l:'Score final'},
                  {v:fmt(totalDur),                          l:'Durée totale'},
                  {v:`${avgWpm} m/min`,                      l:'Vitesse moy.'},
                  {v:`${avgWords} mots`,                     l:'Mots / réponse'},
                ].map(s=>(
                  <div key={s.l} style={T.statCard}>
                    <div style={T.statV}>{s.v}</div>
                    <div style={T.statL}>{s.l}</div>
                  </div>
                ))}
              </div>

              {parsed.verdict&&(
                <div style={{padding:'12px 18px',borderRadius:12,background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.2)',textAlign:'center'}}>
                  <span style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>VERDICT</span>
                  <span style={{fontSize:16,fontWeight:700,color:'#34d399'}}>{parsed.verdict}</span>
                </div>
              )}

              {parsed.forts&&(
                <div style={T.sectionCard}>
                  <div style={{...T.sectionHead,color:'#34d399'}}>✅ POINTS FORTS</div>
                  <div style={T.sectionBody}>{parsed.forts}</div>
                </div>
              )}
              {parsed.fix&&(
                <div style={{...T.sectionCard,background:'rgba(245,158,11,.04)',border:'1px solid rgba(245,158,11,.2)'}}>
                  <div style={{...T.sectionHead,color:'#fbbf24'}}>⚠️ POINTS À AMÉLIORER</div>
                  <div style={T.sectionBody}>{parsed.fix}</div>
                </div>
              )}
              {parsed.conseils&&(
                <div style={{...T.sectionCard,background:'rgba(139,92,246,.05)',border:'1px solid rgba(139,92,246,.2)'}}>
                  <div style={{...T.sectionHead,color:'#a78bfa'}}>💡 CONSEILS PERSONNALISÉS</div>
                  <div style={T.sectionBody}>{parsed.conseils}</div>
                </div>
              )}

              {!parsed.forts&&finalScore&&(
                <div style={T.scoreCard}>
                  <div style={T.scoreHead}>ÉVALUATION DU JURY IA</div>
                  <div style={T.scoreBody}>{finalScore}</div>
                </div>
              )}

              <div>
                <div style={T.scoreHead}>DÉROULEMENT — STATISTIQUES RÉELLES</div>
                <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:10}}>
                  {allAnswers.map((a,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 14px',borderRadius:10,background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.05)'}}>
                      <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(139,92,246,.2)',border:'1px solid rgba(139,92,246,.4)',color:'#a78bfa',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}>{i+1}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,color:'#cbd5e1',marginBottom:3}}>{a.q.slice(0,70)}{a.q.length>70?'…':''}</div>
                        <div style={{fontSize:11,color:'#64748b'}}>⏱ {fmt(a.duration)} · 📝 {a.wordCount||0} mots · 🏃 {a.wpm||0} m/min{a.voice&&` · ⏸ ${a.voice.pauseCount||0} pauses · 💬 ${a.voice.hesitations||0}s`}</div>
                        {a.a&&a.a!=='(aucune réponse détectée)'&&<div style={{fontSize:11,color:'#475569',marginTop:4,fontStyle:'italic'}}>"{a.a.slice(0,80)}{a.a.length>80?'…':''}"</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:'flex',gap:12}}>
                <button style={T.btnRetry} onClick={()=>{
                  answersRef.current=[]; setAllAnswers([]); setFinalScore(null);
                  setQIndex(0); qIndexRef.current=0; setCurrentQ('');
                  savedRef.current=false; aiLockRef.current=false;
                  historyRef.current=[]; setPhase('intro');
                }}>🔄 Recommencer</button>
                <button style={T.btnDone} onClick={()=>{cleanup();onFinish();}}>✅ Terminer</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showHist&&<HistoriquePanel userId={user?.id} onClose={()=>setShowHist(false)}/>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Cormorant+Garamond:ital,wght@0,600;1,500&display=swap');
        @keyframes pulse    {0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes recPulse {0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.6)}70%{box-shadow:0 0 0 9px rgba(239,68,68,0)}}
        @keyframes wave     {from{height:4px}to{height:24px}}
        @keyframes spin     {to{transform:rotate(360deg)}}
        @keyframes bounce   {0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes fadeUp   {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes stopGlow {0%,100%{box-shadow:0 0 10px rgba(239,68,68,.4)}50%{box-shadow:0 0 28px rgba(239,68,68,.7)}}
      `}</style>
    </div>
  );
}

const T = {
  root:       {height:'100vh',display:'flex',flexDirection:'column',background:'#ffffff',fontFamily:"'Outfit',sans-serif",overflow:'hidden'},
  topbar:     {display:'flex',alignItems:'center',gap:14,padding:'11px 22px',flexShrink:0,background:'#f8fafc',borderBottom:'1px solid rgba(15,23,42,0.04)'},
  tbLeft:     {display:'flex',alignItems:'center',gap:9},
  dot:        {width:9,height:9,borderRadius:'50%',flexShrink:0,animation:'pulse 2s infinite',background:'#e2e8f0'},
  tbName:     {fontSize:14,fontWeight:700,color:'#0f172a'},
  sep:        {color:'rgba(15,23,42,0.08)'},
  tbMeta:     {fontSize:13,color:'#475569'},
  prog:       {display:'flex',alignItems:'center',gap:7,marginLeft:'auto'},
  pDot:       {width:9,height:9,borderRadius:'50%',transition:'all .4s ease',flexShrink:0},
  pLabel:     {fontSize:12,color:'#475569',marginLeft:6},
  histBtn:    {padding:'6px 12px',borderRadius:8,background:'#f8fafc',border:'1px solid rgba(15,23,42,0.04)',color:'#475569',fontSize:12,cursor:'pointer'},
  quitBtn:    {padding:'6px 14px',borderRadius:8,background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.12)',color:'#bf4444',fontSize:13,cursor:'pointer'},
  body:       {flex:1,display:'grid',gridTemplateColumns:'1fr 1.15fr',overflow:'hidden'},
  left:       {display:'flex',flexDirection:'column',background:'#f8fafc',borderRight:'1px solid rgba(15,23,42,0.04)',overflow:'hidden'},
  videoBox:   {flex:1,position:'relative',background:'#000',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'},
  video:      {width:'100%',height:'100%',objectFit:'cover'},
  noCam:      {display:'flex',flexDirection:'column',alignItems:'center',gap:8,color:'#475569',textAlign:'center'},
  recBadge:   {position:'absolute',top:14,left:14,display:'flex',alignItems:'center',gap:7,padding:'6px 14px',borderRadius:99,background:'#ef4444',color:'#fff',fontSize:13,fontWeight:700,backdropFilter:'blur(8px)',animation:'recPulse 1.4s infinite'},
  recDot:     {width:9,height:9,borderRadius:'50%',background:'#fff',animation:'pulse 1s infinite'},
  aiOverlay:  {position:'absolute',bottom:14,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'10px 22px',borderRadius:12,background:'#4f46e5',color:'#fff',fontSize:13,backdropFilter:'blur(8px)',whiteSpace:'nowrap'},
  waveRow:    {display:'flex',alignItems:'flex-end',gap:4,height:24},
  waveBar:    {width:3,background:'#fff',borderRadius:99,animation:'wave .55s ease-in-out infinite alternate'},
  meterBg:    {position:'absolute',bottom:0,left:0,right:0,height:4,background:'rgba(15,23,42,0.04)'},
  meterFill:  {height:'100%',borderRadius:'0 2px 2px 0',background:'linear-gradient(90deg,#6366f1,#10b981)',transition:'width .08s'},
  metricsBox: {padding:'14px 18px',flexShrink:0,background:'#ffffff',borderTop:'1px solid rgba(15,23,42,0.04)',display:'flex',flexDirection:'column',gap:8},
  mHead:      {fontSize:10,letterSpacing:2,color:'#475569',fontWeight:700},
  mRow:       {display:'flex',alignItems:'center',gap:9},
  mIcon:      {fontSize:14,width:18,textAlign:'center'},
  mBarBg:     {flex:1,height:5,background:'#f1f5f9',borderRadius:99,overflow:'hidden'},
  mBarFill:   {height:'100%',borderRadius:99,transition:'width .85s ease, background .5s'},
  mPct:       {fontSize:11,color:'#475569',width:30,textAlign:'right'},
  mLabel:     {fontSize:11,color:'#64748b',width:90},
  right:      {display:'flex',alignItems:'stretch',justifyContent:'center',padding:'24px 28px',overflow:'hidden',background:'transparent'},
  panel:      {width:'100%',maxWidth:500,display:'flex',flexDirection:'column',gap:20,maxHeight:'100%'},
  panelH2:    {fontFamily:"'Cormorant Garamond',serif",fontSize:'1.75rem',fontWeight:600,color:'#0f172a',textAlign:'center',lineHeight:1.2},
  panelP:     {color:'#475569',fontSize:14,textAlign:'center',lineHeight:1.6},
  btnStart:   {display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'18px 24px',borderRadius:14,width:'100%',border:'none',background:'linear-gradient(135deg,#4f46e5,#7c3aed)',color:'#fff',fontSize:17,fontWeight:700,cursor:'pointer',boxShadow:'0 8px 28px rgba(79,70,229,0.08)'},
  qHead:      {display:'flex',alignItems:'center',justifyContent:'space-between'},
  qBadge:     {padding:'5px 14px',borderRadius:99,background:'rgba(99,102,241,.08)',border:'1px solid rgba(99,102,241,.12)',color:'#6366f1',fontSize:12,fontWeight:700},
  timerBadge: {padding:'5px 14px',borderRadius:99,background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.12)',color:'#bf4444',fontSize:13,fontWeight:700},
  qBubble:    {padding:'22px',borderRadius:16,background:'#f8fafc',border:'1px solid rgba(15,23,42,0.04)',color:'#0f172a',fontSize:15,minHeight:80,display:'flex',alignItems:'center'},
  dot2:       {width:10,height:10,borderRadius:'50%',background:'#8b5cf6',animation:'bounce .8s ease-in-out infinite'},
  liveBox:    {padding:'14px 16px',borderRadius:12,background:'#ffffff',border:'1px solid rgba(15,23,42,0.04)',maxHeight:120,overflowY:'auto'},
  liveHead:   {fontSize:10,color:'#475569',letterSpacing:1.5},
  liveP:      {fontSize:13,color:'#475569',fontStyle:'italic',margin:'6px 0 0'},
  analyzeBox: {display:'flex',alignItems:'flex-start',gap:18,padding:'18px 20px',borderRadius:14,background:'#ffffff',border:'1px solid rgba(15,23,42,0.04)'},
  spinner:    {width:40,height:40,borderRadius:'50%',flexShrink:0,marginTop:2,border:'3px solid rgba(99,102,241,.08)',borderTopColor:'#6366f1',borderRightColor:'#e879f9',animation:'spin 1s linear infinite'},
  btnRec:     {display:'flex',alignItems:'center',justifyContent:'center',gap:12,width:'100%',padding:'18px',borderRadius:14,border:'none',background:'linear-gradient(135deg,#047857,#10b981)',color:'#fff',fontSize:17,fontWeight:700,cursor:'pointer',boxShadow:'0 6px 24px rgba(16,185,129,0.12)'},
  btnStop:    {display:'flex',alignItems:'center',justifyContent:'center',gap:12,width:'100%',padding:'18px',borderRadius:14,border:'none',background:'linear-gradient(135deg,#b91c1c,#ef4444)',color:'#fff',fontSize:17,fontWeight:700,cursor:'pointer',animation:'stopGlow 1.6s ease-in-out infinite',boxShadow:'0 6px 24px rgba(239,68,68,0.12)'},
  hint:       {textAlign:'center',color:'#475569',fontSize:14,padding:'16px',borderRadius:10,background:'#ffffff',border:'1px solid rgba(15,23,42,0.04)'},
  statsGrid:  {display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10},
  statCard:   {padding:'14px 8px',borderRadius:12,textAlign:'center',background:'rgba(99,102,241,.06)',border:'1px solid rgba(99,102,241,.08)',display:'flex',flexDirection:'column',gap:5},
  statV:      {fontFamily:"'Cormorant Garamond',serif",fontSize:'1.3rem',fontWeight:600,color:'#4f46e5'},
  statL:      {fontSize:10,color:'#64748b',textTransform:'uppercase',letterSpacing:1},
  sectionCard:{padding:'16px 18px',borderRadius:14,background:'rgba(16,185,129,.04)',border:'1px solid rgba(16,185,129,.12)'},
  sectionHead:{fontSize:11,letterSpacing:1.5,fontWeight:700,marginBottom:10},
  sectionBody:{color:'#475569',fontSize:13,lineHeight:1.75,whiteSpace:'pre-wrap'},
  scoreCard:  {padding:'18px 20px',borderRadius:14,background:'rgba(16,185,129,.04)',border:'1px solid rgba(16,185,129,.12)',maxHeight:300,overflowY:'auto'},
  scoreHead:  {fontSize:10,letterSpacing:2,color:'#475569',fontWeight:700,marginBottom:10},
  scoreBody:  {color:'#475569',fontSize:14,lineHeight:1.75,whiteSpace:'pre-wrap'},
  btnRetry:   {flex:1,padding:'13px',borderRadius:12,background:'rgba(99,102,241,.06)',border:'1px solid rgba(99,102,241,.12)',color:'#4f46e5',fontSize:14,fontWeight:600,cursor:'pointer'},
  btnDone:    {flex:1,padding:'13px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#047857,#10b981)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'},
};

// ── Composant LoginModal ──────────────────────────────────────────────────────
function LoginModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const sendMagicLink = async () => {
    if (!email || !email.includes('@')) {
      setErrorMsg('Email invalide');
      return;
    }
    setStatus('sending');
    try {
      // Pour DEMANDER un magic link, on envoie seulement l'email
      await axiosInstance.post('/api/users/request-magic-link', {
        email: email.trim().toLowerCase(),
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'Impossible de contacter le serveur');
    }
  };

  return (
    <div style={modalOverlay}>
      <div style={modalContainer}>
        <div style={modalHeader}>
          <span style={{ fontSize: 24 }}>🔐</span>
          <h3 style={{ color: '#f1f5f9', margin: 0 }}>Connexion à OppsTrack</h3>
          <button onClick={onClose} style={modalClose}>✕</button>
        </div>
        <div style={modalBody}>
          {status === 'idle' && (
            <>
              <p style={{ color: '#94a3b8', marginBottom: 16 }}>Entrez votre email pour recevoir un lien de connexion magique.</p>
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={modalInput}
                autoFocus
              />
              {errorMsg && <div style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>{errorMsg}</div>}
              <button onClick={sendMagicLink} style={modalButton}>✉️ Envoyer le lien magique</button>
            </>
          )}
          {status === 'sending' && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={H.spinner} />
              <p style={{ color: '#94a3b8', marginTop: 12 }}>Envoi en cours...</p>
            </div>
          )}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✉️</div>
              <p style={{ color: '#10b981', fontWeight: 600 }}>Lien envoyé !</p>
              <p style={{ color: '#94a3b8', marginTop: 8 }}>Vérifiez votre boîte mail (et les spams).</p>
              <button onClick={onClose} style={{ ...modalButton, marginTop: 20, background: '#10b981' }}>Fermer</button>
            </div>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#f87171', marginBottom: 8 }}>{errorMsg}</p>
              <button onClick={() => setStatus('idle')} style={{ ...modalButton, marginTop: 12 }}>Réessayer</button>
            </div>
          )}
        </div>
      </div>
      <div style={modalBackdrop} onClick={onClose} />
    </div>
  );
}

const modalOverlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(6px)',
};
const modalContainer = {
  position: 'relative', zIndex: 2001,
  width: 380, maxWidth: '90vw',
  background: '#ffffff', borderRadius: 10,
  border: '1px solid #e2e8f0',
  borderTop: '3px solid #1a3a6b',
  boxShadow: '0 20px 40px rgba(26,58,107,0.15)',
  overflow: 'hidden',
};
const modalHeader = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '18px 24px', borderBottom: '1px solid #e2e8f0',
  background: '#1a3a6b',
};
const modalClose = {
  background: 'rgba(255,255,255,0.1)', border: 'none',
  fontSize: 18, color: '#fff', cursor: 'pointer',
  padding: '4px 8px', borderRadius: 6,
};
const modalBody = { padding: '24px', background: '#ffffff' };
const modalInput = {
  width: '100%', padding: '11px 14px', borderRadius: 6,
  border: '1px solid #e2e8f0', background: '#f8fafc',
  color: '#1a3a6b', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box',
};
const modalButton = {
  width: '100%', marginTop: 16, padding: '12px',
  borderRadius: 6, border: 'none',
  background: '#1a3a6b', color: '#fff',
  fontSize: 14, fontWeight: 700, cursor: 'pointer',
};
const modalBackdrop = {
  position: 'fixed',
  inset: 0,
  zIndex: 1999,
};

// ── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
// ── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function EntretienPage({ user, bourses=[], conversationId, setView, handleQuickReply }) {
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 🔒 Si non connecté, afficher le message verrouillé IDENTIQUE à ProfilPage
  if (!user) {
    return (
      <>
        <div style={S.locked}>
          <div style={S.lockedCard}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🧑‍⚖️</div>
            <h3 style={{ color: '#1a3a6b', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>
              Entretien virtuel non disponible
            </h3>
            <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6, maxWidth: 280, textAlign: 'center', margin: '0 0 24px' }}>
              Connectez-vous pour pratiquer vos entretiens de bourse avec notre jury IA et obtenir une évaluation personnalisée.
            </p>
            <button style={S.lockBtn} onClick={() => setShowLoginModal(true)}>
              🔐 Se connecter
            </button>
          </div>
        </div>
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </>
    );
  }

  // Si connecté, afficher le sélecteur de bourses ou la session d'entretien
  const [selected, setSelected] = useState(null);
  if (!selected) return <BoursePicker bourses={bourses} userId={user?.id} onSelect={setSelected}/>;
  return <EntretienSession bourse={selected} user={user} conversationId={conversationId} onFinish={()=>setSelected(null)}/>;
}

// Styles identiques à ProfilPage
const S = {
  locked: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8f9fc',
    padding: 24,
  },
  lockedCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '48px 40px',
    boxShadow: '0 4px 20px rgba(26,58,107,0.08)',
    maxWidth: 380,
    width: '100%',
  },
  lockBtn: {
    padding: '12px 32px',
    borderRadius: 6,
    background: '#1a3a6b',
    color: 'white',
    border: 'none',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
};