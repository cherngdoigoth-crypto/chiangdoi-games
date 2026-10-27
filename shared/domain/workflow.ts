// สถานะรายการ: Draft → Open → Submitted → Approved → Published → Locked
import type { CompStatus, Role, WorkflowAction } from './types';

export interface TransitionRule {
  from: CompStatus[];
  to: CompStatus;
  roles: Role[];
  /** ผู้บันทึกที่ได้รับมอบหมายทำได้ด้วย */
  assignedScorer?: boolean;
  reasonRequired?: boolean;
  label: string;
}

export const TRANSITIONS: Record<WorkflowAction, TransitionRule> = {
  open: { from: ['draft'], to: 'open', roles: ['superadmin', 'admin'], label: 'เปิดรับคะแนน' },
  submit: { from: ['open'], to: 'submitted', roles: ['superadmin', 'admin'], assignedScorer: true, label: 'ส่งผลเพื่อตรวจสอบ' },
  return: { from: ['submitted'], to: 'open', roles: ['superadmin', 'admin', 'reviewer'], reasonRequired: true, label: 'ส่งกลับแก้ไข' },
  reject: { from: ['submitted'], to: 'draft', roles: ['superadmin', 'admin', 'reviewer'], reasonRequired: true, label: 'ปฏิเสธ' },
  approve: { from: ['submitted'], to: 'approved', roles: ['superadmin', 'admin', 'reviewer'], label: 'อนุมัติผล' },
  publish: { from: ['approved'], to: 'published', roles: ['superadmin', 'admin'], label: 'ประกาศผล' },
  unpublish: { from: ['published'], to: 'approved', roles: ['superadmin', 'admin'], reasonRequired: true, label: 'ยกเลิกการประกาศ' },
  lock: { from: ['published'], to: 'locked', roles: ['superadmin', 'admin'], label: 'ล็อกผล' },
  unlock: { from: ['locked'], to: 'published', roles: ['superadmin'], reasonRequired: true, label: 'ปลดล็อก' },
  reopen: { from: ['approved'], to: 'open', roles: ['superadmin', 'admin'], reasonRequired: true, label: 'เปิดแก้ไขผลอีกครั้ง' },
};

export interface TransitionCheck { ok: boolean; to?: CompStatus; error?: string; }

export function checkTransition(
  action: WorkflowAction,
  ctx: { status: CompStatus; role: Role; isAssignedScorer: boolean; reason?: string; isSubmitter?: boolean },
): TransitionCheck {
  const rule = TRANSITIONS[action];
  if (!rule) return { ok: false, error: 'ไม่รู้จักคำสั่งนี้' };
  if (!rule.from.includes(ctx.status)) return { ok: false, error: `ทำ "${rule.label}" ไม่ได้ในสถานะปัจจุบัน` };
  const roleOk = rule.roles.includes(ctx.role) || (rule.assignedScorer && ctx.role === 'scorekeeper' && ctx.isAssignedScorer);
  if (!roleOk) return { ok: false, error: 'คุณไม่มีสิทธิ์ทำรายการนี้' };
  if (rule.reasonRequired && !(ctx.reason ?? '').trim()) return { ok: false, error: 'กรุณาระบุเหตุผล' };
  // แยกหน้าที่: ผู้ส่งผลอนุมัติผลของตัวเองไม่ได้ (ยกเว้น Super Admin)
  if (action === 'approve' && ctx.isSubmitter && ctx.role !== 'superadmin') return { ok: false, error: 'ผู้ส่งผลไม่สามารถอนุมัติผลของตนเองได้' };
  return { ok: true, to: rule.to };
}

export const isStaff = (r: Role | undefined | null) => r === 'superadmin' || r === 'admin' || r === 'scorekeeper' || r === 'reviewer';
export const isAdmin = (r: Role | undefined | null) => r === 'superadmin' || r === 'admin';
export const canReview = (r: Role | undefined | null) => isAdmin(r) || r === 'reviewer';

/** แก้ไขคะแนนได้ในสถานะใด */
export function canEditScores(status: CompStatus, role: Role, isAssignedScorer: boolean): boolean {
  if (isAdmin(role)) return status === 'open' || status === 'submitted';
  if (role === 'scorekeeper' && isAssignedScorer) return status === 'open';
  return false;
}
