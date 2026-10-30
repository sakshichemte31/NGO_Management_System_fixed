import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedName.length < 2) return setError('Enter your full name.');
    if (!EMAIL_RE.test(normalizedEmail)) return setError('Enter a valid email address.');
    if (password.length < 12) return setError('Use a password with at least 12 characters.');
    if (new TextEncoder().encode(password).length > 128) return setError('Password must be 128 bytes or less.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setError('');
    setBusy(true);
    try {
      await register(normalizedName, normalizedEmail, password);
      navigate('/dashboard', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Set up your Hope Foundation workspace access.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="register-name" className="form-label">Full name</label>
          <div className="relative">
            <UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="register-name" autoComplete="name" className="form-input" style={{ paddingLeft: 36 }} placeholder="Your name"
              value={fullName} onChange={event => setFullName(event.target.value)} disabled={busy} required minLength={2} maxLength={120} />
          </div>
        </div>
        <div>
          <label htmlFor="register-email" className="form-label">Email address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="register-email" type="email" autoComplete="email" className="form-input" style={{ paddingLeft: 36 }} placeholder="you@organisation.org"
              value={email} onChange={event => setEmail(event.target.value)} disabled={busy} required />
          </div>
        </div>
        <div>
          <label htmlFor="register-password" className="form-label">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="register-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="form-input"
              style={{ paddingLeft: 36, paddingRight: 44 }} value={password} onChange={event => setPassword(event.target.value)} disabled={busy} required minLength={12} maxLength={128} />
            <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">At least 12 characters.</p>
        </div>
        <div>
          <label htmlFor="register-confirm" className="form-label">Confirm password</label>
          <input id="register-confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="form-input"
            value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} disabled={busy} required />
        </div>

        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</div>}
        <div className="flex items-start gap-2 rounded-lg px-3 py-3 text-xs leading-5" style={{ background: '#E6F7F9', color: '#0D737B' }}>
          <Lock size={15} className="mt-0.5 shrink-0" />
          <span>New registrations receive Volunteer access. An administrator can assign other roles.</span>
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:cursor-wait disabled:opacity-75" style={{ minHeight: 44, padding: '11px 18px', fontSize: 14.5 }}>
          {busy ? 'Creating account…' : 'Create account'}{!busy && <ArrowRight size={16} aria-hidden="true" />}
        </button>
      </form>

      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold hover:underline" style={{ color: '#0D8A95' }}><ArrowLeft size={15} /> Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
