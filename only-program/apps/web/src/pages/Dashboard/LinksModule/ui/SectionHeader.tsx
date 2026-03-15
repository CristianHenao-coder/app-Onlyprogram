import React from "react";

interface SectionHeaderProps {
  title: string;
  icon?: string;
  subtitle?: string;
  className?: string;
  iconClassName?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  subtitle,
  className = "",
  iconClassName = "text-primary",
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <h3 className="text-xl font-bold text-white flex items-center gap-3">
        {icon && (
          <span className={`material-symbols-outlined ${iconClassName}`}>
            {icon}
          </span>
        )}
        {title}
      </h3>
      {subtitle && (
        <p className="text-sm text-silver/60 leading-relaxed ml-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;
