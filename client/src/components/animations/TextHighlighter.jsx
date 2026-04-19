import React from 'react';

const TextHighlighter = ({ text, color = '#ff0', className = '' }) => {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="absolute bottom-0 left-0 w-full h-full bg-yellow-400 -z-10 animate-pulse rounded" style={{ opacity: '0.3' }}></span>
      <span className="relative">{text}</span>
    </span>
  );
};

export default TextHighlighter;
