import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiRequest } from '@/api/apiClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';

const WorkloadDistribution = ({ tasks, loading }) => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiRequest({ endpoint: '/users' });
        setUsers(Array.isArray(data) ? data.filter(u => 
          (u.role || '').toUpperCase() !== 'ADMIN' && u.isActive !== false
        ) : []);
      } catch (e) {
        console.error('Failed to fetch users:', e);
      }
    };
    if (hasPermission(user?.role, 'PERFORMANCE_VIEW')) fetchUsers();
  }, [user?.role]);

  const chartData = useMemo(() => {
    if (!tasks || !users.length) return [];
    
    return users.map(u => {
      const userTasks = tasks.filter(t => 
        t.officerId === u.id || t.officerId === u.uid
      );
      return {
        name: u.name || u.email || 'Unknown',
        tasks: userTasks.length,
        completed: userTasks.filter(t => 
          t.status === 'completed' || t.status === 'approved'
        ).length,
        pending: userTasks.filter(t => 
          ['pending', 'in progress', 'submitted'].includes(t.status)
        ).length,
      };
    }).filter(u => u.tasks > 0).sort((a, b) => b.tasks - a.tasks);
  }, [tasks, users]);

  if (loading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users size={20} className="text-purple-500" />
            Workload Distribution
          </CardTitle>
          <CardDescription>How tasks are distributed among team members</CardDescription>
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
          <Users size={20} className="text-purple-500" />
          Workload Distribution
        </CardTitle>
        <CardDescription>How tasks are distributed among team members</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No workload data available</div>
        ) : (
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity="0.3" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar 
                  dataKey="tasks" 
                  fill="#3b82f6" 
                  radius={[0, 4, 4, 0]}
                  name="Total Tasks"
                />
                <Bar 
                  dataKey="completed" 
                  fill="#22c55e" 
                  radius={[4, 0, 0, 4]}
                  name="Completed"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkloadDistribution;
