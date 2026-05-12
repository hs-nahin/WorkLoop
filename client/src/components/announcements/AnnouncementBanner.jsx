import React, { useState, useEffect } from 'react';
import { Bell, X, ExternalLink, AlertTriangle, Info, Megaphone } from 'lucide-react';
import { apiRequest } from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import BlurFade from '@/components/animations/BlurFade';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ANNOUNCEMENT_TYPES = {
  maintenance: { label: 'Maintenance', color: 'from-blue-500/20 to-blue-600/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: <Info size={16} /> },
  office: { label: 'Office', color: 'from-green-500/20 to-green-600/20', text: 'text-green-400', border: 'border-green-500/30', icon: <Megaphone size={16} /> },
  emergency: { label: 'Emergency', color: 'from-red-500/20 to-red-600/20', text: 'text-red-400', border: 'border-red-500/30', icon: <AlertTriangle size={16} /> },
  general: { label: 'Notice', color: 'from-gray-500/20 to-gray-600/20', text: 'text-gray-400', border: 'border-gray-500/30', icon: <Bell size={16} /> },
  policy: { label: 'Policy', color: 'from-purple-500/20 to-purple-600/20', text: 'text-purple-400', border: 'border-purple-500/30', icon: <Info size={16} /> },
  system: { label: 'System', color: 'from-indigo-500/20 to-indigo-600/20', text: 'text-indigo-400', border: 'border-indigo-500/30', icon: <Bell size={16} /> },
};

const getPriorityBeamColor = (priority) => {
  switch (priority) {
    case 'critical': return 'red-500/40';
    case 'high': return 'orange-500/40';
    case 'medium': return 'yellow-500/40';
    default: return 'gray-500/40';
  }
};

const AnnouncementBanner = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [visibleAnnouncements, setVisibleAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
    // Polling for updates (simple real-time simulation, or use a listener if firebase JS SDK is available)
    const interval = setInterval(fetchAnnouncements, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await apiRequest({ endpoint: '/announcements' });
      setAnnouncements(data);
      // Let the user decide which ones to hide in local state
      setVisibleAnnouncements(prev => {
        const currentIds = prev.map(a => a.id);
        return data.filter(a => !currentIds.includes(a.id));
      });
    } catch (err) {
      console.error('Banner fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = async (id) => {
    try {
      await apiRequest({ 
        endpoint: `/announcements/${id}/read`, 
        method: 'POST' 
      });
      setVisibleAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error marking announcement as read:', err);
    }
  };

  if (loading) return null;
  if (announcements.length === 0) return null;

  // We only show the top most critical/pinned announcement in the banner
   const mainAnnouncement = announcements[0]; 

   const style = ANNOUNCEMENT_TYPES[mainAnnouncement.type] || ANNOUNCEMENT_TYPES.general;
   const beamColor = getPriorityBeamColor(mainAnnouncement.priority);

   const getBeamGradient = (color) => {
     switch (color) {
       case 'red-500/40': return 'linear-gradient(to bottom, transparent, rgba(239, 68, 68, 0.4), transparent)';
       case 'orange-500/40': return 'linear-gradient(to bottom, transparent, rgba(249, 115, 22, 0.4), transparent)';
       case 'yellow-500/40': return 'linear-gradient(to bottom, transparent, rgba(234, 179, 8, 0.4), transparent)';
       default: return 'linear-gradient(to bottom, transparent, rgba(107, 114, 128, 0.4), transparent)';
     }
   };

   return (
     <BlurFade delay={0.2}>
       <div className={`relative overflow-hidden rounded-xl border ${style.border} bg-gradient-to-r ${style.color} backdrop-blur-md p-3 mb-6 transition-all duration-300`}>
         <div className="absolute left-0 top-0 bottom-0 w-1 overflow-hidden">
           <div className="absolute inset-0 w-full blur-[2px] animate-beam-vertical" style={{ background: getBeamGradient(beamColor) }} />
         </div>
         <div className="absolute right-0 top-0 bottom-0 w-1 overflow-hidden">
           <div className="absolute inset-0 w-full blur-[2px] animate-beam-vertical" style={{ background: getBeamGradient(beamColor) }} />
         </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-background/50 ${style.text}`}>
              {style.icon}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${style.text} border-current`}>
                {style.label}
              </Badge>
              <p className="text-sm font-medium text-foreground/90">
                {mainAnnouncement.title}: <span className="font-normal opacity-80">{mainAnnouncement.message}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mainAnnouncement.priority === 'critical' && (
              <span className="hidden sm:inline-block text-[10px] font-bold text-red-500 uppercase animate-pulse">Critical</span>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => dismiss(mainAnnouncement.id)}
              className="p-1 h-8 w-8 rounded-full hover:bg-background/20"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      </div>
    </BlurFade>
  );
};

export default AnnouncementBanner;
