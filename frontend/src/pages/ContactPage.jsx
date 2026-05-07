// ContactPage.jsx — version UX moderne avec auto-détection, cartes interactives, validation temps réel
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';

/* ═══════════════════════════════════════════════════════════════════════════
   TOKENS (identique à la homepage)
═══════════════════════════════════════════════════════════════════════════ */
const tokens = (theme) => ({
  accent:     theme === "dark" ? "#4c9fd9" : "#0066b3",
  ink:        theme === "dark" ? "#f2efe7" : "#141414",
  ink2:       theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3:       theme === "dark" ? "#a19f96" : "#6b6b6b",
  paper:      theme === "dark" ? "#15140f" : "#faf8f3",
  paper2:     theme === "dark" ? "#1d1c16" : "#f2efe7",
  rule:       theme === "dark" ? "#2b2a22" : "#d9d5cb",
  ruleSoft:   theme === "dark" ? "#24231c" : "#e8e4d9",
  surface:    theme === "dark" ? "#1a1912" : "#ffffff",
  danger:     "#b4321f",
  warn:       "#b06a12",
  success:    "#22c55e",
  successBg:  theme === "dark" ? "rgba(34,197,94,0.15)" : "#f0fdf4",
  fSerif: `"Libre Caslon Text", "Times New Roman", Georgia, serif`,
  fSans:  `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"JetBrains Mono", ui-monospace, Menlo, monospace`,
});

// Petite animation confetti
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

