import React, { useState, useRef, useEffect } from 'react';

const WEBHOOK_URL = 'http://localhost:5678/webhook-test/webhook';
const API_BASE    = 'http://localhost:3001/api';

// ── jsPDF ─────────────────────────────────────────────────────────────────────
function loadJsPDF() {
  return new Promise(resolve => {
    if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => resolve(window.jspdf.jsPDF);
    document.head.appendChild(s);
  });
}

// ── pdf.js — extraction texte depuis PDF ──────────────────────────────────────
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
    const tc   = await page.getTextContent();
    text += tc.items.map(it => it.str).join(' ') + '\n';
  }
  return text.trim();
}

// ── generateCV — mise en page professionnelle noir/blanc ──────────────────────
async function generateCV(aiContent, user, bourse, filename) {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, mL = 20, mR = 20, mT = 25, mB = 18, uW = 170;
  let y = mT;

  const chk = (h = 6) => { if (y + h > H - mB) { doc.addPage(); y = mT; } };

  const nom      = (user.name || '').trim().toUpperCase();
  const titre    = [user.currentLevel || user.niveau || '', user.fieldOfStudy || user.domaine || ''].filter(Boolean).join(' - ');
  const contacts = [user.email, user.phone, user.countryOfResidence || user.pays, user.nationality].filter(Boolean).join('   |   ');
  const links    = [user.linkedin, user.github, user.portfolio].filter(Boolean).join('   |   ');

  // En-tête
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(0, 0, 0);
  doc.text(nom, W / 2, y, { align: 'center' }); y += 8;
  doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.8);
  doc.line(mL, y, W - mR, y); y += 5;
  if (titre) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(60, 60, 60);
    doc.text(titre, W / 2, y, { align: 'center' }); y += 5;
  }
  if (contacts) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(80, 80, 80);
    doc.text(contacts, W / 2, y, { align: 'center' }); y += 4.5;
  }
  if (links) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(80, 80, 80);
    doc.text(links, W / 2, y, { align: 'center' }); y += 4.5;
  }
  doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.4);
  doc.line(mL, y, W - mR, y); y += 7;

  // Contenu IA ligne par ligne
  for (const line of (aiContent || '').split('\n')) {
    const tr = line.trim();
    if (!tr) { y += 2.5; continue; }
    const isSep     = /^[-=]{3,}$/.test(tr);
    const isSection = /^[A-ZAÀÂÉÈÊÎÏÔÙÛÜ\s]{4,}$/.test(tr) && tr.length < 50;
    const isBullet  = /^[-*•]\s/.test(tr);
    const isDate    = /\d{4}\s*[-]\s*(\d{4}|present|en cours|actuel)/i.test(tr);
    const isSubhead = /^[A-Z][^.!?]{2,40}:$/.test(tr);
    chk(isSection ? 14 : 6);
    if (isSep) {
      doc.setDrawColor(160, 160, 160); doc.setLineWidth(0.2);
      doc.line(mL, y, W - mR, y); y += 4; continue;
    }
    if (isSection) {
      y += 3;
      doc.setFillColor(245, 245, 245);
      doc.rect(mL, y - 4, uW, 9, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
      doc.text(tr, mL + 3, y + 1.5); y += 9;
      doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
      doc.line(mL, y - 1, W - mR, y - 1); y += 3; continue;
    }
    if (isBullet) {
      const txt = tr.replace(/^[-*•]\s+/, '');
      chk(6);
      doc.setFillColor(0, 0, 0); doc.circle(mL + 2, y - 1.5, 0.8, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(40, 40, 40);
      doc.splitTextToSize(txt, uW - 8).forEach(l => { chk(); doc.text(l, mL + 6, y); y += 5; });
      continue;
    }
    if (isSubhead) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(20, 20, 20);
      doc.text(tr, mL, y); y += 5.5; continue;
    }
    doc.setFont('helvetica', isDate ? 'bold' : 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(isDate ? 20 : 45, isDate ? 20 : 45, isDate ? 20 : 45);
    doc.splitTextToSize(tr, uW).forEach(l => { chk(); doc.text(l, mL, y); y += 5; });
  }

  // Pied de page
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.2);
    doc.line(mL, H - 12, W - mR, H - 12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(140, 140, 140);
    if (bourse) doc.text(bourse, mL, H - 7);
    doc.text('Page ' + i + ' / ' + total, W - mR, H - 7, { align: 'right' });
  }
  doc.save(filename + '.pdf');
}

