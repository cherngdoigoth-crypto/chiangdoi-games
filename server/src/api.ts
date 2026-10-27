// Apps Script API — ตรรกะทั้งหมดอยู่ที่นี่และไม่ผูกกับ Google Sheets โดยตรง (ผ่าน Store) จึงทดสอบใน Node ได้
import * as D from '../../shared/domain';
import type {
  Assignment, AuditEntry, Competition, CriteriaConfig, CriteriaEntries, JudgeSheet, Match, PublicUser, ResultRecord, Role,
  ScoreData, ScoreRecord, Settings, Village, WorkflowAction,
} from '../../shared/domain';
import { findRow, type Crypto, type Store } from './store';
import type { Row } from './schema';

export class ApiError extends Error {
  constructor(public code: string, message: string, public extra?: unknown) { super(message); }
}
export interface Ctx { store: Store; crypto: Crypto; }
export interface ApiRequest { action: string; token?: string | null; payload?: any; }
export interface ApiResponse { ok: boolean; data?: unknown; error?: string; code?: string; extra?: unknown; }

const SESSION_HOURS = 12;
const HASH_ROUNDS = 1000;
const MAX_FAILED = 5;
const LOCK_MINUTES = 10;

interface UserRow extends PublicUser { passwordHash: string; salt: string; failedLogins: number; lockedUntil: string | null; createdAt: string; }

/* ===================== entry ===================== */

export function handle(req: ApiRequest, ctx: Ctx): ApiResponse {
  try {
    return { ok: true, data: route(req, ctx) };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message, code: e.code, extra: e.extra };
    return { ok: false, error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่', code: 'INTERNAL', extra: String((e as Error)?.message ?? e) };
  }
}

function route(req: ApiRequest, ctx: Ctx): unknown {
  const p = req.payload ?? {};
  switch (req.action) {
    case 'ping': return { rev: ctx.store.getRev(), serverTime: iso(ctx) };
    case 'public.snapshot': return publicSnapshot(ctx, p.since);
    case 'auth.login': return login(ctx, String(p.username ?? ''), String(p.password ?? ''));
    case 'auth.logout': return logout(ctx, req.token);
    case 'auth.me': return { user: toPublic(requireUser(ctx, req.token, true)) };
    case 'auth.changePassword': return changePassword(ctx, req.token, String(p.oldPassword ?? ''), String(p.newPassword ?? ''));
  }
  const user = requireUser(ctx, req.token);
  if (user.mustChangePassword) throw new ApiError('MUST_CHANGE_PASSWORD', 'กรุณาเปลี่ยนรหัสผ่านก่อนใช้งาน');
  switch (req.action) {
    case 'staff.snapshot': return staffSnapshot(ctx, user, p.since);
    case 'audit.list': return auditList(ctx, user, p.competitionId ?? null, Number(p.limit ?? 1000));
    case 'scores.save': return saveScores(ctx, user, p);
    case 'sheets.save': return saveSheet(ctx, user, p);
    case 'matches.save': return saveMatch(ctx, user, p);
    case 'matches.create': return createMatch(ctx, user, p);
    case 'matches.delete': return deleteMatch(ctx, user, p);
    case 'competitions.create': return createCompetition(ctx, user, p);
    case 'competitions.update': return updateCompetition(ctx, user, p);
    case 'criteria.update': return updateCriteria(ctx, user, p);
    case 'criteria.confirm': return confirmCriteria(ctx, user, p);
    case 'assignments.set': return setAssignment(ctx, user, p);
    case 'workflow.transition': return transition(ctx, user, p.competitionId, p.action, p.reason);
    case 'settings.update': return updateSettings(ctx, user, p);
    case 'users.create': return createUser(ctx, user, p);
    case 'users.update': return updateUser(ctx, user, p);
    case 'users.resetPassword': return resetPassword(ctx, user, p);
  }
  throw new ApiError('BAD_ACTION', 'ไม่รู้จักคำสั่งนี้');
}

/* ===================== helpers ===================== */

const iso = (ctx: Ctx) => ctx.crypto.now().toISOString();
const str = (v: unknown, max = 500) => String(v ?? '').trim().slice(0, max);

function mutate<T>(ctx: Ctx, fn: () => T, bump = true): T {
  return ctx.store.withLock(() => { const r = fn(); if (bump) ctx.store.bumpRev(); return r; });
}

function audit(ctx: Ctx, user: { id: string; displayName: string } | null, action: string, competitionId: string | null, detail: unknown) {
  ctx.store.append('AuditLog', {
    id: ctx.crypto.randomToken().slice(0, 16), at: iso(ctx), userId: user?.id ?? null, userName: user?.displayName ?? 'ระบบ',
    action, competitionId, detail: JSON.stringify(detail ?? {}).slice(0, 45000),
  });
}

const villages = (ctx: Ctx) => (ctx.store.all('Villages') as unknown as Village[]).sort((a, b) => a.no - b.no);
const competitions = (ctx: Ctx) => (ctx.store.all('Competitions') as unknown as Competition[]).sort((a, b) => a.order - b.order);
function getComp(ctx: Ctx, id: unknown): Competition {
  const c = findRow(ctx.store, 'Competitions', { id: String(id ?? '') }) as unknown as Competition | null;
  if (!c) throw new ApiError('NOT_FOUND', 'ไม่พบรายการแข่งขัน');
  return c;
}
const getCriteria = (ctx: Ctx, id: string) => findRow(ctx.store, 'Criteria', { competitionId: id }) as unknown as CriteriaConfig | null;
function getAssignment(ctx: Ctx, id: string): Assignment {
  const a = findRow(ctx.store, 'Assignments', { competitionId: id }) as unknown as Assignment | null;
  return a ? { competitionId: id, scorerId: a.scorerId || null, judgeIds: a.judgeIds ?? [] } : { competitionId: id, scorerId: null, judgeIds: [] };
}
function getScore(ctx: Ctx, id: string): ScoreRecord {
  const s = findRow(ctx.store, 'Scores', { competitionId: id }) as unknown as ScoreRecord | null;
  return s ?? { competitionId: id, data: { placements: {} }, version: 0, updatedBy: null, updatedAt: null, submittedBy: null, submittedAt: null, reviewNote: null };
}
const sheetsOf = (ctx: Ctx, id: string) => (ctx.store.all('JudgeSheets') as unknown as JudgeSheet[]).filter((s) => s.competitionId === id);
const matchesOf = (ctx: Ctx, id: string) => (ctx.store.all('Matches') as unknown as Match[]).filter((m) => m.competitionId === id).sort((a, b) => a.no - b.no);
const results = (ctx: Ctx) => ctx.store.all('Results') as unknown as ResultRecord[];

