import { ShieldCheck } from 'lucide-react';
import { useRole } from '../../context/RoleContext';

export default function RoleSwitcher() {
  const { role } = useRole();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500" title="Role from your account">
      <ShieldCheck size={14} /><span>{role}</span>
    </span>
  );
}
