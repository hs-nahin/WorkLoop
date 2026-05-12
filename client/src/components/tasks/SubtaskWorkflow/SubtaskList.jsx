import { Circle, Loader2, CheckCircle2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { hasPermission } from '@/lib/permissions';

const statusConfig = {
  pending: { icon: Circle, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-600/10', label: 'Pending' },
  in_progress: { icon: Loader2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-600/10', label: 'In Progress', animate: true },
  completed: { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-600/10', label: 'Completed' }
};

const SubtaskList = ({ subtasks, task, user, canEdit, onEdit, onUpdateStatus, onDelete }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const canUpdateStatus = (subtask) => {
    if (!user) return false;
    if (hasPermission(user.role, 'SUBTASK_UPDATE_STATUS') && (user.uid === subtask.assignedUserId || user.id === subtask.assignedUserId)) return true;
    if (hasPermission(user.role, 'SUBTASK_EDIT')) return true;
    return false;
  };

  const handleStatusChange = (subtaskId, newStatus) => {
    onUpdateStatus(subtaskId, { status: newStatus });
  };

  const handleDelete = (subtaskId) => {
    if (confirmDelete === subtaskId) {
      onDelete(subtaskId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(subtaskId);
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const getUserAvatarColor = (role) => {
    switch (role) {
      case 'IT_OFFICER':
      case 'IT OFFICER': return 'bg-blue-500/20 text-blue-500';
      case 'ASSISTANT': return 'bg-purple-500/20 text-purple-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (subtasks.length === 0) {
    return <p className="text-muted-foreground text-xs sm:text-sm py-6 sm:py-8 text-center px-2">No subtasks yet.</p>;
  }

    return (
      <div className="space-y-2 sm:space-y-3">
        {subtasks.map((subtask) => {
          const status = statusConfig[subtask.status] || statusConfig.pending;
          const StatusIcon = status.icon;
          const isExpanded = expandedId === subtask.id;
          const isDeleteConfirm = confirmDelete === subtask.id;

          return (
            <div key={subtask.id} className={`group border rounded-xl ${status.bg} border-border/50 transition-all hover:shadow-md hover:border-current/30`}>
              <div className="p-2 sm:p-3">
                <div className="flex items-start sm:items-center justify-between gap-2">
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${status.bg} border border-current/20 transition-transform group-hover:scale-110 shrink-0 mt-0.5 sm:mt-0`}>
                      <StatusIcon size={14} className={`sm:size-[18px] ${status.color} ${status.animate ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground leading-none mb-0.5 sm:mb-1 break-words">{subtask.title}</h4>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                        {subtask.assignedUserName ? (
                          <>
                            <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[8px] sm:text-[10px] font-bold ${getUserAvatarColor(subtask.assignedUserRole)} shrink-0`}>
                              {subtask.assignedUserName.charAt(0)}
                            </div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
                              {subtask.assignedUserName}
                            </p>
                          </>
                        ) : (
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium italic">Unassigned</p>
                        )}
                        <span className={`text-[8px] sm:text-[10px] uppercase tracking-wider font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${status.bg} ${status.color} border border-current/30 shrink-0`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    {canUpdateStatus(subtask) && subtask.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusChange(
                          subtask.id,
                          subtask.status === 'pending' ? 'in_progress' : 'completed'
                        )}
                        className="cursor-pointer text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-3 hover:bg-background/50 transition-colors"
                      >
                        {subtask.status === 'pending' ? 'Start' : 'Complete'}
                      </Button>
                    )}
                    {canEdit && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(subtask)}
                          className="cursor-pointer text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-3 hover:bg-background/50 transition-colors"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(subtask.id)}
                          className={`cursor-pointer text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-3 transition-colors ${isDeleteConfirm ? 'text-red-500 bg-red-100' : 'text-muted-foreground hover:text-red-500 hover:bg-red-50'}`}
                        >
                          {isDeleteConfirm ? 'Confirm?' : <Trash2 size={12} className="sm:size-[14px]" />}
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedId(isExpanded ? null : subtask.id)}
                      className="cursor-pointer h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-background/50"
                    >
                      {isExpanded ? <ChevronUp size={12} className="sm:size-[16px]" /> : <ChevronDown size={12} className="sm:size-[16px]" />}
                    </Button>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t border-border/50">
                  <div className="p-3 rounded-lg bg-background/40 mt-2 text-sm text-foreground leading-relaxed">
                    {subtask.description || 'No description provided.'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );

};

export default SubtaskList;