import { apiCreate, apiDelete, apiList, apiRequest, apiUpdate, type ApiList } from './apiClient';

export const EVENT_TYPES = ['Community', 'Fundraiser', 'Training', 'Outreach', 'Meeting'] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export type EventStatus = 'Scheduled' | 'Completed' | 'Cancelled';
export type AttendanceStatus = 'Registered' | 'Attended' | 'Absent' | 'Cancelled';

export interface EventRecord {
  id: string;
  projectId: string | null;
  projectName: string | null;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string | null;
  location: string;
  capacity: number | null;
  eventType: EventType;
  organizer: string;
  budget: number | null; // null for roles that cannot see finances (Volunteer)
  status: EventStatus;
  registered: number | null;
  attended: number | null;
}

export interface EventInput {
  title: string;
  eventType: EventType;
  startsAt: string;
  endsAt?: string | null;
  location: string;
  organizer: string;
  capacity: number;
  budget: number;
  description?: string;
  status?: EventStatus;
}

export interface EventStats {
  total: number; upcoming: number; overdue: number; completed: number; cancelled: number;
  totalBudget: number | null; upcomingCapacity: number | null; registered: number | null;
}

export interface Registration {
  id: string;
  eventId: string;
  personType: 'user' | 'beneficiary' | 'donor';
  personId: string;
  name: string;
  email: string | null;
  attendanceStatus: AttendanceStatus;
  registeredAt: string;
}

export interface PersonOption { id: string; name: string; email: string | null }

export const listEvents = (params: Record<string, string | number | undefined> = {}) =>
  apiList<EventRecord>('events', { limit: 200, order: 'asc', ...params });
export const getEventStats = () => apiRequest<EventStats>('/events/stats');
export const createEvent = (body: EventInput) => apiCreate<EventRecord>('events', body);
export const updateEvent = (id: string, body: Partial<EventInput>) => apiUpdate<EventRecord>('events', id, body);
export const deleteEvent = (id: string) => apiDelete('events', id);

export const listRegistrations = (eventId: string) => apiRequest<ApiList<Registration> & { capacity: number | null }>(`/events/${eventId}/registrations`);
export const addRegistration = (eventId: string, personType: Registration['personType'], personId: string) =>
  apiCreate<Registration>(`events/${eventId}/registrations`, { personType, personId });
export const setAttendance = (registrationId: string, attendanceStatus: AttendanceStatus) =>
  apiUpdate<Registration>('event-registrations', registrationId, { attendanceStatus });
export const removeRegistration = (registrationId: string) => apiDelete('event-registrations', registrationId);
export const searchPeople = (type: Registration['personType'], search: string) =>
  apiRequest<{ items: PersonOption[] }>(`/events/people?type=${type}&search=${encodeURIComponent(search)}`);

export const inr = (value: number | null) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export interface EventPhoto {
  id: string;
  eventId: string;
  caption: string;
  url: string;
  createdAt: string;
  uploadedByName: string | null;
  uploadedByRole: string | null;
  canDelete: boolean;
}

export const listPhotos = (eventId: string) => apiRequest<{ items: EventPhoto[]; total: number }>(`/events/${eventId}/photos`);
export const deletePhoto = (photoId: string) => apiDelete('event-photos', photoId);
export async function uploadPhoto(eventId: string, file: File, caption: string): Promise<EventPhoto> {
  const form = new FormData();
  form.append('photo', file);
  form.append('caption', caption);
  let response: Response;
  try {
    response = await fetch(`/api/events/${eventId}/photos`, { method: 'POST', credentials: 'include', body: form });
  } catch {
    throw new Error('The server is unavailable. Check your connection and try again.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || (typeof payload.detail === 'string' ? payload.detail : '') || `Upload failed (${response.status}).`);
  return payload as EventPhoto;
}
