import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ToastContext } from '../../context/ToastContext';
import { apiRequest } from '../../api/apiClient';
import MagicCard from '../../components/animations/MagicCard';
import TextHighlighter from '../../components/animations/TextHighlighter';
import GradientText from '../../components/animations/GradientText';
import BlurFade from '../../components/animations/BlurFade';

const Settings = () => {
  const { token } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext);
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await apiRequest({ endpoint: '/company', token });
        setCompany(data);
      } catch (error) {
        addToast(error.message || 'Failed to fetch settings', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompany();
  }, [token, addToast]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <TextHighlighter text="System Settings" className="text-3xl font-bold tracking-tight" />
        <GradientText text="Configure your workspace and organizational identity" className="text-sm opacity-70" />
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="max-w-2xl">
          <BlurFade>
            <MagicCard>
              <div className="space-y-6">
                <h3 className="text-lg font-bold">Company Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase">Organization Name</label>
                    <input 
                      value={company?.name || ''} 
                      readOnly
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase">Support Email</label>
                    <input 
                      value={company?.email || ''} 
                      readOnly
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none" 
                    />
                  </div>
                </div>
                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <button className="px-6 py-2 rounded-xl bg-yellow-400 text-black font-bold text-sm hover:scale-105 transition-all">
                    Update Settings
                  </button>
                </div>
              </div>
            </MagicCard>
          </BlurFade>
        </div>
      )}
    </div>
  );
};

export default Settings;