export default function ContactPage({ setView, user }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);

  // Stats support
  const stats = {
    totalHandled: 1250,
    avgResponseHours: 12,
    availability: 'online', // 'online', 'busy'
    sla: 95 // 95% within 12h
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    message: ""
  });
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [suggestedCategory, setSuggestedCategory] = useState(null);
  const [phoneError, setPhoneError] = useState('');

  const textareaRef = useRef(null);

  // Pré-remplir nom/email depuis le profil utilisateur
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // Auto‑détection de la catégorie à partir du message
  useEffect(() => {
    const msg = formData.message.toLowerCase();
    if (!msg) { setSuggestedCategory(null); return; }
    if (msg.includes('bourse') || msg.includes('scholarship') || msg.includes('financement')) {
      setSuggestedCategory('bourse');
    } else if (msg.includes('bug') || msg.includes('erreur') || msg.includes('error') || msg.includes('crash')) {
      setSuggestedCategory('bug');
    } else if (msg.includes('partenariat') || msg.includes('partnership') || msg.includes('collaboration')) {
      setSuggestedCategory('partenariat');
    } else if (msg.includes('support') || msg.includes('aide') || msg.includes('help')) {
      setSuggestedCategory('support');
    } else {
      setSuggestedCategory(null);
    }
  }, [formData.message]);

  // Validation temps réel
  useEffect(() => {
    const newErrors = {};
    if (formData.name.trim() === '') newErrors.name = true;
    if (formData.email.trim() === '' || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = true;
    if (formData.category === '') newErrors.category = true;
    if (formData.message.trim() === '') newErrors.message = true;
    setErrors(newErrors);
  }, [formData]);

  // Formatage téléphone avec indicatif +216
  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('216')) val = '+' + val;
    else if (val.length > 0 && !val.startsWith('+')) val = '+' + val;
    if (val.length > 14) val = val.slice(0, 14);
    setFormData(prev => ({ ...prev, phone: val }));
    if (val && !/^\+216\d{8}$/.test(val)) setPhoneError(lang === 'fr' ? 'Numéro tunisien invalide (ex: +216 XX XXX XXX)' : 'Invalid Tunisian number (e.g. +216 XX XXX XXX)');
    else setPhoneError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuickChoice = (preset) => {
    let category = '';
    let messageHint = '';
    if (preset === 'scholarship') { category = 'bourse'; messageHint = lang === 'fr' ? "Je souhaite postuler à une bourse mais j'ai besoin d'aide pour..." : "I want to apply for a scholarship but need help with..."; }
    else if (preset === 'bug') { category = 'bug'; messageHint = lang === 'fr' ? "J'ai rencontré un problème technique :" : "I encountered a technical issue:"; }
    else if (preset === 'partnership') { category = 'partenariat'; messageHint = lang === 'fr' ? "Je propose un partenariat avec..." : "I propose a partnership with..."; }
    setFormData(prev => ({ ...prev, category, message: messageHint }));
    if (textareaRef.current) textareaRef.current.focus();
  };

  const isFormValid = formData.name.trim() && formData.email.trim() && /\S+@\S+\.\S+/.test(formData.email) && formData.category && formData.message.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsSubmitting(true);
    // Simuler appel API (remplacer par axios.post)
    try {
      // await axiosInstance.post(API_ROUTES.contact.create, { ...formData, type: 'contact' });
      await new Promise(resolve => setTimeout(resolve, 1500));
      simpleConfetti();
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setFormData({
          name: user?.name || "",
          email: user?.email || "",
          phone: "",
          category: "",
          message: ""
        });
        setCharCount(0);
      }, 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
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
    phoneLabel: lang === 'fr' ? 'Téléphone (optionnel)' : 'Phone (optional)',
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
    messagePlaceholder: lang === 'fr' ? 'Expliquez votre demande, joignez des captures d’écran si nécessaire.' : 'Explain your request, include screenshots if necessary.',
    submit: lang === 'fr' ? 'Envoyer le message' : 'Send message',
    sending: lang === 'fr' ? 'Envoi en cours...' : 'Sending...',
    successTitle: lang === 'fr' ? 'Message envoyé avec succès !' : 'Message sent successfully!',
    successDesc: lang === 'fr' ? 'Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.' : 'Thank you for contacting us. Our team will get back to you as soon as possible.',
    newMessage: lang === 'fr' ? 'Envoyer un nouveau message' : 'Send a new message',
    copy: lang === 'fr' ? 'Copier' : 'Copy',
    copied: lang === 'fr' ? 'Copié !' : 'Copied!',
    call: lang === 'fr' ? 'Appeler' : 'Call',
    openMap: lang === 'fr' ? 'Ouvrir la carte' : 'Open map',
    statusOnline: lang === 'fr' ? 'Support en ligne' : 'Support online',
    statusBusy: lang === 'fr' ? 'Volume élevé (délai possible)' : 'High volume (possible delay)',
    responseTime: lang === 'fr'
  ? `SLA : ${stats.sla}% des messages traités sous ${stats.avgResponseHours}h ouvrées`
  : `SLA: ${stats.sla}% of messages answered within ${stats.avgResponseHours} business hours`,
   faqTitle: lang === 'fr' ? 'Questions fréquentes' : 'FAQ',
    faqs: lang === 'fr' ? [
      { q: 'Comment postuler à une bourse ?', a: 'Rendez-vous dans l’onglet "Bourses" et cliquez sur "Postuler".' },
      { q: 'Combien de temps faut-il pour recevoir une réponse ?', a: `Nous répondons à ${stats.sla}% des messages sous ${stats.avgResponseHours}h ouvrées.` },
      { q: 'Puis-je modifier mon profil après l’avoir créé ?', a: 'Oui, allez dans "Mon profil" et mettez à jour vos informations.' }
    ] : [
      { q: 'How to apply for a scholarship?', a: 'Go to the "Scholarships" tab and click "Apply".' },
      { q: 'How long does it take to get a reply?', a: `We answer ${stats.sla}% of messages within ${stats.avgResponseHours} business hours.` },
      { q: 'Can I edit my profile after creating it?', a: 'Yes, go to "My profile" and update your information.' }
    ]
  };

  // Copier email / téléphone
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    alert(type === 'email' ? t.copied : t.copied);
  };

  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      {/* Bouton retour */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 0' }}>
        <button onClick={() => setView('accueil')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'transparent', border: `1px solid ${c.ruleSoft}`, borderRadius: 40, cursor: 'pointer', fontSize: 12, fontFamily: c.fMono, color: c.ink2 }}>
          ← {t.back}
        </button>
      </div>

      {/* Hero avec SLA */}
      <div style={{ textAlign: 'center', padding: '48px 24px', background: c.paper2, borderBottom: `1px solid ${c.rule}` }}>
        <h1 style={{ fontFamily: c.fSerif, fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 700, color: c.ink, marginBottom: 12, letterSpacing: '-0.02em' }}>
          {t.heroTitle}
        </h1>
        <div style={{ width: 60, height: 3, background: c.accent, margin: '16px auto' }} />
        <p style={{ fontSize: 18, color: c.ink2, marginBottom: 24, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          {lang === 'fr' ? `${stats.totalHandled} messages traités · ${stats.avgResponseHours}h de réponse moyenne` : `${stats.totalHandled} messages processed · ${stats.avgResponseHours}h avg response`}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: stats.availability === 'online' ? '#e6f4ea' : '#fff3cd', padding: '6px 12px', borderRadius: 40 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: stats.availability === 'online' ? '#22c55e' : '#f5a623' }}></span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{stats.availability === 'online' ? t.statusOnline : t.statusBusy}</span>
          </div>
          <span style={{ fontSize: 13, color: c.ink3 }}>{t.responseTime}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px' }}>
        {/* Cartes interactives */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, marginBottom: 64 }}>
          {[
            { icon: (size) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, title: t.email, detail: 'contact@oppstrack.com', action: () => copyToClipboard('contact@oppstrack.com', 'email'), actionLabel: t.copy },
            { icon: (size) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>, title: t.phone, detail: '+216 51 551 456', action: () => window.location.href = 'tel:+21651551456', actionLabel: t.call },
            { icon: (size) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, title: t.address, detail: lang === 'fr' ? 'Tunis, Tunisie' : 'Tunis, Tunisia', action: () => window.open('https://maps.google.com/?q=Tunis,Tunisia', '_blank'), actionLabel: t.openMap },
          ].map((item, i) => (
            <div key={i} style={{ background: c.surface, border: `1px solid ${c.ruleSoft}`, padding: '24px', borderRadius: 16, textAlign: 'center', transition: 'transform 0.2s, border-color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = c.ruleSoft; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ width: 48, height: 48, margin: '0 auto 16px', color: c.accent }}>{item.icon(36)}</div>
              <h3 style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, color: c.ink, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: c.accent, fontWeight: 500, marginBottom: 12 }}>{item.detail}</p>
              <button onClick={item.action} style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${c.rule}`, borderRadius: 40, fontSize: 12, cursor: 'pointer', color: c.ink2, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = c.accent; e.currentTarget.style.color = c.paper; e.currentTarget.style.borderColor = c.accent; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.ink2; e.currentTarget.style.borderColor = c.rule; }}>
                {item.actionLabel}
              </button>
            </div>
          ))}
        </div>

        {/* Formulaire */}
        <div style={{ background: c.surface, border: `1px solid ${c.rule}`, borderRadius: 20, overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '32px 32px 24px', borderBottom: `1px solid ${c.rule}`, textAlign: 'center' }}>
            <h2 style={{ fontFamily: c.fSerif, fontSize: 28, fontWeight: 700, color: c.ink, marginBottom: 8 }}>{t.formTitle}</h2>
            <p style={{ fontSize: 13, color: c.ink2 }}>{t.formDesc}</p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
              {/* Choix rapides */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, justifyContent: 'center' }}>
                {[
                  { id: 'scholarship', label: lang === 'fr' ? '🎓 Bourse' : '🎓 Scholarship' },
                  { id: 'bug', label: lang === 'fr' ? '🐞 Bug' : '🐞 Bug' },
                  { id: 'partnership', label: lang === 'fr' ? '🤝 Partenariat' : '🤝 Partnership' }
                ].map(choice => (
                  <button key={choice.id} type="button" onClick={() => handleQuickChoice(choice.id)} style={{ padding: '8px 16px', background: c.paper2, border: `1px solid ${c.ruleSoft}`, borderRadius: 40, fontSize: 13, cursor: 'pointer', color: c.ink2 }}>
                    {choice.label}
                  </button>
                ))}
              </div>

              {/* Champ nom */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 6 }}>{t.nameLabel} *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.name ? c.danger : c.ruleSoft}`, borderRadius: 8, background: c.paper, color: c.ink, fontSize: 14 }} />
                {errors.name && <span style={{ fontSize: 11, color: c.danger }}>{lang === 'fr' ? 'Nom requis' : 'Name required'}</span>}
              </div>

              {/* Email */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 6 }}>Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.email ? c.danger : c.ruleSoft}`, borderRadius: 8, background: c.paper, color: c.ink, fontSize: 14 }} />
                {errors.email && <span style={{ fontSize: 11, color: c.danger }}>{lang === 'fr' ? 'Email valide requis' : 'Valid email required'}</span>}
              </div>

              {/* Téléphone optionnel avec formatage */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 6 }}>{t.phoneLabel}</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handlePhoneChange} placeholder="+216 XX XXX XXX" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${phoneError ? c.danger : c.ruleSoft}`, borderRadius: 8, background: c.paper, color: c.ink, fontSize: 14 }} />
                {phoneError && <span style={{ fontSize: 11, color: c.danger }}>{phoneError}</span>}
              </div>

              {/* Catégorie avec suggestion */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 6 }}>{t.categoryLabel} *</label>
                <select name="category" value={formData.category} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.category ? c.danger : c.ruleSoft}`, borderRadius: 8, background: c.paper, color: c.ink, fontSize: 14 }}>
                  <option value="">{t.categoryPlaceholder}</option>
                  <option value="support">{t.categories.support}</option>
                  <option value="bourse">{t.categories.scholarship}</option>
                  <option value="partenariat">{t.categories.partnership}</option>
                  <option value="bug">{t.categories.bug}</option>
                  <option value="autre">{t.categories.other}</option>
                </select>
                {suggestedCategory && !formData.category && (
                  <div style={{ marginTop: 6, fontSize: 12, color: c.accent }}>
                    {lang === 'fr' ? `💡 Catégorie suggérée : ${suggestedCategory === 'bourse' ? 'Question sur une bourse' : suggestedCategory === 'bug' ? 'Signaler un bug' : suggestedCategory === 'partenariat' ? 'Partenariat' : 'Support technique'}` : `💡 Suggested category: ${suggestedCategory === 'bourse' ? 'Scholarship' : suggestedCategory === 'bug' ? 'Bug' : suggestedCategory === 'partenariat' ? 'Partnership' : 'Support'}`}
                  </div>
                )}
                {errors.category && <span style={{ fontSize: 11, color: c.danger }}>{lang === 'fr' ? 'Catégorie requise' : 'Category required'}</span>}
              </div>

              {/* Message avec compteur */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 6 }}>{t.messageLabel} *</label>
                <textarea ref={textareaRef} name="message" value={formData.message} onChange={(e) => { handleChange(e); setCharCount(e.target.value.length); }} rows={6} placeholder={t.messagePlaceholder} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${errors.message ? c.danger : c.ruleSoft}`, borderRadius: 8, background: c.paper, color: c.ink, fontSize: 14, resize: 'vertical' }} />
                <div style={{ textAlign: 'right', fontSize: 11, color: charCount > 1000 ? c.danger : c.ink3, marginTop: 4 }}>{charCount}/1000</div>
                {errors.message && <span style={{ fontSize: 11, color: c.danger }}>{lang === 'fr' ? 'Message requis' : 'Message required'}</span>}
              </div>

              <button type="submit" disabled={!isFormValid || isSubmitting} style={{ width: '100%', padding: '12px', background: isFormValid ? c.accent : c.ruleSoft, color: isFormValid ? c.paper : c.ink3, border: 'none', borderRadius: 40, fontSize: 13, fontWeight: 600, cursor: isFormValid ? 'pointer' : 'not-allowed', transition: 'opacity 0.2s' }}>
                {isSubmitting ? t.sending : t.submit}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 32px' }}>
              <div style={{ width: 72, height: 72, margin: '0 auto 20px', background: c.success, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: c.paper, animation: 'scaleIn 0.3s ease' }}>✓</div>
              <h3 style={{ fontFamily: c.fSerif, fontSize: 24, fontWeight: 700, color: c.ink, marginBottom: 12 }}>{t.successTitle}</h3>
              <p style={{ fontSize: 13, color: c.ink2, marginBottom: 32 }}>{t.successDesc}</p>
              <button onClick={() => setSent(false)} style={{ padding: '10px 28px', background: c.accent, color: c.paper, border: 'none', borderRadius: 40, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {t.newMessage}
              </button>
            </div>
          )}
        </div>

        {/* Mini FAQ et Chat alternatif */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, alignItems: 'start' }}>
          <div style={{ background: c.surface, border: `1px solid ${c.rule}`, borderRadius: 16, padding: '24px' }}>
            <h3 style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, marginBottom: 16, color: c.accent }}>{t.faqTitle}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {t.faqs.map((faq, idx) => (
                <details key={idx} style={{ borderBottom: `1px solid ${c.ruleSoft}`, paddingBottom: 12 }}>
                  <summary style={{ fontWeight: 600, color: c.ink, cursor: 'pointer', fontSize: 14, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {faq.q}
                    <span style={{ fontSize: 12 }}>▼</span>
                  </summary>
                  <div style={{ marginTop: 8, fontSize: 13, color: c.ink2, lineHeight: 1.5 }}>{faq.a}</div>
                </details>
              ))}
            </div>
          </div>

          <div style={{ background: c.surface, border: `1px solid ${c.rule}`, borderRadius: 16, padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>💬</div>
            <h3 style={{ fontFamily: c.fSerif, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{lang === 'fr' ? 'Chat en direct' : 'Live chat'}</h3>
            <p style={{ fontSize: 12, color: c.ink2, marginBottom: 16 }}>{lang === 'fr' ? 'Une question urgente ? Discutez avec nous' : 'Urgent question? Chat with us'}</p>
            <button onClick={() => window.open('https://wa.me/21651551456', '_blank')} style={{ width: '100%', padding: '10px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 40, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </main>
  );
}