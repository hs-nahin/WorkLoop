
const TextHighlighter = ({ children, color = 'yellow', className = '', animated = true }) => {
  const colors = {
    yellow: 'bg-yellow-400/30 text-yellow-300',
    green: 'bg-green-400/30 text-green-300',
    red: 'bg-red-400/30 text-red-300',
    blue: 'bg-blue-400/30 text-blue-300',
  };

  const activeColor = colors[color] || colors.yellow;

  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      <span className={`
        absolute bottom-0 left-0 w-full h-3 
        ${activeColor} 
        -z-10 
        ${animated ? 'animate-marker-highlight' : ''}
        rounded-sm
      `} />
    </span>
  );
};

export default TextHighlighter;