import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';
import {
  loadPermissions,
  savePermissions,
  getPermissions,
  ALL_PERMISSIONS,
} from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Shield, Save, RotateCcw, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRole, setActiveRole] = useState('ADMIN');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadPermissions();
      setPerms(getPermissions());
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
      next[activeRole] = { ...next[activeRole], [permissionId]: !next[activeRole][permissionId] };
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!perms) return;
    setSaving(true);
    const ok = await savePermissions(activeRole, perms[activeRole]);
    setSaving(false);
    if (ok) {
      setDirty(false);
      toast.success(`Permissions saved for ${activeRole}`);
    } else {
      toast.error('Failed to save permissions');
    }
  };

  const handleReset = async () => {
    if (!confirm(`Reset ${activeRole} permissions to defaults?`)) return;
    await loadPermissions();
    setPerms(getPermissions());
    setDirty(false);
    toast.success('Permissions reset to defaults');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        <Loader2 size={24} className="animate-spin mr-2" />
        Loading permissions...
      </div>
    );
  }

  const currentPerms = perms?.[activeRole] || {};

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield size={24} className="text-primary" />
            Role Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure what each role can do in the system
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {ROLES.map(role => (
          <button
            key={role}
            onClick={() => { setActiveRole(role); setDirty(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all cursor-pointer ${
              activeRole === role
                ? roleColors[role] + ' shadow-sm'
                : 'bg-card border-border text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">
            {activeRole} Permissions
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
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
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4">
          <span className="text-sm text-muted-foreground">Unsaved changes</span>
          <Button size="sm" onClick={handleSave} disabled={saving} className="cursor-pointer">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="mr-1" />}
            Save
          </Button>
        </div>
      )}
    </div>
  );
};

export default PermissionsEditor;
