// จอแสดงผลสาธารณะ (โปรเจกเตอร์ / จอ LED) — อ่านจากระยะไกล แสดงเฉพาะผลที่เผยแพร่แล้ว
import { useEffect, useState } from 'react';
import { usePublic } from '../../state/live';
import { byId } from '../../components/views';
import { ConnectionBadge } from '../../components/ui';
import { PLACE_LABEL } from '../../lib/format';

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return <span className="tabular">{new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(t)} น.</span>;
}

export default function Display() {
  const { data, state, lastSync } = usePublic();
  const [page, setPage] = useState(0);
  useEffect(() => { const i = setInterval(() => setPage((p) => p + 1), 9000); return () => clearInterval(i); }, []);
  useEffect(() => { document.title = 'จอแสดงผล · เชิงดอยเกมส์ 26'; }, []);

  if (!data) return <div className="display-root grid min-h-screen place-items-center bg-turf text-[2em] text-muted">กำลังเชื่อมต่อ…</div>;
  const V = byId(data.villages); const C = byId(data.competitions);
  const latest = [...data.results].sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
  const perPage = data.cup ? 3 : 6;
  const pages = Math.max(1, Math.ceil(latest.length / perPage));
  const shown = latest.slice((page % pages) * perPage, (page % pages) * perPage + perPage);
  const max = Math.max(3, ...(data.cup?.rows.map((r) => r.points) ?? [0]));

  return (
    <div className="display-root flex min-h-screen flex-col bg-turf text-ink">
      <header className="flex items-center justify-between gap-[1em] border-b-[0.25em] border-field bg-white px-[1.5em] py-[0.8em]">
        <div className="flex items-center gap-[0.8em]">
          <span className="grid h-[2.6em] w-[2.6em] place-items-center rounded-[0.5em] bg-field font-display text-[1.4em] font-bold text-white">26</span>
          <div><div className="font-display text-[2em] font-bold leading-none">เชิงดอยเกมส์ ครั้งที่ 26</div><div className="text-[0.95em] text-muted">ประจำปีงบประมาณ 2570 · สนามกีฬาเทศบาลตำบลเชิงดอย</div></div>
        </div>
        <div className="flex items-center gap-[1em] text-[1.3em] font-display font-semibold"><ConnectionBadge state={state} lastSync={lastSync} /><Clock /></div>
      </header>
      <main className={`grid flex-1 gap-[1.2em] p-[1.2em] ${data.cup ? 'lg:grid-cols-[1.6fr_1fr]' : ''}`}>
        {data.cup && (
          <section className="rounded-[1em] bg-white p-[1.2em] shadow-sm">
            <div className="mb-[0.6em] flex items-baseline justify-between">
              <h2 className="font-display text-[1.8em] font-bold">ถ้วยคะแนนรวมกีฬา</h2>
              <span className="text-[1em] text-muted">ประกาศแล้ว {data.cup.countedResults}/{data.cup.totalCupEvents} รายการ</span>
            </div>
            {data.cup.tieUnresolved && <div className="mb-[0.5em] rounded-[0.5em] bg-warn-soft px-[0.8em] py-[0.3em] text-[0.9em] text-warn">มีคะแนนเท่ากัน แสดงเป็นอันดับร่วม</div>}
            <ol className="space-y-[0.35em]">
              {data.cup.rows.map((r) => {
                const v = V[r.villageId];
                return (
                  <li key={r.villageId} className="grid grid-cols-[2.2em_minmax(0,11em)_1fr_3em] items-center gap-[0.6em] text-[1.35em]">
                    <span className={`grid h-[1.8em] w-[1.8em] place-items-center rounded-full font-display font-bold ${r.rank === 1 && r.points ? 'bg-gold text-white' : r.rank === 2 && r.points ? 'bg-silver text-white' : r.rank === 3 && r.points ? 'bg-bronze text-white' : 'bg-turf text-muted'}`}>{r.points ? r.rank : '–'}</span>
                    <span className="truncate font-semibold">{v?.name}</span>
                    <span className="h-[1.1em] overflow-hidden rounded-full bg-turf"><span className="block h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(2, (r.points / max) * 100)}%`, background: v?.colorHex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} /></span>
                    <span className="text-right font-display text-[1.3em] font-bold tabular">{r.points}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
        <section className="rounded-[1em] bg-white p-[1.2em] shadow-sm">
          <h2 className="mb-[0.6em] font-display text-[1.8em] font-bold">ผลการแข่งขันล่าสุด</h2>
          {shown.length === 0 ? <p className="text-[1.3em] text-muted">รอการประกาศผล</p> : (
            <div className={`grid gap-[0.8em] ${data.cup ? '' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
              {shown.map((r) => (
                <div key={r.competitionId} className="rounded-[0.7em] border border-line p-[0.8em]">
                  <div className="font-display text-[1.35em] font-bold">{C[r.competitionId]?.name}</div>
                  <ol className="mt-[0.3em] space-y-[0.2em]">
                    {Object.entries(r.placements).filter(([, v]) => v).slice(0, 3).map(([p, vid]) => (
                      <li key={p} className="flex items-center gap-[0.5em] text-[1.15em]">
                        <span className={`grid h-[1.5em] w-[1.5em] place-items-center rounded-full font-display text-[0.85em] font-bold text-white ${p === '1' ? 'bg-gold' : p === '2' ? 'bg-silver' : 'bg-bronze'}`}>{p}</span>
                        <span className="h-[0.9em] w-[0.9em] rounded-[0.2em]" style={{ background: V[vid!]?.colorHex }} />
                        <span className="font-semibold">{V[vid!]?.name}</span>
                        <span className="ml-auto text-[0.75em] text-muted">{PLACE_LABEL[Number(p)]}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
          {pages > 1 && <div className="mt-[0.6em] flex justify-center gap-[0.3em]">{Array.from({ length: pages }, (_, i) => <span key={i} className={`h-[0.5em] w-[0.5em] rounded-full ${i === page % pages ? 'bg-field' : 'bg-line'}`} />)}</div>}
        </section>
      </main>
    </div>
  );
}
