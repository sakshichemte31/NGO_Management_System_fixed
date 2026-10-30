import { useEffect, useState } from 'react';
import { PageHeader, PageTabs, ACCENT } from '../../components/people';
import usePersistentState from '../../hooks/usePersistentState';
import DashboardTab from './volunteer/DashboardTab';
import ApplicationsTab from './volunteer/ApplicationsTab';
import ListTab from './volunteer/ListTab';
import AssignmentsTab from './volunteer/AssignmentsTab';
import SkillsTab from './volunteer/SkillsTab';
import AttendanceTab from './volunteer/AttendanceTab';
import PerformanceTab from './volunteer/PerformanceTab';
import CertificatesTab from './volunteer/CertificatesTab';
import ReportsTab from './volunteer/ReportsTab';
import { initialApplications, initialAssignments, initialAttendance, initialRecognitions, initialVolunteers, today, type AppStatus, type Assignment, type AttendanceRec, type Recognition, type VApplication, type Volunteer } from './volunteer/data';
import type { RatingReview } from '../../lib/peopleRating';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' }, { id: 'applications', label: 'Applications' }, { id: 'list', label: 'Volunteer List' }, { id: 'assignments', label: 'Assignments' },
  { id: 'skills', label: 'Skills & Availability' }, { id: 'attendance', label: 'Attendance' }, { id: 'performance', label: 'Performance & Feedback' }, { id: 'certificates', label: 'Certificates & Recognition' }, { id: 'reports', label: 'Reports' },
];
const createVolunteer = (application: VApplication, id: string): Volunteer => ({
  id, name: application.name, email: application.email, phone: '', city: 'Pune', age: 0, status: 'Active', joined: today(),
  skills: [...application.skills], availability: [], hours: 0, tasksDone: 0, tasksTotal: 1, rating: 0,
  feedback: [], history: [{ date: today(), event: 'Application approved' }],
});

export default function VolunteersPage() {
  const [tab, setTab] = useState('dashboard');
  const [volunteers, setVolunteers] = usePersistentState<Volunteer[]>('people.volunteers.volunteers', initialVolunteers);
  const [applications, setApplications] = usePersistentState<VApplication[]>('people.volunteers.applications', initialApplications);
  const [assignments, setAssignments] = usePersistentState<Assignment[]>('people.volunteers.assignments', initialAssignments);
  const [records, setRecords] = usePersistentState<AttendanceRec[]>('people.volunteers.attendance', initialAttendance);
  const [recognitions, setRecognitions] = usePersistentState<Recognition[]>('people.volunteers.recognitions', initialRecognitions);

  useEffect(() => {
    setVolunteers(current => {
      const emails = new Set(current.map(volunteer => volunteer.email));
      const missing = applications.filter(application => application.status === 'Approved' && !emails.has(application.email));
      if (!missing.length) return current;
      return [...current, ...missing.map((application, index) => createVolunteer(application, `VOL-${String(current.length + index + 1).padStart(3, '0')}`))];
    });
  }, [applications, setVolunteers]);

  const setApp = (id: string, status: AppStatus) => {
    const a = applications.find(x => x.id === id); if (!a) return;
    setApplications(p => p.map(x => x.id === id ? { ...x, status } : x));
    if (status === 'Approved') setVolunteers(current => current.some(volunteer => volunteer.email === a.email)
      ? current
      : [...current, createVolunteer(a, `VOL-${String(current.length + 1).padStart(3, '0')}`)]);
  };
  const addRecognition = (kind: Recognition['kind'], volunteerId: string, title: string) => {
    const item: Recognition = { id: `RC-${Date.now()}`, volunteerId, title, kind, date: today() };
    setRecognitions(current => [item, ...current]);
    return item;
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Volunteer Management" subtitle="Applications, assignments, availability, attendance and recognition" />
      <PageTabs tabs={TABS} active={tab} onChange={setTab} accent={ACCENT.volunteer} />
      {tab === 'dashboard' && <DashboardTab volunteers={volunteers} applications={applications} assignments={assignments} />}
      {tab === 'applications' && <ApplicationsTab applications={applications} volunteers={volunteers} onSet={setApp} />}
      {tab === 'list' && <ListTab volunteers={volunteers} />}
      {tab === 'assignments' && <AssignmentsTab volunteers={volunteers} assignments={assignments} onAdd={a => setAssignments(p => [a, ...p])} onStatus={(id, s) => setAssignments(p => p.map(a => a.id === id ? { ...a, status: s } : a))} />}
      {tab === 'skills' && <SkillsTab volunteers={volunteers} onToggle={(id, k) => setVolunteers(p => p.map(v => v.id === id ? { ...v, availability: v.availability.includes(k) ? v.availability.filter(x => x !== k) : [...v.availability, k] } : v))} />}
      {tab === 'attendance' && <AttendanceTab volunteers={volunteers} records={records} onMark={r => { setRecords(p => [r, ...p]); setVolunteers(p => p.map(v => v.id === r.volunteerId ? { ...v, hours: v.hours + r.hours } : v)); }} />}
      {tab === 'performance' && <PerformanceTab volunteers={volunteers} onFeedback={(id, text) => setVolunteers(p => p.map(v => v.id === id ? { ...v, feedback: [{ date: today(), text }, ...v.feedback] } : v))} onRate={(id, review: RatingReview) => setVolunteers(current => current.map(volunteer => volunteer.id === id ? { ...volunteer, rating: review.rating, ratingReviews: [...(volunteer.ratingReviews ?? []), review] } : volunteer))} />}
      {tab === 'certificates' && <CertificatesTab volunteers={volunteers} items={recognitions} onAdd={addRecognition} />}
      {tab === 'reports' && <ReportsTab volunteers={volunteers} assignments={assignments} records={records} />}
    </div>
  );
}
