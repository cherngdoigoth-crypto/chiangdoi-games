// บันทึกผลรายนัด (ฟุตบอล เปตอง ยิงลูกโทษ) — แต่ละนัดบันทึกแยกกัน ตรวจเวอร์ชันกันแก้ชน
import { useEffect, useState } from 'react';
import type { Competition, Match, Village } from '@domain';
import { useAction } from '../../../state/useAction';
import { NumberStepper, VillageChip } from '../../../components/ui';
import { roundLabel } from '../../../components/views';
import { fmtTime } from '../../../lib/format';

function MatchEditor({ m, comp, villages, disabled }: { m: Match; comp: Competition; villages: Village[]; disabled: boolean }) {
  const { run, busy } = useAction();
  const [f, setF] = useState({ homeId: m.homeId, awayId: m.awayId, homeScore: m.homeScore, awayScore: m.awayScore, homePens: m.homePens, awayPens: m.awayPens });
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (!dirty) setF({ homeId: m.homeId, awayId: m.awayId, homeScore: m.homeScore, awayScore: m.awayScore, homePens: m.homePens, awayPens: m.awayPens }); }, [m.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const V = Object.fromEntries(villages.map((v) => [v.id, v]));
  const upd = (p: Partial<typeof f>) => { setDirty(true); setF({ ...f, ...p }); };
  const knockout = m.round !== 'group';
  const needPens = knockout && f.homeScore !== null && f.homeScore === f.awayScore;
  const save = async (status: 'played' | 'scheduled') => {
    const patch = status === 'scheduled' ? { homeScore: null, awayScore: null, homePens: null, awayPens: null, status, homeId: f.homeId, awayId: f.awayId } : { ...f, homePens: needPens ? f.homePens : null, awayPens: needPens ? f.awayPens : null, status };
    await run('matches.save', { competitionId: comp.id, matchId: m.id, baseVersion: m.version, patch }, status === 'played' ? `บันทึกผลนัดที่ ${m.no} แล้ว` : `ล้างผลนัดที่ ${m.no} แล้ว`, { key: m.id })
      .then(() => setDirty(false)).catch(() => setDirty(false));
  };
  const teamPicker = (side: 'homeId' | 'awayId', label: string) => (
    f[side] && (m[side] || disabled) ? <VillageChip v={V[f[side]!]} showNo={false} /> : (
      <select aria-label={`เลือก${label}`} className="input py-1.5 text-sm" disabled={disabled} value={f[side] ?? ''} onChange={(e) => upd({ [side]: e.target.value || null })}>
        <option value="">{(side === 'homeId' ? m.homeLabel : m.awayLabel) || `เลือก${label}`}</option>
        {comp.eligibleVillageIds.map((id) => <option key={id} value={id}>{V[id]?.name}</option>)}
      </select>
    )
  );
  return (
    <div className={`card p-3 ${m.status === 'played' ? 'bg-field-soft/30' : ''}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>นัดที่ {m.no} · {roundLabel(m)} · {m.schedule}{m.field ? ` · ${m.field}` : ''}</span>
        {m.status === 'played' && <span className="badge bg-field-soft text-field-dark">บันทึกผลแล้ว {m.updatedAt && fmtTime(m.updatedAt)}</span>}
      </div>
      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-col gap-2">{teamPicker('homeId', 'ทีมที่ 1')}<NumberStepper id={`hs-${m.id}`} label="ประตูทีมที่ 1" value={f.homeScore} max={99} disabled={disabled} onChange={(n) => upd({ homeScore: n === null ? null : Math.round(n) })} /></div>
        <span className="text-center font-display text-lg text-muted">vs</span>
        <div className="flex flex-col gap-2">{teamPicker('awayId', 'ทีมที่ 2')}<NumberStepper id={`as-${m.id}`} label="ประตูทีมที่ 2" value={f.awayScore} max={99} disabled={disabled} onChange={(n) => upd({ awayScore: n === null ? null : Math.round(n) })} /></div>
      </div>
      {needPens && (
        <div className="mt-3 rounded-xl bg-warn-soft p-3">
          <p className="mb-2 text-sm font-semibold text-warn">เสมอ — กรอกผลยิงจุดโทษ</p>
          <div className="flex flex-wrap gap-4">
            <NumberStepper id={`hp-${m.id}`} label="จุดโทษทีมที่ 1" value={f.homePens} max={99} disabled={disabled} onChange={(n) => upd({ homePens: n === null ? null : Math.round(n) })} />
            <NumberStepper id={`ap-${m.id}`} label="จุดโทษทีมที่ 2" value={f.awayPens} max={99} disabled={disabled} onChange={(n) => upd({ awayPens: n === null ? null : Math.round(n) })} />
          </div>
        </div>
      )}
      {!disabled && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-primary btn-sm" disabled={!!busy || f.homeScore === null || f.awayScore === null || !f.homeId || !f.awayId} onClick={() => save('played')}>{busy === m.id ? 'กำลังบันทึก…' : 'บันทึกผลนัดนี้'}</button>
          {m.status === 'played' && <button className="btn btn-sm" disabled={!!busy} onClick={() => save('scheduled')}>ล้างผล</button>}
          {!m.homeId && f.homeId && m.status !== 'played' && <button className="btn btn-sm" disabled={!!busy} onClick={() => run('matches.save', { competitionId: comp.id, matchId: m.id, baseVersion: m.version, patch: { homeId: f.homeId, awayId: f.awayId } }, 'บันทึกคู่แข่งขันแล้ว').then(() => setDirty(false)).catch(() => undefined)}>บันทึกคู่แข่งขัน</button>}
          {dirty && <span className="self-center text-xs text-warn">ยังไม่ได้บันทึก</span>}
        </div>
      )}
    </div>
  );
}

export function MatchesPanel({ comp, matches, villages, disabled }: { comp: Competition; matches: Match[]; villages: Village[]; disabled: boolean }) {
  const [filter, setFilter] = useState<'todo' | 'all'>('todo');
  const shown = filter === 'todo' ? matches.filter((m) => m.status !== 'played') : matches;
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button className={`btn btn-sm ${filter === 'todo' ? 'btn-primary' : ''}`} onClick={() => setFilter('todo')}>ยังไม่มีผล ({matches.filter((m) => m.status !== 'played').length})</button>
        <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilter('all')}>ทั้งหมด ({matches.length})</button>
      </div>
      {shown.length === 0 && <p className="text-sm text-muted">บันทึกผลครบทุกนัดแล้ว</p>}
      <div className="grid gap-3 lg:grid-cols-2">{shown.map((m) => <MatchEditor key={m.id} m={m} comp={comp} villages={villages} disabled={disabled} />)}</div>
    </div>
  );
}
