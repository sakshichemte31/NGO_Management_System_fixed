import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePersistentState from '../../hooks/usePersistentState';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import {
  CalendarDays, Cake, CheckCircle2, CircleDollarSign, FileText,
  Gift, HeartHandshake, MessageSquare, Sparkles, Target, TrendingUp,
  UserRoundCheck, Users, BriefcaseBusiness, ArrowRight, Eye,
  BellRing, Download, Search, ClipboardList, TimerReset, ShieldCheck,
  Wand2, Send, Building2, BarChart3, Plus, X, Mail, Phone,
} from 'lucide-react';
import {
  activityLog,
  birthdayProfiles,
  birthdayTasks,
  campaignData,
  causeData,
  cityDistribution,
  communicationTimeline,
  contributionData,
  departmentMetrics,
  deptWorkspaces,
  donorPipeline,
  donorProfiles,
  donorSegments,
  revenueByCategory,
  rolePermissions,
  monthlyTrend,
} from './sharedData';

export function notifyModule(message: string) {
  window.dispatchEvent(new CustomEvent('ngo:notify', { detail: message }));
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function parseCsvRow(line: string) {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onClick={onClose}>
      <section className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close dialog" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, sub, tone = 'teal' }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: 'teal' | 'blue' | 'green' | 'amber' | 'purple';
}) {
  const toneMap = {
    teal: { bg: '#E6F7F9', color: '#0F766E' },
    blue: { bg: '#E0F2FE', color: '#0369A1' },
    green: { bg: '#DCFCE7', color: '#15803D' },
    amber: { bg: '#FEF3C7', color: '#B45309' },
    purple: { bg: '#F3E8FF', color: '#7C3AED' },
  };

  const theme = toneMap[tone];

  return (
    <div className="stat-card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl" style={{ background: theme.bg, color: theme.color }}>
          {icon}
        </div>
        <div className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">{sub}</div>
      </div>
      <div>
        <div className="text-2xl font-extrabold text-slate-800" style={{ fontFamily: 'Nunito, sans-serif' }}>{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ label, tone = 'teal' }: { label: string; tone?: 'teal' | 'blue' | 'amber' | 'green' | 'red' | 'gray' | 'purple' }) {
  const toneMap = {
    teal: 'badge badge-teal',
    blue: 'badge badge-blue',
    amber: 'badge badge-yellow',
    green: 'badge badge-green',
    red: 'badge badge-red',
    gray: 'badge badge-gray',
    purple: 'badge badge-purple',
  };
  return <span className={toneMap[tone]}>{label}</span>;
}

function SectionHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="card-header">
      <div>
        <div className="card-title">{title}</div>
        {subtitle && <div className="text-[11px] text-slate-400 mt-1">{subtitle}</div>}
      </div>
      {actions}
    </div>
  );
}

