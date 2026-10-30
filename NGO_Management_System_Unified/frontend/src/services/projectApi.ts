/**
 * Project Management – service layer.
 * Every function is async and mirrors the signature of the REST endpoint that will replace it.
 * To go live: swap each body for `http<T>(method, url, body)`; no UI code needs to change.
 * Mock mode keeps an in-memory DB (resets on page reload).
 */
import type {
  ActivationInput, ActivityLog, ApprovedProposal, BudgetDetail, DepartmentChecklist, DepartmentKey, DocumentItem, DocStatus,
  Expense, ImpactEntry, ImpactSummary, ManagerOption, Milestone, NewExpense, NewImpactEntry, NewMilestone, NewRisk, NewTask,
  Project, ProjectFilters, ProjectListResult, ProjectTeamPatch, ReportData, ReportFilters, ReportType, ResourceItem, RiskIssue,
  Task, TeamMember, StageNo, ProjectStatus, ImpactKPI, Partner,
} from '../types/project';
import { MOCK_TODAY, buildChecklist, genDocs, seedDb } from '../data/mockSeed';
import { MANAGERS } from '../data/mockProjects';
import { buildStages, nid } from '../data/mockBuilders';
import { DEPARTMENTS } from '../data/departmentTemplates';
import { fmtDate, inr, pct } from '../lib/format';
import { apiRequest } from './apiClient';
import { listProposals } from './proposalApi';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

let db = seedDb();
const LATENCY = 220;
const wait = <T,>(v: T): Promise<T> => new Promise(res => setTimeout(() => res(structuredClone(v)), LATENCY));
const fail = (status: number, msg: string): never => { throw new ApiError(status, msg); };
const proj = (id: string): Project => db.projects.find(p => p.id === id) ?? fail(404, `Project ${id} not found`);
const log = (projectId: string, category: ActivityLog['category'], message: string, actor = 'You'): void => {
  db.activity.unshift({ id: nid('al'), projectId, timestamp: new Date().toISOString(), actor, category, message });
};
const CUMULATIVE_EXCLUDED = ['%', 'rate', 'metres', '₹'];
const allKpis = (p: Project): ImpactKPI[] => [...p.plan.expectedImpact.direct.kpis, ...p.plan.expectedImpact.indirect.kpis, ...p.plan.expectedImpact.societal.kpis];
const recalc = (c: DepartmentChecklist): void => {
  const all = c.groups.flatMap(g => g.items);
  c.completion = all.length ? Math.round((all.filter(i => i.done).length / all.length) * 100) : 0;
};

/* ═════════ Projects ═════════ */

// GET /api/projects?tab=&search=&status=&sector=&sdg=&stage=&lead=
export async function getProjects(f: ProjectFilters = {}): Promise<ProjectListResult> {
  const tabStatus: Record<string, ProjectStatus | undefined> = { active: 'Active', upcoming: 'Upcoming', completed: 'Completed', archive: 'Archived' };
  const q = (f.search ?? '').trim().toLowerCase();
  let items = db.projects.filter(p => (f.tab && f.tab !== 'all' ? p.status === tabStatus[f.tab] : p.status !== 'Archived' || f.status === 'Archived'));
  if (f.status) items = items.filter(p => p.status === f.status);
  if (f.sector) items = items.filter(p => p.sector === f.sector);
  if (f.sdg) items = items.filter(p => p.sdgGoals.includes(Number(f.sdg)));
  if (f.stage !== undefined && f.stage !== '') items = items.filter(p => p.currentStage === Number(f.stage));
  if (f.lead) items = items.filter(p => p.managerName === f.lead);
  if (q) items = items.filter(p => [p.name, p.code, p.managerName, p.sector].some(s => s.toLowerCase().includes(q)));
  const c = (s: ProjectStatus) => db.projects.filter(p => p.status === s).length;
  return wait({ items, total: items.length, stats: { total: db.projects.length - c('Archived'), active: c('Active'), upcoming: c('Upcoming'), completed: c('Completed'), archived: c('Archived'), onHold: c('On Hold') } });
}

