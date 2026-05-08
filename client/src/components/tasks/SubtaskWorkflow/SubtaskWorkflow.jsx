import { useEffect, useState, useContext } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { AuthContext } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Trash2 } from 'lucide-react';
import SubtaskList from './SubtaskList';
import SubtaskForm from './SubtaskForm';
import { apiRequest } from '@/api/apiClient';
import { toast } from 'sonner';

const SubtaskWorkflow = ({ taskId, task }) => {
  const { user } = useContext(AuthContext);
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [users, setUsers] = useState([]);

  // Fetch users for assignment dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiRequest({ endpoint: '/users' });
        // Get IT_OFFICER and ASSISTANT users for subtask assignment
        const techUsers = data.filter(u => u.role === 'IT_OFFICER' || u.role === 'IT OFFICER' || u.role === 'ASSISTANT');
        setUsers(techUsers || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  // Real-time listener for subtasks
  useEffect(() => {
    if (!taskId) return;

    const q = query(
      collection(db, 'tasks', taskId, 'subtasks'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs = snapshot.docs.map(doc => {
        const data = doc.data();
        let assignedUserName = data.assignedUserName;
        let assignedUserRole = data.assignedUserRole;
        
        // Resolve name from users if not stored
        if (!assignedUserName && data.assignedUserId) {
          const matchedUser = users.find(u => (u.userId || u.id) === data.assignedUserId);
          if (matchedUser) {
            assignedUserName = matchedUser.name;
            assignedUserRole = matchedUser.role;
          }
        }
        
        return {
          id: doc.id,
          ...data,
          assignedUserName,
          assignedUserRole,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
        };
      });
      setSubtasks(subs);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching subtasks:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [taskId, users]);

  // Only ADMIN can manage subtasks
  const canManageSubtasks = () => {
    if (!user) return false;
    return user.role === 'ADMIN';
  };

  const handleCreateSubtask = async (subtaskData) => {
    try {
      // Find user name from selected user ID
      const assignedUser = users.find(u => (u.userId || u.id) === subtaskData.assignedUserId);
      const assignedUserName = assignedUser?.name || 'Unknown';
      const assignedUserRole = assignedUser?.role || '';

      await addDoc(collection(db, 'tasks', taskId, 'subtasks'), {
        ...subtaskData,
        assignedUserName,
        assignedUserRole,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setShowForm(false);
      toast.success('Subtask created');
    } catch (error) {
      console.error('Error creating subtask:', error);
      toast.error('Failed to create subtask');
    }
  };

  const handleUpdateSubtask = async (subtaskId, updates) => {
    try {
      let finalUpdates = { ...updates, updatedAt: new Date() };
      
      // Update user name if changed
      if (updates.assignedUserId) {
        const assignedUser = users.find(u => (u.userId || u.id) === updates.assignedUserId);
        finalUpdates.assignedUserName = assignedUser?.name || 'Unknown';
        finalUpdates.assignedUserRole = assignedUser?.role || '';
      }

      const subtaskRef = doc(db, 'tasks', taskId, 'subtasks', subtaskId);
      await updateDoc(subtaskRef, finalUpdates);
      setEditingSubtask(null);
      toast.success('Subtask updated');
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast.error('Failed to update subtask');
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      const subtaskRef = doc(db, 'tasks', taskId, 'subtasks', subtaskId);
      await deleteDoc(subtaskRef);
      toast.success('Subtask deleted');
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast.error('Failed to delete subtask');
    }
  };

  if (loading) return <div className="text-center py-4 text-muted-foreground">Loading subtasks...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Users size={16} />
            Subtasks
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {subtasks.length} {subtasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </CardTitle>
          {canManageSubtasks() && (
            <Button 
              onClick={() => { setShowForm(true); setEditingSubtask(null); }}
              size="sm"
              className="cursor-pointer"
            >
              <Plus size={16} className="mr-1" />
              Add Subtask
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <SubtaskForm
            taskId={taskId}
            subtask={editingSubtask}
            onSubmit={editingSubtask ? 
              (data) => handleUpdateSubtask(editingSubtask.id, data) : 
              handleCreateSubtask}
            onCancel={() => { setShowForm(false); setEditingSubtask(null); }}
            users={users}
          />
        )}
        <SubtaskList
          subtasks={subtasks}
          task={task}
          user={user}
          canEdit={canManageSubtasks()}
          onEdit={(subtask) => { setEditingSubtask(subtask); setShowForm(true); }}
          onUpdateStatus={handleUpdateSubtask}
          onDelete={handleDeleteSubtask}
        />
      </CardContent>
    </Card>
  );
};

export default SubtaskWorkflow;
