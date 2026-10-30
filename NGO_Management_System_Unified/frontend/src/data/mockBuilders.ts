import type {
  Asset, ExpectedImpact, FundingPlan, ImpactBlock, ImpactKPI, Milestone, OperationItem, Project,
  ProjectPlan, ProjectStatus, ResponsibilityRank, DepartmentKey, SameFieldNgo, Stage, StageNo, StaffTier,
  TeamMember, Partner, Stakeholder, Volunteer, BeneficiaryPlan, FundingSource, CurrentStatus, Geographics,
} from '../types/project';

let counter = 0;
export const nid = (p: string): string => `${p}-${String(++counter).padStart(4, '0')}`;

export const STAGE_TITLES: Record<StageNo, { title: string; description: string }> = {
  0: { title: 'Need assessment & framework planning', description: 'Need assessment, project framework planning' },
  1: { title: 'Planning & proposal to stakeholders', description: 'Planning project, proposal presented to stakeholders' },
  2: { title: 'Preparedness, team building & beneficiary selection', description: 'Project preparedness, team building & beneficiary selection' },
  3: { title: 'Execute project, M&E', description: 'Execute project with monitoring & evaluation' },
  4: { title: 'Restructure for impact efficiency', description: 'Restructure project with customised response for impact efficiency' },
  5: { title: 'Scalable & replicable model', description: 'Project at scalable stage, replicable model' },
};

const addDays = (iso: string, d: number): string => {
  const x = new Date(iso); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10);
};
const daysBetween = (a: string, b: string): number => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 864e5);

export function buildStages(start: string, end: string, current: StageNo, curProgress: number, done: boolean): Stage[] {
  const len = daysBetween(start, end) / 6;
  return ([0, 1, 2, 3, 4, 5] as StageNo[]).map(s => {
    const status: Stage['status'] = done || s < current ? 'Completed' : s === current ? 'In Progress' : 'Upcoming';
    return {
      stage: s, title: STAGE_TITLES[s].title, description: STAGE_TITLES[s].description, status,
      startDate: addDays(start, Math.round(len * s)), endDate: addDays(start, Math.round(len * (s + 1)) - 1),
      progress: status === 'Completed' ? 100 : status === 'In Progress' ? curProgress : 0,
    };
  });
}

type KpiT = [name: string, unit: string, target: number, actual: number];
const mkBlock = (desc: string, cat: ImpactKPI['category'], k: KpiT[]): ImpactBlock => ({
  description: desc,
  kpis: k.map(([name, unit, target, actual]) => ({ id: nid('kpi'), name, unit, target, actual, category: cat })),
});

type Pos = [string, number, number];
const tier = (t: StaffTier['tier'], p: Pos[]): StaffTier => ({
  tier: t,
  positions: p.map(([position, quantity, pkg]) => ({ id: nid('stf'), position, quantity, packagePerYear: pkg, totalSalary: quantity * pkg })),
});

export interface PlanInput {
  start: string; end: string; stage: StageNo; stageProgress: number; done?: boolean;
  months: number;
  direct: [string, KpiT[]]; indirect: [string, KpiT[]]; societal: [string, KpiT[]];
  ben: [directCat: string, directNo: number, indirectCat: string, indirectNo: number, process: string, source: string, remark: string];
  milestones: [title: string, stage: StageNo, due: string, status: Milestone['status'], owner: string][];
  team: { core: string; advisory: string; working: string; members: [string, string, TeamMember['group'], string?][] };
  stakeholders: [string, Stakeholder['type'], string][];
  partners: [string, Partner['type'], string][];
  ngos: [string, string, string][];
  volunteers: [string, number][];
  authority: Pos[]; office: Pos[]; field: Pos[];
  frequent: [string, number, number][]; infrequent: [string, number, number][];
  small: [string, number, number][]; big: [string, number, number][];
  funding: {
    p1: [string, number, FundingSource['status']][]; p2: [string, number, FundingSource['status']][]; p3: [string, number, FundingSource['status']][];
    call: string; donors: [string, string[]][]; material: string[]; event: string[]; marketing: string[];
  };
  responsibility: DepartmentKey[];
}

