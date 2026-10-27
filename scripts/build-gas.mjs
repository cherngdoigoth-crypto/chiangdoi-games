// รวมโค้ด API (TypeScript) เป็นไฟล์เดียวสำหรับ Google Apps Script
import { build } from 'esbuild';
import { copyFileSync, existsSync } from 'node:fs';

await build({
  entryPoints: ['server/src/gas/main.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'API',
  target: 'es2019',
  outfile: 'server/dist/Code.js',
  charset: 'utf8',
  legalComments: 'none',
  // Apps Script ต้องเห็นฟังก์ชันระดับบนสุดเพื่อใช้เป็น Web App / รันจาก editor / trigger
  footer: { js: [
    'function doGet(e) { return API.doGet(e); }',
    'function doPost(e) { return API.doPost(e); }',
    'function setup() { return API.setup(); }',
    'function backupNow() { return API.backupNow(); }',
    'function installBackupTrigger() { return API.installBackupTrigger(); }',
  ].join('\n') },
});
if (existsSync('server/.clasp.json') && !existsSync('server/dist/.clasp.json')) copyFileSync('server/.clasp.json', 'server/dist/.clasp.json');
console.log('✔ server/dist/Code.js พร้อมสำหรับ clasp push หรือคัดลอกไปวางใน Apps Script editor');
