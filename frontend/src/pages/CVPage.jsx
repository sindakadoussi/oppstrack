// ✅ AJOUTER useEffect à l'import:
import React, { useState, useEffect, useRef } from 'react';import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';
import axios from 'axios';
import { buildPreviewHTML, downloadCVPDF, downloadLMPDF } from './pdfGenerator';
import Workspaceimport from './Workspaceimport';
import LoginModal from '@/components/LoginModal';
import RestrictedAccessCard from '@/components/RestrictedAccessCard';



// ═══════════════════════════════════════════════════════════════════════════
//  N8N WEBHOOK
// ═══════════════════════════════════════════════════════════════════════════
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/generate-documents';

async function callN8N(userId, bourseId, context, extra = {}) {
  const response = await axios.post(N8N_WEBHOOK_URL, {
    userId, bourseId, context,
    timestamp: new Date().toISOString(),
    ...extra,
  }, { headers: { 'Content-Type': 'application/json' }, timeout: 120000 });
  return response.data.output || response.data.message || response.data;
}

// ═══════════════════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════
const tokens = (theme) => ({
  bg:          theme === 'dark' ? '#15140f' : '#F5F2EC',
  bgCard:      theme === 'dark' ? '#1a1912' : '#FFFFFF',
  bgSecondary: theme === 'dark' ? '#24231c' : '#FAFAF7',
  border:      theme === 'dark' ? '#2b2a22' : '#E8E3D9',
  borderLight: theme === 'dark' ? '#24231c' : '#EEE9E0',
  accent:      '#1A6B3C',
  accentBg:    theme === 'dark' ? 'rgba(26,107,60,0.15)' : '#E8F3ED',
  blue:        '#2B5BA8',
  blueBg:      theme === 'dark' ? 'rgba(43,91,168,0.15)' : '#EEF3FB',
  ink:         theme === 'dark' ? '#f2efe7' : '#1A1A1A',
  ink2:        theme === 'dark' ? '#cfccc2' : '#4A4A4A',
  ink3:        theme === 'dark' ? '#a19f96' : '#8A8A8A',
  warn:        '#B06A12',
  warnBg:      theme === 'dark' ? 'rgba(176,106,18,0.15)' : '#FFF3E0',
  danger:      '#B43030',
  dangerBg:    theme === 'dark' ? 'rgba(180,48,48,0.15)' : '#FFEBEB',
  fSerif:      "'Playfair Display', Georgia, serif",
  fSans:       "'DM Sans', 'Helvetica Neue', sans-serif",
});

function daysLeft(d) { return d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null; }
function fmtDate(d)  { return d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''; }

// ═══════════════════════════════════════════════════════════════════════════
//  COMPOSANTS UI
// ═══════════════════════════════════════════════════════════════════════════
function Spinner() {
  return <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .8s linear infinite', flexShrink: 0 }} />;
}

