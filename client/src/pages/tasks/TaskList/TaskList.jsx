import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
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

const TaskList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', officerId: '', priority: 'medium', deadline: '', location: '', assistantId: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [assistants, setAssistants] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest({ endpoint: '/tasks' });
        setTasks(data);
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
        const officerList = data.filter(user => user.role === 'IT OFFICER');
        setOfficers(officerList);
        const assistantList = data.filter(user => user.role === 'ASSISTANT');
        setAssistants(assistantList);
      } catch (error) {
        console.error('Failed to fetch users:', error);
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
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        location: newTask.location,
        officerId: newTask.officerId,
        priority: newTask.priority,
        deadline: newTask.deadline,
        assistantId: newTask.assistantId || null
      };
      const createdTask = await apiRequest({ 
        endpoint: '/tasks', 
        method: 'POST', 
        body: taskData 
      });
      setTasks([createdTask, ...tasks]);
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', location: '', officerId: '', priority: 'medium', deadline: '', assistantId: '' });
      toast.success('Task deployed successfully');
    } catch (error) {
      toast.error(error.message || 'Creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await apiRequest({ 
        endpoint: `/tasks/${taskId}`, 
        method: 'PUT', 
        body: { status: 'completed' } 
      });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
      toast.success('Task marked as completed');
    } catch (error) {
      toast.error(error.message || 'Failed to complete task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await apiRequest({ 
        endpoint: `/tasks/${taskId}`, 
        method: 'DELETE'
      });
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to delete task');
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
          {user?.role === 'ADMIN' && (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={18} />
                  <span>New Task</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Initialize New Task</DialogTitle>
                  <DialogDescription>Define the requirements for the IT operation.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Task Title *</Label>
                    <Input 
                      id="title"
                      placeholder="e.g. Network Migration" 
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea 
                      id="description"
                      placeholder="Detailed requirements..." 
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      className="min-h-24"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input 
                      id="location"
                      placeholder="Shed A / Floor 2 / Server Room" 
                      value={newTask.location}
                      onChange={(e) => setNewTask({...newTask, location: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="officer">Assign IT Officer *</Label>
                    <Select 
                      value={newTask.officerId} 
                      onValueChange={(v) => setNewTask({...newTask, officerId: v})}
                    >
                      <SelectTrigger id="officer">
                        <SelectValue placeholder="Select IT Officer" />
                      </SelectTrigger>
                      <SelectContent>
                        {officers.map(officer => (
                          <SelectItem key={officer.userId} value={officer.userId}>
                            {officer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assistant">Assistant Technician (Optional)</Label>
                    <Select 
                      value={newTask.assistantId} 
                      onValueChange={(v) => setNewTask({...newTask, assistantId: v})}
                    >
                      <SelectTrigger id="assistant">
                        <SelectValue placeholder="Select Assistant Technician" />
                      </SelectTrigger>
                      <SelectContent>
                        {assistants.map(assistant => (
                          <SelectItem key={assistant.userId} value={assistant.userId}>
                            {assistant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="priority">Priority *</Label>
                      <Select 
                        value={newTask.priority} 
                        onValueChange={(v) => setNewTask({...newTask, priority: v})}
                      >
                        <SelectTrigger id="priority">
                          <SelectValue placeholder="Select Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="deadline">Deadline *</Label>
                      <Input 
                        id="deadline"
                        type="date"
                        value={newTask.deadline}
                        onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTask} disabled={isCreating}>
                    {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Task'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
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
          <div className="grid grid-cols-[30%_15%_15%_15%_15%_8%] w-full">
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b">Task Information</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Status</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Priority</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Officer</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Assistant</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Deadline</div>
            <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l text-right">Action</div>
          </div>
          {/* Table Body */}
          {filteredTasks.length > 0 ? (
            <div className="grid grid-cols-[30%_15%_15%_20%_12%_8%] w-full">
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
                    <span>{task.deadline || 'No date'}</span>
                  </div>
                  <div className="px-4 py-3 border-b border-border/50 hover:bg-accent/50 flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteTask(task.id);
                      }}
                    >
                      <Check size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
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
