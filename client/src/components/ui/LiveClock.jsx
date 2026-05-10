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

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm">
      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs sm:text-sm font-mono font-medium text-foreground tabular-nums leading-none">
        {hours12.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
        <span className="hidden sm:inline">:{seconds.toString().padStart(2, '0')}</span>
        {' '}{ampm}
      </span>
    </div>
  );
};

export default LiveClock;