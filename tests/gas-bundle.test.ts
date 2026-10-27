// ทดสอบไฟล์ server/dist/Code.js ที่จะนำไปวางใน Apps Script จริง โดยจำลอง SpreadsheetApp / LockService / PropertiesService
// (ตรวจว่าการอ่าน-เขียนชีต การแปลงชนิดข้อมูล และ doGet/doPost ทำงานถูกต้องหลังรวมไฟล์)
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { beforeAll, describe, expect, it } from 'vitest';

type Cell = string | number | boolean | Date;
class FakeRange {
  constructor(private sh: FakeSheet, private r: number, private c: number, private nr: number, private nc: number) {}
  getValues(): Cell[][] { return Array.from({ length: this.nr }, (_, i) => Array.from({ length: this.nc }, (_, j) => this.sh.cell(this.r + i, this.c + j))); }
  setValues(v: Cell[][]) { v.forEach((row, i) => row.forEach((x, j) => this.sh.set(this.r + i, this.c + j, x))); return this; }
  setNumberFormats(f: string[][]) { f.forEach((row, i) => row.forEach((x, j) => this.sh.fmt.set(`${this.r + i}:${this.c + j}`, x))); return this; }
  setFontWeight() { return this; }
  setBackground() { return this; }
}
class FakeSheet {
  rows: Cell[][] = [];
  fmt = new Map<string, string>();
  constructor(public name: string) {}
  cell(r: number, c: number): Cell { return this.rows[r - 1]?.[c - 1] ?? ''; }
  set(r: number, c: number, v: Cell) {
    while (this.rows.length < r) this.rows.push([]);
    // จำลองการแปลงค่าอัตโนมัติของ Google Sheets เมื่อเซลล์ไม่ได้ตั้งรูปแบบเป็นข้อความ
    const f = this.fmt.get(`${r}:${c}`);
    if (f !== '@' && typeof v === 'string') {
      if (/^(TRUE|FALSE)$/i.test(v)) v = v.toUpperCase() === 'TRUE';
      else if (/^-?\d+(\.\d+)?$/.test(v)) v = Number(v);
      else if (/^\d{4}-\d{2}-\d{2}T/.test(v)) v = new Date(v);
    }
    this.rows[r - 1][c - 1] = v;
  }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return Math.max(0, ...this.rows.map((r) => r.length)); }
  getRange(r: number, c: number, nr = 1, nc = 1) { return new FakeRange(this, r, c, nr, nc); }
  getDataRange() { return new FakeRange(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  setFrozenRows() {}
  deleteRow(r: number) { this.rows.splice(r - 1, 1); }
}

function makeGlobals() {
  const sheets = new Map<string, FakeSheet>([['Sheet1', new FakeSheet('Sheet1')]]);
  const props = new Map<string, string>([['ADMIN_USERNAME', 'root'], ['ADMIN_PASSWORD', 'Start1234']]);
  const ss = {
    getSheetByName: (n: string) => sheets.get(n) ?? null,
    insertSheet: (n: string) => { const s = new FakeSheet(n); sheets.set(n, s); return s; },
    getSheets: () => [...sheets.values()],
    deleteSheet: (s: FakeSheet) => sheets.delete(s.name),
    getId: () => 'sheet-id', getName: () => 'เชิงดอยเกมส์ 26',
  };
  let locked = false;
  const cache = new Map<string, string>();
  const g: Record<string, unknown> = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, openById: () => ss, flush: () => undefined },
    LockService: { getScriptLock: () => ({ tryLock: () => { if (locked) return false; locked = true; return true; }, releaseLock: () => { locked = false; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => props.get(k) ?? null, setProperty: (k: string, v: string) => props.set(k, v), deleteProperty: (k: string) => props.delete(k) }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (_a: string, s: string) => [...createHash('sha256').update(s, 'utf8').digest()].map((b) => (b > 127 ? b - 256 : b)),
      getUuid: () => randomUUID(),
      formatDate: () => '2026-11-08_0900',
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s: string) => ({ setMimeType: () => ({ content: s }) }) },
    Logger: { log: () => undefined },
    CacheService: { getScriptCache: () => ({ get: (k: string) => cache.get(k) ?? null, put: (k: string, v: string) => cache.set(k, v) }) },
    console,
  };
  return { g, sheets, props };
}

