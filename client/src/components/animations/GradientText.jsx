import React from 'react';

const GradientText = ({ text, className = '' }) => {
  return (
    <span className={`font-bold bg-gradient-to-r from-white via-yellow-400 to-white bg-clip-text text-transparent animate-gradient-x ${className}`}>
      {text}
    </span>
  );
};

export default GradientText;
