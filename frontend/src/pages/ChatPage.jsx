import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';

const quickReplies = [
  { emoji: '🎓', label: 'Trouver mes bourses',    text: 'Quelles bourses correspondent à mon profil ?' },
  { emoji: '🔐', label: 'Me connecter',           text: 'Je veux me connecter' },
  { emoji: '🗺️', label: 'Voir la roadmap',        text: 'Montre-moi la roadmap pour postuler' },
  { emoji: '🎙️', label: 'Préparer un entretien',  text: "Je veux m'entraîner pour un entretien de bourse" },
{ emoji: '📄', label: 'Créer / Analyser mon CV', text: 'Je veux créer ou analyser mon CV' },
  { emoji: '❌', label: 'Mode invité',             text: 'Non, je ne veux pas me connecter, continuer en invité' },
];

function useHeroStats() {
  const [stats, setStats] = useState({ totalBourses: null, pctFinancees: null, loaded: false });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get(API_ROUTES.bourses.list, {
          params: { limit: 500, depth: 0 }
        });
        const docs  = response.data.docs || [];
        const total = response.data.totalDocs ?? docs.length;
        const financees = docs.filter(b => {
          const f = (b.financement || '').toLowerCase();
          return f.includes('100') || f.includes('total') || f.includes('complet') || f.includes('intégral');
        });
        setStats({
          totalBourses: total,
          pctFinancees: total > 0 ? Math.round((financees.length / total) * 100) : null,
          loaded: true,
        });
      } catch {
        setStats({ totalBourses: 500, pctFinancees: 98, loaded: true });
      }
    };
    fetchStats();
  }, []);

  return stats;
}

function StatNumber({ value, suffix = '', loading }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (loading || value === null) return;
    const target = parseInt(value);
    const steps  = 30;
    const increment = target / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplayed(Math.min(Math.round(increment * step), target));
      if (step >= steps) clearInterval(timer);
    }, 800 / steps);
    return () => clearInterval(timer);
  }, [value, loading]);

  if (loading || value === null) return <span className="stat-num stat-loading">—</span>;
  return <span className="stat-num">{displayed}{suffix}</span>;
}