export function getSettings(ctx: Ctx): Settings {
  const s: Settings = { ...D.DEFAULT_SETTINGS };
  for (const r of ctx.store.all('Settings')) (s as unknown as Row)[String(r.key)] = r.value;
  return s;
}

function toPublic(u: UserRow): PublicUser {
  return { id: u.id, username: u.username, displayName: u.displayName, role: u.role, active: !!u.active, mustChangePassword: !!u.mustChangePassword };
}
const allUsers = (ctx: Ctx) => ctx.store.all('Users') as unknown as UserRow[];

function requireAdmin(u: PublicUser) { if (!D.isAdmin(u.role)) throw new ApiError('FORBIDDEN', 'เฉพาะผู้ดูแลระบบ'); }

function checkVersion(current: number, base: unknown, extra?: unknown) {
  if (Number(base) !== current) throw new ApiError('CONFLICT', 'ข้อมูลถูกแก้ไขจากอุปกรณ์อื่นแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนบันทึก', extra);
}

/* ===================== auth ===================== */

export function hashPassword(crypto: Crypto, salt: string, password: string): string {
  let h = `${salt}:${password}`;
  for (let i = 0; i < HASH_ROUNDS; i++) h = crypto.sha256Hex(salt + h);
  return h;
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function validatePassword(pw: string) {
  if (pw.length < 8) throw new ApiError('WEAK_PASSWORD', 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร');
  if (!/[0-9]/.test(pw) || !/[^0-9]/.test(pw)) throw new ApiError('WEAK_PASSWORD', 'รหัสผ่านต้องมีทั้งตัวเลขและตัวอักษร');
}

function login(ctx: Ctx, username: string, password: string) {
  return mutate(ctx, () => {
    const uname = username.trim().toLowerCase();
    const u = allUsers(ctx).find((x) => x.username.toLowerCase() === uname);
    const fail = () => new ApiError('BAD_LOGIN', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    if (!u || !u.active) throw fail();
    if (u.lockedUntil && new Date(u.lockedUntil) > ctx.crypto.now()) throw new ApiError('LOCKED', 'บัญชีถูกล็อกชั่วคราวเพราะใส่รหัสผิดหลายครั้ง ลองใหม่ภายหลัง');
    if (!safeEqual(hashPassword(ctx.crypto, u.salt, password), u.passwordHash)) {
      const failed = (u.failedLogins || 0) + 1;
      ctx.store.upsert('Users', { ...u, failedLogins: failed, lockedUntil: failed >= MAX_FAILED ? new Date(ctx.crypto.now().getTime() + LOCK_MINUTES * 60000).toISOString() : u.lockedUntil });
      if (failed >= MAX_FAILED) audit(ctx, null, 'auth.locked', null, { username: u.username });
      throw fail();
    }
    ctx.store.upsert('Users', { ...u, failedLogins: 0, lockedUntil: null });
    const now = ctx.crypto.now();
    // ล้าง session ที่หมดอายุ
    for (const s of ctx.store.all('Sessions')) if (new Date(String(s.expiresAt)) < now) ctx.store.remove('Sessions', s);
    const token = ctx.crypto.randomToken();
    ctx.store.upsert('Sessions', { tokenHash: ctx.crypto.sha256Hex(token), userId: u.id, expiresAt: new Date(now.getTime() + SESSION_HOURS * 3600000).toISOString(), createdAt: now.toISOString() });
    audit(ctx, u, 'auth.login', null, {});
    return { token, user: toPublic(u) };
  }, false);
}

function sessionUser(ctx: Ctx, token: string | null | undefined): UserRow | null {
  if (!token) return null;
  const s = findRow(ctx.store, 'Sessions', { tokenHash: ctx.crypto.sha256Hex(token) });
  if (!s || new Date(String(s.expiresAt)) < ctx.crypto.now()) return null;
  const u = findRow(ctx.store, 'Users', { id: s.userId }) as unknown as UserRow | null;
  return u && u.active ? u : null;
}
/** ตรวจ session — บัญชีที่ต้องเปลี่ยนรหัสผ่านจะถูกกันที่ route() ยกเว้นคำสั่ง auth.* */
function requireUser(ctx: Ctx, token: string | null | undefined, _allowMustChange = false): UserRow {
  const u = sessionUser(ctx, token);
  if (!u) throw new ApiError('UNAUTHENTICATED', 'กรุณาเข้าสู่ระบบใหม่');
  return u;
}
function logout(ctx: Ctx, token: string | null | undefined) {
  if (!token) return {};
  return mutate(ctx, () => { ctx.store.remove('Sessions', { tokenHash: ctx.crypto.sha256Hex(token) }); return {}; }, false);
}
function changePassword(ctx: Ctx, token: string | null | undefined, oldPw: string, newPw: string) {
  const u = requireUser(ctx, token, true);
  validatePassword(newPw);
  return mutate(ctx, () => {
    if (!safeEqual(hashPassword(ctx.crypto, u.salt, oldPw), u.passwordHash)) throw new ApiError('BAD_LOGIN', 'รหัสผ่านเดิมไม่ถูกต้อง');
    const salt = ctx.crypto.randomToken().slice(0, 24);
    const updated = { ...u, salt, passwordHash: hashPassword(ctx.crypto, salt, newPw), mustChangePassword: false };
    ctx.store.upsert('Users', updated);
    audit(ctx, u, 'auth.changePassword', null, {});
    return { user: toPublic(updated) };
  }, false);
}

/* ===================== snapshots ===================== */

function publishedResults(ctx: Ctx, comps: Competition[]) {
  const pub = new Set(comps.filter((c) => c.status === 'published' || c.status === 'locked').map((c) => c.id));
  return results(ctx).filter((r) => pub.has(r.competitionId) && r.publishedAt);
}

/** ข้อมูลสาธารณะ — ส่งเฉพาะสิ่งที่เผยแพร่แล้วเท่านั้น (คะแนนที่ยังไม่ประกาศจะไม่ออกจากเซิร์ฟเวอร์) */
export function publicSnapshot(ctx: Ctx, since?: number) {
  const rev = ctx.store.getRev();
  if (since !== undefined && since !== null && Number(since) === rev) return { rev, unchanged: true };
  const s = getSettings(ctx);
  const comps = competitions(ctx);
  const vs = villages(ctx);
  const pubResults = publishedResults(ctx, comps);
  const pubMatchComps = new Set(comps.filter((c) => c.matchesPublic).map((c) => c.id));
  const cup = s.cupVisible ? D.computeCup(pubResults, vs.map((v) => v.id), comps, s) : null;
  return {
    rev, serverTime: iso(ctx),
    settings: { cupVisible: s.cupVisible, tieRule: s.tieRule, tieRuleConfirmed: s.tieRuleConfirmed, eventName: s.eventName },
    villages: vs,
    competitions: comps.map((c) => ({ ...c, version: undefined })),
    criteria: (ctx.store.all('Criteria') as unknown as CriteriaConfig[]).filter((c) => pubResults.some((r) => r.competitionId === c.competitionId)),
    results: pubResults,
    matches: (ctx.store.all('Matches') as unknown as Match[]).filter((m) => pubMatchComps.has(m.competitionId)),
    cup,
  };
}

function staffSnapshot(ctx: Ctx, user: UserRow, since?: number) {
  const rev = ctx.store.getRev();
  if (since !== undefined && since !== null && Number(since) === rev) return { rev, unchanged: true };
  const s = getSettings(ctx);
  const comps = competitions(ctx);
  const vs = villages(ctx);
  const assignments = comps.map((c) => getAssignment(ctx, c.id));
  const admin = D.canReview(user.role);
  const scorerOf = new Set(assignments.filter((a) => a.scorerId === user.id).map((a) => a.competitionId));
  const scores = (ctx.store.all('Scores') as unknown as ScoreRecord[]).filter((x) => admin || scorerOf.has(x.competitionId));
  const sheets = (ctx.store.all('JudgeSheets') as unknown as JudgeSheet[]).filter((x) => admin || scorerOf.has(x.competitionId) || x.judgeId === user.id);
  const res = results(ctx);
  const approvedIds = new Set(comps.filter((c) => ['approved', 'published', 'locked'].includes(c.status)).map((c) => c.id));
  const users = allUsers(ctx);
  return {
    rev, serverTime: iso(ctx),
    me: toPublic(user),
    settings: s,
    villages: vs,
    competitions: comps,
    criteria: ctx.store.all('Criteria'),
    assignments,
    matches: ctx.store.all('Matches'),
    scores, sheets,
    results: res.filter((r) => approvedIds.has(r.competitionId)),
    cupInternal: D.computeCup(res.filter((r) => approvedIds.has(r.competitionId)), vs.map((v) => v.id), comps, s),
    cupPublic: D.computeCup(publishedResults(ctx, comps), vs.map((v) => v.id), comps, s),
    users: D.isAdmin(user.role) ? users.map(toPublic) : users.map((u) => ({ id: u.id, displayName: u.displayName, role: u.role, active: u.active })),
    audit: admin ? auditList(ctx, user, null, 300) : [],
  };
}

function auditList(ctx: Ctx, user: PublicUser, competitionId: string | null, limit: number): AuditEntry[] {
  if (!D.canReview(user.role)) throw new ApiError('FORBIDDEN', 'ไม่มีสิทธิ์ดูประวัติ');
  const rows = (ctx.store.all('AuditLog') as unknown as AuditEntry[]).filter((r) => !competitionId || r.competitionId === competitionId);
  return rows.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, Math.max(1, Math.min(limit, 5000)));
}

/* ===================== scores ===================== */

function sanitizePlacements(p: unknown, places: number): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  const src = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
  for (let i = 1; i <= places; i++) { const v = src[String(i)]; out[String(i)] = typeof v === 'string' && v ? v : null; }
  return out;
}
function sanitizeEntries(e: unknown, keys: string[], villageIds: string[]): CriteriaEntries {
  const out: CriteriaEntries = {};
  const src = (e && typeof e === 'object' ? e : {}) as Record<string, Record<string, unknown>>;
  for (const v of villageIds) {
    if (!src[v]) continue;
    out[v] = {};
    for (const k of keys) {
      const raw = src[v][k];
      out[v][k] = raw === null || raw === undefined || raw === '' ? null : Number(raw);
    }
  }
  return out;
}
function requireCriteria(ctx: Ctx, c: Competition): CriteriaConfig {
  const cr = getCriteria(ctx, c.id);
  if (!cr || !cr.confirmed) throw new ApiError('CRITERIA_NOT_CONFIRMED', 'เกณฑ์การให้คะแนนยังไม่ได้รับการยืนยันจากผู้ดูแล');
  return cr;
}
function throwIssues(issues: D.ValidationIssue[]) {
  if (issues.length) throw new ApiError('INVALID', issues.map((i) => i.message).join(' · '), issues);
}

function saveScores(ctx: Ctx, user: UserRow, p: any) {
  return mutate(ctx, () => {
    const c = getComp(ctx, p.competitionId);
    const a = getAssignment(ctx, c.id);
    if (!D.canEditScores(c.status, user.role, a.scorerId === user.id)) throw new ApiError('FORBIDDEN', c.status === 'open' ? 'คุณไม่ได้รับมอบหมายให้บันทึกรายการนี้' : 'รายการนี้ไม่ได้เปิดรับคะแนน');
    const cur = getScore(ctx, c.id);
    checkVersion(cur.version, p.baseVersion, cur);
    const raw = (p.data ?? {}) as ScoreData;
    const data: ScoreData = { placements: sanitizePlacements(raw.placements, c.places), note: str(raw.note, 2000), tieNote: str(raw.tieNote, 1000) };
    throwIssues(D.validatePlacements(data.placements, c.places, c.eligibleVillageIds, false));
    if (c.format === 'criteria' && c.judgeMode === 'single') {
      const cr = requireCriteria(ctx, c);
      data.entries = sanitizeEntries(raw.entries, cr.items.map((i) => i.key), c.eligibleVillageIds);
      const issues = Object.entries(data.entries).flatMap(([vid, en]) => D.validateEntry(cr.items, en, false).map((i) => ({ ...i, message: `${vname(ctx, vid)}: ${i.message}` })));
      throwIssues(issues);
    }
    if (c.format === 'league' && raw.leagueTieOrder && typeof raw.leagueTieOrder === 'object') {
      data.leagueTieOrder = {};
      for (const [g, ids] of Object.entries(raw.leagueTieOrder)) if (Array.isArray(ids)) data.leagueTieOrder[g] = ids.filter((x) => c.eligibleVillageIds.includes(x));
    }
    const rec: ScoreRecord = { ...cur, data, version: cur.version + 1, updatedBy: user.id, updatedAt: iso(ctx) };
    ctx.store.upsert('Scores', rec as unknown as Row);
    audit(ctx, user, 'scores.save', c.id, { version: rec.version, data });
    return { score: rec };
  });
}

function vname(ctx: Ctx, id: string) { return villages(ctx).find((v) => v.id === id)?.name ?? id; }

function saveSheet(ctx: Ctx, user: UserRow, p: any) {
  return mutate(ctx, () => {
    const c = getComp(ctx, p.competitionId);
    if (c.format !== 'criteria' || c.judgeMode !== 'panel') throw new ApiError('INVALID', 'รายการนี้ไม่ได้ใช้คณะกรรมการ');
    const a = getAssignment(ctx, c.id);
    if (!a.judgeIds.includes(user.id)) throw new ApiError('FORBIDDEN', 'คุณไม่ได้เป็นกรรมการของรายการนี้');
    if (c.status !== 'open') throw new ApiError('FORBIDDEN', 'รายการนี้ไม่ได้เปิดรับคะแนน');
    const cr = requireCriteria(ctx, c);
    const cur = (findRow(ctx.store, 'JudgeSheets', { competitionId: c.id, judgeId: user.id }) as unknown as JudgeSheet | null)
      ?? { competitionId: c.id, judgeId: user.id, entries: {}, version: 0, updatedAt: null };
    checkVersion(cur.version, p.baseVersion, cur);
    const entries = sanitizeEntries(p.entries, cr.items.map((i) => i.key), c.eligibleVillageIds);
    throwIssues(Object.entries(entries).flatMap(([vid, en]) => D.validateEntry(cr.items, en, false).map((i) => ({ ...i, message: `${vname(ctx, vid)}: ${i.message}` }))));
    const rec: JudgeSheet = { ...cur, entries, version: cur.version + 1, updatedAt: iso(ctx) };
    ctx.store.upsert('JudgeSheets', rec as unknown as Row);
    audit(ctx, user, 'sheets.save', c.id, { version: rec.version, entries });
    return { sheet: rec };
  });
}

/* ===================== matches ===================== */

const intOrNull = (v: unknown, label: string) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 99) throw new ApiError('INVALID', `${label} ต้องเป็นจำนวนเต็ม 0–99`);
  return n;
};

