import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';

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
        // Modification : utilisation de axiosInstance et API_ROUTES
        const response = await axiosInstance.get(API_ROUTES.bourses.list, {
          params: { limit: 500, depth: 0 }
        });
        
        const docs = response.data.docs || [];
        const total = response.data.totalDocs ?? docs.length;

        // % financées = bourses dont financement contient "100" ou "Totale" ou "Complète"
        const financees = docs.filter(b => {
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

      <style>{`
  .chat-page {
    display: flex; flex-direction: column; align-items: center;
    width: 100%; max-width: 760px; margin: 0 auto;
    padding: 32px 16px;
    position: relative;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  .chat-hero { text-align: center; margin-bottom: 32px; }
  .hero-badge {
    display: inline-block; padding: 4px 14px;
    background: #eef2ff;  
    border: 1px solid #c7d2fe;
    border-radius: 40px;
    color: #2563eb;       /* bleu vif */
    font-size: 12px; font-weight: 600; letter-spacing: 0.3px;
    margin-bottom: 24px;
  }
  .hero-title {
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 800; line-height: 1.2;
    color: #111827; margin-bottom: 20px;
    letter-spacing: -0.02em;
  }
  .hero-gradient {
    background: linear-gradient(135deg, #eab308, #f59e0b); /* jaune/doré */
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .hero-sub {
    color: #4b5563; font-size: 15px; max-width: 500px;
    margin: 0 auto 28px; line-height: 1.6;
  }
  .hero-stats {
    display: flex; align-items: center; justify-content: center;
    gap: 32px; flex-wrap: wrap;
    background: #f9fafb;
    padding: 20px 28px;
    border-radius: 40px;
    margin-top: 8px;
  }
  .stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .stat-num {
    font-size: 1.8rem; font-weight: 800;
    color: #2563eb;     /* bleu pour les chiffres */
    min-width: 60px; text-align: center;
  }
  .stat-loading {
    background: #e5e7eb !important;
    -webkit-text-fill-color: transparent;
    border-radius: 6px;
    animation: shimmer 1.4s infinite;
  }
  @keyframes shimmer {
    0%,100% { opacity: 0.4; }
    50%      { opacity: 1; }
  }
  .stat-label { font-size: 12px; color: #f3f4f6; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
  .stat-divider { width: 1px; height: 36px; background: #e5e7eb; }

  .chat-box {
    width: 100%;
    background: #f3f4f6;
    border-radius: 28px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.08);
    overflow: hidden;
    border: 1px solid #f0f0f0;
  }
  .chat-messages {
    height: 420px; overflow-y: auto; padding: 20px 20px;
    scroll-behavior: smooth;
    background: #ffffff;
  }
  .chat-messages::-webkit-scrollbar { width: 6px; }
  .chat-messages::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 3px; }
  .chat-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

  .welcome-screen {
    display: flex; gap: 12px; align-items: flex-start;
    padding: 8px 0;
  }
  .welcome-robot { font-size: 32px; flex-shrink: 0; margin-top: 4px; }
  .welcome-bubble {
    background: #f9fafb;
    border: 1px solid #eef2ff;
    border-radius: 0 20px 20px 20px;
    padding: 16px 20px;
    color: #1f2937;
    font-size: 14px;
    line-height: 1.6;
  }
  .welcome-bubble strong { color: #111827; font-weight: 700; }
  .welcome-bubble ul { padding-left: 20px; margin: 8px 0; }
  .welcome-bubble li { margin-bottom: 4px; }

  .msg {
    display: flex; gap: 12px; margin-bottom: 20px;
    max-width: 85%; animation: msgIn 0.3s ease;
  }
  @keyframes msgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  .msg.user { margin-left: auto; flex-direction: row-reverse; }
  .msg-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .msg.user .msg-avatar {
    background: #eff6ff;   /* bleu clair */
    border-color: #bfdbfe;
  }
  .msg-bubble {
    padding: 12px 18px; border-radius: 20px;
    font-size: 14px; line-height: 1.55; word-break: break-word;
  }
  .msg.ai .msg-bubble {
    background: #f9fafb;
    border: 1px solid #f0f2f5;
    color: #1f2937;
    border-top-left-radius: 6px;
  }
  .msg.user .msg-bubble {
    background: #2563eb;   /* bleu vif */
    color: white;
    border-top-right-radius: 6px;
    box-shadow: 0 2px 8px rgba(37,99,235,0.2);
  }
  .msg-link { color: #2563eb; text-decoration: none; word-break: break-all; }
  .msg-link:hover { text-decoration: underline; }
  .typing-bubble {
    display: flex; gap: 5px; align-items: center; padding: 12px 18px;
    background: #f9fafb;
    border: 1px solid #f0f2f5;
    border-radius: 20px; border-top-left-radius: 6px;
  }
  .dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #cbd5e1; display: inline-block;
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
    display: flex; flex-wrap: wrap; gap: 10px;
    padding: 16px 20px;
    border-top: 1px solid #f0f0f0;
    justify-content: center;
    background: #ffffff;
  }
  .quick-reply-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 16px;
    border-radius: 30px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    color: #374151;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .quick-reply-btn:hover:not(:disabled) {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #2563eb;
    transform: translateY(-1px);
  }
  .quick-reply-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Bouton flèche – bleu */
  .scroll-to-bottom-btn {
    position: fixed;
    bottom: 120px;
    right: 24px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #2563eb;
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(37,99,235,0.3);
    transition: all 0.3s ease;
    z-index: 1000;
    animation: fadeInUp 0.3s ease;
  }
  .scroll-to-bottom-btn:hover {
    transform: scale(1.1);
    background: #3b82f6;
    box-shadow: 0 6px 20px rgba(37,99,235,0.4);
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 640px) {
    .chat-messages { height: 340px; }
    .hero-stats { gap: 20px; padding: 16px 20px; }
    .stat-num { font-size: 1.4rem; }
    .scroll-to-bottom-btn { bottom: 100px; right: 16px; width: 40px; height: 40px; }
  }
`}</style>
    </div>
  );
}