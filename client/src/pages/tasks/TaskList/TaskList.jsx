import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { apiRequest } from '../../../api/apiClient';
import BlurFade from '../../../components/animations/BlurFade';
import GradientText from '../../../components/animations/GradientText';
import MagicCard from '../../../components/animations/MagicCard';
import TextHighlighter from '../../../components/animations/TextHighlighter';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import Modal from '../../../components/ui/Modal/Modal';
import { AuthContext } from '../../../context/AuthContext';

const TaskList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', officerId: '', priority: 'medium', deadline: '', location: '' });
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
      setNewTask({ title: '', description: '', officerId: '', priority: 'medium', deadline: '', location: '' });
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
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <TextHighlighter text="Task Repository" className="text-3xl font-bold tracking-tight" />
          <GradientText text="Track, assign and monitor internal IT operations" className="text-sm opacity-70" />
        </div>
        {user?.role === 'ADMIN' && (
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2"
          >
            + New Task
          </Button>
        )}
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tasks.map((task, index) => (
            <BlurFade key={task.id} delay={index * 50}>
              <MagicCard className="cursor-pointer group" onClick={() => navigate(`/tasks/${task.id}`)}>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${getStatusColor(task.status)}`}>
                      {task.status}
                    </div>
                    <span className="text-[10px] font-mono text-gray-500">{task.id.slice(-6).toUpperCase()}</span>
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Initialize New Task"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Confirm Deployment'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Task Title</label>
            <Input 
              placeholder="e.g. Network Migration" 
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Detailed Requirement</label>
            <Input 
              type="textarea"
              placeholder="Describe the operational goal..." 
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              className="h-32"
            />
          </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Assign IT Officer (UserID)</label>
              <Input 
                placeholder=" Officer ID..." 
                value={newTask.officerId}
                onChange={(e) => setNewTask({...newTask, officerId: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Priority</label>
                <Input 
                  placeholder="Low/Medium/High" 
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Deadline</label>
                <Input 
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
              <Input 
                placeholder="Office/Floor/Room" 
                value={newTask.location}
                onChange={(e) => setNewTask({...newTask, location: e.target.value})}
              />
            </div>

        </div>
      </Modal>
    </div>
  );
};

export default TaskList;
