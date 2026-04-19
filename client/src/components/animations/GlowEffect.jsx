import React from 'react';

const GlowEffect = ({ children, color = 'yellow', className = '' }) => {
  const glowColor = {
    yellow: 'shadow-[0_0_40px_-10px_rgba(250,204,21,0.3)]',
    blue: 'shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]',
    red: 'shadow-[0_0_40px_-10px_rgba(239,68,68,0.3)]',
  }[color] || 'shadow-[0_0_40px_-10px_rgba(250,204,21,0.3)]';

  return (
    <div className={`relative ${className}`}>
      <div className={`absolute inset-0 blur-3xl opacity-20 ${glowColor} -z-10`} />
      {children}
    </div>
  );
};

export default GlowEffect;