// GET /api/projects/:id
export async function getProject(id: string): Promise<Project> { return wait(proj(id)); }

// GET /api/managers
export async function getManagers(): Promise<ManagerOption[]> { return wait(MANAGERS); }

// GET /api/proposals?status=approved&activated=false
const activatedIds = new Set<string>();
let liveProposals: ApprovedProposal[] = [];
export async function getEligibleProposals(): Promise<ApprovedProposal[]> {
  // Proposals approved by an Admin on the Proposals page (live API), plus the few built-in samples.
  try {
    const res = await listProposals({ status: 'Approved' });
    const base = db.projects[0]?.id;
    liveProposals = res.items.filter(p => !activatedIds.has(p.id)).map(p => ({
      id: p.id, title: p.title, sector: p.category, submittedBy: p.submittedByName ?? 'Project Manager',
      approvedOn: (p.reviewedAt ?? p.createdAt).slice(0, 10), planningStatus: p.planningStatus, planningCompletion: p.planningCompletion,
      missingSections: p.planningStatus === 'Complete' ? [] : ['Detailed planning'], suggestedManager: MANAGERS[0]?.id ?? '',
      budget: p.estimatedBudget, templateProjectId: p.planningStatus === 'Complete' ? base : undefined,
    }));
  } catch { liveProposals = []; }
  return wait([...liveProposals, ...db.proposals].map(pr => ({ ...pr, summary: pr.templateProjectId && db.projects.some(x => x.id === pr.templateProjectId) ? summaryOf(proj(pr.templateProjectId), pr.budget) : undefined })));
}
const summaryOf = (p: Project, budget?: number): NonNullable<ApprovedProposal['summary']> => {
  const b = p.plan.operations.reduce((s, o) => s + o.total, 0), c = p.plan.assets.reduce((s, a) => s + a.total, 0);
  return { totalBudget: budget ?? p.totalBudget, salariesA: p.plan.team.totalSalariesA, operationsB: b, assetsC: c, durationMonths: p.durationMonths, totalStaff: p.plan.team.totalStaff,
    totalVolunteers: p.plan.team.totalVolunteers, directBeneficiaries: p.plan.beneficiary.directNumber, indirectBeneficiaries: p.plan.beneficiary.indirectNumber, stages: 6, departments: 9 };
};

// POST /api/projects/from-proposal/:proposalId   body: ActivationInput
export async function createProjectFromProposal(proposalId: string, input: ActivationInput): Promise<Project> {
  const pr = db.proposals.find(x => x.id === proposalId) ?? liveProposals.find(x => x.id === proposalId) ?? fail(404, 'Proposal not found');
  if (pr.planningStatus !== 'Complete' || !pr.templateProjectId) fail(409, 'Final Project Plan is not complete – project cannot be activated.');
  const mgr = MANAGERS.find(m => m.id === input.managerId) ?? fail(422, 'Select a valid project manager');
  if (!input.startDate) fail(422, 'Start date is required');
  const tpl = structuredClone(proj(pr.templateProjectId!));
  const months = tpl.durationMonths;
  const end = new Date(input.startDate); end.setMonth(end.getMonth() + months); end.setDate(end.getDate() - 1);
  const endISO = end.toISOString().slice(0, 10);
  const id = `p-${String(db.projects.length + 1).padStart(3, '0')}`;
  const stages = buildStages(input.startDate, endISO, 1, 0, false);
  const p: Project = {
    ...tpl, id, code: id.toUpperCase(), proposalId, name: pr.title, sector: pr.sector, managerId: mgr.id, managerName: mgr.name,
    startDate: input.startDate, endDate: endISO, activeSince: input.startDate, status: input.startDate > MOCK_TODAY ? 'Upcoming' : 'Active',
    totalBudget: pr.budget ?? tpl.totalBudget, currentStage: 1, progress: 8, spent: 0, currentStatus: 'Ideation', archivedAt: undefined,
    plan: { ...tpl.plan, stages, milestones: tpl.plan.milestones.map((m, i) => ({ ...m, status: 'Pending', dueDate: stages[Math.min(5, m.stage)].endDate, id: nid('ms') + i })) },
  };
  const ei = p.plan.expectedImpact;
  [...ei.direct.kpis, ...ei.indirect.kpis, ...ei.societal.kpis].forEach(k => { k.actual = 0; });
  db.projects.unshift(p);
  DEPARTMENTS.forEach(d => db.checklists.push(buildChecklist(id, d.key, 0, mgr.name, p.plan.responsibility.find(r => r.department === d.key)?.rank ?? null)));
  db.documents.push(...genDocs(p, db.checklists.find(c => c.projectId === id && c.department === 'admin_legal')!));
  db.proposals = db.proposals.filter(x => x.id !== proposalId);
  activatedIds.add(proposalId);
  log(id, 'Status', `Project activated from proposal ${proposalId} (${input.checklist.length} checklist items confirmed)`, mgr.name);
  return wait(p);
}

