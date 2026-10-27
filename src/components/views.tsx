// มุมมองที่ใช้ร่วมกันระหว่างหน้าสาธารณะ จอแสดงผล และหน้าเจ้าหน้าที่
import { useState, type ReactElement } from 'react';
import {
  leagueTable, matchWinner, TIE_RULE_LABEL, type Competition, type CriteriaConfig, type CupStandings, type Match, type ResultRecord, type Village,
} from '@domain';
import { Medal, VillageChip } from './ui';
import { fmtBaht, fmtDateTime, fmtNum, PLACE_LABEL } from '../lib/format';

export const byId = <T extends { id: string }>(list: T[]) => Object.fromEntries(list.map((x) => [x.id, x])) as Record<string, T>;

export function CupView({ cup, villages, competitions, compact = false }: { cup: CupStandings; villages: Village[]; competitions: Competition[]; compact?: boolean }) {
  const V = byId(villages); const C = byId(competitions);
  const [open, setOpen] = useState<string | null>(null);
  const max = Math.max(3, ...cup.rows.map((r) => r.points));
  const top = cup.rows.filter((r) => r.points > 0).slice(0, 3);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
        <span className="badge bg-white ring-1 ring-line">นับแล้ว {cup.countedResults} / {cup.totalCupEvents} รายการ</span>
        <span>ชนะเลิศ 3 · รองอันดับ 1 ได้ 2 · รองอันดับ 2 ได้ 1</span>
      </div>
      {cup.tieUnresolved && (
        <div className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          มีหมู่บ้านคะแนนเท่ากัน และผู้จัดยังไม่ได้ยืนยันกติกาตัดสินเสมอ จึงแสดงเป็นอันดับร่วม
        </div>
      )}
      {cup.tieRule !== 'unconfirmed' && <p className="text-xs text-muted">กติกาตัดสินเสมอ: {TIE_RULE_LABEL[cup.tieRule]}</p>}
      {!compact && top.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {top.map((r) => (
            <div key={r.villageId} className="card relative overflow-hidden p-4">
              <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: V[r.villageId]?.colorHex }} />
              <div className="flex items-center gap-2"><Medal place={r.rank} /><span className="eyebrow">อันดับ {r.rank}{r.tied ? ' (ร่วม)' : ''}</span></div>
              <div className="mt-2 font-display text-xl font-bold">{V[r.villageId]?.name}</div>
              <div className="font-display text-4xl font-bold tabular text-field">{r.points}<span className="ml-1 text-sm font-medium text-muted">คะแนน</span></div>
            </div>
          ))}
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th className="w-14 text-center">อันดับ</th><th>หมู่บ้าน</th><th className="text-center">ชนะเลิศ</th><th className="text-center">ที่ 2</th><th className="text-center">ที่ 3</th><th className="text-right">คะแนน</th></tr></thead>
          <tbody>
            {cup.rows.map((r) => (
              <FragmentRow key={r.villageId} open={open === r.villageId}>
                <tr className="cursor-pointer hover:bg-turf" onClick={() => setOpen(open === r.villageId ? null : r.villageId)} aria-expanded={open === r.villageId}>
                  <td className="text-center font-display text-lg font-bold">{r.points > 0 ? r.rank : "–"}{r.tied && r.points > 0 && <span className="block text-[10px] font-normal text-warn">ร่วม</span>}</td>
                  <td><VillageChip v={V[r.villageId]} /></td>
                  <td className="text-center tabular">{r.golds || '–'}</td>
                  <td className="text-center tabular">{r.silvers || '–'}</td>
                  <td className="text-center tabular">{r.bronzes || '–'}</td>
                  <td>
                    <div className="flex items-center justify-end gap-3">
                      <div className="hidden h-2 w-28 overflow-hidden rounded-full bg-turf sm:block"><div className="h-full rounded-full" style={{ width: `${(r.points / max) * 100}%`, background: V[r.villageId]?.colorHex }} /></div>
                      <span className="w-8 text-right font-display text-xl font-bold tabular">{r.points}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={6} className="bg-turf/60 text-sm">
                    {r.breakdown.length ? (
                      <ul className="grid gap-1 sm:grid-cols-2">{r.breakdown.map((b) => (
                        <li key={b.competitionId} className="flex items-center gap-2"><Medal place={b.place} size="sm" />{C[b.competitionId]?.name ?? b.competitionId}<span className="ml-auto font-semibold">+{b.points}</span></li>
                      ))}</ul>
                    ) : <span className="text-muted">ยังไม่มีคะแนน</span>}
                  </td>
                </tr>
              </FragmentRow>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted no-print">แตะที่แถวเพื่อดูว่าได้คะแนนจากรายการใด · ฟุตบอล 7 คน เปตองคู่ผสม และการประกวด ไม่นับรวมในถ้วยคะแนนรวม</p>
    </div>
  );
}
function FragmentRow({ open, children }: { open: boolean; children: [ReactElement, ReactElement] }) {
  return <>{children[0]}{open && children[1]}</>;
}

export function ResultCard({ comp, result, villages, criteria }: { comp: Competition; result: ResultRecord; villages: Village[]; criteria?: CriteriaConfig }) {
  const V = byId(villages);
  const places = Object.keys(result.placements).map(Number).sort((a, b) => a - b).filter((p) => result.placements[String(p)]);
  return (
    <article className="card p-4">
      <header className="mb-3 flex items-start justify-between gap-2">
        <div><h3 className="text-base font-bold">{comp.name}</h3><p className="text-xs text-muted">{comp.schedule}</p></div>
        {comp.countsForCup && <span className="badge bg-field-soft text-field-dark">นับถ้วยรวม</span>}
      </header>
      <ol className="space-y-2">
        {places.map((p) => (
          <li key={p} className="flex items-center gap-3">
            <Medal place={p} />
            <div className="min-w-0 flex-1"><VillageChip v={V[result.placements[String(p)]!]} /><div className="text-xs text-muted">{PLACE_LABEL[p]}{comp.prizes[p - 1] ? ` · ${fmtBaht(comp.prizes[p - 1])}` : ''}</div></div>
            {comp.countsForCup && p <= 3 && <span className="text-sm font-semibold text-field">+{4 - p}</span>}
          </li>
        ))}
      </ol>
      {result.ranking && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-field">คะแนนทุกหมู่บ้าน{criteria ? ` (เต็ม ${criteria.maxTotal})` : ''}</summary>
          <table className="tbl mt-2"><tbody>{result.ranking.map((r) => (
            <tr key={r.villageId}><td className="w-10 text-center">{r.rank}</td><td><VillageChip v={V[r.villageId]} size="sm" /></td><td className="text-right font-semibold tabular">{fmtNum(r.total, 2)}</td></tr>
          ))}</tbody></table>
        </details>
      )}
      {result.note && <p className="mt-3 text-xs text-muted">หมายเหตุ: {result.note}</p>}
      {result.publishedAt && <p className="mt-2 text-[11px] text-muted">ประกาศ {fmtDateTime(result.publishedAt)}</p>}
    </article>
  );
}

