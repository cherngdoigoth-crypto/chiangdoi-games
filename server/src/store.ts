import { TABLES, type Row, type TableName } from './schema';

/** ที่เก็บข้อมูล — ใช้ Google Sheets ในระบบจริง และหน่วยความจำในการทดสอบ */
export interface Store {
  all(table: TableName): Row[];
  upsert(table: TableName, row: Row): void;
  remove(table: TableName, key: Row): void;
  append(table: TableName, row: Row): void;
  /** ทำงานภายใต้ล็อกเดียวกันทั้งระบบ (LockService) เพื่อกันการเขียนชนกัน */
  withLock<T>(fn: () => T): T;
  getRev(): number;
  bumpRev(): number;
}

export interface Crypto {
  sha256Hex(s: string): string;
  randomToken(): string;
  now(): Date;
}

export const keyOf = (table: TableName, row: Row) => TABLES[table].key.map((k) => String(row[k] ?? '')).join('\u0001');

export function findRow(store: Store, table: TableName, key: Row): Row | null {
  const k = keyOf(table, key);
  return store.all(table).find((r) => keyOf(table, r) === k) ?? null;
}

const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

/** Store ในหน่วยความจำ สำหรับ unit/integration tests และพัฒนาแบบออฟไลน์ */
export class MemoryStore implements Store {
  private data = new Map<TableName, Row[]>();
  private rev = 0;
  private locked = false;
  all(table: TableName): Row[] { return clone(this.data.get(table) ?? []); }
  upsert(table: TableName, row: Row): void {
    const rows = this.data.get(table) ?? [];
    const k = keyOf(table, row);
    const i = rows.findIndex((r) => keyOf(table, r) === k);
    const full: Row = {};
    TABLES[table].columns.forEach((c) => { full[c] = row[c] ?? null; });
    if (i >= 0) rows[i] = clone(full); else rows.push(clone(full));
    this.data.set(table, rows);
  }
  remove(table: TableName, key: Row): void {
    const k = keyOf(table, key);
    this.data.set(table, (this.data.get(table) ?? []).filter((r) => keyOf(table, r) !== k));
  }
  append(table: TableName, row: Row): void { this.upsert(table, row); }
  withLock<T>(fn: () => T): T {
    if (this.locked) throw new Error('nested lock');
    this.locked = true;
    try { return fn(); } finally { this.locked = false; }
  }
  getRev(): number { return this.rev; }
  bumpRev(): number { return ++this.rev; }
  dump(): { rev: number; tables: Record<string, Row[]> } { return { rev: this.rev, tables: Object.fromEntries(this.data) }; }
  load(d: { rev: number; tables: Record<string, Row[]> }) { this.rev = d.rev; this.data = new Map(Object.entries(d.tables) as [TableName, Row[]][]); }
}
