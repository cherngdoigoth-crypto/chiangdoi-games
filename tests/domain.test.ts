import { describe, expect, it } from 'vitest';
import {
  aggregatePanel, checkTransition, computeCup, contestRanking, cupPointsFor, entryTotal, knockoutPlacements, leagueTable,
  placementsConsistent, rankTotals, seedCompetitions, seedCriteria, seedMatches, suggestedPlacements, tiesWithinPlaces,
  validateCriteriaConfig, validateEntry, validatePlacements, VILLAGES,
  type CriterionItem, type Match, type ResultRecord,
} from '@domain';

const items: CriterionItem[] = [
  { key: 'c1', label: 'ก', max: 10 }, { key: 'c2', label: 'ข', max: 10 }, { key: 'c3', label: 'ค', max: 10 },
  { key: 'c4', label: 'ง', max: 10 }, { key: 'c5', label: 'จ', max: 10 },
];
const comps = seedCompetitions();
const ids = VILLAGES.map((v) => v.id);
const result = (competitionId: string, p: Record<string, string>): ResultRecord => ({
  competitionId, placements: p, ranking: null, cupPoints: cupPointsFor(p), countsForCup: comps.find((c) => c.id === competitionId)!.countsForCup,
  note: '', tieNote: '', approvedBy: 'u', approvedAt: '', publishedAt: '',
});

describe('ข้อมูลตั้งต้นตรงตามสูจิบัตร', () => {
  it('มี 10 หมู่บ้าน และ 13 รายการที่นับถ้วยรวม', () => {
    expect(VILLAGES).toHaveLength(10);
    expect(comps.filter((c) => c.countsForCup).map((c) => c.id).sort()).toEqual(
      ['ball_f', 'ball_m', 'boat_f', 'boat_m', 'giant_f', 'giant_m', 'hoop_f', 'hoop_m', 'kick_f', 'kick_m', 'penalty', 'wheel_f', 'wheel_m'].sort());
  });
  it('ฟุตบอลและเปตองไม่นับถ้วยรวม ฟุตบอลไม่มีบ้านเกาะ', () => {
    expect(comps.find((c) => c.id === 'football7')!.countsForCup).toBe(false);
    expect(comps.find((c) => c.id === 'petanque')!.countsForCup).toBe(false);
    expect(comps.find((c) => c.id === 'football7')!.eligibleVillageIds).not.toContain('m5');
  });
  it('การประกวดไม่นับถ้วยรวม และเกณฑ์ยังไม่กำหนดคะแนนเต็มรายข้อ', () => {
    comps.filter((c) => c.category === 'contest').forEach((c) => expect(c.countsForCup).toBe(false));
    seedCriteria().forEach((c) => { expect(c.items).toHaveLength(5); expect(c.confirmed).toBe(false); c.items.forEach((i) => expect(i.max).toBeNull()); });
  });
  it('ตารางนัด: ฟุตบอล 20 นัด เปตอง 24 นัด ยิงลูกโทษรอบแรก 5 คู่', () => {
    const ms = seedMatches();
    expect(ms.filter((m) => m.competitionId === 'football7')).toHaveLength(20);
    expect(ms.filter((m) => m.competitionId === 'petanque')).toHaveLength(24);
    expect(ms.filter((m) => m.competitionId === 'penalty')).toHaveLength(5);
  });
});

describe('การคำนวณคะแนนรายเกณฑ์', () => {
  it('ตรวจการตั้งค่าเกณฑ์: ต้องกำหนดคะแนนเต็มครบและรวม 50', () => {
    expect(validateCriteriaConfig(items, 50)).toEqual([]);
    expect(validateCriteriaConfig(items.map((i, k) => (k === 0 ? { ...i, max: null } : i)), 50)[0].message).toContain('ยังไม่ได้กำหนดคะแนนเต็ม');
    expect(validateCriteriaConfig(items.map((i) => ({ ...i, max: 8 })), 50)[0].message).toContain('ต้องเท่ากับ 50');
  });
  it('ห้ามติดลบ ห้ามเกินคะแนนเต็ม และตรวจความครบ', () => {
    expect(validateEntry(items, { c1: -1 }, false)[0].message).toContain('ติดลบ');
    expect(validateEntry(items, { c1: 11 }, false)[0].message).toContain('เกินคะแนนเต็ม');
    expect(validateEntry(items, { c1: 5 }, true)).toHaveLength(4);
    expect(validateEntry(items, { c1: 5, c2: 5, c3: 5, c4: 5, c5: 5 }, true)).toEqual([]);
  });
  it('รวมคะแนนพร้อมทศนิยม', () => {
    expect(entryTotal(items, { c1: 9.5, c2: 8, c3: 7.25, c4: 10, c5: 6 })).toEqual({ total: 40.75, complete: true });
    expect(entryTotal(items, { c1: 9 }).complete).toBe(false);
  });
  it('คณะกรรมการ: เฉลี่ยหรือรวม เฉพาะใบที่กรอกครบ', () => {
    const full = (n: number) => ({ c1: n, c2: n, c3: n, c4: n, c5: n });
    const sheets = [{ m1: full(8) }, { m1: full(10) }, { m1: { c1: 1 } }];
    expect(aggregatePanel(items, sheets, ['m1'], 'average').m1).toEqual({ total: 45, judges: 2 });
    expect(aggregatePanel(items, sheets, ['m1'], 'sum').m1).toEqual({ total: 90, judges: 2 });
  });
});

