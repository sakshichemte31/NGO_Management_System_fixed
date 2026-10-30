import { cloneElement, useId, type InputHTMLAttributes, type ReactElement, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface Props { label: string; error?: string; required?: boolean; hint?: string; children: ReactElement<Record<string, unknown>>; className?: string }

/** Label + control + inline error. Injects id / aria attributes into its single child control. */
export default function FormField({ label, error, required, hint, children, className = '' }: Props) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="form-label">{label}{required && <span className="text-red-500"> *</span>}</label>
      {cloneElement(children, { id, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-err` : undefined })}
      {hint && !error && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

const errStyle = (e?: boolean) => (e ? { borderColor: '#EF4444' } : undefined);
export const TextInput = ({ invalid, ...p }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) => <input className="form-input" style={errStyle(invalid)} {...p} />;
export const SelectInput = ({ invalid, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) => <select className="form-input" style={errStyle(invalid)} {...p}>{children}</select>;
export const TextArea = ({ invalid, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) => <textarea className="form-input" rows={3} style={errStyle(invalid)} {...p} />;
