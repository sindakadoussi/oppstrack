import React from 'react';

// Sous-composant pour la carte de bourse
function BourseCard({ bourse }) {
  return (
    <div className="bourse-card">
      <div className="card-tag">{bourse.pays || 'International'}</div>
      <h4 className="card-title">{bourse.nom}</h4>
      <div className="card-details">
        <div className="card-detail-item">
          <span className="icon">💰</span>
          <span>{bourse.financement}</span>
        </div>
        <div className="card-detail-item">
          <span className="icon">🎓</span>
          <span>{bourse.niveau}</span>
        </div>
      </div>
      <a href={bourse.lien} target="_blank" rel="noreferrer" className="card-action-btn">
        Voir le détail
      </a>
    </div>
  );
}

function renderText(text) {
  if (!text) return null;
  const parts = text.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*|\n)/g);
  return parts.map((part, i) => {
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return <a key={i} href={linkMatch[2]} target="_blank" rel="noreferrer" className="msg-link">{linkMatch[1]}</a>;
    }
    const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
    if (boldMatch) return <strong key={i}>{boldMatch[1]}</strong>;
    if (part === '\n') return <br key={i} />;
    return part;
  });
}

export default function ChatMessage({ msg, index, showVoiceBadge }) {
  const isUser = msg.sender === 'user';
  const isVoiceInput = showVoiceBadge && isUser;
  // On vérifie si le message contient une liste de bourses
  const hasBourses = msg.sender === 'ai' && msg.bourses && msg.bourses.length > 0;

  return (
    <div className={`msg-container ${msg.sender}`} key={index}>
      <div className={`msg ${msg.sender}`}>
        {msg.sender === 'ai' && (
          <div className="msg-avatar">
            <span>🤖</span>
          </div>
        )}
        <div className="msg-bubble">
          {isVoiceInput && (
            <div className="voice-badge">
              <span className="voice-icon">🎤</span>
              <span>Dictée vocale</span>
            </div>
          )}
          <div className="bubble-text">
            {renderText(msg.text)}
          </div>
        </div>
        {msg.sender === 'user' && (
          <div className="msg-avatar user-avatar-msg">
            <span>👤</span>
          </div>
        )}
      </div>

      {/* Affichage des cartes de bourses si elles existent */}
      {hasBourses && (
        <div className="bourses-carousel">
          {msg.bourses.map((bourse, bIdx) => (
            <BourseCard key={bIdx} bourse={bourse} />
          ))}
        </div>
      )}

      <style>{`
        .msg-container {
          display: flex;
          flex-direction: column;
          margin-bottom: 20px;
          animation: fadeIn 0.3s ease;
        }

        .msg {
          display: flex;
          gap: 10px;
          max-width: 85%;
        }
        
        .msg.user { margin-left: auto; flex-direction: row; }

        /* CARROUSEL DE BOURSES */
        .bourses-carousel {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 10px 0 10px 44px; /* Alignement avec la bulle de l'IA */
          scrollbar-width: none; /* Firefox */
        }
        .bourses-carousel::-webkit-scrollbar { display: none; }

        /* CARTE INDIVIDUELLE */
        .bourse-card {
          min-width: 220px;
          max-width: 220px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: transform 0.2s ease;
        }
        .bourse-card:hover {
          transform: translateY(-3px);
          border-color: #255cae;
          box-shadow: 0 6px 16px rgba(26,58,107,0.1);
        }

        .card-tag {
          font-size: 10px;
          font-weight: 700;
          color: #255cae;
          background: #eff6ff;
          padding: 3px 8px;
          border-radius: 4px;
          width: fit-content;
          text-transform: uppercase;
        }

        .card-title {
          font-size: 14px;
          font-weight: 700;
          margin: 10px 0;
          color: #1e293b;
          line-height: 1.4;
          height: 40px; /* Force l'alignement */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 15px;
        }

        .card-detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #64748b;
        }

        .card-action-btn {
          margin-top: auto;
          text-align: center;
          background: #255cae;
          color: white;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          padding: 8px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .card-action-btn:hover { background: #f5a623; }

        /* RESTE DU STYLE EXISTANT */
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
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .msg-link { color: #255cae; text-decoration: underline; font-weight: 600; }
        strong { color: #255cae; font-weight: 700; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}