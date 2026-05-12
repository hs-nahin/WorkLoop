const MagicCard = ({ children, className = '' }) => {
  return (
    <div 
      className={`relative overflow-hidden bg-card border border-border rounded-2xl p-6 
        transition-all duration-300 ease-out
        hover:border-primary/40 hover:-translate-y-[1px] 
        hover:shadow-lg hover:shadow-black/5
        ${className}`}
    >
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default MagicCard;