function saveMatch(ctx: Ctx, user: UserRow, p: any) {
  return mutate(ctx, () => {
    const c = getComp(ctx, p.competitionId);
    const a = getAssignment(ctx, c.id);
    if (!D.canEditScores(c.status, user.role, a.scorerId === user.id)) throw new ApiError('FORBIDDEN', 'ไม่มีสิทธิ์บันทึกผลนัดนี้ หรือรายการไม่ได้เปิดรับคะแนน');
    const cur = findRow(ctx.store, 'Matches', { id: String(p.matchId ?? '') }) as unknown as Match | null;
    if (!cur || cur.competitionId !== c.id) throw new ApiError('NOT_FOUND', 'ไม่พบนัดการแข่งขัน');
    checkVersion(cur.version, p.baseVersion, cur);
    const patch = p.patch ?? {};
    const next: Match = { ...cur };
    for (const k of ['homeScore', 'awayScore', 'homePens', 'awayPens'] as const) if (k in patch) next[k] = intOrNull(patch[k], 'คะแนน');
    for (const k of ['homeId', 'awayId'] as const) if (k in patch) {
      const v = patch[k] || null;
      if (v && !c.eligibleVillageIds.includes(v)) throw new ApiError('INVALID', 'หมู่บ้านนี้ไม่ได้อยู่ในรายการ');
      next[k] = v;
    }
    if (D.isAdmin(user.role)) for (const k of ['schedule', 'field', 'homeLabel', 'awayLabel'] as const) if (k in patch) next[k] = str(patch[k], 100);
    if ('status' in patch) next.status = patch.status === 'played' ? 'played' : 'scheduled';
    if (next.homeId && next.homeId === next.awayId) throw new ApiError('INVALID', 'ทีมเหย้าและทีมเยือนต้องไม่ซ้ำกัน');
    if (next.status === 'played') {
      if (!next.homeId || !next.awayId) throw new ApiError('INVALID', 'ต้องระบุทั้งสองทีมก่อนบันทึกผล');
      if (next.homeScore === null || next.awayScore === null) throw new ApiError('INVALID', 'ต้องกรอกคะแนนทั้งสองทีม');
      if (next.round !== 'group' && next.homeScore === next.awayScore && (next.homePens === null || next.awayPens === null || next.homePens === next.awayPens)) {
        throw new ApiError('INVALID', 'รอบน็อคเอาท์ที่เสมอต้องกรอกผลยิงจุดโทษที่มีผู้ชนะ');
      }
    }
    next.version = cur.version + 1; next.updatedBy = user.id; next.updatedAt = iso(ctx);
    ctx.store.upsert('Matches', next as unknown as Row);
    audit(ctx, user, 'matches.save', c.id, { matchId: cur.id, before: pickScore(cur), after: pickScore(next) });
    return { match: next };
  });
}
const pickScore = (m: Match) => ({ homeId: m.homeId, awayId: m.awayId, homeScore: m.homeScore, awayScore: m.awayScore, homePens: m.homePens, awayPens: m.awayPens, status: m.status });

