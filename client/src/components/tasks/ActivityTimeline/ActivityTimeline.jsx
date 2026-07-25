import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  FileUp,
  FileX,
  Loader2,
  PlusCircle,
  Trash2,
  UserCheck,
  MessageSquare,
  XCircle,
  History,
  GitBranch,
} from 'lucide-react';

const twColorMap = {
   'blue-500': '#3b82f6',
   'cyan-400': '#22d3ee',
   'indigo-400': '#818cf8',
   'purple-500': '#a855f7',
   'pink-400': '#f472b6',
   'green-500': '#22c55e',
   'emerald-400': '#34d399',
   'red-500': '#ef4444',
   'rose-400': '#fb7185',
   'orange-500': '#f97316',
   'amber-400': '#fbbf24',
   'violet-500': '#8b5cf6',
   'teal-400': '#2dd4bf',
   'yellow-500': '#eab308',
   'orange-400': '#fb923c',
   'gray-400': '#9ca3af',
   'slate-400': '#94a3b8',
   'muted-foreground': '#6b7280',
   'muted': '#a1a1aa',
};

const getGradientColors = (gradientStr) => {
   const parts = gradientStr.split(' ');
   const from = parts[0].replace('from-', '');
   const to = parts[1].replace('to-', '');
   return {
     from: twColorMap[from] || '#6b7280',
     to: twColorMap[to] || '#9ca3af',
   };
};

