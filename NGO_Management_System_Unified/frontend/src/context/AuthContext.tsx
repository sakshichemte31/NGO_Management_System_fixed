import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: 'Admin' | 'Project Manager' | 'Staff' | 'Volunteer' | 'Board';
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface AuthResponse {
  user?: AuthUser;
  message?: string;
  detail?: string | { msg?: string }[];
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function requestAuth(path: string, body?: object): Promise<AuthResponse> {
  let response: Response;
  try {
    response = await fetch(`/api/auth/${path}`, {
      method: body ? 'POST' : 'GET',
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Authentication service is unavailable. Start the backend and try again.');
  }

  if (response.status === 204) return {};
  const payload = await response.json().catch(() => ({})) as AuthResponse;
  if (!response.ok) {
    const detail = typeof payload.detail === 'string'
      ? payload.detail
      : payload.detail?.map(issue => issue.msg).filter(Boolean).join(' ');
    throw new Error(payload.message || detail || 'Authentication request failed.');
  }
  return payload;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const result = await requestAuth('me');
      setUser(result.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await requestAuth('login', { email, password });
    if (!result.user) throw new Error('Sign-in response did not include an account.');
    setUser(result.user);
  };

  const register = async (fullName: string, email: string, password: string) => {
    const result = await requestAuth('register', { fullName, email, password });
    if (!result.user) throw new Error('Registration response did not include an account.');
    setUser(result.user);
  };

  const logout = async () => {
    try {
      await requestAuth('logout', {});
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within <AuthProvider>.');
  return context;
}
