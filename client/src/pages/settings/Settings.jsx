import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  ShieldCheck,
  User,
  Eye,
  ChevronRight,
  MapPin,
  Hash,
} from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AuthContext } from '@/context/AuthContextInstance.js';
import { hasPermission } from '@/lib/permissions';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        location: user.location || '',
        displayId: user.displayId || '',
        avatarUrl: user.avatarUrl || '',
      });
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Account information and system controls</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <User size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Personal Information</CardTitle>
                  <CardDescription>Your account identity details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-medium opacity-70 uppercase tracking-wider">Full Name</Label>
                  <div className="p-2 rounded-md bg-muted/50 border border-border text-sm">
                    {profile.name || 'Not set'}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-medium opacity-70 uppercase tracking-wider">Email Address</Label>
                  <div className="p-2 rounded-md bg-muted/50 border border-border text-sm">
                    {profile.email || 'Not set'}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-medium opacity-70 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} /> System Role
                  </Label>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border text-sm font-medium">
                    {profile.role || 'Guest'}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-medium opacity-70 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={14} /> Location
                  </Label>
                  <div className="p-2 rounded-md bg-muted/50 border border-border text-sm">
                    {profile.location || 'Not set'}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-medium opacity-70 uppercase tracking-wider flex items-center gap-1.5">
                    <Hash size={14} /> Display ID
                  </Label>
                  <div className="p-2 rounded-md bg-muted/50 border border-border text-sm font-mono">
                    {profile.displayId || 'Not set'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {(hasPermission(user?.role, 'AUDIT_LOG_VIEW') || hasPermission(user?.role, 'ROLE_MANAGE')) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                  Admin Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => navigate('/audit-logs')}
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground group-hover:text-foreground">
                    <Eye size={14} />
                    Audit System Logs
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
                <div
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => navigate('/permissions')}
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground group-hover:text-foreground">
                    <ShieldCheck size={14} />
                    Role Permissions
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
