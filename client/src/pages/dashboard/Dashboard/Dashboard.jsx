import { useContext, useEffect, useState } from 'react';
import { apiRequest } from '../../../api/apiClient';
import { AuthContext } from '../../../context/AuthContextInstance.js';
import { 
  LayoutDashboard, 
  Clock, 
  CheckCircle2, 
  Plus, 
  FileText, 
  Activity,
  ArrowUpRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import BlurFade from '../../../components/animations/BlurFade';
import NumberTicker from '../../../components/animations/NumberTicker';
import TextHighlighter from '../../../components/animations/TextHighlighter';
import TypingAnimation from '../../../components/animations/TypingAnimation';
import WordRotate from '../../../components/animations/WordRotate';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ totalTasks: 0, pendingTasks: 0, completedTasks: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiRequest({ endpoint: '/tasks' });
        const total = data.length || 0;
        const pending = data.filter(t => t.status === 'pending').length || 0;
        const completed = data.filter(t => t.status === 'completed').length || 0;
        setStats({ totalTasks: total, pendingTasks: pending, completedTasks: completed });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <TextHighlighter text="Operational Overview" className="text-3xl font-bold tracking-tight" />
          <TypingAnimation text="|" className="text-primary font-bold" />
        </div
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">System</span>
          <WordRotate words={['Ready', 'Optimized', 'Secure']} className="text-sm font-bold text-primary" />
          <span className="text-sm text-muted-foreground"> : {user?.role}</span>
        </div
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <BlurFade delay={100}>
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Tasks</CardTitle>
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
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Pending Action</CardTitle>
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
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Completed</CardTitle>
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
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              <CardDescription>Manage your workflow effectively</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button className="flex items-center gap-2 group">
                <Plus size={16} />
                Create New Task
                <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Button>
              <Button variant="outline" className="flex items-center gap-2 group">
                <FileText size={16} />
                View Reports
                <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Button>
            </CardContent>
          </Card>
        </BlurFade>

        <BlurFade delay={500}>
          <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">System Health</CardTitle>
              <CardDescription>Backend and Database connectivity status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <Activity size={20} className="text-green-500" />
                  <span className="text-sm font-medium">Backend API Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] uppercase font-bold">
                    Connected
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      </div>
    </div>
  );
};

export default Dashboard;