// PATCH /api/projects/:id
export async function updateProject(id: string, patch: Partial<Pick<Project, 'name' | 'sector' | 'why' | 'problemStatement' | 'sdgGoals' | 'currentStatus' | 'geographics' | 'status' | 'currentStage' | 'progress' | 'managerId' | 'startDate' | 'endDate'>>): Promise<Project> {
  const p = proj(id);
  if (patch.name !== undefined && !patch.name.trim()) fail(422, 'Name is required');
  Object.assign(p, patch);
  if (patch.managerId) p.managerName = MANAGERS.find(m => m.id === patch.managerId)?.name ?? p.managerName;
  if (patch.status === 'Archived') p.archivedAt = MOCK_TODAY;
  if (patch.status && patch.status !== 'Archived') p.archivedAt = undefined;
  if (patch.currentStage !== undefined) {
    p.plan.stages.forEach(s => { s.status = s.stage < p.currentStage ? 'Completed' : s.stage === p.currentStage ? 'In Progress' : 'Upcoming'; s.progress = s.status === 'Completed' ? 100 : s.status === 'Upcoming' ? 0 : s.progress; });
    log(id, 'Status', `Stage moved to Stage ${p.currentStage}`);
  }
  if (patch.status) log(id, 'Status', `Status changed to ${patch.status}`);
  return wait(p);
}

// POST /api/projects/:id/archive
export async function archiveProject(id: string): Promise<Project> { return updateProject(id, { status: 'Archived' }); }

/* ═════════ Timeline ═════════ */

// POST /api/projects/:id/milestones
export async function addMilestone(projectId: string, m: NewMilestone): Promise<Milestone> {
  if (!m.title.trim()) fail(422, 'Title is required');
  const ms: Milestone = { ...m, id: nid('ms') };
  proj(projectId).plan.milestones.push(ms);
  log(projectId, 'Task', `Milestone added: ${m.title}`);
  return wait(ms);
}
// PATCH /api/projects/:id/milestones/:milestoneId
export async function updateMilestone(projectId: string, milestoneId: string, patch: Partial<Milestone>): Promise<Milestone> {
  const ms = proj(projectId).plan.milestones.find(x => x.id === milestoneId) ?? fail(404, 'Milestone not found');
  Object.assign(ms, patch);
  if (patch.status) log(projectId, 'Task', `Milestone "${ms.title}" marked ${patch.status}`);
  return wait(ms);
}
// PATCH /api/projects/:id/stages/:stage   body: { progress }
export async function updateStageProgress(projectId: string, stage: StageNo, progress: number): Promise<Project> {
  const s = proj(projectId).plan.stages.find(x => x.stage === stage) ?? fail(404, 'Stage not found');
  s.progress = Math.max(0, Math.min(100, progress));
  return wait(proj(projectId));
}

/* ═════════ Team ═════════ */

