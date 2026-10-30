import type { ReactNode } from 'react';
import { Search } from 'lucide-react';

export interface FilterDef { label: string; value: string; options: string[]; onChange: (v: string) => void }

interface Props { search: string; onSearch: (v: string) => void; placeholder?: string; filters?: FilterDef[]; children?: ReactNode }

export default function FilterBar({ search, onSearch, placeholder = 'Search…', filters = [], children }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full flex-[1_1_100%] sm:min-w-[220px] sm:max-w-sm sm:flex-[1_1_260px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
        <input className="form-input pl-9" placeholder={placeholder} aria-label={placeholder} value={search} onChange={e => onSearch(e.target.value)} />
      </div>
      {filters.map(f => (
        <select key={f.label} className="form-input min-w-0 flex-[1_1_145px] sm:w-auto sm:flex-none" aria-label={`Filter by ${f.label}`} value={f.value} onChange={e => f.onChange(e.target.value)}>
          <option value="All">All {f.label}</option>
          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ))}
      {children}
    </div>
  );
}
