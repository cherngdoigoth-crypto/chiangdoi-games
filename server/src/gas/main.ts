/// <reference types="google-apps-script" />
// จุดเข้า Google Apps Script — ถูกรวมเป็นไฟล์เดียว (dist/Code.js) ด้วย scripts/build-gas.mjs
import { handle, seedAll, type Ctx } from '../api';
import { TABLES, type TableName } from '../schema';
import type { Crypto } from '../store';
import { SheetStore } from './sheetStore';

const gasCrypto: Crypto = {
  sha256Hex(s: string) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
      .map((b) => ((b + 256) % 256).toString(16).padStart(2, '0')).join('');
  },
  randomToken() { return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''); },
  now() { return new Date(); },
};

function spreadsheet() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}
function ctx(): Ctx & { store: SheetStore } { return { store: new SheetStore(spreadsheet()), crypto: gasCrypto }; }

function json(o: unknown) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * ข้อมูลสาธารณะ: เก็บผลลัพธ์ไว้ใน CacheService ตามเลข revision เพื่อลดการอ่านชีตเมื่อมีผู้ชมจำนวนมาก
 * (ไม่เกี่ยวกับข้อมูลภายใน — ข้อมูลที่ยังไม่ประกาศไม่อยู่ในผลลัพธ์นี้ตั้งแต่ต้น)
 */
function publicSnapshotCached(since: number | undefined) {
  const c = ctx();
  const rev = c.store.getRev();
  if (since !== undefined && since === rev) return JSON.stringify({ ok: true, data: { rev, unchanged: true } });
  const cache = CacheService.getScriptCache();
  const key = 'pub:' + rev;
  const hit = cache.get(key);
  if (hit) return hit;
  const out = JSON.stringify(handle({ action: 'public.snapshot', payload: {} }, c));
  if (out.length < 95000) cache.put(key, out, 300);
  return out;
}
const raw = (s: string) => ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON);

/** GET ใช้ได้เฉพาะข้อมูลสาธารณะ เช่น ?action=public.snapshot&since=12 */
export function doGet(e: GoogleAppsScript.Events.DoGet) {
  const action = e?.parameter?.action ?? 'public.snapshot';
  if (action !== 'public.snapshot' && action !== 'ping') return json({ ok: false, code: 'BAD_ACTION', error: 'ใช้ POST สำหรับคำสั่งนี้' });
  const since = e.parameter.since !== undefined ? Number(e.parameter.since) : undefined;
  if (action === 'public.snapshot') return raw(publicSnapshotCached(since));
  return json(handle({ action, payload: { since } }, ctx()));
}

/** POST body เป็น JSON (ส่งแบบ text/plain เพื่อไม่ให้เกิด CORS preflight): {action, token, payload} */
export function doPost(e: GoogleAppsScript.Events.DoPost) {
  let req: any;
  try { req = JSON.parse(e.postData.contents); } catch (_err) { return json({ ok: false, code: 'BAD_REQUEST', error: 'รูปแบบคำขอไม่ถูกต้อง' }); }
  if (req.action === 'public.snapshot') return raw(publicSnapshotCached(req.payload?.since ?? undefined));
  return json(handle({ action: String(req.action ?? ''), token: req.token ?? null, payload: req.payload ?? {} }, ctx()));
}

/**
 * รันครั้งแรกจาก Apps Script editor: สร้างแท็บทั้งหมด ใส่ข้อมูลจากสูจิบัตร และสร้าง Super Admin
 * ตั้ง Script Properties ก่อน: ADMIN_USERNAME, ADMIN_PASSWORD (ระบบจะลบ ADMIN_PASSWORD ทิ้งหลังใช้)
 */
export function setup() {
  const c = ctx();
  (Object.keys(TABLES) as TableName[]).forEach((t) => c.store.ensureSheet(t));
  const props = PropertiesService.getScriptProperties();
  const username = props.getProperty('ADMIN_USERNAME');
  const password = props.getProperty('ADMIN_PASSWORD');
  const res = seedAll(c, username && password ? { username, password, displayName: 'Super Admin' } : undefined);
  if (password) props.deleteProperty('ADMIN_PASSWORD');
  const ss = spreadsheet();
  const blank = ss.getSheetByName('Sheet1') ?? ss.getSheetByName('ชีต1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
  Logger.log(JSON.stringify(res));
  return res;
}

/** สำรองข้อมูล: คัดลอกทั้งสเปรดชีตไปยังโฟลเดอร์ BACKUP_FOLDER_ID (หรือโฟลเดอร์เดียวกัน) */
export function backupNow() {
  const ss = spreadsheet();
  const folderId = PropertiesService.getScriptProperties().getProperty('BACKUP_FOLDER_ID');
  const stamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd_HHmm');
  const file = DriveApp.getFileById(ss.getId());
  const name = `สำรอง ${ss.getName()} ${stamp}`;
  const copy = folderId ? file.makeCopy(name, DriveApp.getFolderById(folderId)) : file.makeCopy(name);
  Logger.log('สำรองข้อมูลแล้ว: ' + copy.getUrl());
  return copy.getUrl();
}

/** ตั้งเวลาสำรองข้อมูลอัตโนมัติทุกชั่วโมง (รันครั้งเดียว) */
export function installBackupTrigger() {
  ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === 'backupNow').forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('backupNow').timeBased().everyHours(1).create();
}
