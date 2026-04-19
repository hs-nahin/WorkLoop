import React, { useContext } from 'react';
import { ToastContext } from '../../context/ToastContext';
import { BlurFade } from '../../components/animations/BlurFade';

const ToastContainer = () => {
  const { toasts } = useContext(ToastContext);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <BlurFade key={toast.id} className="pointer-events-auto">
          <div className={`px-4 py-3 rounded-xl backdrop-blur-md border border-white/20 shadow-2xl flex items-center gap-3 min-w-[300px] transition-all duration-300 ${
            toast.type === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            toast.type === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
            toast.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
            'bg-blue-500/20 text-blue-400 border-blue-500/30'
          }`}>
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </BlurFade>
      ))}
    </div>
  );
};

export default ToastContainer;
