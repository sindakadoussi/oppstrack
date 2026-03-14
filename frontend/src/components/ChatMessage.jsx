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

export default function ChatMessage({ msg, index }) {
  return (
    <div className={`msg ${msg.sender}`} key={index}>
      {msg.sender === 'ai' && (
        <div className="msg-avatar">
          <span>🤖</span>
        </div>
      )}
      <div className="msg-bubble">
        {renderText(msg.text)}
      </div>
      {msg.sender === 'user' && (
        <div className="msg-avatar user-avatar-msg">
          <span>👤</span>
        </div>
      )}
    </div>
  );
}
