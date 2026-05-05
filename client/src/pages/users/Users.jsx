import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToastContext } from '@/context/ToastContextState';
import { useContext, useEffect, useState } from 'react';
import { apiRequest } from '../../api/apiClient';
import BlurFade from '../../components/animations/BlurFade';
import GradientText from '../../components/animations/GradientText';
import MagicCard from '../../components/animations/MagicCard';
import TextHighlighter from '../../components/animations/TextHighlighter';

const Users = () => {
  const { showToast } = useContext(ToastContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'IT OFFICER', password: '' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiRequest({ endpoint: '/users' });
        console.log('Users fetched:', data);
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error('Failed to load users: ' + (error.message || 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setIsCreating(true);
    try {
      const createdUser = await apiRequest({
        endpoint: '/users',
        method: 'POST',
        body: newUser,
      });
      setUsers([...users, createdUser]);
      setNewUser({ name: '', email: '', role: 'IT OFFICER', password: '' });
      showToast('User created successfully', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to create user', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center text-yellow-400 font-mono animate-pulse">
          Loading Personnel Registry...
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <TextHighlighter text="Personnel Management" className="text-3xl font-bold tracking-tight" />
        <GradientText text="Oversee and manage system access and user roles" className="text-sm opacity-70" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <BlurFade>
            <MagicCard>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">All Personnel</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.map((u, index) => (
                    <BlurFade key={u.uid || index} delay={index * 50}>
                      <MagicCard className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            u.role === 'ADMIN' ? 'bg-red-400/20 text-red-400' :
                            u.role === 'IT OFFICER' ? 'bg-blue-400/20 text-blue-400' :
                            'bg-purple-400/20 text-purple-400'
                          }`}>
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground truncate">@{u.email?.split('@')[0] || u.uid}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase border shrink-0 ${
                            u.role === 'ADMIN' ? 'text-red-400 border-red-400/30 bg-red-400/10' :
                            u.role === 'IT OFFICER' ? 'text-blue-400 border-blue-400/30 bg-blue-400/10' :
                            'text-purple-400 border-purple-400/30 bg-purple-400/10'
                          }`}>
                            {u.role === 'IT OFFICER' ? 'IT Officer' : u.role === 'ASSISTANT' ? 'Asst. Technician' : u.role}
                          </span>
                        </div>
                      </MagicCard>
                    </BlurFade>
                  ))}
                </div>
              </div>
            </MagicCard>
          </BlurFade>
        </div>

        <div className="space-y-6">
          <BlurFade delay={100}>
            <MagicCard>
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase">Register New Personnel</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                    <Input 
                      value={newUser.name} 
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})} 
                      placeholder="Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                    <Input 
                      value={newUser.email} 
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
                      placeholder="email@workloop.ai"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
                    <Input 
                      value={newUser.role} 
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})} 
                      placeholder="ADMIN or IT OFFICER"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                    <Input 
                      type="password"
                      value={newUser.password} 
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})} 
                      placeholder="••••••••"
                    />
                  </div>
                  <Button 
                    onClick={handleCreateUser} 
                    disabled={isCreating} 
                    className="w-full"
                  >
                    {isCreating ? 'Registering...' : 'Initialize Access'}
                  </Button>
                </div>
              </div>
            </MagicCard>
          </BlurFade>
        </div>
      </div>
    </div>
  );
};

export default Users;
