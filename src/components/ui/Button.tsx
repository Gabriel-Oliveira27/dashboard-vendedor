import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-white shadow-[0_2px_8px_rgba(124,58,237,0.3)] " +
    "hover:bg-[var(--accent-hover)] hover:shadow-[0_4px_14px_rgba(124,58,237,0.4)] " +
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
  ghost:
    "bg-transparent text-[var(--text-muted)] border border-[var(--border)] " +
    "hover:bg-[var(--surface-hover)] hover:text-[var(--text)] hover:border-[var(--border-focus)] " +
    "disabled:opacity-50 disabled:cursor-not-allowed",
  danger:
    "bg-[var(--danger-soft)] text-[var(--danger)] border border-[rgba(239,68,68,0.25)] " +
    "hover:bg-[var(--danger)] hover:text-white " +
    "disabled:opacity-50 disabled:cursor-not-allowed",
  success:
    "bg-[var(--success-soft)] text-[var(--success)] border border-[rgba(16,185,129,0.25)] " +
    "hover:bg-[var(--success)] hover:text-white " +
    "disabled:opacity-50 disabled:cursor-not-allowed",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[0.8rem] gap-1.5",
  md: "h-[38px] px-4 text-[0.875rem] gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      fullWidth,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-[var(--radius-md)]",
          "transition-all duration-200 active:scale-[0.98] cursor-pointer select-none",
          "whitespace-nowrap",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              width="14"
              height="14"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="31.4 31.4"
                strokeLinecap="round"
              />
            </svg>
            Aguarde…
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
