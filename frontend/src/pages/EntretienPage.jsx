import React, { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '@/config/axiosInstance';
import axios from 'axios';
import { WEBHOOK_ROUTES } from '@/config/routes';
import { API_ROUTES } from '@/config/routes';
import './EntretienPage.css';

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

// ── Sauvegarder entretien ─────────────────────────────────────────────────────
async function saveEntretien(userId, scoreText, conversationId, bourseNom) {
  if (!userId) return;
  try {
    await axiosInstance.post('/api/entretiens', {
      user: userId,
      score: scoreText,
      conversationId: conversationId || `entretien-${Date.now()}`,
      context: bourseNom || '',
    });
  } catch(e) { console.error('❌ Save entretien:', e.message); }
}

// ── VoiceAnalyzer ─────────────────────────────────────────────────────────────
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

// ── LoginModal ────────────────────────────────────────────────────────────────
function LoginModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const send = async () => {
    if (!email || !email.includes('@')) { setErrMsg('Email invalide'); return; }
    setStatus('sending');
    try {
      await axiosInstance.post('/api/users/request-magic-link', { email: email.trim().toLowerCase() });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrMsg(err.response?.data?.message || 'Impossible de contacter le serveur');
    }
  };

  return (
    <div className="ep-modal-overlay">
      <div className="ep-modal-container">
        <div className="ep-modal-header">
          <span style={{ fontSize: 22 }}>🔐</span>
          <span>Connexion à OppsTrack</span>
          <button className="ep-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ep-modal-body">
          {status === 'idle' && (
            <>
              <p>Entrez votre email pour recevoir un <strong style={{ color: '#1a3a6b' }}>lien de connexion magique</strong>.</p>
              <input type="email" placeholder="votre@email.com" value={email} autoFocus
                onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                className="ep-modal-input" />
              {errMsg && <div className="ep-modal-error">{errMsg}</div>}
              <button className="ep-modal-btn" onClick={send}>✉️ Envoyer le lien magique</button>
            </>
          )}
          {status === 'sending' && (
            <div className="ep-modal-center">
              <div className="ep-spinner" />
              <p style={{ color: '#64748b', marginTop: 14 }}>Envoi en cours...</p>
            </div>
          )}
          {status === 'success' && (
            <div className="ep-modal-center">
              <div style={{ fontSize: 52, marginBottom: 12 }}>✉️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 8 }}>Lien envoyé !</div>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
                Vérifiez votre boîte mail (et les spams).<br />Cliquez sur le lien pour vous connecter.
              </p>
              <button className="ep-modal-btn success" style={{ marginTop: 20 }} onClick={onClose}>✓ Fermer</button>
            </div>
          )}
          {status === 'error' && (
            <div className="ep-modal-center">
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#dc2626', marginBottom: 12 }}>{errMsg}</p>
              <button className="ep-modal-btn error" onClick={() => { setStatus('idle'); setErrMsg(''); }}>Réessayer</button>
            </div>
          )}
        </div>
      </div>
      <div className="ep-modal-backdrop" onClick={onClose} />
    </div>
  );
}

