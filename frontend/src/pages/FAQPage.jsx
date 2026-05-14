// FaqPage.jsx — Page FAQ OppsTrack avec boutons fonctionnels
"use client";

import React, { useState, useMemo } from 'react';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';

/* ═══════════════════════════════════════════════════════════════════
   TOKENS OppsTrack
═══════════════════════════════════════════════════════════════════ */
const tokens = (theme) => ({
  accent:      theme === "dark" ? "#4c9fd9" : "#0066b3",
  accentDark:  theme === "dark" ? "#3a8fc9" : "#004f8a",
  accentSoft:  theme === "dark" ? "rgba(76,159,217,0.10)" : "rgba(0,102,179,0.08)",
  paper:       theme === "dark" ? "#15140f" : "#faf8f3",
  paper2:      theme === "dark" ? "#1d1c16" : "#f2efe7",
  surface:     theme === "dark" ? "#1a1912" : "#ffffff",
  ink:         theme === "dark" ? "#f2efe7" : "#141414",
  ink2:        theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3:        theme === "dark" ? "#a19f96" : "#6b6b6b",
  ink4:        theme === "dark" ? "#6d6b64" : "#9a9794",
  rule:        theme === "dark" ? "#2b2a22" : "#d9d5cb",
  ruleSoft:    theme === "dark" ? "#24231c" : "#e8e4d9",
  success:     "#166534",
  warning:     "#b06a12",
  danger:      "#b4321f",
  fSerif: `"Playfair Display", "Times New Roman", Georgia, serif`,
  fSans:  `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"DM Sans", monospace`,
  tr: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
});

/* ═══════════════════════════════════════════════════════════════════
   FAQ DATA
═══════════════════════════════════════════════════════════════════ */
const FAQ_CATEGORIES = (lang) => [
  { id: 'all',         label: lang === 'fr' ? 'Toutes'           : 'All',           icon: '◆' },
  { id: 'general',     label: lang === 'fr' ? 'Général'          : 'General',       icon: '💡' },
  { id: 'scholarship', label: lang === 'fr' ? 'Bourses'          : 'Scholarships',  icon: '🎓' },
  { id: 'ai',          label: lang === 'fr' ? 'IA & Match'       : 'AI & Match',    icon: '◆' },
  { id: 'account',     label: lang === 'fr' ? 'Compte & Profil'  : 'Account',       icon: '👤' },
  { id: 'application', label: lang === 'fr' ? 'Candidatures'     : 'Applications',  icon: '📝' },
  { id: 'pricing',     label: lang === 'fr' ? 'Tarifs'           : 'Pricing',       icon: '💳' },
];

