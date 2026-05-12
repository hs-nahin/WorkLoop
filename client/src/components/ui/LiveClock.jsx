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

   const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
   const dayName = dayNames[time.getDay()];
   const month = (time.getMonth() + 1).toString().padStart(2, '0');
   const day = time.getDate().toString().padStart(2, '0');
   const year = time.getFullYear();

   return (
     <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 backdrop-blur-sm border border-sky-500/20 dark:border-sky-500/30 shadow-sm">
       <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
       <span className="text-xs sm:text-sm font-mono font-medium tabular-nums leading-none text-sky-700 dark:text-sky-50">
         <span className="hidden sm:inline">{dayName}, </span>
         {day}/{month}/{year}
         <span className="hidden sm:inline"> • </span>
         <span className="sm:hidden"> </span>
         {hours12.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
         <span className="hidden sm:inline">:{seconds.toString().padStart(2, '0')}</span>
         {' '}{ampm}
       </span>
     </div>
   );
};

export default LiveClock;