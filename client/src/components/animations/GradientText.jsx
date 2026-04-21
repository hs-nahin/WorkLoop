
const GradientText = ({ children, className = '' }) => {
  return (
    <span className={`bg-linear-to-r from-yellow-400 via-orange-400 to-yellow-600 bg-clip-text text-transparent font-bold ${className}`}>
      {children}
    </span>
  );
};

export default GradientText;