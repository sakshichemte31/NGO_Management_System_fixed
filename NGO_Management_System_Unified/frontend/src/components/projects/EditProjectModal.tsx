import { useState } from 'react';
import Modal from './Modal';
import FormField, { SelectInput, TextInput } from './FormField';
import { useToast } from './Toast';
import { useManagers } from '../../hooks/useProjects';
import { updateProject } from '../../services/projectApi';
import { SECTORS } from '../../data/mockProjects';
import type { Project, ProjectStatus, StageNo } from '../../types/project';

const STATUSES: ProjectStatus[] = ['Active', 'Upcoming', 'On Hold', 'Completed', 'Archived'];

export default function EditProjectModal({ project, onClose, onSaved }: { project: Project | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const managers = useManagers().data ?? [];
  const [f, setF] = useState(() => project && ({ name: project.name, sector: project.sector, managerId: project.managerId, status: project.status, currentStage: project.currentStage, endDate: project.endDate, progress: project.progress }));
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  if (!project || !f) return null;
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF({ ...f, [k]: v });

  const save = async () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Project name is required';
    if (!f.endDate) e.endDate = 'End date is required';
    else if (f.endDate < project.startDate) e.endDate = 'End date cannot be before the start date';
    if (f.progress < 0 || f.progress > 100 || Number.isNaN(f.progress)) e.progress = 'Enter 0–100';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await updateProject(project.id, { ...f, name: f.name.trim(), currentStage: f.currentStage as StageNo });
      toast.success('Project updated');
      onSaved(); onClose();
    } catch (x) { toast.error(x instanceof Error ? x.message : 'Update failed'); } finally { setBusy(false); }
  };

  return (
    <Modal open title={`Edit ${project.code}`} onClose={onClose}
      footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Project name" required error={err.name} className="sm:col-span-2"><TextInput value={f.name} onChange={e => set('name', e.target.value)} invalid={!!err.name} /></FormField>
        <FormField label="Sector"><SelectInput value={f.sector} onChange={e => set('sector', e.target.value)}>{SECTORS.map(s => <option key={s}>{s}</option>)}</SelectInput></FormField>
        <FormField label="Project manager"><SelectInput value={f.managerId} onChange={e => set('managerId', e.target.value)}>{managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</SelectInput></FormField>
        <FormField label="Status"><SelectInput value={f.status} onChange={e => set('status', e.target.value as ProjectStatus)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</SelectInput></FormField>
        <FormField label="Current stage"><SelectInput value={f.currentStage} onChange={e => set('currentStage', Number(e.target.value) as StageNo)}>{[0, 1, 2, 3, 4, 5].map(s => <option key={s} value={s}>Stage {s}</option>)}</SelectInput></FormField>
        <FormField label="End date" required error={err.endDate}><TextInput type="date" value={f.endDate} onChange={e => set('endDate', e.target.value)} invalid={!!err.endDate} /></FormField>
        <FormField label="Overall progress (%)" error={err.progress}><TextInput type="number" min={0} max={100} value={f.progress} onChange={e => set('progress', Number(e.target.value))} invalid={!!err.progress} /></FormField>
      </div>
    </Modal>
  );
}
