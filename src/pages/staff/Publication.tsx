import { useEffect, useState } from 'react';
import { TIE_RULE_LABEL, type TieRule } from '@domain';
import { useStaff } from '../../state/live';
import { useAction } from '../../state/useAction';
import { useUI } from '../../state/ui';
import { ErrorState, Loading, Notice, PageHeader, StatusBadge, VillageChip } from '../../components/ui';
import { WorkflowButtons } from '../../components/Workflow';
import { fmtDateTime } from '../../lib/format';

export default function Publication() {
  const { data, error, refresh } = useStaff();
  const { run, busy } = useAction();
  const { confirm } = useUI();
  const [rule, setRule] = useState<TieRule>('unconfirmed');
  const [confirmed, setConfirmed] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  useEffect(() => {
    if (!data) return;
    setRule(data.settings.tieRule); setConfirmed(data.settings.tieRuleConfirmed);
    setOrder(data.settings.tieManualOrder.length ? data.settings.tieManualOrder : data.cupInternal.rows.map((r) => r.villageId));
  }, [data?.settings.tieRule, data?.settings.tieRuleConfirmed, data?.settings.tieManualOrder.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!data) return error ? <ErrorState message={error} onRetry={refresh} /> : <Loading />;
  const s = data.settings;
  const R = Object.fromEntries(data.results.map((r) => [r.competitionId, r]));
  const V = Object.fromEntries(data.villages.map((v) => [v.id, v]));
  const toggle = async (key: 'cupVisible' | 'autoPublishOnApprove', label: string) => {
    const r = await confirm({ title: label, body: key === 'cupVisible' ? (s.cupVisible ? 'คะแนนถ้วยรวมจะถูกซ่อนจากหน้าสาธารณะและจอแสดงผลทันที' : 'คะแนนถ้วยรวม (เฉพาะผลที่ประกาศแล้ว) จะแสดงบนหน้าสาธารณะทันที') : 'เมื่อเปิด ผลที่อนุมัติจะถูกประกาศทันทีโดยไม่ต้องกดประกาศแยก', reason: 'optional' });
    if (r.ok) run('settings.update', { [key]: !s[key], reason: r.reason }, 'บันทึกแล้ว').catch(() => undefined);
  };
  const move = (i: number, d: number) => { const n = [...order]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setOrder(n); };
  return (
    <>
      <PageHeader title="เผยแพร่ผล" subtitle="ควบคุมสิ่งที่แสดงต่อสาธารณะ — ข้อมูลที่ยังไม่ประกาศจะไม่ถูกส่งออกจากเซิร์ฟเวอร์" />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-4 p-5">
          <h2 className="text-lg font-bold">การแสดงผลสาธารณะ</h2>
          <div className="flex items-center justify-between gap-3">
            <div><p className="font-semibold">คะแนนถ้วยรวม</p><p className="text-sm text-muted">{s.cupVisible ? 'กำลังแสดงบนหน้าสาธารณะ (เฉพาะผลที่ประกาศแล้ว)' : 'ซ่อนอยู่'}</p></div>
            <button className={`btn ${s.cupVisible ? '' : 'btn-primary'}`} disabled={!!busy} onClick={() => toggle('cupVisible', s.cupVisible ? 'ซ่อนคะแนนถ้วยรวม' : 'เปิดเผยคะแนนถ้วยรวม')}>{s.cupVisible ? 'ซ่อน' : 'เปิดเผย'}</button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div><p className="font-semibold">ประกาศผลอัตโนมัติเมื่ออนุมัติ</p><p className="text-sm text-muted">{s.autoPublishOnApprove ? 'เปิดอยู่: อนุมัติแล้วประกาศทันที' : 'ปิด: ต้องกดประกาศผลแยก (แนะนำ)'}</p></div>
            <button className="btn" disabled={!!busy} onClick={() => toggle('autoPublishOnApprove', s.autoPublishOnApprove ? 'ปิดการประกาศอัตโนมัติ' : 'เปิดการประกาศอัตโนมัติ')}>{s.autoPublishOnApprove ? 'ปิด' : 'เปิด'}</button>
          </div>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">กติกาตัดสินเมื่อคะแนนถ้วยรวมเท่ากัน</h2>
          <Notice tone="warn">สูจิบัตรไม่ได้ระบุวิธีตัดสินกรณีคะแนนรวมเท่ากัน ให้เลือกตามมติของผู้จัดเท่านั้น</Notice>
          <div className="space-y-2">
            {(Object.keys(TIE_RULE_LABEL) as TieRule[]).map((k) => (
              <label key={k} className="flex items-start gap-2 text-sm"><input type="radio" name="tie" className="mt-1" checked={rule === k} onChange={() => { setRule(k); setConfirmed(false); }} />{TIE_RULE_LABEL[k]}</label>
            ))}
          </div>
          {rule === 'manual' && (
            <ol className="space-y-1">
              {order.map((vid, i) => (
                <li key={vid} className="flex items-center justify-between gap-2 rounded-lg border border-line px-2 py-1 text-sm">
                  <span className="flex items-center gap-2"><span className="w-5 text-muted">{i + 1}</span><VillageChip v={V[vid]} size="sm" /></span>
                  <span className="flex gap-1"><button className="btn btn-sm" aria-label="เลื่อนขึ้น" onClick={() => move(i, -1)}>↑</button><button className="btn btn-sm" aria-label="เลื่อนลง" onClick={() => move(i, 1)}>↓</button></span>
                </li>
              ))}
              <p className="text-xs text-muted">ลำดับนี้ใช้เฉพาะหมู่บ้านที่คะแนนเท่ากันเท่านั้น</p>
            </ol>
          )}
          {rule !== 'unconfirmed' && <label className="flex items-start gap-2 text-sm font-medium"><input type="checkbox" className="mt-1" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />ยืนยันว่ากติกานี้ได้รับการรับรองจากคณะกรรมการจัดการแข่งขันแล้ว</label>}
          <button className="btn btn-primary" disabled={!!busy || (rule !== 'unconfirmed' && !confirmed)}
            onClick={async () => { const r = await confirm({ title: 'บันทึกกติกาตัดสินเสมอ', body: TIE_RULE_LABEL[rule], reason: rule === 'unconfirmed' ? 'optional' : 'required', reasonLabel: 'อ้างอิงมติผู้จัด' }); if (r.ok) run('settings.update', { tieRule: rule, tieRuleConfirmed: confirmed, tieManualOrder: order, reason: r.reason }, 'บันทึกกติกาแล้ว').catch(() => undefined); }}>บันทึกกติกา</button>
        </section>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-bold">สถานะการเผยแพร่รายรายการ</h2>
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>รายการ</th><th>สถานะ</th><th>ประกาศเมื่อ</th><th>ผลรายนัดสด</th><th>การดำเนินการ</th></tr></thead>
            <tbody>{data.competitions.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td>
                <td><StatusBadge status={c.status} /></td>
                <td className="text-xs text-muted">{fmtDateTime(R[c.id]?.publishedAt)}</td>
                <td>{(c.format === 'league' || c.format === 'knockout') ? (
                  <button className={`btn btn-sm ${c.matchesPublic ? 'btn-primary' : ''}`} disabled={!!busy}
                    onClick={() => run('competitions.update', { id: c.id, baseVersion: c.version, patch: { matchesPublic: !c.matchesPublic } }, c.matchesPublic ? 'ซ่อนผลรายนัดแล้ว' : 'เผยแพร่ผลรายนัดแล้ว').catch(() => undefined)}>{c.matchesPublic ? 'แสดงอยู่' : 'ซ่อนอยู่'}</button>
                ) : <span className="text-muted">–</span>}</td>
                <td><WorkflowButtons comp={c} actions={['publish', 'unpublish', 'lock', 'unlock', 'reopen']} size="sm" /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}
