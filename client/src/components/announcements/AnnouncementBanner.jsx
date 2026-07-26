import React, { useState, useEffect } from 'react';
import { Bell, X, ExternalLink, AlertTriangle, Info, Megaphone } from 'lucide-react';
import { apiRequest } from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import BlurFade from '@/components/animations/BlurFade';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ANNOUNCEMENT_TYPES = {
  maintenance: { 
    label: 'Maintenance', 
    color: 'from-blue-500/10 via-blue-500/20 to-blue-500/10', 
    text: 'text-blue-600 dark:text-blue-400', 
    border: 'border-blue-500/30', 
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: <Info size={16} /> 
  },
  office: { 
    label: 'Office', 
    color: 'from-green-500/10 via-green-500/20 to-green-500/10', 
    text: 'text-green-600 dark:text-green-400', 
    border: 'border-green-500/30', 
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: <Megaphone size={16} /> 
  },
  emergency: { 
    label: 'Emergency', 
    color: 'from-red-500/10 via-red-500/20 to-red-500/10', 
    text: 'text-red-600 dark:text-red-400', 
    border: 'border-red-500/30', 
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: <AlertTriangle size={16} /> 
  },
  general: { 
    label: 'Notice', 
    color: 'from-sky-500/10 via-sky-500/20 to-sky-500/10', 
    text: 'text-sky-600 dark:text-sky-400', 
    border: 'border-sky-500/30', 
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    icon: <Bell size={16} /> 
  },
  policy: { 
    label: 'Policy', 
    color: 'from-purple-500/10 via-purple-500/20 to-purple-500/10', 
    text: 'text-purple-600 dark:text-purple-400', 
    border: 'border-purple-500/30', 
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: <Info size={16} /> 
  },
  system: { 
    label: 'System', 
    color: 'from-indigo-500/10 via-indigo-500/20 to-indigo-500/10', 
    text: 'text-indigo-600 dark:text-indigo-400', 
    border: 'border-indigo-500/30', 
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: <Bell size={16} /> 
  },
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
  const [dismissedIds, setDismissedIds] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('dismissedAnnouncements') || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await apiRequest({ endpoint: '/announcements' });
      setAnnouncements(data);
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
      setDismissedIds(prev => {
        const next = [...prev, id];
        try { sessionStorage.setItem('dismissedAnnouncements', JSON.stringify(next)); } catch {}
        return next;
      });
    } catch (err) {
      console.error('Error marking announcement as read:', err);
    }
  };

  if (loading) return null;

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id));
  if (visibleAnnouncements.length === 0) return null;

  // We only show the top most critical/pinned announcement in the banner
   const mainAnnouncement = visibleAnnouncements[0];

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
          <div className={`relative overflow-hidden rounded-xl border ${style.border} ${style.bg} bg-gradient-to-r ${style.color} backdrop-blur-md p-3 mb-6 transition-all duration-300 shadow-sm`}>
            <div className="absolute left-0 top-0 bottom-0 w-1 overflow-hidden">
              <div className="absolute inset-0 w-full blur-[2px] animate-beam-vertical" style={{ background: getBeamGradient(beamColor) }} />
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1 overflow-hidden">
              <div className="absolute inset-0 w-full blur-[2px] animate-beam-vertical" style={{ background: getBeamGradient(beamColor) }} />
            </div>
            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-background/80 dark:bg-slate-900/50 shadow-sm ${style.text}`}>
                  {style.icon}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <Badge variant="outline" className={`text-[10px] uppercase tracking-wider font-semibold ${style.text} bg-background/50 dark:bg-slate-800/50`}>
                      {style.label}
                  </Badge>
                  <p className="text-sm font-medium text-foreground/90 dark:text-foreground/90">
                    <span className="font-bold">{mainAnnouncement.title}:</span> <span className="font-normal opacity-80">{mainAnnouncement.message}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {mainAnnouncement.priority === 'critical' && (
                  <span className="hidden sm:inline-block text-[10px] font-bold text-red-600 dark:text-red-400 uppercase animate-pulse bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">Critical</span>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => dismiss(mainAnnouncement.id)}
                  className="p-1 h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
                >
                  <X size={14} className="text-foreground/60 group-hover:text-red-600 dark:group-hover:text-red-400" />
                </Button>
              </div>
            </div>
          </div>
        </BlurFade>
      );

};

export default AnnouncementBanner;
