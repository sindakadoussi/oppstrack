// ═══════════════════════════════════════════════════════════════════════════
//  OppsTrack — Système de traduction FR / EN
//  Usage : import { useT, LanguageProvider, LanguageToggle } from './i18n';
// ═══════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect } from 'react';

/* ─── Dictionnaire ────────────────────────────────────────────────────────── */
export const TRANSLATIONS = {

  /* ── COMMUN ── */
  common: {
    fr: {
      loading: 'Chargement…',
      error: 'Erreur',
      save: 'Enregistrer',
      cancel: 'Annuler',
      close: 'Fermer',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      search: 'Rechercher',
      filter: 'Filtrer',
      sort: 'Trier',
      all: 'Tous',
      none: 'Aucun',
      yes: 'Oui',
      no: 'Non',
      confirm: 'Confirmer',
      delete: 'Supprimer',
      edit: 'Modifier',
      add: 'Ajouter',
      view: 'Voir',
      apply: 'Postuler',
      download: 'Télécharger',
      upload: 'Importer',
      send: 'Envoyer',
      retry: 'Réessayer',
      seeMore: 'Voir plus',
      seeLess: 'Voir moins',
      noData: 'Aucune donnée disponible',
      required: 'Requis',
      optional: 'Optionnel',
    },
    en: {
      loading: 'Loading…',
      error: 'Error',
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      all: 'All',
      none: 'None',
      yes: 'Yes',
      no: 'No',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      view: 'View',
      apply: 'Apply',
      download: 'Download',
      upload: 'Upload',
      send: 'Send',
      retry: 'Retry',
      seeMore: 'See more',
      seeLess: 'See less',
      noData: 'No data available',
      required: 'Required',
      optional: 'Optional',
    },
  },

  /* ── NAVBAR ── */
  navbar: {
    fr: {
      chat: 'Assistant IA',
      bourses: 'Bourses',
      dashboard: 'Tableau de bord',
      roadmap: 'Roadmap',
      entretien: 'Entretien IA',
      profil: 'Mon profil',
      login: 'Se connecter',
      logout: 'Se déconnecter',
      guest: 'Visiteur',
    },
    en: {
      chat: 'AI Assistant',
      bourses: 'Scholarships',
      dashboard: 'Dashboard',
      roadmap: 'Roadmap',
      entretien: 'AI Interview',
      profil: 'My Profile',
      login: 'Sign in',
      logout: 'Sign out',
      guest: 'Guest',
    },
  },

  /* ── CHAT PAGE ── */
  chat: {
    fr: {
      badge: '✨ Propulsé par l\'IA',
      title: 'Trouvez votre bourse',
      titleAccent: '100% financée',
      subtitle: 'Discutez avec notre IA. Elle analyse votre profil, recommande les meilleures opportunités et vous guide à chaque étape.',
      welcome: 'Bonjour',
      welcomeText: 'Je suis votre assistant OppsTrack. Je peux :',
      cap1: '🎓 Recommander des bourses selon votre profil',
      cap2: '📋 Vous guider sur les démarches à suivre',
      cap3: '🎙️ Vous préparer à vos entretiens',
      cap4: '📄 Analyser votre CV et lettre de motivation',
      welcomeEnd: 'Par où voulez-vous commencer ?',
      typing: 'En train de répondre…',
      inputPlaceholder: 'Posez votre question…',
      statBourses: 'Bourses',
      statFinancees: 'Financées',
      statActive: 'IA active',
      qr_bourses: 'Trouver mes bourses',
      qr_connect: 'Me connecter',
      qr_roadmap: 'Voir la roadmap',
      qr_entretien: 'Préparer un entretien',
      qr_cv: 'Analyser mon CV',
      qr_guest: 'Mode invité',
      cardsTitle: 'bourses recommandées',
      cardsSubtitle: 'selon votre profil',
      viewDetails: '🔍 Voir détails',
      officialSite: '🔗 Site officiel',
      addRoadmap: '📋 Postuler',
      added: '✓ Ajouté',
      showMore: 'Voir',
      moreScholarships: 'bourses de plus ↓',
      featTitle: 'Tout ce dont vous avez besoin pour',
      featTitleAccent: ' décrocher votre bourse',
      featEyebrow: 'Pourquoi OppsTrack ?',
      feat1Title: 'Matching intelligent',
      feat1Desc: "L'IA analyse votre profil et recommande les bourses avec les meilleures chances de succès.",
      feat1Cta: 'Trouver mes bourses',
      feat2Title: 'Roadmap personnalisée',
      feat2Desc: 'Chaque candidature décomposée étape par étape : documents, lettre, soumission, résultat.',
      feat2Cta: 'Voir la roadmap',
      feat3Title: 'Entretiens simulés IA',
      feat3Desc: 'Notre IA joue le rôle du jury. Obtenez un score et des conseils personnalisés.',
      feat3Cta: 'Préparer mon entretien',
      feat4Title: 'Analyse de documents',
      feat4Desc: "CV, lettre de motivation — l'IA identifie vos points forts et propose des améliorations.",
      feat4Cta: 'Analyser mon CV',
      feat5Title: 'Carte mondiale',
      feat5Desc: 'Explorez les bourses dans le monde entier. Filtrez par pays, niveau et domaine.',
      feat5Cta: 'Explorer la carte',
      feat6Title: 'Tableau de bord',
      feat6Desc: 'Suivez vos candidatures, alertes de deadlines et score de préparation en temps réel.',
      feat6Cta: 'Voir le dashboard',
    },
    en: {
      badge: '✨ Powered by AI',
      title: 'Find your scholarship',
      titleAccent: '100% funded',
      subtitle: 'Chat with our AI. It analyzes your profile, recommends the best opportunities and guides you every step of the way.',
      welcome: 'Hello',
      welcomeText: 'I am your OppsTrack assistant. I can:',
      cap1: '🎓 Recommend scholarships matching your profile',
      cap2: '📋 Guide you through the application process',
      cap3: '🎙️ Prepare you for scholarship interviews',
      cap4: '📄 Analyze your CV and cover letter',
      welcomeEnd: 'Where would you like to start?',
      typing: 'Typing…',
      inputPlaceholder: 'Ask your question…',
      statBourses: 'Scholarships',
      statFinancees: 'Fully Funded',
      statActive: 'AI active',
      qr_bourses: 'Find my scholarships',
      qr_connect: 'Sign in',
      qr_roadmap: 'See the roadmap',
      qr_entretien: 'Prepare an interview',
      qr_cv: 'Analyze my CV',
      qr_guest: 'Guest mode',
      cardsTitle: 'recommended scholarships',
      cardsSubtitle: 'based on your profile',
      viewDetails: '🔍 View details',
      officialSite: '🔗 Official site',
      addRoadmap: '📋 Apply',
      added: '✓ Added',
      showMore: 'Show',
      moreScholarships: 'more scholarships ↓',
      featTitle: 'Everything you need to',
      featTitleAccent: ' land your scholarship',
      featEyebrow: 'Why OppsTrack?',
      feat1Title: 'Smart Matching',
      feat1Desc: 'The AI analyzes your profile and recommends scholarships with the best success chances.',
      feat1Cta: 'Find my scholarships',
      feat2Title: 'Personalized Roadmap',
      feat2Desc: 'Each application broken down step by step: documents, letter, submission, result.',
      feat2Cta: 'See the roadmap',
      feat3Title: 'AI Mock Interviews',
      feat3Desc: 'Our AI plays the role of the jury. Get a score and personalized feedback.',
      feat3Cta: 'Prepare my interview',
      feat4Title: 'Document Analysis',
      feat4Desc: 'CV, cover letter — the AI identifies your strengths and suggests improvements.',
      feat4Cta: 'Analyze my CV',
      feat5Title: 'World Map',
      feat5Desc: 'Explore scholarships worldwide. Filter by country, level and field.',
      feat5Cta: 'Explore the map',
      feat6Title: 'Dashboard',
      feat6Desc: 'Track your applications, deadline alerts and preparation score in real time.',
      feat6Cta: 'See the dashboard',
    },
  },

  /* ── DASHBOARD ── */
  dashboard: {
    fr: {
      title: 'Tableau de Bord',
      subtitle: 'voici l\'état de vos bourses.',
      hello: 'Bonjour',
      exploreBourses: 'Explorer Bourses',
      lightMode: '☀️ Clair',
      darkMode: '🌙 Sombre',
      streak: 'jour(s) de suite',
      urgentBanner: 'deadline(s) urgente(s) :',
      seeUrgent: 'Voir',
      kpi_bourses: 'Bourses disponibles',
      kpi_roadmap: 'Dans ma roadmap',
      kpi_deadlines: 'Deadlines ce mois',
      kpi_score: 'Score entretien',
      today: 'Aujourd\'hui — Que faire ?',
      conseils: '💡 Conseils',
      toComplete: 'À compléter',
      profileOk: 'Profil OK ✓',
      forceDossier: '📋 Force du dossier',
      myRoadmap: '✅ Ma roadmap de candidature',
      clickToAdvance: 'Clique sur +1 pour avancer',
      seeAll: 'Voir tout →',
      myActivity: '📊 Mon activité',
      consecutiveDays: 'jours consécutifs',
      monthlyEvolution: '📈 Évolution mensuelle',
      last6Months: '6 derniers mois',
      interviewScore: '🎙️ Score entretien',
      simulations: 'simulation(s)',
      deadlineAlerts: '🔔 Alertes deadlines',
      urgent: 'urgente(s)',
      global6Months: '📅 Vue globale — 6 prochains mois',
      deadlinesToCome: 'deadline(s) à venir',
      calendarTitle: '📅 Calendrier des deadlines',
      upcomingDeadlines: '⏳ Prochaines échéances',
      worldMap: '🌍 Carte mondiale — Mon parcours',
      targetCountries: 'pays cibles en surbrillance',
      topCountries: 'Top pays',
      exploreWithAI: 'Explorer avec l\'IA',
      skillRadar: '🕸️ Radar compétences',
      interviewAdvice: '💪 Conseils entretien',
      aiSummary: '🤖 Résumé IA',
      weekly: 'Hebdomadaire',
      aiStrengths: '🧠 Forces & Faiblesses',
      ai: 'IA',
      generateSummary: '✨ Générer',
      generating: 'Analyse en cours...',
      regenerate: 'Régénérer',
      analyzeInterviews: '🧠 Analyser',
      launchInterview: '🎙️ Lancer entretien IA',
      completeProfile: 'Compléter →',
      roadmap: 'Roadmap',
      favorites: 'Favoris',
      interviews: 'Entretiens',
      completed: 'Terminée(s)',
      inProgress: 'En cours',
      toStart: 'À démarrer',
      tracked: 'En suivi',
      urgent2: 'Urgentes',
      noActivity: 'Aucune activité récente',
      noDeadline: 'Aucune deadline',
      noScholarship: 'Aucune bourse',
      notConnected: 'Tableau de bord non disponible',
      connectToAccess: 'Connectez-vous pour accéder à votre tableau de bord.',
      signIn: '🔐 Se connecter',
    },
    en: {
      title: 'Dashboard',
      subtitle: 'here is the status of your scholarships.',
      hello: 'Hello',
      exploreBourses: 'Explore Scholarships',
      lightMode: '☀️ Light',
      darkMode: '🌙 Dark',
      streak: 'day(s) in a row',
      urgentBanner: 'urgent deadline(s):',
      seeUrgent: 'View',
      kpi_bourses: 'Available scholarships',
      kpi_roadmap: 'In my roadmap',
      kpi_deadlines: 'Deadlines this month',
      kpi_score: 'Interview score',
      today: 'Today — What to do?',
      conseils: '💡 Tips',
      toComplete: 'To complete',
      profileOk: 'Profile OK ✓',
      forceDossier: '📋 Profile strength',
      myRoadmap: '✅ My application roadmap',
      clickToAdvance: 'Click +1 to advance',
      seeAll: 'See all →',
      myActivity: '📊 My activity',
      consecutiveDays: 'consecutive day(s)',
      monthlyEvolution: '📈 Monthly evolution',
      last6Months: 'Last 6 months',
      interviewScore: '🎙️ Interview score',
      simulations: 'simulation(s)',
      deadlineAlerts: '🔔 Deadline alerts',
      urgent: 'urgent',
      global6Months: '📅 Global view — Next 6 months',
      deadlinesToCome: 'upcoming deadline(s)',
      calendarTitle: '📅 Deadline calendar',
      upcomingDeadlines: '⏳ Upcoming deadlines',
      worldMap: '🌍 World map — My journey',
      targetCountries: 'target countries highlighted',
      topCountries: 'Top countries',
      exploreWithAI: 'Explore with AI',
      skillRadar: '🕸️ Skills radar',
      interviewAdvice: '💪 Interview tips',
      aiSummary: '🤖 AI Summary',
      weekly: 'Weekly',
      aiStrengths: '🧠 Strengths & Weaknesses',
      ai: 'AI',
      generateSummary: '✨ Generate',
      generating: 'Analyzing...',
      regenerate: 'Regenerate',
      analyzeInterviews: '🧠 Analyze',
      launchInterview: '🎙️ Launch AI interview',
      completeProfile: 'Complete →',
      roadmap: 'Roadmap',
      favorites: 'Favorites',
      interviews: 'Interviews',
      completed: 'Completed',
      inProgress: 'In progress',
      toStart: 'To start',
      tracked: 'Tracked',
      urgent2: 'Urgent',
      noActivity: 'No recent activity',
      noDeadline: 'No deadline',
      noScholarship: 'No scholarship',
      notConnected: 'Dashboard unavailable',
      connectToAccess: 'Sign in to access your personalized dashboard.',
      signIn: '🔐 Sign in',
    },
  },

  /* ── BOURSES PAGE ── */
  bourses: {
    fr: {
      title: 'Bourses disponibles',
      subtitle: 'bourses trouvées',
      searchPlaceholder: 'Rechercher une bourse…',
      filterPays: 'Pays',
      filterNiveau: 'Niveau',
      filterFinancement: 'Financement',
      filterDomaine: 'Domaine',
      noResult: 'Aucune bourse trouvée',
      noResultSub: 'Essayez de modifier vos filtres',
      officialSite: 'Site officiel',
      deadline: 'Deadline',
      funding: 'Financement',
      level: 'Niveau',
      domain: 'Domaine',
      country: 'Pays',
      fullyFunded: '100% financée',
      addRoadmap: 'Postuler',
      added: 'Ajouté ✓',
      details: 'Détails',
      askAI: 'Demander à l\'IA',
    },
    en: {
      title: 'Available scholarships',
      subtitle: 'scholarships found',
      searchPlaceholder: 'Search a scholarship…',
      filterPays: 'Country',
      filterNiveau: 'Level',
      filterFinancement: 'Funding',
      filterDomaine: 'Field',
      noResult: 'No scholarships found',
      noResultSub: 'Try adjusting your filters',
      officialSite: 'Official site',
      deadline: 'Deadline',
      funding: 'Funding',
      level: 'Level',
      domain: 'Field',
      country: 'Country',
      fullyFunded: 'Fully funded',
      addRoadmap: 'Apply',
      added: 'Added ✓',
      details: 'Details',
      askAI: 'Ask AI',
    },
  },

  /* ── ROADMAP PAGE ── */
  roadmap: {
    fr: {
      title: 'Ma Roadmap',
      empty: 'Aucune candidature en cours',
      emptySub: 'Allez dans Recommandations et cliquez sur 🗺️ Postuler pour démarrer votre roadmap.',
      seeRecos: '🎯 Voir les recommandations',
      refresh: '🔄 Actualiser mes bourses',
      generating: '🤖 Génération de ta roadmap personnalisée…',
      genFailed: 'Génération échouée',
      genFailedSub: 'Impossible de générer les étapes. Vérifie ton workflow n8n ou réessaie.',
      retryGen: '🔄 Réessayer la génération',
      stepOf: 'Étape',
      on: 'sur',
      progress: 'Progression',
      nextStep: 'Étape suivante →',
      aiHelp: '🤖 Aide IA',
      requiredDocs: 'Documents requis',
      globalAdvice: 'Conseil global',
      inProgress: 'En cours',
      submitted: 'Soumis',
      accepted: 'Accepté ✓',
      refused: 'Refusé',
      delete: 'Supprimer',
      regenerate: 'Régénérer',
      notConnected: 'Roadmap non disponible',
      connectToAccess: 'Connectez-vous pour suivre vos candidatures.',
    },
    en: {
      title: 'My Roadmap',
      empty: 'No active application',
      emptySub: 'Go to Recommendations and click 🗺️ Apply to start your roadmap.',
      seeRecos: '🎯 See recommendations',
      refresh: '🔄 Refresh my scholarships',
      generating: '🤖 Generating your personalized roadmap…',
      genFailed: 'Generation failed',
      genFailedSub: 'Could not generate steps. Check your n8n workflow or try again.',
      retryGen: '🔄 Retry generation',
      stepOf: 'Step',
      on: 'of',
      progress: 'Progress',
      nextStep: 'Next step →',
      aiHelp: '🤖 AI Help',
      requiredDocs: 'Required documents',
      globalAdvice: 'Global advice',
      inProgress: 'In progress',
      submitted: 'Submitted',
      accepted: 'Accepted ✓',
      refused: 'Refused',
      delete: 'Delete',
      regenerate: 'Regenerate',
      notConnected: 'Roadmap unavailable',
      connectToAccess: 'Sign in to track your applications.',
    },
  },

  /* ── ENTRETIEN PAGE ── */
  entretien: {
    fr: {
      title: 'Entretien IA',
      subtitle: 'Préparez-vous aux entretiens de bourses avec notre IA',
      startBtn: '🎙️ Démarrer l\'entretien',
      stopBtn: '⏹ Terminer l\'entretien',
      listening: 'En écoute…',
      speaking: 'L\'IA parle…',
      score: 'Score global',
      excellent: 'Excellent',
      good: 'Bien',
      toImprove: 'À améliorer',
      beginner: 'Débutant',
      feedback: 'Retour détaillé',
      history: 'Historique des entretiens',
      noHistory: 'Aucun entretien simulé pour le moment.',
      wpm: 'mots/min',
      duration: 'Durée',
      pause: 'Pause',
      resume: 'Reprendre',
      question: 'Question',
      yourAnswer: 'Votre réponse',
      notConnected: 'Entretien IA non disponible',
      connectToAccess: 'Connectez-vous pour pratiquer vos entretiens.',
    },
    en: {
      title: 'AI Interview',
      subtitle: 'Prepare for scholarship interviews with our AI',
      startBtn: '🎙️ Start interview',
      stopBtn: '⏹ End interview',
      listening: 'Listening…',
      speaking: 'AI speaking…',
      score: 'Global score',
      excellent: 'Excellent',
      good: 'Good',
      toImprove: 'To improve',
      beginner: 'Beginner',
      feedback: 'Detailed feedback',
      history: 'Interview history',
      noHistory: 'No mock interview yet.',
      wpm: 'words/min',
      duration: 'Duration',
      pause: 'Pause',
      resume: 'Resume',
      question: 'Question',
      yourAnswer: 'Your answer',
      notConnected: 'AI Interview unavailable',
      connectToAccess: 'Sign in to practice your interviews.',
    },
  },

  /* ── PROFIL PAGE ── */
  profil: {
    fr: {
      title: 'Mon Profil',
      subtitle: 'Complétez votre profil pour un meilleur matching',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      nationality: 'Nationalité',
      level: 'Niveau académique',
      field: 'Domaine d\'études',
      institution: 'Établissement',
      gpa: 'Moyenne (GPA)',
      languages: 'Langues',
      skills: 'Compétences',
      targetCountries: 'Pays cibles',
      targetDegree: 'Diplôme visé',
      motivation: 'Lettre de motivation',
      workExperience: 'Expériences professionnelles',
      projects: 'Projets académiques',
      saveProfile: 'Enregistrer le profil',
      profileSaved: '✓ Profil enregistré',
      magicLink: 'Lien magique',
      magicLinkDesc: 'Entrez votre email pour recevoir un lien de connexion.',
      sendLink: '✉️ Envoyer le lien magique',
      linkSent: 'Lien envoyé !',
      checkEmail: 'Vérifiez votre boîte mail (et les spams).',
      completion: 'Complétion du profil',
      notConnected: 'Profil non disponible',
      connectToAccess: 'Connectez-vous pour accéder à votre profil.',
    },
    en: {
      title: 'My Profile',
      subtitle: 'Complete your profile for better matching',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone',
      nationality: 'Nationality',
      level: 'Academic level',
      field: 'Field of study',
      institution: 'Institution',
      gpa: 'GPA',
      languages: 'Languages',
      skills: 'Skills',
      targetCountries: 'Target countries',
      targetDegree: 'Target degree',
      motivation: 'Motivation letter',
      workExperience: 'Work experience',
      projects: 'Academic projects',
      saveProfile: 'Save profile',
      profileSaved: '✓ Profile saved',
      magicLink: 'Magic link',
      magicLinkDesc: 'Enter your email to receive a login link.',
      sendLink: '✉️ Send magic link',
      linkSent: 'Link sent!',
      checkEmail: 'Check your inbox (and spam).',
      completion: 'Profile completion',
      notConnected: 'Profile unavailable',
      connectToAccess: 'Sign in to access your profile.',
    },
  },

  /* ── BOURSE DRAWER ── */
  drawer: {
    fr: {
      officialSite: '🔗 Site officiel',
      funding: 'Financement',
      level: 'Niveau',
      domain: 'Domaine',
      country: 'Pays',
      deadline: 'Deadline',
      description: 'Description',
      askAI: '🤖 Demander à l\'IA',
      choose: '🗺️ Ajouter à ma roadmap',
      added: '✓ Dans ma roadmap',
      favorite: '⭐ Favori',
      unfavorite: '★ Retirer des favoris',
      fullyFunded: '100% financée',
      expired: 'Expiré',
      daysLeft: 'j restants',
      close: 'Fermer',
    },
    en: {
      officialSite: '🔗 Official site',
      funding: 'Funding',
      level: 'Level',
      domain: 'Field',
      country: 'Country',
      deadline: 'Deadline',
      description: 'Description',
      askAI: '🤖 Ask AI',
      choose: '🗺️ Add to my roadmap',
      added: '✓ In my roadmap',
      favorite: '⭐ Favorite',
      unfavorite: '★ Remove from favorites',
      fullyFunded: 'Fully funded',
      expired: 'Expired',
      daysLeft: 'd left',
      close: 'Close',
    },
  },
};

