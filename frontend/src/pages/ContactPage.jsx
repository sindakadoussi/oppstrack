// ContactPage.jsx — version style éditorial (tokens unipd.it)
"use client";

import React, { useState, useEffect } from "react";
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';

/* ═══════════════════════════════════════════════════════════════════════════
   TOKENS (identique à la homepage)
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
  fSerif: `"Libre Caslon Text", "Times New Roman", Georgia, serif`,
  fSans:  `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"JetBrains Mono", ui-monospace, Menlo, monospace`,
});

export default function ContactPage({ setView, user }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: ""
  });
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pré-remplir nom et email depuis le profil utilisateur
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = lang === 'fr' ? "Le nom est requis" : "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = lang === 'fr' ? "L'email est requis" : "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = lang === 'fr' ? "Email invalide" : "Invalid email";
    }
    if (!formData.category) newErrors.category = lang === 'fr' ? "Veuillez sélectionner une catégorie" : "Please select a category";
    if (!formData.message.trim()) newErrors.message = lang === 'fr' ? "Le message est requis" : "Message is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        category: "",
        message: ""
      });
    }, 3000);
  };

  const t = {
    back: lang === 'fr' ? 'Retour à l\'accueil' : 'Back to home',
    heroTitle: lang === 'fr' ? 'Contactez notre équipe' : 'Contact our team',
    heroSub: lang === 'fr' ? 'Nous sommes là pour répondre à toutes vos questions' : 'We are here to answer all your questions',
    email: 'Email',
    phone: lang === 'fr' ? 'Téléphone' : 'Phone',
    address: lang === 'fr' ? 'Adresse' : 'Address',
    reply24h: lang === 'fr' ? 'Réponse sous 24h' : 'Reply within 24h',
    hours: lang === 'fr' ? 'Lun-Ven, 9h-18h' : 'Mon-Fri, 9am-6pm',
    meet: lang === 'fr' ? 'Nous rencontrer' : 'Meet us',
    formTitle: lang === 'fr' ? 'Envoyez-nous un message' : 'Send us a message',
    formDesc: lang === 'fr' ? 'Remplissez le formulaire ci-dessous et nous vous répondrons rapidement' : 'Fill out the form below and we will get back to you quickly',
    nameLabel: lang === 'fr' ? 'Nom complet' : 'Full name',
    namePlaceholder: lang === 'fr' ? 'Jean Dupont' : 'John Doe',
    emailLabel: 'Email',
    categoryLabel: lang === 'fr' ? 'Catégorie' : 'Category',
    categoryPlaceholder: lang === 'fr' ? 'Sélectionnez une catégorie' : 'Select a category',
    categories: {
      support: lang === 'fr' ? 'Support technique' : 'Technical support',
      scholarship: lang === 'fr' ? 'Question sur une bourse' : 'Scholarship question',
      partnership: lang === 'fr' ? 'Partenariat' : 'Partnership',
      bug: lang === 'fr' ? 'Signaler un bug' : 'Report a bug',
      other: lang === 'fr' ? 'Autre' : 'Other',
    },
    messageLabel: lang === 'fr' ? 'Message' : 'Message',
    messagePlaceholder: lang === 'fr' ? 'Décrivez votre demande en détail...' : 'Describe your request in detail...',
    submit: lang === 'fr' ? 'Envoyer le message' : 'Send message',
    sending: lang === 'fr' ? 'Envoi en cours...' : 'Sending...',
    successTitle: lang === 'fr' ? 'Message envoyé avec succès !' : 'Message sent successfully!',
    successDesc: lang === 'fr' ? 'Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.' : 'Thank you for contacting us. Our team will get back to you as soon as possible.',
    newMessage: lang === 'fr' ? 'Envoyer un nouveau message' : 'Send a new message',
  };

  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      {/* Bouton retour */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 0' }}>
        <button
          onClick={() => {
            if (setView) setView('accueil');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'transparent',
            border: `1px solid ${c.ruleSoft}`,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
            color: c.ink2,
            fontFamily: c.fMono,
            letterSpacing: '0.02em',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.color = c.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = c.ruleSoft; e.currentTarget.style.color = c.ink2; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{t.back}</span>
        </button>
      </div>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${c.accent}15 0%, ${c.paper2} 100%)`,
        padding: '64px 32px',
        textAlign: 'center',
        borderBottom: `1px solid ${c.rule}`,
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{
            fontFamily: c.fSerif,
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 700,
            color: c.ink,
            marginBottom: 16,
            letterSpacing: '-0.01em',
          }}>{t.heroTitle}</h1>
          <p style={{
            fontSize: 17,
            color: c.ink2,
            lineHeight: 1.6,
          }}>{t.heroSub}</p>
        </div>
      </div>

      {/* Contenu principal */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px' }}>
        {/* Cartes d'infos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 32,
          marginBottom: 64,
        }}>
          {[
            { icon: '📧', title: t.email, detail: 'contact@oppstrack.com', sub: t.reply24h },
            { icon: '📞', title: t.phone, detail: '+216 51 551 456', sub: t.hours },
            { icon: '📍', title: t.address, detail: lang === 'fr' ? 'Tunis, Tunisie' : 'Tunis, Tunisia', sub: t.meet },
          ].map((item, i) => (
            <div key={i} style={{
              background: c.surface,
              border: `1px solid ${c.ruleSoft}`,
              padding: '28px 24px',
              textAlign: 'center',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = c.ruleSoft; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{item.icon}</div>
              <h3 style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, color: c.ink, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: c.accent, fontWeight: 500, marginBottom: 4 }}>{item.detail}</p>
              <p style={{ fontSize: 11, color: c.ink3, letterSpacing: '0.02em' }}>{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Formulaire */}
        <div style={{
          background: c.surface,
          border: `1px solid ${c.rule}`,
        }}>
          <div style={{
            padding: '32px 32px 24px',
            borderBottom: `1px solid ${c.rule}`,
            textAlign: 'center',
          }}>
            <h2 style={{ fontFamily: c.fSerif, fontSize: 28, fontWeight: 700, color: c.ink, marginBottom: 8 }}>{t.formTitle}</h2>
            <p style={{ fontSize: 13, color: c.ink2 }}>{t.formDesc}</p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
              <div style={{ marginBottom: 24 }}>
                <label htmlFor="name" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 6, letterSpacing: '0.02em' }}>{t.nameLabel} *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${errors.name ? c.danger : c.ruleSoft}`,
                    background: c.paper,
                    color: c.ink,
                    fontSize: 14,
                    fontFamily: c.fSans,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = c.accent}
                  onBlur={e => { if (!errors.name) e.target.style.borderColor = c.ruleSoft; }}
                  placeholder={t.namePlaceholder}
                />
                {errors.name && <span style={{ fontSize: 11, color: c.danger, marginTop: 4, display: 'block' }}>{errors.name}</span>}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label htmlFor="email" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 6, letterSpacing: '0.02em' }}>{t.emailLabel} *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${errors.email ? c.danger : c.ruleSoft}`,
                    background: c.paper,
                    color: c.ink,
                    fontSize: 14,
                    fontFamily: c.fSans,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = c.accent}
                  onBlur={e => { if (!errors.email) e.target.style.borderColor = c.ruleSoft; }}
                  placeholder="jean@example.com"
                />
                {errors.email && <span style={{ fontSize: 11, color: c.danger, marginTop: 4, display: 'block' }}>{errors.email}</span>}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label htmlFor="category" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 6, letterSpacing: '0.02em' }}>{t.categoryLabel} *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${errors.category ? c.danger : c.ruleSoft}`,
                    background: c.paper,
                    color: c.ink,
                    fontSize: 14,
                    fontFamily: c.fSans,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">{t.categoryPlaceholder}</option>
                  <option value="support">📩 {t.categories.support}</option>
                  <option value="bourse">🎓 {t.categories.scholarship}</option>
                  <option value="partenariat">💼 {t.categories.partnership}</option>
                  <option value="bug">🐞 {t.categories.bug}</option>
                  <option value="autre">❓ {t.categories.other}</option>
                </select>
                {errors.category && <span style={{ fontSize: 11, color: c.danger, marginTop: 4, display: 'block' }}>{errors.category}</span>}
              </div>

              <div style={{ marginBottom: 28 }}>
                <label htmlFor="message" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 6, letterSpacing: '0.02em' }}>{t.messageLabel} *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${errors.message ? c.danger : c.ruleSoft}`,
                    background: c.paper,
                    color: c.ink,
                    fontSize: 14,
                    fontFamily: c.fSans,
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = c.accent}
                  onBlur={e => { if (!errors.message) e.target.style.borderColor = c.ruleSoft; }}
                  placeholder={t.messagePlaceholder}
                />
                {errors.message && <span style={{ fontSize: 11, color: c.danger, marginTop: 4, display: 'block' }}>{errors.message}</span>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: c.accent,
                  border: 'none',
                  color: c.paper,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: c.fMono,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {isSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ width: 14, height: 14, border: `2px solid ${c.paper}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                    {t.sending}
                  </span>
                ) : t.submit}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 32px' }}>
              <div style={{
                width: 64,
                height: 64,
                margin: '0 auto 20px',
                background: c.accent,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                color: c.paper,
              }}>✓</div>
              <h3 style={{ fontFamily: c.fSerif, fontSize: 22, fontWeight: 700, color: c.ink, marginBottom: 12 }}>{t.successTitle}</h3>
              <p style={{ fontSize: 13, color: c.ink2, marginBottom: 28, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>{t.successDesc}</p>
              <button
                onClick={() => setSent(false)}
                style={{
                  padding: '10px 28px',
                  background: 'transparent',
                  border: `1px solid ${c.accent}`,
                  color: c.accent,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: c.fMono,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = c.accent; e.currentTarget.style.color = c.paper; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.accent; }}
              >
                {t.newMessage}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}