export function buildPlan(c: PlanInput): ProjectPlan {
  const ops: OperationItem[] = [
    ...c.frequent.map(([name, f, cost]): OperationItem => ({ id: nid('op'), type: 'Frequent', name, frequencyPerYear: f, costPerQty: cost, total: f * cost })),
    ...c.infrequent.map(([name, f, cost]): OperationItem => ({ id: nid('op'), type: 'Infrequent', name, frequencyPerYear: f, costPerQty: cost, total: f * cost })),
  ];
  const assets: Asset[] = [
    ...c.small.map(([name, qty, cost]): Asset => ({ id: nid('as'), type: 'Small', name, qty, costPerQty: cost, total: qty * cost })),
    ...c.big.map(([name, qty, cost]): Asset => ({ id: nid('as'), type: 'Big', name, qty, costPerQty: cost, total: qty * cost })),
  ];
  const staff = [tier('Authority', c.authority), tier('Office', c.office), tier('Field', c.field)];
  const flat = staff.flatMap(s => s.positions);
  const volunteers: Volunteer[] = c.volunteers.map(([category, number]) => ({ id: nid('vol'), category, number }));
  const src = (a: [string, number, FundingSource['status']][]): FundingSource[] => a.map(([name, amount, status]) => ({ id: nid('fs'), name, amount, status }));
  const salaries = flat.reduce((s, p) => s + p.totalSalary, 0);
  const total = salaries + ops.reduce((s, o) => s + o.total, 0) + assets.reduce((s, a) => s + a.total, 0);

  const expectedImpact: ExpectedImpact = {
    projectDurationMonths: c.months,
    direct: mkBlock(c.direct[0], 'Direct', c.direct[1]),
    indirect: mkBlock(c.indirect[0], 'Indirect', c.indirect[1]),
    societal: mkBlock(c.societal[0], 'Societal', c.societal[1]),
  };
  const beneficiary: BeneficiaryPlan = {
    directCategory: c.ben[0], directNumber: c.ben[1], indirectCategory: c.ben[2], indirectNumber: c.ben[3],
    selectionProcess: c.ben[4], dataSource: c.ben[5], specialRemark: c.ben[6],
  };
  const funding: FundingPlan = {
    assumedAnnualBudget: total,
    priority1: src(c.funding.p1), priority2: src(c.funding.p2), priority3: src(c.funding.p3),
    publicCallOfAction: c.funding.call,
    potentialDonors: c.funding.donors.map(([stream, donors]) => ({ stream, donors })),
    sponsorship: { material: c.funding.material, event: c.funding.event, marketing: c.funding.marketing },
  };
  const responsibility: ResponsibilityRank[] = c.responsibility.map((department, i) => ({ rank: i + 1, department }));
  return {
    expectedImpact, beneficiary,
    stages: buildStages(c.start, c.end, c.stage, c.stageProgress, !!c.done),
    milestones: c.milestones.map(([title, stage, dueDate, status, owner]) => ({ id: nid('ms'), title, stage, dueDate, status, owner })),
    team: {
      descriptions: { core: c.team.core, advisory: c.team.advisory, working: c.team.working },
      members: c.team.members.map(([name, role, group, organisation]) => ({ id: nid('tm'), name, role, group, organisation, email: `${name.split(' ')[0].toLowerCase()}@hopefoundation.org` })),
      stakeholders: c.stakeholders.map(([name, type, organisation]) => ({ id: nid('sh'), name, type, organisation })),
      partners: c.partners.map(([name, type, role]) => ({ id: nid('pt'), name, type, role })),
      sameFieldNgos: c.ngos.map(([name, website, remark]): SameFieldNgo => ({ id: nid('ngo'), name, website, remark })),
      volunteers,
      totalVolunteers: volunteers.reduce((s, v) => s + v.number, 0),
      staff,
      totalStaff: flat.reduce((s, p) => s + p.quantity, 0),
      totalSalariesA: salaries,
    },
    operations: ops, assets, funding, responsibility,
  };
}

export interface ProjectInput {
  id: string; proposalId: string; name: string; sector: string; why: string; problem: string; sdg: number[];
  currentStatus: CurrentStatus; activeSince: string; geo: Geographics; status: ProjectStatus;
  managerId: string; managerName: string; plan: PlanInput; archivedAt?: string;
}

export function buildProject(i: ProjectInput): Project {
  const plan = buildPlan(i.plan);
  const a = plan.team.totalSalariesA;
  const b = plan.operations.reduce((s, o) => s + o.total, 0);
  const cc = plan.assets.reduce((s, x) => s + x.total, 0);
  const finished = i.status === 'Completed' || i.status === 'Archived';
  return {
    id: i.id, code: i.id.toUpperCase(), proposalId: i.proposalId, name: i.name, sector: i.sector, why: i.why,
    problemStatement: i.problem, sdgGoals: i.sdg, currentStatus: i.currentStatus, activeSince: i.activeSince,
    geographics: i.geo, status: i.status, currentStage: i.plan.stage,
    progress: finished ? 100 : Math.round(((i.plan.stage + i.plan.stageProgress / 100) / 6) * 100),
    managerId: i.managerId, managerName: i.managerName, startDate: i.plan.start, endDate: i.plan.end,
    durationMonths: i.plan.months, totalBudget: a + b + cc, spent: 0,
    directBeneficiaries: plan.beneficiary.directNumber, archivedAt: i.archivedAt, plan,
  };
}
