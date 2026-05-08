import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Shield,
  Calendar,
  MapPin,
  Camera,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContextInstance.js';
import BlurFade from '../../components/animations/BlurFade';
import GradientText from '../../components/animations/GradientText';
import TextHighlighter from '../../components/animations/TextHighlighter';

const Profile = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <div className="text-center py-20 text-muted-foreground">User profile not found.</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-2">
        <TextHighlighter text="User Profile" className="text-3xl font-bold tracking-tight" />
        <GradientText text="Detailed identification and operational data" className="text-sm opacity-70 block" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <BlurFade>
          <Card className="lg:col-span-1 border-border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                        <AvatarImage src={user?.profileImage} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">
                            {user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
            <CardContent className="pt-16 pb-6 space-y-6 text-center">
                <div>
                    <h3 className="text-xl font-bold text-foreground">{user.name}</h3>
                    <p className="text-sm text-muted-foreground font-medium">{user.email}</p>
                </div>
                <div className="flex justify-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                        user.role === 'ADMIN' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                        user.role === 'IT_OFFICER' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                        'bg-purple-500/10 text-purple-600 border-purple-500/20'
                    }`}>
                        {user.role}
                    </div>
                </div>
                <Separator />
                <div className="grid gap-4 text-left">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Briefcase size={16} className="text-primary" />
                        <span>Department: IT Operations</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Calendar size={16} className="text-primary" />
                        <span>Joined: {new Date().toLocaleDateString()}</span>
                    </div>
                </div>
                <Button variant="outline" className="w-full cursor-pointer group">
                    <Camera size={16} className="mr-2 group-hover:rotate-12 transition-transform" />
                    Update Avatar
                </Button>
            </CardContent>
          </Card>
        </BlurFade>

        <div className="lg:col-span-2 space-y-6">
            <BlurFade delay={100}>
                <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
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
                            <p className="p-3 rounded-lg bg-muted/50 border border-border text-sm font-medium">
                                {user.name || 'Not specified'}
                            </p>
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
                                <Shield size={14} /> Access Role
                            </label>
                            <p className="p-3 rounded-lg bg-muted/50 border border-border text-sm font-medium">
                                {user.role || 'Guest'}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <MapPin size={14} /> Work Location
                            </label>
                            <p className="p-3 rounded-lg bg-muted/50 border border-border text-sm font-medium">
                                Main Office / Remote
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </BlurFade>
        </div>
      </div>
    </div>
  );
};

export default Profile;
