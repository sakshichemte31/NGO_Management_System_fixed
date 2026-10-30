import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REMEMBERED_EMAIL_KEY = 'ngo.login.email';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? ''; } catch { return ''; }
  });
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(() => {
    try { return Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY)); } catch { return false; }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const normalizedEmail = email.trim().toLowerCase();
    const nextErrors: { email?: string; password?: string } = {};
    if (!normalizedEmail) nextErrors.email = 'Email address is required.';
    else if (!EMAIL_RE.test(normalizedEmail)) nextErrors.email = 'Enter a valid email address.';
    if (!password) nextErrors.password = 'Password is required.';
    setFieldErrors(nextErrors);
    setError('');
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      await login(normalizedEmail, password);
      try {
        if (rememberEmail) localStorage.setItem(REMEMBERED_EMAIL_KEY, normalizedEmail);
        else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      } catch { /* Email persistence is optional. */ }
      navigate('/dashboard', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to your workspace.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label htmlFor="login-email" className="form-label">Email address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="login-email" type="email" autoComplete="email" className="form-input" style={{ paddingLeft: 36 }}
              placeholder="you@organisation.org" value={email} onChange={event => { setEmail(event.target.value); setFieldErrors(current => ({ ...current, email: undefined })); }}
              aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? 'login-email-error' : undefined} disabled={busy} />
          </div>
          {fieldErrors.email && <p id="login-email-error" role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="login-password" className="form-label">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="form-input"
              style={{ paddingLeft: 36, paddingRight: 44 }} placeholder="Enter your password" value={password}
              onChange={event => { setPassword(event.target.value); setFieldErrors(current => ({ ...current, password: undefined })); }}
              aria-invalid={!!fieldErrors.password} aria-describedby={fieldErrors.password ? 'login-password-error' : undefined} disabled={busy} />
            <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.password && <p id="login-password-error" role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={rememberEmail} onChange={event => setRememberEmail(event.target.checked)} className="h-4 w-4 accent-[#0D8A95]" />
          Remember email on this device
        </label>

        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</div>}

        <button type="submit" disabled={busy} className="btn-primary mt-1 w-full justify-center disabled:cursor-wait disabled:opacity-75" style={{ minHeight: 44, padding: '11px 18px', fontSize: 14.5 }}>
          <LogIn size={16} aria-hidden="true" />{busy ? 'Signing in…' : 'Sign in'}{!busy && <ArrowRight size={16} aria-hidden="true" />}
        </button>
      </form>

      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
        New to Hope Foundation? <Link to="/register" className="font-semibold hover:underline" style={{ color: '#0D8A95' }}>Create an account</Link>
      </p>
    </AuthShell>
  );
}
