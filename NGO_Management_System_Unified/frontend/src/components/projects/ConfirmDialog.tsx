import type { ReactNode } from 'react';
import Modal from './Modal';

interface Props { open: boolean; title: string; message: ReactNode; confirmLabel?: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onCancel: () => void }

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, busy, onConfirm, onCancel }: Props) {
  return (
    <Modal open={open} title={title} onClose={onCancel} size="sm"
      footer={<>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className="btn-primary" style={danger ? { background: '#EF4444' } : undefined} onClick={onConfirm} disabled={busy}>{busy ? 'Please wait…' : confirmLabel}</button>
      </>}>
      <div className="text-sm text-slate-600">{message}</div>
    </Modal>
  );
}
