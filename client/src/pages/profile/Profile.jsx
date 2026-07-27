import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Shield,
  MapPin,
  Hash,
  Calendar,
  Pencil,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { getRoleBadgeColor, resolveRoleName } from '@/lib/roleUtils';
import { loadRoles } from '@/lib/permissions';

const Profile = () => {
  const { user, fetchMe } = useContext(AuthContext);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    loadRoles().then(setRoles);
  }, []);

  const joinDate = useMemo(() => {
    if (!user?.createdAt) return null;
    const date = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
    return isNaN(date.getTime()) ? null : date.toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }, [user?.createdAt]);

  const startEdit = () => {
    setNameValue(user?.name || '');
    setEditingName(true);
  };

  const cancelEdit = () => {
    setEditingName(false);
    setNameValue('');
  };

  const saveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) return toast.error('Name cannot be empty');
    if (trimmed === (user?.name || '')) { setEditingName(false); return; }

    setSaving(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update name');
      }
      await fetchMe();
      setEditingName(false);
      toast.success('Name updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="text-center py-20 text-muted-foreground">User profile not found.</div>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-2">Your account details</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 overflow-hidden">
          <CardContent className="pt-8 pb-6 space-y-6 text-center">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">
                  {user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{user.name}</h3>
              <p className="text-sm text-muted-foreground font-medium">{user.email}</p>
            </div>
            <div className="flex justify-center gap-2">
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getRoleBadgeColor(user.role)}`}>
                {resolveRoleName(user.role, roles)}
              </div>
            </div>
            <Separator />
            <div className="grid gap-3 text-left">
              {user.location && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin size={16} className="text-primary shrink-0" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.displayId && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Hash size={16} className="text-primary shrink-0" />
                  <span className="font-mono">{user.displayId}</span>
                </div>
              )}
              {joinDate && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar size={16} className="text-primary shrink-0" />
                  <span>Joined {joinDate}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <User size={20} className="text-primary" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <User size={14} /> Full Name
                </label>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveName();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                      className="h-9"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 shrink-0 text-green-600 hover:text-green-700 cursor-pointer"
                      onClick={saveName}
                      disabled={saving}
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 shrink-0 cursor-pointer"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="flex-1 p-3 rounded-lg bg-muted/50 border border-border text-sm font-medium">
                      {user.name || 'Not specified'}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 shrink-0 cursor-pointer"
                      onClick={startEdit}
                      title="Edit name"
                    >
                      <Pencil size={14} />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Mail size={14} /> Email Address
                </label>
                <p className="p-3 rounded-lg bg-muted/50 border border-border text-sm font-medium">
                  {user.email || 'Not specified'}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Shield size={14} /> Role
                </label>
                <p className="p-3 rounded-lg bg-muted/50 border border-border text-sm font-medium">
                  {resolveRoleName(user.role, roles)}
                </p>
              </div>
              {user.location && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={14} /> Location
                  </label>
                  <p className="p-3 rounded-lg bg-muted/50 border border-border text-sm font-medium">
                    {user.location}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
