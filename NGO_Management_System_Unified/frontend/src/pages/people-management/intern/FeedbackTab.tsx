import { useState } from 'react';
import { CalendarCheck, Star } from 'lucide-react';
import { DataTable, ProgressBar, SelectField, TextAreaField, ACCENT, EmptyState, Modal, TextField, type Column } from '../../../components/people';
import RatingReviewForm from '../../../components/people/RatingReviewForm';
import type { Intern } from './data';
import { calculateRating, type RatingReview, type RatingScores } from '../../../lib/peopleRating';

export default function FeedbackTab({ interns, onFeedback, onRate, onMarkAttendance }: { interns: Intern[]; onFeedback: (id: string, text: string) => void; onRate: (id: string, review: RatingReview) => void; onMarkAttendance: (id: string, entry: { date: string; status: 'Present' | 'Late' | 'Absent'; note?: string }) => void }) {
  const [id, setId] = useState(interns[0]?.id ?? ''); const [text, setText] = useState('');
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceStatus, setAttendanceStatus] = useState<'Present' | 'Late' | 'Absent'>('Present');
  const [attendanceNote, setAttendanceNote] = useState('');
  const sel = interns.find(i => i.id === id);
  const attendanceHistory = sel?.attendanceHistory ?? [];
  const cols: Column<Intern>[] = [
    { header: 'Intern', render: i => <span className="font-semibold text-slate-800">{i.name}</span> },
    { header: 'Attendance', className: 'min-w-[150px]', render: i => <ProgressBar value={i.attendance} color={i.attendance >= 90 ? '#10B981' : '#F59E0B'} /> },
    { header: 'Progress', className: 'min-w-[150px]', render: i => <ProgressBar value={i.progress} color={ACCENT.intern} /> },
    { header: 'Performance', render: i => <span className="inline-flex items-center gap-1 font-semibold"><Star size={13} fill="#F59E0B" className="text-amber-500" />{i.rating.toFixed(1)}</span> },
  ];
  const submit = () => { if (!text.trim() || !sel) return; onFeedback(sel.id, text.trim()); setText(''); };
  const submitAttendance = () => { if (!sel) return; onMarkAttendance(sel.id, { date: attendanceDate, status: attendanceStatus, note: attendanceNote.trim() || undefined }); setAttendanceOpen(false); setAttendanceNote(''); };
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="card overflow-hidden xl:col-span-2"><div className="card-header"><div className="flex items-center justify-between w-full"><h2 className="card-title">Attendance, Progress & Performance</h2><button type="button" className="btn-primary text-xs py-1.5" onClick={() => setAttendanceOpen(true)}><CalendarCheck size={14} /> Mark Attendance</button></div></div><DataTable columns={cols} rows={interns} rowKey={i => i.id} />
        {sel && <div className="border-t border-slate-100 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18rem] text-slate-500">Attendance History</div>
          <div className="space-y-2">
            {(attendanceHistory.length ? [...attendanceHistory].sort((a, b) => b.date.localeCompare(a.date)) : [{ date: 'No entries yet', status: 'Absent' as const, note: 'No attendance recorded yet.' }]).map((entry, index) => (
              <div key={`${entry.date}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <div>
                  <div className="font-medium text-slate-700">{entry.date}</div>
                  <div className="text-[11px] text-slate-500">{entry.note || 'No notes'}</div>
                </div>
                <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${entry.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : entry.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        </div>}
      </div>
      <div className="card"><div className="card-header"><h2 className="card-title">Mentor Feedback</h2></div>
        <form className="card-body flex flex-col gap-3" onSubmit={e => { e.preventDefault(); submit(); }}>
          <SelectField label="Intern" value={id} onChange={setId} options={interns.map(i => i.id)} />
          <TextAreaField label="Add feedback" value={text} onChange={setText} />
          <button className="btn-primary w-fit" type="submit">Save feedback</button>
          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
            <div className="text-xs font-semibold text-slate-500">{sel?.name}</div>
            {sel && sel.feedback.length ? sel.feedback.map((f, i) => <div key={i} className="p-2.5 rounded-lg bg-slate-50 text-sm text-slate-700">{f.text}<div className="text-[11px] text-slate-400 mt-1">{f.date}</div></div>) : <EmptyState title="No feedback yet" />}
          </div>
        </form></div>
      <div className="card card-body">
        {sel && <RatingReviewForm key={sel.id} currentRating={sel.rating} latestReview={sel.ratingReviews?.at(-1)} onSubmit={(scores: RatingScores) => onRate(sel.id, { date: new Date().toLocaleDateString('en-GB'), rating: calculateRating(scores), scores })} />}
      </div>
      <Modal open={attendanceOpen} onClose={() => setAttendanceOpen(false)} title="Mark Attendance" submitLabel="Save Attendance" onSubmit={submitAttendance}>
        <SelectField label="Intern" value={id} onChange={setId} options={interns.map(i => i.id)} wide />
        <TextField label="Date" type="date" value={attendanceDate} onChange={setAttendanceDate} required />
        <SelectField label="Status" value={attendanceStatus} onChange={value => setAttendanceStatus(value as 'Present' | 'Late' | 'Absent')} options={['Present', 'Late', 'Absent']} />
        <TextAreaField label="Note" value={attendanceNote} onChange={setAttendanceNote} />
      </Modal>
    </div>
  );
}
