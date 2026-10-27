import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { validateCriteriaConfig, type Competition, type CriteriaConfig, type CriterionItem, type Match } from '@domain';
import { useStaff } from '../../state/live';
import { useAuth } from '../../state/auth';
import { useAction } from '../../state/useAction';
import { useUI } from '../../state/ui';
import { ErrorState, Loading, Notice, PageHeader, StatusBadge, VillageChip } from '../../components/ui';
import { WorkflowButtons } from '../../components/Workflow';
import { roundLabel } from '../../components/views';
import type { StaffSnapshot } from '../../lib/types';
import { FORMAT_LABEL } from './Competitions';

function Section({ title, children, desc }: { title: string; desc?: string; children: React.ReactNode }) {
  return <section className="card p-5"><h2 className="text-lg font-bold">{title}</h2>{desc && <p className="mt-1 text-sm text-muted">{desc}</p>}<div className="mt-4">{children}</div></section>;
}

function SettingsForm({ c, data }: { c: Competition; data: StaffSnapshot }) {
  const { run, busy } = useAction();
  const { user } = useAuth();
  const { confirm } = useUI();
  const draft = c.status === 'draft';
  const [f, setF] = useState({ name: c.name, schedule: c.schedule, description: c.description, places: c.places, prizes: c.prizes.join(', '), eligible: c.eligibleVillageIds, judgeMode: c.judgeMode });
  useEffect(() => { setF({ name: c.name, schedule: c.schedule, description: c.description, places: c.places, prizes: c.prizes.join(', '), eligible: c.eligibleVillageIds, judgeMode: c.judgeMode }); }, [c.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async () => {
    const patch: Record<string, unknown> = { name: f.name, schedule: f.schedule, description: f.description };
    if (draft) Object.assign(patch, { places: f.places, prizes: f.prizes.split(/[,\s]+/).filter(Boolean).map(Number), eligibleVillageIds: f.eligible, ...(c.format === 'criteria' ? { judgeMode: f.judgeMode } : {}) });
    await run('competitions.update', { id: c.id, baseVersion: c.version, patch }, 'บันทึกการตั้งค่าแล้ว').catch(() => undefined);
  };
  const toggleCup = async () => {
    const r = await confirm({ title: c.countsForCup ? 'เลิกนับรายการนี้ในถ้วยรวม' : 'นับรายการนี้ในถ้วยรวม', body: 'สูจิบัตรกำหนดให้นับเฉพาะกีฬาพื้นบ้านและยิงลูกโทษ การเปลี่ยนต้องมีการยืนยันจากผู้จัดอย่างเป็นทางการ', reason: 'required', reasonLabel: 'อ้างอิงการยืนยันจากผู้จัด', tone: 'danger' });
    if (r.ok) await run('competitions.update', { id: c.id, baseVersion: c.version, patch: { countsForCup: !c.countsForCup }, reason: r.reason }, 'บันทึกแล้ว').catch(() => undefined);
  };
  return (
    <Section title="รายละเอียดรายการ" desc={draft ? undefined : 'แก้จำนวนอันดับ รางวัล ผู้มีสิทธิ์ และรูปแบบกรรมการได้เฉพาะสถานะ "ยังไม่เริ่ม"'}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="cf-name">ชื่อรายการ</label><input id="cf-name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label" htmlFor="cf-sched">กำหนดการ</label><input id="cf-sched" className="input" value={f.schedule} onChange={(e) => setF({ ...f, schedule: e.target.value })} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="cf-desc">กติกา/รายละเอียด</label><textarea id="cf-desc" rows={2} className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div><label className="label" htmlFor="cf-places">จำนวนอันดับที่บันทึก</label><select id="cf-places" disabled={!draft} className="input" value={f.places} onChange={(e) => setF({ ...f, places: Number(e.target.value) })}>{[1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}</select></div>
        <div><label className="label" htmlFor="cf-prizes">เงินรางวัล (บาท) เรียงตามอันดับ</label><input id="cf-prizes" disabled={!draft} className="input" value={f.prizes} onChange={(e) => setF({ ...f, prizes: e.target.value })} placeholder="1000, 800, 500" /></div>
        {c.format === 'criteria' && (
          <div className="sm:col-span-2"><span className="label">ผู้ให้คะแนน</span>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="radio" name="jm" disabled={!draft} checked={f.judgeMode === 'single'} onChange={() => setF({ ...f, judgeMode: 'single' })} />ผู้บันทึกคนเดียวกรอกคะแนนรวมของคณะกรรมการ</label>
              <label className="flex items-center gap-2"><input type="radio" name="jm" disabled={!draft} checked={f.judgeMode === 'panel'} onChange={() => setF({ ...f, judgeMode: 'panel' })} />กรรมการแต่ละคนกรอกใบคะแนนของตนเอง (กรอกพร้อมกันได้)</label>
            </div>
          </div>
        )}
        <div className="sm:col-span-2"><span className="label">หมู่บ้านที่มีสิทธิ์แข่งขัน ({f.eligible.length})</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {data.villages.map((v) => (
              <label key={v.id} className="flex items-center gap-2 rounded-lg border border-line px-2 py-1.5 text-sm">
                <input type="checkbox" disabled={!draft} checked={f.eligible.includes(v.id)} onChange={(e) => setF({ ...f, eligible: e.target.checked ? [...f.eligible, v.id] : f.eligible.filter((x) => x !== v.id) })} />
                <VillageChip v={v} size="sm" showNo={false} />
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" disabled={!!busy} onClick={save}>บันทึกการตั้งค่า</button>
        <span className="text-sm">ถ้วยคะแนนรวม: <b>{c.countsForCup ? 'นับ' : 'ไม่นับ'}</b></span>
        {user?.role === 'superadmin' && draft && <button className="btn btn-sm" onClick={toggleCup}>เปลี่ยนเงื่อนไขถ้วยรวม</button>}
      </div>
    </Section>
  );
}

function CriteriaEditor({ c, cr }: { c: Competition; cr: CriteriaConfig }) {
  const { run, busy } = useAction();
  const draft = c.status === 'draft';
  const [items, setItems] = useState<CriterionItem[]>(cr.items);
  const [agg, setAgg] = useState(cr.aggregation);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (!dirty) { setItems(cr.items); setAgg(cr.aggregation); } }, [cr, dirty]);
  const issues = validateCriteriaConfig(items, cr.maxTotal);
  const sum = items.reduce((s, i) => s + (i.max ?? 0), 0);
  const upd = (i: number, patch: Partial<CriterionItem>) => { setDirty(true); setItems(items.map((it, k) => (k === i ? { ...it, ...patch } : it))); };
  const save = async () => { await run('criteria.update', { competitionId: c.id, items, aggregation: agg }, 'บันทึกเกณฑ์แล้ว (ต้องกดยืนยันอีกครั้ง)').then(() => setDirty(false)).catch(() => undefined); };
  return (
    <Section title="เกณฑ์การตัดสิน" desc={`คะแนนเต็มรวม ${cr.maxTotal} คะแนน ตามสูจิบัตร · สูจิบัตรไม่ได้ระบุคะแนนเต็มรายข้อ ผู้ดูแลต้องกำหนดและยืนยันก่อนเปิดรับคะแนน`}>
      {cr.confirmed ? <Notice tone="success">ยืนยันเกณฑ์แล้ว {cr.confirmedAt && `เมื่อ ${new Date(cr.confirmedAt).toLocaleString('th-TH')}`}</Notice> : <Notice tone="warn">ยังไม่ยืนยันเกณฑ์ — เปิดรับคะแนนไม่ได้</Notice>}
      <div className="mt-4 space-y-2">
        {items.map((it, i) => (
          <div key={it.key} className="grid grid-cols-[2rem_1fr_6rem_auto] items-center gap-2">
            <span className="text-sm text-muted">{i + 1}.</span>
            <input aria-label={`ชื่อเกณฑ์ข้อ ${i + 1}`} className="input" disabled={!draft} value={it.label} onChange={(e) => upd(i, { label: e.target.value })} />
            <input aria-label={`คะแนนเต็มข้อ ${i + 1}`} className="input text-center" disabled={!draft} inputMode="decimal" value={it.max ?? ''} placeholder="เต็ม" onChange={(e) => upd(i, { max: e.target.value === '' ? null : Number(e.target.value) })} />
            {draft ? <button className="btn btn-sm btn-ghost text-danger" aria-label={`ลบเกณฑ์ข้อ ${i + 1}`} onClick={() => { setDirty(true); setItems(items.filter((_, k) => k !== i)); }}>ลบ</button> : <span />}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        {draft && <button className="btn btn-sm" onClick={() => { setDirty(true); setItems([...items, { key: `c${Date.now().toString(36)}`, label: '', max: null }]); }}>+ เพิ่มเกณฑ์</button>}
        <span className={sum === cr.maxTotal ? 'text-field' : 'text-warn'}>รวม {sum} / {cr.maxTotal}</span>
      </div>
      {c.judgeMode === 'panel' && (
        <div className="mt-4"><span className="label">วิธีรวมคะแนนจากกรรมการหลายคน</span>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="radio" name="agg" disabled={!draft} checked={agg === 'average'} onChange={() => { setDirty(true); setAgg('average'); }} />ค่าเฉลี่ย (คะแนนเต็มยังเป็น {cr.maxTotal})</label>
            <label className="flex items-center gap-2"><input type="radio" name="agg" disabled={!draft} checked={agg === 'sum'} onChange={() => { setDirty(true); setAgg('sum'); }} />ผลรวมของกรรมการทุกคน</label>
          </div>
        </div>
      )}
      {draft && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn" disabled={!!busy || !dirty} onClick={save}>บันทึกเกณฑ์</button>
          <button className="btn btn-primary" disabled={!!busy || dirty || cr.confirmed || issues.length > 0 || (c.judgeMode === 'panel' && !agg)} onClick={() => run('criteria.confirm', { competitionId: c.id }, 'ยืนยันเกณฑ์แล้ว').catch(() => undefined)}>ยืนยันเกณฑ์</button>
        </div>
      )}
      {draft && issues.length > 0 && <ul className="mt-2 list-disc pl-5 text-xs text-warn">{issues.map((i, k) => <li key={k}>{i.message}</li>)}</ul>}
    </Section>
  );
}

function AssignmentForm({ c, data }: { c: Competition; data: StaffSnapshot }) {
  const { run, busy } = useAction();
  const a = data.assignments.find((x) => x.competitionId === c.id) ?? { scorerId: null, judgeIds: [] };
  const [scorer, setScorer] = useState(a.scorerId ?? '');
  const [judges, setJudges] = useState<string[]>(a.judgeIds);
  useEffect(() => { setScorer(a.scorerId ?? ''); setJudges(a.judgeIds); }, [a.scorerId, a.judgeIds.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const candidates = data.users.filter((u) => u.active && ['scorekeeper', 'admin', 'superadmin'].includes(u.role));
  const locked = ['approved', 'published', 'locked'].includes(c.status);
  return (
    <Section title="ผู้รับผิดชอบ" desc="ผู้บันทึกคะแนนหลักได้ 1 คนต่อรายการ (หนึ่งคนรับผิดชอบหลายรายการได้)">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="as-scorer">ผู้บันทึกคะแนนหลัก</label>
          <select id="as-scorer" className="input" disabled={locked} value={scorer} onChange={(e) => setScorer(e.target.value)}>
            <option value="">— ยังไม่มอบหมาย —</option>
            {candidates.map((u) => <option key={u.id} value={u.id}>{u.displayName}</option>)}
          </select></div>
        {c.judgeMode === 'panel' && (
          <div><span className="label">คณะกรรมการ ({judges.length})</span>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
              {candidates.map((u) => <label key={u.id} className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={locked} checked={judges.includes(u.id)} onChange={(e) => setJudges(e.target.checked ? [...judges, u.id] : judges.filter((x) => x !== u.id))} />{u.displayName}</label>)}
              {!candidates.length && <p className="text-sm text-muted">ยังไม่มีบัญชีผู้บันทึกคะแนน — สร้างที่หน้า "ผู้ใช้งาน"</p>}
            </div></div>
        )}
      </div>
      <button className="btn btn-primary mt-4" disabled={!!busy || locked} onClick={() => run('assignments.set', { competitionId: c.id, scorerId: scorer || null, judgeIds: judges }, 'บันทึกผู้รับผิดชอบแล้ว').catch(() => undefined)}>บันทึกผู้รับผิดชอบ</button>
    </Section>
  );
}

function GroupsEditor({ c, data }: { c: Competition; data: StaffSnapshot }) {
  const { run, busy } = useAction();
  const [groups, setGroups] = useState<Record<string, string[]>>(c.league?.groups ?? {});
  if (!c.league) return null;
  const draft = c.status === 'draft';
  const assign = (vid: string, g: string) => {
    const next: Record<string, string[]> = {};
    for (const [k, ids] of Object.entries(groups)) next[k] = ids.filter((x) => x !== vid);
    if (g) next[g] = [...(next[g] ?? []), vid];
    setGroups(next);
  };
  const names = Object.keys(groups).length ? Object.keys(groups) : ['A', 'B'];
  return (
    <Section title="การแบ่งสาย" desc={`ชนะ ${c.league.win} · เสมอ ${c.league.draw} · แพ้ ${c.league.loss} คะแนน · ที่ 1–${c.league.advance} ของสายเข้ารอบ`}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {c.eligibleVillageIds.map((vid) => (
          <label key={vid} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-1.5 text-sm">
            <VillageChip v={data.villages.find((v) => v.id === vid)} size="sm" />
            <select aria-label="สาย" disabled={!draft} className="rounded-md border border-line px-2 py-1" value={names.find((g) => groups[g]?.includes(vid)) ?? ''} onChange={(e) => assign(vid, e.target.value)}>
              <option value="">–</option>{names.map((g) => <option key={g} value={g}>สาย {g}</option>)}
            </select>
          </label>
        ))}
      </div>
      {draft && <button className="btn btn-primary mt-3" disabled={!!busy} onClick={() => run('competitions.update', { id: c.id, baseVersion: c.version, patch: { league: { ...c.league, groups } } }, 'บันทึกการแบ่งสายแล้ว').catch(() => undefined)}>บันทึกการแบ่งสาย</button>}
    </Section>
  );
}

function MatchesAdmin({ c, matches, data }: { c: Competition; matches: Match[]; data: StaffSnapshot }) {
  const { run, busy } = useAction();
  const { confirm } = useUI();
  const [nm, setNm] = useState({ round: 'r1', group: '', schedule: '', homeLabel: '', awayLabel: '' });
  const V = Object.fromEntries(data.villages.map((v) => [v.id, v]));
  return (
    <Section title={`ตารางการแข่งขัน (${matches.length} นัด)`} desc="บันทึกผลรายนัดได้ที่หน้า &quot;บันทึกคะแนน&quot; · ผู้ดูแลเพิ่ม/ลบนัดที่ยังไม่มีผลได้ที่นี่">
      <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>#</th><th>รอบ</th><th>เวลา</th><th>คู่แข่งขัน</th><th>ผล</th><th /></tr></thead>
        <tbody>{matches.map((m) => (
          <tr key={m.id}>
            <td>{m.no}</td><td className="text-xs">{roundLabel(m)}</td><td className="text-xs text-muted">{m.schedule} {m.field}</td>
            <td className="text-sm">{m.homeId ? V[m.homeId]?.name : m.homeLabel} <span className="text-muted">vs</span> {m.awayId ? V[m.awayId]?.name : m.awayLabel}</td>
            <td className="tabular">{m.status === 'played' ? `${m.homeScore}-${m.awayScore}` : '–'}</td>
            <td>{m.status !== 'played' && <button className="btn btn-sm btn-ghost text-danger" disabled={!!busy} onClick={async () => { if ((await confirm({ title: `ลบนัดที่ ${m.no}`, tone: 'danger', confirmLabel: 'ลบ' })).ok) run('matches.delete', { matchId: m.id }, 'ลบนัดแล้ว').catch(() => undefined); }}>ลบ</button>}</td>
          </tr>
        ))}</tbody></table></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-6">
        <select aria-label="รอบ" className="input" value={nm.round} onChange={(e) => setNm({ ...nm, round: e.target.value })}>
          {[['group', 'รอบแบ่งกลุ่ม'], ['r1', 'รอบแรก'], ['qf', 'รอบ 8 ทีม'], ['semi', 'รอบรองฯ'], ['third', 'ชิงที่ 3'], ['final', 'ชิงชนะเลิศ']].map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input aria-label="สาย" className="input" placeholder="สาย" value={nm.group} onChange={(e) => setNm({ ...nm, group: e.target.value })} />
        <input aria-label="เวลา" className="input" placeholder="เวลา" value={nm.schedule} onChange={(e) => setNm({ ...nm, schedule: e.target.value })} />
        <input aria-label="ทีมเหย้า" className="input" placeholder="ป้ายทีม 1 เช่น ทีมชนะคู่ 39" value={nm.homeLabel} onChange={(e) => setNm({ ...nm, homeLabel: e.target.value })} />
        <input aria-label="ทีมเยือน" className="input" placeholder="ป้ายทีม 2" value={nm.awayLabel} onChange={(e) => setNm({ ...nm, awayLabel: e.target.value })} />
        <button className="btn" disabled={!!busy} onClick={() => run('matches.create', { competitionId: c.id, ...nm }, 'เพิ่มนัดแล้ว').catch(() => undefined)}>+ เพิ่มนัด</button>
      </div>
    </Section>
  );
}

export default function CompetitionDetail() {
  const { id } = useParams();
  const { data, error, refresh } = useStaff();
  if (!data) return error ? <ErrorState message={error} onRetry={refresh} /> : <Loading />;
  const c = data.competitions.find((x) => x.id === id);
  if (!c) return <ErrorState message="ไม่พบรายการนี้" />;
  const cr = data.criteria.find((x) => x.competitionId === c.id);
  const matches = data.matches.filter((m) => m.competitionId === c.id).sort((a, b) => a.no - b.no);
  return (
    <>
      <p className="mb-2 text-sm no-print"><Link to="/staff/competitions" className="text-field">← จัดการการแข่งขัน</Link></p>
      <PageHeader title={c.name} subtitle={<span className="inline-flex flex-wrap items-center gap-2"><StatusBadge status={c.status} />{FORMAT_LABEL[c.format]} · {c.schedule}</span>}
        actions={<WorkflowButtons comp={c} actions={['open', 'reopen']} />} />
      <div className="space-y-4">
        <SettingsForm key={c.id} c={c} data={data} />
        {c.format === 'criteria' && cr && <CriteriaEditor c={c} cr={cr} />}
        <AssignmentForm c={c} data={data} />
        {c.format === 'league' && <GroupsEditor c={c} data={data} />}
        {(c.format === 'league' || c.format === 'knockout') && <MatchesAdmin c={c} matches={matches} data={data} />}
      </div>
    </>
  );
}
