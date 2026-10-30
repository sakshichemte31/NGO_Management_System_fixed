/** ₹ Indian number formatting (en-IN) and "1 Mar 2025" dates. */
export const inr = (n: number): string =>
  '₹' + (Number.isFinite(n) ? n : 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export const inrCompact = (n: number): string => {
  const a = Math.abs(n);
  if (a >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return inr(n);
};

export const num = (n: number): string => (Number.isFinite(n) ? n : 0).toLocaleString('en-IN');

export const fmtDate = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const fmtDateTime = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return `${fmtDate(iso)}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
};

export const pct = (a: number, b: number): number => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);
export const todayISO = (): string => new Date().toISOString().slice(0, 10);
export const uid = (p: string): string => `${p}-${Math.random().toString(36).slice(2, 8)}`;