export function LeagueTables({ comp, matches, villages, tieOrder }: { comp: Competition; matches: Match[]; villages: Village[]; tieOrder?: Record<string, string[]> }) {
  const V = byId(villages);
  if (!comp.league) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Object.entries(comp.league.groups).map(([g, teams]) => {
        const rows = leagueTable(matches.filter((m) => m.round === 'group' && m.group === g), teams, comp.league!, tieOrder?.[g]);
        return (
          <div key={g} className="card overflow-x-auto">
            <div className="px-3 pt-3 font-display font-bold">สาย {g}</div>
            <table className="tbl">
              <thead><tr><th>#</th><th>ทีม</th><th className="text-center">แข่ง</th><th className="text-center">ชนะ</th>{comp.league!.draw > 0 && <th className="text-center">เสมอ</th>}<th className="text-center">แพ้</th><th className="text-center">ได้-เสีย</th><th className="text-right">คะแนน</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.villageId} className={r.rank <= comp.league!.advance ? 'bg-field-soft/40' : ''}>
                  <td>{r.rank}{r.tied && <span className="ml-1 text-[10px] text-warn">เท่ากัน</span>}</td>
                  <td><VillageChip v={V[r.villageId]} size="sm" showNo={false} /></td>
                  <td className="text-center tabular">{r.played}</td><td className="text-center tabular">{r.won}</td>
                  {comp.league!.draw > 0 && <td className="text-center tabular">{r.drawn}</td>}
                  <td className="text-center tabular">{r.lost}</td><td className="text-center tabular text-muted">{r.gf}-{r.ga}</td>
                  <td className="text-right font-display font-bold tabular">{r.points}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        );
      })}
      <p className="text-xs text-muted md:col-span-2">ที่ 1–{comp.league.advance} ของแต่ละสายเข้ารอบ · คะแนนเท่ากันตัดสินด้วยการจับฉลาก (ไม่นับประตูได้เสีย)</p>
    </div>
  );
}

const ROUND_LABEL: Record<Match['round'], string> = { group: 'รอบแรก', r1: 'รอบแรก', qf: 'รอบ 8 ทีม', semi: 'รอบรองชนะเลิศ', third: 'ชิงที่ 3', final: 'ชิงชนะเลิศ' };
export const roundLabel = (m: Match) => `${ROUND_LABEL[m.round]}${m.group ? ` สาย ${m.group}` : ''}`;

export function MatchLine({ m, villages }: { m: Match; villages: Village[] }) {
  const V = byId(villages);
  const w = matchWinner(m);
  const side = (id: string | null, label: string) => (id ? <span className={w === id ? 'font-bold' : ''}><VillageChip v={V[id]} size="sm" showNo={false} /></span> : <span className="text-muted">{label || 'รอผล'}</span>);
  return (
    <div className="grid grid-cols-[3rem_1fr_auto_1fr] items-center gap-2 py-2 text-sm">
      <span className="text-xs text-muted">#{m.no}</span>
      <span className="justify-self-end text-right">{side(m.homeId, m.homeLabel)}</span>
      <span className="min-w-[4.5rem] rounded-lg bg-turf px-2 py-1 text-center font-display font-bold tabular">
        {m.status === 'played' ? `${m.homeScore} – ${m.awayScore}` : 'vs'}
        {m.status === 'played' && m.homePens !== null && <span className="block text-[10px] font-normal text-muted">จุดโทษ {m.homePens}-{m.awayPens}</span>}
      </span>
      <span>{side(m.awayId, m.awayLabel)}</span>
      <span className="col-span-4 -mt-1 pl-12 text-[11px] text-muted">{roundLabel(m)} · {m.schedule}{m.field ? ` · ${m.field}` : ''}</span>
    </div>
  );
}
