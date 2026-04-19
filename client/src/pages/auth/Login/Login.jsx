import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import { AuthContext } from '../../../context/AuthContext';
import { ToastContext } from '../../../context/ToastContext';
import { MagicCard } from '../../../components/animations/MagicCard';
import { TextHighlighter } from '../../../components/animations/TextHighlighter';
import { GradientText } from '../../../components/animations/GradientText';
import { BlurFade } from '../../../components/animations/BlurFade';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password });
      addToast('Welcome back to WorkLoop!', 'success');
      navigate('/dashboard');
    } catch (error) {
      addToast(error.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />

      <BlurFade>
        <MagicCard className="w-full max-w-md transform transition-all duration-500">
          <div className="text-center mb-10">
            <TextHighlighter 
              text="WORKLOOP" 
              className="text-4xl font-black tracking-tighter italic" 
            />
            <div className="mt-2">
              <GradientText text="Internal IT Task Management" className="text-xs uppercase tracking-widest opacity-60" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 ml-1">EMAIL ADDRESS</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@workloop.com" 
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-yellow-400 outline-none transition-all text-sm placeholder:text-gray-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 ml-1">PASSWORD</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••" 
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-yellow-400 outline-none transition-all text-sm placeholder:text-gray-600"
              />
            </div>

            <button 
              disabled={isLoading}
              className="w-full p-3 rounded-xl bg-yellow-400 text-black font-bold hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                "Enter Workspace"
              )}
            </button>
          </form>
        </MagicCard>
      </BlurFade>
    </div>
  );
};

export default Login;
