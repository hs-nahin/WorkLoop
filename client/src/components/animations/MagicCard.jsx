import React from 'react';

const MagicCard = ({ children, className = '' }) => {
  return (
    <div className={`group relative p-px rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01] ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 h-full w-full">
        {children}
      </div>
      <div className="absolute -inset-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
    </div>
  );
};

export default MagicCard;