function createMatch(ctx: Ctx, user: UserRow, p: any) {
  requireAdmin(user);
  return mutate(ctx, () => {
    const c = getComp(ctx, p.competitionId);
    if (c.format !== 'league' && c.format !== 'knockout') throw new ApiError('INVALID', 'รายการนี้ไม่มีตารางนัด');
    const existing = matchesOf(ctx, c.id);
    const no = Math.max(0, ...existing.map((m) => m.no)) + 1;
    const round = ['group', 'r1', 'qf', 'semi', 'third', 'final'].includes(p.round) ? p.round : 'r1';
    const m: Match = {
      id: `${c.id}-${no}`, competitionId: c.id, no, round, group: p.group ? str(p.group, 5) : null, schedule: str(p.schedule, 100), field: str(p.field, 50),
      homeId: null, awayId: null, homeLabel: str(p.homeLabel, 60), awayLabel: str(p.awayLabel, 60),
      homeScore: null, awayScore: null, homePens: null, awayPens: null, status: 'scheduled', version: 1, updatedBy: user.id, updatedAt: iso(ctx),
    };
    ctx.store.upsert('Matches', m as unknown as Row);
    audit(ctx, user, 'matches.create', c.id, { matchId: m.id });
    return { match: m };
  });
}
function deleteMatch(ctx: Ctx, user: UserRow, p: any) {
  requireAdmin(user);
  return mutate(ctx, () => {
    const m = findRow(ctx.store, 'Matches', { id: String(p.matchId ?? '') }) as unknown as Match | null;
    if (!m) throw new ApiError('NOT_FOUND', 'ไม่พบนัด');
    if (m.status === 'played') throw new ApiError('INVALID', 'ลบนัดที่บันทึกผลแล้วไม่ได้ ให้ล้างผลก่อน');
    ctx.store.remove('Matches', { id: m.id });
    audit(ctx, user, 'matches.delete', m.competitionId, { matchId: m.id });
    return {};
  });
}

