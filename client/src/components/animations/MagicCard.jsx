import { useState } from 'react';

const MagicCard = ({ children, className = '' }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className={`relative group overflow-hidden bg-card border border-border rounded-2xl p-6 transition-all duration-300 hover:border-primary/50 ${className}`}
    >
       <div
         className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
         style={{
           background: `radial-gradient(circle 150px at ${mousePos.x}px ${mousePos.y}px, rgba(2, 132, 199, 0.15), transparent)`
         }}
       />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default MagicCard;