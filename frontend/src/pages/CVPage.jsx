import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';
import axios from 'axios';

// ═══════════════════════════════════════════════════════════════════════════
//  N8N WEBHOOK - ULTRA SIMPLIFIÉ
// ═══════════════════════════════════════════════════════════════════════════
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/webhook';

async function callN8N(userId, bourseId, context) {
  console.log('📤 Appel N8N:', { userId, bourseId, context });
  
  try {
    const response = await axios.post(N8N_WEBHOOK_URL, {
      userId: userId,
      bourseId: bourseId,
      context: context,
      timestamp: new Date().toISOString(),
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000
    });

    console.log('✅ Réponse N8N complète:', response);
    console.log('✅ response.data:', response.data);
    
    // Extraire le contenu
    const result = response.data.output || response.data.message || response.data;
    
    console.log('✅ Result extrait:', result);
    console.log('Type:', typeof result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Erreur N8N:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════

const tokens = (theme) => ({
  bg: theme === "dark" ? "#15140f" : "#F5F2EC",
  bgCard: theme === "dark" ? "#1a1912" : "#FFFFFF",
  bgSecondary: theme === "dark" ? "#24231c" : "#FAFAF7",
  border: theme === "dark" ? "#2b2a22" : "#E8E3D9",
  borderLight: theme === "dark" ? "#24231c" : "#EEE9E0",
  accent: "#1A6B3C",
  accentBg: theme === "dark" ? "rgba(26,107,60,0.15)" : "#E8F3ED",
  blue: "#2B5BA8",
  blueBg: theme === "dark" ? "rgba(43,91,168,0.15)" : "#EEF3FB",
  ink: theme === "dark" ? "#f2efe7" : "#1A1A1A",
  ink2: theme === "dark" ? "#cfccc2" : "#4A4A4A",
  ink3: theme === "dark" ? "#a19f96" : "#8A8A8A",
  warn: "#B06A12",
  warnBg: theme === "dark" ? "rgba(176,106,18,0.15)" : "#FFF3E0",
  danger: "#B43030",
  dangerBg: theme === "dark" ? "rgba(180,48,48,0.15)" : "#FFEBEB",
  fSerif: "'Playfair Display', Georgia, serif",
  fSans: "'DM Sans', 'Helvetica Neue', sans-serif",
});

function daysLeft(deadline) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline) - new Date()) / 86400000);
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StepBar({ step, C }) {
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
          {i < 2 && <div style={{ flex: 1, height: 1, background: i < step ? C.ink : C.border, transition: 'background .5s' }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function DeadlineBadge({ deadline, C }) {
  const days = daysLeft(deadline);
  if (days === null) return null;
  const urgent = days <= 7;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: urgent ? C.dangerBg : C.accentBg, color: urgent ? C.danger : C.accent }}>
      {urgent ? '🔴' : '📅'} {fmtDate(deadline)}
    </span>
  );
}

function SmallBtn({ children, onClick, primary = false, disabled = false, C }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '6px 14px', background: primary ? C.accent : 'transparent',
      color: primary ? '#fff' : C.accent, border: `1px solid ${C.accent}`,
      borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: C.fSans, opacity: disabled ? 0.45 : 1, transition: 'all .2s', whiteSpace: 'nowrap',
    }}>{children}</button>
  );
}

function Card({ n, title, done = false, children, C }) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: '22px 28px', marginBottom: 16, animation: 'fadeSlide .35s ease',
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

function TypeCard({ icon, label, sub, selected, onClick, C }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, padding: '18px 16px', borderRadius: 10, cursor: 'pointer',
      border: selected ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
      background: selected ? C.accentBg : C.bgCard, transition: 'all .2s',
    }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, color: C.ink3 }}>{sub}</div>
    </div>
  );
}

function ActionCard({ icon, label, desc, onClick, C }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      flex: 1, minWidth: 0, padding: '18px 14px', borderRadius: 10,
      border: `1px solid ${hov ? '#ccc8c0' : C.border}`, background: hov ? C.bgSecondary : C.bgCard,
      textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
    }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: C.ink3, lineHeight: 1.4 }}>{desc}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  WORKSPACE
// ═══════════════════════════════════════════════════════════════════════════