/* ===================== configuration (admin) ===================== */

function createCompetition(ctx: Ctx, user: UserRow, p: any) {
  requireAdmin(user);
  const id = str(p.id, 40).toLowerCase();
  if (!/^[a-z0-9_-]{2,40}$/.test(id)) throw new ApiError('INVALID', 'รหัสรายการใช้ a-z 0-9 _ - ยาว 2–40 ตัว');
  const category = ['sport', 'folk', 'contest'].includes(p.category) ? p.category : null;
  const format = ['placement', 'criteria', 'league', 'knockout'].includes(p.format) ? p.format : null;
  if (!category || !format) throw new ApiError('INVALID', 'กรุณาเลือกประเภทและรูปแบบการแข่งขัน');
  if (p.countsForCup && (user.role !== 'superadmin' || !str(p.reason))) throw new ApiError('FORBIDDEN', 'การนับรายการใหม่เข้าถ้วยรวมทำได้เฉพาะ Super Admin พร้อมเหตุผลการยืนยันจากผู้จัด');
  return mutate(ctx, () => {
    if (findRow(ctx.store, 'Competitions', { id })) throw new ApiError('INVALID', 'รหัสรายการนี้มีอยู่แล้ว');
    const comps = competitions(ctx);
    const c: Competition = {
      id, name: str(p.name, 120) || id, category, format, gender: ['male', 'female', 'mixed'].includes(p.gender) ? p.gender : null,
      countsForCup: !!p.countsForCup, places: [1, 2, 3, 4].includes(Number(p.places)) ? Number(p.places) : 3, prizes: [], status: 'draft',
      order: Math.max(0, ...comps.map((x) => x.order)) + 1, schedule: str(p.schedule, 200), description: str(p.description, 1000),
      eligibleVillageIds: villages(ctx).map((v) => v.id), matchesPublic: false, judgeMode: 'single',
      league: format === 'league' ? { win: Number(p.win ?? 3), draw: Number(p.draw ?? 1), loss: Number(p.loss ?? 0), advance: 2, groups: {} } : null,
      version: 1, updatedAt: iso(ctx),
    };
    ctx.store.upsert('Competitions', c as unknown as Row);
    if (format === 'criteria') {
      ctx.store.upsert('Criteria', { competitionId: id, items: [], maxTotal: Number(p.maxTotal ?? 50), aggregation: null, confirmed: false, confirmedBy: null, confirmedAt: null });
    }
    audit(ctx, user, 'competitions.create', id, { ...c, reason: str(p.reason) });
    return { competition: c };
  });
}

function updateCompetition(ctx: Ctx, user: UserRow, p: any) {
  requireAdmin(user);
  return mutate(ctx, () => {
    const c = getComp(ctx, p.id);
    checkVersion(c.version, p.baseVersion, c);
    const patch = p.patch ?? {};
    const next: Competition = { ...c };
    if ('name' in patch) next.name = str(patch.name, 120) || c.name;
    if ('schedule' in patch) next.schedule = str(patch.schedule, 200);
    if ('description' in patch) next.description = str(patch.description, 1000);
    if ('matchesPublic' in patch) next.matchesPublic = !!patch.matchesPublic;
    const structural = ['places', 'prizes', 'eligibleVillageIds', 'judgeMode', 'league'].filter((k) => k in patch);
    if ('league' in patch && c.format === 'league' && patch.league && c.status === 'draft') {
      const L = patch.league;
      const groups: Record<string, string[]> = {};
      for (const [g, ids] of Object.entries(L.groups ?? {})) groups[str(g, 5)] = (Array.isArray(ids) ? ids : []).filter((x: string) => c.eligibleVillageIds.includes(x));
      next.league = { win: Number(L.win ?? 3), draw: Number(L.draw ?? 1), loss: Number(L.loss ?? 0), advance: Math.max(1, Number(L.advance ?? 2)), groups };
    }
    if (structural.length && c.status !== 'draft') throw new ApiError('INVALID', 'แก้โครงสร้างรายการได้เฉพาะสถานะ "ยังไม่เริ่ม"');
    if ('places' in patch) { const n = Number(patch.places); if (![1, 2, 3, 4].includes(n)) throw new ApiError('INVALID', 'จำนวนอันดับต้องเป็น 1–4'); next.places = n; }
    if ('prizes' in patch) next.prizes = (Array.isArray(patch.prizes) ? patch.prizes : []).map((x: unknown) => Math.max(0, Number(x) || 0)).slice(0, 4);
    if ('eligibleVillageIds' in patch) {
      const ids = villages(ctx).map((v) => v.id);
      next.eligibleVillageIds = (Array.isArray(patch.eligibleVillageIds) ? patch.eligibleVillageIds : []).filter((x: string) => ids.includes(x));
      if (next.eligibleVillageIds.length < 2) throw new ApiError('INVALID', 'ต้องมีผู้เข้าแข่งขันอย่างน้อย 2 หมู่บ้าน');
    }
    if ('judgeMode' in patch) {
      if (c.format !== 'criteria') throw new ApiError('INVALID', 'ใช้ได้เฉพาะรายการประกวด');
      next.judgeMode = patch.judgeMode === 'panel' ? 'panel' : 'single';
    }
    if ('countsForCup' in patch && !!patch.countsForCup !== c.countsForCup) {
      // ห้ามเปลี่ยนเงื่อนไขถ้วยรวมเองโดยพลการ: เฉพาะ Super Admin, เฉพาะสถานะยังไม่เริ่ม และต้องระบุเหตุผล/หลักฐานการยืนยันจากผู้จัด
      if (user.role !== 'superadmin') throw new ApiError('FORBIDDEN', 'การเปลี่ยนเงื่อนไขถ้วยรวมทำได้เฉพาะ Super Admin');
      if (c.status !== 'draft') throw new ApiError('INVALID', 'เปลี่ยนเงื่อนไขถ้วยรวมได้เฉพาะสถานะ "ยังไม่เริ่ม"');
      if (!str(p.reason)) throw new ApiError('INVALID', 'กรุณาระบุเหตุผลและการยืนยันจากผู้จัด');
      next.countsForCup = !!patch.countsForCup;
    }
    next.version = c.version + 1; next.updatedAt = iso(ctx);
    ctx.store.upsert('Competitions', next as unknown as Row);
    if (next.judgeMode !== c.judgeMode) {
      const cr = getCriteria(ctx, c.id);
      if (cr) ctx.store.upsert('Criteria', { ...cr, confirmed: false, confirmedBy: null, confirmedAt: null } as unknown as Row);
    }
    audit(ctx, user, 'competitions.update', c.id, { patch, reason: str(p.reason) });
    return { competition: next };
  });
}

