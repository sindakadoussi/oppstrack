// RoadmapPage.jsx — AI‑driven scholarship cockpit (corrigé)
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ChatInput from '../components/ChatInput';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';

/* ═══════════════════════════════════════════════════════════════════════════
   TOKENS (identical to homepage)
═══════════════════════════════════════════════════════════════════════════ */
const tokens = (theme) => ({
  accent:     theme === "dark" ? "#4c9fd9" : "#0066b3",
  accentInk:  theme === "dark" ? "#8ec1e6" : "#004f8a",
  ink:        theme === "dark" ? "#f2efe7" : "#141414",
  ink2:       theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3:       theme === "dark" ? "#a19f96" : "#6b6b6b",
  ink4:       theme === "dark" ? "#6d6b64" : "#9a9794",
  paper:      theme === "dark" ? "#15140f" : "#faf8f3",
  paper2:     theme === "dark" ? "#1d1c16" : "#f2efe7",
  rule:       theme === "dark" ? "#2b2a22" : "#d9d5cb",
  ruleSoft:   theme === "dark" ? "#24231c" : "#e8e4d9",
  surface:    theme === "dark" ? "#1a1912" : "#ffffff",
  danger:     "#b4321f",
  warn:       "#b06a12",
  fSerif: `"Playfair Display", "Times New Roman", Georgia, serif`,
  fSans:  `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"DM Sans", monospace`,
});

const formatDate = (dateStr, lang) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US');
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const deadline = new Date(dateStr); deadline.setHours(0,0,0,0);
  const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  return diff;
};

const computePriority = (deadline, progress) => {
  const days = daysUntil(deadline);
  if (days === null) return 'LOW';
  if (days < 0) return 'EXPIRED';
  if (days <= 7) return 'HIGH';
  if (days <= 14) return 'MEDIUM';
  if (progress < 30 && days <= 21) return 'HIGH';
  if (progress > 70 && days > 14) return 'LOW';
  return 'MEDIUM';
};

const computeEffort = (remainingSteps) => {
  if (remainingSteps <= 2) return 'Low';
  if (remainingSteps <= 5) return 'Medium';
  return 'High';
};

const detectPhase = (title) => {
  const t = title.toLowerCase();
  if (t.includes('cv') || t.includes('résumé') || t.includes('research') || t.includes('profile')) return 'Preparation';
  if (t.includes('letter') || t.includes('statement') || t.includes('essay') || t.includes('application form')) return 'Application';
  if (t.includes('interview')) return 'Interview';
  if (t.includes('decision') || t.includes('result') || t.includes('offer')) return 'Result';
  return 'Application';
};

/* ═══════════════════════════════════════════════════════════════════════════
   Custom Hook useBourses (unchanged, correct)
═══════════════════════════════════════════════════════════════════════════ */
function useBourses(userId) {
  const [bourses, setBourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(true);
  const pollTimeoutRef = useRef(null);
  const retryDelay = useRef(5000);

  const fetchData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const res = await axiosInstance.get(API_ROUTES.roadmap.byUser(userId), {
        params: { limit: 50, depth: 1 },
        signal: AbortSignal.timeout(8000)
      });
      const docs = (res.data.docs || []).map(d => ({
        _id: d.id,
        nom: d.nom,
        pays: d.pays || '',
        url: d.lienOfficiel || '',
        deadline: d.dateLimite || d.deadlineFinale || '',
        financement: d.financement || '',
        etapeCourante: d.etapeCourante ?? 0,
        statut: d.statut || 'en_cours',
        etapes: d.etapes || [],
        conseilGlobal: d.conseilGlobal || '',
        langue: d.langue || '',
      }));
      const uniqueMap = new Map();
      docs.forEach(b => { const key = `${b.nom?.toLowerCase().trim()}|${b.pays?.toLowerCase().trim()}|${b.deadline}`; if (!uniqueMap.has(key)) uniqueMap.set(key, b); });
      setBourses(Array.from(uniqueMap.values()));
      retryDelay.current = 5000;
      if (pollingActive) pollTimeoutRef.current = setTimeout(fetchData, retryDelay.current);
    } catch (err) {
      console.error('Erreur chargement bourses:', err);
      if (pollingActive) {
        retryDelay.current = Math.min(retryDelay.current * 1.5, 30000);
        pollTimeoutRef.current = setTimeout(fetchData, retryDelay.current);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, pollingActive]);

  useEffect(() => {
    if (userId) {
      setPollingActive(true);
      fetchData();
    } else {
      setLoading(false);
      setBourses([]);
    }
    return () => {
      setPollingActive(false);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [userId, fetchData]);

  const reload = useCallback(() => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    setLoading(true);
    retryDelay.current = 5000;
    fetchData();
  }, [fetchData]);

  return { bourses, loading, reload };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Translation hook (unchanged, but keep as is)
═══════════════════════════════════════════════════════════════════════════ */
function useTranslatedEtapes(etapes, lang) {
  const [translated, setTranslated] = useState(null);
  const [translating, setTranslating] = useState(false);
  const cacheKey = useMemo(() => {
    if (!etapes?.length) return null;
    return 'tr_' + lang + '_' + etapes.map(e => e.titre?.slice(0,10)).join('|');
  }, [etapes, lang]);

  useEffect(() => {
    if (lang === 'fr' || !etapes?.length) { setTranslated(null); return; }
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setTranslated(JSON.parse(cached)); return; }
    } catch {}
    setTranslating(true);
    const prompt = `Translate these scholarship application steps from French to English.
Return ONLY a JSON array with same structure: each item has titre, description, documents (array of strings), duree, deadline.
Keep proper nouns and dates.
Be concise.

Input: ${JSON.stringify(etapes.map(e => ({
      titre: e.titre || '',
      description: e.description || '',
      documents: e.documents || [],
      duree: e.duree || '',
      deadline: e.deadline || '',
    })))}
Return ONLY the JSON array.`;
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
    })
      .then(r => r.json())
      .then(data => {
        const text = data.content?.[0]?.text || '';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setTranslated(parsed);
          try { localStorage.setItem(cacheKey, JSON.stringify(parsed)); } catch {}
        }
      })
      .catch(err => console.warn('Translation error:', err))
      .finally(() => setTranslating(false));
  }, [cacheKey, lang, etapes]);

  return { translated, translating };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Components
