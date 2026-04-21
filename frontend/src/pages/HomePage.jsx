// app/page.jsx  (ou pages/index.jsx)
// Homepage OppsTrack — style éditorial inspiré unipd.it
// Animations : hero fullbleed, funnel step-by-step, modules stagger, AI typewriter, stories, sources flip-in
// Police : Libre Caslon Text + Inter + JetBrains Mono (voir layout)
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useT } from "../i18n";
import { useTheme } from "../components/Navbar";
import { useNavigate } from "react-router-dom";

/* =============== TOKENS =============== */
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

/* =============== HOOK: INTERSECTION OBSERVER =============== */
function useReveal(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.15, ...options }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return [ref, visible];
}

/* =============== HOOK: TYPEWRITER =============== */
function useTypewriter(text, trigger, speed = 22) {
  const [display, setDisplay] = useState("");
  const [typing, setTyping] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setDisplay("");
    setTyping(true);
    let i = 0;
    timerRef.current = setInterval(() => {
      setDisplay(text.slice(0, ++i));
      if (i >= text.length) {
        clearInterval(timerRef.current);
        setTyping(false);
      }
    }, speed);
    return () => clearInterval(timerRef.current);
  }, [text, trigger]);

  return { display, typing };
}

/* =============== SHARED =============== */
function Arrow({ size = 14 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function SectionLabel({ num, title, c, style = {} }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 4, ...style }}>
      <span style={{ fontFamily: c.fMono, fontSize: 11, color: c.accent, fontWeight: 600, letterSpacing: ".22em", textTransform: "uppercase" }}>
        § {num}
      </span>
      <span style={{ fontFamily: c.fSans, fontSize: 11, color: c.ink3, fontWeight: 600, letterSpacing: ".22em", textTransform: "uppercase" }}>
        {title}
      </span>
    </div>
  );
}

function BigHeading({ children, c, style = {} }) {
  return (
    <h2 style={{
      fontFamily: c.fSerif,
      fontSize: "clamp(32px, 4vw, 54px)",
      fontWeight: 700,
      letterSpacing: "-.015em",
      lineHeight: 1.05,
      color: c.ink,
      margin: "16px 0 32px",
      ...style,
    }}>
      {children}
    </h2>
  );
}

