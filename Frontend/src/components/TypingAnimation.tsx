import React, { useState, useEffect } from 'react';
import './TypingAnimation.css';

interface TypingAnimationProps {
  text: string;
  speed?: number; // milliseconds per character
  onComplete?: () => void;
  className?: string;
}

const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  speed = 3, // Default speed: 3ms per character (moderate speed)
  onComplete,
  className = '',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        // For very long messages, process multiple characters at once
        // The longer the message, the more characters we process at once, but at a more moderate pace
        const charsToProcess = Math.max(1, Math.floor(text.length / 200));
        const endIndex = Math.min(currentIndex + charsToProcess, text.length);
        const nextChunk = text.substring(currentIndex, endIndex);

        // Add next chunk of characters
        setDisplayedText(prev => prev + nextChunk);
        setCurrentIndex(prev => prev + nextChunk.length);

        // Trigger a scroll event to ensure auto-scrolling during typing
        window.dispatchEvent(new CustomEvent('typingProgress'));
      }, speed);

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentIndex, text, speed, isComplete, onComplete]);

  // Split text into words to add proper spacing
  const words = displayedText.split(' ');

  return (
    <div className={className}>
      {words.map((word, index) => (
        <React.Fragment key={index}>
          {index > 0 && ' '}
          <span>{word}</span>
        </React.Fragment>
      ))}
      {!isComplete && <span className="typing-cursor">|</span>}
    </div>
  );
};

export default TypingAnimation;
