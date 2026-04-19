import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { AppContext } from '../../../context/AppContext';
import { MagicCard } from '../../../components/animations/MagicCard';
import { TextHighlighter } from '../../../components/animations/TextHighlighter';
import { GradientText } from '../../../components/animations/GradientText';
import { BlurFade } from '../../../components/animations/BlurFade';
import { NumberTicker } from '../../../components/animations/NumberTicker';
import { TypingAnimation } from '../../../components/animations/TypingAnimation';
import { WordRotate } from '../../../components/animations/WordRotate';
import { apiRequest } from '../../../api/apiClient';

const Dashboard = () => {
  const { user, token } = useContext(AuthContext);
  const { setGlobalLoading } = useContext(AppContext);
  const [stats, setStats] = useState({ totalTasks: 0, pendingTasks: 0, completedTasks: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiRequest({ endpoint: '/tasks', token });
        const total = data.length || 0;
        const pending = data.filter(t => t.status === 'pending').length || 0;
        const completed = data.filter(t => t.status === 'completed').length || 0;
        setStats({ totalTasks: total, pendingTasks: pending, completedTasks: completed });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <TextHighlighter text="Operational Overview" className="text-3xl font-bold tracking-tight" />
          <TypingAnimation text="|" className="text-yellow-400 font-bold" />
        </div>
        <GradientText text={`System ${new WordRotate words={['Ready', 'Optimized', 'Secure']} className="text-yellow-400 font-bold" /> : ${user?.role}`} className="text-sm opacity-70" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BlurFade delay={100}>
          <MagicCard>
            <div className="flex flex-col gap-2">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total Tasks</span>
              <span className="text-4xl font-black text-white">
                <NumberTicker value={stats.totalTasks} />
              </span>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400" style={{ width: '100%' }} />
              </div>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={200}>
          <MagicCard>
            <div className="flex flex-col gap-2">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Pending Action</span>
              <span className="text-4xl font-black text-yellow-400">
                <NumberTicker value={stats.pendingTasks} />
              </span>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400" style={{ width: `${(stats.pendingTasks / (stats.totalTasks || 1)) * 100}%` }} />
              </div>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={300}>
          <MagicCard>
            <div className="flex flex-col gap-2">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Completed</span>
              <span className="text-4xl font-black text-green-400">
                <NumberTicker value={stats.completedTasks} />
              </span>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-green-400" style={{ width: `${(stats.completedTasks / (stats.totalTasks || 1)) * 100}%` }} />
              </div>
            </div>
          </MagicCard>
        </BlurFade>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BlurFade delay={400}>
          <MagicCard className="h-64 flex flex-col justify-center items-center text-center">
            <p className="text-gray-500 text-sm">Quick Actions</p>
            <div className="mt-4 flex gap-3">
              <button className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-bold text-xs hover:scale-105 transition-all">
                Create New Task
              </button>
              <button className="px-4 py-2 rounded-lg bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all">
                View All Reports
              </button>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={500}>
          <MagicCard className="h-64 flex flex-col justify-center items-center text-center">
            <p className="text-gray-500 text-sm">System Health</p>
            <div className="mt-4 flex items-center gap-2 text-green-400 font-mono text-xs">
             <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
             Backend API: Connected
            </div>
          </MagicCard>
        </BlurFade>
      </div>
    </div>
  );
};

export default Dashboard;

