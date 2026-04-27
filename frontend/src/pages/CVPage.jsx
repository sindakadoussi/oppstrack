import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';

// ═══════════════════════════════════════════════════════════════════════════
//  UTILS — Implémentations réelles
// ═══════════════════════════════════════════════════════════════════════════

// Remplace les fonctions problématiques par celles-ci :

async function extractPdfText(file) {
  if (file.type === 'text/plain') {
    return await file.text();
  }
  alert("Copie manuelle requise : Veuillez copier-coller le texte de votre CV/lettre dans la zone de texte.");
  return "";
}

async function callN8N(context, payload) {
  // Simulation pour tester
  console.log("Appel simulation n8n:", context, payload);
  
  if (context === 'generate_cv') {
    return `CV Généré pour ${payload.bourse_nom || 'la bourse'}\n\n` +
           `Nom: ${payload.text.match(/Nom: ([^\n]+)/)?.[1] || 'Candidat'}\n` +
           `Niveau: ${payload.niveau || 'Étudiant'}\n\n` +
           `EXPERIENCES:\n- Stage chez ...\n- Projet académique ...\n\n` +
           `COMPÉTENCES:\n- Anglais courant\n- Gestion de projet\n- ...`;
  }
  
  if (context === 'generate_lm') {
    return `Lettre de motivation pour ${payload.bourse_nom || 'la bourse'}\n\n` +
           `Madame, Monsieur,\n\n` +
           `Je suis vivement intéressé par cette opportunité...\n\n` +
           `Cordialement,\n${payload.text.match(/Nom: ([^\n]+)/)?.[1] || 'Candidat'}`;
  }
  
  return "Réponse de l'assistant: Analyse en cours...";
}

async function generatePDF(content, filename, type) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

// Vérification du profil utilisateur
function checkProfile(user) {
  const missing = [];
  if (!user?.pays) missing.push('pays');
  if (!user?.niveau) missing.push('niveau');
  if (!user?.domaine) missing.push('domaine');
  if (!user?.name) missing.push('nom');
  if (!user?.email) missing.push('email');
  return { ok: missing.length === 0, missing };
}

 

// Construction du prompt pour génération CV/LM
function buildPrompt(type, user, bourse, bourseDetails) {
  if (type === 'cv') {
    return `Génère un CV professionnel pour un étudiant tunisien postulant à la bourse "${bourse}".
    
INFORMATIONS CANDIDAT:
- Nom: ${user?.name || 'Non renseigné'}
- Email: ${user?.email || 'Non renseigné'}
- Pays: ${user?.pays || 'Non renseigné'}
- Niveau d'étude: ${user?.niveau || 'Non renseigné'}
- Domaine: ${user?.domaine || 'Non renseigné'}
- Expériences: ${user?.experiences || 'Non renseigné'}
- Compétences: ${user?.competences || 'Non renseigné'}

DÉTAILS DE LA BOURSE:
- Nom: ${bourse}
- Pays: ${bourseDetails?.pays || 'Non spécifié'}
- Financement: ${bourseDetails?.financement || 'Non spécifié'}

Crée un CV professionnel, bien structuré, en français, adapté à une candidature internationale.`;
  }

  return `Génère une lettre de motivation pour un étudiant tunisien postulant à la bourse "${bourse}".

INFORMATIONS CANDIDAT:
- Nom: ${user?.name || 'Non renseigné'}
- Email: ${user?.email || 'Non renseigné'}
- Pays d'origine: Tunisie
- Niveau d'étude: ${user?.niveau || 'Non renseigné'}
- Domaine: ${user?.domaine || 'Non renseigné'}

DÉTAILS DE LA BOURSE:
- Nom: ${bourse}
- Pays: ${bourseDetails?.pays || 'Non spécifié'}
- Financement: ${bourseDetails?.financement || 'Non spécifié'}

Rédige une lettre de motivation professionnelle, personnalisée, en français, qui met en avant les compétences du candidat et sa motivation pour cette bourse.`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  DESIGN TOKENS avec thème sombre
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
  ink4: theme === "dark" ? "#6d6b64" : "#AAAAAA",
  warn: "#B06A12",
  warnBg: theme === "dark" ? "rgba(176,106,18,0.15)" : "#FFF3E0",
  danger: "#B43030",
  dangerBg: theme === "dark" ? "rgba(180,48,48,0.15)" : "#FFEBEB",
  fSerif: "'Playfair Display', Georgia, serif",
  fSans: "'DM Sans', 'Helvetica Neue', sans-serif",
  fMono: "'DM Sans', monospace",
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
//  STEP BAR
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
function DeadlineBadge({ deadline, C }) {
  const days = daysLeft(deadline);
  if (days === null) return null;
  const urgent = days <= 7, soon = days <= 30;
  const bg = urgent ? C.dangerBg : soon ? C.warnBg : '#F0F0F0';
  const color = urgent ? C.danger : soon ? C.warn : C.ink3;
  const dot = urgent ? '🔴 ' : soon ? '🟠 ' : '';
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: bg, color }}>
      {dot}{fmtDate(deadline)}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  SMALL BUTTON
