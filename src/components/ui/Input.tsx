import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-[0.78rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "h-[38px] bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)]",
            "px-3 text-[0.875rem] text-[var(--text)] font-[inherit]",
            "transition-all duration-200 w-full",
            "placeholder:text-[var(--text-dim)]",
            "focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]",
            "disabled:opacity-55 disabled:cursor-not-allowed",
            "read-only:opacity-70 read-only:cursor-default",
            error && "border-[var(--danger)] focus:shadow-[0_0_0_3px_var(--danger-soft)]",
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-[0.78rem] text-[var(--text-dim)]">{hint}</p>
        )}
        {error && (
          <p className="text-[0.78rem] text-[var(--danger)]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-[0.78rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)]",
            "px-3 py-2 text-[0.875rem] text-[var(--text)] font-[inherit]",
            "transition-all duration-200 w-full resize-vertical min-h-[100px]",
            "placeholder:text-[var(--text-dim)]",
            "focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]",
            className
          )}
          {...props}
        />
        {hint && (
          <p className="text-[0.78rem] text-[var(--text-dim)]">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, className, id, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-[0.78rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            "h-[38px] bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)]",
            "px-3 pr-8 text-[0.875rem] text-[var(--text)] font-[inherit]",
            "transition-all duration-200 w-full appearance-none cursor-pointer",
            "focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]",
            "bg-[image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b6b88' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_10px_center]",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {hint && (
          <p className="text-[0.78rem] text-[var(--text-dim)]">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
