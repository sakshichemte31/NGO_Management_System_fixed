import { useEffect, useState } from 'react';
import { Award, Medal } from 'lucide-react';
import { DataTable, SelectField, StatusBadge, TextField, ACCENT, type Column } from '../../../components/people';
import type { Recognition, Volunteer } from './data';

interface Props { volunteers: Volunteer[]; items: Recognition[]; onAdd: (kind: Recognition['kind'], volunteerId: string, title: string) => Recognition }

export default function CertificatesTab({ volunteers, items, onAdd }: Props) {
  const [id, setId] = useState(volunteers[0]?.id ?? ''); const [title, setTitle] = useState(''); const [kind, setKind] = useState<Recognition['kind']>('Certificate');
  const [printItemId, setPrintItemId] = useState<string | null>(null);
  const name = (v: string) => volunteers.find(x => x.id === v)?.name ?? v;
  const sel = volunteers.find(v => v.id === id);
  const printItem = items.find(item => item.id === printItemId);

  const printCertificate = (recipientName: string, recipientHours: number, finalTitle: string, issueDate: string) => {
    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) return;
    const html = `<!doctype html><html><head><title>${finalTitle}</title><style>@page{size:A4 landscape;margin:12mm} body{margin:0;background:linear-gradient(135deg,#f1f9fb,#f8fafc);font-family:Georgia,serif;color:#102a43}.certificate{max-width:920px;margin:18px auto;border:10px solid #c8a96b;border-radius:18px;background:linear-gradient(#fff,#fdf7ef);padding:24px;box-shadow:0 18px 40px rgba(15,23,42,.14)}.inner{border:3px solid rgba(200,169,107,.8);border-radius:12px;padding:30px 34px 22px;text-align:center;position:relative}.seal{position:absolute;top:18px;right:36px;width:68px;height:68px;border:3px solid rgba(26,172,184,.45);border-radius:50%;color:#1aacb8;font-size:11px;font-weight:700;display:grid;place-items:center}.tag{letter-spacing:3px;text-transform:uppercase;color:#64748b;font-size:12px;font-weight:700}.title{font-size:30px;font-weight:700;margin:10px 0 8px;color:#122033}.subtitle{font-size:15px;color:#475569}.name{font-size:30px;font-weight:700;margin:16px 0 10px;color:#102a43;border-bottom:2px solid rgba(26,172,184,.35);display:inline-block;padding:0 30px 8px}.body{font-size:15px;color:#475569;line-height:1.8;margin-top:10px}.footer{margin-top:28px;display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid rgba(15,23,42,.15);padding-top:14px}.sig{width:180px;text-align:center;font-size:12px;color:#475569}.line{border-top:2px solid rgba(15,23,42,.35);margin-bottom:8px;padding-top:8px;font-weight:700}.issue{font-size:12px;color:#475569;white-space:nowrap}</style></head><body><div class="certificate"><div class="inner"><div class="seal">HOPE</div><div class="tag">Hope Foundation</div><div class="title">${finalTitle}</div><div class="subtitle">This certificate is awarded to</div><div class="name">${recipientName}</div><div class="body">for <strong>${recipientHours}</strong> hours of dedicated service.</div><div class="footer"><div class="sig"><div class="line">Director</div>Hope Foundation</div><div class="issue">Issued on ${issueDate}</div></div></div></div></body></html>`;
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => {
      try { popup.print(); } catch (error) { /* noop */ }
    }, 400);
  };

  useEffect(() => {
    if (!printItem) return;
    const issueDate = printItem.date;
    const volunteer = volunteers.find(v => v.id === printItem.volunteerId);
    if (!volunteer) return;
    printCertificate(volunteer.name, volunteer.hours, printItem.title, issueDate);
    setPrintItemId(null);
  }, [printItem, volunteers]);
  const cols: Column<Recognition>[] = [
    { header: 'Volunteer', render: r => <span className="font-semibold text-slate-800">{name(r.volunteerId)}</span> }, { header: 'Title', render: r => r.title },
    { header: 'Type', render: r => <StatusBadge status={r.kind === 'Certificate' ? 'Issued' : 'Awarded'} /> }, { header: 'Kind', render: r => r.kind }, { header: 'Date', render: r => <span className="text-xs">{r.date}</span> },
  ];
  const sub = (k: Recognition['kind'][]) => items.filter(i => k.includes(i.kind));
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <form className="card" onSubmit={e => {
          e.preventDefault();
          if (!sel) return;
          const finalTitle = title.trim() || (kind === 'Certificate' ? 'Certificate of Appreciation' : `${kind} of Appreciation`);
          setTitle(finalTitle);
          const created = onAdd(kind, id, finalTitle);
          setPrintItemId(created.id);
        }}>
          <div className="card-header"><h2 className="card-title">Generate Certificate / Recognition</h2></div>
          <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Volunteer" value={id} onChange={setId} options={volunteers.map(v => v.id)} />
            <SelectField label="Type" value={kind} onChange={v => setKind(v as Recognition['kind'])} options={['Certificate', 'Award', 'Recognition']} />
            <TextField label="Title" value={title} onChange={setTitle} wide placeholder="e.g. 100 Hours Milestone" />
            <button className="btn-primary w-fit" type="submit" disabled={!sel}>Generate & print</button></div></form>
        <div className="card"><div className="card-header"><h2 className="card-title">Preview</h2></div>
          <div className="card-body"><div data-certificate className="rounded-[18px] border-[10px] border-[#c8a96b] bg-gradient-to-br from-white via-[#fffdf9] to-[#f5f4ef] p-6 text-center shadow-[0_18px_40px_rgba(15,23,42,0.12)]" aria-label="Certificate preview">
            <div className="relative rounded-[12px] border-[3px] border-[#d7bf8d] bg-white/80 px-7 py-8">
              <div className="absolute right-8 top-4 grid h-16 w-16 place-items-center rounded-full border-[3px] border-[#1AACB8]/50 text-[10px] font-bold tracking-[0.2em] text-[#1AACB8]">HOPE</div>
              <div className="text-[11px] tracking-[0.28rem] uppercase text-slate-500 font-bold">Hope Foundation</div>
              <div className="mt-3 text-3xl font-black text-slate-800" style={{ fontFamily: 'Georgia, serif' }}>{title.trim() || `${kind} of Appreciation`}</div>
              <p className="mt-4 text-xs uppercase tracking-[0.22rem] text-slate-500">This certificate is awarded to</p>
              <div className="mt-4 inline-block border-b-[2px] border-[#1AACB8]/40 px-8 pb-2 text-3xl font-black text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>{sel?.name}</div>
              <p className="mt-5 text-sm text-slate-600">for <span className="font-semibold text-slate-800">{sel?.hours}</span> hours of dedicated service.</p>
              <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-4 text-left">
                <div className="w-40 text-center text-[11px] text-slate-500"><div className="border-t-2 border-slate-500 pt-2 font-bold text-slate-700">Director</div>Hope Foundation</div>
                <div className="text-[11px] uppercase tracking-[0.18rem] text-slate-500">Issued {printItem?.date ?? new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
          </div></div></div>
      </div>
      <div className="card overflow-hidden"><div className="card-header"><h2 className="card-title">Certificate History</h2></div><DataTable columns={cols} rows={sub(['Certificate'])} rowKey={r => r.id} emptyTitle="No certificates yet" /></div>
      <div className="card overflow-hidden"><div className="card-header"><h2 className="card-title flex items-center gap-2"><Medal size={16} /> Awards & Recognition</h2></div><DataTable columns={cols} rows={sub(['Award', 'Recognition'])} rowKey={r => r.id} emptyTitle="No awards yet" /></div>
    </div>
  );
}
