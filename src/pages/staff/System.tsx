// รีเซ็ตระบบหลังการซ้อม — เฉพาะ Super Admin
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../state/auth';
import { useStaff } from '../../state/live';
import { useUI } from '../../state/ui';
import { errorMessage } from '../../lib/api';
import { ErrorState, Loading, Notice, PageHeader } from '../../components/ui';

interface Preview { scores: number; sheets: number; results: number; playedMatches: number; activeCompetitions: number; users: number; audit: number; backupAvailable: boolean; }
const PHRASE = 'รีเซ็ต';

export default function System() {
  const { call } = useAuth();
  const { data, refresh } = useStaff();
  const { toast, confirm } = useUI();
  const [pv, setPv] = useState<Preview | null>(null);
  const [err, setErr] = useState('');
  const [scope, setScope] = useState<'results' | 'all'>('results');
  const [removeUsers, setRemoveUsers] = useState(false);
  const [clearAudit, setClearAudit] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ backup: string | null; scope: string } | null>(null);

  useEffect(() => { call<Preview>('system.resetPreview').then(setPv).catch((e) => setErr(errorMessage(e))); }, [call, data?.rev]);

  if (err) return <ErrorState message={err} />;
  if (!pv) return <Loading />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const r = await confirm({
      title: scope === 'all' ? 'คืนค่าทั้งระบบเป็นข้อมูลตั้งต้น' : 'ล้างผลการซ้อมทั้งหมด',
      body: 'ทุกเครื่องที่เปิดระบบอยู่จะเห็นข้อมูลชุดใหม่ภายในไม่กี่วินาที การกระทำนี้ย้อนกลับได้จากไฟล์สำรองเท่านั้น',
      confirmLabel: 'รีเซ็ตเดี๋ยวนี้', tone: 'danger',
    });
    if (!r.ok) return;
    setBusy(true);
    try {
      const res = await call<{ backup: string | null; scope: string }>('system.reset', { scope, removeUsers, clearAudit, password, confirmText });
      setDone(res); setPassword(''); setConfirmText('');
      toast('รีเซ็ตระบบเรียบร้อย', 'success');
      refresh();
    } catch (ex) { toast(errorMessage(ex), 'error'); } finally { setBusy(false); }
  };

  const Item = ({ n, label }: { n: number; label: string }) => <li className="flex justify-between gap-3"><span>{label}</span><b className="tabular">{n.toLocaleString('th-TH')}</b></li>;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="รีเซ็ตระบบ" subtitle="ใช้หลังการซ้อม เพื่อเริ่มการแข่งขันจริงด้วยข้อมูลที่สะอาด · เฉพาะ Super Admin" />
      {done && (
        <div className="mb-4">
          <Notice tone="success">
            รีเซ็ตเรียบร้อย ({done.scope === 'all' ? 'คืนค่าทั้งระบบ' : 'ล้างผลการซ้อม'})
            {done.backup && <> · ไฟล์สำรองก่อนรีเซ็ต: <a className="font-semibold underline" href={done.backup} target="_blank" rel="noreferrer">เปิดไฟล์สำรอง</a></>}
          </Notice>
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">เลือกสิ่งที่จะรีเซ็ต</h2>
          <label className={`block cursor-pointer rounded-xl border-2 p-4 ${scope === 'results' ? 'border-field bg-field-soft/40' : 'border-line'}`}>
            <span className="flex items-start gap-3">
              <input type="radio" name="scope" className="mt-1" checked={scope === 'results'} onChange={() => setScope('results')} />
              <span>
                <span className="block font-semibold">ล้างผลการซ้อม (แนะนำ)</span>
                <span className="mt-1 block text-sm text-muted">ลบคะแนน ใบคะแนนกรรมการ ผลที่อนุมัติ/ประกาศ ผลรายนัด และคืนทุกรายการเป็น "ยังไม่เริ่ม" ซ่อนถ้วยรวม
                  · <b>เก็บไว้:</b> บัญชีผู้ใช้ การมอบหมาย เกณฑ์ที่ยืนยันแล้ว การตั้งค่ารายการ กติกาตัดสินเสมอ</span>
              </span>
            </span>
          </label>
          <label className={`block cursor-pointer rounded-xl border-2 p-4 ${scope === 'all' ? 'border-danger bg-danger-soft/40' : 'border-line'}`}>
            <span className="flex items-start gap-3">
              <input type="radio" name="scope" className="mt-1" checked={scope === 'all'} onChange={() => setScope('all')} />
              <span>
                <span className="block font-semibold">คืนค่าทั้งระบบเป็นข้อมูลตั้งต้นจากสูจิบัตร</span>
                <span className="mt-1 block text-sm text-muted">นอกจากล้างผลแล้ว ยังคืนค่ารายการแข่งขัน เกณฑ์ (ต้องกำหนดคะแนนเต็มและยืนยันใหม่) ตารางนัด การตั้งค่าเผยแพร่ และล้างการมอบหมายทั้งหมด</span>
              </span>
            </span>
          </label>
          {scope === 'all' && (
            <div className="space-y-2 pl-2">
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={removeUsers} onChange={(e) => setRemoveUsers(e.target.checked)} />ลบบัญชีผู้ใช้ทั้งหมด ยกเว้น Super Admin ({pv.users} บัญชี)</label>
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={clearAudit} onChange={(e) => setClearAudit(e.target.checked)} />ล้างประวัติการเปลี่ยนแปลงช่วงซ้อม ({pv.audit} รายการ) — การรีเซ็ตครั้งนี้จะยังถูกบันทึก</label>
            </div>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">ข้อมูลที่จะถูกล้าง</h2>
          <ul className="space-y-1 text-sm">
            <Item n={pv.scores} label="ชุดคะแนนของผู้บันทึก" />
            <Item n={pv.sheets} label="ใบคะแนนกรรมการ" />
            <Item n={pv.results} label="ผลที่อนุมัติ/ประกาศแล้ว" />
            <Item n={pv.playedMatches} label="นัดที่บันทึกผลแล้ว" />
            <Item n={pv.activeCompetitions} label="รายการที่จะกลับเป็น &quot;ยังไม่เริ่ม&quot;" />
            {scope === 'all' && removeUsers && <Item n={pv.users} label="บัญชีผู้ใช้ที่จะถูกลบ" />}
            {scope === 'all' && clearAudit && <Item n={pv.audit} label="ประวัติการเปลี่ยนแปลง" />}
          </ul>
          {pv.backupAvailable
            ? <p className="mt-3 text-sm text-field">ระบบจะสำรองสเปรดชีตทั้งไฟล์ไว้ใน Google Drive ก่อนรีเซ็ตเสมอ ถ้าสำรองไม่สำเร็จจะไม่รีเซ็ต</p>
            : <p className="mt-3 text-sm text-warn">ระบบนี้ไม่มีการสำรองอัตโนมัติ (โหมดพัฒนาในเครื่อง)</p>}
        </section>

        <section className="card space-y-3 border-danger/40 p-5">
          <h2 className="text-lg font-bold text-danger">ยืนยันการรีเซ็ต</h2>
          <div><label className="label" htmlFor="rs-pw">รหัสผ่านของคุณ</label><input id="rs-pw" type="password" className="input" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <div><label className="label" htmlFor="rs-text">พิมพ์คำว่า <b>{PHRASE}</b></label><input id="rs-text" className="input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" required /></div>
          <button className="btn btn-danger btn-lg w-full" disabled={busy || !password || confirmText.trim() !== PHRASE}>
            {busy ? 'กำลังสำรองข้อมูลและรีเซ็ต… (อาจใช้เวลาครึ่งนาที)' : scope === 'all' ? 'คืนค่าทั้งระบบ' : 'ล้างผลการซ้อม'}
          </button>
        </section>
      </form>
    </div>
  );
}
