import React from 'react';

const TextHighlighter = ({ text, color = 'bg-yellow-400', className = '', children }) => {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className={`absolute bottom-0 left-0 w-full h-4 ${color} -z-10 opacity-70 transition-all duration-500 rounded-sm`}></span>
      <span className="relative">{text || children}</span>
    </span>
  );
};

export default TextHighlighter;
