// กรอกคะแนนตามเกณฑ์ทีละหมู่บ้าน พร้อมรวมคะแนนและตรวจค่าทันที
import { useState } from 'react';
import { entryTotal, validateEntry, type CriteriaEntries, type CriterionItem, type Village } from '@domain';
import { NumberStepper, VillageChip } from '../../../components/ui';
import { fmtNum } from '../../../lib/format';

export function CriteriaGrid({ items, maxTotal, villages, order, entries, onChange, disabled }: {
  items: CriterionItem[]; maxTotal: number; villages: Village[]; order: string[]; entries: CriteriaEntries; onChange: (e: CriteriaEntries) => void; disabled?: boolean;
}) {
  const [vid, setVid] = useState(order[0]);
  const V = Object.fromEntries(villages.map((v) => [v.id, v]));
  const entry = entries[vid] ?? {};
  const t = entryTotal(items, entry);
  const issues = validateEntry(items, entry, false);
  const set = (key: string, val: number | null) => onChange({ ...entries, [vid]: { ...entry, [key]: val } });
  const idx = order.indexOf(vid);
  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="เลือกหมู่บ้าน">
        {order.map((id, i) => {
          const tt = entryTotal(items, entries[id]);
          const bad = validateEntry(items, entries[id], false).length > 0;
          return (
            <li key={id} className="flex-none">
              <button type="button" onClick={() => setVid(id)} aria-current={vid === id}
                className={`flex w-full min-w-[12rem] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm ${vid === id ? 'border-field bg-field-soft/60' : 'border-line bg-white'}`}>
                <span className="flex min-w-0 items-center gap-2"><span className="text-xs text-muted">{i + 1}</span><VillageChip v={V[id]} size="sm" showNo={false} /></span>
                <span className={`text-xs font-semibold tabular ${bad ? 'text-danger' : tt.complete ? 'text-field' : 'text-muted'}`}>{bad ? 'ผิด' : tt.complete ? fmtNum(tt.total, 0) : 'ยังไม่ครบ'}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-lg font-bold"><VillageChip v={V[vid]} size="lg" /></div>
          <div className={`font-display text-3xl font-bold tabular ${t.complete ? 'text-field' : ''}`}>{fmtNum(t.total)}<span className="text-base text-muted"> / {maxTotal}</span></div>
        </div>
        <div className="space-y-3">
          {items.map((it, i) => {
            const v = entry[it.key] ?? null;
            const bad = typeof v === 'number' && (v < 0 || (it.max !== null && v > it.max));
            return (
              <div key={it.key} className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 last:border-0">
                <label htmlFor={`sc-${vid}-${it.key}`} className="min-w-0 flex-1 text-sm"><span className="text-muted">{i + 1}.</span> {it.label} <span className="text-xs text-muted">(เต็ม {it.max})</span></label>
                <NumberStepper id={`sc-${vid}-${it.key}`} label={it.label} value={v} min={0} max={it.max} step={0.5} disabled={disabled} invalid={bad} onChange={(n) => set(it.key, n)} />
              </div>
            );
          })}
        </div>
        {issues.length > 0 && <ul className="mt-3 list-disc pl-5 text-sm text-danger" role="alert">{issues.map((x, k) => <li key={k}>{x.message}</li>)}</ul>}
        <div className="mt-4 flex justify-between">
          <button type="button" className="btn" disabled={idx <= 0} onClick={() => setVid(order[idx - 1])}>← ก่อนหน้า</button>
          <button type="button" className="btn" disabled={idx >= order.length - 1} onClick={() => setVid(order[idx + 1])}>ถัดไป →</button>
        </div>
      </div>
    </div>
  );
}
