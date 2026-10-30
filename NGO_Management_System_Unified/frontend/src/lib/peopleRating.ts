export const RATING_CRITERIA = [
  { key: 'quality', label: 'Work quality', weight: 0.35, description: 'Accuracy, care and standard of completed work.' },
  { key: 'delivery', label: 'Goal delivery', weight: 0.3, description: 'Progress against assigned goals, tasks or responsibilities.' },
  { key: 'reliability', label: 'Reliability', weight: 0.2, description: 'Consistency, preparation and attendance.' },
  { key: 'collaboration', label: 'Collaboration', weight: 0.15, description: 'Communication, teamwork and responsiveness to feedback.' },
] as const;

export type RatingCriterion = (typeof RATING_CRITERIA)[number]['key'];
export type RatingScores = Record<RatingCriterion, number>;

export interface RatingReview {
  date: string;
  rating: number;
  scores: RatingScores;
}

export function calculateRating(scores: RatingScores): number {
  const weightedScore = RATING_CRITERIA.reduce((total, criterion) => total + scores[criterion.key] * criterion.weight, 0);
  return Math.round((weightedScore + Number.EPSILON) * 10) / 10;
}