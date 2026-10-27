// รูปแบบวันที่/เวลา/ตัวเลขแบบไทย (พ.ศ., เขตเวลา Asia/Bangkok)
const TZ = 'Asia/Bangkok';
export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat('th-TH', { timeZone: TZ, day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) + ' น.' : '–';
export const fmtTime = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat('th-TH', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(iso)) : '–';
export const fmtNum = (n: number | null | undefined, digits = 0) =>
  n === null || n === undefined ? '–' : n.toLocaleString('th-TH', { minimumFractionDigits: digits, maximumFractionDigits: Math.max(digits, 2) });
export const fmtBaht = (n: number) => `${n.toLocaleString('th-TH')} บาท`;
export const ago = (iso: string | null | undefined, now = Date.now()) => {
  if (!iso) return '';
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s} วินาทีที่แล้ว`;
  if (s < 3600) return `${Math.floor(s / 60)} นาทีที่แล้ว`;
  return `${Math.floor(s / 3600)} ชั่วโมงที่แล้ว`;
};
export const PLACE_LABEL: Record<number, string> = { 1: 'ชนะเลิศ', 2: 'รองชนะเลิศอันดับ 1', 3: 'รองชนะเลิศอันดับ 2', 4: 'อันดับ 4' };
