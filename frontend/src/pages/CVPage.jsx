import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';

// ─── Chargeurs PDF ────────────────────────────────────────────────────────────

function loadJsPDF() {
  return new Promise(resolve => {
    if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => resolve(window.jspdf.jsPDF);
    document.head.appendChild(s);
  });
}

function loadPdfJs() {
  return new Promise(resolve => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    document.head.appendChild(s);
  });
}

async function extractPdfText(file) {
  const lib = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: buf }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    text += tc.items.map(it => it.str).join(' ') + '\n';
  }
  return text.trim();
}

// ─── Génération PDF CV ────────────────────────────────────────────────────────

async function generateCV(aiContent, user, bourse, filename) {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, mL = 18, mR = 18, mT = 22, mB = 18, uW = 174;
  let y = mT;
  const chk = (h) => { if (y + (h||6) > H - mB) { doc.addPage(); y = mT; } };
  const clean = (str) => (str || '')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}]/gu, '')
    .replace(/[📍📞✉🔗✅⚠️📅]/g, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^#{1,4}\s+/, '')
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/\u00A0/g, ' ')
    .trim();
  const isSection = (l) => { const t = clean(l); return /^#{1,4}\s/.test(l.trim()) || (t.length > 3 && t.length < 60 && t === t.toUpperCase() && /[A-Z]/.test(t)); };
  const isBold    = (l) => /^\*{1,3}[^*]+\*{1,3}\s*$/.test(l.trim());
  const isSep     = (l) => /^[-=*]{3,}$/.test(l.trim());
  const isBullet  = (l) => /^[\-*•]\s/.test(l.trim());
  const nom   = (user.name || '').trim().toUpperCase();
  const titre = [user.currentLevel || user.niveau || '', user.fieldOfStudy || user.domaine || ''].filter(Boolean).join(' - ');
  const ctc   = [user.email, user.phone, user.countryOfResidence || user.pays].filter(Boolean).join('   |   ');
  const lnk   = [user.linkedin, user.github, user.portfolio].filter(Boolean).join('   |   ');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(0,0,0);
  doc.text(nom, W/2, y, { align:'center' }); y += 7;
  doc.setDrawColor(26,58,107); doc.setLineWidth(0.7); doc.line(mL, y, W-mR, y); y += 4;
  if (titre) { doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(60,60,60); doc.text(titre, W/2, y, {align:'center'}); y += 4.5; }
  if (ctc)   { doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(80,80,80); doc.text(ctc,   W/2, y, {align:'center'}); y += 4; }
  if (lnk)   { doc.setFont('helvetica','normal'); doc.setFontSize(8);   doc.setTextColor(80,80,80); doc.text(lnk,   W/2, y, {align:'center'}); y += 4; }
  doc.setDrawColor(26,58,107); doc.setLineWidth(0.3); doc.line(mL, y, W-mR, y); y += 6;
  for (const raw of (aiContent || '').split('\n')) {
    const tr = raw.trim();
    if (!tr) { y += 2; continue; }
    if (isSep(tr)) { doc.setDrawColor(200,200,200); doc.setLineWidth(0.15); doc.line(mL, y, W-mR, y); y += 3; continue; }
    if (isSection(tr)) {
      const t = clean(tr).toUpperCase();
      y += 3; chk(13);
      doc.setFillColor(26,58,107); doc.rect(mL, y-4.5, uW, 9, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(255,255,255);
      doc.text(t, mL+3, y+1); y += 9;
      doc.setDrawColor(245,166,35); doc.setLineWidth(0.5); doc.line(mL, y-1, W-mR, y-1); y += 3;
      continue;
    }
    if (isBold(tr)) {
      const t = clean(tr); chk(7);
      doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(26,58,107);
      doc.text(t, mL, y); y += 5.5; continue;
    }
    if (isBullet(tr)) {
      const t = clean(tr.replace(/^[\-*•]\s+/,''));
      chk(6);
      doc.setFillColor(26,58,107); doc.circle(mL+1.8, y-1.6, 0.75, 'F');
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(40,40,40);
      doc.splitTextToSize(t, uW-7).forEach(l => { chk(); doc.text(l, mL+5, y); y += 4.8; });
      continue;
    }
    const t = clean(tr);
    if (!t) continue;
    chk(6);
    const isD = /\d{4}/.test(t) && t.length < 80 && /-/.test(t);
    doc.setFont('helvetica', isD ? 'bold' : 'normal'); doc.setFontSize(9.5);
    doc.setTextColor(isD ? 26 : 45, isD ? 58 : 45, isD ? 107 : 45);
    doc.splitTextToSize(t, uW).forEach(l => { chk(); doc.text(l, mL, y); y += 5; });
  }
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(245,166,35); doc.setLineWidth(0.5); doc.line(mL, H-11, W-mR, H-11);
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(140,140,140);
    if (bourse) doc.text(bourse, mL, H-6);
    doc.text('Page ' + p + ' / ' + total, W-mR, H-6, { align:'right' });
  }
  doc.save(filename + '.pdf');
}

// ─── Génération PDF Lettre de motivation ──────────────────────────────────────

