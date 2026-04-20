import React from 'react';

const Input = ({ label, error, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</label>}
      <input
        {...props}
        className={`
          bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white 
          transition-all duration-200 outline-none
          focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30
          ${error ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}
          ${props.className || ''}
        `}
      />
      {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
    </div>
  );
};

export default Input;