const actionConfig = {
  task_created: { icon: PlusCircle, gradient: 'from-blue-500 to-cyan-400', iconColor: 'text-blue-500', label: 'Task Created', anim: 'animate-pulse-soft' },
  task_accepted: { icon: UserCheck, gradient: 'from-blue-500 to-indigo-400', iconColor: 'text-blue-500', label: 'Task Accepted', anim: 'animate-bounce-check' },
  task_submitted: { icon: Loader2, gradient: 'from-purple-500 to-pink-400', iconColor: 'text-purple-500', label: 'Task Submitted', anim: 'animate-premium-spin', spinner: true },
  task_approved: { icon: CheckCircle2, gradient: 'from-green-500 to-emerald-400', iconColor: 'text-green-500', label: 'Task Approved', anim: 'animate-pulse-soft' },
  task_rejected: { icon: XCircle, gradient: 'from-red-500 to-rose-400', iconColor: 'text-red-500', label: 'Task Rejected', anim: 'animate-shake' },
  task_incomplete: { icon: History, gradient: 'from-orange-500 to-amber-400', iconColor: 'text-orange-500', label: 'Marked Incomplete', anim: 'animate-float' },
  attachment_uploaded: { icon: FileUp, gradient: 'from-violet-500 to-purple-400', iconColor: 'text-violet-500', label: 'File Uploaded', anim: 'animate-float' },
  attachment_deleted: { icon: FileX, gradient: 'from-red-500 to-orange-400', iconColor: 'text-red-500', label: 'File Deleted', anim: 'animate-shake' },
  subtask_created: { icon: GitBranch, gradient: 'from-cyan-500 to-teal-400', iconColor: 'text-cyan-500', label: 'Subtask Created', anim: 'animate-pulse-soft' },
  subtask_updated: { icon: Loader2, gradient: 'from-yellow-500 to-amber-400', iconColor: 'text-yellow-500', label: 'Subtask Updated', anim: 'animate-premium-spin', spinner: true },
  subtask_deleted: { icon: Trash2, gradient: 'from-red-500 to-rose-400', iconColor: 'text-red-500', label: 'Subtask Deleted', anim: 'animate-shake' },
  comment_added: { icon: MessageSquare, gradient: 'from-gray-400 to-slate-400', iconColor: 'text-gray-400', label: 'Comment Added', anim: 'animate-pulse-soft' },
  default: { icon: Clock, gradient: 'from-muted-foreground to-muted', iconColor: 'text-muted-foreground', label: 'Activity', anim: 'animate-float' },
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

const getRoleColor = (role) => {
   if (!role) return '';
   switch (role) {
     case 'ADMIN': return 'bg-red-500/20 text-red-500';
     case 'IT_OFFICER':
     case 'IT OFFICER': return 'bg-blue-500/20 text-blue-500';
      case 'ASSISTANT': return 'bg-purple-500/20 text-purple-500';
      case 'USER': return 'bg-blue-500/20 text-blue-500';
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
        where('targetId', '==', taskId),
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
          }));

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
      <div className="space-y-2 sm:space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2.5 sm:gap-4 animate-pulse">
            <div className="h-8 w-8 sm:h-11 sm:w-11 rounded-full bg-muted" />
            <div className="space-y-2 flex-1">
              <div className="h-2 sm:h-3 w-2/5 bg-muted rounded" />
              <div className="h-1.5 sm:h-2.5 w-1/3 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6 sm:py-10 px-2"
      >
        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-muted-foreground/30 to-muted-foreground/10 p-[1px] mx-auto mb-3 sm:mb-4">
          <div className="w-full h-full rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <Clock size={16} className="sm:size-[22px] text-muted-foreground/50" />
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">No activity recorded for this task yet.</p>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <div className={events.length > 1 ? '' : 'space-y-2 sm:space-y-3'}>
        {events.map((event, index) => {
          const type = classifyAction(event);
          const config = actionConfig[type] || actionConfig.default;
          const Icon = config.icon;
          const actorName = extractActor(event);
          const actorRole = extractActorRole(event);
          const timeStr = formatEventTime(event.timestamp);
          const isLast = index === events.length - 1;

          const nextConfig = !isLast
            ? (actionConfig[classifyAction(events[index + 1])] || actionConfig.default)
            : null;

          const segFrom = nextConfig ? getGradientColors(config.gradient).to : null;
          const segTo = nextConfig ? getGradientColors(nextConfig.gradient).from : null;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
              className={`relative flex gap-2.5 sm:gap-4 group ${!isLast ? 'pb-2 sm:pb-3' : ''}`}
            >
              {/* Icon container */}
              <div className="relative z-10 flex-shrink-0 mt-0.5">
                <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br ${config.gradient} p-[1px] shadow-sm`}>
                  <div className="w-full h-full rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    {config.spinner ? (
                      <div className={`w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] rounded-full border-2 border-purple-500/20 border-t-purple-500 ${config.anim}`} />
                    ) : (
                      <Icon size={11} className={`sm:size-[15px] ${config.iconColor} ${config.anim}`} />
                    )}
                  </div>
                </div>

                {isLast && (
                  <div className="absolute -bottom-3 sm:-bottom-4 left-1/2 -translate-x-1/2 w-0.5 h-3 sm:h-4 bg-gradient-to-b from-border/50 to-transparent" />
                )}
              </div>

              {/* Per-segment connector line with animated beam */}
              {!isLast && segFrom && segTo && (
                <div className="absolute left-[16px] sm:left-[22px] top-8 sm:top-11 bottom-0 w-0.5 rounded-full z-0 overflow-hidden">
                  <div
                    className="absolute inset-0 rounded-full opacity-40"
                    style={{
                      background: `linear-gradient(to bottom, ${segFrom}, ${segTo})`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/25 via-white/40 via-white/25 to-transparent rounded-full animate-beam-vertical" />
                </div>
              )}

              {/* Content card */}
              <div className="flex-1 min-w-0 pb-1.5 sm:pb-3">
                <div className="rounded-lg sm:rounded-xl border border-border/50 bg-card/30 p-2 sm:p-3.5 transition-all duration-300 group-hover:bg-card/60 group-hover:border-border group-hover:shadow-md group-hover:shadow-black/5">
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap mb-0.5 sm:mb-1">
                    <span className="text-[11px] sm:text-sm font-semibold text-foreground">{actorName}</span>
                    {actorRole && (
                      <span className={`text-[8px] sm:text-[11px] font-bold px-1 sm:px-2 py-0.5 rounded-md ${getRoleColor(actorRole)}`}>
                        {actorRole}
                      </span>
                    )}
                    <span className="text-[8px] sm:text-[11px] font-medium px-1 sm:px-2 py-0.5 rounded-md bg-muted/80 text-muted-foreground/80 border border-border/30">
                      {config.label}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground/80 leading-relaxed line-clamp-2 break-words">
                    {event.details || event.text}
                  </p>
                  {timeStr && (
                    <div className="flex items-center gap-1 mt-1 sm:mt-1.5">
                      <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-muted-foreground/20" />
                      <p className="text-[9px] sm:text-[11px] text-muted-foreground/40 font-mono tracking-tight">{timeStr}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimeline;
