import { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { AuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { apiRequest } from '@/api/apiClient';
import { useRealTimeTasks } from '@/hooks/useRealtime';
import { 
  Users, TrendingUp, AlertTriangle, CheckCircle2, 
  Search, ArrowUpDown, BarChart3, PieChart, 
  Activity, Target, Zap 
} from 'lucide-react';
import { toast } from 'sonner';
import BlurFade from '@/components/animations/BlurFade';
import { 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, Cell, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar,
  AreaChart, Area
} from 'recharts';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';

// --- Constants & Helpers ---
const COLORS = [
  { name: 'pending', color: '#f59e0b', dark: '#fbbf24' },    // amber-500/400
  { name: 'in_progress', color: '#3b82f6', dark: '#60a5fa' }, // blue-500/400
  { name: 'submitted', color: '#8b5cf6', dark: '#a78bfa' },   // violet-500/400
  { name: 'completed', color: '#10b981', dark: '#34d399' },   // emerald-500/400
  { name: 'rejected', color: '#ef4444', dark: '#f87171' },    // red-500/400
];

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return 'N/A';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(' ');
};

const getPerformanceColor = (efficiency) => {
  if (efficiency >= 80) return 'text-green-600 dark:text-green-400';
  if (efficiency >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const UserPerformanceDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('efficiency');
  const [sortOrder, setSortOrder] = useState('desc');

  const { tasks, loading } = useRealTimeTasks(user?.uid, user?.role);

  useEffect(() => {
    if (user && !hasPermission(user.role, 'PERFORMANCE_VIEW')) {
      toast.error('Access denied. Admin only.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('performance-search-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiRequest({ endpoint: '/users' });
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
    if (hasPermission(user?.role, 'PERFORMANCE_VIEW')) fetchUsers();
  }, [user?.role]);

  // --- Analytics Computations ---
  const metrics = useMemo(() => {
    const officerUsers = users.filter(u => { const r = (u.role || '').toUpperCase(); return r !== 'ADMIN'; });
    
    const userStats = officerUsers.map(officer => {
      const assigned = tasks.filter(t => t.officerId === officer.id || t.officerId === officer.userId);
      const completed = assigned.filter(t => t.status === 'completed');
      const rejected = assigned.filter(t => t.status === 'rejected');
      const overdue = assigned.filter(t => {
        if (!t.deadline) return false;
        const deadline = t.deadline.toDate ? t.deadline.toDate() : new Date(t.deadline);
        return deadline < new Date() && !['completed', 'rejected', 'incomplete'].includes(t.status);
      });

      const totalDuration = completed.reduce((sum, t) => sum + (t.totalDurationSeconds || 0), 0);
      const avgTime = completed.length > 0 ? totalDuration / completed.length : 0;
      const efficiency = assigned.length > 0 ? (completed.length / assigned.length) * 100 : 0;
      const score = (completed.length * 10) - (rejected.length * 5) - (overdue.length * 2);

      return {
        ...officer,
        assignedCount: assigned.length,
        completedCount: completed.length,
        rejectedCount: rejected.length,
        overdueCount: overdue.length,
        avgTime,
        efficiency,
        score
      };
    });

    // 1. Distribution Data
    const statusDist = {
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in progress').length,
      submitted: tasks.filter(t => t.status === 'submitted').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      rejected: tasks.filter(t => t.status === 'rejected').length,
    };
    const distChartData = Object.entries(statusDist).map(([name, value]) => ({ name, value }));

    // 2. Weekly Workload Trend (Simplified)
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const trendData = last7Days.map(date => {
      const created = tasks.filter(t => {
        try { return t.createdAt?.toDate?.()?.toISOString?.().split('T')[0] === date; } catch { return false; }
      }).length;
      const completed = tasks.filter(t => {
        try { return t.status === 'completed' && t.updatedAt?.toDate?.()?.toISOString?.().split('T')[0] === date; } catch { return false; }
      }).length;
      return { date, created, completed };
    });

    // 3. Summary Stats
    const totalTasks = tasks.length;
    const teamEfficiency = userStats.length > 0 
      ? userStats.reduce((sum, u) => sum + u.efficiency, 0) / userStats.length 
      : 0;
    const overallCompletionRate = totalTasks > 0 
      ? (tasks.filter(t => t.status === 'completed').length / totalTasks) * 100 
      : 0;

    return {
      userStats,
      distChartData,
      trendData,
      summary: {
        totalTasks,
        teamEfficiency,
        overallCompletionRate,
        highestPerformer: [...userStats].sort((a, b) => b.score - a.score)[0],
        mostDelayed: [...userStats].sort((a, b) => b.overdueCount - a.overdueCount)[0],
      }
    };
  }, [users, tasks]);

  const sortedUsers = useMemo(() => {
    const base = [...metrics.userStats];
    return base.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'efficiency': aVal = a.efficiency; bVal = b.efficiency; break;
        case 'completedCount': aVal = a.completedCount; bVal = b.completedCount; break;
        case 'rejectedCount': aVal = a.rejectedCount; bVal = b.rejectedCount; break;
        case 'score': aVal = a.score; bVal = b.score; break;
        case 'name': return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        default: aVal = a.efficiency; bVal = b.efficiency;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    }).filter(u => (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [metrics.userStats, sortBy, sortOrder, searchTerm]);

  if (loading) return <div className="min-h-screen flex items-center justify-center animate-pulse font-mono">Analyzing Performance Data...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Insights</h1>
          <p className="text-muted-foreground mt-2">Enterprise operational intelligence & workforce analytics</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg border border-border">
          <div className="px-3 py-1 text-xs font-medium bg-background rounded shadow-sm border border-border">Real-time Feed</div>
          <div className="px-3 py-1 text-xs text-muted-foreground">Dynamic Analysis</div>
        </div>
      </header>

      {/* TOP: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BlurFade delay={50}>
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Team Efficiency</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter">{metrics.summary.teamEfficiency.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Avg. workforce productivity</p>
            </CardContent>
          </Card>
        </BlurFade>
        <BlurFade delay={100}>
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter">{metrics.summary.overallCompletionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Tasks effectively closed</p>
            </CardContent>
          </Card>
        </BlurFade>
        <BlurFade delay={150}>
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Top Performer</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">{metrics.summary.highestPerformer?.name || 'N/A'}</div>
              <p className="text-xs text-muted-foreground mt-1">{metrics.summary.highestPerformer?.score || 0} Performance Pts</p>
            </CardContent>
          </Card>
        </BlurFade>
        <BlurFade delay={200}>
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Critical Focus</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">{metrics.summary.mostDelayed?.name || 'N/A'}</div>
              <p className="text-xs text-muted-foreground mt-1">{metrics.summary.mostDelayed?.overdueCount || 0} tasks overdue</p>
            </CardContent>
          </Card>
        </BlurFade>
      </div>

      {/* MIDDLE: Charts & Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <BlurFade delay={300}>
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" /> Task Status Distribution
              </CardTitle>
              <CardDescription>Visual breakdown of operational workload</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                 <RechartsPieChart>
                   <Pie
                     data={metrics.distChartData}
                     cx="50%" cy="50%"
                     innerRadius={70} outerRadius={90}
                     paddingAngle={8}
                     stroke="none"
                     dataKey="value"
                   >
                     {metrics.distChartData.map((entry, index) => (
                       <Cell 
                         key={`cell-${index}`} 
                         fill={COLORS[index % COLORS.length]?.color || '#ccc'} 
                       />
                     ))}
                   </Pie>
                   <Tooltip 
                     contentStyle={{ 
                       backgroundColor: 'var(--background)', 
                       borderColor: 'var(--border)',
                       color: 'var(--foreground)',
                       borderRadius: '8px'
                     }} 
                   />
                   <Legend 
                     verticalAlign="bottom" 
                     height={36}
                     formatter={(value) => <span className="text-xs font-medium text-muted-foreground capitalize">{value}</span>}
                   />
                 </RechartsPieChart>
               </ResponsiveContainer>
            </CardContent>
          </Card>
        </BlurFade>

        {/* Workload Trend Chart */}
        <BlurFade delay={400}>
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Operational Tempo (7D)
              </CardTitle>
              <CardDescription>Created vs Completed tasks trend</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.trendData}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" opacity={0.1} />
                  <XAxis dataKey="date" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="created" stroke="#8884d8" fillOpacity={1} fill="url(#colorCreated)" />
                  <Area type="monotone" dataKey="completed" stroke="#82ca9d" fillOpacity={1} fill="url(#colorCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </BlurFade>
      </div>

      {/* BOTTOM: Detailed Analytics Table */}
      <BlurFade delay={600}>
        <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 overflow-hidden">
            <div className="absolute inset-0 w-full bg-gradient-to-b from-transparent via-sky-500/40 to-transparent blur-[2px] animate-beam-vertical" />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1 overflow-hidden">
            <div className="absolute inset-0 w-full bg-gradient-to-b from-transparent via-sky-500/40 to-transparent blur-[2px] animate-beam-vertical" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Workforce Performance Ranking</CardTitle>
              <CardDescription>Detailed efficiency metrics per officer</CardDescription>
            </div>
             <div className="flex items-center gap-3">
               <div className="relative flex items-center gap-4">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                 <input
                   id="performance-search-input"
                   type="text"
                   placeholder="Search users..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10 pr-12 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition-all w-full"
                 />
                 <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-muted-foreground/20 bg-transparent px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 opacity-100">
                   <span className="text-xs">⌘</span>K
                 </kbd>
               </div>
             </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                     <th className="text-left p-4 font-semibold text-muted-foreground uppercase tracking-wider">Assignee</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary" onClick={() => { setSortBy('completedCount'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>
                      Completed <ArrowUpDown size={12} className="inline ml-1" />
                    </th>
                    <th className="text-center p-4 font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary" onClick={() => { setSortBy('efficiency'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>
                      Efficiency <ArrowUpDown size={12} className="inline ml-1" />
                    </th>
                    <th className="text-center p-4 font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary" onClick={() => { setSortBy('rejectedCount'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>
                      Rejected <ArrowUpDown size={12} className="inline ml-1" />
                    </th>
                    <th className="text-center p-4 font-semibold text-muted-foreground uppercase tracking-s-wider">Avg Time</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary" onClick={() => { setSortBy('score'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>
                      Score <ArrowUpDown size={12} className="inline ml-1" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedUsers.map((u, i) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {(u.name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{u.name || 'Unknown'}</p>
                            <p className="text-[10px] text-muted-foreground">{u.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center font-medium">{u.completedCount}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${u.efficiency >= 80 ? 'bg-green-500' : u.efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(u.efficiency, 100)}%` }}
                            />
                          </div>
                          <span className={`font-semibold ${getPerformanceColor(u.efficiency)}`}>{u.efficiency.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-center text-red-500 font-medium">{u.rejectedCount}</td>
                      <td className="p-4 text-center font-mono text-xs">{formatDuration(u.avgTime)}</td>
                      <td className="p-4 text-center font-bold">{u.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
};

export default UserPerformanceDashboard;
