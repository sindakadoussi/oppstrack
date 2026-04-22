// src/pages/GuestPage.jsx — Version immersive OppsTrack ✨
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useT } from '../i18n';

const QUIZ = {
  fr: [
    { id: 'level', q: "Quel est ton niveau d'études ?", sub: 'On va trouver les bourses qui te correspondent vraiment', opts: [{ label: 'Licence', icon: '📘', val: 'licence' }, { label: 'Master', icon: '📗', val: 'master' }, { label: 'Doctorat', icon: '📙', val: 'doctorat' }, { label: 'Bac', icon: '📓', val: 'bac' }] },
    { id: 'field', q: "Ton domaine d'études ?", sub: 'Chaque domaine a ses opportunités cachées', opts: [{ label: 'Informatique', icon: '💻', val: 'informatique' }, { label: 'Ingénierie', icon: '⚙️', val: 'ingenierie' }, { label: 'Médecine', icon: '🩺', val: 'medecine' }, { label: 'Commerce', icon: '📊', val: 'commerce' }, { label: 'Sciences', icon: '🔬', val: 'sciences' }, { label: 'Droit', icon: '⚖️', val: 'droit' }] },
    { id: 'country', q: 'Où rêves-tu d\'étudier ?', sub: 'Le monde entier s\'ouvre à toi', opts: [{ label: 'France', icon: '🇫🇷', val: 'france' }, { label: 'Allemagne', icon: '🇩🇪', val: 'allemagne' }, { label: 'Canada', icon: '🇨🇦', val: 'canada' }, { label: 'Suisse', icon: '🇨🇭', val: 'suisse' }, { label: 'USA', icon: '🇺🇸', val: 'usa' }, { label: 'Partout', icon: '🌍', val: 'international' }] },
  ],
  en: [
    { id: 'level', q: "What's your study level?", sub: "We'll find scholarships that truly match you", opts: [{ label: 'Bachelor', icon: '📘', val: 'licence' }, { label: 'Master', icon: '📗', val: 'master' }, { label: 'PhD', icon: '📙', val: 'doctorat' }, { label: 'High School', icon: '📓', val: 'bac' }] },
    { id: 'field', q: 'Your field of study?', sub: 'Every field has its hidden opportunities', opts: [{ label: 'CS', icon: '💻', val: 'informatique' }, { label: 'Engineering', icon: '⚙️', val: 'ingenierie' }, { label: 'Medicine', icon: '🩺', val: 'medecine' }, { label: 'Business', icon: '📊', val: 'commerce' }, { label: 'Sciences', icon: '🔬', val: 'sciences' }, { label: 'Law', icon: '⚖️', val: 'droit' }] },
    { id: 'country', q: 'Where do you dream to study?', sub: 'The whole world opens up to you', opts: [{ label: 'France', icon: '🇫🇷', val: 'france' }, { label: 'Germany', icon: '🇩🇪', val: 'allemagne' }, { label: 'Canada', icon: '🇨🇦', val: 'canada' }, { label: 'Switzerland', icon: '🇨🇭', val: 'suisse' }, { label: 'USA', icon: '🇺🇸', val: 'usa' }, { label: 'Anywhere', icon: '🌍', val: 'international' }] },
  ],
};

function ParticleField() {
  const particles = useRef(Array.from({ length: 35 }, (_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, size: 2 + Math.random() * 4, opacity: 0.08 + Math.random() * 0.2, dur: 6 + Math.random() * 8, delay: Math.random() * 8 })));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {particles.current.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: '50%', background: `rgba(245, 166, 35, ${p.opacity})`, animation: `gp-float ${p.dur}s ease-in-out ${p.delay}s infinite` }} />
      ))}
    </div>
  );
}

