import { useRef, useState } from 'react';
import { CheckCircle2, FileText, RotateCcw, Upload } from 'lucide-react';
import Section from '../../../../components/projects/Section';
import Async from '../../../../components/projects/Async';
import StatusBadge from '../../../../components/projects/StatusBadge';
import KpiCard from '../../../../components/projects/KpiCard';
import ProgressBar from '../../../../components/projects/ProgressBar';
import DataTable from '../../../../components/projects/DataTable';
import { SkeletonBlock } from '../../../../components/projects/Skeleton';
import { useToast } from '../../../../components/projects/Toast';
import { useRole } from '../../../../context/RoleContext';
import { useDocuments, useResources } from '../../../../hooks/useProjectData';
import { setDocumentStatus, uploadDocument } from '../../../../services/projectApi';
import { fmtDate, pct } from '../../../../lib/format';
import type { DocStatus, DocumentItem } from '../../../../types/project';
import type { TabProps } from '../tabTypes';

const CATS: DocumentItem['category'][] = ['Statutory', 'Project Related', 'Policy', 'Special Ask'];

export default function DocumentsTab({ project: p }: TabProps) {
  const toast = useToast();
  const { canEdit } = useRole();
  const docs = useDocuments(p.id);
  const res = useResources(p.id);
  const [filter, setFilter] = useState<'All' | DocStatus>('All');
  const target = useRef<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const run = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); toast.success(ok); await docs.reload(true); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); } };
  const pick = (id: string) => { target.current = id; input.current?.click(); };

  return (
    <div className="flex flex-col gap-5">
      <input ref={input} type="file" className="hidden" aria-hidden tabIndex={-1} onChange={e => { const f = e.target.files?.[0]; if (f && target.current) void run(() => uploadDocument(p.id, target.current!, f.name), `${f.name} uploaded`); e.target.value = ''; }} />
      <Async state={docs} skeleton={<SkeletonBlock h="h-80" />}>{list => {
        const c = (s: DocStatus) => list.filter(d => d.status === s).length;
        return (<>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total documents" value={list.length} color="#1AACB8" icon={<FileText size={18} />} />
            <KpiCard label="Verified" value={c('Verified')} color="#10B981" />
            <KpiCard label="Uploaded (awaiting verification)" value={c('Uploaded')} color="#6366F1" />
            <KpiCard label="Pending" value={c('Pending')} color="#F59E0B" />
          </div>
          <div className="flex gap-2 flex-wrap">{(['All', 'Pending', 'Uploaded', 'Verified'] as const).map(s => (
            <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${filter === s ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-600 border-slate-200'}`}>{s}</button>))}</div>
          {CATS.map(cat => {
            const all = list.filter(d => d.category === cat), rows = all.filter(d => filter === 'All' || d.status === filter);
            const ok = all.filter(d => d.status === 'Verified').length;
            return (
              <Section key={cat} title={`${cat} documents`} flush action={<div className="w-40"><ProgressBar value={pct(ok, all.length)} showLabel label={`${cat} verified`} /></div>}>
                <DataTable caption={cat} rows={rows} rowKey={d => d.id} emptyTitle="No documents in this filter"
                  columns={[
                    { key: 'n', header: 'Document', render: d => <span className="font-semibold text-slate-800">{d.name}</span> },
                    { key: 's', header: 'Status', render: d => <StatusBadge status={d.status} /> },
                    { key: 'f', header: 'File', render: d => d.fileName ? <span className="text-xs text-slate-500">{d.fileName}<div className="text-slate-400">{fmtDate(d.uploadedAt)} · {d.uploadedBy}</div></span> : <span className="text-slate-300">—</span> },
                    { key: 'a', header: 'Actions', render: d => canEdit ? (
                      <div className="flex gap-1.5 flex-wrap">
                        <button type="button" className="btn-secondary !py-1 !px-2.5 !text-xs" onClick={() => pick(d.id)} aria-label={`${d.fileName ? 'Replace' : 'Upload'} ${d.name}`}><Upload size={13} /> {d.fileName ? 'Replace' : 'Upload'}</button>
                        {d.status === 'Uploaded' && <button type="button" className="btn-secondary !py-1 !px-2.5 !text-xs" onClick={() => run(() => setDocumentStatus(p.id, d.id, 'Verified'), 'Document verified')} aria-label={`Verify ${d.name}`}><CheckCircle2 size={13} /> Verify</button>}
                        {d.status !== 'Pending' && <button type="button" className="btn-secondary !py-1 !px-2.5 !text-xs" onClick={() => run(() => setDocumentStatus(p.id, d.id, 'Pending'), 'Document reset')} aria-label={`Reset ${d.name}`}><RotateCcw size={13} /> Reset</button>}
                      </div>) : <span className="text-xs text-slate-300">View only</span> },
                  ]} />
              </Section>
            );
          })}
        </>);
      }}</Async>

      <Section title="Resources & Assets" flush>
        <Async state={res} skeleton={<SkeletonBlock />}>{list => (
          <DataTable caption="Resources" rows={list} rowKey={r => r.id} emptyTitle="No assets planned"
            columns={[{ key: 'n', header: 'Resource', render: r => <span className="font-semibold">{r.name}</span> }, { key: 'k', header: 'Type', render: r => <span className="badge badge-gray">{r.kind}</span> },
              { key: 'q', header: 'Qty', align: 'right', render: r => r.qty }, { key: 'l', header: 'Location', render: r => r.location }, { key: 'c', header: 'Custodian', render: r => r.custodian }]} />
        )}</Async>
      </Section>
    </div>
  );
}
