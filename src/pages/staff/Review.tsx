import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { contestRanking, entryTotal, type AuditEntry, type Competition } from '@domain';
import { useStaff } from '../../state/live';
import { useAuth } from '../../state/auth';
import { EmptyState, ErrorState, Loading, Medal, Notice, PageHeader, StatusBadge, VillageChip } from '../../components/ui';
import { WorkflowButtons } from '../../components/Workflow';
import { LeagueTables, MatchLine } from '../../components/views';
import { errorMessage } from '../../lib/api';
import { fmtDateTime, fmtNum, PLACE_LABEL } from '../../lib/format';
import type { StaffSnapshot } from '../../lib/types';

const ACTION_LABEL: Record<string, string> = {
  'scores.save': 'บันทึกคะแนน', 'sheets.save': 'บันทึกใบคะแนนกรรมการ', 'matches.save': 'บันทึกผลนัด', 'matches.create': 'เพิ่มนัด', 'matches.delete': 'ลบนัด',
  'workflow.open': 'เปิดรับคะแนน', 'workflow.submit': 'ส่งผล', 'workflow.return': 'ส่งกลับแก้ไข', 'workflow.reject': 'ปฏิเสธ', 'workflow.approve': 'อนุมัติ',
  'workflow.publish': 'ประกาศผล', 'workflow.unpublish': 'ยกเลิกประกาศ', 'workflow.lock': 'ล็อกผล', 'workflow.unlock': 'ปลดล็อก', 'workflow.reopen': 'เปิดแก้ไขอีกครั้ง',
  'competitions.update': 'แก้ไขรายการ', 'competitions.create': 'สร้างรายการ', 'criteria.update': 'แก้เกณฑ์', 'criteria.confirm': 'ยืนยันเกณฑ์', 'assignments.set': 'มอบหมายผู้รับผิดชอบ',
  'settings.update': 'แก้การตั้งค่าเผยแพร่', 'users.create': 'สร้างผู้ใช้', 'users.update': 'แก้ผู้ใช้', 'users.resetPassword': 'รีเซ็ตรหัสผ่าน', 'auth.login': 'เข้าสู่ระบบ', 'auth.changePassword': 'เปลี่ยนรหัสผ่าน', 'auth.locked': 'บัญชีถูกล็อก', 'system.seed': 'สร้างข้อมูลตั้งต้น', 'system.reset': 'รีเซ็ตระบบ',
};
export const actionLabel = (a: string) => ACTION_LABEL[a] ?? a;

export function History({ competitionId }: { competitionId: string }) {
  const { call } = useAuth();
  const { data } = useStaff();
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { call<AuditEntry[]>('audit.list', { competitionId, limit: 200 }).then(setRows).catch((e) => setErr(errorMessage(e))); }, [call, competitionId, data?.rev]);
  if (err) return <ErrorState message={err} />;
  if (!rows) return <Loading label="กำลังโหลดประวัติ…" />;
  if (!rows.length) return <p className="text-sm text-muted">ยังไม่มีประวัติ</p>;
  return (
    <ol className="space-y-2 text-sm">
      {rows.map((r) => {
        let reason = ''; try { reason = JSON.parse(r.detail).reason ?? ''; } catch { /* ignore */ }
        return (
          <li key={r.id} className="flex flex-wrap gap-x-3 border-b border-line pb-2 last:border-0">
            <span className="w-36 flex-none text-xs text-muted">{fmtDateTime(r.at)}</span>
            <span className="font-semibold">{actionLabel(r.action)}</span>
            <span className="text-muted">โดย {r.userName}</span>
            {reason && <span className="w-full pl-36 text-xs text-warn">เหตุผล: {reason}</span>}
          </li>
        );
      })}
    </ol>
  );
}

