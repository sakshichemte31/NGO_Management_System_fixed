import type { StageNo } from '../types/project';

export const SDG_NAMES: Record<number, string> = {
  1: 'No Poverty', 2: 'Zero Hunger', 3: 'Good Health & Well-being', 4: 'Quality Education', 5: 'Gender Equality', 6: 'Clean Water & Sanitation',
  7: 'Affordable & Clean Energy', 8: 'Decent Work & Economic Growth', 9: 'Industry, Innovation & Infrastructure', 10: 'Reduced Inequalities',
  11: 'Sustainable Cities & Communities', 12: 'Responsible Consumption', 13: 'Climate Action', 14: 'Life Below Water', 15: 'Life on Land',
  16: 'Peace, Justice & Strong Institutions', 17: 'Partnerships for the Goals',
};
export const SECTOR_BADGE: Record<string, string> = {
  Education: 'badge-blue', Health: 'badge-red', Environment: 'badge-green', Livelihood: 'badge-yellow', Technology: 'badge-gray', 'Social Welfare': 'badge-purple',
};
export const STAGE_SHORT: Record<StageNo, string> = {
  0: 'Need assessment', 1: 'Planning & proposal', 2: 'Preparedness', 3: 'Execution & M&E', 4: 'Restructure', 5: 'Scale & replicate',
};
export const progressColor = (v: number): string => (v >= 75 ? '#10B981' : v >= 40 ? '#1AACB8' : '#F59E0B');
