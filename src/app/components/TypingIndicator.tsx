import React from 'react';
import './TypingIndicator.css';

interface TypingIndicatorProps {
  isVisible: boolean;
  userName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible, userName }) => {
  if (!isVisible) return null;

  return (
    <div className="typing-indicator">
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      {userName && <span className="typing-text">{userName} is typing...</span>}
    </div>
  );
};
