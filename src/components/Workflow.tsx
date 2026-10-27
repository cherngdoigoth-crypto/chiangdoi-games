import { checkTransition, TRANSITIONS, type Competition, type WorkflowAction } from '@domain';
import { useAuth } from '../state/auth';
import { useAction } from '../state/useAction';
import { useUI } from '../state/ui';

const DANGER: WorkflowAction[] = ['reject', 'unpublish', 'reopen', 'unlock'];
const CONFIRM_BODY: Partial<Record<WorkflowAction, string>> = {
  open: 'ผู้บันทึกที่ได้รับมอบหมายจะเริ่มกรอกคะแนนได้',
  submit: 'หลังส่งแล้วผู้บันทึกจะแก้ไขไม่ได้ จนกว่าผู้ตรวจสอบจะส่งกลับ',
  approve: 'ผลจะถูกรับรองและนำไปคำนวณถ้วยรวมภายใน (ยังไม่แสดงต่อสาธารณะ เว้นแต่ตั้งค่าประกาศอัตโนมัติ)',
  return: 'ผลจะกลับไปที่ผู้บันทึกเพื่อแก้ไข',
  reject: 'รายการจะกลับไปสถานะ "ยังไม่เริ่ม" ผู้ดูแลต้องเปิดรับคะแนนใหม่',
  publish: 'ผลจะแสดงบนหน้าสาธารณะและจอแสดงผลทันที',
  unpublish: 'ผลจะถูกถอนออกจากหน้าสาธารณะทันที และบันทึกเหตุผลไว้ในประวัติ',
  lock: 'หลังล็อก จะแก้ไขผลไม่ได้ (ปลดล็อกได้เฉพาะ Super Admin)',
  reopen: 'ผลที่อนุมัติจะถูกยกเลิก และเปิดให้ผู้บันทึกแก้ไขใหม่',
};

export function WorkflowButtons({ comp, actions, isAssignedScorer = false, isSubmitter = false, size = 'md' }: {
  comp: Competition; actions: WorkflowAction[]; isAssignedScorer?: boolean; isSubmitter?: boolean; size?: 'sm' | 'md';
}) {
  const { user } = useAuth();
  const { run, busy } = useAction();
  const { confirm } = useUI();
  if (!user) return null;
  const allowed = actions.filter((a) => {
    const chk = checkTransition(a, { status: comp.status, role: user.role, isAssignedScorer, isSubmitter, reason: 'x' });
    return chk.ok;
  });
  if (!allowed.length) return null;
  const go = async (a: WorkflowAction) => {
    const rule = TRANSITIONS[a];
    const r = await confirm({ title: `${rule.label}: ${comp.name}`, body: CONFIRM_BODY[a], confirmLabel: rule.label, tone: DANGER.includes(a) ? 'danger' : 'primary', reason: rule.reasonRequired ? 'required' : undefined });
    if (!r.ok) return;
    await run('workflow.transition', { competitionId: comp.id, action: a, reason: r.reason }, `${rule.label}เรียบร้อย`, { key: a }).catch(() => undefined);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {allowed.map((a) => (
        <button key={a} className={`btn ${size === 'sm' ? 'btn-sm' : ''} ${DANGER.includes(a) ? '' : 'btn-primary'} ${DANGER.includes(a) ? 'text-danger' : ''}`} disabled={!!busy} onClick={() => go(a)}>
          {busy === a ? 'กำลังดำเนินการ…' : TRANSITIONS[a].label}
        </button>
      ))}
    </div>
  );
}
