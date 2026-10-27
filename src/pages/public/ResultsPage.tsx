import { useMemo, useState } from 'react';
import type { Competition, CriteriaConfig, Match, ResultRecord, Village } from '@domain';
import { usePublic, useStaff } from '../../state/live';
import { LeagueTables, MatchLine, ResultCard } from '../../components/views';
import { EmptyState, ErrorState, Loading, PageHeader, StatusBadge } from '../../components/ui';

const CATS: { key: Competition['category'] | 'all'; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' }, { key: 'folk', label: 'กีฬาพื้นบ้าน' }, { key: 'sport', label: 'กีฬา' }, { key: 'contest', label: 'การประกวด' },
];

function ResultsView({ competitions, results, villages, criteria, matches, staff, scoresTieOrder }: {
  competitions: Competition[]; results: ResultRecord[]; villages: Village[]; criteria: CriteriaConfig[]; matches: Match[]; staff: boolean; scoresTieOrder?: Record<string, Record<string, string[]>>;
}) {
  const [cat, setCat] = useState<(typeof CATS)[number]['key']>('all');
  const R = useMemo(() => Object.fromEntries(results.map((r) => [r.competitionId, r])), [results]);
  const list = competitions.filter((c) => cat === 'all' || c.category === cat);
  const withResult = list.filter((c) => R[c.id]);
  const liveLeague = list.filter((c) => (c.format === 'league' || c.format === 'knockout') && matches.some((m) => m.competitionId === c.id));
  return (
    <div className="space-y-6">
      <div className="flex gap-1 overflow-x-auto" role="tablist">
        {CATS.map((c) => <button key={c.key} role="tab" aria-selected={cat === c.key} className={`btn btn-sm ${cat === c.key ? 'btn-primary' : ''}`} onClick={() => setCat(c.key)}>{c.label}</button>)}
      </div>
      {withResult.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withResult.map((c) => <ResultCard key={c.id} comp={c} result={R[c.id]} villages={villages} criteria={criteria.find((x) => x.competitionId === c.id)} />)}
        </div>
      ) : <EmptyState title="ยังไม่มีผลที่ประกาศในหมวดนี้">ผลจะขึ้นที่นี่ทันทีที่คณะกรรมการประกาศ</EmptyState>}

      {liveLeague.map((c) => (
        <section key={c.id} className="space-y-3">
          <h2 className="flex flex-wrap items-center gap-2 text-xl font-bold">{c.name} · ผลรายนัด {staff && <StatusBadge status={c.status} />}</h2>
          <LeagueTables comp={c} matches={matches.filter((m) => m.competitionId === c.id)} villages={villages} tieOrder={scoresTieOrder?.[c.id]} />
          <div className="card divide-y divide-line px-3">{matches.filter((m) => m.competitionId === c.id).sort((a, b) => a.no - b.no).map((m) => <MatchLine key={m.id} m={m} villages={villages} />)}</div>
        </section>
      ))}

      {staff && (
        <section>
          <h2 className="mb-2 text-lg font-bold">สถานะทุกรายการ</h2>
          <div className="card overflow-x-auto"><table className="tbl"><tbody>{list.map((c) => (
            <tr key={c.id}><td>{c.name}</td><td className="text-xs text-muted">{c.schedule}</td><td className="text-right"><StatusBadge status={c.status} /></td></tr>
          ))}</tbody></table></div>
        </section>
      )}
    </div>
  );
}

function PublicResults() {
  const { data, error, refresh } = usePublic();
  if (!data) return error ? <ErrorState message={error} onRetry={refresh} /> : <Loading />;
  return (<><PageHeader title="ผลการแข่งขันรายกีฬา" subtitle="แสดงเฉพาะผลที่ผ่านการตรวจสอบและประกาศแล้ว" />
    <ResultsView competitions={data.competitions} results={data.results} villages={data.villages} criteria={data.criteria} matches={data.matches} staff={false} /></>);
}
function StaffResults() {
  const { data, error, refresh } = useStaff();
  if (!data) return error ? <ErrorState message={error} onRetry={refresh} /> : <Loading />;
  const tie = Object.fromEntries(data.scores.map((s) => [s.competitionId, s.data.leagueTieOrder ?? {}]));
  return (<><PageHeader title="ตารางคะแนนรายกีฬา" subtitle="มุมมองภายใน: รวมผลที่อนุมัติแล้วแต่ยังไม่ประกาศ และผลรายนัดทั้งหมด" />
    <ResultsView competitions={data.competitions} results={data.results} villages={data.villages} criteria={data.criteria} matches={data.matches} staff scoresTieOrder={tie} /></>);
}
export default function ResultsPage({ mode }: { mode: 'public' | 'staff' }) { return mode === 'public' ? <PublicResults /> : <StaffResults />; }
