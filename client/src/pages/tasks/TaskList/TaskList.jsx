import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Pencil,
  Search,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ListFilter,
} from 'lucide-react';
import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { apiRequest } from '@/api/apiClient';
import GradientText from '@/components/animations/GradientText';
import TextHighlighter from '@/components/animations/TextHighlighter';
import { AuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useRealTimeTasks } from '@/hooks/useRealtime';
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog';

const ITEMS_PER_PAGE = 15;

const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp?.toDate === 'function') return timestamp.toDate();
  if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
  try { return new Date(timestamp); } catch { return null; }
};

const formatDate = (timestamp) => {
  const date = convertTimestamp(timestamp);
  if (!date || isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in progress', label: 'In Progress' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'rejected', label: 'Rejected' },
];

const TaskList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletedIds, setDeletedIds] = useState(() => new Set());

  const canDelete = hasPermission(user?.role, 'TASK_DELETE');
  const canEdit = hasPermission(user?.role, 'TASK_EDIT');

  const { tasks: realtimeTasks, loading } = useRealTimeTasks(user?.uid, user?.role);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

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

  const allTasks = useMemo(() => {
    return (realtimeTasks || []).filter(task => task.status !== 'completed' && !deletedIds.has(task.id));
  }, [realtimeTasks, deletedIds]);

  const filteredTasks = useMemo(() => {
    let result = allTasks;
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.officerName?.toLowerCase().includes(q) ||
        t.assistantName?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allTasks, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / ITEMS_PER_PAGE));
  const paginatedTasks = useMemo(
    () => filteredTasks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filteredTasks, currentPage]
  );

  const statusCounts = useMemo(() => {
    const counts = { all: allTasks.length, pending: 0, 'in progress': 0, submitted: 0, rejected: 0 };
    allTasks.forEach(t => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    return counts;
  }, [allTasks]);

  const confirmDelete = useCallback((taskId) => {
    setTaskToDelete(taskId);
    setAlertOpen(true);
  }, []);

  const handleDeleteTask = useCallback(async () => {
    const taskId = taskToDelete;
    if (!taskId) return;
    try {
      setAlertOpen(false);
      setDeletedIds(prev => new Set([...prev, taskId]));
      await apiRequest({ endpoint: `/tasks/${taskId}`, method: 'DELETE' });
      toast.success('Task deleted successfully');
    } catch (error) {
      setDeletedIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      toast.error(error.message || 'Failed to delete task');
    } finally {
      setTaskToDelete(null);
    }
  }, [taskToDelete]);

  const handleEditTask = useCallback((task, e) => {
    e.stopPropagation();
    setEditTask(task);
    setEditOpen(true);
  }, []);

  const handleTaskUpdated = useCallback(() => {
    setEditOpen(false);
    setEditTask(null);
  }, []);

  const getStatusBadge = useCallback((status) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 size={12} className="mr-1" /> {status}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock size={12} className="mr-1" /> Pending</Badge>;
      case 'in progress':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Clock size={12} className="mr-1" /> In Progress</Badge>;
      case 'submitted':
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20"><Clock size={12} className="mr-1" /> Submitted</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><AlertCircle size={12} className="mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  const actionColWidth = (canEdit ? 1 : 0) + (canDelete ? 1 : 0);

  const gridCols = useMemo(() => {
    if (actionColWidth === 2) return 'grid-cols-[18%_8%_8%_12%_12%_11%_9%_9%_5%_5%]';
    if (actionColWidth === 1) return 'grid-cols-[20%_9%_9%_13%_13%_12%_10%_10%_4%]';
    return 'grid-cols-[22%_10%_10%_14%_14%_13%_11%_11%]';
  }, [actionColWidth]);

  const headerGridCols = gridCols;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 px-2 sm:px-0">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="hover:bg-accent cursor-pointer shrink-0"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="space-y-1 min-w-0">
            <TextHighlighter text="Task Repository" className="text-2xl sm:text-3xl font-bold tracking-tight" />
            <GradientText text="Track, assign and monitor internal IT operations" className="text-xs sm:text-sm opacity-70 block truncate" />
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-0 overflow-hidden rounded-lg border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all bg-background shadow-sm w-full md:w-[450px]">
            <div className="flex items-center justify-center pl-3 text-muted-foreground shrink-0">
              <Search size={16} />
            </div>
            <div className="relative flex-1 min-w-0">
              <Input
                id="search-input"
                placeholder="Search tasks..."
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 h-9 w-full text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-muted-foreground/20 bg-transparent px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 opacity-100">
                <span className="text-xs">&#8984;</span>K
              </kbd>
            </div>
          </div>
        </div>
      </header>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <ListFilter size={16} className="text-muted-foreground shrink-0" />
        {STATUS_FILTERS.map((sf) => (
          <button
            key={sf.key}
            onClick={() => setStatusFilter(sf.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer border',
              statusFilter === sf.key
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
            )}
          >
            {sf.label}
            <span className={cn(
              'ml-1.5 text-[10px]',
              statusFilter === sf.key ? 'opacity-80' : 'opacity-60'
            )}>
              {statusCounts[sf.key] || 0}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Fetching repository data...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border bg-card/50 overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 overflow-hidden">
              <div className="absolute inset-0 w-full bg-gradient-to-b from-transparent via-sky-500/40 to-transparent blur-[2px] animate-beam-vertical" />
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1 overflow-hidden">
              <div className="absolute inset-0 w-full bg-gradient-to-b from-transparent via-sky-500/40 to-transparent blur-[2px] animate-beam-vertical" />
            </div>

            {/* Header */}
            <div className={`grid w-full ${headerGridCols}`}>
              <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b">Task Information</div>
              <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Status</div>
              <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Priority</div>
              <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Assigned To</div>
              <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Collaborator</div>
              <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Due Date</div>
              <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Created By</div>
              <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l">Created Date</div>
              {canEdit && (
                <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l flex items-center justify-center">Edit</div>
              )}
              {canDelete && (
                <div className="px-4 py-3 bg-muted/50 font-medium text-xs text-muted-foreground uppercase border-b border-l flex items-center justify-center">Del</div>
              )}
            </div>

            {/* Rows */}
            {paginatedTasks.length > 0 ? (
              paginatedTasks.map((task) => (
                <Fragment key={task.id}>
                  <div className={`grid w-full ${gridCols} hover:bg-accent/30 transition-colors`}>
                    <div className="px-4 py-3 border-b border-border/50 cursor-pointer" onClick={() => navigate(`/tasks/${task.id}`)}>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground hover:text-primary text-sm truncate">{task.title}</span>
                        <span className="text-xs text-muted-foreground truncate">{task.description || 'No description'}</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 border-b border-border/50 cursor-pointer flex items-center" onClick={() => navigate(`/tasks/${task.id}`)}>
                      {getStatusBadge(task.status)}
                    </div>
                    <div className="px-4 py-3 border-b border-border/50 cursor-pointer flex items-center" onClick={() => navigate(`/tasks/${task.id}`)}>
                      <Badge className={cn(
                        task.priority === 'high' && "bg-red-500/10 text-red-500 border-red-500/20",
                        task.priority === 'medium' && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                        task.priority === 'low' && "bg-green-500/10 text-green-500 border-green-500/20",
                        task.priority !== 'high' && task.priority !== 'medium' && task.priority !== 'low' && "bg-muted text-muted-foreground"
                      )}>{task.priority}</Badge>
                    </div>
                    <div className="px-4 py-3 border-b border-border/50 cursor-pointer flex items-center gap-2" onClick={() => navigate(`/tasks/${task.id}`)}>
                      <div className="w-6 h-6 rounded-full bg-blue-400/20 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">
                        {(task.officerName || task.officerId)?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm truncate">{task.officerName || task.officerId || 'Unassigned'}</span>
                    </div>
                    <div className="px-4 py-3 border-b border-border/50 cursor-pointer flex items-center gap-2" onClick={() => navigate(`/tasks/${task.id}`)}>
                      {task.assistantName ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-purple-400/20 flex items-center justify-center text-[10px] font-bold text-purple-400 shrink-0">
                            {task.assistantName?.charAt(0) || 'U'}
                          </div>
                          <span className="text-sm truncate">{task.assistantName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </div>
                    <div className="px-4 py-3 border-b border-border/50 cursor-pointer flex items-center gap-2 text-sm text-muted-foreground" onClick={() => navigate(`/tasks/${task.id}`)}>
                      <Calendar size={14} className="shrink-0" />
                      {task.deadline ? (
                        <span className="text-sm text-muted-foreground truncate">{formatDate(task.deadline)}</span>
                      ) : <span className="text-sm text-muted-foreground">None</span>}
                    </div>
                    <div className="px-4 py-3 border-b border-border/50 cursor-pointer flex items-center gap-2" onClick={() => navigate(`/tasks/${task.id}`)}>
                      <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center text-[10px] font-bold text-green-400 shrink-0">
                        {(task.createdByName || task.createdBy)?.charAt(0) || 'A'}
                      </div>
                      <span className="text-sm truncate">{task.createdByName || 'Unknown'}</span>
                    </div>
                    <div className="px-4 py-3 border-b border-border/50 cursor-pointer text-sm text-muted-foreground" onClick={() => navigate(`/tasks/${task.id}`)}>
                      <span className="truncate block">{formatDate(task.createdAt)}</span>
                    </div>
                    {canEdit && (
                      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-center">
                        <Button variant="ghost" size="sm" onClick={(e) => handleEditTask(task, e)} className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer">
                          <Pencil size={14} />
                        </Button>
                      </div>
                    )}
                    {canDelete && (
                      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-center">
                        <AlertDialog open={alertOpen && taskToDelete === task.id} onOpenChange={(open) => { setAlertOpen(open); if (!open) setTaskToDelete(null); }}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); confirmDelete(task.id); }} className="text-red-500 hover:text-red-700 hover:bg-red-500/10 cursor-pointer">
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="w-[90vw] max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Task</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete this task? This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTask()}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </Fragment>
              ))
            ) : (
              <div className="px-4 py-16 flex flex-col items-center justify-center text-muted-foreground">
                <AlertCircle size={40} className="mb-3 opacity-40" />
                <p className="italic text-sm">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No tasks match your search or filter criteria.'
                    : 'No tasks found. Create your first task to get started.'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/30">
                <span className="text-xs text-muted-foreground">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredTasks.length)} of {filteredTasks.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="cursor-pointer h-7 px-2"
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="text-xs text-muted-foreground px-1">...</span>
                      ) : (
                        <Button
                          key={p}
                          variant={p === currentPage ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setCurrentPage(p)}
                          className="cursor-pointer h-7 w-7 p-0 text-xs"
                        >
                          {p}
                        </Button>
                      )
                    )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="cursor-pointer h-7 px-2"
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginatedTasks.length > 0 ? (
              paginatedTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border bg-card/50 p-4 active:scale-[0.98] transition-all"
                >
                  <div
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-foreground truncate">{task.title}</h3>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
                        )}
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-muted-foreground mt-0.5" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {getStatusBadge(task.status)}
                      <Badge className={cn(
                        task.priority === 'high' && "bg-red-500/10 text-red-500 border-red-500/20",
                        task.priority === 'medium' && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                        task.priority === 'low' && "bg-green-500/10 text-green-500 border-green-500/20",
                      )}>{task.priority}</Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-400/20 flex items-center justify-center text-[8px] font-bold text-blue-400 shrink-0">
                          {(task.officerName || task.officerId)?.charAt(0) || 'U'}
                        </div>
                        <span className="truncate">{task.officerName || task.officerId || 'Unassigned'}</span>
                      </div>
                      {task.assistantName ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-purple-400/20 flex items-center justify-center text-[8px] font-bold text-purple-400 shrink-0">
                            {task.assistantName?.charAt(0) || 'U'}
                          </div>
                          <span className="truncate">{task.assistantName}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="shrink-0" />
                        {task.deadline ? (
                          <span className="truncate">{formatDate(task.deadline)}</span>
                        ) : <span>No deadline</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>Created: {formatDate(task.createdAt)}</span>
                      </div>
                      {task.createdByName && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <span>By: {task.createdByName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-end gap-2">
                    {canEdit && (
                      <Button variant="ghost" size="sm" onClick={(e) => handleEditTask(task, e)} className="text-muted-foreground hover:text-foreground cursor-pointer h-8">
                        <Pencil size={14} className="mr-1" /> Edit
                      </Button>
                    )}
                    {canDelete && (
                      <AlertDialog open={alertOpen && taskToDelete === task.id} onOpenChange={(open) => { setAlertOpen(open); if (!open) setTaskToDelete(null); }}>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); confirmDelete(task.id); }} className="text-red-500 hover:text-red-700 hover:bg-red-500/10 cursor-pointer h-8">
                            <Trash2 size={14} className="mr-1" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[90vw] max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Task</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure you want to delete this task? This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTask()}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border bg-card/50 px-4 py-16 flex flex-col items-center justify-center text-muted-foreground">
                <AlertCircle size={36} className="mb-3 opacity-40" />
                <p className="italic text-sm">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No tasks match your search or filter criteria.'
                    : 'No tasks found. Create your first task to get started.'}
                </p>
              </div>
            )}

            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-xs text-muted-foreground">
                  {currentPage}/{totalPages} pages ({filteredTasks.length} tasks)
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="cursor-pointer h-7 px-2">
                    <ChevronLeft size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs cursor-default" disabled>
                    {currentPage}/{totalPages}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="cursor-pointer h-7 px-2">
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Task Dialog */}
      <EditTaskDialog open={editOpen} onOpenChange={setEditOpen} task={editTask} onTaskUpdated={handleTaskUpdated} />
    </div>
  );
};

export default TaskList;
