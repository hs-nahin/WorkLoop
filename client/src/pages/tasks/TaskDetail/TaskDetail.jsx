import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AuthContext } from '../../../context/AuthContext';
import { ToastContext } from '../../../context/ToastContext';
import { apiRequest } from '../../../api/apiClient';
import MagicCard from '../../../components/animations/MagicCard';
import TextHighlighter from '../../../components/animations/TextHighlighter';
import GradientText from '../../../components/animations/GradientText';
import BlurFade from '../../../components/animations/BlurFade';

const TaskDetail = () => {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await apiRequest({ endpoint: `/tasks/${id}`, token });
        setTask(data);
      } catch (error) {
        addToast(error.message || 'Task not found', 'error');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTask();
  }, [id, token, addToast, navigate]);

  const handleSubmitReport = async () => {
    if (!report.trim()) return addToast('Please provide a report', 'warning');
    
    try {
      await apiRequest({ 
        endpoint: `/tasks/${id}/submit`, 
        method: 'PATCH', 
        body: { report }, 
        token 
      });
      addToast('Task submitted for review!', 'success');
      navigate('/dashboard');
    } catch (error) {
      addToast(error.message || 'Submission failed', 'error');
    }
  };

  const handleDecision = async (decision) => {
    try {
      await apiRequest({ 
        endpoint: `/tasks/${id}/decide`, 
        method: 'PATCH', 
        body: { decision }, 
        token 
      });
      addToast(`Task ${decision} successfully`, 'success');
      navigate('/dashboard');
    } catch (error) {
      addToast(error.message || 'Decision failed', 'error');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-yellow-400 font-mono animate-pulse">Loading Task...</div>;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <TextHighlighter text="Task Specifications" className="text-3xl font-bold tracking-tight" />
          <GradientText text={`Reference ID: ${id.slice(-8).toUpperCase()}`} className="text-sm opacity-70" />
        </div>
        <button 
          onClick={() => navigate('/tasks')}
          className="px-4 py-2 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-white/10 transition-all"
        >
          ← Back to Repository
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <BlurFade>
            <MagicCard>
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold">{task.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    task.status === 'completed' ? 'text-green-400 border-green-400/30 bg-green-400/10' :
                    task.status === 'pending' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' :
                    'text-red-400 border-red-400/30 bg-red-400/10'
                  }`}>
                    {task.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Requirement</span>
                  <p className="text-gray-300 leading-relaxed">{task.description}</p>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center gap-4">
                  <div className="text-xs text-gray-500">Assigned To: <span className="text-white font-medium">{task.assignedTo?.name}</span></div>
                  <div className="text-xs text-gray-500">Created: <span className="text-white font-medium">{new Date(task.createdAt).toLocaleDateString()}</span></div>
                </div>
              </div>
            </MagicCard>
          </BlurFade>

          {user?.role === 'IT OFFICER' && task.status === 'pending' && (
            <BlurFade delay={100}>
              <MagicCard>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Submit Work Report</h3>
                  <textarea 
                    value={report}
                    onChange={(e) => setReport(e.target.value)}
                    placeholder="Describe the work performed and results..."
                    className="w-full h-32 p-4 rounded-xl bg-white/5 border border-white/10 focus:border-yellow-400 outline-none transition-all text-sm"
                  />
                  <button 
                    onClick={handleSubmitReport}
                    className="px-6 py-2 rounded-xl bg-yellow-400 text-black font-bold text-sm hover:scale-105 transition-all"
                  >
                    Submit for Review
                  </button>
                </div>
              </MagicCard>
            </BlurFade>
          )}
        </div>

        <div className="space-y-6">
          {user?.role === 'ADMIN' && task.status === 'submitted' && (
            <BlurFade delay={200}>
              <MagicCard>
                <div className="space-y-6">
                  <h3 className="text-lg font-bold">Administrative Review</h3>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 italic text-sm text-gray-400">
                    "{task.report}"
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleDecision('approved')}
                      className="flex-1 p-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold hover:bg-green-500/30 transition-all"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleDecision('rejected')}
                      className="flex-1 p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold hover:bg-red-500/30 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </MagicCard>
            </BlurFade>
          )}
          
          <BlurFade delay={300}>
            <MagicCard>
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Timeline</h3>
              <div className="space-y-4 text-xs">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1" />
                  <div>
                    <p className="text-white font-medium">Task Created</p>
                    <p className="text-gray-500">{new Date(task.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {task.status === 'submitted' && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1" />
                    <div>
                      <p className="text-white font-medium">Report Submitted</p>
                      <p className="text-gray-500">{new Date(task.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </MagicCard>
          </BlurFade>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
