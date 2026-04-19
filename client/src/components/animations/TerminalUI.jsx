import React from 'react';

const TerminalUI = ({ commands = [], theme = 'dark', className = '' }) => {
  return (
    <div className={`font-mono text-xs rounded-xl overflow-hidden border border-white/10 ${className}`}>
      <div className="bg-white/10 px-4 py-2 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-gray-500 uppercase tracking-tighter">workloop-terminal v1.0</span>
      </div>
      <div className="bg-black/80 p-4 space-y-2 h-64 overflow-y-auto">
        {commands.map((cmd, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-green-400">guest@workloop:~$</span>
            <span className="text-white">{cmd}</span>
          </div>
        ))}
        <div className="flex gap-2">
          <span className="text-green-400">guest@workloop:~$</span>
          <span className="w-2 h-4 bg-yellow-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default TerminalUI;
