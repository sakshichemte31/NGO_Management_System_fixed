import type { RatingReview } from '../../../lib/peopleRating';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const SLOTS = ['Morning', 'Afternoon', 'Evening'];
export const SKILLS = ['Teaching', 'First Aid', 'Photography', 'Event Management', 'Fundraising', 'Counselling', 'Driving', 'Data Entry', 'Marathi', 'Cooking'];
export const APP_STATUSES = ['New', 'Under Review', 'Approved', 'Rejected'] as const;
export type AppStatus = typeof APP_STATUSES[number];

export interface Volunteer {
  id: string; name: string; email: string; phone: string; city: string; age: number; status: 'Active' | 'Inactive'; joined: string;
  skills: string[]; availability: string[]; hours: number; tasksDone: number; tasksTotal: number; rating: number;
  feedback: { date: string; text: string }[]; history: { date: string; event: string }[]; ratingReviews?: RatingReview[];
}
export interface VApplication { id: string; name: string; email: string; skills: string[]; motivation: string; appliedOn: string; status: AppStatus }
export interface Assignment { id: string; volunteerId: string; kind: 'Project' | 'Event'; target: string; role: string; date: string; status: 'Upcoming' | 'Ongoing' | 'Completed'; responsibilities: string }
export interface AttendanceRec { id: string; volunteerId: string; date: string; kind: 'Event' | 'Project'; target: string; status: 'Present' | 'Absent' | 'Late'; hours: number }
export interface Recognition { id: string; volunteerId: string; title: string; kind: 'Certificate' | 'Award' | 'Recognition'; date: string }

const av = (...p: string[]) => p;
const v = (n: number, name: string, city: string, skills: string[], availability: string[], hours: number, done: number, total: number, rating: number, status: Volunteer['status'] = 'Active'): Volunteer => ({
  id: `VOL-${String(n).padStart(3, '0')}`, name, email: `${name.split(' ')[0].toLowerCase()}@mail.com`, phone: `+91 96${String(30000000 + n * 77311).slice(0, 8)}`, city, age: 20 + n * 3, status,
  joined: `${n + 4} Jan 202${n % 2 ? 4 : 5}`, skills, availability, hours, tasksDone: done, tasksTotal: total, rating,
  feedback: [{ date: '10 Sep 2025', text: 'Dependable and enthusiastic on the ground.' }], history: [{ date: `${n + 4} Jan`, event: 'Joined as volunteer' }, { date: '12 Jun 2025', event: 'Supported Health Camp' }],
});

export const initialVolunteers: Volunteer[] = [
  v(1, 'Sahil Gupta', 'Pune', av('Teaching', 'Marathi'), av('Sat-Morning', 'Sat-Afternoon', 'Sun-Morning'), 86, 14, 15, 4.7),
  v(2, 'Ritu Sharma', 'Pune', av('First Aid', 'Counselling'), av('Mon-Evening', 'Wed-Evening', 'Sat-Morning'), 120, 20, 22, 4.9),
  v(3, 'Omkar Patil', 'Pimpri', av('Photography', 'Event Management'), av('Fri-Evening', 'Sat-Afternoon', 'Sun-Afternoon'), 64, 9, 12, 4.2),
  v(4, 'Fatima Sheikh', 'Pune', av('Fundraising', 'Event Management'), av('Tue-Morning', 'Thu-Morning', 'Sat-Morning'), 98, 16, 18, 4.5),
  v(5, 'Varun Nair', 'Hadapsar', av('Driving', 'Data Entry'), av('Sun-Morning', 'Sun-Afternoon'), 40, 6, 10, 3.8),
  v(6, 'Lata Bhosale', 'Kothrud', av('Cooking', 'Marathi', 'Teaching'), av('Mon-Morning', 'Fri-Morning', 'Sun-Morning'), 72, 11, 13, 4.3),
  v(7, 'Danish Khan', 'Pune', av('Data Entry', 'Photography'), av('Wed-Evening'), 18, 3, 8, 3.4, 'Inactive'),
];

