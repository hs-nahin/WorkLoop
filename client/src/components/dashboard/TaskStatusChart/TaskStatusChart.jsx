import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const STATUS_COLORS = {
  pending: '#eab308',
  'in progress': '#3b82f6',
  submitted: '#a855f7',
  completed: '#22c55e',
  rejected: '#ef4444',
};

const TaskStatusChart = ({ tasks, loading }) => {
  const statusCounts = useMemo(() => {
    if (!tasks) return { pending: 0, inProgress: 0, submitted: 0, completed: 0, rejected: 0 };
    return {
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in progress').length,
      submitted: tasks.filter(t => t.status === 'submitted').length,
      completed: tasks.filter(t => t.status === 'completed' || t.status === 'approved').length,
      rejected: tasks.filter(t => t.status === 'rejected').length,
    };
  }, [tasks]);

  const chartData = useMemo(() => {
    return [
      { name: 'Pending', value: statusCounts.pending, color: STATUS_COLORS.pending },
      { name: 'In Progress', value: statusCounts.inProgress, color: STATUS_COLORS['in progress'] },
      { name: 'Submitted', value: statusCounts.submitted, color: STATUS_COLORS.submitted },
      { name: 'Completed', value: statusCounts.completed, color: STATUS_COLORS.completed },
      { name: 'Rejected', value: statusCounts.rejected, color: STATUS_COLORS.rejected },
    ].filter(item => item.value > 0);
  }, [statusCounts]);

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