function HeroScreen({ lang, onStart }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), 80); return () => clearTimeout(t); }, []);
  const stats = lang === 'fr' ? [['500+', 'Bourses'], ['60+', 'Pays'], ['12K+', 'Aidés']] : [['500+', 'Scholarships'], ['60+', 'Countries'], ['12K+', 'Helped']];
  const ani = (delay = 0) => ({ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 0.6s ease ${delay}s, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) ${delay}s` });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>

      <div style={{ ...ani(0), display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 99, padding: '7px 18px', marginBottom: '2rem' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f5a623', display: 'inline-block', animation: 'gp-pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize: 13, color: '#c47d0e', fontWeight: 700, letterSpacing: '0.03em' }}>{lang === 'fr' ? '✦ Trouve ta bourse en 30 secondes' : '✦ Find your scholarship in 30 seconds'}</span>
      </div>

      <h1 style={{ ...ani(0.1), fontSize: 'clamp(2.8rem, 6.5vw, 5.5rem)', fontWeight: 800, color: '#0d1520', lineHeight: 1.08, marginBottom: '1.5rem', maxWidth: 820, letterSpacing: '-0.02em' }}>
        {lang === 'fr' ? <>Ton avenir commence<br /><span style={{ background: 'linear-gradient(135deg, #255cae 20%, #f5a623 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ici.</span></> : <>Your future starts<br /><span style={{ background: 'linear-gradient(135deg, #255cae 20%, #f5a623 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>here.</span></>}
      </h1>

      <p style={{ ...ani(0.2), fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#64748b', maxWidth: 520, lineHeight: 1.7, marginBottom: '2.5rem' }}>
        {lang === 'fr' ? 'Analyse de profil IA • 500+ bourses mondiales • 3 questions seulement' : 'AI profile analysis • 500+ global scholarships • Only 3 questions'}
      </p>

      <div style={ani(0.3)}>
        <button onClick={onStart} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#255cae', color: 'white', border: 'none', borderRadius: 99, padding: '16px 36px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 28px rgba(37,92,174,0.3)', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(37,92,174,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 28px rgba(37,92,174,0.3)'; }}>
          <span>{lang === 'fr' ? '✨ Découvrir mes bourses' : '✨ Discover my scholarships'}</span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3.5 9h11M8.5 4l5 5-5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div style={{ ...ani(0.5), display: 'flex', gap: '3.5rem', marginTop: '4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {stats.map(([n, l]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#255cae', letterSpacing: '-0.02em' }}>{n}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Floating cards preview */}
      <div style={{ ...ani(0.6), position: 'relative', width: '100%', maxWidth: 700, marginTop: '4rem', height: 100, display: 'none' }} />
    </div>
  );
}

function QuizScreen({ lang, questions, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [out, setOut] = useState(false);
  const q = questions[step];

  const pick = useCallback((opt) => {
    if (selected) return;
    setSelected(opt.val);
    setTimeout(() => {
      const na = { ...answers, [q.id]: opt.val };
      setAnswers(na);
      if (step + 1 < questions.length) {
        setOut(true);
        setTimeout(() => { setStep(s => s + 1); setSelected(null); setOut(false); }, 380);
      } else { onComplete(na); }
    }, 300);
  }, [selected, answers, step, questions, q, onComplete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', position: 'relative', zIndex: 1 }}>
      {/* Progress */}
      <div style={{ position: 'fixed', top: 70, left: 0, right: 0, height: 3, background: 'rgba(37,92,174,0.08)', zIndex: 100 }}>
        <div style={{ height: '100%', width: `${(step / questions.length) * 100}%`, background: 'linear-gradient(to right, #255cae, #f5a623)', transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)', borderRadius: '0 99px 99px 0' }} />
      </div>
      {/* Dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '2.5rem' }}>
        {questions.map((_, i) => <div key={i} style={{ width: i === step ? 28 : 8, height: 8, borderRadius: 99, background: i <= step ? '#255cae' : 'rgba(37,92,174,0.12)', transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)' }} />)}
      </div>
      {/* Question */}
      <div style={{ maxWidth: 660, width: '100%', textAlign: 'center', opacity: out ? 0 : 1, transform: out ? 'translateX(-32px) scale(0.96)' : 'none', transition: 'all 0.38s cubic-bezier(0.4,0,0.2,1)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#f5a623', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.6rem' }}>{lang === 'fr' ? `Question ${step + 1} / ${questions.length}` : `Question ${step + 1} / ${questions.length}`}</p>
        <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', fontWeight: 800, color: '#0d1520', lineHeight: 1.12, marginBottom: '0.65rem', letterSpacing: '-0.01em' }}>{q.q}</h2>
        <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '2.5rem' }}>{q.sub}</p>
        <div style={{ display: 'grid', gridTemplateColumns: q.opts.length <= 4 ? `repeat(${q.opts.length}, 1fr)` : 'repeat(3, 1fr)', gap: 12 }}>
          {q.opts.map((opt, i) => {
            const isSel = selected === opt.val;
            return (
              <button key={opt.val} onClick={() => pick(opt)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '1.25rem 0.75rem', background: isSel ? '#255cae' : 'white', border: `2px solid ${isSel ? '#255cae' : '#e8edf3'}`, borderRadius: 20, cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)', transform: isSel ? 'scale(1.05)' : 'none', boxShadow: isSel ? '0 8px 24px rgba(37,92,174,0.22)' : '0 2px 6px rgba(0,0,0,0.04)', animation: `gp-slidein 0.45s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.055}s both`, outline: 'none' }}
                onMouseEnter={e => { if (!isSel) { e.currentTarget.style.borderColor = '#255cae'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(37,92,174,0.14)'; } }}
                onMouseLeave={e => { if (!isSel) { e.currentTarget.style.borderColor = '#e8edf3'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)'; } }}>
                <span style={{ fontSize: 30 }}>{opt.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: isSel ? 'white' : '#1e293b' }}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ResultScreen({ lang, recommended, onSignup, onReset }) {
  const [v, setV] = useState(false);
  const [active, setActive] = useState(null);
  useEffect(() => { const t = setTimeout(() => setV(true), 150); return () => clearTimeout(t); }, []);

  const flagFor = (pays = '') => {
    const p = pays.toLowerCase();
    if (p.includes('france')) return '🇫🇷';
    if (p.includes('canada')) return '🇨🇦';
    if (p.includes('allem') || p.includes('germany')) return '🇩🇪';
    if (p.includes('suisse') || p.includes('switzerland')) return '🇨🇭';
    if (p.includes('usa') || p.includes('states')) return '🇺🇸';
    return '🌍';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', zIndex: 1, position: 'relative' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem', opacity: v ? 1 : 0, transform: v ? 'none' : 'translateY(-16px)', transition: 'all 0.6s ease' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem', display: 'inline-block', animation: v ? 'gp-celebrate 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' : 'none' }}>🎯</div>
        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: '#0d1520', marginBottom: '0.6rem', letterSpacing: '-0.01em' }}>
          {recommended.length > 0 ? (lang === 'fr' ? `${recommended.length} bourse${recommended.length > 1 ? 's' : ''} trouvée${recommended.length > 1 ? 's' : ''} !` : `${recommended.length} scholarship${recommended.length > 1 ? 's' : ''} found!`) : (lang === 'fr' ? 'Résultats personnalisés' : 'Personalized results')}
        </h2>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>
          {lang === 'fr' ? 'Crée un compte pour accéder à toutes les bourses et postuler.' : 'Create an account to access all scholarships and apply.'}
        </p>
      </div>

      {/* Cards */}
      {recommended.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, maxWidth: 940, width: '100%', marginBottom: '2.5rem' }}>
          {recommended.map((b, i) => (
            <div key={b.id || i} onClick={() => setActive(active === i ? null : i)} style={{ background: 'white', borderRadius: 24, border: `2px solid ${active === i ? '#255cae' : '#f0f4f8'}`, padding: '1.6rem', cursor: 'pointer', boxShadow: active === i ? '0 14px 40px rgba(37,92,174,0.14)' : '0 3px 12px rgba(0,0,0,0.04)', transform: active === i ? 'translateY(-4px) scale(1.01)' : 'none', transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', animation: `gp-slideup ${0.4 + i * 0.1}s ease ${0.15 + i * 0.1}s both`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 14, right: 14, background: b.score >= 60 ? 'linear-gradient(135deg, #10b981,#059669)' : '#255cae', color: 'white', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>{b.score}% match</div>
              <div style={{ fontSize: 36, marginBottom: '0.9rem' }}>{flagFor(b.pays)}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0d1520', marginBottom: '0.6rem', lineHeight: 1.3, paddingRight: 60 }}>{b.nom || 'Bourse d\'Excellence'}</h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span style={{ background: '#eff6ff', color: '#1e40af', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{b.pays || 'International'}</span>
                <span style={{ background: '#fefce8', color: '#92400e', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{b.financement || 'Complète'}</span>
                {b.statut === 'active' && <span style={{ background: '#f0fdf4', color: '#14532d', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>✓ {lang === 'fr' ? 'Ouvert' : 'Open'}</span>}
              </div>
              {active === i && b.description && <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>{b.description}</p>}
              <button onClick={e => { e.stopPropagation(); onSignup(); }} style={{ width: '100%', marginTop: '0.75rem', background: active === i ? '#255cae' : 'transparent', color: active === i ? 'white' : '#255cae', border: '2px solid #255cae', borderRadius: 99, padding: '9px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease' }}>
                {lang === 'fr' ? '→ Postuler' : '→ Apply'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CTA dark */}
      <div style={{ background: 'linear-gradient(135deg, #0d1520, #1a2f4a)', borderRadius: 28, padding: '2.5rem 2rem', textAlign: 'center', maxWidth: 560, width: '100%', position: 'relative', overflow: 'hidden', opacity: v ? 1 : 0, transition: 'opacity 0.6s ease 0.5s' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(245,166,35,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(37,92,174,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 38, marginBottom: '0.75rem' }}>🚀</div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>{lang === 'fr' ? 'Tu mérites plus.' : 'You deserve more.'}</h3>
          <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>{lang === 'fr' ? '500+ bourses · IA personnalisée · Roadmap sur mesure · Gratuit' : '500+ scholarships · Personal AI · Custom roadmap · Free'}</p>
          <button onClick={onSignup} style={{ width: '100%', background: 'linear-gradient(135deg, #f5a623, #e8941f)', color: '#0d1520', border: 'none', borderRadius: 99, padding: '14px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 24px rgba(245,166,35,0.3)', transition: 'all 0.25s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(245,166,35,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,166,35,0.3)'; }}>
            {lang === 'fr' ? '✨ Créer mon compte gratuit' : '✨ Create my free account'}
          </button>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: '0.6rem' }}>{lang === 'fr' ? 'Sans carte bancaire' : 'No credit card'}</p>
        </div>
      </div>

      <button onClick={onReset} style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
        ← {lang === 'fr' ? 'Recommencer' : 'Restart'}
      </button>
    </div>
  );
}

export default function GuestPage({ bourses = [], onSignup, setView }) {
  const { lang } = useT();
  const [phase, setPhase] = useState('hero');
  const [recommended, setRecommended] = useState([]);
  const questions = QUIZ[lang] || QUIZ.fr;

  const handleComplete = useCallback((answers) => {
    const scored = bourses.map(b => {
      let s = 0;
      const bn = (b.niveau || '').toLowerCase(), bd = (b.domaine || '').toLowerCase(), bp = (b.pays || '').toLowerCase();
      if (b.tunisienEligible === 'oui') s += 30;
      if (answers.level && bn.includes(answers.level)) s += 25; else if (!bn || bn.includes('tous')) s += 12;
      if (answers.field && bd.includes(answers.field)) s += 20; else if (!bd || bd.includes('tous')) s += 10;
      if (answers.country === 'international') s += 10; else if (answers.country && bp.includes(answers.country)) s += 15;
      if (b.statut === 'active') s += 10;
      return { ...b, score: Math.min(100, Math.round((s / 95) * 100)) };
    }).filter(b => b.score > 15).sort((a, b) => b.score - a.score).slice(0, 3);
    setRecommended(scored);
    setPhase('result');
  }, [bourses]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'radial-gradient(ellipse 80% 60% at 25% 15%, rgba(37,92,174,0.055) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 75% 85%, rgba(245,166,35,0.055) 0%, transparent 60%), #fafbff' }}>
      <ParticleField />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(37,92,174,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(37,92,174,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      {/* Topbar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 2rem', zIndex: 50, background: 'rgba(250,251,255,0.82)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(37,92,174,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #255cae, #1a3f7a)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13 }}>O</div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0d1520', letterSpacing: '-0.01em' }}>OppsTrack</span>
          <span style={{ fontSize: 9, background: '#eff6ff', color: '#1d4ed8', padding: '2px 7px', borderRadius: 99, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Beta</span>
        </div>
        <button onClick={onSignup} style={{ background: 'rgba(37,92,174,0.07)', border: '1px solid rgba(37,92,174,0.18)', borderRadius: 99, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#255cae', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#255cae'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,92,174,0.07)'; e.currentTarget.style.color = '#255cae'; }}>
          {lang === 'fr' ? 'Se connecter' : 'Log in'}
        </button>
      </div>

      <div style={{ paddingTop: 68 }}>
        {phase === 'hero' && <HeroScreen lang={lang} onStart={() => setPhase('quiz')} />}
        {phase === 'quiz' && <QuizScreen lang={lang} questions={questions} onComplete={handleComplete} />}
        {phase === 'result' && <ResultScreen lang={lang} recommended={recommended} onSignup={onSignup} onReset={() => { setPhase('hero'); setRecommended([]); }} />}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        button { font-family: inherit; }
        h1, h2, h3, p { margin: 0; }
        @keyframes gp-float { 0%,100%{transform:translateY(0) scale(1);opacity:.12} 50%{transform:translateY(-18px) scale(1.1);opacity:.25} }
        @keyframes gp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
        @keyframes gp-slidein { from{opacity:0;transform:translateY(18px) scale(0.93)} to{opacity:1;transform:none} }
        @keyframes gp-slideup { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }
        @keyframes gp-celebrate { 0%{transform:scale(0) rotate(-15deg);opacity:0} 60%{transform:scale(1.25) rotate(6deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(37,92,174,0.18);border-radius:99px}
      `}</style>
    </div>
  );
}