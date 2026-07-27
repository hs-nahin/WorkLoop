import BlurFade from '@/components/animations/BlurFade';
import TextHighlighter from '@/components/animations/TextHighlighter.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthContext } from '@/context/AuthContext';
import { Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailDomain, setEmailDomain] = useState('workloop.local');

  const { login, user, token, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && token && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, token, loading, navigate]);

  useEffect(() => {
    fetch('/api/company')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.emailDomain) setEmailDomain(data.emailDomain); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId.trim()) return toast.error('Please enter your User ID');
    if (!password.trim()) return toast.error('Please enter your password');

    setIsLoading(true);
    try {
      const input = userId.trim();
      const email = input.includes('@') ? input : `${input}@${emailDomain}`;
      const result = await login({ email, password });

      toast.success('Welcome back to WorkLoop!');
      navigate('/dashboard');
    } catch (error) {
      let message = 'Invalid credentials. Please try again.';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this User ID.';
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      } else if (error.message) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <BlurFade>
        <Card className="w-full max-w-md shadow-xl border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <TextHighlighter
                text="WORKLOOP"
                className="text-3xl font-black tracking-tighter italic"
              />
            </div>
            <CardTitle className="text-xl font-bold">Sign In</CardTitle>
            <CardDescription>
              Access your internal IT workflow management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="userId" className="text-xs font-medium opacity-70 uppercase tracking-wider">
                  User ID
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="userId"
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                    className="pl-10"
                    placeholder="Enter your User ID"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium opacity-70 uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-6 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Enter Workspace"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Need to create an admin account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
};

export default Login;