// ── EntretienDetail ───────────────────────────────────────────────────────────
function EntretienDetail({ entretien, onBack, parseEntretien, getScoreColor, formatDate }) {
  const [activeTab, setActiveTab] = useState('summary');
  const parsed = parseEntretien(entretien.score);
  const scoreColor = getScoreColor(parsed.score);

  return (
    <div className="ep-detail-container">
      <button className="ep-detail-back" onClick={onBack}>
        <span style={{ fontSize: 18 }}>←</span> Retour à la liste
      </button>

      <div className="ep-detail-header">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', background:'#f8fafc', borderRadius:20, fontSize:13, fontWeight:600, color:'#475569' }}>
            <span style={{ fontSize:20 }}>🎓</span>
            <span>{entretien.context || 'Entretien de bourse'}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#475569' }}>
            <span>📅</span><span>{formatDate(entretien.createdAt)}</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
          <div className="ep-detail-score-circle" style={{ background: scoreColor.bg, border: `2px solid ${scoreColor.color}` }}>
            <span className="ep-detail-score-val">{parsed.score !== null ? parsed.score : '?'}</span>
            <span className="ep-detail-score-max">/100</span>
          </div>
          <div>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:4, color: scoreColor.color }}>{scoreColor.icon} {scoreColor.grade}</div>
            {parsed.verdict && <div style={{ fontSize:14, color:'#475569' }}>{parsed.verdict}</div>}
          </div>
        </div>
      </div>

      <div className="ep-detail-tabs">
        {[
          { id:'summary',   label:'📊 Résumé' },
          { id:'strengths', label:'✅ Analyse' },
          { id:'advice',    label:'💡 Conseils' },
          { id:'details',   label:'📝 Détails' },
        ].map(t => (
          <button key={t.id} className={`ep-detail-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', minHeight:300 }}>
        {activeTab === 'summary' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { icon:'⏱️', label:'Durée totale', val: parsed.questionMetrics.length > 0 ? `${Math.floor(parsed.questionMetrics.length * 1.5)}:00` : '—' },
                { icon:'📝', label:'Questions',    val: parsed.questionMetrics.length || '8' },
                { icon:'🎯', label:'Score',        val: parsed.score !== null ? `${parsed.score}/100` : '—' },
              ].map(s => (
                <div key={s.label} style={{ background:'#ffffff', borderRadius:14, padding:14, textAlign:'center', border:'1px solid rgba(15,23,42,0.04)' }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
                  <div style={{ fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'#0f172a' }}>{s.val}</div>
                </div>
              ))}
            </div>
            {parsed.pointsForts.length > 0 && (
              <div style={{ background:'#ffffff', borderRadius:14, padding:16, border:'1px solid rgba(15,23,42,0.04)' }}>
                <div className="ep-detail-section-title">✅ Points forts identifiés</div>
                <ul style={{ margin:0, paddingLeft:0, listStyle:'none' }}>
                  {parsed.pointsForts.slice(0,3).map((p,i) => (
                    <li key={i} style={{ fontSize:13, color:'#334155', lineHeight:1.6, marginBottom:10, display:'flex', alignItems:'flex-start' }}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {parsed.pointsAmeliorer.length > 0 && (
              <div style={{ background:'#ffffff', borderRadius:14, padding:16, border:'1px solid rgba(15,23,42,0.04)' }}>
                <div className="ep-detail-section-title">📈 Axes d'amélioration</div>
                <ul style={{ margin:0, paddingLeft:0, listStyle:'none' }}>
                  {parsed.pointsAmeliorer.slice(0,3).map((p,i) => (
                    <li key={i} style={{ fontSize:13, color:'#334155', lineHeight:1.6, marginBottom:10, display:'flex', alignItems:'flex-start' }}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'strengths' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            {parsed.pointsForts.length > 0 && (
              <div style={{ background:'#ffffff', borderRadius:14, padding:16, border:'1px solid rgba(15,23,42,0.04)' }}>
                <div className="ep-detail-section-title" style={{ color:'#34d399' }}>✅ POINTS FORTS</div>
                <ul style={{ margin:0, paddingLeft:0, listStyle:'none' }}>
                  {parsed.pointsForts.map((p,i) => (
                    <li key={i} style={{ fontSize:13, color:'#334155', lineHeight:1.6, marginBottom:10, display:'flex', alignItems:'flex-start' }}>
                      <span style={{ color:'#34d399', marginRight:8 }}>✓</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {parsed.pointsAmeliorer.length > 0 && (
              <div style={{ background:'#ffffff', borderRadius:14, padding:16, border:'1px solid rgba(15,23,42,0.04)' }}>
                <div className="ep-detail-section-title" style={{ color:'#fbbf24' }}>⚠️ POINTS À AMÉLIORER</div>
                <ul style={{ margin:0, paddingLeft:0, listStyle:'none' }}>
                  {parsed.pointsAmeliorer.map((p,i) => (
                    <li key={i} style={{ fontSize:13, color:'#334155', lineHeight:1.6, marginBottom:10, display:'flex', alignItems:'flex-start' }}>
                      <span style={{ color:'#fbbf24', marginRight:8 }}>!</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'advice' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            {parsed.conseils.length > 0 ? (
              <div style={{ background:'#ffffff', borderRadius:14, padding:16, border:'1px solid rgba(15,23,42,0.04)' }}>
                <div className="ep-detail-section-title" style={{ color:'#a78bfa' }}>💡 CONSEILS PERSONNALISÉS</div>
                <ul style={{ margin:0, paddingLeft:0, listStyle:'none' }}>
                  {parsed.conseils.map((c,i) => (
                    <li key={i} style={{ fontSize:13, color:'#334155', lineHeight:1.6, marginBottom:10, display:'flex', alignItems:'flex-start', padding:'12px 0', borderBottom:'1px solid rgba(15,23,42,0.04)' }}>
                      <span style={{ fontSize:18, marginRight:12 }}>🎯</span><span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'40px 20px', color:'#475569' }}>
                <span style={{ fontSize:48 }}>📝</span>
                <p>Des conseils personnalisés apparaîtront ici après votre entretien</p>
              </div>
            )}
            <div style={{ background:'#f8fafc', borderRadius:16, padding:20, border:'1px solid rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize:14, fontStyle:'italic', color:'#0f172a', lineHeight:1.5, marginBottom:12 }}>
                "La préparation est la clé du succès. Chaque entretien est une opportunité d'apprendre et de progresser."
              </div>
              <div style={{ fontSize:11, color:'#475569', textAlign:'right' }}>— Jury IA</div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div style={{ background:'#ffffff', borderRadius:14, padding:16, border:'1px solid rgba(15,23,42,0.04)' }}>
            <div className="ep-detail-section-title">📄 Rapport complet</div>
            <div style={{ fontSize:13, lineHeight:1.7, color:'#334155', whiteSpace:'pre-wrap', maxHeight:400, overflowY:'auto' }}>
              {parsed.rawText.split('\n').map((line, i) => {
                if (line.match(/SCORE|VERDICT|POINTS FORTS|POINTS À AMÉLIORER|CONSEILS/i))
                  return <div key={i} style={{ fontWeight:700, color:'#1a3a6b', marginTop:12, marginBottom:6, fontSize:12, letterSpacing:1 }}>{line}</div>;
                if (line.trim() && line.match(/^[-•*]/))
                  return <div key={i} style={{ paddingLeft:20, marginBottom:6, color:'#475569' }}>{line}</div>;
                if (line.trim()) return <div key={i} style={{ marginBottom:4, color:'#475569' }}>{line}</div>;
                return <div key={i} style={{ height:8 }} />;
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:12, paddingTop:16, borderTop:'1px solid rgba(15,23,42,0.04)', marginTop:8 }}>
        <button className="ep-detail-action-btn" onClick={() => window.print()}>🖨️ Imprimer</button>
        <button className="ep-detail-action-btn" onClick={() => { navigator.clipboard.writeText(parsed.rawText); alert('Rapport copié'); }}>📋 Copier</button>
      </div>
    </div>
  );
}

// ── HistoriquePanel ───────────────────────────────────────────────────────────
function HistoriquePanel({ userId, onClose }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    axiosInstance.get('/api/entretiens', {
      params: { 'where[user][equals]': userId, sort: '-createdAt', limit: 20 },
    }).then(res => { setRecords(res.data.docs || []); setLoading(false); }).catch(() => setLoading(false));
  }, [userId]);

  const parseEntretien = (text) => {
    if (!text) return { score: null, verdict: '', pointsForts: [], pointsAmeliorer: [], conseils: [], questionMetrics: [], rawText: '' };
    const scoreMatch   = text.match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i);
    const score        = scoreMatch ? parseInt(scoreMatch[1]) : null;
    const verdictMatch = text.match(/VERDICT\s*[:\-]\s*(.+?)(?=\n|$)/i);
    const verdict      = verdictMatch ? verdictMatch[1].trim() : '';
    const extractSection = (title) => {
      const regex = new RegExp(`${title}\\s*[:\\-]\\s*([\\s\\S]+?)(?=\\n\\s*[-•*]?\\s*(?:POINTS FORTS|POINTS À AMÉLIORER|CONSEILS|VERDICT|SCORE|$))`, 'i');
      const match = text.match(regex);
      if (match) return match[1].trim().split(/\n/).filter(l => l.trim()).map(l => l.replace(/^[-•*]\s*/, '').trim());
      return [];
    };
    const questionMetrics = [];
    const qRegex = /Question\s*(\d+)[:\s]*([^\n]+).*?mots[:\s]*(\d+).*?m\/min[:\s]*(\d+)/gi;
    let match;
    while ((match = qRegex.exec(text)) !== null)
      questionMetrics.push({ num: parseInt(match[1]), answer: match[2].trim(), words: parseInt(match[3])||0, wpm: parseInt(match[4])||0 });
    return { score, verdict, pointsForts: extractSection('POINTS FORTS'), pointsAmeliorer: extractSection('POINTS À AMÉLIORER'), conseils: extractSection('CONSEILS PERSONNALISÉS'), questionMetrics, rawText: text };
  };

  const getScoreColor = (score) => {
    if (score === null) return { bg:'rgba(100,116,139,.15)', color:'#94a3b8', border:'rgba(100,116,139,.3)', grade:'Non évalué', icon:'📊' };
    if (score >= 85) return { bg:'rgba(16,185,129,.2)',  color:'#34d399', border:'rgba(16,185,129,.4)',  grade:'Excellent',   icon:'🏆' };
    if (score >= 70) return { bg:'rgba(16,185,129,.15)', color:'#34d399', border:'rgba(16,185,129,.35)', grade:'Très bien',   icon:'🌟' };
    if (score >= 55) return { bg:'rgba(245,158,11,.15)', color:'#fbbf24', border:'rgba(245,158,11,.35)', grade:'Bien',        icon:'👍' };
    if (score >= 40) return { bg:'rgba(245,158,11,.12)', color:'#fbbf24', border:'rgba(245,158,11,.3)',  grade:'À améliorer', icon:'📈' };
    return { bg:'rgba(239,68,68,.15)', color:'#f87171', border:'rgba(239,68,68,.35)', grade:'À renforcer', icon:'⚠️' };
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr); const now = new Date();
    const diffDays = Math.floor((now - d) / (1000*60*60*24));
    if (diffDays === 0) return `Aujourd'hui, ${d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}`;
    if (diffDays === 1) return `Hier, ${d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}`;
    if (diffDays < 7)  return `Il y a ${diffDays} jours`;
    return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
  };

  return (
    <div className="ep-hist-overlay">
      <div className="ep-hist-drawer">
        <div className="ep-hist-head">
          <div>
            <div className="ep-hist-title">📋 Historique des entretiens</div>
            <div className="ep-hist-sub">
              {!userId ? 'Connectez-vous pour accéder à vos rapports'
                : `${records.length} entretien${records.length > 1 ? 's' : ''} · Dernier: ${records[0] ? formatDate(records[0].createdAt) : '—'}`}
            </div>
          </div>
          <button className="ep-hist-close" onClick={onClose}>✕</button>
        </div>

        {!userId && (
          <div className="ep-hist-center">
            <div style={{ fontSize:64, marginBottom:16 }}>🔐</div>
            <p style={{ color:'#94a3b8', textAlign:'center', maxWidth:280 }}>Connectez-vous pour voir vos entretiens passés</p>
          </div>
        )}

        {userId && loading && (
          <div className="ep-hist-center">
            <div className="ep-hist-spinner" />
            <p style={{ color:'#64748b', marginTop:12 }}>Chargement...</p>
          </div>
        )}

        {userId && !loading && records.length === 0 && (
          <div className="ep-hist-center">
            <div style={{ fontSize:72, marginBottom:16 }}>📭</div>
            <p style={{ color:'#94a3b8', fontSize:16 }}>Aucun entretien enregistré</p>
          </div>
        )}

        {userId && !loading && records.length > 0 && !selected && (
          <div className="ep-hist-list">
            {records.map(r => {
              const parsed = parseEntretien(r.score);
              const sc = getScoreColor(parsed.score);
              return (
                <button key={r.id} className="ep-hist-card" onClick={() => setSelected(r)}>
                  <div className="ep-hist-score-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                    {parsed.score !== null ? `${parsed.score}/100` : '—'}
                  </div>
                  <div className="ep-hist-card-mid">
                    <div className="ep-hist-card-date">{formatDate(r.createdAt)}</div>
                    <div className="ep-hist-card-title">{r.context || 'Entretien bourse'}</div>
                    <div className="ep-hist-card-verdict">
                      <span style={{ color: sc.color }}>{sc.icon} {sc.grade}</span>
                      {parsed.verdict && <span style={{ marginLeft:8, color:'#64748b' }}>· {parsed.verdict.slice(0,40)}</span>}
                    </div>
                  </div>
                  <div className="ep-hist-arrow">→</div>
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
      <div className="ep-hist-backdrop" onClick={onClose} />
    </div>
  );
}

// ── BoursePicker ──────────────────────────────────────────────────────────────
function BoursePicker({ bourses, userId, onSelect }) {
  const [showHist, setShowHist] = useState(false);
  const [query, setQuery] = useState('');
  const q = (query || '').trim().toLowerCase();
  const filtered = q.length === 0 ? bourses : bourses.filter(b =>
    (b.nom||'').toLowerCase().includes(q) ||
    (b.pays||'').toLowerCase().includes(q) ||
    (b.niveau||'').toLowerCase().includes(q) ||
    String(b.financement||'').toLowerCase().includes(q)
  );

  return (
    <div className="ep-picker-root">
      <div className="ep-picker-inner">
        <div className="ep-picker-topbar">
          <div className="ep-picker-badge">ENTRETIEN VIRTUEL IA</div>
          <div className="ep-picker-actions">
            <input placeholder="Rechercher une bourse, pays, niveau..." value={query}
              onChange={e => setQuery(e.target.value)} className="ep-picker-search" />
            <button className="ep-picker-hist-btn" onClick={() => setShowHist(true)}>📋 Mes entretiens</button>
          </div>
        </div>

        <h1 className="ep-picker-title">
          Préparez votre<br /><em>entretien de bourse</em>
        </h1>
        <p className="ep-picker-sub">
          Le jury IA vous posera <strong style={{ color:'#166534' }}>{TOTAL_Q} questions</strong> adaptées à la bourse, avec analyse vocale en temps réel.
        </p>

        <div className="ep-picker-grid">
          {filtered.length === 0 && (
            <div className="ep-picker-empty">
              <span style={{ fontSize:36 }}>🔎</span>
              <p>Aucune bourse trouvée.</p>
            </div>
          )}
          {filtered.map(b => (
            <div key={b.id} className="ep-bourse-card">
              <div className="ep-bourse-card-top">
                <span style={{ fontSize:24 }}>🎓</span>
                <span className="ep-bourse-finance">{b.financement}</span>
              </div>
              <div className="ep-bourse-name">{b.nom}</div>
              <div className="ep-bourse-meta">{b.pays} · {b.niveau}</div>
              <button className="ep-bourse-btn" onClick={() => onSelect(b)}>🚀 Démarrer l'entretien</button>
            </div>
          ))}
        </div>
      </div>
      {showHist && <HistoriquePanel userId={userId} onClose={() => setShowHist(false)} />}
    </div>
  );
}

// ── EntretienSession ──────────────────────────────────────────────────────────
function EntretienSession({ bourse, user, conversationId, onFinish }) {
  const [phase, setPhase] = useState('intro');
  const [qIndex, setQIndex] = useState(0);
  const [currentQ, setCurrentQ] = useState('');
  const [liveText, setLiveText] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [allAnswers, setAllAnswers] = useState([]);
  const [finalScore, setFinalScore] = useState(null);
  const [camError, setCamError] = useState(false);
  const [liveVolume, setLiveVolume] = useState(0);
  const [liveStability, setLiveStability] = useState(100);
  const [liveSpeakRatio, setLiveSpeakRatio] = useState(0);
  const [livePauses, setLivePauses] = useState(0);
  const [liveHesit, setLiveHesit] = useState(0);
  const [liveWordCount, setLiveWordCount] = useState(0);
  const [showHist, setShowHist] = useState(false);

  const videoRef = useRef(null); const streamRef = useRef(null);
  const recRef = useRef(null);   const timerRef = useRef(null);
  const metricsRef = useRef(null); const srRef = useRef(null);
  const analyzerRef = useRef(null); const aiLockRef = useRef(false);
  const savedRef = useRef(false);

  const liveTextRef = useRef(''); const elapsedRef = useRef(0);
  const answersRef = useRef([]);  const qIndexRef = useRef(0);
  const capturedRef = useRef(''); const phaseRef = useRef('intro');
  const historyRef = useRef([]);

  useEffect(() => { liveTextRef.current = liveText; }, [liveText]);
  useEffect(() => { elapsedRef.current  = elapsed;  }, [elapsed]);
  useEffect(() => { qIndexRef.current   = qIndex;   }, [qIndex]);
  useEffect(() => { phaseRef.current    = phase;    }, [phase]);
  useEffect(() => { initCamera(); return cleanup; }, []);

  const initCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
    } catch(e) { setCamError(true); }
  };

  const cleanup = () => {
    clearInterval(timerRef.current); clearInterval(metricsRef.current);
    if (recRef.current?.state === 'recording') { try { recRef.current.stop(); } catch {} }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => { try { t.stop(); } catch {} }); streamRef.current = null; }
    try { if (srRef.current) { srRef.current.onend = null; srRef.current.stop(); } } catch {}
    if (analyzerRef.current) { analyzerRef.current.destroy(); analyzerRef.current = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const callAI = useCallback(async (payload, ctx) => {
    if (aiLockRef.current) return { output: null };
    aiLockRef.current = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const res = await axios.post(WEBHOOK_ROUTES.entretien, {
        text: typeof payload === 'string' ? payload : payload.lastAnswer || '',
        context: ctx, conversationId,
        id: user?.id || null, email: user?.email || null,
        bourse: { id:bourse.id, nom:bourse.nom, pays:bourse.pays, niveau:bourse.niveau, financement:bourse.financement },
        bourse_context: `${bourse.nom} | ${bourse.pays} | ${bourse.niveau} | ${bourse.financement||'100%'}`,
        entretien_history: historyRef.current,
        question_index: typeof payload === 'object' ? (payload.questionIndex ?? 0) : 0,
        total_questions: TOTAL_Q,
        voiceStats: typeof payload === 'object' && payload.voiceStats ? payload.voiceStats : null,
      }, { signal: controller.signal });
      clearTimeout(timeout); aiLockRef.current = false;
      return res.data;
    } catch(err) { clearTimeout(timeout); aiLockRef.current = false; return { output: null }; }
  }, [bourse, user, conversationId]);

  const cleanQ = out => {
    if (!out || typeof out !== 'string' || out.trim().length < 10) return null;
    return out.trim().replace(/^(question\s*\d+\s*[:\-–]?\s*|Q\d+\s*[:\-–]?\s*)/i, '').trim();
  };

  const startInterview = async () => {
    setPhase('ai_speaking'); setAiLoading(true);
    savedRef.current = false; aiLockRef.current = false; historyRef.current = [];
    const data = await callAI({ lastAnswer:'', questionIndex:0 }, 'start_entretien');
    const q = cleanQ(data?.output) || `Présentez-vous et expliquez votre motivation pour la bourse ${bourse.nom}.`;
    historyRef.current = [{ role:'assistant', content:q }];
    setCurrentQ(q); setQIndex(0); qIndexRef.current = 0;
    setAiLoading(false); await tts(q); setPhase('waiting');
  };

  const startRecording = () => {
    if (!streamRef.current || recRef.current?.state === 'recording') return;
    setLiveText(''); liveTextRef.current = ''; capturedRef.current = '';
    const recordingStart = Date.now(); 
    setElapsed(0); elapsedRef.current = 0; setLiveWordCount(0); setPhase('recording');
    if (analyzerRef.current) analyzerRef.current.destroy();
    analyzerRef.current = new VoiceAnalyzer(streamRef.current);
    analyzerRef.current.start();
    const mr = new MediaRecorder(streamRef.current);
    mr.ondataavailable = () => {}; mr.start(200); recRef.current = mr;
    timerRef.current = setInterval(() => {
      setElapsed(prev => { const n = prev + 1; elapsedRef.current = n; if (n >= 120) stopRecording(); return n; });
    }, 500);
    metricsRef.current = setInterval(() => {
      if (!analyzerRef.current) return;
      const s = analyzerRef.current.getStats();
      setLiveVolume(s.volume); setLiveStability(s.stability);
      setLiveSpeakRatio(s.speakRatio); setLivePauses(s.pauseCount);
      setLiveHesit(s.hesitations);
      setLiveWordCount(liveTextRef.current.split(/\s+/).filter(w=>w.length>1).length);
    }, 800);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const sr = new SR(); sr.lang='fr-FR'; sr.continuous=true; sr.interimResults=true;
      sr.onresult = e => { let t=''; for(let i=0;i<e.results.length;i++) t+=e.results[i][0].transcript+' '; setLiveText(t.trim()); liveTextRef.current=t.trim(); };
      sr.onerror = () => { try { sr.stop(); } catch {} };
      sr.onend   = () => { if(phaseRef.current==='recording') { try { sr.start(); } catch {} } };
      try { sr.start(); } catch {} srRef.current = sr;
    }
  };

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current); clearInterval(metricsRef.current);
    capturedRef.current = liveTextRef.current;
    if (recRef.current?.state==='recording') { try { recRef.current.stop(); } catch {} }
    try { if (srRef.current) { srRef.current.onend=null; srRef.current.stop(); } } catch {}
    if (analyzerRef.current) analyzerRef.current.stop();
    setPhase('analyzing');
  }, []);

  useEffect(() => {
    if (phase !== 'analyzing') return;
    const go = async () => {
      const curIdx = qIndexRef.current; const isLast = curIdx >= TOTAL_Q - 1;
      const answer = capturedRef.current.trim() || '(aucune réponse détectée)';
      const dur = elapsedRef.current;
      const voice = analyzerRef.current ? analyzerRef.current.getStats() : null;
      if (analyzerRef.current) { analyzerRef.current.destroy(); analyzerRef.current = null; }
      const wordCount = answer.split(/\s+/).filter(w=>w.length>1).length;
      const speakingSec = voice ? (voice.speakRatio * dur / 100) : dur;
      const wpm = speakingSec > 3 ? Math.round((wordCount / speakingSec) * 60) : 0;
      historyRef.current.push({ role:'user', content:answer, duration:dur, wordCount, wpm, voice });
      const entry = { q:currentQ, a:answer, duration:dur, wordCount, wpm, voice };
      answersRef.current = [...answersRef.current, entry];
      setAllAnswers([...answersRef.current]);

      if (isLast) {
        const voiceStats = {
          totalAnswered: answersRef.current.filter(a=>a.a&&a.a!=='(aucune réponse détectée)'&&a.a.length>5).length,
          avgWpm: Math.round(answersRef.current.filter(a=>a.wpm>0&&a.wpm<300).reduce((s,a)=>s+a.wpm,0)/Math.max(answersRef.current.filter(a=>a.wpm>0&&a.wpm<300).length,1)),
          avgWords: Math.round(answersRef.current.reduce((s,a)=>s+(a.wordCount||0),0)/Math.max(answersRef.current.length,1)),
          totalPauses: answersRef.current.reduce((s,a)=>s+(a.voice?.pauseCount||0),0),
          totalHesitations: answersRef.current.reduce((s,a)=>s+(a.voice?.hesitations||0),0),
          avgStability: Math.round(answersRef.current.reduce((s,a)=>s+(a.voice?.stability||0),0)/Math.max(answersRef.current.length,1)),
          scoresParQuestion: answersRef.current.map((a,i)=>({q:i+1,words:a.wordCount||0,wpm:a.wpm||0,answer:(a.a||'').slice(0,500)})),
        };
        const data = await callAI({ lastAnswer:answer, questionIndex:curIdx, voiceStats }, 'fin_entretien');
        const scoreText = data?.output || data?.message || data?.text || 'Erreur — vérifiez la connexion n8n';
        setFinalScore(scoreText); setPhase('result');
        if (!savedRef.current) { savedRef.current = true; await saveEntretien(user?.id, scoreText, conversationId, bourse.nom); }
        await tts('Entretien terminé. Voici votre évaluation complète.');
      } else {
        const nextIdx = curIdx + 1;
        const data = await callAI({ lastAnswer:answer, questionIndex:nextIdx }, 'entretien');
        const nextQ = cleanQ(data?.output || data?.message || data?.text);
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
          const fb = fallbacks.find(q=>!used.has(q.toLowerCase().slice(0,30))) || fallbacks[nextIdx % fallbacks.length];
          historyRef.current.push({ role:'assistant', content:fb });
          setQIndex(nextIdx); qIndexRef.current=nextIdx; setCurrentQ(fb);
          setLiveText(''); liveTextRef.current=''; setElapsed(0); elapsedRef.current=0;
          setPhase('ai_speaking'); await tts(fb); setPhase('waiting'); return;
        }
        historyRef.current.push({ role:'assistant', content:nextQ });
        setQIndex(nextIdx); qIndexRef.current=nextIdx; setCurrentQ(nextQ);
        setLiveText(''); liveTextRef.current=''; setElapsed(0); elapsedRef.current=0;
        setPhase('ai_speaking'); await tts(nextQ); setPhase('waiting');
      }
    };
    go();
  }, [phase]);

  const parseScore = txt => {
    if (!txt) return {};
    const get = key => { const m = txt.match(new RegExp(`${key}\\s*[:\\-]\\s*([\\s\\S]+?)(?=\\n\\s*[-•*]?\\s*(?:SCORE|VERDICT|POINTS|CONSEILS|COMMENTAIRE)|$)`,'i')); return m ? m[1].trim() : null; };
    return {
      score:    txt.match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i)?.[1],
      verdict:  txt.match(/VERDICT\s*[:\-]\s*(.+)/i)?.[1]?.trim(),
      forts:    get('POINTS FORTS'),
      fix:      get('POINTS À AMÉLIORER'),
      conseils: get('CONSEILS PERSONNALISÉS'),
    };
  };

  const parsed = parseScore(finalScore);
  const totalDur = allAnswers.reduce((a,b)=>a+b.duration,0);
  const avgWords = allAnswers.length ? Math.round(allAnswers.reduce((a,b)=>a+(b.wordCount||0),0)/allAnswers.length) : 0;
  const validWpm = allAnswers.filter(a=>a.wpm>0&&a.wpm<300);
  const avgWpm = validWpm.length ? Math.round(validWpm.reduce((a,b)=>a+b.wpm,0)/validWpm.length) : 0;

  const metrics = [
    { label:'Volume micro',   v:liveVolume,     icon:'🎙' },
    { label:'Stabilité voix', v:liveStability,  icon:'📊' },
    { label:'Ratio parole',   v:liveSpeakRatio, icon:'⏱' },
  ];

  const counters = [
    { icon:'⏸', val:livePauses,    label:'pauses',   warn:livePauses>5 },
    { icon:'💬', val:liveHesit,     label:'s hésit.', warn:liveHesit>8 },
    { icon:'📝', val:liveWordCount, label:'mots',     warn:false },
  ];

  return (
    <div className="ep-session-root">

      {/* Topbar */}
      <div className="ep-topbar">
        <div className="ep-topbar-left">
          <div className={`ep-status-dot ${phase==='recording' ? 'recording' : 'idle'}`} />
          <span className="ep-bourse-nom">{bourse.nom}</span>
          <span className="ep-sep">·</span>
          <span className="ep-bourse-meta-top">{bourse.pays} · {bourse.niveau}</span>
        </div>
        <div className="ep-progress">
          {[...Array(TOTAL_Q)].map((_,i) => (
            <div key={i} className={`ep-progress-dot ${i < qIndex ? 'done' : i === qIndex ? 'current' : 'future'}`} />
          ))}
          {phase !== 'intro' && phase !== 'result' && <span className="ep-progress-label">Q{qIndex+1}/{TOTAL_Q}</span>}
        </div>
        <div className="ep-topbar-actions">
          <button className="ep-hist-btn" onClick={() => setShowHist(true)}>📋 Historique</button>
          <button className="ep-quit-btn" onClick={() => { cleanup(); onFinish(); }}>✕ Quitter</button>
        </div>
      </div>

      {/* Body */}
      <div className="ep-body">

        {/* Colonne gauche — vidéo + métriques */}
        <div className="ep-left">
          <div className="ep-video-box">
            {camError
              ? <div className="ep-no-cam"><span style={{ fontSize:40 }}>📷</span><p>Caméra indisponible</p><small>L'entretien continue</small></div>
              : <video ref={videoRef} autoPlay muted playsInline className="ep-video" />
            }
            {phase === 'recording' && (
              <div className="ep-rec-badge"><div className="ep-rec-dot" />REC &nbsp; {fmt(elapsed)}</div>
            )}
            {phase === 'ai_speaking' && (
              <div className="ep-ai-overlay">
                <div className="ep-wave-row">
                  {[...Array(5)].map((_,i) => <div key={i} className="ep-wave-bar" style={{ animationDelay:`${i*0.12}s` }} />)}
                </div>
                Jury IA parle…
              </div>
            )}
            <div className="ep-meter-bg">
              <div className="ep-meter-fill" style={{ width:`${liveVolume}%` }} />
            </div>
          </div>

          {phase !== 'intro' && phase !== 'result' && (
            <div className="ep-metrics-box">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <div className="ep-metrics-head">ANALYSE VOCALE EN DIRECT</div>
                {phase === 'recording' && <div style={{ fontSize:10, color:'#475569' }}>{liveWordCount} mots</div>}
              </div>
              {metrics.map(m => (
                <div key={m.label} className="ep-metric-row">
                  <span className="ep-metric-icon">{m.icon}</span>
                  <div className="ep-metric-bar-bg">
                    <div className="ep-metric-bar-fill" style={{
                      width: `${m.v}%`,
                      background: m.v > 75 ? 'linear-gradient(90deg,#059669,#34d399)' : m.v > 45 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)',
                    }} />
                  </div>
                  <span className="ep-metric-pct">{m.v}%</span>
                  <span className="ep-metric-label">{m.label}</span>
                </div>
              ))}
              <div className="ep-counter-grid">
                {counters.map(c => (
                  <div key={c.label} className={`ep-counter-item ${c.warn ? 'warn' : 'normal'}`}>
                    <div className={`ep-counter-val ${c.warn ? 'warn' : 'normal'}`}>{c.val}</div>
                    <div className="ep-counter-lbl">{c.icon} {c.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite — panel */}
        <div className="ep-right">

          {/* Intro */}
          {phase === 'intro' && (
            <div style={{ width:'100%', maxWidth:500, display:'flex', flexDirection:'column', height:'100%' }}>
              <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:14, paddingBottom:8 }}>
                <div style={{ textAlign:'center', fontSize:48 }}>🧑‍⚖️</div>
                <h2 className="ep-panel-title" style={{ fontSize:'1.45rem' }}>Prêt pour votre entretien ?</h2>
                <p className="ep-panel-subtitle">Le jury IA va vous poser <strong style={{ color:'#e879f9' }}>{TOTAL_Q} questions</strong> sur <strong style={{ color:'#c4b5fd' }}>{bourse.nom}</strong>.</p>
                <div style={{ padding:'14px 16px', borderRadius:12, background:'rgba(139,92,246,.06)', border:'1px solid rgba(139,92,246,.2)' }}>
                  <div style={{ fontSize:11, color:'#818cf8', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Analyse en temps réel</div>
                  {[['📊','Contenu & richesse vocabulaire'],['⏱','Vitesse de parole (mots/min)'],['⏸','Pauses et hésitations'],['🎙','Volume et stabilité vocale'],['🧠','Questions et score générés par IA n8n']].map(([ic,tx]) => (
                    <div key={tx} style={{ display:'flex', alignItems:'center', gap:10, fontSize:12, color:'#94a3b8', marginBottom:6 }}><span>{ic}</span><span>{tx}</span></div>
                  ))}
                </div>
                {[['🎤','Parlez clairement — le micro transcrit en direct'],['👁️','Gardez le contact visuel'],['⏱️','Max 2 min par réponse'],['🔊','Activez le son pour entendre les questions']].map(([ic,tx]) => (
                  <div key={tx} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 14px', borderRadius:10, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', fontSize:13, color:'#cbd5e1' }}><span>{ic}</span><span>{tx}</span></div>
                ))}
              </div>
              <div style={{ flexShrink:0, paddingTop:12 }}>
                <button className="ep-btn-start" onClick={startInterview}>🚀 &nbsp; Démarrer l'entretien</button>
              </div>
            </div>
          )}

          {/* En cours */}
          {['ai_speaking','waiting','recording','analyzing'].includes(phase) && (
            <div className="ep-panel">
              <div className="ep-q-head">
                <div className="ep-q-badge">Question {qIndex+1} / {TOTAL_Q}</div>
                {phase === 'recording' && <div className="ep-timer-badge">{fmt(elapsed)}</div>}
              </div>
              <div className="ep-q-bubble">
                {aiLoading
                  ? <div className="ep-loading-dots">{[0,.15,.3].map(d => <div key={d} className="ep-dot" style={{ animationDelay:`${d}s` }} />)}</div>
                  : <p style={{ margin:0, lineHeight:1.7 }}>{currentQ}</p>
                }
              </div>

              {phase === 'recording' && liveText && (
                <div className="ep-live-box">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div className="ep-live-head">📝 TRANSCRIPTION EN DIRECT</div>
                    <div style={{ fontSize:10, color:'#64748b' }}>{liveWordCount} mots {liveWordCount>=40?'✓':liveWordCount>0?`(+${40-liveWordCount})`:''}</div>
                  </div>
                  <p className="ep-live-text">{liveText}</p>
                  <div className="ep-live-progress-bg">
                    <div className="ep-live-progress-fill" style={{
                      width: `${Math.min(100,(liveWordCount/80)*100)}%`,
                      background: liveWordCount >= 40 ? 'linear-gradient(90deg,#059669,#34d399)' : 'linear-gradient(90deg,#d97706,#fbbf24)',
                    }} />
                  </div>
                </div>
              )}

              {phase === 'analyzing' && (
                <div className="ep-analyze-box">
                  <div className="ep-analyze-spinner" />
                  <div>
                    <div style={{ color:'#e2e8f0', fontWeight:600, marginBottom:10 }}>L'IA analyse votre réponse…</div>
                    {['Analyse du contenu','Pertinence à la bourse','Génération de la prochaine question','Score en cours…'].map((s,i) => (
                      <div key={s} className="ep-analyze-item" style={{ animationDelay:`${i*.3}s` }}>
                        <div className="ep-analyze-dot" />
                        <span style={{ color:'#94a3b8', fontSize:13 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                {phase === 'waiting'   && <button className="ep-btn-rec"  onClick={startRecording}><span style={{ fontSize:20 }}>🎤</span> Répondre à la question</button>}
                {phase === 'recording' && <button className="ep-btn-stop" onClick={stopRecording}><span style={{ fontSize:20 }}>⏹</span> Terminer ma réponse</button>}
                {(phase === 'ai_speaking' || phase === 'analyzing') && (
                  <div className="ep-hint">{phase === 'ai_speaking' ? '🔊 Écoutez la question…' : '⏳ Analyse IA en cours…'}</div>
                )}
              </div>
            </div>
          )}

          {/* Résultats */}
          {phase === 'result' && (
            <div className="ep-panel" style={{ overflowY:'auto', gap:16, padding:'20px 24px' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:50, marginBottom:10 }}>🏆</div>
                <h2 className="ep-panel-title">Résultats de l'entretien</h2>
                <p style={{ color:'#64748b', fontSize:13 }}>{bourse.nom} · {bourse.pays}</p>
                {user?.id && <p style={{ color:'#10b981', fontSize:12, marginTop:4 }}>✅ Sauvegardé dans votre historique</p>}
              </div>

              <div className="ep-result-stats">
                {[
                  { v: parsed.score ? `${parsed.score}/100` : '—', l:'Score final' },
                  { v: fmt(totalDur),                               l:'Durée totale' },
                  { v: `${avgWpm} m/min`,                           l:'Vitesse moy.' },
                  { v: `${avgWords} mots`,                          l:'Mots / réponse' },
                ].map(s => (
                  <div key={s.l} className="ep-stat-card">
                    <div className="ep-stat-val">{s.v}</div>
                    <div className="ep-stat-lbl">{s.l}</div>
                  </div>
                ))}
              </div>

              {parsed.verdict && (
                <div style={{ padding:'12px 18px', borderRadius:12, background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.2)', textAlign:'center' }}>
                  <span style={{ fontSize:13, color:'#64748b', display:'block', marginBottom:4 }}>VERDICT</span>
                  <span style={{ fontSize:16, fontWeight:700, color:'#34d399' }}>{parsed.verdict}</span>
                </div>
              )}

              {parsed.forts && (
                <div className="ep-section-card">
                  <div className="ep-section-head" style={{ color:'#34d399' }}>✅ POINTS FORTS</div>
                  <div className="ep-section-body">{parsed.forts}</div>
                </div>
              )}
              {parsed.fix && (
                <div className="ep-section-card warning">
                  <div className="ep-section-head" style={{ color:'#fbbf24' }}>⚠️ POINTS À AMÉLIORER</div>
                  <div className="ep-section-body">{parsed.fix}</div>
                </div>
              )}
              {parsed.conseils && (
                <div className="ep-section-card purple">
                  <div className="ep-section-head" style={{ color:'#a78bfa' }}>💡 CONSEILS PERSONNALISÉS</div>
                  <div className="ep-section-body">{parsed.conseils}</div>
                </div>
              )}

              {!parsed.forts && finalScore && (
                <div style={{ padding:'18px 20px', borderRadius:14, background:'rgba(16,185,129,.04)', border:'1px solid rgba(16,185,129,.12)', maxHeight:300, overflowY:'auto' }}>
                  <div style={{ fontSize:10, letterSpacing:2, color:'#475569', fontWeight:700, marginBottom:10 }}>ÉVALUATION DU JURY IA</div>
                  <div style={{ color:'#475569', fontSize:14, lineHeight:1.75, whiteSpace:'pre-wrap' }}>{finalScore}</div>
                </div>
              )}

              <div>
                <div style={{ fontSize:10, letterSpacing:2, color:'#475569', fontWeight:700, marginBottom:10 }}>DÉROULEMENT — STATISTIQUES RÉELLES</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                  {allAnswers.map((a,i) => (
                    <div key={i} className="ep-answer-item">
                      <div className="ep-answer-num">{i+1}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, color:'#cbd5e1', marginBottom:3 }}>{a.q.slice(0,70)}{a.q.length>70?'…':''}</div>
                        <div style={{ fontSize:11, color:'#64748b' }}>⏱ {fmt(a.duration)} · 📝 {a.wordCount||0} mots · 🏃 {a.wpm||0} m/min{a.voice&&` · ⏸ ${a.voice.pauseCount||0} pauses · 💬 ${a.voice.hesitations||0}s`}</div>
                        {a.a&&a.a!=='(aucune réponse détectée)'&&<div style={{ fontSize:11, color:'#475569', marginTop:4, fontStyle:'italic' }}>"{a.a.slice(0,80)}{a.a.length>80?'…':''}"</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:12 }}>
                <button className="ep-btn-retry" onClick={() => {
                  answersRef.current=[]; setAllAnswers([]); setFinalScore(null);
                  setQIndex(0); qIndexRef.current=0; setCurrentQ('');
                  savedRef.current=false; aiLockRef.current=false;
                  historyRef.current=[]; setPhase('intro');
                }}>🔄 Recommencer</button>
                <button className="ep-btn-done" onClick={() => { cleanup(); onFinish(); }}>✅ Terminer</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showHist && <HistoriquePanel userId={user?.id} onClose={() => setShowHist(false)} />}
    </div>
  );
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────────────────────
export default function EntretienPage({ user, bourses=[], conversationId, setView, handleQuickReply }) {
  const [showLogin, setShowLogin] = useState(false);
  const [selected, setSelected]  = useState(null);

  if (!user) return (
    <>
      <div className="ep-locked">
        <div className="ep-locked-card">
          <div style={{ fontSize:56, marginBottom:16 }}>🧑‍⚖️</div>
          <h3>Entretien virtuel non disponible</h3>
          <p>Connectez-vous pour pratiquer vos entretiens de bourse avec notre jury IA et obtenir une évaluation personnalisée.</p>
          <button className="ep-lock-btn" onClick={() => setShowLogin(true)}>🔐 Se connecter</button>
        </div>
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );

  if (!selected) return <BoursePicker bourses={bourses} userId={user?.id} onSelect={setSelected} />;
  return <EntretienSession bourse={selected} user={user} conversationId={conversationId} onFinish={() => setSelected(null)} />;
}