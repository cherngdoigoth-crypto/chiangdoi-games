import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { errorMessage } from '../lib/api';
import { Notice } from '../components/ui';

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-field font-display text-xl font-bold text-white">26</span>
          <span><span className="block font-display text-xl font-bold">เชิงดอยเกมส์</span><span className="text-sm text-muted">ระบบบริหารคะแนน</span></span>
        </Link>
        <div className="card p-6">
          <h1 className="mb-4 text-xl font-bold">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (user && !user.mustChangePassword) return <Navigate to="/staff" replace />;
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const me = await login(u, p);
      nav(me.mustChangePassword ? '/change-password' : loc.state?.from ?? '/staff', { replace: true });
    } catch (ex) { setErr(errorMessage(ex)); } finally { setBusy(false); }
  };
  return (
    <Shell title="เข้าสู่ระบบเจ้าหน้าที่">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="username">ชื่อผู้ใช้</label><input id="username" className="input" autoComplete="username" autoCapitalize="none" value={u} onChange={(e) => setU(e.target.value)} required /></div>
        <div><label className="label" htmlFor="password">รหัสผ่าน</label><input id="password" type="password" className="input" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} required /></div>
        {err && <Notice tone="danger">{err}</Notice>}
        <button className="btn btn-primary btn-lg w-full" disabled={busy}>{busy ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}</button>
        <p className="text-center text-xs text-muted">บัญชีสร้างโดยผู้ดูแลระบบ หากลืมรหัสผ่านให้ติดต่อผู้ดูแล</p>
      </form>
    </Shell>
  );
}

export function PasswordForm({ onDone }: { onDone?: () => void }) {
  const { changePassword } = useAuth();
  const [oldPw, setOld] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setOk(false);
    if (pw !== pw2) { setErr('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน'); return; }
    setBusy(true);
    try { await changePassword(oldPw, pw); setOk(true); setOld(''); setPw(''); setPw2(''); onDone?.(); } catch (ex) { setErr(errorMessage(ex)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label className="label" htmlFor="old-pw">รหัสผ่านปัจจุบัน</label><input id="old-pw" type="password" className="input" autoComplete="current-password" value={oldPw} onChange={(e) => setOld(e.target.value)} required /></div>
      <div><label className="label" htmlFor="new-pw">รหัสผ่านใหม่</label><input id="new-pw" type="password" className="input" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} />
        <p className="mt-1 text-xs text-muted">อย่างน้อย 8 ตัว มีทั้งตัวเลขและตัวอักษร ห้ามใช้รหัสร่วมกับผู้อื่น</p></div>
      <div><label className="label" htmlFor="new-pw2">ยืนยันรหัสผ่านใหม่</label><input id="new-pw2" type="password" className="input" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required /></div>
      {err && <Notice tone="danger">{err}</Notice>}
      {ok && <Notice tone="success">เปลี่ยนรหัสผ่านเรียบร้อย</Notice>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'เปลี่ยนรหัสผ่าน'}</button>
    </form>
  );
}

export function ChangePassword() {
  const { user, token, checking } = useAuth();
  const nav = useNavigate();
  if (!checking && !token) return <Navigate to="/login" replace />;
  return (
    <Shell title="ตั้งรหัสผ่านใหม่">
      {user?.mustChangePassword && <div className="mb-4"><Notice tone="warn">บัญชีนี้ใช้รหัสผ่านชั่วคราว กรุณาตั้งรหัสผ่านของคุณเองก่อนใช้งาน</Notice></div>}
      <PasswordForm onDone={() => nav('/staff', { replace: true })} />
    </Shell>
  );
}
