import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';

// ═══════════════════════════════════════════════════════════════════════════
//  UTILS — remplace par tes vraies implémentations
// ═══════════════════════════════════════════════════════════════════════════
async function extractPdfText(file) { /* unchanged */ }
async function generateCV(aiContent, user, bourse, filename) { /* unchanged */ }
async function generateLM(rawContent, filename, meta, bourse) { /* unchanged */ }
function checkProfile(user) { return { ok: true }; }
async function callN8N(context, payload) { /* unchanged */ }
function buildPrompt(type, user, bourse, selB) { /* unchanged */ }

// ═══════════════════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════
const C = {
  bg:          '#F5F2EC',
  bgCard:      '#FFFFFF',
  bgSecondary: '#FAFAF7',
  border:      '#E8E3D9',
  borderLight: '#EEE9E0',
  accent:      '#1A6B3C',
  accentBg:    '#E8F3ED',
  blue:        '#2B5BA8',
  blueBg:      '#EEF3FB',
  ink:         '#1A1A1A',
  ink2:        '#4A4A4A',
  ink3:        '#8A8A8A',
  warn:        '#B06A12',
  warnBg:      '#FFF3E0',
  danger:      '#B43030',
  dangerBg:    '#FFEBEB',
  fSerif:      "'Instrument Serif', Georgia, serif",
  fSans:       "'DM Sans', 'Helvetica Neue', sans-serif",
};

