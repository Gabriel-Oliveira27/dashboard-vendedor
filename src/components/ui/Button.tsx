import { forwardRef } from "react";
type Variant = "primary"|"ghost"|"danger"|"success";
type Size = "sm"|"md";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: Size; loading?: boolean; fullWidth?: boolean; }
const varMap: Record<Variant, string> = { primary: "btn btn-primary", ghost: "btn btn-ghost", danger: "btn btn-danger", success: "btn btn-success" };
const sizeMap: Record<Size, string> = { sm: "btn-sm", md: "" };
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ variant="primary", size="md", loading, fullWidth, className, children, disabled, ...props }, ref) => (
  <button ref={ref} disabled={disabled||loading} className={`${varMap[variant]} ${sizeMap[size]} ${fullWidth?"btn-full":""} ${className||""}`} {...props}>
    {loading ? (<><svg className="spin-icon" viewBox="0 0 24 24" fill="none" width="14" height="14" style={{animation:"spin .8s linear infinite"}}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>Aguarde…</>) : children}
  </button>
));
Button.displayName = "Button";
