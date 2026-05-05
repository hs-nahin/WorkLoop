
const BlurFade = ({ children, duration = 0.5, delay = 0, className = '' }) => {
  return (
    <div 
      className={`animate-blur-fade ${className}`}
      style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
};

export default BlurFade;
