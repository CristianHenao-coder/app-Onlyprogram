import { useState } from 'react';

interface PasswordInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  placeholder?: string;
  showStrength?: boolean;
  required?: boolean;
  className?: string;
}

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  label,
  placeholder = "••••••••",
  showStrength = false,
  required = false,
  className = "",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  // Password Strength Logic
  const hasMinLength = value.length >= 6;
  const hasLetter = /[a-z]/.test(value);
  const hasUppercase = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[@$!%*#?&]/.test(value);

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-[10px] uppercase font-black tracking-widest transition-all duration-300 ${met ? 'text-green-400' : 'text-silver/20'}`}>
      <span className="material-symbols-outlined text-xs">
        {met ? 'check_circle' : 'circle'}
      </span>
      <span>{text}</span>
    </div>
  );

  return (
    <div className={className}>
      {label && (
        <label className="block text-[10px] font-black text-silver/40 uppercase tracking-[0.2em] mb-2 ml-1" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          required={required}
          value={value}
          onChange={onChange}
          className={`w-full bg-white/5 border rounded-2xl px-6 py-4 text-white focus:outline-none transition-all placeholder:text-silver/10 pr-14
            ${showStrength && value.length > 0 
                ? (hasMinLength && hasLetter && hasUppercase && hasNumber && hasSpecial ? 'border-green-500/50 focus:border-green-500' : 'border-white/10 focus:border-primary/50')
                : 'border-white/10 focus:border-primary/50'
            }
          `}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-6 flex items-center text-silver/30 hover:text-white transition-colors"
          tabIndex={-1}
        >
          <span className="material-symbols-outlined text-xl">
            {showPassword ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 p-4 bg-white/[0.02] border border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <PasswordRequirement met={hasMinLength} text="Mínimo 6 caracteres" />
          <PasswordRequirement met={hasUppercase} text="Mayúscula (A-Z)" />
          <PasswordRequirement met={hasNumber} text="Número (0-9)" />
          <PasswordRequirement met={hasSpecial} text="Símbolo (@$!%*#?&)" />
        </div>
      )}
    </div>
  );
}
