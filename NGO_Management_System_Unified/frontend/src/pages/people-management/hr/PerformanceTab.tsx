import { useState } from 'react';
import { Star } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DataTable, ACCENT, type Column } from '../../../components/people';
import RatingReviewForm from '../../../components/people/RatingReviewForm';
import { feedbackFor, ratingHistory, type Employee } from './data';
import { calculateRating, type RatingReview, type RatingScores } from '../../../lib/peopleRating';

export default function PerformanceTab({ employees, onRate }: { employees: Employee[]; onRate: (id: string, review: RatingReview) => void }) {
  const [selId, setSelId] = useState(employees[0]?.id);
  const sel = employees.find(e => e.id === selId) ?? employees[0];
  const cols: Column<Employee>[] = [
    { header: 'Employee', render: e => <span className="font-semibold text-slate-800">{e.name}</span> },
    { header: 'Department', render: e => e.dept },
    { header: 'Rating', render: e => <span className="inline-flex items-center gap-1 font-semibold"><Star size={13} className="text-amber-500" fill="#F59E0B" />{e.rating.toFixed(1)}</span> },
    { header: 'Feedback', render: e => <span className="text-xs text-slate-500">{feedbackFor(e)}</span> },
  ];
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="card overflow-hidden xl:col-span-2">
        <div className="card-header"><h2 className="card-title">Employee Performance</h2><span className="text-xs text-slate-400">Select a row to chart history</span></div>
        <DataTable columns={cols} rows={employees} rowKey={e => e.id} onRowClick={e => setSelId(e.id)} />
      </div>
      {sel && <div className="card">
        <div className="card-header"><h2 className="card-title">Performance History</h2></div>
        <div className="card-body">
          <p className="text-sm font-semibold text-slate-800">{sel.name}</p>
          <p className="text-xs text-slate-500 mb-3">{sel.role} · {feedbackFor(sel)}</p>
          <div style={{ height: 240 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={ratingHistory(sel)}><CartesianGrid strokeDasharray="3 3" stroke="#E8EEF4" /><XAxis dataKey="period" tick={{ fontSize: 10 }} /><YAxis domain={[2, 5]} tick={{ fontSize: 11 }} /><Tooltip /><Line dataKey="rating" name="Rating" stroke={ACCENT.hr} strokeWidth={2} dot /></LineChart></ResponsiveContainer></div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <RatingReviewForm key={sel.id} currentRating={sel.rating} latestReview={sel.ratingReviews?.at(-1)} onSubmit={(scores: RatingScores) => onRate(sel.id, { date: new Date().toLocaleDateString('en-GB'), rating: calculateRating(scores), scores })} />
          </div>
        </div>
      </div>}
    </div>
  );
}
