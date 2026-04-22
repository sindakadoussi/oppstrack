// app/page.jsx
// POLICES : 2 polices uniquement
//   fSerif → "Playfair Display"  (titres, headings, noms)
//   fSans  → "DM Sans"           (corps, UI, labels, chiffres, mono-like)
//
// FIX HERO : le hero démarre à top:0 (position:fixed navbar en overlay),
// donc l'image occupe 100vh depuis le tout début de la page.
// Le contenu du hero est décalé vers le bas par un paddingTop tenant compte
// de la hauteur de la navbar (110px strip+main) via une variable CSS.

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useT } from "../i18n";
import { useTheme } from "../components/Navbar";
import { useNavigate } from "react-router-dom";

/* =============== TOKENS =============== */
// Deux polices uniquement :
//   fSerif → Playfair Display  (titres, noms)
//   fSans  → DM Sans           (tout le reste)
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
  fSerif: `"Playfair Display", "Times New Roman", Georgia, serif`,
  fSans:  `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
});

/* Hauteur totale de la navbar (strip 34px + main 76px) */
const NAV_H = 110;

/* =============== HOOKS =============== */
function useReveal(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        obs.unobserve(entry.target);
      }
    }, { threshold: 0.15, ...options });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

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

/* =============== SHARED COMPONENTS =============== */
function Arrow({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function SectionLabel({ num, title, c }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 4 }}>
      <span style={{ fontFamily: c.fSans, fontSize: 11, color: c.accent, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase" }}>§ {num}</span>
      <span style={{ fontFamily: c.fSans, fontSize: 11, color: c.ink3, fontWeight: 600, letterSpacing: ".22em", textTransform: "uppercase" }}>{title}</span>
    </div>
  );
}

function BigHeading({ children, c, style = {} }) {
  return (
    <h2 style={{ fontFamily: c.fSerif, fontSize: "clamp(32px, 4vw, 54px)", fontWeight: 700, letterSpacing: "-.015em", lineHeight: 1.05, color: c.ink, margin: "16px 0 32px", ...style }}>
      {children}
    </h2>
  );
}

/* =============== SECTION 1: HERO =============== */
function Hero({ c, lang, navigate }) {
  const [heroVisible, setHeroVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState([false, false, false]);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 150);
    [600, 850, 1100].forEach((delay, i) => {
      setTimeout(() => setCardsVisible(prev => { const next = [...prev]; next[i] = true; return next; }), delay);
    });
  }, []);

  const cardStyle = (visible, extra = {}) => ({
    position: "absolute",
    background: "rgba(18,16,10,.85)",
    backdropFilter: "blur(10px)",
    padding: "14px 16px",
    color: "#f2efe7",
    fontFamily: c.fSans,
    boxShadow: "0 16px 48px rgba(0,0,0,.38)",
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(22px)",
    transition: "opacity .7s ease, transform .7s ease",
    ...extra,
  });

  const scholarships = [
    { pays: "Germany · Bonn", nom: "DAAD — Helmut Schmidt Programme", match: 94 },
    { pays: "UK · London", nom: "Chevening Scholarship", deadline: "21 · APR · 2026", urgent: true },
    { pays: "France · Paris", nom: "Eiffel Excellence", match: 87 },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

        /* ── Hero image : couvre toute la section depuis top:0 ── */
        .hero-bg-img {
          position: absolute;
          inset: 0;
          background-image: url('/ceremonie.jpg');
          background-size: cover;
          background-position: center top;   /* ancrage haut pour ne pas couper le sujet */
          filter: brightness(.56);
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

        @keyframes blink { 50% { opacity: 0; } }
      `}</style>

      {/*
        ── FIX HERO ──
        La section démarre à top:0 et occupe 100vh.
        La navbar est fixed par-dessus (z-index:1000).
        On ne met AUCUN margin-top ni padding-top sur la section elle-même :
        le gradient de fondu en bas suffit à la transition.
        Le contenu interne utilise paddingTop: NAV_H + espace visuel.
      */}
      <section style={{
        position: "relative",
        height: "100vh",
        minHeight: 600,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        /* Pas de marginTop : la navbar fixe passe par-dessus */
      }}>
        {/* Image de fond — remplit toute la section y compris sous la navbar */}
        <div className="hero-bg-img" />

        {/* Dégradé bas vers paper pour transition fluide avec la section suivante */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(to bottom, rgba(20,15,5,.55) 0%, rgba(20,15,5,.7) 60%, ${c.paper} 100%)`,
        }} />

        {/* Contenu : décalé vers le bas pour passer sous la navbar */}
        <div style={{
          position: "relative", zIndex: 2,
          maxWidth: 1440, margin: "0 auto",
          /* paddingTop = hauteur navbar + marge visuelle */
          padding: `${NAV_H + 80}px 48px 120px`,
          width: "100%",
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "none" : "translateY(32px)",
          transition: "opacity .9s ease .2s, transform .9s ease .2s",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 64, alignItems: "center" }}>
            <div>
              <h1 style={{
                fontFamily: c.fSerif,
                fontSize: "clamp(46px, 6vw, 56px)",
                fontWeight: 140, lineHeight: 1.03, letterSpacing: "-.022em",
                color: "#f2efe7", margin: 0,
              }}>
                {lang === "fr" ? (
                  <>Trouvez, préparez et obtenez votre bourse internationale — <em style={{ color: c.accent, fontStyle: "italic" }}>avec l'IA</em>.</>
                ) : (
                  <>Find, prepare and secure your international scholarship — <em style={{ color: c.accent, fontStyle: "italic" }}>with AI</em>.</>
                )}
              </h1>
              <p style={{
                fontFamily: c.fSans, fontSize: 17, lineHeight: 1.65,
                color: "rgba(242,239,231,.78)", maxWidth: 580, margin: "28px 0 0",
              }}>
                {lang === "fr"
                  ? "OppsTrack centralise les bourses entièrement financées dans le monde, analyse votre profil et vous guide jusqu'à la candidature."
                  : "OppsTrack centralizes fully funded scholarships worldwide, analyzes your profile and guides you through your application."}
              </p>
              <div style={{ display: "flex", gap: 14, marginTop: 38, flexWrap: "wrap" }}>
                <button className="hero-btn-primary" onClick={() => navigate("/signup")}>
                  {lang === "fr" ? "Commencer gratuitement" : "Get started free"} <Arrow />
                </button>
                <button className="hero-btn-ghost" onClick={() => navigate("/chat")}>
                  {lang === "fr" ? "Tester mon éligibilité" : "Check my eligibility"}
                </button>
              </div>
            </div>

            <div style={{ position: "relative", height: 480 }}>
              <div style={cardStyle(cardsVisible[0], { top: 0, left: 0, width: 264 })}>
                <div style={{ fontSize: 9.5, color: "rgba(242,239,231,.42)", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 600 }}>{scholarships[0].pays}</div>
                <div style={{ fontFamily: c.fSerif, fontSize: 17, fontWeight: 700, marginTop: 6 }}>{scholarships[0].nom}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
                  <span style={{ fontSize: 9.5, color: "rgba(242,239,231,.42)", fontFamily: c.fSans }}>Match</span>
                  <span style={{ fontFamily: c.fSans, color: c.accent, fontWeight: 700, fontSize: 13 }}>{scholarships[0].match}%</span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,.1)", marginTop: 4, position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, width: `${scholarships[0].match}%`, background: c.accent }} />
                </div>
              </div>

              <div style={cardStyle(cardsVisible[1], { top: 80, right: 0, width: 240, borderLeft: `3px solid ${c.danger}` })}>
                <div style={{ fontSize: 9.5, color: c.danger, letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 700 }}>Deadline · today</div>
                <div style={{ fontFamily: c.fSerif, fontSize: 16, fontWeight: 700, marginTop: 4 }}>{scholarships[1].nom}</div>
                <div style={{ fontFamily: c.fSans, fontSize: 11, color: "rgba(242,239,231,.42)", marginTop: 6, letterSpacing: ".1em" }}>{scholarships[1].deadline}</div>
              </div>

              <div style={cardStyle(cardsVisible[2], { bottom: 0, left: 20, width: 244 })}>
                <div style={{ fontSize: 9.5, color: "rgba(242,239,231,.42)", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 600 }}>France · Paris</div>
                <div style={{ fontFamily: c.fSerif, fontSize: 16, fontWeight: 700, marginTop: 6 }}>{scholarships[2].nom}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                  <span style={{ fontSize: 9.5, color: "rgba(242,239,231,.42)", fontFamily: c.fSans }}>Match</span>
                  <span style={{ fontFamily: c.fSans, color: c.accent, fontWeight: 700, fontSize: 13 }}>{scholarships[2].match}%</span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,.1)", marginTop: 4 }}>
                  <div style={{ width: `${scholarships[2].match}%`, height: 3, background: c.accent }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* =============== SECTION 2: COMMENT ÇA MARCHE =============== */
function HowItWorks({ c, lang }) {
  const [sectionRef, sectionVisible] = useReveal({ threshold: 0.08 });
  const [stepsVisible, setStepsVisible] = useState([false, false, false]);
  const triggered = useRef(false);

  useEffect(() => {
    if (!sectionVisible || triggered.current) return;
    triggered.current = true;
    [0, 1, 2].forEach((i) => setTimeout(() => setStepsVisible(prev => { const next = [...prev]; next[i] = true; return next; }), 200 + i * 220));
  }, [sectionVisible]);

  const steps = [
    { num: "01", title: lang === "fr" ? "Trouver" : "Find", subtitle: lang === "fr" ? "Des bourses adaptées à votre profil" : "Scholarships matched to your profile", desc: lang === "fr" ? "Notre IA analyse votre parcours et vous recommande les opportunités les plus pertinentes." : "Our AI analyzes your background and recommends the most relevant opportunities." },
    { num: "02", title: lang === "fr" ? "Préparer" : "Prepare", subtitle: lang === "fr" ? "CV, lettres, essais générés par IA" : "CV, letters, essays generated by AI", desc: lang === "fr" ? "Générez et optimisez vos documents de candidature avec notre assistant intelligent." : "Generate and optimize your application documents with our intelligent assistant." },
    { num: "03", title: lang === "fr" ? "Réussir" : "Succeed", subtitle: lang === "fr" ? "Simulation + suivi jusqu'à la soumission" : "Simulation + tracking until submission", desc: lang === "fr" ? "Entraînez-vous aux entretiens et suivez chaque étape jusqu'à l'envoi." : "Practice interviews and track every step until submission." },
  ];

  return (
    <section ref={sectionRef} style={{ padding: "96px 40px", borderBottom: `1px solid ${c.rule}`, background: c.paper }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", textAlign: "center" }}>
        <SectionLabel num="01" title={lang === "fr" ? "Comment ça marche" : "How it works"} c={c} />
        <BigHeading c={c} style={{ textAlign: "center" }}>
          {lang === "fr" ? <>Trois étapes vers votre <em style={{ color: c.accent, fontStyle: "italic" }}>bourse idéale</em>.</> : <>Three steps to your <em style={{ color: c.accent, fontStyle: "italic" }}>ideal scholarship</em>.</>}
        </BigHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48, marginTop: 32 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ opacity: stepsVisible[i] ? 1 : 0, transform: stepsVisible[i] ? "translateY(0)" : "translateY(30px)", transition: `opacity .6s ease ${i * 0.15}s, transform .6s ease ${i * 0.15}s` }}>
              <div style={{ width: 80, height: 80, margin: "0 auto", borderRadius: "50%", background: c.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: c.fSans, fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 24 }}>{step.num}</div>
              <h3 style={{ fontFamily: c.fSerif, fontSize: 22, fontWeight: 700, color: c.ink, marginBottom: 12 }}>{step.title}</h3>
              <p style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 600, color: c.accent, marginBottom: 12 }}>{step.subtitle}</p>
              <p style={{ fontFamily: c.fSans, fontSize: 14, color: c.ink2, lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =============== SECTION 3: ASSISTANT IA =============== */
function AiAssistant({ c, lang }) {
  const [active, setActive] = useState(0);
  const [panelRef, panelVisible] = useReveal({ threshold: 0.1 });

  const prompts = [
    { q: "Suis-je éligible au DAAD avec mon profil ?", qe: "Am I eligible for DAAD with my profile?" },
    { q: "Comment améliorer ma lettre de motivation ?", qe: "How to improve my motivation letter?" },
    { q: "Quels documents me manquent ?", qe: "What documents am I missing?" },
  ];

  const responses = [
    lang === "fr" ? "Votre profil satisfait 5 des 6 critères DAAD. Il vous manque un score TOEFL (minimum 90). Je recommande de passer le test d'ici juin." : "Your profile meets 5 of 6 DAAD criteria. Missing: TOEFL score (min 90). I recommend taking the test by June.",
    lang === "fr" ? "Votre deuxième paragraphe est trop générique. Suggestion : remplacez « passionné par la recherche » par une anecdote concrète (mémoire, stage, publication)." : "Your second paragraph is too generic. Suggestion: replace 'passionate about research' with a concrete anecdote (thesis, internship, publication).",
    lang === "fr" ? "Documents manquants : 2 lettres de recommandation, certificat de langue (TOEFL/IELTS), relevé de notes officiel signé." : "Missing documents: 2 recommendation letters, language certificate (TOEFL/IELTS), signed official transcript.",
  ];

  const { display, typing } = useTypewriter(responses[active], panelVisible, 20);

  return (
    <section style={{ padding: "88px 40px", borderBottom: `1px solid ${c.rule}`, background: c.paper2 }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SectionLabel num="02" title={lang === "fr" ? "Assistant IA" : "AI Assistant"} c={c} />
        <BigHeading c={c}>
          {lang === "fr" ? <>Votre assistant de candidature <em style={{ color: c.accent, fontStyle: "italic" }}>intelligent</em>.</> : <>Your <em style={{ color: c.accent, fontStyle: "italic" }}>intelligent</em> application assistant.</>}
        </BigHeading>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: 40, marginTop: 32 }}>
          <div style={{ borderTop: `1px solid ${c.rule}` }}>
            {prompts.map((p, i) => (
              <button key={i} onClick={() => setActive(i)} style={{ width: "100%", border: "none", borderBottom: `1px solid ${c.rule}`, background: active === i ? c.surface : "transparent", padding: "20px 22px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "background .2s" }}>
                <span style={{ fontFamily: c.fSans, fontSize: 10, letterSpacing: ".22em", fontWeight: 700, color: active === i ? c.accent : c.ink4 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontFamily: c.fSerif, fontSize: 16, flex: 1, color: active === i ? c.ink : c.ink2, fontWeight: active === i ? 700 : 400 }}>{lang === "fr" ? p.q : p.qe}</span>
                <span style={{ color: active === i ? c.accent : c.ink4 }}><Arrow /></span>
              </button>
            ))}
          </div>

          <div ref={panelRef} style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: "28px 32px", minHeight: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.accent }} />
              <span style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: c.ink3, fontWeight: 600, fontFamily: c.fSans }}>OppsTrack AI · {lang === "fr" ? "en ligne" : "online"}</span>
            </div>
            <div style={{ marginBottom: 20, paddingLeft: 16, borderLeft: `2px solid ${c.rule}`, color: c.ink3, fontSize: 13, fontFamily: c.fSerif, fontStyle: "italic" }}>« {lang === "fr" ? prompts[active].q : prompts[active].qe} »</div>
            <p style={{ fontFamily: c.fSerif, fontSize: 20, color: c.ink, lineHeight: 1.5, minHeight: 100 }}>
              {display}{typing && <span style={{ display: "inline-block", width: 2, height: "1em", background: c.accent, marginLeft: 2, verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =============== SECTION 4: BOURSES RECOMMANDÉES =============== */
function RecommendedScholarships({ c, lang, navigate }) {
  const [sectionRef, sectionVisible] = useReveal({ threshold: 0.1 });
  const [cardsVisible, setCardsVisible] = useState([false, false, false, false]);

  useEffect(() => {
    if (sectionVisible) {
      [0, 1, 2, 3].forEach((i) => setTimeout(() => setCardsVisible(prev => { const next = [...prev]; next[i] = true; return next; }), i * 120));
    }
  }, [sectionVisible]);

  const scholarships = [
    { pays: "Germany · Bonn", nom: "DAAD — Helmut Schmidt Programme", match: 94, deadline: "15 · JUN · 2026", type: "Fully Funded" },
    { pays: "UK · London", nom: "Chevening Scholarship", match: 88, deadline: "21 · APR · 2026", type: "Fully Funded", urgent: true },
    { pays: "France · Paris", nom: "Eiffel Excellence", match: 87, deadline: "10 · MAY · 2026", type: "Fully Funded" },
    { pays: "Japan · Tokyo", nom: "MEXT Research", match: 82, deadline: "30 · MAY · 2026", type: "Fully Funded" },
  ];

  return (
    <section ref={sectionRef} style={{ padding: "88px 40px", borderBottom: `1px solid ${c.rule}`, background: c.paper }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SectionLabel num="03" title={lang === "fr" ? "Bourses recommandées" : "Recommended scholarships"} c={c} />
        <BigHeading c={c}>{lang === "fr" ? <>Bourses adaptées à <em style={{ color: c.accent, fontStyle: "italic" }}>votre profil</em>.</> : <>Scholarships matched to <em style={{ color: c.accent, fontStyle: "italic" }}>your profile</em>.</>}</BigHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {scholarships.map((s, i) => (
            <div key={i} style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: "20px", transition: "all .3s ease", opacity: cardsVisible[i] ? 1 : 0, transform: cardsVisible[i] ? "translateY(0)" : "translateY(30px)", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ fontSize: 10, color: c.ink3, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8, fontFamily: c.fSans }}>{s.pays}</div>
              <div style={{ fontFamily: c.fSerif, fontSize: 16, fontWeight: 700, color: c.ink, marginBottom: 12 }}>{s.nom}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: c.ink3, fontFamily: c.fSans }}>Match</span>
                <span style={{ fontFamily: c.fSans, fontSize: 14, fontWeight: 700, color: c.accent }}>{s.match}%</span>
              </div>
              <div style={{ height: 3, background: c.rule, marginBottom: 16, position: "relative" }}>
                <div style={{ width: `${s.match}%`, height: 3, background: c.accent }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 9.5, color: s.urgent ? c.danger : c.ink3, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, fontFamily: c.fSans }}>{s.deadline}</span>
                <span style={{ fontSize: 9.5, color: c.accent, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, fontFamily: c.fSans }}>{s.type}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 48 }}>
          <button onClick={() => navigate("/bourses")}
            style={{ padding: "12px 28px", background: "transparent", border: `1px solid ${c.accent}`, color: c.accent, fontFamily: c.fSans, fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", cursor: "pointer", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = c.accent; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.accent; }}>
            {lang === "fr" ? "Voir toutes les bourses" : "View all scholarships"} <Arrow />
          </button>
        </div>
      </div>
    </section>
  );
}

/* =============== SECTION 5: POURQUOI OPSTRACK =============== */
function WhyOppsTrack({ c, lang }) {
  const [sectionRef, sectionVisible] = useReveal({ threshold: 0.1 });
  const [featuresVisible, setFeaturesVisible] = useState([false, false, false, false]);

  useEffect(() => {
    if (sectionVisible) {
      [0, 1, 2, 3].forEach((i) => setTimeout(() => setFeaturesVisible(prev => { const next = [...prev]; next[i] = true; return next; }), i * 150));
    }
  }, [sectionVisible]);

  const features = [
    { title: lang === "fr" ? "Découverte intelligente" : "Smart Discovery", desc: lang === "fr" ? "Algorithme de matching précis pour trouver les bourses qui vous correspondent vraiment." : "Precise matching algorithm to find scholarships that truly fit you." },
    { title: lang === "fr" ? "IA de rédaction" : "AI Writing Assistant", desc: lang === "fr" ? "Générez et optimisez CV, lettres de motivation et essais académiques." : "Generate and optimize CVs, motivation letters and academic essays." },
    { title: lang === "fr" ? "Simulation d'entretien" : "Interview Simulator", desc: lang === "fr" ? "Entraînez-vous avec des questions spécifiques à chaque programme." : "Practice with program-specific interview questions." },
    { title: lang === "fr" ? "Suivi des deadlines" : "Deadline Tracking", desc: lang === "fr" ? "Ne manquez plus aucune date importante avec nos alertes intelligentes." : "Never miss important dates with our smart alerts." },
  ];

  return (
    <section ref={sectionRef} style={{ padding: "88px 40px", borderBottom: `1px solid ${c.rule}`, background: c.paper2 }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", textAlign: "center" }}>
        <SectionLabel num="04" title={lang === "fr" ? "Pourquoi OppsTrack" : "Why OppsTrack"} c={c} />
        <BigHeading c={c} style={{ textAlign: "center" }}>{lang === "fr" ? <>Tout ce dont vous avez besoin, <em style={{ color: c.accent, fontStyle: "italic" }}>au même endroit</em>.</> : <>Everything you need, <em style={{ color: c.accent, fontStyle: "italic" }}>in one place</em>.</>}</BigHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, marginTop: 32 }}>
          {features.map((f, i) => (
            <div key={i} style={{ opacity: featuresVisible[i] ? 1 : 0, transform: featuresVisible[i] ? "translateY(0)" : "translateY(20px)", transition: `opacity .5s ease ${i * 0.1}s, transform .5s ease ${i * 0.1}s` }}>
              <div style={{ width: 48, height: 48, margin: "0 auto 20px", borderRadius: "50%", background: c.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontFamily: c.fSans, fontSize: 18 }}>{String(i + 1).padStart(2, "0")}</div>
              <h3 style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, color: c.ink, marginBottom: 12 }}>{f.title}</h3>
              <p style={{ fontFamily: c.fSans, fontSize: 14, color: c.ink2, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =============== SECTION 6: TÉMOIGNAGES =============== */
function Testimonials({ c, lang }) {
  const [sectionRef, sectionVisible] = useReveal({ threshold: 0.12 });
  const [visibleCards, setVisibleCards] = useState([]);

  useEffect(() => {
    if (sectionVisible) {
      [0, 1, 2].forEach((i) => setTimeout(() => setVisibleCards(prev => [...prev, i]), i * 190));
    }
  }, [sectionVisible]);

  const testimonials = [
    { name: "Amira Belkacem", from: "Algiers → Berlin", prog: "DAAD — Helmut Schmidt", quote: lang === "fr" ? "Deux candidatures envoyées, deux acceptées. L'IA m'a sauvé des mois de recherches." : "Two applications sent, two accepted. The AI saved me months of research.", highlight: "Deux candidatures envoyées, deux acceptées." },
    { name: "Youssef Haidari", from: "Rabat → London", prog: "Chevening", quote: lang === "fr" ? "La roadmap a tout changé. Je ne me réveillais plus avec une deadline oubliée." : "The roadmap changed everything. No more waking up to forgotten deadlines.", highlight: "La roadmap a tout changé." },
    { name: "Linh Pham", from: "Hanoi → Tokyo", prog: "MEXT Research", quote: lang === "fr" ? "Le simulateur d'entretien m'a préparé à des questions que je n'aurais jamais imaginées." : "The interview simulator prepared me for questions I never would have imagined.", highlight: "Le simulateur d'entretien a fait la différence." },
  ];

  return (
    <section ref={sectionRef} style={{ padding: "88px 40px", borderBottom: `1px solid ${c.rule}`, background: c.paper }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SectionLabel num="05" title={lang === "fr" ? "Témoignages" : "Testimonials"} c={c} />
        <BigHeading c={c}>{lang === "fr" ? "Ils ont réussi grâce à OppsTrack." : "They succeeded with OppsTrack."}</BigHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
          {testimonials.map((t, i) => (
            <div key={i} style={{ background: c.surface, border: `1px solid ${c.rule}`, padding: "32px", opacity: visibleCards.includes(i) ? 1 : 0, transform: visibleCards.includes(i) ? "translateY(0)" : "translateY(30px)", transition: `opacity .6s ease ${i * 0.12}s, transform .6s ease ${i * 0.12}s` }}>
              <span style={{ fontFamily: c.fSerif, fontSize: 60, color: c.accent, lineHeight: 0.6, fontStyle: "italic" }}>"</span>
              <p style={{ fontFamily: c.fSerif, fontSize: 18, color: c.ink, lineHeight: 1.5, margin: "16px 0 24px" }}><strong style={{ color: c.accent }}>"{t.highlight}"</strong> {t.quote.replace(t.highlight, "")}</p>
              <div style={{ borderTop: `1px solid ${c.ruleSoft}`, paddingTop: 16 }}>
                <div style={{ fontFamily: c.fSerif, fontSize: 15, fontWeight: 700, color: c.ink }}>{t.name}</div>
                <div style={{ fontFamily: c.fSans, fontSize: 10.5, color: c.ink3, marginTop: 4, letterSpacing: ".18em", textTransform: "uppercase" }}>{t.from} · {t.prog}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =============== SECTION 7: SOURCES =============== */
function Sources({ c, lang }) {
  const [gridRef, gridVisible] = useReveal({ threshold: 0.12 });
  const [visibleCells, setVisibleCells] = useState([]);

  useEffect(() => {
    if (gridVisible) {
      const sources = ["DAAD", "Fulbright", "Erasmus+", "Chevening", "MEXT", "Eiffel", "Commonwealth", "Rhodes"];
      sources.forEach((_, i) => setTimeout(() => setVisibleCells(prev => [...prev, i]), i * 80));
    }
  }, [gridVisible]);

  const sources = ["DAAD", "Fulbright", "Erasmus+", "Chevening", "MEXT", "Eiffel", "Commonwealth", "Rhodes"];

  return (
    <section ref={gridRef} style={{ padding: "88px 40px", borderBottom: `1px solid ${c.rule}`, background: c.paper2 }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", textAlign: "center" }}>
        <SectionLabel num="06" title={lang === "fr" ? "Sources" : "Sources"} c={c} />
        <BigHeading c={c} style={{ textAlign: "center" }}>{lang === "fr" ? <>Des bourses officielles et <em style={{ color: c.accent, fontStyle: "italic" }}>vérifiées</em>.</> : <>Official and <em style={{ color: c.accent, fontStyle: "italic" }}>verified</em> scholarships.</>}</BigHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: c.rule, border: `1px solid ${c.rule}` }}>
          {sources.map((name, i) => (
            <div key={name} style={{ background: c.paper, padding: "32px 20px", textAlign: "center", opacity: visibleCells.includes(i) ? 1 : 0, transform: visibleCells.includes(i) ? "scale(1)" : "scale(0.9)", transition: `opacity .4s ease ${i * 0.04}s, transform .4s ease ${i * 0.04}s` }}>
              <span style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, color: c.ink3, letterSpacing: "-.01em" }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =============== SECTION 8: CTA FINAL =============== */
function FinalCta({ c, lang, navigate }) {
  return (
    <section style={{ padding: "120px 40px", background: c.ink, color: c.paper, textAlign: "center" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontFamily: c.fSerif, fontSize: "clamp(38px, 5.6vw, 72px)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-.02em", marginBottom: 24 }}>
          {lang === "fr" ? <>Votre prochaine bourse <em style={{ color: c.accent, fontStyle: "italic" }}>commence ici</em>.</> : <>Your next scholarship <em style={{ color: c.accent, fontStyle: "italic" }}>starts here</em>.</>}
        </h2>
        <p style={{ fontFamily: c.fSans, fontSize: 17, color: "rgba(250,248,243,.72)", maxWidth: 600, margin: "0 auto 42px", lineHeight: 1.6 }}>
          {lang === "fr" ? "Inscription gratuite. Commencez votre premier dossier en moins de cinq minutes." : "Free sign-up. Start your first application in under five minutes."}
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/signup")}
            style={{ padding: "16px 32px", background: c.accent, color: "#fff", border: "none", fontFamily: c.fSans, fontSize: 11, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", cursor: "pointer", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = c.accentInk; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = c.accent; e.currentTarget.style.transform = "translateY(0)"; }}>
            {lang === "fr" ? "Créer mon profil" : "Create my profile"} <Arrow />
          </button>
          <button onClick={() => navigate("/chat")}
            style={{ padding: "16px 32px", background: "transparent", border: `1px solid rgba(250,248,243,.35)`, color: c.paper, fontFamily: c.fSans, fontSize: 11, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", cursor: "pointer", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(242,239,231,.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            {lang === "fr" ? "Essayer l'IA" : "Try the AI"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* =============== PAGE PRINCIPALE =============== */
export default function HomePage() {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);
  const navigate = useNavigate();

  return (
    /*
      Pas de paddingTop sur <main> :
      le hero section couvre toute la hauteur depuis top:0,
      et la navbar fixed flotte par-dessus.
      Le paddingTop du contenu hero (NAV_H + espace) gère l'espacement interne.
    */
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans }}>
      <Hero c={c} lang={lang} navigate={navigate} />
      <HowItWorks c={c} lang={lang} />
      <AiAssistant c={c} lang={lang} />
      <RecommendedScholarships c={c} lang={lang} navigate={navigate} />
      <WhyOppsTrack c={c} lang={lang} />
      <Testimonials c={c} lang={lang} />
      <Sources c={c} lang={lang} />
      <FinalCta c={c} lang={lang} navigate={navigate} />
    </main>
  );
}