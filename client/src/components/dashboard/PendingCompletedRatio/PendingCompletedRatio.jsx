import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRealTimeTasks } from '@/hooks/useRealtime';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContextInstance';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';

const PendingCompletedRatio = () => {
  const { user } = useContext(AuthContext);
  const { tasks, loading } = useRealTimeTasks(user?.uid, user?.role);

  const stats = useMemo(() => {
    if (!tasks) return { pending: 0, completed: 0, total: 0, ratio: 0 };
    
    const pending = tasks.filter(t => ['pending', 'in progress', 'submitted'].includes(t.status)).length;
    const completed = tasks.filter(t => t.status === 'completed' || t.status === 'approved').length;
    const total = tasks.length;
    const ratio = total > 0 ? (completed / total) * 100 : 0;
    
    return { pending, completed, total, ratio };
  }, [tasks]);

  if (loading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-500" />
            Pending vs Completed
          </CardTitle>
          <CardDescription>Active workload vs completed work</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-500" />
          Pending vs Completed
        </CardTitle>
        <CardDescription>Active workload vs completed work</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Completed</span>
            <span className="font-medium text-green-600">{stats.completed} tasks</span>
          </div>
          <Progress 
            value={stats.ratio} 
            className="h-3 bg-muted/50"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="font-medium">{stats.ratio.toFixed(1)}%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="text-center p-4 rounded-lg bg-muted/30">
            <p className="text-3xl font-bold">{stats.ratio.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingCompletedRatio;