describe('Apps Script bundle (Code.js) บนชีตจำลอง', () => {
  let env: ReturnType<typeof makeGlobals>;
  let ctx: vm.Context;
  const post = (action: string, payload: unknown = {}, token: string | null = null) =>
    JSON.parse((vm.runInContext('doPost', ctx) as Function)({ postData: { contents: JSON.stringify({ action, payload, token }) } }).content);
  const get = (q: Record<string, string>) => JSON.parse((vm.runInContext('doGet', ctx) as Function)({ parameter: q }).content);

  beforeAll(() => {
    if (!existsSync('server/dist/Code.js')) execFileSync('node', ['scripts/build-gas.mjs']);
    env = makeGlobals();
    ctx = vm.createContext(env.g);
    vm.runInContext(readFileSync('server/dist/Code.js', 'utf8'), ctx);
  });

  it('setup() สร้างทุกแท็บ ข้อมูลตั้งต้น และลบรหัสผ่านเริ่มต้นออกจาก Script Properties', () => {
    (vm.runInContext('setup', ctx) as Function)();
    expect([...env.sheets.keys()].sort()).toEqual(['Assignments', 'AuditLog', 'Competitions', 'Criteria', 'JudgeSheets', 'Matches', 'Results', 'Scores', 'Sessions', 'Settings', 'Users', 'Villages']);
    expect(env.sheets.get('Villages')!.rows.length).toBe(11);
    expect(env.sheets.get('Competitions')!.rows.length).toBe(20);
    expect(env.props.has('ADMIN_PASSWORD')).toBe(false);
  });

  it('ทำงานครบวงจรผ่าน doPost/doGet และค่าที่อ่านกลับจากชีตมีชนิดถูกต้อง', () => {
    const login = post('auth.login', { username: 'root', password: 'Start1234' });
    expect(login.ok).toBe(true);
    const tok = login.data.token;
    expect(post('auth.changePassword', { oldPassword: 'Start1234', newPassword: 'Root5678x' }, tok).ok).toBe(true);
    const u = post('users.create', { username: 'sk1', displayName: 'สมชาย', role: 'scorekeeper', password: 'Temp1234' }, tok);
    expect(u.ok).toBe(true);
    expect(post('assignments.set', { competitionId: 'boat_f', scorerId: u.data.user.id }, tok).ok).toBe(true);
    expect(post('workflow.transition', { competitionId: 'boat_f', action: 'open' }, tok).ok).toBe(true);
    expect(post('scores.save', { competitionId: 'boat_f', baseVersion: 0, data: { placements: { 1: 'm13', 2: 'm1', 3: 'm7' }, note: '0812345678' } }, tok).ok).toBe(true);
    expect(post('scores.save', { competitionId: 'boat_f', baseVersion: 0, data: { placements: {} } }, tok).code).toBe('CONFLICT');

    const snap = post('staff.snapshot', {}, tok).data;
    const comp = snap.competitions.find((c: any) => c.id === 'boat_f');
    expect(comp).toMatchObject({ status: 'open', countsForCup: true, places: 3 });
    expect(typeof comp.version).toBe('number');
    expect(comp.prizes).toEqual([1000, 800, 500]);
    const sc = snap.scores.find((s: any) => s.competitionId === 'boat_f');
    expect(sc.data.note).toBe('0812345678'); // ข้อความที่เป็นตัวเลขไม่ถูกแปลงเป็นตัวเลข
    expect(sc.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // วันที่เก็บเป็นข้อความ ISO
    expect(snap.settings.cupVisible).toBe(false);

    const pub = get({ action: 'public.snapshot' });
    expect(pub.ok).toBe(true);
    expect(pub.data.results).toEqual([]);
    expect(get({ action: 'public.snapshot', since: String(pub.data.rev) }).data.unchanged).toBe(true);
    expect(get({ action: 'staff.snapshot' }).code).toBe('BAD_ACTION'); // GET ใช้ได้เฉพาะข้อมูลสาธารณะ
    expect(post('staff.snapshot', {}, 'forged-token').code).toBe('UNAUTHENTICATED');
  });
});
