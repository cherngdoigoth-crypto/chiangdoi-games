import { useState } from 'react';
import { usePublic, useStaff } from '../../state/live';
import { CupView } from '../../components/views';
import { EmptyState, ErrorState, Loading, PageHeader } from '../../components/ui';

function PublicCup() {
  const { data, error, refresh } = usePublic();
  if (!data) return error ? <ErrorState message={error} onRetry={refresh} /> : <Loading />;
  return (
    <>
      <PageHeader title="ถ้วยคะแนนรวมกีฬา" subtitle="กีฬาพื้นบ้าน 12 ประเภท และการแข่งขันยิงลูกโทษ · แสดงเฉพาะผลที่ประกาศแล้ว" />
      {data.cup ? <CupView cup={data.cup} villages={data.villages} competitions={data.competitions} />
        : <EmptyState title="ยังไม่เปิดเผยคะแนนถ้วยรวม">คณะกรรมการจะประกาศคะแนนถ้วยรวมเร็ว ๆ นี้ ระหว่างนี้ดูผลรายกีฬาที่ประกาศแล้วได้ในเมนู "ผลรายกีฬา"</EmptyState>}
    </>
  );
}

function StaffCup() {
  const { data, error, refresh } = useStaff();
  const [view, setView] = useState<'internal' | 'public'>('internal');
  if (!data) return error ? <ErrorState message={error} onRetry={refresh} /> : <Loading />;
  const cup = view === 'internal' ? data.cupInternal : data.cupPublic;
  return (
    <>
      <PageHeader title="ตารางคะแนนถ้วยรวม" subtitle={view === 'internal' ? 'มุมมองภายใน: รวมผลที่อนุมัติแล้ว (รวมที่ยังไม่ประกาศ)' : 'มุมมองสาธารณะ: เฉพาะผลที่ประกาศแล้ว'}
        actions={<div className="flex rounded-xl border border-line bg-white p-1" role="tablist">
          {(['internal', 'public'] as const).map((v) => <button key={v} role="tab" aria-selected={view === v} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${view === v ? 'bg-field text-white' : ''}`} onClick={() => setView(v)}>{v === 'internal' ? 'ภายใน' : 'สาธารณะ'}</button>)}
        </div>} />
      {view === 'public' && !data.settings.cupVisible && <div className="mb-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">ขณะนี้ซ่อนคะแนนถ้วยรวมจากหน้าสาธารณะ (เปิดได้ที่เมนู "เผยแพร่ผล")</div>}
      <CupView cup={cup} villages={data.villages} competitions={data.competitions} />
    </>
  );
}

export default function CupPage({ mode }: { mode: 'public' | 'staff' }) { return mode === 'public' ? <PublicCup /> : <StaffCup />; }
