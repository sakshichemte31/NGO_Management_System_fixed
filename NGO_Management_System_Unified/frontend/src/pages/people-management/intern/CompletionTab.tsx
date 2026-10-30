import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { DataTable, SelectField, StatusBadge, TextAreaField, ACCENT, type Column } from '../../../components/people';
import type { Intern } from './data';

interface Props { interns: Intern[]; onFinal: (id: string, text: string) => void; onCert: (id: string) => void }

export default function CompletionTab({ interns, onFinal, onCert }: Props) {
  const [id, setId] = useState(interns.find(i => i.status === 'Completed')?.id ?? interns[0]?.id ?? '');
  const [printAfterGeneration, setPrintAfterGeneration] = useState(false);
  const sel = interns.find(i => i.id === id);
  const [draft, setDraft] = useState(sel?.finalFeedback ?? '');
  const pick = (v: string) => { setId(v); setDraft(interns.find(i => i.id === v)?.finalFeedback ?? ''); };

  const printCertificate = (name: string, dept: string, start: string, end: string, issuedOn: string) => {
    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) return;
    const html = `<!doctype html><html><head><title>Certificate of Internship</title><style>@page{size:A4 landscape;margin:12mm} body{margin:0;background:linear-gradient(135deg,#f1f9fb,#f8fafc);font-family:Georgia,serif;color:#102a43}.certificate{max-width:920px;margin:18px auto;border:10px solid #c8a96b;border-radius:18px;background:linear-gradient(#fff,#fdf7ef);padding:24px;box-shadow:0 18px 40px rgba(15,23,42,.14)}.inner{border:3px solid rgba(200,169,107,.8);border-radius:12px;padding:30px 34px 22px;text-align:center;position:relative}.seal{position:absolute;top:18px;right:36px;width:68px;height:68px;border:3px solid rgba(26,172,184,.45);border-radius:50%;color:#1aacb8;font-size:11px;font-weight:700;display:grid;place-items:center}.tag{letter-spacing:3px;text-transform:uppercase;color:#64748b;font-size:12px;font-weight:700}.title{font-size:34px;font-weight:700;margin:10px 0 8px;color:#122033}.subtitle{font-size:15px;color:#475569}.name{font-size:30px;font-weight:700;margin:16px 0 10px;color:#102a43;border-bottom:2px solid rgba(26,172,184,.35);display:inline-block;padding:0 30px 8px}.body{font-size:15px;color:#475569;line-height:1.8;margin-top:10px}.footer{margin-top:28px;display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid rgba(15,23,42,.15);padding-top:14px}.sig{width:180px;text-align:center;font-size:12px;color:#475569}.line{border-top:2px solid rgba(15,23,42,.35);margin-bottom:8px;padding-top:8px;font-weight:700}.issue{font-size:12px;color:#475569;white-space:nowrap}</style></head><body><div class="certificate"><div class="inner"><div class="seal">HOPE</div><div class="tag">Hope Foundation</div><div class="title">Certificate of Internship</div><div class="subtitle">This is to certify that</div><div class="name">${name}</div><div class="body">completed an internship in <strong>${dept}</strong> from <strong>${start}</strong> to <strong>${end}</strong>.</div><div class="footer"><div class="sig"><div class="line">Director</div>Hope Foundation</div><div class="issue">Issued on ${issuedOn}</div></div></div></div></body></html>`;
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => {
      try { popup.print(); } catch (error) { /* noop */ }
    }, 400);
  };

  useEffect(() => {
    if (!printAfterGeneration || sel?.certificate !== 'Generated') return;
    const issuedOn = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    printCertificate(sel.name, sel.dept, sel.start, sel.end, issuedOn);
    setPrintAfterGeneration(false);
  }, [printAfterGeneration, sel]);

  const generateCertificate = () => {
    if (!sel || sel.status !== 'Completed') return;
    if (sel.certificate === 'Generated') {
      printCertificate(sel.name, sel.dept, sel.start, sel.end, new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
      return;
    }
    setPrintAfterGeneration(true);
    onCert(sel.id);
  };
  const cols: Column<Intern>[] = [
    { header: 'Intern', render: i => <span className="font-semibold text-slate-800">{i.name}</span> },
    { header: 'Completion', render: i => <StatusBadge status={i.status} /> },
    { header: 'Final feedback', render: i => i.finalFeedback ? 'Recorded' : <span className="text-slate-400">Pending</span> },
    { header: 'Certificate', render: i => <StatusBadge status={i.certificate} /> },
  ];
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <div className="card overflow-hidden"><div className="card-header"><h2 className="card-title">Completion Status</h2></div><DataTable columns={cols} rows={interns} rowKey={i => i.id} onRowClick={i => pick(i.id)} /></div>
      {sel && <div className="flex flex-col gap-5">
        <div className="card"><div className="card-header"><h2 className="card-title">Final Feedback</h2></div>
          <form className="card-body flex flex-col gap-3" onSubmit={e => { e.preventDefault(); onFinal(sel.id, draft.trim()); }}>
            <SelectField label="Intern" value={id} onChange={pick} options={interns.map(i => i.id)} />
            <TextAreaField label={`Final feedback for ${sel.name}`} value={draft} onChange={setDraft} />
            <button className="btn-secondary w-fit" type="submit">Save feedback</button>
          </form></div>
        <div className="card"><div className="card-header"><h2 className="card-title">Certificate</h2><StatusBadge status={sel.certificate} /></div>
          <div className="card-body flex flex-col gap-4">
            <div data-certificate className="rounded-[18px] border-[10px] border-[#c8a96b] bg-gradient-to-br from-white via-[#fffdf9] to-[#f5f4ef] p-6 text-center shadow-[0_18px_40px_rgba(15,23,42,0.12)]" aria-label="Certificate preview">
              <div className="relative rounded-[12px] border-[3px] border-[#d7bf8d] bg-white/80 px-7 py-8">
                <div className="absolute right-8 top-4 grid h-16 w-16 place-items-center rounded-full border-[3px] border-[#1AACB8]/50 text-[10px] font-bold tracking-[0.2em] text-[#1AACB8]">HOPE</div>
                <div className="text-[11px] tracking-[0.28rem] uppercase text-slate-500 font-bold">Hope Foundation</div>
                <div className="mt-3 text-3xl font-black text-slate-800" style={{ fontFamily: 'Georgia, serif' }}>Certificate of Internship</div>
                <p className="mt-4 text-xs uppercase tracking-[0.22rem] text-slate-500">This is to certify that</p>
                <div className="mt-4 inline-block border-b-[2px] border-[#1AACB8]/40 px-8 pb-2 text-3xl font-black text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>{sel.name}</div>
                <p className="mt-5 text-sm text-slate-600">completed an internship in <span className="font-semibold text-slate-800">{sel.dept}</span> from <span className="font-semibold text-slate-800">{sel.start}</span> to <span className="font-semibold text-slate-800">{sel.end}</span>.</p>
                <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-4 text-left">
                  <div className="w-40 text-center text-[11px] text-slate-500"><div className="border-t-2 border-slate-500 pt-2 font-bold text-slate-700">Director</div>Hope Foundation</div>
                  <div className="text-[11px] uppercase tracking-[0.18rem] text-slate-500">Issued {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
              {sel.certificate === 'Pending' && <div className="text-[11px] text-amber-600 mt-3 font-semibold">DRAFT PREVIEW</div>}
            </div>
            <button type="button" className="btn-primary w-fit disabled:opacity-50" disabled={sel.status !== 'Completed'} onClick={generateCertificate}>
              {sel.certificate === 'Generated' ? 'Print / save certificate' : 'Generate & print certificate'}</button>
            {sel.status !== 'Completed' && <p className="text-xs text-slate-500">Available once the internship is completed.</p>}
          </div></div>
      </div>}
    </div>
  );
}
