import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRealTimeStats } from '@/hooks/useRealtime';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContextInstance';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WeeklyTrendChart = () => {
  const { user } = useContext(AuthContext);
  const { stats, loading } = useRealTimeStats(user?.uid, user?.role);

  const chartData = useMemo(() => {
    if (!stats?.weeklyTrend) return [];
    return [...stats.weeklyTrend].reverse();
  }, [stats?.weeklyTrend]);

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
