import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';

const API_BASE = 'http://localhost:3000/api';

const quickReplies = [
  { emoji: '🎓', label: 'Trouver mes bourses', text: 'Quelles bourses correspondent à mon profil ?' },
  { emoji: '🔐', label: 'Me connecter', text: 'Je veux me connecter' },
  { emoji: '🗺️', label: 'Voir la roadmap', text: 'Montre-moi la roadmap pour postuler' },
  { emoji: '🎙️', label: 'Préparer un entretien', text: "Je veux m'entraîner pour un entretien de bourse" },
  { emoji: '📄', label: 'Analyser mon CV', text: 'Je veux analyser mon CV' },
  { emoji: '❌', label: 'Mode invité', text: 'Non, je ne veux pas me connecter, continuer en invité' },
];

// ─── Hook stats réelles depuis Payload ──────────────────────────────────────
function useHeroStats() {
  const [stats, setStats] = useState({
    totalBourses:    null, // null = chargement en cours
    pctFinancees:    null,
    loaded:          false,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1 seul appel — on récupère tout avec limit élevé
        const res = await fetch(
          `${API_BASE}/bourses?limit=500&depth=0`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) throw new Error('Payload inaccessible');
        const data = await res.json();

        const docs        = data.docs || [];
        const total       = data.totalDocs ?? docs.length;

        // % financées = bourses dont financement contient "100" ou "Totale" ou "Complète"
        const financees   = docs.filter(b => {
          const f = (b.financement || '').toLowerCase();
          return f.includes('100') || f.includes('total') || f.includes('complet') || f.includes('intégral');
        });

        const pct = total > 0
          ? Math.round((financees.length / total) * 100)
          : null;

        setStats({
          totalBourses: total,
          pctFinancees: pct,
          loaded:       true,
        });
      } catch {
        // Payload inaccessible → garder les valeurs marketing par défaut
        setStats({ totalBourses: 500, pctFinancees: 98, loaded: true });
      }
    };

    fetchStats();
  }, []);

  return stats;
}

// ─── Composant stat animé ────────────────────────────────────────────────────
function StatNumber({ value, suffix = '', loading }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (loading || value === null) return;
    // Petite animation counter
    const target = parseInt(value);
    const duration = 800;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), target);
      setDisplayed(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, loading]);

  if (loading || value === null) {
    return <span className="stat-num stat-loading">—</span>;
  }

  return (
    <span className="stat-num">
      {displayed}{suffix}
    </span>
  );
}

