/**
 * Project Management module – domain types.
 * Field names mirror the headings of "Proposals Master Sheet.xlsx" (Sheet1 = planning, Sheet2 = departments).
 * These interfaces are the contract for the backend (see API_CONTRACT.md).
 */

export type Role = 'Admin' | 'Project Manager' | 'Viewer';
export type ProjectStatus = 'Active' | 'Upcoming' | 'Completed' | 'On Hold' | 'Archived';
export type CurrentStatus = 'Ideation' | 'Pilot' | 'Seed' | 'Scale'; // Excel: "Current Status"
export type StageNo = 0 | 1 | 2 | 3 | 4 | 5;
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

/* ───────── Project Overview (Excel: Project Overview) ───────── */
export interface Geographics { stage1: string; stage2: string; stage3: string }

/* ───────── Expected Impact ───────── */
export interface ImpactKPI {
  id: string;
  name: string;
  unit: string;
  target: number;
  actual: number;
  category: 'Direct' | 'Indirect' | 'Societal';
}
export interface ImpactBlock { description: string; kpis: ImpactKPI[] }
export interface ExpectedImpact {
  projectDurationMonths: number;
  direct: ImpactBlock;
  indirect: ImpactBlock;
  societal: ImpactBlock;
}

/* ───────── Beneficiary ───────── */
export interface BeneficiaryPlan {
  directCategory: string;
  directNumber: number;
  indirectCategory: string;
  indirectNumber: number;
  selectionProcess: string;
  dataSource: string;
  specialRemark: string;
}

/* ───────── Stages (0–5) ───────── */
export interface Stage {
  stage: StageNo;
  title: string;
  description: string;
  status: 'Completed' | 'In Progress' | 'Upcoming';
  startDate: string;
  endDate: string;
  progress: number;
}
export interface Milestone {
  id: string;
  title: string;
  stage: StageNo;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Done' | 'Delayed';
  owner: string;
}

/* ───────── Human Resource ───────── */
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  group: 'Core' | 'Advisory' | 'Working';
  organisation?: string;
  email?: string;
}
export interface Stakeholder { id: string; name: string; type: 'Key' | 'Other'; organisation: string }
export interface Partner { id: string; name: string; type: 'Organisation' | 'NGO' | 'Research Body' | 'Government Body'; role: string }
export interface SameFieldNgo { id: string; name: string; website: string; remark: string }
export interface Volunteer { id: string; category: string; number: number }
export interface StaffPosition { id: string; position: string; quantity: number; packagePerYear: number; totalSalary: number }
export interface StaffTier { tier: 'Authority' | 'Office' | 'Field'; positions: StaffPosition[] }
export interface TeamPlan {
  descriptions: { core: string; advisory: string; working: string };
  members: TeamMember[];
  stakeholders: Stakeholder[];
  partners: Partner[];
  sameFieldNgos: SameFieldNgo[];
  volunteers: Volunteer[];
  totalVolunteers: number;
  staff: StaffTier[];
  totalStaff: number;
  totalSalariesA: number;
}

/* ───────── Budget ───────── */
export interface OperationItem {
  id: string;
  type: 'Frequent' | 'Infrequent';
  name: string;
  frequencyPerYear: number;
  costPerQty: number;
  total: number;
}
export interface Asset {
  id: string;
  type: 'Small' | 'Big';
  name: string;
  qty: number;
  costPerQty: number;
  total: number;
}
export interface BudgetSummary {
  salariesA: number;
  operationsB: number;
  assetsC: number;
  total: number; // A + B + C
  spent: number;
  remaining: number;
  spentBySection: { salaries: number; operations: number; assets: number };
}
export interface Expense {
  id: string;
  projectId: string;
  date: string;
  section: 'Salaries' | 'Operations' | 'Assets';
  head: string;
  description: string;
  amount: number;
  paidTo: string;
  addedBy: string;
}
export interface FundingSource { id: string; name: string; amount: number; status: 'Identified' | 'Applied' | 'Committed' | 'Received' }
export interface DonorStream { stream: string; donors: string[] }
export interface FundingPlan {
  assumedAnnualBudget: number;
  priority1: FundingSource[];
  priority2: FundingSource[];
  priority3: FundingSource[];
  publicCallOfAction: string;
  potentialDonors: DonorStream[];
  sponsorship: { material: string[]; event: string[]; marketing: string[] };
}

/* ───────── Responsibility / Departments (Sheet2) ───────── */
export type DepartmentKey =
  | 'admin_legal' | 'hr' | 'marketing' | 'finance' | 'fundraising'
  | 'operations' | 'mel' | 'innovation' | 'data_tech';

export interface ResponsibilityRank { rank: number; department: DepartmentKey | null } // "Department 1 … 7"

export interface ChecklistItem { id: string; label: string; done: boolean; updatedAt?: string }
export interface ChecklistGroup { id: string; title: string; items: ChecklistItem[] }
export interface DepartmentChecklist {
  projectId: string;
  department: DepartmentKey;
  name: string;
  responsible: string;       // person responsible
  priority: number | null;   // 1–7 (Excel Department 1–7) or null = not prioritised
  groups: ChecklistGroup[];
  completion: number;        // derived 0–100
}

