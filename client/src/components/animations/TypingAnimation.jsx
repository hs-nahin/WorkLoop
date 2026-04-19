import React from 'react';

const TypingAnimation = ({ text, speed = 50, delay = 0, className = '' }) => {
  const [displayText, setDisplayText] = React.useState('');

  React.useEffect(() => {
    let currentIndex = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayText((prev) => prev + text.charAt(currentIndex));
        currentIndex++;
        if (currentIndex >= text.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, speed, delay]);

  return <<spanspan className={className}>{displayText}</span>;
};

export default TypingAnimation;