function updateCriteria(ctx: Ctx, user: UserRow, p: any) {
  requireAdmin(user);
  return mutate(ctx, () => {
    const c = getComp(ctx, p.competitionId);
    if (c.format !== 'criteria') throw new ApiError('INVALID', 'รายการนี้ไม่ได้ใช้เกณฑ์คะแนน');
    if (c.status !== 'draft') throw new ApiError('INVALID', 'แก้เกณฑ์ได้เฉพาะสถานะ "ยังไม่เริ่ม"');
    const cur = getCriteria(ctx, c.id) ?? { competitionId: c.id, items: [], maxTotal: 50, aggregation: null, confirmed: false, confirmedBy: null, confirmedAt: null };
    const items = (Array.isArray(p.items) ? p.items : cur.items).slice(0, 20).map((it: any, i: number) => ({
      key: str(it.key, 20) || `c${i + 1}`, label: str(it.label, 200), max: it.max === null || it.max === '' || it.max === undefined ? null : Number(it.max),
    }));
    const next: CriteriaConfig = {
      ...cur, items,
      maxTotal: p.maxTotal !== undefined ? Number(p.maxTotal) : cur.maxTotal,
      aggregation: p.aggregation === 'average' || p.aggregation === 'sum' ? p.aggregation : p.aggregation === null ? null : cur.aggregation,
      confirmed: false, confirmedBy: null, confirmedAt: null,
    };
    ctx.store.upsert('Criteria', next as unknown as Row);
    audit(ctx, user, 'criteria.update', c.id, next);
    return { criteria: next };
  });
}
function confirmCriteria(ctx: Ctx, user: UserRow, p: any) {
  requireAdmin(user);
  return mutate(ctx, () => {
    const c = getComp(ctx, p.competitionId);
    if (c.status !== 'draft') throw new ApiError('INVALID', 'ยืนยันเกณฑ์ได้เฉพาะสถานะ "ยังไม่เริ่ม"');
    const cr = getCriteria(ctx, c.id);
    if (!cr) throw new ApiError('NOT_FOUND', 'ยังไม่มีเกณฑ์');
    throwIssues(D.validateCriteriaConfig(cr.items, cr.maxTotal));
    if (c.judgeMode === 'panel' && !cr.aggregation) throw new ApiError('INVALID', 'ต้องเลือกวิธีรวมคะแนนกรรมการ (เฉลี่ย/รวม)');
    const next = { ...cr, confirmed: true, confirmedBy: user.id, confirmedAt: iso(ctx) };
    ctx.store.upsert('Criteria', next as unknown as Row);
    audit(ctx, user, 'criteria.confirm', c.id, next);
    return { criteria: next };
  });
}

function setAssignment(ctx: Ctx, user: UserRow, p: any) {
  requireAdmin(user);
  return mutate(ctx, () => {
    const c = getComp(ctx, p.competitionId);
    if (['approved', 'published', 'locked'].includes(c.status)) throw new ApiError('INVALID', 'รายการนี้อนุมัติผลแล้ว');
    const users = allUsers(ctx);
    const okScorer = (id: string) => users.some((u) => u.id === id && u.active && (u.role === 'scorekeeper' || D.isAdmin(u.role)));
    const scorerId = p.scorerId ? String(p.scorerId) : null;
    if (scorerId && !okScorer(scorerId)) throw new ApiError('INVALID', 'ผู้บันทึกต้องเป็นบัญชีบทบาทผู้บันทึกคะแนนที่ใช้งานอยู่');
    const judgeIds: string[] = Array.isArray(p.judgeIds) ? [...new Set(p.judgeIds.map(String))] as string[] : [];
    if (judgeIds.some((id) => !okScorer(id))) throw new ApiError('INVALID', 'กรรมการต้องเป็นบัญชีบทบาทผู้บันทึกคะแนนที่ใช้งานอยู่');
    const next: Assignment = { competitionId: c.id, scorerId, judgeIds: c.judgeMode === 'panel' ? judgeIds : [] };
    ctx.store.upsert('Assignments', next as unknown as Row);
    audit(ctx, user, 'assignments.set', c.id, next);
    return { assignment: next };
  });
}

function updateSettings(ctx: Ctx, user: UserRow, p: any) {
  requireAdmin(user);
  return mutate(ctx, () => {
    const s = getSettings(ctx);
    const next: Settings = { ...s };
    if ('cupVisible' in p) next.cupVisible = !!p.cupVisible;
    if ('autoPublishOnApprove' in p) next.autoPublishOnApprove = !!p.autoPublishOnApprove;
    if ('tieRule' in p) {
      if (!['unconfirmed', 'shared', 'countback', 'manual'].includes(p.tieRule)) throw new ApiError('INVALID', 'กติกาตัดสินเสมอไม่ถูกต้อง');
      next.tieRule = p.tieRule;
      next.tieRuleConfirmed = p.tieRule !== 'unconfirmed' && !!p.tieRuleConfirmed;
      if (p.tieRule !== 'unconfirmed' && !p.tieRuleConfirmed) throw new ApiError('INVALID', 'ต้องยืนยันว่ากติกานี้ผู้จัดรับรองแล้ว');
    }
    if ('tieManualOrder' in p) {
      const ids = villages(ctx).map((v) => v.id);
      next.tieManualOrder = (Array.isArray(p.tieManualOrder) ? p.tieManualOrder : []).filter((x: string) => ids.includes(x));
    }
    for (const [k, v] of Object.entries(next)) if ((s as unknown as Row)[k] !== v || k === 'tieManualOrder') ctx.store.upsert('Settings', { key: k, value: v });
    audit(ctx, user, 'settings.update', null, { before: s, after: next, reason: str(p.reason) });
    return { settings: next };
  });
}

