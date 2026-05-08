import { Circle, Loader2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const statusConfig = {
  pending: { icon: Circle, color: 'text-yellow-600', bg: 'bg-yellow-600/10', label: 'Pending' },
  in_progress: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-600/10', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-600/10', label: 'Completed' }
};

const SubtaskList = ({ subtasks, task, user, onEdit, onUpdateStatus }) => {
  const [expandedId, setExpandedId] = useState(null);

  const canUpdateStatus = (subtask) => {
    if (!user) return false;
    return (
      user.uid === subtask.assignedUserId ||
      user.role === 'ADMIN' ||
      user.role === 'IT OFFICER'
    );
  };

  const handleStatusChange = (subtaskId, newStatus) => {
    onUpdateStatus(subtaskId, { status: newStatus });
  };

  if (subtasks.length === 0) {
    return <p className="text-muted-foreground text-sm py-4 text-center">No subtasks yet. Add one to get started!</p>;
  }

  return (
    <div className="space-y-3">
      {subtasks.map((subtask) => {
        const status = statusConfig[subtask.status] || statusConfig.pending;
        const StatusIcon = status.icon;
        const isExpanded = expandedId === subtask.id;

        return (
          <div key={subtask.id} className={`border rounded-lg ${status.bg} border-border`}>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <StatusIcon size={16} className={`${status.color} ${subtask.status === 'in_progress' ? 'animate-spin' : ''}`} />
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{subtask.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    Assigned to: {subtask.assignedUserName || 'Unassigned'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${status.bg} ${status.color} border border-current/30`}>
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {canUpdateStatus(subtask) && subtask.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStatusChange(
                      subtask.id,
                      subtask.status === 'pending' ? 'in_progress' : 'completed'
                    )}
                    className="cursor-pointer"
                  >
                    {subtask.status === 'pending' ? 'Start' : 'Complete'}
                  </Button>
                )}
                {(user?.role === 'ADMIN' || user?.role === 'IT OFFICER') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(subtask)}
                    className="cursor-pointer"
                  >
                    Edit
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpandedId(isExpanded ? null : subtask.id)}
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
              </div>
            </div>
            {isExpanded && (
              <div className="p-3 pt-0 border-t border-border">
                <p className="text-sm text-foreground">{subtask.description || 'No description'}</p>
                {subtask.deadline && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Deadline: {new Date(subtask.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SubtaskList;
