import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Circle, Clock, Pencil } from 'lucide-react';
import { apiRequest } from '@/api/apiClient';
import { hasPermission } from '@/lib/permissions';
import BlurFade from '@/components/animations/BlurFade';
import GradientText from '@/components/animations/GradientText';
import MagicCard from '@/components/animations/MagicCard';
import TextHighlighter from '@/components/animations/TextHighlighter';
import Confetti from '@/components/animations/Confetti';
import { AuthContext } from '@/context/AuthContext';
import TaskDiscussion from '@/components/tasks/TaskDiscussion/TaskDiscussion';
import SubtaskWorkflow from '@/components/tasks/SubtaskWorkflow/SubtaskWorkflow';
import AttachmentPanel from '@/components/tasks/Attachments/AttachmentPanel';
import ActivityTimeline from '@/components/tasks/ActivityTimeline/ActivityTimeline';
import { useRealTimeTask } from '@/hooks/useRealtime';

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp._seconds) {
    return new Date(timestamp._seconds * 1000);
  }
  return new Date(timestamp);
};

// Helper function to format date using browser's local timezone
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

// Helper to format seconds into human-readable duration
const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0m';
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

const TaskDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [report, setReport] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [officers, setOfficers] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [editDeadlineValue, setEditDeadlineValue] = useState('');

  // Real-time task listener - auto-updates when task changes
  const { task: realtimeTask, loading: taskLoading } = useRealTimeTask(id);

  // Update when real-time data changes
  useEffect(() => {
    if (realtimeTask) {
      setTask(realtimeTask);
    }
    setIsLoading(taskLoading);
  }, [realtimeTask, taskLoading]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiRequest({ endpoint: '/users' });
        const officerList = data.filter(u => (u.role || '').toUpperCase() !== 'ADMIN' && u.isActive !== false);
        setOfficers(officerList);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Timer management for live duration tracking
  useEffect(() => {
    // Clear existing interval
    if (timerInterval) clearInterval(timerInterval);
    
    if (!task) return;

    // Calculate initial elapsed time
    const calculateElapsed = () => {
      const totalCompleted = task.totalDurationSeconds || 0;
      
      if (task.isTimerRunning && task.workStartedAt) {
        const workStarted = convertTimestamp(task.workStartedAt);
        if (workStarted) {
          const currentSession = (Date.now() - workStarted.getTime()) / 1000;
          return totalCompleted + currentSession;
        }
      }
      return totalCompleted;
    };

    setElapsedTime(calculateElapsed());

    // Set up interval for live updates if timer is running
    if (task.isTimerRunning && task.workStartedAt) {
      const interval = setInterval(() => {
        setElapsedTime(calculateElapsed());
      }, 1000);
      setTimerInterval(interval);
    }

    // Cleanup interval on unmount or task change
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [task]);

  const handleAcceptTask = async () => {
    try {
      await apiRequest({ 
        endpoint: `/tasks/${id}/accept`, 
        method: 'PATCH' 
      });
      toast.success('Task accepted!');
      const data = await apiRequest({ endpoint: `/tasks/${id}` });
      setTask(data);
    } catch (error) {
      toast.error(error.message || 'Failed to accept task');
    }
  };

  const handleCompleteTask = async () => {
    if (!report.trim()) return toast.error('Please provide a completion report');
    
    try {
      await apiRequest({ 
        endpoint: `/tasks/${id}/submit`, 
        method: 'PATCH', 
        body: { report }, 
      });
      toast.success('Task submitted for admin review!');
      const data = await apiRequest({ endpoint: `/tasks/${id}` });
      setTask(data);
      setReport('');
    } catch (error) {
      toast.error(error.message || 'Submission failed');
    }
  };

  const handleIncompleteTask = async () => {
    try {
      await apiRequest({ 
        endpoint: `/tasks/${id}/incomplete`, 
        method: 'PATCH' 
      });
      toast.error('Task marked as incomplete');
      const data = await apiRequest({ endpoint: `/tasks/${id}` });
      setTask(data);
    } catch (error) {
      toast.error(error.message || 'Failed to mark task as incomplete');
    }
  };

  const handleApprove = async () => {
    try {
      await apiRequest({ 
        endpoint: `/tasks/${id}/approve`, 
        method: 'PATCH',
        body: feedback ? { feedback } : {}
      });
      toast.success('Task approved!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Approval failed');
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) return toast.error('Please provide feedback for rejection');
    
    try {
      await apiRequest({ 
        endpoint: `/tasks/${id}/reject`, 
        method: 'PATCH', 
        body: { feedback }, 
      });
      toast.success('Task rejected with feedback');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Rejection failed');
    }
  };

  const handleUpdateDeadline = async () => {
    if (!editDeadlineValue) return;
    try {
      const newDeadline = new Date(editDeadlineValue);
      await apiRequest({
        endpoint: `/tasks/${id}`,
        method: 'PUT',
        body: { deadline: newDeadline }
      });
      setIsEditingDeadline(false);
      toast.success('Deadline updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update deadline');
    }
  };

  const handleEditDeadline = () => {
    const current = convertTimestamp(task.deadline);
    setEditDeadlineValue(current ? current.toISOString().slice(0, 16) : '');
    setIsEditingDeadline(true);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-foreground font-mono animate-pulse">Loading Task...</div>;
  if (!task) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground">
      <p className="text-lg font-semibold">Task not found</p>
      <p className="text-sm">This task may have been deleted or you may not have access.</p>
      <Button variant="outline" onClick={() => navigate('/tasks')}>Back to Tasks</Button>
    </div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 dark:text-green-400 border-green-600/30 dark:border-green-400/30 bg-green-600/10 dark:bg-green-400/10';
      case 'completed': return 'text-green-600 dark:text-green-400 border-green-600/30 dark:border-green-400/30 bg-green-600/10 dark:bg-green-400/10';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400 border-yellow-600/30 dark:border-yellow-400/30 bg-yellow-600/10 dark:bg-yellow-400/10';
      case 'in progress': return 'text-blue-600 dark:text-blue-400 border-blue-600/30 dark:border-blue-400/30 bg-blue-600/10 dark:bg-blue-400/10';
      case 'submitted': return 'text-purple-600 dark:text-purple-400 border-purple-600/30 dark:border-purple-400/30 bg-purple-600/10 dark:bg-purple-400/10';
      case 'rejected': return 'text-red-600 dark:text-red-400 border-red-600/30 dark:border-red-400/30 bg-red-600/10 dark:bg-red-400/10';
      case 'incomplete': return 'text-orange-600 dark:text-orange-400 border-orange-600/30 dark:border-orange-400/30 bg-orange-600/10 dark:bg-orange-400/10';
      default: return 'text-gray-600 dark:text-gray-400 border-gray-600/30 dark:border-gray-400/30 bg-gray-600/10 dark:bg-gray-400/10';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8 px-2 sm:px-0">
      <header className="flex items-start sm:items-end justify-between">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')} className="hover:bg-accent cursor-pointer shrink-0">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex flex-col gap-1 sm:gap-2 min-w-0">
            <TextHighlighter text="Task Specifications" className="text-xl sm:text-3xl font-bold tracking-tight" />
            <GradientText text={`Reference ID: ${id.slice(-8).toUpperCase()}`} className="text-xs sm:text-sm opacity-70 truncate" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <BlurFade>
            <MagicCard>
              <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <h2 className="text-lg sm:text-2xl font-bold break-words">{task.title}</h2>
                    <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${getStatusColor(task.status)}`}>
                      {task.status?.toUpperCase()}
                    </span>
                  </div>
                
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Requirement</span>
                  <p className="text-foreground leading-relaxed">{task.description}</p>
                </div>

                 {task.location && (
                   <div className="space-y-2">
                     <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Location</span>
                     <p className="text-foreground">{task.location}</p>
                   </div>
                 )}

                 {/* Show Completion Report for submitted/completed tasks */}
                 {(task.status === 'submitted' || task.status === 'completed') && task.completionReport && (
                   <div className="space-y-2">
                     <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Completion Report</span>
                     <div className="p-4 rounded-xl bg-muted/50 border border-border italic text-sm text-foreground">
                       "{task.completionReport}"
                     </div>
                   </div>
                 )}

                  {/* Show Admin Feedback for completed/rejected tasks */}
                  {(task.status === 'completed' || task.status === 'rejected') && task.adminFeedback && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {task.status === 'rejected' ? 'Rejection Feedback' : 'Admin Feedback'}
                      </span>
                      <div className={`p-4 rounded-xl border text-sm ${
                        task.status === 'rejected' 
                          ? 'bg-red-600/10 border-red-600/30 text-foreground' 
                          : 'bg-green-600/10 border-green-600/30 text-foreground'
                      }`}>
                        {task.adminFeedback}
                      </div>
                    </div>
                  )}

                  {/* Show Progress Reports for completed/submitted tasks */}
                  {(task.status === 'completed' || task.status === 'submitted' || task.status === 'rejected') && task.progressReports && task.progressReports.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Progress History</span>
                      {task.progressReports.map((report, index) => (
                        <div key={index} className="p-4 rounded-lg bg-muted/50 border border-border">
                          <p className="text-sm text-foreground">{report.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleString() : 'Just now'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                <div className="pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-xs text-muted-foreground">
                    Assigned To: <span className="text-foreground font-medium">{officers.find(o => o.userId === task.officerId)?.name || task.officerId}</span>
                  </div>
                  {task.assistantName && (
                    <div className="text-xs text-muted-foreground">
                      Assistant: <span className="text-foreground font-medium">{task.assistantName}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Priority: <span className={`font-medium ${
                      task.priority === 'high' ? 'text-red-600 dark:text-red-400' : 
                      task.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                    }`}>{task.priority?.toUpperCase()}</span>
                  </div>
                   {isEditingDeadline ? (
                      <div className="text-xs text-muted-foreground sm:col-span-2">
                        <label className="block mb-1">Deadline:</label>
                        <div className="flex gap-2">
                          <input
                            type="datetime-local"
                            value={editDeadlineValue}
                            onChange={(e) => setEditDeadlineValue(e.target.value)}
                            className="min-w-0 flex-1 rounded-lg border border-input bg-transparent px-2 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          />
                          <Button size="sm" onClick={handleUpdateDeadline} className="cursor-pointer h-7 text-xs px-2 shrink-0">
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditingDeadline(false)} className="cursor-pointer h-7 text-xs px-2 shrink-0">
                            Cancel
                          </Button>
                        </div>
                      </div>
                   ) : (
                     <div className="text-xs text-muted-foreground">
                       Deadline:{' '}
                       <span className="text-foreground font-medium">
                         {task.deadline ? formatDate(task.deadline) : 'Not set'}
                       </span>
{hasPermission(user?.role, 'TASK_EDIT') && (task.status === 'pending' || task.status === 'in progress') && (
                          <button onClick={handleEditDeadline} className="ml-1.5 inline-flex align-middle text-muted-foreground hover:text-foreground transition-colors" title="Edit deadline">
                           <Pencil size={12} />
                         </button>
                       )}
                     </div>
                   )}
                   {task.createdAt && (
                     <div className="text-xs text-muted-foreground">
                       Created: <span className="text-foreground font-medium">
                         {formatDate(task.createdAt)}
                       </span>
                     </div>
                   )}
                   {task.completedAt && (
                     <div className="text-xs text-muted-foreground">
                       Completed: <span className="text-foreground font-medium">
                         {formatDate(task.completedAt)}
                       </span>
                     </div>
                   )}
                </div>
              </div>
            </MagicCard>
          </BlurFade>

          {/* Task Workflow Panel - Mobile */}
          <BlurFade delay={50} className="lg:hidden">
            <MagicCard>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">Task Workflow</h3>

                <div className="relative pt-2 pb-1">
                  <div className="relative flex items-center justify-between">
                    <div className="absolute top-[13px] sm:top-[15px] left-[12px] sm:left-[14px] right-[12px] sm:right-[14px] h-[3px] bg-muted rounded-full -z-10"></div>

                      <div
                        className="absolute top-[13px] sm:top-[15px] left-[12px] sm:left-[14px] h-[3px] rounded-full -z-10 overflow-hidden origin-left transition-all duration-500"
                        style={{
                          width: task.status === 'pending' ? '0px' :
                                 task.status === 'in progress'
                                   ? `calc(50% - ${window.innerWidth < 640 ? '12px' : '14px'})`
                                   : task.status === 'submitted'
                                     ? `calc(100% - ${window.innerWidth < 640 ? '44px' : '56px'})`
                                     : `calc(100% - ${window.innerWidth < 640 ? '24px' : '28px'})`
                        }}
                      >
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 rounded-full" />
                        {task.status !== 'pending' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 via-white/40 via-white/25 to-transparent rounded-full animate-beam" />
                        )}
                      </div>

                      {[
                        {
                          key: 'pending', label: 'Pending',
                          activeList: ['pending', 'in progress', 'submitted', 'approved', 'completed', 'rejected', 'incomplete'],
                          doneList: ['in progress', 'submitted', 'approved', 'completed', 'rejected', 'incomplete']
                        },
                        {
                          key: 'in progress', label: 'In Progress',
                          activeList: ['in progress', 'submitted', 'approved', 'completed', 'rejected', 'incomplete'],
                          doneList: ['submitted', 'approved', 'completed', 'rejected', 'incomplete']
                        },
                        {
                          key: 'submitted', label: 'Submitted',
                          activeList: ['submitted', 'approved', 'completed', 'rejected', 'incomplete'],
                          doneList: ['approved', 'completed']
                        },
                      ].map((step) => {
                      const isDone = step.doneList.includes(task.status);
                      const isCurrent = task.status === step.key;
                      const isActive = step.activeList.includes(task.status);
                      return (
                        <div key={step.key} className="flex flex-col items-center gap-2 sm:gap-2.5 z-10">
                          <div className="relative flex items-center justify-center w-[24px] h-[24px] sm:w-[28px] sm:h-[28px]">
                            <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                              isDone || isCurrent ? 'bg-sky-600' : 'bg-border'
                            }`} />
                            {isCurrent && (
                              <div className={`absolute inset-[-5px] rounded-full ${task.status === 'in progress' ? 'border-[2.5px] border-sky-600/30 border-t-sky-600 animate-premium-spin' : 'border-2 border-sky-600/20'}`} />
                            )}
                            <div className="relative flex items-center justify-center text-white">
                              {isDone ? (
                                <CheckCircle2 size={14} className="sm:size-[16px]" strokeWidth={2} />
                              ) : isCurrent ? (
                                <Circle size={11} className="sm:size-[13px]" fill="white" stroke="none" />
                              ) : (
                                <Circle size={11} className="sm:size-[13px]" strokeWidth={1.5} />
                              )}
                            </div>
                          </div>
                          <span className={`text-[11px] sm:text-xs tracking-wide whitespace-nowrap transition-colors duration-200 ${
                            isCurrent ? 'text-sky-600 font-semibold' : isActive ? 'text-foreground/70 font-medium' : 'text-muted-foreground'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className={`mt-4 text-[11px] sm:text-xs text-center font-medium px-3 py-1.5 rounded-full w-fit mx-auto ${
                    task.status === 'pending' ? 'text-sky-600 bg-sky-600/10' :
                    task.status === 'in progress' ? 'text-sky-600 bg-sky-600/10' :
                    task.status === 'submitted' ? 'text-sky-600 bg-sky-600/10' :
                    task.status === 'approved' || task.status === 'completed' ? 'text-green-600 bg-green-600/10' :
                    task.status === 'rejected' || task.status === 'incomplete' ? 'text-red-600 bg-red-600/10' :
                    'text-muted-foreground bg-muted'
                  }`}>
                    {task.status === 'pending' && 'Awaiting assignment'}
                    {task.status === 'in progress' && 'Work in progress'}
                    {task.status === 'submitted' && 'Pending admin review'}
                    {task.status === 'approved' && 'Task completed successfully'}
                    {task.status === 'completed' && 'Task finished'}
                    {task.status === 'rejected' && 'Changes requested'}
                    {task.status === 'incomplete' && 'Work could not be completed'}
                  </div>
                </div>

                {/* Time Tracking Section */}
                {(task.workStartedAt || task.totalDurationSeconds) && (
                  <div className="pt-4 border-t border-border space-y-3">
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Time Tracking</h4>
                    {task.workStartedAt && (
                      <div className="text-xs text-muted-foreground">
                        Task Started: <span className="text-foreground font-medium">{formatDate(task.workStartedAt)}</span>
                      </div>
                    )}
                    {task.isTimerRunning && (
                      <div className="text-xs text-muted-foreground">
                        Elapsed Time: <span className="text-foreground font-mono font-medium text-blue-600 dark:text-blue-400">
                          {formatDuration(elapsedTime)}
                        </span>
                      </div>
                    )}
                    {task.totalDurationSeconds !== null && !task.isTimerRunning && (
                      <div className="text-xs text-muted-foreground">
                        Final Duration: <span className="text-foreground font-mono font-medium">
                          {formatDuration(task.totalDurationSeconds)}
                        </span>
                      </div>
                    )}
                    {task.acceptedAt && (
                      <div className="text-xs text-muted-foreground">
                        Accepted: <span className="text-foreground font-medium">{formatDate(task.acceptedAt)}</span>
                      </div>
                    )}
                    {task.submittedAt && (
                      <div className="text-xs text-muted-foreground">
                        Submitted: <span className="text-foreground font-medium">{formatDate(task.submittedAt)}</span>
                      </div>
                    )}
                    {task.completedAt && (
                      <div className="text-xs text-muted-foreground">
                        Completed: <span className="text-foreground font-medium">{formatDate(task.completedAt)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Accept Task - inside workflow */}
                {hasPermission(user?.role, 'TASK_ACCEPT') && user && (task.officerId === user.uid || task.officerId === user.id) && task.status === 'pending' && (
                  <div className="pt-4 border-t border-border space-y-3">
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Accept Task</h4>
                    <p className="text-sm text-muted-foreground">Accept this task to start working on it</p>
                    <Button onClick={handleAcceptTask} className="cursor-pointer">Accept Task</Button>
                  </div>
                )}
              </div>
            </MagicCard>
          </BlurFade>

           {/* In Progress Actions - Complete & Incomplete buttons */}
           {hasPermission(user?.role, 'TASK_SUBMIT') && user && (task.officerId === user.uid || task.officerId === user.id) && task.status === 'in progress' && (
             <BlurFade delay={100}>
               <MagicCard>
                 <div className="space-y-4">
                   <h3 className="text-lg font-bold text-foreground">Task Actions</h3>
                   <p className="text-sm text-muted-foreground">
                     Add your completion report below and submit for admin review. You can also mark as incomplete if work cannot be finished.
                   </p>
                   
                   <div className="mt-4">
                     <Textarea 
                       value={report}
                       onChange={(e) => setReport(e.target.value)}
                       placeholder="Describe what you've done, progress made, and any important notes... (required for submission)"
                       className="w-full h-32"
                     />
                   </div>
                   
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={handleCompleteTask}
                        className="w-full sm:flex-1 cursor-pointer"
                      >
                        Submit for Review
                      </Button>
                      <Button
                        onClick={handleIncompleteTask}
                        variant="destructive"
                        className="w-full sm:flex-1 cursor-pointer"
                      >
                        Mark Incomplete
                      </Button>
                    </div>
                   
                   {/* Show existing progress reports */}
                   {task.progressReports && task.progressReports.length > 0 && (
                     <div className="space-y-3 mt-4">
                       <h4 className="text-sm font-bold text-muted-foreground uppercase">Progress History</h4>
                      {task.progressReports.map((report, index) => (
                        <div key={index} className="p-3 rounded-lg bg-muted/50 border border-border">
                          <p className="text-sm text-foreground">{report.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(report.timestamp)}
                          </p>
                        </div>
                      ))}
                     </div>
                   )}
                 </div>
               </MagicCard>
             </BlurFade>
           )}

           {/* Show Progress History for in progress tasks */}
           {hasPermission(user?.role, 'TASK_ADD_PROGRESS') && user && (task.officerId === user.uid || task.officerId === user.id) && task.status === 'in progress' && task.progressReports && task.progressReports.length > 0 && (
             <BlurFade delay={150}>
               <MagicCard>
                 <div className="space-y-4">
                   <h3 className="text-lg font-bold text-foreground">Progress History</h3>
                   {task.progressReports.map((report, index) => (
                     <div key={index} className="p-3 rounded-lg bg-muted/50 border border-border">
                       <p className="text-sm text-foreground">{report.message}</p>
                       <p className="text-xs text-muted-foreground mt-2">
                         {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleString() : 'Just now'}
                       </p>
                     </div>
                   ))}
                 </div>
               </MagicCard>
             </BlurFade>
            )}

            {/* Task Discussion Section */}
            <BlurFade delay={200}>
              <TaskDiscussion taskId={id} task={task} />
            </BlurFade>

            {/* Subtask Workflow Section */}
            <BlurFade delay={250}>
              <SubtaskWorkflow taskId={id} task={task} />
            </BlurFade>

            {/* Attachment & Version Control Section */}
            <BlurFade delay={300}>
              <AttachmentPanel taskId={id} task={task} />
            </BlurFade>

            {/* Activity Timeline Section */}
            <BlurFade delay={350}>
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-muted-foreground" />
                  Activity Timeline
                </h3>
                <ActivityTimeline taskId={id} />
              </div>
            </BlurFade>
         </div>

          <div className="space-y-6">
           {/* Task Workflow Panel - Desktop */}
           <BlurFade delay={0} className="hidden lg:block">
             <MagicCard>
               <div className="space-y-4">
                 <h3 className="text-lg font-bold text-foreground">Task Workflow</h3>

                 <div className="relative pt-2 pb-1">
                   <div className="relative flex items-center justify-between">
                     <div className="absolute top-[13px] sm:top-[15px] left-[12px] sm:left-[14px] right-[12px] sm:right-[14px] h-[3px] bg-muted rounded-full -z-10"></div>

                       <div
                         className="absolute top-[13px] sm:top-[15px] left-[12px] sm:left-[14px] h-[3px] rounded-full -z-10 overflow-hidden origin-left transition-all duration-500"
                         style={{
                           width: task.status === 'pending' ? '0px' :
                                  task.status === 'in progress'
                                    ? 'calc(50% - var(--progress-offset-1))'
                                    : task.status === 'submitted'
                                      ? 'calc(100% - var(--progress-offset-3))'
                                      : 'calc(100% - var(--progress-offset-2))'
                         }}
                       >
                       <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 rounded-full" />
                       {task.status !== 'pending' && (
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 via-white/40 via-white/25 to-transparent rounded-full animate-beam" />
                       )}
                     </div>

                     {[
                       {
                         key: 'pending', label: 'Pending',
                         activeList: ['pending', 'in progress', 'submitted', 'approved', 'completed', 'rejected', 'incomplete'],
                         doneList: ['in progress', 'submitted', 'approved', 'completed', 'rejected', 'incomplete']
                       },
                       {
                         key: 'in progress', label: 'In Progress',
                         activeList: ['in progress', 'submitted', 'approved', 'completed', 'rejected', 'incomplete'],
                         doneList: ['submitted', 'approved', 'completed', 'rejected', 'incomplete']
                       },
                       {
                         key: 'submitted', label: 'Submitted',
                         activeList: ['submitted', 'approved', 'completed', 'rejected', 'incomplete'],
                         doneList: ['approved', 'completed']
                       },
                     ].map((step) => {
                       const isDone = step.doneList.includes(task.status);
                       const isCurrent = task.status === step.key;
                       const isActive = step.activeList.includes(task.status);
                       return (
                         <div key={step.key} className="flex flex-col items-center gap-2 sm:gap-2.5 z-10">
                           <div className="relative flex items-center justify-center w-[24px] h-[24px] sm:w-[28px] sm:h-[28px]">
                             <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                               isDone || isCurrent ? 'bg-sky-600' : 'bg-border'
                             }`} />
                             {isCurrent && (
                               <div className={`absolute inset-[-5px] rounded-full ${task.status === 'in progress' ? 'border-[2.5px] border-sky-600/30 border-t-sky-600 animate-premium-spin' : 'border-2 border-sky-600/20'}`} />
                             )}
                             <div className="relative flex items-center justify-center text-white">
                               {isDone ? (
                                 <CheckCircle2 size={14} className="sm:size-[16px]" strokeWidth={2} />
                               ) : isCurrent ? (
                                 <Circle size={11} className="sm:size-[13px]" fill="white" stroke="none" />
                               ) : (
                                 <Circle size={11} className="sm:size-[13px]" strokeWidth={1.5} />
                               )}
                             </div>
                           </div>
                           <span className={`text-[11px] sm:text-xs tracking-wide whitespace-nowrap transition-colors duration-200 ${
                             isCurrent ? 'text-sky-600 font-semibold' : isActive ? 'text-foreground/70 font-medium' : 'text-muted-foreground'
                           }`}>
                             {step.label}
                           </span>
                         </div>
                       );
                     })}
                   </div>

                   <div className={`mt-4 text-[11px] sm:text-xs text-center font-medium px-3 py-1.5 rounded-full w-fit mx-auto ${
                     task.status === 'pending' ? 'text-sky-600 bg-sky-600/10' :
                     task.status === 'in progress' ? 'text-sky-600 bg-sky-600/10' :
                     task.status === 'submitted' ? 'text-sky-600 bg-sky-600/10' :
                     task.status === 'approved' || task.status === 'completed' ? 'text-green-600 bg-green-600/10' :
                     task.status === 'rejected' || task.status === 'incomplete' ? 'text-red-600 bg-red-600/10' :
                     'text-muted-foreground bg-muted'
                   }`}>
                     {task.status === 'pending' && 'Awaiting assignment'}
                     {task.status === 'in progress' && 'Work in progress'}
                     {task.status === 'submitted' && 'Pending admin review'}
                     {task.status === 'approved' && 'Task completed successfully'}
                     {task.status === 'completed' && 'Task finished'}
                     {task.status === 'rejected' && 'Changes requested'}
                     {task.status === 'incomplete' && 'Work could not be completed'}
                   </div>
                 </div>

                 {/* Time Tracking Section */}
                 {(task.workStartedAt || task.totalDurationSeconds) && (
                   <div className="pt-4 border-t border-border space-y-3">
                     <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Time Tracking</h4>
                     {task.workStartedAt && (
                       <div className="text-xs text-muted-foreground">
                         Task Started: <span className="text-foreground font-medium">{formatDate(task.workStartedAt)}</span>
                       </div>
                     )}
                     {task.isTimerRunning && (
                       <div className="text-xs text-muted-foreground">
                         Elapsed Time: <span className="text-foreground font-mono font-medium text-blue-600 dark:text-blue-400">
                           {formatDuration(elapsedTime)}
                         </span>
                       </div>
                     )}
                     {task.totalDurationSeconds !== null && !task.isTimerRunning && (
                       <div className="text-xs text-muted-foreground">
                         Final Duration: <span className="text-foreground font-mono font-medium">
                           {formatDuration(task.totalDurationSeconds)}
                         </span>
                       </div>
                     )}
                     {task.acceptedAt && (
                       <div className="text-xs text-muted-foreground">
                         Accepted: <span className="text-foreground font-medium">{formatDate(task.acceptedAt)}</span>
                       </div>
                     )}
                     {task.submittedAt && (
                       <div className="text-xs text-muted-foreground">
                         Submitted: <span className="text-foreground font-medium">{formatDate(task.submittedAt)}</span>
                       </div>
                     )}
                     {task.completedAt && (
                       <div className="text-xs text-muted-foreground">
                         Completed: <span className="text-foreground font-medium">{formatDate(task.completedAt)}</span>
                       </div>
                     )}
                   </div>
                  )}

                  {/* Accept Task - inside workflow */}
                {hasPermission(user?.role, 'TASK_ACCEPT') && user && (task.officerId === user.uid || task.officerId === user.id) && task.status === 'pending' && (
                    <div className="pt-4 border-t border-border space-y-3">
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Accept Task</h4>
                      <p className="text-sm text-muted-foreground">Accept this task to start working on it</p>
                      <Button onClick={handleAcceptTask} className="cursor-pointer">Accept Task</Button>
                    </div>
                  )}
                </div>
              </MagicCard>
            </BlurFade>

            {/* Admin Review Section */}
           {hasPermission(user?.role, 'TASK_APPROVE') && task.status === 'submitted' && (
            <BlurFade delay={200}>
              <MagicCard>
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-foreground">Administrative Review</h3>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border italic text-sm text-muted-foreground">
                    "{task.completionReport || 'No report submitted'}"
                  </div>
                  <Textarea 
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback (required for rejection)..."
                    className="w-full h-24"
                  />
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      onClick={handleApprove}
                      variant="secondary"
                      className="w-full sm:flex-1 cursor-pointer text-green-600 dark:text-green-400 border-green-600/30 dark:border-green-400/30 hover:bg-green-600/10 dark:hover:bg-green-400/10"
                    >
                      Accept & Approve
                    </Button>
                    <Button
                      onClick={handleReject}
                      variant="secondary"
                      className="w-full sm:flex-1 cursor-pointer text-red-600 dark:text-red-400 border-red-600/30 dark:border-red-400/30 hover:bg-red-600/10 dark:hover:bg-red-400/10"
                    >
                      Reject with Feedback
                    </Button>
                  </div>
                </div>
              </MagicCard>
            </BlurFade>
          )}

          {/* Admin Feedback for Rejected Tasks */}
          {task.status === 'rejected' && task.adminFeedback && (
            <BlurFade delay={200}>
              <MagicCard>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase">Admin Feedback</h3>
                  <div className="p-4 rounded-xl bg-red-600/10 border border-red-600/30">
                    <p className="text-sm text-foreground">{task.adminFeedback}</p>
                  </div>
                </div>
              </MagicCard>
            </BlurFade>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
