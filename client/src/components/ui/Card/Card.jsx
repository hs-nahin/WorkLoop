import React from 'react';

const Card = ({ children, className = '', hoverable = false }) => {
  return (
    <div className={`
      bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden
      ${hoverable ? 'transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default Card;