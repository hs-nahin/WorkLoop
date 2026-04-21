
const BentoGrid = ({ children, className = "" }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[180px] ${className}`}>
      {children}
    </div>
  );
};

export const BentoItem = ({ children, colSpan = 1, rowSpan = 1, className = "" }) => {
  return (
    <div 
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors duration-300 ${className}`}
      style={{ 
        gridColumn: `span ${colSpan}`, 
        gridRow: `span ${rowSpan}` 
      }}
    >
      {children}
    </div>
  );
};

export default BentoGrid;
