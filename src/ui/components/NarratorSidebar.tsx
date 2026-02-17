import React, { useEffect, useRef } from 'react';

interface NarratorSidebarProps {
  messages: string[];
}

export const NarratorSidebar: React.FC<NarratorSidebarProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="narrator-sidebar">
      <div className="narrator-header">
        <span className="narrator-icon">🎙️</span>
        <span>Narrator</span>
      </div>
      <div className="narrator-feed">
        {messages.length === 0 && (
          <div className="narrator-empty">
            Commentary will appear here as you play...
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className="narrator-bubble"
            style={{ opacity: 0.35 + (0.65 * (i + 1)) / messages.length }}
          >
            {msg}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