export function BirthdayProjectDashboard() {
  const navigate = useNavigate();
  const quickActions = [
    { label: 'Create greeting template', path: '/birthday-project/occasions' },
    { label: 'Schedule reminder', path: '/birthday-project/occasions' },
    { label: 'Start donor engagement', path: '/birthday-project/action-workspace' },
    { label: 'Review task board', path: '/birthday-project/engagement' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="page-title">Birthday Project Dashboard</h1>
          <p className="page-subtitle">Overview of donor engagement, occasions, and staff performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary text-sm" onClick={() => navigate('/birthday-project/occasions')}><CalendarDays size={15} /> View calendar</button>
          <button className="btn-primary text-sm" onClick={() => navigate('/birthday-project/action-workspace')}><Sparkles size={15} /> Quick action</button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<HeartHandshake size={18} />} label="Active donors" value="2,480" sub="+14%" tone="teal" />
        <StatCard icon={<Cake size={18} />} label="Upcoming occasions" value="186" sub="12 this week" tone="blue" />
        <StatCard icon={<ClipboardList size={18} />} label="Assigned tasks" value="94" sub="52 pending" tone="amber" />
        <StatCard icon={<CircleDollarSign size={18} />} label="Contributions" value="₹31.4L" sub="₹4.8L this month" tone="green" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <SectionHeader title="Expected vs Actual Contribution" subtitle="Reviewed across 7 months" actions={<StatusBadge label="Updated today" tone="green" />} />
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={contributionData}>
                <defs>
                  <linearGradient id="birthdayTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1AACB8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1AACB8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                <Tooltip formatter={(value) => [`₹${(Number(value ?? 0) / 1000).toFixed(0)}k`, 'Donation']} contentStyle={{ borderRadius: 12 }} />
                <Area type="monotone" dataKey="amount" stroke="#1AACB8" strokeWidth={3} fill="url(#birthdayTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Staff performance" subtitle="Engagement quality" />
          <div className="card-body space-y-4">
            {[
              { name: 'Priya', score: 92 },
              { name: 'Nisha', score: 86 },
              { name: 'Vivek', score: 81 },
              { name: 'Raj', score: 78 },
            ].map((staff) => (
              <div key={staff.name}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                  <span>{staff.name}</span>
                  <span>{staff.score}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-teal-500" style={{ width: `${staff.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <SectionHeader title="Upcoming occasions" subtitle="Birthday and celebration reminders" actions={<button className="btn-secondary text-sm" onClick={() => navigate('/birthday-project/occasions')}><Target size={15} /> View all</button>} />
          <div className="card-body space-y-3">
            {birthdayProfiles.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <div>
                  <div className="font-semibold text-slate-800">{profile.name}</div>
                  <div className="text-xs text-slate-500">{profile.city} • {profile.relation}</div>
                </div>
                <div className="text-right">
                  <StatusBadge label={profile.status} tone={profile.status === 'Warm' ? 'green' : 'blue'} />
                  <div className="mt-2 text-xs text-slate-500">{profile.nextAction}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Quick actions" subtitle="Shortcuts for staff and volunteers" />
          <div className="card-body space-y-2">
            {quickActions.map((action) => (
              <button key={action.label} onClick={() => navigate(action.path)} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:border-teal-300 hover:bg-teal-50">
                {action.label}
                <ArrowRight size={14} className="text-teal-600" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card">
          <SectionHeader title="Monthly & quarterly trends" subtitle="Engagements completed and donor responses" />
          <div className="card-body">
            <ResponsiveContainer width="100%" height={205}>
              <BarChart data={monthlyTrend.map((trend) => ({ ...trend, responses: Math.round(trend.donors * 0.62) }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="donors" name="Engagements completed" fill="#1AACB8" radius={[5, 5, 0, 0]} />
                <Bar dataKey="responses" name="Positive responses" fill="#818CF8" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <SectionHeader title="Task completion & budget" subtitle="This month · all departments" />
          <div className="card-body space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['Completed', '68', 'text-emerald-700'], ['Pending', '21', 'text-amber-700'], ['Follow-ups', '14', 'text-blue-700']].map(([label, value, color]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><div className={`text-xl font-extrabold ${color}`}>{value}</div><div className="text-[11px] text-slate-500">{label}</div></div>)}
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-600"><span>Occasion budget used</span><span>₹7.2L / ₹10L</span></div>
              <div className="h-3 rounded-full bg-slate-200"><div className="h-3 w-[72%] rounded-full bg-gradient-to-r from-teal-400 to-cyan-600" /></div>
            </div>
            <button className="btn-secondary text-sm" onClick={() => navigate('/birthday-project/reports')}><BarChart3 size={15} /> View performance reports</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BirthdayProjectProfiles() {
  const [query, setQuery] = useState('');
  const [relationship, setRelationship] = useState('');
  const [profiles, setProfiles] = useState(birthdayProfiles);
  const [showAdd, setShowAdd] = useState(false);
  const filtered = profiles.filter((person) =>
    `${person.name} ${person.city}`.toLowerCase().includes(query.toLowerCase())
    && (!relationship || person.relation === relationship),
  );

  const handleImport = async (file?: File) => {
    if (!file) return;
    const csv = await file.text();
    const [headerLine, ...lines] = csv.split(/\r?\n/).filter(Boolean);
    if (!headerLine) {
      notifyModule('CSV file is empty');
      return;
    }
    const headers = parseCsvRow(headerLine).map((header) => header.toLowerCase());
    const nameIndex = headers.findIndex((header) => ['name', 'profile name', 'full name'].includes(header));
    const cityIndex = headers.findIndex((header) => header === 'city');
    if (nameIndex < 0 || cityIndex < 0) {
      notifyModule('CSV needs name and city columns');
      return;
    }
    const imported = lines.map(parseCsvRow).filter((row) => row[nameIndex]?.trim() && row[cityIndex]?.trim()).map((row) => {
      const relationIndex = headers.findIndex((header) => ['relationship', 'relationship type', 'relation'].includes(header));
      const interestIndex = headers.findIndex((header) => ['interest', 'cause', 'cause interest'].includes(header));
      return {
        id: Date.now() + Math.random(),
        name: row[nameIndex].trim(),
        city: row[cityIndex].trim(),
        relation: relationIndex < 0 ? 'Individual' : row[relationIndex] || 'Individual',
        interest: interestIndex < 0 ? 'Not specified' : row[interestIndex] || 'Not specified',
        status: 'Warm',
        nextAction: 'Review imported profile',
      };
    });
    setProfiles((current) => [...current, ...imported]);
    notifyModule(`Imported ${imported.length} profile row${imported.length === 1 ? '' : 's'} from ${file.name}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="page-header">
        <h1 className="page-title">Profile Database</h1>
        <p className="page-subtitle">Search relationships, communication history, and cause interests</p>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col xl:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="form-input pl-9" placeholder="Search by name or city" />
            </div>
            <select value={relationship} onChange={(event) => setRelationship(event.target.value)} className="form-input !w-auto min-w-[150px]">
              <option value="">All relationships</option>
              {['Individual', 'Corporate', 'Volunteer', 'Partner', 'Advisor'].map((type) => <option key={type}>{type}</option>)}
            </select>
            <label className="btn-secondary text-sm cursor-pointer">
              <Download size={15} /> Bulk import
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void handleImport(event.target.files?.[0])} />
            </label>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Profile Directory</div>
          <button className="btn-primary text-sm" onClick={() => setShowAdd(true)}><UserRoundCheck size={15} /> Add profile</button>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="data-table min-w-[700px] w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Relation</th>
                <th>Interest</th>
                <th>City</th>
                <th>Status</th>
                <th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((profile) => (
                <tr key={profile.id}>
                  <td className="font-semibold">{profile.name}</td>
                  <td>{profile.relation}</td>
                  <td>{profile.interest}</td>
                  <td>{profile.city}</td>
                  <td><StatusBadge label={profile.status} tone={profile.status === 'Conversion' ? 'purple' : 'teal'} /></td>
                  <td>{profile.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-8 text-center text-sm text-slate-500">No profiles match these filters.</div>}
        </div>
      </div>
      {showAdd && (
        <Dialog title="Add profile" onClose={() => setShowAdd(false)}>
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const name = String(form.get('name') ?? '').trim();
            const city = String(form.get('city') ?? '').trim();
            const relation = String(form.get('relation') ?? 'Individual');
            const interest = String(form.get('interest') ?? '').trim();
            if (!name || !city || !interest) return;
            setProfiles((current) => [...current, { id: Date.now(), name, city, relation, interest, status: 'Warm', nextAction: 'Schedule first call' }]);
            setShowAdd(false);
            notifyModule(`${name} added to the profile directory`);
          }}>
            <label className="form-label">Name<input required name="name" className="form-input mt-1" placeholder="Full name or business" /></label>
            <label className="form-label">Relationship type<select name="relation" className="form-input mt-1">{['Individual', 'Corporate', 'Volunteer', 'Partner', 'Advisor'].map((type) => <option key={type}>{type}</option>)}</select></label>
            <label className="form-label">City<input required name="city" className="form-input mt-1" placeholder="City" /></label>
            <label className="form-label">Cause interests<input required name="interest" className="form-input mt-1" placeholder="Education, healthcare..." /></label>
            <button type="submit" className="btn-primary w-full justify-center"><Plus size={15} /> Save profile</button>
          </form>
        </Dialog>
      )}
    </div>
  );
}

export function BirthdayProjectOccasions() {
  const [view, setView] = useState<'Month' | 'Week' | 'List'>('Week');
  const [greeting, setGreeting] = useState('Dear {name}, we are delighted to celebrate your {occasion} with our community and thank you for your support.');
  const [days, setDays] = useState('7');
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [occasions, setOccasions] = useState([
    { title: 'Asha birthday celebration', date: '12 Oct', tag: 'Priority' },
    { title: 'Volunteer appreciation day', date: '18 Oct', tag: 'Campaign' },
    { title: 'Women empowerment donor circle', date: '22 Oct', tag: 'Corporate' },
  ]);
  const visibleOccasions = priorityOnly ? occasions.filter((item) => item.tag === 'Priority') : occasions;

  return (
    <div className="flex flex-col gap-5">
      <div className="page-header">
        <h1 className="page-title">Occasions & Calendar</h1>
        <p className="page-subtitle">Upcoming birthdays, reminders, greeting templates, and campaign events</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card">
          <SectionHeader title="Upcoming occasions" subtitle={`Next 14 days · ${view} view`} actions={
            <div className="flex gap-1">
              {(['Month', 'Week', 'List'] as const).map((mode) => <button key={mode} onClick={() => setView(mode)} className={`rounded-md px-2 py-1 text-xs font-semibold ${view === mode ? 'bg-teal-100 text-teal-800' : 'text-slate-500 hover:bg-slate-100'}`}>{mode}</button>)}
            </div>
          } />
          <div className="card-body">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={priorityOnly} onChange={(event) => setPriorityOnly(event.target.checked)} /> Priority only</label>
              <label className="flex items-center gap-2 text-xs text-slate-600">Reminder lead
                <select value={days} onChange={(event) => setDays(event.target.value)} className="form-input !w-auto !py-1">
                  {['1', '3', '7', '14'].map((value) => <option key={value} value={value}>{value} days</option>)}
                </select>
              </label>
            </div>
            {view === 'Month' && (
              <div className="mb-4 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-500">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S', ...Array.from({ length: 35 }, (_, index) => String(index + 1))].map((day, index) => <div key={`${day}-${index}`} className={`rounded-md p-2 ${index > 7 && [12, 18, 22].includes(Number(day)) ? 'bg-teal-100 text-teal-800' : 'bg-slate-50'}`}>{day}</div>)}
              </div>
            )}
            <div className="space-y-3">
            {visibleOccasions.map((item) => (
              <div key={item.title} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <div>
                  <div className="font-semibold text-slate-800">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.date}</div>
                </div>
                <StatusBadge label={item.tag} tone={item.tag === 'Priority' ? 'amber' : 'blue'} />
              </div>
            ))}
            </div>
            <button className="btn-secondary mt-4 text-sm" onClick={() => {
              setOccasions((current) => [...current, { title: 'New donor reminder', date: '25 Oct', tag: 'Priority' }]);
              notifyModule('A new occasion reminder was added');
            }}><Plus size={15} /> Add occasion</button>
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Greeting template editor" subtitle="Use variables like {name} and {occasion}" />
          <div className="card-body space-y-3">
            <textarea className="form-input min-h-[140px]" value={greeting} onChange={(event) => setGreeting(event.target.value)} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">Reminder rule: send {days} days before</span>
              <button className="btn-primary text-sm" onClick={() => notifyModule('Greeting template saved successfully')}><Wand2 size={15} /> Save template</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BirthdayProjectEngagement() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(birthdayTasks);
  const [queued, setQueued] = useState(0);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const markOnline = () => {
      setIsOnline(true);
      setQueued(0);
    };
    const markOffline = () => setIsOnline(false);
    window.addEventListener('online', markOnline);
    window.addEventListener('offline', markOffline);
    return () => {
      window.removeEventListener('online', markOnline);
      window.removeEventListener('offline', markOffline);
    };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="page-header">
        <h1 className="page-title">Engagement & Actions</h1>
        <p className="page-subtitle">Task cards, staff assignments, templates, outreach logs, and offline action tracking</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {tasks.map((task, index) => (
          <div key={task.title} className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-800">{task.title}</div>
                <StatusBadge label={task.status} tone={task.status === 'Completed' ? 'green' : 'blue'} />
              </div>
              <div className="mt-2 text-sm text-slate-600">Type: {task.type} • Assigned to {task.assignee}</div>
              <div className="mt-4 flex gap-2">
                <button className="btn-primary text-sm" onClick={() => navigate('/birthday-project/action-workspace')}><MessageSquare size={15} /> Start action</button>
                <button className="btn-secondary text-sm" onClick={() => notifyModule(`Message composer opened for ${task.assignee}`)}><Send size={15} /> Message</button>
                {task.status !== 'Completed' && <button className="btn-secondary text-sm" onClick={() => {
                  setTasks((current) => current.map((entry, taskIndex) => taskIndex === index ? { ...entry, status: 'Completed' } : entry));
                  if (isOnline) {
                    notifyModule('Task completed and synced');
                  } else {
                    setQueued((count) => count + 1);
                    notifyModule('Task marked complete and queued for sync');
                  }
                }}><CheckCircle2 size={15} /> Complete</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <SectionHeader title="Offline queue & sync" subtitle="Works well for field teams" actions={<StatusBadge label={isOnline ? 'Online · Auto-sync ready' : 'Offline · Actions queued'} tone={isOnline ? 'teal' : 'amber'} />} />
        <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-3">
          {['Offline banner shown', `Queued actions: ${queued}`, 'Auto-sync when online'].map((item) => (
            <div key={item} className="rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700">{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BirthdayProjectOutcomes() {
  const funnel = [
    { name: 'Identified', value: 90 },
    { name: 'Connected', value: 62 },
    { name: 'Interested', value: 41 },
    { name: 'Pledged', value: 26 },
    { name: 'Converted', value: 15 },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="page-header">
        <h1 className="page-title">Outcomes & Conversion</h1>
        <p className="page-subtitle">Tracking donor response, contribution pledged, and impact updates</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card">
          <SectionHeader title="Conversion funnel" subtitle="From identification to impact" />
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnel}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#1AACB8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Revenue streams" subtitle="Public, corporate, self-funding" />
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={revenueByCategory} dataKey="value" innerRadius={40} outerRadius={80} paddingAngle={4}>
                  {revenueByCategory.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BirthdayProjectDepartments() {
  return (
    <div className="flex flex-col gap-5">
      <div className="page-header">
        <h1 className="page-title">Department Workflows</h1>
        <p className="page-subtitle">Nine department workspaces with task boards, dashboards and permissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {deptWorkspaces.map((dept, index) => {
          const metrics = departmentMetrics.find((entry) => entry.dept === dept);
          const openTasks = metrics?.tasks ?? 12 + index * 2;
          const completion = metrics?.completion ?? `${72 + index * 2}%`;
          return (
          <div key={dept} className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-800">{dept}</div>
                <Building2 size={16} className="text-teal-600" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                <span>{openTasks} open tasks</span>
                <span>{completion} complete</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: 'To do', value: Math.max(2, Math.round(openTasks * 0.35)), style: 'bg-amber-50 text-amber-800' },
                  { label: 'Doing', value: Math.max(1, Math.round(openTasks * 0.25)), style: 'bg-blue-50 text-blue-800' },
                  { label: 'Done', value: Math.max(3, Math.round(openTasks * 0.7)), style: 'bg-emerald-50 text-emerald-800' },
                ].map((column) => <div key={column.label} className={`rounded-lg p-2 text-center ${column.style}`}><div className="text-sm font-bold">{column.value}</div><div className="text-[10px]">{column.label}</div></div>)}
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div>Assigned staff: 4</div>
              </div>
              <button className="btn-secondary mt-3 w-full justify-center text-xs" onClick={() => notifyModule(`${dept} workspace opened`)}>Open task board <ArrowRight size={13} /></button>
            </div>
          </div>
          );
        })}
      </div>

      <div className="card">
        <SectionHeader title="RBAC matrix" subtitle="Roles x permissions" actions={<ShieldCheck className="text-teal-600" size={18} />} />
        <div className="card-body overflow-x-auto">
          <table className="data-table min-w-[600px] w-full">
            <thead>
              <tr>
                <th>Role</th>
                <th>Routes</th>
                <th>Actions</th>
                <th>Data access</th>
              </tr>
            </thead>
            <tbody>
              {rolePermissions.map((row) => (
                <tr key={row.role}>
                  <td>{row.role}</td>
                  <td>{row.routes}</td>
                  <td>{row.actions}</td>
                  <td>{row.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function BirthdayProjectReports() {
  const reportSections = [
    { title: 'Board executive summary', value: '74%', caption: 'Engagement goal achieved' },
    { title: 'Task completion rates', value: '86%', caption: 'Tasks completed on schedule' },
    { title: 'Engagement analytics', value: '1,284', caption: 'Donor interactions logged' },
    { title: 'Contribution reports', value: '₹31.4L', caption: 'Recorded this quarter' },
    { title: 'Campaign performance', value: '4 / 5', caption: 'Campaigns on track' },
    { title: 'Impact reports', value: '18', caption: 'Updates shared with donors' },
    { title: 'Financial reports', value: '₹7.2L', caption: 'Occasion budget used' },
    { title: 'Monthly / quarterly trends', value: '+12%', caption: 'Engagement growth' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="page-header">
        <h1 className="page-title">Reports & Governance</h1>
        <p className="page-subtitle">Board summaries, campaign performance, audits, and governance logs</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {reportSections.map((item, index) => <StatCard key={item.title} icon={index % 2 ? <TrendingUp size={18} /> : <BarChart3 size={18} />} label={item.title} value={item.value} sub={item.caption} tone={(['teal', 'blue', 'green', 'purple'] as const)[index % 4]} />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card">
          <SectionHeader title="Contribution and engagement trends" subtitle="Monthly donor activity" actions={<button className="btn-secondary text-sm" onClick={() => downloadCsv('birthday-project-trends.csv', [['Month', 'Donors', 'Contributions'], ...monthlyTrend.map((row) => [row.month, String(row.donors), String(row.contributions)])])}><Download size={14} /> Export CSV</button>} />
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyTrend}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip />
                <Area dataKey="donors" name="Engagements" stroke="#1AACB8" fill="#CCFBF1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <SectionHeader title="Audit, compliance & access logs" subtitle="Recent activity reviewed" actions={<StatusBadge label="Compliant" tone="green" />} />
          <div className="card-body space-y-3">
            {[
              { event: 'Role access reviewed', detail: 'Admin · Today, 10:42 AM' },
              { event: 'Contribution record updated', detail: 'Finance · Today, 09:18 AM' },
              { event: 'Security log export generated', detail: 'System · Yesterday' },
              { event: 'Quarterly compliance checklist completed', detail: 'Operations · 07 Oct' },
            ].map((log) => <div key={log.event} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3"><ShieldCheck size={16} className="text-teal-600" /><div><div className="text-sm font-medium text-slate-700">{log.event}</div><div className="text-xs text-slate-500">{log.detail}</div></div></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BirthdayProjectActionWorkspace() {
  const [activeStep, setActiveStep] = useState(1);
  const [checklist, setChecklist] = useState(activityLog);
  const steps = ['Profile context', 'Pre-check', 'Occasion action', 'Log response', 'Outcome & pledge', 'Impact feedback'];

  return (
    <div className="flex flex-col gap-5">
      <div className="page-header">
        <h1 className="page-title">Action Workspace</h1>
        <p className="page-subtitle">Guided donor engagement journey for birthday and special occasion outreach</p>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-2 mb-5">
            {steps.map((step, index) => (
              <button key={step} onClick={() => setActiveStep(index + 1)} className={`rounded-full px-3 py-2 text-xs font-semibold ${activeStep === index + 1 ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {index + 1}. {step}
              </button>
            ))}
          </div>

          {activeStep === 1 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-semibold text-slate-800">Donor profile</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>• Name: Asha Nair</li>
                  <li>• Relationship: Regular donor</li>
                  <li>• Cause interests: Education</li>
                  <li>• Contribution history: ₹2.4L</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-semibold text-slate-800">Past interactions</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>• 3 calls this quarter</li>
                  <li>• 1 visit completed</li>
                  <li>• Last reply: positive</li>
                </ul>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-3">
              {checklist.map((item, index) => (
                <button key={item.label} onClick={() => setChecklist((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, done: !entry.done } : entry))} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-teal-100 text-teal-600">
                    {item.done ? <CheckCircle2 size={14} /> : <TimerReset size={14} />}
                  </div>
                  <span className="text-sm text-slate-700">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {activeStep === 3 && (
            <div className="flex flex-wrap gap-3">
              {['Call donor', 'Visit', 'WhatsApp', 'Letter or email', 'Gift delivery', 'Use template'].map((action) => (
                <button key={action} onClick={() => notifyModule(`${action} action selected`)} className="btn-secondary text-sm">{action}</button>
              ))}
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-4">
              <textarea className="form-input min-h-[110px]" defaultValue="Conversation summary: donor expressed interest in sponsoring books and school kits." />
              <label className="btn-primary text-sm cursor-pointer"><UploadIcon /> Upload proof<input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) notifyModule(`${file.name} attached to this engagement`);
              }} /></label>
            </div>
          )}

          {activeStep === 5 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-semibold text-slate-800">Contribution details</div>
                <div className="mt-3 text-sm text-slate-600">Amount: ₹15,000 • Cause: Education • Campaign: School Meals</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-semibold text-slate-800">Follow-up schedule</div>
                <div className="mt-3 text-sm text-slate-600">Next date: 17 Oct • Reminder preference: WhatsApp</div>
              </div>
            </div>
          )}

          {activeStep === 6 && (
            <div className="space-y-3">
              <button className="btn-primary text-sm" onClick={() => notifyModule('Thank-you note queued for sending')}><Gift size={15} /> Send thank-you note</button>
              <button className="btn-secondary text-sm" onClick={() => notifyModule('Impact update opened')}><Eye size={15} /> Review impact update</button>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button className="btn-secondary text-sm" onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}>Previous</button>
            <button className="btn-primary text-sm" onClick={() => setActiveStep((prev) => Math.min(steps.length, prev + 1))}>Next step <ArrowRight size={15} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadIcon() {
  return <FileText size={15} className="mr-1 inline" />;
}

export function DonorManagementAdminDashboard() {
  const [range, setRange] = useState('Last 6 months');

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="page-title">Donor Management Dashboard</h1>
          <p className="page-subtitle">Overview of donors, funding streams, retention, and geographic reach</p>
        </div>
        <div className="flex gap-2">
          <select className="form-input !w-auto" value={range} onChange={(event) => setRange(event.target.value)} aria-label="Dashboard date range">
            {['Last 30 days', 'Last 6 months', 'Year to date'].map((option) => <option key={option}>{option}</option>)}
          </select>
          <button className="btn-primary text-sm" onClick={() => {
            downloadCsv('donor-management-summary.csv', [['Metric', 'Value'], ['Total donors', '1428'], ['Individual donors', '684'], ['Corporate donors', '744'], ['Funds received', '87000000'], ['Date range', range]]);
            notifyModule('Dashboard summary exported');
          }}><Download size={15} /> Export</button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<Users size={18} />} label="Total donors" value="1,428" sub="+9%" tone="teal" />
        <StatCard icon={<HeartHandshake size={18} />} label="Individual" value="684" sub="+14%" tone="blue" />
        <StatCard icon={<BriefcaseBusiness size={18} />} label="Corporate" value="312" sub="+11%" tone="green" />
        <StatCard icon={<CircleDollarSign size={18} />} label="Received" value="₹8.7Cr" sub="₹2.6Cr month" tone="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <SectionHeader title="Donation trend" subtitle="Monthly and yearly contribution view" />
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="donorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`₹${(Number(value ?? 0) / 1000).toFixed(0)}k`, 'Contribution']} contentStyle={{ borderRadius: 12 }} />
                <Area type="monotone" dataKey="contributions" stroke="#3B82F6" fill="url(#donorTrend)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Donor segments" subtitle="Retention funnel" />
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={donorSegments} dataKey="value" innerRadius={36} outerRadius={86} paddingAngle={4}>
                  {donorSegments.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card">
          <SectionHeader title="Geographic distribution" subtitle="Donors by city" />
          <div className="card-body">
            {cityDistribution.map((city) => (
              <div key={city.place} className="mb-3">
                <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                  <span>{city.place}</span>
                  <span>{city.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-teal-500" style={{ width: `${(city.count / 42) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Campaign summary" subtitle="Active and upcoming campaigns" />
          <div className="card-body space-y-3">
            {campaignData.map((campaign) => (
              <div key={campaign.name}>
                <div className="mb-1 flex items-center justify-between text-sm text-slate-700">
                  <span>{campaign.name}</span>
                  <span>{campaign.amount}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: `${campaign.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DonorManagementDirectory() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [donors, setDonors] = useState(donorProfiles);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<(typeof donorProfiles)[number] | null>(null);
  const [profileTab, setProfileTab] = useState('Basic Info');
  const profileTabs = ['Basic Info', 'Contact Info', 'Address/Location', 'Relationship Type', 'Connection Source', 'Cause Interests', 'Contribution History', 'Communication History', 'Follow-Up History', 'Impact Reports'];
  const filtered = donors.filter((donor) =>
    `${donor.name} ${donor.city} ${donor.cause}`.toLowerCase().includes(query.toLowerCase())
    && (!type || donor.type === type)
    && (!status || donor.status === status),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="page-header">
        <h1 className="page-title">Donor Directory</h1>
        <p className="page-subtitle">Search, filter, and maintain donor profiles</p>
      </div>

      <div className="card">
        <div className="card-body flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="form-input pl-9" placeholder="Search donor" />
          </div>
          <select value={type} onChange={(event) => setType(event.target.value)} className="form-input !w-auto min-w-[150px]">
            <option value="">All donor types</option>
            <option>Individual</option>
            <option>Corporate</option>
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="form-input !w-auto min-w-[140px]">
            <option value="">All statuses</option>
            {Array.from(new Set(donors.map((donor) => donor.status))).map((value) => <option key={value}>{value}</option>)}
          </select>
          <button className="btn-primary text-sm" onClick={() => setShowAdd(true)}><Plus size={15} /> Add donor</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">All donors</div>
          <button className="btn-secondary text-sm" onClick={() => {
            downloadCsv('donors.csv', [['Name', 'Type', 'City', 'Cause', 'Status', 'Last contact'], ...filtered.map((donor) => [donor.name, donor.type, donor.city, donor.cause, donor.status, donor.lastContact])]);
            notifyModule('Donor list exported as CSV');
          }}><Download size={15} /> Export CSV</button>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="data-table min-w-[820px] w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>City</th>
                <th>Cause</th>
                <th>Status</th>
                <th>Last contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((donor) => (
                <tr key={donor.id}>
                  <td><button className="font-semibold text-teal-700 hover:underline" onClick={() => { setSelectedDonor(donor); setProfileTab('Basic Info'); }}>{donor.name}</button></td>
                  <td>{donor.type}</td>
                  <td>{donor.city}</td>
                  <td>{donor.cause}</td>
                  <td><StatusBadge label={donor.status} tone={donor.status === 'Active' ? 'green' : 'blue'} /></td>
                  <td>{donor.lastContact}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-8 text-center text-sm text-slate-500">No donors match your search and filters.</div>}
        </div>
      </div>
      {showAdd && (
        <Dialog title="Add donor" onClose={() => setShowAdd(false)}>
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const name = String(form.get('name') ?? '').trim();
            const type = String(form.get('type') ?? 'Individual');
            const city = String(form.get('city') ?? '').trim();
            const cause = String(form.get('cause') ?? '').trim();
            if (!name || !city || !cause) return;
            setDonors((current) => [...current, { id: Date.now(), name, type, city, cause, status: 'New', relation: 'New', amount: '₹0', lastContact: 'Never' }]);
            setShowAdd(false);
            notifyModule(`${name} added to the donor directory`);
          }}>
            <label className="form-label">Donor name<input required name="name" className="form-input mt-1" placeholder="Name or business" /></label>
            <label className="form-label">Donor type<select name="type" className="form-input mt-1"><option>Individual</option><option>Corporate</option></select></label>
            <label className="form-label">City<input required name="city" className="form-input mt-1" placeholder="City" /></label>
            <label className="form-label">Cause interest<input required name="cause" className="form-input mt-1" placeholder="Education, healthcare..." /></label>
            <button type="submit" className="btn-primary w-full justify-center"><Plus size={15} /> Save donor</button>
          </form>
        </Dialog>
      )}
      {selectedDonor && (
        <Dialog title={selectedDonor.name} onClose={() => setSelectedDonor(null)}>
          <div className="mb-4 flex flex-wrap gap-2">
            {profileTabs.map((tab) => (
              <button key={tab} onClick={() => setProfileTab(tab)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${profileTab === tab ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{tab}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
            {profileTab === 'Basic Info' && <><span className="text-slate-500">Name</span><span>{selectedDonor.name}</span><span className="text-slate-500">Type</span><span>{selectedDonor.type}</span><span className="text-slate-500">Status</span><span>{selectedDonor.status}</span></>}
            {profileTab === 'Contact Info' && <><span className="text-slate-500">Last communication</span><span>{selectedDonor.lastContact}</span><span className="text-slate-500">Preferred channel</span><span>Email and phone</span></>}
            {profileTab === 'Address/Location' && <><span className="text-slate-500">City</span><span>{selectedDonor.city}</span><span className="text-slate-500">Country</span><span>India</span></>}
            {profileTab === 'Relationship Type' && <><span className="text-slate-500">Donor type</span><span>{selectedDonor.type}</span><span className="text-slate-500">Relationship</span><span>{selectedDonor.relation}</span></>}
            {profileTab === 'Connection Source' && <><span className="text-slate-500">Source</span><span>Community referral</span><span className="text-slate-500">First connected</span><span>2024</span></>}
            {profileTab === 'Cause Interests' && <><span className="text-slate-500">Cause interests</span><span>{selectedDonor.cause}</span><span className="text-slate-500">Linked campaign</span><span>School Meals</span></>}
            {profileTab === 'Contribution History' && <><span className="text-slate-500">Total contributions</span><span>{selectedDonor.amount}</span><span className="text-slate-500">Latest contribution</span><span>{selectedDonor.lastContact}</span></>}
            {profileTab === 'Communication History' && <><span className="text-slate-500">Recent contact</span><span>{selectedDonor.lastContact}</span><span className="text-slate-500">Interactions</span><span>Calls, email, and meetings</span></>}
            {profileTab === 'Follow-Up History' && <><span className="text-slate-500">Follow-up status</span><span>Scheduled</span><span className="text-slate-500">Next action</span><span>Donor relationship check-in</span></>}
            {profileTab === 'Impact Reports' && <><span className="text-slate-500">Linked cause</span><span>{selectedDonor.cause}</span><span className="text-slate-500">Latest update</span><span>Quarterly impact summary</span></>}
          </div>
          <button className="btn-secondary mt-4 w-full justify-center" onClick={() => { notifyModule('Opening linked Birthday Project profiles'); navigate('/birthday-project/profiles'); }}>View linked Birthday Project profile</button>
        </Dialog>
      )}
    </div>
  );
}

export function DonorManagementContributions() {
  const [group, setGroup] = useState('Public & Small');
  const [showAdd, setShowAdd] = useState(false);
  const [records, setRecords] = usePersistentState('donor-management.contributions', [
    { donor: 'Asha Nair', category: 'Online Donations', amount: 25000, date: '09 Oct 2026' },
    { donor: 'Sparsh Foods Pvt Ltd', category: 'CSR Funds', amount: 450000, date: '04 Oct 2026' },
    { donor: 'Nitin Mehta', category: 'Crowdfunding', amount: 12500, date: '01 Oct 2026' },
  ]);
  const categories: Record<string, string[]> = {
    'Public & Small': ['Crowdfunding', 'Donation Boxes', 'Fundraising Events', 'Online Donations', 'Material Donations', 'Time/Volunteer Donations'],
    'Corporate & Large': ['CSR Funds', 'International CSR', 'Employee Giving', 'Matching Funds', 'Brand Sponsorships', 'NGO/Government Grants', 'Foreign Grants', 'Auctions', 'Bequests', 'Family Philanthropy'],
    'Self-Funding': ['Social Businesses', 'Mission-Linked Services', 'Session/Training Fees', 'Course Fees', 'Memberships', 'Corpus/Endowment', 'Awards', 'Social Media Income'],
  };
  const visibleRecords = records.filter((record) => categories[group].includes(record.category));
  const groupTotal = visibleRecords.reduce((total, record) => total + record.amount, 0);
  const largestContribution = Math.max(0, ...visibleRecords.map((record) => record.amount));
  const categoryTotals = categories[group].map((name) => ({
    name,
    total: visibleRecords.filter((record) => record.category === name).reduce((sum, record) => sum + record.amount, 0),
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="page-header !mb-0">
          <h1 className="page-title">Contributions & Donations</h1>
          <p className="page-subtitle">Track public, corporate, and self-funded contribution streams</p>
        </div>
        <button className="btn-primary text-sm" onClick={() => setShowAdd(true)}><Plus size={15} /> Add contribution</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.keys(categories).map((name) => <button key={name} onClick={() => setGroup(name)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${group === name ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 shadow-sm hover:bg-teal-50'}`}>{name}</button>)}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<CircleDollarSign size={18} />} label={`${group} total`} value={`₹${groupTotal.toLocaleString('en-IN')}`} sub="Recorded contributions" tone="teal" />
        <StatCard icon={<Users size={18} />} label="Contributions logged" value={String(visibleRecords.length)} sub="In this stream" tone="blue" />
        <StatCard icon={<TrendingUp size={18} />} label="Largest contribution" value={`₹${largestContribution.toLocaleString('en-IN')}`} sub="In this stream" tone="amber" />
        <StatCard icon={<CheckCircle2 size={18} />} label="Categories" value={String(categories[group].length)} sub="Available in this stream" tone="green" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {categoryTotals.map(({ name, total }) => (
          <div key={name} className="card">
            <div className="card-body cursor-pointer hover:bg-teal-50/40" onClick={() => notifyModule(`${name} category selected`)}>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-800">{name}</div>
                <StatusBadge label="Live" tone="teal" />
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div className="text-sm text-slate-600">Total: ₹{total.toLocaleString('en-IN')}</div>
                <div className="flex h-9 items-end gap-1" aria-label={`${name} activity chart`}>
                  {[35, 60, 42, 75, 54, 92].map((height, bar) => <span key={bar} className="w-2 rounded-t bg-teal-400" style={{ height: `${height}%` }} />)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <SectionHeader title={`${group} contribution records`} subtitle="Recent contributions in this stream" actions={<button className="btn-secondary text-sm" onClick={() => downloadCsv('contributions.csv', [['Donor', 'Category', 'Amount', 'Date'], ...visibleRecords.map((record) => [record.donor, record.category, String(record.amount), record.date])])}><Download size={14} /> Export CSV</button>} />
        <div className="card-body overflow-x-auto">
          <table className="data-table min-w-[600px] w-full"><thead><tr><th>Donor</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>{visibleRecords.map((record) => <tr key={`${record.donor}-${record.date}`}><td>{record.donor}</td><td>{record.category}</td><td>₹{record.amount.toLocaleString('en-IN')}</td><td>{record.date}</td></tr>)}</tbody>
          </table>
          {visibleRecords.length === 0 && <div className="py-6 text-center text-sm text-slate-500">No contribution records in this group yet.</div>}
        </div>
      </div>
      {showAdd && (
        <Dialog title="Add contribution" onClose={() => setShowAdd(false)}>
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const donor = String(form.get('donor') ?? '').trim();
            const category = String(form.get('category') ?? categories[group][0]);
            const amount = Number(form.get('amount'));
            if (!donor || !Number.isFinite(amount) || amount <= 0) return;
            const date = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date());
            setRecords((current) => [{ donor, category, amount, date }, ...current]);
            setShowAdd(false);
            notifyModule('Contribution saved');
          }}>
            <label className="form-label">Donor<input required name="donor" className="form-input mt-1" placeholder="Donor name" /></label>
            <label className="form-label">Category<select name="category" className="form-input mt-1">{categories[group].map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="form-label">Amount (₹)<input required min="1" step="1" type="number" name="amount" className="form-input mt-1" placeholder="15000" /></label>
            <button type="submit" className="btn-primary w-full justify-center"><Plus size={15} /> Save contribution</button>
          </form>
        </Dialog>
      )}
    </div>
  );
}

export function DonorManagementCampaigns() {
  const [status, setStatus] = useState('All');
  const [showCause, setShowCause] = useState(false);
  const [causes, setCauses] = useState(causeData);
  const [selected, setSelected] = useState<(typeof campaignData)[number] | null>(null);
  const visibleCampaigns = campaignData.filter((campaign) => status === 'All' || campaign.status === status);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="page-header !mb-0">
          <h1 className="page-title">Campaigns & Causes</h1>
          <p className="page-subtitle">Active campaigns, cause details, and donor-to-impact connections</p>
        </div>
        <div className="flex gap-2">
          <select className="form-input !w-auto" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter campaigns by status">
            {['All', 'Active', 'Upcoming', 'Completed'].map((value) => <option key={value}>{value}</option>)}
          </select>
          <button className="btn-primary text-sm" onClick={() => setShowCause(true)}><Plus size={15} /> Add cause</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {visibleCampaigns.map((campaign) => (
          <button key={campaign.name} onClick={() => setSelected(campaign)} className="card text-left transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="card-header">
              <div className="card-title">{campaign.name}</div>
              <StatusBadge label={campaign.status} tone={campaign.status === 'Active' ? 'green' : 'blue'} />
            </div>
            <div className="card-body">
              <div className="mb-2 flex justify-between text-sm text-slate-600"><span>Goal progress</span><span>{campaign.progress}%</span></div>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-teal-500" style={{ width: `${campaign.progress}%` }} />
              </div>
              <div className="mt-4 text-sm text-slate-600">Raised: {campaign.amount}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="card">
        <SectionHeader title="Cause portfolio" subtitle="Top impact areas" actions={<span className="badge badge-teal">Shared donor records</span>} />
        <div className="card-body overflow-x-auto">
          <table className="data-table min-w-[600px] w-full">
            <thead>
              <tr>
                <th>Cause</th>
                <th>Donors</th>
                <th>Budget</th>
              </tr>
            </thead>
            <tbody>
              {causes.map((cause) => (
                <tr key={cause.name}>
                  <td>{cause.name}</td>
                  <td>{cause.donors}</td>
                  <td>{cause.budget}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <SectionHeader title="Donor mapping" subtitle="Relationships across causes, projects, and campaigns" />
        <div className="card-body grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { donor: 'Asha Nair', cause: 'Education Access', campaign: 'School Meals' },
            { donor: 'Sparsh Foods Pvt Ltd', cause: 'Women Empowerment', campaign: 'Women Skill Up' },
            { donor: 'Nitin Mehta', cause: 'Healthcare Outreach', campaign: 'Health Outreach' },
          ].map((link) => <div key={link.donor} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="font-semibold text-slate-800">{link.donor}</div><div className="my-2 h-px bg-slate-200" /><div className="text-xs text-slate-500">Cause → {link.cause}</div><div className="mt-1 text-xs text-teal-700">Campaign → {link.campaign}</div></div>)}
        </div>
      </div>
      {selected && (
        <Dialog title={selected.name} onClose={() => setSelected(null)}>
          <div className="mb-2 flex justify-between text-sm text-slate-600"><span>Funding progress</span><span>{selected.progress}%</span></div>
          <div className="h-3 rounded-full bg-slate-200"><div className="h-3 rounded-full bg-teal-500" style={{ width: `${selected.progress}%` }} /></div>
          <p className="mt-4 text-sm text-slate-600">Funds raised: {selected.amount}. Linked causes and project contributions are shown in Donor Mapping.</p>
          <button className="btn-secondary mt-4 w-full justify-center" onClick={() => notifyModule(`Campaign report opened for ${selected.name}`)}><Eye size={15} /> View campaign report</button>
        </Dialog>
      )}
      {showCause && (
        <Dialog title="Add cause" onClose={() => setShowCause(false)}>
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const name = String(form.get('name') ?? '').trim();
            const budget = Number(form.get('budget'));
            if (!name || !Number.isFinite(budget) || budget <= 0) return;
            setCauses((current) => [...current, { name, donors: 0, budget: `₹${budget.toLocaleString('en-IN')}` }]);
            setShowCause(false);
            notifyModule(`Cause "${name}" created`);
          }}>
            <label className="form-label">Cause name<input required name="name" className="form-input mt-1" placeholder="Cause name" /></label>
            <label className="form-label">Budget (₹)<input required min="1" type="number" name="budget" className="form-input mt-1" placeholder="500000" /></label>
            <button type="submit" className="btn-primary w-full justify-center"><Plus size={15} /> Save cause</button>
          </form>
        </Dialog>
      )}
    </div>
  );
}

export function DonorManagementCommunication() {
  const [logs, setLogs] = useState(communicationTimeline);

  return (
    <div className="flex flex-col gap-5">
      <div className="page-header">
        <h1 className="page-title">Communication & Relationships</h1>
        <p className="page-subtitle">Interaction logs, donor journey tracking, and post-donation engagement</p>
      </div>

      <div className="card">
        <SectionHeader title="Communication timeline" subtitle="Donor-wise engagement history" actions={
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" onClick={() => {
              setLogs((current) => [{ date: 'Today', action: 'Call logged by staff', type: 'Call' }, ...current]);
              notifyModule('Call added to communication history');
            }}><Phone size={14} /> Log call</button>
            <button className="btn-primary text-sm" onClick={() => {
              setLogs((current) => [{ date: 'Today', action: 'Email sent to donor', type: 'Email' }, ...current]);
              notifyModule('Email added to communication history');
            }}><Mail size={14} /> Log email</button>
          </div>
        } />
        <div className="card-body space-y-3">
          {logs.map((item, index) => (
            <div key={`${item.date}-${index}`} className="flex gap-3 rounded-xl border border-slate-200 p-3">
              <div className={`w-2 rounded-full ${item.type === 'Call' ? 'bg-amber-400' : item.type === 'Meeting' ? 'bg-blue-500' : 'bg-teal-500'}`} />
              <div>
                <div className="text-xs text-slate-500">{item.date}</div>
                <div className="font-medium text-slate-700">{item.action}</div>
                <div className="mt-1 text-xs text-slate-500">{item.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DonorManagementFollowUp() {
  const [pipeline, setPipeline] = usePersistentState('donor-management.pipeline', donorPipeline);
  const lanes = pipeline.map((lane) => lane.lane);

  const moveDonor = (donor: string, nextLane: string) => {
    setPipeline((current) => current.map((lane) => ({
      ...lane,
      items: lane.lane === nextLane
        ? lane.items.includes(donor) ? lane.items : [...lane.items, donor]
        : lane.items.filter((item) => item !== donor),
    })));
    notifyModule(`${donor} moved to ${nextLane}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="page-header">
        <h1 className="page-title">Follow-Up & Action Planning</h1>
        <p className="page-subtitle">Kanban pipeline and reminder-based donor engagement planning</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {pipeline.map((lane) => (
          <div key={lane.lane} className="card">
            <div className="card-header">
              <div className="card-title">{lane.lane}</div>
              <span className="badge badge-gray">{lane.items.length}</span>
            </div>
            <div className="card-body min-h-[160px] space-y-2">
              {lane.items.length ? lane.items.map((item) => (
                <div key={item} className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                  <div className="mb-2 text-sm font-medium text-slate-700">{item}</div>
                  <label className="sr-only" htmlFor={`stage-${item}`}>Move {item} to stage</label>
                  <select id={`stage-${item}`} value={lane.lane} onChange={(event) => moveDonor(item, event.target.value)} className="form-input !py-1 text-xs">
                    {lanes.map((stage) => <option key={stage}>{stage}</option>)}
                  </select>
                </div>
              )) : <div className="text-sm text-slate-500 italic">No records</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Follow-up reminders', count: '18 due this week', icon: <BellRing size={17} /> },
          { label: 'Donation reminders', count: '7 pledge check-ins', icon: <CircleDollarSign size={17} /> },
          { label: 'Communication reminders', count: '12 messages planned', icon: <MessageSquare size={17} /> },
        ].map((item) => <div key={item.label} className="card"><div className="card-body flex items-center gap-3"><div className="rounded-xl bg-teal-50 p-3 text-teal-700">{item.icon}</div><div><div className="font-semibold text-slate-800">{item.label}</div><div className="text-xs text-slate-500">{item.count}</div></div></div></div>)}
      </div>
    </div>
  );
}

export function DonorManagementReports() {
  const [period, setPeriod] = useState('Quarterly');
  const reports = ['Donor report', 'Donation report', 'Campaign performance', 'Financial summary'];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header !mb-0">
          <h1 className="page-title">Reports & Export</h1>
          <p className="page-subtitle">Donor growth, donation trends, campaign performance, and export-ready summary packets</p>
        </div>
        <select className="form-input !w-auto" value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Report period">
          {['Monthly', 'Quarterly', 'Yearly'].map((value) => <option key={value}>{value}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp size={18} />} label="Growth" value="18.4%" sub="Year-on-year" tone="teal" />
        <StatCard icon={<Users size={18} />} label="Retention" value="76%" sub="Active donors" tone="blue" />
        <StatCard icon={<CircleDollarSign size={18} />} label="Donation trend" value="₹2.8Cr" sub="This quarter" tone="green" />
        <StatCard icon={<Download size={18} />} label="Exports" value="12" sub="Ready to share" tone="purple" />
      </div>

      <div className="card">
        <SectionHeader title="Audit & transparency" subtitle="Historical records and contribution log review" actions={<button className="btn-primary text-sm" onClick={() => {
          downloadCsv('donor-reports.csv', [['Report', 'Period', 'Owner', 'Status'], ...reports.map((report) => [report, period, 'Operations', 'Final'])]);
          notifyModule(`${period} reports downloaded as CSV`);
        }}><Download size={15} /> Export reports</button>} />
        <div className="card-body overflow-x-auto">
          <table className="data-table min-w-[600px] w-full">
            <thead>
              <tr>
                <th>Report</th>
                <th>Period</th>
                <th>Owner</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((item, index) => (
                <tr key={item}>
                  <td>{item}</td>
                  <td>{index === 0 ? 'Q3' : 'Q2'}</td>
                  <td>Operations</td>
                  <td><StatusBadge label="Final" tone="green" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