const FAQ_DATA = (lang) => [
  // GENERAL
  {
    id: 1, category: 'general',
    q: lang === 'fr' ? "Qu'est-ce qu'OppsTrack ?" : 'What is OppsTrack?',
    a: lang === 'fr'
      ? "OppsTrack est une plateforme intelligente qui centralise les bourses entièrement financées dans le monde. Notre IA vous aide à découvrir les opportunités compatibles avec votre profil, évaluer votre match, préparer vos candidatures et suivre vos deadlines — tout au même endroit."
      : "OppsTrack is an intelligent platform that centralizes fully funded scholarships worldwide. Our AI helps you discover opportunities matching your profile, evaluate your fit, prepare your applications and track deadlines — all in one place.",
    popular: true,
  },
  {
    id: 2, category: 'general',
    q: lang === 'fr' ? 'OppsTrack est-il gratuit ?' : 'Is OppsTrack free?',
    a: lang === 'fr'
      ? "Oui, la version de base d'OppsTrack est entièrement gratuite. Vous pouvez créer votre profil, explorer les bourses, recevoir des recommandations IA et utiliser notre roadmap. Les fonctionnalités avancées (simulateur d'entretien illimité, génération de documents premium) sont disponibles dans nos plans payants."
      : "Yes, the basic version of OppsTrack is completely free. You can create your profile, explore scholarships, get AI recommendations and use our roadmap. Advanced features (unlimited interview simulator, premium document generation) are available in paid plans.",
    popular: true,
  },
  {
    id: 3, category: 'general',
    q: lang === 'fr' ? 'Dans quelles langues OppsTrack est-il disponible ?' : 'In which languages is OppsTrack available?',
    a: lang === 'fr'
      ? "OppsTrack est disponible en français et en anglais. Vous pouvez changer la langue à tout moment via le menu en haut de la page. Notre IA peut analyser et rédiger des documents dans les deux langues."
      : "OppsTrack is available in French and English. You can change the language at any time via the top menu. Our AI can analyze and write documents in both languages.",
  },

  // SCHOLARSHIPS
  {
    id: 4, category: 'scholarship',
    q: lang === 'fr' ? 'Combien de bourses sont disponibles sur la plateforme ?' : 'How many scholarships are available on the platform?',
    a: lang === 'fr'
      ? "Plus de 250 bourses entièrement financées, dans 40+ pays. Notre catalogue est mis à jour quotidiennement par notre équipe et vérifié à la source officielle. Nous couvrons les bourses gouvernementales (DAAD, Chevening, Fulbright...), institutionnelles et privées."
      : "More than 250 fully funded scholarships in 40+ countries. Our catalog is updated daily by our team and verified at the official source. We cover government scholarships (DAAD, Chevening, Fulbright...), institutional and private ones.",
    popular: true,
  },
  {
    id: 5, category: 'scholarship',
    q: lang === 'fr' ? 'Les bourses sont-elles vérifiées ?' : 'Are scholarships verified?',
    a: lang === 'fr'
      ? "Oui, toutes nos bourses sont vérifiées manuellement par notre équipe avant d'être publiées. Chaque opportunité inclut un lien direct vers la source officielle, les conditions d'éligibilité, le montant du financement et la date limite. Nous garantissons l'authenticité de chaque annonce."
      : "Yes, all our scholarships are manually verified by our team before being published. Each opportunity includes a direct link to the official source, eligibility conditions, funding amount and deadline. We guarantee the authenticity of every listing.",
  },
  {
    id: 6, category: 'scholarship',
    q: lang === 'fr' ? "Puis-je postuler directement depuis OppsTrack ?" : 'Can I apply directly from OppsTrack?',
    a: lang === 'fr'
      ? "OppsTrack vous accompagne dans la préparation de votre candidature (CV, lettre, documents) mais l'envoi final se fait sur le site officiel de la bourse. Nous vous redirigeons toujours vers la source légitime pour éviter toute fraude. Notre roadmap vous guide étape par étape jusqu'à la soumission."
      : "OppsTrack helps you prepare your application (CV, letter, documents) but the final submission is done on the scholarship's official website. We always redirect you to the legitimate source to avoid fraud. Our roadmap guides you step-by-step until submission.",
  },

  // AI & MATCH
  {
    id: 7, category: 'ai',
    q: lang === 'fr' ? 'Comment fonctionne le score de match ?' : 'How does the match score work?',
    a: lang === 'fr'
      ? "Notre IA analyse votre profil complet (niveau académique, GPA, langues, expériences, pays cibles) et le compare aux critères de chaque bourse. Vous recevez un score sur 100, avec une analyse détaillée par critère, vos points forts et axes d'amélioration. Plus votre profil est complet, plus le score est précis."
      : "Our AI analyzes your full profile (academic level, GPA, languages, experiences, target countries) and compares it to each scholarship's criteria. You get a score out of 100, with detailed per-criterion analysis, strengths and improvement areas. The more complete your profile, the more accurate the score.",
    popular: true,
  },
  {
    id: 8, category: 'ai',
    q: lang === 'fr' ? "Quelle IA est utilisée par OppsTrack ?" : 'Which AI does OppsTrack use?',
    a: lang === 'fr'
      ? "Nous utilisons Claude (Anthropic), une IA conversationnelle de pointe, pour l'analyse de profils, la génération de documents et le simulateur d'entretien. Vos données restent confidentielles et ne sont jamais utilisées pour entraîner les modèles."
      : "We use Claude (Anthropic), a cutting-edge conversational AI, for profile analysis, document generation and the interview simulator. Your data stays confidential and is never used to train models.",
  },
  {
    id: 9, category: 'ai',
    q: lang === 'fr' ? "L'IA peut-elle vraiment améliorer ma lettre de motivation ?" : 'Can AI really improve my motivation letter?',
    a: lang === 'fr'
      ? "Oui, notre IA est spécialisée dans la rédaction académique. Elle analyse votre lettre, détecte les faiblesses (clichés, structure, manque d'exemples concrets) et propose des reformulations adaptées au programme visé. Les utilisateurs rapportent en moyenne +30% de taux d'acceptation après optimisation."
      : "Yes, our AI is specialized in academic writing. It analyzes your letter, detects weaknesses (clichés, structure, lack of concrete examples) and suggests reformulations tailored to the target program. Users report an average +30% acceptance rate after optimization.",
  },

  // ACCOUNT
  {
    id: 10, category: 'account',
    q: lang === 'fr' ? 'Comment créer un compte ?' : 'How to create an account?',
    a: lang === 'fr'
      ? "Cliquez sur \"S'inscrire\", entrez votre email et recevez un lien magique sécurisé. Pas de mot de passe à retenir. La création du compte prend moins de 30 secondes. Ensuite, complétez votre profil pour bénéficier des recommandations personnalisées."
      : "Click \"Sign up\", enter your email and receive a secure magic link. No password to remember. Account creation takes less than 30 seconds. Then complete your profile to get personalized recommendations.",
  },
  {
    id: 11, category: 'account',
    q: lang === 'fr' ? 'Mes données sont-elles sécurisées ?' : 'Is my data secure?',
    a: lang === 'fr'
      ? "Vos données sont chiffrées et hébergées sur des serveurs européens conformes au RGPD. Nous ne vendons ni ne partageons vos informations avec des tiers. Vous pouvez exporter ou supprimer votre compte à tout moment depuis les paramètres."
      : "Your data is encrypted and hosted on European servers compliant with GDPR. We don't sell or share your information with third parties. You can export or delete your account at any time from settings.",
    popular: true,
  },
  {
    id: 12, category: 'account',
    q: lang === 'fr' ? "Comment supprimer mon compte ?" : 'How to delete my account?',
    a: lang === 'fr'
      ? "Allez dans Paramètres → Compte → Supprimer mon compte. Toutes vos données seront définitivement effacées sous 7 jours. Cette action est irréversible."
      : "Go to Settings → Account → Delete my account. All your data will be permanently erased within 7 days. This action is irreversible.",
  },

  // APPLICATION
  {
    id: 13, category: 'application',
    q: lang === 'fr' ? "Qu'est-ce que la roadmap de candidature ?" : 'What is the application roadmap?',
    a: lang === 'fr'
      ? "C'est un guide étape par étape personnalisé pour chaque bourse que vous postulez : préparation du CV, lettres de recommandation, documents requis, simulation d'entretien, soumission. Vous suivez votre progression avec des deadlines et alertes automatiques."
      : "It's a step-by-step personalized guide for each scholarship you apply to: CV preparation, recommendation letters, required documents, interview simulation, submission. You track progress with deadlines and automatic alerts.",
  },
  {
    id: 14, category: 'application',
    q: lang === 'fr' ? 'Le simulateur d\'entretien est-il réaliste ?' : 'Is the interview simulator realistic?',
    a: lang === 'fr'
      ? "Notre simulateur reproduit les conditions réelles d'un entretien de bourse : questions spécifiques au programme, analyse vocale (rythme, hésitations, mots de remplissage), scoring sur 100 et feedback détaillé. Plus de 80% des utilisateurs déclarent se sentir mieux préparés après 3 sessions."
      : "Our simulator reproduces real scholarship interview conditions: program-specific questions, voice analysis (pace, hesitations, filler words), scoring out of 100 and detailed feedback. More than 80% of users feel better prepared after 3 sessions.",
  },
  {
    id: 15, category: 'application',
    q: lang === 'fr' ? 'Combien de candidatures puis-je préparer en parallèle ?' : 'How many applications can I prepare in parallel?',
    a: lang === 'fr'
      ? "Aucune limite. Vous pouvez créer autant de roadmaps que vous le souhaitez. Notre dashboard centralisé vous permet de visualiser toutes vos candidatures en cours, vos deadlines et votre progression globale."
      : "No limit. You can create as many roadmaps as you want. Our centralized dashboard lets you visualize all ongoing applications, deadlines and overall progress.",
  },

  // PRICING
  {
    id: 16, category: 'pricing',
    q: lang === 'fr' ? 'Quels sont les plans payants ?' : 'What are the paid plans?',
    a: lang === 'fr'
      ? "Nous proposons un plan Premium à 9€/mois avec : simulateur d'entretien illimité, génération avancée de CV/lettres, support prioritaire et accès aux guides exclusifs. Un plan Pro à 19€/mois ajoute un coaching personnalisé avec un expert. Annulation possible à tout moment."
      : "We offer a Premium plan at €9/month with: unlimited interview simulator, advanced CV/letter generation, priority support and exclusive guides. A Pro plan at €19/month adds personalized coaching with an expert. Cancel anytime.",
  },
  {
    id: 17, category: 'pricing',
    q: lang === 'fr' ? "Y a-t-il une réduction pour étudiants ?" : 'Is there a student discount?',
    a: lang === 'fr'
      ? "Oui, nous offrons -50% sur tous nos plans payants aux étudiants vérifiés (justificatif requis). Nous proposons aussi des bourses OppsTrack gratuites pour les étudiants en situation financière difficile — contactez notre équipe pour candidater."
      : "Yes, we offer -50% on all paid plans for verified students (proof required). We also provide free OppsTrack scholarships for students in financial difficulty — contact our team to apply.",
  },
  {
    id: 18, category: 'pricing',
    q: lang === 'fr' ? 'Comment annuler mon abonnement ?' : 'How to cancel my subscription?',
    a: lang === 'fr'
      ? "Allez dans Paramètres → Abonnement → Annuler. Votre accès Premium reste actif jusqu'à la fin de la période payée. Aucun frais caché, aucun engagement minimum."
      : "Go to Settings → Subscription → Cancel. Your Premium access remains active until the end of the paid period. No hidden fees, no minimum commitment.",
  },
];

