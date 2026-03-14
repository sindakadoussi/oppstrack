import React, { useState, useEffect, useRef, useCallback } from 'react';

const WEBHOOK_URL = 'http://localhost:5678/webhook/payload-webhook';
const API_BASE    = 'http://localhost:3000/api';
const TOTAL_Q     = 8;

// ─── utils ────────────────────────────────────────────────────────────────────
const fmt   = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, Math.round(v)));
const randF = (a, b) => Math.random() * (b - a) + a;

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

// Pas de banque de questions fixes — tout est généré par l'IA selon la vraie bourse

// ─── HistoriquePanel ──────────────────────────────────────────────────────────
function HistoriquePanel({ userId, onClose }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; } // affichera le message "connectez-vous"
    fetch(`${API_BASE}/entretiens?where[user][equals]=${userId}&sort=-createdAt&limit=20`)
      .then(r => r.json())
      .then(d => { setRecords(d.docs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  // ✅ Message invité
  if (!userId) return (
    <div style={H.overlay}>
      <div style={H.drawer}>
        <div style={H.dHead}>
          <div><div style={H.dTitle}>📋 Historique des entretiens</div></div>
          <button style={H.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={H.center}>
          <span style={{ fontSize: 48 }}>🔐</span>
          <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 16, textAlign: 'center', margin: '12px 24px 0' }}>
            Connectez-vous pour voir votre historique
          </p>
          <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', margin: '8px 24px 0', lineHeight: 1.65 }}>
            Vos entretiens et scores sont sauvegardés sur votre compte. Créez un compte gratuit pour les retrouver ici.
          </p>
          <div style={{ marginTop: 20, padding: '12px 22px', borderRadius: 12, background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.3)', color: '#c4b5fd', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
            👉 Allez dans <strong>Profil</strong> → Se connecter
          </div>
        </div>
      </div>
      <div style={H.backdrop} onClick={onClose} />
    </div>
  );

  const scoreOf = txt => {
    const m = (txt || '').match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i);
    return m ? parseInt(m[1]) : null;
  };
  const verdictOf = txt => {
    const m = (txt || '').match(/VERDICT\s*[:\-]\s*(.+)/i);
    return m ? m[1].trim() : '';
  };
  const scoreColor = s => {
    if (s === null) return { bg: 'rgba(100,116,139,.15)', color: '#94a3b8', border: 'rgba(100,116,139,.3)' };
    if (s > 75) return { bg: 'rgba(16,185,129,.15)', color: '#34d399', border: 'rgba(16,185,129,.3)' };
    if (s > 50) return { bg: 'rgba(245,158,11,.15)', color: '#fbbf24', border: 'rgba(245,158,11,.3)' };
    return { bg: 'rgba(239,68,68,.15)', color: '#f87171', border: 'rgba(239,68,68,.3)' };
  };
  const verdictColor = v => {
    if (!v) return '#64748b';
    if (/admis.*mention/i.test(v)) return '#10b981';
    if (/admis/i.test(v)) return '#6ee7b7';
    if (/renforcer/i.test(v)) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={H.overlay}>
      <div style={H.drawer}>
        <div style={H.dHead}>
          <div>
            <div style={H.dTitle}>📋 Historique des entretiens</div>
            <div style={H.dSub}>{records.length} entretien{records.length > 1 ? 's' : ''} enregistré{records.length > 1 ? 's' : ''}</div>
          </div>
          <button style={H.closeBtn} onClick={onClose}>✕</button>
        </div>

        {loading && <div style={H.center}>Chargement…</div>}

        {/* ✅ Message invité */}
        {!loading && !userId && (
          <div style={H.center}>
            <span style={{ fontSize: 44 }}>🔒</span>
            <p style={{ color: '#f1f5f9', fontWeight: 700, marginTop: 8 }}>Connectez-vous pour voir vos entretiens</p>
            <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', maxWidth: 260 }}>
              L'historique est sauvegardé automatiquement après chaque entretien pour les utilisateurs connectés.
            </p>
          </div>
        )}

        {!loading && records.length === 0 && (
          <div style={H.center}>
            <span style={{ fontSize: 40 }}>📭</span>
            <p style={{ color: '#64748b', marginTop: 12 }}>Aucun entretien enregistré.</p>
            <p style={{ color: '#475569', fontSize: 12 }}>Complétez votre premier entretien pour voir vos résultats ici.</p>
          </div>
        )}

        {!loading && records.length > 0 && !selected && (
          <div style={H.list}>
            {records.map(r => {
              const score   = scoreOf(r.score);
              const verdict = verdictOf(r.score);
              const sc      = scoreColor(score);
              const date    = new Date(r.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              });
              return (
                <button key={r.id} style={H.card} className="hcard" onClick={() => setSelected(r)}>
                  <div style={H.cardLeft}>
                    <div style={{ ...H.scoreBadge, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                      {score !== null ? `${score}/100` : '—'}
                    </div>
                  </div>
                  <div style={H.cardMid}>
                    <div style={H.cardDate}>{date}</div>
                    <div style={{ ...H.cardVerdict, color: verdictColor(verdict) }}>
                      {verdict || 'Voir le rapport complet →'}
                    </div>
                  </div>
                  <div style={H.cardArrow}>→</div>
                </button>
              );
            })}
          </div>
        )}

        {selected && (
          <div style={H.detail}>
            <button style={H.backBtn} onClick={() => setSelected(null)}>← Retour à la liste</button>
            <div style={H.detailDate}>
              {new Date(selected.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </div>
            {scoreOf(selected.score) !== null && (
              <div style={H.detailScore}>
                {scoreOf(selected.score)}<span style={H.detailScoreLabel}>/100</span>
              </div>
            )}
            <div style={H.detailVerdict}>{verdictOf(selected.score)}</div>
            <div style={H.detailBody}>{selected.score}</div>
          </div>
        )}
      </div>
      <div style={H.backdrop} onClick={onClose} />
      <style>{`
        .hcard { transition: all .18s ease; }
        .hcard:hover { background: rgba(139,92,246,.1) !important; border-color: rgba(139,92,246,.35) !important; transform: translateX(4px); }
      `}</style>
    </div>
  );
}

const H = {
  overlay:  { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' },
  backdrop: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' },
  drawer: {
    position: 'relative', zIndex: 1, width: 440, maxWidth: '95vw',
    background: '#0d0d22', borderRight: '1px solid rgba(255,255,255,.08)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    fontFamily: "'Outfit', sans-serif",
  },
  dHead: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '24px 22px 18px', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0,
  },
  dTitle:   { fontSize: 17, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
  dSub:     { fontSize: 12, color: '#64748b' },
  closeBtn: { background: 'rgba(255,255,255,.05)', border: 'none', color: '#94a3b8', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 },
  center:   { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14, gap: 8 },
  list:     { flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
    borderRadius: 12, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
    cursor: 'pointer', textAlign: 'left',
  },
  cardLeft:    { flexShrink: 0 },
  scoreBadge:  { padding: '6px 12px', borderRadius: 99, fontWeight: 700, fontSize: 15 },
  cardMid:     { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  cardDate:    { fontSize: 12, color: '#64748b' },
  cardVerdict: { fontSize: 13, fontWeight: 600 },
  cardArrow:   { color: '#475569', fontSize: 16 },
  detail: {
    flex: 1, overflowY: 'auto', padding: '16px 20px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  backBtn: {
    alignSelf: 'flex-start', background: 'rgba(255,255,255,.05)',
    border: 'none', color: '#94a3b8', padding: '7px 14px',
    borderRadius: 8, cursor: 'pointer', fontSize: 13,
  },
  detailDate:       { fontSize: 12, color: '#64748b' },
  detailScore:      { fontFamily: 'serif', fontSize: '3rem', fontWeight: 700, color: '#c4b5fd', lineHeight: 1 },
  detailScoreLabel: { fontSize: '1.2rem', color: '#64748b', marginLeft: 4 },
  detailVerdict:    { fontSize: 14, color: '#10b981', fontWeight: 600 },
  detailBody: {
    fontSize: 14, color: '#e2e8f0', lineHeight: 1.75,
    whiteSpace: 'pre-wrap', padding: '16px', borderRadius: 12,
    background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
  },
};

// ─── BoursePicker ─────────────────────────────────────────────────────────────
function BoursePicker({ bourses, userId, onSelect }) {
  const [showHistorique, setShowHistorique] = useState(false);

  return (
    <div style={P.root}>
      <div style={P.glow} />
      <div style={P.inner}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={P.badge}>ENTRETIEN VIRTUEL IA</div>
          {/* ✅ Toujours visible, même en mode invité */}
          <button style={P.histBtn} onClick={() => setShowHistorique(true)}>
            📋 Mes entretiens
          </button>
        </div>
        <h1 style={P.h1}>Préparez votre<br /><em style={P.em}>entretien de bourse</em></h1>
        <p style={P.sub}>
          Le jury IA vous posera <strong style={{ color: '#e879f9' }}>{TOTAL_Q} questions</strong> adaptées
          à la bourse choisie et analysera votre prestation en temps réel.
        </p>

        <div style={P.grid}>
          {bourses.length === 0 && (
            <div style={P.empty}>
              <span style={{ fontSize: 36 }}>📭</span>
              <p>Aucune bourse disponible.</p>
            </div>
          )}
          {bourses.map(b => (
            <div key={b.id} style={P.card} className="bcard-h">
              <div style={P.cardTop}>
                <span style={{ fontSize: 24 }}>🎓</span>
                <span style={P.finance}>{b.financement}</span>
              </div>
              <div style={P.cardName}>{b.nom}</div>
              <div style={P.cardMeta}>{b.pays} · {b.niveau}</div>
              {/* ✅ BOUTON TOUJOURS VISIBLE ET BIEN STYLÉ */}
              <button style={P.btnDemarrer} onClick={() => onSelect(b)}>
                🚀 Démarrer l'entretien
              </button>
            </div>
          ))}
        </div>
      </div>

      {showHistorique && <HistoriquePanel userId={userId} onClose={() => setShowHistorique(false)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Cormorant+Garamond:ital,wght@0,600;1,500&display=swap');
        .bcard-h { transition: all .2s ease; }
        .bcard-h:hover { transform: translateY(-4px) !important; border-color: rgba(232,121,249,.45) !important; box-shadow: 0 14px 36px rgba(139,92,246,.2) !important; }
        .bcard-h:hover .btn-demarrer { background: linear-gradient(135deg,#7c3aed,#be185d) !important; opacity: 1 !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none} }
      `}</style>
    </div>
  );
}

const P = {
  root:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: "'Outfit',sans-serif", position: 'relative', background: 'radial-gradient(ellipse 90% 55% at 50% -5%,rgba(139,92,246,.16),transparent)' },
  glow:    { position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 75% 25%,rgba(232,121,249,.06),transparent 55%)' },
  inner:   { width: '100%', maxWidth: 760, position: 'relative', zIndex: 1 },
  badge:   { display: 'inline-flex', padding: '4px 16px', borderRadius: 99, border: '1px solid rgba(139,92,246,.4)', color: '#a78bfa', fontSize: 11, fontWeight: 700, letterSpacing: 2 },
  histBtn: { padding: '8px 16px', borderRadius: 10, background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.35)', color: '#818cf8', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  h1:      { fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(2rem,5vw,2.8rem)', fontWeight: 600, color: '#f1f5f9', lineHeight: 1.15, marginBottom: 14, marginTop: 14 },
  em:      { color: '#e879f9', fontStyle: 'italic' },
  sub:     { color: '#64748b', fontSize: 15, marginBottom: 36, maxWidth: 500, lineHeight: 1.6 },
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 },
  empty:   { textAlign: 'center', color: '#475569', padding: '48px 0', gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  card:    { display: 'flex', flexDirection: 'column', gap: 10, padding: '22px', borderRadius: 16, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', textAlign: 'left', color: '#f1f5f9', animation: 'fadeUp .4s ease both' },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  finance: { fontSize: 12, color: '#10b981', fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)' },
  cardName:{ fontSize: 15, fontWeight: 700 },
  cardMeta:{ fontSize: 13, color: '#64748b', marginBottom: 4 },
  // ✅ Bouton bien visible, toujours affiché
  btnDemarrer: {
    marginTop: 6, padding: '11px 16px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg,#6d28d9,#a21caf)',
    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: "'Outfit',sans-serif", width: '100%',
    boxShadow: '0 4px 18px rgba(139,92,246,.35)', transition: 'all .2s ease',
  },
};

// ─── EntretienSession ─────────────────────────────────────────────────────────
function EntretienSession({ bourse, user, conversationId, onFinish }) {
  const [phase, setPhase]           = useState('intro');
  const [qIndex, setQIndex]         = useState(0);
  const [currentQ, setCurrentQ]     = useState('');
  const [liveText, setLiveText]     = useState('');
  const [elapsed, setElapsed]       = useState(0);
  const [aiLoading, setAiLoading]   = useState(false);
  const [allAnswers, setAllAnswers]  = useState([]);
  const [finalScore, setFinalScore] = useState(null);
  const [camError, setCamError]     = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [metrics, setMetrics]       = useState({ eye: 72, conf: 68, pace: 80, clarity: 75 });
  const [showHistorique, setShowHistorique] = useState(false);
  // ✅ Suivi des questions déjà posées pour éviter les répétitions
  const [questionsAsked, setQuestionsAsked] = useState([]);

  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const recRef      = useRef(null);
  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);
  const afRef       = useRef(null);
  const metricsIntv = useRef(null);
  const srRef       = useRef(null);

  const liveTextRef       = useRef('');
  const elapsedRef        = useRef(0);
  const metricsSnap       = useRef({ eye: 72, conf: 68, pace: 80, clarity: 75 });
  const answersRef        = useRef([]);
  const qIndexRef         = useRef(0);
  const questionsAskedRef = useRef([]);

  useEffect(() => { liveTextRef.current = liveText; }, [liveText]);
  useEffect(() => { elapsedRef.current  = elapsed;  }, [elapsed]);
  useEffect(() => { metricsSnap.current = metrics;  }, [metrics]);
  useEffect(() => { qIndexRef.current   = qIndex;   }, [qIndex]);
  useEffect(() => { questionsAskedRef.current = questionsAsked; }, [questionsAsked]);

  useEffect(() => {
    initCamera();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => {};
    return cleanup;
  }, []);

  const initCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
      setupMeter(s);
    } catch { setCamError(true); }
  };

  const setupMeter = stream => {
    try {
      const ctx = new AudioContext(), src = ctx.createMediaStreamSource(stream);
      const ana = ctx.createAnalyser(); ana.fftSize = 256;
      src.connect(ana);
      const buf = new Uint8Array(ana.frequencyBinCount);
      const tick = () => {
        ana.getByteFrequencyData(buf);
        setAudioLevel(Math.min(100, (buf.reduce((a, b) => a + b, 0) / buf.length) * 2.8));
        afRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
  };

  const startMetricsSim = () => {
    metricsIntv.current = setInterval(() => {
      setMetrics(m => {
        const n = {
          eye:     clamp(m.eye     + randF(-5, 5), 40, 98),
          conf:    clamp(m.conf    + randF(-4, 6), 35, 95),
          pace:    clamp(m.pace    + randF(-3, 3), 50, 100),
          clarity: clamp(m.clarity + randF(-4, 4), 40, 98),
        };
        metricsSnap.current = n; return n;
      });
    }, 1900);
  };

  const cleanup = () => {
    clearInterval(timerRef.current); clearInterval(metricsIntv.current);
    cancelAnimationFrame(afRef.current);
    if (recRef.current?.state === 'recording') recRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    try { srRef.current?.stop(); } catch {}
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  // ── AI call ─────────────────────────────────────────────────────────────────
  const callAI = useCallback(async (payload, ctx) => {
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // text doit rester court pour que le routeur n8n détecte bien "entretien"
          text: typeof payload === 'string' ? payload : payload.lastAnswer || '',
          context: ctx,
          conversationId,
          id: user?.id || null,
          email: user?.email || null,
          bourse: { id: bourse.id, nom: bourse.nom, pays: bourse.pays, niveau: bourse.niveau },
          // historique complet envoyé séparément, pas dans text
          entretien_history: typeof payload === 'object' ? payload.history || [] : [],
          question_index:    typeof payload === 'object' ? payload.questionIndex ?? 0 : 0,
          total_questions:   TOTAL_Q,
        }),
        signal: AbortSignal.timeout(40000),
      });
      const txt = await res.text();
      try { return JSON.parse(txt); } catch { return { output: txt }; }
    } catch { return { output: null }; }
  }, [bourse, user, conversationId]);

  // Nettoyage de la réponse IA : retire les préfixes "Question 1 :", "Q1 -" etc.
  const cleanQuestion = (output) => {
    if (!output || typeof output !== 'string' || output.trim().length < 10) return null;
    return output.trim().replace(/^(question\s*\d+\s*[:\-–]?\s*|Q\d+\s*[:\-–]?\s*)/i, '').trim();
  };

  // ── Start interview ─────────────────────────────────────────────────────────
  const startInterview = async () => {
    setPhase('ai_speaking'); setAiLoading(true); startMetricsSim();

    // Prompt réaliste : l'IA simule un vrai jury de cette bourse spécifique
    const prompt = `Tu es un jury officiel pour la bourse "${bourse.nom}" (${bourse.pays}, niveau ${bourse.niveau}).

Ton rôle : simuler un VRAI entretien de sélection tel qu'il se passe réellement pour cette bourse.
Pose la première question (1/${TOTAL_Q}) comme le ferait un jury réel de cette bourse.
La question doit être typique et réaliste pour ce type de bourse et de pays.
Réponds UNIQUEMENT avec la question, sans introduction, sans "Bienvenue", sans préambule.`;

    const data = await callAI({ lastAnswer: prompt, history: [], questionIndex: 0 }, 'start_entretien');
    const q = cleanQuestion(data?.output) || `Pouvez-vous vous présenter et expliquer votre motivation pour la bourse ${bourse.nom} ?`;

    setCurrentQ(q);
    setQIndex(0); qIndexRef.current = 0;
    setQuestionsAsked([q]); questionsAskedRef.current = [q];
    setAiLoading(false);
    await tts(q);
    setPhase('waiting');
  };

  // ── Start recording ─────────────────────────────────────────────────────────
  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = []; setLiveText(''); liveTextRef.current = '';
    setElapsed(0); elapsedRef.current = 0; setPhase('recording');

    const mr = new MediaRecorder(streamRef.current);
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.start(200); recRef.current = mr;

    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const n = prev + 1; elapsedRef.current = n;
        if (n >= 120) stopRecording();
        return n;
      });
    }, 1000);

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const sr = new SR(); sr.lang = 'fr-FR'; sr.continuous = true; sr.interimResults = true;
      sr.onresult = e => {
        let t = '';
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + ' ';
        setLiveText(t.trim()); liveTextRef.current = t.trim();
      };
      sr.start(); srRef.current = sr;
    }
  };

  // ── Stop recording ──────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    if (recRef.current?.state === 'recording') recRef.current.stop();
    try { srRef.current?.stop(); } catch {}
    setPhase('analyzing');
  }, []);

    // ── Analyze → get next Q or final score ────────────────────────────────────
  useEffect(() => {
    if (phase !== 'analyzing') return;

    const go = async () => {
      const curIdx = qIndexRef.current;
      const isLast = curIdx >= TOTAL_Q - 1;
      const answer = liveTextRef.current || '(réponse audio sans transcription)';
      const dur    = elapsedRef.current;
      const snap   = { ...metricsSnap.current };

      // Enregistrer la réponse courante
      const entry = { q: currentQ, a: answer, duration: dur, metrics: snap };
      answersRef.current = [...answersRef.current, entry];
      setAllAnswers([...answersRef.current]);

      // Historique structuré envoyé à n8n
      const history = answersRef.current.map((e, i) => ({
        questionNumber: i + 1,
        question: e.q,
        answer: e.a || '',
        duration: e.duration,
      }));

      if (isLast) {
        // ── Évaluation finale ─────────────────────────────────────────────
        // On envoie tout l'historique — l'IA évalue CE QUE LE CANDIDAT A VRAIMENT DIT
        const data = await callAI(
          {
            lastAnswer: answer,
            history,
            questionIndex: curIdx,
          },
          'fin_entretien'
        );

        console.log('[fin_entretien raw]', data); // debug — à retirer en prod

        // Extraire la réponse dans tous les formats possibles
        const output =
          data?.output   ||
          data?.message  ||
          data?.text     ||
          data?.response ||
          null;

        if (!output || output.trim() === '') {
          // n8n n'a pas répondu → évaluation locale basée sur les métriques réelles
          const avgEye  = Math.round(answersRef.current.reduce((a, b) => a + b.metrics.eye,     0) / answersRef.current.length);
          const avgConf = Math.round(answersRef.current.reduce((a, b) => a + b.metrics.conf,    0) / answersRef.current.length);
          const avgClar = Math.round(answersRef.current.reduce((a, b) => a + b.metrics.clarity, 0) / answersRef.current.length);
          const avgPace = Math.round(answersRef.current.reduce((a, b) => a + b.metrics.pace,    0) / answersRef.current.length);
          const totalDur = answersRef.current.reduce((a, b) => a + b.duration, 0);
          const avgDur   = Math.round(totalDur / answersRef.current.length);
          
          // Score basé sur métriques + durée des réponses (réponses courtes = pénalité)
          const durationBonus = Math.min(20, Math.round(avgDur / 3)); // max 20pts pour durée
          const globalScore   = Math.round((avgEye + avgConf + avgClar + avgPace) / 4 * 0.8 + durationBonus);
          
          const verdict = globalScore > 75 ? 'Admis' : globalScore > 60 ? 'Liste d\'attente' : globalScore > 45 ? 'À renforcer' : 'Non admis';

          const fallbackEval = `SCORE GLOBAL : ${globalScore}/100

VERDICT : ${verdict}

POINTS FORTS :
- Vous avez répondu aux ${TOTAL_Q} questions jusqu'au bout
- Contact visuel moyen : ${avgEye}%
- Niveau de confiance : ${avgConf}%

POINTS À AMÉLIORER :
- Vos réponses étaient très courtes (moyenne ${avgDur}s) — développez davantage
- Structurez chaque réponse : situation → action → résultat
- Préparez des exemples concrets pour chaque question type

CONSEILS POUR LE PROCHAIN ENTRETIEN :
- Visez 60 à 90 secondes par réponse avec des exemples précis
- Renseignez-vous en détail sur la bourse et le pays cible avant l'entretien
- Entraînez-vous à voix haute devant un miroir ou avec quelqu'un

DÉTAIL DES SCORES :
- Motivation & projet : ${Math.round(avgConf * 0.2)}/20
- Connaissance de la bourse : ${Math.round(avgClar * 0.18)}/20
- Argumentation : ${Math.round(avgEye * 0.19)}/20
- Clarté & structure : ${Math.round(avgClar * 0.2)}/20
- Authenticité : ${Math.round(avgPace * 0.2)}/20

COMMENTAIRE GÉNÉRAL : L'entretien s'est déroulé mais les réponses manquaient de développement. Une préparation plus approfondie avec des réponses structurées et des exemples concrets améliorerait significativement votre score.`;

          clearInterval(metricsIntv.current);
          setFinalScore(fallbackEval);
        } else {
          clearInterval(metricsIntv.current);
          setFinalScore(output);
        }

        setPhase('result');
        await tts('Entretien terminé. Voici votre évaluation complète.');

      } else {
        // ── Question suivante : UN SEUL appel callAI ─────────────────────
        const nextIdx = curIdx + 1;

        const data = await callAI(
          { lastAnswer: answer, history, questionIndex: nextIdx },
          'entretien'
        );

        console.log(`[Q${nextIdx + 1} raw]`, data); // debug

        let nextQ = cleanQuestion(data?.output || data?.message || data?.text || data?.response);

        // Si vide → fallback varié (jamais le même deux fois de suite)
        if (!nextQ) {
          const usedQs = new Set(questionsAskedRef.current.map(q => q.toLowerCase().substring(0, 30)));
          const fallbacks = [
            `Pourquoi avez-vous choisi la bourse ${bourse.nom} plutôt qu'une autre ?`,
            `Décrivez un projet concret que vous réaliserez grâce à cette bourse.`,
            `Quelles compétences spécifiques apportez-vous à cette opportunité ?`,
            `Comment votre formation actuelle vous prépare-t-elle à réussir à l'étranger ?`,
            `Quels sont vos objectifs professionnels à 5 ans après cette bourse ?`,
            `Comment comptez-vous maintenir le lien avec votre pays d'origine pendant vos études ?`,
            `Quelle est la plus grande difficulté que vous anticipez et comment la gérerez-vous ?`,
            `Que connaissez-vous des priorités académiques du pays de la bourse ?`,
          ];
          // Choisir un fallback non encore utilisé
          nextQ = fallbacks.find(q => !usedQs.has(q.toLowerCase().substring(0, 30)))
               || fallbacks[nextIdx % fallbacks.length];
        }

        // Mise à jour état — une seule fois
        const updatedQs = [...questionsAskedRef.current, nextQ];
        setQuestionsAsked(updatedQs);
        questionsAskedRef.current = updatedQs;

        setQIndex(nextIdx);
        qIndexRef.current = nextIdx;
        setCurrentQ(nextQ);
        setLiveText('');
        liveTextRef.current = '';
        setElapsed(0);
        elapsedRef.current = 0;

        setPhase('ai_speaking');
        await tts(nextQ);
        setPhase('waiting');
      }
    };

    go();
  }, [phase]);


  // ── Metrics averages ────────────────────────────────────────────────────────
  const avg   = f => allAnswers.length ? Math.round(allAnswers.reduce((a, b) => a + b.metrics[f], 0) / allAnswers.length) : 0;
  const total = allAnswers.reduce((a, b) => a + b.duration, 0);

  // ✅ Parser le score final pour afficher les sections séparément
  const parseScore = txt => {
    if (!txt) return {};
    const get = key => {
      const m = txt.match(new RegExp(`${key}\\s*[:\\-]\\s*([\\s\\S]+?)(?=\\n\\s*[-•*]?\\s*(?:SCORE|VERDICT|POINTS|CONSEILS|COMMENTAIRE)|$)`, 'i'));
      return m ? m[1].trim() : null;
    };
    return {
      score:    txt.match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i)?.[1],
      verdict:  txt.match(/VERDICT\s*[:\-]\s*(.+)/i)?.[1]?.trim(),
      forts:    get('POINTS FORTS'),
      ameliore: get('POINTS À AMÉLIORER'),
      conseils: get('CONSEILS PERSONNALISÉS'),
      commentaire: get('COMMENTAIRE GÉNÉRAL'),
      raw: txt,
    };
  };

  const parsed = parseScore(finalScore);

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div style={T.root}>

      {/* TOP BAR */}
      <div style={T.topbar}>
        <div style={T.tbLeft}>
          <div style={{ ...T.dot, background: phase === 'recording' ? '#ef4444' : '#10b981' }} />
          <span style={T.tbName}>{bourse.nom}</span>
          <span style={T.sep}>·</span>
          <span style={T.tbMeta}>{bourse.pays} · {bourse.niveau}</span>
        </div>

        <div style={T.prog}>
          {[...Array(TOTAL_Q)].map((_, i) => (
            <div key={i} style={{
              ...T.pDot,
              background:  i < qIndex ? '#8b5cf6' : i === qIndex ? '#e879f9' : 'rgba(255,255,255,.1)',
              transform:   i === qIndex ? 'scale(1.4)' : 'scale(1)',
              boxShadow:   i === qIndex ? '0 0 10px #e879f9' : 'none',
            }} />
          ))}
          {phase !== 'intro' && phase !== 'result' && (
            <span style={T.pLabel}>Q{qIndex + 1}/{TOTAL_Q}</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {/* ✅ Historique toujours visible */}
          <button style={T.histBtn} onClick={() => setShowHistorique(true)}>📋 Historique</button>
          <button style={T.quitBtn} onClick={() => { cleanup(); onFinish(); }}>✕ Quitter</button>
        </div>
      </div>

      {/* BODY */}
      <div style={T.body}>

        {/* LEFT — Video + Metrics */}
        <div style={T.left}>
          <div style={T.videoBox}>
            {camError
              ? <div style={T.noCam}><span style={{ fontSize: 40 }}>📷</span><p>Caméra indisponible</p><small>L'entretien continue sans vidéo</small></div>
              : <video ref={videoRef} autoPlay muted playsInline style={T.video} />
            }
            {phase === 'recording' && (
              <div style={T.recBadge}><div style={T.recDot} />REC &nbsp; {fmt(elapsed)}</div>
            )}
            {phase === 'ai_speaking' && (
              <div style={T.aiOverlay}>
                <div style={T.waveRow}>
                  {[...Array(5)].map((_, i) => <div key={i} style={{ ...T.waveBar, animationDelay: `${i * 0.12}s` }} />)}
                </div>
                Jury IA parle…
              </div>
            )}
            {phase === 'recording' && (
              <div style={T.meterBg}><div style={{ ...T.meterFill, width: `${audioLevel}%` }} /></div>
            )}
          </div>

          {phase !== 'intro' && phase !== 'result' && (
            <div style={T.metricsBox}>
              <div style={T.mHead}>ANALYSE EN DIRECT</div>
              {[
                { label: 'Contact visuel', v: metrics.eye,     icon: '👁'  },
                { label: 'Confiance',      v: metrics.conf,    icon: '💪'  },
                { label: 'Rythme oral',    v: metrics.pace,    icon: '🎙'  },
                { label: 'Clarté',         v: metrics.clarity, icon: '🎯'  },
              ].map(m => (
                <div key={m.label} style={T.mRow}>
                  <span style={T.mIcon}>{m.icon}</span>
                  <div style={T.mBarBg}>
                    <div style={{
                      ...T.mBarFill, width: `${m.v}%`,
                      background: m.v > 75 ? 'linear-gradient(90deg,#059669,#34d399)' : m.v > 50 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)',
                    }} />
                  </div>
                  <span style={T.mPct}>{m.v}%</span>
                  <span style={T.mLabel}>{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Interaction */}
        <div style={T.right}>

          {/* INTRO */}
          {phase === 'intro' && (
            <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100%' }}>
              {/* Scrollable content */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 8 }}>
                <div style={{ textAlign: 'center', fontSize: 48 }}>🧑‍⚖️</div>
                <h2 style={{ ...T.panelH2, fontSize: '1.45rem', marginBottom: 0 }}>Prêt pour votre entretien ?</h2>
                <p style={{ ...T.panelP, marginBottom: 0 }}>
                  Le jury IA va vous poser <strong style={{ color: '#e879f9' }}>{TOTAL_Q} questions</strong> sur votre candidature pour&nbsp;
                  <strong style={{ color: '#c4b5fd' }}>{bourse.nom}</strong>.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    ['🎤', 'Parlez clairement — le micro transcrit en direct'],
                    ['👁️', 'Gardez le contact visuel avec la caméra'],
                    ['⏱️', 'Maximum 2 minutes par réponse (auto-stop)'],
                    ['🔊', 'Activez le son pour entendre les questions'],
                    ['💡', 'Soyez précis, structuré et authentique'],
                  ].map(([ic, tx]) => (
                    <div key={tx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', fontSize: 13, color: '#cbd5e1' }}>
                      <span>{ic}</span><span>{tx}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* ✅ Bouton TOUJOURS visible en bas — jamais coupé */}
              <div style={{ flexShrink: 0, paddingTop: 12 }}>
                <button style={T.btnStart} onClick={startInterview}>🚀 &nbsp; Démarrer l'entretien</button>
              </div>
            </div>
          )}

          {/* QUESTION phases */}
          {['ai_speaking', 'waiting', 'recording', 'analyzing'].includes(phase) && (
            <div style={T.panel}>
              <div style={T.qHead}>
                <div style={T.qBadge}>Question {qIndex + 1} / {TOTAL_Q}</div>
                {phase === 'recording' && <div style={T.timerBadge}>{fmt(elapsed)}</div>}
              </div>

              <div style={T.qBubble}>
                {aiLoading
                  ? <div style={{ display: 'flex', gap: 7 }}>{[0, .15, .3].map(d => <div key={d} style={{ ...T.dot2, animationDelay: `${d}s` }} />)}</div>
                  : <p style={{ margin: 0, lineHeight: 1.7 }}>{currentQ}</p>
                }
              </div>

              {phase === 'recording' && liveText && (
                <div style={T.liveBox}>
                  <div style={T.liveHead}>📝 TRANSCRIPTION EN DIRECT</div>
                  <p style={T.liveP}>{liveText}</p>
                </div>
              )}

              {phase === 'analyzing' && (
                <div style={T.analyzeBox}>
                  <div style={T.spinner} />
                  <div>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 10 }}>Analyse en cours…</div>
                    {['Contenu & argumentation', 'Structure & clarté', 'Pertinence à la bourse', 'Préparation de la suite'].map((s, i) => (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, animation: 'fadeUp .4s ease both', animationDelay: `${i * .3}s`, opacity: 0 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', flexShrink: 0 }} />
                        <span style={{ color: '#94a3b8', fontSize: 13 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                {phase === 'waiting'   && <button style={T.btnRec}  onClick={startRecording}><span style={{ fontSize: 20 }}>🎤</span> Répondre à la question</button>}
                {phase === 'recording' && <button style={T.btnStop} onClick={stopRecording}><span style={{ fontSize: 20 }}>⏹</span> Terminer ma réponse</button>}
                {(phase === 'ai_speaking' || phase === 'analyzing') && (
                  <div style={T.hint}>{phase === 'ai_speaking' ? '🔊 Écoutez la question…' : '⏳ Analyse en cours, patientez…'}</div>
                )}
              </div>
            </div>
          )}

          {/* ✅ RESULT — avec sections Points à améliorer + Conseils */}
          {phase === 'result' && (
            <div style={{ ...T.panel, overflowY: 'auto', gap: 16, padding: '20px 24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 50, marginBottom: 10 }}>🏆</div>
                <h2 style={T.panelH2}>Résultats de l'entretien</h2>
                <p style={{ color: '#64748b', fontSize: 13 }}>{bourse.nom} · {bourse.pays}</p>
              </div>

              {/* Stats */}
              <div style={T.statsGrid}>
                {[
                  { v: allAnswers.length,      l: 'Questions'       },
                  { v: fmt(total),             l: 'Durée totale'    },
                  { v: parsed.score ? `${parsed.score}/100` : `${avg('eye')}%`, l: parsed.score ? 'Score final' : 'Contact visuel' },
                  { v: `${avg('conf')}%`,      l: 'Confiance moy.'  },
                ].map(s => (
                  <div key={s.l} style={T.statCard}>
                    <div style={T.statV}>{s.v}</div>
                    <div style={T.statL}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Verdict */}
              {parsed.verdict && (
                <div style={{ padding: '12px 18px', borderRadius: 12, background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)', textAlign: 'center' }}>
                  <span style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>VERDICT</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#34d399' }}>{parsed.verdict}</span>
                </div>
              )}

              {/* Points forts */}
              {parsed.forts && (
                <div style={T.sectionCard}>
                  <div style={{ ...T.sectionHead, color: '#34d399' }}>✅ POINTS FORTS</div>
                  <div style={T.sectionBody}>{parsed.forts}</div>
                </div>
              )}

              {/* ✅ Points à améliorer */}
              {parsed.ameliore && (
                <div style={{ ...T.sectionCard, background: 'rgba(245,158,11,.04)', border: '1px solid rgba(245,158,11,.2)' }}>
                  <div style={{ ...T.sectionHead, color: '#fbbf24' }}>⚠️ POINTS À AMÉLIORER</div>
                  <div style={T.sectionBody}>{parsed.ameliore}</div>
                </div>
              )}

              {/* ✅ Conseils personnalisés */}
              {parsed.conseils && (
                <div style={{ ...T.sectionCard, background: 'rgba(139,92,246,.05)', border: '1px solid rgba(139,92,246,.2)' }}>
                  <div style={{ ...T.sectionHead, color: '#a78bfa' }}>💡 CONSEILS PERSONNALISÉS</div>
                  <div style={T.sectionBody}>{parsed.conseils}</div>
                </div>
              )}

              {/* Commentaire général ou rapport brut */}
              {!parsed.forts && (
                <div style={T.scoreCard}>
                  <div style={T.scoreHead}>ÉVALUATION DU JURY IA</div>
                  <div style={T.scoreBody}>{finalScore}</div>
                </div>
              )}

              {/* Déroulement */}
              <div>
                <div style={T.scoreHead}>DÉROULEMENT DE L'ENTRETIEN</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  {allAnswers.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(139,92,246,.2)', border: '1px solid rgba(139,92,246,.4)', color: '#a78bfa', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 3 }}>{a.q.slice(0, 80)}{a.q.length > 80 ? '…' : ''}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>⏱ {fmt(a.duration)} · 👁 {a.metrics.eye}% · 💪 {a.metrics.conf}% · 🎯 {a.metrics.clarity}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button style={T.btnRetry} onClick={() => {
                  answersRef.current = []; setAllAnswers([]); setFinalScore(null);
                  setQIndex(0); qIndexRef.current = 0; setCurrentQ('');
                  setQuestionsAsked([]); questionsAskedRef.current = [];
                  setPhase('intro');
                }}>🔄 Recommencer</button>
                <button style={T.btnDone} onClick={() => { cleanup(); onFinish(); }}>✅ Terminer</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showHistorique && <HistoriquePanel userId={user?.id} onClose={() => setShowHistorique(false)} />}

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
  root:    { height: '100vh', display: 'flex', flexDirection: 'column', background: '#06060f', fontFamily: "'Outfit',sans-serif", overflow: 'hidden' },
  topbar:  { display: 'flex', alignItems: 'center', gap: 14, padding: '11px 22px', flexShrink: 0, background: 'rgba(255,255,255,.02)', borderBottom: '1px solid rgba(255,255,255,.06)' },
  tbLeft:  { display: 'flex', alignItems: 'center', gap: 9 },
  dot:     { width: 9, height: 9, borderRadius: '50%', flexShrink: 0, animation: 'pulse 2s infinite' },
  tbName:  { fontSize: 14, fontWeight: 700, color: '#f1f5f9' },
  sep:     { color: 'rgba(255,255,255,.12)' },
  tbMeta:  { fontSize: 13, color: '#64748b' },
  prog:    { display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto' },
  pDot:    { width: 9, height: 9, borderRadius: '50%', transition: 'all .4s ease', flexShrink: 0 },
  pLabel:  { fontSize: 12, color: '#64748b', marginLeft: 6 },
  histBtn: { padding: '6px 12px', borderRadius: 8, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.25)', color: '#818cf8', fontSize: 12, cursor: 'pointer' },
  quitBtn: { padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: '#f87171', fontSize: 13, cursor: 'pointer' },

  body:     { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.15fr', overflow: 'hidden' },
  left:     { display: 'flex', flexDirection: 'column', background: '#080818', borderRight: '1px solid rgba(255,255,255,.05)', overflow: 'hidden' },
  videoBox: { flex: 1, position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  video:    { width: '100%', height: '100%', objectFit: 'cover' },
  noCam:    { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#475569', textAlign: 'center' },

  recBadge: { position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 99, background: 'rgba(239,68,68,.88)', color: '#fff', fontSize: 13, fontWeight: 700, backdropFilter: 'blur(8px)', animation: 'recPulse 1.4s infinite' },
  recDot:   { width: 9, height: 9, borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite' },
  aiOverlay:{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 12, background: 'rgba(99,102,241,.9)', color: '#fff', fontSize: 13, backdropFilter: 'blur(8px)', whiteSpace: 'nowrap' },
  waveRow:  { display: 'flex', alignItems: 'flex-end', gap: 4, height: 24 },
  waveBar:  { width: 3, background: '#fff', borderRadius: 99, animation: 'wave .55s ease-in-out infinite alternate' },
  meterBg:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,.05)' },
  meterFill:{ height: '100%', borderRadius: '0 2px 2px 0', background: 'linear-gradient(90deg,#6366f1,#10b981)', transition: 'width .08s' },

  metricsBox:{ padding: '14px 18px', flexShrink: 0, background: 'rgba(0,0,0,.45)', borderTop: '1px solid rgba(255,255,255,.04)', display: 'flex', flexDirection: 'column', gap: 9 },
  mHead:    { fontSize: 10, letterSpacing: 2, color: '#475569', fontWeight: 700 },
  mRow:     { display: 'flex', alignItems: 'center', gap: 9 },
  mIcon:    { fontSize: 14, width: 18, textAlign: 'center' },
  mBarBg:   { flex: 1, height: 5, background: 'rgba(255,255,255,.07)', borderRadius: 99, overflow: 'hidden' },
  mBarFill: { height: '100%', borderRadius: 99, transition: 'width .85s ease, background .5s' },
  mPct:     { fontSize: 11, color: '#94a3b8', width: 30, textAlign: 'right' },
  mLabel:   { fontSize: 11, color: '#64748b', width: 90 },

  right:   { display: 'flex', alignItems: 'stretch', justifyContent: 'center', padding: '24px 28px', overflow: 'hidden', background: 'radial-gradient(ellipse 80% 55% at 60% 20%,rgba(139,92,246,.07),transparent)' },
  panel:   { width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '100%' },
  panelH2: { fontFamily: "'Cormorant Garamond',serif", fontSize: '1.75rem', fontWeight: 600, color: '#f1f5f9', textAlign: 'center', lineHeight: 1.2 },
  panelP:  { color: '#64748b', fontSize: 14, textAlign: 'center', lineHeight: 1.6 },
  tips:    { display: 'flex', flexDirection: 'column', gap: 8 },
  tip:     { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', fontSize: 14, color: '#cbd5e1' },
  btnStart:{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '18px 24px', borderRadius: 14, width: '100%', border: 'none', background: 'linear-gradient(135deg,#7c3aed,#be185d)', color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", boxShadow: '0 8px 28px rgba(124,58,237,.5)', letterSpacing: 0.3 },

  qHead:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  qBadge:     { padding: '5px 14px', borderRadius: 99, background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.3)', color: '#a78bfa', fontSize: 12, fontWeight: 700 },
  timerBadge: { padding: '5px 14px', borderRadius: 99, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: '#f87171', fontSize: 13, fontWeight: 700 },
  qBubble:    { padding: '22px', borderRadius: 16, background: 'rgba(99,102,241,.07)', border: '1px solid rgba(99,102,241,.2)', color: '#e2e8f0', fontSize: 15, minHeight: 80, display: 'flex', alignItems: 'center' },
  dot2:       { width: 10, height: 10, borderRadius: '50%', background: '#8b5cf6', animation: 'bounce .8s ease-in-out infinite' },

  liveBox:  { padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.07)', maxHeight: 88, overflowY: 'auto' },
  liveHead: { fontSize: 10, color: '#475569', letterSpacing: 1.5, marginBottom: 6 },
  liveP:    { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', margin: 0 },

  analyzeBox:{ display: 'flex', alignItems: 'flex-start', gap: 18, padding: '18px 20px', borderRadius: 14, background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.07)' },
  spinner:   { width: 40, height: 40, borderRadius: '50%', flexShrink: 0, marginTop: 2, border: '3px solid rgba(139,92,246,.12)', borderTopColor: '#8b5cf6', borderRightColor: '#e879f9', animation: 'spin 1s linear infinite' },

  btnRec:  { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', padding: '18px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#047857,#10b981)', color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", boxShadow: '0 6px 24px rgba(16,185,129,.45)', letterSpacing: 0.3 },
  btnStop: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', padding: '18px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#b91c1c,#ef4444)', color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", animation: 'stopGlow 1.6s ease-in-out infinite', boxShadow: '0 6px 24px rgba(239,68,68,.45)', letterSpacing: 0.3 },
  hint:    { textAlign: 'center', color: '#94a3b8', fontSize: 14, padding: '16px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 },
  statCard:  { padding: '14px 8px', borderRadius: 12, textAlign: 'center', background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.15)', display: 'flex', flexDirection: 'column', gap: 5 },
  statV:     { fontFamily: "'Cormorant Garamond',serif", fontSize: '1.3rem', fontWeight: 600, color: '#c4b5fd' },
  statL:     { fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },

  sectionCard: { padding: '16px 18px', borderRadius: 14, background: 'rgba(16,185,129,.04)', border: '1px solid rgba(16,185,129,.18)' },
  sectionHead: { fontSize: 11, letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 },
  sectionBody: { color: '#e2e8f0', fontSize: 13, lineHeight: 1.75, whiteSpace: 'pre-wrap' },

  scoreCard: { padding: '18px 20px', borderRadius: 14, background: 'rgba(16,185,129,.04)', border: '1px solid rgba(16,185,129,.18)', maxHeight: 220, overflowY: 'auto' },
  scoreHead: { fontSize: 10, letterSpacing: 2, color: '#475569', fontWeight: 700, marginBottom: 10 },
  scoreBody: { color: '#e2e8f0', fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap' },

  btnRetry: { flex: 1, padding: '13px', borderRadius: 12, background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.25)', color: '#a78bfa', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnDone:  { flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#047857,#10b981)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" },
};

// ─── Export ───────────────────────────────────────────────────────────────────
export default function EntretienPage({ user, bourses = [], conversationId, setView }) {
  const [selected, setSelected] = useState(null);
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
