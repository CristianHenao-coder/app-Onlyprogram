import React from "react";

interface DashboardInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  icon?: string;
  containerClassName?: string;
}

const DashboardInput: React.FC<DashboardInputProps> = ({
  label,
  error,
  icon,
  containerClassName = "",
  className = "",
  ...props
}) => {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label className="text-[10px] font-bold text-silver/40 uppercase pl-1 tracking-widest">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="material-symbols-outlined absolute left-4 text-silver/20 text-lg">
            {icon}
          </span>
        )}
        <input
          className={`w-full bg-black/40 border rounded-2xl py-4 text-white font-bold transition-all focus:outline-none focus:border-primary/50 shadow-inner ${
            icon ? "pl-12 pr-6" : "px-6"
          } ${
            error ? "border-red-500/50" : "border-white/5"
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 font-medium flex items-center gap-1 mt-1 ml-1 animate-fade-in">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}
    </div>
  );
};

export default DashboardInput;