═══════════════════════════════════════════════════════════════════════════ */

function DocumentsManager({ documents, completedDocs, onUpload, c, lang }) {
  const [uploading, setUploading] = useState(null);
  const handleUpload = (docName) => {
    setUploading(docName);
    setTimeout(() => {
      onUpload(docName);
      setUploading(null);
    }, 800);
  };
  if (!documents?.length) return null;
  return (
    <div style={{ margin: '12px 0', padding: '10px 14px', background: c.paper2, borderLeft: `2px solid ${c.accent}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: c.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        📄 {lang === 'fr' ? 'Documents requis' : 'Required documents'}
      </div>
      {documents.map((doc, idx) => {
        const isCompleted = completedDocs?.includes(doc);
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: c.ink2 }}>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {isCompleted ? <span style={{ color: '#2ecc71' }}>✓</span> : <span style={{ color: c.danger, width: 16 }}>◯</span>}
              {doc}
            </span>
            {!isCompleted && (
              <button
                onClick={() => handleUpload(doc)}
                disabled={uploading === doc}
                style={{ fontSize: 10, padding: '4px 12px', background: c.accent, color: c.paper, border: 'none', borderRadius: 20, cursor: 'pointer', fontFamily: c.fMono }}
              >
                {uploading === doc ? '⏳' : (lang === 'fr' ? 'Ajouter' : 'Upload')}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step Card (corrigé avec boutons précédent/suivant et IA) ──────────────
function StepCard({ step, index, isCurrent, isCompleted, totalSteps, onNextStep, onPreviousStep, onGenerateDraft, onAskAI, documentsStatus, onUploadDocument, c, lang }) {
  return (
    <div
      className={`step-card ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
      style={{
        display: 'flex',
        gap: 14,
        marginTop: index === 0 ? 0 : 16,
        padding: '12px 0',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 44 }}>
        <div
          className="step-circle"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isCompleted ? '#2ecc71' : isCurrent ? c.accent : c.paper2,
            color: isCompleted || isCurrent ? c.paper : c.accent,
            fontSize: 14,
            fontWeight: 700,
            border: `2px solid ${isCompleted ? '#2ecc71' : isCurrent ? c.accent : c.ruleSoft}`,
            transition: 'all 0.2s cubic-bezier(0.2,0.9,0.4,1.1)',
            cursor: isCurrent ? 'pointer' : 'default',
          }}
          onClick={() => { if (isCurrent && onNextStep) onNextStep(); }}
        >
          {isCompleted ? '✓' : (step.icon || index + 1)}
        </div>
        {index < totalSteps - 1 && (
          <div style={{ width: 2, flex: 1, minHeight: 20, margin: '6px 0', background: isCompleted ? '#2ecc71' : c.ruleSoft, transition: 'background 0.3s' }} />
        )}
      </div>
      <div style={{ flex: 1, opacity: isCompleted ? 0.75 : 1 }}>
        <div style={{ paddingTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>{step.titre}</div>
              {step.deadline && (
                <div style={{ fontSize: 10, color: c.warn, fontWeight: 600, marginTop: 2 }}>⏰ {step.deadline}</div>
              )}
            </div>
            {step.duree && (
              <div style={{ fontSize: 9, padding: '2px 8px', background: c.paper2, border: `1px solid ${c.ruleSoft}`, color: c.accent, fontFamily: c.fMono }}>
                {step.duree}
              </div>
            )}
          </div>
          {isCurrent && (
            <>
              <div style={{ fontSize: 12, lineHeight: 1.5, marginTop: 8, color: c.ink2 }}>{step.description}</div>

              {step.documents?.length > 0 && (
                <DocumentsManager
                  documents={step.documents}
                  completedDocs={documentsStatus}
                  onUpload={(docName) => onUploadDocument(step.titre, docName)}
                  c={c}
                  lang={lang}
                />
              )}

              {/* Actions : Précédent, Suivant + IA */}
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {index > 0 && (
                  <button
                    onClick={() => onPreviousStep()}
                    style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${c.ruleSoft}`, color: c.ink2, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono }}
                  >
                    ← {lang === 'fr' ? 'Étape précédente' : 'Previous step'}
                  </button>
                )}
                {index < totalSteps - 1 && (
                  <button
                    onClick={() => onNextStep()}
                    style={{ padding: '6px 14px', background: c.accent, color: c.paper, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono }}
                  >
                    {lang === 'fr' ? 'Étape suivante →' : 'Next step →'}
                  </button>
                )}
                <button
                  onClick={() => onGenerateDraft(step.titre)}
                  style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${c.accent}`, color: c.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono }}
                >
                  ✍️ {lang === 'fr' ? 'Générer un brouillon' : 'Generate draft'}
                </button>
                <button
                  onClick={() => onAskAI(step.titre)}
                  style={{ padding: '6px 14px', background: c.accent, color: c.paper, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono }}
                >
                  🤖 {lang === 'fr' ? 'Demander à l’IA' : 'Ask AI'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`
        .step-card.current .step-circle {
          box-shadow: 0 0 0 3px ${c.accent}40;
          transform: scale(1.02);
        }
        .step-card.completed .step-circle {
          animation: stepGlow 0.4s ease-out;
        }
        @keyframes stepGlow {
          0% { box-shadow: 0 0 0 0 #2ecc71; transform: scale(0.95); }
          70% { box-shadow: 0 0 0 10px #2ecc7140; }
          100% { box-shadow: 0 0 0 0; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── AI Coach Panel (corrigé : inclut le nom de la bourse) ───────────────
function AICoachPanel({ bourse, currentStep, onAskAI, onGenerateDraft, c, lang }) {
  const daysLeft = daysUntil(bourse.deadline);
  let suggestion = '';
  if (currentStep) {
    suggestion = lang === 'fr'
      ? `Prochaine action : ${currentStep.titre.toLowerCase()}`
      : `Next action: ${currentStep.titre}`;
  }
  if (!currentStep && daysLeft !== null && daysLeft <= 7) {
    suggestion = lang === 'fr'
      ? `⚠️ Urgent : dépôt avant ${formatDate(bourse.deadline, lang)}`
      : `⚠️ Urgent: submit by ${formatDate(bourse.deadline, lang)}`;
  }
  return (
    <div style={{ margin: '16px 0 20px', padding: '14px 18px', background: c.paper2, borderLeft: `3px solid ${c.accent}`, borderRadius: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.accent, marginBottom: 4 }}>🤖 AI Coach</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: c.ink }}>{suggestion || (lang === 'fr' ? 'Prêt à avancer ?' : 'Ready to move forward?')}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onAskAI(currentStep?.titre, bourse.nom)} style={{ padding: '6px 12px', background: c.accent, color: c.paper, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            💬 {lang === 'fr' ? 'Conseil IA' : 'AI Advice'}
          </button>
          {currentStep && (
            <button onClick={() => onGenerateDraft(currentStep.titre, bourse.nom)} style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${c.accent}`, color: c.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              ✍️ {lang === 'fr' ? 'Générer' : 'Generate'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RiskAlert({ alerts, c, lang }) {
  if (!alerts.length) return null;
  return (
    <div style={{ margin: '12px 0', padding: '10px 14px', background: '#fef2f2', borderLeft: `3px solid ${c.danger}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: c.danger, marginBottom: 6 }}>⚠️ {lang === 'fr' ? 'Risques détectés' : 'Risks detected'}</div>
      {alerts.map((alert, idx) => (
        <div key={idx} style={{ fontSize: 12, color: c.ink2, marginBottom: 4 }}>• {alert}</div>
      ))}
    </div>
  );
}

// ─── Scholarship Detail (avec gestion précise des étapes précédente/suivante) ──
function ScholarshipDetail({ bourse, progress, daysLeft, onSetStep, onGenerateDraft, onAskAI, onUploadDocument, onRegenerate, onDelete, c, lang }) {
  const { translated: translatedEtapes, translating } = useTranslatedEtapes(bourse.etapes, lang);
  const etapesDisplay = (lang === 'en' && translatedEtapes) ? translatedEtapes : (bourse.etapes || []);
  const totalSteps = etapesDisplay.length;
  const currentIdx = Math.min(bourse.etapeCourante, totalSteps - 1);
  const priority = computePriority(bourse.deadline, progress);
  const effort = computeEffort(totalSteps - bourse.etapeCourante);
  const priorityColor = { HIGH: c.danger, MEDIUM: c.warn, LOW: c.ink3, EXPIRED: '#666' }[priority];

  const riskAlerts = [];
  if (daysLeft !== null && daysLeft < 7 && daysLeft >= 0) riskAlerts.push(lang === 'fr' ? `Deadline dans ${daysLeft} jours` : `Deadline in ${daysLeft} days`);
  if (daysLeft !== null && daysLeft < 0) riskAlerts.push(lang === 'fr' ? 'Bourse expirée' : 'Scholarship expired');
  if (bourse.etapeCourante === 0 && daysLeft !== null && daysLeft < 14) riskAlerts.push(lang === 'fr' ? 'Aucune étape commencée' : 'No step started');
  const currentStepHasDocs = etapesDisplay[currentIdx]?.documents?.length > 0;
  if (currentStepHasDocs && !(bourse.completedDocs?.[etapesDisplay[currentIdx]?.titre]?.length)) {
    riskAlerts.push(lang === 'fr' ? 'Documents manquants pour l’étape en cours' : 'Missing documents for current step');
  }

  const handleNextStep = () => {
    if (currentIdx + 1 < totalSteps) onSetStep(currentIdx + 1);
  };
  const handlePreviousStep = () => {
    if (currentIdx - 1 >= 0) onSetStep(currentIdx - 1);
  };

  return (
    <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${c.ruleSoft}` }}>
      {/* Narrative Header */}
      <div style={{ marginTop: 16, marginBottom: 20, padding: '12px 16px', background: c.paper2, border: `1px solid ${c.ruleSoft}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.ink3, textTransform: 'uppercase' }}>{lang === 'fr' ? 'Votre candidature' : 'Your application'}</div>
            <div style={{ fontFamily: c.fSerif, fontSize: 20, fontWeight: 700, color: c.ink }}>{bourse.nom}</div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: c.accent }}>{progress}%</div>
              <div style={{ fontSize: 10, color: c.ink3 }}>{lang === 'fr' ? 'Préparation' : 'Ready'}</div>
            </div>
            {daysLeft !== null && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: daysLeft < 7 ? c.danger : c.accent }}>{daysLeft}</div>
                <div style={{ fontSize: 10, color: c.ink3 }}>{lang === 'fr' ? 'jours restants' : 'days left'}</div>
              </div>
            )}
            <div style={{ padding: '4px 10px', background: `${priorityColor}20`, border: `1px solid ${priorityColor}`, fontSize: 11, fontWeight: 700, color: priorityColor }}>
              {priority} · {effort} effort
            </div>
          </div>
        </div>
        {progress > 70 && daysLeft && daysLeft > 14 && (
          <div style={{ marginTop: 10, fontSize: 11, color: '#2ecc71', fontWeight: 600 }}>🏆 {lang === 'fr' ? 'En avance sur le planning' : 'Ahead of schedule'}</div>
        )}
      </div>

      

      <RiskAlert alerts={riskAlerts} c={c} lang={lang} />

      {etapesDisplay.map((step, idx) => {
        const isCompleted = idx < bourse.etapeCourante;
        const isCurrent = idx === bourse.etapeCourante;
        return (
          <StepCard
            key={idx}
            step={step}
            index={idx}
            isCurrent={isCurrent}
            isCompleted={isCompleted}
            totalSteps={totalSteps}
            onNextStep={handleNextStep}
            onPreviousStep={handlePreviousStep}
            onGenerateDraft={onGenerateDraft}
            onAskAI={onAskAI}
            documentsStatus={bourse.completedDocs?.[step.titre] || []}
            onUploadDocument={onUploadDocument}
            c={c}
            lang={lang}
          />
        );
      })}

      <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
        <button onClick={onRegenerate} style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${c.ruleSoft}`, color: c.warn, fontSize: 11, cursor: 'pointer' }}>
          🔄 {lang === 'fr' ? 'Régénérer la roadmap' : 'Regenerate roadmap'}
        </button>
        <button onClick={onDelete} style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${c.ruleSoft}`, color: c.danger, fontSize: 11, cursor: 'pointer' }}>
          🗑️ {lang === 'fr' ? 'Supprimer' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

// ─── Scholarship List Item (inchangé) ───────────────────────────────────
function ScholarshipListItem({ bourse, progress, daysLeft, isActive, onClick, onDelete, onRegenerate, c, lang }) {
  const priority = computePriority(bourse.deadline, progress);
  const priorityColor = { HIGH: c.danger, MEDIUM: c.warn, LOW: c.ink3 }[priority];
  return (
    <div style={{ border: `1px solid ${c.ruleSoft}`, background: isActive ? c.paper2 : c.surface, marginBottom: 12, cursor: 'pointer', transition: 'all 0.2s' }} onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: c.fSerif, fontSize: 16, fontWeight: 700, color: c.ink }}>{bourse.nom}</div>
            <div style={{ fontSize: 10, fontWeight: 600, background: priorityColor + '20', color: priorityColor, padding: '2px 8px', borderRadius: 20 }}>{priority}</div>
          </div>
          <div style={{ fontSize: 11, color: c.ink3, marginTop: 4, display: 'flex', gap: 16 }}>
            {bourse.pays && <span>📍 {bourse.pays}</span>}
            <span>📊 {progress}%</span>
            {daysLeft !== null && <span>⏰ {daysLeft}j</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: c.danger }}>🗑️</button>
          <button onClick={(e) => { e.stopPropagation(); onRegenerate(); }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: c.warn }}>🔄</button>
          <div style={{ fontSize: 20, color: c.ink3, transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>›</div>
        </div>
      </div>
    </div>
  );
}

// ─── Today Focus Section (inchangé, mais pourrait être amélioré) ─────────
function TodayFocus({ bourses, onAskAI, c, lang }) {
  const tasks = useMemo(() => {
    const items = [];
    bourses.forEach(b => {
      const total = b.etapes?.length || 1;
      const currentIdx = Math.min(b.etapeCourante || 0, total - 1);
      const currentStep = b.etapes?.[currentIdx];
      if (currentStep) {
        items.push({ scholarship: b.nom, task: currentStep.titre, daysLeft: daysUntil(b.deadline), priority: computePriority(b.deadline, (b.etapeCourante / total) * 100) });
      }
    });
    items.sort((a,b) => {
      if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
      if (b.priority === 'HIGH' && a.priority !== 'HIGH') return 1;
      if (a.daysLeft !== null && b.daysLeft !== null) return a.daysLeft - b.daysLeft;
      return 0;
    });
    return items.slice(0, 3);
  }, [bourses]);

  if (tasks.length === 0) return null;
  return (
    <div style={{ marginBottom: 32, padding: '16px 20px', background: c.paper2, border: `1px solid ${c.accent}20`, borderRadius: 4 }}>
      <h2 style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, color: c.ink, margin: '0 0 12px 0' }}>🎯 {lang === 'fr' ? 'Focus du jour' : "Today's Focus"}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tasks.map((task, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: idx < tasks.length-1 ? `1px solid ${c.ruleSoft}` : 'none' }}>
            <div>
              <div style={{ fontWeight: 600, color: c.ink }}>{task.task}</div>
              <div style={{ fontSize: 11, color: c.ink3 }}>{task.scholarship}</div>
            </div>
            <button onClick={() => onAskAI(task.task, task.scholarship)} style={{ padding: '4px 12px', background: c.accent, color: c.paper, border: 'none', fontSize: 11, cursor: 'pointer' }}>
              {lang === 'fr' ? 'Aide IA' : 'AI Help'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapPreviewModal({ bourse, onConfirm, onCancel, c, lang }) {
  const estimatedSteps = 5 + Math.floor(Math.random() * 4);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onCancel} />
      <div style={{ position: 'relative', background: c.surface, maxWidth: 400, width: '90%', padding: 24, borderTop: `3px solid ${c.accent}` }}>
        <h3 style={{ fontFamily: c.fSerif, fontSize: 20, margin: '0 0 12px' }}>📋 {lang === 'fr' ? 'Aperçu de votre roadmap' : 'Roadmap preview'}</h3>
        <p style={{ fontSize: 13, color: c.ink2, marginBottom: 8 }}>{lang === 'fr' ? `Nous allons générer environ ${estimatedSteps} étapes personnalisées pour "${bourse.nom}".` : `We'll generate about ${estimatedSteps} personalized steps for "${bourse.nom}".`}</p>
        <p style={{ fontSize: 12, color: c.ink3, marginBottom: 24 }}>⏱️ {lang === 'fr' ? 'Temps estimé : 30-60 minutes par étape' : 'Estimated time: 30-60 min per step'}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 20px', background: 'transparent', border: `1px solid ${c.ruleSoft}`, cursor: 'pointer' }}>{lang === 'fr' ? 'Annuler' : 'Cancel'}</button>
          <button onClick={onConfirm} style={{ padding: '8px 20px', background: c.accent, color: c.paper, border: 'none', cursor: 'pointer' }}>{lang === 'fr' ? 'Générer' : 'Generate'}</button>
        </div>
      </div>
    </div>
  );
}

function GlobalStats({ bourses, c, lang }) {
  const totalProgress = bourses.reduce((acc, b) => {
    const total = b.etapes?.length || 1;
    const current = b.etapeCourante || 0;
    return acc + (current / total) * 100;
  }, 0);
  const avgProgress = bourses.length ? Math.round(totalProgress / bourses.length) : 0;
  const activeCount = bourses.filter(b => b.etapeCourante < (b.etapes?.length || 1)).length;
  return (
    <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
      <div style={{ background: c.paper2, padding: '12px 20px', flex: 1, textAlign: 'center', border: `1px solid ${c.ruleSoft}` }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: c.accent }}>{avgProgress}%</div>
        <div style={{ fontSize: 11, color: c.ink3 }}>{lang === 'fr' ? 'Progression moyenne' : 'Average progress'}</div>
      </div>
      <div style={{ background: c.paper2, padding: '12px 20px', flex: 1, textAlign: 'center', border: `1px solid ${c.ruleSoft}` }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: c.accent }}>{activeCount}</div>
        <div style={{ fontSize: 11, color: c.ink3 }}>{lang === 'fr' ? 'Candidatures actives' : 'Active applications'}</div>
      </div>
      <div style={{ background: c.paper2, padding: '12px 20px', flex: 1, textAlign: 'center', border: `1px solid ${c.ruleSoft}` }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: c.accent }}>5</div>
        <div style={{ fontSize: 11, color: c.ink3 }}>{lang === 'fr' ? 'Jours de suite' : 'Day streak'}</div>
      </div>
    </div>
  );
}

function AISuggestions({ bourses, c, lang }) {
  const suggestions = useMemo(() => {
    const list = [];
    bourses.forEach(b => {
      const total = b.etapes?.length || 1;
      const currentIdx = Math.min(b.etapeCourante || 0, total - 1);
      const currentStep = b.etapes?.[currentIdx];
      if (currentStep?.documents?.length && !b.completedDocs?.[currentStep.titre]?.length) {
        list.push(`📄 ${lang === 'fr' ? 'Documents manquants pour' : 'Missing documents for'} ${b.nom} : ${currentStep.documents.join(', ')}`);
      }
    });
    const deadlines = bourses.map(b => ({ nom: b.nom, date: b.deadline, days: daysUntil(b.deadline) }));
    for (let i = 0; i < deadlines.length; i++) {
      for (let j = i+1; j < deadlines.length; j++) {
        if (deadlines[i].days !== null && deadlines[j].days !== null && Math.abs(deadlines[i].days - deadlines[j].days) <= 7) {
          list.push(`⚠️ ${lang === 'fr' ? 'Dates limites proches' : 'Close deadlines'} : ${deadlines[i].nom} & ${deadlines[j].nom}`);
          break;
        }
      }
    }
    return list.slice(0, 3);
  }, [bourses, lang]);
  if (suggestions.length === 0) return null;
  return (
    <div style={{ marginTop: 24, padding: '14px 18px', background: c.paper2, border: `1px solid ${c.warn}40` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: c.warn, textTransform: 'uppercase', marginBottom: 8 }}>💡 AI Recommendations</div>
      {suggestions.map((s, idx) => <div key={idx} style={{ fontSize: 12, color: c.ink2, marginBottom: 6 }}>• {s}</div>)}
    </div>
  );
}

function LoginModal({ onClose, c, lang }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');
  const send = async () => {
    if (!email || !email.includes('@')){ setErrMsg(lang === 'fr' ? 'Email invalide' : 'Invalid email'); return; }
    setStatus('sending');
    try { await axiosInstance.post('/api/users/request-magic-link', { email: email.trim().toLowerCase() }); setStatus('success'); }
    catch(err){ setStatus('error'); setErrMsg(err.response?.data?.message || (lang === 'fr' ? 'Erreur serveur' : 'Server error')); }
  };
  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)' }} onClick={onClose}/>
      <div style={{ position:'relative', zIndex:2001, width:400, maxWidth:'92vw', background:c.surface, borderTop: `3px solid ${c.accent}`, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 20px', background:c.paper2, borderBottom:`1px solid ${c.rule}` }}><span style={{ fontSize:22 }}>🔐</span><span style={{ fontFamily:c.fSerif, fontWeight:700, fontSize:16, color:c.ink }}>{lang === 'fr' ? 'Connexion à OppsTrack' : 'Sign in to OppsTrack'}</span><button style={{ marginLeft:'auto', background:'none', border:'none', fontSize:18, cursor:'pointer', color:c.ink3 }} onClick={onClose}>✕</button></div>
        <div style={{ padding:'24px' }}>
          {status === 'idle' && <><p style={{ color:c.ink2, fontSize:13, marginBottom:20, lineHeight:1.5 }}>{lang === 'fr' ? 'Entrez votre email pour recevoir un lien magique.' : 'Enter your email to receive a magic link.'}</p><input type="email" placeholder={lang === 'fr' ? 'votre@email.com' : 'your@email.com'} value={email} autoFocus onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} style={{ width:'100%', padding:'10px 12px', border:`1px solid ${c.ruleSoft}`, background:c.paper, color:c.ink, fontSize:13, outline:'none', fontFamily:c.fSans }}/>{errMsg && <div style={{ color:c.danger, fontSize:11, marginTop:6 }}>{errMsg}</div>}<button style={{ width:'100%', marginTop:16, padding:'10px', background:c.accent, color:c.paper, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:c.fMono, letterSpacing:'0.05em' }} onClick={send}>✉️ {lang === 'fr' ? 'Envoyer le lien magique' : 'Send magic link'}</button></>}
          {status === 'sending' && <div style={{ textAlign:'center', padding:'24px 0' }}><div style={{ width:32, height:32, border:`3px solid ${c.ruleSoft}`, borderTopColor:c.accent, borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' }}/><p style={{ color:c.ink2, marginTop:14 }}>{lang === 'fr' ? 'Envoi...' : 'Sending...'}</p></div>}
          {status === 'success' && <div style={{ textAlign:'center', padding:'16px 0' }}><div style={{ fontSize:48, marginBottom:12 }}>✉️</div><div style={{ fontFamily:c.fSerif, fontSize:16, fontWeight:700, color:'#166534', marginBottom:8 }}>{lang === 'fr' ? 'Lien envoyé !' : 'Link sent!'}</div><p style={{ color:c.ink2, fontSize:12 }}>{lang === 'fr' ? 'Vérifiez votre boîte mail.' : 'Check your inbox.'}</p><button style={{ width:'100%', marginTop:16, padding:'10px', background:'#166534', color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }} onClick={onClose}>✓ {lang === 'fr' ? 'Fermer' : 'Close'}</button></div>}
          {status === 'error' && <div style={{ textAlign:'center', padding:'16px 0' }}><div style={{ fontSize:40, marginBottom:12 }}>⚠️</div><p style={{ color:c.danger, marginBottom:12 }}>{errMsg}</p><button style={{ width:'100%', marginTop:16, padding:'10px', background:c.accent, color:c.paper, border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }} onClick={()=>{setStatus('idle');setErrMsg('');}}>Retry</button></div>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function RoadmapPage({ user, messages, input, setInput, loading: chatLoading, handleSend, chatContainerRef, handleQuickReply }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { bourses, loading: boursesLoading, reload } = useBourses(user?.id);
  const [activeBourseId, setActiveBourseId] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedBourseForPreview, setSelectedBourseForPreview] = useState(null);
  const [completedDocs, setCompletedDocs] = useState({});

  const handleUploadDocument = (scholarshipId, stepTitle, docName) => {
    setCompletedDocs(prev => ({
      ...prev,
      [scholarshipId]: {
        ...prev[scholarshipId],
        [stepTitle]: [...(prev[scholarshipId]?.[stepTitle] || []), docName]
      }
    }));
  };

  // Nouvelle fonction : définit directement l'index de l'étape (pour précédent/suivant)
  const handleSetStep = async (bourseId, newStepIndex) => {
    const b = bourses.find(b => b._id === bourseId);
    if (!b) return;
    const maxStep = (b.etapes?.length || 1) - 1;
    const clamped = Math.min(Math.max(newStepIndex, 0), maxStep);
    try {
      await axiosInstance.patch(API_ROUTES.roadmap.update(b._id), { etapeCourante: clamped });
      reload();
    } catch (err) { console.error('Step update error:', err); }
  };

  const handleAskAI = (stepTitle, bourseNom) => {
    const message = lang === 'fr'
      ? `Aide-moi pour l'étape "${stepTitle}" de la bourse "${bourseNom}"`
      : `Help me with step "${stepTitle}" for "${bourseNom}" scholarship`;
    window.dispatchEvent(new CustomEvent('openChatWithMessage', { detail: { message } }));
  };

  const handleGenerateDraft = (stepTitle, bourseNom) => {
    const message = lang === 'fr'
      ? `Génère-moi un brouillon pour l'étape "${stepTitle}" de la bourse "${bourseNom}"`
      : `Generate a draft for step "${stepTitle}" for "${bourseNom}"`;
    window.dispatchEvent(new CustomEvent('openChatWithMessage', { detail: { message } }));
  };

  const handleRegenerate = async (bourse) => {
    if (!bourse._id) return;
    try {
      await axiosInstance.post(WEBHOOK_ROUTES.generateRoadmap, {
        roadmapId: bourse._id,
        bourse: { nom: bourse.nom, pays: bourse.pays, url: bourse.url, deadline: bourse.deadline, financement: bourse.financement }
      });
      setTimeout(() => reload(), 2000);
    } catch (err) { console.error('Regeneration error:', err); }
  };

  const handleDeleteBourse = async (bourse) => {
    if (!bourse._id) return;
    try {
      await axiosInstance.delete(API_ROUTES.roadmap.delete(bourse._id));
      reload();
      if (activeBourseId === bourse._id) setActiveBourseId(null);
    } catch (err) { console.error('Delete error:', err); }
  };

  if (!user) {
    return (
      <>
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:c.paper, padding:24 }}>
          <div style={{ background:c.surface, border:`1px solid ${c.rule}`, padding:'48px 40px', maxWidth:380, width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🗺️</div>
            <h3 style={{ fontFamily:c.fSerif, fontSize:20, fontWeight:700, color:c.ink, margin:'0 0 8px' }}>{lang === 'fr' ? 'Roadmap non disponible' : 'Roadmap unavailable'}</h3>
            <p style={{ color:c.ink2, fontSize:13, lineHeight:1.5, margin:'0 0 24px' }}>{lang === 'fr' ? 'Connectez-vous pour suivre vos candidatures.' : 'Sign in to track your applications.'}</p>
            <button style={{ padding:'10px 28px', background:c.accent, color:c.paper, border:'none', fontSize:12, fontWeight:600, fontFamily:c.fMono, cursor:'pointer' }} onClick={()=>setShowLoginModal(true)}>🔐 {lang === 'fr' ? 'Se connecter' : 'Sign in'}</button>
          </div>
        </div>
        {showLoginModal && <LoginModal onClose={()=>setShowLoginModal(false)} c={c} lang={lang}/>}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </>
    );
  }

  const activeScholarship = bourses.find(b => b._id === activeBourseId);
  const hasRoadmaps = bourses.length > 0;

  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px' }}>
        {hasRoadmaps && <GlobalStats bourses={bourses} c={c} lang={lang} />}
        {hasRoadmaps && <TodayFocus bourses={bourses} onAskAI={handleAskAI} c={c} lang={lang} />}

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {boursesLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 24, color: c.ink3 }}>
                <div style={{ width: 24, height: 24, border: `3px solid ${c.ruleSoft}`, borderTopColor: c.accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13 }}>{lang === 'fr' ? 'Chargement de vos bourses…' : 'Loading your scholarships…'}</span>
              </div>
            )}
            {!boursesLoading && bourses.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, border: `1px solid ${c.ruleSoft}`, background: c.surface }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
                <div style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, color: c.ink, marginBottom: 8 }}>{lang === 'fr' ? 'Aucune candidature en cours' : 'No active applications'}</div>
                <div style={{ color: c.ink2, fontSize: 13, maxWidth: 360, margin: '0 auto' }}>
                  {lang === 'fr'
                    ? <>Allez dans <strong style={{ color: c.accent }}>Recommandations</strong> et cliquez sur <strong style={{ color: c.warn }}>🗺️ Postuler</strong> pour démarrer votre roadmap.</>
                    : <>Go to <strong style={{ color: c.accent }}>Recommendations</strong> and click <strong style={{ color: c.warn }}>🗺️ Apply</strong> to start your roadmap.</>}
                </div>
                <button style={{ marginTop: 20, padding: '8px 20px', background: c.accent, color: c.paper, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => handleQuickReply(lang === 'fr' ? 'Recommande moi des bourses' : 'Recommend me scholarships')}>
                  🎯 {lang === 'fr' ? 'Voir les recommandations' : 'See recommendations'}
                </button>
              </div>
            )}
            {!boursesLoading && bourses.map((b) => {
              const total = b.etapes?.length || 1;
              const progress = total ? Math.round(((b.etapeCourante || 0) / total) * 100) : 0;
              const daysLeft = daysUntil(b.deadline);
              return (
                <ScholarshipListItem
                  key={b._id}
                  bourse={b}
                  progress={progress}
                  daysLeft={daysLeft}
                  isActive={activeBourseId === b._id}
                  onClick={() => setActiveBourseId(activeBourseId === b._id ? null : b._id)}
                  onDelete={() => handleDeleteBourse(b)}
                  onRegenerate={() => handleRegenerate(b)}
                  c={c}
                  lang={lang}
                />
              );
            })}
            {user && !boursesLoading && bourses.length > 0 && (
              <button style={{ marginTop: 16, padding: '6px 12px', background: 'transparent', border: `1px solid ${c.ruleSoft}`, color: c.ink3, fontSize: 11, cursor: 'pointer', fontFamily: c.fMono }} onClick={reload}>
                🔄 {lang === 'fr' ? 'Actualiser' : 'Refresh'}
              </button>
            )}
          </div>

          <div style={{ flex: 1.2 }}>
            {activeScholarship ? (
              <>
                <ScholarshipDetail
                  bourse={activeScholarship}
                  progress={activeScholarship.etapes?.length ? Math.round(((activeScholarship.etapeCourante || 0) / activeScholarship.etapes.length) * 100) : 0}
                  daysLeft={daysUntil(activeScholarship.deadline)}
                  onSetStep={(idx) => handleSetStep(activeScholarship._id, idx)}
                  onGenerateDraft={handleGenerateDraft}
                  onAskAI={handleAskAI}
                  onUploadDocument={(stepTitle, docName) => handleUploadDocument(activeScholarship._id, stepTitle, docName)}
                  onRegenerate={() => handleRegenerate(activeScholarship)}
                  onDelete={() => handleDeleteBourse(activeScholarship)}
                  c={c}
                  lang={lang}
                />
                <AISuggestions bourses={[activeScholarship]} c={c} lang={lang} />
              </>
            ) : bourses.length > 0 && (
              <div style={{ textAlign: 'center', padding: 48, color: c.ink3, border: `1px solid ${c.ruleSoft}` }}>
                {lang === 'fr' ? 'Sélectionnez une bourse pour voir le détail' : 'Select a scholarship to view details'}
              </div>
            )}
          </div>
        </div>

        {showPreviewModal && selectedBourseForPreview && (
          <RoadmapPreviewModal
            bourse={selectedBourseForPreview}
            onConfirm={() => { setShowPreviewModal(false); }}
            onCancel={() => setShowPreviewModal(false)}
            c={c}
            lang={lang}
          />
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}