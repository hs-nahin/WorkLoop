import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Search
} from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
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
  const [newTask, setNewTask] = useState({ title: '', description: '', officerId: '', priority: 'medium', deadline: '', location: '', status: 'pending', assistants: [] });
  const [isCreating, setIsCreating] = useState(false);
  const [officers, setOfficers] = useState([]);

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
    const fetchOfficers = async () => {
      try {
        const data = await apiRequest({ endpoint: '/users' });
        // Filter for officers only (assuming users with specific roles)
        const officers = data.filter(user => 
          user.role === 'IT OFFICER' || 
          user.role === 'ADMIN' || 
          user.role === 'SUPERVISOR'
        );
        setOfficers(officers.length > 0 ? officers : data); // fallback to all users if no officers found
      } catch (error) {
        console.error('Failed to fetch officers:', error);
      }
    };
    fetchOfficers();
  }, []);

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.officerId || !newTask.priority) {
      toast.error('Title, Assigned Officer, and Priority are required');
      return;
    }
    try {
      setIsCreating(true);
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        location: newTask.location,
        officerId: newTask.officerId,
        priority: newTask.priority,
        deadline: newTask.deadline,
        status: newTask.status || 'pending',
        assistants: newTask.assistants
      };
      const createdTask = await apiRequest({ 
        endpoint: '/tasks', 
        method: 'POST', 
        body: taskData 
      });
      setTasks([createdTask, ...tasks]);
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', officerId: '', priority: 'medium', deadline: '', location: '', status: 'pending', assistants: [] });
      toast.success('Task deployed successfully');
    } catch (error) {
      toast.error(error.message || 'Creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"><CheckCircle2 size={12} className="mr-1" /> Completed</Badge>;
      case 'pending': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20"><Clock size={12} className="mr-1" /> Pending</Badge>;
      case 'rejected': return <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"><AlertCircle size={12} className="mr-1" /> Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="hover:bg-accent cursor-pointer"
            >
              <ArrowLeft size={20} />
            </Button>
            <TextHighlighter text="Task Repository" className="text-3xl font-bold tracking-tight" />
          </div>
          <GradientText text="Track, assign and monitor internal IT operations" className="text-sm opacity-70 block" />
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
                <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
                  <Plus size={18} />
                  <span>New Task</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Initialize New Task</DialogTitle>
                  <DialogDescription>Define the requirements for a new IT operation.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input 
                      id="title"
                      placeholder="e.g. Network Migration" 
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Detailed Requirement</Label>
                    <Textarea 
                      id="description"
                      placeholder="Describe the operational goal..." 
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      className="min-h-30"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="officer">Assign IT Officer</Label>
                      <Select 
                        value={newTask.officerId} 
                        onValueChange={(v) => setNewTask({...newTask, officerId: v})}
                      >
                        <SelectTrigger id="officer">
                          <SelectValue placeholder="Select Officer" />
                        </SelectTrigger>
                        <SelectContent>
                          {officers.map(officer => (
                            <SelectItem key={officer.id} value={officer.id}>
                              {officer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="priority">Priority Level</Label>
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
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={newTask.status} 
                        onValueChange={(v) => setNewTask({...newTask, status: v})}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="deadline">Deadline</Label>
                      <Input 
                        id="deadline"
                        type="date"
                        value={newTask.deadline}
                        onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Physical Location</Label>
                      <Input 
                        id="location"
                        placeholder="Office/Floor/Room" 
                        value={newTask.location}
                        onChange={(e) => setNewTask({...newTask, location: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Assistants (Optional)</Label>
                    <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                      {officers.map(officer => (
                        <div key={officer.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`assistant-${officer.id}`}
                            checked={newTask.assistants.includes(officer.id)}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...newTask.assistants, officer.id]
                                : newTask.assistants.filter(id => id !== officer.id);
                              setNewTask({...newTask, assistants: updated});
                            }}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`assistant-${officer.id}`} className="text-sm">{officer.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTask} disabled={isCreating}>
                    {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deploying...</> : 'Confirm Deployment'}
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
        <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-75">Task Information</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task, index) => (
                  <BlurFade key={task.id} delay={index * 20}>
                    <TableRow className="group hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate(`/tasks/${task.id}`)}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {task.title}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                            {task.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(task.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs font-medium uppercase">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            task.priority === 'high' ? "bg-destructive" : task.priority === 'medium' ? "bg-yellow-500" : "bg-green-500"
                          )} />
                          {task.priority}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                            {task.assignedTo?.name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-sm">{task.assignedTo?.name || 'Unassigned'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar size={14} />
                          {task.deadline || 'No deadline'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </BlurFade>
                ))}
                {filteredTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center text-muted-foreground italic">
                      No tasks matching your search criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
