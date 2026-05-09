import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRealTimeStats } from '@/hooks/useRealtime';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContextInstance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const STATUS_COLORS = {
  pending: '#eab308',
  'in progress': '#3b82f6',
  submitted: '#a855f7',
  completed: '#22c55e',
  rejected: '#ef4444',
};

const TaskStatusChart = () => {
  const { user } = useContext(AuthContext);
  const { stats, loading } = useRealTimeStats(user?.uid, user?.role);

  const chartData = useMemo(() => {
    if (!stats?.statusCounts) return [];
    return [
      { name: 'Pending', value: stats.statusCounts.pending || 0, color: STATUS_COLORS.pending },
      { name: 'In Progress', value: stats.statusCounts.inProgress || 0, color: STATUS_COLORS['in progress'] },
      { name: 'Submitted', value: stats.statusCounts.submitted || 0, color: STATUS_COLORS.submitted },
      { name: 'Completed', value: stats.statusCounts.completed || 0, color: STATUS_COLORS.completed },
      { name: 'Rejected', value: stats.statusCounts.rejected || 0, color: STATUS_COLORS.rejected },
    ].filter(item => item.value > 0);
  }, [stats?.statusCounts]);

  if (loading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-widest">Task Status</CardTitle>
          <CardDescription>Distribution across workflow stages</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <div className="animate-pulse text-muted-foreground text-sm">Loading chart...</div>
        </CardContent>
      </Card>
    );
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium uppercase tracking-widest">Task Status</CardTitle>
        <CardDescription>Distribution across workflow stages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} tasks`, name]}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 justify-center mt-4">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
        {total === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-2">No tasks found</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskStatusChart;
