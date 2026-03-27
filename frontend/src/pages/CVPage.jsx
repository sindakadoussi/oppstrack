import React, { useState, useRef, useEffect } from 'react';

const WEBHOOK_URL = 'http://localhost:5678/webhook-test/webhook';
const API_BASE    = 'http://localhost:3000/api';

// -- jsPDF ---------------------------------------------------------------------
function loadJsPDF() {
  return new Promise(resolve => {
    if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => resolve(window.jspdf.jsPDF);
    document.head.appendChild(s);
  });
}

// -- CV Deux colonnes pro -------------------------------------------------------
async function generateCV(aiContent, user, bourse, filename) {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, mL = 20, mR = 20, mT = 25, mB = 18, uW = 170;
  let y = mT;

  const chk = (h = 6) => { if (y + h > H - mB) { doc.addPage(); y = mT; } };

  const nom = (user.name || '').trim().toUpperCase();
  const titre = [user.currentLevel || user.niveau || '', user.fieldOfStudy || user.domaine || ''].filter(Boolean).join(' - ');
  const contacts = [user.email, user.phone, user.countryOfResidence || user.pays, user.nationality].filter(Boolean).join('   |   ');
  const links = [user.linkedin, user.github, user.portfolio].filter(Boolean).join('   |   ');

  // ── EN-TÊTE ───────────────────────────────────────────────────────
  // Nom
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text(nom, W / 2, y, { align: 'center' });
  y += 8;

  // Trait sous le nom
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(mL, y, W - mR, y);
  y += 5;

  // Titre professionnel
  if (titre) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(titre, W / 2, y, { align: 'center' });
    y += 5;
  }

  // Contacts
  if (contacts) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(contacts, W / 2, y, { align: 'center' });
    y += 4.5;
  }

  // Liens
  if (links) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(links, W / 2, y, { align: 'center' });
    y += 4.5;
  }

  // Trait bas header
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(mL, y, W - mR, y);
  y += 7;

  // ── CONTENU IA ────────────────────────────────────────────────────
  const lines = (aiContent || '').split('\n');

  for (const line of lines) {
    const tr = line.trim();
    if (!tr) { y += 2.5; continue; }

    const isSep     = /^[-=]{3,}$/.test(tr);
    const isSection = /^[A-ZAÀÂÉÈÊÎÏÔÙÛÜ\s]{4,}$/.test(tr) && tr.length > 3 && tr.length < 50;
    const isBullet  = /^[-*•]\s/.test(tr);
    const isDate    = /^\d{4}/.test(tr) || /\d{4}\s*[-–]\s*(\d{4}|present|en cours)/i.test(tr);
    const isSubhead = /^[A-Z][^.!?]{2,40}:$/.test(tr);

    chk(isSection ? 14 : 6);

    if (isSep) {
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.2);
      doc.line(mL, y, W - mR, y);
      y += 4;
      continue;
    }

    if (isSection) {
      y += 3;
      // Fond gris très léger
      doc.setFillColor(245, 245, 245);
      doc.rect(mL, y - 4, uW, 9, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(tr, mL + 3, y + 1.5);
      y += 9;
      // Trait sous section
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(mL, y - 1, W - mR, y - 1);
      y += 3;
      continue;
    }

    if (isBullet) {
      const txt = tr.replace(/^[-*•]\s+/, '');
      chk(6);
      doc.setFillColor(0, 0, 0);
      doc.circle(mL + 2, y - 1.5, 0.8, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(40, 40, 40);
      doc.splitTextToSize(txt, uW - 8).forEach(l => { chk(); doc.text(l, mL + 6, y); y += 5; });
      continue;
    }

    if (isSubhead) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(20, 20, 20);
      doc.text(tr, mL, y);
      y += 5.5;
      continue;
    }

    // Ligne normale
    doc.setFont('helvetica', isDate ? 'bold' : 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(isDate ? 20 : 45, isDate ? 20 : 45, isDate ? 20 : 45);
    doc.splitTextToSize(tr, uW).forEach(l => { chk(); doc.text(l, mL, y); y += 5; });
  }

  // ── PIED DE PAGE ──────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.line(mL, H - 12, W - mR, H - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    if (bourse) doc.text(bourse, mL, H - 7);
    doc.text('Page ' + i + ' / ' + total, W - mR, H - 7, { align: 'right' });
  }

  doc.save(filename + '.pdf');
}

