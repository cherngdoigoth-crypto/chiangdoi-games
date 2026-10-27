// เรียก Google Apps Script Web App
// ส่งเป็น text/plain เพื่อเลี่ยง CORS preflight (Apps Script ไม่รองรับ OPTIONS)
export const API_URL: string = import.meta.env.VITE_API_URL ?? '';
export const POLL_STAFF_MS = Math.max(3000, Number(import.meta.env.VITE_POLL_STAFF_MS ?? 4000));
export const POLL_PUBLIC_MS = Math.max(3000, Number(import.meta.env.VITE_POLL_PUBLIC_MS ?? 8000));

export class ApiFailure extends Error {
  constructor(public code: string, message: string, public extra?: unknown) { super(message); }
}

export async function api<T = unknown>(action: string, payload: Record<string, unknown> = {}, token?: string | null, timeoutMs = 30000): Promise<T> {
  if (!API_URL) throw new ApiFailure('NO_CONFIG', 'ยังไม่ได้ตั้งค่า VITE_API_URL (ดู README)');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token: token ?? null, payload }),
      redirect: 'follow',
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new ApiFailure('NETWORK', (e as Error).name === 'AbortError' ? 'เซิร์ฟเวอร์ตอบช้าเกินไป กรุณาลองใหม่' : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ต');
  } finally {
    clearTimeout(timer);
  }
  let body: { ok: boolean; data?: T; error?: string; code?: string; extra?: unknown };
  try { body = await res.json(); } catch { throw new ApiFailure('BAD_RESPONSE', `เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (HTTP ${res.status})`); }
  if (!body.ok) throw new ApiFailure(body.code ?? 'ERROR', body.error ?? 'เกิดข้อผิดพลาด', body.extra);
  return body.data as T;
}

export const errorMessage = (e: unknown) => (e instanceof ApiFailure || e instanceof Error ? e.message : String(e));