export const initialApplications: VApplication[] = [
  { id: 'VA-001', name: 'Anjali Rao', email: 'anjali@mail.com', skills: ['Teaching', 'Counselling'], motivation: 'Want to support after-school classes.', appliedOn: '5 Oct 2025', status: 'New' },
  { id: 'VA-002', name: 'Tejas Kale', email: 'tejas@mail.com', skills: ['Driving'], motivation: 'Can help with camp transport on weekends.', appliedOn: '3 Oct 2025', status: 'New' },
  { id: 'VA-003', name: 'Mira Fernandes', email: 'mira@mail.com', skills: ['First Aid'], motivation: 'Nurse, keen on health camps.', appliedOn: '28 Sep 2025', status: 'Under Review' },
  { id: 'VA-004', name: 'Harsh Vora', email: 'harsh@mail.com', skills: ['Photography'], motivation: 'Document events for the foundation.', appliedOn: '20 Sep 2025', status: 'Approved' },
  { id: 'VA-005', name: 'Neel Chopra', email: 'neel@mail.com', skills: ['Fundraising'], motivation: 'Not available for regular shifts.', appliedOn: '15 Sep 2025', status: 'Rejected' },
];

export const initialAssignments: Assignment[] = [
  { id: 'AS-001', volunteerId: 'VOL-002', kind: 'Event', target: 'Health Camp – Hadapsar', role: 'First Aid Lead', date: '18 Oct 2025', status: 'Upcoming', responsibilities: 'Run first-aid desk, record vitals, refer cases.' },
  { id: 'AS-002', volunteerId: 'VOL-001', kind: 'Project', target: 'Shiksha After-School', role: 'Tutor', date: '11 Oct 2025', status: 'Ongoing', responsibilities: 'Teach Marathi & maths to grades 4–6.' },
  { id: 'AS-003', volunteerId: 'VOL-003', kind: 'Event', target: 'Annual Gala', role: 'Photographer', date: '25 Oct 2025', status: 'Upcoming', responsibilities: 'Cover the event and share edited photos in 3 days.' },
  { id: 'AS-004', volunteerId: 'VOL-004', kind: 'Event', target: 'Diwali Fundraiser', role: 'Stall Coordinator', date: '2 Oct 2025', status: 'Completed', responsibilities: 'Manage donation stall and volunteers.' },
  { id: 'AS-005', volunteerId: 'VOL-006', kind: 'Project', target: 'Community Kitchen', role: 'Cook', date: '5 Oct 2025', status: 'Completed', responsibilities: 'Prepare and serve 150 meals.' },
];

export const initialAttendance: AttendanceRec[] = [
  { id: 'AT-001', volunteerId: 'VOL-004', date: '2 Oct 2025', kind: 'Event', target: 'Diwali Fundraiser', status: 'Present', hours: 6 },
  { id: 'AT-002', volunteerId: 'VOL-006', date: '5 Oct 2025', kind: 'Project', target: 'Community Kitchen', status: 'Present', hours: 5 },
  { id: 'AT-003', volunteerId: 'VOL-001', date: '4 Oct 2025', kind: 'Project', target: 'Shiksha After-School', status: 'Late', hours: 3 },
  { id: 'AT-004', volunteerId: 'VOL-005', date: '4 Oct 2025', kind: 'Project', target: 'Shiksha After-School', status: 'Absent', hours: 0 },
  { id: 'AT-005', volunteerId: 'VOL-002', date: '27 Sep 2025', kind: 'Event', target: 'Blood Donation Drive', status: 'Present', hours: 7 },
];

export const initialRecognitions: Recognition[] = [
  { id: 'RC-001', volunteerId: 'VOL-002', title: 'Volunteer of the Year 2024', kind: 'Award', date: '14 Dec 2024' },
  { id: 'RC-002', volunteerId: 'VOL-002', title: 'Certificate of Appreciation', kind: 'Certificate', date: '20 Jan 2025' },
  { id: 'RC-003', volunteerId: 'VOL-004', title: 'Top Fundraiser Shoutout', kind: 'Recognition', date: '3 Oct 2025' },
];

export const PROJECTS = ['Shiksha After-School', 'Community Kitchen', 'Health Outreach'];
export const EVENTS = ['Health Camp – Hadapsar', 'Annual Gala', 'Diwali Fundraiser', 'Blood Donation Drive'];
export const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
