import type { RatingReview } from '../../../lib/peopleRating';

export type EmpStatus = 'Active' | 'On Leave' | 'Inactive';

export interface Qualification { degree: string; institution: string; year: string }
export interface Employee {
  id: string; name: string; dept: string; role: string; status: EmpStatus; joinDate: string;
  email: string; phone: string; gender: string; dob: string; address: string; emergency: string;
  employmentType: string; manager: string; location: string; attendance: number; rating: number; ratingReviews?: RatingReview[];
  qualifications: Qualification[];
}
export interface Department { name: string; head: string; description: string }
export interface Requirement {
  id: string; role: string; dept: string; urgency: 'High' | 'Medium' | 'Low'; openedDate: string;
  positions: number; status: 'Open' | 'Shortlisting' | 'On Hold' | 'Filled'; description: string; skills: string;
}
export interface LeaveRecord {
  id: string; employeeId: string; name: string; type: string; from: string; to: string; days: number;
  reason: string; status: 'Pending' | 'Approved' | 'Rejected';
}
export interface AttendanceEntry {
  id: string; employeeId: string; date: string; status: 'Present' | 'Absent' | 'Late'; note: string;
}

export const DEPT_NAMES = ['Project Management', 'Administration', 'Finance', 'HR', 'Data & Tech', 'Marketing', 'Operations', 'Risk Management', 'Research & Innovation'];
export const ROLES = ['Senior PM', 'Tech Lead', 'HR Manager', 'Ops Manager', 'Health PM', 'Finance Officer', 'Marketing Lead', 'Risk Analyst', 'Field Coordinator', 'Research Associate', 'Admin Executive', 'Data Analyst'];

export const departments: Department[] = [
  { name: 'Project Management', head: 'Priya Sharma', description: 'Plans and delivers field projects across programmes.' },
  { name: 'Administration', head: 'Ravi Kumar', description: 'Office operations, procurement and compliance.' },
  { name: 'Finance', head: 'Anita Gupta', description: 'Budgeting, audits and donor fund accounting.' },
  { name: 'HR', head: 'Sunita Roy', description: 'Recruitment, payroll and staff welfare.' },
  { name: 'Data & Tech', head: 'Rahul Mehta', description: 'Systems, MIS and impact data analytics.' },
  { name: 'Marketing', head: 'Deepika Rao', description: 'Campaigns, communications and brand.' },
  { name: 'Operations', head: 'Vikram Singh', description: 'Logistics and on-ground programme operations.' },
  { name: 'Risk Management', head: 'Asha Iyer', description: 'Risk registers, safeguarding and audits.' },
  { name: 'Research & Innovation', head: 'Dr. Arjun Nair', description: 'Impact studies and new programme design.' },
];

const headOf = (dept: string) => departments.find(d => d.name === dept)?.head ?? '—';

const mk = (id: number, name: string, dept: string, role: string, status: EmpStatus, joinDate: string, attendance: number, rating: number, degree: string, institution: string): Employee => {
  const slug = name.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter(w => w !== 'dr')[0];
  return {
    id: `EMP-${String(id).padStart(3, '0')}`, name, dept, role, status, joinDate, attendance, rating,
    email: `${slug}@hopefoundation.org`, phone: `+91 98${String(10000000 + id * 137913).slice(0, 8)}`,
    gender: id % 2 ? 'Female' : 'Male', dob: `${(id % 27) + 1} Mar 19${80 + (id % 15)}`,
    address: `${10 + id}, Lake View Road, Pune`, emergency: `Family contact · +91 90000 0${1000 + id}`,
    employmentType: id % 5 === 0 ? 'Contract' : 'Full-time', manager: headOf(dept), location: id % 3 ? 'Pune HQ' : 'Field Office',
    qualifications: [{ degree, institution, year: String(2005 + (id % 12)) }],
  };
};

export const initialEmployees: Employee[] = [
  mk(1, 'Priya Sharma', 'Project Management', 'Senior PM', 'Active', '1 Mar 2022', 96, 4.6, 'MBA', 'SIBM Pune'),
  mk(2, 'Rahul Mehta', 'Data & Tech', 'Tech Lead', 'Active', '15 Jan 2023', 98, 4.8, 'B.Tech CS', 'COEP'),
  mk(3, 'Sunita Roy', 'HR', 'HR Manager', 'Active', '1 Jun 2021', 94, 4.2, 'MA HRM', 'TISS'),
  mk(4, 'Vikram Singh', 'Operations', 'Ops Manager', 'Active', '10 Apr 2020', 97, 4.5, 'MBA Ops', 'Symbiosis'),
  mk(5, 'Anita Patel', 'Project Management', 'Health PM', 'Active', '1 Sep 2023', 92, 4.0, 'MPH', 'AIIMS'),
  mk(6, 'Amit Kumar', 'Finance', 'Finance Officer', 'On Leave', '15 Jul 2022', 88, 3.6, 'M.Com', 'Fergusson'),
  mk(7, 'Deepika Rao', 'Marketing', 'Marketing Lead', 'Active', '20 Feb 2025', 95, 4.3, 'BMM', 'Mumbai Univ.'),
  mk(8, 'Asha Iyer', 'Risk Management', 'Risk Analyst', 'Active', '5 Nov 2022', 91, 3.9, 'MBA Risk', 'NMIMS'),
  mk(9, 'Dr. Arjun Nair', 'Research & Innovation', 'Research Associate', 'Active', '2 Aug 2021', 93, 4.4, 'PhD Sociology', 'JNU'),
  mk(10, 'Kavita Joshi', 'Operations', 'Field Coordinator', 'Active', '12 Sep 2025', 90, 3.8, 'BSW', 'SNDT'),
  mk(11, 'Manoj Desai', 'Administration', 'Admin Executive', 'Inactive', '3 May 2019', 72, 3.1, 'B.Com', 'Pune Univ.'),
  mk(12, 'Neha Kulkarni', 'Data & Tech', 'Data Analyst', 'Active', '18 Aug 2025', 96, 4.1, 'M.Sc Stats', 'Pune Univ.'),
];