// POST /api/projects/:id/team
export async function assignTeamMember(projectId: string, m: ProjectTeamPatch): Promise<TeamMember> {
  if (!m.name.trim() || !m.role.trim()) fail(422, 'Name and role are required');
  const tm: TeamMember = { ...m, id: nid('tm') };
  proj(projectId).plan.team.members.push(tm);
  log(projectId, 'Team', `${m.name} assigned as ${m.role} (${m.group} team)`);
  return wait(tm);
}
// DELETE /api/projects/:id/team/:memberId
export async function unassignTeamMember(projectId: string, memberId: string): Promise<void> {
  const t = proj(projectId).plan.team;
  const m = t.members.find(x => x.id === memberId) ?? fail(404, 'Member not found');
  t.members = t.members.filter(x => x.id !== memberId);
  log(projectId, 'Team', `${m.name} unassigned from project`);
  return wait(undefined);
}
// POST /api/projects/:id/partners
export async function addPartner(projectId: string, p: Omit<Partner, 'id'>): Promise<Partner> {
  if (!p.name.trim()) fail(422, 'Partner name is required');
  const partner: Partner = { ...p, id: nid('pt') };
  proj(projectId).plan.team.partners.push(partner);
  log(projectId, 'Team', `Working partner added: ${p.name}`);
  return wait(partner);
}
// DELETE /api/projects/:id/partners/:partnerId
export async function removePartner(projectId: string, partnerId: string): Promise<void> {
  const t = proj(projectId).plan.team;
  t.partners = t.partners.filter(x => x.id !== partnerId);
  return wait(undefined);
}

/* ═════════ Tasks ═════════ */

// GET /api/projects/:id/tasks
export async function getTasks(projectId: string): Promise<Task[]> { proj(projectId); return wait(db.tasks.filter(t => t.projectId === projectId)); }
// POST /api/projects/:id/tasks
export async function createTask(projectId: string, t: NewTask): Promise<Task> {
  if (!t.title.trim()) fail(422, 'Title is required');
  const task: Task = { ...t, id: nid('tk'), projectId };
  db.tasks.push(task);
  log(projectId, 'Task', `Task created: ${t.title}`);
  return wait(task);
}
// PATCH /api/projects/:id/tasks/:taskId
export async function updateTask(projectId: string, taskId: string, patch: Partial<NewTask>): Promise<Task> {
  const t = db.tasks.find(x => x.id === taskId && x.projectId === projectId) ?? fail(404, 'Task not found');
  const prev = t.status;
  Object.assign(t, patch);
  if (patch.status && patch.status !== prev) log(projectId, 'Task', `Task "${t.title}" moved to ${patch.status}`);
  return wait(t);
}
// DELETE /api/projects/:id/tasks/:taskId
export async function deleteTask(projectId: string, taskId: string): Promise<void> {
  db.tasks = db.tasks.filter(t => !(t.id === taskId && t.projectId === projectId));
  return wait(undefined);
}

/* ═════════ Budget & expenses ═════════ */

