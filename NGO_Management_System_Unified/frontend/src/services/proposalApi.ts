import { apiCreate, apiRequest, apiUpdate, apiDelete, type ApiList } from './apiClient';

export type ProposalStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Financial Review' | 'Approved' | 'Rejected' | 'Withdrawn';
export type PlanningStatus = 'Not Started' | 'In Progress' | 'Complete';

export interface ProposalRecord {
  id: string;
  proposalCode: string;
  title: string;
  category: string;
  summary: string;
  status: ProposalStatus;
  priority: 'High' | 'Medium' | 'Low';
  estimatedBudget: number;
  expectedBeneficiaries: string;
  startDate: string | null;
  endDate: string | null;
  geography: string;
  reviewNotes: string;
  planningStatus: PlanningStatus;
  planningCompletion: number;
  volunteersRequired: number | null;
  submittedBy: string | null;
  submittedByName: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ProposalList extends ApiList<ProposalRecord> {
  counts: Record<ProposalStatus, number>;
}

export interface ProposalInput {
  title: string;
  category: string;
  estimatedBudget: number;
  expectedBeneficiaries: string;
  startDate: string;
  endDate: string;
  summary?: string;
  geography?: string;
  priority?: 'High' | 'Medium' | 'Low';
  submit?: boolean;
}

export interface SectionMeta { title: string; fields: string[]; required: string[] }
export interface PlanningData {
  proposalId: string;
  proposalCode: string;
  title: string;
  status: ProposalStatus;
  planningStatus: PlanningStatus;
  sections: Record<string, Record<string, string>>;
  departments: { id: string; name: string; responsible: string; notes: string }[];
  completion: Record<string, number>;
  missing: Record<string, string[]>;
  sectionMeta: Record<string, SectionMeta>;
  updatedAt: string;
}

export const listProposals = (params: { status?: string; search?: string } = {}) => {
  const q = new URLSearchParams({ limit: '200' });
  if (params.status && params.status !== 'All') q.set('status', params.status);
  if (params.search) q.set('search', params.search);
  return apiRequest<ProposalList>(`/proposals?${q.toString()}`);
};
export const listApprovedForPlanning = () => apiRequest<{ items: ProposalRecord[]; total: number }>('/planning/proposals');
export const createProposal = (body: ProposalInput) => apiCreate<ProposalRecord>('proposals', body);
export const updateProposal = (id: string, body: Partial<ProposalInput>) => apiUpdate<ProposalRecord>('proposals', id, body);
export const deleteProposal = (id: string) => apiDelete('proposals', id);
export const transitionProposal = (id: string, status: ProposalStatus, notes = '') =>
  apiRequest<ProposalRecord>(`/proposals/${id}/transition`, { method: 'POST', body: JSON.stringify({ status, notes }) });

export const getPlanning = (id: string) => apiRequest<PlanningData>(`/proposals/${id}/planning`);
export const savePlanning = (id: string, body: { sections?: Record<string, Record<string, string>>; departments?: Record<string, { responsible?: string; notes?: string }> }) =>
  apiRequest<PlanningData>(`/proposals/${id}/planning`, { method: 'PUT', body: JSON.stringify(body) });
export const completePlanning = (id: string) => apiRequest<PlanningData>(`/proposals/${id}/planning/complete`, { method: 'POST', body: JSON.stringify({}) });
