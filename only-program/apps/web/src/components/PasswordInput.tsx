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
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[@$!%*#?&]/.test(value);

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-green-400' : 'text-silver/40'}`}>
      <span className="material-symbols-outlined text-sm">
        {met ? 'check_circle' : 'radio_button_unchecked'}
      </span>
      <span className={met ? 'line-through' : ''}>{text}</span>
    </div>
  );

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2" htmlFor={id}>
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
          className={`w-full bg-background-dark/50 border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 transition-all placeholder:text-silver/20 pr-12
            ${showStrength && value.length > 0 
                ? (hasMinLength && hasLetter && hasNumber && hasSpecial ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20' : 'border-border focus:border-primary focus:ring-primary/30')
                : 'border-border focus:border-primary focus:ring-primary/30'
            }
          `}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-4 flex items-center text-silver/50 hover:text-white transition-colors"
          tabIndex={-1}
        >
          <span className="material-symbols-outlined text-xl">
            {showPassword ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-surface/30 rounded-lg border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <PasswordRequirement met={hasMinLength} text="Mínimo 6 caracteres" />
          <PasswordRequirement met={hasLetter} text="Al menos una letra" />
          <PasswordRequirement met={hasNumber} text="Al menos un número" />
          <PasswordRequirement met={hasSpecial} text="Carácter especial (@$!%*#?&)" />
        </div>
      )}
    </div>
  );
}