// GET /api/projects/:id/budget
export async function getBudget(projectId: string): Promise<BudgetDetail> {
  const p = proj(projectId);
  const ex = db.expenses.filter(e => e.projectId === projectId);
  const by = (s: Expense['section']) => ex.filter(e => e.section === s).reduce((a, e) => a + e.amount, 0);
  const A = p.plan.team.totalSalariesA, B = p.plan.operations.reduce((s, o) => s + o.total, 0), C = p.plan.assets.reduce((s, a) => s + a.total, 0);
  const spent = by('Salaries') + by('Operations') + by('Assets');
  return wait({
    summary: { salariesA: A, operationsB: B, assetsC: C, total: A + B + C, spent, remaining: A + B + C - spent, spentBySection: { salaries: by('Salaries'), operations: by('Operations'), assets: by('Assets') } },
    staff: p.plan.team.staff, totalStaff: p.plan.team.totalStaff, operations: p.plan.operations, assets: p.plan.assets, funding: p.plan.funding,
  });
}
// GET /api/projects/:id/expenses
export async function getExpenses(projectId: string): Promise<Expense[]> {
  proj(projectId);
  return wait(db.expenses.filter(e => e.projectId === projectId).sort((a, b) => b.date.localeCompare(a.date)));
}
// POST /api/projects/:id/expenses
export async function addExpense(projectId: string, e: NewExpense): Promise<Expense> {
  if (!(e.amount > 0)) fail(422, 'Amount must be greater than zero');
  if (!e.head.trim()) fail(422, 'Expense head is required');
  const p = proj(projectId);
  const ex: Expense = { ...e, id: nid('ex'), projectId, addedBy: 'You' };
  db.expenses.push(ex);
  p.spent += ex.amount;
  log(projectId, 'Budget', `Expense logged: ${inr(ex.amount)} – ${ex.head}`);
  return wait(ex);
}
// DELETE /api/projects/:id/expenses/:expenseId
export async function deleteExpense(projectId: string, expenseId: string): Promise<void> {
  const ex = db.expenses.find(e => e.id === expenseId && e.projectId === projectId) ?? fail(404, 'Expense not found');
  db.expenses = db.expenses.filter(e => e.id !== expenseId);
  proj(projectId).spent -= ex.amount;
  log(projectId, 'Budget', `Expense deleted: ${inr(ex.amount)} – ${ex.head}`);
  return wait(undefined);
}

/* ═════════ Departments ═════════ */

// GET /api/projects/:id/departments
export async function getDepartmentChecklist(projectId: string): Promise<DepartmentChecklist[]> {
  proj(projectId);
  return wait(db.checklists.filter(c => c.projectId === projectId));
}
// PATCH /api/projects/:id/departments/:department/items/:itemId   body: { done }
export async function updateChecklistItem(projectId: string, department: DepartmentKey, itemId: string, done: boolean): Promise<DepartmentChecklist> {
  const c = db.checklists.find(x => x.projectId === projectId && x.department === department) ?? fail(404, 'Department not found');
  const it = c.groups.flatMap(g => g.items).find(i => i.id === itemId) ?? fail(404, 'Checklist item not found');
  it.done = done; it.updatedAt = new Date().toISOString();
  recalc(c);
  log(projectId, 'Department', `${c.name}: "${it.label}" ${done ? 'completed' : 'reopened'}`);
  return wait(c);
}
// PATCH /api/projects/:id/departments/:department   body: { responsible?, priority? }  (priority 1–7 is unique per project; assigning swaps)
export async function updateDepartment(projectId: string, department: DepartmentKey, patch: { responsible?: string; priority?: number | null }): Promise<DepartmentChecklist[]> {
  const list = db.checklists.filter(c => c.projectId === projectId);
  const c = list.find(x => x.department === department) ?? fail(404, 'Department not found');
  if (patch.responsible !== undefined) c.responsible = patch.responsible;
  if (patch.priority !== undefined) {
    if (patch.priority !== null) { const other = list.find(x => x.priority === patch.priority && x.department !== department); if (other) other.priority = c.priority; }
    c.priority = patch.priority;
    proj(projectId).plan.responsibility = Array.from({ length: 7 }, (_, i) => ({ rank: i + 1, department: list.find(x => x.priority === i + 1)?.department ?? null }));
    log(projectId, 'Department', `${c.name} priority set to ${patch.priority ?? 'none'}`);
  }
  return wait(list);
}

/* ═════════ Documents & resources ═════════ */