/* ═══════════════════════════════════════════════════════════════════
   FAQ ITEM (Accordion)
═══════════════════════════════════════════════════════════════════ */
function FaqItem({ item, index, isOpen, onToggle, c, lang }) {
  return (
    <article style={{
      borderBottom: `1px solid ${c.ruleSoft}`,
      animation: `fadeUp 0.4s ease ${index * 0.04}s both`,
    }}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          padding: '24px 4px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 20,
          textAlign: 'left',
          fontFamily: c.fSans,
          transition: c.tr,
        }}
        onMouseEnter={e => {
          const h3 = e.currentTarget.querySelector('h3');
          if (h3) h3.style.color = c.accent;
        }}
        onMouseLeave={e => {
          const h3 = e.currentTarget.querySelector('h3');
          if (h3 && !isOpen) h3.style.color = c.ink;
        }}
      >
        <span style={{
          fontFamily: c.fMono,
          fontSize: 11,
          color: isOpen ? c.accent : c.ink3,
          fontWeight: 700,
          letterSpacing: '0.1em',
          marginTop: 4,
          flexShrink: 0,
          minWidth: 32,
          transition: c.tr,
        }}>
          {String(index + 1).padStart(2, '0')}
        </span>

        <h3 style={{
          flex: 1,
          fontFamily: c.fSerif,
          fontSize: 19,
          fontWeight: 700,
          lineHeight: 1.35,
          letterSpacing: '-0.01em',
          margin: 0,
          color: isOpen ? c.accent : c.ink,
          transition: c.tr,
        }}>
          {item.q}
        </h3>

        <div style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: isOpen ? c.accent : 'transparent',
          border: `1px solid ${isOpen ? c.accent : c.rule}`,
          color: isOpen ? '#fff' : c.ink2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: c.tr,
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </button>

      <div style={{
        overflow: 'hidden',
        maxHeight: isOpen ? 600 : 0,
        opacity: isOpen ? 1 : 0,
        transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease',
      }}>
        <div style={{
          padding: '0 56px 28px 52px',
          fontFamily: c.fSans,
          fontSize: 15,
          color: c.ink2,
          lineHeight: 1.75,
        }}>
          {item.a}
        </div>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   POPULAR QUESTIONS SECTION
