import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    
    return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm">
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-sm font-mono font-medium text-foreground tabular-nums">
        {formatTime(time)}
      </span>
    </div>
  );
};

export default LiveClock;