import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputGroupAddon } from '@/components/ui/input-group-addon';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Loader2,
  Search,
  Trash2
} from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { apiRequest } from '../../../api/apiClient';
import BlurFade from '../../../components/animations/BlurFade';
import GradientText from '../../../components/animations/GradientText';
import TextHighlighter from '../../../components/animations/TextHighlighter';
import { AuthContext } from '../../../context/AuthContextInstance';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

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
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-completed-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const confirmDelete = (taskId) => {
    setTaskToDelete(taskId);
    setAlertOpen(true);
  };

  const handleDeleteTask = async () => {
    const taskId = taskToDelete;
    if (!taskId) return;
    try {
      setDeletingTaskId(taskId);
      setAlertOpen(false);
      await apiRequest({ endpoint: `/tasks/${taskId}`, method: 'DELETE' });
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to delete task');
    } finally {
      setDeletingTaskId(null);
      setTaskToDelete(null);
    }
  };

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
          <div className="flex items-center gap-0 overflow-hidden rounded-lg border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all bg-background shadow-sm w-full md:w-[450px]">
            <div className="flex items-center justify-center pl-3 text-muted-foreground transition-colors group-focus-within:text-primary">
              <Search size={16} />
            </div>
            <div className="relative flex-1">
              <Input 
                id="search-completed-input"
                placeholder="Search by completed task title or description..." 
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 h-9 w-full pr-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-muted-foreground/20 bg-transparent px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
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
          <div className={`grid w-full ${isAdmin ? 'grid-cols-[25%_10%_10%_15%_25%_15%]' : 'grid-cols-[28%_12%_12%_16%_32%]'}`}>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b">Task Information</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Status</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Priority</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Officer</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Completed Date</div>
            {isAdmin && (
              <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l flex items-center justify-center">Action</div>
            )}
          </div>
          {filteredTasks.length > 0 ? (
            <div className={`grid w-full ${isAdmin ? 'grid-cols-[25%_10%_10%_15%_25%_15%]' : 'grid-cols-[28%_12%_12%_16%_32%]'}`}>
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
                  {isAdmin && (
                    <div className="px-4 py-3 border-b border-border/50 flex items-center justify-center">
                      <AlertDialog open={alertOpen && taskToDelete === task.id} onOpenChange={(open) => {
                        setAlertOpen(open);
                        if (!open) setTaskToDelete(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(task.id);
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-500/10 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Completed Task</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this task? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel 
                              className="cursor-pointer"
                              onClick={() => {
                                setAlertOpen(false);
                                setTaskToDelete(null);
                              }}
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteTask}
                            >
                              {deletingTaskId === task.id ? (
                                <Loader2 size={14} className="animate-spin mr-2" />
                              ) : null}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
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
