// Integration tests ของ API: บันทึกข้อมูล สิทธิ์ การแก้ไขพร้อมกัน และการประกาศผล (ใช้ MemoryStore แทน Google Sheets)
import { createHash, randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { handle, seedAll, type ApiResponse, type Ctx } from '../server/src/api';
import { MemoryStore, type Crypto } from '../server/src/store';

let now = new Date('2026-11-08T02:00:00Z');
const crypto: Crypto = {
  sha256Hex: (s) => createHash('sha256').update(s, 'utf8').digest('hex'),
  randomToken: () => randomBytes(32).toString('hex'),
  now: () => now,
};
let ctx: Ctx;
const call = (action: string, payload: any = {}, token: string | null = null): ApiResponse => handle({ action, payload, token }, ctx);
const ok = <T = any>(r: ApiResponse): T => { if (!r.ok) throw new Error(`${r.code}: ${r.error}`); return r.data as T; };

let superTok = '';
async function bootstrap() {
  ctx = { store: new MemoryStore(), crypto };
  seedAll(ctx, { username: 'root', password: 'Start1234' });
  const { token } = ok(call('auth.login', { username: 'root', password: 'Start1234' }));
  ok(call('auth.changePassword', { oldPassword: 'Start1234', newPassword: 'Root5678x' }, token));
  superTok = token;
}
function makeUser(username: string, role: string, by = superTok) {
  const { user } = ok(call('users.create', { username, displayName: username, role, password: 'Temp1234' }, by));
  const { token } = ok(call('auth.login', { username, password: 'Temp1234' }));
  ok(call('auth.changePassword', { oldPassword: 'Temp1234', newPassword: 'Pass5678' }, token));
  return { id: user.id as string, token: token as string };
}
const comp = (id: string, tok = superTok) => ok(call('staff.snapshot', {}, tok)).competitions.find((c: any) => c.id === id);
const scoreOf = (id: string, tok = superTok) => ok(call('staff.snapshot', {}, tok)).scores.find((s: any) => s.competitionId === id);

beforeEach(async () => { now = new Date('2026-11-08T02:00:00Z'); await bootstrap(); });

describe('การเข้าสู่ระบบและบัญชีผู้ใช้', () => {
  it('ต้องเปลี่ยนรหัสผ่านครั้งแรกก่อนใช้งาน', () => {
    const admin = ok(call('users.create', { username: 'aa1', displayName: 'A1', role: 'scorekeeper', password: 'Temp1234' }, superTok));
    const { token } = ok(call('auth.login', { username: 'aa1', password: 'Temp1234' }));
    expect(call('staff.snapshot', {}, token).code).toBe('MUST_CHANGE_PASSWORD');
    expect(admin.user.mustChangePassword).toBe(true);
  });
  it('รหัสผิด 5 ครั้งล็อกบัญชีชั่วคราว', () => {
    for (let i = 0; i < 5; i++) expect(call('auth.login', { username: 'root', password: 'wrong' }).code).toBe('BAD_LOGIN');
    expect(call('auth.login', { username: 'root', password: 'Root5678x' }).code).toBe('LOCKED');
    now = new Date(now.getTime() + 11 * 60000);
    expect(call('auth.login', { username: 'root', password: 'Root5678x' }).ok).toBe(true);
  });
  it('เก็บรหัสผ่านแบบแฮช ไม่มีรหัสจริงในฐานข้อมูล', () => {
    const dump = JSON.stringify(ctx.store.all('Users'));
    expect(dump).not.toContain('Root5678x');
    expect(dump).not.toContain('Start1234');
  });
  it('Admin สร้างบัญชี Admin ไม่ได้ ผู้บันทึกสร้างบัญชีไม่ได้', () => {
    const admin = makeUser('admin1', 'admin');
    expect(call('users.create', { username: 'xx1', role: 'admin', password: 'Temp1234' }, admin.token).code).toBe('FORBIDDEN');
    const sk = makeUser('sk0', 'scorekeeper');
    expect(call('users.create', { username: 'yy1', role: 'viewer', password: 'Temp1234' }, sk.token).code).toBe('FORBIDDEN');
  });
  it('session หมดอายุหลัง 12 ชั่วโมง และปิดบัญชีแล้วใช้งานต่อไม่ได้', () => {
    const sk = makeUser('sk0', 'scorekeeper');
    ok(call('users.update', { id: sk.id, active: false }, superTok));
    expect(call('staff.snapshot', {}, sk.token).code).toBe('UNAUTHENTICATED');
    now = new Date(now.getTime() + 13 * 3600000);
    expect(call('staff.snapshot', {}, superTok).code).toBe('UNAUTHENTICATED');
  });
});

describe('บันทึกผลกีฬาพื้นบ้าน ตรวจสอบ และประกาศผล', () => {
  let sk1: { id: string; token: string }, sk2: { id: string; token: string }, rv: { id: string; token: string };
  beforeEach(() => {
    sk1 = makeUser('sk1', 'scorekeeper'); sk2 = makeUser('sk2', 'scorekeeper'); rv = makeUser('rv1', 'reviewer');
    ok(call('assignments.set', { competitionId: 'kick_m', scorerId: sk1.id }, superTok));
  });

  it('เปิดรับคะแนนไม่ได้ถ้ายังไม่มอบหมายผู้บันทึก', () => {
    expect(call('workflow.transition', { competitionId: 'kick_f', action: 'open' }, superTok).error).toContain('มอบหมาย');
  });

  it('ขั้นตอนเต็ม: ร่าง → ส่ง → อนุมัติ → ประกาศ และหน้าสาธารณะเห็นเฉพาะผลที่ประกาศ', () => {
    expect(call('scores.save', { competitionId: 'kick_m', baseVersion: 0, data: { placements: { 1: 'm1' } } }, sk1.token).code).toBe('FORBIDDEN'); // ยังไม่เปิด
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'open' }, superTok));
    expect(call('scores.save', { competitionId: 'kick_m', baseVersion: 0, data: { placements: { 1: 'm1' } } }, sk2.token).code).toBe('FORBIDDEN'); // ไม่ได้รับมอบหมาย
    ok(call('scores.save', { competitionId: 'kick_m', baseVersion: 0, data: { placements: { 1: 'm1' } } }, sk1.token));
    expect(call('workflow.transition', { competitionId: 'kick_m', action: 'submit' }, sk1.token).code).toBe('INVALID'); // ไม่ครบ
    ok(call('scores.save', { competitionId: 'kick_m', baseVersion: 1, data: { placements: { 1: 'm1', 2: 'm2', 3: 'm5' } } }, sk1.token));
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'submit' }, sk1.token));
    expect(comp('kick_m').status).toBe('submitted');
    // ส่งแล้วผู้บันทึกแก้ไม่ได้
    expect(call('scores.save', { competitionId: 'kick_m', baseVersion: 2, data: { placements: {} } }, sk1.token).code).toBe('FORBIDDEN');
    // ผู้บันทึกอนุมัติเองไม่ได้
    expect(call('workflow.transition', { competitionId: 'kick_m', action: 'approve' }, sk1.token).code).toBe('FORBIDDEN');
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'approve' }, rv.token));

    // อนุมัติแล้วแต่ยังไม่ประกาศ: สาธารณะต้องไม่เห็น
    let pub = ok(call('public.snapshot'));
    expect(pub.results).toHaveLength(0);
    expect(JSON.stringify(pub)).not.toContain('"placements"');
    expect(pub.cup).toBeNull();

    // ผู้ตรวจสอบประกาศผลไม่ได้
    expect(call('workflow.transition', { competitionId: 'kick_m', action: 'publish' }, rv.token).code).toBe('FORBIDDEN');
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'publish' }, superTok));
    pub = ok(call('public.snapshot'));
    expect(pub.results.map((r: any) => r.competitionId)).toEqual(['kick_m']);
    expect(pub.cup).toBeNull(); // ถ้วยรวมยังซ่อน
    ok(call('settings.update', { cupVisible: true }, superTok));
    pub = ok(call('public.snapshot'));
    expect(pub.cup.rows[0]).toMatchObject({ villageId: 'm1', points: 3 });

    // ยกเลิกประกาศต้องมีเหตุผล และหายจากหน้าสาธารณะ
    expect(call('workflow.transition', { competitionId: 'kick_m', action: 'unpublish' }, superTok).error).toContain('เหตุผล');
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'unpublish', reason: 'พบข้อผิดพลาด' }, superTok));
    pub = ok(call('public.snapshot'));
    expect(pub.results).toHaveLength(0);
    expect(pub.cup.rows[0].points).toBe(0);

    const audit = ok(call('audit.list', { competitionId: 'kick_m' }, superTok));
    expect(audit.map((a: any) => a.action)).toEqual(expect.arrayContaining(['scores.save', 'workflow.submit', 'workflow.approve', 'workflow.publish', 'workflow.unpublish']));
  });

  it('ส่งกลับแก้ไข → แก้ → อนุมัติใหม่ ถ้วยรวมคำนวณใหม่', () => {
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'open' }, superTok));
    ok(call('scores.save', { competitionId: 'kick_m', baseVersion: 0, data: { placements: { 1: 'm1', 2: 'm2', 3: 'm5' } } }, sk1.token));
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'submit' }, sk1.token));
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'return', reason: 'อันดับ 1-2 สลับกัน' }, rv.token));
    expect(scoreOf('kick_m').reviewNote).toBe('อันดับ 1-2 สลับกัน');
    ok(call('scores.save', { competitionId: 'kick_m', baseVersion: 1, data: { placements: { 1: 'm2', 2: 'm1', 3: 'm5' } } }, sk1.token));
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'submit' }, sk1.token));
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'approve' }, rv.token));
    const snap = ok(call('staff.snapshot', {}, superTok));
    expect(snap.cupInternal.rows[0]).toMatchObject({ villageId: 'm2', points: 3 });
    expect(snap.cupPublic.rows[0].points).toBe(0); // ยังไม่ประกาศ
  });

  it('ป้องกันการแก้ไขพร้อมกัน: บันทึกด้วยเวอร์ชันเก่าถูกปฏิเสธ', () => {
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'open' }, superTok));
    ok(call('scores.save', { competitionId: 'kick_m', baseVersion: 0, data: { placements: { 1: 'm1' } } }, sk1.token));
    // แอดมินแก้จากอีกเครื่อง
    ok(call('scores.save', { competitionId: 'kick_m', baseVersion: 1, data: { placements: { 1: 'm2' } } }, superTok));
    const stale = call('scores.save', { competitionId: 'kick_m', baseVersion: 1, data: { placements: { 1: 'm6' } } }, sk1.token);
    expect(stale.code).toBe('CONFLICT');
    expect(scoreOf('kick_m').data.placements['1']).toBe('m2');
  });

  it('ผู้ชมทั่วไปและผู้บันทึกที่ไม่เกี่ยวข้องไม่เห็นคะแนนร่าง', () => {
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'open' }, superTok));
    ok(call('scores.save', { competitionId: 'kick_m', baseVersion: 0, data: { placements: { 1: 'm13' } } }, sk1.token));
    expect(scoreOf('kick_m', sk2.token)).toBeUndefined();
    const viewer = makeUser('viewer1', 'viewer');
    expect(ok(call('staff.snapshot', {}, viewer.token)).scores).toHaveLength(0);
    expect(JSON.stringify(ok(call('public.snapshot')))).not.toContain('m13"}');
    expect(call('staff.snapshot', {}, null).code).toBe('UNAUTHENTICATED');
  });

  it('revision เพิ่มเมื่อมีการเขียน และไม่ส่งข้อมูลซ้ำเมื่อไม่มีการเปลี่ยนแปลง', () => {
    const r1 = ok(call('public.snapshot')).rev;
    expect(ok(call('public.snapshot', { since: r1 }))).toEqual({ rev: r1, unchanged: true });
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'open' }, superTok));
    expect(ok(call('public.snapshot', { since: r1 })).rev).toBe(r1 + 1);
  });

  it('ล็อกผลแล้วแก้ไม่ได้ ปลดล็อกได้เฉพาะ Super Admin', () => {
    const admin = makeUser('adm', 'admin');
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'open' }, superTok));
    ok(call('scores.save', { competitionId: 'kick_m', baseVersion: 0, data: { placements: { 1: 'm1', 2: 'm2', 3: 'm5' } } }, sk1.token));
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'submit' }, sk1.token));
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'approve' }, rv.token));
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'publish' }, admin.token));
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'lock' }, admin.token));
    expect(call('scores.save', { competitionId: 'kick_m', baseVersion: 1, data: { placements: {} } }, admin.token).code).toBe('FORBIDDEN');
    expect(call('workflow.transition', { competitionId: 'kick_m', action: 'unlock', reason: 'x' }, admin.token).code).toBe('FORBIDDEN');
    ok(call('workflow.transition', { competitionId: 'kick_m', action: 'unlock', reason: 'แก้ชื่อ' }, superTok));
  });
});

