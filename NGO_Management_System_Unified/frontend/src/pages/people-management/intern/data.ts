import type { RatingReview } from '../../../lib/peopleRating';

export const STAGES = ['New', 'Under Review', 'Shortlisted', 'Selected', 'Rejected'] as const;
export type Stage = typeof STAGES[number];
export const TASK_STATUSES = ['To Do', 'In Progress', 'Done'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];
export const INTERN_DEPTS = ['Project Management', 'Data & Tech', 'Marketing', 'Operations', 'Research & Innovation', 'Finance'];

export interface Applicant {
  id: string; name: string; email: string; phone: string; position: string; dept: string; stage: Stage; appliedOn: string;
  college: string; degree: string; gradYear: string; cgpa: string; skills: string[]; resume: string; history: { date: string; event: string }[];
}
export type AttendanceStatus = 'Present' | 'Late' | 'Absent';
export interface AttendanceEntry { date: string; status: AttendanceStatus; note?: string }
export interface Intern {
  id: string; name: string; email: string; dept: string; mentor: string; start: string; end: string;
  status: 'Active' | 'Completed' | 'On Hold'; project: string; progress: number; attendance: number; rating: number;
  feedback: { date: string; text: string }[]; finalFeedback: string; certificate: 'Pending' | 'Generated'; college: string; ratingReviews?: RatingReview[]; attendanceHistory?: AttendanceEntry[];
}
export interface Task { id: string; internId: string; project: string; title: string; status: TaskStatus }

const ap = (n: number, name: string, position: string, dept: string, stage: Stage, college: string, degree: string, skills: string[]): Applicant => ({
  id: `APP-${String(n).padStart(3, '0')}`, name, email: `${name.split(' ')[0].toLowerCase()}@mail.com`, phone: `+91 97${String(20000000 + n * 91723).slice(0, 8)}`,
  position, dept, stage, appliedOn: `${n + 2} Sep 2025`, college, degree, gradYear: String(2025 + (n % 2)), cgpa: (7.2 + (n % 6) * 0.4).toFixed(1), skills,
  resume: `${name.replace(/ /g, '_')}_Resume.pdf`, history: [{ date: `${n + 2} Sep 2025`, event: 'Application submitted' }],
});

export const initialApplicants: Applicant[] = [
  ap(1, 'Aarav Deshmukh', 'Data Intern', 'Data & Tech', 'New', 'COEP Pune', 'B.Tech IT', ['Python', 'SQL', 'Excel']),
  ap(2, 'Ishita Menon', 'Marketing Intern', 'Marketing', 'New', 'Symbiosis', 'BBA', ['Canva', 'Copywriting']),
  ap(3, 'Rohan Bhatt', 'Research Intern', 'Research & Innovation', 'Under Review', 'TISS', 'MA Social Work', ['Survey design', 'Writing']),
  ap(4, 'Sneha Pawar', 'Project Intern', 'Project Management', 'Under Review', 'MIT-WPU', 'MBA', ['Planning', 'MS Project']),
  ap(5, 'Karan Malhotra', 'Data Intern', 'Data & Tech', 'Shortlisted', 'VIT Pune', 'B.Tech CS', ['React', 'Power BI']),
  ap(6, 'Divya Nambiar', 'Operations Intern', 'Operations', 'Shortlisted', 'SNDT', 'BSW', ['Field work', 'Marathi']),
  ap(7, 'Yash Kulkarni', 'Finance Intern', 'Finance', 'Selected', 'Fergusson', 'B.Com', ['Tally', 'Excel']),
  ap(8, 'Pooja Rane', 'Marketing Intern', 'Marketing', 'Rejected', 'Pune Univ.', 'BA', ['Social media']),
];

export const initialInterns: Intern[] = [
  { id: 'INT-001', name: 'Meera Joshi', email: 'meera@mail.com', dept: 'Data & Tech', mentor: 'Rahul Mehta', start: '1 Jul 2025', end: '30 Dec 2025', status: 'Active', project: 'Impact Dashboard', progress: 68, attendance: 95, rating: 4.4, feedback: [{ date: '15 Sep', text: 'Picks up tools quickly and communicates well.' }], finalFeedback: '', certificate: 'Pending', college: 'COEP Pune' },
  { id: 'INT-002', name: 'Arjun Rao', email: 'arjun@mail.com', dept: 'Marketing', mentor: 'Deepika Rao', start: '1 Aug 2025', end: '31 Jan 2026', status: 'Active', project: 'Winter Campaign', progress: 45, attendance: 90, rating: 3.9, feedback: [{ date: '1 Oct', text: 'Creative ideas; needs to meet deadlines.' }], finalFeedback: '', certificate: 'Pending', college: 'Symbiosis' },
  { id: 'INT-003', name: 'Tanvi Shah', email: 'tanvi@mail.com', dept: 'Research & Innovation', mentor: 'Dr. Arjun Nair', start: '1 Mar 2025', end: '31 Aug 2025', status: 'Completed', project: 'Community Needs Survey', progress: 100, attendance: 97, rating: 4.7, feedback: [{ date: '20 Aug', text: 'Excellent analytical rigour.' }], finalFeedback: 'Outstanding contribution to the survey report. Recommended for future roles.', certificate: 'Generated', college: 'TISS' },
  { id: 'INT-004', name: 'Nikhil Verma', email: 'nikhil@mail.com', dept: 'Operations', mentor: 'Vikram Singh', start: '1 Mar 2025', end: '31 Aug 2025', status: 'Completed', project: 'Camp Logistics', progress: 100, attendance: 92, rating: 4.1, feedback: [{ date: '25 Aug', text: 'Reliable and proactive on the ground.' }], finalFeedback: 'Reliable team member who handled logistics independently.', certificate: 'Pending', college: 'MIT-WPU' },
  { id: 'INT-005', name: 'Rhea Kapoor', email: 'rhea@mail.com', dept: 'Project Management', mentor: 'Priya Sharma', start: '15 Sep 2025', end: '15 Mar 2026', status: 'On Hold', project: 'Project Tracker', progress: 20, attendance: 78, rating: 3.4, feedback: [], finalFeedback: '', certificate: 'Pending', college: 'SIBM' },
];

export const initialTasks: Task[] = [
  { id: 'T1', internId: 'INT-001', project: 'Impact Dashboard', title: 'Clean beneficiary dataset', status: 'Done' },
  { id: 'T2', internId: 'INT-001', project: 'Impact Dashboard', title: 'Build outcome charts', status: 'In Progress' },
  { id: 'T3', internId: 'INT-001', project: 'Impact Dashboard', title: 'Write usage guide', status: 'To Do' },
  { id: 'T4', internId: 'INT-002', project: 'Winter Campaign', title: 'Draft social calendar', status: 'Done' },
  { id: 'T5', internId: 'INT-002', project: 'Winter Campaign', title: 'Design donor poster', status: 'In Progress' },
  { id: 'T6', internId: 'INT-005', project: 'Project Tracker', title: 'Collect project list', status: 'To Do' },
];
