import React, { useState, useEffect, useRef, useCallback } from 'react';

const WEBHOOK_URL = 'http://localhost:5678/webhook/payload-webhook';
const API_BASE    = 'http://localhost:3001/api';
const TOTAL_Q     = 8;

const fmt   = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ── TTS ───────────────────────────────────────────────────────────────────────
function tts(text) {
  return new Promise(resolve => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR'; u.rate = 0.9;
    const v = window.speechSynthesis.getVoices();
    const fr = v.find(x => x.lang.startsWith('fr'));
    if (fr) u.voice = fr;
    u.onend = resolve; u.onerror = resolve;
    window.speechSynthesis.speak(u);
  });
}

async function saveEntretien(userId, scoreText, conversationId, bourseNom) {
  if (!userId) return;
  try {
    await fetch(`${API_BASE}/entretiens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userId, score: scoreText, conversationId, context: bourseNom }),
    });
  } catch {}
}

// ── Analyse vocale réelle via Web Audio API ───────────────────────────────────
class VoiceAnalyzer {
  constructor(stream) {
    this.ctx     = new AudioContext();
    this.src     = this.ctx.createMediaStreamSource(stream);
    this.analyser= this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.src.connect(this.analyser);
    this.buf     = new Float32Array(this.analyser.fftSize);
    this.freqBuf = new Uint8Array(this.analyser.frequencyBinCount);
    // tracking
    this.silenceStart  = null;
    this.pauseCount    = 0;
    this.hesitationMs  = 0;
    this.speakingMs    = 0;
    this.totalMs       = 0;
    this.volumeHistory = [];
    this.pitchHistory  = [];
    this.lastTs        = Date.now();
    this.running       = false;
  }

  start() {
    this.running   = true;
    this.startTime = Date.now();
    this._tick();
  }

  _tick() {
    if (!this.running) return;
    const now  = Date.now();
    const dt   = now - this.lastTs;
    this.lastTs = now;
    this.totalMs += dt;

    // Volume RMS réel
    this.analyser.getFloatTimeDomainData(this.buf);
    let sum = 0;
    for (let i = 0; i < this.buf.length; i++) sum += this.buf[i] * this.buf[i];
    const rms    = Math.sqrt(sum / this.buf.length);
    const vol    = clamp(rms * 400, 0, 100);
    this.volumeHistory.push(vol);

    // Pitch estimation (zero-crossing rate)
    let zc = 0;
    for (let i = 1; i < this.buf.length; i++) {
      if ((this.buf[i] >= 0) !== (this.buf[i-1] >= 0)) zc++;
    }
    const pitch = (zc / 2) * (this.ctx.sampleRate / this.buf.length);
    if (pitch > 50 && pitch < 500) this.pitchHistory.push(pitch);

    // Silence / pause detection
    if (vol < 3) {
      if (!this.silenceStart) this.silenceStart = now;
      const silDur = now - this.silenceStart;
      if (silDur > 500 && silDur < 3000) this.hesitationMs += dt; // hésitation
      if (silDur >= 3000)                 this.pauseCount++;       // vraie pause
    } else {
      this.silenceStart = null;
      this.speakingMs  += dt;
    }

    requestAnimationFrame(() => this._tick());
  }

  getStats() {
    const avgVol   = this.volumeHistory.length
      ? this.volumeHistory.reduce((a,b)=>a+b,0) / this.volumeHistory.length : 0;
    const avgPitch = this.pitchHistory.length
      ? this.pitchHistory.reduce((a,b)=>a+b,0) / this.pitchHistory.length : 0;

    // Volume variance → stabilité voix
    const volVar = this.volumeHistory.length > 5
      ? Math.sqrt(this.volumeHistory.slice(-30).reduce((a,b,_,arr)=>{
          const m = arr.reduce((x,y)=>x+y,0)/arr.length;
          return a + (b-m)**2;
        },0) / Math.min(30, this.volumeHistory.length))
      : 0;

    return {
      volume:      Math.round(avgVol),
      pitch:       Math.round(avgPitch),
      pauseCount:  this.pauseCount,
      hesitations: Math.round(this.hesitationMs / 1000), // secondes
      speakRatio:  this.totalMs > 0 ? Math.round((this.speakingMs / this.totalMs) * 100) : 0,
      stability:   Math.round(clamp(100 - volVar * 2, 0, 100)),
    };
  }

  stop() { this.running = false; }

  destroy() {
    this.running = false;
    try { this.ctx.close(); } catch {}
  }
}

// ── Score live basé sur transcription réelle ──────────────────────────────────
function computeLiveScore(text, voiceStats, elapsed) {
  const words     = (text||'').trim().split(/\s+/).filter(w => w.length > 1);
  const wordCount = words.length;

  // ✅ Aucune réponse = 0 absolu
  if (wordCount < 3) return { total: 0, breakdown: {}, wpm: 0, wordCount };

  const uniqueWords  = new Set(words.map(w => w.toLowerCase())).size;
  const richness     = uniqueWords / wordCount;
  const wpm          = elapsed > 5 ? (wordCount / elapsed) * 60 : 0;

  // Mots de structuration
  const structWords  = ['parce que','car','donc','ainsi','premièrement','deuxièmement','ensuite','par exemple','notamment','en conclusion','finalement','de plus','cependant','néanmoins','en effet'];
  const hasStructure = structWords.filter(sw => (text||'').toLowerCase().includes(sw)).length;

  // ✅ Score pondéré — 0 si pas de contenu
  const contentScore   = wordCount >= 10 ? clamp(Math.round((wordCount - 10) * 0.7), 0, 30) : 0;
  const richnessScore  = wordCount >= 10 ? clamp(Math.round(richness * 25), 0, 25) : 0;
  const structureScore = wordCount >= 15 ? Math.min(20, hasStructure * 7) : 0;
  const paceScore      = wpm >= 80 && wpm <= 180 ? 15 : wpm > 0 ? Math.max(0, Math.round(15 - Math.abs(wpm - 130) * 0.12)) : 0;
  const fluencyScore   = wordCount >= 10 && voiceStats
    ? clamp(Math.round(10 - voiceStats.hesitations * 1.5), 0, 10)
    : 0;

  const total = clamp(contentScore + richnessScore + structureScore + paceScore + fluencyScore, 0, 100);

  return {
    total,
    breakdown: { content:contentScore, richness:richnessScore, structure:structureScore, pace:paceScore, fluency:fluencyScore },
    wpm:       Math.round(wpm),
    wordCount,
  };
}

// ── Historique Panel ──────────────────────────────────────────────────────────
function HistoriquePanel({ userId, onClose }) {
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetch(`${API_BASE}/entretiens?where[user][equals]=${userId}&sort=-createdAt&limit=20`)
      .then(r => r.json())
      .then(d => { setRecords(d.docs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  const scoreOf   = txt => { const m = (txt||'').match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i); return m ? parseInt(m[1]) : null; };
  const verdictOf = txt => { const m = (txt||'').match(/VERDICT\s*[:\-]\s*(.+)/i); return m ? m[1].trim() : ''; };
  const sc = s => {
    if (s === null) return { bg:'rgba(100,116,139,.15)', c:'#94a3b8', b:'rgba(100,116,139,.3)' };
    if (s > 75)    return { bg:'rgba(16,185,129,.15)',  c:'#34d399', b:'rgba(16,185,129,.3)'  };
    if (s > 50)    return { bg:'rgba(245,158,11,.15)',  c:'#fbbf24', b:'rgba(245,158,11,.3)'  };
    return               { bg:'rgba(239,68,68,.15)',   c:'#f87171', b:'rgba(239,68,68,.3)'   };
  };

  if (!userId) return (
    <div style={H.overlay}>
      <div style={H.drawer}>
        <div style={H.dHead}>
          <div style={H.dTitle}>📋 Historique</div>
          <button style={H.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={H.center}>
          <span style={{ fontSize:48 }}>🔐</span>
          <p style={{ color:'#f1f5f9', fontWeight:700, fontSize:15, textAlign:'center', marginTop:12 }}>Connectez-vous pour voir votre historique</p>
        </div>
      </div>
      <div style={H.backdrop} onClick={onClose} />
    </div>
  );

  return (
    <div style={H.overlay}>
      <div style={H.drawer}>
        <div style={H.dHead}>
          <div>
            <div style={H.dTitle}>📋 Historique des entretiens</div>
            <div style={H.dSub}>{records.length} entretien{records.length>1?'s':''}</div>
          </div>
          <button style={H.closeBtn} onClick={onClose}>✕</button>
        </div>
        {loading && <div style={H.center}>Chargement…</div>}
        {!loading && records.length === 0 && (
          <div style={H.center}><span style={{ fontSize:40 }}>📭</span><p style={{ color:'#64748b', marginTop:12 }}>Aucun entretien.</p></div>
        )}
        {!loading && records.length > 0 && !selected && (
          <div style={H.list}>
            {records.map(r => {
              const score   = scoreOf(r.score);
              const verdict = verdictOf(r.score);
              const col     = sc(score);
              return (
                <button key={r.id} style={H.card} className="hcard" onClick={() => setSelected(r)}>
                  <div style={{ ...H.scoreBadge, background:col.bg, color:col.c, border:`1px solid ${col.b}` }}>
                    {score !== null ? `${score}/100` : '—'}
                  </div>
                  <div style={H.cardMid}>
                    <div style={H.cardDate}>{new Date(r.createdAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
                    <div style={{ fontSize:13, fontWeight:600, color: score>75?'#34d399':score>50?'#fbbf24':'#f87171' }}>
                      {r.context && <span style={{ color:'#64748b', marginRight:6 }}>{r.context} ·</span>}
                      {verdict || 'Voir le rapport →'}
                    </div>
                  </div>
                  <div style={{ color:'#475569' }}>→</div>
                </button>
              );
            })}
          </div>
        )}
        {selected && (
          <div style={H.detail}>
            <button style={H.backBtn} onClick={() => setSelected(null)}>← Retour</button>
            {selected.context && <div style={{ fontSize:13, color:'#818cf8', fontWeight:600 }}>🎓 {selected.context}</div>}
            {scoreOf(selected.score) !== null && (
              <div style={{ fontFamily:'serif', fontSize:'3rem', fontWeight:700, color:'#c4b5fd' }}>
                {scoreOf(selected.score)}<span style={{ fontSize:'1.2rem', color:'#64748b' }}>/100</span>
              </div>
            )}
            <div style={{ fontSize:14, color:'#10b981', fontWeight:600 }}>{verdictOf(selected.score)}</div>
            <div style={{ fontSize:13, color:'#e2e8f0', lineHeight:1.75, whiteSpace:'pre-wrap', padding:16, borderRadius:12, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', marginTop:8 }}>{selected.score}</div>
          </div>
        )}
      </div>
      <div style={H.backdrop} onClick={onClose} />
      <style>{`.hcard{transition:all .18s}.hcard:hover{background:rgba(139,92,246,.1)!important;border-color:rgba(139,92,246,.35)!important;transform:translateX(4px)}`}</style>
    </div>
  );
}

const H = {
  overlay:  { position:'fixed', inset:0, zIndex:1000, display:'flex' },
  backdrop: { position:'absolute', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)' },
  drawer:   { position:'relative', zIndex:1, width:440, maxWidth:'95vw', background:'#0d0d22', borderRight:'1px solid rgba(255,255,255,.08)', display:'flex', flexDirection:'column', overflow:'hidden' },
  dHead:    { display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'24px 22px 18px', borderBottom:'1px solid rgba(255,255,255,.06)', flexShrink:0 },
  dTitle:   { fontSize:17, fontWeight:700, color:'#f1f5f9', marginBottom:4 },
  dSub:     { fontSize:12, color:'#64748b' },
  closeBtn: { background:'rgba(255,255,255,.05)', border:'none', color:'#94a3b8', width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16 },
  center:   { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#64748b', fontSize:14, gap:8 },
  list:     { flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 },
  card:     { display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', cursor:'pointer', textAlign:'left' },
  scoreBadge:{ padding:'6px 12px', borderRadius:99, fontWeight:700, fontSize:15, flexShrink:0 },
  cardMid:  { flex:1, display:'flex', flexDirection:'column', gap:4 },
  cardDate: { fontSize:12, color:'#64748b' },
  detail:   { flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 },
  backBtn:  { alignSelf:'flex-start', background:'rgba(255,255,255,.05)', border:'none', color:'#94a3b8', padding:'7px 14px', borderRadius:8, cursor:'pointer', fontSize:13 },
};

// ── BoursePicker ──────────────────────────────────────────────────────────────
function BoursePicker({ bourses, userId, onSelect }) {
  const [showHist, setShowHist] = useState(false);
  return (
    <div style={P.root}>
      <div style={P.glow} />
      <div style={P.inner}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={P.badge}>ENTRETIEN VIRTUEL IA</div>
          <button style={P.histBtn} onClick={() => setShowHist(true)}>📋 Mes entretiens</button>
        </div>
        <h1 style={P.h1}>Préparez votre<br /><em style={P.em}>entretien de bourse</em></h1>
        <p style={P.sub}>
          Le jury IA vous posera <strong style={{ color:'#e879f9' }}>{TOTAL_Q} questions</strong> avec analyse vocale et scoring en temps réel.
        </p>
        <div style={P.grid}>
          {bourses.length === 0 && <div style={P.empty}><span style={{ fontSize:36 }}>📭</span><p>Aucune bourse disponible.</p></div>}
          {bourses.map(b => (
            <div key={b.id} style={P.card} className="bcard-h">
              <div style={P.cardTop}>
                <span style={{ fontSize:24 }}>🎓</span>
                <span style={P.finance}>{b.financement}</span>
              </div>
              <div style={P.cardName}>{b.nom}</div>
              <div style={P.cardMeta}>{b.pays} · {b.niveau}</div>
              <button style={P.btnDemarrer} onClick={() => onSelect(b)}>🚀 Démarrer l'entretien</button>
            </div>
          ))}
        </div>
      </div>
      {showHist && <HistoriquePanel userId={userId} onClose={() => setShowHist(false)} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Cormorant+Garamond:ital,wght@0,600;1,500&display=swap');
        .bcard-h{transition:all .2s}.bcard-h:hover{transform:translateY(-4px)!important;border-color:rgba(232,121,249,.45)!important;box-shadow:0 14px 36px rgba(139,92,246,.2)!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
      `}</style>
    </div>
  );
}
const P = {
  root:       { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 16px', fontFamily:"'Outfit',sans-serif", position:'relative', background:'radial-gradient(ellipse 90% 55% at 50% -5%,rgba(139,92,246,.16),transparent)' },
  glow:       { position:'fixed', inset:0, pointerEvents:'none', background:'radial-gradient(circle at 75% 25%,rgba(232,121,249,.06),transparent 55%)' },
  inner:      { width:'100%', maxWidth:760, position:'relative', zIndex:1 },
  badge:      { display:'inline-flex', padding:'4px 16px', borderRadius:99, border:'1px solid rgba(139,92,246,.4)', color:'#a78bfa', fontSize:11, fontWeight:700, letterSpacing:2 },
  histBtn:    { padding:'8px 16px', borderRadius:10, background:'rgba(99,102,241,.12)', border:'1px solid rgba(99,102,241,.35)', color:'#818cf8', fontSize:13, fontWeight:600, cursor:'pointer' },
  h1:         { fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(2rem,5vw,2.8rem)', fontWeight:600, color:'#f1f5f9', lineHeight:1.15, marginBottom:14, marginTop:14 },
  em:         { color:'#e879f9', fontStyle:'italic' },
  sub:        { color:'#64748b', fontSize:15, marginBottom:36, maxWidth:500, lineHeight:1.6 },
  grid:       { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 },
  empty:      { textAlign:'center', color:'#475569', padding:'48px 0', gridColumn:'1/-1', display:'flex', flexDirection:'column', alignItems:'center', gap:8 },
  card:       { display:'flex', flexDirection:'column', gap:10, padding:'22px', borderRadius:16, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', textAlign:'left', color:'#f1f5f9', animation:'fadeUp .4s ease both' },
  cardTop:    { display:'flex', alignItems:'center', justifyContent:'space-between' },
  finance:    { fontSize:12, color:'#10b981', fontWeight:600, padding:'3px 10px', borderRadius:99, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.2)' },
  cardName:   { fontSize:15, fontWeight:700 },
  cardMeta:   { fontSize:13, color:'#64748b', marginBottom:4 },
  btnDemarrer:{ marginTop:6, padding:'11px 16px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6d28d9,#a21caf)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', width:'100%', boxShadow:'0 4px 18px rgba(139,92,246,.35)' },
};

// ── EntretienSession ──────────────────────────────────────────────────────────
function EntretienSession({ bourse, user, conversationId, onFinish }) {
  const [phase,          setPhase]         = useState('intro');
  const [qIndex,         setQIndex]        = useState(0);
  const [currentQ,       setCurrentQ]      = useState('');
  const [liveText,       setLiveText]      = useState('');
  const [elapsed,        setElapsed]       = useState(0);
  const [aiLoading,      setAiLoading]     = useState(false);
  const [allAnswers,     setAllAnswers]     = useState([]);
  const [finalScore,     setFinalScore]    = useState(null);
  const [camError,       setCamError]      = useState(false);

  // ── VRAIES MÉTRIQUES TEMPS RÉEL ──────────────────────────────────────────
  const [liveScore,      setLiveScore]     = useState(0);           // score live
  const [liveWpm,        setLiveWpm]       = useState(0);           // mots/min réels
  const [liveVolume,     setLiveVolume]    = useState(0);           // volume micro réel
  const [livePauses,     setLivePauses]    = useState(0);           // vraies pauses
  const [liveHesitations,setLiveHesitations]= useState(0);         // vraies hésitations (s)
  const [liveSpeakRatio, setLiveSpeakRatio]= useState(0);          // % temps parole
  const [liveStability,  setLiveStability] = useState(100);        // stabilité voix
  const [scoreHistory,   setScoreHistory]  = useState([]);          // historique scores
  const [sessionScores,  setSessionScores] = useState([]);          // score par question
  const [showHist,       setShowHist]      = useState(false);
  const [questionsAsked, setQuestionsAsked]= useState([]);

  const videoRef     = useRef(null);
  const streamRef    = useRef(null);
  const recRef       = useRef(null);
  const chunksRef    = useRef([]);
  const timerRef     = useRef(null);
  const afRef        = useRef(null);
  const srRef        = useRef(null);
  const analyzerRef  = useRef(null);   // VoiceAnalyzer instance
  const aiLockRef    = useRef(false);
  const savedRef     = useRef(false);

  const liveTextRef       = useRef('');
  const elapsedRef        = useRef(0);
  const answersRef        = useRef([]);
  const qIndexRef         = useRef(0);
  const questionsAskedRef = useRef([]);
  const phaseRef          = useRef('intro');
  const scoreUpdateRef    = useRef(null);

  useEffect(() => { liveTextRef.current       = liveText;      }, [liveText]);
  useEffect(() => { elapsedRef.current        = elapsed;       }, [elapsed]);
  useEffect(() => { qIndexRef.current         = qIndex;        }, [qIndex]);
  useEffect(() => { questionsAskedRef.current = questionsAsked;}, [questionsAsked]);
  useEffect(() => { phaseRef.current          = phase;         }, [phase]);

  useEffect(() => { initCamera(); return cleanup; }, []);

  const initCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
    } catch (e) { console.warn('Camera:', e.message); setCamError(true); }
  };

  const cleanup = () => {
    clearInterval(timerRef.current);
    clearInterval(scoreUpdateRef.current);
    cancelAnimationFrame(afRef.current);
    if (recRef.current?.state === 'recording') { try { recRef.current.stop(); } catch {} }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => { try { t.stop(); } catch {} }); streamRef.current = null; }
    try { if (srRef.current) { srRef.current.onend = null; srRef.current.stop(); } } catch {}
    if (analyzerRef.current) { analyzerRef.current.destroy(); analyzerRef.current = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  // ── Volume bar loop (séparé du VoiceAnalyzer) ────────────────────────────
  const startVolumeBar = useCallback((stream) => {
    try {
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const ana = ctx.createAnalyser(); ana.fftSize = 256;
      src.connect(ana);
      const buf = new Uint8Array(ana.frequencyBinCount);
      const tick = () => {
        ana.getByteFrequencyData(buf);
        const vol = Math.min(100, (buf.reduce((a,b)=>a+b,0)/buf.length)*2.8);
        setLiveVolume(vol);
        afRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
  }, []);

  // ── callAI avec AbortController compatible ───────────────────────────────
  const callAI = useCallback(async (payload, ctx, retry=1) => {
    if (aiLockRef.current) return { output: null };
    aiLockRef.current = true;
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 40000);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text:              typeof payload === 'string' ? payload : payload.lastAnswer || '',
          context:           ctx,
          conversationId,
          id:                user?.id    || null,
          email:             user?.email || null,
          bourse:            { id:bourse.id, nom:bourse.nom, pays:bourse.pays, niveau:bourse.niveau },
          entretien_history: typeof payload === 'object' ? payload.history || [] : [],
          question_index:    typeof payload === 'object' ? payload.questionIndex ?? 0 : 0,
          total_questions:   TOTAL_Q,
          bourse_context:    `${bourse.nom} | ${bourse.pays} | ${bourse.niveau} | ${bourse.financement||'100%'}`,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const txt = await res.text();
      aiLockRef.current = false;
      try { return JSON.parse(txt); } catch { return { output: txt }; }
    } catch (err) {
      clearTimeout(timeout);
      aiLockRef.current = false;
      if (retry > 0) return await callAI(payload, ctx, retry-1);
      return { output: null };
    }
  }, [bourse, user, conversationId]);

  const cleanQ = output => {
    if (!output || typeof output !== 'string' || output.trim().length < 10) return null;
    return output.trim().replace(/^(question\s*\d+\s*[:\-–]?\s*|Q\d+\s*[:\-–]?\s*)/i,'').trim();
  };

  const startInterview = async () => {
    setPhase('ai_speaking'); setAiLoading(true);
    savedRef.current = false; aiLockRef.current = false;
    setScoreHistory([]); setSessionScores([]);
    if (streamRef.current) startVolumeBar(streamRef.current);

    const prompt = `Tu es un jury officiel pour la bourse "${bourse.nom}" (${bourse.pays}, niveau ${bourse.niveau}).
Critères : excellence académique, motivation, projet professionnel, impact pays d'origine.
Pose la 1ère question (1/${TOTAL_Q}) comme un jury réel. UNIQUEMENT la question, sans préambule.`;

    const data = await callAI({ lastAnswer:prompt, history:[], questionIndex:0 }, 'start_entretien');
    const q    = cleanQ(data?.output) || `Présentez-vous et expliquez votre motivation pour la bourse ${bourse.nom}.`;

    setCurrentQ(q);
    setQIndex(0); qIndexRef.current = 0;
    setQuestionsAsked([q]); questionsAskedRef.current = [q];
    setAiLoading(false);
    await tts(q);
    setPhase('waiting');
  };

  // ── Démarrer enregistrement + analyse vocale réelle ──────────────────────
  const startRecording = () => {
    if (!streamRef.current || recRef.current?.state === 'recording') return;
    chunksRef.current = [];
    setLiveText(''); liveTextRef.current = '';
    setElapsed(0);   elapsedRef.current  = 0;
    setLiveScore(0); setLiveWpm(0); setLivePauses(0); setLiveHesitations(0);
    setPhase('recording');

    // Démarrer VoiceAnalyzer sur le stream
    if (analyzerRef.current) analyzerRef.current.destroy();
    analyzerRef.current = new VoiceAnalyzer(streamRef.current);
    analyzerRef.current.start();

    const mr = new MediaRecorder(streamRef.current);
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.start(200); recRef.current = mr;

    // Timer
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const n = prev + 1; elapsedRef.current = n;
        if (n >= 120) stopRecording();
        return n;
      });
    }, 1000);

    // ── Mise à jour métriques vocales en temps réel ──────────────────────
    scoreUpdateRef.current = setInterval(() => {
      if (!analyzerRef.current) return;
      const stats = analyzerRef.current.getStats();

      setLiveVolume(stats.volume);
      setLivePauses(stats.pauseCount);
      setLiveHesitations(stats.hesitations);
      setLiveSpeakRatio(stats.speakRatio);
      setLiveStability(stats.stability);

      // Score live basé sur transcription réelle + stats vocales
      const score = computeLiveScore(liveTextRef.current, stats, elapsedRef.current);
      setLiveScore(score.total);
      setLiveWpm(score.wpm);

      // Historique score pour graphique
      setScoreHistory(prev => [...prev.slice(-20), score.total]);
    }, 800);

    // SpeechRecognition avec relance auto
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const sr = new SR(); sr.lang = 'fr-FR'; sr.continuous = true; sr.interimResults = true;
      sr.onresult = e => {
        let t = '';
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + ' ';
        setLiveText(t.trim()); liveTextRef.current = t.trim();
      };
      sr.onerror = () => { try { sr.stop(); } catch {} };
      sr.onend   = () => { if (phaseRef.current === 'recording') { try { sr.start(); } catch {} } };
      try { sr.start(); } catch {}
      srRef.current = sr;
    }
  };

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(scoreUpdateRef.current);
    if (recRef.current?.state === 'recording') { try { recRef.current.stop(); } catch {} }
    try { if (srRef.current) { srRef.current.onend = null; srRef.current.stop(); } } catch {}
    if (analyzerRef.current) { analyzerRef.current.stop(); }
    setPhase('analyzing');
  }, []);

  // ── Analyser la réponse et passer à la suivante ──────────────────────────
  useEffect(() => {
    if (phase !== 'analyzing') return;

    const go = async () => {
      const curIdx    = qIndexRef.current;
      const isLast    = curIdx >= TOTAL_Q - 1;
      const answer    = liveTextRef.current || '(réponse audio sans transcription)';
      const dur       = elapsedRef.current;

      // Stats vocales finales de cette question
      const voiceStats = analyzerRef.current ? analyzerRef.current.getStats() : null;
      if (analyzerRef.current) { analyzerRef.current.destroy(); analyzerRef.current = null; }

      // Score final pour cette question
      const qScore = computeLiveScore(answer, voiceStats, dur);

      const entry = {
        q:          currentQ,
        a:          answer,
        duration:   dur,
        wordCount:  qScore.wordCount,
        wpm:        qScore.wpm,
        score:      qScore.total,
        breakdown:  qScore.breakdown,
        voice:      voiceStats,
      };
      answersRef.current = [...answersRef.current, entry];
      setAllAnswers([...answersRef.current]);
      setSessionScores(prev => [...prev, qScore.total]);

      const history = answersRef.current.map((e,i) => ({
        questionNumber: i+1,
        question:       e.q,
        answer:         e.a || '',
        duration:       e.duration,
        wordCount:      e.wordCount || 0,
        score:          e.score || 0,
      }));

      if (isLast) {
        // Évaluation finale par LLM
        const data   = await callAI({ lastAnswer:answer, history, questionIndex:curIdx }, 'fin_entretien');
        const output = data?.output || data?.message || data?.text || null;

        let scoreText;

        if (!output || output.trim() === '') {
          // Fallback basé sur vraies données collectées
          const answers      = answersRef.current;
          const totalAnswered= answers.filter(a => a.a && a.a !== '(réponse audio sans transcription)' && a.a.trim().length > 5).length;
          const avgScore     = answers.length ? Math.round(answers.reduce((a,b)=>a+(b.score||0),0)/answers.length) : 0;
          const validWpm     = answers.filter(a => (a.wpm||0) > 0 && (a.wpm||0) < 300);
        const avgWpm       = validWpm.length ? Math.round(validWpm.reduce((a,b)=>a+(b.wpm||0),0)/validWpm.length) : 0;
          const avgWords     = answers.length ? Math.round(answers.reduce((a,b)=>a+(b.wordCount||0),0)/answers.length) : 0;
          const totalPauses  = answers.reduce((a,b)=>a+(b.voice?.pauseCount||0),0);
          const totalHes     = answers.reduce((a,b)=>a+(b.voice?.hesitations||0),0);
          // ✅ Pénalité forte si pas de réponses développées
          const penalite    = totalAnswered === 0 ? 0 : avgScore;
          const globalScore = clamp(penalite, 0, 100);

          let verdict;
          if (globalScore >= 80)      verdict = 'Admis avec mention';
          else if (globalScore >= 65) verdict = 'Admis';
          else if (globalScore >= 50) verdict = "Liste d'attente";
          else if (globalScore >= 30) verdict = 'À renforcer';
          else                        verdict = 'Non admis';

          scoreText = `SCORE GLOBAL : ${globalScore}/100

VERDICT : ${verdict}

POINTS FORTS :
- ${totalAnswered}/${TOTAL_Q} questions développées
- Vitesse de parole moyenne : ${avgWpm} mots/min ${avgWpm>=90&&avgWpm<=160?'(idéale)':''}
- ${avgWords >= 40 ? `Bon développement moyen (${avgWords} mots/réponse)` : `Réponses à développer (${avgWords} mots/réponse)`}

POINTS À AMÉLIORER :
- ${totalPauses > 5 ? `${totalPauses} pauses longues détectées — préparez mieux vos transitions` : 'Fluidité du discours correcte'}
- ${totalHes > 10 ? `${totalHes}s d'hésitations — travaillez la mémorisation de vos arguments` : 'Peu d\'hésitations — bon signe'}
- ${avgWords < 30 ? 'Développez davantage vos réponses (visez 50-80 mots)' : 'Longueur des réponses satisfaisante'}

CONSEILS PERSONNALISÉS :
- Structurez chaque réponse : contexte → action → résultat
- Mentionnez explicitement les critères de la bourse ${bourse.nom}
- Préparez 2-3 exemples concrets liés au pays ${bourse.pays}

STATISTIQUES VOCALES :
- Vitesse moyenne : ${avgWpm} mots/min
- Hésitations totales : ${totalHes}s
- Pauses longues : ${totalPauses}`;
        } else {
          scoreText = output;
        }

        setFinalScore(scoreText);
        setPhase('result');
        if (!savedRef.current) {
          savedRef.current = true;
          await saveEntretien(user?.id, scoreText, conversationId, bourse.nom);
        }
        await tts('Entretien terminé. Voici votre évaluation complète.');

      } else {
        const nextIdx  = curIdx + 1;
        const quality  = qScore.wordCount > 40 ? 'approfondir' : qScore.wordCount > 15 ? 'normal' : 'reformuler';
        const instr    = quality === 'approfondir' ? 'Réponse développée — posez une question plus approfondie.'
                       : quality === 'reformuler'  ? 'Réponse courte — posez une question plus accessible.'
                       : '';

        const data = await callAI({
          lastAnswer:    `${answer}\n\n[INSTRUCTION: ${instr} Questions déjà posées: ${questionsAskedRef.current.join(' | ')}. NE PAS RÉPÉTER.]`,
          history,
          questionIndex: nextIdx,
        }, 'entretien');

        let nextQ = cleanQ(data?.output || data?.message || data?.text);

        if (!nextQ) {
          const used = new Set(questionsAskedRef.current.map(q=>q.toLowerCase().slice(0,30)));
          const fb   = [
            `Pourquoi ${bourse.nom} plutôt qu'une autre bourse ?`,
            `Décrivez un projet concret que vous réaliserez grâce à cette bourse.`,
            `Quelles compétences apportez-vous à cette opportunité ?`,
            `Comment votre formation vous prépare-t-elle à réussir à l'étranger ?`,
            `Quels sont vos objectifs professionnels à 5 ans après cette bourse ?`,
            `Comment comptez-vous maintenir le lien avec votre pays d'origine ?`,
            `Quelle difficulté anticipez-vous et comment comptez-vous la surmonter ?`,
            `Que connaissez-vous des priorités académiques de ${bourse.pays} ?`,
          ];
          nextQ = fb.find(q=>!used.has(q.toLowerCase().slice(0,30))) || fb[nextIdx % fb.length];
        }

        const upd = [...questionsAskedRef.current, nextQ];
        setQuestionsAsked(upd); questionsAskedRef.current = upd;
        setQIndex(nextIdx);     qIndexRef.current         = nextIdx;
        setCurrentQ(nextQ);
        setLiveText(''); liveTextRef.current = '';
        setElapsed(0);   elapsedRef.current  = 0;
        setLiveScore(0); setLiveWpm(0);
        setPhase('ai_speaking');
        await tts(nextQ);
        setPhase('waiting');
      }
    };

    go();
  }, [phase]);

  // ── Graphique score live ─────────────────────────────────────────────────
  const ScoreGraph = () => {
    if (scoreHistory.length < 2) return null;
    const h = 36, w = 120;
    const max = 100;
    const pts = scoreHistory.map((v,i) => {
      const x = (i / (scoreHistory.length-1)) * w;
      const y = h - (v / max) * h;
      return `${x},${y}`;
    }).join(' ');
    const col = liveScore >= 70 ? '#34d399' : liveScore >= 45 ? '#fbbf24' : '#f87171';
    return (
      <svg width={w} height={h} style={{ overflow:'visible' }}>
        <polyline points={pts} fill="none" stroke={col} strokeWidth="2" strokeLinejoin="round" />
        <circle cx={(scoreHistory.length-1)/(scoreHistory.length-1)*w} cy={h-(liveScore/max)*h} r="3" fill={col} />
      </svg>
    );
  };

  const parseScore = txt => {
    if (!txt) return {};
    const get = key => {
      const m = txt.match(new RegExp(`${key}\\s*[:\\-]\\s*([\\s\\S]+?)(?=\\n\\s*[-•*]?\\s*(?:SCORE|VERDICT|POINTS|CONSEILS|COMMENTAIRE|STATISTIQUES|DÉTAIL)|$)`, 'i'));
      return m ? m[1].trim() : null;
    };
    return {
      score:    txt.match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i)?.[1],
      verdict:  txt.match(/VERDICT\s*[:\-]\s*(.+)/i)?.[1]?.trim(),
      forts:    get('POINTS FORTS'),
      ameliore: get('POINTS À AMÉLIORER'),
      conseils: get('CONSEILS PERSONNALISÉS'),
    };
  };

  const parsed   = parseScore(finalScore);
  const avgScore = sessionScores.length ? Math.round(sessionScores.reduce((a,b)=>a+b,0)/sessionScores.length) : 0;

  return (
    <div style={T.root}>

      {/* ── Topbar ────────────────────────────────────────────────────── */}
      <div style={T.topbar}>
        <div style={T.tbLeft}>
          <div style={{ ...T.dot, background: phase==='recording'?'#ef4444':'#10b981' }} />
          <span style={T.tbName}>{bourse.nom}</span>
          <span style={T.sep}>·</span>
          <span style={T.tbMeta}>{bourse.pays} · {bourse.niveau}</span>
        </div>

        {/* Score live dans la topbar */}
        {phase === 'recording' && (
          <div style={{ display:'flex', alignItems:'center', gap:12, marginLeft:20 }}>
            <ScoreGraph />
            <div style={{ textAlign:'center' }}>
              <div style={{
                fontSize:22, fontWeight:900, fontFamily:'serif',
                color: liveScore>=70?'#34d399':liveScore>=45?'#fbbf24':'#f87171',
                lineHeight:1,
              }}>{liveScore}</div>
              <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:1 }}>score live</div>
            </div>
          </div>
        )}

        <div style={T.prog}>
          {[...Array(TOTAL_Q)].map((_,i) => (
            <div key={i} style={{ ...T.pDot,
              background:  i < qIndex ? '#8b5cf6' : i===qIndex ? '#e879f9' : 'rgba(255,255,255,.1)',
              transform:   i===qIndex ? 'scale(1.4)' : 'scale(1)',
              boxShadow:   i===qIndex ? '0 0 10px #e879f9' : 'none',
            }} />
          ))}
          {phase!=='intro'&&phase!=='result'&&<span style={T.pLabel}>Q{qIndex+1}/{TOTAL_Q}</span>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={T.histBtn} onClick={() => setShowHist(true)}>📋 Historique</button>
          <button style={T.quitBtn} onClick={() => { cleanup(); onFinish(); }}>✕ Quitter</button>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div style={T.body}>

        {/* Gauche : caméra + panel métriques */}
        <div style={T.left}>
          <div style={T.videoBox}>
            {camError
              ? <div style={T.noCam}><span style={{ fontSize:40 }}>📷</span><p>Caméra indisponible</p><small>L'entretien continue sans vidéo</small></div>
              : <video ref={videoRef} autoPlay muted playsInline style={T.video} />
            }
            {phase==='recording' && <div style={T.recBadge}><div style={T.recDot}/>REC &nbsp; {fmt(elapsed)}</div>}
            {phase==='ai_speaking' && (
              <div style={T.aiOverlay}>
                <div style={T.waveRow}>{[...Array(5)].map((_,i)=><div key={i} style={{ ...T.waveBar, animationDelay:`${i*0.12}s` }}/>)}</div>
                Jury IA parle…
              </div>
            )}
            {/* Volume bar réel */}
            <div style={T.meterBg}><div style={{ ...T.meterFill, width:`${liveVolume}%` }}/></div>
          </div>

          {/* ── Panel métriques temps réel ──────────────────────────── */}
          {phase !== 'intro' && phase !== 'result' && (
            <div style={T.metricsBox}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div style={T.mHead}>ANALYSE VOCALE EN DIRECT</div>
                {phase==='recording' && <div style={{ fontSize:10, color:'#475569' }}>{liveWpm} mots/min</div>}
              </div>

              {/* Indicateurs principaux */}
              {[
                { label:'Volume micro',  v:liveVolume,      icon:'🎙', real:true  },
                { label:'Stabilité voix',v:liveStability,   icon:'📊', real:true  },
                { label:'Ratio parole',  v:liveSpeakRatio,  icon:'⏱', real:true  },
              ].map(m => (
                <div key={m.label} style={T.mRow}>
                  <span style={T.mIcon}>{m.icon}</span>
                  <div style={T.mBarBg}>
                    <div style={{ ...T.mBarFill, width:`${m.v}%`,
                      background: m.v>75?'linear-gradient(90deg,#059669,#34d399)'
                                : m.v>45?'linear-gradient(90deg,#d97706,#fbbf24)'
                                :        'linear-gradient(90deg,#dc2626,#f87171)'
                    }}/>
                  </div>
                  <span style={T.mPct}>{m.v}%</span>
                  <span style={T.mLabel}>{m.label}</span>
                </div>
              ))}

              {/* Compteurs discrets */}
              <div style={{ display:'flex', gap:12, marginTop:4 }}>
                {[
                  { icon:'⏸', val:livePauses,     label:'pauses',    warn:livePauses>5     },
                  { icon:'💬', val:liveHesitations,label:'s hésit.',  warn:liveHesitations>8},
                  { icon:'📝', val:liveText.split(' ').filter(w=>w.length>1).length, label:'mots', warn:false },
                ].map(c => (
                  <div key={c.label} style={{ flex:1, textAlign:'center', padding:'6px 4px', borderRadius:8,
                    background:`rgba(${c.warn?'239,68,68':'99,102,241'},.06)`,
                    border:`1px solid rgba(${c.warn?'239,68,68':'99,102,241'},.15)` }}>
                    <div style={{ fontSize:15, fontWeight:700, color:c.warn?'#f87171':'#818cf8' }}>{c.val}</div>
                    <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase' }}>{c.icon} {c.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Droite : question + contrôles */}
        <div style={T.right}>

          {/* INTRO */}
          {phase==='intro' && (
            <div style={{ width:'100%', maxWidth:500, display:'flex', flexDirection:'column', height:'100%' }}>
              <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:14, paddingBottom:8 }}>
                <div style={{ textAlign:'center', fontSize:48 }}>🧑‍⚖️</div>
                <h2 style={{ ...T.panelH2, fontSize:'1.45rem', marginBottom:0 }}>Prêt pour votre entretien ?</h2>
                <p style={{ ...T.panelP, marginBottom:0 }}>
                  Le jury IA va vous poser <strong style={{ color:'#e879f9' }}>{TOTAL_Q} questions</strong> sur <strong style={{ color:'#c4b5fd' }}>{bourse.nom}</strong>.
                </p>
                {/* Ce qui est analysé */}
                <div style={{ padding:'14px 16px', borderRadius:12, background:'rgba(139,92,246,.06)', border:'1px solid rgba(139,92,246,.2)' }}>
                  <div style={{ fontSize:11, color:'#818cf8', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Ce que l'IA analyse en temps réel</div>
                  {[
                    ['📊','Contenu & richesse vocabulaire'],
                    ['⏱','Vitesse de parole (mots/min)'],
                    ['⏸','Pauses et hésitations réelles'],
                    ['🎙','Volume et stabilité de la voix'],
                    ['🧠','Scoring LLM basé sur vos réponses'],
                    ['📈','Score live mis à jour en continu'],
                  ].map(([ic,tx]) => (
                    <div key={tx} style={{ display:'flex', alignItems:'center', gap:10, fontSize:12, color:'#94a3b8', marginBottom:6 }}>
                      <span>{ic}</span><span>{tx}</span>
                    </div>
                  ))}
                </div>
                {[
                  ['🎤','Parlez clairement — le micro analyse votre voix'],
                  ['👁️','Gardez le contact visuel avec la caméra'],
                  ['⏱️','Maximum 2 min par réponse'],
                  ['🔊','Activez le son pour entendre les questions'],
                ].map(([ic,tx]) => (
                  <div key={tx} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 14px', borderRadius:10, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', fontSize:13, color:'#cbd5e1' }}>
                    <span>{ic}</span><span>{tx}</span>
                  </div>
                ))}
              </div>
              <div style={{ flexShrink:0, paddingTop:12 }}>
                <button style={T.btnStart} onClick={startInterview}>🚀 &nbsp; Démarrer l'entretien</button>
              </div>
            </div>
          )}

          {/* ENTRETIEN */}
          {['ai_speaking','waiting','recording','analyzing'].includes(phase) && (
            <div style={T.panel}>
              <div style={T.qHead}>
                <div style={T.qBadge}>Question {qIndex+1} / {TOTAL_Q}</div>
                {phase==='recording' && (
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <div style={{ ...T.timerBadge, fontSize:12 }}>{fmt(elapsed)}</div>
                    {liveWpm > 0 && <div style={{ padding:'5px 10px', borderRadius:99, background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.25)', color:'#818cf8', fontSize:11 }}>{liveWpm} m/min</div>}
                  </div>
                )}
              </div>

              <div style={T.qBubble}>
                {aiLoading
                  ? <div style={{ display:'flex', gap:7 }}>{[0,.15,.3].map(d=><div key={d} style={{ ...T.dot2, animationDelay:`${d}s` }}/>)}</div>
                  : <p style={{ margin:0, lineHeight:1.7 }}>{currentQ}</p>
                }
              </div>

              {phase==='recording' && liveText && (
                <div style={T.liveBox}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div style={T.liveHead}>📝 TRANSCRIPTION EN DIRECT</div>
                    <div style={{ fontSize:10, color: liveScore>=70?'#34d399':liveScore>=45?'#fbbf24':'#f87171', fontWeight:700 }}>
                      Score: {liveScore}/100
                    </div>
                  </div>
                  <p style={T.liveP}>{liveText}</p>
                  {/* Barre de score live animée */}
                  <div style={{ marginTop:8, height:3, borderRadius:99, background:'rgba(255,255,255,.05)', overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:99,
                      width:`${liveScore}%`,
                      background: liveScore>=70?'linear-gradient(90deg,#059669,#34d399)'
                                : liveScore>=45?'linear-gradient(90deg,#d97706,#fbbf24)'
                                :               'linear-gradient(90deg,#dc2626,#f87171)',
                      transition:'width .6s ease',
                    }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'#475569', marginTop:4 }}>
                    <span>{liveText.split(' ').filter(w=>w.length>1).length} mots</span>
                    <span>{liveText.split(' ').filter(w=>w.length>1).length >= 40 ? '✓ Bon développement' : `visez ${40 - liveText.split(' ').filter(w=>w.length>1).length} mots de plus`}</span>
                  </div>
                </div>
              )}

              {phase==='analyzing' && (
                <div style={T.analyzeBox}>
                  <div style={T.spinner}/>
                  <div>
                    <div style={{ color:'#e2e8f0', fontWeight:600, marginBottom:10 }}>Analyse en cours…</div>
                    {['Contenu & argumentation','Vitesse et fluidité','Pertinence à la bourse','Scoring LLM'].map((s,i)=>(
                      <div key={s} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7, animation:'fadeUp .4s ease both', animationDelay:`${i*.3}s`, opacity:0 }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:'#8b5cf6', flexShrink:0 }}/>
                        <span style={{ color:'#94a3b8', fontSize:13 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                {phase==='waiting'   && <button style={T.btnRec}  onClick={startRecording}><span style={{ fontSize:20 }}>🎤</span> Répondre à la question</button>}
                {phase==='recording' && <button style={T.btnStop} onClick={stopRecording}><span style={{ fontSize:20 }}>⏹</span> Terminer ma réponse</button>}
                {(phase==='ai_speaking'||phase==='analyzing') && (
                  <div style={T.hint}>{phase==='ai_speaking'?'🔊 Écoutez la question…':'⏳ Analyse en cours, patientez…'}</div>
                )}
              </div>
            </div>
          )}

          {/* RÉSULTATS */}
          {phase==='result' && (
            <div style={{ ...T.panel, overflowY:'auto', gap:16, padding:'20px 24px' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:50, marginBottom:10 }}>🏆</div>
                <h2 style={T.panelH2}>Résultats de l'entretien</h2>
                <p style={{ color:'#64748b', fontSize:13 }}>{bourse.nom} · {bourse.pays}</p>
                {user?.id && <p style={{ color:'#10b981', fontSize:12, marginTop:4 }}>✅ Sauvegardé dans votre historique</p>}
              </div>

              {/* Stats globales */}
              <div style={T.statsGrid}>
                {[
                  { v: parsed.score ? `${parsed.score}/100` : `${avgScore}/100`, l:'Score final'       },
                  { v: fmt(allAnswers.reduce((a,b)=>a+b.duration,0)),             l:'Durée totale'      },
                  { v: `${Math.round(allAnswers.reduce((a,b)=>a+(b.wpm||0),0)/Math.max(allAnswers.length,1))} m/min`, l:'Vitesse moy.'  },
                  { v: `${Math.round(allAnswers.reduce((a,b)=>a+(b.wordCount||0),0)/Math.max(allAnswers.length,1))}`, l:'Mots / réponse' },
                ].map(s => (
                  <div key={s.l} style={T.statCard}>
                    <div style={T.statV}>{s.v}</div>
                    <div style={T.statL}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Score par question */}
              {sessionScores.length > 0 && (
                <div style={{ padding:'16px', borderRadius:14, background:'rgba(15,15,30,.8)', border:'1px solid rgba(99,102,241,.15)' }}>
                  <div style={{ fontSize:11, color:'#818cf8', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Score par question</div>
                  <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:60 }}>
                    {sessionScores.map((s,i) => {
                      const col = s>=70?'#34d399':s>=45?'#fbbf24':'#f87171';
                      return (
                        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                          <div style={{ fontSize:9, color:col, fontWeight:700 }}>{s}</div>
                          <div style={{ width:'100%', borderRadius:'4px 4px 0 0', background:col, height:`${Math.max(4,(s/100)*48)}px`, opacity:.85 }}/>
                          <div style={{ fontSize:9, color:'#475569' }}>Q{i+1}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Statistiques vocales globales */}
              {allAnswers.some(a=>a.voice) && (
                <div style={{ padding:'16px', borderRadius:14, background:'rgba(15,15,30,.8)', border:'1px solid rgba(99,102,241,.15)' }}>
                  <div style={{ fontSize:11, color:'#818cf8', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Analyse vocale globale</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[
                      { icon:'⏱', label:'Vitesse moy.',    val:`${Math.round(allAnswers.reduce((a,b)=>a+(b.wpm||0),0)/Math.max(allAnswers.length,1))} mots/min`, ok: true },
                      { icon:'⏸', label:'Pauses totales',  val:`${allAnswers.reduce((a,b)=>a+(b.voice?.pauseCount||0),0)}`, ok: allAnswers.reduce((a,b)=>a+(b.voice?.pauseCount||0),0)<6 },
                      { icon:'💬', label:'Hésitations',     val:`${allAnswers.reduce((a,b)=>a+(b.voice?.hesitations||0),0)}s`, ok: allAnswers.reduce((a,b)=>a+(b.voice?.hesitations||0),0)<15 },
                      { icon:'📊', label:'Stabilité moy.',  val:`${Math.round(allAnswers.reduce((a,b)=>a+(b.voice?.stability||0),0)/Math.max(allAnswers.length,1))}%`, ok: true },
                    ].map(stat => (
                      <div key={stat.label} style={{ padding:'10px 12px', borderRadius:10, background:`rgba(${stat.ok?'99,102,241':'239,68,68'},.06)`, border:`1px solid rgba(${stat.ok?'99,102,241':'239,68,68'},.15)` }}>
                        <div style={{ fontSize:18, marginBottom:4 }}>{stat.icon}</div>
                        <div style={{ fontSize:14, fontWeight:700, color: stat.ok?'#818cf8':'#f87171' }}>{stat.val}</div>
                        <div style={{ fontSize:10, color:'#475569' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsed.verdict && (
                <div style={{ padding:'12px 18px', borderRadius:12, background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.2)', textAlign:'center' }}>
                  <span style={{ fontSize:13, color:'#64748b', display:'block', marginBottom:4 }}>VERDICT</span>
                  <span style={{ fontSize:16, fontWeight:700, color:'#34d399' }}>{parsed.verdict}</span>
                </div>
              )}

              {parsed.forts && (
                <div style={T.sectionCard}>
                  <div style={{ ...T.sectionHead, color:'#34d399' }}>✅ POINTS FORTS</div>
                  <div style={T.sectionBody}>{parsed.forts}</div>
                </div>
              )}
              {parsed.ameliore && (
                <div style={{ ...T.sectionCard, background:'rgba(245,158,11,.04)', border:'1px solid rgba(245,158,11,.2)' }}>
                  <div style={{ ...T.sectionHead, color:'#fbbf24' }}>⚠️ POINTS À AMÉLIORER</div>
                  <div style={T.sectionBody}>{parsed.ameliore}</div>
                </div>
              )}
              {parsed.conseils && (
                <div style={{ ...T.sectionCard, background:'rgba(139,92,246,.05)', border:'1px solid rgba(139,92,246,.2)' }}>
                  <div style={{ ...T.sectionHead, color:'#a78bfa' }}>💡 CONSEILS PERSONNALISÉS</div>
                  <div style={T.sectionBody}>{parsed.conseils}</div>
                </div>
              )}

              {/* Déroulement détaillé */}
              <div>
                <div style={T.scoreHead}>DÉROULEMENT DE L'ENTRETIEN</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                  {allAnswers.map((a,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.05)' }}>
                      <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(139,92,246,.2)', border:'1px solid rgba(139,92,246,.4)', color:'#a78bfa', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>{i+1}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                          <div style={{ fontSize:13, color:'#cbd5e1' }}>{a.q.slice(0,70)}{a.q.length>70?'…':''}</div>
                          <div style={{ fontSize:12, fontWeight:700, color: (a.score||0)>=70?'#34d399':(a.score||0)>=45?'#fbbf24':'#f87171', flexShrink:0, marginLeft:8 }}>{a.score||0}/100</div>
                        </div>
                        <div style={{ fontSize:11, color:'#64748b' }}>
                          ⏱ {fmt(a.duration)} · 📝 {a.wordCount||0} mots · 🏃 {a.wpm||0} m/min
                          {a.voice && ` · ⏸ ${a.voice.pauseCount} pauses · 💬 ${a.voice.hesitations}s hésit.`}
                        </div>
                        {a.a && a.a !== '(réponse audio sans transcription)' && (
                          <div style={{ fontSize:11, color:'#475569', marginTop:4, fontStyle:'italic' }}>
                            "{a.a.slice(0,90)}{a.a.length>90?'…':''}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:12 }}>
                <button style={T.btnRetry} onClick={() => {
                  answersRef.current=[]; setAllAnswers([]); setFinalScore(null);
                  setQIndex(0); qIndexRef.current=0; setCurrentQ('');
                  setQuestionsAsked([]); questionsAskedRef.current=[];
                  savedRef.current=false; aiLockRef.current=false;
                  setSessionScores([]); setScoreHistory([]);
                  setPhase('intro');
                }}>🔄 Recommencer</button>
                <button style={T.btnDone} onClick={() => { cleanup(); onFinish(); }}>✅ Terminer</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showHist && <HistoriquePanel userId={user?.id} onClose={() => setShowHist(false)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Cormorant+Garamond:ital,wght@0,600;1,500&display=swap');
        @keyframes pulse    { 0%,100%{opacity:1}50%{opacity:.35} }
        @keyframes recPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.6)}70%{box-shadow:0 0 0 9px rgba(239,68,68,0)} }
        @keyframes wave     { from{height:4px}to{height:24px} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes bounce   { 0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none} }
        @keyframes stopGlow { 0%,100%{box-shadow:0 0 10px rgba(239,68,68,.4)}50%{box-shadow:0 0 28px rgba(239,68,68,.7)} }
      `}</style>
    </div>
  );
}

const T = {
  root:       { height:'100vh', display:'flex', flexDirection:'column', background:'#06060f', fontFamily:"'Outfit',sans-serif", overflow:'hidden' },
  topbar:     { display:'flex', alignItems:'center', gap:14, padding:'11px 22px', flexShrink:0, background:'rgba(255,255,255,.02)', borderBottom:'1px solid rgba(255,255,255,.06)' },
  tbLeft:     { display:'flex', alignItems:'center', gap:9 },
  dot:        { width:9, height:9, borderRadius:'50%', flexShrink:0, animation:'pulse 2s infinite' },
  tbName:     { fontSize:14, fontWeight:700, color:'#f1f5f9' },
  sep:        { color:'rgba(255,255,255,.12)' },
  tbMeta:     { fontSize:13, color:'#64748b' },
  prog:       { display:'flex', alignItems:'center', gap:7, marginLeft:'auto' },
  pDot:       { width:9, height:9, borderRadius:'50%', transition:'all .4s ease', flexShrink:0 },
  pLabel:     { fontSize:12, color:'#64748b', marginLeft:6 },
  histBtn:    { padding:'6px 12px', borderRadius:8, background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.25)', color:'#818cf8', fontSize:12, cursor:'pointer' },
  quitBtn:    { padding:'6px 14px', borderRadius:8, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', color:'#f87171', fontSize:13, cursor:'pointer' },
  body:       { flex:1, display:'grid', gridTemplateColumns:'1fr 1.15fr', overflow:'hidden' },
  left:       { display:'flex', flexDirection:'column', background:'#080818', borderRight:'1px solid rgba(255,255,255,.05)', overflow:'hidden' },
  videoBox:   { flex:1, position:'relative', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  video:      { width:'100%', height:'100%', objectFit:'cover' },
  noCam:      { display:'flex', flexDirection:'column', alignItems:'center', gap:8, color:'#475569', textAlign:'center' },
  recBadge:   { position:'absolute', top:14, left:14, display:'flex', alignItems:'center', gap:7, padding:'6px 14px', borderRadius:99, background:'rgba(239,68,68,.88)', color:'#fff', fontSize:13, fontWeight:700, backdropFilter:'blur(8px)', animation:'recPulse 1.4s infinite' },
  recDot:     { width:9, height:9, borderRadius:'50%', background:'#fff', animation:'pulse 1s infinite' },
  aiOverlay:  { position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'10px 22px', borderRadius:12, background:'rgba(99,102,241,.9)', color:'#fff', fontSize:13, backdropFilter:'blur(8px)', whiteSpace:'nowrap' },
  waveRow:    { display:'flex', alignItems:'flex-end', gap:4, height:24 },
  waveBar:    { width:3, background:'#fff', borderRadius:99, animation:'wave .55s ease-in-out infinite alternate' },
  meterBg:    { position:'absolute', bottom:0, left:0, right:0, height:4, background:'rgba(255,255,255,.05)' },
  meterFill:  { height:'100%', borderRadius:'0 2px 2px 0', background:'linear-gradient(90deg,#6366f1,#10b981)', transition:'width .08s' },
  metricsBox: { padding:'14px 18px', flexShrink:0, background:'rgba(0,0,0,.45)', borderTop:'1px solid rgba(255,255,255,.04)', display:'flex', flexDirection:'column', gap:8 },
  mHead:      { fontSize:10, letterSpacing:2, color:'#475569', fontWeight:700 },
  mRow:       { display:'flex', alignItems:'center', gap:9 },
  mIcon:      { fontSize:14, width:18, textAlign:'center' },
  mBarBg:     { flex:1, height:5, background:'rgba(255,255,255,.07)', borderRadius:99, overflow:'hidden' },
  mBarFill:   { height:'100%', borderRadius:99, transition:'width .85s ease, background .5s' },
  mPct:       { fontSize:11, color:'#94a3b8', width:30, textAlign:'right' },
  mLabel:     { fontSize:11, color:'#64748b', width:90 },
  right:      { display:'flex', alignItems:'stretch', justifyContent:'center', padding:'24px 28px', overflow:'hidden', background:'radial-gradient(ellipse 80% 55% at 60% 20%,rgba(139,92,246,.07),transparent)' },
  panel:      { width:'100%', maxWidth:500, display:'flex', flexDirection:'column', gap:20, maxHeight:'100%' },
  panelH2:    { fontFamily:"'Cormorant Garamond',serif", fontSize:'1.75rem', fontWeight:600, color:'#f1f5f9', textAlign:'center', lineHeight:1.2 },
  panelP:     { color:'#64748b', fontSize:14, textAlign:'center', lineHeight:1.6 },
  btnStart:   { display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'18px 24px', borderRadius:14, width:'100%', border:'none', background:'linear-gradient(135deg,#7c3aed,#be185d)', color:'#fff', fontSize:17, fontWeight:700, cursor:'pointer', boxShadow:'0 8px 28px rgba(124,58,237,.5)' },
  qHead:      { display:'flex', alignItems:'center', justifyContent:'space-between' },
  qBadge:     { padding:'5px 14px', borderRadius:99, background:'rgba(139,92,246,.12)', border:'1px solid rgba(139,92,246,.3)', color:'#a78bfa', fontSize:12, fontWeight:700 },
  timerBadge: { padding:'5px 14px', borderRadius:99, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', color:'#f87171', fontSize:13, fontWeight:700 },
  qBubble:    { padding:'22px', borderRadius:16, background:'rgba(99,102,241,.07)', border:'1px solid rgba(99,102,241,.2)', color:'#e2e8f0', fontSize:15, minHeight:80, display:'flex', alignItems:'center' },
  dot2:       { width:10, height:10, borderRadius:'50%', background:'#8b5cf6', animation:'bounce .8s ease-in-out infinite' },
  liveBox:    { padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', maxHeight:130, overflowY:'auto' },
  liveHead:   { fontSize:10, color:'#475569', letterSpacing:1.5 },
  liveP:      { fontSize:13, color:'#94a3b8', fontStyle:'italic', margin:'6px 0 0' },
  analyzeBox: { display:'flex', alignItems:'flex-start', gap:18, padding:'18px 20px', borderRadius:14, background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)' },
  spinner:    { width:40, height:40, borderRadius:'50%', flexShrink:0, marginTop:2, border:'3px solid rgba(139,92,246,.12)', borderTopColor:'#8b5cf6', borderRightColor:'#e879f9', animation:'spin 1s linear infinite' },
  btnRec:     { display:'flex', alignItems:'center', justifyContent:'center', gap:12, width:'100%', padding:'18px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#047857,#10b981)', color:'#fff', fontSize:17, fontWeight:700, cursor:'pointer', boxShadow:'0 6px 24px rgba(16,185,129,.45)' },
  btnStop:    { display:'flex', alignItems:'center', justifyContent:'center', gap:12, width:'100%', padding:'18px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#b91c1c,#ef4444)', color:'#fff', fontSize:17, fontWeight:700, cursor:'pointer', animation:'stopGlow 1.6s ease-in-out infinite', boxShadow:'0 6px 24px rgba(239,68,68,.45)' },
  hint:       { textAlign:'center', color:'#94a3b8', fontSize:14, padding:'16px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)' },
  statsGrid:  { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 },
  statCard:   { padding:'14px 8px', borderRadius:12, textAlign:'center', background:'rgba(139,92,246,.08)', border:'1px solid rgba(139,92,246,.15)', display:'flex', flexDirection:'column', gap:5 },
  statV:      { fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:600, color:'#c4b5fd' },
  statL:      { fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:1 },
  sectionCard:{ padding:'16px 18px', borderRadius:14, background:'rgba(16,185,129,.04)', border:'1px solid rgba(16,185,129,.18)' },
  sectionHead:{ fontSize:11, letterSpacing:1.5, fontWeight:700, marginBottom:10 },
  sectionBody:{ color:'#e2e8f0', fontSize:13, lineHeight:1.75, whiteSpace:'pre-wrap' },
  scoreHead:  { fontSize:10, letterSpacing:2, color:'#475569', fontWeight:700, marginBottom:10 },
  btnRetry:   { flex:1, padding:'13px', borderRadius:12, background:'rgba(139,92,246,.1)', border:'1px solid rgba(139,92,246,.25)', color:'#a78bfa', fontSize:14, fontWeight:600, cursor:'pointer' },
  btnDone:    { flex:1, padding:'13px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#047857,#10b981)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' },
};

export default function EntretienPage({ user, bourses = [], conversationId, setView }) {
  const [selected, setSelected] = useState(null);
<<<<<<< HEAD
  if (!selected)
    return <BoursePicker bourses={bourses} userId={user?.id} onSelect={setSelected} />;
  return (
    <EntretienSession
      bourse={selected}
      user={user}
      conversationId={conversationId}
      onFinish={() => setSelected(null)}
    />
  );
}
=======
  if (!selected) return <BoursePicker bourses={bourses} userId={user?.id} onSelect={setSelected} />;
  return <EntretienSession bourse={selected} user={user} conversationId={conversationId} onFinish={() => setSelected(null)} />;
}
>>>>>>> 14b2ee325919ee1b8cc99811bbd2497fe921f968