describe('การประกวดแบบคณะกรรมการ (ขบวนพาเหรด)', () => {
  let head: { id: string; token: string }, j1: { id: string; token: string }, j2: { id: string; token: string }, rv: { id: string; token: string };
  const full = (n: number) => ({ c1: n, c2: n, c3: n, c4: n, c5: n });
  const allV = ['m1', 'm2', 'm5', 'm6', 'm7', 'm9', 'm10', 'm11', 'm12', 'm13'];
  beforeEach(() => {
    head = makeUser('head', 'scorekeeper'); j1 = makeUser('judge1', 'scorekeeper'); j2 = makeUser('judge2', 'scorekeeper'); rv = makeUser('rv1', 'reviewer');
    ok(call('assignments.set', { competitionId: 'parade', scorerId: head.id, judgeIds: [j1.id, j2.id] }, superTok));
  });

  it('เปิดรับคะแนนไม่ได้จนกว่าผู้ดูแลกำหนดคะแนนเต็มรายข้อและยืนยัน', () => {
    expect(call('workflow.transition', { competitionId: 'parade', action: 'open' }, superTok).code).toBe('CRITERIA_NOT_CONFIRMED');
    const cr = ok(call('staff.snapshot', {}, superTok)).criteria.find((c: any) => c.competitionId === 'parade');
    ok(call('criteria.update', { competitionId: 'parade', items: cr.items.map((i: any) => ({ ...i, max: 8 })) }, superTok));
    expect(call('criteria.confirm', { competitionId: 'parade' }, superTok).error).toContain('ต้องเท่ากับ 50');
    ok(call('criteria.update', { competitionId: 'parade', items: cr.items.map((i: any) => ({ ...i, max: 10 })) }, superTok));
    expect(call('criteria.confirm', { competitionId: 'parade' }, superTok).error).toContain('วิธีรวมคะแนน');
    ok(call('criteria.update', { competitionId: 'parade', aggregation: 'average' }, superTok));
    ok(call('criteria.confirm', { competitionId: 'parade' }, superTok));
    ok(call('workflow.transition', { competitionId: 'parade', action: 'open' }, superTok));
  });

  it('กรรมการหลายคนกรอกพร้อมกันคนละใบ ตรวจค่าเกิน และรวมคะแนนแบบเฉลี่ย', () => {
    const cr = ok(call('staff.snapshot', {}, superTok)).criteria.find((c: any) => c.competitionId === 'parade');
    ok(call('criteria.update', { competitionId: 'parade', items: cr.items.map((i: any) => ({ ...i, max: 10 })), aggregation: 'average' }, superTok));
    ok(call('criteria.confirm', { competitionId: 'parade' }, superTok));
    ok(call('workflow.transition', { competitionId: 'parade', action: 'open' }, superTok));

    expect(call('sheets.save', { competitionId: 'parade', baseVersion: 0, entries: { m1: { c1: 11 } } }, j1.token).error).toContain('เกินคะแนนเต็ม');
    expect(call('sheets.save', { competitionId: 'parade', baseVersion: 0, entries: { m1: { c1: -2 } } }, j1.token).error).toContain('ติดลบ');
    expect(call('sheets.save', { competitionId: 'parade', baseVersion: 0, entries: {} }, rv.token).code).toBe('FORBIDDEN');

    const e1 = Object.fromEntries(allV.map((v, i) => [v, full(10 - i * 0.5)]));
    const e2 = Object.fromEntries(allV.map((v, i) => [v, full(9 - i * 0.5)]));
    ok(call('sheets.save', { competitionId: 'parade', baseVersion: 0, entries: e1 }, j1.token));
    // กรรมการคนที่ 2 ยังไม่ครบ → ส่งไม่ได้
    ok(call('sheets.save', { competitionId: 'parade', baseVersion: 0, entries: { m1: full(9) } }, j2.token));
    ok(call('scores.save', { competitionId: 'parade', baseVersion: 0, data: { placements: { 1: 'm1', 2: 'm2', 3: 'm5' } } }, head.token));
    expect(call('workflow.transition', { competitionId: 'parade', action: 'submit' }, head.token).error).toContain('กรรมการกรอกคะแนนไม่ครบ');
    ok(call('sheets.save', { competitionId: 'parade', baseVersion: 1, entries: e2 }, j2.token));
    // ใบของกรรมการเห็นเฉพาะของตัวเอง
    expect(ok(call('staff.snapshot', {}, j1.token)).sheets.map((s: any) => s.judgeId)).toEqual([j1.id]);
    expect(ok(call('staff.snapshot', {}, head.token)).sheets).toHaveLength(2);

    ok(call('workflow.transition', { competitionId: 'parade', action: 'submit' }, head.token));
    ok(call('workflow.transition', { competitionId: 'parade', action: 'approve' }, rv.token));
    const res = ok(call('staff.snapshot', {}, superTok)).results.find((r: any) => r.competitionId === 'parade');
    expect(res.ranking[0]).toMatchObject({ villageId: 'm1', total: 47.5, judges: 2 });
    expect(res.countsForCup).toBe(false);
    expect(ok(call('staff.snapshot', {}, superTok)).cupInternal.countedResults).toBe(0);
  });

  it('คะแนนเท่ากันในตำแหน่งรางวัลต้องระบุเหตุผล และอันดับต้องสอดคล้องกับคะแนน', () => {
    ok(call('competitions.update', { id: 'parade', baseVersion: 1, patch: { judgeMode: 'single' } }, superTok));
    const cr = ok(call('staff.snapshot', {}, superTok)).criteria.find((c: any) => c.competitionId === 'parade');
    ok(call('criteria.update', { competitionId: 'parade', items: cr.items.map((i: any) => ({ ...i, max: 10 })) }, superTok));
    ok(call('criteria.confirm', { competitionId: 'parade' }, superTok));
    ok(call('workflow.transition', { competitionId: 'parade', action: 'open' }, superTok));
    const entries = Object.fromEntries(allV.map((v, i) => [v, full(i < 2 ? 9 : 5)])); // m1 = m2 = 45
    ok(call('scores.save', { competitionId: 'parade', baseVersion: 0, data: { placements: { 1: 'm1', 2: 'm5', 3: 'm2' }, entries } }, head.token));
    expect(call('workflow.transition', { competitionId: 'parade', action: 'submit' }, head.token).code).toBe('INVALID');
    ok(call('scores.save', { competitionId: 'parade', baseVersion: 1, data: { placements: { 1: 'm1', 2: 'm2', 3: 'm5' }, entries } }, head.token));
    expect(call('workflow.transition', { competitionId: 'parade', action: 'submit' }, head.token).error).toContain('ระบุเหตุผล');
    ok(call('scores.save', { competitionId: 'parade', baseVersion: 2, data: { placements: { 1: 'm1', 2: 'm2', 3: 'm5' }, entries, tieNote: 'คณะกรรมการลงมติ' } }, head.token));
    // m5..m13 เท่ากันที่อันดับ 3 → ยังเป็นการเสมอในตำแหน่งรางวัล ต้องมี tieNote (มีแล้ว)
    ok(call('workflow.transition', { competitionId: 'parade', action: 'submit' }, head.token));
  });

  it('เปลี่ยนเงื่อนไขถ้วยรวมได้เฉพาะ Super Admin พร้อมเหตุผล', () => {
    const admin = makeUser('adm', 'admin');
    expect(call('competitions.update', { id: 'parade', baseVersion: 1, patch: { countsForCup: true } }, admin.token).code).toBe('FORBIDDEN');
    expect(call('competitions.update', { id: 'parade', baseVersion: 1, patch: { countsForCup: true } }, superTok).error).toContain('เหตุผล');
  });
});

