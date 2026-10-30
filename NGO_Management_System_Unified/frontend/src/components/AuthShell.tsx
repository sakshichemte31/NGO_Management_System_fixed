import type { ReactNode } from 'react';
import logoUrl from '../assets/hope-logo.jpeg';

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[minmax(320px,0.86fr)_1.14fr]" style={{ background: '#F0F5F8' }}>
      <section className="relative flex min-h-[220px] flex-col justify-between overflow-hidden px-6 py-6 text-white sm:px-10 sm:py-8 lg:min-h-screen lg:px-14 lg:py-12" style={{ background: '#0C2337' }}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 top-[30%] h-56 w-56 rounded-full border border-white/10" />
        <div className="relative">
          <img src={logoUrl} alt="Hope Foundation" className="h-auto max-h-24 w-56 object-contain object-left" />
        </div>
        <div className="relative hidden max-w-lg lg:block">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#51CBD0' }}>One mission. One workspace.</p>
          <h1 className="text-4xl font-extrabold leading-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>Make every effort count.</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
            Bring projects, people and community impact into focus with the Hope Foundation workspace.
          </p>
        </div>
        <p className="relative hidden text-xs text-slate-400 lg:block">Hope Foundation · NGO Management System</p>
        <p className="relative text-sm font-semibold text-slate-200 lg:hidden">NGO Management System</p>
      </section>

      <section className="flex min-h-[calc(100vh-220px)] items-center justify-center px-5 py-10 sm:px-8 lg:min-h-screen lg:px-12">
        <div className="card w-full max-w-[440px]">
          <div className="card-body" style={{ padding: 'clamp(24px, 5vw, 40px)' }}>
            <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
            <p className="page-subtitle" style={{ marginBottom: 26 }}>{subtitle}</p>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
