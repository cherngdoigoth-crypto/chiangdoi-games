// เลือกอันดับด้วยการแตะ: แตะช่องอันดับ แล้วแตะหมู่บ้าน (ปุ่มใหญ่สำหรับมือถือ)
import { useState } from 'react';
import type { Placements, Village } from '@domain';
import { Medal, VillageChip } from '../../../components/ui';
import { PLACE_LABEL } from '../../../lib/format';

export function PlacementPicker({ places, value, onChange, villages, eligible, disabled, totals, suggestion }: {
  places: number; value: Placements; onChange: (p: Placements) => void; villages: Village[]; eligible: string[]; disabled?: boolean;
  totals?: Record<string, number>; suggestion?: Placements | null;
}) {
  const [active, setActive] = useState(1);
  const V = Object.fromEntries(villages.map((v) => [v.id, v]));
  const pick = (vid: string) => {
    if (disabled) return;
    const next: Placements = { ...value };
    for (const k of Object.keys(next)) if (next[k] === vid) next[k] = null; // ย้ายจากอันดับเดิม
    next[String(active)] = vid;
    onChange(next);
    const nextEmpty = Array.from({ length: places }, (_, i) => i + 1).find((p) => !next[String(p)]);
    if (nextEmpty) setActive(nextEmpty);
  };
  const usable = suggestion && Object.values(suggestion).some(Boolean);
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: places }, (_, i) => i + 1).map((p) => {
          const vid = value[String(p)];
          return (
            <button key={p} type="button" disabled={disabled} onClick={() => setActive(p)} aria-pressed={active === p}
              className={`flex min-h-[64px] items-center gap-3 rounded-xl border-2 bg-white px-3 py-2 text-left transition ${active === p && !disabled ? 'border-field ring-4 ring-field/15' : 'border-line'}`}>
              <Medal place={p} size="lg" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted">{PLACE_LABEL[p]}</span>
                {vid ? <span className="font-semibold"><VillageChip v={V[vid]} showNo={false} /></span> : <span className="text-muted">แตะเพื่อเลือก</span>}
              </span>
              {vid && !disabled && <span role="button" tabIndex={0} aria-label={`ล้างอันดับ ${p}`} className="rounded-lg px-2 py-1 text-xs text-danger hover:bg-danger-soft" onClick={(e) => { e.stopPropagation(); onChange({ ...value, [String(p)]: null }); }}>ล้าง</span>}
            </button>
          );
        })}
      </div>
      {usable && !disabled && (
        <button type="button" className="btn btn-sm" onClick={() => onChange({ ...value, ...Object.fromEntries(Object.entries(suggestion!).filter(([, v]) => v)) })}>ใช้อันดับตามที่ระบบคำนวณ</button>
      )}
      {!disabled && (
        <div>
          <p className="mb-2 text-sm font-medium">เลือกหมู่บ้านสำหรับ <b>{PLACE_LABEL[active]}</b></p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {eligible.map((vid) => {
              const at = Object.entries(value).find(([, v]) => v === vid)?.[0];
              return (
                <button key={vid} type="button" onClick={() => pick(vid)}
                  className={`flex min-h-[56px] items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 text-left text-sm font-semibold transition hover:border-field ${at ? 'border-field bg-field-soft/50' : 'border-line'}`}>
                  <VillageChip v={V[vid]} size="sm" showNo={false} />
                  <span className="flex flex-col items-end text-xs">
                    {at && <span className="text-field">อันดับ {at}</span>}
                    {totals && <span className="tabular text-muted">{totals[vid] ?? 0}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
