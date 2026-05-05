import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '../../../api/apiClient';
import BlurFade from '../../../components/animations/BlurFade';
import MagicCard from '../../../components/animations/MagicCard';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

const CompletedTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await apiRequest({ endpoint: '/tasks/status/completed' });
      setTasks(data);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')} className="hover:bg-accent cursor-pointer">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-3xl font-bold">Completed Tasks</h1>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-600/10 text-green-600 border-green-600/30 border">
          {tasks.length} COMPLETED
        </span>
      </div>

      {tasks.length === 0 ? (
        <BlurFade>
          <MagicCard>
            <div className="text-center py-12">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No completed tasks yet</p>
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
                      Completed by: {task.officerName || task.officerId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Priority: <span className={`font-medium ${
                        task.priority === 'high' ? 'text-red-600' : 
                        task.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>{task.priority?.toUpperCase()}</span>
                    </p>
                  </div>
                  <CheckCircle2 size={24} className="text-green-600" />
                </div>
              </MagicCard>
            </BlurFade>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletedTasks;
