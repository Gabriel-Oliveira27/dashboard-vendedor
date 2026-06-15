import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; hint?: string; error?: string; }
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, hint, error, className, id, ...props }, ref) => (
  <div className="form-group">
    {label && <label htmlFor={id}>{label}</label>}
    <input ref={ref} id={id} className={`input-field ${error?"border-red":""} ${className||""}`} {...props} />
    {hint && !error && <span className="field-hint">{hint}</span>}
    {error && <span className="field-hint" style={{color:"var(--danger)"}}>{error}</span>}
  </div>
));
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; hint?: string; }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, hint, className, id, ...props }, ref) => (
  <div className="form-group">
    {label && <label htmlFor={id}>{label}</label>}
    <textarea ref={ref} id={id} className={`input-field ${className||""}`} {...props} />
    {hint && <span className="field-hint">{hint}</span>}
  </div>
));
Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; hint?: string; }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, hint, className, id, children, ...props }, ref) => (
  <div className="form-group">
    {label && <label htmlFor={id}>{label}</label>}
    <select ref={ref} id={id} className={`input-select ${className||""}`} {...props}>{children}</select>
    {hint && <span className="field-hint">{hint}</span>}
  </div>
));
Select.displayName = "Select";
