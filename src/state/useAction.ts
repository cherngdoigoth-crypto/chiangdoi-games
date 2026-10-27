import { useCallback, useState } from 'react';
import { ApiFailure, errorMessage } from '../lib/api';
import { useAuth } from './auth';
import { useStaff } from './live';
import { useUI } from './ui';

/** เรียกคำสั่งที่เปลี่ยนข้อมูล: แจ้งสำเร็จหลังเซิร์ฟเวอร์ยืนยันเท่านั้น แล้วดึงข้อมูลใหม่ทันที */
export function useAction() {
  const { call } = useAuth();
  const { refresh } = useStaff();
  const { toast } = useUI();
  const [busy, setBusy] = useState<string | null>(null);
  const run = useCallback(async <T = unknown>(action: string, payload: Record<string, unknown>, success?: string, opts: { silent?: boolean; key?: string } = {}): Promise<T | null> => {
    setBusy(opts.key ?? action);
    try {
      const r = await call<T>(action, payload);
      if (success) toast(success, 'success');
      refresh();
      return r;
    } catch (e) {
      if (!opts.silent) toast(e instanceof ApiFailure && e.code === 'CONFLICT' ? 'ข้อมูลถูกแก้ไขจากอุปกรณ์อื่น ระบบโหลดข้อมูลล่าสุดให้แล้ว กรุณาตรวจสอบและบันทึกอีกครั้ง' : errorMessage(e), 'error');
      refresh();
      throw e;
    } finally {
      setBusy(null);
    }
  }, [call, refresh, toast]);
  return { run, busy };
}
