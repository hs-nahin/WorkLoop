import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { apiRequest } from '../../../api/apiClient';
import BlurFade from '../../../components/animations/BlurFade';
import GradientText from '../../../components/animations/GradientText';
import MagicCard from '../../../components/animations/MagicCard';
import TextHighlighter from '../../../components/animations/TextHighlighter';
import { AuthContext } from '../../../context/AuthContext';

const TaskDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [report, setReport] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [officers, setOfficers] = useState([]);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await apiRequest({ endpoint: `/tasks/${id}` });
        setTask(data);
      } catch (error) {
        console.error('Task not found:', error.message);
        toast.error('Task not found');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const data = await apiRequest({ endpoint: '/users' });
        const officerList = data.filter(u => u.role === 'IT OFFICER');
        setOfficers(officerList);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchTask();
    fetchUsers();
  }, [id, navigate]);

  const handleSubmitReport = async () => {
    if (!report.trim()) return toast.error('Please provide a completion report');
    
    try {
      await apiRequest({ 
        endpoint: `/tasks/${id}/submit`, 
        method: 'PATCH', 
        body: { report }, 
      });
      toast.success('Task submitted for review!');
      // Refresh task data
      const data = await apiRequest({ endpoint: `/tasks/${id}` });
      setTask(data);
      setReport('');
    } catch (error) {
      toast.error(error.message || 'Submission failed');
    }
  };

  const handleDecision = async (decision) => {
    if (!feedback.trim()) return toast.error('Please provide feedback');
    
    try {
      await apiRequest({ 
        endpoint: `/tasks/${id}/decide`, 
        method: 'PATCH', 
        body: { decision, feedback }, 
      });
      toast.success(`Task ${decision} successfully`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Decision failed');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-foreground font-mono animate-pulse">Loading Task...</div>;
  if (!task) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 dark:text-green-400 border-green-600/30 dark:border-green-400/30 bg-green-600/10 dark:bg-green-400/10';
      case 'completed': return 'text-green-600 dark:text-green-400 border-green-600/30 dark:border-green-400/30 bg-green-600/10 dark:bg-green-400/10';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400 border-yellow-600/30 dark:border-yellow-400/30 bg-yellow-600/10 dark:bg-yellow-400/10';
      case 'submitted': return 'text-blue-600 dark:text-blue-400 border-blue-600/30 dark:border-blue-400/30 bg-blue-600/10 dark:bg-blue-400/10';
      case 'rejected': return 'text-red-600 dark:text-red-400 border-red-600/30 dark:border-red-400/30 bg-red-600/10 dark:bg-red-400/10';
      default: return 'text-gray-600 dark:text-gray-400 border-gray-600/30 dark:border-gray-400/30 bg-gray-600/10 dark:bg-gray-400/10';
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <TextHighlighter text="Task Specifications" className="text-3xl font-bold tracking-tight" />
          <GradientText text={`Reference ID: ${id.slice(-8).toUpperCase()}`} className="text-sm opacity-70" />
        </div>
        <Button 
          variant="secondary" 
          onClick={() => navigate('/tasks')}
          className="text-xs"
        >
          ← Back to Repository
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <BlurFade>
            <MagicCard>
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold">{task.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(task.status)}`}>
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

                <div className="pt-6 border-t border-border grid grid-cols-2 gap-4">
                  <div className="text-xs text-muted-foreground">
                    Assigned To: <span className="text-foreground font-medium">{officers.find(o => o.userId === task.officerId)?.name || task.officerId}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Priority: <span className={`font-medium ${
                      task.priority === 'high' ? 'text-red-600 dark:text-red-400' : 
                      task.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                    }`}>{task.priority?.toUpperCase()}</span>
                  </div>
                  {task.deadline && (
                    <div className="text-xs text-muted-foreground">
                      Deadline: <span className="text-foreground font-medium">{new Date(task.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  {task.createdAt && (
                    <div className="text-xs text-muted-foreground">
                      Created: <span className="text-foreground font-medium">
                        {task.createdAt?.toDate ? task.createdAt.toDate().toLocaleDateString() : new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </MagicCard>
          </BlurFade>

          {user?.role === 'IT OFFICER' && task.officerId === user.userId && task.status === 'pending' && (
            <BlurFade delay={100}>
              <MagicCard>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground">Submit Work Report</h3>
                  <Textarea 
                    value={report}
                    onChange={(e) => setReport(e.target.value)}
                    placeholder="Describe the work performed and results..."
                    className="w-full h-32"
                  />
                  <Button 
                    onClick={handleSubmitReport}
                    className="px-6 py-2"
                  >
                    Submit for Review
                  </Button>
                </div>
              </MagicCard>
            </BlurFade>
          )}
        </div>

        <div className="space-y-6">
          {user?.role === 'ADMIN' && task.status === 'submitted' && (
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
                    placeholder="Provide feedback for approval/rejection..."
                    className="w-full h-24"
                  />
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleDecision('approved')}
                      variant="secondary"
                      className="flex-1 text-green-600 dark:text-green-400 border-green-600/30 dark:border-green-400/30 hover:bg-green-600/10 dark:hover:bg-green-400/10"
                    >
                      Approve
                    </Button>
                    <Button 
                      onClick={() => handleDecision('rejected')}
                      variant="secondary"
                      className="flex-1 text-red-600 dark:text-red-400 border-red-600/30 dark:border-red-400/30 hover:bg-red-600/10 dark:hover:bg-red-400/10"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </MagicCard>
            </BlurFade>
          )}
           
          <BlurFade delay={300}>
            <MagicCard>
              <h3 className="text-sm font-bold text-muted-foreground uppercase mb-4">Timeline</h3>
              <div className="space-y-4 text-xs">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-600 dark:bg-yellow-400 mt-1" />
                  <div>
                    <p className="text-foreground font-medium">Task Created</p>
                    <p className="text-muted-foreground">
                      {task.createdAt?.toDate ? task.createdAt.toDate().toLocaleString() : new Date(task.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {task.status === 'submitted' && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-1" />
                    <div>
                      <p className="text-foreground font-medium">Report Submitted</p>
                      <p className="text-muted-foreground">Awaiting review</p>
                    </div>
                  </div>
                )}
              </div>
            </MagicCard>
          </BlurFade>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
