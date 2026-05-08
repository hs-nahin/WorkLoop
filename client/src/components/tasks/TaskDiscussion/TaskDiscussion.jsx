import { useContext } from 'react';
import MessageThread from './MessageThread';
import MessageInput from './MessageInput';
import { AuthContext } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const TaskDiscussion = ({ taskId, task }) => {
  const { user } = useContext(AuthContext);

  // Check if user is authorized to view discussion
  const isAuthorized = () => {
    if (!task || !user) return false;
    return (
      task.officerId === user.uid ||
      task.assistantId === user.uid ||
      user.role === 'ADMIN'
    );
  };

  if (!isAuthorized()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare size={18} />
            Task Discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">You are not authorized to view this discussion.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare size={18} />
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
