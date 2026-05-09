import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';
import {
  loadPermissions,
  savePermissions,
  saveUserPermissions,
  loadUserPermissions,
  getPermissions,
  getUserEffectivePermissions,
  ALL_PERMISSIONS,
  DEFAULT_PERMISSIONS,
} from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Shield, Save, RotateCcw, Loader2, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/api/apiClient';

const ROLES = ['ADMIN', 'IT OFFICER', 'ASSISTANT'];

const roleColors = {
  ADMIN: 'bg-red-500/10 border-red-500/30 text-red-500',
  'IT OFFICER': 'bg-blue-500/10 border-blue-500/30 text-blue-500',
  ASSISTANT: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
};

const GROUPS = ALL_PERMISSIONS.reduce((acc, p) => {
  if (!acc[p.group]) acc[p.group] = [];
  acc[p.group].push(p);
  return acc;
}, {});

const PermissionsEditor = () => {
  const { user } = useContext(AuthContext);
  const [perms, setPerms] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRole, setActiveRole] = useState('ADMIN');
  const [selectedUser, setSelectedUser] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const isUserMode = selectedUser !== null;

  useEffect(() => {
    const init = async () => {
      await loadPermissions();
      setPerms(getPermissions());
      try {
        const data = await apiRequest({ endpoint: '/users' });
        setUsers(Array.isArray(data) ? data.filter(u => u.isActive !== false && u.role?.toUpperCase() !== 'ADMIN') : []);
      } catch (e) {
        console.error('Failed to load users', e);
      }
      setLoading(false);
    };
    init();
  }, []);

  if (!hasPermission(user?.role, 'COMPANY_SETTINGS')) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You do not have permission to manage permissions.
      </div>
    );
  }

  const handleToggle = (permissionId) => {
    setPerms(prev => {
      const next = { ...prev };
      if (isUserMode && selectedUser) {
        const key = selectedUser.uid || selectedUser.id;
        next[key] = { ...next[key], [permissionId]: !next[key]?.[permissionId] };
      } else {
        next[activeRole] = { ...next[activeRole], [permissionId]: !next[activeRole][permissionId] };
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
      const roleDefaults = { ...(DEFAULT_PERMISSIONS[roleKey(selectedUser.role)] || {}) };
      setPerms(prev => ({
        ...prev,
        [uid]: roleDefaults,
      }));
      await saveUserPermissions(uid, {});
      toast.success(`${selectedUser.name || selectedUser.email} permissions reset to ${selectedUser.role} defaults`);
    } else {
      const defaults = { ...(DEFAULT_PERMISSIONS[activeRole] || {}) };
      await savePermissions(activeRole, defaults);
      setPerms(prev => ({
        ...prev,
        [activeRole]: defaults,
      }));
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

  const roleKey = (r) => {
    const role = (r || '').toUpperCase();
    if (role === 'IT_OFFICER') return 'IT OFFICER';
    return role;
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

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield size={24} className="text-primary" />
            Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure role defaults or individual user overrides
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => {
                setSelectedUser(null);
                setActiveRole(role);
                setDirty(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all cursor-pointer ${
                activeRole === role && !isUserMode
                  ? roleColors[role] + ' shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {role}
            </button>
          ))}
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
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    roleColors[u.role] || 'bg-muted text-muted-foreground'
                  }`}>
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
                {activeRole}
                <span className="text-muted-foreground font-normal text-xs">
                  Role Defaults
                </span>
              </>
            )}
          </h2>
          <div className="flex gap-2">
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
      </div>

      {dirty && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4 z-40">
          <span className="text-sm text-muted-foreground">Unsaved changes</span>
          <Button size="sm" onClick={handleSave} disabled={saving} className="cursor-pointer">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="mr-1" />}
            Save
          </Button>
        </div>
      )}

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isUserMode
                ? `Reset ${selectedUser?.name || 'User'}'s Permissions?`
                : `Reset ${activeRole} Permissions?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isUserMode
                ? `${selectedUser?.name || 'This user'}'s individual permissions will be cleared and they will inherit all permissions from the ${selectedUser?.role} role.`
                : `All ${activeRole} permissions will be restored to their default values. This cannot be undone.`}
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