async function generateLM(rawContent, filename, meta = {}) {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, mL = 25, mR = 25, mT = 30, mB = 22, uW = 160;
  let y = mT;

  const chk = (h = 6) => { if (y + h > H - mB) { doc.addPage(); y = mT; } };

  const clean = (rawContent || '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/[þãØÜÄ]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // En-tête lettre
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(0, 0, 0);
  doc.text((meta.name || '').toUpperCase(), mL, y); y += 7;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
  doc.text([meta.email, meta.phone].filter(Boolean).join('   |   '), mL, y); y += 5;
  doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.5);
  doc.line(mL, y, W - mR, y); y += 8;

  // Date
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(60, 60, 60);
  doc.text(today, W - mR, y, { align: 'right' }); y += 12;

  for (const line of clean.split('\n')) {
    const tr = line.trim();
    if (!tr) { y += 4; continue; }
    const isSep   = /^---+$/.test(tr);
    const isObjet = /^(objet|madame|monsieur)/i.test(tr);
    chk(7);
    if (isSep) {
      doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.2);
      doc.line(mL, y, W - mR, y); y += 5; continue;
    }
    if (isObjet) {
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



function checkProfile(user) {
  if (!user) return { ok: false, missing: ['Connexion requise'] };
  const m = [];
  if (!user.name)                        m.push('Nom complet');
  if (!user.currentLevel && !user.niveau) m.push("Niveau d'études");
  if (!user.fieldOfStudy && !user.domaine) m.push("Domaine d'études");
  if (!user.institution)                 m.push('Institution');
  if (!user.motivationSummary)           m.push('Résumé de motivation');
  if (!user.academicHistory?.length)     m.push('Historique académique');
  return { ok: m.length === 0, missing: m };
}

// -- Appel n8n -----------------------------------------------------------------
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

// -- UI Components -------------------------------------------------------------
function ScoreRing({ score }) {
  if (!score) return null;
  const r = 36, c = 2 * Math.PI * r;
  const col = score >= 80 ? '#1e3a8a' : score >= 60 ? '#3b82f6' : '#9ca3af';
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
  const cfg = {
    ok:      { c: '#059669', bg: '#ecfdf5', i: '✓' },
    warning: { c: '#d97706', bg: '#fffbeb', i: '!' },
    error:   { c: '#dc2626', bg: '#fef2f2', i: '✕' },
  }[item.status] || { c: '#6b7280', bg: '#f9fafb', i: '?' };
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
        {bourses.map((b, i) => <option key={i} value={b.nom}>{b.nom}{b.pays ? ` . ${b.pays}` : ''}</option>)}
      </select>
      {sel?.url && (
        <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>🔗</span>
          <a href={sel.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{sel.url}</a>
        </div>
      )}
      {selected && <div style={{ fontSize: 12, color: '#059669', fontStyle: 'italic' }}>L'IA consultera le site officiel pour personnaliser votre document</div>}
    </div>
  );
}

// -- Page ---------------------------------------------------------------------
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
    fetch(`${API_BASE}/users/${user.id}?depth=0`).then(r => r.json()).then(d => setBourses(d.bourses_choisies || [])).catch(() => {});
  }, [user?.id]);

  const reset = () => { setMode('menu'); setContent(''); setImproved(''); setAnalysis(null); setFileName(null); setStep(''); };

  const handleCreate = async () => {
    if (!pCheck.ok) { setMode('incomplete'); return; }
    if (!bourse)    { alert('Sélectionnez une bourse'); return; }
    setMode('loading'); setStep('Lecture du profil…');
    const steps = ['Lecture du profil…', selB?.url ? `Analyse du site de "${bourse}"…` : 'Préparation…', 'Rédaction personnalisée…', 'Adaptation aux critères…', 'Finalisation…'];
    let si = 0;
    const t = setInterval(() => { si = Math.min(si + 1, steps.length - 1); setStep(steps[si]); }, 4000);
    try {
      const r = await callN8N(tab === 'cv' ? 'generate_cv' : 'generate_lm', {
        text: tab === 'cv' ? `Tu es un expert RH et rédacteur de CV académiques pour bourses internationales.

Rédige un CV COMPLET, PROFESSIONNEL et BIEN STRUCTURÉ pour la bourse "${bourse}" (${selB?.pays||''}).

DONNÉES RÉELLES DU CANDIDAT (utilise TOUT ce qui est disponible) :
- Nom : ${user.name || ''}
- Email : ${user.email || ''} | Tel : ${user.phone || ''}
- Nationalité : ${user.nationality || ''} | Pays : ${user.countryOfResidence || user.pays || ''}
- Niveau : ${user.currentLevel || user.niveau || ''} | Domaine : ${user.fieldOfStudy || user.domaine || ''}
- Institution : ${user.institution || ''} | GPA/Moyenne : ${user.gpa || ''}/20
- Diplôme visé : ${user.targetDegree || ''} | Année diplôme : ${user.graduationYear || ''}
- Motivation : ${user.motivationSummary || ''}
- LinkedIn : ${user.linkedin || ''} | GitHub : ${user.github || ''} | Portfolio : ${user.portfolio || ''}

FORMATION ACADÉMIQUE :
${(user.academicHistory||[]).map(h => `  - ${h.degree} en ${h.field} — ${h.institution} (${h.year}) | Mention : ${h.grade}`).join('\n') || '  Non renseignée'}

EXPÉRIENCES PROFESSIONNELLES :
${(user.workExperience||[]).map(w => `  - ${w.position} chez ${w.company}${w.city ? ', '+w.city : ''} (${(w.startDate||'').slice(0,7)} - ${(w.endDate||'').slice(0,7)})\n    Type : ${w.type || ''}\n    Description : ${w.description || 'à enrichir'}\n    Technologies : ${w.technologies || ''}`).join('\n') || '  Non renseignée'}

PROJETS ACADÉMIQUES :
${(user.academicProjects||[]).map(p => `  - ${p.title} (${p.type || ''}, ${p.year || ''})\n    Encadrant : ${p.supervisor || ''}\n    Description : ${p.description || ''}\n    Technologies : ${p.technologies || ''}\n    Impact : ${p.impact || ''}\n    Lien : ${p.link || ''}`).join('\n') || '  Non renseignés'}

BÉNÉVOLAT & ASSOCIATIONS :
${(user.volunteerWork||[]).map(v => `  - ${v.role} — ${v.organization} (${v.startDate||''} - ${v.endDate||''})\n    ${v.description || ''}`).join('\n') || '  Non renseigné'}

COMPÉTENCES TECHNIQUES :
${(user.skills||[]).map(s => `  - ${s.skill} (${s.level || ''}${s.category ? ', '+s.category : ''})`).join('\n') || '  Non renseignées'}

LANGUES :
${(user.languages||[]).map(l => `  - ${l.language} : ${l.level}${l.certificate ? ' — '+l.certificate : ''}`).join('\n') || '  Non renseignées'}

CERTIFICATIONS :
${(user.certifications||[]).map(c => `  - ${c.name} — ${c.issuer || ''} (${c.date || ''})`).join('\n') || '  Aucune'}

DISTINCTIONS & PRIX :
${(user.awards||[]).map(a => `  - ${a.title} — ${a.organization || ''} (${a.year || ''}) : ${a.description || ''}`).join('\n') || '  Aucune'}

PUBLICATIONS :
${(user.publications||[]).map(p => `  - ${p.title} — ${p.venue || ''} (${p.year || ''})`).join('\n') || '  Aucune'}

INSTRUCTIONS DE RÉDACTION :
1. Formule chaque section de façon PROFESSIONNELLE et CONVAINCANTE pour la bourse "${bourse}"
2. RÉSUMÉ PROFESSIONNEL : 3-4 phrases percutantes qui mettent en valeur le candidat pour cette bourse
3. EXPÉRIENCE : si la description est vide ou courte, enrichis avec des missions réalistes selon le poste
4. PROJETS : développe chaque projet avec ses apports techniques et son impact
5. Adapte le ton et le contenu aux critères de la bourse "${bourse}" (${selB?.pays || 'international'})
6. Si le site est disponible : ${selB?.url || 'non disponible'}, scrape-le pour adapter le CV
7. Texte brut UNIQUEMENT — pas de **, pas de #, pas de tableaux, pas de markdown
8. Sections en MAJUSCULES séparées par ---
9. JAMAIS de placeholder [xxx] ou [à compléter]

FORMAT OBLIGATOIRE :
RÉSUMÉ PROFESSIONNEL
[3-4 phrases basées sur les données réelles, adaptées à ${bourse}]
---
FORMATION ACADÉMIQUE
[Chaque diplôme formaté : Diplôme en Domaine — Institution (Année) | Mention]
---
EXPÉRIENCES PROFESSIONNELLES
[Chaque expérience avec poste, entreprise, dates, missions détaillées]
---
PROJETS ACADÉMIQUES
[Chaque projet avec titre, contexte, technologies, résultats]
---
COMPÉTENCES TECHNIQUES
[Liste organisée par catégorie]
---
LANGUES
[Chaque langue avec niveau et certification]
---
CERTIFICATIONS
[Si disponibles]
---
BÉNÉVOLAT & ENGAGEMENT
[Si disponible]
---
DISTINCTIONS & PRIX
[Si disponibles]`

: `Tu es expert en lettres de motivation pour bourses universitaires.

Rédige une LETTRE DE MOTIVATION COMPLÈTE et PROFESSIONNELLE pour la bourse "${bourse}" (${selB?.pays||''}).

DONNÉES DU CANDIDAT :
- Nom : ${user.name || ''} | Email : ${user.email || ''}
- Niveau : ${user.currentLevel || user.niveau || ''} | Domaine : ${user.fieldOfStudy || user.domaine || ''}
- Institution : ${user.institution || ''} | GPA : ${user.gpa || ''}/20
- Diplôme visé : ${user.targetDegree || ''}
- Motivation : ${user.motivationSummary || ''}
- Formation : ${(user.academicHistory||[]).map(h => `${h.degree} en ${h.field} — ${h.institution} (${h.year})`).join(' | ') || ''}
- Expériences : ${(user.workExperience||[]).map(w => `${w.position} chez ${w.company}`).join(' | ') || ''}
- Projets : ${(user.academicProjects||[]).map(p => p.title).join(' | ') || ''}
- Compétences : ${(user.skills||[]).map(s => s.skill).join(', ') || ''}
- Langues : ${(user.languages||[]).map(l => `${l.language} ${l.level}`).join(', ') || ''}
- Distinctions : ${(user.awards||[]).map(a => a.title).join(', ') || ''}

Site officiel à consulter : ${selB?.url || 'non disponible'}

STRUCTURE OBLIGATOIRE (500 mots minimum, texte brut, pas de ** ni #) :
Lieu, Date
Objet : Candidature à la Bourse ${bourse}
Madame, Monsieur,
[P1 - Accroche : qui tu es, niveau, institution, et ta candidature à ${bourse}]
[P2 - Parcours académique et résultats concrets]
[P3 - Expériences, projets et compétences en lien avec ${bourse}]
[P4 - Motivation SPÉCIFIQUE pour ${bourse} et projet concret à réaliser]
[P5 - Valeur ajoutée que tu apportes]
[P6 - Conclusion et formule de politesse complète]`,
        id: user.id, email: user.email,
        conversationId: tab + '-' + Date.now(),
      });
      clearInterval(t); setContent(r || ''); setMode('created');
    } catch (e) { clearInterval(t); setStep('Erreur n8n'); console.error(e); }
  };

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setMode('loading'); setStep(bourse ? `Comparaison avec "${bourse}"…` : 'Analyse en cours…');
    try {
      const raw = await callN8N('CV_ANALYSIS', {
        text: `Analyse ce ${docType}${bourse ? ` pour "${bourse}"` : ''}.\n${selB?.url ? `Site : ${selB.url}` : ''}
Retourne UNIQUEMENT JSON sans markdown :
{"score":number,"checklist":[{"title":string,"status":"ok"|"warning"|"error","detail":string}],"strengths":[string],"toFix":[string],"toAdd":[string],"toRemove":[string],"conclusion":string}
${docType} : ${content}`,
        id: user?.id || null, bourse: { nom: selB?.nom || bourse || '', url: selB?.url || '' },
        conversationId: `analysis-${Date.now()}`,
      });
      try { const m = raw.match(/\{[\s\S]*\}/); setAnalysis(m ? JSON.parse(m[0]) : { score: 0, conclusion: raw, checklist: [], strengths: [], toFix: [], toAdd: [], toRemove: [] }); }
      catch { setAnalysis({ score: 0, conclusion: raw, checklist: [], strengths: [], toFix: [], toAdd: [], toRemove: [] }); }
      setMode('analyzed');
    } catch (e) { console.error(e); setMode('upload'); }
  };

  const handleImprove = async () => {
    if (!analysis) return;
    setMode('loading'); setStep('Amélioration automatique…');
    try {
      const r = await callN8N(tab === 'cv' ? 'generate_cv' : 'generate_lm', {
        text: `Ameliore ce ${docType}.\nA corriger:\n${analysis.toFix?.map(x => '- ' + x).join('\n') || ''}\nA ajouter:\n${analysis.toAdd?.map(x => '- ' + x).join('\n') || ''}\nOriginal:\n${content}`,
        id: user?.id || null, bourse: { nom: selB?.nom || bourse || '', url: selB?.url || '' },
        conversationId: `improve-${Date.now()}`,
      });
      setImproved(r || ''); setMode('analyzed');
    } catch (e) { console.error(e); setMode('analyzed'); }
  };

  const dlPDF = async (text, suffix = '') => {
    const safe = ((tab === 'cv' ? 'CV' : 'LM') + '_' + (bourse || 'OppsTrack') + suffix).replace(/[^a-zA-Z0-9_-]/g, '_');
    if (tab === 'cv') {
      // generateCV reçoit le contenu formulé par l'IA + les données user pour l'en-tête
      await generateCV(text, user, bourse, safe);
    } else {
      await generateLM(text, safe, { name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const r = new FileReader();
    r.onload = e => setContent(e.target.result?.slice(0, 12000) || '');
    file.type === 'text/plain' || file.name.endsWith('.txt') ? r.readAsText(file) : setContent(`[${file.name}]\nCollez le contenu ici.`);
    setMode('upload');
  };

  const C = {
    card:  { padding: '24px', borderRadius: 20, background: '#fff', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 14 },
    btnP:  { padding: '11px 22px', borderRadius: 40, border: 'none', background: '#111827', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    btnO:  { padding: '10px 18px', borderRadius: 40, background: '#fff', border: '1px solid #e5e7eb', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' },
    btnG:  { padding: '11px 22px', borderRadius: 40, border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  };

  return (
    <div style={{ width: '100%', padding: '28px 24px', fontFamily: "system-ui,-apple-system,sans-serif", color: '#111827', maxWidth: 1200, margin: '0 auto', background: '#f8fafc', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>CV & Lettre de motivation</h2>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>Documents personnalisés par bourse . PDF professionnel téléchargeable</p>
        </div>
        {mode !== 'menu' && <button style={C.btnO} onClick={reset}>← Retour</button>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#f1f5f9', padding: '4px', borderRadius: 14, width: 'fit-content' }}>
        {[{ id: 'cv', l: 'CV' }, { id: 'lm', l: 'Lettre de motivation' }].map(t => (
          <button key={t.id}
            style={{ padding: '8px 22px', borderRadius: 10, border: 'none', background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? '#111827' : '#64748b', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s' }}
            onClick={() => { setTab(t.id); reset(); }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* PROFIL INCOMPLET */}
      {mode === 'incomplete' && (
        <div style={{ ...C.card, maxWidth: 440, margin: '40px auto', textAlign: 'center', alignItems: 'center', padding: '36px' }}>
          <div style={{ fontSize: 40, marginBottom: 4 }}>⚠️</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Profil incomplet</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>Complétez votre profil pour générer un document personnalisé.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 4 }}>
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
                Aucune bourse dans votre liste - ajoutez-en depuis la page Bourses.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Créer */}
            <div style={C.card}>
              <div style={{ fontSize: 32, marginBottom: 4 }}>✨</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Créer avec l'IA</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, flex: 1 }}>
                L'IA lit votre profil complet et génère un {docType} personnalisé
                {bourse ? ` pour "${bourse}"` : ''}
                {selB?.url ? ' en consultant le site officiel de la bourse.' : '.'}
              </div>
              {!user && (
                <div style={{ fontSize: 12, color: '#92400e', padding: '8px 12px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>
                  Connectez-vous d'abord
                </div>
              )}
              {user && !pCheck.ok && (
                <div style={{ fontSize: 12, color: '#92400e', padding: '8px 12px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>
                  {pCheck.missing.length} information{pCheck.missing.length > 1 ? 's' : ''} manquante{pCheck.missing.length > 1 ? 's' : ''} dans votre profil
                </div>
              )}
              <button
                style={{ ...C.btnP, opacity: (!user || !bourse) ? .45 : 1, marginTop: 4 }}
                disabled={!user || !bourse}
                onClick={handleCreate}>
                Générer mon {docType}
              </button>
            </div>

            {/* Analyser */}
            <div style={C.card}>
              <div style={{ fontSize: 32, marginBottom: 4 }}>🔍</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Analyser & améliorer</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, flex: 1 }}>
                Uploadez votre {docType} existant. L'IA l'analyse{bourse ? ` selon les critères de "${bourse}"` : ''},
                vous donne une checklist détaillée et peut l'améliorer automatiquement.
              </div>
              <div
                style={{ border: '2px dashed #e2e8f0', borderRadius: 14, padding: '22px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: '#f8fafc', transition: 'border .15s' }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}>
                <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".pdf,.doc,.docx,.txt" onChange={e => handleFile(e.target.files[0])} />
                {fileName
                  ? <><span style={{ fontSize: 22 }}>📄</span><span style={{ color: '#059669', fontSize: 13, fontWeight: 500 }}>✅ {fileName}</span></>
                  : <><span style={{ fontSize: 26 }}>📁</span><span style={{ color: '#94a3b8', fontSize: 13 }}>Glissez ou cliquez - PDF . TXT . DOCX</span></>
                }
              </div>
              <button style={C.btnO} onClick={() => setMode('upload')}>Coller le texte manuellement</button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD */}
      {mode === 'upload' && (
        <div style={C.card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
            Votre {docType}{bourse ? ` - ${bourse}` : ''}
          </div>
          <BourseSelector bourses={bourses} selected={bourse} onSelect={setBourse} />
          <textarea
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.65, outline: 'none', resize: 'vertical', boxSizing: 'border-box', minHeight: 360 }}
            value={content} onChange={e => setContent(e.target.value)}
            placeholder={`Collez votre ${docType} ici…`} rows={18} />
          <button
            style={{ ...C.btnP, opacity: content.trim() ? 1 : .45 }}
            disabled={!content.trim()}
            onClick={handleAnalyze}>
            Analyser{bourse ? ` pour "${bourse}"` : ''}
          </button>
        </div>
      )}

      {/* LOADING */}
      {mode === 'loading' && (
        <div style={{ ...C.card, alignItems: 'center', padding: '72px 24px', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#111827', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{step || 'Traitement…'}</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Cela peut prendre 15 à 30 secondes</div>
        </div>
      )}

      {/* RÉSULTAT CRÉATION */}
      {mode === 'created' && content && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ ...C.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{docType} généré ✅</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                {bourse} . {content.split(/\s+/).filter(Boolean).length} mots
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={C.btnO} onClick={() => setMode('upload')}>Modifier & analyser</button>
              <button style={C.btnP} onClick={() => dlPDF(content)}>Télécharger PDF</button>
            </div>
          </div>

          <div style={{ ...C.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#f8fafc' }}>
              Aperçu du contenu généré
            </div>
            <div style={{ padding: '20px', fontSize: 13, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: 420, overflowY: 'auto' }}>
              {content}
            </div>
          </div>

          <div style={{ ...C.card, background: '#f0fdf4', border: '1px solid #bbf7d0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>Voulez-vous analyser ce document ?</div>
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
                {analysis.score >= 80 ? '🎉 Excellent - prêt à soumettre !'
                  : analysis.score >= 60 ? '👍 Bon niveau - quelques ajustements recommandés'
                  : '⚠️ Des améliorations sont nécessaires avant soumission'}
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
              <div style={{ fontSize: 13, color: '#1e3a2f', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: 360, overflowY: 'auto', padding: 14, borderRadius: 10, background: '#fff', border: '1px solid #d1fae5' }}>
                {improved}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {analysis.checklist?.length > 0 && (
              <div style={C.card}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Checklist{bourse ? ` - ${bourse}` : ''}
                </div>
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