describe('ฟุตบอล: บันทึกผลรายนัด', () => {
  it('บันทึกผล ตรวจค่าไม่ถูกต้อง และรอบน็อคเอาท์ที่เสมอต้องมีจุดโทษ', () => {
    const sk = makeUser('fb1', 'scorekeeper');
    ok(call('assignments.set', { competitionId: 'football7', scorerId: sk.id }, superTok));
    ok(call('workflow.transition', { competitionId: 'football7', action: 'open' }, superTok));
    expect(call('matches.save', { competitionId: 'football7', matchId: 'football7-1', baseVersion: 1, patch: { homeScore: -1 } }, sk.token).code).toBe('INVALID');
    ok(call('matches.save', { competitionId: 'football7', matchId: 'football7-1', baseVersion: 1, patch: { homeScore: 2, awayScore: 1, status: 'played' } }, sk.token));
    expect(call('matches.save', { competitionId: 'football7', matchId: 'football7-1', baseVersion: 1, patch: { homeScore: 3 } }, sk.token).code).toBe('CONFLICT');
    expect(call('matches.save', { competitionId: 'football7', matchId: 'football7-20', baseVersion: 1, patch: { homeId: 'm5' } }, sk.token).code).toBe('INVALID'); // บ้านเกาะไม่ได้ส่งฟุตบอล
    ok(call('matches.save', { competitionId: 'football7', matchId: 'football7-20', baseVersion: 1, patch: { homeId: 'm1', awayId: 'm2' } }, sk.token));
    expect(call('matches.save', { competitionId: 'football7', matchId: 'football7-20', baseVersion: 2, patch: { homeScore: 1, awayScore: 1, status: 'played' } }, sk.token).error).toContain('จุดโทษ');
    ok(call('matches.save', { competitionId: 'football7', matchId: 'football7-20', baseVersion: 2, patch: { homeScore: 1, awayScore: 1, homePens: 4, awayPens: 3, status: 'played' } }, sk.token));
    // ผลรายนัดไม่เผยแพร่จนกว่าผู้ดูแลเปิด
    expect(ok(call('public.snapshot')).matches).toHaveLength(0);
    const c = comp('football7');
    ok(call('competitions.update', { id: 'football7', baseVersion: c.version, patch: { matchesPublic: true } }, superTok));
    expect(ok(call('public.snapshot')).matches.length).toBe(20);
  });
});
