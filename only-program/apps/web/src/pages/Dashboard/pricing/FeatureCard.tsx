import React from "react";

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon, 
  title, 
  desc, 
  color, 
  bg, 
  border 
}) => {
  return (
    <div className="p-6 rounded-3xl bg-[#0A0A0A] border border-white/5 hover:border-white/10 hover:bg-[#0E0E0E] transition-all group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${bg} ${border} border`}>
        <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-xs text-silver/50 leading-relaxed font-medium">
        {desc}
      </p>
    </div>
  );
};

export default FeatureCard;
