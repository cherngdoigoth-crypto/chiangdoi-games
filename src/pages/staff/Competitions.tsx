import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Category, Format } from '@domain';
import { useStaff } from '../../state/live';
import { useAuth } from '../../state/auth';
import { useAction } from '../../state/useAction';
import { ErrorState, Loading, PageHeader, StatusBadge } from '../../components/ui';

const CAT_LABEL: Record<Category, string> = { folk: 'กีฬาพื้นบ้าน', sport: 'กีฬา', contest: 'การประกวด' };
export const FORMAT_LABEL: Record<Format, string> = { placement: 'บันทึกอันดับ', criteria: 'ให้คะแนนตามเกณฑ์', league: 'แบ่งกลุ่มพบกันหมด + น็อคเอาท์', knockout: 'น็อคเอาท์' };

function CreateForm({ onDone }: { onDone: () => void }) {
  const { run, busy } = useAction();
  const { user } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ id: '', name: '', category: 'folk' as Category, format: 'placement' as Format, places: 3, schedule: '', countsForCup: false, reason: '' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const r = await run<{ competition: { id: string } }>('competitions.create', f, 'สร้างรายการแล้ว').catch(() => null);
    if (r) { onDone(); nav(`/staff/competitions/${r.competition.id}`); }
  };
  return (
    <form onSubmit={submit} className="card mb-6 grid gap-3 p-5 sm:grid-cols-2">
      <h2 className="text-lg font-bold sm:col-span-2">สร้างรายการใหม่</h2>
      <div><label className="label" htmlFor="nc-id">รหัสรายการ (อังกฤษ)</label><input id="nc-id" className="input" value={f.id} onChange={(e) => setF({ ...f, id: e.target.value })} placeholder="เช่น tug_m" required /></div>
      <div><label className="label" htmlFor="nc-name">ชื่อรายการ</label><input id="nc-name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div>
      <div><label className="label" htmlFor="nc-cat">หมวด</label><select id="nc-cat" className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Category })}>{Object.entries(CAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <div><label className="label" htmlFor="nc-format">รูปแบบ</label><select id="nc-format" className="input" value={f.format} onChange={(e) => setF({ ...f, format: e.target.value as Format })}>{Object.entries(FORMAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <div><label className="label" htmlFor="nc-places">จำนวนอันดับที่ให้รางวัล</label><select id="nc-places" className="input" value={f.places} onChange={(e) => setF({ ...f, places: Number(e.target.value) })}>{[1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}</select></div>
      <div><label className="label" htmlFor="nc-sched">กำหนดการ</label><input id="nc-sched" className="input" value={f.schedule} onChange={(e) => setF({ ...f, schedule: e.target.value })} /></div>
      {user?.role === 'superadmin' && (
        <div className="sm:col-span-2 space-y-2">
          <label className="flex items-center gap-2 text-sm"><input id="nc-cup" type="checkbox" checked={f.countsForCup} onChange={(e) => setF({ ...f, countsForCup: e.target.checked })} />นับเข้าถ้วยคะแนนรวม (ต้องมีการยืนยันจากผู้จัดอย่างเป็นทางการ)</label>
          {f.countsForCup && <input id="nc-reason" className="input" placeholder="อ้างอิงการยืนยันจากผู้จัด เช่น มติที่ประชุม วันที่" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} required />}
        </div>
      )}
      <div className="flex gap-2 sm:col-span-2"><button className="btn btn-primary" disabled={!!busy}>สร้างรายการ</button><button type="button" className="btn" onClick={onDone}>ยกเลิก</button></div>
    </form>
  );
}

export default function Competitions() {
  const { data, error, refresh } = useStaff();
  const [creating, setCreating] = useState(false);
  if (!data) return error ? <ErrorState message={error} onRetry={refresh} /> : <Loading />;
  const groups: Category[] = ['folk', 'sport', 'contest'];
  return (
    <>
      <PageHeader title="จัดการการแข่งขัน" subtitle="ตั้งค่ารายการ เกณฑ์คะแนน ผู้บันทึก และเปิดรับคะแนน" actions={!creating && <button className="btn btn-primary" onClick={() => setCreating(true)}>+ สร้างรายการ</button>} />
      {creating && <CreateForm onDone={() => setCreating(false)} />}
      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g}>
            <h2 className="mb-2 text-lg font-bold">{CAT_LABEL[g]}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.competitions.filter((c) => c.category === g).map((c) => {
                const a = data.assignments.find((x) => x.competitionId === c.id);
                const cr = data.criteria.find((x) => x.competitionId === c.id);
                return (
                  <Link key={c.id} to={`/staff/competitions/${c.id}`} className="card block p-4 transition hover:border-field">
                    <div className="flex items-start justify-between gap-2"><h3 className="font-bold">{c.name}</h3><StatusBadge status={c.status} /></div>
                    <p className="mt-1 text-xs text-muted">{FORMAT_LABEL[c.format]} · {c.places} อันดับ{c.countsForCup ? ' · นับถ้วยรวม' : ''}</p>
                    <p className="mt-2 text-sm">ผู้บันทึก: {data.users.find((u) => u.id === a?.scorerId)?.displayName ?? <span className="text-warn">ยังไม่มอบหมาย</span>}</p>
                    {cr && <p className={`text-sm ${cr.confirmed ? 'text-field' : 'text-warn'}`}>{cr.confirmed ? 'ยืนยันเกณฑ์แล้ว' : 'ยังไม่ยืนยันเกณฑ์คะแนน'}</p>}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
