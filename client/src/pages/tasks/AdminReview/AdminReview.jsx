import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/api/apiClient';
import BlurFade from '@/components/animations/BlurFade';
import MagicCard from '@/components/animations/MagicCard';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { AuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';

const AdminReview = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await apiRequest({ endpoint: '/tasks' });
      const submittedTasks = data.filter(task => task.status === 'submitted');
      setTasks(submittedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleApprove = async (taskId) => {
    const feedbackMsg = feedback[taskId];
    try {
      await apiRequest({ 
        endpoint: `/tasks/${taskId}/approve`, 
        method: 'PATCH',
        body: feedbackMsg?.trim() ? { feedback: feedbackMsg } : {}
      });
      toast.success('Task approved successfully!');
      setFeedback(prev => ({ ...prev, [taskId]: '' }));
      fetchTasks();
    } catch (error) {
      toast.error(error.message || 'Approval failed');
    }
  };

  const handleReject = async (taskId) => {
    const feedbackMsg = feedback[taskId];
    if (!feedbackMsg?.trim()) return toast.error('Please provide feedback for rejection');
    
    try {
      await apiRequest({ 
        endpoint: `/tasks/${taskId}/reject`, 
        method: 'PATCH', 
        body: { feedback: feedbackMsg }
      });
      toast.success('Task rejected and sent back to In Progress');
      setFeedback(prev => ({ ...prev, [taskId]: '' }));
      fetchTasks();
    } catch (error) {
      toast.error(error.message || 'Rejection failed');
    }
  };

  if (!hasPermission(user?.role, 'TASK_APPROVE')) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">Admin Review</h1>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600/10 text-purple-600 border-purple-600/30 border">
          {tasks.length} PENDING
        </span>
      </div>

      {tasks.length === 0 ? (
        <BlurFade>
          <MagicCard>
            <div className="text-center py-12">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No tasks pending review</p>
            </div>
          </MagicCard>
        </BlurFade>
      ) : (
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <BlurFade key={task.id} delay={index * 100}>
              <MagicCard>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{task.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Submitted by: {task.officerName || task.officerId}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600/10 text-purple-600 border-purple-600/30 border">
                      <Clock size={12} className="inline mr-1" />
                      WAITING APPROVAL
                    </span>
                  </div>

                  <p className="text-foreground">{task.description}</p>

                  {task.completionReport && (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border italic text-sm">
                      "{task.completionReport}"
                    </div>
                  )}

                  <Textarea 
                    value={feedback[task.id] || ''}
                    onChange={(e) => setFeedback(prev => ({ ...prev, [task.id]: e.target.value }))}
                    placeholder="Provide feedback (required for rejection)..."
                    className="w-full h-24"
                  />

                   <div className="flex flex-col sm:flex-row gap-3">
                     <Button 
                       onClick={() => handleApprove(task.id)}
                       className="flex-1 cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                     >
                       <CheckCircle2 size={16} className="mr-2" />
                       Approve & Complete
                     </Button>
                     <Button 
                       onClick={() => handleReject(task.id)}
                       variant="outline"
                       className="flex-1 cursor-pointer text-red-600 border-red-600/30 hover:bg-red-600/10"
                     >
                       <XCircle size={16} className="mr-2" />
                       Reject & Send Back
                     </Button>
                   </div>
                </div>
              </MagicCard>
            </BlurFade>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReview;
