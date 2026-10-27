import { useState, type FormEvent } from 'react';
import { ROLE_LABEL, type Role } from '@domain';
import { useStaff } from '../../state/live';
import { useAuth } from '../../state/auth';
import { useAction } from '../../state/useAction';
import { useUI } from '../../state/ui';
import { ErrorState, Loading, PageHeader } from '../../components/ui';

const ROLE_DESC: Record<Role, string> = {
  superadmin: 'จัดการระบบทั้งหมด รวมถึงบัญชีผู้ดูแล',
  admin: 'จัดการรายการ ผู้ใช้ และการเผยแพร่',
  scorekeeper: 'บันทึกคะแนนเฉพาะรายการที่ได้รับมอบหมาย',
  reviewer: 'ตรวจสอบและอนุมัติผล',
  viewer: 'ดูข้อมูลภายในอย่างเดียว',
};

export default function Users() {
  const { data, error, refresh } = useStaff();
  const { user } = useAuth();
  const { run, busy } = useAction();
  const { confirm, toast } = useUI();
  const [f, setF] = useState({ username: '', displayName: '', role: 'scorekeeper' as Role, password: '' });
  if (!data || !user) return error ? <ErrorState message={error} onRetry={refresh} /> : <Loading />;
  const grantable: Role[] = user.role === 'superadmin' ? ['superadmin', 'admin', 'scorekeeper', 'reviewer', 'viewer'] : ['scorekeeper', 'reviewer', 'viewer'];
  const create = async (e: FormEvent) => {
    e.preventDefault();
    await run('users.create', f, `สร้างบัญชี ${f.username} แล้ว — แจ้งรหัสผ่านชั่วคราวให้ผู้ใช้โดยตรง`).then(() => setF({ username: '', displayName: '', role: 'scorekeeper', password: '' })).catch(() => undefined);
  };
  const reset = async (id: string, name: string) => {
    const r = await confirm({ title: `รีเซ็ตรหัสผ่าน: ${name}`, body: 'กรอกรหัสผ่านชั่วคราว (อย่างน้อย 8 ตัว มีตัวเลขและตัวอักษร) ผู้ใช้ต้องเปลี่ยนรหัสเมื่อเข้าสู่ระบบครั้งถัดไป', reason: 'required', reasonLabel: 'รหัสผ่านชั่วคราว', confirmLabel: 'รีเซ็ต' });
    if (r.ok) run('users.resetPassword', { id, password: r.reason }, 'รีเซ็ตรหัสผ่านแล้ว').catch(() => undefined);
  };
  const editable = (role: Role) => user.role === 'superadmin' || !['superadmin', 'admin'].includes(role);
  const assignedTo = (uid: string) => data.assignments.filter((a) => a.scorerId === uid || a.judgeIds.includes(uid)).map((a) => data.competitions.find((c) => c.id === a.competitionId)?.name).filter(Boolean);
  return (
    <>
      <PageHeader title="จัดการผู้ใช้งานและสิทธิ์" subtitle="ทุกคนต้องมีบัญชีของตนเอง ห้ามใช้รหัสผ่านร่วมกัน · มอบหมายรายการได้ที่หน้า &quot;จัดการการแข่งขัน&quot;" />
      <form onSubmit={create} className="card mb-6 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <h2 className="text-lg font-bold sm:col-span-2 lg:col-span-5">สร้างบัญชีใหม่</h2>
        <div><label className="label" htmlFor="u-name">ชื่อผู้ใช้ (อังกฤษ)</label><input id="u-name" className="input" autoCapitalize="none" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} required /></div>
        <div><label className="label" htmlFor="u-display">ชื่อที่แสดง</label><input id="u-display" className="input" value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} required /></div>
        <div><label className="label" htmlFor="u-role">บทบาท</label><select id="u-role" className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>{grantable.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></div>
        <div><label className="label" htmlFor="u-pw">รหัสผ่านชั่วคราว</label><input id="u-pw" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required minLength={8} autoComplete="off" /></div>
        <div className="flex items-end"><button className="btn btn-primary w-full" disabled={!!busy}>สร้างบัญชี</button></div>
        <p className="text-xs text-muted sm:col-span-2 lg:col-span-5">{ROLE_DESC[f.role]}</p>
      </form>
      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>ผู้ใช้</th><th>บทบาท</th><th>รายการที่รับผิดชอบ</th><th>สถานะ</th><th /></tr></thead>
          <tbody>{data.users.map((u) => (
            <tr key={u.id} className={u.active ? '' : 'opacity-60'}>
              <td><div className="font-semibold">{u.displayName}{u.id === user.id && <span className="ml-1 text-xs text-muted">(คุณ)</span>}</div><div className="text-xs text-muted">{u.username}{u.mustChangePassword ? ' · รอเปลี่ยนรหัสผ่าน' : ''}</div></td>
              <td>
                {editable(u.role) && u.id !== user.id ? (
                  <select aria-label={`บทบาทของ ${u.displayName}`} className="rounded-lg border border-line px-2 py-1 text-sm" value={u.role} disabled={!!busy}
                    onChange={async (e) => { const role = e.target.value as Role; if ((await confirm({ title: `เปลี่ยนบทบาท ${u.displayName}`, body: `${ROLE_LABEL[u.role]} → ${ROLE_LABEL[role]} (ผู้ใช้จะต้องเข้าสู่ระบบใหม่)` })).ok) run('users.update', { id: u.id, role }, 'เปลี่ยนบทบาทแล้ว').catch(() => undefined); }}>
                    {(grantable.includes(u.role) ? grantable : [u.role, ...grantable]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                ) : ROLE_LABEL[u.role]}
              </td>
              <td className="max-w-xs text-xs text-muted">{assignedTo(u.id).join(', ') || '–'}</td>
              <td>{u.active ? <span className="badge bg-field-soft text-field-dark">ใช้งาน</span> : <span className="badge bg-slate-100 text-slate-600">ปิดใช้งาน</span>}</td>
              <td className="whitespace-nowrap text-right">
                {editable(u.role) && u.id !== user.id && (
                  <span className="flex justify-end gap-1">
                    <button className="btn btn-sm" disabled={!!busy} onClick={() => reset(u.id, u.displayName)}>รีเซ็ตรหัส</button>
                    <button className="btn btn-sm" disabled={!!busy} onClick={async () => { if ((await confirm({ title: `${u.active ? 'ปิด' : 'เปิด'}ใช้งานบัญชี ${u.displayName}`, tone: u.active ? 'danger' : 'primary' })).ok) run('users.update', { id: u.id, active: !u.active }, u.active ? 'ปิดใช้งานแล้ว' : 'เปิดใช้งานแล้ว').catch(() => undefined); else toast('ยกเลิกแล้ว'); }}>{u.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</button>
                  </span>
                )}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
