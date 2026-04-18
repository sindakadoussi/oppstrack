// src/pages/GuestPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useT } from '../i18n';

export default function GuestPage({ bourses = [], onSignup, setView }) {
  const { lang } = useT();
  const [step, setStep] = useState('start');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [recommended, setRecommended] = useState([]);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const questions = [
    { id: 'level', textFr: 'Quel est ton niveau d’études actuel ?', textEn: 'Your current study level?', options: ['Baccalauréat', 'Licence', 'Master', 'Doctorat', 'Autre'] },
    { id: 'field', textFr: 'Ton domaine d’études ?', textEn: 'Your field of study?', options: ['Informatique', 'Ingénierie', 'Médecine', 'Commerce', 'Droit', 'Autre'] },
    { id: 'country', textFr: 'Pays de destination souhaité ?', textEn: 'Preferred country?', options: ['France', 'Allemagne', 'Canada', 'Suisse', 'Peu importe', 'Autre'] },
  ];

  useEffect(() => {
    if (step === 'start') {
      setMessages([
        { sender: 'ai', text: lang === 'fr' ? '👋 Bonjour ! Je vais te poser 3 questions pour te trouver les meilleures bourses. Commençons ?' : '👋 Hi! I’ll ask you 3 questions to find the best scholarships. Ready?' }
      ]);
    }
  }, [step, lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startQuiz = () => {
    setStep('quiz');
    setCurrentQIndex(0);
    const firstQ = questions[0];
    setMessages(prev => [...prev, { sender: 'ai', text: lang === 'fr' ? firstQ.textFr : firstQ.textEn, options: firstQ.options }]);
  };

  const handleAnswer = (answer) => {
    const currentQ = questions[currentQIndex];
    const newAnswers = { ...answers, [currentQ.id]: answer };
    setAnswers(newAnswers);
    setMessages(prev => [...prev, { sender: 'user', text: answer }]);

    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex(currentQIndex + 1);
      const nextQ = questions[currentQIndex + 1];
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'ai', text: lang === 'fr' ? nextQ.textFr : nextQ.textEn, options: nextQ.options }]);
      }, 300);
    } else {
      // Calcul des bourses recommandées
      const scored = bourses.map(b => {
        let score = 0;
        if (newAnswers.level && (b.niveau || '').toLowerCase().includes(newAnswers.level.toLowerCase())) score += 35;
        if (newAnswers.field && (b.domaine || '').toLowerCase().includes(newAnswers.field.toLowerCase())) score += 30;
        if (newAnswers.country !== 'Peu importe' && (b.pays || '').toLowerCase().includes(newAnswers.country.toLowerCase())) score += 25;
        return { ...b, score };
      }).filter(b => b.score > 20).sort((a,b) => b.score - a.score).slice(0, 3);
      setRecommended(scored);
      setStep('result');

      setTimeout(() => {
        let msg = lang === 'fr'
          ? `🎉 Voici les ${scored.length} bourse${scored.length > 1 ? 's' : ''} qui te correspondent le mieux :`
          : `🎉 Here are the ${scored.length} scholarship${scored.length !== 1 ? 's' : ''} that best match you:`;
        setMessages(prev => [...prev, { sender: 'ai', text: msg }]);
      }, 300);
    }
  };

  const handleOtherClick = () => {
    const currentQ = questions[currentQIndex];
    const promptMsg = lang === 'fr' ? `Veuillez saisir votre ${currentQ.id === 'level' ? 'niveau' : currentQ.id === 'field' ? 'domaine' : 'pays'} :` : `Please enter your ${currentQ.id === 'level' ? 'level' : currentQ.id === 'field' ? 'field' : 'country'}:`;
    const userInput = window.prompt(promptMsg);
    if (userInput && userInput.trim() !== '') {
      handleAnswer(userInput.trim());
    }
  };

  const reset = () => {
    setStep('start');
    setCurrentQIndex(0);
    setAnswers({});
    setRecommended([]);
    setMessages([]);
  };

  return (
    <div className="guest-chat">
      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.sender}`}>
              {msg.sender === 'ai' && <div className="avatar">🤖</div>}
              <div className="bubble">
                <div>{msg.text}</div>
                {msg.options && (
                  <div className="quick-replies">
                    {msg.options.map(opt => (
                      opt === 'Autre' ? (
                        <button key={opt} className="other-btn" onClick={handleOtherClick}>
                          {lang === 'fr' ? '✏️ Autre' : '✏️ Other'}
                        </button>
                      ) : (
                        <button key={opt} onClick={() => handleAnswer(opt)}>
                          {opt}
                        </button>
                      )
                    ))}
                  </div>
                )}
              </div>
              {msg.sender === 'user' && <div className="avatar user">👤</div>}
            </div>
          ))}
          {step === 'result' && recommended.length > 0 && (
            <div className="cards">
              {recommended.map(b => (
                <div key={b.id} className="card">
                  <h4>{b.nom}</h4>
                  <p>{b.pays} • {b.financement || 'Financement variable'}</p>
                  <button className="cta" onClick={onSignup}>
                    {lang === 'fr' ? '🔐 Créer un compte pour postuler' : '🔐 Sign up to apply'}
                  </button>
                </div>
              ))}
              <button className="reset-btn" onClick={reset}>
                {lang === 'fr' ? '← Refaire le test' : '← Restart quiz'}
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {step === 'start' && (
          <div className="start-area">
            <button className="start-btn" onClick={startQuiz}>
              {lang === 'fr' ? 'Commencer le quiz →' : 'Start quiz →'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .guest-chat {
          min-height: 100vh;
          background: #f8f9fc;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          font-family: system-ui, 'Segoe UI', sans-serif;
        }
        .chat-container {
          max-width: 700px;
          width: 100%;
          background: white;
          border-radius: 28px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 80vh;
        }
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .message {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .message.user {
          flex-direction: row-reverse;
        }
        .avatar {
          width: 36px;
          height: 36px;
          background: #eff6ff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .avatar.user {
          background: #255cae;
          color: white;
        }
        .bubble {
          max-width: 80%;
          background: #f1f5f9;
          border-radius: 20px;
          padding: 10px 16px;
          color: #255cae;
          line-height: 1.4;
        }
        .message.user .bubble {
          background: #255cae;
          color: white;
        }
        .quick-replies {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .quick-replies button {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 40px;
          padding: 6px 14px;
          font-size: 13px;
          cursor: pointer;
          transition: 0.2s;
        }
        .quick-replies button:hover {
          background: #f5a623;
          border-color: #f5a623;
          color: #255cae;
        }
        .other-btn {
          background: #fef3c7 !important;
          border-color: #f5a623 !important;
        }
        .start-area {
          padding: 1rem 1.5rem 1.5rem;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .start-btn {
          background: #f5a623;
          border: none;
          border-radius: 40px;
          padding: 12px 28px;
          font-weight: bold;
          font-size: 1rem;
          cursor: pointer;
        }
        .cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }
        .card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1rem;
        }
        .card h4 { margin: 0 0 4px; font-size: 1rem; }
        .card p { margin: 0 0 12px; font-size: 0.8rem; color: #64748b; }
        .cta {
          width: 100%;
          background: #255cae;
          color: white;
          border: none;
          border-radius: 40px;
          padding: 10px;
          font-weight: 600;
          cursor: pointer;
        }
        .reset-btn {
          background: none;
          border: none;
          color: #64748b;
          margin-top: 8px;
          cursor: pointer;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}