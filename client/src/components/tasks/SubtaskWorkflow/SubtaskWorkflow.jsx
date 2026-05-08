import { useEffect, useState, useContext } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { AuthContext } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import SubtaskList from './SubtaskList';
import SubtaskForm from './SubtaskForm';
import { useParams } from 'react-router';

const SubtaskWorkflow = ({ taskId, task }) => {
  const { user } = useContext(AuthContext);
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState(null);

  // Real-time listener for subtasks
  useEffect(() => {
    if (!taskId) return;

    const q = query(
      collection(db, 'tasks', taskId, 'subtasks'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
        updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date()
      }));
      setSubtasks(subs);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching subtasks:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [taskId]);

  const canManageSubtasks = () => {
    if (!user) return false;
    return user.role === 'ADMIN' || user.role === 'IT OFFICER';
  };

  const handleCreateSubtask = async (subtaskData) => {
    try {
      await addDoc(collection(db, 'tasks', taskId, 'subtasks'), {
        ...subtaskData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating subtask:', error);
    }
  };

  const handleUpdateSubtask = async (subtaskId, updates) => {
    try {
      const subtaskRef = doc(db, 'tasks', taskId, 'subtasks', subtaskId);
      await updateDoc(subtaskRef, {
        ...updates,
        updatedAt: new Date()
      });
      setEditingSubtask(null);
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  if (loading) return <div className="text-center py-4 text-muted-foreground">Loading subtasks...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            Subtask Workflow
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
            users={[]} // TODO: fetch users for assignment
          />
        )}
        <SubtaskList
          subtasks={subtasks}
          task={task}
          user={user}
          onEdit={(subtask) => { setEditingSubtask(subtask); setShowForm(true); }}
          onUpdateStatus={handleUpdateSubtask}
        />
      </CardContent>
    </Card>
  );
};

export default SubtaskWorkflow;
