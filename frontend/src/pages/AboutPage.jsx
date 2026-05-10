// AboutPage.jsx — Version complète avec toutes les informations du site
"use client";
import { API_ROUTES } from '@/config/routes';
import axiosInstance from '@/config/axiosInstance';
import React, { useEffect, useState, useRef } from 'react';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';
import { 
  FiCpu, FiDatabase, FiCompass, FiBell, FiCheckCircle, FiGift,
  FiTarget, FiTrendingUp, FiAward, FiUsers, FiMapPin, FiCalendar,
  FiBook, FiMessageCircle, FiFileText, FiZap, FiShield, FiGlobe
} from 'react-icons/fi';

const tokens = (theme) => ({
  accent:     theme === "dark" ? "#4c9fd9" : "#0066b3",
  ink:        theme === "dark" ? "#f2efe7" : "#141414",
  ink2:       theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3:       theme === "dark" ? "#a19f96" : "#6b6b6b",
  ink4:       theme === "dark" ? "#6d6b64" : "#9a9794",
  paper:      theme === "dark" ? "#15140f" : "#faf8f3",
  paper2:     theme === "dark" ? "#1d1c16" : "#f2efe7",
  rule:       theme === "dark" ? "#2b2a22" : "#d9d5cb",
  ruleSoft:   theme === "dark" ? "#24231c" : "#e8e4d9",
  surface:    theme === "dark" ? "#1a1912" : "#ffffff",
  fSerif: `"Libre Caslon Text", "Times New Roman", Georgia, serif`,
  fSans:  `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"JetBrains Mono", ui-monospace, Menlo, monospace`,
});

export default function AboutPage({  setView, user }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);
const [showLoginModal, setShowLoginModal] = useState(false); 