function daysLeft(deadline) {
  return Math.ceil((new Date(deadline) - new Date()) / 86400000);
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ═══════════════════════════════════════════════════════════════════════════
//  STEP BAR
// ═══════════════════════════════════════════════════════════════════════════
function StepBar({ step }) {
  // step = 0 → only dot 1 active; step = 1 → dots 1+2; step = 2 → all
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {[0, 1, 2].map(i => (
        <React.Fragment key={i}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: i <= step ? C.ink : C.bgCard,
            border: `1px solid ${i <= step ? C.ink : C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600,
            color: i <= step ? '#fff' : C.ink3,
            transition: 'all .4s',
          }}>
            {i < step ? '✓' : i + 1}
          </div>
          {i < 2 && (
            <div style={{
              flex: 1, height: 1,
              background: i < step ? C.ink : C.border,
              transition: 'background .5s',
            }} />
          )}
        </React.Fragment>
      ))}
      <span style={{ fontSize: 11, color: C.ink3, marginLeft: 12, whiteSpace: 'nowrap', fontFamily: C.fSans }}>
        Étape {step + 1} / 3
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  DEADLINE BADGE
// ═══════════════════════════════════════════════════════════════════════════
function DeadlineBadge({ deadline }) {
  const days = daysLeft(deadline);
  const urgent = days <= 7, soon = days <= 30;
  const bg    = urgent ? C.dangerBg : soon ? C.warnBg : '#F0F0F0';
  const color = urgent ? C.danger   : soon ? C.warn   : C.ink3;
  const dot   = urgent ? '🔴 ' : soon ? '🟠 ' : '';
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: bg, color }}>
      {dot}{fmtDate(deadline)}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  SMALL BUTTON
// ═══════════════════════════════════════════════════════════════════════════
function SmallBtn({ children, onClick, primary = false, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '6px 14px',
      background: primary ? C.accent : 'transparent',
      color: primary ? '#fff' : C.accent,
      border: `1px solid ${C.accent}`,
      borderRadius: 6, fontSize: 11, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: C.fSans, opacity: disabled ? 0.45 : 1,
      transition: 'all .2s', whiteSpace: 'nowrap',
    }}>
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  CARD WRAPPER
// ═══════════════════════════════════════════════════════════════════════════
function Card({ n, title, done = false, children }) {
  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '22px 28px',
      marginBottom: 16,
      animation: 'fadeSlide .35s ease',
    }}>
      <div style={{ fontSize: 10, color: C.ink3, fontWeight: 600, letterSpacing: '.1em', marginBottom: 8 }}>
        {String(n).padStart(2, '0')}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{title}</span>
        {done && <span style={{ fontSize: 15, color: C.accent }}>✓</span>}
      </div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  TYPE CARD  (CV / LM)
// ═══════════════════════════════════════════════════════════════════════════
function TypeCard({ icon, label, sub, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, padding: '18px 16px', borderRadius: 10, cursor: 'pointer',
      border: selected ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
      background: selected ? C.accentBg : C.bgCard,
      transition: 'all .2s',
    }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, color: C.ink3 }}>{sub}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ACTION CARD
// ═══════════════════════════════════════════════════════════════════════════
function ActionCard({ icon, label, desc, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, minWidth: 0, padding: '18px 14px', borderRadius: 10,
        border: `1px solid ${hov ? '#ccc8c0' : C.border}`,
        background: hov ? C.bgSecondary : C.bgCard,
        textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: C.ink3, lineHeight: 1.4 }}>{desc}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  DOC ROW
// ═══════════════════════════════════════════════════════════════════════════
function DocRow({ doc }) {
  const isLm = doc.type === 'lm';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: `1px solid ${C.borderLight}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 7, fontSize: 15,
          background: isLm ? C.blueBg : C.accentBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {isLm ? '✉️' : '📄'}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{doc.name}</div>
          <div style={{ fontSize: 11, color: C.ink3 }}>{doc.bourse} · {doc.date}</div>
        </div>
      </div>
      <button style={{
        fontSize: 12, color: C.ink3, background: 'transparent',
        border: `1px solid ${C.border}`, borderRadius: 6,
        padding: '5px 14px', cursor: 'pointer', fontFamily: C.fSans,
      }}>Ouvrir</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  WORKSPACE CV
// ═══════════════════════════════════════════════════════════════════════════
function WorkspaceCV({ user, bourse, cvContent, setCvContent, setLoading, setLoadingStep }) {
  const [analysis, setAnalysis] = useState(null);
  const [improved, setImproved] = useState('');
  const fileRef = useRef(null);

  const handleAnalyze = async () => {
    if (!cvContent) return;
    setLoading(true); setLoadingStep('Analyse du CV…');
    try {
      const result = await callN8N('CV_ANALYSIS', {
        text: `Analyse ce CV pour "${bourse?.nom}". JSON uniquement: {"score":number,"toFix":[],"strengths":[],"conclusion":string}\n${cvContent}`,
        id: user.id, bourse_nom: bourse?.nom, conversationId: `ana-${Date.now()}`,
      });
      const m = result.match(/\{[\s\S]*\}/);
      setAnalysis(m ? JSON.parse(m[0]) : { score: 0, conclusion: result });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleImprove = async () => {
    if (!cvContent) return;
    setLoading(true); setLoadingStep('Optimisation…');
    try {
      const result = await callN8N('generate_cv', {
        text: `Améliore ce CV pour "${bourse?.nom}".\n${cvContent}`,
        id: user.id, bourse_nom: bourse?.nom, conversationId: `imp-${Date.now()}`,
      });
      setImproved(result);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Contenu actuel</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <SmallBtn onClick={handleAnalyze} disabled={!cvContent}>Analyser</SmallBtn>
            <SmallBtn onClick={handleImprove} primary disabled={!cvContent}>Optimiser</SmallBtn>
            <label style={{
              padding: '6px 14px', border: `1px solid ${C.accent}`, borderRadius: 6,
              fontSize: 11, fontWeight: 600, color: C.accent, cursor: 'pointer', fontFamily: C.fSans, whiteSpace: 'nowrap',
            }}>
              📂 Importer
              <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".pdf,.txt"
                onChange={async e => {
                  const file = e.target.files[0]; if (!file) return;
                  const text = file.type === 'application/pdf' ? await extractPdfText(file) : await file.text();
                  setCvContent(text);
                }} />
            </label>
          </div>
        </div>
        <textarea value={cvContent} onChange={e => setCvContent(e.target.value)} rows={18}
          placeholder="Votre CV (texte ou collé ici)" style={{
            width: '100%', padding: 14, border: `1px solid ${C.borderLight}`, borderRadius: 8,
            fontFamily: C.fSans, fontSize: 13, background: C.bgSecondary, color: C.ink,
            resize: 'vertical', outline: 'none', lineHeight: 1.6,
          }} />
        {analysis && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: C.ink }}>Analyse IA · {analysis.score}/100</div>
            <p style={{ fontSize: 12, color: C.ink2, marginBottom: 8 }}>{analysis.conclusion}</p>
            {analysis.toFix?.length > 0 && (
              <ul style={{ paddingLeft: 16 }}>
                {analysis.toFix.map((s, i) => <li key={i} style={{ fontSize: 12, color: C.danger, marginBottom: 2 }}>{s}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 14 }}>Aperçu / Version améliorée</div>
        {improved ? (
          <>
            <div style={{
              background: C.bgSecondary, padding: 14, borderRadius: 8,
              fontSize: 12, color: C.ink2, lineHeight: 1.7, maxHeight: 380, overflowY: 'auto', marginBottom: 12,
            }}>
              {improved.split('\n').map((l, i) => <div key={i}>{l || '\u00A0'}</div>)}
            </div>
            <SmallBtn primary onClick={() => generateCV(improved, user, bourse?.nom, 'CV_ameliore')}>📥 Télécharger PDF</SmallBtn>
          </>
        ) : cvContent ? (
          <SmallBtn onClick={() => generateCV(cvContent, user, bourse?.nom, 'CV')}>📥 Télécharger PDF</SmallBtn>
        ) : (
          <div style={{ textAlign: 'center', color: C.ink3, padding: 60, fontSize: 13 }}>
            Aucun CV — importez ou générez via l'étape 3
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  WORKSPACE LM
// ═══════════════════════════════════════════════════════════════════════════
function WorkspaceLM({ user, bourse, lmContent, setLmContent, setLoading, setLoadingStep }) {
  const [analysis, setAnalysis]     = useState(null);
  const [improved, setImproved]     = useState('');
  const [paragraphs, setParagraphs] = useState([]);
  const [pScores, setPScores]       = useState({});

  const parseParagraphs = (text) => {
    const ps = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    setParagraphs(ps);
    setPScores(ps.reduce((acc, _, i) => ({ ...acc, [i]: 50 + Math.floor(Math.random() * 40) }), {}));
  };

  const handleAnalyze = async () => {
    if (!lmContent) return;
    setLoading(true); setLoadingStep('Analyse de la lettre…');
    try {
      const result = await callN8N('CV_ANALYSIS', {
        text: `Analyse cette lettre pour "${bourse?.nom}". JSON: {"score":number,"toFix":[],"conclusion":string}\n${lmContent}`,
        id: user.id, bourse_nom: bourse?.nom, conversationId: `lma-${Date.now()}`,
      });
      const m = result.match(/\{[\s\S]*\}/);
      setAnalysis(m ? JSON.parse(m[0]) : { score: 0, conclusion: result });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleImprove = async () => {
    if (!lmContent) return;
    setLoading(true); setLoadingStep('Amélioration…');
    try {
      const result = await callN8N('generate_lm', {
        text: `Améliore cette lettre pour "${bourse?.nom}".\n${lmContent}`,
        id: user.id, bourse_nom: bourse?.nom, conversationId: `lmi-${Date.now()}`,
      });
      setImproved(result);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const rewriteParagraph = async (idx) => {
    setLoading(true);
    try {
      const result = await callN8N('generate_lm', {
        text: `Réécris ce paragraphe pour "${bourse?.nom}":\n${paragraphs[idx]}`,
        id: user.id, bourse_nom: bourse?.nom, conversationId: `rw-${Date.now()}`,
      });
      const updated = [...paragraphs]; updated[idx] = result;
      setParagraphs(updated); setLmContent(updated.join('\n\n'));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Lettre complète</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <SmallBtn onClick={handleAnalyze} disabled={!lmContent}>Analyser</SmallBtn>
            <SmallBtn onClick={handleImprove} primary disabled={!lmContent}>Améliorer</SmallBtn>
            <label style={{
              padding: '6px 14px', border: `1px solid ${C.accent}`, borderRadius: 6,
              fontSize: 11, fontWeight: 600, color: C.accent, cursor: 'pointer', fontFamily: C.fSans, whiteSpace: 'nowrap',
            }}>
              📂 Importer
              <input type="file" accept=".pdf,.txt" style={{ display: 'none' }}
                onChange={async e => {
                  const file = e.target.files[0]; if (!file) return;
                  const text = file.type === 'application/pdf' ? await extractPdfText(file) : await file.text();
                  setLmContent(text); parseParagraphs(text);
                }} />
            </label>
          </div>
        </div>
        <textarea value={lmContent} onChange={e => { setLmContent(e.target.value); parseParagraphs(e.target.value); }}
          rows={18} placeholder="Collez votre lettre ici" style={{
            width: '100%', padding: 14, border: `1px solid ${C.borderLight}`, borderRadius: 8,
            fontFamily: C.fSans, fontSize: 13, background: C.bgSecondary, color: C.ink,
            resize: 'vertical', outline: 'none', lineHeight: 1.6,
          }} />
        {analysis && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: C.ink }}>Score {analysis.score}/100</div>
            <p style={{ fontSize: 12, color: C.ink2 }}>{analysis.conclusion}</p>
          </div>
        )}
      </div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22, maxHeight: 580, overflowY: 'auto' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 14 }}>Paragraphes – force par section</div>
        {paragraphs.length === 0 && (
          <div style={{ textAlign: 'center', color: C.ink3, padding: 60, fontSize: 13 }}>
            Collez votre lettre pour voir l'analyse par paragraphe
          </div>
        )}
        {paragraphs.map((para, idx) => {
          const sc = pScores[idx] || 50;
          const col = sc >= 70 ? C.accent : sc >= 50 ? C.blue : C.danger;
          return (
            <div key={idx} style={{ marginBottom: 14, padding: 14, background: C.bgSecondary, borderRadius: 8, borderLeft: `3px solid ${col}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.ink2 }}>Paragraphe {idx + 1}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{sc}%</span>
              </div>
              <p style={{ fontSize: 12, color: C.ink2, marginBottom: 8, lineHeight: 1.5, maxHeight: 72, overflow: 'hidden' }}>
                {para.slice(0, 160)}…
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <SmallBtn onClick={() => rewriteParagraph(idx)}>✍️ Réécrire</SmallBtn>
                <SmallBtn onClick={() => navigator.clipboard.writeText(para)}>📋 Copier</SmallBtn>
              </div>
            </div>
          );
        })}
        {improved && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: C.ink }}>Version améliorée</div>
            <div style={{ background: C.bgSecondary, padding: 12, borderRadius: 8, fontSize: 12, color: C.ink2, marginBottom: 10 }}>
              {improved.slice(0, 300)}…
            </div>
            <SmallBtn primary onClick={() => generateLM(improved, 'Lettre_amelioree', { name: user.name, email: user.email }, bourse?.nom)}>
              📥 Télécharger PDF
            </SmallBtn>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN — CVPage
// ═══════════════════════════════════════════════════════════════════════════
export default function CVPage({ user, setView }) {
  // step: 0 = seule étape 1 visible | 1 = étapes 1+2 | 2 = étapes 1+2+3 | 3 = tout + workspace
  const [step, setStep]                     = useState(0);
  const [scholarships, setScholarships]     = useState([]);
  const [selectedBourse, setSelectedBourse] = useState(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedType, setSelectedType]     = useState(null);
  const [fullUser, setFullUser]             = useState(user);
  const [cvContent, setCvContent]           = useState('');
  const [lmContent, setLmContent]           = useState('');
  const [loading, setLoading]               = useState(false);
  const [loadingStep, setLoadingStep]       = useState('');
  const [activeTab, setActiveTab]           = useState('cv');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const workspaceRef = useRef(null);
  const step2Ref     = useRef(null);
  const step3Ref     = useRef(null);

  // Load user
  useEffect(() => {
    if (!user?.id) return;
    axiosInstance.get(API_ROUTES.users.byId(user.id), { params: { depth: 2 } })
      .then(res => setFullUser(res.data)).catch(() => setFullUser(user));
  }, [user?.id]);

  // Load scholarships
  useEffect(() => {
    if (!user?.id) return;
    axiosInstance.get(API_ROUTES.roadmap.byUser(user.id))
      .then(res => {
        const docs = (res.data.docs || []).map(d => ({
          nom: d.nom, pays: d.pays || '',
          url: d.lienOfficiel || d.url || '',
          deadline: d.dateLimite || d.deadline || '',
        }));
        setScholarships(docs);
      })
      .catch(() => setScholarships([]));
  }, [user?.id]);

  // ── handlers ──────────────────────────────────────────────────────────
  const handleSelectBourse = (bourse) => {
    setSelectedBourse(bourse);
    setStep(1);
    setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const handleChangeBourse = () => {
    setSelectedBourse(null);
    setSelectedType(null);
    setStep(0);
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    setStep(2);
    setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const handleAction = async (actionType) => {
    const pCheck = checkProfile(fullUser);
    if (!pCheck.ok) { alert('Profil incomplet – veuillez le compléter'); return; }

    if (actionType === 'import') {
      setStep(3);
      setActiveTab(selectedType || 'cv');
      setTimeout(() => workspaceRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      return;
    }

    setLoading(true);
    setLoadingStep(selectedType === 'cv' ? 'Génération du CV…' : 'Rédaction de la lettre…');
    try {
      const prompt = buildPrompt(selectedType, fullUser, selectedBourse.nom, selectedBourse);
      const result = await callN8N(
        selectedType === 'cv' ? 'generate_cv' : 'generate_lm',
        { text: prompt, id: fullUser.id, email: fullUser.email, bourse_nom: selectedBourse.nom, conversationId: `${selectedType}-${Date.now()}` }
      );
      if (selectedType === 'cv') setCvContent(result);
      else setLmContent(result);
    } catch (e) { console.error(e); }
    setLoading(false);
    setStep(3);
    setActiveTab(selectedType || 'cv');
    setTimeout(() => workspaceRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  const filtered = scholarships.filter(s =>
    s.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.pays.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const savedDocs = [
    { name: 'CV – Australia Awards', bourse: 'Australia Awards', date: '20/04/2026', type: 'cv' },
    { name: 'LM – Chevening',        bourse: 'Chevening',       date: '18/04/2026', type: 'lm' },
  ];

  const stats = [
    { icon: '📄', value: 3, label: 'CV générés' },
    { icon: '✉️', value: 2, label: 'Lettres générées' },
    { icon: '📈', value: 5, label: 'CV améliorés' },
    { icon: '🎓', value: 1, label: 'Candidatures lancées' },
  ];

  // ── gate ──────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 48, maxWidth: 380, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📄</div>
          <h3 style={{ fontFamily: C.fSerif, fontSize: 22, fontWeight: 400, color: C.ink, marginBottom: 10 }}>Accès restreint</h3>
          <p style={{ color: C.ink2, fontSize: 14, marginBottom: 24 }}>Connectez-vous pour optimiser votre candidature.</p>
          <button onClick={() => setShowLoginModal(true)} style={{
            padding: '11px 32px', background: C.ink, color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: C.fSans,
          }}>Se connecter</button>
        </div>
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.fSans }}>


      {/* ── Page content — 85 % width ── */}
      <div style={{ width: '85%', margin: '0 auto', padding: '40px 0 80px' }}>

      
        <h1 style={{ fontFamily: C.fSans, fontSize: 40, fontWeight: 600, color: C.ink, margin: '0 0 4px' }}>
          Préparez votre candidature
        </h1>
        <p style={{ fontSize: 14, color: C.ink3, margin: '0 0 30px' }}>Un processus guidé, simple et efficace</p>

        {/* Step bar — affiche uniquement les dots déverrouillés */}
        <StepBar step={step > 2 ? 2 : step} />

        {/* ════ ÉTAPE 1 — toujours visible ════ */}
        <Card n={1} title="Choisissez votre bourse" done={step >= 1}>
          {/* Condensé quand bourse choisie */}
          {step >= 1 && selectedBourse ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 16px', borderRadius: 10,
              background: C.accentBg, border: `1px solid ${C.accent}`,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{selectedBourse.nom}</div>
                <div style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{selectedBourse.pays}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <DeadlineBadge deadline={selectedBourse.deadline} />
                <span
                  onClick={handleChangeBourse}
                  style={{ fontSize: 12, color: C.accent, fontWeight: 600, cursor: 'pointer' }}
                >
                  Changer
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Searchbar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: C.bgSecondary, border: `1px solid ${C.border}`,
                borderRadius: 9, padding: '10px 14px', marginBottom: 12,
              }}>
                <span style={{ fontSize: 14, color: C.ink3 }}>🔍</span>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une bourse…"
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: C.ink, flex: 1, fontFamily: C.fSans }}
                />
              </div>

              {/* Liste */}
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {filtered.map(s => (
                  <div
                    key={s.nom}
                    onClick={() => handleSelectBourse(s)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: 9, cursor: 'pointer',
                      background: selectedBourse?.nom === s.nom ? C.accentBg : 'transparent',
                      border: `1px solid ${selectedBourse?.nom === s.nom ? C.accent : 'transparent'}`,
                      marginBottom: 4, transition: 'all .18s',
                    }}
                    onMouseEnter={e => { if (selectedBourse?.nom !== s.nom) e.currentTarget.style.background = C.bgSecondary; }}
                    onMouseLeave={e => { if (selectedBourse?.nom !== s.nom) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{s.nom}</div>
                      <div style={{ fontSize: 12, color: C.ink3, marginTop: 1 }}>{s.pays}</div>
                    </div>
                    <DeadlineBadge deadline={s.deadline} />
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 28, color: C.ink3, fontSize: 14 }}>Aucune bourse trouvée</div>
                )}
              </div>
            </>
          )}
        </Card>

        {/* ════ ÉTAPE 2 — visible seulement si step >= 1 ════ */}
        {step >= 1 && (
          <div ref={step2Ref}>
            <Card n={2} title="Que souhaitez-vous améliorer ?" done={step >= 2}>
              <div style={{ display: 'flex', gap: 16 }}>
                <TypeCard
                  icon="📄" label="CV"
                  sub="Optimiser votre CV pour cette bourse"
                  selected={selectedType === 'cv'}
                  onClick={() => handleSelectType('cv')}
                />
                <TypeCard
                  icon="✉️" label="Lettre de motivation"
                  sub="Adapter votre lettre à la bourse"
                  selected={selectedType === 'lm'}
                  onClick={() => handleSelectType('lm')}
                />
              </div>
            </Card>
          </div>
        )}

        {/* ════ ÉTAPE 3 — visible seulement si step >= 2 ════ */}
        {step >= 2 && (
          <div ref={step3Ref}>
            <Card n={3} title="Choisissez une action" done={step >= 3}>
              <div style={{ display: 'flex', gap: 14 }}>
                <ActionCard
                  icon="📂"
                  label={`Importer mon ${selectedType === 'lm' ? 'LM' : 'CV'}`}
                  desc="Analyser et améliorer un document existant"
                  onClick={() => handleAction('import')}
                />
                <ActionCard
                  icon="✨"
                  label={`Générer un ${selectedType === 'lm' ? 'LM' : 'CV'} avec IA`}
                  desc={`Créer un ${selectedType === 'lm' ? 'LM' : 'CV'} basé sur votre profil`}
                  onClick={() => handleAction('generate')}
                />
                <ActionCard
                  icon="📊"
                  label={`Analyser mon ${selectedType === 'lm' ? 'LM' : 'CV'}`}
                  desc="Score + recommandations détaillées"
                  onClick={() => handleAction('analyze')}
                />
              </div>
            </Card>
          </div>
        )}

        {/* ════ WORKSPACE — visible seulement si step >= 3 ════ */}
        {step >= 3 && (
          <div ref={workspaceRef} style={{ marginTop: 4 }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
              {[{ id: 'cv', label: '📄 CV' }, { id: 'lm', label: '✉️ Lettre de motivation' }].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: '11px 22px', background: 'transparent',
                  color: activeTab === tab.id ? C.ink : C.ink3,
                  borderBottom: activeTab === tab.id ? `2px solid ${C.ink}` : '2px solid transparent',
                  border: 'none', cursor: 'pointer',
                  fontWeight: activeTab === tab.id ? 700 : 400,
                  fontFamily: C.fSans, fontSize: 13, transition: 'all .2s',
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'cv' && (
              <WorkspaceCV
                user={fullUser} bourse={selectedBourse}
                cvContent={cvContent} setCvContent={setCvContent}
                setLoading={setLoading} setLoadingStep={setLoadingStep}
              />
            )}
            {activeTab === 'lm' && (
              <WorkspaceLM
                user={fullUser} bourse={selectedBourse}
                lmContent={lmContent} setLmContent={setLmContent}
                setLoading={setLoading} setLoadingStep={setLoadingStep}
              />
            )}
          </div>
        )}

        {/* ════ Mes documents — toujours visible ════ */}
        <div style={{
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: '22px 28px', marginTop: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>📁</span>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Mes documents</div>
          </div>
          {savedDocs.map((doc, i) => <DocRow key={i} doc={doc} />)}
          <button style={{
            marginTop: 14, width: '100%', padding: '11px',
            background: 'transparent', border: `1px dashed ${C.border}`,
            borderRadius: 9, fontSize: 13, color: C.ink3, cursor: 'pointer', fontFamily: C.fSans,
          }}>
            + Ajouter un document
          </button>
        </div>

        {/* ════ Votre activité — toujours visible ════ */}
        <div style={{
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: '22px 28px', marginTop: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.blue }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Votre activité</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.ink }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.ink3, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Toast loading ── */}
      {loading && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28,
          background: C.ink, color: '#fff',
          padding: '13px 24px', borderRadius: 40,
          boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
          zIndex: 1000, fontSize: 13, fontFamily: C.fSans,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 15, height: 15,
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff', borderRadius: '50%',
            animation: 'spin .8s linear infinite',
          }} />
          {loadingStep}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        textarea:focus, input:focus { outline: none; box-shadow: 0 0 0 2px ${C.accentBg}; }
      `}</style>
    </div>
  );
}