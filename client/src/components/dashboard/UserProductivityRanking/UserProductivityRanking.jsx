import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiRequest } from '@/api/apiClient';
import { Medal, Trophy } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';

const UserProductivityRanking = ({ tasks, loading }) => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiRequest({ endpoint: '/users' });
        setUsers(Array.isArray(data) ? data.filter(u => u.role && u.isActive !== false) : []);
      } catch (e) {
        console.error('Failed to fetch users:', e);
      }
    };
    if (hasPermission(user?.role, 'PERFORMANCE_VIEW')) fetchUsers();
  }, [user?.role]);

  const rankings = useMemo(() => {
    if (!tasks || !users.length) return [];
    
    const userStats = users.map(u => {
      const userTasks = tasks.filter(t => 
        t.officerId === u.id || t.officerId === u.uid
      );
      const completed = userTasks.filter(t => 
        t.status === 'completed' || t.status === 'approved'
      );
      const rejected = userTasks.filter(t => t.status === 'rejected');
      const inProgress = userTasks.filter(t => 
        ['pending', 'in progress', 'submitted'].includes(t.status)
      );
      
      const efficiency = userTasks.length > 0 
        ? (completed.length / userTasks.length) * 100 
        : 0;
      
      const avgCompletionTime = completed.length > 0
        ? completed.reduce((sum, t) => sum + (t.totalDurationSeconds || 0), 0) / completed.length
        : 0;

      return {
        ...u,
        totalTasks: userTasks.length,
        completed: completed.length,
        rejected: rejected.length,
        inProgress: inProgress.length,
        efficiency,
        avgCompletionTime,
        score: (completed.length * 10) - (rejected.length * 5) - (inProgress.length * 2),
      };
    });

    return userStats
      .filter(u => u.totalTasks > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [tasks, users]);

  if (loading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Trophy size={20} className="text-yellow-500" />
            Productivity Ranking
          </CardTitle>
          <CardDescription>Top performing team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">Loading rankings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Trophy size={20} className="text-yellow-500" />
          Productivity Ranking
        </CardTitle>
        <CardDescription>Top performing team members</CardDescription>
      </CardHeader>
      <CardContent>
        {rankings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No ranking data available</div>
        ) : (
          <div className="space-y-3">
            {rankings.map((u, index) => (
              <div 
                key={u.uid || u.id} 
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                  ${index === 0 ? 'bg-yellow-500/20 text-yellow-600' : 
                    index === 1 ? 'bg-gray-400/20 text-gray-600' :
                    index === 2 ? 'bg-amber-600/20 text-amber-700' :
                    'bg-muted/50 text-muted-foreground'}
                `}>
                  {index < 3 ? (
                    <Medal size={16} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-green-600">{u.completed}</p>
                  <p className="text-xs text-muted-foreground">completed</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${u.efficiency >= 80 ? 'text-green-600' : u.efficiency >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {u.efficiency.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">efficiency</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserProductivityRanking;