function ScrollToBottomButton({ onClick, visible }) {
  if (!visible) return null;
  return (
    <button
      className="scroll-btn"
      onClick={onClick}
      title="Aller en bas"
      aria-label="Aller au bas de la conversation"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

export default function ChatPage({
  user, messages, input, setInput, loading,
  handleSend, handleQuickReply, chatContainerRef, setView
}) {
  const heroStats = useHeroStats();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const localRef = useRef(null);
  const containerRef = chatContainerRef || localRef;

  const scrollToBottom = () => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  };

  useEffect(() => { scrollToBottom(); }, [messages, loading]);
  useEffect(() => { setTimeout(scrollToBottom, 100); }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };
    el.addEventListener('scroll', check);
    check();
    return () => el.removeEventListener('scroll', check);
  }, [containerRef.current]);

  return (
    <div className="chat-page">

      {/* ── Hero ── */}
      <div className="chat-hero">
        <div className="hero-badge">✨ Propulsé par l'IA</div>
        <h1 className="hero-title">
          Trouvez votre bourse<br />
          <span className="hero-accent">100% financée</span>
        </h1>
        <p className="hero-sub">
          Discutez avec notre IA. Elle analyse votre profil, recommande les meilleures
          opportunités et vous guide à chaque étape.
        </p>
      </div>

      {/* ── Chat Box ── */}
      <div className="chat-box">

        {/* Messages */}
        <div className="chat-messages" ref={containerRef}>
          {messages.length === 0 && (
            <div className="welcome-screen">
              <div className="welcome-avatar">
                <img src="/logo.png" alt="OppsTrack" style={{ width:36, height:36, objectFit:'contain', borderRadius:6 }}
                  onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='🤖'; }} />
              </div>
              <div className="welcome-bubble">
                <p><strong>Bonjour{user?.name ? ` ${user.name}` : ''} !</strong> 👋</p>
                <p>Je suis votre assistant OppsTrack. Je peux :</p>
                <ul>
                  <li>🎓 Recommander des bourses selon votre profil</li>
                  <li>📋 Vous guider sur les démarches à suivre</li>
                  <li>🎙️ Vous préparer à vos entretiens</li>
                  <li>📄 Analyser votre CV et lettre de motivation</li>
                </ul>
                <p>Par où voulez-vous commencer ?</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} index={i} showVoiceBadge={msg.voiceInput} />
          ))}

          {loading && (
            <div className="msg ai">
              <div className="msg-avatar">🤖</div>
              <div className="msg-bubble typing-bubble">
                <span className="dot"/>
                <span className="dot"/>
                <span className="dot"/>
              </div>
            </div>
          )}
          {/* in-chat scroll button */}
          <ScrollToBottomButton onClick={scrollToBottom} visible={showScrollButton} />
        </div>

        {/* Quick Replies */}
        <div className="quick-replies">
          {quickReplies.map((qr, i) => (
            <button key={i} className="quick-reply-btn"
              onClick={() => handleQuickReply(qr.text)} disabled={loading}>
              <span>{qr.emoji}</span>
              <span>{qr.label}</span>
            </button>
          ))}
        </div>

        {/* Input */}
        <ChatInput input={input} setInput={setInput} onSend={() => handleSend()} loading={loading} />
      </div>

      {/* Stats */}
      <div className="hero-stats">
        <div className="stat">
          <StatNumber value={heroStats.totalBourses} suffix={heroStats.totalBourses >= 500 ? '+' : ''} loading={!heroStats.loaded} />
          <span className="stat-label">Bourses</span>
        </div>
        <div className="stat-divider"/>
        <div className="stat">
          <StatNumber value={heroStats.pctFinancees} suffix="%" loading={!heroStats.loaded} />
          <span className="stat-label">Financées</span>
        </div>
        <div className="stat-divider"/>
        <div className="stat">
          <span className="stat-num">24/7</span>
          <span className="stat-label">IA active</span>
        </div>
      </div>

      

      <style>{`
        /* ── PAGE ──────────────────────────────────── */
        .chat-page {
          display: flex; flex-direction: column; align-items: center;
          width: 100%; max-width: 780px; margin: 0 auto;
          padding: 40px 16px 32px;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        /* ── HERO ──────────────────────────────────── */
        .chat-hero { text-align: center; margin-bottom: 28px; width: 100%; }

        .hero-badge {
          display: inline-block; padding: 5px 16px;
          background: #eff6ff; border: 1px solid #bfdbfe;
          border-radius: 40px; color: #1a3a6b;
          font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
          margin-bottom: 20px;
        }

        .hero-title {
          font-size: clamp(1.8rem, 5vw, 2.8rem);
          font-weight: 800; line-height: 1.2;
          color: #1a3a6b; margin-bottom: 16px;
          letter-spacing: -0.02em;
        }

        .hero-accent {
          background: linear-gradient(135deg, #f5a623, #e89510);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .hero-sub {
          color: #475569; font-size: 15px;
          max-width: 520px; margin: 0 auto;
          line-height: 1.6;
        }

        /* ── CHAT BOX ──────────────────────────────── */
        .chat-box {
          width: 100%;
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          border-top: 3px solid #1a3a6b;
          box-shadow: 0 4px 20px rgba(26,58,107,0.08);
          overflow: hidden;
        }

        /* ── MESSAGES ──────────────────────────────── */
        .chat-messages {
          position: relative;
          height: 420px; overflow-y: auto;
          padding: 20px; scroll-behavior: smooth;
          background: #fafbfc;
        }
        .chat-messages::-webkit-scrollbar { width: 5px; }
        .chat-messages::-webkit-scrollbar-track { background: #f1f5f9; }
        .chat-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

        /* ── WELCOME ───────────────────────────────── */
        .welcome-screen {
          display: flex; gap: 12px; align-items: flex-start; padding: 8px 0;
        }
        .welcome-avatar {
          width: 42px; height: 42px; border-radius: 8px;
          background: #eff6ff; border: 1px solid #bfdbfe;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0;
        }
        .welcome-bubble {
          background: #ffffff; border: 1px solid #e2e8f0;
          border-radius: 0 12px 12px 12px;
          padding: 16px 20px; color: #1a3a6b;
          font-size: 14px; line-height: 1.6;
          box-shadow: 0 2px 8px rgba(26,58,107,0.06);
        }
        .welcome-bubble strong { color: #1a3a6b; font-weight: 700; }
        .welcome-bubble ul { padding-left: 20px; margin: 8px 0; }
        .welcome-bubble li { margin-bottom: 4px; color: #475569; }

        /* ── MSG BUBBLES ───────────────────────────── */
        .msg {
          display: flex; gap: 10px; margin-bottom: 18px;
          max-width: 85%; animation: msgIn 0.3s ease;
        }
        @keyframes msgIn { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:none; } }
        .msg.user { margin-left: auto; flex-direction: row-reverse; }

        .msg-avatar {
          width: 34px; height: 34px; border-radius: 8px;
          background: #eff6ff; border: 1px solid #bfdbfe;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .msg.user .msg-avatar { background: #1a3a6b; border-color: #1a3a6b; color: #fff; font-size: 13px; font-weight: 700; }

        .msg-bubble {
          padding: 11px 16px; border-radius: 12px;
          font-size: 14px; line-height: 1.55; word-break: break-word;
        }
        .msg.ai .msg-bubble {
          background: #ffffff; border: 1px solid #e2e8f0;
          color: #1a3a6b; border-top-left-radius: 4px;
          box-shadow: 0 1px 4px rgba(26,58,107,0.05);
        }
        .msg.user .msg-bubble {
          background: #1a3a6b; color: #ffffff;
          border-top-right-radius: 4px;
          box-shadow: 0 2px 8px rgba(26,58,107,0.2);
        }

        /* ── TYPING ────────────────────────────────── */
        .typing-bubble {
          display: flex; gap: 5px; align-items: center;
          padding: 12px 16px; background: #ffffff;
          border: 1px solid #e2e8f0; border-radius: 12px; border-top-left-radius: 4px;
        }
        .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #1a3a6b; display: inline-block;
          animation: dotBounce 1.2s infinite ease-in-out;
        }
        .dot:nth-child(1) { animation-delay: 0s; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotBounce { 0%,60%,100%{transform:scale(0.7);opacity:0.5} 30%{transform:scale(1.1);opacity:1} }

        /* ── QUICK REPLIES ─────────────────────────── */
        .quick-replies {
          display: flex; flex-wrap: wrap; gap: 8px;
          padding: 14px 18px;
          border-top: 1px solid #f1f5f9;
          justify-content: center;
          background: #f8fafc;
        }
        .quick-reply-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 14px; border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: #ffffff; color: #1a3a6b;
          font-size: 12.5px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
          font-family: inherit;
        }
        .quick-reply-btn:hover:not(:disabled) {
          background: #1a3a6b; color: #ffffff;
          border-color: #1a3a6b;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(26,58,107,0.2);
        }
        .quick-reply-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── STATS ─────────────────────────────────── */
        .hero-stats {
          display: flex; align-items: center; justify-content: center;
          gap: 32px; flex-wrap: wrap;
          background: #1a3a6b;
          padding: 20px 36px; border-radius: 10px;
          margin-top: 20px; width: 100%;
          border-bottom: 3px solid #f5a623;
        }
        .stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .stat-num {
          font-size: 1.8rem; font-weight: 800; color: #f5a623;
          min-width: 60px; text-align: center;
        }
        .stat-loading {
          background: rgba(255,255,255,0.1) !important;
          -webkit-text-fill-color: transparent;
          border-radius: 6px;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:1} }
        .stat-label {
          font-size: 11px; color: rgba(255,255,255,0.7);
          text-transform: uppercase; letter-spacing: 1px; font-weight: 600;
        }
        .stat-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.15); }

        /* ── SCROLL BTN ────────────────────────────── */
        .scroll-btn {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          width: 40px; height: 40px; border-radius: 999px;
          background: #1a3a6b; border: none;
          color: #ffffff; cursor: pointer; opacity: 0.96;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 18px rgba(26,58,107,0.14);
          transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
          z-index: 20; animation: fadeInUp 0.18s ease;
        }
        .scroll-btn:hover { transform: translateY(-50%) scale(1.03); background: #15314f; box-shadow: 0 8px 22px rgba(26,58,107,0.18); }
        .scroll-btn:focus { outline: none; box-shadow: 0 0 0 3px rgba(25, 61, 105, 0.18); }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width: 640px) {
          .chat-messages { height: 340px; }
          .hero-stats { gap: 20px; padding: 16px 20px; }
          .stat-num { font-size: 1.4rem; }
          .scroll-btn { right: 10px; top: 50%; transform: translateY(-50%); width: 38px; height: 38px; }
        }
      `}</style>
    </div>
  );
}