// ── generateLM ────────────────────────────────────────────────────────────────
async function generateLM(rawContent, filename, meta = {}) {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, mL = 25, mR = 25, mT = 30, mB = 22, uW = 160;
  let y = mT;
  const chk = (h = 6) => { if (y + h > H - mB) { doc.addPage(); y = mT; } };
  const clean = (rawContent || '')
    .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,4}\s+/gm, '').replace(/[þãØÜÄ]/g, '')
    .replace(/\n{3,}/g, '\n\n').trim();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(0, 0, 0);
  doc.text((meta.name || '').toUpperCase(), mL, y); y += 7;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
  doc.text([meta.email, meta.phone].filter(Boolean).join('   |   '), mL, y); y += 5;
  doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.5); doc.line(mL, y, W - mR, y); y += 8;
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(60, 60, 60);
  doc.text(today, W - mR, y, { align: 'right' }); y += 12;

  for (const line of clean.split('\n')) {
    const tr = line.trim();
    if (!tr) { y += 4; continue; }
    chk(7);
    if (/^---+$/.test(tr)) {
      doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.2);
      doc.line(mL, y, W - mR, y); y += 5; continue;
    }
    if (/^(objet|madame|monsieur)/i.test(tr)) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(0, 0, 0);
      doc.splitTextToSize(tr, uW).forEach(l => { chk(); doc.text(l, mL, y); y += 6; });
      y += 2; continue;
    }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(40, 40, 40);
    doc.splitTextToSize(tr, uW).forEach(l => { chk(); doc.text(l, mL, y); y += 6; });
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(150, 150, 150);
    doc.text('Page ' + i + ' / ' + total, W / 2, H - 8, { align: 'center' });
  }
  doc.save(filename + '.pdf');
}

// ── checkProfile ──────────────────────────────────────────────────────────────
function checkProfile(user) {
  if (!user) return { ok: false, missing: ['Connexion requise'] };
  const m = [];
  if (!user.name)                          m.push('Nom complet');
  if (!user.currentLevel && !user.niveau)  m.push("Niveau d'études");
  if (!user.fieldOfStudy && !user.domaine) m.push("Domaine d'études");
  if (!user.institution)                   m.push('Institution');
  if (!user.motivationSummary)             m.push('Résumé de motivation');
  if (!user.academicHistory?.length)       m.push('Historique académique');
  return { ok: m.length === 0, missing: m };
}

// ── callN8N ───────────────────────────────────────────────────────────────────
async function callN8N(context, payload) {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, context }),
    signal: AbortSignal.timeout(90000),
  });
  const d = await res.json();
  return d.output || d.text || d.message || '';
}

// ── ScoreRing ─────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  if (!score) return null;
  const r = 36, c = 2 * Math.PI * r;
  const col = score >= 80 ? '#166534' : score >= 60 ? '#1e40af' : '#9ca3af';
  return (
    <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
      <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={col} strokeWidth="7"
          strokeDasharray={c} strokeDashoffset={c - (score / 100) * c}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset .8s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: col, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>/100</span>
      </div>
    </div>
  );
}

