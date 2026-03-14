import React from 'react';

export default function ChatInput({ input, setInput, onSend, loading, placeholder = "Écris ta question..." }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chat-input-wrap">
      <textarea
        className="chat-textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={loading}
        rows={1}
        style={{ resize: 'none', overflowY: 'hidden' }}
        onInput={(e) => {
          e.target.style.height = 'auto';
          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        }}
      />
      <button
        className="send-btn"
        onClick={() => onSend()}
        disabled={loading || !input.trim()}
      >
        {loading ? (
          <span className="send-spinner"></span>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        )}
      </button>

      <style>{`
        .chat-input-wrap {
          display: flex; gap: 10px; align-items: flex-end;
          padding: 12px 16px;
          background: rgba(255,255,255,0.03);
          border-top: 1px solid rgba(99,102,241,0.15);
          border-radius: 0 0 16px 16px;
        }
        .chat-textarea {
          flex: 1; padding: 12px 16px; border-radius: 12px;
          border: 1px solid rgba(99,102,241,0.25);
          background: rgba(255,255,255,0.05);
          color: #e2e8f0; font-size: 14px; font-family: inherit;
          outline: none; line-height: 1.5; transition: border-color 0.2s;
        }
        .chat-textarea:focus { border-color: rgba(99,102,241,0.6); }
        .chat-textarea:disabled { opacity: 0.5; cursor: not-allowed; }
        .chat-textarea::placeholder { color: #475569; }
        .send-btn {
          width: 42px; height: 42px; flex-shrink: 0;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none; border-radius: 12px; color: white;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; box-shadow: 0 4px 12px rgba(99,102,241,0.4);
        }
        .send-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.5); }
        .send-btn:disabled { background: #1e293b; box-shadow: none; cursor: not-allowed; opacity: 0.5; }
        .send-spinner {
          width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