/* ─── Context Langue ────────────────────────────────────────────────────── */
const LangContext = createContext({ lang: 'fr', setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('oppstrack_lang') || 'fr'; } catch { return 'fr'; }
  });
  const changeLang = (l) => {
    setLang(l);
    try { localStorage.setItem('oppstrack_lang', l); } catch {}
  };
  return <LangContext.Provider value={{ lang, setLang: changeLang }}>{children}</LangContext.Provider>;
}

/* ─── Hook useT ──────────────────────────────────────────────────────────── */
export function useT() {
  const { lang, setLang } = useContext(LangContext);
  const t = (section, key) => {
    const sec = TRANSLATIONS[section];
    if (!sec) return key;
    return sec[lang]?.[key] ?? sec['fr']?.[key] ?? key;
  };
  return { t, lang, setLang };
}

/* ─── Toggle Button ──────────────────────────────────────────────────────── */
export function LanguageToggle({ style = {} }) {
  const { lang, setLang } = useContext(LangContext);
  return (
    <button
      onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
      title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 8,
        border: '1.5px solid #e2e8f0',
        background: '#fff',
        color: '#255cae',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all .18s',
        fontFamily: 'inherit',
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
    >
      <span style={{ fontSize: 18 }}>{lang === 'fr' ? '🇬🇧' : '🇫🇷'}</span>
      <span>{lang === 'fr' ? 'EN' : 'FR'}</span>
    </button>
  );
}

/* ─── Dark Mode Context ──────────────────────────────────────────────────── */
const DarkContext = createContext({ darkMode: false, toggleDarkMode: () => {} });

export function DarkModeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('oppstrack_dark') === 'true'; } catch { return false; }
  });

  const toggleDarkMode = () => {
    setDarkMode(d => {
      const next = !d;
      try { localStorage.setItem('oppstrack_dark', String(next)); } catch {}
      document.body.classList.toggle('dark-mode', next);
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, []);

  return (
    <DarkContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkContext.Provider>
  );
}

export function useDark() {
  return useContext(DarkContext);
}

/* ─── Combined Provider ──────────────────────────────────────────────────── */
export function AppProviders({ children }) {
  return (
    <LanguageProvider>
      <DarkModeProvider>
        {children}
      </DarkModeProvider>
    </LanguageProvider>
  );
}

export default { 
  TRANSLATIONS, 
  LanguageProvider, 
  useT, 
  LanguageToggle, 
  DarkModeProvider, 
  useDark, 
  AppProviders 
};