/* ===================== workflow ===================== */

function buildResult(ctx: Ctx, c: Competition, score: ScoreRecord, approver: UserRow | null): ResultRecord {
  let ranking: ResultRecord['ranking'] = null;
  if (c.format === 'criteria') {
    const cr = requireCriteria(ctx, c);
    ranking = D.contestRanking(cr.items, c.eligibleVillageIds, c.judgeMode, score.data.entries, sheetsOf(ctx, c.id).map((s) => s.entries), cr.aggregation);
  }
  return {
    competitionId: c.id, placements: score.data.placements, ranking,
    cupPoints: c.countsForCup ? D.cupPointsFor(score.data.placements) : {}, countsForCup: c.countsForCup,
    note: score.data.note ?? '', tieNote: score.data.tieNote ?? '',
    approvedBy: approver?.id ?? null, approvedAt: iso(ctx), publishedAt: null,
  };
}

/** ตรวจความครบถ้วนก่อนส่งผล — ทำฝั่งเซิร์ฟเวอร์ทุกครั้ง */
export function validateSubmission(ctx: Ctx, c: Competition, score: ScoreRecord) {
  const p = score.data.placements ?? {};
  throwIssues(D.validatePlacements(p, c.places, c.eligibleVillageIds, true));
  if (c.format === 'criteria') {
    const cr = requireCriteria(ctx, c);
    if (c.judgeMode === 'single') {
      const issues = c.eligibleVillageIds.flatMap((vid) => D.validateEntry(cr.items, score.data.entries?.[vid], true).map((i) => ({ ...i, message: `${vname(ctx, vid)}: ${i.message}` })));
      throwIssues(issues);
    } else {
      const sheets = sheetsOf(ctx, c.id);
      const judges = getAssignment(ctx, c.id).judgeIds;
      const missing = judges.filter((j) => !sheets.some((s) => s.judgeId === j && c.eligibleVillageIds.every((v) => D.entryTotal(cr.items, s.entries[v]).complete)));
      if (missing.length) throw new ApiError('INVALID', `ยังมีกรรมการกรอกคะแนนไม่ครบ ${missing.length} คน`);
    }
    const ranking = D.contestRanking(cr.items, c.eligibleVillageIds, c.judgeMode, score.data.entries, sheetsOf(ctx, c.id).map((s) => s.entries), cr.aggregation);
    throwIssues(D.placementsConsistent(p, ranking));
    if (D.tiesWithinPlaces(ranking, c.places).length && !(score.data.tieNote ?? '').trim()) {
      throw new ApiError('INVALID', 'มีคะแนนเท่ากันในอันดับที่ได้รางวัล กรุณาระบุเหตุผลการจัดลำดับ');
    }
  }
}

function transition(ctx: Ctx, user: UserRow, competitionId: unknown, action: WorkflowAction, reason?: string) {
  return mutate(ctx, () => {
    const c = getComp(ctx, competitionId);
    const a = getAssignment(ctx, c.id);
    const score = getScore(ctx, c.id);
    const chk = D.checkTransition(action, { status: c.status, role: user.role, isAssignedScorer: a.scorerId === user.id, reason, isSubmitter: score.submittedBy === user.id });
    if (!chk.ok) throw new ApiError('FORBIDDEN', chk.error!);
    const s = getSettings(ctx);
    let to = chk.to!;
    const now = iso(ctx);
    switch (action) {
      case 'open':
        if (c.format === 'criteria') requireCriteria(ctx, c);
        if (!a.scorerId) throw new ApiError('INVALID', 'ยังไม่ได้มอบหมายผู้บันทึกคะแนน');
        if (c.format === 'criteria' && c.judgeMode === 'panel' && !a.judgeIds.length) throw new ApiError('INVALID', 'ยังไม่ได้กำหนดกรรมการ');
        break;
      case 'submit':
        validateSubmission(ctx, c, score);
        ctx.store.upsert('Scores', { ...score, submittedBy: user.id, submittedAt: now, reviewNote: null } as unknown as Row);
        break;
      case 'return': case 'reject':
        ctx.store.upsert('Scores', { ...score, reviewNote: str(reason, 1000) } as unknown as Row);
        break;
      case 'approve': {
        validateSubmission(ctx, c, score);
        const r = buildResult(ctx, c, score, user);
        if (s.autoPublishOnApprove) { r.publishedAt = now; to = 'published'; }
        ctx.store.upsert('Results', { ...r, summary: summary(ctx, r) } as unknown as Row);
        break;
      }
      case 'publish': {
        const r = findRow(ctx.store, 'Results', { competitionId: c.id });
        if (!r) throw new ApiError('INVALID', 'ยังไม่มีผลที่อนุมัติ');
        ctx.store.upsert('Results', { ...r, publishedAt: now });
        break;
      }
      case 'unpublish': {
        const r = findRow(ctx.store, 'Results', { competitionId: c.id });
        if (r) ctx.store.upsert('Results', { ...r, publishedAt: null });
        break;
      }
      case 'reopen':
        ctx.store.remove('Results', { competitionId: c.id });
        break;
    }
    const next: Competition = { ...c, status: to, version: c.version + 1, updatedAt: now };
    ctx.store.upsert('Competitions', next as unknown as Row);
    audit(ctx, user, `workflow.${action}`, c.id, { from: c.status, to, reason: str(reason, 1000) });
    return { competition: next };
  });
}

function summary(ctx: Ctx, r: ResultRecord) {
  return Object.entries(r.placements).filter(([, v]) => v).map(([k, v]) => `${k}: ${vname(ctx, v!)}`).join(' | ');
}

/* ===================== users ===================== */

