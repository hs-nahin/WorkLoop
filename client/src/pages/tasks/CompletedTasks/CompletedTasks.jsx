import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Loader2,
  Search
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { apiRequest } from '../../../api/apiClient';
import BlurFade from '../../../components/animations/BlurFade';
import GradientText from '../../../components/animations/GradientText';
import TextHighlighter from '../../../components/animations/TextHighlighter';

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp._seconds) {
    return new Date(timestamp._seconds * 1000);
  }
  return new Date(timestamp);
};

// Helper function to format date using browser's local timezone
const formatDate = (timestamp) => {
  const date = convertTimestamp(timestamp);
  if (!date || isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const CompletedTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest({ endpoint: '/tasks' });
        const completedTasks = data.filter(task => task.status === 'completed');
        setTasks(completedTasks);
      } catch (error) {
        toast.error(error.message || 'Failed to fetch completed tasks');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const getPriorityBadge = (priority) => {
    return (
      <Badge className={cn(
        priority === 'high' && "bg-red-500/10 text-red-500 border-red-500/20",
        priority === 'medium' && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        priority === 'low' && "bg-green-500/10 text-green-500 border-green-500/20",
      )}>
        {priority}
      </Badge>
    );
  };

  const filteredTasks = tasks.filter(t => 
    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="hover:bg-accent cursor-pointer"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="space-y-1">
            <TextHighlighter text="Completed Tasks" className="text-3xl font-bold tracking-tight" />
            <GradientText text="Review all approved and completed operations" className="text-sm opacity-70 block" />
          </div>
        </div>        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Search completed tasks..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading completed tasks...</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card/50 overflow-hidden">
          <div className="grid grid-cols-[30%_15%_15%_15%_25%] w-full">
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b">Task Information</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Status</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Priority</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Officer</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Completed Date</div>
          </div>
          {filteredTasks.length > 0 ? (
            <div className="grid grid-cols-[30%_15%_15%_15%_25%] w-full">
              {filteredTasks.map((task) => (
                <div key={task.id} className="contents">
                  <div 
                    className="px-4 py-3 border-b border-border/50 hover:bg-accent/50 cursor-pointer"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-foreground hover:text-primary text-sm truncate">
                        {task.title}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {task.description}
                      </span>
                    </div>
                  </div>
                  <div 
                    className="px-4 py-3 border-b border-border/50 hover:bg-accent/50 cursor-pointer flex items-center"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      <CheckCircle2 size={12} className="mr-1" /> Completed
                    </Badge>
                  </div>
                  <div 
                    className="px-4 py-3 border-b border-border/50 hover:bg-accent/50 cursor-pointer flex items-center"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    {getPriorityBadge(task.priority)}
                  </div>
                  <div 
                    className="px-4 py-3 border-b border-border/50 hover:bg-accent/50 cursor-pointer flex items-center gap-2"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-400/20 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">
                      {(task.officerName || task.officerId)?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm truncate">{task.officerName || task.officerId || 'Unassigned'}</span>
                  </div>
                  <div 
                    className="px-4 py-3 border-b border-border/50 hover:bg-accent/50 cursor-pointer flex items-center gap-2 text-sm text-muted-foreground"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <Calendar size={14} className="shrink-0" />
                    <span>
                      {formatDate(task.completedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-16 flex flex-col items-center justify-center text-muted-foreground">
              <CheckCircle2 size={48} className="mb-4 opacity-50" />
              <p className="italic">No completed tasks yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompletedTasks;
