import React, { useState, useEffect } from 'react';
import { useTheme } from './Navbar';
import { useT } from '../i18n';

const ChatToggleButton = ({ 
  isOpen, 
  onClick, 
  position = 'bottom-right', 
  offsetX = 24, 
  offsetY = 24,
  showBadge = false,
  badgeCount = 0,
  onBadgeClick = null 
}) => {
  const { theme } = useTheme();
  const { t, lang } = useT();
  const [isHovered, setIsHovered] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  // Positions personnalisables
  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-left':
        return { bottom: offsetY, left: offsetX };
      case 'top-right':
        return { top: offsetY, right: offsetX };
      case 'top-left':
        return { top: offsetY, left: offsetX };
      default:
        return { bottom: offsetY, right: offsetX };
    }
  };

  // Arrêter la pulsation après quelques secondes
  useEffect(() => {
    if (!isOpen && showPulse) {
      const timer = setTimeout(() => setShowPulse(false), 10000);
      return () => clearTimeout(timer);
    }
    setShowPulse(true);
  }, [isOpen, showPulse]);

  // Couleurs alignées sur le design system professionnel
  const getButtonStyles = () => {
    if (theme === 'dark') {
      return {
        background: isHovered ? '#4c9fd9' : '#2a6b9e',
        color: '#f2efe7',
        boxShadow: isHovered 
          ? '0 8px 24px rgba(76, 159, 217, 0.3)'
          : '0 4px 16px rgba(42, 107, 158, 0.2)',
        badgeBg: '#9e2a2a',
        badgeColor: '#f2efe7',
        border: '1px solid rgba(76, 159, 217, 0.2)',
      };
    }
    return {
      background: isHovered ? '#004f8a' : '#0066b3',
      color: '#faf8f3',
      boxShadow: isHovered
        ? '0 8px 24px rgba(0, 102, 179, 0.25)'
        : '0 4px 16px rgba(0, 102, 179, 0.15)',
      badgeBg: '#9e2a2a',
      badgeColor: '#faf8f3',
      border: '1px solid rgba(0, 102, 179, 0.15)',
    };
  };

  const buttonStyle = getButtonStyles();

  // Tooltip text selon la langue
  const tooltipText = isOpen 
    ? (lang === 'fr' ? "Fermer l'assistant" : "Close assistant")
    : (lang === 'fr' ? "Assistant IA" : "AI Assistant");

  // Texte du badge
  const getBadgeText = () => {
    if (badgeCount > 99) return '99+';
    return badgeCount.toString();
  };

  // Icône du bouton (sans emoji)
  const ButtonIcon = () => (
    <svg 
      width={isOpen ? 22 : 26} 
      height={isOpen ? 22 : 26} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{
        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      }}
    >
      {isOpen ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="9" y1="10" x2="15" y2="10" />
        </>
      )}
    </svg>
  );

  return (
    <>
      <button
        onClick={onClick}
        className={`chat-toggle-btn ${!isOpen && showPulse ? 'pulse-animation' : ''}`}
        style={{
          position: 'fixed',
          ...getPositionStyles(),
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: buttonStyle.background,
          border: buttonStyle.border,
          boxShadow: buttonStyle.boxShadow,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: buttonStyle.color,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
          transform: isHovered ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={tooltipText}
        aria-label={tooltipText}
      >
        <ButtonIcon />
      </button>

      {/* Badge de notification */}
      {showBadge && badgeCount > 0 && !isOpen && (
        <div
          onClick={onBadgeClick}
          style={{
            position: 'fixed',
            ...getPositionStyles(),
            top: position.includes('top') ? offsetY - 10 : 'auto',
            bottom: position.includes('bottom') ? offsetY + 40 : 'auto',
            left: position.includes('left') ? offsetX + 40 : 'auto',
            right: position.includes('right') ? offsetX - 10 : 'auto',
            minWidth: 22,
            height: 22,
            borderRadius: 22,
            background: buttonStyle.badgeBg,
            color: buttonStyle.badgeColor,
            fontSize: 10,
            fontWeight: 600,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            letterSpacing: '-0.3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            cursor: onBadgeClick ? 'pointer' : 'default',
            zIndex: 1001,
            boxShadow: '0 2px 8px rgba(158, 42, 42, 0.3)',
            animation: 'badgeFadeIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            border: `2px solid ${theme === 'dark' ? '#1a1912' : '#ffffff'}`,
          }}
        >
          {getBadgeText()}
        </div>
      )}

      <style>{`
        @keyframes chatPulse {
          0% {
            box-shadow: 0 4px 16px rgba(0, 102, 179, 0.15), 0 0 0 0 rgba(0, 102, 179, 0.4);
          }
          50% {
            box-shadow: 0 4px 16px rgba(0, 102, 179, 0.15), 0 0 0 10px rgba(0, 102, 179, 0);
          }
          100% {
            box-shadow: 0 4px 16px rgba(0, 102, 179, 0.15), 0 0 0 0 rgba(0, 102, 179, 0);
          }
        }
        
        @keyframes badgeFadeIn {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .chat-toggle-btn {
          backdrop-filter: ${theme === 'dark' ? 'blur(8px)' : 'none'};
        }
        
        .chat-toggle-btn.pulse-animation {
          animation: chatPulse 2s ease-in-out infinite;
        }
        
        .chat-toggle-btn:hover {
          animation: none;
        }

        .chat-toggle-btn:active {
          transform: scale(0.96) !important;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .chat-toggle-btn.pulse-animation,
          .chat-toggle-btn,
          .chat-toggle-btn svg {
            animation: none !important;
            transition: none !important;
          }
        }

        @media (max-width: 768px) {
          .chat-toggle-btn {
            width: 52px !important;
            height: 52px !important;
          }
        }
      `}</style>
    </>
  );
};

export default ChatToggleButton;