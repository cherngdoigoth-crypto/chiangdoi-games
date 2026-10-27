// ข้อมูลสด: ดึงจาก Apps Script เป็นระยะ ใช้เลข revision เพื่อดาวน์โหลดเฉพาะเมื่อมีการเปลี่ยนแปลง
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api, ApiFailure, errorMessage, POLL_PUBLIC_MS, POLL_STAFF_MS } from '../lib/api';
import type { PublicSnapshot, StaffSnapshot } from '../lib/types';
import { useAuth } from './auth';

export type ConnState = 'connecting' | 'live' | 'reconnecting' | 'offline' | 'error';
export interface Live<T> { data: T | null; state: ConnState; lastSync: number | null; error: string | null; refresh: () => Promise<void>; }

type Fetcher<T> = (since: number | undefined) => Promise<T | { rev: number; unchanged: true }>;

function usePolling<T extends { rev: number }>(fetcher: Fetcher<T>, interval: number, enabled: boolean, keepWhenHidden: boolean, onFatal?: (e: ApiFailure) => void): Live<T> {
  const [data, setData] = useState<T | null>(null);
  const [state, setState] = useState<ConnState>('connecting');
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const revRef = useRef<number | undefined>(undefined);
  const timer = useRef<number | undefined>(undefined);
  const failures = useRef(0);
  const running = useRef(false);
  const fetchRef = useRef(fetcher); fetchRef.current = fetcher;
  const fatalRef = useRef(onFatal); fatalRef.current = onFatal;

  const tick = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    window.clearTimeout(timer.current);
    try {
      const r = await fetchRef.current(revRef.current);
      if (!('unchanged' in r)) { setData(r as T); revRef.current = r.rev; }
      failures.current = 0;
      setState('live'); setError(null); setLastSync(Date.now());
    } catch (e) {
      failures.current++;
      if (e instanceof ApiFailure && ['UNAUTHENTICATED', 'MUST_CHANGE_PASSWORD', 'NO_CONFIG'].includes(e.code)) {
        setState('error'); setError(e.message); fatalRef.current?.(e); running.current = false; return;
      }
      setError(errorMessage(e));
      setState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'reconnecting');
    } finally {
      running.current = false;
    }
    const delay = failures.current ? Math.min(30000, interval * 2 ** Math.min(failures.current, 3)) : interval;
    if (keepWhenHidden || document.visibilityState === 'visible') timer.current = window.setTimeout(tick, delay);
  }, [interval, keepWhenHidden]);

  useEffect(() => {
    if (!enabled) return;
    revRef.current = undefined;
    tick();
    const onVis = () => { if (document.visibilityState === 'visible') tick(); };
    const onOnline = () => tick();
    const onOffline = () => setState('offline');
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.clearTimeout(timer.current);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [enabled, tick]);

  const refresh = useCallback(async () => { await tick(); }, [tick]);
  return { data, state, lastSync, error, refresh };
}

// เมื่อ deploy บน Netlify ให้ผู้ชมดึงข้อมูลสาธารณะผ่าน Netlify Function ที่แคชบน CDN (ตั้ง VITE_PUBLIC_PROXY=true)
const PUBLIC_PROXY = import.meta.env.VITE_PUBLIC_PROXY === 'true';
async function proxySnapshot(): Promise<PublicSnapshot> {
  let res: Response;
  try { res = await fetch('/api/public-snapshot', { cache: 'no-store' }); } catch { throw new ApiFailure('NETWORK', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); }
  const body = await res.json().catch(() => null);
  if (!body?.ok) throw new ApiFailure(body?.code ?? 'ERROR', body?.error ?? 'โหลดข้อมูลไม่สำเร็จ');
  return body.data as PublicSnapshot;
}

const PublicCtx = createContext<Live<PublicSnapshot> | null>(null);
export function PublicDataProvider({ children, keepWhenHidden = false, interval = POLL_PUBLIC_MS }: { children: ReactNode; keepWhenHidden?: boolean; interval?: number }) {
  const live = usePolling<PublicSnapshot>((since) => (PUBLIC_PROXY ? proxySnapshot() : api('public.snapshot', { since })), interval, true, keepWhenHidden);
  return <PublicCtx.Provider value={live}>{children}</PublicCtx.Provider>;
}
export const usePublic = () => { const c = useContext(PublicCtx); if (!c) throw new Error('PublicDataProvider missing'); return c; };

const StaffCtx = createContext<Live<StaffSnapshot> | null>(null);
export function StaffDataProvider({ children }: { children: ReactNode }) {
  const { token, handleAuthError } = useAuth();
  const live = usePolling<StaffSnapshot>((since) => api('staff.snapshot', { since }, token), POLL_STAFF_MS, !!token, false, handleAuthError);
  return <StaffCtx.Provider value={live}>{children}</StaffCtx.Provider>;
}
export const useStaff = () => { const c = useContext(StaffCtx); if (!c) throw new Error('StaffDataProvider missing'); return c; };
