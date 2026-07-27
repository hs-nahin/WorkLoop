import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WeeklyTrendChart = ({ tasks, loading }) => {
  const chartData = useMemo(() => {
    if (!tasks) return [];
    const now = new Date();
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayTasks = tasks.filter(t => {
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
    return weeklyTrend.reverse();
  }, [tasks]);

  if (loading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-widest">Weekly Trend</CardTitle>
          <CardDescription>Workload patterns over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <div className="animate-pulse text-muted-foreground text-sm">Loading chart...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium uppercase tracking-widest">Weekly Trend</CardTitle>
        <CardDescription>Workload patterns over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity="0.3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="created"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }}
                name="Created"
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 3 }}
                name="Completed"
              />
              <Line
                type="monotone"
                dataKey="submitted"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ fill: '#a855f7', r: 3 }}
                name="Submitted"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {chartData.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No trend data available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyTrendChart;
