import { useState } from 'react';
import { Avatar, DataTable, SelectField, SectionTitle, ACCENT, type Column } from '../../../components/people';
import { DAYS, SKILLS, SLOTS, type Volunteer } from './data';
import { AvailabilityGrid } from './ListTab';

export default function SkillsTab({ volunteers, onToggle }: { volunteers: Volunteer[]; onToggle: (id: string, key: string) => void }) {
  const [skill, setSkill] = useState('Any skill'); const [day, setDay] = useState('Any day'); const [slot, setSlot] = useState('Any time'); const [selId, setSelId] = useState(volunteers[0]?.id ?? '');
  const sel = volunteers.find(v => v.id === selId);
  const matches = volunteers.filter(v => v.status === 'Active' && (skill === 'Any skill' || v.skills.includes(skill)) &&
    v.availability.some(a => (day === 'Any day' || a.startsWith(day)) && (slot === 'Any time' || a.endsWith(slot))));
  const cols: Column<Volunteer>[] = [
    { header: 'Volunteer', render: v => <div className="flex items-center gap-2"><Avatar name={v.name} color={ACCENT.volunteer} size={30} /><span className="font-semibold text-slate-800">{v.name}</span></div> },
    { header: 'Skills', render: v => <div className="flex flex-wrap gap-1">{v.skills.map(s => <span key={s} className={`badge ${s === skill ? 'badge-teal' : 'badge-gray'}`}>{s}</span>)}</div> },
    { header: 'Slots / week', render: v => v.availability.length },
  ];
  return (
    <div className="flex flex-col gap-5">
      <div className="card"><div className="card-header"><h2 className="card-title">Skill-based Selection</h2><span className="text-xs text-slate-400">{matches.length} available volunteer(s)</span></div>
        <div className="card-body flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SelectField label="Skill" value={skill} onChange={setSkill} options={['Any skill', ...SKILLS]} />
            <SelectField label="Day" value={day} onChange={setDay} options={['Any day', ...DAYS]} />
            <SelectField label="Time" value={slot} onChange={setSlot} options={['Any time', ...SLOTS]} />
          </div>
          <DataTable columns={cols} rows={matches} rowKey={v => v.id} onRowClick={v => setSelId(v.id)} emptyTitle="No volunteers match" emptyHint="Relax the skill, day or time filters." />
        </div></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card"><div className="card-header"><h2 className="card-title">Skills</h2></div>
          <div className="card-body flex flex-wrap gap-2">{SKILLS.map(s => { const n = volunteers.filter(v => v.skills.includes(s)).length; return <button key={s} onClick={() => setSkill(s)} className="badge badge-teal hover:opacity-80">{s} · {n}</button>; })}</div></div>
        <div className="card lg:col-span-2"><div className="card-header"><h2 className="card-title">Availability</h2><div className="w-48"><SelectField label="Choose volunteer" hideLabel value={selId} onChange={setSelId} options={volunteers.map(v => v.id)} /></div></div>
          <div className="card-body">{sel && <><SectionTitle>{sel.name} — click a cell to toggle</SectionTitle><AvailabilityGrid slots={sel.availability} onToggle={k => onToggle(sel.id, k)} /></>}</div></div>
      </div>
    </div>
  );
}