const [stats, setStats] = useState({
    students: '0',
    scholarships: '0',
    countries: '0',
    satisfaction: '0%',
  });
  const [loadingStats, setLoadingStats] = useState(true);
  // Traductions
  const t = {
    // Hero
    heroTitle: lang === 'fr' 
      ? 'Votre partenaire pour réussir à l\'international' 
      : 'Your partner for international success',
    heroSub: lang === 'fr'
      ? 'OppsTrack centralise les meilleures opportunités de bourses 100% financées et vous guide grâce à l\'intelligence artificielle.'
      : 'OppsTrack centralizes the best fully-funded scholarship opportunities and guides you with artificial intelligence.',
    
    // Mission / Vision / Valeurs
    missionTitle: lang === 'fr' ? 'Notre mission' : 'Our mission',
    missionDesc: lang === 'fr'
      ? 'Démocratiser l\'accès aux bourses d\'excellence pour tous les étudiants, quel que soit leur parcours ou situation financière.'
      : 'Democratize access to excellence scholarships for all students, regardless of background or financial situation.',
    valuesTitle: lang === 'fr' ? 'Nos valeurs' : 'Our values',
    valuesDesc: lang === 'fr'
      ? 'Excellence, transparence, innovation et engagement envers la réussite de chaque étudiant.'
      : 'Excellence, transparency, innovation and commitment to every student\'s success.',
    visionTitle: lang === 'fr' ? 'Notre vision' : 'Our vision',
    visionDesc: lang === 'fr'
      ? 'Devenir la plateforme mondiale de référence pour l\'accès aux bourses et l\'orientation des étudiants.'
      : 'Become the global reference platform for scholarship access and student guidance.',
    
    // Stats
    students: lang === 'fr' ? 'Étudiants aidés' : 'Students helped',
    scholarships: lang === 'fr' ? 'Bourses référencées' : 'Scholarships listed',
    countries: lang === 'fr' ? 'Pays couverts' : 'Countries covered',
    satisfaction: lang === 'fr' ? 'Taux de satisfaction' : 'Satisfaction rate',
    
    // Équipe
    teamTitle: lang === 'fr' ? 'Notre équipe' : 'Our team',
    sendaName: 'Senda Kadoussi',
    imenName: 'Imen Abidi',
    role: lang === 'fr' ? 'Étudiante en Business Intelligence' : 'Business Intelligence Student',
    sendaBio: lang === 'fr'
      ? 'Passionnée par l\'analyse de données et l\'IA, en charge du matching intelligent des bourses.'
      : 'Passionate about data analysis and AI, in charge of intelligent scholarship matching.',
    imenBio: lang === 'fr'
      ? 'Spécialiste en visualisation de données et développement front-end, elle conçoit l\'expérience utilisateur d\'OppsTrack.'
      : 'Specialist in data visualization and front-end development, she designs OppsTrack\'s user experience.',
    
    // Pourquoi nous choisir
    whyTitle: lang === 'fr' ? 'Ce qui nous différencie' : 'What makes us different',
    why1Title: lang === 'fr' ? 'Intelligence artificielle' : 'Artificial intelligence',
    why1Desc: lang === 'fr' ? 'Système personnalisé qui vous recommande les meilleures bourses.' : 'Personalized system recommending the best scholarships.',
    why2Title: lang === 'fr' ? 'Base de données exhaustive' : 'Comprehensive database',
    why2Desc: lang === 'fr' ? 'Mise à jour quotidiennement avec les opportunités du moment.' : 'Updated daily with the latest opportunities.',
    why3Title: lang === 'fr' ? 'Suivi en temps réel' : 'Real-time tracking',
    why3Desc: lang === 'fr' ? 'Alertes instantanées pour ne jamais manquer une deadline.' : 'Instant alerts so you never miss a deadline.',
    why4Title: lang === 'fr' ? 'Vérification manuelle' : 'Manual verification',
    why4Desc: lang === 'fr' ? 'Chaque bourse vérifiée par notre équipe d\'experts.' : 'Each scholarship verified by our expert team.',
    why5Title: lang === 'fr' ? 'Accompagnement personnel' : 'Personal support',
    why5Desc: lang === 'fr' ? 'Support complet de la candidature à l\'acceptation.' : 'Full support from application to acceptance.',
    why6Title: lang === 'fr' ? 'Gratuit' : 'Free',
    why6Desc: lang === 'fr' ? 'Accès illimité à l\'ensemble de nos services et ressources.' : 'Unlimited access to all our services and resources.',
    
    // Fonctionnalités détaillées
    featuresTitle: lang === 'fr' ? 'Fonctionnalités complètes' : 'Complete features',
    
    // Recherche & Découverte
    feature1Title: lang === 'fr' ? 'Recherche intelligente' : 'Smart search',
    feature1Desc: lang === 'fr' 
      ? 'Filtres avancés par pays, niveau d\'études, domaine, montant et deadline. Recherche par mots-clés et tri personnalisé.'
      : 'Advanced filters by country, study level, field, amount and deadline. Keyword search and custom sorting.',
    
    feature2Title: lang === 'fr' ? 'Recommandations IA' : 'AI Recommendations',
    feature2Desc: lang === 'fr'
      ? 'Système de matching intelligent analysant votre profil pour suggérer les bourses les plus pertinentes avec score de compatibilité.'
      : 'Intelligent matching system analyzing your profile to suggest the most relevant scholarships with compatibility score.',
    
    feature3Title: lang === 'fr' ? 'Score de match' : 'Match score',
    feature3Desc: lang === 'fr'
      ? 'Algorithme propriétaire calculant votre compatibilité avec chaque bourse (85%+ = excellent, 75%+ = bon, <75% = moyen).'
      : 'Proprietary algorithm calculating your compatibility with each scholarship (85%+ = excellent, 75%+ = good, <75% = average).',
    
    // Assistant IA
    feature4Title: lang === 'fr' ? 'Assistant IA conversationnel' : 'Conversational AI Assistant',
    feature4Desc: lang === 'fr'
      ? 'Chat intelligent 24/7 : répond à vos questions, conseille sur les candidatures, génère des lettres de motivation et CV adaptés.'
      : '24/7 intelligent chat: answers questions, advises on applications, generates tailored motivation letters and CVs.',
    
    feature5Title: lang === 'fr' ? 'Génération de documents' : 'Document generation',
    feature5Desc: lang === 'fr'
      ? 'Création automatique de lettres de motivation, CV, essais et réponses aux questions personnalisées pour chaque bourse.'
      : 'Automatic creation of motivation letters, CVs, essays and personalized answers for each scholarship.',
    
    // Roadmap & Suivi
    feature6Title: lang === 'fr' ? 'Roadmap personnalisée' : 'Personalized roadmap',
    feature6Desc: lang === 'fr'
      ? 'Plan d\'action complet généré par IA : toutes les étapes, documents requis, deadlines intermédiaires et conseils stratégiques.'
      : 'Complete action plan generated by AI: all steps, required documents, intermediate deadlines and strategic advice.',
    
    feature7Title: lang === 'fr' ? 'Suivi de progression' : 'Progress tracking',
    feature7Desc: lang === 'fr'
      ? 'Tableau Kanban avec statuts (Recherche, Préparation, Soumise, Acceptée), pourcentage d\'avancement et priorités automatiques.'
      : 'Kanban board with statuses (Research, Preparation, Submitted, Accepted), completion percentage and automatic priorities.',
    
    feature8Title: lang === 'fr' ? 'Gestion des documents' : 'Document management',
    feature8Desc: lang === 'fr'
      ? 'Upload et organisation centralisée de tous vos documents : CV, lettres, relevés, certificats avec tracking par étape.'
      : 'Upload and centralized organization of all your documents: CVs, letters, transcripts, certificates with step tracking.',
    
    // Préparation entretien
    feature9Title: lang === 'fr' ? 'Simulation d\'entretien IA' : 'AI Interview simulation',
    feature9Desc: lang === 'fr'
      ? 'Jury virtuel posant 8 questions adaptées à la bourse, analyse vocale en temps réel (volume, pauses, vitesse) et rapport détaillé.'
      : 'Virtual panel asking 8 questions tailored to the scholarship, real-time voice analysis (volume, pauses, speed) and detailed report.',
    
    feature10Title: lang === 'fr' ? 'Analyse vocale avancée' : 'Advanced voice analysis',
    feature10Desc: lang === 'fr'
      ? 'Mesure du volume, stabilité, ratio de parole, pauses, hésitations et richesse vocabulaire avec score global sur 100.'
      : 'Measurement of volume, stability, speech ratio, pauses, hesitations and vocabulary richness with global score out of 100.',
    
    feature11Title: lang === 'fr' ? 'Historique des entretiens' : 'Interview history',
    feature11Desc: lang === 'fr'
      ? 'Accès à tous vos entretiens passés avec scores, rapports détaillés, points forts, axes d\'amélioration et conseils personnalisés.'
      : 'Access to all your past interviews with scores, detailed reports, strengths, areas for improvement and personalized advice.',
    
    // Gamification
    feature12Title: lang === 'fr' ? 'Système de progression' : 'Progression system',
    feature12Desc: lang === 'fr'
      ? '5 niveaux (Débutant → Expert), badges débloquables, streak de jours consécutifs et statistiques détaillées de performance.'
      : '5 levels (Beginner → Expert), unlockable badges, consecutive days streak and detailed performance statistics.',
    
    // Comment ça marche
    howTitle: lang === 'fr' ? 'Comment ça marche ?' : 'How does it work?',
    step1Title: lang === 'fr' ? '1. Créez votre profil' : '1. Create your profile',
    step1Desc: lang === 'fr'
      ? 'Renseignez vos informations académiques, expériences, langues, certifications et objectifs pour un matching optimal.'
      : 'Fill in your academic information, experiences, languages, certifications and goals for optimal matching.',
    
    step2Title: lang === 'fr' ? '2. Découvrez vos bourses' : '2. Discover your scholarships',
    step2Desc: lang === 'fr'
      ? 'L\'IA analyse votre profil et vous recommande les bourses les plus adaptées avec score de compatibilité détaillé.'
      : 'AI analyzes your profile and recommends the most suitable scholarships with detailed compatibility score.',
    
    step3Title: lang === 'fr' ? '3. Préparez vos dossiers' : '3. Prepare your applications',
    step3Desc: lang === 'fr'
      ? 'Suivez la roadmap générée par l\'IA, uploadez vos documents, générez lettres et CV, et préparez-vous aux entretiens.'
      : 'Follow the AI-generated roadmap, upload your documents, generate letters and CVs, and prepare for interviews.',
    
    step4Title: lang === 'fr' ? '4. Postulez et suivez' : '4. Apply and track',
    step4Desc: lang === 'fr'
      ? 'Soumettez vos candidatures, suivez leur statut en temps réel, recevez des alertes et ajustez votre stratégie selon les résultats.'
      : 'Submit your applications, track their status in real time, receive alerts and adjust your strategy based on results.',
    
    
    // Sécurité & Confidentialité
    securityTitle: lang === 'fr' ? 'Sécurité & Confidentialité' : 'Security & Privacy',
    security1: lang === 'fr' ? 'Données chiffrées de bout en bout (SSL/TLS)' : 'End-to-end encrypted data (SSL/TLS)',
    security2: lang === 'fr' ? 'Conformité RGPD - vos données vous appartiennent' : 'GDPR compliant - your data belongs to you',
    security3: lang === 'fr' ? 'Authentification sécurisée par magic link' : 'Secure authentication via magic link',
    security4: lang === 'fr' ? 'Aucune vente de données à des tiers' : 'No data sold to third parties',
    
    // CTA
    ctaTitle: lang === 'fr' ? 'Prêt à débuter votre aventure ?' : 'Ready to start your journey?',
    ctaSub: lang === 'fr' 
      ? 'Rejoignez les milliers d\'étudiants qui ont trouvé leur bourse grâce à OppsTrack.' 
      : 'Join thousands of students who found their scholarship with OppsTrack.',
    ctaButton: lang === 'fr' ? 'Commencer gratuitement' : 'Start for free',
    ctaContact: lang === 'fr' ? 'Nous contacter' : 'Contact us',
  };

  // Animation
  const [visible, setVisible] = useState({});
  const cardRefs = useRef([]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(prev => ({ ...prev, [entry.target.dataset.id]: true }));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    cardRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, []);

