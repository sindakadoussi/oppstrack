// AboutPage.jsx — version avec équipe personnalisée (Senda & Imen)
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';
import { FiCpu, FiDatabase, FiCompass, FiBell, FiCheckCircle, FiGift } from 'react-icons/fi';


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

export default function AboutPage({ setView }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);

  // Traductions (inchangées sauf l'équipe)
  const t = {
    heroTitle: lang === 'fr' ? 'Votre partenaire pour réussir à l’international' : 'Your partner for international success',
    heroSub: lang === 'fr'
      ? 'OppsTrack centralise les meilleures opportunités de bourses 100% financées et vous guide grâce à l’intelligence artificielle.'
      : 'OppsTrack centralizes the best fully-funded scholarship opportunities and guides you with artificial intelligence.',
    missionTitle: lang === 'fr' ? 'Notre mission' : 'Our mission',
    missionDesc: lang === 'fr'
      ? 'Démocratiser l’accès aux bourses d’excellence pour tous les étudiants, quel que soit leur parcours ou situation financière.'
      : 'Democratize access to excellence scholarships for all students, regardless of background or financial situation.',
    valuesTitle: lang === 'fr' ? 'Nos valeurs' : 'Our values',
    valuesDesc: lang === 'fr'
      ? 'Excellence, transparence, innovation et engagement envers la réussite de chaque étudiant.'
      : 'Excellence, transparency, innovation and commitment to every student’s success.',
    visionTitle: lang === 'fr' ? 'Notre vision' : 'Our vision',
    visionDesc: lang === 'fr'
      ? 'Devenir la plateforme mondiale de référence pour l’accès aux bourses et l’orientation des étudiants.'
      : 'Become the global reference platform for scholarship access and student guidance.',
    students: lang === 'fr' ? 'Étudiants aidés' : 'Students helped',
    scholarships: lang === 'fr' ? 'Bourses référencées' : 'Scholarships listed',
    countries: lang === 'fr' ? 'Pays couverts' : 'Countries covered',
    satisfaction: lang === 'fr' ? 'Taux de satisfaction' : 'Satisfaction rate',
     teamTitle: lang === 'fr' ? 'Notre équipe' : 'Our team',
    whyTitle: lang === 'fr' ? 'Ce qui nous différencie' : 'What makes us different',
    why1Title: lang === 'fr' ? 'Intelligence artificielle' : 'Artificial intelligence',
    why1Desc: lang === 'fr' ? 'Système personnalisé qui vous recommande les meilleures bourses.' : 'Personalized system recommending the best scholarships.',
    why2Title: lang === 'fr' ? 'Base de données exhaustive' : 'Comprehensive database',
    why2Desc: lang === 'fr' ? 'Mise à jour quotidiennement avec les opportunités du moment.' : 'Updated daily with the latest opportunities.',
    why3Title: lang === 'fr' ? 'Suivi en temps réel' : 'Real-time tracking',
    why3Desc: lang === 'fr' ? 'Alertes instantanées pour ne jamais manquer une deadline.' : 'Instant alerts so you never miss a deadline.',
    why4Title: lang === 'fr' ? 'Vérification manuelle' : 'Manual verification',
    why4Desc: lang === 'fr' ? 'Chaque bourse vérifiée par notre équipe d’experts.' : 'Each scholarship verified by our expert team.',
    why5Title: lang === 'fr' ? 'Accompagnement personnel' : 'Personal support',
    why5Desc: lang === 'fr' ? 'Support complet de la candidature à l’acceptation.' : 'Full support from application to acceptance.',
    why6Title: lang === 'fr' ? 'Gratuit' : 'Free',
    why6Desc: lang === 'fr' ? 'Accès illimité à l’ensemble de nos services et ressources.' : 'Unlimited access to all our services and resources.',
    ctaTitle: lang === 'fr' ? 'Prêt à débuter votre aventure ?' : 'Ready to start your journey?',
    ctaSub: lang === 'fr' ? 'Rejoignez les milliers d’étudiants qui ont trouvé leur bourse grâce à OppsTrack.' : 'Join thousands of students who found their scholarship with OppsTrack.',
    ctaButton: lang === 'fr' ? 'Commencer gratuitement' : 'Start for free',
    ctaContact: lang === 'fr' ? 'Nous contacter' : 'Contact us',
    // Membres de l'équipe
    sendaName: 'Senda Kadoussi',
    imenName: 'Imen Abidi',
    role: lang === 'fr' ? 'Étudiante en Business Intelligence' : 'Business Intelligence Student',
    sendaBio: lang === 'fr'
      ? 'Passionnée par l’analyse de données et l’IA, en charge du matching intelligent des bourses.'
      : 'Passionate about data analysis and AI, in charge of intelligent scholarship matching.',
    imenBio: lang === 'fr'
      ? 'Spécialiste en visualisation de données et développement front-end, elle conçoit l’expérience utilisateur d’OppsTrack.'
      : 'Specialist in data visualization and front-end development, she designs OppsTrack’s user experience.',
  };

  // Animation fade-up (optionnelle)
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

  // Images des membres (à remplacer par vos vraies images)
  // Placez vos photos dans le dossier public/images/ ou utilisez des URLs
  const sendaImage = '/senda.jpg';
