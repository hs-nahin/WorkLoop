import { useEffect, useState } from 'react';

const TypingAnimation = ({ text, speed = 100, delay = 0 }) => {
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (index < text.length) {
        setDisplayText((prev) => prev + text.charAt(index));
        setIndex((prev) => prev + 1);
      }
    }, index === 0 ? speed + delay : speed);

    return () => clearTimeout(timer);
  }, [index, text, speed, delay]);

  return (
    <span className="font-mono">
      {displayText}
      <span className="animate-blink ml-1">|</span>
    </span>
  );
};

export default TypingAnimation;