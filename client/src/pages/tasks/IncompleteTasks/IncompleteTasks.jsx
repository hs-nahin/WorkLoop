import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/api/apiClient';
import BlurFade from '@/components/animations/BlurFade';
import MagicCard from '@/components/animations/MagicCard';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { AuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';

const IncompleteTasks = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await apiRequest({ endpoint: '/tasks/status/incomplete' });
      setTasks(data);
    } catch (error) {
      console.error('Error fetching incomplete tasks:', error);
    }
  };

  if (!hasPermission(user?.role, 'TASK_VIEW_ALL')) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')} className="hover:bg-accent cursor-pointer">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-3xl font-bold">Incomplete Tasks</h1>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600/10 text-red-600 border-red-600/30 border">
          {tasks.length} INCOMPLETE
        </span>
      </div>

      {tasks.length === 0 ? (
        <BlurFade>
          <MagicCard>
            <div className="text-center py-12">
              <AlertCircle size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No incomplete tasks</p>
            </div>
          </MagicCard>
        </BlurFade>
      ) : (
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <BlurFade key={task.id} delay={index * 100}>
              <MagicCard className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/tasks/${task.id}`)}>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Assigned to: {task.officerName || task.officerId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Priority: <span className={`font-medium ${
                        task.priority === 'high' ? 'text-red-600' : 
                        task.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>{task.priority?.toUpperCase()}</span>
                    </p>
                  </div>
                  <AlertCircle size={24} className="text-red-600" />
                </div>
              </MagicCard>
            </BlurFade>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncompleteTasks;
