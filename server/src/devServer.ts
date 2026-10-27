// เซิร์ฟเวอร์จำลอง Apps Script สำหรับพัฒนาในเครื่องเท่านั้น (ใช้ตรรกะ API ชุดเดียวกัน เก็บข้อมูลในไฟล์ .dev-data.json)
// ห้ามใช้ในการแข่งขันจริง — ระบบจริงใช้ Google Apps Script + Google Sheets
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { handle, seedAll, type Ctx } from './api';
import { MemoryStore } from './store';

const FILE = process.env.DEV_DATA ?? '.dev-data.json';
const PORT = Number(process.env.PORT ?? 8787);
const store = new MemoryStore();
const ctx: Ctx = {
  store,
  crypto: { sha256Hex: (s) => createHash('sha256').update(s, 'utf8').digest('hex'), randomToken: () => randomBytes(32).toString('hex'), now: () => new Date() },
};
if (existsSync(FILE)) store.load(JSON.parse(readFileSync(FILE, 'utf8')));
else {
  seedAll(ctx, { username: 'admin', password: 'Admin1234', displayName: 'ผู้ดูแลระบบ (dev)' });
  console.log('สร้างข้อมูลตั้งต้นแล้ว — เข้าสู่ระบบด้วย admin / Admin1234 (ต้องเปลี่ยนรหัสครั้งแรก)');
}
const save = () => writeFileSync(FILE, JSON.stringify(store.dump()));

createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  const url = new URL(req.url ?? '/', 'http://x');
  const send = (o: unknown) => { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(o)); };
  if (req.method === 'GET') {
    const since = url.searchParams.get('since');
    send(handle({ action: url.searchParams.get('action') ?? 'public.snapshot', payload: { since: since === null ? undefined : Number(since) } }, ctx));
    return;
  }
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    try {
      const r = JSON.parse(body);
      const before = store.getRev();
      const out = handle({ action: String(r.action ?? ''), token: r.token ?? null, payload: r.payload ?? {} }, ctx);
      if (store.getRev() !== before || String(r.action).startsWith('auth.')) save();
      send(out);
    } catch { send({ ok: false, code: 'BAD_REQUEST', error: 'รูปแบบคำขอไม่ถูกต้อง' }); }
  });
}).listen(PORT, () => console.log(`Dev API: http://localhost:${PORT}  (ตั้ง VITE_API_URL=http://localhost:${PORT})`));
