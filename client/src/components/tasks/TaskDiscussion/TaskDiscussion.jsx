import { useContext } from 'react';
import MessageThread from './MessageThread';
import MessageInput from './MessageInput';
import { AuthContext } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';

const TaskDiscussion = ({ taskId, task }) => {
  const { user } = useContext(AuthContext);

  const isAuthorized = () => {
    if (!task || !user) return false;
    return (
      task.officerId === user.uid ||
      task.assistantId === user.uid ||
      hasPermission(user.role, 'COMMENT_CREATE')
    );
  };

  if (!isAuthorized()) {
    return (
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <MessageSquare size={14} className="sm:size-[18px]" />
            Task Discussion
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <p className="text-muted-foreground text-xs sm:text-sm">You are not authorized to view this discussion.</p>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <MessageSquare size={14} className="sm:size-[18px] shrink-0" />
            Task Discussion
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <MessageThread taskId={taskId} />
          <MessageInput taskId={taskId} />
        </CardContent>
      </Card>
  );
};

export default TaskDiscussion;
