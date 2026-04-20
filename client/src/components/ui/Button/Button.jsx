import React from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', disabled = false }) => {
  const variants = {
    primary: 'bg-yellow-400 text-black hover:bg-yellow-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]',
    secondary: 'bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30',
    ghost: 'bg-transparent text-gray-400 hover:text-white'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all duration-200 
        active:scale-95 disabled:opacity-50 disabled:pointer-events-none
        ${variants[variant]} 
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;