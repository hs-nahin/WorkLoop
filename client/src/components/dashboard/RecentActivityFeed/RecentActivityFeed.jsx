import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContextInstance';
import { db } from '@/firebase/firebaseConfig';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { Loader2, CheckCircle2, PlusCircle, FileUp, Trash2, UserCheck, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ACTION_CONFIG = {
  task_created: { label: 'Task Created', icon: PlusCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  task_accepted: { label: 'Task Accepted', icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  task_submitted: { label: 'Task Submitted', icon: Loader2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  task_approved: { label: 'Task Approved', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
  task_rejected: { label: 'Task Rejected', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  attachment_uploaded: { label: 'File Uploaded', icon: FileUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  attachment_deleted: { label: 'File Deleted', icon: Trash2, color: 'text-red-500', bg: 'bg-red-500/10' },
  user_created: { label: 'User Created', icon: PlusCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  user_updated: { label: 'User Updated', icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  user_deleted: { label: 'User Deleted', icon: Trash2, color: 'text-red-500', bg: 'bg-red-500/10' },
  user_toggled: { label: 'User Toggled', icon: Loader2, color: 'text-orange-500', bg: 'bg-orange-500/10' },
};

const RecentActivityFeed = () => {
  const { user } = useContext(AuthContext);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'auditLogs'),
      orderBy('timestamp', 'desc'),
      // Limit to last 50 activities for performance
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs
        .slice(0, 50)
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp),
        }))
        .filter(log => {
          // For officers/assistants, only show their own activities
          if (user.role !== 'ADMIN') {
            return log.performedByUid === user.uid;
          }
          return true;
        });

      setActivities(logs);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching activities:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, user?.role]);

  if (loading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <CardDescription>Live operational activity feed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading activities...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <CardDescription>Live operational activity feed</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No recent activity</div>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {activities.map((log) => {
              const config = ACTION_CONFIG[log.action] || { 
                label: log.action, 
                icon: CheckCircle2, 
                color: 'text-muted-foreground', 
                bg: 'bg-muted/10' 
              };
              const Icon = config.icon;
              const timeAgo = log.timestamp 
                ? formatDistanceToNow(log.timestamp, { addSuffix: true })
                : 'Unknown time';

              return (
                <div 
                  key={log.id} 
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className={`p-2 rounded-lg shrink-0 ${config.bg}`}>
                    <Icon size={14} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{log.performedByName || 'System'}</span>
                      <span className="text-muted-foreground"> {config.label.toLowerCase()}</span>
                      {log.targetTitle && (
                        <span className="text-muted-foreground">: {log.targetTitle}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityFeed;