function StepBar({ step, C }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {[0, 1, 2].map(i => (
        <React.Fragment key={i}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: i <= step ? C.ink : C.bgCard, border: `1px solid ${i <= step ? C.ink : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: i <= step ? '#fff' : C.ink3, transition: 'all .4s' }}>
            {i < step ? '✓' : i + 1}
          </div>
          {i < 2 && <div style={{ flex: 1, height: 1, background: i < step ? C.ink : C.border }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function DeadlineBadge({ deadline, C }) {
  const days = daysLeft(deadline);
  if (days === null) return null;
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: days <= 7 ? C.dangerBg : C.accentBg, color: days <= 7 ? C.danger : C.accent }}>{days <= 7 ? '🔴' : '📅'} {fmtDate(deadline)}</span>;
}

function Card({ n, title, done, children, C }) {
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: '22px 28px', marginBottom: 16, animation: 'fadeSlide .35s ease' }}>
      <div style={{ fontSize: 10, color: C.ink3, fontWeight: 600, letterSpacing: '.1em', marginBottom: 8 }}>{String(n).padStart(2, '0')}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{title}</span>
        {done && <span style={{ fontSize: 15, color: C.accent }}>✓</span>}
      </div>
      {children}
    </div>
  );
}

function TypeCard({ icon, label, sub, selected, onClick, C }) {
  return (
    <div onClick={onClick} style={{ flex: 1, padding: '18px 16px', borderRadius: 10, cursor: 'pointer', border: selected ? `2px solid ${C.accent}` : `1px solid ${C.border}`, background: selected ? C.accentBg : C.bgCard, transition: 'all .2s' }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, color: C.ink3 }}>{sub}</div>
    </div>
  );
}

function ActionCard({ icon, label, desc, onClick, C }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ flex: 1, padding: '20px 16px', borderRadius: 10, border: `1px solid ${hov ? C.accent : C.border}`, background: hov ? C.accentBg : C.bgCard, textAlign: 'center', cursor: 'pointer', transition: 'all .2s' }}>
      <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: hov ? C.accent : C.ink, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 11, color: C.ink3, lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

// ── Bouton Télécharger PDF ────────────────────────────────────
function DownloadBtn({ content, filename, docType, lang, C }) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!content) return;
    setBusy(true);
    try {
      if (docType === 'cv') await downloadCVPDF(content, filename, lang);
      else await downloadLMPDF(content, filename, lang);
    } catch (e) { alert('Erreur PDF: ' + e.message); }
    setBusy(false);
  };
  return (
    <button onClick={go} disabled={!content || busy} style={{
      padding: '8px 18px', background: content && !busy ? C.accent : C.border,
      color: content && !busy ? '#fff' : C.ink3, border: 'none', borderRadius: 8,
      fontSize: 12, fontWeight: 700, cursor: !content || busy ? 'not-allowed' : 'pointer',
      fontFamily: C.fSans, display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s',
      boxShadow: content && !busy ? `0 2px 8px ${C.accent}44` : 'none',
    }}>
      {busy ? <><Spinner /> {lang === 'fr' ? 'Export...' : 'Exporting...'}</> : <>⬇️ {lang === 'fr' ? 'Télécharger PDF' : 'Download PDF'}</>}
    </button>
  );
}

// ── Aperçu live HTML ──────────────────────────────────────────
function LivePreview({ content, docType, lang, C }) {
  const iframeRef = useRef(null);
 
  useEffect(() => {
    if (!content || !iframeRef.current) return;
 
    console.log('🔍 LivePreview - Génération HTML...');
    console.log('  Content length:', content.length);
    console.log('  DocType:', docType);
 
    try {
      // ✅ buildPreviewHTML est déjà importée en haut du fichier
      const html = buildPreviewHTML(content, docType, lang);
 
      if (!html || html.length < 200) {
        console.error('❌ HTML générée trop courte:', html?.length);
        iframeRef.current.srcdoc = `<html><body style="color:red"><h1>❌ Erreur: HTML vide ou trop court</h1></body></html>`;
        return;
      }
 
      console.log('✅ HTML générée:', html.length, 'caractères');
 
      // 2. Appliquer au iframe
      iframeRef.current.srcdoc = html;
      console.log('✅ srcdoc appliqué');
 
    } catch (error) {
      console.error('❌ ERREUR LivePreview:', error);
      iframeRef.current.srcdoc = `<html><body><h1>❌ Erreur:</h1><pre>${error.message}</pre></body></html>`;
    }
 
  }, [content, docType, lang]);
 
  if (!content) {
    return (
      <div style={{
        textAlign: 'center', color: C.ink3, padding: 60, fontSize: 13,
        background: C.bgSecondary, borderRadius: 8, border: `1px solid ${C.borderLight}`
      }}>
        {lang === 'fr' ? '📭 Aucun contenu' : '📭 No content'}
      </div>
    );
  }
 
  return (
    <iframe
      ref={iframeRef}
      style={{
        width: '100%', height: 520, border: `1px solid ${C.borderLight}`,
        borderRadius: 8, background: '#fff', display: 'block',
        boxSizing: 'border-box'
      }}
      title="document-preview"
      sandbox="allow-same-origin allow-scripts"
    />
  );
}
 

// ── Parse sections pour le panel analyse ─────────────────────
function parseSections(text) {
  if (!text) return [];
  
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const sections = [];
  let cur = null;
 
  // Pattern pour reconnaître les titres
  const isTitle = l => {
    return (
      /^#+\s+[A-Z]/.test(l) ||                  // ## TITRE
      /^\*\*[^*]{5,80}\*\*$/.test(l) ||        // **TITRE**
      /^[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ\s]{5,70}$/.test(l.replace(/\*\*/g, '')) // TITRE MAJUSCULES
    ) && l.length < 100;
  };
 
  for (const line of lines) {
    if (/^-{3,}|^={3,}|^_{3,}/.test(line)) continue;
 
    if (isTitle(line)) {
      if (cur && cur.items.length > 0) sections.push(cur);
      const cleanTitle = line.replace(/^#+\s+/, '').replace(/\*\*/g, '').trim();
      cur = { title: cleanTitle, items: [], icon: '📋' };
    } else if (cur) {
      const clean = line.replace(/^[-•\d+.]\s*/, '').trim();
      if (clean && clean !== '--' && clean.length > 3) {
        cur.items.push(clean);
      }
    }
  }
 
  if (cur && cur.items.length > 0) sections.push(cur);
  return sections;
}

// ── Panel Analyse ─────────────────────────────────────────────
function AnalysePanel({ analysis, onImprove, improving, C, lang }) {
  if (!analysis) return null;
 
  const sections = parseSections(analysis);
  
  // Couleurs alternées
  const colors = [
    { bg: C.accentBg, border: C.accent, text: C.accent, icon: '📊' },
    { bg: C.blueBg, border: C.blue, text: C.blue, icon: '📋' },
    { bg: C.warnBg, border: C.warn, text: C.warn, icon: '⚠️' },
    { bg: C.dangerBg, border: C.danger, text: C.danger, icon: '❌' },
  ];
 
  return (
    <div style={{ marginTop: 28 }}>
      {/* Badge titre */}
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: C.accentBg, padding: '9px 24px', borderRadius: 30,
          border: `1px solid ${C.accent}`, fontSize: 14, fontWeight: 700,
          color: C.accent
        }}>
          📊 {lang === 'fr' ? "Résultat de l'analyse" : 'Analysis Result'}
        </span>
      </div>
 
      {/* Grid des sections */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 14, marginBottom: 24
      }}>
        {sections.map((sec, idx) => {
          const col = colors[idx % colors.length];
          return (
            <div key={idx} style={{
              background: col.bg,
              border: `1px solid ${col.border}33`,
              borderLeft: `4px solid ${col.border}`,
              borderRadius: 12,
              padding: '16px 18px',
              transition: 'all .2s'
            }}>
              {sec.title && (
                <div style={{
                  fontSize: 10, fontWeight: 700, color: col.text,
                  marginBottom: 10, textTransform: 'uppercase',
                  letterSpacing: '.1em', display: 'flex', gap: 6,
                  alignItems: 'center'
                }}>
                  <span>{col.icon}</span>
                  <span>{sec.title}</span>
                </div>
              )}
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {sec.items.map((item, j) => (
                  <li key={j} style={{
                    fontSize: 12, color: C.ink2, lineHeight: 1.6,
                    marginBottom: 5, paddingLeft: 13, position: 'relative'
                  }}>
                    <span style={{
                      position: 'absolute', left: 0, color: col.border,
                      fontWeight: 700
                    }}>›</span>
                    {item.replace(/^[-•]\s*/, '')}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
 
      {/* Bouton Améliorer */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button onClick={onImprove} disabled={improving} style={{
          padding: '13px 40px',
          background: improving ? C.ink3 : `linear-gradient(135deg, ${C.accent}, #0a3d20)`,
          color: '#fff', border: 'none', borderRadius: 12, fontSize: 14,
          fontWeight: 700, cursor: improving ? 'not-allowed' : 'pointer',
          fontFamily: C.fSans, display: 'flex', alignItems: 'center',
          gap: 10, boxShadow: improving ? 'none' : `0 6px 20px ${C.accent}55`,
          transition: 'all .3s',
        }}>
          {improving
            ? <>
              <span style={{
                width: 13, height: 13, border: '2px solid rgba(255,255,255,0.35)',
                borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
                animation: 'spin .7s linear infinite'
              }} />
              {lang === 'fr' ? 'Amélioration en cours...' : 'Improving...'}
            </>
            : <>✨ {lang === 'fr' ? "Améliorer avec l'IA" : 'Improve with AI'}</>
          }
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  WORKSPACE — MODE GÉNÉRER
// ═══════════════════════════════════════════════════════════════════════════
function WorkspaceGenerate({ content, setContent, docType, lang, C }) {
  const filename = docType === 'cv' ? 'CV_OppsTrack.pdf' : 'LM_OppsTrack.pdf';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Éditeur texte */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>
            {docType === 'cv' ? (lang === 'fr' ? 'Texte du CV' : 'CV Text') : (lang === 'fr' ? 'Texte de la Lettre' : 'Letter Text')}
          </span>
          <DownloadBtn content={content} filename={filename} docType={docType} lang={lang} C={C} />
        </div>
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={22}
          placeholder={lang === 'fr' ? 'Le contenu généré par IA apparaît ici. Vous pouvez le modifier avant de télécharger.' : 'AI-generated content appears here. You can edit it before downloading.'}
          style={{ width: '100%', padding: 14, border: `1px solid ${C.borderLight}`, borderRadius: 8, fontFamily: C.fSans, fontSize: 12, background: C.bgSecondary, color: C.ink, resize: 'vertical', outline: 'none', lineHeight: 1.7, boxSizing: 'border-box', flex: 1 }} />
      </div>
      {/* Aperçu Europass live */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
        <div style={{ display: 'flex', align: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>👁️ {lang === 'fr' ? 'Aperçu mis en forme' : 'Formatted Preview'}</span>
          <span style={{ fontSize: 11, color: C.ink3, marginLeft: 4, alignSelf: 'center' }}>— identique au PDF</span>
        </div>
        <LivePreview content={content} docType={docType} lang={lang} C={C} />
      </div>
    </div>
  );
}



// ═══════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function CVPage({ user, setView }) {
  const { theme } = useTheme();
  const C = tokens(theme);
  const { lang } = useT();

  const [step,           setStep]           = useState(0);
  const [scholarships,   setScholarships]   = useState([]);
  const [selectedBourse, setSelectedBourse] = useState(null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [selectedType,   setSelectedType]   = useState(null);
  const [cvContent,      setCvContent]      = useState('');
  const [lmContent,      setLmContent]      = useState('');
  const [loading,        setLoading]        = useState(false);
  const [loadingStep,    setLoadingStep]    = useState('');
  const [activeTab,      setActiveTab]      = useState('cv');
  const [workspaceMode,  setWorkspaceMode]  = useState(null); // 'generate' | 'import'
  const [showLoginModal, setShowLoginModal] = useState(false);
  const workspaceRef = useRef(null);
  const step2Ref     = useRef(null);
  const step3Ref     = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    axiosInstance.get(API_ROUTES.roadmap.byUser(user.id))
      .then(res => setScholarships((res.data.docs || []).map(d => ({ id: d.id, nom: d.nom, pays: d.pays || '', deadline: d.dateLimite || '' }))))
      .catch(() => setScholarships([]));
  }, [user?.id]);

  const scroll = (ref) => setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth' }), 80);

  const handleSelectBourse = (b) => { setSelectedBourse(b); setStep(1); scroll(step2Ref); };
  const handleSelectType   = (t) => { setSelectedType(t);   setStep(2); scroll(step3Ref); };

  const handleGenerate = async () => {
    if (!selectedBourse) return;
    setLoading(true); setLoadingStep(lang === 'fr' ? '🚀 Génération IA en cours...' : '🚀 Generating...');
    try {
      const result = await callN8N(user.id, selectedBourse.id, `generate_${selectedType}`);
      const text = typeof result === 'string' ? result : JSON.stringify(result);
      if (selectedType === 'cv') { setCvContent(text); setActiveTab('cv'); }
      else { setLmContent(text); setActiveTab('lm'); }
      setWorkspaceMode('generate'); setStep(3); scroll(workspaceRef);
    } catch (e) { alert('Erreur: ' + e.message); }
    setLoading(false);
  };

  const handleImport = () => {
    setWorkspaceMode('import'); setStep(3);
    setActiveTab(selectedType || 'cv');
    scroll(workspaceRef);
  };

  const filtered = scholarships.filter(s =>
    s.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.pays?.toLowerCase().includes(searchQuery.toLowerCase())
  );



if (!user) return (
      <>
        <RestrictedAccessCard
  pageName={lang === 'fr' ? 'CV & Lettre de motivation' : 'CV & Cover Letter'}
  icon="📄"
  onLoginClick={() => setShowLoginModal(true)}
/>
    {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} lang={lang} theme={theme} />}
  </>
);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.fSans }}>
      <div style={{ width: '85%', margin: '0 auto', padding: '40px 0 80px' }}>

        <h1 style={{ fontFamily: C.fSerif, fontSize: 40, fontWeight: 600, color: C.ink, margin: '0 0 6px' }}>
          {lang === 'fr' ? 'Gérez votre candidature' : 'Manage your application'}
        </h1>
        <p style={{ color: C.ink3, fontSize: 13, marginBottom: 28 }}>
          {lang === 'fr' ? 'Générez ou améliorez votre CV et lettre de motivation avec l\'IA — format Europass inclus.' : 'Generate or improve your CV and cover letter with AI — Europass format included.'}
        </p>

        <StepBar step={step > 2 ? 2 : step} C={C} />

        {/* ── ÉTAPE 1 ── */}
        <Card n={1} title={lang === 'fr' ? 'Choisir une bourse' : 'Choose a scholarship'} done={step >= 1} C={C}>
          {step >= 1 && selectedBourse ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderRadius: 10, background: C.accentBg, border: `1px solid ${C.accent}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{selectedBourse.nom}</div>
                <div style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{selectedBourse.pays}</div>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <DeadlineBadge deadline={selectedBourse.deadline} C={C} />
                <span onClick={() => { setSelectedBourse(null); setStep(0); }} style={{ fontSize: 12, color: C.accent, fontWeight: 600, cursor: 'pointer' }}>✎ {lang === 'fr' ? 'Changer' : 'Change'}</span>
              </div>
            </div>
          ) : (
            <>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'fr' ? '🔍 Rechercher une bourse...' : '🔍 Search a scholarship...'}
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 9, marginBottom: 12, fontFamily: C.fSans, fontSize: 14, outline: 'none', background: C.bgSecondary, color: C.ink, boxSizing: 'border-box' }} />
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {filtered.length === 0 && (
                  <div style={{ textAlign: 'center', color: C.ink3, padding: 24, fontSize: 13 }}>
                    {lang === 'fr' ? 'Aucune bourse dans votre roadmap.' : 'No scholarship in your roadmap.'}
                  </div>
                )}
                {filtered.map(s => (
                  <div key={s.id} onClick={() => handleSelectBourse(s)} style={{ padding: '12px 14px', borderRadius: 9, cursor: 'pointer', marginBottom: 4, background: selectedBourse?.id === s.id ? C.accentBg : 'transparent', border: `1px solid ${selectedBourse?.id === s.id ? C.accent : 'transparent'}`, transition: 'all .15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{s.nom}</div>
                        <div style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{s.pays}</div>
                      </div>
                      <DeadlineBadge deadline={s.deadline} C={C} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* ── ÉTAPE 2 ── */}
        {step >= 1 && (
          <div ref={step2Ref}>
            <Card n={2} title={lang === 'fr' ? 'Type de document' : 'Document type'} done={step >= 2} C={C}>
              <div style={{ display: 'flex', gap: 16 }}>
                <TypeCard icon="📄" label="CV" sub="Curriculum Vitae" selected={selectedType === 'cv'} onClick={() => handleSelectType('cv')} C={C} />
                <TypeCard icon="✉️" label={lang === 'fr' ? 'Lettre' : 'Letter'} sub={lang === 'fr' ? 'Lettre de motivation' : 'Cover letter'} selected={selectedType === 'lm'} onClick={() => handleSelectType('lm')} C={C} />
              </div>
            </Card>
          </div>
        )}

        {/* ── ÉTAPE 3 ── */}
        {step >= 2 && (
          <div ref={step3Ref}>
            <Card n={3} title={lang === 'fr' ? 'Choisir une action' : 'Choose an action'} done={step >= 3} C={C}>
              <div style={{ display: 'flex', gap: 14 }}>
                <ActionCard
                  icon="📂"
                  label={lang === 'fr' ? 'Importer & Analyser' : 'Import & Analyze'}
                  desc={lang === 'fr' ? "Importez votre document, obtenez une analyse IA détaillée et générez une version améliorée" : "Import your document, get detailed AI analysis and generate an improved version"}
                  onClick={handleImport} C={C}
                />
                <ActionCard
                  icon="✨"
                  label={lang === 'fr' ? 'Générer & Télécharger' : 'Generate & Download'}
                  desc={lang === 'fr' ? "Générez un document IA sur-mesure et téléchargez-le en PDF format Europass" : "Generate a tailor-made AI document and download it as Europass-format PDF"}
                  onClick={handleGenerate} C={C}
                />
              </div>
            </Card>
          </div>
        )}

        {/* ── WORKSPACE ── */}
        {step >= 3 && (
          <div ref={workspaceRef}>
            {/* Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${C.border}`, marginBottom: 22 }}>
              {[{ id: 'cv', label: '📄 CV' }, { id: 'lm', label: '✉️ ' + (lang === 'fr' ? 'Lettre' : 'Letter') }].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: '11px 24px', background: 'transparent',
                  color: activeTab === tab.id ? C.ink : C.ink3,
                  borderBottom: activeTab === tab.id ? `2.5px solid ${C.accent}` : '2.5px solid transparent',
                  border: 'none', cursor: 'pointer', fontWeight: activeTab === tab.id ? 700 : 400,
                  fontFamily: C.fSans, fontSize: 13, transition: 'color .2s',
                }}>{tab.label}</button>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, padding: '4px 14px', borderRadius: 20, background: workspaceMode === 'generate' ? C.accentBg : C.blueBg, color: workspaceMode === 'generate' ? C.accent : C.blue }}>
                {workspaceMode === 'generate' ? (lang === 'fr' ? '✨ Mode Génération' : '✨ Generate mode') : (lang === 'fr' ? '📂 Mode Import' : '📂 Import mode')}
              </span>
            </div>

            {workspaceMode === 'generate' && activeTab === 'cv' && <WorkspaceGenerate content={cvContent} setContent={setCvContent} docType="cv" lang={lang} C={C} />}
            {workspaceMode === 'generate' && activeTab === 'lm' && <WorkspaceGenerate content={lmContent} setContent={setLmContent} docType="lm" lang={lang} C={C} />}
           {workspaceMode === 'import' && activeTab === 'cv' && 
  <Workspaceimport user={user} bourse={selectedBourse} content={cvContent} 
    setContent={setCvContent} docType="cv" setLoading={setLoading} 
    setLoadingStep={setLoadingStep} lang={lang} C={C} />}

{workspaceMode === 'import' && activeTab === 'lm' && 
  <Workspaceimport user={user} bourse={selectedBourse} content={lmContent} 
    setContent={setLmContent} docType="lm" setLoading={setLoading} 
    setLoadingStep={setLoadingStep} lang={lang} C={C} />}
    </div>
        )}
      </div>

      {/* Loading toast */}
      {loading && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, background: C.ink, color: '#fff', padding: '13px 24px', borderRadius: 40, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.35)' }}>
          <Spinner /> {loadingStep}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; } }
      `}</style>
    </div>
  );
}