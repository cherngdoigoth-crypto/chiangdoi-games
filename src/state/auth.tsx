import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PublicUser } from '@domain';
import { api, ApiFailure } from '../lib/api';

interface AuthState {
  token: string | null;
  user: PublicUser | null;
  checking: boolean;
  login: (username: string, password: string) => Promise<PublicUser>;
  logout: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  handleAuthError: (e: ApiFailure) => void;
  /** เรียก API ในนามผู้ใช้ปัจจุบัน */
  call: <T = unknown>(action: string, payload?: Record<string, unknown>) => Promise<T>;
}
const Ctx = createContext<AuthState | null>(null);
// เก็บเฉพาะ token ของ session ในแท็บนี้ (ไม่ใช่ฐานข้อมูล) — ปิดเบราว์เซอร์แล้วต้องเข้าสู่ระบบใหม่
const KEY = 'cdg26.session';
const read = () => { try { return sessionStorage.getItem(KEY); } catch { return null; } };
const write = (t: string | null) => { try { if (t) sessionStorage.setItem(KEY, t); else sessionStorage.removeItem(KEY); } catch { /* ignore */ } };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(read);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [checking, setChecking] = useState(!!read());

  useEffect(() => {
    if (!token) { setChecking(false); return; }
    api<{ user: PublicUser }>('auth.me', {}, token)
      .then((r) => setUser(r.user))
      .catch((e) => { if (e instanceof ApiFailure && e.code === 'UNAUTHENTICATED') { write(null); setToken(null); } })
      .finally(() => setChecking(false));
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    const r = await api<{ token: string; user: PublicUser }>('auth.login', { username, password });
    write(r.token); setToken(r.token); setUser(r.user);
    return r.user;
  }, []);
  const logout = useCallback(async () => {
    const t = token; write(null); setToken(null); setUser(null);
    if (t) await api('auth.logout', {}, t).catch(() => undefined);
  }, [token]);
  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    const r = await api<{ user: PublicUser }>('auth.changePassword', { oldPassword, newPassword }, token);
    setUser(r.user);
  }, [token]);
  const handleAuthError = useCallback((e: ApiFailure) => {
    if (e.code === 'UNAUTHENTICATED') { write(null); setToken(null); setUser(null); }
    if (e.code === 'MUST_CHANGE_PASSWORD') setUser((u) => (u ? { ...u, mustChangePassword: true } : u));
  }, []);
  const call = useCallback(async <T,>(action: string, payload: Record<string, unknown> = {}) => {
    try { return await api<T>(action, payload, token); } catch (e) { if (e instanceof ApiFailure) handleAuthError(e); throw e; }
  }, [token, handleAuthError]);

  const value = useMemo(() => ({ token, user, checking, login, logout, changePassword, handleAuthError, call }), [token, user, checking, login, logout, changePassword, handleAuthError, call]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error('AuthProvider missing'); return c; };
