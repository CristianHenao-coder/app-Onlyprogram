import React from "react";

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glass" | "bordered";
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  children, 
  className = "", 
  variant = "default" 
}) => {
  const baseStyles = "p-8 rounded-[2.5rem] transition-all duration-300";
  
  const variantStyles = {
    default: "bg-[#0A0A0A] border border-white/5",
    glass: "bg-white/5 backdrop-blur-md border border-white/10 shadow-xl",
    bordered: "bg-transparent border border-white/10 hover:border-primary/30",
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default DashboardCard;
