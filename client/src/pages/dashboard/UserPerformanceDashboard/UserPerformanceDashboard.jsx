import { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { AuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { BarChart3, Users, TrendingUp, AlertTriangle, CheckCircle2, Search, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import BlurFade from '@/components/animations/BlurFade';

// Helper to format seconds into readable duration
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

// Helper to get performance color
const getPerformanceColor = (efficiency) => {
  if (efficiency >= 80) return 'text-green-600 dark:text-green-400';
  if (efficiency >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const UserPerformanceDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('efficiency');
  const [sortOrder, setSortOrder] = useState('desc');

  // Redirect if not admin
  useEffect(() => {
    if (user && !hasPermission(user.role, 'PERFORMANCE_VIEW')) {
      toast.error('Access denied. Admin only.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch users and tasks using Firestore real-time listeners
  useEffect(() => {
    if (!user || !hasPermission(user.role, 'PERFORMANCE_VIEW')) return;

    setLoading(true);

    // Listen to users collection
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    }, (error) => {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    });

    // Listen to tasks collection
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks');
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTasks();
    };
  }, [user]);

  // Ctrl+K keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate performance metrics for each user
  const calculateUserMetrics = useCallback(() => {
    const officerUsers = users.filter(u => u.role === 'IT OFFICER' || u.role === 'ASSISTANT');

    return officerUsers.map(officer => {
      const assignedTasks = tasks.filter(t => t.officerId === officer.id || t.officerId === officer.userId);
      const completedTasks = assignedTasks.filter(t => t.status === 'completed');
      const rejectedTasks = assignedTasks.filter(t => t.status === 'rejected');
      const inProgressTasks = assignedTasks.filter(t => 
        ['pending', 'in progress', 'submitted'].includes(t.status)
      );
      const overdueTasks = assignedTasks.filter(t => {
        if (!t.deadline) return false;
        const deadline = t.deadline.toDate ? t.deadline.toDate() : new Date(t.deadline);
        return deadline < new Date() && !['completed', 'rejected', 'incomplete'].includes(t.status);
      });

      // Calculate average completion time
      const totalDuration = completedTasks.reduce((sum, t) => sum + (t.totalDurationSeconds || 0), 0);
      const avgCompletionTime = completedTasks.length > 0 ? totalDuration / completedTasks.length : 0;

      // Calculate efficiency
      const efficiency = assignedTasks.length > 0 
        ? (completedTasks.length / assignedTasks.length) * 100 
        : 0;

      // Performance score
      const performanceScore = (completedTasks.length * 10) - (rejectedTasks.length * 5) - (overdueTasks.length * 2);

      return {
        ...officer,
        assignedTasks: assignedTasks.length,
        completedTasks: completedTasks.length,
        rejectedTasks: rejectedTasks.length,
        inProgressTasks: inProgressTasks.length,
        overdueTasks: overdueTasks.length,
        avgCompletionTime,
        efficiency,
        performanceScore
      };
    });
  }, [users, tasks]);

  const userMetrics = calculateUserMetrics();

  // Sort users
  const sortedUsers = [...userMetrics].sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'efficiency': aVal = a.efficiency; bVal = b.efficiency; break;
      case 'completedTasks': aVal = a.completedTasks; bVal = b.completedTasks; break;
      case 'rejectedTasks': aVal = a.rejectedTasks; bVal = b.rejectedTasks; break;
      case 'performanceScore': aVal = a.performanceScore; bVal = b.performanceScore; break;
      case 'name': aVal = a.name || ''; bVal = b.name || ''; return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      default: aVal = a.efficiency; bVal = b.efficiency;
    }
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // Filter by search
  const filteredUsers = sortedUsers.filter(u => {
    const name = u.name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Summary stats
  const totalEmployees = userMetrics.length;
  const totalCompleted = userMetrics.reduce((sum, u) => sum + u.completedTasks, 0);
  const highestPerformer = userMetrics.reduce((max, u) => 
    (u.performanceScore > (max?.performanceScore || 0)) ? u : max, null
  );
  const mostDelayed = userMetrics.reduce((max, u) => 
    (u.overdueTasks > (max?.overdueTasks || 0)) ? u : max, null
  );
  const avgEfficiency = userMetrics.length > 0 
    ? userMetrics.reduce((sum, u) => sum + u.efficiency, 0) / userMetrics.length 
    : 0;

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground font-mono animate-pulse">Loading Performance Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">User Performance Dashboard</h1>
        <p className="text-muted-foreground mt-2">Monitor workforce productivity and efficiency</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BlurFade>
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <Users className="text-blue-500" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{totalEmployees}</p>
              </div>
            </div>
          </div>
        </BlurFade>

        <BlurFade delay={50}>
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-green-500" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Highest Performer</p>
                <p className="text-lg font-bold">{highestPerformer?.name || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">{highestPerformer ? `${highestPerformer.performanceScore} pts` : ''}</p>
              </div>
            </div>
          </div>
        </BlurFade>

        <BlurFade delay={100}>
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Most Delayed</p>
                <p className="text-lg font-bold">{mostDelayed?.name || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">{mostDelayed ? `${mostDelayed.overdueTasks} overdue` : ''}</p>
              </div>
            </div>
          </div>
        </BlurFade>

        <BlurFade delay={150}>
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Team Efficiency</p>
                <p className="text-2xl font-bold">{avgEfficiency.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </BlurFade>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            id="search-input"
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-muted-foreground/20 bg-transparent px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Performance Table */}
      <BlurFade delay={200}>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Employee</th>
                  <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Role</th>
                  <th 
                    className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('assignedTasks')}
                  >
                    <div className="flex items-center gap-1">
                      Assigned <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('completedTasks')}
                  >
                    <div className="flex items-center gap-1">
                      Completed <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('rejectedTasks')}
                  >
                    <div className="flex items-center gap-1">
                      Rejected <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">In Progress</th>
                  <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Avg Time</th>
                  <th 
                    className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('efficiency')}
                  >
                    <div className="flex items-center gap-1">
                      Efficiency <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Overdue</th>
                  <th 
                    className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('performanceScore')}
                  >
                    <div className="flex items-center gap-1">
                      Score <ArrowUpDown size={12} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((officer, index) => (
                  <tr key={officer.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {(officer.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{officer.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{officer.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {officer.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-foreground">{officer.assignedTasks}</td>
                    <td className="p-4 text-sm text-green-600 dark:text-green-400 font-medium">{officer.completedTasks}</td>
                    <td className="p-4 text-sm text-red-600 dark:text-red-400 font-medium">{officer.rejectedTasks}</td>
                    <td className="p-4 text-sm text-yellow-600 dark:text-yellow-400">{officer.inProgressTasks}</td>
                    <td className="p-4 text-sm text-foreground font-mono">{formatDuration(officer.avgCompletionTime)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              officer.efficiency >= 80 ? 'bg-green-500' :
                              officer.efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(officer.efficiency, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getPerformanceColor(officer.efficiency)}`}>
                          {officer.efficiency.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm font-medium ${officer.overdueTasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {officer.overdueTasks}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm font-bold ${officer.performanceScore >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {officer.performanceScore >= 0 ? '+' : ''}{officer.performanceScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No users found matching your search.
            </div>
          )}
        </div>
      </BlurFade>
    </div>
  );
};

export default UserPerformanceDashboard;
