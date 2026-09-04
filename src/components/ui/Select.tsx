import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "_");
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={selectId} className="text-sm font-medium text-[var(--foreground)]">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`w-full appearance-none border rounded-xl px-3.5 py-2.5 pr-9 bg-white text-sm text-[var(--foreground)] transition-colors ${error ? "border-red-400" : "border-[var(--border)] focus:border-[var(--primary)]"} outline-none cursor-pointer ${className}`}
            {...props}
          >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
