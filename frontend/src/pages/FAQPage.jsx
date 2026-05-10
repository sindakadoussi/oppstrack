// pages/FAQPage.jsx
import React, { useState, useMemo } from 'react';
import {  useTheme } from '../components/Navbar';
import { useT } from '../i18n';

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
  fSerif: `"Playfair Display", "Times New Roman", Georgia, serif`,
  fSans: `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono: `"DM Sans", monospace`,
});

const faqData = {
  general: [
    { qFr: "Qu'est-ce qu'OppsTrack ?", qEn: "What is OppsTrack?", aFr: "OppsTrack est une plateforme qui centralise les bourses internationales et utilise l'IA pour vous recommander les meilleures opportunités.", aEn: "OppsTrack is a platform that centralizes international scholarships and uses AI to recommend the best opportunities." },
    { qFr: "Comment fonctionne le matching IA ?", qEn: "How does AI matching work?", aFr: "Notre IA analyse votre profil académique, vos compétences et vos préférences pour calculer un score de compatibilité avec chaque bourse.", aEn: "Our AI analyzes your academic profile, skills and preferences to calculate a compatibility score with each scholarship." },
    { qFr: "OppsTrack est-il vraiment gratuit ?", qEn: "Is OppsTrack really free?", aFr: "Oui, OppsTrack est entièrement gratuit pour tous les étudiants. Aucune carte bancaire requise.", aEn: "Yes, OppsTrack is completely free for all students. No credit card required." },
    { qFr: "Comment vérifiez-vous les bourses ?", qEn: "How do you verify scholarships?", aFr: "Nous vérifions chaque bourse manuellement avant de l'ajouter à notre base de données.", aEn: "We manually verify each scholarship before adding it to our database." },
  ],
  scholarships: [
    { qFr: "Quelle est la différence entre Fully Funded et Partiel ?", qEn: "What's the difference between Fully Funded and Partial?", aFr: "Fully Funded couvre tous les frais (scolarité, logement, billets). Partiel ne couvre qu'une partie.", aEn: "Fully Funded covers all costs (tuition, housing, flights). Partial covers only part." },
    { qFr: "Combien de temps à l'avance dois-je postuler ?", qEn: "How far in advance should I apply?", aFr: "Idéalement 6 à 12 mois avant la date de début des études.", aEn: "Ideally 6 to 12 months before the start date." },
    { qFr: "Puis-je postuler à plusieurs bourses en même temps ?", qEn: "Can I apply for multiple scholarships at the same time?", aFr: "Oui, vous pouvez postuler à autant de bourses que vous le souhaitez.", aEn: "Yes, you can apply for as many scholarships as you wish." },
  ],
  candidature: [
    { qFr: "Combien de lettres de recommandation faut-il ?", qEn: "How many recommendation letters are needed?", aFr: "La plupart des bourses demandent 2 à 3 lettres.", aEn: "Most scholarships require 2 to 3 letters." },
    { qFr: "Mon niveau d'anglais est-il suffisant ?", qEn: "Is my English level sufficient?", aFr: "Vérifiez le score TOEFL/IELTS requis (généralement 80-100 TOEFL).", aEn: "Check the required TOEFL/IELTS score (usually 80-100 TOEFL)." },
  ],
  technique: [
    { qFr: "Comment créer mon profil ?", qEn: "How to create my profile?", aFr: "Cliquez sur 'Se connecter' puis sur 'Créer un compte' et remplissez vos informations.", aEn: "Click 'Sign in' then 'Create an account' and fill in your information." },
    { qFr: "Comment suivre mes candidatures ?", qEn: "How to track my applications?", aFr: "Utilisez la section 'Roadmap' pour voir l'avancement de vos candidatures.", aEn: "Use the 'Roadmap' section to see the progress of your applications." },
  ],
};

export default function FAQPage({ setView }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState(null);
  const [votes, setVotes] = useState({});

  const allFAQs = useMemo(() => {
    const items = [];
    Object.entries(faqData).forEach(([cat, qs]) => {
      qs.forEach((q, idx) => {
        items.push({
          category: cat,
          id: `${cat}-${idx}`,
          question: lang === 'fr' ? q.qFr : q.qEn,
          answer: lang === 'fr' ? q.aFr : q.aEn,
        });
      });
    });
    return items;
  }, [lang]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allFAQs;
    const q = search.toLowerCase();
    return allFAQs.filter(f => f.question.toLowerCase().includes(q));
  }, [search, allFAQs]);

  const handleVote = (id, helpful) => {
    setVotes(prev => ({ ...prev, [id]: helpful }));
  };

  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${c.accent}08 0%, ${c.paper2} 100%)`,
        padding: '64px 24px',
        textAlign: 'center',
        borderBottom: `1px solid ${c.rule}`,
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{
            fontFamily: c.fSerif,
            fontSize: 'clamp(36px, 5vw, 52px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: c.ink,
            marginBottom: 20,
          }}>
            {lang === 'fr' ? 'Foire aux questions' : 'Frequently Asked Questions'}
          </h1>
          <div style={{ maxWidth: 500, margin: '0 auto', position: 'relative' }}>
            <input
              type="text"
              placeholder={lang === 'fr' ? 'Rechercher une question...' : 'Search a question...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: `1px solid ${c.ruleSoft}`,
                borderRadius: 40,
                background: c.surface,
                color: c.ink,
                fontSize: 14,
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: c.ink3 }}>🔍</span>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        {filtered.map((faq, i) => (
          <div key={faq.id} style={{ marginBottom: 16, borderBottom: `1px solid ${c.ruleSoft}` }}>
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 16,
                fontWeight: 600,
                color: c.ink,
                fontFamily: c.fSerif,
              }}
            >
              <span>{faq.question}</span>
              <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </button>
            {openIndex === i && (
              <div style={{ paddingBottom: 20, color: c.ink2, fontSize: 14, lineHeight: 1.6 }}>
                <p>{faq.answer}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
                  <span style={{ fontSize: 12, color: c.ink3 }}>{lang === 'fr' ? 'Cette réponse vous a-t-elle aidée ?' : 'Was this answer helpful?'}</span>
                  <button
                    onClick={() => handleVote(faq.id, true)}
                    style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: votes[faq.id] === true ? c.accent : c.ink3 }}
                  >👍</button>
                  <button
                    onClick={() => handleVote(faq.id, false)}
                    style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: votes[faq.id] === false ? c.accent : c.ink3 }}
                  >👎</button>
                </div>
              </div>
            )}
          </div>
        ))}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <p style={{ color: c.ink2, marginBottom: 16 }}>{lang === 'fr' ? 'Vous n‘avez pas trouvé votre réponse ?' : 'Haven’t found your answer?'}</p>
          <button
            onClick={() => setView('contact')}
            style={{ padding: '10px 28px', background: c.accent, color: c.paper, border: 'none', borderRadius: 40, fontSize: 13, cursor: 'pointer' }}
          >
            {lang === 'fr' ? 'Nous contacter' : 'Contact us'}
          </button>
        </div>
      </div>
    </main>
  );
}