// GET /api/projects/:id/documents
export async function getDocuments(projectId: string): Promise<DocumentItem[]> { proj(projectId); return wait(db.documents.filter(d => d.projectId === projectId)); }
// POST /api/projects/:id/documents/:docId/upload   (multipart – mock sends file name only)
export async function uploadDocument(projectId: string, docId: string, fileName: string): Promise<DocumentItem> {
  const d = db.documents.find(x => x.id === docId && x.projectId === projectId) ?? fail(404, 'Document not found');
  d.fileName = fileName; d.status = 'Uploaded'; d.uploadedAt = MOCK_TODAY; d.uploadedBy = 'You';
  log(projectId, 'Document', `Document uploaded: ${d.name}`);
  return wait(d);
}
// PATCH /api/projects/:id/documents/:docId   body: { status }
export async function setDocumentStatus(projectId: string, docId: string, status: DocStatus): Promise<DocumentItem> {
  const d = db.documents.find(x => x.id === docId && x.projectId === projectId) ?? fail(404, 'Document not found');
  if (status !== 'Pending' && !d.fileName) fail(409, 'Upload a file before changing status');
  d.status = status;
  if (status === 'Pending') { d.fileName = undefined; d.uploadedAt = undefined; d.uploadedBy = undefined; }
  log(projectId, 'Document', `Document "${d.name}" marked ${status}`);
  return wait(d);
}
// GET /api/projects/:id/resources
export async function getResources(projectId: string): Promise<ResourceItem[]> {
  const p = proj(projectId);
  return wait(p.plan.assets.map(a => ({ id: a.id, name: a.name, kind: a.type === 'Small' ? 'Small Asset' : 'Big Asset', qty: a.qty, location: p.geographics.stage1, custodian: p.managerName } as ResourceItem)));
}

/* ═════════ Impact ═════════ */

// GET /api/projects/:id/impact
export async function getImpact(projectId: string): Promise<ImpactSummary> {
  const p = proj(projectId);
  const b = p.plan.beneficiary;
  const entries = db.impact.filter(e => e.projectId === projectId).sort((a, c) => c.date.localeCompare(a.date));
  const reached = (cat: 'Direct' | 'Indirect') => {
    const ks = allKpis(p).filter(k => k.category === cat && !CUMULATIVE_EXCLUDED.includes(k.unit));
    return ks.length ? Math.max(...ks.map(k => k.actual)) : 0;
  };
  return wait({
    kpis: allKpis(p),
    beneficiaries: { directTarget: b.directNumber, directReached: Math.min(b.directNumber, reached('Direct')), indirectTarget: b.indirectNumber, indirectReached: Math.min(b.indirectNumber, reached('Indirect') * 4) },
    selectionProcess: b.selectionProcess, dataSource: b.dataSource, specialRemark: b.specialRemark, entries,
  });
}
// POST /api/projects/:id/impact/entries   (count KPIs accumulate; %, rate, metres, ₹ KPIs take the latest reading)
export async function addImpactEntry(projectId: string, e: NewImpactEntry): Promise<ImpactEntry> {
  const p = proj(projectId);
  const k = allKpis(p).find(x => x.id === e.kpiId) ?? fail(422, 'Select a KPI');
  if (!Number.isFinite(e.value) || e.value < 0) fail(422, 'Enter a valid value');
  k.actual = CUMULATIVE_EXCLUDED.includes(k.unit) ? e.value : k.actual + e.value;
  const entry: ImpactEntry = { ...e, id: nid('ie'), projectId, kpiName: k.name, addedBy: 'You' };
  db.impact.push(entry);
  log(projectId, 'Impact', `Impact entry: ${k.name} → ${e.value} ${k.unit}`);
  return wait(entry);
}

/* ═════════ Monitoring ═════════ */

// GET /api/projects/:id/activity
export async function getActivityLog(projectId: string): Promise<ActivityLog[]> { proj(projectId); return wait(db.activity.filter(a => a.projectId === projectId)); }
// GET /api/projects/:id/risks
export async function getRisks(projectId: string): Promise<RiskIssue[]> { proj(projectId); return wait(db.risks.filter(r => r.projectId === projectId)); }
// POST /api/projects/:id/risks
export async function addRisk(projectId: string, r: NewRisk): Promise<RiskIssue> {
  if (!r.title.trim()) fail(422, 'Title is required');
  const risk: RiskIssue = { ...r, id: nid('rk'), projectId, raisedOn: MOCK_TODAY };
  db.risks.push(risk);
  log(projectId, 'Risk', `${r.type} raised: ${r.title} (${r.severity})`);
  return wait(risk);
}
// PATCH /api/projects/:id/risks/:riskId
export async function updateRisk(projectId: string, riskId: string, patch: Partial<NewRisk>): Promise<RiskIssue> {
  const r = db.risks.find(x => x.id === riskId && x.projectId === projectId) ?? fail(404, 'Risk not found');
  Object.assign(r, patch);
  if (patch.status) log(projectId, 'Risk', `"${r.title}" marked ${patch.status}`);
  return wait(r);
}

