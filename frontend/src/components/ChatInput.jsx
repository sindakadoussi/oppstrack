// ChatInput.js
import React, { useState, useRef, useEffect } from 'react';

export default function ChatInput({ input, setInput, onSend, loading }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const textareaRef = useRef(null);

  // Support Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const hasSpeechSupport = !!SpeechRecognition;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Nettoyer le timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const startRecording = () => {
    if (!hasSpeechSupport) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome, Edge ou Safari.");
      return;
    }

    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 1;

      let finalTranscript = '';
      
      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setRecordingTime(0);
        
        // Timer pour afficher la durée
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      };

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Afficher le texte en temps réel
        const displayText = finalTranscript + interimTranscript;
        setInput(displayText.trim());
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecording();
        
        if (event.error === 'not-allowed') {
          alert("Veuillez autoriser l'accès au microphone pour utiliser la dictée vocale.");
        }
      };

      recognitionRef.current.onend = () => {
        stopRecording();
      };

      recognitionRef.current.start();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert("Impossible de démarrer l'enregistrement. Vérifiez les permissions du microphone.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    
    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !loading) {
        onSend();
      }
    }
  };

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={isRecording ? "🎤 Écoute en cours..." : "Écrivez votre message..."}
          disabled={loading || isRecording}
          rows={1}
        />
        
        {/* Bouton d'enregistrement vocal */}
        {hasSpeechSupport && (
          <button
            className={`voice-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
            title={isRecording ? "Arrêter l'enregistrement" : "Dictée vocale"}
          >
            {isRecording ? (
              <>
                <span className="recording-dot"></span>
                <span className="recording-time">{formatTime(recordingTime)}</span>
              </>
            ) : (
              <span className="voice-icon">🎤</span>
            )}
          </button>
        )}
        
        {/* Bouton d'envoi */}
        <button
          className="send-btn"
          onClick={onSend}
          disabled={!input.trim() || loading}
        >
          {loading ? '...' : '➤'}
        </button>
      </div>
      
      <style>{`
        .chat-input-wrapper {
          padding: 12px 16px;
          border-top: 1px solid rgba(99,102,241,0.1);
          background: rgb(255, 255, 255);
        }
        
        .chat-input-container {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          border-radius: 24px;
          padding: 8px 12px;
          border: 1px solid rgba(99,102,241,0.2);
          transition: all 0.2s;
        }
        
        .chat-input-container:focus-within {
          border-color: rgba(99,102,241,0.6);
          box-shadow: 0 0 0 2px rgba(99,102,241,0.1);
        }
        
        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #0b0b0b;
          font-size: 14px;
          line-height: 1.5;
          padding: 8px 4px;
          resize: none;
          font-family: inherit;
          max-height: 120px;
        }
        
        .chat-input:focus {
          outline: none;
        }
        
        .chat-input::placeholder {
          color: #475569;
        }
        
        .chat-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .voice-btn {
          background: rgba(99,102,241,0.2);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        
        .voice-btn:hover:not(:disabled) {
          background: rgba(99,102,241,0.4);
          transform: scale(1.05);
        }
        
        .voice-btn.recording {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border-color: #ef4444;
          animation: pulseRed 1.5s infinite;
        }
        
        .voice-icon {
          font-size: 18px;
        }
        
        .recording-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: blink 1s infinite;
        }
        
        .recording-time {
          font-size: 11px;
          font-weight: 600;
          color: white;
          margin-left: 4px;
        }
        
        @keyframes pulseRed {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239,68,68,0.7);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(239,68,68,0);
          }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        .send-btn {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          font-size: 16px;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        
        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(79,70,229,0.4);
        }
        
        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}