function CheckItem({ item }) {
  const cfg = { ok: { c: '#059669', bg: '#ecfdf5', i: '✓' }, warning: { c: '#d97706', bg: '#fffbeb', i: '!' }, error: { c: '#dc2626', bg: '#fef2f2', i: '✕' } }[item.status] || { c: '#6b7280', bg: '#f9fafb', i: '?' };
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: cfg.bg, border: `1px solid ${cfg.c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: cfg.c }}>{cfg.i}</span>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{item.title}</div>
        {item.detail && <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{item.detail}</div>}
      </div>
    </div>
  );
}

function BourseSelector({ bourses, selected, onSelect }) {
  const sel = bourses.find(b => b.nom === selected);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 12, color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bourse cible</label>
      <select value={selected} onChange={e => onSelect(e.target.value)}
        style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', color: selected ? '#111827' : '#9ca3af', fontSize: 14, outline: 'none', cursor: 'pointer' }}>
        <option value="">-- Sélectionner une bourse --</option>
        {bourses.map((b, i) => <option key={i} value={b.nom}>{b.nom}{b.pays ? ` · ${b.pays}` : ''}</option>)}
      </select>
      {sel?.url && (
        <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>🔗</span>
          <a href={sel.url} target="_blank" rel="noopener noreferrer"
            style={{ color: '#2563eb', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{sel.url}</a>
        </div>
      )}
      {selected && <div style={{ fontSize: 12, color: '#059669', fontStyle: 'italic' }}>L'IA consultera le site officiel pour personnaliser votre document</div>}
    </div>
  );
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────────────────────
export default function CVPage({ user, setView }) {
  const [tab,      setTab]      = useState('cv');
  const [mode,     setMode]     = useState('menu');
  const [bourse,   setBourse]   = useState('');
  const [bourses,  setBourses]  = useState([]);
  const [content,  setContent]  = useState('');
  const [improved, setImproved] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [step,     setStep]     = useState('');
  const [fileName, setFileName] = useState(null);
  const fileRef = useRef(null);

  const docType = tab === 'cv' ? 'CV' : 'Lettre de motivation';
  const selB    = bourses.find(b => b.nom === bourse);
  const pCheck  = checkProfile(user);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_BASE}/users/${user.id}?depth=0`)
      .then(r => r.json()).then(d => setBourses(d.bourses_choisies || [])).catch(() => {});
  }, [user?.id]);

  const reset = () => {
    setMode('menu'); setContent(''); setImproved('');
    setAnalysis(null); setFileName(null); setStep('');
  };

  // ── Créer ─────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!pCheck.ok) { setMode('incomplete'); return; }
    if (!bourse) { alert('Sélectionnez une bourse'); return; }
    setMode('loading'); setStep('Lecture du profil...');
    const steps = ['Lecture du profil...', selB?.url ? `Analyse du site de "${bourse}"...` : 'Preparation...', 'Redaction personnalisee...', 'Adaptation aux criteres...', 'Finalisation...'];
    let si = 0;
    const t = setInterval(() => { si = Math.min(si + 1, steps.length - 1); setStep(steps[si]); }, 4000);
    try {
      const r = await callN8N(tab === 'cv' ? 'generate_cv' : 'generate_lm', {
        text: tab === 'cv'
          ? buildCVPrompt(user, bourse, selB)
          : buildLMPrompt(user, bourse, selB),
        id: user.id, email: user.email,
        conversationId: tab + '-' + Date.now(),
      });
      clearInterval(t); setContent(r || ''); setMode('created');
    } catch (e) { clearInterval(t); setStep('Erreur n8n'); console.error(e); }
  };

  // ── Upload PDF — extraction automatique du texte ───────────────────
  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isTxt = file.type === 'text/plain'       || file.name.toLowerCase().endsWith('.txt');

    if (isPdf) {
      setMode('loading'); setStep('Extraction du texte du PDF...');
      try {
        const text = await extractPdfText(file);
        if (text && text.trim().length > 50) {
          setContent(text.slice(0, 15000));
          setStep('');
          setMode('upload');
        } else {
          setStep('');
          setMode('pdf_scan');   // PDF scanné sans texte extractible
        }
      } catch (e) {
        console.error('Erreur PDF:', e);
        setStep('');
        setMode('pdf_scan');
      }
    } else if (isTxt) {
      const text = await file.text();
      setContent(text.slice(0, 15000));
      setMode('upload');
    } else {
      // DOCX etc. — demander de coller
      setMode('pdf_scan');
    }
  };

  // ── Analyser ──────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setMode('loading'); setStep(bourse ? `Comparaison avec "${bourse}"...` : 'Analyse en cours...');
    try {
      const raw = await callN8N('CV_ANALYSIS', {
        text: `Analyse ce ${docType}${bourse ? ` pour la bourse "${bourse}"` : ''}.
${selB?.url ? `Consulte le site officiel : ${selB.url} pour verifier les exigences.` : ''}

Retourne UNIQUEMENT ce JSON sans markdown :
{"score":number,"checklist":[{"title":string,"status":"ok"|"warning"|"error","detail":string}],"strengths":[string],"toFix":[string],"toAdd":[string],"toRemove":[string],"conclusion":string}

${docType} a analyser :
${content}`,
        id: user?.id || null,
        bourse: { nom: selB?.nom || bourse || '', url: selB?.url || '' },
        conversationId: 'analysis-' + Date.now(),
      });
      try {
        const m = raw.match(/\{[\s\S]*\}/);
        setAnalysis(m ? JSON.parse(m[0]) : { score: 0, conclusion: raw, checklist: [], strengths: [], toFix: [], toAdd: [], toRemove: [] });
      } catch {
        setAnalysis({ score: 0, conclusion: raw, checklist: [], strengths: [], toFix: [], toAdd: [], toRemove: [] });
      }
      setMode('analyzed');
    } catch (e) { console.error(e); setMode('upload'); }
  };

  // ── Améliorer ─────────────────────────────────────────────────────
  const handleImprove = async () => {
    if (!analysis) return;
    setMode('loading'); setStep('Amelioration automatique...');
    try {
      const r = await callN8N(tab === 'cv' ? 'generate_cv' : 'generate_lm', {
        text: `Ameliore ce ${docType} en appliquant les corrections suivantes.
A corriger : ${analysis.toFix?.map(x => '- ' + x).join('\n') || ''}
A ajouter  : ${analysis.toAdd?.map(x => '- ' + x).join('\n') || ''}
A supprimer: ${analysis.toRemove?.map(x => '- ' + x).join('\n') || ''}
Document original :
${content}`,
        id: user?.id || null,
        bourse: { nom: selB?.nom || bourse || '', url: selB?.url || '' },
        conversationId: 'improve-' + Date.now(),
      });
      setImproved(r || ''); setMode('analyzed');
    } catch (e) { console.error(e); setMode('analyzed'); }
  };

  // ── Télécharger PDF ───────────────────────────────────────────────
  const dlPDF = async (text, suffix = '') => {
    const safe = ((tab === 'cv' ? 'CV' : 'LM') + '_' + (bourse || 'OppsTrack') + suffix).replace(/[^a-zA-Z0-9_-]/g, '_');
    if (tab === 'cv') {
      await generateCV(text, user, bourse, safe);
    } else {
      await generateLM(text, safe, { name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
    }
  };

  const C = {
    card: { padding: '24px', borderRadius: 20, background: '#fff', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 14 },
    btnP: { padding: '11px 22px', borderRadius: 40, border: 'none', background: '#111827', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    btnO: { padding: '10px 18px', borderRadius: 40, background: '#fff', border: '1px solid #e5e7eb', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' },
    btnG: { padding: '11px 22px', borderRadius: 40, border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  };

  return (
    <div style={{ width: '100%', padding: '28px 24px', fontFamily: 'system-ui,-apple-system,sans-serif', color: '#111827', maxWidth: 1200, margin: '0 auto', background: '#f8fafc', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>CV & Lettre de motivation</h2>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>Documents personnalisés par bourse · PDF professionnel téléchargeable</p>
        </div>
        {mode !== 'menu' && <button style={C.btnO} onClick={reset}>← Retour</button>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#f1f5f9', padding: 4, borderRadius: 14, width: 'fit-content' }}>
        {[{ id: 'cv', l: 'CV' }, { id: 'lm', l: 'Lettre de motivation' }].map(t => (
          <button key={t.id}
            style={{ padding: '8px 22px', borderRadius: 10, border: 'none', background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? '#111827' : '#64748b', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}
            onClick={() => { setTab(t.id); reset(); }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* PROFIL INCOMPLET */}
      {mode === 'incomplete' && (
        <div style={{ ...C.card, maxWidth: 440, margin: '40px auto', textAlign: 'center', alignItems: 'center', padding: 36 }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Profil incomplet</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>Complétez votre profil pour générer un document personnalisé.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            {pCheck.missing.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
                <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 12 }}>✕</span>
                <span style={{ fontSize: 13, color: '#991b1b' }}>{m}</span>
              </div>
            ))}
          </div>
          <button style={C.btnP} onClick={() => setView && setView('profil')}>Compléter mon profil</button>
        </div>
      )}

      {/* MENU */}
      {mode === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={C.card}>
            <BourseSelector bourses={bourses} selected={bourse} onSelect={setBourse} />
            {!bourses.length && user?.id && (
              <div style={{ fontSize: 12, color: '#92400e', padding: '10px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>
                Aucune bourse dans votre liste — ajoutez-en depuis la page Bourses.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Créer */}
            <div style={C.card}>
              <div style={{ fontSize: 32 }}>✨</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Créer avec l'IA</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, flex: 1 }}>
                L'IA lit votre profil complet et génère un {docType} personnalisé
                {bourse ? ` pour "${bourse}"` : ''}
                {selB?.url ? ' en consultant le site officiel.' : '.'}
              </div>
              {!user && <div style={{ fontSize: 12, color: '#92400e', padding: '8px 12px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>Connectez-vous d'abord</div>}
              {user && !pCheck.ok && <div style={{ fontSize: 12, color: '#92400e', padding: '8px 12px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>{pCheck.missing.length} information{pCheck.missing.length > 1 ? 's' : ''} manquante{pCheck.missing.length > 1 ? 's' : ''}</div>}
              <button style={{ ...C.btnP, opacity: (!user || !bourse) ? 0.45 : 1 }} disabled={!user || !bourse} onClick={handleCreate}>
                Générer mon {docType}
              </button>
            </div>

            {/* Analyser */}
            <div style={C.card}>
              <div style={{ fontSize: 32 }}>🔍</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Analyser & améliorer</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, flex: 1 }}>
                Uploadez votre {docType} — le texte est extrait automatiquement du PDF.
                L'IA l'analyse{bourse ? ` selon les critères de "${bourse}"` : ''} et peut l'améliorer.
              </div>
              <div
                style={{ border: '2px dashed #e2e8f0', borderRadius: 14, padding: 22, textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: '#f8fafc' }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}>
                <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".pdf,.txt"
                  onChange={e => handleFile(e.target.files[0])} />
                {fileName
                  ? <><span style={{ fontSize: 24 }}>📄</span><span style={{ color: '#059669', fontSize: 13, fontWeight: 600 }}>✅ {fileName}</span><span style={{ fontSize: 11, color: '#64748b' }}>Texte extrait automatiquement</span></>
                  : <><span style={{ fontSize: 28 }}>📁</span><span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Glissez votre PDF ici ou cliquez</span><span style={{ fontSize: 11, color: '#94a3b8' }}>Le texte est extrait automatiquement · PDF · TXT</span></>
                }
              </div>
              <button style={C.btnO} onClick={() => setMode('upload')}>Coller le texte manuellement</button>
            </div>
          </div>
        </div>
      )}

      {/* PDF SCANNÉ — impossible d'extraire */}
      {mode === 'pdf_scan' && (
        <div style={{ ...C.card, maxWidth: 540, margin: '0 auto' }}>
          <div style={{ fontSize: 36, textAlign: 'center' }}>🖼️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>
            PDF scanné ou DOCX détecté
          </div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
            Ce fichier ne contient pas de texte extractible directement (PDF image/scanné ou DOCX).<br />
            Collez le texte de votre {docType} ci-dessous pour continuer l'analyse.
          </div>
          <BourseSelector bourses={bourses} selected={bourse} onSelect={setBourse} />
          <textarea
            style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.65, outline: 'none', resize: 'vertical', boxSizing: 'border-box', minHeight: 280 }}
            value={content} onChange={e => setContent(e.target.value)}
            placeholder={`Collez le texte de votre ${docType} ici...`} rows={14} />
          <button style={{ ...C.btnP, opacity: content.trim() ? 1 : 0.45 }} disabled={!content.trim()} onClick={handleAnalyze}>
            Analyser{bourse ? ` pour "${bourse}"` : ''}
          </button>
        </div>
      )}

      {/* UPLOAD — texte extrait ou collé */}
      {mode === 'upload' && (
        <div style={C.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
              {fileName ? `📄 ${fileName}` : `Votre ${docType}`}{bourse ? ` — ${bourse}` : ''}
            </div>
            {fileName && <span style={{ fontSize: 11, color: '#059669', fontWeight: 500 }}>✅ Texte extrait du PDF</span>}
          </div>
          <BourseSelector bourses={bourses} selected={bourse} onSelect={setBourse} />
          <textarea
            style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.65, outline: 'none', resize: 'vertical', boxSizing: 'border-box', minHeight: 360 }}
            value={content} onChange={e => setContent(e.target.value)}
            placeholder={`Contenu de votre ${docType}...`} rows={18} />
          <button style={{ ...C.btnP, opacity: content.trim() ? 1 : 0.45 }} disabled={!content.trim()} onClick={handleAnalyze}>
            Analyser{bourse ? ` pour "${bourse}"` : ''}
          </button>
        </div>
      )}

      {/* LOADING */}
      {mode === 'loading' && (
        <div style={{ ...C.card, alignItems: 'center', padding: '72px 24px', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#111827', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{step || 'Traitement...'}</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Cela peut prendre 15 à 30 secondes</div>
        </div>
      )}

      {/* RÉSULTAT CRÉATION */}
      {mode === 'created' && content && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ ...C.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{docType} généré ✅</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{bourse} · {content.split(/\s+/).filter(Boolean).length} mots</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={C.btnO} onClick={() => setMode('upload')}>Modifier & analyser</button>
              <button style={C.btnP} onClick={() => dlPDF(content)}>Télécharger PDF</button>
            </div>
          </div>
          <div style={{ ...C.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#f8fafc' }}>Aperçu</div>
            <div style={{ padding: 20, fontSize: 13, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: 420, overflowY: 'auto' }}>{content}</div>
          </div>
          <div style={{ ...C.card, background: '#f0fdf4', border: '1px solid #bbf7d0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>Analyser ce document ?</div>
              <div style={{ fontSize: 13, color: '#4b5563' }}>L'IA vérifie la compatibilité avec les critères de {bourse}.</div>
            </div>
            <button style={C.btnG} onClick={handleAnalyze}>Analyser maintenant</button>
          </div>
        </div>
      )}

      {/* RÉSULTAT ANALYSE */}
      {mode === 'analyzed' && analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ ...C.card, flexDirection: 'row', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <ScoreRing score={analysis.score} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Analyse de votre {docType}</div>
              {bourse && <div style={{ fontSize: 12, color: '#4f46e5', marginTop: 2, fontWeight: 500 }}>Évalué selon les critères de {bourse}</div>}
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 5 }}>
                {analysis.score >= 80 ? '🎉 Excellent — prêt à soumettre !' : analysis.score >= 60 ? '👍 Bon niveau — quelques ajustements' : '⚠️ Des améliorations nécessaires'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!improved && <button style={C.btnP} onClick={handleImprove}>Améliorer automatiquement</button>}
              {improved && <button style={C.btnG} onClick={() => dlPDF(improved, '_v2')}>Télécharger version améliorée</button>}
              <button style={C.btnO} onClick={() => dlPDF(content)}>Télécharger original</button>
            </div>
          </div>

          {improved && (
            <div style={{ ...C.card, border: '1.5px solid #059669', background: '#f0fdf4' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Version améliorée</div>
              <div style={{ fontSize: 13, color: '#1e3a2f', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: 360, overflowY: 'auto', padding: 14, borderRadius: 10, background: '#fff', border: '1px solid #d1fae5' }}>{improved}</div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {analysis.checklist?.length > 0 && (
              <div style={C.card}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Checklist{bourse ? ` — ${bourse}` : ''}</div>
                {analysis.checklist.map((item, i) => <CheckItem key={i} item={item} />)}
              </div>
            )}
            {analysis.conclusion && (
              <div style={{ ...C.card, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Conclusion de l'IA</div>
                <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, margin: 0 }}>{analysis.conclusion}</p>
              </div>
            )}
            {analysis.strengths?.length > 0 && (
              <div style={{ ...C.card, border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Points forts</div>
                {analysis.strengths.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: '1px solid #f0fdf4', fontSize: 13, color: '#166534', alignItems: 'flex-start' }}>
                    <span style={{ color: '#059669', fontWeight: 700, flexShrink: 0 }}>✓</span><span>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {analysis.toFix?.length > 0 && (
              <div style={{ ...C.card, border: '1px solid #fed7aa' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.08em' }}>À corriger</div>
                {analysis.toFix.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: '1px solid #fffbeb', fontSize: 13, color: '#92400e', alignItems: 'flex-start' }}>
                    <span style={{ color: '#d97706', fontWeight: 700, flexShrink: 0 }}>→</span><span>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {analysis.toAdd?.length > 0 && (
              <div style={{ ...C.card, border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em' }}>À ajouter</div>
                {analysis.toAdd.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: '1px solid #eff6ff', fontSize: 13, color: '#1e40af', alignItems: 'flex-start' }}>
                    <span style={{ color: '#2563eb', fontWeight: 700, flexShrink: 0 }}>+</span><span>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {analysis.toRemove?.length > 0 && (
              <div style={{ ...C.card, border: '1px solid #fecaca' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em' }}>À supprimer</div>
                {analysis.toRemove.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: '1px solid #fef2f2', fontSize: 13, color: '#991b1b', alignItems: 'flex-start' }}>
                    <span style={{ color: '#dc2626', fontWeight: 700, flexShrink: 0 }}>✕</span><span>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>
    </div>
  );
}

// ── Prompts ───────────────────────────────────────────────────────────────────
function buildCVPrompt(user, bourse, selB) {
  return `Tu es un expert RH et redacteur de CV academiques pour bourses internationales.

Redige un CV COMPLET, PROFESSIONNEL et BIEN STRUCTURE pour la bourse "${bourse}" (${selB?.pays || ''}).

DONNEES REELLES DU CANDIDAT :
- Nom : ${user.name || ''}
- Email : ${user.email || ''} | Tel : ${user.phone || ''}
- Nationalite : ${user.nationality || ''} | Pays : ${user.countryOfResidence || user.pays || ''}
- Niveau : ${user.currentLevel || user.niveau || ''} | Domaine : ${user.fieldOfStudy || user.domaine || ''}
- Institution : ${user.institution || ''} | GPA : ${user.gpa || ''}/20
- Diplome vise : ${user.targetDegree || ''} | Annee diplome : ${user.graduationYear || ''}
- Motivation : ${user.motivationSummary || ''}
- LinkedIn : ${user.linkedin || ''} | GitHub : ${user.github || ''} | Portfolio : ${user.portfolio || ''}

FORMATION :
${(user.academicHistory || []).map(h => `- ${h.degree} en ${h.field} - ${h.institution} (${h.year}) | ${h.grade}`).join('\n') || 'Non renseignee'}

EXPERIENCES :
${(user.workExperience || []).map(w => `- ${w.position} chez ${w.company}${w.city ? ', ' + w.city : ''} (${(w.startDate || '').slice(0, 7)} - ${(w.endDate || '').slice(0, 7)})\n  Type : ${w.type || ''} | Description : ${w.description || 'a enrichir'} | Tech : ${w.technologies || ''}`).join('\n') || 'Non renseignee'}

PROJETS ACADEMIQUES :
${(user.academicProjects || []).map(p => `- ${p.title} (${p.type || ''}, ${p.year || ''})\n  ${p.description || ''} | Tech : ${p.technologies || ''} | Impact : ${p.impact || ''}`).join('\n') || 'Non renseignes'}

BENEVOLAT :
${(user.volunteerWork || []).map(v => `- ${v.role} - ${v.organization} (${v.startDate || ''} - ${v.endDate || ''})\n  ${v.description || ''}`).join('\n') || 'Non renseigne'}

COMPETENCES : ${(user.skills || []).map(s => `${s.skill} (${s.level || ''})`).join(', ') || 'Non renseignees'}
LANGUES : ${(user.languages || []).map(l => `${l.language} ${l.level}${l.certificate ? ' - ' + l.certificate : ''}`).join(', ') || 'Non renseignees'}
CERTIFICATIONS : ${(user.certifications || []).map(c => `${c.name} - ${c.issuer || ''} (${c.date || ''})`).join(', ') || 'Aucune'}
DISTINCTIONS : ${(user.awards || []).map(a => `${a.title} - ${a.organization || ''} (${a.year || ''})`).join(', ') || 'Aucune'}
PUBLICATIONS : ${(user.publications || []).map(p => `${p.title} - ${p.venue || ''} (${p.year || ''})`).join(', ') || 'Aucune'}

Site officiel a consulter : ${selB?.url || 'non disponible'}

INSTRUCTIONS :
1. Formule chaque section de facon PROFESSIONNELLE et CONVAINCANTE pour "${bourse}"
2. RESUME : 3-4 phrases percutantes basees sur le vrai profil
3. EXPERIENCES : si description vide, enrichis avec missions realistes selon le poste
4. PROJETS : developpe avec apports techniques et impact concret
5. Texte brut UNIQUEMENT - pas de **, pas de #, pas de tableaux
6. Sections en MAJUSCULES separees par ---
7. JAMAIS de placeholder [xxx]

FORMAT :
RESUME PROFESSIONNEL
---
FORMATION ACADEMIQUE
---
EXPERIENCES PROFESSIONNELLES
---
PROJETS ACADEMIQUES
---
COMPETENCES TECHNIQUES
---
LANGUES
---
CERTIFICATIONS
---
BENEVOLAT ET ENGAGEMENT
---
DISTINCTIONS ET PRIX`;
}

function buildLMPrompt(user, bourse, selB) {
  return `Tu es expert en lettres de motivation pour bourses universitaires.

Redige une LETTRE DE MOTIVATION COMPLETE et PROFESSIONNELLE pour la bourse "${bourse}" (${selB?.pays || ''}).

DONNEES DU CANDIDAT :
- Nom : ${user.name || ''} | Email : ${user.email || ''}
- Niveau : ${user.currentLevel || user.niveau || ''} | Domaine : ${user.fieldOfStudy || user.domaine || ''}
- Institution : ${user.institution || ''} | GPA : ${user.gpa || ''}/20
- Diplome vise : ${user.targetDegree || ''}
- Motivation : ${user.motivationSummary || ''}
- Formation : ${(user.academicHistory || []).map(h => `${h.degree} en ${h.field} - ${h.institution} (${h.year})`).join(' | ') || ''}
- Experiences : ${(user.workExperience || []).map(w => `${w.position} chez ${w.company}`).join(' | ') || ''}
- Projets : ${(user.academicProjects || []).map(p => p.title).join(' | ') || ''}
- Competences : ${(user.skills || []).map(s => s.skill).join(', ') || ''}
- Langues : ${(user.languages || []).map(l => `${l.language} ${l.level}`).join(', ') || ''}

Site officiel : ${selB?.url || 'non disponible'}

STRUCTURE (500 mots minimum, texte brut, pas de ** ni #) :
Lieu, Date
Objet : Candidature a la Bourse ${bourse}
Madame, Monsieur,
P1 - Accroche : qui tu es, niveau, institution, candidature a ${bourse}
P2 - Parcours academique et resultats concrets
P3 - Experiences, projets et competences en lien avec ${bourse}
P4 - Motivation SPECIFIQUE pour ${bourse} et projet concret
P5 - Valeur ajoutee apportee
P6 - Conclusion et formule de politesse complete`;
}