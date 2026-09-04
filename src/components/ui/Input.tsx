import { forwardRef, InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "_");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--foreground)]">
            {label}
          </label>
        )}
        <div className={`flex items-center gap-2 border rounded-xl px-3.5 py-2.5 bg-white transition-colors ${error ? "border-red-400" : "border-[var(--border)] focus-within:border-[var(--primary)]"}`}>
          {prefix && <span className="text-[var(--muted-foreground)] shrink-0">{prefix}</span>}
          <input
            ref={ref}
            id={inputId}
            className={`flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none min-w-0 ${className}`}
            {...props}
          />
          {suffix && <span className="text-[var(--muted-foreground)] shrink-0">{suffix}</span>}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
