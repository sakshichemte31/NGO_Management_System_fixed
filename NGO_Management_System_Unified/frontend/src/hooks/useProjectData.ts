import * as api from '../services/projectApi';
import type { ReportFilters, ReportType } from '../types/project';
import { useAsync } from './useAsync';

/** One hook per REST resource under /api/projects/:id – each exposes { data, loading, error, reload }. */
export const useTasks = (id: string) => useAsync(() => api.getTasks(id), [id]);
export const useBudget = (id: string) => useAsync(() => api.getBudget(id), [id]);
export const useExpenses = (id: string) => useAsync(() => api.getExpenses(id), [id]);
export const useDepartments = (id: string) => useAsync(() => api.getDepartmentChecklist(id), [id]);
export const useDocuments = (id: string) => useAsync(() => api.getDocuments(id), [id]);
export const useResources = (id: string) => useAsync(() => api.getResources(id), [id]);
export const useImpact = (id: string) => useAsync(() => api.getImpact(id), [id]);
export const useActivity = (id: string) => useAsync(() => api.getActivityLog(id), [id]);
export const useRisks = (id: string) => useAsync(() => api.getRisks(id), [id]);
export const useReport = (type: ReportType, f: ReportFilters) => useAsync(() => api.getReport(type, f), [type, f.projectId, f.from, f.to]);
