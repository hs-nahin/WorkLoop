import React, { useState, useEffect } from 'react';

const TerminalUI = ({ commands = [], initialText = 'Initializing WorkLoop System...' }) => {
  const [text, setText] = useState(initialText);
  const [currentCommandIdx, setCurrentCommandIdx] = useState(0);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (currentCommandIdx < commands.length) {
      const timer = setTimeout(() => {
        setLogs(prev => [...prev, commands[currentCommandIdx]]);
        setCurrentCommandIdx(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentCommandIdx, commands]);

  return (
    <div className="bg-black border border-white/10 rounded-lg overflow-hidden font-mono text-sm shadow-2xl">
      <div className="bg-white/10 px-4 py-2 flex items-center gap-2 border-b border-white/10">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-2 text-gray-400 text-xs">system@workloop: ~</span>
      </div>
      <div className="p-4 h-64 overflow-y-auto space-y-1 scrollbar-hide">
        <div className="text-yellow-400">{text}</div>
        {logs.map((log, i) => (
          <div key={i} className="text-gray-300">
            <span className="text-green-400 mr-2">$</span> {log}
          </div>
        ))}
        <div className="animate-pulse text-white">_</div>
      </div>
    </div>
  );
};

export default TerminalUI;