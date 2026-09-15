import React, { useState } from 'react';
import { LucideIcon, Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon: Icon,
  type = 'text',
  showPasswordToggle = true,
  className = '',
  id,
  ...props
}, ref) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const isPassword = type === 'password';
  const shouldRenderToggle = isPassword && showPasswordToggle;
  const effectiveType = isPassword ? (isPasswordVisible ? 'text' : 'password') : type;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[#0F172A] flex items-center justify-between">
          <span>{label}</span>
          {props.required && <span className="text-rose-500 text-xs">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          className={`w-full text-sm bg-white border rounded-[8px] px-3 py-2 text-[#0F172A] placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
            Icon ? 'pl-9' : ''
          } ${
            shouldRenderToggle ? 'pr-10' : ''
          } ${
            error
              ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
              : 'border-[#E2E8F0] hover:border-slate-300'
          } ${className}`}
          {...props}
        />
        {shouldRenderToggle && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md transition-colors cursor-pointer flex items-center justify-center"
            tabIndex={-1}
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            {isPasswordVisible ? (
              <EyeOff className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            ) : (
              <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
