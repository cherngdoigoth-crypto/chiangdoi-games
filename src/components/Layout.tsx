import { useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAdmin, canReview, ROLE_LABEL, type Role } from '@domain';
import { useAuth } from '../state/auth';
import { PublicDataProvider, StaffDataProvider, usePublic, useStaff } from '../state/live';
import { ConnectionBadge, Loading } from './ui';
import { API_URL } from '../lib/api';

function Brand({ to }: { to: string }) {
  return (
    <Link to={to} className="flex min-w-0 items-center gap-3">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-field font-display text-lg font-bold text-white">26</span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-display text-lg font-bold">เชิงดอยเกมส์</span>
        <span className="block truncate text-xs text-muted">7–8 พ.ย. 2569 · สนามกีฬาเทศบาลตำบลเชิงดอย</span>
      </span>
    </Link>
  );
}

const navCls = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-field text-white' : 'text-ink hover:bg-turf'}`;

function ConfigWarning() {
  if (API_URL) return null;
  return <div className="bg-warn-soft px-4 py-2 text-center text-sm text-warn">ยังไม่ได้ตั้งค่า VITE_API_URL — ระบบยังไม่เชื่อมต่อฐานข้อมูล ดูวิธีตั้งค่าใน README</div>;
}

/* ---------------- หน้าสาธารณะ ---------------- */
function PublicShell() {
  const live = usePublic();
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <ConfigWarning />
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur no-print">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Brand to="/" />
          <div className="flex items-center gap-2">
            <ConnectionBadge state={live.state} lastSync={live.lastSync} />
            <Link to={user ? '/staff' : '/login'} className="btn btn-sm">{user ? 'เข้าระบบเจ้าหน้าที่' : 'เข้าสู่ระบบ'}</Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2" aria-label="เมนูหลัก">
          <NavLink to="/" end className={navCls}>ถ้วยคะแนนรวม</NavLink>
          <NavLink to="/results" className={navCls}>ผลรายกีฬา</NavLink>
          <NavLink to="/display" className={navCls}>จอแสดงผล</NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6"><Outlet /></main>
    </div>
  );
}
export const PublicLayout = () => <PublicDataProvider><PublicShell /></PublicDataProvider>;

/* ---------------- หน้าเจ้าหน้าที่ ---------------- */
const STAFF_NAV: { to: string; label: string; show: (r: Role) => boolean; end?: boolean }[] = [
  { to: '/staff', label: 'แดชบอร์ด', show: () => true, end: true },
  { to: '/staff/score', label: 'บันทึกคะแนน', show: (r) => r !== 'viewer' },
  { to: '/staff/review', label: 'ตรวจสอบและอนุมัติ', show: canReview },
  { to: '/staff/results', label: 'ผลรายกีฬา', show: () => true },
  { to: '/staff/cup', label: 'ถ้วยรวม', show: () => true },
  { to: '/staff/competitions', label: 'จัดการการแข่งขัน', show: isAdmin },
  { to: '/staff/publication', label: 'เผยแพร่ผล', show: isAdmin },
  { to: '/staff/users', label: 'ผู้ใช้งาน', show: isAdmin },
  { to: '/staff/reports', label: 'รายงาน', show: (r) => r !== 'viewer' },
  { to: '/staff/system', label: 'รีเซ็ตระบบ', show: (r) => r === 'superadmin' },
];

function StaffShell({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  const live = useStaff();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  if (!user) return null;
  const items = STAFF_NAV.filter((n) => n.show(user.role));
  return (
    <div className="min-h-screen">
      <ConfigWarning />
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur no-print">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Brand to="/staff" />
          <div className="flex items-center gap-2">
            <ConnectionBadge state={live.state} lastSync={live.lastSync} />
            <div className="hidden text-right text-xs leading-tight sm:block">
              <div className="font-semibold">{user.displayName}</div>
              <div className="text-muted">{ROLE_LABEL[user.role]}</div>
            </div>
            <button className="btn btn-sm lg:hidden" aria-expanded={open} aria-controls="staff-nav" onClick={() => setOpen((o) => !o)}>เมนู</button>
          </div>
        </div>
        <nav id="staff-nav" className={`mx-auto max-w-7xl gap-1 px-4 pb-2 ${open ? 'flex flex-col' : 'hidden'} lg:flex lg:flex-row lg:overflow-x-auto`} aria-label="เมนูเจ้าหน้าที่" onClick={() => setOpen(false)}>
          {items.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={navCls}>{n.label}</NavLink>)}
          <span className="flex-1" />
          <NavLink to="/" className={navCls}>หน้าสาธารณะ</NavLink>
          <NavLink to="/staff/account" className={navCls}>บัญชีของฉัน</NavLink>
          <button className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-danger-soft" onClick={() => logout()}>ออกจากระบบ</button>
        </nav>
      </header>
      {live.state === 'error' && live.error && <div className="bg-danger-soft px-4 py-2 text-center text-sm text-danger" role="alert">{live.error}</div>}
      <main className="mx-auto max-w-7xl px-4 py-6" key={loc.pathname.split('/')[2] ?? ''}>{children ?? <Outlet />}</main>
    </div>
  );
}

export function StaffLayout() {
  const { user, checking, token } = useAuth();
  const loc = useLocation();
  if (checking) return <Loading label="กำลังตรวจสอบการเข้าสู่ระบบ…" />;
  if (!token || !user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  return <StaffDataProvider><StaffShell /></StaffDataProvider>;
}

/** ห่อหน้าที่ต้องใช้สิทธิ์เฉพาะ */
export function RequireRole({ allow, children }: { allow: (r: Role) => boolean; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !allow(user.role)) return <div className="card p-6 text-center"><p className="font-semibold">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p></div>;
  return <>{children}</>;
}
