import React, { useEffect, useRef } from 'react';

interface NarratorLogProps {
  messages: string[];
}

export const NarratorLog: React.FC<NarratorLogProps> = ({ messages }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollLeft = logRef.current.scrollWidth;
    }
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="narrator-log">
      <span className="narrator-label">🎙️</span>
      <div className="narrator-messages" ref={logRef}>
        {messages.map((msg, i) => (
          <span
            key={i}
            className="narrator-msg"
            style={{ opacity: 0.4 + (0.6 * (i + 1)) / messages.length }}
          >
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
};
