import React from 'react';

const WordRotate = ({ words, duration = 2000, className = '' }) => {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, duration);
    return () => clearInterval(interval);
  }, [words, duration]);

  return (
    <span className={`inline-block transition-all duration-500 ${className}`}>
      {words[index]}
    </span>
  );
};

export default WordRotate;
