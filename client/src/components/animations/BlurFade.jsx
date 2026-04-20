import React from 'react';

const BlurFade = ({ children, duration = 0.5, delay = 0 }) => {
  return (
    <div 
      className="animate-blur-fade" 
      style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
};

export default BlurFade;