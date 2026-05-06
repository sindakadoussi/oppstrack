import React, { useState, useRef } from 'react';
import axios from 'axios';
import { downloadCVPDF, downloadLMPDF } from './pdfGenerator';

const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/webhook';

async function callN8N(userId, bourseId, context, extra = {}) {
  const response = await axios.post(N8N_WEBHOOK_URL, {
    userId, bourseId, context,
    timestamp: new Date().toISOString(),
    ...extra,
  }, { headers: { 'Content-Type': 'application/json' }, timeout: 120000 });
  return response.data.output || response.data.message || response.data;
}

// ═══════════════════════════════════════════════════════════════
//  PDF.js extractor
// ═══════════════════════════════════════════════════════════════
const extractPDFText = async (file) => {
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    fullText += tc.items.map(it => it.str).join(' ') + '\n\n';
  }
  return fullText.trim();
};

// ═══════════════════════════════════════════════════════════════
//  PDF download DIRECT — blob + <a> click, aucune fenêtre
// ═══════════════════════════════════════════════════════════════
async function loadHtml2pdf() {
  if (window.html2pdf) return window.html2pdf;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
  return window.html2pdf;
}

async function downloadDirect(htmlContent, filename) {
  const h2p = await loadHtml2pdf();
  const parser = new DOMParser();
  const parsed = parser.parseFromString(htmlContent, 'text/html');

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;left:-99999px;top:0;width:794px;background:white';

  parsed.querySelectorAll('style').forEach(el => {
    const s = document.createElement('style');
    s.textContent = el.textContent.replace(/@import[^;]+;/g, '');
    wrapper.appendChild(s);
  });

  const body = document.createElement('div');
  body.style.cssText = 'padding:16mm 18mm;background:white;font-family:Segoe UI,Arial,sans-serif';
  body.innerHTML = parsed.body.innerHTML;
  wrapper.appendChild(body);
  document.body.appendChild(wrapper);

  try {
    const blob = await h2p().set({
      margin: 0, filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: false, logging: false, windowWidth: 794, backgroundColor: '#fff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(body).outputPdf('blob');

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } finally {
    document.body.removeChild(wrapper);
  }
}

// ═══════════════════════════════════════════════════════════════
//  Parse analyse → sections ordonnées
// ═══════════════════════════════════════════════════════════════
const SECTION_DEFS = [
  { key: 'score',    fr: ['score', 'adéquat', 'compatib', 'bourse'],       en: ['score', 'match', 'compat'] },
  { key: 'strong',   fr: ['fort', 'positif', 'atout', 'strength'],         en: ['strength', 'strong', 'positive'] },
  { key: 'weak',     fr: ['faible', 'lacune', 'manque', 'amélio'],         en: ['weak', 'gap', 'miss', 'improv'] },
  { key: 'error',    fr: ['erreur', 'corriger', 'incorrec', 'manquant'],   en: ['error', 'fix', 'correct', 'miss'] },
  { key: 'action',   fr: ['recommand', 'conseil', 'priorit', 'action'],    en: ['recommend', 'action', 'prior', 'tip'] },
  { key: 'rewrite',  fr: ['reformul', 'suggest', 'réécrire', 'améliorer'], en: ['rewrite', 'suggest', 'rephras'] },
];

const SECTION_CONFIG = {
  score:   { label: { fr: 'Adéquation',       en: 'Match Score'    }, icon: '📊', bg: '#EEF2FF', border: '#6366F1', color: '#3730A3' },
  strong:  { label: { fr: 'Points forts',      en: 'Strengths'      }, icon: '✅', bg: '#ECFDF5', border: '#10B981', color: '#065F46' },
  weak:    { label: { fr: 'Points faibles',    en: 'Weaknesses'     }, icon: '⚠️', bg: '#FFFBEB', border: '#F59E0B', color: '#92400E' },
  error:   { label: { fr: 'Erreurs',           en: 'Errors'         }, icon: '❌', bg: '#FEF2F2', border: '#EF4444', color: '#991B1B' },
  action:  { label: { fr: 'Plan d\'action',    en: 'Action Plan'    }, icon: '🎯', bg: '#EFF6FF', border: '#3B82F6', color: '#1E40AF' },
  rewrite: { label: { fr: 'Reformulations',    en: 'Rewrites'       }, icon: '✍️', bg: '#FDF4FF', border: '#A855F7', color: '#6B21A8' },
  other:   { label: { fr: 'Informations',      en: 'Information'    }, icon: '📋', bg: '#F8FAFC', border: '#94A3B8', color: '#334155' },
};

function classifySection(title) {
  const t = title.toLowerCase();
  for (const def of SECTION_DEFS) {
    if (def.fr.some(k => t.includes(k)) || def.en.some(k => t.includes(k))) return def.key;
  }
  return 'other';
}

function parseAnalysis(text) {
  if (!text) return [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const sections = [];
  let cur = null;

  const isTitle = l => {
    const clean = l.replace(/\*\*/g, '').trim();
    return (
      /^\*\*[^*]+\*\*$/.test(l) ||
      /^[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ][A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ\s\/&\-]{3,}$/.test(clean)
    ) && clean.length < 70;
  };

  for (const line of lines) {
    if (/^-{4,}$/.test(line)) continue;
    if (isTitle(line)) {
      if (cur) sections.push(cur);
      const title = line.replace(/\*\*/g, '').trim();
      cur = { title, key: classifySection(title), items: [], score: null };
    } else if (cur) {
      const scoreMatch = line.match(/(\d+)\s*\/\s*10/);
      if (scoreMatch) { cur.score = parseInt(scoreMatch[1]); }
      const clean = line.replace(/\*\*/g, '').replace(/^[-•\d+\.\s]+/, '').trim();
      if (clean && clean !== '--') cur.items.push(clean);
    }
  }
  if (cur) sections.push(cur);

  // Trier dans l'ordre défini
  const order = ['score', 'strong', 'weak', 'error', 'action', 'rewrite', 'other'];
  return sections
    .filter(s => s.items.length > 0 || s.score !== null)
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

// ═══════════════════════════════════════════════════════════════
//  Score Ring SVG
// ═══════════════════════════════════════════════════════════════
function ScoreRing({ score, color }) {
  const r = 32, stroke = 6;
  const circ = 2 * Math.PI * r;
  const filled = (score / 10) * circ;
  const grade = score >= 7 ? '#10B981' : score >= 5 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 0' }}>
      <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
          <circle cx="40" cy="40" r={r} fill="none" stroke={grade} strokeWidth={stroke}
            strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: grade, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>/10</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: grade }}>
          {score >= 7 ? '✅ Bon profil' : score >= 5 ? '⚠️ Profil moyen' : '❌ Profil faible'}
        </div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>
          Score d'adéquation avec la bourse
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Section Card — avec animation d'apparition
// ═══════════════════════════════════════════════════════════════
function SectionCard({ block, index, lang }) {
  const cfg = SECTION_CONFIG[block.key] || SECTION_CONFIG.other;
  const label = lang === 'fr' ? cfg.label.fr : cfg.label.en;

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}33`,
      borderLeft: `4px solid ${cfg.border}`,
      borderRadius: 14,
      padding: '20px 24px',
      animation: `fadeUp 0.4s ease ${index * 0.08}s both`,
    }}>
      {/* En-tête section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>{cfg.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: '.08em' }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 1, background: `${cfg.border}33` }} />
      </div>

      {/* Score ring si section score */}
      {block.score !== null && <ScoreRing score={block.score} color={cfg.border} />}

      {/* Items */}
      {block.items.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {block.items.map((item, i) => {
            // Détecter les paires "Phrase originale / Version améliorée"
            const isOriginal = item.toLowerCase().startsWith('phrase originale') || item.toLowerCase().startsWith('original');
            const isImproved = item.toLowerCase().startsWith('version améliorée') || item.toLowerCase().startsWith('improved');

            if (isOriginal || isImproved) {
              return (
                <li key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: isImproved ? '#10B981' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>
                    {isOriginal ? '❝ Original' : '✨ Amélioré'}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.6, fontStyle: isOriginal ? 'italic' : 'normal', background: isImproved ? '#ECFDF5' : '#F9FAFB', borderRadius: 6, padding: '6px 10px' }}>
                    {item.replace(/^(phrase originale|version améliorée|original|improved)\s*:\s*/i, '"').replace(/"$/, '') + '"'}
                  </div>
                </li>
              );
            }

            return (
              <li key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, alignItems: 'flex-start' }}>
                <span style={{ color: cfg.border, fontWeight: 700, fontSize: 14, lineHeight: 1.4, flexShrink: 0 }}>›</span>
                <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{item}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function WorkspaceImport({ user, bourse, content, setContent, docType, setLoading, setLoadingStep, lang, C }) {
  const [analysis,    setAnalysis]    = useState(null);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [improving,   setImproving]   = useState(false);
  const [improved,    setImproved]    = useState('');
  const [downloading, setDownloading] = useState(false);
  const fileRef   = useRef(null);
  const resultRef = useRef(null);

  const docLabel = docType === 'cv' ? 'CV' : (lang === 'fr' ? 'Lettre de motivation' : 'Cover Letter');

  // ── Import PDF ou TXT ───────────────────────────────────────
  const handleFile = async (file) => {
    setLoading(true); setLoadingStep('📄 Extraction...');
    setAnalysis(null); setImproved('');
    try {
      let text = '';
      if (file.name.endsWith('.pdf')) {
        text = await extractPDFText(file);
        if (!text || text.length < 30) {
          alert(lang === 'fr'
            ? '⚠️ PDF scanné détecté (image). Copiez-collez le texte directement.'
            : '⚠️ Scanned PDF detected. Please copy-paste the text directly.');
          setLoading(false); return;
        }
      } else if (file.name.match(/\.docx?$/)) {
        alert(lang === 'fr'
          ? '⚠️ Format Word non supporté. Exportez en PDF depuis Word.'
          : '⚠️ Word format not supported. Export as PDF from Word.');
        setLoading(false); return;
      } else {
        text = await file.text();
      }
      setContent(text);
    } catch (e) {
      alert('Erreur: ' + e.message);
    }
    setLoading(false);
  };

  // ── Analyser ────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!content?.trim()) return;
    setAnalyzing(true); setAnalysis(null); setImproved('');
    setLoading(true); setLoadingStep('📊 Analyse IA...');
    try {
      const result = await callN8N(user?.id, bourse?.id, `analyze_${docType}`, {
        cvContent: docType === 'cv' ? content : '',
        lmContent: docType === 'lm' ? content : '',
      });
      setAnalysis(typeof result === 'string' ? result : JSON.stringify(result));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    } catch { alert(lang === 'fr' ? 'Erreur analyse' : 'Analysis error'); }
    setLoading(false); setAnalyzing(false);
  };

  // ── Améliorer ───────────────────────────────────────────────
  const handleImprove = async () => {
    setImproving(true);
    setLoading(true); setLoadingStep('✨ Amélioration IA...');
    try {
      const result = await callN8N(user?.id, bourse?.id, `generate_${docType}`, {
        cvContent: docType === 'cv' ? content : '',
        lmContent: docType === 'lm' ? content : '',
      });
      setImproved(typeof result === 'string' ? result : JSON.stringify(result));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 200);
    } catch { alert('Erreur'); }
    setLoading(false); setImproving(false);
  };

  // ── Télécharger PDF DIRECT (aucune fenêtre) ─────────────────
  const handleDownload = async () => {
    if (!improved || downloading) return;
    setDownloading(true);
    try {
      const filename = docType === 'cv' ? 'CV_Ameliore.pdf' : 'LM_Amelioree.pdf';
      // Récupérer le HTML depuis pdfGenerator
      const { buildPreviewHTML } = await import('./pdfGenerator');
      const html = buildPreviewHTML(improved, docType, lang);
      await downloadDirect(html, filename);
    } catch (e) { alert('Erreur PDF: ' + e.message); }
    setDownloading(false);
  };

  const sections = parseAnalysis(analysis);

  return (
    <div style={{ width: '85%', maxWidth: 900, margin: '0 auto' }}>

      {/* ── Zone import + textarea ── */}
      <div style={{
        background: C.bgCard, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
      }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: C.ink, margin: '0 0 6px' }}>
          {lang === 'fr' ? `Analyser votre ${docLabel}` : `Analyze your ${docLabel}`}
        </h2>
        <p style={{ fontSize: 13, color: C.ink3, margin: '0 0 20px' }}>
          {lang === 'fr'
            ? 'Importez votre PDF ou collez le texte, puis lancez l\'analyse.'
            : 'Import your PDF or paste the text, then run the analysis.'}
        </p>

        <textarea
          value={content}
          onChange={e => { setContent(e.target.value); setAnalysis(null); setImproved(''); }}
          rows={12}
          placeholder={lang === 'fr' ? `Collez ici le texte de votre ${docLabel}...` : `Paste your ${docLabel} text here...`}
          style={{
            width: '100%', padding: 16, border: `1.5px solid ${content?.trim() ? C.accent : C.borderLight}`,
            borderRadius: 10, fontFamily: C.fSans, fontSize: 13, background: C.bgSecondary,
            color: C.ink, resize: 'vertical', outline: 'none', lineHeight: 1.7,
            boxSizing: 'border-box', transition: 'border-color .2s', minHeight: 180,
          }}
        />
        <div style={{ fontSize: 11, color: C.ink3, textAlign: 'right', marginTop: 4, marginBottom: 18 }}>
          {content?.length || 0} {lang === 'fr' ? 'caractères' : 'characters'}
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{
            padding: '11px 20px', border: `1.5px solid ${C.border}`, borderRadius: 9,
            fontSize: 13, fontWeight: 600, color: C.ink2, cursor: 'pointer',
            fontFamily: C.fSans, display: 'flex', alignItems: 'center', gap: 8,
            background: C.bgSecondary, whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            📂 {lang === 'fr' ? 'Importer PDF' : 'Import PDF'}
            <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".pdf,.txt"
              onChange={e => { const f = e.target.files[0]; if (f) handleFile(f); e.target.value = ''; }} />
          </label>

          <button onClick={handleAnalyze} disabled={!content?.trim() || analyzing} style={{
            flex: 1, padding: '11px 24px',
            background: content?.trim() && !analyzing ? `linear-gradient(135deg, ${C.accent}, #0a3d20)` : C.border,
            color: content?.trim() && !analyzing ? '#fff' : C.ink3,
            border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700,
            cursor: !content?.trim() || analyzing ? 'not-allowed' : 'pointer',
            fontFamily: C.fSans, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: content?.trim() && !analyzing ? `0 4px 14px ${C.accent}44` : 'none',
            transition: 'all .25s',
          }}>
            {analyzing ? <><Spin /> {lang === 'fr' ? 'Analyse...' : 'Analyzing...'}</> : <>📊 {lang === 'fr' ? 'Lancer l\'analyse IA' : 'Run AI Analysis'}</>}
          </button>
        </div>
      </div>

      {/* ── Résultat analyse ── */}
      {sections.length > 0 && (
        <div ref={resultRef}>
          {/* Titre résultat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <div style={{ width: 4, height: 32, background: C.accent, borderRadius: 4 }} />
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0 }}>
                {lang === 'fr' ? 'Résultat de l\'analyse' : 'Analysis Result'}
              </h3>
              <p style={{ fontSize: 12, color: C.ink3, margin: 0 }}>
                {sections.length} {lang === 'fr' ? 'sections' : 'sections'} · {lang === 'fr' ? 'basé sur votre document' : 'based on your document'}
              </p>
            </div>
          </div>

          {/* Cards sections — espacées */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
            {sections.map((block, i) => (
              <SectionCard key={i} block={block} index={i} lang={lang} />
            ))}
          </div>

          {/* ── Bouton Améliorer — centré, en dessous ── */}
          {!improved && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
              <button onClick={handleImprove} disabled={improving} style={{
                padding: '14px 48px',
                background: improving ? '#94A3B8' : 'linear-gradient(135deg, #7C3AED, #4C1D95)',
                color: '#fff', border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 700,
                cursor: improving ? 'not-allowed' : 'pointer', fontFamily: C.fSans,
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: improving ? 'none' : '0 6px 24px rgba(124,58,237,0.4)',
                transition: 'all .3s', letterSpacing: '.02em',
              }}>
                {improving
                  ? <><Spin /> {lang === 'fr' ? 'Génération en cours...' : 'Generating...'}</>
                  : <>✨ {lang === 'fr' ? 'Générer le document amélioré' : 'Generate Improved Document'}</>
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Document amélioré ── */}
      {improved && (
        <div style={{
          background: C.bgCard,
          border: `2px solid ${C.accent}`,
          borderRadius: 16,
          padding: '28px 32px',
          marginTop: 8,
          animation: 'fadeUp .5s ease both',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✨</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>
                  {lang === 'fr' ? 'Document amélioré' : 'Improved Document'}
                </div>
                <div style={{ fontSize: 12, color: C.ink3 }}>
                  {lang === 'fr' ? 'Prêt à télécharger' : 'Ready to download'}
                </div>
              </div>
            </div>

            {/* Bouton téléchargement direct */}
            <button onClick={handleDownload} disabled={downloading} style={{
              padding: '11px 26px',
              background: downloading ? C.border : C.accent,
              color: downloading ? C.ink3 : '#fff',
              border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: downloading ? 'not-allowed' : 'pointer', fontFamily: C.fSans,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: downloading ? 'none' : `0 4px 16px ${C.accent}55`,
              transition: 'all .2s',
            }}>
              {downloading ? <><Spin /> {lang === 'fr' ? 'Génération PDF...' : 'Generating PDF...'}</> : <>⬇️ {lang === 'fr' ? 'Télécharger PDF' : 'Download PDF'}</>}
            </button>
          </div>

          {/* Aperçu texte */}
          <div style={{
            background: C.bgSecondary, borderRadius: 10,
            padding: '18px 20px', fontSize: 13, color: C.ink2,
            lineHeight: 1.8, maxHeight: 380, overflowY: 'auto',
            whiteSpace: 'pre-wrap', border: `1px solid ${C.borderLight}`,
            fontFamily: `'Courier New', monospace`,
          }}>
            {improved}
          </div>

          {/* Relancer l'analyse */}
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button onClick={() => { setImproved(''); setAnalysis(null); }} style={{
              background: 'transparent', border: 'none', color: C.ink3,
              fontSize: 12, cursor: 'pointer', fontFamily: C.fSans,
              textDecoration: 'underline',
            }}>
              {lang === 'fr' ? '↩ Recommencer l\'analyse' : '↩ Start over'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes spin   { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Spin() {
  return <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite', flexShrink: 0 }} />;
}