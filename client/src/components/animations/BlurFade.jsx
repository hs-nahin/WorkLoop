
const BlurFade = ({ children, delay = 0, duration = 500, className = '' }) => {
  return (
    <div 
      className={`transition-all duration-500 ease-out ${className}`}
      style={{ 
        animation: `blurFade ${duration}ms ease-out ${delay}ms forwards`,
        opacity: 0 
      }}
    >
      {children}
    </div>
  );
};

export default BlurFade;
