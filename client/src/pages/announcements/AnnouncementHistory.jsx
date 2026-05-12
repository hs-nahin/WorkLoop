import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card'; 
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, ArrowLeft, Info } from 'lucide-react';
import { apiRequest } from '@/api/apiClient';
import BlurFade from '@/components/animations/BlurFade';
import MagicCard from '@/components/animations/MagicCard';
import { toast } from 'sonner';

const ANNOUNCEMENT_TYPES = {
  maintenance: { label: 'Maintenance', color: 'text-blue-400' },
  office: { label: 'Office Update', color: 'text-green-400' },
  emergency: { label: 'Emergency', color: 'text-red-400' },
  general: { label: 'General Notice', color: 'text-gray-400' },
  policy: { label: 'Policy Update', color: 'text-purple-400' },
  system: { label: 'System Update', color: 'text-indigo-400' },
};

const AnnouncementHistory = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await apiRequest({ endpoint: '/announcements' });
      setAnnouncements(data);
    } catch (err) {
      toast.error('Failed to load announcement history');
    } finally {
      setLoading(false);
    }
  };


  if (loading) return <div className="p-8 text-center">Loading history...</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6">
       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
         <div>
           <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Announcement History</h1>
           <p className="text-sm text-muted-foreground">Review previous organizational communications</p>
         </div>
       </div>

      <div className="grid grid-cols-1 gap-4">
        {announcements.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No announcement history found.
          </div>
        ) : (
           announcements.map((ann) => (
             <BlurFade key={ann.id} delay={0.1}>
               <MagicCard className="p-4 flex flex-col sm:flex-row items-start gap-4">
                 <div className="p-2 rounded-full bg-background border border-border self-start">
                   <Bell size={18} className="text-primary" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex flex-wrap items-center gap-2 mb-1">
                     <Badge variant="outline" className={ANNOUNCEMENT_TYPES[ann.type]?.color || 'text-gray-400'}>
                       {ANNOUNCEMENT_TYPES[ann.type]?.label || 'Notice'}
                     </Badge>
                     <span className="text-xs text-muted-foreground flex items-center gap-1">
                       <Calendar size={12} /> {new Date(ann.createdAt?.toDate ? ann.createdAt.toDate() : ann.createdAt).toLocaleDateString()}
                     </span>
                   </div>
                   <h3 className="text-lg font-semibold mb-2">{ann.title}</h3>
                   <p className="text-sm text-muted-foreground leading-relaxed opacity-80">
                     {ann.message}
                   </p>
                 </div>
                 <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 self-start">
                   <Badge variant="secondary" className="text-[10px] uppercase">
                     {ann.priority}
                   </Badge>
                   {!ann.active && <Badge variant="outline" className="text-red-400">Archived</Badge>}
                 </div>
               </MagicCard>
             </BlurFade>
           ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementHistory;