// ✅ CHARGEMENT DES STATS RÉELLES
useEffect(() => {
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      // 1. Nombre de bourses
      const boursesRes = await axiosInstance.get(API_ROUTES.bourses.list, {
        params: { limit: 1 },
      });
      const totalBourses = boursesRes.data.totalDocs || 0;

      // 2. Nombre de pays uniques
      const boursesFullRes = await axiosInstance.get(API_ROUTES.bourses.list, {
        params: { limit: 1000 },
      });
      const uniqueCountries = new Set(
        (boursesFullRes.data.docs || [])
          .map(b => b.pays)
          .filter(Boolean)
      );
      const totalCountries = uniqueCountries.size;

      // 3. Nombre d'étudiants (roadmap = candidatures uniques)
      const roadmapRes = await axiosInstance.get('/api/roadmap', {
        params: { limit: 1 },
      });
      const totalStudents = roadmapRes.data.totalDocs || 0;

      // ✅ 4. Taux de satisfaction (basé sur les FEEDBACKS avec rating >= 4)
      const feedbacksRes = await axiosInstance.get('/api/feedbacks', {
        params: { 
          limit: 1000,
          'where[approved][equals]': true,  // Seulement les feedbacks approuvés
        },
      });
      const feedbacks = feedbacksRes.data.docs || [];
      const totalFeedbacks = feedbacks.length;
      
      // Calculer le pourcentage de feedbacks positifs (rating >= 4)
      const positiveFeedbacks = feedbacks.filter(f => f.rating >= 4).length;
      const satisfactionRate = totalFeedbacks > 0 
        ? Math.round((positiveFeedbacks / totalFeedbacks) * 100)
        : 0;

      // Mise à jour des stats
      setStats({
        students: formatNumber(totalStudents),
        scholarships: formatNumber(totalBourses),
        countries: totalCountries.toString(),
        satisfaction: `${satisfactionRate}%`,
      });
    } catch (err) {
      console.error('Erreur chargement stats:', err);
      // Valeurs par défaut en cas d'erreur
      setStats({
        students: '50K+',
        scholarships: '1,200+',
        countries: '85+',
        satisfaction: '94%',
      });
    } finally {
      setLoadingStats(false);
    }
  };

  fetchStats();
}, []);

  // Fonction pour formater les nombres
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K+`;
    return num.toString();
  };

  // Images
  const sendaImage = '/senda.jpg';
  const imenImage = '/imen.jpg';
  const [imgErrorSenda, setImgErrorSenda] = useState(false);
  const [imgErrorImen, setImgErrorImen] = useState(false);

  // LoginModal component
  function LoginModal({ onClose }) {
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
        await axiosInstance.post('/api/users/request-magic-link', {
          email: email.trim().toLowerCase()
        });
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrMsg(err.response?.data?.message || (lang === 'fr' ? 'Erreur serveur' : 'Server error'));
      }
    };

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
          }}
        />

        {/* Modal */}
        <div style={{
          position: 'relative',
          zIndex: 3001,
          width: 420,
          maxWidth: '92vw',
          background: c.surface,
          borderTop: `3px solid ${c.accent}`,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '16px 20px',
            background: c.paper2,
            borderBottom: `1px solid ${c.rule}`,
          }}>
            <span style={{ fontSize: 20 }}>🔐</span>
            <span style={{
              fontFamily: c.fSerif,
              fontWeight: 700,
              fontSize: 16,
              color: c.ink,
            }}>
              {lang === 'fr' ? 'Connexion à OppsTrack' : 'Sign in to OppsTrack'}
            </span>
            <button
              onClick={onClose}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: c.ink3,
                fontSize: 20,
              }}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: 24 }}>
            {status === 'idle' && (
              <>
                <p style={{
                  color: c.ink2,
                  fontSize: 13,
                  marginBottom: 20,
                  lineHeight: 1.5,
                }}>
                  {lang === 'fr'
                    ? 'Entrez votre email pour recevoir un lien de connexion magique.'
                    : 'Enter your email to receive a magic login link.'}
                </p>
                <input
                  type="email"
                  placeholder={lang === 'fr' ? 'votre@email.com' : 'your@email.com'}
                  value={email}
                  autoFocus
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${c.ruleSoft}`,
                    background: c.paper,
                    color: c.ink,
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: c.fSans,
                  }}
                />
                {errMsg && (
                  <div style={{
                    color: c.danger,
                    fontSize: 11,
                    marginTop: 6,
                  }}>
                    {errMsg}
                  </div>
                )}
                <button
                  onClick={send}
                  style={{
                    width: '100%',
                    marginTop: 16,
                    padding: 10,
                    background: c.accent,
                    color: '#fff',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: c.fMono,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <span>✉️</span>
                  {lang === 'fr' ? 'Envoyer le lien magique' : 'Send magic link'}
                </button>
              </>
            )}

            {status === 'sending' && (
              <div style={{
                textAlign: 'center',
                padding: '24px 0',
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  border: `3px solid ${c.ruleSoft}`,
                  borderTopColor: c.accent,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto',
                }} />
                <p style={{
                  color: c.ink2,
                  marginTop: 14,
                }}>
                  {lang === 'fr' ? 'Envoi…' : 'Sending…'}
                </p>
              </div>
            )}

            {status === 'success' && (
              <div style={{
                textAlign: 'center',
                padding: '16px 0',
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✉️</div>
                <div style={{
                  fontFamily: c.fSerif,
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#166534',
                  marginBottom: 8,
                }}>
                  {lang === 'fr' ? 'Lien envoyé !' : 'Link sent!'}
                </div>
                <p style={{
                  color: c.ink2,
                  fontSize: 12,
                }}>
                  {lang === 'fr'
                    ? 'Vérifiez votre boîte mail (et les spams).'
                    : 'Check your inbox (and spam).'}
                </p>
                <button
                  onClick={onClose}
                  style={{
                    width: '100%',
                    marginTop: 16,
                    padding: 10,
                    background: '#166534',
                    color: '#fff',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <span>✓</span>
                  {lang === 'fr' ? 'Fermer' : 'Close'}
                </button>
              </div>
            )}

            {status === 'error' && (
              <div style={{
                textAlign: 'center',
                padding: '16px 0',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                <p style={{
                  color: c.danger,
                  marginBottom: 12,
                }}>
                  {errMsg}
                </p>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setErrMsg('');
                  }}
                  style={{
                    width: '100%',
                    marginTop: 16,
                    padding: 10,
                    background: c.accent,
                    color: '#fff',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'fr' ? 'Réessayer' : 'Retry'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  
  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${c.accent}08 0%, ${c.paper2} 100%)`,
        padding: '80px 24px',
        textAlign: 'center',
        borderBottom: `1px solid ${c.rule}`,
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{
            fontFamily: c.fSerif,
            fontSize: 'clamp(36px, 6vw, 56px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: c.ink,
            marginBottom: 20,
          }}>
            {lang === 'fr' ? (
              <>Votre partenaire pour<br /><span style={{ color: c.accent }}>réussir à l'international</span></>
            ) : (
              <>Your partner for<br /><span style={{ color: c.accent }}>international success</span></>
            )}
          </h1>
          <p style={{ fontSize: 18, color: c.ink2, lineHeight: 1.6, maxWidth: 700, margin: '0 auto' }}>{t.heroSub}</p>
        </div>
      </div>

      {/* Mission / Valeurs / Vision */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 32,
          marginBottom: 80,
        }}>
          {[
            {
  icon: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="12" y1="1" x2="12" y2="3" />
    </svg>
  ),
  title: t.missionTitle,
  desc: t.missionDesc,
  bg: `${c.accent}10`
},
{
  icon: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  title: t.valuesTitle,
  desc: t.valuesDesc,
  bg: '#fef3c7'
},
{
  icon: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3" />
      <path d="M5 3h14" />
      <path d="M9 7h6" />
      <path d="M9 11h6" />
      <path d="M10 15h4" />
    </svg>
  ),
  title: t.visionTitle,
  desc: t.visionDesc,
  bg: '#d1fae5'
}
          ].map((item, i) => (
            <div
              key={i}
              ref={el => cardRefs.current[i] = el}
              data-id={`card-${i}`}
              style={{
                background: c.surface,
                border: `1px solid ${c.ruleSoft}`,
                padding: '40px 24px',
                textAlign: 'center',
                transition: 'transform 0.3s, box-shadow 0.3s, opacity 0.6s',
                opacity: visible[`card-${i}`] ? 1 : 0,
                transform: visible[`card-${i}`] ? 'translateY(0)' : 'translateY(20px)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ 
                width: 64, height: 64, borderRadius: '50%', background: item.bg, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                margin: '0 auto 20px', fontSize: 28 
              }}>{item.icon}</div>
              <h3 style={{ fontFamily: c.fSerif, fontSize: 20, fontWeight: 700, marginBottom: 12, color: c.ink }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: c.ink2, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>

       {/* Statistiques RÉELLES */}
<div style={{
  background: `linear-gradient(135deg, ${c.accent} 0%, #004a8a 100%)`,
  borderRadius: 16,
  padding: '48px 32px',
  marginBottom: 80,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 32,
  textAlign: 'center',
}}>
  {[
    { number: stats.students, label: t.students },
    { number: stats.scholarships, label: t.scholarships },
    { number: stats.countries, label: t.countries },
    { number: stats.satisfaction, label: t.satisfaction },
  ].map((stat, i) => (
    <div key={i} style={{ position: 'relative' }}>
      {loadingStats ? (
        // Skeleton loader
        <>
          <div style={{
            width: 120,
            height: 48,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 8,
            margin: '0 auto 8px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <div style={{
            width: 100,
            height: 20,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 6,
            margin: '0 auto',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        </>
      ) : (
        <>
          <div style={{
            fontSize: 32,
            marginBottom: 4,
            opacity: 0.7,
          }}>
            {stat.icon}
          </div>
          <div style={{
            fontSize: 42,
            fontWeight: 800,
            marginBottom: 8,
            color: '#fff',
          }}>
            {stat.number}
          </div>
          <div style={{
            fontSize: 14,
            color: '#cfe9f3',
          }}>
            {stat.label}
          </div>
        </>
      )}
    </div>
  ))}
</div>


{/* Équipe */}
        <div style={{ marginBottom: 80 }}>
          <h2 style={{
            fontFamily: c.fSerif,
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            justifyContent: 'center'
          }}>
            {t.teamTitle}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(260px, 320px))',
            justifyContent: 'center',
            gap: 48,
          }}>
            {/* Senda */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 120, height: 120, margin: '0 auto 20px',
                borderRadius: '50%', overflow: 'hidden',
                background: `linear-gradient(135deg, ${c.accent}20, ${c.paper2})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {!imgErrorSenda ? (
                  <img
                    src={sendaImage}
                    alt="Senda Kadoussi"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setImgErrorSenda(true)}
                  />
                ) : (
                  <span style={{ fontSize: 48 }}>👩‍💻</span>
                )}
              </div>
              <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: c.ink }}>{t.sendaName}</h4>
              <p style={{ fontSize: 14, color: c.accent, marginBottom: 8 }}>{t.role}</p>
              <p style={{ fontSize: 13, color: c.ink3 }}>{t.sendaBio}</p>
            </div>

            {/* Imen */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 120, height: 120, margin: '0 auto 20px',
                borderRadius: '50%', overflow: 'hidden',
                background: `linear-gradient(135deg, ${c.accent}20, ${c.paper2})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {!imgErrorImen ? (
                  <img
                    src={imenImage}
                    alt="Imen Abidi"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setImgErrorImen(true)}
                  />
                ) : (
                  <span style={{ fontSize: 48 }}>👩‍🎨</span>
                )}
              </div>
              <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: c.ink }}>{t.imenName}</h4>
              <p style={{ fontSize: 14, color: c.accent, marginBottom: 8 }}>{t.role}</p>
              <p style={{ fontSize: 13, color: c.ink3 }}>{t.imenBio}</p>
            </div>
          </div>
        </div>

        {/* Comment ça marche */}
        <div style={{ marginBottom: 80 }}>
          <h2 style={{
            fontFamily: c.fSerif,
            fontSize: 32,
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 48,
            color: c.ink,
          }}>
            {t.howTitle}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 32,
          }}>
            {[
              { num: '1', icon: <FiUsers size={32} />, title: t.step1Title, desc: t.step1Desc },
              { num: '2', icon: <FiTarget size={32} />, title: t.step2Title, desc: t.step2Desc },
              { num: '3', icon: <FiFileText size={32} />, title: t.step3Title, desc: t.step3Desc },
              { num: '4', icon: <FiTrendingUp size={32} />, title: t.step4Title, desc: t.step4Desc },
            ].map((step, i) => (
              <div key={i} style={{
                background: c.surface,
                border: `1px solid ${c.ruleSoft}`,
                padding: '32px 24px',
                textAlign: 'center',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: -20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: c.accent,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                }}>{step.num}</div>
                <div style={{ color: c.accent, marginBottom: 16, marginTop: 12 }}>{step.icon}</div>
                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: c.ink }}>{step.title}</h4>
                <p style={{ fontSize: 13, color: c.ink2, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Fonctionnalités complètes */}
        <div style={{ marginBottom: 80 }}>
          <h2 style={{
            fontFamily: c.fSerif,
            fontSize: 32,
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 16,
            color: c.ink,
          }}>
            {t.featuresTitle}
          </h2>
          <p style={{
            fontSize: 16,
            color: c.ink2,
            textAlign: 'center',
            marginBottom: 48,
            maxWidth: 600,
            margin: '0 auto 48px',
          }}>
            {lang === 'fr' 
              ? 'Découvrez toutes les fonctionnalités qui font d\'OppsTrack la plateforme la plus complète pour vos candidatures.' 
              : 'Discover all the features that make OppsTrack the most complete platform for your applications.'}
          </p>

          {/* Recherche & Découverte */}
          <div style={{ marginBottom: 48 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 700,
              color: c.accent,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <FiCompass size={24} />
              {lang === 'fr' ? 'Recherche & Découverte' : 'Search & Discovery'}
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 24,
            }}>
              {[
                { icon: <FiDatabase size={24} />, title: t.feature1Title, desc: t.feature1Desc },
                { icon: <FiCpu size={24} />, title: t.feature2Title, desc: t.feature2Desc },
                { icon: <FiTarget size={24} />, title: t.feature3Title, desc: t.feature3Desc },
              ].map((feat, i) => (
                <div key={i} style={{
                  background: c.surface,
                  border: `1px solid ${c.ruleSoft}`,
                  padding: '24px',
                  borderRadius: 12,
                }}>
                  <div style={{ color: c.accent, marginBottom: 12 }}>{feat.icon}</div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: c.ink }}>{feat.title}</h4>
                  <p style={{ fontSize: 13, color: c.ink2, lineHeight: 1.6 }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Assistant IA */}
          <div style={{ marginBottom: 48 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 700,
              color: c.accent,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <FiMessageCircle size={24} />
              {lang === 'fr' ? 'Assistant IA' : 'AI Assistant'}
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 24,
            }}>
              {[
                { icon: <FiZap size={24} />, title: t.feature4Title, desc: t.feature4Desc },
                { icon: <FiFileText size={24} />, title: t.feature5Title, desc: t.feature5Desc },
              ].map((feat, i) => (
                <div key={i} style={{
                  background: c.surface,
                  border: `1px solid ${c.ruleSoft}`,
                  padding: '24px',
                  borderRadius: 12,
                }}>
                  <div style={{ color: c.accent, marginBottom: 12 }}>{feat.icon}</div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: c.ink }}>{feat.title}</h4>
                  <p style={{ fontSize: 13, color: c.ink2, lineHeight: 1.6 }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Roadmap & Suivi */}
          <div style={{ marginBottom: 48 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 700,
              color: c.accent,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <FiMapPin size={24} />
              {lang === 'fr' ? 'Roadmap & Suivi' : 'Roadmap & Tracking'}
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 24,
            }}>
              {[
                { icon: <FiCalendar size={24} />, title: t.feature6Title, desc: t.feature6Desc },
                { icon: <FiTrendingUp size={24} />, title: t.feature7Title, desc: t.feature7Desc },
                { icon: <FiBook size={24} />, title: t.feature8Title, desc: t.feature8Desc },
              ].map((feat, i) => (
                <div key={i} style={{
                  background: c.surface,
                  border: `1px solid ${c.ruleSoft}`,
                  padding: '24px',
                  borderRadius: 12,
                }}>
                  <div style={{ color: c.accent, marginBottom: 12 }}>{feat.icon}</div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: c.ink }}>{feat.title}</h4>
                  <p style={{ fontSize: 13, color: c.ink2, lineHeight: 1.6 }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Préparation entretien */}
          <div style={{ marginBottom: 48 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 700,
              color: c.accent,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <FiAward size={24} />
              {lang === 'fr' ? 'Préparation Entretien' : 'Interview Preparation'}
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 24,
            }}>
              {[
                { icon: <FiUsers size={24} />, title: t.feature9Title, desc: t.feature9Desc },
                { icon: <FiBell size={24} />, title: t.feature10Title, desc: t.feature10Desc },
                { icon: <FiBook size={24} />, title: t.feature11Title, desc: t.feature11Desc },
              ].map((feat, i) => (
                <div key={i} style={{
                  background: c.surface,
                  border: `1px solid ${c.ruleSoft}`,
                  padding: '24px',
                  borderRadius: 12,
                }}>
                  <div style={{ color: c.accent, marginBottom: 12 }}>{feat.icon}</div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: c.ink }}>{feat.title}</h4>
                  <p style={{ fontSize: 13, color: c.ink2, lineHeight: 1.6 }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gamification */}
          <div>
            <h3 style={{
              fontSize: 20,
              fontWeight: 700,
              color: c.accent,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <FiAward size={24} />
              {lang === 'fr' ? 'Gamification & Motivation' : 'Gamification & Motivation'}
            </h3>
            <div style={{
              background: c.surface,
              border: `1px solid ${c.ruleSoft}`,
              padding: '24px',
              borderRadius: 12,
            }}>
              <div style={{ color: c.accent, marginBottom: 12 }}>
                <FiAward size={24} />
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: c.ink }}>{t.feature12Title}</h4>
              <p style={{ fontSize: 13, color: c.ink2, lineHeight: 1.6 }}>{t.feature12Desc}</p>
            </div>
          </div>
        </div>

        {/* Pourquoi nous choisir */}
        <div style={{ background: c.paper2, borderRadius: 20, padding: '48px 32px', marginBottom: 80 }}>
          <h2 style={{ fontFamily: c.fSerif, fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 40 }}>{t.whyTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {[
              { icon: <FiCpu size={36} strokeWidth={1.5} />, title: t.why1Title, desc: t.why1Desc },
              { icon: <FiDatabase size={36} strokeWidth={1.5} />, title: t.why2Title, desc: t.why2Desc },
              { icon: <FiCompass size={36} strokeWidth={1.5} />, title: t.why5Title, desc: t.why5Desc },
              { icon: <FiBell size={36} strokeWidth={1.5} />, title: t.why3Title, desc: t.why3Desc },
              { icon: <FiCheckCircle size={36} strokeWidth={1.5} />, title: t.why4Title, desc: t.why4Desc },
              { icon: <FiGift size={36} strokeWidth={1.5} />, title: t.why6Title, desc: t.why6Desc },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12, color: c.accent }}>{item.icon}</div>
                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: c.ink }}>{item.title}</h4>
                <p style={{ fontSize: 13, color: c.ink2 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      

        {/* Sécurité */}
        <div style={{ marginBottom: 80 }}>
          <h2 style={{
            fontFamily: c.fSerif,
            fontSize: 28,
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}>
            <FiShield size={28} color={c.accent} />
            {t.securityTitle}
          </h2>
          <p style={{
            fontSize: 14,
            color: c.ink2,
            textAlign: 'center',
            marginBottom: 32,
            maxWidth: 600,
            margin: '0 auto 32px',
          }}>
            {lang === 'fr' 
              ? 'Vos données sont protégées avec les plus hauts standards de sécurité.' 
              : 'Your data is protected with the highest security standards.'}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 20,
          }}>
            {[t.security1, t.security2, t.security3, t.security4].map((sec, i) => (
              <div key={i} style={{
                background: c.surface,
                border: `1px solid ${c.ruleSoft}`,
                borderRadius: 12,
                padding: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}>
                <div style={{ color: '#16a34a', fontSize: 20, flexShrink: 0 }}>✓</div>
                <span style={{ fontSize: 13, color: c.ink2, lineHeight: 1.6 }}>{sec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA - Uniquement pour les visiteurs */}
        {!user && (
          <div style={{ 
            background: c.accent, 
            borderRadius: 20, 
            padding: '60px 32px', 
            textAlign: 'center', 
            color: '#fff' 
          }}>
            <h2 style={{ fontFamily: c.fSerif, fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
              {t.ctaTitle}
            </h2>
            <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 32 }}>
              {t.ctaSub}
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setShowLoginModal(true)}  // ← MODIFIÉ
                style={{ 
                  padding: '12px 32px', 
                  background: '#fff', 
                  color: c.accent, 
                  border: 'none', 
                  borderRadius: 40, 
                  fontSize: 14, 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  transition: 'transform 0.2s' 
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} 
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {t.ctaButton}
              </button>
              <button 
                onClick={() => setView('contact')} 
                style={{ 
                  padding: '12px 32px', 
                  background: 'transparent', 
                  border: `2px solid #fff`, 
                  color: '#fff', 
                  borderRadius: 40, 
                  fontSize: 14, 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  transition: 'transform 0.2s' 
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} 
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {t.ctaContact}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de connexion */}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      {/* Style pour l'animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}