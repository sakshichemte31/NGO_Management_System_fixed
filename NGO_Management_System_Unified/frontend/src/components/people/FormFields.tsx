import { useId } from 'react';

interface Base { hideLabel?: boolean; label: string; value: string; onChange: (v: string) => void; required?: boolean; wide?: boolean }

export function TextField({ label, value, onChange, required, wide, type = 'text', placeholder }: Base & { type?: string; placeholder?: string }) {
  const id = useId();
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label className="form-label" htmlFor={id}>{label}{required && ' *'}</label>
      <input id={id} className="form-input" type={type} required={required} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

export function SelectField({ label, value, onChange, options, required, wide, hideLabel }: Base & { options: string[] }) {
  const id = useId();
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label className={hideLabel ? 'sr-only' : 'form-label'} htmlFor={id}>{label}{required && ' *'}</label>
      <select id={id} className="form-input" required={required} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function TextAreaField({ label, value, onChange, required, wide = true }: Base) {
  const id = useId();
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label className="form-label" htmlFor={id}>{label}{required && ' *'}</label>
      <textarea id={id} className="form-input min-h-[80px]" required={required} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
