import { apiRequest } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
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
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import BlurFade from "@/components/animations/BlurFade";

import NumberTicker from "@/components/animations/NumberTicker.jsx";
import { AuthContext } from "@/context/AuthContextInstance";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });
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
    deadline: '',
    assistantId: ''
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiRequest({ endpoint: "/tasks" });
        const total = data.length || 0;
        const pending = data.filter((t) => t.status === "pending").length || 0;
        const completed =
          data.filter((t) => t.status === "completed").length || 0;
        setStats({
          totalTasks: total,
          pendingTasks: pending,
          completedTasks: completed,
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiRequest({ endpoint: '/users' });
        console.log('Users fetched:', data);
        const officerList = data.filter(user => user.role?.toUpperCase() === 'IT OFFICER');
        setOfficers(officerList);
        const assistantList = data.filter(user => user.role?.toUpperCase() === 'ASSISTANT');
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
      console.log('Creating task with data:', taskData);
      const result = await apiRequest({ 
        endpoint: '/tasks', 
        method: 'POST', 
        body: taskData 
      });
      console.log('Task created:', result);
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', location: '', officerId: '', priority: 'medium', deadline: '', assistantId: '' });
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <BlurFade delay={100}>
          <Card className="border-border bg-card/50 backdrop-blur-sm">
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
          <Card className="border-border bg-card/50 backdrop-blur-sm">
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
          <Card className="border-border bg-card/50 backdrop-blur-sm">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BlurFade delay={400}>
          <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Quick Actions
              </CardTitle>
              <CardDescription>
                Manage your workflow effectively
              </CardDescription>
            </CardHeader>
<CardContent className="flex flex-wrap gap-4">
              {user?.role === 'ADMIN' && (
                <Button 
                  className="flex items-center gap-2 group cursor-pointer"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus size={16} />
                  Create New Task
                </Button>
              )}
               
               <Button
                 variant="outline"
                 className="flex items-center gap-2 group cursor-pointer"
                 onClick={() => navigate('/tasks')}
               >
                 <FileText size={16} />
                 View All Tasks
               </Button>
             </CardContent>
             </Card>
             
             <BlurFade delay={500}>
               <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        Personnel Overview
                      </CardTitle>
                      <CardDescription>
                        IT Officers and Assistants registered in the system
                      </CardDescription>
                    </div>
                    {user?.role === 'ADMIN' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/users')}
                        className="cursor-pointer"
                      >
                        View All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                   <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">IT Officers ({officers.length})</h4>
                        <div className="space-y-2">
                          {officers.length > 0 ? officers.map((officer) => (
                            <div key={officer.uid || officer.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50">
                              <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                                {officer.name?.charAt(0) || 'U'}
                              </div>
                         <div className="flex-1 min-w-0">
                                 <p className="text-sm font-medium truncate">{officer.name}</p>
                                 <p className="text-xs text-muted-foreground truncate">{officer.email}</p>
                               </div>
                            </div>
                          )) : (
                            <p className="text-xs text-muted-foreground">No IT Officers registered</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Assistants ({assistants.length})</h4>
                        <div className="space-y-2">
                          {assistants.length > 0 ? assistants.map((assistant) => (
                            <div key={assistant.uid || assistant.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50">
                              <div className="w-8 h-8 rounded-full bg-purple-400/20 flex items-center justify-center text-xs font-bold text-purple-400 shrink-0">
                                {assistant.name?.charAt(0) || 'U'}
                              </div>
                         <div className="flex-1 min-w-0">
                                 <p className="text-sm font-medium truncate">{assistant.name}</p>
                                 <p className="text-xs text-muted-foreground truncate">{assistant.email}</p>
                               </div>
                            </div>
                          )) : (
                            <p className="text-xs text-muted-foreground">No Assistants registered</p>
                          )}
                        </div>
                      </div>
                   </div>
                 </CardContent>
               </Card>
             </BlurFade>
             
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
                             <SelectItem key={officer.uid} value={officer.uid}>
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
                             <SelectItem key={assistant.uid} value={assistant.uid}>
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
                    <Button variant="outline" onClick={() => setIsModalOpen(false)} className="cursor-pointer">Cancel</Button>
                    <Button onClick={handleCreateTask} disabled={isCreating} className="cursor-pointer">
                      {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Task'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
        </BlurFade>
      </div>
    </div>
  );
};

export default Dashboard;
