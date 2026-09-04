import { forwardRef, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
type Size = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-[var(--primary)] text-white hover:bg-amber-700 focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
  secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-slate-200",
  outline: "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--muted)]",
  ghost: "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]",
  danger: "bg-red-500 text-white hover:bg-red-600",
  accent: "bg-[var(--accent)] text-white hover:bg-teal-700",
};

const sizeClasses: Record<Size, string> = {
  xs: "text-xs px-2.5 py-1.5 rounded-md",
  sm: "text-sm px-3.5 py-2 rounded-lg",
  md: "text-sm px-5 py-2.5 rounded-xl",
  lg: "text-base px-6 py-3 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, icon, iconRight, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : icon}
        {children}
        {iconRight}
      </button>
    );
  }
);

Button.displayName = "Button";
