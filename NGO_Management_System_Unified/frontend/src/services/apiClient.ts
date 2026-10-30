export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorPayload {
  detail?: string | { msg?: string }[];
  message?: string;
}

export interface ApiList<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'The server is unavailable. Check your connection and try again.');
  }

  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => ({})) as ApiErrorPayload & T;
  if (!response.ok) {
    const detail = typeof payload.detail === 'string'
      ? payload.detail
      : payload.detail?.map((item) => item.msg).filter(Boolean).join(' ');
    throw new ApiError(response.status, payload.message || detail || `Request failed (${response.status}).`);
  }
  return payload;
}

export async function apiList<T>(
  resource: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<ApiList<T>> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<ApiList<T>>(`/${resource}${suffix}`);
}

export function apiCreate<T>(resource: string, body: object): Promise<T> {
  return apiRequest<T>(`/${resource}`, { method: 'POST', body: JSON.stringify(body) });
}

export function apiUpdate<T>(resource: string, id: string | number, body: object): Promise<T> {
  return apiRequest<T>(`/${resource}/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function apiDelete(resource: string, id: string | number): Promise<void> {
  return apiRequest<void>(`/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function downloadApiFile(path: string, filename: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { credentials: 'include' });
  } catch {
    throw new ApiError(0, 'The server is unavailable. Check your connection and try again.');
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as ApiErrorPayload;
    const detail = typeof payload.detail === 'string' ? payload.detail : undefined;
    throw new ApiError(response.status, payload.message || detail || `Export failed (${response.status}).`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
