import { useEffect, useState } from 'react';
import { canReview, STATUS_LABEL, type AuditEntry } from '@domain';
import { useStaff } from '../../state/live';
import { useAuth } from '../../state/auth';
import { ErrorState, Loading, PageHeader, VillageChip } from '../../components/ui';
import { downloadCsv } from '../../lib/csv';
import { errorMessage } from '../../lib/api';
import { fmtDateTime, fmtNum, PLACE_LABEL } from '../../lib/format';
import { actionLabel } from './Review';

type Tab = 'results' | 'contests' | 'cup' | 'audit';

export default function Reports() {
  const { data, error, refresh } = useStaff();
  const { user, call } = useAuth();
  const [tab, setTab] = useState<Tab>('results');
  const [scope, setScope] = useState<'published' | 'approved'>('published');
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);
  const [auditErr, setAuditErr] = useState('');
  useEffect(() => { if (tab === 'audit' && user && canReview(user.role)) call<AuditEntry[]>('audit.list', { limit: 5000 }).then(setAudit).catch((e) => setAuditErr(errorMessage(e))); }, [tab, call, user]);
  if (!data || !user) return error ? <ErrorState message={error} onRetry={refresh} /> : <Loading />;
  const V = Object.fromEntries(data.villages.map((v) => [v.id, v]));
  const C = Object.fromEntries(data.competitions.map((c) => [c.id, c]));
  const results = data.results.filter((r) => scope === 'approved' || r.publishedAt);
  const cup = scope === 'published' ? data.cupPublic : data.cupInternal;
  const contests = results.filter((r) => r.ranking);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const tabs: [Tab, string][] = [['results', 'ผลรายกีฬา'], ['contests', 'รายการประกวด'], ['cup', 'ถ้วยคะแนนรวม'], ...(canReview(user.role) ? [['audit', 'ประวัติการเปลี่ยนแปลง'] as [Tab, string]] : [])];

  const exportCsv = () => {
    if (tab === 'results') downloadCsv(`ผลรายกีฬา-${stamp}.csv`, [['รายการ', 'อันดับ', 'หมู่', 'หมู่บ้าน', 'เงินรางวัล', 'คะแนนถ้วยรวม', 'สถานะ', 'ประกาศเมื่อ'],
      ...results.flatMap((r) => Object.entries(r.placements).filter(([, v]) => v).map(([p, v]) => [C[r.competitionId]?.name, p, V[v!]?.no, V[v!]?.name, C[r.competitionId]?.prizes[Number(p) - 1] ?? '', r.cupPoints[v!] ?? 0, STATUS_LABEL[C[r.competitionId]?.status], r.publishedAt ?? '']))]);
    if (tab === 'contests') downloadCsv(`ผลการประกวด-${stamp}.csv`, [['รายการ', 'อันดับ', 'หมู่บ้าน', 'คะแนนรวม', 'จำนวนกรรมการ'],
      ...contests.flatMap((r) => (r.ranking ?? []).map((x) => [C[r.competitionId]?.name, x.rank, V[x.villageId]?.name, x.total, x.judges ?? '']))]);
    if (tab === 'cup') downloadCsv(`ถ้วยคะแนนรวม-${stamp}.csv`, [['อันดับ', 'หมู่', 'หมู่บ้าน', 'ชนะเลิศ', 'ที่ 2', 'ที่ 3', 'คะแนนรวม', 'รายละเอียด'],
      ...cup.rows.map((r) => [r.rank, V[r.villageId]?.no, V[r.villageId]?.name, r.golds, r.silvers, r.bronzes, r.points, r.breakdown.map((b) => `${C[b.competitionId]?.name} อันดับ ${b.place} (+${b.points})`).join('; ')])]);
    if (tab === 'audit' && audit) downloadCsv(`ประวัติ-${stamp}.csv`, [['เวลา', 'ผู้ใช้', 'การกระทำ', 'รายการ', 'รายละเอียด'], ...audit.map((a) => [a.at, a.userName, actionLabel(a.action), a.competitionId ? C[a.competitionId]?.name ?? a.competitionId : '', a.detail])]);
  };

  return (
    <>
      <PageHeader title="รายงาน" subtitle={`${data.settings.eventName} · ข้อมูล ณ ${fmtDateTime(data.serverTime)}`}
        actions={<><button className="btn" onClick={exportCsv} disabled={tab === 'audit' && !audit}>ส่งออก CSV</button><button className="btn btn-primary" onClick={() => window.print()}>พิมพ์ / บันทึก PDF</button></>} />
      <div className="mb-4 flex flex-wrap items-center gap-2 no-print">
        {tabs.map(([k, l]) => <button key={k} className={`btn btn-sm ${tab === k ? 'btn-primary' : ''}`} onClick={() => setTab(k)}>{l}</button>)}
        {tab !== 'audit' && <select aria-label="ขอบเขตข้อมูล" className="ml-auto rounded-lg border border-line px-2 py-1.5 text-sm" value={scope} onChange={(e) => setScope(e.target.value as 'published' | 'approved')}><option value="published">เฉพาะที่ประกาศแล้ว</option><option value="approved">รวมที่อนุมัติแต่ยังไม่ประกาศ</option></select>}
      </div>
      <div className="print-only mb-4"><h1 className="text-xl font-bold">{data.settings.eventName}</h1><p className="text-sm">{tabs.find((t) => t[0] === tab)?.[1]} · {scope === 'published' ? 'เฉพาะผลที่ประกาศแล้ว' : 'รวมผลที่อนุมัติแล้ว'} · พิมพ์เมื่อ {fmtDateTime(new Date().toISOString())}</p></div>

      {tab === 'results' && (
        <div className="space-y-3">{results.length === 0 ? <p className="text-muted">ยังไม่มีผล</p> : results.map((r) => (
          <div key={r.competitionId} className="card p-4">
            <h2 className="font-bold">{C[r.competitionId]?.name} <span className="text-xs font-normal text-muted">{STATUS_LABEL[C[r.competitionId]?.status]}{r.publishedAt ? ` · ประกาศ ${fmtDateTime(r.publishedAt)}` : ''}</span></h2>
            <table className="tbl mt-2"><tbody>{Object.entries(r.placements).filter(([, v]) => v).map(([p, v]) => (
              <tr key={p}><td className="w-40">{PLACE_LABEL[Number(p)]}</td><td><VillageChip v={V[v!]} size="sm" /></td><td className="text-right tabular">{fmtNum(C[r.competitionId]?.prizes[Number(p) - 1] ?? null)} บาท</td>{r.countsForCup && <td className="text-right">+{r.cupPoints[v!] ?? 0}</td>}</tr>
            ))}</tbody></table>
            {r.tieNote && <p className="mt-1 text-xs text-warn">เหตุผลกรณีเสมอ: {r.tieNote}</p>}
            {r.note && <p className="mt-1 text-xs text-muted">หมายเหตุ: {r.note}</p>}
          </div>
        ))}</div>
      )}
      {tab === 'contests' && (
        <div className="space-y-3">{contests.length === 0 ? <p className="text-muted">ยังไม่มีผลการประกวด</p> : contests.map((r) => (
          <div key={r.competitionId} className="card p-4">
            <h2 className="font-bold">{C[r.competitionId]?.name}</h2>
            <table className="tbl mt-2"><thead><tr><th>อันดับ</th><th>หมู่บ้าน</th><th className="text-right">คะแนน</th><th className="text-right">กรรมการ</th></tr></thead>
              <tbody>{(r.ranking ?? []).map((x) => <tr key={x.villageId}><td>{x.rank}</td><td><VillageChip v={V[x.villageId]} size="sm" /></td><td className="text-right tabular">{fmtNum(x.total, 2)}</td><td className="text-right">{x.judges ?? '–'}</td></tr>)}</tbody></table>
          </div>
        ))}</div>
      )}
      {tab === 'cup' && (
        <div className="card overflow-x-auto"><table className="tbl">
          <thead><tr><th>อันดับ</th><th>หมู่บ้าน</th><th className="text-center">ชนะเลิศ</th><th className="text-center">ที่ 2</th><th className="text-center">ที่ 3</th><th className="text-right">คะแนน</th><th>รายละเอียด</th></tr></thead>
          <tbody>{cup.rows.map((r) => (
            <tr key={r.villageId}><td>{r.rank}{r.tied ? ' (ร่วม)' : ''}</td><td><VillageChip v={V[r.villageId]} size="sm" /></td><td className="text-center">{r.golds}</td><td className="text-center">{r.silvers}</td><td className="text-center">{r.bronzes}</td><td className="text-right font-bold">{r.points}</td>
              <td className="text-xs text-muted">{r.breakdown.map((b) => `${C[b.competitionId]?.name} (${b.place})`).join(', ')}</td></tr>
          ))}</tbody>
        </table></div>
      )}
      {tab === 'audit' && (auditErr ? <ErrorState message={auditErr} /> : !audit ? <Loading /> : (
        <div className="card overflow-x-auto"><table className="tbl">
          <thead><tr><th>เวลา</th><th>ผู้ใช้</th><th>การกระทำ</th><th>รายการ</th></tr></thead>
          <tbody>{audit.map((a) => <tr key={a.id}><td className="whitespace-nowrap text-xs">{fmtDateTime(a.at)}</td><td>{a.userName}</td><td>{actionLabel(a.action)}</td><td className="text-sm">{a.competitionId ? C[a.competitionId]?.name ?? a.competitionId : '–'}</td></tr>)}</tbody>
        </table></div>
      ))}
    </>
  );
}