// ─── Composant ScrollButton ─────────────────────────────────────────────────
function ScrollToBottomButton({ onClick, visible }) {
  if (!visible) return null;
  
  return (
    <button className="scroll-to-bottom-btn" onClick={onClick} title="Aller en bas">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

// ─── ChatPage ────────────────────────────────────────────────────────────────
export default function ChatPage({
  user, messages, input, setInput, loading,
  handleSend, handleQuickReply, chatContainerRef, setView
}) {
  const heroStats = useHeroStats();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const localChatContainerRef = useRef(null);
  const containerRef = chatContainerRef || localChatContainerRef;

  // Fonction pour scroller en bas
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  // Vérifier si on est en bas du scroll
  const checkScrollPosition = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  // Scroller en bas à chaque nouveau message
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Scroller en bas au chargement initial
  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, []);

  // Ajouter l'écouteur d'événement scroll
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      // Vérifier la position initiale
      checkScrollPosition();
      
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
      };
    }
  }, [containerRef.current]);

  return (
    <div className="chat-page">
      {/* Hero */}
      <div className="chat-hero">
        <div className="hero-badge">✨ Propulsé par l'IA</div>
        <h1 className="hero-title">
          Trouvez votre bourse<br />
          <span className="hero-gradient">100% financée</span>
        </h1>
        <p className="hero-sub">
          Discutez avec notre IA. Elle analyse votre profil, recommande les meilleures opportunités
          et vous guide à chaque étape.
        </p>

        {/* Stats dynamiques */}
        <div className="hero-stats">
          <div className="stat">
            <StatNumber
              value={heroStats.totalBourses}
              suffix={heroStats.totalBourses >= 500 ? '+' : ''}
              loading={!heroStats.loaded}
            />
            <span className="stat-label">Bourses</span>
          </div>

          <div className="stat-divider" />

          <div className="stat">
            <StatNumber
              value={heroStats.pctFinancees}
              suffix="%"
              loading={!heroStats.loaded}
            />
            <span className="stat-label">Financées</span>
          </div>

          <div className="stat-divider" />

          <div className="stat">
            <span className="stat-num">24/7</span>
            <span className="stat-label">IA active</span>
          </div>
        </div>
      </div>

      {/* Chat Box */}
      <div className="chat-box">
        {/* Messages */}
        <div className="chat-messages" ref={containerRef}>
          {messages.length === 0 && (
            <div className="welcome-screen">
              <div className="welcome-robot">🤖</div>
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
            <ChatMessage key={i} msg={msg} index={i}  showVoiceBadge={msg.voiceInput}  />
          ))}

          {loading && (
            <div className="msg ai">
              <div className="msg-avatar"><span>🤖</span></div>
              <div className="msg-bubble typing-bubble">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Replies */}
        <div className="quick-replies">
          {quickReplies.map((qr, i) => (
            <button
              key={i}
              className="quick-reply-btn"
              onClick={() => handleQuickReply(qr.text)}
              disabled={loading}
            >
              <span>{qr.emoji}</span>
              <span>{qr.label}</span>
            </button>
          ))}
        </div>

        {/* Input */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSend()}
          loading={loading}
        />
      </div>

      {/* Bouton flèche pour aller en bas */}
      <ScrollToBottomButton onClick={scrollToBottom} visible={showScrollButton} />

      <style>{`
        .chat-page {
          display: flex; flex-direction: column; align-items: center;
          width: 100%; max-width: 760px; margin: 0 auto;
          padding: 32px 16px;
          position: relative;
        }
        .chat-hero { text-align: center; margin-bottom: 32px; }
        .hero-badge {
          display: inline-block; padding: 6px 16px;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 20px; color: #818cf8;
          font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
          margin-bottom: 20px;
        }
        .hero-title {
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          font-weight: 900; line-height: 1.2;
          color: #f1f5f9; margin-bottom: 16px;
          letter-spacing: -1px;
        }
        .hero-gradient {
          background: linear-gradient(135deg, #818cf8, #c084fc, #f472b6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .hero-sub {
          color: #64748b; font-size: 15px; max-width: 500px;
          margin: 0 auto 24px; line-height: 1.6;
        }
        .hero-stats {
          display: flex; align-items: center; justify-content: center;
          gap: 24px; flex-wrap: wrap;
        }
        .stat { display: flex; flex-direction: column; align-items: center; }
        .stat-num {
          font-size: 1.4rem; font-weight: 800;
          background: linear-gradient(135deg, #818cf8, #c084fc);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          min-width: 52px; text-align: center;
        }
        /* Skeleton pendant le chargement */
        .stat-loading {
          background: rgba(99,102,241,0.15) !important;
          -webkit-text-fill-color: transparent;
          border-radius: 4px;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0%,100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
        .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        .stat-divider { width: 1px; height: 32px; background: rgba(99,102,241,0.2); }

        .chat-box {
          width: 100%;
          background: rgba(15, 15, 30, 0.8);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4),
                      inset 0 1px 0 rgba(255,255,255,0.05);
          overflow: hidden;
          position: relative;
        }
        .chat-messages {
          height: 420px; overflow-y: auto; padding: 20px 16px;
          scroll-behavior: smooth;
        }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 2px; }

        .welcome-screen {
          display: flex; gap: 12px; align-items: flex-start;
          padding: 16px; margin: 8px 0;
        }
        .welcome-robot { font-size: 32px; flex-shrink: 0; margin-top: 4px; }
        .welcome-bubble {
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 0 16px 16px 16px;
          padding: 16px 20px; color: #cbd5e1; font-size: 14px;
          line-height: 1.7;
        }
        .welcome-bubble strong { color: #e2e8f0; }
        .welcome-bubble ul { padding-left: 4px; list-style: none; margin: 8px 0; }
        .welcome-bubble li { margin-bottom: 4px; }

        .msg {
          display: flex; gap: 10px; margin-bottom: 16px;
          max-width: 85%; animation: msgIn 0.3s ease;
        }
        @keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .msg.user { margin-left: auto; flex-direction: row-reverse; }
        .msg-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(99,102,241,0.2);
          border: 1px solid rgba(99,102,241,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
        }
        .user-avatar-msg { background: rgba(139,92,246,0.2); border-color: rgba(139,92,246,0.3); }
        .msg-bubble {
          padding: 12px 16px; border-radius: 16px;
          font-size: 14px; line-height: 1.6; word-break: break-word;
        }
        .msg.ai .msg-bubble {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #cbd5e1; border-top-left-radius: 4px;
        }
        .msg.user .msg-bubble {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white; border-top-right-radius: 4px;
          box-shadow: 0 4px 12px rgba(79,70,229,0.4);
        }
        .msg-link { color: #818cf8; text-decoration: none; word-break: break-all; }
        .msg-link:hover { text-decoration: underline; }
        .typing-bubble {
          display: flex; gap: 4px; align-items: center; padding: 14px 18px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; border-top-left-radius: 4px;
        }
        .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #6366f1; display: block;
          animation: dotBounce 1.2s infinite ease-in-out;
        }
        .dot:nth-child(1) { animation-delay: 0s; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotBounce {
          0%, 60%, 100% { transform: scale(0.7); opacity: 0.5; }
          30% { transform: scale(1.1); opacity: 1; }
        }

        .quick-replies {
          display: flex; flex-wrap: wrap; gap: 8px;
          padding: 12px 16px; border-top: 1px solid rgba(99,102,241,0.1);
          justify-content: center;
        }
        .quick-reply-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 20px;
          border: 1px solid rgba(99,102,241,0.25);
          background: rgba(99,102,241,0.08);
          color: #94a3b8; font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .quick-reply-btn:hover:not(:disabled) {
          background: rgba(99,102,241,0.2);
          border-color: rgba(99,102,241,0.5); color: #c4b5fd;
          transform: translateY(-1px);
        }
        .quick-reply-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Bouton flèche pour scroller en bas */
        .scroll-to-bottom-btn {
          position: fixed;
          bottom: 120px;
          right: 24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(79,70,229,0.5);
          transition: all 0.3s ease;
          z-index: 1000;
          animation: fadeInUp 0.3s ease;
        }
        .scroll-to-bottom-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(79,70,229,0.7);
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .chat-messages { height: 340px; }
          .hero-stats { gap: 16px; }
          .scroll-to-bottom-btn {
            bottom: 100px;
            right: 16px;
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
}