describe('การจัดอันดับและคะแนนเสมอ', () => {
  it('คะแนนเท่ากันได้อันดับร่วม และระบบไม่ตัดสินเสมอเอง', () => {
    const r = rankTotals({ m1: 40, m2: 45, m5: 40, m6: 30 });
    expect(r.map((x) => [x.villageId, x.rank])).toEqual([['m2', 1], ['m1', 2], ['m5', 2], ['m6', 4]]);
    expect(tiesWithinPlaces(r, 3)).toEqual([['m1', 'm5']]);
    expect(suggestedPlacements(r, 3)).toEqual({ 1: 'm2', 2: null, 3: null });
  });
  it('อันดับต้องสอดคล้องกับคะแนน', () => {
    const r = rankTotals({ m1: 40, m2: 45, m5: 30 });
    expect(placementsConsistent({ 1: 'm2', 2: 'm1', 3: 'm5' }, r)).toEqual([]);
    expect(placementsConsistent({ 1: 'm1', 2: 'm2', 3: 'm5' }, r)).not.toEqual([]);
    expect(placementsConsistent({ 1: 'm2', 2: 'm5' }, r)).not.toEqual([]);
  });
  it('ตรวจอันดับซ้ำ ไม่มีสิทธิ์ และไม่ครบ', () => {
    expect(validatePlacements({ 1: 'm1', 2: 'm1' }, 3, ids, false)[0].message).toContain('ซ้ำ');
    expect(validatePlacements({ 1: 'm5' }, 3, ['m1', 'm2'], false)[0].message).toContain('ไม่มีสิทธิ์');
    expect(validatePlacements({ 1: 'm1' }, 3, ids, true)).toHaveLength(2);
  });
  it('รายการประกวดแบบผู้บันทึกคนเดียว', () => {
    const full = (n: number) => ({ c1: n, c2: n, c3: n, c4: n, c5: n });
    const r = contestRanking(items, ['m1', 'm2'], 'single', { m1: full(7), m2: full(9) }, [], null);
    expect(r[0]).toMatchObject({ villageId: 'm2', total: 45, rank: 1 });
  });
});

describe('ถ้วยคะแนนรวม', () => {
  const tie = { tieRule: 'unconfirmed' as const, tieManualOrder: [] };
  it('ชนะเลิศ 3 ที่ 2 ได้ 2 ที่ 3 ได้ 1 พร้อมรายละเอียดรายการ', () => {
    const cup = computeCup([result('kick_m', { 1: 'm1', 2: 'm2', 3: 'm5' }), result('penalty', { 1: 'm1', 2: 'm5', 3: 'm6' })], ids, comps, tie);
    const m1 = cup.rows.find((r) => r.villageId === 'm1')!;
    expect(m1).toMatchObject({ points: 6, golds: 2, rank: 1 });
    expect(m1.breakdown.map((b) => b.competitionId)).toEqual(['kick_m', 'penalty']);
    expect(cup.rows.find((r) => r.villageId === 'm5')!.points).toBe(3);
    expect(cup.countedResults).toBe(2);
    expect(cup.totalCupEvents).toBe(13);
  });
  it('ไม่นับฟุตบอล เปตอง และการประกวด', () => {
    const cup = computeCup([result('football7', { 1: 'm1', 2: 'm2', 3: 'm6' }), result('petanque', { 1: 'm1' }), result('parade', { 1: 'm1' })], ids, comps, tie);
    expect(cup.rows.every((r) => r.points === 0)).toBe(true);
    expect(cup.countedResults).toBe(0);
  });
  it('คะแนนเสมอ: ยังไม่ยืนยันกติกา → อันดับร่วมพร้อมเตือน', () => {
    const cup = computeCup([result('kick_m', { 1: 'm1', 2: 'm2' }), result('kick_f', { 1: 'm2', 2: 'm1' })], ids, comps, tie);
    expect(cup.rows[0].rank).toBe(1); expect(cup.rows[1].rank).toBe(1);
    expect(cup.tieUnresolved).toBe(true);
  });
  it('คะแนนเสมอ: นับจำนวนอันดับ (เมื่อผู้ดูแลยืนยัน)', () => {
    const res = [result('kick_m', { 1: 'm1', 3: 'm2' }), result('kick_f', { 2: 'm2', 3: 'm1' }), result('ball_m', { 2: 'm2' })];
    // m1 = 3+1 = 4 (ทอง 1) , m2 = 1+2+2 = 5 → ไม่เสมอ; เพิ่มให้เสมอ
    res.push(result('ball_f', { 3: 'm1' }));
    const cup = computeCup(res, ids, comps, { tieRule: 'countback', tieManualOrder: [] });
    expect(cup.rows[0].villageId).toBe('m1'); // 5 คะแนน ทอง 1
    expect(cup.rows[1].villageId).toBe('m2'); // 5 คะแนน ทอง 0
    expect(cup.rows[1].rank).toBe(2);
    expect(cup.tieUnresolved).toBe(false);
  });
  it('คะแนนเสมอ: ผู้ดูแลกำหนดลำดับเอง', () => {
    const res = [result('kick_m', { 1: 'm1' }), result('kick_f', { 1: 'm2' })];
    const cup = computeCup(res, ids, comps, { tieRule: 'manual', tieManualOrder: ['m2', 'm1'] });
    expect(cup.rows.slice(0, 2).map((r) => [r.villageId, r.rank])).toEqual([['m2', 1], ['m1', 2]]);
  });
  it('แก้ไขผลแล้วคำนวณใหม่ได้ถูกต้อง', () => {
    const before = computeCup([result('kick_m', { 1: 'm1', 2: 'm2', 3: 'm5' })], ids, comps, tie);
    const after = computeCup([result('kick_m', { 1: 'm2', 2: 'm1', 3: 'm5' })], ids, comps, tie);
    expect(before.rows[0].villageId).toBe('m1');
    expect(after.rows[0].villageId).toBe('m2');
    expect(after.rows.find((r) => r.villageId === 'm1')!.points).toBe(2);
  });
});

