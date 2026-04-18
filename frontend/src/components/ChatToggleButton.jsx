import React from 'react';

const ChatToggleButton = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: '#f5a623',
        border: 'none',
        boxShadow: '0 4px 12px rgba(26,58,107,0.3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        color: '#255cae',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1000,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.background = '#e89510';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.background = '#f5a623';
      }}
      title={isOpen ? "Fermer l'assistant" : "Besoin d'aide ?"}
    >
      <span style={{ 
        display: 'flex',
        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease'
      }}>
        {isOpen ? '✕' : '💬'}
      </span>
    </button>
  );
};

export default ChatToggleButton;