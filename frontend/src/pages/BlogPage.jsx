// pages/BlogPage.jsx
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

const articles = [
  { id: 1, category: "success", titleFr: "De Dakar à Oxford : Le parcours de Fatima avec la bourse Rhodes", titleEn: "From Dakar to Oxford: Fatima's journey with the Rhodes scholarship", excerptFr: "Comment Fatima a décroché une bourse Rhodes malgré son parcours atypique.", excerptEn: "How Fatima won a Rhodes scholarship despite her atypical background.", readTime: "8 min", date: "2025-03-15", author: "Senda Kadoussi", authorImage: "/senda.jpg", featured: true },
  { id: 2, category: "success", titleFr: "Comment j'ai obtenu une bourse complète au MIT", titleEn: "How I got a full scholarship to MIT", excerptFr: "Les étapes clés et les erreurs à éviter selon notre étudiant.", excerptEn: "Key steps and mistakes to avoid according to our student.", readTime: "10 min", date: "2025-02-20", featured: false },
  { id: 3, category: "conseils", titleFr: "5 erreurs à éviter dans votre lettre de motivation", titleEn: "5 mistakes to avoid in your motivation letter", excerptFr: "Les erreurs les plus fréquentes qui coûtent des bourses.", excerptEn: "The most common mistakes that cost scholarships.", readTime: "6 min", date: "2025-03-01", featured: false },
  { id: 4, category: "actualites", titleFr: "10 nouvelles bourses Fully Funded pour 2024", titleEn: "10 new Fully Funded scholarships for 2024", excerptFr: "Opportunités à ne pas manquer cette année.", excerptEn: "Opportunities not to miss this year.", readTime: "5 min", date: "2025-01-10", featured: true },
  { id: 5, category: "analyses", titleFr: "Statistiques 2024 : Quelles bourses sont les plus compétitives ?", titleEn: "2024 statistics: Which scholarships are most competitive?", excerptFr: "Analyse des taux d'acceptation par programme.", excerptEn: "Analysis of acceptance rates by program.", readTime: "12 min", date: "2025-02-05", featured: false },
];

export default function BlogPage({ setView }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = articles;
    if (category !== 'all') result = result.filter(a => a.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        (lang === 'fr' ? a.titleFr : a.titleEn).toLowerCase().includes(q)
      );
    }
    return result;
  }, [category, search, lang]);

  const featured = articles.filter(a => a.featured);

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
            {lang === 'fr' ? 'Blog & Actualités' : 'Blog & News'}
          </h1>
          <div style={{ maxWidth: 500, margin: '0 auto', position: 'relative' }}>
            <input
              type="text"
              placeholder={lang === 'fr' ? 'Rechercher un article...' : 'Search articles...'}
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

      {/* Catégories */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
          {[
            { id: 'all', labelFr: 'Tous', labelEn: 'All' },
            { id: 'success', labelFr: '🌟 Success Stories', labelEn: '🌟 Success Stories' },
            { id: 'actualites', labelFr: '📰 Actualités', labelEn: '📰 News' },
            { id: 'conseils', labelFr: '💡 Conseils', labelEn: '💡 Tips' },
            { id: 'analyses', labelFr: '📊 Analyses', labelEn: '📊 Analyses' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                padding: '8px 20px',
                borderRadius: 40,
                background: category === cat.id ? c.accent : 'transparent',
                color: category === cat.id ? c.paper : c.ink2,
                border: `1px solid ${category === cat.id ? c.accent : c.ruleSoft}`,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: c.fMono,
              }}
            >
              {lang === 'fr' ? cat.labelFr : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Featured articles */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: c.fSerif, fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
            {lang === 'fr' ? 'À la une' : 'Featured'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {featured.map(article => (
              <div
                key={article.id}
                style={{
                  background: c.surface,
                  border: `1px solid ${c.ruleSoft}`,
                  borderRadius: 16,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ padding: '20px' }}>
                  <div style={{ fontSize: 24, marginBottom: 12 }}>📖</div>
                  <h3 style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, marginBottom: 8, color: c.ink }}>
                    {lang === 'fr' ? article.titleFr : article.titleEn}
                  </h3>
                  <p style={{ fontSize: 13, color: c.ink2, marginBottom: 12 }}>{lang === 'fr' ? article.excerptFr : article.excerptEn}</p>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: c.ink3 }}>
                    <span>⏱️ {article.readTime}</span>
                    <span>📅 {new Date(article.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All articles */}
        <div>
          <h2 style={{ fontFamily: c.fSerif, fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
            {lang === 'fr' ? 'Derniers articles' : 'Latest articles'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(article => (
              <div
                key={article.id}
                style={{
                  background: c.surface,
                  border: `1px solid ${c.ruleSoft}`,
                  borderRadius: 12,
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: c.ink }}>{lang === 'fr' ? article.titleFr : article.titleEn}</h3>
                    <p style={{ fontSize: 13, color: c.ink2, marginBottom: 12 }}>{lang === 'fr' ? article.excerptFr : article.excerptEn}</p>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: c.ink3 }}>
                      <span>⏱️ {article.readTime}</span>
                      <span>📅 {new Date(article.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}</span>
                    </div>
                  </div>
                  <span style={{ padding: '4px 12px', background: c.paper2, borderRadius: 20, fontSize: 11 }}>{article.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}