/* =============== 1. HERO =============== */
function Hero({ c, lang, navigate }) {
  const [heroVisible, setHeroVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState([false, false, false, false]);

  useEffect(() => {
    // hero content fade-in
    const t1 = setTimeout(() => setHeroVisible(true), 150);
    // cards staggered
    [600, 850, 1100, 1350].forEach((delay, i) => {
      setTimeout(() => {
        setCardsVisible((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, delay);
    });
    return () => clearTimeout(t1);
  }, []);

  const cardStyle = (visible, extra = {}) => ({
    position: "absolute",
    background: lang === "dark"
      ? "rgba(26,25,18,.92)"
      : "rgba(18,16,10,.85)",
    border: "1px solid rgba(242,239,231,.12)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    padding: "14px 16px",
    color: "#f2efe7",
    fontFamily: c.fSans,
    boxShadow: "0 16px 48px rgba(0,0,0,.38)",
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(22px)",
    transition: "opacity .7s ease, transform .7s ease",
    ...extra,
  });

  return (
    <>
      <style>{`
        @keyframes heroPulse {
          0%,100% { box-shadow: 0 0 0 4px rgba(76,159,217,.18); }
          50%      { box-shadow: 0 0 0 9px rgba(76,159,217,.04); }
        }
        .hero-bg-img {
          position: absolute; inset: 0;
          background-image: url('/ceremonie.jpg');
          background-size: cover; background-position: center;
          filter: brightness(.36);
          transform: scale(1.06);
          transition: transform 14s ease-out;
        }
        .hero-bg-img.loaded { transform: scale(1); }
        .hero-btn-primary {
          padding: 15px 28px; font-size: 11px; font-weight: 700;
          letter-spacing: .22em; text-transform: uppercase;
          background: ${c.accent}; color: #fff; border: none; cursor: pointer;
          font-family: ${c.fSans}; display: inline-flex; align-items: center; gap: 10px;
          transition: background .2s, transform .15s;
        }
        .hero-btn-primary:hover { background: ${lang === "dark" ? "#3a8bc4" : "#004f8a"}; transform: translateY(-2px); }
        .hero-btn-ghost {
          padding: 15px 28px; font-size: 11px; font-weight: 700;
          letter-spacing: .22em; text-transform: uppercase;
          background: transparent; color: #f2efe7;
          border: 1px solid rgba(242,239,231,.45); cursor: pointer;
          font-family: ${c.fSans}; transition: background .2s;
        }
        .hero-btn-ghost:hover { background: rgba(242,239,231,.1); }
      `}</style>

      <section style={{
        position: "relative",
        height: "100vh",
        minHeight: 600,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}>

        {/* Background image */}
       <div className="hero-bg-img" />

        {/* Overlay gradient → paper color at bottom */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(to bottom, rgba(20,15,5,.55) 0%, rgba(20,15,5,.7) 60%, ${c.paper} 100%)`,
        }} />

        {/* Content */}
        <div style={{
          position: "relative", zIndex: 2,
          maxWidth: 1440, margin: "0 auto",
          padding: "200px 48px 120px",   /* 200px top = clears 114px navbar + breathing room */
          width: "100%",
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "none" : "translateY(32px)",
          transition: "opacity .9s ease .2s, transform .9s ease .2s",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 64, alignItems: "center" }}>

            {/* Left */}
            <div>
              <div style={{
                fontFamily: c.fMono, fontSize: 11, color: c.accent,
                letterSpacing: ".28em", textTransform: "uppercase",
                fontWeight: 600, marginBottom: 22,
              }}>
                § Platform
              </div>

              <h1 style={{
                fontFamily: c.fSerif,
                fontSize: "clamp(46px, 6vw, 86px)",
                fontWeight: 700, lineHeight: 1.03,
                letterSpacing: "-.022em",
                color: "#f2efe7", margin: 0,
              }}>
                {lang === "fr" ? (
                  <><em style={{ color: c.accent, fontStyle: "italic" }}>L'intelligence</em><br />au service de vos<br />opportunités académiques.</>
                ) : (
                  <>One intelligent platform<br />for every <em style={{ color: c.accent, fontStyle: "italic" }}>scholarship journey</em>.</>
                )}
              </h1>

              <p style={{
                fontFamily: c.fSans, fontSize: 17, lineHeight: 1.65,
                color: "rgba(242,239,231,.78)",
                maxWidth: 580, margin: "28px 0 0",
              }}>
                {lang === "fr"
                  ? "OppsTrack centralise les bourses entièrement financées dans le monde, vous aide à découvrir des opportunités, évaluer votre compatibilité, préparer des candidatures plus solides, vous entraîner aux entretiens et suivre chaque échéance — au même endroit."
                  : "OppsTrack centralizes fully funded scholarships worldwide and helps you discover opportunities, evaluate your match, prepare stronger applications, practice interviews and track every deadline in one place."}
              </p>

              <div style={{ display: "flex", gap: 14, marginTop: 38, flexWrap: "wrap" }}>
                <button className="hero-btn-primary" onClick={() => navigate("/bourses")}>
                  {lang === "fr" ? "Explorer les bourses" : "Explore scholarships"} <Arrow />
                </button>
                <button className="hero-btn-ghost" onClick={() => navigate("/chat")}>
                  {lang === "fr" ? "Essayer l'IA" : "Try AI assistant"}
                </button>
              </div>

              <div style={{
                display: "flex", gap: 10, marginTop: 44,
                fontFamily: c.fMono, fontSize: 10.5,
                color: "rgba(242,239,231,.5)",
                letterSpacing: ".2em", textTransform: "uppercase",
              }}>
                {["Discover","Match","Prepare","Apply","Track"].map((w, i, arr) => (
                  <React.Fragment key={w}>
                    <span>{w}</span>
                    {i < arr.length - 1 && <span style={{ color: "rgba(242,239,231,.22)" }}>·</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Right — collage */}
            <div style={{ position: "relative", height: 480, display: "none" }}
              ref={(el) => { if (el) el.style.display = "block"; }}
            >
              {/* Card 1 — Scholarship match */}
              <div style={cardStyle(cardsVisible[0], { top: 0, left: 0, width: 264, transform: cardsVisible[0] ? "rotate(-1.5deg)" : "translateY(22px)" })}>
                <div style={{ fontSize: 9.5, color: "rgba(242,239,231,.42)", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 600 }}>Germany · Bonn</div>
                <div style={{ fontFamily: c.fSerif, fontSize: 17, fontWeight: 700, marginTop: 6, lineHeight: 1.25 }}>DAAD — Helmut Schmidt Programme</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 11 }}>
                  <span style={{ color: "rgba(242,239,231,.42)", letterSpacing: ".12em", textTransform: "uppercase", fontSize: 9.5 }}>Match</span>
                  <span style={{ fontFamily: c.fMono, color: c.accent, fontWeight: 600 }}>94%</span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,.1)", marginTop: 4, position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, width: "94%", background: c.accent }} />
                </div>
              </div>

              {/* Card 2 — AI */}
              <div style={cardStyle(cardsVisible[1], { top: 68, right: 0, width: 282, transform: cardsVisible[1] ? "rotate(1deg)" : "translateY(22px)" })}>
                <div style={{ fontSize: 9.5, color: c.accent, letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 700 }}>AI Assistant</div>
                <div style={{ fontFamily: c.fSerif, fontSize: 13, color: "rgba(242,239,231,.7)", marginTop: 10, lineHeight: 1.4 }}>
                  "Am I eligible for DAAD with a 3.4 GPA and 2 years of experience?"
                </div>
                <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(242,239,231,.07)", fontSize: 12, color: "#f2efe7", lineHeight: 1.45, borderLeft: `2px solid ${c.accent}` }}>
                  Your profile meets <strong>5 of 6</strong> criteria. Focus: TOEFL score…
                </div>
              </div>

              {/* Card 3 — Roadmap */}
              <div style={cardStyle(cardsVisible[2], { top: 236, left: 20, width: 234 })}>
                <div style={{ fontSize: 9.5, color: "rgba(242,239,231,.42)", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 600 }}>Roadmap · Chevening</div>
                {[
                  { k: "Profile", done: true },
                  { k: "Essays", done: true },
                  { k: "References", done: false, active: true },
                  { k: "Submit", done: false },
                ].map((s) => (
                  <div key={s.k} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, fontSize: 12 }}>
                    <span style={{
                      width: 14, height: 14, flexShrink: 0,
                      border: `1px solid ${s.done ? c.accent : s.active ? "#f2efe7" : "rgba(242,239,231,.25)"}`,
                      background: s.done ? c.accent : "transparent",
                      display: "inline-block",
                    }} />
                    <span style={{ color: s.done ? "rgba(242,239,231,.42)" : s.active ? "#f2efe7" : "rgba(242,239,231,.3)", fontWeight: s.active ? 600 : 400 }}>
                      {s.k}
                    </span>
                  </div>
                ))}
              </div>

              {/* Card 4 — Deadline */}
              <div style={cardStyle(cardsVisible[3], { bottom: 10, right: 30, width: 214, borderLeft: `3px solid ${c.danger}`, transform: cardsVisible[3] ? "rotate(-.8deg)" : "translateY(22px)" })}>
                <div style={{ fontSize: 9.5, color: c.danger, letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 700 }}>Deadline · today</div>
                <div style={{ fontFamily: c.fSerif, fontSize: 16, fontWeight: 700, marginTop: 4 }}>Chevening Scholarship</div>
                <div style={{ fontFamily: c.fMono, fontSize: 11, color: "rgba(242,239,231,.42)", marginTop: 6 }}>21 · APR · 2026</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* =============== 2. FUNNEL — step by step =============== */
function Funnel({ c, lang }) {
  const [sectionRef, sectionVisible] = useReveal({ threshold: 0.08 });
  const [stepsVisible, setStepsVisible] = useState([false, false, false, false, false]);
  const [lineDrawn, setLineDrawn] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    if (!sectionVisible || triggered.current) return;
    triggered.current = true;
    setLineDrawn(true);
    [0, 1, 2, 3, 4].forEach((i) => {
      setTimeout(() => {
        setStepsVisible((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 200 + i * 220);
    });
  }, [sectionVisible]);

  const steps = [
    {
      k: "Build", fr: "Construire",
      t: lang === "fr" ? "Votre profil académique" : "Your academic profile",
      d: lang === "fr" ? "Diplômes, langues, expériences, domaines d'intérêt — votre socle de candidature." : "Degrees, languages, experiences, fields of interest — your application foundation.",
    },
    {
      k: "Match", fr: "Associer",
      t: lang === "fr" ? "Opportunités compatibles" : "Opportunities that fit",
      d: lang === "fr" ? "Algorithme de compatibilité, filtres avancés, recommandations par pays et niveau." : "Matching algorithm, advanced filters, recommendations by country and level.",
    },
    {
      k: "Prepare", fr: "Préparer",
      t: lang === "fr" ? "Candidature plus solide" : "Stronger applications",
      d: lang === "fr" ? "IA qui rédige, révise et structure CV, lettres, essais et dossiers." : "AI that drafts, reviews and structures CVs, letters, essays and files.",
    },
    {
      k: "Practice", fr: "S'entraîner",
      t: lang === "fr" ? "Entretiens simulés" : "Simulated interviews",
      d: lang === "fr" ? "Simulateur IA, questions typiques du programme, retour détaillé." : "AI simulator, program-specific questions, detailed feedback.",
    },
    {
      k: "Track", fr: "Suivre",
      t: lang === "fr" ? "Échéances & soumission" : "Deadlines & submission",
      d: lang === "fr" ? "Planning stratégique, alertes, suivi d'état par candidature." : "Strategic planning, alerts, per-application status tracking.",
    },
  ];

  return (
    <>
      <style>{`
        .funnel-line-inner {
          position: absolute; left: 23px; top: 24px; bottom: 0;
          width: 2px; background: ${c.rule};
          transform: scaleY(0); transform-origin: top center;
          transition: transform 1.3s cubic-bezier(.4,0,.2,1);
        }
        .funnel-line-inner.drawn { transform: scaleY(1); }
      `}</style>

      <section
        ref={sectionRef}
        style={{ padding: "96px 40px", borderBottom: `1px solid ${c.rule}`, background: c.paper }}
      >
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <SectionLabel num="02" title={lang === "fr" ? "Processus" : "Process"} c={c} />
          <BigHeading c={c}>
            {lang === "fr"
              ? <>{`Comment OppsTrack `}<em style={{ color: c.accent, fontStyle: "italic" }}>guide</em> votre candidature.</>
              : <>How OppsTrack <em style={{ color: c.accent, fontStyle: "italic" }}>guides</em> your application.</>}
          </BigHeading>

          <div style={{ position: "relative", maxWidth: 760 }}>
            <div className={`funnel-line-inner${lineDrawn ? " drawn" : ""}`} />

            {steps.map((s, i) => (
              <div
                key={s.k}
                style={{
                  display: "flex", gap: 30, marginBottom: 44,
                  opacity: stepsVisible[i] ? 1 : 0,
                  transform: stepsVisible[i] ? "none" : "translateX(-28px)",
                  transition: "opacity .6s ease, transform .6s ease",
                  position: "relative", zIndex: 1,
                }}
              >
                {/* Circle */}
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${stepsVisible[i] ? c.ink : c.rule}`,
                  background: stepsVisible[i] ? c.ink : c.paper,
                  display: "grid", placeItems: "center",
                  fontFamily: c.fSerif, fontSize: 16, fontWeight: 700,
                  color: stepsVisible[i] ? c.paper : c.ink,
                  transition: "background .4s ease .1s, color .4s ease .1s, border-color .4s ease .1s",
                }}>
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Body */}
                <div style={{ paddingTop: 8, flex: 1 }}>
                  <div style={{
                    fontFamily: c.fMono, fontSize: 10, color: c.accent,
                    letterSpacing: ".22em", textTransform: "uppercase", fontWeight: 600,
                  }}>
                    {lang === "fr" ? s.fr : s.k}
                  </div>
                  <h3 style={{
                    fontFamily: c.fSerif, fontSize: 22, fontWeight: 700,
                    margin: "8px 0 8px", color: c.ink,
                    letterSpacing: "-.005em", lineHeight: 1.25,
                  }}>
                    {s.t}
                  </h3>
                  <p style={{ fontFamily: c.fSans, fontSize: 13, color: c.ink2, lineHeight: 1.6, margin: 0 }}>
                    {s.d}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* =============== 3. MODULES =============== */
function Modules({ c, lang }) {
  const [gridRef, gridVisible] = useReveal({ threshold: 0.08 });
  const [visibleCards, setVisibleCards] = useState([]);
  const triggered = useRef(false);

  useEffect(() => {
    if (!gridVisible || triggered.current) return;
    triggered.current = true;
    modules.forEach((_, i) => {
      setTimeout(() => {
        setVisibleCards((prev) => [...prev, i]);
      }, i * 90);
    });
  }, [gridVisible]);

  const modules = [
    { k: "AI Assistant", fr: "Assistant IA", d: lang === "fr" ? "Posez des questions, vérifiez votre éligibilité, obtenez des conseils instantanés." : "Ask questions, verify eligibility, get instant guidance." },
    { k: "Scholarships Explorer", fr: "Explorateur de bourses", d: lang === "fr" ? "Recherchez, filtrez, sauvegardez et évaluez les opportunités mondiales." : "Search, filter, favorite and evaluate opportunities." },
    { k: "Personalized Recommendations", fr: "Recommandations personnalisées", d: lang === "fr" ? "Recevez des bourses sélectionnées selon votre profil et domaine." : "Receive scholarships matched to your profile." },
    { k: "Application Roadmap", fr: "Roadmap de candidature", d: lang === "fr" ? "Un guide étape par étape pour chaque dossier." : "Get step-by-step application guidance." },
    { k: "CV & Motivation Letter", fr: "CV & Lettre de motivation", d: lang === "fr" ? "Générez et optimisez vos documents de candidature avec l'IA." : "Generate and optimize application documents." },
    { k: "Interview Simulator", fr: "Simulateur d'entretien", d: lang === "fr" ? "Entraînez-vous aux entretiens avec scoring IA et retour personnalisé." : "Practice scholarship interviews with AI scoring and feedback." },
    { k: "Dashboard", fr: "Tableau de bord", d: lang === "fr" ? "Suivez vos échéances, candidatures et statistiques globales." : "Track deadlines, applications and global opportunities." },
  ];

  return (
    <>
      <style>{`
        .module-card {
          padding: 32px 28px 28px;
          border-right: 1px solid ${c.ruleSoft};
          border-bottom: 1px solid ${c.ruleSoft};
          cursor: pointer;
          background: ${c.surface};
          display: flex; flex-direction: column; min-height: 210px;
          position: relative; overflow: hidden;
          transition: background .2s;
        }
        .module-card::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 0;
          background: ${c.accent}; transition: width .25s ease;
        }
        .module-card:hover::before { width: 3px; }
        .module-card:hover { background: ${c.paper2}; }
        .module-cta-arrow { transition: transform .2s; display: inline-flex; }
        .module-card:hover .module-cta-arrow { transform: translateX(5px); }
      `}</style>

      <section style={{ padding: "88px 40px", borderBottom: `1px solid ${c.rule}`, background: c.surface }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <SectionLabel num="03" title={lang === "fr" ? "Écosystème" : "Ecosystem"} c={c} />
          <BigHeading c={c}>
            {lang === "fr"
              ? <>Explorez l'<em style={{ color: c.accent, fontStyle: "italic" }}>écosystème</em> OppsTrack.</>
              : <>Explore the OppsTrack <em style={{ color: c.accent, fontStyle: "italic" }}>ecosystem</em>.</>}
          </BigHeading>

          <div
            ref={gridRef}
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: `1px solid ${c.rule}` }}
          >
            {modules.map((m, i) => (
              <div
                key={m.k}
                className="module-card"
                style={{
                  opacity: visibleCards.includes(i) ? 1 : 0,
                  transform: visibleCards.includes(i) ? "none" : "translateY(20px)",
                  transition: `background .2s, opacity .4s ease ${i * 0.06}s, transform .4s ease ${i * 0.06}s`,
                  borderRight: (i % 3 !== 2) ? `1px solid ${c.ruleSoft}` : "none",
                }}
              >
                <div style={{ fontFamily: c.fMono, fontSize: 10, color: c.ink4, letterSpacing: ".22em", fontWeight: 600 }}>
                  № {String(i + 1).padStart(2, "0")}
                </div>
                <h3 style={{
                  fontFamily: c.fSerif, fontSize: 20, fontWeight: 700,
                  margin: "12px 0 10px", color: c.ink, letterSpacing: "-.005em", lineHeight: 1.25,
                }}>
                  {lang === "fr" ? m.fr : m.k}
                </h3>
                <p style={{ fontFamily: c.fSans, fontSize: 13, color: c.ink2, lineHeight: 1.55, flex: 1 }}>
                  {m.d}
                </p>
                <div style={{
                  marginTop: 18, fontSize: 10.5, fontWeight: 700,
                  letterSpacing: ".18em", textTransform: "uppercase",
                  color: c.accent, display: "inline-flex", alignItems: "center", gap: 8,
                }}>
                  {lang === "fr" ? "Ouvrir" : "Open"}
                  <span className="module-cta-arrow"><Arrow /></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* =============== 4. AI PREVIEW =============== */
function AiPreview({ c, lang }) {
  const [active, setActive] = useState(0);
  const [panelRef, panelVisible] = useReveal({ threshold: 0.1 });

  const prompts = [
    { q: "Check my eligibility for DAAD",       qf: "Vérifier mon éligibilité DAAD" },
    { q: "Improve my motivation letter",          qf: "Améliorer ma lettre de motivation" },
    { q: "Simulate a scholarship interview",      qf: "Simuler un entretien de bourse" },
    { q: "What documents are missing?",           qf: "Quels documents manque-t-il ?" },
  ];

  const responses = [
    lang === "fr"
      ? "Votre profil satisfait 5 des 6 critères DAAD. Point faible : TOEFL (minimum 90). Je recommande un test d'ici juin."
      : "Your profile meets 5 of 6 DAAD criteria. Gap: TOEFL (min 90). I recommend a test by June.",
    lang === "fr"
      ? "Paragraphe 2 un peu générique. Suggestion : remplacez « passionate about research » par une anecdote concrète (mémoire, stage, publication)."
      : "Paragraph 2 feels generic. Suggestion: replace 'passionate about research' with a concrete anecdote (thesis, internship, paper).",
    lang === "fr"
      ? "Entretien prêt. 12 questions cibles, scoring sur clarté, structure, pertinence. Durée estimée 18 min."
      : "Interview ready. 12 target questions, scoring on clarity, structure, relevance. Estimated 18 min.",
    lang === "fr"
      ? "Manquant : 2 lettres de recommandation, certificat de langue, relevé de notes officiel (PDF signé)."
      : "Missing: 2 recommendation letters, language certificate, official transcript (signed PDF).",
  ];

  const { display, typing } = useTypewriter(responses[active], panelVisible, 20);

  const handleSelect = (i) => setActive(i);

  return (
    <>
      <style>{`
        @keyframes aiPulse {
          0%,100% { box-shadow: 0 0 0 4px rgba(0,102,179,.15); }
          50%      { box-shadow: 0 0 0 9px rgba(0,102,179,.04); }
        }
        .prompt-btn-item {
          width: 100%; border: none; border-bottom: 1px solid ${c.rule};
          background: transparent; padding: 20px 22px; text-align: left;
          cursor: pointer; display: flex; align-items: center; gap: 14px;
          transition: background .2s;
        }
        .prompt-btn-item:hover { background: ${c.surface}; }
        .prompt-btn-item.active { background: ${c.surface}; }
      `}</style>

      <section style={{ padding: "88px 40px", borderBottom: `1px solid ${c.rule}`, background: c.paper2 }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <SectionLabel num="04" title="AI" c={c} />
          <BigHeading c={c}>
            {lang === "fr"
              ? <>Un assistant qui <em style={{ color: c.accent, fontStyle: "italic" }}>comprend</em> votre candidature.</>
              : <>An assistant that <em style={{ color: c.accent, fontStyle: "italic" }}>understands</em> your application.</>}
          </BigHeading>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: 40, marginTop: 32 }}>

            {/* Prompt list */}
            <div style={{ borderTop: `1px solid ${c.rule}` }}>
              {prompts.map((p, i) => (
                <button
                  key={i}
                  className={`prompt-btn-item${active === i ? " active" : ""}`}
                  onClick={() => handleSelect(i)}
                >
                  <span style={{
                    fontFamily: c.fMono, fontSize: 10, letterSpacing: ".22em",
                    fontWeight: 600, width: 28, flexShrink: 0,
                    color: active === i ? c.accent : c.ink4,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{
                    fontFamily: c.fSerif, fontSize: 17, flex: 1, textAlign: "left",
                    color: active === i ? c.ink : c.ink2,
                    fontWeight: active === i ? 700 : 400,
                  }}>
                    {lang === "fr" ? p.qf : p.q}
                  </span>
                  <span style={{ color: active === i ? c.accent : c.ink4, display: "flex" }}>
                    <Arrow />
                  </span>
                </button>
              ))}
            </div>

            {/* Response panel */}
            <div
              ref={panelRef}
              style={{
                background: c.surface,
                border: `1px solid ${c.rule}`,
                padding: "28px 32px",
                minHeight: 320,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", background: c.accent,
                  animation: "aiPulse 2s infinite",
                }} />
                <span style={{
                  fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase",
                  color: c.ink3, fontWeight: 600,
                }}>
                  OppsTrack AI · {lang === "fr" ? "en ligne" : "online"}
                </span>
              </div>

              <div style={{
                marginTop: 22, paddingLeft: 16, borderLeft: `2px solid ${c.rule}`,
                color: c.ink3, fontSize: 13,
                fontFamily: c.fSerif, fontStyle: "italic",
              }}>
                « {lang === "fr" ? prompts[active].qf : prompts[active].q} »
              </div>

              <p style={{
                fontFamily: c.fSerif, fontSize: 21, color: c.ink,
                lineHeight: 1.5, marginTop: 22, letterSpacing: "-.005em",
                minHeight: 100,
              }}>
                {display}
                {typing && (
                  <span style={{
                    display: "inline-block", width: 2, height: "1em",
                    background: c.accent, marginLeft: 2, verticalAlign: "middle",
                    animation: "blink 1s step-end infinite",
                  }} />
                )}
              </p>

              <div style={{
                marginTop: 22, display: "flex", gap: 12,
                fontFamily: c.fMono, fontSize: 10.5, color: c.ink4,
                letterSpacing: ".18em", textTransform: "uppercase",
              }}>
                <span>Generated in 1.2s</span>
                <span style={{ color: c.ink4 }}>·</span>
                <span>Claude Haiku 4.5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </>
  );
}

/* =============== 5. STORIES =============== */
function Stories({ c, lang }) {
  const [sectionRef, sectionVisible] = useReveal({ threshold: 0.12 });
  const [visibleCards, setVisibleCards] = useState([]);
  const triggered = useRef(false);

  useEffect(() => {
    if (!sectionVisible || triggered.current) return;
    triggered.current = true;
    [0, 1, 2].forEach((i) => {
      setTimeout(() => {
        setVisibleCards((prev) => [...prev, i]);
      }, i * 190);
    });
  }, [sectionVisible]);

  const list = [
    {
      name: "Amira Belkacem", from: "Algiers → Berlin", prog: "DAAD — Helmut Schmidt",
      quote: lang === "fr"
        ? "J'ai passé deux ans à me perdre dans des dizaines d'onglets. Avec OppsTrack, j'ai envoyé trois candidatures — deux retenues. Le simulateur d'entretien a fait la différence."
        : "I spent two years lost in dozens of browser tabs. With OppsTrack I sent three applications — two accepted. The interview simulator made the difference.",
    },
    {
      name: "Youssef Haidari", from: "Rabat → London", prog: "Chevening",
      quote: lang === "fr"
        ? "L'IA a réécrit ma lettre de motivation trois fois. La troisième version m'a donné une voix que je reconnaissais enfin."
        : "The AI rewrote my motivation letter three times. The third version finally gave me a voice I recognized.",
    },
    {
      name: "Linh Pham", from: "Hanoi → Tokyo", prog: "MEXT Research",
      quote: lang === "fr"
        ? "La roadmap a tout changé. Je ne me réveillais plus avec une deadline oubliée à 3h du matin."
        : "The roadmap changed everything. No more waking up at 3am to a forgotten deadline.",
    },
  ];

  return (
    <section ref={sectionRef} style={{ padding: "88px 40px", borderBottom: `1px solid ${c.rule}`, background: c.paper }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SectionLabel num="05" title={lang === "fr" ? "Témoignages" : "Stories"} c={c} />
        <BigHeading c={c}>{lang === "fr" ? "Des parcours qui ont abouti." : "Journeys that made it."}</BigHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: `1px solid ${c.ink}` }}>
          {list.map((s, i) => (
            <figure
              key={i}
              style={{
                margin: 0,
                padding: "40px 32px",
                borderRight: i < 2 ? `1px solid ${c.rule}` : "none",
                display: "flex", flexDirection: "column",
                opacity: visibleCards.includes(i) ? 1 : 0,
                transform: visibleCards.includes(i) ? "none" : "translateY(22px)",
                transition: `opacity .65s ease ${i * 0.12}s, transform .65s ease ${i * 0.12}s`,
              }}
            >
              <span style={{
                fontFamily: c.fSerif, fontSize: 80, color: c.accent,
                lineHeight: .6, fontStyle: "italic", height: 40,
              }}>"</span>
              <blockquote style={{
                fontFamily: c.fSerif, fontSize: 20, color: c.ink,
                lineHeight: 1.45, margin: "8px 0 28px",
                letterSpacing: "-.005em", flex: 1,
              }}>
                {s.quote}
              </blockquote>
              <figcaption style={{ borderTop: `1px solid ${c.ruleSoft}`, paddingTop: 16 }}>
                <div style={{ fontFamily: c.fSerif, fontSize: 15, fontWeight: 700, color: c.ink }}>{s.name}</div>
                <div style={{
                  fontFamily: c.fMono, fontSize: 10.5, color: c.ink3,
                  marginTop: 4, letterSpacing: ".18em", textTransform: "uppercase",
                }}>
                  {s.from} · {s.prog}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =============== 6. SOURCES =============== */
function Sources({ c, lang }) {
  const [gridRef, gridVisible] = useReveal({ threshold: 0.12 });
  const [visibleCells, setVisibleCells] = useState([]);
  const triggered = useRef(false);

  useEffect(() => {
    if (!gridVisible || triggered.current) return;
    triggered.current = true;
    logos.forEach((_, i) => {
      setTimeout(() => {
        setVisibleCells((prev) => [...prev, i]);
      }, i * 70);
    });
  }, [gridVisible]);

  const logos = ["DAAD","Fulbright","Erasmus+","Chevening","MEXT","Eiffel","Commonwealth","Rhodes","Swiss Gov","Schwarzman"];

  return (
    <>
      <style>{`
        .source-cell {
          padding: 36px 18px; text-align: center;
          font-family: "Libre Caslon Text", Georgia, serif;
          font-size: 19px; font-weight: 700;
          color: ${c.ink3}; letter-spacing: -.01em;
          border-right: 1px solid ${c.ruleSoft};
          border-bottom: 1px solid ${c.ruleSoft};
          transition: color .22s, background .22s, transform .35s ease, opacity .35s ease;
          cursor: default;
        }
        .source-cell:hover { color: ${c.accent}; background: ${c.surface}; }
      `}</style>

      <section style={{ padding: "88px 40px", borderBottom: `1px solid ${c.rule}`, background: c.paper2 }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <SectionLabel num="06" title={lang === "fr" ? "Sources" : "Sources"} c={c} />
          <BigHeading c={c}>
            {lang === "fr"
              ? <>Des opportunités vérifiées, <em style={{ color: c.accent, fontStyle: "italic" }}>à la source</em>.</>
              : <>Verified opportunities, <em style={{ color: c.accent, fontStyle: "italic" }}>at the source</em>.</>}
          </BigHeading>

          <div
            ref={gridRef}
            style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", borderTop: `1px solid ${c.rule}` }}
          >
            {logos.map((name, i) => (
              <div
                key={name}
                className="source-cell"
                style={{
                  opacity: visibleCells.includes(i) ? 1 : 0,
                  transform: visibleCells.includes(i) ? "scale(1)" : "scale(0.88)",
                  borderRight: (i + 1) % 5 !== 0 ? `1px solid ${c.ruleSoft}` : "none",
                  borderBottom: i < 5 ? `1px solid ${c.ruleSoft}` : "none",
                }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* =============== 7. FINAL CTA =============== */
function FinalCta({ c, lang, navigate }) {
  return (
    <>
      <style>{`
        .cta-btn-primary {
          padding: 18px 32px; font-size: 11px; font-weight: 700;
          letter-spacing: .22em; text-transform: uppercase;
          background: ${c.accent}; color: #fff; border: none; cursor: pointer;
          font-family: ${c.fSans}; display: inline-flex; align-items: center; gap: 12px;
          transition: background .2s, transform .15s;
        }
        .cta-btn-primary:hover { background: ${lang === "dark" ? "#3a8bc4" : "#004f8a"}; transform: translateY(-2px); }
        .cta-btn-ghost2 {
          padding: 18px 32px; font-size: 11px; font-weight: 700;
          letter-spacing: .22em; text-transform: uppercase;
          background: transparent; color: #f2efe7;
          border: 1px solid rgba(250,248,243,.35); cursor: pointer;
          font-family: ${c.fSans}; transition: background .2s;
        }
        .cta-btn-ghost2:hover { background: rgba(242,239,231,.08); }
      `}</style>

      <section style={{ padding: "120px 40px", background: c.ink, color: c.paper }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            fontFamily: c.fMono, fontSize: 11, color: c.accent,
            letterSpacing: ".28em", textTransform: "uppercase", fontWeight: 600,
          }}>
            § {lang === "fr" ? "Commencez" : "Begin"}
          </div>
          <h2 style={{
            fontFamily: c.fSerif,
            fontSize: "clamp(38px, 5.6vw, 72px)",
            fontWeight: 700, lineHeight: 1.05,
            letterSpacing: "-.02em", margin: "24px 0 28px",
          }}>
            {lang === "fr"
              ? <>{`Construisez votre `}<em style={{ color: c.accent, fontStyle: "italic" }}>roadmap</em> aujourd'hui.</>
              : <>Start building your <em style={{ color: c.accent, fontStyle: "italic" }}>scholarship roadmap</em> today.</>}
          </h2>
          <p style={{
            fontFamily: c.fSans, fontSize: 17,
            color: "rgba(250,248,243,.72)",
            maxWidth: 600, margin: "0 auto 42px", lineHeight: 1.6,
          }}>
            {lang === "fr"
              ? "Inscription gratuite. Aucune carte bancaire. Commencez votre premier dossier en moins de cinq minutes."
              : "Free sign-up. No credit card. Start your first application in under five minutes."}
          </p>
          <div style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button className="cta-btn-primary" onClick={() => navigate("/signup")}>
              {lang === "fr" ? "Commencer gratuitement" : "Get started free"} <Arrow />
            </button>
            <button className="cta-btn-ghost2">
              {lang === "fr" ? "Parler à l'équipe" : "Talk to the team"}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

/* =============== PAGE ROOT =============== */
export default function HomePage() {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);
  const navigate = useNavigate();

  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, paddingTop: 0 }}>
      <Hero      c={c} lang={lang} navigate={navigate} />
      <Funnel    c={c} lang={lang} />
      <Modules   c={c} lang={lang} />
      <AiPreview c={c} lang={lang} />
      <Stories   c={c} lang={lang} />
      <Sources   c={c} lang={lang} />
      <FinalCta  c={c} lang={lang} navigate={navigate} />
    </main>
  );
}