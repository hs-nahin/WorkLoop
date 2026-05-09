import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import {
  CheckCircle2,
  Clock,
  FileUp,
  FileX,
  Loader2,
  PlusCircle,
  Trash2,
  UserCheck,
  UserX,
  MessageSquare,
  XCircle,
  History,
} from 'lucide-react';

const actionConfig = {
  task_created: { icon: PlusCircle, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Task Created' },
  task_accepted: { icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Task Accepted' },
  task_submitted: { icon: Loader2, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Task Submitted' },
  task_approved: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Task Approved' },
  task_rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Task Rejected' },
  task_incomplete: { icon: History, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Marked Incomplete' },
  attachment_uploaded: { icon: FileUp, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'File Uploaded' },
  attachment_deleted: { icon: FileX, color: 'text-red-500', bg: 'bg-red-500/10', label: 'File Deleted' },
  subtask_created: { icon: PlusCircle, color: 'text-cyan-500', bg: 'bg-cyan-500/10', label: 'Subtask Created' },
  subtask_updated: { icon: Loader2, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Subtask Updated' },
  subtask_deleted: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Subtask Deleted' },
  comment_added: { icon: MessageSquare, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Comment Added' },
  default: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Activity' },
};

const classifyAction = (event) => {
  const text = (event.details || event.text || '').toLowerCase();

  if (text.includes('task accepted')) return 'task_accepted';
  if (text.includes('task submitted')) return 'task_submitted';
  if (text.includes('task approved')) return 'task_approved';
  if (text.includes('task rejected')) return 'task_rejected';
  if (text.includes('marked as incomplete') || text.includes('task marked as incomplete')) return 'task_incomplete';
  if (text.includes('subtask') && text.includes('created')) return 'subtask_created';
  if (text.includes('subtask') && (text.includes('status changed') || text.includes('updated'))) return 'subtask_updated';
  if (text.includes('subtask') && text.includes('deleted')) return 'subtask_deleted';
  if (text.includes('uploaded')) return 'attachment_uploaded';
  if (text.includes('deleted')) return 'attachment_deleted';
  if (event.action === 'attachment_uploaded') return 'attachment_uploaded';
  if (event.action === 'attachment_deleted') return 'attachment_deleted';

  return 'default';
};

const extractActor = (event) => {
  const text = event.details || event.text || '';
  const match = text.match(/(?:by|created and assigned to)\s+(.+?)(?:\s*-|$)/i);
  if (match) return match[1].trim();
  return event.performedByName || event.senderName || 'System';
};

const extractActorRole = (event) => {
  return event.userRole || event.senderRole || '';
};

const getActorInitial = (name) => {
  if (!name) return 'S';
  return name.charAt(0).toUpperCase();
};

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

const formatEventTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' \u2014 ' + date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ActivityTimeline = ({ taskId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) return;

    let unsubscribeAudit = () => {};
    let unsubscribeMessages = () => {};
    let cancelled = false;

    const loadEvents = () => {
      const auditQuery = query(
        collection(db, 'auditLogs'),
        orderBy('timestamp', 'desc')
      );

      const messagesQuery = query(
        collection(db, 'tasks', taskId, 'messages'),
        orderBy('createdAt', 'desc')
      );

      unsubscribeAudit = onSnapshot(auditQuery, (snapshot) => {
        if (cancelled) return;
        const auditEvents = snapshot.docs
          .map(doc => ({
            id: `audit-${doc.id}`,
            source: 'auditLog',
            action: doc.data().action,
            details: doc.data().details,
            actorName: doc.data().performedByName,
            actorUid: doc.data().performedByUid,
            timestamp: doc.data().timestamp,
            text: doc.data().details,
            senderName: doc.data().performedByName,
            senderRole: '',
            targetId: doc.data().targetId,
          }))
          .filter(e => e.targetId === taskId);

        setEvents(prev => {
          const messageEvents = prev.filter(e => e.source === 'message');
          const merged = [...messageEvents, ...auditEvents].sort((a, b) => {
            const ta = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp || 0).getTime();
            const tb = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp || 0).getTime();
            return tb - ta;
          });
          return merged;
        });
        setLoading(false);
      }, () => {
        if (!cancelled) setLoading(false);
      });

      unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        if (cancelled) return;
        const messageEvents = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: `msg-${doc.id}`,
              source: 'message',
              action: 'system_message',
              details: data.text,
              actorName: data.senderName,
              actorUid: data.senderId,
              timestamp: data.createdAt,
              text: data.text,
              senderName: data.senderName,
              senderRole: data.senderRole || '',
              type: data.type,
            };
          })
          .filter(e => e.type === 'system');

        setEvents(prev => {
          const auditEvents = prev.filter(e => e.source === 'auditLog');
          const merged = [...auditEvents, ...messageEvents].sort((a, b) => {
            const ta = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp || 0).getTime();
            const tb = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp || 0).getTime();
            return tb - ta;
          });
          return merged;
        });
        setLoading(false);
      }, () => {
        if (!cancelled) setLoading(false);
      });
    };

    loadEvents();

    return () => {
      cancelled = true;
      unsubscribeAudit();
      unsubscribeMessages();
    };
  }, [taskId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
            <div className="h-2 w-1/4 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No activity recorded for this task yet.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border" />
      <div className="space-y-0">
        {events.map((event, index) => {
          const type = classifyAction(event);
          const config = actionConfig[type] || actionConfig.default;
          const Icon = config.icon;
          const actorName = extractActor(event);
          const actorRole = extractActorRole(event);
          const timeStr = formatEventTime(event.timestamp);
          const isLast = index === events.length - 1;

          return (
            <div key={event.id} className="relative flex gap-4 pb-6 group">
              <div className="relative z-10 flex-shrink-0 mt-0.5">
                <div className={`w-10 h-10 rounded-full ${config.bg} border border-border flex items-center justify-center transition-transform group-hover:scale-110 group-hover:shadow-md`}>
                  <Icon size={16} className={config.color} />
                </div>
                {isLast && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-px h-6 bg-gradient-to-b from-border to-transparent" />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{actorName}</span>
                  {actorRole && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getRoleColor(actorRole)}`}>
                      {actorRole}
                    </span>
                  )}
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {config.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.details || event.text}</p>
                {timeStr && (
                  <p className="text-[11px] text-muted-foreground/60 mt-1 font-mono">{timeStr}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimeline;
