import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SubtaskForm = ({ subtask, onSubmit, onCancel, users }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedUserId: ''
  });

  useEffect(() => {
    if (subtask) {
      setFormData({
        title: subtask.title || '',
        description: subtask.description || '',
        assignedUserId: subtask.assignedUserId || ''
      });
    }
  }, [subtask]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.assignedUserId) return;

    // Remove deadline from submission - subtasks don't have deadlines
    const { deadline, ...submitData } = formData;
    onSubmit(submitData);
  };

  // Get selected user for display
  const selectedUser = users.find(u => (u.userId || u.id) === formData.assignedUserId);

  // Sort users: Officers first (A-Z), then others (A-Z)
  const sortedUsers = [...users].sort((a, b) => {
    const aIsOfficer = (a.role || '').toUpperCase() === 'IT_OFFICER' || (a.role || '').toUpperCase() === 'IT OFFICER' || (a.role || '').toUpperCase() === 'USER';
    const bIsOfficer = (b.role || '').toUpperCase() === 'IT_OFFICER' || (b.role || '').toUpperCase() === 'IT OFFICER' || (b.role || '').toUpperCase() === 'USER';

    if (aIsOfficer && !bIsOfficer) return -1;
    if (!aIsOfficer && bIsOfficer) return 1;
    
    return a.name.localeCompare(b.name);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-border rounded-lg bg-muted/50 mb-4">
      <h4 className="text-sm font-bold">{subtask ? 'Edit Subtask' : 'Create New Subtask'}</h4>
      
      <div>
        <label className="text-xs font-medium text-muted-foreground">Title *</label>
        <Input
          name="title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Subtask title"
          required
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Description</label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe the subtask..."
          className="h-20"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Assign To *</label>
        <Select 
          value={formData.assignedUserId} 
          onValueChange={(value) => handleChange('assignedUserId', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {selectedUser ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    {selectedUser.name?.charAt(0) || 'U'}
                  </div>
                  <span>{selectedUser.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">({selectedUser.role})</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Select assignee</span>
              )}
            </SelectValue>
          </SelectTrigger>
           <SelectContent>
             {sortedUsers.length > 0 ? (
               sortedUsers.map((user) => (
                 <SelectItem key={user.userId || user.id} value={user.userId || user.id}>
                   <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                       {user.name?.charAt(0) || 'U'}
                     </div>
                     <span>{user.name}</span>
                     <span className="text-xs text-muted-foreground ml-auto">({user.role})</span>
                   </div>
                 </SelectItem>
               ))
             ) : (
               <div className="p-2 text-sm text-muted-foreground text-center">No users available</div>
             )}
           </SelectContent>

        </Select>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} size="sm">
          Cancel
        </Button>
        <Button type="submit" size="sm" className="cursor-pointer" disabled={!formData.assignedUserId}>
          {subtask ? 'Update' : 'Create'} Subtask
        </Button>
      </div>
    </form>
  );
};

export default SubtaskForm;