async function generateLM(rawContent, filename, meta, bourse) {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const W=210, H=297, mL=25, mR=25, mT=30, mB=25, uW=160;
  let y = mT;
  const chk = (h) => { if (y+(h||6) > H-mB) { doc.addPage(); y=mT; } };
  const txt = (rawContent||'')
    .replace(/\*\*([^*]+)\*\*/g,'$1')
    .replace(/\*([^*]+)\*/g,'$1')
    .replace(/^#{1,4}\s+/gm,'')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
  doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(26,58,107);
  doc.text(((meta||{}).name||'').toUpperCase(), mL, y); y += 7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(80,80,80);
  const contact = [(meta||{}).email,(meta||{}).phone,(meta||{}).address].filter(Boolean).join('   ·   ');
  if (contact) { doc.text(contact, mL, y); y += 5; }
  doc.setDrawColor(26,58,107); doc.setLineWidth(0.5); doc.line(mL,y,W-mR,y);
  doc.setDrawColor(245,166,35); doc.setLineWidth(2); doc.line(mL,y+0.5,mL+40,y+0.5);
  y += 8;
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(60,60,60);
  doc.text(new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'}), W-mR, y, {align:'right'}); y += 12;
  for (const line of txt.split('\n')) {
    const tr = line.trim();
    if (!tr) { y += 5; continue; }
    chk(7);
    if (/^---+$/.test(tr)) { doc.setDrawColor(200,200,200); doc.setLineWidth(0.15); doc.line(mL,y,W-mR,y); y += 5; continue; }
    if (/^(objet|madame|monsieur)/i.test(tr)) {
      doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(26,58,107);
      doc.splitTextToSize(tr,uW).forEach(l=>{chk();doc.text(l,mL,y);y+=6.5;}); y+=3; continue;
    }
    if (/^(veuillez|je vous prie|dans l.attente|cordialement|sincèrement)/i.test(tr)) {
      doc.setFont('helvetica','italic'); doc.setFontSize(10.5); doc.setTextColor(40,40,40);
      doc.splitTextToSize(tr,uW).forEach(l=>{chk();doc.text(l,mL,y);y+=6;}); continue;
    }
    doc.setFont('helvetica','normal'); doc.setFontSize(10.5); doc.setTextColor(30,30,30);
    doc.splitTextToSize(tr,uW).forEach(l=>{chk();doc.text(l,mL,y);y+=6.2;});
  }
  const total = doc.getNumberOfPages();
  for (let i=1;i<=total;i++) {
    doc.setPage(i);
    doc.setDrawColor(245,166,35); doc.setLineWidth(0.5); doc.line(mL,H-12,W-mR,H-12);
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(150,150,150);
    if (bourse) doc.text('Candidature · ' + bourse, mL, H-7);
    doc.text('Page '+i+' / '+total, W-mR, H-7, {align:'right'});
  }
  doc.save(filename+'.pdf');
}

// ─── Vérification profil ──────────────────────────────────────────────────────

function checkProfile(user) {
  if (!user) return { ok:false, missing:['Connexion requise'] };
  const m = [];
  if (!user.name)                          m.push('Nom complet');
  if (!user.currentLevel && !user.niveau)  m.push("Niveau d'études");
  if (!user.fieldOfStudy && !user.domaine) m.push("Domaine d'études");
  if (!user.institution)                   m.push('Institution');
  if (!user.motivationSummary)             m.push('Résumé de motivation');
  if (!user.academicHistory?.length)       m.push('Historique académique');
  return { ok: m.length===0, missing: m };
}

// ─── Appel n8n ────────────────────────────────────────────────────────────────

// REMPLACE la fonction callN8N existante par celle-ci :
async function callN8N(context, payload) {
  // Tous les appels CV passent par le webhook principal (orchestrateur)
  // sauf CV_ANALYSIS qui a son propre endpoint
  let webhookUrl = WEBHOOK_ROUTES.chat;
  if (context === 'CV_ANALYSIS') webhookUrl = WEBHOOK_ROUTES.entretien;

  try {
    const response = await axiosInstance.post(webhookUrl, {
      ...payload,
      context,
      // ← bourse transmise explicitement pour que l'orchestrateur la passe à CVAgent1
      bourse_nom: payload.bourse_nom || payload.bourse?.nom || '',
      bourse_pays: payload.bourse_pays || payload.bourse?.pays || '',
    }, {
      timeout: 90000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data?.output || response.data?.text || response.data?.message || '';
  } catch (error) {
    console.error('Erreur callN8N:', error);
    return '';
  }
}
// ─── Composants utilitaires ───────────────────────────────────────────────────

function WordCount({ text, min = 500 }) {
  const count = (text || '').split(/\s+/).filter(Boolean).length;
  const color = count >= min ? '#166534' : count >= min * 0.6 ? '#d97706' : '#dc2626';
  return (
    <span style={{ fontSize:11, padding:'3px 10px', borderRadius:4, background: color+'18', color, fontWeight:600, border:`1px solid ${color}30` }}>
      {count} mots {count >= min ? '✓' : `(min. ${min})`}
    </span>
  );
}

function ScoreRing({ score }) {
  if (!score) return null;
  const r=36, c=2*Math.PI*r;
  const col = score>=80?'#1a3a6b':score>=60?'#d97706':'#dc2626';
  return (
    <div style={{position:'relative',width:88,height:88,flexShrink:0}}>
      <svg width="88" height="88" style={{transform:'rotate(-90deg)'}}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7"/>
        <circle cx="44" cy="44" r={r} fill="none" stroke={col} strokeWidth="7"
          strokeDasharray={c} strokeDashoffset={c-(score/100)*c}
          strokeLinecap="round" style={{transition:'stroke-dashoffset .8s ease'}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <span style={{fontSize:20,fontWeight:800,color:col,lineHeight:1}}>{score}</span>
        <span style={{fontSize:10,color:'#94a3b8'}}>/100</span>
      </div>
    </div>
  );
}

function CheckItem({ item }) {
  const cfg={ok:{c:'#166534',bg:'#f0fdf4',i:'✓'},warning:{c:'#d97706',bg:'#fffbeb',i:'!'},error:{c:'#dc2626',bg:'#fef2f2',i:'✕'}}[item.status]||{c:'#64748b',bg:'#f8fafc',i:'?'};
  return (
    <div style={{display:'flex',gap:10,alignItems:'flex-start',padding:'8px 0',borderBottom:'1px solid #f1f5f9'}}>
      <div style={{width:20,height:20,borderRadius:4,background:cfg.bg,border:`1px solid ${cfg.c}30`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
        <span style={{fontSize:11,fontWeight:800,color:cfg.c}}>{cfg.i}</span>
      </div>
      <div>
        <div style={{fontSize:13,fontWeight:600,color:'#1a3a6b',marginBottom:2}}>{item.title}</div>
        {item.detail&&<div style={{fontSize:12,color:'#64748b',lineHeight:1.5}}>{item.detail}</div>}
      </div>
    </div>
  );
}

function BourseSelector({ bourses, selected, onSelect }) {
  const sel = bourses.find(b=>b.nom===selected);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <label style={{fontSize:11,color:'#1a3a6b',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>Bourse cible</label>
      <select value={selected} onChange={e=>onSelect(e.target.value)}
        style={{padding:'10px 14px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',color:selected?'#1a3a6b':'#94a3b8',fontSize:14,outline:'none',cursor:'pointer',fontFamily:'inherit'}}>
        <option value="">-- Sélectionner une bourse --</option>
        {bourses.map((b,i)=><option key={i} value={b.nom}>{b.nom}{b.pays?` · ${b.pays}`:''}</option>)}
      </select>
      {sel?.url&&<div style={{fontSize:12,color:'#64748b'}}>🔗 <a href={sel.url} target="_blank" rel="noopener noreferrer" style={{color:'#1a3a6b',textDecoration:'none',fontWeight:500}}>{sel.url}</a></div>}
      {selected&&<div style={{fontSize:12,color:'#166534',fontStyle:'italic',padding:'6px 10px',borderRadius:4,background:'#f0fdf4',border:'1px solid #bbf7d0'}}>L'IA consultera le site officiel pour personnaliser votre document</div>}
    </div>
  );
}

// ─── Modal connexion ──────────────────────────────────────────────────────────

function LoginModal({ onClose }) {
  const [email,  setEmail]  = useState('');
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
    <div style={M.overlay}>
      <div style={M.box}>
        <div style={M.head}>
          <span style={{ fontSize: 22 }}>🔐</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Connexion à OppsTrack</span>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={M.body}>
          {status === 'idle' && (
            <>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                Entrez votre email pour recevoir un <strong style={{ color: '#1a3a6b' }}>lien de connexion magique</strong>.
              </p>
              <input type="email" placeholder="votre@email.com" value={email} autoFocus
                onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                style={M.input} />
              {errMsg && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{errMsg}</div>}
              <button style={M.btn} onClick={send}>✉️ Envoyer le lien magique</button>
            </>
          )}
          {status === 'sending' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={M.spinner} />
              <p style={{ color: '#64748b', marginTop: 14 }}>Envoi en cours...</p>
            </div>
          )}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>✉️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 8 }}>Lien envoyé !</div>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
                Vérifiez votre boîte mail (et les spams).<br/>Cliquez sur le lien pour vous connecter.
              </p>
              <button style={{ ...M.btn, background: '#166534', marginTop: 20 }} onClick={onClose}>✓ Fermer</button>
            </div>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#dc2626', marginBottom: 12 }}>{errMsg}</p>
              <button style={{ ...M.btn, background: '#dc2626' }} onClick={() => { setStatus('idle'); setErrMsg(''); }}>Réessayer</button>
            </div>
          )}
        </div>
      </div>
      <div style={M.backdrop} onClick={onClose} />
    </div>
  );
}

const M = {
  overlay:  { position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' },
  backdrop: { position:'absolute', inset:0, background:'rgba(26,58,107,0.45)', backdropFilter:'blur(6px)' },
  box:      { position:'relative', zIndex:2001, width:400, maxWidth:'92vw', background:'#ffffff', borderRadius:10, overflow:'hidden', border:'1px solid #e2e8f0', boxShadow:'0 20px 48px rgba(26,58,107,0.18)', borderTop:'3px solid #f5a623' },
  head:     { display:'flex', alignItems:'center', gap:10, padding:'16px 20px', background:'#1a3a6b', borderBottom:'1px solid rgba(255,255,255,0.1)' },
  closeBtn: { marginLeft:'auto', background:'rgba(255,255,255,0.12)', border:'none', color:'#fff', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' },
  body:     { padding:'24px' },
  input:    { width:'100%', padding:'11px 14px', borderRadius:6, border:'1.5px solid #e2e8f0', background:'#f8fafc', color:'#1a3a6b', fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:4 },
  btn:      { width:'100%', marginTop:16, padding:'12px', borderRadius:6, border:'none', background:'#1a3a6b', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'opacity 0.2s' },
  spinner:  { width:40, height:40, border:'3px solid #eff6ff', borderTopColor:'#1a3a6b', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' },
};

const S_locked = {
  locked:     { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8f9fc', padding:24 },
  lockedCard: { display:'flex', flexDirection:'column', alignItems:'center', background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:12, padding:'48px 40px', boxShadow:'0 4px 20px rgba(26,58,107,0.08)', maxWidth:380, width:'100%' },
  lockBtn:    { padding:'12px 32px', borderRadius:6, background:'#1a3a6b', color:'white', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' },
};

// ─── Composant principal CVPage ───────────────────────────────────────────────

export default function CVPage({ user, setView, initialTab }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [tab,          setTab]      = useState(initialTab || 'cv'); // ← pré-sélection depuis le chat
  const [mode,         setMode]     = useState('menu');
  const [bourse,       setBourse]   = useState('');
  const [bourses,      setBourses]  = useState([]);
  const [content,      setContent]  = useState('');
  const [improved,     setImproved] = useState('');
  const [analysis,     setAnalysis] = useState(null);
  const [step,         setStep]     = useState('');
  const [fileName,     setFileName] = useState(null);
  const [lmPreviewMode, setLmPreviewMode] = useState('rendered');
  const fileRef = useRef(null);

  // Réagir si initialTab change (ex : 2e navigation depuis le chat)
  useEffect(() => {
    if (initialTab === 'cv' || initialTab === 'lm') {
      setTab(initialTab);
      reset();
    }
  }, [initialTab]);

  const docType = tab==='cv' ? 'CV' : 'Lettre de motivation';
  const selB    = bourses.find(b=>b.nom===bourse);
  const pCheck  = checkProfile(user);
  console.log('Champs manquants:', pCheck.missing);
console.log('User data:', {
  name: user.name,
  currentLevel: user.currentLevel,
  niveau: user.niveau,
  fieldOfStudy: user.fieldOfStudy,
  domaine: user.domaine,
  institution: user.institution,
  motivationSummary: user.motivationSummary,
  academicHistory: user.academicHistory,
});
  const isLM    = tab === 'lm';

  // ── Non connecté ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        <div style={S_locked.locked}>
          <div style={S_locked.lockedCard}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📄</div>
            <h3 style={{ color: '#1a3a6b', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>
              CV & Lettre non disponibles
            </h3>
            <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6, maxWidth: 280, textAlign: 'center', margin: '0 0 24px' }}>
              Connectez-vous pour générer votre CV et lettre de motivation personnalisés avec l'IA.
            </p>
            <button style={S_locked.lockBtn} onClick={() => setShowLoginModal(true)}>
              🔐 Se connecter
            </button>
          </div>
        </div>
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </>
    );
  }

  // ── Chargement des bourses depuis la roadmap ─────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    axiosInstance.get(API_ROUTES.roadmap.byUser(user.id))
      .then(response => {
        const docs = (response.data.docs || []).map(d => ({
          nom:      d.nom,
          pays:     d.pays || '',
          url:      d.lienOfficiel || d.url || '',
          deadline: d.dateLimite || d.deadline || '',
          langue:   d.langue || '',
        }));
        setBourses(docs || []);
      })
      .catch(() => setBourses([]));
  }, [user?.id]);

  const reset = () => {
    setMode('menu'); setContent(''); setImproved('');
    setAnalysis(null); setFileName(null); setStep('');
    setLmPreviewMode('rendered');
  };

  const dlPDF = async (text, suffix) => {
    const safe = ((tab==='cv'?'CV':'LM')+'_'+(bourse||'OppsTrack')+(suffix||'')).replace(/[^a-zA-Z0-9_-]/g,'_');
    if (tab==='cv') await generateCV(text, user, bourse, safe);
    else await generateLM(text, safe, { name:user?.name||'', email:user?.email||'', phone:user?.phone||'', address:user?.countryOfResidence||user?.pays||'' }, bourse);
  };

  // ── Créer le document ────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!pCheck.ok) { setMode('incomplete'); return; }
    if (!bourse) { alert('Sélectionnez une bourse'); return; }
    setMode('loading'); setStep('Lecture du profil...');
    const steps = isLM
      ? ['Lecture du profil...', 'Analyse des critères de la bourse...', "Rédaction de l'accroche...", 'Développement des arguments...', 'Finalisation et relecture...']
      : ['Lecture du profil...', 'Préparation...', 'Rédaction personnalisée...', 'Adaptation aux critères...', 'Finalisation...'];
    let si=0;
    const t = setInterval(() => { si=Math.min(si+1,steps.length-1); setStep(steps[si]); }, 4000);
    try {
      const r = await callN8N(tab==='cv'?'generate_cv':'generate_lm', {
        text: buildPrompt(tab, user, bourse, selB),
        id: user.id,
        email: user.email,
          bourse_nom: bourse || '',        // ← ajout
  bourse_pays: selB?.pays || '',   // ← ajout
        conversationId: tab+'-'+Date.now(),
      });
      // Détecter si le profil est incomplet côté serveur
      try {
        const parsed = JSON.parse(r);
        if (parsed?.missing_fields) { clearInterval(t); setMode('incomplete'); return; }
      } catch (_) {}
      clearInterval(t); setContent(r||''); setMode('created');
    } catch(e) { clearInterval(t); setStep('Erreur n8n'); console.error(e); }
  };

  // ── Upload fichier ───────────────────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    const isPdf = file.type==='application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isTxt = file.type==='text/plain' || file.name.toLowerCase().endsWith('.txt');
    if (isPdf) {
      setMode('loading'); setStep('Extraction du texte du PDF...');
      try {
        const text = await extractPdfText(file);
        if (text && text.trim().length > 50) { setContent(text.slice(0,15000)); setStep(''); setMode('upload'); }
        else { setStep(''); setMode('pdf_scan'); }
      } catch(e) { console.error(e); setStep(''); setMode('pdf_scan'); }
    } else if (isTxt) {
      const text = await file.text(); setContent(text.slice(0,15000)); setMode('upload');
    } else {
      setMode('pdf_scan');
    }
  };

  // ── Analyser ─────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setMode('loading'); setStep(bourse?`Comparaison avec "${bourse}"...`:'Analyse en cours...');
    try {
      const analysisPrompt = isLM
        ? 'Analyse cette lettre de motivation' + (bourse ? ` pour la bourse "${bourse}"` : '') + '.\n' +
          (selB?.url ? 'Consulte : ' + selB.url + '\n' : '') +
          'Évalue : accroche, structure, argumentation, adéquation bourse, longueur (min 500 mots), formule de politesse.\n' +
          'Retourne UNIQUEMENT ce JSON sans markdown :\n{"score":number,"checklist":[{"title":string,"status":"ok"|"warning"|"error","detail":string}],"strengths":[string],"toFix":[string],"toAdd":[string],"toRemove":[string],"conclusion":string}\n' +
          'Lettre :\n' + content
        : 'Analyse ce CV' + (bourse ? ` pour la bourse "${bourse}"` : '') + '.\n' +
          (selB?.url ? '\nConsulte : ' + selB.url : '') +
          '\nRetourne UNIQUEMENT ce JSON sans markdown :\n{"score":number,"checklist":[{"title":string,"status":"ok"|"warning"|"error","detail":string}],"strengths":[string],"toFix":[string],"toAdd":[string],"toRemove":[string],"conclusion":string}\n' +
          'CV :\n' + content;
      const raw = await callN8N('CV_ANALYSIS', {
        text: analysisPrompt, id: user?.id||null,bourse_nom: bourse || '',        // ← ajout
  bourse_pays: selB?.pays || '',
        bourse:{ nom:selB?.nom||bourse||'', url:selB?.url||'' },
        conversationId: 'analysis-'+Date.now(),
      });
      try {
        const m = raw.match(/\{[\s\S]*\}/);
        setAnalysis(m ? JSON.parse(m[0]) : {score:0,conclusion:raw,checklist:[],strengths:[],toFix:[],toAdd:[],toRemove:[]});
      } catch {
        setAnalysis({score:0,conclusion:raw,checklist:[],strengths:[],toFix:[],toAdd:[],toRemove:[]});
      }
      setMode('analyzed');
    } catch(e) { console.error(e); setMode('upload'); }
  };

  // ── Améliorer ────────────────────────────────────────────────────────────────
  const handleImprove = async () => {
    if (!analysis) return;
    const cvDoc = content;
    setMode('loading'); setStep('Amélioration en cours...');
    try {
      const improvePrompt = isLM
        ? 'Améliore cette lettre de motivation en appliquant les corrections suivantes.\n' +
          'À corriger :\n' + (analysis.toFix||[]).map(x=>'- '+x).join('\n') + '\n' +
          'À ajouter :\n' + (analysis.toAdd||[]).map(x=>'- '+x).join('\n') + '\n' +
          'À supprimer :\n' + (analysis.toRemove||[]).map(x=>'- '+x).join('\n') + '\n' +
          (bourse ? `\nAdapte pour la bourse "${bourse}".\n` : '') +
          '\nIMPORTANT : conserve la structure en 6 paragraphes, texte brut, min 500 mots, aucun ** ni #.\n' +
          'Lettre originale :\n' + cvDoc
        : 'Ameliore ce CV.\nA corriger :\n' + (analysis.toFix||[]).map(x=>'- '+x).join('\n') + '\nDocument original :\n' + cvDoc;
      const r = await callN8N(tab==='cv'?'generate_cv':'generate_lm', {
        text: improvePrompt, id: user?.id||null,
          text: improvePrompt,
        bourse:{ nom:selB?.nom||bourse||'', url:selB?.url||'' },
        conversationId: 'improve-'+Date.now(),
      });
      setImproved(r||''); setMode('improved');
      window.scrollTo({ top:0, behavior:'smooth' });
    } catch(e) { console.error(e); setMode('analyzed'); }
  };

  // ── Aperçu LM ────────────────────────────────────────────────────────────────
  const LMPreview = ({ text }) => {
    const paragraphs = (text||'')
      .replace(/\*\*([^*]+)\*\*/g,'$1').replace(/\*([^*]+)\*/g,'$1').replace(/^#{1,4}\s+/gm,'')
      .split('\n')
      .reduce((acc, line) => {
        if (!line.trim()) { acc.push(''); return acc; }
        if (acc.length && acc[acc.length-1] !== '') { acc[acc.length-1] += ' ' + line.trim(); }
        else { acc.push(line.trim()); }
        return acc;
      }, []);
    return (
      <div style={{ padding:28, fontFamily:'Georgia,serif', fontSize:14, lineHeight:1.9, color:'#1a3a6b', maxHeight:560, overflowY:'auto', background:'#fff' }}>
        {paragraphs.map((p, i) =>
          !p ? <div key={i} style={{ height:12 }} /> :
          /^(objet|madame|monsieur)/i.test(p)
            ? <p key={i} style={{ fontWeight:700, margin:'0 0 8px', fontFamily:'system-ui,sans-serif', fontSize:13, color:'#1a3a6b' }}>{p}</p>
            : /^(veuillez|je vous prie|dans l.attente|cordialement|sincèrement)/i.test(p)
            ? <p key={i} style={{ fontStyle:'italic', margin:'0 0 6px', color:'#475569' }}>{p}</p>
            : <p key={i} style={{ margin:'0 0 16px', textAlign:'justify', color:'#374151' }}>{p}</p>
        )}
      </div>
    );
  };

  // ── Styles ───────────────────────────────────────────────────────────────────
  const C = {
    card:    { padding:'22px', borderRadius:10, background:'#fff', border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(26,58,107,0.06)', display:'flex', flexDirection:'column', gap:14 },
    btnP:    { padding:'10px 20px', borderRadius:6, border:'none', background:'#1a3a6b', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', transition:'background 0.2s', fontFamily:'inherit' },
    btnGold: { padding:'10px 20px', borderRadius:6, border:'none', background:'#f5a623', color:'#1a3a6b', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
    btnO:    { padding:'9px 18px', borderRadius:6, background:'#fff', border:'1px solid #e2e8f0', color:'#475569', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit' },
    btnG:    { padding:'10px 20px', borderRadius:6, border:'none', background:'#166534', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  };

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ width:'100%', background:'#f8f9fc', minHeight:'100vh', fontFamily:"'Segoe UI',system-ui,sans-serif", color:'#1a3a6b' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 32px' }}>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, marginBottom:24, background:'#ffffff', borderRadius:8, border:'1px solid #e2e8f0', width:'fit-content', overflow:'hidden' }}>
          {[{id:'cv',l:'📄 CV'},{id:'lm',l:'✉️ Lettre de motivation'}].map(t=>(
            <button key={t.id}
              style={{ padding:'10px 24px', border:'none', borderRight: t.id==='cv' ? '1px solid #e2e8f0' : 'none', background: tab===t.id ? '#1a3a6b' : '#fff', color: tab===t.id ? '#fff' : '#64748b', fontSize:13, fontWeight: tab===t.id ? 700 : 400, cursor:'pointer', fontFamily:'inherit' }}
              onClick={()=>{setTab(t.id);reset();}}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Profil incomplet */}
        {mode==='incomplete'&&(
          <div style={{ ...C.card, maxWidth:440, margin:'40px auto', textAlign:'center', alignItems:'center', padding:36 }}>
            <div style={{ fontSize:40 }}>⚠️</div>
            <div style={{ fontSize:17, fontWeight:700, color:'#1a3a6b' }}>Profil incomplet</div>
            <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6 }}>Complétez votre profil pour générer un document personnalisé.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, width:'100%' }}>
              {pCheck.missing.map((m,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:6, background:'#fef2f2', border:'1px solid #fecaca' }}>
                  <span style={{ color:'#dc2626', fontWeight:700, fontSize:12 }}>✕</span>
                  <span style={{ fontSize:13, color:'#991b1b' }}>{m}</span>
                </div>
              ))}
            </div>
            <button style={C.btnP} onClick={()=>setView&&setView('profil')}>Compléter mon profil</button>
          </div>
        )}

        {/* MENU */}
        {mode==='menu'&&(
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={C.card}>
              <BourseSelector bourses={bourses} selected={bourse} onSelect={setBourse}/>
              {!bourses.length&&user?.id&&(
                <div style={{ fontSize:12, color:'#92400e', padding:'10px 14px', borderRadius:6, background:'#fffbeb', border:'1px solid #fde68a' }}>
                  Aucune bourse — ajoutez-en depuis la page Bourses.
                </div>
              )}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

              {/* Créer */}
              <div style={C.card}>
                <div style={{ fontSize:32 }}>✨</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#1a3a6b', borderBottom:'2px solid #f5a623', paddingBottom:8 }}>Créer avec l'IA</div>
                <div style={{ fontSize:13, color:'#475569', lineHeight:1.65, flex:1 }}>
                  {isLM
                    ? <>L'IA rédige une lettre percutante{bourse?` pour "${bourse}"`:''} en <strong>6 paragraphes</strong> : accroche · parcours · expériences · motivation · valeur ajoutée · politesse.</>
                    : <>L'IA lit votre profil et génère un CV personnalisé{bourse?` pour "${bourse}"`:''} avec toutes vos sections.</>
                  }
                </div>
                {isLM && (
                  <div style={{ background:'#f8fafc', borderRadius:8, padding:'12px 16px', fontSize:12, color:'#64748b', lineHeight:1.9, border:'1px solid #e2e8f0' }}>
                    {['§1 — Accroche + présentation','§2 — Parcours académique & résultats','§3 — Expériences & projets',`§4 — Motivation pour ${bourse||'la bourse'}`,'§5 — Valeur ajoutée & impact','§6 — Formule de politesse'].map((s,i)=>(
                      <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background:'#1a3a6b', flexShrink:0, display:'inline-block' }}/>
                        {s}
                      </div>
                    ))}
                  </div>
                )}
                {user&&!pCheck.ok&&<div style={{ fontSize:12, color:'#92400e', padding:'8px 12px', borderRadius:6, background:'#fffbeb', border:'1px solid #fde68a' }}>{pCheck.missing.length} information{pCheck.missing.length>1?'s':''} manquante{pCheck.missing.length>1?'s':''}</div>}
                <button style={{ ...C.btnGold, opacity:!bourse?0.45:1 }} disabled={!bourse} onClick={handleCreate}>
                  Générer {isLM ? 'ma lettre' : 'mon CV'}
                </button>
              </div>

              {/* Analyser */}
              <div style={C.card}>
                <div style={{ fontSize:32 }}>🔍</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#1a3a6b', borderBottom:'2px solid #f5a623', paddingBottom:8 }}>Analyser & améliorer</div>
                <div style={{ fontSize:13, color:'#475569', lineHeight:1.65, flex:1 }}>
                  {isLM
                    ? "Uploadez votre lettre — texte extrait automatiquement du PDF. L'IA vérifie structure, argumentation, longueur et adéquation bourse."
                    : "Uploadez votre CV — texte extrait automatiquement du PDF. L'IA l'analyse et peut l'améliorer."}
                </div>
                <div
                  style={{ border:'2px dashed #bfdbfe', borderRadius:8, padding:22, textAlign:'center', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:8, background:'#f8fafc', transition:'all 0.2s' }}
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}}
                  onClick={()=>fileRef.current?.click()}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='#1a3a6b';e.currentTarget.style.background='#eff6ff';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#bfdbfe';e.currentTarget.style.background='#f8fafc';}}
                >
                  <input type="file" ref={fileRef} style={{display:'none'}} accept=".pdf,.txt" onChange={e=>handleFile(e.target.files[0])}/>
                  {fileName
                    ? <><span style={{fontSize:24}}>📄</span><span style={{color:'#166534',fontSize:13,fontWeight:600}}>✅ {fileName}</span></>
                    : <><span style={{fontSize:28}}>📁</span><span style={{color:'#64748b',fontSize:13,fontWeight:500}}>Glissez votre PDF ici ou cliquez</span><span style={{fontSize:11,color:'#94a3b8'}}>PDF · TXT — texte extrait automatiquement</span></>
                  }
                </div>
                <button style={C.btnO} onClick={()=>setMode('upload')}>Coller le texte manuellement</button>
              </div>
            </div>

            {/* Tips LM */}
            {isLM && (
              <div style={{ ...C.card, background:'#eff6ff', border:'1px solid #bfdbfe' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#1a3a6b' }}>💡 Conseils pour une lettre percutante</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                  {[
                    {icon:'🎯',title:'Soyez spécifique',desc:'Mentionnez la bourse par son nom et citez ses valeurs officielles'},
                    {icon:'📊',title:'Chiffrez vos résultats',desc:'GPA, classement, nombre de projets — les données convainquent'},
                    {icon:'✍️',title:'Une idée par paragraphe',desc:'Structure claire = lecteur convaincu. Évitez les pavés sans respiration'},
                  ].map((tip,i)=>(
                    <div key={i} style={{ padding:'12px 14px', borderRadius:8, background:'#fff', border:'1px solid #bfdbfe', display:'flex', flexDirection:'column', gap:4 }}>
                      <div style={{fontSize:20}}>{tip.icon}</div>
                      <div style={{fontSize:12,fontWeight:700,color:'#1a3a6b'}}>{tip.title}</div>
                      <div style={{fontSize:11,color:'#64748b',lineHeight:1.5}}>{tip.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PDF scanné */}
        {mode==='pdf_scan'&&(
          <div style={{ ...C.card, maxWidth:540, margin:'0 auto' }}>
            <div style={{fontSize:36,textAlign:'center'}}>🖼️</div>
            <div style={{fontSize:15,fontWeight:700,color:'#1a3a6b',textAlign:'center'}}>PDF scanné ou DOCX détecté</div>
            <div style={{fontSize:13,color:'#64748b',lineHeight:1.7}}>Ce fichier ne contient pas de texte extractible. Collez le texte ci-dessous.</div>
            <BourseSelector bourses={bourses} selected={bourse} onSelect={setBourse}/>
            <textarea
              style={{ width:'100%', padding:14, borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#1a3a6b', fontSize:13, fontFamily:'monospace', lineHeight:1.65, outline:'none', resize:'vertical', boxSizing:'border-box', minHeight:280 }}
              value={content} onChange={e=>setContent(e.target.value)}
              placeholder={`Collez le texte de votre ${docType} ici...`} rows={14}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              {isLM && <WordCount text={content} />}
              <button style={{...C.btnP,opacity:content.trim()?1:0.45,marginLeft:'auto'}} disabled={!content.trim()} onClick={handleAnalyze}>
                Analyser{bourse?` pour "${bourse}"`:''}</button>
            </div>
          </div>
        )}

        {/* Upload */}
        {mode==='upload'&&(
          <div style={C.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:14,fontWeight:600,color:'#1a3a6b'}}>{fileName?`📄 ${fileName}`:`Votre ${docType}`}{bourse?` — ${bourse}`:''}</div>
              {fileName&&<span style={{fontSize:11,color:'#166534',fontWeight:500,padding:'3px 10px',borderRadius:4,background:'#f0fdf4',border:'1px solid #bbf7d0'}}>✅ Texte extrait</span>}
            </div>
            <BourseSelector bourses={bourses} selected={bourse} onSelect={setBourse}/>
            <textarea
              style={{ width:'100%', padding:14, borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#1a3a6b', fontSize:13, fontFamily:'monospace', lineHeight:1.65, outline:'none', resize:'vertical', boxSizing:'border-box', minHeight:360 }}
              value={content} onChange={e=>setContent(e.target.value)}
              placeholder={`Contenu de votre ${docType}...`} rows={18}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              {isLM ? <WordCount text={content} /> : <span/>}
              <button style={{...C.btnP,opacity:content.trim()?1:0.45}} disabled={!content.trim()} onClick={handleAnalyze}>
                Analyser{bourse?` pour "${bourse}"`:''}</button>
            </div>
          </div>
        )}

        {/* Loading */}
        {mode==='loading'&&(
          <div style={{ ...C.card, alignItems:'center', padding:'72px 24px', gap:16, textAlign:'center' }}>
            <div style={{ width:44, height:44, borderRadius:'50%', border:'3px solid #e2e8f0', borderTopColor:'#1a3a6b', animation:'spin 1s linear infinite' }}/>
            <div style={{ fontSize:15, fontWeight:600, color:'#1a3a6b' }}>{step||'Traitement...'}</div>
            <div style={{ fontSize:13, color:'#94a3b8' }}>Cela peut prendre 15 à 30 secondes</div>
          </div>
        )}

        {/* CREATED */}
        {mode==='created'&&content&&(
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ ...C.card, flexDirection:'row', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:'#1a3a6b' }}>{docType} généré ✅</div>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
                  {bourse&&<span style={{ fontSize:12, color:'#1a3a6b', fontWeight:500, padding:'2px 8px', borderRadius:4, background:'#eff6ff', border:'1px solid #bfdbfe' }}>{bourse}</span>}
                  {isLM && <WordCount text={content} />}
                  {!isLM && <span style={{ fontSize:12, color:'#64748b' }}>{content.split(/\s+/).filter(Boolean).length} mots</span>}
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button style={C.btnO} onClick={()=>setMode('upload')}>Modifier & analyser</button>
                <button style={C.btnGold} onClick={()=>dlPDF(content,'')}>⬇️ Télécharger PDF</button>
              </div>
            </div>
            <div style={{ ...C.card, padding:0, overflow:'hidden' }}>
              <div style={{ padding:'12px 20px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#1a3a6b', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  {isLM ? 'Aperçu — rendu lettre' : 'Aperçu'}
                </span>
                {isLM && (
                  <div style={{ display:'flex', gap:4 }}>
                    {[{id:'rendered',l:'Rendu'},{id:'raw',l:'Texte brut'}].map(m=>(
                      <button key={m.id}
                        style={{ padding:'4px 12px', borderRadius:4, border:'none', background: lmPreviewMode===m.id ? '#1a3a6b' : '#e2e8f0', color: lmPreviewMode===m.id ? '#fff' : '#64748b', fontSize:11, cursor:'pointer', fontWeight:500 }}
                        onClick={()=>setLmPreviewMode(m.id)}>{m.l}</button>
                    ))}
                    <button style={{ padding:'4px 12px', borderRadius:4, border:'none', background:'#f5a623', color:'#1a3a6b', fontSize:11, cursor:'pointer', fontWeight:700, marginLeft:4 }}
                      onClick={()=>dlPDF(content,'')}>⬇️ PDF</button>
                  </div>
                )}
              </div>
              {isLM && lmPreviewMode==='rendered'
                ? <LMPreview text={content} />
                : <div style={{ padding:20, fontSize:13, color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap', fontFamily:'monospace', maxHeight:420, overflowY:'auto' }}>{content}</div>
              }
            </div>
            <div style={{ ...C.card, background:'#f0fdf4', border:'1px solid #bbf7d0', flexDirection:'row', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:'#166534' }}>Analyser {isLM ? 'cette lettre' : 'ce document'} ?</div>
                <div style={{ fontSize:13, color:'#4b5563' }}>
                  {bourse ? `L'IA vérifie la compatibilité avec les critères de ${bourse}.` : "L'IA évalue votre document."}
                </div>
              </div>
              <button style={C.btnG} onClick={handleAnalyze}>Analyser maintenant</button>
            </div>
          </div>
        )}

        {/* IMPROVED */}
        {mode==='improved'&&improved&&(
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ padding:24, borderRadius:10, background:'#1a3a6b', borderBottom:'3px solid #f5a623', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, boxShadow:'0 4px 16px rgba(26,58,107,0.2)' }}>
              <div>
                <div style={{ fontSize:20, fontWeight:800, color:'#fff' }}>✅ {docType} amélioré !</div>
                <div style={{ display:'flex', gap:8, marginTop:4, alignItems:'center' }}>
                  {bourse&&<span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Optimisé pour {bourse}</span>}
                  {isLM && <><span style={{ color:'rgba(255,255,255,0.4)' }}>·</span><WordCount text={improved}/></>}
                </div>
              </div>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <button style={{ padding:'12px 28px', borderRadius:6, border:'none', background:'#f5a623', color:'#1a3a6b', fontSize:14, fontWeight:800, cursor:'pointer' }}
                  onClick={()=>dlPDF(improved,'_ameliore')}>⬇️ Télécharger PDF amélioré</button>
                <button style={{ padding:'10px 18px', borderRadius:6, border:'1px solid rgba(255,255,255,0.3)', background:'transparent', color:'#fff', fontSize:13, cursor:'pointer' }}
                  onClick={()=>setMode('analyzed')}>← Voir l'analyse</button>
              </div>
            </div>
            <div style={{ borderRadius:10, background:'#fff', border:'1px solid #e2e8f0', overflow:'hidden', borderTop:'3px solid #f5a623' }}>
              <div style={{ padding:'12px 20px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#1a3a6b', textTransform:'uppercase', letterSpacing:'0.08em' }}>Aperçu du {docType} amélioré</div>
                <button style={{ padding:'6px 16px', borderRadius:4, border:'none', background:'#f5a623', color:'#1a3a6b', fontSize:12, fontWeight:700, cursor:'pointer' }}
                  onClick={()=>dlPDF(improved,'_ameliore')}>⬇️ PDF</button>
              </div>
              {isLM ? <LMPreview text={improved} /> : <div style={{ padding:20, fontSize:13, color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap', fontFamily:'monospace', maxHeight:600, overflowY:'auto' }}>{improved}</div>}
            </div>
          </div>
        )}

        {/* ANALYZED */}
        {mode==='analyzed'&&analysis&&(
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ ...C.card, flexDirection:'row', alignItems:'center', gap:20, flexWrap:'wrap' }}>
              <ScoreRing score={analysis.score}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:700, color:'#1a3a6b' }}>Analyse de votre {docType}</div>
                {bourse&&<div style={{ fontSize:12, color:'#f5a623', marginTop:2, fontWeight:600, background:'#1a3a6b', display:'inline-block', padding:'2px 8px', borderRadius:4 }}>Évalué pour {bourse}</div>}
                <div style={{ fontSize:13, color:'#64748b', marginTop:6 }}>
                  {analysis.score>=80?'🎉 Excellent — prêt à soumettre !':analysis.score>=60?'👍 Bon niveau — quelques ajustements':'⚠️ Des améliorations nécessaires'}
                </div>
                {isLM && <div style={{ marginTop:8 }}><WordCount text={content} /></div>}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <button style={C.btnGold} onClick={handleImprove}>✨ Améliorer automatiquement</button>
                {improved&&<button style={C.btnG} onClick={()=>dlPDF(improved,'_ameliore')}>⬇️ PDF amélioré</button>}
                <button style={C.btnO} onClick={()=>dlPDF(content,'')}>⬇️ PDF original</button>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
              {analysis.checklist?.length>0&&(
                <div style={C.card}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#1a3a6b', textTransform:'uppercase', letterSpacing:'0.08em', borderBottom:'2px solid #f5a623', paddingBottom:6, display:'inline-block' }}>Checklist{bourse?` — ${bourse}`:''}</div>
                  {analysis.checklist.map((item,i)=><CheckItem key={i} item={item}/>)}
                </div>
              )}
              {analysis.conclusion&&(
                <div style={{ ...C.card, background:'#eff6ff', border:'1px solid #bfdbfe' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#1a3a6b', textTransform:'uppercase', letterSpacing:'0.08em' }}>Conclusion de l'IA</div>
                  <p style={{ fontSize:13, color:'#374151', lineHeight:1.7, margin:0 }}>{analysis.conclusion}</p>
                </div>
              )}
              {analysis.strengths?.length>0&&(
                <div style={{ ...C.card, border:'1px solid #bbf7d0' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#166534', textTransform:'uppercase', letterSpacing:'0.08em' }}>Points forts</div>
                  {analysis.strengths.map((s,i)=>(
                    <div key={i} style={{ display:'flex', gap:10, padding:'5px 0', borderBottom:'1px solid #f0fdf4', fontSize:13, color:'#166534', alignItems:'flex-start' }}>
                      <span style={{ color:'#166534', fontWeight:700, flexShrink:0 }}>✓</span><span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {analysis.toFix?.length>0&&(
                <div style={{ ...C.card, border:'1px solid #fed7aa' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#d97706', textTransform:'uppercase', letterSpacing:'0.08em' }}>À corriger</div>
                  {analysis.toFix.map((s,i)=>(
                    <div key={i} style={{ display:'flex', gap:10, padding:'5px 0', borderBottom:'1px solid #fffbeb', fontSize:13, color:'#92400e', alignItems:'flex-start' }}>
                      <span style={{ color:'#d97706', fontWeight:700, flexShrink:0 }}>→</span><span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {analysis.toAdd?.length>0&&(
                <div style={{ ...C.card, border:'1px solid #bfdbfe' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#1a3a6b', textTransform:'uppercase', letterSpacing:'0.08em' }}>À ajouter</div>
                  {analysis.toAdd.map((s,i)=>(
                    <div key={i} style={{ display:'flex', gap:10, padding:'5px 0', borderBottom:'1px solid #eff6ff', fontSize:13, color:'#1e40af', alignItems:'flex-start' }}>
                      <span style={{ color:'#1a3a6b', fontWeight:700, flexShrink:0 }}>+</span><span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {analysis.toRemove?.length>0&&(
                <div style={{ ...C.card, border:'1px solid #fecaca' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#dc2626', textTransform:'uppercase', letterSpacing:'0.08em' }}>À supprimer</div>
                  {analysis.toRemove.map((s,i)=>(
                    <div key={i} style={{ display:'flex', gap:10, padding:'5px 0', borderBottom:'1px solid #fef2f2', fontSize:13, color:'#991b1b', alignItems:'flex-start' }}>
                      <span style={{ color:'#dc2626', fontWeight:700, flexShrink:0 }}>✕</span><span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>
    </div>
  );
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(tab, user, bourse, selB) {
  if (tab === 'cv') {
    return 'Tu es expert RH. Redige un CV COMPLET et PROFESSIONNEL pour la bourse "' + bourse + '" (' + (selB?.pays||'') + ').\n\n' +
      'CANDIDAT :\nNom: ' + (user.name||'') + ' | Email: ' + (user.email||'') + ' | Tel: ' + (user.phone||'') + '\n' +
      'Nationalite: ' + (user.nationality||'') + ' | Pays: ' + (user.countryOfResidence||user.pays||'') + '\n' +
      'Niveau: ' + (user.currentLevel||user.niveau||'') + ' | Domaine: ' + (user.fieldOfStudy||user.domaine||'') + '\n' +
      'Institution: ' + (user.institution||'') + ' | GPA: ' + (user.gpa||'') + '/20\n' +
      'Diplome vise: ' + (user.targetDegree||'') + '\nMotivation: ' + (user.motivationSummary||'') + '\n' +
      'LinkedIn: ' + (user.linkedin||'') + ' | GitHub: ' + (user.github||'') + '\n\n' +
      'FORMATION:\n' + ((user.academicHistory||[]).map(h=>'- '+h.degree+' en '+h.field+' - '+h.institution+' ('+h.year+') | '+h.grade).join('\n')||'Non renseignee') + '\n\n' +
      'EXPERIENCES:\n' + ((user.workExperience||[]).map(w=>'- '+w.position+' chez '+w.company+(w.city?', '+w.city:'')+' ('+((w.startDate||'').slice(0,7))+' - '+((w.endDate||'').slice(0,7))+')\n  '+((w.description||'a enrichir'))).join('\n')||'Non renseignee') + '\n\n' +
      'PROJETS:\n' + ((user.academicProjects||[]).map(p=>'- '+p.title+' ('+p.type+', '+p.year+')\n  '+(p.description||'')+'\n  Tech: '+(p.technologies||'')).join('\n')||'Non renseignes') + '\n\n' +
      'BENEVOLAT:\n' + ((user.volunteerWork||[]).map(v=>'- '+v.role+' - '+v.organization+'\n  '+(v.description||'')).join('\n')||'Non renseigne') + '\n\n' +
      'COMPETENCES: ' + ((user.skills||[]).map(s=>s.skill+' ('+s.level+')').join(', ')||'Non renseignees') + '\n' +
      'LANGUES: ' + ((user.languages||[]).map(l=>l.language+' '+l.level+(l.certificate?' - '+l.certificate:'')).join(', ')||'Non renseignees') + '\n' +
      'CERTIFICATIONS: ' + ((user.certifications||[]).map(c=>c.name+' - '+(c.issuer||'')+' ('+c.date+')').join(', ')||'Aucune') + '\n' +
      'DISTINCTIONS: ' + ((user.awards||[]).map(a=>a.title+' - '+(a.organization||'')+' ('+a.year+')').join(', ')||'Aucune') + '\n\n' +
      'INSTRUCTIONS:\n1. Texte brut UNIQUEMENT\n2. Sections en MAJUSCULES separees par ---\n3. JAMAIS de placeholder [xxx]\n4. Adapte pour "' + bourse + '"\n\n' +
      'FORMAT:\nRESUME PROFESSIONNEL\n---\nFORMATION ACADEMIQUE\n---\nEXPERIENCES PROFESSIONNELLES\n---\nPROJETS ACADEMIQUES\n---\nCOMPETENCES TECHNIQUES\n---\nLANGUES\n---\nCERTIFICATIONS\n---\nBENEVOLAT ET ENGAGEMENT\n---\nDISTINCTIONS ET PRIX';
  } else {
    return 'Tu es expert en rédaction de lettres de motivation pour bourses universitaires internationales.\n' +
      'Rédige une lettre PROFESSIONNELLE et PERSONNALISÉE pour la bourse "' + bourse + '" (' + (selB?.pays||'') + ').\n\n' +
      'PROFIL :\nNom: ' + (user.name||'') + ' | Email: ' + (user.email||'') + '\n' +
      'Niveau: ' + (user.currentLevel||user.niveau||'') + ' | Domaine: ' + (user.fieldOfStudy||user.domaine||'') + '\n' +
      'Institution: ' + (user.institution||'') + ' | GPA: ' + (user.gpa||'') + '/20\n' +
      'Motivation: ' + (user.motivationSummary||'') + '\n\n' +
      'FORMATION:\n' + ((user.academicHistory||[]).map(h=>'- '+h.degree+' à '+h.institution+' ('+h.year+')').join('\n')||'Non renseignée') + '\n\n' +
      (selB?.url ? 'Site officiel : ' + selB.url + '\n\n' : '') +
      'STRUCTURE OBLIGATOIRE (600 mots minimum) :\n' +
      'Tunis, le [date du jour]\nObjet : Candidature à la Bourse ' + bourse + '\nMadame, Monsieur,\n' +
      '§1 — ACCROCHE\n§2 — PARCOURS ACADÉMIQUE\n§3 — EXPÉRIENCES & PROJETS\n§4 — MOTIVATION SPÉCIFIQUE\n§5 — VALEUR AJOUTÉE\n§6 — FORMULE DE POLITESSE\n\n' +
      'CONTRAINTES : texte brut uniquement, 600 mots minimum, aucun placeholder.';
  }
}