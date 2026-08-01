export const VolumetricOutput = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="spatial-z-axis-extrusion transform-gpu perspective-1000">
      <div className="translate-z-12 hover:translate-z-24 transition-all duration-300">
        {children}
      </div>
    </div>
  );
};
