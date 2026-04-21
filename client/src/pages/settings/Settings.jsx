import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Camera,
  CheckCircle2,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
  User
} from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '../../api/apiClient';
import BlurFade from '../../components/animations/BlurFade';
import GradientText from '../../components/animations/GradientText';
import TextHighlighter from '../../components/animations/TextHighlighter';
import { AuthContext } from '../../context/AuthContextInstance.js';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiRequest({ endpoint: '/users/me' });
        setProfile({
          name: data.name || '',
          email: data.email || '',
          role: data.role || ''
        });
      } catch (error) {
        toast.error(error.message || 'Failed to fetch profile data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiRequest({
        endpoint: '/users/update',
        method: 'PATCH',
        body: profile,
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium animate-pulse">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-2">
        <TextHighlighter text="Account Settings" className="text-3xl font-bold tracking-tight" />
        <GradientText text="Manage your operational profile and system preferences" className="text-sm opacity-70 block" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <BlurFade>
            <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <User size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Personal Information</CardTitle>
                    <CardDescription>Update your identity and contact details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-md group-hover:border-primary/50 transition-colors">
                      <AvatarImage src={user?.profileImage} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform">
                      <Camera size={14} />
                    </button>
                  </div>
                  <div className="flex-1 grid gap-4 w-full">
                    <div className="grid gap-2">
                      <Label htmlFor="name" className="text-xs font-medium opacity-70 uppercase tracking-wider">Full Name</Label>
                      <Input 
                        id="name"
                        value={profile.name} 
                        onChange={(e) => setProfile({...profile, name: e.target.value})} 
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="text-xs font-medium opacity-70 uppercase tracking-wider">Email Address</Label>
                      <Input 
                        id="email"
                        value={profile.email} 
                        onChange={(e) => setProfile({...profile, email: e.target.value})} 
                        placeholder="Enter email"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs font-medium opacity-70 uppercase tracking-wider">System Role</Label>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border text-muted-foreground font-medium text-sm">
                      <ShieldCheck size={16} />
                      {profile.role || 'Guest'}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="gap-2 px-6"
                  >
                    {isSaving ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save size={16} /> Save Changes</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        </div>

        <div className="space-y-6">
          <BlurFade delay={100}>
            <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Security Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3 text-sm">
                    <Lock size={16} className="text-green-500" />
                    <span className="text-muted-foreground">Session Encryption</span>
                  </div>
                  <CheckCircle2 size={16} className="text-green-500" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3 text-sm">
                    <ShieldCheck size={16} className="text-green-500" />
                    <span className="text-muted-foreground">MFA Verification</span>
                  </div>
                  <CheckCircle2 size={16} className="text-green-500" />
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </div>
    </div>
  );
};

export default Settings;
