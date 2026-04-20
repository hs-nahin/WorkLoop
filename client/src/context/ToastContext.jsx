import React, { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`
              px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl 
              transition-all duration-300 animate-in slide-in-from-right-full fade-in
              ${
                toast.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                toast.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                'bg-blue-500/10 border-blue-500/30 text-blue-400'
              }
            `}
          >
            <p className="text-xs font-medium">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
