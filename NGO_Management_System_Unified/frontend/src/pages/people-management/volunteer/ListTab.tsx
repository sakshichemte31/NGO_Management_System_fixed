import { useState } from 'react';
import { Avatar, DataTable, DetailDrawer, FilterBar, InfoGrid, SectionTitle, StatusBadge, SubTabs, ACCENT, type Column } from '../../../components/people';
import { DAYS, SKILLS, SLOTS, type Volunteer } from './data';

const SUB = ['Personal Details', 'Contact Details', 'Skills', 'Availability', 'Volunteer History'];

export function AvailabilityGrid({ slots, onToggle }: { slots: string[]; onToggle?: (key: string) => void }) {
  return (
    <div className="overflow-x-auto"><table className="text-xs border-separate border-spacing-1" aria-label="Availability grid">
      <thead><tr><th />{DAYS.map(d => <th key={d} className="font-semibold text-slate-500 px-2">{d}</th>)}</tr></thead>
      <tbody>{SLOTS.map(s => (<tr key={s}><th className="text-left font-semibold text-slate-500 pr-2">{s}</th>
        {DAYS.map(d => { const k = `${d}-${s}`; const on = slots.includes(k); return (
          <td key={k}><button type="button" disabled={!onToggle} aria-pressed={on} aria-label={`${d} ${s}`} onClick={() => onToggle?.(k)}
            className={`w-9 h-8 rounded-md transition-colors ${on ? 'bg-rose-500/80 hover:bg-rose-500' : 'bg-slate-100 hover:bg-slate-200'} ${onToggle ? '' : 'cursor-default'}`} /></td>); })}</tr>))}</tbody>
    </table></div>
  );
}

export default function ListTab({ volunteers }: { volunteers: Volunteer[] }) {
  const [search, setSearch] = useState(''); const [skill, setSkill] = useState('All'); const [status, setStatus] = useState('All');
  const [selId, setSelId] = useState<string | null>(null); const [sub, setSub] = useState(SUB[0]);
  const sel = volunteers.find(v => v.id === selId) ?? null;
  const rows = volunteers.filter(v => (v.name + v.city + v.email).toLowerCase().includes(search.toLowerCase()) && (skill === 'All' || v.skills.includes(skill)) && (status === 'All' || v.status === status));
  const cols: Column<Volunteer>[] = [
    { header: 'Volunteer', render: v => <div className="flex items-center gap-3"><Avatar name={v.name} color={ACCENT.volunteer} /><div><div className="font-semibold text-slate-800">{v.name}</div><div className="text-[11px] text-slate-400">{v.id}</div></div></div> },
    { header: 'City', render: v => v.city },
    { header: 'Skills', render: v => <span className="text-xs text-slate-500">{v.skills.join(', ')}</span> },
    { header: 'Hours', render: v => v.hours },
    { header: 'Status', render: v => <StatusBadge status={v.status} /> },
  ];
  return (
    <div className="flex flex-col gap-4">
      <FilterBar search={search} onSearch={setSearch} placeholder="Search volunteers…" filters={[
        { label: 'Skills', value: skill, options: SKILLS, onChange: setSkill }, { label: 'Statuses', value: status, options: ['Active', 'Inactive'], onChange: setStatus }]} />
      <div className="card overflow-hidden"><div className="card-header"><h2 className="card-title">All Volunteers ({rows.length})</h2></div>
        <DataTable columns={cols} rows={rows} rowKey={v => v.id} onRowClick={v => { setSelId(v.id); setSub(SUB[0]); }} emptyTitle="No volunteers found" /></div>
      <DetailDrawer open={!!sel} onClose={() => setSelId(null)} title={sel?.name ?? ''} subtitle={sel ? `${sel.id} · joined ${sel.joined}` : ''} accent={ACCENT.volunteer}>
        {sel && (<>
          <SubTabs tabs={SUB} active={sub} onChange={setSub} accent={ACCENT.volunteer} />
          {sub === 'Personal Details' && <InfoGrid items={[['Name', sel.name], ['Age', sel.age], ['City', sel.city], ['Status', <StatusBadge key="s" status={sel.status} />], ['Hours contributed', sel.hours], ['Rating', sel.rating.toFixed(1)]]} />}
          {sub === 'Contact Details' && <InfoGrid items={[['Email', sel.email], ['Phone', sel.phone], ['City', sel.city]]} />}
          {sub === 'Skills' && <div className="flex flex-wrap gap-2">{sel.skills.map(s => <span key={s} className="badge badge-teal">{s}</span>)}</div>}
          {sub === 'Availability' && <AvailabilityGrid slots={sel.availability} />}
          {sub === 'Volunteer History' && (<><SectionTitle>Timeline</SectionTitle><ol className="border-l-2 border-slate-200 pl-4 flex flex-col gap-4">{sel.history.map((h, i) => <li key={i}><div className="text-sm text-slate-800">{h.event}</div><div className="text-xs text-slate-400">{h.date}</div></li>)}</ol></>)}
        </>)}
      </DetailDrawer>
    </div>
  );
}