export const initialRequirements: Requirement[] = [
  { id: 'REQ-001', role: 'Data Analyst', dept: 'Data & Tech', urgency: 'High', openedDate: '1 Oct 2025', positions: 2, status: 'Open', description: 'Build dashboards for programme impact data.', skills: 'SQL, Power BI, Python' },
  { id: 'REQ-002', role: 'Field Coordinator', dept: 'Operations', urgency: 'Medium', openedDate: '25 Sep 2025', positions: 3, status: 'Shortlisting', description: 'Coordinate community camps in rural blocks.', skills: 'Marathi, logistics' },
  { id: 'REQ-003', role: 'Finance Assistant', dept: 'Finance', urgency: 'Low', openedDate: '15 Sep 2025', positions: 1, status: 'Open', description: 'Support grant accounting and reconciliations.', skills: 'Tally, Excel' },
  { id: 'REQ-004', role: 'Grant Writer', dept: 'Research & Innovation', urgency: 'Medium', openedDate: '2 Aug 2025', positions: 1, status: 'Filled', description: 'Draft proposals for institutional donors.', skills: 'Writing, research' },
];

export const initialLeaves: LeaveRecord[] = [
  { id: 'LV-101', employeeId: 'EMP-006', name: 'Amit Kumar', type: 'Medical', from: '1 Oct', to: '12 Oct', days: 12, reason: 'Surgery recovery', status: 'Approved' },
  { id: 'LV-102', employeeId: 'EMP-005', name: 'Anita Patel', type: 'Casual', from: '14 Oct', to: '15 Oct', days: 2, reason: 'Family function', status: 'Pending' },
  { id: 'LV-103', employeeId: 'EMP-002', name: 'Rahul Mehta', type: 'Earned', from: '20 Oct', to: '24 Oct', days: 5, reason: 'Vacation', status: 'Pending' },
  { id: 'LV-104', employeeId: 'EMP-010', name: 'Kavita Joshi', type: 'Casual', from: '8 Oct', to: '8 Oct', days: 1, reason: 'Personal work', status: 'Rejected' },
];

/** Deterministic history series derived from the employee's current figures (mock). */
const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const attendanceCredit = (status: AttendanceEntry['status']) => status === 'Present' ? 1 : status === 'Late' ? 0.5 : 0;
export const attendancePercentage = (entries: AttendanceEntry[]) => entries.length
  ? Math.round(entries.reduce((total, entry) => total + attendanceCredit(entry.status), 0) / entries.length * 100)
  : null;

export const attendanceHistory = (e: Employee, allEntries: AttendanceEntry[] = []) => {
  const entries = allEntries.filter(entry => entry.employeeId === e.id);
  if (entries.length) {
    const months = new Map<string, { month: string; timestamp: number; credits: number[] }>();
    entries.forEach(entry => {
      const date = new Date(`${entry.date}T00:00:00`);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const group = months.get(key) ?? { month: date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), timestamp: date.getTime(), credits: [] };
      group.credits.push(attendanceCredit(entry.status));
      months.set(key, group);
    });
    return [...months.values()].sort((a, b) => a.timestamp - b.timestamp).map(group => ({
      month: group.month, percent: Math.round(group.credits.reduce((sum, credit) => sum + credit, 0) / group.credits.length * 100),
    }));
  }
  return MONTHS.map((month, i) => ({ month, percent: Math.max(60, Math.min(100, Math.round(e.attendance + ((i * 7 + e.name.length) % 9) - 4))) }));
};
export const ratingHistory = (e: Employee) => e.ratingReviews?.length
  ? e.ratingReviews.map(review => ({ period: review.date, rating: review.rating }))
  : ['H1 2023', 'H2 2023', 'H1 2024', 'H2 2024', 'H1 2025'].map((period, i, a) => ({
    period, rating: +Math.max(2.5, Math.min(5, e.rating - (a.length - 1 - i) * 0.12 + ((i * 3 + e.name.length) % 4) * 0.05)).toFixed(1),
  }));
export const feedbackFor = (e: Employee) =>
  e.rating >= 4.5 ? 'Outstanding delivery and ownership; ready for larger scope.'
  : e.rating >= 4 ? 'Consistently meets expectations with strong collaboration.'
  : e.rating >= 3.5 ? 'Solid contributor; focus on timelines and documentation.'
  : 'Needs structured support and a clear improvement plan.';
