import React from 'react';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';

const tokens = (theme) => ({
  bg: theme === "dark" ? "#15140f" : "#ffffff",
  ink: theme === "dark" ? "#f2efe7" : "#141414",
  ink2: theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3: theme === "dark" ? "#a19f96" : "#6b6b6b",
  ink4: theme === "dark" ? "#6d6b64" : "#9a9794",
  border: theme === "dark" ? "#2b2a22" : "#d9d5cb",
  accent: "#0066b3",
  fSerif: `"Playfair Display", "Times New Roman", Georgia, serif`,
  fSans: `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono: `"DM Sans", monospace`,
});

export default function Footer({ setView }) {
  const { t, lang } = useT();
  const { theme } = useTheme();
  const C = tokens(theme);
  const currentYear = new Date().getFullYear();

  const cols = [
    {
      h: "Platform",
      hf: "Plateforme",
      items: [
        { fr: "Bourses", en: "Scholarships", action: "bourses" },
        { fr: "Recommandations", en: "Recommendations", action: "recommandations" },
        { fr: "Roadmap", en: "Roadmap", action: "roadmap" },
        { fr: "Dashboard", en: "Dashboard", action: "dashboard" },
      ],
    },
    {
      h: "AI Tools",
      hf: "Outils IA",
      items: [
        { fr: "Assistant IA", en: "AI Assistant", action: "accueil" },
        { fr: "Créateur de CV", en: "CV Builder", action: "cv" },
        { fr: "Simulateur d'entretien", en: "Interview Simulator", action: "entretien" },
      ],
    },
    {
      h: "Resources",
      hf: "Ressources",
      items: [
        { fr: "Guides", en: "Guides", action: null },
        { fr: "FAQ", en: "FAQ", action: null },
        { fr: "Blog", en: "Blog", action: null },
      ],
    },
    {
      h: "Company",
      hf: "À propos",
      items: [
        { fr: "À propos", en: "About", action: null },
        { fr: "Contact", en: "Contact", action: "contact" },
        { fr: "Témoignages", en: "Testimonials", action: "feedback" },
      ],
    },
  ];

  const handleLinkClick = (action) => (e) => {
    e.preventDefault();
    if (setView && action) {
      setView(action);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const footerStyles = {
    background: C.bg,
    color: C.ink2,
    marginTop: 0,
  };

  const containerStyles = {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "72px 40px 48px",
    display: "grid",
    gridTemplateColumns: "1.8fr repeat(4, 1fr)",
    gap: 48,
  };

  const logoStyles = {
    fontFamily: C.fSerif,
    fontSize: 32,
    fontWeight: 700,
    color: C.ink,
    letterSpacing: "-0.015em",
  };

  const taglineStyles = {
    fontFamily: C.fMono,
    fontSize: 10.5,
    color: C.ink3,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    fontWeight: 600,
    marginTop: 10,
  };

  const descStyles = {
    fontFamily: C.fSans,
    fontSize: 13.5,
    color: C.ink3,
    lineHeight: 1.6,
    marginTop: 18,
    maxWidth: 340,
  };

  const headingStyles = {
    fontFamily: C.fSans,
    fontSize: 10,
    color: C.ink3,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    fontWeight: 700,
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: `1px solid ${C.border}`,
  };

  const linkStyles = {
    display: "block",
    fontFamily: C.fSerif,
    fontSize: 15,
    color: C.ink2,
    textDecoration: "none",
    padding: "7px 0",
    cursor: "pointer",
    transition: "color 0.2s ease",
  };

  const bottomBarStyles = {
    borderTop: `1px solid ${C.border}`,
    padding: "20px 40px",
  };

  const bottomContainerStyles = {
    maxWidth: 1440,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    fontFamily: C.fMono,
    fontSize: 10.5,
    color: C.ink4,
    letterSpacing: "0.14em",
  };

  const legalStyles = {
    textTransform: "uppercase",
    letterSpacing: "0.22em",
  };

  return (
    <footer style={footerStyles}>
      <div style={containerStyles}>
        {/* Colonne 1 : Logo & description */}
        <div>
          <div style={logoStyles}>OppsTrack</div>
          <div style={taglineStyles}>Discover · Match · Prepare · Apply · Track</div>
          <p style={descStyles}>
            {lang === "fr"
              ? "Plateforme indépendante pour le suivi d'opportunités académiques et professionnelles internationales."
              : "An independent platform for tracking international academic and professional opportunities."}
          </p>
        </div>

        {/* Colonnes dynamiques */}
        {cols.map((col, ci) => (
          <div key={ci}>
            <div style={headingStyles}>{lang === "fr" ? col.hf : col.h}</div>
            {col.items.map((it, i) => (
              <a
                key={i}
                href="#"
                style={linkStyles}
                onClick={handleLinkClick(it.action)}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.ink2)}
              >
                {lang === "fr" ? it.fr : it.en}
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={bottomBarStyles}>
        <div style={bottomContainerStyles}>
          <span>© {currentYear} OppsTrack · {lang === "fr" ? "Tous droits réservés" : "All rights reserved"}</span>
          <span style={legalStyles}>
            {lang === "fr" ? "Mentions · Confidentialité · Cookies" : "Legal · Privacy · Cookies"}
          </span>
        </div>
      </div>
    </footer>
  );
}