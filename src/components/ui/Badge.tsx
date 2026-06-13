import { cn } from "@/lib/utils";

type BadgeVariant =
  | "green"
  | "red"
  | "yellow"
  | "blue"
  | "orange"
  | "purple"
  | "gray";

const variants: Record<BadgeVariant, string> = {
  green:  "bg-[var(--success-soft)] text-[var(--success)]",
  red:    "bg-[var(--danger-soft)]  text-[var(--danger)]",
  yellow: "bg-[var(--warning-soft)] text-[var(--warning)]",
  blue:   "bg-[var(--info-soft)]    text-[var(--info)]",
  orange: "bg-[var(--orange-soft)]  text-[var(--orange)]",
  purple: "bg-[var(--purple-soft)]  text-[var(--accent)]",
  gray:   "bg-[rgba(100,100,120,0.15)] text-[var(--text-muted)]",
};

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
  pulse?: boolean;
}

export function Badge({
  variant = "gray",
  className,
  children,
  pulse,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.72rem] font-bold tracking-wide whitespace-nowrap",
        variants[variant],
        pulse && "pulse",
        className
      )}
    >
      {children}
    </span>
  );
}
