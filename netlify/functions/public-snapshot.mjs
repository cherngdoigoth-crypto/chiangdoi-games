// Netlify Function: พร็อกซีข้อมูลสาธารณะผ่าน CDN ของ Netlify (แคช 4 วินาที)
// ช่วยให้ผู้ชมจำนวนมากไม่ต้องเรียก Apps Script โดยตรง (Apps Script จำกัดจำนวนการทำงานพร้อมกัน)
// ส่งต่อเฉพาะ action=public.snapshot ซึ่งมีแต่ข้อมูลที่ประกาศแล้ว
export default async () => {
  const base = process.env.APPS_SCRIPT_URL || process.env.VITE_API_URL;
  if (!base) return Response.json({ ok: false, code: 'NO_CONFIG', error: 'ยังไม่ได้ตั้งค่า APPS_SCRIPT_URL' }, { status: 500 });
  try {
    const r = await fetch(`${base}?action=public.snapshot`, { redirect: 'follow' });
    const body = await r.text();
    return new Response(body, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=0, must-revalidate',
        'netlify-cdn-cache-control': 'public, s-maxage=4, stale-while-revalidate=20',
      },
    });
  } catch {
    return Response.json({ ok: false, code: 'NETWORK', error: 'เชื่อมต่อ Apps Script ไม่ได้' }, { status: 502 });
  }
};
export const config = { path: '/api/public-snapshot' };