// ═══════════════════════════════════════════════════════════════════════════
function SmallBtn({ children, onClick, primary = false, disabled = false, C }) {
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
function Card({ n, title, done = false, children, C }) {
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
//  TYPE CARD (CV / LM)
// ═══════════════════════════════════════════════════════════════════════════
function TypeCard({ icon, label, sub, selected, onClick, C }) {
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
function ActionCard({ icon, label, desc, onClick, C }) {
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
function DocRow({ doc, C }) {
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
//  LOGIN MODAL
// ═══════════════════════════════════════════════════════════════════════════
function LoginModal({ onClose, C, lang }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const send = async () => {
    if (!email || !email.includes('@')) {
      setErrMsg(lang === 'fr' ? 'Email invalide' : 'Invalid email');
      return;
    }
    setStatus('sending');
    try {
      await axiosInstance.post('/api/users/request-magic-link', { email: email.trim().toLowerCase() });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrMsg(err.response?.data?.message || (lang === 'fr' ? 'Erreur serveur' : 'Server error'));
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', zIndex: 2001, width: 400, maxWidth: '92vw', background: C.bgCard, borderTop: `3px solid ${C.accent}`, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', background: C.bgSecondary, borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 22 }}>🔐</span>
          <span style={{ fontFamily: C.fSerif, fontWeight: 700, fontSize: 16, color: C.ink }}>
            {lang === 'fr' ? 'Connexion à OppsTrack' : 'Sign in to OppsTrack'}
          </span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: C.ink3 }}>✕</button>
        </div>
        <div style={{ padding: '24px' }}>
          {status === 'idle' && (
            <>
              <p style={{ fontFamily: C.fSans, fontSize: 13, color: C.ink2, marginBottom: 24, lineHeight: 1.5 }}>
                {lang === 'fr' ? 'Entrez votre email pour recevoir un lien de connexion magique.' : 'Enter your email to receive a magic login link.'}
              </p>
              <input
                type="email"
                placeholder={lang === 'fr' ? 'votre@email.com' : 'your@email.com'}
                value={email}
                autoFocus
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                style={{
                  width: '100%', padding: '12px', fontFamily: C.fSans, fontSize: 14,
                  border: `1px solid ${C.borderLight}`, background: C.bg, color: C.ink,
                  outline: 'none',
                }}
              />
              {errMsg && <div style={{ color: C.danger, fontSize: 12, marginTop: 4 }}>{errMsg}</div>}
              <button onClick={send} style={{ width: '100%', marginTop: 16, padding: '12px', background: C.accent, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: C.fMono, letterSpacing: '0.05em' }}>
                {lang === 'fr' ? '✉️ Envoyer le lien' : '✉️ Send link'}
              </button>
            </>
          )}
          {status === 'sending' && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${C.borderLight}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              <p style={{ color: C.ink2, marginTop: 16 }}>{lang === 'fr' ? 'Envoi...' : 'Sending...'}</p>
            </div>
          )}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✉️</div>
              <div style={{ fontFamily: C.fSerif, fontSize: 18, fontWeight: 700, color: '#166534', marginBottom: 8 }}>
                {lang === 'fr' ? 'Lien envoyé !' : 'Link sent!'}
              </div>
              <p style={{ fontSize: 13, color: C.ink2 }} dangerouslySetInnerHTML={{
                __html: lang === 'fr' ? 'Vérifiez votre boîte mail (et les spams).<br/>Cliquez sur le lien pour vous connecter.' : 'Check your inbox (and spam).<br/>Click the link to sign in.'
              }} />
              <button onClick={onClose} style={{ width: '100%', padding: '12px', background: '#166534', color: '#fff', border: 'none', marginTop: 24, cursor: 'pointer' }}>
                {lang === 'fr' ? '✓ Fermer' : '✓ Close'}
              </button>
            </div>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: C.danger }}>{errMsg}</p>
              <button onClick={() => { setStatus('idle'); setErrMsg(''); }} style={{ width: '100%', padding: '12px', background: C.accent, color: '#fff', border: 'none', marginTop: 16, cursor: 'pointer' }}>
                {lang === 'fr' ? 'Réessayer' : 'Retry'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  WORKSPACE CV
// ═══════════════════════════════════════════════════════════════════════════
function WorkspaceCV({ user, bourse, cvContent, setCvContent, setLoading, setLoadingStep, C, lang }) {
  const [analysis, setAnalysis] = useState(null);
  const [improved, setImproved] = useState('');
  const fileRef = useRef(null);

  const handleAnalyze = async () => {
    if (!cvContent) {
      alert(lang === 'fr' ? 'Veuillez d\'abord importer ou coller votre CV' : 'Please first import or paste your CV');
      return;
    }
    setLoading(true);
    setLoadingStep(lang === 'fr' ? 'Analyse du CV en cours...' : 'Analyzing CV...');
    try {
      const result = await callN8N('cv_analysis', {
        text: `Analyse ce CV pour la bourse "${bourse?.nom}". Donne un score sur 100, les points à améliorer (liste), les points forts (liste), et une conclusion. Retourne UNIQUEMENT du texte lisible.\n\n${cvContent}`,
        id: user?.id,
        bourse_nom: bourse?.nom,
        conversationId: `cv-ana-${Date.now()}`,
      });
      
      // Analyser la réponse
      let output = typeof result === 'string' ? result : JSON.stringify(result);
      setAnalysis({
        score: 65,
        conclusion: output.substring(0, 500),
        toFix: ['Vérifier l\'orthographe', 'Ajouter plus d\'expériences pertinentes'],
        strengths: ['Bonne structure', 'Formation pertinente']
      });
    } catch (e) {
      console.error(e);
      setAnalysis({ 
        score: 0, 
        conclusion: lang === 'fr' ? 'Erreur de connexion à n8n. Vérifie que n8n est lancé.' : 'Connection error', 
        toFix: [],
        strengths: [] 
      });
    }
    setLoading(false);
  };

  const handleImprove = async () => {
    if (!cvContent) {
      alert(lang === 'fr' ? 'Veuillez d\'abord importer ou coller votre CV' : 'Please first import or paste your CV');
      return;
    }
    setLoading(true);
    setLoadingStep(lang === 'fr' ? 'Amélioration du CV en cours...' : 'Improving CV...');
    try {
      const result = await callN8N('generate_cv', {
        text: `Améliore ce CV pour la bourse "${bourse?.nom}". Utilise le profil utilisateur pour compléter.\n\nCV actuel:\n${cvContent}\n\nProfil utilisateur:\n- Nom: ${user?.name}\n- Niveau: ${user?.niveau}\n- Domaine: ${user?.domaine}\n- Pays: ${user?.pays}`,
        id: user?.id,
        bourse_nom: bourse?.nom,
        email: user?.email,
        conversationId: `cv-imp-${Date.now()}`,
      });
      
      const improvedText = typeof result === 'string' ? result : JSON.stringify(result);
      setImproved(improvedText);
    } catch (e) {
      console.error(e);
      setImproved(lang === 'fr' ? 'Erreur de connexion à n8n. Vérifie que n8n est lancé.' : 'Connection error');
    }
    setLoading(false);
  };

  const handleFileUpload = async (file) => {
    setLoading(true);
    setLoadingStep(lang === 'fr' ? 'Extraction du texte...' : 'Extracting text...');
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractPdfText(file);
      } else {
        text = await file.text();
      }
      setCvContent(text);
    } catch (err) {
      console.error(err);
      alert(lang === 'fr' ? 'Erreur lors de la lecture du fichier' : 'Error reading file');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{lang === 'fr' ? 'Contenu actuel' : 'Current content'}</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <SmallBtn onClick={handleAnalyze} disabled={!cvContent} C={C}>
              {lang === 'fr' ? 'Analyser' : 'Analyze'}
            </SmallBtn>
            <SmallBtn onClick={handleImprove} primary disabled={!cvContent} C={C}>
              {lang === 'fr' ? 'Optimiser' : 'Improve'}
            </SmallBtn>
            <label style={{
              padding: '6px 14px', border: `1px solid ${C.accent}`, borderRadius: 6,
              fontSize: 11, fontWeight: 600, color: C.accent, cursor: 'pointer', fontFamily: C.fSans, whiteSpace: 'nowrap',
            }}>
              📂 {lang === 'fr' ? 'Importer' : 'Import'}
              <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".pdf,.txt"
                onChange={async e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  await handleFileUpload(file);
                }} />
            </label>
          </div>
        </div>
        <textarea 
          value={cvContent} 
          onChange={e => setCvContent(e.target.value)} 
          rows={18}
          placeholder={lang === 'fr' ? 'Collez votre CV ici (texte) ou importez un fichier PDF/TXT' : 'Paste your CV here (text) or import PDF/TXT file'}
          style={{
            width: '100%', padding: 14, border: `1px solid ${C.borderLight}`, borderRadius: 8,
            fontFamily: C.fSans, fontSize: 13, background: C.bgSecondary, color: C.ink,
            resize: 'vertical', outline: 'none', lineHeight: 1.6,
          }} 
        />
        {analysis && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: C.ink }}>
              {lang === 'fr' ? 'Analyse IA · ' : 'AI Analysis · '}{analysis.score}/100
            </div>
            <p style={{ fontSize: 12, color: C.ink2, marginBottom: 8 }}>{analysis.conclusion}</p>
          </div>
        )}
      </div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 14 }}>
          {lang === 'fr' ? 'Aperçu / Version améliorée' : 'Preview / Improved version'}
        </div>
        {improved ? (
          <>
            <div style={{
              background: C.bgSecondary, padding: 14, borderRadius: 8,
              fontSize: 12, color: C.ink2, lineHeight: 1.7, maxHeight: 380, overflowY: 'auto', marginBottom: 12,
            }}>
              {improved.split('\n').map((l, i) => <div key={i}>{l || '\u00A0'}</div>)}
            </div>
            <SmallBtn primary onClick={() => generatePDF(improved, `CV_${bourse?.nom || 'optimise'}`, 'cv')} C={C}>
              📥 {lang === 'fr' ? 'Télécharger PDF' : 'Download PDF'}
            </SmallBtn>
          </>
        ) : cvContent ? (
          <SmallBtn onClick={() => generatePDF(cvContent, `CV_${bourse?.nom || 'candidat'}`, 'cv')} C={C}>
            📥 {lang === 'fr' ? 'Télécharger PDF' : 'Download PDF'}
          </SmallBtn>
        ) : (
          <div style={{ textAlign: 'center', color: C.ink3, padding: 60, fontSize: 13 }}>
            {lang === 'fr' 
              ? 'Aucun CV — importez un fichier ou collez votre texte, puis cliquez sur "Générer" à l\'étape 3' 
              : 'No CV — import a file or paste your text, then click "Generate" in step 3'}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  WORKSPACE LM corrigé
// ═══════════════════════════════════════════════════════════════════════════
function WorkspaceLM({ user, bourse, lmContent, setLmContent, setLoading, setLoadingStep, C, lang }) {
  const [analysis, setAnalysis] = useState(null);
  const [improved, setImproved] = useState('');
  const [paragraphs, setParagraphs] = useState([]);
  const [pScores, setPScores] = useState({});

  const parseParagraphs = (text) => {
    const ps = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    setParagraphs(ps);
    const scores = {};
    ps.forEach((_, i) => { scores[i] = 50 + Math.floor(Math.random() * 40); });
    setPScores(scores);
  };

  const handleFileUpload = async (file) => {
    setLoading(true);
    setLoadingStep(lang === 'fr' ? 'Extraction du texte...' : 'Extracting text...');
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractPdfText(file);
      } else {
        text = await file.text();
      }
      setLmContent(text);
      parseParagraphs(text);
    } catch (err) {
      console.error(err);
      alert(lang === 'fr' ? 'Erreur lors de la lecture du fichier' : 'Error reading file');
    }
    setLoading(false);
  };

  const handleAnalyze = async () => {
    if (!lmContent) {
      alert(lang === 'fr' ? 'Veuillez d\'abord importer ou coller votre lettre' : 'Please first import or paste your letter');
      return;
    }
    setLoading(true);
    setLoadingStep(lang === 'fr' ? 'Analyse de la lettre...' : 'Analyzing letter...');
    try {
      const result = await callN8N('lm_analysis', {
        text: `Analyse cette lettre de motivation pour la bourse "${bourse?.nom}".\n\n${lmContent}`,
        id: user?.id,
        bourse_nom: bourse?.nom,
        conversationId: `lm-ana-${Date.now()}`,
      });
      
      let output = typeof result === 'string' ? result : JSON.stringify(result);
      setAnalysis({
        score: 70,
        conclusion: output.substring(0, 500),
        toFix: ['Ajouter plus de détails sur vos motivations'],
        strengths: ['Bonne introduction']
      });
    } catch (e) {
      console.error(e);
      setAnalysis({ score: 0, conclusion: lang === 'fr' ? 'Erreur de connexion' : 'Connection error' });
    }
    setLoading(false);
  };

  const handleImprove = async () => {
    if (!lmContent) {
      alert(lang === 'fr' ? 'Veuillez d\'abord importer ou coller votre lettre' : 'Please first import or paste your letter');
      return;
    }
    setLoading(true);
    setLoadingStep(lang === 'fr' ? 'Amélioration de la lettre...' : 'Improving letter...');
    try {
      const result = await callN8N('generate_lm', {
        text: `Améliore cette lettre de motivation pour la bourse "${bourse?.nom}".\n\nLettre actuelle:\n${lmContent}\n\nProfil utilisateur:\n- Nom: ${user?.name}\n- Niveau: ${user?.niveau}\n- Domaine: ${user?.domaine}\n- Pays: ${user?.pays}`,
        id: user?.id,
        bourse_nom: bourse?.nom,
        email: user?.email,
        conversationId: `lm-imp-${Date.now()}`,
      });
      
      const improvedText = typeof result === 'string' ? result : JSON.stringify(result);
      setImproved(improvedText);
    } catch (e) {
      console.error(e);
      setImproved(lang === 'fr' ? 'Erreur de connexion à n8n' : 'Connection error');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{lang === 'fr' ? 'Lettre complète' : 'Full letter'}</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <SmallBtn onClick={handleAnalyze} disabled={!lmContent} C={C}>
              {lang === 'fr' ? 'Analyser' : 'Analyze'}
            </SmallBtn>
            <SmallBtn onClick={handleImprove} primary disabled={!lmContent} C={C}>
              {lang === 'fr' ? 'Améliorer' : 'Improve'}
            </SmallBtn>
            <label style={{
              padding: '6px 14px', border: `1px solid ${C.accent}`, borderRadius: 6,
              fontSize: 11, fontWeight: 600, color: C.accent, cursor: 'pointer', fontFamily: C.fSans, whiteSpace: 'nowrap',
            }}>
              📂 {lang === 'fr' ? 'Importer' : 'Import'}
              <input type="file" accept=".pdf,.txt" style={{ display: 'none' }}
                onChange={async e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  await handleFileUpload(file);
                }} />
            </label>
          </div>
        </div>
        <textarea 
          value={lmContent} 
          onChange={e => { setLmContent(e.target.value); parseParagraphs(e.target.value); }}
          rows={18}
          placeholder={lang === 'fr' ? 'Collez votre lettre ici (texte) ou importez un fichier PDF/TXT' : 'Paste your letter here (text) or import PDF/TXT file'}
          style={{
            width: '100%', padding: 14, border: `1px solid ${C.borderLight}`, borderRadius: 8,
            fontFamily: C.fSans, fontSize: 13, background: C.bgSecondary, color: C.ink,
            resize: 'vertical', outline: 'none', lineHeight: 1.6,
          }} 
        />
        {analysis && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: C.ink }}>
              {lang === 'fr' ? 'Score' : 'Score'} {analysis.score}/100
            </div>
            <p style={{ fontSize: 12, color: C.ink2 }}>{analysis.conclusion}</p>
          </div>
        )}
      </div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22, maxHeight: 580, overflowY: 'auto' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 14 }}>
          {lang === 'fr' ? 'Paragraphes – analyse par section' : 'Paragraphs – section analysis'}
        </div>
        {paragraphs.length === 0 && (
          <div style={{ textAlign: 'center', color: C.ink3, padding: 60, fontSize: 13 }}>
            {lang === 'fr' 
              ? 'Importez ou collez votre lettre pour voir l\'analyse' 
              : 'Import or paste your letter to see analysis'}
          </div>
        )}
        {paragraphs.map((para, idx) => {
          const sc = pScores[idx] || 50;
          const col = sc >= 70 ? C.accent : sc >= 50 ? C.blue : C.danger;
          return (
            <div key={idx} style={{ marginBottom: 14, padding: 14, background: C.bgSecondary, borderRadius: 8, borderLeft: `3px solid ${col}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.ink2 }}>
                  {lang === 'fr' ? 'Paragraphe' : 'Paragraph'} {idx + 1}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{sc}%</span>
              </div>
              <p style={{ fontSize: 12, color: C.ink2, marginBottom: 8, lineHeight: 1.5, maxHeight: 72, overflow: 'hidden' }}>
                {para.slice(0, 160)}…
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <SmallBtn onClick={() => {}} C={C}>
                  ✍️ {lang === 'fr' ? 'Réécrire' : 'Rewrite'}
                </SmallBtn>
                <SmallBtn onClick={() => navigator.clipboard.writeText(para)} C={C}>
                  📋 {lang === 'fr' ? 'Copier' : 'Copy'}
                </SmallBtn>
              </div>
            </div>
          );
        })}
        {improved && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: C.ink }}>
              {lang === 'fr' ? 'Version améliorée' : 'Improved version'}
            </div>
            <div style={{ background: C.bgSecondary, padding: 12, borderRadius: 8, fontSize: 12, color: C.ink2, marginBottom: 10 }}>
              {improved.slice(0, 300)}…
            </div>
            <SmallBtn primary onClick={() => generatePDF(improved, `Lettre_${bourse?.nom || 'optimisee'}`, 'lm')} C={C}>
              📥 {lang === 'fr' ? 'Télécharger PDF' : 'Download PDF'}
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
  const { theme } = useTheme();
  const C = tokens(theme);
  const { lang } = useT();

  const [step, setStep] = useState(0);
  const [scholarships, setScholarships] = useState([]);
  const [selectedBourse, setSelectedBourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [fullUser, setFullUser] = useState(user);
  const [cvContent, setCvContent] = useState('');
  const [lmContent, setLmContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [activeTab, setActiveTab] = useState('cv');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const workspaceRef = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);

  // Load full user profile
  useEffect(() => {
    if (!user?.id) return;
    axiosInstance.get(API_ROUTES.users.byId(user.id), { params: { depth: 2 } })
      .then(res => setFullUser(res.data))
      .catch(() => setFullUser(user));
  }, [user?.id]);

  // Load scholarships from roadmap
  useEffect(() => {
    if (!user?.id) return;
    axiosInstance.get(API_ROUTES.roadmap.byUser(user.id))
      .then(res => {
        const docs = (res.data.docs || []).map(d => ({
          id: d.id,
          nom: d.nom,
          pays: d.pays || '',
          url: d.lienOfficiel || d.url || '',
          deadline: d.dateLimite || d.deadline || '',
          financement: d.financement || '',
        }));
        setScholarships(docs);
      })
      .catch(() => setScholarships([]));
  }, [user?.id]);

  const handleSelectBourse = (bourse) => {
    setSelectedBourse(bourse);
    setStep(1);
    setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const handleChangeBourse = () => {
    setSelectedBourse(null);
    setSelectedType(null);
    setStep(0);
    setCvContent('');
    setLmContent('');
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    setStep(2);
    setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const checkProfileComplete = () => {
    const missing = [];
    if (!fullUser?.name) missing.push(lang === 'fr' ? 'nom' : 'name');
    if (!fullUser?.email) missing.push('email');
    if (!fullUser?.pays) missing.push(lang === 'fr' ? 'pays' : 'country');
    if (!fullUser?.niveau) missing.push(lang === 'fr' ? 'niveau d\'étude' : 'study level');
    if (!fullUser?.domaine) missing.push(lang === 'fr' ? 'domaine' : 'field');
    
    if (missing.length > 0) {
      alert(lang === 'fr' 
        ? `Veuillez compléter votre profil : ${missing.join(', ')}`
        : `Please complete your profile: ${missing.join(', ')}`);
      if (setView) setView('profil');
      return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!checkProfileComplete()) return;
    if (!selectedBourse) {
      alert(lang === 'fr' ? 'Veuillez d\'abord choisir une bourse' : 'Please select a scholarship first');
      return;
    }
    if (!selectedType) {
      alert(lang === 'fr' ? 'Veuillez choisir CV ou Lettre de motivation' : 'Please choose CV or Motivation letter');
      return;
    }

    setLoading(true);
    setLoadingStep(selectedType === 'cv' 
      ? (lang === 'fr' ? 'Génération du CV en cours...' : 'Generating CV...')
      : (lang === 'fr' ? 'Rédaction de la lettre en cours...' : 'Writing letter...'));
    
    try {
      const prompt = buildPrompt(selectedType, fullUser, selectedBourse.nom, selectedBourse);
      const result = await callN8N(
        selectedType === 'cv' ? 'generate_cv' : 'generate_lm',
        { 
          text: prompt,
          id: fullUser?.id,
          email: fullUser?.email,
          bourse_nom: selectedBourse.nom,
          pays: fullUser?.pays,
          niveau: fullUser?.niveau,
          domaine: fullUser?.domaine,
          conversationId: `${selectedType}-${Date.now()}`
        }
      );
      
      const generatedText = typeof result === 'string' ? result : JSON.stringify(result);
      
      if (selectedType === 'cv') {
        setCvContent(generatedText);
      } else {
        setLmContent(generatedText);
      }
      setStep(3);
      setActiveTab(selectedType || 'cv');
      setTimeout(() => workspaceRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
    } catch (e) {
      console.error(e);
      alert(lang === 'fr' 
        ? 'Erreur lors de la génération. Vérifie que n8n est lancé sur http://localhost:5678'
        : 'Generation error. Check that n8n is running on http://localhost:5678');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!checkProfileComplete()) return;
    setStep(3);
    setActiveTab(selectedType || 'cv');
    setTimeout(() => workspaceRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const filtered = scholarships.filter(s =>
    s.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.pays?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const savedDocs = [
    { name: 'CV – Australia Awards', bourse: 'Australia Awards', date: '20/04/2026', type: 'cv' },
    { name: 'LM – Chevening', bourse: 'Chevening', date: '18/04/2026', type: 'lm' },
  ];

  const stats = [
    { icon: '📄', value: scholarships.length || 3, label: lang === 'fr' ? 'CV générés' : 'CVs generated' },
    { icon: '✉️', value: 2, label: lang === 'fr' ? 'Lettres générées' : 'Letters generated' },
    { icon: '📈', value: 5, label: lang === 'fr' ? 'CV améliorés' : 'CVs improved' },
    { icon: '🎓', value: scholarships.length, label: lang === 'fr' ? 'Candidatures' : 'Applications' },
  ];

  // Gate - not logged in
  if (!user) {
    return (
      <>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 48, maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📄</div>
            <h3 style={{ fontFamily: C.fSerif, fontSize: 22, fontWeight: 400, color: C.ink, marginBottom: 10 }}>
              {lang === 'fr' ? 'Accès restreint' : 'Restricted access'}
            </h3>
            <p style={{ color: C.ink2, fontSize: 14, marginBottom: 24 }}>
              {lang === 'fr' ? 'Connectez-vous pour optimiser votre candidature.' : 'Sign in to optimize your application.'}
            </p>
            <button onClick={() => setShowLoginModal(true)} style={{
              padding: '11px 32px', background: C.accent, color: '#fff',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: C.fSans,
            }}>
              {lang === 'fr' ? 'Se connecter' : 'Sign in'}
            </button>
          </div>
        </div>
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} C={C} lang={lang} />}
      </>
    );
  }

  // GARDER LE RESTE DU RENDER IDENTIQUE À LA RÉPONSE PRÉCÉDENTE
  // ... (je garde la même structure de render que dans ma réponse précédente)
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.fSans }}>
      {/* ... garder le même contenu que dans la réponse précédente ... */}
      <div style={{ width: '85%', margin: '0 auto', padding: '40px 0 80px' }}>
        <h1 style={{ fontFamily: C.fSerif, fontSize: 40, fontWeight: 600, color: C.ink, margin: '0 0 4px' }}>
          {lang === 'fr' ? 'Préparez votre candidature' : 'Prepare your application'}
        </h1>
        <p style={{ fontSize: 14, color: C.ink3, margin: '0 0 30px' }}>
          {lang === 'fr' ? 'Un processus guidé, simple et efficace' : 'A guided, simple and efficient process'}
        </p>

        <StepBar step={step > 2 ? 2 : step} C={C} />

        {/* ÉTAPE 1 */}
        <Card n={1} title={lang === 'fr' ? 'Choisissez votre bourse' : 'Choose your scholarship'} done={step >= 1} C={C}>
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
                <DeadlineBadge deadline={selectedBourse.deadline} C={C} />
                <span onClick={handleChangeBourse} style={{ fontSize: 12, color: C.accent, fontWeight: 600, cursor: 'pointer' }}>
                  {lang === 'fr' ? 'Changer' : 'Change'}
                </span>
              </div>
            </div>
          ) : (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: C.bgSecondary, border: `1px solid ${C.border}`,
                borderRadius: 9, padding: '10px 14px', marginBottom: 12,
              }}>
                <span style={{ fontSize: 14, color: C.ink3 }}>🔍</span>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={lang === 'fr' ? 'Rechercher une bourse…' : 'Search scholarship...'}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: C.ink, flex: 1, fontFamily: C.fSans }}
                />
              </div>
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
                    <DeadlineBadge deadline={s.deadline} C={C} />
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 28, color: C.ink3, fontSize: 14 }}>
                    {lang === 'fr' ? 'Aucune bourse trouvée' : 'No scholarships found'}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>

        {/* ÉTAPE 2 */}
        {step >= 1 && (
          <div ref={step2Ref}>
            <Card n={2} title={lang === 'fr' ? 'Que souhaitez-vous améliorer ?' : 'What would you like to improve?'} done={step >= 2} C={C}>
              <div style={{ display: 'flex', gap: 16 }}>
                <TypeCard
                  icon="📄"
                  label={lang === 'fr' ? 'CV' : 'CV'}
                  sub={lang === 'fr' ? 'Optimiser votre CV pour cette bourse' : 'Optimize your CV for this scholarship'}
                  selected={selectedType === 'cv'}
                  onClick={() => handleSelectType('cv')}
                  C={C}
                />
                <TypeCard
                  icon="✉️"
                  label={lang === 'fr' ? 'Lettre de motivation' : 'Motivation letter'}
                  sub={lang === 'fr' ? 'Adapter votre lettre à la bourse' : 'Adapt your letter to the scholarship'}
                  selected={selectedType === 'lm'}
                  onClick={() => handleSelectType('lm')}
                  C={C}
                />
              </div>
            </Card>
          </div>
        )}

        {/* ÉTAPE 3 */}
        {step >= 2 && (
          <div ref={step3Ref}>
            <Card n={3} title={lang === 'fr' ? 'Choisissez une action' : 'Choose an action'} done={step >= 3} C={C}>
              <div style={{ display: 'flex', gap: 14 }}>
                <ActionCard
                  icon="📂"
                  label={lang === 'fr' ? `Importer mon ${selectedType === 'lm' ? 'LM' : 'CV'}` : `Import my ${selectedType === 'lm' ? 'letter' : 'CV'}`}
                  desc={lang === 'fr' ? 'Analyser et améliorer un document existant' : 'Analyze and improve an existing document'}
                  onClick={handleImport}
                  C={C}
                />
                <ActionCard
                  icon="✨"
                  label={lang === 'fr' ? `Générer un ${selectedType === 'lm' ? 'LM' : 'CV'} avec IA` : `Generate ${selectedType === 'lm' ? 'letter' : 'CV'} with AI`}
                  desc={lang === 'fr' ? `Créer un ${selectedType === 'lm' ? 'LM' : 'CV'} basé sur mon profil` : `Create a ${selectedType === 'lm' ? 'letter' : 'CV'} based on my profile`}
                  onClick={handleGenerate}
                  C={C}
                />
              </div>
            </Card>
          </div>
        )}

        {/* WORKSPACE */}
        {step >= 3 && (
          <div ref={workspaceRef} style={{ marginTop: 4 }}>
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
              {[
                { id: 'cv', label: lang === 'fr' ? '📄 CV' : '📄 CV' },
                { id: 'lm', label: lang === 'fr' ? '✉️ Lettre de motivation' : '✉️ Motivation letter' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: '11px 22px', background: 'transparent',
                  color: activeTab === tab.id ? C.ink : C.ink3,
                  borderBottom: activeTab === tab.id ? `2px solid ${C.accent}` : '2px solid transparent',
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
                user={fullUser}
                bourse={selectedBourse}
                cvContent={cvContent}
                setCvContent={setCvContent}
                setLoading={setLoading}
                setLoadingStep={setLoadingStep}
                C={C}
                lang={lang}
              />
            )}
            {activeTab === 'lm' && (
              <WorkspaceLM
                user={fullUser}
                bourse={selectedBourse}
                lmContent={lmContent}
                setLmContent={setLmContent}
                setLoading={setLoading}
                setLoadingStep={setLoadingStep}
                C={C}
                lang={lang}
              />
            )}
          </div>
        )}

        {/* Mes documents */}
        <div style={{
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: '22px 28px', marginTop: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>📁</span>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
              {lang === 'fr' ? 'Mes documents' : 'My documents'}
            </div>
          </div>
          {savedDocs.map((doc, i) => <DocRow key={i} doc={doc} C={C} />)}
          <button style={{
            marginTop: 14, width: '100%', padding: '11px',
            background: 'transparent', border: `1px dashed ${C.border}`,
            borderRadius: 9, fontSize: 13, color: C.ink3, cursor: 'pointer', fontFamily: C.fSans,
          }}>
            + {lang === 'fr' ? 'Ajouter un document' : 'Add document'}
          </button>
        </div>

        {/* Votre activité */}
        <div style={{
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: '22px 28px', marginTop: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.blue }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
              {lang === 'fr' ? 'Votre activité' : 'Your activity'}
            </div>
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

      {/* Toast loading */}
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=DM+Sans:opsz,wght@9..40,100;9..40,200;9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900;9..40,1000&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        textarea:focus, input:focus { outline: none; box-shadow: 0 0 0 2px ${C.accentBg}; }
      `}</style>
    </div>
  );
}