export function SubmissionDetail({ comp, data }: { comp: Competition; data: StaffSnapshot }) {
  const score = data.scores.find((s) => s.competitionId === comp.id);
  const cr = data.criteria.find((c) => c.competitionId === comp.id);
  const sheets = data.sheets.filter((s) => s.competitionId === comp.id);
  const a = data.assignments.find((x) => x.competitionId === comp.id);
  const V = Object.fromEntries(data.villages.map((v) => [v.id, v]));
  const U = (id: string | null | undefined) => data.users.find((u) => u.id === id)?.displayName ?? '–';
  const matches = data.matches.filter((m) => m.competitionId === comp.id).sort((x, y) => x.no - y.no);
  if (!score) return <EmptyState title="ยังไม่มีข้อมูลคะแนน" />;
  const ranking = comp.format === 'criteria' && cr ? contestRanking(cr.items, comp.eligibleVillageIds, comp.judgeMode, score.data.entries, sheets.map((s) => s.entries), cr.aggregation) : null;
  return (
    <div className="space-y-5">
      <div className="card grid gap-2 p-4 text-sm sm:grid-cols-2">
        <div><span className="text-muted">ผู้บันทึกหลัก:</span> {U(a?.scorerId)}</div>
        <div><span className="text-muted">ส่งผลโดย:</span> {U(score.submittedBy)} {score.submittedAt && `· ${fmtDateTime(score.submittedAt)}`}</div>
        <div><span className="text-muted">แก้ไขล่าสุด:</span> {U(score.updatedBy)} · {fmtDateTime(score.updatedAt)}</div>
        <div><span className="text-muted">ฉบับที่:</span> {score.version}</div>
      </div>
      <div>
        <h3 className="mb-2 font-bold">อันดับที่ส่งมา</h3>
        <ol className="grid gap-2 sm:grid-cols-2">
          {Object.entries(score.data.placements).filter(([, v]) => v).map(([p, v]) => (
            <li key={p} className="card flex items-center gap-3 p-3"><Medal place={Number(p)} /><div><VillageChip v={V[v!]} /><div className="text-xs text-muted">{PLACE_LABEL[Number(p)]}{comp.countsForCup && Number(p) <= 3 ? ` · ถ้วยรวม +${4 - Number(p)}` : ''}</div></div></li>
          ))}
        </ol>
        {score.data.tieNote && <div className="mt-2"><Notice tone="warn"><b>เหตุผลกรณีคะแนนเท่ากัน:</b> {score.data.tieNote}</Notice></div>}
        {score.data.note && <p className="mt-2 text-sm text-muted">หมายเหตุ: {score.data.note}</p>}
      </div>
      {ranking && cr && (
        <div>
          <h3 className="mb-2 font-bold">คะแนนรายเกณฑ์</h3>
          <div className="card overflow-x-auto"><table className="tbl">
            <thead><tr><th>#</th><th>หมู่บ้าน</th>{comp.judgeMode === 'single' ? cr.items.map((it, i) => <th key={it.key} className="text-center" title={it.label}>ข้อ {i + 1}<br /><span className="font-normal normal-case">เต็ม {it.max}</span></th>) : sheets.map((s) => <th key={s.judgeId} className="text-center">{U(s.judgeId)}</th>)}<th className="text-right">รวม</th></tr></thead>
            <tbody>{ranking.map((r) => (
              <tr key={r.villageId}>
                <td>{r.rank}{r.tied && <span className="ml-1 text-xs text-warn">=</span>}</td><td><VillageChip v={V[r.villageId]} size="sm" /></td>
                {comp.judgeMode === 'single'
                  ? cr.items.map((it) => <td key={it.key} className="text-center tabular">{fmtNum(score.data.entries?.[r.villageId]?.[it.key] ?? null)}</td>)
                  : sheets.map((s) => <td key={s.judgeId} className="text-center tabular">{fmtNum(entryTotal(cr.items, s.entries[r.villageId]).total)}</td>)}
                <td className="text-right font-bold tabular">{fmtNum(r.total, 2)}</td>
              </tr>
            ))}</tbody>
          </table></div>
          {comp.judgeMode === 'panel' && <p className="mt-1 text-xs text-muted">วิธีรวม: {cr.aggregation === 'sum' ? 'ผลรวม' : 'ค่าเฉลี่ย'}</p>}
        </div>
      )}
      {matches.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold">ผลรายนัด</h3>
          {comp.format === 'league' && <LeagueTables comp={comp} matches={matches} villages={data.villages} tieOrder={score.data.leagueTieOrder} />}
          <div className="card divide-y divide-line px-3">{matches.map((m) => <MatchLine key={m.id} m={m} villages={data.villages} />)}</div>
        </div>
      )}
    </div>
  );
}