const imenImage = '/imen.jpg';
  // Fallback si image absente : on affiche l'icône par défaut
  const [imgErrorSenda, setImgErrorSenda] = useState(false);
  const [imgErrorImen, setImgErrorImen] = useState(false);

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
            {t.heroTitle}<br />
            <span style={{ color: c.accent }}>réussir à l'international</span>
          </h1>
          <p style={{ fontSize: 18, color: c.ink2, lineHeight: 1.6 }}>{t.heroSub}</p>
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
            { icon: '🎯', title: t.missionTitle, desc: t.missionDesc, bg: `${c.accent}10` },
            { icon: '⭐', title: t.valuesTitle, desc: t.valuesDesc, bg: '#fef3c7' },
            { icon: '🚀', title: t.visionTitle, desc: t.visionDesc, bg: '#d1fae5' },
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
                transition: 'transform 0.3s, box-shadow 0.3s',
                opacity: visible[`card-${i}`] ? 1 : 0,
                transform: visible[`card-${i}`] ? 'translateY(0)' : 'translateY(20px)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>{item.icon}</div>
              <h3 style={{ fontFamily: c.fSerif, fontSize: 20, fontWeight: 700, marginBottom: 12, color: c.ink }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: c.ink2, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Statistiques (inchangées) */}
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
            { number: '50K+', label: t.students },
            { number: '1,200+', label: t.scholarships },
            { number: '85+', label: t.countries },
            { number: '94%', label: t.satisfaction },
          ].map((stat, i) => (
            <div key={i}><div style={{ fontSize: 42, fontWeight: 800, marginBottom: 8, color: '#fff' }}>{stat.number}</div><div style={{ fontSize: 14, color: '#cfe9f3' }}>{stat.label}</div></div>
          ))}
        </div>

                {/* Équipe – pleine largeur */}
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
    {/* Senda Kadoussi */}
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

    {/* Imen Abidi */}
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

        {/* Pourquoi nous choisir  */}
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

        {/* CTA (inchangé) */}
        <div style={{ background: c.accent, borderRadius: 20, padding: '60px 32px', textAlign: 'center', color: '#fff' }}>
          <h2 style={{ fontFamily: c.fSerif, fontSize: 32, fontWeight: 700, marginBottom: 16 }}>{t.ctaTitle}</h2>
          <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 32 }}>{t.ctaSub}</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setView('bourses')} style={{ padding: '12px 32px', background: '#fff', color: c.accent, border: 'none', borderRadius: 40, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              {t.ctaButton}
            </button>
            <button onClick={() => setView('contact')} style={{ padding: '12px 32px', background: 'transparent', border: `2px solid #fff`, color: '#fff', borderRadius: 40, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              {t.ctaContact}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}