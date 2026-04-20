import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import { AuthContext } from '../../../context/AuthContext';
import { AppContext } from '../../../context/AppContext';
import { apiRequest } from '../../../api/apiClient';
import MagicCard from '../../../components/animations/MagicCard';
import TextHighlighter from '../../../components/animations/TextHighlighter';
import GradientText from '../../../components/animations/GradientText';
import BlurFade from '../../../components/animations/BlurFade';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/ui/Modal/Modal';
import Input from '../../../components/ui/Input/Input';

const TaskList = () => {
  const { user } = useContext(AuthContext);
  const { setGlobalLoading } = useContext(AppContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest({ endpoint: '/tasks' });
        setTasks(data);
      } catch (error) {
        console.error('Failed to fetch tasks:', error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.description) {
      console.error('Title and Description are required');
      return;
    }
    try {
      setIsCreating(true);
      const createdTask = await apiRequest({ 
        endpoint: '/tasks', 
        method: 'POST', 
        body: newTask 
      });
      setTasks([createdTask, ...tasks]);
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', assignedTo: '' });
    } catch (error) {
      console.error('Creation failed:', error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <<divdiv className="space-y-8">
      <<headerheader className="flex justify-between items-end">
        <<divdiv className="flex flex-col gap-2">
          <<TextTextHighlighter text="Task Repository" className="text-3xl font-bold tracking-tight" />
          <<GradientGradientText text="Track, assign and monitor internal IT operations" className="text-sm opacity-70" />
        </div>
        {user?.role === 'ADMIN' && (
          <<ButtonButton 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2"
          >
            + New Task
          </Button>
        )}
      </header>

      {isLoading ? (
        <<divdiv className="flex justify-center items-center h-64">
          <<divdiv className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <<divdiv className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tasks.map((task, index) => (
            <<BlurBlurFade key={task._id} delay={index * 50}>
              <<MagicMagicCard className="cursor-pointer group" onClick={() => navigate(`/tasks/${task._id}`)}>
                <<divdiv className="flex flex-col gap-4">
                  <<divdiv className="flex justify-between items-start">
                    <<divdiv className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${getStatusColor(task.status)}`}>
                      {task.status}
                    </div>
                    <<spanspan className="text-[10px] font-mono text-gray-500">{task._id.slice(-6).toUpperCase()}</span>
                  </div>
                  
                  <<hh3 className="text-lg font-bold group-hover:text-yellow-400 transition-colors line-clamp-1">
                    {task.title}
                  </h3>
                  
                  <<pp className="text-gray-400 text-sm line-clamp-2 h-10 overflow-hidden">
                    {task.description}
                  </p>

                  <<divdiv className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <<divdiv className="flex items-center gap-2">
                      <<divdiv className="w-6 h-6 rounded-full bg-yellow-400/20 flex items-center justify-center text-[10px] font-bold text-yellow-400">
                        {task.assignedTo?.name?.charAt(0) || 'U'}
                      </div>
                      <<spanspan className="text-xs text-gray-300">{task.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                    <<spanspan className="text-xs text-gray-500 font-mono">{new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </MagicCard>
            </BlurFade>
          ))}
          {tasks.length === 0 && (
            <<divdiv className="col-span-full py-20 text-center text-gray-500 italic">
              No tasks found in the repository.
            </div>
          )}
        </div>
      )}

      <<ModalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Initialize New Task"
        footer={
          <<divdiv className="flex gap-3">
            <<ButtonButton variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <<ButtonButton onClick={handleCreateTask} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Confirm Deployment'}
            </Button>
          </div>
        }
      >
        <<divdiv className="space-y-4">
          <<divdiv className="space-y-2">
            <<labellabel className="text-xs font-bold text-gray-500 uppercase">Task Title</label>
            <<InputInput 
              placeholder="e.g. Network Migration" 
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            />
          </div>
          <<divdiv className="space-y-2">
            <<labellabel className="text-xs font-bold text-gray-500 uppercase">Detailed Requirement</label>
            <<InputInput 
              type="textarea"
              placeholder="Describe the operational goal..." 
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              className="h-32"
            />
          </div>
          <<divdiv className="space-y-2">
            <<labellabel className="text-xs font-bold text-gray-500 uppercase">Assign IT Officer (UserID)</label>
            <<InputInput 
              placeholder=" Officer ID..." 
              value={newTask.assignedTo}
              onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TaskList;
