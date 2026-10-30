import { useState, type FormEvent } from 'react';
import { SelectField } from './FormFields';
import { calculateRating, RATING_CRITERIA, type RatingReview, type RatingScores } from '../../lib/peopleRating';

interface Props { currentRating: number; latestReview?: RatingReview; onSubmit: (scores: RatingScores) => void }

const initialScores: RatingScores = { quality: 3, delivery: 3, reliability: 3, collaboration: 3 };

export default function RatingReviewForm({ currentRating, latestReview, onSubmit }: Props) {
  const [scores, setScores] = useState<RatingScores>(() => latestReview?.scores ?? initialScores);
  const preview = calculateRating(scores);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(scores);
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-800">Rate performance</h3>
        <span className="text-xs text-slate-500">Current: {currentRating.toFixed(1)} / 5 · {latestReview ? `Reviewed ${latestReview.date}` : 'Demo baseline'}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {RATING_CRITERIA.map(criterion => (
          <SelectField
            key={criterion.key}
            label={`${criterion.label} (${Math.round(criterion.weight * 100)}%)`}
            value={String(scores[criterion.key])}
            onChange={value => setScores(current => ({ ...current, [criterion.key]: Number(value) }))}
            options={['1', '2', '3', '4', '5']}
          />
        ))}
      </div>
      <details className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <summary className="cursor-pointer font-semibold text-slate-700">Rating criteria</summary>
        <ul className="mt-2 flex flex-col gap-1.5">
          {RATING_CRITERIA.map(criterion => <li key={criterion.key}>{criterion.label}: {criterion.description}</li>)}
        </ul>
        <p className="mt-2">Each criterion is scored 1–5. The final rating is the weighted average, rounded to one decimal.</p>
      </details>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <span className="text-sm text-slate-600">Calculated rating <strong className="text-slate-900">{preview.toFixed(1)} / 5</strong></span>
        <button type="submit" className="btn-primary">Save Rating</button>
      </div>
    </form>
  );
}