═══════════════════════════════════════════════════════════════════ */
function PopularQuestions({ items, onClick, c, lang }) {
  return (
    <section style={{
      background: c.surface,
      border: `1px solid ${c.rule}`,
      padding: '32px 36px',
      marginBottom: 48,
      animation: 'fadeUp 0.5s ease',
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline',
        gap: 12, marginBottom: 24, paddingBottom: 16,
        borderBottom: `2px solid ${c.ink}`,
      }}>
        <span style={{
          fontFamily: c.fMono, fontSize: 10,
          color: c.accent, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
        }}>◆ {lang === 'fr' ? 'Top' : 'Top'}</span>
        <h2 style={{
          fontFamily: c.fSerif, fontSize: 22, fontWeight: 700,
          color: c.ink, margin: 0, letterSpacing: '-0.01em',
        }}>
          {lang === 'fr' ? 'Questions les plus posées' : 'Most asked questions'}
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => onClick(item.id)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '16px 18px',
              background: c.paper2, border: `1px solid ${c.ruleSoft}`,
              cursor: 'pointer',
              textAlign: 'left',
              transition: c.tr,
              fontFamily: c.fSans,
              animation: `fadeUp 0.4s ease ${i * 0.08}s both`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = c.surface;
              e.currentTarget.style.borderColor = c.accent;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = c.paper2;
              e.currentTarget.style.borderColor = c.ruleSoft;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{
              fontFamily: c.fMono, fontSize: 11,
              color: c.accent, fontWeight: 700,
              flexShrink: 0,
            }}>↗</span>
            <span style={{
              fontFamily: c.fSerif, fontSize: 14,
              color: c.ink, fontWeight: 600, lineHeight: 1.4,
              flex: 1,
            }}>
              {item.q}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONTACT CTA — Boutons fonctionnels
═══════════════════════════════════════════════════════════════════ */
function ContactCTA({ c, lang, onOpenChat, onContactPage }) {
  return (
    <section style={{
      background: c.ink,
      color: c.paper,
      padding: '64px 32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -100, left: -100,
        width: 400, height: 400,
        background: `radial-gradient(circle, ${c.accent}25 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 900, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: 48, alignItems: 'center',
        position: 'relative',
      }} className="contact-cta-grid">
        <div>
          <div style={{
            fontSize: 11, color: c.accent,
            fontFamily: c.fMono, fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            ◆ {lang === 'fr' ? 'Aide directe' : 'Direct help'}
          </div>
          <h2 style={{
            fontFamily: c.fSerif,
            fontSize: 'clamp(26px, 3.5vw, 38px)',
            fontWeight: 700, letterSpacing: '-0.02em',
            lineHeight: 1.1, margin: '0 0 14px',
          }}>
            {lang === 'fr'
              ? <>Pas trouvé votre <em style={{ color: c.accent, fontStyle: 'italic' }}>réponse</em> ?</>
              : <>Didn't find your <em style={{ color: c.accent, fontStyle: 'italic' }}>answer</em>?</>}
          </h2>
          <p style={{ fontSize: 15, opacity: 0.8, lineHeight: 1.6, margin: 0 }}>
            {lang === 'fr'
              ? "Notre équipe support est disponible 24/7 par chat. Réponse moyenne en moins de 2 heures."
              : "Our support team is available 24/7 by chat. Average response in under 2 hours."}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Bouton Chat */}
          <button 
            onClick={onOpenChat}
            style={{
              padding: '14px 26px',
              background: c.accent, color: '#fff', border: 'none',
              fontFamily: c.fSans, fontSize: 12, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              cursor: 'pointer', transition: c.tr,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              boxShadow: `0 4px 16px ${c.accent}40`,
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${c.accent}60`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${c.accent}40`; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <span>💬 {lang === 'fr' ? 'Ouvrir le chat' : 'Open chat'}</span>
            <span>→</span>
          </button>

          {/* Bouton Contact Page */}
          <button 
            onClick={onContactPage}
            style={{
              padding: '14px 26px',
              background: 'transparent', color: c.paper,
              border: `1px solid rgba(250,248,243,0.4)`,
              fontFamily: c.fSans, fontSize: 12, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              cursor: 'pointer', transition: c.tr,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = c.paper; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(250,248,243,0.4)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <span>✉ {lang === 'fr' ? 'Nous écrire' : 'Email us'}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function FaQPage({ setView, onToggleChat }) {
  const { lang } = useT?.() || { lang: 'fr' };
  const { theme } = useTheme?.() || { theme: 'light' };
  const c = tokens(theme);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState(new Set());

  const categories = FAQ_CATEGORIES(lang);
  const allFaqs = FAQ_DATA(lang);

  const filtered = useMemo(() => {
    let r = [...allFaqs];
    if (activeCategory !== 'all') r = r.filter(f => f.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
    }
    return r;
  }, [allFaqs, activeCategory, searchQuery]);

  const popular = useMemo(() => allFaqs.filter(f => f.popular), [allFaqs]);

  const toggleOpen = (id) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePopularClick = (id) => {
    setOpenIds(prev => new Set([...prev, id]));
    setActiveCategory('all');
    setSearchQuery('');
    setTimeout(() => {
      const el = document.getElementById(`faq-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const expandAll = () => setOpenIds(new Set(filtered.map(f => f.id)));
  const collapseAll = () => setOpenIds(new Set());

  // ✅ Gestion du chat
  const handleOpenChat = () => {
    if (onToggleChat) {
      onToggleChat();
    } else {
      console.log('Chat toggle not available');
    }
  };

  // ✅ Gestion de la page Contact
  const handleContactPage = () => {
    if (setView) {
      setView('contact');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.log('Navigation not available');
    }
  };

  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 900px) {
          .contact-cta-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section style={{
        background: c.paper2,
        padding: '72px 32px 56px',
        borderBottom: `1px solid ${c.rule}`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -150, right: -150,
          width: 500, height: 500,
          background: `radial-gradient(circle, ${c.accent}08 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', animation: 'fadeIn 0.5s ease' }}>
          

          <h1 style={{
            fontFamily: c.fSerif,
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.02,
            color: c.ink,
            margin: '0 0 22px',
          }}>
            {lang === 'fr'
              ? <>Vos <em style={{ color: c.accent, fontStyle: 'italic' }}>questions</em>,<br />nos réponses.</>
              : <>Your <em style={{ color: c.accent, fontStyle: 'italic' }}>questions</em>,<br />our answers.</>}
          </h1>

          <p style={{
            fontFamily: c.fSans, fontSize: 17,
            color: c.ink2, lineHeight: 1.6,
            maxWidth: 580, margin: '0 0 32px',
          }}>
            {lang === 'fr'
              ? "Tout ce qu'il faut savoir sur OppsTrack — bourses, IA, comptes, candidatures. Et si vous ne trouvez pas, notre équipe répond en moins de 2 heures."
              : "Everything you need to know about OppsTrack — scholarships, AI, accounts, applications. And if you can't find it, our team replies in under 2 hours."}
          </p>

          {/* Search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: c.surface, padding: '6px 8px 6px 20px',
            border: `1.5px solid ${c.rule}`,
            maxWidth: 640,
            transition: c.tr,
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          }}>
            <span style={{ fontSize: 18 }}>🔍</span>
            <input
              type="text"
              placeholder={lang === 'fr' ? 'Rechercher une question...' : 'Search a question...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                padding: '14px 0', color: c.ink,
                fontFamily: c.fSans, fontSize: 15,
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 16, color: c.ink3, padding: '0 12px',
              }}>✕</button>
            )}
            <button style={{
              padding: '12px 20px',
              background: c.accent, color: '#fff',
              border: 'none',
              fontFamily: c.fSans, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>
              {lang === 'fr' ? 'Chercher' : 'Search'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <section style={{ padding: '48px 32px 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Popular questions */}
          {!searchQuery && activeCategory === 'all' && (
            <PopularQuestions items={popular} onClick={handlePopularClick} c={c} lang={lang} />
          )}

          {/* Category filters */}
          <div style={{
            display: 'flex', gap: 6, marginBottom: 36,
            flexWrap: 'wrap',
          }}>
            {categories.map(cat => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '9px 16px',
                    background: active ? c.ink : 'transparent',
                    color: active ? c.paper : c.ink2,
                    border: `1px solid ${active ? c.ink : c.rule}`,
                    fontFamily: c.fMono, fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    cursor: 'pointer', transition: c.tr,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = c.ink; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = c.rule; }}
                >
                  <span style={{ fontSize: 13 }}>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Section header + actions */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            paddingBottom: 16, marginBottom: 8,
            borderBottom: `2px solid ${c.ink}`,
            flexWrap: 'wrap', gap: 12,
          }}>
            <h2 style={{
              fontFamily: c.fSerif, fontSize: 26, fontWeight: 700,
              color: c.ink, margin: 0, letterSpacing: '-0.015em',
            }}>
              {searchQuery
                ? (lang === 'fr' ? `Résultats pour "${searchQuery}"` : `Results for "${searchQuery}"`)
                : activeCategory === 'all'
                ? (lang === 'fr' ? 'Toutes les questions' : 'All questions')
                : categories.find(cat => cat.id === activeCategory)?.label}
              <span style={{
                marginLeft: 12, fontFamily: c.fMono, fontSize: 13,
                color: c.ink3, fontWeight: 500,
              }}>
                · {filtered.length}
              </span>
            </h2>

            {filtered.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={expandAll} style={{
                  padding: '6px 12px',
                  background: 'transparent', border: `1px solid ${c.rule}`,
                  color: c.ink2,
                  fontFamily: c.fMono, fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: c.tr,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.ink; e.currentTarget.style.color = c.ink; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c.rule; e.currentTarget.style.color = c.ink2; }}>
                  {lang === 'fr' ? 'Tout ouvrir' : 'Expand all'}
                </button>
                <button onClick={collapseAll} style={{
                  padding: '6px 12px',
                  background: 'transparent', border: `1px solid ${c.rule}`,
                  color: c.ink2,
                  fontFamily: c.fMono, fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: c.tr,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.ink; e.currentTarget.style.color = c.ink; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c.rule; e.currentTarget.style.color = c.ink2; }}>
                  {lang === 'fr' ? 'Tout fermer' : 'Collapse all'}
                </button>
              </div>
            )}
          </div>

          {/* FAQ list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 56, marginBottom: 18, opacity: 0.4 }}>◇</div>
              <h3 style={{ fontFamily: c.fSerif, fontSize: 22, fontWeight: 700, color: c.ink, marginBottom: 10 }}>
                {lang === 'fr' ? 'Aucune question trouvée' : 'No question found'}
              </h3>
              <p style={{ color: c.ink3, fontSize: 14, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                {lang === 'fr'
                  ? "Essayez avec d'autres mots-clés ou contactez directement notre équipe."
                  : 'Try different keywords or contact our team directly.'}
              </p>
              <button onClick={() => { setActiveCategory('all'); setSearchQuery(''); }} style={{
                padding: '11px 24px',
                background: c.accent, color: '#fff', border: 'none',
                fontFamily: c.fSans, fontSize: 12, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}>
                {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
              </button>
            </div>
          ) : (
            <div>
              {filtered.map((item, i) => (
                <div key={item.id} id={`faq-${item.id}`}>
                  <FaqItem
                    item={item}
                    index={i}
                    isOpen={openIds.has(item.id)}
                    onToggle={() => toggleOpen(item.id)}
                    c={c}
                    lang={lang}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Contact CTA avec boutons fonctionnels ── */}
      <ContactCTA 
        c={c} 
        lang={lang} 
        onOpenChat={handleOpenChat}
        onContactPage={handleContactPage}
      />
    </main>
  );
}