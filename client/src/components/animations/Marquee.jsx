import React from 'react';

const Marquee = ({ text, speed = "slow", reverse = false, className = "" }) => {
  const duration = speed === "fast" ? "20s" : speed === "medium" ? "30s" : "40s";
  
  return (
    <<divdiv className={`overflow-hidden whitespace-nowrap relative flex ${className}`}>
      <<divdiv 
        className={`flex animate-marquee ${reverse ? 'animate-marquee-reverse' : ''}`} 
        style={{ animationDuration: duration }}
      >
        <<spanspan className="mx-4 text-sm font-mono uppercase tracking-widest opacity-70">{text}</span>
        <<spanspan className="mx-4 text-sm font-mono uppercase tracking-widest opacity-70">{text}</span>
        <<spanspan className="mx-4 text-sm font-mono uppercase tracking-widest opacity-70">{text}</span>
        <<spanspan className="mx-4 text-sm font-mono uppercase tracking-widest opacity-70">{text}</span>
      </div>
      
      <<stylestyle jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Marquee;
