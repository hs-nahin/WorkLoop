import { useContext, useEffect, useState } from 'react';
import { apiRequest } from '../../api/apiClient';
import BlurFade from '../../components/animations/BlurFade';
import GradientText from '../../components/animations/GradientText';
import MagicCard from '../../components/animations/MagicCard';
import TextHighlighter from '../../components/animations/TextHighlighter';
import Button from '../../components/ui/Button/Button';
import Input from '../../components/ui/Input/Input';
import { ToastContext } from '../../context/ToastContext';

const Settings = () => {
  const { showToast } = useContext(ToastContext);
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
        console.error('Failed to fetch profile:', error);
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
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-yellow-400 font-mono animate-pulse">
        Loading Settings...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <TextHighlighter text="Account Settings" className="text-3xl font-bold tracking-tight" />
        <GradientText text="Manage your operational profile and system preferences" className="text-sm opacity-70" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <BlurFade>
            <MagicCard>
              <div className="space-y-6">
                <h2 className="text-lg font-bold">Personal Information</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                    <Input 
                      value={profile.name} 
                      onChange={(e) => setProfile({...profile, name: e.target.value})} 
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                    <Input 
                      value={profile.email} 
                      onChange={(e) => setProfile({...profile, email: e.target.value})} 
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">System Role</label>
                    <Input 
                      value={profile.role} 
                      disabled 
                      className="opacity-50 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="pt-6 flex justify-end">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="px-8"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </MagicCard>
          </BlurFade>
        </div>

        <div className="space-y-6">
          <BlurFade delay={100}>
            <MagicCard>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase">Security Status</h3>
                <div className="flex items-center gap-3 text-green-400 text-xs font-mono">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Encrypted Session Active
                </div>
                <div className="flex items-center gap-3 text-green-400 text-xs font-mono">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  MFA Verified
                </div>
              </div>
            </MagicCard>
          </BlurFade>
        </div>
      </div>
    </div>
  );
};

export default Settings;