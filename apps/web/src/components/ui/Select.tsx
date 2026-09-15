import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: readonly SelectOption[] | SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  options = [],
  placeholder,
  className = '',
  id,
  children,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-[#0F172A] flex items-center justify-between">
          <span>{label}</span>
          {props.required && <span className="text-rose-500 text-xs">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full text-sm bg-white border rounded-[8px] px-3 py-2 text-[#0F172A] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-slate-50 disabled:text-slate-500 ${
          error ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20' : 'border-[#E2E8F0] hover:border-slate-300'
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {children}
      </select>
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
