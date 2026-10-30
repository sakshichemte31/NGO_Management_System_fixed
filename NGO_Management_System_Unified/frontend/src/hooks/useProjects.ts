import * as api from '../services/projectApi';
import type { ProjectFilters } from '../types/project';
import { useAsync } from './useAsync';

export const useProjects = (f: ProjectFilters) => useAsync(() => api.getProjects(f), [JSON.stringify(f)]);
export const useProject = (id: string) => useAsync(() => api.getProject(id), [id]);
export const useManagers = () => useAsync(() => api.getManagers(), []);
export const useEligibleProposals = () => useAsync(() => api.getEligibleProposals(), []);
