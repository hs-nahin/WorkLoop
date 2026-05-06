import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  Trash2
} from 'lucide-react';
import { Fragment, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { apiRequest } from '../../../api/apiClient';
import BlurFade from '../../../components/animations/BlurFade';
import GradientText from '../../../components/animations/GradientText';
import TextHighlighter from '../../../components/animations/TextHighlighter';
import { AuthContext } from '../../../context/AuthContextInstance.js';
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

// Helper function to convert 12-hour to 24-hour format
const convertTo24Hour = (hour12, ampm) => {
  if (ampm === 'AM') {
    return hour12 === 12 ? 0 : hour12;
  } else {
    return hour12 === 12 ? 12 : hour12 + 12;
  }
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

const TaskList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', location: '', officerId: '', priority: 'medium', deadline: '', deadlineTime: '23:59', deadlineHour: '11', deadlineMinute: '59', deadlineAMPM: 'PM', assistants: [] });
  const [isCreating, setIsCreating] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest({ endpoint: '/tasks' });
        // Filter out completed tasks - they should only appear in Completed page
        const activeTasks = data.filter(task => task.status !== 'completed');
        setTasks(activeTasks);
      } catch (error) {
        toast.error(error.message || 'Failed to fetch tasks');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiRequest({ endpoint: '/users' });
        console.log('[TaskList] Users fetched:', data);
        
        // Filter users with IT OFFICER role (case-insensitive)
        const officerList = data.filter(user => {
          const role = user.role?.toUpperCase();
          return role === 'IT OFFICER';
        });
        console.log('[TaskList] Officers:', officerList);
        setOfficers(officerList);
        
        const assistantList = data.filter(user => {
          const role = user.role?.toUpperCase();
          return role === 'ASSISTANT';
        });
        setAssistants(assistantList);
      } catch (error) {
        console.error('[TaskList] Failed to fetch users:', error);
      }
    };
    if (user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [user]);

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return toast.error('Title is required');
    if (!newTask.description.trim()) return toast.error('Description is required');
    if (!newTask.location.trim()) return toast.error('Location is required');
    if (!newTask.officerId) return toast.error('Assign an IT Officer');
    if (!newTask.priority) return toast.error('Select priority');
    if (!newTask.deadline) return toast.error('Set a deadline');

    try {
      setIsCreating(true);
      // Combine date and time into ISO string
      const deadlineDateTime = new Date(`${newTask.deadline}T${newTask.deadlineTime}:00`);
      
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        location: newTask.location,
        officerId: newTask.officerId,
        priority: newTask.priority,
        deadline: deadlineDateTime.toISOString(),
        assistants: newTask.assistants
      };
      const createdTask = await apiRequest({ 
        endpoint: '/tasks', 
        method: 'POST', 
        body: taskData 
      });
      setTasks([createdTask, ...tasks]);
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', location: '', officerId: '', priority: 'medium', deadline: '', deadlineTime: '23:59', deadlineHour: '11', deadlineMinute: '59', deadlineAMPM: 'PM', assistants: [] });
      toast.success('Task deployed successfully');
    } catch (error) {
      toast.error(error.message || 'Creation failed');
    } finally {
      setIsCreating(false);
    }
  };

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
      await apiRequest({ 
        endpoint: `/tasks/${taskId}`, 
        method: 'DELETE'
      });
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to delete task');
    } finally {
      setDeletingTaskId(null);
      setTaskToDelete(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': 
      case 'completed': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 size={12} className="mr-1" /> {status}</Badge>;
      case 'pending': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock size={12} className="mr-1" /> Pending</Badge>;
      case 'submitted': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Clock size={12} className="mr-1" /> Submitted</Badge>;
      case 'rejected': return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><AlertCircle size={12} className="mr-1" /> Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
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
            <TextHighlighter text="Task Repository" className="text-3xl font-bold tracking-tight" />
            <GradientText text="Track, assign and monitor internal IT operations" className="text-sm opacity-70 block" />
          </div>
        </div>        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Search operations..." 
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
          <p className="text-sm text-muted-foreground animate-pulse">Fetching repository data...</p>
        </div>
) : (
        <div className="rounded-xl border bg-card/50 overflow-hidden">
          {/* Table Header */}
          <div className={`grid w-full ${isAdmin ? 'grid-cols-[25%_10%_10%_15%_15%_20%_5%]' : 'grid-cols-[28%_12%_12%_15%_15%_30%]'}`}>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b">Task Information</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Status</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Priority</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Officer</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Assistant</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Deadline</div>
            {isAdmin && (
              <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l flex items-center justify-center">Action</div>
            )}
          </div>
          {/* Table Body */}
          {filteredTasks.length > 0 ? (
            <div className={`grid w-full ${isAdmin ? 'grid-cols-[25%_10%_10%_15%_15%_20%_5%]' : 'grid-cols-[28%_12%_12%_15%_15%_30%]'}`}>
              {filteredTasks.map((task) => (
                  <Fragment key={task.id}>
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
                    {getStatusBadge(task.status)}
                  </div>
                  <div 
                    className="px-4 py-3 border-b border-border/50 hover:bg-accent/50 cursor-pointer flex items-center"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <Badge className={cn(
                      task.priority === 'high' && "bg-red-500/10 text-red-500 border-red-500/20",
                      task.priority === 'medium' && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                      task.priority === 'low' && "bg-green-500/10 text-green-500 border-green-500/20",
                    )}>
                      {task.priority}
                    </Badge>
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
                    className="px-4 py-3 border-b border-border/50 hover:bg-accent/50 cursor-pointer flex items-center gap-2"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    {task.assistantName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-400/20 flex items-center justify-center text-[10px] font-bold text-purple-400 shrink-0">
                          {task.assistantName?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm truncate">{task.assistantName}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No assistant</span>
                    )}
                  </div>
                 <div 
                   className="px-4 py-3 border-b border-border/50 hover:bg-accent/50 cursor-pointer flex items-center gap-2 text-sm text-muted-foreground"
                   onClick={() => navigate(`/tasks/${task.id}`)}
                 >
                   <Calendar size={14} className="shrink-0" />
                   <span>{formatDate(task.deadline)}</span>
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
                            <AlertDialogTitle>Delete Task</AlertDialogTitle>
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
                </Fragment>
              ))}
            </div>
          ) : (
            <div className="px-4 py-16 flex items-center justify-center text-muted-foreground italic">
              No tasks matching your search criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskList;