/* ───────── Plan wrapper ───────── */
export interface ProjectPlan {
  expectedImpact: ExpectedImpact;
  beneficiary: BeneficiaryPlan;
  stages: Stage[];
  milestones: Milestone[];
  team: TeamPlan;
  operations: OperationItem[];
  assets: Asset[];
  funding: FundingPlan;
  responsibility: ResponsibilityRank[];
}

export interface Project {
  id: string;
  code: string;
  proposalId: string;
  name: string;
  sector: string;
  why: string;
  problemStatement: string;
  sdgGoals: number[];
  currentStatus: CurrentStatus;
  activeSince: string;
  geographics: Geographics;
  status: ProjectStatus;
  currentStage: StageNo;
  progress: number;
  managerId: string;
  managerName: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  totalBudget: number;     // A+B+C, denormalised for list views
  spent: number;
  directBeneficiaries: number;
  archivedAt?: string;
  plan: ProjectPlan;
}

/* ───────── Execution ───────── */
export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Done';
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  owner: string;
  department: DepartmentKey;
  stage: StageNo;
  priority: Priority;
  dueDate: string;
  status: TaskStatus;
}

export type DocStatus = 'Pending' | 'Uploaded' | 'Verified';
export interface DocumentItem {
  id: string;
  projectId: string;
  name: string;
  category: 'Statutory' | 'Project Related' | 'Policy' | 'Special Ask';
  status: DocStatus;
  fileName?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}
export interface ResourceItem { id: string; name: string; kind: 'Small Asset' | 'Big Asset'; qty: number; location: string; custodian: string }

export interface ImpactEntry { id: string; projectId: string; kpiId: string; kpiName: string; date: string; value: number; source: string; note: string; addedBy: string }
export interface ImpactSummary {
  kpis: ImpactKPI[];
  beneficiaries: { directTarget: number; directReached: number; indirectTarget: number; indirectReached: number };
  selectionProcess: string;
  dataSource: string;
  specialRemark: string;
  entries: ImpactEntry[];
}

export interface RiskIssue {
  id: string;
  projectId: string;
  title: string;
  type: 'Risk' | 'Issue';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  owner: string;
  status: 'Open' | 'Mitigating' | 'Resolved' | 'Closed';
  raisedOn: string;
  mitigation: string;
}
export interface ActivityLog {
  id: string;
  projectId: string;
  timestamp: string; // ISO
  actor: string;
  category: 'Status' | 'Task' | 'Budget' | 'Document' | 'Impact' | 'Team' | 'Risk' | 'Department';
  message: string;
}

/* ───────── Proposals eligible for activation ───────── */
export interface ApprovedProposal {
  id: string;
  title: string;
  sector: string;
  submittedBy: string;
  approvedOn: string;
  planningStatus: 'Complete' | 'In Progress' | 'Not Started';
  planningCompletion: number;
  missingSections: string[];
  suggestedManager: string;
  budget?: number;
  summary?: {
    totalBudget: number; salariesA: number; operationsB: number; assetsC: number;
    durationMonths: number; totalStaff: number; totalVolunteers: number;
    directBeneficiaries: number; indirectBeneficiaries: number; stages: number; departments: number;
  };
  templateProjectId?: string; // mock only: which plan template to clone
}
export interface ManagerOption { id: string; name: string }
export interface ActivationInput { startDate: string; managerId: string; checklist: string[] }

/* ───────── Query / report types ───────── */
export interface ProjectFilters {
  tab?: 'all' | 'active' | 'upcoming' | 'completed' | 'archive';
  search?: string;
  status?: ProjectStatus | '';
  sector?: string;
  sdg?: number | '';
  stage?: StageNo | '';
  lead?: string;
}
export type ReportType = 'progress' | 'budget' | 'impact' | 'department' | 'stakeholder';
export interface ReportFilters { projectId?: string; from?: string; to?: string }
export interface ReportData {
  type: ReportType;
  title: string;
  generatedAt: string;
  kpis: { label: string; value: string | number }[];
  chart: { kind: 'bar' | 'pie'; xKey: string; series: { key: string; label: string }[]; data: Record<string, string | number>[] };
  table: { columns: string[]; rows: (string | number)[][] };
}
export interface ProjectListResult { items: Project[]; total: number; stats: { total: number; active: number; upcoming: number; completed: number; archived: number; onHold: number } }

export interface BudgetDetail {
  summary: BudgetSummary;
  staff: StaffTier[];
  totalStaff: number;
  operations: OperationItem[];
  assets: Asset[];
  funding: FundingPlan;
}
export interface ProjectTeamPatch { name: string; role: string; group: TeamMember['group']; organisation?: string; email?: string }
export type NewTask = Omit<Task, 'id' | 'projectId'>;
export type NewExpense = Omit<Expense, 'id' | 'projectId' | 'addedBy'>;
export type NewImpactEntry = Omit<ImpactEntry, 'id' | 'projectId' | 'kpiName' | 'addedBy'>;
export type NewRisk = Omit<RiskIssue, 'id' | 'projectId' | 'raisedOn'>;
export type NewMilestone = Omit<Milestone, 'id'>;