describe('ตารางแบ่งกลุ่มและน็อคเอาท์', () => {
  const mk = (h: string, a: string, hs: number, as: number, extra: Partial<Match> = {}): Match => ({
    id: h + a, competitionId: 'football7', no: 1, round: 'group', group: 'A', schedule: '', field: '', homeId: h, awayId: a, homeLabel: '', awayLabel: '',
    homeScore: hs, awayScore: as, homePens: null, awayPens: null, status: 'played', version: 1, updatedBy: null, updatedAt: null, ...extra,
  });
  it('ชนะ 3 เสมอ 1 และคะแนนเท่ากันต้องจับฉลาก (ไม่ใช้ประตูได้เสีย)', () => {
    const t = leagueTable([mk('m1', 'm2', 5, 0), mk('m2', 'm6', 1, 0), mk('m6', 'm1', 1, 0)], ['m1', 'm2', 'm6'], { win: 3, draw: 1, loss: 0 });
    expect(t.every((r) => r.points === 3 && r.rank === 1 && r.tied)).toBe(true);
    const drawn = leagueTable([mk('m1', 'm2', 5, 0), mk('m2', 'm6', 1, 0), mk('m6', 'm1', 1, 0)], ['m1', 'm2', 'm6'], { win: 3, draw: 1, loss: 0 }, ['m6', 'm1', 'm2']);
    expect(drawn.map((r) => [r.villageId, r.rank])).toEqual([['m6', 1], ['m1', 2], ['m2', 3]]);
  });
  it('อันดับจากนัดชิง รวมยิงจุดโทษ', () => {
    const p = knockoutPlacements([
      mk('m1', 'm2', 1, 1, { round: 'final', homePens: 4, awayPens: 5 }),
      mk('m6', 'm7', 2, 0, { round: 'third' }),
    ], 4);
    expect(p).toEqual({ 1: 'm2', 2: 'm1', 3: 'm6', 4: 'm7' });
  });
});

describe('สถานะรายการ (workflow)', () => {
  it('ผู้บันทึกที่ได้รับมอบหมายส่งผลได้ คนอื่นไม่ได้', () => {
    expect(checkTransition('submit', { status: 'open', role: 'scorekeeper', isAssignedScorer: true }).ok).toBe(true);
    expect(checkTransition('submit', { status: 'open', role: 'scorekeeper', isAssignedScorer: false }).ok).toBe(false);
  });
  it('ส่งกลับ/ยกเลิกประกาศต้องมีเหตุผล', () => {
    expect(checkTransition('return', { status: 'submitted', role: 'reviewer', isAssignedScorer: false }).error).toContain('เหตุผล');
    expect(checkTransition('unpublish', { status: 'published', role: 'admin', isAssignedScorer: false, reason: 'ผิด' }).to).toBe('approved');
  });
  it('ผู้ส่งผลอนุมัติผลของตัวเองไม่ได้ และผู้ตรวจสอบประกาศผลไม่ได้', () => {
    expect(checkTransition('approve', { status: 'submitted', role: 'admin', isAssignedScorer: true, isSubmitter: true }).ok).toBe(false);
    expect(checkTransition('publish', { status: 'approved', role: 'reviewer', isAssignedScorer: false }).ok).toBe(false);
  });
  it('ส่งผลไม่ได้ถ้ายังไม่ได้เปิดรับคะแนน ปลดล็อกได้เฉพาะ Super Admin', () => {
    expect(checkTransition('submit', { status: 'draft', role: 'admin', isAssignedScorer: true }).ok).toBe(false);
    expect(checkTransition('unlock', { status: 'locked', role: 'admin', isAssignedScorer: false, reason: 'x' }).ok).toBe(false);
    expect(checkTransition('unlock', { status: 'locked', role: 'superadmin', isAssignedScorer: false, reason: 'x' }).ok).toBe(true);
  });
});
