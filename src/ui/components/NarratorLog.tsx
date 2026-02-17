import React, { useEffect, useRef } from 'react';

interface NarratorLogProps {
  messages: string[];
}

export const NarratorLog: React.FC<NarratorLogProps> = ({ messages }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) return null;

  const visible = messages.slice(-2); // Show last 2 messages

  return (
    <div className="narrator-log">
      <span className="narrator-label">🎙️</span>
      <div className="narrator-messages" ref={logRef}>
        {visible.map((msg, i) => (
          <div
            key={i}
            className="narrator-msg"
            style={{ opacity: i === visible.length - 1 ? 1 : 0.5 }}
          >
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
};