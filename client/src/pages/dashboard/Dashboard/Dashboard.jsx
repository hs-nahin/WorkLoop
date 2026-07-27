import { apiRequest } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import AnnouncementBanner from "@/components/announcements/AnnouncementBanner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  LayoutDashboard,
  Loader2,
  Plus,
} from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import BlurFade from "@/components/animations/BlurFade";
import NumberTicker from "@/components/animations/NumberTicker";
import { AuthContext } from "@/context/AuthContext";
import { useRealTimeTasks } from "@/hooks/useRealtime";
import { hasPermission } from "@/lib/permissions";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const { tasks: allTasks, loading: statsLoading } = useRealTimeTasks(user?.uid, user?.role);

  const stats = useMemo(() => {
    const pending = allTasks.filter(t => t.status === 'pending').length;
    const inProgress = allTasks.filter(t => t.status === 'in progress').length;
    const submitted = allTasks.filter(t => t.status === 'submitted').length;
    const completed = allTasks.filter(t => t.status === 'completed' || t.status === 'approved').length;

    const now = new Date();
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayTasks = allTasks.filter(t => {
        const created = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
        return created >= dayStart && created < dayEnd;
      });
      weeklyTrend.push({
        date: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        created: dayTasks.length,
        completed: dayTasks.filter(t => t.status === 'completed' || t.status === 'approved').length,
        submitted: dayTasks.filter(t => t.status === 'submitted').length,
      });
    }

    return {
      totalTasks: allTasks.length,
      pendingTasks: pending,
      inProgress,
      submitted,
      completedTasks: completed,
      statusCounts: { pending, inProgress, submitted, completed, rejected: allTasks.filter(t => t.status === 'rejected').length },
      weeklyTrend,
      tasks: allTasks,
    };
  }, [allTasks]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    location: '',
    officerId: '',
    priority: 'medium',
    deadlineDate: '',
    deadlineHour: '',
    deadlineMinute: '',
    deadlineAmPm: 'AM',
    assistantId: ''
  });
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiRequest({ endpoint: '/users' });
        const validUsers = data.filter(u => {
          const role = u.role?.toUpperCase();
          return role && role !== 'ADMIN' && u.isActive !== false;
        });
        
        const seen = new Set();
        const uniqueUsers = validUsers.filter(u => {
          const key = u.uid || u.userId;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        
        const officerList = uniqueUsers.filter(user => user.role?.toUpperCase() !== 'ASSISTANT');
        setOfficers(officerList);
        setAssistants(uniqueUsers);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    if (hasPermission(user?.role, 'TASK_CREATE')) {
      fetchUsers();
    }
  }, [user]);
  
  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return toast.error('Title is required');
    if (!newTask.description.trim()) return toast.error('Description is required');
    if (!newTask.location.trim()) return toast.error('Location is required');
    if (!newTask.officerId) return toast.error('Assign a team member');
    if (!newTask.priority) return toast.error('Select priority');
    if (!newTask.deadlineDate) return toast.error('Set a deadline date');
    
    let deadline = newTask.deadlineDate;
    if (newTask.deadlineHour && newTask.deadlineMinute) {
      let hour = parseInt(newTask.deadlineHour);
      if (newTask.deadlineAmPm === 'PM' && hour !== 12) hour += 12;
      if (newTask.deadlineAmPm === 'AM' && hour === 12) hour = 0;
      deadline = `${newTask.deadlineDate}T${hour.toString().padStart(2, '0')}:${newTask.deadlineMinute}:00`;
    }
    
    try {
      setIsCreating(true);
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        location: newTask.location,
        officerId: newTask.officerId,
        priority: newTask.priority,
        deadline,
        assistantId: newTask.assistantId || null
      };
      const result = await apiRequest({ 
        endpoint: '/tasks', 
        method: 'POST', 
        body: taskData 
      });
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', location: '', officerId: '', priority: 'medium', deadlineDate: '', deadlineHour: '', deadlineMinute: '', deadlineAmPm: 'AM', assistantId: '' });
      toast.success('Task deployed successfully');
      navigate('/tasks');
    } catch (error) {
      console.error('Task creation error:', error);
      toast.error(error.message || 'Creation failed');
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <AnnouncementBanner />
      <header>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {hasPermission(user?.role, 'TASK_VIEW_ALL')
            ? 'Operational intelligence & analytics'
            : `Welcome back, ${user?.name || 'User'}`
          }
        </p>
      </header>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <BlurFade delay={100}>
          <Card className="border-border bg-card/50 backdrop-blur-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Total Tasks
              </CardTitle>
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter">
                <NumberTicker value={stats.totalTasks} />
              </div>
              <div className="mt-4">
                <Progress value={100} className="h-1" />
              </div>
            </CardContent>
          </Card>
        </BlurFade>
        
        <BlurFade delay={200}>
          <Card className="border-border bg-card/50 backdrop-blur-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Pending Action
              </CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter text-primary">
                <NumberTicker value={stats.pendingTasks} />
              </div>
              <div className="mt-4">
                <Progress
                  value={(stats.pendingTasks / (stats.totalTasks || 1)) * 100}
                  className="h-1"
                />
              </div>
            </CardContent>
          </Card>
        </BlurFade>
        
        <BlurFade delay={300}>
          <Card className="border-border bg-card/50 backdrop-blur-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Completed
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter text-green-500">
                <NumberTicker value={stats.completedTasks} />
              </div>
              <div className="mt-4">
                <Progress
                  value={(stats.completedTasks / (stats.totalTasks || 1)) * 100}
                  className="h-1 bg-green-500/20"
                />
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      </div>

       {/* Quick Actions */}
       <div className="grid grid-cols-1 gap-6">
          <BlurFade delay={400}>
            <Card className="border-border bg-card/50 backdrop-blur-sm h-fit w-full">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Manage your workflow effectively
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                {hasPermission(user?.role, 'TASK_CREATE') && (
                  <Button 
                    className="flex items-center gap-2 group cursor-pointer w-full sm:w-auto"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus size={16} />
                    Create New Task
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex items-center gap-2 group cursor-pointer w-full sm:w-auto"
                  onClick={() => navigate('/tasks')}
                >
                  <FileText size={16} />
                  View All Tasks
                </Button>
              </CardContent>
            </Card>
          </BlurFade>
       </div>


      {/* Create Task Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
              <Label htmlFor="officer">Assign To *</Label>
               <Select 
                 value={newTask.officerId} 
                 onValueChange={(v) => setNewTask({...newTask, officerId: v})}
               >
                 <SelectTrigger id="officer">
                    <SelectValue placeholder="Select Assignee">
                      {officers.find(o => (o.uid || o.userId) === newTask.officerId)?.name || <span>Select Assignee</span>}
                   </SelectValue>
                 </SelectTrigger>
                 <SelectContent>
                   {officers.map(officer => (
                     <SelectItem key={officer.uid || officer.userId} value={officer.uid || officer.userId}>
                       {officer.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assistant">Collaborator (Optional)</Label>
               <Select 
                 value={newTask.assistantId} 
                 onValueChange={(v) => setNewTask({...newTask, assistantId: v})}
               >
                 <SelectTrigger id="assistant">
                    <SelectValue placeholder="Select Collaborator">
                      {assistants.find(a => (a.uid || a.userId) === newTask.assistantId)?.name || <span>Select Collaborator</span>}
                   </SelectValue>
                 </SelectTrigger>
                 <SelectContent>
                   {assistants.map(assistant => (
                     <SelectItem key={assistant.uid || assistant.userId} value={assistant.uid || assistant.userId}>
                       {assistant.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({...newTask, priority: v})}>
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
                <Label htmlFor="deadlineDate">Deadline Date *</Label>
                <Input
                  id="deadlineDate"
                  type="date"
                  value={newTask.deadlineDate}
                  onChange={(e) => setNewTask({...newTask, deadlineDate: e.target.value})}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Deadline Time</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={newTask.deadlineHour} onValueChange={(v) => setNewTask({...newTask, deadlineHour: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                      <SelectItem key={h} value={h.toString()}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newTask.deadlineMinute} onValueChange={(v) => setNewTask({...newTask, deadlineMinute: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Minute" />
                  </SelectTrigger>
                  <SelectContent>
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newTask.deadlineAmPm} onValueChange={(v) => setNewTask({...newTask, deadlineAmPm: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleCreateTask} disabled={isCreating} className="cursor-pointer">
              {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
