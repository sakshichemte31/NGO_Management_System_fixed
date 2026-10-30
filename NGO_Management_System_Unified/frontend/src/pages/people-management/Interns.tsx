import { useEffect, useState } from 'react';
import { PageHeader, PageTabs, ACCENT } from '../../components/people';
import usePersistentState from '../../hooks/usePersistentState';
import DashboardTab from './intern/DashboardTab';
import ApplicationsTab from './intern/ApplicationsTab';
import InternListTab from './intern/InternListTab';
import WorkTab from './intern/WorkTab';
import FeedbackTab from './intern/FeedbackTab';
import CompletionTab from './intern/CompletionTab';
import ReportsTab from './intern/ReportsTab';
import { initialApplicants, initialInterns, initialTasks, type Applicant, type Intern, type Stage, type Task, type TaskStatus } from './intern/data';
import type { RatingReview } from '../../lib/peopleRating';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' }, { id: 'applications', label: 'Applications' }, { id: 'list', label: 'Intern List' },
  { id: 'work', label: 'Internship Work' }, { id: 'feedback', label: 'Attendance & Feedback' }, { id: 'completion', label: 'Completion & Certificate' }, { id: 'reports', label: 'Reports' },
];
const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const createIntern = (applicant: Applicant, id: string): Intern => ({
  id, name: applicant.name, email: applicant.email, dept: applicant.dept, mentor: 'To be assigned',
  start: 'TBD', end: 'TBD', status: 'Active', project: 'Onboarding', progress: 0, attendance: 100,
  rating: 0, feedback: [], finalFeedback: '', certificate: 'Pending', college: applicant.college,
});

export default function InternsPage() {
  const [tab, setTab] = useState('dashboard');
  const [applicants, setApplicants] = usePersistentState<Applicant[]>('people.interns.applicants', initialApplicants);
  const [interns, setInterns] = usePersistentState<Intern[]>('people.interns.interns', initialInterns);
  const [tasks, setTasks] = usePersistentState<Task[]>('people.interns.tasks', initialTasks);

  useEffect(() => {
    setInterns(current => {
      const emails = new Set(current.map(intern => intern.email));
      const missing = applicants.filter(applicant => applicant.stage === 'Selected' && !emails.has(applicant.email));
      if (!missing.length) return current;
      return [...current, ...missing.map((applicant, index) => createIntern(applicant, `INT-${String(current.length + index + 1).padStart(3, '0')}`))];
    });
  }, [applicants, setInterns]);

  const moveApplicant = (id: string, stage: Stage) => {
    const a = applicants.find(x => x.id === id); if (!a || a.stage === stage) return;
    setApplicants(p => p.map(x => x.id === id ? { ...x, stage, history: [...x.history, { date: today(), event: `Moved to ${stage}` }] } : x));
    if (stage === 'Selected') setInterns(current => current.some(intern => intern.email === a.email)
      ? current
      : [...current, createIntern(a, `INT-${String(current.length + 1).padStart(3, '0')}`)]);
  };
  const patch = (id: string, p: Partial<Intern>) => setInterns(prev => prev.map(i => i.id === id ? { ...i, ...p } : i));
  const markAttendance = (id: string, entry: { date: string; status: 'Present' | 'Late' | 'Absent'; note?: string }) => {
    setInterns(current => current.map(intern => {
      if (intern.id !== id) return intern;
      const history = [...(intern.attendanceHistory ?? [])];
      const filtered = history.filter(item => item.date !== entry.date);
      const nextHistory = [...filtered, { date: entry.date, status: entry.status, note: entry.note?.trim() || undefined }].sort((a, b) => b.date.localeCompare(a.date));
      const weights = { Present: 1, Late: 0.5, Absent: 0 } as const;
      const calculated = Math.round((nextHistory.reduce((sum, item) => sum + weights[item.status], 0) / nextHistory.length) * 100);
      return { ...intern, attendance: calculated, attendanceHistory: nextHistory };
    }));
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Intern Management" subtitle="Applications, interns, internship work, feedback and certificates" />
      <PageTabs tabs={TABS} active={tab} onChange={setTab} accent={ACCENT.intern} />
      {tab === 'dashboard' && <DashboardTab applicants={applicants} interns={interns} />}
      {tab === 'applications' && <ApplicationsTab applicants={applicants} onMove={moveApplicant} />}
      {tab === 'list' && <InternListTab interns={interns} onStatus={(id, status) => patch(id, { status })} />}
      {tab === 'work' && <WorkTab interns={interns} tasks={tasks} onTask={(id: string, s: TaskStatus) => setTasks(p => p.map(t => t.id === id ? { ...t, status: s } : t))} />}
      {tab === 'feedback' && <FeedbackTab interns={interns} onFeedback={(id, text) => setInterns(p => p.map(i => i.id === id ? { ...i, feedback: [{ date: today(), text }, ...i.feedback] } : i))} onRate={(id, review: RatingReview) => setInterns(current => current.map(intern => intern.id === id ? { ...intern, rating: review.rating, ratingReviews: [...(intern.ratingReviews ?? []), review] } : intern))} onMarkAttendance={markAttendance} />}
      {tab === 'completion' && <CompletionTab interns={interns} onFinal={(id, t) => patch(id, { finalFeedback: t })} onCert={id => patch(id, { certificate: 'Generated' })} />}
      {tab === 'reports' && <ReportsTab applicants={applicants} interns={interns} />}
    </div>
  );
}
