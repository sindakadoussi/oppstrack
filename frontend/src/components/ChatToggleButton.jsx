import React, { useState, useEffect } from 'react';
import { useTheme } from './Navbar';  // ← Correction : chemin relatif correct
import { useT } from '../i18n';       // ← Ajustez selon votre chemin

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

  // Couleurs dynamiques selon le thème
  const getButtonStyles = () => {
    if (theme === 'dark') {
      return {
        background: isHovered ? '#e89510' : '#f5a623',
        color: '#0f172a',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        badgeBg: '#ef4444',
        badgeColor: '#ffffff',
      };
    }
    return {
      background: isHovered ? '#e89510' : '#f5a623',
      color: '#255cae',
      boxShadow: '0 4px 12px rgba(26,58,107,0.3)',
      badgeBg: '#ef4444',
      badgeColor: '#ffffff',
    };
  };

  const buttonStyle = getButtonStyles();

  // Tooltip text selon la langue
  const tooltipText = isOpen 
    ? (lang === 'fr' ? "Fermer l'assistant" : "Close assistant")
    : (lang === 'fr' ? "Besoin d'aide ?" : "Need help?");

  // Texte du badge
  const getBadgeText = () => {
    if (badgeCount > 99) return '99+';
    return badgeCount.toString();
  };

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
          border: 'none',
          boxShadow: buttonStyle.boxShadow,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          color: buttonStyle.color,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={tooltipText}
        aria-label={tooltipText}
      >
        <span style={{ 
          display: 'flex',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {isOpen ? '✕' : '💬'}
        </span>
      </button>

      {/* Badge de notification */}
      {showBadge && badgeCount > 0 && !isOpen && (
        <div
          onClick={onBadgeClick}
          style={{
            position: 'fixed',
            ...getPositionStyles(),
            top: position.includes('top') ? offsetY + 40 : 'auto',
            bottom: position.includes('bottom') ? offsetY + 40 : 'auto',
            left: position.includes('left') ? offsetX + 40 : 'auto',
            right: position.includes('right') ? offsetX + 40 : 'auto',
            transform: 'translate(50%, -50%)',
            minWidth: 20,
            height: 20,
            borderRadius: 20,
            background: buttonStyle.badgeBg,
            color: buttonStyle.badgeColor,
            fontSize: 11,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            cursor: onBadgeClick ? 'pointer' : 'default',
            zIndex: 1001,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            animation: 'badgeBounce 0.5s ease',
          }}
        >
          {getBadgeText()}
        </div>
      )}

      <style>{`
        @keyframes chatPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(245, 166, 35, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(245, 166, 35, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(245, 166, 35, 0);
          }
        }
        
        @keyframes badgeBounce {
          0% {
            transform: translate(50%, -50%) scale(0);
          }
          50% {
            transform: translate(50%, -50%) scale(1.2);
          }
          100% {
            transform: translate(50%, -50%) scale(1);
          }
        }
        
        .chat-toggle-btn.pulse-animation {
          animation: chatPulse 2s infinite;
        }
        
        .chat-toggle-btn:hover {
          animation: none;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .chat-toggle-btn.pulse-animation,
          .chat-toggle-btn,
          .chat-toggle-btn span {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default ChatToggleButton;