/* ═════════ Reports ═════════ */

// GET /api/reports/:type?projectId=&from=&to=
export async function getReport(type: ReportType, f: ReportFilters = {}): Promise<ReportData> {
  const params = new URLSearchParams();
  if (f.projectId && /^[0-9a-f-]{36}$/i.test(f.projectId)) params.set('projectId', f.projectId);
  if (f.from) params.set('from', f.from);
  if (f.to) params.set('to', f.to);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<ReportData>(`/reports/${type}${query}`);
  /* Mock report implementation retained below for local reference during service migration.
  const ps = db.projects.filter(p => !f.projectId || p.id === f.projectId);
  const inRange = (d: string) => (!f.from || d >= f.from) && (!f.to || d <= f.to);
  const base = { type, generatedAt: new Date().toISOString() };
  const short = (n: string) => (n.length > 18 ? n.slice(0, 16) + '…' : n);
  if (ps.length === 0) fail(404, 'No projects match the filters');

  if (type === 'progress') {
    const rows = ps.map(p => { const t = db.tasks.filter(x => x.projectId === p.id && inRange(x.dueDate)); return { p, done: t.filter(x => x.status === 'Done').length, total: t.length }; });
    return wait({ ...base, title: 'Project Progress Report',
      kpis: [{ label: 'Projects', value: String(ps.length) }, { label: 'Avg. progress', value: `${Math.round(ps.reduce((s, p) => s + p.progress, 0) / ps.length)}%` },
        { label: 'Tasks done', value: `${rows.reduce((s, r) => s + r.done, 0)} / ${rows.reduce((s, r) => s + r.total, 0)}` }],
      chart: { kind: 'bar', xKey: 'name', series: [{ key: 'progress', label: 'Progress %' }, { key: 'tasks', label: 'Tasks done %' }], data: rows.map(r => ({ name: short(r.p.name), progress: r.p.progress, tasks: pct(r.done, r.total) })) },
      table: { columns: ['Project', 'Status', 'Stage', 'Progress', 'Tasks done', 'Manager', 'End date'], rows: rows.map(r => [r.p.name, r.p.status, `Stage ${r.p.currentStage}`, `${r.p.progress}%`, `${r.done}/${r.total}`, r.p.managerName, fmtDate(r.p.endDate)]) } });
  }
  if (type === 'budget') {
    const rows = ps.map(p => { const spent = db.expenses.filter(e => e.projectId === p.id && inRange(e.date)).reduce((s, e) => s + e.amount, 0); return { p, spent }; });
    const planned = rows.reduce((s, r) => s + r.p.totalBudget, 0), spent = rows.reduce((s, r) => s + r.spent, 0);
    return wait({ ...base, title: 'Budget & Expense Report',
      kpis: [{ label: 'Planned (A+B+C)', value: inr(planned) }, { label: 'Spent', value: inr(spent) }, { label: 'Utilisation', value: `${pct(spent, planned)}%` }],
      chart: { kind: 'bar', xKey: 'name', series: [{ key: 'planned', label: 'Planned' }, { key: 'spent', label: 'Spent' }], data: rows.map(r => ({ name: short(r.p.name), planned: r.p.totalBudget, spent: r.spent })) },
      table: { columns: ['Project', 'Planned', 'Spent', 'Remaining', 'Utilisation'], rows: rows.map(r => [r.p.name, inr(r.p.totalBudget), inr(r.spent), inr(r.p.totalBudget - r.spent), `${pct(r.spent, r.p.totalBudget)}%`]) } });
  }
  if (type === 'impact') {
    const ks = ps.flatMap(p => allKpis(p).map(k => ({ p, k })));
    const ach = ps.map(p => { const k = allKpis(p); return { name: short(p.name), achieved: Math.round(k.reduce((s, x) => s + pct(x.actual, x.target), 0) / Math.max(1, k.length)) }; });
    return wait({ ...base, title: 'Impact Report',
      kpis: [{ label: 'KPIs tracked', value: String(ks.length) }, { label: 'Avg. achievement', value: `${Math.round(ach.reduce((s, a) => s + a.achieved, 0) / ach.length)}%` },
        { label: 'Direct beneficiaries (target)', value: ps.reduce((s, p) => s + p.plan.beneficiary.directNumber, 0).toLocaleString('en-IN') }],
      chart: { kind: 'bar', xKey: 'name', series: [{ key: 'achieved', label: 'KPI achievement %' }], data: ach },
      table: { columns: ['Project', 'KPI', 'Type', 'Target', 'Actual', 'Achieved'], rows: ks.map(({ p, k }) => [short(p.name), k.name, k.category, `${k.target} ${k.unit}`, `${k.actual} ${k.unit}`, `${pct(k.actual, k.target)}%`]) } });
  }
  if (type === 'department') {
    const cl = db.checklists.filter(c => ps.some(p => p.id === c.projectId));
    const rows = DEPARTMENTS.map(d => { const l = cl.filter(c => c.department === d.key); const items = l.flatMap(c => c.groups.flatMap(g => g.items)); return { d, done: items.filter(i => i.done).length, total: items.length }; });
    return wait({ ...base, title: 'Department Readiness Report',
      kpis: [{ label: 'Departments', value: '9' }, { label: 'Checklist items done', value: `${rows.reduce((s, r) => s + r.done, 0)} / ${rows.reduce((s, r) => s + r.total, 0)}` },
        { label: 'Overall completion', value: `${pct(rows.reduce((s, r) => s + r.done, 0), rows.reduce((s, r) => s + r.total, 0))}%` }],
      chart: { kind: 'bar', xKey: 'name', series: [{ key: 'completion', label: 'Completion %' }], data: rows.map(r => ({ name: r.d.short, completion: pct(r.done, r.total) })) },
      table: { columns: ['Department', 'Items done', 'Total items', 'Completion'], rows: rows.map(r => [r.d.name, r.done, r.total, `${pct(r.done, r.total)}%`]) } });
  }
  const rows = ps.map(p => ({ p, t: p.plan.team }));
  return wait({ ...base, title: 'Stakeholder & Partner Report',
    kpis: [{ label: 'Key stakeholders', value: String(rows.reduce((s, r) => s + r.t.stakeholders.filter(x => x.type === 'Key').length, 0)) }, { label: 'Working partners', value: String(rows.reduce((s, r) => s + r.t.partners.length, 0)) },
      { label: 'Volunteers', value: String(rows.reduce((s, r) => s + r.t.totalVolunteers, 0)) }],
    chart: { kind: 'bar', xKey: 'name', series: [{ key: 'stakeholders', label: 'Stakeholders' }, { key: 'partners', label: 'Partners' }, { key: 'ngos', label: 'NGOs in field' }], data: rows.map(r => ({ name: short(r.p.name), stakeholders: r.t.stakeholders.length, partners: r.t.partners.length, ngos: r.t.sameFieldNgos.length })) },
    table: { columns: ['Project', 'Key stakeholders', 'Working partners', 'NGOs in same field', 'Team members', 'Volunteers', 'Staff'], rows: rows.map(r => [r.p.name, r.t.stakeholders.filter(x => x.type === 'Key').length, r.t.partners.length, r.t.sameFieldNgos.length, r.t.members.length, r.t.totalVolunteers, r.t.totalStaff]) } });
  */
}
