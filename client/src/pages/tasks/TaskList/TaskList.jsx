import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AuthContext } from '../../../context/AuthContext';
import { ToastContext } from '../../../context/ToastContext';
import { AppContext } from '../../../context/AppContext';
import { apiRequest } from '../../../api/apiClient';
import { MagicCard } from '../../../components/animations/MagicCard';
import { TextHighlighter } from '../../../components/animations/TextHighlighter';
import { GradientText } from '../../../components/animations/GradientText';
import { BlurFade } from '../../../components/animations/BlurFade';

const TaskList = () => {
  const { user, token } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext);
  const { setGlobalLoading } = useContext(AppContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest({ endpoint: '/tasks', token });
        setTasks(data);
      } catch (error) {
        addToast(error.message || 'Failed to fetch tasks', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [token, addToast]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <TextHighlighter text="Task Repository" className="text-3xl font-bold tracking-tight" />
          <GradientText text="Track, assign and monitor internal IT operations" className="text-sm opacity-70" />
        </div>
        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => navigate('/tasks/create')}
            className="px-6 py-2 rounded-xl bg-yellow-400 text-black font-bold text-sm hover:scale-105 transition-all"
          >
            + New Task
          </button>
        )}
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tasks.map((task, index) => (
            <BlurFade key={task._id} delay={index * 50}>
              <MagicCard className="cursor-pointer group" onClick={() => navigate(`/tasks/${task._id}`)}>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${getStatusColor(task.status)}`}>
                      {task.status}
                    </div>
                    <span className="text-[10px] font-mono text-gray-500">{task._id.slice(-6).toUpperCase()}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold group-hover:text-yellow-400 transition-colors line-clamp-1">
                    {task.title}
                  </h3>
                  
                  <p className="text-gray-400 text-sm line-clamp-2 h-10 overflow-hidden">
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-yellow-400/20 flex items-center justify-center text-[10px] font-bold text-yellow-400">
                        {task.assignedTo?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-xs text-gray-300">{task.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </MagicCard>
            </BlurFade>
          ))}
          {tasks.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500 italic">
              No tasks found in the repository.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskList;
