import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  canEditScores, checkTransition, contestRanking, entryTotal, knockoutPlacements, leagueTable, placementsConsistent, suggestedPlacements,
  tiesWithinPlaces, validateEntry, validatePlacements, type Competition, type CriteriaConfig, type CriteriaEntries, type JudgeSheet, type ScoreData,
} from '@domain';
import { useStaff } from '../../state/live';
import { useAuth } from '../../state/auth';
import { useUI } from '../../state/ui';
import { ApiFailure, errorMessage } from '../../lib/api';
import { ErrorState, Loading, Notice, PageHeader, StatusBadge, VillageChip } from '../../components/ui';
import { LeagueTables } from '../../components/views';
import { fmtDateTime, fmtNum, fmtTime } from '../../lib/format';
import type { StaffSnapshot } from '../../lib/types';
import { PlacementPicker } from './editors/PlacementPicker';
import { CriteriaGrid } from './editors/CriteriaGrid';
import { MatchesPanel } from './editors/MatchesPanel';

type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved'; at: string; version: number } | { kind: 'error'; message: string };

function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
}

function SaveIndicator({ s, dirty }: { s: SaveState; dirty: boolean }) {
  if (s.kind === 'saving') return <span className="text-sm text-muted" role="status">กำลังบันทึก…</span>;
  if (s.kind === 'error') return <span className="text-sm font-semibold text-danger" role="alert">บันทึกไม่สำเร็จ: {s.message}</span>;
  if (dirty) return <span className="text-sm font-semibold text-warn">มีการแก้ไขที่ยังไม่ได้บันทึก</span>;
  if (s.kind === 'saved') return <span className="text-sm text-field">บันทึกแล้ว {fmtTime(s.at)} (ฉบับที่ {s.version})</span>;
  return null;
}