function Workspace({ user, bourse, content, setContent, docType, setLoading, setLoadingStep, C, lang }) {
  const [analysis, setAnalysis] = useState(null);
  const fileRef = useRef(null);

  const handleAnalyze = async () => {
    if (!content) {
      alert(lang === 'fr' ? 'Veuillez d\'abord importer ou coller votre document' : 'Please import or paste your document');
      return;
    }
    
    setLoading(true);
    setLoadingStep(lang === 'fr' ? '📊 Analyse en cours...' : 'Analyzing...');
    
    try {
      const result = await callN8N(user?.id, bourse?.id, `analyze_${docType}`);
      console.log('✅ Analyse reçue:', result);
      setAnalysis(result);
    } catch (e) {
      alert(lang === 'fr' ? 'Erreur lors de l\'analyse' : 'Analysis error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    setLoading(true);
    setLoadingStep(lang === 'fr' ? '📄 Extraction...' : 'Extracting...');
    try {
      const text = await file.text();
      setContent(text);
    } catch (err) {
      alert(lang === 'fr' ? 'Erreur lecture fichier' : 'File reading error');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
            {docType === 'cv' ? (lang === 'fr' ? 'Contenu CV' : 'CV Content') : (lang === 'fr' ? 'Contenu Lettre' : 'Letter Content')}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <SmallBtn onClick={handleAnalyze} disabled={!content} C={C}>
              {lang === 'fr' ? '📊 Analyser' : '📊 Analyze'}
            </SmallBtn>
            <label style={{
              padding: '6px 14px', border: `1px solid ${C.accent}`, borderRadius: 6,
              fontSize: 11, fontWeight: 600, color: C.accent, cursor: 'pointer', fontFamily: C.fSans, whiteSpace: 'nowrap',
            }}>
              📂 {lang === 'fr' ? 'Importer' : 'Import'}
              <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".pdf,.txt"
                onChange={async e => { const file = e.target.files[0]; if (file) await handleFileUpload(file); }} />
            </label>
          </div>
        </div>
        <textarea 
          value={content} 
          onChange={e => setContent(e.target.value)} 
          rows={18}
          placeholder={lang === 'fr' ? 'Collez votre document...' : 'Paste your document...'}
          style={{
            width: '100%', padding: 14, border: `1px solid ${C.borderLight}`, borderRadius: 8,
            fontFamily: C.fSans, fontSize: 13, background: C.bgSecondary, color: C.ink,
            resize: 'vertical', outline: 'none', lineHeight: 1.6,
          }} 
        />
        {analysis && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: C.ink }}>
              {lang === 'fr' ? '📊 Analyse' : '📊 Analysis'}
            </div>
            <p style={{ fontSize: 12, color: C.ink2 }}>{analysis}</p>
          </div>
        )}
      </div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 14 }}>
          {lang === 'fr' ? '👁️ Aperçu' : '👁️ Preview'}
        </div>
        {content ? (
          <div style={{ background: C.bgSecondary, padding: 14, borderRadius: 8, fontSize: 12, color: C.ink2, lineHeight: 1.7, maxHeight: 380, overflowY: 'auto' }}>
            {(content || '').toString().split('\n').map((l, i) => <div key={i}>{l || '\u00A0'}</div>)}

          </div>
        ) : (
          <div style={{ textAlign: 'center', color: C.ink3, padding: 60, fontSize: 13 }}>
            {lang === 'fr' ? '📭 Aucun document' : '📭 No document'}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════

export default function CVPage({ user, setView }) {
  const { theme } = useTheme();
  const C = tokens(theme);
  const { lang } = useT();

  const [step, setStep] = useState(0);
  const [scholarships, setScholarships] = useState([]);
  const [selectedBourse, setSelectedBourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [cvContent, setCvContent] = useState('');
  const [lmContent, setLmContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [activeTab, setActiveTab] = useState('cv');
  const workspaceRef = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);

  // Charger les bourses du roadmap
  useEffect(() => {
    if (!user?.id) return;
    axiosInstance.get(API_ROUTES.roadmap.byUser(user.id))
      .then(res => {
        const docs = (res.data.docs || []).map(d => ({
          id: d.id,
          nom: d.nom,
          pays: d.pays || '',
          deadline: d.dateLimite || '',
        }));
        console.log('✅ Bourses chargées:', docs);
        setScholarships(docs);
      })
      .catch(err => {
        console.error('❌ Erreur:', err);
        setScholarships([]);
      });
  }, [user?.id]);

  const handleSelectBourse = (bourse) => {
    setSelectedBourse(bourse);
    setStep(1);
    setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    setStep(2);
    setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  };

  // ✅ GÉNÉRER: Appel N8N uniquement
  const handleGenerate = async () => {
    if (!selectedBourse) {
      alert(lang === 'fr' ? 'Sélectionnez une bourse' : 'Select a scholarship');
      return;
    }

    setLoading(true);
    setLoadingStep(lang === 'fr' ? '🚀 Génération N8N...' : '🚀 Generating with N8N...');

    try {
      const result = await callN8N(user.id, selectedBourse.id, `generate_${selectedType}`);
      
      if (selectedType === 'cv') {
        setCvContent(result);
        setActiveTab('cv');
      } else {
        setLmContent(result);
        setActiveTab('lm');
      }

      setStep(3);
      setTimeout(() => workspaceRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
    } catch (error) {
      alert(lang === 'fr' ? `Erreur: ${error.message}` : `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    setStep(3);
    setActiveTab(selectedType || 'cv');
    setTimeout(() => workspaceRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const filtered = scholarships.filter(s =>
    s.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.pays?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 48, maxWidth: 380, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📄</div>
          <h3 style={{ fontFamily: C.fSerif, fontSize: 22, color: C.ink, marginBottom: 10 }}>
            {lang === 'fr' ? 'Accès restreint' : 'Restricted access'}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.fSans }}>
      <div style={{ width: '85%', margin: '0 auto', padding: '40px 0 80px' }}>
        <h1 style={{ fontFamily: C.fSerif, fontSize: 40, fontWeight: 600, color: C.ink, margin: '0 0 4px' }}>
          {lang === 'fr' ? 'Générez votre candidature' : 'Generate your application'}
        </h1>

        <StepBar step={step > 2 ? 2 : step} C={C} />

        {/* ÉTAPE 1 */}
        <Card n={1} title={lang === 'fr' ? 'Choisir une bourse' : 'Choose a scholarship'} done={step >= 1} C={C}>
          {step >= 1 && selectedBourse ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderRadius: 10, background: C.accentBg, border: `1px solid ${C.accent}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{selectedBourse.nom}</div>
                <div style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{selectedBourse.pays}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <DeadlineBadge deadline={selectedBourse.deadline} C={C} />
                <span onClick={() => { setSelectedBourse(null); setStep(0); }} style={{ fontSize: 12, color: C.accent, fontWeight: 600, cursor: 'pointer' }}>
                  ✎️ {lang === 'fr' ? 'Changer' : 'Change'}
                </span>
              </div>
            </div>
          ) : (
            <>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'fr' ? 'Rechercher...' : 'Search...'}
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 9, marginBottom: 12, fontFamily: C.fSans, fontSize: 14, outline: 'none' }}
              />
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {filtered.map(s => (
                  <div key={s.nom} onClick={() => handleSelectBourse(s)} style={{
                    padding: '12px 14px', borderRadius: 9, cursor: 'pointer', marginBottom: 4,
                    background: selectedBourse?.nom === s.nom ? C.accentBg : 'transparent',
                    border: `1px solid ${selectedBourse?.nom === s.nom ? C.accent : 'transparent'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{s.nom}</div>
                        <div style={{ fontSize: 12, color: C.ink3, marginTop: 1 }}>{s.pays}</div>
                      </div>
                      <DeadlineBadge deadline={s.deadline} C={C} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* ÉTAPE 2 */}
        {step >= 1 && (
          <div ref={step2Ref}>
            <Card n={2} title={lang === 'fr' ? 'Type de document' : 'Document type'} done={step >= 2} C={C}>
              <div style={{ display: 'flex', gap: 16 }}>
                <TypeCard icon="📄" label="CV" sub={lang === 'fr' ? 'Générer un CV' : 'Generate a CV'} selected={selectedType === 'cv'} onClick={() => handleSelectType('cv')} C={C} />
                <TypeCard icon="✉️" label={lang === 'fr' ? 'Lettre' : 'Letter'} sub={lang === 'fr' ? 'Générer une lettre' : 'Generate a letter'} selected={selectedType === 'lm'} onClick={() => handleSelectType('lm')} C={C} />
              </div>
            </Card>
          </div>
        )}

        {/* ÉTAPE 3 */}
        {step >= 2 && (
          <div ref={step3Ref}>
            <Card n={3} title={lang === 'fr' ? 'Choisir une action' : 'Choose an action'} done={step >= 3} C={C}>
              <div style={{ display: 'flex', gap: 14 }}>
                <ActionCard icon="📂" label={lang === 'fr' ? 'Importer' : 'Import'} desc={lang === 'fr' ? 'Importer un document' : 'Import a document'} onClick={handleImport} C={C} />
                <ActionCard icon="✨" label={lang === 'fr' ? 'Générer' : 'Generate'} desc="N8N + Claude" onClick={handleGenerate} C={C} />
              </div>
            </Card>
          </div>
        )}

        {/* WORKSPACE */}
        {step >= 3 && (
          <div ref={workspaceRef}>
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
              {[
                { id: 'cv', label: '📄 CV' },
                { id: 'lm', label: '✉️ Lettre' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: '11px 22px', background: 'transparent',
                  color: activeTab === tab.id ? C.ink : C.ink3,
                  borderBottom: activeTab === tab.id ? `2px solid ${C.accent}` : '2px solid transparent',
                  border: 'none', cursor: 'pointer', fontWeight: activeTab === tab.id ? 700 : 400,
                  fontFamily: C.fSans, fontSize: 13,
                }}>
                  {tab.label}
                </button>
              ))}
            </div>
            {activeTab === 'cv' && <Workspace user={user} bourse={selectedBourse} content={cvContent} setContent={setCvContent} docType="cv" setLoading={setLoading} setLoadingStep={setLoadingStep} C={C} lang={lang} />}
            {activeTab === 'lm' && <Workspace user={user} bourse={selectedBourse} content={lmContent} setContent={setLmContent} docType="lm" setLoading={setLoading} setLoadingStep={setLoadingStep} C={C} lang={lang} />}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, background: C.ink, color: '#fff', padding: '13px 24px', borderRadius: 40, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
          {loadingStep}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; } }`}</style>
    </div>
  );
}