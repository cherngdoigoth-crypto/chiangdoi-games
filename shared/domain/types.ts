// ชนิดข้อมูลกลาง ใช้ร่วมกันระหว่างหน้าเว็บ (React) และ Apps Script API

export type Role = 'superadmin' | 'admin' | 'scorekeeper' | 'reviewer' | 'viewer';
export const ROLE_LABEL: Record<Role, string> = {
  superadmin: 'Super Admin',
  admin: 'ผู้ดูแล (Admin)',
  scorekeeper: 'ผู้บันทึกคะแนน',
  reviewer: 'ผู้ตรวจสอบผล',
  viewer: 'ผู้ชม',
};

/** สถานะรายการ: draft = ยังไม่เริ่ม/กำลังตั้งค่า, open = กำลังดำเนินการ (เปิดรับคะแนน) */
export type CompStatus = 'draft' | 'open' | 'submitted' | 'approved' | 'published' | 'locked';
export const STATUS_LABEL: Record<CompStatus, string> = {
  draft: 'ยังไม่เริ่ม',
  open: 'กำลังดำเนินการ',
  submitted: 'รอตรวจสอบ',
  approved: 'อนุมัติแล้ว',
  published: 'ประกาศผลแล้ว',
  locked: 'ล็อกผล',
};

export type Category = 'sport' | 'folk' | 'contest';
/** placement = บันทึกอันดับตรง, criteria = ให้คะแนนตามเกณฑ์, league = แบ่งกลุ่มพบกันหมด+น็อคเอาท์, knockout = น็อคเอาท์ */
export type Format = 'placement' | 'criteria' | 'league' | 'knockout';
export type JudgeMode = 'single' | 'panel';
export type Aggregation = 'average' | 'sum';

export interface Village {
  id: string;          // m1, m2 ...
  no: number;          // หมู่ที่
  name: string;        // บ้าน...
  colorName: string;
  colorHex: string;
  paradeOrder: number;
}

export interface Competition {
  id: string;
  name: string;
  category: Category;
  format: Format;
  gender: 'male' | 'female' | 'mixed' | null;
  countsForCup: boolean;
  places: number;              // จำนวนอันดับที่บันทึก (3 หรือ 4)
  prizes: number[];
  status: CompStatus;
  order: number;
  schedule: string;
  description: string;
  eligibleVillageIds: string[];
  matchesPublic: boolean;      // เผยแพร่ผลรายนัดสด (ฟุตบอล/เปตอง/ยิงลูกโทษ)
  judgeMode: JudgeMode;
  league?: { win: number; draw: number; loss: number; groups: Record<string, string[]>; advance: number } | null;
  version: number;
  updatedAt: string;
}

export interface CriterionItem { key: string; label: string; max: number | null; }
export interface CriteriaConfig {
  competitionId: string;
  items: CriterionItem[];
  maxTotal: number;            // 50 ตามสูจิบัตร
  aggregation: Aggregation | null; // ใช้เมื่อ judgeMode = panel
  confirmed: boolean;
  confirmedBy: string | null;
  confirmedAt: string | null;
}

export type Placements = Record<string, string | null>; // "1" -> villageId
export type CriteriaEntries = Record<string, Record<string, number | null>>; // villageId -> criterionKey -> score

export interface ScoreData {
  placements: Placements;
  entries?: CriteriaEntries;          // judgeMode single
  tieNote?: string;                    // เหตุผลเมื่อเลือกลำดับในกรณีคะแนนเท่ากัน
  note?: string;                       // หมายเหตุผล เช่น ชื่อผู้เล่น ชมเชย
  leagueTieOrder?: Record<string, string[]>; // ผลจับฉลากกรณีคะแนนเท่ากันในสาย
}

export interface ScoreRecord {
  competitionId: string;
  data: ScoreData;
  version: number;
  updatedBy: string | null;
  updatedAt: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  reviewNote: string | null;
}

export interface JudgeSheet {
  competitionId: string;
  judgeId: string;
  entries: CriteriaEntries;
  version: number;
  updatedAt: string | null;
}

export interface Match {
  id: string;
  competitionId: string;
  no: number;
  round: 'group' | 'r1' | 'qf' | 'semi' | 'third' | 'final';
  group: string | null;
  schedule: string;
  field: string;
  homeId: string | null;
  awayId: string | null;
  homeLabel: string;      // ใช้เมื่อยังไม่ทราบทีม เช่น "ที่ 1 สาย A"
  awayLabel: string;
  homeScore: number | null;
  awayScore: number | null;
  homePens: number | null;
  awayPens: number | null;
  status: 'scheduled' | 'played';
  version: number;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface RankedEntry { villageId: string; total: number; rank: number; tied: boolean; complete: boolean; judges?: number; }

export interface ResultRecord {
  competitionId: string;
  placements: Placements;
  ranking: RankedEntry[] | null;     // รายการประกวด
  cupPoints: Record<string, number>;
  countsForCup: boolean;
  note: string;
  tieNote: string;
  approvedBy: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
}

export type TieRule = 'unconfirmed' | 'shared' | 'countback' | 'manual';
export const TIE_RULE_LABEL: Record<TieRule, string> = {
  unconfirmed: 'ยังไม่ยืนยัน (แสดงอันดับร่วมพร้อมคำเตือน)',
  shared: 'ให้อันดับร่วมกัน',
  countback: 'นับจำนวนชนะเลิศ ที่ 2 และที่ 3 ตามลำดับ',
  manual: 'ผู้ดูแลกำหนดลำดับเอง',
};

export interface Settings {
  cupVisible: boolean;
  autoPublishOnApprove: boolean;
  tieRule: TieRule;
  tieRuleConfirmed: boolean;
  tieManualOrder: string[];     // villageIds เรียงลำดับเมื่อ tieRule = manual
  eventName: string;
}

export interface CupBreakdownItem { competitionId: string; place: number; points: number; }
export interface CupRow {
  villageId: string;
  points: number;
  golds: number;
  silvers: number;
  bronzes: number;
  rank: number;
  tied: boolean;          // อยู่ในกลุ่มคะแนนเท่ากันที่ยังตัดสินไม่ได้
  breakdown: CupBreakdownItem[];
}
export interface CupStandings { rows: CupRow[]; countedResults: number; totalCupEvents: number; tieRule: TieRule; tieUnresolved: boolean; }

export interface PublicUser { id: string; username: string; displayName: string; role: Role; active: boolean; mustChangePassword: boolean; }

export interface Assignment { competitionId: string; scorerId: string | null; judgeIds: string[]; }

export interface AuditEntry { id: string; at: string; userId: string | null; userName: string; action: string; competitionId: string | null; detail: string; }

export type WorkflowAction = 'open' | 'submit' | 'return' | 'reject' | 'approve' | 'publish' | 'unpublish' | 'lock' | 'unlock' | 'reopen';