/* ---------------- ใบคะแนนของกรรมการ (โหมดคณะกรรมการ) ---------------- */
function JudgeSheetPanel({ comp, cr, sheet, data }: { comp: Competition; cr: CriteriaConfig; sheet: JudgeSheet | undefined; data: StaffSnapshot }) {
  const { call } = useAuth();
  const { refresh } = useStaff();
  const { toast } = useUI();
  const [entries, setEntries] = useState<CriteriaEntries>(sheet?.entries ?? {});
  const [base, setBase] = useState(sheet?.version ?? 0);
  const [dirty, setDirty] = useState(false);
  const [s, setS] = useState<SaveState>({ kind: 'idle' });
  const [remote, setRemote] = useState(false);
  useUnsavedGuard(dirty);
  useEffect(() => {
    const v = sheet?.version ?? 0;
    if (v === base) return;
    if (!dirty) { setEntries(sheet?.entries ?? {}); setBase(v); } else setRemote(true);
  }, [sheet?.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const editable = comp.status === 'open';
  const order = [...comp.eligibleVillageIds].sort((a, b) => (data.villages.find((v) => v.id === a)?.paradeOrder ?? 0) - (data.villages.find((v) => v.id === b)?.paradeOrder ?? 0));
  const bad = order.some((v) => validateEntry(cr.items, entries[v], false).length > 0);
  const done = order.filter((v) => entryTotal(cr.items, entries[v]).complete).length;
  const save = async () => {
    setS({ kind: 'saving' });
    try {
      const r = await call<{ sheet: JudgeSheet }>('sheets.save', { competitionId: comp.id, baseVersion: base, entries });
      setBase(r.sheet.version); setDirty(false); setRemote(false);
      setS({ kind: 'saved', at: r.sheet.updatedAt ?? new Date().toISOString(), version: r.sheet.version });
      refresh();
    } catch (e) {
      setS({ kind: 'error', message: errorMessage(e) });
      if (e instanceof ApiFailure && e.code === 'CONFLICT') setRemote(true);
      toast(errorMessage(e), 'error');
    }
  };
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">ใบให้คะแนนของฉัน</h2>
      <p className="text-sm text-muted">กรรมการแต่ละคนกรอกใบของตนเองพร้อมกันได้ คนอื่นไม่เห็นคะแนนของคุณ · กรอกครบ {done}/{order.length} หมู่บ้าน</p>
      {remote && <Notice tone="warn">ใบคะแนนนี้ถูกแก้จากอุปกรณ์อื่น <button className="ml-2 underline" onClick={() => { setEntries(sheet?.entries ?? {}); setBase(sheet?.version ?? 0); setDirty(false); setRemote(false); }}>โหลดฉบับล่าสุด</button></Notice>}
      <CriteriaGrid items={cr.items} maxTotal={cr.maxTotal} villages={data.villages} order={order} entries={entries} disabled={!editable} onChange={(e) => { setEntries(e); setDirty(true); setS({ kind: 'idle' }); }} />
      {editable && (
        <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <SaveIndicator s={s} dirty={dirty} />
          <button className="btn btn-primary btn-lg" disabled={!dirty || bad || s.kind === 'saving'} onClick={save}>บันทึกใบคะแนน</button>
        </div>
      )}
    </section>
  );
}

/* ---------------- หน้าหลักบันทึกคะแนน ---------------- */
export default function ScoreEntry() {
  const { id } = useParams();
  const { data, error, refresh } = useStaff();
  const { user } = useAuth();
  if (!data || !user) return error ? <ErrorState message={error} onRetry={refresh} /> : <Loading />;
  const comp = data.competitions.find((c) => c.id === id);
  if (!comp) return <ErrorState message="ไม่พบรายการนี้" />;
  return <Editor key={comp.id} comp={comp} data={data} />;
}

function Editor({ comp, data }: { comp: Competition; data: StaffSnapshot }) {
  const { user, call } = useAuth();
  const { refresh } = useStaff();
  const { toast, confirm } = useUI();
  const me = user!;
  const a = data.assignments.find((x) => x.competitionId === comp.id) ?? { competitionId: comp.id, scorerId: null, judgeIds: [] };
  const isScorer = a.scorerId === me.id;
  const isJudge = a.judgeIds.includes(me.id);
  const server = data.scores.find((s) => s.competitionId === comp.id);
  const serverVersion = server?.version ?? 0;
  const cr = data.criteria.find((c) => c.competitionId === comp.id);
  const canEdit = canEditScores(comp.status, me.role, isScorer);
  const canSeeMain = isScorer || ['superadmin', 'admin', 'reviewer'].includes(me.role);

  const [draft, setDraft] = useState<ScoreData>(server?.data ?? { placements: {} });
  const [base, setBase] = useState(serverVersion);
  const [dirty, setDirty] = useState(false);
  const [remote, setRemote] = useState(false);
  const [s, setS] = useState<SaveState>({ kind: 'idle' });
  useUnsavedGuard(dirty);
  useEffect(() => {
    if (serverVersion === base) return;
    if (!dirty) { setDraft(server?.data ?? { placements: {} }); setBase(serverVersion); setRemote(false); } else setRemote(true);
  }, [serverVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  const edit = (d: ScoreData) => { setDraft(d); setDirty(true); setS({ kind: 'idle' }); };

  const matches = useMemo(() => data.matches.filter((m) => m.competitionId === comp.id).sort((x, y) => x.no - y.no), [data.matches, comp.id]);
  const sheets = data.sheets.filter((x) => x.competitionId === comp.id);
  const ranking = useMemo(() => (comp.format === 'criteria' && cr ? contestRanking(cr.items, comp.eligibleVillageIds, comp.judgeMode, draft.entries, sheets.map((x) => x.entries), cr.aggregation) : null), [comp, cr, draft.entries, sheets]);
  const suggestion = ranking ? suggestedPlacements(ranking, comp.places) : comp.format === 'league' || comp.format === 'knockout' ? knockoutPlacements(matches, comp.places) : null;
  // แจ้งคะแนนเท่ากันเฉพาะเมื่อกรอกครบทุกหมู่บ้านแล้ว (ระหว่างกรอก คะแนนเป็น 0 จะเท่ากันหมด)
  const allComplete = !!ranking && ranking.every((r) => r.complete);
  const ties = ranking && allComplete ? tiesWithinPlaces(ranking, comp.places) : [];
  const totals = ranking ? Object.fromEntries(ranking.map((r) => [r.villageId, r.total])) : undefined;

  const problems = [
    ...validatePlacements(draft.placements, comp.places, comp.eligibleVillageIds, true),
    ...(ranking ? placementsConsistent(draft.placements, ranking) : []),
    ...(comp.format === 'criteria' && comp.judgeMode === 'single' && cr ? comp.eligibleVillageIds.flatMap((v) => validateEntry(cr.items, draft.entries?.[v], true).length ? [{ field: v, message: `${data.villages.find((x) => x.id === v)?.name}: กรอกคะแนนไม่ครบหรือไม่ถูกต้อง` }] : []) : []),
    ...(ties.length && !(draft.tieNote ?? '').trim() ? [{ field: 'tie', message: 'มีคะแนนเท่ากันในอันดับที่ได้รางวัล ต้องระบุเหตุผลการจัดลำดับ' }] : []),
  ];

  const save = async (): Promise<boolean> => {
    setS({ kind: 'saving' });
    try {
      const r = await call<{ score: { version: number; updatedAt: string } }>('scores.save', { competitionId: comp.id, baseVersion: base, data: draft });
      setBase(r.score.version); setDirty(false); setRemote(false);
      setS({ kind: 'saved', at: r.score.updatedAt, version: r.score.version });
      refresh();
      return true;
    } catch (e) {
      setS({ kind: 'error', message: errorMessage(e) });
      if (e instanceof ApiFailure && e.code === 'CONFLICT') setRemote(true);
      toast(errorMessage(e), 'error');
      return false;
    }
  };
  const submit = async () => {
    const r = await confirm({ title: `ส่งผล ${comp.name} เพื่อตรวจสอบ`, body: 'หลังส่งแล้วจะแก้ไขไม่ได้ จนกว่าผู้ตรวจสอบจะส่งกลับ การส่งผลยังไม่ใช่การประกาศผล', confirmLabel: 'ส่งผล' });
    if (!r.ok) return;
    if (dirty && !(await save())) return;
    try { await call('workflow.transition', { competitionId: comp.id, action: 'submit' }); toast('ส่งผลเพื่อตรวจสอบแล้ว', 'success'); refresh(); } catch (e) { toast(errorMessage(e), 'error'); refresh(); }
  };
  const canSubmit = checkTransition('submit', { status: comp.status, role: me.role, isAssignedScorer: isScorer }).ok;
  const V = Object.fromEntries(data.villages.map((v) => [v.id, v]));

  return (
    <>
      <p className="mb-2 text-sm"><Link to="/staff/score" className="text-field">← รายการที่รับผิดชอบ</Link></p>
      <PageHeader title={comp.name} subtitle={<span className="inline-flex flex-wrap items-center gap-2"><StatusBadge status={comp.status} />{comp.schedule}</span>} />
      <div className="space-y-6">
        {comp.description && <p className="text-sm text-muted">{comp.description}</p>}
        {comp.status === 'draft' && <Notice>รายการนี้ยังไม่เปิดรับคะแนน รอผู้ดูแลเปิดรับคะแนน</Notice>}
        {comp.status === 'submitted' && <Notice tone="warn">ส่งผลแล้ว รอผู้ตรวจสอบ {server?.submittedAt && `(ส่งเมื่อ ${fmtDateTime(server.submittedAt)})`}</Notice>}
        {['approved', 'published', 'locked'].includes(comp.status) && <Notice tone="success">ผลได้รับการอนุมัติแล้ว แก้ไขไม่ได้</Notice>}
        {server?.reviewNote && comp.status === 'open' && <Notice tone="danger"><b>ผู้ตรวจสอบส่งกลับให้แก้ไข:</b> {server.reviewNote}</Notice>}
        {remote && (
          <Notice tone="warn">ข้อมูลนี้ถูกแก้ไขจากอุปกรณ์อื่นขณะที่คุณกำลังแก้ไข
            <button className="ml-2 font-semibold underline" onClick={() => { setDraft(server?.data ?? { placements: {} }); setBase(serverVersion); setDirty(false); setRemote(false); }}>โหลดข้อมูลล่าสุด (ทิ้งที่แก้)</button>
          </Notice>
        )}

        {comp.format === 'criteria' && cr && !cr.confirmed && <Notice tone="warn">เกณฑ์การให้คะแนนยังไม่ได้รับการยืนยันจากผู้ดูแล</Notice>}
        {comp.format === 'criteria' && cr?.confirmed && comp.judgeMode === 'panel' && isJudge && (
          <JudgeSheetPanel comp={comp} cr={cr} sheet={sheets.find((x) => x.judgeId === me.id)} data={data} />
        )}

        {(comp.format === 'league' || comp.format === 'knockout') && (
          <section className="space-y-3">
            <h2 className="text-xl font-bold">ผลรายนัด</h2>
            <MatchesPanel comp={comp} matches={matches} villages={data.villages} disabled={!canEdit} />
            {comp.format === 'league' && comp.league && (
              <>
                <h3 className="pt-2 text-lg font-bold">ตารางคะแนนในสาย</h3>
                <LeagueTables comp={comp} matches={matches} villages={data.villages} tieOrder={draft.leagueTieOrder} />
                <LeagueTieOrder comp={comp} data={data} draft={draft} onChange={edit} disabled={!canEdit} />
              </>
            )}
          </section>
        )}

        {canSeeMain && (
          <>
            {comp.format === 'criteria' && cr?.confirmed && comp.judgeMode === 'single' && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold">กรอกคะแนนตามเกณฑ์</h2>
                <CriteriaGrid items={cr.items} maxTotal={cr.maxTotal} villages={data.villages} entries={draft.entries ?? {}} disabled={!canEdit}
                  order={[...comp.eligibleVillageIds].sort((x, y) => (comp.id === 'parade' || comp.id === 'tent' ? (V[x]?.paradeOrder ?? 0) - (V[y]?.paradeOrder ?? 0) : 0))}
                  onChange={(e) => edit({ ...draft, entries: e })} />
              </section>
            )}
            {comp.format === 'criteria' && cr?.confirmed && comp.judgeMode === 'panel' && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold">คะแนนรวมจากคณะกรรมการ</h2>
                <p className="text-sm text-muted">วิธีรวม: {cr.aggregation === 'sum' ? 'ผลรวม' : 'ค่าเฉลี่ย'} · ส่งใบคะแนนแล้ว {sheets.length}/{a.judgeIds.length} คน</p>
                <div className="card overflow-x-auto"><table className="tbl">
                  <thead><tr><th>หมู่บ้าน</th>{a.judgeIds.map((j) => <th key={j} className="text-center">{data.users.find((u) => u.id === j)?.displayName ?? 'กรรมการ'}</th>)}<th className="text-right">คะแนนที่ใช้</th></tr></thead>
                  <tbody>{(ranking ?? []).map((r) => (
                    <tr key={r.villageId}><td><VillageChip v={V[r.villageId]} size="sm" /></td>
                      {a.judgeIds.map((j) => { const sh = sheets.find((x) => x.judgeId === j); const t = sh ? entryTotal(cr.items, sh.entries[r.villageId]) : null; return <td key={j} className={`text-center tabular ${t && !t.complete ? 'italic text-muted' : ''}`}>{t ? (t.complete ? fmtNum(t.total) : `${fmtNum(t.total)}…`) : '–'}</td>; })}
                      <td className="text-right font-display font-bold tabular">{r.judges ? fmtNum(r.total, 2) : '–'}</td></tr>
                  ))}</tbody>
                </table></div>
              </section>
            )}

            {ranking && (
              <section className="space-y-2">
                <h2 className="text-xl font-bold">อันดับตามคะแนน</h2>
                <div className="card overflow-x-auto"><table className="tbl"><tbody>{ranking.map((r) => (
                  <tr key={r.villageId}><td className="w-12 text-center font-display font-bold">{r.rank}</td><td><VillageChip v={V[r.villageId]} /></td>
                    <td>{r.tied && allComplete && <span className="badge bg-warn-soft text-warn">คะแนนเท่ากัน</span>}{!r.complete && <span className="badge bg-slate-100 text-slate-600">ยังไม่ครบ</span>}</td>
                    <td className="text-right font-display text-lg font-bold tabular">{fmtNum(r.total, 2)}</td></tr>
                ))}</tbody></table></div>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="text-xl font-bold">ผลการแข่งขัน (อันดับที่ได้รางวัล)</h2>
              {ties.length > 0 && <Notice tone="warn">มีคะแนนเท่ากันในอันดับที่ได้รางวัล: {ties.map((g) => g.map((v) => V[v]?.name).join(' = ')).join(' · ')} — ระบบไม่ตัดสินเสมอเอง กรุณาเลือกลำดับตามมติคณะกรรมการและระบุเหตุผล</Notice>}
              <PlacementPicker places={comp.places} value={draft.placements} villages={data.villages} eligible={comp.eligibleVillageIds} disabled={!canEdit} totals={totals}
                suggestion={suggestion} onChange={(p) => edit({ ...draft, placements: p })} />
              {(ties.length > 0 || draft.tieNote) && (
                <div><label className="label" htmlFor="tie-note">เหตุผลการจัดลำดับกรณีคะแนนเท่ากัน</label>
                  <textarea id="tie-note" rows={2} className="input" disabled={!canEdit} value={draft.tieNote ?? ''} onChange={(e) => edit({ ...draft, tieNote: e.target.value })} /></div>
              )}
              <div><label className="label" htmlFor="note">หมายเหตุผล (เช่น ชื่อผู้เล่น รางวัลชมเชย)</label>
                <textarea id="note" rows={2} className="input" disabled={!canEdit} value={draft.note ?? ''} onChange={(e) => edit({ ...draft, note: e.target.value })} /></div>
            </section>

            {canEdit && (
              <div className="sticky bottom-0 z-20 -mx-4 border-t border-line bg-white/95 px-4 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {problems.length > 0 && <p className="mb-2 text-xs text-muted">ก่อนส่งผล: {problems.slice(0, 3).map((p) => p.message).join(' · ')}{problems.length > 3 ? ` และอีก ${problems.length - 3} ข้อ` : ''}</p>}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <SaveIndicator s={s} dirty={dirty} />
                  <div className="flex flex-wrap gap-2">
                    <button className="btn btn-lg" disabled={!dirty || s.kind === 'saving'} onClick={save}>บันทึกฉบับร่าง</button>
                    {canSubmit && <button className="btn btn-primary btn-lg" disabled={problems.length > 0 || s.kind === 'saving'} onClick={submit}>ส่งผลเพื่อตรวจสอบ</button>}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {!canSeeMain && !isJudge && <Notice>คุณไม่มีสิทธิ์บันทึกคะแนนรายการนี้</Notice>}
      </div>
    </>
  );
}

/** ผลจับฉลากเมื่อคะแนนในสายเท่ากัน (ตามสูจิบัตรฟุตบอล: ไม่นับประตูได้เสีย) */
function LeagueTieOrder({ comp, data, draft, onChange, disabled }: { comp: Competition; data: StaffSnapshot; draft: ScoreData; onChange: (d: ScoreData) => void; disabled: boolean }) {
  if (!comp.league) return null;
  const matches = data.matches.filter((m) => m.competitionId === comp.id);
  const V = Object.fromEntries(data.villages.map((v) => [v.id, v]));
  const groups = Object.entries(comp.league.groups).map(([g, teams]) => {
    const rows = leagueTable(matches.filter((m) => m.round === 'group' && m.group === g), teams, comp.league!);
    const tiedPts = [...new Set(rows.filter((r) => r.tied).map((r) => r.points))];
    return { g, tied: tiedPts.map((p) => rows.filter((r) => r.points === p).map((r) => r.villageId)) };
  }).filter((x) => x.tied.length);
  if (!groups.length) return null;
  const order = draft.leagueTieOrder ?? {};
  return (
    <div className="card space-y-3 p-4">
      <h3 className="font-bold">บันทึกผลการจับฉลาก (คะแนนเท่ากันในสาย)</h3>
      {groups.map(({ g, tied }) => (
        <div key={g}>
          <p className="text-sm font-semibold">สาย {g}</p>
          {tied.map((ids, k) => {
            const cur = (order[g] ?? []).filter((x) => ids.includes(x));
            const rest = ids.filter((x) => !cur.includes(x));
            return (
              <div key={k} className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted">ลำดับหลังจับฉลาก:</span>
                {cur.map((x, i) => <span key={x} className="badge bg-field-soft text-field-dark">{i + 1}. {V[x]?.name}</span>)}
                {!disabled && rest.map((x) => <button key={x} className="btn btn-sm" onClick={() => onChange({ ...draft, leagueTieOrder: { ...order, [g]: [...(order[g] ?? []), x] } })}>+ {V[x]?.name}</button>)}
                {!disabled && cur.length > 0 && <button className="btn btn-sm btn-ghost text-danger" onClick={() => onChange({ ...draft, leagueTieOrder: { ...order, [g]: (order[g] ?? []).filter((x) => !ids.includes(x)) } })}>ล้าง</button>}
              </div>
            );
          })}
        </div>
      ))}
      <p className="text-xs text-muted">กดเรียงทีมตามผลจับฉลาก แล้วกด "บันทึกฉบับร่าง"</p>
    </div>
  );
}
