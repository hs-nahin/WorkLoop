import { useState, useEffect, useContext, useMemo, useRef, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, limit, startAfter } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { AuthContext } from '@/context/AuthContext';
import { apiRequest } from '@/api/apiClient';
import { hasPermission } from '@/lib/permissions';
import BlurFade from '@/components/animations/BlurFade';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Loader2,
  UserCheck,
  XCircle,
  FileUp,
  FileX,
  PlusCircle,
  Trash2,
  History,
  MessageSquare,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const actionLabels = {
  user_created: { label: 'User Created', icon: PlusCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  user_updated: { label: 'User Updated', icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  user_deleted: { label: 'User Deleted', icon: Trash2, color: 'text-red-500', bg: 'bg-red-500/10' },
  user_toggled: { label: 'User Toggled', icon: RotateCcw, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  password_reset: { label: 'Password Reset', icon: History, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  company_updated: { label: 'Company Updated', icon: History, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  logo_uploaded: { label: 'Logo Uploaded', icon: FileUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  attachment_uploaded: { label: 'File Uploaded', icon: FileUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  attachment_deleted: { label: 'File Deleted', icon: FileX, color: 'text-red-500', bg: 'bg-red-500/10' },
  task_created: { label: 'Task Created', icon: PlusCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  task_accepted: { label: 'Task Accepted', icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  task_submitted: { label: 'Task Submitted', icon: Loader2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  task_approved: { label: 'Task Approved', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
  task_rejected: { label: 'Task Rejected', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  task_incomplete: { label: 'Marked Incomplete', icon: History, color: 'text-orange-500', bg: 'bg-orange-500/10' },
};

const classifyAction = (action) => {
  return actionLabels[action] || { label: action, icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' };
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const filterOptions = [
  { value: '', label: 'All Actions' },
  ...Object.entries(actionLabels).map(([value, config]) => ({
    value,
    label: config.label,
  })),
];

const PAGE_SIZE = 25;

const AuditLogs = () => {
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [userRoleMap, setUserRoleMap] = useState({});
  const searchRef = useRef(null);

  const handleSearchShortcut = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleSearchShortcut);
    return () => document.removeEventListener('keydown', handleSearchShortcut);
  }, [handleSearchShortcut]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiRequest({ endpoint: '/users' });
        const map = {};
        (data || []).forEach(u => {
          const uid = u.userId || u.id || u.uid;
          if (uid) map[uid] = u.role || '';
          if (u.name) map[u.name] = u.role || '';
        });
        setUserRoleMap(map);
      } catch (e) {
        console.error('Failed to fetch users for role lookup:', e);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'auditLogs'),
      orderBy('timestamp', 'desc'),
      limit(PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogs(allLogs);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching audit logs:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(log =>
        (log.performedByName || '').toLowerCase().includes(q) ||
        (log.targetTitle || '').toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q)
      );
    }

    if (actionFilter) {
      result = result.filter(log => log.action === actionFilter);
    }

    if (userFilter.trim()) {
      const q = userFilter.toLowerCase();
      result = result.filter(log =>
        (log.performedByName || '').toLowerCase().includes(q)
      );
    }

    if (dateRange.start) {
      const startMs = new Date(dateRange.start).getTime();
      result = result.filter(log => {
        const t = log.timestamp?.toDate ? log.timestamp.toDate().getTime() : new Date(log.timestamp || 0).getTime();
        return t >= startMs;
      });
    }

    if (dateRange.end) {
      const endMs = new Date(dateRange.end).getTime() + 86400000;
      result = result.filter(log => {
        const t = log.timestamp?.toDate ? log.timestamp.toDate().getTime() : new Date(log.timestamp || 0).getTime();
        return t <= endMs;
      });
    }

    return result;
  }, [logs, searchQuery, actionFilter, userFilter, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const uniqueUsers = useMemo(() => {
    const names = new Set(logs.map(l => l.performedByName).filter(Boolean));
    return [...names];
  }, [logs]);

  const getRoleColor = (role) => {
    if (!role) return '';
    switch (role) {
      case 'ADMIN': return 'bg-red-500/20 text-red-500';
      case 'IT_OFFICER':
      case 'IT OFFICER': return 'bg-blue-500/20 text-blue-500';
      case 'ASSISTANT': return 'bg-purple-500/20 text-purple-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const resolveRole = (log) => {
    if (log.userRole) return log.userRole;
    return userRoleMap[log.performedByUid] || userRoleMap[log.performedByName] || '';
  };

  if (!hasPermission(user?.role, 'AUDIT_LOG_VIEW')) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <BlurFade>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Activity Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Complete audit trail of all system actions and user activity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full font-mono">
              {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </BlurFade>

      <BlurFade>
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Search by user, task, action..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                className="pl-9 pr-16"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 cursor-pointer"
            >
              <Filter size={16} />
              Filters
              {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-border">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Action Type</label>
                <select
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {filterOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">User</label>
                <select
                  value={userFilter}
                  onChange={(e) => { setUserFilter(e.target.value); setPage(0); }}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">All Users</option>
                  {uniqueUsers.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setPage(0); }}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setPage(0); }}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            </div>
          )}
        </div>
      </BlurFade>

      <BlurFade>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading audit logs...</div>
          ) : paginatedLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No audit logs match your filters.</div>
          ) : (
            <div className="divide-y divide-border">
              {paginatedLogs.map((log) => {
                const config = classifyAction(log.action);
                const Icon = config.icon;
                const isExpanded = expandedId === log.id;

                return (
                  <div
                    key={log.id}
                    className="group hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0 border border-border`}>
                        <Icon size={16} className={config.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{log.performedByName || 'System'}</span>
                          {resolveRole(log) && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getRoleColor(resolveRole(log))}`}>
                              {resolveRole(log)}
                            </span>
                          )}
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        {log.targetTitle && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            Target: {log.targetTitle}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[11px] text-muted-foreground/60 font-mono">
                          {formatTimestamp(log.timestamp)}
                        </p>
                      </div>
                      <div className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 pl-[72px]">
                        <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-foreground space-y-1">
                          {log.details && (
                            <p><span className="text-muted-foreground">Details:</span> {log.details}</p>
                          )}
                          <p><span className="text-muted-foreground">Action:</span> {log.action}</p>
                          {log.targetId && (
                            <p><span className="text-muted-foreground">Target ID:</span> <span className="font-mono">{log.targetId}</span></p>
                          )}
                          {log.targetTitle && (
                            <p><span className="text-muted-foreground">Target:</span> {log.targetTitle}</p>
                          )}
                          <p><span className="text-muted-foreground">Timestamp:</span> {formatTimestamp(log.timestamp)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </BlurFade>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="cursor-pointer"
          >
            <ChevronLeft size={16} />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i}
              variant={page === i ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPage(i)}
              className="cursor-pointer min-w-[2rem]"
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="cursor-pointer"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
