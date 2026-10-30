import { useState } from 'react';
import { Star } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Avatar, DataTable, EmptyState, ProgressBar, SelectField, TextAreaField, ACCENT, type Column } from '../../../components/people';
import RatingReviewForm from '../../../components/people/RatingReviewForm';
import type { Volunteer } from './data';
import { calculateRating, type RatingReview, type RatingScores } from '../../../lib/peopleRating';

export default function PerformanceTab({ volunteers, onFeedback, onRate }: { volunteers: Volunteer[]; onFeedback: (id: string, text: string) => void; onRate: (id: string, review: RatingReview) => void }) {
  const [selId, setSelId] = useState(volunteers[0]?.id ?? ''); const [text, setText] = useState('');
  const sel = volunteers.find(v => v.id === selId);
  const cols: Column<Volunteer>[] = [
    { header: 'Volunteer', render: v => <div className="flex items-center gap-2"><Avatar name={v.name} color={ACCENT.volunteer} size={30} /><span className="font-semibold text-slate-800">{v.name}</span></div> },
    { header: 'Task Completion', className: 'min-w-[160px]', render: v => <ProgressBar value={Math.round(v.tasksDone / v.tasksTotal * 100)} color={ACCENT.volunteer} /> },
    { header: 'Hours', render: v => v.hours },
    { header: 'Rating', render: v => <span className="inline-flex items-center gap-1 font-semibold"><Star size={13} fill="#F59E0B" className="text-amber-500" />{v.rating.toFixed(1)}</span> },
  ];
  const chart = volunteers.map(v => ({ name: v.name.split(' ')[0], hours: v.hours }));
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card overflow-hidden xl:col-span-2"><div className="card-header"><h2 className="card-title">Task Completion & Hours</h2></div><DataTable columns={cols} rows={volunteers} rowKey={v => v.id} onRowClick={v => setSelId(v.id)} /></div>
        <div className="card"><div className="card-header"><h2 className="card-title">Hours Contributed</h2></div><div className="card-body" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke="#E8EEF4" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="hours" fill="#1AACB8" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
      </div>
      <div className="card"><div className="card-header"><h2 className="card-title">Feedback & Performance History</h2></div>
        <div className="card-body grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form className="flex flex-col gap-3" onSubmit={e => { e.preventDefault(); if (text.trim()) { onFeedback(selId, text.trim()); setText(''); } }}>
            <SelectField label="Volunteer" value={selId} onChange={setSelId} options={volunteers.map(v => v.id)} />
            <TextAreaField label="Add feedback" value={text} onChange={setText} />
            <button className="btn-primary w-fit" type="submit">Save feedback</button></form>
          <div className="flex flex-col gap-2"><div className="text-xs font-semibold text-slate-500">{sel?.name}</div>
            {sel && sel.feedback.length ? sel.feedback.map((f, i) => <div key={i} className="p-2.5 rounded-lg bg-slate-50 text-sm text-slate-700">{f.text}<div className="text-[11px] text-slate-400 mt-1">{f.date}</div></div>) : <EmptyState title="No feedback yet" />}
            {sel && sel.history.map((h, i) => <div key={i} className="text-xs text-slate-500">• {h.date} — {h.event}</div>)}</div>
        </div></div>
      <div className="card">
        <div className="card-header"><h2 className="card-title">Rating Review</h2></div>
        <div className="card-body">{sel
          ? <RatingReviewForm key={sel.id} currentRating={sel.rating} latestReview={sel.ratingReviews?.at(-1)} onSubmit={(scores: RatingScores) => onRate(sel.id, { date: new Date().toLocaleDateString('en-GB'), rating: calculateRating(scores), scores })} />
          : <EmptyState title="No volunteers to rate" />}</div>
      </div>
    </div>
  );
}
