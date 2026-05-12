import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Bell, 
  Trash2, 
  Edit3, 
  Pin, 
  PinOff, 
  CheckCircle, 
  XCircle, 
  Save, 
  ArrowLeft 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/api/apiClient';
import { toast } from 'sonner';
import BlurFade from '@/components/animations/BlurFade';
import MagicCard from '@/components/animations/MagicCard';

const ANNOUNCEMENT_TYPES = [
  { id: 'maintenance', label: 'Maintenance Notice', color: 'blue' },
  { id: 'office', label: 'Office Update', color: 'green' },
  { id: 'emergency', label: 'Emergency Alert', color: 'red' },
  { id: 'general', label: 'General Notice', color: 'gray' },
  { id: 'policy', label: 'Policy Update', color: 'purple' },
  { id: 'system', label: 'System Update', color: 'indigo' },
];

const PRIORITY_LEVELS = [
  { id: 'low', label: 'Low', color: 'text-gray-500' },
  { id: 'medium', label: 'Medium', color: 'text-yellow-500' },
  { id: 'high', label: 'High', color: 'text-orange-500' },
  { id: 'critical', label: 'Critical', color: 'text-red-600' },
];

const ROLES = ['all', 'ADMIN', 'OFFICER', 'ASSISTANT'];

const AnnouncementsPage = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'general',
    priority: 'low',
    startsAt: '',
    expiresAt: '',
    targetRoles: ['all'],
    pinned: false,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await apiRequest({ endpoint: '/announcements' });
      setAnnouncements(data);
    } catch (err) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Basic validation
      if (!formData.title.trim()) {
        toast.error('Title is required');
        return;
      }
      if (!formData.message.trim()) {
        toast.error('Message is required');
        return;
      }

      // Set saving state to true to disable button and show loading text
      setIsSaving(true);

      if (editingId) {
        await apiRequest({ 
          endpoint: `/announcements/${editingId}`, 
          method: 'PUT', 
          body: formData 
        });
        toast.success('Announcement updated');
      } else {
        await apiRequest({ 
          endpoint: '/announcements', 
          method: 'POST', 
          body: formData 
        });
        toast.success('Announcement created');
      }
      setFormData({
        title: '',
        message: '',
        type: 'general',
        priority: 'low',
        startsAt: '',
        expiresAt: '',
        targetRoles: ['all'],
        pinned: false,
      });
      setIsSaving(false);
      setShowForm(false);
      setEditingId(null);
      fetchAnnouncements();
    } catch (err) {
      // Reset saving state on error
      setIsSaving(false);
      // Enhanced error handling
      if (err.status === 403) {
        toast.error('You do not have permission to create announcements');
      } else if (err.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (err.status === 400) {
        toast.error(err.message || 'Invalid data provided');
      } else if (err.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(err.message || 'Error saving announcement');
      }
    }
  };
 
  const confirmDelete = (id) => {
    setDeleteTarget(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest({ 
        endpoint: `/announcements/${deleteTarget}`, 
        method: 'DELETE' 
      });
      toast.success('Announcement deleted');
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to delete announcement');
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };
 
  const togglePin = async (ann) => {
    try {
      await apiRequest({ 
        endpoint: `/announcements/${ann.id}`, 
        method: 'PUT', 
        body: { pinned: !ann.pinned } 
      });
      fetchAnnouncements();
      toast.success(ann.pinned ? 'Unpinned' : 'Pinned');
    } catch (err) {
      toast.error('Failed to update pin status');
    }
  };
 
  const toggleActive = async (ann) => {
    try {
      await apiRequest({ 
        endpoint: `/announcements/${ann.id}/toggle`, 
        method: 'PATCH' 
      });
      fetchAnnouncements();
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };


  const updateTargetRole = (role) => {
    setFormData(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role) 
        ? prev.targetRoles.filter(r => r !== role) 
        : [...prev.targetRoles, role]
    }));
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6">
       <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
         <div>
           <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Organizational Announcements</h1>
           <p className="text-sm text-muted-foreground">Broadcast critical updates to your organization</p>
         </div>
         {!showForm && !editingId && (
           <Button onClick={() => setShowForm(true)} className="gap-2 w-full md:w-auto">
             <Plus size={18} /> Create Announcement
           </Button>
         )}
       </div>

       {showForm || editingId ? (
         <BlurFade delay={0}>
           <MagicCard className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editingId ? 'Edit Announcement' : 'New Announcement'}</h2>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}>
                <XCircle size={18} />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. Scheduled Server Maintenance" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea 
                  value={formData.message} 
                  onChange={(e) => setFormData({...formData, message: e.target.value})} 
                  placeholder="Provide detailed information here..." 
                  rows={4}
                />
              </div>
              
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Announcement Type</label>
                  <Select 
                    value={formData.type}
                    onValueChange={(v) => setFormData({...formData, type: v})}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANNOUNCEMENT_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority Level</label>
                  <Select 
                    value={formData.priority}
                    onValueChange={(v) => setFormData({...formData, priority: v})}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_LEVELS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Roles</label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(role => (
                    <Badge 
                      key={role} 
                      variant={formData.targetRoles.includes(role) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => updateTargetRole(role)}
                    >
                      {role === 'all' ? 'All Users' : role}
                    </Badge>
                  ))}
                </div>
              </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date (Optional)</label>
                  <Input 
                    type="datetime-local" 
                    value={formData.startsAt} 
                    onChange={(e) => setFormData({...formData, startsAt: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expiration Date (Optional)</label>
                  <Input 
                    type="datetime-local" 
                    value={formData.expiresAt} 
                    onChange={(e) => setFormData({...formData, expiresAt: e.target.value})} 
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pb-2">
                <input 
                  type="checkbox" 
                  id="pinned" 
                  checked={formData.pinned} 
                  onChange={(e) => setFormData({...formData, pinned: e.target.checked})}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="pinned" className="text-sm font-medium">Pin to Top</label>
              </div>
            </div>

             <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  <Save size={18} /> {editingId ? 'Updating...' : isSaving ? 'Creating...' : 'Create Announcement'}
                </Button>
             </div>
          </MagicCard>
        </BlurFade>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {announcements.map((ann) => (
             <MagicCard key={ann.id} className="p-4 relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-primary" />
                  <Badge variant="outline" className={
                    ANNOUNCEMENT_TYPES.find(t => t.id === ann.type)?.color === 'red' ? 'border-red-500 text-red-500' : 
                    ANNOUNCEMENT_TYPES.find(t => t.id === ann.type)?.color === 'blue' ? 'border-blue-500 text-blue-500' : 
                    'border-gray-500 text-gray-500'
                  }>
                    {ANNOUNCEMENT_TYPES.find(t => t.id === ann.type)?.label}
                  </Badge>
                </div>
                <Badge variant="secondary" className={PRIORITY_LEVELS.find(p => p.id === ann.priority)?.color}>
                  {ann.priority.toUpperCase()}
                </Badge>
              </div>

              <h3 className="text-lg font-bold mb-2">{ann.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{ann.message}</p>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                {ann.pinned && <span className="flex items-center gap-1 text-primary font-medium"><Pin size={12} /> Pinned</span>}
                <span>{new Date(ann.createdAt?.toDate ? ann.createdAt.toDate() : ann.createdAt).toLocaleDateString()}</span>
                {ann.startsAt && <span>From: {new Date(ann.startsAt).toLocaleDateString()}</span>}
                {ann.expiresAt && <span>Until: {new Date(ann.expiresAt).toLocaleDateString()}</span>}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => togglePin(ann)} className="p-2 h-8 w-8">
                    {ann.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(ann)} className="p-2 h-8 w-8">
                    {ann.active ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditingId(ann.id);
                    setShowForm(false);
                    setFormData({
                      title: ann.title,
                      message: ann.message,
                      type: ann.type,
                      priority: ann.priority,
                      startsAt: ann.startsAt || '',
                      expiresAt: ann.expiresAt || '',
                      targetRoles: ann.targetRoles,
                      pinned: ann.pinned,
                    });
                  }} className="p-2 h-8 w-8">
                    <Edit3 size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => confirmDelete(ann.id)} className="p-2 h-8 w-8 text-destructive">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </MagicCard>
          ))}
        </div>
      )}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnnouncementsPage;
