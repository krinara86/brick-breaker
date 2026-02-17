import React from 'react';

interface NarratorOverlayProps {
  text: string;
}

export const NarratorOverlay: React.FC<NarratorOverlayProps> = ({ text }) => {
  if (!text) return null;

  return (
    <div className="narrator-overlay">
      {text}
    </div>
  );
};
