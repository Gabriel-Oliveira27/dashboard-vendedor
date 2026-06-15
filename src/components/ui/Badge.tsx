const VARIANTS: Record<string, string> = {
  green: "badge badge-green", red: "badge badge-red", yellow: "badge badge-yellow",
  blue: "badge badge-blue", orange: "badge badge-orange", purple: "badge badge-purple", gray: "badge badge-gray",
};
interface BadgeProps { variant?: keyof typeof VARIANTS; children: React.ReactNode; pulse?: boolean; className?: string; }
export function Badge({ variant = "gray", children, pulse, className }: BadgeProps) {
  return <span className={`${VARIANTS[variant] || "badge badge-gray"} ${pulse ? "pulse" : ""} ${className || ""}`}>{children}</span>;
}
