// StudentFeedback.jsx — version avec correction de l’option anonyme
import React, { useState, useEffect, useRef } from 'react';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';

// Animation confetti
const simpleConfetti = () => {
  const colors = ['#0066b3', '#f5a623', '#22c55e', '#b4321f'];
  for (let i = 0; i < 50; i++) {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.width = '6px';
    div.style.height = '6px';
    div.style.background = colors[Math.floor(Math.random() * colors.length)];
    div.style.left = Math.random() * window.innerWidth + 'px';
    div.style.top = '-10px';
    div.style.borderRadius = '50%';
    div.style.pointerEvents = 'none';
    div.style.zIndex = '9999';
    document.body.appendChild(div);
    const animation = div.animate([
      { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
      { transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
    ], { duration: 1500 + Math.random() * 1000, easing: 'cubic-bezier(0.2, 0.9, 0.4, 1)' });
    animation.onfinish = () => div.remove();
  }
};

const tokens = (theme) => ({
  accent: theme === "dark" ? "#4c9fd9" : "#0066b3",
  ink: theme === "dark" ? "#f2efe7" : "#141414",
  ink2: theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3: theme === "dark" ? "#a19f96" : "#6b6b6b",
  paper: theme === "dark" ? "#15140f" : "#faf8f3",
  paper2: theme === "dark" ? "#1d1c16" : "#f2efe7",
  rule: theme === "dark" ? "#2b2a22" : "#d9d5cb",
  ruleSoft: theme === "dark" ? "#24231c" : "#e8e4d9",
  surface: theme === "dark" ? "#1a1912" : "#ffffff",
  danger: "#b4321f",
  success: "#22c55e",
  successBg: theme === "dark" ? "rgba(34,197,94,0.15)" : "#f0fdf4",
  starActive: "#f5a623",
  starInactive: theme === "dark" ? "#4a4a4a" : "#cbd5e0",
  fSerif: `"Libre Caslon Text", "Times New Roman", Georgia, serif`,
  fSans: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono: `"JetBrains Mono", ui-monospace, Menlo, monospace`,
});

export default function StudentFeedback({ setView, user }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);

  const stats = { total: 2847, avgRating: 4.8 };

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    rating: 5,
    category: 'compliment',
    comment: '',
    name: '',
    email: '',
    isAnonymous: false,
    agreeTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (user && !formData.name && !formData.email) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    setCharCount(formData.comment.length);
  }, [formData.comment]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (submitStatus) setSubmitStatus(null);
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const nextStep = () => {
    if (step === 1 && !formData.rating) return;
    if (step === 2 && !formData.comment.trim()) return;
    // Étape 3 : vérification conditions (nom/email seulement si non anonyme)
    if (step === 3) {
      if (!formData.agreeTerms) return;
      if (!formData.isAnonymous && (!formData.name.trim() || !formData.email.trim())) return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation (identique à nextStep)
    if (!formData.agreeTerms) {
      setSubmitStatus({ type: 'error', message: lang === 'fr' ? 'Veuillez accepter les conditions' : 'Please accept the terms' });
      return;
    }
    if (!formData.isAnonymous && (!formData.name.trim() || !formData.email.trim())) {
      setSubmitStatus({ type: 'error', message: lang === 'fr' ? 'Veuillez renseigner votre nom et email' : 'Please enter your name and email' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const payload = {
        name: formData.isAnonymous ? 'Anonyme' : formData.name,
        email: formData.isAnonymous ? 'anonymous@oppstrack.com' : formData.email,
        rating: formData.rating,
        category: formData.category,
        comment: formData.comment,
      };
      // Remplacer par votre appel API réel
      // await axiosInstance.post(API_ROUTES.feedbacks.create, payload);
      await new Promise(resolve => setTimeout(resolve, 1500));
      simpleConfetti();
      setSubmitStatus({ type: 'success', message: lang === 'fr' ? 'Merci pour votre retour !' : 'Thank you for your feedback!' });
      setFormData({
        rating: 5,
        category: 'compliment',
        comment: '',
        name: user?.name || '',
        email: user?.email || '',
        isAnonymous: false,
        agreeTerms: false,
      });
      setStep(4);
    } catch (error) {
      console.error(error);
      setSubmitStatus({ type: 'error', message: lang === 'fr' ? 'Erreur lors de l’envoi.' : 'Submission error.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus(null), 5000);
    }
  };

  const getSuggestionPlaceholder = () => {
    if (formData.rating <= 2) return lang === 'fr' ? "Qu'est-ce qui n'a pas fonctionné ?" : "What didn't work?";
    if (formData.rating === 3) return lang === 'fr' ? "Comment pourrions-nous améliorer ?" : "How could we improve?";
    return lang === 'fr' ? "Qu'avez-vous particulièrement apprécié ?" : "What did you particularly like?";
  };

  const quickTemplates = {
    fr: [
      { text: "Interface intuitive et rapide", cat: 'compliment' },
      { text: "Fonctionnalités utiles pour ma recherche", cat: 'compliment' },
      { text: "Problème technique rencontré", cat: 'bug' },
      { text: "Suggestion d'amélioration", cat: 'suggestion' },
    ],
    en: [
      { text: "Intuitive and fast interface", cat: 'compliment' },
      { text: "Useful features for my search", cat: 'compliment' },
      { text: "Technical problem encountered", cat: 'bug' },
      { text: "Suggestion for improvement", cat: 'suggestion' },
    ]
  };

  const applyTemplate = (template) => {
    setFormData(prev => ({ ...prev, comment: template.text, category: template.cat }));
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Écran de succès
  if (submitStatus?.type === 'success' && step === 4) {
    return (
      <div style={{ background: c.paper, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: 500, width: '100%', textAlign: 'center', background: c.surface, border: `1px solid ${c.rule}`, padding: '48px 32px', borderRadius: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
          <div style={{ fontFamily: c.fSerif, fontSize: 28, fontWeight: 700, color: c.ink, marginBottom: 8 }}>{submitStatus.message}</div>
          <p style={{ color: c.ink2, marginBottom: 24 }}>{lang === 'fr' ? 'Votre avis nous aide à nous améliorer.' : 'Your feedback helps us improve.'}</p>
          <div style={{ background: c.successBg, padding: '12px', borderRadius: 12, marginBottom: 24 }}>
            <span style={{ fontWeight: 600, color: c.success }}>🏅 {lang === 'fr' ? "Badge 'Contributeur' débloqué" : "Badge 'Contributor' unlocked"}</span>
          </div>
          <button onClick={() => setView('bourses')} style={{ background: c.accent, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 40, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginRight: 12 }}>{lang === 'fr' ? 'Découvrir les bourses' : 'Explore scholarships'}</button>
          <button onClick={() => setView('accueil')} style={{ background: 'transparent', border: `1px solid ${c.rule}`, padding: '12px 24px', borderRadius: 40, fontSize: 14, cursor: 'pointer', color: c.ink2 }}>{lang === 'fr' ? 'Retour à l’accueil' : 'Back home'}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: c.paper, minHeight: '100vh' }}>
      {/* Bouton retour */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px 0' }}>
        <button onClick={() => setView('accueil')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'transparent', border: `1px solid ${c.ruleSoft}`, borderRadius: 40, cursor: 'pointer', fontSize: 12, fontFamily: c.fMono, color: c.ink2 }}>
          ← {lang === 'fr' ? 'Retour' : 'Back'}
        </button>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '48px 24px', background: c.paper2, borderBottom: `1px solid ${c.rule}` }}>
        <h1 style={{ fontFamily: c.fSerif, fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 700, color: c.ink, marginBottom: 12, letterSpacing: '-0.02em' }}>
          {lang === 'fr' ? 'Votre avis compte' : 'Your voice matters'}
        </h1>
        <div style={{ width: 60, height: 3, background: c.accent, margin: '16px auto' }} />
        <p style={{ fontSize: 18, color: c.ink2, marginBottom: 24, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          {lang === 'fr' ? `Plus de ${stats.total} étudiants nous ont déjà fait confiance` : `Over ${stats.total} students have trusted us`}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: c.starActive }}>{stats.avgRating}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[...Array(5)].map((_, i) => (
              <span key={i} style={{ color: i < Math.floor(stats.avgRating) ? c.starActive : c.starInactive, fontSize: 24 }}>★</span>
            ))}
          </div>
          <span style={{ color: c.ink3, fontSize: 14 }}>/5</span>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        {/* Steps */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, position: 'relative' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', margin: '0 auto 8px',
                background: step > s ? c.accent : step === s ? `${c.accent}20` : c.ruleSoft,
                border: `2px solid ${step >= s ? c.accent : c.rule}`,
                color: step >= s ? c.accent : c.ink3,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              }}>
                {step > s ? '✓' : s}
              </div>
              <div style={{ fontSize: 12, color: step >= s ? c.accent : c.ink3 }}>
                {s === 1 && (lang === 'fr' ? 'Note' : 'Rate')}
                {s === 2 && (lang === 'fr' ? 'Message' : 'Message')}
                {s === 3 && (lang === 'fr' ? 'Infos' : 'Info')}
              </div>
            </div>
          ))}
        </div>

        {/* Étape 1 : Note & Catégorie */}
        {step === 1 && (
          <div style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: '32px', borderRadius: 20 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: c.ink }}>{lang === 'fr' ? 'Note globale' : 'Overall rating'}</div>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => handleRatingClick(star)} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} style={{ background: 'none', border: 'none', fontSize: 48, cursor: 'pointer', color: formData.rating >= star ? c.starActive : c.starInactive, transition: 'transform 0.1s' }}>★</button>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 16, color: c.ink2, fontSize: 13 }}>
                {formData.rating === 1 && (lang === 'fr' ? 'Très insatisfait' : 'Very dissatisfied')}
                {formData.rating === 2 && (lang === 'fr' ? 'Insatisfait' : 'Dissatisfied')}
                {formData.rating === 3 && (lang === 'fr' ? 'Moyen' : 'Average')}
                {formData.rating === 4 && (lang === 'fr' ? 'Satisfait' : 'Satisfied')}
                {formData.rating === 5 && (lang === 'fr' ? 'Très satisfait' : 'Very satisfied')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: c.ink }}>{lang === 'fr' ? 'Catégorie' : 'Category'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                {[
                  { id: 'bug', labelFr: '🐛 Problème technique', labelEn: '🐛 Bug' },
                  { id: 'suggestion', labelFr: '💡 Suggestion', labelEn: '💡 Suggestion' },
                  { id: 'compliment', labelFr: '⭐ Compliment', labelEn: '⭐ Compliment' },
                  { id: 'other', labelFr: '💬 Autre', labelEn: '💬 Other' },
                ].map(cat => (
                  <button key={cat.id} onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))} style={{ padding: '10px', border: `1px solid ${formData.category === cat.id ? c.accent : c.rule}`, borderRadius: 10, background: formData.category === cat.id ? `${c.accent}10` : 'transparent', cursor: 'pointer', color: c.ink, fontSize: 13, transition: 'all 0.2s' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{cat.id === 'bug' ? '🐛' : cat.id === 'suggestion' ? '💡' : cat.id === 'compliment' ? '⭐' : '💬'}</div>
                    {lang === 'fr' ? cat.labelFr : cat.labelEn}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={nextStep} style={{ width: '100%', marginTop: 32, padding: '12px', background: c.accent, color: c.paper, border: 'none', borderRadius: 40, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{lang === 'fr' ? 'Continuer →' : 'Continue →'}</button>
          </div>
        )}

        {/* Étape 2 : Message */}
        {step === 2 && (
          <div style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: '32px', borderRadius: 20 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: c.ink }}>{lang === 'fr' ? 'Votre message' : 'Your message'}</div>
              <textarea ref={textareaRef} name="comment" value={formData.comment} onChange={handleChange} rows={6} placeholder={getSuggestionPlaceholder()} style={{ width: '100%', padding: '12px', border: `1px solid ${c.rule}`, borderRadius: 12, background: c.paper, color: c.ink, fontSize: 14, fontFamily: c.fSans, resize: 'vertical' }} />
              <div style={{ textAlign: 'right', fontSize: 12, color: charCount > 500 ? c.danger : c.ink3, marginTop: 4 }}>{charCount}/500</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: c.ink2 }}>{lang === 'fr' ? 'Suggestions rapides' : 'Quick templates'}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(lang === 'fr' ? quickTemplates.fr : quickTemplates.en).map((t, i) => (
                  <button key={i} onClick={() => applyTemplate(t)} style={{ padding: '6px 12px', background: c.paper2, border: `1px solid ${c.ruleSoft}`, borderRadius: 40, fontSize: 12, cursor: 'pointer', color: c.ink2 }}>{t.text}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button onClick={prevStep} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${c.rule}`, borderRadius: 40, cursor: 'pointer', color: c.ink2 }}>← {lang === 'fr' ? 'Retour' : 'Back'}</button>
              <button onClick={nextStep} disabled={!formData.comment.trim()} style={{ flex: 1, padding: '12px', background: c.accent, color: c.paper, border: 'none', borderRadius: 40, cursor: formData.comment.trim() ? 'pointer' : 'not-allowed', opacity: formData.comment.trim() ? 1 : 0.5 }}>{lang === 'fr' ? 'Continuer →' : 'Continue →'}</button>
            </div>
          </div>
        )}

        {/* Étape 3 : Infos personnelles */}
        {step === 3 && (
          <div style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: '32px', borderRadius: 20 }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, cursor: 'pointer' }}>
                <input type="checkbox" name="isAnonymous" checked={formData.isAnonymous} onChange={handleChange} style={{ width: 18, height: 18 }} />
                <span style={{ color: c.ink }}>{lang === 'fr' ? 'Soumettre anonymement' : 'Submit anonymously'}</span>
              </label>

              {!formData.isAnonymous && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, color: c.ink, fontSize: 13 }}>{lang === 'fr' ? 'Nom' : 'Name'} *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '10px', border: `1px solid ${c.rule}`, borderRadius: 8, background: c.paper, color: c.ink }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, color: c.ink, fontSize: 13 }}>Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '10px', border: `1px solid ${c.rule}`, borderRadius: 8, background: c.paper, color: c.ink }} />
                  </div>
                </>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 12, color: c.ink2 }}>{lang === 'fr' ? 'J’autorise OppsTrack à utiliser mon retour pour améliorer ses services.' : 'I allow OppsTrack to use my feedback to improve its services.'}</span>
                </label>
              </div>

              {submitStatus?.type === 'error' && <div style={{ background: c.dangerBg, color: c.danger, padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{submitStatus.message}</div>}

              <button onClick={handleSubmit} disabled={isSubmitting || !formData.agreeTerms || (!formData.isAnonymous && (!formData.name.trim() || !formData.email.trim()))} style={{ width: '100%', padding: '12px', background: c.accent, color: c.paper, border: 'none', borderRadius: 40, fontSize: 14, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}>
                {isSubmitting ? (lang === 'fr' ? 'Envoi...' : 'Sending...') : (lang === 'fr' ? 'Envoyer mon avis' : 'Submit feedback')}
              </button>
            </div>

            {/* Information rassurante */}
            <div style={{ marginTop: 24, padding: '16px', background: c.paper2, borderRadius: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: c.accent }}>{lang === 'fr' ? 'Pourquoi votre avis compte ?' : 'Why your voice matters?'}</div>
              <div style={{ display: 'grid', gap: 8, fontSize: 12, color: c.ink2 }}>
                <div>🔒 {lang === 'fr' ? 'Vos données sont protégées' : 'Your data is protected'}</div>
                <div>📊 {lang === 'fr' ? 'Impact direct sur nos priorités' : 'Direct impact on our priorities'}</div>
                <div>💬 {lang === 'fr' ? 'Réponse possible si email fourni' : 'Possible reply if email provided'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={prevStep} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${c.rule}`, borderRadius: 40, cursor: 'pointer', color: c.ink2 }}>← {lang === 'fr' ? 'Retour' : 'Back'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}