import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

const SubtaskForm = ({ subtask, onSubmit, onCancel, users }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedUserId: '',
    deadline: ''
  });

  useEffect(() => {
    if (subtask) {
      setFormData({
        title: subtask.title || '',
        description: subtask.description || '',
        assignedUserId: subtask.assignedUserId || '',
        deadline: subtask.deadline ? new Date(subtask.deadline).toISOString().split('T')[0] : ''
      });
    }
  }, [subtask]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    onSubmit({
      ...formData,
      deadline: formData.deadline ? new Date(formData.deadline) : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-border rounded-lg bg-muted/50 mb-4">
      <h4 className="text-sm font-bold">{subtask ? 'Edit Subtask' : 'Create New Subtask'}</h4>
      
      <div>
        <label className="text-xs font-medium text-muted-foreground">Title *</label>
        <Input
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Subtask title"
          required
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Description</label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the subtask..."
          className="h-20"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Assign To *</label>
        <Input
          name="assignedUserId"
          value={formData.assignedUserId}
          onChange={handleChange}
          placeholder="User ID (TODO: replace with dropdown)"
          required
        />
        {/* TODO: Replace with dropdown of users fetched from API */}
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Deadline</label>
        <Input
          type="date"
          name="deadline"
          value={formData.deadline}
          onChange={handleChange}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} size="sm">
          Cancel
        </Button>
        <Button type="submit" size="sm" className="cursor-pointer">
          {subtask ? 'Update' : 'Create'} Subtask
        </Button>
      </div>
    </form>
  );
};

export default SubtaskForm;