export default function Review() {
  const { id } = useParams();
  const { data, error, refresh } = useStaff();
  const { user } = useAuth();
  if (!data || !user) return error ? <ErrorState message={error} onRetry={refresh} /> : <Loading />;
  if (!id) {
    const submitted = data.competitions.filter((c) => c.status === 'submitted');
    const approved = data.competitions.filter((c) => c.status === 'approved');
    return (
      <>
        <PageHeader title="ตรวจสอบและอนุมัติผล" subtitle="ผู้ส่งผลอนุมัติผลของตนเองไม่ได้ · การอนุมัติยังไม่ใช่การประกาศผล" />
        <h2 className="mb-2 text-lg font-bold">รอตรวจสอบ ({submitted.length})</h2>
        {submitted.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{submitted.map((c) => {
          const s = data.scores.find((x) => x.competitionId === c.id);
          return <Link key={c.id} to={`/staff/review/${c.id}`} className="card block p-4 hover:border-field"><div className="flex justify-between gap-2"><b>{c.name}</b><StatusBadge status={c.status} /></div><p className="mt-1 text-xs text-muted">ส่งเมื่อ {fmtDateTime(s?.submittedAt)}</p></Link>;
        })}</div> : <EmptyState title="ไม่มีผลที่รอตรวจสอบ" />}
        <h2 className="mb-2 mt-6 text-lg font-bold">อนุมัติแล้ว รอประกาศ ({approved.length})</h2>
        {approved.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{approved.map((c) => <Link key={c.id} to={`/staff/review/${c.id}`} className="card block p-4 hover:border-field"><div className="flex justify-between gap-2"><b>{c.name}</b><StatusBadge status={c.status} /></div></Link>)}</div> : <p className="text-sm text-muted">ไม่มี</p>}
      </>
    );
  }
  const comp = data.competitions.find((c) => c.id === id);
  if (!comp) return <ErrorState message="ไม่พบรายการ" />;
  const score = data.scores.find((s) => s.competitionId === comp.id);
  const isSubmitter = score?.submittedBy === user.id;
  return (
    <>
      <p className="mb-2 text-sm"><Link to="/staff/review" className="text-field">← รายการรอตรวจสอบ</Link></p>
      <PageHeader title={comp.name} subtitle={<span className="inline-flex items-center gap-2"><StatusBadge status={comp.status} />{comp.schedule}</span>}
        actions={<WorkflowButtons comp={comp} actions={['approve', 'return', 'reject', 'publish', 'reopen']} isSubmitter={isSubmitter} />} />
      {isSubmitter && comp.status === 'submitted' && user.role !== 'superadmin' && <div className="mb-4"><Notice tone="warn">คุณเป็นผู้ส่งผลนี้ จึงอนุมัติเองไม่ได้ ต้องให้ผู้ตรวจสอบคนอื่นอนุมัติ</Notice></div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <SubmissionDetail comp={comp} data={data} />
        <aside className="card h-fit p-4"><h3 className="mb-3 font-bold">ประวัติการเปลี่ยนแปลง</h3><History competitionId={comp.id} /></aside>
      </div>
    </>
  );
}
