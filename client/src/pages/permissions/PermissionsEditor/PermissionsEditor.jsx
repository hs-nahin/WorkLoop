import { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';
import {
  loadPermissions,
  savePermissions,
  saveUserPermissions,
  loadUserPermissions,
  getPermissions,
  getUserEffectivePermissions,
  loadRoles,
  getRoles,
  ALL_PERMISSIONS,
  ADMIN_FULL_PERMISSIONS,
  hasPermission,
} from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Shield, Save, RotateCcw, Loader2, User, Users, Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/api/apiClient';
import { getRoleBadgeColor } from '@/lib/roleUtils';

const GROUPS = ALL_PERMISSIONS.reduce((acc, p) => {
  if (!acc[p.group]) acc[p.group] = [];
  acc[p.group].push(p);
  return acc;
}, {});

const getRoleColor = (roleId) => getRoleBadgeColor(roleId);

const PermissionsEditor = () => {
  const { user } = useContext(AuthContext);
  const [perms, setPerms] = useState(null);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRole, setActiveRole] = useState('ADMIN');
  const [selectedUser, setSelectedUser] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [deleteRoleDialogOpen, setDeleteRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  const isUserMode = selectedUser !== null;

  const isSystemRole = useCallback((roleId) => {
    return roleId === 'ADMIN' || roleId === 'USER';
  }, []);

  const refreshData = useCallback(async () => {
    await loadPermissions();
    setPerms(getPermissions());
    const loadedRoles = await loadRoles();
    setRoles(loadedRoles);
    try {
      const data = await apiRequest({ endpoint: '/users' });
      setUsers(Array.isArray(data) ? data.filter(u => u.isActive !== false) : []);
    } catch (e) {
      console.error('Failed to load users', e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await refreshData();
      setLoading(false);
    };
    init();
  }, [refreshData]);

  if (!hasPermission(user?.role, 'COMPANY_SETTINGS')) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You do not have permission to manage permissions.
      </div>
    );
  }

  const BUILTIN_ROLE_IDS = ['USER', 'IT OFFICER', 'ASSISTANT'];
  const allRoleIds = ['ADMIN', ...new Set([...BUILTIN_ROLE_IDS, ...roles.map(r => r.id)])];

  const handleToggle = (permissionId) => {
    setPerms(prev => {
      const next = { ...prev };
      if (isUserMode && selectedUser) {
        const key = selectedUser.uid || selectedUser.id;
        next[key] = { ...next[key], [permissionId]: !next[key]?.[permissionId] };
      } else {
        next[activeRole] = { ...next[activeRole], [permissionId]: !next[activeRole]?.[permissionId] };
      }
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!perms) return;
    setSaving(true);
    let ok;
    if (isUserMode && selectedUser) {
      const uid = selectedUser.uid || selectedUser.id;
      ok = await saveUserPermissions(uid, perms[uid]);
    } else {
      ok = await savePermissions(activeRole, perms[activeRole]);
    }
    setSaving(false);
    if (ok) {
      setDirty(false);
      const label = isUserMode ? selectedUser.name || selectedUser.email : activeRole;
      toast.success(`Permissions saved for ${label}`);
    } else {
      toast.error('Failed to save permissions');
    }
  };

  const handleReset = async () => {
    setResetDialogOpen(false);
    if (isUserMode && selectedUser) {
      const uid = selectedUser.uid || selectedUser.id;
      setPerms(prev => ({
        ...prev,
        [uid]: {},
      }));
      await saveUserPermissions(uid, {});
      toast.success(`${selectedUser.name || selectedUser.email} permissions reset to role defaults`);
    } else {
      const roleDoc = roles.find(r => r.id === activeRole);
      if (roleDoc?.defaultPermissions) {
        await savePermissions(activeRole, roleDoc.defaultPermissions);
        setPerms(prev => ({
          ...prev,
          [activeRole]: { ...roleDoc.defaultPermissions },
        }));
      } else {
        await savePermissions(activeRole, {});
        setPerms(prev => ({
          ...prev,
          [activeRole]: {},
        }));
      }
      toast.success(`${activeRole} permissions reset to defaults`);
    }
    setDirty(false);
  };

  const handleUserSelect = async (userId) => {
    if (!userId) {
      setSelectedUser(null);
      return;
    }
    const found = users.find(u => (u.uid || u.id) === userId);
    if (!found) return;
    setSelectedUser(found);
    const uid = found.uid || found.id;
    await loadUserPermissions(uid);
    const effective = getUserEffectivePermissions(uid, found.role);
    setPerms(prev => ({
      ...prev,
      [uid]: { ...effective },
    }));
    setActiveRole(found.role);
    setDirty(false);
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return toast.error('Role name is required');
    const roleId = newRoleName.trim().toUpperCase().replace(/\s+/g, '_');
    if (['ADMIN', 'USER', 'IT_OFFICER', 'IT OFFICER', 'ASSISTANT'].includes(roleId)) {
      return toast.error('This role name is reserved');
    }
    if (roles.some(r => r.id === roleId)) {
      return toast.error('A role with this name already exists');
    }

    setRoleSubmitting(true);
    try {
      await apiRequest({
        endpoint: '/roles',
        method: 'POST',
        body: {
          name: newRoleName.trim(),
          description: newRoleDescription.trim(),
          defaultPermissions: {},
        },
      });
      toast.success(`Role "${newRoleName.trim()}" created`);
      setCreateRoleOpen(false);
      setNewRoleName('');
      setNewRoleDescription('');
      await refreshData();
      setActiveRole(roleId);
      setDirty(false);
    } catch (error) {
      toast.error(error.message || 'Failed to create role');
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleEditRole = async () => {
    if (!editRoleName.trim()) return toast.error('Role name is required');
    setRoleSubmitting(true);
    try {
      await apiRequest({
        endpoint: `/roles/${activeRole}`,
        method: 'PUT',
        body: {
          name: editRoleName.trim(),
          description: editRoleDescription.trim(),
        },
      });
      toast.success('Role updated');
      setEditRoleOpen(false);
      await refreshData();
    } catch (error) {
      toast.error(error.message || 'Failed to update role');
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    setRoleSubmitting(true);
    try {
      await apiRequest({
        endpoint: `/roles/${roleToDelete.id}`,
        method: 'DELETE',
      });
      toast.success(`Role "${roleToDelete.name}" deleted`);
      setDeleteRoleDialogOpen(false);
      setRoleToDelete(null);
      setActiveRole('ADMIN');
      setDirty(false);
      await refreshData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete role');
    } finally {
      setRoleSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        <Loader2 size={24} className="animate-spin mr-2" />
        Loading permissions...
      </div>
    );
  }

  const currentUid = isUserMode && selectedUser ? (selectedUser.uid || selectedUser.id) : null;
  const currentPerms = currentUid ? (perms?.[currentUid] || {}) : (perms?.[activeRole] || {});
  const activeRoleDoc = roles.find(r => r.id === activeRole);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield size={24} className="text-primary" />
            Roles &amp; Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create roles, configure default permissions, or override for individual users
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {allRoleIds.map(roleId => {
            const roleDoc = roles.find(r => r.id === roleId);
            const displayName = roleDoc?.name || roleId;
            return (
              <button
                key={roleId}
                onClick={() => {
                  setSelectedUser(null);
                  setActiveRole(roleId);
                  setDirty(false);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all cursor-pointer ${
                  activeRole === roleId && !isUserMode
                    ? `${getRoleColor(roleId)} shadow-sm`
                    : 'bg-card border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {displayName}
              </button>
            );
          })}
          <button
            onClick={() => setCreateRoleOpen(true)}
            className="px-3 py-2 rounded-lg text-sm font-bold border border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer flex items-center gap-1"
          >
            <Plus size={14} />
            New Role
          </button>
        </div>

        <span className="text-xs text-muted-foreground">or</span>

        <Select
          value={isUserMode ? (selectedUser?.uid || selectedUser?.id) : ''}
          onValueChange={handleUserSelect}
        >
          <SelectTrigger className="w-56 cursor-pointer">
            <SelectValue placeholder="Select a user...">
              {isUserMode && selectedUser ? (selectedUser.name || selectedUser.email) : ''}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {users.map(u => (
              <SelectItem key={u.uid || u.id} value={u.uid || u.id} className="cursor-pointer">
                <span className="flex items-center gap-2">
                  <User size={14} className="text-muted-foreground shrink-0" />
                  <span className="truncate">{u.name || u.email}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getRoleColor(u.role)}`}>
                    {u.role}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            {isUserMode ? (
              <>
                <User size={16} className="text-primary" />
                {selectedUser?.name || selectedUser?.email}
                <span className="text-muted-foreground font-normal text-xs">
                  ({selectedUser?.role}) — Individual Overrides
                </span>
              </>
            ) : (
              <>
                <Users size={16} className="text-primary" />
                {activeRoleDoc?.name || activeRole}
                <span className="text-muted-foreground font-normal text-xs">
                  Role Defaults {activeRole === 'ADMIN' && '(always all permissions)'}
                </span>
              </>
            )}
          </h2>
          <div className="flex gap-2">
            {!isUserMode && !isSystemRole(activeRole) && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditRoleName(activeRoleDoc?.name || activeRole);
                    setEditRoleDescription(activeRoleDoc?.description || '');
                    setEditRoleOpen(true);
                  }}
                  className="cursor-pointer text-xs"
                >
                  <Pencil size={14} className="mr-1" />
                  Edit Role
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRoleToDelete(activeRoleDoc || { id: activeRole, name: activeRole });
                    setDeleteRoleDialogOpen(true);
                  }}
                  className="cursor-pointer text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetDialogOpen(true)}
              className="cursor-pointer text-xs"
            >
              <RotateCcw size={14} className="mr-1" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="cursor-pointer text-xs"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : (
                <Save size={14} className="mr-1" />
              )}
              {saving ? 'Saving...' : dirty ? 'Save Changes' : 'Saved'}
            </Button>
          </div>
        </div>

        {activeRole === 'ADMIN' && !isUserMode ? (
          <div className="p-8 text-center text-muted-foreground">
            <Shield size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">Admin has unrestricted access to all features</p>
            <p className="text-xs mt-1">No permission configuration needed for the Admin role</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {Object.entries(GROUPS).map(([group, permissions]) => (
              <div key={group} className="p-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  {group}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {permissions.map(p => {
                    const enabled = currentPerms[p.id] === true;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleToggle(p.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          enabled
                            ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                            : 'bg-muted/20 border-border/50 hover:bg-muted/40'
                        }`}
                      >
                        <span className={`text-sm font-medium ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {p.label}
                        </span>
                        <div className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                          enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                            enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                          }`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {dirty && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4 z-40">
          <span className="text-sm text-muted-foreground">Unsaved changes</span>
          <Button size="sm" onClick={handleSave} disabled={saving} className="cursor-pointer">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="mr-1" />}
            Save
          </Button>
        </div>
      )}

      {/* Create Role Dialog */}
      <Dialog open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Role</DialogTitle>
            <DialogDescription>
              Define a new role and configure its default permissions afterward.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Role Name *</Label>
              <Input
                placeholder="e.g. Officer, Technician, Supervisor"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Brief description of this role..."
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRoleOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleCreateRole} disabled={roleSubmitting} className="cursor-pointer">
              {roleSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Role</DialogTitle>
            <DialogDescription>
              Update the role name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Role Name</Label>
              <Input
                value={editRoleName}
                onChange={(e) => setEditRoleName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={editRoleDescription}
                onChange={(e) => setEditRoleDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleEditRole} disabled={roleSubmitting} className="cursor-pointer">
              {roleSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <AlertDialog open={deleteRoleDialogOpen} onOpenChange={setDeleteRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{roleToDelete?.name}" Role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this role. Users assigned to this role will keep their account but may lose access to features governed by this role's permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {roleSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Permissions Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isUserMode
                ? `Reset ${selectedUser?.name || 'User'}'s Overrides?`
                : `Reset ${activeRole} Permissions?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isUserMode
                ? `${selectedUser?.name || 'This user'}'s individual permission overrides will be cleared. They will inherit all permissions from their role.`
                : `All ${activeRole} permissions will be restored to their saved defaults. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="cursor-pointer">OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PermissionsEditor;
