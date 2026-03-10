const logo = "/logo.png";

interface LogoProps {
  className?: string;
  imgClassName?: string;
  customSrc?: string;
}

export default function Logo({ className = "h-24 w-24", imgClassName = "", customSrc }: LogoProps) {
  const finalLogo = customSrc || logo;
  return (
    <div className={`group flex items-center justify-center relative ${className}`}>
      {/* Glow Effect */}
      <div className="absolute -inset-2 rounded-2xl bg-primary/15 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Container */}
      <div className="relative h-full w-full flex items-center justify-center">
        <img
          src={finalLogo}
          alt="Only Program"
          className={`h-full w-full object-contain opacity-95 group-hover:opacity-100 transition-opacity ${imgClassName}`}
          draggable={false}
        />
      </div>
    </div>
  );
}