const ROLES: Role[] = ['superadmin', 'admin', 'scorekeeper', 'reviewer', 'viewer'];
function assertCanGrant(actor: PublicUser, role: Role) {
  if (!ROLES.includes(role)) throw new ApiError('INVALID', 'บทบาทไม่ถูกต้อง');
  if ((role === 'superadmin' || role === 'admin') && actor.role !== 'superadmin') throw new ApiError('FORBIDDEN', 'เฉพาะ Super Admin ที่กำหนดบทบาทผู้ดูแลได้');
}

function createUser(ctx: Ctx, actor: UserRow, p: any) {
  requireAdmin(actor);
  const username = str(p.username, 40).toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new ApiError('INVALID', 'ชื่อผู้ใช้ใช้ a-z 0-9 . _ - ยาว 3–40 ตัว');
  const role = p.role as Role;
  assertCanGrant(actor, role);
  validatePassword(String(p.password ?? ''));
  return mutate(ctx, () => {
    if (allUsers(ctx).some((u) => u.username.toLowerCase() === username)) throw new ApiError('INVALID', 'ชื่อผู้ใช้นี้มีอยู่แล้ว');
    const u = newUserRow(ctx, username, str(p.displayName, 80) || username, role, String(p.password), true);
    ctx.store.upsert('Users', u as unknown as Row);
    audit(ctx, actor, 'users.create', null, { id: u.id, username, role });
    return { user: toPublic(u) };
  });
}

export function newUserRow(ctx: Ctx, username: string, displayName: string, role: Role, password: string, mustChange: boolean): UserRow {
  const salt = ctx.crypto.randomToken().slice(0, 24);
  return {
    id: 'u_' + ctx.crypto.randomToken().slice(0, 12), username, displayName, role, active: true, mustChangePassword: mustChange,
    passwordHash: hashPassword(ctx.crypto, salt, password), salt, failedLogins: 0, lockedUntil: null, createdAt: iso(ctx),
  };
}

function updateUser(ctx: Ctx, actor: UserRow, p: any) {
  requireAdmin(actor);
  return mutate(ctx, () => {
    const u = findRow(ctx.store, 'Users', { id: String(p.id ?? '') }) as unknown as UserRow | null;
    if (!u) throw new ApiError('NOT_FOUND', 'ไม่พบผู้ใช้');
    if ((u.role === 'superadmin' || u.role === 'admin') && actor.role !== 'superadmin') throw new ApiError('FORBIDDEN', 'เฉพาะ Super Admin ที่แก้บัญชีผู้ดูแลได้');
    const next = { ...u };
    if ('displayName' in p) next.displayName = str(p.displayName, 80) || u.displayName;
    if ('role' in p && p.role !== u.role) { assertCanGrant(actor, p.role); next.role = p.role; }
    if ('active' in p) next.active = !!p.active;
    if (u.id === actor.id && (!next.active || next.role !== u.role)) throw new ApiError('INVALID', 'แก้บทบาทหรือปิดบัญชีของตัวเองไม่ได้');
    if (u.role === 'superadmin' && (next.role !== 'superadmin' || !next.active) && allUsers(ctx).filter((x) => x.role === 'superadmin' && x.active).length <= 1) {
      throw new ApiError('INVALID', 'ต้องมี Super Admin ที่ใช้งานอยู่อย่างน้อย 1 บัญชี');
    }
    ctx.store.upsert('Users', next as unknown as Row);
    if (!next.active || next.role !== u.role) revokeSessions(ctx, u.id);
    audit(ctx, actor, 'users.update', null, { id: u.id, before: toPublic(u), after: toPublic(next) });
    return { user: toPublic(next) };
  });
}
function resetPassword(ctx: Ctx, actor: UserRow, p: any) {
  requireAdmin(actor);
  validatePassword(String(p.password ?? ''));
  return mutate(ctx, () => {
    const u = findRow(ctx.store, 'Users', { id: String(p.id ?? '') }) as unknown as UserRow | null;
    if (!u) throw new ApiError('NOT_FOUND', 'ไม่พบผู้ใช้');
    if ((u.role === 'superadmin' || u.role === 'admin') && actor.role !== 'superadmin') throw new ApiError('FORBIDDEN', 'เฉพาะ Super Admin ที่รีเซ็ตรหัสผู้ดูแลได้');
    const salt = ctx.crypto.randomToken().slice(0, 24);
    ctx.store.upsert('Users', { ...u, salt, passwordHash: hashPassword(ctx.crypto, salt, String(p.password)), mustChangePassword: true, failedLogins: 0, lockedUntil: null } as unknown as Row);
    revokeSessions(ctx, u.id);
    audit(ctx, actor, 'users.resetPassword', null, { id: u.id });
    return {};
  });
}
function revokeSessions(ctx: Ctx, userId: string) {
  for (const s of ctx.store.all('Sessions')) if (s.userId === userId) ctx.store.remove('Sessions', s);
}

/* ===================== setup / seed ===================== */

/** สร้างข้อมูลตั้งต้น (ไม่เขียนทับข้อมูลที่มีอยู่) และบัญชี Super Admin คนแรก */
export function seedAll(ctx: Ctx, admin?: { username: string; password: string; displayName?: string }) {
  return mutate(ctx, () => {
    const created: string[] = [];
    const ensure = (table: Parameters<Store['upsert']>[0], rows: Row[], key: string) => {
      const have = new Set(ctx.store.all(table).map((r) => String(r[key])));
      rows.forEach((r) => { if (!have.has(String(r[key]))) { ctx.store.upsert(table, r); created.push(`${table}:${r[key]}`); } });
    };
    ensure('Villages', D.VILLAGES as unknown as Row[], 'id');
    ensure('Competitions', D.seedCompetitions().map((c) => ({ ...c, updatedAt: iso(ctx) })) as unknown as Row[], 'id');
    ensure('Criteria', D.seedCriteria() as unknown as Row[], 'competitionId');
    ensure('Matches', D.seedMatches() as unknown as Row[], 'id');
    ensure('Settings', Object.entries(D.DEFAULT_SETTINGS).map(([key, value]) => ({ key, value })), 'key');
    if (admin && !allUsers(ctx).some((u) => u.role === 'superadmin')) {
      validatePassword(admin.password);
      const u = newUserRow(ctx, admin.username.toLowerCase(), admin.displayName ?? 'Super Admin', 'superadmin', admin.password, true);
      ctx.store.upsert('Users', u as unknown as Row);
      created.push(`Users:${u.username}`);
    }
    audit(ctx, null, 'system.seed', null, { created: created.length });
    return { created };
  });
}
