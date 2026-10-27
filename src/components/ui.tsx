import type { ReactNode } from 'react';
import { STATUS_LABEL, type CompStatus, type Village } from '@domain';
import type { ConnState } from '../state/live';
import { fmtTime } from '../lib/format';

export function VillageChip({ v, size = 'md', showNo = true }: { v: Village | undefined; size?: 'sm' | 'md' | 'lg'; showNo?: boolean }) {
  if (!v) return <span className="text-muted">–</span>;
  const sw = size === 'lg' ? 'h-5 w-5' : size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className={`${sw} flex-none rounded ring-1 ring-black/15`} style={{ background: v.colorHex }} aria-hidden="true" />
      <span className="min-w-0 truncate">
        {showNo && <span className="mr-1 text-xs text-muted">หมู่ {v.no}</span>}
        {v.name}
      </span>
    </span>
  );
}

const STATUS_STYLE: Record<CompStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  open: 'bg-sky-100 text-sky-800',
  submitted: 'bg-warn-soft text-warn',
  approved: 'bg-violet-100 text-violet-800',
  published: 'bg-field-soft text-field-dark',
  locked: 'bg-ink text-white',
};
export const StatusBadge = ({ status }: { status: CompStatus }) => <span className={`badge ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;

export function Medal({ place, size = 'md' }: { place: number; size?: 'sm' | 'md' | 'lg' }) {
  const bg = place === 1 ? 'bg-gold' : place === 2 ? 'bg-silver' : place === 3 ? 'bg-bronze' : 'bg-slate-200 text-muted';
  const sz = size === 'lg' ? 'h-10 w-10 text-lg' : size === 'sm' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm';
  return <span className={`inline-grid flex-none place-items-center rounded-full font-display font-bold text-white ${bg} ${sz}`}>{place}</span>;
}

const CONN: Record<ConnState, [string, string]> = {
  connecting: ['กำลังเชื่อมต่อ', 'bg-slate-100 text-slate-600'],
  live: ['ข้อมูลสด', 'bg-field-soft text-field-dark'],
  reconnecting: ['กำลังเชื่อมต่อใหม่', 'bg-warn-soft text-warn'],
  offline: ['ออฟไลน์', 'bg-danger-soft text-danger'],
  error: ['เชื่อมต่อไม่ได้', 'bg-danger-soft text-danger'],
};
export function ConnectionBadge({ state, lastSync }: { state: ConnState; lastSync: number | null }) {
  const [label, cls] = CONN[state];
  return (
    <span className={`badge ${cls}`} title={lastSync ? `อัปเดตล่าสุด ${fmtTime(new Date(lastSync).toISOString())}` : undefined}>
      <span className={`h-2 w-2 rounded-full bg-current ${state === 'live' ? 'animate-pulse motion-reduce:animate-none' : ''}`} />
      {label}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 no-print">{actions}</div>}
    </div>
  );
}

export const Loading = ({ label = 'กำลังโหลดข้อมูล…' }: { label?: string }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-field border-t-transparent" />{label}
  </div>
);
export const EmptyState = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="card px-6 py-10 text-center">
    <p className="font-display text-lg font-semibold">{title}</p>
    {children && <div className="mt-2 text-sm text-muted">{children}</div>}
  </div>
);
export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="card border-danger/30 bg-danger-soft px-6 py-6 text-danger" role="alert">
    <p className="font-semibold">โหลดข้อมูลไม่สำเร็จ</p>
    <p className="mt-1 text-sm">{message}</p>
    {onRetry && <button className="btn btn-sm mt-3" onClick={onRetry}>ลองอีกครั้ง</button>}
  </div>
);
export const Notice = ({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'danger' | 'success'; children: ReactNode }) => {
  const cls = tone === 'warn' ? 'bg-warn-soft text-warn border-warn/30' : tone === 'danger' ? 'bg-danger-soft text-danger border-danger/30' : tone === 'success' ? 'bg-field-soft text-field-dark border-field/30' : 'bg-sky-50 text-sky-900 border-sky-200';
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
};

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'warn' | 'good' }) {
  return (
    <div className="card p-4">
      <div className="eyebrow">{label}</div>
      <div className={`mt-1 font-display text-3xl font-bold tabular ${tone === 'warn' ? 'text-warn' : tone === 'good' ? 'text-field' : ''}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

/** ช่องกรอกตัวเลขแบบปุ่มใหญ่ (มือถือ) */
export function NumberStepper({ value, onChange, min = 0, max, step = 1, disabled, id, label, invalid }: {
  value: number | null; onChange: (v: number | null) => void; min?: number; max?: number | null; step?: number; disabled?: boolean; id: string; label: string; invalid?: boolean;
}) {
  const clamp = (n: number) => Math.max(min, max !== null && max !== undefined ? Math.min(max, n) : n);
  return (
    <div className="flex items-stretch gap-1">
      <button type="button" className="btn btn-sm w-11 text-lg" aria-label={`ลด ${label}`} disabled={disabled || (value ?? 0) <= min} onClick={() => onChange(clamp(Math.round(((value ?? 0) - step) * 100) / 100))}>−</button>
      <input id={id} aria-label={label} inputMode="decimal" disabled={disabled}
        className={`input w-20 text-center font-display text-lg font-semibold tabular ${invalid ? 'border-danger ring-2 ring-danger/20' : ''}`}
        value={value ?? ''} placeholder="–"
        onChange={(e) => { const t = e.target.value.trim(); if (t === '') onChange(null); else if (/^-?\d*\.?\d*$/.test(t)) { const n = Number(t); if (!Number.isNaN(n)) onChange(n); } }} />
      <button type="button" className="btn btn-sm w-11 text-lg" aria-label={`เพิ่ม ${label}`} disabled={disabled || (max !== null && max !== undefined && (value ?? 0) >= max)} onClick={() => onChange(clamp(Math.round(((value ?? (min - step)) + step) * 100) / 100))}>+</button>
    </div>
  );
}
