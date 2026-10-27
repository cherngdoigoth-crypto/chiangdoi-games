// การแจ้งเตือน (toast) และกล่องยืนยัน (confirm dialog)
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Tone = 'success' | 'error' | 'info';
interface Toast { id: number; tone: Tone; text: string; }
interface ConfirmOpts { title: string; body?: ReactNode; confirmLabel?: string; tone?: 'primary' | 'danger'; reason?: 'required' | 'optional'; reasonLabel?: string; }
interface UI {
  toast: (text: string, tone?: Tone) => void;
  confirm: (o: ConfirmOpts) => Promise<{ ok: boolean; reason: string }>;
}
const Ctx = createContext<UI | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dlg, setDlg] = useState<(ConfirmOpts & { resolve: (r: { ok: boolean; reason: string }) => void }) | null>(null);
  const [reason, setReason] = useState('');
  const seq = useRef(0);

  const toast = useCallback((text: string, tone: Tone = 'info') => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 7000 : 3500);
  }, []);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<{ ok: boolean; reason: string }>((resolve) => { setReason(''); setDlg({ ...o, resolve }); }), []);
  const close = (ok: boolean) => { dlg?.resolve({ ok, reason: reason.trim() }); setDlg(null); };
  const needReason = dlg?.reason === 'required' && !reason.trim();

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none no-print" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${t.tone === 'success' ? 'bg-field text-white' : t.tone === 'error' ? 'bg-danger text-white' : 'bg-ink text-white'}`}>{t.text}</div>
        ))}
      </div>
      {dlg && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 p-4 no-print" role="dialog" aria-modal="true" aria-labelledby="dlg-title" onKeyDown={(e) => e.key === 'Escape' && close(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 id="dlg-title" className="font-display text-lg font-bold">{dlg.title}</h2>
            {dlg.body && <div className="mt-2 text-sm text-muted">{dlg.body}</div>}
            {dlg.reason && (
              <label className="mt-4 block text-sm font-medium">
                {dlg.reasonLabel ?? 'เหตุผล'}{dlg.reason === 'required' && <span className="text-danger"> *</span>}
                <textarea id="dlg-reason" autoFocus value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="input mt-1" />
              </label>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn" onClick={() => close(false)}>ยกเลิก</button>
              <button className={`btn ${dlg.tone === 'danger' ? 'btn-danger' : 'btn-primary'}`} disabled={needReason} onClick={() => close(true)}>{dlg.confirmLabel ?? 'ยืนยัน'}</button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
export const useUI = () => { const c = useContext(Ctx); if (!c) throw new Error('UIProvider missing'); return c; };
