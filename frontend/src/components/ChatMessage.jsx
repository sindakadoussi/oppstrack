import React from 'react';

function renderText(text) {
  if (!text) return null;
  // Split on markdown links, bold, line breaks
  const parts = text.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*|\n)/g);
  return parts.map((part, i) => {
    // Markdown link
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return <a key={i} href={linkMatch[2]} target="_blank" rel="noreferrer" className="msg-link">{linkMatch[1]}</a>;
    }
    // Bold
    const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
    if (boldMatch) return <strong key={i}>{boldMatch[1]}</strong>;
    // Line break
    if (part === '\n') return <br key={i} />;
    return part;
  });
}

export default function ChatMessage({ msg, index, showVoiceBadge }) {
  // Déterminer si c'est un message utilisateur et si c'est une dictée vocale
  const isUser = msg.sender === 'user';
  const isVoiceInput = showVoiceBadge && isUser;
  
  return (
    <div className={`msg ${msg.sender}`} key={index}>
      {msg.sender === 'ai' && (
        <div className="msg-avatar">
          <span>🤖</span>
        </div>
      )}
      <div className="msg-bubble">
        {/* Badge dictée vocale pour les messages utilisateur */}
        {isVoiceInput && (
          <div className="voice-badge">
            <span className="voice-icon">🎤</span>
            <span>Dictée vocale</span>
          </div>
        )}
        {renderText(msg.text)}
      </div>
      {msg.sender === 'user' && (
        <div className="msg-avatar user-avatar-msg">
          <span>👤</span>
        </div>
      )}
      
      <style>{`
        .voice-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.15);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          color: #10b981;
          margin-bottom: 8px;
          width: fit-content;
          border: 1px solid rgba(16, 185, 129, 0.3);
          animation: fadeIn 0.3s ease;
        }
        
        .voice-icon {
          font-size: 12px;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .msg-link {
          color: #818cf8;
          text-decoration: none;
          word-break: break-all;
        }
        
        .msg-link:hover {
          text-decoration: underline;
        }
        
        strong {
          color: #c084fc;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}