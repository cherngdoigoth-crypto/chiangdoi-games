/// <reference types="google-apps-script" />
import { TABLES, type Row, type TableDef, type TableName } from '../schema';
import { keyOf, type Store } from '../store';
import { ApiError } from '../api';

interface Loaded { sheet: GoogleAppsScript.Spreadsheet.Sheet; header: string[]; rows: Row[]; }

/** Store บน Google Sheets: 1 ตาราง = 1 แท็บ, แถวแรก = หัวคอลัมน์, เก็บค่าเป็นข้อความเพื่อไม่ให้ชีตแปลงวันที่/ตัวเลขเอง */
export class SheetStore implements Store {
  private cache = new Map<TableName, Loaded>();
  constructor(private ss: GoogleAppsScript.Spreadsheet.Spreadsheet) {}

  ensureSheet(table: TableName): GoogleAppsScript.Spreadsheet.Sheet {
    const def = TABLES[table];
    let sheet = this.ss.getSheetByName(def.name);
    if (!sheet) sheet = this.ss.insertSheet(def.name);
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    const header = sheet.getLastRow() >= 1 ? (sheet.getRange(1, 1, 1, lastCol).getValues()[0] as string[]).map(String).filter(Boolean) : [];
    const missing = def.columns.filter((c) => !header.includes(c));
    if (missing.length) {
      sheet.getRange(1, header.length + 1, 1, missing.length).setValues([missing]);
      sheet.getRange(1, 1, 1, header.length + missing.length).setFontWeight('bold').setBackground('#E8F1E9');
      sheet.setFrozenRows(1);
    }
    return sheet;
  }

  private load(table: TableName): Loaded {
    const hit = this.cache.get(table);
    if (hit) return hit;
    const def = TABLES[table];
    const sheet = this.ensureSheet(table);
    const values = sheet.getDataRange().getValues();
    const header = (values[0] ?? []).map(String);
    const rows = values.slice(1).filter((r) => r.some((c) => c !== '' && c !== null)).map((r) => {
      const row: Row = {};
      header.forEach((h, i) => { if (def.columns.includes(h)) row[h] = fromCell(def, h, r[i]); });
      return row;
    });
    const loaded = { sheet, header, rows };
    this.cache.set(table, loaded);
    return loaded;
  }

  all(table: TableName): Row[] { return JSON.parse(JSON.stringify(this.load(table).rows)); }

  upsert(table: TableName, row: Row): void {
    const L = this.load(table);
    const def = TABLES[table];
    const k = keyOf(table, row);
    const idx = L.rows.findIndex((r) => keyOf(table, r) === k);
    const full: Row = {};
    def.columns.forEach((c) => { full[c] = row[c] ?? null; });
    this.writeRow(L, def, idx >= 0 ? idx + 2 : L.rows.length + 2, full);
    if (idx >= 0) L.rows[idx] = full; else L.rows.push(full);
  }

  append(table: TableName, row: Row): void {
    const L = this.load(table);
    const def = TABLES[table];
    this.writeRow(L, def, L.rows.length + 2, row);
    L.rows.push(row);
  }

  remove(table: TableName, key: Row): void {
    const L = this.load(table);
    const k = keyOf(table, key);
    const idx = L.rows.findIndex((r) => keyOf(table, r) === k);
    if (idx < 0) return;
    L.sheet.deleteRow(idx + 2);
    L.rows.splice(idx, 1);
  }

  private writeRow(L: Loaded, def: TableDef, rowNo: number, row: Row) {
    const cells = L.header.map((h) => (def.columns.includes(h) ? toCell(def, h, row[h]) : ''));
    const formats = L.header.map((h) => (def.num?.includes(h) ? '0.##' : '@'));
    const range = L.sheet.getRange(rowNo, 1, 1, L.header.length);
    range.setNumberFormats([formats]);
    range.setValues([cells]);
  }

  withLock<T>(fn: () => T): T {
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(25000)) throw new ApiError('BUSY', 'ระบบกำลังบันทึกข้อมูลจากผู้ใช้อื่น กรุณาลองใหม่อีกครั้ง');
    try {
      this.cache.clear(); // อ่านข้อมูลล่าสุดหลังได้ล็อก
      const r = fn();
      SpreadsheetApp.flush();
      return r;
    } finally {
      lock.releaseLock();
    }
  }

  getRev(): number { return Number(PropertiesService.getScriptProperties().getProperty('REV') ?? '0'); }
  bumpRev(): number {
    const props = PropertiesService.getScriptProperties();
    const next = Number(props.getProperty('REV') ?? '0') + 1;
    props.setProperty('REV', String(next));
    return next;
  }
}

function toCell(def: TableDef, col: string, v: unknown): unknown {
  if (def.json?.includes(col)) return v === null || v === undefined ? '' : JSON.stringify(v);
  if (def.bool?.includes(col)) return v ? 'TRUE' : 'FALSE';
  if (v === null || v === undefined) return '';
  if (def.num?.includes(col)) return Number(v);
  return String(v);
}
function fromCell(def: TableDef, col: string, v: unknown): unknown {
  if (v instanceof Date) return v.toISOString();
  if (def.json?.includes(col)) { if (v === '' || v === null) return null; try { return JSON.parse(String(v)); } catch (_e) { return null; } }
  if (def.bool?.includes(col)) return v === true || String(v).toUpperCase() === 'TRUE';
  if (v === '' || v === null || v === undefined) return null;
  if (def.num?.includes(col)) { const n = Number(v); return Number.isFinite(n) ? n : null; }
  return String(v);
}
