import { Link } from 'react-router-dom';
import { canReview, isAdmin, TIE_RULE_LABEL, type CompStatus } from '@domain';
import { useStaff } from '../../state/live';
import { useAuth } from '../../state/auth';
import { EmptyState, ErrorState, Loading, Notice, PageHeader, Stat, StatusBadge } from '../../components/ui';
import { fmtDateTime } from '../../lib/format';

export default function Dashboard() {
  const { data, error, refresh } = useStaff();
  const { user } = useAuth();
  if (!data || !user) return error ? <ErrorState message={error} onRetry={refresh} /> : <Loading />;
  const count = (s: CompStatus[]) => data.competitions.filter((c) => s.includes(c.status)).length;
  const mine = data.assignments.filter((a) => a.scorerId === user.id || a.judgeIds.includes(user.id)).map((a) => a.competitionId);
  const myComps = data.competitions.filter((c) => mine.includes(c.id));
  const submitted = data.competitions.filter((c) => c.status === 'submitted');
  const approved = data.competitions.filter((c) => c.status === 'approved');
  const unassigned = data.competitions.filter((c) => c.status === 'draft' && !data.assignments.find((a) => a.competitionId === c.id)?.scorerId);
  const criteriaPending = data.criteria.filter((c) => !c.confirmed);
  const cup = data.cupInternal;
  return (
    <>
      <PageHeader title={`สวัสดี ${user.displayName}`} subtitle={`${data.settings.eventName} · ข้อมูลล่าสุด ${fmtDateTime(data.serverTime)}`} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="รายการทั้งหมด" value={data.competitions.length} />
        <Stat label="ยังไม่เริ่ม" value={count(['draft'])} />
        <Stat label="กำลังดำเนินการ" value={count(['open'])} />
        <Stat label="รอตรวจสอบ" value={count(['submitted'])} tone={count(['submitted']) ? 'warn' : undefined} />
        <Stat label="อนุมัติ รอประกาศ" value={count(['approved'])} />
        <Stat label="ประกาศผลแล้ว" value={count(['published', 'locked'])} tone="good" hint={`ล็อกแล้ว ${count(['locked'])}`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-1">
          <h2 className="text-lg font-bold">สถานะถ้วยคะแนนรวม</h2>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-2 text-sm">
            <dt className="text-muted">อนุมัติแล้ว (นับภายใน)</dt><dd className="font-semibold">{cup.countedResults} / {cup.totalCupEvents}</dd>
            <dt className="text-muted">ประกาศแล้ว (สาธารณะ)</dt><dd className="font-semibold">{data.cupPublic.countedResults} / {cup.totalCupEvents}</dd>
            <dt className="text-muted">หน้าสาธารณะ</dt><dd>{data.settings.cupVisible ? <span className="badge bg-field-soft text-field-dark">เปิดเผย</span> : <span className="badge bg-slate-100 text-slate-600">ซ่อนอยู่</span>}</dd>
            <dt className="text-muted">กติกาตัดสินเสมอ</dt><dd className="max-w-[12rem] text-right text-xs">{TIE_RULE_LABEL[data.settings.tieRule]}</dd>
          </dl>
          {cup.tieUnresolved && <div className="mt-3"><Notice tone="warn">มีคะแนนเท่ากันและยังไม่ได้ยืนยันกติกาตัดสินเสมอ</Notice></div>}
          {cup.rows[0]?.points > 0 && <p className="mt-3 text-sm">นำอยู่: <b>{data.villages.find((v) => v.id === cup.rows[0].villageId)?.name}</b> {cup.rows[0].points} คะแนน</p>}
          <Link to="/staff/cup" className="btn btn-sm mt-4">ดูตารางถ้วยรวม</Link>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="text-lg font-bold">งานที่ต้องทำ</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {myComps.filter((c) => c.status === 'open').map((c) => <li key={c.id} className="flex items-center justify-between gap-2"><span>บันทึกคะแนน: <b>{c.name}</b></span><Link className="btn btn-sm btn-primary" to={`/staff/score/${c.id}`}>บันทึก</Link></li>)}
            {canReview(user.role) && submitted.map((c) => <li key={c.id} className="flex items-center justify-between gap-2"><span>ตรวจสอบผล: <b>{c.name}</b></span><Link className="btn btn-sm btn-primary" to={`/staff/review/${c.id}`}>ตรวจสอบ</Link></li>)}
            {isAdmin(user.role) && approved.map((c) => <li key={c.id} className="flex items-center justify-between gap-2"><span>อนุมัติแล้ว รอประกาศ: <b>{c.name}</b></span><Link className="btn btn-sm" to="/staff/publication">ไปหน้าเผยแพร่</Link></li>)}
            {isAdmin(user.role) && criteriaPending.length > 0 && <li><Notice tone="warn">เกณฑ์คะแนนการประกวดที่ยังไม่ยืนยัน {criteriaPending.length} รายการ — ต้องกำหนดคะแนนเต็มรายข้อก่อนเปิดรับคะแนน (<Link className="underline" to="/staff/competitions">จัดการการแข่งขัน</Link>)</Notice></li>}
            {isAdmin(user.role) && unassigned.length > 0 && <li><Notice>ยังไม่ได้มอบหมายผู้บันทึก {unassigned.length} รายการ</Notice></li>}
            {isAdmin(user.role) && data.settings.tieRule === 'unconfirmed' && <li><Notice>ยังไม่ได้ยืนยันกติกาตัดสินกรณีคะแนนถ้วยรวมเท่ากัน (สูจิบัตรไม่ได้ระบุ)</Notice></li>}
          </ul>
          {!myComps.some((c) => c.status === 'open') && !(canReview(user.role) && submitted.length) && !isAdmin(user.role) && <p className="mt-3 text-sm text-muted">ยังไม่มีงานที่ต้องทำในตอนนี้</p>}
        </section>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-bold">รายการแข่งขันทั้งหมด</h2>
        {data.competitions.length ? (
          <div className="card overflow-x-auto"><table className="tbl">
            <thead><tr><th>รายการ</th><th>กำหนดการ</th><th>ผู้บันทึก</th><th>สถานะ</th></tr></thead>
            <tbody>{data.competitions.map((c) => {
              const a = data.assignments.find((x) => x.competitionId === c.id);
              return (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}{c.countsForCup && <span className="ml-2 badge bg-field-soft text-field-dark">ถ้วยรวม</span>}</td>
                  <td className="text-xs text-muted">{c.schedule}</td>
                  <td className="text-sm">{data.users.find((u) => u.id === a?.scorerId)?.displayName ?? <span className="text-muted">–</span>}</td>
                  <td><StatusBadge status={c.status} /></td>
                </tr>
              );
            })}</tbody>
          </table></div>
        ) : <EmptyState title="ยังไม่มีรายการแข่งขัน">ผู้ดูแลต้องรัน setup() ใน Apps Script เพื่อสร้างข้อมูลตั้งต้น</EmptyState>}
      </section>
    </>
  );
}
